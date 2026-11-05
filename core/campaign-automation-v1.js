/* Campaign quest tracking and VIP automation. Test branch only. */
(function(W,D){
'use strict';
let automatic=false,catchEnabled=false,lastAction=0,findTask=null,findAt=0,extra=[];
const player=()=>typeof P!=='undefined'?P:{};
const vip=()=>Number(player().meta?.vipUntil||0)>Date.now();
const api=()=>W.PsyKantoWorldV2;
const note=t=>W.notif?.(t,2600);
function requireVip(){if(vip())return true;note('Recurso exclusivo VIP.');return false;}
function setAutomatic(on){if(on&&!requireVip())return false;automatic=!!on;renderButtons();return automatic;}
const style=D.createElement('style');style.textContent=`
#psy-campaign-quests{position:absolute;top:8px;right:8px;z-index:4;width:min(235px,48%);padding:9px;border:1px solid #d6ae61;border-radius:12px;background:#101b2be8;color:#eef5ff;font:12px/1.35 system-ui;box-sizing:border-box;pointer-events:auto}
#psy-campaign-quests .pq-row{display:grid;grid-template-columns:1fr auto;gap:7px;align-items:center;padding:7px 0;border-bottom:1px solid #ffffff15}
#psy-campaign-quests small{display:block;color:#ffdb8a;font-size:10px;font-weight:800}
#psy-campaign-quests button,#psy-campaign-tools button,#psy-auto-battle button{min-height:36px;padding:7px 10px;border:1px solid #68baba;border-radius:9px;background:#163b50;color:#fff;font:bold 11px system-ui;cursor:pointer}
#psy-campaign-tools{position:absolute;bottom:10px;right:10px;z-index:4;display:flex;gap:6px}
#psy-auto-battle{position:absolute;top:46px;left:50%;transform:translateX(-50%);z-index:10;display:flex;gap:6px;max-width:96%}
#psy-auto-battle button[aria-pressed=true],#psy-campaign-tools button[aria-pressed=true]{background:#1d705a;border-color:#86efac}
@media(max-width:600px){#psy-campaign-quests{width:46%;font-size:11px;padding:6px}#psy-auto-battle button{font-size:10px;padding:6px;min-height:34px}}
 #psy-campaign-tools[hidden],#psy-campaign-quests[hidden]{display:none!important}
#btn-idle-realistic-float,[data-mode-card=idleworld]{display:none!important}
`;D.head.appendChild(style);
const tracker=D.createElement('section');tracker.id='psy-campaign-quests';tracker.setAttribute('aria-label','Quests ativas');
const tools=D.createElement('div');tools.id='psy-campaign-tools';
const hunt=D.createElement('button');hunt.textContent='AUTO HUNT · VIP';hunt.onclick=()=>{if(!requireVip())return;findTask=null;const on=api()?.setAutoHunt(!api()?.isAutoHunt());if(on)setAutomatic(true);renderButtons();};tools.appendChild(hunt);
const bar=D.createElement('div');bar.id='psy-auto-battle';
const battleButton=D.createElement('button');battleButton.onclick=()=>setAutomatic(!automatic);
const catchButton=D.createElement('button');catchButton.onclick=()=>{if(!requireVip())return;catchEnabled=!catchEnabled;if(catchEnabled)setAutomatic(true);renderButtons();};bar.append(battleButton,catchButton);
function renderButtons(){
 battleButton.textContent=automatic?'AUTO BATALHA · ON':'AUTO BATALHA · VIP';battleButton.setAttribute('aria-pressed',String(automatic));
 catchButton.textContent=catchEnabled?'AUTO CAPTURA · ON':'AUTO CAPTURA · VIP';catchButton.setAttribute('aria-pressed',String(catchEnabled));
 hunt.textContent=api()?.isAutoHunt()?'AUTO HUNT · ON':'AUTO HUNT · VIP';hunt.setAttribute('aria-pressed',String(!!api()?.isAutoHunt()));
}
function questRows(){
 const q=api()?.progress?.()||{},pos=api()?.getPosition?.(),main=[];
 if(!q.oak)main.push({id:'story-oak',kind:'main',title:'Fale com o Professor Car’alho',goal:'oak'});
 else if(!q.viridian)main.push({id:'story-route1',kind:'main',title:'Atravesse a Rota 1 até Viridian',goal:'viridian'});
 else main.push({id:'story-viridian',kind:'main',title:'Explore Viridian City'});
 const raw=player().meta?.activeQuests||player().quests?.active||[];
 const active=(Array.isArray(raw)?raw:Object.values(raw)).map(q=>({...q,title:q.title||q.name||q.n,kind:q.kind||q.category||'side'}));
 return [...main,...active,...extra].filter(q=>q&&q.title&&q.status!=='completed'&&q.status!=='claimed');
}
async function find(q){
 findTask=null;api()?.setAutoHunt(false);
 if(q.goal==='oak'){
  let p=api()?.getPosition?.();if(!p||p.world!=='pallet'){api()?.open('pallet');p=api()?.getPosition?.();}
  if(p.inside&&p.inside!=='lab')api()?.leaveInterior();
  findTask={goal:'oak',phase:api()?.getPosition?.().inside==='lab'?'professor':'lab'};
  findAt=0;await advanceFind();
 }else if(q.goal==='viridian'){
  if(api()?.getPosition?.().inside)api()?.leaveInterior();
  if(api()?.getPosition?.().world!=='route-1')api()?.open('route-1');
  await api()?.navigate([848,87]);note('Seguindo para a entrada de Viridian.');
 }else if(Array.isArray(q.at)){await api()?.navigate(q.at);}
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
  if(Math.hypot(p.x-240,p.y-395)<18&&p.inside==='lab'){findTask=null;api()?.interact();note('Objetivo encontrado.');}
  else if(!findTask.routing&&!findTask.routed){findTask.routing=true;const ok=await api()?.navigate([240,395]);if(findTask){findTask.routing=false;findTask.routed=ok;}}
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
  if(q.goal||Array.isArray(q.at)){const b=D.createElement('button');b.textContent='IR';b.setAttribute('aria-label','Auto Find: '+q.title);b.onclick=()=>find(q);row.appendChild(b);}
  tracker.appendChild(row);
 });
}
function autoTurn(){
 if(!automatic||!vip())return;
 if(typeof inBattle==='undefined'||!inBattle||typeof battleData==='undefined'||!battleData||battleData.state!=='active'||battleData.turnLock)return;
 if(Date.now()-lastAction<1500)return;
 const mon=player().team?.[0];if(!mon||Number(mon.hp)<=0)return;
 const buttons=[...D.querySelectorAll('#move-buttons button')].filter(b=>!b.disabled&&b.getClientRects().length);
 if(!buttons.length)return;
 lastAction=Date.now();
 const low=Number(mon.hp)/Math.max(1,Number(mon.maxHp))<.4;
 if(low){
  const healing=buttons.find(b=>/recover|roost|synthesis|rest|heal|cura|recuper|moonlight|milk drink|soft.boiled/i.test(b.textContent));
  if(healing){healing.click();return;}
  const potion=Object.keys(player().inventory||{}).find(n=>/potion/i.test(n)&&player().inventory[n]>0);
  if(potion&&typeof usePotionBattle==='function'){usePotionBattle(potion);return;}
 }
 const gym=typeof gymBattle!=='undefined'&&!!gymBattle;
 if(catchEnabled&&!gym&&Number(battleData.wildHp)/Math.max(1,Number(battleData.wildMaxHp))<=.35){
  const balls=Object.keys(player().inventory||{}).filter(n=>player().inventory[n]>0&&W.PSY_ITEMS?.category?.(n)==='ball');
  balls.sort((a,b)=>(W.psyCaptureChancePct?.(b)||0)-(W.psyCaptureChancePct?.(a)||0));
  if(balls.length&&typeof W.tryCaptureBattle==='function'){W.tryCaptureBattle(balls[0]);return;}
 }
 const score=b=>{const text=b.textContent;const power=Number(text.match(/PWR\s*(\d+)/i)?.[1]||0);return power+(/surf|earthquake|rock slide|blizzard|heat wave|discharge|dazzling gleam|razor leaf|swift|área/i.test(text)?1000:0);};
 buttons.sort((a,b)=>score(b)-score(a));buttons[0].click();
}
function refresh(){
 const root=D.getElementById('psy-kanto-world-v2'),stage=root?.querySelector('.kw2-stage'),arena=D.querySelector('#battle-screen .battle-hud');
 const city=D.getElementById('game-wrap'),campaignOpen=root?.classList.contains('open');
 const mapHost=campaignOpen?stage:city;
 if(mapHost){if(tracker.parentElement!==mapHost)mapHost.appendChild(tracker);if(tools.parentElement!==mapHost)mapHost.appendChild(tools);updateTracker();}
 tracker.hidden=!mapHost||(!campaignOpen&&(!city||W.getComputedStyle(city).display==='none'))||!questRows().length;
 tools.hidden=!campaignOpen;
 if(arena&&bar.parentElement!==arena)arena.appendChild(bar);
 if(!vip()){automatic=false;catchEnabled=false;if(api()?.isAutoHunt())api()?.setAutoHunt(false);}
 renderButtons();advanceFind().catch(()=>{findTask=null;});
 if(D.visibilityState==='visible')autoTurn();
}
W.PsyCampaignAutomation={setAutoBattle:setAutomatic,setQuests:rows=>{extra=Array.isArray(rows)?rows:[];lastRows='';},vipActive:vip,autoFind:find};
renderButtons();W.setInterval(refresh,600);
})(window,document);
