import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from './core.js';

test('XP: o nível sai do XP total (5 = 220, 10 = 720, 20 = 2470)', () => {
  assert.equal(C.xpDoNivel(1), 0);
  assert.equal(C.xpDoNivel(2), 40);
  assert.equal(C.xpDoNivel(5), 220);
  assert.equal(C.xpDoNivel(10), 720);
  assert.equal(C.xpDoNivel(20), 2470);
  assert.equal(C.nivelDeXp(0), 1);
  assert.equal(C.nivelDeXp(39), 1);
  assert.equal(C.nivelDeXp(40), 2);
  assert.equal(C.nivelDeXp(219), 4);
  assert.equal(C.nivelDeXp(220), 5);
  assert.equal(C.nivelDeXp(10 ** 9), C.LEVEL_MAX);
});

test('XP: ganhar XP atualiza o nível e diz quantos níveis subiu', () => {
  const m = { xp: 0, level: 1 };
  assert.deepEqual(C.ganharXp(m, 40), { ganho: 40, subiu: 1, nivel: 2 });
  assert.equal(m.level, 2);
  assert.deepEqual(C.ganharXp(m, 200), { ganho: 200, subiu: 3, nivel: 5 });
  assert.equal(m.xp, 240);
  assert.equal(C.ganharXp(m, -5).ganho, 0); // XP negativo não tira nada
  assert.equal(m.xp, 240);
});

test('XP: fontes de XP com os valores combinados', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map((r) => C.XP_FONTE.captura(r)), [5, 10, 15, 20, 25]);
  assert.equal(C.XP_FONTE.andarVitoria(1), 11);
  assert.equal(C.XP_FONTE.andarVitoria(20), 30);
  assert.equal(C.XP_FONTE.breed, 15);
});

test('batalha: vitória dá XP; derrota não faz o monstrinho cair de nível', () => {
  const venceu = { xp: 0, level: 1 };
  C.finalBattle('vitoria', venceu, 3);
  assert.equal(venceu.xp, 50);
  assert.equal(venceu.level, 2);

  const perto = { xp: 230, level: 5 }; // nível 5 começa em 220: perder 25 não pode levar para o nível 4
  C.finalBattle('derrota', perto, 0);
  assert.equal(perto.xp, 220);
  assert.equal(perto.level, 5);

  const longe = { xp: 300, level: 5 };
  C.finalBattle('derrota', longe, 0);
  assert.equal(longe.xp, 275);
});

test('força: +4% por nível; chance de vencer o bot: +1 ponto por nível', () => {
  assert.equal(C.fatorNivel(1), 1);
  assert.ok(Math.abs(C.fatorNivel(20) - 1.76) < 1e-9);
  const base = { tier: 1, aptitudes: {}, variant: 'natural', classe: 'comum' };
  assert.equal(C.monsterPower({ ...base, level: 1 }), 10);
  assert.ok(Math.abs(C.monsterPower({ ...base, level: 5 }) - 11.6) < 1e-9);
  assert.equal(C.winChance(0), 0.7);
  assert.ok(Math.abs(C.winChance(0, 11) - 0.8) < 1e-9);
  assert.ok(Math.abs(C.winChance(0, 20) - 0.89) < 1e-9);
  assert.equal(C.winChance(0, 200), 0.95); // teto
  assert.equal(C.winChance(10, 1), 0.1);   // piso
});
