#!/usr/bin/env python3
"""
Builds pixel-exact 1200x675 Walkmask PNGs and Exact Euclidean Signed Distance Field (SDF)
PNGs for all 6 areas of PSYWORLD Pallet Town Anime HD 3/4 V6:
  01 - Centro e Residencias (preserved verbatim from V5)
  02 - Jardins e Bosque (preserved verbatim from V5)
  03 - Laboratorio do Professor Carvalho (including left stair/terrace path -> Rota 1 gate)
  04 - Costa e Praia
  05 - Colinas e Pedreiras
  06 - Arredores e Nova Rota 1
"""

import json
import math
import os
import sys
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_walkmasks_v5 import (
    W,
    H,
    OUT_DIR,
    build_centro_mask,
    build_jardins_mask,
    compute_edt_2d,
    analyze_connectivity,
    render_audit_overlay,
    ellipse_poly,
)

os.makedirs(OUT_DIR, exist_ok=True)


def add_thick_path(d, pts, half_width):
    hw = half_width
    for i in range(len(pts)):
        x, y = pts[i]
        d.ellipse([x - hw, y - hw, x + hw, y + hw], fill=255)
        if i > 0:
            ax, ay = pts[i - 1]
            dx, dy = x - ax, y - ay
            L = math.hypot(dx, dy)
            if L > 0.5:
                nx, ny = -dy / L * hw, dx / L * hw
                d.polygon([(ax + nx, ay + ny), (x + nx, y + ny), (x - nx, y - ny), (ax - nx, ay - ny)], fill=255)


def check_polyline_sdf(edt, pts):
    min_d = 1e9
    worst_pt = None
    for i in range(len(pts) - 1):
        ax, ay = pts[i]
        bx, by = pts[i + 1]
        steps = max(2, int(math.hypot(bx - ax, by - ay)))
        for s in range(steps + 1):
            t = s / steps
            x = max(0, min(W - 1, int(round(ax + (bx - ax) * t))))
            y = max(0, min(H - 1, int(round(ay + (by - ay) * t))))
            val = float(edt[y, x])
            if val < min_d:
                min_d = val
                worst_pt = (x, y)
    return min_d, worst_pt


