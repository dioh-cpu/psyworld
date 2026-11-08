# PSYWORLD Survivor Combat Revolution V3

## Checkpoint

- Base `main`: `f73bb17b6a8d19455557a995763469cb25934e68` (Lot A, published to Murex)
- Working branch: `feature/survivor-combat-revolution-v3`
- Keep each finished lot in its own commit. The production target is the verified `psyworld-murex.vercel.app` domain.
- Do not publish through the `world-of-monsters` URL.

## Lot A — camera and arena

The existing world simulation, collisions, movement, sprites, attack events, and rewards remain authoritative. Three.js renders a locally hosted, actual 3D terrain scene with a perspective camera, a following camera rig, biome palettes, mesh props, projected shadows, and a device-adaptive quality preset. Existing sprites and combat effects are projected from the same world coordinates on a transparent canvas overlay. WebGL startup failure keeps the original 2D renderer available.

### Verification record

- Chromium, local game entry through the Survivor lobby: phase 1 began with 40 enemies and a valid WebGL2 context.
- Projected player position moved with the arrow keys in desktop coverage and with touch input in both 844x390 landscape and 390x844 portrait coverage. The simulated world position changes along the requested axis.
- Run Level-up paused the run, rendered exactly five choices, accepted a choice, and resumed at the next run level.
- Pause and resume worked; the resume key was present in local storage.
- A boss spawned on schedule. Its real `bossMeteor` hazards reached the floor-warning renderer.
- No browser JavaScript page errors were observed.
- JavaScript syntax checks for the renderer, bridge, and Survivor bundle passed; `git diff --check` passed.
- The original Lot A capture recorded approximately 39–50 FPS at low quality. The current container is configured with ANGLE SwiftShader, so a separate benchmark recorded about 18 FPS while the WebGL pass was active and about 25 FPS on the 2D fallback. These software-renderer numbers are not a mobile GPU benchmark.

## Lot B — impacts and combat response

Three.js renders live Psyduck/helper/enemy projectiles, their trails, field indicators, water beams, and boss warning geometry from the simulation arrays. It does not run collision checks. Real damage events now add a single impact burst, enemy hit flash/recoil, and phase cues; existing combat values and rewards are unchanged. Floor hazards are drawn on the perspective terrain, and their old canvas copies are hidden only while the 3D pass is active.

### Verification record

- Started a phase 1 run through the real Survivor lobby, with 40 initial enemy slots; no failed Survivor or Three.js requests and no JavaScript page errors.
- Injected one test projectile through the live simulation update: target HP changed from 50 to 47 once, the projectile recorded that target once, and the impact flash/burst appeared.
- Triggered Run Level-up through the actual run loop: exactly five choices appeared, a choice applied, pause/resume worked, and the local resume save existed.
- Touch joystick input changed Psyduck position; its held direction cleared on pointer-up. The landscape 844x390 and portrait 390x844 layouts retained the run UI and touch stick.
- Forced the existing final-result condition to verify reward/result rendering; this checks the result flow, not a full 10-minute final-boss run.
- In SwiftShader, low-quality WebGL repeatedly exceeded 42 ms per rendered frame (58.6 ms in one sample, 299 ms average during cold compilation in another). After 24 slow frames the guard hid WebGL and restored the stable Canvas renderer without changing the simulation. The same run continued through hit, level-up, pause, touch steering, and result with no page errors.
- `node --check` passed for the modified JavaScript files; `git diff --check` passed.

## Remaining lots

- B: attack impacts and combat response.
- C: Psyduck and helper VFX.
- D: gameplay-changing, bounded run upgrades.
- E: enemy behavior and boss events.
- F: audio, camera, visual balance, and performance pass.

Preserve combat values, economy, progression, drop rules, and all non-Survivor systems unless a change is explicitly part of a bounded Survivor upgrade and validated in the run flow.
