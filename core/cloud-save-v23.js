(function(W,D){
'use strict';
const SESSION_KEY='psyworld_online_session_v23';
const SYNC_KEY='psyworld_cloud_sync_v23';
const SYNC_PROFILES_KEY='psyworld_cloud_sync_profiles_v1';
const CHARACTER_KEY='psyworld_active_character_v38';
const CHARACTER_ID_KEY='psyworld_active_character_id_v1';
const SIGNUP_RESEND_KEY='psyworld_signup_resend_after_v1';
const OAUTH_STORAGE_KEY='psyworld_supabase_oauth_flow_v1';
const OAUTH_INTENT_KEY='psyworld_oauth_intent_v1';
const EXIT_KEY='psyworld_local_profile_signed_out_v36';
const PENDING_KEY='psyworld_new_character_pending_v38';
const LOCAL_KEYS=['psyWorldSave','psyWorldSave_v9','psyWorldSave_v2','psyWorldSave_backup'];
const PROFILE_SAVE_PREFIX='psyworld_character_save_v1:';
const PROD_ORIGIN='https://psyworld-murex.vercel.app';
const FAST_POS_KEY='psyworld_fast_encounter_pos_v24';
let config=null,session=null,syncEnabled=false,syncTimer=0,localTimer=0,autosaveTimer=0,economyBusy=false,lastUploadError='',cloudPhase='idle',uploadFlights=new Map(),retryDelay=5000,signupBusy=false,resendBusy=false,oauthClient=null,oauthSdkPromise=null,oauthBusy=false;
const $=id=>D.getElementById(id);
function toast(msg,ms=3200){try{W.notif?.(msg,ms)}catch(_){console.log(msg)}}
function parse(s){try{return s?JSON.parse(s):null}catch(_){return null}}
function unwrapSave(x){let s=x;if(typeof s==='string')s=parse(s);if(s?.save&&typeof s.save==='object')s=s.save;if(s?.game_state?.save)s=s.game_state.save;if(s?.player_game_state?.save)s=s.player_game_state.save;return s}
function savePlayer(s){const x=unwrapSave(s);return x?.player&&typeof x.player==='object'?x.player:x&&typeof x==='object'?x:null}
function saveNick(s){const p=savePlayer(s)||{};return String(p.meta?.characterNickname||p.characterNickname||p.trainerName||p.name||p.nickname||'').trim()}
function saveCharacterId(s){const p=savePlayer(s)||{};return String(p.meta?.characterId||p.characterId||unwrapSave(s)?.character_id||'').trim()}
function validPokemon(mon){return !!(mon&&typeof mon==='object'&&(Number(mon.id)>0||Number(mon.speciesId)>0||Number(mon.species_id)>0||Number(mon.dex)>0||String(mon.name||'').trim()))}
function normalizeSave(value,{nickname=selectedNick(),characterId=selectedCharacterId()}={}){
 const source=unwrapSave(value),p0=savePlayer(source);if(!source||!p0)return null;
 const player={...p0},root={...source};
 if(!Array.isArray(player.team))player.team=Array.isArray(player.party)?player.party:[];
 if(!Array.isArray(player.box))player.box=Array.isArray(player.storage)?player.storage:[];
 player.meta={...(player.meta||{})};
 if(characterId&&!player.meta.characterId)player.meta.characterId=characterId;
 if(nickname&&!player.meta.characterNickname&&!player.characterNickname)player.meta.characterNickname=nickname;
 const oldVersion=Number(source.version||source.v||source.schemaVersion||0);
 const savedAt=Number(source.savedAt||source.time||source.timestamp||source.client_updated_at||0);
 delete root.save;delete root.game_state;delete root.player_game_state;
 root.player=player;root.map=source.map&&typeof source.map==='object'?{...source.map}:source.map;
 if(savedAt)root.savedAt=savedAt;
 if(oldVersion!==9){root.version=9;root.migratedFromVersion=oldVersion||'legacy-unknown';if(source.migratedAt||savedAt)root.migratedAt=Number(source.migratedAt||savedAt)}
 return root;
}
function validSave(value){
 const s=normalizeSave(value,{nickname:'',characterId:''}),p=savePlayer(s);if(!s||!p||!Array.isArray(p.team)||!Array.isArray(p.box))return false;
 const roster=[...p.team,...p.box].some(validPokemon);
 if(roster)return true;
 const identity=saveCharacterId(s)||saveNick(s)||String(p.meta?.characterNickname||p.name||'').trim();
 const initialized=!!(s.version||s.v||s.schemaVersion||s.savedAt||s.time||s.map||p.meta?.onlineCharacter||p.playerCharacterId);
 return !!identity&&initialized;
}
function selectedNick(){return String(localStorage.getItem(CHARACTER_KEY)||'').trim()}
function selectedCharacterId(){return String(localStorage.getItem(CHARACTER_ID_KEY)||'').trim()}
function sameNick(a,b){return String(a||'').trim().toLowerCase()===String(b||'').trim().toLowerCase()}
function pendingProfile(){return localStorage.getItem(EXIT_KEY)==='1'||!!localStorage.getItem(PENDING_KEY)}
function profileStoreKey(owner=userKey(),nickname=selectedNick(),characterId=selectedCharacterId()){
 const identity=characterId?'id:'+characterId:(nickname?'nick:'+nickname.trim().toLowerCase():'');
 return identity?PROFILE_SAVE_PREFIX+encodeURIComponent(String(owner||'local')+'::'+identity):'';
}
function belongsToSelected(save,{allowNicknameFallback=true}={}){const id=saveCharacterId(save),wantedId=selectedCharacterId(),nick=saveNick(save),wantedNick=selectedNick();if(wantedId&&id)return wantedId===id;if(wantedId&&!allowNicknameFallback)return false;if(wantedId&&!id&&wantedNick&&nick)return sameNick(nick,wantedNick);if(wantedNick&&nick)return sameNick(nick,wantedNick);return !wantedNick&&!wantedId}
function bestLocal(){
  const selected=selectedNick(),id=selectedCharacterId(),profile=parse(localStorage.getItem(profileStoreKey()));
  const active=[];
  for(const key of LOCAL_KEYS){const saved=parse(localStorage.getItem(key));if(!validSave(saved))continue;if(key==='psyWorldSave_backup'&&id&&!saveCharacterId(saved))continue;if(belongsToSelected(saved))active.push(saved)}
  try{
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);if(!key||!/(?:_before_character_|_before_cloud_|_backup)/.test(key))continue;
      const saved=parse(localStorage.getItem(key));if(saved?.source==='cloud'||saved?.ownerId&&String(saved.ownerId)!==(userKey()||'local'))continue;if(!validSave(saved))continue;
      if(id&&!saveCharacterId(saved)&&!saveCharacterId(saved?.save))continue;if(belongsToSelected(saved,{allowNicknameFallback:!id}))active.push(saved);
    }
  }catch(_){}
  const scoped=active.filter(s=>belongsToSelected(s));
  if(profile?.save&&validSave(profile.save)&&(!id||String(profile.characterId||saveCharacterId(profile.save))===id)&&(!selected||sameNick(profile.nickname||saveNick(profile.save),selected)))scoped.push(profile.save);
  const current=scoped.sort((a,b)=>localStamp(b)-localStamp(a))[0];
  if(current)return normalizeSave(current);
  if(selected||id)return null;
  const backup=LOCAL_KEYS.map(k=>parse(localStorage.getItem(k))).find(validSave);
  return backup?normalizeSave(backup,{nickname:'',characterId:''}):null;
}
function captureActiveLocal(){
 if(pendingProfile())return null;
 const nick=selectedNick(),live=W.P||(typeof P!=='undefined'?P:null);
 const game=$('game-wrap'),activeGame=!game||!W.getComputedStyle||W.getComputedStyle(game).display!=='none';
 if(!nick||!live||!activeGame)return bestLocal();
 const currentNick=String(live.meta?.characterNickname||live.characterNickname||'').trim(),currentId=String(live.meta?.characterId||live.playerCharacterId||'').trim(),wantedId=selectedCharacterId();
 if(currentId&&wantedId&&currentId!==wantedId)return null;
 if(currentNick&&!sameNick(currentNick,nick))return null;
 try{
   const old=bestLocal(),snapshotBefore=old?JSON.stringify(old):'';
   const hasPokemon=[...(Array.isArray(live.team)?live.team:[]),...(Array.isArray(live.box)?live.box:[])].some(validPokemon);
   const initializedEmpty=!!live.meta?.onlineCharacter&&!!currentNick&&sameNick(currentNick,nick);
   if(!hasPokemon&&!initializedEmpty)return old;
   live.meta=live.meta||{};
   live.meta.characterNickname=nick;
   if(wantedId)live.meta.characterId=wantedId;
   if(typeof W.psyV9WriteLocal==='function')W.psyV9WriteLocal();
   const official=LOCAL_KEYS.map(k=>parse(localStorage.getItem(k))).filter(s=>validSave(s)&&belongsToSelected(s)).sort((a,b)=>localStamp(b)-localStamp(a))[0];
   const current=normalizeSave({version:9,savedAt:Date.now(),player:live,map:{x:live.x,y:live.y,px:live.px,py:live.py}},{nickname:nick,characterId:wantedId});
   if(!current||!validSave(current))return old;
   if(official&&JSON.stringify(current)!==JSON.stringify(official)&&snapshotBefore){const key='psyWorldSave_backup_before_migration_'+Date.now();try{localStorage.setItem(key,JSON.stringify(official))}catch(_){}}
   if(!persistCanonicalLocal(current,{nickname:nick,characterId:wantedId}))return null;
   return current;
 }catch(e){console.warn('cloud active save capture',e);return null}
}
function localStamp(x){return Number(x?.savedAt||x?.time||x?.timestamp||0)}
function persistCanonicalLocal(save,{nickname=selectedNick(),characterId=selectedCharacterId()}={}){
 if(!validSave(save))return false;
 const snapshot=normalizeSave(save,{nickname,characterId});if(!snapshot)return false;
 const owner=userKey()||'local',key=profileStoreKey(owner,nickname,characterId),signature=saveSignature(snapshot);
 try{
   const prior=parse(key&&localStorage.getItem(key));
   const aliases=['psyWorldSave','psyWorldSave_v9'].map(storageKey=>parse(localStorage.getItem(storageKey)));
   const sameProfile=prior?.save&&validSave(prior.save)&&saveSignature(prior.save)===signature;
   const aliasesCurrent=aliases.every(alias=>alias&&validSave(alias)&&belongsToSelected(alias)&&saveSignature(alias)===signature);
   if(sameProfile&&aliasesCurrent){
     const meta=readSync(),baseline=meta.cloudSignature||'';
     if(signature!==baseline&&meta.localSignature!==signature)writeSync({characterNickname:nickname||selectedNick(),characterId:characterId||selectedCharacterId()||null,lastLocalAt:localStamp(snapshot)||Date.now(),localSignature:signature,pending:true});
     cloudPhase=typeof navigator!=='undefined'&&navigator.onLine===false?'offline':'local';
     return true;
   }
   if(prior?.save&&validSave(prior.save)&&saveSignature(prior.save)!==signature){
     const backupKey=key+'_backup';if(!localStorage.getItem(backupKey))localStorage.setItem(backupKey,JSON.stringify(prior));
   }
   if(key)localStorage.setItem(key,JSON.stringify({schemaVersion:1,ownerId:owner,characterId:characterId||saveCharacterId(snapshot)||null,nickname:nickname||saveNick(snapshot),savedAt:Date.now(),signature,save:snapshot}));
   for(const storageKey of ['psyWorldSave','psyWorldSave_v9'])localStorage.setItem(storageKey,JSON.stringify(snapshot));
   const backup=localStorage.getItem('psyWorldSave_backup');
   if(!backup||!validSave(parse(backup)))localStorage.setItem('psyWorldSave_backup',JSON.stringify(snapshot));
   const meta=readSync(),baseline=meta.cloudSignature||'';
   if(signature!==baseline)writeSync({characterNickname:nickname||selectedNick(),characterId:characterId||selectedCharacterId()||null,lastLocalAt:Date.now(),localSignature:signature,pending:true});
   cloudPhase=typeof navigator!=='undefined'&&navigator.onLine===false?'offline':'local';
   return true;
 }catch(e){console.warn('canonical local save',e);cloudPhase='error';lastUploadError=String(e?.message||e);return false}
}
function cloudStamp(g){return Date.parse(g?.updated_at||'')||Date.parse(g?.client_updated_at||'')||Number(g?.save?.savedAt||0)}
function backupCloudVersion(game,save){
 if(!save||!validSave(save))return false;
 const owner=userKey();if(!owner)return false;
 const nickname=String(game?.characterNickname||game?.nickname||selectedNick()),characterId=String(game?.characterId||saveCharacterId(save)||selectedCharacterId()||'');
 const base=profileStoreKey(owner,nickname,characterId);if(!base)return false;
 const revision=String(game?.updated_at||cloudStamp(game)||Date.now()).replace(/[^a-zA-Z0-9_-]/g,'_'),key=base+'_before_cloud_'+revision;
 try{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({source:'cloud',schemaVersion:1,ownerId:owner,characterId:characterId||null,nickname,savedAt:cloudStamp(game),cloudRevision:game?.updated_at||null,save:normalizeSave(save,{nickname,characterId})}));return true}catch(e){console.warn('cloud backup',e);return false}
}
function saveSignature(save){
  let snapshot=save||null;
  if(snapshot&&typeof snapshot==='object'&&!Array.isArray(snapshot)){snapshot={...snapshot};delete snapshot.savedAt;delete snapshot.migratedAt}
  const value=JSON.stringify(snapshot);let hash=2166136261;
  for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619)}
  return (hash>>>0).toString(36)+':'+value.length;
}
function conflictFingerprint(local,game){
  return [userKey().toLowerCase(),(selectedCharacterId()||selectedNick()).toLowerCase(),saveSignature(local),saveSignature(game?.save)].join('|');
}
function tokenUserKey(token=session?.access_token){try{const part=String(token||'').split('.')[1];if(!part)return'';const b=part.replace(/-/g,'+').replace(/_/g,'/');return String(JSON.parse(atob(b.padEnd(Math.ceil(b.length/4)*4,'='))).sub||'')}catch(_){return''}}
function userKey(){return String(session?.user?.id||session?.user?.email||session?.email||tokenUserKey()||'')}
function profileSyncKey(owner=userKey(),nick=selectedNick(),characterId=selectedCharacterId()){
 const identity=characterId?'id:'+characterId:String(nick).trim().toLowerCase()||'account';
 return owner?String(owner).toLowerCase()+'::'+identity:'';
}
function readSync(){
 const profiles=parse(localStorage.getItem(SYNC_PROFILES_KEY))||{};
 const idKey=profileSyncKey(userKey(),selectedNick(),selectedCharacterId()),nickKey=profileSyncKey(userKey(),selectedNick(),'');
 if(idKey&&profiles[idKey])return profiles[idKey];
 if(nickKey&&profiles[nickKey])return {...profiles[nickKey],characterId:profiles[nickKey].characterId||selectedCharacterId()||null};
 const oldId=String(userKey()).toLowerCase()+'::'+String(selectedNick()).trim().toLowerCase();
 if(profiles[oldId])return profiles[oldId];
 const old=parse(localStorage.getItem(SYNC_KEY))||{};
 return old.userKey===userKey()&&sameNick(old.characterNickname,selectedNick())?old:{};
}
function writeSync(patch){try{
 const owner=userKey(),nick=String(patch.characterNickname??selectedNick()).trim(),characterId=String(patch.characterId??selectedCharacterId()??'').trim(),old=readSync();
 const scoped=old.userKey===owner&&(characterId&&old.characterId?characterId===old.characterId:sameNick(old.characterNickname,nick))?old:{};
 const next={...scoped,...patch,userKey:owner,characterNickname:nick,characterId:characterId||null};
 localStorage.setItem(SYNC_KEY,JSON.stringify(next));
 const key=profileSyncKey(owner,nick,characterId);
 if(key){const profiles=parse(localStorage.getItem(SYNC_PROFILES_KEY))||{};profiles[key]=next;localStorage.setItem(SYNC_PROFILES_KEY,JSON.stringify(profiles))}
}catch(_){}try{renderCloudStatus()}catch(_){}}
function hydrateServerIdentity(state){
  if(state?.user?.id&&session?.access_token)saveSession({...session,user:state.user});
  const owner=String(state?.user?.id||''),meta=readSync(),nickname=String(meta.characterNickname||''),selected=String(localStorage.getItem(CHARACTER_KEY)||'');
  const verified=Array.isArray(state?.characters)&&state.characters.some(c=>String(c.nickname||'').toLowerCase()===nickname.toLowerCase());
  if(owner&&meta.resolved&&!meta.userKey&&nickname&&selected===nickname&&verified)writeSync({userKey:owner,characterNickname:nickname,resolved:true,saveStamp:meta.saveStamp,cloudStamp:meta.cloudStamp,cloudRevision:meta.cloudRevision||null});
}
function saveSession(s){session=s||null;try{session?localStorage.setItem(SESSION_KEY,JSON.stringify(session)):localStorage.removeItem(SESSION_KEY)}catch(_){}try{W.dispatchEvent(new CustomEvent('psyworld-online-session-changed',{detail:{authenticated:!!session?.access_token,source:'cloud-save'}}))}catch(_){}}
function readSession(){session=parse(localStorage.getItem(SESSION_KEY));return session}
function authHeaders(){return session?.access_token?{Authorization:'Bearer '+session.access_token}:{} }
async function api(path,opt={}){const r=await fetch(path,{...opt,headers:{'Content-Type':'application/json',...authHeaders(),...(opt.headers||{})}});let d={};try{d=await r.json()}catch(_){}if(!r.ok)throw new Error(d.error||d.message||('HTTP '+r.status));return d}
async function loadConfig(){if(config)return config;const r=await fetch('/api/config',{cache:'no-store'});config=await r.json();return config}
async function authFetch(path,opt={}){const c=await loadConfig();if(!c.onlineConfigured||!c.supabaseUrl||!c.supabaseAnonKey)throw new Error('online_not_configured');const r=await fetch(c.supabaseUrl+'/auth/v1/'+path,{...opt,headers:{apikey:c.supabaseAnonKey,'Content-Type':'application/json',...(opt.headers||{})}});let d={};try{d=await r.json()}catch(_){}if(!r.ok){const e=new Error(d.msg||d.error_description||d.message||d.error_code||d.code||d.error||('AUTH '+r.status));e.status=r.status;e.code=d.error_code||d.code||d.error||'';throw e}return d}
async function loadSupabaseSdk(){
 if(W.supabase?.createClient)return W.supabase;
 if(!oauthSdkPromise)oauthSdkPromise=new Promise((resolve,reject)=>{
  const existing=D.querySelector?.('script[data-psy-supabase-auth-sdk]');
  if(existing){existing.addEventListener('load',()=>{if(W.supabase?.createClient)resolve(W.supabase);else{oauthSdkPromise=null;reject(new Error('auth_sdk_unavailable'))}},{once:true});existing.addEventListener('error',()=>{oauthSdkPromise=null;reject(new Error('auth_sdk_unavailable'))},{once:true});return}
  const script=D.createElement('script');script.src='assets/vendor/supabase-js-2.117.2.js';script.async=true;script.dataset.psySupabaseAuthSdk='1';
  script.onload=()=>{if(W.supabase?.createClient)resolve(W.supabase);else{oauthSdkPromise=null;reject(new Error('auth_sdk_unavailable'))}};
  script.onerror=()=>{oauthSdkPromise=null;reject(new Error('auth_sdk_unavailable'))};D.head.appendChild(script);
 });
 return oauthSdkPromise;
}
async function getOAuthClient(){
 const c=await loadConfig();if(!c.onlineConfigured||!c.supabaseUrl||!c.supabaseAnonKey)throw new Error('online_not_configured');
 if(oauthClient)return oauthClient;
 const sdk=await loadSupabaseSdk();oauthClient=sdk.createClient(c.supabaseUrl,c.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,flowType:'pkce',storageKey:OAUTH_STORAGE_KEY}});
 return oauthClient;
}
function oauthRedirectTo(){
 const origin=String(W.location?.origin||'').replace(/\/$/,'');if(!origin)throw new Error('oauth_origin_missing');
 const path=String(W.location?.pathname||'/');return origin+(path.startsWith('/')?path:'/');
}
function oauthIntent(){return parse(localStorage.getItem(OAUTH_INTENT_KEY))||null}
function clearOAuthCallbackUrl(){
 try{const u=new URL(W.location.href);for(const key of ['code','error','error_code','error_description','state','scope'])u.searchParams.delete(key);u.hash='';history.replaceState(null,D.title,u.pathname+u.search)}catch(_){}
}
function clearOAuthFlow(){
 // Do not call auth.signOut here: the callback has just produced the session
 // that the game copied to SESSION_KEY. Supabase signOut reaches /logout and
 // revokes the refresh token that the game needs after the access token expires.
 for(const name of ['localStorage','sessionStorage'])try{
  const storage=W[name];if(!storage)continue;
  storage.removeItem(OAUTH_INTENT_KEY);storage.removeItem(OAUTH_STORAGE_KEY);storage.removeItem(OAUTH_STORAGE_KEY+'-code-verifier');
 }catch(_){}
 oauthClient=null;oauthSdkPromise=null;
}
function oauthDiagnosticCode(error,stage='start'){
 const value=[error?.code,error?.message,error?.error_description,error].filter(Boolean).join(' ').toLowerCase();
 if(/access_denied|user_cancel|cancelled|canceled/.test(value))return 'OAUTH_CANCELLED';
 if(/localstorage|sessionstorage|storage|quota|securityerror/.test(value))return 'OAUTH_STORAGE_UNAVAILABLE';
 if(/online_not_configured|supabaseurl|supabaseanonkey/.test(value))return 'OAUTH_CONFIG_UNAVAILABLE';
 if(/auth_sdk_unavailable|createclient/.test(value))return 'OAUTH_SDK_UNAVAILABLE';
 if(/redirect.*(not allowed|not permitted|allow.?list)|redirect_url_not_allowed|redirect_to_not_allowed/.test(value))return 'OAUTH_REDIRECT_NOT_ALLOWED';
 if(/manual.?link|identity.?linking/.test(value))return 'OAUTH_LINKING_DISABLED';
 if(/identity_already_exists|already linked/.test(value))return 'OAUTH_IDENTITY_ALREADY_LINKED';
 if(/unsupported[ _-]?provider|provider_not_found|provider.*disabled/.test(value))return 'OAUTH_PROVIDER_DISABLED';
 if(/session_not_found|refresh_token_not_found|invalid_refresh_token/.test(value))return 'OAUTH_SESSION_EXPIRED';
 if(/expired|code_verifier|flow_state|state_mismatch|invalid_grant|pkce/.test(value))return 'OAUTH_PKCE_FAILED';
 if(/network|fetch|failed to fetch|load failed|timeout/.test(value))return 'OAUTH_NETWORK_ERROR';
 return stage==='callback'?'OAUTH_CALLBACK_FAILED':'OAUTH_START_FAILED';
}
function oauthDiagnosticMessage(code){return ({
 OAUTH_CANCELLED:'Login cancelado. Nenhuma conta foi vinculada.',
 OAUTH_STORAGE_UNAVAILABLE:'Este navegador não conseguiu guardar a sessão temporária do login. Ative o armazenamento do site e tente novamente.',
 OAUTH_CONFIG_UNAVAILABLE:'A configuração online do jogo não está disponível neste preview.',
 OAUTH_SDK_UNAVAILABLE:'O componente de autenticação não carregou. Atualize a página e tente novamente.',
 OAUTH_REDIRECT_NOT_ALLOWED:'O Supabase recusou o endereço de retorno deste preview.',
 OAUTH_LINKING_DISABLED:'A vinculação ainda não está habilitada na configuração do Supabase.',
 OAUTH_IDENTITY_ALREADY_LINKED:'Este login social já está vinculado a outra conta. Nenhum progresso foi combinado.',
 OAUTH_PROVIDER_DISABLED:'Este provedor ainda não está habilitado no Supabase.',
 OAUTH_SESSION_EXPIRED:'A sessão expirou. Inicie o login novamente.',
 OAUTH_PKCE_FAILED:'A autorização expirou ou não corresponde a esta sessão do navegador. Inicie o login novamente.',
 OAUTH_NETWORK_ERROR:'A conexão falhou durante a autenticação. Confira a internet e tente novamente.',
 OAUTH_CALLBACK_FAILED:'O provedor retornou, mas o jogo não conseguiu validar a sessão.',
 OAUTH_START_FAILED:'O jogo não conseguiu iniciar a autenticação. Tente novamente.'
}[code]||'O jogo não conseguiu concluir a autenticação. Tente novamente.')}
function reportOAuthFailure(error,stage='start'){
 const code=oauthDiagnosticCode(error,stage);
 console.warn('[PSYWORLD OAuth]',code);
 signupMessage(oauthDiagnosticMessage(code)+' Código: '+code,'#fca5a5');
}
function hasOAuthCallbackData(){
 try{const q=new URLSearchParams(W.location.search||''),h=new URLSearchParams(String(W.location.hash||'').replace(/^#/,'').replace(/^\?/,'').replace(/\+/g,' '));return ['code','error','error_code','error_description'].some(k=>q.has(k)||h.has(k))}catch(_){return false}
}
function oauthCallbackMessage(error,intent){
 const value=String(error||'').toLowerCase();
 if(/access_denied|cancel|user_cancel/.test(value))return 'Login cancelado. Nenhuma conta foi vinculada.';
 if(/expired|code_verifier|flow_state|state_mismatch|invalid_grant/.test(value)||intent&&Date.now()-Number(intent.startedAt||0)>10*60*1000)return 'A autorização expirou. Inicie o login novamente.';
 if(/manual.?link|identity.?linking/.test(value))return 'A vinculação ainda não está habilitada na configuração do Supabase.';
 if(/provider.?disabled|unsupported[ _-]?provider|provider_not_found/.test(value))return 'Este provedor ainda não está habilitado no Supabase.';
 return 'O provedor não concluiu a autorização. Tente novamente.';
}
async function completeOAuthCallback(){
 const query=new URLSearchParams(String(W.location.search||'').replace(/^\?/,'').replace(/\+/g,' ')),hash=new URLSearchParams(String(W.location.hash||'').replace(/^#/,'').replace(/^\?/,'').replace(/\+/g,' '));
 const intent=oauthIntent(),error=query.get('error')||query.get('error_code')||query.get('error_description')||hash.get('error')||hash.get('error_code')||hash.get('error_description');
 if(error){const code=oauthDiagnosticCode(error,'callback');clearOAuthCallbackUrl();clearOAuthFlow();console.warn('[PSYWORLD OAuth]',code);signupMessage(oauthCallbackMessage(error,intent)+' Código: '+code,'#fbbf24');return false}
 const code=query.get('code');if(!code)return false;
 if(!intent||!['google','github'].includes(intent.provider)||!['login','link'].includes(intent.mode)){
  clearOAuthCallbackUrl();clearOAuthFlow();console.warn('[PSYWORLD OAuth]','OAUTH_FLOW_MISSING');signupMessage('A autorização não corresponde a uma tentativa iniciada neste navegador. Inicie o login novamente. Código: OAUTH_FLOW_MISSING','#fbbf24');return false;
 }
 if(Date.now()-Number(intent.startedAt||0)>10*60*1000){clearOAuthCallbackUrl();clearOAuthFlow();console.warn('[PSYWORLD OAuth]','OAUTH_PKCE_FAILED');signupMessage(oauthCallbackMessage('expired',intent)+' Código: OAUTH_PKCE_FAILED','#fbbf24');return false}
 try{
  const client=await getOAuthClient(),{data,error:exchangeError}=await client.auth.exchangeCodeForSession(code);
  if(exchangeError)throw exchangeError;
  const next= data?.session;
  if(!next?.access_token||!next?.user?.id)throw new Error('oauth_session_missing');
  if(intent.mode==='link'&&String(next.user.id)!==String(intent.userId||''))throw new Error('oauth_link_owner_changed');
  // Keep any pre-existing local profile out of startup while this account's
  // server-owned character list and save are being resolved after the redirect.
  if(intent.mode==='login')try{localStorage.setItem(EXIT_KEY,'1')}catch(_){}
  acceptAuth(next);clearOAuthCallbackUrl();await clearOAuthFlow();
  signupMessage(intent.mode==='link'?'✅ Provedor vinculado à conta autenticada.':'✅ Login social concluído.','#86efac');return true;
 }catch(e){
  const code=oauthDiagnosticCode(e,'callback');clearOAuthCallbackUrl();clearOAuthFlow();console.warn('[PSYWORLD OAuth]',code);
  signupMessage(e?.message==='oauth_link_owner_changed'?'A conta retornada pelo provedor não corresponde à sessão autenticada. A sessão anterior foi preservada. Código: OAUTH_LINK_OWNER_MISMATCH':oauthCallbackMessage(e?.code||e?.message,intent)+' Código: '+code,'#fca5a5');return false;
 }
}
async function refresh(){if(!session?.refresh_token)return false;try{const d=await authFetch('token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:session.refresh_token})});if(d.access_token){saveSession({...session,...d,expires_at:Date.now()+Number(d.expires_in||3600)*1000});return true}}catch(e){console.warn('cloud refresh',e)}return false}
async function ensureToken(){readSession();if(!session?.access_token)return false;if(Number(session.expires_at||0)>Date.now()+60000)return true;if(await refresh())return true;saveSession(null);return false}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function captureAuthHash(){
  try{
    if(!location.hash||!location.hash.includes('access_token='))return false;
    const q=new URLSearchParams(location.hash.slice(1)),access=q.get('access_token');if(!access)return false;
    const expiresIn=Number(q.get('expires_in')||3600),expiresAt=Number(q.get('expires_at')||0)*1000||Date.now()+expiresIn*1000;
    saveSession({access_token:access,refresh_token:q.get('refresh_token')||'',token_type:q.get('token_type')||'bearer',expires_in:expiresIn,expires_at:expiresAt});
    history.replaceState(null,D.title,location.pathname+location.search);
    toast('✅ Conta online conectada.',4200);
    return true;
  }catch(e){console.warn('auth hash',e);return false}
}
function ensureUI(){
  const box=$('login-box');if(!box||$('psy-online-box'))return;
  const wrap=D.createElement('div');wrap.id='psy-online-box';wrap.style.cssText='margin-top:12px;padding-top:12px;border-top:1px solid #28506f;text-align:left';
  wrap.innerHTML=`<button id="psy-online-toggle" type="button" style="width:100%;padding:12px;border:1px solid #22d3ee;border-radius:7px;background:linear-gradient(#12324a,#0b1d2c);color:#fff;font-weight:900;cursor:pointer">☁ CONTA ONLINE / CLOUD SAVE</button><div id="psy-online-form" style="display:none;margin-top:9px;padding:10px;background:#07131f;border:1px solid #244b66;border-radius:8px"><div style="font-size:11px;color:#9bdcf4;margin-bottom:8px">Entre com e-mail para usar o mesmo save em outros dispositivos. O save local continua sendo mantido como backup.</div><input id="psy-online-email" type="email" autocomplete="email" placeholder="E-mail" style="box-sizing:border-box;width:100%;padding:10px;margin-bottom:6px;border-radius:6px;border:1px solid #355b75;background:#06101a;color:#fff"><input id="psy-online-pass" type="password" autocomplete="current-password" placeholder="Senha (mín. 6 caracteres)" style="box-sizing:border-box;width:100%;padding:10px;margin-bottom:8px;border-radius:6px;border:1px solid #355b75;background:#06101a;color:#fff"><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><button id="psy-online-login" type="button" style="padding:10px;background:#075985;color:#fff;border:0;border-radius:6px;font-weight:900">ENTRAR</button><button id="psy-online-signup" type="button" style="padding:10px;background:#166534;color:#fff;border:0;border-radius:6px;font-weight:900">CRIAR CONTA</button></div><button id="psy-online-resend" type="button" style="display:none;margin-top:8px;width:100%;padding:10px;background:#854d0e;color:#fff;border:1px solid #fbbf24;border-radius:6px;font-weight:900">REENVIAR E-MAIL DE CONFIRMAÇÃO</button><div id="psy-online-social-actions" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px"><button id="psy-online-google" type="button" style="padding:10px;background:#fff;color:#1f2937;border:1px solid #cbd5e1;border-radius:6px;font-weight:900">GOOGLE</button><button id="psy-online-github" type="button" style="padding:10px;background:#161b22;color:#fff;border:1px solid #697386;border-radius:6px;font-weight:900">GITHUB</button></div><div id="psy-online-identities" style="display:none;margin-top:8px;padding:8px;border:1px solid #244b66;border-radius:6px;color:#bae6fd;font-size:10px"></div><div id="psy-online-status" role="status" aria-live="polite" style="margin-top:8px;font-size:10px;color:#94a3b8"></div></div>`;
  box.appendChild(wrap);$('psy-online-toggle').onclick=()=>{const f=$('psy-online-form');f.style.display=f.style.display==='none'?'block':'none';renderStatus()};$('psy-online-login').onclick=()=>login();$('psy-online-signup').onclick=()=>signup();$('psy-online-resend').onclick=()=>resendSignupConfirmation();$('psy-online-google').onclick=()=>socialLogin('google');$('psy-online-github').onclick=()=>socialLogin('github');
}
function cloudStatus(){
 const meta=readSync(),local=bestLocal(),signature=local?saveSignature(local):'',pending=!!(meta.pending||signature&&meta.cloudSignature&&signature!==meta.cloudSignature),offline=typeof navigator!=='undefined'&&navigator.onLine===false;
 let phase='SEM PERSONAGEM VINCULADO';
 if(!selectedNick()&&!selectedCharacterId())phase='SEM PERSONAGEM VINCULADO';
 else if(offline)phase='OFFLINE';
 else if(cloudPhase==='conflict'||meta.conflict)phase='CONFLITO DE SAVES';
 else if(cloudPhase==='syncing')phase='SINCRONIZANDO';
 else if(cloudPhase==='error'||meta.lastError)phase='ERRO AO SALVAR';
 else if(pending)phase=localTimer?'SALVANDO LOCALMENTE':'ALTERAÇÕES PENDENTES';
 else if(meta.resolved&&meta.cloudRevision&&meta.localSignature===meta.cloudSignature)phase='SINCRONIZADO';
 else if(local)phase='SALVANDO LOCALMENTE';
 else phase='ALTERAÇÕES PENDENTES';
 const localAt=Number(meta.lastLocalAt||localStamp(local)||0),cloudAt=Number(meta.lastUploadAt||meta.cloudStamp||0);
 return {phase,pending,localAt,cloudAt,error:lastUploadError||meta.lastError||'',nickname:selectedNick(),characterId:selectedCharacterId()};
}
function renderCloudStatus(){
 const status=cloudStatus(),stamp=n=>n?new Date(n).toLocaleTimeString('pt-BR'):'—',detail=`Local ${stamp(status.localAt)} · nuvem ${stamp(status.cloudAt)}${status.error?' · '+status.error:''}`;
 for(const id of ['psy-cloud-save-status-v24','psy-server-cloud-status-v24']){const el=$(id);if(!el)continue;el.textContent=status.phase+' • '+detail;el.dataset.phase=status.phase;el.style.color=status.phase==='SINCRONIZADO'?'#86efac':status.phase==='ERRO AO SALVAR'?'#fca5a5':status.phase==='CONFLITO DE SAVES'?'#fcd34d':status.phase==='OFFLINE'?'#cbd5e1':'#bae6fd'}
 try{W.dispatchEvent(new CustomEvent('psyworld-cloud-save-status',{detail:status}))}catch(_){}
 return status;
}
function renderStatus(preserveMessage=false){
 const signedIn=!!session?.access_token,s=$('psy-online-status');
 if(s&&!preserveMessage&&s.dataset.psyOauthDiagnostic!=='1')s.textContent=!signedIn?'Não conectado.':'☁ Conectado: '+String(session.user?.email||session.user?.user_metadata?.user_name||session.user?.user_metadata?.name||session.email||'conta online')+(syncEnabled?' • sincronização ativa':' • escolha do save pendente');
 const google=$('psy-online-google'),github=$('psy-online-github');
 if(google)google.textContent=signedIn?'VINCULAR GOOGLE':'ENTRAR COM GOOGLE';
 if(github)github.textContent=signedIn?'VINCULAR GITHUB':'ENTRAR COM GITHUB';
 const identities=$('psy-online-identities');if(identities)identities.style.display=signedIn?'block':'none';
 renderCloudStatus();
}
async function renderLinkedIdentities(){
 const box=$('psy-online-identities');if(!box)return;
 if(!session?.access_token){box.textContent='';box.style.display='none';return}
 try{
  const client=await getOAuthClient(),{error}=await client.auth.setSession({access_token:session.access_token,refresh_token:session.refresh_token||''});
  if(error)throw error;
  const result=await client.auth.getUserIdentities();if(result.error)throw result.error;
  const providers=[...new Set((result.data?.identities||[]).map(x=>String(x.provider||'')).filter(Boolean))];
  box.textContent='Métodos vinculados: '+(providers.length?providers.map(x=>x==='github'?'GitHub':x==='google'?'Google':x).join(', '):'nenhum método social');
 }catch(_){box.textContent='Não foi possível consultar os métodos vinculados agora.'}
}
function modal(title,body,buttons){let m=$('psy-cloud-modal');if(!m){m=D.createElement('div');m.id='psy-cloud-modal';m.style.cssText='display:none;position:fixed;inset:0;z-index:20000;background:#000c;align-items:center;justify-content:center;padding:16px';D.body.appendChild(m)}m.innerHTML=`<div style="max-width:540px;width:100%;background:#071421;border:2px solid #22d3ee;border-radius:14px;padding:18px;color:#fff;box-shadow:0 20px 80px #000"><h2 style="margin:0 0 10px;color:#67e8f9">${escapeHtml(title)}</h2><div style="font-size:12px;line-height:1.5;color:#dbeafe">${body}</div><div id="psy-cloud-actions" style="display:grid;gap:8px;margin-top:14px"></div></div>`;const a=$('psy-cloud-actions');buttons.forEach(b=>{const el=D.createElement('button');el.textContent=b.label;el.style.cssText='padding:11px;border:0;border-radius:8px;font-weight:900;cursor:pointer;background:'+(b.bg||'#164e63')+';color:#fff';el.onclick=async()=>{if(b.close!==false)m.style.display='none';await b.run?.()};a.appendChild(el)});m.style.display='flex'}
function signupMessage(text,color='#fbbf24'){const s=$('psy-online-status');if(s){s.textContent=text;s.style.color=color;if(/\bOAUTH_[A-Z_]+\b/.test(String(text)))s.dataset.psyOauthDiagnostic='1';else delete s.dataset.psyOauthDiagnostic}}
function setResendVisible(visible){const b=$('psy-online-resend');if(b)b.style.display=visible?'block':'none'}
function signupRedirectPath(endpoint){return endpoint+'?redirect_to='+encodeURIComponent(PROD_ORIGIN+'/')}
function authFailureMessage(e){if(e?.status===429||/rate.?limit|over_email_send_rate_limit|email_rate_limit_exceeded/i.test(String(e?.code||e?.message)))return 'Muitas solicitações em pouco tempo. Aguarde antes de tentar novamente.';if(/email_address_not_authorized/i.test(String(e?.code||e?.message)))return 'O serviço de e-mail do projeto não está autorizado a enviar para este endereço. A equipe precisa configurar SMTP para cadastros públicos.';if(/fetch|network|failed to|load failed/i.test(String(e?.message)))return 'Falha de conexão ao solicitar a confirmação. Confira sua internet e tente mais tarde.';return 'Não foi possível concluir a solicitação agora. Tente novamente mais tarde.'}
async function signup(){if(signupBusy)return;const email=String($('psy-online-email')?.value||'').trim().toLowerCase(),password=$('psy-online-pass')?.value||'';if(!email||password.length<6)return signupMessage('Informe um e-mail válido e uma senha com pelo menos 6 caracteres.','#fca5a5');signupBusy=true;const button=$('psy-online-signup');if(button)button.disabled=true;try{const d=await authFetch(signupRedirectPath('signup'),{method:'POST',body:JSON.stringify({email,password})});if(d.access_token){setResendVisible(false);signupMessage('✅ Conta autenticada.','#86efac');acceptAuth(d);await afterAuth()}else{setResendVisible(true);signupMessage('Solicitação recebida pelo Auth. Isso não confirma envio nem entrega do e-mail. Confira caixa de entrada e spam; se já possui conta, use ENTRAR.','#fbbf24')}}catch(e){setResendVisible(false);signupMessage(authFailureMessage(e),'#fca5a5')}finally{signupBusy=false;if(button)button.disabled=false}}
async function resendSignupConfirmation(){if(resendBusy)return;const email=String($('psy-online-email')?.value||'').trim().toLowerCase();if(!email)return signupMessage('Informe o mesmo e-mail usado no cadastro.','#fca5a5');let until=0;try{until=Number(localStorage.getItem(SIGNUP_RESEND_KEY)||0)}catch(_){}const left=until-Date.now();if(left>0)return signupMessage(`Aguarde ${Math.ceil(left/1000)} s antes de pedir outro envio.`,'#fbbf24');resendBusy=true;const button=$('psy-online-resend');if(button)button.disabled=true;try{await authFetch(signupRedirectPath('resend'),{method:'POST',body:JSON.stringify({type:'signup',email})});try{localStorage.setItem(SIGNUP_RESEND_KEY,String(Date.now()+60000))}catch(_){}signupMessage('Solicitação de reenvio aceita pelo Auth. Isso não comprova entrega; confira a caixa de entrada e spam.','#fbbf24')}catch(e){signupMessage(authFailureMessage(e),'#fca5a5')}finally{resendBusy=false;if(button)button.disabled=false}}
async function login(){const email=$('psy-online-email')?.value.trim(),password=$('psy-online-pass')?.value||'';if(!email||!password)return toast('Informe e-mail e senha.');try{const d=await authFetch('token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});acceptAuth(d);await afterAuth()}catch(e){toast('❌ Login: '+friendly(e.message),4500)}}
function oauthFailureMessage(e){
 const value=String(e?.code||e?.message||e||'').toLowerCase();
 if(/session_not_found|refresh_token_not_found|invalid_refresh_token/.test(value))return 'Sua sessão expirou. Entre novamente antes de vincular outro provedor.';
 if(/manual.?link|identity.?linking/.test(value))return 'A vinculação ainda não está habilitada na configuração do Supabase.';
 if(/unsupported[ _-]?provider|provider_not_found|provider.*disabled/.test(value))return 'Este provedor ainda não está habilitado no Supabase.';
 if(/identity_already_exists|already linked/.test(value))return 'Esse login social já está vinculado a outra conta. Nenhum progresso foi combinado.';
 if(/network|fetch|load failed/.test(value))return 'Falha de conexão ao iniciar o login. Confira a internet e tente novamente.';
 return 'Não foi possível iniciar o login social. Tente novamente.';
}
async function socialLogin(provider){
 if(!['google','github'].includes(provider)||oauthBusy)return;
 const previousStatus=$('psy-online-status');if(previousStatus)delete previousStatus.dataset.psyOauthDiagnostic;
 oauthBusy=true;const google=$('psy-online-google'),github=$('psy-online-github');if(google)google.disabled=true;if(github)github.disabled=true;
 try{
  readSession();let linking=!!session?.access_token;
  if(linking&&!await ensureToken()){signupMessage('Sua sessão expirou. Entre novamente antes de vincular outro provedor.','#fbbf24');return}
  const client=await getOAuthClient();
  if(linking){const {error}=await client.auth.setSession({access_token:session.access_token,refresh_token:session.refresh_token||''});if(error)throw error}
  const storageProbe='__psyworld_oauth_storage_probe__';
  try{localStorage.setItem(storageProbe,'1');if(localStorage.getItem(storageProbe)!=='1')throw new Error('oauth_storage_unavailable');localStorage.removeItem(storageProbe)}
  catch(_){try{localStorage.removeItem(storageProbe)}catch(__){};throw Object.assign(new Error('oauth_storage_unavailable'),{code:'oauth_storage_unavailable'})}
  const intent={provider,mode:linking?'link':'login',userId:linking?String(session?.user?.id||''):null,startedAt:Date.now()};
  localStorage.setItem(OAUTH_INTENT_KEY,JSON.stringify(intent));
  const options={redirectTo:oauthRedirectTo(),scopes:provider==='github'?'read:user user:email':provider==='google'?'openid':undefined};
  const {error}=linking?await client.auth.linkIdentity({provider,options}):await client.auth.signInWithOAuth({provider,options});
  if(error)throw error;
  signupMessage(linking?'Redirecionando para vincular '+(provider==='github'?'GitHub':'Google')+'…':'Redirecionando para '+(provider==='github'?'GitHub':'Google')+'…','#bae6fd');
 }catch(e){try{localStorage.removeItem(OAUTH_INTENT_KEY)}catch(_){}reportOAuthFailure(e,'start')}
 finally{oauthBusy=false;if(google)google.disabled=false;if(github)github.disabled=false}
}
function acceptAuth(d){saveSession({...d,user:d.user||session?.user,expires_at:Date.now()+Number(d.expires_in||3600)*1000});renderStatus()}
function friendly(s){return ({online_not_configured:'Servidor online ainda não configurado na Vercel.',invalid_credentials:'E-mail ou senha inválidos.',item_not_buyable:'Item indisponível na Poké Shop online.',insufficient_balance:'Gold insuficiente no servidor.',insufficient_item:'Itens insuficientes no servidor.',cloud_save_conflict:'Este personagem foi salvo em outro dispositivo. Compare as versões para decidir.',cloud_save_newer:'A nuvem contém uma versão mais recente; compare antes de substituir.',character_id_mismatch:'O identificador deste personagem não corresponde à conta selecionada.',character_not_found:'Não encontrei esse personagem nesta conta.'}[s]||String(s).replaceAll('_',' '))}
async function gameForSession(state){
 if(pendingProfile())return null;
 const nick=selectedNick(),id=selectedCharacterId();
 if(!nick&&!id)return state?.game_state||null;
 const match=Array.isArray(state?.characters)&&state.characters.some(c=>id?String(c.id||'')===id:sameNick(c.nickname,nick));
 if(!match)return null; // never compare another account's legacy mirror
 const result=await api('/api/player/character?'+(id?'character_id='+encodeURIComponent(id):'nickname='+encodeURIComponent(nick)));
 const c=result?.character;
 const save=normalizeSave(c?.save,{nickname:c?.nickname||nick,characterId:c?.id||id});
 return c&&validSave(save)?{save,nickname:c.nickname||nick,characterNickname:c.nickname||nick,characterId:c.id||id,updated_at:c.updated_at,client_updated_at:c.client_updated_at}:null;
}
async function afterAuth(){try{
 const state=await api('/api/player');hydrateServerIdentity(state);
 await renderLinkedIdentities();
 captureActiveLocal();
 const game=await gameForSession(state);
 if(game||bestLocal())await resolveConflict(game);else syncEnabled=false;
 renderStatus();
}catch(e){toast('❌ Cloud save: '+friendly(e.message),5000)}}
function showSaveChoice(local,cloud,game,fingerprint){
 const ls=localStamp(local),cs=cloudStamp(game);
 cloudPhase='conflict';writeSync({conflict:true,pending:true});
 modal('QUAL SAVE VOCÊ QUER USAR?',`Encontramos versões diferentes para este personagem.<br><br><b>📱 LOCAL:</b> ${new Date(ls||Date.now()).toLocaleString()}<br><b>☁ NUVEM:</b> ${new Date(cs||Date.now()).toLocaleString()}<br><br>Seus itens, PsyCoin e progresso não serão mesclados nem substituídos sem sua escolha.`,[
  {label:'📱 USAR LOCAL E ENVIAR PARA NUVEM',bg:'#166534',run:async()=>{
    backupCloudVersion(game,cloud);cloudPhase='idle';syncEnabled=true;writeSync({characterId:game?.characterId||selectedCharacterId()||null,conflict:false,cloudRevision:game?.updated_at||null,cloudStamp:cs,deferredFingerprint:fingerprint,pendingChoice:'local',resolved:false});
    if(!await upload(local,true,true)){syncEnabled=false;renderStatus()}
  }},
  {label:'☁ USAR SAVE DA NUVEM NESTE APARELHO',bg:'#075985',run:async()=>applyCloud(cloud,game,false)},
  {label:'CANCELAR — NÃO SINCRONIZAR AGORA',bg:'#475569',run:()=>{cloudPhase='conflict';syncEnabled=false;writeSync({conflict:true,pending:true,deferredFingerprint:fingerprint,deferredCloudRevision:game?.updated_at||null,deferredCloudSignature:saveSignature(cloud),pendingChoice:null,resolved:false});renderStatus()}}
 ]);
}
async function resolveConflict(game,{force=false}={}){
 if(pendingProfile()){syncEnabled=false;return}
 const local=captureActiveLocal()||bestLocal(),cloud=game?.save&&validSave(game.save)?normalizeSave(game.save,{nickname:game.characterNickname,characterId:game.characterId}):null;
 const previous=readSync();
 const fingerprint=local&&cloud?conflictFingerprint(local,game):'';
 const sameIdentity=selectedCharacterId()&&previous.characterId?selectedCharacterId()===previous.characterId:sameNick(previous.characterNickname,selectedNick());
 const sameProfile=previous.userKey===userKey()&&sameIdentity;
 const revisionScopeValid=!selectedNick()||previous.revisionScope==='character';
 if(!force&&sameProfile&&previous.deferredFingerprint){
   const legacyDeferred=previous.deferredCloudRevision===undefined&&previous.deferredCloudSignature===undefined;
   const sameRemote=legacyDeferred||(cloud?String(previous.deferredCloudRevision||'')===String(game?.updated_at||'')&&String(previous.deferredCloudSignature||'')===saveSignature(cloud):!game&&!previous.deferredCloudSignature);
   if(sameRemote){const latest=local?(cloud?fingerprint:saveSignature(local)+'|empty-cloud'):String(game?.updated_at||'empty-cloud')+'|empty-local';if(latest!==previous.deferredFingerprint)writeSync({deferredFingerprint:latest,deferredLocalSignature:local?saveSignature(local):null,pending:!!local,conflict:!!(local&&cloud)});syncEnabled=false;cloudPhase=local&&cloud?'conflict':'idle';renderStatus();return}
 }
 if(!force&&sameProfile&&revisionScopeValid&&fingerprint&&previous.resolvedFingerprint===fingerprint){syncEnabled=previous.resolved===true;renderStatus();return}
  if(local&&cloud){
    const ls=localStamp(local),cs=cloudStamp(game),meta=previous;
    if(saveSignature(local)===saveSignature(cloud)){
      syncEnabled=true;cloudPhase='synced';writeSync({resolved:true,conflict:false,pending:false,characterNickname:game?.characterNickname||selectedNick(),characterId:game?.characterId||selectedCharacterId()||null,cloudRevision:game?.updated_at||null,saveStamp:ls,cloudStamp:cs,localSignature:saveSignature(local),cloudSignature:saveSignature(cloud),resolvedFingerprint:fingerprint,deferredFingerprint:null,deferredCloudRevision:null,deferredCloudSignature:null,pendingChoice:null,postLoadAck:false,lastUploadAt:cs||Date.now(),revisionScope:'character'});renderStatus();return
    }
    if(meta.postLoadAck===true&&String(meta.cloudRevision||'')===String(game?.updated_at||'')){
      // Loading the cloud is an explicit user choice. One startup migration may
      // normalize the active runtime snapshot; stage it for CAS upload instead
      // of reopening that same choice. A changed server revision still conflicts.
      syncEnabled=true;cloudPhase='local';writeSync({postLoadAck:false,pending:true,resolved:true,conflict:false,localSignature:saveSignature(local),cloudSignature:saveSignature(cloud),saveStamp:ls,cloudStamp:cs,lastUploadAt:Date.now(),pendingChoice:'cloud'});
      queueSync();renderStatus();return
    }
    if(!force&&sameProfile&&revisionScopeValid&&meta.resolved===true){
      const localChanged=meta.localSignature?saveSignature(local)!==meta.localSignature:ls>Number(meta.saveStamp||0)+1500;
      const cloudChanged=meta.cloudSignature?saveSignature(cloud)!==meta.cloudSignature:
        (String(game?.updated_at||'')!==String(meta.cloudRevision||'')||cs>Number(meta.cloudStamp||0)+1500);
      if(!localChanged&&!cloudChanged){
        if(String(game?.updated_at||'')!==String(meta.cloudRevision||''))writeSync({cloudRevision:game?.updated_at||null,cloudStamp:cs});
        syncEnabled=true;renderStatus();return
      }
      if(localChanged&&!cloudChanged){
        backupCloudVersion(game,cloud);
        if(String(game?.updated_at||'')!==String(meta.cloudRevision||''))writeSync({cloudRevision:game?.updated_at||null,cloudStamp:cs});
        syncEnabled=true;queueSync();renderStatus();return
      }
      if(!localChanged&&cloudChanged){await applyCloud(cloud,game,true);return}
    }
    showSaveChoice(local,cloud,game,fingerprint);return
  }
  if(local){const fingerprint=saveSignature(local)+'|empty-cloud';modal('ATIVAR CLOUD SAVE?',`Seu save local foi encontrado. Deseja enviar uma cópia para sua conta online?<br><br>O save local continuará existindo como backup.`,[{label:'☁ ENVIAR CÓPIA PARA NUVEM',bg:'#166534',run:async()=>{syncEnabled=true;writeSync({characterId:selectedCharacterId()||null,conflict:false,deferredFingerprint:null,deferredCloudRevision:null,deferredCloudSignature:null,pendingChoice:'local',resolved:false});await upload(local,true,true)}},{label:'AGORA NÃO',bg:'#475569',run:()=>{syncEnabled=false;writeSync({conflict:false,deferredFingerprint:fingerprint,deferredCloudRevision:null,deferredCloudSignature:null,pendingChoice:null,resolved:false});renderStatus()}}]);return}
  if(cloud){const fingerprint='empty-local|'+String(game?.updated_at||saveSignature(cloud));modal('SAVE NA NUVEM ENCONTRADO',`Existe um progresso salvo para este personagem. Deseja carregá-lo neste aparelho?`,[{label:'☁ CARREGAR SAVE DA NUVEM',bg:'#075985',run:async()=>applyCloud(cloud,game,false)},{label:'AGORA NÃO',bg:'#475569',run:()=>{syncEnabled=false;writeSync({conflict:false,deferredFingerprint:fingerprint,deferredCloudRevision:game?.updated_at||null,deferredCloudSignature:saveSignature(cloud),resolved:false});renderStatus()}}]);return}
  syncEnabled=true;writeSync({resolved:true,deferredFingerprint:null,saveStamp:0,cloudStamp:0});toast('☁ Conta conectada. Seu primeiro save será enviado automaticamente.',4000);renderStatus()
}
function selectedCharacterNickname(save){
 const p=save?.player||{};
 const explicit=String(p.meta?.characterNickname||p.characterNickname||'').trim();
 if(explicit)return explicit;
 const selected=String(readSync().characterNickname||localStorage.getItem(CHARACTER_KEY)||'').trim();
 return selected&&sameNick(saveNick(save),selected)?selected:'';
}
function reconcileClientAfterUpload(sent,response){
 const grant=response?.server_grant;
 const needsGrant=grant?.id&&sent?.player?.meta?.halloweenTestGrantV1?.id!==grant.id;
 const hasWallet=Number.isFinite(Number(response?.server_psycoin))&&response.server_psycoin!==null;
 if(!needsGrant&&!hasWallet)return;
 const key=selectedCharacterNickname(sent).toLowerCase();
 const apply=(p)=>{
  if(!p)return;
  p.meta=p.meta||{};p.inventory=p.inventory||{};
  if(needsGrant){p.meta.halloweenTestGrantV1=grant;p.inventory['Doce de Halloween']=Number(response.server_inventory_candy)||0}
  if(hasWallet)p.psycoin=Number(response.server_psycoin);
 };
 for(const storageKey of LOCAL_KEYS){
  const stored=parse(localStorage.getItem(storageKey));
  if(!stored?.player)continue;
  const localKey=String(stored.player.meta?.characterNickname||stored.player.characterNickname||'').toLowerCase();
  if(key&&localKey!==key)continue;
  if(!key&&Number(stored.savedAt||0)!==Number(sent.savedAt||0))continue;
  apply(stored.player);
  try{localStorage.setItem(storageKey,JSON.stringify(stored))}catch(_){}
 }
 const live=W.P||(typeof P!=='undefined'?P:null);
 const liveKey=String(live?.meta?.characterNickname||live?.characterNickname||live?.name||'').toLowerCase();
 if(live&&key&&liveKey===key)apply(live);
 if(needsGrant)toast('🍬 Crédito de Halloween confirmado no servidor e restaurado neste aparelho.',4800);
}
async function uploadOnce(save,manual=false,markResolved=false){
 save=normalizeSave(save,{nickname:selectedNick(),characterId:selectedCharacterId()});
 if(!save||!validSave(save))return manual&&toast('❌ O snapshot deste personagem não passou na validação; nada foi enviado.');
 if(pendingProfile()||(selectedNick()&&!sameNick(saveNick(save),selectedNick()))||(selectedCharacterId()&&saveCharacterId(save)&&saveCharacterId(save)!==selectedCharacterId())){
   if(manual)toast('⚠ Selecione o personagem correto antes de sincronizar.',4200);
   return false;
 }
 if(!await ensureToken())return manual&&toast('❌ Entre na sua conta online primeiro.');
 try{
  cloudPhase='syncing';lastUploadError='';renderCloudStatus();
  const d=await api('/api/player/save',{method:'POST',body:JSON.stringify({
    save,character_nickname:selectedCharacterNickname(save)||null,character_id:selectedCharacterId()||saveCharacterId(save)||null,
    client_updated_at:new Date(localStamp(save)||Date.now()).toISOString(),
    base_cloud_updated_at:readSync().cloudRevision||null
  })});
  const revision=d.character?.updated_at||d.updated_at||null;
   const stamp=Date.parse(revision||'')||Date.now();
  const returnedId=String(d.character?.id||selectedCharacterId()||saveCharacterId(save)||'');
  if(returnedId){try{localStorage.setItem(CHARACTER_ID_KEY,returnedId)}catch(_){};save.player.meta=save.player.meta||{};save.player.meta.characterId=returnedId;const live=W.P||(typeof P!=='undefined'?P:null);if(live){live.meta=live.meta||{};live.meta.characterId=returnedId;live.playerCharacterId=returnedId}}
  reconcileClientAfterUpload(save,d);
  persistCanonicalLocal(save,{nickname:selectedNick(),characterId:returnedId});
  const synchronizedLocal=bestLocal()||save,signature=saveSignature(synchronizedLocal);
  writeSync({lastUploadAt:stamp,saveStamp:localStamp(synchronizedLocal),cloudStamp:stamp,
    characterId:returnedId||null,cloudRevision:revision,localSignature:signature,cloudSignature:signature,lastLocalAt:localStamp(synchronizedLocal),pending:false,lastError:null,
    revisionScope:selectedCharacterNickname(synchronizedLocal)?'character':'account',
    resolvedFingerprint:conflictFingerprint(synchronizedLocal,{save:synchronizedLocal,updated_at:revision}),deferredFingerprint:null,pendingChoice:null,
    resolved:markResolved||readSync().resolved===true});
  cloudPhase='synced';retryDelay=5000;lastUploadError='';renderCloudStatus();
  if(manual)syncEnabled=true;
  if(manual)toast('☁ Save confirmado no servidor. Itens e carteira protegidos.',3500);
  renderStatus();return true;
 }catch(e){
  console.warn('cloud upload',e);
  const conflict=/cloud_save_conflict|cloud_save_newer/.test(String(e?.message));
  lastUploadError=friendly(e.message);cloudPhase=conflict?'conflict':(typeof navigator!=='undefined'&&navigator.onLine===false)?'offline':'error';
  writeSync({pending:true,conflict,lastError:lastUploadError,lastAttemptAt:Date.now()});renderCloudStatus();
  if(conflict){syncEnabled=false;if(syncTimer){clearTimeout(syncTimer);syncTimer=0}
    toast('⚠ A versão deste personagem mudou na nuvem. Seus dados locais foram preservados; compare as versões para decidir.',6500);
    try{const state=await api('/api/player'),game=await gameForSession(state);if(game)await resolveConflict(game)}catch(refreshError){console.warn('cloud conflict refresh',refreshError)}
  }else if(manual){if(typeof navigator!=='undefined'&&navigator.onLine!==false){syncEnabled=true;retryDelay=5000;queueSync({retry:true})}toast('❌ Falha ao enviar save: '+friendly(e.message),4500)}
  renderStatus();return false;
 }
}
async function upload(save,manual=false,markResolved=false){
 const identity=selectedCharacterId()||selectedNick()||'account',key=userKey().toLowerCase()+'::'+identity.toLowerCase();
 if(uploadFlights.has(key))return uploadFlights.get(key);
 const task=uploadOnce(save,manual,markResolved);uploadFlights.set(key,task);
 try{return await task}finally{if(uploadFlights.get(key)===task)uploadFlights.delete(key)}
}
async function applyCloud(save,game,automatic=false){
  save=normalizeSave(save,{nickname:game?.characterNickname||selectedNick(),characterId:game?.characterId||selectedCharacterId()});
  if(!validSave(save))return toast('❌ Save da nuvem incompatível. O original foi preservado.');
  try{
    const selected=selectedNick(),cloudNick=String(game?.characterNickname||game?.nickname||selected).trim();
    const cloudId=String(game?.characterId||saveCharacterId(save)||selectedCharacterId()||'').trim();
    if(selected&&cloudNick&&!sameNick(selected,cloudNick)){toast('⚠ O save encontrado pertence a outro personagem. Nada foi alterado.',4500);return false}
    const snapshot=JSON.parse(JSON.stringify(save));
    if(selected){snapshot.player=snapshot.player||{};snapshot.player.meta=snapshot.player.meta||{};snapshot.player.meta.characterNickname=selected}
    if(cloudId){snapshot.player.meta=snapshot.player.meta||{};snapshot.player.meta.characterId=cloudId;localStorage.setItem(CHARACTER_ID_KEY,cloudId)}
    const raw=JSON.stringify(snapshot),old=bestLocal();
    if(old)localStorage.setItem('psyWorldSave_backup_before_cloud_'+Date.now(),JSON.stringify(old));
    if(!persistCanonicalLocal(snapshot,{nickname:cloudNick||selected,characterId:cloudId}))return toast('❌ Não consegui gravar uma cópia local; o save da nuvem foi mantido.',5000);
    if(syncTimer){clearTimeout(syncTimer);syncTimer=0}
    syncEnabled=false;
    const cs=cloudStamp(game)||Date.now();
    writeSync({resolved:true,deferredFingerprint:null,saveStamp:localStamp(snapshot),cloudStamp:cs,
      characterNickname:cloudNick||selected||undefined,characterId:cloudId||null,cloudRevision:game?.updated_at||null,localSignature:saveSignature(snapshot),cloudSignature:saveSignature(snapshot),pending:false,conflict:false,lastError:null,
      revisionScope:(cloudNick||selected)?'character':'account',
      resolvedFingerprint:conflictFingerprint(snapshot,{save,updated_at:game?.updated_at||null}),pendingChoice:'cloud',postLoadAck:true,lastDownloadAt:Date.now(),lastUploadAt:Date.now()});
    cloudPhase='synced';lastUploadError='';renderCloudStatus();
    if(!automatic)toast('☁ Save da nuvem restaurado. Recarregando...',2800);
    // The game's beforeunload handler autosaves in-memory state; suppress it for this reload.
    const suppressAutosave=()=>{};
    try{W.autoSave=suppressAutosave}catch(_){}
    try{autoSave=suppressAutosave}catch(_){}
    // The legacy runtime autosaves on page hide and beforeunload during navigation.
    try{D.addEventListener('visibilitychange',event=>{if(D.visibilityState==='hidden')try{event.stopImmediatePropagation()}catch(_){}},{capture:true,once:true})}catch(_){}
    try{W.addEventListener('beforeunload',event=>{try{event.stopImmediatePropagation()}catch(_){}},{capture:true,once:true})}catch(_){}
    location.reload();
  }catch(e){toast('❌ Não foi possível restaurar o save da nuvem.');}
}
async function loadNow(){
  if(!await ensureToken())return toast('❌ Entre na sua conta online primeiro.');
  try{
    const state=await api('/api/player'),game=await gameForSession(state),cloud=game?.save&&validSave(game.save)?game.save:null;
    if(!cloud)return toast('☁ Nenhum save válido encontrado na nuvem.');
    const when=new Date(cloudStamp(game)||Date.now()).toLocaleString();
    modal('CARREGAR SAVE DA NUVEM?',`O progresso salvo na nuvem (${when}) será aplicado neste aparelho.<br><br>Antes disso, o save local atual será guardado como backup.`,[
      {label:'☁ CARREGAR SAVE DA NUVEM',bg:'#075985',run:async()=>applyCloud(cloud,game,false)},
      {label:'CANCELAR',bg:'#475569'}
    ]);
  }catch(e){toast('❌ Falha ao carregar save da nuvem: '+friendly(e.message),4500)}
}
async function saveNow(){
 if(!await ensureToken())return toast('❌ Entre na sua conta online primeiro.');
 const local=captureActiveLocal();
 if(!local)return toast('❌ Não encontrei um save local válido deste personagem. O save da nuvem não foi alterado.',5000);
 return upload(local,true,true);
}
async function compareNow(){
 if(!await ensureToken())return toast('❌ Entre na sua conta online primeiro.');
 try{const state=await api('/api/player');hydrateServerIdentity(state);const game=await gameForSession(state);await resolveConflict(game,{force:true})}
 catch(e){toast('❌ Falha ao comparar saves: '+friendly(e.message),4500)}
}
function persistActiveSnapshot(){
 if(pendingProfile())return false;
 const game=$('game-wrap');if(game&&W.getComputedStyle&&W.getComputedStyle(game).display==='none')return false;
 cloudPhase='local';localTimer=1;renderCloudStatus();
 const save=captureActiveLocal();localTimer=0;
 if(!save){renderCloudStatus();return false}
 const meta=readSync(),signature=saveSignature(save),dirty=signature!==String(meta.cloudSignature||'');
 if(dirty){if(signature!==String(meta.localSignature||''))writeSync({lastLocalAt:localStamp(save)||Date.now(),localSignature:signature,pending:true,lastError:null});if(syncEnabled)queueSync()}
 else{cloudPhase='synced';renderCloudStatus()}
 return true;
}
function scheduleLocalCapture(){if(localTimer)clearTimeout(localTimer);localTimer=setTimeout(()=>{localTimer=0;persistActiveSnapshot()},260)}
function queueSync({retry=false}={}){
 if(!syncEnabled||!session?.access_token)return;
 const meta=readSync(),save=bestLocal(),signature=save&&saveSignature(save);
 if(!save||!signature||signature===String(meta.cloudSignature||''))return;
 if(typeof navigator!=='undefined'&&navigator.onLine===false){cloudPhase='offline';writeSync({pending:true});renderCloudStatus();return}
 if(syncTimer)clearTimeout(syncTimer);
 const elapsed=Date.now()-Number(meta.lastUploadAt||0),minimum=Math.max(0,45000-elapsed),delay=retry?Math.max(retryDelay,minimum):Math.max(4000,minimum);
 syncTimer=setTimeout(async()=>{
   syncTimer=0;const latest=captureActiveLocal()||bestLocal(),baseline=readSync();
   if(!latest||saveSignature(latest)===String(baseline.cloudSignature||''))return;
   const ok=await upload(latest,false,false);
   if(!ok&&cloudPhase!=='conflict'&&!(typeof navigator!=='undefined'&&navigator.onLine===false)){retryDelay=Math.min(120000,retryDelay*2);queueSync({retry:true})}
 },delay);
}
function patchSave(){const old=W.autoSave;if(typeof old==='function'&&!old.__cloudV24){const f=function(){const r=old.apply(this,arguments);scheduleLocalCapture();return r};f.__cloudV24=true;f.__psyV24Original=old;W.autoSave=f;try{autoSave=f}catch(_){}}}
function startAutosave(){
 if(autosaveTimer)return;
 autosaveTimer=setInterval(()=>{patchSave();persistActiveSnapshot()},5000);
 W.addEventListener?.('online',()=>{if(cloudPhase==='offline'){cloudPhase='local';renderCloudStatus();queueSync({retry:true})}});
 W.addEventListener?.('pagehide',()=>{try{persistActiveSnapshot()}catch(_){}});
 D.addEventListener?.('visibilitychange',()=>{if(D.visibilityState==='hidden'){try{W.psyV9WriteLocal?.();persistActiveSnapshot()}catch(_){}}else{patchSave();persistActiveSnapshot();queueSync({retry:true})}});
}

function idem(prefix){try{return prefix+':'+crypto.randomUUID()}catch(_){return prefix+':'+Date.now()+':'+Math.random().toString(36).slice(2)}}
function onlineEconomyActive(){readSession();return !!session?.access_token}
async function economy(action,payload={}){
  if(!await ensureToken())throw new Error('Faça login primeiro.');
  return api('/api/economy?action='+encodeURIComponent(action),{method:'POST',body:JSON.stringify(payload)});
}
function applyEconomyState(d){
  const p=W.P;if(!p)return;
  if(d?.player&&Number.isFinite(Number(d.player.gold)))p.gold=Number(d.player.gold);
  if(Array.isArray(d?.inventory)){
    const inv={};for(const row of d.inventory){const q=Math.max(0,Number(row?.quantity||0));if(q>0)inv[String(row.item_key)]=q}
    for(const k of ['Doce de Halloween','Halloween Ball','Poção de Halloween','Incenso de Halloween','Egg de Halloween'])
      if(!(k in inv)&&Number(p.inventory?.[k])>0)inv[k]=Math.floor(Number(p.inventory[k]));
    p.inventory=inv;
  }
  try{W.updateHUD?.()}catch(_){}
  try{const wallet=$('shop-wallet-gold');if(wallet)wallet.textContent=Number(p.gold||0).toLocaleString('pt-BR')}catch(_){}
}
async function runEconomy(action,payload,success){
  if(economyBusy)return toast('⏳ Aguarde a operação anterior.');
  economyBusy=true;
  try{const d=await economy(action,payload);applyEconomyState(d);try{W.autoSave?.()}catch(_){}success?.(d);return d}
  catch(e){console.warn('online economy',action,e);toast('❌ Servidor: '+friendly(e.message),4200);return null}
  finally{economyBusy=false}
}
function installEconomyHooks(){
  const curBuy=W.buyMulti;
  if(typeof curBuy==='function'&&!curBuy.__psyEconomyV25){
    const old=curBuy;
    const f=async function(){
      if(!onlineEconomyActive())return old.apply(this,arguments);
      const card=D.querySelector('#shop-grid .psy-shop-card.selected'),name=card?.querySelector('.psy-item-name')?.textContent?.trim();
      if(!name)return toast('Selecione um item.');
      const qty=Math.max(1,Math.min(99,parseInt($('shop-qty')?.value)||1));
      if(typeof W.confirm==='function'&&!W.confirm(`Confirmar compra online?\n\n${qty}x ${name}\n\nO preço e o saldo serão validados pelo servidor.`))return;
      return runEconomy('shop-buy',{item:name,qty,idempotency_key:idem('shop-buy')},()=>{try{W.questProgress?.('buy',qty)}catch(_){}try{W.openShop?.()}catch(_){}toast(`✅ Compra confirmada pelo servidor: ${qty}x ${name}`,2600)});
    };f.__psyEconomyV25=true;f.__offlineOriginal=old;W.buyMulti=f;try{buyMulti=f}catch(_){}
  }
  const curCraft=W.psyCraftElementBall;
  if(typeof curCraft==='function'&&!curCraft.__psyEconomyV25){
    const old=curCraft;
    const f=async function(type){
      if(!onlineEconomyActive())return old.apply(this,arguments);
      const el=String(type||'').trim().toLowerCase();if(!el)return;
      return runEconomy('craft',{element:el,idempotency_key:idem('craft')},()=>{try{W.renderCraft5?.()}catch(_){}toast('✅ Ball elemental fabricada e validada pelo servidor.',2600)});
    };f.__psyEconomyV25=true;f.__offlineOriginal=old;W.psyCraftElementBall=f;
  }
  const curSell=W.psySellStone;
  if(typeof curSell==='function'&&!curSell.__psyEconomyV25){
    const old=curSell;
    const f=async function(name,qty=1){
      if(!onlineEconomyActive())return old.apply(this,arguments);
      const q=Math.max(1,Math.min(100,Number(qty)||1));
      return runEconomy('shop-sell',{item:String(name||''),qty:q,idempotency_key:idem('shop-sell')},()=>{try{W.openShop?.()}catch(_){}toast(`💰 Venda confirmada pelo servidor: ${q}x ${name}`,2600)});
    };f.__psyEconomyV25=true;f.__offlineOriginal=old;W.psySellStone=f;
  }
}

function loadAudioSystem(){
  if(W.psyAudio||D.querySelector('script[data-psy-audio-v24]'))return;
  const s=D.createElement('script');s.src='core/audio.js?build=AUDIO_V24_20260902';s.async=false;s.dataset.psyAudioV24='1';s.onload=()=>console.log('🔊 Audio V1 carregado no bootstrap online');s.onerror=()=>console.warn('Falha ao carregar core/audio.js');D.head.appendChild(s);
}
function installFastDrag(){
  const b=$('fastEncounterBtn');if(!b||b.dataset.psyDragV24)return;b.dataset.psyDragV24='1';
  b.style.setProperty('position','fixed','important');b.style.setProperty('z-index','1000100','important');b.style.touchAction='none';
  const saved=parse(localStorage.getItem(FAST_POS_KEY));if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y)){b.style.left=Math.max(4,Math.min(innerWidth-b.offsetWidth-4,saved.x))+'px';b.style.top=Math.max(4,Math.min(innerHeight-b.offsetHeight-4,saved.y))+'px';b.style.right='auto'}
  let pid=null,sx=0,sy=0,ox=0,oy=0,moved=false,suppressUntil=0;
  b.addEventListener('pointerdown',e=>{pid=e.pointerId;sx=e.clientX;sy=e.clientY;const r=b.getBoundingClientRect();ox=r.left;oy=r.top;moved=false;try{b.setPointerCapture(pid)}catch(_){}},{passive:true});
  b.addEventListener('pointermove',e=>{if(e.pointerId!==pid)return;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.hypot(dx,dy)>4)moved=true;if(!moved)return;const x=Math.max(4,Math.min(innerWidth-b.offsetWidth-4,ox+dx)),y=Math.max(4,Math.min(innerHeight-b.offsetHeight-4,oy+dy));b.style.left=x+'px';b.style.top=y+'px';b.style.right='auto';},{passive:true});
  const up=e=>{if(e.pointerId!==pid)return;pid=null;if(moved){const r=b.getBoundingClientRect();try{localStorage.setItem(FAST_POS_KEY,JSON.stringify({x:r.left,y:r.top}))}catch(_){}suppressUntil=Date.now()+400}};b.addEventListener('pointerup',up,{passive:true});b.addEventListener('pointercancel',up,{passive:true});
  b.addEventListener('click',e=>{if(Date.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation()}},true);
}
function styleMenu(){
  const menu=$('menu');if(!menu)return;
  const buttons=[...menu.querySelectorAll('button')],afk=buttons.find(b=>/EXPEDIÇÃO AFK/i.test(b.textContent||''));
  const dl=menu.querySelector('[data-psy-mode-manager]');if(dl&&afk&&afk.parentElement===dl.parentElement&&afk.nextElementSibling!==dl)afk.insertAdjacentElement('afterend',dl);
  if(dl){dl.style.width='100%';dl.style.margin='0';dl.style.padding='12px';dl.style.boxSizing='border-box'}
  const audio=$('psy-audio-open');
  if(audio){
    const grid=menu.querySelector('.psy-main-grid')||afk?.parentElement;
    if(grid&&audio.parentElement!==grid)grid.appendChild(audio);
    audio.style.width='100%';audio.style.margin='0';audio.style.padding='12px';audio.style.boxSizing='border-box';audio.style.minHeight='44px';
  }
  let cloud=$('psy-cloud-menu-actions');
  if(!cloud){
    cloud=D.createElement('div');cloud.id='psy-cloud-menu-actions';cloud.style.cssText='width:min(700px,90%);margin:8px auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;';
    cloud.style.gridTemplateColumns='repeat(auto-fit,minmax(140px,1fr))';
    cloud.innerHTML='<button id="psy-cloud-save-now" type="button" style="padding:11px;border:1px solid #34d399;border-radius:8px;background:#166534;color:#fff;font-weight:900">☁ SALVAR NA NUVEM</button><button id="psy-cloud-load-now" type="button" style="padding:11px;border:1px solid #38bdf8;border-radius:8px;background:#075985;color:#fff;font-weight:900">☁ CARREGAR DA NUVEM</button><button id="psy-cloud-compare-now" type="button" style="padding:11px;border:1px solid #fbbf24;border-radius:8px;background:#854d0e;color:#fff;font-weight:900">⚖ COMPARAR SAVES</button>';
    const locals=buttons.find(b=>/BAIXAR SAVE\.PSY/i.test(b.textContent||''))?.parentElement; if(locals&&locals.parentElement===menu)locals.insertAdjacentElement('afterend',cloud);else menu.appendChild(cloud);
    $('#psy-cloud-save-now').onclick=()=>W.psyCloudV23?.saveNow();$('#psy-cloud-load-now').onclick=()=>W.psyCloudV23?.loadNow();$('#psy-cloud-compare-now').onclick=()=>W.psyCloudV23?.compareNow();
  }
  let cloudStatusNode=$('psy-cloud-save-status-v24');
  if(!cloudStatusNode){cloudStatusNode=D.createElement('div');cloudStatusNode.id='psy-cloud-save-status-v24';cloudStatusNode.style.cssText='grid-column:1/-1;padding:6px 8px;border:1px solid #244b66;border-radius:6px;background:#07131f;color:#bae6fd;font-size:9px;text-align:center';cloud.appendChild(cloudStatusNode)}
  cloud.style.display=session?.access_token?'grid':'none';
  renderCloudStatus();
}
function installGlobalUI(){installFastDrag();styleMenu();loadAudioSystem();installEconomyHooks()}
async function bootstrap(){ensureUI();const callbackData=hasOAuthCallbackData(),callbackComplete=await completeOAuthCallback();captureAuthHash();readSession();renderStatus(callbackData&&!callbackComplete);try{await loadConfig()}catch(e){console.warn('online config',e);installGlobalUI();startAutosave();return}if(config?.onlineConfigured&&await ensureToken()){renderStatus(callbackData&&!callbackComplete);try{const state=await api('/api/player');hydrateServerIdentity(state);await renderLinkedIdentities();captureActiveLocal();const game=await gameForSession(state);if(game||bestLocal())await resolveConflict(game);else syncEnabled=false}catch(e){console.warn('cloud bootstrap',e)}}patchSave();installGlobalUI();startAutosave();setInterval(()=>{patchSave();installGlobalUI();renderCloudStatus();if(syncEnabled&&session?.access_token)queueSync()},15000)}
W.psyCloudV23={login,signup,resendSignupConfirmation,loginWithGoogle:()=>socialLogin('google'),loginWithGithub:()=>socialLogin('github'),completeOAuthCallback,logout:async()=>{try{if(session?.access_token)await authFetch('logout',{method:'POST',headers:{Authorization:'Bearer '+session.access_token}})}catch(_){}saveSession(null);syncEnabled=false;cloudPhase='idle';renderStatus();await renderLinkedIdentities();styleMenu();toast('Conta online desconectada. O save local foi mantido.')},uploadNow:saveNow,saveNow,loadNow,compareNow,economy,bestLocal,captureActiveLocal,validSave,migrateSave:normalizeSave,status:cloudStatus,renderStatus:renderCloudStatus};
D.readyState==='loading'?D.addEventListener('DOMContentLoaded',()=>setTimeout(bootstrap,80)):setTimeout(bootstrap,80);D.addEventListener('visibilitychange',()=>{if(D.visibilityState==='hidden')queueSync()});
})(window,document);
