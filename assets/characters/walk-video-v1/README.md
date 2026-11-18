# Gothic Boy direct-MP4 walk renderer

Source: `assets/characters/source-video/gothic-boy-walk-turn-v2.mp4` (`1920x1080`, `24fps`, ~5.3 MiB — original attachment preserved unchanged).

## Derived directional clips (`scripts/build-gothic-walk-clips-v1.py`)

To eliminate runtime `currentTime` long-GOP seeking stalls, smooth out walk playback at an integer divisor (`60Hz / 2 = 30fps`) without synthetic frame-interpolation artifacts, and prevent ~1s EOF loop restart hitches, three directional multi-cycle MP4 walk-cycle clips are pre-built from the source MP4 using `ffmpeg` / `ffprobe` / `Pillow` / `NumPy`:
- Single-pass fractional `Image.Resampling.LANCZOS` 640x1080 -> 320x540 crop+downscale directly from 1080p frames with periodic-closure horizontal camera-drift stabilization (`crop_left = crop_x + (k / n - 0.5) * drift_1080`) so frame `end+1` closes seamlessly back onto frame `start`.
- Repeated 12 complete gait cycles per MP4 (`~11.6–12.8s` linear H.264 P-frame playback @ `30fps`), Main Profile Level 3.1, `yuv420p`, `-an`, `-crf 23 -preset slow -g <2*cycle> -sc_threshold 0 -bf 0 -refs 1 -movflags +faststart`:

- `gothic-boy-walk-front.mp4`: source 0-based frames `11..41` inclusive (`crop_x=610.2, drift_1080=-0.47`, 31f × 6 = 186 frames @ `30fps`, `6.20s`, `1,033,689 B`, keyframes `[0, 62, 124]`).
- `gothic-boy-walk-left.mp4`: source 0-based frames `69..100` inclusive (`crop_x=616.5, drift_1080=-1.67`, 32f × 6 = 192 frames @ `30fps`, `6.40s`, `860,381 B`, keyframes `[0, 64, 128]`). Right direction mirrors `left` horizontally in canvas around its centered midline.
- `gothic-boy-walk-back.mp4`: source 0-based frames `130..158` inclusive (`crop_x=612.0, drift_1080=+6.46`, 29f × 6 = 174 frames @ `30fps`, `5.80s`, `653,792 B`, keyframes `[0, 58, 116]`).

Total derived MP4 payload across all 3 ~12s clips is `2,547,862 B` (`~2,488.1 KiB` / `2.43 MiB`, >2x smaller than the 5.3 MiB source). Each clip uses a fixed per-clip floor anchor baseline (`front: 532`, `left: 531`, `back: 536`) rather than fluctuating per-frame baselines so natural walk gait bob is preserved smoothly without vertical snapping. No spritesheets or PNG sequences are used at runtime.

## Runtime architecture (`core/gothic-walk-video-v1.js`)

- Keeps exactly **3 dedicated prepared `320x540` `<video loop>` decoders** (`front`, `left`, `back`) loaded once via range-enabled MP4 URLs (zero duplicate HTTP fetches, zero runtime `.load()` decoder resets, zero extra standby `<video>` memory or Blob URL duplication).
- Because each directional clip runs ~11.6–12.8s linearly before reaching EOF, typical movement bursts and direction turns incur **0 loop wraps and 0 seeks (`status().seeks === 0`)**; walks extending beyond ~12s wrap cleanly via native `<video loop>` with `glCanvas` preservation.
- Direction switches activate the prepared directional decoder immediately without calling `currentTime` seeks, pausing the other clips safely via `playToken` without resetting phase on repeated stop/resume.
- Chroma green removal + spill unmixing uses a WebGL shader (sampling top-left key color) with a 2D `Uint32Array` CPU fallback, triggered strictly when `clip.frameDirty` (from deduplicated `requestVideoFrameCallback`) **or** monotonic `liveFrameIndexFor(clip)` advances while playing (`frameAdvanced = clip.frameDirty || (!clip.video.paused && liveIdx !== clip.lastFrameIdx)`), preventing `rVFC` unpause wakeup stalls while keeping `0` chroma passes when paused.
- Game integration (`core/trainer-walk-v1.js`, `core/halloween-ui.js`, `core/city-halloween.js`, `core/kanto-world-v2.js`) prepares clips eagerly when the basic Gothic Boy is active in Psy City or Kanto, suppresses `#psy-halloween-avatar` whenever `#gameCanvas` owns trainer rendering (eliminating duplicate sprites), and marks character-picker previews and Kanto-occluded city draws `previewOnly: true`.

## Validation

- Static/unit check: `node tests/trainer-walk-v7.cjs`
- Browser test (Desktop, Android Portrait, Android Landscape + Full Game Psy City & Kanto checks): `NODE_PATH=/tmp/pw/node_modules node tests/gothic-mp4-browser.cjs` (or `PREVIEW_BASE=<url>` against any HTTP server supporting `Accept-Ranges` / `206 Partial Content`, such as Vercel static hosting).

## V7: loop-restart hitch

Clips now hold 12 gait cycles (11.6–12.8 s, 4.9 MB total). When the player stops after >= 2 cycles, the paused decoder is silently rewound to the same gait phase near the start of the file (`pauseClip`), so a normal walk never reaches EOF/loop wrap. Only an uninterrupted walk longer than ~12 s still wraps natively.
