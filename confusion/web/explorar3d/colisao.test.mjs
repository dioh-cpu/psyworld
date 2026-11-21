import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from './colisao.js';

const parede = { min: { x: 2, y: 0, z: -1 }, max: { x: 3, y: 4, z: 1 } };

test('colisão círculo x caixa: dentro, fora e encostando', () => {
  assert.equal(C.colideCirculoCaixa(2.5, 0, 0.5, parede), true);   // dentro
  assert.equal(C.colideCirculoCaixa(0, 0, 0.5, parede), false);    // longe
  assert.equal(C.colideCirculoCaixa(1.6, 0, 0.5, parede), true);   // ponto mais próximo (2,0) está a 0,4 < 0,5
  assert.equal(C.colideCirculoCaixa(1.4, 0, 0.5, parede), false);  // ponto mais próximo (2,0) está a 0,6 > 0,5
});

test('movimento: a parede para o eixo que bate e o outro continua (desliza)', () => {
  const p = C.resolverMovimento({ x: 1.0, z: 0 }, 1.0, 0.5, 0.5, [parede]);
  assert.equal(p.x, 1.0);   // X bloqueado: andar 1,0 levaria o personagem para dentro da parede
  assert.equal(p.z, 0.5);   // Z livre: desliza ao longo da parede
});

test('movimento: livre quando não há parede no caminho', () => {
  const p = C.resolverMovimento({ x: 0, z: 0 }, 0.3, -0.2, 0.5, [parede]);
  assert.ok(Math.abs(p.x - 0.3) < 1e-9);
  assert.ok(Math.abs(p.z + 0.2) < 1e-9);
});

test('segmento x caixa: acerta no meio e erra quando passa ao lado', () => {
  const t = C.segmentoAtingeCaixa({ x: 0, y: 1, z: 0 }, { x: 4, y: 1, z: 0 }, parede);
  assert.ok(Math.abs(t - 0.5) < 1e-9);
  assert.equal(C.segmentoAtingeCaixa({ x: 0, y: 1, z: 5 }, { x: 4, y: 1, z: 5 }, parede), null);
  assert.equal(C.segmentoAtingeCaixa({ x: 0, y: 10, z: 0 }, { x: 4, y: 10, z: 0 }, parede), null); // acima da caixa
});

test('câmera: encurta quando há parede entre o alvo e a posição desejada', () => {
  const alvo = { x: 0, y: 1.4, z: 0 };
  const livre = C.fracaoLivreCamera(alvo, { x: 0, y: 4, z: 7 }, [parede]);
  assert.equal(livre, 1);
  const comParede = C.fracaoLivreCamera(alvo, { x: 6, y: 1.4, z: 0 }, [parede], 0);
  assert.ok(comParede < 1 && comParede >= 0.05);
});
