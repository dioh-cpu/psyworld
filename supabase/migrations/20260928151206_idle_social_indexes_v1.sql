-- Restored from the applied Supabase migration history (20260928151206).
-- Cover Idle-only social/battle foreign keys and the directions used by inboxes.
create index if not exists idle_friendships_user_high_idx on public.idle_friendships(user_high,status);
create index if not exists idle_friendships_requester_idx on public.idle_friendships(requested_by,status);
create index if not exists idle_blocks_blocked_idx on public.idle_blocks(blocked_id);
create index if not exists idle_direct_trades_player_b_idx on public.idle_direct_trades(player_b,status,updated_at desc);
create index if not exists idle_direct_trade_offers_owner_idx on public.idle_direct_trade_offers(owner_id,updated_at desc);
create index if not exists idle_battle_rooms_host_idx on public.idle_battle_rooms(host_id,created_at desc);
create index if not exists idle_battle_room_invites_room_idx on public.idle_battle_room_invites(room_id,expires_at desc);
create index if not exists idle_battle_room_invites_inviter_idx on public.idle_battle_room_invites(inviter_id,created_at desc);
create index if not exists idle_battle_room_invites_invitee_idx on public.idle_battle_room_invites(invitee_id,expires_at desc);
