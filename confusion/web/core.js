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

// ---- Breed e híbridos (GDD v1.9 + v1.16; o breed substitui a fusão) ----
// Breed = monstrinho principal + monstrinho ingrediente. O ingrediente é sempre consumido.
// A chance depende do tier do principal (curva provisória).
export const BASE_SUCCESS = { 1: 0.8, 2: 0.7, 3: 0.6, 4: 0.5, 5: 0.4 };
// Tier 6 a 10 ainda não tem valor decidido: cai 5 pontos por tier, com piso de 20% (provisório).
export const breedBaseSuccess = (tier) => BASE_SUCCESS[tier] ?? Math.max(0.2, 0.4 - 0.05 * (tier - 5));
export function breedSuccessChance(tier, successes, failures, ore = 0) {
  let c = Math.max(0.2, breedBaseSuccess(tier) - 0.05 * successes);
  c += Math.min(0.25, 0.05 * failures);
  c += Math.min(0.3, Math.max(0, ore));
  return Math.min(0.95, c);
}
export function abilityEfficiency(level) {
  return 1 + 0.1 * (clamp(level, 1, 5) - 1);
}
export function absorbAbility(m, ability, keepNew) {
  m.hybrid = true;
  m.abilities = m.abilities || [];
  // A habilidade absorvida entra na lista de habilidades do pai (as 4 primeiras são as base).
  if (!m.abilities.includes(ability)) m.abilities.push(ability);
  // Habilidade que o monstrinho já tem como base sobe o nível dela (até 5), sem ocupar o slot extra.
  if (m.abilities.slice(0, 4).includes(ability)) {
    m.abilityLevels[ability] = Math.min(5, (m.abilityLevels[ability] || 1) + 1);
    return m.extraAbility;
  }
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

// Aptidão não cresce com o trabalho: só sobe pelo breed com sucesso (ver breedSuccessEffects).

// ---- Raridade e tier (GDD v1.16) ----
// Raridade 1 a 5 (mesmos nomes da culinária). Nasce com o monstrinho e não muda.
// Tier começa igual à raridade (1 a 5) e só sobe pelo breed, até TIER_MAX.
export const RARITY_MAX = 5;
export const TIER_MAX = 10;
export const RARITY_WEIGHTS = [0.5, 0.3, 0.14, 0.05, 0.01]; // proposta: chance de nascer em cada raridade
export function rarityName(r) {
  return RARITY[clamp(Math.trunc(r), 1, RARITY_MAX) - 1];
}
// Rolagem para raridade. O shift (banner ou origem do ovo) empurra para cima, nunca para baixo.
export function rollRarity(roll, shift = 0) {
  let acc = 0;
  let base = RARITY_MAX;
  for (let i = 0; i < RARITY_WEIGHTS.length; i++) {
    acc += RARITY_WEIGHTS[i];
    if (roll < acc) { base = i + 1; break; }
  }
  return clamp(base + shift, 1, RARITY_MAX);
}
// Breed bem-sucedido: principal sobe 1 tier (teto 10) e 1 nível em todas as aptidões (teto 10).
// Breed bem-sucedido: o principal ganha 1 nível em todas as aptidões (teto 10). O tier do pai NÃO muda:
// quem sobe de tier é o ovo (ver breedEggTier).
export function breedSuccessEffects(m) {
  for (const k of Object.keys(m.aptitudes || {})) {
    m.aptitudes[k] = Math.min(WORK_LEVEL_MAX, m.aptitudes[k] + 1);
  }
  return m;
}

// ---- Invocação com garantia por lote (GDD v1.23): 10 garante tier 4; 50 garante tier 5 ----
// Tier de invocação = raridade. A garantia troca o último resultado se o lote não tiver o tier mínimo.
export const INVOCATION_GUARANTEE = [{ qtd: 50, tier: 5 }, { qtd: 10, tier: 4 }];
export function garantirLote(resultados, qtd) {
  const g = INVOCATION_GUARANTEE.find((x) => qtd >= x.qtd);
  if (!g || resultados.length === 0) return resultados;
  if (Math.max(...resultados.map((r) => r.rarity)) >= g.tier) return resultados;
  const out = resultados.slice();
  out[out.length - 1] = { ...out[out.length - 1], rarity: g.tier };
  return out;
}

// ---- Breed com tempo (GDD v1.23): 10 minutos em média, até 3 ao mesmo tempo, um monstrinho por breed por vez ----
export const BREED_MINUTES_MEDIA = 10;
export const BREED_SLOTS = 3;
// Duração entre 8 e 12 minutos (média de 10), conforme a rolagem.
export function breedDurationMs(roll) {
  return Math.round(BREED_MINUTES_MEDIA * 60000 * (0.8 + 0.4 * roll));
}
// Ids de monstrinhos que já estão em algum breed.
export function idsEmBreed(breeds) {
  return new Set(breeds.flatMap((b) => [b.mainId, b.ingId]));
}
// Motivo para não iniciar o breed agora, ou null se pode.
export function podeIniciarBreed(breeds, main, ing) {
  if (breeds.length >= BREED_SLOTS) return 'os 3 espaços de breed estão ocupados';
  const ocupados = idsEmBreed(breeds);
  if (main && ocupados.has(main.id)) return 'o principal já está em breed';
  if (ing && ocupados.has(ing.id)) return 'o ingrediente já está em breed';
  return ingredientStatus(main, ing);
}

// ---- Breed (GDD v1.22): ingrediente é usado até 3 vezes e nunca some; o ovo pode vir com tier acima do pai ----
export const INGREDIENT_MAX_USES = 3;
// Motivo para o par não poder fazer breed, ou null se pode. Exige o mesmo tier e ingrediente com usos disponíveis.
export function ingredientStatus(main, ing) {
  if (!main || !ing || ing.id === main.id) return 'escolha dois monstrinhos diferentes';
  if (ing.tier !== main.tier) return 'o breed exige monstrinhos do mesmo tier';
  if ((ing.usosIngrediente || 0) >= INGREDIENT_MAX_USES) return 'este ingrediente já foi usado 3 vezes';
  return null;
}
// Chance de o ovo sair com tier acima do pai (proposta): +2 em 5%, +1 em 35%, senão o mesmo tier.
export const BREED_TIER_UP = { mais2: 0.05, mais1: 0.35 };
export function breedEggTier(parentTier, roll) {
  let d = 0;
  if (roll < BREED_TIER_UP.mais2) d = 2;
  else if (roll < BREED_TIER_UP.mais2 + BREED_TIER_UP.mais1) d = 1;
  return clamp(parentTier + d, 1, TIER_MAX);
}

// ---- Ovos e invocação (GDD v1.16) ----
// Mutação e bênção são o que o ovo carrega. A variante vira aura ao redor do monstrinho,
// sem sprite novo por forma: uma camada por variante e pureza.
// Variantes: natural, mutante (de luz ou de trevas), abençoada (luz) e combinada (mutação + bênção, rarissima).
// Chances por origem (proposta). O resto dos ovos é natural.
export const FORM_CHANCE = {
  breed: { mutante: 0.15, abencoada: 0.15, combinada: 0.005 },
  zona: { mutante: 0.25, abencoada: 0.25, combinada: 0.01 },
  login: { mutante: 0.10, abencoada: 0.10, combinada: 0.002 },
  passe: { mutante: 0.10, abencoada: 0.10, combinada: 0.002 },
  selvagem: { mutante: 0.05, abencoada: 0.05, combinada: 0.0005 },
  inicial: {},
};
// roll define a forma; roll2 define a pureza da mutação; purezaFonte é a pureza do ingrediente (breed) ou do monstrinho selvagem.
// Mutação herda a pureza da fonte quando ela é luz ou trevas; senão, sai 50/50.
export function eggFor(origem, roll, roll2, purezaFonte = null) {
  const c = FORM_CHANCE[origem] || {};
  const comb = c.combinada || 0, mut = c.mutante || 0, ben = c.abencoada || 0;
  let form;
  if (roll < comb) form = 'combinada';
  else if (roll < comb + mut) form = 'mutante';
  else if (roll < comb + mut + ben) form = 'abencoada';
  else form = 'natural';
  let pureza = 'neutra';
  if (form === 'combinada' || form === 'abencoada') pureza = 'luz';
  else if (form === 'mutante') {
    if (purezaFonte === 'luz' || purezaFonte === 'trevas') pureza = purezaFonte;
    else pureza = roll2 < 0.5 ? 'luz' : 'trevas';
  }
  return { form, pureza };
}
export const eggFormFor = (origem, roll) => eggFor(origem, roll, 0).form;
export const breedEggForm = (roll) => eggFor('breed', roll, 0).form;
// Mutante e abençoado: +1 de raridade. Combinada: +2. Ovo de recompensa da zona: +1 (sem somar com a forma).
export const EGG_SHIFT = { natural: 0, mutante: 1, abencoada: 1, combinada: 2 };
export const PURITY_BY_FORM = { natural: 'neutra', abencoada: 'luz', mutante: 'neutra', combinada: 'luz' };
// Poder por variante (proposta): combinada é a mais forte, em dano, defesa e cura.
export const VARIANT_POWER = { natural: 1, mutante: 1.3, abencoada: 1.2, combinada: 2.0 };
// Força pela origem do monstrinho (GDD v1.29): evento e gacha semanal são mais fortes que os comuns (proposta).
export const CLASS_POWER = { comum: 1, semanal: 1.25, evento: 1.5 };
export function makeEgg(species, form, origem, pureza = 'neutra', tier = null) {
  return {
    species, form, origem, pureza, shift: Math.max(EGG_SHIFT[form] ?? 0, origem === 'zona' ? 1 : 0),
    ...(tier != null ? { tier } : {}),
  };
}
// Ao chocar, a raridade é rolada e o tier começa igual a ela. A variante vai para o monstrinho.
export function hatchEgg(egg, roll) {
  const rarity = rollRarity(roll, egg.shift ?? 0);
  const purity = egg.form === 'mutante' ? (egg.pureza || 'neutra') : (PURITY_BY_FORM[egg.form] ?? 'neutra');
  return {
    species: egg.species, form: egg.form, variant: egg.form, rarity, tier: egg.tier ?? rarity,
    purity, mutated: egg.form === 'mutante' || egg.form === 'combinada',
  };
}
// ---- Invocação com destaque, pesos por banner e garantia (GDD v1.28) ----
// Cada banner tem um oními em destaque: 5% por invocação. Sem sair o destaque em 150 invocações, o próximo é garantido.
export const BANNER_FEATURED = { permanente: 'Noctarn', semanal: 'Ignavor', evento: 'Vaelith' };
export const FEATURED_CHANCE = 0.05;
export const PITY_FEATURED = 150;
// Pesos de raridade por banner, em % (1 a 5). Proposta de redução forte das raridades altas.
export const BANNER_WEIGHTS = {
  permanente: [55, 30, 10, 4, 1],
  semanal: [55, 30, 10, 4, 1],
  evento: [50, 30, 12, 6, 2],
};
export function rarityByWeights(roll, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i] / total;
    if (roll < acc) return i + 1;
  }
  return weights.length;
}
// Uma invocação. pity = invocações seguidas sem o destaque do banner. rolls: { destaque, especie, raridade } em [0, 1).
export function invocationPull(banner, pool, pity, rolls) {
  const destaque = BANNER_FEATURED[banner];
  if (!destaque) throw new Error('banner desconhecido');
  const outros = pool.filter((s) => s !== destaque);
  const garantido = pity + 1 >= PITY_FEATURED;
  let species;
  if (garantido || !outros.length || rolls.destaque < FEATURED_CHANCE) {
    species = destaque;
  } else {
    species = outros[Math.min(outros.length - 1, Math.floor(rolls.especie * outros.length))];
  }
  const rarity = rarityByWeights(rolls.raridade, BANNER_WEIGHTS[banner]);
  const destacou = species === destaque;
  return { species, rarity, destaque: destacou, pity: destacou ? 0 : pity + 1 };
}

