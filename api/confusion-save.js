// Save na nuvem do Confusion Waves. Usa a mesma autenticação do Supabase do projeto.
import { requireUser, jsonError, method } from './_lib/supabase.js';
import { validateSave } from './_lib/confusion-save-lib.js';

export default async function handler(req, res) {
  try {
    if (!method(req, res, ['GET', 'PUT'])) return;
    const { user, supabase } = await requireUser(req);

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('confusion_saves').select('save,version,updated_at').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      return res.status(200).json({ save: data?.save ?? null, version: data?.version ?? 0, updatedAt: data?.updated_at ?? null });
    }

    const body = req.body ?? {};
    const checked = validateSave(body.save);
    if (!checked.ok) return res.status(checked.error === 'save_too_large' ? 413 : 400).json({ error: checked.error });

    const baseVersion = Number.isSafeInteger(body.baseVersion) ? body.baseVersion : 0;
    const { data: current, error: readError } = await supabase
      .from('confusion_saves').select('version').eq('user_id', user.id).maybeSingle();
    if (readError) throw readError;
    const currentVersion = current?.version ?? 0;
    // Versão diferente: outro aparelho salvou antes. Não sobrescreve.
    if (currentVersion !== baseVersion) return res.status(409).json({ error: 'version_conflict', version: currentVersion });

    const next = currentVersion + 1;
    const { error } = await supabase.from('confusion_saves').upsert(
      { user_id: user.id, save: checked.save, version: next, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    if (error) throw error;
    return res.status(200).json({ version: next });
  } catch (e) {
    return jsonError(res, e);
  }
}
