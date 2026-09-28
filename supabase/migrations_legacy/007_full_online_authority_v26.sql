-- PSYWORLD V26 — server authority for meta economy, progression claims and entitlements

alter table public.players add column if not exists system_imported_at timestamptz;

create table if not exists public.player_system_state (
  user_id uuid primary key references public.players(user_id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_action_receipts (
  user_id uuid not null references public.players(user_id) on delete cascade,
  idempotency_key text not null,
  action text not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key(user_id,idempotency_key)
);

alter table public.player_system_state enable row level security;
alter table public.game_action_receipts enable row level security;
drop policy if exists player_system_state_read_self on public.player_system_state;
create policy player_system_state_read_self on public.player_system_state for select to authenticated using (auth.uid()=user_id);
drop policy if exists game_action_receipts_read_self on public.game_action_receipts;
create policy game_action_receipts_read_self on public.game_action_receipts for select to authenticated using (auth.uid()=user_id);
grant select on public.player_system_state,public.game_action_receipts to authenticated;
revoke insert,update,delete on public.player_system_state,public.game_action_receipts from public,anon,authenticated;

-- Keep the server shop on the item family used by the current V22 client.
delete from public.shop_catalog where category='stone';
insert into public.shop_catalog(item_key,buy_gold,sell_gold,sellable,category) values
('Fire Stone',20000,10000,true,'stone'),('Water Stone',20000,10000,true,'stone'),
('Leaf Stone',20000,10000,true,'stone'),('Thunder Stone',20000,10000,true,'stone'),
('Ice Stone',20000,10000,true,'stone'),('Punch Stone',20000,10000,true,'stone'),
('Venom Stone',20000,10000,true,'stone'),('Earth Stone',20000,10000,true,'stone'),
('Feather Stone',20000,10000,true,'stone'),('Enigma Stone',20000,10000,true,'stone'),
('Cocoon Stone',20000,10000,true,'stone'),('Rock Stone',20000,10000,true,'stone'),
('Crystal Stone',20000,10000,true,'stone'),('Darkness Stone',20000,10000,true,'stone'),
('Metal Stone',20000,10000,true,'stone'),('Heart Stone',20000,10000,true,'stone')
on conflict(item_key) do update set buy_gold=excluded.buy_gold,sell_gold=excluded.sell_gold,sellable=excluded.sellable,category=excluded.category;

create or replace function public.psy_v26_snapshot(p_user uuid) returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  p jsonb;
  inv jsonb;
  st jsonb;
begin
  select jsonb_build_object(
    'trainer_name',trainer_name,'trainer_level',trainer_level,'trainer_xp',trainer_xp,
    'gold',gold,'diamonds',diamonds,'psycoin',psycoin,'authority_version',authority_version,
    'legacy_imported_at',legacy_imported_at,'system_imported_at',system_imported_at,'updated_at',updated_at
  ) into p from players where user_id=p_user;
  if p is null then raise exception 'missing player'; end if;
  select coalesce(jsonb_object_agg(item_key,quantity),'{}'::jsonb) into inv from player_inventory where user_id=p_user and quantity>0;
  select coalesce(state,'{}'::jsonb) into st from player_system_state where user_id=p_user;
  return jsonb_build_object('player',p,'inventory',coalesce(inv,'{}'::jsonb),'system',coalesce(st,'{}'::jsonb),'market_enabled',false);
end $$;
revoke execute on function public.psy_v26_snapshot(uuid) from public,anon,authenticated;

create or replace function public.psy_v26_action(
  p_user uuid,
  p_action text,
  p_payload jsonb,
  p_idempotency text
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  st jsonb;
  prior jsonb;
  out_result jsonb;
  progress jsonb;
  bp jsonb;
  claims jsonb;
  repeats jsonb;
  roulette jsonb;
  packs jsonb;
  eggs jsonb;
  psy jsonb;
  skills jsonb;
  helpers jsonb;
  action_key text:=lower(trim(coalesce(p_action,'')));
  now_ms bigint:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
  n bigint;
  oldn bigint;
  qty bigint;
  cost bigint;
  bal bigint;
  xp bigint;
  gold_reward bigint:=0;
  dia_reward bigint:=0;
  goal bigint;
  completed bigint;
  claimed bigint;
  available bigint;
  id text;
  kind text;
  typ text;
  common_item text;
  rare_item text;
  ball_item text;
  pack_key text;
  currency text;
  product text;
  price bigint;
  idx integer;
  vip_until bigint;
  is_vip boolean;
  weight numeric;
  lv integer;
  maxlv integer;
  mon record;
begin
  if p_idempotency is null or length(trim(p_idempotency))<8 or length(p_idempotency)>180 then raise exception 'invalid idempotency key'; end if;
  if p_payload is null then p_payload:='{}'::jsonb; end if;
  if jsonb_typeof(p_payload)<>'object' then raise exception 'invalid payload'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user::text||':v26:'||p_idempotency,0));
  select result into prior from game_action_receipts where user_id=p_user and idempotency_key=p_idempotency;
  if prior is not null then return prior; end if;

  if not exists(select 1 from players where user_id=p_user) then raise exception 'missing player'; end if;
  insert into player_system_state(user_id,state) values(p_user,'{}'::jsonb) on conflict(user_id) do nothing;
  select state into st from player_system_state where user_id=p_user for update;
  st:=coalesce(st,'{}'::jsonb);
  progress:=coalesce(st->'progress','{}'::jsonb);
  bp:=coalesce(st->'battle_pass','{}'::jsonb);
  claims:=coalesce(st->'achievement_claims','{}'::jsonb);
  repeats:=coalesce(st->'repeat_claims','{}'::jsonb);
  roulette:=coalesce(st->'roulette','{}'::jsonb);
  packs:=coalesce(st->'packs','{}'::jsonb);
  eggs:=coalesce(st->'eggs','{}'::jsonb);
  psy:=coalesce(st->'psy','{}'::jsonb);

  if action_key='seed' then
    if (select system_imported_at is null from players where user_id=p_user) then
      progress:=jsonb_build_object(
        'kills',greatest(0,least(1000000000,coalesce((p_payload#>>'{progress,kills}')::bigint,0))),
        'captures',greatest(0,least(100000000,coalesce((p_payload#>>'{progress,captures}')::bigint,0))),
        'egg_hatches',greatest(0,least(100000000,coalesce((p_payload#>>'{progress,egg_hatches}')::bigint,0))),
        'dex',greatest(0,least(2000,coalesce((p_payload#>>'{progress,dex}')::bigint,0))),
        'gyms',greatest(0,least(1000,coalesce((p_payload#>>'{progress,gyms}')::bigint,0))),
        'survivor_best',greatest(0,least(10000,coalesce((p_payload#>>'{progress,survivor_best}')::bigint,0))),
        'card_wins',greatest(0,least(1000000,coalesce((p_payload#>>'{progress,card_wins}')::bigint,0))),
        'type_kills',coalesce(p_payload#>'{progress,type_kills}','{}'::jsonb)
      );
      bp:=coalesce(p_payload->'battle_pass','{}'::jsonb);
      claims:=coalesce(p_payload->'achievement_claims','{}'::jsonb);
      repeats:=coalesce(p_payload->'repeat_claims','{}'::jsonb);
      packs:=coalesce(p_payload->'packs','{}'::jsonb);
      eggs:=coalesce(p_payload->'eggs','{}'::jsonb);
      psy:=coalesce(p_payload->'psy','{}'::jsonb);
      roulette:=jsonb_build_object(
        'spins',greatest(0,least(10000,coalesce((p_payload#>>'{roulette,spins}')::bigint,0))),
        'progress',greatest(0,least(1799,coalesce((p_payload#>>'{roulette,progress}')::bigint,0))),
        'last_heartbeat_ms',now_ms
      );
      vip_until:=greatest(0,coalesce((p_payload->>'vip_until')::bigint,0));
      st:=jsonb_set(st,'{vip_until}',to_jsonb(vip_until),true);
      st:=jsonb_set(st,'{card_best}',to_jsonb(greatest(0,least(500,coalesce((p_payload->>'card_best')::bigint,0)))),true);
      update players set system_imported_at=now(),updated_at=now() where user_id=p_user;
    end if;
    out_result:=jsonb_build_object('ok',true,'seeded',true);

  elsif action_key='progress-sync' then
    foreach kind in array array['kills','captures','egg_hatches','dex','gyms','survivor_best','card_wins'] loop
      begin n:=greatest(0,least(1000000000,coalesce((p_payload->>kind)::bigint,0))); exception when others then n:=0; end;
      begin oldn:=greatest(0,coalesce((progress->>kind)::bigint,0)); exception when others then oldn:=0; end;
      progress:=jsonb_set(progress,array[kind],to_jsonb(greatest(oldn,n)),true);
    end loop;
    if jsonb_typeof(p_payload->'type_kills')='object' then
      for kind,n in select key,greatest(0,least(1000000000,(value#>>'{}')::bigint)) from jsonb_each(p_payload->'type_kills') loop
        begin oldn:=coalesce((progress#>>array['type_kills',kind])::bigint,0); exception when others then oldn:=0; end;
        progress:=jsonb_set(progress,array['type_kills',kind],to_jsonb(greatest(oldn,n)),true);
      end loop;
    end if;
    out_result:=jsonb_build_object('ok',true,'progress',progress);

  elsif action_key='vip-buy' then
    qty:=coalesce((p_payload->>'days')::bigint,0);
    cost:=case qty when 5 then 3 when 7 then 5 when 30 then 10 when 60 then 15 when 90 then 25 else 0 end;
    if cost=0 then raise exception 'invalid vip plan'; end if;
    bal:=apply_wallet_delta_v24(p_user,'psycoin',-cost,'vip_buy',qty::text,'v26-vip:'||p_idempotency);
    vip_until:=greatest(now_ms,coalesce((st->>'vip_until')::bigint,0))+qty*86400000;
    st:=jsonb_set(st,'{vip_until}',to_jsonb(vip_until),true);
    out_result:=jsonb_build_object('ok',true,'vip_until',vip_until,'psycoin',bal,'days',qty,'cost',cost);

  elsif action_key='pass-buy-xp' then
    qty:=greatest(1,least(100,coalesce((p_payload->>'qty')::bigint,1)));
    begin xp:=greatest(0,least(100000,coalesce((bp->>'xp')::bigint,0))); exception when others then xp:=0; end;
    if xp>=100000 then raise exception 'pass already max'; end if;
    bal:=apply_wallet_delta_v24(p_user,'psycoin',-qty,'battlepass_xp','season','v26-passxp:'||p_idempotency);
    xp:=least(100000,xp+qty*1500);
    bp:=jsonb_set(bp,'{xp}',to_jsonb(xp),true);
    out_result:=jsonb_build_object('ok',true,'xp',xp,'psycoin',bal,'bought_xp',qty*1500);

  elsif action_key='pass-premium' then
    if coalesce((bp->>'premium')::boolean,false) then raise exception 'premium already active'; end if;
    cost:=case when coalesce((bp->>'coupon_available')::boolean,false) then 7 else 10 end;
    bal:=apply_wallet_delta_v24(p_user,'psycoin',-cost,'battlepass_premium','season','v26-passpremium:'||p_idempotency);
    bp:=jsonb_set(bp,'{premium}','true'::jsonb,true);
    if cost=7 then bp:=jsonb_set(bp,'{coupon_available}','false'::jsonb,true); end if;
    out_result:=jsonb_build_object('ok',true,'premium',true,'psycoin',bal,'cost',cost);

  elsif action_key='achievement-claim' then
    id:=coalesce(p_payload->>'id','');
    if claims ? id then raise exception 'achievement already claimed'; end if;
    if id='kill50' then kind:='kills';goal:=50;gold_reward:=50000;dia_reward:=5;
    elsif id='kill300' then kind:='kills';goal:=300;gold_reward:=180000;dia_reward:=12;
    elsif id='cap25' then kind:='captures';goal:=25;gold_reward:=120000;dia_reward:=8;
    elsif id='dex100' then kind:='dex';goal:=100;gold_reward:=350000;dia_reward:=15;
    elsif id='gym8' then kind:='gyms';goal:=8;gold_reward:=400000;dia_reward:=20;
    elsif id='egg5' then kind:='egg_hatches';goal:=5;gold_reward:=200000;dia_reward:=10;
    elsif id='album100' then kind:='album';goal:=100;gold_reward:=250000;dia_reward:=12;
    elsif id='surv10' then kind:='survivor_best';goal:=10;gold_reward:=300000;dia_reward:=15;
    elsif id='surv50' then kind:='survivor_best';goal:=50;gold_reward:=1200000;dia_reward:=50;
    elsif id='tlv25' then kind:='trainer';goal:=25;gold_reward:=300000;dia_reward:=15;
    else raise exception 'invalid achievement'; end if;
    if kind='trainer' then select trainer_level into n from players where user_id=p_user;
    elsif kind='album' then n:=greatest(0,coalesce((p_payload->>'progress')::bigint,0));
    else begin n:=coalesce((progress->>kind)::bigint,0); exception when others then n:=0; end; end if;
    if n<goal then raise exception 'achievement not complete'; end if;
    if gold_reward>0 then bal:=apply_wallet_delta_v24(p_user,'gold',gold_reward,'achievement',id,'v26-ach-g:'||p_idempotency); end if;
    if dia_reward>0 then perform apply_wallet_delta_v24(p_user,'diamonds',dia_reward,'achievement',id,'v26-ach-d:'||p_idempotency); end if;
    claims:=jsonb_set(claims,array[id],'true'::jsonb,true);
    out_result:=psy_v26_snapshot(p_user)||jsonb_build_object('ok',true,'achievement',id);

  elsif action_key='repeat-claim' then
    id:=coalesce(p_payload->>'id','');typ:=coalesce(p_payload->>'type','');
    if id='rk50' then kind:='kills';goal:=50;gold_reward:=45000;dia_reward:=1;
    elsif id='rc20' then kind:='captures';goal:=20;gold_reward:=80000;dia_reward:=1;
    elsif id='re5' then kind:='egg_hatches';goal:=5;gold_reward:=70000;dia_reward:=1;
    elsif id='rt' then kind:='type';goal:=50;gold_reward:=90000;dia_reward:=2;id:='rt:'||left(typ,32);
    else raise exception 'invalid repeat'; end if;
    if kind='type' then begin n:=coalesce((progress#>>array['type_kills',typ])::bigint,0); exception when others then n:=0; end;
    else begin n:=coalesce((progress->>kind)::bigint,0); exception when others then n:=0; end; end if;
    completed:=floor(n::numeric/goal)::bigint;
    begin claimed:=coalesce((repeats->>id)::bigint,0); exception when others then claimed:=0; end;
    available:=greatest(0,completed-claimed); if available<1 then raise exception 'no repeat reward'; end if;
    gold_reward:=gold_reward*available;dia_reward:=dia_reward*available;
    perform apply_wallet_delta_v24(p_user,'gold',gold_reward,'repeat',id,'v26-rep-g:'||p_idempotency);
    if dia_reward>0 then perform apply_wallet_delta_v24(p_user,'diamonds',dia_reward,'repeat',id,'v26-rep-d:'||p_idempotency); end if;
    repeats:=jsonb_set(repeats,array[id],to_jsonb(claimed+available),true);
    out_result:=psy_v26_snapshot(p_user)||jsonb_build_object('ok',true,'cycles',available,'repeat_id',id);

  elsif action_key='roulette-heartbeat' then
    begin n:=coalesce((roulette->>'last_heartbeat_ms')::bigint,now_ms); exception when others then n:=now_ms; end;
    begin oldn:=coalesce((roulette->>'progress')::bigint,0); exception when others then oldn:=0; end;
    begin qty:=coalesce((roulette->>'spins')::bigint,0); exception when others then qty:=0; end;
    if now_ms>n then oldn:=oldn+least(10,greatest(0,(now_ms-n)/1000)); end if;
    if oldn>=1800 then qty:=qty+floor(oldn::numeric/1800)::bigint;oldn:=mod(oldn,1800); end if;
    roulette:=jsonb_build_object('spins',qty,'progress',oldn,'last_heartbeat_ms',now_ms);
    out_result:=jsonb_build_object('ok',true,'roulette',roulette);

  elsif action_key='roulette-spin' then
    begin qty:=coalesce((roulette->>'spins')::bigint,0); exception when others then qty:=0; end;
    if qty<1 then raise exception 'no roulette spin'; end if;
    roulette:=jsonb_set(roulette,'{spins}',to_jsonb(qty-1),true);
    idx:=floor(random()*8)::integer;
    if idx=0 then gold_reward:=50000;out_result:=jsonb_build_object('label','50.000 Gold','icon','🪙');
    elsif idx=1 then gold_reward:=100000;out_result:=jsonb_build_object('label','100.000 Gold','icon','🪙');
    elsif idx=2 then dia_reward:=2;out_result:=jsonb_build_object('label','2 Diamantes','icon','💎');
    elsif idx=3 then dia_reward:=5;out_result:=jsonb_build_object('label','5 Diamantes','icon','💎');
    elsif idx=4 then out_result:=jsonb_build_object('label','ATK +15% • 20 min','icon','⚔️','buff_kind','dmg','buff_amount',15,'buff_minutes',20);
    elsif idx=5 then out_result:=jsonb_build_object('label','XP +25% • 20 min','icon','⭐','buff_kind','xp','buff_amount',25,'buff_minutes',20);
    elsif idx=6 then out_result:=jsonb_build_object('label','Captura +15% • 20 min','icon','🎯','buff_kind','cap','buff_amount',15,'buff_minutes',20);
    else out_result:=jsonb_build_object('label','Gold +25% • 20 min','icon','💰','buff_kind','gold','buff_amount',25,'buff_minutes',20); end if;
    if gold_reward>0 then perform apply_wallet_delta_v24(p_user,'gold',gold_reward,'roulette','journey','v26-wheel-g:'||p_idempotency); end if;
    if dia_reward>0 then perform apply_wallet_delta_v24(p_user,'diamonds',dia_reward,'roulette','journey','v26-wheel-d:'||p_idempotency); end if;
    out_result:=out_result||jsonb_build_object('ok',true,'roulette',roulette)||psy_v26_snapshot(p_user);

  elsif action_key='quest-claim' then
    typ:=coalesce(p_payload->>'type','');
    if typ='Normal' then common_item:='Rubber Ball';rare_item:='Giant Piece Of Fur';ball_item:='Normal Ball';
    elsif typ='Fire' then common_item:='Essence Of Fire';rare_item:='Fire Tail';ball_item:='Fire Ball';
    elsif typ='Water' then common_item:='Water Gem';rare_item:='Water Pendant';ball_item:='Water Ball';
    elsif typ='Grass' then common_item:='Seed';rare_item:='Great Petal';ball_item:='Grass Ball';
    elsif typ='Electric' then common_item:='Screw';rare_item:='Electric Rat Tail';ball_item:='Electric Ball';
    elsif typ='Ice' then common_item:='Snowball';rare_item:='Ice Orb';ball_item:='Ice Ball';
    elsif typ='Fighting' then common_item:='Band Aid';rare_item:='Belt Of Champion';ball_item:='Fighting Ball';
    elsif typ='Poison' then common_item:='Bottle Of Poison';rare_item:='Bug Venom';ball_item:='Poison Ball';
    elsif typ='Ground' then common_item:='Earth Ball';rare_item:='Piece Of Diglett';ball_item:='Ground Ball';
    elsif typ='Flying' then common_item:='Straw';rare_item:='Giant Beak';ball_item:='Flying Ball';
    elsif typ='Psychic' then common_item:='Enchanted Gem';rare_item:='Psychic Spoon';ball_item:='Psychic Ball';
    elsif typ='Bug' then common_item:='Bug Gosme';rare_item:='Bug Antenna';ball_item:='Bug Ball';
    elsif typ='Rock' then common_item:='Small Stone';rare_item:='Strange Rock';ball_item:='Rock Ball';
    elsif typ='Ghost' then common_item:='Ghost Essence';rare_item:='Bat Wing';ball_item:='Ghost Ball';
    elsif typ='Dragon' then common_item:='Dragon Scale';rare_item:='Dragon Tooth';ball_item:='Dragon Ball';
    elsif typ='Dark' then common_item:='Dark Gem';rare_item:='Dark Ear';ball_item:='Dark Ball';
    elsif typ='Steel' then common_item:='Piece Of Steel';rare_item:='Metal Hull';ball_item:='Steel Ball';
    elsif typ='Fairy' then common_item:='Rubber Ball';rare_item:='Cute Ball';ball_item:='Fairy Ball';
    else raise exception 'invalid quest type'; end if;
    perform adjust_inventory(p_user,common_item,-18);perform adjust_inventory(p_user,rare_item,-3);perform adjust_inventory(p_user,ball_item,1);
    perform apply_wallet_delta_v24(p_user,'gold',42000,'quest',typ,'v26-quest-g:'||p_idempotency);
    out_result:=psy_v26_snapshot(p_user)||jsonb_build_object('ok',true,'quest_type',typ,'ball',ball_item);

  elsif action_key='card-win' then
    n:=greatest(1,least(500,coalesce((p_payload->>'stage')::bigint,1)));
    begin oldn:=coalesce((st->>'card_best')::bigint,0); exception when others then oldn:=0; end;
    if n<>oldn+1 then raise exception 'invalid card stage sequence'; end if;
    gold_reward:=floor((2200+n*165)*(case when mod(n,10)=0 then 1.7 else 1 end))::bigint;
    dia_reward:=case when mod(n,10)=0 then least(6,1+floor(n::numeric/100)::bigint) else 0 end;
    perform apply_wallet_delta_v24(p_user,'gold',gold_reward,'card_win',n::text,'v26-card-g:'||p_idempotency);
    if dia_reward>0 then perform apply_wallet_delta_v24(p_user,'diamonds',dia_reward,'card_win',n::text,'v26-card-d:'||p_idempotency); end if;
    st:=jsonb_set(st,'{card_best}',to_jsonb(n),true);
    progress:=jsonb_set(progress,'{card_wins}',to_jsonb(coalesce((progress->>'card_wins')::bigint,0)+1),true);
    if mod(n,10)=0 and random()<.045 then
      oldn:=coalesce((packs->>'ss')::bigint,0)+1;packs:=jsonb_set(packs,'{ss}',to_jsonb(oldn),true);
      out_result:=jsonb_build_object('pack_ss',true);
    else out_result:=jsonb_build_object('pack_ss',false); end if;
    out_result:=out_result||psy_v26_snapshot(p_user)||jsonb_build_object('ok',true,'stage',n,'gold_reward',gold_reward,'diamonds_reward',dia_reward);

  elsif action_key='psy-reset' then
    select pokemon_uid,level,resets into mon from player_pokemon where owner_id=p_user and species_id=54 order by resets desc,level desc limit 1 for update;
    if mon.pokemon_uid is null then raise exception 'psyduck missing'; end if;
    if mon.level<100 then raise exception 'psyduck requires level 100'; end if;
    if mon.resets>=999 then raise exception 'psyduck reset max'; end if;
    n:=mon.resets;
    if n<=200 then cost:=floor(60000+n*18000+n*n*1200)::bigint;
    else cost:=floor((60000+200*18000+200*200*1200)*(1+(n-200)*.018+power((n-200)::numeric,1.22)*.0015))::bigint; end if;
    perform apply_wallet_delta_v24(p_user,'gold',-cost,'psyduck_reset',n::text,'v26-psy-g:'||p_idempotency);
    bal:=apply_wallet_delta_v24(p_user,'psycoin',1,'psyduck_reset',n::text,'v26-psy-pc:'||p_idempotency);
    update player_pokemon set level=1,xp=0,resets=resets+1,data=jsonb_set(coalesce(data,'{}'::jsonb),'{reset_at}',to_jsonb(now_ms),true),updated_at=now() where pokemon_uid=mon.pokemon_uid;
    out_result:=psy_v26_snapshot(p_user)||jsonb_build_object('ok',true,'resets',n+1,'cost',cost,'psycoin',bal,'pokemon_uid',mon.pokemon_uid);

  elsif action_key='psy-skill' then
    kind:=coalesce(p_payload->>'skill','');skills:=coalesce(psy->'skills','{}'::jsonb);
    if kind not in ('power','rate','hp','speed','helper','nova','magnet','crit','regen','pierce','multi') then raise exception 'invalid psy skill'; end if;
    begin lv:=coalesce((skills->>kind)::integer,0); exception when others then lv:=0; end;maxlv:=10;if lv>=maxlv then raise exception 'skill max'; end if;
    weight:=case kind when 'power' then 1.35 when 'rate' then 1.25 when 'hp' then 1.10 when 'speed' then 1.0 when 'helper' then 1.35 when 'nova' then 1.50 when 'magnet' then .9 when 'crit' then 1.2 when 'regen' then 1.25 else 1.4 end;
    cost:=ceil((10000*weight*power((lv+1)::numeric,1.35))/500)*500;
    perform apply_wallet_delta_v24(p_user,'gold',-cost,'psy_skill',kind,'v26-psyskill:'||p_idempotency);
    skills:=jsonb_set(skills,array[kind],to_jsonb(lv+1),true);psy:=jsonb_set(psy,'{skills}',skills,true);
    out_result:=psy_v26_snapshot(p_user)||jsonb_build_object('ok',true,'skill',kind,'level',lv+1,'cost',cost);

  elsif action_key='helper-skill' then
    id:=left(coalesce(p_payload->>'helper',''),32);kind:=coalesce(p_payload->>'skill','');
    if id not in ('pikachu','charizard','slowpoke','gengar','lapras','dragonite','blissey') or kind not in ('damage','rate','special') then raise exception 'invalid helper skill'; end if;
    helpers:=coalesce(psy->'helpers','{}'::jsonb);begin lv:=coalesce((helpers#>>array[id,kind])::integer,0);exception when others then lv:=0;end;if lv>=5 then raise exception 'helper skill max';end if;
    idx:=case id when 'pikachu' then 0 when 'charizard' then 1 when 'slowpoke' then 2 when 'gengar' then 3 when 'lapras' then 4 when 'dragonite' then 5 else 6 end;
    weight:=case kind when 'special' then 1.35 when 'rate' then 1.12 else 1 end;
    cost:=ceil(((12000+idx*1800)*weight*power((lv+1)::numeric,1.32))/500)*500;
    perform apply_wallet_delta_v24(p_user,'gold',-cost,'helper_skill',id||':'||kind,'v26-helper:'||p_idempotency);
    helpers:=jsonb_set(helpers,array[id,kind],to_jsonb(lv+1),true);psy:=jsonb_set(psy,'{helpers}',helpers,true);
    out_result:=psy_v26_snapshot(p_user)||jsonb_build_object('ok',true,'helper',id,'skill',kind,'level',lv+1,'cost',cost);

  elsif action_key='pack-buy' then
    pack_key:=coalesce(p_payload->>'pack','');
    if pack_key='normal' then currency:='gold';price:=90000;
    elsif pack_key='rare' then currency:='gold';price:=260000;
    elsif pack_key='epic' then currency:='gold';price:=650000;
    elsif pack_key='s' then currency:='gold';price:=1250000;
    elsif pack_key='sss' then currency:='diamonds';price:=80;
    elsif pack_key='ur' then currency:='diamonds';price:=150;
    elsif pack_key='urp' then currency:='diamonds';price:=260;
    elsif pack_key='urpp' then currency:='diamonds';price:=450;
    else raise exception 'pack not purchasable'; end if;
    perform apply_wallet_delta_v24(p_user,currency,-price,'pack_buy',pack_key,'v26-packbuy:'||p_idempotency);
    oldn:=coalesce((packs->>pack_key)::bigint,0)+1;packs:=jsonb_set(packs,array[pack_key],to_jsonb(oldn),true);
    out_result:=psy_v26_snapshot(p_user)||jsonb_build_object('ok',true,'pack',pack_key,'quantity',oldn,'currency',currency,'price',price);

  elsif action_key='pack-open' then
    pack_key:=coalesce(p_payload->>'pack','');begin oldn:=coalesce((packs->>pack_key)::bigint,0);exception when others then oldn:=0;end;if oldn<1 then raise exception 'pack unavailable';end if;
    packs:=jsonb_set(packs,array[pack_key],to_jsonb(oldn-1),true);
    out_result:=jsonb_build_object('ok',true,'pack',pack_key,'remaining',oldn-1,'authorized',true);

  elsif action_key='egg-buy' then
    product:=left(coalesce(p_payload->>'product',''),80);currency:='';price:=0;
    if product='Mystery Egg' then currency:='gold';price:=90000;
    elsif product like '% Egg' and split_part(product,' ',1)=any(array['KANTO','JOHTO','HOENN','SINNOH','UNOVA','KALOS','ALOLA','GALAR','PALDEA']) then
      idx:=array_position(array['KANTO','JOHTO','HOENN','SINNOH','UNOVA','KALOS','ALOLA','GALAR','PALDEA'],split_part(product,' ',1));currency:='gold';price:=120000+(idx-1)*18000;
    elsif product like '% Egg' and split_part(product,' ',1)=any(array['Normal','Fire','Water','Grass','Electric','Ice','Fighting','Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy']) then
      idx:=array_position(array['Normal','Fire','Water','Grass','Electric','Ice','Fighting','Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy'],split_part(product,' ',1));currency:='gold';price:=140000+mod(idx-1,5)*25000;
    elsif product='Egg Tier E' then currency:='gold';price:=100000;
    elsif product='Egg Tier D' then currency:='gold';price:=160000;
    elsif product='Egg Tier C' then currency:='gold';price:=220000;
    elsif product='Egg Tier B' then currency:='gold';price:=280000;
    elsif product='Egg Tier A' then currency:='gold';price:=340000;
    elsif product='Egg Tier S' then currency:='diamonds';price:=200;
    elsif product='Egg Tier SS' then currency:='diamonds';price:=400;
    elsif product='Shiny Egg' then currency:='diamonds';price:=600;
    elsif product='Mega Egg' then currency:='diamonds';price:=1000;
    elsif product='Boss Egg' then currency:='diamonds';price:=1500;
    elsif product='Legendary Egg' then currency:='diamonds';price:=1980;
    elsif product='Shiny Mega Egg' then currency:='psycoin';price:=150;
    elsif product='Shiny Legendary Egg' then currency:='psycoin';price:=200;
    else raise exception 'invalid egg product'; end if;
    perform apply_wallet_delta_v24(p_user,currency,-price,'egg_buy',product,'v26-eggbuy:'||p_idempotency);
    oldn:=coalesce((eggs->>product)::bigint,0)+1;eggs:=jsonb_set(eggs,array[product],to_jsonb(oldn),true);
    out_result:=psy_v26_snapshot(p_user)||jsonb_build_object('ok',true,'product',product,'entitlements',oldn,'currency',currency,'price',price);

  elsif action_key='egg-hatch' then
    product:=left(coalesce(p_payload->>'product',''),80);begin oldn:=coalesce((eggs->>product)::bigint,0);exception when others then oldn:=0;end;if oldn<1 then raise exception 'egg entitlement unavailable';end if;
    eggs:=jsonb_set(eggs,array[product],to_jsonb(oldn-1),true);
    out_result:=jsonb_build_object('ok',true,'product',product,'remaining',oldn-1,'authorized',true);

  else raise exception 'unknown v26 action'; end if;

  st:=jsonb_set(st,'{progress}',progress,true);
  st:=jsonb_set(st,'{battle_pass}',bp,true);
  st:=jsonb_set(st,'{achievement_claims}',claims,true);
  st:=jsonb_set(st,'{repeat_claims}',repeats,true);
  st:=jsonb_set(st,'{roulette}',roulette,true);
  st:=jsonb_set(st,'{packs}',packs,true);
  st:=jsonb_set(st,'{eggs}',eggs,true);
  st:=jsonb_set(st,'{psy}',psy,true);
  update player_system_state set state=st,revision=revision+1,updated_at=now() where user_id=p_user;
  out_result:=coalesce(out_result,'{}'::jsonb)||jsonb_build_object('action',action_key,'system',st);
  insert into game_action_receipts(user_id,idempotency_key,action,result) values(p_user,p_idempotency,action_key,out_result);
  return out_result;
end $$;

revoke execute on function public.psy_v26_action(uuid,text,jsonb,text) from public,anon,authenticated;
