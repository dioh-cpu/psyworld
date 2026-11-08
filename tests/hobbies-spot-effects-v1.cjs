/* Production Hobbies spot effects and animation timing regression.
 * node tests/hobbies-spot-effects-v1.cjs
 */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const hobbySource=fs.readFileSync('core/hobbies-v2.js','utf8');
const masterySource=fs.readFileSync('core/hobby-mastery-v1.js','utf8');
const vfxSource=fs.readFileSync('core/hobbies-vfx-v1.js','utf8');
const handoffSource=fs.readFileSync('core/hobby-spot-effects-v1.js','utf8');
const mapSource=fs.readFileSync('core/kanto-map-data-v2.js','utf8');
for(const src of [hobbySource,masterySource,vfxSource,handoffSource,mapSource])new Function(src);
const toolManifest=JSON.parse(fs.readFileSync('assets/hobbies/tools/manifest.json','utf8'));
assert.deepEqual(toolManifest.materials,['copper','iron','silver','gold','coal','ruby','sapphire','jade']);
for(const type of toolManifest.tools)for(const material of toolManifest.materials){
 const bytes=fs.readFileSync(`assets/hobbies/tools/${type}-${material}.png`);
 assert.equal(bytes.readUInt32BE(16),64,`${type}-${material} width`);
 assert.equal(bytes.readUInt32BE(20),64,`${type}-${material} height`);
 assert.equal(bytes[25],6,`${type}-${material} must preserve RGBA transparency`);
}

const ids=['miner','lumber','gardener','fisher','engineer','herbalist','researcher','professor','stylist','echo','dream','twilight','alchemist','treasureHunter','looter'];
const p={inventory:{},team:[{id:1,level:5,exp:0}],meta:{auxHobbiesV1:Object.fromEntries(ids.map(id=>[id,{level:1,xp:0,base:{}}]))}};
let now=0,saves=0,fieldXp=[],sounds=[];
const math=Object.create(Math);let random=()=>.5;math.random=()=>random();
class FakeImage{set src(value){this._src=value}get src(){return this._src}}
const W={P:p,Image:FakeImage,performance:{now:()=>now},matchMedia:()=>({matches:false}),
 PsyKantoJourneyV1:{places:[{id:'route-3',kind:'route'},{id:'route-4',kind:'route'},{id:'mt-moon',kind:'dungeon'},{id:'diglett-cave',kind:'dungeon'}]},
 autoSave:()=>saves++,updateHUD:()=>{},notif:()=>{},psyHobbyGrantFieldXp:(trainer,mon)=>fieldXp.push([trainer,mon]),
 psyAudio:{sfx:name=>sounds.push(name)},
 PsyKantoWorldV2:{setStoryLock:()=>{}},requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{}};
const D={getElementById:()=>null,createElement:()=>({})};
const load=(src)=>vm.runInNewContext(src,{window:W,document:D,P:p,console,Math:math,Date,Map,Set,WeakMap,Image:FakeImage});
load(hobbySource);load(masterySource);
const H=W.PsyHobbies,M=W.PsyHobbyMastery;
assert(H&&M);
assert.equal(H.visibleNodes('route-2').length,7,'Route 2 has seven separated field spots');
assert.equal(H.visibleNodes('viridian-forest').length,7,'Viridian Forest has seven separated field spots');
assert.equal(H.visibleNodes('route-3').length,7,'route templates provide seven field spots');
assert.equal(H.visibleNodes('route-4').length,7,'later routes provide seven field spots');
assert.equal(H.visibleNodes('mt-moon').length,11,'Mt. Moon has distributed ores, flowers along the cave walls and excavation soil');
assert.equal(H.visibleNodes('diglett-cave').length,9,'cave areas receive ores, wall flowers and excavation soil');
assert.equal(H.visibleNodes('route-cave').length,9,'Crystal Grotto combines ores, wall flowers and excavation soil');
assert.equal(H.visibleNodes('kanto-hunt-rift').length,15,'the hunt rift combines spaced mining, lumber, flowers, treasure cracks and the existing fishing minigame');
assert.deepEqual([...new Set(H.visibleNodes('kanto-hunt-rift').map(n=>n.kind))].sort(),['gardener','lumber','miner','treasureHunter'],'rift spot types use the supported gathering actions; fishing remains the real water minigame');
for(const kind of ['miner','lumber','gardener'])assert(H.spotEffects.respawnDelay(kind,'kanto-hunt-rift')>=3500&&H.spotEffects.respawnDelay(kind,'kanto-hunt-rift')<=5500,kind+' rift spots respawn individually within 3.5–5.5 seconds');
assert(H.canFish('kanto-hunt-rift',{x:700,y:275}), 'the rift pond enables the existing fishing minigame from its walkable bank');
assert.equal(M.canBuy('miner','strike'),false,'Spot skills remain protected until production effects register');
load(mapSource);load(vfxSource);load(handoffSource);
assert.equal(W.PsyHobbyMasterySpotReady,true,'All four Hobby effects should pass the capability handoff');
assert.deepEqual(Array.from(W.PsyHobbySpotEffects.activities),['miner','lumber','gardener','fisher']);
assert.equal(W.PsyHobbySpotEffects.earlyMineReachable,true,'The early Route 1 mining node has a collision-safe interaction point');
assert(W.PsyHobbySpotEffects.limitations.oreStrike===true&&W.PsyHobbySpotEffects.limitations.woodChopping===true,
 'The capability report must match the implemented miner and lumber actions');
