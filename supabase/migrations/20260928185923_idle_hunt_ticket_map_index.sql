-- Cover the route foreign key used when cleaning up map records.
create index if not exists idle_hunt_tickets_map_key_idx
  on public.idle_hunt_tickets(map_key);
