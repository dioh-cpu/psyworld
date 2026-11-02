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
const state={root:null,canvas:null,ctx:null,world:null,inside:null,position:{x:597,y:555},lastOutdoor:null,held:new Set(),joy:null,touch:null,path:[],time:0,raf:0,stepDistance:0,lastEncounter:0,dialogOpen:false,images:new Map(),portrait:null,avatar:null,quest:null,walkFrame:0,facing:'down',suspended:false};
function progress(){if(state.quest)return state.quest;try{state.quest=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(_){state.quest={}}return state.quest}
function putProgress(){try{localStorage.setItem(KEY,JSON.stringify(progress()))}catch(_){}try{W.autoSave?.()}catch(_){}}
function questDone(){const q=progress();return !!(q.oak&&q.center&&q.market&&q.guard)}
function mark(key){const q=progress();if(q[key])return;q[key]=true;putProgress();hud()}
function player(){try{return typeof P!=='undefined'?P:(W.P||{})}catch(_){return W.P||{}}}
function image(url){if(!url)return null;if(!state.images.has(url)){const o={loaded:false,im:new Image()};o.im.onload=()=>{o.loaded=true;draw()};o.im.onerror=()=>{o.error=true};o.im.src=url;state.images.set(url,o)}return state.images.get(url)}
function makeUI(){if(state.root)return;const root=D.createElement('div');root.id='psy-kanto-world-v2';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
root.innerHTML='<header class="kw2-top"><button type="button" data-atlas>← ATLAS</button><div><strong class="kw2-title"></strong><small class="kw2-subtitle"></small></div><button type="button" class="kw2-close" aria-label="Fechar">×</button></header><div class="kw2-stage"><canvas aria-label="Mapa jogável com colisões"></canvas><div class="kw2-mode">PREVIEW · KANTO V2</div><div class="kw2-joystick"></div><section class="kw2-dialog"><div class="kw2-dialog-main"><img class="kw2-portrait" alt="Retrato do NPC"/><div><div class="kw2-dialog-title"></div><div class="kw2-expression"></div><div class="kw2-dialog-body"></div></div></div><div class="kw2-dialog-actions"></div></section></div><footer class="kw2-footer"><div class="kw2-objective"></div><div class="kw2-pad"><button data-dir="up" aria-label="Subir">▲</button><button data-dir="left" aria-label="Esquerda">◀</button><button data-dir="down" aria-label="Descer">▼</button><button data-dir="right" aria-label="Direita">▶</button></div><button class="kw2-interact" data-interact>INTERAGIR</button></footer>';
D.body.appendChild(root);state.root=root;state.canvas=root.querySelector('canvas');state.ctx=state.canvas.getContext('2d');
root.querySelector('[data-atlas]').onclick=()=>{close();W.openKantoJourneyV1?.()};root.querySelector('.kw2-close').onclick=close;root.querySelector('[data-interact]').onclick=interact;
root.querySelectorAll('[data-dir]').forEach(el=>{const dir=el.dataset.dir;const up=e=>{e.preventDefault();state.held.delete(dir)};el.addEventListener('pointerdown',e=>{e.preventDefault();state.path=[];state.held.add(dir);el.setPointerCapture?.(e.pointerId)});el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up)});
D.addEventListener('keydown',onKeyDown,true);D.addEventListener('keyup',onKeyUp,true);W.addEventListener('resize',draw);
const stage=root.querySelector('.kw2-stage');stage.addEventListener('pointerdown',touchStart);stage.addEventListener('pointermove',touchMove);stage.addEventListener('pointerup',touchEnd);stage.addEventListener('pointercancel',touchEnd);
}
function showDialog(title,body,actions=[],portrait='',emote=''){const d=state.root.querySelector('.kw2-dialog');d.querySelector('.kw2-dialog-title').textContent=title;d.querySelector('.kw2-dialog-body').textContent=body;d.querySelector('.kw2-expression').textContent=emote?('EXPRESSÃO · '+emote.toUpperCase()):'';
const im=d.querySelector('.kw2-portrait');im.style.display=portrait?'block':'none';if(portrait)im.src=portrait;
const box=d.querySelector('.kw2-dialog-actions');box.replaceChildren();const options=actions.length?actions:[{text:'CONTINUAR'}];options.forEach(a=>{const b=D.createElement('button');b.textContent=a.text;b.classList.toggle('primary',!!a.primary);b.onclick=()=>{d.classList.remove('open');state.dialogOpen=false;a.run?.();hud()};box.appendChild(b)});
d.classList.add('open');state.dialogOpen=true;state.path=[];state.held.clear();}
function hud(){if(!state.root)return;const q=progress();const title=state.inside?state.inside.title:state.world?.title||'';state.root.querySelector('.kw2-title').textContent=title;
state.root.querySelector('.kw2-subtitle').textContent=state.inside?'Portas funcionais · pressione INTERAGIR perto da saída':state.world?.id==='pallet'?'Explore Pallet e receba a autorização para a Rota 1':'Quatro campos de caça · níveis 1 a 3';
let info='';if(state.world?.id==='pallet')info=`Missão de Pallet: Carvalho ${q.oak?'✓':'◻'} · Centro ${q.center?'✓':'◻'} · Market ${q.market?'✓':'◻'} · Guarda ${q.guard?'✓':'◻'}`;else info='Rota 1 · 4 campos acessíveis · siga ao norte para Viridian · encontros Lv.1–3';
state.root.querySelector('.kw2-objective').textContent=info;
}
function open(id,options={}){if(!['pallet','route-1'].includes(id))return false;
if(id==='route-1'&&!progress().guard&&!options.skipGuard){open('pallet');setTimeout(()=>showDialog('Rota 1 bloqueada','Primeiro fale com o guarda no norte de Pallet. Ele libera a viagem após a missão inicial.'),80);return false}
makeUI();D.getElementById('psy-kanto-world')?.classList.remove('open');D.body.classList.add('psy-kanto-v2-active');state.world=id==='pallet'?DATA.pallet:DATA.route1;state.inside=null;state.path=[];state.held.clear();state.dialogOpen=false;state.root.querySelector('.kw2-dialog').classList.remove('open');
const start=options.spawn||state.world.spawn;state.position={x:start[0],y:start[1]};state.lastOutdoor=null;
image(state.world.art);D.getElementById('psy-kanto-atlas')?.classList.remove('open');state.root.classList.add('open');state.suspended=false;hud();draw();if(!state.raf){state.time=performance.now();state.raf=W.requestAnimationFrame(tick)}return true;}
function close(){D.body.classList.remove('psy-kanto-v2-active');state.root?.classList.remove('open');state.path=[];state.held.clear();state.touch=null;state.joy=null;state.dialogOpen=false;state.suspended=false;const stick=state.root?.querySelector('.kw2-joystick');if(stick)stick.style.display='none';if(state.raf)W.cancelAnimationFrame(state.raf);state.raf=0}
function positionValid(x,y){if(state.inside)return x>65&&x<735&&y>84&&y<426&&!state.inside.blocks.some(([a,b,c,d])=>x>=a&&x<=c&&y>=b&&y<=d);
return DATA.walkable(state.world,x,y,5)}
function move(dx,dy,dt){if(state.dialogOpen||state.suspended||(!dx&&!dy))return;const mag=Math.hypot(dx,dy);dx/=mag;dy/=mag;const speed=state.inside?132:116,dist=speed*dt,steps=Math.ceil(dist/5);let mx=0,my=0;
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
function tick(now){if(!state.root?.classList.contains('open')){state.raf=0;return}const dt=Math.min(.04,Math.max(0,(now-state.time)/1000));state.time=now;
let dx=0,dy=0;for(const k of state.held){if(k==='up')dy--;if(k==='down')dy++;if(k==='left')dx--;if(k==='right')dx++}
if(state.joy){dx+=state.joy.x;dy+=state.joy.y}if(!dx&&!dy&&state.path.length){const dest=state.path[0],p=state.position,d=Math.hypot(dest[0]-p.x,dest[1]-p.y);if(d<9)state.path.shift();else{dx=(dest[0]-p.x)/d;dy=(dest[1]-p.y)/d}}
if(dx||dy)move(dx,dy,dt);draw();state.raf=W.requestAnimationFrame(tick)}
function onKeyDown(e){if(!state.root?.classList.contains('open'))return;const keys={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};if(keys[e.code]){e.preventDefault();e.stopImmediatePropagation();state.path=[];state.held.add(keys[e.code])}else if(['KeyE','Enter','Space'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)interact()}else if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}}
function onKeyUp(e){if(!state.root?.classList.contains('open'))return;const keys={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};if(keys[e.code]){e.preventDefault();e.stopImmediatePropagation();state.held.delete(keys[e.code])}}
function camera(){
  const map=state.inside?{w:800,h:470}:state.world,c=state.canvas,stage=state.root.querySelector('.kw2-stage');
  const r=stage.getBoundingClientRect(),dpr=Math.min(2,W.devicePixelRatio||1);
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
if(state.inside){drawInterior(c,state.inside)}else{const o=image(state.world.art);if(o?.loaded){c.imageSmoothingEnabled=true;c.drawImage(o.im,0,0,state.world.w,state.world.h)}else{c.fillStyle='#172b31';c.fillRect(0,0,state.world.w,state.world.h);c.fillStyle='#f5d28e';c.font='bold 20px system-ui';c.textAlign='center';c.fillText(o?.error?'ERRO: ARTE DO MAPA NÃO CARREGOU':'CARREGANDO ARTE DO MAPA...',state.world.w/2,state.world.h/2)}}
const things=state.inside?state.inside.npcs:(state.world.npcs||[]);things.forEach(npc=>{const distance=Math.hypot(npc.at[0]-state.position.x,npc.at[1]-state.position.y);drawMarker(c,npc.at[0],npc.at[1],npc.name,distance<60?'#80ffcb':'#ffd98a')});
if(!state.inside){state.world.doors.forEach(d=>{if(Math.hypot(d.at[0]-state.position.x,d.at[1]-state.position.y)<88)drawMarker(c,d.at[0],d.at[1],'ENTRAR','#79dced')});
if(Math.hypot(state.world.exit[0]-state.position.x,state.world.exit[1]-state.position.y)<105)drawMarker(c,state.world.exit[0],state.world.exit[1],state.world.id==='pallet'?'ROTA 1':'VIRIDIAN','#80ffaa')}
else drawMarker(c,400,410,'SAÍDA','#85efdc');
drawPlayer(c,state.position.x,state.position.y);c.setTransform(1,0,0,1,0,0)}
function drawMarker(c,x,y,label,color){c.save();c.fillStyle='#0b1726bb';c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(x,y-18,10,0,Math.PI*2);c.fill();c.stroke();c.fillStyle=color;c.font='bold 12px system-ui';c.textAlign='center';c.fillText('!',x,y-15);c.font='bold 11px system-ui';let w=Math.min(140,c.measureText(label).width+14);c.fillStyle='#0b182bdc';c.fillRect(x-w/2,y-48,w,17);c.fillStyle='#fff';c.fillText(label,x,y-35);c.restore()}
function selectedAvatar(){const p=player(),id=p.playerCharacterId;
  const character=(W.PsyHalloweenCharacters||[]).find(c=>c.id===id);
  if(!character)return null;
  const costumes=character.costumes||{},key=(p.playerCostumeByCharacter||{})[id];
  const file=costumes[key]||costumes.basic;if(!file)return null;
  return image('assets/characters/halloween/'+file);
}
function avatarBounds(entry,row,col){
  entry.bounds=entry.bounds||{};const index=row*4+col;if(entry.bounds[index])return entry.bounds[index];
  const im=entry.im,cellX=Math.floor(im.naturalWidth/4),cellY=Math.floor(im.naturalHeight/4);
  if(!cellX||!cellY)return null;
  try{const scan=D.createElement('canvas');scan.width=cellX;scan.height=cellY;
    const sc=scan.getContext('2d',{willReadFrequently:true});sc.drawImage(im,col*cellX,row*cellY,cellX,cellY,0,0,cellX,cellY);
    const pixels=sc.getImageData(0,0,cellX,cellY).data;
    let minX=cellX,minY=cellY,maxX=-1,maxY=-1;
    for(let j=0;j<cellY;j++)for(let i=0;i<cellX;i++)if(pixels[(j*cellX+i)*4+3]>30){
      minX=Math.min(minX,i);minY=Math.min(minY,j);maxX=Math.max(maxX,i);maxY=Math.max(maxY,j)}
    const b=maxX>=minX?{x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1}:{x:0,y:0,w:cellX,h:cellY};
    entry.bounds[index]=b;return b
  }catch(_){return {x:0,y:0,w:cellX,h:cellY}}
}
function drawPlayer(c,x,y){c.save();c.fillStyle='#0008';c.beginPath();c.ellipse(x,y+5,13,5,0,0,Math.PI*2);c.fill();
  const entry=selectedAvatar();let usedSprite=false;
  if(entry?.loaded){const row=({down:0,left:1,right:2,up:3})[state.facing]||0;
    const moving=state.held.size||state.path.length||state.joy;
    const col=moving?(Math.floor(state.walkFrame)%2?3:1):0,b=avatarBounds(entry,row,col);
    if(b){const cx=Math.floor(entry.im.naturalWidth/4),cy=Math.floor(entry.im.naturalHeight/4),scale=Math.min(34/b.w,49/b.h);
      const w=b.w*scale,h=b.h*scale;c.drawImage(entry.im,col*cx+b.x,row*cy+b.y,b.w,b.h,x-w/2,y+7-h,w,h);usedSprite=true}}
  if(!usedSprite){const f=Math.sin(state.walkFrame*2)*1.4;
    c.fillStyle='#f0f5f4';c.fillRect(x-9,y-13+f,7,16);c.fillRect(x+2,y-13-f,7,16);
    c.fillStyle='#24517a';c.fillRect(x-11,y-30,22,21);c.fillStyle='#e4b68f';c.beginPath();c.arc(x,y-38,10,0,Math.PI*2);c.fill();
    c.fillStyle='#273040';c.beginPath();c.arc(x,y-43,11,Math.PI,Math.PI*2);c.fill();c.fillStyle='#b33540';c.fillRect(x-9,y-29,6,12);c.fillRect(x+5,y-29,6,12)}
  c.font='bold 12px system-ui';c.fillStyle='#fff';c.textAlign='center';c.shadowColor='#000';c.shadowBlur=4;c.fillText(player().name||'Treinador',x,y-59);c.restore()}

