// Mundo da ilha para o protótipo em terceira pessoa. O layout é uma cruz: quatro regiões (Norte, Leste, Sul, Oeste)
// em volta de uma praça central, com as doze cidades do sistema 31 e o mar fechado por paredes invisíveis.
// Código puro, sem three.js. Os prédios são placeholders de posição e tamanho; a arte vem depois.
import { CIDADES } from '../mundo/sistemas-31.js';

export const BRACO = 30;                     // meia largura de cada braço e da praça central
export const ALCANCE = 80;                   // distância da praça até a ponta de cada braço
const PAREDE = 2;                            // espessura das paredes invisíveis da costa
export const LIMITE_MAPA = ALCANCE + PAREDE; // raio do mapa e dos colisores da costa
export const RAIO_CIDADE = 11;               // dentro deste raio do centro, o personagem está na cidade

export const INICIO = { x: 0, z: 0 };        // onde o personagem nasce: na praça
export const SINAL = { x: 6, z: 6 };         // placa na praça

// Retângulos de cada região, em x0..x1 e z0..z1. Norte é -z, Sul é +z, Leste é +x, Oeste é -x.
export const REGIOES = {
  Centro: { x0: -BRACO, x1: BRACO, z0: -BRACO, z1: BRACO, cor: '#8e8b7d' },
  Norte: { x0: -BRACO, x1: BRACO, z0: -ALCANCE, z1: -BRACO, cor: '#56685a' },
  Sul: { x0: -BRACO, x1: BRACO, z0: BRACO, z1: ALCANCE, cor: '#9a8556' },
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
  const edificios = [{ x: cx, z: cz, w: 5, d: 4, h: 4.5, cor: '#e8d28a', central: true, cidade: nome }];
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
      central: false,
      cidade: nome,
    });
  }
  return { nome, regiao, x: cx, z: cz, edificios };
}

export const CIDADES_MUNDO = CIDADES.map((c, i) => construirCidade(c.nome, c.regiao, i));
export const EDIFICIOS = CIDADES_MUNDO.flatMap((c) => c.edificios);

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

// Caixas de colisão: prédios (do chão até o topo) e a costa (até 4 unidades de altura).
const caixaDeEdificio = (e) => ({
  min: { x: e.x - e.w / 2, y: 0, z: e.z - e.d / 2 },
  max: { x: e.x + e.w / 2, y: e.h, z: e.z + e.d / 2 },
});
const caixaDeRetangulo = (r) => ({ min: { x: r.x0, y: 0, z: r.z0 }, max: { x: r.x1, y: 4, z: r.z1 } });
export const CAIXAS = [...EDIFICIOS.map(caixaDeEdificio), ...COSTA.map(caixaDeRetangulo)];

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
