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
  assert.equal(d7.fichas.semanal, 1);
  assert.equal(Y.loginRewardFor(8).diamantes, Y.loginRewardFor(1).diamantes);
});

test('login: um resgate por dia; dia seguido soma; dia pulado reinicia', () => {
  const day1 = at(2026, 11, 20);
  assert.equal(Y.nextLoginStreak({ streak: 0, lastDay: 0 }, day1), 1);
  assert.equal(Y.nextLoginStreak({ streak: 3, lastDay: Y.brDayNumber(day1) }, day1 + 3600000), null);
  assert.equal(Y.nextLoginStreak({ streak: 3, lastDay: Y.brDayNumber(day1) }, day1 + DAY), 4);
  assert.equal(Y.nextLoginStreak({ streak: 3, lastDay: Y.brDayNumber(day1) }, day1 + 3 * DAY), 1);
});

test('passe: nível vem do XP; resgate paga só os níveis novos', () => {
  assert.equal(Y.passLevel(0), 0);
  assert.equal(Y.passLevel(250), 2);
  assert.equal(Y.passLevel(999999), Y.PASS_LEVELS);
  let pass = { season: '2026-11', xp: 250, claimed: 0, premium: false };
  const first = Y.claimPass(pass);
  assert.equal(first.claimed, 2);
  assert.equal(first.reward.diamantes, 10);     // nível 1 (ímpar)
  assert.equal(first.reward.esferas.comum, 1);  // nível 2 (par)
  pass = { ...pass, claimed: first.claimed };
  assert.equal(Y.claimPass(pass).reward.diamantes, 0); // nada novo
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
  assert.deepEqual(nova, { season: '2026-12', xp: 0, claimed: 0, premium: true });
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
  for (const e of [...Y.WEEKLY_EVENTS, ...Y.MONTHLY_EVENTS]) {
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
  assert.equal(Y.rollEncounter(Y.EPOCH_TS, 10, { r1: 0, r2: 0.9, r3: 0.99, r4: 0.999 }).rarity, 5);
});
test('missões: progresso completo libera o período; mudança de período zera', () => {
  const todas = { capturas: 3, andares: 5, breeds: 2, cozinhar: 2 };
  assert.equal(Y.missaoConcluida(todas), true);
  assert.equal(Y.missaoConcluida({ ...todas, breeds: 1 }), false);
  const ev = Y.WEEKLY_EVENTS[0];
  assert.notEqual(Y.missaoChave(ev, 'semanal', Y.EPOCH_TS), Y.missaoChave(ev, 'semanal', Y.EPOCH_TS + 7 * DAY));
  assert.equal(Y.missaoChave(ev, 'semanal', Y.EPOCH_TS), Y.missaoChave(ev, 'semanal', Y.EPOCH_TS + DAY));
});

test('captura: esfera melhor que o monstrinho aumenta a chance; limites respeitados', () => {
  const wild = { rarity: 3, tier: 3 };
  assert.ok(Math.abs(Y.captureChance(3, wild) - 0.44) < 1e-9);
  assert.ok(Y.captureChance(5, wild) > Y.captureChance(3, wild));
  assert.ok(Y.captureChance(3, wild, 0.1) > Y.captureChance(3, wild));
  assert.equal(Y.captureChance(1, { rarity: 5, tier: 5 }), Y.CAPTURE.min);
  assert.equal(Y.captureChance(5, { rarity: 1, tier: 1 }), Y.CAPTURE.max);
});

test('captura: bônus vem do escudo e dos eventos ativos', () => {
  const ts = Y.EPOCH_TS;
  // semana da Lua (+10%) + Halloween (sem captura) + escudo (+10%)
  assert.ok(Math.abs(Y.captureBonus(ts, 1) - 0.20) < 1e-9);
  // depois do escudo, só o evento
  assert.ok(Math.abs(Y.captureBonus(ts, 30) - 0.10) < 1e-9);
});

test('esferas: comum, rara e épica se compram com gold; lendária custa 1500 diamantes', () => {
  const st = { gold: 100, diamonds: 1500, esferas: { comum: 0, rara: 0, epica: 0, lendaria: 0, mitica: 0 } };
  assert.equal(Y.buySphere(st, 'comum').valor, 30);
  assert.equal(st.gold, 70);
  assert.equal(st.esferas.comum, 1);
  assert.throws(() => Y.buySphere(st, 'rara')); // 90 gold, só tem 70
  assert.equal(st.gold, 70);                    // compra falha não debita
  assert.equal(Y.buySphere(st, 'lendaria').valor, 1500);
  assert.equal(st.diamonds, 0);
  assert.equal(st.gold, 70);
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
  assert.deepEqual(linha(1), [48, 31, 14, 5, 5]);
  assert.deepEqual(linha(2), [63, 46, 29, 12, 5]);
  assert.deepEqual(linha(3), [78, 61, 44, 27, 10]);
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
