// Sistemas de engajamento e captura (GDD v1.17): starter, login, passe, eventos, esferas e drops.
// Código puro, sem DOM. Datas usam o horário de Brasília (UTC-3). Valores provisórios até o teste do piloto.
import { clamp, rarityByWeights, rarityName, RARITY, RARITY_BOSS, BANNER_FEATURED, monsterPower, multElemento } from './core.js';
import { ESPECIES, ESPECIES_BASE, ESPECIES_EVENTO } from './species.js';

const DAY_MS = 86400000;
const BR_OFFSET_MS = 3 * 3600000;
const mod = (a, n) => ((a % n) + n) % n;
export const brDayNumber = (ts) => Math.floor((ts - BR_OFFSET_MS) / DAY_MS);
export const EPOCH_TS = Date.UTC(2026, 0, 5, 3); // segunda-feira, 00:00 de Brasília (início dos ciclos semanais)
const EPOCH_DAY = brDayNumber(EPOCH_TS);
export const weekIndex = (ts) => Math.floor((brDayNumber(ts) - EPOCH_DAY) / 7);
const brDate = (ts) => new Date(ts - BR_OFFSET_MS);
export const monthIndex = (ts) => brDate(ts).getUTCFullYear() * 12 + brDate(ts).getUTCMonth();
export const seasonKey = (ts) => {
  const d = brDate(ts);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

// ---- Recompensas: formato único, usado por starter, login, passe e zona ----
export const emptyReward = () => ({
  diamantes: 0,
  gold: 0,
  esferas: { comum: 0, rara: 0, epica: 0, lendaria: 0, mitica: 0 },
  fichas: { permanente: 0, semanal: 0, evento: 0 },
  ovos: 0,
});
export function addInto(a, b) {
  a.diamantes += b.diamantes;
  a.gold += b.gold || 0;
  for (const k of RARITY) a.esferas[k] += b.esferas[k] || 0;
  for (const k of Object.keys(a.fichas)) a.fichas[k] += b.fichas[k] || 0;
  a.ovos += b.ovos || 0;
  return a;
}
// Aplica a recompensa no estado (diamantes, esferas e fichas). Devolve quantos ovos criar (a tela cria, com origem).
export function applyReward(state, r) {
  state.diamonds = (state.diamonds || 0) + r.diamantes;
  state.gold = (state.gold || 0) + (r.gold || 0);
  for (const k of RARITY) state.esferas[k] = (state.esferas[k] || 0) + (r.esferas[k] || 0);
  for (const k of Object.keys(r.fichas)) state.tickets[k] = (state.tickets[k] || 0) + (r.fichas[k] || 0);
  return r.ovos;
}

// ---- Starter: começar com ajuda extra ----
export const STARTER_KIT = { diamantes: 300, gold: 100, fichas: { permanente: 3 }, esferas: { comum: 5, rara: 2 }, ovos: 1 };
export const SHIELD_DAYS = 7;                 // escudo do começo: dias 1 a 7 do jogo
export const SHIELD_CAPTURE_BONUS = 0.10;     // +10 pontos na chance de captura
export const SHIELD_ENCOUNTER_CHANCE = 0.7;   // busca dá encontro em 70% das vezes (normal: 50%)
export function starterReward() {
  const r = emptyReward();
  r.diamantes = STARTER_KIT.diamantes;
  r.gold = STARTER_KIT.gold;
  Object.assign(r.fichas, STARTER_KIT.fichas);
  Object.assign(r.esferas, STARTER_KIT.esferas);
  r.ovos = STARTER_KIT.ovos;
  return r;
}
export const shieldActive = (day) => day <= SHIELD_DAYS;

// ---- Login: sequência de 7 dias que repete; perder um dia reinicia a sequência, sem perder o que já foi ganho ----
export const LOGIN_CYCLE = [
  { diamantes: 20 }, { esfera: 'comum' }, { ficha: 'permanente' }, { esfera: 'rara' },
  { diamantes: 30 }, { ovos: 1 }, { esfera: 'epica' },
];
export function loginRewardFor(streak) {
  const step = LOGIN_CYCLE[mod(streak - 1, LOGIN_CYCLE.length)];
  const r = emptyReward();
  r.diamantes = step.diamantes || 0;
  if (step.esfera) r.esferas[step.esfera] = 1;
  if (step.ficha) r.fichas[step.ficha] = 1;
  r.ovos = step.ovos || 0;
  return r;
}
// login: { streak, lastDay }. Devolve a nova sequência, ou null se já resgatou hoje.
export function nextLoginStreak(login, ts) {
  const today = brDayNumber(ts);
  if (login.lastDay === today) return null;
  return login.lastDay === today - 1 ? login.streak + 1 : 1;
}

// ---- Passe de batalha (v1.34): 30 níveis por temporada mensal, com XP calculável ----
// Custo do nível k: 30 + 6k XP. Total para completar k níveis: 3k² + 33k. Nível 30 = 3690 XP no mês.
export const PASS_LEVELS = 30;
export const PASS_XP = { dia: 10, andar: 15, breed: 15, batalha: 50, raid: 25 }; // captura: passXpCaptura
export const passXpCaptura = (raridade) => 10 + 5 * raridade;                       // 15 a 35
export const passCustoNivel = (k) => 30 + 6 * k;
export const passXpAteNivel = (k) => 3 * k * k + 33 * k;
export function passLevel(xp) {
  let k = 0;
  while (k < PASS_LEVELS && xp >= passXpAteNivel(k + 1)) k++;
  return k;
}
// Premium: compra única, em diamantes. Vale para todas as temporadas e entrega os prêmios dos níveis já alcançados.
export const PREMIUM_PRICE = 5000;
export const PASS_T5_NIVEL = PASS_LEVELS; // o último prêmio do premium é um T5 aleatório (nunca de evento)
// Trilha grátis: a de sempre.
export function passRewardFor(n) {
  const r = emptyReward();
  if (n % 2 === 1) r.diamantes = 10; else r.esferas.comum = 1;
  if (n % 5 === 0) r.fichas.permanente = 1;
  if (n % 10 === 0) r.ovos = 1;
  if (n === PASS_LEVELS) { r.esferas.epica = 1; r.fichas.evento = 1; }
  return r;
}
// Trilha premium: ouro em todo nível, mais esferas, fichas e ovos em intervalos. O T5 do nível 30 é tratado à parte.
export function passPremiumRewardFor(n) {
  const r = emptyReward();
  r.gold = 20 + 5 * n;
  if (n % 3 === 0) r.esferas.rara = 1;
  if (n % 6 === 0) r.esferas.epica = 1;
  if (n % 4 === 0) r.fichas.semanal = 1;
  if (n % 5 === 0) r.fichas.evento = 1;
  if (n % 10 === 0) r.ovos = 1;
  return r;
}
// pass: { season, xp, claimed, claimedPremium, premium }. Temporada nova zera XP e resgates; premium é mantido.
export function refreshPass(pass, ts) {
  const k = seasonKey(ts);
  return pass.season === k ? pass : { ...pass, season: k, xp: 0, claimed: 0, claimedPremium: 0 };
}
// Compra o premium. Devolve o passe novo e o custo; quem chama debita os diamantes.
export function comprarPremium(pass, diamantes) {
  if (pass.premium) throw new Error('premium já comprado');
  if (diamantes < PREMIUM_PRICE) throw new Error('diamantes insuficientes');
  return { pass: { ...pass, premium: true }, custo: PREMIUM_PRICE };
}
// Resgata os níveis alcançados. A trilha premium só entra se o passe tem premium (e vale retroativo na temporada).
export function claimPass(pass) {
  const lv = passLevel(pass.xp);
  const reward = emptyReward();
  let t5 = 0;
  for (let n = pass.claimed + 1; n <= lv; n++) addInto(reward, passRewardFor(n));
  const antesPremium = pass.claimedPremium || 0;
  if (pass.premium) {
    for (let n = antesPremium + 1; n <= lv; n++) {
      addInto(reward, passPremiumRewardFor(n));
      if (n === PASS_T5_NIVEL) t5++;
    }
  }
  return {
    reward, t5,
    claimed: Math.max(pass.claimed, lv),
    claimedPremium: pass.premium ? Math.max(antesPremium, lv) : antesPremium,
  };
}
export const addPassXp = (pass, fonte, quanto = PASS_XP[fonte] || 0) => ({ ...pass, xp: pass.xp + quanto });

// ---- Eventos semanais e mensais (calendário de Brasília) ----
// Semanas: só bônus de captura e de drop. Não têm monstrinho exclusivo (v1.33).
export const WEEKLY_EVENTS = [
  { id: 'lua', nome: 'Semana da Lua', bonus: { captura: 0.10, drop: 0 } },
  { id: 'fartura', nome: 'Semana da Fartura', bonus: { captura: 0, drop: 0.05 } },
  { id: 'cristal', nome: 'Semana do Cristal', bonus: { captura: 0.05, drop: 0.05 } },
];
// Eventos mensais (1 mês cada). Todo onírico de evento sai daqui, pela trilha de 7 dias (v1.33).
export const MONTHLY_EVENTS = [
  { id: 'halloween', nome: 'Festa de Halloween', exclusivo: 'Abyssar', bonus: { captura: 0, drop: 0.10 }, item: 'doce_halloween' },
  { id: 'solsticio', nome: 'Festival do Solstício', exclusivo: 'Solarin', bonus: { captura: 0.05, drop: 0.05 }, item: 'doce_solsticio' },
  { id: 'lua', nome: 'Noite da Lua Cheia', exclusivo: 'Lumivela', bonus: { captura: 0.10, drop: 0 }, item: 'doce_lua' },
  { id: 'fartura', nome: 'Colheita da Fartura', exclusivo: 'Brotavel', bonus: { captura: 0, drop: 0.05 }, item: 'doce_fartura' },
  { id: 'cristal', nome: 'Geada Cristalina', exclusivo: 'Cristalino', bonus: { captura: 0.05, drop: 0.05 }, item: 'doce_cristal' },
];
// Monstrinhos de evento vêm do catálogo de espécies (species.js), com origem 'evento'.
export const EVENT_SPECIES = Object.fromEntries(ESPECIES_EVENTO.map((k) => [k, {
  purity: ESPECIES[k].pureza, aptitudes: ESPECIES[k].aptidoes, abilities: ESPECIES[k].habilidades,
}]));
// Espécies base (encontro, ovo, breed e invocação) e a pureza de todas, do catálogo.
export const BASE_SPECIES = ESPECIES_BASE;
export const SPECIES_PURITY = Object.fromEntries(Object.entries(ESPECIES).map(([k, e]) => [k, e.pureza]));
const pick = (arr, i) => arr[mod(i, arr.length)];
export const weeklyEventAt = (ts) => pick(WEEKLY_EVENTS, weekIndex(ts));
export const monthlyEventAt = (ts) => pick(MONTHLY_EVENTS, monthIndex(ts));
export function activeEvents(ts) {
  return { semanal: weeklyEventAt(ts), mensal: monthlyEventAt(ts) };
}

// ---- Encontros selvagens (busca) ----
export const ENCOUNTER_CHANCE = 0.5;   // provisório
// Raridade dos encontros de exploração: até a lendária. Mítica não sai na exploração (v1.34): só de evento sazonal.
export const ENCOUNTER_WEIGHTS = [50, 30, 14, 5];
export function encounterChance(day) {
  return shieldActive(day) ? SHIELD_ENCOUNTER_CHANCE : ENCOUNTER_CHANCE;
}
// Monstrinhos de evento NÃO aparecem em encontros: saem de missões do evento.
// rolls: { r1, r2, r3, r4 } em [0, 1). Devolve null se a busca não achou nada.
export function rollEncounter(ts, day, rolls) {
  if (rolls.r1 >= encounterChance(day)) return null;
  const species = BASE_SPECIES[Math.floor(rolls.r3 * BASE_SPECIES.length)];
  const rarity = rarityByWeights(rolls.r4, ENCOUNTER_WEIGHTS);
  return { species, rarity, tier: rarity, purity: SPECIES_PURITY[species], exclusivo: false };
}

// ---- Evento mensal com trilha de 7 dias (v1.33) ----
// Nos dias 1 a 7 do mês, cada ação conta como missão: captura, andar da zona, breed, prato ou raid. Meta: 150.
// Do dia 7 até o fim do mês, com 100 ou mais, resgata o onírico do evento. Depois, a página 2 vende até 3 cópias extras.
export const TRILHA = { dias: 7, meta: 150, resgate: 100, copiasMax: 3, copiasPreco: [30, 50, 80] }; // cópias: preço em doces do evento
// Marcos: quando a contagem chega ao número, a recompensa cai na hora (uma vez por mês).
export const TRILHA_MARCOS = {
  25: { evento: 1 }, 50: { gold: 100 }, 75: { diamantes: 20 }, 100: { doce: 2 }, 125: { evento: 1 }, 150: { ovo: 1, mitica: 1 },
};
// Recompensa de dia: dias 1 a 7 da trilha e um item por semana depois (dias 14, 21 e 28). Resgate uma vez por dia.
export const TRILHA_DIAS = {
  1: { gold: 20 }, 2: { doce: 1 }, 3: { evento: 1 }, 4: { gold: 30 }, 5: { doce: 1 }, 6: { diamantes: 20 }, 7: { ovo: 1 },
  14: { evento: 1 }, 21: { evento: 1 }, 28: { evento: 1 },
};
export const diaDoMes = (ts) => brDate(ts).getUTCDate();
export const trilhaNova = (ts) => ({ chave: monthIndex(ts), missoes: 0, dias: [], resgatado: false, copias: 0 });
export const trilhaDoMes = (t, ts) => (t && t.chave === monthIndex(ts) ? t : trilhaNova(ts));
// Conta uma missão. Só conta nos 7 primeiros dias. Devolve a recompensa do marco, se a contagem chegou a um.
export function contaMissao(t, ts) {
  if (diaDoMes(ts) > TRILHA.dias || t.missoes >= TRILHA.meta) return { t, marco: null };
  const missoes = t.missoes + 1;
  return { t: { ...t, missoes }, marco: TRILHA_MARCOS[missoes] ?? null };
}
export const diaResgatavel = (t, ts, dia) => Boolean(TRILHA_DIAS[dia]) && diaDoMes(ts) >= dia && !t.dias.includes(dia);
export function resgatarDia(t, ts, dia) {
  if (!diaResgatavel(t, ts, dia)) throw new Error('recompensa indisponível');
  return { t: { ...t, dias: [...t.dias, dia] }, r: TRILHA_DIAS[dia] };
}
export const eventoResgatavel = (t, ts) => diaDoMes(ts) >= TRILHA.dias && t.missoes >= TRILHA.resgate && !t.resgatado;
export function resgatarEvento(t, ts) {
  if (!eventoResgatavel(t, ts)) throw new Error('ainda não dá para resgatar');
  return { ...t, resgatado: true };
}
// Página 2: cópias extras, só depois do resgate. Preço em doces da próxima cópia; null quando acabou.
export const copiaPreco = (t) => (t.resgatado && t.copias < TRILHA.copiasMax ? TRILHA.copiasPreco[t.copias] : null);
export function comprarCopia(t, doces) {
  const preco = copiaPreco(t);
  if (preco === null) throw new Error('sem cópias disponíveis');
  if (doces < preco) throw new Error('doces insuficientes');
  return { t: { ...t, copias: t.copias + 1 }, preco };
}

// ---- Fichas semanais (v1.33): 1 ficha a cada 3 capturas da semana, até 4 por semana ----
export const SEMANAL = { capturasPorFicha: 3, fichasMax: 4 };
export const semanaDoDia = (s, ts) => (s && s.chave === weekIndex(ts) ? s : { chave: weekIndex(ts), capturas: 0, fichas: 0 });
export function contaCapturaSemanal(s, ts) {
  const x = semanaDoDia(s, ts);
  const capturas = x.capturas + 1;
  const ganhou = capturas % SEMANAL.capturasPorFicha === 0 && x.fichas < SEMANAL.fichasMax ? 1 : 0;
  return { s: { ...x, capturas, fichas: x.fichas + ganhou }, fichas: ganhou };
}

// ---- Raid bosses (v1.33): um a cada 2 horas, no horário de Brasília, aberto 60 minutos ----
export const RAID = { janelaHoras: 2, duracaoMin: 60, fragmentosParaOvo: 10, chanceDoisFragmentos: 0.2, chanceMin: 0.05, chanceMax: 0.95 };
export const RAID_BOSSES = [
  { id: 'titan_cinza', nome: 'Titã de Cinza', pureza: 'neutra', elemento: 'fogo', poder: 120 },
  { id: 'serpe_abismo', nome: 'Serpe do Abismo', pureza: 'trevas', elemento: 'trevas', poder: 150 },
  { id: 'coroa_solar', nome: 'Coroa Solar', pureza: 'luz', elemento: 'luz', poder: 150 },
];
const JANELA_MS = RAID.janelaHoras * 3600000;
export function raidAt(ts) {
  const janela = Math.floor((ts - BR_OFFSET_MS) / JANELA_MS);
  const inicioMs = janela * JANELA_MS + BR_OFFSET_MS;
  return {
    janela, inicioMs,
    aberto: ts - inicioMs < RAID.duracaoMin * 60000,
    proximoMs: inicioMs + JANELA_MS,
    boss: RAID_BOSSES[mod(janela, RAID_BOSSES.length)],
  };
}
export const horaBrasilia = (ms) => {
  const d = new Date(ms - BR_OFFSET_MS);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};
// Chance de vencer o boss: poder do monstrinho (com o elemento contra o boss) sobre o poder do boss, dentro de limites.
export const chanceRaid = (m, boss) => clamp(monsterPower(m) * multElemento(m.elemento, boss.elemento) / boss.poder, RAID.chanceMin, RAID.chanceMax);
export const fragmentosVitoria = (roll) => (roll < RAID.chanceDoisFragmentos ? 2 : 1);
// Ovo de raid: tier de 10 a 15. Ao chocar, 40% saem boss e 60% saem mítica.
export const tierOvoRaid = (roll) => 10 + Math.min(5, Math.floor(roll * 6));
export const raridadeOvoRaid = (roll) => (roll < 0.4 ? RARITY_BOSS : 5);

// ---- Clone na hora de chocar (v1.33): oníricos de banner e de evento podem sair em dobro ----
export const CLONE_CHANCE = 0.12;
export const CLONAVEIS = new Set([...Object.values(BANNER_FEATURED), ...ESPECIES_EVENTO]);
export const chanceClone = (especie) => (CLONAVEIS.has(especie) ? CLONE_CHANCE : 0);

// ---- Transferência (v1.33): o monstrinho sacrificado passa os atributos ao destino e some. Custa diamantes pelo tipo dele. ----
export const TRANSFERENCIA = { base: 300, banner: 1500, evento: 2500, raid: 4000, maximo: 2 };
// No máximo: tier 10 e mítica (faixa normal), ou tier 15 e boss (raid). Dobra o custo.
export const noMaximo = (m) => (m.tier >= 10 && m.rarity === 5) || (m.tier >= 15 && m.rarity >= RARITY_BOSS);
export function custoTransferencia(m) {
  return TRANSFERENCIA[m.origem || 'base'] * (noMaximo(m) ? TRANSFERENCIA.maximo : 1);
}

// ---- Esferas psíquicas: uma por tentativa, consumida no lançamento ----
// Chance = 30% + 12 pontos por nível de esfera acima da raridade do monstrinho - 2 pontos por tier. Piso 3%, teto 90%.
// Esfera lendária: 90% fixa, é o teto da época (não soma bônus). Mítica: 75% fixa, só vem de evento sazonal.
export const CAPTURE = { base: 0.30, porEsfera: 0.12, porTier: 0.02, min: 0.03, max: 0.90, lendaria: 0.90, mitica: 0.75 };
const ESFERA_LENDARIA = RARITY.indexOf('lendaria') + 1;
const ESFERA_MITICA = RARITY.indexOf('mitica') + 1;
export function captureChance(esferaRaridade, wild, bonus = 0) {
  if (esferaRaridade === ESFERA_LENDARIA) return CAPTURE.lendaria;
  if (esferaRaridade === ESFERA_MITICA) return CAPTURE.mitica;
  const c = CAPTURE.base + CAPTURE.porEsfera * (esferaRaridade - wild.rarity) - CAPTURE.porTier * wild.tier + bonus;
  return clamp(c, CAPTURE.min, CAPTURE.max);
}
// Bônus de captura vindo dos eventos ativos e do escudo do começo.
export function captureBonus(ts, day) {
  const ev = activeEvents(ts);
  return ev.semanal.bonus.captura + ev.mensal.bonus.captura + (shieldActive(day) ? SHIELD_CAPTURE_BONUS : 0);
}
// ---- Gold: moeda de jogo para esferas comuns, raras e épicas. Ganha jogando; não se compra com dinheiro real. ----
export const GOLD = {
  encontroPorRaridade: 5,  // fim de cada encontro (captura, fuga ou esfera que falhou): 5 x raridade = 5 a 25
  andarBase: 10,           // zona infinita: 10 no andar 1 e +5 a cada andar
  andarPasso: 5,
  batalhaFinal: 100,       // vitória contra o bot (uma vez)
};
export const goldEncontro = (raridade) => GOLD.encontroPorRaridade * raridade;
export const goldAndar = (andar) => GOLD.andarBase + GOLD.andarPasso * (Math.max(1, andar) - 1);
// Preços de venda. Comum, rara e épica: gold. Lendária: 1500 diamantes, captura com 90% fixos. Mítica: sem venda por enquanto.
export const SPHERE_PRICE = {
  comum: { moeda: 'gold', valor: 10 },
  rara: { moeda: 'gold', valor: 40 },
  epica: { moeda: 'gold', valor: 120 },
  lendaria: { moeda: 'diamonds', valor: 1500 },
};
export function buySphere(state, nome) {
  const p = SPHERE_PRICE[nome];
  if (!p) throw new Error('esfera não está à venda');
  if ((state[p.moeda] || 0) < p.valor) throw new Error(`${p.moeda === 'gold' ? 'gold' : 'diamantes'} insuficiente`);
  state[p.moeda] -= p.valor;
  state.esferas[nome] = (state.esferas[nome] || 0) + 1;
  return p;
}

// ---- Drop de ovos: monstrinhos selvagens soltam ovo ao fim do encontro (captura ou fuga) ----
export const DROP_CHANCE = { comum: 0.15, rara: 0.12, epica: 0.09, lendaria: 0.06, mitica: 0.03 };
export function dropBonus(ts) {
  const ev = activeEvents(ts);
  return ev.semanal.bonus.drop + ev.mensal.bonus.drop;
}
export function dropsEgg(wild, roll, bonus = 0) {
  const base = DROP_CHANCE[rarityName(wild.rarity)] ?? 0;
  return roll < clamp(base + bonus, 0, 1);
}
