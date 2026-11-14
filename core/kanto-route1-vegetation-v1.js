/* Route 1 localized foliage animation (Gazebo Oak prototype).
 * Tree structure, background illustration, and collision coordinates stay fixed.
 */
(function(W){
'use strict';
if(W.PsyKantoRoute1VegetationV1)return;
const root='assets/story/route1/trees/';
const GROUP_COUNT=7;
const WIND_SPEED=1.25;
const SOURCE_W=1400,SOURCE_H=700,WORLD_W=900,WORLD_H=450;
const sprites={};
for(const kind of ['gazebo-oak']){
 const structure=new Image(),foliage=new Image();
 structure.src=root+kind+'-structure.png';
 foliage.src=root+kind+'-foliage-atlas.png';
 sprites[kind]={structure,foliage};
}
// Anchored at the exact bottom-center of crop (392, 136, 548, 344) in 900x450 world units.
const trees=[
 {
  id:'gazebo-oak',
  kind:'gazebo-oak',
  x:(392+156/2)*WORLD_W/SOURCE_W,
  y:344*WORLD_H/SOURCE_H,
  phase:.35,
  strength:1.0
 }
];
const geometry={
 'gazebo-oak':[156*WORLD_W/SOURCE_W,208*WORLD_H/SOURCE_H]
};
let reduced=!!W.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
W.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change',e=>{reduced=e.matches});
function ready(image){return image?.complete&&image.naturalWidth>0&&image.naturalHeight>0}
function draw(ctx,now){
 if(!ctx)return;
 const t=now/1000;
 for(let ti=0;ti<trees.length;ti++){
  const tree=trees[ti],[w,h]=geometry[tree.kind],x=tree.x,y=tree.y,assets=sprites[tree.kind];
  if(!ready(assets.structure)||!ready(assets.foliage))continue;
  ctx.drawImage(assets.structure,x-w/2,y-h,w,h);
  const sourceH=assets.foliage.naturalHeight/GROUP_COUNT;
  const gust=Math.pow(Math.max(0,Math.sin(t*.19*WIND_SPEED-1.1+tree.phase)),9);
  for(let group=0;group<GROUP_COUNT;group++){
   const phase=tree.phase+group*1.73+ti*.61;
   const amplitude=tree.strength*(1+gust*.32);
   // Each masked leaf clump sways independently; trunk, branches and surrounding props stay fixed.
   const dxAsset=reduced?0:(Math.sin(t*.82*WIND_SPEED+phase)*1.35+Math.sin(t*.34*WIND_SPEED+phase*1.47)*.48+gust*.56)*amplitude;
   const dyAsset=reduced?0:(Math.cos(t*.61*WIND_SPEED+phase)*.28+gust*.12)*amplitude;
   ctx.drawImage(assets.foliage,0,group*sourceH,assets.foliage.naturalWidth,sourceH,
    x-w/2+dxAsset*w/assets.foliage.naturalWidth,
    y-h+dyAsset*h/sourceH,
    w,h);
  }
 }
}
W.PsyKantoRoute1VegetationV1={
 draw,
 groupCount:GROUP_COUNT,
 trees:trees.map(({id,kind,x,y})=>({id,kind,x,y})),
 geometry
};
})(window);
