/* PSYWORLD — Pallet Town Anime 3/4 HD Complete 6-Area World (V6)
 * Pixel-exact 1200x675 Walkmasks & Precomputed Euclidean Signed Distance Fields (SDF)
 * across all 6 interconnected areas:
 *   01: pallet-centro-3q    (Centro e Residencias)
 *   02: pallet-jardins-3q   (Jardins e Bosque)
 *   03: pallet-lab-3q       (Laboratorio do Prof. Carvalho + Rota 1 Left Stair Passage)
 *   04: pallet-costa-3q     (Costa e Praia)
 *   05: pallet-colinas-3q   (Colinas e Pedreiras)
 *   06: pallet-arredores-3q (Arredores e Nova Rota 1)
 */
(function(W,D){
'use strict';
if(W.PsyKantoAnime3Q)return;

const params=new URLSearchParams(W.location?.search||'');
let enabled=params.get('visual')==='anime3q';
const debugEditorEnabled=params.get('debug')==='editor';
const LOGICAL_W=1200,LOGICAL_H=675;

function rectsOverlap(x,y,r,rect){
  return x+r>rect[0]&&x-r<rect[2]&&y+r>rect[1]&&y-r<rect[3];
}
function inEllipse(x,y,r,cx,cy,rx,ry){
  const dx=(x-cx)/(rx+r),dy=(y-cy)/(ry+r);
  return dx*dx+dy*dy<=1;
}
function inCircle(x,y,r,cx,cy,cr){
  const dx=x-cx,dy=y-cy,lim=cr+r;
  return dx*dx+dy*dy<=lim*lim;
}
function pointInPoly(x,y,poly){
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];
    if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside;
  }
  return inside;
}
function distPointToSegSq(px,py,ax,ay,bx,by){
  const dx=bx-ax,dy=by-ay,lenSq=dx*dx+dy*dy;
  let t=lenSq?((px-ax)*dx+(py-ay)*dy)/lenSq:0;
  if(t<0)t=0;else if(t>1)t=1;
  const cx=ax+t*dx,cy=ay+t*dy;
  return (px-cx)*(px-cx)+(py-cy)*(py-cy);
}
function circleHitsPoly(x,y,r,poly){
  if(pointInPoly(x,y,poly))return true;
  const rSq=r*r;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    if(distPointToSegSq(x,y,poly[j][0],poly[j][1],poly[i][0],poly[i][1])<=rSq)return true;
  }
  return false;
}
function inUnionPolys(x,y,polys){
  for(let i=0;i<polys.length;i++)if(pointInPoly(x,y,polys[i]))return true;
  return false;
}

