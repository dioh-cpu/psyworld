// Torres Elementais (6 torres × 50 andares) e Torres Únicas (3 torres × 30 andares).
// Regras 100% puras (sem DOM). Reutiliza Energia e Essências de regiao1-campanha-mini-regras.js.
import {
  ENERGIA_CFG,
  energiaDe,
  atualizarEnergia,
  gastarEnergia,
  darPocaoEnergia,
  usarPocaoEnergia,
  ESSENCIAS_PARES,
  parEssenciaDoElemento,
  essenciasDe,
  saldoEssencia,
  adicionarEssencia,
  consumirEssencia,
} from './regiao1-campanha-mini-regras.js';
import { registrarMarco } from './regiao1-missoes-regras.js';
import { aplicarXp } from './regiao1-progressao.js';
import { membrosFormacao, expDe } from './regiao1-exp-regras.js';
import { adicionarFragmentoSonho } from './regiao1-regras-sonho.js';
import { hwDe, docesGraduaisAndar, talvezDoce } from './regiao1-halloween-regras.js';
import { LINHAGENS_REINOS } from './regiao1-kits-reinos.js';
import { FORMAS_LINHAGENS_REINOS } from '../formas-reinos.js';
import { LINHAS, ELEMENTO_DA_ESPECIE } from '../species.js';
import { LINHAGENS_HW } from './regiao1-halloween-dados.js';
import { ENCONTROS_ALTOS_AMBAR } from './regiao2-altos-ambar.js';

export {
  ENERGIA_CFG,
  energiaDe,
  atualizarEnergia,
  gastarEnergia,
  darPocaoEnergia,
  usarPocaoEnergia,
  ESSENCIAS_PARES,
  parEssenciaDoElemento,
  essenciasDe,
  saldoEssencia,
  adicionarEssencia,
  consumirEssencia,
  docesGraduaisAndar,
};

export const TORRES_CFG = {
  maxAndaresElemental: 100,
  treinosDiariosMax: 3,
  energiaTreinoDiario: 0,
  maxAndaresUnica: 100,
  energiaTorreUnica: 0,
  diamantesPorAndar: 10,
  marcoIntervalo: 10,
  marcoTicketsEvento: 3,
  ticketsDiariosLimite: 10,
  precoTicketDiamantes: 100,
  xpMaxFracaoCampanha: 0.10,
  custoPoPorFragmento: 5,
  fragmentosParaArma: 10,
  diaMs: 86_400_000,
};

export function nivelAndarTorreElemental(andar) {
  const a = Math.max(1, Math.min(TORRES_CFG.maxAndaresElemental, Math.floor(Number(andar) || 1)));
  return Math.round(5 + (a - 1) * 1.95);
}

export function nivelAndarTorreUnica(andar) {
  const a = Math.max(1, Math.min(TORRES_CFG.maxAndaresUnica, Math.floor(Number(andar) || 1)));
  return Math.round(60 + ((a - 1) * 140) / (TORRES_CFG.maxAndaresUnica - 1));
}

export function essenciaDoAndarElemental(parEssencia, andar) {
  if (andar <= 30) return { par: parEssencia, tamanho: 'menor', qtd: 3 };
  if (andar <= 70) return { par: parEssencia, tamanho: 'media', qtd: 2 };
  return { par: parEssencia, tamanho: 'maior', qtd: 1 };
}

export function xpAndarTorre(andar) {
  // No máximo 10% do XP da Campanha Mini / Idle
  const a = Math.max(1, Math.floor(Number(andar) || 1));
  return Math.max(5, Math.round(8 + a * 0.7));
}

function energiaDoAndarElemental() {
  return 0;
}

