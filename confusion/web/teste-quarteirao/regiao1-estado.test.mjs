import test from 'node:test';
import assert from 'node:assert/strict';
import {
  criarEstadoInicial,
  descobrirMarco,
  aceitarQuest,
  registrarPista,
  destinosTeleporteDisponiveis,
  registrarVitoriaBoss,
  embarcarNoTrem,
  serializarEstado,
  desserializarEstado,
} from './regiao1-estado.js';

test('Teleporte: C1 só libera missão após descobrir E8 ou D9, e menu só lista outros marcos ativos', () => {
  const e = criarEstadoInicial();
  assert.equal(e.quests.q_tp_c1, 'bloqueada');

  // Descobrir PC7 libera PC7 mas NÃO libera C1
  descobrirMarco(e, 'PC7');
  assert.equal(e.teleportes.PC7.descoberto, true);
  assert.equal(e.teleportes.PC7.ativo, false);
  assert.equal(e.quests.q_tp_pc7, 'disponivel');
  assert.equal(e.quests.q_tp_c1, 'bloqueada');

  // Interagir com marco inativo bloqueia o menu
  assert.equal(destinosTeleporteDisponiveis(e, 'PC7').permitido, false);

  // Descobrir E8 libera E8 e C1
  descobrirMarco(e, 'E8');
  assert.equal(e.quests.q_tp_e8, 'disponivel');
  assert.equal(e.quests.q_tp_c1, 'disponivel');

  // Concluir missão de E8 ativa E8 sem exigir nenhum boss
  aceitarQuest(e, 'q_tp_e8');
  registrarPista(e, 'tp_e8_raizes_limpas');
  assert.equal(e.teleportes.E8.ativo, true);
  assert.equal(e.bossesDerrotados.BOSS_E, false);

  // Menu de E8 abre, mas sem outros marcos ativos mostra lista vazia
  const menu1 = destinosTeleporteDisponiveis(e, 'E8');
  assert.equal(menu1.permitido, true);
  assert.equal(menu1.destinos.length, 0);

  // Ativar C1 e conferir que E8 agora lista C1 e C1 lista E8 (e nunca o inativo PC7)
  aceitarQuest(e, 'q_tp_c1');
  registrarPista(e, 'npc_zeladora_c1_falou');
  registrarPista(e, 'clue_c1_circuito_1');
  registrarPista(e, 'clue_c1_circuito_2');
  assert.equal(e.teleportes.C1.ativo, true);

  const menuE8 = destinosTeleporteDisponiveis(e, 'E8');
  assert.deepEqual(menuE8.destinos.map((d) => d.id), ['C1']);
  const menuC1 = destinosTeleporteDisponiveis(e, 'C1');
  assert.deepEqual(menuC1.destinos.map((d) => d.id), ['E8']);
});

test('Teleporte: descobrir D9 também libera C1', () => {
  const e = criarEstadoInicial();
  descobrirMarco(e, 'D9');
  assert.equal(e.quests.q_tp_d9, 'disponivel');
  assert.equal(e.quests.q_tp_c1, 'disponivel');
});

test('Trem: libera apenas na 2ª vitória entre Espírito da Floresta e Rei Fungo (nas duas ordens); Siren/Golem não liberam', () => {
  // Ordem 1: E -> D
  const e1 = criarEstadoInicial();
  registrarVitoriaBoss(e1, 'BOSS_S');
  registrarVitoriaBoss(e1, 'BOSS_C');
  assert.equal(e1.quests.q_boss_s, 'concluida');
  assert.equal(e1.quests.q_boss_c, 'concluida');
  assert.equal(e1.tremLiberado, false);
  assert.equal(embarcarNoTrem(e1).ok, false);

  registrarVitoriaBoss(e1, 'BOSS_E');
  assert.equal(e1.tremLiberado, false);
  const r2 = registrarVitoriaBoss(e1, 'BOSS_D');
  assert.equal(r2.tremLiberadoAgora, true);
  assert.equal(e1.tremLiberado, true);
  assert.equal(e1.quests.q_primeira_partida, 'ativa');

  const viagem = embarcarNoTrem(e1);
  assert.equal(viagem.ok, true);
  assert.equal(e1.viagemTremConcluida, true);
  assert.equal(e1.quests.q_primeira_partida, 'concluida');
  assert.equal(e1.teleportes.REINO.descoberto, true);
  assert.equal(e1.teleportes.REINO.ativo, true);

  // Ordem 2: D -> E
  const e2 = criarEstadoInicial();
  registrarVitoriaBoss(e2, 'BOSS_D');
  assert.equal(e2.tremLiberado, false);
  registrarVitoriaBoss(e2, 'BOSS_E');
  assert.equal(e2.tremLiberado, true);
});

test('Pistas retroativas e secundárias (Fazenda + Corrida)', () => {
  const e = criarEstadoInicial();
  // Encontra pista de CC7 antes mesmo de aceitar a missão
  registrarPista(e, 'clue_cc7_pulso_1');
  registrarPista(e, 'clue_cc7_pulso_2');
  registrarPista(e, 'clue_cc7_pulso_3');
  descobrirMarco(e, 'CC7');
  aceitarQuest(e, 'q_tp_cc7');
  assert.equal(e.quests.q_tp_cc7, 'concluida');
  assert.equal(e.teleportes.CC7.ativo, true);

  // Secundárias liberam Fazenda e Corrida sem mexer no trem
  aceitarQuest(e, 'q_sec_canteiro');
  registrarPista(e, 'npc_jardineira_c1_falou');
  registrarPista(e, 'clue_c1_canteiro');
  assert.equal(e.desbloqueios.fazenda, true);

  aceitarQuest(e, 'q_sec_entrega');
  registrarPista(e, 'npc_mensageiro_c1_falou');
  registrarPista(e, 'clue_c0_entrega_pier');
  assert.equal(e.desbloqueios.corrida, true);
  assert.equal(e.tremLiberado, false);
});

test('Save/Load preserva descoberta, ativação de teleportes, quests e viagem de trem', () => {
  const e = criarEstadoInicial();
  descobrirMarco(e, 'E8');
  descobrirMarco(e, 'D9');
  aceitarQuest(e, 'q_tp_e8');
  registrarPista(e, 'tp_e8_raizes_limpas');
  registrarVitoriaBoss(e, 'BOSS_E');
  registrarVitoriaBoss(e, 'BOSS_D');
  embarcarNoTrem(e);

  const recarregado = desserializarEstado(serializarEstado(e));
  assert.equal(recarregado.teleportes.E8.descoberto, true);
  assert.equal(recarregado.teleportes.E8.ativo, true);
  assert.equal(recarregado.teleportes.D9.descoberto, true);
  assert.equal(recarregado.teleportes.D9.ativo, false);
  assert.equal(recarregado.teleportes.REINO.ativo, true);
  assert.equal(recarregado.tremLiberado, true);
  assert.equal(recarregado.viagemTremConcluida, true);
  assert.equal(recarregado.quests.q_primeira_partida, 'concluida');
});
