-- Restored from the applied Supabase migration history (20260928123800).
create policy idle_trade_zone_presence_track on realtime.messages for insert to authenticated with check (extension = 'presence' and (select realtime.topic()) = 'idle-trade-zone');
