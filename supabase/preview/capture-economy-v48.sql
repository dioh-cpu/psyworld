create or replace function public.psy_v48_capture_attempt(
  p_user uuid,p_species integer,p_level integer,p_shiny boolean,p_mega boolean,p_boss boolean,
  p_tier text,p_rarity text,p_rarity_mult numeric,p_hp_pct numeric,p_ball text,p_target_types text[],
  p_cap_buff numeric,p_pokemon_data jsonb,p_idempotency text,p_chance numeric,p_multiplier numeric
) returns jsonb
language plpgsql security invoker set search_path=public as $$
declare
  prior jsonb; st jsonb; progress jsonb; result jsonb; uid uuid;
  mult numeric:=1; hp_factor numeric; quality_factor numeric; level_factor numeric; evo_factor numeric;
  tier_factor numeric; form_factor numeric; base_chance numeric; pre_bonus numeric; chance numeric;
  bonus_points numeric; vip_bonus numeric:=0;
  evo_stage integer:=1;
  vip_until bigint:=0; now_ms bigint:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
  ball_qty bigint; captures bigint; ball_type text; target_types text[];
begin
  if p_idempotency is null or length(p_idempotency)<8 or length(p_idempotency)>180 then raise exception 'invalid idempotency key'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user::text||':capture-v40:'||p_idempotency,0));
  select gar.result into prior from game_action_receipts gar where gar.user_id=p_user and gar.idempotency_key=p_idempotency;
  if prior is not null then return prior; end if;
  if p_species<1 or p_species>2000 or p_level<1 or p_level>10000 then raise exception 'invalid pokemon'; end if;
  if p_boss then raise exception 'capture blocked'; end if;
  if not p_shiny and p_tier not in ('E','D','C','B','A','S') then raise exception 'tier not capturable'; end if;
  if p_hp_pct<0 or p_hp_pct>1 then raise exception 'invalid hp'; end if;
  if p_rarity_mult<1 or p_rarity_mult>100000 then raise exception 'invalid rarity'; end if;

  select coalesce(array_agg(lower(public.psy_v26_canonical_type(x))),array[]::text[]) into target_types
  from unnest(coalesce(p_target_types,array[]::text[])) x;

  if p_ball not in ('Pokéball','Great Ball','Super Ball','Ultra Ball','Premier Ball','Psyball','Halloween Ball','Normal Ball','Fire Ball','Water Ball','Grass Ball','Electric Ball','Ice Ball','Fighting Ball','Poison Ball','Ground Ball','Flying Ball','Psychic Ball','Bug Ball','Rock Ball','Ghost Ball','Dragon Ball','Dark Ball','Steel Ball','Fairy Ball') then raise exception 'invalid ball'; end if;
  if p_chance is null or p_chance<0 or p_chance>70 or p_multiplier not between 1 and 15 then raise exception 'invalid server capture model'; end if;
  mult:=p_multiplier;

  insert into player_system_state(user_id,state) values(p_user,'{}'::jsonb) on conflict(user_id) do nothing;
  select state into st from player_system_state where user_id=p_user for update;
  begin vip_until:=coalesce((st->>'vip_until')::bigint,0); exception when others then vip_until:=0; end;

  begin
    evo_stage:=greatest(1,least(3,coalesce((p_pokemon_data->>'evolutionStage')::integer,(p_pokemon_data->>'evolution_stage')::integer,1)));
  exception when others then evo_stage:=1;
  end;

  -- Shared JS model is computed on the authenticated API, never accepted from the request.
  chance:=p_chance;
  bonus_points:=greatest(0,least(200,p_cap_buff));
  if vip_until>now_ms then vip_bonus:=20; end if;

  ball_qty:=adjust_inventory(p_user,p_ball,-1);
  if random()*100<chance then
    insert into player_pokemon(owner_id,species_id,level,xp,shiny,mega_form,tier,rarity,resets,data)
    values(p_user,p_species,p_level,0,p_shiny,case when p_mega then 'mega' else null end,left(p_tier,12),left(coalesce(p_rarity,'Lixo'),64),0,coalesce(p_pokemon_data,'{}'::jsonb)||jsonb_build_object('captured_online',true,'captured_at',now_ms,'psyballCaught',p_ball='Psyball','captureBall',p_ball)) returning pokemon_uid into uid;
    progress:=coalesce(st->'progress','{}'::jsonb);
    begin captures:=coalesce((progress->>'captures')::bigint,0)+1; exception when others then captures:=1; end;
    progress:=jsonb_set(progress,'{captures}',to_jsonb(captures),true);
    st:=jsonb_set(st,'{progress}',progress,true);
    update player_system_state set state=st,revision=revision+1,updated_at=now() where user_id=p_user;
    result:=psy_v26_snapshot(p_user)||jsonb_build_object('ok',true,'captured',true,'chance',chance,'pokemon_uid',uid,'ball_remaining',ball_qty,'ball_multiplier',mult,'base_chance',base_chance,'pre_bonus_chance',pre_bonus,'capture_bonus',bonus_points,'vip_bonus',vip_bonus,'evolution_stage',evo_stage,'tier_factor',tier_factor,'quality_factor',quality_factor,'level_factor',level_factor,'hp_factor',hp_factor,'capture_version','V48');
  else
    result:=psy_v26_snapshot(p_user)||jsonb_build_object('ok',true,'captured',false,'chance',chance,'ball_remaining',ball_qty,'ball_multiplier',mult,'base_chance',base_chance,'pre_bonus_chance',pre_bonus,'capture_bonus',bonus_points,'vip_bonus',vip_bonus,'evolution_stage',evo_stage,'tier_factor',tier_factor,'quality_factor',quality_factor,'level_factor',level_factor,'hp_factor',hp_factor,'capture_version','V48');
  end if;
  insert into game_action_receipts(user_id,idempotency_key,action,result) values(p_user,p_idempotency,'capture-attempt-v40',result);
  return result;
