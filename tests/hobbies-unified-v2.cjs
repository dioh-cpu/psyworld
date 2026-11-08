/* node tests/hobbies-unified-v2.cjs — independent hobbies and Engineer ball ladder */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
await import('../core/battle-loot-rules-v1.js');
const battleLoot=globalThis.PsyBattleLootRulesV1;
assert(battleLoot,'shared battle loot rules import in the test runtime');
const source=fs.readFileSync('core/hobbies-v2.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const world=fs.readFileSync('core/kanto-world-v2.js','utf8');
const old=fs.readFileSync('core/professions-v1.js','utf8');
const legacy=fs.readFileSync('core/legacy-runtime.js','utf8');
const p={meta:{typeKills:{Fogo:100},caughtDex:{4:1,5:1,6:1,37:1,38:1}},gymProgress:['kanto_brock'],inventory:{'Essência Normal':24,'Essência Fogo':102,'Essence Of Fire':102,'Fire Tail':10,'Fire Stone':1},team:[{id:25,level:5,maxExp:100,exp:0}]};
let saveCount=0,fieldXpCount=0;
const W={P:p,PsyBattleLootV1:battleLoot,autoSave:()=>saveCount++,updateHUD:()=>{},notif:()=>{},getTotalBuff:()=>3,
 psyHobbyGrantFieldXp:()=>fieldXpCount++,
 psyHobbyTypesForId:id=>({4:['Fire'],5:['Fire'],6:['Fire','Flying'],37:['Fire'],38:['Fire'],1:['Grass'],27:['Ground'],74:['Rock','Ground']})[id]||[]};
const D={getElementById:()=>null};
vm.runInNewContext(source,{window:W,document:D,P:p,console});
const H=W.PsyHobbies;
assert.equal(H.definitions.length,13);
assert.equal(H.ballLadder.length,18);
for(const job of H.definitions)assert.equal(H.state()[job.id].level,0,'Hobby starts Lv0: '+job.id);
assert.equal(H.exchange('engineer',0),false,'No ball manufacture before unlock');
assert(H.unlock('engineer'));
for(let i=0;i<10;i++)assert(H.exchange('engineer',0),'Normal Ball manufacture '+i);
assert.equal(p.inventory['Normal Ball'],10);
assert.equal(H.levelRequirements('engineer').defeats,0,'Prior kills do not satisfy next level');
assert.equal(H.levelRequirements('engineer').ready,false);
p.meta.typeKills.Fogo=200;
const next=H.levelRequirements('engineer');
assert.equal(next.defeats,100);
assert.equal(next.captured,5);
assert.equal(next.available,102);
assert(next.ready);
assert(H.levelUp('engineer'));
assert.equal(H.state().engineer.level,2);
assert.equal(p.inventory['Essence Of Fire'],77,'Engineer promotion consumes the matching common material');
assert.equal(p.inventory['Fire Tail'],0,'Engineer promotion consumes the matching uncommon material');
assert.equal(p.inventory['Fire Stone'],0,'Engineer promotion consumes the matching stone');
assert.equal(H.exchange('engineer',2),false,'Water Ball locked until Lv3');
assert(H.exchange('engineer',1),'Fire Ball should unlock Lv2');
assert.equal(p.inventory['Fire Ball'],1);
assert.equal(H.state().gardener.level,0,'No exclusive choices or automatic unlocks');
assert.equal(H.collect('route-1','f1'),false,'Do not gather flowers before gardener unlock');
H.state().gardener.level=1;
assert(H.collect('route-1','f1'),'Unlocked gardener can harvest a flower spot');
assert.equal(p.inventory['Flor do Campo'],1,'Flower goes into real inventory');
assert.equal(p.meta.hobbyGatherTotalsV1.gardener,1,'Flower collection is counted');
assert.equal(H.visibleNodes('route-1').some(n=>n.id==='f1'),false,'Harvested spot enters cooldown');
H.state().lumber.level=1;
for(let i=0;i<4;i++)assert(H.collect('route-1','t1'),'Logging hit '+(i+1));
assert.equal(p.inventory['Madeira Bruta']||0,0,'Partial hits must not award material');
assert.equal(H.visibleNodes('route-1').find(n=>n.id==='t1').hits,4);
assert(H.collect('route-1','t1'),'Fifth logging hit completes collection');
assert.equal(p.inventory['Madeira Bruta'],1,'Timber enters inventory');
assert.equal(p.meta.hobbyGatherTotalsV1.lumber,1,'Completed logging counts exactly once');
assert(fieldXpCount>=2,'Completed spots must grant trainer/Pokemon XP');
assert(H.canFish('route-1',{x:100,y:420},null),'Fish action near visible water');
assert(W.getTotalBuff('cap')>3,'Hobby stats apply globally');
for(const label of ['Minerador','Jardineiro','Pescador','Lenhador','Engenheiro','Herborista','Alquimista'])
 assert(H.definitions.some(x=>x.name===label),'Missing hobby '+label);
assert(!world.includes('data-kw2-panel="professions"'),'Old professions button must be removed');
assert(world.includes('data-kw2-panel="hobbies"'));
assert(index.includes('core/hobbies-v2.js?build='));
assert(!index.includes('src="core/hobbies-v1.js?'));
assert(old.includes("if(s!=='idle')return false"),'No more main-game career/craft');
assert(legacy.includes('psyHobbyGrantFieldXp'),'Field collection must grant trainer & Pokemon XP');
for(const id of ['miner','gardener','fisher','lumber','alchemist'])
 assert(fs.existsSync('assets/hobbies/'+id+'.svg'));
for(const id of ['engineer','herbalist','researcher','professor','stylist','echo','dream','twilight'])
 assert(fs.existsSync('assets/professions/'+id+'.webp'));
assert(saveCount>0);
console.log('PASS: 13 independent hobbies, Engineer 100/5/100 progression and typed materials, ball tiers, artwork, no main craft, field hooks and buffs');
})().catch(error=>{console.error(error);process.exitCode=1});
