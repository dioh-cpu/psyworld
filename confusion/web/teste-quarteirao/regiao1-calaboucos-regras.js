// 6 Calabouços de Relíquias (13 níveis cada), raridades escalonadas, batalha rápida com todos vivos e loja.
// Regras 100% puras (sem DOM).
import { ENERGIA_CFG, gastarEnergia, concederReliquiaCampanha } from './regiao1-campanha-mini-regras.js';
import './regiao1-reliquias-regras.js'; // garante gerador real de relíquias plugado mesmo se importado isoladamente
import { registrarMarco } from './regiao1-missoes-regras.js';
import { talvezDoce } from './regiao1-halloween-regras.js';
import { ELEMENTO_DA_ESPECIE } from '../species.js';
import * as EstrategiaRegras from './regiao1-estrategia-regras.js';

export const CALABOUCOS_CFG = {
  maxNiveis: 13,
  chanceSegundaReliquia: 0.3,
  custoLojaReliquia: 40,
};

export const PESOS_RARIDADE_CALABOUCO = [
  { min: 1, max: 3, pesos: { comum: 60, incomum: 35, rara: 5, epica: 0, lendaria: 0 } },
  { min: 4, max: 7, pesos: { comum: 20, incomum: 45, rara: 30, epica: 5, lendaria: 0 } },
  { min: 8, max: 10, pesos: { comum: 0, incomum: 25, rara: 45, epica: 25, lendaria: 5 } },
  { min: 11, max: 13, pesos: { comum: 0, incomum: 0, rara: 40, epica: 45, lendaria: 15 } },
];

export function pesosRaridadePorNivel(nivel) {
  const n = Math.max(1, Math.min(CALABOUCOS_CFG.maxNiveis, Math.floor(Number(nivel) || 1)));
  return (PESOS_RARIDADE_CALABOUCO.find((f) => n >= f.min && n <= f.max) || PESOS_RARIDADE_CALABOUCO[0]).pesos;
}

export function sortearRaridadeCalabouco(nivel, rng = Math.random) {
  const pesos = pesosRaridadePorNivel(nivel);
  const entradas = Object.entries(pesos).filter(([, p]) => p > 0);
  const total = entradas.reduce((a, [, p]) => a + p, 0);
  let r = rng() * total;
  for (const [rar, p] of entradas) {
    r -= p;
    if (r < 0) return rar;
  }
  return entradas[entradas.length - 1][0];
}

export function energiaCalabouco() {
  return 0;
}

const DEF_CALABOUCOS = [
  {
    id: 'forja-rubra',
    nome: 'Forja Rubra',
    elementos: ['fogo', 'eletrico'],
    chefe: 'Salamandra-forja',
    mecanica: 'Ganha carga térmica a cada ataque; queima e descarrega dano em área se não for controlada.',
    conjuntosExclusivos: ['furia', 'destruicao'],
  },
  {
    id: 'gruta-mares',
    nome: 'Gruta das Marés',
    elementos: ['agua', 'voador'],
    chefe: 'Leviatã de coral',
    mecanica: 'Eleva velocidade e reduz recargas quando está acima de 50% de vida.',
    conjuntosExclusivos: ['impeto', 'eco'],
  },
  {
    id: 'bosque-cativo',
    nome: 'Bosque Cativo',
    elementos: ['planta', 'inseto'],
    chefe: 'Rainha-espora',
    mecanica: 'Aplica veneno e se regenera enquanto tiver lacaios vivos.',
    conjuntosExclusivos: ['vigor', 'vinculo'],
  },
  {
    id: 'mina-profunda',
    nome: 'Mina Profunda',
    elementos: ['terra', 'pedra', 'aco'],
    chefe: 'Golem de minério',
    mecanica: 'Carapaça mineral espessa que devolve parte dos golpes diretos.',
    conjuntosExclusivos: ['muralha', 'contra-ataque'],
  },
  {
    id: 'templo-alvorecer',
    nome: 'Templo do Alvorecer',
    elementos: ['luz'],
    chefe: 'Arauto solar',
    mecanica: 'Inicia com imunidade a efeitos negativos e pune quem demora para quebrar o escudo.',
    conjuntosExclusivos: ['precisao', 'imunidade'],
  },
  {
    id: 'cripta-velada',
    nome: 'Cripta Velada',
    elementos: ['trevas', 'fantasma'],
    chefe: 'Ceifador velado',
    mecanica: 'Drena vida dos aliados feridos e ganha fúria extrema abaixo de 30% de vida.',
    conjuntosExclusivos: ['sanguessuga', 'panico-contido'],
  },
  {
    id: 'pico-glacial',
    nome: 'Pico Glacial',
    elementos: ['gelo', 'veneno'],
    chefe: 'Hidra Gélida',
    mecanica: 'Congela aliados lentos e espalha toxina glacial que escala a cada rodada.',
    conjuntosExclusivos: ['muralha', 'imunidade'],
  },
  {
    id: 'arena-draconica',
    nome: 'Arena Dracônica',
    elementos: ['lutador', 'dragao'],
    chefe: 'Campeão Dracônico',
    mecanica: 'Ganha fúria cumulativa ao receber golpes diretos e responde com contra-ataques brutais.',
    conjuntosExclusivos: ['furia', 'contra-ataque'],
  },
  {
    id: 'santuario-arcano',
    nome: 'Santuário Arcano',
    elementos: ['psiquico', 'fada'],
    chefe: 'Oráculo Feérico',
    mecanica: 'Reduz as próprias recargas com ilusões arcanas e amplifica curas e escudos dos guardas.',
    conjuntosExclusivos: ['eco', 'vinculo'],
  },
];

