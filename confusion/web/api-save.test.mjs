import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitize, validateSave, GAME_ID, MAX_SAVE_BYTES } from '../../api/_lib/confusion-save-lib.js';

test('save de outro jogo é recusado', () => {
  assert.equal(validateSave({ game: 'psyworld', x: 1 }).error, 'wrong_game');
});
test('save sem objeto é recusado', () => {
  assert.equal(validateSave(null).error, 'save_required');
  assert.equal(validateSave([]).error, 'save_required');
});
test('save grande demais é recusado', () => {
  const big = { game: GAME_ID, blob: 'x'.repeat(MAX_SAVE_BYTES + 10) };
  assert.equal(validateSave(big).error, 'save_too_large');
});
test('campos de senha e token são removidos', () => {
  const r = validateSave({ game: GAME_ID, password: 'x', nested: { access_token: 'y', ok: 1 } });
  assert.equal(r.ok, true);
  assert.equal('password' in r.save, false);
  assert.equal('access_token' in r.save.nested, false);
  assert.equal(r.save.nested.ok, 1);
});
test('números não finitos viram zero e profundidade é limitada', () => {
  const r = validateSave({ game: GAME_ID, n: Infinity });
  assert.equal(r.save.n, 0);
  let deep = { v: 1 };
  for (let i = 0; i < 30; i++) deep = { child: deep };
  const s = sanitize(deep);
  assert.ok(JSON.stringify(s).length < JSON.stringify(deep).length);
});
test('save válido passa com o id do jogo', () => {
  const r = validateSave({ game: GAME_ID, day: 3, monsters: [{ species: 'Noctarn' }] });
  assert.equal(r.ok, true);
  assert.equal(r.save.monsters[0].species, 'Noctarn');
});