assert.equal(Object.keys(W.PsyHobbiesVFX.debug().tools).length,16,'All material-specific tools are registered by the VFX layer');

// Production action callback is elapsed-time based and fires once at contact.
for(const fps of [30,60,120]){
 now=0;let impactCount=0,impactAt=null;
 assert(W.PsyHobbiesVFX.beginAction({scene:'fps-'+fps,node:{id:'flower',kind:'gardener',x:0,y:0},actor:{x:0,y:20,facing:'up'},onImpact:()=>{impactCount++;impactAt=now}}));
 assert.equal(W.PsyHobbiesVFX.sampleAction('fps-'+fps,{x:0,y:20}).frame,0,'Every sample starts from the neutral pose');
 for(let frame=1;frame<=fps;frame++){
  now=frame*1000/fps;
  W.PsyHobbiesVFX.sampleAction('fps-'+fps,{x:0,y:20});
 }
 assert.equal(impactCount,1,'Impact callback must fire once at '+fps+' FPS');
 assert(Math.abs(impactAt-1000*11/30)<=1000/fps+.01,'Impact time drifted at '+fps+' FPS: '+impactAt);
 assert.equal(W.PsyHobbiesVFX.blocksMovement('fps-'+fps),false,'Action lock must clear back to IDLE after completion');
}
const directions=[
 ['down',{x:0,y:0},{x:0,y:24},0],['left',{x:0,y:0},{x:-24,y:0},1],
 ['right',{x:0,y:0},{x:24,y:0},2],['up',{x:0,y:0},{x:0,y:-24},3]
];
for(const fps of [30,60,120])for(const kind of ['miner','lumber'])for(const [facing,actor,target,row] of directions){
 now=0;let impacts=0,impactAt=null;const scene=`${kind}-${facing}-${fps}`;
 assert(W.PsyHobbiesVFX.beginAction({scene,node:{id:'spot',kind,x:target.x,y:target.y},actor:{...actor,facing},onImpact:()=>{impacts++;impactAt=now}}));
 assert.equal(W.PsyHobbiesVFX.actionVisual(W.PsyHobbiesVFX.sampleAction(scene,{x:actor.x,y:actor.y})).row,row,`${kind} must face ${facing}`);
 for(let frame=1;frame<=fps;frame++){now=frame*1000/fps;W.PsyHobbiesVFX.sampleAction(scene,{x:actor.x,y:actor.y})}
 assert.equal(impacts,1,`${kind} impact must fire exactly once at ${facing}, ${fps} FPS`);
 assert(Math.abs(impactAt-1000*17/30)<=1000/fps+.01,`${kind} impact frame drifted at ${facing}, ${fps} FPS: ${impactAt}`);
 assert.equal(W.PsyHobbiesVFX.blocksMovement(scene),false,`${kind} returns to normal movement at ${facing}`);
}
now=0;let lateImpact=0;
assert(W.PsyHobbiesVFX.beginAction({scene:'background-return',node:{id:'flower',kind:'gardener',x:2,y:3},actor:{x:2,y:20},onImpact:()=>lateImpact++}));
W.PsyHobbiesVFX.sampleAction('background-return',{x:2,y:20},5000);
assert.equal(lateImpact,0,'A long background-tab delta must be capped, not skip action phases');
assert(W.PsyHobbiesVFX.blocksMovement('background-return'));
W.PsyHobbiesVFX.cancelAction('background-return');
now=0;let cancelledImpact=0;
assert(W.PsyHobbiesVFX.beginAction({scene:'cancel',node:{id:'flower',kind:'gardener',x:1,y:2},actor:{x:1,y:10},onImpact:()=>cancelledImpact++}));
assert.equal(W.PsyHobbiesVFX.sampleAction('cancel',{x:12,y:10}),null,'Moved actor cancels the staged visual action');
assert.equal(cancelledImpact,0,'A cancelled pose must not collect');

