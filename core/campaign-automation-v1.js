/* Campaign quest tracking and VIP automation. Test branch only. */
(function(W,D){
'use strict';
let automatic=false,catchEnabled=false,lastAction=0,findTask=null,findAt=0,extra=[],huntController=null,huntIntent=false;
const player=()=>typeof P!=='undefined'?P:{};
const vip=()=>Number(player().meta?.vipUntil||0)>Date.now();
const api=()=>W.PsyKantoWorldV2?.isOpen?.()?W.PsyKantoWorldV2:(W.PsyKantoPlayableV1?.getPosition?.()?W.PsyKantoPlayableV1:W.PsyKantoWorldV2);
const note=t=>W.notif?.(t,2600);
function supportUrl(){const value=String(W.PSYWORLD_SUPPORT_URL||W.PsySupport?.donationUrl||'').trim();return /^https:\/\/[^\s]+$/i.test(value)?value:'';}
function openVipGate(feature='hunt'){
 const old=D.getElementById('psy-vip-gate');if(old){old.querySelector('[data-vip-close]')?.focus?.();return old;}
 const root=D.createElement('section');root.id='psy-vip-gate';root.className='psy-vip-gate';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','psy-vip-gate-title');
 const card=D.createElement('div');card.className='psy-vip-gate-card';
 const close=D.createElement('button');close.type='button';close.className='psy-vip-gate-close';close.dataset.vipClose='1';close.setAttribute('aria-label','Fechar aviso VIP');close.textContent='×';close.onclick=()=>root.remove();
 const ribbon=D.createElement('div');ribbon.className='psy-vip-gate-ribbon';ribbon.textContent=feature==='hunt'?'AUTO HUNT · BENEFÍCIO VIP':'AUTOMAÇÃO · BENEFÍCIO VIP';
 const hero=D.createElement('div');hero.className='psy-vip-gate-hero';hero.setAttribute('aria-hidden','true');const mascot=D.createElement('div');mascot.className='psy-vip-gate-mascot';hero.appendChild(mascot);
 const heading=D.createElement('div');heading.className='psy-vip-gate-heading';const eyebrow=D.createElement('small');eyebrow.textContent='PSYWORLD · PASSE DE TREINADOR';const title=D.createElement('h2');title.id='psy-vip-gate-title';title.textContent='Um atalho VIP para sua jornada';heading.append(eyebrow,title);
 const copy=D.createElement('p');copy.className='psy-vip-gate-copy';copy.textContent='Opa! Parece que você ainda não tem VIP. Você pode conhecer as opções oficiais para conseguir PsyCoins participando de eventos, apoiando o servidor ou explorando o Survivor do Psyduck.';
 const actions=D.createElement('div');actions.className='psy-vip-gate-actions';
 const survivor=D.createElement('button');survivor.type='button';survivor.className='psy-vip-gate-button survivor';survivor.textContent='🦆 SURVIVOR';survivor.onclick=()=>{root.remove();const world=W.PsyKantoWorldV2;if(world?.isOpen?.())world.close?.();if(typeof W.openPsyduckDungeon5==='function')W.openPsyduckDungeon5();else if(typeof W.psy19OpenPsyduck==='function')W.psy19OpenPsyduck();else note('O Survivor do Psyduck não está disponível agora.');};
 const supportStatus=D.createElement('small');supportStatus.className='psy-vip-gate-foot';supportStatus.textContent='A automação permanece bloqueada sem VIP.';
 const support=D.createElement('button');support.type='button';support.className='psy-vip-gate-button support';support.textContent='✦ APOIAR O SERVIDOR';support.onclick=()=>{const url=supportUrl();if(url){root.remove();W.open?.(url,'_blank','noopener,noreferrer');return;}const message='O canal oficial de apoio ainda não está disponível por aqui.';supportStatus.textContent=message;supportStatus.setAttribute('role','status');supportStatus.setAttribute('aria-live','polite');note(message);};actions.append(survivor,support);
 const foot=supportStatus;
 card.append(close,ribbon,hero,heading,copy,actions,foot);root.appendChild(card);root.addEventListener('click',e=>{if(e.target===root)root.remove()});root.addEventListener('keydown',e=>{if(e.key==='Escape')root.remove()});D.body.appendChild(root);close.focus?.();return root;
}
function requireVip(feature='hunt'){if(vip())return true;openVipGate(feature);return false;}
function setAutomatic(on){if(on&&!requireVip('battle'))return false;automatic=!!on;renderButtons();return automatic;}
const style=D.createElement('style');style.textContent=`
#psy-campaign-quests{position:absolute;top:4px;right:6px;z-index:4;width:min(210px,44%);padding:5px;border:1px solid #d6ae61;border-radius:12px;background:#101b2be8;color:#eef5ff;font:12px/1.35 system-ui;box-sizing:border-box;pointer-events:auto}
#psy-campaign-quests .pq-row{display:grid;grid-template-columns:1fr auto;gap:7px;align-items:center;padding:4px 0;border-bottom:1px solid #ffffff15}
#psy-campaign-quests small{display:block;color:#ffdb8a;font-size:10px;font-weight:800}
#psy-campaign-quests button,#psy-campaign-tools button,#psy-auto-battle button{min-height:36px;padding:7px 10px;border:1px solid #68baba;border-radius:9px;background:#163b50;color:#fff;font:bold 11px system-ui;cursor:pointer}
#psy-campaign-tools{position:absolute;bottom:10px;right:10px;z-index:4;display:flex;gap:6px}
#psy-auto-battle{position:absolute;top:46px;left:50%;transform:translateX(-50%);z-index:10;display:flex;gap:6px;max-width:96%}
#psy-auto-battle button[aria-pressed=true],#psy-campaign-tools button[aria-pressed=true]{background:#1d705a;border-color:#86efac}
@media(max-width:600px){#psy-campaign-quests{width:44%;font-size:10px;padding:4px}#psy-auto-battle button{font-size:10px;padding:6px;min-height:34px}}
 #psy-campaign-tools[hidden],#psy-campaign-quests[hidden]{display:none!important}
#btn-idle-realistic-float,[data-mode-card=idleworld]{display:none!important}
#psy-campaign-tools button{border:2px solid #e5c27b;background:linear-gradient(140deg,#352b59,#1a2547 58%,#143848);box-shadow:inset 0 1px #ffffff44,0 4px 12px #0008;text-shadow:0 1px 3px #000}
.psy-vip-gate{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:clamp(10px,3vw,28px);background:radial-gradient(ellipse at 50% 20%,#55347c66,transparent 55%),#050817e8;backdrop-filter:blur(8px);box-sizing:border-box}
.psy-vip-gate *{box-sizing:border-box}
.psy-vip-gate-card{position:relative;width:min(550px,100%);padding:24px 26px 20px;border:2px solid #d6b56f;outline:2px solid #7652a7;outline-offset:4px;background:radial-gradient(ellipse at 76% 5%,#6f4ba244,transparent 50%),linear-gradient(150deg,#162b45,#171a36 58%,#0c2133);box-shadow:0 22px 70px #000c,inset 0 1px #fff5;color:#f4f5fb;overflow:hidden}
.psy-vip-gate-card:before,.psy-vip-gate-card:after{content:"✦";position:absolute;color:#f7cf76;text-shadow:0 0 12px #e6b85a;pointer-events:none}.psy-vip-gate-card:before{top:10px;left:12px}.psy-vip-gate-card:after{right:14px;bottom:10px}
.psy-vip-gate-close{position:absolute;right:10px;top:10px;z-index:2;width:40px;height:40px;border:1px solid #e9c58a;border-radius:9px;background:#382846;color:#fff;font-size:24px;cursor:pointer}
.psy-vip-gate-ribbon{display:inline-block;margin:0 44px 10px 0;padding:5px 9px;border:1px solid #f2ca79;background:#352b42;color:#ffe3a3;font:bold 10px/1.2 system-ui;letter-spacing:.1em}
.psy-vip-gate-hero{float:left;width:112px;height:122px;margin:0 16px 8px 0;display:grid;place-items:center;border:1px solid #b392e2;background:radial-gradient(circle,#f3bd4866,#3a2c5644 65%,transparent 66%);image-rendering:pixelated}
.psy-vip-gate-mascot{width:96px;height:112px;background:url("assets/psyduck/normal.png") 0 0/400% 600% no-repeat;image-rendering:pixelated;filter:drop-shadow(0 5px 5px #0009)}
.psy-vip-gate-heading small{color:#8de6e2;font:800 10px system-ui;letter-spacing:.14em}
.psy-vip-gate-heading h2{margin:5px 42px 8px 0;color:#fff0c5;font:900 clamp(20px,4vw,28px)/1.1 Georgia,serif;text-shadow:0 0 14px #dfb8ec77}
.psy-vip-gate-copy{min-height:74px;margin:0 0 16px;color:#dce6f4;font:14px/1.55 system-ui}
.psy-vip-gate-actions{clear:both;display:grid;grid-template-columns:1fr 1.25fr;gap:10px}
.psy-vip-gate-button{min-height:48px;padding:10px;border:2px solid #f2d490;background:linear-gradient(140deg,#8b5624,#713b65);color:#fff5df;font:900 12px system-ui;letter-spacing:.03em;box-shadow:inset 0 1px #ffffff6b,0 5px 12px #0006;cursor:pointer;touch-action:manipulation}
.psy-vip-gate-button.survivor{background:linear-gradient(135deg,#7a591f,#326a70);border-color:#f5d176}
.psy-vip-gate-button.support{background:linear-gradient(135deg,#65509a,#1c6071);border-color:#9de9e4}
.psy-vip-gate-button:hover{filter:brightness(1.14);transform:translateY(-1px)}
.psy-vip-gate-foot{display:block;margin-top:14px;color:#aebdd2;text-align:center;font:11px system-ui}
@media(max-width:480px){.psy-vip-gate-card{padding:20px 16px 16px}.psy-vip-gate-hero{width:82px;height:96px;margin-right:11px}.psy-vip-gate-mascot{width:72px;height:84px}.psy-vip-gate-copy{font-size:13px;min-height:92px}.psy-vip-gate-actions{grid-template-columns:1fr}.psy-vip-gate-button{min-height:46px}}
@media(prefers-reduced-motion:reduce){.psy-vip-gate-button{transition:none}.psy-vip-gate-button:hover{transform:none}}
`;D.head.appendChild(style);
const tracker=D.createElement('section');tracker.id='psy-campaign-quests';tracker.setAttribute('aria-label','Quests ativas');
const tools=D.createElement('div');tools.id='psy-campaign-tools';
const hunt=D.createElement('button');hunt.textContent='AUTO HUNT · VIP';hunt.onclick=()=>{if(huntActive()){stopAutomation();return;}if(requireVip('hunt'))configure('hunt');};tools.appendChild(hunt);
const bar=D.createElement('div');bar.id='psy-auto-battle';
const battleButton=D.createElement('button');battleButton.onclick=()=>{if(automatic){stopAutomation();return;}if(requireVip('battle'))configure('battle');};
const catchButton=D.createElement('button');catchButton.onclick=()=>{if(catchEnabled){catchEnabled=false;renderButtons();return;}if(requireVip('capture'))configure('capture');};bar.append(battleButton,catchButton);
function renderButtons(){
 battleButton.textContent=automatic?'AUTO BATALHA · ON':'AUTO BATALHA · VIP';battleButton.setAttribute('aria-pressed',String(automatic));
 catchButton.textContent=catchEnabled?'AUTO CAPTURA · ON':'AUTO CAPTURA · VIP';catchButton.setAttribute('aria-pressed',String(catchEnabled));
 hunt.textContent=huntActive()?'AUTO HUNT · ON':'AUTO HUNT · VIP';hunt.setAttribute('aria-pressed',String(huntActive()));
}
function preferences(){const p=player();p.meta=p.meta||{};return p.meta.automationV47||(p.meta.automationV47={ball:'Pokéball',potion:'Poção 100',healAt:40,catchAt:35});}
function huntActive(){return huntIntent||!!huntController?.isAutoHunt?.()||!!W.PsyKantoWorldV2?.isAutoHunt?.()||!!W.PsyKantoPlayableV1?.isAutoHunt?.();}
function stopAutomation(){findTask=null;huntIntent=false;automatic=false;catchEnabled=false;for(const ctl of new Set([huntController,W.PsyKantoWorldV2,W.PsyKantoPlayableV1]))ctl?.setAutoHunt?.(false);huntController=null;D.getElementById('psy-auto-config')?.remove();renderButtons();note('Automação desativada.');}
function configure(mode){
 D.getElementById('psy-auto-config')?.remove();const cfg=preferences(),bag=player().inventory||{};
 const balls=Object.keys(bag).filter(k=>bag[k]>0&&(W.PSY_ITEMS?.category?.(k)==='ball'||(typeof BALL_DATA!=='undefined'&&Object.hasOwn(BALL_DATA,k))));
 const pots=Object.keys(bag).filter(k=>bag[k]>0&&/poção|potion/i.test(k));
 const box=D.createElement('section');box.id='psy-auto-config';box.className='psy-session-modal';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Configurar automação');
 const card=D.createElement('div');box.appendChild(card);const title=D.createElement('h2');title.textContent=mode==='capture'?'Preparar auto captura':mode==='hunt'?'Preparar Auto Hunt':'Preparar auto batalha';card.appendChild(title);
 const help=D.createElement('p');help.textContent='Confira os suprimentos antes de confirmar. Só os itens escolhidos serão usados. Desativar interrompe novos movimentos e turnos automáticos; um golpe já iniciado termina normalmente.';card.appendChild(help);
 function select(label,values,current,none){const l=D.createElement('label');l.textContent=label;const el=D.createElement('select');el.setAttribute('aria-label',label);if(none){const op=D.createElement('option');op.value='';op.textContent='Não usar poção';el.appendChild(op);}for(const k of values){const op=D.createElement('option');op.value=k;op.textContent=k+' ×'+bag[k];el.appendChild(op);}if(values.includes(current)||none&&current==='')el.value=current;l.appendChild(el);card.appendChild(l);return el;}
 const ball=mode==='capture'?select('Ball principal',balls,cfg.ball,false):null;
 const potion=select('Poção principal',pots,cfg.potion,true);
 function percent(label,value){const l=D.createElement('label');l.textContent=label;const n=D.createElement('input');n.type='number';n.min='10';n.max='80';n.value=String(value);n.setAttribute('aria-label',label);l.appendChild(n);card.appendChild(l);return n;}
 const heal=percent('Curar abaixo de HP (%)',cfg.healAt),capture=mode==='capture'?percent('Capturar abaixo de HP inimigo (%)',cfg.catchAt):null;
 const warn=D.createElement('p');warn.setAttribute('role','status');card.appendChild(warn);if(ball&&!balls.length)warn.textContent='Você não possui Balls de captura. Reabasteça para ativar.';
 const cancel=D.createElement('button');cancel.textContent='Cancelar';cancel.onclick=()=>box.remove();card.appendChild(cancel);
 const confirm=D.createElement('button');confirm.textContent='Confirmar e ativar';confirm.disabled=!!ball&&!balls.length;confirm.onclick=()=>{
  if(!requireVip(mode))return;const bag=player().inventory||{};if(ball&&!(bag[ball.value]>0)){warn.textContent='A Ball escolhida acabou. Selecione outra.';return;}if(potion.value&&!(bag[potion.value]>0)){warn.textContent='A poção escolhida acabou.';return;}
  if(!Number.isFinite(Number(heal.value))||Number(heal.value)<10||Number(heal.value)>80||capture&&(!Number.isFinite(Number(capture.value))||Number(capture.value)<10||Number(capture.value)>80)){warn.textContent='Use percentuais entre 10 e 80.';return;}
  cfg.potion=potion.value;cfg.healAt=Number(heal.value);if(ball){cfg.ball=ball.value;cfg.catchAt=Number(capture.value);catchEnabled=true;}
  if(mode==='hunt'){findTask=null;huntController=api();const active=huntController?.setAutoHunt(true);huntIntent=!!active;if(!active){warn.textContent='Conclua o objetivo da campanha antes de caçar automaticamente.';return;}}
  setAutomatic(true);W.autoSave?.();box.remove();renderButtons();W.PsyHuntSession?.message('config','Automação ativada · '+(ball?'Ball: '+cfg.ball+' · ':'')+'Poção: '+(cfg.potion||'nenhuma'));
 };card.appendChild(confirm);D.body.appendChild(box);W.PsyKantoWorldV2?.suspendForPanel?.('psy-auto-config');cancel.focus?.();
}
function questRows(){
 const chapter=W.PsyKantoPlayableV1?.questRows?.();
 const q=W.PsyKantoWorldV2?.progress?.()||{},pos=api()?.getPosition?.(),main=[];
 if(chapter?.length)main.push(...chapter);
 else if(!q.oak)main.push({id:'story-oak',kind:'main',title:'Fale com o Professor Car’alho',goal:'oak'});
 else if(!q.viridian)main.push({id:'story-route1',kind:'main',title:'Atravesse a Rota 1 até Viridian',goal:'viridian'});
 else main.push({id:'story-viridian',kind:'main',title:'Explore Viridian City',goal:'explore-viridian'});
 const raw=player().meta?.activeQuests||player().quests?.active||[];
 const active=(Array.isArray(raw)?raw:Object.values(raw)).map(q=>({...q,title:q.title||q.name||q.n,kind:q.kind||q.category||'side'}));
 return [...main,...active,...extra,...(W.PsyProfessions?.questRows?.()||[])].filter(q=>q&&q.title&&q.status!=='completed'&&q.status!=='claimed');
}
function controllerIsOpen(ctl){return ctl===W.PsyKantoPlayableV1?!!ctl?.getPosition?.():!!W.PsyKantoWorldV2?.isOpen?.();}
function viridianElderAt(){const at=W.PsyKantoMapDataV2?.viridian?.npcs?.find?.(npc=>npc.id==='viridian-elder')?.at;return Array.isArray(at)?at:[389,355];}
async function find(q){
 W.PsyKantoWorldV2?.dismissMenu?.();
 findTask=null;api()?.setAutoHunt(false);if(q.goal==='workshop'){if(W.PsyKantoWorldV2?.isOpen?.())W.PsyKantoWorldV2.openMenuPanel('professions');else W.PsyProfessions?.open('main');return;}
 if(q.goal==='chapter'){const ctl=api();if(ctl?.navigateObjective)ctl.navigateObjective(q.at);else ctl?.navigateTo?.(q.at);return;}
 if(q.goal==='oak'){
  let ctl=api(),p=ctl?.getPosition?.();if(!p||p.world!=='pallet'||!controllerIsOpen(ctl)){ctl?.open?.('pallet');ctl=api();p=ctl?.getPosition?.();}
  if(p?.inside&&p.inside!=='lab')ctl?.leaveInterior();
  findTask={goal:'oak',phase:api()?.getPosition?.().inside==='lab'?'professor':'lab'};
  findAt=0;await advanceFind();
 }else if(q.goal==='viridian'){
  let ctl=api();if(ctl?.getPosition?.().inside)ctl?.leaveInterior();
  if(ctl?.getPosition?.().world!=='route-1'||!controllerIsOpen(ctl)){ctl?.open?.('route-1');ctl=api();}
  const atGate=ctl?.getPosition?.();if(atGate?.world==='route-1'&&!atGate.inside&&Math.hypot(atGate.x-939,atGate.y-81)<=70){ctl.interact?.();note('Você chegou ao portão de Viridian.');return;}
  findTask={goal:'viridian-gate',target:[939,81],routing:true};findAt=0;
  const ok=await ctl?.navigate?.([939,81]);if(findTask){findTask.routing=false;findTask.routed=ok;}
  note(ok?'Seguindo pela trilha até o portão de Viridian.':'Não foi possível traçar uma rota até Viridian.');
 }else if(q.goal==='explore-viridian'){
  let ctl=api(),pos=ctl?.getPosition?.();
  if(pos?.world==='viridian'&&controllerIsOpen(ctl)){
   if(pos.inside)ctl?.leaveInterior();
   const talked=!!W.PsyKantoWorldV2?.progress?.()?.viridianTalked;
   if(talked){if(!pos.inside&&Math.hypot(pos.x-449,pos.y-43)<=75){findTask={goal:'viridian-exit',target:[449,43]};ctl?.interact?.();findTask=null;note('Você chegou à passagem norte.');return;}findTask={goal:'viridian-exit',target:[449,43],routing:true};findAt=0;const ok=await ctl?.navigate?.([449,43]);if(findTask){findTask.routing=false;findTask.routed=ok;}note(ok?'Seguindo até a passagem norte da Rota 2.':'Não foi possível traçar rota até o portão norte.');}
   else {const elder=viridianElderAt();if(!pos.inside&&Math.hypot(pos.x-elder[0],pos.y-elder[1])<=70){ctl?.interact?.();note('Você chegou ao ancião; a conversa da missão foi iniciada.');return;}findTask={goal:'viridian-elder',target:elder,routing:true};findAt=0;const ok=await ctl?.navigate?.(elder);if(findTask){findTask.routing=false;findTask.routed=ok;}note(ok?'Indo falar com o ancião de Viridian.':'Não foi possível traçar rota até o ancião.');}
  }else{
   const opened=ctl?.open?.('viridian',{skipGuard:true});
   if(opened){ctl=api();const elder=viridianElderAt();findTask={goal:'viridian-elder',target:elder,routing:true};findAt=0;const ok=await ctl?.navigate?.(elder);if(findTask){findTask.routing=false;findTask.routed=ok;}note(ok?'Viridian City: seguindo até o ancião para concluir a missão.':'Viridian City aberta, mas não foi possível traçar rota ao ancião.');}
   else note('Entre em Kanto · Jornada para abrir Viridian City.');
  }
 }else if(Array.isArray(q.at)){const ctl=api();if(ctl?.navigateObjective)ctl.navigateObjective({x:q.at[0],y:q.at[1]});else await ctl?.navigate?.(q.at);}
 else note('Abra o diário para consultar esse objetivo.');
}
function navigationPathActive(){return Number(D.getElementById('psy-kanto-world-v2')?.dataset.pathLength||0)>0;}
async function routeTask(task,target,message){
 if(!task||findTask!==task||task.routing)return;
 if(task.routed&&navigationPathActive())return;
 task.routing=true;task.routed=false;
 const ok=await api()?.navigate?.(target);
 if(findTask!==task)return;
 task.routing=false;task.routed=!!ok;
 if(!ok){findTask=null;if(message)note(message);}
}
async function advanceFind(){
 if(!findTask||Date.now()-findAt<1000)return;findAt=Date.now();
 const p=api()?.getPosition?.();if(!p)return;
 if(findTask?.goal==='viridian-gate'){
  const task=findTask;if(task.routing)return;
  if(p.world==='route-1'&&!p.inside&&Math.hypot(p.x-939,p.y-81)<=70){findTask=null;api()?.interact?.();note('Você chegou ao portão de Viridian.');return;}
  if(p.world==='route-1'&&!p.inside)await routeTask(task,task.target,'Não foi possível traçar uma rota até Viridian.');return;
 }
 if(findTask?.goal==='viridian-elder'||findTask?.goal==='viridian-exit'){
  const task=findTask;if(task.routing)return;
  const target=task.target,range=task.goal==='viridian-elder'?70:75;
  if(p.world==='viridian'&&!p.inside&&Math.hypot(p.x-target[0],p.y-target[1])<=range){const goal=task.goal;if(goal==='viridian-exit'){api()?.interact?.();if(findTask===task)findTask=null;}else{findTask=null;api()?.interact?.();}note(goal==='viridian-elder'?'Você chegou ao ancião; a conversa da missão foi iniciada.':'Você chegou à passagem norte.');return;}
  if(p.world==='viridian'&&!p.inside)await routeTask(task,target,task.goal==='viridian-elder'?'Não foi possível traçar rota até o ancião.':'Não foi possível traçar rota até o portão norte.');return;
 }
 if(findTask.phase==='lab'){
  if(Math.hypot(p.x-763,p.y-123)<45){api()?.enterPlace('lab');findTask.phase='professor';findTask.routing=false;findTask.routed=false;findAt=0;}
  else {await routeTask(findTask,[763,123],'Não foi possível traçar uma rota até o laboratório.');return;}
 }
 if(findTask?.phase==='professor'){
  if(Math.hypot(p.x-240,p.y-307)<18&&p.inside==='lab'){findTask=null;api()?.interact();note('Objetivo encontrado.');}
  else await routeTask(findTask,[240,307],'Não foi possível traçar uma rota até o professor.');
 }
}
let lastRows='';
function updateTracker(){
 const rows=questRows(),key=JSON.stringify(rows);tracker.hidden=!rows.length;
 if(key===lastRows)return;lastRows=key;tracker.replaceChildren();
 rows.forEach(q=>{
  const row=D.createElement('div');row.className='pq-row';const copy=D.createElement('div'),tag=D.createElement('small');
  tag.textContent=({main:'HISTÓRIA',side:'SECUNDÁRIA',event:'EVENTO'})[q.kind||q.category]||'QUEST';
  const text=D.createElement('span');text.textContent=q.title;copy.append(tag,text);row.appendChild(copy);
  if(q.goal||Array.isArray(q.at)){const b=D.createElement('button');b.textContent='ROTA';b.setAttribute('aria-label','Auto Route: '+q.title);b.onclick=()=>find(q);row.appendChild(b);}
  tracker.appendChild(row);
 });
}
function autoTurn(){
 if(!automatic||!vip())return;
 if(typeof inBattle==='undefined'||!inBattle||typeof battleData==='undefined'||!battleData||battleData.state!=='active')return;
 if(Date.now()-lastAction<1500)return;
 const mon=player().team?.[0];if(!mon)return;
 if(Number(mon.hp)<=0){
  W.psyHandleBattleFaint?.();
  const modal=D.getElementById('psy-battle-switch-required');if(!modal)return;
  const living=(player().team||[]).some((m,i)=>i>0&&Number(m.hp)>0);
  if(living){const button=modal.querySelector('[data-v31-switch], [data-switch]');if(button&&!button.disabled){lastAction=Date.now();button.click();}return;}
  const end=modal.querySelector('[data-v31-end], [data-end]');if(!end)return;
  lastAction=Date.now();automatic=false;catchEnabled=false;api()?.setAutoHunt(false);renderButtons();end.click();note('Auto Hunt encerrado: sua equipe precisa ser curada.');return;
 }
 if(battleData.turnLock||W.__psyCaptureBusyV26F||W.__psyCaptureBusyV26)return;
 const buttons=[...D.querySelectorAll('#move-buttons button')].filter(b=>!b.disabled&&b.getClientRects().length);
 if(!buttons.length)return;
 lastAction=Date.now();
 const low=Number(mon.hp)/Math.max(1,Number(mon.maxHp))<Number(preferences().healAt)/100;
 if(low){
  const healing=buttons.find(b=>/recover|roost|synthesis|rest|heal|cura|recuper|moonlight|milk drink|soft.boiled/i.test(b.textContent));
  if(healing){healing.click();return;}
  const chosen=preferences().potion;const potion=chosen&&Number(player().inventory?.[chosen]||0)>0?chosen:null;
  if(chosen&&!potion){stopAutomation();note('A poção principal acabou. Reabasteça antes de continuar.');return;}
  if(potion&&typeof usePotionBattle==='function'){usePotionBattle(potion);return;}
 }
 const gym=typeof gymBattle!=='undefined'&&!!gymBattle;
 if(catchEnabled&&!gym&&Number(battleData.wildHp)/Math.max(1,Number(battleData.wildMaxHp))<=Number(preferences().catchAt)/100){
  const chosen=preferences().ball,bag=player().inventory||{};
  if(!(bag[chosen]>0)){catchEnabled=false;renderButtons();note('A Ball principal acabou. Auto captura desativada.');return;}
  if(!W.PsySeason||W.PsySeason.canCapture(battleData.wild,chosen)){if(typeof W.tryCaptureBattle==='function'){W.tryCaptureBattle(chosen);return;}}
  else {catchEnabled=false;renderButtons();note('A Ball escolhida não pode capturar este Pokémon. Auto captura desativada.');return;}
 }
 const score=b=>{const text=b.textContent;const power=Number(text.match(/PWR\s*(\d+)/i)?.[1]||0);return power+(/surf|earthquake|rock slide|blizzard|heat wave|discharge|dazzling gleam|razor leaf|swift|área/i.test(text)?1000:0);};
 buttons.sort((a,b)=>score(b)-score(a));buttons[0].click();
}
function refresh(){
 const legacy=D.getElementById('psy-kanto-world'),root=legacy?.classList.contains('open')?legacy:D.getElementById('psy-kanto-world-v2'),stage=root?.querySelector('.kw2-stage,.kp-stage'),arena=D.querySelector('#battle-screen .battle-hud');
 const city=D.getElementById('game-wrap'),campaignOpen=root?.classList.contains('open');
 const isNewCampaign=campaignOpen&&root?.id==='psy-kanto-world-v2';
  const mapHost=isNewCampaign?(root.querySelector('[data-kanto-quest-slot]')||stage):(campaignOpen?stage:W.PsyCityQuestFloating?.host?.()||city);
  const toolsHost=isNewCampaign?(root.querySelector('[data-kanto-auto-slot]')||stage):mapHost;
 if(mapHost){if(tracker.parentElement!==mapHost)mapHost.appendChild(tracker);if(tools.parentElement!==toolsHost)toolsHost.appendChild(tools);updateTracker();}
 tracker.hidden=!mapHost||(!campaignOpen&&(!city||W.getComputedStyle(city).display==='none'))||!questRows().length;
  W.PsyCityQuestFloating?.refresh?.(!campaignOpen&&!!city&&W.getComputedStyle(city).display!=='none',questRows().length);
 tools.hidden=!campaignOpen;
 if(arena&&bar.parentElement!==arena)arena.appendChild(bar);
 if(!vip()&&(automatic||catchEnabled||huntActive()))stopAutomation();
 if(huntIntent&&huntController&&!huntController.isAutoHunt?.()&&!(typeof inBattle!=='undefined'&&inBattle)){huntIntent=false;automatic=false;catchEnabled=false;}
 renderButtons();advanceFind().catch(()=>{findTask=null;});
 if(D.visibilityState==='visible')autoTurn();
}
W.PsyCampaignAutomation={setAutoBattle:setAutomatic,setQuests:rows=>{extra=Array.isArray(rows)?rows:[];lastRows='';},vipActive:vip,showVipGate:openVipGate,autoFind:find,isAutoRouting:()=>!!findTask,cancelRoute:()=>{findTask=null;},startPrimaryRoute:()=>{const rows=questRows(),q=rows.find(x=>x.kind==='main'&&(x.goal||Array.isArray(x.at)))||rows.find(x=>x.goal||Array.isArray(x.at));if(q)return find(q);note('Não há uma rota ativa no momento.');},stop:stopAutomation,configure,preferences,huntActive};
renderButtons();W.setInterval(refresh,600);
})(window,document);

