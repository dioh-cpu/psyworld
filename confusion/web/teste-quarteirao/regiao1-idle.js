// Módulo Idle & Progressão da Região 1 — Confusion Waves: Double Perspective.
// Reaproveita diretamente core.js, systems.js e species.js (sem duplicar regras do núcleo).

import {
  nivelDomadorDe as nivelDeXp,
  xpParaDomador as xpParaProximo,
  xpTotalDomador as xpDoNivel,
  xpTotal as xpTotalOnirico,
  aplicarXp,
  migrarProgressaoOniricos,
  estrelasIniciais,
} from './regiao1-progressao.js'; // progressão sem teto + curva exclusiva do Domador + estrelas/tier
import { membrosFormacao } from './regiao1-exp-regras.js';
import {
  sanityBand,
  gatherDay,
  multElemento,
} from '../core.js';
import {
  LOGIN_CYCLE,
  loginRewardFor,
  nextLoginStreak,
  passRewardFor,
  passPremiumRewardFor,
  activeEvents,
  raidAt,
  GOLD,
  goldEncontro,
  SPHERE_PRICE,
  captureChance,
  dropsEgg,
} from '../systems.js';
import {
  PASSE_CFG,
  LOGIN_7D_CATALOGO,
  passeDe,
  ganharXpPasse,
  xpPasseOffline,
  nivelPasse,
  premioNivel,
  resgatarPasse,
  comprarNivelPasse,
  infoPasse,
  trilhaPasse,
  infoLogin7Dias,
  abrirOvoPasse,
} from './regiao1-passe-regras.js';
import { adicionarFragmentoSonho } from './regiao1-criacao-regras.js';
import { darPocao } from './regiao1-halloween-regras.js';
import { ESPECIES, ELEMENTO_DA_ESPECIE, HABILIDADES_DA_ESPECIE } from '../species.js';
import { sortearDropFragmentoSonho, aplicarDropsOfflineFragmentos, fragmentosSonhoDe, migrarInicialNoctarn, derrotasPagasDe } from './regiao1-regras-sonho.js';
import { revancheDe } from './regiao1-revanche-regras.js';

const PASS_LEVELS = PASSE_CFG.niveis;
const passLevel = nivelPasse;

export const I18N = {
  pt: {
    menu: 'Menu',
    diario: 'Diário',
    atlas: 'Caçar',
    autoOn: 'Auto · ON',
    autoOff: 'Auto · OFF',
    transformar: '✨ Transformar',
    onirico: '✨ Onírico (+100%)',
    autorota: '🧭 Auto-Rota',
    pararRota: '⏹ Parar Rota',
    economia: 'Economia de Energia',
    hudClean: 'HUD Clean',
    instalar: 'Instalar Jogo (PWA)',
  },
  en: {
    menu: 'Menu',
    diario: 'Quests',
    atlas: 'Hunt',
    autoOn: 'Auto · ON',
    autoOff: 'Auto · OFF',
    transformar: '✨ Transform',
    onirico: '✨ Oniric (+100%)',
    autorota: '🧭 Auto-Route',
    pararRota: '⏹ Stop Route',
    economia: 'Power Saver',
    hudClean: 'Clean HUD',
    instalar: 'Install App (PWA)',
  },
  es: {
    menu: 'Menú',
    diario: 'Misiones',
    atlas: 'Cazar',
    autoOn: 'Auto · ON',
    autoOff: 'Auto · OFF',
    transformar: '✨ Transformar',
    onirico: '✨ Onírico (+100%)',
    autorota: '🧭 Auto-Ruta',
    pararRota: '⏹ Detener',
    economia: 'Ahorro de Energía',
    hudClean: 'HUD Limpio',
    instalar: 'Instalar Juego (PWA)',
  },
};

export const RELIQUIAS_CATALOGO = [
  { id: 'rel_lamina_sombra', nome: 'Lâmina da Maré Umbral', slot: 'arma', atk: 12, def: 2, hp: 10, custo: 180, desc: '+12 ATK, +2 DEF, +10 HP' },
  { id: 'rel_cajado_luz', nome: 'Bastão Prismático', slot: 'arma', atk: 18, def: 4, hp: 20, custo: 420, desc: '+18 ATK, +4 DEF, +20 HP' },
  { id: 'rel_amuleto_cristal', nome: 'Amuleto de Ametista', slot: 'amuleto', atk: 5, def: 10, hp: 35, custo: 260, desc: '+5 ATK, +10 DEF, +35 HP' },
  { id: 'rel_selo_onirico', nome: 'Selo de Vínculo Onírico', slot: 'selo', atk: 9, def: 6, hp: 25, captura: 0.08, custo: 340, desc: '+9 ATK, +6 DEF, +8% Captura' },
];

export const MISSOES_CAPTURA_LEGADAS = ['dm_capturas_3'];

