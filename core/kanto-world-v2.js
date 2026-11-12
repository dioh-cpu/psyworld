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
const RIFT_ID='kanto-hunt-rift';
const RIFT_ROOM={id:RIFT_ID,title:'Fenda Selvagem',w:896,h:560,art:'assets/story/kanto-hunt-rift-v1.webp',spawn:[448,500],exit:[448,220],npcs:[],walkBounds:[24,24,872,536],blocks:[[720,135,895,480]]};
const state={root:null,canvas:null,ctx:null,world:null,inside:null,position:{x:597,y:555},lastOutdoor:null,held:new Set(),joy:null,touch:null,path:[],pendingHobby:null,pendingRiftTarget:null,time:0,raf:0,stepDistance:0,lastEncounter:0,dialogOpen:false,images:new Map(),portrait:null,avatar:null,quest:null,walkFrame:0,facing:'down',moving:false,suspended:false,navRequest:0,navCells:new Map(),viewport:null,lastRender:0,menuOpen:false,externalPanel:null,hideTrainerName:false,huntRiftOffer:null,huntRiftSession:null,huntRiftOrigin:null,huntRiftFrozen:false,pendingHuntRift:null,lastHuntRiftSecond:null};
function progress(){if(state.quest)return state.quest;try{state.quest=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(_){state.quest={}}return state.quest}
function putProgress(){try{localStorage.setItem(KEY,JSON.stringify(progress()))}catch(_){}try{W.autoSave?.()}catch(_){}}
function questDone(){const q=progress();return !!(q.oak)}
function mark(key){const q=progress();if(q[key])return;q[key]=true;putProgress();hud()}
function player(){try{return typeof P!=='undefined'?P:(W.P||{})}catch(_){return W.P||{}}}
function image(url){if(!url)return null;if(!state.images.has(url)){const o={loaded:false,im:new Image()};o.im.onload=()=>{if(url.startsWith('assets/characters/halloween/')){try{prepareAvatar(o)}catch(err){o.spriteError=true;console.warn('Trainer sprite could not be prepared',err)}}o.loaded=true;draw()};o.im.onerror=()=>{o.error=true};o.im.src=url;state.images.set(url,o)}return state.images.get(url)}
function updateFishingButton(){const button=state.root?.querySelector('[data-kw2-fish]');if(!button)return;const inRift=state.inside?.id===RIFT_ID,art=state.images.get(state.world?.art||'')?.mapCanvas;button.hidden=!!state.inside&&!inRift||!W.PsyHobbies?.canFish?.(inRift?RIFT_ID:state.world?.id,state.position,art)}
function makeUI(){if(state.root)return;const root=D.createElement('div');root.id='psy-kanto-world-v2';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
root.innerHTML='<header class="kw2-top"><button type="button" data-atlas>← ATLAS</button><div><strong class="kw2-title"></strong><small class="kw2-subtitle"></small></div><span class="kw2-clock" data-world-clock></span><button type="button" class="kw2-route" data-kw2-route title="Seguir objetivo principal" aria-label="Rota automática da missão principal">↗</button><button type="button" class="kw2-menu-toggle" data-kw2-menu aria-expanded="false">☰ MENU</button><button type="button" class="kw2-close" aria-label="Fechar">×</button></header><div class="kw2-stage"><canvas aria-label="Mapa jogável com colisões"></canvas><div class="kw2-joystick"></div><section class="kw2-dialog"><div class="kw2-dialog-main"><img class="kw2-portrait" alt="Retrato do NPC"/><div><div class="kw2-dialog-title"></div><div class="kw2-expression"></div><div class="kw2-dialog-body"></div></div></div><div class="kw2-dialog-actions"></div></section></div><footer class="kw2-footer"><div class="kw2-objective-line"><div class="kw2-objective"></div><button type="button" class="kw2-route-inline" data-kw2-route-inline aria-label="Ir para o objetivo atual" title="Seguir para o próximo objetivo" hidden>IR</button></div><div class="kw2-pad"><button data-dir="up" aria-label="Subir">▲</button><button data-dir="left" aria-label="Esquerda">◀</button><button data-dir="down" aria-label="Descer">▼</button><button data-dir="right" aria-label="Direita">▶</button></div><button class="kw2-interact" data-interact>INTERAGIR</button><button class="kw2-fish" data-kw2-fish type="button" hidden>PESCAR</button></footer><section class="kw2-menu" role="dialog" aria-modal="true" aria-label="Menu da campanha" hidden><div class="kw2-menu-shell"><header class="kw2-menu-head"><div><small>PSYWORLD · KANTO</small><h2>MENU DA CAMPANHA</h2></div><button type="button" data-kw2-menu-close aria-label="Fechar menu">×</button></header><div class="kw2-menu-actions"><button type="button" data-kw2-panel="team">👥 TIME / BOX</button><button type="button" data-kw2-panel="bag">🎒 MOCHILA</button><button type="button" data-kw2-panel="pokedex">📘 POKÉDEX</button><button type="button" data-kw2-panel="hobbies">🌿 HOBBIES</button><button type="button" data-kw2-panel="titles">✧ TÍTULOS</button><button type="button" data-kw2-panel="gyms">🏆 GINÁSIOS</button><button type="button" data-kw2-panel="shop">🛍 LOJA</button><button type="button" data-kw2-panel="allmodes">⬇ BAIXAR TODOS OS MODOS</button></div><div class="kw2-menu-columns"><section class="kw2-menu-block"><h3>MISSÕES E ROTA</h3><p>Use ROTA para seguir até o objetivo. O atalho ↗ no cabeçalho segue a missão principal.</p><div data-kanto-quest-slot></div></section><section class="kw2-menu-block kw2-vip-block"><h3>AUTOMAÇÃO · VIP</h3><div class="kw2-vip-intro"><div class="kw2-vip-mascot" aria-hidden="true"></div><p>A caçada automática acompanha sua equipe pelos campos de Kanto. Ative quando quiser explorar sem interromper sua jornada.</p></div><div data-kanto-auto-slot></div></section></div><button type="button" class="kw2-menu-return" data-kw2-menu-close>VOLTAR À EXPLORAÇÃO</button></div></section>';
root.addEventListener('contextmenu',e=>e.preventDefault());
root.addEventListener('selectstart',e=>e.preventDefault());
root.addEventListener('dragstart',e=>e.preventDefault());
D.body.appendChild(root);state.root=root;state.canvas=root.querySelector('canvas');state.ctx=state.canvas.getContext('2d');
root.querySelector('[data-kw2-fish]').onclick=()=>W.PsyHobbies?.startFishing?.(state.inside?.id||state.world?.id,{x:state.position.x,y:state.position.y,facing:state.facing});
root.querySelector('[data-atlas]').onclick=()=>{close();W.openKantoJourneyV1?.()};root.querySelector('.kw2-close').onclick=close;root.querySelector('[data-interact]').onclick=()=>{W.PsyCampaignAutomation?.cancelRoute?.();interact();};
root.querySelector('[data-kw2-menu]').onclick=()=>toggleCampaignMenu();
root.querySelectorAll('[data-kw2-menu-close]').forEach(b=>b.onclick=()=>toggleCampaignMenu(false));
root.querySelector('[data-kw2-route]').onclick=()=>{if(state.dialogOpen||state.externalPanel)return;toggleCampaignMenu(false);W.PsyCampaignAutomation?.startPrimaryRoute?.()};
root.querySelector('[data-kw2-route-inline]').onclick=()=>root.querySelector('[data-kw2-route]').click();
root.querySelectorAll('[data-kw2-panel]').forEach(b=>b.onclick=()=>openCampaignPanel(b.dataset.kw2Panel));
root.querySelector('.kw2-menu').addEventListener('click',e=>{if(e.target===root.querySelector('.kw2-menu'))toggleCampaignMenu(false)});
root.querySelectorAll('[data-dir]').forEach(el=>{const dir=el.dataset.dir;const up=e=>{e.preventDefault();state.held.delete(dir)};el.addEventListener('pointerdown',e=>{e.preventDefault();W.PsyCampaignAutomation?.cancelRoute?.();state.pendingHobby=null;state.path=[];state.navRequest++;state.held.add(dir);el.setPointerCapture?.(e.pointerId)});el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up)});
D.addEventListener('keydown',onKeyDown,true);D.addEventListener('keyup',onKeyUp,true);W.addEventListener('resize',()=>{state.viewport=null;draw()});W.visualViewport?.addEventListener?.('resize',()=>{state.viewport=null;draw()});
const stage=root.querySelector('.kw2-stage');stage.addEventListener('pointerdown',touchStart);stage.addEventListener('pointermove',touchMove);stage.addEventListener('pointerup',touchEnd);stage.addEventListener('pointercancel',touchCancel);stage.addEventListener('lostpointercapture',touchCancel);W.addEventListener('blur',resetTouch);W.addEventListener('resize',resetTouch);D.addEventListener('visibilitychange',()=>{if(D.hidden)resetTouch()});
}
function showDialog(title,body,actions=[],portrait='',emote=''){
 if(W.PsyGuide){state.dialogOpen=true;state.path=[];state.held.clear();const actor=(state.inside?.npcs||state.world?.npcs||[]).find(n=>n.name===title||title.includes(n.name));return W.PsyGuide.show({speaker:title,text:body,portrait:/Professor Car/.test(title)?'assets/kanto/approved/professor-expressions.webp':portrait||actor?.portrait,sheet:/Professor Car/.test(title)?'professor':undefined,target:actor?()=>{const view=camera(),r=state.canvas.getBoundingClientRect(),x=r.left+(actor.at[0]*view.scale+view.ox)*r.width/view.w,y=r.top+(actor.at[1]*view.scale+view.oy)*r.height/view.h;return {left:x-18,top:y-60,right:x+18,bottom:y+8};}:undefined,actions:actions.map(a=>({text:a.text,primary:a.primary,run:a.run})),onClose:()=>{state.dialogOpen=false;hud();}});}
const d=state.root.querySelector('.kw2-dialog');d.querySelector('.kw2-dialog-title').textContent=title;d.querySelector('.kw2-dialog-body').textContent=body;d.dataset.emotion=emote||'normal';d.querySelector('.kw2-expression').textContent='';
const im=d.querySelector('.kw2-portrait');im.style.display=portrait?'block':'none';if(portrait)im.src=portrait;
const box=d.querySelector('.kw2-dialog-actions');box.replaceChildren();const options=actions.length?actions:[{text:'CONTINUAR'}];options.forEach(a=>{const b=D.createElement('button');b.textContent=a.text;b.classList.toggle('primary',!!a.primary);b.onclick=()=>{d.classList.remove('open');state.dialogOpen=false;a.run?.();hud()};box.appendChild(b)});
d.classList.add('open');state.dialogOpen=true;state.path=[];state.held.clear();state.navRequest++;}
function hud(){
 if(!state.root)return;
 W.PsyWorldTimeV1?.updateBadge?.(state.root.querySelector('[data-world-clock]'));
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
   state.world?.id==='viridian'?'Ginásio fechado · Rota 2 ao norte':'O caminho até Viridian City';
 let message='';
 if(state.huntRiftSession){const sec=Math.max(0,Math.ceil((state.huntRiftSession.deadline-Date.now())/1000));message=`Fenda Selvagem · ${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')} · colete e retorne pelo portal ao norte.`;}
 else if(state.huntRiftOffer)message='Uma fenda de caça apareceu perto de você. Aproxime-se e pressione INTERAGIR.';
 else if(state.world?.id==='pallet'){
   if(!q.oak)message='Jornada: visite o laboratório e converse com o Professor Car’alho.';
   else message='A estrada está livre! Descubra os mistérios da Rota 1.';
 }else if(state.world?.id==='viridian')message=progress().viridianTalked?'Viridian: siga para a saída norte rumo à Rota 2.':'Viridian: converse com o ancião perto do Ginásio. Não há encontros selvagens na cidade.';
else message='Rota 1: explore os campos de grama e siga para Viridian City.';
 state.root.querySelector('.kw2-objective').textContent=message;
 const routeButton=state.root.querySelector('[data-kw2-route-inline]');if(routeButton)routeButton.hidden=!(state.world?.id==='pallet'&&!!q.oak&&!state.inside);
}
function attachHuntRiftOffer(offer){
 const scene=state.inside?.id||state.world?.id;if(!offer||offer.context.world!==scene)return false;
 let point=null;for(let radius=42;radius<=168&&!point;radius+=42)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const x=state.position.x+dx*radius,y=state.position.y+dy*radius;if(positionValid(x,y)){point={x,y};break}}
 if(!point)return false;
 state.huntRiftOffer={...offer,x:point.x,y:point.y};autoHunt=false;state.path=[];state.pendingHobby=null;state.held.clear();hud();draw();W.notif?.('Uma fenda de caça surgiu perto de você. Aproxime-se e pressione INTERAGIR.',4500);return true;
}
function considerHuntRift(context,roll=Math.random()){
 const offer=W.PsyKantoHuntRiftV1?.tryOffer?.('legacy',context,Date.now(),roll);return attachHuntRiftOffer(offer);
}
function enterHuntRift(){
 const offer=state.huntRiftOffer;if(!offer||state.huntRiftSession)return false;
 const origin={world:state.world,inside:state.inside,position:{...state.position},lastOutdoor:state.lastOutdoor?{...state.lastOutdoor}:null,facing:state.facing,autoHunt};
 const session=W.PsyKantoHuntRiftV1?.enter?.('legacy',offer.id,origin,Date.now());
 if(!session){state.huntRiftOffer=null;hud();draw();W.notif?.('A fenda já se fechou.');return false;}
 state.huntRiftOrigin=origin;state.huntRiftSession=session;state.huntRiftFrozen=false;state.lastHuntRiftSecond=null;state.huntRiftOffer=null;state.root?.classList.add('kw2-rift-active');
 autoHunt=false;state.path=[];state.pendingHobby=null;state.held.clear();state.joy=null;state.touch=null;state.navRequest++;state.navCells.clear();
 state.inside={...RIFT_ROOM,spawn:RIFT_ROOM.spawn.slice(),exit:RIFT_ROOM.exit.slice(),blocks:RIFT_ROOM.blocks.map(v=>v.slice()),npcs:[]};state.position={x:RIFT_ROOM.spawn[0],y:RIFT_ROOM.spawn[1]};state.facing='up';state.viewport=null;
 image(RIFT_ROOM.art);updateFishingButton();hud();draw();W.notif?.('Você entrou na fenda. Há 3 minutos para explorar e coletar.',3200);return true;
}
function returnFromHuntRift(expired=false){
 const session=state.huntRiftSession;if(!session)return false;
 W.PsyHobbiesVFX?.cancelAction?.(RIFT_ID);W.PsyHobbies?.cancelFishing?.();
 const origin=W.PsyKantoHuntRiftV1?.finish?.(session)||state.huntRiftOrigin;if(!origin)return false;
 state.huntRiftSession=null;state.huntRiftOrigin=null;state.huntRiftFrozen=false;state.huntRiftOffer=null;state.root?.classList.remove('kw2-rift-active');
 state.world=origin.world;state.inside=origin.inside;state.position={...origin.position};state.lastOutdoor=origin.lastOutdoor?{...origin.lastOutdoor}:null;state.facing=origin.facing||'down';
 autoHunt=!!origin.autoHunt&&vipActive();state.path=[];state.pendingHobby=null;state.held.clear();state.joy=null;state.touch=null;state.navRequest++;state.navCells.clear();state.viewport=null;state.suspended=false;
 updateFishingButton();hud();draw();if(expired)W.notif?.('A fenda se fechou. Você retornou ao ponto de entrada com os recursos coletados.',3500);return true;
}
function tickHuntRift(now=Date.now()){
 if(state.huntRiftOffer){const current=W.PsyKantoHuntRiftV1?.getOffer?.('legacy',now);if(!current||current.id!==state.huntRiftOffer.id){state.huntRiftOffer=null;hud();draw();}}
 if(!state.huntRiftSession)return false;
 const status=W.PsyKantoHuntRiftV1?.status?.(state.huntRiftSession,now);
 if(status?.phase==='closing'&&!state.huntRiftFrozen){state.huntRiftFrozen=true;state.held.clear();state.path=[];state.joy=null;autoHunt=false;W.PsyHobbiesVFX?.cancelAction?.(RIFT_ID);W.PsyHobbies?.cancelFishing?.();draw();}
 if(status?.phase==='return'){returnFromHuntRift(true);return false;}
 if(!state.huntRiftFrozen){const sec=Math.ceil(status?.remainingMs/1000);if(sec!==state.lastHuntRiftSecond){state.lastHuntRiftSecond=sec;const text=state.root?.querySelector('.kw2-objective');if(text)text.textContent=`Fenda Selvagem · ${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')} · colete e retorne pelo portal ao norte.`;}}
 return !!state.huntRiftFrozen;
}
function toggleCampaignMenu(force){
 if(!state.root)return;
 const open=typeof force==='boolean'?force:!state.menuOpen;
 state.menuOpen=open;
 const panel=state.root.querySelector('.kw2-menu');panel.hidden=!open;
 state.root.querySelector('[data-kw2-menu]').setAttribute('aria-expanded',String(open));
 if(open){state.path=[];state.navRequest++;state.held.clear();state.joy=null;state.touch=null;const stick=state.root.querySelector('.kw2-joystick');if(stick)stick.style.display='none';}
}
function suspendCampaignForPanel(id){
 if(!state.root?.classList.contains('open'))return false;
 const panel=D.getElementById(id);
 if(!panel||W.getComputedStyle(panel).display==='none')return false;
 toggleCampaignMenu(false);state.path=[];state.navRequest++;state.held.clear();state.joy=null;state.touch=null;
 const stick=state.root.querySelector('.kw2-joystick');if(stick)stick.style.display='none';
 state.externalPanel=id;state.root.style.visibility='hidden';return true;
}
function openCampaignPanel(kind){
 if(state.externalPanel)return;
 const panels={
  team:{fn:()=>W.openTeam?.(),id:'screen-team'},
  bag:{fn:()=>W.openBag?.(),id:'screen-bag'},
  pokedex:{fn:()=>W.openPokedex?.(),id:'screen-pokedex'},
  hobbies:{fn:()=>W.PsyHobbies?.open?.(),id:'psy-hobbies'},
  titles:{fn:()=>W.PsyTitles?.open?.(),id:'psy-titles-panel'},
  allmodes:{fn:()=>{W.psyOpenModeManager?.();W.psyInstallAllModes?.()},id:'psy-mode-download-screen'},
  gyms:{fn:()=>W.openGyms?.(),id:'screen-gyms'},
  shop:{fn:()=>W.openShop?.(),id:'screen-shop'}
 };
 const spec=panels[kind];if(!spec)return;
 toggleCampaignMenu(false);
 state.path=[];state.navRequest++;state.held.clear();state.joy=null;state.touch=null;
 const stick=state.root.querySelector('.kw2-joystick');if(stick)stick.style.display='none';
 try{spec.fn()}catch(err){console.warn('Kanto menu',kind,err)}
 const panel=D.getElementById(spec.id);
 if(!panel||W.getComputedStyle(panel).display==='none'){
  showDialog('Conteúdo indisponível','Este painel ainda não está disponível. Tente novamente após carregar o modo.');return;
 }
 suspendCampaignForPanel(spec.id);
}
function open(id,options={}){if(state.huntRiftSession){W.notif?.('Retorne pela fenda antes de mudar de localidade.',2200);return false}if(!['pallet','route-1','viridian'].includes(id)||!DATA[id==='route-1'?'route1':id])return false;const previousWorld=state.world?.id||null,resumePosition=!state.inside&&previousWorld===id&&DATA.walkable(state.world,state.position.x,state.position.y,PLAYER_RADIUS)?[state.position.x,state.position.y]:null;W.PsyHobbiesVFX?.cancelAction?.(state.inside?.id||state.world?.id);
if(id==='viridian'&&!progress().viridian&&!options.skipGuard)return false;
if(id==='route-1'&&!progress().oak&&!options.skipGuard){open('pallet');setTimeout(()=>showDialog('Rota 1 bloqueada','Antes de seguir para a Rota 1, converse com o Professor Car’alho no laboratório.'),80);return false}
W.closeTutorial?.();D.getElementById('psy-tutorial-cinematic')?.remove();makeUI();toggleCampaignMenu(false);state.externalPanel=null;state.root.style.visibility='';state.root.dataset.world=id;D.getElementById('psy-kanto-world')?.classList.remove('open');D.body.classList.add('psy-kanto-v2-active');state.world=id==='pallet'?DATA.pallet:id==='route-1'?DATA.route1:DATA.viridian;state.inside=null;state.path=[];state.navRequest++;state.navCells=new Map();state.viewport=null;state.lastRender=0;state.held.clear();state.dialogOpen=false;state.root.querySelector('.kw2-dialog').classList.remove('open');
const start=options.spawn||resumePosition||state.world.spawn;state.position={x:start[0],y:start[1]};state.lastOutdoor=null;updateFishingButton();
image(state.world.art);D.getElementById('psy-kanto-atlas')?.classList.remove('open');state.root.classList.add('open');state.suspended=false;const pending=W.PsyKantoHuntRiftV1?.getOffer?.('legacy');if(pending?.context.world===id)attachHuntRiftOffer(pending);hud();draw();if(!state.raf){state.time=performance.now();state.raf=W.requestAnimationFrame(tick)}W.PsyKantoStoryV49?.enter(previousWorld,id);return true;}
function close(){if(state.huntRiftSession)returnFromHuntRift(false);if(state.huntRiftOffer)W.PsyKantoHuntRiftV1?.clearOffer?.('legacy',state.huntRiftOffer.id);state.huntRiftOffer=null;W.PsyHobbiesVFX?.cancelAction?.(state.inside?.id||state.world?.id);if(state.root){state.root.style.visibility='';toggleCampaignMenu(false);state.externalPanel=null;}W.PsyKantoStoryV49?.close(false);W.PsyGuide?.close();autoHunt=false;state.navRequest++;state.navCells.clear();D.body.classList.remove('psy-kanto-v2-active');state.root?.classList.remove('open');state.path=[];state.pendingHobby=null;state.pendingRiftTarget=null;state.held.clear();state.touch=null;state.joy=null;state.dialogOpen=false;state.suspended=false;const stick=state.root?.querySelector('.kw2-joystick');if(stick)stick.style.display='none';if(state.raf)W.cancelAnimationFrame(state.raf);state.raf=0}
let autoHunt=false,huntPlanAt=0,huntPlanning=false;
const vipActive=()=>Number(player().meta?.vipUntil||0)>Date.now();
const PLAYER_RADIUS=11;
function positionValid(x,y){
  if(state.inside){
    const room=state.inside;
    const bounds=room.walkBounds||[0,174,room.w,room.h];if(x<bounds[0]+PLAYER_RADIUS||x>bounds[2]-PLAYER_RADIUS||y<bounds[1]+PLAYER_RADIUS||y>bounds[3]-PLAYER_RADIUS)return false;
    if(room.blocks.some(([a,b,c,d])=>x>=a-PLAYER_RADIUS&&x<=c+PLAYER_RADIUS&&y>=b-PLAYER_RADIUS&&y<=d+PLAYER_RADIUS))return false;
    return !(room.npcs||[]).some(n=>Math.hypot(x-n.at[0],y-n.at[1])<PLAYER_RADIUS+12);
  }
  if(!DATA.walkable(state.world,x,y,PLAYER_RADIUS))return false;
  return !(state.world?.npcs||[]).some(n=>Math.hypot(x-n.at[0],y-n.at[1])<PLAYER_RADIUS+12);
}
function move(dx,dy,dt,maxDistance=Infinity){state.moving=false;if(state.dialogOpen||state.suspended||(!dx&&!dy))return;const mag=Math.hypot(dx,dy);dx/=mag;dy/=mag;const speed=(state.inside?144:143)*(1+(Number(W.PsySeason?.buff('speed')||0)+Number(W.PsyProfessions?.bonus('main','speed')||0))/100),dist=Math.min(maxDistance,speed*dt*Math.min(1,mag)),steps=Math.ceil(dist/4.5);let mx=0,my=0;
for(let i=0;i<steps;i++){const stepx=dx*dist/steps,stepy=dy*dist/steps,p=state.position;
if(positionValid(p.x+stepx,p.y+stepy)){p.x+=stepx;p.y+=stepy;mx+=stepx;my+=stepy}else{if(positionValid(p.x+stepx,p.y)){p.x+=stepx;mx+=stepx}if(positionValid(p.x,p.y+stepy)){p.y+=stepy;my+=stepy}}}
state.moving=Math.abs(mx)+Math.abs(my)>0.25;
if(Math.abs(mx)>Math.abs(my))state.facing=mx>0?'right':'left';else if(my)state.facing=my>0?'down':'up';if(state.moving){state.walkFrame+=dt*10;const encounter=encounterForScene();if(encounter){state.stepDistance+=Math.hypot(mx,my);if(state.stepDistance>=encounter.stepDistance){state.stepDistance%=encounter.stepDistance;maybeEncounter(encounter)}}}}
function restoreEncounter(){if(!state.suspended)return;state.suspended=false;D.body.classList.add('psy-kanto-v2-active');state.root.classList.add('open');draw();if(!state.raf){state.time=performance.now();state.raf=W.requestAnimationFrame(tick)}}
function encounterForScene(){
 const scene=state.inside||state.world;if(!scene)return null;
 if(scene.encounter&&typeof scene.encounter==='object')return scene.encounter;
 if(state.inside&&/(cave|cavern|gruta|caverna|mine)/i.test(String(scene.id||scene.title||'')))return {pool:'kanto_cave_t1',area:'crystal-grotto',stepDistance:40,chance:.14,cooldownMs:6500};
 if(!state.inside&&scene.id==='route-1'&&DATA.grassAt(scene,state.position.x,state.position.y))return {pool:'kanto_route1_t1',area:'route-1',stepDistance:32,chance:.16,cooldownMs:6000};
 return null;
}
function cavePool(){
 const ids=[27,50,41,74,95,104],getName=W.getPokeName;
 return ids.map(id=>({id,name:typeof getName==='function'?getName(id):'Pokémon '+id,type:W.TYPE_BY_ID_ALL?.[id]||'Rock'}));
}
function maybeEncounter(config){if(!config)return;if(config.area==='route-1'&&!DATA.grassAt(state.world,state.position.x,state.position.y))return;if(performance.now()-state.lastEncounter<(config.cooldownMs||6000)||Math.random()>(config.chance??.16))return;
const p=player();if(!Array.isArray(p.team)||!p.team.length){showDialog('Equipe necessária','Escolha seu primeiro Pokémon antes de procurar encontros.');return}
if(typeof W.triggerWild!=='function')return;state.lastEncounter=performance.now();state.suspended=true;state.pendingHuntRift={world:(state.inside||state.world)?.id||'',kind:state.inside?'dungeon':'route',x:state.position.x,y:state.position.y,facing:state.facing,autoHunt};state.held.clear();state.path=[];state.joy=null;state.root.classList.remove('open');const old=W.startBattle,oldGet=W.getPokesForHunt;
const prev=W.endBattle;if(typeof prev==='function'&&!prev.__kw2){const wrapped=function(won){const pending=won===true?state.pendingHuntRift:null;state.pendingHuntRift=null;const result=prev.apply(this,arguments);let offer=null;if(state.suspended&&pending)offer=W.PsyKantoHuntRiftV1?.tryOffer?.('legacy',{...pending,won:true,trainer:false},Date.now());if(state.suspended)W.setTimeout(()=>{restoreEncounter();if(offer)attachHuntRiftOffer(offer)},0);return result};wrapped.__kw2=true;W.endBattle=wrapped}
if(typeof oldGet==='function')W.getPokesForHunt=function(region,type,tier){const pool=String(config.pool||'');if(pool==='kanto_cave_t1'&&region==='kanto'&&type==='cave')return W.PsyWorldTimeV1?.weightEncounterRecords?.(cavePool(),config.area)||cavePool();const records=oldGet.apply(this,arguments);return W.PsyWorldTimeV1?.weightEncounterRecords?.(records,config.area)||records};
if(typeof old==='function')W.startBattle=function(wild){if(wild&&typeof wild==='object'){wild.lvl=wild.level;wild.halloweenArea=config.area}return old.apply(this,arguments)};
try{W.triggerWild(config.pool||'kanto_route1_t1')}catch(e){state.pendingHuntRift=null;console.warn('Kanto exploration encounter',e);restoreEncounter()}finally{if(typeof old==='function')W.startBattle=old;if(typeof oldGet==='function')W.getPokesForHunt=oldGet}
const battle=D.getElementById('battle-screen');if(!battle||battle.style.display==='none'||!battle.classList.contains('active'))restoreEncounter();
}

