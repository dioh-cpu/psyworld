// Campanha Mini (modo história no estilo Epic Seven) + contratos compartilhados de Energia e Essências.
// Regras 100% puras (sem DOM). Reaproveita REGIOES, LINHAGENS_REINOS, specChefeReino, ENCONTROS_ALTOS_AMBAR e resumoBatalha.
import { REGIOES, CLASSE_DA_ESPECIE, aplicarXp } from './regiao1-progressao.js';
import { ELEMENTO_DA_ESPECIE } from '../species.js';
import { CATALOGO_REGIOES } from './regiao1-regioes-regras.js';
import { LINHAGENS_REINOS, CHEFES_REINOS, CHEFES_REGIAO, specChefeReino } from './regiao1-kits-reinos.js';
import { ENCONTROS_ALTOS_AMBAR, CHEFES_R2 } from './regiao2-altos-ambar.js';
import { FORMAS_LINHAGENS_REINOS } from '../formas-reinos.js';
import { resolverEncontroCatalogo } from './regiao1-encontros-regras.js';
import { darPocao } from './regiao1-halloween-regras.js';
import { expDe, membrosFormacao } from './regiao1-exp-regras.js';
import * as EstrategiaRegras from './regiao1-estrategia-regras.js';
import {
  ESSENCIAS_PARES,
  parEssenciaDoElemento,
  essenciasDe,
  saldoEssencia,
  adicionarEssencia,
  consumirEssencia,
} from './regiao1-regras-sonho.js';

export {
  ESSENCIAS_PARES,
  parEssenciaDoElemento,
  essenciasDe,
  saldoEssencia,
  adicionarEssencia,
  consumirEssencia,
};

// ---- Energia global dos modos (1 a cada 6 min, máximo 120, poção +60) ----
export const ENERGIA_CFG = {
  max: 120,
  intervaloMs: 6 * 60_000,
  ganhoPocao: 60,
  maxHistoricoBatalhas: 300,
};

export const ENERGIA_TEXTO_EXPLICATIVO = {
  titulo: 'Como funciona a Energia',
  resumo: 'Regenera 1 de Energia a cada 6 minutos (240/dia), com capacidade máxima de 120. Poções recuperam +60.',
  custos: [
    'Campanha Mini: 6 (normal), 8 (elite), 10 (chefe ou escondida)',
    'Torres Elementais: 0 na 1ª vitória de cada andar; 8 no treino diário (3×/dia)',
    'Torres Únicas: 10 por andar (1×/dia)',
    'Calabouços de Relíquias: 8 (Nv.1–4), 12 (Nv.5–9), 16 (Nv.10–13)',
  ],
};

export function energiaDe(save, agoraMs = Date.now()) {
  const idle = save?.idle || (save ? (save.idle = {}) : {});
  const tAgora = Number.isFinite(Number(agoraMs)) ? Math.floor(Number(agoraMs)) : Date.now();
  if (!idle.energia || typeof idle.energia !== 'object') {
    idle.energia = { atual: ENERGIA_CFG.max, max: ENERGIA_CFG.max, pocoes: 0, ultimoTickMs: tAgora };
  }
  const e = idle.energia;
  e.max = Math.max(ENERGIA_CFG.max, Math.floor(Number(e.max) || ENERGIA_CFG.max));
  e.pocoes = Math.max(0, Math.floor(Number(e.pocoes) || 0));
  e.atual = Math.max(0, Math.min(e.max, Number.isFinite(Number(e.atual)) ? Math.floor(Number(e.atual)) : e.max));
  if (!Number.isFinite(Number(e.ultimoTickMs)) || e.ultimoTickMs <= 0) e.ultimoTickMs = tAgora;

  if (e.atual >= e.max) {
    e.ultimoTickMs = tAgora;
  } else if (tAgora > e.ultimoTickMs) {
    const ganho = Math.floor((tAgora - e.ultimoTickMs) / ENERGIA_CFG.intervaloMs);
    if (ganho > 0) {
      e.atual = Math.min(e.max, e.atual + ganho);
      e.ultimoTickMs = e.atual >= e.max ? tAgora : e.ultimoTickMs + ganho * ENERGIA_CFG.intervaloMs;
    }
  }
  return e;
}

export const atualizarEnergia = (save, agoraMs = Date.now()) => energiaDe(save, agoraMs);

export function gastarEnergia(save, custo, agoraMs = Date.now()) {
  const e = energiaDe(save, agoraMs);
  const val = Math.max(0, Math.floor(Number(custo) || 0));
  if (e.atual < val) {
    const falta = val - e.atual;
    const msParaProxima = e.atual >= e.max ? 0 : Math.max(0, ENERGIA_CFG.intervaloMs - (agoraMs - e.ultimoTickMs));
    return { ok: false, motivo: `Energia insuficiente (${e.atual}/${val}).`, falta, atual: e.atual, max: e.max, msParaProxima };
  }
  const estavaCheia = e.atual >= e.max;
  e.atual -= val;
  if (estavaCheia && e.atual < e.max) e.ultimoTickMs = Math.floor(Number(agoraMs) || Date.now());
  return { ok: true, gasto: val, atual: e.atual, max: e.max };
}

