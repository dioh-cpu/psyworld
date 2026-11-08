-- Campaign battle rewards use server-derived Pokémon types.
create or replace function public.psy_v27_battle_reward(
  p_user uuid,
  p_mode text,
  p_enemy_level integer,
  p_enemy_type text,
  p_gold_buff numeric,
  p_xp_buff numeric,
  p_drop_buff numeric,
  p_idempotency text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  prior jsonb;
  st jsonb;
  progress jsonb;
  typekills jsonb;
  result jsonb;
  loot jsonb := '{}'::jsonb;
  gold_reward bigint;
  xp_reward bigint;
  kills bigint;
  tk bigint;
  vip_until bigint := 0;
  now_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  drop_value numeric;
  qty_steps numeric;
  common_qty integer;
  uncommon_chance numeric;
  stone_chance numeric;
  common_item text;
  uncommon_item text;
  matching_stone text;
  typ text := initcap(lower(coalesce(p_enemy_type, 'Normal')));
begin
  if lower(coalesce(p_mode,'')) not in ('wild','hunt','fast','world') then
    raise exception 'invalid battle mode';
  end if;
  if p_idempotency is null or length(p_idempotency) < 8 or length(p_idempotency) > 180 then
    raise exception 'invalid idempotency key';
  end if;
  if p_enemy_level < 1 or p_enemy_level > 10000 then
    raise exception 'invalid enemy level';
  end if;
  if typ not in ('Normal','Fire','Water','Grass','Electric','Ice','Fighting','Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy') then
    raise exception 'invalid battle type';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user::text || ':battle:' || p_idempotency, 0));
  select receipt.result into prior from game_action_receipts as receipt where receipt.user_id = p_user and receipt.idempotency_key = p_idempotency;
  if prior is not null then return prior; end if;

  insert into player_system_state(user_id, state) values (p_user, '{}'::jsonb) on conflict (user_id) do nothing;
  select state into st from player_system_state where user_id = p_user for update;
  begin vip_until := coalesce((st->>'vip_until')::bigint, 0); exception when others then vip_until := 0; end;

  if lower(p_mode) = 'world' then
    gold_reward := floor(p_enemy_level * 12 * (1 + greatest(0, least(300, p_gold_buff)) / 100) * .5);
    xp_reward := floor(p_enemy_level * 10 * (1 + (greatest(0, least(300, p_xp_buff)) + (case when vip_until > now_ms then 50 else 0 end)) / 100) * .5);
  else
    gold_reward := floor((p_enemy_level * 18 + 80) * (1 + greatest(0, least(300, p_gold_buff)) / 100));
    xp_reward := floor((p_enemy_level * 85 + 150) * (1 + (greatest(0, least(300, p_xp_buff)) + (case when vip_until > now_ms then 50 else 0 end)) / 100));
  end if;

  perform apply_wallet_delta_v24(p_user, 'gold', gold_reward, 'battle', lower(p_mode), 'v27-battle-g:' || p_idempotency);
  progress := coalesce(st->'progress', '{}'::jsonb);
  begin kills := coalesce((progress->>'kills')::bigint, 0) + 1; exception when others then kills := 1; end;
  progress := jsonb_set(progress, '{kills}', to_jsonb(kills), true);
  typekills := coalesce(progress->'type_kills', '{}'::jsonb);
  begin tk := coalesce((typekills->>typ)::bigint, 0) + 1; exception when others then tk := 1; end;
  typekills := jsonb_set(typekills, array[typ], to_jsonb(tk), true);
  progress := jsonb_set(progress, '{type_kills}', typekills, true);

  case typ
    when 'Normal' then common_item := 'Rubber Ball'; uncommon_item := 'Giant Piece Of Fur'; matching_stone := 'Heart Stone';
    when 'Fire' then common_item := 'Essence Of Fire'; uncommon_item := 'Fire Tail'; matching_stone := 'Fire Stone';
    when 'Water' then common_item := 'Water Gem'; uncommon_item := 'Water Pendant'; matching_stone := 'Water Stone';
    when 'Grass' then common_item := 'Seed'; uncommon_item := 'Leaves'; matching_stone := 'Leaf Stone';
    when 'Electric' then common_item := 'Screw'; uncommon_item := 'Electric Rat Tail'; matching_stone := 'Thunder Stone';
    when 'Ice' then common_item := 'Snowball'; uncommon_item := 'Ice Orb'; matching_stone := 'Ice Stone';
    when 'Fighting' then common_item := 'Band Aid'; uncommon_item := 'Belt Of Champion'; matching_stone := 'Punch Stone';
    when 'Poison' then common_item := 'Bottle Of Poison'; uncommon_item := 'Bug Venom'; matching_stone := 'Venom Stone';
    when 'Ground' then common_item := 'Earth Ball'; uncommon_item := 'Sandbag'; matching_stone := 'Earth Stone';
    when 'Flying' then common_item := 'Straw'; uncommon_item := 'Feather'; matching_stone := 'Flying Stone';
    when 'Psychic' then common_item := 'Enchanted Gem'; uncommon_item := 'Psychic Spoon'; matching_stone := 'Enigma Stone';
    when 'Bug' then common_item := 'Bug Gosme'; uncommon_item := 'Bug Antenna'; matching_stone := 'Cocoon Stone';
    when 'Rock' then common_item := 'Small Stone'; uncommon_item := 'Strange Rock'; matching_stone := 'Rock Stone';
    when 'Ghost' then common_item := 'Ghost Essence'; uncommon_item := 'Bat Wing'; matching_stone := 'Darkness Stone';
    when 'Dragon' then common_item := 'Dragon Scale'; uncommon_item := 'Dragon Tooth'; matching_stone := 'Crystal Stone';
    when 'Dark' then common_item := 'Dark Gem'; uncommon_item := 'Dark Ear'; matching_stone := 'Darkness Stone';
    when 'Steel' then common_item := 'Piece Of Steel'; uncommon_item := 'Metal Hull'; matching_stone := 'Metal Stone';
    when 'Fairy' then common_item := 'Rubber Ball'; uncommon_item := 'Cute Ball'; matching_stone := 'Heart Stone';
  end case;

  drop_value := least(300, greatest(0, least(300, coalesce(p_drop_buff, 0)) + (case when vip_until > now_ms then 50 else 0 end)));
  qty_steps := drop_value * 9 / 300;
  common_qty := 1 + floor(qty_steps)::integer;
  if random() < qty_steps - floor(qty_steps) then common_qty := common_qty + 1; end if;
  common_qty := least(10, greatest(1, common_qty));
  uncommon_chance := .30 + .20 * drop_value / 300;
  stone_chance := .01 + .09 * drop_value / 300;

  perform adjust_inventory(p_user, common_item, common_qty);
  loot := loot || jsonb_build_object(common_item, common_qty);
  if random() < uncommon_chance then
    perform adjust_inventory(p_user, uncommon_item, 1);
    loot := loot || jsonb_build_object(uncommon_item, 1);
  end if;
  if random() < stone_chance then
    perform adjust_inventory(p_user, matching_stone, 1);
    loot := loot || jsonb_build_object(matching_stone, 1);
  end if;

  st := jsonb_set(st, '{progress}', progress, true);
  update player_system_state set state = st, revision = revision + 1, updated_at = now() where user_id = p_user;
  result := psy_v26_snapshot(p_user) || jsonb_build_object('ok', true, 'gold_reward', gold_reward, 'xp_reward', xp_reward, 'quest_loot', loot, 'mode', lower(p_mode));
  insert into game_action_receipts(user_id, idempotency_key, action, result) values (p_user, p_idempotency, 'battle-win', result);
  return result;
end $$;

revoke execute on function public.psy_v27_battle_reward(uuid,text,integer,text,numeric,numeric,numeric,text) from public, anon, authenticated;
grant execute on function public.psy_v27_battle_reward(uuid,text,integer,text,numeric,numeric,numeric,text) to service_role;
