/* ============================================================
   PSYWORLD — PSY IDLE — PALLET V4
   Cidade top-down composta em runtime com texturas/objetos CC0.
   Sem geração de imagens. Integra Professor Carvalho, Nurse Joy,
   Centro Pokémon, Poké Shop e transição para Floresta Verdejante.
   ============================================================ */
(function(W,D){
'use strict';
if(W.__PSY_IDLE_REALISTIC_CITY_V4__)return;
W.__PSY_IDLE_REALISTIC_CITY_V4__=true;

const MAP_W=3200,MAP_H=2100,PLAYER_R=23;
const ASSETS={
  grass:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/leafy_grass/leafy_grass_diff_2k.jpg',
  dirt:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/dirt/dirt_diff_2k.jpg',
  cobble:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/cobblestone_floor_13/cobblestone_floor_13_diff_2k.jpg',
  roofRed:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/red_slate_roof_tiles_01/red_slate_roof_tiles_01_diff_2k.jpg',
  roofGrey:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/grey_roof_tiles/grey_roof_tiles_diff_2k.jpg',
  tree:'https://cdn.polyhaven.com/asset_img/renders/tree_small_02/orth_top.png?height=512&quality=95',
  shrub:'https://cdn.polyhaven.com/asset_img/renders/shrub_01/orth_top.png?height=512&quality=95',
  flowers:'https://cdn.polyhaven.com/asset_img/renders/grass_medium_01/orth_top.png?height=512&quality=95',
  oak:'https://raw.githubusercontent.com/Sonofg0tham/tailgate/main/public/assets/characters/player_stand.png',
  joy:'https://raw.githubusercontent.com/Sonofg0tham/tailgate/main/public/assets/characters/staff_b.png',
  shopkeeper:'https://raw.githubusercontent.com/Sonofg0tham/tailgate/main/public/assets/characters/staff_a.png',
  treeLocal:'assets/idle-realistic/pallet/tree_big.png',
  treeCurveLocal:'assets/idle-realistic/pallet/tree_curve.png',
  shrubLocal:'assets/idle-realistic/pallet/bush_green.png',
  flowersLocal:'assets/idle-realistic/pallet/bush_flowers.png',
  rockBigLocal:'assets/idle-realistic/pallet/rock_big.png',
  rockMidLocal:'assets/idle-realistic/pallet/rock_mid.png',
  signLocal:'assets/idle-realistic/pallet/sign.png',
  stumpLocal:'assets/idle-realistic/pallet/stump.png',
  logLocal:'assets/idle-realistic/pallet/log.png'
};

let screen,cv,ctx,raf=0,running=false,last=0,cam={x:0,y:0},dpr=1,keys=new Set(),pointerTarget=null;
let env={},player={x:1600,y:1210,speed:235,facing:1,stuck:0},colliders=[],trees=[],shrubs=[],rocks=[],decorObjs=[],npcs=[],buildings=[],interaction=null,toastTimer=0,lastSafe={x:1600,y:1210},fallbackTiles={},worldLayer=null,worldLayerReady=false,worldLayerBuildQueued=false;

function state(){try{return typeof P!=='undefined'?P:W.P}catch(e){return W.P||null}}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function hypot(x,y){return Math.sqrt(x*x+y*y)||1}
function dist2(a,b){const x=a.x-b.x,y=a.y-b.y;return x*x+y*y}
function notify(m){try{W.notif?.(m,2600)}catch(e){console.log('[PALLET]',m)}}
function img(url){const im=new Image();im.decoding='async';im.crossOrigin='anonymous';im.src=url;return im}
function activePoke(){const p=state();return p?.team?.[0]||{id:25,name:'Pikachu',level:1,hp:35,maxHp:35}}
function pokeUrl(p){const id=Math.max(1,Number(p?.id||25)),sh=!!(p?.shiny||p?.isShiny);return sh?`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/shiny/${id}.gif`:`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`}
let playerImg=null,playerImgId='';
function playerSprite(){const p=activePoke(),k=`${p.id}:${!!(p.shiny||p.isShiny)}`;if(k!==playerImgId){playerImgId=k;playerImg=img(pokeUrl(p));playerImg.onerror=()=>{playerImg.src=`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.shiny?'shiny/':''}${p.id}.png`}}return playerImg}

function installStyle(){if(D.getElementById('psy-idle-city-style'))return;const st=D.createElement('style');st.id='psy-idle-city-style';st.textContent=`
#psy-idle-city{position:fixed;inset:0;z-index:420;background:#0c2013;display:none;overflow:hidden;font-family:system-ui,Segoe UI,sans-serif;color:#fff;touch-action:none}
#psy-idle-city canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.psy-city-hud{position:absolute;left:12px;top:12px;width:min(390px,calc(100vw - 24px));background:#071722e8;border:1px solid #86efac;border-radius:14px;padding:10px;box-shadow:0 10px 30px #0008;backdrop-filter:blur(5px);pointer-events:none}.psy-city-title{font-size:16px;font-weight:950;color:#bbf7d0}.psy-city-sub{font-size:9px;color:#cbd5e1;margin-top:2px}.psy-city-row{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:7px}.psy-city-pill{font-size:10px;background:#0f2633;border:1px solid #31526a;border-radius:999px;padding:4px 8px}
.psy-city-top{position:absolute;right:12px;top:12px;display:flex;gap:7px}.psy-city-btn{border:1px solid #67e8f9;background:#0b2633e8;color:#fff;border-radius:10px;padding:8px 11px;font-size:10px;font-weight:900;cursor:pointer}.psy-city-btn.green{border-color:#86efac;background:#14532d}.psy-city-btn.exit{border-color:#fb7185;background:#651827}
.psy-city-interact{position:absolute;left:50%;bottom:26px;transform:translateX(-50%);display:none;min-width:min(520px,90vw);background:#071722f2;border:2px solid #facc15;border-radius:14px;padding:10px;text-align:center;box-shadow:0 8px 30px #0009}.psy-city-interact b{color:#fde68a}.psy-city-interact button{margin-top:7px;border:1px solid #fde047;background:#854d0e;color:#fff;border-radius:9px;padding:8px 16px;font-weight:900;cursor:pointer}
.psy-city-modal{position:absolute;inset:0;z-index:8;background:#0009;display:flex;align-items:center;justify-content:center;padding:20px}.psy-city-panel{width:min(560px,94vw);background:#071722;border:2px solid #67e8f9;border-radius:18px;padding:16px;box-shadow:0 20px 60px #000}.psy-city-panel h2{margin:0 0 8px;color:#facc15}.psy-city-panel p{font-size:12px;line-height:1.55;color:#dbeafe}.psy-city-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.psy-city-actions button{flex:1;min-width:150px;border:1px solid #38bdf8;background:#0c4a6e;color:#fff;border-radius:10px;padding:9px;font-weight:900;cursor:pointer}.psy-city-actions .good{border-color:#86efac;background:#166534}.psy-city-actions .close{border-color:#fb7185;background:#7f1d1d}
@media(max-width:760px){.psy-city-hud{width:min(330px,70vw)}.psy-city-top{top:auto;bottom:10px;right:10px;flex-direction:column}.psy-city-interact{bottom:105px}}
`;D.head.appendChild(st)}

function loadAssets(){
  env={};
  for(const[k,u]of Object.entries(ASSETS)){
    const im=img(u);env[k]=im;
    im.onload=()=>{if(running)queueStaticWorldRebuild()};
    im.onerror=()=>{if(running)queueStaticWorldRebuild()};
  }
}
function rng32(seed){let x=seed|0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return((x>>>0)%100000)/100000}}
function makeFallbackTile(kind){
  if(fallbackTiles[kind])return fallbackTiles[kind];
  const c=D.createElement('canvas');c.width=c.height=160;const g=c.getContext('2d');
  const rnd=rng32(({grass:9137,dirt:4411,cobble:7823,roofRed:2277,roofGrey:6629}[kind]||1234));
  if(kind==='grass'){
    g.fillStyle='#4f7d44';g.fillRect(0,0,160,160);
    for(let i=0;i<520;i++){const x=rnd()*160,y=rnd()*160,l=2+rnd()*6;g.strokeStyle=rnd()>.35?'rgba(38,91,40,.34)':'rgba(154,178,86,.24)';g.lineWidth=.6+rnd()*1.1;g.beginPath();g.moveTo(x,y);g.lineTo(x+(rnd()-.5)*3,y-l);g.stroke()}
    for(let i=0;i<70;i++){g.fillStyle=rnd()>.5?'rgba(98,68,41,.22)':'rgba(187,146,76,.18)';g.beginPath();g.ellipse(rnd()*160,rnd()*160,1.2+rnd()*3,.7+rnd()*1.4,rnd()*3.14,0,6.283);g.fill()}
  }else if(kind==='dirt'){
    g.fillStyle='#735c41';g.fillRect(0,0,160,160);
    for(let i=0;i<820;i++){const v=45+Math.floor(rnd()*72);g.fillStyle=`rgba(${v},${Math.floor(v*.82)},${Math.floor(v*.58)},${.05+rnd()*.12})`;const rr=.4+rnd()*2.1;g.fillRect(rnd()*160,rnd()*160,rr,rr)}
  }else if(kind==='cobble'){
    g.fillStyle='#716b62';g.fillRect(0,0,160,160);
    for(let y=0;y<180;y+=22)for(let x=-20;x<180;x+=28){const ox=x+((Math.floor(y/22)%2)*13)+(rnd()-.5)*5,oy=y+(rnd()-.5)*4;g.fillStyle=`rgba(${102+Math.floor(rnd()*34)},${98+Math.floor(rnd()*28)},${90+Math.floor(rnd()*24)},.94)`;g.strokeStyle='rgba(35,33,31,.38)';g.lineWidth=2;g.beginPath();g.ellipse(ox,oy,11+rnd()*4,7+rnd()*3,(rnd()-.5)*.5,0,6.283);g.fill();g.stroke()}
  }else{
    const red=kind==='roofRed';g.fillStyle=red?'#7f2f30':'#58626e';g.fillRect(0,0,160,160);
    for(let y=0;y<170;y+=20)for(let x=-10;x<170;x+=31){const xx=x+((y/20)%2?15:0);g.fillStyle=red?'rgba(145,57,55,.9)':'rgba(111,123,135,.9)';g.strokeStyle='rgba(22,26,31,.35)';g.fillRect(xx,y,29,18);g.strokeRect(xx,y,29,18)}
  }
  fallbackTiles[kind]=c;return c
}
function pattern(name,kind='grass'){
  const im=env[name];
  if(im?.complete&&im.naturalWidth){try{const p=ctx.createPattern(im,'repeat');if(p)return p}catch(e){}}
  try{return ctx.createPattern(makeFallbackTile(kind),'repeat')}catch(e){return null}
}

function buildMap(){
  buildings=[
    {id:'lab',name:'LABORATÓRIO DO PROF. CARVALHO',x:420,y:300,w:650,h:360,roof:'roofGrey',wall:'#d7dee7',accent:'#60a5fa',doorX:745,doorY:650},
    {id:'center',name:'CENTRO POKÉMON',x:1710,y:310,w:460,h:300,roof:'roofRed',wall:'#fff7ed',accent:'#ef4444',doorX:1940,doorY:600},
    {id:'shop',name:'POKÉ SHOP',x:2370,y:335,w:430,h:275,roof:'roofGrey',wall:'#e0f2fe',accent:'#38bdf8',doorX:2585,doorY:600},
    {id:'house1',name:'CASA',x:520,y:1280,w:420,h:270,roof:'roofRed',wall:'#f5e9d2',accent:'#fb923c',doorX:730,doorY:1540},
    {id:'house2',name:'CASA',x:1160,y:1260,w:420,h:270,roof:'roofRed',wall:'#f5e9d2',accent:'#f97316',doorX:1370,doorY:1520}
  ];
  colliders=buildings.map(b=>({kind:'rect',x:b.x+24,y:b.y+22,w:b.w-48,h:b.h-58,id:b.id}));
  trees=[];shrubs=[];rocks=[];decorObjs=[];
  const treePts=[[160,170],[300,190],[1150,170],[1320,210],[1510,170],[2900,190],[3050,250],[135,790],[265,860],[2920,860],[3070,920],[170,1780],[330,1850],[2860,1780],[3040,1870],[1750,1700],[1920,1760],[2140,1680],[2250,1830],[2450,1750],[2630,1840]];
  for(const [x,y]of treePts){trees.push({x,y,r:54,s:.92+Math.random()*.28});colliders.push({kind:'circle',x,y,r:40})}
  for(const [x,y] of [[400,980],[520,1010],[730,920],[930,840],[2320,880],[2500,900],[2730,930],[430,1660],[610,1710],[2700,1660]]){trees.push({x,y,r:50,s:.8+Math.random()*.18});colliders.push({kind:'circle',x,y,r:36})}
  const shrubPts=[[1120,650],[1240,650],[1360,650],[1480,650],[1600,650],[2820,650],[2970,650],[980,980],[1120,1030],[1260,1000],[1400,1040],[1550,980],[2670,1020],[2810,1040],[2950,1000],[880,1730],[1030,1770],[2320,1680],[2500,1630]];
  for(const [x,y]of shrubPts)shrubs.push({x,y,s:.65+Math.random()*.25});
  for(const [x,y,sz] of [[380,720,.72],[1000,1190,.8],[2230,1190,.72],[2890,1280,.82],[990,1870,.7],[2740,620,.65],[1500,1860,.74]]){rocks.push({x,y,s:sz,big:sz>.75});colliders.push({kind:'circle',x,y,r:24+sz*17})}
  decorObjs=[{kind:'sign',x:1420,y:1190,s:.72},{kind:'sign',x:1778,y:825,s:.7},{kind:'stump',x:350,y:1380,s:.7},{kind:'stump',x:2835,y:1535,s:.66},{kind:'log',x:1040,y:1610,s:.58},{kind:'log',x:2280,y:1540,s:.58}];
  npcs=[
    {id:'oak',name:'Professor Carvalho',role:'Professor',x:815,y:735,sprite:'oak',range:125},
    {id:'joy',name:'Nurse Joy',role:'Centro Pokémon',x:1940,y:700,sprite:'joy',range:125},
    {id:'shopkeeper',name:'Lojista',role:'Poké Shop',x:2585,y:700,sprite:'shopkeeper',range:125}
  ];
}

function collides(x,y,r=PLAYER_R){
  if(x<r+20||y<r+20||x>MAP_W-r-20||y>MAP_H-r-20)return true;
  for(const c of colliders){if(c.kind==='circle'){const dx=x-c.x,dy=y-c.y;if(dx*dx+dy*dy<(r+c.r)*(r+c.r))return true}else{const nx=clamp(x,c.x,c.x+c.w),ny=clamp(y,c.y,c.y+c.h),dx=x-nx,dy=y-ny;if(dx*dx+dy*dy<r*r)return true}}
  return false
}
function sanePlayer(){if(!Number.isFinite(player.x)||!Number.isFinite(player.y)){player.x=lastSafe.x;player.y=lastSafe.y;pointerTarget=null}player.x=clamp(player.x,PLAYER_R+22,MAP_W-PLAYER_R-22);player.y=clamp(player.y,PLAYER_R+22,MAP_H-PLAYER_R-22)}
function movePlayer(vx,vy,dt){sanePlayer();const len=hypot(vx,vy);if(len<.01)return false;vx/=len;vy/=len;const step=Math.min(20,Math.max(0,player.speed*dt)),ox=player.x,oy=player.y,nx=ox+vx*step,ny=oy+vy*step;let moved=false;if(!collides(nx,oy)){player.x=nx;moved=true}if(!collides(player.x,ny)){player.y=ny;moved=true}if(!moved){const tries=[[vy,-vx],[-vy,vx],[vx*.7+vy*.7,vy*.7-vx*.7],[vx*.7-vy*.7,vy*.7+vx*.7]];for(const t of tries){const sx=t[0],sy=t[1],tx=ox+sx*step*.78,ty=oy+sy*step*.78;if(!collides(tx,ty)){player.x=tx;player.y=ty;moved=true;break}}}if(moved){lastSafe.x=player.x;lastSafe.y=player.y;player.stuck=0}else player.stuck=(player.stuck||0)+dt;player.facing=vx>=0?1:-1;sanePlayer();return moved}
function updateInteraction(){let best=null,bestD=Infinity;for(const n of npcs){const d=Math.sqrt((player.x-n.x)**2+(player.y-n.y)**2);if(d<n.range&&d<bestD){best=n;bestD=d}}interaction=best;const el=D.getElementById('psy-city-interact');if(!el)return;if(best){el.style.display='block';el.innerHTML=`<b>${best.name}</b> • ${best.role}<br><span style="font-size:10px;color:#cbd5e1">Pressione E ou toque para interagir.</span><br><button id="psy-city-do">INTERAGIR</button>`;D.getElementById('psy-city-do').onclick=()=>interact(best)}else el.style.display='none'}

function healTeam(){const p=state();if(!p?.team?.length)return notify('Nenhum Pokémon na equipe.');for(const mon of p.team){const max=Math.max(1,Number(mon.maxHp||mon.hp||1));mon.hp=max;try{delete mon.status}catch(e){}}try{W.autoSave?.();W.updateHUD?.()}catch(e){}notify('💗 Nurse Joy restaurou completamente sua equipe!')}
function modal(title,body,buttons){let old=D.getElementById('psy-city-modal');old?.remove();const m=D.createElement('div');m.id='psy-city-modal';m.className='psy-city-modal';m.innerHTML=`<div class="psy-city-panel"><h2>${title}</h2><p>${body}</p><div class="psy-city-actions"></div></div>`;screen.appendChild(m);const a=m.querySelector('.psy-city-actions');for(const b of buttons){const bt=D.createElement('button');bt.textContent=b.label;bt.className=b.cls||'';bt.onclick=()=>{if(b.close!==false)m.remove();b.fn?.()};a.appendChild(bt)}m.onclick=e=>{if(e.target===m)m.remove()}}
function interact(n){
  if(n.id==='oak')return modal('🧪 Professor Carvalho','Bem-vindo a Pallet! Esta cidade é o ponto seguro do Psy Idle. Na Floresta Verdejante seu Pokémon luta com IA própria, usa habilidades e enfrenta Pokémon selvagens em tempo real. Quando quiser, volte aqui para curar, comprar itens e preparar a próxima Hunt.',[
    {label:'🌲 IR PARA FLORESTA',cls:'good',fn:()=>goForest()},{label:'FECHAR',cls:'close'}]);
  if(n.id==='joy')return modal('💗 Nurse Joy','Posso restaurar todos os Pokémon da sua equipe, incluindo os que foram derrotados.',[
    {label:'💗 CURAR EQUIPE',cls:'good',fn:healTeam},{label:'AGORA NÃO',cls:'close'}]);
  if(n.id==='shopkeeper')return modal('🏪 Lojista','A Poké Shop de Pallet utiliza exatamente o mesmo catálogo e a mesma economia da Poké Shop do Mundo Pokémon.',[
    {label:'🛒 ABRIR POKÉ SHOP',cls:'good',fn:()=>{try{W.openShop?.()}catch(e){notify('Poké Shop indisponível.')}}},{label:'FECHAR',cls:'close'}]);
}
function goForest(){close();setTimeout(()=>W.openIdleRealisticV1?.(),70)}

function drawGround(){
  const w=cv.clientWidth,h=cv.clientHeight;
  ctx.fillStyle=pattern('grass','grass')||'#466f3f';ctx.fillRect(0,0,w,h);
  ctx.save();
  try{
    ctx.translate(-cam.x,-cam.y);
    const gp=pattern('grass','grass');if(gp){ctx.fillStyle=gp;ctx.fillRect(0,0,MAP_W,MAP_H)}
    ctx.fillStyle='rgba(38,91,47,.10)';ctx.fillRect(0,0,MAP_W,MAP_H);
    const cob=pattern('cobble','cobble');ctx.fillStyle=cob||'#807667';ctx.save();ctx.globalAlpha=.94;ctx.fillRect(1430,0,340,MAP_H);ctx.fillRect(0,860,MAP_W,300);ctx.beginPath();ctx.arc(1600,1010,285,0,Math.PI*2);ctx.fill();ctx.restore();
    const dirt=pattern('dirt','dirt');ctx.fillStyle=dirt||'#705c42';ctx.save();ctx.globalAlpha=.88;ctx.fillRect(650,1110,145,490);ctx.fillRect(1295,1110,145,450);ctx.fillRect(1910,610,70,260);ctx.fillRect(2550,610,70,260);ctx.restore();
    ctx.fillStyle='rgba(235,229,199,.16)';ctx.beginPath();ctx.arc(1600,1010,245,0,Math.PI*2);ctx.fill();
    const grad=ctx.createRadialGradient(2630,1450,40,2630,1450,260);grad.addColorStop(0,'#47b7d8');grad.addColorStop(.7,'#247e9f');grad.addColorStop(1,'#175b73');ctx.fillStyle=grad;ctx.beginPath();ctx.ellipse(2630,1450,300,210,-.18,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#a7d8b4';ctx.lineWidth=20;ctx.stroke();
  }finally{ctx.restore()}
}
function ensureWorldLayer(){
  if(worldLayer&&worldLayer.width===MAP_W&&worldLayer.height===MAP_H)return worldLayer;
  worldLayer=D.createElement('canvas');
  worldLayer.width=MAP_W;worldLayer.height=MAP_H;
  worldLayerReady=false;
  return worldLayer;
}
function queueStaticWorldRebuild(){
  if(worldLayerBuildQueued)return;
  worldLayerBuildQueued=true;
  setTimeout(()=>{worldLayerBuildQueued=false;if(running)buildStaticWorld()},40);
}
function buildStaticWorld(){
  const layer=ensureWorldLayer(),g=layer.getContext('2d',{alpha:false})||layer.getContext('2d');
  if(!g)return;
  /* O mapa estático é renderizado UMA VEZ em coordenadas de mundo.
     A câmera depois apenas recorta esse bitmap. Assim, mover no gramado
     não pode "apagar" ruas, prédios, árvores ou o jogador. */
  const oldCtx=ctx,oldCv=cv,oldCamX=cam.x,oldCamY=cam.y;
  try{
    ctx=g;
    cv={clientWidth:MAP_W,clientHeight:MAP_H};
    cam.x=0;cam.y=0;
    g.setTransform(1,0,0,1,0,0);
    g.globalAlpha=1;g.globalCompositeOperation='source-over';
    g.clearRect(0,0,MAP_W,MAP_H);
    safeDraw(drawGround,'static-ground');
    safeDraw(drawDecor,'static-decor');
    for(const sh of shrubs)safeDraw(()=>drawShrub(sh),'static-shrub');
    for(const o of decorObjs)safeDraw(()=>drawDecorObj(o),'static-decor-object');
    const draw=[];
    for(const b of buildings)draw.push({y:b.y+b.h*.72,fn:()=>drawBuilding(b),k:'static-building'});
    for(const t of trees)draw.push({y:t.y,fn:()=>drawTree(t),k:'static-tree'});
    for(const r of rocks)draw.push({y:r.y,fn:()=>drawRock(r),k:'static-rock'});
    draw.sort((a,b)=>a.y-b.y);
    for(const d of draw)safeDraw(d.fn,d.k);
    worldLayerReady=true;
  }catch(e){
    worldLayerReady=false;
    console.error('[PALLET V4] falha ao montar mapa estático',e);
  }finally{
    ctx=oldCtx;cv=oldCv;cam.x=oldCamX;cam.y=oldCamY;
  }
}
function clampCamera(){
  const vw=Math.max(1,cv?.clientWidth||1),vh=Math.max(1,cv?.clientHeight||1);
  if(!Number.isFinite(cam.x))cam.x=0;
  if(!Number.isFinite(cam.y))cam.y=0;
  cam.x=clamp(cam.x,0,Math.max(0,MAP_W-vw));
  cam.y=clamp(cam.y,0,Math.max(0,MAP_H-vh));
}
function drawStaticViewport(){
  const vw=Math.max(1,cv.clientWidth),vh=Math.max(1,cv.clientHeight);
  clampCamera();
  if(!worldLayerReady||!worldLayer){
    /* Em caso extremo, ainda mostra o mapa procedural diretamente,
       mas nunca deixa somente uma cor plana. */
    safeDraw(drawGround,'fallback-ground');
    return;
  }
  const sw=Math.min(vw,MAP_W-cam.x),sh=Math.min(vh,MAP_H-cam.y);
  ctx.drawImage(worldLayer,cam.x,cam.y,sw,sh,0,0,sw,sh);
}
function drawBuilding(b){ctx.save();ctx.translate(b.x,b.y);ctx.shadowColor='rgba(0,0,0,.36)';ctx.shadowBlur=24;ctx.shadowOffsetY=18;ctx.fillStyle='#0005';ctx.fillRect(12,18,b.w,b.h);ctx.shadowColor='transparent';ctx.fillStyle=b.wall;ctx.fillRect(0,38,b.w,b.h-38);ctx.strokeStyle='#334155';ctx.lineWidth=4;ctx.strokeRect(0,38,b.w,b.h-38);
  // textured roof
  const rp=pattern(b.roof,b.id==='center'?'roofRed':'roofGrey');ctx.fillStyle=rp;ctx.beginPath();ctx.moveTo(12,40);ctx.lineTo(b.w*.16,0);ctx.lineTo(b.w*.84,0);ctx.lineTo(b.w-12,40);ctx.lineTo(b.w-12,b.h*.62);ctx.lineTo(12,b.h*.62);ctx.closePath();ctx.fill();ctx.strokeStyle='#263244';ctx.stroke();
  // ridge + sign + door
  ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(b.w*.16,15,b.w*.68,5);ctx.fillStyle=b.accent;ctx.fillRect(b.w*.24,b.h*.52,b.w*.52,44);ctx.fillStyle='#fff';ctx.font='900 18px system-ui';ctx.textAlign='center';ctx.fillText(b.name,b.w/2,b.h*.52+29);ctx.fillStyle='#23303b';ctx.fillRect(b.w/2-35,b.h-70,70,70);ctx.fillStyle='#9dd7ff';ctx.fillRect(b.w/2-24,b.h-58,48,42);
  if(b.id==='center'){ctx.fillStyle='#ef4444';ctx.beginPath();ctx.arc(b.w/2,b.h*.27,42,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(b.w/2-12,b.h*.27-31,24,62);ctx.fillRect(b.w/2-31,b.h*.27-12,62,24)}
  if(b.id==='lab'){ctx.fillStyle='#dbeafe';for(let i=0;i<4;i++)ctx.fillRect(70+i*135,b.h*.69,74,42)}
  if(b.id==='shop'){ctx.fillStyle='#fde047';ctx.beginPath();ctx.arc(b.w/2,b.h*.29,38,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1e3a8a';ctx.font='900 28px system-ui';ctx.fillText('₽',b.w/2,b.h*.29+10)}
  ctx.restore()}
function drawTree(t){const im=(env.treeLocal?.complete&&env.treeLocal.naturalWidth)?env.treeLocal:env.tree,sz=170*t.s;ctx.save();ctx.translate(t.x,t.y);ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(6,27,42*t.s,22*t.s,0,0,Math.PI*2);ctx.fill();if(im?.complete&&im.naturalWidth)ctx.drawImage(im,-sz/2,-sz/2,sz,sz);else{ctx.fillStyle='#28532f';ctx.beginPath();ctx.arc(0,0,55*t.s,0,Math.PI*2);ctx.fill()}ctx.restore()}
function drawShrub(s){const im=(env.shrubLocal?.complete&&env.shrubLocal.naturalWidth)?env.shrubLocal:env.shrub,sz=95*s.s;ctx.save();ctx.translate(s.x,s.y);if(im?.complete&&im.naturalWidth)ctx.drawImage(im,-sz/2,-sz/2,sz,sz);else{ctx.fillStyle='#3d7b42';ctx.beginPath();ctx.arc(0,0,32*s.s,0,Math.PI*2);ctx.fill()}ctx.restore()}
function drawNpc(n){const im=env[n.sprite];ctx.save();ctx.translate(n.x,n.y);ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(0,18,23,10,0,0,Math.PI*2);ctx.fill();if(im?.complete&&im.naturalWidth)ctx.drawImage(im,-32,-42,64,64);else{ctx.fillStyle='#60a5fa';ctx.beginPath();ctx.arc(0,0,22,0,Math.PI*2);ctx.fill()}if(n.id==='joy'){ctx.fillStyle='#f9a8d4';ctx.fillRect(-27,-35,54,12);ctx.fillStyle='#fff';ctx.fillRect(-4,-37,8,16);ctx.fillRect(-8,-33,16,8)}ctx.fillStyle='#071015dd';ctx.fillRect(-72,-73,144,22);ctx.fillStyle='#fff';ctx.font='900 11px system-ui';ctx.textAlign='center';ctx.fillText(n.name,0,-58);if(interaction===n){ctx.strokeStyle='#fde047';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,44,0,Math.PI*2);ctx.stroke()}ctx.restore()}
function drawPlayer(){const pk=activePoke(),pi=playerSprite();ctx.save();ctx.translate(player.x,player.y);ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(0,21,29,11,0,0,Math.PI*2);ctx.fill();if(pi?.complete&&pi.naturalWidth){ctx.save();ctx.scale(player.facing<0?-1:1,1);ctx.imageSmoothingEnabled=false;ctx.drawImage(pi,-46,-58,92,92);ctx.restore()}else{ctx.fillStyle='#38bdf8';ctx.beginPath();ctx.arc(0,-5,27,0,Math.PI*2);ctx.fill()}ctx.strokeStyle='#67e8f9';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(0,3,31,38,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#071015dd';ctx.fillRect(-58,-69,116,19);ctx.fillStyle='#fff';ctx.font='900 10px system-ui';ctx.textAlign='center';ctx.fillText(`${pk.name||'Pokémon'} Lv.${pk.level||1}`,0,-55);ctx.restore()}
function drawDecor(){const im=(env.flowersLocal?.complete&&env.flowersLocal.naturalWidth)?env.flowersLocal:env.flowers;if(!im?.complete||!im.naturalWidth)return;for(let x=1040;x<=1330;x+=95)for(let y=720;y<=805;y+=80){ctx.globalAlpha=.8;ctx.drawImage(im,x-34,y-34,68,68)}for(let x=2200;x<=2350;x+=85)for(let y=705;y<=790;y+=75){ctx.globalAlpha=.75;ctx.drawImage(im,x-31,y-31,62,62)}ctx.globalAlpha=1}
function drawRock(r){const im=r.big?env.rockBigLocal:env.rockMidLocal,sz=(r.big?90:70)*r.s;ctx.save();ctx.translate(r.x,r.y);ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(4,18,sz*.34,sz*.16,0,0,6.283);ctx.fill();if(im?.complete&&im.naturalWidth)ctx.drawImage(im,-sz/2,-sz*.62,sz,sz);else{ctx.fillStyle='#596259';ctx.beginPath();ctx.ellipse(0,0,sz*.34,sz*.28,0,0,6.283);ctx.fill()}ctx.restore()}
function drawDecorObj(o){const im=o.kind==='sign'?env.signLocal:o.kind==='stump'?env.stumpLocal:env.logLocal;if(!im?.complete||!im.naturalWidth)return;const w=(o.kind==='log'?118:72)*o.s,h=(o.kind==='log'?70:86)*o.s;ctx.drawImage(im,o.x-w/2,o.y-h*.75,w,h)}
function safeDraw(fn,label){try{fn()}catch(e){console.warn('[PALLET V4] falha visual isolada em '+label,e)}}
function render(){
  if(!ctx||!cv)return;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
  ctx.fillStyle='#0d2415';ctx.fillRect(0,0,cv.clientWidth,cv.clientHeight);

  /* Cenário estático vem de um bitmap pré-renderizado. */
  safeDraw(drawStaticViewport,'static-viewport');

  /* NPCs e Pokémon são sempre dinâmicos por cima do cenário. */
  clampCamera();
  ctx.save();
  try{
    ctx.translate(-cam.x,-cam.y);
    for(const n of npcs)safeDraw(()=>drawNpc(n),'npc');
    safeDraw(drawPlayer,'pokemon');
  }finally{ctx.restore()}

  /* Fail-safe visual: se por qualquer motivo o Pokémon ficou fora da viewport
     por um frame, desenha um pequeno marcador no centro e corrige a câmera. */
  const sx=player.x-cam.x,sy=player.y-cam.y;
  if(!Number.isFinite(sx)||!Number.isFinite(sy)||sx<-80||sy<-100||sx>cv.clientWidth+80||sy>cv.clientHeight+100){
    cam.x=clamp(player.x-cv.clientWidth/2,0,Math.max(0,MAP_W-cv.clientWidth));
    cam.y=clamp(player.y-cv.clientHeight/2,0,Math.max(0,MAP_H-cv.clientHeight));
    ctx.save();ctx.translate(-cam.x,-cam.y);safeDraw(drawPlayer,'pokemon-recover');ctx.restore();
  }
}

function resize(){if(!cv)return;dpr=Math.min(2,W.devicePixelRatio||1);const w=Math.max(1,screen.clientWidth),h=Math.max(1,screen.clientHeight);cv.width=Math.max(1,Math.floor(w*dpr));cv.height=Math.max(1,Math.floor(h*dpr));cv.style.width=w+'px';cv.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);clampCamera()}
function updateHud(){const p=state(),pk=activePoke();const gold=Number(p?.gold||0),diam=Number(p?.diamonds||0);const el=D.getElementById('psy-city-wallet');if(el)el.textContent=`💰 ${gold.toLocaleString('pt-BR')} Gold • 💎 ${diam.toLocaleString('pt-BR')} Diamantes`;const pet=D.getElementById('psy-city-partner');if(pet)pet.textContent=`🐾 ${pk.name||'Parceiro'} Lv.${pk.level||1}`}
function update(dt){sanePlayer();let vx=0,vy=0;if(keys.has('w')||keys.has('ArrowUp'))vy--;if(keys.has('s')||keys.has('ArrowDown'))vy++;if(keys.has('a')||keys.has('ArrowLeft'))vx--;if(keys.has('d')||keys.has('ArrowRight'))vx++;if(vx||vy){pointerTarget=null;movePlayer(vx,vy,dt)}else if(pointerTarget){const dx=pointerTarget.x-player.x,dy=pointerTarget.y-player.y,d=hypot(dx,dy);if(d>12){if(!movePlayer(dx,dy,dt)&&player.stuck>.75)pointerTarget=null}else pointerTarget=null}updateInteraction();sanePlayer();cam.x=Number.isFinite(player.x)?player.x-cv.clientWidth/2:0;cam.y=Number.isFinite(player.y)?player.y-cv.clientHeight/2:0;clampCamera();updateHud()}
function loop(ts){if(!running)return;const dt=Math.min(.04,Math.max(.001,(ts-last)/1000||.016));last=ts;update(dt);render();raf=requestAnimationFrame(loop)}
function pointerWorld(ev){const r=cv.getBoundingClientRect();return{x:cam.x+(ev.clientX-r.left),y:cam.y+(ev.clientY-r.top)}}
function onPointer(e){if(e.target!==cv)return;pointerTarget=pointerWorld(e)}
function onKeyDown(e){const k=e.key.length===1?e.key.toLowerCase():e.key;if(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(k)){keys.add(k);e.preventDefault()}if(k==='e'&&interaction){interact(interaction);e.preventDefault()}}
function onKeyUp(e){const k=e.key.length===1?e.key.toLowerCase():e.key;keys.delete(k)}

function makeScreen(){installStyle();screen=D.getElementById('psy-idle-city');if(screen)return;screen=D.createElement('div');screen.id='psy-idle-city';screen.innerHTML=`<canvas id="psy-city-canvas"></canvas><div class="psy-city-hud"><div class="psy-city-title">🏡 PALLET — PSY IDLE</div><div class="psy-city-sub">Você é o Pokémon ativo • Centro Pokémon • Poké Shop • Professor Carvalho • saída para Hunts</div><div class="psy-city-row"><span class="psy-city-pill" id="psy-city-partner">🧬 —</span><span class="psy-city-pill" id="psy-city-wallet">💰 —</span></div><div class="psy-city-row"><span class="psy-city-pill">WASD / setas / toque no chão</span><span class="psy-city-pill">E = interagir</span></div></div><div class="psy-city-top"><button class="psy-city-btn green" id="psy-city-forest">🌲 FLORESTA</button><button class="psy-city-btn exit" id="psy-city-exit">✕ SAIR</button></div><div class="psy-city-interact" id="psy-city-interact"></div>`;D.body.appendChild(screen);cv=D.getElementById('psy-city-canvas');ctx=cv.getContext('2d',{alpha:false,desynchronized:true})||cv.getContext('2d');D.getElementById('psy-city-exit').onclick=close;D.getElementById('psy-city-forest').onclick=goForest;resize()}
function open(){makeScreen();if(running)return;screen.style.display='block';loadAssets();buildMap();player.x=1600;player.y=1210;player.stuck=0;lastSafe={x:player.x,y:player.y};pointerTarget=null;cam.x=0;cam.y=0;running=true;last=performance.now();W.addEventListener('resize',resize);D.addEventListener('keydown',onKeyDown,{passive:false});D.addEventListener('keyup',onKeyUp);cv.addEventListener('pointerdown',onPointer);resize();cam.x=player.x-cv.clientWidth/2;cam.y=player.y-cv.clientHeight/2;clampCamera();buildStaticWorld();raf=requestAnimationFrame(loop);notify(`🏡 Pallet carregada — você controla ${activePoke().name||'seu Pokémon'} diretamente.`)}
function close(){running=false;cancelAnimationFrame(raf);raf=0;keys.clear();pointerTarget=null;D.getElementById('psy-city-modal')?.remove();W.removeEventListener('resize',resize);D.removeEventListener('keydown',onKeyDown);D.removeEventListener('keyup',onKeyUp);try{cv?.removeEventListener('pointerdown',onPointer)}catch(e){};if(screen)screen.style.display='none'}

W.openIdleRealisticCityV1=open;W.closeIdleRealisticCityV1=close;W.openIdleRealisticCityV2=open;W.closeIdleRealisticCityV2=close;W.openIdleRealisticCityV4=open;W.closeIdleRealisticCityV4=close;
W.psyIdleCityGoForest=goForest;
console.log('✅ PSYWORLD Psy Idle — Pallet V4 carregada (Pokémon = jogador; CC0, sem geração de imagens).');
})(window,document);