def build_lab_mask():
    im = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(im)

    # 1. Bottom Main Grand Staircase (from Centro north portal y=675 up to central plaza y=515)
    d.polygon([(545, 515), (776, 515), (776, 675), (545, 675)], fill=255)

    # 2. Central Astrolabe Plaza & East-West Courtyard
    plaza = [
        (285, 392), (380, 385), (495, 345), (548, 305),
        (735, 305), (840, 325), (885, 365), (1055, 355),
        (1145, 315), (1188, 338), (1140, 395), (1045, 448),
        (920, 492), (795, 526), (535, 522), (430, 475),
        (320, 448), (272, 418)
    ]
    d.polygon(plaza, fill=255)

    # Lab front entrance steps/porch landing (widened between flowerpot pillars so r=11 passes cleanly)
    d.polygon([(574, 286), (702, 286), (716, 336), (562, 336)], fill=255)

    # East path winding cleanly along cobblestone loop east of experimental gardens -> behind greenhouse
    add_thick_path(d, [
        (1030, 392), (1115, 372), (1160, 328), (1174, 274),
        (1168, 212), (1144, 158)
    ], half_width=28)

    # 3. Lower-Left SW scenic steps & stone landing (cleanly connected to main plaza, outside alchemy shelf)
    d.polygon([(242, 422), (355, 422), (355, 502), (242, 502)], fill=255)
    d.polygon([(120, 468), (275, 468), (275, 502), (120, 502)], fill=255)
    add_thick_path(d, [(282, 488), (296, 540), (304, 588)], half_width=22)

    # 4. MANDATORY LEFT STAIRCASE & TERRACE PASSAGE -> UPPER ROTA 1 ARCH GATE
    add_thick_path(d, [
        (320, 408), (264, 392), (210, 365), (186, 344),
        (228, 314), (222, 256), (190, 224), (206, 186),
        (268, 166), (322, 152), (344, 114), (346, 86),
        (450, 86), (546, 76), (548, 34)
    ], half_width=27)

    # Widen upper terrace dirt path (y=66..118) seamlessly across to Rota 1 stone archway (x=500..596)
    d.polygon([(330, 66), (596, 66), (596, 118), (330, 118)], fill=255)
    d.polygon([(498, 28), (596, 28), (596, 98), (498, 98)], fill=255)

    # --- SOLID OBSTACLES CARVED OUT ---
    # Astrolabe stone fountain (keep rx=92, ry=45 so front Lab porch connects seamlessly to plaza!)
    d.polygon(ellipse_poly(642, 392, 92, 45), fill=0)

    d.rectangle([388, 348, 456, 394], fill=0)
    d.polygon([(275, 315), (410, 315), (410, 352), (275, 352)], fill=0)
    # Flowerpot curb bollards flanking Lab front stairs (leave 572..704 wide open for r=11!)
    d.ellipse([534, 304, 568, 336], fill=0)
    d.ellipse([708, 304, 742, 336], fill=0)

    d.ellipse([402, 464, 432, 494], fill=0)
    d.ellipse([878, 442, 908, 472], fill=0)
    d.ellipse([498, 316, 524, 342], fill=0)
    d.ellipse([762, 316, 788, 342], fill=0)

    # East greenhouse & experimental garden beds (kept west of x=1048 so east road connects cleanly with >= 20px SDF)
    d.rectangle([838, 382, 904, 422], fill=0)
    d.polygon([(875, 280), (1048, 255), (1048, 338), (905, 382), (875, 350)], fill=0)

    d.polygon([(510, 505), (546, 505), (546, 675), (510, 675)], fill=0)
    d.polygon([(774, 505), (812, 505), (812, 675), (774, 675)], fill=0)

    # Arch stone pillars strictly north of y=64 so upper dirt curve (y=66..118) connects smoothly!
    d.rectangle([466, 15, 496, 64], fill=0)
    d.rectangle([598, 15, 628, 64], fill=0)
    # Upper terrace lamp post & signboard along north grass curb (north of y=64)
    d.ellipse([402, 40, 426, 63], fill=0)
    d.rectangle([450, 42, 472, 63], fill=0)

    # Middle-left landing pond lamp & Stairs 3 right lamp
    d.ellipse([136, 288, 170, 322], fill=0)
    d.ellipse([365, 130, 389, 156], fill=0)

    return im


