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
};

export const TORRES_CFG = {
  maxAndaresElemental: 50,
  treinosDiariosMax: 3,
  energiaTreinoDiario: 0,
  maxAndaresUnica: 30,
  energiaTorreUnica: 0,
  custoPoPorFragmento: 5,
  fragmentosParaArma: 10,
  diaMs: 86_400_000,
};

export function nivelAndarTorreElemental(andar) {
  const a = Math.max(1, Math.min(TORRES_CFG.maxAndaresElemental, Math.floor(Number(andar) || 1)));
  return Math.round(5 + a * 1.9);
}

export function nivelAndarTorreUnica(andar) {
  const a = Math.max(1, Math.min(TORRES_CFG.maxAndaresUnica, Math.floor(Number(andar) || 1)));
  return Math.round(60 + ((a - 1) * 60) / (TORRES_CFG.maxAndaresUnica - 1));
}

export function essenciaDoAndarElemental(parEssencia, andar) {
  if (andar <= 15) return { par: parEssencia, tamanho: 'menor', qtd: 3 };
  if (andar <= 35) return { par: parEssencia, tamanho: 'media', qtd: 2 };
  return { par: parEssencia, tamanho: 'maior', qtd: 1 };
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

// Taxas oficiais de Essência por Torre Elemental (documentadas para UI e relatório)
export const TAXAS_ESSENCIA_TORRES = TORRES_ELEMENTAIS_CATALOGO.map((t) => ({
  id: t.id,
  nome: t.nome,
  elementos: [...t.elementos],
  parEssencia: t.parEssencia,
  essenciaNome: ESSENCIAS_PARES[t.parEssencia]?.nome || t.parEssencia,
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
  t.batalhasPagas ||= {};
  return t;
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
  const jaVencido = Boolean(torresDe(save).elementais[torreId]?.pagas?.[String(andar)]);
  const custo = jaVencido ? andarDef.energia : 0; // DESIGN §8: Torres (1ª vitória) não gastam energia
  const g = custo > 0 ? gastarEnergia(save, custo, agoraMs) : { ok: true, atual: energiaDe(save, agoraMs).atual };
  if (!g.ok) return g;
  return {
    ok: true,
    batalhaId: batalhaId || `te_${torreId}_${andar}_${agoraMs}`,
    torre,
    andar: andarDef,
    custoEnergia: custo,
    energiaRestante: g.atual,
  };
}

export function concluirAndarTorreElemental(save, torreId, andar, resultado = { venceu: true }, { batalhaId = null, agoraMs = Date.now() } = {}) {
  const torre = TORRES_ELEMENTAIS_POR_ID[torreId];
  const andarDef = torre?.andares?.[andar - 1];
  if (!andarDef) return { ok: false, motivo: 'Andar inválido.' };
  if (!andarTorreElementalDesbloqueado(save, torreId, andar)) return { ok: false, motivo: 'Andar ainda bloqueado.' };
  const t = torresDe(save);
  if (batalhaId && t.batalhasPagas[batalhaId]) return { ok: true, jaPago: true, venceu: false, premios: {} };

  const xpBase = 45 + andar * 12;
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
  const premios = { ouro: 0, diamantes: 0, essencia: null, xpFormacao: 0 };
  save.recompensas = save.recompensas || { gold: 0, diamantes: 0, xp: 0 };

  if (!est.pagas[chave]) {
    est.pagas[chave] = true;
    const p1 = andarDef.recompensaPrimeiraVitoria;
    premios.diamantes = p1.diamantes;
    premios.ouro = p1.ouro;
    premios.essencia = { ...p1.essencia };
    save.recompensas.diamantes += p1.diamantes;
    save.recompensas.gold += p1.ouro;
    adicionarEssencia(save, p1.essencia.par, p1.essencia.tamanho, p1.essencia.qtd);
    premios.xpFormacao = creditarXpFormacaoTorre(save, xpBase);
  } else {
    premios.ouro = 100;
    save.recompensas.gold += 100;
    premios.xpFormacao = creditarXpFormacaoTorre(save, Math.round(xpBase * 0.5));
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
  if (!podeFazerTorreUnicaHoje(save, torreId, andar, agoraMs)) {
    return { ok: false, limiteDiario: true, motivo: 'Este andar da Torre Única já foi concluído hoje (1×/dia por andar).' };
  }
  const g = gastarEnergia(save, andarDef.energia, agoraMs);
  if (!g.ok) return g;
  return { ok: true, batalhaId: batalhaId || `tu_${torreId}_${andar}_${agoraMs}`, torre, andar: andarDef, energiaRestante: g.atual };
}

export function concluirAndarTorreUnica(save, torreId, andar, resultado = { venceu: true }, { agoraMs = Date.now(), batalhaId = null, rng = Math.random } = {}) {
  const torre = TORRES_UNICAS_POR_ID[torreId];
  const andarDef = torre?.andares?.[andar - 1];
  if (!andarDef) return { ok: false, motivo: 'Andar da Torre Única inválido.' };
  if (!andarTorreUnicaDesbloqueado(save, torreId, andar)) return { ok: false, motivo: 'Andar ainda bloqueado.' };
  const t = torresDe(save);
  if (batalhaId && t.batalhasPagas[batalhaId]) return { ok: true, jaPago: true, venceu: false, premios: {} };
  if (!podeFazerTorreUnicaHoje(save, torreId, andar, agoraMs)) {
    return { ok: false, limiteDiario: true, motivo: 'Andar já concluído hoje (1×/dia por andar).' };
  }

  const xpBase = 80 + andar * 15;
  const venceu = Boolean(resultado?.venceu || resultado?.fim === 'vitoria');
  if (!venceu) {
    const xpDerrota = creditarXpFormacaoTorre(save, Math.round(xpBase * 0.3));
    if (batalhaId) marcarBatalhaTorrePaga(t, batalhaId);
    return { ok: true, jaPago: false, venceu: false, premios: { xpFormacao: xpDerrota } };
  }

  const dia = Math.floor(agoraMs / TORRES_CFG.diaMs);
  t.unicas[torreId] = { maiorAndar: Math.max(Number(t.unicas[torreId]?.maiorAndar) || 0, andar) };
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
    poReforco: 0,
    essencia: null,
    escolhaFragmento: 0,
    recompensaTorre: { id: rp.id, nome: rp.nome, qtd: 1 },
  };

  if (possui) {
    armas.fragmentos[linhagemSorteada] = (armas.fragmentos[linhagemSorteada] || 0) + 1;
    premios.fragmentos = 1;
  } else {
    armas.poUnico += 1;
    premios.poUnico = 1;
  }

  // Bônus específico por Torre Única (Ascensão ≠ Abismo ≠ Eclipse)
  if (rp.essenciaPar) {
    const tam = andar <= 10 ? 'menor' : andar <= 20 ? 'media' : 'maior';
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
    premios.diamantes = rp.diamantes;
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

// ---- Torres Sazonais: Quinzenal (15 dias) e Mensal (30 dias) ----
export const TORRES_SAZONAIS_CFG = {
  quinzenal: {
    id: 'quinzenal',
    nome: 'Torre Quinzenal da Convergência',
    cicloDias: 15,
    cicloMs: 15 * TORRES_CFG.diaMs,
    totalAndares: 20,
    nivelBase: 15,
    nivelPorAndar: 4,
    desc: 'Reinicia a cada 15 dias. Foco em Tickets Permanentes, Diamantes, Ouro e Essências.',
  },
  mensal: {
    id: 'mensal',
    nome: 'Torre Mensal do Zênite',
    cicloDias: 30,
    cicloMs: 30 * TORRES_CFG.diaMs,
    totalAndares: 30,
    nivelBase: 25,
    nivelPorAndar: 5,
    desc: 'Reinicia a cada 30 dias. Foco em Tickets Semanais/Especiais, Tickets Permanentes, Diamantes e Escolhas de Arma Única.',
  },
};

export const TORRES_SAZONAIS_CATALOGO = Object.values(TORRES_SAZONAIS_CFG).map((cfg) => ({
  ...cfg,
  andares: Array.from({ length: cfg.totalAndares }, (_, idx) => {
    const andar = idx + 1;
    const nivel = cfg.nivelBase + (andar - 1) * cfg.nivelPorAndar;
    const chefe = andar % 5 === 0;
    const isMensal = cfg.id === 'mensal';
    return {
      andar,
      nivel,
      chefe,
      energia: 0,
      recompensa: {
        ouro: (isMensal ? 500 : 350) + andar * (isMensal ? 90 : 60),
        diamantes: chefe ? (isMensal ? 80 : 50) : (isMensal ? 25 : 15),
        ticketsPermanentes: chefe ? (isMensal ? 2 : 1) : 0,
        ticketsSemanais: isMensal && andar % 10 === 0 ? 2 : 0,
        escolhaFragmento: isMensal && andar === cfg.totalAndares ? 1 : 0,
        xpFormacao: (isMensal ? 90 : 65) + andar * 14,
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
  return {
    ok: true,
    batalhaId: batalhaId || `ts_${torreId}_c${est.ciclo}_a${andar}_${agoraMs}`,
    torre: est,
    andar: andarDef,
    custoEnergia: 0,
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
  const premios = { ouro: 0, diamantes: 0, ticketsPermanentes: 0, ticketsSemanais: 0, escolhaFragmento: 0, xpFormacao: 0 };
  save.recompensas = save.recompensas || { gold: 0, diamantes: 0, xp: 0 };

  if (!slot.pagas[chave]) {
    slot.pagas[chave] = true;
    const r = andarDef.recompensa;
    premios.ouro = r.ouro;
    premios.diamantes = r.diamantes;
    premios.ticketsPermanentes = r.ticketsPermanentes;
    premios.ticketsSemanais = r.ticketsSemanais;
    premios.escolhaFragmento = r.escolhaFragmento;
    save.recompensas.gold += r.ouro;
    save.recompensas.diamantes += r.diamantes;
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
