import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONJUNTOS_RELIQUIAS,
  perfilCombateEquipamento,
  simularTabelaEquilibrioReliquias,
} from './regiao1-reliquias-regras.js';
import { bonusPassivoDomadorAtivo } from './regiao1-domadores-regras.js';
import { criarEstadoInicial } from './regiao1-estado.js';
import { garantirEstadoIdle } from './regiao1-idle.js';

test('Contrato de Equilíbrio para o Claude: 13 conjuntos, perfilCombateEquipamento e simulações todas <= +70%', () => {
  assert.equal(Object.keys(CONJUNTOS_RELIQUIAS).length, 13);

  const tabela = simularTabelaEquilibrioReliquias();
  assert.ok(tabela.length >= 14);

  const mapa = Object.fromEntries(tabela.map((x) => [x.build, x]));
  assert.equal(mapa.sem_equipamento.ganhoPoderFinal, 0);
  assert.ok(mapa.midgame_rara_9.ganhoPoderFinal > 0 && mapa.midgame_rara_9.ganhoPoderFinal < mapa.lendaria_15_furia_arma5.ganhoPoderFinal);

  // Caçador (farm) entrega significativamente menos poder de combate que conjuntos ofensivos
  assert.ok(mapa.lendaria_15_cacador_farm.ganhoPoderFinal < mapa.lendaria_15_furia_arma5.ganhoPoderFinal);

  // Todas as simulações respeitam o teto de +70%
  for (const row of tabela) {
    assert.ok(row.ganhoPoderFinal <= 0.70001, `Simulação ${row.build} passou do teto: ${row.ganhoPoderFinal}`);
  }

  // Campos especiais esperados pelo motor
  assert.equal(mapa.epica_12_precisao_imunidade.perfil.imunidadeTurnos, 1);
  assert.ok(mapa.epica_12_precisao_imunidade.perfil.critico >= 0.12);
  assert.equal(mapa['lendaria_15_contra-ataque_arma5'].perfil.contraAtaque, 0.20);
  assert.equal(mapa.lendaria_15_eco_arma5.perfil.ecoRecarga, 0.20);
  assert.ok(mapa.lendaria_15_vinculo_arma5.perfil.bonusCuraEscudo >= 0.20);
  assert.equal(mapa['lendaria_15_panico-contido_arma5'].perfil.panicoContido.ataque_pct, 0.20);
  assert.equal(mapa.lendaria_15_destruicao_arma5.perfil.danoCritico > 0.35, true);

  // Passiva do domador combina sem quebrar perfilCombateEquipamento num save vazio
  const s = criarEstadoInicial();
  garantirEstadoIdle(s, 80_000_000);
  s.idle.equipe = [{ uid: 'u0', especie: 'Ignaraz', nivel: 100, xp: 0, tier: 5, estrelas: 6 }];
  const vazio = perfilCombateEquipamento(s, 'u0');
  const pass = bonusPassivoDomadorAtivo(s);
  assert.equal(vazio.ganhoPoderFinal, 0);
  assert.ok(pass.vidaPct >= 0.06 && pass.ataquePct >= 0.04);
});
