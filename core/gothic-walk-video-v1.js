/* PSYWORLD — Gothic Boy MP4 walk renderer.
 * Uses three dedicated cropped, keyframe-aligned H.264 MP4 decoders (front, left, back)
 * plus a single shared zero-seek standby relay decoder backed by single-download Blob URLs
 * so continuous looping never stalls on native EOF <video loop> seeking.
 * Right mirrors left cleanly in-canvas. No spritesheets or PNG sequences.
 */
(function(W,D){
'use strict';
if(W.PsyGothicWalkVideoV1)return;

const VW=320,VH=540,CLIP_FPS=30;
const CLIP_SPECS={
 front:{
  key:'front',
  url:'assets/characters/walk-video-v1/gothic-boy-walk-front.mp4?build=GOTHIC_MP4_WALK_V5',
  duration:1.033,
  frames:31,
  baseline:532
 },
 left:{
  key:'left',
  url:'assets/characters/walk-video-v1/gothic-boy-walk-left.mp4?build=GOTHIC_MP4_WALK_V5',
  duration:1.067,
  frames:32,
  baseline:530
 },
 back:{
  key:'back',
  url:'assets/characters/walk-video-v1/gothic-boy-walk-back.mp4?build=GOTHIC_MP4_WALK_V5',
  duration:0.967,
  frames:29,
  baseline:536
 }
};
const ROW_TO_CLIP=['front','left','left','back'];
const ranges=[
 [0,CLIP_SPECS.front.duration],
 [0,CLIP_SPECS.left.duration],
 [0,CLIP_SPECS.left.duration],
 [0,CLIP_SPECS.back.duration]
];

const IS_LE=(new Uint8Array(new Uint32Array([0x04030201]).buffer)[0]===0x01);

let row=0,wantedMoving=false,lastDraw=0,draws=0,decodedFrames=0,seeks=0,loopSwaps=0;
let activeKey='front',preparePromise=null,holder=null,watchdogId=0;
let handoffArmed=false;

// Shared WebGL chroma-key processor (GPU fast path; 2D Uint32Array fallback if software/unavailable).
const glCanvas=D.createElement('canvas');
glCanvas.width=VW;glCanvas.height=VH;
let gl=null,glProgram=null,glTex=null,glBroken=false,glClipKey=null;

function initWebGL(){
 if(gl||glBroken)return gl;
 try{
  const opts={alpha:true,premultipliedAlpha:true,antialias:false,preserveDrawingBuffer:true,depth:false,stencil:false};
  const ctx=glCanvas.getContext('webgl2',opts)||glCanvas.getContext('webgl',opts);
  if(!ctx){glBroken=true;return null;}
  const dbg=ctx.getExtension('WEBGL_debug_renderer_info');
  const renderer=String((dbg&&ctx.getParameter(dbg.UNMASKED_RENDERER_WEBGL))||ctx.getParameter(ctx.RENDERER)||'');
  if(/swiftshader|llvmpipe|software|basic render driver/i.test(renderer)){glBroken=true;return null;}
  glCanvas.addEventListener('webglcontextlost',e=>{e.preventDefault();glBroken=true;gl=null;},false);
  const vsSrc='attribute vec2 aPos;varying vec2 vUv;void main(){vUv=vec2(aPos.x*0.5+0.5,0.5-aPos.y*0.5);gl_Position=vec4(aPos,0.0,1.0);}';
  const fsSrc=`precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex;
void main(){
 vec3 key=texture2D(uTex,vec2(${(0.5/VW).toFixed(6)},${(0.5/VH).toFixed(6)})).rgb;
 vec3 c=texture2D(uTex,vUv).rgb;
 float excess=max(0.0039215686,key.g-max(key.r,key.b)-0.0156862745);
 float ge=c.g-max(c.r,c.b)-0.0156862745;
 float alpha=1.0-clamp(ge/excess,0.0,1.0);
 if(alpha<0.05){gl_FragColor=vec4(0.0);return;}
 if(alpha>0.985)alpha=1.0;
 float safe=max(0.05,alpha);
 vec3 straight=clamp((c-key*(1.0-alpha))/safe,0.0,1.0);
 gl_FragColor=vec4(straight*alpha,alpha);
}`;
  const compile=(type,src)=>{
   const s=ctx.createShader(type);ctx.shaderSource(s,src);ctx.compileShader(s);
   if(!ctx.getShaderParameter(s,ctx.COMPILE_STATUS))return null;
   return s;
  };
  const vs=compile(ctx.VERTEX_SHADER,vsSrc),fs=compile(ctx.FRAGMENT_SHADER,fsSrc);
  if(!vs||!fs){glBroken=true;return null;}
  const prog=ctx.createProgram();ctx.attachShader(prog,vs);ctx.attachShader(prog,fs);ctx.linkProgram(prog);
  if(!ctx.getProgramParameter(prog,ctx.LINK_STATUS)){glBroken=true;return null;}
  const buf=ctx.createBuffer();ctx.bindBuffer(ctx.ARRAY_BUFFER,buf);
  ctx.bufferData(ctx.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),ctx.STATIC_DRAW);
  const loc=ctx.getAttribLocation(prog,'aPos');
  ctx.enableVertexAttribArray(loc);ctx.vertexAttribPointer(loc,2,ctx.FLOAT,false,0,0);
  const tex=ctx.createTexture();ctx.bindTexture(ctx.TEXTURE_2D,tex);
  ctx.texParameteri(ctx.TEXTURE_2D,ctx.TEXTURE_MIN_FILTER,ctx.NEAREST);
  ctx.texParameteri(ctx.TEXTURE_2D,ctx.TEXTURE_MAG_FILTER,ctx.NEAREST);
  ctx.texParameteri(ctx.TEXTURE_2D,ctx.TEXTURE_WRAP_S,ctx.CLAMP_TO_EDGE);
  ctx.texParameteri(ctx.TEXTURE_2D,ctx.TEXTURE_WRAP_T,ctx.CLAMP_TO_EDGE);
  ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL,false);
  ctx.useProgram(prog);ctx.uniform1i(ctx.getUniformLocation(prog,'uTex'),0);
  ctx.viewport(0,0,VW,VH);
  gl=ctx;glProgram=prog;glTex=tex;
  return gl;
 }catch(_){glBroken=true;return null;}
}

