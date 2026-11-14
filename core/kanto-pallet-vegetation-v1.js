/* Pallet foliage animation. Tree structure and collision coordinates stay fixed. */
(function(W,D){
'use strict';
if(W.PsyKantoPalletVegetationV1)return;
const root='assets/story/pallet/trees/';
const GROUP_COUNT=7;
const sprites={};
for(const size of ['small','medium','large']){
 const structure=new Image(),foliage=new Image();
 structure.src=root+'tree-'+size+'-structure.png';
 foliage.src=root+'tree-'+size+'-foliage-atlas.png';
 sprites[size]={structure,foliage};
}
// Locations are unchanged; each base remains anchored at its blocked mask cell.
const trees=[
 {size:'large',x:35,y:70,phase:.2,strength:1.0},
 {size:'small',x:350,y:45,phase:2.3,strength:.72},
 {size:'small',x:610,y:55,phase:4.4,strength:.68}
];
const geometry={small:[108*900/1774,103*900/1774],medium:[145*900/1774,138*900/1774],large:[185*900/1774,176*900/1774]};
let reduced=!!W.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
W.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change',e=>{reduced=e.matches});
function ready(image){return image?.complete&&image.naturalWidth>0&&image.naturalHeight>0}
function draw(ctx,now){
 const t=now/1000;
 for(let ti=0;ti<trees.length;ti++){
  const tree=trees[ti],[w,h]=geometry[tree.size],x=tree.x,y=tree.y,assets=sprites[tree.size];
  if(!ready(assets.structure)||!ready(assets.foliage))continue;
  ctx.drawImage(assets.structure,x-w/2,y-h,w,h);
  const sourceH=assets.foliage.naturalHeight/GROUP_COUNT;
  const gust=Math.pow(Math.max(0,Math.sin(t*.19-1.1+tree.phase)),9);
  for(let group=0;group<GROUP_COUNT;group++){
   const phase=tree.phase+group*1.73+ti*.61;
   const amplitude=tree.strength*(1+gust*.32);
   // A small masked leaf clump moves independently; branches and trunk never do.
   const dxAsset=reduced?0:(Math.sin(t*.82+phase)*1.35+Math.sin(t*.34+phase*1.47)*.48+gust*.56)*amplitude;
   const dyAsset=reduced?0:(Math.cos(t*.61+phase)*.28+gust*.12)*amplitude;
   ctx.drawImage(assets.foliage,0,group*sourceH,assets.foliage.naturalWidth,sourceH,
    x-w/2+dxAsset*w/assets.foliage.naturalWidth,
    y-h+dyAsset*h/sourceH,
    w,h);
  }
 }
}
W.PsyKantoPalletVegetationV1={draw,trees:trees.map(({size,x,y})=>({size,x,y})),geometry};
})(window,document);
