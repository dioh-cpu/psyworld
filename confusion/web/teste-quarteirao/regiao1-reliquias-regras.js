// Relíquias (+0→+15, recalibração nv.100, 13 conjuntos), Bolsa 200 vagas e Armas Únicas (5º espaço).
// Regras 100% puras (sem DOM). Teto testado de +70% de poder sobre o Onírico.
import { registrarGeradorReliquiaCampanha, parEssenciaDoElemento } from './regiao1-campanha-mini-regras.js';
import { registrarGeradorReliquiaRegiao } from './regiao1-regioes-regras.js';
import { registrarMarco } from './regiao1-missoes-regras.js';
import { linhagemArmaUnicaDe, LINHAGENS_ARMAS_UNICAS, TORRES_CFG } from './regiao1-torres-regras.js';
import { ELEMENTO_DA_ESPECIE } from '../species.js';
import { CLASSE_DA_ESPECIE } from './regiao1-progressao.js';
import { LINHAGENS_REINOS } from './regiao1-kits-reinos.js';

export const RELIQUIAS_CFG = {
  capacidadeBase: 200,
  capacidadeMax: 500,
  reforcoMax: 15,
  nivelRecalibrarMin: 100,
  tetoPoderTotal: 0.70,
};

export const RARIDADES_ORDEM = ['comum', 'incomum', 'rara', 'epica', 'lendaria'];
export const SECUNDARIOS_POR_RARIDADE = { comum: 0, incomum: 1, rara: 2, epica: 3, lendaria: 4 };
export const ESCALA_RARIDADE = { comum: 0.28, incomum: 0.38, rara: 0.48, epica: 0.72, lendaria: 1.00 };
const PO_DESMONTE_BASE = { comum: 4, incomum: 8, rara: 16, epica: 32, lendaria: 64 };

export const PARTES_RELIQUIA = {
  coroa: { id: 'coroa', nome: 'Coroa', fixo: true, opcoesPrincipais: ['vida_flat'] },
  amuleto: { id: 'amuleto', nome: 'Amuleto', fixo: true, opcoesPrincipais: ['ataque_flat'] },
  anel: { id: 'anel', nome: 'Anel', fixo: false, opcoesPrincipais: ['ataque_pct', 'vida_pct', 'defesa_pct', 'critico', 'roubo_vida'] },
  talisma: { id: 'talisma', nome: 'Talismã', fixo: false, opcoesPrincipais: ['velocidade', 'defesa_pct', 'vida_pct', 'precisao_efeito', 'resistencia'] },
};

// Valores exatos no +15 lendário (escalam linearmente do +0 ao +15 e pela raridade)
const CURVA_PRINCIPAL_LENDARIA = {
  vida_flat: { base: 80, max: 260, inteiro: true },
  ataque_flat: { base: 15, max: 60, inteiro: true },
  ataque_pct: { base: 0.06, max: 0.30 },
  vida_pct: { base: 0.06, max: 0.30 },
  defesa_pct: { base: 0.06, max: 0.30 },
  precisao_efeito: { base: 0.06, max: 0.30 },
  resistencia: { base: 0.06, max: 0.30 },
  critico: { base: 0.05, max: 0.20 },
  velocidade: { base: 5, max: 25, inteiro: true },
  roubo_vida: { base: 0.02, max: 0.08 },
};

const POOL_SECUNDARIOS = [
  'ataque_pct', 'vida_pct', 'defesa_pct', 'critico', 'dano_critico', 'velocidade', 'precisao_efeito', 'resistencia', 'roubo_vida',
];

const FAIXA_SECUNDARIO = {
  ataque_pct: [0.02, 0.035, 0.02],
  vida_pct: [0.02, 0.035, 0.02],
  defesa_pct: [0.02, 0.035, 0.02],
  critico: [0.02, 0.035, 0.018],
  dano_critico: [0.035, 0.055, 0.028],
  velocidade: [1, 3, 2],
  precisao_efeito: [0.025, 0.045, 0.02],
  resistencia: [0.025, 0.045, 0.02],
  roubo_vida: [0.01, 0.02, 0.01],
};

