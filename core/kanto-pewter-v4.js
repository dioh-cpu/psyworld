/* Authored streets and building interiors. Coordinates are navigation cells;
   physical movement remains with the shared continuous campaign controller. */
(function(W){'use strict';
 const root='assets/kanto/pewter-v4/';
 function street(){
  const grid=Array.from({length:20},()=>Array(32).fill(9));
  const rect=(a,b,c,d)=>{for(let y=b;y<=d;y++)for(let x=a;x<=c;x++)grid[y][x]=1;};
  rect(15,8,16,18);rect(3,11,30,11);rect(8,5,8,7);rect(8,7,14,7);rect(14,7,15,8);
  rect(22,5,22,11);rect(6,10,6,11);rect(25,10,25,11);rect(7,15,7,16);rect(7,16,24,16);rect(24,15,24,16);
  return {id:'pewter',grid,art:root+'city.webp',spawn:{x:15,y:18},returnGate:{x:15,y:18},returnTo:{world:'viridian-forest',spawn:{x:17,y:3}},exit:{x:30,y:11},next:{world:'route-3',spawn:{x:3,y:17}},npc:{x:16,y:12},npcName:'Guia de Pewter',npcIdle:'basic-adventure-girl.webp',npcArt:'assets/kanto/cinematics/trainers/adventure_girl.webp',object:{x:8,y:5},doors:[
   {id:'gym',name:'Ginásio de Brock',x:22,y:5},{id:'museum',name:'Museu de Ciências',x:8,y:5},
   {id:'center',name:'Centro Pokémon',x:6,y:10},{id:'market',name:'Loja',x:25,y:10},
   {id:'home',name:'Casa dos Rocha',x:7,y:15},{id:'house-east',name:'Casa do Colecionador',x:24,y:15}
  ],decor:[{x:282,y:264},{x:574,y:388},{x:608,y:420},{x:378,y:391}]};
 }
 function room(id){
  const special=id==='gym'||id==='museum',old=!special?W.PsyKantoInteriorsV9?.get?.(id):null;
  if(!special&&!old)return null;
  const grid=Array.from({length:27},()=>Array(18).fill(9));
  if(special){for(let y=8;y<=24;y++)for(let x=4;x<=13;x++)grid[y][x]=1;for(let y=24;y<=25;y++)for(let x=7;x<=10;x++)grid[y][x]=1;}
  else for(let y=0;y<27;y++)for(let x=0;x<18;x++){
   const px=(x+.5)*28/1.05,py=(y+.5)*28/1.05,bounds=old.walkBounds||[25,174,455,687];
   if(px>=bounds[0]&&py>=bounds[1]&&px<=bounds[2]&&py<=bounds[3]&&!old.blocks.some(([a,b,c,d])=>px>=a&&px<=c&&py>=b&&py<=d))grid[y][x]=1;
  }
  const npc=special?{x:8,y:9}:{x:8,y:id==='home'?17:11};grid[npc.y][npc.x]=1;
  return {id:'pewter-'+id,roomId:id,grid,art:special?root+id+'.webp':old.art,spawn:{x:8,y:23},exit:{x:8,y:25},npc,object:npc,npcName:id==='gym'?'Brock':id==='museum'?'Curadora Helena':id==='center'?'Enfermeira Íris':id==='market'?'Lojista de Pewter':'Morador de Pewter',npcIdle:id==='gym'?null:id==='museum'?'basic-black-girl.webp':'basic-adventure-girl.webp',npcArt:id==='gym'?root+'brock-idle.webp':'assets/kanto/cinematics/trainers/adventure_girl.webp',idleSheet:id==='gym',doors:[]};
 }
 W.PsyKantoPewterV4={get:street,room};
})(window);