function renderClipWebGL(clip){
 const ctx=initWebGL(),v=clip.slot.video;
 if(!ctx||v.readyState<2)return false;
 try{
  ctx.bindTexture(ctx.TEXTURE_2D,glTex);
  ctx.texImage2D(ctx.TEXTURE_2D,0,ctx.RGBA,ctx.RGBA,ctx.UNSIGNED_BYTE,v);
  ctx.clearColor(0,0,0,0);
  ctx.clear(ctx.COLOR_BUFFER_BIT);
  ctx.drawArrays(ctx.TRIANGLE_STRIP,0,4);
  glClipKey=clip.key;
  return true;
 }catch(_){
  glBroken=true;
  return false;
 }
}

function ensureHolder(){
 if(holder||!D.body)return holder;
 holder=D.createElement('div');
 holder.setAttribute('aria-hidden','true');
 holder.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px;opacity:0.001;pointer-events:none;overflow:hidden;z-index:-1;';
 D.body.appendChild(holder);
 return holder;
}

function createSlot(tag,ownerClip){
 const video=D.createElement('video');
 video.muted=true;video.defaultMuted=true;video.playsInline=true;video.loop=false;video.preload='auto';
 video.setAttribute('playsinline','');video.setAttribute('muted','');
 video.setAttribute('aria-hidden','true');
 video.style.cssText='width:1px;height:1px;display:block;';
 const hasVfc=typeof video.requestVideoFrameCallback==='function';
 const slot={
  tag,
  video,
  hasVfc,
  owner:ownerClip||null,
  attached:false,
  keyLoaded:'',
  urlLoaded:'',
  failed:false,
  playPending:false,
  playToken:0,
  frameDirty:false,
  vfcArmed:false,
  lastMediaTime:-1,
  lastPresentedFrames:-1,
  primed:false
 };
 function onFrame(now,meta){
  slot.vfcArmed=false;
  const mediaChanged=!meta||meta.presentedFrames!==slot.lastPresentedFrames||Math.abs(meta.mediaTime-slot.lastMediaTime)>1e-4;
  if(mediaChanged){
   slot.frameDirty=true;
   if(meta){
    slot.lastMediaTime=meta.mediaTime;
    slot.lastPresentedFrames=meta.presentedFrames;
   }
  }
  if(!slot.video.paused&&!slot.failed&&slot.hasVfc){
   slot.vfcArmed=true;
   video.requestVideoFrameCallback(onFrame);
  }
 }
 slot.scheduleVfc=()=>{
  if(slot.vfcArmed||slot.failed||!slot.hasVfc)return;
  slot.vfcArmed=true;
  video.requestVideoFrameCallback(onFrame);
 };

 video.addEventListener('error',()=>{
  if(!slot.urlLoaded)return;
  slot.failed=true;slot.playPending=false;
 });
 video.addEventListener('seeked',()=>{
  const c=slot.owner;
  if(c&&c.slot===slot&&c.ready)seeks++;
  slot.frameDirty=true;
 });
 video.addEventListener('loadeddata',()=>{
  const c=slot.owner;
  if(c&&c.slot===slot&&!c.hasFrame)capture2D(c,true);
 });
 video.addEventListener('canplay',()=>{
  const c=slot.owner;
  if(c&&c.slot===slot&&!c.hasFrame)capture2D(c,true);
 });
 video.addEventListener('canplaythrough',()=>{
  const c=slot.owner;
  if(c&&c.slot===slot&&!c.hasFrame)capture2D(c,true);
 });
 video.addEventListener('timeupdate',()=>{if(performance.now()-lastDraw>1300)pauseAll();});
 return slot;
}

