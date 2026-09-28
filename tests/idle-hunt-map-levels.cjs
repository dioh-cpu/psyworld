const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const expectedIds = [1, 4, 7, 10, 13, 16, 19, 25, 29, 32, 43, 46, 69, 84, 102, 175];
const idle = fs.readFileSync(path.join(root, 'modes/idle-realistic-v1.js'), 'utf8');
const generator = fs.readFileSync(path.join(root, 'scripts/generate-idle-hunt-map-seed.cjs'), 'utf8');
const loader = fs.readFileSync(path.join(root, 'core/module-loader.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const readIds = (source, pattern) => {
  const match = source.match(pattern);
  assert.ok(match, 'level-1 hunt list exists');
  return match[1].split(',').map(Number);
};

assert.deepEqual(readIds(idle, /IDLE_LEVEL_1_HUNT_IDS=new Set\(\[([^\]]+)\]\)/), expectedIds);
assert.deepEqual(readIds(generator, /const levelOneHunts=new Set\(\[([^\]]+)\]\)/), expectedIds);
assert.match(idle, /lv=enemyLevel\(rnd\)/, 'encounter levels follow the selected map range');
assert.match(loader, /IDLE_STARTER_HUD_20260928_V6/, 'updated Idle scripts use a fresh browser cache key');
assert.match(index, /core\/module-loader\.js\?build=PSYWORLD_IDLE_STARTER_HUD_20260928/, 'the page loads the updated Idle cache-key logic');

const sql = execFileSync(process.execPath, [path.join(root, 'scripts/generate-idle-hunt-map-seed.cjs')], { encoding: 'utf8' });
for (const id of expectedIds) {
  const key = id <= 151 ? `kanto-${String(id).padStart(3, '0')}` : `region-johto-${id}`;
  const row = sql.split('\n').find(line => line.startsWith(`('${key}',`));
  assert.ok(row, `generated SQL includes ${key}`);
  assert.match(row, /,[^,]+,1,1,'/, `${key} is available to trainer level 1 with a level-1 enemy`);
}

assert.match(sql, /\('kanto-002','KANTO',2,'Ivysaur',40,40,/, 'evolution progression stays intact');
assert.match(sql, /\('kanto-150','KANTO',150,'Mewtwo',80,80,/, 'late-game progression stays intact');
console.log('Idle level-1 hunt maps are aligned across the client and server seed.');
