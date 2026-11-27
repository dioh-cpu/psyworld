import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DOMADORES_CFG,
  CATALOGO_DOMADORES,
  DOMADORES_POR_ID,
  MARCOS_HABILIDADES_DOMADOR,
  CURVA_DESBLOQUEIO_DOMADORES,
  habilidadesEscaladasDomador,
  rankHabilidadeDomador,
  domadoresDe,
  desbloquearDomador,
  selecionarDomadorAtivo,
  ganharXpDomador,
  usarPocaoXpDomador,
  listarDomadores,
  fichaDomadorCombate,
  criarEstadoDomadorBatalha,
  carregarBarraDomador,
  escolherAcaoDomador,
} from './regiao1-domadores-regras.js';
import { KITS } from './regiao1-batalha-habilidades.js';
import { hwDe, darPocao } from './regiao1-halloween-regras.js';
import { criarEstadoInicial, serializarEstado, desserializarEstado } from './regiao1-estado.js';
import { garantirEstadoIdle } from './regiao1-idle.js';
import { validateSave } from '../../../api/_lib/confusion-save-lib.js';

const novoSave = () => {
  const s = criarEstadoInicial();
  garantirEstadoIdle(s, 60_000_000);
  return s;
};

test('Domadores auxiliares: Azazel inicial, Manipulador (Cap.2 ou 1500💎), kits alinhados ao combate e não ocupa vaga', () => {
  assert.equal(CATALOGO_DOMADORES.length, 2);
  assert.equal(DOMADORES_CFG.vagasOniricos, 4);
  assert.equal(DOMADORES_CFG.ocupaVagaOnirico, false);
  assert.equal(DOMADORES_CFG.alvejavel, false);

  // Kit do Manipulador em regiao1-domadores-regras bate com o do combate (regiao1-batalha-habilidades.js)
  const kitCombateManip = KITS['Manipulador das Oito Lâminas'];
  assert.ok(Array.isArray(kitCombateManip) && kitCombateManip.length === 3);
  assert.deepEqual(
    DOMADORES_POR_ID.manipulador.habilidades.map((h) => h.id),
    kitCombateManip.map((h) => h.id),
  );

  const s = novoSave();
  // Começa com Azazel desbloqueado e ativo
  assert.equal(domadoresDe(s).ativo, 'azazel');
  assert.equal(selecionarDomadorAtivo(s, 'manipulador').ok, false);

  // Sem diamantes suficientes falha sem desbloquear; com 1500 desbloqueia uma vez
  s.recompensas.diamantes = 500;
  assert.equal(desbloquearDomador(s, 'manipulador', { pagarDiamantes: true }).ok, false);
  s.recompensas.diamantes = 1500;
  const desb = desbloquearDomador(s, 'manipulador', { pagarDiamantes: true });
  assert.equal(desb.ok, true);
  assert.equal(desb.via, 'diamantes');
  assert.equal(s.recompensas.diamantes, 0);
  assert.equal(desbloquearDomador(s, 'manipulador', { pagarDiamantes: true }).jaDesbloqueado, true);

  assert.equal(selecionarDomadorAtivo(s, 'manipulador').ok, true);
  assert.equal(fichaDomadorCombate(s).id, 'manipulador');

  // Outra conta desbloqueia grátis ao concluir Capítulo 2 da Campanha Mini
  const s2 = novoSave();
  s2.idle.campanhaMini.capitulosConcluidos[2] = true;
  assert.equal(desbloquearDomador(s2, 'manipulador').via, 'marco');
});

