-- PSYWORLD V25 — reusable server-only reward receipts

create table if not exists public.server_reward_receipts (
  user_id uuid not null references public.players(user_id) on delete cascade,
  idempotency_key text not null,
  source text not null,
  reference_id text,
  reward jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key(user_id,idempotency_key)
);

alter table public.server_reward_receipts enable row level security;
drop policy if exists server_reward_receipts_read_self on public.server_reward_receipts;
create policy server_reward_receipts_read_self on public.server_reward_receipts
  for select to authenticated using (auth.uid()=user_id);
grant select on public.server_reward_receipts to authenticated;
revoke insert,update,delete on public.server_reward_receipts from public,anon,authenticated;

create or replace function public.grant_server_reward(
  p_user uuid,
  p_source text,
  p_reference text,
  p_idempotency text,
  p_gold bigint default 0,
  p_diamonds bigint default 0,
  p_items jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  prior jsonb;
  gold_after bigint;
  diamonds_after bigint;
  item_record record;
  qty bigint;
  inventory_out jsonb := '{}'::jsonb;
  out_result jsonb;
begin
  if p_idempotency is null or length(trim(p_idempotency))<8 or length(p_idempotency)>180 then raise exception 'invalid idempotency key'; end if;
  if p_source not in ('battle','capture','drop','afk','battlepass','achievement','egg','pack','survivor','quest','system') then raise exception 'invalid reward source'; end if;
  if p_gold<0 or p_diamonds<0 then raise exception 'negative reward'; end if;
  if p_gold>1000000000 or p_diamonds>1000000 then raise exception 'reward too large'; end if;
  if jsonb_typeof(coalesce(p_items,'{}'::jsonb))<>'object' then raise exception 'invalid items'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user::text||':'||p_idempotency,0));
  select result into prior from server_reward_receipts where user_id=p_user and idempotency_key=p_idempotency;
  if prior is not null then return prior; end if;

  select gold,diamonds into gold_after,diamonds_after from players where user_id=p_user for update;
  if gold_after is null then raise exception 'missing player'; end if;

  if p_gold>0 then gold_after:=apply_wallet_delta(p_user,'gold',p_gold,p_source,p_reference,'reward-gold:'||p_idempotency); end if;
  if p_diamonds>0 then diamonds_after:=apply_wallet_delta(p_user,'diamonds',p_diamonds,p_source,p_reference,'reward-diamonds:'||p_idempotency); end if;

  for item_record in select key,value from jsonb_each(coalesce(p_items,'{}'::jsonb)) loop
    qty:=(item_record.value #>> '{}')::bigint;
    if qty<1 or qty>100000 then raise exception 'invalid item reward qty'; end if;
    inventory_out:=inventory_out||jsonb_build_object(item_record.key,adjust_inventory(p_user,item_record.key,qty));
  end loop;

  out_result:=jsonb_build_object(
    'source',p_source,'reference_id',p_reference,'gold',gold_after,'diamonds',diamonds_after,'inventory',inventory_out
  );
  insert into server_reward_receipts(user_id,idempotency_key,source,reference_id,reward,result)
  values(p_user,p_idempotency,p_source,p_reference,jsonb_build_object('gold',p_gold,'diamonds',p_diamonds,'items',coalesce(p_items,'{}'::jsonb)),out_result);
  return out_result;
end $$;

revoke execute on function public.grant_server_reward(uuid,text,text,text,bigint,bigint,jsonb) from public,anon,authenticated;
