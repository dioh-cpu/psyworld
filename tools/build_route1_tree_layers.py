#!/usr/bin/env python3
"""Build static structure and foliage atlases for the Route 1 Gazebo Oak prototype.

Preserves the original Route 1 map illustration (`assets/story/route-1-artist-v2.webp`)
without any destructive edits. Extracts the landmark oak tree beside the central
gazebo (`x=392..548, y=136..344` in 1400x700 source coordinates) into:
  - `gazebo-oak-source.png`: exact reference crop from the approved Route 1 art
  - `gazebo-oak-structure.png`: static underlay with locally repaired leaf-cluster beds
  - `gazebo-oak-foliage-atlas.png`: 7 vertically stacked leaf-cluster layers

At zero displacement (`dx=0, dy=0`), compositing `structure` + all 7 `foliage-atlas`
slices reproduces `gazebo-oak-source.png` byte-for-byte (0 pixel mismatch).
"""
from pathlib import Path

import numpy as np
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[1]
MAP_SOURCE = REPO_ROOT / "assets/story/route-1-artist-v2.webp"
OUT_DIR = REPO_ROOT / "assets/story/route1/trees"

# Exact crop box in 1400x700 Route 1 artwork coordinates: (left, top, right, bottom)
CROP_BOX = (392, 136, 548, 344)

# 7 compact leaf clusters inside the Gazebo Oak crown (in 156x208 crop coordinates):
# (cx_px, cy_px, rx_px, ry_px)
GROUPS_PX = [
    (79, 43, 15, 10),   # 0: top crown tip
    (52, 54, 13, 9),    # 1: upper-left tuft
    (110, 63, 14, 10),  # 2: upper-right tuft
    (36, 72, 13, 9),    # 3: mid-left tuft
    (79, 83, 15, 10),   # 4: center sunlit tuft
    (124, 90, 14, 10),  # 5: mid-right tuft
    (25, 104, 13, 9),   # 6: lower-left bough tuft
]


def gaussian_2d(arr, sigma):
    """Separable 2D Gaussian filter using pure NumPy (no SciPy dependency required)."""
    radius = int(np.ceil(3.5 * sigma))
    x = np.arange(-radius, radius + 1, dtype=np.float32)
    kernel = np.exp(-0.5 * (x / sigma) ** 2)
    kernel /= kernel.sum()
    padded = np.pad(arr.astype(np.float32), ((radius, radius), (radius, radius)), mode="edge")
    horiz = np.apply_along_axis(lambda row: np.convolve(row, kernel, mode="valid"), axis=1, arr=padded)
    return np.apply_along_axis(lambda col: np.convolve(col, kernel, mode="valid"), axis=0, arr=horiz)


def hue_saturation(rgb):
    f = rgb.astype(np.float32) / 255.0
    hi, lo = f.max(axis=2), f.min(axis=2)
    delta = hi - lo
    hue = np.zeros_like(hi)
    nz = delta > 1e-5
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    m = (hi == r) & nz
    hue[m] = ((g[m] - b[m]) / delta[m]) % 6
    m = (hi == g) & nz
    hue[m] = (b[m] - r[m]) / delta[m] + 2
    m = (hi == b) & nz
    hue[m] = (r[m] - g[m]) / delta[m] + 4
    hue *= 60.0
    sat = delta / np.maximum(hi, 1e-5)
    return hue, sat


def build_gazebo_oak_layers():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    full_map = Image.open(MAP_SOURCE).convert("RGBA")
    source_img = full_map.crop(CROP_BOX)
    source = np.array(source_img)
    h, w = source.shape[:2]

    hue, sat = hue_saturation(source[..., :3])

    # Chromatic green and yellow-green pixels inside the 7 canopy leaf clusters.
    # Trunk, structural branches, fence, grass, flowers, lantern and gazebo remain static.
    foliage_color = (hue >= 42) & (hue <= 155) & (sat >= 0.18)
    yy, xx = np.mgrid[0:h, 0:w]
    masks = []
    claimed = np.zeros((h, w), dtype=bool)
    for cx, cy, rx, ry in GROUPS_PX:
        ellipse = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1.0
        mask = ellipse & foliage_color & (source[..., 3] == 255) & ~claimed
        masks.append(mask)
        claimed |= mask

    # Repair only the tiny gaps behind moving leaf clusters using a smooth multi-scale
    # local foliage neighborhood. Every pixel outside `claimed` stays 100% untouched.
    underlay = source.copy()
    if claimed.any():
        valid = (~claimed).astype(np.float32)
        blurred_valid = gaussian_2d(valid, 2.2) + gaussian_2d(valid, 5.0) * 0.15 + 1e-5
        for channel in range(3):
            values = source[..., channel].astype(np.float32)
            blurred = (
                gaussian_2d(values * valid, 2.2) + gaussian_2d(values * valid, 5.0) * 0.15
            ) / blurred_valid
            underlay[..., channel][claimed] = np.clip(blurred[claimed], 0, 255).astype(np.uint8)
        underlay[..., 3][claimed] = 255

    if not np.array_equal(underlay[~claimed], source[~claimed]):
        raise RuntimeError("gazebo-oak: source pixels outside the moving foliage changed")

    # Pack 7 independent, source-aligned leaf masks vertically in one PNG atlas.
    # Retain source RGB across a 2px margin around each mask to preserve clean
    # bilinear filtering on canvas while allowing PNG to compress empty regions.
    atlas = np.zeros((h * len(masks), w, 4), dtype=np.uint8)
    for i, mask in enumerate(masks):
        rgb_keep = gaussian_2d(mask.astype(np.float32), 1.0) > 0.01
        slice_view = atlas[i * h:(i + 1) * h]
        slice_view[rgb_keep, :3] = source[rgb_keep, :3]
        slice_view[:, :, 3] = mask.astype(np.uint8) * 255

    source_path = OUT_DIR / "gazebo-oak-source.png"
    structure_path = OUT_DIR / "gazebo-oak-structure.png"
    atlas_path = OUT_DIR / "gazebo-oak-foliage-atlas.png"

    source_img.save(source_path, optimize=True)
    Image.fromarray(underlay).save(structure_path, optimize=True)
    Image.fromarray(atlas).save(atlas_path, optimize=True)

    # Verify a zero-motion composition byte-for-byte against the source crop.
    composed = Image.fromarray(underlay)
    atlas_image = Image.fromarray(atlas)
    for i in range(len(masks)):
        patch = atlas_image.crop((0, i * h, w, (i + 1) * h))
        composed.alpha_composite(patch)
    actual = np.array(composed)
    mismatch = int(np.count_nonzero(np.any(actual != source, axis=2)))
    if mismatch:
        raise RuntimeError(f"gazebo-oak: zero-motion recomposition differs at {mismatch} pixels")

    counts = [int(mask.sum()) for mask in masks]
    if min(counts) < 50:
        raise RuntimeError(f"gazebo-oak: empty/weak foliage region: {counts}")

    print(f"gazebo-oak {w}x{h}: exact recomposition (0 mismatch); leaf pixels per group={counts}")


if __name__ == "__main__":
    build_gazebo_oak_layers()
