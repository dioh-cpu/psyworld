# Kanto Campaign · Lot 1 checkpoint

Date: 2026-11-08

## Version and isolation

- Work branch: `campaign/kanto-lot-1-route2-forest`
- Commit base: `ae6566ef8439395f234f580c6fb9be567d1573df`
- Remote `main` rechecked before integration: `ae6566ef8439395f234f580c6fb9be567d1573df`
- This checkpoint covers Route 2 and Viridian Forest only. It does not claim that Kanto is complete.

## Delivered in this lot

- Added a hand-authored 32×20 collision/connectivity map definition for Route 2 and Viridian Forest in `core/kanto-early-chapters-v1.js`.
- Added the final forest illustration at `assets/story/viridian-forest-route2-v1.webp`; it is 896×560 and is rendered at the campaign canvas's 8:5 aspect ratio.
- Connected the Route 2 backpack objective and Forest lantern objective to the actual map interactions, return paths, and chapter exits.
- Both route controls use the existing shared primary-mission automation.
- Tap/click on a reachable Hobby spot now paths the player to that spot and invokes the existing Hobby action after arrival.
- Added a fifth separated field spot to Route 2 and Forest, at least five to the route templates, and seven to cave areas (ore, cave flowers near the edges, and treasure-hunt soil). Mt. Moon has dedicated spots on reachable corridor cells.
- Authored encounter-level ranges now drive wild battle setup for the early maps.
- The map canvas keeps its original 8:5 art ratio across desktop, mobile portrait, and landscape.

## Verification

Focused automated tests:

- `node tests/kanto-route2-forest-v1.cjs`
- `node tests/kanto-campaign-menu-v65.cjs`
- `node tests/kanto-gym-hobbies-v70.cjs`
- `node tests/kanto-v6-sprites-movement.cjs`
- `node tests/hobbies-spot-effects-v1.cjs`
- `node tests/kanto-v4-paths.cjs`
- JavaScript syntax checks and `git diff --check`

Chromium checks used the production map renderer and an ephemeral profile. The Route 2 story reward was verified as a one-time +3 Pokéball handoff; Route 2-to-Forest transition was exercised; Forest spots were path-tested; and a mobile landscape touch collected a real flower, adding one inventory item and 16 Gardener XP. The spot correctly entered cooldown afterward, leaving four visible. The page reported no JavaScript errors. Canvas measurements preserved 8:5 without viewport overflow: desktop 1158×724, portrait 390×244, and landscape 342×214. No player save was used.

## Requested follow-up, not part of this commit

The random hunt portal is still pending as a separate feature slice: a portal may appear during a hunt, opens a mixed-resource field for a three-minute timed run, uses short spot respawns, then closes with a brief freeze/fade and returns the player to the entry map. The portal scene should include separated gathering/mining/chopping/fishing/treasure spots and retain the cave rule of wall-side flowers, ores, and excavation soil. Do not present this feature as live until its timer, return transition, collection persistence, and mobile behavior have been tested.

## Next campaign lot

After this lot is integrated, start Lot 2 (Pewter City and Brock's Gym) from the then-current `main`. Recheck the main SHA before branching and preserve concurrent work.
