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
test('breed: chance por tier, piso, pity e teto', () => {
  assert.ok(Math.abs(C.breedSuccessChance(1, 0, 0) - 0.8) < 1e-9);
  assert.ok(Math.abs(C.breedSuccessChance(1, 20, 0) - 0.2) < 1e-9);
  assert.ok(Math.abs(C.breedSuccessChance(5, 0, 99) - 0.65) < 1e-9);
  assert.ok(C.breedSuccessChance(1, 0, 99, 1) <= 0.95 + 1e-9);
});
test('breed: tier 6 a 10 tem chance menor e nunca abaixo de 20% (provisório)', () => {
  assert.ok(C.breedSuccessChance(6, 0, 0) < C.breedSuccessChance(5, 0, 0));
  assert.ok(C.breedSuccessChance(10, 0, 0) >= 0.2 - 1e-9);
  assert.ok(C.breedSuccessChance(10, 0, 0) <= C.breedSuccessChance(6, 0, 0));
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
test('aptidão não cresce com trabalho: só pelo breed', () => {
  assert.equal(typeof C.addWorkXp, 'undefined');
});
test('raridade: 1 a 5 com nomes da culinária; empurrão nunca passa de 5', () => {
  assert.equal(C.rarityName(1), 'comum');
  assert.equal(C.rarityName(5), 'mitica');
  assert.equal(C.rarityName(9), 'mitica');
  assert.equal(C.rollRarity(0), 1);
  assert.equal(C.rollRarity(0.999), 5);
  assert.equal(C.rollRarity(0, 1), 2);
  assert.equal(C.rollRarity(0.999, 1), 5);
});
test('breed bem-sucedido: aptidões +1 (teto 10); o tier do pai não muda', () => {
  const m = { tier: 3, aptitudes: { cortar: 3, minerar: 10 } };
  C.breedSuccessEffects(m);
  assert.equal(m.tier, 3);
  assert.equal(m.aptitudes.cortar, 4);
  assert.equal(m.aptitudes.minerar, 10);
});
test('breed: exige mesmo tier, outro monstrinho e ingrediente com usos disponíveis', () => {
  const pai = { id: 'a', tier: 4, usosIngrediente: 0 };
  assert.equal(C.ingredientStatus(pai, { id: 'b', tier: 4, usosIngrediente: 0 }), null);
  assert.ok(C.ingredientStatus(pai, { id: 'b', tier: 3, usosIngrediente: 0 }));
  assert.ok(C.ingredientStatus(pai, { id: 'a', tier: 4, usosIngrediente: 0 }));
  assert.ok(C.ingredientStatus(pai, { id: 'b', tier: 4, usosIngrediente: 3 }));
  assert.equal(C.ingredientStatus(pai, { id: 'b', tier: 4, usosIngrediente: 2 }), null);
});
test('ovo do breed: tier do pai, com chance de vir acima; nunca passa de 10', () => {
  assert.equal(C.breedEggTier(4, 0.01), 6);   // +2
  assert.equal(C.breedEggTier(4, 0.20), 5);   // +1
  assert.equal(C.breedEggTier(4, 0.90), 4);   // mesmo tier
  assert.equal(C.breedEggTier(10, 0.01), 10);
  const ovo = C.makeEgg('Noctarn', 'natural', 'breed', 'neutra', 5);
  assert.equal(C.hatchEgg(ovo, 0).tier, 5);
});
test('habilidade já base: sobe o nível dela e não ocupa o slot extra', () => {
  const m = { hybrid: false, abilities: ['a', 'b', 'c', 'd'], extraAbility: null, abilityLevels: {} };
  C.absorbAbility(m, 'a', true);
  assert.equal(m.extraAbility, null);
  assert.equal(m.abilityLevels.a, 2);
  assert.equal(new Set(C.activeAbilities(m)).size, 4);
});
test('ovo do breed: natural, mutante ou abençoado; mutante e abençoado +1 de raridade', () => {
  assert.equal(C.breedEggForm(0.05), 'mutante');
  assert.equal(C.breedEggForm(0.20), 'abencoada');
  assert.equal(C.breedEggForm(0.90), 'natural');
  assert.equal(C.makeEgg('Noctarn', 'mutante', 'breed').shift, 1);
  assert.equal(C.makeEgg('Noctarn', 'natural', 'breed').shift, 0);
});
test('forma do ovo depende da origem: selvagem é quase sempre natural; zona tem mais mutação e bênção', () => {
  assert.equal(C.eggFormFor('selvagem', 0.02), 'mutante');
  assert.equal(C.eggFormFor('selvagem', 0.07), 'abencoada');
  assert.equal(C.eggFormFor('selvagem', 0.5), 'natural');
  assert.equal(C.eggFormFor('zona', 0.3), 'abencoada');
  assert.equal(C.eggFormFor('zona', 0.6), 'natural');
  assert.equal(C.eggFormFor('inicial', 0), 'natural');
});
test('mutação de luz ou de trevas: herda a pureza da fonte; sem fonte definida sai 50/50', () => {
  assert.deepEqual(C.eggFor('breed', 0.1, 0.9, 'trevas'), { form: 'mutante', pureza: 'trevas' });
  assert.deepEqual(C.eggFor('breed', 0.1, 0.9, 'luz'), { form: 'mutante', pureza: 'luz' });
  assert.equal(C.eggFor('zona', 0.1, 0.1).pureza, 'luz');
  assert.equal(C.eggFor('zona', 0.1, 0.9).pureza, 'trevas');
  assert.equal(C.hatchEgg(C.makeEgg('Noctarn', 'mutante', 'breed', 'trevas'), 0).purity, 'trevas');
});
test('combinada (mutação + bênção) é rarissima, luz e +2 de raridade', () => {
  assert.equal(C.eggFor('breed', 0.001, 0).form, 'combinada');
  assert.ok(C.FORM_CHANCE.breed.combinada < 0.01);
  assert.ok(C.FORM_CHANCE.selvagem.combinada < C.FORM_CHANCE.breed.combinada);
  const c = C.hatchEgg(C.makeEgg('Noctarn', 'combinada', 'breed', 'luz'), 0);
  assert.equal(c.variant, 'combinada');
  assert.equal(c.purity, 'luz');
  assert.equal(c.rarity, 3);
});
test('poder: combinada vale o dobro; mutação e bênção também somam', () => {
  const base = { tier: 3, aptitudes: {} };
  assert.equal(C.monsterPower({ ...base, variant: 'natural' }), 30);
  assert.equal(C.monsterPower({ ...base, variant: 'combinada' }), 60);
  assert.ok(C.monsterPower({ ...base, variant: 'mutante' }) > C.monsterPower({ ...base, variant: 'natural' }));
  assert.ok(C.monsterPower({ ...base, variant: 'abencoada' }) > C.monsterPower({ ...base, variant: 'natural' }));
});
test('ovo mutante ou abençoado: a variante vai para o monstrinho e o shift não soma com a zona', () => {
  assert.equal(C.hatchEgg(C.makeEgg('Noctarn', 'mutante', 'breed'), 0).variant, 'mutante');
  assert.equal(C.hatchEgg(C.makeEgg('Noctarn', 'natural', 'breed'), 0).variant, 'natural');
  assert.equal(C.makeEgg('Noctarn', 'mutante', 'zona').shift, 1);
  assert.equal(C.makeEgg('Noctarn', 'abencoada', 'zona').shift, 1);
});
test('nascimento: raridade rolada e tier igual; ovo da zona +1; abençoado é luz', () => {
  const h = C.hatchEgg(C.makeEgg('Ignavor', 'natural', 'breed'), 0);
  assert.equal(h.rarity, 1);
  assert.equal(h.tier, 1);
  assert.equal(h.purity, 'neutra');
  assert.equal(C.hatchEgg(C.makeEgg('Ignavor', 'natural', 'zona'), 0).rarity, 2);
  const ab = C.hatchEgg(C.makeEgg('Ignavor', 'abencoada', 'breed'), 0);
  assert.equal(ab.purity, 'luz');
  assert.equal(ab.rarity, 2);
});
test('invocação: destaque sai com 5%, garantia chega em 150 sem o destaque, raridades seguem os pesos', () => {
  const sp = ['Noctarn', 'Ignavor', 'Vaelith'];
  const comDestaque = C.invocationPull('permanente', sp, 0, { destaque: 0.01, especie: 0, raridade: 0 });
  assert.equal(comDestaque.species, 'Noctarn');
  assert.equal(comDestaque.destaque, true);
  assert.equal(comDestaque.pity, 0);
  const semDestaque = C.invocationPull('permanente', sp, 0, { destaque: 0.5, especie: 0, raridade: 0 });
  assert.equal(semDestaque.species, 'Ignavor');
  assert.equal(semDestaque.pity, 1);
  const garantido = C.invocationPull('permanente', sp, 149, { destaque: 0.99, especie: 0.99, raridade: 0.99 });
  assert.equal(garantido.species, 'Noctarn');
  assert.equal(garantido.pity, 0);
  assert.equal(C.invocationPull('permanente', sp, 0, { destaque: 0.5, especie: 0, raridade: 0 }).rarity, 1);
  assert.equal(C.invocationPull('permanente', sp, 0, { destaque: 0.5, especie: 0, raridade: 0.999 }).rarity, 5);
  assert.throws(() => C.invocationPull('inexistente', sp, 0, { destaque: 0, especie: 0, raridade: 0 }));
  assert.equal(C.FEATURED_CHANCE, 0.05);
  assert.equal(C.PITY_FEATURED, 150);
});
test('zona infinita: cada andar fica mais forte', () => {
  assert.equal(C.endlessFloorPower(1), 100);
  assert.ok(C.endlessFloorPower(10) > C.endlessFloorPower(9));
});
test('zona infinita: 10 diamantes por andar, 150 a cada 10 andares', () => {
  assert.equal(C.endlessRewards(1).diamantes, 10);
  assert.equal(C.endlessRewards(10).diamantes, 60);
  let total = 0;
  for (let f = 1; f <= 10; f++) total += C.endlessRewards(f).diamantes;
  assert.equal(total, 150);
});
test('zona infinita: ovo de recompensa a cada 10 andares', () => {
  assert.equal(C.endlessRewards(10).ovo, true);
  assert.equal(C.endlessRewards(5).ovo, false);
});
test('zona infinita: invocações por banner nos andares certos', () => {
  assert.deepEqual(C.endlessRewards(3).invocacoes, [{ banner: 'permanente', qtd: 1 }]);
  const r10 = C.endlessRewards(10).invocacoes.map((x) => x.banner + x.qtd);
  assert.ok(!r10.includes('permanente1') && r10.includes('semanal3'));
  const r15 = C.endlessRewards(15).invocacoes.map((x) => x.banner + x.qtd);
  assert.ok(r15.includes('evento3') && r15.includes('permanente1'));
});
test('diamantes: 2000 compra 10 invocações; 10 de uma vez cai para 1500', () => {
  assert.equal(C.invocationCost(1), 200);
  assert.equal(C.invocationCost(10), 1500);
  assert.equal(C.buyInvocations(2000, 10).diamonds, 500);
  assert.throws(() => C.buyInvocations(100, 1));
});
test('diamantes: ganho por raridade, só dentro do jogo', () => {
  assert.equal(C.diamondsForItem('comum'), 1);
  assert.ok(C.diamondsForItem('mitica') > C.diamondsForItem('comum'));
  assert.equal(C.PACK_BRL_4_99, undefined);
});
test('zona infinita: poder pelo tier e aptidões, chance entre 5% e 95%', () => {
  const fraco = { tier: 1, aptitudes: {} };
  const forte = { tier: 10, aptitudes: { a: 10, b: 10, c: 10, d: 10 } };
  assert.equal(C.monsterPower(fraco), 10);
  assert.ok(C.endlessChance(fraco, 50) >= 0.05);
  assert.equal(C.endlessChance(forte, 1), 0.95);
  assert.ok(C.endlessChance(forte, 1) > C.endlessChance(forte, 20));
});

test('invocação 10x garante tier 4; 50x garante tier 5; lote que já tem o tier não muda', () => {
  const baixos = Array.from({ length: 10 }, () => ({ species: 'Noctarn', rarity: 1 }));
  const g10 = C.garantirLote(baixos, 10);
  assert.equal(Math.max(...g10.map((r) => r.rarity)), 4);
  assert.equal(g10.length, 10);
  const g50 = C.garantirLote(Array.from({ length: 50 }, () => ({ species: 'Noctarn', rarity: 2 })), 50);
  assert.equal(Math.max(...g50.map((r) => r.rarity)), 5);
  const ok = [{ species: 'Ignavor', rarity: 5 }, { species: 'Ignavor', rarity: 1 }];
  assert.deepEqual(C.garantirLote(ok, 10), ok);
  const solto = [{ rarity: 2 }];
  assert.deepEqual(C.garantirLote(solto, 1), solto);
});
test('breed com tempo: média de 10 minutos (8 a 12), até 3 espaços, monstrinho só em um breed por vez', () => {
  assert.equal(C.breedDurationMs(0), 8 * 60000);
  assert.equal(C.breedDurationMs(1), 12 * 60000);
  assert.equal(C.breedDurationMs(0.5), 10 * 60000);
  const a = { id: 'a', tier: 3, usosIngrediente: 0 };
  const b = { id: 'b', tier: 3, usosIngrediente: 0 };
  const c = { id: 'c', tier: 3, usosIngrediente: 0 };
  const d = { id: 'd', tier: 3, usosIngrediente: 0 };
  const emAndamento = [{ mainId: 'x', ingId: 'y' }];
  assert.equal(C.podeIniciarBreed(emAndamento, a, b), null);
  assert.ok(C.podeIniciarBreed([{ mainId: 'x', ingId: 'y' }, { mainId: 'z', ingId: 'w' }, { mainId: 'q', ingId: 'r' }], a, b));
  assert.ok(C.podeIniciarBreed([{ mainId: 'a', ingId: 'y' }], a, b));
  assert.ok(C.podeIniciarBreed([{ mainId: 'x', ingId: 'b' }], a, b));
  assert.equal(C.podeIniciarBreed([], a, c), null);
  assert.ok(C.podeIniciarBreed([], a, d) === null);
});
test('habilidade absorvida entra na lista de habilidades do pai', () => {
  const m = { hybrid: false, abilities: ['a', 'b', 'c', 'd'], extraAbility: null, abilityLevels: {} };
  C.absorbAbility(m, 'x', true);
  assert.ok(m.abilities.includes('x'));
  assert.equal(m.abilities.length, 5);
  assert.equal(m.extraAbility, 'x');
  assert.equal(C.activeAbilities(m).length, 5);
});
