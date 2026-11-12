/* Pallet-only layered trees. The collision map and world coordinates are untouched. */
(function(W,D){
'use strict';
if(W.PsyKantoPalletVegetationV1)return;
const root='assets/story/pallet/trees/';
const sprites={};
for(const size of ['small','medium','large'])for(const layer of ['trunk','crown']){
 const img=new Image();img.src=root+'tree-'+size+'-'+layer+'.png';sprites[size+layer]=img;
}
// Locations are the approved visual composition converted from 1774x887 art pixels
// to the existing 900x450 world. Each foot/base is in a blocked mask cell.
const trees=[
 {size:'large',x:35,y:70,phase:.2,strength:1.0},
 {size:'small',x:350,y:45,phase:2.3,strength:.72},
 {size:'small',x:610,y:55,phase:4.4,strength:.68}
];
const geometry={small:[108*900/1774,103*900/1774],medium:[145*900/1774,138*900/1774],large:[185*900/1774,176*900/1774]};
let reduced=!!W.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
W.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change',e=>{reduced=e.matches});
function draw(ctx,now){
 const t=now/1000;
 for(const tree of trees){
  const [w,h]=geometry[tree.size],x=tree.x,y=tree.y;
  const trunk=sprites[tree.size+'trunk'],crown=sprites[tree.size+'crown'];
  if(!trunk?.complete||!trunk.naturalWidth||!crown?.complete||!crown.naturalWidth)continue;
  ctx.drawImage(trunk,x-w/2,y-h,w,h);
  const gust=Math.pow(Math.max(0,Math.sin(t*.22-1.1+tree.phase)),8);
  const sway=reduced?0:(Math.sin(t*.82+tree.phase)*.9+Math.sin(t*.39+tree.phase*1.7)*.35+gust*.8)*tree.strength;
  const angle=reduced?0:(Math.sin(t*.68+tree.phase)*.025+gust*.012)*tree.strength;
  const pivotY=y-h*.58;
  ctx.save();ctx.translate(x,pivotY);ctx.rotate(angle);ctx.translate(-x,-pivotY);
  ctx.drawImage(crown,x-w/2+sway,y-h,w,h);ctx.restore();
 }
}
W.PsyKantoPalletVegetationV1={draw,trees:trees.map(({size,x,y})=>({size,x,y})),geometry};
})(window,document);
