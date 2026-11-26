#!/usr/bin/env python3
"""Auditoria da colisão do quarteirão.

Cruza a grade de colisão (COLISAO no quarteirao.js) com a cor da arte e lista as células
livres que parecem água: é onde o personagem atravessaria o rio. Grava uma sobreposição
para conferir. Lê as dimensões da própria grade. Uso:
    python3 auditar_colisao.py <arte.webp> <quarteirao.js> <saida.png>
"""
import re
import sys

import numpy as np
from PIL import Image, ImageDraw


def ler_grade(caminho_js):
    texto = open(caminho_js, encoding='utf-8').read()
    m = re.search(r'const COLISAO = \{ celula: (\d+), colunas: (\d+), linhas: (\d+), rle: "([0-9,]+)" \}', texto)
    cel, col, lin = int(m.group(1)), int(m.group(2)), int(m.group(3))
    flat = np.zeros(col * lin, np.uint8)
    pos, valor = 0, 0
    for n in map(int, m.group(4).split(',')):
        if valor:
            flat[pos:pos + n] = 1
        pos += n
        valor ^= 1
    return flat.reshape(lin, col).astype(bool), cel


def mascara_agua(arte, lin, col, cel):
    im = np.array(Image.open(arte).convert('RGB')).astype(float)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    agua = (b > r + 25) & (b > g - 5) & (b > 90)
    frac = agua.reshape(lin, cel, col, cel).mean(axis=(1, 3))
    return frac > 0.35


def main():
    arte, js, saida = sys.argv[1:4]
    bloq, cel = ler_grade(js)
    lin, col = bloq.shape
    agua = mascara_agua(arte, lin, col, cel)
    erro = agua & ~bloq
    print(f'células bloqueadas: {int(bloq.sum())} · água: {int(agua.sum())} · água livre (erro): {int(erro.sum())}')
    base = Image.open(arte).convert('RGBA')
    camada = Image.new('RGBA', base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(camada)
    for l, c in zip(*np.where(bloq)):
        d.rectangle([c * cel, l * cel, c * cel + cel - 1, l * cel + cel - 1], fill=(255, 0, 0, 70))
    for l, c in zip(*np.where(erro)):
        d.rectangle([c * cel, l * cel, c * cel + cel - 1, l * cel + cel - 1], fill=(255, 0, 255, 230))
    Image.alpha_composite(base, camada).convert('RGB').save(saida)
    print('sobreposição gravada em', saida)


if __name__ == '__main__':
    main()