test('Domadores auxiliares: XP próprio (idempotente + poção), passiva crescente, barra de energia 3 turnos e whitelist no save', () => {
  const s = novoSave();
  s.idle.campanhaMini.capitulosConcluidos[2] = true;
  desbloquearDomador(s, 'manipulador');
  selecionarDomadorAtivo(s, 'manipulador');

  const xp1 = ganharXpDomador(s, 'manipulador', 500, { eventoId: 'ev_xp_1' });
  assert.equal(xp1.ok, true);
  assert.ok(xp1.nivel >= 3);
  assert.equal(ganharXpDomador(s, 'manipulador', 500, { eventoId: 'ev_xp_1' }).jaPago, true);

  hwDe(s);
  darPocao(s, 'pocao_xp_p', 2);
  const xpPoc = usarPocaoXpDomador(s, 'manipulador', 'pocao_xp_p', 2);
  assert.equal(xpPoc.ok, true);
  assert.ok(xpPoc.nivel > xp1.nivel);

  // Barra de energia em batalha: +25 por turno aliado -> dispara no 4º turno, usando S3 primeiro
  const est = criarEstadoDomadorBatalha(s);
  assert.equal(est.ocupaVaga, false);
  carregarBarraDomador(est, 'turno_aliado');
  assert.equal(escolherAcaoDomador(est), null);
  carregarBarraDomador(est, 'turno_aliado');
  assert.equal(escolherAcaoDomador(est), null);
  carregarBarraDomador(est, 'turno_aliado');
  assert.equal(escolherAcaoDomador(est), null);
  carregarBarraDomador(est, 'turno_aliado');
  const acao1 = escolherAcaoDomador(est);
  assert.ok(acao1);
  assert.equal(acao1.habilidade.id, 'tempestade_oito_laminas'); // S3 (cd 5)
  assert.equal(est.barraEnergia, 0);

  // Passiva do Manipulador é maior em nível alto e listarDomadores devolve estado completo
  const lista = listarDomadores(s);
  const manip = lista.find((d) => d.id === 'manipulador');
  assert.ok(manip.passivaAtual.ataquePct > 0.08 && manip.passivaAtual.critico > 0.05);

  // Save/nuvem
  const rec = desserializarEstado(serializarEstado(s));
  assert.equal(rec.idle.domadores.ativo, 'manipulador');
  assert.equal(rec.idle.domadores.progresso.manipulador.nivel, manip.nivel);
  const val = validateSave({ game: 'confusion-waves', regiao1: JSON.parse(serializarEstado(rec)), conta: rec.conta });
  assert.equal(val.ok, true);
});

test('Domadores auxiliares: curva de liberação e escalonamento das habilidades nos marcos 1 / 20 / 45 / 70 / 100', () => {
  assert.equal(CURVA_DESBLOQUEIO_DOMADORES.length, 2);
  assert.equal(MARCOS_HABILIDADES_DOMADOR.length, 5);
  assert.equal(rankHabilidadeDomador(1).rank, 1);
  assert.equal(rankHabilidadeDomador(20).rank, 2);
  assert.equal(rankHabilidadeDomador(45).rank, 3);
  assert.equal(rankHabilidadeDomador(70).rank, 4);
  assert.equal(rankHabilidadeDomador(100).rank, 5);

  const h1 = habilidadesEscaladasDomador('manipulador', 1);
  const h45 = habilidadesEscaladasDomador('manipulador', 45);
  const h100 = habilidadesEscaladasDomador('manipulador', 100);
  assert.equal(h1[0].mult, 0.85);
  assert.ok(h45[0].mult > h1[0].mult); // +10% no S1
  assert.equal(h45[1].cd, 2);           // S2 cd 3 -> 2
  assert.equal(h45[1].efeitos[0].turnos, 3); // +1 turno buff
  assert.ok(h100[2].mult > h1[2].mult); // +15% no S3
  assert.equal(h100[2].cd, 4);          // S3 cd 5 -> 4

  const s = novoSave();
  s.idle.domadores.progresso.azazel.nivel = 100;
  const est = criarEstadoDomadorBatalha(s, 'azazel');
  assert.equal(est.ganhoPorTurnoAliado, 30);
  assert.equal(est.habilidades[1].cd, 2);
  assert.equal(est.habilidades[2].cd, 4);
  carregarBarraDomador(est, 'turno_aliado');
  assert.equal(est.barraEnergia, 30);
});
