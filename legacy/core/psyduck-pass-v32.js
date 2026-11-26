/* PSYWORLD — Psyduck Exclusive + Battle Pass Item Art V32
   - Psyduck #54 fica reservado ao Survivor: não aparece no TIME/BOX e não pode ser usado no time.
   - Mantém exatamente o mesmo objeto do Psyduck Supremo escondido no BOX para preservar Lv/EXP/Reset/Provações.
   - Cópias extras de Psyduck são arquivadas em meta sem apagar dados.
   - Battle Pass usa sprites reais do PSY_ITEMS para Stones, Balls, Packs, Eggs e moedas.
*/
(function(W,D){
'use strict';
if(W.__PSYWORLD_PSYDUCK_PASS_V32__)return;
W.__PSYWORLD_PSYDUCK_PASS_V32__=true;
const BUILD='PSYDUCK_PASS_V32_20260903_A';
const P0=()=>W.P||null;
const isPsy=p=>Number(p?.id??p?.species_id??p)===54;
const toast=(m,t=2600)=>{try{W.notif?.(m,t)}catch(_){}};
const safeClone=o=>{try{return JSON.parse(JSON.stringify(o))}catch(_){return null}};
function scorePsy(p){return (p?.psyduckChosen?1e12:0)+(p?.psyduckSupremo?5e11:0)+Number(p?.resets||0)*1e8+Number(p?.level||0)*1e5+Number(p?.exp||0)}
function save(){try{W.autoSave?.()}catch(_){}try{W.updateHUD?.()}catch(_){} }

/* Keep one authoritative Psyduck object hidden in BOX so the existing Survivor
   closure continues to find the same object without re-creating a fresh Psyduck. */
function normalizePsyduckReserve(){
  const P=P0();if(!P)return false;P.meta=P.meta||{};P.psyduck=P.psyduck||{};P.team=Array.isArray(P.team)?P.team:[];P.box=Array.isArray(P.box)?P.box:[];
  const teamPsy=P.team.filter(isPsy),boxPsy=P.box.filter(isPsy),all=[...teamPsy,...boxPsy];
  if(!all.length)return false;
  all.sort((a,b)=>scorePsy(b)-scorePsy(a));const keeper=all[0];
  keeper.psyduckChosen=true;keeper.survivorOnly=true;keeper._psyHiddenReserveV32=true;
  P.psyduck.reserveSummary={id:54,level:Number(keeper.level||1),exp:Number(keeper.exp||0),resets:Number(keeper.resets||0),updatedAt:Date.now()};
  P.meta.psyduckExclusiveArchive=Array.isArray(P.meta.psyduckExclusiveArchive)?P.meta.psyduckExclusiveArchive:[];
  const known=new Set(P.meta.psyduckExclusiveArchive.map(x=>String(x?._archiveKey||'')));
  for(const extra of all.slice(1)){
    const key=String(extra.uid||extra.pokemon_uid||[extra.id,extra.level,extra.resets,extra.createdAt,extra.capturedAt].join(':'));
    if(known.has(key))continue;const copy=safeClone(extra);if(!copy)continue;copy._archiveKey=key;copy._archivedAt=Date.now();copy._archiveReason='Psyduck extra removido do roster; exclusivo Survivor';P.meta.psyduckExclusiveArchive.push(copy);known.add(key);
  }
  const beforeTeam=P.team.length,beforeBox=P.box.length;
  P.team=P.team.filter(x=>!isPsy(x));
  P.box=P.box.filter(x=>!isPsy(x));
  /* The reserved object lives at the end of BOX, but renderTeam hides it. */
  P.box.push(keeper);
  if(!P.team.length){const idx=P.box.findIndex(x=>!isPsy(x));if(idx>=0)P.team.push(P.box.splice(idx,1)[0])}
  if(isPsy(P.pokemon)&&P.team[0])P.pokemon=P.team[0];
  if(P.team[0]){P.hp=Number(P.team[0].hp||0);P.maxHp=Number(P.team[0].maxHp||1)}
  const changed=teamPsy.length>0||all.length>1||beforeBox!==P.box.length||beforeTeam!==P.team.length;
  if(changed)save();return changed;
}

function hidePsyduckCards(){
  const P=P0();if(!P)return;
  const bl=D.getElementById('box-list');
  if(bl){for(const card of [...bl.children]){const oc=card.getAttribute?.('onclick')||'';const m=oc.match(/openPokeDetail\(\s*(\d+)\s*,\s*true\s*\)/i);if(m&&isPsy(P.box?.[Number(m[1])]))card.remove()}}
  const bc=D.getElementById('box-count');if(bc)bc.textContent=String((P.box||[]).filter(x=>!isPsy(x)).length);
  const tl=D.getElementById('team-list');if(tl){for(const row of [...tl.children]){const txt=(row.textContent||'').toLowerCase();if(txt.includes('psyduck'))row.remove()}}
}
function assign(name,fn){W[name]=fn;try{globalThis[name]=fn}catch(_){}try{eval(name+'=fn')}catch(_){} }
function installRosterHooks(){
  const rt=W.renderTeam;if(typeof rt==='function'&&!rt.__psyV32){const f=function(){normalizePsyduckReserve();const r=rt.apply(this,arguments);queueMicrotask(hidePsyduckCards);return r};f.__psyV32=true;f.__orig=rt;assign('renderTeam',f)}
  const add=W.addToTeam;if(typeof add==='function'&&!add.__psyV32){const f=function(i){const p=P0()?.box?.[Number(i)];if(isPsy(p)){toast('🦆 Psyduck é exclusivo do Psyduck Supremo / Survivor.');return false}return add.apply(this,arguments)};f.__psyV32=true;f.__orig=add;assign('addToTeam',f)}
  const active=W.setActive;if(typeof active==='function'&&!active.__psyV32){const f=function(i){const p=P0()?.team?.[Number(i)];if(isPsy(p)){toast('🦆 Psyduck não pode ser usado no time normal. Abra PSYDUCK SUPREMO.');return false}return active.apply(this,arguments)};f.__psyV32=true;f.__orig=active;assign('setActive',f)}
}

/* -------- Battle Pass sprites -------- */
function cleanRewardName(s){
  s=String(s||'').replace(/\s+/g,' ').trim();
  s=s.replace(/^\s*(?:x\s*)?[\d.]+\s*(?:x|×)?\s*/i,'').replace(/\s*(?:x|×)\s*\d+\s*$/i,'').trim();
  const n=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  if(/fragment/.test(n)&&/mega/.test(n))return 'Fragmento Mega Stone';
  if(/boost/.test(n)&&/stone/.test(n))return 'Boost Stone';
  if(/shiny/.test(n)&&/stone/.test(n))return 'Shiny Stone';
  if(/psy\s*coin|psycoin/.test(n))return 'PsyCoin';
  if(/diamant|diamond/.test(n))return 'Diamante';
  if(/gold|poke.?coin/.test(n))return 'Gold';
  if(/cupom|coupon/.test(n))return 'Cupom 30% OFF';
  if(/pack/.test(n))return s;
  if(/egg|ovo/.test(n))return s;
  if(/ball/.test(n))return s.replace(/^\d+\s*/,'').trim();
  if(/stone/.test(n))return s;
  return s;
}
function rewardSpriteName(cell){
  const label=cell.querySelector('b')?.textContent||'',sub=cell.querySelector('small')?.textContent||'';
  const candidates=[cleanRewardName(label),cleanRewardName(sub),cleanRewardName(label+' '+sub)];
  for(const c of candidates){if(c&&W.PSY_ITEMS?.url?.(c))return c}
  const joined=(label+' '+sub).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const aliases=[
    [/mega.*fragment|fragment.*mega/,'Fragmento Mega Stone'],[/boost stone/,'Boost Stone'],[/shiny stone/,'Shiny Stone'],[/psycoin|psy coin/,'PsyCoin'],[/diamant|diamond/,'Diamante'],[/gold|pokecoin/,'Gold'],[/cupom|coupon/,'Cupom 30% OFF'],
    [/pack.*ur\+\+/i,'Pack UR++'],[/pack.*ur\+/i,'Pack UR+'],[/pack.*ur/i,'Pack UR'],[/pack.*sss/i,'Pack SSS'],[/pack.*ss/i,'Pack SS'],[/pack.*\bs\b/i,'Pack S'],[/pack.*epic|pack.*epico/i,'Pack Épico'],[/pack.*rar/i,'Pack Raro'],[/pack/i,'Pack Normal'],
    [/shiny.*mega.*egg|ovo.*shiny.*mega/i,'Shiny Mega Egg'],[/shiny.*legend|lend.*shiny/i,'Shiny Legendary Egg'],[/legend|lendario|lendaria/i,'Legendary Egg'],[/mega.*egg|ovo.*mega/i,'Mega Egg'],[/shiny.*egg|ovo.*shiny/i,'Shiny Egg'],[/egg|ovo/i,'Mystery Egg']
  ];
  for(const [re,name] of aliases)if(re.test(joined)&&W.PSY_ITEMS?.url?.(name))return name;
  return '';
}
function patchPassSprites(){
  const root=D.getElementById('psy20-pass-screen');if(!root||!W.PSY_ITEMS)return;
  for(const cell of root.querySelectorAll('.psy20-reward:not(.psy20-track-label)')){
    const ri=cell.querySelector('.ri');if(!ri||ri.dataset.psyPassArt==='1')continue;
    const name=rewardSpriteName(cell);if(!name)continue;
    ri.dataset.psyPassArt='1';ri.dataset.item=name;
    ri.innerHTML=W.PSY_ITEMS.html(name,name,'psy-pass-item-art-v32');
  }
}
function installPassHook(){
  const cur=W.openBattlePass;if(typeof cur==='function'&&!cur.__psyPassArtV32){const f=function(){const r=cur.apply(this,arguments);requestAnimationFrame(patchPassSprites);setTimeout(patchPassSprites,60);return r};f.__psyPassArtV32=true;f.__orig=cur;assign('openBattlePass',f)}
}
function installCss(){if(D.getElementById('psy-pass-art-v32-css'))return;const s=D.createElement('style');s.id='psy-pass-art-v32-css';s.textContent='.psy20-reward .ri{min-height:46px;display:grid;place-items:center}.psy20-reward .ri .psy-pass-item-art-v32,.psy20-reward .ri .psy-item-sprite{width:44px!important;height:44px!important;object-fit:contain!important;image-rendering:pixelated;filter:drop-shadow(0 3px 3px #000a) drop-shadow(0 0 7px #ffffff30)}';D.head.appendChild(s)}

function maintain(){normalizePsyduckReserve();installRosterHooks();hidePsyduckCards();installPassHook();patchPassSprites()}
function boot(){installCss();maintain();const root=D.body||D.documentElement;if(root)new MutationObserver(()=>{installRosterHooks();installPassHook();hidePsyduckCards();patchPassSprites()}).observe(root,{childList:true,subtree:true});for(const ms of [100,300,800,1500,3000,6000,10000])setTimeout(maintain,ms);setInterval(maintain,3000)}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
console.log('✅ PSYWORLD V32 ativo: Psyduck reservado ao Survivor + sprites reais no Passe',BUILD);
})(window,document);
