-- Keep authenticated clients from the previous release online until the
-- guest-chat client is deployed; new guests use the public broadcast.
create or replace function public.psy_idle_chat_broadcast()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  message_payload jsonb := jsonb_build_object(
    'id',new.id,
    'channel',new.channel,
    'username',new.username,
    'body',new.body,
    'created_at',new.created_at
  );
  topic text := 'psyworld-idle-chat:' || new.channel;
begin
  perform realtime.send(message_payload,'INSERT',topic,true);
  perform realtime.send(message_payload,'INSERT',topic,false);
  return null;
end;
$$;
revoke all on function public.psy_idle_chat_broadcast() from public,anon,authenticated;