export function darPocaoEnergia(save, qtd = 1) {
  const e = energiaDe(save);
  const n = Math.max(0, Math.floor(Number(qtd) || 0));
  e.pocoes += n;
  return e.pocoes;
}

export function usarPocaoEnergia(save, qtd = 1, agoraMs = Date.now(), cfg = ENERGIA_CFG) {
  const e = energiaDe(save, agoraMs);
  const n = Math.max(1, Math.floor(Number(qtd) || 1));
  if (e.pocoes < n) return { ok: false, motivo: 'Sem poção de energia na mochila.' };
  e.pocoes -= n;
  e.atual = Math.min(e.max, e.atual + n * cfg.ganhoPocao);
  if (e.atual >= e.max) e.ultimoTickMs = Math.floor(Number(agoraMs) || Date.now());
  return { ok: true, ganho: n * cfg.ganhoPocao, atual: e.atual, max: e.max, pocoesRestantes: e.pocoes };
}

// ---- Ganchos modulares (preenchidos por regiao1-reliquias-regras.js e regiao1-missoes-regras.js sem ciclos) ----
let _geradorReliquia = null;
let _ganchoMarco = null;
export function registrarGeradorReliquiaCampanha(fn) { _geradorReliquia = typeof fn === 'function' ? fn : null; }
export function registrarGanchoMarcoCampanha(fn) { _ganchoMarco = typeof fn === 'function' ? fn : null; }

const CONJUNTO_POR_PAR = {
  ignea: 'furia',
  mares: 'impeto',
  verde: 'vigor',
  mineral: 'muralha',
  solar: 'precisao',
  sombria: 'sanguessuga',
};

function garantirBolsaReliquiasBasica(save) {
  const idle = save?.idle || (save ? (save.idle = {}) : {});
  if (!idle.reliquias || typeof idle.reliquias !== 'object') {
    idle.reliquias = { bolsa: [], equipadas: {}, predefinicoes: {}, capacidade: 200, poReforco: 0, seq: 0 };
  }
  idle.reliquias.bolsa ||= [];
  idle.reliquias.equipadas ||= {};
  idle.reliquias.predefinicoes ||= {};
  idle.reliquias.capacidade = Math.max(200, Math.floor(Number(idle.reliquias.capacidade) || 200));
  idle.reliquias.poReforco = Math.max(0, Math.floor(Number(idle.reliquias.poReforco) || 0));
  idle.reliquias.seq = Math.max(0, Math.floor(Number(idle.reliquias.seq) || 0));
  return idle.reliquias;
}

export function concederReliquiaCampanha(save, { elemento = 'planta', raridade = 'comum', parte = null, conjunto = null, fonte = 'campanha-mini', rng = Math.random } = {}) {
  if (_geradorReliquia) {
    return _geradorReliquia(save, { elemento, raridade, parte, conjunto, fonte, rng });
  }
  const rel = garantirBolsaReliquiasBasica(save);
  if (rel.bolsa.length >= rel.capacidade) return { ok: false, motivo: 'Bolsa de relíquias cheia.', lotada: true };
  rel.seq += 1;
  const partes = ['coroa', 'amuleto', 'anel', 'talisma'];
  const p = parte || partes[(rel.seq - 1) % partes.length];
  const conj = conjunto || CONJUNTO_POR_PAR[parEssenciaDoElemento(elemento)] || 'cacador';
  const principal = p === 'coroa' ? { attr: 'vida_flat', base: 45, porNivel: 12 }
    : p === 'amuleto' ? { attr: 'ataque_flat', base: 14, porNivel: 4 }
      : p === 'anel' ? { attr: 'ataque_pct', base: 0.04, porNivel: 0.015 }
        : { attr: 'velocidade', base: 4, porNivel: 1.4 };
  const item = {
    id: `rel_${rel.seq}`,
    parte: p,
    conjunto: conj,
    elemento,
    raridade,
    reforco: 0,
    principal,
    secundarios: [],
    trancada: false,
    fonte,
  };
  rel.bolsa.push(item);
  return { ok: true, reliquia: item };
}

// ---- Catálogo da Campanha Mini: 12 capítulos × 10 fases + 1 fase escondida ----
export const CAMPANHA_MINI_CFG = {
  capitulos: 12,
  fasesPorCapitulo: 10,
  energiaPorTipo: { normal: 6, elite: 8, chefe: 10, escondida: 10 },
  ticketsPorCapitulo: 10,
  ticketsSemanaisCada: 3,
  ticketsSemanaisQtd: 10,
  coordenadasPadrao: [
    [10, 74], [20, 62], [30, 70], [40, 50], [49, 36],
    [58, 52], [68, 66], [77, 46], [85, 32], [92, 54],
  ],
  coordenadaEscondida: [62, 20],
};

const CLASSES_CONDICAO = ['guerreiro', 'tanque', 'mago', 'assassino', 'suporte'];
const ROTULO_CLASSE = { guerreiro: 'Guerreiro', tanque: 'Tanque', mago: 'Mago', assassino: 'Assassino', suporte: 'Suporte' };
const ESPECIES_R1_SELVAGENS = ['Fanalino', 'Cervomusgo', 'Cobrabúfalo', 'Tatuveludo', 'Xistolim'];
const ELEMENTOS_R1 = new Set(['inseto', 'planta', 'agua', 'terra', 'pedra']);

