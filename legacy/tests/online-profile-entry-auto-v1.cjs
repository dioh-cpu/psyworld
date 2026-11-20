/* OAuth entry must only auto-load a server-owned, valid single character. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../core/online-profile-entry-v37.js'),'utf8');
const legacySource=fs.readFileSync(require.resolve('../core/legacy-runtime.js'),'utf8');
const KEYS={session:'psyworld_online_session_v23',selected:'psyworld_active_character_v38',id:'psyworld_active_character_id_v1',sync:'psyworld_cloud_sync_v23',pending:'psyworld_new_character_pending_v38',exit:'psyworld_local_profile_signed_out_v36',stash:'psyworld_local_profile_stash_v38'};

function node(id=''){
  let html='',buttons=null,retry=null;const n={id,value:'',textContent:'',dataset:{},style:{display:id==='screen-login'?'flex':'none'},attributes:{},children:[],onclick:null,
    appendChild(child){this.children.push(child);if(child.id)nodes.set(child.id,child);return child},
    setAttribute(k,v){this.attributes[k]=String(v)},addEventListener(k,fn){this['on'+k]=fn},
    set innerHTML(v){html=String(v);buttons=null},get innerHTML(){return html},
    querySelectorAll(selector){if(selector==='[data-psy-character-id]'){if(!buttons)buttons=[...html.matchAll(/<button[^>]*data-psy-character-id="([^"]+)"[^>]*data-psy-char="([^"]+)"[^>]*aria-pressed="([^"]+)"/g)].map(m=>{const b=node();b.dataset.psyCharacterId=m[1];b.dataset.psyChar=m[2];b.attributes['aria-pressed']=m[3];return b});return buttons}return[]},
    querySelector(selector){if(selector==='[data-psy-retry]'&&/data-psy-retry/.test(html)){if(!retry)retry=node();return retry}return null}
  };return n;
}
const validSave={version:9,savedAt:20,map:{x:10,y:20},player:{name:'Cloud Trainer',meta:{characterNickname:'Cloud Trainer'},team:[{id:25,name:'Pikachu',level:8}],box:[]}};
function harness({characters=[{id:'char-1',nickname:'Cloud Trainer'}],owner='user-1',responseOwner=owner,characterSave=validSave,failState=false,failCharacter=false,localSave=null,holdState=false}={}){
  let stateOutage=failState,recovery=false,releaseState;const stateGate=holdState?new Promise(resolve=>{releaseState=resolve}):null;const values=new Map(),calls={state:0,character:[],writes:[],recovery:[]},timeouts=[],nodes=new Map();
  const localStorage={getItem:k=>values.has(k)?values.get(k):null,setItem(k,v){values.set(k,String(v))},removeItem:k=>values.delete(k),key:i=>[...values.keys()][i]||null,get length(){return values.size}};
  localStorage.setItem(KEYS.session,JSON.stringify({access_token:'access-user-1',refresh_token:'refresh-user-1',user:{id:owner}}));
  localStorage.setItem(KEYS.exit,'1');
  if(localSave)localStorage.setItem('psyWorldSave',JSON.stringify(localSave));
  const el=(id,display)=>{const n=node(id);if(display)n.style.display=display;nodes.set(id,n);return n};
  const login=el('screen-login','flex'),form=el('psy-online-form','none'),toggle=el('psy-online-toggle'),status=el('psy-online-status'),nick=el('nick-input');
  el('psy-cloud-modal','none');
  form.appendChild=function(child){this.children.push(child);nodes.set(child.id,child);return child};
  const document={readyState:'loading',title:'PSYWORLD',body:node('body'),head:node('head'),getElementById:id=>nodes.get(id)||null,createElement:()=>node('created'),addEventListener(){},querySelector(){return null},querySelectorAll(){return[]}};
  const location={origin:'https://preview.test',pathname:'/',search:'',hash:'',reload(){calls.reload=(calls.reload||0)+1}};
  async function fetch(url,opt={}){
    if(String(url).startsWith('/api/player?')||url==='/api/player'){
      calls.state++;calls.writes.push({url,method:opt.method||'GET',authorization:opt.headers?.Authorization});
      if(stateGate)await stateGate;
      return stateOutage?{ok:false,status:503,json:async()=>({error:'network unavailable'})}:{ok:true,status:200,json:async()=>({user:{id:responseOwner},characters})};
    }
    if(String(url).startsWith('/api/player/character?')){
      calls.character.push({url,authorization:opt.headers?.Authorization});
      return failCharacter?{ok:false,status:503,json:async()=>({error:'temporarily unavailable'})}:{ok:true,status:200,json:async()=>({character:{id:'char-1',nickname:'Cloud Trainer',save:characterSave,updated_at:'2026-11-10T00:00:00Z'}})};
    }
    throw new Error('unexpected request '+url);
  }
  const player={name:'Local Trainer',meta:{},team:[{id:1,name:'Bulbasaur'}],box:[],gold:777};
  const window={localStorage,location,history:{},P:player,notif(){},dispatchEvent(){},psyCloudV23:{validSave:s=>!!s?.player?.team?.length,migrateSave:s=>s,getAccountState:async()=>{calls.state++;calls.writes.push({url:'/api/player',method:'GET',authorization:'Bearer access-user-1'});if(stateOutage)throw new Error('network unavailable');return{user:{id:responseOwner},characters}},getAccountCharacterById:async id=>{calls.character.push({url:'/api/player/character?character_id='+id,authorization:'shared-request'});if(failCharacter)throw new Error('temporarily unavailable');return{character:{id:'char-1',nickname:'Cloud Trainer',save:characterSave,updated_at:'2026-11-10T00:00:00Z'}}},beginEntryRecovery(){recovery=true;form.style.display='none';calls.recovery.push('begin')},finishEntryRecovery(){recovery=false;form.style.display='block';calls.recovery.push('finish')}}};
  const context={window,document,location,localStorage,fetch,CustomEvent:class{},console:{log(){},warn(){},error(){}},URL,URLSearchParams,Date,Promise,JSON,Number,String,Boolean,Math,Map,Array,Object,RegExp,encodeURIComponent,decodeURIComponent,getComputedStyle:n=>({display:n?.style?.display||'none'}),setTimeout(fn){timeouts.push(fn);return timeouts.length},clearTimeout(){},setInterval(){return 1},clearInterval(){},atob:v=>Buffer.from(v,'base64').toString('binary')};
  vm.runInNewContext(source,context,{filename:'core/online-profile-entry-v37.js'});
  return {window,document,localStorage,calls,timeouts,nodes,form,toggle,status,nick,login,values,setStateOutage(v){stateOutage=v},releaseState(){releaseState?.()},isRecovering(){return recovery}};
}

(async()=>{
  const localOther={version:9,savedAt:5,player:{name:'Offline Profile',team:[{id:1,name:'Bulbasaur'}],box:[],gold:99}};
  const single=harness({localSave:localOther});
  await single.window.psyCharactersV38.render(true);
  assert.equal(single.form.style.display,'block','successful single-character entry keeps the login controls hidden until the game reloads');
  assert.equal(single.toggle.attributes['aria-expanded'],'true');
  assert.equal(single.calls.state,1,'server returns the validated UUID and its owned character list');
  assert.equal(single.calls.writes[0].authorization,'Bearer access-user-1');
  assert.equal(single.calls.character.length,1,'one owned character is loaded automatically');
  assert.match(single.calls.character[0].url,/character_id=char-1/,'character is fetched by stable server ID, not nickname');
  assert.equal(single.localStorage.getItem(KEYS.selected),'Cloud Trainer');
  assert.equal(single.localStorage.getItem(KEYS.id),'char-1');
  assert.equal(single.localStorage.getItem(KEYS.pending),null,'automatic entry never starts character creation');
  assert.equal(single.localStorage.getItem('psyWorldSave'),JSON.stringify(validSave),'server save replaces the active slot only after it validates');
  assert.equal(JSON.parse(single.localStorage.getItem(KEYS.stash)).psyWorldSave,JSON.stringify(localOther),'unrelated local save stays in the backup stash');
  assert.equal(single.calls.reload,1,'entry requests a page reload only after accepted save; timer has not fired in the test');
  assert.equal(single.isRecovering(),false,'single-character save stays behind the loading transition until the accepted character reloads');

  const resumed=harness();
  resumed.localStorage.setItem(KEYS.selected,'Cloud Trainer');resumed.localStorage.setItem(KEYS.id,'char-1');
  resumed.localStorage.setItem(KEYS.sync,JSON.stringify({userKey:'user-1',resolved:true,characterId:'char-1',characterNickname:'Cloud Trainer'}));
  await resumed.window.psyCharactersV38.render();
  assert.equal(resumed.calls.state,0,'a previously resolved UUID-scoped character skips the account-list query after reload');
  assert.equal(resumed.calls.character.length,1,'the persisted character is still fetched through the owner-validating server endpoint');
  assert.equal(resumed.localStorage.getItem('psyWorldSave'),JSON.stringify(validSave));

  const wrongOwner=harness();
  wrongOwner.localStorage.setItem(KEYS.selected,'Cloud Trainer');wrongOwner.localStorage.setItem(KEYS.id,'char-1');
  wrongOwner.localStorage.setItem(KEYS.sync,JSON.stringify({userKey:'different-user',resolved:true,characterId:'char-1',characterNickname:'Cloud Trainer'}));
  await wrongOwner.window.psyCharactersV38.render();
  assert.equal(wrongOwner.calls.state,1,'a character selection scoped to another UUID cannot take the fast path');
  assert.equal(wrongOwner.calls.character.length,1,'fallback list validates ownership before opening the character');

  const multiple=harness({characters:[{id:'char-1',nickname:'Cloud Trainer'},{id:'char-2',nickname:'Second Trainer'}]});
  await multiple.window.psyCharactersV38.render(true);
  assert.equal(multiple.calls.character.length,0,'multiple characters require a visible explicit choice');
  assert.match(multiple.nodes.get('psy-character-list-v38').innerHTML,/Cloud Trainer/);
  assert.match(multiple.nodes.get('psy-character-list-v38').innerHTML,/Second Trainer/);
  assert.equal(multiple.localStorage.getItem(KEYS.pending),null);
  assert.equal(multiple.isRecovering(),false,'multiple-character selector appears after the server list resolves');
  const choices=multiple.nodes.get('psy-character-list-v38').querySelectorAll('[data-psy-character-id]');
  await choices[0].onclick();
  assert.match(multiple.calls.character[0].url,/character_id=char-1/,'a selected character is also opened by stable ID');
  assert.equal(multiple.nick.value,'','selecting a saved character never requires retyping its nickname');
  assert.equal(multiple.localStorage.getItem(KEYS.id),'char-1');

  const empty=harness({characters:[]});
  await empty.window.psyCharactersV38.render(true);
  assert.match(empty.nodes.get('psy-character-list-v38').innerHTML,/ainda não tem personagens/);
  assert.equal(empty.calls.character.length,0);
  assert.equal(empty.localStorage.getItem(KEYS.pending),null,'an empty account is never auto-created');
  assert.equal(empty.isRecovering(),false,'empty-account creation path appears after the server list resolves');

  const pending=harness({characters:[{id:'char-1',nickname:'Cloud Trainer'},{id:'char-2',nickname:'Second Trainer'}],holdState:true});
  const pendingRender=pending.window.psyCharactersV38.render(true);
  assert.equal(pending.form.style.display,'none','login controls stay hidden while the authenticated character request is pending');
  const periodicRender=pending.window.psyCharactersV38.render();
  assert.equal(pending.form.style.display,'none','a repeated maintenance render cannot reopen the login form during recovery');
  pending.releaseState();await Promise.all([pendingRender,periodicRender]);
  assert.equal(pending.isRecovering(),false,'the character selector replaces the loading screen after recovery');
  assert.equal(pending.form.style.display,'block');

  const mismatch=harness({responseOwner:'another-user'});
  await mismatch.window.psyCharactersV38.render(true);
  assert.equal(mismatch.calls.character.length,0,'a response for a different authenticated UUID is rejected');
  assert.match(mismatch.nodes.get('psy-character-list-v38').innerHTML,/TENTAR NOVAMENTE/);
  assert.equal(mismatch.localStorage.getItem(KEYS.pending),null);

  const outage=harness({failState:true,localSave:localOther});
  await outage.window.psyCharactersV38.render(true);
  assert.match(outage.nodes.get('psy-character-list-v38').innerHTML,/Nenhum save foi alterado/);
  assert.match(outage.nodes.get('psy-character-list-v38').innerHTML,/TENTAR NOVAMENTE/);
  assert.equal(outage.localStorage.getItem('psyWorldSave'),JSON.stringify(localOther),'network failure leaves the old local save untouched');
  assert.equal(outage.localStorage.getItem(KEYS.pending),null);
  assert.equal(outage.calls.character.length,0);
  assert.equal(outage.isRecovering(),false,'network errors release the loading view and expose retry');
  outage.setStateOutage(false);
  await outage.nodes.get('psy-character-list-v38').querySelector('[data-psy-retry]').onclick();
  assert.equal(outage.calls.state,2,'retry button re-queries the authenticated account instead of requiring a page reload');
  assert.equal(outage.calls.character.length,1,'retry continues to the same owner-validated single character');

  const invalid=harness({characterSave:{version:9,player:{team:[],box:[]}},localSave:localOther});
  await invalid.window.psyCharactersV38.render(true);
  assert.match(invalid.nodes.get('psy-character-list-v38').innerHTML,/Nenhum save local ou da nuvem foi sobrescrito/);
  assert.equal(invalid.localStorage.getItem('psyWorldSave'),JSON.stringify(localOther),'invalid remote save cannot overwrite local state');
  assert.equal(invalid.localStorage.getItem(KEYS.pending),null);
  assert.equal(invalid.isRecovering(),false,'invalid character saves release the loading view and expose retry');

  const legacyEntry=(legacySource.match(/function psyV9EnterSavedGame\(\)\{[\s\S]*?\n\}/)||[])[0];
  assert.ok(legacyEntry,'the legacy local-save entry function is present');
  let localLoadAttempted=false;
  const blocked=vm.runInNewContext(legacyEntry+';psyV9EnterSavedGame()',{
    localStorage:{getItem:key=>key===KEYS.exit?'1':null},
    psyV9LoadLocal(){localLoadAttempted=true;return true}
  });
  assert.equal(blocked,false,'legacy startup refuses local entry while OAuth account selection is locked');
  assert.equal(localLoadAttempted,false,'the unrelated local save is not even read during cloud identity validation');

  console.log('PASS auto-entry: owner UUID check, single-character ID load, multiple-character selector, empty-account creation gate, retry, local-save lock, and preservation on API/save failure.');
})().catch(e=>{console.error(e);process.exitCode=1});
