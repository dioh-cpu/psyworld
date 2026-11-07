-- Hourly online lottery and rotating Kanto world events.
-- This migration is intentionally local until the isolated branch is approved.

create table if not exists public.campaign_hourly_lottery_presence (
  user_id uuid primary key references public.players(user_id) on delete cascade,
  last_seen_at timestamptz not null
);
create index if not exists campaign_hourly_lottery_presence_seen_idx
  on public.campaign_hourly_lottery_presence(last_seen_at desc);

create table if not exists public.campaign_hourly_lottery_draws (
  slot_start timestamptz primary key,
  winner_user_id uuid not null references public.players(user_id),
  winner_name text not null,
  participants integer not null check (participants > 0),
  reward_gold bigint not null check (reward_gold > 0),
  drawn_at timestamptz not null
);

create table if not exists public.campaign_world_event_slots (
  slot_start timestamptz primary key,
  event_key text not null check (event_key in ('golden_hour','training_surge','gathering_rush','shiny_trail')),
  ends_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp()
);

alter table public.campaign_hourly_lottery_presence enable row level security;
alter table public.campaign_hourly_lottery_draws enable row level security;
alter table public.campaign_world_event_slots enable row level security;
revoke all on table public.campaign_hourly_lottery_presence from public, anon, authenticated;
revoke all on table public.campaign_hourly_lottery_draws from public, anon, authenticated;
revoke all on table public.campaign_world_event_slots from public, anon, authenticated;
grant all on table public.campaign_hourly_lottery_presence to service_role;
grant all on table public.campaign_hourly_lottery_draws to service_role;
grant all on table public.campaign_world_event_slots to service_role;

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

  -- A 90-second lease tolerates mobile background/network jitter; stale rows are pruned on heartbeat.
  delete from public.campaign_hourly_lottery_presence
   where last_seen_at < now_at - interval '90 seconds';

  local_now := now_at at time zone 'America/Sao_Paulo';
  lottery_slot := date_trunc('hour',local_now) at time zone 'America/Sao_Paulo';
  next_lottery := lottery_slot + interval '1 hour';

  -- The slot lock and primary key make the hourly draw single-winner under concurrent heartbeats.
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
      insert into public.campaign_hourly_lottery_draws(
        slot_start,winner_user_id,winner_name,participants,reward_gold,drawn_at
      ) values(lottery_slot,winner_id,winner_name,active_count,25000,now_at)
      on conflict(slot_start) do nothing
      returning * into lottery_draw;
      if found then
        perform public.apply_wallet_delta_v24(
          winner_id,'gold',25000,'campaign_lottery',lottery_slot::text,
          'campaign-lottery-g:'||to_char(lottery_slot at time zone 'UTC','YYYYMMDDHH24')
        );
      else
        select * into lottery_draw
          from public.campaign_hourly_lottery_draws where slot_start=lottery_slot;
      end if;
    end if;
  end if;

  -- Persist one random campaign event for each two-hour Brasília window.
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
      'reward_gold',lottery_draw.reward_gold,'drawn_at',lottery_draw.drawn_at
    ),
    'event',jsonb_build_object(
      'id',event_key,'name',event_label,'description',event_description,
      'starts_at',event_slot,'ends_at',event_end,
      'gold_bonus_pct',gold_bonus,'xp_bonus_pct',xp_bonus,
      'drop_bonus_pct',drop_bonus,'shiny_bonus_pct',shiny_bonus
    ),
    'server_time',now_at
  );
end $$;

revoke execute on function public.psy_campaign_hourly_heartbeat(uuid) from public, anon, authenticated;
grant execute on function public.psy_campaign_hourly_heartbeat(uuid) to service_role;
