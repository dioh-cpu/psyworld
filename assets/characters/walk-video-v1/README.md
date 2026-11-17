# Gothic Boy direct-MP4 preview

Source: `assets/characters/source-video/gothic-boy-walk-turn-v2.mp4` (original attachment, unchanged).
Renderer: `core/gothic-walk-video-v1.js`. This experiment decodes the MP4 directly; it does not use an extracted frame atlas. A small cached canvas removes chroma green once per decoded source frame. A single decoder is loaded lazily for the basic Gothic Boy only. Audio stays muted.

Directional intervals (seconds): front 0.25–1.95; left 2.65–4.05; back 5.15–6.65. Right mirrors left, including asymmetric accessories. Each interval loops by seeking the same MP4. This may have a visible seek/cycle discontinuity; the source is not a set of independently seamless walking loops. On stop the MP4 pauses on its current frame, as requested; this experiment does not add a new idle cycle. Other characters/costumes retain their existing renderer.

Open `/gothic-walk-preview.html` for the isolated visual test, without login/save changes or collisions. Hold the arrow buttons (or keyboard arrows), then release to pause. The same renderer is wired into the basic Gothic Boy in Psy City and Kanto via `PsyTrainerWalkV1.drawAnimated`. The complete game remains at `/index.html`.

Validation: `node tests/trainer-walk-v7.cjs`; `PREVIEW_BASE=http://localhost:PORT node tests/gothic-mp4-browser.cjs` with Playwright and Chromium installed. The HTTP server **must support byte ranges** for directional seeking; Python's default `http.server` does not. Vercel static hosting supports Range/206. Test checks four directions, actual frame advances, directional bounds, pause stability, mirrored right, button control, and desktop/mobile portrait/mobile landscape viewports. No physical Android device or mobile hardware performance certification is claimed.
