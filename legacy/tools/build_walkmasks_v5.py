#!/usr/bin/env python3
"""
Builds pixel-exact 1200x675 Walkmask PNGs and Exact Euclidean Signed Distance Field (SDF)
PNGs for PSYWORLD Pallet Town Anime HD 3/4 (Centro & Jardins).

Walkmask convention:
  255 = Walkable floor/stairs/bridge/grass clearing
    0 = Solid obstacle (wall, water, flowerbed, rock, cliff, fence, bench, tree, house, lamp)

SDF PNG convention (8-bit grayscale, 1200x675):
  pixel = clamp(round(euclidean_dist_to_solid * 4.0), 0, 255)
  At runtime: dist_px = sample_bilinear(x, y) / 4.0
  Walkable with radius r iff dist_px >= r!
"""

import math
import os
import json
import numpy as np
from PIL import Image, ImageDraw

W, H = 1200, 675
OUT_DIR = "assets/story/pallet/anime3q/walkmasks"
os.makedirs(OUT_DIR, exist_ok=True)


def edt_1d(f):
    """Exact 1D squared Euclidean Distance Transform (Felzenszwalb & Huttenlocher)."""
    n = f.shape[0]
    v = np.zeros(n, dtype=np.int32)
    z = np.zeros(n + 1, dtype=np.float64)
    k = 0
    v[0] = 0
    z[0] = -1e18
    z[1] = 1e18
    for q in range(1, n):
        while True:
            r = v[k]
            s = ((f[q] + q * q) - (f[r] + r * r)) / (2.0 * (q - r))
            if s <= z[k]:
                k -= 1
            else:
                break
        k += 1
        v[k] = q
        z[k] = s
        z[k + 1] = 1e18
    d = np.zeros(n, dtype=np.float64)
    k = 0
    for q in range(n):
        while z[k + 1] < q:
            k += 1
        r = v[k]
        d[q] = (q - r) * (q - r) + f[r]
    return d


def compute_edt_2d(walk_bool):
    """Exact 2D Euclidean distance from each walkable pixel to nearest blocked pixel (and 0 on blocked)."""
    INF = 1e9
    g = np.where(walk_bool, INF, 0.0)
    # Transform along columns
    tmp = np.zeros_like(g)
    for x in range(W):
        tmp[:, x] = edt_1d(g[:, x])
    # Transform along rows
    out = np.zeros_like(g)
    for y in range(H):
        out[y, :] = edt_1d(tmp[y, :])
    return np.sqrt(out)


def quad_curve(p0, p1, p2, steps=24):
    pts = []
    for i in range(steps + 1):
        t = i / steps
        u = 1.0 - t
        x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0]
        y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]
        pts.append((x, y))
    return pts


def rotated_box(cx, cy, half_w, half_h, angle_deg):
    rad = math.radians(angle_deg)
    ca, sa = math.cos(rad), math.sin(rad)
    corners = [(-half_w, -half_h), (half_w, -half_h), (half_w, half_h), (-half_w, half_h)]
    return [(cx + dx * ca - dy * sa, cy + dx * sa + dy * ca) for dx, dy in corners]


def ellipse_poly(cx, cy, rx, ry, steps=48):
    return [(cx + math.cos(2 * math.pi * i / steps) * rx,
             cy + math.sin(2 * math.pi * i / steps) * ry) for i in range(steps)]


