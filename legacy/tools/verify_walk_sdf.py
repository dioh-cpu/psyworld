#!/usr/bin/env python3
"""Verifica a correspondencia walkmask <-> SDF exportados pelo editor PSYWORLD.

Uso: python3 tools/verify_walk_sdf.py <area> <walkmask.png> <sdf.png>
Sai com 0 se a exportacao e valida, 1 caso contrario.

Regras (espaco logico 1200x675):
  - dimensoes exatas 1200x675;
  - walkmask binaria: caminhavel = R >= 128 (entrega 0 ou 255);
  - SDF = round(EDT * 4) clipado em 0..255, EDT calculado a partir da walkmask
    com o mesmo algoritmo do build (compute_edt_2d de build_walkmasks_v5.py);
  - correspondencia pixel a pixel (zero diferencas);
  - nome do arquivo da area igual ao <area> informado.
"""
import importlib.util, os, sys
import numpy as np
from PIL import Image

W, H = 1200, 675
HERE = os.path.dirname(os.path.abspath(__file__))


def load_edt():
    cand = [
        os.path.join(HERE, "build_walkmasks_v5.py"),
        os.path.join(HERE, "tools", "build_walkmasks_v5.py"),
    ]
    for p in cand:
        if os.path.exists(p):
            spec = importlib.util.spec_from_file_location("v5", p)
            m = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(m)
            return m.compute_edt_2d
    raise SystemExit("build_walkmasks_v5.py nao encontrado em tools/")


def channel_r(path):
    im = Image.open(path)
    if im.size != (W, H):
        raise ValueError(f"{os.path.basename(path)}: tamanho {im.size}, esperado {(W, H)}")
    return np.asarray(im.convert("RGBA"))[..., 0]


def report(errs):
    if errs:
        print("FALHA:")
        for e in errs:
            print("  -", e)
        return 1
    print("OK: walkmask e SDF correspondem exatamente.")
    return 0


def main():
    if len(sys.argv) != 4:
        print(__doc__)
        return 2
    area, wp, sp = sys.argv[1:]
    errs = []
    base_w = os.path.basename(wp)
    base_s = os.path.basename(sp)
    for name in (base_w, base_s):
        if not name.startswith(area + "_"):
            errs.append(f"nome '{name}' nao identifica a area '{area}'")
    try:
        w = channel_r(wp)
        s = channel_r(sp).astype(int)
    except ValueError as e:
        errs.append(str(e))
        return report(errs)
    uniq = np.unique(w)
    if not set(uniq.tolist()) <= {0, 255}:
        errs.append(f"walkmask nao binaria: valores {uniq[:5].tolist()}...")
    walk = w >= 128
    edt = load_edt()(walk)
    ref = np.clip(np.round(edt * 4.0), 0, 255).astype(int)
    diff = int((ref != s).sum())
    if diff:
        errs.append(f"{diff} pixels divergem entre walkmask e SDF (max |diff|={int(np.abs(ref-s).max())})")
    print(f"area={area} caminhaveis={int(walk.sum())} bloqueados={int((~walk).sum())} pixels_divergentes={diff}")
    return report(errs)


if __name__ == "__main__":
    sys.exit(main())
