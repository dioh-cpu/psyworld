// Catálogo de espécies (GDD v1.30). Cada espécie é um dado: para criar uma nova, adicione uma entrada aqui
// e rode os testes. O validador aponta o que está faltando.
//   origem: 'base' (sai em encontro, ovo, breed e invocação) ou 'evento' (sai só de missões do evento).
//   pureza: 'luz', 'neutra' ou 'trevas'.
//   aptidoes: nível de 1 a 10 por tarefa de fazenda. Ligadas ao tipo físico (lista de tipos em aberto).
//   habilidades: pelo menos 4. As 4 primeiras são as base; as seguintes entram com a absorção do breed.
//   arte (opcional): caminho do sprite. Sem arte, aparece a silhueta genérica.
export const PUREZAS = ['luz', 'neutra', 'trevas'];
export const ORIGENS = ['base', 'evento'];
export const TAREFAS_APTIDAO = ['plantar', 'colher', 'minerar', 'cortar', 'garimpar', 'transportar', 'cozinhar', 'fabricar'];

export const ESPECIES = {
  Noctarn: {
    origem: 'base', pureza: 'trevas', aptidoes: { minerar: 4, garimpar: 2 },
    habilidades: ['Mordida Umbral', 'Garra de Sombra', 'Chama Violeta', 'Uivo Sinistro', 'Véu Noturno'],
    arte: 'assets/monsters/noctarn/sprite-front.png',
  },
  Ignavor: {
    origem: 'base', pureza: 'luz', aptidoes: { plantar: 3, colher: 2, cortar: 3, transportar: 2 },
    habilidades: ['Golpe Couraçado', 'Brasa Imperial', 'Juba Flamejante', 'Rugido Dourado', 'Escudo de Ferro'],
  },
  Vaelith: {
    origem: 'base', pureza: 'luz', aptidoes: { colher: 2, fabricar: 2, garimpar: 3 },
    habilidades: ['Pulso Astral', 'Arco Ciano', 'Cauda de Cristal', 'Véu Gelado', 'Fenda Estelar'],
  },
  // Exclusivos de evento (nomes e habilidades provisórios).
  Lumivela: { origem: 'evento', pureza: 'luz', aptidoes: { colher: 2, transportar: 2 }, habilidades: ['Pétala Lunar', 'Brilho Sereno', 'Véu Prateado', 'Canto da Lua', 'Orvalho Astral'] },
  Brotavel: { origem: 'evento', pureza: 'luz', aptidoes: { plantar: 3, colher: 2 }, habilidades: ['Raiz Viva', 'Espora Verde', 'Broto Fértil', 'Chuva Doce', 'Casca Firme'] },
  Cristalino: { origem: 'evento', pureza: 'neutra', aptidoes: { garimpar: 3, minerar: 2 }, habilidades: ['Lasca Prismática', 'Eco Glacial', 'Facetas', 'Brilho Frio', 'Núcleo Puro'] },
  Abyssar: { origem: 'evento', pureza: 'trevas', aptidoes: { minerar: 2, cortar: 2 }, habilidades: ['Sombra Funda', 'Fenda Negra', 'Garra Abissal', 'Sussurro', 'Maré Escura'] },
  Solarin: { origem: 'evento', pureza: 'luz', aptidoes: { cortar: 2, fabricar: 2 }, habilidades: ['Chama Solar', 'Raio Dourado', 'Asas de Sol', 'Calor Lento', 'Aurora'] },
};

// Lista de problemas de uma espécie. Vazia quando está completa.
export function validarEspecie(nome, e) {
  const erros = [];
  if (!PUREZAS.includes(e.pureza)) erros.push(`${nome}: pureza inválida (${e.pureza})`);
  if (!ORIGENS.includes(e.origem)) erros.push(`${nome}: origem inválida (${e.origem})`);
  for (const [tarefa, nivel] of Object.entries(e.aptidoes || {})) {
    if (!TAREFAS_APTIDAO.includes(tarefa)) erros.push(`${nome}: aptidão desconhecida (${tarefa})`);
    if (!Number.isInteger(nivel) || nivel < 1 || nivel > 10) erros.push(`${nome}: nível de ${tarefa} deve ser de 1 a 10`);
  }
  if (!Array.isArray(e.habilidades) || e.habilidades.length < 4) erros.push(`${nome}: precisa de pelo menos 4 habilidades`);
  else if (new Set(e.habilidades).size !== e.habilidades.length) erros.push(`${nome}: habilidades repetidas`);
  if (e.arte !== undefined && typeof e.arte !== 'string') erros.push(`${nome}: arte deve ser um caminho`);
  return erros;
}
export function validarCatalogo(catalogo = ESPECIES) {
  return Object.entries(catalogo).flatMap(([nome, e]) => validarEspecie(nome, e));
}

// Derivados: as listas que o jogo usa, todas saindo do catálogo.
const porOrigem = (origem) => Object.keys(ESPECIES).filter((k) => ESPECIES[k].origem === origem);
export const ESPECIES_BASE = porOrigem('base');
export const ESPECIES_EVENTO = porOrigem('evento');
export const HABILIDADES_DA_ESPECIE = Object.fromEntries(Object.entries(ESPECIES).map(([k, e]) => [k, e.habilidades]));
export const APTIDOES_DA_ESPECIE = Object.fromEntries(Object.entries(ESPECIES).map(([k, e]) => [k, e.aptidoes || {}]));
export const ARTE_DA_ESPECIE = Object.fromEntries(Object.entries(ESPECIES).filter(([, e]) => e.arte).map(([k, e]) => [k, e.arte]));
