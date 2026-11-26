// Colisão do protótipo de exploração 3D. Funções puras, sem three.js, testáveis no node.
// Caixas são AABB: { min: { x, y, z }, max: { x, y, z } }. O personagem é um círculo no plano XZ.

// O círculo (x, z, raio r) encosta na caixa? Usa o ponto da caixa mais próximo do centro do círculo.
export function colideCirculoCaixa(x, z, r, caixa) {
  const cx = Math.max(caixa.min.x, Math.min(x, caixa.max.x));
  const cz = Math.max(caixa.min.z, Math.min(z, caixa.max.z));
  const dx = x - cx;
  const dz = z - cz;
  return dx * dx + dz * dz < r * r;
}

// Move no plano XZ, eixo a eixo. Se um eixo bate na parede, esse eixo fica parado e o outro continua:
// assim o personagem desliza ao longo da parede em vez de travar.
export function resolverMovimento(pos, dx, dz, r, caixas) {
  let { x, z } = pos;
  const nx = x + dx;
  if (!caixas.some((c) => colideCirculoCaixa(nx, z, r, c))) x = nx;
  const nz = z + dz;
  if (!caixas.some((c) => colideCirculoCaixa(x, nz, r, c))) z = nz;
  return { x, z };
}

// Segmento de a até b contra uma caixa (método dos slabs em 3D).
// Devolve t em [0, 1] do primeiro toque na caixa, ou null se o segmento não toca.
export function segmentoAtingeCaixa(a, b, caixa) {
  let tmin = 0;
  let tmax = 1;
  for (const eixo of ['x', 'y', 'z']) {
    const d = b[eixo] - a[eixo];
    if (Math.abs(d) < 1e-9) {
      if (a[eixo] < caixa.min[eixo] || a[eixo] > caixa.max[eixo]) return null;
    } else {
      let t1 = (caixa.min[eixo] - a[eixo]) / d;
      let t2 = (caixa.max[eixo] - a[eixo]) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }
  }
  return tmin;
}

// Quanto a câmera pode ir do alvo até a posição desejada sem atravessar uma caixa.
// Devolve uma fração de 0.05 a 1 da distância desejada. A folga (em unidades do mundo) evita colar na parede.
export function fracaoLivreCamera(alvo, desejada, caixas, folga = 0.4) {
  const len = Math.hypot(desejada.x - alvo.x, desejada.y - alvo.y, desejada.z - alvo.z) || 1;
  let f = 1;
  for (const c of caixas) {
    const t = segmentoAtingeCaixa(alvo, desejada, c);
    if (t !== null && t < f) f = t;
  }
  if (f >= 1) return 1; // nenhuma parede no caminho: a câmera vai até a distância desejada
  return Math.max(0.05, f - folga / len);
}

// ---- Colisão suave por Campo de Distância com Sinal (SDF) ----
// Transformada de distância euclidiana 1D em O(n) (Felzenszwalb-Huttenlocher).
function edt1d(f, n, out, v, z) {
  let k = 0;
  v[0] = 0;
  z[0] = -Infinity;
  z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let s;
    while (true) {
      const r = v[k];
      s = ((f[q] + q * q) - (f[r] + r * r)) / (2 * (q - r));
      if (s <= z[k]) k--;
      else break;
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    const d = q - v[k];
    out[q] = d * d + f[v[k]];
  }
}

function edt2d(bin, w, h) {
  const INF = 1e12;
  const nMax = Math.max(w, h);
  const f = new Float64Array(nMax);
  const d = new Float64Array(nMax);
  const v = new Int32Array(nMax);
  const z = new Float64Array(nMax + 1);
  const tmp = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const off = y * w;
    for (let x = 0; x < w; x++) f[x] = bin[off + x] ? 0 : INF;
    edt1d(f, w, d, v, z);
    for (let x = 0; x < w; x++) tmp[off + x] = d[x];
  }
  const out = new Float32Array(w * h);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = tmp[y * w + x];
    edt1d(f, h, d, v, z);
    for (let y = 0; y < h; y++) out[y * w + x] = Math.sqrt(d[y]);
  }
  return out;
}

