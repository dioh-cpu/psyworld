export default function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'method_not_allowed' }); }
  const ready = !!process.env.GEMINI_API_KEY;
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    chat_available: ready,
    google_search: ready,
    provider: ready ? 'Google Gemini' : null,
    model: ready ? (process.env.GEMINI_MODEL || 'gemini-3.8-flash') : null,
  });
}
