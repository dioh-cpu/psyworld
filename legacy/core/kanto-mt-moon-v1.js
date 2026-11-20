/* MT. MOON V1 — authored collision routes over the approved cave illustration. */
(function(W){
  'use strict';
  if(W.PsyKantoMtMoonV1)return;
  const ART='assets/kanto/approved/mt-moon-approved.webp';
  const PIXELS=[
    '~~~~~~~~~~~~~~...~~~~~~~~~~~~~~~','~~~.~~~~~~~~~....#~~~~~~~~~~~~~~',
    '~~..~#~~~~~~~....~~~~##~~..~~~~~','~~.....~~~~~.....~~~##.....~~~~~',
    '~...~....~~~~~..~~~#..##..#.~~.~','~~..~....~~~~~#.~~~.........~#..',
    '~~~~~~...~~##~~~~~~~.....~~~~~~~','~~~~~~~...~~~~~~~~..~~.~~~~~~#~~',
    '~~~~~~~~..~~~~~~~~..~~...~~~~~.~','~~.~..~~...#~~~~~~~~.~~..##~~~~~',
    '~~.....~~......~~~~~..~...~~~~~~','~......~~~....#~~~~~..~~~.....~~',
    '~~~~.~~~~~~~##~~~~~~~.~~~.....~~','~~~~~#.~~~~~~~~~~~~~~~~~~~~~...~',
    '~~#~~...#~~#~~~~~~~~~~~~~~~~...~','~~~~~~...~~~~.~~..~~~~~~.~~~..~~',
    '~~~~~~~..~~~~~~~..~~~~~#~~~#..~~','~~~~~~~..~~~~~~....~~~~~~~~...~~',
    '~~~~~~~..~~.~~~~...~..~~~~~..~~~','~~~~~~~#.....~~~~~.....~~~~~.~~~',
    '~~~~~~~~........~......~~~~..#~~','~~~~#~~~~~...~........~~~~~#..~~',
    '~....#~~~~~~~~....~~~~.#~~.~~.~~','~......#~~~~~~~..~~~~~...~.....~',
    '~~~.....~~~~~~~..~~~~~.........~','~~~~.....~~~#~#..#~~~~....#~..~~',
    '~~~~~.....~#.#.....~~~~..##.~~~~','~~~~~.~............~~~~..~~~~~~~',
    '~~~~~~~~.................~~~~~~~','~~~~~~~~~~~~~~#..#~...~~~~~~~~~~',
    '~~~~~~~~~~~~~~~..~~~~~~~~~~~~~~~','~~~~~~~~~~~~~~~..~~~~~~~~~~~~~~~'
  ];
  const COLS=32,ROWS=32;
  function get(){
    const grid=PIXELS.map(row=>Array.from(row,c=>c==='.'?1:c==='~'?3:9));
    const walk=(x,y)=>{if(grid[y]&&grid[y][x]!==undefined)grid[y][x]=1;};
    const line=(a,b)=>{let [x0,y0]=a,[x1,y1]=b,dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1,err=dx+dy;for(;;){walk(x0,y0);if(x0===x1&&y0===y1)break;const e=2*err,oldX=x0,oldY=y0;if(e>=dy){err+=dy;x0+=sx}if(e<=dx){err+=dx;y0+=sy}if(x0!==oldX&&y0!==oldY){walk(x0,oldY);walk(oldX,y0)}}};
    // The narrow sandy galleries and their visible stair/bridge joints form
    // four connected cave areas. Water and solid rock remain impassable.
    [[16,1,16,5],[16,5,20,5],[20,5,23,6],[16,5,15,8],[15,8,12,10],
     [12,10,9,11],[9,11,8,15],[8,15,10,19],[10,19,14,20],
     [15,8,17,11],[17,11,20,13],[20,13,22,16],[22,16,25,18],
     [23,6,27,6],[27,6,28,10],[28,10,27,14],[27,14,27,18],
     [22,16,20,20],[20,20,16,21],[16,21,16,30],[14,20,16,21],
     [16,16,16,21],[20,5,20,9],[8,15,4,14],[8,15,3,6],[3,6,8,9],
     [9,11,10,12],[9,11,9,5],[12,10,8,10],[8,10,9,11],[10,19,8,21],[8,21,3,23],
     [27,6,28,5],[27,14,27,15],[25,18,28,24],[17,11,17,13]]
      .forEach(([x0,y0,x1,y1])=>line([x0,y0],[x1,y1]));
    const spawn={x:16,y:2},npc={x:15,y:4},object={x:8,y:10},exit={x:16,y:30};
    const actors=[
      {id:'moon-rocket-scout',role:'scout',name:'Recruta Rocket',x:26,y:6,art:'assets/story/rocket-grunt.png'},
      {id:'moon-rocket-leader',role:'leader',name:'Agente Rocket',x:28,y:9,art:'assets/story/rocket-grunt.png'}
    ];
    const spots=[[16,16],[20,9],[4,14],[27,15],[3,6],[28,5],[3,23],[28,24],[17,13],[10,12],[9,5]];
    [spawn,npc,object,exit,...actors].forEach(p=>walk(p.x,p.y));
    spots.forEach(([x,y],i)=>{if(grid[y]?.[x]!==undefined)grid[y][x]=i<4?5:1;});
    [[5,9],[11,11],[18,10],[23,20],[9,5],[3,23],[25,17]].forEach(([x,y])=>{if(grid[y]?.[x]===1)grid[y][x]=5;});
    return {id:'mt-moon',grid,art:ART,spawn,returnGate:spawn,returnTo:{world:'route-3',spawn:{x:28,y:13}},exit,object,next:{world:'route-4',spawn:{x:16,y:17}},npc,npcName:'Super Nerd Miguel',actors,stairs:[{x:8,y:15},{x:20,y:13},{x:27,y:14}],hobbySpots:spots.map(([x,y])=>({x,y})),encounterLevels:[10,16],areas:['Galeria da Entrada','Galeria Oeste','Passagem das Pontes','Câmara dos Fósseis']};
  }
  W.PsyKantoMtMoonV1={get,dimensions:()=>({cols:COLS,rows:ROWS})};
})(window);
