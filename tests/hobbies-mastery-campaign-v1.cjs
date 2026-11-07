/* PSYWORLD — mastery and campaign overlay regression
 * node tests/hobbies-mastery-campaign-v1.cjs
 * No collectible-spot or animation behavior is changed by this test.
 */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const hobby=fs.readFileSync('core/hobbies-v2.js','utf8');
const mastery=fs.readFileSync('core/hobby-mastery-v1.js','utf8');
const campaign=fs.readFileSync('core/kanto-world-v2.js','utf8');
const playable=fs.readFileSync('core/kanto-campaign-playable-v1.js','utf8');
const titles=fs.readFileSync('core/titles-progression-v2.js','utf8');
const css=fs.readFileSync('css/hobby-campaign-v1.css','utf8');
new Function(mastery);
for(const path of ['core/hobbies-v2.js','core/kanto-world-v2.js','core/kanto-campaign-playable-v1.js','core/titles-progression-v2.js'])new Function(fs.readFileSync(path,'utf8'));
const indexOfAsset=v=>html.indexOf(v);
for(const v of ['css/hobbies-v1.css?','css/hobby-campaign-v1.css?','core/hobbies-v2.js?','core/hobby-mastery-v1.js?'])assert(indexOfAsset(v)>-1,'Missing asset '+v);
assert(indexOfAsset('css/hobbies-v1.css?')<indexOfAsset('css/hobby-campaign-v1.css?'),'Fantasy CSS must follow legacy Hobbies styles');
assert(indexOfAsset('core/hobbies-v2.js?')<indexOfAsset('core/hobby-mastery-v1.js?'),'Mastery must load after Hobbies');
assert((html.match(/src="core\/hobby-mastery-v1\.js\?/g)||[]).length===1,'Mastery script duplicated');
assert(hobby.includes("W.PsyHobbyMastery?.renderInto?.(details,j.id,render)"),'Mastery should display inside the established Hobbies panel');
assert(hobby.includes("suspendForPanel?.('psy-hobbies')"),'Campaign should stop while Hobbies panel is open');
assert(campaign.includes('data-kw2-panel="titles"'),'Titles should be accessible from the campaign');
assert(campaign.includes("titles:{fn:()=>W.PsyTitles?.open?.(),id:'psy-titles-panel'}"),'Titles should be managed as an external campaign panel');
assert(titles.includes("root.id='psy-titles-panel'"),'Titles overlay must expose a stable ID');
assert(campaign.includes("state.root.style.visibility='hidden'")&&campaign.includes("state.root.style.visibility=''"),'External overlay must hide and restore campaign canvas');
assert(playable.includes('W.PsyHobbies?.isOpen?.()||W.PsyTitles?.isOpen?.()'),'Classic campaign should pause when overlays are visible');
assert(css.includes('.ph-mastery-tree')&&css.includes('.ph-rarity-tier')&&css.includes('.psy-titles-panel'),'Mastery and title gallery need responsive styling');
assert(css.includes('@media(max-width:520px)')&&css.includes('@media(max-height:500px)'),'Both portrait and landscape styles are required');
assert(css.includes('prefers-reduced-motion'),'Accessibility motion preference must be respected');
// Only Codex changes the collectible-spot and animation mechanics.
assert(!hobby.includes('PsyHobbyMastery?.rollNextSpot'),'Rare spot mechanics must remain outside this UI patch');
assert(hobby.includes("hit=node.kind==='miner'||node.kind==='lumber'?count(record.hits)+1:5"),'Keep existing five-hit spot mechanic');
assert(hobby.includes("const pick=Math.random(),item=lvl>=10"),'Keep existing fishing reward logic');
const names=['miner','gardener','fisher','lumber','engineer','herbalist','researcher','professor','stylist','echo','dream','twilight','alchemist'];
const p={inventory:{},team:[{id:1}],meta:{auxHobbiesV1:Object.fromEntries(names.map(id=>[id,{level:1,xp:0,base:{}}]))}};
let saves=0;
const W={P:p,autoSave:()=>saves++,notif:()=>{},
 PsyHobbies:{state:()=>p.meta.auxHobbiesV1,definitions:names.map(id=>({id,name:id,art:id,starter:['miner','gardener','fisher','lumber'].includes(id),stat:id==='engineer'?'cap':'atk'}))}};
vm.runInNewContext(mastery,{window:W,document:{},P:p,console,Math});
const M=W.PsyHobbyMastery;
assert(M);
for(const id of names){assert(M.skillDefs(id).length>=3,'Missing skill tree '+id);assert.equal(M.points(id),1,'Level 1 should award exactly one point to '+id)}
assert(M.canBuy('miner','strike'),'First Miner node is available at level 1');
assert.equal(M.canBuy('miner','radar'),false,'Prerequisite node must be purchased first');
assert(M.buy('miner','strike'),'First Miner node can be bought');
assert.equal(M.rank('miner','strike'),1);
assert.equal(M.points('miner'),0,'Point spend must be isolated to Minerador');
assert.equal(M.points('gardener'),1,'No other Hobby points may be consumed');
assert.equal(M.buy('miner','strike'),false,'Exhausted points cannot be spent twice');
p.meta.auxHobbiesV1.miner.level=2;
assert.equal(M.points('miner'),1,'A newly reached Hobby level awards one additional point');
assert(M.canBuy('miner','radar'),'Radar is available after prerequisite and level 2');
assert(M.buy('miner','radar'));
assert.equal(M.points('miner'),0);
assert.equal(M.buy('miner','vein'),false,'Cannot overspend points');
const expected=JSON.parse(JSON.stringify(p.meta.hobbyMasteryV1));
const W2={P:p,autoSave:W.autoSave,notif:W.notif,PsyHobbies:W.PsyHobbies};
vm.runInNewContext(mastery,{window:W2,document:{},P:p,console,Math});
assert.deepEqual(JSON.parse(JSON.stringify(p.meta.hobbyMasteryV1)),expected,'Reload must preserve skills');
assert.equal(W2.PsyHobbyMastery.rank('miner','radar'),1,'Unlocked node persists across reload');
assert(saves>=2,'Node unlocks should save progress');
assert(!mastery.includes('function rollNextSpot('),'Spot spawning must remain owned by Codex');
assert(!mastery.includes('function respawnFactor('),'Spot respawn must remain owned by Codex');
assert(hobby.includes('PsyHobbyMastery?.statBonus?.(k)'),'Non-spot mastery bonuses should apply through the existing buff getter');
assert(M.buy('professor','base'),'Professor baseline skill should be unlockable');
assert.equal(M.statBonus('atk'),.25,'Generic hobby stat node should grant its non-spot bonus');
class FakeEl{
 constructor(tag){this.tagName=tag;this.children=[];this.style={setProperty:(k,v)=>{(this.vars||(this.vars={}))[k]=v}}}
 appendChild(el){this.children.push(el);return el}
 append(...els){for(const el of els)this.appendChild(el)}
 setAttribute(name,val){(this.attributes||(this.attributes={}))[name]=val}
}
const D={createElement:tag=>new FakeEl(tag)};
const W3={P:p,autoSave:W.autoSave,notif:W.notif,PsyHobbies:W.PsyHobbies};
vm.runInNewContext(mastery,{window:W3,document:D,P:p,console,Math});
function all(el,cls){return (el.className?.split(' ').includes(cls)?[el]:[]).concat(...(el.children||[]).map(child=>all(child,cls)))}
for(const id of ['miner','gardener','fisher','lumber','engineer']){
 const host=new FakeEl('section');
 W3.PsyHobbyMastery.renderInto(host,id,()=>{});
 assert.equal(all(host,'ph-mastery').length,1,'Mastery panel must render for '+id);
 assert.equal(all(host,'ph-skill-node').length,W3.PsyHobbyMastery.skillDefs(id).length,'Every skill node must render for '+id);
 assert.equal(all(host,'ph-rarity-tier').length,['miner','gardener','fisher','lumber'].includes(id)?4:0,'Rarity art preview only on gather specialties');
}
const host=new FakeEl('section');let refreshes=0;
W3.PsyHobbyMastery.renderInto(host,'gardener',()=>refreshes++);
const ready=all(host,'ph-skill-node').find(node=>typeof node.onclick==='function');
assert(ready,'Available skills should have a working unlock action');
ready.onclick();
assert.equal(refreshes,1,'Unlock should refresh mastery panel');
assert.equal(W3.PsyHobbyMastery.rank('gardener','botany'),1,'UI action should persist node rank');
console.log('PASS: 13 per-Hobby skill trees, isolated point ledger, prerequisites, persistence, responsive menus, title navigation, and Codex spot isolation');
