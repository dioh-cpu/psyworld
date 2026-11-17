/* Run: NODE_PATH=/tmp/pw/node_modules node tests/gothic-mp4-browser.cjs
 * Optional: PREVIEW_BASE=https://... node tests/gothic-mp4-browser.cjs
 */
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (_) {
  ({ chromium } = require('playwright-core'));
}

const ROOT = path.resolve(__dirname, '..');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.svg': 'image/svg+xml'
};

function startRangeServer() {
  const server = http.createServer((req, res) => {
    const cleanUrl = (req.url || '/').split('?')[0];
    if (cleanUrl === '/favicon.ico') {
      res.writeHead(204);
      res.end();
      return;
    }
    const filePath = path.join(ROOT, cleanUrl === '/' ? 'index.html' : cleanUrl);
    if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const stat = fs.statSync(filePath);
    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    const range = req.headers.range;
    if (range) {
      const m = /bytes=(\d+)-(\d*)/.exec(range);
      if (m) {
        const start = parseInt(m[1], 10);
        const end = m[2] ? Math.min(stat.size - 1, parseInt(m[2], 10)) : stat.size - 1;
        if (start >= stat.size || start > end) {
          res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
          res.end();
          return;
        }
        res.writeHead(206, {
          'Content-Type': type,
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
          'Cache-Control': 'no-store'
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
        return;
      }
    }
    res.writeHead(200, {
      'Content-Type': type,
      'Accept-Ranges': 'bytes',
      'Content-Length': stat.size,
      'Cache-Control': 'no-store'
    });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => {
    resolve({ server, base: `http://127.0.0.1:${server.address().port}` });
  }));
}

async function main() {
  const ownServer = process.env.PREVIEW_BASE ? null : await startRangeServer();
  const base = process.env.PREVIEW_BASE || ownServer.base;
  const execPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  const browser = await chromium.launch({
    headless: true,
    ...(execPath ? { executablePath: execPath } : {}),
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  try {
    for (const [name, width, height, mobile] of [
      ['desktop', 1280, 720, false],
      ['android-portrait', 412, 915, true],
      ['android-landscape', 915, 412, true]
    ]) {
      const context = await browser.newContext({
        viewport: { width, height },
        isMobile: mobile,
        hasTouch: mobile,
        deviceScaleFactor: mobile ? 2 : 1
      });
      const page = await context.newPage();
      const errors = [];
      const httpErrors = [];
      const mp4Requests = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', res => {
        if (res.status() >= 400 && !res.url().endsWith('/favicon.ico')) {
          httpErrors.push(`HTTP ${res.status()} ${res.url()}`);
        }
      });
      page.on('console', m => {
        if (m.type() === 'error') {
          const text = m.text();
          if (!text.includes('404 (Not Found)') || httpErrors.length > 0) errors.push(text);
        }
      });
      page.on('request', req => {
        if (req.url().includes('.mp4')) mp4Requests.push(req.url().split('?')[0].split('/').pop());
      });

      await page.addInitScript(() => {
        window.__scriptSeeks = 0;
        const desc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'currentTime');
        Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
          get: desc.get,
          set: function(v) {
            if (window.PsyGothicWalkVideoV1?.status().ready) window.__scriptSeeks++;
            return desc.set.call(this, v);
          },
          configurable: true
        });
      });

      const response = await page.goto(base + '/gothic-walk-preview.html', { waitUntil: 'domcontentloaded' });
      assert.equal(response.status(), 200);
      await page.waitForFunction(() => window.PsyGothicWalkVideoV1?.status().ready === true, { timeout: 20000 });
      await page.waitForFunction(() => window.PsyGothicWalkVideoV1?.status().draws > 0, { timeout: 5000 });

      const start = await page.evaluate(() => ({
        status: window.PsyGothicWalkVideoV1.status(),
        disabledButtons: document.querySelectorAll('button[data-row]:disabled').length
      }));
      assert.equal(start.status.playing, false);
      assert.equal(start.status.ready, true);
      assert.equal(start.status.readyCount, 3);
      assert.equal(start.disabledButtons, 0, 'all directional controls must unlock once videos are ready');
      assert.equal(mp4Requests.filter(f => f.includes('gothic-boy-walk-turn-v2')).length, 0, 'source 1080p MP4 must not be downloaded');

      // Hook draw() to confirm real canvas pixel updates on frame 1 of every direction change
      await page.evaluate(() => {
        window.__probe = [];
        const origDraw = window.PsyGothicWalkVideoV1.draw;
        window.PsyGothicWalkVideoV1.draw = function(target, pose, x, y, width, height) {
          const t0 = performance.now();
          const res = origDraw.apply(this, arguments);
          const st = window.PsyGothicWalkVideoV1.status();
          const tfm = target.getTransform();
          const sx = tfm.a * (x + width / 2) + tfm.e;
          const sy = tfm.d * (y + height / 2) + tfm.f;
          const bw = 40, bh = 56;
          const rx = Math.max(0, Math.min(target.canvas.width - bw, Math.round(sx - bw / 2)));
          const ry = Math.max(0, Math.min(target.canvas.height - bh, Math.round(sy - bh / 2)));
          let fp = '';
          try {
            const d = target.getImageData(rx, ry, bw, bh).data;
            let h = 0;
            for (let i = 0; i < d.length; i += 16) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) | 0;
            fp = String(h);
          } catch (_) {}
          window.__probe.push({ t: t0, res, row: pose.row, state: pose.state, clip: st.clip, mirrored: st.mirrored, decoded: st.decodedFrames, fp });
          return res;
        };
      });

      await page.waitForTimeout(120);

      for (const [key, row, expectedClip] of [
        ['ArrowDown', 0, 'front'],
        ['ArrowLeft', 1, 'left'],
        ['ArrowUp', 3, 'back'],
        ['ArrowRight', 2, 'left'],
        ['ArrowLeft', 1, 'left'],
        ['ArrowDown', 0, 'front']
      ]) {
        const mark = await page.evaluate(() => ({
          idx: window.__probe.length,
          decoded: window.PsyGothicWalkVideoV1.status().decodedFrames,
          scriptSeeks: window.__scriptSeeks,
          lastFp: window.__probe[window.__probe.length - 1]?.fp || ''
        }));
        const tInput = await page.evaluate(() => performance.now());
        await page.keyboard.down(key);
        await page.waitForTimeout(650);
        const mid = await page.evaluate(() => ({ st: window.PsyGothicWalkVideoV1.status(), scriptSeeks: window.__scriptSeeks }));
        assert.equal(mid.st.row, row);
        assert.equal(mid.st.clip, expectedClip);
        assert.equal(mid.st.mirrored, row === 2);
        assert.equal(mid.st.playing, true);
        assert.equal(mid.scriptSeeks, mark.scriptSeeks, 'switching directions must never trigger programmatic video.currentTime seeks');

        await page.keyboard.up(key);
        await page.waitForTimeout(180);
        const paused = await page.evaluate(() => window.PsyGothicWalkVideoV1.status());
        await page.waitForTimeout(180);
        const still = await page.evaluate(() => window.PsyGothicWalkVideoV1.status());
        assert.equal(still.playing, false);
        assert.equal(paused.time, still.time, 'MP4 pauses cleanly with actor');

        const summary = await page.evaluate(({ mark, row, expectedClip, tInput }) => {
          const draws = window.__probe.slice(mark.idx).filter(d => d.row === row && d.state === 'walk');
          const firstWrong = draws.find(d => !d.res || d.clip !== expectedClip || d.mirrored !== (row === 2));
          const firstVisual = draws.find(d => d.res && d.clip === expectedClip && d.mirrored === (row === 2) && d.fp !== mark.lastFp);
          const secondVisual = firstVisual ? draws.find(d => d.t > firstVisual.t && d.fp !== firstVisual.fp) : null;
          return {
            totalWalkDraws: draws.length,
            hasWrong: !!firstWrong,
            firstVisualMs: firstVisual ? +(firstVisual.t - tInput).toFixed(1) : null,
            secondVisualMs: secondVisual ? +(secondVisual.t - tInput).toFixed(1) : null,
            decodedDelta: (draws[draws.length - 1]?.decoded || mark.decoded) - mark.decoded
          };
        }, { mark, row, expectedClip, tInput });

        assert.equal(summary.hasWrong, false, `${name} ${key} rendered a wrong orientation frame`);
        assert(summary.firstVisualMs !== null && summary.firstVisualMs < 150, `${name} ${key} first visual draw too slow: ${summary.firstVisualMs}ms`);
        assert(summary.secondVisualMs !== null, `${name} ${key} canvas pixels did not advance during walk`);
        assert(summary.decodedDelta > 8, `${name} ${key} real MP4 frames must advance`);
        console.log(name, key, JSON.stringify(summary));
      }

      // Stop and resume multiple times without resetting walk progress to 0
      await page.keyboard.down('ArrowLeft');
      await page.waitForTimeout(300);
      await page.keyboard.up('ArrowLeft');
      await page.waitForTimeout(160);
      const tStop1 = await page.evaluate(() => window.PsyGothicWalkVideoV1.status().time);
      await page.keyboard.down('ArrowLeft');
      await page.waitForTimeout(240);
      await page.keyboard.up('ArrowLeft');
      await page.waitForTimeout(160);
      const tStop2 = await page.evaluate(() => window.PsyGothicWalkVideoV1.status().time);
      assert(tStop2 > tStop1 || tStop1 > 1.0, `resume should continue clip phase (${tStop1} -> ${tStop2})`);

      // Rapid switches across all 4 directions
      const rapidStart = await page.evaluate(() => window.__probe.length);
      for (const k of ['ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
        await page.keyboard.down(k);
        await page.waitForTimeout(120);
        await page.keyboard.up(k);
      }
      await page.waitForTimeout(140);
      const rapidWrong = await page.evaluate(n => {
        const expected = ['front', 'left', 'left', 'back'];
        return window.__probe.slice(n).filter(d => d.state === 'walk' && (!d.res || d.clip !== expected[d.row] || d.mirrored !== (d.row === 2))).length;
      }, rapidStart);
      assert.equal(rapidWrong, 0, `${name} rapid switching produced wrong-direction draws`);

      // Continuous loop check (>1.9s hold wraps smoothly past duration without error)
      const loopStart = await page.evaluate(() => window.PsyGothicWalkVideoV1.status().decodedFrames);
      await page.keyboard.down('ArrowRight');
      await page.waitForTimeout(1900);
      const loopEnd = await page.evaluate(() => window.PsyGothicWalkVideoV1.status());
      await page.keyboard.up('ArrowRight');
      await page.waitForTimeout(160);
      assert.equal(loopEnd.failed, false);
      assert(loopEnd.decodedFrames - loopStart >= 28, `${name} loop hold decoded too few frames: ${loopEnd.decodedFrames - loopStart}`);
      assert(loopEnd.time >= 0 && loopEnd.time <= loopEnd.duration + 0.05);

      // Button pointer control check
      const btn = await page.getByRole('button', { name: 'Esquerda', exact: true }).boundingBox();
      await page.mouse.move(btn.x + btn.width / 2, btn.y + btn.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(300);
      const btnSt = await page.evaluate(() => window.PsyGothicWalkVideoV1.status());
      assert.equal(btnSt.row, 1);
      assert.equal(btnSt.playing, true);
      await page.mouse.up();
      await page.waitForTimeout(160);
      assert.equal((await page.evaluate(() => window.PsyGothicWalkVideoV1.status())).playing, false);

      assert.deepEqual(httpErrors, [], `${name} http errors: ${httpErrors.join('; ')}`);
      assert.deepEqual(errors, [], `${name} page/console errors: ${errors.join('; ')}`);
      const uniqueClips = [...new Set(mp4Requests)];
      assert.equal(uniqueClips.length, 3, `expected 3 derived clips loaded once, got ${mp4Requests}`);
      console.log('PASS', name);
      await context.close();
    }

    // Full-game integration check (Psy City single-sprite deduplication + Gothic MP4 + Kanto)
    for (const [name, width, height, mobile] of [
      ['fullgame-desktop', 1280, 720, false],
      ['fullgame-android', 412, 915, true]
    ]) {
      const context = await browser.newContext({
        viewport: { width, height },
        isMobile: mobile,
        hasTouch: mobile,
        deviceScaleFactor: mobile ? 2 : 1
      });
      await context.route(/^https?:\/\/(?!127\.0\.0\.1|.*\.vercel\.app)/, route => route.abort());
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', e => pageErrors.push(e.message));
      await page.addInitScript(() => {
        const save = {
          version: 2,
          savedAt: Date.now(),
          map: { x: 25, y: 25, px: 25 * 55, py: 25 * 55 },
          player: {
            name: 'AshGothic',
            gold: 500,
            playerCharacterId: 'gothic_boy',
            playerCostumeByCharacter: { gothic_boy: 'basic', adventure_boy: 'basic' },
            meta: { characterId: 'gothic_boy', tutorialSeen: true, essentialGuideV56: { done: true, step: 5 } },
            team: [{ id: 1, name: 'Bulbasaur', level: 5, hp: 20, maxHp: 20, exp: 0, maxExp: 100, stats: { atk: 12, def: 12, spd: 12 }, moves: ['Tackle'] }],
            box: [],
            inventory: {},
            gymProgress: []
          }
        };
        const json = JSON.stringify(save);
        localStorage.setItem('psyWorldSave_v2', json);
        localStorage.setItem('psyWorldSave_v2_backup', json);
        localStorage.setItem('psyWorldSave', json);
      });
      const res = await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
      assert.equal(res.status(), 200);
      await page.waitForFunction(() => typeof window.loadOnLogin === 'function' && !!window.PsyGothicWalkVideoV1);
      await page.evaluate(() => window.loadOnLogin());
      await page.waitForFunction(() => window.PsyGothicWalkVideoV1?.status().ready === true, { timeout: 20000 });
      await page.waitForFunction(() => window.PsyGothicWalkVideoV1?.status().draws > 0, { timeout: 5000 });

      const domCheck = await page.evaluate(() => {
        const av = document.getElementById('psy-halloween-avatar');
        const sp = document.getElementById('player-poke-sprite');
        return {
          avatarDisplay: av ? getComputedStyle(av).display : 'none',
          pokeDisplay: sp ? getComputedStyle(sp).display : 'none',
          draws: window.PsyGothicWalkVideoV1.status().draws
        };
      });
      assert.equal(domCheck.avatarDisplay, 'none', `${name} must suppress duplicate #psy-halloween-avatar overlay`);
      assert.equal(domCheck.pokeDisplay, 'none', `${name} must hide #player-poke-sprite`);
      assert(domCheck.draws > 0, `${name} must draw Gothic Boy on #gameCanvas`);

      const decBefore = await page.evaluate(() => window.PsyGothicWalkVideoV1.status().decodedFrames);
      await page.keyboard.down('ArrowLeft');
      await page.waitForTimeout(450);
      const midLeft = await page.evaluate(() => window.PsyGothicWalkVideoV1.status());
      await page.keyboard.up('ArrowLeft');
      await page.waitForTimeout(220);
      const afterLeft = await page.evaluate(() => window.PsyGothicWalkVideoV1.status());
      assert.equal(midLeft.row, 1);
      assert.equal(midLeft.clip, 'left');
      assert.equal(midLeft.playing, true);
      assert(midLeft.decodedFrames - decBefore >= 4, `${name} Psy City walk must advance real decoded frames`);
      assert.equal(afterLeft.playing, false, `${name} Psy City must pause cleanly when stopping`);

      // Switch character in Psy City and confirm duplicate overlay remains hidden
      await page.evaluate(() => { P.playerCharacterId = 'adventure_boy'; window.updatePlayerAnimatedSprite?.(); });
      await page.waitForTimeout(160);
      const advAvatar = await page.evaluate(() => {
        const av = document.getElementById('psy-halloween-avatar');
        return av ? getComputedStyle(av).display : 'none';
      });
      assert.equal(advAvatar, 'none', `${name} adventure_boy must also keep duplicate #psy-halloween-avatar hidden`);

      assert.deepEqual(pageErrors, [], `${name} page errors: ${pageErrors.join('; ')}`);
      console.log('PASS', name);
      await context.close();
    }
  } finally {
    await browser.close();
    if (ownServer) ownServer.server.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
