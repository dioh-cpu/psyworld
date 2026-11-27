// Missões diárias e semanais voltadas aos modos novos (Campanha Mini, Torres, Calabouços, Relíquias, Domadores).
// Regras 100% puras (sem DOM), reset automático por dia/semana, coleta única e metas alinhadas a ECONOMIA_DIARIA.md.
import { darPocaoEnergia } from './regiao1-campanha-mini-regras.js';
import { adicionarEssencia } from './regiao1-regras-sonho.js';
import { darPocao } from './regiao1-halloween-regras.js';
import { expDe } from './regiao1-exp-regras.js';
import { ganharXpPasse } from './regiao1-passe-regras.js';

export const ROTACAO_MISSOES_CFG = {
  diaMs: 86_400_000,
  semanaMs: 7 * 86_400_000,
};

export const CATALOGO_DIARIAS_MODOS = [
  { id: 'dm_cm_2', tipo: 'campanha_mini', titulo: 'Conclua 2 fases da Campanha Mini', meta: 2, premio: { diamantes: 15, ouro: 200, xpPasse: 150 } },
  { id: 'dm_torre_1', tipo: 'torre', titulo: 'Vença 1 andar em qualquer Torre', meta: 1, premio: { diamantes: 10, ouro: 150, xpPasse: 150 } },
  { id: 'dm_calabouco_2', tipo: 'calabouco', titulo: 'Conclua 2 vezes qualquer Calabouço', meta: 2, premio: { diamantes: 15, ouro: 250, poReforco: 5, xpPasse: 150 } },
  { id: 'dm_reliquia_1', tipo: 'reliquia', titulo: 'Reforce ou equipe 1 relíquia', meta: 1, premio: { diamantes: 10, ouro: 150, poReforco: 5, xpPasse: 100 } },
  { id: 'dm_domador_1', tipo: 'domador', titulo: 'Treine ou use o Domador auxiliar em 1 batalha', meta: 1, premio: { diamantes: 10, ouro: 200, xpPasse: 100 } },
];

export const BAU_DIARIO_MODOS = {
  metaColetas: 5,
  premio: { diamantes: 15, pocao_xp_p: 1, pocao_energia: 1 },
};

export const CATALOGO_SEMANAIS_MODOS = [
  { id: 'sm_cm_10', tipo: 'campanha_mini', titulo: 'Conclua 10 fases da Campanha Mini na semana', meta: 10, premio: { diamantes: 50, ticketsPermanentes: 1 } },
  { id: 'sm_torres_7', tipo: 'torre', titulo: 'Vença 7 andares de Torre na semana', meta: 7, premio: { diamantes: 50, essencia: { par: 'ignea', tamanho: 'media', qtd: 3 } } },
  { id: 'sm_calaboucos_12', tipo: 'calabouco', titulo: 'Conclua 12 calabouços na semana', meta: 12, premio: { diamantes: 60, poReforco: 25 } },
  { id: 'sm_reliquia_5', tipo: 'reliquia', titulo: 'Reforce 5 vezes relíquias na semana', meta: 5, premio: { diamantes: 40, ticketsPermanentes: 1 } },
  { id: 'sm_domador_5', tipo: 'domador', titulo: 'Atue com Domador auxiliar 5 vezes na semana', meta: 5, premio: { diamantes: 50, ticketsSemanais: 1 } },
];

export const BAU_SEMANAL_MODOS = {
  metaColetas: 5,
  premio: { diamantes: 100, ticketsSemanais: 1, pocao_energia: 1 },
};

export const DIARIAS_POR_ID = Object.fromEntries(CATALOGO_DIARIAS_MODOS.map((m) => [m.id, m]));
export const SEMANAIS_POR_ID = Object.fromEntries(CATALOGO_SEMANAIS_MODOS.map((m) => [m.id, m]));

