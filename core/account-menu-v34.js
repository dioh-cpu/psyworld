/* PSYWORLD V34 — Conta online permanente no menu
   - deslogado: mostra LOGIN ONLINE perto dos saves;
   - logado: mostra LOG OUT;
   - save local continua abrindo normalmente;
   - não altera TIME/BOX nem saves existentes.
*/
(function(W,D){
'use strict';
if(W.__PSYWORLD_ACCOUNT_MENU_V34__)return;
W.__PSYWORLD_ACCOUNT_MENU_V34__=true;
const BUILD='ACCOUNT_MENU_V34_20260903_A';
const SESSION_KEY='psyworld_online_session_v23';
const $=id=>D.getElementById(id);
function loggedIn(){try{return !!JSON.parse(localStorage.getItem(SESSION_KEY)||'null')?.access_token}catch(_){return false}}
function saveLocal(){try{W.autoSave?.()}catch(_){}}
function openLogin(){
  saveLocal();
  try{W.joyX=0;W.joyY=0;if(W.V12_KEYS)for(const k of Object.keys(W.V12_KEYS))W.V12_KEYS[k]=false}catch(_){}
  try{D.querySelectorAll('[id^="screen-"]').forEach(el=>{el.style.display='none'})}catch(_){}
  const menu=$('menu');if(menu)menu.style.display='none';
  const game=$('game-wrap');if(game)game.style.display='none';
  const starter=$('screen-starter');if(starter)starter.style.display='none';
  const login=$('screen-login');if(login){login.style.display='flex';login.style.zIndex='2147483600'}
  setTimeout(()=>{
    const toggle=$('psy-online-toggle'),form=$('psy-online-form');
    if(form)form.style.display='block';
    if(toggle)toggle.setAttribute('aria-expanded','true');
    try{$('psy-online-email')?.focus()}catch(_){}
  },80);
  try{W.scrollTo(0,0)}catch(_){}
}
async function doLogout(){
  if(!confirm('Sair da conta online e voltar para a tela de login? O save local será mantido.'))return;
  saveLocal();
  try{await W.psyCloudV23?.logout?.()}catch(e){console.warn('logout v34',e)}
  openLogin();
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
function render(){
  const cloud=ensureCloudBox();if(!cloud)return false;
  cloud.style.setProperty('display','grid','important');
  const online=loggedIn();
  const save=$('psy-cloud-save-now'),load=$('psy-cloud-load-now');
  if(save)save.style.display=online?'block':'none';
  if(load)load.style.display=online?'block':'none';
  let b=$('psy-cloud-logout');
  if(!b){b=D.createElement('button');b.id='psy-cloud-logout';b.type='button';cloud.appendChild(b)}
  b.style.display='block';b.style.padding='11px';b.style.borderRadius='8px';b.style.color='#fff';b.style.fontWeight='900';b.style.cursor='pointer';
  if(online){
    cloud.style.gridTemplateColumns='repeat(3,minmax(0,1fr))';
    b.textContent='🚪 LOG OUT';b.style.background='#991b1b';b.style.border='1px solid #f87171';b.onclick=doLogout;
  }else{
    cloud.style.gridTemplateColumns='1fr';
    b.textContent='🔐 LOGIN ONLINE';b.style.background='#075985';b.style.border='1px solid #38bdf8';b.onclick=openLogin;
  }
  return true;
}
function installCss(){
  if($('psy-v34-account-style'))return;
  const s=D.createElement('style');s.id='psy-v34-account-style';
  s.textContent='#psy-cloud-menu-actions{display:grid!important}@media(max-width:720px){#psy-cloud-menu-actions{grid-template-columns:1fr!important}}';
  D.head.appendChild(s);
}
function boot(){
  installCss();render();
  [100,300,800,1600,3200,6500].forEach(ms=>setTimeout(render,ms));
  setInterval(render,1500);
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
console.log('✅ PSYWORLD V34 ativo: LOGIN ONLINE/LOG OUT permanente no menu',BUILD);
})(window,document);
