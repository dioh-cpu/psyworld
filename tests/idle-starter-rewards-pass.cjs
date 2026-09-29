const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'modes/idle-realistic-v1.js'), 'utf8');
const passStart = source.indexOf('function idlePassRewards(');
const passEnd = source.indexOf('function idleBallMultiplier(', passStart);
assert.ok(passStart >= 0 && passEnd > passStart, 'battle pass reward rules exist');
const passContext = { TYPE_ORDER: ['Normal', 'Fire', 'Water', 'Grass'], Math };
vm.runInNewContext(source.slice(passStart, passEnd), passContext);
for (let level = 5; level <= 100; level += 5) {
  assert.ok(passContext.idlePassRewards(level, 'free').some(reward => reward.kind === 'boost'), `free tier ${level} includes a boost`);
  assert.ok(passContext.idlePassRewards(level, 'premium').some(reward => reward.kind === 'boost'), `premium tier ${level} includes a boost`);
}
assert.ok(passContext.idlePassRewards(100, 'free').some(reward => reward.kind === 'starterBox'), 'free pass level 100 grants the regional shiny starter box');
for (let level = 1; level <= 100; level++) assert.ok(passContext.idlePassRewards(level, 'free').some(reward => reward.kind === 'item' && / Ball$/.test(reward.item)), `free tier ${level} includes an elemental ball`);
const freeRewards = Array.from({ length: 100 }, (_, i) => passContext.idlePassRewards(i + 1, 'free')).flat();
assert.ok(freeRewards.some(reward => reward.kind === 'item' && reward.item === 'Boost Stone'), 'free pass awards Boost Stones');
assert.ok(freeRewards.some(reward => reward.kind === 'item' && reward.item === 'Shiny Stone'), 'free pass awards Shiny Stones');
assert.ok(freeRewards.some(reward => reward.kind === 'item' && reward.item === 'Mega Stone Fragment'), 'free pass awards Mega Stone Fragments');
assert.ok(Array.from({ length: 100 }, (_, i) => passContext.idlePassRewards(i + 1, 'free')).filter(rewards => rewards.some(reward => reward.kind === 'gold')).length < 50, 'most free tiers include non-Gold rewards');

const passHelpersStart = source.indexOf('function idlePassWindow(');
const passHelpersEnd = source.indexOf('function idleRecordKill(', passHelpersStart);
const passProgress = { pass: { xp: 99995, plusPoints: 0, plusXpRemainder: 0 }, kills: { 1: 500 } };
const passHelperContext = { idleProgress: () => passProgress, Date, Math, Number, Object, String };
vm.runInNewContext(source.slice(passHelpersStart, passHelpersEnd), passHelperContext);
passHelperContext.awardIdlePassXp(10);
assert.equal(passProgress.pass.xp, 100000, 'pass progression stops at level 100');
assert.equal(passProgress.pass.plusPoints, 0, 'only post-level-100 XP becomes Pass+');
passHelperContext.awardIdlePassXp(100);
assert.equal(passProgress.pass.plusPoints, 1, '100 excess pass XP converts to one Pass+ point');
assert.equal(passProgress.pass.plusXpRemainder, 5, 'partial Pass+ conversion is retained');
const passMissions = passHelperContext.idlePassMissionSpecs(passProgress);
assert.ok(passMissions.some(m => m.desc === 'Derrote 500 Pokémon' && m.count === 500), 'season pass includes the 500-defeat milestone');
assert.ok(passMissions.some(m => m.period === 'daily' && m.goal === 100), 'pass includes a daily defeat mission');
assert.ok(passMissions.some(m => m.period === 'weekly' && m.goal === 500), 'pass includes a weekly defeat mission');

const boxStart = source.indexOf('function openIdleStarterBox()');
const boxEnd = source.indexOf('function renderIdleBag()', boxStart);
assert.ok(boxStart >= 0 && boxEnd > boxStart, 'regional starter box can be opened from the bag');
let profile = { box: [], meta: { modeEconomies: { psyIdle: { gold: 500, drops: { 'Caixa Shiny de Inicial (9 regiões)': 1 }, packs: {} } } } };
let message = '';
const names = Object.fromEntries([1, 4, 7, 152, 155, 158, 252, 255, 258, 387, 390, 393, 495, 498, 501, 650, 653, 656, 722, 725, 728, 810, 813, 816, 906, 909, 912].map(id => [id, `Starter ${id}`]));
const browserWindow = { RARITIES: [{ n: 'Comum', mult: 1 }], createCapturedPoke: (id, rarity, shiny) => ({ id, name: names[id], level: 1, rarity, shiny }) };
const boxContext = {
  IDLE_REGIONAL_STARTERS: Object.keys(names).map(Number), W: browserWindow, PSTATE: () => profile,
  idleWallet: () => profile.meta.modeEconomies.psyIdle,
  getPokemonName: id => names[id], idleTrainerXpNext: () => 450, prepareIdlePokemon: mon => { mon.psyIdleKey = `starter-box-${mon.id}`; },
  queueIdleSave() {}, notify: text => { message = text; }, renderIdleBag() {}, Math
};
vm.runInNewContext(source.slice(boxStart, boxEnd), boxContext);
boxContext.openIdleStarterBox();
assert.equal(profile.meta.modeEconomies.psyIdle.drops['Caixa Shiny de Inicial (9 regiões)'], 0, 'opening consumes one box');
assert.equal(profile.box.length, 1, 'one starter is added to the box');
assert.equal(profile.box[0].shiny, true, 'the selected regional starter is shiny');
assert.ok(Object.hasOwn(names, profile.box[0].id), 'the shiny Pokémon is a regional starter');
assert.match(message, /Shiny/);
console.log('PASS: every fifth pass level grants a boost, free level 100 grants an openable regional shiny starter box, and pass rewards are increased');