// ---- Zona infinita (decidido pelo autor, v1.15) ----
// Andares infinitos. Perder reinicia só o andar que não foi concluído.
export const ENDLESS_BASE_POWER = 100;
export const ENDLESS_GROWTH = 0.08;   // provisório
export function endlessFloorPower(floor) {
  const f = Math.max(1, Math.trunc(floor));
  return Math.round(ENDLESS_BASE_POWER * Math.pow(1 + ENDLESS_GROWTH, f - 1));
}
// Recompensas de um andar concluído.
// - 10 diamantes por andar; +50 diamantes a cada 10 andares (total de 150 a cada 10 andares).
// - Invocação no banner permanente a cada 3 andares; 3 invocações no banner semanal a cada 10; 3 no banner de evento a cada 15.
export function endlessRewards(floor, eventActive = false, rng = () => 1) {
  const f = Math.max(1, Math.trunc(floor));
  const out = { diamantes: 10, invocacoes: [], evento: null, ovo: f % 10 === 0 };  // ovo de recompensa a cada 10 andares
  if (f % 10 === 0) out.diamantes += 50;
  if (f % 3 === 0) out.invocacoes.push({ banner: 'permanente', qtd: 1 });
  if (f % 10 === 0) out.invocacoes.push({ banner: 'semanal', qtd: 3 });
  if (f % 15 === 0) out.invocacoes.push({ banner: 'evento', qtd: 3 });
  if (eventActive && rng() < 0.05) out.evento = 'doce_halloween';  // chance provisória
  return out;
}
// Combate provisório no andar infinito: poder do monstrinho contra o poder do andar.
// Poder = (10 por tier + 2 por nível de aptidão somado) x variante x origem. Chance limitada entre 5% e 95%.
export function monsterPower(m) {
  const apt = Object.values(m.aptitudes || {}).reduce((a, b) => a + b, 0);
  return (10 * m.tier + 2 * apt) * (VARIANT_POWER[m.variant] ?? 1) * (CLASS_POWER[m.classe] ?? 1);
}
export function endlessChance(m, floor) {
  return Math.min(0.95, Math.max(0.05, monsterPower(m) / endlessFloorPower(floor)));
}

// ---- Diamantes: compra com diamantes ganhos no jogo (v1.15). Dinheiro real não compra diamantes (v1.16). ----
export const INVOCATION_PRICE = 200;      // 2000 diamantes = 10 invocações
export const BULK_10_PRICE = 1500;        // comprar 10 de uma vez tem desconto
export function invocationCost(qtd) {
  if (qtd === 10) return BULK_10_PRICE;
  return qtd * INVOCATION_PRICE;
}
export function buyInvocations(diamonds, qtd) {
  const cost = invocationCost(qtd);
  if (diamonds < cost) throw new Error('diamantes insuficientes');
  return { diamonds: diamonds - cost, gasto: cost, qtd };
}
// Ganho por item/monstrinho/conquista: 1 diamante base; raridades altas dão mais (proposta).
export const DIAMOND_BY_RARITY = { comum: 1, rara: 1, epica: 2, lendaria: 3, mitica: 5 };
export function diamondsForItem(rarity) {
  return DIAMOND_BY_RARITY[rarity] ?? 1;
}
