const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync(require.resolve('../modes/idle-social-v1.js'), 'utf8');
assert.doesNotMatch(source,/Entrar com GitHub|data-login-email|data-login-pass|renderLogin|wireLogin/);
assert.match(source,/fetch\('\/api\/idle-chat'/);
const data = new Map([['psyIdleSocialPrefsV1','{"open":true}']]);
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
let timer = 0, queries = [], channels = [], fetches = [], requests = [];
const localStorage = {
  getItem:k=>data.get(k)||null, setItem:(k,v)=>data.set(k,v), removeItem:k=>data.delete(k)
};
const rows = Array.from({length:80},(_,i)=>({
  id:String(i+1),user_id:null,channel:'global',username:i===79?'Ash':'Fixture',body:'Fixture '+i,
  created_at:new Date(100000+i*1000).toISOString()
}));
const selectedColumns=[];
const client = {
  auth:{getSession:async()=>{throw Error('guest chat must not require an auth session')}},
  realtime:{}, removeChannel:async()=>{},
  channel(topic,config) {
    const c = {topic,config,on(){return c},subscribe(fn){c.callback=fn;return c}};
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
const window = {P:{name:'Ash'},addEventListener(){},location:{href:'https://example.invalid/',search:'',hash:'',pathname:'/'}};
const context = {
  window,document:{readyState:'loading',addEventListener(){}},localStorage,
  console,URL,URLSearchParams,Date,Map,Promise,Math,
  setTimeout(fn,delay){timers.set(++timer,{fn,delay});return timer},
  clearTimeout(id){timers.delete(id)},
  fetch:async(url,options={})=>{
    fetches.push(url);
    if(url==='/api/idle-chat'){
      requests.push(options);
      const payload=JSON.parse(options.body);
      return{ok:true,json:async()=>({message:{id:'guest-message',user_id:null,channel:payload.channel,username:payload.username,body:payload.body,created_at:new Date().toISOString()}})};
    }
    return{ok:true,json:async()=>({onlineConfigured:true,supabaseUrl:'https://example.invalid',supabaseAnonKey:'fixture',idleMarketEnabled:false,idleAuctionEnabled:false})};
  }
};
// Expose closure state only in this isolated test; no production test hooks.
const expose = `W.__test={render,connectRealtime,stopChannel,loadOnlineMessages,sendOnlineMessage,
  setView(v,t){activeView=v;activeTab=t},setRoot(r){root=r},setClient(c){supa=c;clientPromise=null},
  reset(){stopChannel();historyCache.clear();historyRequests.clear()}};`;
vm.runInNewContext(source.replace('})(window,document);',expose+'})(window,document);'),context);
const test = window.__test;
test.setRoot(root); test.setClient(client);
const flush = async()=>{for(let i=0;i<15;i++)await Promise.resolve()};

(async()=>{
  test.render(); await flush();
  assert(queries.every(t=>t==='psy_idle_chat_messages'));
  assert(selectedColumns.every(columns=>columns.includes('user_id')));
  assert.match(element('[data-social-feed]').innerHTML,/<b>Ash<\/b>/,'guest messages use the selected PSYWORLD trainer name');
  assert.equal(element('[data-social-compose]').hidden,false,'chat composer is available without sign-in');
  assert.equal(channels.length,1);
  assert.equal(channels[0].config.config.private,false,'guest subscription uses a public channel');
  console.log('PASS: guest chat reads public history and subscribes without an auth session');

  await test.sendOnlineMessage('global','Olá do Psyworld');
  assert.equal(fetches.filter(url=>url==='/api/idle-chat').length,1);
  assert.equal(requests.length,1);
  assert.equal(requests[0].headers.Authorization,undefined,'guest chat sends no auth token');
  const sent=JSON.parse(requests[0].body);
  assert.equal(sent.username,'Ash');assert.equal(sent.body,'Olá do Psyworld');assert.match(sent.guest_id,/^[0-9a-f-]{36}$/i);
  console.log('PASS: guest chat writes through the rate-limited server endpoint with the PSYWORLD trainer name');

  test.reset(); queries=[]; channels=[];
  const old=test.connectRealtime('global');
  test.stopChannel();test.setView('chat','doubts');
  const next=test.connectRealtime('doubts');
  await Promise.all([old,next]);await flush();
  assert.deepEqual(channels.map(c=>c.topic),['psyworld-idle-chat:doubts']);
  console.log('PASS: an old channel cannot replace the newly selected channel');

  test.setView('chat','global');test.reset();channels=[];timers.clear();
  await test.connectRealtime('global');channels.at(-1).callback('CHANNEL_ERROR');
  const retry=[...timers.entries()].find(([,x])=>x.delay===1000);
  assert(retry);timers.delete(retry[0]);retry[1].fn();await flush();
  channels.at(-1).callback('TIMED_OUT');
  assert([...timers.values()].some(x=>x.delay===2000));
  console.log('PASS: retry delay increases after consecutive failures');

  test.reset();data.delete('psyIdleChat:global');
  const history=await test.loadOnlineMessages('global',true);
  assert.equal(history.length,60);assert.equal(history[0].id,'21');assert.equal(history.at(-1).id,'80');
  console.log('PASS: reconnect retrieves the newest 60 messages');

  test.reset();queries=[];channels=[];test.setView('market','global');
  data.set('psy_idle_session_v1',JSON.stringify({access_token:'fixture',user:{id:'fixture'}}));
  test.render();await flush();
  assert.equal(queries.length,0);assert.equal(channels.length,0);
  assert.match(element('[data-market-feed]').innerHTML,/em desenvolvimento/);
  assert.equal(element('[data-market-live]').textContent,'Em desenvolvimento');
  console.log('PASS: unavailable commerce does not cause a database error');
})().catch(error=>{console.error(error);process.exitCode=1});
