import { createHash, timingSafeEqual } from 'node:crypto';

const MAP_FILES = {
  'pallet-centro-3q': 'centro',
  'pallet-jardins-3q': 'jardins',
  'pallet-lab-3q': 'lab',
  'pallet-costa-3q': 'costa',
  'pallet-colinas-3q': 'colinas',
  'pallet-arredores-3q': 'rota1',
};

const BLOCKED_BRANCHES = new Set(['master', 'production', 'prod']);
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_PNG_BYTES = 2 * 1024 * 1024;

function fail(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

function safePinEqual(a, b) {
  const ha = createHash('sha256').update(String(a || '')).digest();
  const hb = createHash('sha256').update(String(b || '')).digest();
  return timingSafeEqual(ha, hb);
}

function decodePngBase64(b64, label) {
  const clean = String(b64 || '').replace(/^data:image\/png;base64,/i, '').trim();
  if (!clean) fail(`missing_${label}`);
  const buf = Buffer.from(clean, 'base64');
  if (buf.length < 24 || buf.length > MAX_PNG_BYTES) fail(`invalid_size_${label}`);
  if (!buf.subarray(0, 8).equals(PNG_MAGIC)) fail(`invalid_png_${label}`);
  return buf.toString('base64');
}

async function ghFetch(token, path, options = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'psyworld-collision-editor',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data?.message || `github_http_${res.status}`;
    fail(`github_error: ${msg}`, res.status === 401 || res.status === 403 ? 502 : res.status);
  }
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  try {
    const token = process.env.GITHUB_TOKEN;
    const expectedPin = process.env.EDITOR_PIN;
    if (!token || !expectedPin) {
      fail('server_not_configured: configure GITHUB_TOKEN and EDITOR_PIN in Vercel', 503);
    }

    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    if (!safePinEqual(body.pin, expectedPin)) {
      fail('invalid_pin', 401);
    }

    const branch = String(body.branch || process.env.VERCEL_GIT_COMMIT_REF || 'feature/psyworld-collision-editor-v1').trim();
    if (!branch || BLOCKED_BRANCHES.has(branch.toLowerCase()) || !/^[a-zA-Z0-9._\/-]+$/.test(branch)) {
      fail(`branch_not_allowed: ${branch}`, 403);
    }

    const repoSlug = String(process.env.GITHUB_REPO || 'dioh-cpu/psyworld').trim();
    if (!/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(repoSlug)) {
      fail('invalid_repo_config', 500);
    }

    const entries = Array.isArray(body.files) ? body.files : [];
    if (!entries.length || entries.length > 6) {
      fail('invalid_files_count');
    }

    const prepared = [];
    for (const item of entries) {
      const mapId = String(item?.mapId || '').trim();
      const short = MAP_FILES[mapId];
      if (!short) fail(`unknown_map_id: ${mapId}`);
      const walkB64 = decodePngBase64(item.walkmaskBase64, `${mapId}_walkmask`);
      const sdfB64 = decodePngBase64(item.sdfBase64, `${mapId}_sdf`);
      const baseDir = 'assets/story/pallet/anime3q/walkmasks';
      prepared.push(
        { path: `${baseDir}/${short}_walkmask.png`, content: walkB64 },
        { path: `${baseDir}/${short}_sdf.png`, content: sdfB64 },
      );
    }

    const encodedBranch = branch.split('/').map(encodeURIComponent).join('/');
    const refData = await ghFetch(token, `/repos/${repoSlug}/git/ref/heads/${encodedBranch}`);
    const headSha = refData?.object?.sha;
    if (!headSha) fail('branch_head_not_found', 404);

    const headCommit = await ghFetch(token, `/repos/${repoSlug}/git/commits/${headSha}`);
    const baseTreeSha = headCommit?.tree?.sha;
    if (!baseTreeSha) fail('base_tree_not_found', 500);

    const treeEntries = await Promise.all(
      prepared.map(async (f) => {
        const blob = await ghFetch(token, `/repos/${repoSlug}/git/blobs`, {
          method: 'POST',
          body: JSON.stringify({ content: f.content, encoding: 'base64' }),
        });
        return {
          path: f.path,
          mode: '100644',
          type: 'blob',
          sha: blob.sha,
        };
      }),
    );

    const tree = await ghFetch(token, `/repos/${repoSlug}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeEntries }),
    });

    const mapIds = entries.map((e) => e.mapId).join(', ');
    const message = String(body.message || `chore(collisions): publish ${entries.length} map(s) from editor (${mapIds})`).slice(0, 200);
    const commit = await ghFetch(token, `/repos/${repoSlug}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        tree: tree.sha,
        parents: [headSha],
      }),
    });

    await ghFetch(token, `/repos/${repoSlug}/git/refs/heads/${encodedBranch}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: commit.sha }),
    });

    return res.status(200).json({
      ok: true,
      repo: repoSlug,
      branch,
      commit: commit.sha,
      url: commit.html_url || `https://github.com/${repoSlug}/commit/${commit.sha}`,
      filesCount: prepared.length,
    });
  } catch (error) {
    const status = error?.status || 500;
    return res.status(status).json({
      ok: false,
      error: error?.message || 'publish_failed',
    });
  }
}