const POOL_MISSOES_DIARIAS = [
  { id: 'dm_abates_15', titulo: 'Derrotar 15 Oníricos selvagens', tipo: 'abates', meta: 15, xpPasse: 180, gold: 90, mapaSugerido: 'E1', acaoRotulo: 'Ir caçar' },
  { id: 'dm_abates_30', titulo: 'Derrotar 30 Oníricos selvagens', tipo: 'abates', meta: 30, xpPasse: 300, gold: 160, mapaSugerido: 'PC1', acaoRotulo: 'Ir caçar' },
  { id: 'dm_batalhas_3', titulo: 'Vencer 3 batalhas na Campanha ou Torre', tipo: 'batalhas', meta: 3, xpPasse: 240, gold: 120, mapaSugerido: 'D1', acaoRotulo: 'Ir batalhar' },
  { id: 'dm_areas_5', titulo: 'Explorar 5 áreas diferentes', tipo: 'areas', meta: 5, xpPasse: 200, gold: 100, mapaSugerido: 'C1', acaoRotulo: 'Explorar' },
  { id: 'dm_ovos_2', titulo: 'Obter ou chocar 2 ovos', tipo: 'ovos', meta: 2, xpPasse: 260, gold: 140, mapaSugerido: 'CC2', acaoRotulo: 'Ir caçar' },
  { id: 'dm_boss_1', titulo: 'Enfrentar 1 Chefe de Arena', tipo: 'bosses', meta: 1, xpPasse: 360, gold: 220, mapaSugerido: 'BOSS_E', acaoRotulo: 'Desafiar Chefe' },
];

export const PONTOS_POR_NIVEL = 3;

export const ATRIBUTOS_DOMADOR = [
  { id: 'for', sigla: 'FOR', nome: 'Força Onírica', desc: '+3 ATK por ponto (aumenta dano de ataques e habilidades)' },
  { id: 'vit', sigla: 'VIT', nome: 'Vitalidade', desc: '+15 HP Máx e +1 DEF por ponto (mais resistência em áreas difíceis)' },
  { id: 'men', sigla: 'MEN', nome: 'Mente', desc: '+2 ATK Elemental e +1% proteção mental por ponto' },
  { id: 'vin', sigla: 'VIN', nome: 'Vínculo', desc: '+3% XP ganho por ponto (fortalece o laço e acelera o progresso da equipe)' },
  { id: 'sor', sigla: 'SOR', nome: 'Sorte', desc: '+3% Gold, +2% Drop de Ovos e +4% Fazenda por ponto' },
];

export function criarEstadoIdle(agoraMs = Date.now()) {
  return {
    perspectiva: 'vilao', // 'vilao' (Azazel/Trevas) ou 'heroi' (Luz)
    jogador: {
      xp: 0,
      hp: 130,
      sanidade: 100,
      abatesTotais: 0,
      capturasTotais: 0,
      atributos: { for: 0, vit: 0, men: 0, vin: 0, sor: 0 },
    },
    ultimoTickMs: agoraMs,
    autoCaca: {
      ativo: false,
      alvosIgnorados: [],
      preferirVantagem: true,
      autoCapturar: false,
      descansarHpPct: 30,
      descansarSanidadePct: 25,
      voltarMarcoEmergencia: true,
      coletarOvos: true,
    },
    codex: {
      especies: { Penumbrio: { visto: true, abates: 0, capturas: 1 } },
      areasVisitadas: { C0: true },
      bosses: {},
      itens: {},
    },
    mochila: {
      esferas: {},
      ovos: [],
      reliquiasPossuidas: [],
      equipada: {},
      ingredientes: { erva_costeira: 3, cristal_bruto: 1 },
      fragmentosSonho: { trevas: 0, fogo: 0, agua: 0, planta: 0, luz: 0, fantasma: 0, neutro: 0 },
      fragmentosChefe: {},
      itensTier: {},
      itensExclusivosChefe: {},
    },
    revanches: { cooldowns: {}, emAndamento: null, concluidas: {}, craftsPagos: {} },
    derrotasPagas: { ids: {}, ordem: [] },
    montaria: 'brumacervo',
    equipe: [
      { especie: 'Penumbrio', nivel: 5, xp: xpTotalOnirico(5), tier: 4, raridade: 4, estrelas: estrelasIniciais('inicial'), forma: 'natural', formaFase: 1, inicial: true, origem: 'inicial-padrao', uid: 'ini0' },
    ],
    login: { streak: 0, lastDay: -1 },
    passe: passeDe({ passe: null }, agoraMs),
    diarias: gerarDiariasIniciais(agoraMs),
    votos: { voteCash: 0, ultimoTopIdle: 0, ultimoIdleRank: 0, totalVotos: 0 },
    config: {
      idioma: 'pt',
      hudClean: false,
      economiaEnergia: false,
      hudEscala: 100,
      fpsLimite: 60,
      mostrarDano: true,
      orientacao: 'auto',
      modoCampanha: 'completa',
      tutorialConcluido: false,
    },
    logs: [],
    _pronto: true,
  };
}

function gerarDiariasIniciais(agoraMs) {
  const dia = Math.floor(agoraMs / 86400000);
  return {
    dia,
    rerollsRestantes: 3,
    itens: POOL_MISSOES_DIARIAS.slice(0, 4).map((m) => ({ ...m, progresso: 0, resgatada: false })),
  };
}

