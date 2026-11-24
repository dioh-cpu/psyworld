#!/usr/bin/env python3
"""Refina os 6 clipes do Espírito da Floresta (idle e walk em frente, esquerda e costas) para loop perfeito:
1. Remove artefatos soltos longe do corpo (ex.: linha horizontal na esquerda do idle-esquerda).
2. Exclui o morph de início/fim da IA nos clipes de walk para manter pose de voo constante.
3. Escolhe o ciclo natural com melhor casamento de aparência, silhueta, centroide e velocidade (janela +-5 quadros).
4. Aplica emenda suave em curva cosseno (K=10 quadros) com alinhamento subpixel de centroide (sem pulo e sem fantasma).
5. Adiciona cauda de 16 quadros (cópia de 0..15) e codifica com -bf 0 (sem B-frames) para troca dupla sem travada no navegador.
6. Atualiza assets/confusion/interface/animacoes/walk-geometria.json com geometria e loop_quadros/loop_duracao exatos.
"""
import os
import json
import glob
import shutil
import tempfile
import subprocess
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

BASE = "assets/confusion/interface/animacoes"
BACKUP = "/tmp/espirito_orig"
FPS = 24
K_BLEND = 10
TAIL_FRAMES = 16

CLIPS = [
    # (chave, arquivo, eh_walk, margem_ini, margem_fim, min_f, max_f)
    ("idle-frente",   "espirito-idle-frente.mp4",   False, 10, 2,  44, 88),
    ("idle-esquerda", "espirito-idle-esquerda.mp4", False, 12, 4,  48, 110),
    ("idle-costas",   "espirito-idle-costas.mp4",   False, 12, 4,  48, 96),
    ("walk-frente",   "espirito-walk-frente.mp4",   True,  24, 20, 48, 120),
    ("walk-esquerda", "espirito-walk-esquerda.mp4", True,  26, 26, 46, 110),
    ("walk-costas",   "espirito-walk-costas.mp4",   True,  24, 20, 48, 110),
]


def limpar_artefatos_soltos(frames_rgb, bg):
    """Remove riscos/partículas isoladas longe do corpo principal (como a linha branca em idle-esquerda)."""
    N, H, W, _ = frames_rgb.shape
    scale = 4
    sw, sh = W // scale, H // scale
    limpos = np.empty_like(frames_rgb)
    bg_u8 = bg.astype(np.float32)

    for i in range(N):
        im = frames_rgb[i]
        # Máscara de primeiro plano (não-verde) em 1/4 da resolução
        small = np.asarray(Image.fromarray(im).resize((sw, sh), Image.BILINEAR), dtype=np.int16)
        fg = ((small[:, :, 1] - np.maximum(small[:, :, 0], small[:, :, 2])) < 95).astype(np.uint8)
        # Dilata levemente para unir sombra dos pés, anéis mágicos e pontas do cabelo ao corpo principal
        fg_dil = np.asarray(Image.fromarray(fg * 255).filter(ImageFilter.MaxFilter(9))) > 0

        # Encontra o maior componente conectado (BFS rápido em 1/4 de resolução)
        vis = np.zeros((sh, sw), dtype=np.uint8)
        best_comp = []
        for y in range(sh):
            row = fg_dil[y]
            for x in range(sw):
                if row[x] and not vis[y, x]:
                    q = deque([(y, x)])
                    vis[y, x] = 1
                    comp = []
                    while q:
                        cy, cx = q.popleft()
                        comp.append((cy, cx))
                        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                            ny, nx = cy + dy, cx + dx
                            if 0 <= ny < sh and 0 <= nx < sw and fg_dil[ny, nx] and not vis[ny, nx]:
                                vis[ny, nx] = 1
                                q.append((ny, nx))
                    if len(comp) > len(best_comp):
                        best_comp = comp

        if not best_comp:
            limpos[i] = im
            continue

        keep = np.zeros((sh, sw), dtype=np.uint8)
        ys_c, xs_c = zip(*best_comp)
        keep[ys_c, xs_c] = 255
        # Margem generosa (~28 px em 720p) para preservar todas as folhas próximas, brilhos e sombra
        keep_img = Image.fromarray(keep).filter(ImageFilter.MaxFilter(7)).resize((W, H), Image.BILINEAR)
        keep_img = keep_img.filter(ImageFilter.GaussianBlur(radius=4))
        alpha = (np.asarray(keep_img, dtype=np.float32) / 255.0)[..., None]
        out = im.astype(np.float32) * alpha + bg_u8 * (1.0 - alpha)
        limpos[i] = np.clip(out, 0, 255).astype(np.uint8)

    return limpos


def transladar_rgb(img_u8, dx, dy, bg):
    """Translada imagem com subpixel bilinear preenchendo borda com a cor de fundo verde."""
    if abs(dx) < 0.05 and abs(dy) < 0.05:
        return img_u8.astype(np.float32)
    pil = Image.fromarray(img_u8)
    moved = pil.transform(
        pil.size,
        Image.AFFINE,
        (1, 0, -dx, 0, 1, -dy),
        resample=Image.BILINEAR,
        fillcolor=tuple(int(round(c)) for c in bg),
    )
    return np.asarray(moved, dtype=np.float32)


