do $gate$
declare definition text; old_gate text := 'if (select trainer_level from players where user_id=p_user)<10 then raise exception ''trainer level 10 required'';end if;'; new_gate text := 'if coalesce((select trainer_level from players where user_id=p_user),0)<2 then raise exception ''trainer level 2 required'';end if;';
begin
 select pg_get_functiondef('public.psy_v48_state_action(uuid,text,jsonb,text)'::regprocedure) into definition;
 if position(new_gate in definition)>0 then return; end if;
 if position(old_gate in definition)=0 then raise exception 'profession gate changed; review required';end if;
 execute replace(definition,old_gate,new_gate);
end $gate$;
