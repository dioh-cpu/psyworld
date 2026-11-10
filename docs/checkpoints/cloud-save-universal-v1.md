# Cloud Save Universal V1

Base: `5758d2e77d4eaa4e3163deda1885c9fe2bb12ab3` on `main`.

Cause: the first Cloud Save button was wired in `core/prelude.js` to the old upload-only path, which skipped capture of the active `P` state. Save validation also rejected empty/legacy rosters, and server writes used a read-then-upsert check that could race across devices. Per-account mirror revisions could be confused with per-character revisions, and a deferred choice was fingerprinted against startup-mutated snapshots, reopening the same modal.

Implemented: capture and canonical local persistence per account plus stable character ID; migration support for V2/V9/raw/wrapped saves and legacy party/storage fields; safe local/cloud backups; five-second changed-only local autosave; 45-second minimum automatic upload interval with offline queue and exponential retry; explicit cloud status; one-time acknowledgement after cloud load; deferred decisions tied to the cloud revision; character-ID lookups; atomic revision-conditional update/insert conflict handling. The character row remains authoritative; the account `player_game_state` mirror is best-effort after a successful character write. No Supabase migration was required.

Tests: `tests/cloud-save-character-scope-v1.cjs`, `tests/player-character-cas-v1.cjs`, `tests/cloud-idle-session-bridge.cjs`, `tests/city-cloud-halloween-v1.cjs`, and `tests/trainer-entry-v55.test.cjs`; targeted Chromium tests covered mobile/desktop load → reload → save, deferred-conflict F5 behavior, and V2 local-save restoration. All used disposable/mock data; no real player account was used.

Files: `api/player.js`; `core/account-menu-v34.js`; `core/cloud-save-v23.js`; `core/legacy-runtime.js`; `core/module-loader.js`; `core/new-account-logout-v33.js`; `core/online-authority-v26.js`; `core/online-profile-entry-v37.js`; `core/prelude.js`; `index.html`; Cloud Save regression tests.

Publication: commit `951364a82228cbdd4e7ccaaa6e2b2d4f989c5f43` is on `main`; Vercel production deployment `dpl_AH4toVVWYjULkzdkaULF8BHR5hiB` reached `READY`. Production smoke test returned HTTP 200 and served the `CLOUD_SAVE_UNIVERSAL_V1_20261110` prelude build. No Supabase migration was required. The API compare-and-swap path was validated with disposable mocks; no real player account or production save was modified.
