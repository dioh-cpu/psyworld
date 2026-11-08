-- Crystal Grotto: treasure progression and rewards are owned by the server.
create or replace function public.psy_v28_treasure_action_v1(
  p_user uuid,
  p_action text,
  p_payload jsonb,
  p_idempotency text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  prior jsonb;
  st jsonb;
  h jsonb;
  hobbies jsonb;
  hunter jsonb;
  looter jsonb;
  sites jsonb;
  site jsonb;
  chests jsonb;
  stats jsonb;
  cosmetic jsonb;
  skills jsonb;
  loot jsonb := '{}'::jsonb;
  titles jsonb;
  result jsonb;
  site_id text;
  hobby_id text;
  skill_id text;
  required_fragment text;
  fragment_qty bigint;
  stone_qty bigint;
  hobby_level integer;
  hobby_xp bigint;
  xp_need bigint;
  skill_points integer;
  skill_rank integer;
  skill_max integer;
  skill_min integer;
  hit_count integer;
  site_min_level integer;
  trainer_level integer;
  dig_count bigint;
  chest_qty bigint;
  quality_roll numeric;
  rare_chance numeric;
  epic_chance numeric;
  relic_chance numeric;
  gold_reward bigint;
  xp_reward bigint;
  qty bigint;
  balance bigint;
  psycoin_tenths integer;
  costume_chance numeric;
  pack_threshold numeric;
  roll_luck integer;
  roll_value numeric;
  pack_key text;
  item_key text;
  tier text;
  now_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
begin
  if p_idempotency is null or length(p_idempotency) < 8 or length(p_idempotency) > 180 then
    raise exception 'invalid_idempotency_key';
  end if;
  if p_action not in ('unlock','dig','open-chest','level-up','skill-buy','treasure-roll','equip-cosmetic') then
    raise exception 'invalid_treasure_action';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user::text || ':treasure:' || p_idempotency, 0));
  select receipt.result into prior from game_action_receipts as receipt
    where receipt.user_id = p_user and receipt.idempotency_key = p_idempotency;
  if prior is not null then return prior; end if;

  insert into player_system_state(user_id,state) values(p_user,'{}'::jsonb)
    on conflict(user_id) do nothing;
  select state into st from player_system_state where user_id=p_user for update;
  st:=jsonb_set(st,'{packs}',coalesce(st->'packs','{}'::jsonb),true);
  h := coalesce(st->'treasure_hunt','{}'::jsonb);
  hobbies := coalesce(h->'hobbies','{"treasureHunter":{"level":0,"xp":0,"points":0,"skills":{}},"looter":{"level":0,"xp":0,"points":0,"skills":{}}}'::jsonb);
  hunter := coalesce(hobbies->'treasureHunter','{"level":0,"xp":0,"points":0,"skills":{}}'::jsonb);
  looter := coalesce(hobbies->'looter','{"level":0,"xp":0,"points":0,"skills":{}}'::jsonb);
  sites := coalesce(h->'sites','{}'::jsonb);
  chests := coalesce(h->'chests','{}'::jsonb);
  stats := coalesce(h->'stats','{"digs":0,"chestsOpened":0}'::jsonb);
  titles := coalesce(h->'titles','{}'::jsonb);
  cosmetic := coalesce(h->'cosmetic','{"bountyHunter":false,"equipped":false}'::jsonb);

  if p_action = 'unlock' then
    hobby_id := p_payload->>'hobby';
    if hobby_id='treasureHunter' then
      if coalesce((hunter->>'level')::integer,0)=0 then
        select pl.trainer_level into trainer_level from players as pl where pl.user_id=p_user for update;
        if coalesce(trainer_level,1)<3 then raise exception 'trainer_level_3_required'; end if;
        hunter:=jsonb_build_object('level',1,'xp',0,'points',1,'skills','{}'::jsonb);
        hobbies:=jsonb_set(hobbies,'{treasureHunter}',hunter,true);
      end if;
    elsif hobby_id='looter' then
      if coalesce((looter->>'level')::integer,0)=0 then
        if not exists(select 1 from jsonb_each_text(chests) as chest(key,value) where value::integer>0) then
          raise exception 'find_a_treasure_chest_first';
        end if;
        looter:=jsonb_build_object('level',1,'xp',0,'points',1,'skills','{}'::jsonb);
        hobbies:=jsonb_set(hobbies,'{looter}',looter,true);
      end if;
    else raise exception 'invalid_hobby'; end if;
    result:=jsonb_build_object('ok',true,'unlocked',hobby_id);

  elsif p_action = 'dig' then
    if coalesce((hunter->>'level')::integer,0)<1 then raise exception 'treasure_hunter_locked'; end if;
    site_id:=p_payload->>'site';
    if site_id not in ('cave-1','cave-2','cave-3','route1-1','route1-2') then raise exception 'invalid_treasure_site'; end if;
    site_min_level:=case when site_id='route1-2' then 3 else 1 end;
    if (hunter->>'level')::integer<site_min_level then raise exception 'treasure_site_level_required'; end if;
    if site_id='route1-2' and coalesce((hunter#>>'{skills,trail}')::integer,0)<1 then raise exception 'treasure_site_skill_required';end if;
    site:=coalesce(sites->site_id,'{"hits":0,"depletedUntil":0}'::jsonb);
    if coalesce((site->>'depletedUntil')::bigint,0)>now_ms then raise exception 'treasure_site_recovering'; end if;
    hit_count:=coalesce((site->>'hits')::integer,0)+1;
    if hit_count<5 then
      site:=jsonb_build_object('hits',hit_count,'depletedUntil',0);
      sites:=jsonb_set(sites,array[site_id],site,true);
      result:=jsonb_build_object('ok',true,'hit',hit_count,'total',5,'complete',false);
    else
      site:=jsonb_build_object('hits',0,'depletedUntil',now_ms+(180000+floor(random()*180000))::bigint);
      sites:=jsonb_set(sites,array[site_id],site,true);
      dig_count:=coalesce((stats->>'digs')::bigint,0)+1;
      stats:=jsonb_set(stats,'{digs}',to_jsonb(dig_count),true);
      hobby_xp:=coalesce((hunter->>'xp')::bigint,0)+65;
      hunter:=jsonb_set(hunter,'{xp}',to_jsonb(hobby_xp),true);
      skills:=coalesce(hunter->'skills','{}'::jsonb);
      rare_chance:=least(38,7+greatest(0,(hunter->>'level')::integer-1)*.35+coalesce((skills->>'radar')::integer,0)*2+case when coalesce((cosmetic->>'equipped')::boolean,false) then 3.5 else 0 end);
      epic_chance:=least(14,1+greatest(0,(hunter->>'level')::integer-1)*.12+coalesce((skills->>'deep')::integer,0)*.5);
      relic_chance:=least(4,.15+greatest(0,(hunter->>'level')::integer-1)*.03+coalesce((skills->>'deep')::integer,0)*.1);
      quality_roll:=random()*100;
      tier:=case when quality_roll<relic_chance then 'legendary'
                 when quality_roll<relic_chance+epic_chance then 'epic'
                 when quality_roll<relic_chance+epic_chance+rare_chance then 'rare'
                 else 'common' end;
      chests:=jsonb_set(chests,array[tier],to_jsonb(coalesce((chests->>tier)::bigint,0)+1),true);
      if tier='common' then item_key:='Fragmento Antigo';
      elsif tier='rare' then item_key:='Fragmento Antigo';
      else item_key:='Pedra Antiga'; end if;
      perform adjust_inventory(p_user,item_key,1);loot:=jsonb_set(loot,array[item_key],to_jsonb(1),true);
      if random()<least(.55,.18+coalesce((skills->>'keen')::integer,0)*.035) then
        item_key:=(array['Heart Stone','Crystal Stone','Earth Stone','Rock Stone'])[1+floor(random()*4)::integer];
        perform adjust_inventory(p_user,item_key,1);loot:=jsonb_set(loot,array[item_key],to_jsonb(1),true);
      end if;
      if tier='epic' and random()<.08 then perform apply_wallet_delta_v24(p_user,'diamonds',1,'hobby_treasure','crystal_grotto','v28-treasure-d:'||p_idempotency);loot:=jsonb_set(loot,'{Diamante}',to_jsonb(1),true);end if;
      gold_reward:=35+floor(random()*56)::bigint;
      if tier='legendary' then
        gold_reward:=gold_reward+450;qty:=1+floor(random()*2)::bigint;
        perform apply_wallet_delta_v24(p_user,'diamonds',qty,'hobby_treasure','crystal_grotto','v28-treasure-d:'||p_idempotency);
        loot:=jsonb_set(loot,'{Diamante}',to_jsonb(qty),true);
        perform adjust_inventory(p_user,'Crystal Stone',1);loot:=jsonb_set(loot,'{Crystal Stone}',to_jsonb(1),true);
      end if;
      if coalesce((cosmetic->>'equipped')::boolean,false) then gold_reward:=floor(gold_reward*1.10)::bigint;end if;
      perform apply_wallet_delta_v24(p_user,'gold',gold_reward,'hobby_treasure','crystal_grotto','v28-treasure-g:'||p_idempotency);
      result:=jsonb_build_object('ok',true,'hit',5,'total',5,'complete',true,'tier',tier,'gold',gold_reward,'items',loot,'dig_count',dig_count,'titles',jsonb_build_array());
      for hobby_level in 1..4 loop
        skill_id:=case hobby_level when 1 then 'treasure-hunter:beginner' when 2 then 'treasure-hunter:veteran' when 3 then 'treasure-hunter:master' else 'treasure-hunter:insane' end;
        skill_min:=case hobby_level when 1 then 10 when 2 then 100 when 3 then 1000 else 5000 end;
        if dig_count>=skill_min and not coalesce((titles->>skill_id)::boolean,false) then
          titles:=jsonb_set(titles,array[skill_id],'true'::jsonb,true);
          result:=jsonb_set(result,'{titles}',coalesce(result->'titles','[]'::jsonb)||jsonb_build_array(jsonb_build_object('id',skill_id,'name',case hobby_level when 1 then 'Caçador Iniciante' when 2 then 'Caçador Veterano' when 3 then 'Caçador Mestre' else 'Caçador Insano' end)),true);
        end if;
      end loop;
    end if;

  elsif p_action = 'open-chest' then
    tier:=p_payload->>'tier';
    if tier not in ('common','rare','epic','legendary') or coalesce((chests->>tier)::bigint,0)<1 then raise exception 'chest_not_owned'; end if;
    if coalesce((looter->>'level')::integer,0)=0 then
      looter:=jsonb_build_object('level',1,'xp',0,'points',1,'skills','{}'::jsonb);
    end if;
    chests:=jsonb_set(chests,array[tier],to_jsonb((chests->>tier)::bigint-1),true);
    stats:=jsonb_set(stats,'{chestsOpened}',to_jsonb(coalesce((stats->>'chestsOpened')::bigint,0)+1),true);
    skills:=coalesce(looter->'skills','{}'::jsonb);
    xp_reward:=case tier when 'common' then 60 when 'rare' then 100 when 'epic' then 180 else 360 end;
    xp_reward:=floor(xp_reward*(1+coalesce((skills->>'appraiser')::integer,0)*.15+case when coalesce((cosmetic->>'equipped')::boolean,false) then .1 else 0 end));
    looter:=jsonb_set(looter,'{xp}',to_jsonb(coalesce((looter->>'xp')::bigint,0)+xp_reward),true);
    gold_reward:=case tier when 'common' then 60 when 'rare' then 170 when 'epic' then 360 else 700 end;
    if coalesce((cosmetic->>'equipped')::boolean,false) then gold_reward:=floor(gold_reward*1.10)::bigint;end if;
    perform apply_wallet_delta_v24(p_user,'gold',gold_reward,'hobby_treasure','open_chest','v28-treasure-g:'||p_idempotency);
    item_key:=case tier when 'common' then 'Fragmento Antigo' when 'rare' then 'Heart Stone' when 'epic' then 'Crystal Stone' else 'Crystal Stone' end;
    qty:=case tier when 'common' then 1 when 'rare' then 1 when 'epic' then 2 else 3 end;
    perform adjust_inventory(p_user,item_key,qty);loot:=jsonb_build_object(item_key,qty);
    if tier in ('epic','legendary') then
      qty:=case when tier='legendary' then 3+floor(random()*3)::bigint else 1 end;
      perform apply_wallet_delta_v24(p_user,'diamonds',qty,'hobby_treasure','open_chest','v28-treasure-d:'||p_idempotency);
      loot:=jsonb_set(loot,'{Diamante}',to_jsonb(qty),true);
    end if;
    if coalesce((skills->>'collector')::integer,0)>0 and random()<least(.3,(skills->>'collector')::integer*.05) then
      perform adjust_inventory(p_user,'Fragmento Antigo',1);loot:=jsonb_set(loot,'{Fragmento Antigo}',to_jsonb(coalesce((loot->>'Fragmento Antigo')::bigint,0)+1),true);
    end if;
    result:=jsonb_build_object('ok',true,'tier',tier,'xp',xp_reward,'gold',gold_reward,'items',loot);

  elsif p_action = 'level-up' then
    hobby_id:=p_payload->>'hobby';
    if hobby_id='treasureHunter' then h:=hunter;
    elsif hobby_id='looter' then h:=looter;
    else raise exception 'invalid_hobby'; end if;
    hobby_level:=coalesce((h->>'level')::integer,0);hobby_xp:=coalesce((h->>'xp')::bigint,0);
    if hobby_level<1 then raise exception 'hobby_locked';end if;
    if hobby_level>=100 then raise exception 'hobby_level_cap';end if;
    xp_need:=ceil(100*power(greatest(1,hobby_level)::numeric,1.55))::bigint;
    if hobby_xp<xp_need then raise exception 'hobby_xp_required';end if;
    required_fragment:='Fragmento Antigo';
    fragment_qty:=2+hobby_level*2;
    if coalesce((select quantity from player_inventory where user_id=p_user and item_key=required_fragment),0)<fragment_qty then raise exception 'hobby_material_required';end if;
    if hobby_level%5=4 and coalesce((select quantity from player_inventory where user_id=p_user and item_key='Crystal Stone'),0)<1 then raise exception 'crystal_stone_required';end if;
    perform adjust_inventory(p_user,required_fragment,-fragment_qty);
    if hobby_level%5=4 then perform adjust_inventory(p_user,'Crystal Stone',-1);end if;
    h:=jsonb_set(h,'{level}',to_jsonb(hobby_level+1),true);
    h:=jsonb_set(h,'{xp}',to_jsonb(hobby_xp-xp_need),true);
    h:=jsonb_set(h,'{points}',to_jsonb(coalesce((h->>'points')::integer,0)+1),true);
    if hobby_id='treasureHunter' then hunter:=h;hobbies:=jsonb_set(hobbies,'{treasureHunter}',hunter,true);else looter:=h;hobbies:=jsonb_set(hobbies,'{looter}',looter,true);end if;
    result:=jsonb_build_object('ok',true,'hobby',hobby_id,'level',hobby_level+1);

  elsif p_action = 'skill-buy' then
    hobby_id:=p_payload->>'hobby';skill_id:=p_payload->>'skill';
    if hobby_id='treasureHunter' then h:=hunter;
    elsif hobby_id='looter' then h:=looter;
    else raise exception 'invalid_hobby';end if;
    skills:=coalesce(h->'skills','{}'::jsonb);skill_rank:=coalesce((skills->>skill_id)::integer,0);
    skill_max:=case skill_id when 'radar' then 3 when 'keen' then 3 when 'trail' then 1 when 'deep' then 3 when 'appraiser' then 3 when 'collector' then 3 when 'rollluck' then 3 when 'connoisseur' then 1 else 0 end;
    skill_min:=case skill_id when 'radar' then 2 when 'appraiser' then 2 when 'keen' then 4 when 'collector' then 4 when 'trail' then 5 when 'deep' then 8 when 'rollluck' then 8 when 'connoisseur' then 10 else 101 end;
    if skill_max=0 or skill_rank>=skill_max or coalesce((h->>'points')::integer,0)<1 or coalesce((h->>'level')::integer,0)<skill_min then raise exception 'hobby_skill_requirement';end if;
    if skill_id in ('keen','trail') and coalesce((skills->>'radar')::integer,0)<1 then raise exception 'hobby_skill_prerequisite';end if;
    if skill_id='deep' and (coalesce((skills->>'keen')::integer,0)<1 or coalesce((skills->>'trail')::integer,0)<1) then raise exception 'hobby_skill_prerequisite';end if;
    if skill_id in ('collector') and coalesce((skills->>'appraiser')::integer,0)<1 then raise exception 'hobby_skill_prerequisite';end if;
    if skill_id='rollluck' and coalesce((skills->>'collector')::integer,0)<1 then raise exception 'hobby_skill_prerequisite';end if;
    if skill_id='connoisseur' and coalesce((skills->>'rollluck')::integer,0)<1 then raise exception 'hobby_skill_prerequisite';end if;
    h:=jsonb_set(h,'{points}',to_jsonb(coalesce((h->>'points')::integer,0)-1),true);
    h:=jsonb_set(h,array['skills',skill_id],to_jsonb(skill_rank+1),true);
    if hobby_id='treasureHunter' then hunter:=h;hobbies:=jsonb_set(hobbies,'{treasureHunter}',hunter,true);else looter:=h;hobbies:=jsonb_set(hobbies,'{looter}',looter,true);end if;
    result:=jsonb_build_object('ok',true,'hobby',hobby_id,'skill',skill_id,'rank',skill_rank+1);

  elsif p_action = 'treasure-roll' then
    if coalesce((looter->>'level')::integer,0)<10 then raise exception 'looter_level_10_required';end if;
    select pl.diamonds into balance from players as pl where pl.user_id=p_user for update;
    if coalesce(balance,0)<10 then raise exception 'insufficient_diamonds';end if;
    perform apply_wallet_delta_v24(p_user,'diamonds',-10,'treasure_roll','crystal_grotto','v28-treasure-cost:'||p_idempotency);
    skills:=coalesce(looter->'skills','{}'::jsonb);roll_luck:=coalesce((skills->>'rollluck')::integer,0);costume_chance:=least(2,.5+coalesce((skills->>'connoisseur')::numeric,0)*.5+roll_luck*.1);pack_threshold:=least(94.5,93+roll_luck*.5);roll_value:=random()*100;
    if roll_value<45 then
      qty:=2+floor(random()*4)::bigint;perform apply_wallet_delta_v24(p_user,'diamonds',qty,'treasure_roll','crystal_grotto','v28-treasure-win-d:'||p_idempotency);result:=jsonb_build_object('ok',true,'prize',jsonb_build_object('kind','diamonds','quantity',qty));
    elsif roll_value<75 then
      qty:=3+floor(random()*3)::bigint;item_key:=(array['Heart Stone','Crystal Stone','Earth Stone','Rock Stone'])[1+floor(random()*4)::integer];perform adjust_inventory(p_user,item_key,qty);result:=jsonb_build_object('ok',true,'prize',jsonb_build_object('kind','stones','item',item_key,'quantity',qty));
    elsif roll_value<pack_threshold then
      pack_key:=case when random()<.68 then 'urp' else 'urpp' end;st:=jsonb_set(st,array['packs',pack_key],to_jsonb(coalesce((st#>>array['packs',pack_key])::bigint,0)+1),true);result:=jsonb_build_object('ok',true,'prize',jsonb_build_object('kind','pack','pack',pack_key,'quantity',1));
    elsif roll_value<100-costume_chance then
      psycoin_tenths:=coalesce((h->>'psycoinTenths')::integer,0)+1;
      if psycoin_tenths>=10 then perform apply_wallet_delta_v24(p_user,'psycoin',1,'treasure_roll','crystal_grotto','v28-treasure-psycoin:'||p_idempotency);psycoin_tenths:=psycoin_tenths-10;end if;
      h:=jsonb_set(h,'{psycoinTenths}',to_jsonb(psycoin_tenths),true);result:=jsonb_build_object('ok',true,'prize',jsonb_build_object('kind','psycoin','amount','0.1'));
    else
      cosmetic:=jsonb_set(cosmetic,'{bountyHunter}','true'::jsonb,true);cosmetic:=jsonb_set(cosmetic,'{equipped}','true'::jsonb,true);result:=jsonb_build_object('ok',true,'prize',jsonb_build_object('kind','bountyHunter','name','Traje do Caçador de Recompensas'));
    end if;

  elsif p_action = 'equip-cosmetic' then
    if not coalesce((cosmetic->>'bountyHunter')::boolean,false) then raise exception 'bounty_hunter_costume_not_owned';end if;
    cosmetic:=jsonb_set(cosmetic,'{equipped}',coalesce(p_payload->'equipped','false'::jsonb),true);
    result:=jsonb_build_object('ok',true,'equipped',(cosmetic->>'equipped')::boolean);
  end if;

  hobbies:=jsonb_set(hobbies,'{treasureHunter}',hunter,true);
  hobbies:=jsonb_set(hobbies,'{looter}',looter,true);
  h:=jsonb_set(h,'{hobbies}',hobbies,true);
  h:=jsonb_set(h,'{sites}',sites,true);
  h:=jsonb_set(h,'{chests}',chests,true);
  h:=jsonb_set(h,'{stats}',stats,true);
  h:=jsonb_set(h,'{titles}',titles,true);
  h:=jsonb_set(h,'{cosmetic}',cosmetic,true);
  st:=jsonb_set(st,'{treasure_hunt}',h,true);
  update player_system_state set state=st,revision=revision+1,updated_at=now() where user_id=p_user;
  result:=coalesce(result,'{}'::jsonb)||psy_v26_snapshot(p_user)||jsonb_build_object('ok',true,'system',st);
  insert into game_action_receipts(user_id,idempotency_key,action,result)
    values(p_user,p_idempotency,'treasure-'||p_action,result);
  return result;
end;
$$;

revoke execute on function public.psy_v28_treasure_action_v1(uuid,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.psy_v28_treasure_action_v1(uuid,text,jsonb,text) to service_role;

-- The collectible bounty outfit has modest, server-verified battle bonuses.
create or replace function public.psy_v27_battle_reward(
  p_user uuid,p_mode text,p_enemy_level integer,p_enemy_type text,
  p_gold_buff numeric,p_xp_buff numeric,p_drop_buff numeric,p_idempotency text
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  prior jsonb;st jsonb;progress jsonb;typekills jsonb;result jsonb;
  loot jsonb:='{}'::jsonb;gold_reward bigint;xp_reward bigint;kills bigint;tk bigint;
  vip_until bigint:=0;now_ms bigint:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
  drop_value numeric;qty_steps numeric;common_qty integer;uncommon_chance numeric;stone_chance numeric;
  common_item text;uncommon_item text;matching_stone text;
  bounty_equipped boolean:=false;
  typ text:=initcap(lower(coalesce(p_enemy_type,'Normal')));
begin
  if lower(coalesce(p_mode,'')) not in ('wild','hunt','fast','world') then raise exception 'invalid battle mode';end if;
  if p_idempotency is null or length(p_idempotency)<8 or length(p_idempotency)>180 then raise exception 'invalid_idempotency_key';end if;
  if p_enemy_level<1 or p_enemy_level>10000 then raise exception 'invalid_enemy_level';end if;
  if typ not in ('Normal','Fire','Water','Grass','Electric','Ice','Fighting','Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy') then raise exception 'invalid_battle_type';end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user::text||':battle:'||p_idempotency,0));
  select receipt.result into prior from game_action_receipts as receipt where receipt.user_id=p_user and receipt.idempotency_key=p_idempotency;
  if prior is not null then return prior;end if;
  insert into player_system_state(user_id,state) values(p_user,'{}'::jsonb) on conflict(user_id) do nothing;
  select state into st from player_system_state where user_id=p_user for update;
  begin vip_until:=coalesce((st->>'vip_until')::bigint,0);exception when others then vip_until:=0;end;
  bounty_equipped:=coalesce((st#>>'{treasure_hunt,cosmetic,equipped}')::boolean,false);
  if lower(p_mode)='world' then
    gold_reward:=floor(p_enemy_level*12*(1+greatest(0,least(300,p_gold_buff))/100)*.5);
    xp_reward:=floor(p_enemy_level*10*(1+(greatest(0,least(300,p_xp_buff))+(case when vip_until>now_ms then 50 else 0 end))/100)*.5);
  else
    gold_reward:=floor((p_enemy_level*18+80)*(1+greatest(0,least(300,p_gold_buff))/100));
    xp_reward:=floor((p_enemy_level*85+150)*(1+(greatest(0,least(300,p_xp_buff))+(case when vip_until>now_ms then 50 else 0 end))/100));
  end if;
  if bounty_equipped then gold_reward:=floor(gold_reward*1.10);xp_reward:=floor(xp_reward*1.10);end if;
  perform apply_wallet_delta_v24(p_user,'gold',gold_reward,'battle',lower(p_mode),'v27-battle-g:'||p_idempotency);
  progress:=coalesce(st->'progress','{}'::jsonb);
  begin kills:=coalesce((progress->>'kills')::bigint,0)+1;exception when others then kills:=1;end;
  progress:=jsonb_set(progress,'{kills}',to_jsonb(kills),true);
  typekills:=coalesce(progress->'type_kills','{}'::jsonb);
  begin tk:=coalesce((typekills->>typ)::bigint,0)+1;exception when others then tk:=1;end;
  typekills:=jsonb_set(typekills,array[typ],to_jsonb(tk),true);progress:=jsonb_set(progress,'{type_kills}',typekills,true);
  case typ
    when 'Normal' then common_item:='Rubber Ball';uncommon_item:='Giant Piece Of Fur';matching_stone:='Heart Stone';
    when 'Fire' then common_item:='Essence Of Fire';uncommon_item:='Fire Tail';matching_stone:='Fire Stone';
    when 'Water' then common_item:='Water Gem';uncommon_item:='Water Pendant';matching_stone:='Water Stone';
    when 'Grass' then common_item:='Seed';uncommon_item:='Leaves';matching_stone:='Leaf Stone';
    when 'Electric' then common_item:='Screw';uncommon_item:='Electric Rat Tail';matching_stone:='Thunder Stone';
    when 'Ice' then common_item:='Snowball';uncommon_item:='Ice Orb';matching_stone:='Ice Stone';
    when 'Fighting' then common_item:='Band Aid';uncommon_item:='Belt Of Champion';matching_stone:='Punch Stone';
    when 'Poison' then common_item:='Bottle Of Poison';uncommon_item:='Bug Venom';matching_stone:='Venom Stone';
    when 'Ground' then common_item:='Earth Ball';uncommon_item:='Sandbag';matching_stone:='Earth Stone';
    when 'Flying' then common_item:='Straw';uncommon_item:='Feather';matching_stone:='Flying Stone';
    when 'Psychic' then common_item:='Enchanted Gem';uncommon_item:='Psychic Spoon';matching_stone:='Enigma Stone';
    when 'Bug' then common_item:='Bug Gosme';uncommon_item:='Bug Antenna';matching_stone:='Cocoon Stone';
    when 'Rock' then common_item:='Small Stone';uncommon_item:='Strange Rock';matching_stone:='Rock Stone';
    when 'Ghost' then common_item:='Ghost Essence';uncommon_item:='Bat Wing';matching_stone:='Darkness Stone';
    when 'Dragon' then common_item:='Dragon Scale';uncommon_item:='Dragon Tooth';matching_stone:='Crystal Stone';
    when 'Dark' then common_item:='Dark Gem';uncommon_item:='Dark Ear';matching_stone:='Darkness Stone';
    when 'Steel' then common_item:='Piece Of Steel';uncommon_item:='Metal Hull';matching_stone:='Metal Stone';
    when 'Fairy' then common_item:='Rubber Ball';uncommon_item:='Cute Ball';matching_stone:='Heart Stone';
  end case;
  drop_value:=least(300,greatest(0,least(300,coalesce(p_drop_buff,0))+(case when vip_until>now_ms then 50 else 0 end)+(case when bounty_equipped then 10 else 0 end)));
  qty_steps:=drop_value*9/300;common_qty:=1+floor(qty_steps)::integer;
  if random()<qty_steps-floor(qty_steps) then common_qty:=common_qty+1;end if;
  common_qty:=least(10,greatest(1,common_qty));uncommon_chance:=.30+.20*drop_value/300;stone_chance:=.01+.09*drop_value/300;
  perform adjust_inventory(p_user,common_item,common_qty);loot:=loot||jsonb_build_object(common_item,common_qty);
  if random()<uncommon_chance then perform adjust_inventory(p_user,uncommon_item,1);loot:=loot||jsonb_build_object(uncommon_item,1);end if;
  if random()<stone_chance then perform adjust_inventory(p_user,matching_stone,1);loot:=loot||jsonb_build_object(matching_stone,1);end if;
  st:=jsonb_set(st,'{progress}',progress,true);
  update player_system_state set state=st,revision=revision+1,updated_at=now() where user_id=p_user;
  result:=psy_v26_snapshot(p_user)||jsonb_build_object('ok',true,'gold_reward',gold_reward,'xp_reward',xp_reward,'quest_loot',loot,'mode',lower(p_mode),'bounty_bonus',bounty_equipped);
  insert into game_action_receipts(user_id,idempotency_key,action,result) values(p_user,p_idempotency,'battle-win',result);
  return result;
end;
$$;

revoke execute on function public.psy_v27_battle_reward(uuid,text,integer,text,numeric,numeric,numeric,text) from public,anon,authenticated;
grant execute on function public.psy_v27_battle_reward(uuid,text,integer,text,numeric,numeric,numeric,text) to service_role;