function createClip(spec){
 const canvas=D.createElement('canvas');canvas.width=VW;canvas.height=VH;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 const zeroCanvas=D.createElement('canvas');zeroCanvas.width=VW;zeroCanvas.height=VH;
 const zeroCtx=zeroCanvas.getContext('2d');
 const clip={
  key:spec.key,
  url:spec.url,
  mediaUrl:'',
  fetchPromise:null,
  duration:spec.duration,
  frameCount:spec.frames||30,
  baseline:spec.baseline||532,
  canvas,
  ctx,
  zeroCanvas,
  zeroCtx,
  hasZero:false,
  holdZeroUntilNextVfc:false,
  ready:false,
  hasFrame:false,
  failed:false,
  lastCapturedTime:-1,
  lastFrameIdx:-1,
  slot:null
 };
 clip.slot=createSlot(spec.key,clip);
 return clip;
}

const clips={
 front:createClip(CLIP_SPECS.front),
 left:createClip(CLIP_SPECS.left),
 back:createClip(CLIP_SPECS.back)
};
const clipList=[clips.front,clips.left,clips.back];
let standbySlot=createSlot('standby',null);

function fetchClipMedia(clip){
 if(clip.mediaUrl)return Promise.resolve(clip.mediaUrl);
 if(clip.fetchPromise)return clip.fetchPromise;
 if(typeof W.fetch!=='function'||typeof W.URL?.createObjectURL!=='function'){
  clip.mediaUrl=clip.url;
  return Promise.resolve(clip.mediaUrl);
 }
 clip.fetchPromise=W.fetch(clip.url).then(res=>{
  if(!res||!res.ok)throw new Error('HTTP '+(res?.status||0));
  return res.blob();
 }).then(blob=>{
  clip.mediaUrl=W.URL.createObjectURL(blob);
  return clip.mediaUrl;
 }).catch(()=>{
  clip.mediaUrl=clip.url;
  return clip.mediaUrl;
 });
 return clip.fetchPromise;
}

