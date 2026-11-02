-- Restored from the applied Supabase migration history (20260928120008).
-- Preserve participation after a bid is surpassed, without exposing bidder identities.
create table public.idle_bid_history (
 id bigint generated always as identity primary key,
 listing_id uuid not null references public.idle_listings(id),
 bidder_id uuid not null references public.idle_accounts(user_id),
 amount bigint not null check(amount>0),
 request_id uuid not null, created_at timestamptz not null default now(),
 unique(bidder_id,request_id)
);
create index idle_bid_history_user_listing on public.idle_bid_history(bidder_id,listing_id);
alter table public.idle_bid_history enable row level security;
revoke all on public.idle_bid_history from public,anon,authenticated;
grant all on public.idle_bid_history to service_role;
grant usage,select on sequence public.idle_bid_history_id_seq to service_role;
-- These existing final bids are recoverable; earlier outbid records did not exist.
insert into public.idle_bid_history(listing_id,bidder_id,amount,request_id)
select id,highest_bidder,highest_bid,gen_random_uuid() from public.idle_listings
where highest_bidder is not null and highest_bid>0;
create or replace view public.idle_listing_participants with (security_invoker=true) as
select id as listing_id,seller_id as user_id from public.idle_listings
union select id,buyer_id from public.idle_listings where buyer_id is not null
union select listing_id,bidder_id from public.idle_bid_history;
revoke all on public.idle_listing_participants from public,anon,authenticated;
grant select on public.idle_listing_participants to service_role;
create or replace function public.idle_commerce(u uuid,act text,p jsonb,req uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare l public.idle_listings; a public.idle_assets; old public.idle_commerce_receipts; result jsonb;
 qty bigint; price bigint; buyout bigint; bid bigint; cur text; cat text; lid uuid; duration integer; own_count integer; asset_id uuid; starter uuid;
begin
 if u is null then raise exception 'auth_required'; end if;
 -- A single short commerce lock gives deterministic ordering across refunds/settlements.
 perform pg_advisory_xact_lock(284916,1);
 insert into public.idle_accounts(user_id,nickname) values(u,left(coalesce(nullif(p->>'nickname',''),'Treinador'),24)) on conflict do nothing;
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
  select jsonb_build_object('account',to_jsonb(x),'assets',coalesce((select jsonb_agg(to_jsonb(asset_row) order by asset_row.created_at) from public.idle_assets asset_row where asset_row.owner_id=u),'[]'::jsonb)) into result from public.idle_accounts x where user_id=u;
  return result;
 end if;
 if req is null then raise exception 'request_id_required'; end if;
 if act='create' then
  qty:=(p->>'quantity')::bigint; price:=(p->>'price')::bigint; buyout:=nullif(p->>'buyout','')::bigint; cur:=p->>'currency';duration:=(p->>'hours')::integer;
  if qty is null or qty<1 or qty>1000000 or price is null or price<1 or price>1000000000 or cur is null or cur not in ('gold','psycoin') or duration is null or duration not in (6,12,24,48) or p->>'kind' is null or p->>'kind' not in ('market','auction') then raise exception 'invalid_listing'; end if;
  if p->>'kind'='market' then buyout:=null; end if;
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
  if l.status<>'active' or l.expires_at<=clock_timestamp() then raise exception 'listing_unavailable'; end if;
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
    insert into public.idle_bid_history(listing_id,bidder_id,amount,request_id) values(lid,u,case when l.buyout is not null then least(bid,l.buyout) else bid end,req);
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

create function public.idle_browse_commerce(u uuid,k text,s text,c text,q text,pg integer)
returns jsonb language sql stable security invoker set search_path='' as $$
with filtered as (
 select l.*,a.nickname as seller_name,l.seller_id=u as is_own,
 coalesce(l.highest_bidder=u,false) as is_highest_bidder
 from public.idle_listings l join public.idle_accounts a on a.user_id=l.seller_id
 where l.kind=k and (c='all' or l.category=c)
 and (q='' or position(lower(q) in lower(l.name))>0)
 and case when s='history' then l.status<>'active' and exists(select 1 from public.idle_listing_participants p where p.listing_id=l.id and p.user_id=u)
 else l.status='active' and l.expires_at>statement_timestamp() and
 case s when 'mine' then l.seller_id=u when 'bids' then exists(select 1 from public.idle_bid_history b where b.listing_id=l.id and b.bidder_id=u) else s='all' end end
), page_rows as (select * from filtered order by created_at desc,id limit 40 offset greatest(0,pg)*40)
select jsonb_build_object('list',coalesce((select jsonb_agg(to_jsonb(r) - 'seller_id' - 'buyer_id' - 'highest_bidder' order by r.created_at desc,r.id) from page_rows r),'[]'::jsonb),'count',(select count(*) from filtered),'page',pg,'page_size',40,'server_time',statement_timestamp());
$$;
revoke all on function public.idle_browse_commerce(uuid,text,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.idle_browse_commerce(uuid,text,text,text,text,integer) to service_role;
