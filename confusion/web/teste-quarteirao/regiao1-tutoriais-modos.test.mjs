import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TUTORIAIS_MODOS,
  IDS_TUTORIAIS_MODOS,
  tutorialModoVisto,
  marcarTutorialModoVisto,
  renderBalaoTutorialModo,
  tratarCliqueTutorialModo,
} from './regiao1-tutoriais-modos.js';
import { criarEstadoInicial, serializarEstado, desserializarEstado } from './regiao1-estado.js';

test('tutoriais de modos cobrem todos os 9 modos exigidos (sem energia, com ondas e domador) e exibem uma única vez por conta', () => {
  const esperados = [
    'campanha_mini',
    'missoes',
    'torres',
    'calaboucos_rel',
    'reliquias',
    'evolucao_essencias',
    'domadores',
    'ondas',
    'domador_batalha',
  ];
  assert.deepEqual([...IDS_TUTORIAIS_MODOS].sort(), [...esperados].sort());

  const save = criarEstadoInicial();
  assert.equal(renderBalaoTutorialModo(save, 'energia'), '', 'Tutorial de energia não deve mais ser exibido');
  assert.match(TUTORIAIS_MODOS.reliquias.texto, /4 Relíquias.*Arma Única/i);
  for (const id of esperados) {
    assert.ok(TUTORIAIS_MODOS[id].titulo && TUTORIAIS_MODOS[id].texto.length > 20);
    assert.ok(!/energia/i.test(TUTORIAIS_MODOS[id].texto), `Tutorial ${id} não deve mencionar energia`);
    assert.equal(tutorialModoVisto(save, id), false);
    const htmlAntes = renderBalaoTutorialModo(save, id);
    assert.ok(htmlAntes.includes(`data-tut-modo-ok="${id}"`), `HTML deve renderizar botão de dispensa para ${id}`);
  }

  let salvou = 0;
  let fechou = null;
  const ok = tratarCliqueTutorialModo(
    { tutModoOk: 'reliquias' },
    { save, salvar: () => { salvou += 1; }, aoFechar: (id) => { fechou = id; } },
  );
  assert.equal(ok, true);
  assert.equal(salvou, 1);
  assert.equal(fechou, 'reliquias');
  assert.equal(tutorialModoVisto(save, 'reliquias'), true);
  assert.equal(renderBalaoTutorialModo(save, 'reliquias'), '');

  // Marcar novamente é idempotente
  assert.equal(marcarTutorialModoVisto(save, 'reliquias'), false);

  // Persiste após serializar + desserializar (reload / nuvem)
  const rec = desserializarEstado(serializarEstado(save));
  assert.equal(tutorialModoVisto(rec, 'reliquias'), true);
  assert.equal(tutorialModoVisto(rec, 'domadores'), false);
});
