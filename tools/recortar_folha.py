"""Recorta uma folha de Oníricos (fundo chroma magenta ou verde) em imagens separadas com fundo transparente.
Uso: python3 tools/recortar_folha.py folha.png pasta_saida nome1 nome2 ... [--chroma magenta|verde]
Os nomes seguem a ordem de leitura (linha a linha, da esquerda para a direita)."""
import sys, numpy as np
from pathlib import Path
from PIL import Image

def alfa_chroma(rgb, chroma):
    r, g, b = [rgb[..., i].astype(int) for i in range(3)]
    if chroma == 'verde': fundo = (g - np.maximum(r, b)) ; spill = ('g',)
    else: fundo = (np.minimum(r, b) - g)
    a = np.clip(255 - (fundo - 40) * 4, 0, 255).astype(np.uint8)   # 40+ de "chroma" vira transparente com borda suave
    out = rgb.copy()
    if chroma == 'verde': out[..., 1] = np.minimum(out[..., 1], np.maximum(out[..., 0], out[..., 2]))
    else:  # tira só o reflexo magenta (azul acima do verde); marrons e vermelhos ficam intactos
        r, g, b = [out[..., k].astype(int) for k in range(3)]
        tinto = b > g
        out[..., 2] = np.where(tinto, g, b).astype(np.uint8)
        out[..., 0] = np.where(tinto, np.minimum(r, g + (r - b).clip(0) + 30), r).clip(0, 255).astype(np.uint8)
    return out, a

def main():
    args = [x for x in sys.argv[1:] if not x.startswith('--')]
    chroma = 'verde' if '--chroma' in sys.argv and sys.argv[sys.argv.index('--chroma') + 1] == 'verde' else 'magenta'
    if chroma == 'verde' and 'verde' in args: args.remove('verde')
    if 'magenta' in args: args.remove('magenta')
    src, saida, nomes = args[0], Path(args[1]), args[2:]
    rgb = np.array(Image.open(src).convert('RGB'))
    cor, a = alfa_chroma(rgb, chroma)
    m = a > 128
    def faixas(v, minimo):  # trechos com conteúdo separados por vazios
        out, ini = [], None
        for i, x in enumerate(v):
            if x and ini is None: ini = i
            if not x and ini is not None:
                if i - ini > minimo: out.append((ini, i))
                ini = None
        if ini is not None: out.append((ini, len(v)))
        return out
    caixas = []
    for y0, y1 in faixas(m.any(1), 20):
        for x0, x1 in faixas(m[y0:y1].any(0), 20):
            ys = np.where(m[y0:y1, x0:x1].any(1))[0]
            caixas.append((slice(y0 + ys[0], y0 + ys[-1] + 1), slice(x0, x1)))
    saida.mkdir(parents=True, exist_ok=True)
    for i, s in enumerate(caixas):
        nome = nomes[i] if i < len(nomes) else f'vista-{i + 1}'
        img = Image.fromarray(np.dstack([cor, a])[s], 'RGBA')
        from PIL import ImageFilter
        img.putalpha(img.getchannel('A').filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6)))  # some a franja magenta
        img = img.crop(img.getbbox()); img.save(saida / f'{nome}.png'); print(nome, img.size)
main()