const MAPS={
  'pallet-centro-3q':{
    id:'pallet-centro-3q',
    areaIndex:1,
    region:'pallet',
    title:'Pallet Town · Centro e Residências',
    subtitle:'Norte: Lab · Leste: Jardins · Sul: Costa · Oeste: Colinas',
    w:LOGICAL_W,h:LOGICAL_H,
    art:'assets/story/pallet/anime3q/01_centro_residencias.png',
    walkmask:'assets/story/pallet/anime3q/walkmasks/centro_walkmask.png',
    sdf:'assets/story/pallet/anime3q/walkmasks/centro_sdf.png',
    spawn:[600,430],
    exit:null,
    doors:[
      {id:'home',at:[350,222],title:'Casa de Red'},
      {id:'house-east',at:[975,220],title:'Casa Leste'}
    ],
    npcs:[
      {id:'lia',name:'Rival',at:[500,385],sprite:'assets/story/rival.png',portrait:'assets/story/rival.png',emote:'alegre'}
    ],
    grass:[],
    portals:[
      {
        id:'centro-to-lab',
        rect:[552,0,656,36],
        target:'pallet-lab-3q',
        spawn:[656,598],
        facing:'up',
        marker:[604,48],
        label:'LABORATÓRIO ↑',
        color:'#ffd480'
      },
      {
        id:'centro-to-jardins',
        rect:[1155,130,1200,240],
        target:'pallet-jardins-3q',
        spawn:[98,225],
        facing:'right',
        marker:[1162,195],
        label:'JARDINS →',
        color:'#80ffaa'
      },
      {
        id:'centro-to-costa',
        rect:[560,636,730,675],
        target:'pallet-costa-3q',
        spawn:[608,72],
        facing:'down',
        marker:[642,630],
        label:'COSTA ↓',
        color:'#79dced'
      },
      {
        id:'centro-to-colinas',
        rect:[0,150,42,232],
        target:'pallet-colinas-3q',
        spawn:[1124,282],
        facing:'left',
        marker:[48,198],
        label:'← COLINAS',
        color:'#f6c978'
      }
    ],
    walkPolys:[
      [[0,152],[135,222],[392,202],[542,196],[666,196],[895,212],[1200,132],[1200,235],[930,355],[745,498],[522,508],[345,472],[185,405],[0,335],[0,278],[125,332],[138,295],[0,225]],
      [[548,10],[658,10],[695,255],[510,255]],
      [[538,495],[716,495],[736,668],[526,668]],
      [[315,186],[390,186],[390,224],[315,224]]
    ],
    blockPolys:[
      [[395,120],[536,120],[536,194],[425,194]],
      [[672,120],[960,120],[960,214],[755,214],[672,194]]
    ],
    blocks:[
      [268,212,355,252],
      [758,196,840,236]
    ],
    ellipses:[
      {cx:598,cy:312,rx:132,ry:74}
    ],
    circles:[
      {cx:448,cy:348,r:8},
      {cx:500,cy:192,r:9},
      {cx:745,cy:192,r:9}
    ],
    occluders:[
      {id:'centro-lamp-west',kind:'lamp',mask:'assets/story/pallet/anime3q/masks/centro_lamp_west.png',rect:[433.493,248.193,462.201,350.053],baselineY:348,minY:248,xPad:16},
      {id:'centro-lamp-nw',kind:'lamp',mask:'assets/story/pallet/anime3q/masks/centro_lamp_nw.png',rect:[485.885,98.273,514.593,195.829],baselineY:194,minY:98,xPad:16},
      {id:'centro-lamp-ne',kind:'lamp',mask:'assets/story/pallet/anime3q/masks/centro_lamp_ne.png',rect:[730.622,108.316,759.33,195.829],baselineY:194,minY:108,xPad:16},
      {id:'centro-cherry-canopy',kind:'canopy',mask:'assets/story/pallet/anime3q/masks/centro_cherry_canopy.png',rect:[665,0,910,145],baselineY:172,minY:0,xPad:12}
    ]
  },

  'pallet-jardins-3q':{
    id:'pallet-jardins-3q',
    areaIndex:2,
    region:'pallet',
    title:'Pallet Town · Jardins e Bosque',
    subtitle:'Oeste: Centro · Sul: Costa e Praia',
    w:LOGICAL_W,h:LOGICAL_H,
    art:'assets/story/pallet/anime3q/02_jardins_bosque.png',
    walkmask:'assets/story/pallet/anime3q/walkmasks/jardins_walkmask.png',
    sdf:'assets/story/pallet/anime3q/walkmasks/jardins_sdf.png',
    spawn:[98,225],
    exit:null,
    doors:[
      {id:'center',at:[265,132],title:'Posto de Cura do Bosque'}
    ],
    npcs:[
      {id:'neighbor',name:'Mina',at:[215,320],sprite:'assets/halloween/npc-mina.svg',portrait:'assets/halloween/npc-mina.svg',emote:'curiosa'}
    ],
    grass:[],
    portals:[
      {
        id:'jardins-to-centro',
        rect:[0,135,45,290],
        target:'pallet-centro-3q',
        spawn:[1125,228],
        facing:'left',
        marker:[42,220],
        label:'← CENTRO',
        color:'#80ffaa'
      },
      {
        id:'jardins-to-costa',
        rect:[548,636,725,675],
        target:'pallet-costa-3q',
        spawn:[1114,74],
        facing:'down',
        marker:[635,626],
        label:'COSTA ↓',
        color:'#79dced'
      }
    ],
    hobbies:{fishing:true,gathering:true,techniques:['cut','surf']},
    walkPolys:[
      [[0,142],[185,228],[385,195],[385,375],[185,365],[0,268]],
      [[232,115],[315,115],[372,178],[295,210]],
      [[185,168],[585,152],[585,228],[185,232]],
      [[185,342],[585,342],[585,438],[185,408]],
      [[438,108],[582,108],[588,168],[438,168]],
      [[455,140],[602,140],[602,495],[455,495]],
      [[575,222],[810,222],[810,282],[575,282]],
      [[755,126],[1080,126],[1125,292],[782,292]],
      [[1055,22],[1165,22],[1140,225],[1045,225]],
      [[795,255],[915,255],[915,385],[795,385]],
      [[472,455],[675,455],[675,525],[472,525]],
      [[538,512],[672,512],[702,652],[555,652]]
    ],
    blockPolys:[
      [[546,302],[635,302],[635,442],[546,432]]
    ],
    blocks:[
      [402,172,468,208],
      [452,110,502,142],
      [600,198,780,223],
      [600,280,780,308],
      [792,286,848,324],
      [918,275,1075,375]
    ],
    ellipses:[
      {cx:345,cy:288,rx:140,ry:72},
      {cx:553,cy:242,rx:45,ry:21},
      {cx:965,cy:118,rx:52,ry:28}
    ],
    circles:[
      {cx:62,cy:292,r:9},
      {cx:553,cy:246,r:7},
      {cx:768,cy:186,r:20},
      {cx:882,cy:205,r:15},
      {cx:988,cy:224,r:12},
      {cx:868,cy:330,r:9}
    ],
    occluders:[
      {id:'jardins-lamp-west',kind:'lamp',mask:'assets/story/pallet/anime3q/masks/jardins_lamp_west.png',rect:[48.086,205.871,76.794,296.254],baselineY:294,minY:206,xPad:16},
      {id:'jardins-lamp-central',kind:'lamp',mask:'assets/story/pallet/anime3q/masks/jardins_lamp_central.png',rect:[538.278,152.072,566.986,248.193],baselineY:246,minY:152,xPad:16},
      {id:'jardins-lamp-east',kind:'lamp',mask:'assets/story/pallet/anime3q/masks/jardins_lamp_east.png',rect:[854.067,238.151,882.775,334.272],baselineY:332,minY:238,xPad:16},
      {id:'jardins-cherry-canopy',kind:'canopy',mask:'assets/story/pallet/anime3q/masks/jardins_cherry_canopy.png',rect:[690,62,850,168],baselineY:186,minY:62,xPad:12},
      {id:'jardins-great-tree-canopy',kind:'canopy',mask:'assets/story/pallet/anime3q/masks/jardins_great_tree_canopy.png',rect:[845,0,1085,92],baselineY:118,minY:0,xPad:12}
    ]
  },

  'pallet-lab-3q':{
    id:'pallet-lab-3q',
    areaIndex:3,
    region:'pallet',
    title:'Pallet Town · Laboratório do Prof. Carvalho',
    subtitle:'Suba as escadarias à esquerda para alcançar o arco da Rota 1',
    w:LOGICAL_W,h:LOGICAL_H,
    art:'assets/story/pallet/anime3q/03_laboratorio.png',
    walkmask:'assets/story/pallet/anime3q/walkmasks/lab_walkmask.png',
    sdf:'assets/story/pallet/anime3q/walkmasks/lab_sdf.png',
    spawn:[656,590],
    exit:null,
    doors:[
      {id:'lab',at:[638,304],title:'Laboratório do Prof. Carvalho'}
    ],
    npcs:[
      {id:'oak',name:'Professor Car’alho',at:[528,448],sprite:'assets/kanto/npcs/professor-v33.webp',portrait:'assets/story/professor-oak.png',emote:'sereno'},
      {id:'assistant',name:'Pesquisador Elias',at:[760,362],sprite:'assets/halloween/npc-researcher.webp',portrait:'assets/halloween/npc-researcher.webp',emote:'curioso'}
    ],
    grass:[],
    portals:[
      {
        id:'lab-to-centro',
        rect:[545,636,776,675],
        target:'pallet-centro-3q',
        spawn:[604,74],
        facing:'down',
        marker:[660,628],
        label:'CENTRO ↓',
        color:'#80ffaa'
      },
      {
        id:'lab-to-rota1',
        rect:[498,24,596,66],
        target:'pallet-arredores-3q',
        spawn:[570,598],
        facing:'up',
        marker:[548,78],
        label:'ROTA 1 ↑',
        color:'#a8ff80'
      }
    ],
    hobbies:{gathering:true,techniques:['cut']},
    walkPolys:[],
    blockPolys:[],
    blocks:[],
    ellipses:[],
    circles:[],
    occluders:[
      {id:'lab-rota1-arch',kind:'arch',mask:'assets/story/pallet/anime3q/masks/lab_rota1_arch.png',rect:[462,4,628,86],baselineY:78,minY:0,xPad:14},
      {id:'lab-lamp-sw',kind:'lamp',mask:'assets/story/pallet/anime3q/masks/lab_lamp_sw.png',rect:[402,404,434,492],baselineY:486,minY:404,xPad:16},
      {id:'lab-lamp-se',kind:'lamp',mask:'assets/story/pallet/anime3q/masks/lab_lamp_se.png',rect:[877,418,909,498],baselineY:492,minY:418,xPad:16},
      {id:'lab-lamp-mid-left',kind:'lamp',mask:'assets/story/pallet/anime3q/masks/lab_lamp_mid_left.png',rect:[121,246,153,336],baselineY:330,minY:246,xPad:16}
    ]
  },

  'pallet-costa-3q':{
    id:'pallet-costa-3q',
    areaIndex:4,
    region:'pallet',
    title:'Pallet Town · Costa e Praia',
    subtitle:'Norte: Centro · NE: Jardins · NO: Colinas · Pesca no Píer e Praia',
    w:LOGICAL_W,h:LOGICAL_H,
    art:'assets/story/pallet/anime3q/04_costa_praia.png',
    walkmask:'assets/story/pallet/anime3q/walkmasks/costa_walkmask.png',
    sdf:'assets/story/pallet/anime3q/walkmasks/costa_sdf.png',
    spawn:[608,120],
    exit:null,
    doors:[
      {id:'house-west',at:[292,204],title:'Cabana do Pescador'}
    ],
    npcs:[
      {id:'fisher',name:'Seu Abel',at:[848,286],sprite:'assets/kanto/npcs/fisher-v9.svg',portrait:'assets/kanto/npcs/fisher-v9.svg',emote:'tranquilo'}
    ],
    grass:[],
    portals:[
      {
        id:'costa-to-centro',
        rect:[525,0,685,38],
        target:'pallet-centro-3q',
        spawn:[642,598],
        facing:'up',
        marker:[608,52],
        label:'CENTRO ↑',
        color:'#80ffaa'
      },
      {
        id:'costa-to-jardins',
        rect:[1095,0,1190,42],
        target:'pallet-jardins-3q',
        spawn:[622,598],
        facing:'up',
        marker:[1124,52],
        label:'JARDINS ↑',
        color:'#80ffaa'
      },
      {
        id:'costa-to-colinas',
        rect:[72,0,172,42],
        target:'pallet-colinas-3q',
        spawn:[462,608],
        facing:'up',
        marker:[120,52],
        label:'COLINAS ↑',
        color:'#f6c978'
      }
    ],
    hobbies:{fishing:true,gathering:true,techniques:['surf','cut']},
    walkPolys:[],
    blockPolys:[],
    blocks:[],
    ellipses:[],
    circles:[],
    occluders:[
      {id:'costa-lamp-plaza-right',kind:'lamp',mask:'assets/story/pallet/anime3q/masks/costa_lamp_plaza_right.png',rect:[781,170,813,248],baselineY:242,minY:170,xPad:16},
      {id:'costa-lamp-pier',kind:'lamp',mask:'assets/story/pallet/anime3q/masks/costa_lamp_pier.png',rect:[893,332,925,412],baselineY:406,minY:332,xPad:16}
    ]
  },

  'pallet-colinas-3q':{
    id:'pallet-colinas-3q',
    areaIndex:5,
    region:'pallet',
    title:'Pallet Town · Colinas e Pedreiras',
    subtitle:'Leste: Centro · Sul: Costa e Praia · Trilhos de Mineração',
    w:LOGICAL_W,h:LOGICAL_H,
    art:'assets/story/pallet/anime3q/05_colinas_pedreiras.png',
    walkmask:'assets/story/pallet/anime3q/walkmasks/colinas_walkmask.png',
    sdf:'assets/story/pallet/anime3q/walkmasks/colinas_sdf.png',
    spawn:[1100,276],
    exit:null,
    doors:[
      {id:'market',at:[295,285],title:'Posto dos Mineradores'}
    ],
    npcs:[
      {id:'child',name:'Luna',at:[248,308],sprite:'assets/kanto/npcs/child-v9.svg',portrait:'assets/kanto/npcs/child-v9.svg',emote:'animada'}
    ],
    grass:[],
    portals:[
      {
        id:'colinas-to-centro',
        rect:[1155,240,1200,340],
        target:'pallet-centro-3q',
        spawn:[74,212],
        facing:'right',
        marker:[1152,286],
        label:'CENTRO →',
        color:'#80ffaa'
      },
      {
        id:'colinas-to-costa',
        rect:[438,636,538,675],
        target:'pallet-costa-3q',
        spawn:[118,70],
        facing:'down',
        marker:[486,626],
        label:'COSTA ↓',
        color:'#79dced'
      }
    ],
    hobbies:{mining:true,gathering:true,techniques:['rockSmash','dig']},
    walkPolys:[],
    blockPolys:[],
    blocks:[],
    ellipses:[],
    circles:[],
    occluders:[
      {id:'colinas-lamp-upper',kind:'lamp',mask:'assets/story/pallet/anime3q/masks/colinas_lamp_upper.png',rect:[950,190,982,284],baselineY:278,minY:190,xPad:16}
    ]
  },

  'pallet-arredores-3q':{
    id:'pallet-arredores-3q',
    areaIndex:6,
    region:'route-1',
    isRoute1:true,
    title:'Rota 1 · Arredores de Pallet Town',
    subtitle:'Sul: Laboratório · Campos de Grama Alta · Norte: Viridian City',
    w:LOGICAL_W,h:LOGICAL_H,
    art:'assets/story/pallet/anime3q/06_arredores_rota1.png',
    walkmask:'assets/story/pallet/anime3q/walkmasks/rota1_walkmask.png',
    sdf:'assets/story/pallet/anime3q/walkmasks/rota1_sdf.png',
    spawn:[570,590],
    exit:[770,24],
    doors:[],
    npcs:[
      {id:'route-guide',name:'Exploradora Nara',at:[632,372],sprite:'assets/halloween/npc-luna.svg',portrait:'assets/halloween/npc-luna.svg',emote:'curiosa'}
    ],
    grass:[
      {id:'a',rect:[210,68,470,174],spawn:[345,125],entry:[242,165]},
      {id:'b',rect:[710,158,1005,256],spawn:[850,210],entry:[915,255]},
      {id:'c',rect:[895,325,1142,425],spawn:[1020,375],entry:[915,325]}
    ],
    portals:[
      {
        id:'rota1-to-lab',
        rect:[498,636,642,675],
        target:'pallet-lab-3q',
        spawn:[452,108],
        facing:'down',
        marker:[570,624],
        label:'LABORATÓRIO ↓',
        color:'#ffd480'
      },
      {
        id:'rota1-to-viridian',
        rect:[730,0,835,28],
        action:'exitWorld',
        marker:[772,42],
        label:'VIRIDIAN CITY ↑',
        color:'#80ffaa'
      }
    ],
    hobbies:{fishing:true,gathering:true,mining:true,techniques:['cut','dig','rockSmash']},
    walkPolys:[],
    blockPolys:[],
    blocks:[],
    ellipses:[],
    circles:[],
    occluders:[
      {id:'rota1-lamp-crossroads',kind:'lamp',mask:'assets/story/pallet/anime3q/masks/rota1_lamp_crossroads.png',rect:[357,224,389,342],baselineY:336,minY:224,xPad:16},
      {id:'rota1-signpost',kind:'sign',mask:'assets/story/pallet/anime3q/masks/rota1_signpost.png',rect:[556,240,590,336],baselineY:330,minY:240,xPad:16}
    ]
  }
};

