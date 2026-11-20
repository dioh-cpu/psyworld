import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from './species.js';
import * as Y from './systems.js';

test('catálogo: todas as espécies estão completas', () => {
  assert.deepEqual(E.validarCatalogo(), []);
});
test('catálogo: validador aponta o que falta numa espécie nova', () => {
  const erros = E.validarEspecie('Teste', { origem: 'lenda', pureza: 'sombra', aptidoes: { voar: 3, cortar: 11 }, habilidades: ['a', 'a', 'b'] });
  assert.ok(erros.some((x) => x.includes('origem inválida')));
  assert.ok(erros.some((x) => x.includes('pureza inválida')));
  assert.ok(erros.some((x) => x.includes('aptidão desconhecida (voar)')));
  assert.ok(erros.some((x) => x.includes('nível de cortar')));
  assert.ok(erros.some((x) => x.includes('pelo menos 4 habilidades')));
});
test('catálogo: espécie nova válida entra nas listas do jogo sem mexer no código', () => {
  const novo = { ...E.ESPECIES, Teste: { origem: 'base', pureza: 'neutra', aptidoes: { cortar: 2 }, habilidades: ['a', 'b', 'c', 'd'] } };
  assert.deepEqual(E.validarCatalogo(novo), []);
  assert.ok(Object.keys(novo).filter((k) => novo[k].origem === 'base').includes('Teste'));
});
test('catálogo: base e evento separados; exclusivo de evento existe e é de origem evento', () => {
  assert.ok(E.ESPECIES_BASE.includes('Noctarn'));
  assert.ok(!E.ESPECIES_BASE.includes('Lumivela'));
  for (const e of Y.MONTHLY_EVENTS) {
    assert.ok(E.ESPECIES[e.exclusivo], e.exclusivo);
    assert.equal(E.ESPECIES[e.exclusivo].origem, 'evento');
  }
});
test('catálogo: sistemas leem a mesma pureza e as mesmas listas', () => {
  assert.equal(Y.SPECIES_PURITY.Noctarn, 'trevas');
  assert.deepEqual(Y.BASE_SPECIES, E.ESPECIES_BASE);
  assert.equal(Y.EVENT_SPECIES.Lumivela.purity, 'luz');
});
