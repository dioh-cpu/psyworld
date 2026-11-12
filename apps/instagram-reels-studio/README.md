# Cain & Lucius Reels Studio

Standalone Vercel project preparation, independent of PSYWORLD. Existing Portuguese dashboard is preserved in `public/`. `server.mjs` remains the local development server; `api/` contains Vercel Functions and uses Supabase REST + private Storage so runtime state is not kept in ephemeral function memory or filesystem.

## OAuth / Unified Login

Uses Instagram Login OAuth documented at `https://www.instagram.com/oauth/authorize`, code exchange at `https://api.instagram.com/oauth/access_token`, long-lived exchange/refresh at `graph.instagram.com/access_token` and `graph.instagram.com/refresh_access_token`. Scopes: `instagram_business_basic`, `instagram_business_content_publish`. App ID is set to the value supplied by the owner. Config ID `2055560198307756` is metadata for the selected setup; Meta's current Instagram Login parameter reference does not list `config_id` on the authorization URL. `IG_REDIRECT_URI` must exactly match the Meta dashboard URL. Callback route is `/auth/instagram/callback`.

OAuth `state` is HMAC-signed and tied to a Secure, HttpOnly, SameSite=Lax cookie. Long-lived tokens are AES-256-GCM encrypted before storage in a dedicated Supabase table. No credentials are present in this repository.

## Persistence

Apply `supabase/migrations/202611120001_reels_studio.sql` only in a **new dedicated Supabase project** for this Studio. It creates private tables with RLS enabled and access revoked for anon/authenticated, a unique idempotency key for episodes, and a private Storage bucket. Video uploads use signed upload URLs so the MP4 does not pass through Vercel's 4.5 MB function request limit. Function access uses the server-only `SUPABASE_SERVICE_ROLE_KEY`.

Queue state/schema and signed MP4 upload are prepared. A publisher worker, scheduled cron, account admin, and media readiness/insights paths still need implementation before production scheduling/publication.

## Vercel setup (not yet deployed)

1. Create a separate Vercel project named `cain-lucius-reels-studio`, with this directory as its root. Do not link `psyworld`.
2. Create a dedicated Supabase project, apply the migration above, and create Vercel project secrets from `.env.example` in Preview environment. Generate `OAUTH_STATE_SECRET` as random 32+ bytes and `TOKEN_ENCRYPTION_KEY` as exactly 32 random bytes encoded in base64. Enter Meta App Secret directly in the Vercel secret manager.
3. Set `IG_REDIRECT_URI` to `https://<actual-preview-domain>/auth/instagram/callback`, then add that exact HTTPS URI to the Meta App OAuth redirect allowlist. Redeploy Preview after setting the variables.
4. Admin Basic Auth middleware protects the dashboard and all APIs. Only the Meta callback and status endpoint are public. Set a unique `ADMIN_USERNAME`/`ADMIN_PASSWORD` before deployment. Vercel preview protection should also be enabled.
5. Confirm `/api/status`, `/auth/instagram/callback` (invalid state must return 400), and `/` (without admin credentials must return 401) over HTTPS. Then start OAuth manually and validate a real professional account before implementing/activating publishing.

Do not deploy Production or post any Reel as part of this setup. The current workspace has no Vercel project for this app, no Supabase project configured for the Studio, no Meta App Secret, and no admin credentials; therefore no live HTTPS callback exists yet.
