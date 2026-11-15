/* PSYWORLD — Anime 3/4 HD Playable Pilot (Centro <-> Jardins)
 * Isolated prototype activated via ?visual=anime3q or opening pallet-centro-3q / pallet-jardins-3q.
 * Preserves full 1672x941 artwork resolution via WebGL2, separates render texels from
 * 1200x675 logical collision coordinates, adapts 3/4 character scale, depth occlusion,
 * crisp pixel-art follower Pokemon, and bidirectional area transitions.
 */
(function(W,D){
'use strict';
if(W.PsyKantoAnime3Q)return;

const params=new URLSearchParams(W.location?.search||'');
let enabled=params.get('visual')==='anime3q';
const LOGICAL_W=1200,LOGICAL_H=675;

function rectsOverlap(x,y,r,rect){
  return x+r>rect[0]&&x-r<rect[2]&&y+r>rect[1]&&y-r<rect[3];
}
function inRect(x,y,r,rect){
  return x-r>=rect[0]&&x+r<=rect[2]&&y-r>=rect[1]&&y+r<=rect[3];
}
function inEllipse(x,y,r,cx,cy,rx,ry){
  const dx=(x-cx)/(rx+r),dy=(y-cy)/(ry+r);
  return dx*dx+dy*dy<=1;
}

// Pixel-accurate walkable & solid geometry mapped on 1200x675 grid over 1672x941 artworks
const MAPS={
  'pallet-centro-3q':{
    id:'pallet-centro-3q',
    title:'Pallet Town · Centro e Praça',
    subtitle:'Protótipo Anime 3/4 HD · Leste → Jardins',
    w:LOGICAL_W,h:LOGICAL_H,
    art:'assets/story/pallet/anime3q/01_centro_residencias.png',
    spawn:[600,430],
    exit:[1180,210],
    doors:[
      {id:'home',at:[340,210],title:'Casa de Red'},
      {id:'house-east',at:[960,185],title:'Casa Leste'}
    ],
    npcs:[],
    grass:[],
    portals:[
      {
        id:'to-jardins',
        rect:[1155,135,1200,285],
        target:'pallet-jardins-3q',
        spawn:[82,235],
        facing:'right',
        marker:[1165,205],
        label:'JARDINS →',
        color:'#80ffaa'
      }
    ],
    // Wide walkable zones (union of rectangles)
    walkZones:[
      [110,225,1045,495],   // Central plaza & main east-west avenue
      [540,12,665,245],     // North stone staircase
      [535,490,740,665],    // South stone staircase
      [15,175,160,395],     // West avenue
      [890,145,1200,275],   // East avenue to Jardins
      [740,390,910,480]     // East plaza bench terrace
    ],
    // Solid obstacles inside walkZones
    blocks:[
      // Northwest house & fenced flowerbed
      [125,0,465,245],
      // Northeast cherry tree, fence & bench
      [705,0,1040,215],
      [760,200,840,238],    // North-east bench
      [272,218,358,255],    // North-west bench
      // Fountain & flowerbed island in center plaza
      [448,232,742,392],
      // Lamp posts
      [430,305,462,372],
      [832,455,868,530],
      // Southwest corner house/foliage
      [0,395,535,675],
      // Southeast cliff & house
      [740,480,1200,675],
      [910,285,1200,480]
    ],
    ellipses:[
      {cx:596,cy:312,rx:148,ry:82}
    ],
    // Depth-sorted foreground occluders (drawn AFTER player when player.y < baselineY)
    occluders:[
      {rect:[520,218,672,300],baselineY:300}, // Fountain upper spire & water rim
      {rect:[432,258,462,356],baselineY:356}, // West plaza lamp post
      {rect:[832,392,868,505],baselineY:505}, // Southeast lamp post
      {rect:[510,565,550,675],baselineY:660}, // South stair left pillar
      {rect:[720,565,775,675],baselineY:660}  // South stair right pillar
    ]
  },
  'pallet-jardins-3q':{
    id:'pallet-jardins-3q',
    title:'Pallet Town · Jardins e Bosque',
    subtitle:'Protótipo Anime 3/4 HD · Oeste ← Centro',
    w:LOGICAL_W,h:LOGICAL_H,
    art:'assets/story/pallet/anime3q/02_jardins_bosque.png',
    spawn:[72,235],
    exit:[20,235],
    doors:[
      {id:'garden-cottage',at:[250,145],title:'Cabana do Bosque'}
    ],
    npcs:[],
    grass:[],
    portals:[
      {
        id:'to-centro',
        rect:[0,130,45,350],
        target:'pallet-centro-3q',
        spawn:[1130,210],
        facing:'left',
        marker:[38,235],
        label:'← CENTRO',
        color:'#80ffaa'
      }
    ],
    walkZones:[
      [0,130,385,375],      // West cobblestone entrance & around flower island
      [185,155,585,235],    // Upper path north of flower island
      [195,345,585,430],    // Lower path south of flower island
      [475,155,610,490],    // North-south central dirt avenue
      [585,220,810,295],    // Stone arch bridge across stream
      [785,155,1135,310],   // East grassy clearing & path to Great Tree
      [1080,25,1180,215],   // Northeast woodland trail
      [810,280,1040,495],   // East garden path south of bridge
      [475,470,715,665]     // South stone staircase down to beach edge
    ],
    blocks:[
      // Top-left cottage & terrace
      [0,0,340,148],
      // Central raised flowerbed island
      [205,220,485,358],
      // Upper wisteria pergola & bench
      [410,0,595,155],
      // Stream north of bridge
      [605,0,775,222],
      // Stream south of bridge (with flowerbed island)
      [525,295,840,475],
      // Great Tree & upper-right forest border
      [855,0,1090,175],
      // East raised garden bed & fence
      [920,280,1195,405],
      // Lower-left cottage & cliff
      [0,375,480,675],
      // Lower-right cliff & coastal water
      [710,475,1200,675]
    ],
    ellipses:[],
    occluders:[
      {rect:[55,220,90,340],baselineY:340},   // West entrance lamp post
      {rect:[600,170,785,238],baselineY:240}, // Bridge upper stone parapet
      {rect:[600,260,785,305],baselineY:305}, // Bridge lower stone arch rim
      {rect:[532,162,566,260],baselineY:260}, // Central lamp post
      {rect:[310,235,348,325],baselineY:325}  // Flower island lamp post
    ]
  }
};

function isPilotMap(id){
  return !!MAPS[id];
}

function getMap(id){
  return MAPS[id]||null;
}

function walkable(id,x,y,r=11){
  const m=MAPS[id];
  if(!m)return false;
  if(x<r||y<r||x>m.w-r||y>m.h-r)return false;
  const insideZone=m.walkZones.some(z=>inRect(x,y,0,z));
  if(!insideZone)return false;
  if(m.blocks.some(b=>rectsOverlap(x,y,r,b)))return false;
  if(m.ellipses?.some(e=>inEllipse(x,y,r,e.cx,e.cy,e.rx,e.ry)))return false;
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

// Dedicated WebGL2 renderer for 1672x941 pilot maps (zero downscaling, mipmaps, DPR up to 2.0)
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

function drawOccluders(c,mapId,img,playerY){
  const m=MAPS[mapId];
  if(!m?.occluders?.length||!img?.complete||!img.naturalWidth)return;
  const sxScale=img.naturalWidth/m.w,syScale=img.naturalHeight/m.h;
  for(const occ of m.occluders){
    if(playerY>=occ.baselineY)continue;
    const [x1,y1,x2,y2]=occ.rect,w=x2-x1,h=y2-y1;
    c.drawImage(img,x1*sxScale,y1*syScale,w*sxScale,h*syScale,x1,y1,w,h);
  }
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
  renderBackground,
  drawOccluders,
  hide,
  characterScale:0.78
};
})(window,document);
