import test from 'node:test';
import assert from 'node:assert/strict';
import { vetorJoystick } from './controles.js';

test('joystick: no centro ou dentro da zona morta não move', () => {
  assert.deepEqual(vetorJoystick(0, 0, 100), { x: 0, z: 0 });
  assert.deepEqual(vetorJoystick(5, 5, 100), { x: 0, z: 0 });   // 7 px de 100: dentro da zona morta
});

test('joystick: para cima é para frente (z positivo); para a direita é x positivo', () => {
  const cima = vetorJoystick(0, -100, 100);
  assert.ok(Math.abs(cima.z - 1) < 1e-9 && Math.abs(cima.x) < 1e-9);
  const direita = vetorJoystick(100, 0, 100);
  assert.ok(Math.abs(direita.x - 1) < 1e-9 && Math.abs(direita.z) < 1e-9);
});

test('joystick: passar do raio não passa de norma 1', () => {
  const v = vetorJoystick(500, 0, 100);
  assert.ok(Math.abs(v.x - 1) < 1e-9);
  const diagonal = vetorJoystick(70, -70, 100);
  assert.ok(Math.hypot(diagonal.x, diagonal.z) <= 1 + 1e-9);
});

test('joystick: meio caminho dá força proporcional, descontada a zona morta', () => {
  const meio = vetorJoystick(0, -50, 100, 0);
  assert.ok(Math.abs(meio.z - 0.5) < 1e-9);
  const comMorta = vetorJoystick(0, -50, 100, 0.2);
  assert.ok(Math.abs(comMorta.z - 0.375) < 1e-9);
});
