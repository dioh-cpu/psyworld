-- Restored from the applied Supabase migration history (20260928145207).
-- Resolve and harden the complete Idle social/trade/room RPC set.
create or replace function public.idle_social(p_action text,p jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
#variable_conflict use_variable
declare
  uid uuid:=auth.uid(); peer uuid; low_id uuid; high_id uuid; req_by uuid;
  tr public.idle_direct_trades; asset public.idle_assets; offer public.idle_direct_trade_offers;
  trade_id uuid; asset_id uuid; amount bigint; msg text; display_name text; result jsonb;
  other_id uuid; friend_status text; accepted boolean;
begin
  if uid is null then raise exception 'auth_required'; end if;
  peer:=nullif(p->>'peer_id','')::uuid;
  if p_action in ('friend_request','friend_accept','friend_remove','block','unblock','dm_send','dm_list','trade_create','trade_accept','trade_state','trade_offer','trade_confirm','trade_cancel') and peer is null and p_action not in ('trade_accept','trade_state','trade_offer','trade_confirm','trade_cancel') then
    raise exception 'peer_required';
  end if;
  if peer=uid then raise exception 'self_action_denied'; end if;

  if p_action='friends' then
    select coalesce(jsonb_agg(jsonb_build_object('user_id',case when f.user_low=uid then f.user_high else f.user_low end,
      'nickname',left(coalesce(nullif(u.raw_user_meta_data->>'trainer_name',''),nullif(u.raw_user_meta_data->>'name',''),'Treinador'),32))), '[]'::jsonb)
      into result from public.idle_friendships f
      join auth.users u on u.id=case when f.user_low=uid then f.user_high else f.user_low end
      where uid in (f.user_low,f.user_high) and f.status='accepted'
        and not exists(select 1 from public.idle_blocks b where (b.owner_id=uid and b.blocked_id=u.id) or (b.owner_id=u.id and b.blocked_id=uid));
    return jsonb_build_object('friends',coalesce(result,'[]'::jsonb));
  elsif p_action='friend_requests' then
    select coalesce(jsonb_agg(jsonb_build_object('user_id',f.requested_by,'nickname',left(coalesce(nullif(u.raw_user_meta_data->>'trainer_name',''),nullif(u.raw_user_meta_data->>'name',''),'Treinador'),32))), '[]'::jsonb)
      into result from public.idle_friendships f join auth.users u on u.id=f.requested_by
      where (f.user_low=uid or f.user_high=uid) and f.status='pending' and f.requested_by<>uid
        and not exists(select 1 from public.idle_blocks b where (b.owner_id=uid and b.blocked_id=u.id) or (b.owner_id=u.id and b.blocked_id=uid));
    return jsonb_build_object('requests',coalesce(result,'[]'::jsonb));
  elsif p_action='inbox' then
    select coalesce(jsonb_agg(jsonb_build_object('user_id',q.peer_id,'nickname',left(coalesce(nullif(u.raw_user_meta_data->>'trainer_name',''),nullif(u.raw_user_meta_data->>'name',''),'Treinador'),32),'body',q.body,'metadata',q.metadata,'created_at',q.created_at) order by q.created_at desc),'[]'::jsonb)
      into result from (
        select distinct on (x.peer_id) x.peer_id,x.body,x.metadata,x.created_at
        from (select case when m.sender_id=uid then m.recipient_id else m.sender_id end peer_id,m.body,m.metadata,m.created_at
          from public.idle_private_messages m where m.sender_id=uid or m.recipient_id=uid) x
        order by x.peer_id,x.created_at desc
      ) q join auth.users u on u.id=q.peer_id
      where not exists(select 1 from public.idle_blocks b where (b.owner_id=uid and b.blocked_id=q.peer_id) or (b.owner_id=q.peer_id and b.blocked_id=uid));
    return jsonb_build_object('threads',coalesce(result,'[]'::jsonb));
  elsif p_action='blocked' then
    select coalesce(jsonb_agg(jsonb_build_object('user_id',b.blocked_id,
      'nickname',left(coalesce(nullif(u.raw_user_meta_data->>'trainer_name',''),nullif(u.raw_user_meta_data->>'name',''),'Treinador'),32))), '[]'::jsonb)
      into result from public.idle_blocks b join auth.users u on u.id=b.blocked_id where b.owner_id=uid;
    return jsonb_build_object('blocked',coalesce(result,'[]'::jsonb));
  elsif p_action in ('friend_request','friend_accept','friend_remove') then
    if not exists(select 1 from auth.users where id=peer) then raise exception 'player_not_found'; end if;
    if exists(select 1 from public.idle_blocks where (owner_id=uid and blocked_id=peer) or (owner_id=peer and blocked_id=uid)) then raise exception 'player_blocked'; end if;
    low_id:=least(uid,peer); high_id:=greatest(uid,peer);
    perform pg_advisory_xact_lock(hashtextextended(low_id::text||':'||high_id::text||':idle-friend',0));
    if p_action='friend_remove' then
      delete from public.idle_friendships where user_low=low_id and user_high=high_id;
      return jsonb_build_object('ok',true,'status','removed');
    end if;
    select status into friend_status from public.idle_friendships where user_low=low_id and user_high=high_id for update;
    if found then
      if friend_status='accepted' then return jsonb_build_object('ok',true,'status','accepted'); end if;
      select requested_by into req_by from public.idle_friendships where user_low=low_id and user_high=high_id;
      if p_action='friend_accept' and req_by<>peer then raise exception 'friend_request_not_found'; end if;
      if p_action='friend_request' and req_by=uid then return jsonb_build_object('ok',true,'status','pending'); end if;
      if p_action='friend_request' and req_by<>uid then
        update public.idle_friendships set status='accepted' where user_low=low_id and user_high=high_id;
        return jsonb_build_object('ok',true,'status','accepted');
      end if;
      update public.idle_friendships set status='accepted' where user_low=low_id and user_high=high_id;
      return jsonb_build_object('ok',true,'status','accepted');
    end if;
    if p_action='friend_accept' then raise exception 'friend_request_not_found'; end if;
    insert into public.idle_friendships(user_low,user_high,requested_by,status) values(low_id,high_id,uid,'pending');
    return jsonb_build_object('ok',true,'status','pending');
  elsif p_action in ('block','unblock') then
    if not exists(select 1 from auth.users where id=peer) then raise exception 'player_not_found'; end if;
    if p_action='block' then
      insert into public.idle_blocks(owner_id,blocked_id) values(uid,peer) on conflict do nothing;
      delete from public.idle_friendships where user_low=least(uid,peer) and user_high=greatest(uid,peer);
      for tr in select * from public.idle_direct_trades t where t.status in ('invited','open') and ((t.player_a=uid and t.player_b=peer) or (t.player_a=peer and t.player_b=uid)) for update loop
        for offer in select * from public.idle_direct_trade_offers o where o.trade_id=tr.id loop
          insert into public.idle_assets(id,owner_id,kind,category,name,quantity,bound,data)
            values(offer.asset_id,offer.owner_id,offer.kind,offer.category,offer.name,offer.quantity,false,offer.data);
        end loop;
        delete from public.idle_direct_trade_offers o where o.trade_id=tr.id;
        update public.idle_direct_trades set status='cancelled',updated_at=clock_timestamp() where id=tr.id;
      end loop;
      return jsonb_build_object('ok',true,'status','blocked');
    end if;
    delete from public.idle_blocks where owner_id=uid and blocked_id=peer;
    return jsonb_build_object('ok',true,'status','unblocked');
  elsif p_action='dm_list' then
    if exists(select 1 from public.idle_blocks where (owner_id=uid and blocked_id=peer) or (owner_id=peer and blocked_id=uid)) then raise exception 'player_blocked'; end if;
    select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at),'[]'::jsonb) into result
      from (select id,sender_id,recipient_id,body,metadata,created_at from public.idle_private_messages
        where (sender_id=uid and recipient_id=peer) or (sender_id=peer and recipient_id=uid)
        order by created_at desc limit 60) x;
    return jsonb_build_object('messages',coalesce(result,'[]'::jsonb));
  elsif p_action='dm_send' then
    msg:=trim(coalesce(p->>'body',''));
    if char_length(msg)<1 or char_length(msg)>500 then raise exception 'invalid_message'; end if;
    if not exists(select 1 from auth.users where id=peer) then raise exception 'player_not_found'; end if;
    if exists(select 1 from public.idle_blocks where (owner_id=uid and blocked_id=peer) or (owner_id=peer and blocked_id=uid)) then raise exception 'player_blocked'; end if;
    perform pg_advisory_xact_lock(hashtextextended(uid::text||':idle-dm-rate',0));
    if (select count(*) from public.idle_private_messages where sender_id=uid and created_at>clock_timestamp()-interval '1 minute')>=30 then raise exception 'dm_rate_limited'; end if;
    insert into public.idle_private_messages(sender_id,recipient_id,body,metadata)
      values(uid,peer,msg,coalesce(p->'metadata','{}'::jsonb)) returning to_jsonb(idle_private_messages.*) into result;
    return jsonb_build_object('ok',true,'message',result);
  elsif p_action='trade_create' then
    if not exists(select 1 from auth.users where id=peer) then raise exception 'player_not_found'; end if;
    if exists(select 1 from public.idle_blocks where (owner_id=uid and blocked_id=peer) or (owner_id=peer and blocked_id=uid)) then raise exception 'player_blocked'; end if;
    insert into public.idle_direct_trades(player_a,player_b) values(uid,peer) returning id into trade_id;
    select left(coalesce(nullif(raw_user_meta_data->>'trainer_name',''),nullif(raw_user_meta_data->>'name',''),'Treinador'),32) into display_name from auth.users where id=uid;
    insert into public.idle_private_messages(sender_id,recipient_id,body,metadata)
      values(uid,peer,coalesce(display_name,'Treinador')||' enviou um pedido de troca.',jsonb_build_object('trade_id',trade_id,'kind','trade_invite'));
    return jsonb_build_object('ok',true,'trade_id',trade_id,'status','invited');
  elsif p_action in ('trade_accept','trade_state','trade_offer','trade_confirm','trade_cancel') then
    trade_id:=nullif(p->>'trade_id','')::uuid;
    if trade_id is null then raise exception 'trade_required'; end if;
    perform pg_advisory_xact_lock(284916,1);
    select * into tr from public.idle_direct_trades where id=trade_id and uid in (player_a,player_b) for update;
    if tr.id is null then raise exception 'trade_not_found'; end if;
    if p_action='trade_accept' then
      if uid<>tr.player_b or tr.status<>'invited' then raise exception 'trade_unavailable'; end if;
      if exists(select 1 from public.idle_blocks where (owner_id=tr.player_a and blocked_id=tr.player_b) or (owner_id=tr.player_b and blocked_id=tr.player_a)) then raise exception 'player_blocked'; end if;
      update public.idle_direct_trades set status='open',updated_at=clock_timestamp() where id=trade_id;
    elsif p_action='trade_offer' then
      if tr.status<>'open' then raise exception 'trade_not_open'; end if;
      asset_id:=nullif(p->>'asset_id','')::uuid; amount:=nullif(p->>'quantity','')::bigint;
      select * into asset from public.idle_assets where id=asset_id and owner_id=uid for update;
      if asset.id is null or asset.bound or amount is null or amount<1 or amount>asset.quantity or (asset.kind='pokemon' and amount<>1) then raise exception 'asset_unavailable_or_bound'; end if;
      select * into offer from public.idle_direct_trade_offers o where o.trade_id=trade_id and o.owner_id=uid for update;
      if found then
        insert into public.idle_assets(id,owner_id,kind,category,name,quantity,bound,data)
          values(offer.asset_id,uid,offer.kind,offer.category,offer.name,offer.quantity,false,offer.data);
        delete from public.idle_direct_trade_offers o where o.trade_id=trade_id and o.owner_id=uid;
      end if;
      select * into asset from public.idle_assets where id=asset_id and owner_id=uid for update;
      if asset.id is null or asset.bound or asset.quantity<amount then raise exception 'asset_unavailable_or_bound'; end if;
      if asset.quantity=amount then delete from public.idle_assets where id=asset.id;
      else update public.idle_assets set quantity=quantity-amount where id=asset.id; end if;
      insert into public.idle_direct_trade_offers(trade_id,owner_id,asset_id,kind,category,name,quantity,data)
        values(trade_id,uid,asset.id,asset.kind,asset.category,asset.name,amount,asset.data);
      update public.idle_direct_trades set confirmed_a=false,confirmed_b=false,updated_at=clock_timestamp() where id=trade_id;
    elsif p_action='trade_confirm' then
      if tr.status<>'open' then raise exception 'trade_not_open'; end if;
      if not exists(select 1 from public.idle_direct_trade_offers o where o.trade_id=trade_id and o.owner_id=uid) then raise exception 'trade_offer_required'; end if;
      if uid=tr.player_a then update public.idle_direct_trades set confirmed_a=true,updated_at=clock_timestamp() where id=trade_id;
      else update public.idle_direct_trades set confirmed_b=true,updated_at=clock_timestamp() where id=trade_id; end if;
      select * into tr from public.idle_direct_trades where id=trade_id for update;
      if tr.confirmed_a and tr.confirmed_b then
        if (select count(*) from public.idle_direct_trade_offers o where o.trade_id=trade_id)<>2 then raise exception 'both_players_must_offer'; end if;
        insert into public.idle_assets(id,owner_id,kind,category,name,quantity,bound,data)
          select o.asset_id,case when o.owner_id=tr.player_a then tr.player_b else tr.player_a end,o.kind,o.category,o.name,o.quantity,false,o.data
            from public.idle_direct_trade_offers o where o.trade_id=trade_id;
        update public.idle_direct_trades set status='completed',updated_at=clock_timestamp() where id=trade_id;
      end if;
    elsif p_action='trade_cancel' then
      if tr.status not in ('invited','open') then raise exception 'trade_unavailable'; end if;
      for offer in select * from public.idle_direct_trade_offers o where o.trade_id=trade_id loop
        insert into public.idle_assets(id,owner_id,kind,category,name,quantity,bound,data)
          values(offer.asset_id,offer.owner_id,offer.kind,offer.category,offer.name,offer.quantity,false,offer.data);
      end loop;
      delete from public.idle_direct_trade_offers o where o.trade_id=trade_id;
      update public.idle_direct_trades set status='cancelled',updated_at=clock_timestamp() where id=trade_id;
    end if;
    select to_jsonb(t)||jsonb_build_object('offers',coalesce((select jsonb_agg(jsonb_build_object('owner_id',o.owner_id,'asset_id',o.asset_id,'kind',o.kind,'category',o.category,'name',o.name,'quantity',o.quantity,'data',o.data,'confirmed',case when o.owner_id=t.player_a then t.confirmed_a else t.confirmed_b end) order by o.owner_id) from public.idle_direct_trade_offers o where o.trade_id=t.id),'[]'::jsonb))
      into result from public.idle_direct_trades t where t.id=trade_id;
    return jsonb_build_object('ok',true,'trade',result);
  else
    raise exception 'unknown_action';
  end if;
