import test from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = 'https://studio-supabase.example';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_test-only';
process.env.SUPABASE_STORAGE_BUCKET = 'reels-private';

const { default: uploadUrlHandler } = await import('../pages/api/upload-url.js');
await import('../public/upload-utils.js');

function response() {
  return {
    headers: {},
    statusCode: 0,
    body: '',
    setHeader(key, value) { this.headers[key] = value; },
    end(value = '') { this.body = value; },
  };
}

test('signed upload URL is absolute to the Supabase Storage origin', async () => {
  const oldFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(input);
    calls.push({ url, init });
    return new Response(JSON.stringify({
      url: '/object/upload/sign/reels-private/object.mp4?token=short-lived-signature',
    }), { status: 200 });
  };

  try {
    const res = response();
    await uploadUrlHandler({
      method: 'POST',
      body: { filename: 'clip.mp4', contentType: 'video/mp4', size: 2_200_000 },
    }, res);

    assert.equal(res.statusCode, 200);
    const result = JSON.parse(res.body);
    const signed = new URL(result.signedUrl);
    assert.equal(signed.origin, process.env.SUPABASE_URL);
    assert.match(signed.pathname, /^\/storage\/v1\/object\/upload\/sign\/reels-private\//);
    assert.equal(signed.searchParams.get('token'), 'short-lived-signature');
    assert.match(result.path, /^[0-9a-f-]{36}-clip\.mp4$/);

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url.origin, process.env.SUPABASE_URL);
    assert.match(calls[0].url.pathname, /^\/storage\/v1\/object\/upload\/sign\/reels-private\//);
    assert.equal(calls[0].init.method, 'POST');
    assert.equal(calls[0].init.headers.apikey, 'sb_secret_test-only');
    assert.equal(calls[0].init.headers.Authorization, undefined);
    assert.equal(calls[0].init.headers['Content-Type'], 'application/json');
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test('browser upload uses signed token, PUT, MP4 content type, and no service key', async () => {
  const priorWindow = globalThis.window;
  globalThis.window = { location: { origin: 'https://studio.example' } };
  let call;
  const file = { type: 'video/mp4', size: 2048 };
  try {
    const signedUrl = 'https://studio-supabase.example/storage/v1/object/upload/sign/reels-private/clip.mp4?token=short-lived-signature';
    const result = await globalThis.ReelsStudioUpload.putSignedVideo(
      signedUrl,
      file,
      async (url, init) => {
        call = { url, init };
        return { ok: true, status: 200 };
      },
    );

    assert.equal(result.status, 200);
    assert.equal(call.url, signedUrl);
    assert.equal(call.init.method, 'PUT');
    assert.equal(call.init.headers['Content-Type'], 'video/mp4');
    assert.equal(call.init.headers['x-upsert'], 'false');
    assert.equal(call.init.body, file);
    assert.equal(call.init.headers.apikey, undefined);
    assert.equal(call.init.headers.Authorization, undefined);
  } finally {
    if (priorWindow === undefined) delete globalThis.window;
    else globalThis.window = priorWindow;
  }
});

test('browser helper rejects relative, unsigned, and same-origin URLs before network access', async () => {
  globalThis.window = { location: { origin: 'https://studio.example' } };
  let calls = 0;
  const fakeFetch = async () => { calls += 1; return { ok: true }; };
  try {
    await assert.rejects(
      globalThis.ReelsStudioUpload.putSignedVideo('/object/upload/sign/reels-private/x?token=t', { type: 'video/mp4' }, fakeFetch),
    );
    await assert.rejects(
      globalThis.ReelsStudioUpload.putSignedVideo('https://storage.example/object/upload/sign/reels-private/x', { type: 'video/mp4' }, fakeFetch),
    );
    await assert.rejects(
      globalThis.ReelsStudioUpload.putSignedVideo('https://studio.example/storage/v1/object/upload/sign/reels-private/x?token=t', { type: 'video/mp4' }, fakeFetch),
    );
    assert.equal(calls, 0);
  } finally {
    delete globalThis.window;
  }
});
