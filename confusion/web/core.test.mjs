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

test('fazenda: tarefa vai ao monstrinho com maior nível naquela aptidão', () => {
  const workers = [
    { id: 'a', aptitudes: { plantar: 3 } },
    { id: 'b', aptitudes: { plantar: 5, colher: 2 } },
  ];
  const r = C.assignTasks(['plantar', 'colher', 'minerar'], workers);
  assert.equal(r.mapping.plantar, 'b');
  assert.equal(r.mapping.colher, undefined);   // b já está ocupado com plantar
  assert.deepEqual(r.unassigned, ['colher', 'minerar']);
});
test('fazenda: monstrinho ocupado não recebe segunda tarefa', () => {
  const workers = [{ id: 'a', aptitudes: { plantar: 5, colher: 5 } }];
  const r = C.assignTasks(['plantar', 'colher'], workers);
  assert.deepEqual(r.mapping, { plantar: 'a' });
  assert.deepEqual(r.unassigned, ['colher']);
});
test('fazenda: tarefa desconhecida é erro', () => {
  assert.throws(() => C.assignTasks(['voar'], []));
});
test('coleta automática: sem aptidão, não coleta', () => {
  const workers = [{ id: 'a', aptitudes: { plantar: 4 } }];
  const r = C.assignTasks(['cortar', 'minerar', 'garimpar'], workers);
  assert.deepEqual(r.unassigned, ['cortar', 'minerar', 'garimpar']);
});
test('coleta: nível mais alto dá mais velocidade e bônus; nível 10 é o teto', () => {
  assert.equal(C.tasksPerDay(1), 3);
  assert.ok(C.tasksPerDay(10) > C.tasksPerDay(1));
  assert.ok(C.gatherDay('cortar', 10).madeira > C.gatherDay('cortar', 1).madeira);
  assert.equal(C.workBonus(10), C.workBonus(99));
  assert.equal(C.workSpeed(10), C.workSpeed(50));
});
test('coleta: sem penalidade (quantidade cheia no dia)', () => {
  assert.equal(C.gatherDay('cortar', 1).madeira, 6);       // 2 de base x 3 tarefas
  assert.equal(C.gatherDay('garimpar', 1).cristal, 3);
  assert.equal(C.gatherDay('minerar', 1).minerio, 3);
});
test('XP de trabalho sobe o nível e para em 10', () => {
  const apt = { cortar: 1 }; const xp = {};
  for (let i = 0; i < 3; i++) C.addWorkXp(apt, xp, 'cortar');
  assert.equal(apt.cortar, 2);
  for (let i = 0; i < 500; i++) C.addWorkXp(apt, xp, 'cortar');
  assert.equal(apt.cortar, 10);
});

test('estrelas: douradas até 6, depois vermelha, roxa, laranja e arco-íris', () => {
  assert.equal(C.starColor(1), 'dourada');
  assert.equal(C.starColor(6), 'dourada');
  assert.equal(C.starColor(7), 'vermelha');
  assert.equal(C.starColor(13), 'roxa');
  assert.equal(C.starColor(19), 'laranja');
  assert.equal(C.starColor(25), 'arco-iris');
  assert.equal(C.starColor(99), 'arco-iris');
});
test('aptidão máxima acompanha as estrelas, até 10', () => {
  assert.equal(C.maxAptitudeFor(3), 3);
  assert.equal(C.maxAptitudeFor(12), 10);
});
test('fusão bem-sucedida sobe uma estrela, até o máximo', () => {
  assert.equal(C.starsAfterFusion(3), 4);
  assert.equal(C.starsAfterFusion(25), 25);
});
test('zona infinita: cada andar fica mais forte', () => {
  assert.equal(C.endlessFloorPower(1), 100);
  assert.ok(C.endlessFloorPower(10) > C.endlessFloorPower(9));
  assert.ok(C.endlessFloorPower(50) > 40 * C.endlessFloorPower(1));
});
test('zona infinita: recompensas por andar, e drop de evento só com evento ativo', () => {
  const r = C.endlessRewards(5, () => 0.99, false);
  assert.equal(r.gold, 35);
  assert.equal(r.diamantes, 1);
  assert.equal(r.evento, null);
  assert.equal(C.endlessRewards(5, () => 0.01, true).evento, 'doce_halloween');
  assert.equal(C.endlessRewards(4, () => 0.01, true).diamantes, 0);
});
