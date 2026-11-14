global.window={};const P=__dirname+'/../core/';
require(P+'kanto-map-data-v2.js');require(P+'kanto-collision-v4.js');
const M=window.PsyKantoMapDataV2,r=M.route1,w=(x,y)=>M.walkable(r,x,y,6);
function path(a,b){const n=60;for(let i=0;i<=n;i++){const x=a[0]+(b[0]-a[0])*i/n,y=a[1]+(b[1]-a[1])*i/n;if(!w(x,y))return false}return true}
const ok=[];const t=(n,c)=>{if(!c){console.error('FAIL',n);process.exit(1)}ok.push(n)};
// Grass A: full stair width, bottom to grass
t('stairs left column',w(190,215));t('stairs landing left',w(190,185));
t('stairs->grass A',path([210,254],[210,150]));t('left col->grass A',path([190,254],[190,150]));
t('grass A wild',!!M.grassAt(r,150,140));
// Grass B lower-left lobe
t('B lobe',w(275,350)&&w(290,356));t('path->B lobe',path([343,330],[290,356])||path([275,335],[275,352]));
t('grass B wild',!!M.grassAt(r,360,330));
// Solids preserved
t('rock/solid still blocked',!w(380,285)&&!w(500,100)&&!w(130,215));
t('cliff left of stairs blocked',!w(170,215));t('below lobe blocked',!w(290,375));
console.log('OK',ok.length,'checks');
