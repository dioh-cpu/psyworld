/* PSYWORLD — monster MP4 renderer (idle loop with chroma key).
 * Plays a cropped, looping H.264 clip and removes the solid green background on a canvas.
 * Same approach as the gothic walk renderer, but generic: any clip, any size, loops forever.
 * No spritesheets or PNG sequences. The key colour is sampled from the clip's top-left pixel.
 */
(function(W,D){
'use strict';
if(W.PsyMonsterVideoV1)return;

const instances=new Set();
const shared=new Map();
let rafId=0;

function clamp(v,a,b){return v<a?a:v>b?b:v;}

function keyFrame(ctx,w,h,key){
 const img=ctx.getImageData(0,0,w,h),d=img.data;
 const kex=Math.max(1,key.g-Math.max(key.r,key.b));
 const lo=kex*0.18,hi=kex*0.62;
 for(let i=0;i<d.length;i+=4){
  const r=d[i],g=d[i+1],b=d[i+2];
  const ex=g-Math.max(r,b);
  if(ex>lo){
   const a=1-clamp((ex-lo)/(hi-lo),0,1);
   d[i+3]=(d[i+3]*a)|0;
   // despill: stop green leaking into soft edges
   const cap=Math.max(r,b);
   if(g>cap)d[i+1]=cap;
  }
 }
 ctx.putImageData(img,0,0);
}

function tick(){
 rafId=0;
 let active=false;
 instances.forEach(inst=>{
  let visible;
  if(inst.keepAlive){visible=!D.hidden&&W.performance.now()-inst.lastTouch<1500;}
  else{
   if(!inst.host.isConnected){inst.destroy();return;}
   visible=!D.hidden&&inst.host.offsetParent!==null;
  }
  if(!visible){if(!inst.video.paused)inst.video.pause();return;}
  active=true;
  if(inst.video.paused){const p=inst.video.play();if(p&&p.catch)p.catch(()=>{});}
  if(inst.video.readyState<2)return;
  const t=inst.video.currentTime;
  if(t===inst.lastTime)return;
  inst.lastTime=t;
  const {ctx,w,h}=inst;
  ctx.clearRect(0,0,w,h);
  ctx.drawImage(inst.video,0,0,w,h);
  if(!inst.key){
   const p=ctx.getImageData(0,0,1,1).data;
   inst.key={r:p[0],g:p[1],b:p[2]};
  }
  keyFrame(ctx,w,h,inst.key);
  inst.hasFrame=true;
 });
 if(instances.size)rafId=W.requestAnimationFrame(tick);
}

function start(){if(!rafId&&instances.size)rafId=W.requestAnimationFrame(tick);}

/* mount(host,{url,width,height}) -> instance { canvas, video, destroy() }
 * width/height are the processing resolution (keep small for UI cards). */
function mount(host,opts){
 const w=opts.width||480,h=opts.height||262;
 const video=D.createElement('video');
 video.muted=true;video.defaultMuted=true;video.loop=true;video.autoplay=true;
 video.playsInline=true;video.preload='auto';video.crossOrigin='anonymous';
 video.setAttribute('muted','');video.setAttribute('playsinline','');
 video.style.cssText='position:absolute;width:1px;height:1px;opacity:0.001;pointer-events:none;';
 video.src=opts.url;
 const canvas=D.createElement('canvas');
 canvas.width=w;canvas.height=h;
 canvas.style.cssText='display:block;width:100%;height:auto;';
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 host.appendChild(video);host.appendChild(canvas);
 const inst={host,video,canvas,ctx,w,h,key:null,lastTime:-1,hasFrame:false,
  keepAlive:!!opts.keepAlive,lastTouch:0,
  touch(){inst.lastTouch=W.performance.now();start();},
  destroy(){instances.delete(inst);if(inst.shareKey)shared.delete(inst.shareKey);try{video.pause();video.removeAttribute('src');video.load();}catch(_){}try{video.remove();canvas.remove();}catch(_){}}};
 instances.add(inst);
 video.addEventListener('error',()=>{inst.failed=true;});
 start();
 return inst;
}

/* shared(url,opts) -> one cached, always-available keyed canvas per clip (for canvas drawImage use).
 * Call inst.touch() every time it is drawn; it pauses by itself after 1.5 s without use. */
function sharedClip(url,opts){
 let inst=shared.get(url);
 if(inst)return inst;
 const host=D.createElement('div');
 host.style.cssText='position:fixed;left:-99999px;top:0;width:1px;height:1px;overflow:hidden;pointer-events:none;';
 D.body.appendChild(host);
 inst=mount(host,Object.assign({},opts,{url,keepAlive:true}));
 inst.canvas.style.cssText='';
 inst.shareKey=url;shared.set(url,inst);
 return inst;
}

D.addEventListener('visibilitychange',()=>{if(!D.hidden)start();});
for(const ev of ['pointerdown','touchstart','keydown']){
 D.addEventListener(ev,()=>start(),{passive:true});
}

W.PsyMonsterVideoV1={mount,shared:sharedClip,get count(){return instances.size;}};
})(window,document);