// Spot rewards retain the current five interactions until the corresponding
// mastery rank is purchased. No partial hit adds items or XP.
const mine=H.visibleNodes('route-cave').find(n=>n.id==='o1');
assert.equal(mine.totalHits,5);
const itemFor={miner:{common:'Minério Bruto',rare:'Minério Luminoso',epic:'Cristal Arcano',legend:'Cristal Lendário'},
 lumber:{common:'Madeira Bruta',rare:'Madeira Encantada',epic:'Tronco Rúnico',legend:'Madeira Celestial'},
 gardener:{common:'Flor do Campo',rare:'Flor Encantada',epic:'Flor Astral',legend:'Flor Lendária'},
 fisher:{common:'Peixe de Rio',rare:'Carpa Prateada',epic:'Peixe Cristalino',legend:'Peixe Dourado'}};
for(let hit=1;hit<5;hit++){
 assert(H.collect('route-cave','o1'));
 assert.equal(Object.values(p.inventory).reduce((sum,n)=>sum+n,0),0,'No material before the fifth base hit');
 assert.equal(p.meta.auxHobbiesV1.miner.xp,0,'No Hobby XP before collection completes');
}
assert(H.collect('route-cave','o1'));
assert.equal(p.inventory[itemFor.miner[mine.rarity]],1,'The existing mastery preview maps to the actual item');
assert.equal(p.meta.auxHobbiesV1.miner.xp,16);
assert.equal(p.meta.hobbyGatherTotalsV1.miner,1,'A completed collection counts once');
assert.deepEqual(fieldXp.at(-1),[18,8]);
assert.equal(H.collect('route-cave','o1'),false,'A cooldown node cannot grant a duplicate item');
assert(sounds.includes('rock'),'The impact event uses the registered rock sound');
assert(saves>=6,'Collection changes use the existing autosave contract');

// Production interactions stage the tool actions before collecting. Frame-17
// contact advances the real spot exactly once, then restores WALK/IDLE input.
now=0;
assert(H.interact('route-1','o1',{x:335,y:290,facing:'up'}));
assert(W.PsyHobbiesVFX.blocksMovement('route-1'));
assert.equal(H.visibleNodes('route-1').find(n=>n.id==='o1').hits,0,'Mining progress waits for tool contact');
for(let frame=1;frame<=24;frame++){now=frame*1000/30;W.PsyHobbiesVFX.sampleAction('route-1',{x:335,y:290})}
assert.equal(H.visibleNodes('route-1').find(n=>n.id==='o1').hits,1,'The mining impact counts one real spot hit');
assert.equal(W.PsyHobbiesVFX.blocksMovement('route-1'),false,'Mining restores normal movement after recovery');
now=0;
assert(H.interact('route-2','t1',{x:440,y:280,facing:'right'}));
assert(W.PsyHobbiesVFX.blocksMovement('route-2'));
for(let frame=1;frame<=24;frame++){now=frame*1000/30;W.PsyHobbiesVFX.sampleAction('route-2',{x:440,y:280})}
assert.equal(H.visibleNodes('route-2').find(n=>n.id==='t1').hits,1,'The chopping impact advances the real tree state once');
assert.equal(W.PsyHobbiesVFX.blocksMovement('route-2'),false,'Chopping restores normal movement after recovery');

assert(W.PsyKantoMapDataV2.walkable(W.PsyKantoMapDataV2.route1,335,290),'The added Route 1 mine spot can be approached from authored walkable ground');
assert.equal(H.nearby('route-1',{x:335,y:290},65)?.id,'o1','The early-route mining spot is the nearest valid interaction');

// Rank effects control the corresponding production behavior and remain
// hobby-local. Rarity odds are measured over deterministic spot respawns.
assert(M.buy('miner','strike'));
assert.equal(H.requiredHits('miner'),4);
assert.equal(H.requiredHits('lumber'),5,'Miner points cannot alter Lumber hit count');
p.meta.auxHobbiesV1.miner.level=2;
assert(M.buy('miner','radar'));
assert.equal(M.effect('miner','rare'),1);
const displayed=M.chances('miner');
const samples=40000,seen={common:0,rare:0,epic:0,legend:0};
for(let i=1;i<=samples;i++)seen[H.rarityForSpot('route-1','audit-'+i,'miner',{respawnAt:i})]++;
for(const rarity of Object.keys(seen))assert(Math.abs(seen[rarity]*100/samples-displayed[rarity])<1.25,
 rarity+' spot odds differ from Mastery preview: '+seen[rarity]*100/samples+' vs '+displayed[rarity]);
assert.equal(H.visibleNodes('route-1').find(n=>n.id==='t1').totalHits,5);
assert(M.buy('lumber','blade'));
assert.equal(H.requiredHits('lumber'),4);
const tree=H.visibleNodes('route-1').find(n=>n.id==='t1');
for(let hit=1;hit<4;hit++)assert(H.collect('route-1','t1'));
assert.equal(p.inventory[itemFor.lumber[tree.rarity]]||0,0,'The timber reward waits for its rank-adjusted final hit');
assert(H.collect('route-1','t1'));
assert.equal(p.inventory[itemFor.lumber[tree.rarity]],1,'Lumber collection grants exactly one rarity-matched item');
assert.equal(M.points('gardener'),1,'Skill points remain isolated per Hobby');
assert(sounds.includes('hit'),'Lumber impacts use the existing hit sound');

