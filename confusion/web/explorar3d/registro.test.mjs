import test from 'node:test';
import assert from 'node:assert/strict';
import { linhasDoRegistro, EXEMPLO_ESPOLIO } from './registro.js';

test('registro: sem espólio não há linhas', () => {
  assert.deepEqual(linhasDoRegistro([]), []);
  assert.deepEqual(linhasDoRegistro(undefined), []);
});

test('registro: só entram itens com quantidade positiva, com o valor em +quantidade', () => {
  const linhas = linhasDoRegistro([
    { icone: '●', nome: 'Gold', qtd: 50, cor: 'gold' },
    { icone: '◆', nome: 'Diamantes', qtd: 0, cor: 'diam' },
    { icone: '▲', nome: 'XP do passe', qtd: 16, cor: 'passe' },
  ]);
  assert.deepEqual(linhas.map((l) => l.valor), ['+50', '+16']);
});

test('registro: a primeira linha vem marcada, como a linha selecionada na tela de referência', () => {
  const linhas = linhasDoRegistro(EXEMPLO_ESPOLIO);
  assert.equal(linhas[0].selecionado, true);
  assert.ok(linhas.slice(1).every((l) => !l.selecionado));
});