// 13 conjuntos como dados puros (Claude aplica em combate)
export const CONJUNTOS_RELIQUIAS = {
  cacador: {
    id: 'cacador',
    nome: 'Caçador',
    todosCalaboucos: true,
    pecas2: { xpMult: 0.15, ouroMult: 0.15, desc: '+15% XP e ouro' },
    pecas4: { xpMult: 0.30, ouroMult: 0.30, dropRaroExtra: 0.10, desc: '+30% XP e ouro e +10% drop raro' },
  },
  sanguessuga: {
    id: 'sanguessuga',
    nome: 'Sanguessuga',
    todosCalaboucos: true,
    calabouco: 'cripta-velada',
    pecas2: { roubo_vida: 0.10, desc: '10% roubo de vida' },
    pecas4: { roubo_vida: 0.15, desc: '15% roubo de vida' },
  },
  furia: {
    id: 'furia',
    nome: 'Fúria',
    calabouco: 'forja-rubra',
    pecas2: { ataque_pct: 0.15, desc: '+15% ataque' },
    pecas4: { ataque_pct: 0.35, desc: '+35% ataque' },
  },
  muralha: {
    id: 'muralha',
    nome: 'Muralha',
    calabouco: 'mina-profunda',
    pecas2: { defesa_pct: 0.15, desc: '+15% defesa' },
    pecas4: { defesa_pct: 0.35, desc: '+35% defesa' },
  },
  vigor: {
    id: 'vigor',
    nome: 'Vigor',
    calabouco: 'bosque-cativo',
    pecas2: { vida_pct: 0.15, desc: '+15% vida' },
    pecas4: { vida_pct: 0.35, desc: '+35% vida' },
  },
  impeto: {
    id: 'impeto',
    nome: 'Ímpeto',
    calabouco: 'gruta-mares',
    pecas2: null,
    pecas4: { velocidade_pct: 0.25, desc: '+25% velocidade' },
  },
  precisao: {
    id: 'precisao',
    nome: 'Precisão',
    calabouco: 'templo-alvorecer',
    pecas2: { critico: 0.12, desc: '+12% crítico' },
    pecas4: null,
  },
  destruicao: {
    id: 'destruicao',
    nome: 'Destruição',
    calabouco: 'forja-rubra',
    pecas2: null,
    pecas4: { dano_critico: 0.40, desc: '+40% dano crítico' },
  },
  'contra-ataque': {
    id: 'contra-ataque',
    nome: 'Contra-ataque',
    calabouco: 'mina-profunda',
    pecas2: null,
    pecas4: { contraAtaqueChance: 0.20, desc: '20% de contra-atacar' },
  },
  eco: {
    id: 'eco',
    nome: 'Eco',
    calabouco: 'gruta-mares',
    pecas2: null,
    pecas4: { ecoReducaoCdChance: 0.20, desc: '20% de reduzir 1 recarga' },
  },
  imunidade: {
    id: 'imunidade',
    nome: 'Imunidade',
    calabouco: 'templo-alvorecer',
    pecas2: { imunidadePrimeiroTurno: true, desc: 'Imune a efeitos negativos no 1º turno' },
    pecas4: null,
  },
  vinculo: {
    id: 'vinculo',
    nome: 'Vínculo',
    calabouco: 'bosque-cativo',
    pecas2: null,
    pecas4: { bonusCuraEscudo: 0.20, desc: 'Curas e escudos +20%' },
  },
  'panico-contido': {
    id: 'panico-contido',
    nome: 'Pânico Contido',
    calabouco: 'cripta-velada',
    pecas2: null,
    pecas4: { panicoContido: { limiarHp: 0.30, ataque_pct: 0.20, turnos: 2, usosPorBatalha: 1 }, desc: 'Abaixo de 30% de vida, +20% ataque por 2 turnos (1×/batalha)' },
  },
};

const CONJUNTO_DEFAULT_POR_PAR = {
  ignea: 'furia',
  mares: 'impeto',
  verde: 'vigor',
  mineral: 'muralha',
  solar: 'precisao',
  sombria: 'sanguessuga',
};

const PAR_NOME_ICONE = {
  ignea: 'fogo-eletrico',
  mares: 'agua-voador',
  verde: 'planta-inseto',
  mineral: 'terra-pedra-aco',
  solar: 'luz-neutro',
  sombria: 'trevas-fantasma',
};

export function iconeReliquia(parte, elemento) {
  const parSlug = PAR_NOME_ICONE[parEssenciaDoElemento(elemento)] || 'luz-neutro';
  return `assets/confusion/interface/reliquias/${parte}-${parSlug}.png`;
}

export function reliquiasDe(save) {
  const idle = save?.idle || (save ? (save.idle = {}) : {});
  if (!idle.reliquias || typeof idle.reliquias !== 'object') idle.reliquias = {};
  const r = idle.reliquias;
  r.bolsa ||= [];
  r.equipadas ||= {};
  r.predefinicoes ||= {};
  r.capacidade = Math.max(RELIQUIAS_CFG.capacidadeBase, Math.min(RELIQUIAS_CFG.capacidadeMax, Math.floor(Number(r.capacidade) || RELIQUIAS_CFG.capacidadeBase)));
  r.poReforco = Math.max(0, Math.floor(Number(r.poReforco) || 0));
  r.seq = Math.max(r.bolsa.length, Math.floor(Number(r.seq) || 0));
  return r;
}

export function valorPrincipalNoNivel(attr, raridade, reforco = 0) {
  const curva = CURVA_PRINCIPAL_LENDARIA[attr] || CURVA_PRINCIPAL_LENDARIA.ataque_pct;
  const esc = ESCALA_RARIDADE[raridade] || 0.5;
  const nv = Math.max(0, Math.min(RELIQUIAS_CFG.reforcoMax, Number(reforco) || 0));
  const bruto = (curva.base + ((curva.max - curva.base) * nv) / RELIQUIAS_CFG.reforcoMax) * esc;
  return curva.inteiro ? Math.round(bruto) : Number(bruto.toFixed(4));
}

function sortearValorSecundario(attr, raridade, rng) {
  const [min, max] = FAIXA_SECUNDARIO[attr] || [0.03, 0.05, 0.03];
  const esc = 0.75 + 0.25 * (ESCALA_RARIDADE[raridade] || 0.5);
  const v = (min + rng() * (max - min)) * esc;
  return attr === 'velocidade' ? Math.max(1, Math.round(v)) : Number(v.toFixed(4));
}

function stepUpSecundario(attr, raridade, rng) {
  const [, , stepMax] = FAIXA_SECUNDARIO[attr] || [0.03, 0.05, 0.03];
  const esc = 0.7 + 0.3 * (ESCALA_RARIDADE[raridade] || 0.5);
  const inc = (0.55 + 0.45 * rng()) * stepMax * esc;
  return attr === 'velocidade' ? Math.max(1, Math.round(inc)) : Number(inc.toFixed(4));
}

