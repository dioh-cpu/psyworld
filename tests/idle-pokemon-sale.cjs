const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'modes/idle-realistic-v1.js'), 'utf8');
const helpersStart = source.indexOf('function idleBoxSellCandidates(');
const helpersEnd = source.indexOf('function addIdlePokemonXp(', helpersStart);
assert.ok(helpersStart >= 0 && helpersEnd > helpersStart, 'Box sale guards exist');

let profile = {
  team: [
    { id: 1, psyIdleKey: 'team-active' },
    { id: 2, psyIdleKey: 'team-second' }
  ],
  box: [
    { id: 3, psyIdleKey: 'box-safe' },
    { id: 4, psyIdleKey: 'team-second' },
    { id: 5, psyIdleKey: 'box-active' }
  ]
};
const player = { poke: { psyIdleKey: 'team-active' } };
let statSyncs = 0;
const context = {
  profile,
  player,
  idlePokemonKey: mon => String(mon.psyIdleKey),
  PSTATE: () => profile,
  syncPlayerStats: () => {
    statSyncs++;
    player.poke = { ...profile.team[0] };
  }
};
vm.createContext(context);
vm.runInContext(source.slice(helpersStart, helpersEnd), context);

const candidates = Array.from(context.idleBoxSellCandidates(profile, 'box-active'), mon => mon.psyIdleKey);
assert.deepEqual(candidates, ['box-safe'], 'team Pokémon and the battle Pokémon are not offered for sale');
assert.equal(context.idleFindSellableBoxPokemon(profile, 'team-active', ''), null, 'the active team member cannot be sold');
assert.equal(context.idleFindSellableBoxPokemon(profile, 'team-second', ''), null, 'other team members cannot be sold');
assert.equal(context.idleFindSellableBoxPokemon(profile, 'box-active', 'box-active'), null, 'a Pokémon still used in battle cannot be sold');
assert.equal(context.idleFindSellableBoxPokemon(profile, 'box-safe', 'team-active').id, 3, 'an eligible Box Pokémon can be revalidated');

const syncStart = source.indexOf('function syncIdleBattlePokemon(');
const syncEnd = source.indexOf('\n', syncStart);
assert.ok(syncStart >= 0 && syncEnd > syncStart, 'battle roster reconciliation exists');
vm.runInContext(source.slice(syncStart, syncEnd), context);
profile.team = [{ id: 6, psyIdleKey: 'replacement' }];
player.poke = { id: 1, psyIdleKey: 'sold-legacy' };
context.syncIdleBattlePokemon();
assert.equal(player.poke.psyIdleKey, 'replacement', 'a stale battle sprite switches to the current team member');
assert.equal(statSyncs, 1);
context.syncIdleBattlePokemon();
assert.equal(statSyncs, 1, 'an already valid battle Pokémon is left alone');

const shopStart = source.indexOf('function openIdleShop(');
const shopEnd = source.indexOf('function idleSuiteClose(', shopStart);
const shop = source.slice(shopStart, shopEnd);
assert.match(shop, /mons=idleBoxSellCandidates\(p\)/, 'the sale screen lists Box candidates only');
assert.match(shop, /idleFindSellableBoxPokemon\(latest,key\)/, 'individual sales recheck current ownership');
assert.match(shop, /idleBoxSellCandidates\(latest\)\.filter/, 'bulk sales use the same Box-only candidates');
assert.match(shop, /syncIdleBattlePokemon\(\)/, 'opening the shop and completing a sale reconcile the battle Pokémon');

console.log('PASS: only Box Pokémon can be sold, active Pokémon stay in battle, and stale battle sprites resync');
