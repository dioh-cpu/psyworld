#!/usr/bin/env python3
"""
Gera versões otimizadas 1280px (mobile) para os fundos 2560x1440 entregues em
assets/confusion/interface/telas-v2/*.webp, salvando em telas-v2/mobile/<nome>.webp.

Uso:
  python3 tools/otimizar_telas_v2.py
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = REPO_ROOT / "assets" / "confusion" / "interface" / "telas-v2"
DST_DIR = SRC_DIR / "mobile"
MAX_W = 1280
QUALIDADE = 82


def main() -> int:
    if not SRC_DIR.exists():
        print(f"Pasta ainda não criada ({SRC_DIR.relative_to(REPO_ROOT)}): aguardando artes telas-v2/ do GPT.")
        return 0

    DST_DIR.mkdir(parents=True, exist_ok=True)
    arquivos = sorted(p for p in SRC_DIR.iterdir() if p.is_file() and p.suffix.lower() in {".webp", ".png", ".jpg", ".jpeg"})
    if not arquivos:
        print("Nenhuma imagem encontrada em telas-v2/ ainda.")
        return 0

    gerados = 0
    for src in arquivos:
        dst = DST_DIR / f"{src.stem}.webp"
        with Image.open(src) as im:
            w, h = im.size
            if w > MAX_W:
                nh = max(1, round(h * (MAX_W / w)))
                im = im.resize((MAX_W, nh), Image.Resampling.LANCZOS)
            im.save(dst, format="WEBP", quality=QUALIDADE, method=6)
            gerados += 1
            print(f"  OK {src.name} ({w}x{h}) -> mobile/{dst.name} ({im.size[0]}x{im.size[1]}, {dst.stat().st_size // 1024} KB)")

    print(f"Total otimizado: {gerados} arquivo(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
