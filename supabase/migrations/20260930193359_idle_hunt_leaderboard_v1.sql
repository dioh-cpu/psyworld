-- Verified Hunt activity feeds the Psy Idle global leaderboard.
-- Only server-awarded wins, successful captures, and AFK settlements are counted.
create table public.idle_hunt_leaderboard_daily_stats (
  user_id uuid not null references public.idle_accounts(user_id) on delete cascade,
  stat_date date not null,
  kills bigint not null default 0 check (kills >= 0),
  captures bigint not null default 0 check (captures >= 0),
  xp_earned bigint not null default 0 check (xp_earned >= 0),
  gold_earned bigint not null default 0 check (gold_earned >= 0),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (user_id, stat_date)
);
create index idle_hunt_leaderboard_daily_date on public.idle_hunt_leaderboard_daily_stats(stat_date, xp_earned desc);
alter table public.idle_hunt_leaderboard_daily_stats enable row level security;
revoke all on public.idle_hunt_leaderboard_daily_stats from public, anon, authenticated;
grant select, insert, update, delete on public.idle_hunt_leaderboard_daily_stats to service_role;

create table public.idle_hunt_leaderboard_claims (
  user_id uuid not null references public.idle_accounts(user_id) on delete cascade,
  request_id uuid not null,
  period_key text not null check (period_key in ('daily','weekly','monthly')),
  period_start date not null,
  rank integer not null check (rank between 1 and 3),
  score bigint not null check (score >= 0),
  gold_awarded bigint not null check (gold_awarded > 0),
  result jsonb not null default '{}'::jsonb,
  claimed_at timestamptz not null default clock_timestamp(),
  primary key (user_id, request_id),
  unique (user_id, period_key, period_start)
);
alter table public.idle_hunt_leaderboard_claims enable row level security;
revoke all on public.idle_hunt_leaderboard_claims from public, anon, authenticated;
grant select, insert, update, delete on public.idle_hunt_leaderboard_claims to service_role;

-- XP earned from validated hunts determines rank; kills, captures and Gold are
-- shown for context and used as deterministic tie breakers.
create or replace function public.idle_hunt_leaderboard_period_data(
  p_user_id uuid, p_period_start date, p_period_end date
) returns jsonb
language sql stable security invoker set search_path='' as $$
  with totals as (
    select user_id, sum(kills)::bigint as kills, sum(captures)::bigint as captures,
      sum(xp_earned)::bigint as xp_earned, sum(gold_earned)::bigint as gold_earned
    from public.idle_hunt_leaderboard_daily_stats
    where stat_date >= p_period_start and stat_date < p_period_end
    group by user_id
  ), ranked as (
    select t.user_id, coalesce(a.nickname,'Treinador') as nickname,
      coalesce(h.trainer_level,1) as trainer_level, t.kills, t.captures,
      t.xp_earned, t.gold_earned, t.xp_earned as score,
      row_number() over (order by t.xp_earned desc, t.kills desc, t.captures desc,
        t.gold_earned desc, t.user_id asc) as position_rank
    from totals t
    join public.idle_accounts a on a.user_id=t.user_id
    left join public.idle_hunt_profiles h on h.user_id=t.user_id
  )
  select jsonb_build_object(
    'entries', coalesce((
      select jsonb_agg(jsonb_build_object(
        'rank',position_rank,'nickname',nickname,'trainer_level',trainer_level,
        'is_me',user_id=p_user_id,
        'score',score,'kills',kills,'captures',captures,'xp_earned',xp_earned,'gold_earned',gold_earned
      ) order by position_rank) from ranked where position_rank<=50
    ),'[]'::jsonb),
    'me',(select jsonb_build_object(
        'rank',position_rank,'nickname',nickname,'trainer_level',trainer_level,
        'is_me',user_id=p_user_id,
        'score',score,'kills',kills,'captures',captures,'xp_earned',xp_earned,'gold_earned',gold_earned
      ) from ranked where user_id=p_user_id)
  )
$$;
revoke all on function public.idle_hunt_leaderboard_period_data(uuid,date,date) from public, anon, authenticated;
grant execute on function public.idle_hunt_leaderboard_period_data(uuid,date,date) to service_role;

