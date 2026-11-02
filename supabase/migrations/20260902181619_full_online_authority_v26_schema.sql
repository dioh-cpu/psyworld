-- Restored from the applied Supabase migration history (20260902181619).
alter table public.players add column if not exists system_imported_at timestamptz;

create table if not exists public.player_system_state (
  user_id uuid primary key references public.players(user_id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_action_receipts (
  user_id uuid not null references public.players(user_id) on delete cascade,
  idempotency_key text not null,
  action text not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key(user_id,idempotency_key)
);

alter table public.player_system_state enable row level security;
alter table public.game_action_receipts enable row level security;
drop policy if exists player_system_state_read_self on public.player_system_state;
create policy player_system_state_read_self on public.player_system_state for select to authenticated using (auth.uid()=user_id);
drop policy if exists game_action_receipts_read_self on public.game_action_receipts;
create policy game_action_receipts_read_self on public.game_action_receipts for select to authenticated using (auth.uid()=user_id);
grant select on public.player_system_state,public.game_action_receipts to authenticated;
revoke insert,update,delete on public.player_system_state,public.game_action_receipts from public,anon,authenticated;

delete from public.shop_catalog where category='stone';
insert into public.shop_catalog(item_key,buy_gold,sell_gold,sellable,category) values
('Fire Stone',20000,10000,true,'stone'),('Water Stone',20000,10000,true,'stone'),
('Leaf Stone',20000,10000,true,'stone'),('Thunder Stone',20000,10000,true,'stone'),
('Ice Stone',20000,10000,true,'stone'),('Punch Stone',20000,10000,true,'stone'),
('Venom Stone',20000,10000,true,'stone'),('Earth Stone',20000,10000,true,'stone'),
('Feather Stone',20000,10000,true,'stone'),('Enigma Stone',20000,10000,true,'stone'),
('Cocoon Stone',20000,10000,true,'stone'),('Rock Stone',20000,10000,true,'stone'),
('Crystal Stone',20000,10000,true,'stone'),('Darkness Stone',20000,10000,true,'stone'),
('Metal Stone',20000,10000,true,'stone'),('Heart Stone',20000,10000,true,'stone')
on conflict(item_key) do update set buy_gold=excluded.buy_gold,sell_gold=excluded.sell_gold,sellable=excluded.sellable,category=excluded.category;

create or replace function public.psy_v26_snapshot(p_user uuid) returns jsonb
language plpgsql security definer set search_path=public as $$
declare p jsonb; inv jsonb; st jsonb;
begin
  select jsonb_build_object('trainer_name',trainer_name,'trainer_level',trainer_level,'trainer_xp',trainer_xp,'gold',gold,'diamonds',diamonds,'psycoin',psycoin,'authority_version',authority_version,'legacy_imported_at',legacy_imported_at,'system_imported_at',system_imported_at,'updated_at',updated_at) into p from players where user_id=p_user;
  if p is null then raise exception 'missing player'; end if;
  select coalesce(jsonb_object_agg(item_key,quantity),'{}'::jsonb) into inv from player_inventory where user_id=p_user and quantity>0;
  select coalesce(state,'{}'::jsonb) into st from player_system_state where user_id=p_user;
  return jsonb_build_object('player',p,'inventory',coalesce(inv,'{}'::jsonb),'system',coalesce(st,'{}'::jsonb),'market_enabled',false);
end $$;
revoke execute on function public.psy_v26_snapshot(uuid) from public,anon,authenticated;
