/* PSYWORLD V38B — Personagens por conta online
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
const BUILD='ONLINE_CHARACTERS_V38C_20260927';
const EXIT_KEY='psyworld_local_profile_signed_out_v36';
const SESSION_KEY='psyworld_online_session_v23';
const SYNC_KEY='psyworld_cloud_sync_v23';
const SYNC_PROFILES_KEY='psyworld_cloud_sync_profiles_v1';
const STASH_KEY='psyworld_local_profile_stash_v38';
const PENDING_KEY='psyworld_new_character_pending_v38';
const SELECTED_KEY='psyworld_active_character_v38';
const CHARACTER_ID_KEY='psyworld_active_character_id_v1';
let characterRequest=null,characterRequestOwner='',characterRetryOwner='',characterRetryAt=0,automaticEntryOwner='',entryGeneration=0,entryObservedOwner='',sessionEntryFlight=null;
const SAVE_KEYS=['psyWorldSave','psyWorldSave_v9','psyWorldSave_v2','psyWorldSave_backup'];
const $=id=>D.getElementById(id);
const toast=(m,t=3200)=>{try{W.notif?.(m,t)}catch(_){console.log(m)}};
function parse(s){try{return s?JSON.parse(s):null}catch(_){return null}}
const entryTrace=[];
function traceEntry(step,status,durationMs=0,code=''){
  const row={step,status,durationMs:Math.max(0,Math.round(durationMs)),...(code?{code}:{})};entryTrace.push(row);if(entryTrace.length>40)entryTrace.shift();
  try{localStorage.setItem('psyworld_entry_trace_v1',JSON.stringify(entryTrace))}catch(_){}
  try{console.info('[PSYWORLD Entry]',JSON.stringify(row))}catch(_){}
}
function startEntryStep(step){const started=Date.now();traceEntry(step,'pending');let ended=false;return(status,code='')=>{if(ended)return;ended=true;traceEntry(step,status,Date.now()-started,code)}}
function safeEntryCode(error){const value=String(error?.code||error?.message||'').toLowerCase();if(/timeout|abort/.test(value))return'entry_request_timeout';if(/identity|owner|user.*change/.test(value))return'entry_identity_changed';if(/save|invalid/.test(value))return'entry_save_invalid';if(/entry_runtime_rejected/.test(value))return'entry_runtime_rejected';if(/network|fetch|http|temporarily/.test(value))return'entry_request_failed';if(/runtime/.test(value))return'entry_runtime_unavailable';return'entry_failed'}
function session(){return parse(localStorage.getItem(SESSION_KEY))}
function tokenUserKey(token){try{const part=String(token||'').split('.')[1];if(!part)return'';const b=part.replace(/-/g,'+').replace(/_/g,'/');return String(JSON.parse(atob(b.padEnd(Math.ceil(b.length/4)*4,'='))).sub||'')}catch(_){return''}}
function sessionUserKey(s=session()){return String(s?.user?.id||s?.user?.email||s?.email||tokenUserKey(s?.access_token)||'')}
function authenticatedUserId(s=session()){return String(s?.user?.id||tokenUserKey(s?.access_token)||'')}
function locked(){try{return localStorage.getItem(EXIT_KEY)==='1'}catch(_){return false}}
function player(){try{return P}catch(_){return W.P||null}}
function validSave(x){if(typeof W.psyCloudV23?.validSave==='function')return W.psyCloudV23.validSave(x);const p=x?.player||x;return !!(p&&Array.isArray(p.team)&&Array.isArray(p.box)&&(p.team.some(m=>m&&(m.id||m.name))||p.box.some(m=>m&&(m.id||m.name))||((p.meta?.characterNickname||p.name)&&(x?.version||x?.v||x?.savedAt||x?.map))))}
function saveSignature(save){let snapshot=save||null;if(snapshot&&typeof snapshot==='object'&&!Array.isArray(snapshot)){snapshot={...snapshot};delete snapshot.savedAt}const value=JSON.stringify(snapshot);let hash=2166136261;for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619)}return (hash>>>0).toString(36)+':'+value.length}
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
  try{localStorage.removeItem(STASH_KEY);localStorage.removeItem(EXIT_KEY);localStorage.removeItem(PENDING_KEY)}catch(_){}
  return old;
}
function backupAndClearActive(){
  const stamp=Date.now();
  for(const k of SAVE_KEYS){try{const v=localStorage.getItem(k);if(v!==null)localStorage.setItem(k+'_before_character_'+stamp,v);localStorage.removeItem(k)}catch(_){}}
}
function characterMode(){const login=$('screen-login');return locked()||!!localStorage.getItem(PENDING_KEY)||(login&&getComputedStyle(login).display!=='none')}
function renderConnectedStatus(){
  const s=$('psy-online-status'),ss=session();
  if(s&&s.dataset.psyOauthDiagnostic!=='1')s.textContent=ss?.access_token?'☁ Conta conectada • verificando personagens…':'Não conectado.';
  const signedIn=!!ss?.access_token,toggle=$('psy-online-toggle');
  if(toggle)toggle.textContent=signedIn?'☁ CONTA CONECTADA':'☁ CONTA ONLINE / CLOUD SAVE';
  const defaults={'psy-online-auth-help':'block','psy-online-email':'','psy-online-pass':'','psy-online-password-actions':'grid','psy-online-social-actions':'grid'};
  for(const [id,value] of Object.entries(defaults)){const el=$(id);if(el)el.style.display=signedIn?'none':value}
  const resend=$('psy-online-resend');if(resend&&signedIn)resend.style.display='none';
}
async function listCharacters(expectedOwner){
  const d=await (typeof W.psyCloudV23?.getAccountState==='function'?W.psyCloudV23.getAccountState():api('/api/player'));
  const owner=String(d?.user?.id||'');
  if(!expectedOwner||!owner||owner!==expectedOwner)throw new Error('account_identity_mismatch');
  if(!Array.isArray(d.characters))throw new Error('character_list_unavailable');
  return d.characters;
}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function ensureCharacterList(){
  const form=$('psy-online-form');if(!form)return null;
  let box=$('psy-character-list-v38');
  if(!box){box=D.createElement('div');box.id='psy-character-list-v38';box.style.cssText='margin-top:10px;padding-top:9px;border-top:1px solid #1d4f68;font-size:10px;color:#bae6fd';form.appendChild(box)}
  return box;
}
function trustedSelectedCharacter(owner){
  const id=String(localStorage.getItem(CHARACTER_ID_KEY)||'').trim(),meta=parse(localStorage.getItem(SYNC_KEY))||{},nick=String(localStorage.getItem(SELECTED_KEY)||'').trim();
  if(!id||!owner||meta.resolved!==true||String(meta.userKey||'')!==owner||String(meta.characterId||'')!==id||!String(meta.characterNickname||'').trim())return null;
  if(nick&&nick.toLowerCase()!==String(meta.characterNickname).trim().toLowerCase())return null;
  return{id,nickname:String(meta.characterNickname).trim()};
}
async function renderCharacters(force=false){
  const box=ensureCharacterList();if(!box)return;
  const ss=session();
  if(!ss?.access_token){box.innerHTML='';box.style.display='none';box.dataset.loadedOwner='';return}
  const owner=authenticatedUserId(ss);
  const generation=entryGeneration;
  const form=$('psy-online-form'),toggle=$('psy-online-toggle'),login=$('screen-login');
  const showAccount=!!(form&&login&&getComputedStyle(login).display!=='none');
  if(!owner){if(showAccount){form.style.display='block';toggle?.setAttribute('aria-expanded','true')}W.psyCloudV23?.finishEntryRecovery?.();box.style.display='block';box.innerHTML='<b>PERSONAGENS DA CONTA</b><div style="margin-top:6px;color:#fca5a5">Não foi possível validar a identidade desta sessão. Entre novamente para proteger seus saves.</div>';box.dataset.loadedOwner='';return}
  if(characterRequest&&characterRequestOwner===owner)return characterRequest;
  if(!force&&characterRetryOwner===owner&&Date.now()<characterRetryAt)return;
  if(!force&&box.dataset.loadedOwner===owner){if(showAccount){form.style.display='block';toggle?.setAttribute('aria-expanded','true')}return}
  if(showAccount){form.style.display='block';toggle?.setAttribute('aria-expanded','true')}
  W.psyCloudV23?.beginEntryRecovery?.();
  box.style.display='block';box.innerHTML='<b>PERSONAGENS DA CONTA</b><div style="margin-top:6px;color:#7dd3fc">Carregando...</div>';
  const trusted=!force&&trustedSelectedCharacter(owner);
  if(trusted){
    const key=owner+'::'+trusted.id;
    if(automaticEntryOwner===key)return;
    automaticEntryOwner=key;box.innerHTML='<b>PERSONAGENS DA CONTA</b><div style="margin-top:6px;color:#7dd3fc">Retomando '+esc(trusted.nickname)+'…</div>';
    const request=openCharacter(trusted,{automatic:true,box});characterRequest=request;characterRequestOwner=owner;
    try{await request}finally{if(characterRequest===request){characterRequest=null;characterRequestOwner=''}}
    return;
  }
  const request=(async()=>{
    try{
      const listStep=startEntryStep('character_list');
      let chars;
      try{chars=await listCharacters(owner);listStep('completed')}catch(e){listStep('failed',safeEntryCode(e));throw e}
      if(generation!==entryGeneration||authenticatedUserId(session())!==owner)throw Object.assign(new Error('account_identity_changed'),{code:'entry_identity_changed'});
      const valid=chars.filter(c=>String(c?.id||'').trim()&&String(c?.nickname||'').trim());
      const rows=valid.map(c=>`<button type="button" data-psy-character-id="${esc(c.id)}" data-psy-char="${esc(c.nickname)}" aria-pressed="${String(c.id)===localStorage.getItem(CHARACTER_ID_KEY)?'true':'false'}" style="display:block;width:100%;margin-top:5px;padding:8px;border:1px solid #256b8a;border-radius:6px;background:#0b2538;color:#fff;text-align:left;cursor:pointer"><b>${esc(c.nickname)}</b>${c.active_pokemon?` • ${esc(c.active_pokemon)} Lv.${Number(c.active_level||1)}`:''}</button>`).join('');
      const uncertain=chars.length!==valid.length;
      let body='';
      if(!chars.length)body='<div style="margin-top:6px;color:#94a3b8">Esta conta ainda não tem personagens. Digite um nick novo acima e clique COMEÇAR para criar o primeiro.</div>';
      else if(uncertain)body='<div style="margin-top:6px;color:#fbbf24">Alguns personagens não puderam ser identificados com segurança. Atualize a lista antes de escolher ou criar outro.</div>';
      else if(valid.length===1)body='<div style="margin-top:6px;color:#7dd3fc">Encontramos seu personagem. Validando o save seguro da conta…</div>';
      else body='<div style="margin-top:6px;color:#7dd3fc">Escolha um dos personagens desta conta.</div>';
      const createHint=chars.length===0?'<div style="margin-top:7px;color:#67e8f9">A criação começa somente quando você digitar um nick e clicar COMEÇAR.</div>':'';
      box.innerHTML='<b>PERSONAGENS DA CONTA</b>'+body+rows+createHint;
      box.dataset.loadedOwner=owner;characterRetryOwner='';characterRetryAt=0;
      box.querySelectorAll('[data-psy-character-id]').forEach(b=>b.onclick=()=>openCharacter({id:b.dataset.psyCharacterId,nickname:b.dataset.psyChar}));
      if(!uncertain&&valid.length===1){
        const key=owner+'::'+String(valid[0].id);
        if(automaticEntryOwner!==key){automaticEntryOwner=key;await openCharacter(valid[0],{automatic:true,box})}
      }else W.psyCloudV23?.finishEntryRecovery?.();
    }catch(e){
      if(generation!==entryGeneration)return;
      box.innerHTML='<b>PERSONAGENS DA CONTA</b><div style="margin-top:6px;color:#fca5a5">Não foi possível carregar seus personagens. Nenhum save foi alterado. Verifique sua conexão e tente novamente.</div><button type="button" data-psy-retry="1" style="display:block;width:100%;margin-top:7px;padding:8px;border:1px solid #fca5a5;border-radius:6px;background:#351a24;color:#fff;font-weight:800;cursor:pointer">TENTAR NOVAMENTE</button>';
      box.dataset.loadedOwner='';characterRetryOwner=owner;characterRetryAt=Date.now()+20000;
      box.querySelector('[data-psy-retry]')?.addEventListener('click',()=>renderCharacters(true));
      W.psyCloudV23?.finishEntryRecovery?.();
      if(e?.message==='account_identity_mismatch'||e?.message==='account_identity_changed')renderConnectedStatus();
    }
  })();
  characterRequest=request;characterRequestOwner=owner;
  try{await request}finally{if(characterRequest===request){characterRequest=null;characterRequestOwner=''}}
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
    localStorage.setItem(EXIT_KEY,'1');
    saveStash();
    renderConnectedStatus();
    await renderCharacters(true);
    toast('☁ Conta conectada. Escolha um personagem ou digite um nick novo.',3800);
    return d;
  }catch(e){toast('❌ Login: '+String(e.message||e).replaceAll('_',' '),4500);throw e}
}
function showCharacterOpenFailure(box,error){
  if(!box)return;
  box.innerHTML='<b>PERSONAGENS DA CONTA</b><div style="margin-top:6px;color:#fca5a5">Não foi possível validar e carregar o save deste personagem. Nenhum save local ou da nuvem foi sobrescrito.</div><button type="button" data-psy-retry="1" style="display:block;width:100%;margin-top:7px;padding:8px;border:1px solid #fca5a5;border-radius:6px;background:#351a24;color:#fff;font-weight:800;cursor:pointer">TENTAR NOVAMENTE</button>';
  box.querySelector('[data-psy-retry]')?.addEventListener('click',()=>renderCharacters(true));
}
async function openCharacter(target,{automatic=false,box=ensureCharacterList()}={}){
  const requestedId=String(target&&typeof target==='object'?target.id||'':'').trim();
  const nickname=target&&typeof target==='object'?target.nickname:target;
  const nick=String(nickname||'').trim(),owner=authenticatedUserId(session());
  if(nick.length<2||!owner||automatic&&!requestedId)return toast('Não foi possível validar este personagem. Atualize a lista da conta.');
  const generation=entryGeneration,fetchStep=startEntryStep('character_save_fetch'),automaticStep=automatic?startEntryStep('automatic_entry'):null;
  try{
    const d=await (requestedId&&typeof W.psyCloudV23?.getAccountCharacterById==='function'?W.psyCloudV23.getAccountCharacterById(requestedId):api('/api/player/character?'+(requestedId?'character_id='+encodeURIComponent(requestedId):'nickname='+encodeURIComponent(nick))));fetchStep('completed');
    if(generation!==entryGeneration||authenticatedUserId(session())!==owner)throw Object.assign(new Error('account_identity_changed'),{code:'entry_identity_changed'});
    const c=d.character;
    if(authenticatedUserId(session())!==owner||requestedId&&String(c?.id||'')!==requestedId)throw new Error('character_id_mismatch');
    const save=W.psyCloudV23?.migrateSave?.(c?.save,{nickname:c?.nickname||nick,characterId:c?.id})||c?.save;
    if(c?.save&&save&&JSON.stringify(c.save)!==JSON.stringify(save)){try{const owner=sessionUserKey(session()),identity=c.id?'id:'+c.id:'nick:'+String(c.nickname||nick).toLowerCase(),backupKey='psyworld_character_backup_v1:'+encodeURIComponent(owner+'::'+identity+'::'+String(c.updated_at||'legacy'));if(!localStorage.getItem(backupKey))localStorage.setItem(backupKey,JSON.stringify({source:'cloud',schemaVersion:1,ownerId:owner,characterId:c.id||null,nickname:c.nickname||nick,cloudRevision:c.updated_at||null,savedAt:Date.now(),save:c.save}))}catch(e){console.warn('legacy cloud save backup',e)}}
    const validateStep=startEntryStep('save_validation');
    if(!validSave(save)){validateStep('failed','entry_save_invalid');throw Object.assign(new Error('Save do personagem inválido ou incompatível. O original foi preservado.'),{code:'entry_save_invalid'})}
    validateStep('completed');
    saveStash();
    const raw=JSON.stringify(save);
    localStorage.setItem('psyWorldSave',raw);localStorage.setItem('psyWorldSave_v9',raw);
    localStorage.setItem(SELECTED_KEY,c.nickname||nick);
    if(c.id)localStorage.setItem(CHARACTER_ID_KEY,String(c.id));
    const active=player();if(active){active.meta=active.meta||{};active.meta.characterNickname=c.nickname||nick;if(c.id){active.meta.characterId=String(c.id);active.playerCharacterId=String(c.id)}}
    localStorage.removeItem(PENDING_KEY);
    const ss=session();try{
      const old=parse(localStorage.getItem(SYNC_KEY))||{},owner=sessionUserKey(ss),selected=c.nickname||nick;
      const same=old.userKey===owner&&String(old.characterNickname||'').toLowerCase()===selected.toLowerCase();
      const scoped=same?old:{};
      const next={...scoped,userKey:owner,resolved:true,deferredConflict:false,characterId:c.id||null,
        characterNickname:selected,saveStamp:Number(save.savedAt||save.time||0),cloudStamp:Date.parse(c.updated_at||'')||Date.now(),
        cloudRevision:c.updated_at||null,revisionScope:'character',localSignature:saveSignature(save),cloudSignature:saveSignature(save),lastDownloadAt:Date.now()};
      localStorage.setItem(SYNC_KEY,JSON.stringify(next));
      const profileKey=owner.toLowerCase()+'::'+(c.id?'id:'+String(c.id):selected.trim().toLowerCase());
      const profiles=parse(localStorage.getItem(SYNC_PROFILES_KEY))||{};
      profiles[profileKey]=next;
      localStorage.setItem(SYNC_PROFILES_KEY,JSON.stringify(profiles));
    }catch(_){}
    const commitStep=startEntryStep('save_commit');commitStep('completed');
    if(generation!==entryGeneration||authenticatedUserId(session())!==owner)throw Object.assign(new Error('account_identity_changed'),{code:'entry_identity_changed'});
    const enterStep=startEntryStep('game_entry');
    try{
      localStorage.removeItem(EXIT_KEY);
      if(typeof W.psyV9EnterSavedGame!=='function')throw Object.assign(new Error('entry_runtime_unavailable'),{code:'entry_runtime_unavailable'});
      if(W.psyV9EnterSavedGame()!==true)throw Object.assign(new Error('entry_runtime_rejected_save'),{code:'entry_runtime_rejected'});
      enterStep('completed');automaticStep?.('completed');W.psyCloudV23?.finishEntryRecovery?.();toast('☁ Bem-vindo '+(c.nickname||nick)+'!',1800);
    }catch(e){localStorage.setItem(EXIT_KEY,'1');enterStep('failed',safeEntryCode(e));throw e}
  }catch(e){fetchStep(e?.code==='entry_identity_changed'?'cancelled':'failed',safeEntryCode(e));automaticStep?.(generation===entryGeneration?'failed':'cancelled',safeEntryCode(e));if(generation!==entryGeneration)return;if(automatic){automaticEntryOwner='';W.psyCloudV23?.finishEntryRecovery?.();showCharacterOpenFailure(box,e)}else toast('❌ Não foi possível abrir o personagem. Confira sua conexão e tente novamente.',4200)}
}
function beginNewCharacter(nick){
  saveStash();backupAndClearActive();
  localStorage.removeItem(CHARACTER_ID_KEY);
  localStorage.setItem(PENDING_KEY,nick);localStorage.setItem(EXIT_KEY,'1');
  toast('✨ Criando novo personagem "'+nick+'". Escolha seu starter.',2800);
  setTimeout(()=>location.reload(),250);
}
async function chooseNick(){
  const nick=$('nick-input')?.value.trim()||'';
  if(nick.length<2){toast('❌ Nick muito curto!');return true}
  if(!session()?.access_token)return false;
  try{
    const owner=authenticatedUserId(session()),chars=await listCharacters(owner);const found=chars.find(c=>String(c.nickname||'').toLowerCase()===nick.toLowerCase());
    if(found){await openCharacter(found);return true}
    beginNewCharacter(nick);return true;
  }catch(e){toast('❌ Falha ao consultar personagens: '+String(e.message||e),4200);return true}
}
function resolveBuildStarter(){
  try{if(typeof buildStarterScreen==='function')return buildStarterScreen}catch(_){}
  try{if(typeof W.buildStarterScreen==='function')return W.buildStarterScreen}catch(_){}
  return null;
}
let pendingEntryNickname=null;
function startPendingFresh(){
  const nick=localStorage.getItem(PENDING_KEY);if(!nick){pendingEntryNickname=null;return false;}
  if(pendingEntryNickname===nick)return true;
  if(typeof W.choosePsyTrainer!=='function')return false;
  for(const k of SAVE_KEYS)try{localStorage.removeItem(k)}catch(_){}
  try{$('psy-cloud-modal')?.remove()}catch(_){}
  const p=player(),bs=resolveBuildStarter();if(!p||typeof bs!=='function')return false;
  p.name=nick;p.team=[];p.box=[];p.pokemon=null;p.level=1;p.exp=0;p.maxExp=100;p.hp=50;p.maxHp=50;p.gold=25000;
  p.meta=p.meta||{};delete p.meta.characterId;delete p.playerCharacterId;p.meta.characterNickname=nick;p.meta.onlineCharacter=true;p.meta.noPsyduckNormalTeamV33=true;
  const input=$('nick-input');if(input)input.value=nick;
  const lab=$('trainer-name-label');if(lab)lab.textContent=nick;
  const login=$('screen-login');if(login)login.style.display='none';
  const starter=$('screen-starter');if(starter)starter.style.display='none';
  pendingEntryNickname=nick;
  W.choosePsyTrainer(()=>{if(starter)starter.style.display='flex';try{bs()}catch(e){console.warn('starter v38',e);pendingEntryNickname=null;}},()=>{pendingEntryNickname=null;localStorage.removeItem(PENDING_KEY);});
  localStorage.removeItem(EXIT_KEY);
  return true;
}
function installGoStarter(){
  const cur=W.goStarter;if(typeof cur!=='function'||cur.__psyV38)return;
  const f=async function(){
    if(locked()&&!localStorage.getItem(PENDING_KEY)){
      if(session()?.access_token){const handled=await chooseNick();if(handled)return}
      const form=$('psy-online-form'),toggle=$('psy-online-toggle'),status=$('psy-online-status');
      if(form){form.style.display='block';toggle?.setAttribute('aria-expanded','true')}
      if(status)status.textContent='Sua sessão online expirou. Entre novamente para carregar seus personagens com segurança.';
      toast('Entre novamente na conta online para continuar. Seu save local foi preservado.',4200);
      return;
    }
    if(session()?.access_token){const handled=await chooseNick();if(handled)return}
    return cur.apply(this,arguments)
  };
  f.__psyV38=true;f.__psyOriginal=cur;W.goStarter=f;try{globalThis.goStarter=f}catch(_){}
}
function installConfirm(){
  const cur=W.confirmStarter;if(typeof cur!=='function'||cur.__psyCharV38)return;
  const f=function(){
    const p0=player();
    if(p0&&!p0.playerCharacterId&&typeof W.choosePsyTrainer==='function'){const args=arguments,self=this;W.choosePsyTrainer(()=>f.apply(self,args));return;}
    const nick=localStorage.getItem(PENDING_KEY);
    if(!nick)return cur.apply(this,arguments);
    const p=player();if(p){p.meta=p.meta||{};p.meta.characterNickname=nick;p.meta.onlineCharacter=true;p.meta.noPsyduckNormalTeamV33=true}
    const r=cur.apply(this,arguments);
    setTimeout(()=>{
      const pp=player();if(pp){pp.meta=pp.meta||{};pp.meta.characterNickname=nick;pp.meta.onlineCharacter=true;pp.meta.noPsyduckNormalTeamV33=true}
      localStorage.setItem(SELECTED_KEY,nick);localStorage.removeItem(PENDING_KEY);localStorage.removeItem(EXIT_KEY);
      try{W.autoSave?.()}catch(_){}
      setTimeout(()=>{try{W.psyCloudV23?.uploadNow?.()}catch(_){}},550);
      toast('✅ Personagem '+nick+' criado e vinculado à sua conta.',3200);
    },80);
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
  if(!cloud.login?.__psyCharactersV38){
    const old=cloud.login;
    const f=async function(){if(characterMode())return directLogin();return old?.apply(this,arguments)};
    f.__psyCharactersV38=true;
    f.__psyV36=true; // impede a V36 de limpar o lock antes da escolha do personagem
    f.__psyOriginal=old;cloud.login=f;
  }
  const b=$('psy-online-login');if(b)b.onclick=()=>cloud.login();
}
function maintenance(){
  if(locked()&&!localStorage.getItem(PENDING_KEY))saveStash();
  if(localStorage.getItem(PENDING_KEY)){try{$('psy-cloud-modal')?.remove()}catch(_){};startPendingFresh()}
  installLogin();installGoStarter();installConfirm();installLocalLoadRestore();renderConnectedStatus();
  if(session()?.access_token&&$('screen-login')&&getComputedStyle($('screen-login')).display!=='none')renderCharacters();
}
function handleSessionChanged(event){
  const owner=event?.detail?.authenticated?authenticatedUserId(session()):'';
  if(!owner){if(entryObservedOwner){entryGeneration++;entryObservedOwner='';characterRequest=null;characterRequestOwner='';automaticEntryOwner='';sessionEntryFlight=null;traceEntry('authenticated_session','cancelled',0,'entry_session_ended');W.psyCloudV23?.finishEntryRecovery?.()}return}
  if(owner!==entryObservedOwner){entryGeneration++;entryObservedOwner=owner;characterRequest=null;characterRequestOwner='';automaticEntryOwner='';sessionEntryFlight=null}
  traceEntry('authenticated_session','completed');
  const login=$('screen-login');if(!login||getComputedStyle(login).display==='none')return;
  if(sessionEntryFlight)return;
  const generation=entryGeneration;
  sessionEntryFlight=renderCharacters().catch(e=>{traceEntry('session_entry','failed',0,safeEntryCode(e))}).finally(()=>{if(generation===entryGeneration)sessionEntryFlight=null});
  return sessionEntryFlight;
}
entryObservedOwner=authenticatedUserId(session());
try{W.addEventListener('psyworld-online-session-changed',handleSessionChanged)}catch(_){}
function boot(){maintenance();[80,180,350,700,1400,3000,6000].forEach(ms=>setTimeout(maintenance,ms));setInterval(()=>{installLogin();installGoStarter();installConfirm();installLocalLoadRestore();if(locked()&&!localStorage.getItem(PENDING_KEY))saveStash();if(localStorage.getItem(PENDING_KEY))startPendingFresh()},1800)}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
W.psyCharactersV38={list:listCharacters,open:openCharacter,render:renderCharacters,diagnostics:()=>entryTrace.slice()};
console.log('✅ PSYWORLD V38B ativo: nick existente abre; nick novo cria personagem independente',BUILD);
})(window,document);
