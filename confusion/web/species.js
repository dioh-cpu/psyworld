// Catálogo de espécies (GDD v1.30). Cada espécie é um dado: para criar uma nova, adicione uma entrada aqui
// e rode os testes. O validador aponta o que está faltando.
//   origem: 'base' (sai em encontro, ovo, breed e invocação) ou 'evento' (sai só de missões do evento).
//   pureza: 'luz', 'neutra' ou 'trevas'.
//   aptidoes: nível de 1 a 10 por tarefa de fazenda. Ligadas ao tipo físico (lista de tipos em aberto).
//   habilidades: pelo menos 4. As 4 primeiras são as base; as seguintes entram com a absorção do breed.
//   arte (opcional): caminho do sprite. Sem arte, aparece a silhueta genérica.
export const PUREZAS = ['luz', 'neutra', 'trevas'];
export const ORIGENS = ['base', 'evento', 'raid', 'linha'];
export const TAREFAS_APTIDAO = ['plantar', 'colher', 'minerar', 'cortar', 'garimpar', 'transportar', 'cozinhar', 'fabricar'];

import { REINOS } from './reinos.js';
import { FORMAS_LINHAGENS_REINOS } from './formas-reinos.js';
import { LINHAGENS_REINOS } from './teste-quarteirao/regiao1-kits-reinos.js';
import { LINHAGENS_HW } from './teste-quarteirao/regiao1-halloween-dados.js';
import { KITS } from './teste-quarteirao/regiao1-batalha-habilidades.js';
export const ESPECIES = {
  Noctarn: {
    origem: 'base', pureza: 'trevas', aptidoes: { minerar: 4, garimpar: 2 },
    habilidades: ['Mordida Umbral', 'Garra de Sombra', 'Chama Violeta', 'Uivo Sinistro', 'Véu Noturno'],
    arte: 'assets/monsters/noctarn/sprite-front.png',
  },
  Ignavor: { arte: 'assets/monsters/ignavor/sprite-front.png',
    origem: 'base', pureza: 'luz', elemento: 'fogo', aptidoes: { plantar: 3, colher: 2, cortar: 3, transportar: 2 },
    habilidades: ['Golpe Couraçado', 'Brasa Imperial', 'Juba Flamejante', 'Rugido Dourado', 'Escudo de Ferro'],
    passiva: { nome: 'Couraça Lenta', texto: 'Recebe menos dano no primeiro golpe de cada luta.' },
  },
  Vaelith: { arte: 'assets/monsters/vaelith/sprite-front.png',
    origem: 'base', pureza: 'luz', elemento: 'agua', aptidoes: { colher: 2, fabricar: 2, garimpar: 3 },
    habilidades: ['Pulso Astral', 'Arco Ciano', 'Cauda de Cristal', 'Véu Gelado', 'Fenda Estelar'],
    passiva: { nome: 'Eco Astral', texto: 'Tem 10% de chance de repetir a última habilidade usada.' },
  },
  // Exclusivos de evento (nomes e habilidades provisórios).
  Lumivela: { origem: 'evento', pureza: 'luz', aptidoes: { colher: 2, transportar: 2 }, habilidades: ['Pétala Lunar', 'Brilho Sereno', 'Véu Prateado', 'Canto da Lua', 'Orvalho Astral'], passiva: { nome: 'Luz da Lua', texto: 'Vencer um andar da zona dá 5 XP a mais.' } },
  Brotavel: { arte: 'assets/monsters/brotavel/sprite-front.png', origem: 'evento', pureza: 'luz', elemento: 'planta', aptidoes: { plantar: 3, colher: 2 }, habilidades: ['Raiz Viva', 'Espora Verde', 'Broto Fértil', 'Chuva Doce', 'Casca Firme'], passiva: { nome: 'Raiz Generosa', texto: 'A coleta da fazenda rende 10% a mais.' } },
  Cristalino: { origem: 'evento', pureza: 'neutra', elemento: 'gelo', aptidoes: { garimpar: 3, minerar: 2 }, habilidades: ['Lasca Prismática', 'Eco Glacial', 'Facetas', 'Brilho Frio', 'Núcleo Puro'], passiva: { nome: 'Prisma', texto: 'O garimpo rende 10% a mais.' } },
  Abyssar: { origem: 'evento', pureza: 'trevas', aptidoes: { minerar: 2, cortar: 2 }, habilidades: ['Sombra Funda', 'Fenda Negra', 'Garra Abissal', 'Sussurro', 'Maré Escura'], passiva: { nome: 'Sombra Faminta', texto: 'Ganha 1 de vínculo por dia.' } },
  Solarin: { arte: 'assets/monsters/solarin/sprite-front.png', origem: 'evento', pureza: 'luz', elemento: 'luz', aptidoes: { cortar: 2, fabricar: 2 }, habilidades: ['Chama Solar', 'Raio Dourado', 'Asas de Sol', 'Calor Lento', 'Aurora'], passiva: { nome: 'Sol Permanente', texto: 'Dá 1 de sanidade ao dono por dia.' } },
  // Bosses de raid (v1.33): ovos de raid saem com essas espécies. Não aparecem em encontro, ovo comum nem invocação.
  'Titã de Cinza': { origem: 'raid', pureza: 'neutra', elemento: 'fogo', aptidoes: { minerar: 3, cortar: 2 }, habilidades: ['Pisão Sísmico', 'Pele de Pedra', 'Rachadura', 'Eco da Montanha', 'Grito Cinza'] },
  'Serpe do Abismo': { origem: 'raid', pureza: 'trevas', elemento: 'trevas', aptidoes: { garimpar: 2, minerar: 2 }, habilidades: ['Bote Profundo', 'Sopro Sombrio', 'Escamas Negras', 'Chamado Abissal', 'Anel Gélido'] },
  'Coroa Solar': { origem: 'raid', pureza: 'luz', elemento: 'luz', aptidoes: { fabricar: 2, colher: 2 }, habilidades: ['Raio Coroado', 'Halo Ardente', 'Eclipse Breve', 'Ouro Vivo', 'Manto de Luz'] },
  // Formas de linha (origem 'linha'): não saem em encontro, ovo comum nem invocação; entram pelo ovo ou pela evolução.
  'Penumbrio': { origem: 'linha', pureza: 'trevas', elemento: 'trevas', aptidoes: { cortar: 1, transportar: 1 }, habilidades: ['Sopro Tímido', 'Mordida Pequena', 'Brilho Violeta', 'Sono Leve'] },
  'Noctarion': { origem: 'linha', pureza: 'trevas', elemento: 'trevas', aptidoes: { minerar: 5, garimpar: 3 }, habilidades: ['Eclipse Umbral', 'Asas Sombrias', 'Garra Violeta', 'Uivo Abissal', 'Chama Noturna'] },
  'Brasinha': { origem: 'linha', pureza: 'luz', elemento: 'fogo', aptidoes: { plantar: 1, cortar: 1 }, habilidades: ['Faísca Tímida', 'Aquecer', 'Bolha de Brasa', 'Pulo Faiscante'] },
  'Ignaraz': { origem: 'linha', pureza: 'luz', elemento: 'fogo', aptidoes: { plantar: 4, cortar: 4, transportar: 3 }, habilidades: ['Couraça Ardente', 'Clarão Imperial', 'Juba Fúria', 'Investida Dourada', 'Escudo Vulcânico'] },
  'Gotalume': { origem: 'linha', pureza: 'luz', elemento: 'agua', aptidoes: { colher: 1, fabricar: 1 }, habilidades: ['Gota Fria', 'Borrifo', 'Véu Leve', 'Bolha Calma'] },
  'Vaelirion': { origem: 'linha', pureza: 'luz', elemento: 'agua', aptidoes: { colher: 4, fabricar: 3, garimpar: 4 }, habilidades: ['Pulso Astral Maior', 'Lâmina de Gelo', 'Cauda Cristalina', 'Névoa Ciano', 'Trovão Ártico'] },
  'Sementil': { origem: 'linha', pureza: 'luz', elemento: 'planta', aptidoes: { plantar: 1, colher: 1 }, habilidades: ['Broto Tímido', 'Casca Leve', 'Pólen Doce', 'Raiz Curiosa'] },
  'Florivel': { origem: 'linha', pureza: 'luz', elemento: 'planta', aptidoes: { plantar: 4, colher: 4, garimpar: 2 }, habilidades: ['Floração Mestra', 'Espinhos Vivos', 'Chuva de Pétalas', 'Galho Ancestral', 'Seiva Curativa'] },
  'Solinho': { origem: 'linha', pureza: 'luz', elemento: 'luz', aptidoes: { cortar: 1, fabricar: 1 }, habilidades: ['Brilho Morno', 'Asinha Quente', 'Faísca Solar', 'Calor Suave'] },
  'Helíssio': { origem: 'linha', pureza: 'luz', elemento: 'luz', aptidoes: { cortar: 4, fabricar: 4, transportar: 2 }, habilidades: ['Sol Coroado', 'Raio Helíaco', 'Asas Radiantes', 'Eclipse Dourado', 'Aurora Ardente'] },
};

