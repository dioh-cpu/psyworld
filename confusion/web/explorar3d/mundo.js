// Mundo da ilha para o protótipo em terceira pessoa. O layout é uma cruz: quatro regiões (Norte, Leste, Sul, Oeste)
// em volta de uma praça central, com as doze cidades do sistema 31 e o mar fechado por paredes invisíveis.
// Código puro, sem three.js: posições, tamanhos e colisões. O desenho 3D fica em mundo-3d.js.
import { CIDADES } from '../mundo/sistemas-31.js';

export const BRACO = 30;                     // meia largura de cada braço e da praça central
export const ALCANCE = 80;                   // distância da praça até a ponta de cada braço
const PAREDE = 2;                            // espessura das paredes invisíveis da costa
export const LIMITE_MAPA = ALCANCE + PAREDE; // raio do mapa e dos colisores da costa
export const RAIO_CIDADE = 11;               // dentro deste raio do centro, o personagem está na cidade

export const INICIO = { x: 0, z: 0 };        // onde o personagem nasce: na praça
export const SINAL = { x: 6, z: 6 };         // placa na praça

// Onde os selvagens rondam: fora das cidades e da praça, espalhados pelos quatro braços.
export const PONTOS_SELVAGENS = [
  [-24, -40], [26, -54], [56, -24], [56, 24], [-26, 34],
  [26, 34], [0, 34], [-46, -26], [-40, 24], [-70, -2],
];

// Retângulos de cada região, em x0..x1 e z0..z1. Norte é -z, Sul é +z, Leste é +x, Oeste é -x.
export const REGIOES = {
  Centro: { x0: -BRACO, x1: BRACO, z0: -BRACO, z1: BRACO, cor: '#8e8b7d' },
  Norte: { x0: -BRACO, x1: BRACO, z0: -ALCANCE, z1: -BRACO, cor: '#56685a' },
  Sul: { x0: -BRACO, x1: BRACO, z0: BRACO, z1: ALCANCE, cor: '#4d4663' },
  Leste: { x0: BRACO, x1: ALCANCE, z0: -BRACO, z1: BRACO, cor: '#8d8064' },
  Oeste: { x0: -ALCANCE, x1: -BRACO, z0: -BRACO, z1: BRACO, cor: '#5e7463' },
};

// Centro de cada cidade. Cada cidade cabe num quadrado de cerca de 19 unidades, dentro da sua região.
const POSICOES = {
  'Aldeia Verde': { x: -13, z: -62 }, 'Pedra Alta': { x: 13, z: -66 }, 'Rio Fundo': { x: 0, z: -44 },
  'Vale Cinzento': { x: 44, z: -14 }, 'Monte Brasa': { x: 44, z: 14 }, 'Enseada Clara': { x: 66, z: 0 },
  'Campo Dourado': { x: -13, z: 46 }, 'Mata Sombria': { x: 16, z: 50 }, 'Ponte Partida': { x: 0, z: 66 },
  'Forte Velho': { x: -62, z: -14 }, 'Fazenda Mansa': { x: -50, z: 8 }, 'Lago Espelho': { x: -68, z: 18 },
};

// Posições das casas em volta da prefeitura (anel de 3 x 3 sem o centro), e cores de paredes.
const ANEL = [[-7, -7], [0, -7], [7, -7], [7, 0], [7, 7], [0, 7], [-7, 7], [-7, 0]];
const CORES = ['#d9b48f', '#c9d6e3', '#e7c9a9', '#bfd8b0'];
const TELHADOS = ['#8a4b3a', '#5b5f73', '#6e4a2f', '#7a3e3e'];