function migrarMissoesCaptura(diarias) {
  if (!diarias || !Array.isArray(diarias.itens)) return;
  const substituto = POOL_MISSOES_DIARIAS.find((p) => p.id === 'dm_batalhas_3');
  if (!substituto) return;
  diarias.itens = diarias.itens.map((m) => (
    (m?.id === 'dm_capturas_3' || m?.tipo === 'capturas') && !m.resgatada
      ? { ...substituto, progresso: 0, resgatada: false }
      : m
  ));
}

export function garantirEstadoIdle(save, agoraMs = Date.now()) {
  const diaAtual = Math.floor(agoraMs / 86400000);
  if (save.idle && save.idle._pronto) {
    if (!save.idle.jogador.atributos) {
      save.idle.jogador.atributos = { for: 0, vit: 0, men: 0, vin: 0, sor: 0 };
    }
    if ((save.recompensas?.xp || 0) > (save.idle.jogador.xp || 0)) {
      save.idle.jogador.xp = save.recompensas.xp;
    }
    if (!save.idle.diarias || save.idle.diarias.dia !== diaAtual) {
      save.idle.diarias = gerarDiariasIniciais(agoraMs);
    } else {
      migrarMissoesCaptura(save.idle.diarias);
    }
    passeDe(save.idle, agoraMs);
    if (save.idle.montaria === undefined) save.idle.montaria = 'brumacervo';
    fragmentosSonhoDe(save);
    revancheDe(save);
    migrarProgressaoOniricos(save);
    migrarInicialNoctarn(save);
    limparOvosNoctarnDoPasse(save);
    return save.idle;
  }
  const base = criarEstadoIdle(agoraMs);
  if (!save.idle || typeof save.idle !== 'object') {
    save.idle = base;
    if ((save.recompensas?.xp || 0) > 0) save.idle.jogador.xp = save.recompensas.xp;
    return save.idle;
  }
  save.idle = {
    ...base,
    ...save.idle,
    jogador: {
      ...base.jogador,
      ...(save.idle.jogador || {}),
      atributos: { ...base.jogador.atributos, ...(save.idle.jogador?.atributos || {}) },
    },
    autoCaca: { ...base.autoCaca, ...(save.idle.autoCaca || {}) },
    codex: {
      especies: { ...base.codex.especies, ...(save.idle.codex?.especies || {}) },
      areasVisitadas: { ...base.codex.areasVisitadas, ...(save.idle.codex?.areasVisitadas || {}) },
      bosses: { ...(save.idle.codex?.bosses || {}) },
      itens: { ...(save.idle.codex?.itens || {}) },
    },
    mochila: {
      ...base.mochila,
      ...(save.idle.mochila || {}),
      esferas: { ...(save.idle.mochila?.esferas || {}) },
      reliquiasPossuidas: Array.isArray(save.idle.mochila?.reliquiasPossuidas) ? [...save.idle.mochila.reliquiasPossuidas] : [],
      equipada: { ...(save.idle.mochila?.equipada || {}) },
      ingredientes: { ...base.mochila.ingredientes, ...(save.idle.mochila?.ingredientes || {}) },
    },
    login: { ...base.login, ...(save.idle.login || {}) },
    passe: save.idle.passe || base.passe,
    votos: { ...base.votos, ...(save.idle.votos || {}) },
    config: { ...base.config, ...(save.idle.config || {}) },
    montaria: save.idle.montaria === undefined ? 'brumacervo' : (save.idle.montaria || null),
    logs: Array.isArray(save.idle.logs) ? save.idle.logs.slice(-60) : [],
    equipe: Array.isArray(save.idle.equipe) && save.idle.equipe.length ? save.idle.equipe : base.equipe,
    _pronto: true,
  };
  passeDe(save.idle, agoraMs);
  if ((save.recompensas?.xp || 0) > (save.idle.jogador.xp || 0)) {
    save.idle.jogador.xp = save.recompensas.xp;
  }
  if (!save.idle.diarias || save.idle.diarias.dia !== diaAtual) {
    save.idle.diarias = gerarDiariasIniciais(agoraMs);
  } else {
    migrarMissoesCaptura(save.idle.diarias);
  }
  fragmentosSonhoDe(save);
  revancheDe(save);
  migrarProgressaoOniricos(save);
  migrarInicialNoctarn(save);
  limparOvosNoctarnDoPasse(save);
  return save.idle;
}

function limparOvosNoctarnDoPasse(save) {
  const ovos = save?.idle?.mochila?.ovos;
  if (!Array.isArray(ovos)) return;
  for (const ovo of ovos) {
    if (ovo && ovo.especie === 'Noctarn' && String(ovo.origem || '').startsWith('passe-')) {
      ovo.especie = 'Ignavor';
    }
  }
}

// ---- Pontos de Atributo do Domador (+3 pontos por nível) ----
export function pontosDomadorDisponiveis(save) {
  const idle = garantirEstadoIdle(save);
  const nivel = nivelDeXp(idle.jogador.xp);
  const total = Math.max(0, (nivel - 1) * PONTOS_POR_NIVEL);
  const a = idle.jogador.atributos || {};
  const gastos = (a.for || 0) + (a.vit || 0) + (a.men || 0) + (a.vin || 0) + (a.sor || 0);
  return Math.max(0, total - gastos);
}

