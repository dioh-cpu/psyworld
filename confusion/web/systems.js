// Sistemas de engajamento e captura (GDD v1.17): starter, login, passe, eventos, esferas e drops.
// Código puro, sem DOM. Datas usam o horário de Brasília (UTC-3). Valores provisórios até o teste do piloto.
import { clamp, rollRarity, rarityName, RARITY } from './core.js';

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
  esferas: { comum: 0, rara: 0, epica: 0, lendaria: 0, mitica: 0 },
  fichas: { permanente: 0, semanal: 0, evento: 0 },
  ovos: 0,
});
export function addInto(a, b) {
  a.diamantes += b.diamantes;
  for (const k of RARITY) a.esferas[k] += b.esferas[k] || 0;
  for (const k of Object.keys(a.fichas)) a.fichas[k] += b.fichas[k] || 0;
  a.ovos += b.ovos || 0;
  return a;
}
// Aplica a recompensa no estado (diamantes, esferas e fichas). Devolve quantos ovos criar (a tela cria, com origem).
export function applyReward(state, r) {
  state.diamonds = (state.diamonds || 0) + r.diamantes;
  for (const k of RARITY) state.esferas[k] = (state.esferas[k] || 0) + (r.esferas[k] || 0);
  for (const k of Object.keys(r.fichas)) state.tickets[k] = (state.tickets[k] || 0) + (r.fichas[k] || 0);
  return r.ovos;
}

// ---- Starter: começar com ajuda extra ----
export const STARTER_KIT = { diamantes: 300, fichas: { permanente: 3 }, esferas: { comum: 5, rara: 2 }, ovos: 1 };
export const SHIELD_DAYS = 7;                 // escudo do começo: dias 1 a 7 do jogo
export const SHIELD_CAPTURE_BONUS = 0.10;     // +10 pontos na chance de captura
export const SHIELD_ENCOUNTER_CHANCE = 0.7;   // busca dá encontro em 70% das vezes (normal: 50%)
export function starterReward() {
  const r = emptyReward();
  r.diamantes = STARTER_KIT.diamantes;
  Object.assign(r.fichas, STARTER_KIT.fichas);
  Object.assign(r.esferas, STARTER_KIT.esferas);
  r.ovos = STARTER_KIT.ovos;
  return r;
}
export const shieldActive = (day) => day <= SHIELD_DAYS;

