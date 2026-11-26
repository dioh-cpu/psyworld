import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from './species.js';

test('linhas: a forma inicial nasce do ovo; a atual evolui para a evolução', () => {
  assert.equal(E.inicialDaEspecie('Noctarn'), 'Penumbrio');
  assert.equal(E.inicialDaEspecie('Penumbrio'), 'Penumbrio');
  assert.equal(E.proximaEspecie('Penumbrio'), 'Noctarn');
  assert.equal(E.proximaEspecie('Noctarn'), 'Noctarion');
  assert.equal(E.proximaEspecie('Noctarion'), null);
});
test('linhas: todas as cinco linhas iniciais existem no catálogo', () => {
  for (const l of E.LINHAS) {
    for (const nome of [l.inicial, l.atual, l.evolucao]) assert.ok(E.ESPECIES[nome], nome + ' sem entrada no catálogo');
  }
  assert.equal(E.LINHAS.length, 5);
});
test('linhas: requisitos crescem da forma inicial para a atual', () => {
  assert.ok(E.requisitoDe('Penumbrio').vinculo < E.requisitoDe('Noctarn').vinculo);
  assert.equal(E.requisitoDe('Noctarion'), null);
});
test('catálogo: as formas novas passam na validação', () => {
  assert.deepEqual(E.validarCatalogo(), []);
});
test('linhas: formas de linha não saem em encontro nem em ovo comum', () => {
  for (const l of E.LINHAS) assert.ok(!E.ESPECIES_BASE.includes(l.inicial) && !E.ESPECIES_BASE.includes(l.evolucao), l.inicial);
});
