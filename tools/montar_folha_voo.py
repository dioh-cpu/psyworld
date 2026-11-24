#!/usr/bin/env python3
"""Monta a folha 16:9 (1920x1080) do voo do Espírito da Floresta com 3 colunas: frente, esquerda, costas.
Uso: montar_folha_voo.py ORIGEM_3_EMPILHADOS.jpg SAIDA.png [escala]
Recorta cada pose (faixas verticais), tira folhas soltas longe do corpo e centra cada uma na sua coluna de 640 px."""
import sys
import cv2
import numpy as np

src, out = sys.argv[1], sys.argv[2]
S = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
LIMPAR = 70          # folhas soltas a mais de 70 px do corpo somem
im = cv2.imread(src)
h, w = im.shape[:2]
bg = np.median(np.concatenate([im[:15].reshape(-1, 3), im[:, :15].reshape(-1, 3), im[:, -15:].reshape(-1, 3)]), 0)
a = im.astype(int)
fg = ((a[:, :, 1] - np.maximum(a[:, :, 0], a[:, :, 2])) < 110).astype(np.uint8)

# faixas verticais = poses
rows = fg.sum(1) > 2
bandas, ini = [], None
for y, v in enumerate(rows):
    if v and ini is None:
        ini = y
    if not v and ini is not None:
        if bandas and y - bandas[-1][1] < 25 and ini - bandas[-1][1] < 25:
            bandas[-1] = (bandas[-1][0], y)
        else:
            bandas.append((ini, y))
        ini = None
if ini is not None:
    bandas.append((ini, h))
bandas = [b for b in bandas if b[1] - b[0] > 120]
assert len(bandas) == 3, bandas
# cada fatia vai do topo da pose até 70 px abaixo dela (a sombra dela), sem pegar a sombra da vizinha
fatias = [(max(0, b[0] - 5), min(h, b[1] + 70, (bandas[i + 1][0] - 3) if i < 2 else h)) for i, b in enumerate(bandas)]

cells = []
for i, (y0, y1) in enumerate(fatias):
    m = fg[y0:y1].copy()
    n, lab, st, _ = cv2.connectedComponentsWithStats(cv2.dilate(m, np.ones((15, 15))))
    maior = 1 + int(np.argmax(st[1:, 4]))
    perto = cv2.dilate((lab == maior).astype(np.uint8), np.ones((2 * LIMPAR + 1, 2 * LIMPAR + 1)))
    ys, xs = np.where(m & perto)
    x0, x1 = int(xs.min()), int(xs.max())
    c = im[y0:y1].astype(float)
    # fora da zona do corpo: fundo liso; a zona do corpo tem borda suave
    zona = cv2.GaussianBlur(perto.astype(np.float32), (0, 0), 12)[..., None]
    c = c * zona + bg * (1 - zona)
    cx = (x0 + x1) // 2
    X0, X1 = max(0, cx - 360), min(w, cx + 360)
    c = c[:, X0:X1]
    c = cv2.resize(c, None, fx=S, fy=S, interpolation=cv2.INTER_LANCZOS4)
    ch, cw = c.shape[:2]
    cell = np.zeros((1080, 640, 3), float)
    cell[:] = bg
    cy = (ys.min() + ys.max()) // 2
    top = int(540 - cy * S)
    left = 320 - int((cx - X0) * S)
    sx0, sy0, x_0, y_0 = max(0, -left), max(0, -top), max(0, left), max(0, top)
    ww, hh = min(cw - sx0, 640 - x_0), min(ch - sy0, 1080 - y_0)
    cell[y_0:y_0 + hh, x_0:x_0 + ww] = c[sy0:sy0 + hh, sx0:sx0 + ww]
    # a coluna nunca passa de 640: a borda funde com o fundo
    f = np.ones((1080, 640), float)
    for k in range(40):
        v = k / 40
        f[:, k] = np.minimum(f[:, k], v)
        f[:, 639 - k] = np.minimum(f[:, 639 - k], v)
    cell = cell * f[..., None] + bg * (1 - f[..., None])
    cells.append(cell.astype(np.uint8))
    print(f'coluna {i}: corpo {x1 - x0 + 1}px x {ys.max() - ys.min() + 1}px, folga {int((640 - (x1 - x0 + 1) * S) / 2)}px por lado')
cv2.imwrite(out, np.hstack(cells))
