\set ON_ERROR_STOP on
do $$
declare r jsonb;u uuid:='11111111-1111-4111-8111-111111111111';i integer;before_gold bigint;before_diamonds bigint;chest_tier text;expected_xp bigint;expected_diamonds bigint;
begin
 r:=psy_v28_treasure_action_v1(u,'unlock','{"action":"unlock","hobby":"treasureHunter"}'::jsonb,'db-hunter-unlock-01');
 if coalesce((r#>>'{system,treasure_hunt,hobbies,treasureHunter,level}')::integer,0)<>1 then raise exception 'hunter unlock failed';end if;
 for i in 1..4 loop
  r:=psy_v28_treasure_action_v1(u,'dig',jsonb_build_object('site','cave-1'),'db-hit-'||i||'-000000');
  if coalesce((r->>'complete')::boolean,true) then raise exception 'reward completed before fifth impact';end if;
 end loop;
 if coalesce((select quantity from player_inventory where user_id=u and item_key='Fragmento Antigo'),0)<>0 then raise exception 'premature fragment';end if;
 r:=psy_v28_treasure_action_v1(u,'dig','{"site":"cave-1"}'::jsonb,'db-hit-five-0001');
 if not coalesce((r->>'complete')::boolean,false) then raise exception 'fifth impact did not complete';end if;
 if coalesce((r#>>'{system,treasure_hunt,stats,digs}')::bigint,0)<>1 then raise exception 'dig tally mismatch';end if;
 if coalesce((select sum(quantity) from player_inventory where user_id=u and item_key in ('Fragmento Antigo','Pedra Antiga')),0)<1 then raise exception 'treasure reward mismatch';end if;
 before_gold:=(select gold from players where user_id=u);
 perform psy_v28_treasure_action_v1(u,'dig','{"site":"cave-1"}'::jsonb,'db-hit-five-0001');
 if (select gold from players where user_id=u)<>before_gold then raise exception 'idempotent retry duplicated gold';end if;
 r:=psy_v28_treasure_action_v1(u,'unlock','{"hobby":"looter"}'::jsonb,'db-looter-unlock-01');
 if coalesce((r#>>'{system,treasure_hunt,hobbies,looter,level}')::integer,0)<>1 then raise exception 'looter unlock failed';end if;
 select key into chest_tier from jsonb_each_text(r#>'{system,treasure_hunt,chests}') where value::integer>0 limit 1;
 expected_xp:=case chest_tier when 'common' then 60 when 'rare' then 100 when 'epic' then 180 else 360 end;
 r:=psy_v28_treasure_action_v1(u,'open-chest',jsonb_build_object('tier',chest_tier),'db-open-chest-01');
 if coalesce((r->>'xp')::bigint,0)<>expected_xp then raise exception 'looter XP mismatch';end if;
 update player_system_state set state=jsonb_set(state,'{treasure_hunt,hobbies,looter,level}','10'::jsonb,true) where user_id=u;
 select diamonds into before_diamonds from players where user_id=u;
 r:=psy_v28_treasure_action_v1(u,'treasure-roll','{}'::jsonb,'db-treasure-roll-01');
 expected_diamonds:=before_diamonds-10+case when r#>>'{prize,kind}'='diamonds' then coalesce((r#>>'{prize,quantity}')::bigint,0) else 0 end;
 if coalesce((r#>>'{player,diamonds}')::bigint,before_diamonds)<>expected_diamonds then raise exception 'treasure roll wallet result invalid';end if;
 perform psy_v28_treasure_action_v1(u,'treasure-roll','{}'::jsonb,'db-treasure-roll-01');
 if (select diamonds from players where user_id=u)<>(r#>>'{player,diamonds}')::bigint then raise exception 'treasure roll retry duplicated currency';end if;
 update player_system_state set state=jsonb_set(state,'{treasure_hunt,cosmetic}','{"bountyHunter":true,"equipped":true}'::jsonb,true) where user_id=u;
 r:=psy_v27_battle_reward(u,'world',100,'Flying',0,0,0,'db-battle-costume-01');
 if coalesce((r->>'bounty_bonus')::boolean,false) is not true or coalesce((r->>'gold_reward')::bigint,0)<>660 or coalesce((r->>'xp_reward')::bigint,0)<>550 then raise exception 'bounty costume battle bonus mismatch';end if;
 if has_function_privilege('authenticated','public.psy_v28_treasure_action_v1(uuid,text,jsonb,text)','execute') then raise exception 'authenticated can execute treasure RPC';end if;
 if not has_function_privilege('service_role','public.psy_v28_treasure_action_v1(uuid,text,jsonb,text)','execute') then raise exception 'service role cannot execute treasure RPC';end if;
 raise notice 'PASS: treasure SQL rewards, five-hit completion, chest XP, currency idempotency, costume battle bonus, server-only RPC grant';
end $$;

do $$
declare
 u uuid:='11111111-1111-4111-8111-111111111111';
 before_receipts bigint;after_receipts bigint;before_revision bigint;after_revision bigint;
 seed_no integer;seed_value double precision;sample double precision;found_seed boolean:=false;
 r jsonb;i integer;before_psycoin bigint;
begin
 select count(*) into before_receipts from game_action_receipts where user_id=u;
 select revision into before_revision from player_system_state where user_id=u;
 r:=psy_v28_treasure_action_v1(u,'status','{}'::jsonb,'db-status-probe-01');
 if r->>'ok'<>'true' or (r->>'version')::integer<>1 then raise exception 'availability probe result mismatch';end if;
 select count(*) into after_receipts from game_action_receipts where user_id=u;
 select revision into after_revision from player_system_state where user_id=u;
 if after_receipts<>before_receipts or after_revision<>before_revision then raise exception 'status probe mutated persistent state';end if;

 -- Force ten real server roll outcomes into the 0.1 PsyCoin band so decimal-tenths
 -- carry and wallet credit can be verified without changing production randomness.
 for seed_no in 0..999 loop
  seed_value:=seed_no::double precision/1000.0;
  perform setseed(seed_value);
  sample:=random()*100;
  if sample>=93 and sample<99.5 then found_seed:=true;exit;end if;
 end loop;
 if not found_seed then raise exception 'could not locate deterministic PsyCoin seed';end if;
 update players set diamonds=200,psycoin=0 where user_id=u;
 update player_system_state set state=jsonb_set(state,'{treasure_hunt,psycoinTenths}','0'::jsonb,true) where user_id=u;
 select psycoin into before_psycoin from players where user_id=u;
 for i in 1..10 loop
  perform setseed(seed_value);
  r:=psy_v28_treasure_action_v1(u,'treasure-roll','{}'::jsonb,'db-psycoin-tenth-'||i||'-0001');
  if r#>>'{prize,kind}'<>'psycoin' then raise exception 'deterministic 0.1 PsyCoin roll did not award a tenth';end if;
 end loop;
 if (select psycoin from players where user_id=u)<>before_psycoin+1 then raise exception 'ten PsyCoin tenths did not credit exactly one unit';end if;
 if (select diamonds from players where user_id=u)<>100 then raise exception 'fractional rolls charged an unexpected Diamond amount';end if;
 if (select (state#>>'{treasure_hunt,psycoinTenths}')::integer from player_system_state where user_id=u)<>0 then raise exception 'PsyCoin tenths did not carry and reset';end if;

 update players set diamonds=9 where user_id=u;
 update player_system_state set state=jsonb_set(state,'{treasure_hunt,hobbies,looter,level}','10'::jsonb,true) where user_id=u;
 begin
  perform psy_v28_treasure_action_v1(u,'treasure-roll','{}'::jsonb,'db-fail-no-diamonds-01');
  raise exception 'expected insufficient Diamonds failure';
 exception when others then
  if sqlerrm='expected insufficient Diamonds failure' then raise;end if;
  if sqlerrm<>'insufficient_diamonds' then raise;end if;
 end;
 if (select diamonds from players where user_id=u)<>9 then raise exception 'failed roll changed the Diamond balance';end if;
 if exists(select 1 from wallet_ledger where idempotency_key='v28-treasure-cost:db-fail-no-diamonds-01') then raise exception 'failed roll wrote a cost ledger row';end if;
 if exists(select 1 from game_action_receipts where user_id=u and idempotency_key='db-fail-no-diamonds-01') then raise exception 'failed roll wrote a receipt';end if;

 update players set diamonds=10 where user_id=u;
 update player_system_state set state=jsonb_set(state,'{treasure_hunt,hobbies,looter,level}','9'::jsonb,true) where user_id=u;
 begin
  perform psy_v28_treasure_action_v1(u,'treasure-roll','{}'::jsonb,'db-fail-level-nine-01');
  raise exception 'expected Looter level failure';
 exception when others then
  if sqlerrm='expected Looter level failure' then raise;end if;
  if sqlerrm<>'looter_level_10_required' then raise;end if;
 end;
 if (select diamonds from players where user_id=u)<>10 then raise exception 'level-gated roll changed the Diamond balance';end if;
 if exists(select 1 from wallet_ledger where idempotency_key='v28-treasure-cost:db-fail-level-nine-01') then raise exception 'level-gated roll wrote a cost ledger row';end if;
 raise notice 'PASS: status probe is read-only, 10 server PsyCoin tenths carry to 1 unit, insufficient-funds and level failures roll back atomically';
end $$;
