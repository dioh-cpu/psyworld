// Catálogo de espécies (GDD v1.30). Cada espécie é um dado: para criar uma nova, adicione uma entrada aqui
// e rode os testes. O validador aponta o que está faltando.
//   origem: 'base' (sai em encontro, ovo, breed e invocação) ou 'evento' (sai só de missões do evento).
//   pureza: 'luz', 'neutra' ou 'trevas'.
//   aptidoes: nível de 1 a 10 por tarefa de fazenda. Ligadas ao tipo físico (lista de tipos em aberto).
//   habilidades: pelo menos 4. As 4 primeiras são as base; as seguintes entram com a absorção do breed.
//   arte (opcional): caminho do sprite. Sem arte, aparece a silhueta genérica.
export const PUREZAS = ['luz', 'neutra', 'trevas'];
export const ORIGENS = ['base', 'evento', 'raid'];
export const TAREFAS_APTIDAO = ['plantar', 'colher', 'minerar', 'cortar', 'garimpar', 'transportar', 'cozinhar', 'fabricar'];

export const ESPECIES = {
  Noctarn: {
    origem: 'base', pureza: 'trevas', aptidoes: { minerar: 4, garimpar: 2 },
    habilidades: ['Mordida Umbral', 'Garra de Sombra', 'Chama Violeta', 'Uivo Sinistro', 'Véu Noturno'],
    arte: 'assets/monsters/noctarn/sprite-front.png',
    animacoes: {
      worldHeight: 138,
      idle4dir: 'assets/monsters/noctarn/noctarn-idle-4dir.webp',
      idle: {
        down:  { url: 'assets/monsters/noctarn/idle-front.mp4', width: 480, height: 262, scale: 1,     baseY: 0.9847, pawCx: 0.5182 },
        left:  { url: 'assets/monsters/noctarn/idle-left.mp4',  width: 480, height: 270, scale: 1.083, baseY: 0.9556, pawCx: 0.5307 },
        right: { url: 'assets/monsters/noctarn/idle-left.mp4',  width: 480, height: 270, scale: 1.083, baseY: 0.9556, pawCx: 0.5307, flip: true },
        up:    { url: 'assets/monsters/noctarn/idle-back.mp4',  width: 480, height: 270, scale: 1.074, baseY: 0.9556, pawCx: 0.4901 },
      },
      walk: {
        down:  { url: 'assets/monsters/noctarn/walk-front.mp4', width: 480, height: 270, scale: 1.097, baseY: 0.9370, pawCx: 0.4557 },
        left:  { url: 'assets/monsters/noctarn/walk-left.mp4',  width: 480, height: 270, scale: 1.234, baseY: 0.9519, pawCx: 0.4807 },
        right: { url: 'assets/monsters/noctarn/walk-left.mp4',  width: 480, height: 270, scale: 1.234, baseY: 0.9519, pawCx: 0.4807, flip: true },
        up:    { url: 'assets/monsters/noctarn/walk-back.mp4',  width: 480, height: 270, scale: 1.083, baseY: 0.9519, pawCx: 0.4901 },
      },
    },
  },
  Ignavor: {
    origem: 'base', pureza: 'luz', elemento: 'fogo', aptidoes: { plantar: 3, colher: 2, cortar: 3, transportar: 2 },
    habilidades: ['Golpe Couraçado', 'Brasa Imperial', 'Juba Flamejante', 'Rugido Dourado', 'Escudo de Ferro'],
    passiva: { nome: 'Couraça Lenta', texto: 'Recebe menos dano no primeiro golpe de cada luta.' },
  },
  Vaelith: {
    origem: 'base', pureza: 'luz', elemento: 'agua', aptidoes: { colher: 2, fabricar: 2, garimpar: 3 },
    habilidades: ['Pulso Astral', 'Arco Ciano', 'Cauda de Cristal', 'Véu Gelado', 'Fenda Estelar'],
    passiva: { nome: 'Eco Astral', texto: 'Tem 10% de chance de repetir a última habilidade usada.' },
  },
  // Exclusivos de evento (nomes e habilidades provisórios).
  Lumivela: { origem: 'evento', pureza: 'luz', aptidoes: { colher: 2, transportar: 2 }, habilidades: ['Pétala Lunar', 'Brilho Sereno', 'Véu Prateado', 'Canto da Lua', 'Orvalho Astral'], passiva: { nome: 'Luz da Lua', texto: 'Vencer um andar da zona dá 5 XP a mais.' } },
  Brotavel: { origem: 'evento', pureza: 'luz', elemento: 'planta', aptidoes: { plantar: 3, colher: 2 }, habilidades: ['Raiz Viva', 'Espora Verde', 'Broto Fértil', 'Chuva Doce', 'Casca Firme'], passiva: { nome: 'Raiz Generosa', texto: 'A coleta da fazenda rende 10% a mais.' } },
  Cristalino: { origem: 'evento', pureza: 'neutra', aptidoes: { garimpar: 3, minerar: 2 }, habilidades: ['Lasca Prismática', 'Eco Glacial', 'Facetas', 'Brilho Frio', 'Núcleo Puro'], passiva: { nome: 'Prisma', texto: 'O garimpo rende 10% a mais.' } },
  Abyssar: { origem: 'evento', pureza: 'trevas', aptidoes: { minerar: 2, cortar: 2 }, habilidades: ['Sombra Funda', 'Fenda Negra', 'Garra Abissal', 'Sussurro', 'Maré Escura'], passiva: { nome: 'Sombra Faminta', texto: 'Ganha 1 de vínculo por dia.' } },
  Solarin: { origem: 'evento', pureza: 'luz', elemento: 'fogo', aptidoes: { cortar: 2, fabricar: 2 }, habilidades: ['Chama Solar', 'Raio Dourado', 'Asas de Sol', 'Calor Lento', 'Aurora'], passiva: { nome: 'Sol Permanente', texto: 'Dá 1 de sanidade ao dono por dia.' } },
  // Bosses de raid (v1.33): ovos de raid saem com essas espécies. Não aparecem em encontro, ovo comum nem invocação.
  'Titã de Cinza': { origem: 'raid', pureza: 'neutra', elemento: 'fogo', aptidoes: { minerar: 3, cortar: 2 }, habilidades: ['Pisão Sísmico', 'Pele de Pedra', 'Rachadura', 'Eco da Montanha', 'Grito Cinza'] },
  'Serpe do Abismo': { origem: 'raid', pureza: 'trevas', elemento: 'trevas', aptidoes: { garimpar: 2, minerar: 2 }, habilidades: ['Bote Profundo', 'Sopro Sombrio', 'Escamas Negras', 'Chamado Abissal', 'Anel Gélido'] },
  'Coroa Solar': { origem: 'raid', pureza: 'luz', elemento: 'luz', aptidoes: { fabricar: 2, colher: 2 }, habilidades: ['Raio Coroado', 'Halo Ardente', 'Eclipse Breve', 'Ouro Vivo', 'Manto de Luz'] },
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
export const ANIMACOES_DA_ESPECIE = Object.fromEntries(Object.entries(ESPECIES).filter(([, e]) => e.animacoes).map(([k, e]) => [k, e.animacoes]));
export const PASSIVA_DA_ESPECIE = Object.fromEntries(Object.entries(ESPECIES).filter(([, e]) => e.passiva).map(([k, e]) => [k, e.passiva]));
// Elemento de cada espécie (v1.34). Sem elemento explícito, vale o da pureza: luz, trevas ou neutro.
const ELEMENTO_PELA_PUREZA = { luz: 'luz', trevas: 'trevas', neutra: 'neutro' };
export const ELEMENTO_DA_ESPECIE = Object.fromEntries(Object.entries(ESPECIES).map(([k, e]) => [k, e.elemento ?? ELEMENTO_PELA_PUREZA[e.pureza]]));
// Habilidades e passivas com o mesmo nome em mais de uma espécie. Vazio quando todas são únicas.
export function repetidosNoCatalogo(catalogo = ESPECIES) {
  const vistos = new Map();
  const repetidos = [];
  for (const [esp, e] of Object.entries(catalogo)) {
    for (const nome of [...(e.habilidades || []), ...(e.passiva ? [e.passiva.nome] : [])]) {
      if (vistos.has(nome)) repetidos.push(`${nome} (${vistos.get(nome)} e ${esp})`);
      else vistos.set(nome, esp);
    }
  }
  return repetidos;
}
