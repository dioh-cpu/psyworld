/* PSYWORLD Kanto Test V2. Walkable geometry is authored in map coordinates.
 * Distances and collision are independent of screen zoom, canvas and device.
 * All obstacles default to solid; paths, plazas and reachable grass are allowed.
 */
(function(W){
  'use strict';
  // Path format: [x1,y1,x2,y2,walk radius]. Grass is an explicit rectangle, with
  // a bridge from the public path; never treat an arbitrary decorative tile as hunt.
  const pallet={
    id:'pallet',title:'Pallet Town',w:1000,h:667,
    art:'assets/story/pallet-town-artist-v2.webp',
    spawn:[510,475],exit:[573,42],
    // Paths follow the approved painted streets; solid anywhere not authored.
    // Pallet playtest: the approved green-marked lanes are the only walkable
    // ground. Everything outside these narrow corridors/plazas remains solid.
    paths:[
      // The green-marked north street is intentionally wide enough for the
      // trainer's full collision radius while allowing free left/right travel.
      [570,52,570,424,46],
      [570,424,558,458,40],[558,458,520,470,38],
      [520,470,462,470,36],[462,470,320,466,34],
      [320,466,230,468,32],[230,468,76,466,31],
      [320,466,306,520,34],[306,520,310,585,33],
      [310,585,390,605,34],[390,605,525,600,35],
      [520,470,500,510,35],[500,510,430,512,33],
      [430,512,320,512,32],
      [570,424,578,470,40],[578,470,590,515,38],
      [590,515,650,520,36],[650,520,716,524,37],
      [716,524,720,585,36],[720,585,720,667,36],
      [525,600,550,630,34],[550,630,550,667,32]
    ],
    plazas:[[588,552,37,27]],
    blockers:[],
    grass:[],
    doors:[
      {id:'center',title:'Centro Pokémon',at:[167,430],inside:[380,400],range:42},
      {id:'market',title:'Poké Mart',at:[405,446],inside:[380,400],range:42},
      {id:'home',title:'Casa do Treinador',at:[214,602],inside:[380,400],range:44},
      {id:'house-east',title:'Casa da Vila',at:[812,341],inside:[380,400],range:40},
      {id:'house-west',title:'Casa do Vizinho',at:[309,309],inside:[380,400],range:41},
      {id:'lab',title:'Laboratório do Professor Carvalho',at:[861,110],inside:[380,400],range:42}
    ],
    npcs:[
      {id:'oak',name:'Professor Carvalho',at:[528,385],portrait:'assets/halloween/npc-researcher.webp',emote:'sereno'},
      {id:'lia',name:'Lia',at:[461,415],portrait:'assets/story/rival.png',emote:'alegre'},
      {id:'gate',name:'Guarda da Rota',at:[575,106],portrait:'assets/halloween/npc-noah.svg',emote:'atento'},
      {id:'neighbor',name:'Nina',at:[373,312],portrait:'assets/halloween/npc-mina.svg',emote:'amigável'}
    ],
    signs:[{at:[573,42],title:'ROTA 1 ↑'},{at:[664,525],title:'PALLET TOWN'}]
  };
  const route1={
    id:'route-1',title:'Rota 1 · Nível 1–3',w:1000,h:500,
    art:'assets/story/route-1-artist-v2.webp',spawn:[99,450],exit:[939,81],
    paths:[
      [99,450,102,395,26],[102,395,166,334,30],
      [166,334,250,294,31],[250,294,397,290,30],
      [397,290,519,275,31],[519,275,599,255,29],
      [599,255,711,221,33],[711,221,828,191,31],
      [828,191,913,139,28],[913,139,939,81,26],
      [220,310,216,232,24],
      [366,289,363,347,27],
      [711,221,718,200,26],
      [827,191,827,288,27]
    ],
    plazas:[],
    grass:[
      {id:'a',rect:[86,91,350,225],spawn:[216,170],entry:[216,225]},
      {id:'b',rect:[266,344,535,449],spawn:[362,385],entry:[363,346]},
      {id:'c',rect:[615,169,840,234],spawn:[721,193],entry:[718,210]},
      {id:'d',rect:[718,271,941,379],spawn:[833,318],entry:[827,282]}
    ],
    doors:[],
    npcs:[{id:'route-guide',name:'Exploradora Nara',at:[439,285],portrait:'assets/halloween/npc-luna.svg',emote:'curiosa'}],
    signs:[{at:[93,420],title:'PALLET TOWN ↓'},{at:[939,81],title:'VIRIDIAN CITY ↑'}]
  };
  function sq(a,b){return (a[0]-b[0])**2+(a[1]-b[1])**2}
  function distSegment(x,y,line){const [ax,ay,bx,by,r]=line,dx=bx-ax,dy=by-ay;const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-ax-dx*t,y-ay-dy*t)-r}
  function grassAt(map,x,y){return map.grass.find(g=>x>=g.rect[0]&&x<=g.rect[2]&&y>=g.rect[1]&&y<=g.rect[3])||null}
  function walkable(map,x,y,body=6){if(x<body||y<body||x>=map.w-body||y>=map.h-body)return false;
    if((map.blockers||[]).some(([cx,cy,r])=>Math.hypot(x-cx,y-cy)<r+body))return false;
    if(map.paths.some(s=>distSegment(x,y,s)<=-body))return true;
    if(map.plazas.some(([cx,cy,rx,ry])=>Math.abs(x-cx)<=rx-body&&Math.abs(y-cy)<=ry-body))return true;
    return !!map.grass.some(g=>x>=g.rect[0]+body&&x<=g.rect[2]-body&&y>=g.rect[1]+body&&y<=g.rect[3]-body);
  }
  W.PsyKantoMapDataV2={pallet,route1,walkable,grassAt,distSegment,sq};
})(window);