export function distribuirAtributoDomador(save, attrId, qtd = 1) {
  const idle = garantirEstadoIdle(save);
  if (!['for', 'vit', 'men', 'vin', 'sor'].includes(attrId)) return { ok: false, motivo: 'Atributo inválido.' };
  const disp = pontosDomadorDisponiveis(save);
  if (disp < qtd) return { ok: false, motivo: 'Sem pontos de Domador disponíveis.' };
  idle.jogador.atributos[attrId] = (idle.jogador.atributos[attrId] || 0) + qtd;
  if (attrId === 'vit') {
    const st = calcularStatusDetalhado(save);
    idle.jogador.hp = Math.min(st.hpMax, idle.jogador.hp + 15 * qtd);
  }
  return { ok: true, restantes: disp - qtd };
}

export function resetarAtributosDomador(save) {
  const idle = garantirEstadoIdle(save);
  idle.jogador.atributos = { for: 0, vit: 0, men: 0, vin: 0, sor: 0 };
  const st = calcularStatusDetalhado(save);
  idle.jogador.hp = Math.min(idle.jogador.hp, st.hpMax);
  return { ok: true, disponiveis: pontosDomadorDisponiveis(save) };
}

// ---- Codex Onírico: bônus permanentes globais para a conta ----
export function bonusCodex(idle) {
  const nEspecies = Object.keys(idle.codex.especies || {}).length;
  const nCapturadas = Object.values(idle.codex.especies || {}).filter((e) => (e.capturas || 0) > 0).length;
  const nAreas = Object.keys(idle.codex.areasVisitadas || {}).length;
  const nBosses = Object.keys(idle.codex.bosses || {}).length;
  const pontos = nEspecies * 10 + nCapturadas * 15 + nAreas * 5 + nBosses * 40;
  const marcos = Math.floor(pontos / 60);
  return {
    nEspecies,
    nCapturadas,
    nAreas,
    nBosses,
    pontos,
    marcos,
    hpPct: Math.min(40, marcos * 4),
    atkPct: Math.min(35, marcos * 3),
    capturaPct: 0,
    fazendaPct: Math.min(40, marcos * 4),
  };
}

export function registrarCodexArea(idle, mapaId) {
  if (!idle.codex.areasVisitadas[mapaId]) {
    idle.codex.areasVisitadas[mapaId] = true;
    avancarDiaria(idle, 'areas', 1);
    return true;
  }
  return false;
}

export function registrarCodexEspecie(idle, especie, { abate = false, captura = false } = {}) {
  const entry = idle.codex.especies[especie] || { visto: true, abates: 0, capturas: 0 };
  entry.visto = true;
  if (abate) entry.abates += 1;
  if (captura) entry.capturas += 1;
  idle.codex.especies[especie] = entry;
}

// ---- Status Explicáveis (breakdown de cada bônus + pontos de Domador) ----
// Ovos são raros: os Oníricos vêm do gacha (diamantes) e do que se choca na fazenda. Ajuste aqui depois de jogar.
// Banner = única forma de obter Oníricos novos: ovos não caem mais. Ovos viram ingrediente da Fazenda.
export const OVOS = { fatorDrop: 0, abatesPorOvoOffline: Infinity };

export function calcularStatusDetalhado(save) {
  const idle = garantirEstadoIdle(save);
  const nivel = nivelDeXp(idle.jogador.xp);
  const xpNivelAtual = xpDoNivel(nivel);
  const xpNecessario = xpParaProximo(nivel);
  const xpNoNivel = Math.max(0, idle.jogador.xp - xpNivelAtual);
  const xpPct = Math.min(100, Math.round((xpNoNivel / Math.max(1, xpNecessario)) * 100));

  const codex = bonusCodex(idle);
  const banda = sanityBand(idle.jogador.sanidade) || { name: 'Estável' };
  const a = idle.jogador.atributos || { for: 0, vit: 0, men: 0, vin: 0, sor: 0 };

  // Esferas e relíquias compráveis foram removidas dos fluxos ativos e atributos.
  const baseHp = 120 + (nivel - 1) * 18;
  const baseAtk = 22 + (nivel - 1) * 4;
  const baseDef = 10 + (nivel - 1) * 2;
  const attrHp = (a.vit || 0) * 15;
  const attrAtk = (a.for || 0) * 3 + (a.men || 0) * 2;
  const attrDef = (a.vit || 0) * 1;

  const hpMax = Math.round((baseHp + attrHp) * (1 + codex.hpPct / 100));
  const atk = Math.round((baseAtk + attrAtk) * (1 + codex.atkPct / 100));
  const def = Math.round(baseDef + attrDef);
  const capturaExtra = 0;
  const xpMult = 1 + (a.vin || 0) * 0.03;
  const goldMult = 1 + (a.sor || 0) * 0.03;
  const dropOvoExtra = (a.sor || 0) * 0.02;
  const pontosDisponiveis = pontosDomadorDisponiveis(save);

  return {
    nivel,
    xpAtual: idle.jogador.xp,
    xpNoNivel,
    xpNecessario,
    xpPct,
    pontosDisponiveis,
    hpMax,
    atk,
    def,
    sanidade: idle.jogador.sanidade,
    bandaSanidade: banda.name,
    capturaExtra,
    xpMult,
    goldMult,
    dropOvoExtra,
    fontes: [
      { nome: 'HP Máximo', total: hpMax, detalhe: `Base Nv.${nivel} (${baseHp}) + VIT (${attrHp}) + Codex (+${codex.hpPct}%)` },
      { nome: 'Ataque', total: atk, detalhe: `Base Nv.${nivel} (${baseAtk}) + FOR/MEN (${attrAtk}) + Codex (+${codex.atkPct}%)` },
      { nome: 'Defesa', total: def, detalhe: `Base Nv.${nivel} (${baseDef}) + VIT (${attrDef})` },
      { nome: 'Multiplicadores (VIN/SOR)', total: `XP ×${xpMult.toFixed(2)} · Gold ×${goldMult.toFixed(2)}`, detalhe: `VIN (+${Math.round((xpMult - 1) * 100)}% XP) · SOR (+${Math.round((goldMult - 1) * 100)}% Gold, +${Math.round(dropOvoExtra * 100)}% Ovos)` },
      { nome: 'Sanidade', total: `${idle.jogador.sanidade}/100`, detalhe: `Faixa atual: ${banda.name}` },
    ],
  };
}

