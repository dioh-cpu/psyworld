// Upload e moderação de foto da galeria para o perfil do Domador (Supabase Storage).
// Enquanto a foto não for aprovada pela moderação de nudez/conteúdo impróprio, o perfil mantém o retrato padrão.
import { requireUser, jsonError, method } from './_lib/supabase.js';

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const MIME_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const BUCKET = process.env.SUPABASE_PERFIL_BUCKET || 'perfil-fotos';

function validarAssinatura(buf, mime) {
  if (!buf || buf.length < 12) return false;
  if (mime === 'image/png') return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  if (mime === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mime === 'image/webp') {
    return buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  return false;
}

async function moderarImagem(buf, mime) {
  const endpoint = process.env.MODERATION_API_URL;
  if (!endpoint) {
    // Sem provedor automático configurado: entra em fila de moderação (nunca exibe sem aprovação)
    return { status: 'pendente', motivo: 'Foto enviada para moderação. Enquanto aguarda aprovação, o retrato padrão permanece ativo.' };
  }
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.MODERATION_API_KEY) headers.Authorization = `Bearer ${process.env.MODERATION_API_KEY}`;
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ mime, imageBase64: buf.toString('base64') }),
  });
  if (!resp.ok) {
    return { status: 'pendente', motivo: 'Moderação temporariamente indisponível; foto mantida em análise.' };
  }
  const data = await resp.json().catch(() => ({}));
  if (data.blocked || data.nsfw || data.nudity || data.inappropriate || data.approved === false) {
    return { status: 'reprovada', motivo: data.reason || 'Imagem reprovada pela moderação de nudez ou conteúdo impróprio.' };
  }
  if (data.approved === true) return { status: 'aprovada', motivo: 'Foto aprovada pela moderação.' };
  return { status: 'pendente', motivo: 'Foto enviada para moderação.' };
}

export default async function handler(req, res) {
  try {
    if (!method(req, res, ['POST', 'DELETE'])) return;
    const { user, supabase } = await requireUser(req);

    if (req.method === 'DELETE') {
      const caminhos = ['jpg', 'png', 'webp'].flatMap((ext) => [
        `aprovadas/${user.id}/avatar.${ext}`,
        `pendentes/${user.id}/avatar.${ext}`,
      ]);
      await supabase.storage.from(BUCKET).remove(caminhos).catch(() => {});
      return res.status(200).json({ ok: true, status: 'removida' });
    }

    const body = req.body ?? {};
    const dataUrl = String(body.dataUrl || '');
    const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!m) {
      return res.status(400).json({ ok: false, error: 'formato_invalido', motivo: 'Envie uma imagem JPG, PNG ou WEBP.' });
    }
    const mime = m[1];
    const ext = MIME_EXT[mime];
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > MAX_BYTES) {
      return res.status(413).json({ ok: false, error: 'arquivo_grande', motivo: 'A imagem deve ter no máximo 2 MB.' });
    }
    if (!validarAssinatura(buf, mime)) {
      return res.status(400).json({ ok: false, error: 'formato_invalido', motivo: 'Arquivo de imagem corrompido ou formato inválido.' });
    }

    const mod = await moderarImagem(buf, mime);
    if (mod.status === 'reprovada') {
      return res.status(422).json({ ok: false, status: 'reprovada', error: 'conteudo_improprio', motivo: mod.motivo });
    }

    const pasta = mod.status === 'aprovada' ? 'aprovadas' : 'pendentes';
    const path = `${pasta}/${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, buf, {
      contentType: mime,
      upsert: true,
    });
    if (upErr) throw upErr;

    const url = mod.status === 'aprovada'
      ? supabase.storage.from(BUCKET).getPublicUrl(path)?.data?.publicUrl || null
      : null;

    return res.status(200).json({ ok: true, status: mod.status, url, motivo: mod.motivo });
  } catch (e) {
    return jsonError(res, e);
  }
}
