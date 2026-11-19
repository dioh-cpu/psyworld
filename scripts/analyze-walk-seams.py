#!/usr/bin/env python3
"""Automatic frame-jump and seam discontinuity detector for Gothic Boy MP4 walk clips.

Analyzes per-region frame-to-frame RMSE, 2nd-order acceleration (jerk), and back-cape
contour velocity across the gait cycle for front, left/right, and back clips.

Usage:
  python3 scripts/analyze-walk-seams.py
  python3 scripts/analyze-walk-seams.py --assert-smooth
"""
from __future__ import annotations

import argparse
import glob
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
REGIONS = {
    "full": (40, 535, 30, 290),
    "head": (40, 180, 80, 240),
    "waist_cape": (220, 380, 90, 260),
    "back_cape": (220, 430, 150, 270),
    "legs": (360, 535, 70, 240),
}
CLIPS = [
    ("front", ROOT / "assets/characters/walk-video-v1/gothic-boy-walk-front.mp4", 31),
    ("left", ROOT / "assets/characters/walk-video-v1/gothic-boy-walk-left.mp4", 33),
    ("back", ROOT / "assets/characters/walk-video-v1/gothic-boy-walk-back.mp4", 29),
]


def load_frames(mp4: Path, n: int) -> list[tuple[np.ndarray, np.ndarray]]:
    with tempfile.TemporaryDirectory(prefix="gothic-seam-audit-") as d:
        subprocess.run(
            ["ffmpeg", "-v", "error", "-i", str(mp4), "-vsync", "0", "-vframes", str(n), f"{d}/f%04d.png"],
            check=True,
        )
        out = []
        for p in sorted(glob.glob(f"{d}/*.png")):
            a = np.asarray(Image.open(p).convert("RGB"), dtype=np.float32)
            kr, kg, kb = a[0, 0]
            ex = max(1.0, float(kg) - max(float(kr), float(kb)) - 4.0)
            al = np.clip(1.0 - (a[:, :, 1] - np.maximum(a[:, :, 0], a[:, :, 2]) - 4.0) / ex, 0.0, 1.0)
            al[al < 0.08] = 0.0
            out.append((a * al[:, :, None], al))
        return out


def cape_edge_x(al: np.ndarray, y0: int = 240, y1: int = 390) -> float:
    xs = [float(np.where(al[y] > 0.3)[0].max()) for y in range(y0, y1) if len(np.where(al[y] > 0.3)[0])]
    return float(np.mean(xs)) if xs else 0.0


def analyze_clip(name: str, path: Path, cycle: int, assert_smooth: bool = False) -> None:
    fr = load_frames(path, cycle + 2)
    print(f"\n=== {name}: {path.relative_to(ROOT)} (cycle={cycle}f) ===")
    for rname, (y0, y1, x0, x1) in REGIONS.items():
        diffs = []
        accels = []
        for i in range(cycle):
            f0, _ = fr[i]
            f1, _ = fr[(i + 1) % cycle]
            f2, _ = fr[(i + 2) % cycle]
            r0, r1, r2 = f0[y0:y1, x0:x1], f1[y0:y1, x0:x1], f2[y0:y1, x0:x1]
            d = float(np.sqrt(np.mean((r1 - r0) ** 2)))
            ac = float(np.sqrt(np.mean((r2 - 2.0 * r1 + r0) ** 2)))
            diffs.append((d, i, (i + 1) % cycle))
            accels.append((ac, i, (i + 1) % cycle, (i + 2) % cycle))
        vals = np.array([x[0] for x in diffs])
        med = float(np.median(vals))
        mad = float(np.median(np.abs(vals - med))) + 1e-3
        top = sorted(diffs, reverse=True)[:4]
        top_a = sorted(accels, reverse=True)[:3]
        w_d = diffs[-1][0]
        z = (w_d - med) / mad
        print(
            f"  [{rname:10s}] median={med:5.2f} | wrap({cycle-1}->{0})={w_d:5.2f} (z={z:+.1f}) | biggest jumps: "
            + ", ".join(f"{i}->{j}:{d:.2f}(z={(d-med)/mad:+.1f})" for d, i, j in top)
        )
        print("               jerks (2nd-diff): " + ", ".join(f"{i}->{j}->{k}:{a:.2f}" for a, i, j, k in top_a))
        if assert_smooth and z > 2.5:
            raise AssertionError(f"{name} {rname} loop-wrap jump z={z:+.2f} exceeds 2.5 threshold (wrap={w_d:.2f}, median={med:.2f})")

    edges = [cape_edge_x(fr[i][1]) for i in range(cycle)]
    ed = [edges[(i + 1) % cycle] - edges[i] for i in range(cycle)]
    wrap_dx = ed[-1]
    print(
        f"  [cape_edge ] wrap({cycle-1}->0) dx={wrap_dx:+.2f}px | notable frame dx: "
        + " ".join(f"{i}->{(i+1)%cycle}:{ed[i]:+.2f}" for i in range(cycle) if abs(ed[i]) > 1.8 or i == cycle - 1)
    )
    if assert_smooth and abs(wrap_dx) > 1.5:
        raise AssertionError(f"{name} cape_edge wrap dx={wrap_dx:+.2f}px exceeds 1.5px threshold")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--assert-smooth", action="store_true", help="Fail if any loop wrap has z > 2.5 or |cape_edge dx| > 1.5px")
    args = parser.parse_args()
    for name, path, cycle in CLIPS:
        analyze_clip(name, path, cycle, assert_smooth=args.assert_smooth)
    if args.assert_smooth:
        print("\nPASS: All directional walk clips satisfy regional seam & cape-waist continuity thresholds.")


if __name__ == "__main__":
    main()
