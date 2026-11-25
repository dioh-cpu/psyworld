#!/usr/bin/env python3
"""Corrige as máscaras de colisão (walkmask) da Região 1 que deixaram piso caminhável como parede.
Aprende a cor do piso a partir do miolo da máscara atual (Lab, distância de Mahalanobis) e:
  1) expande o piso para pixels da mesma cor ligados a ele, até MAX_CRESCER px de distância;
  2) preenche buracos cuja arte tem a cor do piso.
Nunca remove piso, nem mexe nas saídas. Objetos (pedras, cristais, casas) têm cor diferente e continuam barrados.
Uso: corrigir_colisao_regiao1.py MAPA [MAPA ...] [--limiar 3.0] [--crescer 45] [--saida PASTA] [--dry]"""
import sys, argparse
import numpy as np
import cv2

B = '/home/user/psyworld/confusion/web/teste-quarteirao/assets/regiao1/'
ap = argparse.ArgumentParser()
ap.add_argument('mapas', nargs='+')
ap.add_argument('--limiar', type=float, default=3.0)
ap.add_argument('--crescer', type=int, default=45)
ap.add_argument('--buraco', type=int, default=6000)
ap.add_argument('--saida', default=B)
ap.add_argument('--dry', action='store_true')
a = ap.parse_args()


def corrigir(mid):
    art = cv2.resize(cv2.imread(B + f'{mid}.webp'), (1024, 571), interpolation=cv2.INTER_AREA)
    w = cv2.imread(B + f'{mid}-walkmask.png', 0) >= 128
    lab = cv2.cvtColor(cv2.GaussianBlur(art, (0, 0), 2.2), cv2.COLOR_BGR2LAB).astype(np.float32)
    miolo = cv2.erode(w.astype(np.uint8), np.ones((13, 13), np.uint8)).astype(bool)
    if miolo.sum() < 2000:
        miolo = w
    px = lab[miolo]
    mu = px.mean(0)
    cov = np.cov(px.T) + np.eye(3) * 4.0
    inv = np.linalg.inv(cov)
    d = lab - mu
    m2 = np.einsum('...i,ij,...j->...', d, inv, d)
    cand = np.sqrt(m2) < a.limiar
    # limitar o crescimento: distância até o piso atual
    dist = cv2.distanceTransform((~w).astype(np.uint8), cv2.DIST_L2, 3)
    cand &= dist <= a.crescer
    cand = cv2.morphologyEx(cand.astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))).astype(bool)
    # só o que se liga ao piso atual
    alvo = cand | w
    n, lab_cc = cv2.connectedComponents(alvo.astype(np.uint8), connectivity=8)
    ligados = np.unique(lab_cc[w])
    novo = np.isin(lab_cc, ligados[ligados > 0]) & alvo
    novo = cv2.morphologyEx(novo.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))).astype(bool)
    # buracos: fecha os que são da cor do piso
    inv_m = (~novo).astype(np.uint8)
    n2, l2, st, _ = cv2.connectedComponentsWithStats(inv_m, connectivity=4)
    borda = set(np.unique(np.concatenate([l2[0], l2[-1], l2[:, 0], l2[:, -1]])))
    for i in range(1, n2):
        if i in borda or st[i, 4] > a.buraco:
            continue
        regiao = l2 == i
        if (cand[regiao]).mean() > 0.55:
            novo |= regiao
    novo |= w
    return w, novo, art


for mid in a.mapas:
    w, novo, art = corrigir(mid)
    add = int((novo & ~w).sum())
    print(f'{mid:8s} piso {int(w.sum()):6d} -> {int(novo.sum()):6d}  (+{add}, +{100 * add / max(1, w.sum()):.1f}%)')
    if not a.dry:
        cv2.imwrite(a.saida + f'{mid}-walkmask.png', (novo * 255).astype(np.uint8))
