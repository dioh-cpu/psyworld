#!/usr/bin/env python3
"""
Extracts clean RGBA foreground silhouette occluder PNGs for Pallet Town Areas 03..06:
  - 03 Laboratório: Rota 1 overhead arch beam/pillars, SW/SE/mid-left/upper-left lamps
  - 04 Costa: pier lamp, left plaza lamp, right plaza lamp
  - 05 Colinas: upper-east plaza lamp, lower-east road lamp
  - 06 Rota 1: crossroads lamp, directional wooden signpost
"""

import json
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1200, 675
ART_DIR = "assets/story/pallet/anime3q"
MASK_DIR = os.path.join(ART_DIR, "masks")
os.makedirs(MASK_DIR, exist_ok=True)


def load_canvas(art_file):
    im = Image.open(os.path.join(ART_DIR, art_file)).convert("RGBA")
    if im.size != (W, H):
        im = im.resize((W, H), Image.Resampling.LANCZOS)
    return im


def extract_lamp_rgba(src, cx, y1, y2, half_w=16, head_y_frac=0.42):
    x1, x2 = int(cx - half_w), int(cx + half_w)
    crop = src.crop((x1, y1, x2, y2))
    arr = np.array(crop, dtype=np.uint8)
    h, w, _ = arr.shape
    r, g, b = arr[:, :, 0].astype(np.int16), arr[:, :, 1].astype(np.int16), arr[:, :, 2].astype(np.int16)

    mid = (w - 1) * 0.5
    yy, xx = np.mgrid[0:h, 0:w]
    dx = np.abs(xx - mid)
    lum = (r + g + b) / 3.0
    sat = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)

    # Tight silhouette envelope: top cap -> lantern head -> slim post -> small base plinth
    in_cap = (yy < h * 0.16) & (dx <= 7)
    in_head = (yy >= h * 0.12) & (yy <= h * head_y_frac) & (dx <= 10)
    in_pole = (yy > h * head_y_frac) & (yy < h * 0.88) & (dx <= 4.5)
    in_base = (yy >= h * 0.88) & (dx <= 8.5)

    dark_iron = (in_cap | in_head | in_pole | in_base) & (lum < 110) & (sat < 52)
    warm_glow = in_head & (dx <= 8) & (((r > 180) & (g > 135) & (r >= b + 20)) | (lum > 205))
    base_stone = in_base & (lum < 165) & (sat < 45)

    keep = dark_iron | warm_glow | base_stone
    alpha = np.where(keep, 255, 0).astype(np.uint8)
    alpha_im = Image.fromarray(alpha, "L").filter(ImageFilter.GaussianBlur(0.4))
    arr[:, :, 3] = np.array(alpha_im)
    return Image.fromarray(arr, "RGBA"), [x1, y1, x2, y2]


def extract_lab_arch_rgba(src):
    x1, y1, x2, y2 = 462, 4, 628, 86
    crop = src.crop((x1, y1, x2, y2))
    arr = np.array(crop, dtype=np.uint8)
    h, w, _ = arr.shape
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.polygon([(2, 6), (34, 6), (34, 82), (0, 82)], fill=255)
    d.polygon([(130, 6), (164, 6), (166, 82), (130, 82)], fill=255)
    d.polygon([(26, 14), (62, 6), (83, 0), (104, 6), (138, 14), (138, 44), (108, 44), (58, 44), (26, 44)], fill=255)
    d.polygon([(32, 34), (58, 34), (32, 58)], fill=255)
    d.polygon([(110, 34), (132, 34), (132, 58)], fill=255)
    arr[:, :, 3] = np.array(mask.filter(ImageFilter.GaussianBlur(0.5)))
    return Image.fromarray(arr, "RGBA"), [x1, y1, x2, y2]


