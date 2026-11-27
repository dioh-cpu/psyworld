// Dados do modo Estratégia para os Reinos 3–12, no molde de regiao1-estrategia-r2.js, com as cadeias de REINOS.md.
import { ESTRATEGIA_C1 } from './regiao1-estrategia-c1.js';
import { LOCAIS_R2 } from './regiao1-estrategia-r2.js';
import { LINHAGENS_REINOS } from './regiao1-kits-reinos.js';

const PAPEL_DO_TIPO = {
  inseto: 'ataque', fogo: 'ataque', eletrico: 'ataque', voador: 'ataque',
  aco: 'defesa', pedra: 'defesa', terra: 'defesa',
  planta: 'suporte', agua: 'suporte', luz: 'suporte', trevas: 'ataque', neutro: 'defesa',
};
const slugReino = (n) => String(n || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');
const pad2 = (n) => String(n).padStart(2, '0');

// Cadeias oficiais de REINOS.md (Reinos 03–12)
const DEF_REINOS_3_12 = [
  {
    numero: 3, nome: 'Crista da Alvorada',
    mat1: { id: 'ovo_prod', nome: 'Ovos (produção)', icone: '🥚' },
    mat2: { id: 'penas', nome: 'Penas', icone: '🪶' },
    prod1: { id: 'provisoes', nome: 'Provisões', icone: '🧺' },
    prod2: { id: 'manto_penas', nome: 'Manto de Penas', icone: '🧣' },
    rotas: ['Encostas do Galinheiro', 'Zigue-Zague do Vento', 'Ninho da Alvorada'],
  },
  {
    numero: 4, nome: 'Manguezal do Sal',
    mat1: { id: 'sal', nome: 'Sal', icone: '🧂' },
    mat2: { id: 'salmoura', nome: 'Salmoura', icone: '🌊' },
    prod1: { id: 'conservas', nome: 'Conservas', icone: '🫙' },
    prod2: { id: 'sal_refinado', nome: 'Sal Refinado', icone: '✨' },
    rotas: ['Palafitas da Maré', 'Tanques das Salinas', 'Canal do Caranguejo'],
  },
  {
    numero: 5, nome: 'Serras do Linho',
    mat1: { id: 'linho', nome: 'Linho', icone: '🌾' },
    mat2: { id: 'fio_linho', nome: 'Fio de Linho', icone: '🧵' },
    prod1: { id: 'tecido', nome: 'Tecido', icone: '🧶' },
    prod2: { id: 'estandarte', nome: 'Estandarte Tecido', icone: '🚩' },
    rotas: ['Campos em Faixas', 'Pátio dos Teares', 'Passo do Vendaval'],
  },
  {
    numero: 6, nome: 'Degraus de Terracota',
    mat1: { id: 'barro', nome: 'Barro', icone: '🏺' },
    mat2: { id: 'tijolo', nome: 'Tijolo', icone: '🧱' },
    prod1: { id: 'ceramica', nome: 'Cerâmica', icone: '🫖' },
    prod2: { id: 'ladrilho', nome: 'Ladrilho Esmaltado', icone: '🔶' },
    rotas: ['Ruas de Tijolo', 'Praça dos Fornos', 'Câmara do Colosso'],
  },
  {
    numero: 7, nome: 'Bacia da Ametista',
    mat1: { id: 'ametista', nome: 'Ametista', icone: '🔮' },
    mat2: { id: 'quartzo', nome: 'Quartzo', icone: '💎' },
    prod1: { id: 'prismas', nome: 'Prismas', icone: '🔷' },
    prod2: { id: 'lente_cristal', nome: 'Lente Cristalina', icone: '🔍' },
    rotas: ['Galerias Minerais', 'Terraços Secos', 'Coração de Ametista'],
  },
  {
    numero: 8, nome: 'Jardins da Bruma',
    mat1: { id: 'ervas', nome: 'Ervas', icone: '🌿' },
    mat2: { id: 'orvalho', nome: 'Orvalho', icone: '💧' },
    prod1: { id: 'tonicos', nome: 'Tônicos', icone: '🧪' },
    prod2: { id: 'incenso_bruma', nome: 'Incenso da Bruma', icone: '🪔' },
    rotas: ['Canteiros Radiais', 'Estufas Abertas', 'Claustro da Névoa'],
  },
  {
    numero: 9, nome: 'Caldeira do Ferro',
    mat1: { id: 'ferro', nome: 'Ferro', icone: '⛓️' },
    mat2: { id: 'carvao', nome: 'Carvão', icone: '🪨' },
    prod1: { id: 'ligas', nome: 'Ligas', icone: '⚙️' },
    prod2: { id: 'placa_forja', nome: 'Placa Forjada', icone: '🛡️' },
    rotas: ['Bairros de Basalto', 'Anéis da Forja', 'Caldeira do Regente'],
  },
  {
    numero: 10, nome: 'Geada Alta',
    mat1: { id: 'gelo', nome: 'Gelo', icone: '❄️' },
    mat2: { id: 'geada', nome: 'Geada', icone: '🧊' },
    prod1: { id: 'conservantes', nome: 'Conservantes', icone: '🧴' },
    prod2: { id: 'cristal_aurora', nome: 'Cristal da Aurora', icone: '💠' },
    rotas: ['Pátios de Neve', 'Casas Túnel', 'Fenda da Aurora'],
  },
  {
    numero: 11, nome: 'Deserto do Vitral',
    mat1: { id: 'silica', nome: 'Sílica', icone: '⏳' },
    mat2: { id: 'areia_fina', nome: 'Areia Fina', icone: '🏜️' },
    prod1: { id: 'vidro', nome: 'Vidro', icone: '🪟' },
    prod2: { id: 'vitral_solar', nome: 'Vitral Solar', icone: '🔆' },
    rotas: ['Ruas Estreitas', 'Oficinas Abobadadas', 'Templo da Esfinge'],
  },
  {
    numero: 12, nome: 'Atol do Farol',
    mat1: { id: 'perola', nome: 'Pérola', icone: '🦪' },
    mat2: { id: 'madreperola', nome: 'Madrepérola', icone: '🐚' },
    prod1: { id: 'adornos', nome: 'Adornos', icone: '👑' },
    prod2: { id: 'amuleto_farol', nome: 'Amuleto do Farol', icone: '🏮' },
    rotas: ['Falésias do Atol', 'Enseadas Luminosas', 'Torre da Sentinela'],
  },
];

const QTD = [[2, 3], [3, 4], [4, 5]];
const FAIXA = [[14, 18], [20, 26], [28, 36]];
const SEC = [[2, 4], [3, 5], [4, 6]];

export const ESTRATEGIA_R3_R12 = DEF_REINOS_3_12.map((def) => {
  const n = def.numero;
  const rPad = pad2(n);
  const escala = 1 + (n - 1) * 0.25;
  const troca = { madeira: def.mat1.id, pedra: def.mat2.id };
  const trocaCusto = (c) => Object.fromEntries(Object.entries(c).map(([k, v]) => [troca[k] || k, Math.round(v * escala)]));
  const linhagens = LINHAGENS_REINOS.filter((l) => l.reino === n);
  const nomes = linhagens.map((l) => l.nome);
  const nvBase = (n - 1) * 3;
  const niveis = [[nvBase, nvBase + 2], [nvBase + 2, nvBase + 4], [nvBase + 4, nvBase + 6]];
  const arena = `assets/confusion/interface/estrategia/reinos/${rPad}/arena-chefe.webp`;

  const rotas = def.rotas.map((nomeRota, rIdx) => {
    const mat = rIdx < 2 ? def.mat1.id : def.mat2.id;
    const sec = rIdx < 2 ? def.mat2.id : def.mat1.id;
    return {
      id: `r${n}_rota_${rIdx + 1}`,
      nome: nomeRota,
      icone: rIdx < 2 ? def.mat1.icone : def.mat2.icone,
      arena,
      material: mat,
      descricao: `Rota de ${def.nome}: coleta de ${rIdx < 2 ? def.mat1.nome : def.mat2.nome}.`,
      fases: [0, 1, 2].map((fIdx) => ({
        nome: `${nomeRota} · Etapa ${fIdx + 1}`,
        inimigos: QTD[fIdx],
        nivel: niveis[fIdx],
        especies: nomes,
        material: { tipo: mat, faixa: FAIXA[fIdx] },
        secundario: { tipo: sec, faixa: SEC[fIdx] },
        libera: { inimigo: nomes[(rIdx + fIdx) % nomes.length] },
      })),
    };
  });

  const capMat = 200 + (n - 2) * 50;
  return {
    ...ESTRATEGIA_C1,
    id: `r${n}`,
    titulo: `${def.nome} (Reino ${n})`,
    fundo: `assets/confusion/interface/estrategia/reinos/${rPad}/cidade-conceito.webp`,
    fundoFallback: `assets/confusion/interface/estrategia/reinos/${rPad}/cidade-conceito.webp`,
    locais: LOCAIS_R2,
    desbloqueio: { de: `r${n - 1}`, terrenos: 30, texto: `Tenha 30 terrenos distintos do Reino ${n - 1} com prédios concluídos.` },
    prosperidadeBase: 30 * (n - 1),
    materiais: {
      [def.mat1.id]: { nome: def.mat1.nome, icone: def.mat1.icone },
      [def.mat2.id]: { nome: def.mat2.nome, icone: def.mat2.icone },
    },
    inicial: { [def.mat1.id]: 0, [def.mat2.id]: 0 },
    vagasIniciais: 3,
    papeis: Object.fromEntries(linhagens.map((l) => [l.nome, PAPEL_DO_TIPO[l.elemento] || 'ataque'])),
    estruturas: ESTRATEGIA_C1.estruturas.map((e) => ({
      ...e,
      custo: trocaCusto(e.custo),
      producao: e.producao && { ...e.producao, tipo: troca[e.producao.tipo] },
    })),
    gestao: {
      vagasObra: 2,
      capacidade: { [def.mat1.id]: capMat, [def.mat2.id]: capMat },
      capProducaoHoras: 8,
      filaFabricacao: 3,
      receitas: [
        { id: def.prod1.id, nome: def.prod1.nome, icone: def.prod1.icone, insumos: { [def.mat1.id]: 2, [def.mat2.id]: 1 }, saida: { [def.prod1.id]: 1 }, seg: 30 },
        { id: def.prod2.id, nome: def.prod2.nome, icone: def.prod2.icone, insumos: { [def.mat2.id]: 2 }, saida: { [def.prod2.id]: 1 }, seg: 25 },
        { id: 'pocao_xp_m', nome: 'Poção de XP média', icone: '⚗️', insumos: { [def.mat1.id]: 8, [def.mat2.id]: 6 }, saida: { pocao_xp_m: 1 }, seg: 90 },
      ],
      itens: {
        [def.prod1.id]: { nome: def.prod1.nome, icone: def.prod1.icone },
        [def.prod2.id]: { nome: def.prod2.nome, icone: def.prod2.icone },
        pocao_xp_m: { nome: 'Poção de XP média', icone: '⚗️' },
      },
    },
    rotas,
    arteInimigo: (especie, faseIdx) => {
      const f = Math.min(3, Math.max(1, (faseIdx || 0) + 1));
      return `assets/confusion/interface/estrategia/reinos/${rPad}/oniricos/${slugReino(especie)}/0${f}.png`;
    },
  };
});
