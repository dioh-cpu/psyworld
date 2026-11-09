/* Viridian City V1 — approved square map, continuous ground/collision geometry.
   Pallet Town and Route 1 geometry are intentionally not modified.
   Streets are encounter-free; every door/gate has a walkable approach. */
(function(W){
'use strict';
const D=W.PsyKantoMapDataV2;if(!D||D.viridian)return;
const ground=[];
function disc(x,y,r){const p=[];for(let i=0;i<24;i++){const a=2*Math.PI*i/24;p.push([x+Math.cos(a)*r,y+Math.sin(a)*r])}ground.push(p)}
function lane(pts,r){for(let i=1;i<pts.length;i++){const [ax,ay]=pts[i-1],[bx,by]=pts[i],d=Math.hypot(bx-ax,by-ay)||1,nx=(ay-by)/d*r,ny=(bx-ax)/d*r;ground.push([[ax+nx,ay+ny],[bx+nx,by+ny],[bx-nx,by-ny],[ax-nx,ay-ny]]);disc(ax,ay,r);disc(bx,by,r)}}
disc(450,418,107); // fountain plaza; its basin is solid below
lane([[18,446],[155,446],[275,439],[355,429]],27);
lane([[544,429],[656,434],[786,439],[880,442]],29);
lane([[450,475],[450,570]],29); // Route 1 bridge
lane([[450,355],[450,295],[450,216]],32); // gym avenue
lane([[445,318],[380,313],[346,278],[346,243]],26);
lane([[346,243],[345,155],[352,94],[405,46],[449,43]],23); // north gate
lane([[155,446],[155,377],[195,343],[199,267]],22);
lane([[154,386],[155,365]],21);
lane([[270,437],[270,387]],22);
lane([[128,448],[110,373],[139,319],[195,271]],22);
lane([[614,434],[614,347]],26);
lane([[779,438],[779,349]],25);
lane([[684,440],[685,526],[644,608]],24);
lane([[747,439],[745,515],[740,603]],24);
lane([[644,607],[740,605],[809,655]],24);
lane([[644,608],[630,669],[563,688]],21);
lane([[563,688],[525,716],[486,754],[450,795],[450,851]],21);
D.viridian={
 id:'viridian',title:'Viridian City',w:900,h:900,
 art:'assets/kanto/approved/viridian-approved.webp',
 spawn:[450,515],return:[450,550],exit:[449,43],
 ground,solids:[{circle:[450,418,60]}],grass:[],paths:[],plazas:[],blockers:[],
 doors:[
  {id:'gym',title:'Ginásio de Viridian',at:[450,215],range:46},
  {id:'center',title:'Centro Pokémon de Viridian',at:[614,348],range:44},
  {id:'market',title:'Poké Mart de Viridian',at:[779,352],range:44},
  {id:'school',title:'Escola de Treinadores',at:[199,267],range:47},
  {id:'house-west',title:'Casa do Oeste',at:[154,381],range:40},
  {id:'home',title:'Casa da Praça',at:[270,389],range:40},
  {id:'house-east',title:'Casa da Ribeira',at:[644,602],range:42}
 ],
 npcs:[
  {id:'viridian-elder',name:'Ancião de Viridian',at:[389,355],portrait:'assets/kanto/npcs/viridian-elder-v1.png',emote:'atento'},
  {id:'viridian-teacher',name:'Instrutora da Escola',at:[251,306],portrait:'assets/kanto/npcs/viridian-instructor-v1.png',emote:'serena'}
 ],
 signs:[{at:[449,43],title:'ROTA 2 ↑'},{at:[450,550],title:'ROTA 1 ↓'}]
};
})(window);
