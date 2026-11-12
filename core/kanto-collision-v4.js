/* Kanto V4: shared collision math and the existing Route 1 extension.
   Pallet art and geometry are defined together in kanto-map-data-v2.js. */
(function(W){
'use strict';
const D=W.PsyKantoMapDataV2;if(!D)return;
const data={"route1":{"w":900,"h":450,"spawn":[108,409],"exit":[848,87],"ground":[[[63,449],[141,449],[144,377],[175,321],[194,283],[202,250],[177,238],[126,266],[85,309],[61,349]],[[157,240],[211,231],[272,229],[307,220],[357,218],[420,219],[480,220],[518,219],[557,205],[625,199],[687,187],[744,179],[780,169],[831,157],[851,178],[806,198],[749,211],[683,219],[627,232],[582,238],[530,256],[493,276],[423,275],[344,270],[261,279],[190,284]],[[801,169],[827,154],[821,108],[817,56],[876,55],[879,126],[858,173],[831,200]],[[183,234],[190,188],[243,183],[250,224],[236,248]],[[327,253],[358,253],[361,331],[329,332]],[[184,280],[245,282],[252,312],[288,338],[314,347],[290,366],[246,352],[211,322]],[[553,216],[571,194],[595,158],[626,150],[673,166],[671,205],[612,227]],[[735,180],[777,179],[789,231],[785,280],[766,313],[744,305],[749,247]]],"solids":[{"poly":[[335,152],[421,157],[427,234],[333,234]]},{"poly":[[489,0],[520,0],[520,204],[485,205]]},{"poly":[[519,263],[614,259],[613,450],[537,450]]},{"poly":[[641,66],[704,70],[707,124],[639,126]]},{"poly":[[358,282],[487,280],[491,289],[360,290]]},{"poly":[[104,197],[154,195],[155,240],[105,239]]}],"doors":[],"npcs":[{"id":"route-guide","name":"Exploradora Nara","at":[454,251],"portrait":"assets/halloween/npc-luna.svg","emote":"curiosa"}],"grass":[{"id":"a","rect":[100,104,312,185],"entry":[211,181]},{"id":"b","rect":[260,309,488,347],"entry":[341,317]},{"id":"c","rect":[550,126,720,190],"entry":[620,168]},{"id":"d","rect":[648,247,768,308],"entry":[751,278]}]}};
// Grass entrances include the stairs and the threshold of each field.
data.route1.ground.push(
 [[198,170],[226,170],[226,254],[198,254]],
 [[324,250],[359,250],[359,337],[324,337]],
 [[600,163],[638,163],[638,228],[600,228]],
 [[735,236],[770,236],[770,294],[735,294]]
);
data.route1.npcs=[];
data.route1.doors=[{id:'route-cave',title:'Gruta dos Cristais',at:[680,140],range:70}];
data.route1.ground.push([[600,150],[638,150],[638,196],[600,196]]);
Object.assign(D.route1,data.route1);
D.route1.title='Rota 1';
function edge(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t)}
function inside(x,y,p){let v=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])v=!v}return v}
function blocked(m,x,y,r){return m.solids.some(s=>s.circle?Math.hypot(x-s.circle[0],y-s.circle[1])<=s.circle[2]+r:(inside(x,y,s.poly)||s.poly.some((v,i)=>edge(x,y,v,s.poly[(i+1)%s.poly.length])<=r)))}
D.grassAt=(m,x,y)=>m.grass.find(g=>x>=g.rect[0]&&x<=g.rect[2]&&y>=g.rect[1]&&y<=g.rect[3])||null;
// Evaluate clearance against the UNION of ground polygons. Internal seams
// between touching streets must never become invisible walls.
D.walkable=(m,x,y,r=5)=>{
 // Use the trainer's complete physical feet radius. Capping this at 7px let
 // the center pass gaps too narrow for the character, especially beside
 // riverbanks and at tight road corners.
 const foot=Math.max(0,Number(r)||0);
 if(!m||x<foot||y<foot||x>=m.w-foot||y>=m.h-foot||blocked(m,x,y,foot))return false;
 const ground=(px,py)=>m.ground.some(p=>inside(px,py,p))||m.grass.some(g=>px>=g.rect[0]&&px<=g.rect[2]&&py>=g.rect[1]&&py<=g.rect[3]);
 if(!ground(x,y))return false;
 for(let i=0;i<16;i++){const angle=i*Math.PI/8;if(!ground(x+Math.cos(angle)*foot,y+Math.sin(angle)*foot))return false;}
 return true;
};
})(window);
