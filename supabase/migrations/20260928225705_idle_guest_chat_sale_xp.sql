-- Psy Idle balance update: guest chat, item-sale allowlist, and faster early XP.
-- PSYWORLD and the authenticated Psy Idle market remain unchanged.

-- Guest chat history is public; messages are still written only by the server RPC below.
alter table public.psy_idle_chat_messages alter column user_id drop not null;
grant select on public.psy_idle_chat_messages to anon;
drop policy if exists psy_idle_chat_read_anon on public.psy_idle_chat_messages;
create policy psy_idle_chat_read_anon
  on public.psy_idle_chat_messages for select to anon using (true);

create table if not exists public.psy_idle_chat_guest_rate_limit (
  bucket_hash text primary key check (bucket_hash ~ '^[0-9a-f]{64}$'),
  last_sent_at timestamptz not null
);
create index if not exists psy_idle_chat_guest_rate_limit_expiry_idx
  on public.psy_idle_chat_guest_rate_limit(last_sent_at);
alter table public.psy_idle_chat_guest_rate_limit enable row level security;
revoke all on public.psy_idle_chat_guest_rate_limit from public,anon,authenticated;
grant all on public.psy_idle_chat_guest_rate_limit to service_role;

create or replace function public.psy_idle_send_guest_chat(
  p_channel text,p_body text,p_username text,p_guest_hash text,p_ip_hash text
)
returns public.psy_idle_chat_messages
language plpgsql
security definer
set search_path=''
as $$
declare
  clean_channel text := lower(trim(coalesce(p_channel,'')));
  clean_body text := trim(regexp_replace(coalesce(p_body,''),'[[:cntrl:]]',' ','g'));
  display_name text;
  locked_hash text;
  result public.psy_idle_chat_messages;
begin
  if clean_channel not in ('global','doubts','trade') then raise exception 'invalid_chat_channel'; end if;
  if char_length(clean_body)<1 or char_length(clean_body)>240 then raise exception 'invalid_chat_message'; end if;
  if coalesce(p_guest_hash,'') !~ '^[0-9a-f]{64}$' or coalesce(p_ip_hash,'') !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_chat_sender';
  end if;

  delete from public.psy_idle_chat_guest_rate_limit
    where last_sent_at<clock_timestamp()-interval '24 hours';
  insert into public.psy_idle_chat_guest_rate_limit(bucket_hash,last_sent_at)
    values(p_ip_hash,clock_timestamp())
    on conflict(bucket_hash) do update set last_sent_at=excluded.last_sent_at
      where public.psy_idle_chat_guest_rate_limit.last_sent_at<clock_timestamp()-interval '700 milliseconds'
    returning bucket_hash into locked_hash;
  if locked_hash is null then raise exception 'chat_rate_limited'; end if;

  locked_hash:=null;
  insert into public.psy_idle_chat_guest_rate_limit(bucket_hash,last_sent_at)
    values(p_guest_hash,clock_timestamp())
    on conflict(bucket_hash) do update set last_sent_at=excluded.last_sent_at
      where public.psy_idle_chat_guest_rate_limit.last_sent_at<clock_timestamp()-interval '1200 milliseconds'
    returning bucket_hash into locked_hash;
  if locked_hash is null then raise exception 'chat_rate_limited'; end if;

  display_name:=left(regexp_replace(regexp_replace(trim(coalesce(p_username,'')),'[[:cntrl:]<>]','','g'),'[[:space:]]+',' ','g'),32);
  display_name:=coalesce(nullif(display_name,''),'Treinador');
  insert into public.psy_idle_chat_messages(user_id,username,channel,body)
    values(null,display_name,clean_channel,clean_body)
    returning * into result;
  return result;