def build_centro_mask():
    im = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(im)

    # 1. Main Plaza & West/East Cobblestone Roads (carefully tracing every outer curb, wall & cliff!)
    main_plaza = [
        # West exit road top edge -> around NW stone wall & corner pillar -> porch approach
        (0, 152), (95, 200), (122, 224),
        # NW house stone retaining wall curb & terracotta pot (keep player south of wall+pot!)
        (165, 246), (222, 272), (268, 272),
        # In front of NW wooden bench (274..360, 222..258) -> porch approach
        (274, 265), (362, 256), (392, 244),
        # Right of bench/bush up onto NW porch steps
        (392, 208), (428, 204),
        # Around NW lamp flowerbed curb
        (438, 210), (498, 216), (540, 206), (546, 170),
        # Base of North stairs
        (556, 165), (650, 165),
        # Around NE lamp & NE cherry flowerbed curb + fence (strictly south of wall & fence!)
        (658, 198), (720, 220), (758, 232), (838, 256), (900, 266), (960, 248),
        # Along NE east house stone curb & fence to east portal
        (1060, 220), (1105, 196), (1200, 164),
        # East portal opening
        (1200, 244),
        # Along SE wooden fence, bush, bench & SE lamp flowerbed (keep player strictly NW of fence!)
        (1105, 276), (1005, 314), (945, 338), (906, 362),
        (868, 388), (832, 430), (805, 466), (748, 504),
        # Top of South stairs
        (704, 504), (552, 504),
        # Along SW cliff, rocks, wooden fence & west green fence (fixes Screenshot 2: 161942!)
        (495, 500), (442, 470), (382, 444), (345, 426),
        (298, 405), (225, 368), (150, 358), (118, 305), (90, 272), (0, 224)
    ]
    d.polygon(main_plaza, fill=255)

    # NW House porch steps & door corridor (connects cleanly around little bush via x=390..426)
    d.polygon([(318, 194), (425, 194), (425, 246), (388, 246), (388, 222), (318, 222)], fill=255)

    # North Staircase treads (between left & right stone balustrades)
    d.polygon([(558, 0), (648, 0), (648, 175), (558, 175)], fill=255)

    # South Staircase treads (strictly between left & right stone balustrades - fixes Screenshot 3: 161949!)
    d.polygon([(556, 498), (700, 498), (728, 600), (748, 675), (596, 675), (584, 615), (558, 535)], fill=255)

    # --- SOLID BLOCKS OVER MAIN PLAZA ---
    # NW house stone wall / flowerbed / terracotta pot (fixes Screenshot 1: 161931!)
    d.polygon([(115, 175), (274, 220), (274, 270), (222, 270), (115, 218)], fill=0)
    # NW house bench & small flower bush right of bench
    d.rectangle([274, 222, 360, 258], fill=0)
    d.rectangle([360, 222, 388, 244], fill=0)

    # NW lamp flowerbed + post
    d.polygon([(425, 120), (538, 120), (538, 208), (442, 208), (425, 185)], fill=0)
    d.ellipse([486, 184, 514, 212], fill=0)

    # NE cherry flowerbed + NE lamp + bench + fence
    d.polygon([(666, 120), (960, 120), (960, 246), (900, 265), (835, 254), (750, 228), (666, 205)], fill=0)
    d.rectangle([758, 196, 842, 242], fill=0)
    d.ellipse([731, 180, 759, 208], fill=0)

    # Central Fountain Island (outer stone ring + 4 corner pillars)
    d.polygon(ellipse_poly(598, 314, 136, 76), fill=0)
    # West Lamp Post stone pedestal
    d.ellipse([434, 336, 462, 362], fill=0)

    # SE Bench + Lamp Post + Flowerbed + Fence protection
    d.rectangle([865, 390, 965, 455], fill=0)
    d.ellipse([828, 435, 860, 468], fill=0)

    return im