end;
$$;

create or replace function public.idle_room_start(p_room uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare r public.idle_battle_rooms; members uuid[]; n integer; units jsonb:='{}'::jsonb; uid uuid; a public.idle_assets; hp integer; lvl integer; dex integer; first_uid uuid;
begin
  select * into r from public.idle_battle_rooms where id=p_room for update;
  if r.id is null or r.status<>'lobby' then return false; end if;
  select array_agg(user_id order by joined_at),count(*) into members,n from public.idle_battle_room_members where room_id=p_room and last_seen_at>clock_timestamp()-interval '45 seconds' and ready;
  if n<2 or (select count(*) from public.idle_battle_room_members where room_id=p_room and last_seen_at>clock_timestamp()-interval '45 seconds')<>n then return false; end if;
  first_uid:=members[1];
  foreach uid in array members loop
    insert into public.idle_accounts(user_id,nickname)
      select u.id,left(coalesce(nullif(u.raw_user_meta_data->>'trainer_name',''),nullif(u.raw_user_meta_data->>'name',''),'Treinador'),24) from auth.users u where u.id=uid
      on conflict(user_id) do nothing;
    if not exists(select 1 from public.idle_assets where owner_id=uid) and not exists(select 1 from public.idle_commerce_receipts where user_id=uid) then
      insert into public.idle_assets(owner_id,kind,category,name,quantity,bound,data) values(uid,'pokemon','pokemon','Bulbasaur',1,true,'{"id":1,"name":"Bulbasaur","level":1,"rarity":{"n":"Comum","mult":1},"tier":"E"}');
    end if;
    select * into a from public.idle_assets where owner_id=uid and kind='pokemon' order by created_at limit 1;
    if a.id is null then raise exception 'idle_pokemon_required'; end if;
    begin lvl:=greatest(1,least(100,coalesce((a.data->>'level')::integer,1))); exception when others then lvl:=1; end;
    begin dex:=greatest(1,least(2000,coalesce((a.data->>'id')::integer,1))); exception when others then dex:=1; end;
    hp:=100+lvl*5;
    units:=units||jsonb_build_object(uid::text,jsonb_build_object('name',a.name,'level',lvl,'dex',dex,'hp',hp,'max_hp',hp,'damage',10+lvl*2+dex%11));
  end loop;
  if r.kind='pvp' then
    update public.idle_battle_rooms set status='active',battle_state=jsonb_build_object('turn_order',to_jsonb(members),'turn_user',first_uid,'units',units,'turn',1,'log',jsonb_build_array(jsonb_build_object('text','A batalha começou.','at',clock_timestamp()))),updated_at=clock_timestamp() where id=p_room;
  else
    update public.idle_battle_rooms set status='active',battle_state=jsonb_build_object('turn_order',to_jsonb(members),'turn_user',first_uid,'units',units,'boss_name',case r.kind when 'raid' then 'Guardião da Raid' else case r.event_key when 'guardian' then 'Guardião do Evento' when 'rush' then 'Horda do Evento' else 'Chefe Semanal' end end,'boss_hp',240,'boss_max_hp',240,'turn',1,'log',jsonb_build_array(jsonb_build_object('text','O grupo iniciou o combate.','at',clock_timestamp()))),updated_at=clock_timestamp() where id=p_room;
  end if;
  return true;
end;
$$;

create or replace function public.idle_can_use_battle_room_topic(p_topic text)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from public.idle_battle_room_members m
    where m.room_id::text=substr(coalesce(p_topic,''),length('idle-battle-room:')+1)
      and coalesce(p_topic,'') like 'idle-battle-room:%'
      and m.user_id=(select auth.uid())
      and m.last_seen_at>clock_timestamp()-interval '45 seconds'
  );
