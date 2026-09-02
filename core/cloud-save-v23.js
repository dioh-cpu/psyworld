(function(W,D){
'use strict';
const SESSION_KEY='psyworld_online_session_v23';
const SYNC_KEY='psyworld_cloud_sync_v23';
const LOCAL_KEYS=['psyWorldSave','psyWorldSave_v9','psyWorldSave_backup'];
const PROD_ORIGIN='https://psyworld-murex.vercel.app';
const FAST_POS_KEY='psyworld_fast_encounter_pos_v24';
let config=null,session=null,syncEnabled=false,syncTimer=0;
const $=id=>D.getElementById(id);
function toast(msg,ms=3200){try{W.notif?.(msg,ms)}catch(_){console.log(msg)}}
function parse(s){try{return s?JSON.parse(s):null}catch(_){return null}}
function validSave(x){const p=x?.player||x;return !!(p&&Array.isArray(p.team)&&p.team.length&&p.team[0]?.id)}
function bestLocal(){return LOCAL_KEYS.map(k=>parse(localStorage.getItem(k))).filter(validSave).sort((a,b)=>Number(b.savedAt||0)-Number(a.savedAt||0))[0]||null}
function localStamp(x){return Number(x?.savedAt||0)}
function cloudStamp(g){return Math.max(Date.parse(g?.client_updated_at||'')||0,Date.parse(g?.updated_at||'')||0,Number(g?.save?.savedAt||0))}
function userKey(){return String(session?.user?.id||session?.user?.email||session?.email||'')}
function readSync(){return parse(localStorage.getItem(SYNC_KEY))||{}}
function writeSync(patch){try{const old=readSync();localStorage.setItem(SYNC_KEY,JSON.stringify({...old,...patch,userKey:userKey()}))}catch(_){}}
function saveSession(s){session=s||null;try{session?localStorage.setItem(SESSION_KEY,JSON.stringify(session)):localStorage.removeItem(SESSION_KEY)}catch(_){}}
function readSession(){session=parse(localStorage.getItem(SESSION_KEY));return session}
function authHeaders(){return session?.access_token?{Authorization:'Bearer '+session.access_token}:{} }
async function api(path,opt={}){const r=await fetch(path,{...opt,headers:{'Content-Type':'application/json',...authHeaders(),...(opt.headers||{})}});let d={};try{d=await r.json()}catch(_){}if(!r.ok)throw new Error(d.error||d.message||('HTTP '+r.status));return d}
async function loadConfig(){if(config)return config;const r=await fetch('/api/config',{cache:'no-store'});config=await r.json();return config}
async function authFetch(path,opt={}){const c=await loadConfig();if(!c.onlineConfigured)throw new Error('online_not_configured');const r=await fetch(c.supabaseUrl+'/auth/v1/'+path,{...opt,headers:{apikey:c.supabaseAnonKey,'Content-Type':'application/json',...(opt.headers||{})}});let d={};try{d=await r.json()}catch(_){}if(!r.ok)throw new Error(d.msg||d.error_description||d.message||d.error||('AUTH '+r.status));return d}
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
    toast('✅ E-mail confirmado. Conta online conectada.',4200);
    return true;
  }catch(e){console.warn('auth hash',e);return false}
}
function ensureUI(){
  const box=$('login-box');if(!box||$('psy-online-box'))return;
  const wrap=D.createElement('div');wrap.id='psy-online-box';wrap.style.cssText='margin-top:12px;padding-top:12px;border-top:1px solid #28506f;text-align:left';
  wrap.innerHTML=`<button id="psy-online-toggle" type="button" style="width:100%;padding:12px;border:1px solid #22d3ee;border-radius:7px;background:linear-gradient(#12324a,#0b1d2c);color:#fff;font-weight:900;cursor:pointer">☁ CONTA ONLINE / CLOUD SAVE</button><div id="psy-online-form" style="display:none;margin-top:9px;padding:10px;background:#07131f;border:1px solid #244b66;border-radius:8px"><div style="font-size:11px;color:#9bdcf4;margin-bottom:8px">Entre com e-mail para usar o mesmo save em outros dispositivos. O save local continua sendo mantido como backup.</div><input id="psy-online-email" type="email" autocomplete="email" placeholder="E-mail" style="box-sizing:border-box;width:100%;padding:10px;margin-bottom:6px;border-radius:6px;border:1px solid #355b75;background:#06101a;color:#fff"><input id="psy-online-pass" type="password" autocomplete="current-password" placeholder="Senha (mín. 6 caracteres)" style="box-sizing:border-box;width:100%;padding:10px;margin-bottom:8px;border-radius:6px;border:1px solid #355b75;background:#06101a;color:#fff"><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><button id="psy-online-login" type="button" style="padding:10px;background:#075985;color:#fff;border:0;border-radius:6px;font-weight:900">ENTRAR</button><button id="psy-online-signup" type="button" style="padding:10px;background:#166534;color:#fff;border:0;border-radius:6px;font-weight:900">CRIAR CONTA</button></div><div id="psy-online-status" style="margin-top:8px;font-size:10px;color:#94a3b8"></div></div>`;
  box.appendChild(wrap);$('psy-online-toggle').onclick=()=>{const f=$('psy-online-form');f.style.display=f.style.display==='none'?'block':'none';renderStatus()};$('psy-online-login').onclick=()=>login();$('psy-online-signup').onclick=()=>signup();
}
function renderStatus(){const s=$('psy-online-status');if(s)s.innerHTML=!session?.access_token?'Não conectado.':'☁ Conectado: '+escapeHtml(session.user?.email||session.email||'conta online')+(syncEnabled?' • sincronização ativa':' • aguardando escolha do save')}
function modal(title,body,buttons){let m=$('psy-cloud-modal');if(!m){m=D.createElement('div');m.id='psy-cloud-modal';m.style.cssText='display:none;position:fixed;inset:0;z-index:20000;background:#000c;align-items:center;justify-content:center;padding:16px';D.body.appendChild(m)}m.innerHTML=`<div style="max-width:540px;width:100%;background:#071421;border:2px solid #22d3ee;border-radius:14px;padding:18px;color:#fff;box-shadow:0 20px 80px #000"><h2 style="margin:0 0 10px;color:#67e8f9">${escapeHtml(title)}</h2><div style="font-size:12px;line-height:1.5;color:#dbeafe">${body}</div><div id="psy-cloud-actions" style="display:grid;gap:8px;margin-top:14px"></div></div>`;const a=$('psy-cloud-actions');buttons.forEach(b=>{const el=D.createElement('button');el.textContent=b.label;el.style.cssText='padding:11px;border:0;border-radius:8px;font-weight:900;cursor:pointer;background:'+(b.bg||'#164e63')+';color:#fff';el.onclick=async()=>{if(b.close!==false)m.style.display='none';await b.run?.()};a.appendChild(el)});m.style.display='flex'}
async function signup(){const email=$('psy-online-email')?.value.trim(),password=$('psy-online-pass')?.value||'';if(!email||password.length<6)return toast('Informe e-mail e senha de pelo menos 6 caracteres.');try{const d=await authFetch('signup',{method:'POST',body:JSON.stringify({email,password,options:{emailRedirectTo:PROD_ORIGIN+'/'}})});if(d.access_token){acceptAuth(d);await afterAuth()}else toast('📧 Conta criada. Confirme o e-mail e depois clique em ENTRAR.',5000)}catch(e){toast('❌ Cadastro: '+friendly(e.message),4500)}}
async function login(){const email=$('psy-online-email')?.value.trim(),password=$('psy-online-pass')?.value||'';if(!email||!password)return toast('Informe e-mail e senha.');try{const d=await authFetch('token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});acceptAuth(d);await afterAuth()}catch(e){toast('❌ Login: '+friendly(e.message),4500)}}
function acceptAuth(d){saveSession({...d,user:d.user||session?.user,expires_at:Date.now()+Number(d.expires_in||3600)*1000});renderStatus()}
function friendly(s){return ({online_not_configured:'Servidor online ainda não configurado na Vercel.',invalid_credentials:'E-mail ou senha inválidos.'}[s]||String(s).replaceAll('_',' '))}
async function afterAuth(){try{const state=await api('/api/player');await resolveConflict(state.game_state);renderStatus()}catch(e){toast('❌ Cloud save: '+friendly(e.message),5000)}}
async function resolveConflict(game){
  const local=bestLocal(),cloud=game?.save&&validSave(game.save)?game.save:null;
  if(local&&cloud){
    const ls=localStamp(local),cs=cloudStamp(game),meta=readSync(),sameUser=meta.userKey&&meta.userKey===userKey()&&meta.resolved;
    if(sameUser){
      const lastLocal=Number(meta.saveStamp||0),lastCloud=Number(meta.cloudStamp||0);
      const localChanged=ls>lastLocal+1500,cloudChanged=cs>lastCloud+1500;
      if(!localChanged&&!cloudChanged){syncEnabled=true;renderStatus();return}
      if(localChanged&&!cloudChanged){syncEnabled=true;queueSync();renderStatus();return}
      if(!localChanged&&cloudChanged){await applyCloud(cloud,game,true);return}
    }
    modal('QUAL SAVE VOCÊ QUER USAR?',`Encontramos um save neste aparelho e outro na nuvem.<br><br><b>📱 LOCAL:</b> ${new Date(ls||Date.now()).toLocaleString()}<br><b>☁ NUVEM:</b> ${new Date(cs||Date.now()).toLocaleString()}<br><br>Nenhum deles será apagado sem sua escolha.`,[
      {label:'📱 USAR LOCAL E ENVIAR PARA NUVEM',bg:'#166534',run:async()=>{syncEnabled=true;await upload(local,true,true)}},
      {label:'☁ USAR SAVE DA NUVEM NESTE APARELHO',bg:'#075985',run:async()=>applyCloud(cloud,game,false)},
      {label:'CANCELAR — NÃO SINCRONIZAR AGORA',bg:'#475569',run:()=>{syncEnabled=false;renderStatus()}}
    ]);return
  }
  if(local){modal('ATIVAR CLOUD SAVE?',`Seu save local foi encontrado. Deseja enviar uma cópia para sua conta online?<br><br>O save local continuará existindo como backup.`,[{label:'☁ ENVIAR CÓPIA PARA NUVEM',bg:'#166534',run:async()=>{syncEnabled=true;await upload(local,true,true)}},{label:'AGORA NÃO',bg:'#475569',run:()=>{syncEnabled=false;renderStatus()}}]);return}
  if(cloud){modal('SAVE NA NUVEM ENCONTRADO',`Existe um progresso salvo nesta conta. Deseja carregá-lo neste aparelho?`,[{label:'☁ CARREGAR SAVE DA NUVEM',bg:'#075985',run:async()=>applyCloud(cloud,game,false)},{label:'AGORA NÃO',bg:'#475569',run:()=>{syncEnabled=false;renderStatus()}}]);return}
  syncEnabled=true;writeSync({resolved:true,saveStamp:0,cloudStamp:0});toast('☁ Conta conectada. Seu primeiro save será enviado automaticamente.',4000);renderStatus()
}
async function upload(save,manual=false,markResolved=false){if(!save||!validSave(save))return manual&&toast('❌ Nenhum save local válido encontrado.');if(!await ensureToken())return manual&&toast('❌ Entre na sua conta online primeiro.');try{const d=await api('/api/player/save',{method:'POST',body:JSON.stringify({save,client_updated_at:new Date(Number(save.savedAt||Date.now())).toISOString()})});const serverStamp=Date.parse(d.updated_at||'')||Date.now();writeSync({lastUploadAt:serverStamp,saveStamp:localStamp(save),cloudStamp:serverStamp,resolved:markResolved||readSync().resolved===true});if(manual)toast('☁ Save local enviado para a nuvem.',3500);renderStatus();return true}catch(e){console.warn('cloud upload',e);if(manual)toast('❌ Falha ao enviar save: '+friendly(e.message),4500);return false}}
async function applyCloud(save,game,automatic=false){if(!validSave(save))return toast('❌ Save da nuvem inválido.');try{const raw=JSON.stringify(save),old=localStorage.getItem('psyWorldSave');if(old)localStorage.setItem('psyWorldSave_backup_before_cloud_'+Date.now(),old);localStorage.setItem('psyWorldSave',raw);localStorage.setItem('psyWorldSave_v9',raw);const cs=cloudStamp(game)||Date.now();writeSync({resolved:true,saveStamp:localStamp(save),cloudStamp:cs,lastDownloadAt:Date.now()});syncEnabled=true;if(!automatic)toast('☁ Save da nuvem restaurado. Recarregando...',2800);setTimeout(()=>location.reload(),automatic?150:900)}catch(e){toast('❌ Não foi possível restaurar o save da nuvem.')}}
async function loadNow(){
  if(!await ensureToken())return toast('❌ Entre na sua conta online primeiro.');
  try{
    const state=await api('/api/player'),game=state.game_state,cloud=game?.save&&validSave(game.save)?game.save:null;
    if(!cloud)return toast('☁ Nenhum save válido encontrado na nuvem.');
    const when=new Date(cloudStamp(game)||Date.now()).toLocaleString();
    modal('CARREGAR SAVE DA NUVEM?',`O progresso salvo na nuvem (${when}) será aplicado neste aparelho.<br><br>Antes disso, o save local atual será guardado como backup.`,[
      {label:'☁ CARREGAR SAVE DA NUVEM',bg:'#075985',run:async()=>applyCloud(cloud,game,false)},
      {label:'CANCELAR',bg:'#475569'}
    ]);
  }catch(e){toast('❌ Falha ao carregar save da nuvem: '+friendly(e.message),4500)}
}
function queueSync(){if(!syncEnabled||!session?.access_token)return;if(syncTimer)clearTimeout(syncTimer);syncTimer=setTimeout(()=>{syncTimer=0;const s=bestLocal();if(s)upload(s,false,false)},2500)}
function patchSave(){const old=W.autoSave;if(typeof old==='function'&&!old.__cloudV23){const f=function(){const r=old.apply(this,arguments);queueSync();return r};f.__cloudV23=true;W.autoSave=f;try{autoSave=f}catch(_){}}}
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
    cloud.innerHTML='<button id="psy-cloud-save-now" type="button" style="padding:11px;border:1px solid #34d399;border-radius:8px;background:#166534;color:#fff;font-weight:900">☁ SALVAR NA NUVEM</button><button id="psy-cloud-load-now" type="button" style="padding:11px;border:1px solid #38bdf8;border-radius:8px;background:#075985;color:#fff;font-weight:900">☁ CARREGAR DA NUVEM</button>';
    const locals=buttons.find(b=>/BAIXAR SAVE\.PSY/i.test(b.textContent||''))?.parentElement; if(locals&&locals.parentElement===menu)locals.insertAdjacentElement('afterend',cloud);else menu.appendChild(cloud);
    $('#psy-cloud-save-now').onclick=()=>W.psyCloudV23?.uploadNow();$('#psy-cloud-load-now').onclick=()=>W.psyCloudV23?.loadNow();
  }
  cloud.style.display=session?.access_token?'grid':'none';
}
function installGlobalUI(){installFastDrag();styleMenu();loadAudioSystem()}
async function bootstrap(){captureAuthHash();ensureUI();readSession();renderStatus();try{await loadConfig()}catch(e){console.warn('online config',e);installGlobalUI();return}if(config?.onlineConfigured&&await ensureToken()){renderStatus();try{const state=await api('/api/player');await resolveConflict(state.game_state)}catch(e){console.warn('cloud bootstrap',e)}}patchSave();installGlobalUI();setInterval(()=>{patchSave();installGlobalUI();if(syncEnabled&&session?.access_token){const s=bestLocal(),meta=readSync();if(s&&localStamp(s)>Number(meta?.saveStamp||0)+1500)queueSync()}},4000)}
W.psyCloudV23={login,signup,logout:async()=>{try{if(session?.access_token)await authFetch('logout',{method:'POST',headers:{Authorization:'Bearer '+session.access_token}})}catch(_){}saveSession(null);syncEnabled=false;renderStatus();styleMenu();toast('Conta online desconectada. O save local foi mantido.')},uploadNow:async()=>upload(bestLocal(),true,true),loadNow};
D.readyState==='loading'?D.addEventListener('DOMContentLoaded',()=>setTimeout(bootstrap,80)):setTimeout(bootstrap,80);D.addEventListener('visibilitychange',()=>{if(D.visibilityState==='hidden')queueSync()});
})(window,document);