function montarInimigosCalabouco(def, nivelNum) {
  const nivel = Math.round(15 + (nivelNum - 1) * 18);
  const pool = Object.entries(ELEMENTO_DA_ESPECIE).filter(([, el]) => def.elementos.includes(el));
  const e1 = pool[nivelNum % pool.length] || ['Brasinha', def.elementos[0]];
  const e2 = pool[(nivelNum + 1) % pool.length] || e1;
  return [
    [def.chefe, nivel + 4, def.elementos[0], { chefe: true, nome: def.chefe, bonus: { hp: 2.1, atk: 0.25, def: 0.2 } }],
    [e1[0], nivel, e1[1], { forma: nivel <= 40 ? 1 : nivel <= 80 ? 2 : 3 }],
    [e2[0], nivel, e2[1], { forma: nivel <= 40 ? 1 : nivel <= 80 ? 2 : 3 }],
  ];
}

export const CALABOUCOS_CATALOGO = DEF_CALABOUCOS.map((def) => {
  const conjuntos = [...new Set([...def.conjuntosExclusivos, 'cacador', 'sanguessuga'])];
  return {
    ...def,
    conjuntos,
    arteEntrada: `assets/confusion/interface/calaboucos/${def.id}/entrada.webp`,
    arenaChefe: `assets/confusion/interface/calaboucos/${def.id}/arena-chefe.webp`,
    arteChefe: `assets/confusion/interface/calaboucos/${def.id}/chefe.png`,
    icone: `assets/confusion/interface/calaboucos/${def.id}/icone.png`,
    niveis: Array.from({ length: CALABOUCOS_CFG.maxNiveis }, (_, idx) => {
      const nivel = idx + 1;
      return {
        nivel,
        energia: energiaCalabouco(nivel),
        pesosRaridade: pesosRaridadePorNivel(nivel),
        inimigos: montarInimigosCalabouco(def, nivel),
      };
    }),
  };
});

export const CALABOUCOS_POR_ID = Object.fromEntries(CALABOUCOS_CATALOGO.map((c) => [c.id, c]));
export const CALABOUCOS_POR_ELEMENTO = Object.fromEntries(
  CALABOUCOS_CATALOGO.flatMap((c) => c.elementos.map((el) => [el, c])),
);
export const calaboucoDoElemento = (el) => CALABOUCOS_POR_ELEMENTO[String(el || '').toLowerCase()] || null;

export function calaboucosDe(save) {
  const idle = save?.idle || (save ? (save.idle = {}) : {});
  if (!idle.calaboucos || typeof idle.calaboucos !== 'object') idle.calaboucos = {};
  const c = idle.calaboucos;
  c.maiorNivel ||= {};
  c.todosVivos ||= {};
  c.moedas = Math.max(0, Math.floor(Number(c.moedas) || 0));
  c.batalhasPagas ||= {};
  return c;
}