export function rotacaoMissoesDe(save, agoraMs = Date.now()) {
  const idle = save?.idle || (save ? (save.idle = {}) : {});
  const t = Number.isFinite(Number(agoraMs)) ? Math.floor(Number(agoraMs)) : Date.now();
  const dia = Math.floor(t / ROTACAO_MISSOES_CFG.diaMs);
  const semana = Math.floor(t / ROTACAO_MISSOES_CFG.semanaMs);

  if (!idle.missoesRotacao || typeof idle.missoesRotacao !== 'object' || Array.isArray(idle.missoesRotacao)) {
    idle.missoesRotacao = {};
  }
  const r = idle.missoesRotacao;
  if (!r.diaria || typeof r.diaria !== 'object' || Number(r.diaria.dia) !== dia) {
    r.diaria = { dia, progresso: {}, coletadas: {}, bauColetado: false };
  }
  r.diaria.progresso ||= {};
  r.diaria.coletadas ||= {};
  r.diaria.bauColetado = Boolean(r.diaria.bauColetado);

  if (!r.semanal || typeof r.semanal !== 'object' || Number(r.semanal.semana) !== semana) {
    r.semanal = { semana, progresso: {}, coletadas: {}, bauColetado: false };
  }
  r.semanal.progresso ||= {};
  r.semanal.coletadas ||= {};
  r.semanal.bauColetado = Boolean(r.semanal.bauColetado);

  return r;
}

export function registrarProgressoRotacao(save, tipo, qtd = 1, agoraMs = Date.now()) {
  const r = rotacaoMissoesDe(save, agoraMs);
  const inc = Math.max(1, Math.floor(Number(qtd) || 1));

  for (const m of CATALOGO_DIARIAS_MODOS) {
    if (m.tipo === tipo) {
      r.diaria.progresso[m.id] = Math.min(m.meta, (Number(r.diaria.progresso[m.id]) || 0) + inc);
    }
  }
  for (const m of CATALOGO_SEMANAIS_MODOS) {
    if (m.tipo === tipo) {
      r.semanal.progresso[m.id] = Math.min(m.meta, (Number(r.semanal.progresso[m.id]) || 0) + inc);
    }
  }
  return r;
}

export function listarDiariasModos(save, agoraMs = Date.now()) {
  const r = rotacaoMissoesDe(save, agoraMs).diaria;
  const itens = CATALOGO_DIARIAS_MODOS.map((m) => {
    const progresso = Math.min(m.meta, Number(r.progresso[m.id]) || 0);
    const coletada = Boolean(r.coletadas[m.id]);
    return { ...m, progresso, coletada, pronta: !coletada && progresso >= m.meta };
  });
  const coletadasCount = itens.filter((x) => x.coletada).length;
  return {
    dia: r.dia,
    itens,
    bau: {
      ...BAU_DIARIO_MODOS,
      atual: coletadasCount,
      coletado: r.bauColetado,
      pronto: !r.bauColetado && coletadasCount >= BAU_DIARIO_MODOS.metaColetas,
    },
  };
}

export function listarSemanaisModos(save, agoraMs = Date.now()) {
  const r = rotacaoMissoesDe(save, agoraMs).semanal;
  const itens = CATALOGO_SEMANAIS_MODOS.map((m) => {
    const progresso = Math.min(m.meta, Number(r.progresso[m.id]) || 0);
    const coletada = Boolean(r.coletadas[m.id]);
    return { ...m, progresso, coletada, pronta: !coletada && progresso >= m.meta };
  });
  const coletadasCount = itens.filter((x) => x.coletada).length;
  return {
    semana: r.semana,
    itens,
    bau: {
      ...BAU_SEMANAL_MODOS,
      atual: coletadasCount,
      coletado: r.bauColetado,
      pronto: !r.bauColetado && coletadasCount >= BAU_SEMANAL_MODOS.metaColetas,
    },
  };
}

function pagarPremioRotacao(save, pr, agoraMs) {
  const entregue = {};
  save.recompensas = save.recompensas || { gold: 0, diamantes: 0, xp: 0 };
  if (pr.diamantes) { save.recompensas.diamantes += pr.diamantes; entregue.diamantes = pr.diamantes; }
  if (pr.ouro) { save.recompensas.gold += pr.ouro; entregue.ouro = pr.ouro; }
  if (pr.poReforco) {
    const rel = save.idle.reliquias || (save.idle.reliquias = { bolsa: [], equipadas: {}, predefinicoes: {}, capacidade: 200, poReforco: 0, seq: 0 });
    rel.poReforco = (rel.poReforco || 0) + pr.poReforco;
    entregue.poReforco = pr.poReforco;
  }
  if (pr.ticketsPermanentes) {
    const e = expDe(save);
    e.tickets = (e.tickets || 0) + pr.ticketsPermanentes;
    entregue.ticketsPermanentes = pr.ticketsPermanentes;
  }
  if (pr.ticketsSemanais) {
    const e = expDe(save);
    e.ticketsSemanais = (e.ticketsSemanais || 0) + pr.ticketsSemanais;
    entregue.ticketsSemanais = pr.ticketsSemanais;
  }
  if (pr.pocao_xp_p) { darPocao(save, 'pocao_xp_p', pr.pocao_xp_p); entregue.pocao_xp_p = pr.pocao_xp_p; }
  if (pr.pocao_energia) { darPocaoEnergia(save, pr.pocao_energia); entregue.pocao_energia = pr.pocao_energia; }
  if (pr.essencia) {
    adicionarEssencia(save, pr.essencia.par, pr.essencia.tamanho, pr.essencia.qtd);
    entregue.essencia = { ...pr.essencia };
  }
  if (pr.xpPasse && save.idle) {
    ganharXpPasse(save.idle, pr.xpPasse, agoraMs);
    entregue.xpPasse = pr.xpPasse;
  }
  return entregue;
}

