/* ============================================================
   PSYWORLD — SURVIVOR RETOMADA GUARD V9
   Always-loaded compatibility layer.
   Guarantees DEPOIS in resume modal and CIDADE in pause menu,
   even if an older lazy Survivor bundle is accidentally rendered.
   ============================================================ */
(function(){
'use strict';
const W=window,D=document;
const RESUME_KEY='psyworld_survivor_run_v1';
const RESUME_VERSION=2;
W.PSYWORLD_SURV_GUARD_BUILD='SURV_RETOMADA_V9';

function notify(msg,ms=3600){
  try{
    if(typeof W.notif==='function')return W.notif(msg,ms);
    if(typeof W.toast==='function')return W.toast(msg,ms);
  }catch(_){ }
  console.log('[PSYWORLD]',msg);
}
function text(el){return String(el?.textContent||'').replace(/\s+/g,' ').trim()}
function norm(s){return String(s||'').normalize?.('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()||String(s||'').toUpperCase()}
function findBtn(root,re){return [...(root?.querySelectorAll?.('button')||[])].find(b=>re.test(norm(text(b))))}
function findPanelByHeading(re){
  for(const h of D.querySelectorAll('h1,h2,h3')){
    if(!re.test(norm(text(h))))continue;
    let n=h;
    for(let i=0;i<6&&n;i++,n=n.parentElement){
      const bs=n.querySelectorAll?.('button');
      if(bs&&bs.length>=2)return n;
    }
  }
  return null;
}
function findResumePanel(){
  return D.getElementById('psy-surv-resume-modal') || findPanelByHeading(/RETORNAR A FASE EM ANDAMENTO DO SURVIVOR/);
}
function findPausePanel(){
  const direct=D.querySelector('#psy-clean-surv-pause .psy-surv-dialog');
  if(direct)return direct;
  return findPanelByHeading(/SURVIVOR PAUSADO/);
}
function removeResumePanel(){
  const p=findResumePanel();
  if(!p)return;
  let n=p;
  while(n.parentElement&&n.parentElement!==D.body){
    const st=getComputedStyle(n);
    if(n.id==='psy-surv-resume-modal'||st.position==='fixed'){break}
    n=n.parentElement;
  }
  (n.id==='psy-surv-resume-modal'||n!==p?n:p).remove();
}
function laterFallback(){
  removeResumePanel();
  try{
    if(localStorage.getItem(RESUME_KEY))notify('Run do Survivor mantida. Você pode continuar depois pelo menu do Survivor.');
  }catch(_){ }
}
if(typeof W.psySurvLater!=='function')W.psySurvLater=laterFallback;
function readSaved(){try{return JSON.parse(localStorage.getItem(RESUME_KEY)||'null')}catch(_){return null}}
if(typeof W.psySurvHasSavedRun!=='function')W.psySurvHasSavedRun=()=>{const x=readSaved();return !!(x&&Number(x.version)===RESUME_VERSION&&x.state&&!x.state.done&&Number(x.state.hp)>0)};
if(typeof W.psySurvSavedSummary!=='function')W.psySurvSavedSummary=()=>{const x=readSaved(),s=x?.state;if(!s)return '';const sec=Math.max(0,Math.floor(Number(s.elapsed||0)/1000)),mm=Math.floor(sec/60),ss=sec%60;return `Fase <b>${Number(s.phase||1)}</b> • Run Lv.<b>${Number(s.runLevel||1)}</b> • ${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')} • ${Number(s.kills||0)} KOs`};

function snapshotState(s){
  const omit=new Set(['c','ctx','psyImg','psyFormImgs','spriteCache','perf','last','effects','texts','bullets','enemyBullets','bossHazards','dropAlerts','_vignette']);
  return JSON.parse(JSON.stringify(s,(key,value)=>{
    if(omit.has(key)||typeof value==='function')return undefined;
    if((key==='target'||key==='source')&&value&&typeof value==='object')return undefined;
    if(value instanceof Set)return [...value];
    if(value instanceof Map)return [...value.entries()];
    return value;
  }));
}
function saveFallback(){
  const s=W.PSY_CLEAN_SURV;
  if(!s||s.done)return false;
  try{
    localStorage.setItem(RESUME_KEY,JSON.stringify({version:RESUME_VERSION,savedAt:Date.now(),state:snapshotState(s)}));
    return true;
  }catch(e){console.warn('V9 fallback save falhou',e);return false}
}
function cityFallback(){
  const s=W.PSY_CLEAN_SURV;
  if(!s||s.done){notify('Nenhuma run ativa do Survivor para salvar.');return}
  s.paused=true;
  if(!saveFallback()){notify('Não foi possível salvar a run. Ela não foi fechada.');return}
  try{if(D.fullscreenElement)D.exitFullscreen?.().catch?.(()=>{})}catch(_){ }
  try{screen.orientation?.unlock?.()}catch(_){ }
  try{W.V12_KEYS=W.V12_KEYS||{};W.V12_KEYS.left=W.V12_KEYS.right=W.V12_KEYS.up=W.V12_KEYS.down=false}catch(_){ }
  const sc=D.getElementById('screen-survivor-v12');if(sc){sc.style.display='none';sc.innerHTML=''}
  const ps=D.getElementById('screen-psyduck-v12');if(ps)ps.style.display='none';
  removeResumePanel();
  D.querySelectorAll('.psy-surv-touch-stick').forEach(el=>el.remove());
  W.PSY_CLEAN_SURV=null;
  const city=D.getElementById('game-wrap');if(city)city.style.display='block';
  const menu=D.getElementById('menu');if(menu)menu.style.display='none';
  try{W.updateHUD?.();W.renderTeam?.()}catch(_){ }
  notify('🏙 Run pausada e salva. Você pode fazer o conteúdo da Cidade e voltar ao Survivor depois.',4200);
}
if(typeof W.psySurvSuspendToCity!=='function')W.psySurvSuspendToCity=cityFallback;

function ensureResume(){
  const p=findResumePanel();if(!p)return false;
  const yes=findBtn(p,/^SIM$/), no=findBtn(p,/^NAO$/);if(!yes||!no)return false;
  if(!findBtn(p,/^DEPOIS$/)){
    const b=D.createElement('button');
    b.type='button';b.className=no.className||'psy20-btn';b.dataset.psySurvLater='1';b.textContent='DEPOIS';
    b.style.background='#0369a1';b.style.color='#fff';b.style.borderColor='#38bdf8';
    b.onclick=e=>{e.preventDefault();e.stopPropagation();(W.psySurvLater||laterFallback)()};
    const row=no.parentElement;row.style.flexWrap='wrap';row.insertBefore(b,no);
  }
  const paragraphs=[...p.querySelectorAll('p')];
  const info=paragraphs.find(x=>/PROGRESSO SALVO|RUN SERA RESTAURADO/.test(norm(text(x))));
  if(info&&!/DEPOIS/.test(norm(text(info))))info.insertAdjacentHTML('beforeend','<br><b style="color:#7dd3fc">DEPOIS</b> mantém a run salva e libera o restante do jogo.');
  return true;
}
function ensurePause(){
  const p=findPausePanel();if(!p)return false;
  const cont=findBtn(p,/^CONTINUAR$/), exit=findBtn(p,/SAIR DA FASE/);if(!cont||!exit)return false;
  if(!findBtn(p,/CIDADE/)){
    const b=D.createElement('button');
    b.type='button';b.className=exit.className||'psy20-btn';b.dataset.psySurvCity='1';b.textContent='🏙 CIDADE';
    b.style.background='#0369a1';b.style.color='#fff';b.style.borderColor='#38bdf8';
    b.onclick=e=>{e.preventDefault();e.stopPropagation();(W.psySurvSuspendToCity||cityFallback)()};
    const row=exit.parentElement;row.style.display='flex';row.style.gap='8px';row.style.flexWrap='wrap';row.style.justifyContent='center';
    row.insertBefore(b,exit);
  }
  return true;
}
function patch(){ensureResume();ensurePause()}
W.psyEnsureSurvivorLaterButton=ensureResume;
W.psyEnsureSurvivorCityButton=ensurePause;
function loadIntegrityV30(){
  if(W.__PSYWORLD_BATTLE_INPUT_INTEGRITY_V30__||D.querySelector('script[data-psy-integrity-v30]'))return;
  const s=D.createElement('script');s.dataset.psyIntegrityV30='1';s.async=false;
  s.src='core/battle-input-integrity-v30.js?build=BATTLE_INPUT_INTEGRITY_V30_20260903_A';
  s.onerror=()=>console.error('❌ Falha ao carregar Battle/Input Integrity V30');
  (D.head||D.documentElement).appendChild(s);
}
function loadIntegrityV31(){
  if(W.__PSYWORLD_BATTLE_ROSTER_INTEGRITY_V31__||D.querySelector('script[data-psy-integrity-v31]'))return;
  const s=D.createElement('script');s.dataset.psyIntegrityV31='1';s.async=false;
  s.src='core/battle-roster-integrity-v31.js?build=BATTLE_ROSTER_INTEGRITY_V31_20260903_A';
  s.onerror=()=>console.error('❌ Falha ao carregar Battle/Roster Integrity V31');
  (D.head||D.documentElement).appendChild(s);
}
const start=()=>{
  loadIntegrityV30();
  setTimeout(loadIntegrityV31,80);
  patch();
  const root=D.body||D.documentElement;if(!root)return setTimeout(start,0);
  let queued=false;
  new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;patch()})}).observe(root,{childList:true,subtree:true});
  for(const ms of [100,300,700,1500,3000,6000])setTimeout(patch,ms);
  for(const ms of [300,900,1800,3500,7000])setTimeout(loadIntegrityV31,ms);
  setInterval(patch,2000);
};
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',start,{once:true});else start();
console.log('✅ PSYWORLD Survivor Retomada Guard V9 ativo');
})();
