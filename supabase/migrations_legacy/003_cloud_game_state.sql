create table if not exists public.player_game_state (
  user_id uuid primary key references public.players(user_id) on delete cascade,
  save jsonb not null default '{}'::jsonb,
  client_updated_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.player_game_state enable row level security;
drop policy if exists game_state_read_self on public.player_game_state;
create policy game_state_read_self on public.player_game_state for select to authenticated using (auth.uid()=user_id);
revoke insert, update, delete on public.player_game_state from anon, authenticated;
grant select on public.player_game_state to authenticated;