function tick(now){if(!state.root?.classList.contains('open')){state.raf=0;return}if(tickHuntRift(Date.now())){state.raf=W.requestAnimationFrame(tick);return}const dt=Math.min(.12,Math.max(0,(now-state.time)/1000));state.time=now;
if(state.externalPanel){
 const el=D.getElementById(state.externalPanel);
 if(!el||W.getComputedStyle(el).display==='none'){state.externalPanel=null;state.root.style.visibility='';state.viewport=null;draw();}
 state.raf=W.requestAnimationFrame(tick);return;
}
if(state.menuOpen){state.raf=W.requestAnimationFrame(tick);return;}
if(now-(state.lastFishingCheck||0)>550){state.lastFishingCheck=now;updateFishingButton();}
if(autoHunt&&(!vipActive()||!(player().team||[]).some(mon=>Number(mon.hp)>0))){autoHunt=false;state.path=[];}
if(autoHunt&&!huntPlanning&&!state.inside&&!state.dialogOpen&&!state.suspended&&!state.path.length&&now-huntPlanAt>900){
 huntPlanAt=now;
 const fields=state.world.grass||[],p=state.position;
 const sorted=fields.slice().sort((a,b)=>Math.hypot((a.rect[0]+a.rect[2])/2-p.x,(a.rect[1]+a.rect[3])/2-p.y)-Math.hypot((b.rect[0]+b.rect[2])/2-p.x,(b.rect[1]+b.rect[3])/2-p.y));
 const field=sorted[0];
 if(field){const [x1,y1,x2,y2]=field.rect;let dest=[(x1+x2)/2,(y1+y2)/2];
 if(DATA.grassAt(state.world,p.x,p.y))for(let k=0;k<15;k++){const candidate=[x1+12+Math.random()*Math.max(1,x2-x1-24),y1+12+Math.random()*Math.max(1,y2-y1-24)];if(positionValid(...candidate)){dest=candidate;break;}}
 huntPlanning=true;const request=++state.navRequest;findPath([p.x,p.y],dest,request).then(path=>{huntPlanning=false;if(autoHunt&&request===state.navRequest)state.path=path;},()=>{huntPlanning=false;});
 }
}
let dx=0,dy=0,pathDistance=Infinity;for(const k of state.held){if(k==='up')dy--;if(k==='down')dy++;if(k==='left')dx--;if(k==='right')dx++}
if(state.joy){dx+=state.joy.x;dy+=state.joy.y}if(!dx&&!dy&&state.path.length){const dest=state.path[0],p=state.position,d=Math.hypot(dest[0]-p.x,dest[1]-p.y);if(d<.5){if(positionValid(...dest)){p.x=dest[0];p.y=dest[1];}state.path.shift()}else{dx=(dest[0]-p.x)/d;dy=(dest[1]-p.y)/d;pathDistance=d}}
state.moving=false;const activityScene=state.inside?.id||state.world?.id,activityLocked=W.PsyHobbiesVFX?.blocksMovement?.(activityScene);if((dx||dy)&&!activityLocked)move(dx,dy,dt,pathDistance);
const pending=state.pendingHobby;if(pending&&!pending.searching&&!state.path.length&&!state.moving){const node=W.PsyHobbies?.visibleNodes?.(pending.scene)?.find(v=>v.id===pending.id);state.pendingHobby=null;if(node&&Math.hypot(node.x-state.position.x,node.y-state.position.y)<65)W.PsyHobbies?.interact?.(pending.scene,node.id,{x:state.position.x,y:state.position.y,facing:state.facing});else if(node)W.notif?.('Não foi possível alcançar esse recurso por este caminho.',2200);}
const pendingRift=state.pendingRiftTarget;if(pendingRift&&!state.path.length&&!state.moving){state.pendingRiftTarget=null;if(Math.hypot(pendingRift.at[0]-state.position.x,pendingRift.at[1]-state.position.y)<78)activateTarget(pendingRift);}
if(state.root){state.root.dataset.worldPosition=Math.round(state.position.x)+','+Math.round(state.position.y);state.root.dataset.pathLength=String(state.path.length);}
const frameBudget=W.innerWidth<740?1000/48:1000/60;
if(!W.PsyKantoStoryV49?.isOpen()&&now-state.lastRender>=frameBudget){draw();state.lastRender=now}
state.raf=W.requestAnimationFrame(tick)}
function onKeyDown(e){if(!state.root?.classList.contains('open')||state.huntRiftFrozen||W.PsyKantoStoryV49?.isOpen()||W.PsyGuide?.isOpen())return;
if(state.externalPanel)return;
if(state.menuOpen){if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();toggleCampaignMenu(false)}return;}
if(e.code==='KeyM'){e.preventDefault();e.stopImmediatePropagation();toggleCampaignMenu();return;}const keys={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};if(keys[e.code]){W.PsyCampaignAutomation?.cancelRoute?.();autoHunt=false;e.preventDefault();e.stopImmediatePropagation();state.pendingHobby=null;state.pendingRiftTarget=null;state.path=[];state.navRequest++;state.held.add(keys[e.code])}else if(['KeyE','Enter','Space'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat){W.PsyCampaignAutomation?.cancelRoute?.();interact()}}else if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}}
function onKeyUp(e){if(!state.root?.classList.contains('open')||state.menuOpen||state.externalPanel)return;const keys={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};if(keys[e.code]){e.preventDefault();e.stopImmediatePropagation();state.held.delete(keys[e.code])}}
// Measure the real Route 1 layout once per viewport; later chapters share this
// benchmark rather than guessing header/footer heights from old CSS revisions.
let routeViewportCache=null;
function routeOneViewport(){
 const key=[W.innerWidth,W.innerHeight,W.devicePixelRatio,D.documentElement.dataset.psyLayout].join(':');if(routeViewportCache?.key===key)return routeViewportCache;
 makeUI();const root=state.root,oldStyle=root.getAttribute('style'),oldWorld=root.dataset.world,wasOpen=root.classList.contains('open');
 const labels=[root.querySelector('.kw2-title'),root.querySelector('.kw2-subtitle'),root.querySelector('.kw2-objective')],oldLabels=labels.map(el=>el?.textContent);labels[0].textContent=DATA.route1.title;labels[1].textContent='O caminho até Viridian City';labels[2].textContent='Rota 1: explore os campos de grama e siga para Viridian City.';
 root.dataset.world='route-1';root.style.display='flex';root.style.visibility='hidden';root.style.pointerEvents='none';root.classList.add('open');
 const stage=root.querySelector('.kw2-stage').getBoundingClientRect(),top=root.querySelector('.kw2-top').getBoundingClientRect(),foot=root.querySelector('.kw2-footer').getBoundingClientRect();
 routeViewportCache={key,width:stage.width,height:stage.height,top:top.height,footer:foot.height,mapW:DATA.route1.w,mapH:DATA.route1.h};
 labels.forEach((el,i)=>{if(el)el.textContent=oldLabels[i]});
 if(oldStyle===null)root.removeAttribute('style');else root.setAttribute('style',oldStyle);if(oldWorld===undefined)delete root.dataset.world;else root.dataset.world=oldWorld;if(!wasOpen)root.classList.remove('open');return routeViewportCache;
}
function camera(){
  const map=state.inside||state.world,c=state.canvas,stage=state.root.querySelector('.kw2-stage');
  const r=state.viewport||(state.viewport=stage.getBoundingClientRect()),dpr=Math.min(1.3,W.devicePixelRatio||1);
  const cw=Math.max(260,Math.round(r.width*dpr)),ch=Math.max(180,Math.round(r.height*dpr));
  if(c.width!==cw||c.height!==ch){c.width=cw;c.height=ch}
  // Cover the screen instead of letterboxing; scroll with the player.
  const cover=Math.max(cw/map.w,ch/map.h);
 const scale=state.inside?Math.min(3,cover*(W.innerWidth<740?1.38:1.15)):state.world?.id==='viridian'?Math.min(4,cover*(r.width<650?1.22:1.10)):Math.min(4,(state.world?.id==='pallet'?Math.max(cw/(DATA.route1?.w||900),ch/(DATA.route1?.h||450)):cover)*1.08);
  const viewW=cw/scale,viewH=ch/scale,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const cx=viewW>=map.w?map.w/2:clamp(state.position.x,viewW/2,map.w-viewW/2);
  const cy=viewH>=map.h?map.h/2:clamp(state.position.y,viewH/2,map.h-viewH/2);
  return {w:cw,h:ch,scale,ox:Math.round(cw/2-cx*scale),oy:Math.round(ch/2-cy*scale)};
}
function draw(){if(!state.root?.classList.contains('open')||!state.world)return;state.hideTrainerName=!state.inside&&Array.isArray(state.world.exit)&&Math.hypot(state.world.exit[0]-state.position.x,state.world.exit[1]-state.position.y)<80;const c=state.ctx,view=camera();c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,view.w,view.h);c.fillStyle='#122e30';c.fillRect(0,0,view.w,view.h);c.setTransform(view.scale,0,0,view.scale,view.ox,view.oy);
if(state.inside){drawInterior(c,state.inside)}else{const o=image(state.world.art);if(o?.loaded){
    if(!o.mapCanvas||o.mapCanvas.width!==state.world.w||o.mapCanvas.height!==state.world.h){
      const flat=D.createElement('canvas');flat.width=state.world.w;flat.height=state.world.h;
      const fc=flat.getContext('2d');fc.imageSmoothingEnabled=true;
      fc.drawImage(o.im,0,0,flat.width,flat.height);o.mapCanvas=flat;
    }
    // The authored Route 1 illustration has a decorative fence drawn across
    // the entrance to the lower hunting field. Keep gameplay geometry intact,
    // but composite a small pixel-art gap into the cached map texture so the
    // art no longer suggests that the gathering spots are fenced off.
    if(state.world.id==='route-1'&&!o.huntFenceGapApplied){
      const gap=image('assets/story/route-1-hunt-gap-v1.png');
      if(gap?.loaded){
        const mc=o.mapCanvas.getContext('2d');
        mc.drawImage(gap.im,
          470/1400*state.world.w,375/700*state.world.h,
          220/1400*state.world.w,100/700*state.world.h);
        o.huntFenceGapApplied=true;
      }
    }
    const sx=Math.max(0,-view.ox/view.scale),sy=Math.max(0,-view.oy/view.scale);
    const sw=Math.min(state.world.w-sx,view.w/view.scale),sh=Math.min(state.world.h-sy,view.h/view.scale);
    if(sw>0&&sh>0){c.imageSmoothingEnabled=true;c.drawImage(o.mapCanvas,sx,sy,sw,sh,sx,sy,sw,sh)}
  }else{c.fillStyle='#172b31';c.fillRect(0,0,state.world.w,state.world.h);c.fillStyle='#f5d28e';c.font='bold 20px system-ui';c.textAlign='center';c.fillText(o?.error?'ERRO: ARTE DO MAPA NÃO CARREGOU':'CARREGANDO ARTE DO MAPA...',state.world.w/2,state.world.h/2)}}
