/* PSYWORLD Anime3Q - nucleo do editor de walkmask (sem UI, sem camera).
 * Espelha tools/build_walkmasks_v5.py: edt_1d / compute_edt_2d.
 * Espaco logico 1200x675. walk: Uint8Array (1 = caminhavel, 0 = bloqueado).
 * SDF exportado: uint8 = clip(round(edt * 4), 0, 255); R = 11 (PLAYER_RADIUS).
 */
(function (root) {
  'use strict';
  const W = 1200, H = 675, R = 11.0, SDF_SCALE = 4.0;
  const INF = 1e9;

  // Felzenszwalb & Huttenlocher 1D, quadrado. f: Float64Array(n) -> Float64Array(n) de d^2.
  function edt1d(f, n, out) {
    const v = new Int32Array(n);
    const z = new Float64Array(n + 1);
    let k = 0;
    v[0] = 0; z[0] = -1e18; z[1] = 1e18;
    for (let q = 1; q < n; q++) {
      let s;
      for (;;) {
        const r = v[k];
        s = ((f[q] + q * q) - (f[r] + r * r)) / (2.0 * (q - r));
        if (s <= z[k]) k--; else break;
      }
      k++;
      v[k] = q; z[k] = s; z[k + 1] = 1e18;
    }
    k = 0;
    for (let q = 0; q < n; q++) {
      while (z[k + 1] < q) k++;
      const r = v[k];
      const dq = q - r;
      out[q] = dq * dq + f[r];
    }
    return out;
  }

  // EDT: para cada pixel caminhavel, distancia euclidiana ate o bloqueado mais proximo.
  // Bloqueados = 0. Retorna Float64Array(W*H) com a distancia (nao quadrada).
  function computeEdt(walk) {
    const g = new Float64Array(W * H);
    for (let i = 0; i < g.length; i++) g[i] = walk[i] ? INF : 0.0;
    const tmp = new Float64Array(W * H);
    const col = new Float64Array(H), colOut = new Float64Array(H);
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) col[y] = g[y * W + x];
      edt1d(col, H, colOut);
      for (let y = 0; y < H; y++) tmp[y * W + x] = colOut[y];
    }
    const row = new Float64Array(W), rowOut = new Float64Array(W);
    const out = new Float64Array(W * H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) row[x] = tmp[y * W + x];
      edt1d(row, W, rowOut);
      for (let x = 0; x < W; x++) out[y * W + x] = Math.sqrt(rowOut[x]);
    }
    return out;
  }

  // Quantizacao exportada, identica ao build: uint8 = clip(round(edt*4),0,255).
  function sdfToU8(edt) {
    const u = new Uint8Array(W * H);
    for (let i = 0; i < u.length; i++) {
      const v = Math.round(edt[i] * SDF_SCALE);
      u[i] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
    return u;
  }

  // Pincel: carimba um disco (value 1 = caminhavel, 0 = bloqueado) em (cx, cy) logicos.
  function stamp(walk, cx, cy, radius, value) {
    const r2 = radius * radius;
    const x0 = Math.max(0, Math.floor(cx - radius)), x1 = Math.min(W - 1, Math.ceil(cx + radius));
    const y0 = Math.max(0, Math.floor(cy - radius)), y1 = Math.min(H - 1, Math.ceil(cy + radius));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r2) walk[y * W + x] = value;
      }
    }
  }

  // Traco entre pontos com espacamento de 1 px (sem falhas entre amostras).
  function stroke(walk, pts, radius, value) {
    for (let i = 0; i < pts.length; i++) {
      const [x, y] = pts[i];
      if (i === 0) { stamp(walk, x, y, radius, value); continue; }
      const [ax, ay] = pts[i - 1];
      const L = Math.hypot(x - ax, y - ay);
      const steps = Math.max(1, Math.ceil(L));
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        stamp(walk, ax + (x - ax) * t, ay + (y - ay) * t, radius, value);
      }
    }
  }

  // Pre-visualizacao ao vivo: 1 onde o centro do personagem NAO cabe (edt < R) mas e caminhavel,
  // e 2 onde o centro caberia (edt >= R). Serve para desenhar a linha ciana (SDF=11).
  function previewClasses(walk, edt) {
    const c = new Uint8Array(W * H);
    for (let i = 0; i < c.length; i++) {
      if (!walk[i]) c[i] = 0;
      else c[i] = edt[i] >= R ? 2 : 1;
    }
    return c;
  }

  // Walkmask exportavel (L): 255 caminhavel, 0 bloqueado.
  function walkToL(walk) {
    const u = new Uint8Array(W * H);
    for (let i = 0; i < u.length; i++) u[i] = walk[i] ? 255 : 0;
    return u;
  }

  // Le uma walkmask L (>=128 = caminhavel), como o build.
  function walkFromL(lu8) {
    const w = new Uint8Array(W * H);
    for (let i = 0; i < w.length; i++) w[i] = lu8[i] >= 128 ? 1 : 0;
    return w;
  }


  // ---------------------------------------------------------------------------
  // Camada editavel (navegador). Nao roda em Node: usa document/canvas somente
  // quando createEditor e chamado com um loader de imagem.
  // ---------------------------------------------------------------------------
  const UNDO_MAX = 40;
  const RECOMPUTE_MS = 120;

  // RGBA da pre-visualizacao: bloqueado (vermelho), caminhavel perto da parede (amarelo),
  // caminhavel seguro (verde) e a faixa SDF=11 (ciano).
  function buildPreviewRGBA(walk, edt, out) {
    for (let i = 0, p = 0; i < W * H; i++, p += 4) {
      if (!walk[i]) { out[p] = 239; out[p + 1] = 68; out[p + 2] = 68; out[p + 3] = 105; continue; }
      if (!edt) { out[p] = 34; out[p + 1] = 197; out[p + 2] = 94; out[p + 3] = 60; continue; }
      const d = edt[i];
      if (d < R) { out[p] = 250; out[p + 1] = 204; out[p + 2] = 21; out[p + 3] = 110; }
      else if (d < R + 1) { out[p] = 56; out[p + 1] = 189; out[p + 2] = 248; out[p + 3] = 255; }
      else { out[p] = 34; out[p + 1] = 197; out[p + 2] = 94; out[p + 3] = 60; }
    }
    return out;
  }

  // loadWalk(url) -> Promise<Uint8Array> (1 = caminhavel), usando canvas do navegador.
  function loadWalkFromUrl(url) {
    return new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => {
        const cv = document.createElement('canvas');
        cv.width = W; cv.height = H;
        const cx = cv.getContext('2d', { willReadFrequently: true });
        cx.drawImage(im, 0, 0, W, H);
        const raw = cx.getImageData(0, 0, W, H).data;
        const lum = new Uint8Array(W * H);
        for (let i = 0, p = 0; i < lum.length; i++, p += 4) lum[i] = raw[p];
        resolve(walkFromL(lum));
      };
      im.onerror = () => reject(new Error('walkmask nao carregou: ' + url));
      im.src = url;
    });
  }

  // Cria um editor para um mapa. opts: { mapId, walk, onSdf(u8), onPreview(rgbaBuffer) }
  function createEditor(opts) {
    const st = {
      mapId: opts.mapId,
      walk: opts.walk,
      edt: null,
      undo: [],
      tool: 'paint',
      radius: 6,
      stroke: null,
      timer: 0,
      previewBuf: new Uint8ClampedArray(W * H * 4)
    };

    function recompute() {
      st.timer = 0;
      st.edt = computeEdt(st.walk);
      if (opts.onSdf) opts.onSdf(sdfToU8(st.edt));
      if (opts.onPreview) opts.onPreview(buildPreviewRGBA(st.walk, st.edt, st.previewBuf));
    }
    function scheduleRecompute() {
      // Preview ao vivo durante o traco: recalcula no maximo a cada RECOMPUTE_MS.
      if (opts.onPreview) opts.onPreview(buildPreviewRGBA(st.walk, st.edt, st.previewBuf));
      if (!st.timer) st.timer = setTimeout(recompute, RECOMPUTE_MS);
    }
    function value() { return st.tool === 'paint' ? 1 : 0; }

    return {
      mapId: st.mapId,
      setTool(t) { st.tool = t === 'erase' ? 'erase' : 'paint'; },
      setRadius(r) { st.radius = Math.max(2, Math.min(40, r | 0)); },
      getTool() { return st.tool; },
      getRadius() { return st.radius; },
      isStroking(pid) { return !!st.stroke && st.stroke.pid === pid; },
      begin(pid, x, y) {
        if (st.stroke) return false;
        st.undo.push(st.walk.slice());
        if (st.undo.length > UNDO_MAX) st.undo.shift();
        st.stroke = { pid, last: [x, y] };
        stamp(st.walk, x, y, st.radius, value());
        scheduleRecompute();
        return true;
      },
      move(pid, x, y) {
        if (!st.stroke || st.stroke.pid !== pid) return false;
        stroke(st.walk, [st.stroke.last, [x, y]], st.radius, value());
        st.stroke.last = [x, y];
        scheduleRecompute();
        return true;
      },
      end(pid) {
        if (!st.stroke || st.stroke.pid !== pid) return false;
        st.stroke = null;
        if (st.timer) { clearTimeout(st.timer); st.timer = 0; }
        recompute();
        return true;
      },
      undo() {
        const prev = st.undo.pop();
        if (!prev) return false;
        st.walk = prev;
        recompute();
        return true;
      },
      canUndo() { return st.undo.length > 0; },
      sdfU8() { if (!st.edt) st.edt = computeEdt(st.walk); return sdfToU8(st.edt); },
      walkL() { return walkToL(st.walk); },
      refresh() { recompute(); }
    };
  }

  const api = { W, H, R, SDF_SCALE, edt1d, computeEdt, sdfToU8, stamp, stroke,
                previewClasses, walkToL, walkFromL,
                loadWalkFromUrl, createEditor, buildPreviewRGBA };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PsyAnime3QBrush = api;
})(typeof window !== 'undefined' ? window : globalThis);
