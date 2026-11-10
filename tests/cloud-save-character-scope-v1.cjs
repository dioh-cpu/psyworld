/* Character-scoped cloud conflict regression. Run: node tests/cloud-save-character-scope-v1.cjs */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('core/cloud-save-v23.js','utf8');
const authority=fs.readFileSync('core/online-authority-v26.js','utf8');
const characterSave={player:{name:'Ash',meta:{characterNickname:'Ash'},team:[{id:25}],inventory:{Potion:3}},savedAt:1700000000000};
const otherSave={player:{name:'Misty',meta:{characterNickname:'Misty'},team:[{id:54}],inventory:{PsyCoin:900}},savedAt:1800000000000};

function boot({storage={},remoteRevision='2026-11-09T10:00:00.000Z',remoteSave=characterSave,mirror=otherSave,saveResponse,saveError=false,account='account-1'}={}){
 const data=new Map(Object.entries(storage));
 const nodes=new Map(),calls=[],timers=[],modals=[],warnings=[];
 const localStorage={getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};
 const node=(id='')=>({id,style:{setProperty(){}},dataset:{},children:[],appendChild(x){this.children.push(x);if(x.id)nodes.set(x.id,x)},addEventListener(){},querySelector(){return null},querySelectorAll(){return[]},set innerHTML(value){this.html=String(value);const title=this.html.match(/<h2[^>]*>(.*?)<\/h2>/)?.[1];if(title)modals.push(title);const id=this.html.match(/id="([^"]+)"/)?.[1];if(id){const child=node(id);nodes.set(id,child)}},get innerHTML(){return this.html||''}});
 const document={readyState:'complete',title:'PSYWORLD',visibilityState:'visible',body:node('body'),head:node('head'),getElementById:id=>nodes.get(id)||null,createElement:()=>node(),querySelector:()=>null,addEventListener(){}};
 const token={access_token:'test-token',expires_at:Date.now()+3600000,user:{id:account}};
 const defaults={
  psyworld_online_session_v23:JSON.stringify(token),psyworld_active_character_v38:'Ash',
  psyWorldSave:JSON.stringify(characterSave),psyWorldSave_v9:JSON.stringify(characterSave),
  psyWorldSave_backup:JSON.stringify(otherSave)
 };
 for(const [k,v] of Object.entries(defaults))if(!data.has(k))data.set(k,v);
 const state={user:{id:account},game_state:{save:mirror,updated_at:'2026-11-10T12:00:00.000Z'},characters:[{nickname:'Ash'},{nickname:'Misty'}]};
 const fetch=async(url,options={})=>{
  calls.push({url:String(url),options});
  let body={};
  if(String(url)==='/api/config')body={onlineConfigured:true};
  else if(String(url)==='/api/player')body=state;
  else if(String(url).startsWith('/api/player/character?'))body={character:{nickname:'Ash',save:remoteSave,updated_at:remoteRevision,client_updated_at:remoteRevision}};
  else if(String(url)==='/api/player/save')body=saveResponse||{ok:true,updated_at:'2099-01-01T00:00:00.000Z',character:{updated_at:'2026-11-10T13:00:00.000Z'}};
  return {ok:!(String(url)==='/api/player/save'&&saveError),json:async()=>String(url)==='/api/player/save'&&saveError?{error:'temporary_network_failure'}:body};
 };
 const window={localStorage,location:{hash:'',pathname:'/',search:'',reload(){}},history:{replaceState(){}},addEventListener(){},dispatchEvent(){},setInterval(){},P:null,notif(){}};
 const sandbox={window,document,localStorage,fetch,console:{log(){},warn(...args){warnings.push(args.map(String).join(' '))},error(){}},URLSearchParams,CustomEvent:function(){},Date,Math,JSON,Promise,atob:s=>Buffer.from(s,'base64').toString('binary'),setTimeout:(fn)=>{timers.push(fn);return timers.length},clearTimeout(){},setInterval(){},location:window.location,history:window.history,innerWidth:390,innerHeight:844};
 vm.runInNewContext(source,sandbox,{filename:'core/cloud-save-v23.js'});
 return {data,calls,modals,timers,nodes,window,warnings,run:async()=>{const fn=timers.shift();assert(fn,'bootstrap timer should be scheduled');fn();for(let i=0;i<30;i++)await Promise.resolve();},storage:()=>Object.fromEntries(data),click:async label=>{const actions=nodes.get('psy-cloud-actions');assert(actions,'save decision modal should expose actions');const button=actions.children.find(x=>x.textContent===label);assert(button,`missing modal action ${label}`);await button.onclick()}};
}

(async()=>{
 const first=boot();await first.run();
 assert(first.calls.some(c=>c.url==='/api/player/character?nickname=Ash'),'compare the selected character endpoint; calls='+JSON.stringify(first.calls.map(c=>c.url))+' warnings='+JSON.stringify(first.warnings));
 assert(!first.calls.some(c=>c.url.includes('Misty')),'never fetch another character for the selected profile');
 assert(first.modals.length===1,'first real local/cloud divergence asks once');
 await first.click('CANCELAR — NÃO SINCRONIZAR AGORA');
 const afterCancel=first.storage();
 assert(afterCancel.psyworld_cloud_sync_profiles_v1.includes('account-1::ash'),'decision is persisted per account and character');
 assert.equal(first.calls.some(c=>c.url==='/api/player/save'),false,'cancelling leaves local inventory, currency, and progress untouched');

 const reloadSame=boot({storage:afterCancel});await reloadSame.run();
 assert.equal(reloadSame.modals.length,0,'F5 does not repeat the same deferred conflict');
 const reloadAutosave=boot({storage:afterCancel,remoteSave:{...characterSave,savedAt:characterSave.savedAt+60000},remoteRevision:'2026-11-10T12:00:00.000Z'});await reloadAutosave.run();
 assert.equal(reloadAutosave.modals.length,0,'save timestamps changing during ordinary autosave do not create a new conflict');

 const legacyStorage={...afterCancel,psyworld_cloud_sync_profiles_v1:'{}',psyworld_cloud_sync_v23:JSON.stringify({userKey:'account-1',characterNickname:'Ash',resolved:true,saveStamp:characterSave.savedAt,cloudStamp:Date.parse('2026-11-10T12:00:00.000Z'),cloudRevision:'2026-11-10T12:00:00.000Z'})};
 const legacy=boot({storage:legacyStorage});await legacy.run();
 assert.equal(legacy.modals.length,1,'legacy account-wide revision is never trusted as a character baseline');
 assert.equal(JSON.parse(legacy.storage().psyWorldSave).player.inventory.Potion,3,'legacy migration does not silently replace local progress');

 const nextCloud={...characterSave,player:{...characterSave.player,inventory:{Potion:2,Revive:1}},savedAt:1700000005000};
 const changedCloud=boot({storage:afterCancel,remoteRevision:'2026-11-10T12:30:00.000Z',remoteSave:nextCloud});await changedCloud.run();
 assert.equal(changedCloud.modals.length,1,'a genuinely new cloud revision is shown');

 const accountTwoStorage={...afterCancel,psyworld_online_session_v23:JSON.stringify({access_token:'test-token',expires_at:Date.now()+3600000,user:{id:'account-2'}})};
 const secondAccount=boot({storage:accountTwoStorage,account:'account-2'});await secondAccount.run();
 assert.equal(secondAccount.modals.length,1,'a different account has an independent choice');

 const failedChoice=boot({saveError:true});await failedChoice.run();await failedChoice.click('📱 USAR LOCAL E ENVIAR PARA NUVEM');
 const retrySame=boot({storage:failedChoice.storage()});await retrySame.run();
 assert.equal(retrySame.modals.length,0,'a selected action is not requested again after a transient upload failure');

 const chooseLocal=boot({remoteRevision:'2026-11-09T10:00:00.000Z'});await chooseLocal.run();
 await chooseLocal.click('📱 USAR LOCAL E ENVIAR PARA NUVEM');
 const uploadCall=chooseLocal.calls.find(c=>c.url==='/api/player/save');
 assert(uploadCall,'explicit local selection uploads that character');
 const sent=JSON.parse(uploadCall.options.body);
 assert.equal(sent.character_nickname,'Ash');
 assert.equal(sent.base_cloud_updated_at,'2026-11-09T10:00:00.000Z','CAS uses selected character revision, not account mirror revision');
 const savedMeta=JSON.parse(chooseLocal.storage().psyworld_cloud_sync_profiles_v1)['account-1::ash'];
 assert.equal(savedMeta.cloudRevision,'2026-11-10T13:00:00.000Z','store server character revision from upload response');
 assert.equal(savedMeta.resolved,true);

 const chooseCloud=boot({remoteRevision:'2026-11-09T10:00:00.000Z'});await chooseCloud.run();
 await chooseCloud.click('☁ USAR SAVE DA NUVEM NESTE APARELHO');
 assert.equal(JSON.parse(chooseCloud.storage().psyWorldSave).player.meta.characterNickname,'Ash','explicit cloud choice applies the selected character save');
 assert(Object.keys(chooseCloud.storage()).some(k=>k.startsWith('psyWorldSave_backup_before_cloud_')),'the former local save is retained as a backup');
 const reloadChosenCloud=boot({storage:chooseCloud.storage(),remoteRevision:'2026-11-09T10:00:00.000Z'});await reloadChosenCloud.run();
 assert.equal(reloadChosenCloud.modals.length,0,'the selected sync choice survives F5');

 const untaggedCloud={player:{name:'Trainer account label',team:[{id:25}],inventory:{Potion:1}},savedAt:1600000000000};
 const cloudOnly=boot({storage:{psyWorldSave:'null',psyWorldSave_v9:'null',psyWorldSave_backup:JSON.stringify(otherSave)},remoteSave:untaggedCloud});await cloudOnly.run();
 assert.equal(cloudOnly.modals[0],'SAVE NA NUVEM ENCONTRADO','server character metadata identifies a cloud save with no embedded nickname');
 await cloudOnly.click('☁ CARREGAR SAVE DA NUVEM');
 const restored=JSON.parse(cloudOnly.storage().psyWorldSave);
 assert.equal(restored.player.meta.characterNickname,'Ash','cloud restore tags the selected profile for subsequent local lookup');
 const readyFragment=authority.match(/const syncReady=\(\)=>\{[\s\S]*?\n\};/)?.[0];
 assert(readyFragment,'server sync readiness uses the cloud profile metadata');
 const syncReady=new Function('session','identity','parse','localStorage','SYNC_PROFILES_KEY','SYNC_KEY','CHARACTER_KEY',`return (${readyFragment.slice('const syncReady='.length,-1)});`);
 const readReady=syncReady(()=>({user:{id:'account-1'}}),s=>s.user.id,JSON.parse,{getItem:k=>cloudOnly.storage()[k]||null},'psyworld_cloud_sync_profiles_v1','psyworld_cloud_sync_v23','psyworld_active_character_v38');
 assert.equal(readReady(),true,'server sync recognizes the per-character profile binding');
 const reloadRestored=boot({storage:cloudOnly.storage(),remoteSave:untaggedCloud});await reloadRestored.run();
 assert.equal(reloadRestored.modals.length,0,'cloud-only restore does not reopen the modal on F5');
 assert(authority.includes('await W.psyCloudV23.compareNow()'),'server sync button opens the actionable cloud resolution instead of a toast');
 assert(authority.includes('id="psy-server-cloud-save-v26"')&&authority.includes('id="psy-server-cloud-load-v26"'),'online panel exposes direct save and load actions');
 assert(source.includes('async function saveNow()')&&source.includes('if(!local){await compareNow();return false}'),'save action routes missing local profiles to a comparison instead of a dead-end toast');

 const compare=boot({storage:afterCancel});await compare.run();
 await compare.window.psyCloudV23.compareNow();
 assert.equal(compare.modals.length,1,'manual comparison bypasses the dismissed-conflict fingerprint');
 console.log('PASS: character-scoped comparison/CAS, per-profile decision persistence, same-conflict F5 suppression, new-conflict prompt, explicit compare');
})().catch(error=>{console.error(error);process.exitCode=1});
