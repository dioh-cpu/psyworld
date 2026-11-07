# PSYWORLD Character Animation Studio V2 — development checkpoint (2026-11-07)

Status: scale/IDLE review checkpoint; WALK biomechanical acceptance remains pending; no push, merge or deploy.
Branch: animation/halloween-characters-v2
Worktree: /workspace/psyworld-characters-v2
Authoritative base: 967d7db868c5589530356ea8841190ee18747a06 (main when inspected).
Previous local animation branches remain untouched in /workspace/psyworld.

## Authorization and source review

User authorized local implementation, derived sprite sheets, tests, local commits,
MP4s and portable patch; integration to main requires a separate explicit approval.
User approved the generated Adventure Boy neutral IDLE sample, conditioned on
consistent size/alignment of frames. Do not ask for that art-direction approval again.
Latest steering requires actual frame-scale correction, aligned-frame comparisons
and live-controller validation for all six characters and all outfits.

Both attached ZIPs were inspected (actual JS, fixtures, recorder and hashes), not
just reports. Approved method: monotonic clock independent of displacement/FPS;
source-authored directions; stop/scene/long-frame reset; Playwright controlled
clock, actual production renderer, PNG frames then ffmpeg. Human mechanics differ
from the two-pose Pokémon gait. Do not modify core/follower-v47.js or any Pokémon.

## Inventory and diagnosis

Runtime registry core/halloween-ui.js and assets/characters/halloween/manifest.json:
black_boy Kai, black_girl Maya, gothic_boy Rapaz gótico, gothic_girl Garota gótica,
adventure_boy Aventureiro, adventure_girl Aventureira. 30 source sheets, all 2048²,
4×4 cells 512². Runtime `basic` is the actual original Traje de Jornada (free),
not an additional paid Halloween tier. Four special keys: divine, macabre,
macabre_alt, supreme (24 looks). Six cinematic portraits 1024×1536 are separate
static art, not extra walk sheets. Matrix: 6×5×4×2=240 combinations.

Source row order: basic/divine/macabre S,W,E,N; macabre_alt/supreme S,N,W,E.
All actual back views exist. Old renderer treated every sheet as S,W,E,N.
Source image size varies substantially between poses; Adventure Boy basic alpha
height spans 198–262 pixels. Legacy getAtlas stretches every crop to 33×46.
New active renderer uniformly fits original pixels, anchors by head mass rather
than changing cape bounds, fixes ground at canonical y=60, and uses original
pose-0 same-view head pixels across WALK/IDLE. The old helper remains public for
compatibility, but active city, Kanto and chapter renderers use the new API.

## Current implementation

core/trainer-walk-v1.js extends PsyTrainerWalkV1 (no extra movement loop): cached
2× atlases, monotonic WALK/settle/IDLE sampler, four authored human walking poses,
120ms body transition to neutral, torso-only breathing with fixed head/feet,
long-gap reset, tile intent expiry, per-look timings and source-row mapping.
WALK order 1,0,2,3; body reference 46 world px; logical viewport 48×64;
wide transparent cell 128×64 avoids clipping accessories; 2× encoded tiles.
Atlas layout currently 8×14 tiles: WALK 0..15, settle 16+pose*2+(half/full),
IDLE 48+pose*4+breath (4 phases). Body source fitting uses uniform-scale raster
calibration to avoid hair/boot nearest-neighbor quantization. Approved original
head layer locks the visible upper reference and removes head-size drift.

A procedural leg warp was visually rejected and REMOVED. It deformed profile
boots. Never restore it. Neutral bodies use complementary image-edited art;
original heads/faces remain copied from the approved original source. Originals
were never overwritten. All 30 neutral directional strips are under
assets/characters/idle-v2. Composited final lossless sheets are generated under
assets/characters/animation-v2 by the actual production builder. Runtime reads
these final sheets after load, with source reconstruction as a fallback.

Active integrations edited: core/halloween-ui.js (city and previews),
core/kanto-world-v2.js (continuous world/interiors),
core/kanto-campaign-playable-v1.js (chapter grid). Movement/collision/persistence
sections are checksum-protected by tests. City canvas gains transparent horizontal
padding only, keeping same height, floor transform and character size. Preview
cards fit measured silhouette without stretching or clipping. Index cache keys
updated. Original costume shop, price/rarity/save logic untouched.

## Art provenance

Approved initial sample original file:
/workspace/generated_images/exec-24b04859-9dbb-4b33-bad8-36f4ee5440a7.png
Copied for reproducible sample: tests/fixtures/idle-adventure-boy-v2-sample.png.
Generated 4-column ×6-row neutral reference sheets (S,W,E,N columns):
basic: exec-c03351f1-2853-4041-bbd5-307b0849404b.png
divine: exec-2c606e8a-598f-45c3-8f96-9f84a9a768fd.png
macabre: exec-d1754769-61e9-4d1d-bd66-38dcddaf114c.png
macabre_alt: exec-09fee3cc-7513-4d5c-9020-2c561f74ddd6.png
supreme: exec-2929c43b-6fd2-46cc-9f83-5c0329256d59.png
All under /workspace/generated_images, retained. Each row was assembled losslessly
into a 1024×256 per-character strip; visible RGBA verified after encoding.
The alpha-0 pixels contain colored RGB but are truly transparent. Do not mistake
those hidden RGB colors for an opaque background or delete legitimate effects.

## Tools, tests and work remaining

