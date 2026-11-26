// Conta e save na nuvem (Supabase do projeto, via endpoints do próprio jogo).
// Nenhuma chave de serviço chega ao navegador: só URL e chave pública.
const SDK = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/+esm';
let client = null;
let session = null;
let enabled = false;
let listeners = [];

export const isEnabled = () => enabled;
export const email = () => session?.user?.email || null;
export const onChange = (fn) => { listeners.push(fn); };
const emit = (event) => listeners.forEach((fn) => fn(event));

export async function init() {
  try {
    const cfg = await (await fetch('/api/confusion-config', { cache: 'no-store' })).json();
    if (!cfg.configured) return false;
    const { createClient } = await import(SDK);
    client = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    const { data } = await client.auth.getSession();
    session = data.session;
    client.auth.onAuthStateChange((event, s) => {
      session = s;
      emit(event);
    });
    enabled = true;
    return true;
  } catch (_) {
    enabled = false;
    return false;
  }
}

export async function signUp(addr, password) {
  const { error } = await client.auth.signUp({ email: addr, password });
  if (error) throw error;
}
export async function signIn(addr, password) {
  const { error } = await client.auth.signInWithPassword({ email: addr, password });
  if (error) throw error;
}
export async function signOut() {
  await client.auth.signOut();
  session = null;
}
export async function resetPassword(addr) {
  const { error } = await client.auth.resetPasswordForEmail(addr, { redirectTo: location.href.split('#')[0] });
  if (error) throw error;
}
export async function setNewPassword(password) {
  const { error } = await client.auth.updateUser({ password });
  if (error) throw error;
}

async function call(path, options = {}) {
  if (!session) throw new Error('not_logged_in');
  const res = await fetch(path, {
    ...options,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${session.access_token}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `http_${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}
export const pull = () => call('/api/confusion-save');
export const push = (save, baseVersion) =>
  call('/api/confusion-save', { method: 'PUT', body: JSON.stringify({ save, baseVersion }) });
