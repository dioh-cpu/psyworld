// Núcleo de regras (porte JavaScript do core-py). Código puro, sem DOM.
// Valores provisórios até o teste do piloto (ver RESUMO_SISTEMAS.txt).

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const roundHalfUp = (x) => Math.floor(x + 0.5);

// ---- Sanidade (GDD v1.3) ----
export const SANITY_BANDS = [
  { min: 80, max: 100, name: 'Lúcido', fail: 0 },
  { min: 60, max: 79, name: 'Estável', fail: 0 },
  { min: 40, max: 59, name: 'Perturbado', fail: 0.05 },
  { min: 20, max: 39, name: 'Instável', fail: 0.15 },
  { min: 0, max: 19, name: 'Insano', fail: 0.30 },
];
export function sanityBand(s) {
  const v = clamp(Math.trunc(s), 0, 100);
  return SANITY_BANDS.find((b) => v >= b.min && v <= b.max);
}
export function affinityModifier(s, role) {
  if (role !== 'heroi' && role !== 'vilao') throw new Error('papel inválido');
  let d = 0.004 * (s - 50);
  if (role === 'vilao') d = -d;
  return clamp(d, -0.2, 0.2);
}

export const SOURCE_DELTAS = { descanso: 5, purificacao: 10, missao: 15, trauma: -5, magia_mental: -8, crueldade: -10, ritual: -15 };
const REPEATABLE = new Set(['descanso', 'purificacao', 'missao']);
export function applyChange(current, source, uses = 0, mentalResist = 0) {
  if (!(source in SOURCE_DELTAS)) throw new Error('fonte desconhecida');
  let d = SOURCE_DELTAS[source];
  if (REPEATABLE.has(source)) d = d / (1 + uses);
  if (d < 0) d = d * (1 - Math.min(0.5, Math.max(0, mentalResist)));
  return clamp(roundHalfUp(current + d), 0, 100);
}
const FAILURE_EFFECTS = ['hesitacao', 'resposta_impulsiva', 'perda_de_concentracao', 'desperdicio_limitado'];
// Falha em ação comum nunca bloqueia o progresso.
export function commonActionFailure(sanity, roll) {
  const fail = sanityBand(sanity).fail;
  if (roll >= fail) return { falhou: false, efeito: null, bloqueia: false };
  const idx = Math.min(FAILURE_EFFECTS.length - 1, Math.floor((roll / Math.max(fail, 1e-9)) * FAILURE_EFFECTS.length));
  return { falhou: true, efeito: FAILURE_EFFECTS[idx], bloqueia: false };
}

// ---- Ovos (GDD v1.3) ----
export function eligibleForms(s) {
  if (s <= 49) return ['natural', 'mutante'];
  if (s === 50) return ['natural'];
  return ['natural', 'abencoada'];
}
export function pickForm(s, roll) {
  const forms = eligibleForms(s);
  const extreme = s <= 10 || s >= 90;
  if (forms.length === 2 && extreme && roll < 0.6) return forms[forms.length - 1];
  return forms[Math.min(forms.length - 1, Math.floor(roll * forms.length))];
}
export const COMPAT = {
  heroi: { natural: 1, abencoada: 1, mutante: 0.5 },
  vilao: { natural: 1, abencoada: 0.5, mutante: 1 },
};
// Resultado fixado: reabrir o ovo devolve o mesmo resultado.
export function hatch(egg, sanity, roll) {
  if (egg.result) return egg.result;
  const form = pickForm(sanity, roll);
  const purity = { natural: 'neutra', abencoada: 'luz', mutante: 'neutra' }[form];
  egg.result = { species: egg.species, form, sanity_fixed: sanity, purity, mutated: form === 'mutante' };
  return egg.result;
}

// ---- Fusão e híbridos (GDD v1.9) ----
export const BASE_SUCCESS = { 1: 0.8, 2: 0.7, 3: 0.6, 4: 0.5, 5: 0.4 };
export function fusionSuccessChance(star, successes, failures, ore = 0) {
  let c = Math.max(0.2, BASE_SUCCESS[star] - 0.05 * successes);
  c += Math.min(0.25, 0.05 * failures);
  c += Math.min(0.3, Math.max(0, ore));
  return Math.min(0.95, c);
}
export function abilityEfficiency(level) {
  return 1 + 0.1 * (clamp(level, 1, 5) - 1);
}
export function absorbAbility(m, ability, keepNew) {
  m.hybrid = true;
  if (m.extraAbility == null || keepNew) {
    if (m.extraAbility === ability) {
      m.abilityLevels[ability] = Math.min(5, (m.abilityLevels[ability] || 1) + 1);
    } else {
      m.extraAbility = ability;
      m.abilityLevels[ability] = m.abilityLevels[ability] || 1;
    }
  }
  return m.extraAbility;
}
export function activeAbilities(m) {
  const base = m.abilities.slice(0, 4);
  return m.hybrid && m.extraAbility ? [...base, m.extraAbility] : base;
}
export function activeSlots(m) {
  return m.hybrid ? 5 : 4;
}

