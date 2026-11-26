import test from 'node:test';
import assert from 'node:assert/strict';
import { VISTAS, POSICAO, vistaDaCamera, modoDoFoco } from './camera-batalha.js';

const dist = (a, b) => Math.hypot(a[0] - b.x, a[1] - b.y, a[2] - b.z);

test('câmera: todas as vistas ficam do lado de cá da arena, acima do chão', () => {
  for (const [nome, v] of Object.entries(VISTAS)) {
    assert.ok(v.pos[2] > 0, `${nome} atrás da arena`);
    assert.ok(v.pos[1] > 0, `${nome} abaixo do chão`);
    assert.ok(v.fov > 20 && v.fov < 70, `${nome} com campo de visão estranho`);
  }
});

test('câmera: o foco fica mais perto de quem age do que a visão panorâmica', () => {
  const pan = VISTAS.panoramica.pos;
  assert.ok(dist(VISTAS['foco-jogador'].pos, POSICAO.jogador) < dist(pan, POSICAO.jogador));
  assert.ok(dist(VISTAS['foco-inimigo'].pos, POSICAO.inimigo) < dist(pan, POSICAO.inimigo));
});

test('câmera: cada foco mira para o lado de quem age, sem perder o outro lutador da tela', () => {
  assert.ok(Math.sign(VISTAS['foco-jogador'].olha[0]) === Math.sign(POSICAO.jogador.x));
  assert.ok(Math.sign(VISTAS['foco-inimigo'].olha[0]) === Math.sign(POSICAO.inimigo.x));
  for (const modo of ['foco-jogador', 'foco-inimigo']) {
    assert.ok(Math.abs(VISTAS[modo].olha[0]) < 1.5, `${modo} olha longe demais para o centro`);
  }
  assert.equal(modoDoFoco('jogador'), 'foco-jogador');
  assert.equal(modoDoFoco('inimigo'), 'foco-inimigo');
});

test('câmera: a vitória é um plano baixo, e a derrota abre o plano', () => {
  assert.ok(VISTAS.vitoria.pos[1] < 1.2, 'plano da vitória deveria ser baixo');
  assert.ok(VISTAS.derrota.pos[1] > VISTAS.panoramica.pos[1]);
});

test('câmera: vista desconhecida é recusada', () => {
  assert.throws(() => vistaDaCamera('nao-existe'), /desconhecida/);
  assert.equal(vistaDaCamera('abertura'), VISTAS.abertura);
});
