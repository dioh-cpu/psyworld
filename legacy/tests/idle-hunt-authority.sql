-- Integration fixture; wrap with the migration when testing before it is applied.
-- All fixture users, assets, rewards and temporary map changes are rolled back.
begin;
create temporary table idle_hunt_test_results(test text);
do $$
declare
  u uuid:=gen_random_uuid();
  req_start uuid:=gen_random_uuid();
  req_early uuid:=gen_random_uuid();
  req_win uuid:=gen_random_uuid();
  req_start_old uuid:=gen_random_uuid();
  req_start_new uuid:=gen_random_uuid();
  req_win_new uuid:=gen_random_uuid();
  req_capture uuid:=gen_random_uuid();
  r jsonb; retry jsonb; ticket_id uuid; next_ticket uuid;
  ball_before bigint; ball_after bigint; pokemon_before bigint; pokemon_after bigint;
  world_gold_before numeric;
begin
  select coalesce(sum(gold),0) into world_gold_before from public.players;
  insert into auth.users(id,email)
    values(u,'idle-hunt-test-'||u||'@example.invalid');

  r:=public.idle_hunt(u,'state',jsonb_build_object('nickname','Idle fixture'),null);
  assert (r->'account'->>'gold')::bigint=500,'fresh Idle account receives only its server starter balance';
  assert (select count(*)=1 from public.idle_assets where owner_id=u and kind='pokemon' and name='Bulbasaur' and bound),'starter Pokémon is isolated and bound';
  assert (select sum(quantity)=3 and bool_and(bound) from public.idle_assets where owner_id=u and name='Pokéball'),'starter Pokéballs are isolated and bound';
  assert not exists(select 1 from public.players where user_id=u),'Idle bootstrap does not create or alter a PSYWORLD player';
  insert into idle_hunt_test_results values('isolated server account and bound starter');

  r:=public.idle_hunt(u,'start',jsonb_build_object('map_key','kanto-001','nickname','ignored after creation'),req_start);
  ticket_id:=(r->'ticket'->>'id')::uuid;
  assert r->'ticket'->>'species_name'='Bulbasaur','route supplies server-owned species';
  assert (r->'ticket'->>'min_duration_ms')::integer>=3000,'ticket enforces minimum encounter time';
  begin
    perform public.idle_hunt(u,'victory',jsonb_build_object('ticket_id',ticket_id),req_early);
    raise exception 'fixture_expected_battle_too_fast';
  exception when others then
    if sqlerrm<>'battle_too_fast' then raise; end if;
  end;
  update public.idle_hunt_tickets set issued_at=clock_timestamp()-interval '5 seconds' where id=ticket_id;
  r:=public.idle_hunt(u,'victory',jsonb_build_object('ticket_id',ticket_id),req_win);
  retry:=public.idle_hunt(u,'victory',jsonb_build_object('ticket_id',ticket_id),req_win);
  assert r=retry,'same reward request returns the original receipt';
  assert (r->>'gold_awarded')::bigint=7 and (r->>'xp_awarded')::bigint=5,'server computes bounded reward values';
  assert (select count(*)=1 from public.idle_ledger where user_id=u and reason='idle_hunt'),'retry cannot mint a second reward';
  assert (select trainer_xp=5 from public.idle_hunt_profiles where user_id=u),'server profile receives server-computed XP';
  insert into idle_hunt_test_results values('ticket timing, bounded reward, idempotent retry');

  r:=public.idle_hunt(u,'start',jsonb_build_object('map_key','kanto-001'),req_start_old);
  ticket_id:=(r->'ticket'->>'id')::uuid;
  update public.idle_hunt_maps set min_trainer_level=1 where map_key='kanto-002';
  r:=public.idle_hunt(u,'start',jsonb_build_object('map_key','kanto-002'),req_start_new);
  next_ticket:=(r->'ticket'->>'id')::uuid;
  assert (select status='expired' from public.idle_hunt_tickets where id=ticket_id),'switching routes invalidates abandoned encounter tickets';
  update public.idle_hunt_tickets set issued_at=clock_timestamp()-interval '5 seconds',rarity_index=0,rarity_name='Lixo',rarity_mult=1,tier='D'
    where id=next_ticket;
  update public.idle_hunt_profiles set last_victory_at=clock_timestamp()-interval '5 seconds' where user_id=u;
  perform public.idle_hunt(u,'victory',jsonb_build_object('ticket_id',next_ticket),req_win_new);
  select coalesce(sum(quantity),0) into ball_before from public.idle_assets where owner_id=u and name='Pokéball';
  select count(*) into pokemon_before from public.idle_assets where owner_id=u and kind='pokemon';
  r:=public.idle_hunt(u,'capture',jsonb_build_object('ticket_id',next_ticket,'ball','Pokéball','gold',999999,'species_id',999),req_capture);
  retry:=public.idle_hunt(u,'capture',jsonb_build_object('ticket_id',next_ticket,'ball','Pokéball','gold',999999,'species_id',999),req_capture);
  assert r=retry,'capture retry returns the original server result';
  select coalesce(sum(quantity),0) into ball_after from public.idle_assets where owner_id=u and name='Pokéball';
  assert ball_after=ball_before-1,'server consumes exactly one owned Ball';
  select count(*) into pokemon_after from public.idle_assets where owner_id=u and kind='pokemon';
  if (r->>'captured')::boolean then
    assert pokemon_after=pokemon_before+1,'successful capture creates one server-owned asset';
    assert (select (data->>'id')::integer=(r->>'species_id')::integer and not bound from public.idle_assets where id=(r->>'asset_id')::uuid),'capture asset data comes from the server ticket';
  else
    assert pokemon_after=pokemon_before,'failed capture creates no Pokémon asset';
  end if;
  begin
    perform public.idle_hunt(u,'capture',jsonb_build_object('ticket_id',next_ticket,'ball','Pokéball'),gen_random_uuid());
    raise exception 'fixture_expected_capture_already_attempted';
  exception when others then
    if sqlerrm<>'capture_unavailable' then raise; end if;
  end;
  insert into idle_hunt_test_results values('server RNG, asset data isolation, one capture attempt per ticket');

  assert (select coalesce(sum(gold),0)=world_gold_before from public.players),'PSYWORLD wallet remains unchanged';
  assert not has_function_privilege('authenticated','public.idle_hunt(uuid,text,jsonb,uuid)','EXECUTE'),'authenticated clients cannot call the service RPC';
  assert has_function_privilege('service_role','public.idle_hunt(uuid,text,jsonb,uuid)','EXECUTE'),'server role can call the hunt RPC';
  assert not has_table_privilege('authenticated','public.idle_hunt_profiles','SELECT'),'hunt tables are not directly exposed to clients';
  assert (select bool_and(relrowsecurity) from pg_class where oid in (
    'public.idle_hunt_maps'::regclass,'public.idle_hunt_profiles'::regclass,
    'public.idle_hunt_tickets'::regclass,'public.idle_hunt_receipts'::regclass,
    'public.idle_hunt_qualities'::regclass)),'all hunt tables have RLS enabled';
  insert into idle_hunt_test_results values('service-only grants, RLS and PSYWORLD isolation');
end $$;
select * from idle_hunt_test_results;
rollback;
