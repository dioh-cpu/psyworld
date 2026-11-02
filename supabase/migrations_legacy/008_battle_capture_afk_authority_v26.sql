-- PSYWORLD V26 — authoritative capture RNG, battle payouts, AFK settlement and transitional reward commits

create or replace function public.psy_v26_capture_attempt(
  p_user uuid,p_species integer,p_level integer,p_shiny boolean,p_mega boolean,p_boss boolean,
  p_tier text,p_rarity text,p_rarity_mult numeric,p_hp_pct numeric,p_ball text,p_target_types text[],
  p_cap_buff numeric,p_pokemon_data jsonb,p_idempotency text
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  prior jsonb; st jsonb; progress jsonb; result jsonb; uid uuid;
  mult numeric:=1; hp_factor numeric; rarity_penalty numeric; buff numeric; chance numeric; base numeric; cap numeric;
  vip_until bigint:=0; now_ms bigint:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
  ball_qty bigint; captures bigint; ball_type text;
begin
  if p_idempotency is null or length(p_idempotency)<8 or length(p_idempotency)>180 then raise exception 'invalid idempotency key'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user::text||':capture:'||p_idempotency,0));
  select result into prior from game_action_receipts where user_id=p_user and idempotency_key=p_idempotency;
  if prior is not null then return prior; end if;
  if p_species<1 or p_species>2000 or p_level<1 or p_level>10000 then raise exception 'invalid pokemon'; end if;
  if p_boss then raise exception 'capture blocked'; end if;
  if not p_shiny and p_tier not in ('E','D','C','B','A','S') then raise exception 'tier not capturable'; end if;
  if p_hp_pct<0 or p_hp_pct>1 then raise exception 'invalid hp'; end if;
  if p_rarity_mult<1 or p_rarity_mult>100000 then raise exception 'invalid rarity'; end if;

  if p_ball='Pokéball' then mult:=1;
  elsif p_ball='Great Ball' then mult:=1.5;
  elsif p_ball='Super Ball' then mult:=2;
  elsif p_ball='Ultra Ball' then mult:=3;
  elsif p_ball='Premier Ball' then mult:=1.5;
  elsif p_ball in ('Normal Ball','Fire Ball','Water Ball','Grass Ball','Electric Ball','Ice Ball','Fighting Ball','Poison Ball','Ground Ball','Flying Ball','Psychic Ball','Bug Ball','Rock Ball','Ghost Ball','Dragon Ball','Dark Ball','Steel Ball','Fairy Ball') then
    ball_type:=lower(split_part(p_ball,' ',1));
    if ball_type=any(coalesce(p_target_types,array[]::text[])) then mult:=6; else mult:=1; end if;
  else raise exception 'invalid ball'; end if;

  insert into player_system_state(user_id,state) values(p_user,'{}'::jsonb) on conflict(user_id) do nothing;
  select state into st from player_system_state where user_id=p_user for update;
  begin vip_until:=coalesce((st->>'vip_until')::bigint,0); exception when others then vip_until:=0; end;
  hp_factor:=.34+(1-p_hp_pct)*.66;
  rarity_penalty:=1/sqrt(greatest(1,p_rarity_mult));
  buff:=1+(greatest(0,least(200,p_cap_buff))+(case when vip_until>now_ms then 20 else 0 end))/100;
  if p_shiny then chance:=least(1,.075*mult*hp_factor*rarity_penalty*buff);
  else
    base:=case p_tier when 'E' then 8 when 'D' then 5.8 when 'C' then 4 when 'B' then 2.6 when 'A' then 1.55 when 'S' then .85 else .5 end;
    cap:=case p_tier when 'E' then 40 when 'D' then 30 when 'C' then 22 when 'B' then 14 when 'A' then 8 when 'S' then 5 else 5 end;
    chance:=least(cap,base*mult*hp_factor*rarity_penalty*buff);
  end if;
  chance:=greatest(.01,chance);

  ball_qty:=adjust_inventory(p_user,p_ball,-1);
  if random()*100<chance then
    insert into player_pokemon(owner_id,species_id,level,xp,shiny,mega_form,tier,rarity,resets,data)
    values(p_user,p_species,p_level,0,p_shiny,case when p_mega then 'mega' else null end,left(p_tier,12),left(coalesce(p_rarity,'Lixo'),64),0,coalesce(p_pokemon_data,'{}'::jsonb)||jsonb_build_object('captured_online',true,'captured_at',now_ms)) returning pokemon_uid into uid;
    progress:=coalesce(st->'progress','{}'::jsonb); begin captures:=coalesce((progress->>'captures')::bigint,0)+1; exception when others then captures:=1; end; progress:=jsonb_set(progress,'{captures}',to_jsonb(captures),true); st:=jsonb_set(st,'{progress}',progress,true);
    update player_system_state set state=st,revision=revision+1,updated_at=now() where user_id=p_user;
    result:=psy_v26_snapshot(p_user)||jsonb_build_object('ok',true,'captured',true,'chance',chance,'pokemon_uid',uid,'ball_remaining',ball_qty);
  else
    result:=psy_v26_snapshot(p_user)||jsonb_build_object('ok',true,'captured',false,'chance',chance,'ball_remaining',ball_qty);
  end if;
  insert into game_action_receipts(user_id,idempotency_key,action,result) values(p_user,p_idempotency,'capture-attempt',result);
  return result;
