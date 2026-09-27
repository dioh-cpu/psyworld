-- Authenticated private rooms and ephemeral presence for the first shared World map.
-- Position broadcasts are cosmetic only; combat, collision and rewards stay client-local.

create table if not exists public.psy_world_rooms (
  id uuid primary key default gen_random_uuid(),
  region text not null unique check (region in ('kanto','johto','hoenn','sinnoh','unova','kalos','alola','galar','paldea')),
  capacity integer not null default 40 check (capacity between 2 and 80),
  created_at timestamptz not null default now()
);

insert into public.psy_world_rooms(region) values
  ('kanto'),('johto'),('hoenn'),('sinnoh'),('unova'),('kalos'),('alola'),('galar'),('paldea')
on conflict (region) do nothing;

create table if not exists public.psy_world_room_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  room_id uuid not null references public.psy_world_rooms(id) on delete cascade,
  nickname text not null default 'Treinador' check (char_length(nickname) between 1 and 24),
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index if not exists psy_world_room_members_room_seen_idx
  on public.psy_world_room_members(room_id,last_seen_at desc);

alter table public.psy_world_rooms enable row level security;
alter table public.psy_world_room_members enable row level security;
revoke all on public.psy_world_rooms from public,anon,authenticated;
revoke all on public.psy_world_room_members from public,anon,authenticated;
grant select on public.psy_world_room_members to authenticated;
grant select,insert,update,delete on public.psy_world_rooms,public.psy_world_room_members to service_role;

drop policy if exists psy_world_room_member_read_own on public.psy_world_room_members;
create policy psy_world_room_member_read_own
  on public.psy_world_room_members for select to authenticated
  using (user_id=(select auth.uid()));

create or replace function public.psy_world_enter_room(p_user_id uuid,p_region text,p_nickname text)
returns table(room_id uuid,topic text,players_online integer,capacity integer)
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_room_id uuid;
  v_capacity integer;
  v_count integer;
  v_online integer;
  v_nickname text;
begin
  if p_user_id is null then raise exception using message='auth_required',errcode='P0001'; end if;
  if p_region not in ('kanto','johto','hoenn','sinnoh','unova','kalos','alola','galar','paldea') then
    raise exception using message='invalid_region',errcode='P0001';
  end if;

  perform pg_advisory_xact_lock(hashtext('psyworld:world-room:'||p_region));
  select r.id,r.capacity into v_room_id,v_capacity
    from public.psy_world_rooms as r where r.region=p_region;
  if v_room_id is null then raise exception using message='invalid_region',errcode='P0001'; end if;

  delete from public.psy_world_room_members as m
    where m.room_id=v_room_id and m.last_seen_at < clock_timestamp()-interval '60 seconds';

  select count(*) into v_online from public.psy_world_room_members as m
    where m.room_id=v_room_id and m.user_id<>p_user_id
      and m.last_seen_at >= clock_timestamp()-interval '60 seconds';
  if v_online>=v_capacity then raise exception using message='world_room_full',errcode='P0001'; end if;

  v_nickname:=left(regexp_replace(trim(coalesce(p_nickname,'')),'[[:cntrl:]]','','g'),24);
  if v_nickname='' then v_nickname:='Treinador'; end if;

  insert into public.psy_world_room_members(user_id,room_id,nickname,joined_at,last_seen_at)
    values(p_user_id,v_room_id,v_nickname,clock_timestamp(),clock_timestamp())
    on conflict(user_id) do update
      set room_id=excluded.room_id,nickname=excluded.nickname,joined_at=excluded.joined_at,last_seen_at=excluded.last_seen_at;

  select count(*) into v_count from public.psy_world_room_members as m
    where m.room_id=v_room_id and m.last_seen_at >= clock_timestamp()-interval '60 seconds';
  return query select v_room_id,'psyworld-world-room:'||v_room_id::text,v_count,v_capacity;
end;
$$;

create or replace function public.psy_world_room_heartbeat(p_user_id uuid,p_room_id uuid)
returns boolean
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_count integer;
begin
  if p_user_id is null or p_room_id is null then return false; end if;
  update public.psy_world_room_members
    set last_seen_at=clock_timestamp()
    where user_id=p_user_id and room_id=p_room_id;
  get diagnostics v_count=row_count;
  return v_count=1;
end;
$$;

create or replace function public.psy_world_room_leave(p_user_id uuid,p_room_id uuid)
returns boolean
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_count integer;
begin
  if p_user_id is null or p_room_id is null then return false; end if;
  delete from public.psy_world_room_members
    where user_id=p_user_id and room_id=p_room_id;
  get diagnostics v_count=row_count;
  return v_count=1;
end;
$$;

revoke all on function public.psy_world_enter_room(uuid,text,text) from public,anon,authenticated;
revoke all on function public.psy_world_room_heartbeat(uuid,uuid) from public,anon,authenticated;
revoke all on function public.psy_world_room_leave(uuid,uuid) from public,anon,authenticated;
grant execute on function public.psy_world_enter_room(uuid,text,text) to service_role;
grant execute on function public.psy_world_room_heartbeat(uuid,uuid) to service_role;
grant execute on function public.psy_world_room_leave(uuid,uuid) to service_role;

drop policy if exists psy_world_room_realtime_receive on realtime.messages;
create policy psy_world_room_realtime_receive
  on realtime.messages for select to authenticated
  using (
    extension in ('broadcast','presence')
    and exists (
      select 1 from public.psy_world_room_members as m
      where m.user_id=(select auth.uid())
        and m.room_id::text=substr((select realtime.topic()),length('psyworld-world-room:')+1)
        and m.last_seen_at >= now()-interval '60 seconds'
    )
  );

drop policy if exists psy_world_room_realtime_publish on realtime.messages;
create policy psy_world_room_realtime_publish
  on realtime.messages for insert to authenticated
  with check (
    extension in ('broadcast','presence')
    and exists (
      select 1 from public.psy_world_room_members as m
      where m.user_id=(select auth.uid())
        and m.room_id::text=substr((select realtime.topic()),length('psyworld-world-room:')+1)
        and m.last_seen_at >= now()-interval '60 seconds'
    )
  );
