/* Species-derived battle loot, guaranteed commons, bounded Drop scaling. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
(async()=>{
await import('../core/battle-loot-rules-v1.js');
const rules=globalThis.PsyBattleLootRulesV1;
assert(rules,'shared loot rules load as an ES module and publish the browser global');
assert.equal(rules.rates(-10).drop,0);
assert.equal(rules.rates(0).uncommon,.30);
assert.equal(rules.rates(0).stone,.01);
assert.equal(rules.rates(300).uncommon,.50);
assert(Math.abs(rules.rates(300).stone-.10)<1e-12);
assert(Math.abs(rules.rates(900).stone-.10)<1e-12,'Drop is clamped at 300');
for(const drop of [0,1,100,200,300,999]){
  const min=rules.commonQuantity(drop,()=>0),max=rules.commonQuantity(drop,()=>1);
  assert(min>=1&&min<=10,`common lower bound at Drop ${drop}`);
  assert(max>=1&&max<=10,`common upper bound at Drop ${drop}`);
}
assert.equal(rules.commonQuantity(0,()=>0),1,'common material has a guaranteed quantity at zero Drop');
assert.equal(rules.commonQuantity(300,()=>0),10,'maximum Drop reaches ten guaranteed common units');
assert.equal(rules.primaryType('Normal/Flying'),'Flying','species-specific secondary type overrides generic Normal');
assert.equal(rules.forType('Normal/Flying').stone,'Flying Stone');
assert.equal(rules.forType('Normal').stone,'Heart Stone');

  const {battleTypeForSpecies,speciesTypeCatalogSize}=await import('../api/_lib/pokemon-types-v1.js');
  assert.equal(battleTypeForSpecies(16),'Flying','Pidgey is resolved from the server-side species catalog');
  assert.equal(battleTypeForSpecies(19),'Normal','Rattata is resolved from the server-side species catalog');
  assert.equal(battleTypeForSpecies(0),null);
  assert(speciesTypeCatalogSize()>1000,'canonical species catalog is complete for the active Pokédex');

  const src=fs.readFileSync('core/shared-mode-drops-v1.js','utf8');
  const main={inventory:{},meta:{}};
  const fixedMath=Object.create(Math);fixedMath.random=()=>0;
  const W={P:main,PSY:{},PsyBattleLootRulesV1:rules,TYPE_BY_ID_FULL:{16:'Normal/Voador',19:'Normal',12:'Inseto/Voador'},
    autoSave(){},updateHUD(){},notif(){},getTotalBuff(){return 0},PsyProfessions:{onKill(){}},PsySeason:{award(){},loot(){}}};
  vm.runInNewContext(src,{window:W,P:main,Math:fixedMath,console,Map,WeakSet,Number,String,Array,Object,JSON,Date,decodeURIComponent,encodeURIComponent});
  assert.deepEqual(Array.from(W.PSY.sharedModeDrops.dropTableForId({id:16,type:'Normal'},'wild').entries,x=>x.name),['Straw','Feather','Flying Stone']);
  assert.deepEqual(Array.from(W.PSY.sharedModeDrops.dropTableForId({id:19,type:'Flying'},'wild').entries,x=>x.name),['Rubber Ball','Giant Piece Of Fur','Heart Stone']);
  W.psySharedCombatDrop({id:16,type:'Normal'},'wild');
  assert.equal(main.inventory.Straw,1,'Pidgey gives its guaranteed common crafting item');
  assert.equal(main.inventory.Feather,1,'Pidgey gives the typed uncommon item when the roll succeeds');
  assert.equal(main.inventory['Flying Stone'],1,'Pidgey can only roll its matching stone');
  assert.equal(main.inventory['Heart Stone']||0,0,'Pidgey does not receive Rattata’s Normal-type stone');
  assert.equal(main.inventory['Bug Stone']||0,0,'unrelated evolution stones are never added');

  const api=fs.readFileSync('api/game.js','utf8'),sql=fs.readFileSync('supabase/migrations/20261108045938_campaign_species_battle_loot_v1.sql','utf8');
  assert(api.includes("if(!['wild','hunt','fast','world'].includes(mode))"),'server API validates battle mode');
  assert(api.includes("p_enemy_type:enemyType"),'server derives species type instead of trusting the client');
  assert(sql.includes("('wild','hunt','fast','world')"),'RPC independently validates battle mode');
  assert(sql.includes("uncommon_chance := .30 + .20 * drop_value / 300"));
  assert(sql.includes("stone_chance := .01 + .09 * drop_value / 300"));
  assert(sql.includes('perform apply_wallet_delta_v24(p_user, \'gold\', gold_reward'),'battle reward continues through the authoritative wallet');
  assert(sql.includes('game_action_receipts'),'battle reward is idempotent');
  assert(sql.includes('to service_role'),'new RPC is server-only');
  const legacy=fs.readFileSync('core/legacy-runtime.js','utf8');
  assert.equal((legacy.match(/if\(!accountBattleReward\)P\.gold\+=finalGold;/g)||[]).length,2,'World battle avoids a local optimistic gold award online');
  console.log('PASS: canonical species, typed loot, rates 30–50% / 1–10%, common quantity 1–10, authoritative gold, server-only idempotent RPC');
})().catch(error=>{console.error(error);process.exitCode=1});