$$;

create or replace function public.idle_battle(p_action text,p jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  uid uuid:=auth.uid(); rid uuid; room public.idle_battle_rooms; peer uuid; name text; pass text; cap integer; invite_id uuid; inv public.idle_battle_room_invites; member_count integer; result jsonb; topic text;
  m public.idle_battle_room_members; member_ids uuid[]; unit jsonb; units jsonb; turn_user uuid; next_user uuid; idx integer; n integer; j integer; damage integer; hp integer; boss_hp integer; log_rows jsonb; victory text; chan text; share_body text; chat_row public.psy_idle_chat_messages;
begin
  if uid is null then raise exception 'auth_required'; end if;
  if p_action='join_by_invite' then
    invite_id:=nullif(p->>'invite_id','')::uuid;
    select i.room_id into rid from public.idle_battle_room_invites i
      where i.id=invite_id and i.expires_at>clock_timestamp() and i.accepted_at is null
        and (i.invitee_id is null or i.invitee_id=uid);
    if rid is null then raise exception 'room_invite_unavailable'; end if;
    p:=p||jsonb_build_object('room_id',rid,'invite_id',invite_id);
    p_action:='join';
  end if;
  rid:=nullif(p->>'room_id','')::uuid;
  if p_action='list' then
    select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'kind',r.kind,'event_key',r.event_key,'name',r.name,'capacity',r.capacity,'players',c.n,'private',r.password_hash is not null,'host_nickname',coalesce((select nickname from public.idle_battle_room_members where room_id=r.id and is_host),'Treinador'),'created_at',r.created_at) order by r.created_at desc),'[]'::jsonb)
      into result from public.idle_battle_rooms r
      cross join lateral (select count(*)::integer n from public.idle_battle_room_members mm where mm.room_id=r.id and mm.last_seen_at>clock_timestamp()-interval '45 seconds') c
      where r.status='lobby' and c.n<r.capacity and not exists(select 1 from public.idle_blocks b join public.idle_battle_room_members mm on mm.room_id=r.id where (b.owner_id=uid and b.blocked_id=mm.user_id) or (b.owner_id=mm.user_id and b.blocked_id=uid));
    return jsonb_build_object('rooms',coalesce(result,'[]'::jsonb));
  elsif p_action='create' then
    perform pg_advisory_xact_lock(284916,2);
    if exists(select 1 from public.idle_battle_room_members where user_id=uid and last_seen_at>clock_timestamp()-interval '45 seconds') then raise exception 'already_in_room'; end if;
    delete from public.idle_battle_room_members where last_seen_at<=clock_timestamp()-interval '45 seconds';
    name:=trim(coalesce(p->>'name','')); pass:=coalesce(p->>'password','');
    if char_length(name)<2 or char_length(name)>32 then raise exception 'invalid_room_name'; end if;
    if char_length(pass)>32 then raise exception 'invalid_room_password'; end if;
    if coalesce(p->>'kind','') not in ('pvp','raid','event') then raise exception 'invalid_room_kind'; end if;
    if p->>'kind'='event' and coalesce(p->>'event_key','') not in ('guardian','rush','weekly') then raise exception 'invalid_event'; end if;
    if p->>'kind'<>'event' and nullif(p->>'event_key','') is not null then raise exception 'invalid_event'; end if;
    if p->>'kind'='pvp' then cap:=2; else begin cap:=greatest(2,least(4,coalesce((p->>'capacity')::integer,4))); exception when others then cap:=4; end; end if;
    insert into public.idle_battle_rooms(kind,event_key,name,host_id,capacity,password_hash)
      values(p->>'kind',nullif(p->>'event_key',''),name,uid,cap,case when pass='' then null else extensions.crypt(pass,extensions.gen_salt('bf')) end)
      returning id into rid;
    select left(coalesce(nullif(raw_user_meta_data->>'trainer_name',''),nullif(raw_user_meta_data->>'name',''),'Treinador'),32) into name from auth.users where id=uid;
    insert into public.idle_battle_room_members(room_id,user_id,nickname,is_host) values(rid,uid,coalesce(name,'Treinador'),true);
    perform realtime.send(jsonb_build_object('room_id',rid),'created','idle-battle-lobby',true);
    return public.idle_room_snapshot(rid);
  elsif p_action='join' then
    if rid is null then raise exception 'room_required'; end if;
    perform pg_advisory_xact_lock(284916,2);
    delete from public.idle_battle_room_members where last_seen_at<=clock_timestamp()-interval '45 seconds';
    if exists(select 1 from public.idle_battle_room_members where user_id=uid) then raise exception 'already_in_room'; end if;
    select * into room from public.idle_battle_rooms where id=rid for update;
    if room.id is null or room.status<>'lobby' then raise exception 'room_unavailable'; end if;
    invite_id:=nullif(p->>'invite_id','')::uuid;
    if invite_id is not null then
      select * into inv from public.idle_battle_room_invites where id=invite_id and room_id=rid and expires_at>clock_timestamp() and accepted_at is null and (invitee_id is null or invitee_id=uid) for update;
      if inv.id is null then raise exception 'room_invite_unavailable'; end if;
    elsif room.password_hash is not null and extensions.crypt(coalesce(p->>'password',''),room.password_hash)<>room.password_hash then
      raise exception 'room_password_invalid';
    end if;
    if exists(select 1 from public.idle_blocks b join public.idle_battle_room_members mm on mm.user_id=b.owner_id where mm.room_id=rid and b.blocked_id=uid)
      or exists(select 1 from public.idle_blocks b join public.idle_battle_room_members mm on mm.user_id=b.blocked_id where mm.room_id=rid and b.owner_id=uid) then raise exception 'player_blocked'; end if;
    select count(*) into member_count from public.idle_battle_room_members where room_id=rid;
    if member_count>=room.capacity then raise exception 'room_full'; end if;
    select left(coalesce(nullif(raw_user_meta_data->>'trainer_name',''),nullif(raw_user_meta_data->>'name',''),'Treinador'),32) into name from auth.users where id=uid;
    insert into public.idle_battle_room_members(room_id,user_id,nickname,is_host) values(rid,uid,coalesce(name,'Treinador'),false);
    if invite_id is not null then update public.idle_battle_room_invites set accepted_at=clock_timestamp() where id=invite_id; end if;
    perform realtime.send(jsonb_build_object('room_id',rid),'changed','idle-battle-lobby',true);
    return public.idle_room_snapshot(rid);
  elsif p_action='state' or p_action='heartbeat' then
    if rid is null then raise exception 'room_required'; end if;
    update public.idle_battle_room_members set last_seen_at=clock_timestamp() where room_id=rid and user_id=uid;
    if not found then raise exception 'room_membership_required'; end if;
    return public.idle_room_snapshot(rid);
  elsif p_action='leave' then
    if rid is null then raise exception 'room_required'; end if;
    delete from public.idle_battle_room_members where room_id=rid and user_id=uid returning * into m;
    if m.user_id is null then return jsonb_build_object('ok',true); end if;
    select * into room from public.idle_battle_rooms where id=rid for update;
    if room.status='active' then
      update public.idle_battle_rooms set status='finished',battle_state=jsonb_set(jsonb_set(room.battle_state,'{winner}',case when room.kind='pvp' then to_jsonb((select user_id::text from public.idle_battle_room_members where room_id=rid limit 1)) else to_jsonb('boss'::text) end,true),'{log}',coalesce(room.battle_state->'log','[]'::jsonb)||jsonb_build_array(jsonb_build_object('text','A batalha terminou após a saída de um participante.','at',clock_timestamp())),true),updated_at=clock_timestamp() where id=rid;
    end if;
    select count(*) into member_count from public.idle_battle_room_members where room_id=rid and last_seen_at>clock_timestamp()-interval '45 seconds';
    if member_count=0 then update public.idle_battle_rooms set status='closed',updated_at=clock_timestamp() where id=rid and status='lobby';
    elsif m.is_host then update public.idle_battle_room_members set is_host=true where room_id=rid and user_id=(select user_id from public.idle_battle_room_members where room_id=rid order by joined_at limit 1); update public.idle_battle_rooms set host_id=(select user_id from public.idle_battle_room_members where room_id=rid and is_host),updated_at=clock_timestamp() where id=rid;
    end if;
    return jsonb_build_object('ok',true);
  elsif p_action='ready' then
    if rid is null then raise exception 'room_required'; end if;
    update public.idle_battle_room_members set ready=not ready,last_seen_at=clock_timestamp() where room_id=rid and user_id=uid returning * into m;
    if m.user_id is null then raise exception 'room_membership_required'; end if;
    perform public.idle_room_start(rid);
    perform realtime.send(jsonb_build_object('room_id',rid),'changed','idle-battle-lobby',true);
    return public.idle_room_snapshot(rid);
  elsif p_action in ('invite','share') then
    if rid is null then raise exception 'room_required'; end if;
    if not exists(select 1 from public.idle_battle_room_members where room_id=rid and user_id=uid and last_seen_at>clock_timestamp()-interval '45 seconds') then raise exception 'room_membership_required'; end if;
    select * into room from public.idle_battle_rooms where id=rid and status='lobby';
    if room.id is null then raise exception 'room_unavailable'; end if;
    if p_action='invite' then
      peer:=nullif(p->>'peer_id','')::uuid;
      if peer is null or peer=uid or not exists(select 1 from auth.users where id=peer) then raise exception 'player_not_found'; end if;
      if exists(select 1 from public.idle_blocks where (owner_id=uid and blocked_id=peer) or (owner_id=peer and blocked_id=uid)) then raise exception 'player_blocked'; end if;
      insert into public.idle_battle_room_invites(room_id,inviter_id,invitee_id) values(rid,uid,peer) returning id into invite_id;
      insert into public.idle_private_messages(sender_id,recipient_id,body,metadata)
        values(uid,peer,'Convite para a sala “'||room.name||'”.',jsonb_build_object('kind','room_invite','room_id',rid,'invite_id',invite_id,'room_name',room.name,'room_kind',room.kind));
      return jsonb_build_object('ok',true,'invite_id',invite_id);
    end if;
    chan:=coalesce(p->>'channel','trade');
    if chan not in ('global','trade') then raise exception 'invalid_chat_channel'; end if;
    insert into public.idle_battle_room_invites(room_id,inviter_id,invitee_id) values(rid,uid,null) returning id into invite_id;
    share_body:='Convite '||upper(room.kind)||' “'||room.name||'” · idle-room-invite:'||invite_id::text;
    select * into chat_row from public.psy_idle_send_chat(chan,share_body);
    return jsonb_build_object('ok',true,'invite_id',invite_id,'message_id',chat_row.id);
  elsif p_action='attack' then
    if rid is null then raise exception 'room_required'; end if;
    perform pg_advisory_xact_lock(hashtextextended(rid::text||':idle-battle',0));
    select * into room from public.idle_battle_rooms where id=rid for update;
    if room.id is null or room.status<>'active' then raise exception 'battle_not_active'; end if;
    if not exists(select 1 from public.idle_battle_room_members where room_id=rid and user_id=uid and last_seen_at>clock_timestamp()-interval '45 seconds') then raise exception 'room_membership_required'; end if;
    if room.battle_state->>'turn_user'<>uid::text then raise exception 'not_your_turn'; end if;
    units:=room.battle_state->'units'; unit:=units->uid::text; damage:=greatest(1,least(500,coalesce((unit->>'damage')::integer,12)));
    log_rows:=coalesce(room.battle_state->'log','[]'::jsonb);
    if room.kind='pvp' then
      member_ids:=array(select jsonb_array_elements_text(room.battle_state->'turn_order')::uuid);
      peer:=member_ids[1]; if peer=uid then peer:=member_ids[2]; end if;
      hp:=greatest(0,coalesce((units->peer::text->>'hp')::integer,0)-damage);
      units:=jsonb_set(units,array[peer::text,'hp'],to_jsonb(hp),true);
      log_rows:=log_rows||jsonb_build_array(jsonb_build_object('text',(unit->>'name')||' atingiu '||(units->peer::text->>'name')||' por '||damage||'.','at',clock_timestamp()));
      if hp=0 then
        update public.idle_battle_rooms set status='finished',battle_state=jsonb_set(jsonb_set(jsonb_set(room.battle_state,'{units}',units,true),'{log}',log_rows||jsonb_build_array(jsonb_build_object('text','Vitória de '||coalesce((select nickname from public.idle_battle_room_members where room_id=rid and user_id=uid),'Treinador')||'.','at',clock_timestamp())),true),'{winner}',to_jsonb(uid::text),true),updated_at=clock_timestamp() where id=rid;
      else
        update public.idle_battle_rooms set battle_state=jsonb_set(jsonb_set(jsonb_set(room.battle_state,'{units}',units,true),'{turn_user}',to_jsonb(peer::text),true),'{log}',log_rows,true),updated_at=clock_timestamp() where id=rid;
      end if;
    else
      boss_hp:=greatest(0,coalesce((room.battle_state->>'boss_hp')::integer,600)-damage);
      log_rows:=log_rows||jsonb_build_array(jsonb_build_object('text',(unit->>'name')||' causou '||damage||' de dano ao chefe.','at',clock_timestamp()));
      if boss_hp=0 then
        update public.idle_battle_rooms set status='finished',battle_state=jsonb_set(jsonb_set(jsonb_set(room.battle_state,'{boss_hp}',to_jsonb(0),true),'{log}',log_rows||jsonb_build_array(jsonb_build_object('text','Vitória do grupo!','at',clock_timestamp())),true),'{winner}',to_jsonb('team'::text),true),updated_at=clock_timestamp() where id=rid;
      else
        hp:=greatest(0,coalesce((unit->>'hp')::integer,100)-12);
        units:=jsonb_set(units,array[uid::text,'hp'],to_jsonb(hp),true);
        log_rows:=log_rows||jsonb_build_array(jsonb_build_object('text',(room.battle_state->>'boss_name')||' contra-atacou por 12.','at',clock_timestamp()));
        if not exists(select 1 from jsonb_each(units) x where coalesce((x.value->>'hp')::integer,0)>0) then
          update public.idle_battle_rooms set status='finished',battle_state=jsonb_set(jsonb_set(jsonb_set(jsonb_set(room.battle_state,'{units}',units,true),'{boss_hp}',to_jsonb(boss_hp),true),'{log}',log_rows||jsonb_build_array(jsonb_build_object('text','O grupo foi derrotado.','at',clock_timestamp())),true),'{winner}',to_jsonb('boss'::text),true),updated_at=clock_timestamp() where id=rid;
        else
          member_ids:=array(select jsonb_array_elements_text(room.battle_state->'turn_order')::uuid);n:=coalesce((room.battle_state->>'turn')::integer,1);idx:=array_position(member_ids,uid);if idx is null then idx:=1;end if;
          for j in 1..array_length(member_ids,1) loop
            next_user:=member_ids[((idx+j-1) % array_length(member_ids,1))+1];
            exit when coalesce((units->next_user::text->>'hp')::integer,0)>0;
          end loop;
          update public.idle_battle_rooms set battle_state=jsonb_set(jsonb_set(jsonb_set(jsonb_set(room.battle_state,'{units}',units,true),'{boss_hp}',to_jsonb(boss_hp),true),'{turn_user}',to_jsonb(next_user::text),true),'{turn}',to_jsonb(n+1),true)||jsonb_build_object('log',log_rows),updated_at=clock_timestamp() where id=rid;
        end if;
      end if;
    end if;
    perform realtime.send(jsonb_build_object('room_id',rid),'changed','idle-battle-room:'||rid::text,true);
    return public.idle_room_snapshot(rid);
  else
    raise exception 'unknown_action';
  end if;
end;
$$;

revoke all on function public.idle_social(text,jsonb),public.idle_room_start(uuid),public.idle_can_use_battle_room_topic(text),public.idle_battle(text,jsonb) from public,anon,authenticated;
grant execute on function public.idle_social(text,jsonb),public.idle_battle(text,jsonb) to authenticated;
grant execute on function public.idle_can_use_battle_room_topic(text) to authenticated;

drop policy if exists idle_battle_room_receive on realtime.messages;
create policy idle_battle_room_receive on realtime.messages for select to authenticated
  using (extension in ('presence','broadcast') and (select public.idle_can_use_battle_room_topic((select realtime.topic()))));
drop policy if exists idle_battle_room_track on realtime.messages;
create policy idle_battle_room_track on realtime.messages for insert to authenticated
  with check (extension in ('presence','broadcast') and (select public.idle_can_use_battle_room_topic((select realtime.topic()))));
