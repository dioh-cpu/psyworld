/* PSYWORLD — Battle/Roster Integrity V31
   Final invariant layer loaded after late mode bundles.
   - A fainted Pokemon never revives from recalc, level-up or team movement.
   - Level-up preserves HP percentage; 0 HP stays 0.
   - Mandatory switch owns the battle after KO.
   - Existing normal Psyduck copies are archived outside Team/Box.
   - Psyduck #54 is removed from Wild/Hunt/World pools.
   - Old roster entries receive one safe stat repair using the current formula.
*/
(function(W,D){
'use strict';
if(W.__PSYWORLD_BATTLE_ROSTER_INTEGRITY_V31__)return;
W.__PSYWORLD_BATTLE_ROSTER_INTEGRITY_V31__=true;
const BUILD='BATTLE_ROSTER_INTEGRITY_V31_20260903_A';
const P0=()=>W.P||null;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const toast=(m,t=2600)=>{try{W.notif?.(m,t)}catch(_){}};
function battle(){try{return typeof battleData!=='undefined'?battleData:(W.battleData||null)}catch(_){return W.battleData||null}}
function battleActive(){
  const b=battle();
  if(b&&b.state==='active')return true;
  const e=D.getElementById('battle-screen');if(!e)return false;
  const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden';
}
function specialPsyduck(p){return !!(p?.psyduckChosen||p?.psyduckSupremo||p?.survivorOnly||p?.isPsyduckSupreme||p?.psyduckDungeon||p?.psyduckDungeonV11||p?.psyduckDungeonV12)}
function normalPsyduck(p){return Number(p?.id??p?.species_id??p)===54&&!specialPsyduck(p)}
function markFainted(p){if(!p)return;p.hp=0;p._psyFaintedV31=true;p._psyFaintedAtV31=p._psyFaintedAtV31||Date.now()}
function clearFainted(p){if(!p)return;delete p._psyFaintedV31;delete p._psyFaintedAtV31}
function alive(p){return !!p&&Number(p.hp||0)>0&&!p._psyFaintedV31}
function sync(){try{W.updateBattleHP?.()}catch(_){}try{W.updateHUD?.()}catch(_){}try{W.renderTeam?.()}catch(_){}try{W.autoSave?.()}catch(_){} }
function currentFn(name){try{return W[name]||(typeof globalThis[name]==='function'?globalThis[name]:null)}catch(_){return W[name]}}
function assignFn(name,fn){W[name]=fn;try{globalThis[name]=fn}catch(_){}try{eval(name+'=fn')}catch(_){} }

/* ---------- Current-stat repair, once per save ---------- */
function repairRosterOnce(){
  const P=P0();if(!P)return;P.meta=P.meta||{};
  if(P.meta.rosterRepairV31)return;
  const list=[...(P.team||[]),...(P.box||[])];
  const rec=currentFn('recalcPoke');
  for(const p of list){
    if(!p||normalPsyduck(p))continue;
    const oldMax=Math.max(1,Number(p.maxHp||1)),oldHp=Math.max(0,Number(p.hp||0));
    const wasDead=oldHp<=0||!!p._psyFaintedV31,ratio=clamp(oldHp/oldMax,0,1);
    try{if(typeof rec==='function')rec(p)}catch(_){}
    const mx=Math.max(1,Number(p.maxHp||1));
    if(wasDead)markFainted(p);else{clearFainted(p);p.hp=clamp(Math.round(mx*ratio),1,mx)}
  }
  P.meta.rosterRepairV31=Date.now();sync();
}

/* ---------- Archive normal Psyduck already owned ---------- */
function archiveOwnedPsyduck(){
  const P=P0();if(!P)return;P.meta=P.meta||{};P.meta.psyduckExclusiveArchive=Array.isArray(P.meta.psyduckExclusiveArchive)?P.meta.psyduckExclusiveArchive:[];
  const all=[...(P.team||[]),...(P.box||[])],toArchive=all.filter(normalPsyduck);
  if(!toArchive.length)return;
  const nonPsy=all.filter(x=>!normalPsyduck(x));
  if(!nonPsy.length)return; // never leave a profile with no usable Pokemon.
  const seen=new Set(P.meta.psyduckExclusiveArchive.map(x=>String(x?._archiveKey||'')));
  for(const p of toArchive){
    const key=String(p.uid||p.pokemon_uid||[p.id,p.level,p.createdAt,p.capturedAt].join(':'));
    if(!seen.has(key)){
      let copy;try{copy=JSON.parse(JSON.stringify(p))}catch(_){copy={id:54,name:'Psyduck',level:Number(p.level||1)}}
      copy._archiveKey=key;copy._archivedAt=Date.now();copy._archiveReason='Psyduck exclusivo Survivor';
      P.meta.psyduckExclusiveArchive.push(copy);seen.add(key);
    }
  }
  P.team=(P.team||[]).filter(x=>!normalPsyduck(x));
  P.box=(P.box||[]).filter(x=>!normalPsyduck(x));
  if(!P.team.length&&P.box.length)P.team.push(P.box.shift());
  toast('🦆 Psyduck normal foi retirado do TIME/BOX e arquivado: exclusivo do Survivor.',3600);sync();
}

/* ---------- Remove Psyduck from encounter sources ---------- */
function strip(arr){return Array.isArray(arr)?arr.filter(x=>!normalPsyduck(x)):arr}
function scrubPoolObject(o){if(!o||typeof o!=='object')return;for(const k of Object.keys(o))if(Array.isArray(o[k]))o[k]=strip(o[k])}
function scrubPools(){
  try{if(typeof WILD_ZONES_GEN1!=='undefined')scrubPoolObject(WILD_ZONES_GEN1)}catch(_){}
  try{scrubPoolObject(W.WILD_ZONES_GEN1)}catch(_){}
  try{if(typeof WILD_ZONES!=='undefined')scrubPoolObject(WILD_ZONES)}catch(_){}
  try{scrubPoolObject(W.WILD_ZONES)}catch(_){}
  try{if(typeof worldWilds!=='undefined'&&Array.isArray(worldWilds))for(let i=worldWilds.length-1;i>=0;i--)if(normalPsyduck(worldWilds[i]))worldWilds.splice(i,1)}catch(_){}
  try{if(Array.isArray(W.worldWilds))for(let i=W.worldWilds.length-1;i>=0;i--)if(normalPsyduck(W.worldWilds[i]))W.worldWilds.splice(i,1)}catch(_){}
}
function installPoolWrapper(name){
  const cur=currentFn(name);if(typeof cur!=='function'||cur.__psyNoPsyV31)return;
  const f=function(){return strip(cur.apply(this,arguments))};f.__psyNoPsyV31=true;f.__psyNoPsyOriginal=cur;assignFn(name,f);
}
function installStartGuard(){
  const cur=currentFn('startBattle');if(typeof cur!=='function'||cur.__psyStartV31)return;
  const f=function(wild){if(normalPsyduck(wild)){toast('🦆 Psyduck é exclusivo do Survivor / Psyduck Supremo.',2600);return false}return cur.apply(this,arguments)};
  f.__psyStartV31=true;f.__psyOriginal=cur;assignFn('startBattle',f);
}

/* ---------- Zero-safe recalc; re-wrap if V50 replaces it later ---------- */
function installRecalcGuard(){
  const cur=currentFn('recalcPoke');if(typeof cur!=='function'||cur.__psyZeroSafeV31)return;
  const f=function(p){
    const dead=!!p&&(p._psyFaintedV31||Number(p.hp||0)<=0);
    const r=cur.apply(this,arguments);
    if(dead&&p)markFainted(p);
    return r;
  };
  f.__psyZeroSafeV31=true;f.__psyOriginal=cur;assignFn('recalcPoke',f);
}

/* Legacy level-up explicitly did hp=maxHp. Preserve health instead. */
function installLevelGuard(){
  const cur=currentFn('checkLevelUp');if(typeof cur!=='function'||cur.__psyLevelHpV31)return;
  const f=function(){
    const P=P0(),p=P?.team?.[0];if(!p)return cur.apply(this,arguments);
    const oldMax=Math.max(1,Number(p.maxHp||1)),oldHp=Math.max(0,Number(p.hp||0)),ratio=clamp(oldHp/oldMax,0,1),dead=!!p._psyFaintedV31||oldHp<=0,oldLv=Number(p.level||1);
    const r=cur.apply(this,arguments);
    if(Number(p.level||1)!==oldLv){try{currentFn('recalcPoke')?.(p)}catch(_){} }
    const mx=Math.max(1,Number(p.maxHp||1));
    if(dead)markFainted(p);else p.hp=clamp(Math.round(mx*ratio),1,mx);
    sync();return r;
  };
  f.__psyLevelHpV31=true;f.__psyOriginal=cur;assignFn('checkLevelUp',f);
}
function installWorldKillGuard(){
  const cur=currentFn('handleWorldKill');if(typeof cur!=='function'||cur.__psyWorldHpV31)return;
  const f=function(){const p=P0()?.team?.[0],oldMax=Math.max(1,Number(p?.maxHp||1)),oldHp=Math.max(0,Number(p?.hp||0)),ratio=clamp(oldHp/oldMax,0,1),dead=!!p&&(p._psyFaintedV31||oldHp<=0);const r=cur.apply(this,arguments);if(p){try{currentFn('recalcPoke')?.(p)}catch(_){}const mx=Math.max(1,Number(p.maxHp||1));if(dead)markFainted(p);else p.hp=clamp(Math.round(mx*ratio),1,mx)}sync();return r};
  f.__psyWorldHpV31=true;f.__psyOriginal=cur;assignFn('handleWorldKill',f);
}
function installAddTeamGuard(){
  const cur=currentFn('addToTeam');if(typeof cur!=='function'||cur.__psyAddTeamV31)return;
  const f=function(idx){const p=P0()?.box?.[Number(idx)],dead=!!p&&(p._psyFaintedV31||Number(p.hp||0)<=0);const r=cur.apply(this,arguments);if(dead&&p)markFainted(p);sync();return r};
  f.__psyAddTeamV31=true;f.__psyOriginal=cur;assignFn('addToTeam',f);
}

/* Intentional healing clears the faint lock. */
function installHealGuard(){
  const cur=currentFn('curarTimeCity');if(typeof cur!=='function'||cur.__psyHealV31)return;
  const f=function(){const r=cur.apply(this,arguments);const P=P0();for(const p of P?.team||[]){clearFainted(p);p.hp=Math.max(1,Number(p.maxHp||1))}sync();return r};f.__psyHealV31=true;f.__psyOriginal=cur;assignFn('curarTimeCity',f);
  try{const b=D.querySelector('[onclick*="curarTimeCity"]');if(b)b.onclick=()=>f()}catch(_){}
}
function installReviveGuard(){
  const cur=currentFn('psyConsumeReviveTarget');if(typeof cur!=='function'||cur.__psyReviveV31)return;
  const f=function(i){const r=cur.apply(this,arguments);if(r){const p=P0()?.team?.[Number(i)];if(p&&Number(p.hp||0)>0)clearFainted(p)}return r};f.__psyReviveV31=true;f.__psyOriginal=cur;assignFn('psyConsumeReviveTarget',f);
}

/* ---------- Mandatory switch that cannot be bypassed ---------- */
function refreshBattlePlayer(){
  const P=P0(),p=P?.team?.[0],b=battle();if(!p)return;if(b)b.player=p;
  const nm=D.getElementById('player-name-tag');if(nm)nm.textContent=(p.shiny?'✨ ':'')+(p.name||'Pokémon');
  const im=D.getElementById('player-img');if(im){try{im.src=currentFn('getPokeAnim')?.(p)||im.src}catch(_){}}
  try{currentFn('updateBattleHP')?.()}catch(_){}try{currentFn('loadMoveButtons')?.()}catch(_){}sync();
}
function doSwitch(i){
  const P=P0();i=Number(i);const next=P?.team?.[i];if(!next||i<=0||!alive(next))return false;
  const dead=P.team[0];markFainted(dead);P.team[0]=next;P.team[i]=dead;
  W.__PSY_FORCE_SWITCH_V31=false;W.__PSY_FORCE_SWITCH_V30=false;
  const b=battle();if(b){b.player=next;b.turnLock=false;if(b.majorStatus)b.majorStatus.player=null}
  D.getElementById('psy-battle-switch-required')?.remove();refreshBattlePlayer();toast(`🔄 ${next.name||'Pokémon'} entrou na batalha!`,2200);return true;
}
function openSwitch(){
  const P=P0(),active=P?.team?.[0];if(!P||!active)return null;markFainted(active);
  let m=D.getElementById('psy-battle-switch-required');if(m)return m;
  const live=(P.team||[]).map((p,i)=>({p,i})).filter(x=>x.i>0&&alive(x.p));
  W.__PSY_FORCE_SWITCH_V31=true;W.__PSY_FORCE_SWITCH_V30=true;
  m=D.createElement('div');m.id='psy-battle-switch-required';m.style.cssText='position:fixed;inset:0;z-index:2147483640;background:#000e;display:flex;align-items:center;justify-content:center;padding:14px';
  const rows=(P.team||[]).map((p,i)=>{const hp=Math.max(0,Number(p?.hp||0)),dead=!alive(p);return `<div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:9px;margin:6px 0;border:1px solid #334155;border-radius:10px;background:#0f172a"><div><b>${p?.name||'Pokémon'}</b><small style="display:block;color:${dead?'#fca5a5':'#86efac'}">HP ${Math.ceil(hp)}/${Math.ceil(Number(p?.maxHp||1))}</small></div>${i===0?'<button disabled>ATIVO DERROTADO</button>':dead?'<button disabled>DERROTADO</button>':`<button data-v31-switch="${i}" style="background:#16a34a;color:#fff;border:0;border-radius:8px;padding:9px 13px;font-weight:900">TROCAR</button>`}</div>`}).join('');
  m.innerHTML=`<div style="width:min(620px,96vw);max-height:88vh;overflow:auto;background:#071827;border:2px solid ${live.length?'#f59e0b':'#ef4444'};border-radius:18px;padding:16px;color:#fff;font-family:system-ui"><h2 style="margin:0 0 6px;color:${live.length?'#fde68a':'#fca5a5'}">${live.length?'POKÉMON DERROTADO — TROCA OBRIGATÓRIA':'TIME DERROTADO'}</h2><p style="color:#cbd5e1">${live.length?'Escolha outro Pokémon vivo. Nenhuma ação pode continuar antes da troca.':'Não existe outro Pokémon vivo. Revive não será usado automaticamente.'}</p>${rows}${live.length?'':'<button data-v31-end style="width:100%;margin-top:10px;background:#b91c1c;color:#fff;border:0;border-radius:9px;padding:12px;font-weight:900">ENCERRAR BATALHA</button>'}</div>`;
  D.body.appendChild(m);m.querySelectorAll('[data-v31-switch]').forEach(b=>b.onclick=()=>doSwitch(b.dataset.v31Switch));m.querySelector('[data-v31-end]')?.addEventListener('click',()=>{W.__PSY_FORCE_SWITCH_V31=false;W.__PSY_FORCE_SWITCH_V30=false;m.remove();const e=currentFn('endBattle');try{e?.(false)}catch(_){}});return m;
}
function faintHandler(){const p=P0()?.team?.[0];if(!p||Number(p.hp||0)>0&&!p._psyFaintedV31)return false;markFainted(p);const b=battle();if(b)b.turnLock=true;const log=D.getElementById('battle-log');if(log)log.textContent=`💀 ${p.name||'Pokémon'} foi derrotado! Troca obrigatória.`;openSwitch();sync();return true}
function installFaintHandler(){if(W.psyHandleBattleFaint?.__psyFaintV31)return;const f=function(){return faintHandler()};f.__psyFaintV31=true;W.psyHandleBattleFaint=f}
function installActionGuard(){
  const cur=currentFn('battleAction');if(typeof cur!=='function'||cur.__psyActionV31)return;
  const f=function(){const p=P0()?.team?.[0];if(W.__PSY_FORCE_SWITCH_V31||!alive(p)){faintHandler();return}return cur.apply(this,arguments)};f.__psyActionV31=true;f.__psyOriginal=cur;assignFn('battleAction',f);
}
function installEndGuard(){
  const cur=currentFn('endBattle');if(typeof cur!=='function'||cur.__psyEndV31)return;
  const f=function(won){const p=P0()?.team?.[0],bench=(P0()?.team||[]).some((x,i)=>i>0&&alive(x));if(!won&&battleActive()&&p&&!alive(p)&&bench){faintHandler();return false}W.__PSY_FORCE_SWITCH_V31=false;return cur.apply(this,arguments)};f.__psyEndV31=true;f.__psyOriginal=cur;assignFn('endBattle',f);
}

function battleInvariant(){
  if(!battleActive())return;const p=P0()?.team?.[0];if(!p)return;
  if(p._psyFaintedV31&&Number(p.hp||0)>0)p.hp=0;
  if(Number(p.hp||0)<=0||p._psyFaintedV31)faintHandler();
}
function installAll(){
  scrubPools();installPoolWrapper('getPokesForHunt');installPoolWrapper('getWorldPool');installPoolWrapper('psyCleanHuntPool');installPoolWrapper('getHuntPool');installStartGuard();
  installRecalcGuard();installLevelGuard();installWorldKillGuard();installAddTeamGuard();installHealGuard();installReviveGuard();installFaintHandler();installActionGuard();installEndGuard();
}

function start(){installAll();archiveOwnedPsyduck();repairRosterOnce();setInterval(()=>{installAll();battleInvariant()},120);setInterval(()=>{scrubPools();archiveOwnedPsyduck()},1500)}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',()=>setTimeout(start,50),{once:true});else setTimeout(start,50);
console.log('✅ PSYWORLD V31 carregado: KO definitivo, level-up sem cura, roster reparado e Psyduck exclusivo Survivor',BUILD);
})(window,document);
