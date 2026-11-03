/* PSYWORLD — KANTO PLAYTEST V2 (separate from public game).
 * Image-backed continuous exploration, authored collision geometry, buildings,
 * four accessible hunt zones, mobile touch controls, NPC quests and region gates.
 * Progress is namespaced to preview until online quest authority is implemented.
 */
(function(W,D){
'use strict';
if(W.PsyKantoWorldV2 || !W.PsyKantoMapDataV2)return;
const DATA=W.PsyKantoMapDataV2,KEY='psy_kanto_world_v2_quests',SAVE_KEY='psy_kanto_journey_progress_v1';
const $=s=>D.querySelector(s), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={root:null,canvas:null,ctx:null,world:null,inside:null,position:{x:597,y:555},lastOutdoor:null,held:new Set(),joy:null,touch:null,path:[],time:0,raf:0,stepDistance:0,lastEncounter:0,dialogOpen:false,images:new Map(),portrait:null,avatar:null,quest:null,walkFrame:0,facing:'down',suspended:false,navRequest:0,navCells:new Map(),viewport:null,lastRender:0};
function progress(){if(state.quest)return state.quest;try{state.quest=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(_){state.quest={}}return state.quest}
function putProgress(){try{localStorage.setItem(KEY,JSON.stringify(progress()))}catch(_){}try{W.autoSave?.()}catch(_){}}
function questDone(){const q=progress();return !!(q.oak&&q.center&&q.market&&q.guard)}
function mark(key){const q=progress();if(q[key])return;q[key]=true;putProgress();hud()}
function player(){try{return typeof P!=='undefined'?P:(W.P||{})}catch(_){return W.P||{}}}
function image(url){if(!url)return null;if(!state.images.has(url)){const o={loaded:false,im:new Image()};o.im.onload=()=>{if(url.startsWith('assets/characters/halloween/')){try{prepareAvatar(o)}catch(err){o.spriteError=true;console.warn('Trainer sprite could not be prepared',err)}}o.loaded=true;draw()};o.im.onerror=()=>{o.error=true};o.im.src=url;state.images.set(url,o)}return state.images.get(url)}
function makeUI(){if(state.root)return;const root=D.createElement('div');root.id='psy-kanto-world-v2';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
root.innerHTML='<header class="kw2-top"><button type="button" data-atlas>← ATLAS</button><div><strong class="kw2-title"></strong><small class="kw2-subtitle"></small></div><button type="button" class="kw2-close" aria-label="Fechar">×</button></header><div class="kw2-stage"><canvas aria-label="Mapa jogável com colisões"></canvas><div class="kw2-joystick"></div><section class="kw2-dialog"><div class="kw2-dialog-main"><img class="kw2-portrait" alt="Retrato do NPC"/><div><div class="kw2-dialog-title"></div><div class="kw2-expression"></div><div class="kw2-dialog-body"></div></div></div><div class="kw2-dialog-actions"></div></section></div><footer class="kw2-footer"><div class="kw2-objective"></div><div class="kw2-pad"><button data-dir="up" aria-label="Subir">▲</button><button data-dir="left" aria-label="Esquerda">◀</button><button data-dir="down" aria-label="Descer">▼</button><button data-dir="right" aria-label="Direita">▶</button></div><button class="kw2-interact" data-interact>INTERAGIR</button></footer>';
root.addEventListener('contextmenu',e=>e.preventDefault());
root.addEventListener('selectstart',e=>e.preventDefault());
root.addEventListener('dragstart',e=>e.preventDefault());
D.body.appendChild(root);state.root=root;state.canvas=root.querySelector('canvas');state.ctx=state.canvas.getContext('2d');
root.querySelector('[data-atlas]').onclick=()=>{close();W.openKantoJourneyV1?.()};root.querySelector('.kw2-close').onclick=close;root.querySelector('[data-interact]').onclick=interact;
root.querySelectorAll('[data-dir]').forEach(el=>{const dir=el.dataset.dir;const up=e=>{e.preventDefault();state.held.delete(dir)};el.addEventListener('pointerdown',e=>{e.preventDefault();state.path=[];state.navRequest++;state.held.add(dir);el.setPointerCapture?.(e.pointerId)});el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up)});
D.addEventListener('keydown',onKeyDown,true);D.addEventListener('keyup',onKeyUp,true);W.addEventListener('resize',()=>{state.viewport=null;draw()});W.visualViewport?.addEventListener?.('resize',()=>{state.viewport=null;draw()});
const stage=root.querySelector('.kw2-stage');stage.addEventListener('pointerdown',touchStart);stage.addEventListener('pointermove',touchMove);stage.addEventListener('pointerup',touchEnd);stage.addEventListener('pointercancel',touchEnd);
}
function showDialog(title,body,actions=[],portrait='',emote=''){const d=state.root.querySelector('.kw2-dialog');d.querySelector('.kw2-dialog-title').textContent=title;d.querySelector('.kw2-dialog-body').textContent=body;d.dataset.emotion=emote||'normal';d.querySelector('.kw2-expression').textContent='';
const im=d.querySelector('.kw2-portrait');im.style.display=portrait?'block':'none';if(portrait)im.src=portrait;
const box=d.querySelector('.kw2-dialog-actions');box.replaceChildren();const options=actions.length?actions:[{text:'CONTINUAR'}];options.forEach(a=>{const b=D.createElement('button');b.textContent=a.text;b.classList.toggle('primary',!!a.primary);b.onclick=()=>{d.classList.remove('open');state.dialogOpen=false;a.run?.();hud()};box.appendChild(b)});
d.classList.add('open');state.dialogOpen=true;state.path=[];state.held.clear();state.navRequest++;}
function hud(){
 if(!state.root)return;
 const q=progress(),where=state.inside;
 state.root.querySelector('.kw2-title').textContent=where?.title||state.world?.title||'Kanto';
 const subtitles={
  center:'Um refúgio para sua equipe',market:'Preparativos para a jornada',
  lab:'Descobertas e primeiros passos',home:'Um lugar para recomeçar',
  'house-east':'Histórias da vila','house-west':'Histórias à beira-mar'
 };
 state.root.querySelector('.kw2-subtitle').textContent=where?
   subtitles[where.id]||'Um lugar de Pallet Town':
   state.world?.id==='pallet'?'Sua primeira aventura começa aqui':
   'O caminho até Viridian City';
 let message='';
 if(state.world?.id==='pallet'){
   if(!q.oak)message='Jornada: visite o laboratório e converse com o Professor Carvalho.';
   else if(!q.center)message='Jornada: encontre a enfermeira no Centro Pokémon.';
   else if(!q.market)message='Jornada: procure o lojista no Poké Mart.';
   else if(!q.guard)message='Jornada: encontre o guarda no caminho norte de Pallet.';
   else message='A estrada está livre! Descubra os mistérios da Rota 1.';
 }else message='Rota 1: explore os campos de grama e siga para Viridian City.';
 state.root.querySelector('.kw2-objective').textContent=message;
}
function open(id,options={}){if(!['pallet','route-1'].includes(id))return false;
if(id==='route-1'&&!progress().guard&&!options.skipGuard){open('pallet');setTimeout(()=>showDialog('Rota 1 bloqueada','Primeiro fale com o guarda no norte de Pallet. Ele libera a viagem após a missão inicial.'),80);return false}
makeUI();D.getElementById('psy-kanto-world')?.classList.remove('open');D.body.classList.add('psy-kanto-v2-active');state.world=id==='pallet'?DATA.pallet:DATA.route1;state.inside=null;state.path=[];state.navRequest++;state.navCells=new Map();state.viewport=null;state.lastRender=0;state.held.clear();state.dialogOpen=false;state.root.querySelector('.kw2-dialog').classList.remove('open');
const start=options.spawn||state.world.spawn;state.position={x:start[0],y:start[1]};state.lastOutdoor=null;
image(state.world.art);D.getElementById('psy-kanto-atlas')?.classList.remove('open');state.root.classList.add('open');state.suspended=false;hud();draw();if(!state.raf){state.time=performance.now();state.raf=W.requestAnimationFrame(tick)}return true;}
function close(){state.navRequest++;state.navCells.clear();D.body.classList.remove('psy-kanto-v2-active');state.root?.classList.remove('open');state.path=[];state.held.clear();state.touch=null;state.joy=null;state.dialogOpen=false;state.suspended=false;const stick=state.root?.querySelector('.kw2-joystick');if(stick)stick.style.display='none';if(state.raf)W.cancelAnimationFrame(state.raf);state.raf=0}
function positionValid(x,y){if(state.inside)return x>60&&x<740&&y>164&&y<445&&!state.inside.blocks.some(([a,b,c,d])=>x>=a-6&&x<=c+6&&y>=b-6&&y<=d+6);
return DATA.walkable(state.world,x,y,5)}
function move(dx,dy,dt){if(state.dialogOpen||state.suspended||(!dx&&!dy))return;const mag=Math.hypot(dx,dy);dx/=mag;dy/=mag;const speed=state.inside?144:143,dist=speed*dt,steps=Math.ceil(dist/4.5);let mx=0,my=0;
for(let i=0;i<steps;i++){const stepx=dx*dist/steps,stepy=dy*dist/steps,p=state.position;
if(positionValid(p.x+stepx,p.y+stepy)){p.x+=stepx;p.y+=stepy;mx+=stepx;my+=stepy}else{if(positionValid(p.x+stepx,p.y)){p.x+=stepx;mx+=stepx}if(positionValid(p.x,p.y+stepy)){p.y+=stepy;my+=stepy}}}
if(Math.abs(mx)>Math.abs(my))state.facing=mx>0?'right':'left';else if(my)state.facing=my>0?'down':'up';if(Math.abs(mx)+Math.abs(my)>0.25){state.walkFrame+=dt*7;if(state.world?.id==='route-1'&&!state.inside){state.stepDistance+=Math.hypot(mx,my);if(state.stepDistance>=32){state.stepDistance=0;maybeEncounter()}}}}
function maybeEncounter(){if(!DATA.grassAt(state.world,state.position.x,state.position.y))return;if(performance.now()-state.lastEncounter<6000||Math.random()>.16)return;
const p=player();if(!Array.isArray(p.team)||!p.team.length){showDialog('Equipe necessária','Escolha seu primeiro Pokémon antes de procurar encontros.');return}
if(typeof W.triggerWild!=='function')return;state.lastEncounter=performance.now();state.suspended=true;state.root.classList.remove('open');const old=W.startBattle;
if(typeof old==='function')W.startBattle=function(wild){if(wild&&typeof wild==='object'){wild.level=1+Math.floor(Math.random()*3);wild.lvl=wild.level}return old.apply(this,arguments)};
try{W.triggerWild('kanto_normal_t1')}catch(e){console.warn('Rota 1 encounter',e);state.suspended=false;state.root.classList.add('open')}finally{if(typeof old==='function')W.startBattle=old}
if(state.suspended){const prev=W.endBattle;if(typeof prev==='function'&&!prev.__kw2){const wrapped=function(){const result=prev.apply(this,arguments);state.suspended=false;setTimeout(()=>{if(state.world){state.root.classList.add('open');draw();if(!state.raf){state.time=performance.now();state.raf=W.requestAnimationFrame(tick)}}},50);return result};wrapped.__kw2=true;W.endBattle=wrapped}}
}
function tick(now){if(!state.root?.classList.contains('open')){state.raf=0;return}const dt=Math.min(.12,Math.max(0,(now-state.time)/1000));state.time=now;
let dx=0,dy=0;for(const k of state.held){if(k==='up')dy--;if(k==='down')dy++;if(k==='left')dx--;if(k==='right')dx++}
if(state.joy){dx+=state.joy.x;dy+=state.joy.y}if(!dx&&!dy&&state.path.length){const dest=state.path[0],p=state.position,d=Math.hypot(dest[0]-p.x,dest[1]-p.y);if(d<7){state.path.shift()}else{dx=(dest[0]-p.x)/d;dy=(dest[1]-p.y)/d}}
if(dx||dy)move(dx,dy,dt);
const frameBudget=W.innerWidth<740?1000/48:1000/60;
if(now-state.lastRender>=frameBudget){draw();state.lastRender=now}
state.raf=W.requestAnimationFrame(tick)}
function onKeyDown(e){if(!state.root?.classList.contains('open'))return;const keys={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};if(keys[e.code]){e.preventDefault();e.stopImmediatePropagation();state.path=[];state.navRequest++;state.held.add(keys[e.code])}else if(['KeyE','Enter','Space'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)interact()}else if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}}
function onKeyUp(e){if(!state.root?.classList.contains('open'))return;const keys={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};if(keys[e.code]){e.preventDefault();e.stopImmediatePropagation();state.held.delete(keys[e.code])}}
function camera(){
  const map=state.inside?{w:800,h:470}:state.world,c=state.canvas,stage=state.root.querySelector('.kw2-stage');
  const r=state.viewport||(state.viewport=stage.getBoundingClientRect()),dpr=Math.min(1.3,W.devicePixelRatio||1);
  const cw=Math.max(260,Math.round(r.width*dpr)),ch=Math.max(180,Math.round(r.height*dpr));
  if(c.width!==cw||c.height!==ch){c.width=cw;c.height=ch}
  // Cover the screen instead of letterboxing; scroll with the player.
  const scale=Math.min(4,Math.max(cw/map.w,ch/map.h)*1.08);
  const viewW=cw/scale,viewH=ch/scale,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const cx=viewW>=map.w?map.w/2:clamp(state.position.x,viewW/2,map.w-viewW/2);
  const cy=viewH>=map.h?map.h/2:clamp(state.position.y,viewH/2,map.h-viewH/2);
  return {w:cw,h:ch,scale,ox:Math.round(cw/2-cx*scale),oy:Math.round(ch/2-cy*scale)};
}
function draw(){if(!state.root?.classList.contains('open')||!state.world)return;const c=state.ctx,view=camera();c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,view.w,view.h);c.fillStyle='#122e30';c.fillRect(0,0,view.w,view.h);c.setTransform(view.scale,0,0,view.scale,view.ox,view.oy);
if(state.inside){drawInterior(c,state.inside)}else{const o=image(state.world.art);if(o?.loaded){
    if(!o.mapCanvas||o.mapCanvas.width!==state.world.w||o.mapCanvas.height!==state.world.h){
      const flat=D.createElement('canvas');flat.width=state.world.w;flat.height=state.world.h;
      const fc=flat.getContext('2d');fc.imageSmoothingEnabled=true;
      fc.drawImage(o.im,0,0,flat.width,flat.height);o.mapCanvas=flat;
    }
    const sx=Math.max(0,-view.ox/view.scale),sy=Math.max(0,-view.oy/view.scale);
    const sw=Math.min(state.world.w-sx,view.w/view.scale),sh=Math.min(state.world.h-sy,view.h/view.scale);
    if(sw>0&&sh>0){c.imageSmoothingEnabled=true;c.drawImage(o.mapCanvas,sx,sy,sw,sh,sx,sy,sw,sh)}
  }else{c.fillStyle='#172b31';c.fillRect(0,0,state.world.w,state.world.h);c.fillStyle='#f5d28e';c.font='bold 20px system-ui';c.textAlign='center';c.fillText(o?.error?'ERRO: ARTE DO MAPA NÃO CARREGOU':'CARREGANDO ARTE DO MAPA...',state.world.w/2,state.world.h/2)}}
const things=state.inside?state.inside.npcs:(state.world.npcs||[]);things.forEach(npc=>{const distance=Math.hypot(npc.at[0]-state.position.x,npc.at[1]-state.position.y);drawNPC(c,npc,distance)});
if(!state.inside){state.world.doors.forEach(d=>{if(Math.hypot(d.at[0]-state.position.x,d.at[1]-state.position.y)<88)drawMarker(c,d.at[0],d.at[1],'ENTRAR','#79dced')});
if(Math.hypot(state.world.exit[0]-state.position.x,state.world.exit[1]-state.position.y)<105)drawMarker(c,state.world.exit[0],state.world.exit[1],state.world.id==='pallet'?'ROTA 1':'VIRIDIAN','#80ffaa')}
else drawMarker(c,400,410,'SAÍDA','#85efdc');
drawPlayer(c,state.position.x,state.position.y);c.setTransform(1,0,0,1,0,0)}
function drawMarker(c,x,y,label,color){c.save();c.fillStyle='#0b1726bb';c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(x,y-18,10,0,Math.PI*2);c.fill();c.stroke();c.fillStyle=color;c.font='bold 12px system-ui';c.textAlign='center';c.fillText('!',x,y-15);c.font='bold 11px system-ui';let w=Math.min(140,c.measureText(label).width+14);c.fillStyle='#0b182bdc';c.fillRect(x-w/2,y-48,w,17);c.fillStyle='#fff';c.fillText(label,x,y-35);c.restore()}
function drawNPC(c,npc,distance){
  const x=npc.at[0],y=npc.at[1],entry=image(npc.sprite||npc.portrait);
  c.save();
  c.fillStyle='#07101f99';c.beginPath();c.ellipse(x,y+4,14,5,0,0,Math.PI*2);c.fill();
  if(npc.painted){c.restore();return}
  if(entry?.loaded){
    c.shadowColor='#020617';c.shadowBlur=2;c.drawImage(entry.im,x-18,y-52,36,50);c.shadowBlur=0;
  }
  c.restore();
  if(distance<72){c.save();c.fillStyle=distance<48?'#8cf4bf':'#ffe2a0';c.strokeStyle='#1c2735';c.lineWidth=2;c.beginPath();c.arc(x,y-60,9,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#1a2435';c.textAlign='center';c.font='bold 12px system-ui';c.fillText('!',x,y-56);c.restore()}
}
// Preview accounts created before the trainer character picker do not always
// have playerCharacterId. Use a real supported trainer graphic, never a block
// placeholder. This is display-only: it does not mutate the player's save.
function selectedAvatar(){
  const p=player();
  const basics={
    black_boy:'basic-black-boy.webp',black_girl:'basic-black-girl.webp',
    gothic_boy:'basic-gothic-boy.webp',gothic_girl:'basic-gothic-girl.webp',
    adventure_boy:'basic-adventure-boy.webp',adventure_girl:'basic-adventure-girl.webp'
  };
  const id=p.playerCharacterId||p.trainerCharacterId||p.characterId||'adventure_boy';
  const c=(W.PsyHalloweenCharacters||[]).find(ch=>ch.id===id);
  const costumes=c?.costumes||{};
  const selected=p.playerCostumeByCharacter?.[id]||p.playerCostumeKey||'basic';
  const basic=costumes.basic||basics[id]||basics.adventure_boy;
  const wanted=costumes[selected]||basic;
  let entry=image('assets/characters/halloween/'+wanted);
  if(entry?.error&&wanted!==basic)entry=image('assets/characters/halloween/'+basic);
  if(entry?.error&&basic!==basics.adventure_boy)entry=image('assets/characters/halloween/'+basics.adventure_boy);
  return entry;
}
// Cached sprite atlas, prepared after the image finishes loading.
function prepareAvatar(entry){
  const walk=W.PsyTrainerWalkV1;
  if(walk){entry.atlas=walk.getAtlas(entry.im);entry.atlasTileW=walk.cellWidth;entry.atlasTileH=walk.cellHeight}
}
function drawPlayer(c,x,y){
  c.save();
  c.fillStyle='#0008';c.beginPath();c.ellipse(x,y+5,13,5,0,0,Math.PI*2);c.fill();
  const entry=selectedAvatar();let usedSprite=false;
  if(entry?.loaded){
    const row=({down:0,left:1,right:2,up:3})[state.facing]||0;
    const moving=state.held.size||state.path.length||state.joy;
    const col=W.PsyTrainerWalkV1?.column(Math.floor(state.walkFrame),moving)||0;
    c.imageSmoothingEnabled=true;
    if(entry.atlas&&W.PsyTrainerWalkV1){
      // Real player art, 48x64 cell, always anchored to the shadow.
      W.PsyTrainerWalkV1.draw(c,entry.atlas,row,col,x-24,y+7-64,48,64);
      usedSprite=true;
    }else if(entry.im?.naturalWidth&&entry.im?.naturalHeight){
      // Graphics still work if atlas preprocessing fails or an older profile loads.
      const sw=entry.im.naturalWidth/4,sh=entry.im.naturalHeight/4;
      c.drawImage(entry.im,col*sw+sw*.25,row*sh+sh*.22,sw*.5,sh*.58,
        x-16.5,y+7-46,33,46);
      usedSprite=true;
    }
  }
  // Never substitute a blocky test character while the real sheet loads.
  // The canvas redraws as soon as the trainer atlas becomes available.
  c.font='bold 12px system-ui';c.fillStyle='#fff';c.textAlign='center';
  c.shadowColor='#000';c.shadowBlur=4;
  c.fillText(player().name||'Treinador',x,y-59);c.restore();
}

function drawInterior(c,inside){
  const bg=image(inside.art||'assets/kanto/interiors/'+inside.id+'-v9.svg');
  if(bg?.loaded){
    c.imageSmoothingEnabled=true;
    c.drawImage(bg.im,0,0,800,470);
  }else{
    // The stage fades from its actual game-art palette as SVG loads.
    c.fillStyle='#374f60';c.fillRect(0,0,800,470);
  }
  // Only an exit floor marker; furniture, wall art and lighting belong to
  // the room illustration, never to debug rectangles on top of it.
  c.save();
  c.strokeStyle='#a9e2df';c.lineWidth=2;c.globalAlpha=.64;
  c.beginPath();c.moveTo(373,442);c.lineTo(427,442);c.stroke();
  c.restore();
}
function currentTargets(){if(state.inside)return [{type:'exit',at:state.inside.exit||[400,435]},...(state.inside.npcs||[]).map(n=>({type:'npc',at:n.at,ref:n}))];return [...(state.world.npcs||[]).map(n=>({type:'npc',at:n.at,ref:n})),...(state.world.doors||[]).map(d=>({type:'door',at:d.at,ref:d})),{type:'exit',at:state.world.exit}]}
function interact(){if(!state.root?.classList.contains('open')||state.dialogOpen)return;const targets=currentTargets().map(v=>({...v,d:Math.hypot(v.at[0]-state.position.x,v.at[1]-state.position.y)})).sort((a,b)=>a.d-b.d);const a=targets[0];if(!a||a.d>70){showDialog('Exploração','Aproxime-se das portas, dos moradores ou da saída. Toque no chão para caminhar ou arraste para usar o joystick.');return}
if(a.type==='door'){enterDoor(a.ref);return}if(a.type==='exit'){if(state.inside){exitDoor();return}exitWorld();return}talk(a.ref)}
function talk(npc){
 const id=npc.id,pr=npc.portrait||npc.sprite||'',em=npc.emote||'sereno';
 if(id==='oak'){
  mark('oak');
  showDialog('Professor Carvalho','Toda grande jornada começa com uma escolha. Em Pallet, conheça quem cuida dos Pokémon e quem prepara seus suprimentos. Depois, o guarda abrirá o caminho de Viridian.',[
   {text:'ENTENDI',primary:true}],pr,em);
 }else if(id==='gate'){
  const q=progress();
  if(!q.oak||!q.center||!q.market){
   const missing=[!q.oak?'o laboratório':'',!q.center?'o Centro Pokémon':'',!q.market?'o Poké Mart':''].filter(Boolean);
   showDialog('Guarda da Rota','Carvalho pediu que ninguém partisse sem preparo. Visite '+missing.join(', ')+'. Então a trilha estará livre.',[],pr,'atento');
  }else{
   mark('guard');
   showDialog('Guarda da Rota','Boa viagem! A Rota 1 está livre. Explore os quatro campos de caça e prossiga com cuidado até Viridian.',[
     {text:'SEGUIR PARA ROTA 1',primary:true,run:()=>open('route-1')},
     {text:'EXPLORAR PALLET'}],pr,'alegre');
  }
 }else if(id==='lia'){
  mark('lia');
  showDialog('Lia','Ouvi falar de histórias antigas no porto. Nina, na casa do lado leste, talvez saiba mais sobre aquela luz que surge ao anoitecer.',[],pr,'empolgada');
 }else if(id==='neighbor'||id==='child'){
  mark('neighbor');
  showDialog('Luna','Dizem que há marcas escondidas entre as flores da vila. O velho pescador Abel costuma contar como encontrá-las.',[],pr,'curiosa');
 }else if(id==='nurse'){
  mark('center');
  showDialog('Enfermeira Íris','Seus parceiros também precisam de descanso. Posso recuperar a energia da sua equipe antes da jornada?',[
   {text:'CURAR EQUIPE',primary:true,run:healTeam},{text:'AGORA NÃO'}],pr,'acolhedora');
 }else if(id==='vendor'){
  mark('market');
  showDialog('Davi, o lojista','O pessoal de Pallet começa sempre pelo básico: Poké Bolas, remédios e um pouco de coragem. Precisa de alguma coisa?',[
    {text:'VER MERCADORIAS',primary:true,run:openShop},{text:'VOLTAR'}],pr,'animado');
 }else if(id==='assistant'){
  showDialog('Pesquisadora Celina','Carvalho procura registros de habitats e fenômenos nas florestas de Kanto. Registre o que encontrar na Rota 1.',[],pr,'curiosa');
 }else if(id==='mother'){
  showDialog('Elisa','Preparei sua mochila e deixei a casa aberta. Quando sentir saudade, volte para descansar. O Professor Carvalho já está esperando você.',[],pr,'carinhosa');
 }else if(id==='fisher'){
  mark('fisher');
  showDialog('Seu Abel','Vi luzes no bosque depois da última chuva. Um dia, com as técnicas certas, você poderá alcançar lugares que hoje parecem impossíveis.',[],pr,'tranquilo');
 }else{
  showDialog(npc.name,'Pallet parece pequena, mas guarda histórias em cada esquina. Volte quando descobrir mais sobre Kanto.',[],pr,em);
 }
}
function enterDoor(door){
 state.navRequest++;state.navCells.clear();
 const id=door.id,room=W.PsyKantoInteriorsV9?.get?.(id);
 if(!room){
  showDialog('Porta fechada','Você ainda não pode entrar aqui.');return;
 }
 state.lastOutdoor={...state.position};
 state.inside={...room,title:door.title};
 state.position={x:room.spawn[0],y:room.spawn[1]};
 state.path=[];state.held.clear();
 image(room.art);room.npcs.forEach(n=>{image(n.sprite);if(n.portrait)image(n.portrait)});
 hud();draw();
 if(room.who){
  const actor=room.npcs.find(n=>n.id===room.who);
  showDialog(door.title,room.intro,[
   {text:'CONVERSAR',primary:true,run:()=>talk(actor)},
   {text:'EXPLORAR'}],
   actor?.portrait||'',actor?.emote||'sereno');
 }else showDialog(door.title,room.intro,[],null);
}
function exitDoor(){state.navRequest++;state.navCells.clear();state.inside=null;if(state.lastOutdoor)state.position={...state.lastOutdoor};state.lastOutdoor=null;state.path=[];hud()}
function healTeam(){const p=player();if(Array.isArray(p.team))for(const mon of p.team){const hp=Number(mon.maxHp||mon.maxHP||mon.hpMax||0);if(hp>0)mon.hp=hp}try{W.updateHUD?.();W.autoSave?.()}catch(_){}showDialog('Enfermeira','Sua equipe foi recuperada. Boa viagem!')}
function openShop(){const fn=W.openShop;close();if(typeof fn==='function')fn();else{state.root?.classList.add('open');showDialog('Davi, o lojista','Minhas mercadorias já estão separadas. Em breve você poderá negociá-las aqui mesmo.')}}
function exitWorld(){if(state.world.id==='pallet'){if(!questDone()){showDialog('Passagem para Rota 1','A saída está fechada até o guarda autorizar a viagem. Fale com Carvalho e visite Centro Pokémon e Market.',[{text:'ENTENDI'}]);return}open('route-1');return}
mark('viridian');try{const save=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');save.visited=[...new Set([...(save.visited||[]),'pallet','route-1'])];save.activePlace='viridian';localStorage.setItem(SAVE_KEY,JSON.stringify(save))}catch(_){}
showDialog('Viridian City','Você atravessou a Rota 1! A entrada de Viridian está desbloqueada. A cidade usará o mapa de desenvolvimento já existente enquanto recebe sua própria arte.',[{text:'ENTRAR EM VIRIDIAN',primary:true,run:()=>{close();W.PsyKantoPlayableV1?.open?.('viridian')}},{text:'VOLTAR'}]);}
function touchCoords(e){const r=state.canvas.getBoundingClientRect();const cam=camera();return {x:(e.clientX-r.left)*(cam.w/r.width)/cam.scale-cam.ox/cam.scale,y:(e.clientY-r.top)*(cam.h/r.height)/cam.scale-cam.oy/cam.scale}}
function touchStart(e){if(e.target!==state.canvas||state.dialogOpen)return;e.preventDefault();const t=touchCoords(e);state.touch={id:e.pointerId,x:e.clientX,y:e.clientY,tx:t.x,ty:t.y,t:performance.now(),drag:false,rect:state.canvas.getBoundingClientRect()};state.navRequest++;state.canvas.setPointerCapture?.(e.pointerId);state.path=[]}
function touchMove(e){const t=state.touch;if(!t||t.id!==e.pointerId)return;e.preventDefault();const dx=e.clientX-t.x,dy=e.clientY-t.y;if(Math.hypot(dx,dy)>8)t.drag=true;if(t.drag){const d=Math.max(1,Math.hypot(dx,dy));state.joy={x:dx/Math.max(25,d),y:dy/Math.max(25,d)};const stick=state.root.querySelector('.kw2-joystick'),r=t.rect;stick.style.left=(t.x-r.left)+'px';stick.style.top=(t.y-r.top)+'px';stick.style.display='block';stick.style.setProperty('--jx',Math.round(Math.min(30,dx/d*30))+'px');stick.style.setProperty('--jy',Math.round(Math.min(30,dy/d*30))+'px')}}
function touchEnd(e){const t=state.touch;if(!t||t.id!==e.pointerId)return;e.preventDefault();state.joy=null;state.touch=null;state.root.querySelector('.kw2-joystick').style.display='none';if(!t.drag){const near=currentTargets().find(v=>Math.hypot(v.at[0]-t.tx,v.at[1]-t.ty)<30&&Math.hypot(v.at[0]-state.position.x,v.at[1]-state.position.y)<70);if(near){interact();return}const request=++state.navRequest;findPath([state.position.x,state.position.y],[t.tx,t.ty],request).then(path=>{if(request===state.navRequest&&state.root?.classList.contains('open'))state.path=path})}}
// Tap-to-walk searches asynchronously, yielding control to the game each frame.
// Terrain queries are memoized per location; dragging joystick cancels old searches.
function findPath(from,to,request){
  const step=10,world=state.inside?{w:800,h:470}:state.world;
  const nx=Math.ceil(world.w/step),ny=Math.ceil(world.h/step);
  const key=(x,y)=>x+','+y,cx=x=>Math.round(x/step);
  const valid=(x,y)=>{
    if(x<0||y<0||x>=nx||y>=ny)return false;
    const k=key(x,y);if(state.navCells.has(k))return state.navCells.get(k);
    const ok=positionValid(x*step,y*step);
    state.navCells.set(k,ok);return ok;
  };
  const straight=(x1,y1,x2,y2)=>{
    const d=Math.hypot(x2-x1,y2-y1),parts=Math.ceil(d/6);
    for(let j=1;j<=parts;j++){const t=j/parts;if(!positionValid(x1+(x2-x1)*t,y1+(y2-y1)*t))return false}
    return true;
  };
  if(positionValid(to[0],to[1])&&straight(from[0],from[1],to[0],to[1]))
    return Promise.resolve([[to[0],to[1]]]);
  let ax=cx(from[0]),ay=cx(from[1]),bx=cx(to[0]),by=cx(to[1]);
  if(!valid(ax,ay)){
    let nearest=null;
    for(let r=1;r<=3&&!nearest;r++)for(let yy=-r;yy<=r&&!nearest;yy++)
      for(let xx=-r;xx<=r;xx++)if(valid(ax+xx,ay+yy)){nearest=[ax+xx,ay+yy];break}
    if(!nearest)return Promise.resolve([]);[ax,ay]=nearest;
  }
  if(!valid(bx,by)){
    let nearest=null,score=Infinity;
    for(let r=1;r<=9&&!nearest;r++)for(let yy=-r;yy<=r;yy++)for(let xx=-r;xx<=r;xx++){
      if(Math.abs(xx)!==r&&Math.abs(yy)!==r)continue;
      if(!valid(bx+xx,by+yy))continue;
      const scoreNow=xx*xx+yy*yy;
      if(scoreNow<score){nearest=[bx+xx,by+yy];score=scoreNow}
    }
    if(!nearest)return Promise.resolve([]);[bx,by]=nearest;
  }
  const origin=key(ax,ay),target=key(bx,by),best=new Map([[origin,0]]),previous=new Map();
  const heap=[],heuristic=(x,y)=>Math.hypot(bx-x,by-y);
  const push=item=>{let i=heap.length;heap.push(item);while(i>0){const p=(i-1)>>1;if(heap[p].f<=item.f)break;heap[i]=heap[p];i=p}heap[i]=item};
  const pop=()=>{const v=heap[0],last=heap.pop();if(heap.length){let i=0;while(true){let c=i*2+1;if(c>=heap.length)break;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=last.f)break;heap[i]=heap[c];i=c}heap[i]=last}return v};
  push({x:ax,y:ay,g:0,f:heuristic(ax,ay)});
  return new Promise(resolve=>{
    let count=0;
    function slice(){
      if(request!==state.navRequest||!state.root?.classList.contains('open'))return resolve([]);
      let processed=0;
      while(heap.length&&processed++<75&&count++<6000){
        const current=pop(),k=key(current.x,current.y);
        if(current.g>best.get(k)+.001)continue;
        if(k===target){
          const nodes=[];let n=k;
          while(n!==origin){const xy=n.split(',').map(Number);nodes.push([xy[0]*step,xy[1]*step]);n=previous.get(n);if(!n)return resolve([])}
          nodes.reverse();
          // Collapse only visible segments, preserving accurate wall collisions.
          const route=[],path=[from,...nodes];
          let index=0;
          while(index<path.length-1){
            let next=Math.min(path.length-1,index+18);
            while(next>index+1&&!straight(path[index][0],path[index][1],path[next][0],path[next][1]))next--;
            route.push(path[next]);index=next;
          }
          return resolve(route);
        }
        for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]){
          const x=current.x+dx,y=current.y+dy;
          if(!valid(x,y))continue;
          if(dx&&dy&&(!valid(current.x+dx,current.y)||!valid(current.x,current.y+dy)))continue;
          const g=current.g+(dx&&dy?1.41421356237:1),nk=key(x,y);
          if(g>=(best.get(nk)??Infinity))continue;
          best.set(nk,g);previous.set(nk,k);
          push({x,y,g,f:g+heuristic(x,y)});
        }
      }
      if(!heap.length||count>=6000)return resolve([]);
      W.requestAnimationFrame(slice);
    }
    slice();
  });
}
W.PsyKantoWorldV2={open,close,data:DATA,progress,walkable:(id,x,y)=>DATA.walkable(id==='pallet'?DATA.pallet:DATA.route1,x,y),getPosition:()=>({world:state.world?.id,inside:state.inside?.id||null,x:state.position.x,y:state.position.y})};
// Capture Atlas entry before any legacy canvas handler; also works after Atlas rerenders.
D.addEventListener('click',e=>{
  const button=e.target?.closest?.('#psy-kanto-atlas .psy-kanto-enter-world');
  if(!button)return;
  const title=button.closest('.psy-kanto-detail')?.querySelector('h3')?.textContent?.trim();
  const place=W.PsyKantoJourneyV1?.places?.find(p=>p.name===title);
  if(place?.id!=='pallet'&&place?.id!=='route-1')return;
  e.preventDefault();e.stopImmediatePropagation();
  open(place.id);
},true);

})(window,document);