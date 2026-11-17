# Gothic Boy direct-MP4 walk renderer

Source: `assets/characters/source-video/gothic-boy-walk-turn-v2.mp4` (`1920x1080`, `24fps`, ~5.3 MiB — original attachment preserved unchanged).

## Derived directional clips (`scripts/build-gothic-walk-clips-v1.py`)

To eliminate runtime `currentTime` long-GOP seeking stalls and smooth out walk playback at an integer divisor (`60Hz / 2 = 30fps`) without synthetic frame-interpolation artifacts, three directional MP4 walk-cycle clips are pre-built from the source MP4 using `ffmpeg` / `ffprobe` / `Pillow` / `NumPy` (`format=rgb24, crop=640:1080:'crop_x+dx*(n/N-0.5)':0:exact=1` centered around each orientation's anatomical midline with linear camera-drift stabilization, `scale=320:540:flags=lanczos`, `setpts=N/(30*TB)`, H.264 Main Level 3.1, `yuv420p`, `-an`, `-r 30`, `-crf 16 -preset slow -g 5 -keyint_min 5 -sc_threshold 0 -bf 0 -refs 1 -movflags +faststart`):

- `gothic-boy-walk-front.mp4`: source 0-based frames `11..41` inclusive (`crop_x=609, dx=0`, 31 frames @ `30fps`, `1.033s`, `487,755 B`, keyframes `[0, 5, 10, 15, 20, 25, 30]`).
- `gothic-boy-walk-left.mp4`: source 0-based frames `70..101` inclusive (`crop_x=611, dx=-6`, 32 frames @ `30fps`, `1.067s`, `389,010 B`, keyframes `[0, 5, 10, 15, 20, 25, 30]`). Right direction mirrors `left` horizontally in canvas around its centered midline.
- `gothic-boy-walk-back.mp4`: source 0-based frames `130..158` inclusive (`crop_x=617, dx=+8`, 29 frames @ `30fps`, `0.967s`, `321,270 B`, keyframes `[0, 5, 10, 15, 20, 25]`; cut wrap-seam pose MSE in half vs `125..154`).

Total derived MP4 payload is `1,198,035 B` (`~1,170.0 KiB`, ~4.6x smaller than the 1080p source). Each clip uses a fixed per-clip floor anchor baseline (`front: 532`, `left: 530`, `back: 536`) rather than fluctuating per-frame baselines so natural walk gait bob is preserved smoothly without vertical snapping. No spritesheets or PNG sequences are used at runtime.

## Runtime architecture (`core/gothic-walk-video-v1.js`)

- Fetches each of the 3 directional MP4s once into in-memory `Blob` URLs (`URL.createObjectURL`) and keeps 3 active directional `320x540` `<video>` decoders (`front`, `left`, `back`) plus **1 shared standby relay `<video>` decoder** (4 bounded decoders total, zero duplicate HTTP requests).
- Uses `video.loop = false` on all slots and hands off cleanly at EOF via `stepLoopHandoff(clip)` (~25ms pre-arm -> swap before/at EOF with pre-captured chroma-keyed frame-0 `zeroCanvas` bridge -> pause & rewind the retired offscreen standby slot in the background ~1s ahead of its next cycle). Active decoders never incur native `<video loop>` `seeking`/`waiting` stalls (`status().seeks === 0`).
- Direction switches activate the prepared directional decoder immediately without calling `currentTime` seeks, pausing the other clips safely via `playToken` without resetting phase on repeated stop/resume.
- Chroma green removal + spill unmixing uses a WebGL shader (sampling top-left key color) with a 2D `Uint32Array` CPU fallback, triggered strictly per real presented video frame via `requestVideoFrameCallback` (`slot.frameDirty`) when playing (with monotonic `liveFrameIndexFor` fallback before the first callback or without `rVFC`, and `0` chroma passes when paused).
- Game integration (`core/trainer-walk-v1.js`, `core/halloween-ui.js`, `core/city-halloween.js`, `core/kanto-world-v2.js`) prepares clips eagerly when the basic Gothic Boy is active in Psy City or Kanto, suppresses `#psy-halloween-avatar` whenever `#gameCanvas` owns trainer rendering (eliminating duplicate sprites), and marks character-picker previews and Kanto-occluded city draws `previewOnly: true`.

## Validation

- Static/unit check: `node tests/trainer-walk-v7.cjs`
- Browser test (Desktop, Android Portrait, Android Landscape + Full Game Psy City & Kanto checks): `NODE_PATH=/tmp/pw/node_modules node tests/gothic-mp4-browser.cjs` (or `PREVIEW_BASE=<url>` against any HTTP server supporting `Accept-Ranges` / `206 Partial Content`, such as Vercel static hosting).