// ---- Auto-Caça: seleção elemental + avaliação de risco de área ----
export function avaliarRiscoArea(nivelJogador, nivelMedioArea) {
  const diff = nivelMedioArea - nivelJogador;
  if (diff <= -2) return { selo: 'Fácil', cor: '#4ade80', golpes: 18 };
  if (diff <= 2) return { selo: 'Ideal', cor: '#38bdf8', golpes: 10 };
  return { selo: 'Arriscado', cor: '#fb7185', golpes: Math.max(3, 8 - diff) };
}

export function escolherHabilidadeAuto(especieAtacante, especieAlvo, preferirVantagem = true) {
  const habs = HABILIDADES_DA_ESPECIE[especieAtacante] || ['Mordida Umbral', 'Garra de Sombra', 'Chama Violeta', 'Uivo Sinistro'];
  const elAtq = ELEMENTO_DA_ESPECIE[especieAtacante] || 'trevas';
  const elAlvo = ELEMENTO_DA_ESPECIE[especieAlvo] || 'neutro';
  const mult = multElemento(elAtq, elAlvo);
  if (preferirVantagem && mult > 1) {
    return { nome: habs[2] || habs[0], mult, critico: false };
  }
  return { nome: habs[0], mult, critico: false };
}

export const XP_IDLE_CFG = {
  ativoOniricoBase: 12,
  ativoOniricoPorNivel: 4,     // Nv.6 = 36 XP/abate para cada Onírico da formação ativa
  ativoDomadorBase: 4,
  ativoDomadorPorNivel: 1,     // Nv.6 = 10 XP/abate (Domador progride bem mais devagar que antes)
  offlineAbatesPorMinuto: 1.6,
  offlineOniricoBase: 10,
  offlineOniricoPorNivel: 3,   // Nv.6 = 28 XP/abate (448 XP em 10 min para a formação)
  offlineDomadorBase: 3,
  offlineDomadorPorNivel: 0.75, // Nv.6 = 7,5 XP/abate (120 XP em 10 min offline)
};

export function resolverAbateAuto(save, monstro, rng = Math.random, agoraMs = Date.now()) {
  const idle = garantirEstadoIdle(save, agoraMs);
  const st = calcularStatusDetalhado(save);
  const nvMonstro = Math.max(1, Number(monstro?.nivel) || 1);
  const rar = nvMonstro >= 12 ? 3 : nvMonstro >= 8 ? 2 : 1;
  const gold = Math.round((goldEncontro(rar) + Math.floor(nvMonstro * 2.5)) * st.goldMult);
  const xp = Math.max(1, Math.round((XP_IDLE_CFG.ativoDomadorBase + nvMonstro * XP_IDLE_CFG.ativoDomadorPorNivel) * st.xpMult));
  const xpOniricos = Math.max(1, Math.round((XP_IDLE_CFG.ativoOniricoBase + nvMonstro * XP_IDLE_CFG.ativoOniricoPorNivel) * st.xpMult));
  const danoRecebido = Math.max(3, Math.round(nvMonstro * 3.2 - st.def * 0.45));

  save.recompensas.gold += gold;
  save.recompensas.xp += xp;
  const nvAntes = nivelDeXp(idle.jogador.xp); const ganho = { xp: idle.jogador.xp + Math.max(0, xp) }; ganho.nivel = nivelDeXp(ganho.xp); ganho.subiu = ganho.nivel - nvAntes;
  idle.jogador.xp = ganho.xp;
  idle.jogador.hp = Math.max(1, Math.min(st.hpMax, idle.jogador.hp - danoRecebido));
  idle.jogador.abatesTotais += 1;

  const oniricosXp = membrosFormacao(idle).map(({ m, idx, vaga }) => ({
    idx,
    vaga,
    uid: m.uid,
    especie: m.especie,
    ...aplicarXp(m, xpOniricos),
  }));

  ganharXpPasse(idle, 'abate', null, agoraMs);
  registrarCodexEspecie(idle, monstro.especie, { abate: true });
  avancarDiaria(idle, 'abates', 1);

  const capturado = false;
  const fragmentoSonho = sortearDropFragmentoSonho(save, {
    derrotaId: monstro.derrotaId || null,
    especie: monstro.especie,
    elemento: monstro.elementoDrop || monstro.elemento,
    rng,
  });

  let ovoDrop = false;
  if (idle.autoCaca.coletarOvos && rng() < OVOS.fatorDrop && dropsEgg({ rarity: rar }, rng(), st.dropOvoExtra)) {
    ovoDrop = true;
    idle.mochila.ovos.push({ especie: monstro.especie, forma: 'natural', obtidoEm: agoraMs });
    avancarDiaria(idle, 'ovos', 1);
  }

  // Descanso automático (HP abaixo do limiar)
  let descansou = false;
  if ((idle.jogador.hp / st.hpMax) * 100 <= idle.autoCaca.descansarHpPct) {
    idle.jogador.hp = st.hpMax;
    descansou = true;
  }

  return { gold, xp, xpOniricos, oniricosXp, danoRecebido, subiuNivel: ganho.subiu > 0, novoNivel: ganho.nivel, capturado, ovoDrop, descansou, fragmentoSonho };
}