function marcarBatalhaCalaboucoPaga(c, batalhaId) {
  if (!batalhaId) return;
  c.batalhasPagas[batalhaId] = true;
  const keys = Object.keys(c.batalhasPagas);
  if (keys.length > ENERGIA_CFG.maxHistoricoBatalhas) {
    for (const k of keys.slice(0, keys.length - ENERGIA_CFG.maxHistoricoBatalhas)) delete c.batalhasPagas[k];
  }
}

export function nivelCalaboucoDesbloqueado(save, calaboucoId, nivel) {
  const cal = CALABOUCOS_POR_ID[calaboucoId];
  if (!cal || nivel < 1 || nivel > CALABOUCOS_CFG.maxNiveis) return false;
  if (nivel === 1) return true;
  const maior = Number(calaboucosDe(save).maiorNivel[calaboucoId]) || 0;
  return nivel <= maior + 1;
}

export function podeBatalhaRapidaCalabouco(save, calaboucoId, nivel) {
  return Boolean(calaboucosDe(save).todosVivos[`${calaboucoId}:${nivel}`]);
}

function extrairDesfechoCalabouco(batalhaOuResumo) {
  if (!batalhaOuResumo || typeof batalhaOuResumo !== 'object') return { venceu: false, todosVivos: false };
  if ('venceu' in batalhaOuResumo) return { venceu: Boolean(batalhaOuResumo.venceu), todosVivos: Boolean(batalhaOuResumo.todosVivos) };
  if (typeof EstrategiaRegras.resumoBatalha === 'function' && Array.isArray(batalhaOuResumo.aliados)) {
    const r = EstrategiaRegras.resumoBatalha(batalhaOuResumo);
    return { venceu: Boolean(r.venceu), todosVivos: Boolean(r.todosVivos) };
  }
  const vivos = Array.isArray(batalhaOuResumo.aliados) && batalhaOuResumo.aliados.every((a) => (a?.hp ?? 0) > 0);
  return { venceu: batalhaOuResumo.fim === 'vitoria', todosVivos: batalhaOuResumo.fim === 'vitoria' && vivos };
}

export function iniciarCalaboucoNivel(save, calaboucoId, nivel, { agoraMs = Date.now(), batalhaId = null } = {}) {
  const cal = CALABOUCOS_POR_ID[calaboucoId];
  const nvDef = cal?.niveis?.[nivel - 1];
  if (!nvDef) return { ok: false, motivo: 'Nível de calabouço inválido.' };
  if (!nivelCalaboucoDesbloqueado(save, calaboucoId, nivel)) return { ok: false, motivo: 'Nível ainda bloqueado.' };
  const g = gastarEnergia(save, nvDef.energia, agoraMs);
  if (!g.ok) return g;
  return { ok: true, batalhaId: batalhaId || `cal_${calaboucoId}_${nivel}_${agoraMs}`, calabouco: cal, nivel: nvDef, energiaRestante: g.atual };
}

function sortearRecompensasCalabouco(save, cal, nivelNum, rng) {
  const reliquias = [];
  const sortearUma = () => {
    const elemento = cal.elementos[Math.floor(rng() * cal.elementos.length) % cal.elementos.length];
    const conjunto = cal.conjuntos[Math.floor(rng() * cal.conjuntos.length) % cal.conjuntos.length];
    const raridade = sortearRaridadeCalabouco(nivelNum, rng);
    const res = concederReliquiaCampanha(save, {
      elemento,
      raridade,
      conjunto,
      fonte: `cal:${cal.id}:${nivelNum}`,
      rng,
    });
    if (res.ok && res.reliquia) reliquias.push(res.reliquia);
  };
  sortearUma();
  if (rng() < CALABOUCOS_CFG.chanceSegundaReliquia) sortearUma();

  const moedas = 5 + nivelNum * 2;
  const ouro = 250 + nivelNum * 75;
  calaboucosDe(save).moedas += moedas;
  save.recompensas = save.recompensas || { gold: 0, diamantes: 0, xp: 0 };
  save.recompensas.gold += ouro;
  return { reliquias, moedas, ouro };
}

