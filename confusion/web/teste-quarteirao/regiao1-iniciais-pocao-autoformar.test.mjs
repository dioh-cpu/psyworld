import test from 'node:test';
import assert from 'node:assert/strict';

import { INICIAIS, INICIAIS_ESCOLHA_IDS } from './regiao1-conta.js';
import { poolBanner, extrairElementosFase, pontuarOniricoParaFase, autoFormarParaFase } from './regiao1-exp-regras.js';
import { POCOES, POCOES_XP_CFG } from './regiao1-progressao.js';
import { darPocao, podeUsarPocao, usarPocao } from './regiao1-halloween-regras.js';

test('1. Escolhas iniciais: apenas Brasinha, Gotalume e Sementil (sem Penumbrio nem Solinho)', () => {
  assert.deepEqual(INICIAIS_ESCOLHA_IDS, ['ignavor', 'vaelith', 'brotavel']);
  assert.deepEqual(INICIAIS.map((i) => i.especie), ['Brasinha', 'Gotalume', 'Sementil']);
  assert.equal(INICIAIS.some((i) => i.especie === 'Penumbrio' || i.especie === 'Solinho'), false);

  const pool = poolBanner();
  const nomesPool = new Set(pool.map((p) => p.especie));
  assert.ok(nomesPool.has('Brasinha'));
  assert.ok(nomesPool.has('Gotalume'));
  assert.ok(nomesPool.has('Sementil'));
  assert.equal(nomesPool.has('Penumbrio'), false);
  assert.equal(nomesPool.has('Solinho'), false);
});

test('2. Poção de XP: valores, usos sem limite diário e qualquer Onírico (por índice ou uid) ou Domador', () => {
  assert.equal(POCOES.pocao_xp_p.xp, 1500);
  assert.equal(POCOES.pocao_xp_m.xp, 12000);
  assert.equal(POCOES.pocao_xp_g.xp, 90000);
  assert.equal(POCOES_XP_CFG.usosPorDia, null);
  assert.equal(POCOES_XP_CFG.alvosElegiveis, 'qualquer_onirico_ou_domador');

  const save = {
    idle: {
      jogador: { xp: 0 },
      equipe: [
        { uid: 'u_bra', especie: 'Brasinha', nivel: 5, xp: 220 },
      ],
      banco: [
        { uid: 'u_got', especie: 'Gotalume', nivel: 5, xp: 220 },
      ],
    },
  };
  darPocao(save, 'pocao_xp_p', 3);
  const chk = podeUsarPocao(save, 'u_got', 'pocao_xp_p', 2);
  assert.equal(chk.ok, true);
  assert.equal(chk.xpTotal, 3000);

  const res = usarPocao(save, 'u_got', 'pocao_xp_p', 2);
  assert.equal(res.ok, true);
  assert.equal(res.qtdUsada, 2);
  assert.equal(res.saldoRestante, 1);
  assert.ok(save.idle.banco[0].nivel > 5);
});

test('3. Auto formar para fase: lê elementos das ondas/inimigos e prioriza vantagem elemental + força/tier/estrelas', () => {
  const faseFogo = {
    ondas: [
      [['Brasinha', 10, 'fogo'], ['Ignavor', 12, 'fogo']],
      [['Ignaraz', 15, 'fogo']],
    ],
  };
  assert.deepEqual(extrairElementosFase(faseFogo), ['fogo']);

  const save = {
    idle: {
      equipe: [
        { uid: 'u_planta', especie: 'Brotavel', nivel: 15, tier: 4, estrelas: 2 }, // desvantagem contra fogo
        { uid: 'u_agua',   especie: 'Vaelith',  nivel: 15, tier: 4, estrelas: 2 }, // vantagem 2x contra fogo
        { uid: 'u_fogo',   especie: 'Ignavor',  nivel: 15, tier: 4, estrelas: 2 }, // neutro/resiste
        { uid: 'u_terra',  especie: 'Tatuveludo', nivel: 14, tier: 3, estrelas: 1 },
        { uid: 'u_fraco',  especie: 'Sementil', nivel: 5,  tier: 1, estrelas: 1 },
      ],
      formacao: ['u_fraco', null, null, null],
    },
  };

  const pAgua = pontuarOniricoParaFase(save.idle.equipe[1], ['fogo']);
  const pPlanta = pontuarOniricoParaFase(save.idle.equipe[0], ['fogo']);
  assert.ok(pAgua.score > pPlanta.score, 'Água deve pontuar acima de Planta contra fase de Fogo');

  const auto = autoFormarParaFase(save, faseFogo, { aplicar: true });
  assert.equal(auto.ok, true);
  assert.equal(auto.formacao[0], 'u_agua', 'Melhor Onírico contra Fogo deve ir na vaga 0');
  assert.equal(auto.formacao.includes('u_fraco'), false, 'Mais fraco fica fora das 4 vagas');
  assert.deepEqual(save.idle.formacao, auto.formacao);
});
