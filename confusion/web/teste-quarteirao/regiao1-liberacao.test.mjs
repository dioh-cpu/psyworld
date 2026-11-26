import test from 'node:test'; import assert from 'node:assert/strict';
import { LIBERACAO_R1, sistemasLiberados, proximaLiberacao, tutorialDoSistema } from './regiao1-liberacao.js';
import { QUESTS_POR_ID } from './regiao1-estado.js';
import { SISTEMAS } from '../mundo/index.js';
import { ESTRATEGIA_C1 as D } from './regiao1-estrategia-c1.js';
import { locaisAtivos, enfileirarObras } from './regiao1-gestao-regras.js';
test('os 50 sistemas são liberados uma vez cada, por missões que existem', () => {
  const todos = Object.values(LIBERACAO_R1).flat();
  assert.equal(todos.length, 50); assert.equal(new Set(todos).size, 50);
  for (const s of SISTEMAS) assert.ok(todos.includes(s.id), s.id);
  for (const q of Object.keys(LIBERACAO_R1)) assert.ok(QUESTS_POR_ID[q], q);
});
test('liberação segue as missões concluídas e a dica aponta a próxima', () => {
  const save = { quests: { q_pegadas: 'concluida' } };
  assert.deepEqual([...sistemasLiberados(save)], ['01']);
  assert.equal(proximaLiberacao(save).quest, 'q_mare_devolveu');
  assert.equal(proximaLiberacao({ quests: Object.fromEntries(Object.keys(LIBERACAO_R1).map((q) => [q, 'concluida'])) }), null);
});
test('tutorial: passivo mostra onde acompanhar; ativo ensina a primeira ação', () => {
  const passivo = SISTEMAS.find((s) => !Object.keys(s.acoes || {}).length), ativo = SISTEMAS.find((s) => Object.keys(s.acoes || {}).length);
  assert.match(tutorialDoSistema(passivo).onde, /passivo/); assert.match(tutorialDoSistema(ativo).primeira, /Primeira ação/);
});
test('Vale de Outono: 30 terrenos, liberados pelo nível da Prefeitura (6, 10, 14, 18, 22, 26, 30)', () => {
  assert.equal(D.locais.length, 30); assert.equal(new Set(D.locais.map((l) => l.id)).size, 30);
  const s = { materiais: {}, estruturas: {} };
  const caps = [1, 5, 10, 15, 20, 25, 30].map((n) => { s.estruturas.p1 = { tipo: 'prefeitura', nivel: n }; return locaisAtivos(s, D).length; });
  assert.deepEqual(caps, [6, 10, 14, 18, 22, 26, 30]);
  s.estruturas = {}; assert.equal(locaisAtivos(s, D).length, 6);
  const trancado = enfileirarObras({ materiais: { madeira: 99, pedra: 99 }, estruturas: {} }, D, ['a8'], 1);
  assert.equal(trancado.entraram.length, 0);
});