create or replace function public.idle_hunt_leaderboard_reward_gold(p_period_key text,p_rank integer)
returns bigint language sql immutable security invoker set search_path='' as $$
  select case p_period_key
    when 'daily' then case p_rank when 1 then 10000 when 2 then 5000 when 3 then 2500 else 0 end
    when 'weekly' then case p_rank when 1 then 50000 when 2 then 25000 when 3 then 12500 else 0 end
    when 'monthly' then case p_rank when 1 then 150000 when 2 then 75000 when 3 then 37500 else 0 end
    else 0 end::bigint
$$;
revoke all on function public.idle_hunt_leaderboard_reward_gold(text,integer) from public, anon, authenticated;
grant execute on function public.idle_hunt_leaderboard_reward_gold(text,integer) to service_role;

create or replace function public.idle_hunt_leaderboard_period_json(
  p_user_id uuid, p_period_key text, p_period_start date, p_period_end date,
  p_previous_start date, p_previous_end date
) returns jsonb
language sql stable security invoker set search_path='' as $$
  with current_data as (
    select public.idle_hunt_leaderboard_period_data(p_user_id,p_period_start,p_period_end) as data
  ), previous_data as (
    select public.idle_hunt_leaderboard_period_data(p_user_id,p_previous_start,p_previous_end) as data
  ), prior_claim as (
    select * from public.idle_hunt_leaderboard_claims
    where user_id=p_user_id and period_key=p_period_key and period_start=p_previous_start
  ), previous_me as (
    select data->'me' as me from previous_data
  )
  select jsonb_build_object(
    'key',p_period_key,'timezone','UTC','period_start',p_period_start,'period_end',p_period_end,
    'ends_at',p_period_end::timestamp at time zone 'UTC',
    'seconds_remaining',greatest(0,extract(epoch from ((p_period_end::timestamp at time zone 'UTC')-clock_timestamp()))::bigint),
    'score_metric','XP de Hunt','entries',(select data->'entries' from current_data),
    'me',(select data->'me' from current_data),
    'prizes',jsonb_build_object('1',public.idle_hunt_leaderboard_reward_gold(p_period_key,1),
      '2',public.idle_hunt_leaderboard_reward_gold(p_period_key,2),
      '3',public.idle_hunt_leaderboard_reward_gold(p_period_key,3)),
    'last_period',jsonb_build_object(
      'period_start',p_previous_start,'period_end',p_previous_end,
      'rank',coalesce(((select me from previous_me)->>'rank')::integer,0),
      'score',coalesce(((select me from previous_me)->>'score')::bigint,0),
      'eligible',coalesce(((select me from previous_me)->>'rank')::integer between 1 and 3,false),
      'claimed',exists(select 1 from prior_claim),
      'claimable',coalesce(((select me from previous_me)->>'rank')::integer between 1 and 3,false)
        and not exists(select 1 from prior_claim),
      'gold_awarded',coalesce((select gold_awarded from prior_claim),
        public.idle_hunt_leaderboard_reward_gold(p_period_key,coalesce(((select me from previous_me)->>'rank')::integer,0))),
      'claimed_at',(select claimed_at from prior_claim)
    )
  )
$$;
revoke all on function public.idle_hunt_leaderboard_period_json(uuid,text,date,date,date,date) from public, anon, authenticated;
grant execute on function public.idle_hunt_leaderboard_period_json(uuid,text,date,date,date,date) to service_role;

