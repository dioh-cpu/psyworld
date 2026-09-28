const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'modes/idle-realistic-v1.js'), 'utf8');
const start = source.indexOf('const IDLE_STARTERS=');
const end = source.indexOf('function showIdleStarterPicker()', start);
assert.ok(start >= 0 && end > start, 'starter choice and migration logic exists');
const code = source.slice(start, end);
let profile, saved = 0, rendered = 0, notice = '';
const browserWindow = {
    RARITIES: [{ n: 'Comum', mult: 1 }],
    createCapturedPoke: id => ({ id, name: ['Bulbasaur', 'Charmander', 'Squirtle'][({1:0,4:1,7:2})[id]], level: 1, rarity: { n: 'Comum', mult: 1 } })
  };
const context = {
  Number, Math, window: browserWindow, W: browserWindow, D: { getElementById: () => ({ style: {} }) },
  PSTATE: () => profile,
  idleTrainerXpNext: () => 450,
  getPokemonName: id => ({1: 'Bulbasaur', 4: 'Charmander', 7: 'Squirtle'})[id],
  prepareIdlePokemon: mon => { mon.psyIdleKey = `starter-${mon.id}`; },
  playerStats: () => ({ maxHp: 120, atk: 35, def: 20 }),
  saveIdleCharacter: () => { saved++; },
  renderIdleTown: () => { rendered++; },
  notify: message => { notice = message; },
  idleTown: false
};
vm.runInNewContext(code, context);
const select = id => vm.runInNewContext(`chooseIdleStarter(${id})`, context);
const cleanProfile = (team, box = []) => ({
  team, box,
  meta: {
    worldIdleProgress: { kills: {}, captures: {} },
    psyIdlePlayer: { level: 1, xp: 0 },
    psyIdlePokemon: {}
  }
});

profile = cleanProfile([{ id: 1, level: 1, psyIdleKey: 'old-bulbasaur' }]);
profile.meta.psyIdlePokemon['old-bulbasaur'] = { level: 1, xp: 0 };
select(4);
assert.deepEqual([...profile.team].map(mon => mon.id), [4], 'a fresh account replaces the automatic Bulbasaur placeholder');
assert.equal(profile.meta.psyIdleStarterChosen, 1);
assert.equal(saved, 1);
assert.equal(rendered, 1);
assert.match(notice, /Charmander/);

profile = cleanProfile([{ id: 1, level: 1, psyIdleKey: 'trained-bulbasaur' }]);
profile.meta.worldIdleProgress.kills = { 'kanto-001': 3 };
profile.meta.psyIdlePokemon['trained-bulbasaur'] = { level: 2, xp: 5 };
select(7);
assert.deepEqual([...profile.team].map(mon => mon.id), [7, 1], 'a progressed profile keeps its Pokémon and makes the chosen starter active');


profile = cleanProfile([{ id: 1, level: 1, psyIdleKey: 'hurt-bulbasaur' }]);
profile.meta.psyIdlePokemon['hurt-bulbasaur'] = { level: 1, xp: 0, hp: 40 };
select(4);
assert.deepEqual([...profile.team].map(mon => mon.id), [4, 1], 'an injured starter is preserved instead of being replaced');

profile = cleanProfile(Array.from({ length: 6 }, (_, i) => ({ id: i + 10, level: 1 })));
select(1);
assert.deepEqual([...profile.team].map(mon => mon.id), [1, 10, 11, 12, 13, 14]);
assert.deepEqual([...profile.box].map(mon => mon.id), [15], 'a full team moves the last Pokémon to the Box without deleting it');

for (const id of ['psy-ir-damage', 'psy-ir-hptxt', 'psy-ir-pokemon-xp', 'psy-ir-trainer-xp']) {
  assert.ok(source.includes(`id="${id}"`), `${id} is present in the hunt HUD`);
}
assert.match(source, /psy-ir-roster-stats/);
assert.match(source, /psy-ir-roster-xp/);
assert.match(source, /if\(!idleStarterChosen\(\)\)\{showIdleStarterPicker\(\);return\}/, 'the hunt cannot start before the starter is selected');
console.log('PASS: Idle offers the starter choice, preserves existing Pokémon, and exposes combat/progression stats.');