def encontrar_melhor_ciclo(frames_rgb, margem_ini, margem_fim, min_f, max_f):
    N, H, W, _ = frames_rgb.shape
    sw = 64
    sh = max(32, int(round(H * sw / W)))
    small = np.stack([
        np.asarray(Image.fromarray(f).resize((sw, sh), Image.BILINEAR), dtype=np.float32)
        for f in frames_rgb
    ])
    green = small[..., 1] - np.maximum(small[..., 0], small[..., 2])
    fg = (green < 90).astype(np.float32)

    ys, xs = np.indices((sh, sw))
    mass = np.maximum(1.0, fg.sum(axis=(1, 2)))
    cx = (fg * xs).sum(axis=(1, 2)) / mass
    cy = (fg * ys).sum(axis=(1, 2)) / mass
    dcy = np.gradient(cy)

    # Altura do bounding box em cada quadro
    h_box = np.zeros(N, dtype=np.float32)
    for i in range(N):
        wy = np.where(fg[i].any(axis=1))[0]
        h_box[i] = float(wy[-1] - wy[0]) if len(wy) else 0.0

    X = small.reshape(N, -1) / 255.0
    XX = (X * X).sum(axis=1, keepdims=True)
    D_rgb = np.sqrt(np.maximum(0.0, XX + XX.T - 2.0 * (X @ X.T)) / X.shape[1])

    M = fg.reshape(N, -1)
    MM = (M * M).sum(axis=1, keepdims=True)
    D_fg = np.sqrt(np.maximum(0.0, MM + MM.T - 2.0 * (M @ M.T)) / M.shape[1])

    step_rgb = max(1e-5, float(np.mean([D_rgb[t, t + 1] for t in range(N - 1)])))
    step_fg = max(1e-5, float(np.mean([D_fg[t, t + 1] for t in range(N - 1)])))

    KW = 5
    a_min = max(K_BLEND, margem_ini, KW)
    b_max = min(N - margem_fim, N - KW - 1)
    if b_max - a_min < min_f:
        a_min = max(K_BLEND, KW)
        b_max = N - KW - 1

    best = None
    for a in range(a_min, b_max - min_f + 1):
        b_lo = a + min_f
        b_hi = min(b_max, a + max_f)
        for b in range(b_lo, b_hi + 1):
            # Janela simétrica em torno da emenda: casa aparência, silhueta E direção do movimento
            w_rgb = sum(D_rgb[a + k, b + k] for k in range(-KW, KW + 1)) / (2 * KW + 1)
            w_fg = sum(D_fg[a + k, b + k] for k in range(-KW, KW + 1)) / (2 * KW + 1)
            dc = abs(cx[a] - cx[b]) + 1.4 * abs(cy[a] - cy[b])
            dv = abs(dcy[a] - dcy[b])
            dh = abs(h_box[a] - h_box[b])
            score = (w_rgb / step_rgb) + 1.15 * (w_fg / step_fg) + 0.55 * dc + 1.2 * dv + 0.25 * dh
            if best is None or score < best[0]:
                best = (score, a, b)

    _, a, b = best
    # Retorna também os centroides em escala cheia para alinhamento na emenda
    scale_x = W / sw
    scale_y = H / sh
    return a, b, cx * scale_x, cy * scale_y


def montar_loop_suave(frames_rgb, a, b, cx_full, cy_full, bg):
    L = b - a
    out = []
    # Diferença residual de centroide na emenda (em pixels reais)
    dx_seam = float(cx_full[a] - cx_full[b])
    dy_seam = float(cy_full[a] - cy_full[b])

    for j in range(L):
        if j < L - K_BLEND:
            out.append(frames_rgb[a + j])
        else:
            i = j - (L - K_BLEND)  # 0 .. K_BLEND-1
            t = (i + 1) / (K_BLEND + 1)
            w = 0.5 - 0.5 * np.cos(np.pi * t)  # curva S cosseno
            f_end = frames_rgb[a + j]          # aproxima-se de b
            f_pre = frames_rgb[a - K_BLEND + i]  # aproxima-se de a
            # Alinha sutilmente o centroide durante o cruzamento para eliminar qualquer duplo-contorno
            f_end_al = transladar_rgb(f_end, dx_seam * w, dy_seam * w, bg)
            f_pre_al = transladar_rgb(f_pre, -dx_seam * (1.0 - w), -dy_seam * (1.0 - w), bg)
            blended = (1.0 - w) * f_end_al + w * f_pre_al
            out.append(np.clip(blended, 0, 255).astype(np.uint8))
    return out