function liveFrameIndexFor(clip){
 const n=clip.frameCount||30,slot=clip.slot;
 const idx=Math.floor((slot.video.currentTime||0)*CLIP_FPS+1e-4);
 return Math.max(0,Math.min(n-1,idx));
}

function capture2D(clip,allowInitialCount){
 const slot=clip.slot,v=slot.video;
 if(v.readyState<2||v.seeking||slot.failed)return false;
 const ctx=clip.ctx;
 ctx.clearRect(0,0,VW,VH);
 ctx.drawImage(v,0,0,VW,VH);
 const img=ctx.getImageData(0,0,VW,VH),d=img.data;
 const kr=d[0],kg=d[1],kb=d[2],ka=d[3];
 const cIdx=((VH>>1)*VW+(VW>>1))<<2;
 if((kr|kg|kb|ka)===0&&(d[cIdx]|d[cIdx+1]|d[cIdx+2]|d[cIdx+3])===0)return false;
 const excess=Math.max(1,kg-Math.max(kr,kb)-4);
 if(IS_LE){
  const buf=new Uint32Array(d.buffer);
  for(let i=0,n=buf.length;i<n;i++){
   const p=buf[i],r=p&255,g=(p>>>8)&255,b=(p>>>16)&255;
   const ge=g-(r>b?r:b)-4;
   if(ge>=excess){buf[i]=0;continue;}
   if(ge<=0){if((p>>>24)!==255)buf[i]=p|0xff000000;continue;}
   let alpha=1-ge/excess;
   if(alpha<.05){buf[i]=0;continue;}
   if(alpha>.985){if((p>>>24)!==255)buf[i]=p|0xff000000;continue;}
   const safe=Math.max(.05,alpha);
   const nr=Math.max(0,Math.min(255,((r-kr*(1-alpha))/safe)+.5))|0;
   const ng=Math.max(0,Math.min(255,((g-kg*(1-alpha))/safe)+.5))|0;
   const nb=Math.max(0,Math.min(255,((b-kb*(1-alpha))/safe)+.5))|0;
   const na=(alpha*255+.5)|0;
   buf[i]=nr|(ng<<8)|(nb<<16)|(na<<24);
  }
 }else{
  for(let i=0;i<d.length;i+=4){
   let alpha=1-Math.max(0,Math.min(1,(d[i+1]-Math.max(d[i],d[i+2])-4)/excess));
   if(alpha<.05){d[i]=d[i+1]=d[i+2]=d[i+3]=0;continue;}
   if(alpha>.985){d[i+3]=255;continue;}
   const safe=Math.max(.05,alpha);
   d[i]=Math.max(0,Math.min(255,(d[i]-kr*(1-alpha))/safe));
   d[i+1]=Math.max(0,Math.min(255,(d[i+1]-kg*(1-alpha))/safe));
   d[i+2]=Math.max(0,Math.min(255,(d[i+2]-kb*(1-alpha))/safe));
   d[i+3]=Math.round(alpha*255);
  }
 }
 ctx.putImageData(img,0,0);
 const firstCapture=!clip.hasFrame;
 const liveIdx=liveFrameIndexFor(clip);
 const isNewFrame=slot.frameDirty||liveIdx!==clip.lastFrameIdx||Math.abs(v.currentTime-clip.lastCapturedTime)>(0.4/CLIP_FPS);
 if(!clip.hasZero&&liveIdx===0&&v.currentTime<0.025){
  clip.zeroCtx.clearRect(0,0,VW,VH);
  clip.zeroCtx.drawImage(clip.canvas,0,0);
  clip.hasZero=true;
 }
 clip.hasFrame=true;
 clip.lastFrameIdx=liveIdx;
 clip.lastCapturedTime=v.currentTime;
 slot.frameDirty=false;
 if((firstCapture&&allowInitialCount)||(!firstCapture&&isNewFrame))decodedFrames++;
 return true;
}

