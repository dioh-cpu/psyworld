/* PSYWORLD — Pallet Town HD WebGL2 Renderer (Phase 1 Prototype)
 * Activated ONLY when ?visual=hd is present (or enabled via API) and only for
 * outdoor Pallet Town. Preserves 100% of logical coordinates (900x450), collisions,
 * camera math, NPCs, portals, and controls while eliminating the 900x450 intermediate
 * downscaling bottleneck and offloading water/foliage rendering to WebGL2.
 */
(function(W,D){
'use strict';
if(W.PsyKantoPalletHDV1)return;

const WORLD_W=900,WORLD_H=450,SEA_TOP=402;
const params=new URLSearchParams(W.location?.search||'');
let enabled=params.get('visual')==='hd';
let canvas=null,gl=null,contextLost=false,visible=false;
let bgProg=null,spriteProg=null,quadBuf=null;
let seaMaskTex=null,seaMaskSource=null,seaMaskBuilding=false;
const textures=new Map();

// Telemetry for real FPS, frame-time, draw-calls, and VRAM estimation
const metrics={
  backend:'uninitialized',
  dpr:1,
  canvasSize:{w:0,h:0},
  sourceTexSize:{w:0,h:0},
  drawCalls:0,
  lastDrawMs:0,
  avgFrameMs:0,
  p95FrameMs:0,
  fps:0,
  frameTimes:[],
  lastTickAt:0
};

function isSeaColor(r,g,b){
  const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;
  if(max<36||delta<18||b<r*1.12)return false;
  let h;
  if(max===r)h=60*(((g-b)/delta)%6);
  else if(max===g)h=60*((b-r)/delta+2);
  else h=60*((r-g)/delta+4);
  if(h<0)h+=360;
  return h>=168&&h<=224&&(delta/max)>=.22;
}

const VERT_SRC=`#version 300 es
precision highp float;
in vec2 a_pos;
in vec2 a_uv;
uniform vec4 u_rect;      // x, y, w, h in world coords
uniform vec4 u_view;      // vw, vh, scale, 0
uniform vec2 u_offset;    // ox, oy in canvas pixels
uniform vec4 u_uvRect;    // u0, v0, u1, v1
out vec2 v_uv;
void main(){
  vec2 worldPos=u_rect.xy+a_pos*u_rect.zw;
  vec2 screenPos=worldPos*u_view.z+u_offset;
  vec2 ndc=vec2((screenPos.x/u_view.x)*2.0-1.0, 1.0-(screenPos.y/u_view.y)*2.0);
  gl_Position=vec4(ndc,0.0,1.0);
  v_uv=mix(u_uvRect.xy,u_uvRect.zw,a_uv);
}`;

const BG_FRAG_SRC=`#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_bgTex;
uniform sampler2D u_seaMask;
uniform float u_time;
uniform float u_reduced;
out vec4 outColor;

void main(){
  float mask=texture(u_seaMask,v_uv).r;
  vec4 base=texture(u_bgTex,v_uv);
  if(mask>0.08 && u_reduced<0.5){
    // GPU water refraction & shimmer confined strictly within the sea/fountain mask
    float waveX=sin(v_uv.y*120.0+u_time*1.35)*0.0014+sin(v_uv.y*52.0-u_time*0.75)*0.0007;
    float waveY=cos(v_uv.x*75.0+u_time*0.95)*0.0005;
    vec2 warpedUv=clamp(v_uv+vec2(waveX,waveY)*mask,vec2(0.001),vec2(0.999));
    float warpedMask=texture(u_seaMask,warpedUv).r;
    vec4 waterSample=mix(base,texture(u_bgTex,warpedUv),step(0.15,warpedMask));
    // Subtle anime-style specular wave highlights
    float glintA=sin(v_uv.x*160.0-u_time*1.9+sin(v_uv.y*60.0+u_time)*1.5);
    float glintB=cos(v_uv.x*95.0+u_time*1.25+v_uv.y*80.0);
    float sparkle=smoothstep(0.92,0.995,glintA*0.55+glintB*0.45)*0.16*mask;
    vec3 col=waterSample.rgb+vec3(0.68,0.96,0.94)*sparkle;
    outColor=vec4(col,base.a);
  }else{
    outColor=base;
  }
}`;

const SPRITE_FRAG_SRC=`#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_tex;
uniform float u_alpha;
out vec4 outColor;
void main(){
  vec4 c=texture(u_tex,v_uv);
  outColor=vec4(c.rgb,c.a*u_alpha);
}`;

function compileShader(type,src){
  const s=gl.createShader(type);
  gl.shaderSource(s,src);
  gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){
    console.warn('WebGL2 shader error:',gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function createProgram(vsSrc,fsSrc){
  const vs=compileShader(gl.VERTEX_SHADER,vsSrc);
  const fs=compileShader(gl.FRAGMENT_SHADER,fsSrc);
  if(!vs||!fs)return null;
  const p=gl.createProgram();
  gl.attachShader(p,vs);
  gl.attachShader(p,fs);
  gl.linkProgram(p);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)){
    console.warn('WebGL2 link error:',gl.getProgramInfoLog(p));
    gl.deleteProgram(p);
    return null;
  }
  return p;
}

function initGL(stage){
  if(contextLost||!stage)return false;
  if(gl&&canvas&&canvas.parentNode===stage)return true;
  if(!canvas){
    canvas=D.createElement('canvas');
    canvas.className='kw2-hd-gl';
    canvas.setAttribute('aria-hidden','true');
    canvas.addEventListener('webglcontextlost',e=>{
      e.preventDefault();
      contextLost=true;
      metrics.backend='canvas2d-fallback';
      textures.clear();
      seaMaskTex=null;
      seaMaskSource=null;
    },false);
    canvas.addEventListener('webglcontextrestored',()=>{
      contextLost=false;
      gl=null;bgProg=null;spriteProg=null;quadBuf=null;
      initGL(stage);
    },false);
  }
  if(canvas.parentNode!==stage){
    stage.insertBefore(canvas,stage.firstChild);
  }
  if(!gl){
    gl=canvas.getContext('webgl2',{alpha:false,antialias:true,powerPreference:'high-performance',premultipliedAlpha:false});
    if(!gl){
      metrics.backend='canvas2d-unavailable';
      return false;
    }
  }
  if(!bgProg)bgProg=createProgram(VERT_SRC,BG_FRAG_SRC);
  if(!spriteProg)spriteProg=createProgram(VERT_SRC,SPRITE_FRAG_SRC);
  if(!bgProg||!spriteProg){
    metrics.backend='shader-error';
    return false;
  }
  if(!quadBuf){
    quadBuf=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,quadBuf);
    // x, y, u, v
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([
      0,0, 0,0,
      1,0, 1,0,
      0,1, 0,1,
      1,1, 1,1
    ]),gl.STATIC_DRAW);
  }
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  metrics.backend='webgl2';
  return true;
}