// Preload RGBA foreground occluder masks
const maskCache=new Map();
function getMaskImage(src){
  if(!src)return null;
  if(maskCache.has(src))return maskCache.get(src);
  const im=new Image();
  const entry={im,loaded:false};
  im.onload=()=>{entry.loaded=true;};
  im.src=src;
  maskCache.set(src,entry);
  return entry;
}
Object.values(MAPS).forEach(m=>(m.occluders||[]).forEach(o=>getMaskImage(o.mask)));

// Preload 1200x675 Euclidean Signed Distance Field (SDF) collision buffers (dist = pixel * 0.25)
const sdfCache=new Map();
const readyPromises=[];
function getSdfEntry(src){
  if(!src)return null;
  if(sdfCache.has(src))return sdfCache.get(src);
  const entry={src,im:new Image(),loaded:false,buf:null,debugCanvas:null};
  entry.promise=new Promise(resolve=>{
    entry.im.onload=()=>{
      try{
        const cv=D.createElement('canvas');
        cv.width=LOGICAL_W;cv.height=LOGICAL_H;
        const cx=cv.getContext('2d',{willReadFrequently:true});
        cx.drawImage(entry.im,0,0,LOGICAL_W,LOGICAL_H);
        const raw=cx.getImageData(0,0,LOGICAL_W,LOGICAL_H).data;
        const buf=new Uint8Array(LOGICAL_W*LOGICAL_H);
        for(let i=0,p=0;i<buf.length;i++,p+=4)buf[i]=raw[p];
        entry.buf=buf;
        entry.loaded=true;
      }catch(err){console.warn('Anime3Q SDF decode failed',src,err);}
      resolve(entry);
    };
    entry.im.onerror=()=>{resolve(entry);};
    entry.im.src=src;
  });
  readyPromises.push(entry.promise);
  sdfCache.set(src,entry);
  return entry;
}
Object.values(MAPS).forEach(m=>{if(m.sdf)getSdfEntry(m.sdf);});

