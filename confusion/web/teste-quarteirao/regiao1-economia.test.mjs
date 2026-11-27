import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FRAGMENTOS_SONHO_CFG,
  adicionarEssencia,
  saldoEssencia,
  consultarEvolucaoForma,
  evoluirFormaPorFragmentos,
  adicionarFragmentoSonho,
  saldoFragmentoSonho,
} from './regiao1-regras-sonho.js';
import {
  TABELA_ECONOMIA_MODOS,
  METAS_ECONOMIA,
  resumoEconomiaDiaria,
  estimarDiasEvolucao,
  auditarMetasEconomia,
  simularEconomiaPrimeiraHora,
  auditarPrimeiraHora,
  estimarDiasNivel40Inicial,
} from './regiao1-economia-regras.js';
import { iniciarAndarTorreElemental } from './regiao1-torres-regras.js';
import { criarEstadoInicial } from './regiao1-estado.js';
import { garantirEstadoIdle } from './regiao1-idle.js';
import './regiao1-missoes-regras.js';
import { FRAGMENTOS_SONHO_CFG as __CFG_SONHO } from './regiao1-regras-sonho.js';
// Estes testes são anteriores à trava de nível 40 para a forma T5 dos iniciais (coberta em regiao1-banner-iniciais.test.mjs)
__CFG_SONHO.nivelIniciaisPorFase = {};

const novoSave = () => {
  const s = criarEstadoInicial();
  garantirEstadoIdle(s, 40_000_000);
  s.idle.equipe = [
    { uid: 'ini0', especie: 'Brasinha', nivel: 30, xp: 0, tier: 4, estrelas: 2, formaFase: 1 },
  ];
  return s;
};

test('Evolução exige Essências do elemento (1→2: 20m+5méd; 2→3: 30méd+10M) sem consumir fragmentos se faltar', () => {
  assert.deepEqual(FRAGMENTOS_SONHO_CFG.essenciasPorFase[2], { menor: 20, media: 5, maior: 0 });
  assert.deepEqual(FRAGMENTOS_SONHO_CFG.essenciasPorFase[3], { menor: 0, media: 30, maior: 10 });

  const s = novoSave();
  adicionarFragmentoSonho(s, 'fogo', 40);

  // Com fragmentos mas sem essências -> bloqueia e preserva fragmentos
  const bloq1 = consultarEvolucaoForma(s, 0);
  assert.equal(bloq1.podeEvoluir, false);
  assert.equal(bloq1.temEssencias, false);
  assert.equal(bloq1.parEssencia, 'ignea');
  assert.deepEqual(bloq1.faltamEssencias, { menor: 20, media: 5, maior: 0 });
  assert.equal(evoluirFormaPorFragmentos(s, 0).ok, false);
  assert.equal(saldoFragmentoSonho(s, 'fogo'), 40);

  // Entrega exatamente 20 menores + 5 médias -> evolui 1→2
  adicionarEssencia(s, 'fogo', 'menor', 20);
  adicionarEssencia(s, 'fogo', 'media', 5);
  const ev1 = evoluirFormaPorFragmentos(s, 0);
  assert.equal(ev1.ok, true);
  assert.equal(ev1.para, 'Ignavor');
  assert.deepEqual(saldoEssencia(s, 'fogo'), { menor: 0, media: 0, maior: 0 });

  // Falta 1 essência maior para 2→3 -> bloqueia e preserva 30 fragmentos e 30 médias
  adicionarEssencia(s, 'fogo', 'media', 30);
  adicionarEssencia(s, 'fogo', 'maior', 9);
  assert.equal(evoluirFormaPorFragmentos(s, 0).ok, false);
  assert.equal(saldoFragmentoSonho(s, 'fogo'), 30);
  assert.equal(saldoEssencia(s, 'fogo', 'media'), 30);

  // +1 maior -> evolui 2→3, promove T4→T5 e registra marco de evolução
  adicionarEssencia(s, 'fogo', 'maior', 1);
  const ev2 = evoluirFormaPorFragmentos(s, 0);
  assert.equal(ev2.ok, true);
  assert.equal(ev2.para, 'Ignaraz');
  assert.equal(s.idle.equipe[0].tier, 5);
  assert.deepEqual(saldoEssencia(s, 'fogo'), { menor: 0, media: 0, maior: 0 });
  assert.equal(s.idle.missoes.progresso.evolucoes, 2);
});

test('Tabela de Economia Diária revisada: orçamento de energia, metas Casual vs Ativo e 1ª vitória da Torre sem gasto de energia', () => {
  assert.ok(TABELA_ECONOMIA_MODOS.length >= 7);
  const s = novoSave();
  const iniTorre = iniciarAndarTorreElemental(s, 'chama', 1, { agoraMs: 40_000_000 });
  assert.equal(iniTorre.ok, true);
  assert.equal(iniTorre.custoEnergia, 0);
  assert.equal(iniTorre.energiaRestante, 120);

  const casual = resumoEconomiaDiaria('casual');
  const ativo = resumoEconomiaDiaria('ativo');
  assert.ok(casual.energiaDia <= METAS_ECONOMIA.casual.energiaMax);
  assert.ok(ativo.energiaDia <= METAS_ECONOMIA.ativo.energiaMax);
  assert.equal(casual.diamantesDia, 135);
  assert.equal(ativo.diamantesDia, 260);
  assert.ok(ativo.invocacoesEquivalentesSemana > casual.invocacoesEquivalentesSemana);

  const diasCas = estimarDiasEvolucao('casual');
  const diasAtv = estimarDiasEvolucao('ativo');
  assert.ok(diasAtv.dias1Para2 <= diasCas.dias1Para2);
  assert.ok(diasAtv.dias2Para3 < diasCas.dias2Para3);

  const aud = auditarMetasEconomia();
  assert.equal(aud.ok, true);
  assert.equal(aud.resultados.casual.passou, true);
  assert.equal(aud.resultados.ativo.passou, true);
});

test('Economia da Primeira Hora e curva Nv.5→40 para T5 dos iniciais (#148)', () => {
  const h1 = auditarPrimeiraHora();
  assert.equal(h1.ok, true);
  assert.equal(h1.convidado.marcosAtingidos.primeiraReliquia30Min, true);
  assert.equal(h1.convidado.marcosAtingidos.invocacao10xNaHora1, true);
  assert.equal(h1.convidado.marcosAtingidos.sempreComObjetivo, true);
  assert.ok(h1.contaNova.ganhosTotais.diamantes >= 20000);

  const sim = simularEconomiaPrimeiraHora({ comConta: false });
  assert.equal(sim.linhaTempo.length, 5);
  assert.equal(sim.gastosTotais.energia, 0);
  assert.equal(sim.ganhosTotais.invocacoesGratis, 10);

  const cas40 = estimarDiasNivel40Inicial('casual');
  assert.equal(cas40.xpNecessario, 8750);
  assert.equal(cas40.dentroDaMeta3a5Dias, true);
  assert.ok(cas40.diasJogoNormal >= 3 && cas40.diasJogoNormal <= 5);
});
