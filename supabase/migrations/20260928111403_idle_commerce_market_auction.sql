-- Restored from the applied Supabase migration history (20260928111403).
-- Idle-only commerce. No references to PSYWORLD players, inventories or saves.
create table public.idle_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 nickname text not null default 'Treinador', gold bigint not null default 500 check(gold>=0),
 psycoin bigint not null default 0 check(psycoin>=0), bound_psycoin bigint not null default 0 check(bound_psycoin>=0 and bound_psycoin<=psycoin),
 revision bigint not null default 0, last_reward_at timestamptz, created_at timestamptz not null default now()
);
create table public.idle_assets (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.idle_accounts(user_id),
 kind text not null check(kind in ('item','pokemon')), category text not null check(category in ('item','pokemon','stone','egg','profession')),
 name text not null check(length(name) between 1 and 100), quantity bigint not null check(quantity>0), bound boolean not null default false,
 data jsonb not null default '{}', created_at timestamptz not null default now()
);
create index idle_assets_owner on public.idle_assets(owner_id);
create table public.idle_listings (
 id uuid primary key default gen_random_uuid(), seller_id uuid not null references public.idle_accounts(user_id),
 kind text not null check(kind in ('market','auction')), category text not null check(category in ('item','pokemon','stone','egg','profession','psycoin')),
 name text not null, quantity bigint not null check(quantity>0), asset_kind text not null check(asset_kind in ('item','pokemon','psycoin')),
 asset_data jsonb not null default '{}', currency text not null check(currency in ('gold','psycoin')), price bigint not null check(price between 1 and 1000000000),
 buyout bigint check(buyout between 1 and 1000000000), highest_bid bigint not null default 0,
 highest_bidder uuid references public.idle_accounts(user_id), buyer_id uuid references public.idle_accounts(user_id),
 status text not null default 'active' check(status in ('active','sold','cancelled','expired')),
 created_at timestamptz not null default now(), expires_at timestamptz not null, settled_at timestamptz,
 check(buyout is null or buyout>=price)
);
create index idle_listings_browse on public.idle_listings(kind,category,created_at desc) where status='active';
create index idle_listings_expiry on public.idle_listings(expires_at) where status='active';
create index idle_listings_seller on public.idle_listings(seller_id,created_at desc);
create index idle_listings_bidder on public.idle_listings(highest_bidder) where highest_bidder is not null;
create table public.idle_commerce_receipts (
 user_id uuid not null references public.idle_accounts(user_id), request_id uuid not null, action text not null, payload jsonb not null,
 result jsonb not null, created_at timestamptz not null default now(), primary key(user_id,request_id)
);
create table public.idle_ledger (
 id bigint generated always as identity primary key, user_id uuid not null references public.idle_accounts(user_id),
 currency text not null, amount bigint not null, reason text not null, listing_id uuid, created_at timestamptz not null default now()
);
create index idle_ledger_owner on public.idle_ledger(user_id,created_at desc);
alter table public.idle_accounts enable row level security;
alter table public.idle_assets enable row level security;
alter table public.idle_listings enable row level security;
alter table public.idle_commerce_receipts enable row level security;
alter table public.idle_ledger enable row level security;
revoke all on public.idle_accounts,public.idle_assets,public.idle_listings,public.idle_commerce_receipts,public.idle_ledger from public,anon,authenticated;
grant all on public.idle_accounts,public.idle_assets,public.idle_listings,public.idle_commerce_receipts,public.idle_ledger to service_role;
grant usage,select on sequence public.idle_ledger_id_seq to service_role;

create function public.idle_money(u uuid,c text,n bigint,reason text,lid uuid default null)
returns void language plpgsql security invoker set search_path='' as $$
declare ok uuid;
begin
 if c='gold' then
  update public.idle_accounts set gold=gold+n,revision=revision+1 where user_id=u and gold+n>=0 returning user_id into ok;
 elsif c='psycoin' then
  update public.idle_accounts set psycoin=psycoin+n,revision=revision+1 where user_id=u and psycoin+n>=bound_psycoin returning user_id into ok;
 else raise exception 'invalid_currency'; end if;
 if ok is null then raise exception 'insufficient_balance'; end if;
 insert into public.idle_ledger(user_id,currency,amount,reason,listing_id) values(u,c,n,reason,lid);
