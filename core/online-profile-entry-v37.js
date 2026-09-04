/* PSYWORLD V37 — Online profile entry
   When the local profile was explicitly signed out, LOGIN ONLINE must not silently reuse/upload the local save.
   It temporarily hides local saves during auth conflict resolution, then loads the authenticated account's cloud save.
*/
(function(W,D){
'use strict';
if(W.__PSYWORLD_ONLINE_PROFILE_ENTRY_V37__)return;
W.__PSYWORLD_ONLINE_PROFILE_ENTRY_V37__=true;
const BUILD='ONLINE_PROFILE_ENTRY_V37_20260904_A';
const EXIT_KEY='psyworld_local_profile_signed_out_v36';
const SESSION_KEY='psyworld_online_session_v23';
const SYNC_KEY='psyworld_cloud_sync_v23';
const SAVE_KEYS=['psyWorldSave','psyWorldSave_v9','psyWorldSave_backup'];
const $=id=>D.getElementById(id);
const toast=(m,t=3200)=>{try{W.notif?.(m,t)}catch(_){console.log(m)}};
function parse(s){try{return s?JSON.parse(s):null}catch(_){return null}}
function locked(){try{return localStorage.getItem(EXIT_KEY)==='1'}catch(_){return false}}
function session(){return parse(localStorage.getItem(SESSION_KEY))}
function validSave(x){const p=x?.player||x;return !!(p&&Array.isArray(p.team)&&p.team.length&&p.team[0]?.id)}
function stashLocal(){const out={};for(const k of SAVE_KEYS){try{const v=localStorage.getItem(k);if(v!==null)out[k]=v;localStorage.removeItem(k)}catch(_){}}return out}
function restoreLocal(stash){for(const k of SAVE_KEYS){try{if(Object.prototype.hasOwnProperty.call(stash,k))localStorage.setItem(k,stash[k]);else localStorage.removeItem(k)}catch(_){}}}
function cloudStamp(game){return Math.max(Date.parse(game?.client_updated_at||'')||0,Date.parse(game?.updated_at||'')||0,Number(game?.save?.savedAt||0))}
function writeSync(game,save,s){
  try{
    const old=parse(localStorage.getItem(SYNC_KEY))||{};
    localStorage.setItem(SYNC_KEY,JSON.stringify({...old,userKey:String(s?.user?.id||s?.user?.email||''),resolved:true,saveStamp:Number(save?.savedAt||0),cloudStamp:cloudStamp(game)||Date.now(),lastDownloadAt:Date.now()}));
  }catch(_){}
}
async function fetchCloud(){
  const s=session();if(!s?.access_token)throw new Error('Sessão online não encontrada.');
  const r=await fetch('/api/player',{cache:'no-store',headers:{Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'}});
  let d={};try{d=await r.json()}catch(_){}
  if(!r.ok)throw new Error(d.error||d.message||('HTTP '+r.status));
  return {state:d,session:s};
}
async function enterCloudProfile(stash){
  const {state,session:s}=await fetchCloud();
  const game=state?.game_state,save=game?.save;
  if(!validSave(save)){
    restoreLocal(stash);
    toast('☁ Conta conectada, mas ainda não existe um save na nuvem. Use COMEÇAR para criar um perfil novo ou CARREGAR SAVE para abrir o local.',5200);
    return false;
  }
  try{
    const previous=stash.psyWorldSave||stash.psyWorldSave_v9||null;
    if(previous)localStorage.setItem('psyWorldSave_backup_before_online_login_'+Date.now(),previous);
    if(stash.psyWorldSave_backup)localStorage.setItem('psyWorldSave_backup',stash.psyWorldSave_backup);
    const raw=JSON.stringify(save);
    localStorage.setItem('psyWorldSave',raw);
    localStorage.setItem('psyWorldSave_v9',raw);
    writeSync(game,save,s);
    localStorage.removeItem(EXIT_KEY);
    try{$('psy-cloud-modal')?.remove()}catch(_){}
    toast('☁ Conta online carregada. Abrindo seu save da nuvem...',2800);
    setTimeout(()=>location.reload(),350);
    return true;
  }catch(e){restoreLocal(stash);throw e}
}
function install(){
  const cloud=W.psyCloudV23;if(!cloud||typeof cloud.login!=='function'||cloud.login.__psyV37)return false;
  const old=cloud.login;
  const f=async function(){
    const wasLocked=locked();
    if(!wasLocked)return old.apply(this,arguments);
    const stash=stashLocal();
    let ok=false;
    try{
      const r=await old.apply(this,arguments);
      const s=session();
      if(!s?.access_token){restoreLocal(stash);return r}
      try{$('psy-cloud-modal')?.remove()}catch(_){}
      ok=await enterCloudProfile(stash);
      return r;
    }catch(e){
      if(!ok)restoreLocal(stash);
      console.warn('online profile entry v37',e);
      toast('❌ Não foi possível abrir o save dessa conta: '+String(e?.message||e),4800);
      throw e;
    }
  };
  f.__psyV37=true;f.__psyOriginal=old;cloud.login=f;
  const btn=$('psy-online-login');if(btn)btn.onclick=()=>cloud.login();
  return true;
}
function boot(){install();[50,120,250,500,900,1600,3000,6000].forEach(ms=>setTimeout(install,ms));setInterval(install,2500)}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
console.log('✅ PSYWORLD V37 ativo: login online abre o save da conta, sem puxar o perfil local',BUILD);
})(window,document);