// ---- Login: sequência de 7 dias que repete; perder um dia reinicia a sequência, sem perder o que já foi ganho ----
export const LOGIN_CYCLE = [
  { diamantes: 20 }, { esfera: 'comum' }, { ficha: 'permanente' }, { esfera: 'rara' },
  { diamantes: 30 }, { ovos: 1 }, { esfera: 'epica', ficha: 'semanal' },
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

// ---- Passe de batalha: 30 níveis por temporada mensal ----
export const PASS_LEVELS = 30;
export const PASS_XP_PER_LEVEL = 100;
export const PASS_XP = { dia: 10, andar: 15, captura: 20, breed: 15, batalha: 50 };
export const passLevel = (xp) => Math.min(PASS_LEVELS, Math.floor(xp / PASS_XP_PER_LEVEL));
// Recompensa do nível n (1 a 30). Premium é só cosmético e não entra aqui.
export function passRewardFor(n) {
  const r = emptyReward();
  if (n % 2 === 1) r.diamantes = 10; else r.esferas.comum = 1;
  if (n % 5 === 0) r.fichas.permanente = 1;
  if (n % 10 === 0) r.ovos = 1;
  if (n === PASS_LEVELS) { r.esferas.epica = 1; r.fichas.evento = 1; }
  return r;
}
// pass: { season, xp, claimed, premium }. Temporada nova zera XP e níveis resgatados; premium é mantido.
export function refreshPass(pass, ts) {
  const k = seasonKey(ts);
  return pass.season === k ? pass : { ...pass, season: k, xp: 0, claimed: 0 };
}
// Resgata todos os níveis alcançados e ainda não resgatados.
export function claimPass(pass) {
  const lv = passLevel(pass.xp);
  const reward = emptyReward();
  for (let n = pass.claimed + 1; n <= lv; n++) addInto(reward, passRewardFor(n));
  return { reward, claimed: Math.max(pass.claimed, lv) };
}
export const addPassXp = (pass, fonte) => ({ ...pass, xp: pass.xp + (PASS_XP[fonte] || 0) });

// ---- Eventos semanais e mensais (calendário de Brasília) ----
export const WEEKLY_EVENTS = [
  { id: 'lua', nome: 'Semana da Lua', exclusivo: 'Lumivela', bonus: { captura: 0.10, drop: 0 } },
  { id: 'fartura', nome: 'Semana da Fartura', exclusivo: 'Brotavel', bonus: { captura: 0, drop: 0.05 } },
  { id: 'cristal', nome: 'Semana do Cristal', exclusivo: 'Cristalino', bonus: { captura: 0.05, drop: 0.05 } },
];
export const MONTHLY_EVENTS = [
  { id: 'halloween', nome: 'Festa de Halloween', exclusivo: 'Abyssar', bonus: { captura: 0, drop: 0.10 }, item: 'doce_halloween' },
  { id: 'solsticio', nome: 'Festival do Solstício', exclusivo: 'Solarin', bonus: { captura: 0.05, drop: 0.05 }, item: 'doce_solsticio' },
];
// Monstrinhos exclusivos de evento (nomes e habilidades provisórios). Só aparecem com o evento ativo.
export const EVENT_SPECIES = {
  Lumivela: { purity: 'luz', aptitudes: { colher: 2, transportar: 2 }, abilities: ['Pétala Lunar', 'Brilho Sereno', 'Véu Prateado', 'Canto da Lua', 'Orvalho Astral'] },
  Brotavel: { purity: 'luz', aptitudes: { plantar: 3, colher: 2 }, abilities: ['Raiz Viva', 'Espora Verde', 'Broto Fértil', 'Chuva Doce', 'Casca Firme'] },
  Cristalino: { purity: 'neutra', aptitudes: { garimpar: 3, minerar: 2 }, abilities: ['Lasca Prismática', 'Eco Glacial', 'Facetas', 'Brilho Frio', 'Núcleo Puro'] },
  Abyssar: { purity: 'trevas', aptitudes: { minerar: 2, cortar: 2 }, abilities: ['Sombra Funda', 'Fenda Negra', 'Garra Abissal', 'Sussurro', 'Maré Escura'] },
  Solarin: { purity: 'luz', aptitudes: { cortar: 2, fabricar: 2 }, abilities: ['Chama Solar', 'Raio Dourado', 'Asas de Sol', 'Calor Lento', 'Aurora'] },
};
// Espécies do piloto que aparecem em qualquer encontro (sem evento). Pureza de todas.
export const BASE_SPECIES = ['Noctarn', 'Ignavor', 'Vaelith'];
export const SPECIES_PURITY = {
  Noctarn: 'trevas', Ignavor: 'luz', Vaelith: 'luz',
  ...Object.fromEntries(Object.entries(EVENT_SPECIES).map(([k, v]) => [k, v.purity])),
};
const pick = (arr, i) => arr[mod(i, arr.length)];
export const weeklyEventAt = (ts) => pick(WEEKLY_EVENTS, weekIndex(ts));
export const monthlyEventAt = (ts) => pick(MONTHLY_EVENTS, monthIndex(ts));
export function activeEvents(ts) {
  return { semanal: weeklyEventAt(ts), mensal: monthlyEventAt(ts) };
}

// ---- Encontros selvagens (busca) ----
export const ENCOUNTER_CHANCE = 0.5;   // provisório
export function encounterChance(day) {
  return shieldActive(day) ? SHIELD_ENCOUNTER_CHANCE : ENCOUNTER_CHANCE;
}
// Monstrinhos de evento NÃO aparecem em encontros: saem de missões do evento.
// rolls: { r1, r2, r3, r4 } em [0, 1). Devolve null se a busca não achou nada.
export function rollEncounter(ts, day, rolls) {
  if (rolls.r1 >= encounterChance(day)) return null;
  const species = BASE_SPECIES[Math.floor(rolls.r3 * BASE_SPECIES.length)];
  const rarity = rollRarity(rolls.r4, 0);
  return { species, rarity, tier: rarity, purity: SPECIES_PURITY[species], exclusivo: false };
}

// ---- Missões de evento: completar todas libera o monstrinho exclusivo do evento (uma vez por período) ----
export const EVENT_MISSIONS = [
  { tipo: 'capturas', meta: 3, texto: 'Capture 3 monstrinhos' },
  { tipo: 'andares', meta: 5, texto: 'Avance 5 andares na zona infinita' },
  { tipo: 'breeds', meta: 2, texto: 'Inicie 2 breeds' },
  { tipo: 'cozinhar', meta: 2, texto: 'Cozinhe 2 pratos' },
];
// Período do evento: semana para o semanal, mês para o mensal. Muda o período, zera o progresso.
export const missaoChave = (evento, tipo, ts) => `${evento.id}-${tipo === 'semanal' ? weekIndex(ts) : monthIndex(ts)}`;
export const missaoConcluida = (progresso) => EVENT_MISSIONS.every((x) => (progresso[x.tipo] || 0) >= x.meta);

// ---- Esferas psíquicas: uma por tentativa, consumida no lançamento ----
export const CAPTURE = { base: 0.5, porRaridade: 0.12, porTier: 0.02, min: 0.05, max: 0.9 };
export function captureChance(esferaRaridade, wild, bonus = 0) {
  const c = CAPTURE.base + CAPTURE.porRaridade * (esferaRaridade - wild.rarity) - CAPTURE.porTier * wild.tier + bonus;
  return clamp(c, CAPTURE.min, CAPTURE.max);
}
// Bônus de captura vindo dos eventos ativos e do escudo do começo.
export function captureBonus(ts, day) {
  const ev = activeEvents(ts);
  return ev.semanal.bonus.captura + ev.mensal.bonus.captura + (shieldActive(day) ? SHIELD_CAPTURE_BONUS : 0);
}
export const SPHERE_PRICE = { comum: 40, rara: 150, epica: 400, lendaria: 1000, mitica: 2500 }; // proposta: compra só com diamantes ganhos
export function buySphere(state, nome) {
  const price = SPHERE_PRICE[nome];
  if (price === undefined) throw new Error('esfera desconhecida');
  if ((state.diamonds || 0) < price) throw new Error('diamantes insuficientes');
  state.diamonds -= price;
  state.esferas[nome] = (state.esferas[nome] || 0) + 1;
  return price;
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
