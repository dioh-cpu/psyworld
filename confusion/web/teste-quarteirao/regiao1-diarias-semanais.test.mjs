import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CATALOGO_DIARIAS_MODOS,
  CATALOGO_SEMANAIS_MODOS,
  ROTACAO_MISSOES_CFG,
  registrarProgressoRotacao,
  listarDiariasModos,
  listarSemanaisModos,
  coletarMissaoRotacao,
  coletarBauRotacao,
  resumoEconomiaRotacao,
} from './regiao1-diarias-semanais-regras.js';
import { expDe } from './regiao1-exp-regras.js';
import { saldoEssencia } from './regiao1-regras-sonho.js';
import { criarEstadoInicial, serializarEstado, desserializarEstado } from './regiao1-estado.js';
import { garantirEstadoIdle } from './regiao1-idle.js';
import { validateSave } from '../../../api/_lib/confusion-save-lib.js';

const novoSave = (agoraMs) => {
  const s = criarEstadoInicial();
  garantirEstadoIdle(s, agoraMs);
  return s;
};

test('Diárias e Semanais dos modos novos: metas alinhadas a ECONOMIA_DIARIA.md, coleta única e virada de ciclo', () => {
  assert.equal(CATALOGO_DIARIAS_MODOS.length, 5);
  assert.equal(CATALOGO_SEMANAIS_MODOS.length, 5);

  const eco = resumoEconomiaRotacao();
  assert.equal(eco.diariaMissoes.diamantes, 60);
  assert.equal(eco.diariaMissoes.ouro, 950);
  assert.equal(eco.diariaMissoes.poReforco, 10);
  assert.equal(eco.semanalComBau.ticketsPermanentes, 2);
  assert.equal(eco.semanalComBau.ticketsSemanais, 2);

  const t0 = ROTACAO_MISSOES_CFG.semanaMs * 10;
  const s = novoSave(t0);

  // Avança todos os tipos necessários para diárias (e parcialmente semanais)
  registrarProgressoRotacao(s, 'campanha_mini', 2, t0);
  registrarProgressoRotacao(s, 'torre', 1, t0);
  registrarProgressoRotacao(s, 'calabouco', 2, t0);
  registrarProgressoRotacao(s, 'reliquia', 1, t0);
  registrarProgressoRotacao(s, 'domador', 1, t0);

  const dLista = listarDiariasModos(s, t0);
  assert.equal(dLista.itens.every((x) => x.pronta), true);
  assert.equal(coletarBauRotacao(s, 'diaria', t0).ok, false); // precisa coletar as 5 antes

  for (const m of CATALOGO_DIARIAS_MODOS) {
    assert.equal(coletarMissaoRotacao(s, 'diaria', m.id, t0).ok, true);
    assert.equal(coletarMissaoRotacao(s, 'diaria', m.id, t0).jaColetada, true);
  }
  const bauD = coletarBauRotacao(s, 'diaria', t0);
  assert.equal(bauD.ok, true);
  assert.equal(bauD.premio.diamantes, 15);
  assert.equal(coletarBauRotacao(s, 'diaria', t0).jaColetado, true);

  // Fecha metas semanais ao longo dos dias e coleta semanais + baú semanal
  registrarProgressoRotacao(s, 'campanha_mini', 8, t0 + ROTACAO_MISSOES_CFG.diaMs);
  registrarProgressoRotacao(s, 'torre', 6, t0 + ROTACAO_MISSOES_CFG.diaMs);
  registrarProgressoRotacao(s, 'calabouco', 10, t0 + ROTACAO_MISSOES_CFG.diaMs);
  registrarProgressoRotacao(s, 'reliquia', 4, t0 + ROTACAO_MISSOES_CFG.diaMs);
  registrarProgressoRotacao(s, 'domador', 4, t0 + ROTACAO_MISSOES_CFG.diaMs);

  const sLista = listarSemanaisModos(s, t0 + ROTACAO_MISSOES_CFG.diaMs);
  assert.equal(sLista.itens.every((x) => x.pronta), true);
  for (const m of CATALOGO_SEMANAIS_MODOS) {
    assert.equal(coletarMissaoRotacao(s, 'semanal', m.id, t0 + ROTACAO_MISSOES_CFG.diaMs).ok, true);
  }
  assert.equal(coletarBauRotacao(s, 'semanal', t0 + ROTACAO_MISSOES_CFG.diaMs).ok, true);
  assert.equal(expDe(s).tickets, 2);
  assert.equal(expDe(s).ticketsSemanais, 2);
  assert.equal(saldoEssencia(s, 'ignea', 'media'), 3);

  // Save/nuvem preserva estado e bloqueia recoleta após reload
  const rec = desserializarEstado(serializarEstado(s));
  assert.equal(coletarBauRotacao(rec, 'diaria', t0 + ROTACAO_MISSOES_CFG.diaMs).ok, false);
  assert.equal(coletarBauRotacao(rec, 'semanal', t0 + ROTACAO_MISSOES_CFG.diaMs).jaColetado, true);
  const val = validateSave({ game: 'confusion-waves', regiao1: JSON.parse(serializarEstado(rec)), conta: rec.conta });
  assert.equal(val.ok, true);

  // Virada de semana reseta ciclo semanal limpamente
  const proxSem = listarSemanaisModos(rec, t0 + ROTACAO_MISSOES_CFG.semanaMs);
  assert.equal(proxSem.itens.every((x) => x.progresso === 0 && !x.coletada), true);
});
