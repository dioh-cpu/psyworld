/* PSYWORLD — walking animation shared by Psy City and Kanto.
 * Preserves all four authentic stride poses from each 4x4 trainer sheet.
 * Never changes trainer size, floor anchor, or movement speed.
 */
(function(W,D){
'use strict';
if(W.PsyTrainerWalkV1)return;
const cache=new WeakMap();
const TW=48,TH=64,BW=33,BH=46,BASE_Y=14;
const sequence=Object.freeze([1,0,3,0]);
const create=()=>D.createElement('canvas');
function getAtlas(img){
  if(!img)return null;
  const saved=cache.get(img);if(saved)return saved;
  const sw=Math.floor((img.naturalWidth||img.width)/4);
  const sh=Math.floor((img.naturalHeight||img.height)/4);
  if(sw<=0||sh<=0)return null;
  const alphaCanvas=create();alphaCanvas.width=384;alphaCanvas.height=384;
  const alphaCtx=alphaCanvas.getContext('2d',{willReadFrequently:true});
  alphaCtx.imageSmoothingEnabled=true;
  alphaCtx.drawImage(img,0,0,384,384);
  let pixels=null;
  try{pixels=alphaCtx.getImageData(0,0,384,384).data}catch(_){}
  const boxes=Array.from({length:4},()=>Array(4));
  let maxBodyW=0,maxBodyH=0;
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){
    let minX=96,minY=96,maxX=-1,maxY=-1;
    if(pixels)for(let y=0;y<96;y++)for(let x=0;x<96;x++){
      if(pixels[(((row*96+y)*384+col*96+x)*4)+3]<=32)continue;
      if(x<minX)minX=x;if(y<minY)minY=y;
      if(x>maxX)maxX=x;if(y>maxY)maxY=y;
    }
    const box=maxX>=minX?
      {x:Math.max(0,(minX-1)*sw/96),y:Math.max(0,(minY-1)*sh/96),
       w:Math.min(sw,(maxX-minX+3)*sw/96),h:Math.min(sh,(maxY-minY+3)*sh/96)}:
      {x:sw*.27,y:sh*.27,w:sw*.5,h:sh*.56};
    boxes[row][col]=box;maxBodyW=Math.max(maxBodyW,box.w);maxBodyH=Math.max(maxBodyH,box.h);
  }
  // One scale for the whole sheet. Independent per-frame stretching made
  // the trainer visibly grow/shrink as the legs changed pose.
  const bodyScale=Math.min(BW/maxBodyW,BH/maxBodyH);
  const atlas=create();atlas.width=TW*4;atlas.height=TH*4;
  const c=atlas.getContext('2d');c.imageSmoothingEnabled=true;
  c.imageSmoothingQuality='high';
  const temp=create();temp.width=TW;temp.height=TH;
  const tc=temp.getContext('2d');tc.imageSmoothingEnabled=true;tc.imageSmoothingQuality='high';
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){
    const box=boxes[row][col],dw=BW,dh=BH;
    const ox=col*TW,oy=row*TH;
    tc.clearRect(0,0,TW,TH);
    tc.drawImage(img,col*sw+box.x,row*sh+box.y,box.w,box.h,
      (TW-dw)/2,BASE_Y+BH-dh,dw,dh);
    c.save();c.beginPath();c.rect(ox,oy,TW,TH);c.clip();
    c.drawImage(temp,ox,oy);
    c.restore();
  }
  cache.set(img,atlas);return atlas;
}
function column(phase,moving){
  if(!moving)return 0;
  return sequence[((Math.floor(phase)||0)%4+4)%4];
}
function draw(ctx,atlas,row,col,x,y,width,height){
  if(!atlas)return false;
  const r=Math.max(0,Math.min(3,row|0)),c=Math.max(0,Math.min(3,col|0));
  ctx.drawImage(atlas,c*TW,r*TH,TW,TH,x,y,width,height);return true;
}
// Human animation uses the same monotonic-time method as the approved followers,
// but retains all four authored human poses and never changes world movement.
const animationCache=new WeakMap();
const HUMAN_W=128,HUMAN_H=64,HUMAN_SCALE=2,HUMAN_COLS=8;
function animationProfile(img){
 const file=String(img.currentSrc||img.src||'').split('/').pop().split('?')[0];
 const alternate=/^(macabre-alt-|apex-)/.test(file);
 const category=file.startsWith('basic-')?'basic':file.startsWith('divine-')?'divine':file.startsWith('horror-')?'macabre':file.startsWith('macabre-alt-')?'macabre_alt':'supreme';
 const timings={basic:[130,3600,.5],divine:[140,4200,.35],macabre:[145,3800,.4],macabre_alt:[145,4000,.3],supreme:[140,4200,.3]};
 const [walkMs,idleMs,breath]=timings[category];
 return {file,category,sourceRows:alternate?[0,2,3,1]:[0,1,2,3],walkOrder:[1,0,2,3],walkMs,idleMs,breath,anchor:[64,60],bodyHeight:46};
}
function getAnimationAtlas(img,idleImage=null){
 if(!img||!(img.naturalWidth||img.width))return null;
 if(animationCache.has(img)&&animationCache.get(img).idleSource===idleImage)return animationCache.get(img);
 const profile=animationProfile(img),sw=Math.floor((img.naturalWidth||img.width)/4),sh=Math.floor((img.naturalHeight||img.height)/4);
 const scan=create();scan.width=sw*4;scan.height=sh*4;const sc=scan.getContext('2d',{willReadFrequently:true});sc.drawImage(img,0,0);
 const pixels=sc.getImageData(0,0,scan.width,scan.height).data,sourceWidth=scan.width;
 const cw=HUMAN_W*HUMAN_SCALE,ch=HUMAN_H*HUMAN_SCALE;
 const sheet=create();sheet.width=HUMAN_COLS*cw;sheet.height=14*ch;const target=sheet.getContext('2d');
 const cell=create();cell.width=cw;cell.height=ch;const cc=cell.getContext('2d',{willReadFrequently:true});cc.imageSmoothingEnabled=false;
 const idleFrames=idleImage?normalizedIdleFrames(idleImage):null;
 const bounds=[],referenceHeads=[];
 function put(data,index){target.putImageData(data,(index%HUMAN_COLS)*cw,Math.floor(index/HUMAN_COLS)*ch);}
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const sourceRow=profile.sourceRows[row];let left=sw,top=sh,right=-1,bottom=-1;
  for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)if(pixels[((sourceRow*sh+y)*sourceWidth+col*sw+x)*4+3]>32){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
  if(right<left)throw new Error('Empty human pose: '+profile.file+' '+row+':'+col);
  const bw=right-left+1,bh=bottom-top+1;
  // Anatomical pivot: opaque head mass, not the center of a changing cape/tail.
  const histogram=new Uint32Array(sw);let mass=0;
  for(let y=top;y<top+Math.ceil(bh*.27);y++)for(let x=left;x<=right;x++)if(pixels[((sourceRow*sh+y)*sourceWidth+col*sw+x)*4+3]>128){histogram[x]++;mass++;}
  let accumulated=0,headX=(left+right)/2;for(let x=left;x<=right;x++){accumulated+=histogram[x];if(accumulated>=mass/2){headX=x+.5;break;}}
  const calibrated=calibrateRasterPose(cc,img,[col*sw+left,sourceRow*sh+top,bw,bh],headX-left,cw,ch);
  const ratio=calibrated.scale,dw=bw*ratio,dh=bh*ratio,destinationX=calibrated.x;
  const authored=calibrated.data,pose=row*4+col;
  // Pose 0 is the approved visual reference for this character/look/view.
  // Lock its original head pixels across WALK/IDLE instead of distorting a
  // differently sized head or letting transparent margins move the face.
  if(col===0){
   const limit=34*HUMAN_SCALE,head=new Uint8ClampedArray(limit*cw*4);let first=limit;
   for(let py=0;py<limit;py++)for(let px=0;px<cw;px++)if(authored.data[(py*cw+px)*4+3]>32)first=Math.min(first,py);
   const offset=14*HUMAN_SCALE-first;
   for(let py=0;py<limit;py++)if(py+offset>=0&&py+offset<limit)head.set(authored.data.subarray(py*cw*4,(py+1)*cw*4),(py+offset)*cw*4);
   referenceHeads[row]=head;authored.data.set(head,0);
  }
  else authored.data.set(referenceHeads[row],0);
  put(authored,pose);
  bounds.push({row,col,sourceRow,source:[left,top,bw,bh],destination:[destinationX,calibrated.y,dw,dh],headAnchor:headX,headReferenceCol:0,uniformScale:ratio,soleY:120});
  // Complementary neutral body art is opt-in and must be visually approved.
  // Without it, keep an explicitly provisional authored pose; never warp boots.
  const neutral=cc.createImageData(cw,ch);neutral.data.set(idleFrames?idleFrames[row].data:authored.data);
  // Keep the approved original head/face exactly, even for complementary body art.
  neutral.data.set(authored.data.slice(0,34*HUMAN_SCALE*cw*4),0);
  put(blendPose(cc,authored,neutral,.5),16+pose*2);put(neutral,17+pose*2);
  const base=neutral;
  // Controlled torso-only breathing. The head/face and lower legs are copied
  // byte-for-byte; no limb strip shifting, whole-body bounce or sprite stretching.
  for(let breath=0;breath<4;breath++){
   const level=[0,.5,1,.5][breath],data=cc.createImageData(cw,ch);data.data.set(base.data);
   const y0=34*HUMAN_SCALE,y1=49*HUMAN_SCALE;
   for(let y=y0;y<y1;y++){
    const dy=Math.sin((y-y0)/(y1-y0)*Math.PI)*profile.breath*HUMAN_SCALE*level;
    const sy=Math.min(y1-1,y+dy),a=Math.floor(sy),b=Math.min(y1-1,a+1),mix=sy-a;
    for(let x=0;x<cw;x++){
     const dest=(y*cw+x)*4,pa=(a*cw+x)*4,pb=(b*cw+x)*4;
     const aa=base.data[pa+3]/255,ab=base.data[pb+3]/255,alpha=aa*(1-mix)+ab*mix;
     for(let k=0;k<3;k++)data.data[dest+k]=alpha?(base.data[pa+k]*aa*(1-mix)+base.data[pb+k]*ab*mix)/alpha:0;
     data.data[dest+3]=alpha*255;
    }
   }
   put(data,48+pose*4+breath);
  }
 }
 scan.width=scan.height=1;
 const pack={image:sheet,profile,cellWidth:cw,cellHeight:ch,columns:HUMAN_COLS,bounds,idleSource:idleImage,idleArtStatus:idleImage?(String(idleImage.src).includes('/idle-v2/')?'approved-neutral-art':'sample-art'):'awaiting-neutral-art',compiledStatus:'source'};
 animationCache.set(img,pack);
 // Final lossless sheets are the production fast path after loading. The exact
 // same cached builder is a safe fallback; changing the backing image never
 // resets the actor's clock or direction. One request per look, never per frame.
 const sourceURL=String(img.currentSrc||img.src||'');
 if(!idleImage&&!W.PsyHumanAnimationBuild&&typeof Image!=='undefined'&&sourceURL.includes('/characters/halloween/')){
  const compiled=new Image();pack.compiledStatus='loading';
  compiled.onload=()=>{if(compiled.naturalWidth===sheet.width&&compiled.naturalHeight===sheet.height){pack.image=compiled;pack.compiledStatus='ready';pack.idleArtStatus='approved-neutral-art';}else pack.compiledStatus='source-fallback';compiled.onload=compiled.onerror=null;};
  compiled.onerror=()=>{pack.compiledStatus='source-fallback';compiled.onload=compiled.onerror=null;};
  compiled.src=sourceURL.replace('/characters/halloween/','/characters/animation-v2/').replace(/\?.*$/,'')+'?build=HUMAN_ANIMATION_V2_20261107';
 }
 return pack;
}
function calibrateRasterPose(ctx,img,rect,headOffset,w,h){
 const target=46*HUMAN_SCALE,sole=60*HUMAN_SCALE,initial=target/rect[3];
 let best=null;
 // Uniform scale only. Small bounded sampling-phase corrections compensate
 // for nearest-neighbor quantization of thin hair/boot pixels, not anatomy.
 for(const phase of [0,.25,-.25,.5,-.5]){
  let low=initial*.96,high=initial*1.04;
  for(let attempt=0;attempt<8;attempt++){
   const scale=attempt===0?initial:(low+high)/2,x=w/2-headOffset*scale,y=sole-rect[3]*scale+phase;
   ctx.clearRect(0,0,w,h);ctx.drawImage(img,...rect,x,y,rect[2]*scale,rect[3]*scale);
   const data=ctx.getImageData(0,0,w,h);let top=h,bottom=0;
   for(let py=0;py<h;py++)for(let px=0;px<w;px++)if(data.data[(py*w+px)*4+3]>32){top=Math.min(top,py);bottom=Math.max(bottom,py+1);}
   const height=bottom-top,candidate={data,scale,x,y,bottom,height};
   if(!best||Math.abs(height-target)<Math.abs(best.height-target))best=candidate;
   if(height===target){best=candidate;break;}
   if(height<target)low=scale;else high=scale;
  }
  if(best.height===target)break;
 }
 // Keep the closest uniform fit if a thin antialiased tip quantizes by one
 // pixel. The approved head layer and measured sole below set exact anchors.
 const offset=sole-best.bottom;
 if(offset){const aligned=ctx.createImageData(w,h);for(let py=0;py<h;py++)if(py+offset>=0&&py+offset<h)aligned.data.set(best.data.data.subarray(py*w*4,(py+1)*w*4),(py+offset)*w*4);best.data=aligned;best.y+=offset;}
 return best;
}
function normalizedIdleFrames(img){
 const strip=img.naturalWidth>=img.naturalHeight*3,sw=Math.floor(img.naturalWidth/4),sh=strip?img.naturalHeight:Math.floor(img.naturalHeight/4),cw=HUMAN_W*HUMAN_SCALE,ch=HUMAN_H*HUMAN_SCALE;
 const scan=create();scan.width=sw;scan.height=sh;const c=scan.getContext('2d',{willReadFrequently:true}),result=[];
 const target=create();target.width=cw;target.height=ch;const tc=target.getContext('2d',{willReadFrequently:true});tc.imageSmoothingEnabled=false;
 for(let row=0;row<4;row++){
  const sx=strip?row*sw:0,sy=strip?0:row*sh;
  c.clearRect(0,0,sw,sh);c.drawImage(img,sx,sy,sw,sh,0,0,sw,sh);const pixels=c.getImageData(0,0,sw,sh).data;
  let left=sw,top=sh,right=0,bottom=0;for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)if(pixels[(y*sw+x)*4+3]>32){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);}
  const histogram=new Uint32Array(sw);let mass=0;
  for(let y=top;y<top+Math.ceil((bottom-top)*.27);y++)for(let x=left;x<right;x++)if(pixels[(y*sw+x)*4+3]>128){histogram[x]++;mass++;}
  let count=0,headX=(left+right)/2;for(let x=left;x<right;x++){count+=histogram[x];if(count>=mass/2){headX=x+.5;break;}}
  result.push(calibrateRasterPose(tc,img,[sx+left,sy+top,right-left,bottom-top],headX-left,cw,ch).data);
 }
 return result;
}
function blendPose(ctx,from,to,amount){
 const result=ctx.createImageData(from.width,from.height);
 for(let i=0;i<from.data.length;i+=4){const a=from.data[i+3]/255,b=to.data[i+3]/255,alpha=a*(1-amount)+b*amount;for(let k=0;k<3;k++)result.data[i+k]=alpha?(from.data[i+k]*a*(1-amount)+to.data[i+k]*b*amount)/alpha:0;result.data[i+3]=alpha*255;}
 return result;
}
function createState(){return {time:null,identity:null,elapsed:0,idleElapsed:0,moving:false,settling:false,settleElapsed:0,settleSince:0,idleSince:null,walkSince:0,row:0,col:0,x:null,y:null,lastMotion:-Infinity};}
function sampleState(state,opt){
 const now=opt.now??W.performance.now(),identity=opt.identity||'',profile=opt.profile||{walkMs:130,idleMs:3600,walkOrder:[1,0,2,3]};
 const reset=state.time===null||identity!==state.identity;let dt=reset?0:now-state.time;
 if(reset){Object.assign(state,createState());state.identity=identity;state.idleSince=now;state.walkSince=now;}
 if(dt<0||dt>250){dt=0;state.elapsed=0;state.idleElapsed=0;state.moving=false;state.settling=false;state.idleSince=now;state.walkSince=now;}
 const positioned=Number.isFinite(opt.x)&&Number.isFinite(opt.y),known=state.x!==null;
 const displaced=positioned&&known&&Math.hypot(opt.x-state.x,opt.y-state.y)>.01;
 if(displaced)state.lastMotion=now;
 const moving=displaced||!!(opt.moving&&(!positioned||(opt.discrete&&now-state.lastMotion<=200)));
 if(Number.isInteger(opt.row)&&opt.row>=0&&opt.row<4)state.row=opt.row;
 if(moving){
  if(!state.moving)state.walkSince=now;state.elapsed=now-state.walkSince;
  state.col=profile.walkOrder[Math.floor(state.elapsed/profile.walkMs)%4];state.idleElapsed=0;state.settling=false;
 }else{
  if(state.moving){state.settling=true;state.settleSince=now;state.settleElapsed=0;state.idleSince=now+120;}
  else if(state.settling){state.settleElapsed=now-state.settleSince;if(state.settleElapsed>=120)state.settling=false;}
  state.idleElapsed=Math.max(0,now-state.idleSince);
 }
 state.moving=moving;state.time=now;state.x=positioned?opt.x:null;state.y=positioned?opt.y:null;
 return {state:moving?'walk':state.settling?'settle':'idle',settle:Math.min(2,Math.floor(state.settleElapsed/40)),row:state.row,col:state.col,breath:moving?0:Math.floor(state.idleElapsed/(profile.idleMs/4))%4,elapsed:state.elapsed};
}
function drawAnimated(ctx,pack,pose,x,y,width,height){
 if(!pack||pack.compiledStatus==='loading')return false;
 const row=Math.max(0,Math.min(3,pose.row|0)),col=Math.max(0,Math.min(3,pose.col|0));
 const source=row*4+col;
 const tile=pose.state==='idle'?48+source*4+(pose.breath%4):pose.state==='settle'&&pose.settle>0?16+source*2+Math.min(1,pose.settle-1):source;
 const scaleX=width/TW,scaleY=height/TH;
 ctx.imageSmoothingEnabled=false;
 ctx.drawImage(pack.image,(tile%pack.columns)*pack.cellWidth,Math.floor(tile/pack.columns)*pack.cellHeight,pack.cellWidth,pack.cellHeight,x+width/2-HUMAN_W*scaleX/2,y,HUMAN_W*scaleX,HUMAN_H*scaleY);
 return true;
}
function renderAnimated(ctx,pack,state,opt,x,y,width,height){
 const pose=sampleState(state,{...opt,profile:pack.profile});drawAnimated(ctx,pack,pose,x,y,width,height);return pose;
}

W.PsyTrainerWalkV1={getAtlas,column,draw,columns:sequence,cellWidth:TW,cellHeight:TH,getAnimationAtlas,animationProfile,createState,sampleState,drawAnimated,renderAnimated};
})(window,document);
