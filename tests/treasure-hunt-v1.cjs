/* Crystal Grotto production controller, progression and authority contract. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('core/treasure-hunt-v1.js','utf8');
const hobbiesSource=fs.readFileSync('core/hobbies-v2.js','utf8');
const vfxSource=fs.readFileSync('core/hobbies-vfx-v1.js','utf8');
const worldSource=fs.readFileSync('core/kanto-world-v2.js','utf8');
const apiSource=fs.readFileSync('api/game.js','utf8');
const sql=fs.readFileSync('supabase/migrations/20261108052207_psyworld_treasure_hunt_v1.sql','utf8');
for(const js of [source,hobbiesSource,vfxSource,worldSource])new Function(js);
assert(apiSource.includes("action==='treasure-action'"));
assert(apiSource.includes("['status','unlock','dig','open-chest','level-up','skill-buy','treasure-roll','equip-cosmetic']"));
assert(sql.includes("grant execute on function public.psy_v28_treasure_action_v1"));
assert(sql.includes("if p_action = 'status' then"),'online availability probe is read-only and versioned');
assert(sql.includes('game_action_receipts')&&sql.includes('pg_advisory_xact_lock'));
assert(sql.includes("from public,anon,authenticated"),'treasure rewards cannot be called from client roles');
assert(sql.includes("'treasure_roll'"));

(async()=>{
 let now=0,random=.5,saves=0;
 const math=Object.create(Math);math.random=()=>random;
 const p={trainerLevel:5,gold:0,diamonds:0,psycoin:0,inventory:{},meta:{auxHobbiesV1:{}}};
 const notices=[];
 const W={P:p,Image:class{set src(v){this._src=v}get src(){return this._src}},performance:{now:()=>now},matchMedia:()=>({matches:false}),addEventListener:()=>{},autoSave:()=>saves++,updateHUD:()=>{},notif:m=>notices.push(m)};
 const D={getElementById:()=>null,createElement:()=>({})};
 const load=src=>vm.runInNewContext(src,{window:W,document:D,P:p,console,Math:math,Date,Map,Set,WeakMap,Image:W.Image});
 load(source);load(hobbiesSource);load(vfxSource);
 const T=W.PsyTreasureHuntV1,H=W.PsyHobbies,V=W.PsyHobbiesVFX;H.openDetail=()=>true;
 H.refresh=()=>{};
 assert(T&&H&&V);
 assert.equal(H.definitions.length,15,'Hunter and Looter are distinct Hobby entries');
 assert.equal(H.visibleNodes('route-1').some(x=>x.kind==='treasureHunter'),false,'Route 1 treasure spots stay hidden until Hunter unlock');
 assert(await T.unlock('treasureHunter'));
 assert.equal(H.state().treasureHunter.level,1);
 const hunterState=T.hobbyState('treasureHunter');
 for(const level of [1,10,30,100]){hunterState.level=level;assert.equal(T.levelRequirements('treasureHunter').need,Math.ceil(100*Math.pow(level,1.55)),`Level ${level} XP curve matches server progression`)}
 hunterState.level=1;
 assert(hobbiesSource.includes('Math.pow(Math.max(1,x.level),1.55)'),'Hobbies summary uses the same XP curve as authoritative treasure progression');
 assert(sql.includes('ceil(100*power(greatest(1,hobby_level)::numeric,1.55))'),'Server uses the shared 1.55 exponent for level requirements');
 assert.deepEqual(Array.from(H.visibleNodes('route-1').filter(x=>x.kind==='treasureHunter').map(x=>x.id)),['d1'],'Basic route crack appears after the Hunter unlock');

 const directionRows=[['down',{x:0,y:25},0],['left',{x:-25,y:0},1],['right',{x:25,y:0},2],['up',{x:0,y:-25},3]];
 for(const fps of [30,60,120])for(const [facing,target,row]of directionRows){
  now=0;let impacts=0;const scene=`treasure-${fps}-${facing}`;
  assert(V.beginAction({scene,node:{id:'test-crack',kind:'treasureHunter',x:target.x,y:target.y},actor:{x:0,y:0,facing},onImpact:()=>impacts++}));
  assert.equal(V.actionVisual(V.sampleAction(scene,{x:0,y:0},0)).row,row);
  for(let frame=1;frame<=fps*.8;frame++)V.sampleAction(scene,{x:0,y:0},frame*1000/fps);
  assert.equal(impacts,1,`Treasure impact fires once at ${fps} FPS, ${facing}`);
  assert.equal(V.blocksMovement(scene),false,`Treasure action returns to idle at ${fps} FPS, ${facing}`);
 }

 // Exercise the real Hobbies action → frame-17 mining controller → dig reward path.
 const actor={x:303,y:466,facing:'left'};
 for(let strike=1;strike<=5;strike++){
  assert(H.interact('route-cave','d1',actor),'A valid cave crack starts the mining action');
  for(let frame=0;frame<=24;frame++){now+=1000/30;V.sampleAction('route-cave',actor,now)}
  await new Promise(resolve=>setImmediate(resolve));
  if(strike<5){assert.equal(p.inventory['Fragmento Antigo']||0,0,'No reward before the fifth actual impact');assert.equal(H.visibleNodes('route-cave').find(x=>x.id==='d1').hits,strike)}
 }
 assert.equal(p.inventory['Fragmento Antigo'],1,'The fifth impact grants one server-shaped offline reward');
 assert.equal(T.stats().stats.digs,1);
 assert.equal(T.stats().chests.common,1,'Completed dig stores the chest separately from inventory');
 assert.equal(H.visibleNodes('route-cave').some(x=>x.id==='d1'),false,'Completed crack enters cooldown');
 assert.equal(V.blocksMovement('route-cave'),false,'Mining returns the actor to WALK/IDLE');
 assert.equal(T.stats().hobbies.treasureHunter.xp,65);

 // A discovered chest unlocks Looter when opened and awards Hobby XP once.
 const opened=await T.action('open-chest',{tier:'common'});
 assert(opened.ok);assert.equal(opened.xp,60);assert.equal(T.stats().stats.chestsOpened,1);
 assert.equal(T.stats().hobbies.looter.level,1);
 assert.equal(p.inventory['Fragmento Antigo'],2);
 assert(saves>=6,'Actions persist through the existing autosave hook');

 // Online transactions use the authenticated endpoint and never fall back to local rewards.
 let requested=null;
 const onlineSnapshot={ok:true,player:{gold:100,diamonds:0,psycoin:0},inventory:{'Fragmento Antigo':9},system:{treasure_hunt:{hobbies:{treasureHunter:{level:1,xp:65,points:1,skills:{}},looter:{level:1,xp:60,points:1,skills:{}}},sites:{'cave-1':{hits:2,depletedUntil:0}},chests:{common:1},stats:{digs:1,chestsOpened:1},titles:{},cosmetic:{bountyHunter:false,equipped:false}}}};
 W.psyOnlineAuthorityV26={online:()=>true,request:async(...args)=>{requested=args;return args[1]?.payload?.action==='status'?{ok:true,version:1}:onlineSnapshot},state:async()=>onlineSnapshot};
 await T.refresh();assert.equal(T.isAvailable(),true,'Online actions open only after the server migration answers its capability probe');
 const response=await T.action('dig',{site:'cave-1'});
 assert(response.ok);assert.equal(requested[0],'treasure-action');assert.equal(requested[1].payload.action,'dig');
 assert.equal(p.inventory['Fragmento Antigo'],9,'Online inventory is taken from the authoritative snapshot');
 assert.equal(H.visibleNodes('route-cave').find(x=>x.id==='d1').hits,2,'Server site progress is merged to the rendering record');

 W.psyOnlineAuthorityV26.request=async()=>{throw new Error('RPC unavailable')};
 await T.refresh();assert.equal(T.isAvailable(),false,'Missing or unreachable production migration closes the online feature');
 assert.equal(H.visibleNodes('route-1').some(x=>x.kind==='treasureHunter'),false,'Online treasure spots remain hidden until server authority is ready');
 const beforeUnavailable={gold:p.gold,diamonds:p.diamonds,inventory:{...p.inventory}};
 assert.equal(await T.action('dig',{site:'cave-1'}),null,'Unavailable online action fails closed');
 assert.deepEqual({gold:p.gold,diamonds:p.diamonds,inventory:{...p.inventory}},beforeUnavailable,'Failed online authority never falls back to client rewards');
 W.psyOnlineAuthorityV26.request=async(...args)=>{requested=args;return args[1]?.payload?.action==='status'?{ok:true,version:1}:onlineSnapshot};
 await T.refresh();assert.equal(T.isAvailable(),true);

 // Roll costs and prizes are server-owned online; offline accumulator preserves tenths.
 W.psyOnlineAuthorityV26.online=()=>false;
 const local=T.stats(),profile=local.hobbies.looter;profile.level=10;profile.skills={};profile.xp=0;local.cosmetic={bountyHunter:false,equipped:false};
 p.diamonds=1000;random=.5;
 const stonePrize=T.localAction('treasure-roll',{},local);
 assert(stonePrize.ok&&['stones','diamonds','pack'].includes(stonePrize.prize.kind));
 assert.equal(p.diamonds,990,'Treasure Roll charges exactly ten diamonds before its prize');
 random=.96;local.psycoinTenths=0;let tenth;
 for(let i=0;i<10;i++)tenth=T.localAction('treasure-roll',{},local);
 assert.equal(p.psycoin,1,'Ten 0.1 PsyCoin fragments become one whole wallet unit');
 assert.equal(local.psycoinTenths,0);
 random=.999;const costume=T.localAction('treasure-roll',{},local);
 assert.equal(costume.prize.kind,'bountyHunter');assert.equal(local.cosmetic.equipped,true);
 assert.equal(typeof T.drawBountyAura,'function');
 assert(saves>10);
console.log('PASS: cave crack interaction and five timed impacts, single reward, cooldown, chest/Looter XP, route unlock, fail-closed online authority gate, Treasure Roll currency/prize branches and costume state');
})().catch(error=>{console.error(error);process.exitCode=1});