// Número pseudo-aleatório determinístico em [0, 1): o mesmo mundo sai igual em todo carregamento.
function ruido(semente) {
  let h = Math.imul(semente ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function construirCidade(nome, regiao, i) {
  const { x: cx, z: cz } = POSICOES[nome];
  const edificios = [{ x: cx, z: cz, w: 5, d: 4, h: 4.5, cor: '#e8d28a', telhado: '#7a3e3e', central: true, cidade: nome }];
  const inicio = Math.floor(ruido(i * 31 + 1) * ANEL.length);
  for (let k = 0; k < 6; k++) {
    const [ax, az] = ANEL[(inicio + k) % ANEL.length];
    const s = i * 100 + k * 10;
    edificios.push({
      x: cx + ax + (ruido(s + 1) - 0.5) * 1.2,
      z: cz + az + (ruido(s + 2) - 0.5) * 1.2,
      w: 2.6 + ruido(s + 3) * 0.9,
      d: 2.6 + ruido(s + 4) * 0.9,
      h: 2.2 + ruido(s + 5) * 1.6,
      cor: CORES[Math.floor(ruido(s + 6) * CORES.length)],
      telhado: TELHADOS[Math.floor(ruido(s + 7) * TELHADOS.length)],
      central: false,
      cidade: nome,
    });
  }
  return { nome, regiao, x: cx, z: cz, edificios };
}

export const CIDADES_MUNDO = CIDADES.map((c, i) => construirCidade(c.nome, c.regiao, i));
export const EDIFICIOS = CIDADES_MUNDO.flatMap((c) => c.edificios);

// ---- Natureza: lago, árvores, pedras e estradas. Posições sorteadas com ruído fixo: o mundo sai igual sempre. ----
export const LAGO = { x: -42, z: -18, rx: 7, rz: 5 };   // Lago do Oeste: elipse entre o Forte Velho e a Fazenda Mansa
const dentroLago = (x, z, margem = 0) => ((x - LAGO.x) / (LAGO.rx + margem)) ** 2 + ((z - LAGO.z) / (LAGO.rz + margem)) ** 2 <= 1;

// Estradas, paralelas aos eixos: os dois eixos do cruzamento e um caminho de cada cidade até o eixo mais próximo.
export const ESTRADAS = [
  { x0: -ALCANCE, z0: 0, x1: ALCANCE, z1: 0, largura: 3 },
  { x0: 0, z0: -ALCANCE, x1: 0, z1: ALCANCE, largura: 3 },
  ...CIDADES_MUNDO.flatMap((c) => {
    if (c.regiao === 'Norte' || c.regiao === 'Sul') return Math.abs(c.x) < 0.5 ? [] : [{ x0: c.x, z0: c.z, x1: 0, z1: c.z, largura: 2 }];
    return Math.abs(c.z) < 0.5 ? [] : [{ x0: c.x, z0: c.z, x1: c.x, z1: 0, largura: 2 }];
  }),
];

function distanciaAoSegmento(x, z, e) {
  const px = Math.min(Math.max(x, Math.min(e.x0, e.x1)), Math.max(e.x0, e.x1));
  const pz = Math.min(Math.max(z, Math.min(e.z0, e.z1)), Math.max(e.z0, e.z1));
  return Math.hypot(x - px, z - pz);
}

// Casa de teste: a única casa do mapa por enquanto (as casas das cidades estão fora). Fica perto do início, fora da praça.
export const CASA_TESTE = { x: -12, z: -6, largura: 5.4, profundidade: 3.6 };

const OCUPADOS = [];   // árvores e pedras já colocadas: nada nasce encostado nelas

// Cabe um objeto de raio `raio` aqui? Dentro da própria região, longe dos eixos, da praça, das cidades, do lago,
// das estradas, dos pontos de ronda e de outros objetos.
function livre(x, z, raio, regiao) {
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    if (regiaoDe(x + sx * raio, z + sz * raio) !== regiao) return false;
  }
  if (Math.abs(x) < 4.5 + raio || Math.abs(z) < 4.5 + raio) return false;
  if (Math.hypot(x, z) < 13 + raio) return false;
  if (Math.hypot(x - CASA_TESTE.x, z - CASA_TESTE.z) < 6 + raio) return false;
  if (CIDADES_MUNDO.some((c) => Math.hypot(x - c.x, z - c.z) < 13 + raio)) return false;
  if (dentroLago(x, z, raio + 1.5)) return false;
  if (PONTOS_SELVAGENS.some(([px, pz]) => Math.hypot(x - px, z - pz) < 4 + raio)) return false;
  if (ESTRADAS.some((e) => distanciaAoSegmento(x, z, e) < e.largura / 2 + 1 + raio)) return false;
  return OCUPADOS.every((o) => Math.hypot(x - o.x, z - o.z) >= raio + o.raio);
}

// Varre a região em grade de `passo` unidades. Cada célula recebe uma semente própria (região, linha, coluna, sal).
const ORDEM_REGIAO = { Norte: 1, Sul: 2, Leste: 3, Oeste: 4 };
function varrerGrade(regiao, passo, sal, fn) {
  const r = REGIOES[regiao];
  let i = 0;
  for (let x = r.x0 + passo / 2; x < r.x1; x += passo) {
    let j = 0;
    for (let z = r.z0 + passo / 2; z < r.z1; z += passo) {
      fn(x, z, ORDEM_REGIAO[regiao] * 100003 + i * 1009 + j * 917 + sal);
      j++;
    }
    i++;
  }
}

// Árvores: copa redonda, pinheiro (mais escuro, no Sul) e árvore morta (no Vale das Cinzas). Mais densas no Norte e no Sul.
const CHANCE_ARVORE = { Norte: 0.85, Sul: 0.9, Leste: 0.3, Oeste: 0.25 };
const TIPOS_ARVORE = { Norte: ['copa', 'pinheiro'], Sul: ['pinheiro', 'pinheiro', 'morta'], Leste: ['morta'], Oeste: ['copa', 'copa', 'pinheiro'] };
export const ARVORES = [];
for (const regiao of Object.keys(TIPOS_ARVORE)) {
  varrerGrade(regiao, 5.5, 0, (cx, cz, s) => {
    const x = cx + (ruido(s + 1) - 0.5) * 3;
    const z = cz + (ruido(s + 2) - 0.5) * 3;
    const perto = regiao === 'Oeste' && Math.hypot(x - LAGO.x, z - LAGO.z) < 16;   // mais árvores em volta do lago
    if (ruido(s + 3) > (perto ? 0.7 : CHANCE_ARVORE[regiao])) return;
    if (!livre(x, z, 0.6, regiao)) return;
    const tipos = TIPOS_ARVORE[regiao];
    ARVORES.push({
      x, z, regiao, tipo: tipos[Math.floor(ruido(s + 4) * tipos.length)],
      escala: 0.9 + ruido(s + 5) * 0.4, giro: ruido(s + 6) * Math.PI * 2, tom: Math.floor(ruido(s + 7) * 3),
    });
    OCUPADOS.push({ x, z, raio: 0.6 });
  });
}

// Pedras: maiores e mais comuns no Vale das Cinzas.
const CHANCE_PEDRA = { Norte: 0.15, Sul: 0.2, Leste: 0.4, Oeste: 0.2 };
export const PEDRAS = [];
for (const regiao of Object.keys(CHANCE_PEDRA)) {
  varrerGrade(regiao, 7, 50000, (cx, cz, s) => {
    const x = cx + (ruido(s + 1) - 0.5) * 4;
    const z = cz + (ruido(s + 2) - 0.5) * 4;
    if (ruido(s + 3) > CHANCE_PEDRA[regiao]) return;
    const r = 0.7 + ruido(s + 4) * 0.9;
    if (!livre(x, z, r, regiao)) return;
    PEDRAS.push({ x, z, regiao, r, altura: 0.6 + ruido(s + 5) * 0.5, giro: ruido(s + 6) * Math.PI * 2, tom: Math.floor(ruido(s + 7) * 3) });
    OCUPADOS.push({ x, z, raio: r });
  });
}

// Lago: cada trecho contínuo de células (1 x 1) dentro da elipse, com meia célula de folga, vira uma caixa de colisão.
const caixaRetangular = (x0, x1, z0, z1) => ({ min: { x: x0, y: 0, z: z0 }, max: { x: x1, y: 4, z: z1 } });
const CAIXAS_LAGO = [];
for (let z = Math.floor(LAGO.z - LAGO.rz - 2); z < Math.ceil(LAGO.z + LAGO.rz + 2); z++) {
  let inicio = null;
  for (let x = Math.floor(LAGO.x - LAGO.rx - 2); x <= Math.ceil(LAGO.x + LAGO.rx + 2); x++) {
    const cheia = dentroLago(x + 0.5, z + 0.5, 0.5);
    if (cheia && inicio === null) inicio = x;
    if (!cheia && inicio !== null) { CAIXAS_LAGO.push(caixaRetangular(inicio, x, z, z + 1)); inicio = null; }
  }
}

// Costa: os quatro cantos fora da cruz e as pontas dos braços. O personagem não passa daqui.
const COSTA = [
  { x0: BRACO, x1: LIMITE_MAPA, z0: BRACO, z1: LIMITE_MAPA },
  { x0: -LIMITE_MAPA, x1: -BRACO, z0: BRACO, z1: LIMITE_MAPA },
  { x0: BRACO, x1: LIMITE_MAPA, z0: -LIMITE_MAPA, z1: -BRACO },
  { x0: -LIMITE_MAPA, x1: -BRACO, z0: -LIMITE_MAPA, z1: -BRACO },
  { x0: -BRACO, x1: BRACO, z0: ALCANCE, z1: LIMITE_MAPA },
  { x0: -BRACO, x1: BRACO, z0: -LIMITE_MAPA, z1: -ALCANCE },
  { x0: ALCANCE, x1: LIMITE_MAPA, z0: -BRACO, z1: BRACO },
  { x0: -LIMITE_MAPA, x1: -ALCANCE, z0: -BRACO, z1: BRACO },
];

// Caixas de colisão: a costa (até 4 unidades de altura).
const caixaDeRetangulo = (r) => ({ min: { x: r.x0, y: 0, z: r.z0 }, max: { x: r.x1, y: 4, z: r.z1 } });
const caixaDeArvore = (a) => ({ min: { x: a.x - 0.4, y: 0, z: a.z - 0.4 }, max: { x: a.x + 0.4, y: 4, z: a.z + 0.4 } });
const caixaDePedra = (p) => ({
  min: { x: p.x - p.r * 0.85, y: 0, z: p.z - p.r * 0.85 },
  max: { x: p.x + p.r * 0.85, y: p.altura * 1.5, z: p.z + p.r * 0.85 },
});
const CAIXA_CASA_TESTE = caixaRetangular(
  CASA_TESTE.x - CASA_TESTE.largura / 2, CASA_TESTE.x + CASA_TESTE.largura / 2,
  CASA_TESTE.z - CASA_TESTE.profundidade / 2, CASA_TESTE.z + CASA_TESTE.profundidade / 2,
);
// Colisão: a casa de teste, a costa, árvores, pedras e o lago. As casas das cidades não bloqueiam (estão fora do mapa).
export const CAIXAS = [
  CAIXA_CASA_TESTE, ...COSTA.map(caixaDeRetangulo),
  ...ARVORES.map(caixaDeArvore), ...PEDRAS.map(caixaDePedra), ...CAIXAS_LAGO,
];

// Região de um ponto da ilha, ou null se estiver no mar.
export function regiaoDe(x, z) {
  for (const [nome, r] of Object.entries(REGIOES)) {
    if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return nome;
  }
  return null;
}

// Onde está o personagem: a região e, se estiver dentro do raio, a cidade mais próxima.
export function localDe(x, z) {
  const regiao = regiaoDe(x, z);
  if (!regiao) return null;
  let cidade = null;
  let menor = RAIO_CIDADE;
  for (const c of CIDADES_MUNDO) {
    const d = Math.hypot(x - c.x, z - c.z);
    if (d < menor) { menor = d; cidade = c.nome; }
  }
  return { regiao, cidade };
}