// Incremental quantity skill uses a bounded bonus chance. Fishing reward rolls
// follow the same public mastery percentages shown by the menu.
assert(M.buy('gardener','botany'));
random=()=>.03;
assert.equal(H.spotEffects.rewardFor('gardener','common').quantity,2,'One Botany rank gives the implemented 4% bonus-item chance');
random=()=>.5;
assert(M.buy('fisher','bait'));
assert.equal(M.chances('fisher').rare,7.9,'One bait rank adds the configured 0.9 percentage points');
let seed=0x98765432;random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296};
const fishChances=M.chances('fisher'),fishSeen={common:0,rare:0,epic:0,legend:0};
for(let i=0;i<50000;i++)fishSeen[H.rollReward('fisher').rarity]++;
for(const rarity of Object.keys(fishSeen))assert(Math.abs(fishSeen[rarity]*100/50000-fishChances[rarity])<.8,
 'Fishing '+rarity+' odds differ from its preview');

// A flower interaction is a real timed production action. It does not award
// before contact, fires exactly once, and returns to free movement/IDLE.
now=0;random=()=>.5;
const flower=H.visibleNodes('route-1').find(n=>n.id==='f1'),beforeFlower=p.inventory[itemFor.gardener[flower.rarity]]||0;
assert(H.interact('route-1','f1',{x:flower.x-30,y:flower.y,facing:'right'}));
assert(W.PsyHobbiesVFX.blocksMovement('route-1'));
assert.equal(p.inventory[itemFor.gardener[flower.rarity]]||0,beforeFlower,'Flower is not awarded before the reach/contact pose');
for(let frame=1;frame<=30;frame++){now=frame*1000/30;W.PsyHobbiesVFX.sampleAction('route-1',{x:flower.x-30,y:flower.y})}
assert.equal(p.inventory[itemFor.gardener[flower.rarity]],beforeFlower+1,'The timed impact awards one flower');
assert.equal(p.meta.hobbyGatherTotalsV1.gardener,1);
assert.equal(W.PsyHobbiesVFX.blocksMovement('route-1'),false);
assert(W.PsyHobbiesVFX.debug().particles>0,'The collected spot emitted bounded transient particles');
assert(sounds.includes('grass'),'Flower collection uses the existing grass sound');

for(let i=0;i<40;i++)W.PsyHobbiesVFX.onSpotHit({scene:'stress',node:{id:'ore-'+i,kind:'miner',x:i,y:4},hit:1});
assert.equal(W.PsyHobbiesVFX.debug().particles,144,'Repeated hits must respect the fixed particle pool cap');

// Render field effects without spots so water maps still receive their line,
// bobber and ripple layer; fishing locks movement until its real minigame ends.
const fishActor={x:132,y:431,facing:'left'};
assert(W.PsyHobbiesVFX.startFishing('pallet',fishActor));
assert(W.PsyHobbiesVFX.blocksMovement('pallet'));
W.PsyHobbiesVFX.updateFishing('pallet',{meter:.5,progress:.2,green:true,reeling:true});
const ctx=new Proxy({}, {get:(target,key)=>target[key]||(target[key]=()=>{}) ,set:(target,key,value)=>(target[key]=value,true)});
ctx.beginPath=()=>{};ctx.ellipse=()=>{};ctx.arc=()=>{};ctx.moveTo=()=>{};ctx.quadraticCurveTo=()=>{};ctx.stroke=()=>{};ctx.fill=()=>{};ctx.save=()=>{};ctx.restore=()=>{};ctx.translate=()=>{};ctx.rotate=()=>{};ctx.drawImage=()=>{};ctx.fillRect=()=>{};ctx.roundRect=()=>{};ctx.closePath=()=>{};ctx.lineTo=()=>{};ctx.clip=()=>{};ctx.fillText=()=>{};
assert.doesNotThrow(()=>W.PsyHobbiesVFX.drawField(ctx,'pallet'),'Water-only maps must render the active fishing line');
W.PsyHobbiesVFX.finishFishing('pallet',true);
assert.equal(W.PsyHobbiesVFX.blocksMovement('pallet'),false,'Fishing movement lock clears when the minigame ends');
assert.equal(p.meta.hobbyGatherTotalsV1.gardener,1);
assert(sounds.includes('water'),'Fishing casts and catches use the existing water sound');

console.log('PASS: all 16 transparent tool sprites, four-direction miner/lumber impacts at 30/60/120 FPS, mastery skills, collection rewards, rarity odds, flower action, autosave and fishing rendering');