// Linhagens dos reinos (reinos.js): entram no catálogo como formas de linha, fora de encontro, ovo comum e invocação.
// Habilidades provisórias (nome + tipo) até o desenho de cada uma; aptidões simples por tipo.
const GOLPE_DO_TIPO = { inseto: 'Ferrão', planta: 'Espinho', agua: 'Jato', terra: 'Pisada', pedra: 'Cascalho', fogo: 'Brasa', eletrico: 'Descarga', voador: 'Rasante', aco: 'Lâmina', luz: 'Clarão', trevas: 'Sombra', neutro: 'Impacto', fantasma: 'Espectro' };
const APTIDAO_DO_TIPO = { inseto: { colher: 2 }, planta: { plantar: 2, colher: 2 }, agua: { garimpar: 2 }, terra: { plantar: 2 }, pedra: { minerar: 2 }, fogo: { cozinhar: 2 }, eletrico: { fabricar: 2 }, voador: { transportar: 2 }, aco: { fabricar: 2, minerar: 1 }, luz: { fabricar: 2 }, trevas: { garimpar: 2 }, neutro: { transportar: 2 }, fantasma: { garimpar: 2 } };
for (const r of Object.values(REINOS)) for (const l of r.linhagens) {
  if (ESPECIES[l.nome]) continue;
  const g = GOLPE_DO_TIPO[l.elemento] || 'Golpe';
  ESPECIES[l.nome] = { origem: 'linha', pureza: 'neutra', elemento: l.elemento, aptidoes: APTIDAO_DO_TIPO[l.elemento] || { transportar: 2 }, habilidades: [`${g} de ${l.nome}`, `${g} Duplo de ${l.nome}`, `Investida de ${l.nome}`, `Guarda de ${l.nome}`], ...(l.arte ? { arte: l.arte } : {}) };
}