export function gerarReliquia({
  id = 'rel_1',
  parte = null,
  conjunto = null,
  elemento = 'planta',
  raridade = 'comum',
  principalAttr = null,
  fonte = 'drop',
  rng = Math.random,
} = {}) {
  const rar = RARIDADES_ORDEM.includes(raridade) ? raridade : 'comum';
  const partesKeys = Object.keys(PARTES_RELIQUIA);
  const p = PARTES_RELIQUIA[parte] ? parte : partesKeys[Math.floor(rng() * partesKeys.length) % partesKeys.length];
  const partDef = PARTES_RELIQUIA[p];
  const attr = principalAttr && partDef.opcoesPrincipais.includes(principalAttr)
    ? principalAttr
    : partDef.opcoesPrincipais[Math.floor(rng() * partDef.opcoesPrincipais.length) % partDef.opcoesPrincipais.length];
  const conj = CONJUNTOS_RELIQUIAS[conjunto] ? conjunto : (CONJUNTO_DEFAULT_POR_PAR[parEssenciaDoElemento(elemento)] || 'cacador');

  const qtdSec = SECUNDARIOS_POR_RARIDADE[rar] || 0;
  const disponiveis = POOL_SECUNDARIOS.filter((s) => s !== attr);
  const secundarios = [];
  for (let i = 0; i < qtdSec && disponiveis.length > 0; i++) {
    const idx = Math.floor(rng() * disponiveis.length) % disponiveis.length;
    const sAttr = disponiveis.splice(idx, 1)[0];
    secundarios.push({ attr: sAttr, valor: sortearValorSecundario(sAttr, rar, rng) });
  }

  return {
    id,
    parte: p,
    conjunto: conj,
    elemento,
    raridade: rar,
    reforco: 0,
    principal: { attr, valor: valorPrincipalNoNivel(attr, rar, 0) },
    secundarios,
    trancada: false,
    fonte,
  };
}

export function concederReliquia(save, opts = {}) {
  const r = reliquiasDe(save);
  if (r.bolsa.length >= r.capacidade) {
    return { ok: false, lotada: true, capacidade: r.capacidade, motivo: `Bolsa de relíquias lotada (${r.bolsa.length}/${r.capacidade}).` };
  }
  r.seq += 1;
  const reliquia = gerarReliquia({ ...opts, id: opts.id || `rel_${r.seq}` });
  r.bolsa.push(reliquia);
  return { ok: true, reliquia };
}

// Registra gerador real na Campanha Mini, Calabouços e Regiões 3–12
registrarGeradorReliquiaCampanha(concederReliquia);
registrarGeradorReliquiaRegiao(concederReliquia);

function acharReliquia(save, relId) {
  return reliquiasDe(save).bolsa.find((x) => x.id === relId) || null;
}

function acharUnidade(save, uid) {
  return (save?.idle?.equipe || []).find((u) => u?.uid === uid)
    || (save?.idle?.banco || []).find((u) => u?.uid === uid)
    || null;
}

function elementoDaUnidade(u) {
  return u?.elemento || ELEMENTO_DA_ESPECIE[u?.especie] || 'neutro';
}

function findEquippedOwner(r, relId) {
  for (const [uid, slots] of Object.entries(r.equipadas || {})) {
    for (const [parte, id] of Object.entries(slots || {})) {
      if (id === relId) return { uid, parte };
    }
  }
  return null;
}

export function custoReforcoReliquia(reforcoAtual) {
  const prox = Math.floor(Number(reforcoAtual) || 0) + 1;
  return { ouro: 150 + prox * 75, poReforco: prox * 2 };
}

export function reforcarReliquia(save, relId, { rng = Math.random } = {}) {
  const r = reliquiasDe(save);
  const rel = acharReliquia(save, relId);
  if (!rel) return { ok: false, motivo: 'Relíquia não encontrada.' };
  if ((rel.reforco || 0) >= RELIQUIAS_CFG.reforcoMax) {
    return { ok: false, jaMaximo: true, motivo: 'Relíquia já está em +15.' };
  }

  const custo = custoReforcoReliquia(rel.reforco || 0);
  save.recompensas = save.recompensas || { gold: 0, diamantes: 0, xp: 0 };
  if ((save.recompensas.gold || 0) < custo.ouro) {
    return { ok: false, motivo: `Ouro insuficiente (precisa ${custo.ouro}, saldo ${save.recompensas.gold || 0}).` };
  }
  if (r.poReforco < custo.poReforco) {
    return { ok: false, motivo: `Pó de reforço insuficiente (precisa ${custo.poReforco}, saldo ${r.poReforco}).` };
  }

  save.recompensas.gold -= custo.ouro;
  r.poReforco -= custo.poReforco;
  rel.reforco = (rel.reforco || 0) + 1;
  rel.principal.valor = valorPrincipalNoNivel(rel.principal.attr, rel.raridade, rel.reforco);

  let secundarioAlterado = null;
  if (rel.reforco % 3 === 0) {
    const usados = new Set([rel.principal.attr, ...(rel.secundarios || []).map((s) => s.attr)]);
    const candidatos = POOL_SECUNDARIOS.filter((s) => !usados.has(s));
    if ((rel.secundarios?.length || 0) < 4 && candidatos.length > 0) {
      const novoAttr = candidatos[Math.floor(rng() * candidatos.length) % candidatos.length];
      const novo = { attr: novoAttr, valor: sortearValorSecundario(novoAttr, rel.raridade, rng), novo: true };
      rel.secundarios.push({ attr: novo.attr, valor: novo.valor });
      secundarioAlterado = novo;
    } else if (rel.secundarios?.length > 0) {
      const idx = Math.floor(rng() * rel.secundarios.length) % rel.secundarios.length;
      const alvo = rel.secundarios[idx];
      const inc = stepUpSecundario(alvo.attr, rel.raridade, rng);
      alvo.valor = alvo.attr === 'velocidade' ? alvo.valor + inc : Number((alvo.valor + inc).toFixed(4));
      secundarioAlterado = { ...alvo, incremento: inc };
    }
  }

  registrarMarco(save, 'reliquia_reforco', { nivel: rel.reforco });
  return { ok: true, reliquia: rel, custo, secundarioAlterado };
}