function uploadTexture(key,img,options={}){
  if(!gl||!img||!img.complete||!img.naturalWidth)return null;
  const existing=textures.get(key);
  if(existing&&existing.img===img)return existing;
  if(existing&&existing.tex)gl.deleteTexture(existing.tex);
  const tex=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  if(options.mipmaps!==false){
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
  }else{
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  }
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  const w=img.naturalWidth,h=img.naturalHeight;
  const bytesRGBA=w*h*4;
  const bytesWithMipmaps=options.mipmaps!==false?Math.round(bytesRGBA*1.3333):bytesRGBA;
  const rec={tex,img,w,h,bytesRGBA,bytesWithMipmaps,name:key};
  textures.set(key,rec);
  return rec;
}

function ensureSeaMask(bgImg){
  if(!gl||!bgImg||!bgImg.complete||!bgImg.naturalWidth)return null;
  if(seaMaskTex&&seaMaskSource===bgImg)return seaMaskTex;
  if(seaMaskBuilding)return seaMaskTex;
  seaMaskBuilding=true;
  try{
    const c=D.createElement('canvas');
    c.width=WORLD_W;c.height=WORLD_H;
    const ctx=c.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(bgImg,0,0,WORLD_W,WORLD_H);
    const data=ctx.getImageData(0,0,WORLD_W,WORLD_H).data;
    const mask=new Uint8Array(WORLD_W*WORLD_H);
    for(let y=0;y<WORLD_H;y++){
      for(let x=0;x<WORLD_W;x++){
        const idx=y*WORLD_W+x,i=idx*4;
        const inSea=y>=SEA_TOP||(x>=438&&x<=496&&y>=312&&y<=344);
        if(inSea&&isSeaColor(data[i],data[i+1],data[i+2]))mask[idx]=255;
      }
    }
    if(seaMaskTex)gl.deleteTexture(seaMaskTex);
    seaMaskTex=gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,seaMaskTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.R8,WORLD_W,WORLD_H,0,gl.RED,gl.UNSIGNED_BYTE,mask);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT,4);
    seaMaskSource=bgImg;
  }catch(err){
    console.warn('Pallet HD sea mask error:',err);
  }finally{
    seaMaskBuilding=false;
  }
  return seaMaskTex;
}