function specChefeRegiao(nome, nivel) {
  const c = CHEFES_REGIAO.find((x) => x.nome === nome);
  return c ? [c.nome, nivel, c.elemento, { chefe: true, nome: c.nome, bonus: { ...c.bonus } }] : [nome, nivel, undefined, { chefe: true, nome }];
}

export const ESPECIES_CAPITULO_2 = [...new Set(ENCONTROS_ALTOS_AMBAR.map((e) => e.especie))];

function condicaoTerceiraEstrela(cap, faseNum, elementoRegiao) {
  const semente = cap * 13 + faseNum * 7;
  const tipoIdx = semente % 3;
  if (tipoIdx === 0) {
    const cls = CLASSES_CONDICAO[semente % CLASSES_CONDICAO.length];
    return { tipo: 'classe', valor: cls, minimo: 1, texto: `Levar ao menos 1 ${ROTULO_CLASSE[cls]} na equipe` };
  }
  if (tipoIdx === 1) {
    const elsCap2 = ['fogo', 'eletrico', 'voador', 'aco'];
    const elsNovosReino = [...new Set(LINHAGENS_REINOS.filter((l) => l.reino === cap && !ELEMENTOS_R1.has(l.elemento)).map((l) => l.elemento))];
    const el = cap === 2
      ? elsCap2[faseNum % elsCap2.length]
      : (cap >= 3 && elsNovosReino.length ? elsNovosReino[faseNum % elsNovosReino.length] : elementoRegiao);
    return { tipo: 'elemento', valor: el, minimo: 2, texto: `Levar ao menos 2 Oníricos do elemento ${el}` };
  }
  return { tipo: 'suprema', valor: 1, minimo: 1, texto: 'Usar pelo menos 1 habilidade suprema na batalha' };
}

function nomeFormaDoReino(especie, forma = 1) {
  if (especie === 'Ignavor') {
    return forma === 1 ? 'Brasinha' : forma === 3 ? 'Ignaraz' : 'Ignavor';
  }
  const f = FORMAS_LINHAGENS_REINOS[especie];
  if (!f) return especie;
  return forma === 1 ? f.base : forma === 3 ? f.final : especie;
}

