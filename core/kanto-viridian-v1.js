/* Viridian City V1 — 16:9 animated loop visual prototype (1280x720).
   Pallet Town and Route 1 geometry are intentionally not modified. */
(function(W){
'use strict';
const D=W.PsyKantoMapDataV2;if(!D||D.viridian)return;
const W_MAP=1280,H_MAP=720;
const ground=[[[0,0],[W_MAP,0],[W_MAP,H_MAP],[0,H_MAP]]];
D.viridian={
 id:'viridian',title:'Viridian City',w:W_MAP,h:H_MAP,
 art:'assets/kanto/viridian-test/viridian-poster-v1.png',
 video:'assets/kanto/viridian-test/viridian-loop-v1.mp4',
 fixedCamera:true,
 spawn:[640,585],return:[640,650],exit:[640,85],
 ground,solids:[],grass:[],paths:[],plazas:[],blockers:[],
 doors:[
  {id:'gym',title:'Ginásio de Viridian',at:[1095,280],range:54},
  {id:'center',title:'Centro Pokémon de Viridian',at:[490,290],range:48},
  {id:'market',title:'Poké Mart de Viridian',at:[790,305],range:48},
  {id:'school',title:'Escola de Treinadores',at:[320,490],range:52}
 ],
 npcs:[],
 signs:[{at:[640,85],title:'ROTA 2 ↑'},{at:[640,650],title:'ROTA 1 ↓'}]
};
})(window);
