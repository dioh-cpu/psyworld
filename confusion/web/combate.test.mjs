import test from 'node:test';
import assert from 'node:assert/strict';
import * as K from './combate.js';

const meio = () => 0.5; // sorteio neutro: sem erro, sem crítico, dano sem variação
const lutador = (nome, poder, elemento = 'neutro', habilidades = []) => K.criarLutador({ nome, poder, elemento, habilidades });

test('combate: ataque neutro causa poder x 0,1 de dano', () => {
  const e = K.criarCombate(lutador('J', 100), lutador('I', 100), {});
  K.agir(e, { tipo: 'atacar' }, meio);
  assert.equal(e.ini.hp, K.COMBATE.hpMax - 10);
  assert.equal(e.turno, 2);
});

test('combate: vantagem elemental dobra o dano; desvantagem corta pela metade', () => {
  const vence = K.criarCombate(lutador('J', 100, 'agua'), lutador('I', 100, 'fogo'), {});
  K.agir(vence, { tipo: 'atacar' }, meio);
  assert.equal(vence.ini.hp, K.COMBATE.hpMax - 20);
  const perde = K.criarCombate(lutador('J', 100, 'agua'), lutador('I', 100, 'planta'), {});
  K.agir(perde, { tipo: 'atacar' }, meio);
  assert.equal(perde.ini.hp, K.COMBATE.hpMax - 5); // água contra planta: 0,5x
});

test('combate: poção cura pela fração e é consumida; sem poção, não age', () => {
  const e = K.criarCombate(lutador('J', 100), lutador('I', 100), { pequena: 1 });
  e.jog.hp = 10;
  K.agir(e, { tipo: 'pocao', pocao: 'pequena' }, meio);
  assert.equal(e.pocoes.pequena, 0);
  assert.ok(e.log.some((l) => l.includes('usou Poção pequena (+18 de vida)'))); // 30% de 60, antes do golpe inimigo
  assert.throws(() => K.agir(e, { tipo: 'pocao', pocao: 'pequena' }, meio), /sem essa poção/);
});

test('combate: habilidade não repete no turno seguinte (recarga de 1 turno)', () => {
  const e = K.criarCombate(lutador('J', 100, 'neutro', ['Chama']), lutador('I', 100), {});
  K.agir(e, { tipo: 'habilidade', nome: 'Chama' }, meio);
  assert.equal(K.habilidadePronta(e.jog, 'Chama', e.turno), false);
  assert.throws(() => K.agir(e, { tipo: 'habilidade', nome: 'Chama' }, meio), /indisponível/);
  K.agir(e, { tipo: 'atacar' }, meio);
  assert.equal(K.habilidadePronta(e.jog, 'Chama', e.turno), true);
});

test('combate: habilidade vale 1,4x o ataque comum', () => {
  const e = K.criarCombate(lutador('J', 100, 'neutro', ['Chama']), lutador('I', 100), {});
  K.agir(e, { tipo: 'habilidade', nome: 'Chama' }, meio);
  assert.equal(e.ini.hp, K.COMBATE.hpMax - 14);
});

test('combate: a luta sempre termina, com vencedor', () => {
  let seed = 7;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let k = 0; k < 200; k++) {
    const e = K.criarCombate(lutador('J', 100 + k), lutador('I', 100), { pequena: 2 });
    let n = 0;
    while (!e.fim && n++ < 100) K.agir(e, { tipo: 'atacar' }, rnd);
    assert.ok(e.fim, 'luta não terminou');
    assert.ok(['vitoria', 'derrota'].includes(e.resultado));
  }
});

test('combate: no limite de turnos vence quem tem mais % de vida; empate vai para o inimigo', () => {
  const e = K.criarCombate(lutador('J', 1), lutador('I', 1), {});
  e.turno = K.COMBATE.turnosMax;
  e.jog.hp = 30; e.ini.hp = 30;
  const ataque = () => 0.99; // ninguém causa dano útil: o limite decide
  K.agir(e, { tipo: 'atacar' }, ataque);
  assert.equal(e.resultado, 'derrota');
});

test('política automática: poção quando a vida cai do limiar; senão a primeira habilidade pronta da lista', () => {
  const e = K.criarCombate(lutador('J', 100, 'neutro', ['A', 'B']), lutador('I', 100), { media: 1 });
  e.jog.hp = 20;
  assert.deepEqual(K.escolherAuto(e, { limiarPocao: 0.35, pocoes: ['pequena', 'media'], habilidades: ['A'] }), { tipo: 'pocao', pocao: 'media' });
  e.jog.hp = 60;
  assert.deepEqual(K.escolherAuto(e, { limiarPocao: 0.35, pocoes: ['media'], habilidades: ['B', 'A'] }), { tipo: 'habilidade', nome: 'B' });
  K.agir(e, { tipo: 'habilidade', nome: 'B' }, meio);
  assert.deepEqual(K.escolherAuto(e, { limiarPocao: 0.35, pocoes: [], habilidades: ['B'] }), { tipo: 'atacar' });
});

test('esfera automática: a primeira marcada com estoque; sem estoque, null (pausa)', () => {
  assert.equal(K.escolherEsfera({ comum: 0, rara: 2 }, ['comum', 'rara']), 'rara');
  assert.equal(K.escolherEsfera({ comum: 0, rara: 0 }, ['comum', 'rara']), null);
  assert.equal(K.escolherEsfera({ comum: 3 }, []), null);
});

test('inimigo: o poder da tabela entra multiplicado pela escala de calibração', () => {
  assert.equal(K.poderInimigo(200), 200 * K.COMBATE.escalaInimigo);
});
