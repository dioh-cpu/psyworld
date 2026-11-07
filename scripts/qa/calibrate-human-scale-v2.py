"""Measure source scale from approved per-view head references; never rewrite art."""
import json,pathlib,sys
import numpy as np
from PIL import Image
from scipy.signal import fftconvolve
ROOT=pathlib.Path(__file__).resolve().parents[2]
manifest=json.loads((ROOT/'assets/characters/halloween/manifest.json').read_text())

def gray(im):
 a=np.array(im.convert('RGBA'),dtype=np.float32)/255
 return (a[:,:,:3]*np.array([.299,.587,.114])).sum(axis=2)*a[:,:,3]

def match(region,template):
 h,w=template.shape
 if h>region.shape[0] or w>region.shape[1] or min(h,w)<4:return -1,None
 t=template-template.mean();den=float((t*t).sum())
 if den<1e-6:return -1,None
 ones=np.ones((h,w));s=fftconvolve(region,ones,mode='valid');s2=fftconvolve(region*region,ones,mode='valid')
 score=fftconvolve(region,t[::-1,::-1],mode='valid')/np.sqrt(np.maximum(1e-10,(s2-s*s/(h*w))*den))
 idx=np.unravel_index(np.argmax(score),score.shape)
 return float(score[idx]),[int(idx[1]),int(idx[0])]

result={};summary=[]
for character in manifest['characters']:
 for key,file in character['costumes'].items():
  raw=Image.open(ROOT/'assets/characters/halloween'/file).convert('RGBA');mapping=[0,2,3,1] if key in ['macabre_alt','supreme'] else [0,1,2,3]
  rows=[]
  for row,sr in enumerate(mapping):
   ref=raw.crop((0,sr*512,512,(sr+1)*512));bb=ref.getchannel('A').point(lambda p:255 if p>32 else 0).getbbox();bh=bb[3]-bb[1]
   a=np.array(ref);mask=(a[:,:,3]>128);ys=range(bb[1],min(bb[3],bb[1]+round(bh*.27)));xs=np.where(mask[list(ys),:].any(axis=0))[0];cx=float(xs.mean()) if len(xs) else (bb[0]+bb[2])/2
   head=[round(cx-bh*.23),max(0,bb[1]-2),round(cx+bh*.23),round(bb[1]+bh*.36)]
   ref_head=ref.crop(head);metrics=[]
   for col in range(4):
    frame=raw.crop((col*512,sr*512,(col+1)*512,(sr+1)*512));box=frame.getchannel('A').point(lambda p:255 if p>32 else 0).getbbox();height=box[3]-box[1]
    # Downsample only for measurement. Production always samples the original image.
    search=[max(0,box[0]-8),max(0,box[1]-10),min(512,box[2]+8),min(512,round(box[1]+height*.58))]
    region=gray(frame.crop(search).resize((max(1,(search[2]-search[0])//2),max(1,(search[3]-search[1])//2)),Image.Resampling.BILINEAR))
    best=(-1,1,None)
    expected=height/bh
    for scale in np.arange(max(.65,expected*.86),min(1.65,expected*1.14)+.001,.0125):
     size=(max(4,round(ref_head.width*scale/2)),max(4,round(ref_head.height*scale/2)))
     candidate=gray(ref_head.resize(size,Image.Resampling.BILINEAR));score,point=match(region,candidate)
     if score>best[0]:best=(score,float(scale),point)
    score,relative,point=best
    if col==0:relative=1.;score=1.;point=[max(0,(head[0]-search[0])//2),max(0,(head[1]-search[1])//2)]
    ratio=46/bh/relative;target=height*ratio
    # Large ratio disagreement is a source-proportion ambiguity, not something
    # to "repair" by stretching a head or limb independently.
    trusted=score>=.65 and 43<=target<=49
    metrics.append({'sourceCol':col,'sourceBox':list(box),'headReference':head,'relativeSourceScale':round(relative,6),'matchScore':round(score,4),'worldScale':round(ratio if trusted else 46/height,8),'bodyHeight':round(target if trusted else 46,4),'headCorrectionUsed':trusted,'fallbackReason':None if trusted else 'head/template or pose-proportion ambiguity; uniform silhouette fit'})
   rows.append(metrics)
  result[file]={'character':character['id'],'visual':key,'referencePose':0,'sourceRows':mapping,'rows':rows}
  heights=[x['bodyHeight'] for r in rows for x in r];trusted=sum(x['headCorrectionUsed'] for r in rows for x in r)
  summary.append((file,round(min(heights),2),round(max(heights),2),trusted));print(*summary[-1],flush=True)
path=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/human-source-scale-analysis.json');path.write_text(json.dumps({'method':'uniform head-template registration against original pose 0, per view; no pixel edits','analysisOnly':True,'applied':False,'conclusion':'source poses have inconsistent global scale and some anatomical ratios; production fits uniform body scale, anchors feet and locks the approved same-view head reference','data':result},indent=2)+'\n')
