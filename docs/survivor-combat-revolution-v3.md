# PSYWORLD Survivor Combat Revolution V3

## Checkpoint

- Base `main`: `56a49c2ff7f536f0f40ba4a8b98db38358a1c48d`
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
- Chromium in this environment uses ANGLE SwiftShader (software WebGL). Warm low-quality runs reached approximately 39–50 FPS with a 40-enemy run; the existing 2D renderer measured approximately 60 FPS. GPU initialization produced a one-time slow first render in the software environment, so these figures are a cloud-browser reference, not a mobile-device benchmark.

## Remaining lots

- B: attack impacts and combat response.
- C: Psyduck and helper VFX.
- D: gameplay-changing, bounded run upgrades.
- E: enemy behavior and boss events.
- F: audio, camera, visual balance, and performance pass.

Preserve combat values, economy, progression, drop rules, and all non-Survivor systems unless a change is explicitly part of a bounded Survivor upgrade and validated in the run flow.