end $$;
create function public.idle_deliver(u uuid,l public.idle_listings)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if l.asset_kind='psycoin' then perform public.idle_money(u,'psycoin',l.quantity,'asset_delivery',l.id);
 else insert into public.idle_assets(owner_id,kind,category,name,quantity,data) values(u,l.asset_kind,l.category,l.name,l.quantity,l.asset_data); end if;
end $$;
create function public.idle_settle(lid uuid,forced_buyer uuid default null,forced_price bigint default null)
returns void language plpgsql security invoker set search_path='' as $$
declare l public.idle_listings; buyer uuid; total bigint;
begin
 select * into l from public.idle_listings where id=lid for update;
 if l.id is null or l.status<>'active' then return; end if;
 if forced_buyer is null and l.expires_at>clock_timestamp() then return; end if;
 buyer:=coalesce(forced_buyer,l.highest_bidder); total:=coalesce(forced_price,l.highest_bid);
 if buyer is null then
  perform public.idle_deliver(l.seller_id,l);
  update public.idle_listings set status='expired',settled_at=clock_timestamp() where id=lid;
 else
  -- Current auction bid was already debited; immediate purchase refunds it first.
  if forced_buyer is not null then
   if l.highest_bidder is not null then perform public.idle_money(l.highest_bidder,l.currency,l.highest_bid,'bid_refund',lid); end if;
   perform public.idle_money(buyer,l.currency,-total,'purchase',lid);
  end if;
  perform public.idle_money(l.seller_id,l.currency,total,'sale',lid);
  perform public.idle_deliver(buyer,l);
  update public.idle_listings set status='sold',buyer_id=buyer,highest_bid=total,settled_at=clock_timestamp() where id=lid;
 end if;
