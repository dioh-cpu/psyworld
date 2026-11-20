import test from 'node:test';
import assert from 'node:assert/strict';
import * as Y from './systems.js';

const DAY = 86400000;
const BR = 3 * 3600000;
const at = (y, m, d, h = 12) => Date.UTC(y, m - 1, d, h + 3); // hora de Brasília

test('starter: kit inicial e escudo nos 7 primeiros dias', () => {
  const r = Y.starterReward();
  assert.equal(r.diamantes, 300);
  assert.equal(r.fichas.permanente, 3);
  assert.equal(r.esferas.comum, 5);
  assert.equal(r.esferas.rara, 2);
  assert.equal(r.ovos, 1);
  assert.equal(Y.shieldActive(1), true);
  assert.equal(Y.shieldActive(7), true);
  assert.equal(Y.shieldActive(8), false);
  assert.equal(Y.encounterChance(1), Y.SHIELD_ENCOUNTER_CHANCE);
  assert.equal(Y.encounterChance(8), Y.ENCOUNTER_CHANCE);
});

test('login: sequência de 7 dias repete e cada dia tem recompensa fixa', () => {
  assert.equal(Y.loginRewardFor(1).diamantes, 20);
  assert.equal(Y.loginRewardFor(2).esferas.comum, 1);
  assert.equal(Y.loginRewardFor(3).fichas.permanente, 1);
  assert.equal(Y.loginRewardFor(6).ovos, 1);
  const d7 = Y.loginRewardFor(7);
  assert.equal(d7.esferas.epica, 1);
  assert.equal(d7.fichas.semanal, 0);   // fichas semanais saem só das capturas da semana (v1.33)
  assert.equal(Y.loginRewardFor(8).diamantes, Y.loginRewardFor(1).diamantes);
});

test('login: um resgate por dia; dia seguido soma; dia pulado reinicia', () => {
  const day1 = at(2026, 11, 20);
  assert.equal(Y.nextLoginStreak({ streak: 0, lastDay: 0 }, day1), 1);
  assert.equal(Y.nextLoginStreak({ streak: 3, lastDay: Y.brDayNumber(day1) }, day1 + 3600000), null);
  assert.equal(Y.nextLoginStreak({ streak: 3, lastDay: Y.brDayNumber(day1) }, day1 + DAY), 4);
  assert.equal(Y.nextLoginStreak({ streak: 3, lastDay: Y.brDayNumber(day1) }, day1 + 3 * DAY), 1);
});

test('passe (v1.34): XP acumulado 3k² + 33k; resgate paga só os níveis novos', () => {
  assert.equal(Y.passLevel(0), 0);
  assert.equal(Y.passXpAteNivel(1), 36);
  assert.equal(Y.passXpAteNivel(30), 3690);
  assert.equal(Y.passLevel(35), 0);
  assert.equal(Y.passLevel(36), 1);
  assert.equal(Y.passLevel(250), 5);
  assert.equal(Y.passLevel(999999), Y.PASS_LEVELS);
  let pass = { season: '2026-11', xp: 250, claimed: 0, premium: false };
  const first = Y.claimPass(pass);
  assert.equal(first.claimed, 5);
  assert.equal(first.reward.diamantes, 30);     // níveis 1, 3 e 5 (ímpares)
  assert.equal(first.reward.esferas.comum, 2);  // níveis 2 e 4 (pares)
  assert.equal(first.t5, 0);
  pass = { ...pass, claimed: first.claimed };
  assert.equal(Y.claimPass(pass).reward.diamantes, 0); // nada novo
});

test('passe premium: compra única por 5000 diamantes; entrega o T5 aleatório no nível 30', () => {
  assert.throws(() => Y.comprarPremium({ premium: false }, 4999));
  const c = Y.comprarPremium({ premium: false }, 5000);
  assert.equal(c.custo, 5000);
  assert.equal(c.pass.premium, true);
  assert.throws(() => Y.comprarPremium(c.pass, 9999));  // já comprado
  const cheio = Y.claimPass({ season: '2026-11', xp: 999999, claimed: 0, claimedPremium: 0, premium: true });
  assert.equal(cheio.t5, 1);
  assert.equal(cheio.claimedPremium, 30);
  assert.ok(cheio.reward.gold > 0);
  // premium comprado no meio da temporada: recebe os níveis já alcançados
  const tarde = Y.claimPass({ season: '2026-11', xp: 999999, claimed: 30, claimedPremium: 0, premium: true });
  assert.equal(tarde.claimedPremium, 30);
  assert.equal(tarde.t5, 1);
  // sem premium, não há T5 nem ouro da trilha premium
  const grátis = Y.claimPass({ season: '2026-11', xp: 999999, claimed: 0, claimedPremium: 0, premium: false });
  assert.equal(grátis.t5, 0);
  assert.equal(grátis.reward.gold, 0);
});

