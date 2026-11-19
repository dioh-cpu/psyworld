#!/usr/bin/env python3
"""Build Noctarn's 4-direction idle strip WebP and front PNG from the 360° video.

Extracts front (0°), left profile (90°), mirrored right profile (270°), and back
(180°) from assets/monsters/noctarn/noctarn-rotation-v1.mp4, removes the #00FF00
chroma background with edge despill, locks a single uniform body scale across all
four views, and aligns every paw sole to a shared ground baseline.
"""
from __future__ import annotations

import argparse
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/monsters/noctarn/noctarn-rotation-v1.mp4"
OUT_STRIP = ROOT / "assets/monsters/noctarn/noctarn-idle-4dir.webp"
OUT_SPRITE = ROOT / "assets/monsters/noctarn/sprite-front.png"

CELL_W = 640
CELL_H = 512
BASELINE_MARGIN = 12  # paw soles rest at y = CELL_H - BASELINE_MARGIN (500/512)

# Verified cardinal frames in noctarn-rotation-v1.mp4 (24fps, 188 frames):
# right view is mirrored horizontally from left for 100% symmetry.
FRAMES = {"front": 0, "left": 84, "back": 150}


def extract_frame(source: Path, frame_no: int, out_path: Path) -> Image.Image:
    subprocess.run(
        [
            "ffmpeg", "-v", "error", "-y", "-i", str(source),
            "-vf", f"select=eq(n\\,{frame_no})", "-vsync", "0", "-frames:v", "1",
            str(out_path),
        ],
        check=True,
    )
    return Image.open(out_path).convert("RGB")


def chroma_matte(image: Image.Image) -> tuple[np.ndarray, np.ndarray]:
    rgb = np.asarray(image, dtype=np.float32)
    border = np.concatenate((rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]), axis=0)
    key = np.median(border, axis=0)
    key_green_excess = key[1] - max(key[0], key[2])
    green_excess = rgb[:, :, 1] - np.maximum(rgb[:, :, 0], rgb[:, :, 2])

    alpha = 1.0 - np.clip((green_excess - 6.0) / max(1.0, key_green_excess - 6.0), 0.0, 1.0)
    alpha[alpha < 0.05] = 0.0
    alpha[alpha > 0.985] = 1.0

    # Color unmix + gentle green despill on soft edges so dark outlines stay crisp.
    safe = np.maximum(alpha, 0.05)[:, :, None]
    unmix = (rgb - key[None, None, :] * (1.0 - alpha[:, :, None])) / safe
    unmix = np.clip(unmix, 0.0, 255.0)

    max_rb = np.maximum(unmix[:, :, 0], unmix[:, :, 2])
    unmix[:, :, 1] = np.where(unmix[:, :, 1] > max_rb, max_rb, unmix[:, :, 1])

    rgba = np.dstack((unmix, alpha * 255.0)).astype(np.uint8)
    return rgba, alpha


def visible_bounds(alpha: np.ndarray) -> tuple[int, int, int, int]:
    ys, xs = np.where(alpha > 0.14)
    if not len(xs):
        raise RuntimeError("Chroma key removed the complete creature")
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def build(source: Path, out_strip: Path, out_sprite: Path) -> None:
    with tempfile.TemporaryDirectory(prefix="noctarn-4dir-") as tmp:
        tmp_dir = Path(tmp)
        keyed: dict[str, Image.Image] = {}
        boxes: dict[str, tuple[int, int, int, int]] = {}

        for direction, frame_no in FRAMES.items():
            raw = extract_frame(source, frame_no, tmp_dir / f"{direction}.png")
            rgba, alpha = chroma_matte(raw)
            x1, y1, x2, y2 = visible_bounds(alpha)
            keyed[direction] = Image.fromarray(rgba, "RGBA").crop((x1, y1, x2, y2))
            boxes[direction] = (x1, y1, x2, y2)

        keyed["right"] = keyed["left"].transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        boxes["right"] = boxes["left"]

        max_w = max(im.width for im in keyed.values())
        max_h = max(im.height for im in keyed.values())
        scale = min((CELL_W - 24) / max_w, (CELL_H - BASELINE_MARGIN - 16) / max_h)

        atlas = Image.new("RGBA", (CELL_W * 4, CELL_H), (0, 0, 0, 0))
        for idx, direction in enumerate(("front", "left", "right", "back")):
            crop = keyed[direction]
            size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
            resized = crop.resize(size, Image.Resampling.LANCZOS)
            x = idx * CELL_W + (CELL_W - resized.width) // 2
            y = CELL_H - BASELINE_MARGIN - resized.height
            atlas.alpha_composite(resized, (x, y))

        out_strip.parent.mkdir(parents=True, exist_ok=True)
        atlas.save(out_strip, "WEBP", lossless=True, method=6)

        # Save clean square front PNG for Team/Box/icons.
        front = keyed["front"]
        s_scale = min(460 / front.width, 460 / front.height)
        f_res = front.resize(
            (max(1, round(front.width * s_scale)), max(1, round(front.height * s_scale))),
            Image.Resampling.LANCZOS,
        )
        sq = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
        sq.alpha_composite(f_res, ((512 - f_res.width) // 2, 512 - 16 - f_res.height))
        sq.save(out_sprite, "PNG", optimize=True)

        print(f"Wrote {out_strip.relative_to(ROOT)} ({atlas.width}x{atlas.height}, scale={scale:.4f})")
        print(f"Wrote {out_sprite.relative_to(ROOT)} (512x512)")
        for d in ("front", "left", "right", "back"):
            im = keyed[d]
            print(f"  {d}: crop {im.width}x{im.height} -> placed {round(im.width*scale)}x{round(im.height*scale)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=SOURCE)
    parser.add_argument("--strip", type=Path, default=OUT_STRIP)
    parser.add_argument("--sprite", type=Path, default=OUT_SPRITE)
    args = parser.parse_args()
    build(args.source.resolve(), args.strip.resolve(), args.sprite.resolve())
