import test from 'node:test'; import assert from 'node:assert/strict';
import { poolBanner } from './regiao1-exp-regras.js';
import { consultarEvolucaoForma, FRAGMENTOS_SONHO_CFG } from './regiao1-regras-sonho.js';
test('iniciais Brasinha, Gotalume e Sementil entram no banner permanente como T4', () => {
  const ini = poolBanner().filter((p) => ['Brasinha', 'Gotalume', 'Sementil'].includes(p.especie));
  assert.equal(ini.length, 3); for (const p of ini) assert.equal(p.tier, 4);
});
test('forma final (T5) dos iniciais exige nível 40', () => {
  assert.equal(FRAGMENTOS_SONHO_CFG.nivelIniciaisPorFase[3], 40);
  const mk = (nivel) => ({ idle: { equipe: [{ uid: 'x', especie: 'Ignavor', nivel, tier: 4, estrelas: 1 }] } });
  const c39 = consultarEvolucaoForma(mk(39), 0), c40 = consultarEvolucaoForma(mk(40), 0);
  assert.equal(c39.faltaNivel, 1); assert.equal(c39.podeEvoluir, false); assert.match(c39.motivo, /nível 40/);
  assert.equal(c40.faltaNivel, 0);
});
