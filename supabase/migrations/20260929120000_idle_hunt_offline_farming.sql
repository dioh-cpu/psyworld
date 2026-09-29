-- Server-authoritative Psy Idle offline farming.
-- Catch-up is settled once on resume/checkpoint and capped at eight hours.
alter table public.idle_hunt_profiles
  add column if not exists farm_map_key text,
  add column if not exists farm_checkpoint_at timestamptz,
  add column if not exists farm_enabled boolean not null default true;

create table if not exists public.idle_hunt_farm_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  action text not null check (action in ('claim','checkpoint')),
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp(),
  primary key (user_id, request_id)
);
alter table public.idle_hunt_farm_receipts enable row level security;
revoke all on public.idle_hunt_farm_receipts from public, anon, authenticated;
grant select, insert, update, delete on public.idle_hunt_farm_receipts to service_role;

create or replace function public.idle_hunt_farm(u uuid, act text, p jsonb, req uuid)
returns jsonb
language plpgsql
security invoker
set search_path=''
as $$
#variable_conflict use_variable
declare
  account public.idle_accounts;
  profile public.idle_hunt_profiles;
  m public.idle_hunt_maps;
  prior public.idle_hunt_farm_receipts;
  map_key text;
  nickname text;
  elapsed_seconds integer:=0;
  simulated_kills integer:=0;
  gold_reward bigint:=0;
  xp_reward bigint:=0;
  pokemon_xp bigint:=0;
  xp_after bigint;
  trainer_level integer;
  next_xp bigint;
  drop_counts jsonb:='{}'::jsonb;
  item_name text;
  item_qty integer;
  i integer;
  roll numeric;
  result jsonb;
  farm_enabled_next boolean:=coalesce((p->>'auto_farm')::boolean,true);
