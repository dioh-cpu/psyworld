#!/usr/bin/env python3
"""Audita as máscaras de colisão (walkmask) dos 48 mapas da Região 1.
Mede o que realmente alcança o personagem (com o raio dele) a partir do ponto de chegada e lista o que ficou barrado:
saídas, NPCs, pistas, monstros, chefes, marcos e ilhas de piso caminhável isoladas.
Uso: auditar_colisao_regiao1.py DADOS.json [MAPA ...]   (DADOS.json vem de exportar os dados dos mapas e entidades)"""
import json, sys
import numpy as np
import cv2

D = json.load(open(sys.argv[1]))
ALVOS = sys.argv[2:] or D['ordem']
BASE = '/home/user/psyworld/confusion/web/teste-quarteirao/'
LARG = 106.0
PX = 1024 / LARG                  # pixels da máscara por unidade de mundo
RAIO_PX = 0.35 * PX               # raio do personagem em pixels (~3,4)
ALC_NPC = 6.2 * PX                # distância de interação (NPC, pista, monstro...)


def carregar(mapa_id):
    m = cv2.imread(BASE + D['mapas'][mapa_id]['mascara'], cv2.IMREAD_GRAYSCALE)
    return m >= 128


def erodir(w):
    r = int(round(RAIO_PX))
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
    return cv2.erode(w.astype(np.uint8), k).astype(bool)


def componentes(e):
    n, lab = cv2.connectedComponents(e.astype(np.uint8), connectivity=8)
    return n, lab


def pontos_obrigatorios(mapa_id):
    """(rotulo, tipo, (x, y), raio de alcance em px). Chegadas = pontos onde outros mapas colocam o jogador."""
    m = D['mapas'][mapa_id]
    pts = [('spawn', 'spawn', tuple(m['spawnPadrao']), 0)]
    for o_id, o in D['mapas'].items():
        for s in o['saidas']:
            if s.get('destino') == mapa_id and s.get('chegada'):
                pts.append((f'chegada de {o_id}/{s["id"]}', 'chegada', tuple(s['chegada']), 0))
    for s in m['saidas']:
        r = s['rect']
        pts.append((f'saída {s["id"]}→{s.get("destino")}', 'saida', ((r[0] + r[2]) / 2, (r[1] + r[3]) / 2), max(r[2] - r[0], r[3] - r[1]) / 2 + 8))
    if m.get('marco'):
        mi = m['marco'].get('interacao') or m['marco']['pos']
        pts.append(('marco ' + m['marco']['id'], 'marco', tuple(mi), ALC_NPC))
    for n in D['npcs']:
        if n['mapa'] == mapa_id: pts.append(('npc ' + n['id'], 'npc', tuple(n['pos']), ALC_NPC))
    for p in D['pistas']:
        if p['mapa'] == mapa_id: pts.append(('pista ' + p['id'], 'pista', tuple(p['pos']), ALC_NPC))
    for w in D['wilds']:
        if w['mapa'] == mapa_id: pts.append(('monstro ' + w['id'], 'monstro', tuple(w['pos']), 5.2 * PX))
    for b in D['bosses']:
        if b['mapa'] == mapa_id: pts.append(('boss ' + b['id'], 'boss', tuple(b['pos']), 7.5 * PX))
    return pts


def alcancavel(e, lab, comp, x, y, raio):
    """Algum pixel do componente principal dentro do raio de alcance do ponto?"""
    h, w = e.shape
    r = int(max(raio, 2))
    x0, x1, y0, y1 = max(0, int(x - r)), min(w, int(x + r) + 1), max(0, int(y - r)), min(h, int(y + r) + 1)
    sub = (lab[y0:y1, x0:x1] == comp)
    if not sub.any(): return False
    yy, xx = np.nonzero(sub)
    return bool(np.any((xx + x0 - x) ** 2 + (yy + y0 - y) ** 2 <= r * r))


def auditar(mapa_id):
    w = carregar(mapa_id)
    e = erodir(w)
    n, lab = componentes(e)
    sp = D['mapas'][mapa_id]['spawnPadrao']
    comp = lab[int(sp[1]), int(sp[0])]
    if comp == 0:
        # spawn em pixel bloqueado: usa o componente maior
        areas = np.bincount(lab.ravel()); areas[0] = 0
        comp = int(np.argmax(areas))
    problemas = []
    for rot, tipo, (x, y), raio in pontos_obrigatorios(mapa_id):
        if tipo in ('spawn', 'chegada'):
            ok = lab[int(min(y, 570)), int(min(x, 1023))] == comp
            if not ok:
                # tolera chegada ao lado de piso
                ok = alcancavel(e, lab, comp, x, y, 6)
        else:
            ok = alcancavel(e, lab, comp, x, y, raio)
        if not ok:
            problemas.append((rot, tipo, (round(x), round(y))))
    # ilhas: pedaços grandes de piso (na máscara original) que o componente principal não alcança
    n2, lab2 = cv2.connectedComponents(w.astype(np.uint8), connectivity=8)
    main_w = np.unique(lab2[(lab == comp)])
    ilhas = []
    for i in range(1, n2):
        if i in main_w: continue
        a = int((lab2 == i).sum())
        if a >= 600:
            ys, xs = np.nonzero(lab2 == i)
            ilhas.append((a, (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()))))
    # piso que existe mas não é alcançado por causa da erosão (gargalo estreito) em área grande
    perdido = int(((e == False) & w).sum())
    area = int(w.sum())
    return {'mapa': mapa_id, 'piso': area, 'alcancado': int((lab == comp).sum()), 'problemas': problemas, 'ilhas': sorted(ilhas, reverse=True)[:5]}


if __name__ == '__main__':
    total = 0
    for mid in ALVOS:
        r = auditar(mid)
        flag = bool(r['problemas'] or r['ilhas'])
        total += flag
        print(f"{mid:8s} piso {r['piso']:6d} alcançado {r['alcancado']:6d} ({100 * r['alcancado'] // max(1, r['piso'])}%)" + ('' if not flag else '  <<<'))
        for p in r['problemas']:
            print('    barrado:', p)
        for a, b in r['ilhas']:
            print('    ilha isolada:', a, 'px em', b)
    print('mapas com problema:', total, 'de', len(ALVOS))
