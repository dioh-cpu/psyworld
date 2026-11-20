// Validação e limpeza do save de Confusion Waves (sem dependências, testável).
export const GAME_ID = 'confusion-waves';
export const MAX_SAVE_BYTES = 512 * 1024;
const BLOCKED_KEYS = new Set(['password', 'access_token', 'refresh_token', 'supabaseKey', 'supabaseAnonKey']);

export function sanitize(value, depth = 0) {
  if (depth > 12) return null;
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.slice(0, 2000);
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (Array.isArray(value)) return value.slice(0, 2000).map((v) => sanitize(v, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value).slice(0, 500)) {
      const key = String(k).slice(0, 120);
      if (BLOCKED_KEYS.has(key)) continue;
      out[key] = sanitize(v, depth + 1);
    }
    return out;
  }
  return null;
}

// Retorna { ok, error, save }. Não aceita save de outro jogo nem save grande demais.
export function validateSave(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, error: 'save_required' };
  const size = Buffer.byteLength(JSON.stringify(input));
  if (size > MAX_SAVE_BYTES) return { ok: false, error: 'save_too_large' };
  const save = sanitize(input);
  if (save.game !== GAME_ID) return { ok: false, error: 'wrong_game' };
  return { ok: true, save };
}
