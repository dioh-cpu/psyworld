(function(){
'use strict';
const W=window,D=document;
if(W.psyAudio)return;

const BASE='assets/audio/';
const FILES={
  theme:'psyworld_theme.mp3',
  ui_click:'ui_click.mp3',battle_start:'battle_start.mp3',hit:'hit.mp3',
  status:'status.mp3',heal:'heal.mp3',capture:'capture.mp3',
  victory:'victory.mp3',defeat:'defeat.mp3',levelup:'levelup.mp3',
  egg:'egg.mp3',pack:'pack.mp3',
  normal:'normal.mp3',fire:'fire.mp3',water:'water.mp3',electric:'electric.mp3',
  grass:'grass.mp3',ice:'ice.mp3',fighting:'fighting.mp3',poison:'poison.mp3',
  ground:'ground.mp3',flying:'flying.mp3',psychic:'psychic.mp3',bug:'bug.mp3',
  rock:'rock.mp3',ghost:'ghost.mp3',dragon:'dragon.mp3',dark:'dark.mp3',
  steel:'steel.mp3',fairy:'fairy.mp3',
  psy_shot:'psy_shot.mp3',psy_nova:'psy_nova.mp3',psy_vortex:'psy_vortex.mp3',
  psy_rain:'psy_rain.mp3',
  helper_pikachu:'helper_pikachu.mp3',helper_lapras:'helper_lapras.mp3',
  helper_charizard:'helper_charizard.mp3',helper_slowpoke:'helper_slowpoke.mp3',
  helper_gengar:'helper_gengar.mp3',helper_dragonite:'helper_dragonite.mp3',
  helper_blissey:'helper_blissey.mp3',
  enemy_shiny:'enemy_shiny.mp3',enemy_mega:'enemy_mega.mp3',
  enemy_mega_shiny:'enemy_mega_shiny.mp3'
};

const TYPE={
  normal:'normal',
  fire:'fire',fogo:'fire',
  water:'water',agua:'water','água':'water',
  electric:'electric',eletrico:'electric','elétrico':'electric',
  grass:'grass',planta:'grass',
  ice:'ice',gelo:'ice',
  fighting:'fighting',lutador:'fighting',
  poison:'poison',veneno:'poison',venenoso:'poison',
  ground:'ground',terra:'ground',
  flying:'flying',voador:'flying',
  psychic:'psychic',psiquico:'psychic','psíquico':'psychic',
  bug:'bug',inseto:'bug',
  rock:'rock',pedra:'rock',
  ghost:'ghost',fantasma:'ghost',
  dragon:'dragon',dragao:'dragon','dragão':'dragon',
  dark:'dark',noturno:'dark',sombrio:'dark',
  steel:'steel',aco:'steel','aço':'steel',metal:'steel',
  fairy:'fairy',fada:'fairy',
  status:'status'
};

const settings={
  music: Number(localStorage.getItem('psy_audio_music') ?? .28),
  sfx: Number(localStorage.getItem('psy_audio_sfx') ?? .72),
  musicOn: localStorage.getItem('psy_audio_music_on')!=='0',
  sfxOn: localStorage.getItem('psy_audio_sfx_on')!=='0'
};
const last=new Map(),pools={},poolIndex={};
let unlocked=false,theme=null,duck=.28;

function clamp(v,a=0,b=1){return Math.max(a,Math.min(b,Number(v)||0))}
function saveSettings(){
  try{
    localStorage.setItem('psy_audio_music',String(settings.music));
    localStorage.setItem('psy_audio_sfx',String(settings.sfx));
    localStorage.setItem('psy_audio_music_on',settings.musicOn?'1':'0');
    localStorage.setItem('psy_audio_sfx_on',settings.sfxOn?'1':'0');
  }catch(e){}
}
function pool(name){
  if(pools[name])return pools[name];
  const src=FILES[name];if(!src)return[];
  pools[name]=Array.from({length: name==='hit'||name==='ui_click'?5:3},()=>{
    const a=new Audio(BASE+src);a.preload='auto';a.playsInline=true;return a;
  });
  poolIndex[name]=0;return pools[name];
}
function sfx(name,opt={}){
  if(!settings.sfxOn||!FILES[name])return;
  const now=performance.now(),cd=Number(opt.cooldown??(name==='ui_click'?55:110));
  if(now-Number(last.get(name)||0)<cd)return;
  last.set(name,now);
  const arr=pool(name);if(!arr.length)return;
  const i=poolIndex[name]++%arr.length,a=arr[i];
  try{
    a.pause();a.currentTime=0;
    a.volume=clamp(settings.sfx*Number(opt.volume??1));
    const p=a.play();if(p?.catch)p.catch(()=>{});
  }catch(e){}
}
function typeKey(type){
  let k=String(type||'normal').trim().toLowerCase().split(/[\/\-]/)[0].trim();
  return TYPE[k]||'normal';
}
function sfxForMove(move){
  const name=String(move?.name||'').toLowerCase();
  if(Number(move?.power||0)<=0||String(move?.type||'').toLowerCase()==='status'){
    if(/heal|recover|rest|wish|life|roost|soft|milk|synthesis|aqua ring/.test(name))return sfx('heal');
    return sfx('status');
  }
  return sfx(typeKey(move?.type),{volume:.92,cooldown:90});
}
function ensureTheme(){
  if(theme)return theme;
  theme=new Audio(BASE+FILES.theme);
  theme.loop=true;theme.preload='auto';theme.playsInline=true;
  theme.volume=clamp(settings.music*duck);
  return theme;
}
function playTheme(){
  if(!unlocked||!settings.musicOn||D.hidden)return;
  const a=ensureTheme();a.volume=clamp(settings.music*duck);
  const p=a.play();if(p?.catch)p.catch(()=>{});
}
function pauseTheme(){try{theme?.pause()}catch(e){}}
function setDuck(v=.28){
  duck=clamp(v,.12,1);
  if(theme)theme.volume=clamp(settings.music*duck);
}
function unlock(){
  if(unlocked)return;
  unlocked=true;
  Object.keys(FILES).filter(k=>k!=='theme').slice(0,10).forEach(pool);
  playTheme();
}
D.addEventListener('pointerdown',unlock,{capture:true,once:true,passive:true});
D.addEventListener('keydown',unlock,{capture:true,once:true});
D.addEventListener('visibilitychange',()=>{if(D.hidden)pauseTheme();else playTheme()});

function hook(name,before,after){
  const cur=W[name];
  if(typeof cur!=='function'||cur.__psyAudioWrapped)return;
  function wrapped(){
    let info;
    try{info=before?.apply(this,arguments)}catch(e){}
    let r;
    try{r=cur.apply(this,arguments)}finally{try{after?.call(this,info,arguments)}catch(e){}}
    return r;
  }
  wrapped.__psyAudioWrapped=true;wrapped.__psyAudioOriginal=cur;W[name]=wrapped;
}
function installHooks(){
  hook('battleAction',function(action,move){
    if(action==='move')sfxForMove(move);
    else if(action==='capture')sfx('capture');
    else if(action==='heal')sfx('heal');
    else if(action==='flee')sfx('ui_click');
  });
  hook('startBattle',function(){sfx('battle_start',{cooldown:500});setDuck(.58)});
  hook('endBattle',null,function(_,args){sfx(args?.[0]?'victory':'defeat',{cooldown:900});setDuck(1)});
  hook('setEnemyBlink',function(){sfx('hit',{volume:.72,cooldown:100})});
  hook('setPlayerBlink',function(){sfx('hit',{volume:.65,cooldown:130})});
  hook('checkLevelUp',function(){
    const lv=Number(W.P?.team?.[0]?.level||0);
    setTimeout(()=>{if(Number(W.P?.team?.[0]?.level||0)>lv)sfx('levelup',{cooldown:700})},40);
  });
  hook('usePotionBattle',function(){sfx('heal')});
  hook('useWorldPotion',function(){sfx('heal')});
  hook('attackWorldTarget',function(){sfx('normal',{volume:.8,cooldown:120})});
  hook('cgQueueMove',function(){
    const btn=D.activeElement?.closest?.('.cg-move-card');
    const tp=btn?.querySelector?.('.move-type')?.textContent;
    sfx(typeKey(tp),{cooldown:80});
  });
}
setInterval(installHooks,1100);installHooks();

D.addEventListener('click',ev=>{
  const b=ev.target?.closest?.('button');if(!b)return;
  if(b.closest('#move-buttons'))return; // battleAction already has move-specific audio
  if(b.classList.contains('cg-move-card')){
    const tp=b.querySelector('.move-type')?.textContent;sfx(typeKey(tp),{cooldown:70});return;
  }
  const id=b.id||'',txt=(b.textContent||'').toLowerCase();
  if(id==='world-skill'){sfx('psychic',{volume:.9,cooldown:120});return}
  if(id==='world-atk'){sfx('normal',{volume:.8,cooldown:120});return}
  if(id==='world-heal'||/curar|poção|potion|heal/.test(txt)){sfx('heal');return}
  if(/captur|pok[eé]?ball|ball/.test(txt)){sfx('capture');return}
  if(/chocar|incubar|egg/.test(txt)){sfx('egg');return}
  if(/pack|abrir pacote/.test(txt)){sfx('pack');return}
  if(id==='psy-audio-open')return;
  sfx('ui_click',{volume:.55});
},true);

// ---------- Audio settings UI ----------
function installUI(){
  const menu=D.getElementById('menu');
  if(menu&&!D.getElementById('psy-audio-open')){
    const b=D.createElement('button');
    b.id='psy-audio-open';b.textContent='🔊 ÁUDIO';
    b.style.cssText='background:linear-gradient(90deg,#0f766e,#4338ca);width:90%;margin:5px;padding:10px;border:1px solid #67e8f9;color:#fff;border-radius:8px;font-weight:900;';
    b.onclick=openPanel;
    const close=[...menu.querySelectorAll('button')].find(x=>/fechar/i.test(x.textContent||''));
    menu.insertBefore(b,close||null);
  }
}
function openPanel(){
  let p=D.getElementById('psy-audio-panel');
  if(!p){
    p=D.createElement('div');p.id='psy-audio-panel';
    p.style.cssText='position:fixed;inset:0;z-index:2005000;background:#020617dd;display:flex;align-items:center;justify-content:center;padding:14px;color:#fff;font-family:system-ui';
    p.innerHTML=`<div style="width:min(440px,94vw);background:linear-gradient(160deg,#0b1b32,#050d19);border:2px solid #67e8f9;border-radius:18px;padding:18px;box-shadow:0 20px 70px #000c">
      <h2 style="margin:0 0 12px;color:#67e8f9">🔊 ÁUDIO PSYWORLD</h2>
      <label style="display:flex;justify-content:space-between;gap:12px;margin:12px 0"><b>🎵 Música</b><input id="psy-music-on" type="checkbox"></label>
      <input id="psy-music-vol" type="range" min="0" max="100" style="width:100%">
      <label style="display:flex;justify-content:space-between;gap:12px;margin:16px 0 8px"><b>⚡ Efeitos sonoros</b><input id="psy-sfx-on" type="checkbox"></label>
      <input id="psy-sfx-vol" type="range" min="0" max="100" style="width:100%">
      <button id="psy-audio-close" style="width:100%;margin-top:18px;padding:11px;border:0;border-radius:10px;background:#2563eb;color:#fff;font-weight:900">FECHAR</button>
    </div>`;
    D.body.appendChild(p);
    const mo=p.querySelector('#psy-music-on'),so=p.querySelector('#psy-sfx-on'),mv=p.querySelector('#psy-music-vol'),sv=p.querySelector('#psy-sfx-vol');
    mo.onchange=()=>{settings.musicOn=mo.checked;saveSettings();settings.musicOn?playTheme():pauseTheme()};
    so.onchange=()=>{settings.sfxOn=so.checked;saveSettings();if(so.checked)sfx('ui_click')};
    mv.oninput=()=>{settings.music=Number(mv.value)/100;saveSettings();if(theme)theme.volume=clamp(settings.music*duck)};
    sv.oninput=()=>{settings.sfx=Number(sv.value)/100;saveSettings();sfx('ui_click',{cooldown:0})};
    p.querySelector('#psy-audio-close').onclick=()=>p.style.display='none';
  }
  p.querySelector('#psy-music-on').checked=settings.musicOn;
  p.querySelector('#psy-sfx-on').checked=settings.sfxOn;
  p.querySelector('#psy-music-vol').value=Math.round(settings.music*100);
  p.querySelector('#psy-sfx-vol').value=Math.round(settings.sfx*100);
  p.style.display='flex';
}
setInterval(()=>{if(!D.hidden)installUI()},2500);
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',installUI,{once:true});else installUI();

W.psyAudio={
  sfx,sfxForMove,typeKey,playTheme,pauseTheme,setDuck,unlock,
  settings,openSettings:openPanel
};
console.log('🔊 PSYWORLD Audio System V1 carregado');
})();