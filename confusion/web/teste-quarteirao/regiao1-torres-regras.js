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
  energiaTreinoDiario: 8,
  maxAndaresUnica: 30,
  energiaTorreUnica: 10,
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

function energiaDoAndarElemental(andar) {
  if (andar <= 15) return 6;
  if (andar <= 35) return 8;
  return 10;
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
  { id: 'aurora', nome: 'Torre da Aurora', elementos: ['luz', 'neutro'], parEssencia: 'solar', guardiao: 'Guardião da Aurora' },
  { id: 'umbra', nome: 'Torre da Umbra', elementos: ['trevas', 'fantasma'], parEssencia: 'sombria', guardiao: 'Guardião da Umbra' },
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
  const forma = nivel <= 20 ? 1 : nivel <= 40 ? 2 : 3;
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

const DEF_UNICAS = [
  {
    id: 'ascensao',
    nome: 'Torre da Ascensão',
    desc: 'Focada em linhagens iniciais, fogo, luz, planta, água e vento.',
    elementos: ['fogo', 'eletrico', 'agua', 'voador', 'planta', 'luz'],
  },
  {
    id: 'abismo',
    nome: 'Torre do Abismo',
    desc: 'Focada em linhagens sombrias, espectrais, aço, terra e pedra.',
    elementos: ['trevas', 'fantasma', 'aco', 'terra', 'pedra', 'inseto'],
  },
  {
    id: 'eclipse',
    nome: 'Torre do Eclipse',
    desc: 'Todas as linhagens clássicas e dos reinos em rotação mista.',
    elementos: ['fogo', 'agua', 'planta', 'luz', 'trevas', 'eletrico', 'aco', 'fantasma', 'pedra', 'terra', 'voador', 'inseto', 'neutro'],
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
  t.batalhasPagas ||= {};
  return t;
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

  const venceu = Boolean(resultado?.venceu || resultado?.fim === 'vitoria');
  if (!venceu) {
    if (batalhaId) marcarBatalhaTorrePaga(t, batalhaId);
    return { ok: true, jaPago: false, venceu: false, premios: {} };
  }

  const est = (t.elementais[torreId] ||= { maiorAndar: 0, pagas: {} });
  est.maiorAndar = Math.max(est.maiorAndar || 0, andar);
  est.pagas ||= {};
  const chave = String(andar);
  const premios = { ouro: 0, diamantes: 0, essencia: null };
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
  } else {
    premios.ouro = 100;
    save.recompensas.gold += 100;
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

  const venceu = Boolean(resultado?.venceu || resultado?.fim === 'vitoria');
  if (!venceu) {
    if (batalhaId) marcarBatalhaTorrePaga(t, batalhaId);
    return { ok: true, jaPago: false, venceu: false, premios: {} };
  }

  const dia = Math.floor(agoraMs / TORRES_CFG.diaMs);
  t.unicas[torreId] = { maiorAndar: Math.max(Number(t.unicas[torreId]?.maiorAndar) || 0, andar) };
  (t.unicasDiarias[torreId] ||= {})[String(andar)] = dia;

  const pool = torre.poolLinhagens;
  const linhagemSorteada = pool[Math.floor(rng() * pool.length) % pool.length] || pool[0];
  const armas = armasUnicasState(save);
  const possui = jogadorPossuiLinhagem(save, linhagemSorteada);
  const premios = { linhagemSorteada, virouPoUnico: !possui, fragmentos: 0, poUnico: 0 };

  if (possui) {
    armas.fragmentos[linhagemSorteada] = (armas.fragmentos[linhagemSorteada] || 0) + 1;
    premios.fragmentos = 1;
  } else {
    armas.poUnico += 1;
    premios.poUnico = 1;
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
