const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const window = {};
const context = { window, console };
vm.createContext(context);
for (const file of [
  'core/kanto-map-data-v2.js',
  'core/kanto-collision-v4.js',
  'core/kanto-interiors-v9.js',
  'core/kanto-pallet-mask-v1.js'
]) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });

const data = window.PsyKantoMapDataV2;
const map = data.pallet;
const mask = window.PsyKantoPalletMaskV1;
assert.ok(mask, 'Pallet mask extension loaded');
assert.deepEqual([mask.width, mask.height], [1536, 768]);
assert.deepEqual([map.w, map.h], [900, 450]);
assert.deepEqual([map.w, map.h], [data.route1.w, data.route1.h], 'Pallet keeps the same world scale as Route 1');
assert.equal(map.w / map.h, mask.width / mask.height, 'map and source mask preserve 2:1 geometry');
assert.equal(map.art, 'assets/story/pallet/pallet-background-layered-v1.png');
assert.equal(map.grass.length, 0, 'Pallet has no wild encounter grass');
assert.equal(map.encounter, undefined, 'Pallet does not define outdoor encounters');
const png = fs.readFileSync(path.join(root, map.art));
assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a', 'map artwork is the approved PNG');
assert.equal(png.readUInt32BE(16) / png.readUInt32BE(20), 2, 'artwork has the same 2:1 ratio');

const walkable = (x, y) => data.walkable(map, x, y, 11);
for (const [name, x, y] of [
  ['north exit', 463, 16],
  ['stairs', 463, 88],
  ['stair landing', 463, 146],
  ['main road', 450, 205],
  ['western path', 51, 200],
  ['central plaza', 375, 288],
  ['southern exit', 450, 434]
]) assert.equal(walkable(x, y), true, `${name} is traversable`);

for (const [name, x, y] of [
  ['upper-left house', 95, 75],
  ['Oak laboratory', 275, 80],
  ['fountain', 450, 310],
  ['coast water', 175, 430]
]) assert.equal(walkable(x, y), false, `${name} is blocked`);

for (const door of map.doors) assert.equal(walkable(...door.at), true, `${door.id} doorway approach is walkable`);
assert.ok(map.doors.some(d => d.id === 'lab'));
const labDoor = map.doors.find(d => d.id === 'lab');
assert.ok(window.PsyKantoInteriorsV9.get('lab').npcs.some(n => n.id === 'oak'), 'Professor Carvalho remains in the lab interior for the Pallet quest');
assert.deepEqual(Array.from(map.returnSpawn), [463, 146], 'Route 1 return uses the bottom stair landing');

// The override is strictly Pallet-specific; the shared Route 1 collision remains intact.
assert.equal(data.walkable(data.route1, 108, 409, 11), true);
assert.equal(data.walkable(data.route1, 500, 10, 11), false);

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const maskScript = html.indexOf('core/kanto-pallet-mask-v1.js');
const worldScript = html.indexOf('core/kanto-world-v2.js');
assert.ok(maskScript >= 0 && maskScript < worldScript, 'mask loads before the runtime controller');
console.log('PASS Pallet map asset, source-mask mapping, doors, exits, blocked landmarks, and Route 1 isolation');