export const slugLinhagem = (nome) => String(nome || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const MAPA_LINHAGEM_CANONICA = new Map();
for (const lin of LINHAS) {
  const canon = slugLinhagem(lin.atual); // noctarn, ignavor, vaelith, brotavel, solarin
  MAPA_LINHAGEM_CANONICA.set(slugLinhagem(lin.id), canon);
  MAPA_LINHAGEM_CANONICA.set(slugLinhagem(lin.inicial), canon);
  MAPA_LINHAGEM_CANONICA.set(canon, canon);
  MAPA_LINHAGEM_CANONICA.set(slugLinhagem(lin.evolucao), canon);
}
for (const h of LINHAGENS_HW) {
  const canon = h.slug || slugLinhagem(h.especie || h.nome);
  MAPA_LINHAGEM_CANONICA.set(canon, canon);
  if (h.especie) MAPA_LINHAGEM_CANONICA.set(slugLinhagem(h.especie), canon);
}
for (const r of LINHAGENS_REINOS) {
  const canon = slugLinhagem(r.nome);
  MAPA_LINHAGEM_CANONICA.set(canon, canon);
  const f = FORMAS_LINHAGENS_REINOS[r.nome];
  if (f?.base) MAPA_LINHAGEM_CANONICA.set(slugLinhagem(f.base), canon);
  if (f?.final) MAPA_LINHAGEM_CANONICA.set(slugLinhagem(f.final), canon);
}

export function linhagemArmaUnicaDe(especieOuSlug) {
  const s = slugLinhagem(especieOuSlug);
  return MAPA_LINHAGEM_CANONICA.get(s) || s;
}

export const LINHAGENS_ARMAS_UNICAS = [
  'noctarn', 'ignavor', 'vaelith', 'brotavel', 'solarin',
  ...LINHAGENS_HW.map((h) => h.slug || slugLinhagem(h.especie || h.nome)),
  'fanalino', 'cervomusgo', 'cobrabufalo', 'tatuveludo', 'xistolim',
  ...[...new Set(ENCONTROS_ALTOS_AMBAR.map((e) => slugLinhagem(e.especie)))],
  ...LINHAGENS_REINOS.map((l) => slugLinhagem(l.nome)),
];

const LINHAGENS_POR_ELEMENTO = {};
for (const slug of LINHAGENS_ARMAS_UNICAS) {
  const orig = LINHAS.find((l) => slugLinhagem(l.atual) === slug)?.atual
    || LINHAGENS_HW.find((h) => (h.slug || slugLinhagem(h.especie)) === slug)?.especie
    || LINHAGENS_REINOS.find((r) => slugLinhagem(r.nome) === slug)?.nome
    || ENCONTROS_ALTOS_AMBAR.find((e) => slugLinhagem(e.especie) === slug)?.especie
    || Object.keys(ELEMENTO_DA_ESPECIE).find((k) => slugLinhagem(k) === slug);
  const el = (orig && (ELEMENTO_DA_ESPECIE[orig] || LINHAGENS_REINOS.find((r) => r.nome === orig)?.elemento)) || 'neutro';
  (LINHAGENS_POR_ELEMENTO[el] ||= []).push(slug);
}

const DEF_ELEMENTAIS = [
  { id: 'chama', nome: 'Torre da Chama', elementos: ['fogo', 'eletrico'], parEssencia: 'ignea', guardiao: 'Guardião da Chama' },
  { id: 'mare', nome: 'Torre da Maré', elementos: ['agua', 'voador'], parEssencia: 'mares', guardiao: 'Guardião das Marés' },
  { id: 'raiz', nome: 'Torre da Raiz', elementos: ['planta', 'inseto'], parEssencia: 'verde', guardiao: 'Guardião da Raiz' },
  { id: 'rocha', nome: 'Torre da Rocha', elementos: ['terra', 'pedra', 'aco'], parEssencia: 'mineral', guardiao: 'Guardião da Rocha' },
  { id: 'aurora', nome: 'Torre da Aurora', elementos: ['luz'], parEssencia: 'solar', guardiao: 'Guardião da Aurora' },
  { id: 'umbra', nome: 'Torre da Umbra', elementos: ['trevas', 'fantasma'], parEssencia: 'sombria', guardiao: 'Guardião da Umbra' },
  { id: 'geada', nome: 'Torre da Geada', elementos: ['gelo', 'veneno'], parEssencia: 'glacial', guardiao: 'Guardião da Geada' },
  { id: 'draco', nome: 'Torre Dracônica', elementos: ['lutador', 'dragao'], parEssencia: 'draconica', guardiao: 'Guardião Dracônico' },
  { id: 'eterea', nome: 'Torre Etérea', elementos: ['psiquico', 'fada'], parEssencia: 'arcana', guardiao: 'Guardião Etéreo' },
];

function montarInimigosTorreElemental(def, andar) {
  const nivel = nivelAndarTorreElemental(andar);
  const chefe = andar % 10 === 0;
  const faixaArena = Math.ceil(andar / 10);
  const poolEspecies = Object.entries(ELEMENTO_DA_ESPECIE)
    .filter(([, el]) => def.elementos.includes(el))
    .map(([esp, el]) => ({ esp, el }));
  const p0 = poolEspecies[(andar + 0) % poolEspecies.length] || { esp: 'Fanalino', el: def.elementos[0] };
  const p1 = poolEspecies[(andar + 1) % poolEspecies.length] || p0;
  const p2 = poolEspecies[(andar + 2) % poolEspecies.length] || p0;
  const forma = nivel <= 40 ? 1 : nivel <= 80 ? 2 : 3;
  if (chefe) {
    return [
      [def.guardiao, nivel + 2, def.elementos[(faixaArena - 1) % def.elementos.length], { chefe: true, nome: def.guardiao, bonus: { hp: 1.8, atk: 0.2, def: 0.18 } }],
      [p0.esp, nivel, p0.el, { forma }],
      [p1.esp, Math.max(1, nivel - 1), p1.el, { forma }],
    ];
  }
  return [
    [p0.esp, nivel, p0.el, { forma }],
    [p1.esp, Math.max(1, nivel - 1), p1.el, { forma }],
    [p2.esp, Math.max(1, nivel - 2), p2.el, { forma }],
  ];
}

export const TORRES_ELEMENTAIS_CATALOGO = DEF_ELEMENTAIS.map((def) => ({
  ...def,
  totalAndares: TORRES_CFG.maxAndaresElemental,
  fachada: `assets/confusion/interface/torres/${def.id}/fachada.webp`,
  icone: `assets/confusion/interface/torres/${def.id}/icone.png`,
  andares: Array.from({ length: TORRES_CFG.maxAndaresElemental }, (_, idx) => {
    const andar = idx + 1;
    const faixaArena = Math.ceil(andar / 10);
    return {
      andar,
      nivel: nivelAndarTorreElemental(andar),
      chefe: andar % 10 === 0,
      energia: energiaDoAndarElemental(andar),
      arena: `assets/confusion/interface/torres/${def.id}/arena-${faixaArena}.webp`,
      inimigos: montarInimigosTorreElemental(def, andar),
      recompensaPrimeiraVitoria: {
        diamantes: 10,
        ouro: 300 + andar * 60,
        essencia: essenciaDoAndarElemental(def.parEssencia, andar),
      },
    };
  }),
}));

export const TORRES_ELEMENTAIS_POR_ID = Object.fromEntries(TORRES_ELEMENTAIS_CATALOGO.map((t) => [t.id, t]));
export const TORRES_POR_ELEMENTO = Object.fromEntries(
  TORRES_ELEMENTAIS_CATALOGO.flatMap((t) => t.elementos.map((el) => [el, t])),
);
export const torreDoElemento = (el) => TORRES_POR_ELEMENTO[String(el || '').toLowerCase()] || null;

// Taxas oficiais de Essência por Torre Elemental (documentadas para UI e relatório)
export const TAXAS_ESSENCIA_TORRES = TORRES_ELEMENTAIS_CATALOGO.map((t) => ({
  id: t.id,
  nome: t.nome,
  elementos: [...t.elementos],
  parEssencia: t.parEssencia,
  essenciaNome: ESSENCIAS_PARES[t.parEssencia]?.nome || t.parEssencia,
  andares1a30: { tamanho: 'menor', qtd: 3, taxa: 1.0 },
  andares31a70: { tamanho: 'media', qtd: 2, taxa: 1.0 },
  andares71a100: { tamanho: 'maior', qtd: 1, taxa: 1.0 },
  andares1a15: { tamanho: 'menor', qtd: 3, taxa: 1.0 },
  andares16a35: { tamanho: 'media', qtd: 2, taxa: 1.0 },
  andares36a50: { tamanho: 'maior', qtd: 1, taxa: 1.0 },
  dropFragmentoSonhoPorInimigo: 0.01,
}));

const DEF_UNICAS = [
  {
    id: 'ascensao',
    nome: 'Torre da Ascensão',
    desc: 'Focada em linhagens iniciais, fogo, luz, planta, água e vento.',
    elementos: ['fogo', 'eletrico', 'agua', 'voador', 'planta', 'luz'],
    recompensaPropria: {
      id: 'brasa_ascensao',
      nome: 'Brasa da Ascensão',
      resumo: 'Fragmento de Arma Única (Ascensão) + 1× Brasa da Ascensão + Essência Solar/Ígnea + Ouro',
      ouroBase: 450,
      essenciaPar: 'solar',
    },
  },
  {
    id: 'abismo',
    nome: 'Torre do Abismo',
    desc: 'Focada em linhagens sombrias, espectrais, aço, terra e pedra.',
    elementos: ['trevas', 'fantasma', 'aco', 'terra', 'pedra', 'inseto'],
    recompensaPropria: {
      id: 'nucleo_abismo',
      nome: 'Núcleo do Abismo',
      resumo: 'Fragmento de Arma Única (Abismo) + 1× Núcleo do Abismo + 12 Pó de Reforço + Ouro',
      ouroBase: 500,
      poReforco: 12,
    },
  },
  {
    id: 'eclipse',
    nome: 'Torre do Eclipse',
    desc: 'Todas as linhagens clássicas e dos reinos em rotação mista.',
    elementos: ['fogo', 'agua', 'planta', 'luz', 'trevas', 'eletrico', 'aco', 'fantasma', 'pedra', 'terra', 'voador', 'inseto', 'neutro'],
    recompensaPropria: {
      id: 'prisma_eclipse',
      nome: 'Prisma do Eclipse',
      resumo: 'Fragmento de Arma Única (Eclipse) + 1× Prisma do Eclipse + 15 💎 (e +1 Escolha Livre a cada 5 andares)',
      ouroBase: 550,
      diamantes: 15,
      escolhaACadaAndares: 5,
    },
  },
];

export const TORRES_UNICAS_CATALOGO = DEF_UNICAS.map((def) => {
  const poolLinhagens = [...new Set(def.elementos.flatMap((el) => LINHAGENS_POR_ELEMENTO[el] || []))];
  const fallbackPool = poolLinhagens.length ? poolLinhagens : LINHAGENS_ARMAS_UNICAS.slice(0, 10);
  const inimigosPool = Object.entries(ELEMENTO_DA_ESPECIE).filter(([, el]) => def.elementos.includes(el));
  return {
    ...def,
    totalAndares: TORRES_CFG.maxAndaresUnica,
    fachada: `assets/confusion/interface/torres/${def.id}/fachada.webp`,
    arena: `assets/confusion/interface/torres/${def.id}/arena.webp`,
    icone: `assets/confusion/interface/torres/${def.id}/icone.png`,
    poolLinhagens: fallbackPool,
    andares: Array.from({ length: TORRES_CFG.maxAndaresUnica }, (_, idx) => {
      const andar = idx + 1;
      const nivel = nivelAndarTorreUnica(andar);
      const chefe = andar % 10 === 0;
      const e0 = inimigosPool[(andar + 0) % inimigosPool.length] || ['Ignaraz', 'fogo'];
      const e1 = inimigosPool[(andar + 1) % inimigosPool.length] || e0;
      const e2 = inimigosPool[(andar + 2) % inimigosPool.length] || e0;
      return {
        andar,
        nivel,
        chefe,
        energia: TORRES_CFG.energiaTorreUnica,
        inimigos: chefe
          ? [[`Soberano de ${def.nome}`, nivel + 3, e0[1], { chefe: true, nome: `Soberano de ${def.nome}`, bonus: { hp: 2.0, atk: 0.25, def: 0.2 } }], [e1[0], nivel, e1[1], { forma: 3 }]]
          : [[e0[0], nivel, e0[1], { forma: 3 }], [e1[0], nivel - 1, e1[1], { forma: 3 }], [e2[0], nivel - 2, e2[1], { forma: 3 }]],
      };
    }),
  };
});

export const TORRES_UNICAS_POR_ID = Object.fromEntries(TORRES_UNICAS_CATALOGO.map((t) => [t.id, t]));

export function torresDe(save) {
  const idle = save?.idle || (save ? (save.idle = {}) : {});
  if (!idle.torres || typeof idle.torres !== 'object') idle.torres = {};
  const t = idle.torres;
  t.elementais ||= {};
  t.treinoDiario = t.treinoDiario && typeof t.treinoDiario === 'object' ? t.treinoDiario : { dia: 0, usos: 0 };
  t.unicas ||= {};
  t.unicasDiarias ||= {};
  t.sazonais ||= {};
  t.recompensasUnicas ||= {};
  t.tickets ||= {};
  t.comprasTickets ||= {};
  t.batalhasPagas ||= {};
  return t;
}

export function saldoTicketTorre(save, torreId) {
  return Math.max(0, Math.floor(Number(torresDe(save).tickets?.[torreId]) || 0));
}

export function comprarTicketTorre(save, torreId, qtd = 1, { agoraMs = Date.now() } = {}) {
  const n = Math.max(1, Math.floor(Number(qtd) || 1));
  if (!torreId) return { ok: false, motivo: 'Torre inválida.' };
  const t = torresDe(save);
  const dia = Math.floor(agoraMs / TORRES_CFG.diaMs);
  const reg = t.comprasTickets[torreId] || { dia, qtd: 0 };
  if (reg.dia !== dia) { reg.dia = dia; reg.qtd = 0; }
  if (reg.qtd + n > TORRES_CFG.ticketsDiariosLimite) {
    return { ok: false, limiteDiario: true, restantesHoje: Math.max(0, TORRES_CFG.ticketsDiariosLimite - reg.qtd), motivo: `Limite de ${TORRES_CFG.ticketsDiariosLimite} tickets por dia atingido.` };
  }
  const custo = n * TORRES_CFG.precoTicketDiamantes;
  save.recompensas = save.recompensas || { gold: 0, diamantes: 0, xp: 0 };
  if ((save.recompensas.diamantes || 0) < custo) {
    return { ok: false, motivo: `Faltam diamantes (${custo}💎).` };
  }
  save.recompensas.diamantes -= custo;
  reg.qtd += n;
  t.comprasTickets[torreId] = reg;
  t.tickets[torreId] = saldoTicketTorre(save, torreId) + n;
  return { ok: true, torreId, comprados: n, custoDiamantes: custo, saldo: t.tickets[torreId], restantesHoje: TORRES_CFG.ticketsDiariosLimite - reg.qtd };
}

function creditarXpFormacaoTorre(save, xp) {
  const idle = save?.idle;
  const qtd = Math.max(0, Math.round(Number(xp) || 0));
  if (!idle || qtd <= 0) return 0;
  // Todos os Oníricos da formação ganham XP igualmente, inclusive os que morreram na batalha
  for (const { m } of membrosFormacao(idle)) aplicarXp(m, qtd);
  return qtd;
}

function armasUnicasState(save) {
  const idle = save?.idle || (save ? (save.idle = {}) : {});
  if (!idle.armasUnicas || typeof idle.armasUnicas !== 'object') idle.armasUnicas = {};
  const a = idle.armasUnicas;
  a.fragmentos ||= {};
  a.possuidas ||= {};
  a.equipadas ||= {};
  a.poUnico = Math.max(0, Math.floor(Number(a.poUnico) || 0));
  a.escolhasPendentes = Math.max(0, Math.floor(Number(a.escolhasPendentes) || 0));
  a.liberadasPorNivel100 ||= {};
  return a;
}

function marcarBatalhaTorrePaga(t, batalhaId) {
  if (!batalhaId) return;
  t.batalhasPagas[batalhaId] = true;
  const keys = Object.keys(t.batalhasPagas);
  if (keys.length > ENERGIA_CFG.maxHistoricoBatalhas) {
    for (const k of keys.slice(0, keys.length - ENERGIA_CFG.maxHistoricoBatalhas)) delete t.batalhasPagas[k];
  }
}

export function jogadorPossuiLinhagem(save, linhagemSlug) {
  const alvo = linhagemArmaUnicaDe(linhagemSlug);
  const unidades = [
    ...(Array.isArray(save?.idle?.equipe) ? save.idle.equipe : []),
    ...(Array.isArray(save?.idle?.banco) ? save.idle.banco : []),
  ];
  return unidades.some((u) => u?.especie && linhagemArmaUnicaDe(u.especie) === alvo);
}

// ---- Torres Elementais ----
export function andarTorreElementalDesbloqueado(save, torreId, andar) {
  const torre = TORRES_ELEMENTAIS_POR_ID[torreId];
  if (!torre || andar < 1 || andar > torre.totalAndares) return false;
  if (andar === 1) return true;
  const maior = Number(torresDe(save).elementais[torreId]?.maiorAndar) || 0;
  return andar <= maior + 1;
}

export function iniciarAndarTorreElemental(save, torreId, andar, { agoraMs = Date.now(), batalhaId = null } = {}) {
  const torre = TORRES_ELEMENTAIS_POR_ID[torreId];
  const andarDef = torre?.andares?.[andar - 1];
  if (!andarDef) return { ok: false, motivo: 'Andar de Torre Elemental inválido.' };
  if (!andarTorreElementalDesbloqueado(save, torreId, andar)) return { ok: false, motivo: 'Andar ainda bloqueado.' };
  const t = torresDe(save);
  const jaVencido = Boolean(t.elementais[torreId]?.pagas?.[String(andar)]);
  let gastouTicket = false;
  if (jaVencido) {
    if (saldoTicketTorre(save, torreId) < 1) {
      return { ok: false, precisaTicket: true, motivo: 'Repetir andar já vencido exige 1 Ticket desta torre.' };
    }
    t.tickets[torreId] -= 1;
    gastouTicket = true;
  }
  const custo = jaVencido ? andarDef.energia : 0; // DESIGN §8: Torres (1ª vitória) não gastam energia
  const g = custo > 0 ? gastarEnergia(save, custo, agoraMs) : { ok: true, atual: energiaDe(save, agoraMs).atual };
  if (!g.ok) return g;
  return {
    ok: true,
    batalhaId: batalhaId || `te_${torreId}_${andar}_${agoraMs}`,
    torre,
    andar: andarDef,
    custoEnergia: custo,
    gastouTicket,
    ticketsRestantes: saldoTicketTorre(save, torreId),
    energiaRestante: g.atual,
  };
}

export function concluirAndarTorreElemental(save, torreId, andar, resultado = { venceu: true }, { batalhaId = null, agoraMs = Date.now(), rng = Math.random } = {}) {
  const torre = TORRES_ELEMENTAIS_POR_ID[torreId];
  const andarDef = torre?.andares?.[andar - 1];
  if (!andarDef) return { ok: false, motivo: 'Andar inválido.' };
  if (!andarTorreElementalDesbloqueado(save, torreId, andar)) return { ok: false, motivo: 'Andar ainda bloqueado.' };
  const t = torresDe(save);
  if (batalhaId && t.batalhasPagas[batalhaId]) return { ok: true, jaPago: true, venceu: false, premios: {} };

  const xpBase = xpAndarTorre(andar);
  const venceu = Boolean(resultado?.venceu || resultado?.fim === 'vitoria');
  if (!venceu) {
    const xpDerrota = creditarXpFormacaoTorre(save, Math.round(xpBase * 0.3));
    if (batalhaId) marcarBatalhaTorrePaga(t, batalhaId);
    return { ok: true, jaPago: false, venceu: false, premios: { xpFormacao: xpDerrota } };
  }

  const est = (t.elementais[torreId] ||= { maiorAndar: 0, pagas: {} });
  est.maiorAndar = Math.max(est.maiorAndar || 0, andar);
  est.pagas ||= {};
  const chave = String(andar);
  const premios = { ouro: 0, diamantes: 0, doces: 0, ticketsEvento: 0, essencia: null, fragmentosSonho: {}, xpFormacao: 0 };
  save.recompensas = save.recompensas || { gold: 0, diamantes: 0, xp: 0 };

  if (!est.pagas[chave]) {
    est.pagas[chave] = true;
    const p1 = andarDef.recompensaPrimeiraVitoria;
    premios.diamantes = TORRES_CFG.diamantesPorAndar;
    premios.ouro = p1.ouro;
    premios.essencia = { ...p1.essencia };
    save.recompensas.diamantes += premios.diamantes;
    save.recompensas.gold += p1.ouro;
    adicionarEssencia(save, p1.essencia.par, p1.essencia.tamanho, p1.essencia.qtd);
    const doces = docesGraduaisAndar(andar, torre.totalAndares);
    hwDe(save).doces += doces;
    premios.doces = doces;
    if (andar % TORRES_CFG.marcoIntervalo === 0) {
      hwDe(save).tickets += TORRES_CFG.marcoTicketsEvento;
      premios.ticketsEvento = TORRES_CFG.marcoTicketsEvento;
    }
    premios.xpFormacao = creditarXpFormacaoTorre(save, xpBase);
  } else {
    premios.ouro = 100;
    save.recompensas.gold += 100;
    premios.xpFormacao = creditarXpFormacaoTorre(save, Math.round(xpBase * 0.5));
  }

  // Drop real de Fragmentos de Evolução (Sonho) e Doces dos inimigos derrotados da torre (+1 fragmento garantido em chefes múltiplos de 10)
  for (const inim of andarDef.inimigos || []) {
    const el = inim?.[2] || torre.elementos[0];
    if (rng() < 0.01) {
      adicionarFragmentoSonho(save, el, 1);
      premios.fragmentosSonho[el] = (premios.fragmentosSonho[el] || 0) + 1;
    }
    premios.doces += talvezDoce(save, 'torre', rng, new Date(agoraMs));
  }
  if (andar % 10 === 0) {
    const elChefe = torre.elementos[(Math.ceil(andar / 10) - 1) % torre.elementos.length];
    adicionarFragmentoSonho(save, elChefe, 1);
    premios.fragmentosSonho[elChefe] = (premios.fragmentosSonho[elChefe] || 0) + 1;
  }

  if (batalhaId) marcarBatalhaTorrePaga(t, batalhaId);
  registrarMarco(save, 'torre_elemental', { torre: torreId, andar });
  return { ok: true, jaPago: false, venceu: true, primeiraVitoria: premios.diamantes > 0, premios, agoraMs };
}

export function usosRestantesTreinoTorre(save, agoraMs = Date.now()) {
  const t = torresDe(save);
  const dia = Math.floor(agoraMs / TORRES_CFG.diaMs);
  if (t.treinoDiario.dia !== dia) return TORRES_CFG.treinosDiariosMax;
  return Math.max(0, TORRES_CFG.treinosDiariosMax - (Number(t.treinoDiario.usos) || 0));
}

export function concluirTreinoDiarioTorre(save, torreId, andar, { agoraMs = Date.now(), batalhaId = null } = {}) {
  const torre = TORRES_ELEMENTAIS_POR_ID[torreId];
  if (!torre || andar < 1 || andar > torre.totalAndares) return { ok: false, motivo: 'Andar inválido.' };
  const t = torresDe(save);
  if (batalhaId && t.batalhasPagas[batalhaId]) return { ok: true, jaPago: true, premios: {} };
  const maior = Number(t.elementais[torreId]?.maiorAndar) || 0;
  if (andar > maior) return { ok: false, motivo: 'Conclua este andar antes de usá-lo no treino diário.' };

  const dia = Math.floor(agoraMs / TORRES_CFG.diaMs);
  if (t.treinoDiario.dia !== dia) t.treinoDiario = { dia, usos: 0 };
  if ((t.treinoDiario.usos || 0) >= TORRES_CFG.treinosDiariosMax) {
    return { ok: false, limiteAtingido: true, motivo: 'Limite de 3 treinos diários atingido hoje.' };
  }

  const g = gastarEnergia(save, TORRES_CFG.energiaTreinoDiario, agoraMs);
  if (!g.ok) return g;

  t.treinoDiario.usos += 1;
  const ess = essenciaDoAndarElemental(torre.parEssencia, andar);
  adicionarEssencia(save, ess.par, ess.tamanho, ess.qtd);
  if (batalhaId) marcarBatalhaTorrePaga(t, batalhaId);
  return {
    ok: true,
    treinoDiario: true,
    usosRestantes: TORRES_CFG.treinosDiariosMax - t.treinoDiario.usos,
    energiaRestante: g.atual,
    premios: { essencia: ess },
  };
}

// ---- Torres Únicas & Fragmentos de Arma Única ----
export function andarTorreUnicaDesbloqueado(save, torreId, andar) {
  const torre = TORRES_UNICAS_POR_ID[torreId];
  if (!torre || andar < 1 || andar > torre.totalAndares) return false;
  if (andar === 1) return true;
  const maior = Number(torresDe(save).unicas[torreId]?.maiorAndar) || 0;
  return andar <= maior + 1;
}

export function podeFazerTorreUnicaHoje(save, torreId, andar, agoraMs = Date.now()) {
  const dia = Math.floor(agoraMs / TORRES_CFG.diaMs);
  const t = torresDe(save);
  return Number(t.unicasDiarias?.[torreId]?.[String(andar)]) !== dia;
}

export function iniciarAndarTorreUnica(save, torreId, andar, { agoraMs = Date.now(), batalhaId = null } = {}) {
  const torre = TORRES_UNICAS_POR_ID[torreId];
  const andarDef = torre?.andares?.[andar - 1];
  if (!andarDef) return { ok: false, motivo: 'Andar da Torre Única inválido.' };
  if (!andarTorreUnicaDesbloqueado(save, torreId, andar)) return { ok: false, motivo: 'Andar ainda bloqueado.' };
  const t = torresDe(save);
  const jaVencido = Boolean(t.unicas[torreId]?.pagas?.[String(andar)]);
  const feitoHoje = !podeFazerTorreUnicaHoje(save, torreId, andar, agoraMs);
  let gastouTicket = false;
  if (jaVencido || feitoHoje) {
    if (saldoTicketTorre(save, torreId) < 1) {
      return {
        ok: false,
        precisaTicket: true,
        limiteDiario: feitoHoje,
        motivo: feitoHoje
          ? 'Este andar da Torre Única já foi concluído hoje. Use 1 Ticket desta torre para repetir.'
          : 'Repetir andar já vencido exige 1 Ticket desta torre.',
      };
    }
    t.tickets[torreId] -= 1;
    gastouTicket = true;
  }
  const g = gastarEnergia(save, andarDef.energia, agoraMs);
  if (!g.ok) return g;
  return {
    ok: true,
    batalhaId: batalhaId || `tu_${torreId}_${andar}_${agoraMs}`,
    torre,
    andar: andarDef,
    gastouTicket,
    ticketsRestantes: saldoTicketTorre(save, torreId),
    energiaRestante: g.atual,
  };
}

export function concluirAndarTorreUnica(save, torreId, andar, resultado = { venceu: true }, { agoraMs = Date.now(), batalhaId = null, rng = Math.random, comTicket = false } = {}) {
  const torre = TORRES_UNICAS_POR_ID[torreId];
  const andarDef = torre?.andares?.[andar - 1];
  if (!andarDef) return { ok: false, motivo: 'Andar da Torre Única inválido.' };
  if (!andarTorreUnicaDesbloqueado(save, torreId, andar)) return { ok: false, motivo: 'Andar ainda bloqueado.' };
  const t = torresDe(save);
  if (batalhaId && t.batalhasPagas[batalhaId]) return { ok: true, jaPago: true, venceu: false, premios: {} };
  if (!comTicket && !podeFazerTorreUnicaHoje(save, torreId, andar, agoraMs)) {
    return { ok: false, limiteDiario: true, motivo: 'Andar já concluído hoje (use 1 Ticket da torre para repetir).' };
  }

  const xpBase = xpAndarTorre(andar);
  const venceu = Boolean(resultado?.venceu || resultado?.fim === 'vitoria');
  if (!venceu) {
    const xpDerrota = creditarXpFormacaoTorre(save, Math.round(xpBase * 0.3));
    if (batalhaId) marcarBatalhaTorrePaga(t, batalhaId);
    return { ok: true, jaPago: false, venceu: false, premios: { xpFormacao: xpDerrota } };
  }

  const dia = Math.floor(agoraMs / TORRES_CFG.diaMs);
  const estUnica = (t.unicas[torreId] ||= { maiorAndar: 0, pagas: {} });
  estUnica.pagas ||= {};
  const primeiraVezUnica = !estUnica.pagas[String(andar)];
  estUnica.maiorAndar = Math.max(Number(estUnica.maiorAndar) || 0, andar);
  estUnica.pagas[String(andar)] = true;
  (t.unicasDiarias[torreId] ||= {})[String(andar)] = dia;

  const pool = torre.poolLinhagens;
  const linhagemSorteada = pool[Math.floor(rng() * pool.length) % pool.length] || pool[0];
  const armas = armasUnicasState(save);
  const possui = jogadorPossuiLinhagem(save, linhagemSorteada);
  const rp = torre.recompensaPropria || { id: 'po_unico', nome: 'Pó Único', ouroBase: 400 };
  save.recompensas = save.recompensas || { gold: 0, diamantes: 0, xp: 0 };
  const ouroGanho = (rp.ouroBase || 400) + andar * 35;
  save.recompensas.gold += ouroGanho;
  t.recompensasUnicas[rp.id] = (t.recompensasUnicas[rp.id] || 0) + 1;

  const premios = {
    linhagemSorteada,
    virouPoUnico: !possui,
    fragmentos: 0,
    poUnico: 0,
    xpFormacao: creditarXpFormacaoTorre(save, xpBase),
    ouro: ouroGanho,
    diamantes: 0,
    doces: 0,
    ticketsEvento: 0,
    poReforco: 0,
    essencia: null,
    escolhaFragmento: 0,
    recompensaTorre: { id: rp.id, nome: rp.nome, qtd: 1 },
  };

  if (primeiraVezUnica) {
    save.recompensas.diamantes += TORRES_CFG.diamantesPorAndar;
    premios.diamantes += TORRES_CFG.diamantesPorAndar;
    const doces = docesGraduaisAndar(andar, torre.totalAndares);
    hwDe(save).doces += doces;
    premios.doces = doces;
    if (andar % TORRES_CFG.marcoIntervalo === 0) {
      hwDe(save).tickets += TORRES_CFG.marcoTicketsEvento;
      premios.ticketsEvento = TORRES_CFG.marcoTicketsEvento;
    }
  }

  if (possui) {
    armas.fragmentos[linhagemSorteada] = (armas.fragmentos[linhagemSorteada] || 0) + 1;
    premios.fragmentos = 1;
  } else {
    armas.poUnico += 1;
    premios.poUnico = 1;
  }

  // Bônus específico por Torre Única (Ascensão ≠ Abismo ≠ Eclipse)
  if (rp.essenciaPar) {
    const tam = andar <= 30 ? 'menor' : andar <= 70 ? 'media' : 'maior';
    adicionarEssencia(save, rp.essenciaPar, tam, 1);
    premios.essencia = { par: rp.essenciaPar, tamanho: tam, qtd: 1 };
  }
  if (rp.poReforco) {
    const idle = save.idle || (save.idle = {});
    idle.reliquias = idle.reliquias || { bolsa: [], equipadas: {}, predefinicoes: {}, capacidade: 200, poReforco: 0, seq: 0 };
    idle.reliquias.poReforco = (Number(idle.reliquias.poReforco) || 0) + rp.poReforco;
    premios.poReforco = rp.poReforco;
  }
  if (rp.diamantes) {
    save.recompensas.diamantes += rp.diamantes;
    premios.diamantes += rp.diamantes;
  }
  if (rp.escolhaACadaAndares && andar % rp.escolhaACadaAndares === 0) {
    armas.escolhasPendentes += 1;
    premios.escolhaFragmento = 1;
  }

  if (batalhaId) marcarBatalhaTorrePaga(t, batalhaId);
  registrarMarco(save, 'torre_unica', { torre: torreId, andar });
  return { ok: true, jaPago: false, venceu: true, premios };
}

export function trocarPoUnicoPorFragmento(save, especieOuLinhagem, qtd = 1) {
  const n = Math.max(1, Math.floor(Number(qtd) || 1));
  const linhagem = linhagemArmaUnicaDe(especieOuLinhagem);
  if (!linhagem) return { ok: false, motivo: 'Linhagem inválida.' };
  const armas = armasUnicasState(save);
  const custo = n * TORRES_CFG.custoPoPorFragmento;
  if (armas.poUnico < custo) {
    return { ok: false, motivo: `Falta Pó Único (precisa ${custo}, saldo ${armas.poUnico}).` };
  }
  armas.poUnico -= custo;
  armas.fragmentos[linhagem] = (armas.fragmentos[linhagem] || 0) + n;
  return { ok: true, linhagem, custoPo: custo, ganhos: n, saldoFragmentos: armas.fragmentos[linhagem], poRestante: armas.poUnico };
}

export function resgatarEscolhaFragmentoUnico(save, especieOuLinhagem) {
  const linhagem = linhagemArmaUnicaDe(especieOuLinhagem);
  if (!linhagem) return { ok: false, motivo: 'Linhagem inválida.' };
  const armas = armasUnicasState(save);
  if (armas.escolhasPendentes < 1) return { ok: false, motivo: 'Nenhuma escolha de fragmento único pendente.' };
  armas.escolhasPendentes -= 1;
  armas.fragmentos[linhagem] = (armas.fragmentos[linhagem] || 0) + 1;
  return { ok: true, linhagem, saldoFragmentos: armas.fragmentos[linhagem], escolhasRestantes: armas.escolhasPendentes };
}

// ---- Torres Sazonais: Quinzenal (15 dias) e Mensal (30 dias) — 100 andares cada ----
export const TORRES_SAZONAIS_CFG = {
  quinzenal: {
    id: 'quinzenal',
    nome: 'Torre Quinzenal da Convergência',
    cicloDias: 15,
    cicloMs: 15 * TORRES_CFG.diaMs,
    totalAndares: 100,
    nivelBase: 15,
    nivelPorAndar: 2,
    desc: 'Reinicia a cada 15 dias (100 andares). Foco em Tickets Permanentes, 10 💎/andar, Doces graduais e Essências.',
  },
  mensal: {
    id: 'mensal',
    nome: 'Torre Mensal do Zênite',
    cicloDias: 30,
    cicloMs: 30 * TORRES_CFG.diaMs,
    totalAndares: 100,
    nivelBase: 25,
    nivelPorAndar: 2.5,
    desc: 'Reinicia a cada 30 dias (100 andares). Foco em Tickets de Evento, 10 💎/andar, Doces graduais e Escolhas de Arma Única.',
  },
};

export const TORRES_SAZONAIS_CATALOGO = Object.values(TORRES_SAZONAIS_CFG).map((cfg) => ({
  ...cfg,
  andares: Array.from({ length: cfg.totalAndares }, (_, idx) => {
    const andar = idx + 1;
    const nivel = Math.round(cfg.nivelBase + (andar - 1) * cfg.nivelPorAndar);
    const chefe = andar % 10 === 0;
    const isMensal = cfg.id === 'mensal';
    return {
      andar,
      nivel,
      chefe,
      energia: 0,
      recompensa: {
        ouro: (isMensal ? 500 : 350) + andar * (isMensal ? 90 : 60),
        diamantes: TORRES_CFG.diamantesPorAndar,
        doces: docesGraduaisAndar(andar, cfg.totalAndares),
        ticketsEvento: chefe ? TORRES_CFG.marcoTicketsEvento : 0,
        ticketsPermanentes: chefe ? (isMensal ? 2 : 1) : 0,
        ticketsSemanais: isMensal && chefe ? 2 : 0,
        escolhaFragmento: isMensal && andar === cfg.totalAndares ? 1 : 0,
        xpFormacao: xpAndarTorre(andar),
      },
    };
  }),
}));

export const TORRES_SAZONAIS_POR_ID = Object.fromEntries(TORRES_SAZONAIS_CATALOGO.map((t) => [t.id, t]));

export function infoCicloTorreSazonal(torreId, agoraMs = Date.now()) {
  const cfg = TORRES_SAZONAIS_CFG[torreId];
  if (!cfg) return null;
  const t = Math.max(0, Math.floor(Number(agoraMs) || Date.now()));
  const ciclo = Math.floor(t / cfg.cicloMs);
  const inicioMs = ciclo * cfg.cicloMs;
  const fimMs = inicioMs + cfg.cicloMs;
  const restanteMs = Math.max(0, fimMs - t);
  return { id: cfg.id, ciclo, cicloDias: cfg.cicloDias, inicioMs, fimMs, restanteMs };
}

export function estadoTorreSazonal(save, torreId, agoraMs = Date.now()) {
  const torre = TORRES_SAZONAIS_POR_ID[torreId];
  if (!torre) return null;
  const info = infoCicloTorreSazonal(torreId, agoraMs);
  const t = torresDe(save);
  const cur = t.sazonais[torreId];
  if (!cur || cur.ciclo !== info.ciclo) {
    t.sazonais[torreId] = { ciclo: info.ciclo, maiorAndar: 0, pagas: {} };
  }
  const est = t.sazonais[torreId];
  return { ...torre, ...info, maiorAndar: est.maiorAndar || 0, pagas: { ...(est.pagas || {}) } };
}

export function iniciarAndarTorreSazonal(save, torreId, andar, { agoraMs = Date.now(), batalhaId = null } = {}) {
  const est = estadoTorreSazonal(save, torreId, agoraMs);
  const andarDef = est?.andares?.[andar - 1];
  if (!est || !andarDef) return { ok: false, motivo: 'Andar da Torre Sazonal inválido.' };
  if (andar > 1 && andar > est.maiorAndar + 1) return { ok: false, motivo: 'Andar ainda bloqueado neste ciclo.' };
  const t = torresDe(save);
  const jaVencido = Boolean(est.pagas?.[String(andar)]);
  let gastouTicket = false;
  if (jaVencido) {
    if (saldoTicketTorre(save, torreId) < 1) {
      return { ok: false, precisaTicket: true, motivo: 'Repetir andar já vencido exige 1 Ticket desta torre.' };
    }
    t.tickets[torreId] -= 1;
    gastouTicket = true;
  }
  return {
    ok: true,
    batalhaId: batalhaId || `ts_${torreId}_c${est.ciclo}_a${andar}_${agoraMs}`,
    torre: est,
    andar: andarDef,
    custoEnergia: 0,
    gastouTicket,
    ticketsRestantes: saldoTicketTorre(save, torreId),
  };
}

export function concluirAndarTorreSazonal(save, torreId, andar, resultado = { venceu: true }, { agoraMs = Date.now(), batalhaId = null } = {}) {
  const est = estadoTorreSazonal(save, torreId, agoraMs);
  const andarDef = est?.andares?.[andar - 1];
  if (!est || !andarDef) return { ok: false, motivo: 'Andar da Torre Sazonal inválido.' };
  if (andar > 1 && andar > est.maiorAndar + 1) return { ok: false, motivo: 'Andar ainda bloqueado neste ciclo.' };
  const t = torresDe(save);
  if (batalhaId && t.batalhasPagas[batalhaId]) return { ok: true, jaPago: true, venceu: false, premios: {} };

  const xpBase = andarDef.recompensa.xpFormacao;
  const venceu = Boolean(resultado?.venceu || resultado?.fim === 'vitoria');
  if (!venceu) {
    const xpDerrota = creditarXpFormacaoTorre(save, Math.round(xpBase * 0.3));
    if (batalhaId) marcarBatalhaTorrePaga(t, batalhaId);
    return { ok: true, jaPago: false, venceu: false, premios: { xpFormacao: xpDerrota } };
  }

  const slot = t.sazonais[torreId];
  slot.maiorAndar = Math.max(slot.maiorAndar || 0, andar);
  const chave = String(andar);
  const premios = { ouro: 0, diamantes: 0, doces: 0, ticketsEvento: 0, ticketsPermanentes: 0, ticketsSemanais: 0, escolhaFragmento: 0, xpFormacao: 0 };
  save.recompensas = save.recompensas || { gold: 0, diamantes: 0, xp: 0 };

  if (!slot.pagas[chave]) {
    slot.pagas[chave] = true;
    const r = andarDef.recompensa;
    premios.ouro = r.ouro;
    premios.diamantes = r.diamantes;
    premios.doces = r.doces;
    premios.ticketsEvento = r.ticketsEvento;
    premios.ticketsPermanentes = r.ticketsPermanentes;
    premios.ticketsSemanais = r.ticketsSemanais;
    premios.escolhaFragmento = r.escolhaFragmento;
    save.recompensas.gold += r.ouro;
    save.recompensas.diamantes += r.diamantes;
    hwDe(save).doces += r.doces;
    if (r.ticketsEvento) hwDe(save).tickets += r.ticketsEvento;
    const e = expDe(save);
    if (r.ticketsPermanentes) e.tickets = (e.tickets || 0) + r.ticketsPermanentes;
    if (r.ticketsSemanais) e.ticketsSemanais = (e.ticketsSemanais || 0) + r.ticketsSemanais;
    if (r.escolhaFragmento) armasUnicasState(save).escolhasPendentes += r.escolhaFragmento;
    premios.xpFormacao = creditarXpFormacaoTorre(save, xpBase);
  } else {
    premios.ouro = 120;
    save.recompensas.gold += 120;
    premios.xpFormacao = creditarXpFormacaoTorre(save, Math.round(xpBase * 0.5));
  }

  if (batalhaId) marcarBatalhaTorrePaga(t, batalhaId);
  return { ok: true, jaPago: false, venceu: true, ciclo: est.ciclo, premios };
}