def build_costa_mask():
    im = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(im)

    # 1. Top-Center Grand Cobblestone Staircase (Centro <-> Costa)
    d.polygon([(525, 0), (685, 0), (685, 48), (525, 48)], fill=255)
    d.polygon([(548, 35), (668, 35), (668, 222), (548, 222)], fill=255)

    # 2. Central Coastal Promenade Terrace
    promenade = [
        (225, 200), (885, 200), (905, 295), (815, 315),
        (235, 305), (205, 260)
    ]
    d.polygon(promenade, fill=255)

    # 3. Northwest Rocky Cliff Stairs -> Cottage Lane (Colinas <-> Costa)
    add_thick_path(d, [
        (120, 0), (122, 45), (112, 95), (92, 145),
        (135, 185), (205, 215), (265, 245)
    ], half_width=24)
    d.polygon([(245, 182), (370, 182), (370, 250), (245, 250)], fill=255)

    # 4. Left Beach Ramp & Tide-Pool Breakwater Causeway
    add_thick_path(d, [
        (235, 270), (288, 320), (318, 372), (392, 382)
    ], half_width=26)
    add_thick_path(d, [
        (292, 398), (225, 472), (145, 512), (96, 542), (138, 578), (218, 558)
    ], half_width=26)

    # 5. Open Stairway from Central Promenade Directly South onto Sandy Beach (x=495..615)
    d.polygon([(492, 285), (618, 285), (618, 360), (492, 360)], fill=255)

    # 6. Main Sandy Beach
    beach = [
        (365, 355), (475, 342), (610, 326), (725, 322), (790, 350),
        (800, 395), (735, 405), (635, 396), (520, 412), (430, 422), (350, 425)
    ]
    d.polygon(beach, fill=255)

    # 7. Stone Steps & Full Wooden Fishing Pier + Cabana Deck
    d.polygon([(780, 245), (892, 245), (892, 335), (780, 335)], fill=255)
    d.polygon([(820, 320), (882, 320), (882, 410), (820, 410)], fill=255)
    d.polygon([(815, 396), (1128, 396), (1128, 464), (815, 464)], fill=255)
    d.polygon([(1032, 435), (1132, 435), (1132, 518), (1032, 518)], fill=255)

    # 8. Northeast Stream Bridge & Garden Trail (Costa <-> Jardins)
    add_thick_path(d, [
        (855, 240), (895, 200), (925, 160), (975, 146), (1035, 152),
        (1085, 128), (1118, 72), (1142, 0)
    ], half_width=24)

    # --- SOLID OBSTACLES CARVED OUT ---
    d.polygon([(560, 0), (650, 0), (650, 22), (560, 22)], fill=0)
    d.rectangle([524, 48, 548, 215], fill=0)
    d.rectangle([666, 48, 690, 215], fill=0)

    d.ellipse([496, 175, 526, 204], fill=0)
    d.ellipse([782, 175, 812, 204], fill=0)
    # Merged planter box cutout (eliminates stray 1-cell island at 429,297)
    d.rectangle([420, 248, 512, 306], fill=0)
    d.polygon([(315, 240), (420, 240), (420, 288), (315, 288)], fill=0)
    d.rectangle([802, 195, 868, 242], fill=0)
    d.polygon([(622, 294), (775, 286), (775, 326), (622, 336)], fill=0)

    # Pier fishing lamp & Cabana roof/wall (stop at y=404 so pier deck y=404..464 gives >22px SDF!)
    d.ellipse([894, 382, 922, 404], fill=0)
    d.rectangle([940, 310, 1090, 404], fill=0)

    d.polygon([(325, 382), (412, 368), (412, 422), (325, 426)], fill=0)
    d.polygon([(175, 498), (290, 495), (300, 558), (175, 558)], fill=0)

    return im


