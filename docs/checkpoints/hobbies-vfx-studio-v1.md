# PSYWORLD Hobbies Animation & VFX Studio — checkpoint

## Branch, base and safety

- Work branch: `animation/hobbies-vfx-studio-v1`.
- Current remote `origin/main` and exact work base at last fetch: `b64cb1a025f7ca3cd6ca50db49f7eae2da5e3846`.
- The work branch is based directly on that Main commit; `git fetch origin --prune` confirmed the same SHA. Earlier local investigation started at `d2b12ea58d10f567c8b79edc61b97060fed059bd` and was rebased onto the newer Main without dropping edits.
- The reported character-animation commits `ea631035f357a8973b4d99287efb7a1cc6346079` and `eed46970e67be69fce874576c63ac2ab91bbce99` are in the history.
- No push, merge, deploy, or Main mutation has happened. The Pokémon follower renderer and approved human walk renderer were preserved.

## Current system inventory

- `core/hobbies-v2.js` registers 13 Hobbies. The four world-collection careers are `miner`, `lumber`, `gardener`, and `fisher`; the other nine are not currently registered to world workbench spots.
- The data-defined flowers appear three per Kanto route. Lumber spots appear on Routes 1–4. Mining had two `route-cave` spots, but the cave is not reachable from the current world-door registry. A collision-safe miner spot is now registered on Route 1 at `(335,258)`, reachable from the authored walkable point `(335,290)`. This adds access to an existing activity without changing collision geometry.
- Existing fishing zones remain Route 1 `(132,431,r95)`, `(96,350,r90)`, Viridian `(615,655,r110)`, `(470,550,r70)`, and Pallet `(530,630,r65)`, subject to the current blue-water map-pixel test.
- Miner and lumber still award nothing before their configured hit count; flowers award directly; fishing preserves the current minigame, including failure after three continuous seconds in the red zone. Spot state, cooldowns, materials, XP and saves use existing Hobbies/player contracts. No new persistent save schema was introduced.
- The active trainer animation remains `core/trainer-walk-v1.js`. This work samples its currently selected character atlas for the limited gathering/fishing body poses; it does not replace WALK/IDLE, the character manifests, or Pokémon following.

## Recovered animation methodology

- The production trainer renderer is time-based using `performance.now()`, caps long frame gaps, and selects four directional rows from the authored atlas. The Hobbies layer follows that model: one monotonic action clock, elapsed-time frame advancement, a 50 ms maximum accumulated delta, and an impact callback guarded to fire once.
- The gathering action uses a 20-frame/30-FPS reach-and-return timing. Contact is at frame 11 (about 367 ms); tests compare 30, 60 and 120 FPS and verify cancellation if the actor moves away. It composites only the torso/arm strip over the current approved walking frame; head, feet, shadow, scale and world movement remain with the production renderer.
- Fishing reuses the existing minigame FSM and sound/audio settings. The visual layer adds cast/reel body pose, rod image, line, bobber, water ripples and bounded particles. Movement is locked while a staged action or fishing is active, then returns to the normal production renderer.
- No real 24-frame mining/chopping sheet or verified historic frame-17 impact event was found in the current refs. Frame 17 remains an unverified design reference; no tool-swing impact is claimed here.

## Art availability and scope blocker

- Existing field art reused: `assets/idle-realistic/pallet/rock_mid.png`, `tree_curve.png`, `bush_flowers.png`; fishing uses `assets/items/fishing-rod.png`. The world effects draw cracks/progress, exhausted node states, rarity accents, limited material particles, tree response and flower sway without persisting transient animation data.
- Existing `assets/hobbies/miner.svg` and `lumber.svg` are profession illustrations, not the approved individual tool sprites. No equipment registry or the named `pixellab-16-objects-2026-09-16.zip` (eight pickaxes and eight axes) exists in this worktree, current Git refs, or the searched workspace/temp attachments.
- No substitute SVG/temporary pickaxe or axe was added. The capability report explicitly leaves `oreStrike` and `woodChopping` false. Miner/lumber spots react to actual collection hits, but their trainer tool swing and tool-to-hand anchoring remain unfinished until the approved source pack is supplied. This is a hard art dependency for those two complete actions.
- There are no currently registered world workbench spots for the other nine Hobbies. This task did not invent activities, recipes, crafting rewards, or workbench behavior.

## Implemented behavior

