const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const helper = fs.readFileSync(path.join(__dirname, '../core/idle-afk-summary-v1.js'), 'utf8');

class FakeNode {
  constructor(id) { this.id = id || ''; this.style = {}; this.handlers = {}; this.children = []; this.parentNode = null; this.innerHTML = ''; }
  setAttribute() {}
  addEventListener(name, fn) { this.handlers[name] = fn; }
  querySelector(selector) {
    if (selector !== '[data-afk-ack]') return null;
    const parent = this;
    return { addEventListener(name, fn) { parent.ack = fn; } };
  }
  appendChild(child) { child.parentNode = this; this.children.push(child); }
  removeChild(child) { this.children = this.children.filter(item => item !== child); child.parentNode = null; }
}
const body = new FakeNode('body');
const document = {
  body, visibilityState: 'visible',
  createElement() { return new FakeNode(); },
  getElementById(id) { return body.children.find(node => node.id === id) || null; }
};
const window = {};
vm.runInNewContext(helper, { window, document, Date, Math, Number, String, Array, Object, JSON });
const profile = { meta: {} };
const report = {
  ok: true, elapsed_seconds: 7200, kills_awarded: 600,
  gold_awarded: 1800, xp_awarded: 12000, trainer_xp_awarded: 12000,
  drops: { 'Pokéball': 18, 'Poção 200': 7 }
};
const row = window.PsyIdleAfkSummary.record(profile, report, 'claim-123', {
  mapName: 'Rota 1', speciesName: 'Rattata', pokemonName: 'Bulbasaur'
});
assert.equal(row.kills, 600);
assert.equal(row.trainerXp, 12000);
assert.equal(row.pokemonXp, 12000);
assert.equal(row.drops.length, 2);
assert.equal(row.mapName, 'Rota 1');
assert.equal(window.PsyIdleAfkSummary.duration(7200), '2h 0min');
assert.equal(window.PsyIdleAfkSummary.record(profile, report, 'claim-123'), row, 'receipt IDs are idempotent');
assert.equal(profile.meta.psyIdleAfkReports.length, 1, 'one receipt creates only one log');
document.visibilityState = 'hidden';
assert.equal(window.PsyIdleAfkSummary.displayPending(profile), false, 'do not cover a hidden tab');
document.visibilityState = 'visible';
let saved = 0;
assert.equal(window.PsyIdleAfkSummary.displayPending(profile, { onSeen: () => { saved++; } }), true);
const overlay = body.children[0];
assert.ok(overlay.innerHTML.includes('Resumo da caçada AFK'));
assert.ok(overlay.innerHTML.includes('Pokéball'));
assert.ok(overlay.innerHTML.includes('12.000'));
assert.equal(row.seen, false, 'log stays pending until acknowledged');
overlay.ack();
assert.equal(row.seen, true, 'acknowledging marks the summary as read');
assert.equal(saved, 1, 'acknowledging persists the read state');
assert.equal(body.children.length, 0);
assert.equal(window.PsyIdleAfkSummary.displayPending(profile), false);
console.log('Psy Idle AFK summary: ok');