function drawInterior(c,inside){c.fillStyle='#2a3b46';c.fillRect(0,0,800,470);c.fillStyle='#bea47b';c.fillRect(70,75,660,355);c.strokeStyle='#e9d3a2';c.lineWidth=4;for(let y=95;y<426;y+=35){c.beginPath();c.moveTo(72,y);c.lineTo(728,y);c.stroke()}c.fillStyle='#426a6d';c.fillRect(70,74,660,38);
const decor={center:['#e6eefa','✚', '#d97580'],market:['#d5e6fd','▤','#4376ac'],home:['#ead3ba','⌂','#995e43'],'house-east':['#decaba','⌂','#79624a'],'house-west':['#e3c2b2','⌂','#73584d'],lab:['#cedce9','⚗','#4f708e']};const d=decor[inside.id]||decor.home;
c.fillStyle=d[0];c.fillRect(100,110,600,70);c.fillStyle=d[2];c.fillRect(105,117,590,6);c.font='bold 28px system-ui';c.textAlign='center';c.fillStyle='#203e54';c.fillText(inside.title,400,156);c.fillStyle='#73583d';c.fillRect(100,230,165,100);c.fillRect(535,230,165,100);
c.fillStyle='#ded5c1';c.fillRect(110,240,145,78);c.fillRect(545,240,145,78);c.fillStyle='#ffffffbb';c.fillRect(372,418,55,25);c.fillStyle='#1d3b40';c.font='bold 14px system-ui';c.fillText('SAÍDA',400,448)}
function currentTargets(){if(state.inside)return [{type:'exit',at:[400,410]},...(state.inside.npcs||[]).map(n=>({type:'npc',at:n.at,ref:n}))];return [...(state.world.npcs||[]).map(n=>({type:'npc',at:n.at,ref:n})),...(state.world.doors||[]).map(d=>({type:'door',at:d.at,ref:d})),{type:'exit',at:state.world.exit}]}
function interact(){if(!state.root?.classList.contains('open')||state.dialogOpen)return;const targets=currentTargets().map(v=>({...v,d:Math.hypot(v.at[0]-state.position.x,v.at[1]-state.position.y)})).sort((a,b)=>a.d-b.d);const a=targets[0];if(!a||a.d>70){showDialog('Exploração','Aproxime-se das portas, dos moradores ou da saída. Toque no chão para caminhar ou arraste para usar o joystick.');return}
if(a.type==='door'){enterDoor(a.ref);return}if(a.type==='exit'){if(state.inside){exitDoor();return}exitWorld();return}talk(a.ref)}
function talk(npc){const id=npc.id,pr=npc.portrait||'',em=npc.emote||'sereno';if(id==='oak'){mark('oak');showDialog('Professor Carvalho','A jornada começa com curiosidade. Visite o Centro Pokémon e o Poké Mart antes de pedir ao guarda a passagem para a Rota 1.',[{text:'ENTENDI',primary:true}],pr,em)}
else if(id==='gate'){const q=progress();if(!q.oak||!q.center||!q.market){showDialog('Guarda da Rota',`Para seguir até Viridian, complete as orientações de Carvalho. Falta: ${[!q.oak?'Carvalho':'',!q.center?'Centro':'',!q.market?'Market':''].filter(Boolean).join(', ')}.`,[],pr,'atento')}else{mark('guard');showDialog('Guarda da Rota','Tudo certo! O caminho ao norte está liberado. A Rota 1 tem quatro campos de grama; os encontros vão até o nível 3.',[{text:'SEGUIR PARA ROTA 1',primary:true,run:()=>open('route-1')},{text:'EXPLORAR PALLET'}],pr,'alegre')}}
else if(id==='lia'){mark('lia');showDialog('Lia','Missão secundária: encontre Nina perto da casa oeste. Explore as ruas e repare como cada obstáculo impede a passagem.',[],pr,'empolgada')}
else if(id==='neighbor'){mark('neighbor');showDialog('Nina','Você encontrou minha casa! As portas se abrem com INTERAGIR, mas paredes e cercas não podem ser atravessadas.',[],pr,'feliz')}
else if(id==='route-guide'){showDialog('Exploradora Nara','Há quatro espaços de caça nesta rota. Todos são acessíveis pelo caminho principal. Não se esqueça: nível máximo 3.',[],pr,'curiosa')}
else if(id==='nurse'){showDialog('Enfermeira', 'Quer recuperar a energia dos seus Pokémon?', [{text:'CURAR TIME',primary:true,run:healTeam},{text:'AGORA NÃO'}],pr,'acolhedora')}
else if(id==='vendor'){showDialog('Atendente', 'Bem-vindo ao Poké Mart! Produtos para a jornada e suprimentos de viagem.', [{text:'ABRIR LOJA',primary:true,run:openShop},{text:'VOLTAR'}],pr,'animado')}
else if(id==='assistant'){showDialog('Assistente do Laboratório','O professor está estudando os habitats da região. Registre os Pokémon da Rota 1 e volte depois.',[],pr,'curioso')}
else showDialog(npc.name,'Que bom conhecer mais um treinador nesta cidade!',[],pr,em)}
function enterDoor(door){const id=door.id;state.lastOutdoor={...state.position};state.inside={id,title:door.title,blocks:[[80,76,720,95],[110,235,255,315],[545,235,690,315]],npcs:[]};state.position={x:400,y:384};state.path=[];
if(id==='center'){mark('center');state.inside.npcs.push({id:'nurse',name:'Enfermeira',at:[400,215],portrait:'assets/halloween/npc-mina.svg',emote:'acolhedora'});showDialog('Centro Pokémon','Bem-vindo! Aqui você pode curar sua equipe. O atendimento também conta como etapa da missão inicial.')}
else if(id==='market'){mark('market');state.inside.npcs.push({id:'vendor',name:'Atendente',at:[400,215],portrait:'assets/halloween/npc-vendor.webp',emote:'animado'});showDialog('Poké Mart','Bem-vindo ao mercado! Converse com o atendente para abrir a loja.')}
else if(id==='lab'){mark('oak');state.inside.npcs.push({id:'assistant',name:'Assistente',at:[400,215],portrait:'assets/halloween/npc-researcher.webp',emote:'curioso'});showDialog('Laboratório','Você chegou ao laboratório de pesquisa de Pallet.')}
else if(id==='home')showDialog('Sua Casa','Um espaço seguro para descansar antes de começar a aventura.');else showDialog(door.title,'Um interior acessível, com colisões para os móveis e saída pela porta.');hud()}
function exitDoor(){state.inside=null;if(state.lastOutdoor)state.position={...state.lastOutdoor};state.lastOutdoor=null;state.path=[];hud()}
function healTeam(){const p=player();if(Array.isArray(p.team))for(const mon of p.team){const hp=Number(mon.maxHp||mon.maxHP||mon.hpMax||0);if(hp>0)mon.hp=hp}try{W.updateHUD?.();W.autoSave?.()}catch(_){}showDialog('Enfermeira','Sua equipe foi recuperada. Boa viagem!')}
function openShop(){const fn=W.openShop;close();if(typeof fn==='function')fn();else showDialog('Poké Mart','O catálogo da loja ainda não foi vinculado a esta versão de testes.')}
function exitWorld(){if(state.world.id==='pallet'){if(!questDone()){showDialog('Passagem para Rota 1','A saída está fechada até o guarda autorizar a viagem. Fale com Carvalho e visite Centro Pokémon e Market.',[{text:'ENTENDI'}]);return}open('route-1');return}
mark('viridian');try{const save=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');save.visited=[...new Set([...(save.visited||[]),'pallet','route-1'])];save.activePlace='viridian';localStorage.setItem(SAVE_KEY,JSON.stringify(save))}catch(_){}
showDialog('Viridian City','Você atravessou a Rota 1! A entrada de Viridian está desbloqueada. A cidade usará o mapa de desenvolvimento já existente enquanto recebe sua própria arte.',[{text:'ENTRAR EM VIRIDIAN',primary:true,run:()=>{close();W.PsyKantoPlayableV1?.open?.('viridian')}},{text:'VOLTAR'}]);}
function touchCoords(e){const r=state.canvas.getBoundingClientRect();const cam=camera();return {x:(e.clientX-r.left)*(cam.w/r.width)/cam.scale-cam.ox/cam.scale,y:(e.clientY-r.top)*(cam.h/r.height)/cam.scale-cam.oy/cam.scale}}
function touchStart(e){if(e.target!==state.canvas||state.dialogOpen)return;e.preventDefault();const t=touchCoords(e);state.touch={id:e.pointerId,x:e.clientX,y:e.clientY,tx:t.x,ty:t.y,t:performance.now(),drag:false};state.canvas.setPointerCapture?.(e.pointerId);state.path=[]}
function touchMove(e){const t=state.touch;if(!t||t.id!==e.pointerId)return;e.preventDefault();const dx=e.clientX-t.x,dy=e.clientY-t.y;if(Math.hypot(dx,dy)>11)t.drag=true;if(t.drag){const d=Math.max(1,Math.hypot(dx,dy));state.joy={x:dx/Math.max(35,d),y:dy/Math.max(35,d)};const stick=state.root.querySelector('.kw2-joystick'),r=state.canvas.getBoundingClientRect();stick.style.left=(t.x-r.left)+'px';stick.style.top=(t.y-r.top)+'px';stick.style.display='block';stick.style.setProperty('--jx',Math.round(Math.min(30,dx/d*30))+'px');stick.style.setProperty('--jy',Math.round(Math.min(30,dy/d*30))+'px')}}
function touchEnd(e){const t=state.touch;if(!t||t.id!==e.pointerId)return;e.preventDefault();state.joy=null;state.touch=null;state.root.querySelector('.kw2-joystick').style.display='none';if(!t.drag){const near=currentTargets().find(v=>Math.hypot(v.at[0]-t.tx,v.at[1]-t.ty)<30&&Math.hypot(v.at[0]-state.position.x,v.at[1]-state.position.y)<70);if(near){interact();return}state.path=findPath([state.position.x,state.position.y],[t.tx,t.ty])}}
function findPath(from,to){const step=12,world=state.inside?{w:800,h:470}:state.world,cx=x=>Math.round(x/step),cell=(x,y)=>x+','+y;let a=[cx(from[0]),cx(from[1])],b=[cx(to[0]),cx(to[1])];if(!positionValid(b[0]*step,b[1]*step))return [];
const start=cell(...a),target=cell(...b),queue=[[...a]],came=new Map([[start,null]]),limit=6000;for(let i=0;i<queue.length&&i<limit;i++){const [x,y]=queue[i],key=cell(x,y);if(key===target){const out=[];let k=key;while(k&&k!==start){const [ax,ay]=k.split(',').map(Number);out.push([ax*step,ay*step]);k=came.get(k)}return out.reverse()}
for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,n=cell(nx,ny);if(came.has(n)||!positionValid(nx*step,ny*step))continue;came.set(n,key);queue.push([nx,ny])}}return []}
W.PsyKantoWorldV2={open,close,data:DATA,progress,walkable:(id,x,y)=>DATA.walkable(id==='pallet'?DATA.pallet:DATA.route1,x,y)};
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