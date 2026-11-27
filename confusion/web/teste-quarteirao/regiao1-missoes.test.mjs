import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MISSOES_PARALELAS_CATALOGO,
  CATALOGO_MARCOS,
  listarParalelasCapitulo,
  iniciarParalela,
  avancarEtapaParalela,
  registrarMarco,
  listarMarcosPorCategoria,
  temPremioMissaoPendente,
  coletarMarco,
} from './regiao1-missoes-regras.js';
import { concluirFaseCampanhaMini } from './regiao1-campanha-mini-regras.js';
import { criarEstadoInicial, serializarEstado, desserializarEstado } from './regiao1-estado.js';
import { garantirEstadoIdle } from './regiao1-idle.js';
import { expDe } from './regiao1-exp-regras.js';
import { validateSave } from '../../../api/_lib/confusion-save-lib.js';

const novoSave = () => {
  const s = criarEstadoInicial();
  garantirEstadoIdle(s, 10_000_000);
  s.idle.equipe = [
    { uid: 'u0', especie: 'Brasinha', nivel: 100, xp: 0, tier: 4, estrelas: 6 },
    { uid: 'u1', especie: 'Gotalume', nivel: 100, xp: 0, tier: 4, estrelas: 2 },
    { uid: 'u2', especie: 'Sementil', nivel: 100, xp: 0, tier: 4, estrelas: 1 },
  ];
  s.idle.formacao = ['u0', 'u1', 'u2', null];
  return s;
};

test('Missões paralelas: 20 por capítulo (240 total), diálogo + batalhas, relíquia rara + título + enfeite do Refúgio', () => {
  assert.equal(MISSOES_PARALELAS_CATALOGO.length, 240);
  const s = novoSave();
  assert.equal(iniciarParalela(s, 'par_2_1').ok, false);

  // Libera fase 2-3, 2-6 e 2-9
  const cm = s.idle.campanhaMini;
  cm.fases['1-10'] = { vencida: true, estrelas: 3 };
  cm.fases['2-2'] = { vencida: true, estrelas: 3 };
  cm.fases['2-3'] = { vencida: true, estrelas: 3 };
  cm.fases['2-6'] = { vencida: true, estrelas: 3 };
  cm.fases['2-9'] = { vencida: true, estrelas: 3 };

  const listaCap2 = listarParalelasCapitulo(s, 2);
  assert.equal(listaCap2.length, 20);
  assert.equal(listaCap2[0].titulo, 'O apicultor desaparecido');
  assert.equal(listaCap2[1].titulo, 'Resina nas Cristas');
  assert.equal(listaCap2[2].titulo, 'O sino de bronze');
  assert.equal(listaCap2.slice(0, 3).every((p) => p.estado === 'disponivel'), true);
  assert.ok(listaCap2.every((p) => Boolean(p.titulo && p.objetivo && p.faseRequisitoId)));

  // Executa as 3 paralelas principais do Cap 2: derrota não avança, diálogo + vitórias avançam, paga uma única vez
  for (const p of listaCap2.slice(0, 3)) {
    const ini = iniciarParalela(s, p.id);
    assert.equal(ini.ok, true);
    assert.equal(ini.etapaAtual.tipo, 'dialogo');
    assert.equal(avancarEtapaParalela(s, p.id).ok, true); // -> batalha 1
    assert.equal(avancarEtapaParalela(s, p.id, { fim: 'derrota' }).ok, false);
    for (let k = 1; k < p.etapas.length; k++) {
      const r = avancarEtapaParalela(s, p.id, { fim: 'vitoria' });
      assert.equal(r.ok, true);
      if (k === p.etapas.length - 1) {
        assert.equal(r.concluida, true);
        assert.equal(r.premios.diamantes, 30);
        assert.equal(r.premios.reliquia.raridade, 'rara');
        assert.ok(s.idle.missoes.titulos[p.recompensa.tituloPerfil]);
        if (p.id === 'par_2_3') assert.ok(r.premios.enfeiteLiberado);
      }
    }
    assert.equal(avancarEtapaParalela(s, p.id, { fim: 'vitoria' }).ok, false);
  }
  assert.equal(s.recompensas.diamantes, 90);
  assert.equal(s.idle.missoes.enfeitesRefugio.enf_cap_2, true);
});