end $$;
create function public.idle_commerce(u uuid,act text,p jsonb,req uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare l public.idle_listings; a public.idle_assets; old public.idle_commerce_receipts; result jsonb;
 qty bigint; price bigint; buyout bigint; bid bigint; cur text; cat text; lid uuid; duration integer; own_count integer; asset_id uuid; starter uuid;
begin
 if u is null then raise exception 'auth_required'; end if;
 -- A single short commerce lock gives deterministic ordering across refunds/settlements.
 perform pg_advisory_xact_lock(284916,1);
 insert into public.idle_accounts(user_id,nickname) values(u,left(coalesce(nullif(p->>'nickname',''),'Treinador'),24)) on conflict do nothing;
 if not exists(select 1 from public.idle_assets where owner_id=u) and not exists(select 1 from public.idle_commerce_receipts where user_id=u) then
  insert into public.idle_assets(owner_id,kind,category,name,quantity,bound,data) values
   (u,'pokemon','pokemon','Bulbasaur',1,true,'{"id":1,"name":"Bulbasaur","level":1,"rarity":{"n":"Comum","mult":1},"tier":"E"}'),
   (u,'item','item','Pokéball',3,true,'{}');
  insert into public.idle_commerce_receipts values(u,'00000000-0000-4000-8000-000000000001','starter','{}','{}',now());
 end if;
 if req is not null then
  select * into old from public.idle_commerce_receipts where user_id=u and request_id=req;
  if found then
   if old.action<>act or old.payload<>p then raise exception 'request_conflict'; end if;
   return old.result;
  end if;
 end if;
 for lid in select id from public.idle_listings where status='active' and expires_at<=clock_timestamp() order by expires_at limit 100 loop
  perform public.idle_settle(lid);
 end loop;
 if act='state' then
  select jsonb_build_object('account',to_jsonb(x),'assets',coalesce((select jsonb_agg(to_jsonb(a) order by a.created_at) from public.idle_assets a where a.owner_id=u),'[]'::jsonb)) into result from public.idle_accounts x where user_id=u;
  return result;
 end if;
 if req is null then raise exception 'request_id_required'; end if;
 if act='create' then
  qty:=(p->>'quantity')::bigint; price:=(p->>'price')::bigint; buyout:=nullif(p->>'buyout','')::bigint; cur:=p->>'currency';duration:=(p->>'hours')::integer;
  if qty is null or qty<1 or qty>1000000 or price is null or price<1 or price>1000000000 or cur is null or cur not in ('gold','psycoin') or duration is null or duration not in (6,12,24,48) or p->>'kind' is null or p->>'kind' not in ('market','auction') then raise exception 'invalid_listing'; end if;
  if buyout is not null and (buyout<price or buyout>1000000000) then raise exception 'invalid_buyout'; end if;
  select count(*) into own_count from public.idle_listings where seller_id=u and status='active';
  if own_count>=50 then raise exception 'listing_limit'; end if;
  lid:=gen_random_uuid();
  if p->>'asset_kind'='psycoin' then
   if cur<>'gold' then raise exception 'psycoin_for_gold_only'; end if;
   perform public.idle_money(u,'psycoin',-qty,'asset_escrow',lid);
   insert into public.idle_listings(id,seller_id,kind,category,name,quantity,asset_kind,currency,price,buyout,expires_at)
    values(lid,u,p->>'kind','psycoin','PsyCoin',qty,'psycoin',cur,price,buyout,clock_timestamp()+make_interval(hours=>duration));
  else
   asset_id:=(p->>'asset_id')::uuid;
   select * into a from public.idle_assets where id=asset_id and owner_id=u for update;
   if a.id is null or a.bound or a.quantity<qty then raise exception 'asset_unavailable_or_bound'; end if;
   if a.kind='pokemon' and qty<>1 then raise exception 'invalid_quantity'; end if;
   if a.quantity=qty then delete from public.idle_assets where id=a.id; else update public.idle_assets set quantity=quantity-qty where id=a.id; end if;
   insert into public.idle_listings(id,seller_id,kind,category,name,quantity,asset_kind,asset_data,currency,price,buyout,expires_at)
    values(lid,u,p->>'kind',a.category,a.name,qty,a.kind,a.data,cur,price,buyout,clock_timestamp()+make_interval(hours=>duration));
  end if;
  result:=jsonb_build_object('ok',true,'listing_id',lid);
 elsif act in ('buy','bid','cancel','settle') then
  lid:=(p->>'listing_id')::uuid;
  select * into l from public.idle_listings where id=lid for update;
  if l.id is null then raise exception 'listing_not_found'; end if;
  if l.status<>'active' then raise exception 'listing_unavailable'; end if;
  if act='cancel' then
   if l.seller_id<>u then raise exception 'not_owner'; end if;
   if l.highest_bidder is not null then raise exception 'auction_has_bids'; end if;
   perform public.idle_deliver(u,l);
   update public.idle_listings set status='cancelled',settled_at=clock_timestamp() where id=lid;
  elsif act='settle' then
   perform public.idle_settle(lid);
  else
   if l.seller_id=u then raise exception 'own_listing'; end if;
   if act='buy' then
    if l.kind='auction' and l.buyout is null then raise exception 'no_buyout'; end if;
    perform public.idle_settle(lid,u,case when l.kind='market' then l.price else l.buyout end);
   else
    if l.kind<>'auction' then raise exception 'not_auction'; end if;
    bid:=(p->>'amount')::bigint;
    if bid is null or bid<greatest(l.price,l.highest_bid+1) or bid>1000000000 then raise exception 'bid_too_low'; end if;
    if l.buyout is not null and bid>=l.buyout then perform public.idle_settle(lid,u,l.buyout);
    else
     if l.highest_bidder is not null then perform public.idle_money(l.highest_bidder,l.currency,l.highest_bid,'bid_refund',lid); end if;
     perform public.idle_money(u,l.currency,-bid,'bid_escrow',lid);
     update public.idle_listings set highest_bid=bid,highest_bidder=u where id=lid;
    end if;
   end if;
  end if;
  result:=jsonb_build_object('ok',true,'listing_id',lid);
 else raise exception 'unknown_action'; end if;
 insert into public.idle_commerce_receipts(user_id,request_id,action,payload,result) values(u,req,act,p,result);
 perform realtime.send(jsonb_build_object('changed',true),'changed','idle-commerce',true);
 return result;
end $$;
revoke all on function public.idle_money(uuid,text,bigint,text,uuid),public.idle_deliver(uuid,public.idle_listings),public.idle_settle(uuid,uuid,bigint),public.idle_commerce(uuid,text,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.idle_money(uuid,text,bigint,text,uuid),public.idle_deliver(uuid,public.idle_listings),public.idle_settle(uuid,uuid,bigint),public.idle_commerce(uuid,text,jsonb,uuid) to service_role;
create policy idle_commerce_receive on realtime.messages for select to authenticated using(extension='broadcast' and (select realtime.topic())='idle-commerce');
