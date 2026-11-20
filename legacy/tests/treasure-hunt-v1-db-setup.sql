\set ON_ERROR_STOP on
do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
do $$ begin create role service_role; exception when duplicate_object then null; end $$;

create table public.players(
 user_id uuid primary key,trainer_level integer not null default 1,
 gold bigint not null default 0,diamonds bigint not null default 0,psycoin bigint not null default 0
);
create table public.player_system_state(user_id uuid primary key references public.players(user_id),state jsonb not null default '{}',revision bigint not null default 0,updated_at timestamptz not null default now());
create table public.game_action_receipts(user_id uuid not null,idempotency_key text not null,action text not null,result jsonb not null,created_at timestamptz not null default now(),primary key(user_id,idempotency_key));
create table public.player_inventory(user_id uuid not null,item_key text not null,quantity bigint not null default 0,primary key(user_id,item_key));
create table public.wallet_ledger(user_id uuid not null,currency text not null,amount bigint not null,reason text not null,reference_id text not null,idempotency_key text not null unique,balance_after bigint not null);

create or replace function public.adjust_inventory(p_user uuid,p_item text,p_delta bigint) returns bigint
language plpgsql as $$ declare q bigint; begin
 insert into player_inventory(user_id,item_key,quantity) values(p_user,p_item,0) on conflict(user_id,item_key) do nothing;
 update player_inventory set quantity=quantity+p_delta where user_id=p_user and item_key=p_item and quantity+p_delta>=0 returning quantity into q;
 if q is null then raise exception 'invalid inventory delta';end if;return q;
end $$;
create or replace function public.apply_wallet_delta_v24(p_user uuid,p_currency text,p_amount bigint,p_reason text,p_reference text,p_idempotency text) returns bigint
language plpgsql as $$ declare q bigint;begin
 select balance_after into q from wallet_ledger where idempotency_key=p_idempotency;if found then return q;end if;
 if p_currency='gold' then update players set gold=gold+p_amount where user_id=p_user and gold+p_amount>=0 returning gold into q;
 elsif p_currency='diamonds' then update players set diamonds=diamonds+p_amount where user_id=p_user and diamonds+p_amount>=0 returning diamonds into q;
 elsif p_currency='psycoin' then update players set psycoin=psycoin+p_amount where user_id=p_user and psycoin+p_amount>=0 returning psycoin into q;
 else raise exception 'invalid currency';end if;
 if q is null then raise exception 'insufficient balance';end if;
 insert into wallet_ledger values(p_user,p_currency,p_amount,p_reason,p_reference,p_idempotency,q);return q;
end $$;
create or replace function public.psy_v26_snapshot(p_user uuid) returns jsonb language sql stable as $$
 select jsonb_build_object('player',to_jsonb(p),'inventory',coalesce((select jsonb_object_agg(item_key,quantity) from player_inventory where user_id=p_user and quantity>0),'{}'::jsonb),'system',coalesce((select state from player_system_state where user_id=p_user),'{}'::jsonb)) from players p where p.user_id=p_user
$$;

insert into players(user_id,trainer_level,gold,diamonds,psycoin)
values('11111111-1111-4111-8111-111111111111',5,0,20,0);