create or replace function public.idle_hunt_leaderboard(u uuid, act text, p jsonb, req uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
#variable_conflict use_variable
declare
  nickname text;
  now_utc timestamp without time zone;
  today_start date;
  week_start date;
  month_start date;
  period_key text;
  period_start date;
  period_end date;
  period_data jsonb;
  me jsonb;
  rank_value integer:=0;
  score_value bigint:=0;
  gold_awarded bigint:=0;
  account public.idle_accounts;
  existing public.idle_hunt_leaderboard_claims;
  result jsonb;
begin
  if u is null then raise exception 'auth_required'; end if;
  if act not in ('board','claim') then raise exception 'unknown_action'; end if;
  if jsonb_typeof(coalesce(p,'{}'::jsonb))<>'object' then raise exception 'invalid_request'; end if;
  nickname:=left(coalesce(nullif(trim(p->>'nickname'),''),'Treinador'),24);
  perform public.idle_hunt(u,'state',jsonb_build_object('nickname',nickname),null);
  now_utc:=clock_timestamp() at time zone 'UTC';
  today_start:=now_utc::date;
  week_start:=date_trunc('week',now_utc)::date;
  month_start:=date_trunc('month',now_utc)::date;

  if act='board' then
    return jsonb_build_object('ok',true,'generated_at',clock_timestamp(),'timezone','UTC','score_metric','XP de Hunt',
      'periods',jsonb_build_object(
        'daily',public.idle_hunt_leaderboard_period_json(u,'daily',today_start,today_start+1,today_start-1,today_start),
        'weekly',public.idle_hunt_leaderboard_period_json(u,'weekly',week_start,week_start+7,week_start-7,week_start),
        'monthly',public.idle_hunt_leaderboard_period_json(u,'monthly',month_start,(month_start+interval '1 month')::date,(month_start-interval '1 month')::date,month_start)
      ));
  end if;

  period_key:=lower(coalesce(p->>'period',''));
  if period_key='daily' then
    period_start:=today_start-1; period_end:=today_start;
  elsif period_key='weekly' then
    period_start:=week_start-7; period_end:=week_start;
  elsif period_key='monthly' then
    period_start:=(month_start-interval '1 month')::date; period_end:=month_start;
  else
    raise exception 'invalid_period';
  end if;
  if req is null then raise exception 'request_id_required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(u::text||':idle-leaderboard:'||period_key||':'||period_start::text,0));
  select * into existing from public.idle_hunt_leaderboard_claims
    where user_id=u and request_id=req;
  if found then
    if existing.period_key<>period_key or existing.period_start<>period_start then raise exception 'request_conflict'; end if;
    return jsonb_build_object('ok',true,'claimed',true,'already_claimed',true,
      'period',period_key,'period_start',period_start,'rank',existing.rank,'score',existing.score,
      'reward_gold',existing.gold_awarded,'gold_awarded',0,'claimed_at',existing.claimed_at);
  end if;
  select * into existing from public.idle_hunt_leaderboard_claims
    where idle_hunt_leaderboard_claims.user_id=u
      and idle_hunt_leaderboard_claims.period_key=period_key
      and idle_hunt_leaderboard_claims.period_start=period_start;
  if found then
    return jsonb_build_object('ok',true,'claimed',true,'already_claimed',true,
      'period',period_key,'period_start',period_start,'rank',existing.rank,'score',existing.score,
      'reward_gold',existing.gold_awarded,'gold_awarded',0,'claimed_at',existing.claimed_at);
  end if;

  period_data:=public.idle_hunt_leaderboard_period_data(u,period_start,period_end);
  me:=period_data->'me';
  rank_value:=coalesce((me->>'rank')::integer,0);
  score_value:=coalesce((me->>'score')::bigint,0);
  gold_awarded:=public.idle_hunt_leaderboard_reward_gold(period_key,rank_value);
  if gold_awarded<=0 then
    return jsonb_build_object('ok',true,'claimed',false,'eligible',false,'period',period_key,
      'period_start',period_start,'period_end',period_end,'rank',rank_value,'score',score_value,'gold_awarded',0);
  end if;
  update public.idle_accounts set gold=gold+gold_awarded,revision=revision+1
    where user_id=u returning * into account;
  if account.user_id is null then raise exception 'idle_account_not_found'; end if;
  insert into public.idle_ledger(user_id,currency,amount,reason)
    values(u,'gold',gold_awarded,'idle_leaderboard:'||period_key);
  result:=jsonb_build_object('ok',true,'claimed',true,'already_claimed',false,'period',period_key,
    'period_start',period_start,'period_end',period_end,'rank',rank_value,'score',score_value,
    'reward_gold',gold_awarded,'gold_awarded',gold_awarded,'account',to_jsonb(account));
  insert into public.idle_hunt_leaderboard_claims(user_id,request_id,period_key,period_start,rank,score,gold_awarded,result)
    values(u,req,period_key,period_start,rank_value,score_value,gold_awarded,result);
  perform realtime.send(jsonb_build_object('changed',true),'changed','idle-commerce',true);
  return result;
end $$;
revoke all on function public.idle_hunt_leaderboard(uuid,text,jsonb,uuid) from public, anon, authenticated;
grant execute on function public.idle_hunt_leaderboard(uuid,text,jsonb,uuid) to service_role;

create or replace function public.idle_hunt(u uuid,act text,p jsonb,req uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
#variable_conflict use_variable
declare
  account public.idle_accounts; profile public.idle_hunt_profiles;
  m public.idle_hunt_maps; t public.idle_hunt_tickets;
  prior public.idle_hunt_receipts; inserted_profile uuid;
  result jsonb; ticket_id uuid; map_key text; ball text; ball_mult numeric;
  rarity_low integer; rarity_high integer; weight_total numeric; roll numeric;
  rarity_name text; rarity_mult numeric; rarity_index integer;
  capture_chance numeric; tier_penalty numeric; captured_ok boolean;
  gold_reward bigint; xp_reward bigint:=20; drop_name text;
  xp_after bigint; trainer_level integer; next_xp bigint;
  asset public.idle_assets;
  reward record;
  drop_multiplier numeric:=1;
  score_date date;
begin
  if u is null then raise exception 'auth_required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(u::text||':idle-hunt',0));
  insert into public.idle_accounts(user_id,nickname)
    values(u,left(coalesce(nullif(p->>'nickname',''),'Treinador'),24)) on conflict(user_id) do nothing;
  insert into public.idle_hunt_profiles(user_id) values(u)
    on conflict(user_id) do nothing returning user_id into inserted_profile;
  if inserted_profile is not null
     and not exists(select 1 from public.idle_assets where owner_id=u)
     and not exists(select 1 from public.idle_ledger where user_id=u)
     and not exists(select 1 from public.idle_listings where seller_id=u)
     and not exists(select 1 from public.idle_commerce_receipts where user_id=u)
     and exists(select 1 from public.idle_accounts where user_id=u and gold=0 and psycoin=0 and revision=0) then
    update public.idle_accounts set gold=gold+500,revision=revision+1 where user_id=u;
    insert into public.idle_ledger(user_id,currency,amount,reason) values(u,'gold',500,'idle_starter');
    insert into public.idle_assets(owner_id,kind,category,name,quantity,bound,data) values
      (u,'pokemon','pokemon','Bulbasaur',1,true,'{"id":1,"name":"Bulbasaur","level":1,"tier":"D","rarity":{"n":"Quase Lixo","mult":1.1},"psyIdleOrigin":"idle-server"}'),
      (u,'item','item','Pokéball',3,true,'{"idle_starter":true}');
  end if;
  select * into account from public.idle_accounts where user_id=u for update;
  select * into profile from public.idle_hunt_profiles where user_id=u for update;
  update public.idle_hunt_tickets set status='expired'
    where user_id=u and status in ('started','won') and expires_at<=clock_timestamp();

  if act='state' then
    return jsonb_build_object('account',to_jsonb(account),'hunter',to_jsonb(profile));
  end if;
  if req is null then raise exception 'request_id_required'; end if;
  select * into prior from public.idle_hunt_receipts where user_id=u and request_id=req;
  if found then
    if prior.action<>act or prior.payload<>coalesce(p,'{}'::jsonb) then raise exception 'request_conflict'; end if;
    return prior.result;
  end if;

  if act='start' then
    map_key:=left(trim(coalesce(p->>'map_key','')),64);
    select * into m from public.idle_hunt_maps where public.idle_hunt_maps.map_key=map_key;
    if m.map_key is null then raise exception 'map_unavailable_online'; end if;
    if profile.trainer_level<m.min_trainer_level then raise exception 'map_locked_server'; end if;
    update public.idle_hunt_tickets set status='expired'
      where user_id=u and status='started' and expires_at>clock_timestamp() and public.idle_hunt_tickets.map_key<>m.map_key;
    if (select count(*) from public.idle_hunt_tickets where user_id=u and status='started' and expires_at>clock_timestamp())>=10 then
      raise exception 'too_many_active_encounters';
    end if;
    select quality_index into rarity_low from public.idle_hunt_qualities where name=m.min_quality;
    select quality_index into rarity_high from public.idle_hunt_qualities where name=m.max_quality;
    select coalesce(sum(weight),0) into weight_total from public.idle_hunt_qualities
      where quality_index between rarity_low and rarity_high;
    if weight_total>0 then
      roll:=random()*weight_total;
      select q.name,q.multiplier,q.quality_index into rarity_name,rarity_mult,rarity_index
      from (select name,multiplier,quality_index,sum(weight) over(order by quality_index) as running_weight
        from public.idle_hunt_qualities where quality_index between rarity_low and rarity_high) q
      where q.running_weight>=roll order by q.quality_index limit 1;
    else
      select name,multiplier,quality_index into rarity_name,rarity_mult,rarity_index
      from public.idle_hunt_qualities where quality_index=rarity_low;
    end if;
    ticket_id:=gen_random_uuid();
    insert into public.idle_hunt_tickets(id,user_id,map_key,species_id,species_name,enemy_level,tier,rarity_name,rarity_mult,rarity_index,min_duration_seconds,expires_at)
      values(ticket_id,u,m.map_key,m.species_id,m.species_name,m.enemy_level,m.tier,rarity_name,rarity_mult,rarity_index,
        greatest(3,least(10,m.enemy_level*.06)),clock_timestamp()+interval '20 minutes');
    result:=jsonb_build_object('ok',true,'ticket',jsonb_build_object(
      'id',ticket_id,'map_key',m.map_key,'species_id',m.species_id,'species_name',m.species_name,
      'level',m.enemy_level,'tier',m.tier,'rarity',jsonb_build_object('n',rarity_name,'mult',rarity_mult),
      'min_duration_ms',round(greatest(3,least(10,m.enemy_level*.06))*1000),'expires_at',clock_timestamp()+interval '20 minutes'));
  elsif act='victory' then
    begin ticket_id:=(p->>'ticket_id')::uuid; exception when others then raise exception 'invalid_ticket'; end;
    select * into t from public.idle_hunt_tickets where id=ticket_id and user_id=u for update;
    if t.id is null then raise exception 'ticket_not_found'; end if;
    if t.status='won' then result:=t.victory_result;
    else
      if t.status<>'started' or t.expires_at<=clock_timestamp() then raise exception 'ticket_unavailable'; end if;
      if clock_timestamp()<t.issued_at+make_interval(secs=>t.min_duration_seconds) then raise exception 'battle_too_fast'; end if;
      if profile.last_victory_at is not null and clock_timestamp()<profile.last_victory_at+interval '3 seconds' then raise exception 'reward_cooldown'; end if;
      select * into reward from public.idle_hunt_reward_profile(t.enemy_level);
      gold_reward:=reward.gold;
      xp_reward:=reward.xp;
      drop_multiplier:=reward.drop_multiplier;
      xp_after:=profile.trainer_xp+xp_reward;trainer_level:=profile.trainer_level;
      loop
        exit when trainer_level>=10000;
        next_xp:=450+75*(trainer_level-1)+5*(trainer_level-1)*(trainer_level-1);
        exit when xp_after<next_xp;
        xp_after:=xp_after-next_xp;trainer_level:=trainer_level+1;
      end loop;
      update public.idle_accounts set gold=gold+gold_reward,revision=revision+1 where user_id=u returning * into account;
      insert into public.idle_ledger(user_id,currency,amount,reason) values(u,'gold',gold_reward,'idle_hunt');
      drop_name:=null;roll:=random();
      if roll<.025*drop_multiplier then drop_name:='Pokéball';elsif roll<.04*drop_multiplier then drop_name:='Great Ball';elsif roll<.045*drop_multiplier then drop_name:='Poção 50';end if;
      if drop_name is not null then
        insert into public.idle_assets(owner_id,kind,category,name,quantity,bound,data)
          values(u,'item','item',drop_name,1,false,'{"idle_reward":"hunt"}');
      end if;
      update public.idle_hunt_profiles set trainer_level=trainer_level,trainer_xp=xp_after,
        total_kills=total_kills+1,last_victory_at=clock_timestamp(),updated_at=clock_timestamp()
        where user_id=u returning * into profile;
      score_date:=(clock_timestamp() at time zone 'UTC')::date;
      insert into public.idle_hunt_leaderboard_daily_stats(user_id,stat_date,kills,captures,xp_earned,gold_earned)
        values(u,score_date,1,0,xp_reward,gold_reward)
        on conflict(user_id,stat_date) do update set
          kills=public.idle_hunt_leaderboard_daily_stats.kills+excluded.kills,
          xp_earned=public.idle_hunt_leaderboard_daily_stats.xp_earned+excluded.xp_earned,
          gold_earned=public.idle_hunt_leaderboard_daily_stats.gold_earned+excluded.gold_earned;
      result:=jsonb_build_object('ok',true,'ticket_id',ticket_id,'gold_awarded',gold_reward,'xp_awarded',xp_reward,
        'trainer_xp_awarded',xp_reward,'pokemon_xp_awarded',xp_reward,'drop',drop_name,
        'account',to_jsonb(account),'hunter',to_jsonb(profile));
      update public.idle_hunt_tickets set status='won',victory_at=clock_timestamp(),victory_result=result where id=ticket_id;
    end if;
  elsif act='capture' then
    begin ticket_id:=(p->>'ticket_id')::uuid; exception when others then raise exception 'invalid_ticket'; end;
    ball:=left(trim(coalesce(p->>'ball','')),40);
    ball_mult:=case ball when 'Pokéball' then 1 when 'Great Ball' then 1.5 when 'Super Ball' then 2 when 'Ultra Ball' then 3 when 'Premier Ball' then 1.5 else null end;
    if ball_mult is null then raise exception 'invalid_ball'; end if;
    select * into t from public.idle_hunt_tickets where id=ticket_id and user_id=u for update;
    if t.id is null or t.status<>'won' or t.expires_at<=clock_timestamp() or t.capture_attempted then raise exception 'capture_unavailable'; end if;
    if t.rarity_index>4 then raise exception 'capture_quality_locked'; end if;
    select * into asset from public.idle_assets where owner_id=u and name=ball and quantity>0 order by bound desc,created_at for update limit 1;
    if asset.id is null then raise exception 'online_ball_unavailable'; end if;
    if asset.quantity=1 then delete from public.idle_assets where id=asset.id;
    else update public.idle_assets set quantity=quantity-1 where id=asset.id; end if;
    tier_penalty:=case t.tier when 'D' then .08 when 'C' then .18 when 'B' then .35 when 'A' then .65 when 'S' then 1 when 'SS' then 1.4 when 'SSS' then 1.8 when 'UR' then 2 when 'UR+' then 2.5 when 'UR++' then 3 else 0 end;
    capture_chance:=least(.42,greatest(.004,.30*ball_mult/sqrt(t.rarity_mult)/(1+tier_penalty)));
    captured_ok:=random()<=capture_chance;
    if captured_ok then
      insert into public.idle_assets(owner_id,kind,category,name,quantity,bound,data)
       values(u,'pokemon','pokemon',t.species_name,1,false,jsonb_build_object(
        'id',t.species_id,'name',t.species_name,'level',1,'exp',0,'tier',t.tier,
        'rarity',jsonb_build_object('n',t.rarity_name,'mult',t.rarity_mult),'shiny',false,
        'psyIdleOrigin','idle-server')) returning * into asset;
      update public.idle_hunt_profiles set total_captures=total_captures+1,updated_at=clock_timestamp()
        where user_id=u returning * into profile;
      score_date:=(clock_timestamp() at time zone 'UTC')::date;
      insert into public.idle_hunt_leaderboard_daily_stats(user_id,stat_date,captures)
        values(u,score_date,1)
        on conflict(user_id,stat_date) do update set
          captures=public.idle_hunt_leaderboard_daily_stats.captures+excluded.captures;
    end if;
    result:=jsonb_build_object('ok',true,'ticket_id',ticket_id,'captured',captured_ok,'chance',capture_chance,
      'species_id',t.species_id,'species_name',t.species_name,'asset_id',case when captured_ok then asset.id else null end,
      'account',to_jsonb(account),'hunter',to_jsonb(profile));
    update public.idle_hunt_tickets set capture_attempted=true,captured=captured_ok,capture_result=result where id=ticket_id;
  else
    raise exception 'unknown_action';
  end if;
  insert into public.idle_hunt_receipts(user_id,request_id,action,payload,result)
    values(u,req,act,coalesce(p,'{}'::jsonb),coalesce(result,'{}'::jsonb));
  if act in ('victory','capture') then
    perform realtime.send(jsonb_build_object('changed',true),'changed','idle-commerce',true);
  end if;
  return result;
end $$;

CREATE OR REPLACE FUNCTION public.idle_hunt_farm(u uuid, act text, p jsonb, req uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
  attacker_atk numeric:=35;
  attacker_level integer:=1;
  enemy_hp integer:=0;
  estimated_damage integer:=0;
  attacks_to_kill integer:=1;
  seconds_per_kill integer:=7;
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
  reward record;
  xp_per_kill bigint:=20;
  gold_per_kill bigint:=1;
  drop_multiplier numeric:=1;
  score_date date;
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
      select * into m from public.idle_hunt_maps where public.idle_hunt_maps.map_key=coalesce(profile.farm_map_key, map_key);
      if m.map_key is not null and profile.trainer_level>=m.min_trainer_level then
        -- Estimate hits-to-defeat from the active Idle Pokémon and the target hunt HP.
        -- Active teams are currently stored locally. Never use client-reported
        -- ATK/level for offline rewards or leaderboard score; derive a neutral
        -- baseline solely from server-earned trainer progression instead.
        attacker_level:=greatest(1,profile.trainer_level);
        attacker_atk:=20+7*attacker_level;
        enemy_hp:=greatest(30,floor((65+m.enemy_level*8)*1.5)::integer);
        estimated_damage:=greatest(15,floor(((attacker_atk*72.0/55)+(attacker_level*3))*(100.0/(100+floor(enemy_hp*.18)*.15)))::integer);
        attacks_to_kill:=greatest(1,ceil(enemy_hp::numeric/estimated_damage)::integer);
        seconds_per_kill:=greatest(7,attacks_to_kill*7);
        simulated_kills:=least(floor(28800.0/seconds_per_kill)::integer,floor(elapsed_seconds::numeric/seconds_per_kill)::integer);
      else
        simulated_kills:=0;
      end if;
    end if;

    if simulated_kills>0 then
      select * into reward from public.idle_hunt_reward_profile(m.enemy_level);
      xp_per_kill:=reward.xp;
      gold_per_kill:=reward.gold;
      drop_multiplier:=reward.drop_multiplier;
      gold_reward:=simulated_kills*gold_per_kill;
      xp_reward:=simulated_kills*xp_per_kill;
      pokemon_xp:=xp_reward;
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
        if roll<.08*drop_multiplier then item_name:='Pokéball'; drop_counts:=jsonb_set(drop_counts,'{Pokéball}',to_jsonb(coalesce((drop_counts->>'Pokéball')::integer,0)+1),true); end if;
        roll:=random();
        if roll<.035*drop_multiplier then item_name:='Great Ball'; drop_counts:=jsonb_set(drop_counts,'{Great Ball}',to_jsonb(coalesce((drop_counts->>'Great Ball')::integer,0)+1),true); end if;
        roll:=random();
        if roll<.015*drop_multiplier then item_name:='Super Ball'; drop_counts:=jsonb_set(drop_counts,'{Super Ball}',to_jsonb(coalesce((drop_counts->>'Super Ball')::integer,0)+1),true); end if;
        roll:=random();
        if roll<.04*drop_multiplier then item_name:='Poção 200'; drop_counts:=jsonb_set(drop_counts,'{Poção 200}',to_jsonb(coalesce((drop_counts->>'Poção 200')::integer,0)+1),true); end if;
        roll:=random();
        if roll<.02*drop_multiplier then item_name:='Revive'; drop_counts:=jsonb_set(drop_counts,'{Revive}',to_jsonb(coalesce((drop_counts->>'Revive')::integer,0)+1),true); end if;
        roll:=random();
        if roll<.03*drop_multiplier then item_name:='Essence Of Fire'; drop_counts:=jsonb_set(drop_counts,array[item_name],to_jsonb(coalesce((drop_counts->>item_name)::integer,0)+1),true); end if;
        roll:=random();
        if roll<.06*drop_multiplier then
          item_name:=(array['Rubber Ball','Fire Tail','Water Gem','Seed','Great Petal','Screw','Electric Rat Tail','Snowball','Ice Orb','Band Aid','Bottle Of Poison','Bug Venom','Earth Ball','Piece Of Diglett','Straw','Enchanted Gem','Psychic Spoon','Bug Gosme','Bug Antenna','Ghost Essence','Bat Wing','Dragon Scale','Dragon Tooth','Dark Gem','Dark Ear','Piece Of Steel','Metal Hull','Cute Ball'])[1+floor(random()*28)::integer];
          drop_counts:=jsonb_set(drop_counts,array[item_name],to_jsonb(coalesce((drop_counts->>item_name)::integer,0)+1),true);
        end if;
        roll:=random();
        if roll<.01*drop_multiplier then
          item_name:=(array['Giant Piece Of Fur','Water Pendant','Great Petal','Electric Rat Tail','Ice Orb','Belt Of Champion','Bug Venom','Piece Of Diglett','Giant Beak','Psychic Spoon','Bug Antenna','Strange Rock','Bat Wing','Dragon Tooth','Dark Ear','Metal Hull','Cute Ball'])[1+floor(random()*17)::integer];
          drop_counts:=jsonb_set(drop_counts,array[item_name],to_jsonb(coalesce((drop_counts->>item_name)::integer,0)+1),true);
        end if;
        roll:=random();
        if roll<.0015*drop_multiplier then
          item_name:=(array['Fire Stone','Water Stone','Leaf Stone','Thunder Stone','Ice Stone','Fighting Stone','Poison Stone','Ground Stone','Flying Stone','Psychic Stone','Bug Stone','Rock Stone','Ghost Stone','Dragon Stone','Dark Stone','Metal Stone','Fairy Stone','Normal Stone','Moon Stone'])[1+floor(random()*19)::integer];
          drop_counts:=jsonb_set(drop_counts,array[item_name],to_jsonb(coalesce((drop_counts->>item_name)::integer,0)+1),true);
        end if;
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
      score_date:=(clock_timestamp() at time zone 'UTC')::date;
      insert into public.idle_hunt_leaderboard_daily_stats(user_id,stat_date,kills,xp_earned,gold_earned)
        values(u,score_date,simulated_kills,xp_reward,gold_reward)
        on conflict(user_id,stat_date) do update set
          kills=public.idle_hunt_leaderboard_daily_stats.kills+excluded.kills,
          xp_earned=public.idle_hunt_leaderboard_daily_stats.xp_earned+excluded.xp_earned,
          gold_earned=public.idle_hunt_leaderboard_daily_stats.gold_earned+excluded.gold_earned;
    end if;
    update public.idle_hunt_profiles set farm_map_key=map_key,farm_checkpoint_at=clock_timestamp(),farm_enabled=farm_enabled_next,
      updated_at=clock_timestamp() where user_id=u returning * into profile;
    result:=jsonb_build_object('ok',true,'elapsed_seconds',elapsed_seconds,'kills_awarded',simulated_kills,
      'gold_awarded',gold_reward,'xp_awarded',pokemon_xp,'trainer_xp_awarded',xp_reward,
      'pokemon_xp_awarded',pokemon_xp,'drops',drop_counts,'species_id',m.species_id,'claimed_map_key',m.map_key,'account',to_jsonb(account),'hunter',to_jsonb(profile));
  else
    update public.idle_hunt_profiles set farm_map_key=map_key,farm_checkpoint_at=clock_timestamp(),farm_enabled=farm_enabled_next,
      updated_at=clock_timestamp() where user_id=u returning * into profile;
    result:=jsonb_build_object('ok',true,'checkpoint_at',profile.farm_checkpoint_at,'hunter',to_jsonb(profile));
  end if;

  insert into public.idle_hunt_farm_receipts(user_id,request_id,action,payload,result)
    values(u,req,act,coalesce(p,'{}'::jsonb),coalesce(result,'{}'::jsonb));
  if act='claim' then perform realtime.send(jsonb_build_object('changed',true),'changed','idle-commerce',true); end if;
  return result;
end $function$
;
