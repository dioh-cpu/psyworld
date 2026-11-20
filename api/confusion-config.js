// Configuração pública para o cliente: só URL e chave pública (nunca a chave de serviço).
export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  const url = process.env.SUPABASE_URL || null;
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || null;
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ configured: !!(url && anonKey), supabaseUrl: url, supabaseAnonKey: anonKey });
}
