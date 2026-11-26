#!/usr/bin/env python3
"""Build static structure and foliage atlases from the approved Pallet tree PNGs."""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

ROOT = Path(__file__).resolve().parents[1] / "assets/story/pallet/trees"
GROUPS = [
    (0.50, 0.10, 0.105, 0.075),  # top tip
    (0.25, 0.22, 0.09, 0.085),  # upper left
    (0.75, 0.22, 0.09, 0.085),  # upper right
    (0.105, 0.39, 0.085, 0.075),  # far left
    (0.895, 0.39, 0.085, 0.075),  # far right
    (0.29, 0.49, 0.085, 0.07),  # lower left
    (0.71, 0.49, 0.085, 0.07),  # lower right
]


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
    hue *= 60
    sat = delta / np.maximum(hi, 1e-5)
    return hue, sat


def make_layers(size):
    source_path = ROOT / f"tree-{size}-source.png"
    source = np.array(Image.open(source_path).convert("RGBA"))
    h, w = source.shape[:2]
    hue, sat = hue_saturation(source[..., :3])

    # Chromatic green and yellow-green pixels inside hand-placed leaf clusters.
    # The brown trunk and structural branches remain in the static layer.
    foliage_color = (hue >= 42) & (hue <= 155) & (sat >= 0.18)
    yy, xx = np.mgrid[0:h, 0:w]
    masks = []
    claimed = np.zeros((h, w), dtype=bool)
    for cx, cy, rx, ry in GROUPS:
        ellipse = ((xx / w - cx) / rx) ** 2 + ((yy / h - cy) / ry) ** 2 <= 1
        mask = ellipse & foliage_color & (source[..., 3] == 255) & ~claimed
        masks.append(mask)
        claimed |= mask

    # Repair only the tiny holes left by moving leaves. A softly filtered local
    # neighborhood supplies the hidden pixels; the exact original patches cover
    # this repair when the tree is at rest.
    underlay = source.copy()
    if claimed.any():
        valid = (~claimed).astype(np.float32)
        blurred_valid = gaussian_filter(valid, sigma=2.2)
        for channel in range(3):
            values = source[..., channel].astype(np.float32)
            blurred = gaussian_filter(values * valid, sigma=2.2) / np.maximum(blurred_valid, 1e-5)
            underlay[..., channel][claimed] = np.clip(blurred[claimed], 0, 255).astype(np.uint8)
        # Keep repaired pixels opaque so tiny leaf translations never expose
        # the map background through a hole in the tree.
        underlay[..., 3][claimed] = 255
    if not np.array_equal(underlay[~claimed], source[~claimed]):
        raise RuntimeError(f"{size}: source pixels outside the moving foliage changed")

    # Pack five independent, source-aligned leaf masks vertically in one PNG.
    atlas = np.zeros((h * len(masks), w, 4), dtype=np.uint8)
    for i, mask in enumerate(masks):
        atlas[i * h:(i + 1) * h, :, :3] = source[..., :3]
        atlas[i * h:(i + 1) * h, :, 3] = mask.astype(np.uint8) * 255

    structure_path = ROOT / f"tree-{size}-structure.png"
    atlas_path = ROOT / f"tree-{size}-foliage-atlas.png"
    Image.fromarray(underlay).save(structure_path, optimize=True)
    Image.fromarray(atlas).save(atlas_path, optimize=True)

    # Verify a zero-motion composition byte-for-byte against the source.
    composed = Image.fromarray(underlay)
    atlas_image = Image.fromarray(atlas)
    for i in range(len(masks)):
        patch = atlas_image.crop((0, i * h, w, (i + 1) * h))
        composed.alpha_composite(patch)
    actual = np.array(composed)
    mismatch = int(np.count_nonzero(np.any(actual != source, axis=2)))
    if mismatch:
        raise RuntimeError(f"{size}: zero-motion recomposition differs at {mismatch} pixels")
    counts = [int(mask.sum()) for mask in masks]
    if min(counts) < 10:
        raise RuntimeError(f"{size}: empty/weak foliage region: {counts}")
    print(f"{size} {w}x{h}: exact recomposition; leaf pixels per group={counts}")


if __name__ == "__main__":
    for tree_size in ("small", "medium", "large"):
        make_layers(tree_size)