function montarInimigosFase(cap, faseNum, nivel, tipo, elementoRegiao) {
  if (tipo === 'chefe') {
    const chefe = specChefeReino(cap, nivel);
    if (cap === 2) {
      return [
        chefe,
        ['Colmeiro', Math.max(1, nivel - 2), ELEMENTO_DA_ESPECIE.Colmeiro || 'inseto', { forma: 2 }],
        ['Vesprata', Math.max(1, nivel - 2), ELEMENTO_DA_ESPECIE.Vesprata || 'aco', { forma: 2 }],
      ];
    }
    const pool = cap === 1 ? ESPECIES_R1_SELVAGENS : LINHAGENS_REINOS.filter((l) => l.reino === cap).map((l) => l.nome);
    const r1 = pool[0] || 'Fanalino';
    const r2 = pool[1 % pool.length] || r1;
    const formaRef = cap === 1 ? 1 : nivel <= 20 ? 1 : nivel <= 40 ? 2 : 3;
    return [
      chefe,
      [r1, Math.max(1, nivel - 2), ELEMENTO_DA_ESPECIE[r1] || elementoRegiao, { forma: formaRef }],
      [r2, Math.max(1, nivel - 2), ELEMENTO_DA_ESPECIE[r2] || elementoRegiao, { forma: formaRef }],
    ];
  }

  if (cap === 2) {
    // Capítulo 2 usa todas as 18 linhagens selvagens reais de Altos do Âmbar: formas 01 nas fases iniciais e 02 nas finais
    if (faseNum === 3) {
      const ch = CHEFES_R2.BOSS_R2_FERROADA;
      return [
        specChefeRegiao(ch.nome, nivel + 1),
        ...ch.reforcos.map((esp) => [esp, nivel - 1, ELEMENTO_DA_ESPECIE[esp], { forma: 1 }]),
      ];
    }
    if (faseNum === 5) {
      const ch = CHEFES_R2.BOSS_R2_MATRIARCA;
      return [
        specChefeRegiao(ch.nome, nivel + 2),
        ...ch.reforcos.map((esp) => [esp, nivel, ELEMENTO_DA_ESPECIE[esp], { forma: 2 }]),
      ];
    }
    if (faseNum === 8) {
      const ch = CHEFES_R2.BOSS_R2_SENTINELA;
      return [
        specChefeRegiao(ch.nome, nivel + 2),
        ...ch.reforcos.map((esp) => [esp, nivel, ELEMENTO_DA_ESPECIE[esp], { forma: 2 }]),
      ];
    }
    if (tipo === 'escondida') {
      const ch = CHEFES_R2.BOSS_R2_SENTINELA;
      return [
        specChefeRegiao(ch.nome, nivel + 2),
        ['Voltabelha', nivel, ELEMENTO_DA_ESPECIE.Voltabelha, { forma: 2 }],
        ['Latonhorn', nivel, ELEMENTO_DA_ESPECIE.Latonhorn, { forma: 2 }],
      ];
    }
    const idxCap2 = { 1: 0, 2: 3, 4: 6, 6: 9, 7: 12, 9: 15 };
    const offset = idxCap2[faseNum] ?? ((faseNum - 1) * 3);
    const forma = faseNum <= 4 ? 1 : 2;
    const esp1 = ESPECIES_CAPITULO_2[offset % ESPECIES_CAPITULO_2.length];
    const esp2 = ESPECIES_CAPITULO_2[(offset + 1) % ESPECIES_CAPITULO_2.length];
    const esp3 = ESPECIES_CAPITULO_2[(offset + 2) % ESPECIES_CAPITULO_2.length];
    return [esp1, esp2, esp3].map((esp, i) => [
      esp,
      Math.max(21, nivel - (i === 2 ? 1 : 0)),
      ELEMENTO_DA_ESPECIE[esp] || 'inseto',
      { forma },
    ]);
  }

  if (cap === 1) {
    const a = ESPECIES_R1_SELVAGENS[(faseNum - 1) % ESPECIES_R1_SELVAGENS.length];
    const b = ESPECIES_R1_SELVAGENS[faseNum % ESPECIES_R1_SELVAGENS.length];
    const c = ESPECIES_R1_SELVAGENS[(faseNum + 2) % ESPECIES_R1_SELVAGENS.length];
    const forma = faseNum >= 9 ? 2 : 1;
    if (tipo === 'elite' || tipo === 'escondida') {
      return [
        resolverEncontroCatalogo({ especie: a, nivel: nivel + 1, formaCadastrada: forma }, { regiao: 1 }),
        resolverEncontroCatalogo({ especie: b, nivel, formaCadastrada: forma }, { regiao: 1 }),
        resolverEncontroCatalogo({ especie: c, nivel, formaCadastrada: forma }, { regiao: 1 }),
      ].map((x) => [x.especie, x.nivel, x.elemento, { forma: x.forma, ...(tipo === 'elite' ? { elite: true } : {}) }]);
    }
    return [
      [a, nivel, ELEMENTO_DA_ESPECIE[a] || 'planta', { forma }],
      [b, Math.max(1, nivel - 1), ELEMENTO_DA_ESPECIE[b] || 'inseto', { forma }],
    ];
  }

  // Reinos 3–12: prioriza os elementos novos de cada reino antes dos elementos antigos da R1
  const linhagens = LINHAGENS_REINOS
    .filter((l) => l.reino === cap)
    .sort((a, b) => Number(ELEMENTOS_R1.has(a.elemento)) - Number(ELEMENTOS_R1.has(b.elemento)));
  const forma = nivel <= 20 ? 1 : nivel <= 40 ? 2 : 3;
  const pick = (i) => {
    const lin = linhagens[(faseNum + i - 1) % linhagens.length];
    const nome = nomeFormaDoReino(lin.nome, forma);
    return [nome, Math.max(1, nivel - (i === 0 ? 0 : 1)), lin.elemento, { forma, ...(i === 0 && tipo === 'elite' ? { elite: true } : {}) }];
  };
  return tipo === 'elite' || tipo === 'escondida' ? [pick(0), pick(1), pick(2)] : [pick(0), pick(1)];
}

function montarOndasFase(cap, faseNum, nivel, tipo, elementoRegiao) {
  const ondaFinal = montarInimigosFase(cap, faseNum, nivel, tipo, elementoRegiao);
  const totalOndas = !tipo || tipo === 'normal' ? (faseNum <= 3 ? 2 : 3) : 3;
  const poolCap = cap === 1
    ? ESPECIES_R1_SELVAGENS
    : cap === 2
      ? ESPECIES_CAPITULO_2
      : LINHAGENS_REINOS.filter((l) => l.reino === cap).map((l) => l.nome);
  const formaBase = cap === 1 ? (faseNum >= 9 ? 2 : 1) : (nivel <= 20 ? 1 : nivel <= 40 ? 2 : 3);
  const criarMob = (offset, deltaNv) => {
    const raw = poolCap[(faseNum * 3 + offset) % poolCap.length] || 'Fanalino';
    const nome = cap >= 3 ? nomeFormaDoReino(raw, formaBase) : raw;
    const el = ELEMENTO_DA_ESPECIE[nome] || ELEMENTO_DA_ESPECIE[raw] || elementoRegiao;
    return [nome, Math.max(1, nivel - deltaNv), el, { forma: formaBase }];
  };
  const onda1 = [criarMob(0, 2), criarMob(1, 2)];
  if (totalOndas === 2) return [onda1, ondaFinal];
  const onda2 = [criarMob(2, 1), criarMob(3, 1), criarMob(4, 2)];
  return [onda1, onda2, ondaFinal];
}