function whenReady(){
  return Promise.all(readyPromises).then(()=>true);
}
function isSdfReady(id){
  const m=id?MAPS[id]:null;
  if(m)return !!getSdfEntry(m.sdf)?.buf;
  return Object.values(MAPS).every(mp=>!mp.sdf||!!getSdfEntry(mp.sdf)?.buf);
}

// O(1) bilinear Euclidean distance to nearest blocked pixel (in logical pixels)
function sdfDist(id,x,y){
  const m=MAPS[id];
  if(!m?.sdf)return null;
  const entry=getSdfEntry(m.sdf);
  if(!entry?.buf)return null;
  const buf=entry.buf;
  const fx=Math.max(0,Math.min(LOGICAL_W-1.0001,x));
  const fy=Math.max(0,Math.min(LOGICAL_H-1.0001,y));
  const x0=fx|0,y0=fy|0;
  const x1=x0+1<LOGICAL_W?x0+1:x0;
  const y1=y0+1<LOGICAL_H?y0+1:y0;
  const tx=fx-x0,ty=fy-y0;
  const i0=y0*LOGICAL_W+x0,i1=y1*LOGICAL_W+x0;
  const d00=buf[i0],d10=buf[y0*LOGICAL_W+x1];
  const d01=buf[i1],d11=buf[y1*LOGICAL_W+x1];
  const v0=d00+(d10-d00)*tx;
  const v1=d01+(d11-d01)*tx;
  return (v0+(v1-v0)*ty)*0.25;
}

