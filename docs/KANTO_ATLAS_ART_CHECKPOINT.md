# Kanto Atlas and area art — 2026-10-31

## Current work
- Added an illustrated Kanto campaign atlas in `core/kanto-journey-v1.js` and `css/kanto-journey-v1.css`.
- The atlas models the Gen I journey from Pallet Town through Kanto's routes, cities, caves, landmarks, gyms, and Indigo Plateau.
- Each location has a story NPC, a quest hook, associated Pokémon, progression gate, mysteries, and multiple hunting habitats. Most locations now expose three distinct habitats; curated locations have a fourth optional secret habitat, and Route 1 has five.
- Route 1's two starting grass patches match two atlas hunts. Three more physical grass pockets open with Cut, Rock Smash, and Surf; each is collision-gated and feeds its own species pool when that habitat is selected. Encountering three unique listed species there opens Viridian City in the atlas.
- Field skills are taught by regional NPCs after the corresponding story gate. Dig, Flash, Fly, Strength, and other skills also unlock mystery/reward interactions in the atlas; authored riddles cover the lab, Route 1 lanterns, Viridian Forest, fossils, the Pokémon Tower, and the Rocket Hideout.
- The Halloween city banner/dialogue now call the starting town Pallet Town and Professor Oak explains the initial Route 1 discovery task.

## Generated WebP art
- `assets/story/kanto-region-v1.webp`: regional overview from Pallet through the first northern Kanto locations.
- `assets/story/kanto-pallet-town-v1.webp`: top-down Pallet Town with the research lab, plaza, homes, harbor, and Halloween lighting.
- `assets/story/kanto-route-1-v1.webp`: top-down Route 1 with a connected trail, two separate tall-grass clearings, stream, sign, and Halloween lanterns.

## Integration
- The regional art is the Atlas map backdrop.
- Pallet Town and Route 1 art appear in their respective Atlas detail panels.
- Route 1's five hunting subareas are selectable from the detail panel and show their species sprites. Selecting one of the physical Rota 1 areas changes its encounter pool while the player stands in that area's grass.

## Current scope
- These WebPs are illustrated map/location art for the Atlas; they are not collision-ready tilemaps. The existing playable tile grid remains authoritative for collision and movement. The three secret Route 1 habitats are added to that grid with blocking gates and walkable grass after unlock; other Kanto chapters are represented in the campaign atlas and await their own playable overworld integration.
- Further location art should be created per route/city and then linked from the same location records as new assets are produced.
