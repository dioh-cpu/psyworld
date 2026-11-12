/* PSYWORLD · Pallet Town ambient animation.
 * This layer sits over Pallet's approved illustration and never changes the
 * map image, walkability mask, movement, or other Kanto scenes.
 */
(function(W,D){
'use strict';
if(W.PsyKantoPalletAmbientV1)return;
const WIDTH=900,HEIGHT=450,SEA_TOP=402;
const foliageZones=[
 {x:0,y:0,w:148,h:106,pivotX:12,pivotY:98,phase:.1,amp:.78,angle:.007},
 {x:150,y:0,w:150,h:68,pivotX:150,pivotY:65,phase:1.35,amp:.66,angle:.006},
 {x:520,y:0,w:178,h:77,pivotX:520,pivotY:73,phase:2.2,amp:.72,angle:.007},
 {x:702,y:0,w:198,h:118,pivotX:898,pivotY:110,phase:3.1,amp:.86,angle:.008},
 {x:0,y:118,w:52,h:240,pivotX:2,pivotY:228,phase:4.0,amp:.62,angle:.005},
 {x:848,y:102,w:52,h:242,pivotX:898,pivotY:224,phase:5.0,amp:.7,angle:.006}
];
const leaves=[
 {x:64,phase:0.03,period:24,speed:21,sway:15,turn:.72,size:3.3,color:'#c9cc73'},
 {x:191,phase:.28,period:27,speed:18,sway:19,turn:-.54,size:3.8,color:'#d9ac61'},
 {x:337,phase:.54,period:22,speed:22,sway:14,turn:.83,size:3.2,color:'#aab957'},
 {x:524,phase:.76,period:26,speed:19,sway:18,turn:-.67,size:3.6,color:'#d5c16e'},
 {x:706,phase:.13,period:23,speed:20,sway:17,turn:.62,size:3.2,color:'#b9bd67'},
 {x:843,phase:.43,period:28,speed:17,sway:20,turn:-.76,size:3.7,color:'#d4a766'},
 {x:421,phase:.89,period:29,speed:16,sway:14,turn:.58,size:3.1,color:'#d5c978'}
];
const ripples=Array.from({length:26},(_,i)=>({
 x:(i*173+41)%980-40,y:SEA_TOP+7+(i*19)%39,
 speed:14+(i%5)*2.6,length:15+(i%6)*3.2,
 phase:i*.73,alpha:.38+(i%4)*.045
}));
const waveCrests=Array.from({length:9},(_,i)=>({
 x:(i*137+73)%980-40,y:SEA_TOP+12+(i*17)%29,
 speed:13+(i%3)*3.2,length:28+(i%4)*10,phase:i*1.17
}));
let source=null,maskCanvas=null,waterTextureCanvas=null,waterCanvas=null,waterCtx=null,foliagePatches=[],reducedMotion=null;
function reduced(){
 if(reducedMotion===null)reducedMotion=!!W.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 return reducedMotion;
}
W.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change',e=>{reducedMotion=e.matches});
function isSea(r,g,b){
 const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;
 if(max<36||delta<18||b<r*1.12)return false;
 let h;
 if(max===r)h=60*(((g-b)/delta)%6);
 else if(max===g)h=60*((b-r)/delta+2);
 else h=60*((r-g)/delta+4);
 if(h<0)h+=360;
 const saturation=delta/max;
 return h>=168&&h<=224&&saturation>=.22;
}
function isFoliage(r,g,b){
 const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;
 if(max<32||delta<16||g<r*.72)return false;
 let h;
 if(max===r)h=60*(((g-b)/delta)%6);
 else if(max===g)h=60*((b-r)/delta+2);
 else h=60*((r-g)/delta+4);
 if(h<0)h+=360;
 return h>=30&&h<=148&&delta/max>=.2;
}
function makeFoliagePatch(mapCanvas,zone){
 const canvas=D.createElement('canvas');canvas.width=zone.w;canvas.height=zone.h;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(mapCanvas,zone.x,zone.y,zone.w,zone.h,0,0,zone.w,zone.h);
 try{
  const pixels=ctx.getImageData(0,0,zone.w,zone.h),data=pixels.data,green=new Uint8Array(zone.w*zone.h);
  for(let y=0;y<zone.h;y++)for(let x=0;x<zone.w;x++){
   const i=(y*zone.w+x)*4;if(isFoliage(data[i],data[i+1],data[i+2]))green[y*zone.w+x]=1;
  }
  for(let y=0;y<zone.h;y++)for(let x=0;x<zone.w;x++){
   const p=y*zone.w+x,i=p*4;if(green[p])continue;
   let near=false;for(let dy=-1;dy<=1&&!near;dy++)for(let dx=-1;dx<=1;dx++){
    const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<zone.w&&yy<zone.h&&green[yy*zone.w+xx]){near=true;break;}
   }
   // Keep the dark twig pixels directly attached to leaves so the bough tips
   // sway with the canopy; detached buildings and path pixels stay untouched.
   if(near&&Math.max(data[i],data[i+1],data[i+2])<112)data[i+3]=145;
   else if(!green[p])data[i+3]=0;
  }
  ctx.putImageData(pixels,0,0);return {canvas,zone};
 }catch(_){return null;}
}
function prepare(mapCanvas){
 if(!mapCanvas||source===mapCanvas)return;
 source=mapCanvas;
 maskCanvas=D.createElement('canvas');maskCanvas.width=WIDTH;maskCanvas.height=HEIGHT;
 const maskCtx=maskCanvas.getContext('2d',{willReadFrequently:true});
 maskCtx.clearRect(0,0,WIDTH,HEIGHT);
 const imageCtx=D.createElement('canvas');imageCtx.width=WIDTH;imageCtx.height=HEIGHT;
 const sample=imageCtx.getContext('2d',{willReadFrequently:true});
 sample.imageSmoothingEnabled=true;sample.drawImage(mapCanvas,0,0,WIDTH,HEIGHT);
 try{
  const pixels=sample.getImageData(0,0,WIDTH,HEIGHT),data=pixels.data;
  for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++){
   const i=(y*WIDTH+x)*4;
   const sea=y>=SEA_TOP||(x>=438&&x<=496&&y>=312&&y<=344);
   if(sea&&isSea(data[i],data[i+1],data[i+2]))data[i+3]=255;
   else data[i+3]=0;
  }
  maskCtx.putImageData(pixels,0,0);
 }catch(_){maskCanvas=null;return;}
 waterTextureCanvas=D.createElement('canvas');waterTextureCanvas.width=WIDTH;waterTextureCanvas.height=HEIGHT;
 const textureCtx=waterTextureCanvas.getContext('2d');textureCtx.drawImage(mapCanvas,0,0,WIDTH,HEIGHT);
 textureCtx.globalCompositeOperation='destination-in';textureCtx.drawImage(maskCanvas,0,0);textureCtx.globalCompositeOperation='source-over';
 waterCanvas=D.createElement('canvas');waterCanvas.width=WIDTH;waterCanvas.height=HEIGHT;
 waterCtx=waterCanvas.getContext('2d');
 foliagePatches=foliageZones.map(zone=>makeFoliagePatch(mapCanvas,zone)).filter(Boolean);
}
function modulo(n,m){return ((n%m)+m)%m}
function drawLeaf(c,item,now,index){
 const t=now/1000,elapsed=modulo(t+item.phase*item.period,item.period),p=elapsed/item.period;
 const gust=1+Math.sin(t*.31+index*.9)*.24;
 const x=modulo(item.x+elapsed*(5.1+index%3*1.05)*gust+Math.sin(elapsed*.56+index)*item.sway,WIDTH+24)-12;
 const y=-18+p*(HEIGHT+36),fade=Math.min(1,p*9,(1-p)*8);
 const flutter=Math.sin(elapsed*item.turn+index)*.48;
 c.save();c.translate(x,y);c.rotate(elapsed*item.turn+flutter);c.globalAlpha=.84*fade;
 c.fillStyle=item.color;c.beginPath();c.moveTo(-item.size*1.25,0);c.quadraticCurveTo(-.2,-item.size*1.1,item.size*1.25,-.18);c.quadraticCurveTo(.2,item.size*.78,-item.size*1.25,0);c.fill();
 c.strokeStyle='rgba(70,83,47,.6)';c.lineWidth=.38;c.beginPath();c.moveTo(-item.size,0);c.quadraticCurveTo(0,-.12,item.size,0);c.stroke();c.restore();
}
function drawWater(now){
 if(!waterCtx||!maskCanvas||!waterTextureCanvas)return;
 const c=waterCtx,t=now/1000;
 c.clearRect(0,0,WIDTH,HEIGHT);c.save();
 // Move narrow bands of the actual painted water texture in the wind/current
 // direction. The mask keeps every shifted pixel inside the original water.
 for(let y=SEA_TOP;y<HEIGHT;y+=8){
  const bandH=Math.min(8,HEIGHT-y),band=(y-SEA_TOP)/8;
  const shift=Math.round(Math.sin(t*.82+band*.76)*2.8+Math.sin(t*.43+band*.48)*1.4);
  const sx=shift>0?0:-shift,dx=shift>0?shift:0,sw=WIDTH-Math.abs(shift);
  c.drawImage(waterTextureCanvas,sx,y,sw,bandH,dx,y,sw,bandH);
  if(shift>0)c.drawImage(waterTextureCanvas,WIDTH-shift,y,shift,bandH,0,y,shift,bandH);
  else if(shift<0)c.drawImage(waterTextureCanvas,0,y,-shift,bandH,WIDTH+shift,y,-shift,bandH);
 }
 // Give the fountain surface its own gentle circular current.
 const fountainShift=Math.sin(t*.9)*1.4;
 c.save();c.beginPath();c.ellipse(467,330,30,18,0,0,Math.PI*2);c.clip();
 c.drawImage(waterTextureCanvas,fountainShift,Math.cos(t*.7)*.35);c.restore();
 for(let i=0;i<3;i++){
  const x=modulo(t*(8+i*1.7)+i*317,WIDTH+170)-85;
  const light=c.createLinearGradient(x-68,0,x+68,0);
  light.addColorStop(0,'rgba(166,243,239,0)');light.addColorStop(.5,'rgba(183,249,242,.34)');light.addColorStop(1,'rgba(166,243,239,0)');
  c.fillStyle=light;c.fillRect(x-68,423,136,27);
 }
 for(let i=0;i<ripples.length;i++){
  const r=ripples[i],x=modulo(r.x+t*r.speed,WIDTH+60)-30;
  const y=r.y+Math.sin(t*.72+r.phase)*1.25;
  const shimmer=.66+.34*Math.sin(t*.9+r.phase);
  c.globalAlpha=r.alpha*shimmer;c.strokeStyle=i%4===0?'#effff6':'#9fe8e6';c.lineWidth=i%5===0?1.8:1.3;
  c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+r.length*.42,y-1.2,x+r.length,y+.15);c.stroke();
  if(i%3===0){c.globalAlpha=r.alpha*.7*shimmer;c.beginPath();c.moveTo(x+r.length*.42,y+2);c.quadraticCurveTo(x+r.length*.68,y+1.2,x+r.length*.92,y+2);c.stroke();}
 }
 for(let i=0;i<waveCrests.length;i++){
  const wave=waveCrests[i],x=modulo(wave.x+t*wave.speed,WIDTH+100)-50;
  const y=wave.y+Math.sin(t*.8+wave.phase)*1.7;
  c.globalAlpha=.48+.09*Math.sin(t*.65+wave.phase);c.strokeStyle=i%3===0?'#f0fff7':'#c7f3ed';c.lineWidth=i%3===0?1.8:1.45;
  c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+wave.length*.22,y-2.1,x+wave.length*.42,y+1.7,x+wave.length*.63,y-.2);c.bezierCurveTo(x+wave.length*.77,y-1.2,x+wave.length*.9,y+1.1,x+wave.length,y);c.stroke();
 }
 for(let i=0;i<3;i++){
  const p=modulo(t/3.3+i/3,1),rx=4+p*17,ry=2+p*7;
  c.globalAlpha=(1-p)*.42;c.strokeStyle='#e6ffff';c.lineWidth=1.5;
  c.beginPath();c.ellipse(467,330,rx,ry,-.08,Math.PI*.08,Math.PI*1.88);c.stroke();
 }
 c.restore();c.globalCompositeOperation='destination-in';c.drawImage(maskCanvas,0,0);c.globalCompositeOperation='source-over';
}
function drawFoliage(ctx,now){
 const t=now/1000,gust=1+Math.sin(t*.28)*.18;
 for(const patch of foliagePatches){
  const z=patch.zone,phase=z.phase;
  const sway=Math.sin(t*.58+phase)*z.amp*gust;
  const lift=Math.cos(t*.46+phase)*.32;
  const angle=Math.sin(t*.51+phase)*z.angle;
  ctx.save();ctx.globalAlpha=.3;ctx.translate(z.x+z.pivotX,z.y+z.pivotY);ctx.rotate(angle);
  ctx.drawImage(patch.canvas,-z.pivotX+sway,-z.pivotY+lift,z.w,z.h);ctx.restore();
 }
}
function draw(ctx,now,mapCanvas){
 if(reduced())return;
 prepare(mapCanvas);if(!maskCanvas)return;
 drawWater(now);ctx.save();ctx.globalCompositeOperation='source-over';ctx.globalAlpha=.65;ctx.drawImage(waterCanvas,0,0);ctx.restore();
 drawFoliage(ctx,now);
 for(let i=0;i<leaves.length;i++)drawLeaf(ctx,leaves[i],now,i);
}
W.PsyKantoPalletAmbientV1={draw};
})(window,document);
