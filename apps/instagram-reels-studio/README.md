# Cain & Lucius Reels Studio

Standalone Vercel project preparation, independent of PSYWORLD. Existing Portuguese dashboard is preserved in `public/`. `server.mjs` remains the local development server; `api/` contains Vercel Functions and uses Supabase REST + private Storage so runtime state is not kept in ephemeral function memory or filesystem.

## OAuth / Unified Login

Uses the Instagram API with Unified Login, built on Facebook Login for Business. The Login Configuration ID (`IG_CONFIG_ID`) supplies permissions and assets, so the authorization request does not send a scope list. The authorization code is exchanged once at `graph.facebook.com/v27.0/oauth/access_token` for a Business Integration System User Access Token (SUAT). The server discovers shared professional Instagram accounts through `/me/assigned_instagram_accounts`, encrypts the SUAT, and verifies the stored account against that endpoint. The callback is `/auth/instagram/callback`; `IG_REDIRECT_URI` must exactly match the URL saved in the Meta configuration.

OAuth `state` is HMAC-signed and tied to a Secure, HttpOnly, SameSite=Lax cookie. The Unified Login SUAT is AES-256-GCM encrypted before storage in a dedicated Supabase table. No credentials are present in this repository.

## Persistence

Apply `supabase/migrations/202611120001_reels_studio.sql` only in a **new dedicated Supabase project** for this Studio. It creates private tables with RLS enabled and access revoked for anon/authenticated, a unique idempotency key for episodes, and a private Storage bucket. Video uploads use signed upload URLs so the MP4 does not pass through Vercel's 4.5 MB function request limit. Function access uses the server-only `SUPABASE_SERVICE_ROLE_KEY`, which may contain either a legacy `service_role` JWT or a modern `sb_secret_` key. Modern secret keys are sent only in the `apikey` header because they are opaque keys rather than JWTs.

Queue state/schema and signed MP4 upload are prepared. A publisher worker, scheduled cron, account admin, and media readiness/insights paths still need implementation before production scheduling/publication.

## Vercel setup (not yet deployed)

1. Create a separate Vercel project named `cain-lucius-reels-studio`, with this directory as its root. Do not link `psyworld`.
2. Create a dedicated Supabase project, apply the migration above, and create Vercel project secrets from `.env.example` in Preview environment. Generate `OAUTH_STATE_SECRET` as random 32+ bytes and `TOKEN_ENCRYPTION_KEY` as exactly 32 random bytes encoded in base64. Enter Meta App Secret directly in the Vercel secret manager.
3. Set `IG_REDIRECT_URI` to the HTTPS callback configured in Meta. For organic Reels publishing, the configuration needs `instagram_basic` and `instagram_content_publish`, and it should request only the Instagram account asset. Do not request an ad account or `ads_management`/`ads_read` unless the Studio later adds advertising features. The authorization URL uses `config_id` instead of an explicit scope list.
4. Apply the Studio migration `supabase/migrations/202611130001_allow_non_expiring_instagram_suat.sql` to the dedicated Supabase project before deploying this OAuth change. Unified Login token expiration follows the Meta configuration and may be absent; account checks then validate the token by querying Meta.
5. Admin Basic Auth middleware protects the dashboard and all APIs. Only the Meta callback and status endpoint are public. Set a unique `ADMIN_USERNAME`/`ADMIN_PASSWORD` before deployment. Vercel preview protection should also be enabled.
6. Confirm `/api/status`, `/auth/instagram/callback` (invalid state must return 400), and `/` (without admin credentials must return 401) over HTTPS. Then start OAuth manually and validate a real professional account before implementing/activating publishing.

Do not publish Reels during connection testing. A successful OAuth callback must be followed by checking `/api/account` and confirming the matching username is stored in the Studio's exclusive Supabase project.
