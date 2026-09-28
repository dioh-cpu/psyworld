-- Restored from the applied Supabase migration history (20260928122110).
-- Players may join and see presence only in the Idle Trade Zone room.
create policy idle_trade_zone_presence_read on realtime.messages
for select to authenticated
using (extension='presence' and (select realtime.topic())='idle-trade-zone');
