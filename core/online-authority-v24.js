(function(W,D){
'use strict';
const SESSION_KEY='psyworld_online_session_v23';
const IMPORT_KEY='psyworld_authority_import_v24';
let state=null,busy=false,lastUser='';
const parse=s=>{try{return s?JSON.parse(s):null}catch(_){return null}};
const session=()=>parse(localStorage.getItem(SESSION_KEY));
const token=()=>session()?.access_token||'';
const authHeaders=()=>token()?{Authorization:'Bearer '+token()}:{};
function toast(msg,ms=3500){try{W.notif?.(msg,ms)}catch(_){console.log(msg)}}
function validSave(x){const p=x?.player||x;return !!(p&&Array.isArray(p.team)&&p.team.length)}
function bestLocal(){return ['psyWorldSave','psyWorldSave_v9','psyWorldSave_backup'].map(k=>parse(localStorage.getItem(k))).filter(validSave).sort((a,b)=>Number(b.savedAt||0)-Number(a.savedAt||0))[0]||null}
async function api(path,opt={}){const r=await fetch(path,{...opt,headers:{'Content-Type':'application/json',...authHeaders(),...(opt.headers||{})}});let d={};try{d=await r.json()}catch(_){}if(!r.ok)throw new Error(d.error||d.message||('HTTP '+r.status));return d}
function userKey(){const s=session();return String(s?.user?.id||s?.user?.email||s?.email||'')}
function importedForUser(){const m=parse(localStorage.getItem(IMPORT_KEY));return !!(m&&m.userKey===userKey()&&m.done)}
function markImported(){try{localStorage.setItem(IMPORT_KEY,JSON.stringify({done:true,userKey:userKey(),at:Date.now()}))}catch(_){}}
function inventoryObject(rows){const o={};for(const r of rows||[])if(r?.item_key)o[r.item_key]=Number(r.quantity||0);return o}
function monFromRow(r){const p={...(r?.data||{})};p.pokemon_uid=r.pokemon_uid;p.id=Number(r.species_id||p.id||1);p.level=Number(r.level||p.level||1);p.xp=Number(r.xp||p.xp||0);p.shiny=!!r.shiny;p.tier=r.tier||p.tier||'E';p.resets=Number(r.resets||p.resets||0);if(r.mega_form)p.megaForm=r.mega_form;if(typeof p.rarity==='object')p.rarity={...p.rarity,n:r.rarity||p.rarity.n};else p.rarity={n:r.rarity||p.rarity||'Lixo'};return p}
function applyState(s,{reload=false}={}){
  if(!s?.player)return false;state=s;
  const p=W.P;if(!p)return true;
  p.gold=Number(s.player.gold||0);p.diamonds=Number(s.player.diamonds||0);
  if('psyCoin' in p||Number(s.player.psycoin||0))p.psyCoin=Number(s.player.psycoin||0);
  p.trainerLevel=Number(s.player.trainer_level||p.trainerLevel||1);p.trainerXp=Number(s.player.trainer_xp||p.trainerXp||0);
  p.inventory=inventoryObject(s.inventory);
  const rows=(s.pokemon||[]).filter(x=>!x.locked_reason);const team=[],box=[];
  for(const r of rows){const m=monFromRow(r),g=m.__online_group||r?.data?.__online_group||'box';if(g==='team')team.push(m);else box.push(m)}
  team.sort((a,b)=>Number(a.__online_order||0)-Number(b.__online_order||0));box.sort((a,b)=>Number(a.__online_order||0)-Number(b.__online_order||0));
  if(team.length)p.team=team;if(rows.length)p.box=box;
  try{W.updateHUD?.();W.renderTeam?.();W.renderBag?.();W.autoSave?.()}catch(_){ }
  if(reload)setTimeout(()=>location.reload(),350);
  return true;
}
async function fetchState(){if(!token())return null;const d=await api('/api/authority?action=state');state=d;render();return d}
async function ensureImported(){
  if(busy||!token())return;busy=true;
  try{
    let s=await fetchState();
    if(Number(s?.player?.authority_version||0)>=1){markImported();applyState(s);return}
    const save=bestLocal();if(!save)return;
    toast('☁ Preparando seu progresso para o modo online...',4200);
    const d=await api('/api/authority?action=import',{method:'POST',body:JSON.stringify({save})});
    markImported();state=d.state;applyState(state);toast('✅ Progresso migrado para o servidor com segurança.',5000);
  }catch(e){
    console.warn('authority import',e);
    if(/already completed/i.test(String(e.message))){markImported();try{applyState(await fetchState())}catch(_){}}
    else toast('⚠️ Modo online: '+String(e.message).replaceAll('_',' '),5000);
  }finally{busy=false;render()}
}
async function economy(action,body){
  if(!token())throw new Error('Entre na conta online primeiro.');
  const d=await api('/api/economy?action='+encodeURIComponent(action),{method:'POST',body:JSON.stringify({...body,idempotency_key:crypto.randomUUID()})});
  await refreshFromServer();return d;
}
async function refreshFromServer(){const s=await fetchState();applyState(s);return s}
function ensureMenu(){
  const menu=D.getElementById('menu');if(!menu)return;let box=D.getElementById('psy-authority-v24');
  if(!box){box=D.createElement('div');box.id='psy-authority-v24';box.style.cssText='width:min(700px,90%);margin:8px auto;padding:10px;border:1px solid #0ea5e9;border-radius:10px;background:#071421;color:#dbeafe;font-size:11px;box-sizing:border-box';box.innerHTML='<div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>🌐 PSYWORLD ONLINE</b><span id="psy-authority-status">Aguardando login</span></div><div id="psy-authority-wallet" style="margin-top:6px;color:#94a3b8"></div><button id="psy-authority-refresh" type="button" style="margin-top:8px;width:100%;padding:8px;border:0;border-radius:7px;background:#075985;color:white;font-weight:900">↻ SINCRONIZAR COM SERVIDOR</button>';menu.appendChild(box);D.getElementById('psy-authority-refresh').onclick=async()=>{try{await refreshFromServer();toast('🌐 Estado online sincronizado.')}catch(e){toast('❌ '+e.message)}}}
  render();
}
function render(){
  const st=D.getElementById('psy-authority-status'),wa=D.getElementById('psy-authority-wallet');if(!st)return;
  if(!token()){st.textContent='OFFLINE';st.style.color='#fca5a5';if(wa)wa.textContent='Entre na conta online para ativar.';return}
  const av=Number(state?.player?.authority_version||0);st.textContent=av>=1?'SERVIDOR ATIVO':'IMPORTANDO';st.style.color=av>=1?'#86efac':'#fde68a';
  if(wa&&state?.player)wa.textContent=`Gold ${Number(state.player.gold||0).toLocaleString('pt-BR')} • Diamonds ${Number(state.player.diamonds||0).toLocaleString('pt-BR')} • PsyCoin ${Number(state.player.psycoin||0).toLocaleString('pt-BR')} • ${state.inventory?.length||0} itens • ${state.pokemon?.length||0} Pokémon`;
}
function bootstrap(){ensureMenu();if(token())ensureImported();setInterval(()=>{ensureMenu();const u=userKey();if(token()&&u!==lastUser){lastUser=u;ensureImported()}},3500)}
W.psyOnlineV24={getState:()=>state,fetchState,refreshFromServer,ensureImported,economy,shopBuy:(item,qty)=>economy('shop-buy',{item,qty}),shopSell:(item,qty)=>economy('shop-sell',{item,qty}),craftElementBall:element=>economy('craft',{element})};
D.readyState==='loading'?D.addEventListener('DOMContentLoaded',()=>setTimeout(bootstrap,250)):setTimeout(bootstrap,250);
})(window,document);