// Linhagens dos Reinos 03–12 (Expansão 1): registra as 50 linhas (forma base 01, intermediária 02 e final 03)
const RAIZ_REINOS = 'assets/confusion/interface/estrategia/reinos';
const slugReino = (n) => n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const purezaPorElemento = (el) => (el === 'luz' ? 'luz' : el === 'trevas' ? 'trevas' : 'neutra');
export const LINHAS_REINOS = [];
for (const lin of LINHAGENS_REINOS) {
  const formas = FORMAS_LINHAGENS_REINOS[lin.nome];
  if (!formas) continue;
  const rStr = String(lin.reino).padStart(2, '0');
  const pasta = `${RAIZ_REINOS}/${rStr}/oniricos/${slugReino(lin.nome)}`;
  const g = GOLPE_DO_TIPO[lin.elemento] || 'Golpe';
  const apt = APTIDAO_DO_TIPO[lin.elemento] || { transportar: 2 };
  const pur = purezaPorElemento(lin.elemento);
  const trio = [
    { nome: formas.base, fase: 1, habs: [`${g} de ${formas.base}`, `${g} Breve de ${formas.base}`, `Investida de ${formas.base}`, `Guarda de ${formas.base}`] },
    { nome: lin.nome, fase: 2, habs: [...lin.habilidades, `Instinto de ${lin.nome}`] },
    { nome: formas.final, fase: 3, habs: [`${g} Supremo de ${formas.final}`, `${g} Duplo de ${formas.final}`, `Investida de ${formas.final}`, `Guarda de ${formas.final}`] },
  ];
  for (const f of trio) {
    if (ESPECIES[f.nome]) continue;
    ESPECIES[f.nome] = {
      origem: 'linha',
      pureza: pur,
      elemento: lin.elemento,
      classe: lin.classe,
      reino: lin.reino,
      aptidoes: apt,
      habilidades: f.habs,
      arte: `${pasta}/0${f.fase}.png`,
    };
  }
  LINHAS_REINOS.push({ id: slugReino(lin.nome), reino: lin.reino, inicial: formas.base, atual: lin.nome, evolucao: formas.final });
}

