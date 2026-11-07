"""Independent final-WebP dimensions, scale, anchors and identity-layer checks.
Uses actual decoded production sheets; does not generate or edit sprite pixels.
"""
import hashlib,json,pathlib,sys
import numpy as np
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[2]
manifest=json.loads((ROOT/'assets/characters/animation-v2/manifest.json').read_text())
results=[]
for item in manifest['catalog']:
 p=ROOT/item['atlas'];image=Image.open(p).convert('RGBA');assert image.size==(2048,1792),str(p)
 assert hashlib.sha256(p.read_bytes()).hexdigest()==item['atlasSha256']
 assert Image.open(ROOT/item['original']).size==(2048,2048)
 assert Image.open(ROOT/item['neutral']).size==(1024,256)
 assert hashlib.sha256((ROOT/item['walk']).read_bytes()).hexdigest()==item['walkSha256']
 raw=Image.open(ROOT/item['walk']);assert raw.width==raw.height and raw.width>=1024
 ra=np.array(raw.convert('RGBA'))[:,:,3];cell=raw.width//4
 assert not (ra[4*cell:,:]>32).any() and not (ra[:,4*cell:]>32).any(),'parser may only discard transparent margin'
 for row in range(4):
  for col in range(4):
   edge=ra[row*cell:(row+1)*cell,col*cell:(col+1)*cell]
   assert not (edge[[0,-1],:]>32).any() and not (edge[:,[0,-1]]>32).any(),'raw cell edge content would clip'
 for g in item.get('gaitMetrics',[]):
  assert g['contact'][0]<g['pivot']<g['contact'][1],(item['id'],g,'no opposite contact')
  assert g['contact'][1]-g['contact'][0]>1,(item['id'],g,'no visible alternation')
 a=np.array(image);tiles=[]
 for index in range(112):
  x=index%8*256;y=index//8*128;t=a[y:y+128,x:x+256];tiles.append(t)
  if index>=112:continue
  ys,xs=np.where(t[:,:,3]>32);assert len(xs)>0
  box=[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)]
  assert box[3]==120,(item['id'],item['key'],index,'sole',box)
  assert box[3]-box[1]==92,(item['id'],item['key'],index,'height',box)
  assert box[0]>0 and box[2]<256,(item['id'],item['key'],index,'crop',box)
 for row in range(4):
  head=tiles[row*4][:68]
  for col in range(4):
   pose=row*4+col
   for tile in [pose,16+pose*2,17+pose*2,*range(48+pose*4,52+pose*4)]:
    assert np.array_equal(tiles[tile][:68],head),(item['id'],item['key'],tile,'head')
   foot=tiles[48+pose*4][98:]
   for breath in range(4):assert np.array_equal(tiles[48+pose*4+breath][98:],foot)
 results.append({'id':item['id'],'look':item['key'],'tiles':112,'height':92,'sole':120,'headChanges':0,'idleFootChanges':0,'gaitMetrics':item.get('gaitMetrics',[]),'passed':True})
output=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/human-final-sheets-tests.json');output.write_text(json.dumps(results,indent=2)+'\n')
print(f'PASS {len(results)} final lossless sheets / {len(results)*112} WALK, settling and IDLE tiles: dimensions, exact head/sole/height, no edge clipping, stable idle feet.')
