# PSYWORLD Survivor Combat Revolution V3

## Checkpoint

- Base `main`: `f73bb17b6a8d19455557a995763469cb25934e68` (Lot A, published to Murex)
- Lot B release: `8d526de3c2adc860e553c11952100b7b02527c52` (published to Murex; Vercel `READY`)
- Lot C release: `baff1dd9cdf1f9034e383946f4a6456881aea38a` (published to Murex; Vercel `READY`)
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

## Lot C — Psyduck and helper VFX

The 3D pass now draws form-colored orbitals and transformation pulses, expanding Psy Nova rings, a rotating Vórtice, descending Psy Rain strikes at their recorded target coordinates, lightning columns, Lapras ice sectors/crystals, Slowpoke water beams/bubbles, Dragonite tornado meshes, Gengar gravity rings, Charizard meteor columns, and Blissey/Wobbuffet support rings. Existing attack, field, target, damage, and reward state remains authoritative; the renderer reads those records and never performs a hit check. The 2D effect layer remains available on browsers that take the automatic Canvas fallback.

### Verification record

- Started the installed Survivor from the lobby. Local Chromium showed the run, level-up, five upgrade choices, pause/resume, touch input and result flow without JavaScript errors or failed Survivor assets.
- Injected representative Psyduck/helper VFX records into a paused live run and rendered them through Three.js: 15 ground indicators, 3 beams, 24 arcs, 5 shards, 1 ice sector and 4 vertical columns were built. The test enemy's HP was unchanged, confirming the 3D effect pass does not apply damage.
- The new perspective module loaded with the Lot C cache key. Desktop, 844x390 landscape and 390x844 portrait retained the run controls. No game state or rewards were changed by the effect test.
- Chromium in this managed container uses ANGLE SwiftShader. It exceeded the renderer guard, so the normal run returned to the stable Canvas layer. A forced cold WebGL frame measured 3504 ms in this software renderer; this is not a hardware or mobile GPU benchmark. Low-quality instance counts are now capped at 52% (arcs/shards/sectors/columns), medium at 76%, and high at full capacity.
- `node --check` passed for the bridge, renderer and Survivor bundle; `git diff --check` passed.

### Murex production smoke

- `https://psyworld-murex.vercel.app/` returned HTTP 200 and the PSYWORLD page title. The verified production domain is attached to the deployed project.
- The production Survivor module opened from the lobby and entered phase 1 with enemies. The Lot C bridge, renderer, CSS, and bundled Three.js loaded without failed requests or JavaScript errors.
- Production Chromium uses SwiftShader too; the renderer switched to its Canvas fallback while the Survivor run continued. The smoke did not alter the `world-of-monsters` deployment configuration.

## Lot D — bounded build synergy

Added **Arco Psíquico**, a three-level Survivor run upgrade. Each Psyduck projectile may jump to one nearby unhit enemy per level, within 3 SQM; each hop deals 70% of the preceding hit. A projectile can chain at most three times, helper shots do not chain, and a target is tracked in the same per-projectile hit set. The chain has no recursion, extra bullets, ATK/Critical Chance, or changes to per-kill rewards. Unsupported empty MAX offers are rejected, and the Survivor manifests now bust the combat bundle cache for this lot.

### Verification record

- Applied Arco Psíquico three times through the run upgrade API; a fourth application was rejected. The run exposed the upgrade in the existing five-choice system.
- A live simulation projectile hit four test enemies once each. HP changed from 100 to 90, 93, 95.1, and 96.57, which matches the bounded 10 → 7 → 4.9 → 3.43 damage chain. Three lightning records were emitted for the same real hit sequence.
- Gold, run KOs, and Psyduck EXP stayed unchanged because none of the targets died. No JavaScript errors occurred.
- `node --check` and `git diff --check` passed.

### Murex production smoke

- Lot D release `a105ff2cf4297bece0f9af0857c1059b1f57158a` deployed READY to `https://psyworld-murex.vercel.app/`.
- The production Lobby opened a Survivor run and loaded the Lot D bundle key. No failed Survivor assets or JavaScript page errors were observed.