// ---- Batalha final (sem empate) ----
export function winChance(bot) {
  return Math.max(0.1, 0.7 - 0.1 * bot);
}
export function finalBattle(result, monster, bot, xpLoss = 25) {
  if (result !== 'vitoria' && result !== 'derrota') throw new Error('não há empate');
  if (result === 'vitoria') return { result, bot };
  monster.xp = Math.max(0, monster.xp - xpLoss);
  return { result, bot: bot + 1 };
}

// ---- Cronologia: ponte (GDD v1.3) ----
export function bridgeState(day) {
  if (day >= 8) return 'aberta';   // reabertura no dia 8
  if (day >= 4) return 'fechada';  // derrubada no dia 4
  return 'aberta';
}

// ---- Culinária (GDD v1.9) ----
export const RARITY = ['comum', 'rara', 'epica', 'lendaria', 'mitica'];
export const POT_MAX = { comum: 1, rara: 2, epica: 3, lendaria: 4 };
const EFFECT = { luz: 'cura', trevas: 'confusao', neutra: 'buff' };
const ADJ = { luz: 'Luminosa', trevas: 'Sombria', neutra: 'Simples' };
export function dominantPurity(items) {
  const c = { luz: 0, trevas: 0, neutra: 0 };
  items.forEach((i) => { c[i.purity] += 1; });
  const top = Math.max(c.luz, c.trevas, c.neutra);
  const leaders = Object.keys(c).filter((p) => c[p] === top);
  return leaders.length === 1 ? leaders[0] : 'neutra'; // empate vira neutra
}
export function cook({ base, complement = null, seasoning = null, pot, charcoal, skill = 0, roll }) {
  if (charcoal < 1) throw new Error('precisa de carvão');
  if (!(pot in POT_MAX)) throw new Error('panela inválida');
  const items = [base, complement, seasoning].filter(Boolean);
  const avgFresh = items.reduce((a, i) => a + i.freshness, 0) / items.length;
  const avgRar = items.reduce((a, i) => a + RARITY.indexOf(i.rarity), 0) / items.length;
  const rarIdx = Math.min(POT_MAX[pot], Math.round(avgRar + skill / 50));
  const purity = dominantPurity(items);
  const adj = ADJ[purity];
  const nome = base.name.includes(adj) ? base.name : `${base.name} ${adj}`;
  const out = { nome, efeito: EFFECT[purity], raridade: RARITY[rarIdx], penalidade: null, vinculoDelta: 5 };
  if (avgFresh < 0.2) out.penalidade = 'estragado', out.efeito = null, out.vinculoDelta = -5;
  else if (roll < 0.10) out.penalidade = 'queimado', out.efeito = null, out.vinculoDelta = -2;
  else if (avgFresh < 0.5 && roll < 0.25) out.penalidade = 'intoxicacao', out.vinculoDelta = -3;
  return out;
}

// ---- Campanha: traje segue o caminho (GDD v1.11/v1.12) ----
export const COSTUME = { base: 'base', heroi: 'luz', vilao: 'trevas' };

// ---- Gerador determinístico para testes ----
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- Fazenda: trabalho automático por aptidão (GDD v1.9 decisão 19 + ajuste v1.14) ----
// Aptidões de coleta: cortar (madeira), minerar (pedra e minério), garimpar (cristal).
export const WORK_TASKS = ['plantar', 'colher', 'minerar', 'cortar', 'garimpar', 'transportar', 'cozinhar', 'fabricar'];
export const WORK_LEVEL_MAX = 10;
export const XP_PER_WORK_LEVEL = 3; // tarefas concluídas por nível (provisório)

// Tarefas de coleta: recurso base por tarefa, sem penalidade.
export const GATHER_TASKS = {
  cortar: { resource: 'madeira', base: 2 },
  minerar: { resource: 'pedra', base: 2, extra: { minerio: 1 } },
  garimpar: { resource: 'cristal', base: 1 },
};
// Produção das outras tarefas, por dia.
export const PRODUCE = {
  plantar: { sementes: 2 }, colher: { raizes: 1 }, transportar: {}, cozinhar: { carvao: 1 }, fabricar: { peca: 1 },
};
const BASE_TASKS_PER_DAY = 3;

