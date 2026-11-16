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
    d.polygon([(550, 515), (764, 515), (764, 675), (550, 675)], fill=255)

    # 2. Central Astrolabe Plaza & East-West Courtyard
    plaza = [
        (285, 392), (380, 385), (495, 345), (548, 305),
        (735, 305), (840, 325), (885, 365), (1055, 355),
        (1145, 315), (1188, 338), (1158, 408), (1070, 465),
        (920, 495), (795, 522), (535, 522), (430, 470),
        (320, 448), (272, 418)
    ]
    d.polygon(plaza, fill=255)

    # Lab front entrance steps/porch landing
    d.polygon([(574, 286), (702, 286), (716, 336), (562, 336)], fill=255)

    # East path winding cleanly along cobblestone loop east of experimental gardens -> behind greenhouse
    # Kept strictly on cobblestones (away from left flower beds & lamp plinth at 1142,224)
    add_var_path(d, [
        (1045, 400, 26), (1120, 382, 24), (1166, 336, 25), (1174, 278, 25),
        (1176, 218, 23), (1164, 168, 20)
    ])

    # 3. Lower-Left SW scenic steps & stone landing (outside alchemy workbench & crates)
    d.polygon([(285, 422), (355, 422), (355, 502), (285, 502)], fill=255)
    d.polygon([(120, 484), (295, 484), (295, 504), (120, 504)], fill=255)
    add_thick_path(d, [(296, 492), (310, 542), (316, 588)], half_width=18)

    # 4. MANDATORY LEFT STAIRCASE & TERRACE PASSAGE -> UPPER ROTA 1 ARCH GATE
    # Traced cleanly inside the stone/wood balustrades using add_var_path (hw=16..18)
    add_var_path(d, [
        (338, 412, 18), (292, 405, 17), (250, 392, 17), (218, 376, 17),
        (194, 354, 16), (194, 336, 16), (218, 316, 16), (218, 286, 16),
        (210, 256, 16), (204, 226, 16), (208, 196, 16), (232, 180, 16),
        (268, 164, 16), (312, 152, 16), (336, 134, 16), (344, 112, 16),
        (356, 94, 16), (446, 94, 16), (542, 92, 18), (544, 34, 20)
    ])

    # Upper terrace dirt path (strictly between top fence y=76 and bushes y=110..115) -> Rota 1 archway
    d.polygon([(338, 78), (488, 78), (488, 110), (338, 110)], fill=255)
    d.polygon([(488, 78), (578, 78), (578, 115), (488, 115)], fill=255)
    d.polygon([(500, 28), (582, 28), (582, 98), (500, 98)], fill=255)

    # --- SOLID OBSTACLES CARVED OUT ---
    # Astrolabe stone fountain (measured center 652,420)
    d.polygon(ellipse_poly(652, 420, 90, 46), fill=0)

    # Left bench & cherry tree flower bed / stone retaining wall
    d.rectangle([414, 360, 488, 402], fill=0)
    d.polygon([(232, 336), (362, 336), (362, 384), (268, 376), (232, 362)], fill=0)
    d.polygon([(275, 315), (410, 315), (410, 352), (275, 352)], fill=0)
    # Alchemy workbench, SW crates & flower bed
    d.rectangle([110, 445, 290, 492], fill=0)
    d.rectangle([430, 482, 515, 520], fill=0)

    # Flowerpot curb bollards & small crate flanking Lab front stairs
    d.ellipse([532, 304, 570, 344], fill=0)
    d.ellipse([708, 304, 744, 344], fill=0)
    d.rectangle([518, 338, 540, 360], fill=0)

    # Plaza lamps (measured plinths)
    d.ellipse([402, 464, 432, 494], fill=0)
    d.ellipse([880, 484, 906, 506], fill=0)
    d.ellipse([498, 338, 526, 366], fill=0)
    d.ellipse([762, 352, 790, 380], fill=0)
    d.ellipse([1134, 212, 1154, 234], fill=0)

    # Greenhouse corner crates, bench & full experimental garden fence + stone corner pillar
    d.polygon([(830, 320), (895, 320), (895, 368), (850, 368), (830, 348)], fill=0)
    d.rectangle([842, 406, 906, 444], fill=0)
    d.polygon([
        (875, 250), (1125, 250), (1136, 295), (1134, 348),
        (1102, 392), (1030, 432), (948, 462), (912, 462),
        (912, 430), (875, 365)
    ], fill=0)

    # Bottom grand stair balustrades
    d.polygon([(510, 505), (550, 505), (550, 675), (510, 675)], fill=0)
    d.polygon([(764, 505), (812, 505), (812, 675), (764, 675)], fill=0)

    # Arch stone pillars & upper terrace fence/signboard
    d.rectangle([395, 40, 496, 84], fill=0)
    d.rectangle([584, 15, 628, 72], fill=0)

    # Middle-left landing pond lamp & Stairs 3 right lamp
    d.ellipse([136, 288, 170, 322], fill=0)
    d.ellipse([365, 130, 389, 156], fill=0)

    return im


