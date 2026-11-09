/* Kanto V6: authored Route 4 and Cerulean walk masks over approved art.
   Coordinates use the existing 28px campaign grid; movement stays in V4. */
(function(W){
  'use strict';
  if(W.PsyKantoCoastalV6)return;
  const COLS=32,ROWS=20,ROUTE_ART='assets/story/kanto-route-4-v6.webp';
  const CERULEAN_ART='assets/kanto/approved/cerulean-approved.webp';
  const MISTY='assets/kanto/npcs/misty-v6.png';
  const base=()=>Array.from({length:ROWS},()=>Array(COLS).fill(9));
  function line(grid,a,b,r=0,value=1){
    let [x0,y0]=a,[x1,y1]=b,dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1,err=dx+dy;
    for(;;){for(let oy=-r;oy<=r;oy++)for(let ox=-r;ox<=r;ox++)if(grid[y0+oy]?.[x0+ox]!==undefined)grid[y0+oy][x0+ox]=value;if(x0===x1&&y0===y1)break;const e=2*err,px=x0,py=y0;if(e>=dy){err+=dy;x0+=sx}if(e<=dx){err+=dx;y0+=sy}if(x0!==px&&y0!==py){if(grid[py]?.[x0]!==undefined)grid[py][x0]=value;if(grid[y0]?.[px]!==undefined)grid[y0][px]=value;}}
  }
  function route4(){
    const grid=base();
    const paint=(cells,value)=>cells.forEach(([x,y])=>{if(grid[y]?.[x]!==undefined&&grid[y][x]===9)grid[y][x]=value;});
    // This mask starts solid. Only the sandy switchback, bridge approach and
    // visibly open grassy patches are walkable; cliff, water and tree cover
    // remain blocked even where the illustration uses similar green colors.
    // Trace the visible sandy trail from the cave mouth, around the two
    // switchbacks, across the bridge, and into Cerulean's east gate. Keeping
    // these points on the painted road prevents the old broad rectangular
    // walk mask from making cliffs, trees, or the stream traversable.
    const points=[[12,19],[12,16],[14,13],[13,11],[10,10],[7,9],[5,8],[4,7],[3,6],[4,5],[7,5],[11,5],[15,5],[18,5],[21,6],[23,7],[26,7],[30,7]];
    for(let i=1;i<points.length;i++)line(grid,points[i-1],points[i],0,1);
    const spawn={x:12,y:18},returnGate={x:12,y:18},npc={x:8,y:11},exit={x:30,y:7};
    // Walkable grass pockets follow the actual clearings and tall grass.
    paint([[5,6],[5,7],[6,6],[6,7]],5);                               // grass clearing inside the west switchback
    paint([[8,11],[9,11],[10,11],[8,12],[9,12],[10,12]],2);          // open lower meadow beside the bend
    // Use only cells inside the visible meadow for the short access spur;
    // preserve the sandy trail cells and leave the adjacent rocks impassable.
    paint([[9,10],[10,10],[10,11]],2);
    paint([[18,6],[20,7],[20,8],[21,7]],2);                           // clear grassy shoulder beside the route/bridge
    paint([[27,6],[28,6],[27,7],[28,7]],5);                           // city-side flowers
    paint([[27,8],[27,7]],2);
    // Spots sit on their visible grass clearings or beside the rocky path.
    for(const [x,y]of [[9,12],[3,5],[27,6],[18,10],[20,8],[8,15],[11,14]])grid[y][x]=5;
    const actors=[
      {id:'route4-hiker',name:'Montanhista Raul',x:6,y:6,art:'assets/kanto/cinematics/trainers/adventure_boy.webp',dialog:'A trilha contorna as encostas. A grama alta abriga Pokémon que gostam de terrenos rochosos.'},
      {id:'route4-swimmer',name:'Nadadora Bia',x:27,y:6,art:'assets/kanto/cinematics/trainers/black_girl.webp',dialog:'Já dá para ouvir os canais de Cerulean. A entrada da cidade fica no fim da estrada.'}
    ];
    // NPCs stand on the two visible clearings beside the trail, never on the
    // cliff/stream mask or in the middle of the player's only passage.
    for(const actor of actors)if(grid[actor.y]?.[actor.x]!==undefined)grid[actor.y][actor.x]=1;
    return {id:'route-4',grid,art:ROUTE_ART,spawn,returnGate,returnTo:{world:'mt-moon',spawn:{x:16,y:30}},exit,next:{world:'cerulean',spawn:{x:16,y:18}},npc,npcName:'Treinadora Joana',npcArt:'assets/characters/halloween/basic-adventure-girl.webp',npcIdle:'basic-adventure-girl.webp',actors,encounterLevels:[9,13],areas:['Trilha das Encostas','Passagem dos Pinheiros','Portão de Cerulean']};
  }
  function cerulean(){
    const grid=base();
    // The center promenade and two short bridge spurs correspond to the
    // stone walkways in the approved aqueduct-city illustration.
    line(grid,[16,18],[16,4],0,1);
    line(grid,[8,8],[24,8],0,1);
    // Side branches follow the paved fronts of the west houses and the east
    // market/wharf. No walk cells are painted over canal water or rooftops.
    line(grid,[8,8],[7,10],0,1);
    line(grid,[12,8],[10,6],0,1);
    line(grid,[24,8],[25,9],0,1);
    line(grid,[25,8],[27,10],0,1);
    const spawn={x:16,y:18},returnGate={x:16,y:18},exit={x:16,y:18};
    const npc={x:17,y:7};grid[npc.y][npc.x]=1;
    const doors=[
      {id:'gym',room:'gym',name:'Ginásio de Misty',x:16,y:4},
      {id:'center',room:'shared',name:'Centro Pokémon',x:7,y:9},
      {id:'market',room:'shared',name:'Loja de Cerulean',x:25,y:9},
      {id:'house-west',room:'shared',name:'Casa à Beira do Canal',x:10,y:6}
    ];
    doors.forEach(d=>{if(grid[d.y]?.[d.x]!==undefined)grid[d.y][d.x]=1;});
    const actors=[
      {id:'cerulean-fisher',name:'Pescador do Canal',x:27,y:10,art:'assets/kanto/npcs/fisher-v9.svg',dialog:'As pontes de pedra deixam a água correr por toda a cidade. O cais fica a leste.'},
      {id:'cerulean-trainer',name:'Treinadora Luma',x:7,y:10,art:'assets/kanto/cinematics/trainers/adventure_girl.webp',dialog:'Misty leva a sério cada desafio. O Centro Pokémon ajuda a preparar sua equipe.'}
    ];
    actors.forEach(a=>{if(grid[a.y]?.[a.x]!==undefined)grid[a.y][a.x]=1;});
    return {id:'cerulean',grid,art:CERULEAN_ART,spawn,returnGate,returnTo:{world:'route-4',spawn:{x:29,y:9}},exit,suppressExitMarker:true,npc,npcName:'Misty',npcArt:MISTY,npcIdleAnimation:'breathe',doors,actors,next:null,encounterLevels:[10,15],areas:['Avenida dos Canais','Praça das Fontes','Ginásio Aquático']};
  }
  function gymRoom(){
    const grid=base();
    // The approved arena is a pool, not a walk-over surface. Only its broad
    // foreground deck is walkable; Misty waits at the pool edge for the trial.
    for(let y=16;y<20;y++)for(let x=12;x<20;x++)grid[y][x]=1;
    const spawn={x:16,y:18},exit={x:16,y:19},npc={x:16,y:16};
    return {id:'cerulean-gym',roomId:'gym',grid,art:'assets/kanto/approved/misty-arena-approved.webp',spawn,exit,npc,npcApproach:{x:16,y:17},object:npc,npcName:'Misty',npcArt:MISTY,npcIdleAnimation:'breathe',doors:[]};
  }
  function room(id){
    if(id==='gym')return gymRoom();
    return W.PsyKantoPewterV4?.room?.(id)||null;
  }
  W.PsyKantoCoastalV6={route4,cerulean,get:id=>id==='route-4'?route4():id==='cerulean'?cerulean():null,room,dimensions:()=>({cols:COLS,rows:ROWS})};
})(window);