function attachSlot(slot,srcUrl,key){
 const host=ensureHolder();
 if(!host)return false;
 if(!slot.attached){
  slot.attached=true;
  host.appendChild(slot.video);
 }
 if(slot.urlLoaded!==srcUrl){
  slot.failed=false;
  slot.keyLoaded=key;
  slot.urlLoaded=srcUrl;
  slot.lastMediaTime=-1;
  slot.lastPresentedFrames=-1;
  slot.frameDirty=false;
  slot.video.src=srcUrl;
  slot.video.load();
 }
 return true;
}

function attachAll(){
 if(!D.body)return false;
 for(const clip of clipList){
  if(clip.mediaUrl)attachSlot(clip.slot,clip.mediaUrl,clip.key);
 }
 return true;
}

function primeClipFrame(clip){
 const slot=clip.slot,v=slot.video;
 if(slot.primed||clip.hasFrame||slot.failed)return Promise.resolve(clip.hasFrame);
 slot.primed=true;
 return new Promise(resolve=>{
  const p=v.play();
  Promise.resolve(p).then(()=>{
   setTimeout(()=>{
    try{v.pause();v.currentTime=0;}catch(_){}
    capture2D(clip,true);
    resolve(clip.hasFrame);
   },32);
  }).catch(()=>{resolve(clip.hasFrame);});
 });
}

function prepareClip(clip){
 return fetchClipMedia(clip).then(srcUrl=>new Promise(resolve=>{
  let settled=false,softTimer=0;
  const slot=clip.slot,v=slot.video;
  const finish=()=>{
   if(settled)return;
   settled=true;
   clearTimeout(timer);
   clearTimeout(softTimer);
   for(const ev of ['loadeddata','canplay','canplaythrough','error'])v.removeEventListener(ev,check);
   clip.failed=slot.failed;
   resolve(clip.ready||clip.failed);
  };
  const check=()=>{
   if(slot.failed){finish();return;}
   attachSlot(slot,srcUrl,clip.key);
   if(v.readyState>=2&&!clip.hasFrame)capture2D(clip,true);
   if(v.readyState>=3&&clip.hasFrame){clip.ready=true;finish();return;}
   if(v.readyState>=2&&clip.hasFrame&&!softTimer){
    softTimer=setTimeout(()=>{if(!slot.failed&&clip.hasFrame){clip.ready=true;}finish();},2000);
   }
   if(v.readyState>=2&&!clip.hasFrame&&!slot.primed){
    primeClipFrame(clip).then(()=>{
     if(clip.hasFrame&&v.readyState>=2){clip.ready=true;finish();}
    });
   }
  };
  const timer=setTimeout(()=>{
   if(!slot.failed&&v.readyState>=2){
    if(!clip.hasFrame)capture2D(clip,true);
    if(clip.hasFrame)clip.ready=true;
   }
   finish();
  },12000);
  if(D.body){
   attachSlot(slot,srcUrl,clip.key);
   if(v.readyState>=2&&!clip.hasFrame)capture2D(clip,true);
   if(v.readyState>=3&&clip.hasFrame){clip.ready=true;finish();return;}
  }
  for(const ev of ['loadeddata','canplay','canplaythrough','error'])v.addEventListener(ev,check);
 }));
}

function prepare(){
 if(preparePromise)return preparePromise;
 preparePromise=new Promise(resolve=>{
  const start=()=>{
   Promise.all(clipList.map(prepareClip)).then(()=>{
    if(clips.front.mediaUrl)attachSlot(standbySlot,clips.front.mediaUrl,'front');
    if(!glBroken&&clips.front.ready&&clips.front.slot.video.readyState>=2){
     renderClipWebGL(clips.front);
    }
    resolve(status());
   });
  };
  if(D.body)start();
  else D.addEventListener('DOMContentLoaded',start,{once:true});
 });
 return preparePromise;
}

function pauseSlot(slot){
 slot.playToken++;
 slot.playPending=false;
 if(!slot.video.paused){
  try{slot.video.pause();}catch(_){}
 }
}