def add_var_path(d, pts, fill=255):
    """Thick path whose half-width varies per vertex: pts = [(x, y, hw), ...]."""
    for i, (x, y, hw) in enumerate(pts):
        d.ellipse([x - hw, y - hw, x + hw, y + hw], fill=fill)
        if i > 0:
            ax, ay, ahw = pts[i - 1]
            dx, dy = x - ax, y - ay
            L = math.hypot(dx, dy)
            if L > 0.5:
                nx, ny = -dy / L, dx / L
                d.polygon([(ax + nx * ahw, ay + ny * ahw), (x + nx * hw, y + ny * hw),
                           (x - nx * hw, y - ny * hw), (ax - nx * ahw, ay - ny * ahw)], fill=fill)


def build_costa_mask():
    """
    V6.1 Costa e Praia -- every vertex measured on zoomed 20px audit tiles
    (tools/render_audit_tiles.py costa 3 3).
    """
    im = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(im)

    # --- 1. Top landing (Centro entrance) + grand staircase -------------------------
    d.polygon([(478, 26), (572, 24), (578, 12), (578, 0), (624, 0), (624, 12), (628, 24),
               (700, 26), (700, 56), (662, 64), (648, 76), (545, 78), (536, 72), (523, 62), (500, 45)], fill=255)
    d.polygon([(545, 76), (648, 76), (662, 150), (678, 235), (680, 256), (558, 256), (556, 235), (552, 150)], fill=255)

    # --- 2. Cobblestone promenade + cottage porch + lower-left cobble court ---------
    d.polygon([
        (395, 234), (548, 246), (678, 248), (701, 270), (794, 270), (808, 284), (808, 310),
        (868, 320), (872, 344), (826, 350), (758, 335), (752, 305), (684, 304), (678, 318),
        (648, 322), (646, 348), (575, 350), (548, 342), (536, 344), (490, 372), (445, 394),
        (395, 396), (352, 408), (312, 402), (298, 380), (300, 352), (380, 360), (432, 360), (432, 268),
    ], fill=255)
    # cottage front porch & lane connected cleanly to promenade
    d.polygon([(310, 224), (432, 224), (432, 265), (310, 265)], fill=255)

    # --- 3. NW stone stair path (Colinas) -> cottage side -> cobble court -> tide-pool causeway --
    add_var_path(d, [
        (94, 0, 20), (84, 30, 18), (95, 46, 18), (122, 62, 18), (130, 85, 18), (121, 105, 18), (100, 122, 18),
        (84, 140, 18), (80, 157, 18), (91, 175, 18), (114, 196, 19), (138, 215, 20), (160, 236, 20),
        (190, 257, 20), (227, 280, 19), (280, 310, 19), (318, 338, 20), (346, 370, 20), (343, 405, 19),
        (324, 432, 18), (306, 457, 17), (285, 468, 16), (255, 480, 16), (241, 482, 16), (198, 500, 17),
        (159, 517, 17), (143, 535, 17), (137, 552, 17), (150, 570, 17), (187, 587, 17), (207, 598, 16),
        (235, 606, 16),
    ])

    # --- 4. Sand beach (east of the fence & beach boulders) -------------------------
    d.polygon([
        (541, 344), (646, 344), (654, 372), (680, 382), (692, 392), (742, 392), (758, 394), (790, 403),
        (824, 412), (826, 436), (795, 437), (750, 441), (712, 447), (673, 458), (618, 475), (585, 488),
        (560, 496), (501, 509), (435, 522), (388, 530), (372, 520), (368, 495), (380, 487), (418, 482),
        (440, 466), (468, 455), (472, 430), (483, 428), (527, 428), (545, 424), (556, 410), (585, 408),
        (583, 386), (553, 376),
    ], fill=255)

    # --- 5. Stone steps down to the pier + wooden fishing pier deck ---------------------
    d.polygon([(824, 342), (874, 342), (886, 380), (894, 396), (836, 396), (828, 372)], fill=255)
    d.polygon([
        (836, 390), (1035, 390), (1056, 413), (1095, 431), (1146, 455), (1161, 480), (1088, 516),
        (1046, 498), (990, 470), (937, 453), (895, 442), (838, 431),
    ], fill=255)

    # --- 6. NE trail: plaza -> stream bridge -> garden trail (Jardins) -----------------
    add_var_path(d, [
        (786, 286, 18), (812, 277, 18), (838, 268, 20), (864, 258, 20), (884, 246, 20), (900, 230, 21),
        (915, 208, 21), (935, 186, 20),
    ])
    add_var_path(d, [
        (938, 178, 16), (985, 165, 16), (1030, 153, 16), (1050, 149, 17), (1078, 146, 18), (1098, 128, 18),
        (1108, 102, 19), (1116, 82, 20), (1120, 64, 20), (1115, 44, 20), (1108, 22, 20), (1105, 0, 20),
    ])

    # --- SOLID OBSTACLES (carved last) ----------------------------------------------
    # cottage roof + walls (porch steps y>=224 stay open so the door can be reached)
    d.polygon([(150, 140), (222, 62), (236, 28), (282, 28), (282, 62), (334, 90), (392, 142), (392, 224),
               (310, 224), (305, 245), (275, 255), (200, 225)], fill=0)
    # lamp plinths
    d.ellipse([508, 243, 530, 263], fill=0)     # beside stairs (519,252)
    d.ellipse([433, 341, 447, 354], fill=0)     # beside bench (440,347)
    d.ellipse([795, 255, 809, 269], fill=0)     # plaza right lamp (802,262)
    d.ellipse([906, 415, 918, 431], fill=0)     # pier lamp (912,420)
    # bench on the plaza
    d.polygon([(448, 300), (500, 289), (518, 300), (518, 318), (494, 330), (472, 338), (448, 334)], fill=0)
    # bench next to the NE trail
    d.polygon([(814, 212), (868, 204), (872, 222), (870, 234), (838, 244), (822, 244), (814, 226)], fill=0)
    # rope fence below NE trail
    d.line([(814, 298), (842, 284), (875, 270), (908, 250)], fill=0, width=5)
    # cabana (roof, walls, crates and barrels) -- deck begins at y>=390
    d.polygon([(900, 300), (1125, 262), (1125, 390), (900, 390)], fill=0)
    d.polygon([(1048, 378), (1092, 380), (1094, 408), (1052, 410)], fill=0)
    return im