export const CAPITULOS_CAMPANHA_MINI = REGIOES.map((faixa, idx) => {
  const cap = idx + 1;
  const regInfo = CATALOGO_REGIOES[idx];
  const chefeReino = CHEFES_REINOS.find((c) => c.reino === cap);
  const elemento = cap === 1 ? (regInfo?.chefe?.elemento || 'planta') : (chefeReino?.elemento || regInfo?.chefe?.elemento || 'neutro');
  const [nvMin, nvMax] = faixa;
  const fases = [];
  for (let num = 1; num <= 10; num++) {
    const tipo = num === 5 ? 'elite' : num === 10 ? 'chefe' : 'normal';
    const nivel = Math.round(nvMin + ((nvMax - nvMin) * (num - 1)) / 9);
    const id = `${cap}-${num}`;
    const [x, y] = CAMPANHA_MINI_CFG.coordenadasPadrao[num - 1];
    const nomeEspecialCap2 = cap === 2
      ? (num === 3 ? '2-3 · Ferroada Rubra' : num === 5 ? '2-5 · Matriarca de Resina' : num === 8 ? '2-8 · Sentinela de Geoda' : num === 10 ? '2-10 · Rainha da Colmeia Dourada' : null)
      : null;
    const ondas = montarOndasFase(cap, num, nivel, tipo, elemento);
    fases.push({
      id,
      capitulo: cap,
      numero: num,
      escondida: false,
      tipo,
      nome: nomeEspecialCap2 || (tipo === 'chefe' ? `${id} · ${regInfo.chefe.nome}` : tipo === 'elite' ? `${id} · Guardião de Elite` : `${id} · ${regInfo.nome}`),
      nivel,
      energia: CAMPANHA_MINI_CFG.energiaPorTipo[tipo],
      coord: [x, y],
      ondas,
      inimigos: ondas[ondas.length - 1],
      condicaoEstrela3: condicaoTerceiraEstrela(cap, num, elemento),
    });
  }
  const nivelEsc = nvMax + 3;
  const ondasEsc = montarOndasFase(cap, 11, nivelEsc, 'escondida', elemento);
  const escondida = {
    id: `${cap}-escondida`,
    capitulo: cap,
    numero: 11,
    escondida: true,
    tipo: 'escondida',
    nome: `${cap}-X · Clareira Secreta de ${regInfo.nome}`,
    nivel: nivelEsc,
    energia: CAMPANHA_MINI_CFG.energiaPorTipo.escondida,
    coord: [...CAMPANHA_MINI_CFG.coordenadaEscondida],
    requisitoEstrelas: 30,
    ondas: ondasEsc,
    inimigos: ondasEsc[ondasEsc.length - 1],
    condicaoEstrela3: condicaoTerceiraEstrela(cap, 11, elemento),
    reliquiaGarantida: 'rara',
  };
  const capStr = String(cap).padStart(2, '0');
  return {
    capitulo: cap,
    id: `cap-${capStr}`,
    nome: regInfo?.nome || `Capítulo ${cap}`,
    elemento,
    parEssencia: parEssenciaDoElemento(elemento),
    faixaNivel: [...faixa],
    capa: `assets/confusion/interface/campanha-mini/cap-${capStr}.webp`,
    mapaArte: `assets/confusion/interface/campanha-mini/mapa-${capStr}.webp`,
    fases,
    faseEscondida: escondida,
  };
});

export const FASES_CAMPANHA_POR_ID = Object.fromEntries(
  CAPITULOS_CAMPANHA_MINI.flatMap((c) => [...c.fases, c.faseEscondida]).map((f) => [f.id, f]),
);

// ---- Estado no save ----
export function campanhaMiniDe(save) {
  const idle = save?.idle || (save ? (save.idle = {}) : {});
  if (!idle.campanhaMini || typeof idle.campanhaMini !== 'object') {
    idle.campanhaMini = {};
  }
  const cm = idle.campanhaMini;
  cm.fases ||= {};
  cm.primeiraVitoriaPagas ||= {};
  cm.bausFasePagos ||= {};
  cm.bausCapituloPagos ||= {};
  cm.capitulosConcluidos ||= {};
  cm.semanaisPagos ||= {};
  cm.batalhasPagas ||= {};
  return cm;
}

export function estrelasDoCapitulo(save, capitulo) {
  const cap = CAPITULOS_CAMPANHA_MINI[capitulo - 1];
  if (!cap) return 0;
  const cm = campanhaMiniDe(save);
  return cap.fases.reduce((acc, f) => acc + Math.max(0, Math.min(3, Number(cm.fases[f.id]?.estrelas) || 0)), 0);
}

export function faseDesbloqueada(save, faseId) {
  const f = FASES_CAMPANHA_POR_ID[faseId];
  if (!f) return false;
  const cm = campanhaMiniDe(save);
  if (f.escondida) return estrelasDoCapitulo(save, f.capitulo) >= 30;
  if (f.capitulo === 1 && f.numero === 1) return true;
  if (f.numero === 1) return Boolean(cm.fases[`${f.capitulo - 1}-10`]?.vencida);
  return Boolean(cm.fases[`${f.capitulo}-${f.numero - 1}`]?.vencida);
}

