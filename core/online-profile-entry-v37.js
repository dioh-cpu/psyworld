/* PSYWORLD V38 — Personagens por conta online
   - login online autentica a conta, mas não escolhe personagem sozinho;
   - nick existente abre o personagem correspondente;
   - nick novo inicia um personagem novo e independente;
   - o save local anterior fica guardado enquanto o perfil local estiver fechado;
   - personagem legado foi migrado no servidor como "Principal".
*/
(function(W,D){
'use strict';
if(W.__PSYWORLD_ONLINE_CHARACTERS_V38__)return;
W.__PSYWORLD_ONLINE_CHARACTERS_V38__=true;
const BUILD='ONLINE_CHARACTERS_V38_20260904_A';
const EXIT_KEY='psyworld_local_profile_signed_out_v36';
const SESSION_KEY='psyworld_online_session_v23';
const SYNC_KEY='psyworld_cloud_sync_v23';
const STASH_KEY='psyworld_local_profile_stash_v38';
const PENDING_KEY='psyworld_new_character_pending_v38';
const SELECTED_KEY='psyworld_active_character_v38';
const SAVE_KEYS=['psyWorldSave','psyWorldSave_v9','psyWorldSave_backup'];
const $=id=>D.getElementById(id);
const toast=(m,t=3200)=>{try{W.notif?.(m,t)}catch(_){console.log(m)}};
function parse(s){try{return s?JSON.parse(s):null}catch(_){return null}}
function session(){return parse(localStorage.getItem(SESSION_KEY))}
function locked(){try{return localStorage.getItem(EXIT_KEY)==='1'}catch(_){return false}}
function player(){try{return P}catch(_){return W.P||null}}
function validSave(x){const p=x?.player||x;return !!(p&&Array.isArray(p.team)&&p.team.length&&p.team[0]?.id)}
function authHeaders(){const s=session();return s?.access_token?{Authorization:'Bearer '+s.access_token}:{} }
async function api(path,opt={}){const r=await fetch(path,{cache:'no-store',...opt,headers:{'Content-Type':'application/json',...authHeaders(),...(opt.headers||{})}});let d={};try{d=await r.json()}catch(_){}if(!r.ok)throw new Error(d.error||d.message||('HTTP '+r.status));return d}
function saveSession(d){const prev=session()||{};const expiresIn=Number(d?.expires_in||3600);const s={...prev,...d,user:d?.user||prev.user,expires_at:Date.now()+expiresIn*1000};localStorage.setItem(SESSION_KEY,JSON.stringify(s));return s}
function saveStash(){
  let old=parse(localStorage.getItem(STASH_KEY))||{};
  let changed=false;
  for(const k of SAVE_KEYS){
    try{const v=localStorage.getItem(k);if(v!==null){if(old[k]==null)old[k]=v;localStorage.removeItem(k);changed=true}}catch(_){}
  }
  if(changed||Object.keys(old).length)try{localStorage.setItem(STASH_KEY,JSON.stringify(old))}catch(_){}
  return old;
}
function restoreStash(){
  const old=parse(localStorage.getItem(STASH_KEY))||{};
  for(const k of SAVE_KEYS){try{if(old[k]!=null)localStorage.setItem(k,old[k])}catch(_){}}
  try{localStorage.removeItem(STASH_KEY);localStorage.removeItem(EXIT_KEY)}catch(_){}
  return old;
}
function backupAndClearActive(){
  const stamp=Date.now();
  for(const k of SAVE_KEYS){try{const v=localStorage.getItem(k);if(v!==null)localStorage.setItem(k+'_before_character_'+stamp,v);localStorage.removeItem(k)}catch(_){}}
  saveStash();
}
function characterMode(){const login=$('screen-login');return locked()||!!localStorage.getItem(PENDING_KEY)||(login&&getComputedStyle(login).display!=='none')}
function renderConnectedStatus(){
  const s=$('psy-online-status'),ss=session();
  if(s)s.textContent=ss?.access_token?'☁ Conta conectada • escolha um personagem ou digite um nick novo.':'Não conectado.';
}
async function listCharacters(){const d=await api('/api/player/characters');return Array.isArray(d.characters)?d.characters:[]}
function ensureCharacterList(){
  const form=$('psy-online-form');if(!form)return null;
  let box=$('psy-character-list-v38');
  if(!box){box=D.createElement('div');box.id='psy-character-list-v38';box.style.cssText='margin-top:10px;padding-top:9px;border-top:1px solid #1d4f68;font-size:10px;color:#bae6fd';form.appendChild(box)}
  return box;
}
async function renderCharacters(){
  const box=ensureCharacterList();if(!box)return;
  if(!session()?.access_token){box.innerHTML='';box.style.display='none';return}
  box.style.display='block';box.innerHTML='<b>PERSONAGENS DA CONTA</b><div style="margin-top:6px;color:#7dd3fc">Carregando...</div>';
  try{
    const chars=await listCharacters();
    const rows=chars.length?chars.map(c=>`<button type="button" data-psy-char="${String(c.nickname).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" style="display:block;width:100%;margin-top:5px;padding:8px;border:1px solid #256b8a;border-radius:6px;background:#0b2538;color:#fff;text-align:left;cursor:pointer"><b>${String(c.nickname).replace(/</g,'&lt;')}</b>${c.active_pokemon?` • ${String(c.active_pokemon).replace(/</g,'&lt;')} Lv.${Number(c.active_level||1)}`:''}</button>`).join(''):'<div style="margin-top:6px;color:#94a3b8">Nenhum personagem criado ainda.</div>';
    box.innerHTML='<b>PERSONAGENS DA CONTA</b>'+rows+'<div style="margin-top:7px;color:#67e8f9">Digite um nick novo acima e clique COMEÇAR para criar outro personagem.</div>';
    box.querySelectorAll('[data-psy-char]').forEach(b=>b.onclick=()=>{const n=b.dataset.psyChar||'';const input=$('nick-input');if(input)input.value=n;openCharacter(n)});
  }catch(e){box.innerHTML='<b>PERSONAGENS DA CONTA</b><div style="margin-top:6px;color:#fca5a5">Falha ao listar personagens: '+String(e.message||e)+'</div>'}
}
async function directLogin(){
  const email=$('psy-online-email')?.value.trim(),password=$('psy-online-pass')?.value||'';
  if(!email||!password)return toast('Informe e-mail e senha.');
  try{
    const cfg=await fetch('/api/config',{cache:'no-store'}).then(r=>r.json());
    if(!cfg?.onlineConfigured)throw new Error('Servidor online não configurado.');
    const r=await fetch(cfg.supabaseUrl+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:cfg.supabaseAnonKey,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    let d={};try{d=await r.json()}catch(_){}
    if(!r.ok)throw new Error(d.msg||d.error_description||d.message||d.error||('AUTH '+r.status));
    saveSession(d);
    // Nesta tela a conta fica conectada, mas nenhum personagem é aberto até o nick ser escolhido.
    localStorage.setItem(EXIT_KEY,'1');
    saveStash();
    renderConnectedStatus();
    await renderCharacters();
    toast('☁ Conta conectada. Escolha um personagem ou digite um nick novo.',3800);
    return d;
  }catch(e){toast('❌ Login: '+String(e.message||e).replaceAll('_',' '),4500);throw e}
}
async function openCharacter(nickname){
  const nick=String(nickname||'').trim();if(nick.length<2)return toast('Nick inválido.');
  try{
    const d=await api('/api/player/character?nickname='+encodeURIComponent(nick));
    const c=d.character,save=c?.save;if(!validSave(save))throw new Error('Save do personagem inválido.');
    saveStash();
    const raw=JSON.stringify(save);
    localStorage.setItem('psyWorldSave',raw);localStorage.setItem('psyWorldSave_v9',raw);
    localStorage.setItem(SELECTED_KEY,c.nickname||nick);
    localStorage.removeItem(PENDING_KEY);localStorage.removeItem(EXIT_KEY);
    const ss=session();try{const old=parse(localStorage.getItem(SYNC_KEY))||{};localStorage.setItem(SYNC_KEY,JSON.stringify({...old,userKey:String(ss?.user?.id||ss?.user?.email||''),resolved:true,characterNickname:c.nickname||nick,saveStamp:Number(save.savedAt||0),cloudStamp:Date.parse(c.updated_at||'')||Date.now(),lastDownloadAt:Date.now()}))}catch(_){}
    toast('☁ Abrindo '+(c.nickname||nick)+'...',1800);setTimeout(()=>location.reload(),250);
  }catch(e){toast('❌ Não foi possível abrir o personagem: '+String(e.message||e),4200)}
}
function beginNewCharacter(nick){
  saveStash();backupAndClearActive();
  localStorage.setItem(PENDING_KEY,nick);localStorage.setItem(EXIT_KEY,'1');
  toast('✨ Novo personagem "'+nick+'". Escolha o starter.',2600);
  setTimeout(()=>location.reload(),220);
}
async function chooseNick(){
  const nick=$('nick-input')?.value.trim()||'';
  if(nick.length<2)return toast('❌ Nick muito curto!');
  if(!session()?.access_token)return false;
  try{
    const chars=await listCharacters();const found=chars.find(c=>String(c.nickname||'').toLowerCase()===nick.toLowerCase());
    if(found){await openCharacter(found.nickname);return true}
    beginNewCharacter(nick);return true;
  }catch(e){toast('❌ Falha ao consultar personagens: '+String(e.message||e),4200);return true}
}
function startPendingFresh(){
  const nick=localStorage.getItem(PENDING_KEY);if(!nick)return false;
  for(const k of SAVE_KEYS)try{localStorage.removeItem(k)}catch(_){}
  try{$('psy-cloud-modal')?.remove()}catch(_){}
  const p=player();if(!p||typeof W.buildStarterScreen!=='function')return false;
  p.name=nick;p.meta=p.meta||{};p.meta.characterNickname=nick;p.meta.onlineCharacter=true;p.meta.noPsyduckNormalTeamV33=true;
  const input=$('nick-input');if(input)input.value=nick;
  const lab=$('trainer-name-label');if(lab)lab.textContent=nick;
  const login=$('screen-login');if(login)login.style.display='none';
  const starter=$('screen-starter');if(starter)starter.style.display='flex';
  try{W.buildStarterScreen()}catch(e){try{buildStarterScreen()}catch(_){console.warn(e)}}
  localStorage.removeItem(EXIT_KEY);
  return true;
}
function installGoStarter(){
  const cur=W.goStarter;if(typeof cur!=='function'||cur.__psyV38)return;
  const f=async function(){if(session()?.access_token){const handled=await chooseNick();if(handled)return}return cur.apply(this,arguments)};
  f.__psyV38=true;f.__psyOriginal=cur;W.goStarter=f;try{globalThis.goStarter=f}catch(_){}
}
function installConfirm(){
  const cur=W.confirmStarter;if(typeof cur!=='function'||cur.__psyCharV38)return;
  const f=function(){
    const nick=localStorage.getItem(PENDING_KEY);
    if(!nick)return cur.apply(this,arguments);
    const p=player();if(p){p.meta=p.meta||{};p.meta.characterNickname=nick;p.meta.onlineCharacter=true;p.meta.noPsyduckNormalTeamV33=true}
    const r=cur.apply(this,arguments);
    setTimeout(()=>{
      const pp=player();if(pp){pp.meta=pp.meta||{};pp.meta.characterNickname=nick;pp.meta.onlineCharacter=true;pp.meta.noPsyduckNormalTeamV33=true}
      localStorage.setItem(SELECTED_KEY,nick);localStorage.removeItem(PENDING_KEY);localStorage.removeItem(EXIT_KEY);
      try{W.autoSave?.()}catch(_){}
      setTimeout(()=>{try{W.psyCloudV23?.uploadNow?.()}catch(_){}},450);
    },30);
    return r;
  };
  f.__psyCharV38=true;f.__psyOriginal=cur;W.confirmStarter=f;try{globalThis.confirmStarter=f}catch(_){}
}
function installLocalLoadRestore(){
  const cur=W.loadOnLogin;if(typeof cur!=='function'||cur.__psyStashV38)return;
  const f=function(){restoreStash();return cur.apply(this,arguments)};f.__psyStashV38=true;f.__psyOriginal=cur;W.loadOnLogin=f;try{globalThis.loadOnLogin=f}catch(_){}
}
function installLogin(){
  const cloud=W.psyCloudV23;if(!cloud)return;
  if(!cloud.login?.__psyCharactersV38){const old=cloud.login;const f=async function(){if(characterMode())return directLogin();return old?.apply(this,arguments)};f.__psyCharactersV38=true;f.__psyOriginal=old;cloud.login=f}
  const b=$('psy-online-login');if(b)b.onclick=()=>cloud.login();
}
function maintenance(){
  if(locked())saveStash();
  if(localStorage.getItem(PENDING_KEY)){try{$('psy-cloud-modal')?.remove()}catch(_){};startPendingFresh()}
  installLogin();installGoStarter();installConfirm();installLocalLoadRestore();renderConnectedStatus();
  if(session()?.access_token&&$('screen-login')&&getComputedStyle($('screen-login')).display!=='none')renderCharacters();
}
function boot(){maintenance();[80,180,350,700,1400,3000,6000].forEach(ms=>setTimeout(maintenance,ms));setInterval(()=>{installLogin();installGoStarter();installConfirm();installLocalLoadRestore();if(locked())saveStash();if(localStorage.getItem(PENDING_KEY))startPendingFresh()},1800)}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
W.psyCharactersV38={list:listCharacters,open:openCharacter,render:renderCharacters};
console.log('✅ PSYWORLD V38 ativo: conta online com múltiplos personagens por nickname',BUILD);
})(window,document);