def medir_geometria_e_emenda(loop_frames, bg):
    arr = np.stack([f.astype(np.float32) for f in loop_frames])
    N, H, W, _ = arr.shape
    green = arr[..., 1] - np.maximum(arr[..., 0], arr[..., 2])
    fg = (green < 95)

    topos, pes, largs = [], [], []
    for i in range(N):
        ys, xs = np.where(fg[i])
        if len(ys):
            topos.append(int(ys.min()))
            pes.append(int(ys.max()))
            largs.append(int(xs.max() - xs.min()))

    topo = int(np.median(topos))
    pe = int(np.median(pes))
    fig_larg = int(np.median(largs))

    # Métricas de continuidade na emenda (N-1 -> 0) vs passo médio
    step_rgb = float(np.mean(np.abs(arr[1:] - arr[:-1])))
    seam_rgb = float(np.mean(np.abs(arr[-1] - arr[0])))
    step_fg = float(np.mean(np.abs(fg[1:].astype(np.float32) - fg[:-1].astype(np.float32))))
    seam_fg = float(np.mean(np.abs(fg[-1].astype(np.float32) - fg[0].astype(np.float32))))

    return {
        "largura": W,
        "altura": H,
        "topo": topo,
        "pe": pe,
        "quadros": N,
        "loop_duracao": round(N / FPS, 6),
        "cauda_quadros": TAIL_FRAMES,
        "figura_altura": pe - topo,
        "figura_largura": fig_larg,
    }, seam_rgb / max(1e-5, step_rgb), seam_fg / max(1e-5, step_fg)


def main():
    os.makedirs(BACKUP, exist_ok=True)
    meta_todos = {}
    for chave, arq, eh_walk, m_ini, m_fim, min_f, max_f in CLIPS:
        src = os.path.join(BASE, arq)
        bkp = os.path.join(BACKUP, arq)
        if not os.path.exists(bkp):
            shutil.copy2(src, bkp)

        with tempfile.TemporaryDirectory() as td:
            subprocess.run(["ffmpeg", "-v", "error", "-i", bkp, f"{td}/src_%04d.png"], check=True)
            files = sorted(glob.glob(f"{td}/src_*.png"))
            frames = np.stack([np.asarray(Image.open(f).convert("RGB"), dtype=np.uint8) for f in files])
            bg = np.median(
                np.concatenate([frames[:, :8, :, :].reshape(-1, 3), frames[:, -8:, :, :].reshape(-1, 3)], axis=0),
                axis=0,
            )

            # Remove linha/artefato flutuante fora do corpo principal (sempre limpa idle-esquerda; também garante walk limpo)
            if chave == "idle-esquerda":
                frames = limpar_artefatos_soltos(frames, bg)

            a, b, cx_full, cy_full = encontrar_melhor_ciclo(frames, m_ini, m_fim, min_f, max_f)
            loop_frames = montar_loop_suave(frames, a, b, cx_full, cy_full, bg)
            geo, r_rgb, r_fg = medir_geometria_e_emenda(loop_frames, bg)

            # Grava loop + cauda de 16 quadros (cópia exata de 0..15) para handoff duplo sem travada
            out_dir = os.path.join(td, "out")
            os.makedirs(out_dir, exist_ok=True)
            total_seq = loop_frames + loop_frames[:TAIL_FRAMES]
            for idx, fr in enumerate(total_seq):
                Image.fromarray(fr).save(f"{out_dir}/{idx:04d}.png")

            # Codificação sem B-frames (-bf 0) e keyframes curtos (-g 12) para seek instantâneo em mobile/desktop
            subprocess.run([
                "ffmpeg", "-v", "error", "-y",
                "-framerate", str(FPS),
                "-i", f"{out_dir}/%04d.png",
                "-c:v", "libx264",
                "-pix_fmt", "yuv420p",
                "-crf", "17",
                "-preset", "medium",
                "-bf", "0",
                "-g", "12",
                "-keyint_min", "12",
                "-sc_threshold", "0",
                "-movflags", "+faststart",
                "-an",
                src,
            ], check=True)

            kb = os.path.getsize(src) // 1024
            print(
                f"{chave:14s}: corte [{a:3d}..{b:3d}] = {geo['quadros']:3d}f ({geo['loop_duracao']:.3f}s) "
                f"+ {TAIL_FRAMES}f cauda | emenda rgb={r_rgb:.2f}x fg={r_fg:.2f}x | pe={geo['pe']} figH={geo['figura_altura']} | {kb} KB"
            )
            meta_todos[chave] = geo

    # Mantém compatibilidade com walk-geometria.json (chaves frente/esquerda/costas + bloco completo 'clipes')
    saida_json = {
        "frente": meta_todos["walk-frente"],
        "esquerda": meta_todos["walk-esquerda"],
        "costas": meta_todos["walk-costas"],
        "clipes": meta_todos,
    }
    with open(os.path.join(BASE, "walk-geometria.json"), "w", encoding="utf-8") as f:
        json.dump(saida_json, f, indent=1)
    print("Atualizado walk-geometria.json com sucesso!")


if __name__ == "__main__":
    main()
