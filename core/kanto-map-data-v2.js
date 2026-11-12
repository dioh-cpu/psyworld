/* PSYWORLD Kanto Test V2. Walkable geometry is authored in map coordinates.
 * Distances and collision are independent of screen zoom, canvas and device.
 * Pallet polygons and other Kanto maps share a single coordinate-based walker.
 */
(function(W){
  'use strict';
  // Route path format: [x1,y1,x2,y2,walk radius]. Grass is an explicit rectangle, with
  // a bridge from the public path; never treat an arbitrary decorative tile as hunt.
  // One Pallet map: this 900x600 coordinate frame is the exact scale used
  // by pallet-town-artist-v2.webp; ground and blockers are traced in this
  // same frame, rather than copied from the square Atlas illustration.
  const pallet={
    id:'pallet',title:'Pallet Town',w:900,h:600,
    art:'assets/story/pallet-town-artist-v2.webp',spawn:[535,458],exit:[500,12],
    paths:[],plazas:[],blockers:[],
    ground:[[[458,0],[542,0],[548,86],[550,166],[553,280],[570,335],[555,370],[460,370],[445,335],[452,280],[450,165]],[[0,334],[900,334],[900,458],[820,462],[700,462],[620,466],[500,466],[390,462],[255,462],[0,458]],[[204,250],[280,250],[284,333],[272,360],[244,360],[235,330],[233,279]],[[534,147],[850,147],[860,178],[852,210],[700,211],[550,214],[535,190]],[[684,324],[824,324],[850,341],[900,341],[900,391],[817,390],[686,374]],[[227,424],[265,428],[272,462],[268,536],[247,562],[224,551],[214,520],[217,464]],[[225,529],[481,529],[524,552],[565,580],[570,600],[254,600],[225,574]],[[443,430],[492,430],[500,480],[492,535],[465,552],[444,527]],[[511,444],[575,444],[592,480],[592,600],[530,600],[520,540]],[[606,436],[670,436],[682,485],[681,600],[610,600],[604,527]],[[60,380],[250,380],[260,424],[240,441],[72,438],[50,414]],[[462,370],[539,370],[548,420],[545,458],[520,478],[478,476],[462,450]],[[91,538],[260,538],[264,600],[90,600]]],
    solids:[{"poly":[[66,244],[241,244],[244,388],[68,392]]},{"poly":[[322,297],[448,297],[448,395],[322,395]]},{"poly":[[194,137],[336,137],[337,262],[193,262]]},{"poly":[[679,17],[856,17],[860,174],[679,174]]},{"poly":[[621,196],[815,196],[819,327],[622,327]]},{"poly":[[64,469],[207,469],[207,554],[64,554]]},{"poly":[[259,461],[443,461],[443,533],[259,533]]},{"circle":[575,418,29]},{"circle":[373,191,13]},{"circle":[423,202,12]},{"circle":[574,232,12]},{"circle":[610,213,11]},{"circle":[860,440,24]},{"circle":[31,460,24]},{"poly":[[682,170],[735,170],[735,176],[682,176]]},{"poly":[[793,170],[850,170],[850,176],[793,176]]},{"poly":[[194,260],[245,260],[245,267],[194,267]]},{"poly":[[287,260],[337,260],[337,267],[287,267]]},{"poly":[[622,325],[714,325],[714,332],[622,332]]},{"poly":[[768,325],[819,325],[819,332],[768,332]]}],
    doors:[{"id":"center","title":"Centro Pokémon","at":[155,402],"range":42},{"id":"market","title":"Poké Mart","at":[384,407],"range":42},{"id":"house-west","title":"Casa do Vizinho","at":[266,269],"range":42},{"id":"lab","title":"Laboratório do Professor Carvalho","at":[764,181],"range":42},{"id":"house-east","title":"Casa da Vila","at":[741,340],"range":42},{"id":"home","title":"Casa do Treinador","at":[137,564],"range":42}],
    npcs:[{"id":"oak","name":"Professor Carvalho","at":[813,203],"portrait":"assets/halloween/npc-researcher.webp","emote":"sereno"},{"id":"lia","name":"Lia","at":[459,431],"portrait":"assets/story/rival.png","emote":"alegre"},{"id":"gate","name":"Guarda da Rota","at":[546,74],"portrait":"assets/halloween/npc-noah.svg","emote":"atento"},{"id":"neighbor","name":"Nina","at":[314,342],"portrait":"assets/halloween/npc-mina.svg","emote":"amigável"}],
    grass:[]
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