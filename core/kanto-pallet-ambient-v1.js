/* PSYWORLD · Pallet Town ambient animation.
 * This layer sits over Pallet's approved illustration and never changes the
 * map image, walkability mask, movement, or other Kanto scenes.
 */
(function(W,D){
'use strict';
if(W.PsyKantoPalletAmbientV1)return;
const WIDTH=900,HEIGHT=450,SEA_TOP=402;
const leaves=[
 {x:64,phase:0.03,period:24,speed:21,sway:15,turn:.72,size:3.3,color:'#c9cc73'},
 {x:191,phase:.28,period:27,speed:18,sway:19,turn:-.54,size:3.8,color:'#d9ac61'},
 {x:337,phase:.54,period:22,speed:22,sway:14,turn:.83,size:3.2,color:'#aab957'},
 {x:524,phase:.76,period:26,speed:19,sway:18,turn:-.67,size:3.6,color:'#d5c16e'},
 {x:706,phase:.13,period:23,speed:20,sway:17,turn:.62,size:3.2,color:'#b9bd67'},
 {x:843,phase:.43,period:28,speed:17,sway:20,turn:-.76,size:3.7,color:'#d4a766'},
 {x:421,phase:.89,period:29,speed:16,sway:14,turn:.58,size:3.1,color:'#d5c978'}
];
const ripples=Array.from({length:22},(_,i)=>({
 x:(i*173+41)%980-40,y:SEA_TOP+7+(i*19)%39,
 speed:6.2+(i%5)*1.85,length:8+(i%6)*2.8,
 phase:i*.73,alpha:.24+(i%4)*.04
}));
let source=null,maskCanvas=null,waterCanvas=null,waterCtx=null,reducedMotion=null;
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
 waterCanvas=D.createElement('canvas');waterCanvas.width=WIDTH;waterCanvas.height=HEIGHT;
 waterCtx=waterCanvas.getContext('2d');
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
 if(!waterCtx||!maskCanvas)return;
 const c=waterCtx,t=now/1000;
 c.clearRect(0,0,WIDTH,HEIGHT);c.save();
 for(let i=0;i<3;i++){
  const x=modulo(t*(8+i*1.7)+i*317,WIDTH+170)-85;
  const light=c.createLinearGradient(x-68,0,x+68,0);
  light.addColorStop(0,'rgba(166,243,239,0)');light.addColorStop(.5,'rgba(183,249,242,.2)');light.addColorStop(1,'rgba(166,243,239,0)');
  c.fillStyle=light;c.fillRect(x-68,423,136,27);
 }
 for(let i=0;i<ripples.length;i++){
  const r=ripples[i],x=modulo(r.x+t*r.speed,WIDTH+60)-30;
  const y=r.y+Math.sin(t*.72+r.phase)*1.25;
  const shimmer=.66+.34*Math.sin(t*.9+r.phase);
  c.globalAlpha=r.alpha*shimmer;c.strokeStyle=i%4===0?'#effff6':'#9fe8e6';c.lineWidth=i%5===0?1.45:1.05;
  c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+r.length*.42,y-1.2,x+r.length,y+.15);c.stroke();
  if(i%3===0){c.globalAlpha=r.alpha*.7*shimmer;c.beginPath();c.moveTo(x+r.length*.42,y+2);c.quadraticCurveTo(x+r.length*.68,y+1.2,x+r.length*.92,y+2);c.stroke();}
 }
 for(let i=0;i<3;i++){
  const p=modulo(t/3.3+i/3,1),rx=4+p*17,ry=2+p*7;
  c.globalAlpha=(1-p)*.31;c.strokeStyle='#e6ffff';c.lineWidth=1.25;
  c.beginPath();c.ellipse(467,330,rx,ry,-.08,Math.PI*.08,Math.PI*1.88);c.stroke();
 }
 c.restore();c.globalCompositeOperation='destination-in';c.drawImage(maskCanvas,0,0);c.globalCompositeOperation='source-over';
}
function draw(ctx,now,mapCanvas){
 if(reduced())return;
 prepare(mapCanvas);if(!maskCanvas)return;
 drawWater(now);ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.86;ctx.drawImage(waterCanvas,0,0);ctx.restore();
 for(let i=0;i<leaves.length;i++)drawLeaf(ctx,leaves[i],now,i);
}
W.PsyKantoPalletAmbientV1={draw};
})(window,document);
