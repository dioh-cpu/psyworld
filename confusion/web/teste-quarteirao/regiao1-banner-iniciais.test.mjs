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
import { invocar, expDe, T5_BANNER } from './regiao1-exp-regras.js';
test('garantias do banner: 10 → T3, 30 → T4, 50 → T5 (um dos 3 finais iniciais)', () => {
  const s = { idle: { equipe: [] } }; const e = expDe(s); e.tickets = 100; e.gratis = { saldo: 0, dia: 1e9 };
  const tiers = []; for (let i = 0; i < 50; i++) tiers.push(invocar(s, () => 0.01).tier); // 0.01 = sempre comum no sorteio
  assert.equal(tiers[9], 3); assert.equal(tiers[29], 4); assert.equal(tiers[49], 5);
  assert.ok(T5_BANNER.includes(s.idle.equipe[49].especie));
  assert.equal(tiers.filter((t) => t === 1).length, 45); // garantias nas invocações 10, 20, 30 (T4), 40 e 50 (T5)
});
test('3% de T5 por invocação', () => {
  const s = { idle: { equipe: [] } }; const e = expDe(s); e.tickets = 1; e.gratis = { saldo: 0, dia: 1e9 };
  const seq = [0.995, 0.5]; let i = 0; const r = invocar(s, () => seq[i++ % 2]);
  assert.equal(r.tier, 5);
});
