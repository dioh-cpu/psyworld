/* Experimental Gothic Boy MP4 renderer. One decoder; no extracted frame atlas. */
(function(W,D){
'use strict';
if(W.PsyGothicWalkVideoV1)return;
const URL='assets/characters/source-video/gothic-boy-walk-turn-v2.mp4';
// Stable views observed in the source. Right intentionally mirrors left.
const ranges=[[.25,1.95],[2.65,4.05],[2.65,4.05],[5.15,6.65]];
const canvas=D.createElement('canvas');canvas.width=320;canvas.height=540;
const ctx=canvas.getContext('2d',{willReadFrequently:true});
const video=D.createElement('video');
video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='auto';
video.setAttribute('playsinline','');video.setAttribute('muted','');
video.setAttribute('aria-hidden','true');video.style.display='none';
let row=0,decodedTime=-1,buffer=null,playing=false,wantedMoving=false,failed=false,lastDraw=0;
let playPending=false,seeks=0,draws=0,decodedFrames=0,baseline=525;
function play(){
 if(!wantedMoving||playPending||!video.paused||failed)return;
 playPending=true;
 const p=video.play();
 Promise.resolve(p).then(()=>{playing=true;}).catch(()=>{playing=false;}).finally(()=>{playPending=false;});
}
function seek(time){if(video.readyState>=1&&!video.seeking){video.currentTime=time;seeks++;}}
video.addEventListener('loadeddata',()=>{capture();if(wantedMoving)play();});
video.addEventListener('seeked',()=>{capture();if(wantedMoving)play();});
video.addEventListener('error',()=>{failed=true;playing=false;});
video.addEventListener('timeupdate',()=>{if(performance.now()-lastDraw>300){wantedMoving=false;video.pause();playing=false;}});
for(const event of ['pointerdown','keydown'])D.addEventListener(event,()=>{if(wantedMoving)play();},{passive:true});
function capture(){
 const frame=Math.floor(video.currentTime*24);
 if(video.readyState<2||video.seeking||decodedTime===frame)return;
 ctx.clearRect(0,0,320,540);
 // Fixed, uniform crop around the actor; preserves the original proportions.
 ctx.drawImage(video,640,0,640,1080,0,0,320,540);
 const pixels=ctx.getImageData(0,0,320,540),a=pixels.data;
 const kr=a[0],kg=a[1],kb=a[2],excess=Math.max(1,kg-Math.max(kr,kb)-4);
 let bottom=0;
 for(let i=0;i<a.length;i+=4){
  let alpha=1-Math.max(0,Math.min(1,(a[i+1]-Math.max(a[i],a[i+2])-4)/excess));
  if(alpha<.05)alpha=0;else if(alpha>.985)alpha=1;
  if(alpha>0){
   const safe=Math.max(.05,alpha);
   a[i]=Math.max(0,Math.min(255,(a[i]-kr*(1-alpha))/safe));
   a[i+1]=Math.max(0,Math.min(255,(a[i+1]-kg*(1-alpha))/safe));
   a[i+2]=Math.max(0,Math.min(255,(a[i+2]-kb*(1-alpha))/safe));
   if(alpha>.12)bottom=Math.floor(i/4/320)+1;
  }
  a[i+3]=Math.round(alpha*255);
 }
 ctx.putImageData(pixels,0,0);buffer=true;baseline=bottom||525;
 decodedTime=frame;decodedFrames++;
}
function draw(target,pose,x,y,width,height){
 if(!video.getAttribute('src'))attach();
 lastDraw=performance.now();
 wantedMoving=pose.state==='walk';
 const next=Math.max(0,Math.min(3,pose.row|0)),changed=next!==row;
 row=next;
 const range=ranges[row];
 if(video.readyState>=1){
  if(changed||(wantedMoving&&(video.currentTime<range[0]||video.currentTime>=range[1])))seek(range[0]);
  if(wantedMoving)play();
  else {video.pause();playing=false;}
 }
 capture();
 if(buffer){
  target.save();target.imageSmoothingEnabled=true;target.imageSmoothingQuality='high';
  const h=height*1.2,w=h*320/540,foot=y+height*60/64;
  target.translate(x+width/2,foot);
  if(row===2)target.scale(-1,1);
  target.drawImage(canvas,-w/2,-h*baseline/540,w,h);target.restore();draws++;
 }
 return true;
}
W.PsyGothicWalkVideoV1={draw,video,ranges,status:()=>({source:URL,row,moving:wantedMoving,playing:!video.paused&&!failed,readyState:video.readyState,seeking:video.seeking,time:video.currentTime,failed,draws,decodedFrames,seeks,mirrored:row===2})};
function attach(){video.src=URL;D.body.appendChild(video);video.load();}
D.addEventListener('visibilitychange',()=>{if(D.hidden){video.pause();playing=false;}else if(wantedMoving)play();});
})(window,document);
