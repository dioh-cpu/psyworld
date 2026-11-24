#!/usr/bin/env python3
"""Corrige a emenda de loop dos 6 clipes do Espírito da Floresta a partir da base limpa (6a1e897):
- Mantém a duração integral de cada clipe (~9,8 s nos walks e 4,2 s / 8,9 s / 5,0 s nos idles), sem cortes curtos nem fade linear.
- Remove a linha horizontal espúria à esquerda em espirito-idle-esquerda.mp4.
- Descarta apenas os 1–2 quadros de parada/overshoot na fronteira (início/fim) e reconstrói 1–2 quadros de passagem por fluxo óptico bidirecional (minterpolate aobmc/bidir), eliminando o recuo de fase na emenda sem fantasma (ghosting).
- Codifica sem B-frames (-bf 0, -g 24, -movflags +faststart) para loop nativo instantâneo em navegadores desktop e mobile.
"""
import os
import json
import glob
import tempfile
import subprocess
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

BASE = "assets/confusion/interface/animacoes"
REF_COMMIT = "6a1e8979a4b6722d5a4b1183372e554aa305fbb5"
FPS = 24

# (chave, arquivo, drop_inicio, drop_fim, quadros_ponte_fluxo_optico)
CLIPS = [
    ("idle-frente",   "espirito-idle-frente.mp4",   1, 1, 1),
    ("idle-esquerda", "espirito-idle-esquerda.mp4", 1, 1, 1),
    ("idle-costas",   "espirito-idle-costas.mp4",   1, 1, 1),
    ("walk-frente",   "espirito-walk-frente.mp4",   2, 2, 2),
    ("walk-esquerda", "espirito-walk-esquerda.mp4", 2, 2, 2),
    ("walk-costas",   "espirito-walk-costas.mp4",   2, 2, 2),
]


def limpar_artefatos_soltos(frames_rgb, bg):
    """Remove artefatos isolados longe do corpo principal (como o risco horizontal em idle-esquerda)."""
    N, H, W, _ = frames_rgb.shape
    scale = 4
    sw, sh = W // scale, H // scale
    limpos = np.empty_like(frames_rgb)
    bg_f = bg.astype(np.float32)

    for i in range(N):
        im = frames_rgb[i]
        small = np.asarray(Image.fromarray(im).resize((sw, sh), Image.BILINEAR), dtype=np.int16)
        fg = ((small[:, :, 1] - np.maximum(small[:, :, 0], small[:, :, 2])) < 95).astype(np.uint8)
        fg_dil = np.asarray(Image.fromarray(fg * 255).filter(ImageFilter.MaxFilter(9))) > 0

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
        keep_img = Image.fromarray(keep).filter(ImageFilter.MaxFilter(7)).resize((W, H), Image.BILINEAR)
        keep_img = keep_img.filter(ImageFilter.GaussianBlur(radius=4))
        alpha = (np.asarray(keep_img, dtype=np.float32) / 255.0)[..., None]
        out = im.astype(np.float32) * alpha + bg_f * (1.0 - alpha)
        limpos[i] = np.clip(out, 0, 255).astype(np.uint8)

    return limpos


def gerar_ponte_fluxo_optico(frames, a, b, n_ins, td):
    """Gera n_ins quadros intermediários por fluxo óptico bidirecional entre frames[b-1] e frames[a]."""
    si = os.path.join(td, "seam_in")
    so = os.path.join(td, "seam_out")
    os.makedirs(si, exist_ok=True)
    os.makedirs(so, exist_ok=True)

    anchors = [b - 3, b - 2, b - 1, a, a + 1, a + 2]
    for idx, fi in enumerate(anchors):
        Image.fromarray(frames[fi]).save(f"{si}/{idx:03d}.png")

    mult = n_ins + 1
    subprocess.run([
        "ffmpeg", "-v", "error", "-y",
        "-framerate", "10",
        "-i", f"{si}/%03d.png",
        "-vf", f"minterpolate=fps={10 * mult}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=none",
        f"{so}/%03d.png",
    ], check=True)

    out_fs = sorted(glob.glob(f"{so}/*.png"))
    return [np.asarray(Image.open(out_fs[2 * mult + k]).convert("RGB"), dtype=np.uint8) for k in range(1, mult)]


