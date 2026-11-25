#!/usr/bin/env python3
"""Valida as artes dos 50 sistemas em assets/confusion/interface/mundo/<sistema>/<vaga>.webp contra o catálogo (artes.js).
Confere: nome (arquivo desconhecido ou nome parecido com erro), formato WebP, tamanho e proporção do tipo, fundo transparente onde
o tipo exige, e peso. Mostra o que falta e gera uma folha de contato das que já chegaram.
Uso: validar_artes_mundo.py [--folha SAIDA.png] [--sistema 05] [--so-problemas]"""
import argparse, json, os, subprocess, sys, difflib
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASTA = os.path.join(RAIZ, 'assets/confusion/interface/mundo')
ap = argparse.ArgumentParser()
ap.add_argument('--folha'); ap.add_argument('--sistema'); ap.add_argument('--so-problemas', action='store_true')
a = ap.parse_args()

js = ("import {ARTES,TIPOS_ARTE} from '%s/confusion/web/mundo/artes.js';"
      "console.log(JSON.stringify({artes:ARTES,tipos:TIPOS_ARTE}))") % RAIZ
cat = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js]))
TIPOS = cat['tipos']
# tamanho alvo, tolerância de proporção, peso máximo (KB) e se precisa de transparência
ALVO = {'icone': (256, 256, .12, 250, True), 'banner': (1600, 500, .06, 900, False), 'sprite': (512, 512, .6, 500, True),
        'retrato': (1024, 1024, .12, 700, False), 'cena': (1920, 1080, .06, 1400, False), 'marcador': (128, 128, .15, 80, True)}

def checar(caminho, tipo):
    L = []  # (gravidade, texto)
    kb = os.path.getsize(caminho) / 1024
    try:
        im = Image.open(caminho); im.load()
    except Exception as e:
        return [('erro', f'não abre como imagem ({e})')], None
    if im.format != 'WEBP': L.append(('erro', f'formato {im.format}, precisa ser WebP (salvar com extensão .webp e codec WebP)'))
    w, h = im.size; tw, th, tol, maxkb, transp = ALVO[tipo]
    if tipo in ('icone', 'marcador', 'retrato'):
        if abs(w / h - 1) > tol: L.append(('erro', f'{w}x{h} não é quadrada (precisa ~{tw}x{th})'))
    elif tipo == 'sprite':
        if not (0.5 <= w / h <= 2): L.append(('aviso', f'{w}x{h}: proporção muito fora do quadrado'))
    else:
        if abs((w / h) / (tw / th) - 1) > tol: L.append(('erro', f'{w}x{h} com proporção diferente de {tw}x{th}'))
    if max(w, h) < max(tw, th) * 0.75: L.append(('erro', f'{w}x{h} pequena demais (alvo {tw}x{th}, mínimo {int(max(tw, th) * .75)} no lado maior)'))
    elif max(w, h) > max(tw, th) * 2.1: L.append(('aviso', f'{w}x{h} muito maior que o necessário ({tw}x{th}); pode reduzir'))
    if transp:
        rgba = im.convert('RGBA'); px = rgba.load()
        cantos = [px[0, 0][3], px[w - 1, 0][3], px[0, h - 1][3], px[w - 1, h - 1][3]]
        if im.mode != 'RGBA' and 'A' not in im.getbands(): L.append(('erro', 'sem canal alfa: precisa de fundo transparente'))
        elif max(cantos) > 20: L.append(('erro', 'cantos não são transparentes: sobrou fundo (verde/cor) em volta'))
        else:
            al = rgba.split()[3]; tot = w * h; opaco = sum(al.histogram()[201:])
            if opaco / tot < 0.04: L.append(('aviso', 'quase tudo transparente: confira se a figura está dentro da imagem'))
            bb = al.point(lambda v: 255 if v > 20 else 0).getbbox()
            if bb and (bb[0] <= 1 or bb[1] <= 1 or bb[2] >= w - 1 or bb[3] >= h - 1): L.append(('aviso', 'figura encosta na borda da imagem (pode ser cortada)'))
    if kb > maxkb: L.append(('aviso', f'{kb:.0f} KB, acima do limite de {maxkb} KB (comprimir mais)'))
    return L, im

tot = ok = com_erro = 0; faltam = []; desconhecidos = []; rel = []; folha = []
for s in cat['artes']:
    if a.sistema and s['id'] != a.sistema: continue
    pasta = os.path.join(PASTA, s['id']); nomes = {v['id'] for v in s['artes']}
    presentes = sorted(os.listdir(pasta)) if os.path.isdir(pasta) else []
    for arq in presentes:
        base, ext = os.path.splitext(arq)
        if ext.lower() != '.webp' or base not in nomes:
            sug = difflib.get_close_matches(base, nomes, n=1, cutoff=0.5)
            desconhecidos.append(f"{s['id']}/{arq}" + (f"  → parece ser `{sug[0]}.webp`" if sug else '  → não existe no catálogo'))
    for v in s['artes']:
        tot += 1
        caminho = os.path.join(pasta, f"{v['id']}.webp")
        if not os.path.isfile(caminho): faltam.append(f"{s['id']}/{v['id']}.webp ({v['tipo']})"); continue
        probs, im = checar(caminho, v['tipo'])
        erros = [t for g, t in probs if g == 'erro']
        if erros: com_erro += 1
        else: ok += 1
        if im is not None: folha.append((s['id'], v['id'], v['tipo'], im, bool(erros)))
        if probs or not a.so_problemas:
            rel.append(f"{'✗' if erros else '✓'} {s['id']}/{v['id']}.webp" + ''.join(f"\n    {'ERRO' if g == 'erro' else 'aviso'}: {t}" for g, t in probs))

print('\n'.join(rel))
if desconhecidos: print('\nArquivos com nome fora do catálogo:\n  ' + '\n  '.join(desconhecidos))
print(f"\nResumo: {tot} vagas · {ok} prontas · {com_erro} com erro · {len(faltam)} faltando · {len(desconhecidos)} nome desconhecido")
if faltam and not a.so_problemas: print('Faltando (primeiras 25):\n  ' + '\n  '.join(faltam[:25]))
if a.folha and folha:
    from PIL import ImageDraw
    C = 160; cols = 8; lin = (len(folha) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * C, lin * (C + 18)), (36, 22, 43)); d = ImageDraw.Draw(sheet)
    for i, (sid, vid, tipo, im, err) in enumerate(folha):
        t = im.convert('RGBA'); t.thumbnail((C - 8, C - 8))
        bg = Image.new('RGBA', t.size, (70, 50, 80, 255)); bg.alpha_composite(t)
        x, y = (i % cols) * C + 4, (i // cols) * (C + 18) + 2
        sheet.paste(bg.convert('RGB'), (x, y)); d.text((x, y + C - 6), f"{sid}/{vid}", fill=(255, 90, 90) if err else (240, 220, 190))
    sheet.save(a.folha); print('Folha de contato:', a.folha)
sys.exit(1 if com_erro or desconhecidos else 0)
