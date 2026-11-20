import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from './core.js';
import * as Y from './systems.js';

const DAY = 86400000;
const at = (y, m, d) => Date.UTC(y, m - 1, d, 15);
const base = { tier: 3, aptitudes: {}, variant: 'natural', classe: 'comum', level: 1 };

test('dificuldade: +30% de drop e +25% de força por nível; até 3 níveis nas torres e na zona', () => {
  assert.equal(C.bonusDrop(0), 1);
  assert.ok(Math.abs(C.bonusDrop(1) - 1.3) < 1e-9);
  assert.ok(Math.abs(C.bonusDrop(3) - 1.9) < 1e-9);
  assert.ok(Math.abs(C.bonusDrop(9) - 1.9) < 1e-9); // trava no 3
  assert.ok(Math.abs(C.fatorForca(2) - 1.5) < 1e-9);
  assert.ok(Math.abs(C.bonusDropSemLimite(5) - 2.5) < 1e-9); // campanha não trava
  assert.ok(Math.abs(C.bonusDropSemLimite(8) - 3.3) < 1e-9); // acima do 7: +20% por índice
});

test('drop: a parte fracionada vira sorteio; a média bate com o bônus', () => {
  assert.equal(Y.quantidadeDrop(5, 1.3, 0), 7);    // 6,5: sorteio com roll 0 dá 7
  assert.equal(Y.quantidadeDrop(5, 1.3, 0.9), 6);  // e com roll alto dá 6
  assert.equal(Y.quantidadeDrop(3, 1, 0.99), 3);   // sem bônus, nada muda
});

test('zona infinita: dificuldade 1 abre no andar 11, 2 no 21, 3 no 31', () => {
  assert.equal(Y.difEndlessLiberada(9), 0);
  assert.equal(Y.difEndlessLiberada(10), 1);
  assert.equal(Y.difEndlessLiberada(25), 2);
  assert.equal(Y.difEndlessLiberada(99), 3);
});

test('zona infinita: dificuldade mais alta é mais difícil para o mesmo monstrinho', () => {
  const m = { ...base, tier: 6, aptitudes: { minerar: 4 } };
  assert.ok(C.endlessChance(m, 10, 3) < C.endlessChance(m, 10, 0));
});

test('torres: duas ativas; a semana tem 10 andares, a do mês 20', () => {
  assert.deepEqual(Y.TORRES.map((t) => [t.id, t.andares]), [['semana', 10], ['mes', 20]]);
});

test('torres: item e elemento seguem o tema do período', () => {
  const ts = Y.EPOCH_TS;
  const ev = Y.activeEvents(ts);
  assert.equal(Y.itemDaTorre(Y.TORRES[1], ts), ev.mensal.item);
  assert.equal(Y.elementoDaTorre(Y.TORRES[1], ts), Y.ELEMENTO_TEMA[ev.mensal.id]);
  assert.equal(Y.itemDaTorre(Y.TORRES[0], ts), Y.ITEM_SEMANAL[ev.semanal.id]);
});

test('torres: período novo zera o andar e mantém a dificuldade liberada', () => {
  const torre = Y.TORRES[0];
  const t = { chave: Y.chaveDaTorre(torre, at(2026, 1, 5)), progresso: { 0: 7 }, liberada: 2, nivel: 1 };
  const nova = Y.torreDoPeriodo(t, torre, at(2026, 1, 20)); // semana seguinte
  assert.deepEqual(nova.progresso, {});
  assert.equal(nova.liberada, 2);
  assert.equal(Y.torreDoPeriodo(t, torre, at(2026, 1, 5)), t); // mesma semana: não muda
});

test('torres: zerar o topo libera a próxima dificuldade; o topo de cada nível é o último andar', () => {
  const torre = Y.TORRES[0];
  let t = Y.torreDoPeriodo(null, torre, Y.EPOCH_TS);
  let liberou = false;
  for (let a = 1; a <= torre.andares; a++) {
    const r = Y.venceAndarTorre(t, torre, 0, { a: 0.5, b: 0.5 });
    t = r.t;
    liberou = r.liberouNova;
  }
  assert.equal(liberou, true);
  assert.equal(t.liberada, 1);
  assert.throws(() => Y.venceAndarTorre(t, torre, 0, { a: 0, b: 0 })); // já concluída
  assert.equal(Y.venceAndarTorre(t, torre, 1, { a: 0, b: 0 }).andar, 1); // dificuldade 1 começa do andar 1
  assert.throws(() => Y.venceAndarTorre(t, torre, 2, { a: 0, b: 0 })); // nível 2 ainda não está liberado
});

test('torres: chefe (andar 5) dá mais item que andar comum', () => {
  const torre = Y.TORRES[1];
  const t = { chave: 0, progresso: { 0: 5 }, liberada: 0, nivel: 0 };
  const boss = Y.venceAndarTorre(t, torre, 0, { a: 0.99, b: 0.99 }).recompensa.item;
  const comum = Y.venceAndarTorre({ ...t, progresso: { 0: 4 } }, torre, 0, { a: 0.99, b: 0.99 }).recompensa.item;
  assert.ok(boss > comum);
});

test('torres: chance do andar fica entre 5% e 95%, e o elemento do tema entra', () => {
  const torre = Y.TORRES[1];
  const ts = Y.EPOCH_TS;
  const fraco = { ...base, tier: 1 };
  assert.equal(Y.chanceTorre(fraco, torre, ts, 20, 3), 0.05);
  const forte = { ...base, tier: 10, aptitudes: { minerar: 10 }, level: 20, elemento: Y.elementoDaTorre(torre, ts) === 'luz' ? 'trevas' : 'luz' };
  assert.ok(Y.chanceTorre(forte, torre, ts, 1, 0) <= 0.95);
});

test('campanha: normal liberada; speedrun só depois da normal; desafio só depois do speedrun', () => {
  let c = Y.campanhaNova();
  assert.equal(Y.campanhaLiberada(c, 'normal'), true);
  assert.equal(Y.campanhaLiberada(c, 'speedrun'), false);
  assert.throws(() => Y.campanhaIniciar(c, 'speedrun', 0));
  c = Y.campanhaIniciar(c, 'normal', 1000);
  c = Y.campanhaVencer(c, 5000).c;
  assert.equal(c.concluidas.normal, 1);
  assert.equal(Y.campanhaLiberada(c, 'speedrun'), true);
  assert.equal(Y.campanhaLiberada(c, 'desafio'), false);
  c = Y.campanhaVencer(Y.campanhaIniciar(c, 'speedrun', 10000), 70000).c;   // 60 s
  assert.equal(c.melhorSpeedrun, 60000);
  assert.equal(Y.campanhaLiberada(c, 'desafio'), true);
});

test('campanha: melhor tempo fica com o menor; cada desafio zerado sobe o nível', () => {
  let c = { ...Y.campanhaNova(), concluidas: { normal: 1, speedrun: 1, desafio: 0 }, melhorSpeedrun: 60000 };
  c = Y.campanhaVencer(Y.campanhaIniciar(c, 'speedrun', 0), 90000).c;  // mais lento: não substitui
  assert.equal(c.melhorSpeedrun, 60000);
  assert.equal(Y.campanhaIndice(c, 'desafio'), 2);
  c = Y.campanhaVencer(Y.campanhaIniciar(c, 'desafio', 0), 1000).c;
  assert.equal(c.desafioNivel, 1);
  assert.equal(Y.campanhaIndice(c, 'desafio'), 3);
  assert.equal(c.concluidas.desafio, 1);
  assert.throws(() => Y.campanhaVencer(c, 5));                          // sem corrida em andamento
});