test('passe: nível 10 dá ovo e nível 30 dá esfera épica e ficha de evento', () => {
  assert.equal(Y.passRewardFor(10).ovos, 1);
  assert.equal(Y.passRewardFor(5).fichas.permanente, 1);
  const top = Y.passRewardFor(30);
  assert.equal(top.esferas.epica, 1);
  assert.equal(top.fichas.evento, 1);
});

test('passe: temporada nova zera XP e níveis, mas mantém o premium', () => {
  const pass = { season: '2026-11', xp: 900, claimed: 5, premium: true };
  assert.deepEqual(Y.refreshPass(pass, at(2026, 11, 15)), pass);
  const nova = Y.refreshPass(pass, at(2026, 12, 2));
  assert.deepEqual(nova, { season: '2026-12', xp: 0, claimed: 0, claimedPremium: 0, premium: true });
  assert.equal(Y.addPassXp(nova, 'batalha').xp, 50);
});

test('eventos: rodízio semanal e mensal no calendário de Brasília', () => {
  const EP = Y.EPOCH_TS;
  assert.equal(Y.weeklyEventAt(EP).id, 'lua');
  assert.equal(Y.weeklyEventAt(EP + 7 * DAY).id, 'fartura');
  assert.equal(Y.weeklyEventAt(EP + 21 * DAY).id, 'lua');   // três semanas: volta ao início
  assert.equal(Y.weeklyEventAt(EP - 1).id, 'cristal');      // domingo à noite pertence à semana anterior
  const ev = Y.activeEvents(at(2026, 1, 10));
  assert.ok(Y.MONTHLY_EVENTS.includes(ev.mensal));
  assert.ok(Y.WEEKLY_EVENTS.includes(ev.semanal));
});

test('exclusivos: cada evento tem um monstrinho que não é da lista geral', () => {
  for (const e of Y.MONTHLY_EVENTS) {
    assert.ok(Y.EVENT_SPECIES[e.exclusivo], e.exclusivo);
    assert.ok(!Y.BASE_SPECIES.includes(e.exclusivo));
  }
});

test('encontro: sem sorte, sem encontro; nunca sorteia monstrinho de evento', () => {
  assert.equal(Y.rollEncounter(Y.EPOCH_TS, 10, { r1: 0.99, r2: 0, r3: 0, r4: 0 }), null);
  for (const r3 of [0, 0.5, 0.99]) {
    const w = Y.rollEncounter(Y.EPOCH_TS, 10, { r1: 0, r2: 0, r3, r4: 0 });
    assert.ok(Y.BASE_SPECIES.includes(w.species));
    assert.equal(w.exclusivo, false);
  }
  assert.equal(Y.rollEncounter(Y.EPOCH_TS, 10, { r1: 0, r2: 0.9, r3: 0.99, r4: 0.999 }).rarity, 5); // mítica (monstrinho) sai 1% na exploração
  assert.equal(Y.rollEncounter(Y.EPOCH_TS, 10, { r1: 0, r2: 0.9, r3: 0.99, r4: 0.98 }).rarity, 4);
});

test('captura: esfera melhor que o monstrinho aumenta a chance; limites respeitados', () => {
  const wild = { rarity: 3, tier: 3 };
  assert.ok(Math.abs(Y.captureChance(3, wild) - 0.24) < 1e-9);  // 30% - 2 pontos x tier 3
  assert.ok(Y.captureChance(5, wild) > Y.captureChance(3, wild) || Y.captureChance(5, wild) === Y.CAPTURE.mitica);
  assert.ok(Y.captureChance(3, wild, 0.1) > Y.captureChance(3, wild));
  assert.equal(Y.captureChance(1, { rarity: 5, tier: 5 }), Y.CAPTURE.min);
  assert.ok(Y.captureChance(3, { rarity: 1, tier: 1 }) <= Y.CAPTURE.max);
  assert.equal(Y.captureChance(5, { rarity: 1, tier: 1 }), Y.CAPTURE.mitica); // mítica: 75% fixa, só de evento
});