export function statusCapitulo(save, capitulo) {
  const cap = CAPITULOS_CAMPANHA_MINI[capitulo - 1];
  if (!cap) return null;
  const cm = campanhaMiniDe(save);
  const estrelas = estrelasDoCapitulo(save, capitulo);
  const desbloqueado = capitulo === 1 || Boolean(cm.fases[`${capitulo - 1}-10`]?.vencida);
  const concluido = Boolean(cm.capitulosConcluidos[capitulo]);
  const escondidaAberta = estrelas >= 30;
  const baus = [10, 20, 30].map((marco) => ({
    marco,
    atingido: estrelas >= marco,
    coletado: Boolean(cm.bausCapituloPagos[`${capitulo}:${marco}`]),
  }));
  return {
    ...cap,
    desbloqueado,
    concluido,
    estrelas,
    estrelasMax: 30,
    escondidaAberta,
    baus,
    fasesStatus: cap.fases.map((f) => ({
      ...f,
      desbloqueada: faseDesbloqueada(save, f.id),
      vencida: Boolean(cm.fases[f.id]?.vencida),
      estrelas: Number(cm.fases[f.id]?.estrelas) || 0,
      bauColetado: Boolean(cm.bausFasePagos[f.id]),
    })),
    escondidaStatus: {
      ...cap.faseEscondida,
      desbloqueada: escondidaAberta,
      vencida: Boolean(cm.fases[cap.faseEscondida.id]?.vencida),
      estrelas: Number(cm.fases[cap.faseEscondida.id]?.estrelas) || 0,
    },
  };
}

// ---- Avaliação de 3 estrelas usando resumoBatalha(b) ----
function normalizarResumo(batalhaOuResumo) {
  if (!batalhaOuResumo || typeof batalhaOuResumo !== 'object') {
    return { venceu: false, todosVivos: false, classes: {}, elementos: {}, supremasUsadas: 0 };
  }
  if ('venceu' in batalhaOuResumo && 'classes' in batalhaOuResumo && 'elementos' in batalhaOuResumo) {
    return batalhaOuResumo;
  }
  if (typeof EstrategiaRegras.resumoBatalha === 'function' && Array.isArray(batalhaOuResumo.aliados)) {
    return EstrategiaRegras.resumoBatalha(batalhaOuResumo);
  }
  const time = Array.isArray(batalhaOuResumo.aliados) ? batalhaOuResumo.aliados : [];
  const conta = (campo, fnFallback) => time.reduce((m, u) => {
    const k = u?.[campo] || (fnFallback ? fnFallback(u) : 'neutro');
    m[k] = (m[k] || 0) + 1;
    return m;
  }, {});
  const vivos = time.filter((u) => (u?.hp ?? 0) > 0).length;
  return {
    venceu: batalhaOuResumo.fim === 'vitoria',
    todosVivos: batalhaOuResumo.fim === 'vitoria' && vivos === time.length,
    classes: conta('classe', (u) => CLASSE_DA_ESPECIE[u?.especie] || 'guerreiro'),
    elementos: conta('elemento', (u) => ELEMENTO_DA_ESPECIE[u?.especie] || 'neutro'),
    supremasUsadas: batalhaOuResumo.supremas?.a || batalhaOuResumo.supremasUsadas || 0,
  };
}

export function avaliarEstrelasFase(faseOuId, batalhaOuResumo) {
  const fase = typeof faseOuId === 'string' ? FASES_CAMPANHA_POR_ID[faseOuId] : faseOuId;
  if (!fase) return { total: 0, estrela1: false, estrela2: false, estrela3: false };
  const r = normalizarResumo(batalhaOuResumo);
  if (!r.venceu) return { total: 0, estrela1: false, estrela2: false, estrela3: false, resumo: r };
  const e1 = true;
  const e2 = Boolean(r.todosVivos);
  const c = fase.condicaoEstrela3;
  let e3 = false;
  if (c.tipo === 'classe') e3 = (r.classes?.[c.valor] || 0) >= (c.minimo || 1);
  else if (c.tipo === 'elemento') e3 = (r.elementos?.[c.valor] || 0) >= (c.minimo || 2);
  else if (c.tipo === 'suprema') e3 = (r.supremasUsadas || 0) >= (c.minimo || 1);
  return {
    total: 1 + (e2 ? 1 : 0) + (e3 ? 1 : 0),
    estrela1: e1,
    estrela2: e2,
    estrela3: e3,
    resumo: r,
  };
}

// ---- Execução da fase, recompensas únicas e Batalha Rápida ----
export function iniciarFaseCampanhaMini(save, faseId, { agoraMs = Date.now(), batalhaId = null } = {}) {
  const fase = FASES_CAMPANHA_POR_ID[faseId];
  if (!fase) return { ok: false, motivo: 'Fase não encontrada.' };
  if (!faseDesbloqueada(save, faseId)) return { ok: false, motivo: 'Fase bloqueada.' };
  const g = gastarEnergia(save, fase.energia, agoraMs);
  if (!g.ok) return g;
  const id = batalhaId || `cm_${fase.id}_${agoraMs}`;
  return { ok: true, batalhaId: id, fase, energiaRestante: g.atual };
}

function creditarXpFormacao(save, xp) {
  const idle = save?.idle;
  if (!idle || xp <= 0) return;
  for (const { m } of membrosFormacao(idle)) aplicarXp(m, xp);
}

function marcarBatalhaPaga(cm, batalhaId) {
  if (!batalhaId) return;
  cm.batalhasPagas[batalhaId] = true;
  const keys = Object.keys(cm.batalhasPagas);
  if (keys.length > ENERGIA_CFG.maxHistoricoBatalhas) {
    for (const k of keys.slice(0, keys.length - ENERGIA_CFG.maxHistoricoBatalhas)) delete cm.batalhasPagas[k];
  }
}

