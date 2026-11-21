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
