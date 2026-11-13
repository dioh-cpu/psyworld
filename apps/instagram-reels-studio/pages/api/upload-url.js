import crypto from 'node:crypto';
import { send, supabaseServiceHeaders } from '../../lib/server.js';

const MAX_VIDEO_BYTES = 1024 * 1024 * 1024;

export function resolveSignedUploadUrl(projectUrl, responseUrl, responseToken) {
  const project = new URL(projectUrl);
  if (project.protocol !== 'https:') throw new Error('Supabase URL must use HTTPS');

  const candidate = new URL(responseUrl, project.origin);
  if (candidate.origin !== project.origin) {
    throw new Error('Supabase returned a signed URL for an unexpected origin');
  }

  if (!candidate.pathname.startsWith('/storage/v1/')) {
    candidate.pathname = `/storage/v1${candidate.pathname.startsWith('/') ? '' : '/'}${candidate.pathname}`;
  }
  if (!candidate.pathname.startsWith('/storage/v1/object/upload/sign/')) {
    throw new Error('Supabase returned an unexpected signed upload route');
  }

  if (!candidate.searchParams.has('token') && responseToken) {
    candidate.searchParams.set('token', responseToken);
  }
  if (!candidate.searchParams.get('token')) {
    throw new Error('Supabase did not return a signed upload token');
  }

  return candidate.toString();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  const { filename, contentType, size } = req.body || {};
  if (contentType !== 'video/mp4' || !Number.isSafeInteger(size) || size < 12 || size > MAX_VIDEO_BYTES) {
    return send(res, 400, { error: 'MP4 inválido ou excede 1 GB' });
  }
  const projectUrl = process.env.SUPABASE_URL;
  if (!projectUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return send(res, 503, { error: 'Storage persistente não configurado' });
  }

  const id = crypto.randomUUID();
  const safeFilename = (filename || 'video.mp4').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100);
  const objectName = `${id}-${safeFilename}`;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'reels-private';
  const endpoint = new URL(
    `/storage/v1/object/upload/sign/${encodeURIComponent(bucket)}/${encodeURIComponent(objectName)}`,
    projectUrl,
  );

  let response;
  let data;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: supabaseServiceHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({}),
      cache: 'no-store',
    });
    data = await response.json();
  } catch {
    return send(res, 502, { error: 'Não foi possível reservar upload seguro' });
  }
  if (!response.ok || typeof data.url !== 'string') {
    return send(res, 502, { error: 'Não foi possível reservar upload seguro' });
  }

  let signedUrl;
  try {
    signedUrl = resolveSignedUploadUrl(projectUrl, data.url, data.token);
  } catch {
    return send(res, 502, { error: 'O Storage não retornou uma URL assinada válida' });
  }
  return send(res, 200, { path: objectName, signedUrl, expiresInSeconds: 7200 });
}