export function concluirFaseCampanhaMini(save, faseId, batalhaOuResumo, { batalhaId = null, agoraMs = Date.now(), rng = Math.random } = {}) {
  const fase = FASES_CAMPANHA_POR_ID[faseId];
  if (!fase) return { ok: false, motivo: 'Fase não encontrada.' };
  if (!faseDesbloqueada(save, faseId)) return { ok: false, motivo: 'Fase bloqueada.' };
  const cm = campanhaMiniDe(save);
  if (batalhaId && cm.batalhasPagas[batalhaId]) {
    return { ok: true, jaPago: true, venceu: false, estrelas: 0, premios: {} };
  }

  const aval = avaliarEstrelasFase(fase, batalhaOuResumo);
  if (!aval.estrela1) {
    if (batalhaId) marcarBatalhaPaga(cm, batalhaId);
    return { ok: true, jaPago: false, venceu: false, estrelas: 0, detalhesEstrelas: aval, premios: {} };
  }

  const cap = CAPITULOS_CAMPANHA_MINI[fase.capitulo - 1];
  const prev = cm.fases[fase.id] || { vencida: false, estrelas: 0, concluidas: 0 };
  const estAntes = prev.estrelas || 0;
  prev.vencida = true;
  prev.estrelas = Math.max(estAntes, aval.total);
  prev.concluidas = (prev.concluidas || 0) + 1;
  cm.fases[fase.id] = prev;

  save.recompensas = save.recompensas || { gold: 0, diamantes: 0, xp: 0 };
  const premios = { ouro: 0, diamantes: 0, xpFormacao: 0, pocoes: {}, essencias: {}, reliquias: [], ticketsPermanentes: 0, ticketsSemanais: 0 };

  const fatorOndasXp = (fase.ondas?.length || 2) >= 3 ? 1.35 : 1.15;
  const fatorOndasOuro = (fase.ondas?.length || 2) >= 3 ? 1.15 : 1;

  if (!cm.primeiraVitoriaPagas[fase.id]) {
    cm.primeiraVitoriaPagas[fase.id] = true;
    if (fase.tipo === 'normal') {
      premios.ouro = Math.round(200 * fase.capitulo * fatorOndasOuro);
      premios.diamantes = 10;
      premios.pocoes.pocao_xp_p = 1;
    } else if (fase.tipo === 'elite') {
      premios.ouro = Math.round(400 * fase.capitulo * fatorOndasOuro);
      premios.diamantes = 20;
      premios.pocoes.pocao_xp_p = 2;
      const r = concederReliquiaCampanha(save, { elemento: cap.elemento, raridade: 'comum', fonte: `cm:${fase.id}`, rng });
      if (r.ok) premios.reliquias.push(r.reliquia);
    } else if (fase.tipo === 'chefe') {
      premios.ouro = Math.round(600 * fase.capitulo * fatorOndasOuro);
      premios.diamantes = 30;
      premios.pocoes.pocao_xp_m = 1;
      premios.essencias = { par: cap.parEssencia, menor: 5, media: 2 };
    } else if (fase.tipo === 'escondida') {
      premios.ouro = Math.round(600 * fase.capitulo * fatorOndasOuro);
      premios.diamantes = 30;
      premios.pocoes.pocao_xp_m = 1;
      const r = concederReliquiaCampanha(save, { elemento: cap.elemento, raridade: 'rara', fonte: `cm:${fase.id}`, rng });
      if (r.ok) premios.reliquias.push(r.reliquia);
    }
    premios.xpFormacao = Math.round((60 + fase.nivel * 8) * fatorOndasXp);
  } else {
    // Repetição manual da fase dá recompensa base reduzida (sem repetir prêmios únicos)
    premios.ouro = Math.round(100 * fase.capitulo * fatorOndasOuro);
    premios.xpFormacao = Math.round((30 + fase.nivel * 4) * fatorOndasXp);
  }

  // Conclusão de capítulo (vencer fase 10 pela 1ª vez): 10 tickets permanentes + 10 semanais a cada 3 capítulos
  if (fase.tipo === 'chefe' && !cm.capitulosConcluidos[fase.capitulo]) {
    cm.capitulosConcluidos[fase.capitulo] = true;
    const e = expDe(save);
    e.tickets = (e.tickets || 0) + CAMPANHA_MINI_CFG.ticketsPorCapitulo;
    premios.ticketsPermanentes += CAMPANHA_MINI_CFG.ticketsPorCapitulo;
    if (fase.capitulo % CAMPANHA_MINI_CFG.ticketsSemanaisCada === 0 && !cm.semanaisPagos[fase.capitulo]) {
      cm.semanaisPagos[fase.capitulo] = true;
      e.ticketsSemanais = (e.ticketsSemanais || 0) + CAMPANHA_MINI_CFG.ticketsSemanaisQtd;
      premios.ticketsSemanais += CAMPANHA_MINI_CFG.ticketsSemanaisQtd;
    }
  }

  save.recompensas.gold += premios.ouro;
  save.recompensas.diamantes += premios.diamantes;
  creditarXpFormacao(save, premios.xpFormacao);
  for (const [pocId, q] of Object.entries(premios.pocoes)) darPocao(save, pocId, q);
  if (premios.essencias.menor) adicionarEssencia(save, cap.parEssencia, 'menor', premios.essencias.menor);
  if (premios.essencias.media) adicionarEssencia(save, cap.parEssencia, 'media', premios.essencias.media);

  if (batalhaId) marcarBatalhaPaga(cm, batalhaId);

  const estrelasCap = estrelasDoCapitulo(save, fase.capitulo);
  if (_ganchoMarco) {
    _ganchoMarco(save, 'campanha_fase', { faseId: fase.id, capitulo: fase.capitulo, numero: fase.numero, tipo: fase.tipo, estrelas: prev.estrelas, estrelasCapitulo: estrelasCap, concluidoCapitulo: Boolean(cm.capitulosConcluidos[fase.capitulo]) });
  }

  return {
    ok: true,
    jaPago: false,
    venceu: true,
    estrelas: aval.total,
    estrelasMaximasFase: prev.estrelas,
    estrelasCapitulo: estrelasCap,
    capituloConcluido: Boolean(cm.capitulosConcluidos[fase.capitulo]),
    detalhesEstrelas: aval,
    premios,
    agoraMs,
  };
}

