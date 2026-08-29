/* ============================================================
   PSYWORLD — PSYDUCK FORMS IN NORMAL BATTLE (OPTIMIZED)
   Reuses Survivor spritesheets directly: no duplicated frame images.
   ============================================================ */
(function(){
const W=window,D=document,BLANK='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
function psyBattleForm(p){
  if(!p||Number(p.id)!==54)return null;
  const rarity=String(p?.rarity?.n||p?.quality||'').toUpperCase();
  if(rarity==='SQUIZO'||p.psySquizo||p.squizo)return'squizo';
  const mega=!!(p.psyMega||p.isMega),shiny=!!p.shiny;
  return mega&&shiny?'mega_shiny':mega?'mega':shiny?'shiny':'normal';
}
function psyBattleImg(side){return D.getElementById(side==='enemy'?'enemy-img':'player-img')}
function psyBattlePoke(side){return side==='enemy'?((typeof battleData!=='undefined'&&battleData?.wild)||null):(W.P?.team?.[0]||null)}
function psyBattleSetState(side,state,duration){const el=psyBattleImg(side),form=psyBattleForm(psyBattlePoke(side));if(!el||!form)return false;const now=performance.now();el.dataset.psyBattleState=state;el.dataset.psyBattleStart=String(now);el.dataset.psyBattleUntil=String(now+duration);return true}
function psyBattleClear(el){if(!el)return;el.classList.remove('psy-battle-custom-form','psy-battle-normal','psy-battle-shiny','psy-battle-mega','psy-battle-mega_shiny','psy-battle-squizo');el.style.backgroundImage='';el.style.backgroundSize='';el.style.backgroundPosition='';el.style.backgroundRepeat='';delete el.dataset.psyBattleState;delete el.dataset.psyBattleStart;delete el.dataset.psyBattleUntil;delete el.dataset.psyFrameKey}
function psyBattleRect(form,state,frame){
  const rows={idle:0,attack:2,hurt:4},row=rows[state]??0;
  if(form==='mega'||form==='mega_shiny'){const rects=form==='mega_shiny'?W.PSY_PSYDUCK_MEGA_SHINY_RECTS:W.PSY_PSYDUCK_MEGA_RECTS;const r=rects?.[row]?.[frame];if(r)return r}
  if(form==='shiny'&&state==='hurt'){const r=W.PSY_PSYDUCK_SHINY_HURT_RECTS?.[frame];if(r)return r}
  return[frame*128,row*128,128,128]
}
function psyBattleRenderSide(side,now){
  const el=psyBattleImg(side),p=psyBattlePoke(side),form=psyBattleForm(p),sheets=W.PSY_PSYDUCK_SHEETS;
  if(!el)return;if(!form||!sheets?.[form]){psyBattleClear(el);return}
  el.classList.add('psy-battle-custom-form','psy-battle-'+form);
  const until=Number(el.dataset.psyBattleUntil||0),state=now<until?String(el.dataset.psyBattleState||'idle'):'idle',start=Number(el.dataset.psyBattleStart||now),elapsed=Math.max(0,now-start);
  let frame=0;if(state==='hurt')frame=Math.min(3,Math.floor(elapsed/105));else if(state==='attack')frame=elapsed<220?1:0;else frame=Math.floor(now/185)%4;
  const key=form+':'+state+':'+frame+':'+Math.round(el.clientWidth||150);if(el.dataset.psyFrameKey===key)return;el.dataset.psyFrameKey=key;
  const [sx,sy,sw,sh]=psyBattleRect(form,state,frame),bw=Math.max(1,el.clientWidth||150),bh=Math.max(1,el.clientHeight||150),scale=Math.min(bw/sw,bh/sh),dw=sw*scale,dh=sh*scale,ox=(bw-dw)/2-sx*scale,oy=(bh-dh)-sy*scale;
  if(el.src!==BLANK)el.src=BLANK;el.style.backgroundImage=`url("${sheets[form]}")`;el.style.backgroundRepeat='no-repeat';el.style.backgroundSize=`${512*scale}px ${768*scale}px`;el.style.backgroundPosition=`${ox}px ${oy}px`;
}
function psyBattleTick(){const active=(typeof inBattle!=='undefined'&&inBattle)||(W.inBattle===true);if(!active)return;const now=performance.now();psyBattleRenderSide('player',now);psyBattleRenderSide('enemy',now)}
setInterval(psyBattleTick,80);
const oldStart=W.startBattle;W.startBattle=function(){const r=oldStart?.apply(this,arguments);setTimeout(()=>psyBattleTick(),30);setTimeout(()=>psyBattleTick(),170);return r};try{startBattle=W.startBattle}catch(e){}
const oldAttack=W.attackAnimation||((typeof attackAnimation!=='undefined')?attackAnimation:null);W.attackAnimation=function(who){if(who==='player'&&psyBattleForm(W.P?.team?.[0]))psyBattleSetState('player','attack',410);else if(who==='enemy'&&psyBattleForm(psyBattlePoke('enemy')))psyBattleSetState('enemy','attack',410);return oldAttack?.apply(this,arguments)};try{attackAnimation=W.attackAnimation}catch(e){}
const oldPlayerBlink=W.setPlayerBlink||((typeof setPlayerBlink!=='undefined')?setPlayerBlink:null);W.setPlayerBlink=function(){if(psyBattleForm(W.P?.team?.[0])){const el=psyBattleImg('player');if(el)el.classList.remove('poke-blink');try{isPlayerBlinking=false;playerBlinkTimer=0}catch(e){}psyBattleSetState('player','hurt',440);return}return oldPlayerBlink?.apply(this,arguments)};try{setPlayerBlink=W.setPlayerBlink}catch(e){}
const oldEnemyBlink=W.setEnemyBlink||((typeof setEnemyBlink!=='undefined')?setEnemyBlink:null);W.setEnemyBlink=function(){if(psyBattleForm(psyBattlePoke('enemy'))){const el=psyBattleImg('enemy');if(el)el.classList.remove('poke-blink');try{isEnemyBlinking=false;enemyBlinkTimer=0}catch(e){}psyBattleSetState('enemy','hurt',440);return}return oldEnemyBlink?.apply(this,arguments)};try{setEnemyBlink=W.setEnemyBlink}catch(e){}
const oldSetActive=W.setActive||((typeof setActive!=='undefined')?setActive:null);if(oldSetActive)W.setActive=function(){const r=oldSetActive.apply(this,arguments);setTimeout(()=>psyBattleRenderSide('player',performance.now()),40);return r};try{if(W.setActive)setActive=W.setActive}catch(e){}
console.log('✅ Psyduck Battle Forms optimized: shared Survivor sheets');
})();
