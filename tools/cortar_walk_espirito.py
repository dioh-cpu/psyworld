#!/usr/bin/env python3
"""Corta o vídeo de walk (3 colunas: frente, esquerda, costas) em 3 clipes em loop, limpando partículas soltas.
Uso: cortar_walk_espirito.py VIDEO.mp4 PASTA_TMP PASTA_SAIDA
Escolhe o ponto de corte sem fade (o vídeo já costuma fechar em loop). Escreve espirito-walk-<direcao>.mp4 e walk-geometria.json (altura/pe de cada clipe para o jogo)."""
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
    # Escolha do corte SEM fade: o salto do último quadro do loop para o primeiro tem que parecer um passo normal do vídeo,
    # na cor e na forma do corpo (a máscara pega o comprimento das pontas do cabelo). Prefere loops longos (>= 6 s).
    gs = np.array([cv2.resize(cv2.cvtColor(c, cv2.COLOR_BGR2GRAY), (160, 206), interpolation=cv2.INTER_AREA) for c in clip]).astype(np.float32).reshape(N, -1)
    ms = np.array([cv2.resize((np.abs(c.astype(int) - bg).sum(2) > 60).astype(np.uint8), (160, 206), interpolation=cv2.INTER_NEAREST) for c in clip]).astype(np.float32).reshape(N, -1)
    Dc = np.array([np.abs(gs - gs[i]).mean(1) for i in range(N)]); Dm = np.array([np.abs(ms - ms[i]).mean(1) for i in range(N)])
    pc = np.mean([Dc[t, t + 1] for t in range(N - 1)]); pm = np.mean([Dm[t, t + 1] for t in range(N - 1)])
    MIN = int(6 * 24)
    best = None
    for a in range(0, N - MIN):
        for b in range(a + MIN, N + 1):
            j = Dc[b - 1, a] / pc + Dm[b - 1, a] / pm
            if b < N:
                j += 0.5 * (Dc[b, a + 1] / pc + Dm[b, a + 1] / pm)
            else:
                j *= 1.5   # sem o quadro seguinte para conferir, pesa igual
            # pequeno bônus para loops mais longos
            j -= 0.002 * (b - a)
            if best is None or j < best[0]:
                best = (j, a, b)
    e, a, b = best; L = b - a
    d = f'{tmp}/loop-{nome}'; os.makedirs(d, exist_ok=True)
    for f in glob.glob(f'{d}/*.png'):
        os.remove(f)
    for j in range(L):
        cv2.imwrite(f'{d}/{j:03d}.png', clip[a + j])
    arq = f'{saida}/espirito-walk-{nome}.mp4'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '24', '-i', f'{d}/%03d.png', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
                    '-crf', '16', '-preset', 'slow', '-g', '24', '-movflags', '+faststart', '-an', arq], check=True)
    g = [cv2.cvtColor(cv2.imread(f'{d}/{j:03d}.png'), cv2.COLOR_BGR2GRAY).astype(float) for j in range(L)]
    dif = [np.mean(np.abs(g[j] - g[j + 1])) for j in range(L - 1)]
    emenda = np.mean(np.abs(g[-1] - g[0]))
    geo[nome] = {'largura': CROP_W, 'altura': CROP_H, 'topo': topo - y0, 'pe': pe - y0, 'quadros': L,
                 'figura_altura': pe - topo, 'figura_largura': int(np.median(bx[:, 1] - bx[:, 0]))}
    print(f'{nome}: loop {a}->{b} ({L / 24:.1f}s) salto na emenda {emenda:.2f} vs passo normal {np.mean(dif):.2f}; figura {pe - topo}px de altura; {os.path.getsize(arq) // 1024} KB')
json.dump(geo, open(f'{saida}/walk-geometria.json', 'w'), indent=1)