// ---- Recompensa Offline (AFK) ----
export function calcularGanhoOffline(save, nivelArea = 6, agoraMs = Date.now()) {
  const idle = garantirEstadoIdle(save, agoraMs);
  const diffMs = Math.max(0, agoraMs - (idle.ultimoTickMs || agoraMs));
  const minutos = Math.min(720, Math.floor(diffMs / 60000)); // teto 12h
  if (minutos < 1) return null;

  const st = calcularStatusDetalhado(save);
  const codex = bonusCodex(idle);
  const nv = Math.max(1, Number(nivelArea) || 1);
  const abates = Math.max(1, Math.floor(minutos * XP_IDLE_CFG.offlineAbatesPorMinuto));
  const gold = Math.round(abates * (12 + nv * 2.5));
  const xp = Math.max(1, Math.round(abates * (XP_IDLE_CFG.offlineDomadorBase + nv * XP_IDLE_CFG.offlineDomadorPorNivel) * st.xpMult));
  const xpOniricos = Math.max(1, Math.round(abates * (XP_IDLE_CFG.offlineOniricoBase + nv * XP_IDLE_CFG.offlineOniricoPorNivel) * st.xpMult));
  const ovos = Math.floor(abates / OVOS.abatesPorOvoOffline);
  const colheitaDia = Object.values(gatherDay('minerar', 2)).reduce((a, b) => a + b, 0) || 12;
  const colheitaFazenda = save.desbloqueios?.fazenda
    ? Math.max(1, Math.round(colheitaDia * (minutos / 1440) * (1 + codex.fazendaPct / 100)))
    : 0;

  return { minutos, abates, gold, xp, xpOniricos, ovos, colheitaFazenda, xpPasseBruto: xpPasseOffline(abates), desdeMs: idle.ultimoTickMs || agoraMs, ateMs: agoraMs };
}

export function aplicarGanhoOffline(save, resumo, especiePadrao = 'Fanalino', agoraMs = Date.now(), rng = Math.random) {
  if (!resumo) return null;
  const idle = garantirEstadoIdle(save, agoraMs);
  const loteId = `offline:${resumo.desdeMs ?? idle.ultimoTickMs ?? 0}:${resumo.ateMs ?? agoraMs}`;
  if (derrotasPagasDe(save).ids[loteId]) {
    return { jaPago: true, fragmentosSonho: { ok: true, jaPago: true, totalDropado: 0, porElemento: {} } };
  }
  save.recompensas.gold += resumo.gold + resumo.colheitaFazenda * 4;
  save.recompensas.xp += resumo.xp;
  idle.jogador.xp += resumo.xp;
  const xpOniricos = resumo.xpOniricos ?? Math.max(0, Math.round((resumo.xp || 0) * 3.5));
  const oniricosXp = xpOniricos > 0
    ? membrosFormacao(idle).map(({ m, idx, vaga }) => ({
        idx,
        vaga,
        uid: m.uid,
        especie: m.especie,
        ...aplicarXp(m, xpOniricos),
      }))
    : [];
  idle.jogador.abatesTotais += resumo.abates;
  // Idle concede exatamente 1 XP de Passe por Onírico derrotado, respeitando a cota cumulativa da temporada
  const passeRes = ganharXpPasse(idle, 'offline', xpPasseOffline(resumo.abates), agoraMs);
  for (let i = 0; i < resumo.ovos; i++) {
    idle.mochila.ovos.push({ especie: especiePadrao, forma: 'natural', obtidoEm: agoraMs });
  }
  const fragmentosSonho = aplicarDropsOfflineFragmentos(save, { loteId, abates: resumo.abates, especie: especiePadrao, rng });
  avancarDiaria(idle, 'abates', resumo.abates);
  idle.ultimoTickMs = agoraMs;
  return { ...resumo, xpOniricos, oniricosXp, jaPago: false, xpPasseGanho: passeRes.ganho, xpPasseDescartado: passeRes.descartado, fragmentosSonho };
}