// Unit inward gradient normal from SDF for smooth diagonal/curved wall-sliding
function sdfNormal(id,x,y){
  const dL=sdfDist(id,x-1,y),dR=sdfDist(id,x+1,y);
  const dU=sdfDist(id,x,y-1),dD=sdfDist(id,x,y+1);
  if(dL===null||dR===null||dU===null||dD===null)return null;
  const gx=(dR-dL)*0.5,gy=(dD-dU)*0.5;
  const len=Math.hypot(gx,gy);
  if(len<1e-4)return null;
  return [gx/len,gy/len];
}

function isPilotMap(id){
  return !!MAPS[id];
}

function getMap(id){
  return MAPS[id]||null;
}

function listMaps(){
  return Object.values(MAPS);
}

// Primary: Pixel-Exact 1200x675 Euclidean SDF check (dist >= r).
function walkable(id,x,y,r=11){
  const m=MAPS[id];
  if(!m)return false;
  const foot=Math.max(0,Number(r)||11);
  if(x<foot||y<foot||x>m.w-foot||y>m.h-foot)return false;
  const d=sdfDist(id,x,y);
  if(d!==null)return d>=foot;
  if(m.walkPolys?.length){
    if(!inUnionPolys(x,y,m.walkPolys))return false;
    for(let i=0;i<16;i++){
      const a=i*Math.PI/8;
      if(!inUnionPolys(x+Math.cos(a)*foot,y+Math.sin(a)*foot,m.walkPolys))return false;
    }
    if(m.blockPolys?.some(p=>circleHitsPoly(x,y,foot,p)))return false;
    if(m.blocks?.some(b=>rectsOverlap(x,y,foot,b)))return false;
    if(m.ellipses?.some(e=>inEllipse(x,y,foot,e.cx,e.cy,e.rx,e.ry)))return false;
    if(m.circles?.some(c=>inCircle(x,y,foot,c.cx,c.cy,c.r)))return false;
    return true;
  }
  return false;
}

