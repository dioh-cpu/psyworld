// Movimento autônomo dos monstrinhos selvagens no mapa da campanha,
// preparado para folhas de caminhada em 4 direções (frente, costas, esquerda, direita)
// com fallback automático para o sprite estático atual (com espelhamento horizontal).

// Registro de folhas de caminhada em 4 direções por espécie (ex.: { url, cols: 4, rows: 4, direcoes: { frente: 0, esquerda: 1, direita: 2, costas: 3 }, fps: 6 }).
// Vazio até as folhas recortadas chegarem (evita 404); basta registrar a espécie aqui ou via registrarFolhaSelvagem().
export const FOLHAS_CAMINHADA_SELVAGENS = {};

export const DIRECOES_PADRAO = { frente: 0, esquerda: 1, direita: 2, costas: 3 };

export function registrarFolhaSelvagem(especie, cfg) {
  if (!especie || !cfg?.url) return false;
  FOLHAS_CAMINHADA_SELVAGENS[especie] = {
    url: cfg.url,
    cols: Math.max(1, Math.floor(Number(cfg.cols) || 4)),
    rows: Math.max(1, Math.floor(Number(cfg.rows) || 4)),
    fps: Math.max(1, Number(cfg.fps) || 6),
    direcoes: { ...DIRECOES_PADRAO, ...(cfg.direcoes || {}) },
  };
  return true;
}

export function obterFolhaSelvagem(especie) {
  return (especie && FOLHAS_CAMINHADA_SELVAGENS[especie]) || null;
}

export function direcaoDoVetor(dx, dz, anterior = 'frente') {
  if (Math.hypot(dx, dz) < 1e-4) return anterior;
  if (Math.abs(dx) >= Math.abs(dz)) return dx < 0 ? 'esquerda' : 'direita';
  return dz >= 0 ? 'frente' : 'costas';
}

export function quadroFolha4Dir(folha, dir, andando, tempoSeg) {
  const cols = folha?.cols || 4;
  const rows = folha?.rows || 4;
  const fps = folha?.fps || 6;
  const linha = folha?.direcoes?.[dir] ?? 0;
  const col = andando ? (Math.floor(Math.max(0, tempoSeg) * fps) % cols) : 0;
  return {
    col,
    linha,
    cols,
    rows,
    offsetX: col / cols,
    offsetY: 1 - (linha + 1) / rows,
    repeatX: 1 / cols,
    repeatY: 1 / rows,
  };
}

export function criarEstadoPasseio(x, z, opcoes = {}) {
  const rng = opcoes.rng || Math.random;
  return {
    origemX: x,
    origemZ: z,
    alvoX: x,
    alvoZ: z,
    raio: opcoes.raio ?? 4.6,
    vel: opcoes.vel ?? 2.1,
    andando: false,
    dir: 'frente',
    pausaRestante: 0.15 + rng() * 0.45,
    tempoAnim: rng() * 2,
    moveu: false,
  };
}

export function atualizarPasseioSelvagem(passeio, pos, dt, opcoes = {}) {
  if (!passeio || !pos || dt <= 0) return { x: pos?.x || 0, z: pos?.z || 0, andando: false, dir: passeio?.dir || 'frente' };
  const rng = opcoes.rng || Math.random;
  const podeIr = opcoes.podeIr || (() => true);
  passeio.tempoAnim += dt;

  if (!passeio.andando) {
    passeio.pausaRestante -= dt;
    if (passeio.pausaRestante <= 0) {
      for (let t = 0; t < 6; t++) {
        const ang = rng() * Math.PI * 2;
        const dist = (0.35 + rng() * 0.65) * passeio.raio;
        const tx = passeio.origemX + Math.cos(ang) * dist;
        const tz = passeio.origemZ + Math.sin(ang) * dist;
        if (podeIr(tx, tz)) {
          passeio.alvoX = tx;
          passeio.alvoZ = tz;
          passeio.andando = true;
          break;
        }
      }
      if (!passeio.andando) passeio.pausaRestante = 0.8;
    }
    return { x: pos.x, z: pos.z, andando: false, dir: passeio.dir };
  }

  const dx = passeio.alvoX - pos.x;
  const dz = passeio.alvoZ - pos.z;
  const dist = Math.hypot(dx, dz);
  if (dist <= 0.12) {
    passeio.andando = false;
    passeio.pausaRestante = 0.7 + rng() * 1.4;
    return { x: pos.x, z: pos.z, andando: false, dir: passeio.dir };
  }

  const passo = Math.min(dist, passeio.vel * dt);
  const nx = pos.x + (dx / dist) * passo;
  const nz = pos.z + (dz / dist) * passo;
  if (!podeIr(nx, nz)) {
    passeio.andando = false;
    passeio.pausaRestante = 0.5 + rng() * 0.8;
    return { x: pos.x, z: pos.z, andando: false, dir: passeio.dir };
  }

  passeio.dir = direcaoDoVetor(dx, dz, passeio.dir);
  passeio.moveu = true;
  return { x: nx, z: nz, andando: true, dir: passeio.dir };
}
