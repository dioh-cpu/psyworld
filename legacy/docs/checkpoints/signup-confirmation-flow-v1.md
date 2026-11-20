# E-mail signup confirmation investigation

Base: `72953a34580ba269d5bb4425db32a1451fd13dc7` (`main`). Branch: `fix/signup-confirmation-flow-v1`.

Findings:
- `/api/config` confirms the production client has the Supabase URL and public key and points to project `otwgavwvjxuwtgncjbiq` (`ACTIVE_HEALTHY`, `sa-east-1`). It does not expose Auth mailer/SMTP settings.
- Auth logs for 2026-11-10 03:30–03:51 UTC show 16 `/signup` HTTP 200 events tagged `user_repeated_signup`, plus a successful `/token` HTTP 200. These records indicate repeated signup attempts against an existing user and an authenticated login; they do not prove an email was sent or delivered. No SMTP setting or delivery status is available in the connected project tools.
- Official Supabase Auth JS source passes `emailRedirectTo` as the `redirect_to` REST query parameter. The previous implementation sent SDK-only `options.emailRedirectTo` in the JSON body.
- Supabase's default SMTP is restricted to team-authorized recipients, has a low variable rate limit, and has no delivery SLA. The project SMTP setting could not be inspected; do not infer which SMTP mode is active.

Local implementation:
- Signup normalizes email, sends the REST redirect as `?redirect_to=...`, and no longer reports account creation or email delivery from a generic HTTP 200.
- Adds a resend-confirmation action using the documented Auth `/resend` endpoint, generic anti-enumeration messaging, Auth 429 handling, and a 60-second local cooldown.
- Cache build strings updated. No SMTP credentials or database changes.

Tests:
- `tests/cloud-signup-confirmation-flow-v1.cjs` (mock REST payload, redirect, generic response, resend, cooldown, HTTP 429).
- Existing Cloud Save/CAS/login, Halloween, and trainer-entry focused regressions pass.
- Chromium 390x844 and 1440x900 with mocked Auth verifies signup and resend payloads, status text, and no JS errors. This is not proof of actual email delivery.

Pending before publication as a working email feature: project owner must inspect Auth > SMTP and Auth > URL Configuration; if default SMTP is active, configure a verified custom SMTP sender and allow `https://psyworld-murex.vercel.app/`. Then provide one controlled disposable test mailbox (not a player's personal address) for one real signup/confirmation/login and resend test. No email was sent by these tests; no user account was created or changed by the agent.

Autonomy check (2026-11-10):
- Refetched `origin/main` at `5758d2e77d4eaa4e3163deda1885c9fe2bb12ab3`; it is an ancestor of the feature branch, so no newer main changes needed merging.
- Supabase MCP exposes project health/logs/database, but no Auth config get/update operation. Project details do not report SMTP, confirmation toggle, templates, or redirect allowlist. No authorized Supabase dashboard browser session/tool is available in this task.
- Vercel production env names contain Supabase integration variables but no SMTP/provider credentials. Vercel account lists no registered custom domains; project only has `psyworld-murex.vercel.app`, whose DNS is controlled by Vercel, not by the PSYWORLD team.
- Gmail integration is attached to a personal mailbox, not a disposable test inbox; it was not used to create a test account or receive test mail. No Resend/Brevo/SES/SMTP provider integration is connected. No DNS edits, provider account creation, purchases, real signup requests, or production config changes were made.
- Current hard blocker for end-to-end proof/publication: owner-level Auth SMTP/settings access and a verified sender domain/provider are absent, and there is no authorized disposable test inbox. Keep the code on the feature branch until one real message can be received, confirmed, and used to log in.
