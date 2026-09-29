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
assert.ok(passContext.idlePassRewards(100, 'free').some(reward => reward.kind === 'gold' && reward.qty === 50000), 'free pass gold rewards scale up');
assert.ok(passContext.idlePassRewards(100, 'premium').some(reward => reward.kind === 'gold' && reward.qty === 50000), 'premium pass gold rewards scale up');

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
