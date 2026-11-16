#!/usr/bin/env python3
"""
Regressao de colisao por coordenada (PSYWORLD Pallet Anime HD 3/4).

Le tools/obstacle_regression.json e valida cada ponto contra o SDF ja gerado
em assets/story/pallet/anime3q/walkmasks/<area>_sdf.png.

Regras (espaco logico 1200x675, R = PLAYER_RADIUS = 11):
  solid            -> dist < 11.0   (o centro do personagem NAO pode estar ali)
  walkable/spawn/portal -> dist >= 13.0  (margem de seguranca sobre o raio)

Decodificacao: o PNG e uint8 = clip(round(edt * 4.0), 0, 255); dist = valor / 4.0
(mesma convencao do JS em core/kanto-anime3q-pilot-v1.js).

Uso:
  python3 tools/obstacle_regression.py            # valida tudo, sai com 1 se houver falha
  python3 tools/obstacle_regression.py --area lab # apenas uma area
"""

import argparse
import json
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DEFAULT_JSON = os.path.join(os.path.dirname(os.path.abspath(__file__)), "obstacle_regression.json")
WALKMASK_DIR = os.path.join(ROOT, "assets/story/pallet/anime3q/walkmasks")

W, H = 1200, 675
R = 11.0
WALK_MIN = 13.0
SDF_SCALE = 4.0
SOLID_TYPES = {"solid"}
WALK_TYPES = {"walkable", "spawn", "portal"}


def load_sdf(area):
    path = os.path.join(WALKMASK_DIR, f"{area}_sdf.png")
    if not os.path.exists(path):
        raise FileNotFoundError(path)
    im = Image.open(path)
    if im.size != (W, H):
        raise ValueError(f"{path} tem {im.size}, esperado {(W, H)}")
    return np.asarray(im.convert("L"), dtype=np.float32) / SDF_SCALE


def check_point(sdf, p):
    x, y, kind = p["x"], p["y"], p["tipo"]
    if not (0 <= x < W and 0 <= y < H):
        return False, None, "fora do espaco logico 1200x675"
    d = float(sdf[int(y), int(x)])
    if kind in SOLID_TYPES:
        ok = d < R
        msg = f"solid deve ter dist < {R}"
    elif kind in WALK_TYPES:
        ok = d >= WALK_MIN
        msg = f"{kind} deve ter dist >= {WALK_MIN}"
    else:
        return False, None, f"tipo desconhecido: {kind}"
    return ok, d, msg


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", default=DEFAULT_JSON)
    ap.add_argument("--area", default=None)
    args = ap.parse_args()

    with open(args.json, encoding="utf-8") as f:
        data = json.load(f)

    failures = 0
    total = 0
    cache = {}
    for entry in data["points"]:
        if args.area and entry["area"] != args.area:
            continue
        total += 1
        area = entry["area"]
        try:
            if area not in cache:
                cache[area] = load_sdf(area)
            ok, d, msg = check_point(cache[area], entry)
        except (FileNotFoundError, ValueError, KeyError) as e:
            ok, d, msg = False, None, f"erro: {e}"
        status = "OK  " if ok else "FAIL"
        dtxt = "-" if d is None else f"{d:6.2f}"
        print(f"[{status}] {area:8s} ({entry.get('x')},{entry.get('y')}) "
              f"{entry.get('tipo'):9s} dist={dtxt}  {entry.get('id', '')}  -- {msg}")
        if not ok:
            failures += 1
            if entry.get("fonte"):
                print(f"         fonte: {entry['fonte']}")

    print(f"\n{total - failures}/{total} pontos OK, {failures} falha(s).")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