## Lot E — enemy behavior and readable telegraphs

Enemy species now receive bounded archetypes at spawn: flankers approach and circle at range, chargers telegraph a line and target area before a short dash and recovery, ranged enemies retain their existing spacing and shots, and the other species keep their existing pursuit. Boss logic remains in the same simulation; the perspective renderer draws charge warnings on the arena floor. Contact damage, boss hazard damage, enemy stats, spawn schedules, rewards, and economy were not changed.

### Verification record

- Browser AI checks confirmed all four classifications: flanker, charger, ranged, and boss. The flanker moved both radially and laterally; the charger produced one live `enemyCharge` telegraph, entered its dash phase, and moved in the warned direction. No extra damage was introduced by the telegraph.
- Advanced the live Survivor clock to its first scheduled 90-second Boss event. The actual event spawned a boss, emitted the `boss` camera cue, and queued four ground meteors with the existing warning delay and source boss.
- Re-ran the lobby and Survivor flow: phase 1 and 39 live enemies, one real projectile hit exactly once, five level-up choices, pause plus saved run, resume, joystick movement, landscape/portrait layouts, and result/reward panel. No JS page errors or failed Survivor requests.
- Chromium in this environment uses SwiftShader and selected the Canvas fallback; the tests establish simulation/control continuity but do not represent hardware GPU or mobile FPS.
- `node --check` for the modified bundle and renderer, and `git diff --check`, passed.

### Murex production smoke

- Lot E commit `f9db1be847ceff37aaf53066371b8adc966724c0` deployed READY to `https://psyworld-murex.vercel.app/`.
- Production opened the Survivor Lobby and phase 1 arena (39 active enemies), loaded the E bundle key, and returned no failed Survivor requests or JavaScript page errors.

## Lot F — event sync and performance cleanup

Psyduck form changes now fire one synchronized camera cue and the existing `status` sound. Boss entry, phase changes, defeat, and final defeat likewise use the existing `battle_start`, `status`, and `victory` sounds at the same combat event as their camera cue. The audio service and its music/SFX settings remain unchanged. The stable Canvas fallback now receives a bounded shake pulse when 3D is unavailable. Per-frame shadow objects, enemy-target records, grid buckets, live-enemy lists, and expired-item compaction are reused to reduce allocation churn without changing combat calculations.

### Verification record

- Transformation emitted `status` with a `transform` camera cue. The real scheduled Boss event emitted `battle_start`; a real HP-threshold crossing emitted `status` with `bossPhase`; killing a final-Boss fixture with a live projectile emitted `victory` with `bossDefeat`. On Canvas fallback, the event also produced a decaying shake. Existing SFX controls were checked: muted SFX produced zero plays, enabled SFX produced one, and saved audio settings were restored.
- Killed a final-Boss fixture through the live projectile update, received the existing five-choice Boss reward, selected a choice, and reached the real result/reward panel with one boss kill. This isolated the final-completion path; it was not a simulated ten-minute run.
- After the array and target reuse changes, re-ran the AI/telegraph check and the full Lobby → phase 1 → projectile hit → five-choice level-up → saved pause/resume → joystick → landscape/portrait → result flow. No JavaScript errors or failed Survivor requests. A standard run save was present during pause.
- In a 40-enemy SwiftShader run, the low-quality 2D fallback measured 22.6 FPS median (44.3 ms), 85.8 ms at p95; an idle sample measured 29.2 FPS median. WebGL had already tripped its software-renderer guard. This container cannot establish a 30/60 FPS GPU or mobile result; the software numbers are recorded as a limitation, not extrapolated to device GPUs.
- `node --check` passed for the Survivor bundle, bridge, renderer, and manifests; `git diff --check` passed.

Preserve combat values, economy, progression, drop rules, and all non-Survivor systems unless a change is explicitly part of a bounded Survivor upgrade and validated in the run flow.