def build_colinas_mask():
    im = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(im)

    # 1. East Village Road (Colinas East <-> Centro West)
    add_thick_path(d, [
        (1200, 290), (1095, 272), (1020, 256), (995, 295),
        (955, 335), (890, 382)
    ], half_width=32)

    # 2. Upper Mine Gantry Terrace & Rails + Ramp from East Road
    add_thick_path(d, [
        (1015, 255), (995, 205), (945, 168), (860, 154), (765, 150), (630, 150)
    ], half_width=24)

    # 2b. Lower Mine Entrance Clearing (accessed from East Road via x=900..960, y=320..350)
    add_thick_path(d, [
        (960, 340), (910, 332), (850, 324), (785, 305), (735, 295)
    ], half_width=22)

    # 3. Lower Quarry Road across East Stairs <-> Stone Arch Bridge <-> West Cabin Plaza
    d.polygon([(835, 350), (935, 350), (935, 405), (835, 405)], fill=255)
    add_thick_path(d, [
        (870, 382), (830, 412), (760, 428), (620, 422), (510, 382),
        (445, 366), (370, 368), (295, 355), (210, 325), (145, 285)
    ], half_width=24)

    # West Cabin Plaza (strictly south of the porch/fence y=285, north of cliff fence y=340)
    d.polygon([(145, 280), (390, 280), (390, 352), (145, 352)], fill=255)

    # 4. Northwest Mountain Trail & Lookout Stairs (kept strictly on stone path)
    add_thick_path(d, [
        (145, 280), (142, 205), (125, 145), (122, 102),
        (165, 72), (240, 48), (275, 0)
    ], half_width=19)

    # 5. South Double Coastal Staircase -> Sandy Beach Exit (Colinas South <-> Costa NW)
    add_thick_path(d, [
        (332, 368), (338, 442), (398, 502), (415, 565),
        (472, 622), (482, 675)
    ], half_width=24)
    d.polygon([(440, 605), (535, 605), (535, 675), (440, 675)], fill=255)

    # --- SOLID OBSTACLES CARVED OUT ---
    # Posto dos Mineradores cabin + fenced porch (Screenshot 021912)
    d.polygon([(175, 120), (415, 120), (415, 285), (175, 285)], fill=0)
    # Upper-left cliff rocks above NW trail (Screenshot 021918)
    d.polygon([(0, 0), (105, 0), (105, 115), (0, 115)], fill=0)
    # West cliff wooden fence & rocks (Screenshot 021907)
    d.polygon([(0, 325), (255, 362), (255, 435), (0, 435)], fill=0)
    # East-upper buildings & bushes
    d.polygon([(1018, 75), (1200, 75), (1200, 228), (1065, 228), (1018, 180)], fill=0)
    d.polygon([(1135, 295), (1200, 295), (1200, 455), (1125, 455)], fill=0)
    d.polygon([(960, 325), (1040, 325), (1040, 425), (960, 425)], fill=0)

    # Upper-middle & upper-right cliff + fence above mine entrance (Screenshots 021827, 021830)
    d.polygon([(620, 175), (955, 200), (955, 265), (620, 255)], fill=0)
    d.rectangle([600, 148, 800, 175], fill=0)
    d.rectangle([445, 634, 474, 675], fill=0)
    # Lamp post, fallen log, flowers & stone curb near east road (Screenshots 021837, 034434)
    d.polygon([(855, 245), (942, 245), (942, 298), (905, 318), (855, 315)], fill=0)
    d.ellipse([950, 258, 982, 288], fill=0)
    d.ellipse([1098, 332, 1126, 354], fill=0)
    # Mossy boulder & rock cluster right of mine entrance (Screenshot 021839)
    d.polygon([(830, 265), (890, 265), (890, 305), (830, 305)], fill=0)
    d.polygon([(645, 295), (765, 295), (765, 365), (645, 365)], fill=0)
    # Wooden fence & stone retaining wall above lower cobblestone road (Screenshot 034439)
    d.polygon([(675, 350), (835, 350), (835, 398), (780, 408), (675, 408)], fill=0)

    # Center waterfall & bridge railings
    d.polygon([(385, 285), (535, 285), (535, 342), (385, 342)], fill=0)
    d.polygon([(388, 392), (518, 392), (518, 490), (415, 490), (388, 445)], fill=0)

    # Bottom-center wooden fence & coastal cliff edge (Screenshot 021853)
    d.polygon([(530, 446), (780, 446), (860, 434), (860, 540), (530, 540)], fill=0)

    return im