function resetStandby(){
 handoffArmed=false;
 pauseSlot(standbySlot);
 if(standbySlot.attached&&standbySlot.video.readyState>=1&&standbySlot.video.currentTime>0.001){
  try{standbySlot.video.currentTime=0;}catch(_){}
  standbySlot.lastMediaTime=0;standbySlot.lastPresentedFrames=-1;standbySlot.frameDirty=false;
 }
}

function pauseClip(clip){
 pauseSlot(clip.slot);
}

function pauseAll(){
 wantedMoving=false;
 for(const clip of clipList)pauseClip(clip);
 resetStandby();
 stopWatchdog();
}

function playSlot(slot,isStandby){
 const v=slot.video;
 if(!wantedMoving||slot.failed||v.readyState<2||v.ended)return;
 slot.scheduleVfc();
 if(!v.paused||slot.playPending)return;
 slot.playPending=true;
 const token=++slot.playToken;
 try{
  v.defaultPlaybackRate=1;
  v.playbackRate=1;
  const p=v.play();
  Promise.resolve(p).then(()=>{
   slot.playPending=false;
   if(token!==slot.playToken||!wantedMoving||D.hidden){
    try{v.pause();}catch(_){}
    return;
   }
   const clip=isStandby?clips[activeKey]:slot.owner;
   if(!clip||activeKey!==clip.key||(clip.slot!==slot&&(!isStandby||!handoffArmed))){
    try{v.pause();}catch(_){}
    return;
   }
   slot.scheduleVfc();
  }).catch(()=>{slot.playPending=false;});
 }catch(_){slot.playPending=false;}
}

function ensureStandbyForClip(clip){
 if(!clip.ready||!clip.mediaUrl||!D.body)return;
 if(standbySlot.keyLoaded!==clip.key||standbySlot.urlLoaded!==clip.mediaUrl){
  handoffArmed=false;
  pauseSlot(standbySlot);
  standbySlot.owner=null;
  attachSlot(standbySlot,clip.mediaUrl,clip.key);
 }
}

function stepLoopHandoff(clip){
 const cur=clip.slot,v=cur.video;
 if(!wantedMoving||!clip.ready||cur.failed||v.readyState<2)return;
 ensureStandbyForClip(clip);
 const dur=Number.isFinite(v.duration)&&v.duration>0?v.duration:clip.duration;
 const ct=v.currentTime||0;
 if(!handoffArmed&&standbySlot.keyLoaded===clip.key&&standbySlot.video.paused&&!standbySlot.video.seeking&&(standbySlot.video.ended||standbySlot.video.currentTime>0.04)){
  try{standbySlot.video.currentTime=0;}catch(_){}
 }
 const minReady=standbySlot.urlLoaded.startsWith('blob:')?2:3;
 const standbyReady=standbySlot.keyLoaded===clip.key&&!standbySlot.failed&&!standbySlot.video.seeking&&!standbySlot.video.ended&&standbySlot.video.readyState>=minReady&&standbySlot.video.currentTime<0.05;
 if(!handoffArmed&&!v.paused&&!v.ended&&ct>=dur-0.025){
  if(standbyReady){
   handoffArmed=true;
   standbySlot.frameDirty=false;
   standbySlot.lastMediaTime=-1;
   standbySlot.lastPresentedFrames=-1;
   playSlot(standbySlot,true);
  }
 }
 if(handoffArmed){
  const standbyAdvanced=standbySlot.frameDirty&&standbySlot.lastMediaTime>=0.025;
  if(v.ended||ct>=dur-0.008||(ct>=dur-0.015&&standbyAdvanced)){
   const old=cur;
   clip.slot=standbySlot;
   clip.slot.owner=clip;
   standbySlot=old;
   standbySlot.owner=null;
   handoffArmed=false;
   glClipKey=null;
   loopSwaps++;
   if(standbyAdvanced){
    clip.holdZeroUntilNextVfc=false;
    clip.slot.frameDirty=true;
   }else{
    clip.holdZeroUntilNextVfc=clip.hasZero;
    clip.lastFrameIdx=0;
    clip.lastCapturedTime=0;
    if(clip.hasZero)decodedFrames++;
   }
   pauseSlot(standbySlot);
   if(standbySlot.video.readyState>=1&&(standbySlot.video.ended||standbySlot.video.currentTime>0.001)){
    try{standbySlot.video.currentTime=0;}catch(_){}
   }
   standbySlot.lastMediaTime=0;
   standbySlot.lastPresentedFrames=-1;
   standbySlot.frameDirty=false;
   clip.slot.scheduleVfc();
   if(clip.slot.video.paused)playSlot(clip.slot,false);
  }
 }else if(v.ended||ct>=dur-0.008){
  if(standbyReady){
   const old=cur;
   clip.slot=standbySlot;
   clip.slot.owner=clip;
   standbySlot=old;
   standbySlot.owner=null;
   glClipKey=null;
   loopSwaps++;
   clip.holdZeroUntilNextVfc=clip.hasZero;
   clip.lastFrameIdx=0;
   clip.lastCapturedTime=0;
   if(clip.hasZero)decodedFrames++;
   pauseSlot(standbySlot);
   if(standbySlot.video.readyState>=1&&(standbySlot.video.ended||standbySlot.video.currentTime>0.001)){
    try{standbySlot.video.currentTime=0;}catch(_){}
   }
   standbySlot.lastMediaTime=0;
   standbySlot.lastPresentedFrames=-1;
   standbySlot.frameDirty=false;
   playSlot(clip.slot,false);
  }else if(v.ended&&!v.seeking){
   try{v.currentTime=0;}catch(_){}
   playSlot(cur,false);
  }
 }
}