begin
  if u is null then raise exception 'auth_required'; end if;
  if act not in ('claim','checkpoint') then raise exception 'unknown_action'; end if;
  if req is null then raise exception 'request_id_required'; end if;
  if jsonb_typeof(coalesce(p,'{}'::jsonb))<>'object' then raise exception 'invalid_request'; end if;

  perform pg_advisory_xact_lock(hashtextextended(u::text||':idle-hunt',0));
  nickname:=left(coalesce(nullif(trim(p->>'nickname'),''),'Treinador'),24);
  -- Bootstrap the existing Idle account/profile through the established server RPC.
  perform public.idle_hunt(u,'state',jsonb_build_object('nickname',nickname),null);

  select * into prior from public.idle_hunt_farm_receipts
    where user_id=u and request_id=req;
  if found then
    if prior.action<>act or prior.payload<>coalesce(p,'{}'::jsonb) then
      raise exception 'request_conflict';
    end if;
    return prior.result;
  end if;

  map_key:=left(trim(coalesce(p->>'map_key','')),64);
  select * into m from public.idle_hunt_maps where public.idle_hunt_maps.map_key=map_key;
  if m.map_key is null then raise exception 'map_unavailable_online'; end if;

  select * into account from public.idle_accounts where user_id=u for update;
  select * into profile from public.idle_hunt_profiles where user_id=u for update;

  if act='claim' then
    if profile.farm_checkpoint_at is not null and profile.farm_enabled then
      elapsed_seconds:=least(28800,greatest(0,floor(extract(epoch from (clock_timestamp()-profile.farm_checkpoint_at)))::integer));
      select * into m from public.idle_hunt_maps where public.idle_hunt_maps.map_key=coalesce(profile.farm_map_key,map_key);
      if m.map_key is not null and profile.trainer_level>=m.min_trainer_level then
        simulated_kills:=least(2400,floor(elapsed_seconds/12.0)::integer);
      else
        simulated_kills:=0;
      end if;
    end if;

    if simulated_kills>0 then
      gold_reward:=simulated_kills*greatest(1,floor((m.enemy_level*2+8)*.15)::bigint);
      xp_reward:=simulated_kills*20;
      pokemon_xp:=simulated_kills*20;
      xp_after:=profile.trainer_xp+xp_reward;
      trainer_level:=profile.trainer_level;
      loop
        exit when trainer_level>=10000;
        next_xp:=450+75*(trainer_level-1)+5*(trainer_level-1)*(trainer_level-1);
        exit when xp_after<next_xp;
        xp_after:=xp_after-next_xp;
        trainer_level:=trainer_level+1;
      end loop;

      -- Independent server-side rolls: items are loot and remain bound.
      for i in 1..simulated_kills loop
        roll:=random();
        if roll<.08 then item_name:='Pokéball'; drop_counts:=jsonb_set(drop_counts,'{Pokéball}',to_jsonb(coalesce((drop_counts->>'Pokéball')::integer,0)+1),true); end if;
        roll:=random();
        if roll<.035 then item_name:='Great Ball'; drop_counts:=jsonb_set(drop_counts,'{Great Ball}',to_jsonb(coalesce((drop_counts->>'Great Ball')::integer,0)+1),true); end if;
        roll:=random();
        if roll<.015 then item_name:='Super Ball'; drop_counts:=jsonb_set(drop_counts,'{Super Ball}',to_jsonb(coalesce((drop_counts->>'Super Ball')::integer,0)+1),true); end if;
        roll:=random();
        if roll<.04 then item_name:='Poção 200'; drop_counts:=jsonb_set(drop_counts,'{Poção 200}',to_jsonb(coalesce((drop_counts->>'Poção 200')::integer,0)+1),true); end if;
        roll:=random();
        if roll<.02 then item_name:='Revive'; drop_counts:=jsonb_set(drop_counts,'{Revive}',to_jsonb(coalesce((drop_counts->>'Revive')::integer,0)+1),true); end if;
      end loop;

      update public.idle_accounts set gold=gold+gold_reward,revision=revision+1
        where user_id=u returning * into account;
      insert into public.idle_ledger(user_id,currency,amount,reason)
        values(u,'gold',gold_reward,'idle_offline_hunt');
      update public.idle_hunt_profiles set trainer_level=trainer_level,trainer_xp=xp_after,
        total_kills=total_kills+simulated_kills,updated_at=clock_timestamp()
        where user_id=u returning * into profile;

      for item_name,item_qty in select key,(value#>>'{}')::integer from jsonb_each(drop_counts) loop
        if item_qty>0 then
          insert into public.idle_assets(owner_id,kind,category,name,quantity,bound,data)
            values(u,'item','item',item_name,item_qty,true,jsonb_build_object('idle_reward','offline_hunt'));
        end if;
      end loop;
    end if;
    update public.idle_hunt_profiles set farm_map_key=map_key,farm_checkpoint_at=clock_timestamp(),farm_enabled=farm_enabled_next,
      updated_at=clock_timestamp() where user_id=u returning * into profile;
    result:=jsonb_build_object('ok',true,'elapsed_seconds',elapsed_seconds,'kills_awarded',simulated_kills,
      'gold_awarded',gold_reward,'xp_awarded',pokemon_xp,'trainer_xp_awarded',xp_reward,
      'drops',drop_counts,'species_id',m.species_id,'claimed_map_key',m.map_key,'account',to_jsonb(account),'hunter',to_jsonb(profile));
  else
    update public.idle_hunt_profiles set farm_map_key=map_key,farm_checkpoint_at=clock_timestamp(),farm_enabled=farm_enabled_next,
      updated_at=clock_timestamp() where user_id=u returning * into profile;
    result:=jsonb_build_object('ok',true,'checkpoint_at',profile.farm_checkpoint_at,'hunter',to_jsonb(profile));
  end if;

  insert into public.idle_hunt_farm_receipts(user_id,request_id,action,payload,result)
    values(u,req,act,coalesce(p,'{}'::jsonb),coalesce(result,'{}'::jsonb));
  if act='claim' then perform realtime.send(jsonb_build_object('changed',true),'changed','idle-commerce',true); end if;
  return result;
end $$;

revoke all on function public.idle_hunt_farm(uuid,text,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.idle_hunt_farm(uuid,text,jsonb,uuid) to service_role;
