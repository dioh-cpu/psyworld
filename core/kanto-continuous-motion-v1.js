/* Continuous world-space motion; navigation cells remain a separate contract. */
(function(W){'use strict';
 const TILE=28,RADIUS=7;
 function valid(grid,x,y,radius=RADIUS){
  const r=Math.max(0,Number(radius)||0),samples=Math.abs(r-RADIUS)<.0001?
   [[-r,-r],[r,-r],[-r,r],[r,r]]:[[0,0]];
  if(Math.abs(r-RADIUS)>=.0001)for(let i=0;i<16;i++){const a=i*Math.PI/8;samples.push([Math.cos(a)*r,Math.sin(a)*r]);}
  for(const [dx,dy] of samples){
   const tile=grid[Math.floor((y+dy)/TILE)]?.[Math.floor((x+dx)/TILE)];
   if(tile===undefined||[9,3,4].includes(tile))return false;
  }return true;
 }
 function advance(grid,position,input,dt,speed=143,maxDistance=Infinity,obstacles=[],radius=RADIUS){
  const mag=Math.hypot(input.x,input.y);if(!mag)return {distance:0,dx:0,dy:0};
  const distance=Math.min(maxDistance,speed*Math.min(.12,Math.max(0,dt))*Math.min(1,mag)),steps=Math.ceil(distance/4.5);
  const startX=position.x,startY=position.y,dx=input.x/mag*distance/steps,dy=input.y/mag*distance/steps;
  const can=(x,y)=>valid(grid,x,y,radius)&&obstacles.every(o=>{const d=Math.hypot(x-o.x,y-o.y),old=Math.hypot(position.x-o.x,position.y-o.y);return d>=radius+(o.radius||8)||d>old+.000001;});
  for(let i=0;i<steps;i++){
   if(can(position.x+dx,position.y+dy)){position.x+=dx;position.y+=dy;}
   else{if(can(position.x+dx,position.y))position.x+=dx;if(can(position.x,position.y+dy))position.y+=dy;}
  }
  return {distance:Math.hypot(position.x-startX,position.y-startY),dx:position.x-startX,dy:position.y-startY};
 }
 W.PsyKantoContinuousMotionV1={valid,advance,tile:TILE,radius:RADIUS};
})(window);