export function recalibrarReliquia(save, relId, idxSecundario, uidOuNivelOnirico, { rng = Math.random } = {}) {
  const nivelOnirico = typeof uidOuNivelOnirico === 'number'
    ? uidOuNivelOnirico
    : (acharUnidade(save, uidOuNivelOnirico)?.nivel || 1);
  if (nivelOnirico < RELIQUIAS_CFG.nivelRecalibrarMin) {
    return { ok: false, motivo: `Recalibração exige Onírico nível ${RELIQUIAS_CFG.nivelRecalibrarMin}+.` };
  }
  const r = reliquiasDe(save);
  const rel = acharReliquia(save, relId);
  if (!rel) return { ok: false, motivo: 'Relíquia não encontrada.' };
  const secAtual = rel.secundarios?.[idxSecundario];
  if (!secAtual) return { ok: false, motivo: 'Atributo secundário inválido.' };

  const custoOuro = 1200;
  const custoPo = 15;
  save.recompensas = save.recompensas || { gold: 0, diamantes: 0, xp: 0 };
  if ((save.recompensas.gold || 0) < custoOuro) return { ok: false, motivo: 'Ouro insuficiente para recalibrar.' };
  if (r.poReforco < custoPo) return { ok: false, motivo: 'Pó de reforço insuficiente para recalibrar.' };

  const usados = new Set([rel.principal.attr, ...rel.secundarios.map((s) => s.attr)]);
  const pool = POOL_SECUNDARIOS.filter((s) => !usados.has(s));
  if (!pool.length) return { ok: false, motivo: 'Sem atributo secundário disponível para troca.' };

  save.recompensas.gold -= custoOuro;
  r.poReforco -= custoPo;
  const novoAttr = pool[Math.floor(rng() * pool.length) % pool.length];
  const anterior = { ...secAtual };
  rel.secundarios[idxSecundario] = { attr: novoAttr, valor: sortearValorSecundario(novoAttr, rel.raridade, rng) };
  return { ok: true, anterior, novo: { ...rel.secundarios[idxSecundario] }, reliquia: rel };
}

export function trancarReliquia(save, relId, trancada = true) {
  const rel = acharReliquia(save, relId);
  if (!rel) return { ok: false, motivo: 'Relíquia não encontrada.' };
  rel.trancada = Boolean(trancada);
  return { ok: true, id: relId, trancada: rel.trancada };
}

export function desmontarReliquia(save, relId) {
  const r = reliquiasDe(save);
  const idx = r.bolsa.findIndex((x) => x.id === relId);
  if (idx < 0) return { ok: false, motivo: 'Relíquia não encontrada.' };
  const rel = r.bolsa[idx];
  if (rel.trancada) return { ok: false, motivo: 'Relíquia trancada não pode ser desmontada.' };
  if (findEquippedOwner(r, relId)) return { ok: false, motivo: 'Desequipe a relíquia antes de desmontar.' };

  const poGanho = (PO_DESMONTE_BASE[rel.raridade] || 4) + (rel.reforco || 0) * 3;
  r.bolsa.splice(idx, 1);
  r.poReforco += poGanho;
  return { ok: true, poGanho, poTotal: r.poReforco, removida: rel };
}

export function filtrarReliquias(save, filtros = {}) {
  const r = reliquiasDe(save);
  return r.bolsa.filter((rel) => {
    if (filtros.elemento && rel.elemento !== filtros.elemento) return false;
    if (filtros.parte && rel.parte !== filtros.parte) return false;
    if (filtros.conjunto && rel.conjunto !== filtros.conjunto) return false;
    if (filtros.raridade && rel.raridade !== filtros.raridade) return false;
    if (filtros.trancada !== undefined && Boolean(rel.trancada) !== Boolean(filtros.trancada)) return false;
    if (filtros.disponivel && findEquippedOwner(r, rel.id)) return false;
    return true;
  });
}

export function conjuntosAtivosDoOnirico(save, uid) {
  const r = reliquiasDe(save);
  const slots = r.equipadas[uid] || {};
  const contagem = {};
  for (const parte of Object.keys(PARTES_RELIQUIA)) {
    const rel = slots[parte] ? acharReliquia(save, slots[parte]) : null;
    if (rel?.conjunto) contagem[rel.conjunto] = (contagem[rel.conjunto] || 0) + 1;
  }
  const ativos = [];
  for (const [cid, qtd] of Object.entries(contagem)) {
    const def = CONJUNTOS_RELIQUIAS[cid];
    if (!def) continue;
    if (qtd >= 4 && def.pecas4) ativos.push({ conjunto: cid, pecas: 4, bonus: def.pecas4 });
    else if (qtd >= 2 && def.pecas2) ativos.push({ conjunto: cid, pecas: 2, bonus: def.pecas2 });
  }
  return ativos;
}

export function equiparReliquia(save, uid, relId) {
  const unidade = acharUnidade(save, uid);
  if (!unidade) return { ok: false, motivo: 'Onírico não encontrado.' };
  const r = reliquiasDe(save);
  const rel = acharReliquia(save, relId);
  if (!rel) return { ok: false, motivo: 'Relíquia não encontrada.' };

  const elUnidade = elementoDaUnidade(unidade);
  if (elUnidade !== rel.elemento) {
    return {
      ok: false,
      elementoIncompativel: true,
      motivo: `Elemento incompatível: relíquia ${rel.elemento} só equipa em Onírico ${rel.elemento} (atual: ${elUnidade}).`,
    };
  }

  const antigoDono = findEquippedOwner(r, relId);
  if (antigoDono) delete r.equipadas[antigoDono.uid][antigoDono.parte];

  const eq = (r.equipadas[uid] ||= {});
  eq[rel.parte] = rel.id;

  const ativos = conjuntosAtivosDoOnirico(save, uid);
  if (ativos.some((a) => a.pecas >= 4)) registrarMarco(save, 'reliquia_conjunto4', {});
  return { ok: true, uid, parte: rel.parte, reliquia: rel, conjuntosAtivos: ativos };
}

export function desequiparReliquia(save, uid, parte) {
  const r = reliquiasDe(save);
  if (!r.equipadas[uid]?.[parte]) return { ok: false, motivo: 'Espaço vazio.' };
  delete r.equipadas[uid][parte];
  return { ok: true, uid, parte };
}