function ensureWatchdog(){
 if(watchdogId)return;
 watchdogId=W.setInterval(()=>{
  if(performance.now()-lastDraw>1200)pauseAll();
 },350);
}
function stopWatchdog(){
 if(watchdogId){W.clearInterval(watchdogId);watchdogId=0;}
}

function draw(target,pose,x,y,width,height){
 if(!preparePromise)prepare();
 else if(D.body)attachAll();
 lastDraw=performance.now();
 wantedMoving=pose?.state==='walk';
 const next=Math.max(0,Math.min(3,(pose?.row|0)||0));
 row=next;
 const clipKey=ROW_TO_CLIP[row];
 const switchedClip=activeKey!==clipKey;
 activeKey=clipKey;
 const clip=clips[clipKey];

 if(switchedClip&&handoffArmed){
  resetStandby();
 }
 for(const other of clipList){
  if(other!==clip)pauseClip(other);
 }

 if(wantedMoving){
  stepLoopHandoff(clip);
  playSlot(clip.slot,false);
  ensureWatchdog();
 }else{
  pauseClip(clip);
  resetStandby();
  stopWatchdog();
 }

 const slot=clip.slot,v=slot.video;
 if(!clip.hasFrame&&v.readyState>=2){
  capture2D(clip,true);
 }
 if(!clip.hasFrame)return false;

 if(clip.holdZeroUntilNextVfc){
  const liveReady=(slot.hasVfc&&slot.lastMediaTime>=0.025)||(!slot.hasVfc&&v.currentTime>=0.025)||v.currentTime>=0.045;
  if(liveReady||!wantedMoving){
   if(liveReady){clip.holdZeroUntilNextVfc=false;slot.frameDirty=true;}
  }else if(clip.hasZero){
   target.save();
   target.imageSmoothingEnabled=true;
   target.imageSmoothingQuality='high';
   const h=height*1.2,w=h*VW/VH,foot=y+height*60/64;
   target.translate(x+width/2,foot);
   if(row===2)target.scale(-1,1);
   target.drawImage(clip.zeroCanvas,-w/2,-h*clip.baseline/VH,w,h);
   target.restore();
   draws++;
   return true;
  }
 }

 const liveIdx=liveFrameIndexFor(clip);
 const vfcActive=slot.hasVfc&&slot.lastPresentedFrames>=0&&!v.paused;
 const frameAdvanced=vfcActive?slot.frameDirty:(slot.frameDirty||liveIdx!==clip.lastFrameIdx);
 let sourceCanvas=clip.canvas;

 if(!glBroken&&initWebGL()){
  if(v.readyState>=2&&!v.seeking){
   const needGl=glClipKey!==clip.key||frameAdvanced;
   if(needGl){
    if(renderClipWebGL(clip)){
     slot.frameDirty=false;
     clip.lastFrameIdx=liveIdx;
     clip.lastCapturedTime=v.currentTime;
     if(frameAdvanced)decodedFrames++;
     sourceCanvas=glCanvas;
    }else{
     sourceCanvas=clip.canvas;
    }
   }else{
    sourceCanvas=glCanvas;
   }
  }else if(glClipKey===clip.key){
   sourceCanvas=glCanvas;
  }
 }else{
  if(frameAdvanced&&v.readyState>=2&&!v.seeking){
   capture2D(clip,false);
  }
  sourceCanvas=clip.canvas;
 }

 if(!clip.hasFrame&&sourceCanvas===clip.canvas)return false;

 target.save();
 target.imageSmoothingEnabled=true;
 target.imageSmoothingQuality='high';
 const h=height*1.2,w=h*VW/VH,foot=y+height*60/64;
 target.translate(x+width/2,foot);
 if(row===2)target.scale(-1,1);
 target.drawImage(sourceCanvas,-w/2,-h*clip.baseline/VH,w,h);
 target.restore();
 draws++;
 return true;
}

