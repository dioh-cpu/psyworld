-- Add a luck-weighted Psyball bonus to the existing hourly lottery.
-- Gold remains guaranteed; the item reward is selected and granted atomically by Postgres.

alter table public.campaign_hourly_lottery_draws
  add column if not exists reward_psyballs integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname='campaign_hourly_lottery_draws_reward_psyballs_check'
       and conrelid='public.campaign_hourly_lottery_draws'::regclass
  ) then
    alter table public.campaign_hourly_lottery_draws
      add constraint campaign_hourly_lottery_draws_reward_psyballs_check
      check (reward_psyballs between 0 and 5);
  end if;
end $$;

create or replace function public.psy_campaign_hourly_heartbeat(p_user uuid)
returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  now_at timestamptz := clock_timestamp();
  local_now timestamp without time zone;
  lottery_slot timestamptz;
  next_lottery timestamptz;
  event_slot_local timestamp without time zone;
  event_slot timestamptz;
  event_key text;
  event_end timestamptz;
  active_count integer := 0;
  winner_id uuid;
  winner_name text;
  reward_roll double precision;
  reward_psyballs integer := 0;
  psyball_balance bigint;
  lottery_draw public.campaign_hourly_lottery_draws%rowtype;
  event_label text;
  event_description text;
  gold_bonus numeric := 0;
  xp_bonus numeric := 0;
  drop_bonus numeric := 0;
  shiny_bonus numeric := 0;
begin
  if p_user is null or not exists (select 1 from public.players where user_id=p_user) then
    raise exception 'missing player';
  end if;

  insert into public.campaign_hourly_lottery_presence(user_id,last_seen_at)
  values(p_user,now_at)
  on conflict(user_id) do update set last_seen_at=excluded.last_seen_at;

  delete from public.campaign_hourly_lottery_presence
   where last_seen_at < now_at - interval '90 seconds';

  local_now := now_at at time zone 'America/Sao_Paulo';
  lottery_slot := date_trunc('hour',local_now) at time zone 'America/Sao_Paulo';
  next_lottery := lottery_slot + interval '1 hour';

  perform pg_advisory_xact_lock(hashtextextended('psyworld-campaign-lottery:'||lottery_slot::text,0));
  select * into lottery_draw
    from public.campaign_hourly_lottery_draws where slot_start=lottery_slot;
  if not found then
    select count(*)::integer into active_count
      from public.campaign_hourly_lottery_presence
     where last_seen_at >= now_at - interval '90 seconds';
    if active_count > 0 then
      select presence.user_id,left(coalesce(nullif(player.trainer_name,''),'Treinador'),32)
        into winner_id,winner_name
        from public.campaign_hourly_lottery_presence presence
        join public.players player on player.user_id=presence.user_id
       where presence.last_seen_at >= now_at - interval '90 seconds'
       order by random() limit 1;

      -- Weighted random award: 0 balls 70%, 1 ball 18%, 2 balls 8%,
      -- 3 balls 3%, 4 balls 0.9%, and the 5-ball jackpot 0.1% (1 in 1,000).
      reward_roll := random();
      reward_psyballs := case
        when reward_roll < 0.70 then 0
        when reward_roll < 0.88 then 1
        when reward_roll < 0.96 then 2
        when reward_roll < 0.99 then 3
        when reward_roll < 0.999 then 4
        else 5
      end;

      insert into public.campaign_hourly_lottery_draws(
        slot_start,winner_user_id,winner_name,participants,reward_gold,reward_psyballs,drawn_at
      ) values(lottery_slot,winner_id,winner_name,active_count,25000,reward_psyballs,now_at)
      on conflict(slot_start) do nothing
      returning * into lottery_draw;
      if found then
        perform public.apply_wallet_delta_v24(
          winner_id,'gold',25000,'campaign_lottery',lottery_slot::text,
          'campaign-lottery-g:'||to_char(lottery_slot at time zone 'UTC','YYYYMMDDHH24')
        );
        if lottery_draw.reward_psyballs > 0 then
          psyball_balance := public.adjust_inventory(winner_id,'Psyball',lottery_draw.reward_psyballs);
        end if;
      else
        select * into lottery_draw
          from public.campaign_hourly_lottery_draws where slot_start=lottery_slot;
      end if;
    end if;
  end if;

  event_slot_local := date_trunc('hour',local_now)
    - make_interval(hours => mod(extract(hour from local_now)::integer,2));
  event_slot := event_slot_local at time zone 'America/Sao_Paulo';
  event_key := (array['golden_hour','training_surge','gathering_rush','shiny_trail'])
    [1+floor(random()*4)::integer];
  insert into public.campaign_world_event_slots(slot_start,event_key,ends_at)
  values(event_slot,event_key,event_slot+interval '2 hours')
  on conflict(slot_start) do nothing;
  select slot.event_key,slot.ends_at into event_key,event_end
    from public.campaign_world_event_slots slot where slot.slot_start=event_slot;

  if event_key='golden_hour' then
    event_label:='Hora Dourada'; event_description:='+20% Gold nas vitórias da campanha.'; gold_bonus:=20;
  elsif event_key='training_surge' then
    event_label:='Pulso de Treinamento'; event_description:='+25% XP nas vitórias da campanha.'; xp_bonus:=25;
  elsif event_key='gathering_rush' then
    event_label:='Rotas em Abundância'; event_description:='+20% de chance nos drops de batalha.'; drop_bonus:=20;
  else
    event_label:='Rastro Brilhante'; event_description:='+0,025 ponto percentual na chance de encontro Shiny.'; shiny_bonus:=0.025;
  end if;

  return jsonb_build_object(
    'lottery',jsonb_build_object(
      'slot_start',lottery_slot,'next_draw_at',next_lottery,
      'drawn',lottery_draw.slot_start is not null,
      'participants',coalesce(lottery_draw.participants,active_count),
      'winner_name',lottery_draw.winner_name,
      'reward_gold',lottery_draw.reward_gold,
      'reward_psyballs',coalesce(lottery_draw.reward_psyballs,0),
      'drawn_at',lottery_draw.drawn_at
    ),
    'event',jsonb_build_object(
      'id',event_key,'name',event_label,'description',event_description,
      'starts_at',event_slot,'ends_at',event_end,
      'gold_bonus_pct',gold_bonus,'xp_bonus_pct',xp_bonus,
      'drop_bonus_pct',drop_bonus,'shiny_bonus_pct',shiny_bonus
    ),
    'inventory',case when psyball_balance is null then '{}'::jsonb
                     else jsonb_build_object('Psyball',psyball_balance) end,
    'server_time',now_at
  );
end $$;

revoke execute on function public.psy_campaign_hourly_heartbeat(uuid) from public, anon, authenticated;
grant execute on function public.psy_campaign_hourly_heartbeat(uuid) to service_role;