def build_colinas_mask():
    im = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(im)

    # 1. East Village Road (Colinas East <-> Centro West)
    add_thick_path(d, [
        (1200, 290), (1095, 272), (1020, 256), (960, 295),
        (915, 345), (890, 382)
    ], half_width=34)

    # 2. Upper Mine Gantry Terrace & Rails + Ramp
    add_thick_path(d, [
        (1015, 255), (975, 202), (935, 168), (860, 154), (765, 150), (630, 150)
    ], half_width=28)
    d.polygon([(705, 222), (895, 222), (915, 280), (695, 280)], fill=255)
    add_thick_path(d, [(875, 248), (945, 255), (1005, 258)], half_width=24)

    # 3. Lower Quarry Road across East Stairs <-> Stone Arch Bridge <-> West Cabin Plaza
    d.polygon([(835, 338), (935, 338), (935, 405), (835, 405)], fill=255)
    add_thick_path(d, [
        (870, 382), (760, 402), (620, 405), (510, 376),
        (445, 366), (370, 368), (295, 355), (210, 332), (135, 290)
    ], half_width=25)

    d.polygon([(140, 230), (390, 230), (390, 365), (140, 365)], fill=255)
    d.polygon([(320, 255), (410, 255), (410, 320), (320, 320)], fill=255)

    # 4. Northwest Mountain Trail & Lookout Stairs
    add_thick_path(d, [
        (138, 255), (142, 195), (125, 145), (115, 100),
        (165, 72), (245, 48), (285, 0)
    ], half_width=24)

    # 5. South Double Coastal Staircase -> Sandy Beach Exit (Colinas South <-> Costa NW)
    add_thick_path(d, [
        (332, 368), (338, 442), (398, 502), (415, 565),
        (472, 622), (482, 675)
    ], half_width=26)
    d.polygon([(440, 622), (535, 622), (535, 675), (440, 675)], fill=255)

    # --- SOLID OBSTACLES CARVED OUT ---
    d.polygon([(185, 125), (415, 125), (415, 275), (240, 275), (185, 225)], fill=0)
    d.polygon([(1018, 75), (1200, 75), (1200, 228), (1065, 228), (1018, 180)], fill=0)
    d.polygon([(1125, 335), (1200, 335), (1200, 455), (1125, 455)], fill=0)

    d.polygon([(385, 285), (535, 285), (535, 342), (385, 342)], fill=0)
    d.polygon([(388, 392), (518, 392), (518, 490), (415, 490), (388, 445)], fill=0)

    d.ellipse([958, 266, 974, 282], fill=0)
    d.ellipse([1098, 332, 1126, 354], fill=0)
    d.polygon([(645, 295), (865, 295), (865, 365), (645, 365)], fill=0)
    d.polygon([(745, 182), (915, 190), (915, 212), (745, 204)], fill=0)
    d.rectangle([820, 266, 895, 288], fill=0)

    return im


def build_rota1_mask():
    im = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(im)

    # 1. South Grand Staircase (Rota 1 South <-> Laboratório Rota 1 Archway)
    d.polygon([(498, 565), (642, 565), (642, 675), (498, 675)], fill=255)

    # 2. Central Cobblestone Crossroads Plaza & SW Cottage Courtyard
    plaza = [
        (250, 325), (345, 325), (455, 345), (655, 325),
        (715, 365), (655, 445), (642, 575), (490, 575),
        (425, 475), (350, 405), (250, 385)
    ]
    d.polygon(plaza, fill=255)
    d.polygon([(178, 445), (288, 445), (288, 515), (178, 515)], fill=255)
    add_thick_path(d, [(255, 360), (280, 422), (245, 478)], half_width=28)

    # 3. Main North Dirt Trail -> Top Exit to Viridian (x=725..845, y=0..38)
    add_thick_path(d, [
        (600, 375), (620, 295), (636, 225), (670, 148),
        (722, 88), (766, 40), (776, 0)
    ], half_width=32)

    # 4. NORTHWEST HUNTING MEADOW
    add_thick_path(d, [
        (255, 345), (185, 315), (210, 255), (242, 195), (242, 155)
    ], half_width=25)
    nw_meadow = [
        (170, 58), (470, 62), (555, 108), (585, 148),
        (535, 175), (435, 182), (240, 172), (170, 145)
    ]
    d.polygon(nw_meadow, fill=255)

    # 5. EAST DIRT FORK + GRASS FIELD B + GRASS FIELD C + NE Shrine
    add_thick_path(d, [
        (640, 345), (765, 325), (890, 305), (1025, 285),
        (1105, 255), (1095, 195), (1085, 145)
    ], half_width=25)
    d.polygon([(710, 155), (995, 155), (1015, 262), (710, 262)], fill=255)
    add_thick_path(d, [(725, 145), (820, 155)], half_width=22)
    add_thick_path(d, [(895, 290), (925, 250)], half_width=24)
    d.polygon([(875, 315), (1145, 315), (1145, 435), (885, 425)], fill=255)

    # --- SOLID OBSTACLES CARVED OUT ---
    d.polygon([(315, 240), (495, 240), (495, 345), (365, 355), (315, 315)], fill=0)
    d.ellipse([302, 310, 330, 338], fill=0)
    d.ellipse([558, 312, 586, 338], fill=0)

    d.polygon([(0, 120), (195, 155), (195, 190), (0, 170)], fill=0)
    d.polygon([(276, 184), (515, 184), (515, 224), (276, 224)], fill=0)
    d.rectangle([195, 48, 240, 82], fill=0)
    d.rectangle([465, 128, 502, 165], fill=0)

    d.polygon([(720, 124), (802, 108), (808, 138), (726, 152)], fill=0)
    d.polygon([(755, 265), (848, 250), (855, 282), (762, 296)], fill=0)
    d.ellipse([830, 335, 875, 372], fill=0)

    d.rectangle([465, 558, 502, 675], fill=0)
    d.rectangle([636, 558, 675, 675], fill=0)

    return im


