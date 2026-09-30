-- Supporting indexes for foreign-key lookups/cascades on active Psy Idle tables.
-- These columns are the leading column of each new index; existing composite
-- indexes with a different leading column do not support these lookups.
create index if not exists idle_bid_history_listing_id_idx
  on public.idle_bid_history(listing_id);

create index if not exists idle_listings_buyer_id_idx
  on public.idle_listings(buyer_id);

create index if not exists psy_idle_chat_messages_user_id_idx
  on public.psy_idle_chat_messages(user_id);