def build_jardins_mask():
    im = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(im)

    # 1. West Cobblestone Plaza & Paths around Large Oval Flowerbed
    west_plaza = [
        # West portal -> south edge of NW cabin flowerbed & fence (fixes Screenshot 4: 162009!)
        (0, 146), (115, 198), (175, 234), (225, 224), (262, 202),
        # Bottom of NW cabin diagonal stairs -> cobblestone plaza below NW bench
        (344, 174), (398, 195), (475, 202),
        # North gazebo approach
        (485, 142), (578, 142), (590, 220),
        # Approach to West Bridge entrance
        (595, 234), (595, 278),
        # West of central-south raised flowerbed & stream bank
        (555, 294), (522, 305), (522, 438),
        # Top of South stairs -> along SW cliff/bushes edge back to West portal
        (536, 502), (485, 472), (435, 446), (320, 412), (175, 355), (0, 272)
    ]
    d.polygon(west_plaza, fill=255)

    # NW Cabin diagonal staircase & porch (strictly only the stairs & porch, connected seamlessly at base!)
    d.polygon([(242, 124), (322, 124), (344, 178), (262, 206), (235, 158)], fill=255)

    # North Gazebo stone patio (table in middle blocked below)
    d.polygon([(442, 108), (582, 108), (582, 168), (442, 168)], fill=255)

    # South plaza transition strictly above South Stairs treads
    d.polygon([(495, 442), (624, 442), (624, 510), (536, 510)], fill=255)

    # South Staircase treads (strictly inside left & right stone balustrades - fixes Screenshots 5 & 6: 162040/162045!)
    d.polygon([(536, 502), (612, 502), (658, 600), (662, 646), (580, 646), (568, 600), (536, 528)], fill=255)
    # Small sandy beach landing at bottom of South Stairs
    d.polygon([(565, 640), (705, 640), (725, 675), (525, 675)], fill=255)

    # 2. Curved Arched Stone Bridge Deck (fixes Screenshots 8, 9, 10: 162136, 162139, 162143!)
    # Exact deck curve from north parapet inner edge to south parapet inner edge (~33-35px tall across span)
    bridge_top = quad_curve((586, 234), (688, 212), (788, 226), steps=32)
    bridge_bot = quad_curve((788, 265), (688, 248), (586, 273), steps=32)
    d.polygon(bridge_top + bridge_bot, fill=255)

    # 3. East Garden Clearing, Stepping Stones, and NE Forest Trail
    east_clearing = [
        (765, 230), (775, 160), (855, 138), (970, 142),
        (1055, 158), (1085, 225), (1055, 255),
        (915, 262), (885, 275), (805, 275), (765, 268)
    ]
    d.polygon(east_clearing, fill=255)

    # Stepping stone path around East Lamp flowerbed (fixes Screenshot 7: 162105!)
    stepping_path = [
        (882, 250), (924, 250), (928, 355),
        (882, 385), (842, 412), (805, 438),
        (775, 438), (780, 398), (835, 368), (880, 345)
    ]
    d.polygon(stepping_path, fill=255)

    # NE Winding Dirt Trail up into the forest (between fences & bushes)
    ne_trail = [
        (1000, 220), (1065, 168), (1105, 100), (1118, 15),
        (1168, 15), (1158, 125), (1115, 205), (1048, 256)
    ]
    d.polygon(ne_trail, fill=255)

    # --- SOLID OBSTACLES CARVED OUT ---
    # West lamp post pedestal
    d.ellipse([48, 280, 76, 308], fill=0)

    # Large SW Oval Flowerbed + Bench + Lamp Post (exact brick curb)
    d.polygon(ellipse_poly(350, 292, 134, 68), fill=0)

    # Gazebo central table & benches + NW wooden bench
    d.rectangle([450, 108, 506, 145], fill=0)
    d.rectangle([402, 165, 458, 194], fill=0)

    # Central Lamp Post Circular Stone Flowerbed (ellipse)
    d.polygon(ellipse_poly(550, 239, 33, 17), fill=0)

    # Central-South Raised Stone Wall + Berry Bushes West of Stream
    d.polygon([(520, 296), (636, 308), (636, 454), (522, 436)], fill=0)

    # Stream, Waterfall & Rocky Banks (follows bridge curves cleanly so deck stays unpinched while 100% blocking parapets & water!)
    north_stream_lip = quad_curve((602, 228), (688, 209), (715, 214), steps=24)
    d.polygon([(595, 150), (715, 150)] + list(reversed(north_stream_lip)), fill=0)
    south_stream_lip = quad_curve((604, 276), (688, 252), (784, 267), steps=24)
    d.polygon(south_stream_lip + [
        (808, 292), (848, 330), (850, 360), (812, 392), (768, 445), (630, 450)
    ], fill=0)

    # East Wooden Bench & East Lamp Flowerbed
    d.rectangle([800, 285, 860, 324], fill=0)
    d.polygon(ellipse_poly(863, 325, 21, 19), fill=0)

    # Raised Square Garden Bed with Fence & SE Bush Arch
    d.rectangle([918, 265, 1085, 362], fill=0)
    d.polygon([(872, 382), (925, 358), (1200, 348), (1200, 480), (835, 480)], fill=0)

    # Cherry Tree Trunk + Hollow Great Tree Trunk + Forest Stump Rocks
    d.ellipse([746, 164, 790, 208], fill=0)
    d.polygon(ellipse_poly(958, 118, 54, 30), fill=0)
    d.ellipse([844, 164, 890, 198], fill=0)
    d.ellipse([958, 184, 998, 224], fill=0)
    d.ellipse([1025, 120, 1068, 160], fill=0)

    # East edge bushes (below NE trail opening!)
    d.polygon([(1088, 222), (1135, 185), (1200, 175), (1200, 360), (1088, 360)], fill=0)

    # South Stairs Left/Right Stone Balustrades & Lamp Protection
    d.polygon([(500, 495), (538, 495), (582, 648), (540, 648)], fill=0)
    d.polygon([(612, 495), (668, 495), (710, 648), (660, 648)], fill=0)
    d.ellipse([682, 502, 712, 534], fill=0)

    return im