function checkPortal(id,x,y){
  const m=MAPS[id];
  if(!m)return null;
  for(const p of (m.portals||[])){
    const [x1,y1,x2,y2]=p.rect;
    if(x>=x1&&x<=x2&&y>=y1&&y<=y2)return p;
  }
  return null;
}

// Navigation mesh / grid connectivity analyzer (verifies zero isolated walkable islands)
function analyzeConnectivity(id,step=6,r=11){
  const m=MAPS[id];
  if(!m)return null;
  const nx=Math.ceil(m.w/step),ny=Math.ceil(m.h/step);
  const valid=new Uint8Array(nx*ny);
  let totalValid=0;
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
    if(walkable(id,x*step,y*step,r)){valid[y*nx+x]=1;totalValid++;}
  }
  const visited=new Uint8Array(nx*ny);
  const components=[];
  const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
    const idx=y*nx+x;
    if(!valid[idx]||visited[idx])continue;
    const q=[idx];visited[idx]=1;let count=0,sample=[x*step,y*step];
    while(q.length){
      const cur=q.pop();count++;
      const cx=cur%nx,cy=(cur/nx)|0;
      for(const [dx,dy] of dirs){
        const xx=cx+dx,yy=cy+dy;
        if(xx<0||yy<0||xx>=nx||yy>=ny)continue;
        const nIdx=yy*nx+xx;
        if(valid[nIdx]&&!visited[nIdx]){visited[nIdx]=1;q.push(nIdx);}
      }
    }
    components.push({cells:count,sample});
  }
  components.sort((a,b)=>b.cells-a.cells);
  return {mapId:id,step,radius:r,totalValidCells:totalValid,componentCount:components.length,components};
}

// Dedicated WebGL2 renderer for Anime 3/4 HD pilot maps
let glCanvas=null,gl=null,prog=null,quadBuf=null,contextLost=false,glVisible=false;
const glTextures=new Map();

const VS=`#version 300 es
precision highp float;
in vec2 a_pos;
in vec2 a_uv;
uniform vec4 u_rect;
uniform vec4 u_view;
uniform vec2 u_offset;
out vec2 v_uv;
void main(){
  vec2 wp=u_rect.xy+a_pos*u_rect.zw;
  vec2 sp=wp*u_view.z+u_offset;
  vec2 ndc=vec2((sp.x/u_view.x)*2.0-1.0,1.0-(sp.y/u_view.y)*2.0);
  gl_Position=vec4(ndc,0.0,1.0);
  v_uv=a_uv;
}`;

