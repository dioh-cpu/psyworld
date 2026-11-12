-- Apply only to a dedicated Supabase project for Cain & Lucius Reels Studio.
create extension if not exists pgcrypto;
create table if not exists public.reels (
 id uuid primary key default gen_random_uuid(), series text not null check (series in ('Cain e Lucius','Sitcom Pokémon')),
 episode text, caption text not null, schedule_at timestamptz, products jsonb not null default '[]'::jsonb,
 video_path text, cover_path text, status text not null default 'Rascunho', idempotency_key text unique not null,
 instagram_media_id text, instagram_permalink text, last_error text, attempts integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), published_at timestamptz
);
create index if not exists reels_due_idx on public.reels(schedule_at) where status='Agendado';
create index if not exists reels_series_episode_idx on public.reels(series,episode);
create table if not exists public.instagram_credentials (
 id text primary key check (id='primary'), user_id text not null, username text not null,
 encrypted_token jsonb not null, expires_at timestamptz not null, updated_at timestamptz not null default now()
);
create table if not exists public.affiliates (
 id uuid primary key default gen_random_uuid(), store text not null check (store in ('Shopee','SHEIN')),
 product_name text not null, original_url text, affiliate_url text not null, image_path text,
 character_name text, series text, episode text, visual_match numeric(3,2), verified_at timestamptz,
 created_at timestamptz not null default now()
);
alter table public.reels enable row level security;
alter table public.instagram_credentials enable row level security;
alter table public.affiliates enable row level security;
revoke all on public.reels,public.instagram_credentials,public.affiliates from anon,authenticated;
grant all on public.reels,public.instagram_credentials,public.affiliates to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('reels-private','reels-private',false,1073741824,array['video/mp4','image/jpeg','image/png'])
on conflict(id) do update set public=false,file_size_limit=1073741824,allowed_mime_types=array['video/mp4','image/jpeg','image/png'];