export function batalhaRapidaCampanhaMini(save, faseId, { agoraMs = Date.now(), rng = Math.random } = {}) {
  const fase = FASES_CAMPANHA_POR_ID[faseId];
  if (!fase) return { ok: false, motivo: 'Fase não encontrada.' };
  const cm = campanhaMiniDe(save);
  if ((cm.fases[faseId]?.estrelas || 0) < 3) {
    return { ok: false, motivo: 'Batalha rápida exige 3★ nesta fase.' };
  }
  const g = gastarEnergia(save, fase.energia, agoraMs);
  if (!g.ok) return g;

  const cap = CAPITULOS_CAMPANHA_MINI[fase.capitulo - 1];
  const baseOuro = fase.tipo === 'elite' ? 400 * fase.capitulo : 200 * fase.capitulo;
  const ouro = Math.round(baseOuro * 0.5);
  const xpFormacao = Math.round((60 + fase.nivel * 8) * 0.5);
  const dropouEssencia = rng() < 0.15;
  save.recompensas = save.recompensas || { gold: 0, diamantes: 0, xp: 0 };
  save.recompensas.gold += ouro;
  creditarXpFormacao(save, xpFormacao);
  if (dropouEssencia) adicionarEssencia(save, cap.parEssencia, 'menor', 1);

  return {
    ok: true,
    rapida: true,
    energiaRestante: g.atual,
    premios: { ouro, xpFormacao, essencia: dropouEssencia ? { par: cap.parEssencia, tamanho: 'menor', qtd: 1 } : null },
  };
}

export function coletarBauFase(save, faseId) {
  const fase = FASES_CAMPANHA_POR_ID[faseId];
  if (!fase) return { ok: false, motivo: 'Fase não encontrada.' };
  const cm = campanhaMiniDe(save);
  if ((cm.fases[faseId]?.estrelas || 0) < 3) return { ok: false, motivo: 'Precisa de 3★ nesta fase.' };
  if (cm.bausFasePagos[faseId]) return { ok: false, jaColetado: true, motivo: 'Baú da fase já coletado.' };

  const cap = CAPITULOS_CAMPANHA_MINI[fase.capitulo - 1];
  const tam = fase.capitulo <= 4 ? 'menor' : fase.capitulo <= 8 ? 'media' : 'maior';
  cm.bausFasePagos[faseId] = true;
  save.recompensas = save.recompensas || { gold: 0, diamantes: 0, xp: 0 };
  save.recompensas.diamantes += 20;
  adicionarEssencia(save, cap.parEssencia, tam, 1);
  return { ok: true, faseId, premios: { diamantes: 20, essencia: { par: cap.parEssencia, tamanho: tam, qtd: 1 } } };
}

export function coletarBauCapitulo(save, capitulo, marco, rng = Math.random) {
  const cap = CAPITULOS_CAMPANHA_MINI[capitulo - 1];
  if (!cap) return { ok: false, motivo: 'Capítulo inválido.' };
  if (![10, 20, 30].includes(marco)) return { ok: false, motivo: 'Marco de baú inválido (10, 20 ou 30).' };
  const estrelas = estrelasDoCapitulo(save, capitulo);
  if (estrelas < marco) return { ok: false, motivo: `Faltam estrelas (${estrelas}/${marco}★).` };
  const cm = campanhaMiniDe(save);
  const chave = `${capitulo}:${marco}`;
  if (cm.bausCapituloPagos[chave]) return { ok: false, jaColetado: true, motivo: 'Baú do capítulo já coletado.' };

  cm.bausCapituloPagos[chave] = true;
  save.recompensas = save.recompensas || { gold: 0, diamantes: 0, xp: 0 };
  const premios = {};
  if (marco === 10) {
    save.recompensas.diamantes += 50;
    premios.diamantes = 50;
  } else if (marco === 20) {
    darPocao(save, 'pocao_xp_g', 1);
    premios.pocao_xp_g = 1;
  } else if (marco === 30) {
    const r = concederReliquiaCampanha(save, { elemento: cap.elemento, raridade: 'rara', fonte: `cm:bau30:${capitulo}`, rng });
    premios.reliquia = r.reliquia || null;
  }
  return { ok: true, capitulo, marco, premios };
}
