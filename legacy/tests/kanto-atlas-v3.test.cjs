const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');

const BASE = '636a718bebf743b9df3be2dcf739a1d776e54ace';
const file = path.resolve(__dirname, '../core/kanto-journey-v1.js');
const source = fs.readFileSync(file, 'utf8');
const marker = '})(window,document);';

function load(text, exposeBase = false) {
  const window = {P: {}, addEventListener() {}};
  const document = {getElementById() { return null; }};
  const localStorage = {getItem() { return null; }, setItem() {}};
  if (exposeBase) {
    const at = text.lastIndexOf(marker);
    assert.notEqual(at, -1, 'journey IIFE exists');
    text = text.slice(0, at) +
      'window.__atlasBasePlaces=GEN1.map(({id,kind,name,x,y,badge,chapter})=>({id,kind,name,x,y,badge,chapter}));\n' +
      text.slice(at);
  }
  const context = {window, document, localStorage, console, setTimeout() {}};
  vm.createContext(context);
  vm.runInContext(text, context, {filename: 'core/kanto-journey-v1.js'});
  return window;
}

const baseSource = execFileSync('git', ['show', `${BASE}:core/kanto-journey-v1.js`], {encoding: 'utf8'});
const base = load(baseSource, true);
const current = load(source);
const api = current.PsyKantoJourneyV1;
assert.ok(api, 'public Kanto Journey API is installed');
assert.equal(api.version, 1, 'public API version remains stable');
assert.equal(api.places.length, 38, 'all existing Kanto locations remain');

const currentGeo = api.places.map(({id,kind,name,x,y,badge,chapter}) => ({id,kind,name,x,y,badge,chapter}));
assert.equal(JSON.stringify(currentGeo), JSON.stringify(base.__atlasBasePlaces),
  'map positions, names, progression gates and chapter data are unchanged from the base commit');

const ids = new Set(api.places.map(place => place.id));
const pairs = api.connections.map(([a,b]) => [a,b].sort().join('|'));
assert.equal(new Set(pairs).size, pairs.length, 'no duplicate map links');
const graph = new Map([...ids].map(id => [id, new Set()]));
for (const edge of api.connections) {
  assert.equal(edge.length, 2, 'each link has two endpoints');
  const [a,b] = edge;
  assert.ok(ids.has(a) && ids.has(b), `link endpoints exist: ${a} ↔ ${b}`);
  assert.notEqual(a, b, 'no self-link');
  graph.get(a).add(b);
  graph.get(b).add(a);
}
for (const id of ids) assert.ok(graph.get(id).size, `${id} is connected to the region`);
const reached = new Set(['pallet']), queue = ['pallet'];
while (queue.length) for (const next of graph.get(queue.shift())) if (!reached.has(next)) { reached.add(next); queue.push(next); }
assert.equal(reached.size, ids.size, 'all Kanto locations are reachable through the illustrated links');
for (const [a,b] of [
  ['pallet','route-1'], ['route-1','viridian'], ['viridian','route-2'],
  ['route-2','viridian-forest'], ['pewter','route-3'], ['route-3','mt-moon'],
  ['mt-moon','route-4'], ['route-4','cerulean'], ['vermilion','route-11'],
  ['diglett-cave','route-2'], ['route-19-21','seafoam'], ['seafoam','cinnabar'],
  ['route-22-23','indigo']
]) assert.ok(graph.get(a).has(b), `Kanto geography link exists: ${a} ↔ ${b}`);

const assets = {
  'kanto-atlas-markers-v3.png': [256,64],
  'kanto-atlas-compass-v3.png': [96,96],
  'kanto-atlas-frame-v3.png': [96,96],
  'kanto-atlas-vellum-v3.png': [128,128]
};
for (const [name, size] of Object.entries(assets)) {
  const bytes = fs.readFileSync(path.resolve(__dirname, `../assets/ui/${name}`));
  assert.ok(bytes.length >= 24, `${name} is a valid PNG`);
  assert.equal(bytes.readUInt32BE(16), size[0], `${name} width`);
  assert.equal(bytes.readUInt32BE(20), size[1], `${name} height`);
}
const css = fs.readFileSync(path.resolve(__dirname, '../css/kanto-journey-v1.css'), 'utf8');
assert.match(css, /prefers-reduced-motion:reduce/, 'reduced-motion preference is respected');
assert.match(css, /@media\(max-width:700px\)/, 'mobile layout remains defined');
assert.match(css, /background-size:400% 100%/, 'pixel marker atlas is used as four real sprite states');
assert.match(source, /automation\.startPrimaryRoute\(\)/, 'Atlas IR delegates to the shared route controller');

console.log('PASS Kanto Atlas V3: 38 places, unchanged base geography/progression, connected illustrated route graph, pixel-art assets, responsive/reduced-motion rules and shared Auto Route entry point.');
