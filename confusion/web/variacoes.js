// Variações de cor dos monstrinhos (oníricos): a mesma espécie em outra cor, com outro elemento e outro conjunto de habilidades.
// Cada espécie tem uma variação para cada elemento que não é o natural. Surgem só no breed e na exploração
// (batalhas ao redor do mundo). A cor é um giro de matiz do desenho, partindo do matiz do elemento natural da espécie.
// Código puro, sem DOM. Nomes de habilidades e cores são provisórios: confirmar antes de publicar.
import { ELEMENTO_DA_ESPECIE, HABILIDADES_DA_ESPECIE } from './species.js';

export const ORIGENS_DE_VARIACAO = ['breed', 'explorar'];   // só estas origens dão variação
export const CHANCE_VARIACAO = 0.3;                          // chance de nascer ou aparecer em variação, nessas origens

// Cada cor é um elemento. matiz: cor-alvo em graus (0 vermelho, 120 verde, 210 azul, 270 roxo).
// sat e bri ajustam a saturação e o brilho da variação (marrom é dessaturado; cinza quase não tem cor).
export const COR = {
  fogo: { nome: 'vermelho', matiz: 15, sat: 1.25, bri: 1.0 },
  agua: { nome: 'azul', matiz: 210, sat: 1.2, bri: 1.0 },
  planta: { nome: 'verde', matiz: 120, sat: 1.15, bri: 1.0 },
  terra: { nome: 'marrom', matiz: 30, sat: 0.7, bri: 0.95 },
  luz: { nome: 'dourado', matiz: 48, sat: 1.2, bri: 1.1 },
  trevas: { nome: 'roxo', matiz: 270, sat: 1.1, bri: 0.85 },
  neutro: { nome: 'cinza', matiz: 0, sat: 0.08, bri: 0.95 },
};

// Habilidades de cada elemento (cinco por elemento). Usadas pela variação de qualquer espécie daquele elemento.
export const HABILIDADES_DO_ELEMENTO = {
  fogo: ['Brasa Viva', 'Chama Rubra', 'Explosão Ígnea', 'Cinza Quente', 'Labareda Feroz'],
  agua: ['Jato Azul', 'Onda Imperial', 'Corrente Gélida', 'Maré Profunda', 'Escudo de Maré'],
  planta: ['Vinha Cortante', 'Pólen Adormecedor', 'Raiz Espinhosa', 'Seiva Curativa', 'Ramo Vivo'],
  terra: ['Pedra Rolante', 'Avalanche Leve', 'Tremor Surdo', 'Barro Pesado', 'Muralha Viva'],
  luz: ['Lâmina Clara', 'Brilho Sereno', 'Halo Cortante', 'Luz Pulsante', 'Feixe Estelar'],
  trevas: ['Sombra Voraz', 'Véu Escuro', 'Pesadelo Lento', 'Mordida Sombria', 'Eclipse Silencioso'],
  neutro: ['Golpe Cru', 'Investida', 'Pancada Firme', 'Rugido Bruto', 'Escudo Simples'],
};

// Espécies de desenho quase sem cor (prateado): a variação colore o desenho em vez de só girar a cor que já existe.
export const COLORIR = new Set(['Solarin']);

export const elementoNatural = (especie) => ELEMENTO_DA_ESPECIE[especie] ?? 'neutro';

// Os elementos em que a espécie aparece em variação (todos, menos o natural).
export const variacoesDaEspecie = (especie) => Object.keys(COR).filter((e) => e !== elementoNatural(especie));

export const nomeDaVariacao = (elemento) => (elemento ? `Onírico ${COR[elemento].nome}` : null);

// Cor da variação. Em geral: { matiz (graus a girar), sat, bri }. Nas espécies de COLORIR, o matiz é a cor-alvo
// e o desenho é colorido a partir do cinza (colorir: true). Natural (sem variação) não tem cor de variação.
export function giroDaVariacao(especie, elemento) {
  if (!elemento || elemento === elementoNatural(especie)) return null;
  const alvo = COR[elemento];
  if (COLORIR.has(especie)) return { matiz: alvo.matiz, sat: alvo.sat, bri: alvo.bri, colorir: true };
  const referencia = COR[elementoNatural(especie)].matiz;
  return { matiz: (alvo.matiz - referencia + 360) % 360, sat: alvo.sat, bri: alvo.bri, colorir: false };
}

// O mesmo giro como filtro CSS, para os desenhos nas telas de menu.
export function filtroDaVariacao(especie, elemento) {
  const g = giroDaVariacao(especie, elemento);
  if (!g) return 'none';
  if (g.colorir) return `grayscale(1) brightness(${g.bri * 1.1}) sepia(1) hue-rotate(${g.matiz - 30}deg) saturate(${g.sat * 2.2})`;
  return `hue-rotate(${g.matiz}deg) saturate(${g.sat}) brightness(${g.bri})`;
}

// Sorteia uma variação. Só dá variação nas origens permitidas; em qualquer outra origem devolve null.
// rnd devolve um número em [0, 1).
export function sortearVariacao(especie, origem, rnd) {
  if (!ORIGENS_DE_VARIACAO.includes(origem)) return null;
  if (rnd() >= CHANCE_VARIACAO) return null;
  const opcoes = variacoesDaEspecie(especie);
  return opcoes[Math.min(opcoes.length - 1, Math.floor(rnd() * opcoes.length))];
}

// Aplica a variação a um monstrinho: troca o elemento e o conjunto de habilidades. O natural não muda nada.
export function aplicarVariacao(m, elemento) {
  if (!elemento || elemento === elementoNatural(m.species)) return m;
  m.variante = elemento;
  m.elemento = elemento;
  m.abilities = HABILIDADES_DO_ELEMENTO[elemento].slice(0, 4);
  return m;
}

// Habilidades que o monstrinho pode colocar nos slots: as da variação, ou as da espécie.
export const habilidadesDoMonstro = (m) => (m.variante ? HABILIDADES_DO_ELEMENTO[m.variante] : HABILIDADES_DA_ESPECIE[m.species]);
export const giroDoMonstro = (m) => giroDaVariacao(m.species, m.variante);
