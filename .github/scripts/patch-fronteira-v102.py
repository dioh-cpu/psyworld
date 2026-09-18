from pathlib import Path
import re

p = Path('fronteira2d/game.js')
s = p.read_text(encoding='utf-8')

new = '''  function mineBlocked(x,y){
    if(!minePixels)return false;
    const px=clamp(Math.floor(x/MINE.w*assets.mine.naturalWidth),0,assets.mine.naturalWidth-1),py=clamp(Math.floor(y/MINE.h*assets.mine.naturalHeight),0,assets.mine.naturalHeight-1);
    let floor=0,total=0;
    for(let dy=-9;dy<=9;dy+=3){const sy=clamp(py+dy,0,assets.mine.naturalHeight-1);for(let dx=-9;dx<=9;dx+=3){const sx=clamp(px+dx,0,assets.mine.naturalWidth-1),i=(sy*assets.mine.naturalWidth+sx)*4,r=minePixels[i],g=minePixels[i+1],b=minePixels[i+2],bright=(r+g+b)/3;floor+=(r>g*1.02&&g>b&&bright>65)?1:0;total++}}
    return floor/total<.25;
  }
'''

pattern = r'  function mineBlocked\(x,y\)\{.*?(?=  function toast\()'
s2, count = re.subn(pattern, new, s, count=1, flags=re.S)
if count != 1:
    print('GAME_JS_SIZE', len(s))
    for term in ['mineBlocked', 'mineEntrance', 'MINE', 'magnus', 'const CITY', 'gameCanvas', 'const WORLD']:
        print(term, s.find(term))
    print('GAME_JS_HEAD_START')
    print(s[:2500])
    print('GAME_JS_HEAD_END')
    raise SystemExit(f'Expected one mineBlocked function, found {count}')
p.write_text(s2, encoding='utf-8')

Path('fronteira2d/PATCH_NOTES.txt').write_text('''PSYWORLD V102 - Fronteira Iris 2D\n\n- V101 preservada como base visual e funcional da Fronteira Iris.\n- Tilemap, Magnus, Mina de Cobre, sprites, arvores e controles preservados.\n- Corrigida somente a colisao interna da Mina de Cobre para nao bloquear trilhos, rachaduras e sombras estreitas do piso.\n- Os 12 minerios de cobre permanecem exclusivamente dentro da mina.\n- Preview de teste: branch test/fronteira-iris-v102. Production nao e alterada.\n''', encoding='utf-8')
