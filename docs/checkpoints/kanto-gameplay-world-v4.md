# Kanto Gameplay & World Quality V4 — UNPUBLISHED CHECKPOINT

Base verified against remote main: d98f163bfa0d945f595474f4e4d2059ef37411ba.
Branch: fix/kanto-gameplay-world-v4. No push, merge, production deployment or database changes performed for V4.

## Implemented locally
- Pure continuous world-pixel collision module, 143 px/s matching Route1; capped dt, normalized diagonals, 4.5px collision substeps and wall sliding.
- Campaign physical positions now continuous; compatibility cell coordinates are derived for existing rendering/interactions. BFS still uses integer cells and returns center waypoints. Rounded BFS root prevents cycles when beginning navigation from fractional positions.
- Keyboard combination, per-frame movement/render, blur/visibility key reset, WALK based on actual displacement through the existing approved trainer controller. Follower positions use continuous actual coordinates.
- Caio and Nara use existing approved human animation atlases for idle instead of whole-image bob. Trainer controller/assets remain unchanged.
- Backpack quest module with legacy-save migration, eligible wild carrier, guaranteed carrier by fourth eligible encounter, strict victory resolution against active wild token/species, idempotent reward at Caio, no floor-item recovery.
- Updated Caio dialogue and Route2 arrival narrative, quest navigation to grass and return after recovery. These battle/quest integrations REQUIRE end-to-end verification before release.

## Actual verification performed
- node --check core/kanto-campaign-playable-v1.js: PASS.
- node tests/kanto-world-quality-v4.cjs: PASS (30/60/120 FPS, diagonal speed, pause cap, swept collisions/sliding, fractional path root, guaranteed carrier, loss, stale battle rejection, victory, save serialization, legacy completed/recovered states, one reward).
- node tests/kanto-viridian-v1.cjs: PASS.
- node tests/kanto-route2-forest-v1.cjs: PASS after updating obsolete assertions for old render throttling/NPC bob.
- node tests/kanto-campaign-menu-v65.cjs: PASS after cache assertion update.
- node scripts/qa/kanto-world-quality-v4-browser.cjs: PASS in Chromium at 1280x800, 390x844, 844x390. Disposable guest profiles through actual title/character UI, real keyboard movement, real production renderer, real navigation to Caio and new dialogue. No pageerrors. External remote requests blocked in local browser test to isolate app from CDN delays; no real-player/cloud data touched.
- 500ms keyboard samples: desktop 74.0168px / max observed frame displacement 2.9744px; portrait 69.0118px / max 3.2175px; landscape 71.357px / max 2.7313px. Real wall-clock scheduling differs slightly; exact equivalent-time speed checked by pure tests.
- These are movement/initial-dialogue tests, NOT a complete quest playthrough or Pewter test.

## Art evidence
User video examined with ffprobe (57.12 seconds), frame at 10sec extracted and viewed: /tmp/kanto-v4-video.png.
Existing Pewter art inspected: assets/kanto/approved/pewter-approved.webp. It lacks a distinct Museum and its west Route3 exit conflicts with requested geometry.
New original draft produced with image generation, inspected: /workspace/generated_images/exec-7f38220a-ce2a-438f-a5d5-99d790c6ed4c.png.
Compressed draft preserved outside production repo: /workspace/artifacts/kanto-v4/pewter-art-draft.webp.
DO NOT ship this draft yet: Museum apron leads toward clinic roof, needs a clearly connected path to central spine. No new city collision mask or building interiors integrated yet.

## Mandatory remaining work — release gate
1. Correct Museum access in draft Pewter art, align authored city geometry to final art, implement accessible clinic/gym/museum/shop/houses and real south/east transitions. Preserve gym badge gate. Include Pewter in Route1 benchmark camera.
2. Run continuous walking Forest -> Pewter -> interiors -> Forest and gated Route3 without test teleport substitution.
3. Run actual backpack battle playthrough in Chromium: eligible real grass encounter, visual carrier badge, actual combat victory (not injected endBattle), defeat/flee/unrelated battle, return/reward once, save/reload; verify Auto Route remains active through investigation/return. Persistent battle UI carrier badge still missing (current notification is transient).
4. Validate joystick/touch diagonal analog input; current campaign drag still chooses dominant cardinal axis. Restore route from current physical position without wall/corner clipping.
5. Compare Route1/Route2 real movement + camera in identical viewports; verify camera and sprite scale visually, all characters/companions and map transitions.
6. Check campaign position persistence and map resume; existing campaign layer primarily persists quest state, so continuous position restoration requires explicit review.
7. Consolidated regression tests, visual inspection, current origin/main check, safe integration, authorized push, Vercel READY and production smoke. NO publication until all gates pass.

Reproduction: existing checkout /workspace/psyworld-hunt-rift; no new clone needed. Playwright already installed; Chromium /usr/bin/chromium. Static preview python3 -m http.server 4173 --bind 127.0.0.1. Local /api/config and optional fresh-start script 404s are pre-existing static-server limitations.

## Finalization progress (supersedes the old pending list above)
Pewter final art, six accessible buildings, museum/gym illustrated interiors, animated Brock full-body sprite, authored player-radius collisions, south Forest and east Route3 links implemented. Real Chromium journey traversed Viridian -> Route2 -> Forest -> Pewter -> Center/Gym/Museum and back in all three viewports. Six real Brock battles granted badge and campaign victory ledger; exit to Route3 and return at Pewter east gate passed. All without teleport substitution after initial disposable profile setup.
Camera compared through actual production canvas matrices and frame-by-frame positions: Route1 and Route2 had identical zoom, sprite48x64 render bounds, stage dimensions, and median movement speed143.715px/s (same existing buffs). Real touch diagonals and release-stop passed all three viewports. Normal and Shiny Quaxly actually rendered; trainer/follower controllers and original sprite assets unchanged against base. Loot overlay now clears controls.
Real combat tests: ordinary victory/flee/loss do not award backpack; marked wild KO awards recovery; serialized recovery and physical position survive reload; delivery awards exactly3 existing Pokéball, repeats do not duplicate; old completed saves remain completed. Final automatic investigation continuation is under a focused last test.
Regression suites: world-quality-v4, pewter-v4, route2-forest, campaign-menu, viridian, gym-hobbies, interiors-v30, trainer-walk-v7, session-follower pass. Older human-animation-v2 test has an inherited obsolete protected-follower hash: base main already hashes36abfb02086db6f8c45188d94161369bd2a8cabf965541eac881f914fbe66677 while its old fixture expects7e7cdf2f85d3b39eba5eb515358dd9fdb4d58d093dc02c83bd77d24f5264f1cf. Do not restore obsolete follower code. No SQL or production-player changes.
Evidence and JSON results preserved at /workspace/artifacts/kanto-v4. QA entry points scripts/qa/kanto-v4-{journey-browser,backpack-browser,camera-mobile,gym-browser,visual-smoke}.cjs. No MP4s added.
Final focused automatic investigation/search/real marked KO/reload/automatic return/delivery and reward-once test: PASS. Release gates validated; ready for authorized integration.
