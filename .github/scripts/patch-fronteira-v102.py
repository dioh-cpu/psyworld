from pathlib import Path

p = Path('fronteira2d/game.js')
s = p.read_text(encoding='utf-8')

replacement = '''  function mineBlocked(x,y){
    if(!minePixels)return false;
    const px=clamp(Math.floor(x/MINE.w*assets.mine.naturalWidth),0,assets.mine.naturalWidth-1),py=clamp(Math.floor(y/MINE.h*assets.mine.naturalHeight),0,assets.mine.naturalHeight-1);
    let floor=0,total=0;
    for(let dy=-9;dy<=9;dy+=3){const sy=clamp(py+dy,0,assets.mine.naturalHeight-1);for(let dx=-9;dx<=9;dx+=3){const sx=clamp(px+dx,0,assets.mine.naturalWidth-1),i=(sy*assets.mine.naturalWidth+sx)*4,r=minePixels[i],g=minePixels[i+1],b=minePixels[i+2],bright=(r+g+b)/3;floor+=(r>g*1.02&&g>b&&bright>65)?1:0;total++}}
    return floor/total<.25;
  }
'''

if 'return floor/total<.25;' not in s:
    start = s.find('  function mineBlocked(x,y){')
    end = s.find('  function toast(', start)
    if start < 0 or end < 0:
        raise SystemExit('V101 game.js esperado nao encontrado; abortando sem sobrescrever.')
    s = s[:start] + replacement + s[end:]
    p.write_text(s, encoding='utf-8')

required = [
    'const CITY={w:3840,h:2560}',
    'const MINE={w:3072,h:2048}',
    'mineEntrance',
    'magnus',
    'const ores=',
    "image('./assets/mina-cobre-v1.png')",
]
missing = [term for term in required if term not in s]
if missing:
    raise SystemExit('Baseline V101 inesperada; faltando: ' + ', '.join(missing))

Path('fronteira2d/PATCH_NOTES.txt').write_text('''PSYWORLD V102 - Fronteira Iris 2D\n\n- V101 preservada como base visual e funcional da Fronteira Iris.\n- Tilemap, Magnus, Mina de Cobre, sprites, arvores e controles preservados.\n- Corrigida somente a colisao interna da Mina de Cobre para nao bloquear trilhos, rachaduras e sombras estreitas do piso.\n- Os 12 minerios de cobre permanecem exclusivamente dentro da mina.\n- Preview de teste: branch test/fronteira-iris-v102. Production nao e alterada.\n''', encoding='utf-8')
