/* PSYWORLD — Anime 3/4 HD Playable Pilot V2 (Centro <-> Jardins)
 * Isolated prototype activated via ?visual=anime3q or opening pallet-centro-3q / pallet-jardins-3q.
 * Preserves full 1672x941 artwork resolution via WebGL2, separates render texels from
 * 1200x675 logical polygon/circle/ellipse collision coordinates (foot-anchored),
 * adapts 3/4 character scale, depth occlusion, crisp pixel-art follower Pokemon,
 * and bidirectional area transitions.
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

// Pixel-accurate walkable polygons & solid obstacles mapped on 1200x675 grid over 1672x941 artworks
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
      {id:'home',at:[345,195],title:'Casa de Red'},
      {id:'house-east',at:[960,185],title:'Casa Leste'}
    ],
    npcs:[],
    grass:[],
    portals:[
      {
        id:'to-jardins',
        rect:[1155,120,1200,265],
        target:'pallet-jardins-3q',
        spawn:[82,235],
        facing:'right',
        marker:[1165,195],
        label:'JARDINS →',
        color:'#80ffaa'
      }
    ],
    walkPolys:[
      // Main plaza + diagonal West road + diagonal East avenue to Jardins
      [[0,145],[140,215],[390,200],[545,220],[665,220],[885,205],[1200,128],[1200,240],[940,365],[750,505],[520,520],[340,485],[0,385],[0,275]],
      // North stone staircase
      [[545,8],[662,8],[662,235],[545,235]],
      // South stone staircase
      [[530,505],[728,505],[748,670],[520,670]],
      // NW house porch steps
      [[310,180],[395,180],[395,218],[310,218]]
    ],
    blockPolys:[
      // NW corner raised flowerbed between house and North stairs
      [[410,130],[542,130],[542,224],[435,224]],
      // SW wooden fence & bush island on West diagonal road
      [[0,235],[125,300],[105,350],[0,290]]
    ],
    blocks:[
      [274,218,356,252], // NW wooden bench
      [762,200,838,236]  // NE wooden bench
    ],
    ellipses:[
      {cx:596,cy:306,rx:146,ry:80} // Central fountain & flowerbed island
    ],
    circles:[
      {cx:446,cy:344,r:12}, // West plaza lamp post
      {cx:498,cy:192,r:12}, // NW lamp post
      {cx:742,cy:192,r:12}  // NE lamp post
    ],
    occluders:[
      {rect:[548,208,644,242],baselineY:244,minY:190,xPad:28}, // Fountain upper spire (only behind fountain)
      {rect:[438,258,454,348],baselineY:348,minY:245,xPad:24}, // West plaza lamp post shaft
      {rect:[490,115,506,196],baselineY:196,minY:105,xPad:24}, // NW lamp post shaft
      {rect:[734,115,750,196],baselineY:196,minY:105,xPad:24}, // NE lamp post shaft
      {rect:[705,0,890,158],baselineY:172,minY:0,xPad:16},     // NE cherry tree canopy
      {rect:[508,545,534,665],baselineY:655,minY:525,xPad:10}, // South stair left pillar (narrow)
      {rect:[724,545,752,665],baselineY:655,minY:525,xPad:10}  // South stair right pillar (narrow)
    ]
  },
  'pallet-jardins-3q':{
    id:'pallet-jardins-3q',
    title:'Pallet Town · Jardins e Bosque',
    subtitle:'Protótipo Anime 3/4 HD · Oeste ← Centro',
    w:LOGICAL_W,h:LOGICAL_H,
    art:'assets/story/pallet/anime3q/02_jardins_bosque.png',
    spawn:[82,235],
    exit:[20,235],
    doors:[
      {id:'garden-cottage',at:[255,130],title:'Cabana do Bosque'}
    ],
    npcs:[],
    grass:[],
    portals:[
      {
        id:'to-centro',
        rect:[0,130,45,350],
        target:'pallet-centro-3q',
        spawn:[1130,200],
        facing:'left',
        marker:[38,235],
        label:'← CENTRO',
        color:'#80ffaa'
      }
    ],
    walkPolys:[
      // West cobblestone entrance
      [[0,138],[185,225],[385,195],[385,375],[185,370],[0,275]],
      // Cottage stone staircase & porch (Cabana do Bosque)
      [[225,110],[320,110],[380,175],[300,210]],
      // Upper path north of flowerbed island
      [[185,165],[585,150],[585,228],[185,230]],
      // Lower path south of flowerbed island
      [[185,345],[585,345],[585,445],[185,415]],
      // Wisteria pergola stone patio
      [[435,105],[575,105],[585,165],[435,165]],
      // Central north-south dirt avenue
      [[475,145],[610,145],[610,505],[475,505]],
      // Stone arch bridge across stream
      [[585,222],[805,222],[805,286],[585,286]],
      // East grassy clearing & Great Tree hollow
      [[780,135],[1085,135],[1135,295],[780,295]],
      // Northeast woodland trail
      [[1055,20],[1170,20],[1145,225],[1045,225]],
      // East garden path south of bridge & around raised flowerbed
      [[795,280],[925,280],[925,465],[795,465]],
      [[840,365],[1085,365],[1085,465],[840,465]],
      // South dirt plaza & stone staircase to beach
      [[470,455],[690,455],[690,535],[470,535]],
      [[525,515],[685,515],[715,655],[545,655]]
    ],
    blockPolys:[],
    blocks:[
      [405,175,465,208], // Upper-left bench near cottage
      [462,112,522,142], // Wisteria pergola table & stools
      [605,200,775,224], // Bridge upper stone parapet
      [605,282,775,310], // Bridge lower stone parapet
      [922,282,1065,368], // SE raised square flowerbed
      [795,290,845,322]  // East garden bench by stream
    ],
    ellipses:[
      {cx:345,cy:290,rx:142,ry:72}, // Central raised flowerbed island
      {cx:965,cy:118,rx:48,ry:26}   // Great Tree trunk
    ],
    circles:[
      {cx:64,cy:295,r:13},  // West entrance lamp post
      {cx:552,cy:245,r:12}, // Central lamp post
      {cx:768,cy:186,r:16}, // Pink cherry tree trunk (east of stream)
      {cx:882,cy:205,r:15}, // Clearing flat rock 1
      {cx:988,cy:224,r:12}, // Clearing flat rock 2
      {cx:865,cy:332,r:12}  // East garden lamp post
    ],
    occluders:[
      {rect:[56,215,72,298],baselineY:298,minY:205,xPad:24},   // West entrance lamp post shaft
      {rect:[322,235,338,325],baselineY:325,minY:225,xPad:24}, // Flower island lamp post shaft
      {rect:[544,158,560,250],baselineY:250,minY:150,xPad:24}, // Central lamp post shaft
      {rect:[605,274,775,290],baselineY:282,minY:255,xPad:8},  // Bridge lower stone rail (feet strip only)
      {rect:[705,70,835,172],baselineY:186,minY:60,xPad:18},   // Pink cherry tree canopy
      {rect:[875,0,1055,112],baselineY:122,minY:0,xPad:18},    // Great Tree canopy
      {rect:[857,245,873,335],baselineY:335,minY:235,xPad:24}, // East garden lamp post shaft
      {rect:[482,462,498,530],baselineY:530,minY:450,xPad:14}, // South stair left lamp post
      {rect:[688,448,704,518],baselineY:518,minY:440,xPad:14}  // South stair right lamp post
    ]
  }
};

function isPilotMap(id){
  return !!MAPS[id];
}

function getMap(id){
  return MAPS[id]||null;
}

function walkable(id,x,y,r=9){
  const m=MAPS[id];
  if(!m)return false;
  const fr=Math.min(9,r); // Foot-anchored collision radius
  if(x<fr||y<fr||x>m.w-fr||y>m.h-fr)return false;
  if(!inUnionPolys(x,y,m.walkPolys))return false;
  if(!inUnionPolys(x+fr,y,m.walkPolys)||!inUnionPolys(x-fr,y,m.walkPolys)||!inUnionPolys(x,y+fr,m.walkPolys)||!inUnionPolys(x,y-fr,m.walkPolys))return false;
  if(m.blockPolys?.some(p=>circleHitsPoly(x,y,fr,p)))return false;
  if(m.blocks?.some(b=>rectsOverlap(x,y,fr,b)))return false;
  if(m.ellipses?.some(e=>inEllipse(x,y,fr,e.cx,e.cy,e.rx,e.ry)))return false;
  if(m.circles?.some(c=>inCircle(x,y,fr,c.cx,c.cy,c.r)))return false;
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

function getActiveOccluders(mapId,playerX,playerY){
  const m=MAPS[mapId];
  if(!m?.occluders?.length)return [];
  const px=Number.isFinite(playerX)?playerX:null;
  return m.occluders.filter(occ=>{
    if(playerY>=occ.baselineY)return false;
    if(occ.minY!==undefined&&playerY<occ.minY)return false;
    if(px!==null){
      const pad=occ.xPad??18;
      if(px<occ.rect[0]-pad||px>occ.rect[2]+pad)return false;
    }
    return true;
  });
}

function drawOccluders(c,mapId,img,playerY,playerX){
  const m=MAPS[mapId];
  if(!m?.occluders?.length||!img?.complete||!img.naturalWidth)return;
  const active=getActiveOccluders(mapId,playerX,playerY);
  if(!active.length)return;
  const sxScale=img.naturalWidth/m.w,syScale=img.naturalHeight/m.h;
  for(const occ of active){
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
  getActiveOccluders,
  hide,
  characterScale:1.56,
  followerScale:1.18
};
})(window,document);