export function coletarMissaoRotacao(save, escopo, missaoId, agoraMs = Date.now()) {
  const diaria = escopo === 'diaria';
  const def = diaria ? DIARIAS_POR_ID[missaoId] : SEMANAIS_POR_ID[missaoId];
  if (!def) return { ok: false, motivo: 'Missão não encontrada.' };
  const rot = rotacaoMissoesDe(save, agoraMs);
  const bloco = diaria ? rot.diaria : rot.semanal;
  if (bloco.coletadas[missaoId]) return { ok: false, jaColetada: true, motivo: 'Missão já coletada neste ciclo.' };
  const prog = Number(bloco.progresso[missaoId]) || 0;
  if (prog < def.meta) return { ok: false, motivo: `Progresso insuficiente (${prog}/${def.meta}).` };

  bloco.coletadas[missaoId] = true;
  const premio = pagarPremioRotacao(save, def.premio, agoraMs);
  return { ok: true, escopo, missaoId, premio };
}

export function coletarBauRotacao(save, escopo, agoraMs = Date.now()) {
  const diaria = escopo === 'diaria';
  const rot = rotacaoMissoesDe(save, agoraMs);
  const bloco = diaria ? rot.diaria : rot.semanal;
  const bauDef = diaria ? BAU_DIARIO_MODOS : BAU_SEMANAL_MODOS;
  const cat = diaria ? CATALOGO_DIARIAS_MODOS : CATALOGO_SEMANAIS_MODOS;

  if (bloco.bauColetado) return { ok: false, jaColetado: true, motivo: 'Baú já coletado neste ciclo.' };
  const concl = cat.filter((m) => Boolean(bloco.coletadas[m.id])).length;
  if (concl < bauDef.metaColetas) return { ok: false, motivo: `Faltam missões (${concl}/${bauDef.metaColetas}).` };

  bloco.bauColetado = true;
  const premio = pagarPremioRotacao(save, bauDef.premio, agoraMs);
  return { ok: true, escopo, premio };
}

export function resumoEconomiaRotacao() {
  const soma = (lista, chave) => lista.reduce((a, m) => a + (m.premio[chave] || 0), 0);
  return {
    diariaMissoes: {
      diamantes: soma(CATALOGO_DIARIAS_MODOS, 'diamantes'),
      ouro: soma(CATALOGO_DIARIAS_MODOS, 'ouro'),
      poReforco: soma(CATALOGO_DIARIAS_MODOS, 'poReforco'),
      xpPasse: soma(CATALOGO_DIARIAS_MODOS, 'xpPasse'),
    },
    diariaComBau: {
      diamantes: soma(CATALOGO_DIARIAS_MODOS, 'diamantes') + BAU_DIARIO_MODOS.premio.diamantes,
      ouro: soma(CATALOGO_DIARIAS_MODOS, 'ouro'),
      poReforco: soma(CATALOGO_DIARIAS_MODOS, 'poReforco'),
    },
    semanalComBau: {
      diamantes: soma(CATALOGO_SEMANAIS_MODOS, 'diamantes') + BAU_SEMANAL_MODOS.premio.diamantes,
      ticketsPermanentes: soma(CATALOGO_SEMANAIS_MODOS, 'ticketsPermanentes'),
      ticketsSemanais: soma(CATALOGO_SEMANAIS_MODOS, 'ticketsSemanais') + BAU_SEMANAL_MODOS.premio.ticketsSemanais,
      poReforco: soma(CATALOGO_SEMANAIS_MODOS, 'poReforco'),
    },
  };
}
