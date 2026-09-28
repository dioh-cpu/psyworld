const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync(require.resolve('../modes/idle-social-v1.js'), 'utf8');
assert.match(source,/redirectTo:new URL\('\/idle-oauth-callback\.html',W\.location\.origin\)\.href/);
assert.doesNotMatch(source,/psyworld_online_session_v23/);
const session = {access_token:'fixture',refresh_token:'fixture',expires_at:2000000000,user:{id:'user-fixture',user_metadata:{}}};
const data = new Map([
  ['psy_idle_session_v1',JSON.stringify(session)],
  ['psyIdleSocialPrefsV1','{"open":true}']
]);
const elements = new Map();
function element(key) {
  if (!elements.has(key)) elements.set(key, {
    innerHTML:'',textContent:'',dataset:{},style:{},hidden:false,scrollHeight:0,
    classList:{toggle(){}},querySelector(){return null},addEventListener(){}
  });
  return elements.get(key);
}
const root = {classList:{toggle(){}},querySelector:element,querySelectorAll(){return []}};
const timers = new Map();
let timer = 0, queries = [], channels = [], fetches = [];
const localStorage = {
  getItem:k=>data.get(k)||null, setItem:(k,v)=>data.set(k,v), removeItem:k=>data.delete(k)
};
const rows = Array.from({length:80},(_,i)=>({
  id:String(i+1),user_id:i===79?'user-fixture':'other-user',channel:'global',username:'Fixture',body:'Fixture '+i,
  created_at:new Date(100000+i*1000).toISOString()
}));
const nameUpdates=[], selectedColumns=[];
const client = {
  auth:{getSession:async()=>({data:{session}}),setSession:async credentials=>{client.auth.lastSetSession=credentials;return{data:{session:{...session,...credentials}}}},updateUser:async attrs=>{nameUpdates.push(attrs.data.trainer_name);return{data:{user:{id:'user-fixture',user_metadata:{trainer_name:attrs.data.trainer_name}}},error:null}}},
  realtime:{setAuth:async()=>{}}, removeChannel:async()=>{},
  channel(topic) {
    const c = {topic,on(){return c},subscribe(fn){c.callback=fn;return c}};
    channels.push(c); return c;
  },
  from(table) {
    queries.push(table); let ascending = true;
    return {
      select(columns){selectedColumns.push(columns);return this},eq(){return this},
      order(k,o){ascending=o.ascending;return this},
      limit(n){return Promise.resolve({data:(ascending?rows:[...rows].reverse()).slice(0,n),error:null})}
    };
  }
};
const window = {P:{name:'Ash'},addEventListener(){},location:{href:'https://example.invalid/',search:'',hash:'',pathname:'/'},history:{replaceState(){}}};
const context = {
  window,document:{readyState:'loading',addEventListener(){}},localStorage,
  console,URL,URLSearchParams,Date,Map,Promise,
  setTimeout(fn,delay){timers.set(++timer,{fn,delay});return timer},
  clearTimeout(id){timers.delete(id)},
  fetch:async url=>{
    fetches.push(url);
    return {ok:true,json:async()=>({
      onlineConfigured:true,supabaseUrl:'https://example.invalid',supabaseAnonKey:'fixture',
      idleMarketEnabled:false,idleAuctionEnabled:false
    })};
  }
};
// Expose closure state only in this isolated test; no production test hooks.
const expose = `W.__test={render,connectRealtime,stopChannel,loadOnlineMessages,persistSession,
  setView(v,t){activeView=v;activeTab=t},setRoot(r){root=r},setClient(c){supa=c;clientPromise=null},
  reset(){stopChannel();historyCache.clear();historyRequests.clear()}};`;
vm.runInNewContext(source.replace('})(window,document);',expose+'})(window,document);'),context);
const test = window.__test;
test.setRoot(root); test.setClient(client);
const flush = async()=>{for(let i=0;i<15;i++)await Promise.resolve()};

(async()=>{
  test.render(); await flush();
  assert(queries.every(t=>t==='psy_idle_chat_messages'));
  assert.deepEqual(nameUpdates,['Ash']);
  assert(selectedColumns.every(columns=>columns.includes('user_id')));
  assert.match(element('[data-social-feed]').innerHTML,/<b>Ash<\/b>/, 'the selected PSYWORLD trainer name labels the player\'s own history');
  assert.equal(fetches.length,0); assert.equal(channels.length,1);
  console.log('PASS: chat never queries commerce tables');

  test.reset(); queries=[]; channels=[];
  let resolveAuth;
  client.auth.getSession=()=>new Promise(r=>resolveAuth=r);
  const pending=test.connectRealtime('global'); await flush();
  data.set('psyIdleSocialPrefsV1','{"open":false}'); test.stopChannel();
  resolveAuth({data:{session}}); await pending;
  assert.equal(channels.length,0);
  console.log('PASS: minimizing cancels an in-flight subscription');

  data.set('psyIdleSocialPrefsV1','{"open":true}');
  const authRequests=[];
  client.auth.getSession=()=>new Promise(resolve=>authRequests.push(resolve));
  const old=test.connectRealtime('global'); await flush();
  test.stopChannel(); test.setView('chat','doubts');
  const next=test.connectRealtime('doubts'); await flush();
  authRequests[1]({data:{session}}); await next;
  authRequests[0]({data:{session}}); await old;
  assert.deepEqual(channels.map(c=>c.topic),['psyworld-idle-chat:doubts']);
  console.log('PASS: an old channel cannot replace the newly selected channel');

  client.auth.getSession=async()=>({data:{session}});
  test.reset(); test.setView('chat','global'); channels=[]; timers.clear();
  await test.connectRealtime('global'); channels.at(-1).callback('CHANNEL_ERROR');
  const retry=[...timers.entries()].find(([,x])=>x.delay===1000);
  assert(retry); timers.delete(retry[0]); retry[1].fn(); await flush();
  channels.at(-1).callback('TIMED_OUT');
  assert([...timers.values()].some(x=>x.delay===2000));
  console.log('PASS: retry delay increases after consecutive failures');

  test.reset(); data.delete('psyIdleChat:global');
  const history=await test.loadOnlineMessages('global',true);
  assert.equal(history.length,60);
  assert.equal(history[0].id,'21'); assert.equal(history.at(-1).id,'80');
  console.log('PASS: reconnect retrieves the newest 60 messages');

  test.reset(); queries=[]; channels=[]; test.setView('market','global');
  test.render(); await flush();
  assert.equal(queries.length,0); assert.equal(channels.length,0);
  assert.match(element('[data-market-feed]').innerHTML,/em desenvolvimento/);
  assert.equal(element('[data-market-live]').textContent,'Em desenvolvimento');
  console.log('PASS: unavailable commerce does not cause a database error');

  test.persistSession({...session,expires_in:3600});
  assert.equal(JSON.parse(data.get('psy_idle_session_v1')).expires_at,2000000000000);
  console.log('PASS: the actual token expiry is preserved');

})().catch(error=>{console.error(error);process.exitCode=1});