function bindQuad(prog){
  gl.bindBuffer(gl.ARRAY_BUFFER,quadBuf);
  const posLoc=gl.getAttribLocation(prog,'a_pos');
  const uvLoc=gl.getAttribLocation(prog,'a_uv');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc,2,gl.FLOAT,false,16,0);
  gl.enableVertexAttribArray(uvLoc);
  gl.vertexAttribPointer(uvLoc,2,gl.FLOAT,false,16,8);
}

const treeSprites={};
function ensureTreeSprites(){
  if(treeSprites.ready)return;
  treeSprites.ready=true;
  const root='assets/story/pallet/trees/';
  for(const size of ['small','large']){
    const structure=new Image(),foliage=new Image();
    structure.src=root+'tree-'+size+'-structure.png';
    foliage.src=root+'tree-'+size+'-foliage-atlas.png';
    treeSprites[size]={structure,foliage};
  }
}

function recordFrameTiming(drawMs,now){
  metrics.lastDrawMs=Number(drawMs.toFixed(3));
  if(metrics.lastTickAt>0){
    const dt=now-metrics.lastTickAt;
    if(dt>0&&dt<250){
      metrics.frameTimes.push(dt);
      if(metrics.frameTimes.length>90)metrics.frameTimes.shift();
      const sorted=metrics.frameTimes.slice().sort((a,b)=>a-b);
      const sum=sorted.reduce((a,b)=>a+b,0);
      const avg=sum/sorted.length;
      const p95=sorted[Math.min(sorted.length-1,Math.floor(sorted.length*0.95))];
      metrics.avgFrameMs=Number(avg.toFixed(2));
      metrics.p95FrameMs=Number(p95.toFixed(2));
      metrics.fps=Number((1000/avg).toFixed(1));
    }
  }
  metrics.lastTickAt=now;
}

