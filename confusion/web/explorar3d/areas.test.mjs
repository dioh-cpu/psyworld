import test from 'node:test';
import assert from 'node:assert/strict';
import { AREAS, areaDaRegiao, validarAreas } from './areas.js';
import { REGIOES } from './mundo.js';

test('áreas: uma para cada região do mapa, com os mesmos nomes de região', () => {
  assert.deepEqual(Object.keys(AREAS).sort(), Object.keys(REGIOES).sort());
});

test('áreas: todas válidas (elemento conhecido, cores em hexadecimal, partes completas)', () => {
  assert.deepEqual(validarAreas(), []);
});

test('áreas: nomes distintos, para o jogador saber onde está', () => {
  const nomes = Object.values(AREAS).map((a) => a.nome);
  assert.equal(new Set(nomes).size, nomes.length);
});

test('área da região: devolve a área certa; fora da ilha não há área', () => {
  assert.equal(areaDaRegiao('Sul').nome, 'Mata Sombria');
  assert.equal(areaDaRegiao('Oeste').elemento, 'agua');
  assert.equal(areaDaRegiao(null), null);
  assert.equal(areaDaRegiao('Inexistente'), AREAS.Centro);
});

test('validação: pega elemento desconhecido e cor fora do padrão', () => {
  const ruim = {
    X: { nome: 'x', elemento: 'gelo', arena: { fundoTopo: '#123456', fundoBase: 'azul', disco: '#123456', anel: '#123456' } },
  };
  const erros = validarAreas(ruim);
  assert.ok(erros.some((e) => e.includes('elemento desconhecido')));
  assert.ok(erros.some((e) => e.includes('cor inválida em fundoBase')));
});
