const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const idle = fs.readFileSync(path.join(root, 'modes/idle-realistic-v1.js'), 'utf8');
const loader = fs.readFileSync(path.join(root, 'core/module-loader.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const slugs = [
  'agua', 'dragao', 'eletrico', 'fada', 'fantasma', 'fogo', 'gelo', 'inseto',
  'lutador', 'metal', 'normal', 'pedra', 'planta', 'psiquico', 'sombrio',
  'terra', 'venenoso', 'voador',
];
const artDir = path.join(root, 'assets/idle-realistic/hunts/kanto');
for (const slug of slugs) {
  const file = path.join(artDir, `${slug}.webp`);
  assert.ok(fs.existsSync(file), `Kanto ${slug} hunt art exists`);
  assert.ok(fs.statSync(file).size > 20_000, `Kanto ${slug} art is non-empty`);
  const bytes = fs.readFileSync(file);
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', `Kanto ${slug} art has a valid WebP container`);
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', `Kanto ${slug} art has the WebP signature`);
  assert.equal(bytes.readUInt32LE(4) + 8, bytes.length, `Kanto ${slug} art is complete, not truncated`);
}
assert.match(idle, /KANTO_HUNT_ART_SLUG=/, 'all Kanto types map to their artwork');
assert.match(idle, /function kantoArtCrop\(image\)/, 'art is cover-cropped without distortion');
assert.match(idle, /function makeKantoHuntCollisionMask\(image,type\)/, 'each art gets a walkability mask');
assert.match(idle, /function kantoHuntArtBlocked\(x,y,r=0\)/, 'collision includes body radius');
assert.match(idle, /if\(isKantoArtMap\(\)\)return 0/, 'procedural terrain cannot add hidden blockers under artwork');
assert.match(idle, /if\(isKantoArtMap\(\)&&kantoHuntArtBlocked\(x,y,r\)\)return true/, 'player and Pokémon movement checks the art collision mask');
assert.match(idle, /function drawGround\(\)\{if\(isKantoArtMap\(\)\)/, 'Kanto hunts render their selected type background');
assert.match(idle, /if\(isKantoArtMap\(\)\)\{loadKantoHuntArt\(currentMap\);buildCollisionGrid\(\);return\}/, 'old generated obstacles are removed from art-based hunts');
assert.match(loader, /PSYWORLD_IDLE_SOCIAL_LAYER_FIX_20260930/, 'Idle mode gets a fresh cache key');
assert.match(index, /core\/module-loader\.js\?build=PSYWORLD_IDLE_SOCIAL_LAYER_FIX_20260930/, 'page loads the updated module loader');
console.log(`Idle Kanto hunt art and collision hooks passed (${slugs.length} type backgrounds).`);