def analyze_connectivity(walk_bool, edt, r=11, step=2):
    """Verify single connected walkable component for circle radius r."""
    ok = (edt >= r)
    ys = range(0, H, step)
    xs = range(0, W, step)
    gh = len(ys)
    gw = len(xs)
    grid = np.zeros((gh, gw), dtype=np.uint8)
    for gy, y in enumerate(ys):
        for gx, x in enumerate(xs):
            if ok[y, x]:
                grid[gy, gx] = 1
    visited = np.zeros_like(grid)
    comps = []
    for gy in range(gh):
        for gx in range(gw):
            if grid[gy, gx] and not visited[gy, gx]:
                stack = [(gy, gx)]
                visited[gy, gx] = 1
                cnt = 0
                sample = (gx * step, gy * step)
                while stack:
                    cy, cx = stack.pop()
                    cnt += 1
                    for dy, dx in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < gh and 0 <= nx < gw and grid[ny, nx] and not visited[ny, nx]:
                            visited[ny, nx] = 1
                            stack.append((ny, nx))
                comps.append({"cells": cnt, "sample": sample})
    comps.sort(key=lambda c: -c["cells"])
    return comps


def render_audit_overlay(art_path, walk_bool, edt, out_path, radius=11):
    art = Image.open(art_path).convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)
    overlay = np.zeros((H, W, 4), dtype=np.uint8)
    # Blocked = translucent red; Walkable border (< radius) = orange; Walkable center (>= radius) = green
    blocked = ~walk_bool
    margin = walk_bool & (edt < radius)
    safe = edt >= radius
    overlay[blocked] = [239, 68, 68, 95]
    overlay[margin] = [250, 204, 21, 110]
    overlay[safe] = [34, 197, 94, 70]
    comp = Image.alpha_composite(art, Image.fromarray(overlay, "RGBA"))
    comp.save(out_path)


def main():
    specs = [
        ("centro", "assets/story/pallet/anime3q/01_centro_residencias.png", build_centro_mask),
        ("jardins", "assets/story/pallet/anime3q/02_jardins_bosque.png", build_jardins_mask),
    ]
    summary = {}
    for name, art_path, builder in specs:
        mask_im = builder()
        mask_arr = (np.array(mask_im) >= 128)
        edt = compute_edt_2d(mask_arr)
        sdf_u8 = np.clip(np.round(edt * 4.0), 0, 255).astype(np.uint8)

        mask_path = os.path.join(OUT_DIR, f"{name}_walkmask.png")
        sdf_path = os.path.join(OUT_DIR, f"{name}_sdf.png")
        mask_im.save(mask_path, optimize=True)
        Image.fromarray(sdf_u8, "L").save(sdf_path, optimize=True)

        comps_11 = analyze_connectivity(mask_arr, edt, r=11, step=3)
        comps_9 = analyze_connectivity(mask_arr, edt, r=9, step=3)
        render_audit_overlay(art_path, mask_arr, edt, f"/tmp/audit_{name}_sdf.png", radius=11)

        summary[name] = {
            "mask_bytes": os.path.getsize(mask_path),
            "sdf_bytes": os.path.getsize(sdf_path),
            "safe_pixels_r11": int(np.sum(edt >= 11)),
            "components_r11": comps_11,
            "components_r9": comps_9,
        }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
