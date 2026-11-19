# Gothic Boy video idle source

`gothic-boy-basic-4dir.webp` is a lossless transparent strip derived from the
four canonical views in `assets/characters/source-video/gothic-boy-rotation-v1.mp4`.

The strip uses four 512 × 512 cells, in this order: South/front, West/left,
East/right, North/back. The extracted source frames are 0, 60, 180, and 120 at
24 fps respectively. The left/right samples are assigned by the direction the
face points in the frame, not the order of the turn. All cells use one scale and
share the same foot baseline. The existing trainer animation renderer adds a
small torso breathing cycle while keeping the head and feet stable.

Rebuild with `python3 scripts/build-gothic-idle-video-v1.py`. The source MP4 is
preserved unchanged; the video itself is not shipped or played by the runtime.
