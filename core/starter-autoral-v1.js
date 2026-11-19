/* PSYWORLD — original creatures as starter choices (test branch).
 * Adds an "Criaturas Autorais" row to the starter screen. Each card plays the creature's idle MP4.
 * Selecting a card uses the existing starter flow (selectPoke -> chosenPoke -> confirmStarter).
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

// Register the new species in the engine's lookup tables so moves, names and types resolve.
function registerSpecies(){
 CREATURES.forEach(c=>{
  try{if(typeof ALL_POKE_NAMES!=='undefined')ALL_POKE_NAMES[c.id]=c.name;}catch(_){}
  try{if(typeof TYPE_BY_ID_ALL!=='undefined')TYPE_BY_ID_ALL[c.id]=c.type;}catch(_){}
  try{if(W.TYPE_BY_ID_EXT)W.TYPE_BY_ID_EXT[c.id]=c.type;}catch(_){}
  try{if(W.TYPE_BY_ID_FULL)W.TYPE_BY_ID_FULL[c.id]=c.type;}catch(_){}
 });
}

function injectStyle(){
 if(D.getElementById('psy-starter-autoral-css'))return;
 const s=D.createElement('style');s.id='psy-starter-autoral-css';
 s.textContent=
  '.s-card.s-autoral{width:176px;position:relative}'+
  '.s-card.s-autoral .s-video{position:relative;width:100%;aspect-ratio:960/524;background:transparent}'+
  '.s-card.s-autoral .s-tag{position:absolute;top:4px;right:4px;font-size:9px;letter-spacing:1px;'+
  'color:#c084fc;border:1px solid #9333ea;border-radius:4px;padding:1px 4px;background:#0b0614}'+
  '.s-card.s-autoral.sel{border-color:#9333ea;background:#12082a}';
 D.head.appendChild(s);
}

const mounted=[];
function clearMounted(){while(mounted.length){try{mounted.pop().destroy();}catch(_){}}}

function addSection(){
 const list=D.getElementById('starter-list');
 if(!list||!W.PsyMonsterVideoV1)return;
 clearMounted();
 const old=list.querySelector('.gen-section.autoral');if(old)old.remove();
 const sec=D.createElement('div');
 sec.className='gen-section autoral';
 sec.innerHTML='<div class="gen-label">🌑 Criaturas Autorais</div>';
 const row=D.createElement('div');row.className='starter-row';
 CREATURES.forEach(c=>{
  const card=D.createElement('div');
  card.className='s-card s-autoral';card.id='sc'+c.id;
  card.innerHTML='<div class="s-video"></div><span class="s-tag">AUTORAL</span>'+
   '<span class="sname">'+c.name+'</span><span class="stype">'+c.type+'</span>';
  const host=card.querySelector('.s-video');
  card.onclick=()=>{
   const starter={id:c.id,name:c.name,type:c.type,autoral:true};
   if(typeof selectPoke==='function')selectPoke(starter,card);
  };
  row.appendChild(card);
  card.__host=host;card.__creature=c;
 });
 sec.appendChild(row);
 list.insertBefore(sec,list.firstChild);
 row.querySelectorAll('.s-autoral').forEach(card=>{
  mounted.push(W.PsyMonsterVideoV1.mount(card.__host,{url:card.__creature.idle,width:card.__creature.width,height:card.__creature.height}));
 });
}

function install(){
 if(typeof W.buildStarterScreen!=='function')return false;
 if(W.buildStarterScreen.__autoral)return true;
 const original=W.buildStarterScreen;
 const wrapped=function(){
  const out=original.apply(this,arguments);
  try{registerSpecies();injectStyle();addSection();}catch(err){console.warn('starter-autoral',err);}
  return out;
 };
 wrapped.__autoral=true;
 W.buildStarterScreen=wrapped;
 return true;
}

registerSpecies();
install();

W.PsyStarterAutoralV1={creatures:CREATURES,install,clear:clearMounted};
})(window,document);