end $$;
revoke execute on function public.psy_v26_capture_attempt(uuid,integer,integer,boolean,boolean,boolean,text,text,numeric,numeric,text,text[],numeric,jsonb,text) from public,anon,authenticated;

create or replace function public.psy_v26_battle_reward(
  p_user uuid,p_mode text,p_enemy_level integer,p_enemy_type text,p_gold_buff numeric,p_xp_buff numeric,p_drop_buff numeric,p_idempotency text
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  prior jsonb; st jsonb; progress jsonb; typekills jsonb; result jsonb; loot jsonb:='{}'::jsonb;
  gold_reward bigint; xp_reward bigint; kills bigint; tk bigint; vip_until bigint:=0; now_ms bigint:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
  boost numeric; common_item text; rare_item text; typ text:=initcap(lower(coalesce(p_enemy_type,'Normal')));
begin
  if p_idempotency is null or length(p_idempotency)<8 or length(p_idempotency)>180 then raise exception 'invalid idempotency key'; end if;
  if p_enemy_level<1 or p_enemy_level>10000 then raise exception 'invalid enemy level'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user::text||':battle:'||p_idempotency,0));
  select result into prior from game_action_receipts where user_id=p_user and idempotency_key=p_idempotency;if prior is not null then return prior;end if;
  insert into player_system_state(user_id,state) values(p_user,'{}'::jsonb) on conflict(user_id) do nothing;select state into st from player_system_state where user_id=p_user for update;
  begin vip_until:=coalesce((st->>'vip_until')::bigint,0);exception when others then vip_until:=0;end;
  if lower(p_mode)='world' then
    gold_reward:=floor(p_enemy_level*12*(1+greatest(0,least(300,p_gold_buff))/100)*.5);
    xp_reward:=floor(p_enemy_level*10*(1+(greatest(0,least(300,p_xp_buff))+(case when vip_until>now_ms then 50 else 0 end))/100)*.5);
  else
    gold_reward:=floor((p_enemy_level*18+80)*(1+greatest(0,least(300,p_gold_buff))/100));
    xp_reward:=floor((p_enemy_level*85+150)*(1+(greatest(0,least(300,p_xp_buff))+(case when vip_until>now_ms then 50 else 0 end))/100));
  end if;
  perform apply_wallet_delta_v24(p_user,'gold',gold_reward,'battle',lower(p_mode),'v26-battle-g:'||p_idempotency);
  progress:=coalesce(st->'progress','{}'::jsonb);begin kills:=coalesce((progress->>'kills')::bigint,0)+1;exception when others then kills:=1;end;progress:=jsonb_set(progress,'{kills}',to_jsonb(kills),true);
  typekills:=coalesce(progress->'type_kills','{}'::jsonb);begin tk:=coalesce((typekills->>typ)::bigint,0)+1;exception when others then tk:=1;end;typekills:=jsonb_set(typekills,array[typ],to_jsonb(tk),true);progress:=jsonb_set(progress,'{type_kills}',typekills,true);

  if typ='Normal' then common_item:='Rubber Ball';rare_item:='Giant Piece Of Fur';elsif typ='Fire' then common_item:='Essence Of Fire';rare_item:='Fire Tail';elsif typ='Water' then common_item:='Water Gem';rare_item:='Water Pendant';elsif typ='Grass' then common_item:='Seed';rare_item:='Great Petal';elsif typ='Electric' then common_item:='Screw';rare_item:='Electric Rat Tail';elsif typ='Ice' then common_item:='Snowball';rare_item:='Ice Orb';elsif typ='Fighting' then common_item:='Band Aid';rare_item:='Belt Of Champion';elsif typ='Poison' then common_item:='Bottle Of Poison';rare_item:='Bug Venom';elsif typ='Ground' then common_item:='Earth Ball';rare_item:='Piece Of Diglett';elsif typ='Flying' then common_item:='Straw';rare_item:='Giant Beak';elsif typ='Psychic' then common_item:='Enchanted Gem';rare_item:='Psychic Spoon';elsif typ='Bug' then common_item:='Bug Gosme';rare_item:='Bug Antenna';elsif typ='Rock' then common_item:='Small Stone';rare_item:='Strange Rock';elsif typ='Ghost' then common_item:='Ghost Essence';rare_item:='Bat Wing';elsif typ='Dragon' then common_item:='Dragon Scale';rare_item:='Dragon Tooth';elsif typ='Dark' then common_item:='Dark Gem';rare_item:='Dark Ear';elsif typ='Steel' then common_item:='Piece Of Steel';rare_item:='Metal Hull';elsif typ='Fairy' then common_item:='Rubber Ball';rare_item:='Cute Ball';end if;
  boost:=least(2.2,1+(greatest(0,least(120,p_drop_buff))+(case when vip_until>now_ms then 50 else 0 end))/100);
  if common_item is not null and random()<.16*boost then perform adjust_inventory(p_user,common_item,1);loot:=loot||jsonb_build_object(common_item,1);end if;
  if rare_item is not null and random()<.026*boost then perform adjust_inventory(p_user,rare_item,1);loot:=loot||jsonb_build_object(rare_item,1);end if;
  st:=jsonb_set(st,'{progress}',progress,true);update player_system_state set state=st,revision=revision+1,updated_at=now() where user_id=p_user;
  result:=psy_v26_snapshot(p_user)||jsonb_build_object('ok',true,'gold_reward',gold_reward,'xp_reward',xp_reward,'quest_loot',loot,'mode',lower(p_mode));
  insert into game_action_receipts(user_id,idempotency_key,action,result) values(p_user,p_idempotency,'battle-win',result);return result;
