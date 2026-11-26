# Gothic Boy video idle integration

The basic Gothic Boy costume uses a four-view idle strip extracted from the
provided turn video. The strip is loaded only for `gothic_boy` with costume
`basic`; other characters and costumes continue through the existing atlas.

The extraction keeps four original video views in South/front, West/left,
East/right, North/back order. It removes the green background with a soft chroma
matte, uses one scale for all views, aligns the feet, and writes a lossless WebP.
The source MP4 is preserved in `assets/characters/source-video/`; runtime never
plays that file. `PsyTrainerWalkV1` supplies the existing localized torso-breath
cycle and directional state. The current approved Walk frames are reused.

Rebuild the derived asset with:

```sh
python3 scripts/build-gothic-idle-video-v1.py
```

The script requires ffmpeg, Pillow, and NumPy. Validate manually by selecting
Rapaz gótico → Traje de Jornada, opening Pallet, and checking front, both
profiles, back, idle breathing, then movement and stopping. The local test pass
used desktop Chromium plus 844×390 and 390×844 mobile emulation. The MP4 views
provide four clear orientations but not a walk cycle; Walk intentionally remains
the existing game animation until matching walk art is authored.