function render(stage,view,bgImg,now,options={}){
  if(!enabled||!stage)return false;
  if(!initGL(stage))return false;
  const t0=performance.now();
  visible=true;
  canvas.style.display='block';
  if(canvas.width!==view.w||canvas.height!==view.h){
    canvas.width=view.w;
    canvas.height=view.h;
  }
  metrics.dpr=options.dpr||Math.min(2,W.devicePixelRatio||1);
  metrics.canvasSize={w:view.w,h:view.h};
  gl.viewport(0,0,view.w,view.h);
  gl.clearColor(0.071,0.180,0.188,1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  let draws=0;
  if(bgImg&&bgImg.complete&&bgImg.naturalWidth>0){
    metrics.sourceTexSize={w:bgImg.naturalWidth,h:bgImg.naturalHeight};
    const bgRec=uploadTexture('pallet-bg',bgImg,{mipmaps:true});
    const mask=ensureSeaMask(bgImg);
    if(bgRec&&mask){
      gl.useProgram(bgProg);
      bindQuad(bgProg);
      gl.uniform4f(gl.getUniformLocation(bgProg,'u_rect'),0,0,WORLD_W,WORLD_H);
      gl.uniform4f(gl.getUniformLocation(bgProg,'u_view'),view.w,view.h,view.scale,0);
      gl.uniform2f(gl.getUniformLocation(bgProg,'u_offset'),view.ox,view.oy);
      gl.uniform4f(gl.getUniformLocation(bgProg,'u_uvRect'),0,0,1,1);
      gl.uniform1f(gl.getUniformLocation(bgProg,'u_time'),now/1000);
      gl.uniform1f(gl.getUniformLocation(bgProg,'u_reduced'),options.reduced?1.0:0.0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D,bgRec.tex);
      gl.uniform1i(gl.getUniformLocation(bgProg,'u_bgTex'),0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D,mask);
      gl.uniform1i(gl.getUniformLocation(bgProg,'u_seaMask'),1);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      draws++;
    }
  }

  // Render modular trees at full native texture resolution via WebGL2
  const veg=W.PsyKantoPalletVegetationV1;
  if(veg?.trees&&veg?.geometry){
    ensureTreeSprites();
    gl.useProgram(spriteProg);
    bindQuad(spriteProg);
    const uRect=gl.getUniformLocation(spriteProg,'u_rect');
    const uView=gl.getUniformLocation(spriteProg,'u_view');
    const uOff=gl.getUniformLocation(spriteProg,'u_offset');
    const uUv=gl.getUniformLocation(spriteProg,'u_uvRect');
    const uTex=gl.getUniformLocation(spriteProg,'u_tex');
    const uAlpha=gl.getUniformLocation(spriteProg,'u_alpha');
    gl.uniform4f(uView,view.w,view.h,view.scale,0);
    gl.uniform2f(uOff,view.ox,view.oy);
    gl.uniform1f(uAlpha,1.0);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(uTex,0);

    const t=now/1000,WIND_SPEED=1.3,GROUP_COUNT=7;
    const treeDefs=[
      {size:'large',x:35,y:70,phase:.2,strength:1.0},
      {size:'small',x:350,y:45,phase:2.3,strength:.72},
      {size:'small',x:610,y:55,phase:4.4,strength:.68}
    ];
    for(let ti=0;ti<treeDefs.length;ti++){
      const tr=treeDefs[ti],dim=veg.geometry[tr.size],sp=treeSprites[tr.size];
      if(!dim||!sp)continue;
      const [w,h]=dim,x=tr.x,y=tr.y;
      const sRec=uploadTexture('tree-'+tr.size+'-structure',sp.structure,{mipmaps:true});
      const fRec=uploadTexture('tree-'+tr.size+'-foliage',sp.foliage,{mipmaps:true});
      if(!sRec||!fRec)continue;
      // Trunk & branches
      gl.bindTexture(gl.TEXTURE_2D,sRec.tex);
      gl.uniform4f(uRect,x-w/2,y-h,w,h);
      gl.uniform4f(uUv,0,0,1,1);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      draws++;
      // 7 foliage groups with harmonic wind sway
      gl.bindTexture(gl.TEXTURE_2D,fRec.tex);
      const gust=Math.pow(Math.max(0,Math.sin(t*0.19*WIND_SPEED-1.1+tr.phase)),9);
      const sourceH=fRec.h/GROUP_COUNT;
      for(let g=0;g<GROUP_COUNT;g++){
        const phase=tr.phase+g*1.73+ti*0.61;
        const amp=tr.strength*(1+gust*0.32);
        const dxAsset=options.reduced?0:(Math.sin(t*0.82*WIND_SPEED+phase)*1.35+Math.sin(t*0.34*WIND_SPEED+phase*1.47)*0.48+gust*0.56)*amp;
        const dyAsset=options.reduced?0:(Math.cos(t*0.61*WIND_SPEED+phase)*0.28+gust*0.12)*amp;
        const v0=g/GROUP_COUNT,v1=(g+1)/GROUP_COUNT;
        gl.uniform4f(uRect,x-w/2+dxAsset*w/fRec.w,y-h+dyAsset*h/sourceH,w,h);
        gl.uniform4f(uUv,0,v0,1,v1);
        gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
        draws++;
      }
    }
  }

  metrics.drawCalls=draws;
  recordFrameTiming(performance.now()-t0,now);
  return true;
}

function hide(){
  if(canvas&&visible){
    canvas.style.display='none';
    visible=false;
  }
}

function getMetrics(){
  const texList=[];
  let totalBytes=0,totalMipBytes=0;
  for(const rec of textures.values()){
    texList.push({name:rec.name,width:rec.w,height:rec.h,bytesRGBA:rec.bytesRGBA,bytesWithMipmaps:rec.bytesWithMipmaps});
    totalBytes+=rec.bytesRGBA;
    totalMipBytes+=rec.bytesWithMipmaps;
  }
  if(seaMaskTex){
    const maskBytes=WORLD_W*WORLD_H; // R8 1-channel
    texList.push({name:'pallet-sea-mask-r8',width:WORLD_W,height:WORLD_H,bytesRGBA:maskBytes,bytesWithMipmaps:maskBytes});
    totalBytes+=maskBytes;
    totalMipBytes+=maskBytes;
  }
  return {
    ...metrics,
    enabled,
    visible,
    textures:texList,
    estimatedTextureVRAMBytes:totalBytes,
    estimatedTextureVRAMWithMipmapsBytes:totalMipBytes
  };
}

W.PsyKantoPalletHDV1={
  isEnabled:()=>enabled,
  isActive:()=>enabled&&!contextLost,
  setEnabled:v=>{enabled=!!v;if(!enabled)hide();},
  render,
  hide,
  getMetrics
};
})(window,document);
