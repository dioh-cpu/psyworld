const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const crypto=require('node:crypto');
const source=fs.readFileSync(require.resolve('../modes/idle-commerce-v1.js'),'utf8');
const listeners={},storage=new Map([['psyworld_online_session_v23',JSON.stringify({access_token:'stale'})]]);
let auth={data:{session:null}},channels=0,release;
const client={auth:{getSession:async()=>auth},realtime:{setAuth:()=>new Promise(r=>release=r)},channel(){channels++;return{on(){return this},subscribe(){return this}}}};
const W={dispatchEvent(){},PsyIdleSocial:{client:async()=>client},addEventListener:(k,f)=>listeners[k]=f};
const pendingOps=new Map(),requests=[];let failRequest=true;
const context={CustomEvent:class{},crypto,sessionStorage:{getItem:k=>pendingOps.get(k),setItem:(k,v)=>pendingOps.set(k,v),removeItem:k=>pendingOps.delete(k)},fetch:async(url,opts)=>{requests.push(JSON.parse(opts.body));if(failRequest)throw new Error('connection_lost');return{ok:true,json:async()=>({ok:true})};},window:W,document:{},localStorage:{getItem:k=>storage.get(k)},console,URLSearchParams,setTimeout,clearTimeout,setInterval,clearInterval};
vm.runInNewContext(source.replace('W.PsyIdleCommerce={open,close};',`W.test={token,live,close,mutate,setRoot:r=>root=r};W.PsyIdleCommerce={open,close};`),context);
(async()=>{
 await assert.rejects(W.test.token(),/AUTH_REQUIRED/);
 console.log('PASS: expired live session cannot reuse cached token');
 auth={data:{session:{access_token:'current'}}};assert.equal(await W.test.token(),'current');
 const root={style:{display:'block'},querySelector:()=>null};W.test.setRoot(root);
 const pending=W.test.live();for(let i=0;i<10;i++)await Promise.resolve();
 W.test.close();release();await pending;assert.equal(channels,0);
 console.log('PASS: closing while authenticating prevents leaked realtime channel');
 root.style.display='block';listeners['idle-auth-changed']();assert.equal(root.style.display,'none');
 root.style.display='block';listeners.storage({key:'psyworld_online_session_v23'});assert.equal(root.style.display,'none');
 console.log('PASS: account changes close commerce in current and other tabs');
 await assert.rejects(W.test.mutate('create',{quantity:1}),/connection_lost/);
 assert.equal(pendingOps.size,1);
 // Re-evaluate the module as a page reload, retaining session storage only.
 vm.runInNewContext(source.replace('W.PsyIdleCommerce={open,close};',`W.test={mutate,setRoot:r=>root=r};`),context);
 W.test.setRoot(root);failRequest=false;await W.test.mutate('create',{quantity:1});
 assert.equal(requests[0].request_id,requests[1].request_id);assert.equal(pendingOps.size,0);
 console.log('PASS: retry after page reload retains transaction identity');
})().catch(e=>{console.error(e);process.exitCode=1});
