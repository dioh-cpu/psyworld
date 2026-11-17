# Gothic Boy direct-MP4 walk renderer

Source: `assets/characters/source-video/gothic-boy-walk-turn-v2.mp4` (`1920x1080`, `24fps`, ~5.3 MiB — original attachment preserved unchanged).

## Derived directional clips (`scripts/build-gothic-walk-clips-v1.py`)

To eliminate runtime `currentTime` long-GOP seeking stalls during direction changes, three directional MP4 walk-cycle clips are pre-built from the source MP4 using `ffmpeg` / `ffprobe` / `Pillow` / `NumPy` (`crop=640:1080:640:0,scale=320:540:flags=lanczos`, H.264 Main Level 3.1, `yuv420p`, `-an`, `-r 24`, `-crf 16 -preset slow -g 6 -keyint_min 6 -sc_threshold 0 -bf 0 -refs 1 -movflags +faststart`):

- `gothic-boy-walk-front.mp4`: source 0-based frames `10..40` inclusive (31 frames, `1.292s`, `501,247 B`, keyframes `[0, 6, 12, 18, 24, 30]`).
- `gothic-boy-walk-left.mp4`: source 0-based frames `69..100` inclusive (32 frames, `1.334s`, `399,910 B`, keyframes `[0, 6, 12, 18, 24, 30]`). Right direction mirrors `left` horizontally in canvas.
- `gothic-boy-walk-back.mp4`: source 0-based frames `124..153` inclusive (30 frames, `1.250s`, `345,699 B`, keyframes `[0, 6, 12, 18, 24]`).

Total derived MP4 payload is `1,246,856 B` (`~1,217.6 KiB`, ~4.5x smaller than the 1080p source). Exact per-frame 540p foot baselines are measured by the generator and embedded in `core/gothic-walk-video-v1.js`. No spritesheets or PNG sequences are used at runtime.

## Runtime architecture (`core/gothic-walk-video-v1.js`)

- Keeps 3 muted, looping `320x540` `<video>` decoders (`front`, `left`, `back`) loaded once (`preload="auto"`), with `prepare()` buffering all 3 clips and pre-capturing frame 0 before unlocking interactive preview controls.
- Direction switches activate the target clip immediately without calling `currentTime` seeks, pausing the other clips safely via `playToken` without resetting phase on repeated stop/resume.
- Chroma green removal + spill unmixing uses a WebGL shader (sampling top-left key color) with a 2D `Uint32Array` CPU fallback, triggered once per newly presented 24fps walk frame via `requestVideoFrameCallback` + monotonic timestamp frame-index fallback (`0` chroma passes when paused).
- Game integration (`core/trainer-walk-v1.js`, `core/halloween-ui.js`, `core/kanto-world-v2.js`) prepares clips eagerly when the basic Gothic Boy is active in Psy City or Kanto and marks character-picker previews `previewOnly: true` so selector modals do not trigger MP4 decoding.

## Validation

- Static/unit check: `node tests/trainer-walk-v7.cjs`
- Browser test (Desktop, Android Portrait, Android Landscape): `NODE_PATH=/tmp/pw/node_modules node tests/gothic-mp4-browser.cjs` (or `PREVIEW_BASE=<url>` against any HTTP server supporting `Accept-Ranges` / `206 Partial Content`, such as Vercel static hosting).
