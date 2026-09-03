/* PSYWORLD V35 — Menu de perfil local + conta online
   - perfil local e sessão online são controles separados;
   - SAIR DO PERFIL LOCAL volta à tela inicial sem apagar save e sem deslogar da nuvem;
   - deslogado online: LOGIN ONLINE permanece acessível;
   - logado online: SALVAR/CARREGAR NUVEM + LOG OUT permanecem acessíveis;
   - reforça handlers ENTRAR/CRIAR CONTA ao retornar à tela inicial;
   - não altera TIME/BOX nem saves existentes.
*/
(function(W,D){
'use strict';
if(W.__PSYWORLD_ACCOUNT_MENU_V35__)return;
W.__PSYWORLD_ACCOUNT_MENU_V35__=true;
const BUILD='ACCOUNT_MENU_V35_20260903_A';
const SESSION_KEY='psyworld_online_session_v23';
const $=id=>D.getElementById(id);
function loggedIn(){try{return !!JSON.parse(localStorage.getItem(SESSION_KEY)||'null')?.access_token}catch(_){return false}}
function saveLocal(){try{W.autoSave?.()}catch(_){}}
function releaseControls(){
  try{W.joyX=0;W.joyY=0;if(W.V12_KEYS)for(const k of Object.keys(W.V12_KEYS))W.V12_KEYS[k]=false}catch(_){}
}
function ensureOnlineHandlers(){
  const login=$('psy-online-login'),signup=$('psy-online-signup');
  if(login&&typeof W.psyCloudV23?.login==='function'){
    login.onclick=()=>W.psyCloudV23.login();login.dataset.psyV35Auth='1';
  }
  if(signup&&typeof W.psyCloudV23?.signup==='function'){
    signup.onclick=()=>W.psyCloudV23.signup();signup.dataset.psyV35Auth='1';
  }
  return !!(login&&signup&&typeof W.psyCloudV23?.login==='function'&&typeof W.psyCloudV23?.signup==='function');
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
  try{await W.psyCloudV23?.logout?.()}catch(e){console.warn('logout v35',e)}
  returnToStart(true);
}
function doLocalExit(){
  if(!confirm('Sair do perfil local e voltar para a tela inicial? O save local será mantido.'))return;
  returnToStart(false);
}
function ensureCloudBox(){
  const menu=$('menu');if(!menu)return null;
  let cloud=$('psy-cloud-menu-actions');
  if(!cloud){
    cloud=D.createElement('div');cloud.id='psy-cloud-menu-actions';
    cloud.style.cssText='width:min(700px,90%);margin:8px auto;display:grid;grid-template-columns:1fr;gap:8px;';
    menu.appendChild(cloud);
  }
  return cloud;
}
function ensureButton(id,label){
  const cloud=ensureCloudBox();if(!cloud)return null;
  let b=$(id);if(!b){b=D.createElement('button');b.id=id;b.type='button';cloud.appendChild(b)}
  b.textContent=label;b.style.padding='11px';b.style.borderRadius='8px';b.style.color='#fff';b.style.fontWeight='900';b.style.cursor='pointer';
  return b;
}
function render(){
  const cloud=ensureCloudBox();if(!cloud)return false;
  cloud.style.setProperty('display','grid','important');
  const online=loggedIn();
  const save=$('psy-cloud-save-now'),load=$('psy-cloud-load-now');
  if(save)save.style.display=online?'block':'none';
  if(load)load.style.display=online?'block':'none';

  const auth=ensureButton('psy-cloud-logout',online?'🚪 LOG OUT':'🔐 LOGIN ONLINE');
  if(auth){
    auth.style.display='block';
    auth.style.background=online?'#991b1b':'#075985';
    auth.style.border=online?'1px solid #f87171':'1px solid #38bdf8';
    auth.onclick=online?doLogout:()=>returnToStart(true);
  }

  const local=ensureButton('psy-local-exit','🏠 SAIR DO PERFIL LOCAL');
  if(local){
    local.style.display='block';local.style.background='#3f3f46';local.style.border='1px solid #a1a1aa';local.onclick=doLocalExit;
  }

  cloud.style.gridTemplateColumns=online?'repeat(2,minmax(0,1fr))':'repeat(2,minmax(0,1fr))';
  ensureOnlineHandlers();
  return true;
}
function installCss(){
  if($('psy-v35-account-style'))return;
  const s=D.createElement('style');s.id='psy-v35-account-style';
  s.textContent='#psy-cloud-menu-actions{display:grid!important}@media(max-width:720px){#psy-cloud-menu-actions{grid-template-columns:1fr!important}}';
  D.head.appendChild(s);
}
function boot(){
  installCss();render();ensureOnlineHandlers();
  [100,300,800,1600,3200,6500].forEach(ms=>setTimeout(()=>{render();ensureOnlineHandlers()},ms));
  setInterval(render,1800);
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
console.log('✅ PSYWORLD V35 ativo: LOGIN/LOG OUT online + SAIR DO PERFIL LOCAL',BUILD);
})(window,document);