export function concluirCalaboucoNivel(save, calaboucoId, nivel, batalhaOuResumo = { venceu: true, todosVivos: true }, { batalhaId = null, agoraMs = Date.now(), rng = Math.random } = {}) {
  const cal = CALABOUCOS_POR_ID[calaboucoId];
  const nvDef = cal?.niveis?.[nivel - 1];
  if (!nvDef) return { ok: false, motivo: 'Nível de calabouço inválido.' };
  if (!nivelCalaboucoDesbloqueado(save, calaboucoId, nivel)) return { ok: false, motivo: 'Nível ainda bloqueado.' };
  const c = calaboucosDe(save);
  if (batalhaId && c.batalhasPagas[batalhaId]) return { ok: true, jaPago: true, venceu: false, premios: {} };

  const desfecho = extrairDesfechoCalabouco(batalhaOuResumo);
  if (!desfecho.venceu) {
    if (batalhaId) marcarBatalhaCalaboucoPaga(c, batalhaId);
    return { ok: true, jaPago: false, venceu: false, premios: {} };
  }

  c.maiorNivel[calaboucoId] = Math.max(Number(c.maiorNivel[calaboucoId]) || 0, nivel);
  if (desfecho.todosVivos) c.todosVivos[`${calaboucoId}:${nivel}`] = true;

  const premios = sortearRecompensasCalabouco(save, cal, nivel, rng);
  let docesDrop = 0;
  for (let i = 0; i < (nvDef.inimigos?.length || 1); i++) {
    docesDrop += talvezDoce(save, 'calabouco', rng, new Date(agoraMs));
  }
  premios.doces = docesDrop;
  if (batalhaId) marcarBatalhaCalaboucoPaga(c, batalhaId);
  registrarMarco(save, 'calabouco', { calabouco: calaboucoId, nivel, qtd: 1 });
  return {
    ok: true,
    jaPago: false,
    venceu: true,
    todosVivos: desfecho.todosVivos,
    batalhaRapidaLiberada: Boolean(c.todosVivos[`${calaboucoId}:${nivel}`]),
    premios,
    agoraMs,
  };
}

export function batalhaRapidaCalabouco(save, calaboucoId, nivel, { agoraMs = Date.now(), rng = Math.random } = {}) {
  const cal = CALABOUCOS_POR_ID[calaboucoId];
  const nvDef = cal?.niveis?.[nivel - 1];
  if (!nvDef) return { ok: false, motivo: 'Nível de calabouço inválido.' };
  if (!podeBatalhaRapidaCalabouco(save, calaboucoId, nivel)) {
    return { ok: false, motivo: 'Batalha rápida exige vencer este nível com todos vivos.' };
  }
  const g = gastarEnergia(save, nvDef.energia, agoraMs);
  if (!g.ok) return g;
  const premios = sortearRecompensasCalabouco(save, cal, nivel, rng);
  let docesDrop = 0;
  for (let i = 0; i < (nvDef.inimigos?.length || 1); i++) {
    docesDrop += talvezDoce(save, 'calabouco', rng, new Date(agoraMs));
  }
  premios.doces = docesDrop;
  registrarMarco(save, 'calabouco', { calabouco: calaboucoId, nivel, qtd: 1 });
  return { ok: true, rapida: true, energiaRestante: g.atual, premios };
}

export function comprarReliquiaLojaCalabouco(save, calaboucoId, conjunto, { rng = Math.random } = {}) {
  const cal = CALABOUCOS_POR_ID[calaboucoId];
  if (!cal) return { ok: false, motivo: 'Calabouço inválido.' };
  if (!cal.conjuntos.includes(conjunto)) {
    return { ok: false, motivo: `Conjunto ${conjunto} não pertence à loja de ${cal.nome}.` };
  }
  const c = calaboucosDe(save);
  if (c.moedas < CALABOUCOS_CFG.custoLojaReliquia) {
    return { ok: false, motivo: `Faltam moedas do calabouço (precisa ${CALABOUCOS_CFG.custoLojaReliquia}, saldo ${c.moedas}).` };
  }
  const elemento = cal.elementos[Math.floor(rng() * cal.elementos.length) % cal.elementos.length];
  const raridade = rng() < 0.25 ? 'epica' : 'rara';
  const res = concederReliquiaCampanha(save, {
    elemento,
    raridade,
    conjunto,
    fonte: `cal-loja:${cal.id}`,
    rng,
  });
  if (!res.ok) return res;
  c.moedas -= CALABOUCOS_CFG.custoLojaReliquia;
  return { ok: true, reliquia: res.reliquia, moedasRestantes: c.moedas };
}
