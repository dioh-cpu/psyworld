/* PSYWORLD — Gothic Boy MP4 walk renderer.
 * Uses three dedicated cropped, keyframe-aligned H.264 MP4 decoders (front, left, back);
 * right mirrors left cleanly in-canvas. No spritesheets or PNG sequences.
 */
(function(W,D){
'use strict';
if(W.PsyGothicWalkVideoV1)return;

const VW=320,VH=540;
const CLIP_SPECS={
 front:{
  key:'front',
  url:'assets/characters/walk-video-v1/gothic-boy-walk-front.mp4',
  duration:1.292,
  baselines:[532,530,528,526,528,532,528,530,532,532,536,540,540,540,538,534,532,530,528,526,532,534,526,530,532,532,538,540,540,540,538]
 },
 left:{
  key:'left',
  url:'assets/characters/walk-video-v1/gothic-boy-walk-left.mp4',
  duration:1.334,
  baselines:[532,532,532,532,532,532,532,532,532,532,532,530,530,526,522,522,524,524,524,522,522,524,526,528,528,532,532,532,532,532,532,532]
 },
 back:{
  key:'back',
  url:'assets/characters/walk-video-v1/gothic-boy-walk-back.mp4',
  duration:1.250,
  baselines:[536,536,540,536,526,526,528,532,534,538,540,540,540,540,540,540,540,540,532,526,528,532,534,536,538,540,540,540,540,540]
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

let row=0,wantedMoving=false,lastDraw=0,draws=0,decodedFrames=0,seeks=0;
let activeKey='front',preparePromise=null,holder=null,watchdogId=0;

// Shared WebGL chroma-key processor (GPU fast path; 2D Uint32Array fallback if unavailable).
const glCanvas=D.createElement('canvas');
glCanvas.width=VW;glCanvas.height=VH;
let gl=null,glProgram=null,glTex=null,glBroken=false,glClipKey=null,glRenderedTime=-1;

function initWebGL(){
 if(gl||glBroken)return gl;
 try{
  const opts={alpha:true,premultipliedAlpha:true,antialias:false,preserveDrawingBuffer:true,depth:false,stencil:false};
  const ctx=glCanvas.getContext('webgl2',opts)||glCanvas.getContext('webgl',opts);
  if(!ctx){glBroken=true;return null;}
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
 const ctx=initWebGL();
 if(!ctx||clip.video.readyState<2)return false;
 try{
  ctx.bindTexture(ctx.TEXTURE_2D,glTex);
  ctx.texImage2D(ctx.TEXTURE_2D,0,ctx.RGBA,ctx.RGBA,ctx.UNSIGNED_BYTE,clip.video);
  ctx.clearColor(0,0,0,0);
  ctx.clear(ctx.COLOR_BUFFER_BIT);
  ctx.drawArrays(ctx.TRIANGLE_STRIP,0,4);
  glClipKey=clip.key;
  glRenderedTime=clip.video.currentTime;
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

function createClip(spec){
 const video=D.createElement('video');
 video.muted=true;video.defaultMuted=true;video.playsInline=true;video.loop=true;video.preload='auto';
 video.setAttribute('playsinline','');video.setAttribute('muted','');
 video.setAttribute('aria-hidden','true');
 video.style.cssText='width:1px;height:1px;display:block;';
 const canvas=D.createElement('canvas');canvas.width=VW;canvas.height=VH;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 const clip={
  key:spec.key,
  url:spec.url,
  duration:spec.duration,
  baselines:spec.baselines,
  baseline:spec.baselines[0]||532,
  video,
  canvas,
  ctx,
  attached:false,
  ready:false,
  hasFrame:false,
  failed:false,
  playPending:false,
  playToken:0,
  frameDirty:false,
  vfcArmed:false,
  vfcFrameIdx:-1,
  lastCapturedTime:-1,
  lastFrameIdx:-1,
  lastMediaTime:-1,
  lastPresentedFrames:-1,
  primed:false
 };

 function onFrame(now,meta){
  clip.vfcArmed=false;
  const mediaChanged=!meta||meta.presentedFrames!==clip.lastPresentedFrames||Math.abs(meta.mediaTime-clip.lastMediaTime)>1e-4;
  if(mediaChanged){
   clip.frameDirty=true;
   if(meta){
    clip.lastMediaTime=meta.mediaTime;
    clip.lastPresentedFrames=meta.presentedFrames;
    clip.vfcFrameIdx=Math.max(0,Math.min(clip.baselines.length-1,Math.round(meta.mediaTime*24)));
   }
  }
  if(!clip.video.paused&&!clip.failed&&typeof video.requestVideoFrameCallback==='function'){
   clip.vfcArmed=true;
   video.requestVideoFrameCallback(onFrame);
  }
 }
 clip.scheduleVfc=()=>{
  if(clip.vfcArmed||clip.failed||typeof video.requestVideoFrameCallback!=='function')return;
  clip.vfcArmed=true;
  video.requestVideoFrameCallback(onFrame);
 };

 video.addEventListener('error',()=>{clip.failed=true;clip.playPending=false;});
 video.addEventListener('seeked',()=>{if(clip.ready)seeks++;clip.frameDirty=true;});
 video.addEventListener('loadeddata',()=>{if(!clip.hasFrame)capture2D(clip,true);});
 video.addEventListener('canplay',()=>{if(!clip.hasFrame)capture2D(clip,true);});
 video.addEventListener('canplaythrough',()=>{if(!clip.hasFrame)capture2D(clip,true);});
 video.addEventListener('timeupdate',()=>{if(performance.now()-lastDraw>1300)pauseAll();});
 return clip;
}

const clips={
 front:createClip(CLIP_SPECS.front),
 left:createClip(CLIP_SPECS.left),
 back:createClip(CLIP_SPECS.back)
};
const clipList=[clips.front,clips.left,clips.back];

function frameIndexFor(clip){
 const arr=clip.baselines;
 const idx=Math.round((clip.video.currentTime||0)*24);
 return Math.max(0,Math.min(arr.length-1,idx));
}
function liveFrameIndexFor(clip){
 const arr=clip.baselines;
 const idx=Math.floor((clip.video.currentTime||0)*24+1e-4);
 return Math.max(0,Math.min(arr.length-1,idx));
}

function capture2D(clip,allowInitialCount){
 if(clip.video.readyState<2||clip.video.seeking||clip.failed)return false;
 const ctx=clip.ctx;
 ctx.clearRect(0,0,VW,VH);
 ctx.drawImage(clip.video,0,0,VW,VH);
 const img=ctx.getImageData(0,0,VW,VH),d=img.data;
 const kr=d[0],kg=d[1],kb=d[2],ka=d[3];
 // Guard against un-decoded blank video surface before first presentation.
 const cIdx=((VH>>1)*VW+(VW>>1))<<2;
 if((kr|kg|kb|ka)===0&&(d[cIdx]|d[cIdx+1]|d[cIdx+2]|d[cIdx+3])===0)return false;
 const excess=Math.max(1,kg-Math.max(kr,kb)-4);
 if(IS_LE){
  const buf=new Uint32Array(d.buffer);
  for(let i=0,n=buf.length;i<n;i++){
   const p=buf[i],r=p&255,g=(p>>>8)&255,b=(p>>>16)&255;
   const ge=g-(r>b?r:b)-4;
   if(ge>=excess){buf[i]=0;continue;}
   if(ge<=0){buf[i]=p|0xff000000;continue;}
   let alpha=1-ge/excess;
   if(alpha<.05){buf[i]=0;continue;}
   if(alpha>.985){buf[i]=p|0xff000000;continue;}
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
 const idx=clip.frameDirty&&clip.vfcFrameIdx>=0?clip.vfcFrameIdx:liveIdx;
 const isNewFrame=idx!==clip.lastFrameIdx||Math.abs(clip.video.currentTime-clip.lastCapturedTime)>0.03;
 clip.hasFrame=true;
 clip.baseline=clip.baselines[frameIndexFor(clip)]||532;
 clip.lastFrameIdx=idx;
 clip.lastCapturedTime=clip.video.currentTime;
 clip.frameDirty=false;
 clip.vfcFrameIdx=-1;
 if((firstCapture&&allowInitialCount)||(!firstCapture&&isNewFrame))decodedFrames++;
 return true;
}

function attachClip(clip){
 if(clip.attached)return;
 const host=ensureHolder();
 if(!host)return;
 clip.attached=true;
 clip.video.src=clip.url;
 host.appendChild(clip.video);
 clip.video.load();
}

function attachAll(){
 if(!D.body)return false;
 for(const clip of clipList)attachClip(clip);
 return true;
}

function primeClipFrame(clip){
 if(clip.primed||clip.hasFrame||clip.failed)return Promise.resolve(clip.hasFrame);
 clip.primed=true;
 return new Promise(resolve=>{
  const p=clip.video.play();
  Promise.resolve(p).then(()=>{
   setTimeout(()=>{
    try{clip.video.pause();clip.video.currentTime=0;}catch(_){}
    capture2D(clip,true);
    resolve(clip.hasFrame);
   },32);
  }).catch(()=>{resolve(clip.hasFrame);});
 });
}

function prepareClip(clip){
 return new Promise(resolve=>{
  let settled=false,softTimer=0;
  const finish=()=>{
   if(settled)return;
   settled=true;
   clearTimeout(timer);
   clearTimeout(softTimer);
   for(const ev of ['loadeddata','canplay','canplaythrough','error'])clip.video.removeEventListener(ev,check);
   resolve(clip.ready||clip.failed);
  };
  const check=()=>{
   if(clip.failed){finish();return;}
   attachClip(clip);
   if(clip.video.readyState>=2&&!clip.hasFrame){
    capture2D(clip,true);
   }
   if(clip.video.readyState>=3&&clip.hasFrame){
    clip.ready=true;finish();return;
   }
   if(clip.video.readyState>=2&&clip.hasFrame&&!softTimer){
    softTimer=setTimeout(()=>{if(!clip.failed&&clip.hasFrame){clip.ready=true;}finish();},2000);
   }
   if(clip.video.readyState>=2&&!clip.hasFrame&&!clip.primed){
    primeClipFrame(clip).then(()=>{
     if(clip.hasFrame&&clip.video.readyState>=2){clip.ready=true;finish();}
    });
   }
  };
  const timer=setTimeout(()=>{
   if(!clip.failed&&clip.video.readyState>=2){
    if(!clip.hasFrame)capture2D(clip,true);
    if(clip.hasFrame)clip.ready=true;
   }
   finish();
  },12000);
  if(D.body){
   attachClip(clip);
   if(clip.video.readyState>=2&&!clip.hasFrame)capture2D(clip,true);
   if(clip.video.readyState>=3&&clip.hasFrame){clip.ready=true;finish();return;}
  }
  for(const ev of ['loadeddata','canplay','canplaythrough','error'])clip.video.addEventListener(ev,check);
 });
}

function prepare(){
 if(preparePromise)return preparePromise;
 preparePromise=new Promise(resolve=>{
  const start=()=>{
   attachAll();
   initWebGL();
   Promise.all(clipList.map(prepareClip)).then(()=>{
    if(!glBroken&&clips.front.ready&&clips.front.video.readyState>=2){
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

function pauseClip(clip){
 clip.playToken++;
 clip.playPending=false;
 if(!clip.video.paused){
  try{clip.video.pause();}catch(_){}
 }
}

function pauseAll(){
 wantedMoving=false;
 for(const clip of clipList)pauseClip(clip);
 stopWatchdog();
}

function playClip(clip){
 if(!wantedMoving||clip.failed||clip.video.readyState<2)return;
 clip.scheduleVfc();
 if(!clip.video.paused||clip.playPending)return;
 clip.playPending=true;
 const token=++clip.playToken;
 try{
  const p=clip.video.play();
  Promise.resolve(p).then(()=>{
   clip.playPending=false;
   if(token!==clip.playToken||!wantedMoving||activeKey!==clip.key||D.hidden){
    try{clip.video.pause();}catch(_){}
    return;
   }
   clip.scheduleVfc();
  }).catch(()=>{clip.playPending=false;});
 }catch(_){clip.playPending=false;}
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
 activeKey=clipKey;
 const clip=clips[clipKey];

 for(const other of clipList){
  if(other!==clip)pauseClip(other);
 }

 if(wantedMoving){
  playClip(clip);
  ensureWatchdog();
 }else{
  pauseClip(clip);
  stopWatchdog();
 }

 if(!clip.hasFrame&&clip.video.readyState>=2){
  capture2D(clip,true);
 }
 if(!clip.hasFrame)return false;

 const frameIdx=frameIndexFor(clip);
 const liveIdx=liveFrameIndexFor(clip);
 clip.baseline=clip.baselines[frameIdx]||532;
 const idxChanged=liveIdx>clip.lastFrameIdx||liveIdx<clip.lastFrameIdx-6;
 const vfcIdx=clip.vfcFrameIdx;
 const vfcWrapped=vfcIdx>=0&&vfcIdx<clip.lastFrameIdx-6;
 const vfcAdvanced=clip.frameDirty&&(vfcIdx<0||vfcIdx>clip.lastFrameIdx||vfcWrapped);
 const frameAdvanced=idxChanged||vfcAdvanced;
 if(clip.frameDirty&&!vfcAdvanced){clip.frameDirty=false;clip.vfcFrameIdx=-1;}
 let sourceCanvas=clip.canvas;

 if(!glBroken&&initWebGL()){
  if(clip.video.readyState>=2&&!clip.video.seeking){
   const needGl=glClipKey!==clip.key||frameAdvanced;
   if(needGl){
    const nextIdx=vfcAdvanced&&vfcIdx>=0?(vfcWrapped?vfcIdx:Math.max(liveIdx,vfcIdx)):liveIdx;
    if(renderClipWebGL(clip)){
     clip.frameDirty=false;
     clip.vfcFrameIdx=-1;
     clip.lastFrameIdx=nextIdx;
     clip.lastCapturedTime=clip.video.currentTime;
     if(frameAdvanced)decodedFrames++;
     sourceCanvas=glCanvas;
    }else{
     sourceCanvas=clip.canvas;
    }
   }else{
    sourceCanvas=glCanvas;
   }
  }else if(glClipKey===clip.key){
   // Keep the active WebGL frame across brief native loop-wrap transitions.
   sourceCanvas=glCanvas;
  }
 }else{
  if(frameAdvanced&&clip.video.readyState>=2&&!clip.video.seeking){
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
 D.addEventListener(ev,()=>{if(wantedMoving)playClip(clips[activeKey]);},{passive:true});
}
D.addEventListener('visibilitychange',()=>{
 if(D.hidden)pauseAll();
 else if(wantedMoving)playClip(clips[activeKey]);
});

function readyCount(){
 return (clips.front.ready?1:0)+(clips.left.ready?1:0)+(clips.back.ready?1:0);
}

function status(){
 const active=clips[activeKey];
 const count=readyCount();
 const anyFailed=clipList.some(c=>c.failed);
 const allFailed=clipList.every(c=>c.failed);
 return {
  source:active.url,
  sources:CLIP_SPECS,
  clip:active.key,
  row,
  moving:wantedMoving,
  playing:!active.video.paused&&!active.failed,
  ready:count===clipList.length&&!anyFailed,
  readyCount:count,
  clipCount:clipList.length,
  readyState:active.video.readyState,
  seeking:active.video.seeking,
  time:active.video.currentTime,
  duration:active.duration,
  failed:allFailed||active.failed,
  draws,
  decodedFrames,
  seeks,
  mirrored:row===2,
  chromaBackend:glBroken?'cpu-uint32':'webgl',
  clips:{
   front:{ready:clips.front.ready,readyState:clips.front.video.readyState,paused:clips.front.video.paused,time:clips.front.video.currentTime,hasFrame:clips.front.hasFrame},
   left:{ready:clips.left.ready,readyState:clips.left.video.readyState,paused:clips.left.video.paused,time:clips.left.video.currentTime,hasFrame:clips.left.hasFrame},
   back:{ready:clips.back.ready,readyState:clips.back.video.readyState,paused:clips.back.video.paused,time:clips.back.video.currentTime,hasFrame:clips.back.hasFrame}
  }
 };
}

W.PsyGothicWalkVideoV1={
 draw,
 prepare,
 ranges,
 get video(){return clips[activeKey].video;},
 videos:{front:clips.front.video,left:clips.left.video,back:clips.back.video},
 status
};
})(window,document);