end $$;
revoke execute on function public.psy_v26_battle_reward(uuid,text,integer,text,numeric,numeric,numeric,text) from public,anon,authenticated;

create or replace function public.psy_v26_reward_commit(
 p_user uuid,p_category text,p_reference text,p_gold bigint,p_diamonds bigint,p_items jsonb,p_packs jsonb,p_eggs jsonb,p_idempotency text
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare st jsonb; packs jsonb; eggs jsonb; rec record; q bigint; result jsonb; max_gold bigint; max_dia bigint;
begin
 if p_category not in ('survivor','drop','battlepass','achievement','egg','pack','quest','system') then raise exception 'invalid reward category';end if;
 max_gold:=case p_category when 'survivor' then 50000000 when 'battlepass' then 10000000 when 'achievement' then 5000000 when 'quest' then 1000000 else 1000000 end;
 max_dia:=case p_category when 'survivor' then 1000 when 'battlepass' then 1000 when 'achievement' then 500 else 100 end;
 if p_gold<0 or p_gold>max_gold or p_diamonds<0 or p_diamonds>max_dia then raise exception 'reward outside category limit';end if;
 if jsonb_typeof(coalesce(p_items,'{}'::jsonb))<>'object' or jsonb_typeof(coalesce(p_packs,'{}'::jsonb))<>'object' or jsonb_typeof(coalesce(p_eggs,'{}'::jsonb))<>'object' then raise exception 'invalid reward payload';end if;
 result:=grant_server_reward(p_user,case when p_category in ('survivor','drop','battlepass','achievement','egg','pack','quest') then p_category else 'system' end,p_reference,'v26commit:'||p_idempotency,p_gold,p_diamonds,coalesce(p_items,'{}'::jsonb));
 perform pg_advisory_xact_lock(hashtextextended(p_user::text||':reward-state:'||p_idempotency,0));
 insert into player_system_state(user_id,state) values(p_user,'{}'::jsonb) on conflict(user_id) do nothing;select state into st from player_system_state where user_id=p_user for update;packs:=coalesce(st->'packs','{}'::jsonb);eggs:=coalesce(st->'eggs','{}'::jsonb);
 for rec in select key,value from jsonb_each(coalesce(p_packs,'{}'::jsonb)) loop q:=(rec.value#>>'{}')::bigint;if q<0 or q>100 then raise exception 'invalid pack qty';end if;packs:=jsonb_set(packs,array[rec.key],to_jsonb(coalesce((packs->>rec.key)::bigint,0)+q),true);end loop;
 for rec in select key,value from jsonb_each(coalesce(p_eggs,'{}'::jsonb)) loop q:=(rec.value#>>'{}')::bigint;if q<0 or q>100 then raise exception 'invalid egg qty';end if;eggs:=jsonb_set(eggs,array[rec.key],to_jsonb(coalesce((eggs->>rec.key)::bigint,0)+q),true);end loop;
 st:=jsonb_set(st,'{packs}',packs,true);st:=jsonb_set(st,'{eggs}',eggs,true);update player_system_state set state=st,revision=revision+1,updated_at=now() where user_id=p_user;
 return result||jsonb_build_object('system',st,'transitional_verified',false);
end $$;
revoke execute on function public.psy_v26_reward_commit(uuid,text,text,bigint,bigint,jsonb,jsonb,jsonb,text) from public,anon,authenticated;

create or replace function public.psy_v26_afk_action(
 p_user uuid,p_action text,p_level_cap integer,p_gold_buff numeric,p_xp_buff numeric,p_drop_buff numeric,p_idempotency text
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare
 prior jsonb;st jsonb;afk jsonb;packs jsonb;eggs jsonb;result jsonb;now_ms bigint:=floor(extract(epoch from clock_timestamp())*1000)::bigint;last_ms bigint;elapsed bigint;process_sec bigint;mins numeric;whole integer;i integer;tl integer;caplvl integer;steps integer;capsteps integer;progression numeric;goldpm numeric;xppm numeric;dropboost numeric;vip_until bigint:=0;gold_reward bigint;xp_reward bigint;idx integer;item text;pack text;eggcount bigint:=0;stonecount bigint:=0;esscount bigint:=0;packcount bigint:=0;
 essences text[]:=array['Essência Normal','Essência Fogo','Essência Água','Essência Planta','Essência Elétrica','Essência Gelo','Essência Lutador','Essência Veneno','Essência Terra','Essência Voador','Essência Psíquica','Essência Inseto','Essência Pedra','Essência Fantasma','Essência Dragão','Essência Sombria','Essência Metal','Essência Fada'];
 stones text[]:=array['Fire Stone','Water Stone','Leaf Stone','Thunder Stone','Ice Stone','Punch Stone','Venom Stone','Earth Stone','Feather Stone','Enigma Stone','Cocoon Stone','Rock Stone','Crystal Stone','Darkness Stone','Metal Stone','Heart Stone'];
begin
 if p_idempotency is null or length(p_idempotency)<8 or length(p_idempotency)>180 then raise exception 'invalid idempotency key';end if;perform pg_advisory_xact_lock(hashtextextended(p_user::text||':afk:'||p_idempotency,0));select result into prior from game_action_receipts where user_id=p_user and idempotency_key=p_idempotency;if prior is not null then return prior;end if;
 insert into player_system_state(user_id,state) values(p_user,'{}'::jsonb) on conflict(user_id) do nothing;select state into st from player_system_state where user_id=p_user for update;afk:=coalesce(st->'afk','{}'::jsonb);packs:=coalesce(st->'packs','{}'::jsonb);eggs:=coalesce(st->'eggs','{}'::jsonb);begin vip_until:=coalesce((st->>'vip_until')::bigint,0);exception when others then vip_until:=0;end;
 if lower(p_action)='start' then afk:=jsonb_build_object('active',true,'started_ms',now_ms,'last_claim_ms',now_ms);result:=jsonb_build_object('ok',true,'active',true,'started_ms',now_ms);
 elsif lower(p_action) in ('claim','stop') then
   if not coalesce((afk->>'active')::boolean,false) then raise exception 'afk not active';end if;begin last_ms:=coalesce((afk->>'last_claim_ms')::bigint,now_ms);exception when others then last_ms:=now_ms;end;elapsed:=greatest(0,(now_ms-last_ms)/1000);process_sec:=least(elapsed,86400);if process_sec<2 then raise exception 'afk interval too short';end if;
   select trainer_level into tl from players where user_id=p_user;tl:=greatest(1,coalesce(tl,1));caplvl:=greatest(20,least(100,coalesce(p_level_cap,20)));steps:=floor((tl-1)/10);capsteps:=floor((caplvl-20)/10);progression:=1+steps*.13+capsteps*.08;goldpm:=(320+tl*16)*progression*(1+greatest(0,least(300,p_gold_buff))/100);xppm:=(27+tl*2.35)*progression*(1+(greatest(0,least(300,p_xp_buff))+(case when vip_until>now_ms then 50 else 0 end))/100);dropboost:=1+least(2,(greatest(0,least(200,p_drop_buff))+(case when vip_until>now_ms then 50 else 0 end))/100);mins:=process_sec::numeric/60;gold_reward:=greatest(1,floor(mins*goldpm)::bigint);xp_reward:=greatest(1,floor(mins*xppm)::bigint);perform apply_wallet_delta_v24(p_user,'gold',gold_reward,'afk','settlement','v26-afk-g:'||p_idempotency);whole:=floor(mins);
   for i in 1..whole loop
     if random()<.050*dropboost then idx:=1+floor(random()*array_length(essences,1))::integer;item:=essences[idx];perform adjust_inventory(p_user,item,1);esscount:=esscount+1;end if;
     if random()<.014*dropboost then idx:=1+floor(random()*array_length(stones,1))::integer;item:=stones[idx];perform adjust_inventory(p_user,item,1);stonecount:=stonecount+1;end if;
     if random()<.00075*dropboost then eggcount:=eggcount+1;end if;
     if random()<.000025 then pack:='ss';elsif random()<.00018 then pack:='epic';elsif random()<.00075 then pack:='rare';elsif random()<.003 then pack:='normal';else pack:=null;end if;
     if pack is not null then packs:=jsonb_set(packs,array[pack],to_jsonb(coalesce((packs->>pack)::bigint,0)+1),true);packcount:=packcount+1;end if;
   end loop;
   if eggcount>0 then eggs:=jsonb_set(eggs,'{AFK Drop Egg}',to_jsonb(coalesce((eggs->>'AFK Drop Egg')::bigint,0)+eggcount),true);end if;
   afk:=jsonb_set(afk,'{last_claim_ms}',to_jsonb(last_ms+process_sec*1000),true);if lower(p_action)='stop' and process_sec>=elapsed then afk:=jsonb_set(afk,'{active}','false'::jsonb,true);end if;
   result:=psy_v26_snapshot(p_user)||jsonb_build_object('ok',true,'active',coalesce((afk->>'active')::boolean,false),'processed_seconds',process_sec,'remaining_seconds',greatest(0,elapsed-process_sec),'gold_reward',gold_reward,'xp_reward',xp_reward,'essences',esscount,'stones',stonecount,'eggs',eggcount,'packs',packcount);
 else raise exception 'invalid afk action';end if;
 st:=jsonb_set(st,'{afk}',afk,true);st:=jsonb_set(st,'{packs}',packs,true);st:=jsonb_set(st,'{eggs}',eggs,true);update player_system_state set state=st,revision=revision+1,updated_at=now() where user_id=p_user;result:=coalesce(result,'{}'::jsonb)||jsonb_build_object('system',st);insert into game_action_receipts(user_id,idempotency_key,action,result) values(p_user,p_idempotency,'afk-'||lower(p_action),result);return result;
end $$;
revoke execute on function public.psy_v26_afk_action(uuid,text,integer,numeric,numeric,numeric,text) from public,anon,authenticated;