test('captura: bônus vem do escudo e dos eventos ativos (semanal + mensal)', () => {
  const ts = Y.EPOCH_TS;
  const ev = Y.activeEvents(ts);
  const soEventos = ev.semanal.bonus.captura + ev.mensal.bonus.captura;
  // dia 1: eventos + escudo
  assert.ok(Math.abs(Y.captureBonus(ts, 1) - (soEventos + Y.SHIELD_CAPTURE_BONUS)) < 1e-9);
  // depois do escudo, só os eventos
  assert.ok(Math.abs(Y.captureBonus(ts, 30) - soEventos) < 1e-9);
});

test('esferas: comum, rara e épica se compram com gold; lendária custa 1500 diamantes', () => {
  const st = { gold: 45, diamonds: 1500, esferas: { comum: 0, rara: 0, epica: 0, lendaria: 0, mitica: 0 } };
  assert.equal(Y.buySphere(st, 'comum').valor, 10);
  assert.equal(st.gold, 35);
  assert.equal(st.esferas.comum, 1);
  assert.throws(() => Y.buySphere(st, 'rara')); // 40 gold, só tem 35
  assert.equal(st.gold, 35);                    // compra falha não debita
  st.gold = 40;
  assert.equal(Y.buySphere(st, 'rara').valor, 40);
  assert.equal(st.gold, 0);
  assert.equal(Y.buySphere(st, 'lendaria').valor, 1500);
  assert.equal(st.diamonds, 0);
  assert.equal(st.esferas.lendaria, 1);
  assert.throws(() => Y.buySphere(st, 'lendaria')); // sem diamantes
  assert.throws(() => Y.buySphere(st, 'mitica'));   // ainda não está à venda
  assert.throws(() => Y.buySphere(st, 'divina'));
});

test('captura: lendária tem 90% fixos, sem bônus de evento ou escudo', () => {
  for (const r of [1, 2, 3, 4, 5]) assert.equal(Y.captureChance(4, { rarity: r, tier: r }, 0.2), 0.9);
});

test('captura: tabela de esferas comum, rara e épica contra raridades 1 a 5', () => {
  const linha = (e) => [1, 2, 3, 4, 5].map((r) => Math.round(Y.captureChance(e, { rarity: r, tier: r }) * 100));
  assert.deepEqual(linha(1), [28, 14, 3, 3, 3]);
  assert.deepEqual(linha(2), [40, 26, 12, 3, 3]);
  assert.deepEqual(linha(3), [52, 38, 24, 10, 3]);
});

test('gold: encontro paga 5 x raridade; zona paga 10 + 5 por andar; kit inicial dá 100', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map((r) => Y.goldEncontro(r)), [5, 10, 15, 20, 25]);
  assert.equal(Y.goldAndar(1), 10);
  assert.equal(Y.goldAndar(10), 55);
  assert.equal(Y.goldAndar(20), 105);
  const st = { diamonds: 0, gold: 0, tickets: { permanente: 0, semanal: 0, evento: 0 }, esferas: {} };
  Y.applyReward(st, Y.starterReward());
  assert.equal(st.gold, 100);
  assert.equal(st.diamonds, 300);
});

test('drop: monstrinho rarer solta menos ovo; evento aumenta a chance', () => {
  assert.equal(Y.dropsEgg({ rarity: 1 }, 0.10), true);
  assert.equal(Y.dropsEgg({ rarity: 1 }, 0.20), false);
  assert.equal(Y.dropsEgg({ rarity: 5 }, 0.10), false);
  assert.equal(Y.dropsEgg({ rarity: 1 }, 0.20, 0.10), true);
});

test('aplicar recompensa: soma diamantes, esferas e fichas; devolve ovos', () => {
  const st = { diamonds: 0, esferas: { comum: 0, rara: 0, epica: 0, lendaria: 0, mitica: 0 }, tickets: { permanente: 0, semanal: 0, evento: 0 } };
  const ovos = Y.applyReward(st, Y.starterReward());
  assert.equal(ovos, 1);
  assert.equal(st.diamonds, 300);
  assert.equal(st.esferas.comum, 5);
  assert.equal(st.tickets.permanente, 3);
});