export function salvarPredefinicaoReliquias(save, uid, nome = 'padrao') {
  const r = reliquiasDe(save);
  const slots = r.equipadas[uid] || {};
  (r.predefinicoes[uid] ||= {})[nome] = { ...slots };
  return { ok: true, uid, nome, slots: { ...slots } };
}

export function aplicarPredefinicaoReliquias(save, uid, nome = 'padrao') {
  const r = reliquiasDe(save);
  const preset = r.predefinicoes[uid]?.[nome];
  if (!preset) return { ok: false, motivo: 'Predefinição não encontrada.' };
  const equipadas = [];
  for (const parte of Object.keys(PARTES_RELIQUIA)) {
    const id = preset[parte];
    if (id) {
      const res = equiparReliquia(save, uid, id);
      if (res.ok) equipadas.push(id);
    }
  }
  return { ok: true, equipadas };
}

export function equiparReliquiasRecomendadas(save, uid, { priorizarConjunto = null } = {}) {
  const unidade = acharUnidade(save, uid);
  if (!unidade) return { ok: false, motivo: 'Onírico não encontrado.' };
  const el = elementoDaUnidade(unidade);
  const cls = CLASSE_DA_ESPECIE[unidade.especie] || 'guerreiro';
  const conjPref = priorizarConjunto || (cls === 'tanque' ? 'muralha' : cls === 'suporte' ? 'vinculo' : 'furia');

  const disponiveis = filtrarReliquias(save, { elemento: el });
  const r = reliquiasDe(save);
  const equipadas = [];
  for (const parte of Object.keys(PARTES_RELIQUIA)) {
    const cands = disponiveis.filter((x) => {
      if (x.parte !== parte) return false;
      const dono = findEquippedOwner(r, x.id);
      return !dono || dono.uid === uid;
    });
    if (!cands.length) continue;
    cands.sort((a, b) => {
      const sc = (x) => (x.conjunto === conjPref ? 100 : 0) + RARIDADES_ORDEM.indexOf(x.raridade) * 20 + (x.reforco || 0);
      return sc(b) - sc(a);
    });
    const res = equiparReliquia(save, uid, cands[0].id);
    if (res.ok) equipadas.push(cands[0]);
  }
  return { ok: true, equipadas, conjuntosAtivos: conjuntosAtivosDoOnirico(save, uid) };
}

// ---- Armas Únicas (5º espaço por linhagem, dados de efeito para o combate) ----
export const ARMAS_UNICAS_CFG = {
  maxReforco: 5,
  fragmentosCriacao: TORRES_CFG.fragmentosParaArma, // 10
  bonusBase: 0.10,
  bonusPorReforco: 0.01, // +0: 10% -> +5: 15%
};

const ARMAS_UNICAS_ESPECIFICAS = {
  noctarn: { nome: 'Adaga do Eclipse Lunar', elemento: 'trevas', attr: 'critico', efeitoHabilidade: { alvo: 'suprema', tipo: 'ignorar_defesa', valor: 0.25, desc: '+25% penetração de defesa na suprema' } },
  ignavor: { nome: 'Garras da Forja Solar', elemento: 'fogo', attr: 'ataque_pct', efeitoHabilidade: { alvo: 'tecnica', tipo: 'queimadura_extra', valor: 1, desc: 'Aplica 1 acúmulo extra de queimadura' } },
  vaelith: { nome: 'Cajado da Correnteza', elemento: 'agua', attr: 'ataque_pct', efeitoHabilidade: { alvo: 'suprema', tipo: 'espalhar_dano', valor: 0.20, desc: '+20% de dano em área' } },
  brotavel: { nome: 'Égide do Bosque Vivo', elemento: 'planta', attr: 'vida_pct', efeitoHabilidade: { alvo: 'tecnica', tipo: 'escudo_proprio', valor: 0.15, desc: 'Ganha escudo de 15% da vida máxima' } },
  solarin: { nome: 'Candelabro da Alvorada', elemento: 'luz', attr: 'bonus_cura', efeitoHabilidade: { alvo: 'suprema', tipo: 'purificar_aliados', valor: 1, desc: 'Remove 1 efeito negativo ao curar' } },
  abobrisco: { nome: 'Lanterna da Colheita Oca', elemento: 'planta', attr: 'defesa_pct', efeitoHabilidade: { alvo: 'tecnica', tipo: 'provocar_duracao', valor: 1, desc: 'Estende proteção ao time' } },
  velalume: { nome: 'Turíbulo da Luz Calma', elemento: 'luz', attr: 'bonus_cura', efeitoHabilidade: { alvo: 'suprema', tipo: 'regeneracao_extra', valor: 1, desc: '+1 turno de regeneração' } },
  mortalio: { nome: 'Grimório do Véu Violeta', elemento: 'fantasma', attr: 'ataque_pct', efeitoHabilidade: { alvo: 'tecnica', tipo: 'prolongar_buff', valor: 1, desc: '+1 turno em efeitos de suporte' } },
  vitrarco: { nome: 'Lâmina de Vitral Sombrio', elemento: 'trevas', attr: 'ataque_pct', efeitoHabilidade: { alvo: 'suprema', tipo: 'perfuracao', valor: 0.20, desc: '+20% dano contra escudos' } },
  abyssar: { nome: 'Ferrão do Abismo Profundo', elemento: 'trevas', attr: 'critico', efeitoHabilidade: { alvo: 'tecnica', tipo: 'recarga_abate', valor: 1, desc: '-1 recarga ao derrotar alvo' } },
};

function inferirAttrArma(classe) {
  if (classe === 'tanque') return 'vida_pct';
  if (classe === 'suporte') return 'bonus_cura';
  if (classe === 'assassino') return 'critico';
  return 'ataque_pct';
}

