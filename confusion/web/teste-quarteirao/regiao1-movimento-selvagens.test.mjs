import test from 'node:test';
import assert from 'node:assert/strict';
import {
  direcaoDoVetor,
  quadroFolha4Dir,
  criarEstadoPasseio,
  atualizarPasseioSelvagem,
  registrarFolhaSelvagem,
  obterFolhaSelvagem,
} from './regiao1-movimento-selvagens.js';

test('direcaoDoVetor escolhe corretamente frente, costas, esquerda e direita', () => {
  assert.equal(direcaoDoVetor(0, 1), 'frente');
  assert.equal(direcaoDoVetor(0, -1), 'costas');
  assert.equal(direcaoDoVetor(-2, 0.3), 'esquerda');
  assert.equal(direcaoDoVetor(2, -0.3), 'direita');
});

test('quadroFolha4Dir calcula UV correto para folha de 4 direções (4x4)', () => {
  const folha = { url: 'teste.png', cols: 4, rows: 4, fps: 4, direcoes: { frente: 0, esquerda: 1, direita: 2, costas: 3 } };
  const q0 = quadroFolha4Dir(folha, 'esquerda', false, 1.5);
  assert.equal(q0.linha, 1);
  assert.equal(q0.col, 0);
  const q1 = quadroFolha4Dir(folha, 'costas', true, 0.5);
  assert.equal(q1.linha, 3);
  assert.equal(q1.col, 2);
  assert.equal(q1.repeatX, 0.25);
  assert.equal(q1.repeatY, 0.25);
});

test('atualizarPasseioSelvagem movimenta o selvagem dentro do raio e respeita piso caminhável', () => {
  let seed = 0.25;
  const rng = () => { seed = (seed + 0.37) % 1; return seed; };
  const p = criarEstadoPasseio(10, 10, { rng, raio: 4, vel: 2.5 });
  const pos = { x: 10, z: 10 };
  for (let i = 0; i < 40; i++) {
    const r = atualizarPasseioSelvagem(p, pos, 0.1, { rng, podeIr: (x, z) => x >= 5 && z >= 5 });
    pos.x = r.x; pos.z = r.z;
  }
  assert.equal(p.moveu, true);
  assert.ok(Math.hypot(pos.x - 10, pos.z - 10) <= 4.1);
});

test('registrarFolhaSelvagem registra e devolve folha de 4 direções sob demanda', () => {
  assert.equal(obterFolhaSelvagem('TesteFolha4D'), null);
  assert.equal(registrarFolhaSelvagem('TesteFolha4D', { url: 'assets/teste/walk.png', cols: 4, rows: 4 }), true);
  assert.equal(obterFolhaSelvagem('TesteFolha4D').url, 'assets/teste/walk.png');
});