def medir_clipe(seq_u8):
    N, H, W, _ = seq_u8.shape
    # Mede continuidade de velocidade no corpo suavizado na emenda vs meio do clipe
    bl = [
        np.asarray(
            Image.fromarray(seq_u8[i]).resize((96, 124), Image.BILINEAR).filter(ImageFilter.GaussianBlur(2)),
            dtype=np.float32,
        )
        for i in range(N)
    ]

    def cos_v(i0, i1, i2):
        v1 = (bl[i1] - bl[i0]).ravel()
        v2 = (bl[i2] - bl[i1]).ravel()
        return float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6))

    c_seam1 = cos_v(N - 2, N - 1, 0)
    c_seam2 = cos_v(N - 1, 0, 1)

    # Centroide horizontal do tronco/cabeça e limites verticais
    sample_idx = range(0, N, max(1, N // 24))
    cxs, topos, pes = [], [], []
    for i in sample_idx:
        a = seq_u8[i].astype(np.int16)
        g = a[:, :, 1] - np.maximum(a[:, :, 0], a[:, :, 2])
        fg_all = g < 90
        ys_all, _ = np.where(fg_all)
        if len(ys_all):
            topos.append(int(ys_all.min()))
            pes.append(int(ys_all.max()))
        solid = (g < 50) & ~((a[:, :, 0] < 40) & (a[:, :, 2] < 40) & (a[:, :, 1] > 50))
        _, ux = np.where(solid[int(H * 0.14):int(H * 0.60), :])
        if len(ux):
            cxs.append(float(np.median(ux)))

    topo = int(np.median(topos))
    pe = int(np.median(pes))
    centro_x = round(float(np.median(cxs)), 1)
    return {
        "largura": W,
        "altura": H,
        "topo": topo,
        "pe": pe,
        "centro_x": centro_x,
        "quadros": N,
        "figura_altura": pe - topo,
    }, c_seam1, c_seam2


def main():
    meta = {}
    for chave, arq, ds, de, n_ins in CLIPS:
        out_mp4 = os.path.join(BASE, arq)
        raw_bytes = subprocess.check_output(["git", "show", f"{REF_COMMIT}:{BASE}/{arq}"])

        with tempfile.TemporaryDirectory() as td:
            in_mp4 = os.path.join(td, "orig.mp4")
            with open(in_mp4, "wb") as f:
                f.write(raw_bytes)

            subprocess.run(["ffmpeg", "-v", "error", "-i", in_mp4, f"{td}/src_%04d.png"], check=True)
            files = sorted(glob.glob(f"{td}/src_*.png"))
            frames = np.stack([np.asarray(Image.open(f).convert("RGB"), dtype=np.uint8) for f in files])
            N = len(frames)

            if chave == "idle-esquerda":
                bg = np.median(
                    np.concatenate([frames[:, :8, :, :].reshape(-1, 3), frames[:, -8:, :, :].reshape(-1, 3)], axis=0),
                    axis=0,
                )
                frames = limpar_artefatos_soltos(frames, bg)

            a, b = ds, N - de
            ponte = gerar_ponte_fluxo_optico(frames, a, b, n_ins, td)
            loop_seq = np.concatenate([frames[a:b], np.stack(ponte)], axis=0)

            out_dir = os.path.join(td, "loop_out")
            os.makedirs(out_dir, exist_ok=True)
            for idx, fr in enumerate(loop_seq):
                Image.fromarray(fr).save(f"{out_dir}/{idx:04d}.png")

            subprocess.run([
                "ffmpeg", "-v", "error", "-y",
                "-framerate", str(FPS),
                "-i", f"{out_dir}/%04d.png",
                "-c:v", "libx264",
                "-profile:v", "main",
                "-pix_fmt", "yuv420p",
                "-crf", "17",
                "-preset", "medium",
                "-bf", "0",
                "-g", "24",
                "-keyint_min", "24",
                "-sc_threshold", "0",
                "-movflags", "+faststart",
                "-an",
                out_mp4,
            ], check=True)

            geo, c1, c2 = medir_clipe(loop_seq)
            meta[chave] = geo
            kb = os.path.getsize(out_mp4) // 1024
            print(
                f"{chave:14s}: {N}f -> {geo['quadros']}f ({geo['quadros']/FPS:.2f}s) | "
                f"cos_emenda=({c1:+.2f}, {c2:+.2f}) | centroX={geo['centro_x']} pe={geo['pe']} | {kb} KB"
            )

    saida_json = {
        "frente": meta["walk-frente"],
        "esquerda": meta["walk-esquerda"],
        "costas": meta["walk-costas"],
        "clipes": meta,
    }
    with open(os.path.join(BASE, "walk-geometria.json"), "w", encoding="utf-8") as f:
        json.dump(saida_json, f, indent=1)
    print("Concluído com sucesso!")


if __name__ == "__main__":
    main()
