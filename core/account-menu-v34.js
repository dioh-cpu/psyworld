/* PSYWORLD V36 — Menu de perfil local + conta online
   - SAIR DO PERFIL LOCAL persiste após F5 e bloqueia auto-load;
   - o save local continua preservado;
   - CARREGAR local, novo perfil ou login online bem-sucedido liberam a entrada novamente;
   - perfil local e sessão online continuam independentes;
   - não altera TIME/BOX nem conteúdo do save.
*/
(function(W,D){
'use strict';
if(W.__PSYWORLD_ACCOUNT_MENU_V36__)return;
W.__PSYWORLD_ACCOUNT_MENU_V36__=true;
const BUILD='ACCOUNT_MENU_V36_20260903_A';
const SESSION_KEY='psyworld_online_session_v23';
const LOCAL_EXIT_KEY='psyworld_local_profile_signed_out_v36';
const $=id=>D.getElementById(id);
function loggedIn(){try{return !!JSON.parse(localStorage.getItem(SESSION_KEY)||'null')?.access_token}catch(_){return false}}
function localExitLocked(){try{return localStorage.getItem(LOCAL_EXIT_KEY)==='1'}catch(_){return false}}
function markLocalExit(){try{localStorage.setItem(LOCAL_EXIT_KEY,'1')}catch(_){}}
function clearLocalExit(){try{localStorage.removeItem(LOCAL_EXIT_KEY)}catch(_){}}
function saveLocal(){try{W.autoSave?.()}catch(_){}}
function releaseControls(){try{W.joyX=0;W.joyY=0;if(W.V12_KEYS)for(const k of Object.keys(W.V12_KEYS))W.V12_KEYS[k]=false}catch(_){}}
function currentFn(name){try{return typeof W[name]==='function'?W[name]:null}catch(_){return null}}
function assignFn(name,fn){try{W[name]=fn}catch(_){}try{globalThis[name]=fn}catch(_){} }
function ensureOnlineHandlers(){
  const login=$('psy-online-login'),signup=$('psy-online-signup');
  if(login&&typeof W.psyCloudV23?.login==='function')login.onclick=()=>W.psyCloudV23.login();
  if(signup&&typeof W.psyCloudV23?.signup==='function')signup.onclick=()=>W.psyCloudV23.signup();
  return !!(login&&signup);
}
function returnToStart(openOnline=false){
  saveLocal();releaseControls();
  try{$('psy-cloud-modal')?.remove()}catch(_){}
  try{$('psy-battle-switch-required')?.remove()}catch(_){}
  try{D.querySelectorAll('[id^="screen-"]').forEach(el=>{el.style.display='none'})}catch(_){}
  const menu=$('menu');if(menu)menu.style.display='none';
  const game=$('game-wrap');if(game)game.style.display='none';
  const starter=$('screen-starter');if(starter)starter.style.display='none';
  const login=$('screen-login');if(login){login.style.display='flex';login.style.zIndex='2147483600'}
  setTimeout(()=>{
    ensureOnlineHandlers();
    const toggle=$('psy-online-toggle'),form=$('psy-online-form');
    if(openOnline&&form)form.style.display='block';
    if(openOnline&&toggle)toggle.setAttribute('aria-expanded','true');
    if(openOnline)try{$('psy-online-email')?.focus()}catch(_){}
  },60);
  setTimeout(ensureOnlineHandlers,250);
  try{W.scrollTo(0,0)}catch(_){}
}
async function doLogout(){
  if(!confirm('Sair da conta online e voltar para a tela inicial? O save local será mantido.'))return;
  saveLocal();
  try{await W.psyCloudV23?.logout?.()}catch(e){console.warn('logout v36',e)}
  returnToStart(true);
}
function doLocalExit(){
  if(!confirm('Sair do perfil local e voltar para a tela inicial? O save local será mantido e não abrirá sozinho após F5.'))return;
  saveLocal();markLocalExit();returnToStart(false);
}
function installAutoLoadGuard(){
  const has=currentFn('psyV9HasLocalSave');
  if(has&&!has.__psyV36){
    const f=function(){if(localExitLocked())return false;return has.apply(this,arguments)};
    f.__psyV36=true;f.__psyOriginal=has;assignFn('psyV9HasLocalSave',f);
  }
  const load=currentFn('loadOnLogin');
  if(load&&!load.__psyV36){
    const f=function(){clearLocalExit();return load.apply(this,arguments)};
    f.__psyV36=true;f.__psyOriginal=load;assignFn('loadOnLogin',f);
  }
  const starter=currentFn('confirmStarter');
  if(starter&&!starter.__psyLocalExitV36){
    const f=function(){clearLocalExit();return starter.apply(this,arguments)};
    f.__psyLocalExitV36=true;f.__psyOriginal=starter;assignFn('confirmStarter',f);
  }
  const enter=currentFn('psyV9EnterSavedGame');
  if(enter&&!enter.__psyV36){
    const f=function(){if(localExitLocked())return false;return enter.apply(this,arguments)};
    f.__psyV36=true;f.__psyOriginal=enter;assignFn('psyV9EnterSavedGame',f);
  }
  const cloud=W.psyCloudV23;
  if(cloud&&typeof cloud.login==='function'&&!cloud.login.__psyV36){
    const old=cloud.login;
    const f=async function(){const r=await old.apply(this,arguments);if(loggedIn())clearLocalExit();return r};
    f.__psyV36=true;cloud.login=f;
  }
  if(cloud&&typeof cloud.loadNow==='function'&&!cloud.loadNow.__psyV36){
    const old=cloud.loadNow;
    const f=async function(){clearLocalExit();return old.apply(this,arguments)};
    f.__psyV36=true;cloud.loadNow=f;
  }
}
function enforceStartWhenLocked(){
  if(!localExitLocked())return;
  const login=$('screen-login'),game=$('game-wrap');
  if(game&&getComputedStyle(game).display!=='none')game.style.display='none';
  if(login&&getComputedStyle(login).display==='none'){login.style.display='flex';login.style.zIndex='2147483600'}
  const menu=$('menu');if(menu)menu.style.display='none';
}
function ensureCloudBox(){
  const menu=$('menu');if(!menu)return null;
  let cloud=$('psy-cloud-menu-actions');
  if(!cloud){cloud=D.createElement('div');cloud.id='psy-cloud-menu-actions';cloud.style.cssText='width:min(700px,90%);margin:8px auto;display:grid;grid-template-columns:1fr;gap:8px;';menu.appendChild(cloud)}
  return cloud;
}
function ensureButton(id,label){const cloud=ensureCloudBox();if(!cloud)return null;let b=$(id);if(!b){b=D.createElement('button');b.id=id;b.type='button';cloud.appendChild(b)}b.textContent=label;b.style.padding='11px';b.style.borderRadius='8px';b.style.color='#fff';b.style.fontWeight='900';b.style.cursor='pointer';return b}
function render(){
  installAutoLoadGuard();
  const cloud=ensureCloudBox();if(!cloud)return false;
  cloud.style.setProperty('display','grid','important');
  const online=loggedIn(),save=$('psy-cloud-save-now'),load=$('psy-cloud-load-now');
  if(save)save.style.display=online?'block':'none';
  if(load)load.style.display=online?'block':'none';
  const auth=ensureButton('psy-cloud-logout',online?'🚪 LOG OUT':'🔐 LOGIN ONLINE');
  if(auth){auth.style.display='block';auth.style.background=online?'#991b1b':'#075985';auth.style.border=online?'1px solid #f87171':'1px solid #38bdf8';auth.onclick=online?doLogout:()=>returnToStart(true)}
  const local=ensureButton('psy-local-exit','🏠 SAIR DO PERFIL LOCAL');
  if(local){local.style.display='block';local.style.background='#3f3f46';local.style.border='1px solid #a1a1aa';local.onclick=doLocalExit}
  cloud.style.gridTemplateColumns='repeat(2,minmax(0,1fr))';ensureOnlineHandlers();return true;
}
function installCss(){if($('psy-v36-account-style'))return;const s=D.createElement('style');s.id='psy-v36-account-style';s.textContent='#psy-cloud-menu-actions{display:grid!important}@media(max-width:720px){#psy-cloud-menu-actions{grid-template-columns:1fr!important}}';D.head.appendChild(s)}
function boot(){
  installCss();installAutoLoadGuard();enforceStartWhenLocked();render();ensureOnlineHandlers();
  [0,50,100,200,300,500,800,1600,3200,6500].forEach(ms=>setTimeout(()=>{installAutoLoadGuard();enforceStartWhenLocked();render();ensureOnlineHandlers()},ms));
  setInterval(()=>{installAutoLoadGuard();if(localExitLocked())enforceStartWhenLocked();else render()},1800);
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
console.log('✅ PSYWORLD V36 ativo: saída local persiste após F5 e bloqueia auto-load',BUILD);

/* V37: login online com perfil local fechado deve abrir o save da nuvem da conta. */
try{
  const v37=D.createElement('script');
  v37.src='core/online-profile-entry-v37.js?build=ONLINE_PROFILE_ENTRY_V37_20260904_A';
  v37.async=false;
  D.head.appendChild(v37);
}catch(e){console.warn('online profile entry v37 loader',e)}
})(window,document);
