/* Regression tests for cloud inventory, Halloween drops, city quests, and tap walking.
 * Run: node tests/city-cloud-halloween-v1.cjs */
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const api=read('api/player.js'),online=read('core/online-authority-v26.js');
const cloud=read('core/cloud-save-v23.js'),season=read('core/seasonal-event-v1.js');
const nav=read('core/city-tap-navigation-v1.js'),quest=read('core/city-quest-floating-v1.js');
const auto=read('core/campaign-automation-v1.js'),html=read('index.html');
const helper=api.slice(api.indexOf('const HALLOWEEN_CANDY'),api.indexOf('function cleanNick'));
assert(helper.includes('function reconcileGrantedCandy'));
const reconcile=new Function('incoming','previous',helper+'return reconcileGrantedCandy(incoming,previous)');
const grant={id:'test-grant',amount:1000000};
const previous={player:{inventory:{'Doce de Halloween':1000000},meta:{halloweenTestGrantV1:grant}}};
const stale={player:{inventory:{},meta:{}}};
const repaired=reconcile(stale,previous);
assert.equal(repaired.player.inventory['Doce de Halloween'],1000000,'Restore unreceived grant');
assert.equal(repaired.player.meta.halloweenTestGrantV1.id,'test-grant');
const spent={player:{inventory:{'Doce de Halloween':999900},meta:{halloweenTestGrantV1:grant}}};
assert.equal(reconcile(spent,previous).player.inventory['Doce de Halloween'],999900,'Do not refund spent candy');
const noGrant={player:{inventory:{'Doce de Halloween':1},meta:{}}};
assert.equal(reconcile(noGrant,{player:{inventory:{}}}).player.inventory['Doce de Halloween'],1);
const start=online.indexOf('const LOCAL_EVENT_ITEMS'),end=online.indexOf('function mergeSystem',start);
assert(start>=0&&end>start,'Online inventory reconciliation must exist');
const mergeCode=online.slice(start,end);
const player={inventory:{'Doce de Halloween':1000000,'Halloween Ball':8,'Great Ball':40,'Old Metal':12}};
const merge=new Function('p','snapshot',mergeCode+'mergeInventory(snapshot,true);return p().inventory');
const merged=merge(()=>player,{inventory:{'Great Ball':10,'Ultra Ball':2}});
assert.equal(merged['Doce de Halloween'],1000000,'Server item refresh must not erase local seasonal candy');
assert.equal(merged['Halloween Ball'],8);
assert.equal(merged['Great Ball'],10,'Server stock remains authoritative');
assert.equal(merged['Old Metal'],undefined,'Do not blindly union all inventories');
assert(cloud.includes('base_cloud_updated_at:readSync().cloudRevision||null'));
assert(cloud.includes('cloud_save_conflict|cloud_save_newer'));
assert(cloud.includes('server_inventory_candy'));
assert(api.includes("eq('currency','psycoin')"),'Ledger-backed PsyCoin wallet required');
const W={P:{inventory:{},meta:{}},setTimeout:()=>1,autoSave:()=>{}};
const D={readyState:'loading',addEventListener:()=>{},head:{appendChild:()=>{}}};
vm.runInNewContext(season,{window:W,document:D,console});
const wild={id:16,level:5,name:'Pidgey'};
const prizes=W.PsySeason.award(wild,'wild',()=>0);
assert.equal(W.P.inventory['Doce de Halloween'],1,'Halloween drop must increment real inventory');
assert.equal(prizes[0].name,'Doce de Halloween');
assert.equal(W.PsySeason.award(wild,'wild',()=>0).length,0,'No duplicate award on same enemy');
const callbacks={},canvas={width:500,height:500,
 addEventListener:(name,fn)=>{(callbacks[name]||(callbacks[name]=[])).push(fn)},
 getBoundingClientRect:()=>({left:0,top:0,width:500,height:500})};
const state={x:25,y:25,tx:25,ty:25,px:25*55,py:25*55,moving:false};
const keys={},solid=new Set(['26,25']);let tick=()=>{};
const win={performance:{now:()=>100},setInterval:fn=>{tick=fn},
 getComputedStyle:()=>({display:'block'}),PsyCityGeometry:{contains:(x,y)=>x>=0&&y>=0}};
const dom={getElementById:id=>id==='gameCanvas'?canvas:{},body:{classList:{contains:()=>false}}};
vm.runInNewContext(nav,{window:win,document:dom,P:state,SOLID:solid,keys,inBattle:false});
assert(win.PsyCityTapNav,'City tap control should be registered');
const path=win.PsyCityTapNav.findPath(25,25,28,25);
assert(path.length>3,'Blocked direct route must take a detour');
assert(!path.some(pt=>pt.x===26&&pt.y===25),'Route may not pass through a collision');
assert(win.PsyCityTapNav.navigate(28,25));
for(let i=0;i<16;i++){tick();if(win.clickMove){state.x+=win.clickMove.dx;state.y+=win.clickMove.dy;win.clickMove=null}}
assert.equal(state.x,28);assert.equal(state.y,25);
win.PsyCityTapNav.navigate(29,29);keys.ArrowRight=true;tick();
assert.equal(win.PsyCityTapNav.pending(),0,'Manual joystick cancels touch path');
assert(quest.includes("fab.setPointerCapture?.(e.pointerId)"),'Quest floating button should capture pointer');
assert(quest.includes("W.localStorage.setItem(KEY"),'Quest floating position should persist');
assert(quest.includes('function open(next)'), 'Quest button should minimize/expand');
assert(auto.includes("W.PsyCityQuestFloating?.host?.()"),'Quest tracker must be moved to floating drawer in city');
assert(html.indexOf('core/city-tap-navigation-v1.js?')>html.indexOf('core/legacy-runtime.js?'));
assert(html.indexOf('core/city-quest-floating-v1.js?')<html.indexOf('core/campaign-automation-v1.js?'));
console.log('PASS: Halloween drop, grant/spending, cloud version guard, server-ledger PsyCoin, event inventory, draggable quests and collision-safe tap walking');
