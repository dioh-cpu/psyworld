/* PSYWORLD — Battle / HP / Input Integrity V30
   - HP zero permanece derrotado durante recalculos.
   - CURAR usa o maxHp vigente do mesmo Pokemon usado na batalha.
   - KO nunca fecha a batalha sozinho: exige troca por outro Pokemon vivo.
   - Sem outro Pokemon vivo, mostra derrota e exige encerramento manual.
   - Revive nao e oferecido como continuacao de batalha apos KO.
   - Psyduck #54 nao aparece em Wild, Hunts ou World; fica reservado ao Survivor/Psyduck Supremo.
   - Cidade fica congelada enquanto World/Aventura/Survivor controlam o jogador.
*/
(function(W,D){
'use strict';
if(W.__PSYWORLD_BATTLE_INPUT_INTEGRITY_V30__)return;
W.__PSYWORLD_BATTLE_INPUT_INTEGRITY_V30__=true;
const BUILD='BATTLE_INPUT_INTEGRITY_V30_20260903_A';
const P0=()=>W.P||null;
const toast=(m,t=2600)=>{try{W.notif?.(m,t)}catch(_){}};
function bd(){try{return typeof battleData!=='undefined'?battleData:(W.battleData||null)}catch(_){return W.battleData||null}}
function pokeAnim(p){try{return W.getPokeAnim?.(p)||getPokeAnim(p)||''}catch(_){return ''}}

function syncFrontPokemon(){
  const P=P0(),p=P?.team?.[0];if(!P||!p)return null;
  const max=Math.max(1,Number(p.maxHp||1));
  p.hp=Math.max(0,Math.min(max,Number(p.hp||0)));
  P.pokemon=p;P.hp=p.hp;P.maxHp=max;
  try{W.updateHUD?.()}catch(_){}
  try{W.renderTeam?.()}catch(_){}
  return p;
}

/* Legacy recalc used Math.max(1, hp), reviving fainted Pokemon. Preserve 0. */
const recalcBase=W.recalcPoke;
if(typeof recalcBase==='function'&&!recalcBase.__psyV30ZeroSafe){
  const zeroSafe=function(p){
    const wasFainted=!!p&&Number(p.hp||0)<=0;
    const r=recalcBase.apply(this,arguments);
    if(wasFainted&&p)p.hp=0;
    return r;
  };
  zeroSafe.__psyV30ZeroSafe=true;zeroSafe.__psyV30Original=recalcBase;
  W.recalcPoke=zeroSafe;try{recalcPoke=zeroSafe}catch(_){ }
}

/* Heal exact current stats, then save that exact full HP. */
const healBase=W.curarTimeCity;
if(typeof healBase==='function'){
  const fullHeal=function(){
    const P=P0();if(!P?.team?.length){toast('Você não tem Pokémon no time.');return false}
    for(const p of P.team){try{W.recalcPoke?.(p)}catch(_){}p.hp=Math.max(1,Number(p.maxHp||1));}
    syncFrontPokemon();try{W.autoSave?.()}catch(_){}
    toast('💚 Time curado completamente!',1800);
    setTimeout(()=>{const Q=P0();if(!Q?.team?.length)return;for(const p of Q.team){try{W.recalcPoke?.(p)}catch(_){}p.hp=Math.max(1,Number(p.maxHp||1));}syncFrontPokemon();try{W.autoSave?.()}catch(_){}},80);
    return true;
  };
  fullHeal.__psyV30=true;fullHeal.__psyV30Original=healBase;
  W.curarTimeCity=fullHeal;try{curarTimeCity=fullHeal}catch(_){ }
}

/* ===== Psyduck #54 exclusivity outside Survivor ===== */
const isPsyduck=x=>Number(x?.id??x?.species_id??x)===54;
function survivorPsyduckSource(w){return !!(w?.psyduckDungeon||w?.psyduckDungeonV11||w?.psyduckDungeonV12||w?.psyduckSupremo||w?.survivorOnly)}
function stripPsyduck(arr){return Array.isArray(arr)?arr.filter(x=>!isPsyduck(x)):arr}
function mutatePoolObject(obj){if(!obj||typeof obj!=='object')return;for(const k of Object.keys(obj)){if(Array.isArray(obj[k]))obj[k]=stripPsyduck(obj[k])}}
function patchPoolFunction(name){
  const cur=W[name];if(typeof cur!=='function'||cur.__psyNoPsyduckV30)return;
  const f=function(){return stripPsyduck(cur.apply(this,arguments))};
  f.__psyNoPsyduckV30=true;f.__psyNoPsyduckOriginal=cur;W[name]=f;
  try{if(typeof globalThis[name]==='function')globalThis[name]=f}catch(_){}
}
function removeExistingWorldPsyduck(){
  try{if(typeof worldWilds!=='undefined'&&Array.isArray(worldWilds)){for(let i=worldWilds.length-1;i>=0;i--)if(isPsyduck(worldWilds[i]))worldWilds.splice(i,1)}}catch(_){}
  try{if(Array.isArray(W.worldWilds)){for(let i=W.worldWilds.length-1;i>=0;i--)if(isPsyduck(W.worldWilds[i]))W.worldWilds.splice(i,1)}}catch(_){}
}
function enforcePsyduckExclusive(){
  try{mutatePoolObject(W.WILD_ZONES_GEN1)}catch(_){}
  try{if(typeof WILD_ZONES_GEN1!=='undefined')mutatePoolObject(WILD_ZONES_GEN1)}catch(_){}
  try{mutatePoolObject(W.WILD_ZONES)}catch(_){}
  try{if(typeof WILD_ZONES!=='undefined')mutatePoolObject(WILD_ZONES)}catch(_){}
  try{if(W.PSY_NO_WILD_WORLD instanceof Set)W.PSY_NO_WILD_WORLD.add(54);else W.PSY_NO_WILD_WORLD=new Set([54])}catch(_){}
  patchPoolFunction('getWorldPool');
  patchPoolFunction('psyCleanHuntPool');
  patchPoolFunction('getHuntPool');
  removeExistingWorldPsyduck();
}

/* Battle starts from the same live object/HP shown in city. Also blocks stale Psyduck encounters. */
const startBase=W.startBattle;
if(typeof startBase==='function'){
  const startFixed=function(wild){
    if(isPsyduck(wild)&&!survivorPsyduckSource(wild)){
      toast('🦆 Psyduck é exclusivo do Survivor / Psyduck Supremo.',2600);
      return false;
    }
    const P=P0(),p=P?.team?.[0];
    if(!p)return startBase.apply(this,arguments);
    try{W.recalcPoke?.(p)}catch(_){}
    p.hp=Math.max(0,Math.min(Math.max(1,Number(p.maxHp||1)),Number(p.hp||0)));
    syncFrontPokemon();
    const r=startBase.apply(this,arguments);
    try{W.updateBattleHP?.()}catch(_){}
    setTimeout(()=>{syncFrontPokemon();try{W.updateBattleHP?.()}catch(_){}if(Number(P0()?.team?.[0]?.hp||0)<=0)W.psyHandleBattleFaint?.()},0);
    return r;
  };
  startFixed.__psyV30=true;startFixed.__psyV30Original=startBase;startFixed.__psyNoPsyduckV30=true;
  W.startBattle=startFixed;try{startBattle=startFixed}catch(_){ }
}
function patchStartGuard(){
  const cur=W.startBattle;if(typeof cur!=='function'||cur.__psyNoPsyduckV30)return;
  const f=function(wild){if(isPsyduck(wild)&&!survivorPsyduckSource(wild)){toast('🦆 Psyduck é exclusivo do Survivor / Psyduck Supremo.',2600);return false}return cur.apply(this,arguments)};
  f.__psyNoPsyduckV30=true;f.__psyNoPsyduckOriginal=cur;W.startBattle=f;try{startBattle=f}catch(_){}
}

/* ===== Mandatory replacement after KO ===== */
let endBase=W.endBattle;
function clearPlayerBattleState(){
  const b=bd();if(!b)return;
  if(b.majorStatus)b.majorStatus.player=null;
  if(b.statusFx){b.statusFx.myAtk=0;b.statusFx.myAtkTurns=0;b.statusFx.myDef=0;b.statusFx.myDefTurns=0;b.statusFx.protect=0;b.statusFx.playerProtect=0}
  try{W.psyBattleRenderStatus?.()}catch(_){}
}
function refreshBattlePlayer(){
  const P=P0(),p=P?.team?.[0],b=bd();if(!p)return;
  if(b)b.player=p;
  const nm=D.getElementById('player-name-tag');if(nm)nm.textContent=(p.shiny?'✨ ':'')+(p.name||'Pokémon');
  const im=D.getElementById('player-img');if(im){const src=pokeAnim(p);if(src)im.src=src}
  try{W.updateBattleHP?.()}catch(_){}
  try{W.updateHUD?.()}catch(_){}
  try{W.renderTeam?.()}catch(_){}
  try{W.loadMoveButtons?.()}catch(_){}
  try{if(typeof loadMoveButtons==='function')loadMoveButtons()}catch(_){}
  try{W.autoSave?.()}catch(_){}
}
function performSwitch(i){
  const P=P0();i=Number(i);if(!P?.team?.[i]||i<=0||Number(P.team[i].hp||0)<=0)return false;
  const t=P.team[0];P.team[0]=P.team[i];P.team[i]=t;
  clearPlayerBattleState();
  W.__PSY_FORCE_SWITCH_V30=false;
  D.getElementById('psy-battle-switch-required')?.remove();
  syncFrontPokemon();refreshBattlePlayer();
  toast(`🔄 ${P.team[0].name||'Pokémon'} entrou na batalha!`,2200);
  return true;
}
function finishDefeat(){
  W.__PSY_FORCE_SWITCH_V30=false;
  D.getElementById('psy-battle-switch-required')?.remove();
  try{if(typeof endBase==='function')return endBase.call(W,false)}catch(e){console.warn('[V30 end defeat]',e)}
  try{if(typeof endBattle==='function')return endBattle(false)}catch(_){}
}
function openRequiredSwitch(){
  const P=P0();if(!P?.team?.length)return null;
  let m=D.getElementById('psy-battle-switch-required');if(m)m.remove();
  const team=P.team,live=team.map((p,i)=>({p,i})).filter(x=>x.i>0&&Number(x.p?.hp||0)>0);
  W.__PSY_FORCE_SWITCH_V30=true;
  m=D.createElement('div');m.id='psy-battle-switch-required';m.style.cssText='position:fixed;inset:0;z-index:2147483600;background:#000e;display:flex;align-items:center;justify-content:center;padding:14px';
  const rows=team.map((p,i)=>{const hp=Math.max(0,Number(p?.hp||0)),max=Math.max(1,Number(p?.maxHp||1)),dead=hp<=0,active=i===0;let action='';if(active)action='<button disabled style="opacity:.55">ATIVO DERROTADO</button>';else if(dead)action='<button disabled style="opacity:.55">DERROTADO</button>';else action=`<button data-switch="${i}" style="background:#16a34a;color:#fff;border:0;border-radius:8px;padding:9px 13px;font-weight:900;cursor:pointer">TROCAR</button>`;return `<div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:9px;margin:6px 0;border:1px solid #334155;border-radius:10px;background:#0f172a"><div><b>${p?.name||'Pokémon'}</b><small style="display:block;color:${dead?'#fca5a5':'#86efac'}">HP ${Math.ceil(hp)}/${Math.ceil(max)}</small></div>${action}</div>`}).join('');
  const noLive=!live.length;
  m.innerHTML=`<div style="width:min(620px,96vw);max-height:88vh;overflow:auto;background:#071827;border:2px solid ${noLive?'#ef4444':'#f59e0b'};border-radius:18px;padding:16px;color:#fff;font-family:system-ui"><h2 style="margin:0 0 6px;color:${noLive?'#fca5a5':'#fde68a'}">${noLive?'TIME DERROTADO':'POKÉMON DERROTADO — TROCA OBRIGATÓRIA'}</h2><p style="color:#cbd5e1">${noLive?'Não há outro Pokémon vivo no seu time. A batalha não continuará e nenhum Revive será usado automaticamente.':'Escolha outro Pokémon vivo. A batalha só continua depois da troca; Revive não pode substituir esta escolha.'}</p><div>${rows}</div>${noLive?'<button data-end style="width:100%;margin-top:10px;background:#b91c1c;color:#fff;border:0;border-radius:9px;padding:12px;font-weight:900;cursor:pointer">ENCERRAR BATALHA</button>':''}</div>`;
  D.body.appendChild(m);
  m.querySelectorAll('[data-switch]').forEach(b=>b.onclick=()=>performSwitch(b.dataset.switch));
  m.querySelector('[data-end]')?.addEventListener('click',finishDefeat);
  return m;
}
W.psyOpenBattleSwitch=function(){return openRequiredSwitch()};
W.psyHandleBattleFaint=function(){
  const P=P0(),active=P?.team?.[0];if(!active||Number(active.hp||0)>0)return false;
  active.hp=0;syncFrontPokemon();try{W.autoSave?.()}catch(_){}
  const log=D.getElementById('battle-log');if(log)log.textContent=`💀 ${active.name||'Pokémon'} foi derrotado! Escolha outro Pokémon para continuar.`;
  W.__PSY_FORCE_SWITCH_V30=true;
  setTimeout(openRequiredSwitch,80);return true;
};

/* Block any legacy automatic defeat close while the required-switch state owns the battle. */
if(typeof endBase==='function'){
  const guardedEnd=function(won){
    if(!won&&W.__PSY_FORCE_SWITCH_V30&&Number(P0()?.team?.[0]?.hp||0)<=0){openRequiredSwitch();return false}
    W.__PSY_FORCE_SWITCH_V30=false;D.getElementById('psy-battle-switch-required')?.remove();return endBase.apply(this,arguments)
  };
  guardedEnd.__psyV30=true;guardedEnd.__psyV30Original=endBase;W.endBattle=guardedEnd;try{endBattle=guardedEnd}catch(_){}
}
const actionBase=W.battleAction;
if(typeof actionBase==='function'){
  const guardedAction=function(){if(W.__PSY_FORCE_SWITCH_V30||Number(P0()?.team?.[0]?.hp||0)<=0){W.psyHandleBattleFaint?.();return}return actionBase.apply(this,arguments)};
  guardedAction.__psyV30=true;guardedAction.__psyV30Original=actionBase;W.battleAction=guardedAction;try{battleAction=guardedAction}catch(_){}
}

/* ===== City input isolation ===== */
function visible(id){const e=D.getElementById(id);if(!e)return false;const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0'}
function exclusiveState(){const survivor=visible('screen-survivor-v12')&&!!W.PSY_CLEAN_SURV;const adventure=visible('psy-platform-screen')||visible('psy-adventure');const world=visible('screen-world');return{active:survivor||adventure||world,hideCity:survivor||adventure,survivor,adventure,world}}
const POS_KEYS=['x','y','px','py','tx','ty'];let cityLock=null,wasExclusive=false,savedDisplay=null;
function citySnapshot(){const P=P0(),o={};if(P)for(const k of POS_KEYS)if(Number.isFinite(Number(P[k])))o[k]=Number(P[k]);return o}
function restoreCity(o){const P=P0();if(!P||!o)return;for(const [k,v] of Object.entries(o))P[k]=v;P.moving=false;W.clickMove=null}
function releaseMovementKeys(){const data=[['ArrowUp','ArrowUp'],['ArrowDown','ArrowDown'],['ArrowLeft','ArrowLeft'],['ArrowRight','ArrowRight'],['KeyW','w'],['KeyA','a'],['KeyS','s'],['KeyD','d'],['Space',' ']];for(const [code,key] of data){try{W.dispatchEvent(new KeyboardEvent('keyup',{code,key,bubbles:true}))}catch(_){}}W.joyX=0;W.joyY=0;W.clickMove=null;if(W.V12_KEYS)Object.assign(W.V12_KEYS,{left:false,right:false,up:false,down:false});try{W.resetJoy?.()}catch(_){}}
function isolateCity(){const st=exclusiveState(),game=D.getElementById('game-wrap');if(st.active){if(!wasExclusive){cityLock=citySnapshot();wasExclusive=true}restoreCity(cityLock);if(st.hideCity&&game&&getComputedStyle(game).display!=='none'){if(savedDisplay===null)savedDisplay=game.style.display||'block';game.style.display='none'}return}if(wasExclusive){restoreCity(cityLock);releaseMovementKeys();cityLock=null;wasExclusive=false;if(game&&savedDisplay!==null){game.style.display=savedDisplay||'block';savedDisplay=null}}}

/* Re-assert spawn filters after lazy modes finish loading. */
function maintenance(){enforcePsyduckExclusive();patchStartGuard();isolateCity()}
const timer=setInterval(maintenance,180);W.addEventListener('pagehide',()=>clearInterval(timer),{once:true});maintenance();setTimeout(maintenance,500);setTimeout(maintenance,1600);

console.log('✅ PSYWORLD V30 ativo: troca obrigatória persistente, derrota manual, Psyduck exclusivo Survivor e cidade isolada',BUILD);
})(window,document);
