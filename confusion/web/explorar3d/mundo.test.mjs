import test from 'node:test';
import assert from 'node:assert/strict';
import { CIDADES } from '../mundo/sistemas-31.js';
import { CIDADES_MUNDO, EDIFICIOS, CAIXAS, regiaoDe, localDe, INICIO, SINAL } from './mundo.js';
import { colideCirculoCaixa } from './colisao.js';

const RAIO = 0.5;

test('mundo: as cidades são as doze do sistema 31, e cada uma cai na sua região', () => {
  assert.equal(CIDADES_MUNDO.length, CIDADES.length);
  for (const c of CIDADES) {
    const m = CIDADES_MUNDO.find((x) => x.nome === c.nome);
    assert.ok(m, `falta ${c.nome}`);
    assert.equal(m.regiao, c.regiao);
    assert.equal(regiaoDe(m.x, m.z), c.regiao, c.nome);
  }
});

test('mundo: cada cidade tem uma prefeitura no centro e pelo menos cinco casas', () => {
  for (const c of CIDADES_MUNDO) {
    const doCentro = EDIFICIOS.filter((e) => e.cidade === c.nome);
    assert.equal(doCentro.filter((e) => e.central).length, 1, c.nome);
    assert.ok(doCentro.length >= 6, c.nome);
  }
});

test('mundo: todos os prédios ficam na ilha (nenhum canto cai no mar)', () => {
  for (const e of EDIFICIOS) {
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const x = e.x + (sx * e.w) / 2;
      const z = e.z + (sz * e.d) / 2;
      assert.ok(regiaoDe(x, z), `${e.cidade} sai da ilha em (${x.toFixed(1)}, ${z.toFixed(1)})`);
    }
  }
});

test('mundo: prédios não se sobrepõem, nem dentro da cidade nem entre cidades', () => {
  for (let i = 0; i < EDIFICIOS.length; i++) {
    for (let j = i + 1; j < EDIFICIOS.length; j++) {
      const a = EDIFICIOS[i];
      const b = EDIFICIOS[j];
      const sobrepoe = Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.z - b.z) < (a.d + b.d) / 2;
      assert.ok(!sobrepoe, `${a.cidade} e ${b.cidade} se sobrepõem`);
    }
  }
});

test('mundo: a praça de início é livre e a costa bloqueia o mar', () => {
  assert.equal(regiaoDe(INICIO.x, INICIO.z), 'Centro');
  assert.equal(regiaoDe(SINAL.x, SINAL.z), 'Centro');
  assert.ok(!CAIXAS.some((c) => colideCirculoCaixa(INICIO.x, INICIO.z, RAIO, c)), 'o início está bloqueado');
  assert.ok(CAIXAS.some((c) => colideCirculoCaixa(60, 60, RAIO, c)), 'canto da cruz deveria bloquear');
  assert.ok(CAIXAS.some((c) => colideCirculoCaixa(0, -81, RAIO, c)), 'ponta norte deveria bloquear');
  assert.ok(CAIXAS.some((c) => colideCirculoCaixa(81, 0, RAIO, c)), 'ponta leste deveria bloquear');
});

test('localização: no centro de uma cidade diz a cidade; na praça, só Centro; no mar, nada', () => {
  const rio = CIDADES_MUNDO.find((c) => c.nome === 'Rio Fundo');
  assert.deepEqual(localDe(rio.x, rio.z), { regiao: 'Norte', cidade: 'Rio Fundo' });
  assert.deepEqual(localDe(INICIO.x, INICIO.z), { regiao: 'Centro', cidade: null });
  assert.deepEqual(localDe(0, -32), { regiao: 'Norte', cidade: null }); // a 12 do centro de Rio Fundo: fora do raio
  assert.equal(localDe(60, 60), null);
});
