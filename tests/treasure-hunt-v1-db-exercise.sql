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
