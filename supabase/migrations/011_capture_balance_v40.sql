-- PSYWORLD V40 — captura por qualidade, evolução e força
-- Preview usa uma função própria para não alterar a captura V39 em produção antes da aprovação.
-- Regras:
--  * chance base máxima de 20% para Pokémon fraco, 1ª evolução, Lv1-10 e qualidade baixa
--  * qualidade maior, estágio evolutivo maior e Tier/nível maiores reduzem a chance
--  * HP reduzido e Balls melhores aumentam a chance
--  * bônus de captura são somados em pontos percentuais
--  * VIP continua somando +20 pontos percentuais
--  * chance final universal limitada a 30%

create or replace function public.psy_v40_capture_attempt(
  p_user uuid,p_species integer,p_level integer,p_shiny boolean,p_mega boolean,p_boss boolean,
  p_tier text,p_rarity text,p_rarity_mult numeric,p_hp_pct numeric,p_ball text,p_target_types text[],
  p_cap_buff numeric,p_pokemon_data jsonb,p_idempotency text
) returns jsonb
language plpgsql security definer set search_path=public as $$
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

  if p_ball='Pokéball' then mult:=1;
  elsif p_ball='Great Ball' then mult:=1.5;
  elsif p_ball='Super Ball' then mult:=2;
  elsif p_ball='Ultra Ball' then mult:=3;
  elsif p_ball='Premier Ball' then mult:=1.5;
  elsif p_ball in ('Normal Ball','Fire Ball','Water Ball','Grass Ball','Electric Ball','Ice Ball','Fighting Ball','Poison Ball','Ground Ball','Flying Ball','Psychic Ball','Bug Ball','Rock Ball','Ghost Ball','Dragon Ball','Steel Ball','Fairy Ball') then
    ball_type:=lower(split_part(p_ball,' ',1));
    if ball_type=any(target_types) then mult:=6; else mult:=1; end if;
  else raise exception 'invalid ball'; end if;

  insert into player_system_state(user_id,state) values(p_user,'{}'::jsonb) on conflict(user_id) do nothing;
  select state into st from player_system_state where user_id=p_user for update;
  begin vip_until:=coalesce((st->>'vip_until')::bigint,0); exception when others then vip_until:=0; end;

  begin
    evo_stage:=greatest(1,least(3,coalesce((p_pokemon_data->>'evolutionStage')::integer,(p_pokemon_data->>'evolution_stage')::integer,1)));
  exception when others then evo_stage:=1;
  end;

  tier_factor:=case p_tier
    when 'E' then 1.00 when 'D' then .90 when 'C' then .78 when 'B' then .66
    when 'A' then .52 when 'S' then .38 when 'SS' then .27 when 'SSS' then .20
    when 'UR' then .14 when 'UR+' then .10 when 'UR++' then .07 else .30 end;

  evo_factor:=case evo_stage when 1 then 1.00 when 2 then .82 else .68 end;
  level_factor:=greatest(.60,1-greatest(0,p_level-10)*.0045);
  quality_factor:=1/sqrt(greatest(1,p_rarity_mult));
  form_factor:=case
    when p_shiny and p_mega then .20
    when p_mega then .50
    when p_shiny then .35
    else 1.00 end;

  base_chance:=least(20,20*tier_factor*evo_factor*level_factor*quality_factor*form_factor);
  hp_factor:=1+(1-p_hp_pct)*.65;
  pre_bonus:=base_chance*mult*hp_factor;

  -- Buffs são pontos percentuais aditivos: +2 CAP transforma 5% em 7%.
  bonus_points:=greatest(0,least(100,p_cap_buff));
  if vip_until>now_ms then vip_bonus:=20; end if;

  chance:=least(30,pre_bonus+bonus_points+vip_bonus);
  chance:=greatest(.01,chance);

  ball_qty:=adjust_inventory(p_user,p_ball,-1);
  if random()*100<chance then
    insert into player_pokemon(owner_id,species_id,level,xp,shiny,mega_form,tier,rarity,resets,data)
    values(p_user,p_species,p_level,0,p_shiny,case when p_mega then 'mega' else null end,left(p_tier,12),left(coalesce(p_rarity,'Lixo'),64),0,coalesce(p_pokemon_data,'{}'::jsonb)||jsonb_build_object('captured_online',true,'captured_at',now_ms)) returning pokemon_uid into uid;
    progress:=coalesce(st->'progress','{}'::jsonb);
    begin captures:=coalesce((progress->>'captures')::bigint,0)+1; exception when others then captures:=1; end;
    progress:=jsonb_set(progress,'{captures}',to_jsonb(captures),true);
    st:=jsonb_set(st,'{progress}',progress,true);
    update player_system_state set state=st,revision=revision+1,updated_at=now() where user_id=p_user;
    result:=psy_v26_snapshot(p_user)||jsonb_build_object(
      'ok',true,'captured',true,'chance',chance,'pokemon_uid',uid,'ball_remaining',ball_qty,
      'ball_multiplier',mult,'base_chance',base_chance,'pre_bonus_chance',pre_bonus,
      'capture_bonus',bonus_points,'vip_bonus',vip_bonus,'evolution_stage',evo_stage,
      'tier_factor',tier_factor,'quality_factor',quality_factor,'level_factor',level_factor,'hp_factor',hp_factor,
      'capture_version','V40'
    );
  else
    result:=psy_v26_snapshot(p_user)||jsonb_build_object(
      'ok',true,'captured',false,'chance',chance,'ball_remaining',ball_qty,
      'ball_multiplier',mult,'base_chance',base_chance,'pre_bonus_chance',pre_bonus,
      'capture_bonus',bonus_points,'vip_bonus',vip_bonus,'evolution_stage',evo_stage,
      'tier_factor',tier_factor,'quality_factor',quality_factor,'level_factor',level_factor,'hp_factor',hp_factor,
      'capture_version','V40'
    );
  end if;
  insert into game_action_receipts(user_id,idempotency_key,action,result) values(p_user,p_idempotency,'capture-attempt-v40',result);
  return result;
end $$;

revoke execute on function public.psy_v40_capture_attempt(uuid,integer,integer,boolean,boolean,boolean,text,text,numeric,numeric,text,text[],numeric,jsonb,text) from public,anon,authenticated;
