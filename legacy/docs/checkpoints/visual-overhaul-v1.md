# PSYWORLD visual overhaul — checkpoint 1

## Reproducible base and isolation

- Branch: `visual/psyworld-pixel-art-overhaul-v1`.
- Base commit: `81d114c5a62ec5a4272f2414baf1b4995e7b57cb` (`feat(hobbies): add aligned tool sprites and timed strikes`).
- At validation time, `git ls-remote origin refs/heads/main` returned the same full SHA. The local branch starts from that exact Main commit; the new work is still local.
- No push, merge, deploy, or edit to `main` was performed for this visual-overhaul batch.
- The workspace's `library-files` directory had no files. I reused the art already in the PSYWORLD repository and made new pixel art only where an active/campaign asset was unavailable or broken.

## Completed in this batch

- Replaced the empty active `assets/kanto/interiors/house-west-v30.webp` with a hand-authored, high-detail pixel-art coastal home interior. Its open floor, furnishing footprint, map scale, exits, NPCs, and collision layout continue to use the existing room renderer/data.
- Restored corrupt `assets/story/professor-oak.png` from the approved Professor Oak expression source. Existing trainer sprite sheets were not rescaled or redrawn.
- Restored corrupt `assets/story/kanto-route-1.webp` from the canonical Route 1 artwork already in the repository.
- Created `assets/story/route-2-artist-v1.webp` to match the Route 1 map's 32×20 tile footprint, scale, and visual treatment. Route 2 collision path, arrival spawn, NPC, clue, and exit are reachable on the painted trails.
- Added a separate transparent 56×54 pixel-art backpack prop for the Route 2 clue. Its low-alpha off-white background was flood-trimmed before nearest-neighbor reduction; the final renderer displays it over the existing map without changing collision tiles. The art is hidden after discovery and the clue marker becomes “Mochila recuperada.”
- Added a three-beat first-arrival cinematic for Route 2. It uses the final map art, runs through the existing story controller, and is only marked seen when completed/skipped.
- Turned the Route 2 backpack request into a complete handoff: speak with Caio, locate the backpack, return it to Caio. The quest marker changes target after discovery. The first handoff grants three existing `Pokéball` inventory items; returning again does not grant more.
- Added a shared clock using `America/Sao_Paulo`, with dawn/day/dusk/night states and map lighting. Existing encounter pools may give additional weight to already-registered species by time; this does not add species or change Shiny/economy rules.
- Added cosmetic aura accents for the existing special Halloween costume looks and their preview. Basic outfits remain unchanged; the effect honors `prefers-reduced-motion` and does not touch stats or saves.
- Updated cache tokens and the existing campaign clock layout for desktop and mobile.
- Fixed the Kanto movement test harness to provide its already-required fishing-button callback when it evaluates the extracted production loop; no gameplay behavior changed in that test-only correction.

## Validation and evidence

- `node tests/kanto-story-v49.test.cjs` — passed.
- `node tests/world-time-v1.cjs` — passed: Brasília phase boundaries, ambient drawing, existing-roster weighting, costume-only aura policy.
- `node tests/kanto-campaign-menu-v65.cjs` — passed.
- `node tests/interiors-v30.test.cjs`, `node tests/kanto-interiors-v9.cjs`, `node tests/kanto-v10-rooms.cjs` — passed; six interiors, collision reachability, NPCs, exits.
- `node tests/kanto-v4-paths.cjs`, `node tests/kanto-viridian-v1.cjs` — passed.
- `node tests/kanto-v6-sprites-movement.cjs` — passed after correcting the test harness helper injection; movement remains consistent at 60/30/15/10 FPS.
- `node tests/hobbies-mastery-campaign-v1.cjs`, `node tests/kanto-gym-hobbies-v70.cjs` — passed.
- `git diff --check` — passed.
- A Chromium check ran the production map renderers and trainer controller against a disposable test profile. It verified Route 1 and Route 2 by day/night, the west-house interior by day/night, all 30 existing character-look palettes, the Route 2 three-beat scene and loaded backpack prop, the three-step backpack handoff and one-time reward, NPC/clue/exit reachability, and mobile portrait/landscape header fit. Result: zero browser page errors.
- Asset decoding scan over repository PNG/WebP/JPEG files emitted no invalid-file entries. Existing walking sheets were not edited; this batch modifies a standalone Oak portrait and environment images rather than changing character frame grids.
- The MP4 is real Chromium capture from the story controller and final Route 2 artwork: H.264, 1280×900, approximately 8.9 seconds. See `/workspace/visual-overhaul-v1-artifacts/route-2-arrival-cinematic.mp4`; screenshots and `visual-overhaul-v1-browser-report.json` are alongside it.

## Scope still open

This is the first verified visual/narrative slice, not completion of the project-wide overhaul. The remaining campaign still needs an asset-by-asset pass against Route 1 scale, route/city/gym/interior art integration, PNG frame-grid alignment inspection where animation sheets are changed, additional authored cinematics and dialogue, side quests and puzzles with tested rewards, and a broader economy/level curve audit. Dynamic world events, raid bosses/dungeons, shiny events, online bonus scheduling, and an hourly online lottery have not been implemented. They need separate design and authority/persistence tests so they cannot duplicate rewards or disturb existing modes.

## Resume

1. Start from this branch and read this checkpoint before continuing.
2. Recheck `git ls-remote origin refs/heads/main` and compare concurrent Main changes before proposing integration.
3. Continue location by location, reusing the Route 1 scale/zoom and actual collision data; do not call the whole campaign complete until all routes, cities, gyms, interiors, and remaining campaign beats have been audited in the renderer.
4. Keep the current art/story slice isolated until the owner approves visual integration. No deployment was triggered here.