export const CATALOGO_ARMAS_UNICAS = Object.fromEntries(
  LINHAGENS_ARMAS_UNICAS.map((slug) => {
    const esp = ARMAS_UNICAS_ESPECIFICAS[slug];
    const reinoLin = LINHAGENS_REINOS.find((l) => linhagemArmaUnicaDe(l.nome) === slug);
    const especieOrig = reinoLin?.nome || Object.keys(ELEMENTO_DA_ESPECIE).find((k) => linhagemArmaUnicaDe(k) === slug) || slug;
    const classe = reinoLin?.classe || CLASSE_DA_ESPECIE[especieOrig] || 'guerreiro';
    const elemento = esp?.elemento || reinoLin?.elemento || ELEMENTO_DA_ESPECIE[especieOrig] || 'neutro';
    return [slug, {
      linhagem: slug,
      nome: esp?.nome || `Relíquia Ancestral de ${especieOrig}`,
      elemento,
      classe,
      attr: esp?.attr || inferirAttrArma(classe),
      valorBase: ARMAS_UNICAS_CFG.bonusBase,
      incrementoPorReforco: ARMAS_UNICAS_CFG.bonusPorReforco,
      icone: `assets/confusion/interface/armas-unicas/${slug}.png`,
      efeitoHabilidade: esp?.efeitoHabilidade || { alvo: 'suprema', tipo: 'amplificar_suprema', valor: 0.15, desc: '+15% potência na habilidade suprema' },
    }];
  }),
);

export function armaUnicaDaLinhagem(especieOuSlug) {
  const slug = linhagemArmaUnicaDe(especieOuSlug);
  return CATALOGO_ARMAS_UNICAS[slug] || {
    linhagem: slug,
    nome: `Arma Única de ${slug}`,
    elemento: 'neutro',
    classe: 'guerreiro',
    attr: 'ataque_pct',
    valorBase: ARMAS_UNICAS_CFG.bonusBase,
    incrementoPorReforco: ARMAS_UNICAS_CFG.bonusPorReforco,
    icone: `assets/confusion/interface/armas-unicas/${slug}.png`,
    efeitoHabilidade: { alvo: 'suprema', tipo: 'amplificar_suprema', valor: 0.15, desc: '+15% potência na habilidade suprema' },
  };
}

