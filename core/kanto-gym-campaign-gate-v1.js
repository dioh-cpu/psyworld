/* PSYWORLD: Gym replays only after a victory fought inside Kanto campaign.
   General badge progress alone never unlocks a replay. */
(function(W,D){
'use strict';
if(W.PsyCampaignGymGate)return;
const origins={kanto_brock:'pewter',kanto_misty:'cerulean',kanto_surge:'vermilion',
 kanto_erika:'celadon',kanto_koga:'fuchsia',kanto_sabrina:'saffron',
 kanto_blaine:'cinnabar',kanto_giovanni:'viridian-gym'};
const player=()=>{try{return typeof P!=='undefined'?P:W.P||{}}catch(_){return W.P||{}}};
function ledger(){const p=player();p.meta=p.meta||{};const x=p.meta.kantoCampaignGymV1||(p.meta.kantoCampaignGymV1={victories:{}});x.victories=x.victories||{};return x}
function hasClearedInCampaign(id){return !!ledger().victories[id]&&Array.isArray(player().gymProgress)&&player().gymProgress.includes(id)}
function reason(){return 'Derrote este líder primeiro na campanha para liberar a revanche pelo menu GINÁSIOS.'}
let permit=null,active=null;
function beginFromCampaign(id,place){
 const pos=W.PsyKantoPlayableV1?.getPosition?.();
 if(origins[id]!==place||pos?.world!==place)return false;
 permit={id,place};
 W.setTimeout?.(()=>{if(permit?.id===id)permit=null},250);
 return true;
}
function markVictory(id){
 if(!active||active.id!==id||active.place!==origins[id])return false;
 if(!Array.isArray(player().gymProgress)||!player().gymProgress.includes(id))return false;
 ledger().victories[id]={place:active.place,date:Date.now()};
 permit=null;active=null;
 try{W.autoSave?.()}catch(_){}
 return true;
}
function cancel(){active=null;permit=null}
const starter=W.startGymBattle;
if(typeof starter==='function')W.startGymBattle=function(id){
 const story=permit?.id===id&&permit.place===origins[id];permit=null;
 if(!story&&!hasClearedInCampaign(id)){W.notif?.('🔒 '+reason(),3800);return false}
 active=story?{id,place:origins[id]}:null;
 const result=starter.apply(this,arguments);
 if(story)W.setTimeout?.(()=>{
  const b=D.getElementById('battle-screen');
  if(!b||W.getComputedStyle(b).display==='none')active=null;
 },80);
 return result;
};
const next=W.startNextGymPoke;
if(typeof next==='function')W.startNextGymPoke=function(){
 let wonId=null;
 try{if(typeof gymBattle!=='undefined'&&gymBattle&&gymBattle.current>=6)wonId=gymBattle.gym?.id}catch(_){}
 const result=next.apply(this,arguments);
 if(wonId)markVictory(wonId);
 return result;
};
const nextGym=W.psyV10NextGym;
if(typeof nextGym==='function')W.psyV10NextGym=function(id){
 if(!hasClearedInCampaign(id)){W.notif?.('🔒 '+reason(),3800);return false}
 return nextGym.apply(this,arguments);
};
function annotate(){
 const list=D.getElementById('gyms-list');if(!list)return;
 if(!list.dataset.psyCampaignGate){
  list.dataset.psyCampaignGate='1';
  list.addEventListener('click',e=>{
   const card=e.target?.closest?.('.gym-card'),id=card?.dataset.psyCampaignGym;
   if(id&&!hasClearedInCampaign(id)){
    e.preventDefault();e.stopImmediatePropagation();
    W.notif?.('🔒 '+reason(),3800);
   }
  },true);
 }
 const cards=[...list.querySelectorAll('.gym-card')],gyms=[];
 try{for(const region of typeof GYM_DATA!=='undefined'?GYM_DATA:W.GYM_DATA||[])gyms.push(...(region.gyms||[]))}catch(_){}
 cards.forEach((card,i)=>{
  const gym=gyms[i];if(!gym)return;
  card.dataset.psyCampaignGym=gym.id;
  card.querySelector('[data-psy-campaign-gym-lock]')?.remove();
  if(hasClearedInCampaign(gym.id)){card.removeAttribute('aria-disabled');card.classList.remove('locked');return}
  card.classList.add('locked');card.setAttribute('aria-disabled','true');
  card.style.position='relative';
  const lock=D.createElement('div');lock.dataset.psyCampaignGymLock='1';
  lock.style.cssText='position:absolute;inset:0;z-index:25;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:6px;padding:8px;text-align:center;border-radius:inherit;border:1px solid #7ad8dc;background:#020b18ee;color:#f8fafc;pointer-events:none';
  lock.innerHTML='<b style="font-size:12px;color:#ffe2a5">🔒 CAMPANHA PRIMEIRO</b><small style="font-size:10px;line-height:1.35">Vença este líder na campanha para liberar a revanche.</small>';
  card.appendChild(lock);
 });
}
const renderBase=W.renderGyms;
if(typeof renderBase==='function')W.renderGyms=function(){const r=renderBase.apply(this,arguments);W.setTimeout?.(annotate,100);return r};
W.PsyCampaignGymGate={beginFromCampaign,markVictory,hasClearedInCampaign,cancel,annotate};
})(window,document);
