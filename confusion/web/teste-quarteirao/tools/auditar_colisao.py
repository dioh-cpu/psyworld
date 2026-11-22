#!/usr/bin/env python3
"""Auditoria da colisão do quarteirão.

Cruza a grade de colisão (COLISAO no quarteirao.js) com a cor da arte e lista as células
livres que parecem água: é onde o personagem atravessaria o rio. Grava uma sobreposição
para conferir. Uso:
    python3 auditar_colisao.py <arte.webp> <quarteirao.js> <saida.png>
"""
import re
import sys

import numpy as np
from PIL import Image, ImageDraw

COL, LIN, CEL = 172, 96, 8


def ler_grade(caminho_js):
    texto = open(caminho_js, encoding='utf-8').read()
    rle = re.search(r'rle: "([0-9,]+)"', texto).group(1)
    flat = np.zeros(COL * LIN, np.uint8)
    pos, valor = 0, 0
    for n in map(int, rle.split(',')):
        if valor:
            flat[pos:pos + n] = 1
        pos += n
        valor ^= 1
    return flat.reshape(LIN, COL).astype(bool)


def mascara_agua(arte):
    im = np.array(Image.open(arte).convert('RGB')).astype(float)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    agua = (b > r + 25) & (b > g - 5) & (b > 90)
    frac = agua.reshape(LIN, CEL, COL, CEL).mean(axis=(1, 3))
    return frac > 0.35


def main():
    arte, js, saida = sys.argv[1:4]
    bloq = ler_grade(js)
    agua = mascara_agua(arte)
    erro = agua & ~bloq
    print(f'células bloqueadas: {int(bloq.sum())} · água: {int(agua.sum())} · água livre (erro): {int(erro.sum())}')
    base = Image.open(arte).convert('RGBA')
    camada = Image.new('RGBA', base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(camada)
    for l, c in zip(*np.where(bloq)):
        d.rectangle([c * CEL, l * CEL, c * CEL + CEL - 1, l * CEL + CEL - 1], fill=(255, 0, 0, 70))
    for l, c in zip(*np.where(erro)):
        d.rectangle([c * CEL, l * CEL, c * CEL + CEL - 1, l * CEL + CEL - 1], fill=(255, 0, 255, 230))
    Image.alpha_composite(base, camada).convert('RGB').save(saida)
    print('sobreposição gravada em', saida)


if __name__ == '__main__':
    main()