export function armasUnicasDe(save) {
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

export function valorAtributoArmaUnica(arma, reforco = 0) {
  const nv = Math.max(0, Math.min(ARMAS_UNICAS_CFG.maxReforco, Number(reforco) || 0));
  return Number((arma.valorBase + nv * arma.incrementoPorReforco).toFixed(4));
}

export function criarArmaUnica(save, especieOuLinhagem) {
  const slug = linhagemArmaUnicaDe(especieOuLinhagem);
  const a = armasUnicasDe(save);
  if (a.possuidas[slug]) return { ok: false, jaPossui: true, motivo: 'Arma única desta linhagem já foi criada.' };

  const temNv100 = Boolean(a.liberadasPorNivel100[slug])
    || [...(save?.idle?.equipe || []), ...(save?.idle?.banco || [])].some((u) => u?.especie && linhagemArmaUnicaDe(u.especie) === slug && (Number(u.nivel) || 1) >= 100);
  const frags = a.fragmentos[slug] || 0;

  if (!temNv100 && frags < ARMAS_UNICAS_CFG.fragmentosCriacao) {
    return { ok: false, motivo: `Faltam fragmentos para ${slug} (${frags}/${ARMAS_UNICAS_CFG.fragmentosCriacao}).` };
  }
  if (!temNv100) a.fragmentos[slug] = frags - ARMAS_UNICAS_CFG.fragmentosCriacao;
  else a.liberadasPorNivel100[slug] = true;

  a.possuidas[slug] = { reforco: 0, viaNivel100: temNv100 };
  registrarMarco(save, 'arma_unica', { linhagem: slug, qtd: 1 });
  return { ok: true, linhagem: slug, def: armaUnicaDaLinhagem(slug), estado: a.possuidas[slug], fragmentosRestantes: a.fragmentos[slug] || 0 };
}

export function reforcarArmaUnica(save, especieOuLinhagem) {
  const slug = linhagemArmaUnicaDe(especieOuLinhagem);
  const a = armasUnicasDe(save);
  const estado = a.possuidas[slug];
  if (!estado) return { ok: false, motivo: 'Crie esta arma única antes de reforçar.' };
  if ((estado.reforco || 0) >= ARMAS_UNICAS_CFG.maxReforco) {
    return { ok: false, jaMaximo: true, motivo: 'Arma única já está em +5.' };
  }
  const custoFrags = (estado.reforco || 0) + 1;
  const frags = a.fragmentos[slug] || 0;
  if (frags < custoFrags) {
    return { ok: false, motivo: `Faltam fragmentos extras para +${estado.reforco + 1} (${frags}/${custoFrags}).` };
  }
  a.fragmentos[slug] = frags - custoFrags;
  estado.reforco += 1;
  return { ok: true, linhagem: slug, reforco: estado.reforco, fragmentosRestantes: a.fragmentos[slug] };
}

export function equiparArmaUnica(save, uid, especieOuLinhagem = null) {
  const unidade = acharUnidade(save, uid);
  if (!unidade) return { ok: false, motivo: 'Onírico não encontrado.' };
  const linUnidade = linhagemArmaUnicaDe(unidade.especie);
  const slug = especieOuLinhagem ? linhagemArmaUnicaDe(especieOuLinhagem) : linUnidade;
  if (slug !== linUnidade) {
    return { ok: false, motivo: `Arma única de ${slug} só pode equipar na linhagem ${slug}.` };
  }
  const a = armasUnicasDe(save);
  if (!a.possuidas[slug]) return { ok: false, motivo: 'Arma única ainda não criada.' };
  a.equipadas[uid] = slug;
  return { ok: true, uid, linhagem: slug, arma: armaUnicaDaLinhagem(slug), reforco: a.possuidas[slug].reforco };
}

// ---- Agregação de bônus e garantia de teto <= +70% de poder ----
const REF_STATS_NV100 = { hp: 1358, atk: 333, def: 144, vel: 100 };

export function calcularBonusEquipamentoOnirico(save, unidadeOuUid, statsBase = REF_STATS_NV100) {
  const u = typeof unidadeOuUid === 'string' ? acharUnidade(save, unidadeOuUid) : unidadeOuUid;
  const uid = u?.uid || (typeof unidadeOuUid === 'string' ? unidadeOuUid : null);
  const r = reliquiasDe(save);
  const a = armasUnicasDe(save);

  const mods = {
    vida_flat: 0,
    ataque_flat: 0,
    vida_pct: 0,
    ataque_pct: 0,
    defesa_pct: 0,
    velocidade: 0,
    velocidade_pct: 0,
    critico: 0,
    dano_critico: 0,
    roubo_vida: 0,
    precisao_efeito: 0,
    resistencia: 0,
    bonus_cura: 0,
  };

  const slots = (uid && r.equipadas[uid]) || {};
  for (const parte of Object.keys(PARTES_RELIQUIA)) {
    const rel = slots[parte] ? acharReliquia(save, slots[parte]) : null;
    if (!rel) continue;
    if (rel.principal?.attr in mods) mods[rel.principal.attr] += Number(rel.principal.valor) || 0;
    for (const s of rel.secundarios || []) {
      if (s?.attr in mods) mods[s.attr] += Number(s.valor) || 0;
    }
  }

  const conjuntosAtivos = uid ? conjuntosAtivosDoOnirico(save, uid) : [];
  const efeitosEspeciais = {};
  for (const ativo of conjuntosAtivos) {
    for (const [k, v] of Object.entries(ativo.bonus || {})) {
      if (k === 'desc') continue;
      if (k in mods && typeof v === 'number') mods[k] += v;
      else efeitosEspeciais[k] = v;
    }
  }

  const slugArma = uid ? a.equipadas[uid] : null;
  let armaUnicaInfo = null;
  if (slugArma && a.possuidas[slugArma]) {
    const def = armaUnicaDaLinhagem(slugArma);
    const ref = Number(a.possuidas[slugArma].reforco) || 0;
    const val = valorAtributoArmaUnica(def, ref);
    if (def.attr in mods) mods[def.attr] += val;
    armaUnicaInfo = { ...def, reforco: ref, valorAtributo: val };
  }

  // Flats são calibrados em Nv.100; escalam pelo nível ou stats reais da unidade para não inflar níveis baixos.
  const hpBase = Math.max(100, Number(statsBase?.hp) || REF_STATS_NV100.hp);
  const atkBase = Math.max(20, Number(statsBase?.atk) || REF_STATS_NV100.atk);
  const defBase = Math.max(20, Number(statsBase?.def) || REF_STATS_NV100.def);
  const usouStatsReais = Boolean(statsBase && statsBase !== REF_STATS_NV100 && Number.isFinite(Number(statsBase.hp)));
  const fatorNivelFlat = u?.nivel ? Math.max(0.15, Math.min(1, Number(u.nivel) / 100)) : 1;
  const fatorHpFlat = usouStatsReais ? Math.max(0.15, Math.min(1, hpBase / REF_STATS_NV100.hp)) : fatorNivelFlat;
  const fatorAtkFlat = usouStatsReais ? Math.max(0.15, Math.min(1, atkBase / REF_STATS_NV100.atk)) : fatorNivelFlat;
  mods.vida_flat = Math.round(mods.vida_flat * fatorHpFlat);
  mods.ataque_flat = Math.round(mods.ataque_flat * fatorAtkFlat);

  // Poder relativo em combate: soma valor esperado do crítico ao ataque, pesa ataque ×1,6 (dano líquido pós-defesa)
  // e mantém todas as builds dentro do teto estrito de +70%.
  const poderRelativoDe = (m) => {
    const multHp = 1 + m.vida_pct + m.vida_flat / hpBase;
    const multAtk = 1 + m.ataque_pct + m.ataque_flat / atkBase;
    const critEV = Math.min(0.65, m.critico) * (0.5 + Math.min(0.8, m.dano_critico));
    const atkEfetivo = multAtk * (1 + critEV) - 1;
    const hpEfetivo = multHp - 1;
    const defEfetiva = m.defesa_pct * 0.5;
    const velEfetiva = m.velocidade_pct + m.velocidade / 100;
    const sustEfetiva = m.roubo_vida * 0.5 + m.bonus_cura * 0.25 + (m.precisao_efeito + m.resistencia) * 0.12;
    return hpEfetivo * 0.48 + atkEfetivo * (0.38 * 1.6) + defEfetiva * 0.34 + velEfetiva * 0.25 + sustEfetiva * 0.22;
  };

  let ganhoBruto = poderRelativoDe(mods);
  let fatorTeto = 1;
  if (ganhoBruto > RELIQUIAS_CFG.tetoPoderTotal) {
    // Busca fator escalar entre 0 e 1 para manter ganhoPoder <= +70% preservando proporção dos atributos
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      const escalado = Object.fromEntries(Object.entries(mods).map(([k, v]) => [k, v * mid]));
      if (poderRelativoDe(escalado) <= RELIQUIAS_CFG.tetoPoderTotal) lo = mid;
      else hi = mid;
    }
    fatorTeto = Number(lo.toFixed(4));
    for (const k of Object.keys(mods)) {
      const v = mods[k] * fatorTeto;
      mods[k] = k === 'vida_flat' || k === 'ataque_flat' || k === 'velocidade' ? Math.round(v) : Number(v.toFixed(4));
    }
  }

  const ganhoFinal = Math.min(RELIQUIAS_CFG.tetoPoderTotal, Number(poderRelativoDe(mods).toFixed(4)));
  void defBase;
  return {
    atributos: mods,
    conjuntosAtivos,
    efeitosEspeciais,
    armaUnica: armaUnicaInfo,
    ganhoPoderBruto: Number(ganhoBruto.toFixed(4)),
    ganhoPoderFinal: ganhoFinal,
    fatorTetoAplicado: fatorTeto < 1,
    fatorTeto,
  };
}

