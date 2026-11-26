import test from 'node:test'; import assert from 'node:assert/strict';
import { REINOS, linhagensDoReino, contagemPorTipo, elencoDaArea, semArte } from './reinos.js';
import { ESPECIES, validarCatalogo, repetidosNoCatalogo, ESPECIES_BASE } from './species.js';
import { ELEMENTOS } from './core.js';
test('Reino 1: cinco tipos, uma linhagem de cada', () => {
  assert.deepEqual(Object.keys(contagemPorTipo(1)).sort(), ['agua', 'inseto', 'pedra', 'planta', 'terra']);
  assert.equal(linhagensDoReino(1).length, 5);
});
test('Reino 2: 20 linhagens distintas (5 nativas, 5 visitantes, 10 de tipos novos)', () => {
  const l = linhagensDoReino(2);
  assert.equal(new Set(l.map((x) => x.nome)).size, 20);
  assert.equal(l.filter((x) => x.origem === 'nativa').length, 5);
  assert.equal(l.filter((x) => x.origem === 'visitante').length, 5);
  assert.equal(l.filter((x) => ['nova', 'existente'].includes(x.origem)).length, 10);
  const c = contagemPorTipo(2);
  assert.equal(c.fogo, 3); assert.equal(c.eletrico, 3); assert.equal(c.voador, 3); assert.equal(c.aco, 3);
  assert.deepEqual([...new Set(l.filter((x) => x.origem === 'visitante').map((x) => x.elemento))].sort(), REINOS[1].tipos.slice().sort());
});
test('tipos válidos, catálogo íntegro e todas as áreas têm elenco', () => {
  for (const r of Object.values(REINOS)) for (const l of r.linhagens) { assert.ok(ELEMENTOS.includes(l.elemento), l.nome); assert.ok(ESPECIES[l.nome], l.nome); assert.equal(ESPECIES[l.nome].elemento, l.elemento); }
  assert.deepEqual(validarCatalogo(), []); assert.deepEqual(repetidosNoCatalogo(), []);
  for (const a of Object.keys(REINOS[2].areas)) assert.ok(elencoDaArea(2, a).length >= 3, a);
  assert.ok(!ESPECIES_BASE.includes('Cerifogo'));
});
test('todas as formas de arte existem em disco', async () => {
  const fs = await import('node:fs'); const { fileURLToPath } = await import('node:url');
  const raiz = fileURLToPath(new URL('../../', import.meta.url));
  for (const n of [1, 2]) for (const l of linhagensDoReino(n)) for (const f of l.formas) assert.ok(fs.existsSync(raiz + f), `${l.nome}: ${f}`);
  assert.deepEqual(semArte(2), []);
});
test('visitantes usam a arte do reino de origem', () => {
  const v = linhagensDoReino(2).find((l) => l.nome === 'Cobrabúfalo');
  assert.match(v.formas[0], /reinos\/01\/oniricos\/cobrabufalo\/01\.png/);
});