test('Missões de marco: ganchos, categorias, coleta única, selo pendente e persistência no save', () => {
  const s = novoSave();
  // Marco obrigatório: fase 1-5 do Capítulo 1 (disparado pela Campanha Mini via gancho)
  for (let n = 1; n <= 5; n++) {
    concluirFaseCampanhaMini(s, `1-${n}`, { fim: 'vitoria', todosVivos: true, classes: { guerreiro: 1, tanque: 1, mago: 1, assassino: 1, suporte: 1 }, elementos: { planta: 2 }, supremasUsadas: 1 }, { batalhaId: `m_${n}` });
  }
  assert.equal(temPremioMissaoPendente(s), true);
  assert.equal(coletarMarco(s, 'marco_cm_1_5').premio.diamantes, 30);
  assert.equal(coletarMarco(s, 'marco_cm_1_5').ok, false); // coleta única

  // Marcos de Calabouço (10x Forja Rubra + nv 10/13), Torre Elemental (5), Torre Única (10), Oníricos (3 nv100, 6★, evolução), Relíquia, Arma Única e Coleção
  for (let i = 0; i < 10; i++) registrarMarco(s, 'calabouco', { calabouco: 'forja-rubra', nivel: 13 });
  registrarMarco(s, 'torre_elemental', { andar: 50 });
  registrarMarco(s, 'torre_unica', { andar: 10 });
  registrarMarco(s, 'evolucao');
  registrarMarco(s, 'reliquia_conjunto4');
  registrarMarco(s, 'reliquia_reforco', { nivel: 15 });
  registrarMarco(s, 'arma_unica');
  registrarMarco(s, 'colecao', { especies: 30 });

  assert.equal(coletarMarco(s, 'marco_cal_forja-rubra_10').ok, true);
  assert.equal(coletarMarco(s, 'marco_cal_nv10').premio.reliquia.raridade, 'lendaria');
  assert.equal(coletarMarco(s, 'marco_cal_nv13').premio.reliquia.raridade, 'lendaria');
  assert.equal(coletarMarco(s, 'marco_torre_el_50').premio.diamantes, 100);
  assert.equal(coletarMarco(s, 'marco_torre_unica_10').premio.fragmentoEscolha, 1);
  assert.equal(s.idle.armasUnicas.escolhasPendentes, 1);
  assert.equal(coletarMarco(s, 'marco_3_nv_100').premio.ticketsSemanais, 1);
  assert.equal(coletarMarco(s, 'marco_6_estrelas').premio.ticketsSemanais, 1);
  assert.equal(coletarMarco(s, 'marco_rel_conj_4').premio.diamantes, 50);
  assert.equal(coletarMarco(s, 'marco_rel_mais_15').premio.poReforco, 20);
  assert.equal(coletarMarco(s, 'marco_arma_unica_1').premio.diamantes, 100);
  assert.equal(coletarMarco(s, 'marco_col_30').premio.ticketsPermanentes, 3);
  assert.ok(expDe(s).ticketsSemanais >= 2);
  assert.ok(s.idle.armasUnicas.liberadasPorNivel100.Brasinha);

  const grupos = listarMarcosPorCategoria(s);
  assert.ok(grupos.Campanha && grupos.Calabouços && grupos.Torres && grupos.Oníricos && grupos.Relíquias);
  assert.ok(CATALOGO_MARCOS.length >= 35);

  const rec = desserializarEstado(serializarEstado(s));
  assert.equal(rec.idle.missoes.marcosColetados.marco_cm_1_5, true);
  assert.equal(rec.idle.armasUnicas.escolhasPendentes, 1);
  assert.equal(validateSave({ game: 'confusion-waves', regiao1: JSON.parse(serializarEstado(rec)), conta: rec.conta }).ok, true);
});
