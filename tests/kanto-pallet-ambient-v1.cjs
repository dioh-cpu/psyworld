const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('core/kanto-pallet-ambient-v1.js', 'utf8');
function makeHarness({ reducedMotion = false, unlocked = true, sfxOn = true, sfx = 0.72 } = {}) {
  const calls = [];
  const window = {
    addEventListener() {},
    matchMedia() { return { matches: reducedMotion, addEventListener() {} }; },
    psyAudio: { unlocked, settings: { sfxOn, sfx }, sfx(name, options) { calls.push({ name, ...options }); } }
  };
  const document = { hidden: false };
  const deterministicMath = Object.create(Math);
  deterministicMath.random = () => 0.5;
  const context = vm.createContext({ window, document, Math: deterministicMath, Uint8Array });
  vm.runInContext(source, context, { filename: 'kanto-pallet-ambient-v1.js' });
  return { ambient: window.PsyKantoPalletAmbientV1, window, document, calls };
}
const at = (h, time, xy) => h.ambient.draw({}, time, null, { x: xy[0], y: xy[1] });

// A call starts only after a delay, is spatially loud at a tree, and never overlaps.
{
  const h = makeHarness();
  at(h, 0, [68, 43]);
  at(h, 6200, [68, 43]);
  assert.equal(h.calls.length, 1);
  assert.match(h.calls[0].name, /^pallet_birds_[abc]$/);
  assert.equal(h.calls[0].volume, 0.72);
  at(h, 8000, [68, 43]);
  assert.equal(h.calls.length, 1, 'no overlapping or rapid repeat');
}
// Spatial gain falls at mid-distance, is silent beyond the tree radius, and rises near a tree.
{
  const h = makeHarness();
  at(h, 0, [68, 43]);
  at(h, 6200, [450, 80]);
  assert.equal(h.calls.length, 1, 'birds remain audible at mid-distance');
  assert(h.calls[0].volume > 0 && h.calls[0].volume < 0.72, 'mid-distance volume is attenuated');
  at(h, 22500, [450, 220]);
  assert.equal(h.calls.length, 1, 'far from every tree is silent');
  at(h, 39000, [68, 43]);
  assert.equal(h.calls.length, 2, 'tree proximity enables birdsong');
  assert.equal(h.calls[1].volume, 0.72, 'near-tree volume returns to its maximum spatial gain');
}
// Audio mute/unlock state gates ambience through the shared SFX settings.
{
  const h = makeHarness({ unlocked: false });
  at(h, 0, [68, 43]); at(h, 6200, [68, 43]);
  assert.equal(h.calls.length, 0, 'no audio before the user unlocks sound');
  h.window.psyAudio.unlocked = true;
  at(h, 8001, [68, 43]);
  assert.equal(h.calls.length, 1, 'sound starts after audio unlock');
}
{
  const h = makeHarness({ sfxOn: false });
  at(h, 0, [68, 43]); at(h, 6200, [68, 43]);
  assert.equal(h.calls.length, 0, 'mute suppresses birdsong');
}
{
  const h = makeHarness({ sfx: 0 });
  at(h, 0, [68, 43]); at(h, 6200, [68, 43]);
  assert.equal(h.calls.length, 0, 'zero SFX volume suppresses birdsong');
}
// Reduced-motion disables visual work but leaves accessible nature audio intact.
{
  const h = makeHarness({ reducedMotion: true });
  at(h, 0, [68, 43]); at(h, 6200, [68, 43]);
  assert.equal(h.calls.length, 1);
}

const audio = fs.readFileSync('core/audio.js', 'utf8');
assert.match(audio, /pallet_birds_a:'user\/pallet-birds-a-v1\.wav'/);
assert.match(audio, /pallet_birds_b:'user\/pallet-birds-b-v1\.wav'/);
assert.match(audio, /pallet_birds_c:'user\/pallet-birds-c-v1\.wav'/);
assert.match(audio, /a\.playbackRate=clamp\(Number\(opt\.rate\)\|\|1/);
assert.match(audio, /get unlocked\(\)\{return unlocked\}/);
assert.ok(['a','b','c'].reduce((sum, v) => sum + fs.statSync(`assets/audio/user/pallet-birds-${v}-v1.wav`).size, 0) < 150000, 'three varied bird calls remain small local assets');
console.log('Pallet ambience: spatial birds, cooldown, mute, unlock and reduced-motion gates PASS');
