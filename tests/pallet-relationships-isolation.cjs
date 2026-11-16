const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync('core/legacy-runtime.js','utf8');
const helper=code.slice(0,code.indexOf('\n}',code.indexOf('function psyLoadRelationships'))+2);
const ctx={};vm.createContext(ctx);vm.runInContext(helper,ctx);
const a={unknown:{preserved:42},palletRelationships:{version:1,npcs:{nina:{points:30}},future:{x:1}}};
const saved=JSON.parse(JSON.stringify(a)),live={};
for(const legacy of [false,true]){
 const load=s=>{if(!legacy)Object.assign(live,s);else live.unknown=s.unknown;ctx.psyLoadRelationships(live,s)};
 load(saved);assert.equal(live.palletRelationships.npcs.nina.points,30);
 load({unknown:{preserved:99}});assert.equal(live.palletRelationships.npcs.nina,undefined);assert.equal(live.unknown.preserved,99);
 load(saved);assert.equal(live.palletRelationships.npcs.nina.points,30);live.palletRelationships.npcs.nina.points=40;
 assert.equal(saved.palletRelationships.npcs.nina.points,30);assert.equal(live.palletRelationships.future.x,1);
}
assert.equal((code.match(/psyLoadRelationships\(P,/g)||[]).length,6);
new vm.Script(code);new vm.Script(fs.readFileSync('core/kanto-world-v2.js','utf8'));
console.log('PASS: A/B/A, legacy, old saves, detached objects, unknown fields and classic-script parsing');
