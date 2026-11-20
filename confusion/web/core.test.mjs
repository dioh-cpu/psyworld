import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from './core.js';

test('faixas de sanidade e falhas', () => {
  assert.equal(C.sanityBand(100).name, 'Lúcido');
  assert.equal(C.sanityBand(79).name, 'Estável');
  assert.equal(C.sanityBand(59).name, 'Perturbado');
  assert.equal(C.sanityBand(39).name, 'Instável');
  assert.equal(C.sanityBand(19).name, 'Insano');
  assert.equal(C.sanityBand(50).fail, 0.05);
});
test('afinidade limitada e inversa para vilão', () => {
  assert.ok(Math.abs(C.affinityModifier(100, 'heroi') - 0.2) < 1e-9);
  assert.ok(Math.abs(C.affinityModifier(100, 'vilao') + 0.2) < 1e-9);
  assert.throws(() => C.affinityModifier(50, 'x'));
});
test('fontes repetíveis têm retorno decrescente', () => {
  assert.equal(C.applyChange(50, 'descanso', 0), 55);
  assert.equal(C.applyChange(50, 'descanso', 1), 53);
  assert.equal(C.applyChange(98, 'purificacao', 0), 100);
  assert.equal(C.applyChange(3, 'ritual', 0), 0);
});
test('falha em ação comum nunca bloqueia', () => {
  for (const r of [0, 0.1, 0.5, 0.99]) assert.equal(C.commonActionFailure(10, r).bloqueia, false);
  assert.equal(C.commonActionFailure(90, 0).falhou, false);
});
test('faixas de eclosão e forma fixada', () => {
  assert.deepEqual(C.eligibleForms(49), ['natural', 'mutante']);
  assert.deepEqual(C.eligibleForms(50), ['natural']);
  assert.deepEqual(C.eligibleForms(51), ['natural', 'abencoada']);
  const egg = { species: 'Ignavor', result: null };
  const a = C.hatch(egg, 50, 0);
  const b = C.hatch(egg, 5, 0.9);
  assert.equal(a, b);
  assert.equal(a.sanity_fixed, 50);
});
test('fusão: chance por estrela, piso, pity e teto', () => {
  assert.ok(Math.abs(C.fusionSuccessChance(1, 0, 0) - 0.8) < 1e-9);
  assert.ok(Math.abs(C.fusionSuccessChance(1, 20, 0) - 0.2) < 1e-9);
  assert.ok(Math.abs(C.fusionSuccessChance(5, 0, 99) - 0.65) < 1e-9);
  assert.ok(C.fusionSuccessChance(1, 0, 99, 1) <= 0.95 + 1e-9);
});
test('híbrido: 5 ativas, troca escolhida, duplicata sobe nível até 5', () => {
  const m = { hybrid: false, abilities: ['a', 'b', 'c', 'd'], extraAbility: null, abilityLevels: {} };
  assert.equal(C.activeSlots(m), 4);
  C.absorbAbility(m, 'x', true);
  assert.equal(C.activeSlots(m), 5);
  assert.equal(C.activeAbilities(m).length, 5);
  C.absorbAbility(m, 'y', false);
  assert.equal(m.extraAbility, 'x');
  for (let i = 0; i < 10; i++) C.absorbAbility(m, 'x', true);
  assert.equal(m.abilityLevels.x, 5);
  assert.ok(Math.abs(C.abilityEfficiency(5) - 1.4) < 1e-9);
});
test('batalha final sem empate; derrota tira XP até zero e fortalece o bot', () => {
  const m = { xp: 10 };
  assert.throws(() => C.finalBattle('empate', m, 0));
  const r = C.finalBattle('derrota', m, 0, 25);
  assert.equal(m.xp, 0);
  assert.equal(r.bot, 1);
});
test('ponte: fecha no dia 4 e reabre no dia 8', () => {
  assert.equal(C.bridgeState(3), 'aberta');
  assert.equal(C.bridgeState(4), 'fechada');
  assert.equal(C.bridgeState(7), 'fechada');
  assert.equal(C.bridgeState(8), 'aberta');
});
test('culinária: carvão obrigatório, panela limita raridade, variante por pureza', () => {
  const luz = { name: 'Raiz', purity: 'luz', freshness: 1, rarity: 'lendaria' };
  assert.throws(() => C.cook({ base: luz, pot: 'comum', charcoal: 0, roll: 0.9 }));
  const r = C.cook({ base: luz, pot: 'comum', charcoal: 1, skill: 99, roll: 0.9 });
  assert.equal(r.raridade, 'rara');
  assert.equal(r.efeito, 'cura');
  assert.equal(r.nome, 'Raiz Luminosa');
  const estragado = C.cook({ base: { ...luz, freshness: 0.1 }, pot: 'rara', charcoal: 1, roll: 0.9 });
  assert.equal(estragado.penalidade, 'estragado');
  assert.equal(estragado.efeito, null);
});
test('empate de pureza resolve para neutra (determinístico)', () => {
  const r = C.dominantPurity([{ purity: 'luz' }, { purity: 'trevas' }]);
  assert.equal(r, 'neutra');
});
test('gerador determinístico', () => {
  const a = C.mulberry32(42), b = C.mulberry32(42);
  assert.equal(a(), b());
});
