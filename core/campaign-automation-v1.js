/* Campaign quest tracking and VIP automation. Test branch only. */
(function(W,D){
'use strict';
let automatic=false,catchEnabled=false,lastAction=0,findTask=null,findAt=0,extra=[],huntController=null,huntIntent=false;
const player=()=>typeof P!=='undefined'?P:{};
const vip=()=>Number(player().meta?.vipUntil||0)>Date.now();
const api=()=>W.PsyKantoPlayableV1?.getPosition?.()?W.PsyKantoPlayableV1:W.PsyKantoWorldV2;
const note=t=>W.notif?.(t,2600);
function requireVip(){if(vip())return true;note('Recurso exclusivo VIP.');return false;}
function setAutomatic(on){if(on&&!requireVip())return false;automatic=!!on;renderButtons();return automatic;}
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
`;D.head.appendChild(style);
const tracker=D.createElement('section');tracker.id='psy-campaign-quests';tracker.setAttribute('aria-label','Quests ativas');
const tools=D.createElement('div');tools.id='psy-campaign-tools';
const hunt=D.createElement('button');hunt.textContent='AUTO HUNT · VIP';hunt.onclick=()=>{if(huntActive()){stopAutomation();return;}if(requireVip())configure('hunt');};tools.appendChild(hunt);
const bar=D.createElement('div');bar.id='psy-auto-battle';
const battleButton=D.createElement('button');battleButton.onclick=()=>{if(automatic){stopAutomation();return;}if(requireVip())configure('battle');};
const catchButton=D.createElement('button');catchButton.onclick=()=>{if(catchEnabled){catchEnabled=false;renderButtons();return;}if(requireVip())configure('capture');};bar.append(battleButton,catchButton);
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
  if(!requireVip())return;const bag=player().inventory||{};if(ball&&!(bag[ball.value]>0)){warn.textContent='A Ball escolhida acabou. Selecione outra.';return;}if(potion.value&&!(bag[potion.value]>0)){warn.textContent='A poção escolhida acabou.';return;}
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
async function find(q){
 W.PsyKantoWorldV2?.dismissMenu?.();
 findTask=null;api()?.setAutoHunt(false);if(q.goal==='workshop'){if(W.PsyKantoWorldV2?.isOpen?.())W.PsyKantoWorldV2.openMenuPanel('professions');else W.PsyProfessions?.open('main');return;}
 if(q.goal==='chapter'){api()?.navigateTo(q.at);return;}
 if(q.goal==='oak'){
  let p=api()?.getPosition?.();if(!p||p.world!=='pallet'){api()?.open('pallet');p=api()?.getPosition?.();}
  if(p.inside&&p.inside!=='lab')api()?.leaveInterior();
  findTask={goal:'oak',phase:api()?.getPosition?.().inside==='lab'?'professor':'lab'};
  findAt=0;await advanceFind();
 }else if(q.goal==='viridian'){
  if(api()?.getPosition?.().inside)api()?.leaveInterior();
  if(api()?.getPosition?.().world!=='route-1')api()?.open('route-1');
  await api()?.navigate([848,87]);note('Seguindo para a entrada de Viridian.');
 }else if(q.goal==='explore-viridian'){
  const pos=api()?.getPosition?.();
  if(pos?.world==='viridian'){
   if(pos.inside)api()?.leaveInterior();
   const talked=!!W.PsyKantoWorldV2?.progress?.()?.viridianTalked;
   const target=talked?[449,43]:[389,320];
   const ok=await api()?.navigate?.(target);
   note(ok?(talked?'Rota 2: siga para o portão norte.':'Siga até o ancião de Viridian. Faça a interação ao chegar.'):'Não foi possível traçar rota até o objetivo.');
  }else{
   const opened=W.PsyKantoPlayableV1?.open?.('viridian');
   note(opened?'Viridian City aberta. Siga até o objetivo da Quest.':'Entre em Kanto · Jornada para abrir Viridian City.');
  }
 }else if(Array.isArray(q.at)){await api()?.navigate?.(q.at);}
 else note('Abra o diário para consultar esse objetivo.');
}
async function advanceFind(){
 if(!findTask||Date.now()-findAt<1000)return;findAt=Date.now();
 const p=api()?.getPosition?.();if(!p)return;
 if(findTask.phase==='lab'){
  if(Math.hypot(p.x-763,p.y-123)<45){api()?.enterPlace('lab');findTask.phase='professor';findTask.routing=false;findTask.routed=false;findAt=0;}
  else {if(!findTask.routing&&!findTask.routed){findTask.routing=true;const ok=await api()?.navigate([763,123]);if(findTask){findTask.routing=false;findTask.routed=ok;}}return;}
 }
 if(findTask?.phase==='professor'){
  if(Math.hypot(p.x-240,p.y-307)<18&&p.inside==='lab'){findTask=null;api()?.interact();note('Objetivo encontrado.');}
  else if(!findTask.routing&&!findTask.routed){findTask.routing=true;const ok=await api()?.navigate([240,307]);if(findTask){findTask.routing=false;findTask.routed=ok;}}
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
  const mapHost=isNewCampaign?(root.querySelector('[data-kanto-quest-slot]')||stage):(campaignOpen?stage:city);
  const toolsHost=isNewCampaign?(root.querySelector('[data-kanto-auto-slot]')||stage):mapHost;
 if(mapHost){if(tracker.parentElement!==mapHost)mapHost.appendChild(tracker);if(tools.parentElement!==toolsHost)toolsHost.appendChild(tools);updateTracker();}
 tracker.hidden=!mapHost||(!campaignOpen&&(!city||W.getComputedStyle(city).display==='none'))||!questRows().length;
 tools.hidden=!campaignOpen;
 if(arena&&bar.parentElement!==arena)arena.appendChild(bar);
 if(!vip()&&(automatic||catchEnabled||huntActive()))stopAutomation();
 if(huntIntent&&huntController&&!huntController.isAutoHunt?.()&&!(typeof inBattle!=='undefined'&&inBattle)){huntIntent=false;automatic=false;catchEnabled=false;}
 renderButtons();advanceFind().catch(()=>{findTask=null;});
 if(D.visibilityState==='visible')autoTurn();
}
W.PsyCampaignAutomation={setAutoBattle:setAutomatic,setQuests:rows=>{extra=Array.isArray(rows)?rows:[];lastRows='';},vipActive:vip,autoFind:find,startPrimaryRoute:()=>{const rows=questRows(),q=rows.find(x=>x.kind==='main'&&(x.goal||Array.isArray(x.at)))||rows.find(x=>x.goal||Array.isArray(x.at));if(q)return find(q);note('Não há uma rota ativa no momento.');},stop:stopAutomation,configure,preferences,huntActive};
renderButtons();W.setInterval(refresh,600);
})(window,document);

