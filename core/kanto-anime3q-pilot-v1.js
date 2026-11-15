/* PSYWORLD — Anime 3/4 HD Playable Pilot V4 (Centro <-> Jardins)
 * Structural reconstruction of collisions (16-angle foot perimeter + full PLAYER_RADIUS=11),
 * true RGBA foreground silhouette occluder sprites (zero opaque rectangular background cutouts),
 * connectivity analyzer, and dev visual collision editor (?visual=anime3q&debug=editor).
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
    title:'Pallet Town · Centro e Praça',
    subtitle:'Protótipo Anime 3/4 HD · Leste → Jardins',
    w:LOGICAL_W,h:LOGICAL_H,
    art:'assets/story/pallet/anime3q/01_centro_residencias.png',
    spawn:[600,430],
    exit:[1180,200],
    doors:[
      {id:'home',at:[350,222],title:'Casa de Red'},
      {id:'house-east',at:[975,220],title:'Casa Leste'}
    ],
    npcs:[],
    grass:[],
    portals:[
      {
        id:'to-jardins',
        rect:[1155,130,1200,240],
        target:'pallet-jardins-3q',
        spawn:[98,225],
        facing:'right',
        marker:[1165,195],
        label:'JARDINS →',
        color:'#80ffaa'
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
    title:'Pallet Town · Jardins e Bosque',
    subtitle:'Protótipo Anime 3/4 HD · Oeste ← Centro',
    w:LOGICAL_W,h:LOGICAL_H,
    art:'assets/story/pallet/anime3q/02_jardins_bosque.png',
    spawn:[98,225],
    exit:[20,225],
    doors:[
      {id:'garden-cottage',at:[265,132],title:'Cabana do Bosque'}
    ],
    npcs:[],
    grass:[],
    portals:[
      {
        id:'to-centro',
        rect:[0,135,45,290],
        target:'pallet-centro-3q',
        spawn:[1120,195],
        facing:'left',
        marker:[38,220],
        label:'← CENTRO',
        color:'#80ffaa'
      }
    ],
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

function isPilotMap(id){
  return !!MAPS[id];
}

function getMap(id){
  return MAPS[id]||null;
}

// Structural 16-angle foot-perimeter collision check using full physical foot radius (no silent shrinking)
function walkable(id,x,y,r=11){
  const m=MAPS[id];
  if(!m)return false;
  const foot=Math.max(0,Number(r)||11);
  if(x<foot||y<foot||x>m.w-foot||y>m.h-foot)return false;
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

function checkPortal(id,x,y){
  const m=MAPS[id];
  if(!m)return null;
  for(const p of m.portals){
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

// Dedicated WebGL2 renderer for 1672x941 pilot maps
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
function drawDebugOverlay(c,mapId){
  const m=MAPS[mapId];if(!m)return;
  c.save();
  // Grid 50px
  c.lineWidth=0.6;c.strokeStyle='rgba(255,255,255,0.22)';
  for(let x=0;x<=m.w;x+=50){c.beginPath();c.moveTo(x,0);c.lineTo(x,m.h);c.stroke();}
  for(let y=0;y<=m.h;y+=50){c.beginPath();c.moveTo(0,y);c.lineTo(m.w,y);c.stroke();}
  // Walkable polygons (green)
  c.fillStyle='rgba(34,197,94,0.18)';c.strokeStyle='#22c55e';c.lineWidth=1.5;
  for(const poly of m.walkPolys){
    c.beginPath();poly.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.fill();c.stroke();
  }
  // Solid blockPolys & blocks (red)
  c.fillStyle='rgba(239,68,68,0.28)';c.strokeStyle='#ef4444';
  for(const poly of (m.blockPolys||[])){
    c.beginPath();poly.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.fill();c.stroke();
  }
  for(const [x1,y1,x2,y2] of (m.blocks||[])){
    c.fillRect(x1,y1,x2-x1,y2-y1);c.strokeRect(x1,y1,x2-x1,y2-y1);
  }
  for(const e of (m.ellipses||[])){
    c.beginPath();c.ellipse(e.cx,e.cy,e.rx,e.ry,0,0,Math.PI*2);c.fill();c.stroke();
  }
  for(const ci of (m.circles||[])){
    c.beginPath();c.arc(ci.cx,ci.cy,ci.r,0,Math.PI*2);c.fill();c.stroke();
  }
  // Occluder bounds (cyan dashed)
  c.strokeStyle='#38bdf8';c.setLineDash([4,3]);
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
  return JSON.stringify({version:'PALLET_ANIME3Q_V4_20261115',logicalSize:[LOGICAL_W,LOGICAL_H],maps:MAPS},null,2);
}

function hide(){
  if(glCanvas&&glVisible){glCanvas.style.display='none';glVisible=false;}
}

W.PsyKantoAnime3Q={
  isEnabled:()=>enabled,
  setEnabled:v=>{enabled=!!v;},
  isPilotMap,
  getMap,
  walkable,
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
