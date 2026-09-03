/* PSYWORLD — Battle / HP / Input Integrity V29
   - HP zero permanece derrotado durante recalculos.
   - CURAR usa exatamente o maxHp vigente do mesmo Pokemon usado na batalha.
   - KO exige troca por outro Pokemon vivo; Revive nao continua a batalha automaticamente.
   - Cidade fica congelada enquanto World/Aventura/Survivor controlam o jogador.
*/
(function(W,D){
'use strict';
if(W.__PSYWORLD_BATTLE_INPUT_INTEGRITY_V29__)return;
W.__PSYWORLD_BATTLE_INPUT_INTEGRITY_V29__=true;
const BUILD='BATTLE_INPUT_INTEGRITY_V29_20260903_A';
const P0=()=>W.P||null;
const toast=(m,t=2600)=>{try{W.notif?.(m,t)}catch(_){}};

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
if(typeof recalcBase==='function'&&!recalcBase.__psyV29ZeroSafe){
  const zeroSafe=function(p){
    const wasFainted=!!p&&Number(p.hp||0)<=0;
    const r=recalcBase.apply(this,arguments);
    if(wasFainted&&p)p.hp=0;
    return r;
  };
  zeroSafe.__psyV29ZeroSafe=true;zeroSafe.__psyV29Original=recalcBase;
  W.recalcPoke=zeroSafe;try{recalcPoke=zeroSafe}catch(_){ }
}

/* Heal the actual team objects after all stat/Tier calculation, then save that exact HP. */
const healBase=W.curarTimeCity;
if(typeof healBase==='function'){
  const fullHeal=function(){
    const P=P0();if(!P?.team?.length){toast('Voce nao tem Pokemon no time.');return false}
    for(const p of P.team){
      try{W.recalcPoke?.(p)}catch(_){}
      p.hp=Math.max(1,Number(p.maxHp||1));
    }
    syncFrontPokemon();
    try{W.autoSave?.()}catch(_){}
    toast('💚 Time curado completamente!',1800);
    /* A second pass protects against a stat layer that finishes in the same tick. */
    setTimeout(()=>{
      const Q=P0();if(!Q?.team?.length)return;
      for(const p of Q.team){try{W.recalcPoke?.(p)}catch(_){}p.hp=Math.max(1,Number(p.maxHp||1));}
      syncFrontPokemon();try{W.autoSave?.()}catch(_){}
    },80);
    return true;
  };
  fullHeal.__psyV29=true;fullHeal.__psyV29Original=healBase;
  W.curarTimeCity=fullHeal;try{curarTimeCity=fullHeal}catch(_){ }
}

/* Battle starts from the same live object/HP shown in the city HUD. */
const startBase=W.startBattle;
if(typeof startBase==='function'){
  const startFixed=function(wild){
    const P=P0(),p=P?.team?.[0];
    if(!p)return startBase.apply(this,arguments);
    try{W.recalcPoke?.(p)}catch(_){}
    p.hp=Math.max(0,Math.min(Math.max(1,Number(p.maxHp||1)),Number(p.hp||0)));
    syncFrontPokemon();
    const r=startBase.apply(this,arguments);
    try{W.updateBattleHP?.()}catch(_){}
    setTimeout(()=>{
      syncFrontPokemon();try{W.updateBattleHP?.()}catch(_){}
      if(Number(P0()?.team?.[0]?.hp||0)<=0)W.psyHandleBattleFaint?.();
    },0);
    return r;
  };
  startFixed.__psyV29=true;startFixed.__psyV29Original=startBase;
  W.startBattle=startFixed;try{startBattle=startFixed}catch(_){ }
}

/* Forced switch UI: never offer Revive as a continuation after KO. */
const switchBase=W.psyOpenBattleSwitch;
if(typeof switchBase==='function'){
  W.psyOpenBattleSwitch=function(){
    const P=P0(),live=(P?.team||[]).some((p,i)=>i>0&&Number(p?.hp||0)>0);
    if(!live){W.__PSY_FORCE_SWITCH_V29=false;setTimeout(()=>W.endBattle?.(false),120);return null}
    W.__PSY_FORCE_SWITCH_V29=true;
    const m=switchBase.call(this,false);
    const modal=D.getElementById('psy-battle-switch-required')||m;
    const p=modal?.querySelector('p');if(p)p.textContent='Escolha obrigatoriamente outro Pokemon vivo para continuar a batalha.';
    modal?.querySelectorAll('[data-switch]').forEach(b=>b.addEventListener('click',()=>{
      setTimeout(()=>{W.__PSY_FORCE_SWITCH_V29=false;syncFrontPokemon();try{W.updateBattleHP?.()}catch(_){}},0);
    },{once:true}));
    return modal;
  };
}

W.psyHandleBattleFaint=function(){
  const P=P0(),active=P?.team?.[0];if(!active||Number(active.hp||0)>0)return false;
  active.hp=0;syncFrontPokemon();try{W.autoSave?.()}catch(_){}
  const live=(P.team||[]).some((p,i)=>i>0&&Number(p?.hp||0)>0);
  if(live){W.__PSY_FORCE_SWITCH_V29=true;setTimeout(()=>W.psyOpenBattleSwitch?.(false),80);return true}
  W.__PSY_FORCE_SWITCH_V29=false;
  const log=D.getElementById('battle-log');if(log)log.textContent='💀 Todo o time foi derrotado!';
  setTimeout(()=>W.endBattle?.(false),450);return true;
};

/* Do not allow another action while replacement choice is pending. */
const actionBase=W.battleAction;
if(typeof actionBase==='function'){
  const guardedAction=function(){
    if(W.__PSY_FORCE_SWITCH_V29||Number(P0()?.team?.[0]?.hp||0)<=0){W.psyHandleBattleFaint?.();return}
    return actionBase.apply(this,arguments);
  };
  guardedAction.__psyV29=true;guardedAction.__psyV29Original=actionBase;
  W.battleAction=guardedAction;try{battleAction=guardedAction}catch(_){ }
}
const endBase=W.endBattle;
if(typeof endBase==='function'){
  W.endBattle=function(){W.__PSY_FORCE_SWITCH_V29=false;D.getElementById('psy-battle-switch-required')?.remove();return endBase.apply(this,arguments)};
  try{endBattle=W.endBattle}catch(_){ }
}

/* ===== City input isolation =====
   World has its own worldPlayer; Survivor and Adventure have their own run/player state.
   The city must not consume the same keyboard/touch state underneath them. */
function visible(id){const e=D.getElementById(id);if(!e)return false;const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0'}
function exclusiveState(){
  const survivor=visible('screen-survivor-v12')&&!!W.PSY_CLEAN_SURV;
  const adventure=visible('psy-platform-screen');
  const world=visible('screen-world');
  return{active:survivor||adventure||world,hideCity:survivor||adventure,survivor,adventure,world};
}
const POS_KEYS=['x','y','px','py','tx','ty'];
let cityLock=null,wasExclusive=false,savedDisplay=null;
function citySnapshot(){const P=P0(),o={};if(P)for(const k of POS_KEYS)if(Number.isFinite(Number(P[k])))o[k]=Number(P[k]);return o}
function restoreCity(o){const P=P0();if(!P||!o)return;for(const [k,v] of Object.entries(o))P[k]=v;P.moving=false;W.clickMove=null}
function releaseMovementKeys(){
  const data=[['ArrowUp','ArrowUp'],['ArrowDown','ArrowDown'],['ArrowLeft','ArrowLeft'],['ArrowRight','ArrowRight'],['KeyW','w'],['KeyA','a'],['KeyS','s'],['KeyD','d'],['Space',' ']];
  for(const [code,key] of data){try{W.dispatchEvent(new KeyboardEvent('keyup',{code,key,bubbles:true}))}catch(_){}}
  W.joyX=0;W.joyY=0;W.clickMove=null;
  if(W.V12_KEYS)Object.assign(W.V12_KEYS,{left:false,right:false,up:false,down:false});
  try{W.resetJoy?.()}catch(_){}
}
function isolateCity(){
  const st=exclusiveState(),game=D.getElementById('game-wrap');
  if(st.active){
    if(!wasExclusive){cityLock=citySnapshot();wasExclusive=true}
    restoreCity(cityLock);
    if(st.hideCity&&game&&getComputedStyle(game).display!=='none'){
      if(savedDisplay===null)savedDisplay=game.style.display||'block';
      game.style.display='none';
    }
    return;
  }
  if(wasExclusive){
    restoreCity(cityLock);releaseMovementKeys();cityLock=null;wasExclusive=false;
    if(game&&savedDisplay!==null){game.style.display=savedDisplay||'block';savedDisplay=null}
  }
}
const isolationTimer=setInterval(isolateCity,60);
W.addEventListener('pagehide',()=>clearInterval(isolationTimer),{once:true});
setTimeout(isolateCity,0);

console.log('✅ PSYWORLD V29 HP/KO/Input ativo: cura integral, HP zero persistente, troca obrigatoria e cidade isolada',BUILD);
})(window,document);
