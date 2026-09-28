-- PSYWORLD V25 — authoritative economy hardening
-- Safe to run after 001/002/003.

create table if not exists public.economy_operations (
  user_id uuid not null references public.players(user_id) on delete cascade,
  idempotency_key text not null,
  action text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key(user_id,idempotency_key)
);

alter table public.economy_operations enable row level security;
drop policy if exists economy_operations_read_self on public.economy_operations;
create policy economy_operations_read_self on public.economy_operations
  for select to authenticated using (auth.uid()=user_id);
grant select on public.economy_operations to authenticated;
revoke insert,update,delete on public.economy_operations from public,anon,authenticated;

-- Canonical stone migration: Ghost Stone + Dark Stone => Darkness Stone.
with legacy as (
  select user_id,sum(quantity)::bigint as quantity
  from public.player_inventory
  where item_key in ('Ghost Stone','Dark Stone')
  group by user_id
)
insert into public.player_inventory(user_id,item_key,quantity)
select user_id,'Darkness Stone',quantity from legacy
on conflict(user_id,item_key) do update
  set quantity=public.player_inventory.quantity+excluded.quantity,updated_at=now();

delete from public.player_inventory where item_key in ('Ghost Stone','Dark Stone');
delete from public.shop_catalog where item_key in ('Ghost Stone','Dark Stone');
insert into public.shop_catalog(item_key,buy_gold,sell_gold,sellable,category)
values ('Darkness Stone',20000,10000,true,'stone')
on conflict(item_key) do update set
  buy_gold=excluded.buy_gold,
  sell_gold=excluded.sell_gold,
  sellable=excluded.sellable,
  category=excluded.category;

create or replace function public.shop_buy_item(
 p_user uuid,p_item text,p_qty integer,p_idempotency text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare price bigint; total bigint; bal bigint; q bigint; prior jsonb; out_result jsonb;
begin
  if p_idempotency is null or length(trim(p_idempotency))<8 or length(p_idempotency)>180 then raise exception 'invalid idempotency key'; end if;
  if p_qty<1 or p_qty>100 then raise exception 'invalid qty'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user::text||':'||p_idempotency,0));
  select result into prior from economy_operations where user_id=p_user and idempotency_key=p_idempotency;
  if prior is not null then return prior; end if;

  select buy_gold into price from shop_catalog where item_key=p_item and buy_gold is not null;
  if price is null then raise exception 'item not buyable'; end if;
  total:=price*p_qty;
  bal:=apply_wallet_delta(p_user,'gold',-total,'shop_buy',p_item,'wallet:'||p_idempotency);
  q:=adjust_inventory(p_user,p_item,p_qty);
  out_result:=jsonb_build_object('action','shop-buy','item',p_item,'qty',p_qty,'gold',bal,'quantity',q,'spent_gold',total);
  insert into economy_operations(user_id,idempotency_key,action,result) values(p_user,p_idempotency,'shop-buy',out_result);
  return out_result;
end $$;
revoke execute on function public.shop_buy_item(uuid,text,integer,text) from public,anon,authenticated;

create or replace function public.shop_sell_stone(
 p_user uuid,p_item text,p_qty integer,p_idempotency text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare price bigint; total bigint; bal bigint; q bigint; prior jsonb; out_result jsonb;
begin
  if p_idempotency is null or length(trim(p_idempotency))<8 or length(p_idempotency)>180 then raise exception 'invalid idempotency key'; end if;
  if p_qty<1 or p_qty>100 then raise exception 'invalid qty'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user::text||':'||p_idempotency,0));
  select result into prior from economy_operations where user_id=p_user and idempotency_key=p_idempotency;
  if prior is not null then return prior; end if;

  select sell_gold into price from shop_catalog where item_key=p_item and sellable=true and category='stone';
  if price is null then raise exception 'item not sellable'; end if;
  q:=adjust_inventory(p_user,p_item,-p_qty);
  total:=price*p_qty;
  bal:=apply_wallet_delta(p_user,'gold',total,'shop_sell',p_item,'wallet:'||p_idempotency);
  out_result:=jsonb_build_object('action','shop-sell','item',p_item,'qty',p_qty,'gold',bal,'quantity',q,'received_gold',total);
  insert into economy_operations(user_id,idempotency_key,action,result) values(p_user,p_idempotency,'shop-sell',out_result);
  return out_result;
end $$;
revoke execute on function public.shop_sell_stone(uuid,text,integer,text) from public,anon,authenticated;

create or replace function public.craft_element_ball(
 p_user uuid,p_element text,p_idempotency text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare ess text; ball text; qess bigint; qball bigint; prior jsonb; out_result jsonb; el text;
begin
  if p_idempotency is null or length(trim(p_idempotency))<8 or length(p_idempotency)>180 then raise exception 'invalid idempotency key'; end if;
  el:=lower(trim(p_element));
  if el not in ('normal','fire','water','grass','electric','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy') then
    raise exception 'invalid element';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user::text||':'||p_idempotency,0));
  select result into prior from economy_operations where user_id=p_user and idempotency_key=p_idempotency;
  if prior is not null then return prior; end if;

  ess:=case el
    when 'fire' then 'Essência Fogo' when 'water' then 'Essência Água'
    when 'grass' then 'Essência Planta' when 'electric' then 'Essência Elétrica'
    when 'ice' then 'Essência Gelo' when 'fighting' then 'Essência Lutador'
    when 'poison' then 'Essência Veneno' when 'ground' then 'Essência Terra'
    when 'flying' then 'Essência Voador' when 'psychic' then 'Essência Psíquica'
    when 'bug' then 'Essência Inseto' when 'rock' then 'Essência Pedra'
    when 'ghost' then 'Essência Fantasma' when 'dragon' then 'Essência Dragão'
    when 'dark' then 'Essência Sombria' when 'steel' then 'Essência Metal'
    when 'fairy' then 'Essência Fada' else 'Essência Normal' end;
  ball:=initcap(el)||' Ball';
  qess:=adjust_inventory(p_user,ess,-10);
  qball:=adjust_inventory(p_user,ball,1);
  out_result:=jsonb_build_object('action','craft','element',el,'essence',ess,'essence_quantity',qess,'ball',ball,'ball_quantity',qball);
  insert into economy_operations(user_id,idempotency_key,action,result) values(p_user,p_idempotency,'craft',out_result);
  return out_result;
end $$;
revoke execute on function public.craft_element_ball(uuid,text,text) from public,anon,authenticated;