// Contrato direto para o motor de combate do Claude (regiao1-estrategia-regras.js)
export function perfilCombateEquipamento(save, unidadeOuUid, statsBase = REF_STATS_NV100) {
  const res = calcularBonusEquipamentoOnirico(save, unidadeOuUid, statsBase);
  const a = res.atributos;
  const e = res.efeitosEspeciais || {};
  return {
    vidaFlat: a.vida_flat,
    ataqueFlat: a.ataque_flat,
    vidaPct: a.vida_pct,
    ataquePct: a.ataque_pct,
    defesaPct: a.defesa_pct,
    velocidadeFlat: a.velocidade,
    velocidadePct: a.velocidade_pct,
    critico: a.critico,
    danoCritico: a.dano_critico,
    rouboVida: a.roubo_vida,
    precisaoEfeito: a.precisao_efeito,
    resistenciaEfeito: a.resistencia,
    bonusCuraEscudo: Number(((a.bonus_cura || 0) + (e.bonusCuraEscudo || 0)).toFixed(4)),
    contraAtaque: e.contraAtaqueChance || 0,
    ecoRecarga: e.ecoReducaoCdChance || 0,
    imunidadeTurnos: e.imunidadePrimeiroTurno ? 1 : 0,
    panicoContido: e.panicoContido ? { ...e.panicoContido } : null,
    farmBonus: {
      xpMult: e.xpMult || 0,
      ouroMult: e.ouroMult || 0,
      dropRaroExtra: e.dropRaroExtra || 0,
    },
    armaUnica: res.armaUnica,
    conjuntosAtivos: res.conjuntosAtivos,
    ganhoPoderBruto: res.ganhoPoderBruto,
    ganhoPoderFinal: res.ganhoPoderFinal,
    fatorTetoAplicado: res.fatorTetoAplicado,
    fatorTeto: res.fatorTeto,
  };
}

// Simula arquétipos de build (+9 rara, +12 épica, +15 lendária × conjuntos + Arma Única +5) para calibração do motor
export function simularTabelaEquilibrioReliquias() {
  const simular = (nomeBuild, { raridade = 'lendaria', nivel = 15, conjuntos = ['furia', 'furia', 'furia', 'furia'], comArma = true } = {}) => {
    const mock = {
      recompensas: { gold: 9_999_999, diamantes: 0, xp: 0 },
      idle: {
        equipe: [{ uid: 'sim0', especie: 'Ignaraz', nivel: 100, xp: 0, tier: 5, estrelas: 6 }],
        reliquias: { bolsa: [], equipadas: {}, predefinicoes: {}, capacidade: 200, poReforco: 999_999, seq: 0 },
        armasUnicas: { fragmentos: {}, possuidas: {}, equipadas: {}, poUnico: 0, escolhasPendentes: 0, liberadasPorNivel100: { ignavor: true } },
        missoes: { paralelasAtivas: {}, paralelasConcluidas: {}, enfeitesRefugio: {}, titulos: {}, progresso: {}, marcosColetados: {} },
      },
    };
    const partes = [
      ['coroa', 'vida_flat'],
      ['amuleto', 'ataque_flat'],
      ['anel', 'ataque_pct'],
      ['talisma', 'velocidade'],
    ];
    if (nivel > 0 || raridade !== 'nenhuma') {
      partes.forEach(([parte, attr], i) => {
        const rel = concederReliquia(mock, {
          parte,
          elemento: 'fogo',
          raridade,
          conjunto: conjuntos[i % conjuntos.length],
          principalAttr: attr,
          rng: () => 0.75,
        }).reliquia;
        for (let k = 0; k < nivel; k++) reforcarReliquia(mock, rel.id, { rng: () => 0.75 });
        equiparReliquia(mock, 'sim0', rel.id);
      });
    }
    if (comArma) {
      mock.idle.armasUnicas.fragmentos.ignavor = 20;
      criarArmaUnica(mock, 'Ignaraz');
      for (let k = 0; k < 5; k++) reforcarArmaUnica(mock, 'Ignaraz');
      equiparArmaUnica(mock, 'sim0', 'Ignaraz');
    }
    const perfil = perfilCombateEquipamento(mock, 'sim0');
    return {
      build: nomeBuild,
      conjuntos,
      raridade,
      nivelReforco: nivel,
      comArmaUnica: comArma,
      ganhoPoderBruto: perfil.ganhoPoderBruto,
      ganhoPoderFinal: perfil.ganhoPoderFinal,
      fatorTetoAplicado: perfil.fatorTetoAplicado,
      perfil,
    };
  };

  const cenarios = [
    simular('sem_equipamento', { nivel: 0, raridade: 'nenhuma', conjuntos: [], comArma: false }),
    simular('midgame_rara_9', { raridade: 'rara', nivel: 9, conjuntos: ['furia', 'furia', 'precisao', 'precisao'], comArma: false }),
    simular('epica_12_precisao_imunidade', { raridade: 'epica', nivel: 12, conjuntos: ['precisao', 'precisao', 'imunidade', 'imunidade'], comArma: true }),
    simular('lendaria_15_cacador_farm', { raridade: 'lendaria', nivel: 15, conjuntos: ['cacador', 'cacador', 'cacador', 'cacador'], comArma: false }),
  ];

  for (const cid of ['furia', 'destruicao', 'impeto', 'muralha', 'vigor', 'sanguessuga', 'contra-ataque', 'eco', 'vinculo', 'panico-contido']) {
    cenarios.push(simular(`lendaria_15_${cid}_arma5`, { raridade: 'lendaria', nivel: 15, conjuntos: [cid, cid, cid, cid], comArma: true }));
  }
  return cenarios;
}