- `core/hobbies-vfx-v1.js` draws production spot states from existing field art, localized cracks/progress, completion/exhaustion, bounded (144) scene-scoped particles, rarity accents, audio via existing `psyAudio.sfx`, the timed gardener action, and fishing line/rod/water effects. Particle motion respects reduced-motion preference.
- `core/hobbies-v2.js` calls VFX on actual collection events, stages flowers through the one-shot action callback, uses the existing Mastery menu chance table for rarity outcomes and reward labels, implements Mastery ranks for hit count, respawn, extra quantity, fishing tension and rarity, and exposes fishing/action state to renderers. Miner/lumber default hit counts and flower direct collection remain unchanged.
- The rarity assigned to a spot is cached until the resource's harvest/respawn cycle changes. Therefore the preview is connected to real resource rewards, rather than only changing its menu text.
- `core/kanto-world-v2.js` and `core/kanto-campaign-playable-v1.js` pass the active actor/direction, render through the production trainer atlas, show fishing only at real valid zones, and lock movement/keyboard collection during active visual actions. No combat, shop, quest reward, economy, title, campaign rules, or collision geometry was edited.
- Mastery purchase gating opens only after the live spot mechanics, capability handoff and early reachable Route 1 miner have loaded. The handoff still reports missing mining/chopping human action capabilities; its `ready` flag means the purchased mechanical skill effects are connected and tested, not that those two tool animations are finished.

## Validation

Passing Node checks:

```sh
node tests/hobbies-unified-v2.cjs
node tests/hobbies-ux-v3.cjs
node tests/hobbies-mastery-campaign-v1.cjs
node tests/hobbies-no-legacy-bonuses-v4.cjs
node tests/kanto-gym-hobbies-v70.cjs
node tests/hobbies-spot-effects-v1.cjs
```

The dedicated test covers one-shot actions at 30/60/120 FPS, background delta caps, movement cancellation, collection hit counts and actual item/XP, early-route mine reachability, rarity odds vs. the menu, rank effects, autosave, sound keys, particle cap, fishing movement lock, and water-only field rendering.

Real Chromium capture command:

```sh
node scripts/qa/hobbies-vfx-studio-v1.cjs /workspace/hobbies-vfx-studio-v1-artifacts
```

The capture ran the production Kanto Route 1 controller and production assets in an ephemeral test profile. It exercised flower collection, five lumber and five mining interactions, and the live fishing minigame; resulting totals and inventory showed one reward per activity and no duplicate. It also waited for the existing V9 local save, restored through the production `autoLoad`, and confirmed all four material counts and gathering totals remained exactly one. Desktop was 59 FPS; emulated mobile portrait/landscape each held 60 FPS with p95 frame interval 16.7/16.8 ms and roughly 8–9 MB reported JS heap. Chromium recorded zero page errors. The mobile check is viewport/touch emulation, not a physical handset or native GPU/memory test.

The combined 20-second real-browser MP4 is `/workspace/hobbies-vfx-studio-v1-artifacts/hobbies-vfx-studio-v1-demo.mp4` (3,812,557 bytes). The capture demonstrates current game behavior, not a completed miner/chopper swing; visual review confirmed those missing trainer poses are not masked or simulated. Screenshots and machine-readable report are beside the video.

`git diff --check` passes. `tests/human-animation-v2.test.cjs` still fails on its protected-file SHA expectation for `core/legacy-runtime.js`: expected `4459ceddc53d31fdea2c9006c3605a60e16a162fcb31d7342ee583ca2ac614d4`, actual `c0e02ea4939610078f480eabd4c57076d3aad3ec759663939734702e361bcf12`. It fails identically on a clean worktree of the current `origin/main` and the file is untouched here, so it is a pre-existing stale assertion, not a Hobbies regression. A second failure from the older `d2b12ea` baseline expected Mastery purchases to be open before the spot mechanics shipped; latest Main commit `b613e6b` updates that safeguard and the corresponding current test passes.

## Files in this change

- `core/hobbies-vfx-v1.js`
- `core/hobbies-v2.js`
- `core/hobby-mastery-v1.js`
- `core/hobby-spot-effects-v1.js`
- `core/kanto-campaign-playable-v1.js`
- `core/kanto-world-v2.js`
- `css/hobbies-vfx-v1.css`
- `index.html`
- `scripts/qa/hobbies-vfx-studio-v1.cjs`
- `tests/hobbies-mastery-campaign-v1.cjs`
- `tests/hobbies-spot-effects-v1.cjs`
- `tests/hobbies-ux-v3.cjs`

## Resume instructions

1. Keep work on `animation/hobbies-vfx-studio-v1`; fetch and compare `origin/main` before any future integration.
2. Obtain `pixellab-16-objects-2026-09-16.zip` from the user and verify its contents/material names before implementing the miner/lumber tool sprites or claiming those actions complete.
3. Add four-direction action poses/tool anchors using the approved individual tool art, synchronize each impact with the existing one-shot event and spot VFX, then test all six trainer identities and their original/special looks without changing walk sheets.
4. Do not push, merge, deploy, or edit Main until explicit approval.
