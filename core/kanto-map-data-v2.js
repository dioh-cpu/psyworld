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
    art:'assets/story/pallet-town-artist-v2.png',
    spawn:[603,609],exit:[605,63],
    paths:[
      [603,609,650,575,36],[650,575,680,488,35],
      [603,609,515,580,37],[515,580,425,511,35],
      [680,488,700,441,37],[425,511,205,474,37],[425,511,205,474,37],
      [612,455,652,355,37],[652,355,616,273,36],
      [616,273,602,175,42],[602,175,605,63,36],
      [425,511,422,488,28], // Market door
      [205,474,192,433,28], // Center door
      [445,511,350,399,31],[350,399,323,326,25], // house A
      [700,441,776,424,32], // house B
      [590,535,390,565,32],[390,565,225,615,28], // player's home
      [604,160,725,152,25],[725,152,885,135,25], // hill route toward lab
      [700,441,790,460,25]
    ],
    plazas:[[590,522,78,45],[610,575,42,42]],
    blockers:[[588,520,36]],
    grass:[],
    // Buildings are not passable and are entered only from the door coordinates.
    doors:[
      {id:'center',title:'Centro Pokémon',at:[192,433],inside:[380,400],range:38},
      {id:'market',title:'Poké Mart',at:[422,488],inside:[380,400],range:35},
      {id:'home',title:'Casa do Treinador',at:[225,615],inside:[380,400],range:44},
      {id:'house-east',title:'Casa da Vila',at:[776,424],inside:[380,400],range:39},
      {id:'house-west',title:'Casa do Vizinho',at:[323,326],inside:[380,400],range:42},
      {id:'lab',title:'Laboratório do Professor Carvalho',at:[885,135],inside:[380,400],range:40}
    ],
    npcs:[
      {id:'oak',name:'Professor Carvalho',at:[870,169],portrait:'assets/story/professor-oak.png',emote:'sereno'},
      {id:'lia',name:'Lia',at:[540,564],portrait:'assets/story/rival.png',emote:'alegre'},
      {id:'gate',name:'Guarda da Rota',at:[610,108],portrait:'assets/halloween/npc-noah.svg',emote:'atento'},
      {id:'neighbor',name:'Nina',at:[360,387],portrait:'assets/halloween/npc-mina.svg',emote:'amigável'}
    ],
    signs:[{at:[601,81],title:'ROTA 1 ↑'},{at:[690,510],title:'PALLET TOWN'}]
  };
  const route1={
    id:'route-1',title:'Rota 1 · Nível 1–3',w:1000,h:500,
    art:'assets/story/route-1-artist-v2.png',spawn:[83,440],exit:[929,51],
    paths:[
      [83,440,89,382,34],[89,382,150,319,36],[150,319,250,286,38],
      [250,286,370,272,39],[370,272,520,250,39],[520,250,625,234,40],
      [625,234,740,192,42],[740,192,892,152,38],[892,152,929,51,32],
      [213,297,213,224,27], // grass A stairs
      [419,270,419,345,30], // grass B entrance
      [720,202,735,169,33], // grass C entrance
      [760,198,820,266,35], // grass D entrance
      [550,257,550,295,31], // river-side viewpoint
    ],
    plazas:[],
    grass:[
      {id:'a',rect:[100,102,359,223],spawn:[225,176],entry:[213,224]},
      {id:'b',rect:[307,344,566,445],spawn:[434,394],entry:[419,345]},
      {id:'c',rect:[649,98,852,194],spawn:[736,154],entry:[735,169]},
      {id:'d',rect:[758,253,973,359],spawn:[840,312],entry:[820,266]}
    ],
    doors:[],npcs:[{id:'route-guide',name:'Exploradora Nara',at:[455,265],portrait:'assets/halloween/npc-luna.svg',emote:'curiosa'}],
    signs:[{at:[92,405],title:'PALLET TOWN ↓'},{at:[918,66],title:'VIRIDIAN CITY ↑'}]
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