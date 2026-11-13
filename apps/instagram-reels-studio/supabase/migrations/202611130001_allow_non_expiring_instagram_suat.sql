-- Unified Login access token lifetime is controlled by the Meta configuration.
-- A token with no configured expiration is verified against Meta on account reads.
alter table public.instagram_credentials
  alter column expires_at drop not null;
