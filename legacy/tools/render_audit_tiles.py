#!/usr/bin/env python3
"""
Renders zoomed audit tiles of a Pallet Anime 3Q area: art + fine coordinate grid
+ walkable (SDF >= 11) tint, so every obstacle coordinate can be MEASURED instead of guessed.

Usage: python3 tools/render_audit_tiles.py <area> [cols rows] [--no-tint]
  area: centro | jardins | lab | costa | colinas | rota1
Outputs /tmp/audit_tiles/<area>_r<row>c<col>.png (1200x675, logical coords labelled).
"""
import os
import sys
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A3Q = os.path.join(ROOT, "assets/story/pallet/anime3q")
ART = {
    "centro": "01_centro_residencias.png",
    "jardins": "02_jardins_bosque.png",
    "lab": "03_laboratorio.png",
    "costa": "04_costa_praia.png",
    "colinas": "05_colinas_pedreiras.png",
    "rota1": "06_arredores_rota1.png",
}
W, H = 1200, 675


def main():
    area = sys.argv[1]
    nums = [a for a in sys.argv[2:] if a.isdigit()]
    cols = int(nums[0]) if len(nums) > 0 else 3
    rows = int(nums[1]) if len(nums) > 1 else 3
    tint = "--no-tint" not in sys.argv and "--edge" not in sys.argv
    edge_mode = "--edge" in sys.argv
    art = Image.open(os.path.join(A3Q, ART[area])).convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    sdf = np.array(Image.open(os.path.join(A3Q, f"walkmasks/{area}_sdf.png")).convert("L"), dtype=np.float32) / 4.0
    os.makedirs("/tmp/audit_tiles", exist_ok=True)
    tw, th = W / cols, H / rows
    pad = 20
    for r in range(rows):
        for c in range(cols):
            x0 = max(0, int(c * tw - pad)); x1 = min(W, int((c + 1) * tw + pad))
            y0 = max(0, int(r * th - pad)); y1 = min(H, int((r + 1) * th + pad))
            crop = art.crop((x0, y0, x1, y1))
            if tint:
                s = sdf[y0:y1, x0:x1]
                arr = np.array(crop, dtype=np.float32)
                ok = s >= 11
                arr[ok] = arr[ok] * 0.62 + np.array([40, 255, 90]) * 0.38
                edge = (s > 0) & (s < 11)
                arr[edge] = arr[edge] * 0.6 + np.array([255, 220, 0]) * 0.4
                crop = Image.fromarray(arr.astype(np.uint8))
            sc = min(1200 / (x1 - x0), 760 / (y1 - y0))
            big = crop.resize((int((x1 - x0) * sc), int((y1 - y0) * sc)), Image.Resampling.NEAREST if False else Image.Resampling.LANCZOS)
            if edge_mode:
                # red = mask boundary (real walkable-surface edge); cyan = centre-of-character limit (SDF=11)
                for thr, col in ((0.5, (255, 40, 40)), (11.0, (0, 230, 255))):
                    m = Image.fromarray(((sdf[y0:y1, x0:x1] >= thr) * 255).astype(np.uint8)).resize(big.size, Image.Resampling.NEAREST)
                    ma = np.array(m) > 127
                    e = ma & ~(np.roll(ma, 1, 0) & np.roll(ma, -1, 0) & np.roll(ma, 1, 1) & np.roll(ma, -1, 1))
                    arr = np.array(big)
                    arr[e] = col
                    big = Image.fromarray(arr)
            d = ImageDraw.Draw(big)
            gx = (x0 // 20 + 1) * 20
            while gx < x1:
                px = (gx - x0) * sc
                major = gx % 100 == 0
                d.line([(px, 0), (px, big.height)], fill=(255, 255, 255, 255) if major else (200, 200, 200), width=2 if major else 1)
                if gx % 40 == 0:
                    d.text((px + 2, 2), str(gx), fill=(255, 255, 0))
                gx += 20
            gy = (y0 // 20 + 1) * 20
            while gy < y1:
                py = (gy - y0) * sc
                major = gy % 100 == 0
                d.line([(0, py), (big.width, py)], fill=(255, 255, 255) if major else (200, 200, 200), width=2 if major else 1)
                if gy % 40 == 0:
                    d.text((2, py + 2), str(gy), fill=(255, 255, 0))
                gy += 20
            out = f"/tmp/audit_tiles/{area}_r{r}c{c}.png"
            big.save(out)
            print(out, (x0, y0, x1, y1))


if __name__ == "__main__":
    main()
