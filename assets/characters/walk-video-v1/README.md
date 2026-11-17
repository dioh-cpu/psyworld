# Gothic Boy direct-MP4 walk renderer

Source: `assets/characters/source-video/gothic-boy-walk-turn-v2.mp4` (`1920x1080`, `24fps`, ~5.3 MiB — original attachment preserved unchanged).

## Derived directional clips (`scripts/build-gothic-walk-clips-v1.py`)

To eliminate runtime `currentTime` long-GOP seeking stalls and smooth out walk playback at an integer divisor (`60Hz / 2 = 30fps`) without synthetic frame-interpolation artifacts, three directional MP4 walk-cycle clips are pre-built from the source MP4 using `ffmpeg` / `ffprobe` / `Pillow` / `NumPy` (`crop=640:1080:{crop_x}:0` centered around each orientation's anatomical midline, `scale=320:540:flags=lanczos`, `setpts=N/(30*TB)`, H.264 Main Level 3.1, `yuv420p`, `-an`, `-r 30`, `-crf 16 -preset slow -g 5 -keyint_min 5 -sc_threshold 0 -bf 0 -refs 1 -movflags +faststart`):

- `gothic-boy-walk-front.mp4`: source 0-based frames `11..41` inclusive (`crop_x=609`, 31 frames @ `30fps`, `1.033s`, `484,281 B`, keyframes `[0, 5, 10, 15, 20, 25, 30]`).
- `gothic-boy-walk-left.mp4`: source 0-based frames `70..101` inclusive (`crop_x=611`, 32 frames @ `30fps`, `1.067s`, `381,401 B`, keyframes `[0, 5, 10, 15, 20, 25, 30]`). Right direction mirrors `left` horizontally in canvas around its centered midline.
- `gothic-boy-walk-back.mp4`: source 0-based frames `125..154` inclusive (`crop_x=617`, 30 frames @ `30fps`, `1.000s`, `334,159 B`, keyframes `[0, 5, 10, 15, 20, 25]`).

Total derived MP4 payload is `1,199,841 B` (`~1,171.7 KiB`, ~4.6x smaller than the 1080p source). Each clip uses a fixed per-clip floor anchor baseline (`front: 532`, `left: 530`, `back: 536`) rather than fluctuating per-frame baselines so natural walk gait bob is preserved smoothly without vertical snapping. No spritesheets or PNG sequences are used at runtime.

## Runtime architecture (`core/gothic-walk-video-v1.js`)

- Keeps 3 muted, looping `320x540` `<video>` decoders (`front`, `left`, `back`) loaded once (`preload="auto"`), with `prepare()` buffering all 3 clips and pre-capturing frame 0 before unlocking interactive preview controls.
- Direction switches activate the target clip immediately without calling `currentTime` seeks, pausing the other clips safely via `playToken` without resetting phase on repeated stop/resume.
- Chroma green removal + spill unmixing uses a WebGL shader (sampling top-left key color) with a 2D `Uint32Array` CPU fallback, triggered strictly per real presented video frame via `requestVideoFrameCallback` (`clip.frameDirty`) when playing (with monotonic `liveFrameIndexFor` fallback before the first callback or without `rVFC`, and `0` chroma passes when paused).
- Game integration (`core/trainer-walk-v1.js`, `core/halloween-ui.js`, `core/city-halloween.js`, `core/kanto-world-v2.js`) prepares clips eagerly when the basic Gothic Boy is active in Psy City or Kanto, suppresses `#psy-halloween-avatar` whenever `#gameCanvas` owns trainer rendering (eliminating duplicate sprites), and marks character-picker previews and Kanto-occluded city draws `previewOnly: true`.

## Validation

- Static/unit check: `node tests/trainer-walk-v7.cjs`
- Browser test (Desktop, Android Portrait, Android Landscape + Full Game Psy City & Kanto checks): `NODE_PATH=/tmp/pw/node_modules node tests/gothic-mp4-browser.cjs` (or `PREVIEW_BASE=<url>` against any HTTP server supporting `Accept-Ranges` / `206 Partial Content`, such as Vercel static hosting).
