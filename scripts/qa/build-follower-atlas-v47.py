import json,io,urllib.request,concurrent.futures,unicodedata,re,time
from pathlib import Path
from PIL import Image
names=json.load(open('scripts/qa/follower-species-v47.json')); cache=Path('/tmp/follower-v47-cache');cache.mkdir(exist_ok=True)
root='https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/master/graphics/pokemon/'
def fetch(pair):
 id,name=pair;slug=re.sub(r'[^a-z0-9]+','_',unicodedata.normalize('NFD',re.sub(r'(?<=[a-z])(?=[A-Z])','_',name)).encode('ascii','ignore').decode().lower()).strip('_')
 slug={29:'nidoran_f',32:'nidoran_m',83:'farfetchd',122:'mr_mime',439:'mime_jr',772:'type_null',865:'sirfetchd',866:'mr_rime'}.get(int(id),slug)
 slug={386:'deoxys/normal',641:'tornadus/incarnate',642:'thundurus/incarnate',645:'landorus/incarnate',648:'meloetta/aria',869:'alcremie/strawberry'}.get(int(id),slug)
 try:
  p=cache/(id+'.png')
  if not p.exists():p.write_bytes(urllib.request.urlopen(root+slug+'/overworld.png',timeout=15).read())
  im=Image.open(p)
  if im.width not in [im.height*6,im.height*8]:return None
  if im.mode=='P':im.info['transparency']=0
  shiny=None
  try:
   palpath=cache/(id+'.pal')
   if not palpath.exists():palpath.write_bytes(urllib.request.urlopen(root+slug+'/overworld_shiny.pal',timeout=10).read())
   lines=palpath.read_text().splitlines()[3:];cols=[list(map(int,line.split())) for line in lines if len(line.split())==3]
   if len(cols)>=15:
    shiny=im.copy();pal=shiny.getpalette();pal[:len(cols[:16])*3]=[v for rgb in cols[:16] for v in rgb];shiny.putpalette(pal);shiny.info['transparency']=0;shiny=shiny.convert('RGBA')
  except Exception:pass
  return id,name,im.convert('RGBA'),shiny
 except Exception:return None
with concurrent.futures.ThreadPoolExecutor(max_workers=32) as ex: rows=[r for r in ex.map(fetch,names.items()) if r]
# Normalize frame boxes while preserving actual sprite size, never crop a foot/wing.
cell=64;cols=8;atlas=Image.new('RGBA',(cols*cell*8,((len(rows)+cols-1)//cols)*cell));manifest={};shinyAtlas=Image.new('RGBA',atlas.size)
for n,(id,name,im,shiny) in enumerate(rows):
 x=(n%cols)*cell*8;y=(n//cols)*cell;size=im.height
 for frame in range(im.width//size):
  one=im.crop((frame*size,0,(frame+1)*size,size));atlas.alpha_composite(one,(x+frame*cell+(cell-size)//2,y+cell-size))
  if shiny:shinyAtlas.alpha_composite(shiny.crop((frame*size,0,(frame+1)*size,size)),(x+frame*cell+(cell-size)//2,y+cell-size))
 manifest[id]={'x':x,'y':y,'name':name,'size':size,'frames':im.width//size,'shiny':shiny is not None}
atlas.save('assets/followers/overworld-v47.webp',lossless=True,method=6)
shinyAtlas.save('assets/followers/overworld-shiny-v47.webp',lossless=True,method=6)
Path('assets/followers/manifest-v47.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')))
Path('assets/followers/CREDITS.md').write_text('Overworld assets: rh-hideout/pokeemerald-expansion, graphics/pokemon/*/overworld.png; source credits: https://github.com/rh-hideout/pokeemerald-expansion/blob/master/CREDITS.md . Original Pokémon assets and community additions retain their original attribution. Animation contract: src/data/object_events/object_event_anims.h, sAnimTable_Following (south0/1,north2/3,west4/5,east mirrored). Local atlas preserves pixel art, transparency and feet. Manifest lists exact supported species. No substitute sprites for missing forms.\n')
print('FOLLOWER ATLAS',len(rows),'species',atlas.size,'bytes',Path('assets/followers/overworld-v47.webp').stat().st_size,'missing',len(names)-len(rows),flush=True)