// Liquida automaticamente o tempo elegível em segundo plano (minimizado) ou com a página fechada.
export function liquidarPeriodoIdle(save, { nivelArea = 6, especiePadrao = 'Fanalino', agoraMs = Date.now(), minMinutos = 1, rng = Math.random } = {}) {
  const resumo = calcularGanhoOffline(save, nivelArea, agoraMs);
  if (!resumo || resumo.minutos < minMinutos) return null;
  return aplicarGanhoOffline(save, resumo, especiePadrao, agoraMs, rng);
}

// ---- Missões Diárias + Reroll + Passe + Login 7 Dias ----
export function avancarDiaria(idle, tipo, qtd = 1) {
  if (!idle.diarias?.itens) return;
  for (const m of idle.diarias.itens) {
    if (m.tipo === tipo && !m.resgatada) {
      m.progresso = Math.min(m.meta, m.progresso + qtd);
    }
  }
}

export function resgatarDiaria(save, id, agoraMs = Date.now()) {
  const idle = garantirEstadoIdle(save, agoraMs);
  const m = idle.diarias.itens.find((x) => x.id === id);
  if (!m || m.resgatada || m.progresso < m.meta) return null;
  m.resgatada = true;
  save.recompensas.gold += m.gold;
  ganharXpPasse(idle, 'missao', m.xpPasse, agoraMs);
  return m;
}

export function trocarMissaoDiaria(save, id) {
  const idle = garantirEstadoIdle(save);
  if (idle.diarias.rerollsRestantes <= 0) return { ok: false, motivo: 'Sem trocas restantes hoje.' };
  const idx = idle.diarias.itens.findIndex((x) => x.id === id);
  if (idx < 0 || idle.diarias.itens[idx].resgatada) return { ok: false, motivo: 'Missão indisponível para troca.' };
  const atuais = new Set(idle.diarias.itens.map((x) => x.id));
  const cand = POOL_MISSOES_DIARIAS.find((p) => !atuais.has(p.id));
  if (!cand) return { ok: false, motivo: 'Sem missões alternativas.' };
  idle.diarias.itens[idx] = { ...cand, progresso: 0, resgatada: false };
  idle.diarias.rerollsRestantes -= 1;
  return { ok: true, nova: idle.diarias.itens[idx] };
}

export function resgatarLoginDiario(save, agoraMs = Date.now()) {
  const idle = garantirEstadoIdle(save, agoraMs);
  const info = infoLogin7Dias(save, agoraMs);
  if (info.jaColetouHoje || !info.diaDisponivel) return { ok: false, motivo: 'Login de hoje já resgatado!' };
  const item = LOGIN_7D_CATALOGO.find((x) => x.dia === info.diaDisponivel) || LOGIN_7D_CATALOGO[0];
  idle.login = { streak: item.dia, lastDay: info.hoje };
  if (item.tipo === 'diamantes') {
    save.recompensas.diamantes = (save.recompensas.diamantes || 0) + item.qtd;
  } else if (item.tipo === 'tickets') {
    idle.exp = idle.exp || {};
    idle.exp.tickets = (idle.exp.tickets || 0) + item.qtd;
  } else if (item.tipo === 'fragmentos') {
    for (const el of ['trevas', 'fogo', 'agua', 'planta', 'luz']) adicionarFragmentoSonho(save, el, item.qtd);
  } else if (item.tipo === 'pocao') {
    for (let i = 0; i < (item.qtd || 1); i++) darPocao(save, item.id || 'pocao_xp_m');
  } else if (item.tipo === 'ovo') {
    idle.mochila.ovos.push({ especie: item.especie || 'Vaelith', tier: item.tier || 4, forma: 'abencoada', origem: 'login-7d', obtidoEm: agoraMs });
  }
  return {
    ok: true,
    dia: item.dia,
    recompensa: { ...item, esferas: { comum: 0, rara: 0, epica: 0, lendaria: 0, mitica: 0 } },
  };
}

export function resgatarTudoPasse(save, agoraMs = Date.now()) {
  garantirEstadoIdle(save, agoraMs);
  const { nivel, pagos } = resgatarPasse(save, agoraMs);
  const diamantes = pagos.filter((p) => p.tipo === 'diamantes').reduce((a, b) => a + b.qtd, 0);
  return { nivel, pagos, reward: { diamantes, gold: 0, esferas: { comum: 0, rara: 0, epica: 0, lendaria: 0, mitica: 0 } } };
}

// ---- Mochila: esferas e relíquias compráveis removidas dos fluxos ativos ----
export function comprarEsferaIdle() {
  return { ok: false, motivo: 'As esferas de captura foram retiradas: use o Banner de Oníricos.' };
}