def build_rota1_mask():
    im = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(im)

    # 1. South Grand Staircase (Rota 1 South <-> Laboratório Rota 1 Archway)
    d.polygon([(510, 565), (634, 565), (634, 675), (510, 675)], fill=255)

    # 2. Central Cobblestone Crossroads Plaza & SW Cottage Courtyard
    plaza = [
        (250, 325), (345, 325), (455, 345), (655, 325),
        (715, 365), (655, 445), (634, 575), (490, 575),
        (425, 475), (350, 405), (250, 385)
    ]
    d.polygon(plaza, fill=255)
    d.polygon([(138, 495), (295, 495), (295, 545), (138, 545)], fill=255)
    add_thick_path(d, [(255, 360), (288, 435), (255, 512)], half_width=26)

    # 3. Main North Dirt Trail -> Top Exit to Viridian (x=725..845, y=0..38)
    add_thick_path(d, [
        (600, 375), (620, 295), (636, 225), (670, 148),
        (722, 88), (766, 40), (776, 0)
    ], half_width=30)

    # 4. NORTHWEST HUNTING MEADOW (inside wooden fence)
    add_thick_path(d, [
        (255, 345), (218, 315), (218, 255), (242, 195), (242, 155)
    ], half_width=23)
    nw_meadow = [
        (175, 78), (395, 78), (470, 92), (555, 130), (575, 152),
        (535, 175), (435, 182), (240, 172), (175, 145)
    ]
    d.polygon(nw_meadow, fill=255)

    # 5. EAST DIRT FORK + GRASS FIELD B + GRASS FIELD C + NE Shrine
    add_thick_path(d, [
        (640, 355), (765, 362), (825, 352), (890, 315), (1025, 285),
        (1105, 255), (1095, 195), (1085, 145)
    ], half_width=24)
    d.polygon([(710, 155), (995, 155), (1015, 262), (710, 262)], fill=255)
    add_thick_path(d, [(725, 145), (820, 155)], half_width=22)
    add_thick_path(d, [(895, 290), (925, 250)], half_width=24)
    d.polygon([(875, 315), (1145, 315), (1145, 435), (885, 425)], fill=255)

    # --- SOLID OBSTACLES CARVED OUT ---
    d.polygon([(315, 240), (495, 240), (495, 345), (365, 355), (315, 315)], fill=0)
    d.polygon([(345, 330), (515, 330), (515, 378), (345, 378)], fill=0)
    d.ellipse([302, 310, 330, 338], fill=0)
    d.ellipse([558, 312, 586, 338], fill=0)

    # SW cottage & flower pots
    d.polygon([(0, 340), (215, 340), (215, 492), (0, 492)], fill=0)
    d.rectangle([195, 450, 248, 502], fill=0)

    # NW meadow fence & stumps
    d.polygon([(0, 120), (195, 155), (195, 190), (0, 170)], fill=0)
    d.polygon([(276, 184), (515, 184), (515, 224), (276, 224)], fill=0)
    d.rectangle([195, 48, 240, 82], fill=0)
    d.rectangle([465, 128, 502, 165], fill=0)
    d.rectangle([508, 96, 565, 165], fill=0)

    # East stumps, fences & chimney
    d.polygon([(720, 124), (802, 108), (808, 138), (726, 152)], fill=0)
    d.polygon([(755, 265), (848, 250), (855, 282), (762, 296)], fill=0)
    d.rectangle([755, 312, 815, 342], fill=0)
    d.rectangle([1080, 288, 1125, 322], fill=0)
    d.rectangle([1090, 412, 1155, 450], fill=0)
    d.ellipse([830, 360, 880, 398], fill=0)

    # Bottom stair balustrades
    d.rectangle([465, 558, 512, 675], fill=0)
    d.rectangle([632, 558, 675, 675], fill=0)

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
                (338, 412), (292, 405), (250, 392), (218, 376),
                (194, 354), (194, 336), (218, 316), (218, 286),
                (210, 256), (204, 226), (208, 196), (232, 180),
                (268, 164), (312, 152), (336, 134), (344, 112),
                (356, 94), (446, 97), (542, 95), (544, 42)
            ],
        ),
        ("costa", "assets/story/pallet/anime3q/04_costa_praia.png", build_costa_mask, [(600, 12), (606, 48), (606, 225), (606, 280), (606, 365), (606, 280), (775, 290), (788, 322), (845, 335), (860, 404), (912, 402), (1035, 425)],
        ),
        (
            "colinas",
            "assets/story/pallet/anime3q/05_colinas_pedreiras.png",
            build_colinas_mask,
            [
                (1170, 268), (1095, 272), (1020, 256), (985, 295),
                (962, 308), (920, 355), (875, 382), (845, 412), (760, 428), (620, 422),
                (565, 396), (505, 370), (445, 366), (370, 368), (332, 368),
                (338, 442), (398, 502), (415, 565), (502, 635), (505, 665)
            ],
        ),
        (
            "rota1",
            "assets/story/pallet/anime3q/06_arredores_rota1.png",
            build_rota1_mask,
            [
                (572, 650), (572, 440), (605, 345), (636, 225),
                (670, 148), (722, 88), (772, 20)
            ],
        ),
    ]

    only = [a for a in sys.argv[1:] if not a.startswith('-')]
    summary = {}
    for name, art_path, builder, route in specs:
        if only and name not in only:
            continue
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

    # Regressao por coordenada: roda sobre os SDFs recem-gravados (so se o build nao foi filtrado).
    if not only:
        import obstacle_regression
        saved = sys.argv
        sys.argv = [sys.argv[0]]
        try:
            code = obstacle_regression.main()
        finally:
            sys.argv = saved
        if code:
            sys.exit(code)


if __name__ == "__main__":
    main()
