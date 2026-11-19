/* PSYWORLD — original creatures as starter choices (test branch).
 * Adds an "Criaturas Autorais" generation to GENS, so the Kanto campaign starter picker
 * (and the legacy starter screen) list it. Cards for these creatures play the idle MP4
 * instead of a sprite image.
 */
(function(W,D){
'use strict';
if(W.PsyStarterAutoralV1)return;

const CREATURES=[
 {
  id:9001,
  name:'Noctarn',
  type:'Noturno',
  autoral:true,
  idle:'assets/monsters/noctarn/idle-front.mp4?build=NOCTARN_IDLE_V1',
  width:480,
  height:262
 }
];
const BY_ID=new Map(CREATURES.map(c=>[String(c.id),c]));

function registerSpecies(){
 CREATURES.forEach(c=>{
  try{if(typeof ALL_POKE_NAMES!=='undefined')ALL_POKE_NAMES[c.id]=c.name;}catch(_){}
  try{if(typeof TYPE_BY_ID_ALL!=='undefined')TYPE_BY_ID_ALL[c.id]=c.type;}catch(_){}
  try{if(W.TYPE_BY_ID_EXT)W.TYPE_BY_ID_EXT[c.id]=c.type;}catch(_){}
  try{if(W.TYPE_BY_ID_FULL)W.TYPE_BY_ID_FULL[c.id]=c.type;}catch(_){}
 });
}

function registerGeneration(){
 let gens=null;
 try{gens=typeof GENS!=='undefined'?GENS:null;}catch(_){}
 if(!Array.isArray(gens))return false;
 if(gens.some(g=>g&&g.autoral))return true;
 gens.unshift({
  label:'🌑 Criaturas Autorais',
  autoral:true,
  starters:CREATURES.map(c=>({id:c.id,name:c.name,type:c.type,autoral:true}))
 });
 return true;
}

function injectStyle(){
 if(D.getElementById('psy-starter-autoral-css'))return;
 const s=D.createElement('style');s.id='psy-starter-autoral-css';
 s.textContent=
  '.psy-monster-video{position:relative;width:100%;aspect-ratio:960/524;margin:0 auto}'+
  '.psy-kc-choice.psy-has-video{grid-column:span 2}'+
  '.psy-kc-choice.psy-has-video .psy-monster-video{max-width:200px}'+
  '.s-card.psy-has-video{width:176px}'+
  '.s-card.psy-has-video .psy-monster-video{max-width:164px}';
 D.head.appendChild(s);
}

function upgradeCard(el){
 if(!el||el.dataset.psyVideo==='1')return;
 const id=el.dataset.starter||(el.id&&el.id.replace(/^sc/,''));
 const c=BY_ID.get(String(id));
 if(!c||!W.PsyMonsterVideoV1)return;
 el.dataset.psyVideo='1';el.classList.add('psy-has-video');
 const img=el.querySelector('img');
 const host=D.createElement('div');host.className='psy-monster-video';
 if(img)img.replaceWith(host);else el.insertBefore(host,el.firstChild);
 W.PsyMonsterVideoV1.mount(host,{url:c.idle,width:c.width,height:c.height});
}

function scan(root){
 (root||D).querySelectorAll('[data-starter],.s-card').forEach(el=>{
  const id=el.dataset.starter||(el.id&&el.id.replace(/^sc/,''));
  if(BY_ID.has(String(id)))upgradeCard(el);
 });
}

function observe(){
 const mo=new MutationObserver(()=>scan(D));
 mo.observe(D.body||D.documentElement,{childList:true,subtree:true});
 scan(D);
}

registerSpecies();
registerGeneration();
injectStyle();
if(D.body)observe();else D.addEventListener('DOMContentLoaded',observe);

W.PsyStarterAutoralV1={creatures:CREATURES,scan};
})(window,document);