const FS=`#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_tex;
out vec4 outColor;
void main(){
  outColor=texture(u_tex,v_uv);
}`;

function initGL(stage){
  if(contextLost||!stage)return false;
  if(gl&&glCanvas&&glCanvas.parentNode===stage)return true;
  if(!glCanvas){
    glCanvas=D.createElement('canvas');
    glCanvas.className='kw2-hd-gl';
    glCanvas.setAttribute('aria-hidden','true');
    glCanvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;glTextures.clear();},false);
    glCanvas.addEventListener('webglcontextrestored',()=>{contextLost=false;gl=null;prog=null;quadBuf=null;initGL(stage);},false);
  }
  if(glCanvas.parentNode!==stage)stage.insertBefore(glCanvas,stage.firstChild);
  if(!gl){
    gl=glCanvas.getContext('webgl2',{alpha:false,antialias:true,powerPreference:'high-performance'});
    if(!gl)return false;
  }
  if(!prog){
    const vs=gl.createShader(gl.VERTEX_SHADER);gl.shaderSource(vs,VS);gl.compileShader(vs);
    const fs=gl.createShader(gl.FRAGMENT_SHADER);gl.shaderSource(fs,FS);gl.compileShader(fs);
    prog=gl.createProgram();gl.attachShader(prog,vs);gl.attachShader(prog,fs);gl.linkProgram(prog);
    gl.deleteShader(vs);gl.deleteShader(fs);
  }
  if(!quadBuf){
    quadBuf=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,0,0, 1,0,1,0, 0,1,0,1, 1,1,1,1]),gl.STATIC_DRAW);
  }
  return true;
}

function renderBackground(stage,view,mapId,img){
  if(!initGL(stage)||!img?.complete||!img.naturalWidth)return false;
  glVisible=true;
  glCanvas.style.display='block';
  if(glCanvas.width!==view.w||glCanvas.height!==view.h){
    glCanvas.width=view.w;glCanvas.height=view.h;
  }
  let rec=glTextures.get(mapId);
  if(!rec||rec.img!==img){
    if(rec?.tex)gl.deleteTexture(rec.tex);
    const tex=gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    rec={tex,img,w:img.naturalWidth,h:img.naturalHeight};
    glTextures.set(mapId,rec);
  }
  gl.viewport(0,0,view.w,view.h);
  gl.clearColor(0.055,0.11,0.14,1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER,quadBuf);
  const pLoc=gl.getAttribLocation(prog,'a_pos'),uLoc=gl.getAttribLocation(prog,'a_uv');
  gl.enableVertexAttribArray(pLoc);gl.vertexAttribPointer(pLoc,2,gl.FLOAT,false,16,0);
  gl.enableVertexAttribArray(uLoc);gl.vertexAttribPointer(uLoc,2,gl.FLOAT,false,16,8);
  gl.uniform4f(gl.getUniformLocation(prog,'u_rect'),0,0,LOGICAL_W,LOGICAL_H);
  gl.uniform4f(gl.getUniformLocation(prog,'u_view'),view.w,view.h,view.scale,0);
  gl.uniform2f(gl.getUniformLocation(prog,'u_offset'),view.ox,view.oy);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,rec.tex);
  gl.uniform1i(gl.getUniformLocation(prog,'u_tex'),0);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  return true;
}

function getActiveOccluders(mapId,playerX,playerY){
  const m=MAPS[mapId];
  if(!m?.occluders?.length)return [];
  const px=Number.isFinite(playerX)?playerX:null;
  return m.occluders.filter(occ=>{
    if(playerY>=occ.baselineY)return false;
    if(occ.minY!==undefined&&playerY<occ.minY)return false;
    if(px!==null){
      const pad=occ.xPad??16;
      if(px<occ.rect[0]-pad||px>occ.rect[2]+pad)return false;
    }
    return true;
  });
}

let occludersEnabled=true;
function drawOccluders(c,mapId,img,playerY,playerX){
  if(occludersEnabled){
    const active=getActiveOccluders(mapId,playerX,playerY);
    for(const occ of active){
      const maskEntry=getMaskImage(occ.mask);
      if(!maskEntry?.loaded||!maskEntry.im.naturalWidth)continue;
      const [x1,y1,x2,y2]=occ.rect;
      c.drawImage(maskEntry.im,0,0,maskEntry.im.naturalWidth,maskEntry.im.naturalHeight,x1,y1,x2-x1,y2-y1);
    }
  }
  if(debugOverlayVisible)drawDebugOverlay(c,mapId);
}

