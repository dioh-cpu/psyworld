/* PSYWORLD V33 — New Account Psyduck Policy + Cloud Logout UI
   Safe/localized patch:
   - does NOT migrate or edit existing profiles;
   - only marks profiles created after this patch;
   - new profiles cannot use Psyduck #54 in the normal team;
   - adds LOG OUT beside cloud save controls.
*/
(function(W,D){
'use strict';
if(W.__PSYWORLD_NEW_ACCOUNT_LOGOUT_V33__)return;
W.__PSYWORLD_NEW_ACCOUNT_LOGOUT_V33__=true;
const BUILD='NEW_ACCOUNT_LOGOUT_V33_20260903_A';
const SESSION_KEY='psyworld_online_session_v23';
const SAVE_KEYS=['psyWorldSave','psyWorldSave_v9','psyWorldSave_backup'];
const isPsy=p=>Number(p?.id??p?.species_id??p)===54;
const toast=(m,t=3000)=>{try{W.notif?.(m,t)}catch(_){}};
function P0(){return W.P||null}
function hasSavedProgress(){
  try{
    if(Array.isArray(P0()?.team)&&P0().team.length)return true;
    return SAVE_KEYS.some(k=>{try{const s=JSON.parse(localStorage.getItem(k)||'null'),p=s?.player||s;return !!(p&&Array.isArray(p.team)&&p.team.length)}catch(_){return false}});
  }catch(_){return false}
}
function currentFn(name){try{return W[name]||(typeof globalThis[name]==='function'?globalThis[name]:null)}catch(_){return W[name]}}
function assignFn(name,fn){W[name]=fn;try{globalThis[name]=fn}catch(_){}try{eval(name+'=fn')}catch(_){} }
function selectedStarter(){try{return typeof chosenPoke!=='undefined'?chosenPoke:null}catch(_){return null}}
function applyFreshPolicy(){
  const P=P0();if(!P)return;P.meta=P.meta||{};
  if(!P.meta.noPsyduckNormalTeamV33)P.meta.noPsyduckNormalTeamV33=true;
  P.team=Array.isArray(P.team)?P.team:[];P.box=Array.isArray(P.box)?P.box:[];
  const nonPsy=P.team.filter(x=>!isPsy(x));
  if(nonPsy.length&&nonPsy.length!==P.team.length){
    const moved=P.team.filter(isPsy);P.team=nonPsy;P.box.push(...moved);
    if(P.pokemon&&isPsy(P.pokemon))P.pokemon=P.team[0]||null;
    if(P.team[0]){P.hp=Number(P.team[0].hp||0);P.maxHp=Number(P.team[0].maxHp||1)}
  }
  try{W.autoSave?.()}catch(_){}try{W.updateHUD?.()}catch(_){}try{W.renderTeam?.()}catch(_){}
}
function installStarterGuard(){
  const cur=currentFn('confirmStarter');if(typeof cur!=='function'||cur.__psyNewAccountV33)return;
  const f=function(){
    const existing=hasSavedProgress(),sel=selectedStarter();
    if(!existing&&isPsy(sel)){toast('🦆 Psyduck é exclusivo do Psyduck Supremo / Survivor. Escolha outro starter.',4200);return false}
    const r=cur.apply(this,arguments);
    if(!existing){setTimeout(applyFreshPolicy,0);setTimeout(applyFreshPolicy,250)}
    return r;
  };
  f.__psyNewAccountV33=true;f.__psyOriginal=cur;assignFn('confirmStarter',f);
}
function installAddTeamGuard(){
  const cur=currentFn('addToTeam');if(typeof cur!=='function'||cur.__psyNewAccountV33)return;
  const f=function(idx){
    const P=P0(),p=P?.box?.[Number(idx)];
    if(P?.meta?.noPsyduckNormalTeamV33&&isPsy(p)){toast('🦆 Psyduck deste perfil é exclusivo do Survivor.',3000);return false}
    return cur.apply(this,arguments);
  };
  f.__psyNewAccountV33=true;f.__psyOriginal=cur;assignFn('addToTeam',f);
}
function installSetActiveGuard(){
  const cur=currentFn('setActive');if(typeof cur!=='function'||cur.__psyNewAccountV33)return;
  const f=function(idx){
    const P=P0(),p=P?.team?.[Number(idx)];
    if(P?.meta?.noPsyduckNormalTeamV33&&isPsy(p)){toast('🦆 Psyduck deste perfil é exclusivo do Survivor.',3000);return false}
    return cur.apply(this,arguments);
  };
  f.__psyNewAccountV33=true;f.__psyOriginal=cur;assignFn('setActive',f);
}
function loggedIn(){try{return !!JSON.parse(localStorage.getItem(SESSION_KEY)||'null')?.access_token}catch(_){return false}}
function ensureLogoutButton(){
  const cloud=D.getElementById('psy-cloud-menu-actions');if(!cloud)return false;
  let b=D.getElementById('psy-cloud-logout');
  if(!b){
    b=D.createElement('button');b.id='psy-cloud-logout';b.type='button';b.textContent='🚪 LOG OUT';
    b.style.cssText='padding:11px;border:1px solid #f87171;border-radius:8px;background:#991b1b;color:#fff;font-weight:900;cursor:pointer;';
    b.onclick=async()=>{
      if(!confirm('Sair da conta online? O save local será mantido.'))return;
      try{await W.psyCloudV23?.logout?.()}catch(e){console.warn('logout v33',e)}
      ensureLogoutButton();
    };
    cloud.appendChild(b);
  }
  if(loggedIn()){
    cloud.style.gridTemplateColumns='repeat(3,minmax(0,1fr))';
    b.style.display='block';
  }else b.style.display='none';
  return true;
}
function installCss(){
  if(D.getElementById('psy-v33-logout-style'))return;
  const s=D.createElement('style');s.id='psy-v33-logout-style';s.textContent='@media(max-width:720px){#psy-cloud-menu-actions{grid-template-columns:1fr!important}}';D.head.appendChild(s);
}
function installMenuHook(){
  const cur=currentFn('toggleMenu');if(typeof cur!=='function'||cur.__psyLogoutV33)return;
  const f=function(){const r=cur.apply(this,arguments);setTimeout(ensureLogoutButton,0);setTimeout(ensureLogoutButton,80);return r};
  f.__psyLogoutV33=true;f.__psyOriginal=cur;assignFn('toggleMenu',f);
}
function install(){installStarterGuard();installAddTeamGuard();installSetActiveGuard();installMenuHook();ensureLogoutButton()}
function boot(){installCss();install();[100,300,800,1500,3000,6000].forEach(ms=>setTimeout(install,ms))}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
console.log('✅ PSYWORLD V33 ativo: novas contas sem Psyduck no time + LOG OUT no menu',BUILD);
})(window,document);
