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
  idleClips:{
   down:{url:'assets/monsters/noctarn/idle-front.mp4?build=NOCTARN_IDLE_V1',width:480,height:262,scale:1,baseY:0.9847,pawCx:0.5182},
   left:{url:'assets/monsters/noctarn/idle-left.mp4?build=NOCTARN_IDLE_LEFT_V1',width:480,height:270,scale:1.083,baseY:0.9556,pawCx:0.5307},
   right:{url:'assets/monsters/noctarn/idle-left.mp4?build=NOCTARN_IDLE_LEFT_V1',width:480,height:270,scale:1.083,baseY:0.9556,pawCx:0.5307,flip:true},
   up:{url:'assets/monsters/noctarn/idle-back.mp4?build=NOCTARN_IDLE_BACK_V1',width:480,height:270,scale:1.074,baseY:0.9556,pawCx:0.4901}
  },
  idle4dir:'assets/monsters/noctarn/noctarn-idle-4dir.webp?build=NOCTARN_4DIR_V1',
  cellW:640,
  cellH:512,
  baseline:500,
  sprite:'assets/monsters/noctarn/sprite-front.png?build=NOCTARN_SPRITE_V2',
  worldHeight:138,
  trailDistance:92,
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

function isAutoral(mon){return !!mon&&BY_ID.has(String(mon.id));}
function get(id){return BY_ID.get(String(id));}

/* Static PNG for Team, Box and list icons. */
function patchSpriteHelpers(){
 ['getPokeAnim','getRealSprite'].forEach(name=>{
  const orig=W[name];
  if(typeof orig!=='function'||orig.__autoral)return;
  const wrapped=function(p){const c=p&&get(p.id);return c?c.sprite:orig.apply(this,arguments);};
  wrapped.__autoral=true;W[name]=wrapped;
 });
 const origUrl=W.getSpriteUrl;
 if(typeof origUrl==='function'&&!origUrl.__autoral){
  const wrappedUrl=function(id){const c=get(id);return c?c.sprite:origUrl.apply(this,arguments);};
  wrappedUrl.__autoral=true;W.getSpriteUrl=wrappedUrl;
 }
}

/* Animated idle video on the battle screen (player and enemy). */
const battle={player:null,enemy:null};
function battleMon(side){
 try{
  if(side==='player')return (typeof P!=='undefined'&&P.team&&P.team[0])||null;
  return (typeof battleData!=='undefined'&&battleData&&battleData.wild)||null;
 }catch(_){return null;}
}
function syncSide(side){
 const img=D.getElementById(side==='player'?'player-img':'enemy-img');
 if(!img)return;
 const mon=battleMon(side),c=isAutoral(mon)?get(mon.id):null,cur=battle[side];
 if(c){
  if(cur&&cur.id===c.id&&cur.host.isConnected){img.style.display='none';return;}
  if(cur){cur.inst.destroy();cur.host.remove();battle[side]=null;}
  const host=D.createElement('div');host.className='psy-monster-video psy-battle-video';
  host.style.cssText='width:260px;margin:0 auto;';
  img.parentNode.insertBefore(host,img);
  img.style.display='none';
  battle[side]={id:c.id,host,inst:W.PsyMonsterVideoV1.mount(host,{url:c.idle,width:c.width,height:c.height})};
 }else if(cur){
  cur.inst.destroy();cur.host.remove();battle[side]=null;
  img.style.display='';
 }
}
function syncBattle(){if(!W.PsyMonsterVideoV1)return;syncSide('player');syncSide('enemy');}

registerSpecies();
registerGeneration();
patchSpriteHelpers();
W.setInterval(syncBattle,400);
injectStyle();
if(D.body)observe();else D.addEventListener('DOMContentLoaded',observe);

W.PsyStarterAutoralV1={creatures:CREATURES,scan,isAutoral,get,syncBattle};
})(window,document);
