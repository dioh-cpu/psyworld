-- Restored from the applied Supabase migration history (20260904201147).
create table if not exists public.player_characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.players(user_id) on delete cascade,
  nickname text not null,
  nickname_key text generated always as (lower(btrim(nickname))) stored,
  save jsonb not null default '{}'::jsonb,
  client_updated_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, nickname_key)
);

alter table public.player_characters enable row level security;
drop policy if exists player_characters_read_self on public.player_characters;
create policy player_characters_read_self on public.player_characters
for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete on public.player_characters from anon, authenticated;
grant select on public.player_characters to authenticated;

insert into public.player_characters(user_id,nickname,save,client_updated_at,updated_at)
select pgs.user_id,
       'Principal',
       jsonb_set(
         jsonb_set(pgs.save, '{player,meta,characterNickname}', to_jsonb('Principal'::text), true),
         '{player,meta,onlineCharacter}', 'true'::jsonb, true
       ),
       pgs.client_updated_at,
       pgs.updated_at
from public.player_game_state pgs
on conflict (user_id,nickname_key) do nothing;

create index if not exists player_characters_user_updated_idx on public.player_characters(user_id, updated_at desc);