const hobbyScene=state.inside?.id||state.world?.id;
W.PsyTreasureHuntV1?.drawScene?.(c,hobbyScene,performance.now());
W.PsyHobbies?.drawField?.(c,hobbyScene);
if(state.huntRiftOffer){const x=state.huntRiftOffer.x,y=state.huntRiftOffer.y,pulse=.62+Math.sin(performance.now()/180)*.18,g=c.createRadialGradient(x,y,3,x,y,34);g.addColorStop(0,`rgba(121,247,231,${pulse})`);g.addColorStop(.55,'rgba(131,91,255,.38)');g.addColorStop(1,'rgba(55,42,140,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,34,0,Math.PI*2);c.fill();c.strokeStyle='#9af8ea';c.lineWidth=3;c.beginPath();c.ellipse(x,y,12,20,0,0,Math.PI*2);c.stroke();c.fillStyle='#e1ffff';c.font='bold 11px system-ui';c.textAlign='center';c.fillText('FENDA · ENTRAR',x,y-29);}
if(state.inside)W.PsyHobbies?.drawDecor?.(c,state.inside.id);
const things=state.inside?state.inside.npcs:(state.world.npcs||[]);things.forEach(npc=>{const distance=Math.hypot(npc.at[0]-state.position.x,npc.at[1]-state.position.y);drawNPC(c,npc,distance)});
if(!state.inside){if(state.world.id==='route-1')drawMarker(c,108,420,'← PALLET','#80ffaa');if(state.world.id==='viridian'&&Math.hypot(state.position.x-450,state.position.y-550)<115)drawMarker(c,450,550,'ROTA 1 ↓','#80ffaa');if(state.world.id==='pallet'){const lab=state.world.doors.find(d=>d.id==='lab');if(lab)drawMarker(c,lab.at[0],lab.at[1],'LABORATÓRIO','#ffd480');}
state.world.doors.forEach(d=>{if(d.id!=='lab'&&Math.hypot(d.at[0]-state.position.x,d.at[1]-state.position.y)<100)drawMarker(c,d.at[0],d.at[1],d.title,'#79dced')});
if(Math.hypot(state.world.exit[0]-state.position.x,state.world.exit[1]-state.position.y)<105)drawMarker(c,state.world.exit[0],state.world.exit[1],state.world.id==='pallet'?'ROTA 1':state.world.id==='viridian'?'ROTA 2':'VIRIDIAN','#80ffaa')}
else if(state.inside.id===RIFT_ID)drawRiftGate(c,...(state.inside.exit||[448,128]),performance.now());else drawMarker(c,...(state.inside.exit||[240,675]),'SAÍDA ↓','#85efdc');
if(W.PsyFollower)W.PsyFollower.draw(c,{scene:state.world.id+':'+(state.inside?.id||'outside'),x:state.position.x,y:state.position.y,facing:state.facing,moving:state.moving,valid:positionValid,trainer:()=>drawPlayer(c,state.position.x,state.position.y)});else drawPlayer(c,state.position.x,state.position.y);W.PsyWorldTimeV1?.updateBadge?.(state.root.querySelector('[data-world-clock]'));c.setTransform(1,0,0,1,0,0);W.PsyWorldTimeV1?.drawAmbient?.(c,view.w,view.h);if(state.huntRiftFrozen){c.fillStyle='#04111de6';c.fillRect(0,0,view.w,view.h);c.fillStyle='#a4fff1';c.font='bold 26px system-ui';c.textAlign='center';c.fillText('A FENDA SE FECHA',view.w/2,view.h/2-8);c.font='bold 14px system-ui';c.fillStyle='#f5f1ff';c.fillText('Retornando ao ponto de entrada…',view.w/2,view.h/2+20)}}
function drawMarker(c,x,y,label,color){c.save();c.fillStyle='#0b1726bb';c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(x,y-18,10,0,Math.PI*2);c.fill();c.stroke();c.fillStyle=color;c.font='bold 12px system-ui';c.textAlign='center';c.fillText('!',x,y-15);c.font='bold 11px system-ui';let w=Math.min(140,c.measureText(label).width+14);const playerName=player().name||'Treinador';c.font='bold 12px system-ui';const nameW=Math.min(180,c.measureText(playerName).width+4),overlapX=Math.abs(x-state.position.x)<(w+nameW)/2,overlapY=Math.abs((y-35)-(state.position.y-59))<23;if(overlapX&&overlapY)state.hideTrainerName=true;const actorCoversCaption=Math.abs(x-state.position.x)<w/2+24&&(y-31)>state.position.y-60&&(y-48)<state.position.y+5;c.font='bold 11px system-ui';if(!actorCoversCaption){c.fillStyle='#0b182bdc';c.fillRect(x-w/2,y-48,w,17);c.fillStyle='#fff';c.fillText(label,x,y-35)}c.restore()}
function drawRiftGate(c,x,y,now){const pulse=.68+Math.sin(now/180)*.16,halo=c.createRadialGradient(x,y-28,3,x,y-28,62);halo.addColorStop(0,`rgba(118,248,232,${pulse*.62})`);halo.addColorStop(.52,'rgba(120,83,244,.34)');halo.addColorStop(1,'rgba(67,42,166,0)');c.save();c.fillStyle='#10162477';c.beginPath();c.ellipse(x,y+3,24,7,0,0,Math.PI*2);c.fill();c.fillStyle=halo;c.fillRect(x-64,y-94,128,108);c.shadowColor='#99fff0';c.shadowBlur=12;c.strokeStyle='#a8fff1';c.lineWidth=4;c.beginPath();c.ellipse(x,y-30,21,37,0,0,Math.PI*2);c.stroke();c.shadowBlur=0;c.strokeStyle='#b79aff';c.lineWidth=2;c.beginPath();c.ellipse(x,y-30,13,29,0,0,Math.PI*2);c.stroke();for(let i=0;i<4;i++){const a=now/420+i*Math.PI/2;c.fillStyle=i%2?'#c6b2ff':'#d5fff7';c.beginPath();c.arc(x+Math.cos(a)*29,y-30+Math.sin(a)*38,2.4,0,Math.PI*2);c.fill()}c.textAlign='center';c.font='bold 11px system-ui';c.fillStyle='#071521df';c.fillRect(x-61,y-53,122,16);c.fillStyle='#ddfff7';c.fillText('PORTAL DE RETORNO',x,y-41);c.restore()}
function drawNPC(c,npc,distance){
  const x=npc.at[0],y=npc.at[1],entry=image(npc.sprite||npc.portrait);
  c.save();
  c.fillStyle='#07101f99';c.beginPath();c.ellipse(x,y+4,14,5,0,0,Math.PI*2);c.fill();
  if(npc.painted){c.restore();return}
  if(entry?.loaded){
    const iw=entry.im.naturalWidth||160,ih=entry.im.naturalHeight||190;
    const h=60,w=Math.min(52,h*iw/ih);
    const smoothing=c.imageSmoothingEnabled;
    if(/\/npcs\/viridian-(elder|instructor)-v1\.png$/.test(npc.portrait||npc.sprite||''))c.imageSmoothingEnabled=false;
    c.shadowColor='#020617';c.shadowBlur=2;c.drawImage(entry.im,x-w/2,y-h,w,h);c.shadowBlur=0;c.imageSmoothingEnabled=smoothing;
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
let humanAnimationState=null;
function prepareAvatar(entry){
  const walk=W.PsyTrainerWalkV1;
  if(walk){entry.animationAtlas=walk.getAnimationAtlas?.(entry.im);if(!entry.animationAtlas)entry.atlas=walk.getAtlas(entry.im);entry.atlasTileW=walk.cellWidth;entry.atlasTileH=walk.cellHeight}
}
function drawPlayer(c,x,y,options={}){
  const scene=options.scene||state.inside?.id||state.world?.id||'city-psy';
  const facing=options.facing||state.facing||'down';
  const moving=options.moving===undefined?state.moving:!!options.moving;
  const walkFrame=Number(options.walkFrame??state.walkFrame)||0;
  const scale=Math.max(.75,Math.min(2,Number(options.scale)||1));
  c.save();
  c.fillStyle='#0008';c.beginPath();c.ellipse(x,y+5,13,5,0,0,Math.PI*2);c.fill();
  const fashion=W.PsyProfessions?.cosmetic?.();if(fashion){c.save();c.strokeStyle=fashion.color;c.globalAlpha=.7;c.lineWidth=2;c.beginPath();c.ellipse(x,y+4,18,7,0,0,Math.PI*2);c.stroke();if(moving){c.globalAlpha=.45;for(let i=0;i<3;i++){c.beginPath();c.arc(x+(i-1)*9,y+8+(Math.sin(walkFrame+i)+1)*4,1.8,0,Math.PI*2);c.fillStyle=fashion.color;c.fill()}}c.restore()}
  const entry=selectedAvatar(),action=W.PsyHobbiesVFX?.sampleAction?.(scene,{x,y,moving:false}),row=action?.row??({down:0,left:1,right:2,up:3})[facing]??0;W.PsyCostumeAuraV1?.draw?.(c,entry?.im?.src,x,y+5);W.PsyTreasureHuntV1?.drawBountyAura?.(c,x,y,performance.now());let usedSprite=false;
  if(entry?.loaded){
    const walking=moving&&!action,w=48*scale,h=64*scale,left=x-w/2,top=y+5-60*scale;
    const walk=W.PsyTrainerWalkV1;
    if(entry.animationAtlas&&walk?.renderAnimated){
      if(!humanAnimationState)humanAnimationState=walk.createState();
      walk.renderAnimated(c,entry.animationAtlas,humanAnimationState,{moving:walking,row,x,y,identity:scene+':'+entry.im.src},left,top,w,h);
      usedSprite=true;
    }else if(entry.atlas&&walk){
      walk.draw(c,entry.atlas,row,walk.column(Math.floor(walkFrame),walking),left,top+2*scale,w,h);
      usedSprite=true;
    }else if(entry.im?.naturalWidth&&entry.im?.naturalHeight){
      // Graphics still work if atlas preprocessing fails or an older profile loads.
      const sw=entry.im.naturalWidth/4,sh=entry.im.naturalHeight/4;
      c.drawImage(entry.im,0*sw+sw*.25,row*sh+sh*.22,sw*.5,sh*.58,
        x-16.5*scale,y+7-46*scale,33*scale,46*scale);
      usedSprite=true;
    }
  }
  W.PsyHobbiesVFX?.drawActor?.(c,scene,{x,y,action,atlas:entry?.animationAtlas,avatarUrl:entry?.im?.src||''});
  // Never substitute a blocky test character while the real sheet loads.
  // The canvas redraws as soon as the trainer atlas becomes available.
  c.font='bold 12px system-ui';c.fillStyle='#fff';c.textAlign='center';
  c.shadowColor='#000';c.shadowBlur=4;
  if(options.showName!==false&&!state.hideTrainerName){c.fillText(player().name||'Treinador',x,y-59*scale);W.PsySeason?.drawTitle(c,x,y-76*scale)}c.restore();
  return usedSprite;
}

function drawInterior(c,inside){
  if(inside.art){const art=image(inside.art);if(art?.loaded){c.imageSmoothingEnabled=true;c.drawImage(art.im,0,0,inside.w,inside.h);}else{c.fillStyle='#182c35';c.fillRect(0,0,inside.w,inside.h);}return;}
  if(inside.paint){
    c.imageSmoothingEnabled=false;
    c.drawImage(inside.paint,0,0,inside.w,inside.h);
  }else{
    c.fillStyle='#263d50';c.fillRect(0,0,inside.w,inside.h);
  }
  // Original Kanto campaign artwork, restored from the project's earlier
  // GitHub branch. Framed environmental illustrations, not debug labels.
  const scenes={
    center:'pallet-07.webp',market:'pallet-10.webp',
    lab:'pallet-03.webp',home:'pallet-08.webp',
    'house-east':'pallet-04.webp','house-west':'pallet-01.webp'
  };
  const file=scenes[inside.id];
  if(file){
    const scene=image('assets/kanto/cinematics/'+file),x=158,y=38,w=164,h=104;
    c.save();c.fillStyle='#423344';c.fillRect(x-6,y-6,w+12,h+12);
    c.fillStyle='#c59a65';c.fillRect(x-3,y-3,w+6,h+6);
    if(scene?.loaded){c.imageSmoothingEnabled=true;c.drawImage(scene.im,x,y,w,h)}
    else{c.fillStyle='#334e5f';c.fillRect(x,y,w,h)}
    c.fillStyle='#f7e3be';c.fillRect(x-6,y-6,w+12,3);
    c.restore();
  }
}
function currentTargets(){const targets=state.inside?[{type:state.inside.id===RIFT_ID?'rift-exit':'exit',at:state.inside.exit||[400,435]},...(state.inside.npcs||[]).map(n=>({type:'npc',at:n.at,ref:n}))]:[...(state.world.id==='route-1'?[{type:'return',at:[108,420]}]:state.world.id==='viridian'?[{type:'return',at:state.world.return}]:[]),...(state.world.npcs||[]).map(n=>({type:'npc',at:n.at,ref:n})),...(state.world.doors||[]).map(d=>({type:'door',at:d.at,ref:d})),{type:'exit',at:state.world.exit}];if(state.huntRiftSession)targets.push({type:'rift-exit',at:RIFT_ROOM.exit});else if(state.huntRiftOffer)targets.push({type:'rift',at:[state.huntRiftOffer.x,state.huntRiftOffer.y]});return targets}
function interact(){if(!state.root?.classList.contains('open')||state.dialogOpen)return;state.pendingHobby=null;
const scene=state.inside?.id||state.world?.id;
if(state.huntRiftSession){const gate=state.inside?.exit||RIFT_ROOM.exit;if(Math.hypot(gate[0]-state.position.x,gate[1]-state.position.y)<78){returnFromHuntRift(false);return}const node=W.PsyHobbies?.nearby?.(RIFT_ID,state.position,65);if(node){W.PsyHobbies?.interact?.(RIFT_ID,node.id,{x:state.position.x,y:state.position.y,facing:state.facing});return}showDialog('Fenda Selvagem','A passagem luminosa ao norte leva você de volta. A coleta e a pesca usam as mesmas regras do mundo exterior.');return;}
if(state.huntRiftOffer&&Math.hypot(state.huntRiftOffer.x-state.position.x,state.huntRiftOffer.y-state.position.y)<78){enterHuntRift();return;}
const gather=W.PsyHobbies?.nearby?.(scene,state.position,65);
if(gather){W.PsyHobbies?.interact?.(scene,gather.id,{x:state.position.x,y:state.position.y,facing:state.facing});return;}
const targets=currentTargets().map(v=>({...v,d:Math.hypot(v.at[0]-state.position.x,v.at[1]-state.position.y)})).sort((a,b)=>a.d-b.d);const a=targets[0];if(!a||a.d>70){showDialog('Exploração','Aproxime-se das portas, dos moradores ou da saída. Toque no chão para caminhar ou arraste para usar o joystick.');return}
activateTarget(a)}
function activateTarget(a){if(a.type==='rift'){enterHuntRift();return}if(a.type==='rift-exit'){returnFromHuntRift(false);return}if(a.type==='return'){if(state.world?.id==='viridian')open('route-1',{spawn:[844,100],skipGuard:true});else open('pallet',{spawn:[525,60]});return}if(a.type==='door'){enterDoor(a.ref);return}if(a.type==='exit'){if(state.inside){exitDoor();return}exitWorld();return}talk(a.ref)}
function talk(npc){
 const id=npc.id,pr=npc.portrait||npc.sprite||'',em=npc.emote||'sereno';
 if(id==='viridian-elder'){
    mark('viridianTalked');
    const campaign=W.PsyKantoPlayableV1?.progress?.();
    if(campaign){const ps=campaign.places.viridian||(campaign.places.viridian={talked:false,found:[],solved:[],cleared:false});ps.talked=true;try{W.autoSave?.()}catch(_){}}
    showDialog('Ancião de Viridian','A saída para a Rota 2 fica ao norte. O caminho contorna o Ginásio pelo lado oeste e está livre. Se quiser, posso guiar você até o portão.',[
      {text:'IR PARA A ROTA 2',primary:true,run:()=>W.PsyCampaignAutomation?.startPrimaryRoute?.()},
      {text:'CONTINUAR EXPLORANDO'}
    ],pr,em);
  }else if(id==='viridian-teacher'){
    showDialog('Instrutora da Escola','Aprenda sobre vantagens de tipos e efeitos de status. Recupere sua equipe no Centro Pokémon antes de desafiar Brock, em Pewter.',[],pr,em);
  }else if(id==='oak'){
  if(W.PsyKantoStoryV49&&!W.PsyKantoStoryV49.hasSeen('professorResearch'))return W.PsyKantoStoryV49.professor(npc,()=>{mark('oak');hud();});
  showDialog('Professor Car’alho','Toda grande jornada começa com uma escolha. Em Pallet, conheça quem cuida dos Pokémon e quem prepara seus suprimentos. Agora você pode seguir para a Rota 1 quando quiser.',[
   {text:'ENTENDI',primary:true,run:()=>mark('oak')}],pr,em);
 }else if(id==='gate'){
  const q=progress();
  if(!q.oak||!q.center||!q.market){
   const missing=[!q.oak?'o laboratório':'',!q.center?'o Centro Pokémon':'',!q.market?'o Poké Mart':''].filter(Boolean);
   showDialog('Guarda da Rota','Car’alho pediu que ninguém partisse sem preparo. Visite '+missing.join(', ')+'. Então a trilha estará livre.',[],pr,'atento');
  }else{
   mark('guard');
   showDialog('Guarda da Rota','Boa viagem! A Rota 1 está livre. Explore os quatro campos de caça e prossiga com cuidado até Viridian.',[
     {text:'SEGUIR PARA ROTA 1',primary:true,run:()=>open('route-1')},
     {text:'EXPLORAR PALLET'}],pr,'alegre');
  }
 }else if(id==='lia'){
  mark('lia');
  showDialog('Rival','Também estou começando minha jornada. Ouvi histórias antigas no porto; Mina, na casa do lado leste, talvez saiba mais sobre aquela luz que surge ao anoitecer.',[],pr,'empolgada');
 }else if(id==='neighbor'||id==='child'){
  mark('neighbor');
  showDialog('Mina','Dizem que há marcas escondidas entre as flores da vila. O velho pescador Abel costuma contar como encontrá-las.',[],pr,'curiosa');
 }else if(id==='nurse'){
  mark('center');
  showDialog('Enfermeira Íris','Seus parceiros também precisam de descanso. Posso recuperar a energia da sua equipe antes da jornada?',[
   {text:'CURAR EQUIPE',primary:true,run:healTeam},{text:'AGORA NÃO'}],pr,'acolhedora');
 }else if(id==='vendor'){
  mark('market');
  showDialog('Davi, o lojista','O pessoal de Pallet começa sempre pelo básico: Poké Bolas, remédios e um pouco de coragem. Precisa de alguma coisa?',[
    {text:'VER MERCADORIAS',primary:true,run:openShop},{text:'VOLTAR'}],pr,'animado');
 }else if(id==='assistant'){
  showDialog('Pesquisador Elias','Car’alho procura registros de habitats e fenômenos nas florestas de Kanto. Registre o que encontrar na Rota 1.',[],pr,'curiosa');
 }else if(id==='mother'){
  showDialog('Elisa','Preparei sua mochila e deixei a casa aberta. Quando sentir saudade, volte para descansar. O Professor Car’alho já está esperando você.',[],pr,'carinhosa');
 }else if(id==='fisher'){
  mark('fisher');
  showDialog('Seu Abel','Vi luzes no bosque depois da última chuva. Um dia, com as técnicas certas, você poderá alcançar lugares que hoje parecem impossíveis.',[],pr,'tranquilo');
 }else{
  showDialog(npc.name,'Pallet parece pequena, mas guarda histórias em cada esquina. Volte quando descobrir mais sobre Kanto.',[],pr,em);
 }
}
function makeCaveRoom(){
 return {
  id:'route-cave',title:'Gruta dos Cristais',w:900,h:675,
  art:'assets/kanto/caves/crystal-grotto-v1.webp',spawn:[450,254],exit:[450,207],npcs:[],
  walkBounds:[35,180,865,645],blocks:[[90,535,169,580],[733,213,811,257]],
  encounter:{pool:'kanto_cave_t1',area:'crystal-grotto',stepDistance:40,chance:.14,cooldownMs:6500}
 };
}
function enterDoor(door){
 state.navRequest++;state.navCells.clear();
 const id=door.id;
 if(state.world?.id==='viridian'&&id==='gym'){showDialog('Ginásio de Viridian','Este Ginásio permanece fechado nesta etapa da campanha. Procure a passagem para a Rota 2.',[]);return;}
 if(state.world?.id==='viridian'&&id==='school'){showDialog('Escola de Treinadores','Conheça os tipos, os estados de batalha e a preparação da equipe. Converse com a instrutora no pátio.',[]);return;}
 const room=id==='route-cave'?makeCaveRoom():W.PsyKantoInteriorsV9?.get?.(id);
 if(!room){
  showDialog('Porta fechada','Você ainda não pode entrar aqui.');return;
 }
 state.lastOutdoor={...state.position};
 state.inside={...room,title:id==='lab'?'Laboratório':door.title,paint:room.paint};
 state.position={x:room.spawn[0],y:room.spawn[1]};
 state.path=[];state.held.clear();
 if(room.art)image(room.art);room.npcs.forEach(n=>{image(n.sprite);if(n.portrait)image(n.portrait)});
 hud();draw();

}
function exitDoor(){state.navRequest++;state.navCells.clear();state.inside=null;if(state.lastOutdoor)state.position={...state.lastOutdoor};state.lastOutdoor=null;state.path=[];hud()}
function healTeam(){const p=player();if(Array.isArray(p.team))for(const mon of p.team){const hp=Number(mon.maxHp||mon.maxHP||mon.hpMax||0);if(hp>0)mon.hp=hp}try{W.updateHUD?.();W.autoSave?.()}catch(_){}showDialog('Enfermeira','Sua equipe foi recuperada. Boa viagem!')}
function openShop(){const fn=W.openShop;close();if(typeof fn==='function')fn();else{state.root?.classList.add('open');showDialog('Davi, o lojista','Minhas mercadorias já estão separadas. Em breve você poderá negociá-las aqui mesmo.')}}
function exitWorld(){if(state.world.id==='viridian'){
 const campaign=W.PsyKantoPlayableV1?.progress?.(),ps=campaign?.places?.viridian;
 if(!progress().viridianTalked&&!ps?.talked){showDialog('Passagem para Rota 2','Converse com o ancião de Viridian antes de seguir.',[{text:'ENTENDI'}]);return}
 if(ps){ps.talked=true;ps.cleared=true}
 try{const save=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');save.visited=[...new Set([...(save.visited||[]),'pallet','route-1','viridian'])];save.activePlace='route-2';localStorage.setItem(SAVE_KEY,JSON.stringify(save))}catch(_){}
 try{W.autoSave?.()}catch(_){}
 const enterRoute2=()=>{close();W.PsyKantoPlayableV1?.open?.('route-2')};
 if(W.PsyCampaignAutomation?.isAutoRouting?.()){enterRoute2();return;}
 showDialog('Rota 2','Você encontrou a passagem norte. Depois da Rota 2, o caminho segue para a Floresta de Viridian.',[{text:'SEGUIR PARA ROTA 2',primary:true,run:enterRoute2},{text:'CONTINUAR EM VIRIDIAN'}]);return;
}
if(state.world.id==='pallet'){if(!questDone()){showDialog('Passagem para Rota 1','Antes de seguir para a Rota 1, converse com o Professor Car’alho no laboratório.',[{text:'ENTENDI'}]);return}open('route-1');return}
mark('viridian');try{const save=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');save.visited=[...new Set([...(save.visited||[]),'pallet','route-1'])];save.activePlace='viridian';localStorage.setItem(SAVE_KEY,JSON.stringify(save))}catch(_){}
showDialog('Viridian City','Você atravessou a Rota 1! A entrada de Viridian está desbloqueada. Conheça a Escola de Treinadores e procure a passagem para a Rota 2.',[{text:'ENTRAR EM VIRIDIAN',primary:true,run:()=>{close();W.PsyKantoPlayableV1?.open?.('viridian')}},{text:'VOLTAR'}]);}
function touchCoords(e){const r=state.canvas.getBoundingClientRect();const cam=camera();return {x:(e.clientX-r.left)*(cam.w/r.width)/cam.scale-cam.ox/cam.scale,y:(e.clientY-r.top)*(cam.h/r.height)/cam.scale-cam.oy/cam.scale}}
function touchStart(e){if(e.target!==state.canvas||state.dialogOpen||state.huntRiftFrozen||state.touch)return;
 const point=touchCoords(e),room=state.inside?.id;
 if(room&&['home','house-east','house-west'].includes(room)){
   const idx=W.PsyHobbies?.decorAt?.(room,point.x,point.y)??-1;
   if(idx>=0){e.preventDefault();state.decorDrag={id:e.pointerId,index:idx};state.canvas.setPointerCapture?.(e.pointerId);return;}
 }
W.PsyCampaignAutomation?.cancelRoute?.();autoHunt=false;e.preventDefault();const t=point;state.touch={id:e.pointerId,x:e.clientX,y:e.clientY,tx:t.x,ty:t.y,t:performance.now(),drag:false,rect:state.canvas.getBoundingClientRect()};state.pendingHobby=null;state.pendingRiftTarget=null;state.navRequest++;state.canvas.setPointerCapture?.(e.pointerId);state.path=[]}
function touchMove(e){
 if(state.decorDrag?.id===e.pointerId){e.preventDefault();const pt=touchCoords(e);W.PsyHobbies?.moveDecor?.(state.decorDrag.index,pt.x,pt.y,state.inside,false);draw();return;}
 const t=state.touch;if(!t||t.id!==e.pointerId)return;e.preventDefault();let dx=e.clientX-t.x,dy=e.clientY-t.y;const distance=Math.hypot(dx,dy);if(distance>72){t.x+=dx/distance*(distance-72);t.y+=dy/distance*(distance-72);dx=e.clientX-t.x;dy=e.clientY-t.y;}if(Math.hypot(dx,dy)>7)t.drag=true;if(t.drag){const d=Math.max(1,Math.hypot(dx,dy));state.joy=W.PsyTouchStick.vector(dx,dy);const stick=state.root.querySelector('.kw2-joystick'),r=t.rect;stick.style.left=(t.x-r.left)+'px';stick.style.top=(t.y-r.top)+'px';stick.style.display='block';stick.style.setProperty('--jx',Math.round((dx/d*Math.min(30,d)))+'px');stick.style.setProperty('--jy',Math.round((dy/d*Math.min(30,d)))+'px')}}
function resetTouch(){state.joy=null;state.touch=null;state.held.clear();const stick=state.root?.querySelector('.kw2-joystick');if(stick)stick.style.display='none';}
function touchCancel(e){if(state.decorDrag?.id===e.pointerId)state.decorDrag=null;if(state.touch?.id===e.pointerId)resetTouch();}
function queueHobbyApproach(scene,node){
 const actor=state.position,request=++state.navRequest,pending={scene,id:node.id,searching:true};state.pendingHobby=pending;state.path=[];
 const base=Math.atan2(actor.y-node.y,actor.x-node.x),turns=[0,1,-1,2,-2,3,-3,4];
 (async()=>{
  for(const turn of turns){
   if(request!==state.navRequest||state.pendingHobby!==pending)return;
   const angle=base+turn*Math.PI/4,destination=[node.x+Math.cos(angle)*48,node.y+Math.sin(angle)*48];
   const route=await findPath([state.position.x,state.position.y],destination,request);
   if(request!==state.navRequest||state.pendingHobby!==pending)return;
   if(route.length){pending.searching=false;state.path=route;return;}
  }
  pending.searching=false;
  if(Math.hypot(node.x-state.position.x,node.y-state.position.y)>=65){state.pendingHobby=null;W.notif?.('Não há um caminho livre até esse recurso.',2200);}
 })();
}
function touchEnd(e){
 if(state.decorDrag?.id===e.pointerId){e.preventDefault();const pos=touchCoords(e);W.PsyHobbies?.moveDecor?.(state.decorDrag.index,pos.x,pos.y,state.inside,true);state.decorDrag=null;draw();return;}
 const t=state.touch;if(!t||t.id!==e.pointerId)return;e.preventDefault();state.joy=null;state.touch=null;state.root.querySelector('.kw2-joystick').style.display='none';if(!t.drag){
const scene=state.inside?.id||state.world?.id;
const riftTarget=currentTargets().find(v=>(v.type==='rift'||v.type==='rift-exit')&&Math.hypot(v.at[0]-t.tx,v.at[1]-t.ty)<48);
if(riftTarget){if(Math.hypot(riftTarget.at[0]-state.position.x,riftTarget.at[1]-state.position.y)<78)activateTarget(riftTarget);else{state.pendingRiftTarget=riftTarget;const request=++state.navRequest;findPath([state.position.x,state.position.y],riftTarget.at,request).then(path=>{if(request===state.navRequest&&state.root?.classList.contains('open'))state.path=path});}return;}
if(state.inside&&W.PsyHobbies?.place?.(state.inside.id,t.tx,t.ty,state.inside)){draw();return;}
const gather=W.PsyHobbies?.nearby?.(scene,{x:t.tx,y:t.ty},28);
if(gather){if(Math.hypot(gather.x-state.position.x,gather.y-state.position.y)<65){state.pendingHobby=null;W.PsyHobbies?.interact?.(scene,gather.id,{x:state.position.x,y:state.position.y,facing:state.facing});draw()}else queueHobbyApproach(scene,gather);return;}
const near=currentTargets().find(v=>Math.hypot(v.at[0]-t.tx,v.at[1]-28-t.ty)<(v.type==='npc'?44:30)&&(v.type==='npc'||Math.hypot(v.at[0]-state.position.x,v.at[1]-state.position.y)<70));if(near){activateTarget(near);return}const request=++state.navRequest;findPath([state.position.x,state.position.y],[t.tx,t.ty],request).then(path=>{if(request===state.navRequest&&state.root?.classList.contains('open'))state.path=path})}}
// Tap-to-walk searches asynchronously, yielding control to the game each frame.
// Terrain queries are memoized per location; dragging joystick cancels old searches.
function findPath(from,to,request){
  const step=10,world=state.inside||state.world;
  const nx=Math.ceil(world.w/step),ny=Math.ceil(world.h/step);
  const key=(x,y)=>x+','+y,cx=x=>Math.round(x/step);
  const valid=(x,y)=>{
    if(x<0||y<0||x>=nx||y>=ny)return false;
    const k=key(x,y);if(state.navCells.has(k))return state.navCells.get(k);
    const ok=positionValid(x*step,y*step);
    state.navCells.set(k,ok);return ok;
  };
  const straight=(x1,y1,x2,y2)=>{
    const d=Math.hypot(x2-x1,y2-y1),parts=Math.ceil(d/2.5);
    for(let j=1;j<=parts;j++){const t=j/parts;if(!positionValid(x1+(x2-x1)*t,y1+(y2-y1)*t))return false}
    return true;
  };
  if(positionValid(to[0],to[1])&&straight(from[0],from[1],to[0],to[1]))
    return Promise.resolve([[to[0],to[1]]]);
  let ax=cx(from[0]),ay=cx(from[1]),bx=cx(to[0]),by=cx(to[1]);
  // A valid grid cell is not enough: the segment from the actor to its cell
  // center must also clear every collision. Otherwise the first waypoint can
  // sit behind a fence or on the far side of a narrow corner and movement
  // stalls even though A* found a route through valid cell centers.
  if(!valid(ax,ay)||!straight(from[0],from[1],ax*step,ay*step)){
    let nearest=null,score=Infinity;
    for(let r=1;r<=4;r++)for(let yy=-r;yy<=r;yy++)for(let xx=-r;xx<=r;xx++){
      if(Math.abs(xx)!==r&&Math.abs(yy)!==r)continue;
      const x=ax+xx,y=ay+yy;
      if(!valid(x,y)||!straight(from[0],from[1],x*step,y*step))continue;
      const scoreNow=xx*xx+yy*yy;if(scoreNow<score){nearest=[x,y];score=scoreNow;}
    }
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
          const startCell=[ax*step,ay*step];
          const route=[],path=[from,...(Math.hypot(from[0]-startCell[0],from[1]-startCell[1])>.5?[startCell]:[]),...nodes];
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
          // Clearance at cell centers can still hide an obstructed edge.
          // Test the whole 10px step before adding it to the search graph.
          if(!straight(current.x*step,current.y*step,x*step,y*step))continue;
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
W.PsyKantoWorldV2={isOpen:()=>!!state.root?.classList.contains('open'),drawTrainer:(ctx,x,y,options)=>drawPlayer(ctx,x,y,options),dismissMenu:()=>toggleCampaignMenu(false),openMenuPanel:openCampaignPanel,suspendForPanel:suspendCampaignForPanel,setStoryLock(active){state.suspended=!!active;state.dialogOpen=!!active;state.pendingHobby=null;state.path=[];state.held.clear();state.joy=null;state.touch=null;state.navRequest++;if(active)autoHunt=false;},interact,leaveInterior:exitDoor,enterPlace:id=>{const door=state.world?.doors?.find(d=>d.id===id);if(door)enterDoor(door);},
 navigate:async function(at){autoHunt=false;state.pendingHobby=null;state.path=[];const request=++state.navRequest;const route=await findPath([state.position.x,state.position.y],at,request);if(request===state.navRequest)state.path=route;if(state.root)state.root.dataset.navigationState=route.length?'following':'unreachable';return route.length>0;},
 setAutoHunt:function(active){state.pendingHobby=null;if(active&&!vipActive()){if(!W.PsyCampaignAutomation?.showVipGate?.('hunt'))showDialog('VIP necessário','Auto Hunt e auto batalha são benefícios VIP.');return false;}if(active&&!progress().oak){showDialog('Jornada','Converse primeiro com o Professor Car’alho.');return false;}if(active&&state.world?.id!=='route-1')open('route-1');if(active&&state.inside)exitDoor();autoHunt=!!active;if(!autoHunt){state.path=[];state.navRequest++;huntPlanning=false;state.held.clear();state.joy=null;}return autoHunt;},
 isAutoHunt:()=>autoHunt,
 open,close,data:DATA,referenceViewport:routeOneViewport,progress,walkable:(id,x,y)=>DATA.walkable(id==='pallet'?DATA.pallet:id==='viridian'?DATA.viridian:DATA.route1,x,y),getPosition:()=>({world:state.world?.id,inside:state.inside?.id||null,x:state.position.x,y:state.position.y})};
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
