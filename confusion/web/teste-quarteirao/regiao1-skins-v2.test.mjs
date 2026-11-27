import test from 'node:test';
import assert from 'node:assert/strict';
import { aplicarCamadasTela, urlCamadaV2, CAMADAS_V2_DISPONIVEIS } from './regiao1-skins-v2.js';

const cardFalso = () => { const vars = {}; return { vars, dataset: {}, style: { setProperty: (k, v) => { vars[k] = v; }, removeProperty: (k) => { delete vars[k]; } } }; };

test('sem camada registrada nada é aplicado (sem 404)', () => {
  const c = cardFalso();
  aplicarCamadasTela(c, 'reliquias');
  assert.deepEqual(c.vars, {});
  assert.deepEqual(c.dataset, {});
  assert.equal(urlCamadaV2('reliquias', 'moldura'), null);
});

test('camada registrada é aplicada e depois limpa ao trocar de tela', () => {
  CAMADAS_V2_DISPONIVEIS.add('torres/moldura.webp');
  const c = cardFalso();
  aplicarCamadasTela(c, 'torres');
  assert.match(c.vars['--skin-moldura'], /telas-v2\/camadas\/torres\/moldura\.webp/);
  assert.equal(c.dataset.skinMoldura, '1');
  aplicarCamadasTela(c, 'missoes');
  assert.deepEqual(c.vars, {});
  assert.equal(c.dataset.skinMoldura, undefined);
  CAMADAS_V2_DISPONIVEIS.delete('torres/moldura.webp');
});
