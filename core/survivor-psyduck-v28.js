/* PSYWORLD — Survivor / Psyduck Regression Guard V28
   Loaded after the authoritative Survivor V9 hard-pin and v50 compatibility layer.
   Keeps the approved VFX while fixing helper HUD, Wobbuffet, elite attacks,
   Instinto de Caca visibility, Psyduck trial Tier progression and normal Psyduck Hunts. */
(function(W,D){
'use strict';
if(W.__PSYWORLD_SURVIVOR_PSYDUCK_V28__)return;
W.__PSYWORLD_SURVIVOR_PSYDUCK_V28__=true;
const BUILD='SURVIVOR_PSYDUCK_V28_20260903_B';
const norm=s=>String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const allPokes=()=>{try{return [...(W.P?.team||[]),...(W.P?.box||[])]}catch(_){return[]}};

/* ---------- Psyduck Supremo: Tier/Qualidade belong to its own Trials ---------- */
const TIER_TRIALS=[[1,'D'],[3,'C'],[5,'B'],[7,'A'],[9,'S'],[11,'SS'],[13,'SSS'],[15,'UR'],[17,'UR+'],[19,'UR++'],[21,'SP']];
const QUALITY_TRIALS=[[2,'Quase Lixo'],[4,'Nice'],[6,'Belezura'],[8,'Lêndea'],[10,'Bombado'],[12,'Pika das Galáxias'],[14,'DEUS'],[16,'CRIADOR'],[18,'VOID'],[20,'OBLIVION'],[22,'SQUIZO']];
function rarityByName(name){
  const list=W.RARITIES||[],reb=W.PSY_RARITY_REBORN||{};
  const found=list.find(r=>r?.n===name)||Object.values(reb).find(r=>r?.n===name);
  if(name==='SQUIZO'){
    const o=list.find(r=>r?.n==='OBLIVION')||reb.OBLIVION||{n:'OBLIVION',mult:40,color:'#00ffff'};
    return {...o,n:'SQUIZO',color:'#ff3df2',mult:Math.max(55,Number(o.mult||40)*1.35),cap:.03,psyduckExclusive:true};
  }
  return found?{...found}:{n:name||'Lixo',color:'#888',mult:1,cap:.5};
}
function supremeProgress(){
  let tier='E',quality='Lixo';let trials={};
  try{trials=W.P?.psyduck?.ascensionTrials||{}}catch(_){ }
  for(const [n,t] of TIER_TRIALS)if(trials['a'+n])tier=t;
  for(const [n,q] of QUALITY_TRIALS)if(trials['a'+n])quality=q;
  return{tier,quality};
}
function isSupreme(p){return !!(p&&Number(p.id)===54&&(p.psyduckChosen||p.psyLegacy||p.psyduckSupremo));}
function applySupremeProgress(p){
  if(!isSupreme(p))return p;
  const pr=supremeProgress();
  p.psyduckChosen=true;p.forceTier=pr.tier;p.tier=pr.tier;p.rarity=rarityByName(pr.quality);
  return p;
}
const oldBaseTier=W.getBaseTier;
if(typeof oldBaseTier==='function'){
  W.getBaseTier=function(id){if(Number(id)===54)return'E';return oldBaseTier.apply(this,arguments)};
  try{getBaseTier=W.getBaseTier}catch(_){ }
}
const oldRecalc=W.recalcPoke;
if(typeof oldRecalc==='function'){
  W.recalcPoke=function(p){if(isSupreme(p))applySupremeProgress(p);const r=oldRecalc.apply(this,arguments);if(isSupreme(p)){const pr=supremeProgress();p.forceTier=pr.tier;p.tier=pr.tier;}return r};
  try{recalcPoke=W.recalcPoke}catch(_){ }
}
function migrateSupreme(){
  try{
    const ducks=allPokes().filter(p=>Number(p?.id)===54),chosen=ducks.find(isSupreme);
    if(chosen){applySupremeProgress(chosen);W.recalcPoke?.(chosen);return chosen}
    const st=W.P?.psyduck||{},hasSupremeHistory=Number(st.survivorBest||0)>0||Object.keys(st.ascensionTrials||{}).length>0||Object.keys(st.trialsDone||{}).length>0;
    if(ducks.length===1&&hasSupremeHistory){ducks[0].psyduckChosen=true;applySupremeProgress(ducks[0]);W.recalcPoke?.(ducks[0]);return ducks[0]}
  }catch(e){console.warn('[V28 Psyduck migrate]',e)}
  return null;
}
function ensureDedicatedSupreme(){
  let p=migrateSupreme();if(p)return p;
  try{
    const P0=W.P;if(!P0)return null;P0.box=P0.box||[];
    const rar=rarityByName('Lixo');
    p=typeof W.createCapturedPoke==='function'?W.createCapturedPoke(54,rar,false,false,false):{id:54,name:'Psyduck',level:1,exp:0,maxExp:100,hp:125,maxHp:125,rarity:rar};
    p.psyduckChosen=true;p.psyduckSupremo=true;p.resets=Number(p.resets||0);p.forceTier='E';p.tier='E';p.rarity=rar;
    W.recalcPoke?.(p);p.hp=p.maxHp;P0.box.push(p);W.autoSave?.();return p;
  }catch(e){console.warn('[V28 Psyduck create]',e);return null}
}
const oldOpenSupreme=W.openPsyduckDungeon5;
if(typeof oldOpenSupreme==='function')W.openPsyduckDungeon5=function(){ensureDedicatedSupreme();return oldOpenSupreme.apply(this,arguments)};
if(typeof W.psy19OpenPsyduck==='function'){
  const oldPsy19=W.psy19OpenPsyduck;W.psy19OpenPsyduck=function(){ensureDedicatedSupreme();return oldPsy19.apply(this,arguments)};
}

/* Normal Psyduck is a normal Kanto/Water Hunt species. Only the owned Supremo is exclusive. */
function patchHuntPool(){
  const cur=W.psyCleanHuntPool;if(typeof cur!=='function'||cur.__psyPsyduckHuntV28)return;
  const fixed=function(region,type,band){
    const out=cur.apply(this,arguments);const list=Array.isArray(out)?out.slice():[];
    const water=['agua','water'].includes(norm(type)),kanto=String(region||'').toUpperCase()==='KANTO';
    if(kanto&&water&&!list.some(x=>Number(x)===54))list.unshift(54);
    return [...new Set(list.map(Number).filter(Number.isFinite))];
  };
  fixed.__psyPsyduckHuntV28=true;fixed.__original=cur;W.psyCleanHuntPool=fixed;
}

/* ---------- Wobbuffet: never request a fake Mega sprite ---------- */
const oldRealSprite=W.getRealSprite;
if(typeof oldRealSprite==='function'){
  W.getRealSprite=function(p){
    if(Number(p?.id)===202&&(p?.isMega||p?.mega||p?.megaForm)){
      const q={...p,isMega:false,mega:false,megaForm:null};return oldRealSprite.call(this,q);
    }
    return oldRealSprite.apply(this,arguments);
  };
  try{getRealSprite=W.getRealSprite}catch(_){ }
}

/* ---------- Instinto de Caca is already used by the loot formula; expose it in Pause ---------- */
function fortunaPct(s){const lv=Math.max(0,Math.min(5,Number(s?.upgradeLevels?.lootGold||0)));return lv*2+(s?.upgradeMaxed?.lootGold?5:0)}
function instinctPct(s){
  if(!s)return 0;
  if(!Number.isFinite(Number(s.v28InstintoCaca)))s.v28InstintoCaca=Math.max(0,Number(s.survLootBonus||0)-fortunaPct(s));
  return Math.max(0,Number(s.v28InstintoCaca||0));
}
const oldEliteReward=W.psySurvEliteReward;
if(typeof oldEliteReward==='function')W.psySurvEliteReward=function(kind){
  const s=W.PSY_CLEAN_SURV,before=Number(s?.survLootBonus||0),r=oldEliteReward.apply(this,arguments);
  if(kind==='loot'&&s){const gained=Math.max(0,Number(s.survLootBonus||0)-before)||5;s.v28InstintoCaca=instinctPct(s)+gained;try{W.autoSave?.()}catch(_){ }}
  return r;
};
function decoratePause(){
  const s=W.PSY_CLEAN_SURV;if(!s?.paused)return;const host=D.querySelector('#psy-clean-surv-current .psy-surv-pause-summary.buffs');if(!host)return;
  const pct=instinctPct(s);let el=host.querySelector('[data-v28-instinto]');
  if(pct>0){if(!el){el=D.createElement('span');el.dataset.v28Instinto='1';host.appendChild(el)}el.textContent=`🎯 Instinto de Caça +${pct.toFixed(0)}% Loot`;}
  else el?.remove();
}
const oldPause=W.psyCleanPause;
if(typeof oldPause==='function')W.psyCleanPause=function(){const r=oldPause.apply(this,arguments);setTimeout(decoratePause,0);return r};

/* ---------- Hide helper-only HP bars and form labels, not enemy special HUD ---------- */
function helperBarAt(s,x,y,w,h){
  if(!s||Math.abs(Number(h)-5)>.6)return false;
  for(const key of (s.helperIds||[])){
    const hs=s.helperState?.[key];if(!hs)continue;let vis=null;try{vis=W.PSY_SURV_DEBUG?.helperVisual?.(s,key)}catch(_){ }
    const scale=key==='blissey'?(vis?.maxed?3:(Number(vis?.lv||0)>=5?2:1)):1,sz=60*scale,bw=Math.max(42,Math.min(90,sz*.65)),by=Number(hs.y)+sz*.34,left=Number(hs.x)-bw/2;
    if(Math.abs(Number(y)-by)<2.5&&Math.abs(Number(x)-left)<2.5&&Number(w)>=0&&Number(w)<=bw+2)return true;
  }
  return false;
}
function helperLabelAt(s,text,x,y){
  if(!s||!/SHINY|MEGA|REFLECT|MAX/i.test(String(text||'')))return false;
  for(const key of (s.helperIds||[])){
    const hs=s.helperState?.[key];if(!hs)continue;let vis=null;try{vis=W.PSY_SURV_DEBUG?.helperVisual?.(s,key)}catch(_){ }
    const scale=key==='blissey'?(vis?.maxed?3:(Number(vis?.lv||0)>=5?2:1)):1,sz=60*scale,ty=Number(hs.y)+sz*.34+17;
    if(Math.abs(Number(x)-Number(hs.x))<3.5&&Math.abs(Number(y)-ty)<3.5)return true;
  }
  return false;
}
try{
  const proto=W.CanvasRenderingContext2D?.prototype;
  if(proto&&!proto.__psyHelperHudV28){
    proto.__psyHelperHudV28=true;const fr=proto.fillRect,ft=proto.fillText;
    proto.fillRect=function(x,y,w,h){const s=W.PSY_CLEAN_SURV;if(this.canvas?.id==='psy-clean-surv-canvas'&&helperBarAt(s,x,y,w,h))return;return fr.apply(this,arguments)};
    proto.fillText=function(text,x,y){const s=W.PSY_CLEAN_SURV;if(this.canvas?.id==='psy-clean-surv-canvas'&&helperLabelAt(s,text,x,y))return;return ft.apply(this,arguments)};
  }
}catch(e){console.warn('[V28 helper HUD]',e)}

/* ---------- Performance: keep full visual quality; optimize simulation/collision instead ---------- */
function preserveVfx(s){
  const p=s?.perf;if(!p||p.__v28VisualLock)return;p.__v28VisualLock=true;
  try{Object.defineProperty(p,'vfxQuality',{configurable:true,enumerable:true,get(){return 1},set(){}})}catch(_){p.vfxQuality=1}
  p.fxCap=Math.max(180,Number(p.fxCap||0));p.particleCap=Math.max(10,Number(p.particleCap||0));
  /* enemy/bullet/field caps, spatial grid, camera culling and draw throttling stay intact. */
}

/* ---------- Timed Elites get a dedicated attack. Mega/Shiny variants keep native V9 skills. ---------- */
function pushEliteBullet(s,e,a,spd,dmg,color,radius=7){
  s.enemyBullets=s.enemyBullets||[];s.enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,dmg,radius,color,life:3000,variantSpecial:true,v28Elite:true});
}
function eliteAttack(s,e){
  const dx=Number(s.x)-Number(e.x),dy=Number(s.y)-Number(e.y),aim=Math.atan2(dy,dx),cycle=Number(e.__v28EliteCycle||0);e.__v28EliteCycle=cycle+1;
  let scale=1;try{scale=Number(W.PSY_SURV_DEBUG?.minuteAttackMult?.(s)||1)}catch(_){ }
  const dmg=Math.max(2,Number(s.maxHp||125)*.012*Math.max(1,scale));
  if(cycle%2===0){for(let i=-2;i<=2;i++)pushEliteBullet(s,e,aim+i*.10,5.4,dmg,'#fb7185',7)}
  else{const count=8,off=(cycle*.31)%Math.PI;for(let i=0;i<count;i++)pushEliteBullet(s,e,off+i*Math.PI*2/count,4.7,dmg*.82,'#f43f5e',7)}
  s.effects=s.effects||[];s.effects.push({type:'burst',x:e.x,y:e.y,r:8,max:58,life:18,maxLife:18,color:'#fb7185'});
}
function survivorMaintenance(){
  const s=W.PSY_CLEAN_SURV;if(!s||s.done)return;preserveVfx(s);decoratePause();if(s.paused||D.hidden)return;
  const now=Number(s.elapsed||0);
  for(const e of (s.enemies||[])){
    if(!e||e.dead||e.boss)continue;
    if((e.mega||e.shiny)&&!e.__v28VariantArmed){e.__v28VariantArmed=true;if(!Number.isFinite(Number(e.variantSkillCd))||Number(e.variantSkillCd)>1200)e.variantSkillCd=700+Math.random()*450}
    if(!(e.timedElite||e.champion))continue;
    if(!Number.isFinite(Number(e.__v28EliteNext)))e.__v28EliteNext=now+900+Math.random()*700;
    if(now>=e.__v28EliteNext){eliteAttack(s,e);e.__v28EliteNext=now+2800+Math.random()*800}
  }
}
const maintenance=setInterval(survivorMaintenance,180);
W.addEventListener('pagehide',()=>clearInterval(maintenance),{once:true});
setTimeout(()=>{patchHuntPool();migrateSupreme();survivorMaintenance()},80);
setTimeout(()=>{patchHuntPool()},1400);
console.log('✅ PSYWORLD Survivor/Psyduck V28 ativo: runtime único, VFX preservado, Wobbuffet/HUD/Elite/Instinto/Psyduck corrigidos',BUILD);
})(window,document);