Static server: python -m http.server 8766 --bind 127.0.0.1 from this worktree.
Recorder/auditor: scripts/qa/human-animation-v2.cjs
  build ORIGIN OUTPUT: regenerates lossless atlases, 240-row matrix, pixel tests,
  ground-aligned WALK/settle/IDLE sheets for every look. Uses separate page/context
  per category to bound memory. Python/Pillow used only for lossless encoding;
  actual pixel construction is production JavaScript.
  preview ORIGIN OUTPUT [basic|divine|macabre|macabre_alt|supreme|all]
  capture ORIGIN OUTPUT: actual-controller MP4, 5 categories, 6 characters each,
  four directions, 4.4-second idle windows, curves/stops/restarts; expected 123 s.

Current tests: node tests/human-animation-v2.test.cjs PASS (270 timing cases,
30/60/120 FPS ×3 speeds, protected originals/gameplay). Legacy human tests updated
to current public helpers and main's actual movement signature; both
trainer-walk-v7.cjs and kanto-v6-sprites-movement.cjs PASS. trainer-entry-v55 PASS.
Baseline fixture protects 37 whole files plus movement/collision/selection/save
sections. Tool scripts/qa/validate-human-sheets-v2.py independently validates final images.
Tool scripts/qa/calibrate-human-scale-v2.py diagnoses source head/scale
ambiguity; its candidate ratios are analysis-only, not renderer parameters.

Review outputs outside git: /workspace/characters-v2-review. Existing audit has
all 480 source-frame bounds and six source contact sheets. Original/reference
charts for all five categories in art-references. A real-controller 12.5s pilot
MP4 exists under art-sample (made BEFORE final head/scale improvements; regenerate
if including in final). Early previews and early generated atlas metrics are
superseded; use only latest rebuilt results.

Verified outputs: 30 final lossless sheets, 240 coverage rows, 90 ground-aligned
WALK/settle/IDLE comparisons. Independent decoded-WebP validation passes all 3,360
tiles: 92px opaque height, y=120 support, head consistency and fixed idle feet.
270 timing scenarios PASS. 14 of 15 pertinent Node suites PASS; the Paldea suite
fails an old d3198ba-era city-halloween.js hash, identically on the clean exact
967d7db base. Do not edit Pokémon or that unchanged file to silence it.

Real index.html integration: 90 look/viewport cases, 360 city/outdoor/lab/chapter
render checks, zero JS errors. All six identities selected via real UI; all five
looks equipped/removed; real local snapshot/reload verifies identity, costume and
team. Desktop1280×900, portrait390×844, landscape844×390. Fresh anonymous profiles,
external origins/API mutations blocked; existing local save functions unchanged.
Separate 3-viewport real keyboard/touch tests exercise city and Kanto joystick,
interior wall stop/no drift. A chapter caption overlap was corrected in the
rendering function; final caption/input captures are regenerated separately.
Existing loot popup can cover wardrobe controls on mobile; the test closes it
using its own existing close button. No unrelated UI source changes.

IMPORTANT VISUAL FINDING: source WALK poses are insufficient for claiming natural
alternating steps, clearly in Adventure Boy basic. Do not call this task complete
or integrate to main just because scale/timing tests passed. Current production
sheets preserve source WALK with corrected scale and directions; all 30 neutral
IDLE bodies are review candidates expanded after the approved pilot. A new
Adventure Boy WALK sample with passing/contact poses is ISOLATED at
/tests/human-walk-art-sample-v2.html, source in tests/fixtures/walk-v2-sample.
It is not selected by the game. User was shown its real-controller 12.5s MP4 and
asked to review before expanding WALK art, as explicitly required. Initial IDLE
approval must not be misrepresented as approval of all new WALK poses.

Review the new sample identity/poses after user feedback, correct if necessary,
then expand approved WALK material per character/outfit. Keep original heads and
source art authoritative. Rebuild atlases, repeat scale/foot/visual tests and
capture the actual final controller; do not copy the same gait blindly across
all costumes. Full visual acceptance of 240 combinations remains pending.
Route2 mobile landscape has tiny actors due to existing fit-to-map framing;
recorded as a limitation, camera not changed. No real-device/Safari/online tests.

Delivery preparation: final general movie is 123s, 5 look groups with six actors,
all directions, idle, curves/stops/restarts, using delivered production assets.
No GIF. The separate WALK movie is explicitly an approval sample, not active art.
Use only video-final and latest validation/evidence directories; old captures are
superseded. docs/character-animation-v2-review.md and inventory JSON explain scope,
paths, reproduction and pending criteria. Portable ZIP must include binary patch,
base/full commit metadata, all changed relative paths and clean-apply results.
No push/merge/deploy. Main integration is premature until WALK and final review
are actually approved, even though deploy consequences have been investigated.

## Deployment consequence already investigated

Vercel project psyworld prj_RfKf95d1u38hLqvKCVPK6XULvj0v,
team team_4BZyHi6Oumf41Ajx8LeX8rYx. Read-only tools confirmed the current base
967d7db was automatically deployed from Git to production:
dpl_AbGcxwX1n29EJBxE4UTsSDm1AkWv, source=git, target=production, READY,
https://psyworld-6e0y7mdyt-world-of-monsters.vercel.app, production aliases assigned.
Previous main commits 4d7149a and 5331895 also have production deployments.
A future push to main should be expected to trigger production deployment.
Also .github/workflows/kanto-geometry.yml runs for main changes to rendering/maps/
index. Do not change deployment settings or bypass this. Inform user explicitly
before asking final visual/integration approval; Stage B still awaits approval.
