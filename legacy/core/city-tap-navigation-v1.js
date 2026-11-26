/* PSYWORLD City tap-to-walk V1: no edits to follower movement, speed, collisions or joystick. */
(function(W,D){
'use strict';
if(W.PsyCityTapNav)return;
const canvas=D.getElementById('gameCanvas'),TILE_SIZE=55,WIDTH=60,HEIGHT=60;
if(!canvas)return;
let route=[],pointer=null,down=null,ignoreClickUntil=0;
function valid(x,y){
 return x>=0&&y>=0&&x<WIDTH&&y<HEIGHT&&!SOLID.has(x+','+y)&&
  (W.PsyCityGeometry?.contains?.(x,y)??true);
}
function findPath(sx,sy,tx,ty){
 sx=Math.floor(sx);sy=Math.floor(sy);tx=Math.floor(tx);ty=Math.floor(ty);
 if(!valid(sx,sy))return [];
 const len=WIDTH*HEIGHT, start=sy*WIDTH+sx,seen=new Uint8Array(len),prev=new Int32Array(len);prev.fill(-1);
 let best=start,dist=(sx-tx)**2+(sy-ty)**2;const queue=[start];seen[start]=1;
 for(let i=0;i<queue.length;i++){
  const current=queue[i],x=current%WIDTH,y=Math.floor(current/WIDTH);
  const d=(x-tx)**2+(y-ty)**2;if(d<dist){dist=d;best=current}
  if(d===0)break;
  for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){
   const nx=x+dx,ny=y+dy,n=ny*WIDTH+nx;
   if(!valid(nx,ny)||seen[n])continue;
   seen[n]=1;prev[n]=current;queue.push(n);
  }
 }
 if(best===start)return [];
 const output=[];
 for(let cursor=best;cursor!==start;cursor=prev[cursor]){
  if(cursor<0||output.length>len)return [];
  output.push({x:cursor%WIDTH,y:Math.floor(cursor/WIDTH)});
 }
 return output.reverse();
}
function sceneReady(){
 try{return !inBattle&&!D.body.classList.contains('psy-kanto-v2-active')&&
 !D.body.classList.contains('psy-shell-open')&&W.getComputedStyle(canvas).display!=='none'&&
 W.getComputedStyle(D.getElementById('game-wrap')).display!=='none'}catch(_){return false}
}
function go(x,y){
 if(!sceneReady())return false;
 const sx=P.moving?P.tx:P.x,sy=P.moving?P.ty:P.y;
 route=findPath(sx,sy,x,y);
 return route.length>0;
}
function tap(e){
 if(!sceneReady())return false;
 const rect=canvas.getBoundingClientRect();
 if(!rect.width||!rect.height)return false;
 const cx=(e.clientX-rect.left)*canvas.width/rect.width;
 const cy=(e.clientY-rect.top)*canvas.height/rect.height;
 const ox=canvas.width/2-P.px-TILE_SIZE/2,oy=canvas.height/2-P.py-TILE_SIZE/2;
 return go(Math.floor((cx-ox)/TILE_SIZE),Math.floor((cy-oy)/TILE_SIZE));
}
canvas.addEventListener('pointerdown',e=>{
 if((e.pointerType==='mouse'&&e.button!==0)||!sceneReady())return;
 pointer=e.pointerId;down={x:e.clientX,y:e.clientY,at:W.performance.now(),moved:false};
});
canvas.addEventListener('pointermove',e=>{
 if(e.pointerId===pointer&&down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>11)down.moved=true;
});
canvas.addEventListener('pointerup',e=>{
 if(e.pointerId!==pointer||!down)return;
 const isTap=!down.moved&&W.performance.now()-down.at<460;
 pointer=null;down=null;
 if(isTap){ignoreClickUntil=W.performance.now()+480;tap(e)}
});
canvas.addEventListener('pointercancel',()=>{pointer=null;down=null});
canvas.addEventListener('click',e=>{
 if(W.performance.now()<ignoreClickUntil){e.preventDefault();e.stopImmediatePropagation()}
},true);
W.setInterval(()=>{
 if(!route.length)return;
 if(!sceneReady()){route=[];return}
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyW','KeyA','KeyS','KeyD'].some(k=>keys[k])){
  route=[];W.clickMove=null;return;
 }
 if(P.moving)return;
 while(route.length&&route[0].x===P.x&&route[0].y===P.y)route.shift();
 if(!route.length)return;
 const next=route[0],dx=next.x-P.x,dy=next.y-P.y;
 if(Math.abs(dx)+Math.abs(dy)!==1||!valid(next.x,next.y)){route=[];return}
 W.clickMove={dx,dy};
},40);
W.PsyCityTapNav={navigate:go,findPath,cancel:()=>{route=[];W.clickMove=null},pending:()=>route.length,tap};
})(window,document);