for(const ev of ['pointerdown','keydown']){
 D.addEventListener(ev,()=>{if(wantedMoving)playSlot(clips[activeKey].slot,false);},{passive:true});
}
D.addEventListener('visibilitychange',()=>{
 if(D.hidden)pauseAll();
 else if(wantedMoving)playSlot(clips[activeKey].slot,false);
});

function readyCount(){
 return (clips.front.ready?1:0)+(clips.left.ready?1:0)+(clips.back.ready?1:0);
}

function status(){
 const active=clips[activeKey],v=active.slot.video;
 const count=readyCount();
 const anyFailed=clipList.some(c=>c.failed||c.slot.failed);
 const allFailed=clipList.every(c=>c.failed||c.slot.failed);
 return {
  source:active.url,
  sources:CLIP_SPECS,
  clip:active.key,
  row,
  moving:wantedMoving,
  playing:!v.paused&&!active.slot.failed,
  ready:count===clipList.length&&!anyFailed,
  readyCount:count,
  clipCount:clipList.length,
  readyState:v.readyState,
  seeking:v.seeking,
  time:v.currentTime,
  duration:active.duration,
  failed:allFailed||active.failed||active.slot.failed,
  draws,
  decodedFrames,
  seeks,
  loopSwaps,
  mirrored:row===2,
  chromaBackend:glBroken?'cpu-uint32':'webgl',
  clips:{
   front:{ready:clips.front.ready,readyState:clips.front.slot.video.readyState,paused:clips.front.slot.video.paused,time:clips.front.slot.video.currentTime,hasFrame:clips.front.hasFrame},
   left:{ready:clips.left.ready,readyState:clips.left.slot.video.readyState,paused:clips.left.slot.video.paused,time:clips.left.slot.video.currentTime,hasFrame:clips.left.hasFrame},
   back:{ready:clips.back.ready,readyState:clips.back.slot.video.readyState,paused:clips.back.slot.video.paused,time:clips.back.slot.video.currentTime,hasFrame:clips.back.hasFrame}
  }
 };
}

W.PsyGothicWalkVideoV1={
 draw,
 prepare,
 ranges,
 get video(){return clips[activeKey].slot.video;},
 videos:{
  get front(){return clips.front.slot.video;},
  get left(){return clips.left.slot.video;},
  get back(){return clips.back.slot.video;}
 },
 status
};
})(window,document);
