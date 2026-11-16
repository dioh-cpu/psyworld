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
const visualParam=params.get('visual');
let enabled=visualParam!=='legacy'&&visualParam!=='v2';
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
    spawn:[600,460],
    exit:null,
    doors:[
      {id:'home',at:[312,240],title:'Casa de Red'},
      {id:'house-east',at:[912,298],title:'Casa Leste'}
    ],
    npcs:[
      {id:'lia',name:'Rival',at:[470,385],sprite:'assets/story/rival.png',portrait:'assets/story/rival.png',emote:'alegre'},
      {id:'pallet-nina',name:'Nina',at:[680,430],sprite:'assets/kanto/npcs/pallet-new/nina-cartografa.png',displayHeight:92}
    ],
    grass:[],
    portals:[
      {
        id:'centro-to-lab',
        rect:[530,0,665,38],
        target:'pallet-lab-3q',
        spawn:[565,610],
        facing:'up',
        marker:[598,48],
        label:'LABORATÓRIO ↑',
        color:'#ffd480'
      },
      {
        id:'centro-to-jardins',
        rect:[1152,375,1200,470],
        target:'pallet-jardins-3q',
        spawn:[75,225],
        facing:'right',
        marker:[1158,422],
        label:'JARDINS →',
        color:'#80ffaa'
      },
      {
        id:'centro-to-costa',
        rect:[140,635,320,675],
        target:'pallet-costa-3q',
        spawn:[595,75],
        facing:'down',
        marker:[235,628],
        label:'COSTA ↓',
        color:'#79dced'
      },
      {
        id:'centro-to-colinas',
        rect:[0,325,42,415],
        target:'pallet-colinas-3q',
        spawn:[1135,278],
        facing:'left',
        marker:[48,370],
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
    occluders:[]
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
    spawn:[75,225],
    exit:null,
    doors:[
      {id:'center',at:[272,168],title:'Posto de Cura do Bosque'}
    ],
    npcs:[
      {id:'neighbor',name:'Mina',at:[215,300],sprite:'assets/halloween/npc-mina.svg',portrait:'assets/halloween/npc-mina.svg',emote:'curiosa'},
      {id:'pallet-tomi',name:'Tomi',at:[280,370],sprite:'assets/kanto/npcs/pallet-new/tomi-botanista.png',displayHeight:86}
    ],
    grass:[],
    portals:[
      {
        id:'jardins-to-centro',
        rect:[0,175,44,285],
        target:'pallet-centro-3q',
        spawn:[1120,422],
        facing:'left',
        marker:[48,228],
        label:'← CENTRO',
        color:'#80ffaa'
      },
      {
        id:'jardins-to-costa',
        rect:[515,635,705,675],
        target:'pallet-costa-3q',
        spawn:[1120,242],
        facing:'down',
        marker:[610,628],
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
    occluders:[]
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
    spawn:[565,610],
    exit:null,
    doors:[
      {id:'lab',at:[665,338],title:'Laboratório do Prof. Carvalho'}
    ],
    npcs:[
      {id:'oak',name:'Professor Car’alho',at:[535,468],sprite:'assets/kanto/npcs/professor-v33.webp',portrait:'assets/story/professor-oak.png',emote:'sereno'},
      {id:'assistant',name:'Pesquisador Elias',at:[760,392],sprite:'assets/halloween/npc-researcher.webp',portrait:'assets/halloween/npc-researcher.webp',emote:'curioso'},
      {id:'pallet-maia',name:'Maia',at:[850,400],sprite:'assets/kanto/npcs/pallet-new/maia-socorrista.png',displayHeight:96}
    ],
    grass:[],
    portals:[
      {
        id:'lab-to-centro',
        rect:[465,635,650,675],
        target:'pallet-centro-3q',
        spawn:[598,72],
        facing:'down',
        marker:[558,628],
        label:'CENTRO ↓',
        color:'#80ffaa'
      },
      {
        id:'lab-to-rota1',
        rect:[328,128,422,198],
        target:'pallet-arredores-3q',
        spawn:[570,610],
        facing:'up',
        marker:[375,195],
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
    occluders:[]
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
    spawn:[595,75],
    exit:null,
    doors:[
      {id:'house-west',at:[195,222],title:'Cabana do Pescador'}
    ],
    npcs:[
      {id:'fisher',name:'Seu Abel',at:[735,275],sprite:'assets/kanto/npcs/pallet-new/pescador-vendedor.png',portrait:'assets/kanto/npcs/pallet-new/pescador-vendedor.png',displayHeight:95,emote:'tranquilo'},
      {id:'pallet-banhista',name:'Caio',at:[680,295],sprite:'assets/kanto/npcs/pallet-new/banhista-musculoso.png',portrait:'assets/kanto/npcs/pallet-new/banhista-musculoso.png',spriteSheet:{src:'assets/kanto/npcs/pallet-new/banhista-idle-sheet.webp',cols:6,rows:4,frames:24,fps:6},walkSheet:{src:'assets/kanto/npcs/pallet-new/banhista-walk-sheet.webp',cols:6,rows:4,frames:24,fps:8},footOffset:0.055,groundShadow:true,displayHeight:100}
    ],
    grass:[],
    portals:[
      {
        id:'costa-to-centro',
        rect:[520,0,675,40],
        target:'pallet-centro-3q',
        spawn:[248,608],
        facing:'up',
        marker:[598,48],
        label:'CENTRO ↑',
        color:'#80ffaa'
      },
      {
        id:'costa-to-jardins',
        rect:[1145,190,1200,285],
        target:'pallet-jardins-3q',
        spawn:[610,602],
        facing:'right',
        marker:[1150,242],
        label:'JARDINS →',
        color:'#80ffaa'
      },
      {
        id:'costa-to-colinas',
        rect:[205,0,315,42],
        target:'pallet-colinas-3q',
        spawn:[215,610],
        facing:'up',
        marker:[260,48],
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
    occluders:[]
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
    spawn:[1135,278],
    exit:null,
    doors:[
      {id:'market',at:[265,295],title:'Posto dos Mineradores'}
    ],
    npcs:[
      {id:'child',name:'Luna',at:[320,330],sprite:'assets/kanto/npcs/child-v9.svg',portrait:'assets/kanto/npcs/child-v9.svg',emote:'animada'},
      {id:'pallet-breno',name:'Breno',at:[350,350],sprite:'assets/kanto/npcs/pallet-new/breno-artesao.png',displayHeight:100}
    ],
    grass:[],
    portals:[
      {
        id:'colinas-to-centro',
        rect:[1148,235,1200,335],
        target:'pallet-centro-3q',
        spawn:[75,370],
        facing:'right',
        marker:[1152,285],
        label:'CENTRO →',
        color:'#80ffaa'
      },
      {
        id:'colinas-to-costa',
        rect:[105,635,285,675],
        target:'pallet-costa-3q',
        spawn:[260,68],
        facing:'down',
        marker:[195,628],
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
    occluders:[]
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
    spawn:[570,610],
    exit:[585,92],
    doors:[],
    npcs:[
      {id:'route-guide',name:'Exploradora Nara',at:[635,420],sprite:'assets/halloween/npc-luna.svg',portrait:'assets/halloween/npc-luna.svg',emote:'curiosa'}
    ],
    grass:[
      {id:'a',rect:[340,155,515,315],spawn:[425,235],entry:[490,280]},
      {id:'b',rect:[715,195,985,335],spawn:[850,265],entry:[730,265]},
      {id:'c',rect:[950,105,1140,225],spawn:[1045,165],entry:[960,165]}
    ],
    portals:[
      {
        id:'rota1-to-lab',
        rect:[450,635,705,675],
        target:'pallet-lab-3q',
        spawn:[385,225],
        facing:'down',
        marker:[578,628],
        label:'LABORATÓRIO ↓',
        color:'#ffd480'
      },
      {
        id:'rota1-to-viridian',
        rect:[520,72,650,125],
        action:'exitWorld',
        marker:[585,128],
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
    occluders:[]
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
vec4 texBicubic(sampler2D tex, vec2 uv){
  vec2 texSize = vec2(textureSize(tex, 0));
  vec2 invSize = 1.0 / texSize;
  vec2 coord = uv * texSize - 0.5;
  vec2 fxy = fract(coord);
  coord -= fxy;
  vec2 xcubic = fxy.x * (fxy.x * (fxy.x * vec2(1.5, -0.5) + vec2(-2.5, 1.0)) + vec2(0.0, 0.5));
  vec2 ycubic = fxy.y * (fxy.y * (fxy.y * vec2(1.5, -0.5) + vec2(-2.5, 1.0)) + vec2(0.0, 0.5));
  // 4-bilinear-tap Catmull-Rom approximation
  vec2 f2 = fxy * fxy;
  vec2 f3 = f2 * fxy;
  vec2 w0 = -0.5 * f3 + f2 - 0.5 * fxy;
  vec2 w1 = 1.5 * f3 - 2.5 * f2 + 1.0;
  vec2 w2 = -1.5 * f3 + 2.0 * f2 + 0.5 * fxy;
  vec2 w3 = 0.5 * f3 - 0.5 * f2;
  vec2 s0 = w0 + w1;
  vec2 s1 = w2 + w3;
  vec2 offset0 = (coord - 0.5 + w1 / max(s0, 1e-5)) * invSize;
  vec2 offset1 = (coord + 1.5 + w3 / max(s1, 1e-5)) * invSize;
  vec4 c00 = texture(tex, vec2(offset0.x, offset0.y));
  vec4 c10 = texture(tex, vec2(offset1.x, offset0.y));
  vec4 c01 = texture(tex, vec2(offset0.x, offset1.y));
  vec4 c11 = texture(tex, vec2(offset1.x, offset1.y));
  vec4 row0 = mix(c10, c00, s0.x);
  vec4 row1 = mix(c11, c01, s0.x);
  return mix(row1, row0, s0.y);
}
void main(){
  vec2 inv = 1.0 / vec2(textureSize(u_tex, 0));
  vec4 base = texBicubic(u_tex, v_uv);
  vec4 blur = (
    texture(u_tex, v_uv + vec2(inv.x, 0.0)) +
    texture(u_tex, v_uv - vec2(inv.x, 0.0)) +
    texture(u_tex, v_uv + vec2(0.0, inv.y)) +
    texture(u_tex, v_uv - vec2(0.0, inv.y))
  ) * 0.25;
  outColor = clamp(base + (base - blur) * 0.22, 0.0, 1.0);
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


// ---- Editor Profissional de Colisoes V1 (somente ?visual=anime3q&debug=editor) ----
// Painel movel, navegacao/zoom de camera, Pincel/Borracha em tempo real,
// validacao matematica na exportacao/importacao e rascunhos locais em IndexedDB.
const brushEditors=new Map();   // mapId -> editor
const brushPreviews=new Map();  // mapId -> canvas de preview
const brushLoading=new Set();
const brushDrafts=new Map();    // mapId -> ultimo rascunho conhecido {art, updatedAt, walk}
let brushMode='off';            // 'off' | 'pan' | 'paint' | 'erase'
let brushActiveMap=null, brushPanel=null, brushRadius=6, brushStatusMsg='';
let panDrag=null, draftTimer=0, discardConfirmUntil=0;

function brushPreviewFor(mapId){
  if(!debugEditorEnabled)return null;
  return brushPreviews.get(mapId)||null;
}
function ensureBrushLib(){
  if(W.PsyAnime3QBrush)return Promise.resolve(W.PsyAnime3QBrush);
  return new Promise((res,rej)=>{
    const sc=D.createElement('script');
    sc.src='core/anime3q-walkmask-brush.js?v=2';
    sc.onload=()=>res(W.PsyAnime3QBrush);
    sc.onerror=()=>rej(new Error('core/anime3q-walkmask-brush.js nao carregou'));
    D.head.appendChild(sc);
  });
}
function setStatus(msg){brushStatusMsg=msg||'';updateBrushPanel();}
async function checkDraftFor(mapId){
  try{
    const B=await ensureBrushLib();
    const rec=await B.drafts.load(mapId);
    const m=MAPS[mapId];
    if(rec&&m&&rec.art===m.art&&rec.w===LOGICAL_W&&rec.h===LOGICAL_H&&rec.walk?.length===LOGICAL_W*LOGICAL_H){
      brushDrafts.set(mapId,rec);
      const t=new Date(rec.updatedAt||Date.now()).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
      setStatus(`Rascunho disponivel (${t}) — Restaurar ou Descartar`);
    }else{
      brushDrafts.delete(mapId);
      updateBrushPanel();
    }
  }catch(_){}
}
function scheduleDraftSave(mapId,immediate){
  if(draftTimer){clearTimeout(draftTimer);draftTimer=0;}
  const run=async()=>{
    draftTimer=0;
    const ed=brushEditors.get(mapId),m=MAPS[mapId];
    if(!ed||!m||!W.PsyAnime3QBrush?.drafts)return;
    try{
      const rec=await W.PsyAnime3QBrush.drafts.save(mapId,m.art,ed.walkCopy());
      brushDrafts.set(mapId,rec);
      if(immediate)setStatus(`Rascunho salvo (${mapId})`);
      else updateBrushPanel();
    }catch(err){
      setStatus(`Erro ao salvar rascunho: ${err?.message||'armazenamento indisponivel'}`);
    }
  };
  if(immediate)run();else draftTimer=setTimeout(run,800);
}
function openBrushEditor(mapId){
  const m=MAPS[mapId];
  if(!m?.walkmask||!m?.sdf||brushLoading.has(mapId)||brushEditors.has(mapId))return;
  brushLoading.add(mapId);
  ensureBrushLib().then(B=>B.loadWalkFromUrl(m.walkmask).then(walk=>{
    const cv=D.createElement('canvas');cv.width=LOGICAL_W;cv.height=LOGICAL_H;
    const cx=cv.getContext('2d');
    brushPreviews.set(mapId,cv);
    const ed=B.createEditor({
      mapId,walk,
      onSdf:u8=>{
        const e=getSdfEntry(m.sdf);
        if(e){e.buf=u8;e.debugCanvas=null;}
        W.PsyKantoWorldV2?.clearNavCache?.();
      },
      onPreview:rgba=>{
        const img=cx.createImageData(LOGICAL_W,LOGICAL_H);
        img.data.set(rgba);
        cx.putImageData(img,0,0);
      },
      onChange:()=>scheduleDraftSave(mapId,false)
    });
    ed.setTool(brushMode==='erase'?'erase':'paint');
    ed.setRadius(brushRadius);
    brushEditors.set(mapId,ed);
    brushLoading.delete(mapId);
    ed.refresh();
    updateBrushPanel();
    checkDraftFor(mapId);
  })).catch(err=>{console.warn('Anime3Q editor:',err);brushLoading.delete(mapId);});
}
function syncActiveMap(mapId){
  if(!debugEditorEnabled||!MAPS[mapId])return;
  if(brushActiveMap!==mapId){
    brushActiveMap=mapId;
    discardConfirmUntil=0;
    brushStatusMsg='';
    if(!brushEditors.has(mapId))openBrushEditor(mapId);
    else updateBrushPanel();
  }else if(!brushEditors.has(mapId)&&!brushLoading.has(mapId)){
    openBrushEditor(mapId);
  }
}
// Chamado por kanto-world-v2.js em touchStart/touchMove/touchEnd/touchCancel.
// Retorna true quando o ponteiro pertence ao editor (o jogador nao deve andar).
function brushPointer(kind,pid,pt,mapId,clientX,clientY){
  if(!debugEditorEnabled||brushMode==='off'||!MAPS[mapId])return false;
  brushActiveMap=mapId;
  if(brushMode==='pan'){
    if(kind==='down'){
      const cam=W.PsyKantoWorldV2?.getEditorCamera?.();
      if(!cam)return true;
      W.PsyKantoWorldV2?.setEditorCamera?.({active:true});
      panDrag={pid,sx:clientX||0,sy:clientY||0,cx:cam.x,cy:cam.y};
    }else if(kind==='move'&&panDrag&&panDrag.pid===pid){
      const cam=W.PsyKantoWorldV2?.getEditorCamera?.();
      if(!cam)return true;
      const k=cam.dpr/(cam.scale||1);
      W.PsyKantoWorldV2?.setEditorCamera?.({active:true,x:panDrag.cx-((clientX||0)-panDrag.sx)*k,y:panDrag.cy-((clientY||0)-panDrag.sy)*k});
    }else if(kind==='up'&&panDrag&&panDrag.pid===pid){
      panDrag=null;
    }
    return true;
  }
  const ed=brushEditors.get(mapId);
  if(!ed){openBrushEditor(mapId);return true;}
  if(kind==='down')ed.begin(pid,pt.x,pt.y);
  else if(kind==='move')ed.move(pid,pt.x,pt.y);
  else if(kind==='up'){ed.end(pid);updateBrushPanel();}
  return true;
}
function brushWheel(e){
  if(!debugEditorEnabled)return false;
  const cam=W.PsyKantoWorldV2?.getEditorCamera?.();
  if(!cam)return false;
  const factor=e.deltaY<0?1.15:0.87;
  W.PsyKantoWorldV2?.setEditorCamera?.({active:true,zoom:cam.zoom*factor});
  updateBrushPanel();
  return true;
}
function downloadGray(u8,name){
  return new Promise(resolve=>{
    const cv=D.createElement('canvas');cv.width=LOGICAL_W;cv.height=LOGICAL_H;
    const cx=cv.getContext('2d');const img=cx.createImageData(LOGICAL_W,LOGICAL_H);
    for(let i=0,p=0;i<u8.length;i++,p+=4){img.data[p]=img.data[p+1]=img.data[p+2]=u8[i];img.data[p+3]=255;}
    cx.putImageData(img,0,0);
    cv.toBlob(b=>{
      const a=D.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();
      setTimeout(()=>{URL.revokeObjectURL(a.href);resolve();},200);
    },'image/png');
  });
}
function encodeGrayPngBase64(u8){
  const cv=D.createElement('canvas');cv.width=LOGICAL_W;cv.height=LOGICAL_H;
  const cx=cv.getContext('2d');const img=cx.createImageData(LOGICAL_W,LOGICAL_H);
  for(let i=0,p=0;i<u8.length;i++,p+=4){img.data[p]=img.data[p+1]=img.data[p+2]=u8[i];img.data[p+3]=255;}
  cx.putImageData(img,0,0);
  return cv.toDataURL('image/png').split(',')[1]||'';
}
async function exportBrush(){
  const ed=brushEditors.get(brushActiveMap),B=W.PsyAnime3QBrush;
  if(!ed||!B)return;
  const walk=ed.walkCopy(),sdf=ed.sdfU8();
  const v=B.verifyPair(walk,sdf);
  if(!v.ok){setStatus(`Erro na validacao: ${v.diff} px divergentes`);return;}
  await downloadGray(ed.walkL(),`${brushActiveMap}_walkmask.png`);
  await new Promise(r=>setTimeout(r,150));
  await downloadGray(sdf,`${brushActiveMap}_sdf.png`);
  setStatus(`Exportado OK: ${brushActiveMap} (1200x675, 0 diverg.)`);
}
async function exportAllBrush(){
  const B=W.PsyAnime3QBrush;
  if(!B)return;
  const targets=[];
  for(const mapId of Object.keys(MAPS)){
    const ed=brushEditors.get(mapId);
    const rec=brushDrafts.get(mapId);
    if(ed&&(mapId===brushActiveMap||rec)){
      targets.push({mapId,walk:ed.walkCopy(),walkL:ed.walkL(),sdf:ed.sdfU8()});
    }else if(rec?.walk){
      const tmp=B.create(LOGICAL_W,LOGICAL_H,rec.walk);
      targets.push({mapId,walk:tmp.walkCopy(),walkL:tmp.walkL(),sdf:tmp.sdfU8()});
    }
  }
  if(!targets.length){setStatus('Edite ou abra um mapa antes de exportar tudo');return;}
  for(const t of targets){
    const v=B.verifyPair(t.walk,t.sdf);
    if(!v.ok){setStatus(`Erro em ${t.mapId}: ${v.diff} px divergentes`);return;}
  }
  setStatus(`Exportando ${targets.length} mapa(s)...`);
  for(let i=0;i<targets.length;i++){
    const t=targets[i];
    await downloadGray(t.walkL,`${t.mapId}_walkmask.png`);
    await new Promise(r=>setTimeout(r,220));
    await downloadGray(t.sdf,`${t.mapId}_sdf.png`);
    if(i<targets.length-1)await new Promise(r=>setTimeout(r,220));
  }
  setStatus(`Exportar Tudo OK: ${targets.length} mapa(s) (${targets.length*2} arquivos)`);
}
async function publishBrush(){
  const B=W.PsyAnime3QBrush;
  if(!B)return;
  const targets=[];
  for(const mapId of Object.keys(MAPS)){
    const ed=brushEditors.get(mapId);
    const rec=brushDrafts.get(mapId);
    if(ed&&(mapId===brushActiveMap||rec)){
      targets.push({mapId,walk:ed.walkCopy(),walkL:ed.walkL(),sdf:ed.sdfU8()});
    }else if(rec?.walk){
      const tmp=B.create(LOGICAL_W,LOGICAL_H,rec.walk);
      targets.push({mapId,walk:tmp.walkCopy(),walkL:tmp.walkL(),sdf:tmp.sdfU8()});
    }
  }
  if(!targets.length){setStatus('Edite ou abra um mapa antes de publicar');return;}
  for(const t of targets){
    const v=B.verifyPair(t.walk,t.sdf);
    if(!v.ok){setStatus(`Erro em ${t.mapId}: ${v.diff} px divergentes`);return;}
  }
  let pin='';
  try{pin=W.sessionStorage?.getItem('a3q-editor-pin')||'';}catch(_){}
  if(!pin){
    pin=W.prompt(`Publicar ${targets.length} mapa(s) na branch.\nDigite o PIN do editor:`)||'';
    pin=pin.trim();
    if(!pin){setStatus('Publicacao cancelada');return;}
  }
  setStatus(`Publicando ${targets.length} mapa(s) na branch...`);
  try{
    const files=targets.map(t=>({
      mapId:t.mapId,
      walkmaskBase64:encodeGrayPngBase64(t.walkL),
      sdfBase64:encodeGrayPngBase64(t.sdf),
    }));
    const res=await fetch('/api/config?psy=collision-publish',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({pin,files}),
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok||!data?.ok){
      if(res.status===401){try{W.sessionStorage?.removeItem('a3q-editor-pin');}catch(_){}}
      setStatus(`Falha ao publicar: ${data?.error||res.status}`);
      return;
    }
    try{W.sessionStorage?.setItem('a3q-editor-pin',pin);}catch(_){}
    const shortSha=String(data.commit||'').slice(0,7);
    setStatus(`Publicado (${shortSha}) em ${data.branch}! Preview atualiza em ~1 min.`);
  }catch(err){
    setStatus(`Erro de rede ao publicar: ${err?.message||'falha'}`);
  }
}
function readPngGray(file){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file);
    const im=new Image();
    im.onload=()=>{
      URL.revokeObjectURL(url);
      if(im.naturalWidth!==LOGICAL_W||im.naturalHeight!==LOGICAL_H){
        return reject(new Error(`${file.name}: tamanho ${im.naturalWidth}x${im.naturalHeight}, esperado ${LOGICAL_W}x${LOGICAL_H}`));
      }
      const cv=D.createElement('canvas');cv.width=LOGICAL_W;cv.height=LOGICAL_H;
      const cx=cv.getContext('2d',{willReadFrequently:true});
      cx.drawImage(im,0,0,LOGICAL_W,LOGICAL_H);
      const raw=cx.getImageData(0,0,LOGICAL_W,LOGICAL_H).data;
      const u8=new Uint8Array(LOGICAL_W*LOGICAL_H);
      for(let i=0,p=0;i<u8.length;i++,p+=4)u8[i]=raw[p];
      resolve({name:file.name,u8});
    };
    im.onerror=()=>{URL.revokeObjectURL(url);reject(new Error(`Nao foi possivel ler ${file.name}`));};
    im.src=url;
  });
}
async function importBrushFiles(fileList){
  const ed=brushEditors.get(brushActiveMap),B=W.PsyAnime3QBrush;
  if(!ed||!B){setStatus('Abra um mapa Anime3Q antes de importar');return;}
  const files=[...(fileList||[])].filter(Boolean);
  if(!files.length)return;
  if(files.length>2){setStatus('Selecione 1 walkmask ou par walkmask + sdf');return;}
  try{
    for(const f of files){
      const known=Object.keys(MAPS).find(id=>f.name.startsWith(id+'_'));
      if(known&&known!==brushActiveMap){
        setStatus(`Arquivo de "${known}" nao corresponde a "${brushActiveMap}"`);return;
      }
    }
    const imgs=await Promise.all(files.map(readPngGray));
    let wImg=imgs.find(x=>/walkmask/i.test(x.name));
    let sImg=imgs.find(x=>/sdf/i.test(x.name));
    if(!wImg&&imgs.length===1)wImg=imgs[0];
    if(!wImg&&imgs.length===2){
      const isBin=u=>{for(let i=0;i<u.length;i++)if(u[i]!==0&&u[i]!==255)return false;return true;};
      wImg=imgs.find(x=>isBin(x.u8))||imgs[0];
      sImg=imgs.find(x=>x!==wImg);
    }
    if(!wImg){setStatus('Walkmask nao identificada');return;}
    for(let i=0;i<wImg.u8.length;i++){
      if(wImg.u8[i]!==0&&wImg.u8[i]!==255){
        setStatus(`Walkmask invalida (${wImg.name}): use apenas 0 e 255`);return;
      }
    }
    const walk=B.walkFromL(wImg.u8);
    if(sImg){
      const v=B.verifyPair(walk,sImg.u8);
      if(!v.ok){setStatus(`Par incompativel: ${v.diff} px divergem entre walkmask e SDF`);return;}
    }
    ed.replaceWalk(walk,true);
    setStatus(`Importado OK: ${brushActiveMap}`);
  }catch(err){
    setStatus(`Importacao falhou: ${err?.message||'arquivo invalido'}`);
  }
}
function mountBrushPanel(){
  if(!debugEditorEnabled||brushPanel)return;
  brushPanel=D.createElement('div');
  brushPanel.id='a3q-brush-panel';
  brushPanel.style.cssText='position:fixed;left:8px;bottom:8px;z-index:2147483647;background:#0b1d3a;border:2px solid #facc15;border-radius:10px;padding:5px 7px;font:12px system-ui,sans-serif;color:#f8fafc;display:flex;flex-wrap:wrap;gap:4px;align-items:center;max-width:min(94vw,470px);box-sizing:border-box;box-shadow:0 6px 20px rgba(0,0,0,.45);';
  brushPanel.innerHTML=
    '<span data-a="grip" title="Arrastar painel" style="cursor:move;padding:2px 7px;user-select:none;touch-action:none;font-size:15px;">&#10303;</span>'+
    '<button data-a="toggle" title="Minimizar/expandir" style="min-width:28px">&#8211;</button>'+
    '<span data-a="mini" style="font-size:11px;opacity:.9">Editor</span>'+
    '<div data-a="body" style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;width:100%;">'+
      '<button data-a="pan">Navegar</button>'+
      '<button data-a="paint">Pincel</button>'+
      '<button data-a="erase">Borracha</button>'+
      '<button data-a="undo">Desfazer</button>'+
      '<button data-a="sdf">SDF</button>'+
      '<label style="display:inline-flex;align-items:center;gap:3px;">raio <input data-a="radius" type="range" min="2" max="40" value="6" style="width:68px"></label>'+
      '<button data-a="zout" title="Afastar zoom">-</button>'+
      '<button data-a="zin" title="Aproximar zoom">+</button>'+
      '<button data-a="zreset" title="Centralizar no treinador">Centro</button>'+
      '<button data-a="import">Importar</button>'+
      '<button data-a="export">Exportar</button>'+
      '<button data-a="exportAll" title="Baixar walkmask e SDF de todos os mapas editados">Exportar Tudo</button>'+
      '<button data-a="publish" title="Publicar rascunhos na branch">Publicar</button>'+
      '<button data-a="save">Salvar</button>'+
      '<button data-a="restore">Restaurar</button>'+
      '<button data-a="discard">Descartar</button>'+
      '<input data-a="file" type="file" accept="image/png" multiple hidden>'+
      '<span data-a="status" style="opacity:.88;flex-basis:100%;font-size:11px;line-height:1.25;"></span>'+
    '</div>';
  brushPanel.querySelectorAll('button').forEach(b=>{
    b.style.cssText='padding:5px 7px;border-radius:6px;border:1px solid #38bdf8;background:#13294b;color:#f8fafc;touch-action:manipulation;font-size:11px;cursor:pointer;';
  });
  ['pointerdown','pointermove','pointerup','touchstart','wheel'].forEach(ev=>{
    brushPanel.addEventListener(ev,e=>e.stopPropagation(),{passive:true});
  });

  const KEY='a3q-brush-panel-state';
  const saved=(()=>{try{return JSON.parse(W.localStorage.getItem(KEY)||'null');}catch(_){return null;}})();
  const savePos=()=>{try{
    const r=brushPanel.getBoundingClientRect();
    W.localStorage.setItem(KEY,JSON.stringify({x:Math.round(r.left),y:Math.round(r.top),collapsed:!!brushCollapsed}));
  }catch(_){}};
  let brushCollapsed=!!saved?.collapsed;
  function placeInside(x,y){
    const w=brushPanel.offsetWidth||200,h=brushPanel.offsetHeight||40;
    const cx=Math.max(0,Math.min(W.innerWidth-w,x));
    const cy=Math.max(0,Math.min(W.innerHeight-h,y));
    brushPanel.style.left=cx+'px';brushPanel.style.top=cy+'px';brushPanel.style.bottom='auto';
  }
  function applyCollapsed(){
    brushPanel.querySelector('[data-a="body"]').style.display=brushCollapsed?'none':'flex';
    brushPanel.querySelector('[data-a="toggle"]').innerHTML=brushCollapsed?'&#43;':'&#8211;';
    brushPanel.style.width=brushCollapsed?'auto':'';
  }
  if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y))placeInside(saved.x,saved.y);
  applyCollapsed();

  const grip=brushPanel.querySelector('[data-a="grip"]');
  let drag=null;
  grip.addEventListener('pointerdown',e=>{
    e.preventDefault();
    const r=brushPanel.getBoundingClientRect();
    drag={dx:e.clientX-r.left,dy:e.clientY-r.top,id:e.pointerId};
    grip.setPointerCapture?.(e.pointerId);
  });
  grip.addEventListener('pointermove',e=>{
    if(!drag||drag.id!==e.pointerId)return;
    placeInside(e.clientX-drag.dx,e.clientY-drag.dy);
  });
  const endDrag=e=>{if(drag&&drag.id===e.pointerId){drag=null;savePos();}};
  grip.addEventListener('pointerup',endDrag);
  grip.addEventListener('pointercancel',endDrag);
  W.addEventListener('resize',()=>{
    if(!brushPanel)return;
    const r=brushPanel.getBoundingClientRect();
    placeInside(r.left,r.top);
  });

  const act=a=>brushPanel.querySelector(`[data-a="${a}"]`);
  const setMode=m=>{
    brushMode=brushMode===m?'off':m;
    if(brushMode==='paint'||brushMode==='erase')brushEditors.get(brushActiveMap)?.setTool(brushMode);
    if(brushMode==='pan')W.PsyKantoWorldV2?.setEditorCamera?.({active:true});
    updateBrushPanel();
  };
  act('toggle').onclick=()=>{brushCollapsed=!brushCollapsed;applyCollapsed();savePos();};
  act('pan').onclick=()=>setMode('pan');
  act('paint').onclick=()=>setMode('paint');
  act('erase').onclick=()=>setMode('erase');
  act('undo').onclick=()=>{brushEditors.get(brushActiveMap)?.undo();updateBrushPanel();};
  act('sdf').onclick=()=>{debugOverlayVisible=!debugOverlayVisible;updateBrushPanel();};
  act('zin').onclick=()=>{const c=W.PsyKantoWorldV2?.getEditorCamera?.();if(c){W.PsyKantoWorldV2.setEditorCamera({active:true,zoom:c.zoom*1.25});updateBrushPanel();}};
  act('zout').onclick=()=>{const c=W.PsyKantoWorldV2?.getEditorCamera?.();if(c){W.PsyKantoWorldV2.setEditorCamera({active:true,zoom:c.zoom*0.8});updateBrushPanel();}};
  act('zreset').onclick=()=>{W.PsyKantoWorldV2?.setEditorCamera?.({reset:true});if(brushMode==='pan')brushMode='off';updateBrushPanel();};
  act('import').onclick=()=>{const f=act('file');f.value='';f.click();};
  act('file').onchange=e=>importBrushFiles(e.target.files);
  act('export').onclick=exportBrush;
  act('exportAll').onclick=exportAllBrush;
  act('publish').onclick=publishBrush;
  act('save').onclick=()=>{if(brushActiveMap)scheduleDraftSave(brushActiveMap,true);};
  act('restore').onclick=()=>{
    const ed=brushEditors.get(brushActiveMap),rec=brushDrafts.get(brushActiveMap);
    if(!ed||!rec)return;
    ed.replaceWalk(rec.walk,true);
    setStatus(`Rascunho restaurado (${brushActiveMap})`);
  };
  act('discard').onclick=async()=>{
    if(!brushActiveMap||!brushDrafts.has(brushActiveMap))return;
    const now=Date.now();
    if(now>discardConfirmUntil){
      discardConfirmUntil=now+4000;
      updateBrushPanel();
      setTimeout(()=>{if(Date.now()>=discardConfirmUntil)updateBrushPanel();},4100);
      return;
    }
    discardConfirmUntil=0;
    try{
      await W.PsyAnime3QBrush?.drafts?.remove(brushActiveMap);
      brushDrafts.delete(brushActiveMap);
      setStatus(`Rascunho descartado (${brushActiveMap})`);
    }catch(err){setStatus(`Erro ao descartar: ${err?.message||'falha'}`);}
  };
  act('radius').oninput=e=>{brushRadius=+e.target.value;brushEditors.get(brushActiveMap)?.setRadius(brushRadius);};
  (D.getElementById('psy-kanto-world-v2')||D.body).appendChild(brushPanel);
  updateBrushPanel();
}
function updateBrushPanel(){
  if(!brushPanel)return;
  const host=D.getElementById('psy-kanto-world-v2');
  if(host&&brushPanel.parentNode!==host)host.appendChild(brushPanel);
  const ed=brushEditors.get(brushActiveMap);
  const hasDraft=brushDrafts.has(brushActiveMap);
  const st=brushPanel.querySelector('[data-a="status"]');
  const mini=brushPanel.querySelector('[data-a="mini"]');
  const on=(a,v)=>{const b=brushPanel.querySelector(`[data-a="${a}"]`);if(b){b.style.background=v?'#facc15':'#13294b';b.style.color=v?'#0b1d3a':'#f8fafc';}};
  on('pan',brushMode==='pan');
  on('paint',brushMode==='paint');
  on('erase',brushMode==='erase');
  on('sdf',debugOverlayVisible);
  brushPanel.querySelector('[data-a="export"]').disabled=!ed;
  brushPanel.querySelector('[data-a="exportAll"]').disabled=!ed&&!brushDrafts.size;
  brushPanel.querySelector('[data-a="publish"]').disabled=!ed&&!brushDrafts.size;
  brushPanel.querySelector('[data-a="import"]').disabled=!ed;
  brushPanel.querySelector('[data-a="save"]').disabled=!ed;
  brushPanel.querySelector('[data-a="undo"]').disabled=!ed?.canUndo();
  brushPanel.querySelector('[data-a="restore"]').disabled=!ed||!hasDraft;
  brushPanel.querySelector('[data-a="discard"]').disabled=!hasDraft;
  const discBtn=brushPanel.querySelector('[data-a="discard"]');
  discBtn.textContent=Date.now()<=discardConfirmUntil?'Confirmar?':'Descartar';
  const cam=W.PsyKantoWorldV2?.getEditorCamera?.();
  const zTxt=cam?.active?` | zoom ${cam.zoom.toFixed(1)}x`:'';
  mini.textContent=ed?`${brushActiveMap} (${brushMode})`:'Editor';
  st.textContent=brushStatusMsg||(ed?`${brushActiveMap} | ${brushMode==='off'?'andando':brushMode}${zTxt} | SDF=11 ciano`:'Entre em um mapa Anime3Q para editar');
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
  if(debugEditorEnabled&&brushPanel&&brushPanel.parentNode===D.body){const h=D.getElementById('psy-kanto-world-v2');if(h)h.appendChild(brushPanel);}
  c.save();
  const dbg=brushPreviewFor(mapId)||getSdfDebugCanvas(mapId);
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

if(debugEditorEnabled){D.readyState==='loading'?D.addEventListener('DOMContentLoaded',mountBrushPanel):mountBrushPanel();}
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
  isEditorDebug:()=>debugEditorEnabled,
  syncActiveMap,
  brushPointer,
  brushWheel,
  brushActive:()=>debugEditorEnabled&&brushMode!=='off',
  exportGeometryJSON,
  hide,
  characterScale:0.88,
  followerScale:0.68
};
})(window,document);