export function comprarOuEquiparReliquia() {
  return { ok: false, motivo: 'Relíquias compráveis foram removidas dos fluxos ativos.' };
}

export function chocarPrimeiroOvo(save, rng = Math.random) {
  const idle = garantirEstadoIdle(save);
  if (!idle.mochila.ovos.length) return { ok: false, motivo: 'Nenhum ovo na mochila.' };
  const ovo = idle.mochila.ovos.shift();
  const tier = Math.max(1, Math.min(5, Math.floor(Number(ovo.tier) || 2)));
  const usarPoolPasse = (ovo.tipo === 'ovoT5' || ovo.temporada) && (Array.isArray(ovo.elenco) && ovo.elenco.length > 0 || !ovo.especie);
  const novo = usarPoolPasse
    ? abrirOvoPasse(ovo, rng)
    : {
        especie: ovo.especie,
        nivel: 1,
        xp: 0,
        tier,
        raridade: tier,
        estrelas: estrelasIniciais('ovo'),
        forma: ovo.forma || 'natural',
        ...(ovo.temporada ? { temporada: ovo.temporada } : {}),
        ...(ovo.evento ? { evento: ovo.evento } : {}),
        ...(ovo.origem ? { origem: ovo.origem } : {}),
      };
  idle.equipe.push(novo);
  registrarCodexEspecie(idle, novo.especie, { captura: true });
  avancarDiaria(idle, 'ovos', 1);
  return { ok: true, ovo, onirico: novo };
}

// ---- Vote e Ganhe (TopIdle 12h / IdleRank 24h) ----
export function registrarVotoPortal(save, portal, agoraMs = Date.now()) {
  const idle = garantirEstadoIdle(save, agoraMs);
  const cd = portal === 'topidle' ? 12 * 3600000 : 24 * 3600000;
  const campo = portal === 'topidle' ? 'ultimoTopIdle' : 'ultimoIdleRank';
  if (agoraMs - (idle.votos[campo] || 0) < cd) {
    return { ok: false, motivo: 'Voto em recarga para esta plataforma.' };
  }
  idle.votos[campo] = agoraMs;
  idle.votos.voteCash += 1;
  idle.votos.totalVotos += 1;
  return { ok: true, voteCash: idle.votos.voteCash };
}

export function resgatarLojaVoto(save, item) {
  const idle = garantirEstadoIdle(save);
  if (item === 'esferas') return { ok: false, motivo: 'Esferas de captura foram removidas da loja.' };
  const precos = { diamantes: 2, ovo_evento: 3 };
  const custo = precos[item];
  if (!custo || idle.votos.voteCash < custo) return { ok: false, motivo: 'Vote Cash insuficiente.' };
  idle.votos.voteCash -= custo;
  if (item === 'diamantes') save.recompensas.diamantes += 40;
  if (item === 'ovo_evento') idle.mochila.ovos.push({ especie: 'Solarin', forma: 'abencoada', obtidoEm: Date.now() });
  return { ok: true };
}

function formatarEfeitoEvento(ev, padrao) {
  if (!ev) return padrao;
  if (ev.efeito) return ev.efeito;
  const partes = [];
  const drop = Math.round((ev.bonus?.drop || 0) * 100);
  const exp = Math.round((ev.bonus?.xp || ev.bonus?.captura || 0) * 100);
  if (drop > 0) partes.push(`+${drop}% Drop`);
  if (exp > 0) partes.push(`+${exp}% Bônus`);
  return partes.length ? partes.join(' · ') : padrao;
}

export function resumoEventosAtuais(agoraMs = Date.now()) {
  const ev = activeEvents(agoraMs);
  const r = raidAt(agoraMs);
  const restanteMin = r.aberto ? Math.max(1, Math.ceil((r.inicioMs + 60 * 60000 - agoraMs) / 60000)) : 0;
  const abreEmMin = !r.aberto ? Math.max(1, Math.ceil((r.proximoMs - agoraMs) / 60000)) : 0;
  const semanalBase = ev.semanal || { nome: 'Lua Prateada', efeito: '+10% XP' };
  const mensalBase = ev.mensal || { nome: 'Temporada Atual', efeito: 'Bônus mensal' };
  return {
    semanal: { ...semanalBase, efeito: formatarEfeitoEvento(semanalBase, '+10% Bônus Semanal') },
    mensal: { ...mensalBase, efeito: formatarEfeitoEvento(mensalBase, 'Bônus mensal') },
    raid: { ...r, restanteMin, abreEmMin },
    passMax: PASS_LEVELS,
    loginCiclo: LOGIN_CYCLE.length,
  };
}

export function registrarLogIdle(idle, texto, tipo = 'farm') {
  idle.logs.push({ ts: Date.now(), tipo, texto });
  if (idle.logs.length > 50) idle.logs.shift();
}

export {
  ESPECIES, PASS_LEVELS, passLevel, passRewardFor, passPremiumRewardFor, SPHERE_PRICE, GOLD,
  ganharXpPasse, comprarNivelPasse, infoPasse, premioNivel, trilhaPasse, infoLogin7Dias, LOGIN_7D_CATALOGO,
};
