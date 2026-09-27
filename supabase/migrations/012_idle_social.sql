-- Psy Idle: persistent player chat with authenticated Realtime broadcasts.
-- The three gameplay logs remain local-only and are never inserted here.

create table if not exists public.psy_idle_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null check (char_length(username) between 1 and 32),
  channel text not null check (channel in ('global','doubts','trade')),
  body text not null check (char_length(body) between 1 and 240),
  created_at timestamptz not null default now()
);

create index if not exists psy_idle_chat_history_idx
  on public.psy_idle_chat_messages(channel,created_at desc);

alter table public.psy_idle_chat_messages enable row level security;
drop policy if exists psy_idle_chat_read_authenticated on public.psy_idle_chat_messages;
create policy psy_idle_chat_read_authenticated
  on public.psy_idle_chat_messages for select to authenticated using (true);
revoke insert,update,delete on public.psy_idle_chat_messages from public,anon,authenticated;
grant select on public.psy_idle_chat_messages to authenticated;

-- The lock table has no client policies or grants; it only enforces a send cooldown.
create table if not exists public.psy_idle_chat_rate_limit (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_sent_at timestamptz not null
);
alter table public.psy_idle_chat_rate_limit enable row level security;
revoke all on public.psy_idle_chat_rate_limit from public,anon,authenticated;

create or replace function public.psy_idle_send_chat(p_channel text,p_body text)
returns public.psy_idle_chat_messages
language plpgsql
security definer
set search_path=''
as $$
declare
  uid uuid := auth.uid();
  clean_channel text := lower(trim(coalesce(p_channel,'')));
  clean_body text := trim(coalesce(p_body,''));
  display_name text;
  locked_uid uuid;
  result public.psy_idle_chat_messages;
begin
  if uid is null then raise exception 'auth_required'; end if;
  if clean_channel not in ('global','doubts','trade') then raise exception 'invalid_chat_channel'; end if;
  if char_length(clean_body)<1 or char_length(clean_body)>240 then raise exception 'invalid_chat_message'; end if;

  insert into public.psy_idle_chat_rate_limit(user_id,last_sent_at)
    values(uid,clock_timestamp())
    on conflict(user_id) do update set last_sent_at=excluded.last_sent_at
      where public.psy_idle_chat_rate_limit.last_sent_at < clock_timestamp()-interval '1200 milliseconds'
    returning user_id into locked_uid;
  if locked_uid is null then raise exception 'chat_rate_limited'; end if;

  select left(coalesce(
      nullif(trim(raw_user_meta_data->>'trainer_name'),''),
      nullif(trim(raw_user_meta_data->>'name'),''),
      'Treinador'
    ),32)
    into display_name from auth.users where id=uid;
  display_name := coalesce(display_name,'Treinador');

  insert into public.psy_idle_chat_messages(user_id,username,channel,body)
    values(uid,display_name,clean_channel,clean_body)
    returning * into result;
  return result;
end;
$$;
revoke all on function public.psy_idle_send_chat(text,text) from public,anon;
grant execute on function public.psy_idle_send_chat(text,text) to authenticated;

create or replace function public.psy_idle_chat_broadcast()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  perform realtime.send(
    jsonb_build_object(
      'id',new.id,
      'channel',new.channel,
      'username',new.username,
      'body',new.body,
      'created_at',new.created_at
    ),
    'INSERT',
    'psyworld-idle-chat:' || new.channel,
    true
  );
  return null;
end;
$$;
revoke all on function public.psy_idle_chat_broadcast() from public,anon,authenticated;
drop trigger if exists psy_idle_chat_broadcast_after_insert on public.psy_idle_chat_messages;
create trigger psy_idle_chat_broadcast_after_insert
  after insert on public.psy_idle_chat_messages
  for each row execute function public.psy_idle_chat_broadcast();

-- Supabase owns the realtime schema; adding an RLS policy on realtime.messages is supported.
drop policy if exists psy_idle_chat_receive on realtime.messages;
create policy psy_idle_chat_receive
  on realtime.messages for select to authenticated
  using (
    extension='broadcast'
    and (select realtime.topic()) in (
      'psyworld-idle-chat:global',
      'psyworld-idle-chat:doubts',
      'psyworld-idle-chat:trade'
    )
  );
