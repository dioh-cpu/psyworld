/* One-time PSY IDLE local-profile reset for the Halloween rework.
   Does not touch PSYWORLD account saves, Supabase, or other browser data. */
(function (W) {
  'use strict';
  const FLAG = 'psyworld-psy-idle-halloween-reset-v1';
  const PROFILE = 'psy_idle_character_v1';
  try {
    if (W.localStorage.getItem(FLAG) === 'done') return;
    W.localStorage.removeItem(PROFILE);
    W.localStorage.setItem(FLAG, 'done');
  } catch (_) {}
})(window);