// workers: [{ id, aptitudes: { tarefa: nivel } }]. Cada tarefa vai ao livre com o maior nível naquela aptidão.
export function assignTasks(tasks, workers) {
  for (const t of tasks) if (!WORK_TASKS.includes(t)) throw new Error(`tarefa desconhecida: ${t}`);
  const busy = new Set();
  const mapping = {};
  const unassigned = [];
  for (const t of tasks) {
    const cands = workers.filter((w) => !busy.has(w.id) && (w.aptitudes?.[t] || 0) > 0);
    if (!cands.length) { unassigned.push(t); continue; }
    cands.sort((a, b) => (b.aptitudes[t] - a.aptitudes[t]) || (a.id < b.id ? -1 : 1));
    busy.add(cands[0].id);
    mapping[t] = cands[0].id;
  }
  return { mapping, unassigned };
}

// Velocidade e bônus crescem com o nível (1 a 10).
export const workSpeed = (level) => 1 + 0.1 * (clamp(level, 1, WORK_LEVEL_MAX) - 1);
export const workBonus = (level) => 1 + 0.05 * (clamp(level, 1, WORK_LEVEL_MAX) - 1);
export const tasksPerDay = (level) => Math.max(1, Math.round(BASE_TASKS_PER_DAY * workSpeed(level)));

// Produção de um dia de uma tarefa de coleta, para um monstrinho com esse nível.
export function gatherDay(task, level) {
  const g = GATHER_TASKS[task];
  if (!g) return {};
  const n = tasksPerDay(level);
  const out = { [g.resource]: Math.floor(g.base * workBonus(level) * n) };
  for (const [r, q] of Object.entries(g.extra || {})) out[r] = Math.floor(q * workBonus(level) * n);
  return out;
}

// Concluir tarefas dá XP de trabalho; a cada XP_PER_WORK_LEVEL sobe um nível, até 10.
export function addWorkXp(aptitudes, xp, task, tasks = 1) {
  const level = aptitudes[task] || 1;
  xp[task] = (xp[task] || 0) + tasks;
  while (xp[task] >= XP_PER_WORK_LEVEL * level && (aptitudes[task] || 0) < WORK_LEVEL_MAX) {
    xp[task] -= XP_PER_WORK_LEVEL * level;
    aptitudes[task] = (aptitudes[task] || 0) + 1;
  }
  return aptitudes[task];
}

// ---- Estrelas e cores (ajuste v1.14, provisório) ----
// ★1 a ★6 douradas; depois vermelha, roxa, laranja e arco-íris no final.
export const STAR_TIERS = [
  { cor: 'dourada', de: 1, ate: 6 },
  { cor: 'vermelha', de: 7, ate: 12 },
  { cor: 'roxa', de: 13, ate: 18 },
  { cor: 'laranja', de: 19, ate: 24 },
  { cor: 'arco-iris', de: 25, ate: 25 },
];
export const STAR_MAX = 25;
export function starColor(stars) {
  const n = clamp(Math.trunc(stars), 1, STAR_MAX);
  return STAR_TIERS.find((t) => n >= t.de && n <= t.ate).cor;
}
// Aptidão máxima depende das estrelas: para subir a aptidão é preciso ganhar estrela (proposta).
export function maxAptitudeFor(stars) {
  return clamp(Math.trunc(stars), 1, WORK_LEVEL_MAX);
}
// Fusão bem-sucedida dá +1 estrela ao principal (proposta).
export function starsAfterFusion(stars) {
  return Math.min(STAR_MAX, stars + 1);
}

// ---- Zona infinita (provisório) ----
// Cada andar fica mais forte que o anterior; força base 100, +8% por andar.
export const ENDLESS_BASE_POWER = 100;
export const ENDLESS_GROWTH = 0.08;
export function endlessFloorPower(floor) {
  const f = Math.max(1, Math.trunc(floor));
  return Math.round(ENDLESS_BASE_POWER * Math.pow(1 + ENDLESS_GROWTH, f - 1));
}
// Recompensas de um andar vencido. rng: função que devolve [0,1).
export function endlessRewards(floor, rng, eventActive = false) {
  const f = Math.max(1, Math.trunc(floor));
  const out = { gold: 10 + 5 * f, diamantes: f % 5 === 0 ? 1 : 0, fichas: f % 3 === 0 ? 1 : 0, evento: null };
  if (eventActive && rng() < 0.05) out.evento = 'doce_halloween';  // chance de item de evento (provisória)
  return out;
}