def main():
    specs = [
        ("centro", "assets/story/pallet/anime3q/01_centro_residencias.png", build_centro_mask, None),
        ("jardins", "assets/story/pallet/anime3q/02_jardins_bosque.png", build_jardins_mask, None),
        (
            "lab",
            "assets/story/pallet/anime3q/03_laboratorio.png",
            build_lab_mask,
            [
                (658, 650), (658, 540), (540, 465), (420, 425),
                (320, 408), (264, 392), (210, 365), (186, 344),
                (228, 314), (222, 256), (190, 224), (206, 186),
                (268, 166), (322, 152), (344, 114), (346, 86),
                (450, 82), (548, 70), (552, 42)
            ],
        ),
        (
            "costa",
            "assets/story/pallet/anime3q/04_costa_praia.png",
            build_costa_mask,
            [
                (606, 48), (606, 225), (555, 280), (555, 360),
                (555, 255), (835, 260), (852, 315), (852, 422), (1055, 425)
            ],
        ),
        (
            "colinas",
            "assets/story/pallet/anime3q/05_colinas_pedreiras.png",
            build_colinas_mask,
            [
                (1180, 290), (1095, 272), (1020, 256), (1012, 296),
                (955, 325), (875, 378), (760, 402), (620, 405),
                (510, 376), (445, 366), (370, 368), (332, 368),
                (338, 442), (398, 502), (415, 565), (472, 622), (482, 665)
            ],
        ),
        (
            "rota1",
            "assets/story/pallet/anime3q/06_arredores_rota1.png",
            build_rota1_mask,
            [
                (570, 650), (570, 440), (605, 345), (636, 225),
                (670, 148), (722, 88), (772, 20)
            ],
        ),
    ]

    summary = {}
    for name, art_path, builder, route in specs:
        mask_im = builder()
        mask_arr = (np.array(mask_im) >= 128)
        edt = compute_edt_2d(mask_arr)
        sdf_u8 = np.clip(np.round(edt * 4.0), 0, 255).astype(np.uint8)

        mask_path = os.path.join(OUT_DIR, f"{name}_walkmask.png")
        sdf_path = os.path.join(OUT_DIR, f"{name}_sdf.png")
        mask_im.save(mask_path, optimize=True)
        Image.fromarray(sdf_u8, "L").save(sdf_path, optimize=True)

        comps_11 = analyze_connectivity(mask_arr, edt, r=11, step=3)
        render_audit_overlay(art_path, mask_arr, edt, f"/tmp/audit_{name}_sdf.png", radius=11)

        route_check = None
        if route:
            min_d, worst = check_polyline_sdf(edt, route)
            route_check = {"min_sdf_along_route": round(min_d, 2), "worst_pt": worst, "pass_r11": bool(min_d >= 11.0)}

        summary[name] = {
            "mask_bytes": os.path.getsize(mask_path),
            "sdf_bytes": os.path.getsize(sdf_path),
            "safe_pixels_r11": int(np.sum(edt >= 11)),
            "components_r11_count": len(comps_11),
            "components_r11": comps_11[:5],
            "route_check": route_check,
        }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
