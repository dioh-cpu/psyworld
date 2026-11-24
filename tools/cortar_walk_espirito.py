#!/usr/bin/env python3
"""Corta o vídeo de walk (3 colunas: frente, esquerda, costas) em 3 clipes em loop, limpando partículas soltas.
Uso: cortar_walk_espirito.py VIDEO.mp4 PASTA_TMP PASTA_SAIDA
Escreve espirito-walk-<direcao>.mp4 e walk-geometria.json (altura/pe de cada clipe para o jogo)."""
import sys, os, json, subprocess, glob
import cv2
import numpy as np

video, tmp, saida = sys.argv[1:4]
os.makedirs(tmp, exist_ok=True)
for f in glob.glob(f'{tmp}/src_*.png'):
    os.remove(f)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', video, f'{tmp}/src_%03d.png'], check=True)
fs = sorted(glob.glob(f'{tmp}/src_*.png'))
N = len(fs)
primeiro = cv2.imread(fs[0]); H, W = primeiro.shape[:2]
CW = W // 3
LIMPAR = int(70 * H / 1080)          # partículas a mais de ~70 px (em 1080p) do corpo somem
CROP_W, CROP_H = int(560 * H / 1080), int(720 * H / 1080)
bg = np.median(np.concatenate([primeiro[:10].reshape(-1, 3), primeiro[-10:].reshape(-1, 3)]), 0)
nomes = ['frente', 'esquerda', 'costas']


def limpar(col):
    a = col.astype(int)
    fg = ((a[:, :, 1] - np.maximum(a[:, :, 0], a[:, :, 2])) < 110).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(cv2.dilate(fg, np.ones((15, 15))))
    if n < 2:
        return col, None
    maior = 1 + int(np.argmax(st[1:, 4]))
    perto = cv2.dilate((lab == maior).astype(np.uint8), np.ones((2 * LIMPAR + 1, 2 * LIMPAR + 1)))
    z = cv2.GaussianBlur(perto.astype(np.float32), (0, 0), 10)[..., None]
    out = col.astype(float) * z + bg * (1 - z)
    ys, xs = np.where((fg & perto) > 0)
    return out.astype(np.uint8), (xs.min(), xs.max(), ys.min(), ys.max())


geo = {}
for ci, nome in enumerate(nomes):
    cols, boxes = [], []
    for f in fs:
        im = cv2.imread(f)[:, ci * CW:(ci + 1) * CW]
        c, b = limpar(im)
        cols.append(c); boxes.append(b if b else (0, 0, 0, 0))
    bx = np.array(boxes)
    cx = int(np.median((bx[:, 0] + bx[:, 1]) / 2)); topo = int(np.median(bx[:, 2])); pe = int(np.median(bx[:, 3]))
    y0 = int((topo + pe) / 2 - CROP_H / 2); x0 = int(cx - CROP_W / 2)
    # recorte fixo; fora da coluna/quadro = fundo
    clip = []
    for c in cols:
        canvas = np.zeros((CROP_H, CROP_W, 3), np.uint8); canvas[:] = bg.astype(np.uint8)
        sx0, sy0 = max(0, x0), max(0, y0); sx1, sy1 = min(CW, x0 + CROP_W), min(H, y0 + CROP_H)
        canvas[sy0 - y0:sy1 - y0, sx0 - x0:sx1 - x0] = c[sy0:sy1, sx0:sx1]
        clip.append(canvas)
    sm = [cv2.resize(cv2.cvtColor(c, cv2.COLOR_BGR2GRAY), (96, 128)).astype(float) for c in clip]
    K, MIN = 10, int(4 * 24)
    best = None
    for a in range(K, N // 2):
        for b in range(a + MIN, N - 1):
            e = np.mean((sm[a] - sm[b]) ** 2) + np.mean(((sm[a + 1] - sm[a]) - (sm[b + 1] - sm[b])) ** 2)
            if best is None or e < best[0]:
                best = (e, a, b)
    e, a, b = best; L = b - a
    d = f'{tmp}/loop-{nome}'; os.makedirs(d, exist_ok=True)
    for f in glob.glob(f'{d}/*.png'):
        os.remove(f)
    for j in range(L):
        fr = clip[a + j].astype(float)
        if j >= L - K:
            w = (j - (L - K) + 1) / (K + 1)
            fr = (1 - w) * clip[a + j] + w * clip[a + j - L]
        cv2.imwrite(f'{d}/{j:03d}.png', fr.astype(np.uint8))
    arq = f'{saida}/espirito-walk-{nome}.mp4'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '24', '-i', f'{d}/%03d.png', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
                    '-crf', '14', '-preset', 'slow', '-g', '24', '-movflags', '+faststart', '-an', arq], check=True)
    g = [cv2.cvtColor(cv2.imread(f'{d}/{j:03d}.png'), cv2.COLOR_BGR2GRAY).astype(float) for j in range(L)]
    dif = [np.mean(np.abs(g[j] - g[j + 1])) for j in range(L - 1)]
    emenda = np.mean(np.abs(g[-1] - g[0]))
    geo[nome] = {'largura': CROP_W, 'altura': CROP_H, 'topo': topo - y0, 'pe': pe - y0, 'quadros': L,
                 'figura_altura': pe - topo, 'figura_largura': int(np.median(bx[:, 1] - bx[:, 0]))}
    print(f'{nome}: loop {a}->{b} ({L / 24:.1f}s) emenda {emenda:.2f} vs quadro a quadro {np.mean(dif):.2f}; figura {pe - topo}px de altura; {os.path.getsize(arq) // 1024} KB')
json.dump(geo, open(f'{saida}/walk-geometria.json', 'w'), indent=1)
