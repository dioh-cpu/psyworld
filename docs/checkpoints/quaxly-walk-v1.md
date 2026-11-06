# Quaxly walking review — 2026-11-06

Base: `e6e7e0ed9d7675db9e8aaf443d1b0d1e0e04ef63`, HEAD verified on
`teste/iniciais-oficios-v38` before editing. The two requested V48/V49 checkpoints
were read on that branch; their functional V49 commit
`3e3bc11e5a9281553168e933f6f6a3b22d1853c1` is an ancestor of this base.
Local review branch: `animation/quaxly-walk-v1`. No push, merge or deployment.

## Behavior and artwork

Only species 912 (normal and Shiny) uses the new animation clock: 140 ms per pose,
independent of trail distance and render count. Direction follows the existing
follower trail, preserving the phase across turns. Releasing movement resets to
the existing resting pose; scene changes, teleports and pauses over 250 ms reset
the clock. No follower position, collision rule or path sampling was changed.

City movement briefly reports `moving=false` at tile boundaries. Its renderer now
passes an optional `continuing` input hint. Only Quaxly reads it. A maximum 200 ms
grace since actual follower movement bridges tile intervals (campaign tiles use
160 ms). Releasing input stops immediately once the current tile finishes; held
input against a wall cannot renew the grace. Sub-pixel trail sampling does not
restart the animation while the trainer advances.

All six original frames were inspected at enlarged scale, and their playback was
captured in Chromium. Each direction pair genuinely alternates feet, rather than
being duplicated artwork; all frames have alpha bounds ending at exclusive y=63.
The three authored pairs plus mirrored right-facing art support the original
compact, two-pose pixel-art gait. No additional artwork was necessary for this
iteration. This is a two-pose gait, not a newly drawn multi-pose animation.
Original normal/Shiny atlas files and the manifest are unchanged.

Quaxly retains scale 1.6 (visible height 28.8 world pixels against the trainer's
46-pixel body). Its sole edge anchors at y+5 and its constant shadow radii are
8×3, below its body and smaller than the trainer's 13×5 shadow. No procedural
bobbing, stretching or positional easing is added. Other species retain their
original distance-selected frames, scale, anchors and shadows.

## Changed files

- `core/follower-v47.js`: Quaxly-only clock, floor anchor and shadow.
- `core/city-halloween.js`: held-input hint at tile boundaries; no movement changes.
- `tests/quaxly-walk.test.cjs`: full-controller tests with controlled clock and canvas.
- `tests/quaxly-walk-demo.html`: real controller/sprites, normal and Shiny, actual trainer atlas.
- `scripts/qa/record-quaxly-walk.cjs`: deterministic Chromium capture, MP4/GIF and source hashes.
- `scripts/qa/check-quaxly-maps.cjs`: disposable map fixture, actual keyboard movement and collision observations.
- This checkpoint.

## Validation

- All 21 `tests/*test.cjs` suites passed, including the new Quaxly suite.
- Quaxly suite: normal/Shiny × 30/60/120 FPS × 30/143/240 px/s; four directions,
  turns preserving phase, duplicate paints, idle/restart, tile intervals, wall
  expiry, scene/teleport/suspension reset, and unchanged Pikachu rendering.
- Chromium demonstration: 12.27 seconds, four directions, consecutive turns,
  stops/restarts and two travel speeds; both palettes drew all six frames, zero
  page errors. The fixture calls production `PsyFollower.draw`, not a copied
  implementation. Recording output includes hashes of controller, fixture and
  both atlas pages. Scenario movement is scripted; this recording is labeled as
  an inspection scene, not a production map.
- Actual game fixture: Pallet, laboratory, Route 1, city and Viridian chapter.
  Real keyboard input moved the trainer. Captured follower positions all passed
  the existing per-map validity callback. Pallet/lab/city/Viridian each exercised
  all six frames. Route 1 exercised vertical frames 0–3 in its spawn corridor;
  four directions are covered by the demonstration and other map runs.
- Three additional existing checks passed: `kanto-v4-paths.cjs`,
  `kanto-interiors-v9.cjs`, `kanto-v10-rooms.cjs`.
- Two additional old checks fail identically on the untouched base and this
  change: `trainer-walk-v7.cjs` expects trainer columns `1,2,3,0`, while existing
  production code uses `1,0,3,0`; `kanto-v6-sprites-movement.cjs` imports that test
  and fails at the same assertion. Trainer behavior/tests were not changed.
- Syntax and whitespace checks passed. Patch applicability and test rerun on a
  clean copy of the exact base are part of the delivery verification.

Visual limits: inspection used desktop headless Chromium and captured frames;
mobile/touch, physical devices and a human real-time play session were not
validated. Map tests use a disposable browser profile with external requests
blocked, no real account or backend writes. The Viridian gate is unlocked only
inside that disposable fixture. No quests in the shipped implementation change.

## Reproduce and integrate

Requirements: Node 20+, Python, Playwright resolvable by Node, Chromium and ffmpeg.
Browser scripts default to `/usr/bin/chromium`; set `CHROMIUM_PATH` if needed.
From the repository root, start `python -m http.server 8765 --bind 127.0.0.1`.
In another terminal:

```sh
node tests/quaxly-walk.test.cjs
node scripts/qa/record-quaxly-walk.cjs http://127.0.0.1:8765 /tmp/quaxly-review
node scripts/qa/check-quaxly-maps.cjs http://127.0.0.1:8765 /tmp/quaxly-review
```

The recorder produces `quaxly-walk.mp4`, `quaxly-walk.gif`, captured PNG frames
and `browser-demo-results.json`. The map check writes screenshots and
`map-results.json`. These review artifacts are delivered separately from the
source patch; they are not required to run the implementation.

The patch contains all seven changed/new repository files, with paths relative
to the root. For the Work handoff, check out the exact base SHA above into a new
review branch, run `git apply --check /path/to/quaxly-walk.patch`, then
`git apply /path/to/quaxly-walk.patch`. Run the tests and demo before integration.

Vercel was previously confirmed linked to this repository, but effective
per-branch deployment triggers were not exposed by the inspected project API.
Treat any future push as potentially creating a preview. Do not push, merge,
change deployment settings or deploy without the user's authorization.
Water Gun and all other gameplay systems remain outside this change.
