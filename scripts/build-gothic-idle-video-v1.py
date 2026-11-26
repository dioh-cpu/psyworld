#!/usr/bin/env python3
"""Build the four-view Gothic Boy idle strip from the approved turn video.

Requires ffmpeg, Pillow, and NumPy. The source video is kept unchanged in
assets/characters/source-video/ and this script writes a 4-cell WebP strip in
front, left, right, back order for PsyTrainerWalkV1's existing idle pipeline.
"""
from __future__ import annotations

import argparse
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/characters/source-video/gothic-boy-rotation-v1.mp4"
OUTPUT = ROOT / "assets/characters/idle-video-v1/gothic-boy-basic-4dir.webp"
TILE = 512
# The video rotates clockwise: front, right profile, back, left profile. The
# project rows are front, left, right, back, so the profile samples are mapped
# by the direction the face points on screen rather than by rotation order.
FRAME_BY_DIRECTION = {"front": 0, "left": 60, "right": 180, "back": 120}


def extract_frames(source: Path, directory: Path) -> dict[str, Image.Image]:
    result = {}
    for direction, frame_no in FRAME_BY_DIRECTION.items():
        out = directory / f"{direction}.png"
        subprocess.run(
            ["ffmpeg", "-v", "error", "-i", str(source), "-vf", f"select=eq(n\\,{frame_no})",
             "-vsync", "0", "-frames:v", "1", str(out)],
            check=True,
        )
        result[direction] = Image.open(out).convert("RGB")
    return result


def chroma_matte(image: Image.Image) -> tuple[np.ndarray, np.ndarray]:
    rgb = np.asarray(image, dtype=np.float32)
    h, w, _ = rgb.shape
    border = np.concatenate((rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]), axis=0)
    key = np.median(border, axis=0)
    key_green_excess = key[1] - max(key[0], key[2])
    green_excess = rgb[:, :, 1] - np.maximum(rgb[:, :, 0], rgb[:, :, 2])
    # Pixels with no clear green dominance remain fully opaque. Soft alpha is
    # retained only at antialiased edges; the background key is sampled per frame.
    alpha = 1.0 - np.clip((green_excess - 4.0) / max(1.0, key_green_excess - 4.0), 0.0, 1.0)
    alpha[alpha < 0.045] = 0.0
    alpha[alpha > 0.985] = 1.0

    # Remove the green component contributed by the keyed backdrop on soft edges.
    safe = np.maximum(alpha, 0.045)[:, :, None]
    unmix = (rgb - key[None, None, :] * (1.0 - alpha[:, :, None])) / safe
    unmix = np.clip(unmix, 0.0, 255.0)
    rgba = np.dstack((unmix, alpha * 255.0)).astype(np.uint8)
    return rgba, alpha


def visible_bounds(alpha: np.ndarray) -> tuple[int, int, int, int]:
    ys, xs = np.where(alpha > 0.12)
    if not len(xs):
        raise RuntimeError("Chroma key removed the complete character")
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def build(source: Path, output: Path) -> None:
    with tempfile.TemporaryDirectory(prefix="gothic-idle-") as temp:
        frames = extract_frames(source, Path(temp))
        keyed = {}
        boxes = {}
        for direction, frame in frames.items():
            rgba, alpha = chroma_matte(frame)
            keyed[direction] = rgba
            boxes[direction] = visible_bounds(alpha)

        # Use one scale for every orientation and lock every shoe sole to the
        # same baseline. This avoids size changes and foot sliding in the atlas.
        max_w = max(x2 - x1 for x1, _, x2, _ in boxes.values())
        max_h = max(y2 - y1 for _, y1, _, y2 in boxes.values())
        scale = min(460 / max_w, 484 / max_h)
        atlas = Image.new("RGBA", (TILE * 4, TILE), (0, 0, 0, 0))
        for index, direction in enumerate(("front", "left", "right", "back")):
            x1, y1, x2, y2 = boxes[direction]
            crop = Image.fromarray(keyed[direction], "RGBA").crop((x1, y1, x2, y2))
            size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
            crop = crop.resize(size, Image.Resampling.LANCZOS)
            x = index * TILE + (TILE - crop.width) // 2
            y = TILE - 10 - crop.height
            atlas.alpha_composite(crop, (x, y))

        output.parent.mkdir(parents=True, exist_ok=True)
        atlas.save(output, "WEBP", lossless=True, method=6)
        print(f"Wrote {output.relative_to(ROOT)} ({atlas.width}x{atlas.height}, lossless WebP)")
        for direction in ("front", "left", "right", "back"):
            x1, y1, x2, y2 = boxes[direction]
            print(f"{direction}: source bbox {x1},{y1}–{x2},{y2}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=SOURCE)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    build(args.source.resolve(), args.output.resolve())
