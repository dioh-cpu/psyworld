-- Restored from the applied Supabase migration history (20260928114852).
-- Complete expired lots even when no players are connected.
create or replace function public.idle_expire_commerce()
returns integer language plpgsql security invoker set search_path='' as $$
declare lot record; processed integer:=0;
begin
 if not pg_catalog.pg_try_advisory_xact_lock(284916,1) then return 0; end if;
 for lot in select id from public.idle_listings where status='active' and expires_at<=now() order by expires_at,id limit 100 loop
  perform public.idle_settle(lot.id);
  processed:=processed+1;
 end loop;
 if processed>0 then perform realtime.send('{"changed":true}'::jsonb,'changed','idle-commerce',true); end if;
 return processed;
end $$;
revoke all on function public.idle_expire_commerce() from public,anon,authenticated;
grant execute on function public.idle_expire_commerce() to service_role;
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('idle-commerce-expiry','* * * * *','select public.idle_expire_commerce()');