end $$;

revoke execute on function public.psy_v48_capture_attempt(uuid,integer,integer,boolean,boolean,boolean,text,text,numeric,numeric,text,text[],numeric,jsonb,text,numeric,numeric) from public,anon,authenticated;
grant execute on function public.psy_v48_capture_attempt(uuid,integer,integer,boolean,boolean,boolean,text,text,numeric,numeric,text,text[],numeric,jsonb,text,numeric,numeric) to service_role;

-- Additive preview RPC. Existing production functions and policies remain unchanged.
create or replace function public.psy_v48_state_action(p_user uuid,p_action text,p_payload jsonb,p_idempotency text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
 st jsonb; bp jsonb; prior jsonb; result jsonb; progress jsonb; periods jsonb; box jsonb; claims jsonb; reward jsonb; delivered jsonb;
 kind text; item text; product text; scope text; period text; claimkey text; track text; job text; spec text; current_job text; k text;
 qty bigint:=0; cost bigint:=0; oldq bigint; counter bigint; goal bigint; gold bigint:=0; passxp bigint:=0; xp bigint; maxxp bigint; level integer; season integer;
 local_now timestamp:=now() at time zone 'America/Fortaleza'; nowms bigint:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
 startms bigint; week_key text:=to_char(date_trunc('week',now() at time zone 'America/Fortaleza'),'YYYY-MM-DD');
begin
 if p_user is null or p_idempotency is null or length(p_idempotency)<8 or length(p_idempotency)>180 then raise exception 'invalid request'; end if;
 if not exists(select 1 from players where user_id=p_user) then raise exception 'missing player'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text||':preview-v48',0));
 select gar.result into prior from game_action_receipts gar where gar.user_id=p_user and gar.idempotency_key=p_idempotency;
 if prior is not null then return prior;end if;
 insert into player_system_state(user_id,state) values(p_user,'{}') on conflict(user_id) do nothing;
 select state into st from player_system_state where user_id=p_user for update;
 st:=coalesce(st,'{}');bp:=coalesce(st->'battle_pass','{}');progress:=coalesce(st->'progress','{}');periods:=coalesce(st->'periodicV48','{}');
 if coalesce((bp->>'end')::bigint,0)>0 and (bp->>'end')::bigint<=nowms then
  bp:=jsonb_build_object('season',coalesce((bp->>'season')::integer,1)+1,'start',nowms,'end',nowms+3888000000,'xp',0,'premium',false,'divine',false,'claimFree','{}'::jsonb,'claimPremium','{}'::jsonb,'claimDivine','{}'::jsonb,'couponAvailable',coalesce((bp->>'nextCoupon30')::boolean,false),'coupon_available',coalesce((bp->>'nextCoupon30')::boolean,false));
 end if;
 if not bp ? 'end' then bp:=jsonb_set(bp,'{end}',to_jsonb(nowms+3888000000),true);end if;
 if p_action='psyball-buy' then
  product:=p_payload->>'product';
  if product='psyball100' then qty:=100;cost:=3;elsif product='psyball500' then qty:=500;cost:=10;elsif product='psyball1500' then qty:=1500;cost:=15;elsif product='psyballWeekly' then qty:=1000;cost:=5;else raise exception 'invalid product';end if;
  if product='psyballWeekly' and st->>'psyballWeekV48'=week_key then raise exception 'weekly bundle already purchased';end if;
  perform apply_wallet_delta_v24(p_user,'psycoin',-cost,'shop_buy',product,'v48:'||p_idempotency);
  perform adjust_inventory(p_user,'Psyball',qty);
  if product='psyballWeekly' then st:=jsonb_set(st,'{psyballWeekV48}',to_jsonb(week_key),true);end if;
 elsif p_action='profession' then
  job:=p_payload->>'job';spec:=p_payload->>'spec';
  if job not in ('engineer','herbalist','researcher','professor','stylist','echo','dream','twilight') or coalesce(length(spec),0)<2 or length(spec)>40 then raise exception 'invalid profession';end if;
  if (select trainer_level from players where user_id=p_user)<10 then raise exception 'trainer level 10 required';end if;
  current_job:=st#>>'{professionV48,job}';
  if current_job is not null and (current_job<>job or st#>>'{professionV48,spec}'<>spec) then perform apply_wallet_delta_v24(p_user,'gold',-1000,'craft','profession','v48:'||p_idempotency);end if;
  st:=jsonb_set(st,'{professionV48}',jsonb_build_object('job',job,'spec',spec),true);
 elsif p_action='craft-element' then
  if st#>>'{professionV48,job}' is distinct from 'engineer' then raise exception 'engineer profession required';end if;
  kind:=p_payload->>'element';qty:=coalesce((p_payload->>'qty')::bigint,1);if qty<1 or qty>100 then raise exception 'invalid craft quantity';end if;
  item:=case kind when 'Normal' then 'Essência Normal' when 'Fire' then 'Essência Fogo' when 'Water' then 'Essência Água' when 'Grass' then 'Essência Planta' when 'Electric' then 'Essência Elétrica' when 'Ice' then 'Essência Gelo' when 'Fighting' then 'Essência Lutador' when 'Poison' then 'Essência Veneno' when 'Ground' then 'Essência Terra' when 'Flying' then 'Essência Voador' when 'Psychic' then 'Essência Psíquica' when 'Bug' then 'Essência Inseto' when 'Rock' then 'Essência Pedra' when 'Ghost' then 'Essência Fantasma' when 'Dragon' then 'Essência Dragão' when 'Dark' then 'Essência Sombria' when 'Steel' then 'Essência Metal' when 'Fairy' then 'Essência Fada' else null end;
  if item is null then raise exception 'invalid element';end if;
  perform adjust_inventory(p_user,item,-10*qty);perform adjust_inventory(p_user,kind||' Ball',qty);
 elsif p_action in ('pass-premium-v48','pass-divine') then
  if p_action='pass-premium-v48' then
   if coalesce((bp->>'premium')::boolean,false) then raise exception 'premium already active';end if;
   cost:=case when coalesce((bp->>'coupon_available')::boolean,false) or coalesce((bp->>'couponAvailable')::boolean,false) then 7 else 10 end;
  else
   if coalesce((bp->>'divine')::boolean,false) then raise exception 'divine already active';end if;
   cost:=case when coalesce((bp->>'premium')::boolean,false) then 10 else 20 end;bp:=jsonb_set(bp,'{divine}','true',true);
  end if;
  perform apply_wallet_delta_v24(p_user,'psycoin',-cost,'battlepass_premium',p_action,'v48:'||p_idempotency);
  bp:=jsonb_set(bp,'{premium}','true',true);if cost=7 then bp:=jsonb_set(jsonb_set(bp,'{coupon_available}','false',true),'{couponAvailable}','false',true);end if;
 elsif p_action in ('period-sync','pass-sync') then
  foreach k in array array['survivor','captures','eggs'] loop
   counter:=greatest(0,least(1000000000,coalesce((p_payload#>>array['metrics',k])::bigint,0)));
   progress:=jsonb_set(progress,array['v48_'||k],to_jsonb(greatest(counter,coalesce((progress->>('v48_'||k))::bigint,0))),true);
  end loop;
  foreach scope in array array['daily','weekly','monthly'] loop
   period:=case scope when 'daily' then to_char(local_now,'YYYY-MM-DD') when 'weekly' then week_key else to_char(local_now,'YYYY-MM') end;
   box:=coalesce(periods->scope,'{}');if box->>'key' is distinct from period then box:=jsonb_build_object('key',period,'base',progress,'claims','{}'::jsonb);end if;
   periods:=jsonb_set(periods,array[scope],box,true);
  end loop;
  if not bp ? 'start' then bp:=jsonb_set(bp,'{start}',to_jsonb(nowms),true);end if;
  startms:=coalesce((bp->>'start')::bigint,nowms);maxxp:=least(100000,greatest(7000,(floor(greatest(0,nowms-startms)/86400000.0)::bigint+1)*7000)+coalesce((bp->>'paidXpV48')::bigint,0));
  xp:=greatest(coalesce((bp->>'xp')::bigint,0),least(maxxp,greatest(0,coalesce((p_payload->>'xp')::bigint,0))));bp:=jsonb_set(bp,'{xp}',to_jsonb(xp),true);
 elsif p_action='period-claim' then
  scope:=p_payload->>'scope';kind:=p_payload->>'quest';if scope not in ('daily','weekly','monthly') or kind not in ('survivor','captures','eggs') then raise exception 'invalid quest';end if;
  period:=case scope when 'daily' then to_char(local_now,'YYYY-MM-DD') when 'weekly' then week_key else to_char(local_now,'YYYY-MM') end;
  box:=periods->scope;if box is null or box->>'key'<>period then raise exception 'refresh quests';end if;
  if coalesce(box->'claims','{}') ? kind then raise exception 'quest already claimed';end if;
  goal:=case when scope='daily' then case kind when 'survivor' then 150 when 'captures' then 3 else 1 end when scope='weekly' then case kind when 'survivor' then 1500 when 'captures' then 25 else 5 end else case kind when 'survivor' then 6000 when 'captures' then 100 else 20 end end;
  counter:=coalesce((progress->>('v48_'||kind))::bigint,0)-coalesce((box#>>array['base','v48_'||kind])::bigint,0);if counter<goal then raise exception 'quest incomplete';end if;
  gold:=case scope when 'daily' then case kind when 'survivor' then 5000 when 'captures' then 2500 else 3000 end when 'weekly' then case kind when 'survivor' then 50000 when 'captures' then 25000 else 20000 end else case kind when 'survivor' then 200000 else 100000 end end;
  if kind='survivor' then passxp:=case scope when 'daily' then 250 when 'weekly' then 1500 else 5000 end;
  elsif kind='captures' then item:=case scope when 'monthly' then 'Super Ball' else 'Great Ball' end;qty:=case scope when 'daily' then 10 when 'weekly' then 25 else 50 end;
  elsif scope<>'daily' then item:=case scope when 'weekly' then 'Boost Stone' else 'Shiny Stone' end;qty:=1;end if;
  perform apply_wallet_delta_v24(p_user,'gold',gold,'quest',scope||':'||kind,'v48:'||p_idempotency);if item is not null then perform adjust_inventory(p_user,item,qty);end if;
  bp:=jsonb_set(bp,'{xp}',to_jsonb(least(100000,coalesce((bp->>'xp')::bigint,0)+passxp)),true);
  box:=jsonb_set(box,array['claims',kind],'true',true);periods:=jsonb_set(periods,array[scope],box,true);
 elsif p_action='pass-claim-v48' then
  level:=(p_payload->>'level')::integer;track:=p_payload->>'track';if level<1 or level>100 or track not in ('free','premium','divine') then raise exception 'invalid reward';end if;
  if level>floor(coalesce((bp->>'xp')::numeric,0)/1000) then raise exception 'pass level locked';end if;
  if track='premium' and not coalesce((bp->>'premium')::boolean,false) or track='divine' and not coalesce((bp->>'divine')::boolean,false) then raise exception 'pass track locked';end if;
  k:=case track when 'free' then 'claimFree' when 'premium' then 'claimPremium' else 'claimDivine' end;claims:=coalesce(bp->k,'{}');if claims ? level::text then raise exception 'reward already claimed';end if;
  reward:=p_payload->'reward';kind:=reward->>'kind';qty:=coalesce((reward->>'qty')::bigint,1);item:=reward->>'key';
  if kind='gold' then
   if qty<1 or qty>5000000 then raise exception 'invalid reward quantity';end if;
   perform apply_wallet_delta_v24(p_user,'gold',qty,'battlepass_reward',track||':'||level,'v48:'||p_idempotency);
  elsif kind='item' then
   if item is null or item in ('Psyball','PsyCoin','Diamante','Diamonds') or qty<1 or qty>1000 then raise exception 'invalid reward item';end if;
   if track='free' and item like '% Ball' then qty:=100;end if;
   perform adjust_inventory(p_user,item,qty);
  elsif kind='pack' then st:=jsonb_set(st,'{packs}',coalesce(st->'packs','{}')||jsonb_build_object(item,coalesce((st#>>array['packs',item])::bigint,0)+qty),true);
  elsif kind in ('egg','shinyEgg','cosmetic','coupon') then
   delivered:=coalesce(bp->'rewardReceiptsV48','{}');claimkey:=coalesce(bp->>'season','1')||':'||track||':'||level;delivered:=jsonb_set(delivered,array[claimkey],reward,true);bp:=jsonb_set(bp,'{rewardReceiptsV48}',delivered,true);
   if kind='coupon' then bp:=jsonb_set(bp,'{nextCoupon30}','true',true);end if;
  else raise exception 'invalid reward kind';end if;
  claims:=jsonb_set(claims,array[level::text],'1',true);bp:=jsonb_set(bp,array[k],claims,true);
 else raise exception 'invalid v48 action';end if;
 st:=jsonb_set(st,'{battle_pass}',bp,true);st:=jsonb_set(st,'{progress}',progress,true);st:=jsonb_set(st,'{periodicV48}',periods,true);
 update player_system_state set state=st,revision=revision+1,updated_at=now() where user_id=p_user;
 result:=psy_v26_snapshot(p_user)||jsonb_build_object('ok',true,'v48_action',p_action,'cost',cost,'quantity',qty);
 insert into game_action_receipts(user_id,idempotency_key,action,result) values(p_user,p_idempotency,'preview-v48:'||p_action,result);
 return result;
end $$;
revoke execute on function public.psy_v48_state_action(uuid,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.psy_v48_state_action(uuid,text,jsonb,text) to service_role;