// Development-only visual collision & occlusion editor (?visual=anime3q&debug=editor)
let debugOverlayVisible=debugEditorEnabled;
function getSdfDebugCanvas(mapId){
  const m=MAPS[mapId];if(!m?.sdf)return null;
  const entry=getSdfEntry(m.sdf);
  if(!entry?.buf)return null;
  if(entry.debugCanvas)return entry.debugCanvas;
  const cv=D.createElement('canvas');
  cv.width=LOGICAL_W;cv.height=LOGICAL_H;
  const cx=cv.getContext('2d');
  const img=cx.createImageData(LOGICAL_W,LOGICAL_H);
  const d=img.data,buf=entry.buf;
  for(let i=0;i<buf.length;i++){
    const dist4=buf[i],p=i*4;
    if(dist4===0){d[p]=239;d[p+1]=68;d[p+2]=68;d[p+3]=95;}
    else if(dist4<44){d[p]=250;d[p+1]=204;d[p+2]=21;d[p+3]=110;}
    else{d[p]=34;d[p+1]=197;d[p+2]=94;d[p+3]=70;}
  }
  cx.putImageData(img,0,0);
  entry.debugCanvas=cv;
  return cv;
}
function drawDebugOverlay(c,mapId){
  const m=MAPS[mapId];if(!m)return;
  c.save();
  const dbg=getSdfDebugCanvas(mapId);
  if(dbg){
    c.drawImage(dbg,0,0,LOGICAL_W,LOGICAL_H);
  }else if(m.walkPolys?.length){
    c.fillStyle='rgba(34,197,94,0.18)';c.strokeStyle='#22c55e';c.lineWidth=1.5;
    for(const poly of m.walkPolys){
      c.beginPath();poly.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.fill();c.stroke();
    }
    c.fillStyle='rgba(239,68,68,0.28)';c.strokeStyle='#ef4444';
    for(const poly of (m.blockPolys||[])){
      c.beginPath();poly.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.fill();c.stroke();
    }
    for(const [x1,y1,x2,y2] of (m.blocks||[])){c.fillRect(x1,y1,x2-x1,y2-y1);c.strokeRect(x1,y1,x2-x1,y2-y1);}
  }
  // Grid 50px
  c.lineWidth=0.6;c.strokeStyle='rgba(255,255,255,0.22)';
  for(let x=0;x<=m.w;x+=50){c.beginPath();c.moveTo(x,0);c.lineTo(x,m.h);c.stroke();}
  for(let y=0;y<=m.h;y+=50){c.beginPath();c.moveTo(0,y);c.lineTo(m.w,y);c.stroke();}
  // Tall grass zones (emerald dashed)
  c.fillStyle='rgba(16,185,129,0.20)';c.strokeStyle='#10b981';c.lineWidth=1.8;
  for(const g of (m.grass||[])){
    const [x1,y1,x2,y2]=g.rect;c.fillRect(x1,y1,x2-x1,y2-y1);c.strokeRect(x1,y1,x2-x1,y2-y1);
  }
  // Occluder bounds (cyan dashed)
  c.strokeStyle='#38bdf8';c.lineWidth=1.4;c.setLineDash([4,3]);
  for(const o of (m.occluders||[])){
    const [x1,y1,x2,y2]=o.rect;c.strokeRect(x1,y1,x2-x1,y2-y1);
  }
  c.setLineDash([]);
  // Portals (yellow)
  c.fillStyle='rgba(250,204,21,0.25)';c.strokeStyle='#facc15';
  for(const p of (m.portals||[])){
    const [x1,y1,x2,y2]=p.rect;c.fillRect(x1,y1,x2-x1,y2-y1);c.strokeRect(x1,y1,x2-x1,y2-y1);
  }
  c.restore();
}

function exportGeometryJSON(){
  return JSON.stringify({version:'PALLET_ANIME3Q_V6_SDF_20261115',logicalSize:[LOGICAL_W,LOGICAL_H],maps:MAPS},null,2);
}

function hide(){
  if(glCanvas&&glVisible){glCanvas.style.display='none';glVisible=false;}
}

W.PsyKantoAnime3Q={
  version:6,
  isEnabled:()=>enabled,
  setEnabled:v=>{enabled=!!v;},
  whenReady,
  isSdfReady,
  isPilotMap,
  getMap,
  listMaps,
  walkable,
  sdfDist,
  sdfNormal,
  getWalkmaskUrl:id=>MAPS[id]?.walkmask||null,
  getSdfUrl:id=>MAPS[id]?.sdf||null,
  checkPortal,
  analyzeConnectivity,
  renderBackground,
  drawOccluders,
  getActiveOccluders,
  setOccludersEnabled:v=>{occludersEnabled=!!v;},
  setDebugOverlay:v=>{debugOverlayVisible=!!v;},
  exportGeometryJSON,
  hide,
  characterScale:1.56,
  followerScale:1.18
};
})(window,document);
