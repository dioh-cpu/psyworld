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




-- PSYWORLD server-authoritative economy v2

alter table public.players
  add column if not exists legacy_imported_at timestamptz;

-- Prevent accidental client execution of privileged RPCs by default.
grant usage on schema public to authenticated;
grant select on public.players,public.wallet_ledger,public.player_inventory,public.player_pokemon,public.market_listings_v2 to authenticated;

create or replace function public.import_legacy_save_once(
  p_user uuid,p_gold bigint,p_diamonds bigint,p_trainer_level integer
) returns boolean
language plpgsql security definer set search_path=public
as $$
begin
  update players
  set gold=p_gold,diamonds=p_diamonds,trainer_level=p_trainer_level,legacy_imported_at=now(),updated_at=now()
  where user_id=p_user and legacy_imported_at is null;
  if not found then raise exception 'legacy import already used or player missing'; end if;

  insert into wallet_ledger(user_id,currency,amount,reason,reference_id,idempotency_key,balance_after)
  values
    (p_user,'gold',p_gold,'legacy_import','legacy','legacy-gold',p_gold),
    (p_user,'diamonds',p_diamonds,'legacy_import','legacy','legacy-diamonds',p_diamonds)
  on conflict(user_id,idempotency_key) do nothing;
  return true;
end $$;
revoke execute on function public.import_legacy_save_once(uuid,bigint,bigint,integer) from public,anon,authenticated;

-- Authoritative price catalog. Client display may differ, but server decides.
create table if not exists public.shop_catalog(
  item_key text primary key,
  buy_gold bigint,
  sell_gold bigint,
  sellable boolean not null default false,
  category text not null
);

insert into public.shop_catalog(item_key,buy_gold,sell_gold,sellable,category) values
 ('Fire Stone',20000,10000,true,'stone'),
 ('Water Stone',20000,10000,true,'stone'),
 ('Leaf Stone',20000,10000,true,'stone'),
 ('Thunder Stone',20000,10000,true,'stone'),
 ('Ice Stone',20000,10000,true,'stone'),
 ('Fighting Stone',20000,10000,true,'stone'),
 ('Poison Stone',20000,10000,true,'stone'),
 ('Ground Stone',20000,10000,true,'stone'),
 ('Flying Stone',20000,10000,true,'stone'),
 ('Psychic Stone',20000,10000,true,'stone'),
 ('Bug Stone',20000,10000,true,'stone'),
 ('Rock Stone',20000,10000,true,'stone'),
 ('Ghost Stone',20000,10000,true,'stone'),
 ('Dragon Stone',20000,10000,true,'stone'),
 ('Dark Stone',20000,10000,true,'stone'),
 ('Metal Stone',20000,10000,true,'stone'),
 ('Fairy Stone',20000,10000,true,'stone'),
 ('Normal Stone',20000,10000,true,'stone')
on conflict(item_key) do update set buy_gold=excluded.buy_gold,sell_gold=excluded.sell_gold,sellable=excluded.sellable,category=excluded.category;

create or replace function public.adjust_inventory(p_user uuid,p_item text,p_delta bigint)
returns bigint language plpgsql security definer set search_path=public as $$
declare v bigint;
begin
  insert into player_inventory(user_id,item_key,quantity)
  values(p_user,p_item,greatest(0,p_delta))
  on conflict(user_id,item_key) do update
    set quantity=player_inventory.quantity+p_delta,updated_at=now()
    where player_inventory.quantity+p_delta>=0
  returning quantity into v;
  if v is null then raise exception 'insufficient item'; end if;
  return v;
end $$;
revoke execute on function public.adjust_inventory(uuid,text,bigint) from public,anon,authenticated;