def extract_rota1_signpost_rgba(src):
    x1, y1, x2, y2 = 556, 240, 590, 336
    crop = src.crop((x1, y1, x2, y2))
    arr = np.array(crop, dtype=np.uint8)
    r, g, b = arr[:, :, 0].astype(np.int16), arr[:, :, 1].astype(np.int16), arr[:, :, 2].astype(np.int16)
    h, w, _ = arr.shape
    yy, xx = np.mgrid[0:h, 0:w]
    cx = w * 0.5
    # Directional sign boards in top 60% and wooden post in bottom 40%
    in_board = (yy <= h * 0.58) & (r > g + 12) & (g >= b) & (r > 85)
    in_post = (np.abs(xx - cx) <= 6) & (yy >= 8) & (r > g + 4) & (r > 65)
    keep = in_board | in_post
    alpha = np.where(keep, 255, 0).astype(np.uint8)
    arr[:, :, 3] = np.array(Image.fromarray(alpha, "L").filter(ImageFilter.GaussianBlur(0.4)))
    return Image.fromarray(arr, "RGBA"), [x1, y1, x2, y2]


def main():
    lab = load_canvas("03_laboratorio.png")
    costa = load_canvas("04_costa_praia.png")
    colinas = load_canvas("05_colinas_pedreiras.png")
    rota1 = load_canvas("06_arredores_rota1.png")

    outputs = []

    def save_lamp(src, fname, cx, y1, y2, baseline_y, head_frac=0.42):
        im, rect = extract_lamp_rgba(src, cx, y1, y2, half_w=16, head_frac=head_frac) if False else extract_lamp_rgba(src, cx, y1, y2, 16, head_frac)
        path = os.path.join(MASK_DIR, fname)
        im.save(path, optimize=True)
        outputs.append((fname, rect, baseline_y, os.path.getsize(path)))

    # Remove noisy/unused sprites if present
    for old in ("lab_astrolabe.png", "lab_lamp_porch_left.png", "lab_lamp_porch_right.png", "lab_lamp_upper_left.png", "costa_lamp_plaza_left.png", "colinas_lamp_lower.png"):
        p = os.path.join(MASK_DIR, old)
        if os.path.exists(p):
            os.remove(p)

    # 03 Laboratório
    arch, rect = extract_lab_arch_rgba(lab)
    arch.save(os.path.join(MASK_DIR, "lab_rota1_arch.png"), optimize=True)
    outputs.append(("lab_rota1_arch.png", rect, 78, os.path.getsize(os.path.join(MASK_DIR, "lab_rota1_arch.png"))))

    save_lamp(lab, "lab_lamp_sw.png", 418, 404, 492, 486, 0.42)
    save_lamp(lab, "lab_lamp_se.png", 893, 418, 498, 492, 0.40)
    save_lamp(lab, "lab_lamp_mid_left.png", 137, 246, 336, 330, 0.42)

    # 04 Costa e Praia
    save_lamp(costa, "costa_lamp_plaza_right.png", 797, 170, 248, 242, 0.42)
    save_lamp(costa, "costa_lamp_pier.png", 909, 332, 412, 406, 0.42)

    # 05 Colinas e Pedreiras
    save_lamp(colinas, "colinas_lamp_upper.png", 966, 190, 284, 278, 0.42)

    # 06 Rota 1
    save_lamp(rota1, "rota1_lamp_crossroads.png", 373, 224, 342, 336, 0.40)
    sign, srect = extract_rota1_signpost_rgba(rota1)
    sign.save(os.path.join(MASK_DIR, "rota1_signpost.png"), optimize=True)
    outputs.append(("rota1_signpost.png", srect, 330, os.path.getsize(os.path.join(MASK_DIR, "rota1_signpost.png"))))

    # Visual contact sheet on magenta checkerboard
    sheet = Image.new("RGBA", (820, 240), (255, 0, 255, 255))
    d = ImageDraw.Draw(sheet)
    for gy in range(0, 240, 16):
        for gx in range(0, 820, 16):
            if ((gx // 16) + (gy // 16)) % 2 == 0:
                d.rectangle([gx, gy, gx + 15, gy + 15], fill=(200, 0, 200, 255))
    cx, cy, row_h = 10, 10, 0
    for fname, _, _, _ in outputs:
        im = Image.open(os.path.join(MASK_DIR, fname)).convert("RGBA")
        if cx + im.width + 12 > 810:
            cx = 10
            cy += row_h + 12
            row_h = 0
        sheet.alpha_composite(im, (cx, cy))
        row_h = max(row_h, im.height)
        cx += im.width + 12
    sheet.save("/tmp/occluders_v6_sheet.png")
    print(json.dumps(outputs, indent=2))


if __name__ == "__main__":
    main()
