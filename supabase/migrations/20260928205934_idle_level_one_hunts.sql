-- Make starter-route species and Togepi available as genuine level-1 hunts.
-- Keep the server gate and encounter level in sync with the game client.
do $$
declare
  updated_rows integer;
begin
  update public.idle_hunt_maps
  set min_trainer_level=1,
      enemy_level=1
  where species_id = any(array[
    1,4,7,10,13,16,19,25,29,32,43,46,69,84,102,175
  ]::integer[]);

  get diagnostics updated_rows = row_count;
  if updated_rows <> 16 then
    raise exception 'Expected 16 starter hunts to update, found %', updated_rows;
  end if;
end
$$;
