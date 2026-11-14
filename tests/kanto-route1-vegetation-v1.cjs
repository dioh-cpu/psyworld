const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('core/kanto-route1-vegetation-v1.js', 'utf8');

function makeHarness({ reducedMotion = false, ready = true } = {}) {
  const draws = [];
  const images = [];
  class MockImage {
    constructor() {
      this.src = '';
      this.complete = ready;
      this.naturalWidth = 156;
      this.naturalHeight = 208;
      images.push(this);
    }
    set src(value) {
      this._src = value;
      if (String(value).endsWith('-foliage-atlas.png')) {
        this.naturalWidth = 156;
        this.naturalHeight = 208 * 7;
      } else {
        this.naturalWidth = 156;
        this.naturalHeight = 208;
      }
    }
    get src() {
      return this._src;
    }
  }
  const window = {
    Image: MockImage,
    matchMedia() {
      return { matches: reducedMotion, addEventListener() {} };
    }
  };
  const ctx = {
    drawImage(...args) {
      draws.push(args);
    }
  };
  const context = vm.createContext({ window, Image: MockImage, Math });
  vm.runInContext(source, context, { filename: 'kanto-route1-vegetation-v1.js' });
  return { veg: window.PsyKantoRoute1VegetationV1, ctx, draws, images };
}

// 1. Structure stays strictly fixed while 7 foliage groups move independently across time.
{
  const h = makeHarness({ reducedMotion: false });
  assert.ok(h.veg, 'PsyKantoRoute1VegetationV1 is registered on window');
  assert.equal(h.veg.groupCount, 7);
  assert.equal(h.veg.trees.length, 1);
  assert.equal(h.veg.trees[0].id, 'gazebo-oak');

  h.veg.draw(h.ctx, 1000);
  assert.equal(h.draws.length, 8, '1 structure draw + 7 foliage group draws per frame');
  const firstFrameStructure = h.draws[0];
  const firstFrameGroups = h.draws.slice(1);
  assert.equal(firstFrameStructure.length, 5, 'structure uses 5-arg drawImage');

  h.draws.length = 0;
  h.veg.draw(h.ctx, 2450);
  const secondFrameStructure = h.draws[0];
  const secondFrameGroups = h.draws.slice(1);

  assert.deepEqual(
    secondFrameStructure.slice(1),
    firstFrameStructure.slice(1),
    'static tree structure coordinates never shift between frames'
  );

  let movingGroups = 0;
  const uniqueOffsets = new Set();
  for (let i = 0; i < 7; i++) {
    const dx1 = firstFrameGroups[i][5];
    const dy1 = firstFrameGroups[i][6];
    const dx2 = secondFrameGroups[i][5];
    const dy2 = secondFrameGroups[i][6];
    if (Math.abs(dx2 - dx1) > 1e-4 || Math.abs(dy2 - dy1) > 1e-4) movingGroups++;
    uniqueOffsets.add(`${dx2.toFixed(4)}:${dy2.toFixed(4)}`);
  }
  assert.equal(movingGroups, 7, 'all 7 leaf groups animate over time');
  assert.equal(uniqueOffsets.size, 7, 'each leaf group has an independent phase offset');
}

// 2. prefers-reduced-motion locks all leaf groups to exact zero displacement.
{
  const h = makeHarness({ reducedMotion: true });
  h.veg.draw(h.ctx, 3200);
  assert.equal(h.draws.length, 8);
  const [, baseX, baseY, baseW, baseH] = h.draws[0];
  for (let i = 1; i < h.draws.length; i++) {
    const [, sx, sy, sw, sh, dx, dy, dw, dh] = h.draws[i];
    assert.equal(sx, 0);
    assert.equal(sy, (i - 1) * 208);
    assert.equal(sw, 156);
    assert.equal(sh, 208);
    assert.ok(Math.abs(dx - baseX) < 1e-9, 'zero horizontal displacement in reduced motion');
    assert.ok(Math.abs(dy - baseY) < 1e-9, 'zero vertical displacement in reduced motion');
    assert.ok(Math.abs(dw - baseW) < 1e-9);
    assert.ok(Math.abs(dh - baseH) < 1e-9);
  }
}

// 3. Verify asset presence and mobile-friendly file sizes.
{
  const structureSize = fs.statSync('assets/story/route1/trees/gazebo-oak-structure.png').size;
  const atlasSize = fs.statSync('assets/story/route1/trees/gazebo-oak-foliage-atlas.png').size;
  const sourceSize = fs.statSync('assets/story/route1/trees/gazebo-oak-source.png').size;
  assert.ok(structureSize > 1000 && structureSize < 120000, 'structure PNG is compact');
  assert.ok(atlasSize > 1000 && atlasSize < 50000, 'foliage atlas PNG is highly compressed for Android');
  assert.ok(sourceSize > 1000 && sourceSize < 120000, 'source reference PNG is present');
}

// 4. Verify integration in kanto-world-v2.js and index.html without touching Pallet.
{
  const worldCode = fs.readFileSync('core/kanto-world-v2.js', 'utf8');
  assert.match(worldCode, /W\.PsyKantoPalletVegetationV1\?\.draw\(c,performance\.now\(\)\)/);
  assert.match(worldCode, /if\(!state\.inside&&state\.world\.id==='route-1'\)\{\s*W\.PsyKantoRoute1VegetationV1\?\.draw\(c,performance\.now\(\)\);\s*\}/);
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /core\/kanto-route1-vegetation-v1\.js/);
}

console.log('Route 1 Gazebo Oak vegetation: 7 independent leaf groups, fixed structure, reduced-motion & Android size gates PASS');