// Constrói um SDF em unidades do mundo a partir de uma máscara binária (walk: 1 = anda, 0 = bloqueia).
// Distância positiva = dentro da área caminhável; negativa = dentro de obstáculo.
export function construirSDF(walk, w, h, larg, alt) {
  const n = w * h;
  const blocked = new Uint8Array(n);
  const free = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (walk[i]) free[i] = 1;
    else blocked[i] = 1;
  }
  const distToWall = edt2d(blocked, w, h);
  const distToFree = edt2d(free, w, h);
  const pxWorld = (larg / w + alt / h) * 0.5;
  const dist = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    dist[i] = (walk[i] ? distToWall[i] : -distToFree[i]) * pxWorld;
  }
  return { dist, w, h, larg, alt, cellX: larg / w, cellZ: alt / h };
}

// Amostragem bilinear contínua do SDF na coordenada do mundo (x, z).
export function amostrarSDF(sdf, x, z) {
  const { dist, w, h, larg, alt } = sdf;
  const u = (x / larg + 0.5) * w - 0.5;
  const v = (z / alt + 0.5) * h - 0.5;
  const x0 = Math.max(0, Math.min(w - 1, Math.floor(u)));
  const y0 = Math.max(0, Math.min(h - 1, Math.floor(v)));
  const x1 = Math.min(w - 1, x0 + 1);
  const y1 = Math.min(h - 1, y0 + 1);
  const tx = Math.max(0, Math.min(1, u - x0));
  const ty = Math.max(0, Math.min(1, v - y0));
  const d00 = dist[y0 * w + x0];
  const d10 = dist[y0 * w + x1];
  const d01 = dist[y1 * w + x0];
  const d11 = dist[y1 * w + x1];
  return (d00 * (1 - tx) + d10 * tx) * (1 - ty) + (d01 * (1 - tx) + d11 * tx) * ty;
}

// Move no plano XZ deslizando suavemente por curvas e diagonais usando o gradiente contínuo do SDF.
export function resolverMovimentoSDF(pos, dx, dz, r, sdf) {
  const stepLen = Math.hypot(dx, dz);
  if (stepLen < 1e-9) return { x: pos.x, z: pos.z };
  const maxStep = Math.max(0.05, r * 0.35);
  const passos = Math.max(1, Math.ceil(stepLen / maxStep));
  const sx = dx / passos;
  const sz = dz / passos;
  const limX = sdf.larg * 0.5 - r;
  const limZ = sdf.alt * 0.5 - r;
  const epsX = sdf.cellX;
  const epsZ = sdf.cellZ;

  let { x, z } = pos;
  for (let p = 0; p < passos; p++) {
    const prevX = x;
    const prevZ = z;
    x = Math.max(-limX, Math.min(limX, x + sx));
    z = Math.max(-limZ, Math.min(limZ, z + sz));

    for (let it = 0; it < 4; it++) {
      const d = amostrarSDF(sdf, x, z);
      if (d >= r) break;
      const gx = amostrarSDF(sdf, x + epsX, z) - amostrarSDF(sdf, x - epsX, z);
      const gz = amostrarSDF(sdf, x, z + epsZ) - amostrarSDF(sdf, x, z - epsZ);
      const gl = Math.hypot(gx, gz);
      if (gl < 1e-6) {
        x = prevX;
        z = prevZ;
        break;
      }
      const empurrao = (r - d) + 1e-4;
      x = Math.max(-limX, Math.min(limX, x + (gx / gl) * empurrao));
      z = Math.max(-limZ, Math.min(limZ, z + (gz / gl) * empurrao));
    }
    // Se entrou demais numa quina muito fechada, mantém a última posição válida
    const dFinal = amostrarSDF(sdf, x, z);
    const dPrev = amostrarSDF(sdf, prevX, prevZ);
    if (dFinal < r - 0.03 && dFinal < dPrev) {
      x = prevX;
      z = prevZ;
    }
  }
  return { x, z };
}