// Formas base e finais das cinco linhas iniciais (artes em estrategia/reinos/existentes)
const EXIST = 'assets/confusion/interface/estrategia/reinos/existentes';
for (const [esp, arq] of Object.entries({ Penumbrio: 'noctarn/01-penumbrio', Noctarion: 'noctarn/03-noctarion', Brasinha: 'ignavor/01-brasinha', Ignaraz: 'ignavor/03-ignaraz', Gotalume: 'vaelith/01-gotalume', Vaelirion: 'vaelith/03-vaelirion', Sementil: 'brotavel/01-sementil', Florivel: 'brotavel/03-florivel', Solinho: 'solarin/01-solinho', 'Helíssio': 'solarin/03-helissio' })) if (ESPECIES[esp] && !ESPECIES[esp].arte) ESPECIES[esp].arte = `${EXIST}/${arq}.png`;
// Exclusivos do Banner Mensal de Halloween (origem 'evento': fora de encontro, ovo comum e invocação base). Habilidades = kit + passiva.
for (const l of LINHAGENS_HW) {
  if (ESPECIES[l.especie]) { ESPECIES[l.especie].arte = l.arte[0]; ESPECIES[l.especie].elemento ??= l.elemento; continue; } // Abyssar já existia: ganha a arte nova
  ESPECIES[l.especie] = { origem: 'evento', pureza: 'neutra', elemento: l.elemento, aptidoes: {}, habilidades: [...(KITS[l.especie] || []).map((h) => h.nome), `Instinto de ${l.especie}`], passiva: { nome: `Aura de ${l.especie}`, texto: l.resumo }, arte: l.arte[0] };
}

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
export const PASSIVA_DA_ESPECIE = Object.fromEntries(Object.entries(ESPECIES).filter(([, e]) => e.passiva).map(([k, e]) => [k, e.passiva]));
// Auditoria de elementos por coerência com nome/arte (Reino 10: linhagens de gelo/neve)
const CORRECAO_ELEMENTO_ESPECIE = {
  Geadinha: 'gelo', Geadante: 'gelo', Geadaurora: 'gelo',
  Uivinho: 'gelo', 'Uiválgido': 'gelo', Uivaneve: 'gelo',
  Glacita: 'gelo', Glacivra: 'gelo', 'Glacivípera': 'gelo',
  Nevita: 'gelo', Nevascaio: 'gelo', 'Nevascário': 'gelo',
};
for (const [k, el] of Object.entries(CORRECAO_ELEMENTO_ESPECIE)) {
  if (ESPECIES[k]) ESPECIES[k].elemento = el;
}
// Elemento de cada espécie (v1.34). Sem elemento explícito, vale o da pureza: luz, trevas ou neutro.
const ELEMENTO_PELA_PUREZA = { luz: 'luz', trevas: 'trevas', neutra: 'neutro' };
export const ELEMENTO_DA_ESPECIE = Object.fromEntries(Object.entries(ESPECIES).map(([k, e]) => [k, e.elemento ?? ELEMENTO_PELA_PUREZA[e.pureza]]));
import { CLASSES_ONIRICOS, CLASSE_DA_ESPECIE as CLASSE_REGISTRO, classeDaEspecie } from './teste-quarteirao/regiao1-progressao.js';
for (const [k, e] of Object.entries(ESPECIES)) e.classe = e.classe || classeDaEspecie(k);
export { CLASSES_ONIRICOS, classeDaEspecie };
export const CLASSE_DA_ESPECIE = Object.fromEntries(Object.entries(ESPECIES).map(([k, e]) => [k, e.classe || CLASSE_REGISTRO[k] || classeDaEspecie(k)]));
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

// ---- Linhas de evolução (provisório, no estilo Digimon): forma inicial -> atual -> evolução ----
// Um ovo sempre nasce na forma inicial da sua linha. Nomes e requisitos são provisórios e pedem aprovação.
// As cinco linhas são os cinco iniciais. Brotavel e Solarin continuam exclusivos de evento até a decisão de origem.
export const LINHAS = [
  { id: 'noctarn', inicial: 'Penumbrio', atual: 'Noctarn', evolucao: 'Noctarion' },
  { id: 'ignavor', inicial: 'Brasinha', atual: 'Ignavor', evolucao: 'Ignaraz' },
  { id: 'vaelith', inicial: 'Gotalume', atual: 'Vaelith', evolucao: 'Vaelirion' },
  { id: 'brotavel', inicial: 'Sementil', atual: 'Brotavel', evolucao: 'Florivel' },
  { id: 'solarin', inicial: 'Solinho', atual: 'Solarin', evolucao: 'Helíssio' },
];
export const REQUISITOS_EVOLUCAO = {
  inicial: { vinculo: 40, nivel: 5 },   // forma inicial -> atual
  atual: { vinculo: 70, nivel: 10 },    // atual -> evolução
};
const TODAS_LINHAS = [...LINHAS, ...LINHAS_REINOS];
export const linhaDaEspecie = (nome) => TODAS_LINHAS.find((l) => l.inicial === nome || l.atual === nome || l.evolucao === nome) ?? null;
export function faseDaEspecie(nome) {
  const l = linhaDaEspecie(nome);
  if (!l) return null;
  return l.inicial === nome ? 'inicial' : l.atual === nome ? 'atual' : 'evolucao';
}
// Espécie que sai do ovo: a forma inicial da linha (espécies sem linha ficam como estão).
export const inicialDaEspecie = (nome) => linhaDaEspecie(nome)?.inicial ?? nome;
export function proximaEspecie(nome) {
  const l = linhaDaEspecie(nome);
  if (!l) return null;
  const fase = faseDaEspecie(nome);
  return fase === 'inicial' ? l.atual : fase === 'atual' ? l.evolucao : null;
}
export function requisitoDe(nome) {
  const fase = faseDaEspecie(nome);
  return fase === 'inicial' ? REQUISITOS_EVOLUCAO.inicial : fase === 'atual' ? REQUISITOS_EVOLUCAO.atual : null;
}