create or replace function public.shop_buy_item(
 p_user uuid,p_item text,p_qty integer,p_idempotency text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare price bigint; total bigint; bal bigint; q bigint;
begin
  if p_qty<1 or p_qty>100 then raise exception 'invalid qty'; end if;
  select buy_gold into price from shop_catalog where item_key=p_item and buy_gold is not null;
  if price is null then raise exception 'item not buyable'; end if;
  total:=price*p_qty;
  bal:=apply_wallet_delta(p_user,'gold',-total,'shop_buy',p_item,p_idempotency);
  q:=adjust_inventory(p_user,p_item,p_qty);
  return jsonb_build_object('gold',bal,'quantity',q);
end $$;
revoke execute on function public.shop_buy_item(uuid,text,integer,text) from public,anon,authenticated;

create or replace function public.shop_sell_stone(
 p_user uuid,p_item text,p_qty integer,p_idempotency text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare price bigint; total bigint; bal bigint; q bigint;
begin
  if p_qty<1 or p_qty>100 then raise exception 'invalid qty'; end if;
  select sell_gold into price from shop_catalog where item_key=p_item and sellable=true and category='stone';
  if price is null then raise exception 'item not sellable'; end if;
  q:=adjust_inventory(p_user,p_item,-p_qty);
  total:=price*p_qty;
  bal:=apply_wallet_delta(p_user,'gold',total,'shop_sell',p_item,p_idempotency);
  return jsonb_build_object('gold',bal,'quantity',q);
end $$;
revoke execute on function public.shop_sell_stone(uuid,text,integer,text) from public,anon,authenticated;

create or replace function public.craft_element_ball(
 p_user uuid,p_element text,p_idempotency text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare ess text; ball text; qess bigint; qball bigint;
begin
  ess:=case lower(p_element)
    when 'fire' then 'Essência Fogo' when 'water' then 'Essência Água'
    when 'grass' then 'Essência Planta' when 'electric' then 'Essência Elétrica'
    when 'ice' then 'Essência Gelo' when 'fighting' then 'Essência Lutador'
    when 'poison' then 'Essência Veneno' when 'ground' then 'Essência Terra'
    when 'flying' then 'Essência Voador' when 'psychic' then 'Essência Psíquica'
    when 'bug' then 'Essência Inseto' when 'rock' then 'Essência Pedra'
    when 'ghost' then 'Essência Fantasma' when 'dragon' then 'Essência Dragão'
    when 'dark' then 'Essência Sombria' when 'steel' then 'Essência Metal'
    when 'fairy' then 'Essência Fada' else 'Essência Normal' end;
  ball:=initcap(lower(p_element))||' Ball';
  if exists(select 1 from wallet_ledger where user_id=p_user and idempotency_key=p_idempotency) then
    raise exception 'duplicate request';
  end if;
  qess:=adjust_inventory(p_user,ess,-10);
  qball:=adjust_inventory(p_user,ball,1);
  insert into wallet_ledger(user_id,currency,amount,reason,reference_id,idempotency_key,balance_after)
    select p_user,'gold',0,'craft',ball,p_idempotency,gold from players where user_id=p_user;
  return jsonb_build_object('essence',qess,'ball_quantity',qball,'ball',ball);
end $$;
revoke execute on function public.craft_element_ball(uuid,text,text) from public,anon,authenticated;

-- Market: listing fee is charged by server. Assets are placed in escrow.
create or replace function public.market_create_listing(
 p_user uuid,p_kind text,p_pokemon_uid uuid,p_item_key text,p_quantity bigint,p_currency text,p_price bigint
) returns uuid language plpgsql security definer set search_path=public as $$
declare lid uuid:=gen_random_uuid(); fee bigint:=0; owner uuid;
begin
  if p_kind not in ('item','pokemon','diamonds') then raise exception 'invalid kind'; end if;
  if p_currency not in ('gold','diamonds') then raise exception 'invalid currency'; end if;
  if p_price<=0 then raise exception 'invalid price'; end if;
  if p_currency='gold' then fee:=ceil(p_price*.05); end if;
  if fee>0 then perform apply_wallet_delta(p_user,'gold',-fee,'market_listing_fee',lid::text,'market-fee:'||lid::text); end if;

  if p_kind='diamonds' and p_currency<>'gold' then raise exception 'diamonds may only be sold for gold'; end if;

  if p_kind='pokemon' then
    select owner_id into owner from player_pokemon where pokemon_uid=p_pokemon_uid and owner_id=p_user and locked_reason is null for update;
    if owner is null then raise exception 'pokemon unavailable'; end if;
    update player_pokemon set locked_reason='market:'||lid::text where pokemon_uid=p_pokemon_uid;
  elsif p_kind='item' then
    if p_quantity is null or p_quantity<1 then raise exception 'invalid qty'; end if;
    perform adjust_inventory(p_user,p_item_key,-p_quantity);
  elsif p_kind='diamonds' then
    if p_quantity is null or p_quantity<1 then raise exception 'invalid qty'; end if;
    perform apply_wallet_delta(p_user,'diamonds',-p_quantity,'market_escrow',lid::text,'market-escrow:'||lid::text);
  end if;

  insert into market_listings_v2(id,seller_id,kind,pokemon_uid,item_key,quantity,currency,price,listing_fee_gold)
  values(lid,p_user,p_kind,p_pokemon_uid,p_item_key,p_quantity,p_currency,p_price,fee);
  return lid;
end $$;
revoke execute on function public.market_create_listing(uuid,text,uuid,text,bigint,text,bigint) from public,anon,authenticated;

create or replace function public.market_buy_listing(p_buyer uuid,p_listing uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare l market_listings_v2%rowtype; buyer_bal bigint; seller_bal bigint;
begin
  select * into l from market_listings_v2 where id=p_listing and status='active' for update;
  if not found then raise exception 'listing unavailable'; end if;
  if l.seller_id=p_buyer then raise exception 'cannot buy own listing'; end if;

  buyer_bal:=apply_wallet_delta(p_buyer,l.currency,-l.price,'market_buy',l.id::text,'market-buy:'||l.id::text);
  seller_bal:=apply_wallet_delta(l.seller_id,l.currency,l.price,'market_sale',l.id::text,'market-sale:'||l.id::text);

  if l.kind='pokemon' then
    update player_pokemon set owner_id=p_buyer,locked_reason=null,updated_at=now()
      where pokemon_uid=l.pokemon_uid and owner_id=l.seller_id and locked_reason='market:'||l.id::text;
    if not found then raise exception 'pokemon escrow missing'; end if;
  elsif l.kind='item' then
    perform adjust_inventory(p_buyer,l.item_key,l.quantity);
  elsif l.kind='diamonds' then
    perform adjust_inventory(p_buyer,'__market_virtual__',0); -- no-op keeps branch explicit
    perform apply_wallet_delta(p_buyer,'diamonds',l.quantity,'market_asset_receive',l.id::text,'market-dia-recv:'||l.id::text);
  end if;

  update market_listings_v2 set status='sold',buyer_id=p_buyer,sold_at=now() where id=l.id;
  return jsonb_build_object('listing_id',l.id,'buyer_balance',buyer_bal,'seller_balance',seller_bal);
end $$;
revoke execute on function public.market_buy_listing(uuid,uuid) from public,anon,authenticated;

create or replace function public.market_cancel_listing(p_user uuid,p_listing uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare l market_listings_v2%rowtype;
begin
  select * into l from market_listings_v2 where id=p_listing and seller_id=p_user and status='active' for update;
  if not found then raise exception 'listing unavailable'; end if;

  if l.kind='pokemon' then
    update player_pokemon set locked_reason=null,updated_at=now()
      where pokemon_uid=l.pokemon_uid and owner_id=p_user and locked_reason='market:'||l.id::text;
  elsif l.kind='item' then
    perform adjust_inventory(p_user,l.item_key,l.quantity);
  elsif l.kind='diamonds' then
    perform apply_wallet_delta(p_user,'diamonds',l.quantity,'market_cancel_refund',l.id::text,'market-cancel:'||l.id::text);
  end if;
  update market_listings_v2 set status='cancelled' where id=l.id;
  return true;
end $$;
revoke execute on function public.market_cancel_listing(uuid,uuid) from public,anon,authenticated;
