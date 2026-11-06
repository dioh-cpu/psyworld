from PIL import Image
from pathlib import Path
import json,math
root=Path('assets/followers');m=json.loads((root/'manifest-v47.json').read_text());
if any('page' in r for r in m.values()):raise SystemExit('Already paged: rebuild the source atlas before splitting again.')
normal=Image.open(root/'overworld-v47.webp');shiny=Image.open(root/'overworld-shiny-v47.webp');out=root/'pages';out.mkdir(exist_ok=True)
rows=list(m.items());count=math.ceil(len(rows)/64)
for page in range(count):
 a=Image.new('RGBA',(4096,512));b=Image.new('RGBA',a.size)
 for n,(id,r) in enumerate(rows[page*64:(page+1)*64]):
  x=(n%8)*512;y=(n//8)*64
  a.alpha_composite(normal.crop((r['x'],r['y'],r['x']+512,r['y']+64)),(x,y));b.alpha_composite(shiny.crop((r['x'],r['y'],r['x']+512,r['y']+64)),(x,y));r.update(x=x,y=y,page=page)
 a.save(out/f'normal-{page}.webp',lossless=True,method=6);b.save(out/f'shiny-{page}.webp',lossless=True,method=6)
(root/'manifest-v47.json').write_text(json.dumps(m,ensure_ascii=False,separators=(',',':')))
print('Follower pages:',count,'per palette;',len(rows),'species; lazy decoding <=2 pages')
