const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync(require.resolve('../modes/idle-trade-zone-v1.js'),'utf8');
const host={style:{display:'none'},innerHTML:'',onclick:null,onsubmit:null,querySelector(selector){return elements[selector]||null}};
const elements={
 '[data-trade-count]':{textContent:''},'[data-trade-status]':{textContent:'',dataset:{}},
 '[data-trade-player-layer]':{innerHTML:''},'[data-trade-players]':{innerHTML:''},
 '[data-trade-selected]':{innerHTML:''},'[data-trade-dm-feed]':{innerHTML:'',isConnected:true,scrollTop:0,scrollHeight:0},
 '[data-trade-friend-requests]':{innerHTML:''},'[data-trade-invites]':{innerHTML:''}
};
const messageInput={value:'Mensagem privada',focus(){}};
const messageForm={hidden:true,elements:{body:messageInput},querySelector(){return messageInput},matches(selector){return selector==='[data-trade-message]'}};
elements['[data-trade-selected]'].innerHTML='';
host.querySelector=selector=>selector==='[data-trade-message]'?messageForm:elements[selector]||null;
const created=[],windowListeners={};const document={readyState:'complete',head:{appendChild(node){created.push(node)}},createElement(){return{id:'',textContent:''}},getElementById(id){return id==='psy-ir-trade-room'?host:created.find(x=>x.id===id)||null},addEventListener(type,fn){this[type]=fn},removeEventListener(type){delete this[type]}};
let syncListener=null,statusListener=null,removed=false,authTokens=[],tracked=[],calls=[];
const state={
 'main-user':[{user_id:'main-user',nickname:'Old name',x:42,y:44}],
 'peer-user':[{user_id:'peer-user',nickname:'Misty',x:67,y:51}]
};
const channel={on(type,filter,fn){if(type==='presence'&&filter.event==='sync')syncListener=fn;return this},subscribe(fn){statusListener=fn;return this},presenceState(){return state},track:async payload=>{tracked.push(payload);return'ok'}};
const client={auth:{getSession:async()=>({data:{session:{access_token:'main-token',user:{id:'main-user',user_metadata:{trainer_name:'PSYWORLD account'}}}},error:null})},realtime:{setAuth:async token=>authTokens.push(token)},channel(topic,config){assert.equal(topic,'idle-trade-zone');assert.equal(config.config.private,true);assert.equal(config.config.presence.key,'main-user');return channel},removeChannel:async ch=>{assert.equal(ch,channel);removed=true}};
const window={PsyIdleSocial:{client:async()=>client,trainerName:()=> 'Ash PSYWORLD',social:async(action,payload)=>{calls.push({action,payload});if(action==='friend_requests')return{requests:[]};if(action==='inbox')return{threads:[]};if(action==='trade_create')return{ok:true,status:'invited',trade_id:'trade-1'};if(action==='dm_list')return{messages:[{sender_id:'peer-user',body:'Oi Ash',created_at:'2026-09-29T12:00:00Z'}]};return{ok:true,status:'pending'}}},addEventListener:(name,fn)=>windowListeners[name]=fn,confirm:()=>true,notif(){},P:{name:'Idle nickname'}};
window.PsyIdleTradeZone=null;
const context={window,document,console,Map,Promise,Date,Math,String,Object,Number,Array,JSON,setTimeout,clearTimeout,setInterval,clearInterval};
vm.runInNewContext(source,context);
const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve()};
const click=(selector,node)=>({target:{closest:s=>s===selector?node:null},preventDefault(){},clientX:0,clientY:0});
(async()=>{
 window.PsyIdleTradeZone.open({onCity(){}});await flush();
 assert.equal(host.style.display,'flex');assert.match(host.innerHTML,/Praça social compartilhada/);
 assert.match(host.innerHTML,/Pedidos de amizade/);assert.match(host.innerHTML,/Pedidos de troca/);assert.doesNotMatch(host.innerHTML,/data-trade-login|Entrar no Idle/);
 assert.deepEqual(authTokens,['main-token']);
 await statusListener('SUBSCRIBED');await flush();syncListener();
 assert(tracked.some(p=>p.user_id==='main-user'&&p.nickname==='Ash PSYWORLD'&&p.area==='trade-zone'&&Number.isFinite(p.x)&&Number.isFinite(p.y)),'presence carries the shared-account trainer name and room position');
 assert.match(elements['[data-trade-player-layer]'].innerHTML,/Misty/);assert.match(elements['[data-trade-player-layer]'].innerHTML,/Ash PSYWORLD/);
 const avatar={dataset:{tradePlayer:'peer-user'}};host.onclick(click('[data-trade-player]',avatar));
 assert.match(elements['[data-trade-selected]'].innerHTML,/Solicitar troca/);assert.match(elements['[data-trade-selected]'].innerHTML,/Pedir amizade/);
 await flush();assert.match(elements['[data-trade-dm-feed]'].innerHTML,/Oi Ash/,'private conversation history appears for the selected player');
 const trade={dataset:{tradeAction:'trade'}};host.onclick(click('[data-trade-action]',trade));await flush();
 assert(calls.some(x=>x.action==='trade_create'&&x.payload.peer_id==='peer-user'));
 const friend={dataset:{tradeAction:'friend'}};host.onclick(click('[data-trade-action]',friend));await flush();
 assert(calls.some(x=>x.action==='friend_request'&&x.payload.peer_id==='peer-user'));
 messageInput.value='Tudo bem?';await host.onsubmit({target:messageForm,preventDefault(){}});
 assert(calls.some(x=>x.action==='dm_send'&&x.payload.peer_id==='peer-user'&&x.payload.body==='Tudo bem?'));
 const keyEvent={key:'ArrowRight',target:{matches:()=>false},preventDefault(){}};document.keydown(keyEvent);
 await new Promise(resolve=>setTimeout(resolve,210));
 assert(tracked.length>=2&&tracked.at(-1).x>tracked[0].x,'keyboard movement is broadcast to the shared presence channel');
 await windowListeners['psyworld-online-session-changed']();await flush();
 assert.equal(removed,true,'a Cloud Save account change tears down the old presence connection');
 assert.equal(authTokens.length,2,'the Trade Zone reconnects with the active Cloud Save identity');
 window.PsyIdleTradeZone.close();assert.equal(host.style.display,'none');assert.equal(removed,true);
 console.log('PASS: shared Trade Zone shows players, broadcasts movement, and supports friend, trade and private-message actions');
})().catch(error=>{console.error(error);window.PsyIdleTradeZone.close();process.exitCode=1});