end;
$$;
revoke all on function public.psy_idle_send_guest_chat(text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.psy_idle_send_guest_chat(text,text,text,text,text) to service_role;

-- Public broadcast is necessary for the guest client; the client refreshes from RLS-protected history.
create or replace function public.psy_idle_chat_broadcast()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  perform realtime.send(
    jsonb_build_object(
      'id',new.id,
      'channel',new.channel,
      'username',new.username,
      'body',new.body,
      'created_at',new.created_at
    ),
    'INSERT',
    'psyworld-idle-chat:' || new.channel,
    false
  );
  return null;
end;
$$;
revoke all on function public.psy_idle_chat_broadcast() from public,anon,authenticated;

-- Only common hunt materials can be listed. Balls, store supplies, stones, eggs and specials are rejected in the database.
create or replace function public.idle_validate_listing_asset()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  if new.asset_kind='item' then
    if new.category<>'item' or new.name not in (
      'Rubber Ball','Fire Tail','Water Gem','Seed','Screw','Snowball','Band Aid',
      'Bottle Of Poison','Earth Ball','Straw','Enchanted Gem','Bug Gosme',
      'Ghost Essence','Dragon Scale','Dark Gem','Piece Of Steel'
    ) then
      raise exception 'idle_item_not_sellable';
    end if;
  elsif new.asset_kind='pokemon' then
    if new.category<>'pokemon' then raise exception 'invalid_asset_category'; end if;
  elsif new.asset_kind='psycoin' then
    if new.category<>'psycoin' then raise exception 'invalid_asset_category'; end if;
  end if;
  return new;
end;
$$;
revoke all on function public.idle_validate_listing_asset() from public,anon,authenticated;
drop trigger if exists idle_validate_listing_asset_before_write on public.idle_listings;
create trigger idle_validate_listing_asset_before_write
  before insert or update of asset_kind,category,name on public.idle_listings
  for each row execute function public.idle_validate_listing_asset();

create or replace function public.idle_hunt(u uuid,act text,p jsonb,req uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
#variable_conflict use_variable
declare
  account public.idle_accounts; profile public.idle_hunt_profiles;
  m public.idle_hunt_maps; t public.idle_hunt_tickets;
  prior public.idle_hunt_receipts; inserted_profile uuid;
  result jsonb; ticket_id uuid; map_key text; ball text; ball_mult numeric;
  rarity_low integer; rarity_high integer; weight_total numeric; roll numeric;
  rarity_name text; rarity_mult numeric; rarity_index integer;
  capture_chance numeric; tier_penalty numeric; captured_ok boolean;
  gold_reward bigint; xp_reward bigint:=20; drop_name text;
  xp_after bigint; trainer_level integer; next_xp bigint;
  asset public.idle_assets;
begin
  if u is null then raise exception 'auth_required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(u::text||':idle-hunt',0));
  insert into public.idle_accounts(user_id,nickname)
    values(u,left(coalesce(nullif(p->>'nickname',''),'Treinador'),24)) on conflict(user_id) do nothing;
  insert into public.idle_hunt_profiles(user_id) values(u)
    on conflict(user_id) do nothing returning user_id into inserted_profile;
  if inserted_profile is not null
     and not exists(select 1 from public.idle_assets where owner_id=u)
     and not exists(select 1 from public.idle_ledger where user_id=u)
     and not exists(select 1 from public.idle_listings where seller_id=u)
     and not exists(select 1 from public.idle_commerce_receipts where user_id=u)
     and exists(select 1 from public.idle_accounts where user_id=u and gold=0 and psycoin=0 and revision=0) then
    update public.idle_accounts set gold=gold+500,revision=revision+1 where user_id=u;
    insert into public.idle_ledger(user_id,currency,amount,reason) values(u,'gold',500,'idle_starter');
    insert into public.idle_assets(owner_id,kind,category,name,quantity,bound,data) values
      (u,'pokemon','pokemon','Bulbasaur',1,true,'{"id":1,"name":"Bulbasaur","level":1,"tier":"D","rarity":{"n":"Quase Lixo","mult":1.1},"psyIdleOrigin":"idle-server"}'),
      (u,'item','item','Pokéball',3,true,'{"idle_starter":true}');
  end if;
  select * into account from public.idle_accounts where user_id=u for update;
  select * into profile from public.idle_hunt_profiles where user_id=u for update;
  update public.idle_hunt_tickets set status='expired'
    where user_id=u and status in ('started','won') and expires_at<=clock_timestamp();

  if act='state' then
    return jsonb_build_object('account',to_jsonb(account),'hunter',to_jsonb(profile));
  end if;
  if req is null then raise exception 'request_id_required'; end if;
  select * into prior from public.idle_hunt_receipts where user_id=u and request_id=req;
  if found then
    if prior.action<>act or prior.payload<>coalesce(p,'{}'::jsonb) then raise exception 'request_conflict'; end if;
    return prior.result;
  end if;

  if act='start' then
    map_key:=left(trim(coalesce(p->>'map_key','')),64);
    select * into m from public.idle_hunt_maps where public.idle_hunt_maps.map_key=map_key;
    if m.map_key is null then raise exception 'map_unavailable_online'; end if;
    if profile.trainer_level<m.min_trainer_level then raise exception 'map_locked_server'; end if;
    update public.idle_hunt_tickets set status='expired'
      where user_id=u and status='started' and expires_at>clock_timestamp() and public.idle_hunt_tickets.map_key<>m.map_key;
    if (select count(*) from public.idle_hunt_tickets where user_id=u and status='started' and expires_at>clock_timestamp())>=10 then
      raise exception 'too_many_active_encounters';
    end if;
    select quality_index into rarity_low from public.idle_hunt_qualities where name=m.min_quality;
    select quality_index into rarity_high from public.idle_hunt_qualities where name=m.max_quality;
    select coalesce(sum(weight),0) into weight_total from public.idle_hunt_qualities
      where quality_index between rarity_low and rarity_high;
    if weight_total>0 then
      roll:=random()*weight_total;
      select q.name,q.multiplier,q.quality_index into rarity_name,rarity_mult,rarity_index
      from (select name,multiplier,quality_index,sum(weight) over(order by quality_index) as running_weight
        from public.idle_hunt_qualities where quality_index between rarity_low and rarity_high) q
      where q.running_weight>=roll order by q.quality_index limit 1;
    else
      select name,multiplier,quality_index into rarity_name,rarity_mult,rarity_index
      from public.idle_hunt_qualities where quality_index=rarity_low;
    end if;
    ticket_id:=gen_random_uuid();
    insert into public.idle_hunt_tickets(id,user_id,map_key,species_id,species_name,enemy_level,tier,rarity_name,rarity_mult,rarity_index,min_duration_seconds,expires_at)
      values(ticket_id,u,m.map_key,m.species_id,m.species_name,m.enemy_level,m.tier,rarity_name,rarity_mult,rarity_index,
        greatest(3,least(10,m.enemy_level*.06)),clock_timestamp()+interval '20 minutes');
    result:=jsonb_build_object('ok',true,'ticket',jsonb_build_object(
      'id',ticket_id,'map_key',m.map_key,'species_id',m.species_id,'species_name',m.species_name,
      'level',m.enemy_level,'tier',m.tier,'rarity',jsonb_build_object('n',rarity_name,'mult',rarity_mult),
      'min_duration_ms',round(greatest(3,least(10,m.enemy_level*.06))*1000),'expires_at',clock_timestamp()+interval '20 minutes'));
  elsif act='victory' then
    begin ticket_id:=(p->>'ticket_id')::uuid; exception when others then raise exception 'invalid_ticket'; end;
    select * into t from public.idle_hunt_tickets where id=ticket_id and user_id=u for update;
    if t.id is null then raise exception 'ticket_not_found'; end if;
    if t.status='won' then result:=t.victory_result;
    else
      if t.status<>'started' or t.expires_at<=clock_timestamp() then raise exception 'ticket_unavailable'; end if;
      if clock_timestamp()<t.issued_at+make_interval(secs=>t.min_duration_seconds) then raise exception 'battle_too_fast'; end if;
      if profile.last_victory_at is not null and clock_timestamp()<profile.last_victory_at+interval '3 seconds' then raise exception 'reward_cooldown'; end if;
      gold_reward:=greatest(1,floor((t.enemy_level*2+8)*.15));
      xp_after:=profile.trainer_xp+xp_reward;trainer_level:=profile.trainer_level;
      loop
        exit when trainer_level>=10000;
        next_xp:=450+75*(trainer_level-1)+5*(trainer_level-1)*(trainer_level-1);
        exit when xp_after<next_xp;
        xp_after:=xp_after-next_xp;trainer_level:=trainer_level+1;
      end loop;
      update public.idle_accounts set gold=gold+gold_reward,revision=revision+1 where user_id=u returning * into account;
      insert into public.idle_ledger(user_id,currency,amount,reason) values(u,'gold',gold_reward,'idle_hunt');
      drop_name:=null;roll:=random();
      if roll<.025 then drop_name:='Pokéball';elsif roll<.04 then drop_name:='Great Ball';elsif roll<.045 then drop_name:='Poção 50';end if;
      if drop_name is not null then
        insert into public.idle_assets(owner_id,kind,category,name,quantity,bound,data)
          values(u,'item','item',drop_name,1,false,'{"idle_reward":"hunt"}');
      end if;
      update public.idle_hunt_profiles set trainer_level=trainer_level,trainer_xp=xp_after,
        total_kills=total_kills+1,last_victory_at=clock_timestamp(),updated_at=clock_timestamp()
        where user_id=u returning * into profile;
      result:=jsonb_build_object('ok',true,'ticket_id',ticket_id,'gold_awarded',gold_reward,'xp_awarded',xp_reward,
        'drop',drop_name,'account',to_jsonb(account),'hunter',to_jsonb(profile));
      update public.idle_hunt_tickets set status='won',victory_at=clock_timestamp(),victory_result=result where id=ticket_id;
    end if;
  elsif act='capture' then
    begin ticket_id:=(p->>'ticket_id')::uuid; exception when others then raise exception 'invalid_ticket'; end;
    ball:=left(trim(coalesce(p->>'ball','')),40);
    ball_mult:=case ball when 'Pokéball' then 1 when 'Great Ball' then 1.5 when 'Super Ball' then 2 when 'Ultra Ball' then 3 when 'Premier Ball' then 1.5 else null end;
    if ball_mult is null then raise exception 'invalid_ball'; end if;
    select * into t from public.idle_hunt_tickets where id=ticket_id and user_id=u for update;
    if t.id is null or t.status<>'won' or t.expires_at<=clock_timestamp() or t.capture_attempted then raise exception 'capture_unavailable'; end if;
    if t.rarity_index>4 then raise exception 'capture_quality_locked'; end if;
    select * into asset from public.idle_assets where owner_id=u and name=ball and quantity>0 order by bound desc,created_at for update limit 1;
    if asset.id is null then raise exception 'online_ball_unavailable'; end if;
    if asset.quantity=1 then delete from public.idle_assets where id=asset.id;
    else update public.idle_assets set quantity=quantity-1 where id=asset.id; end if;
    tier_penalty:=case t.tier when 'D' then .08 when 'C' then .18 when 'B' then .35 when 'A' then .65 when 'S' then 1 when 'SS' then 1.4 when 'SSS' then 1.8 when 'UR' then 2 when 'UR+' then 2.5 when 'UR++' then 3 else 0 end;
    capture_chance:=least(.42,greatest(.004,.30*ball_mult/sqrt(t.rarity_mult)/(1+tier_penalty)));
    captured_ok:=random()<=capture_chance;
    if captured_ok then
      insert into public.idle_assets(owner_id,kind,category,name,quantity,bound,data)
       values(u,'pokemon','pokemon',t.species_name,1,false,jsonb_build_object(
        'id',t.species_id,'name',t.species_name,'level',t.enemy_level,'exp',0,'tier',t.tier,
        'rarity',jsonb_build_object('n',t.rarity_name,'mult',t.rarity_mult),'shiny',false,
        'psyIdleOrigin','idle-server')) returning * into asset;
      update public.idle_hunt_profiles set total_captures=total_captures+1,updated_at=clock_timestamp()
        where user_id=u returning * into profile;
    end if;
    result:=jsonb_build_object('ok',true,'ticket_id',ticket_id,'captured',captured_ok,'chance',capture_chance,
      'species_id',t.species_id,'species_name',t.species_name,'asset_id',case when captured_ok then asset.id else null end,
      'account',to_jsonb(account),'hunter',to_jsonb(profile));
    update public.idle_hunt_tickets set capture_attempted=true,captured=captured_ok,capture_result=result where id=ticket_id;
  else
    raise exception 'unknown_action';
  end if;
  insert into public.idle_hunt_receipts(user_id,request_id,action,payload,result)
    values(u,req,act,coalesce(p,'{}'::jsonb),coalesce(result,'{}'::jsonb));
  if act in ('victory','capture') then
    perform realtime.send(jsonb_build_object('changed',true),'changed','idle-commerce',true);
  end if;
  return result;
end $$;

revoke all on function public.idle_hunt(uuid,text,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.idle_hunt(uuid,text,jsonb,uuid) to service_role;
