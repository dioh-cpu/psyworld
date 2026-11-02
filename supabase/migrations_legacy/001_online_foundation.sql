create extension if not exists pgcrypto;

create table if not exists public.players (
  user_id uuid primary key,
  trainer_name text not null default 'Trainer',
  trainer_level integer not null default 1 check (trainer_level >= 1),
  trainer_xp bigint not null default 0 check (trainer_xp >= 0),
  gold bigint not null default 0 check (gold >= 0),
  diamonds bigint not null default 0 check (diamonds >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.players(user_id) on delete cascade,
  currency text not null check (currency in ('gold','diamonds')),
  amount bigint not null,
  reason text not null,
  reference_id text,
  idempotency_key text not null,
  balance_after bigint not null check (balance_after >= 0),
  created_at timestamptz not null default now(),
  unique(user_id,idempotency_key)
);

create table if not exists public.player_inventory (
  user_id uuid not null references public.players(user_id) on delete cascade,
  item_key text not null,
  quantity bigint not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key(user_id,item_key)
);

create table if not exists public.player_pokemon (
  pokemon_uid uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.players(user_id) on delete cascade,
  species_id integer not null,
  level integer not null default 1 check (level between 1 and 10000),
  xp bigint not null default 0 check (xp >= 0),
  shiny boolean not null default false,
  mega_form text,
  tier text not null default 'E',
  rarity text not null default 'Lixo',
  resets integer not null default 0 check (resets >= 0),
  data jsonb not null default '{}'::jsonb,
  locked_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists player_pokemon_owner_idx on public.player_pokemon(owner_id);

create table if not exists public.battle_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.players(user_id) on delete cascade,
  mode text not null,
  seed bigint not null,
  encounter jsonb not null,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  finished_at timestamptz,
  reward_claimed boolean not null default false,
  result jsonb
);
create index if not exists battle_sessions_user_idx on public.battle_sessions(user_id,started_at desc);

create table if not exists public.market_listings_v2 (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.players(user_id),
  kind text not null check (kind in ('item','pokemon','diamonds')),
  pokemon_uid uuid references public.player_pokemon(pokemon_uid),
  item_key text,
  quantity bigint,
  currency text not null check (currency in ('gold','diamonds')),
  price bigint not null check (price > 0),
  listing_fee_gold bigint not null default 0 check (listing_fee_gold >= 0),
  status text not null default 'active' check(status in ('active','sold','cancelled')),
  buyer_id uuid references public.players(user_id),
  created_at timestamptz not null default now(),
  sold_at timestamptz,
  check ((kind='pokemon' and pokemon_uid is not null) or (kind<>'pokemon'))
);
create index if not exists market_v2_active_idx on public.market_listings_v2(status,created_at desc);

alter table public.players enable row level security;
alter table public.wallet_ledger enable row level security;
alter table public.player_inventory enable row level security;
alter table public.player_pokemon enable row level security;
alter table public.battle_sessions enable row level security;
alter table public.market_listings_v2 enable row level security;

-- Client can read its own state, but cannot directly mutate economy tables.
create policy players_read_self on public.players for select to authenticated using (auth.uid()=user_id);
create policy ledger_read_self on public.wallet_ledger for select to authenticated using (auth.uid()=user_id);
create policy inventory_read_self on public.player_inventory for select to authenticated using (auth.uid()=user_id);
create policy pokemon_read_self on public.player_pokemon for select to authenticated using (auth.uid()=owner_id);
create policy battles_read_self on public.battle_sessions for select to authenticated using (auth.uid()=user_id);
create policy market_read_active on public.market_listings_v2 for select to authenticated using (status='active' or auth.uid()=seller_id or auth.uid()=buyer_id);

-- Intentionally NO direct INSERT/UPDATE/DELETE policies for wallet/inventory/pokemon/market.
-- Mutations must go through trusted server/Edge Functions.

create or replace function public.apply_wallet_delta(
  p_user uuid, p_currency text, p_amount bigint, p_reason text,
  p_reference text, p_idempotency text
) returns bigint
language plpgsql security definer set search_path=''
as $$
declare v_balance bigint;
begin
  if p_currency not in ('gold','diamonds') then raise exception 'invalid currency'; end if;
  if exists(select 1 from public.wallet_ledger where user_id=p_user and idempotency_key=p_idempotency) then
    select balance_after into v_balance from public.wallet_ledger where user_id=p_user and idempotency_key=p_idempotency;
    return v_balance;
  end if;
  if p_currency='gold' then
    update public.players set gold=gold+p_amount,updated_at=now() where user_id=p_user and gold+p_amount>=0 returning gold into v_balance;
  else
    update public.players set diamonds=diamonds+p_amount,updated_at=now() where user_id=p_user and diamonds+p_amount>=0 returning diamonds into v_balance;
  end if;
  if v_balance is null then raise exception 'insufficient balance or missing player'; end if;
  insert into public.wallet_ledger(user_id,currency,amount,reason,reference_id,idempotency_key,balance_after)
  values(p_user,p_currency,p_amount,p_reason,p_reference,p_idempotency,v_balance);
  return v_balance;
end $$;
revoke execute on function public.apply_wallet_delta(uuid,text,bigint,text,text,text) from public, anon, authenticated;

