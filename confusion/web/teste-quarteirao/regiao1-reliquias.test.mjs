import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONJUNTOS_RELIQUIAS,
  CATALOGO_ARMAS_UNICAS,
  SECUNDARIOS_POR_RARIDADE,
  reliquiasDe,
  armasUnicasDe,
  valorPrincipalNoNivel,
  concederReliquia,
  reforcarReliquia,
  recalibrarReliquia,
  trancarReliquia,
  desmontarReliquia,
  filtrarReliquias,
  equiparReliquia,
  salvarPredefinicaoReliquias,
  aplicarPredefinicaoReliquias,
  equiparReliquiasRecomendadas,
  criarArmaUnica,
  reforcarArmaUnica,
  equiparArmaUnica,
  calcularBonusEquipamentoOnirico,
} from './regiao1-reliquias-regras.js';
import { criarEstadoInicial, serializarEstado, desserializarEstado } from './regiao1-estado.js';
import { garantirEstadoIdle } from './regiao1-idle.js';
import { validateSave } from '../../../api/_lib/confusion-save-lib.js';

const novoSave = () => {
  const s = criarEstadoInicial();
  garantirEstadoIdle(s, 30_000_000);
  s.idle.equipe = [
    { uid: 'f0', especie: 'Brasinha', nivel: 100, xp: 0, tier: 4, estrelas: 5 },
    { uid: 'w0', especie: 'Gotalume', nivel: 40, xp: 0, tier: 4, estrelas: 2 },
  ];
  return s;
};

test('Relíquias: partes fixas/variáveis, lendária +15 exata, reforço +0→+15, recalibração nv.100, trancar e desmontar', () => {
  assert.equal(Object.keys(CONJUNTOS_RELIQUIAS).length, 13);
  assert.equal(valorPrincipalNoNivel('ataque_pct', 'lendaria', 15), 0.30);
  assert.equal(valorPrincipalNoNivel('critico', 'lendaria', 15), 0.20);
  assert.equal(valorPrincipalNoNivel('velocidade', 'lendaria', 15), 25);
  assert.equal(valorPrincipalNoNivel('roubo_vida', 'lendaria', 15), 0.08);
  assert.equal(SECUNDARIOS_POR_RARIDADE.comum, 0);
  assert.equal(SECUNDARIOS_POR_RARIDADE.lendaria, 4);

  const s = novoSave();
  s.recompensas.gold = 100_000;
  reliquiasDe(s).poReforco = 5_000;

  const rCom = concederReliquia(s, { parte: 'coroa', elemento: 'fogo', raridade: 'comum', conjunto: 'furia' }).reliquia;
  assert.equal(rCom.principal.attr, 'vida_flat');
  assert.equal(rCom.secundarios.length, 0);
  // +3 no comum abre o 1º secundário
  assert.equal(reforcarReliquia(s, rCom.id).ok, true);
  assert.equal(reforcarReliquia(s, rCom.id).ok, true);
  assert.equal(reforcarReliquia(s, rCom.id).ok, true);
  assert.equal(rCom.reforco, 3);
  assert.equal(rCom.secundarios.length, 1);

  const rLen = concederReliquia(s, { parte: 'anel', elemento: 'fogo', raridade: 'lendaria', conjunto: 'furia', principalAttr: 'ataque_pct' }).reliquia;
  assert.equal(rLen.secundarios.length, 4);
  for (let k = 0; k < 15; k++) assert.equal(reforcarReliquia(s, rLen.id).ok, true);
  assert.equal(rLen.reforco, 15);
  assert.equal(rLen.principal.valor, 0.30);

  // Recalibrar bloqueado abaixo do nível 100; liberado em nível 100
  assert.equal(recalibrarReliquia(s, rLen.id, 0, 'w0').ok, false);
  const antAttr = rLen.secundarios[0].attr;
  const rec = recalibrarReliquia(s, rLen.id, 0, 'f0');
  assert.equal(rec.ok, true);
  assert.notEqual(rec.novo.attr, antAttr);

  // Trancar impede desmonte; destrancar devolve pó
  assert.equal(trancarReliquia(s, rCom.id, true).trancada, true);
  assert.equal(desmontarReliquia(s, rCom.id).ok, false);
  trancarReliquia(s, rCom.id, false);
  const poAntes = s.idle.reliquias.poReforco;
  const des = desmontarReliquia(s, rCom.id);
  assert.equal(des.ok, true);
  assert.ok(s.idle.reliquias.poReforco > poAntes);
});

test('Relíquias: só equipa no mesmo elemento, bolsa 200 vagas, filtros, predefinições e teto de +70% de poder', () => {
  const s = novoSave();
  // Enche 4 relíquias de fogo lendárias +15 conjunto Fúria (pior caso máximo)
  s.recompensas.gold = 500_000;
  reliquiasDe(s).poReforco = 50_000;
  armasUnicasDe(s);

  const pSlots = [
    ['coroa', 'vida_flat'],
    ['amuleto', 'ataque_flat'],
    ['anel', 'ataque_pct'],
    ['talisma', 'velocidade'],
  ];
  for (const [parte, principalAttr] of pSlots) {
    const rel = concederReliquia(s, { parte, elemento: 'fogo', raridade: 'lendaria', conjunto: 'furia', principalAttr, rng: () => 0.99 }).reliquia;
    for (let i = 0; i < 15; i++) reforcarReliquia(s, rel.id, { rng: () => 0.99 });
    // Recusa equipar em água ('w0'); aceita em fogo ('f0')
    assert.equal(equiparReliquia(s, 'w0', rel.id).elementoIncompativel, true);
    assert.equal(equiparReliquia(s, 'f0', rel.id).ok, true);
  }

  // Salva e reaplica predefinição
  assert.equal(salvarPredefinicaoReliquias(s, 'f0', 'chefes').ok, true);
  assert.equal(aplicarPredefinicaoReliquias(s, 'f0', 'chefes').equipadas.length, 4);
  assert.equal(filtrarReliquias(s, { elemento: 'fogo', raridade: 'lendaria' }).length, 4);

  // Arma única das 10 linhagens iniciais/Halloween + desbloqueio/criação e reforço +5
  for (const slug of ['noctarn', 'ignavor', 'vaelith', 'brotavel', 'solarin', 'abobrisco', 'velalume', 'mortalio', 'vitrarco', 'abyssar']) {
    assert.ok(CATALOGO_ARMAS_UNICAS[slug], `Faltando arma única de ${slug}`);
  }
  s.idle.armasUnicas.fragmentos.ignavor = 20;
  // f0 está em nível 100 -> cria grátis pelo marco de nível 100 e depois reforça até +5
  const cr = criarArmaUnica(s, 'Brasinha');
  assert.equal(cr.ok, true);
  assert.equal(cr.estado.viaNivel100, true);
  for (let i = 0; i < 5; i++) assert.equal(reforcarArmaUnica(s, 'Ignavor').ok, true);
  assert.equal(equiparArmaUnica(s, 'f0').ok, true);
  assert.equal(equiparArmaUnica(s, 'w0', 'Ignavor').ok, false);

  // Teto garantido: 4 relíquias lendárias +15 + conjunto 4p Fúria + arma única +5 nunca passam de +70%
  const bonusMax = calcularBonusEquipamentoOnirico(s, 'f0');
  assert.ok(bonusMax.ganhoPoderFinal <= 0.70001, `Teto ultrapassado: ${bonusMax.ganhoPoderFinal}`);
  assert.equal(bonusMax.conjuntosAtivos[0].pecas, 4);
  assert.equal(bonusMax.armaUnica.reforco, 5);

  // Bolsa tem teto de 200 vagas
  while (s.idle.reliquias.bolsa.length < 200) {
    assert.equal(concederReliquia(s, { parte: 'coroa', elemento: 'agua', raridade: 'comum' }).ok, true);
  }
  assert.equal(concederReliquia(s, { parte: 'coroa', elemento: 'agua', raridade: 'comum' }).lotada, true);
  assert.equal(equiparReliquiasRecomendadas(s, 'w0').equipadas.length > 0, true);

  // Round-trip em save e nuvem com 200 relíquias
  const rec = desserializarEstado(serializarEstado(s));
  assert.equal(rec.idle.reliquias.bolsa.length, 200);
  assert.equal(rec.idle.armasUnicas.possuidas.ignavor.reforco, 5);
  const val = validateSave({ game: 'confusion-waves', regiao1: JSON.parse(serializarEstado(rec)), conta: rec.conta });
  assert.equal(val.ok, true);
});

test('Relíquias: flats escalam pelo nível/statsBase e crítico entra no ganhoPoder', () => {
  const s = novoSave();
  s.recompensas.gold = 200_000;
  reliquiasDe(s).poReforco = 10_000;

  const coroa = concederReliquia(s, { parte: 'coroa', elemento: 'agua', raridade: 'lendaria', conjunto: 'vigor', principalAttr: 'vida_flat', rng: () => 0.1 }).reliquia;
  const amuleto = concederReliquia(s, { parte: 'amuleto', elemento: 'agua', raridade: 'lendaria', conjunto: 'furia', principalAttr: 'ataque_flat', rng: () => 0.1 }).reliquia;
  for (let i = 0; i < 15; i++) {
    reforcarReliquia(s, coroa.id, { rng: () => 0.1 });
    reforcarReliquia(s, amuleto.id, { rng: () => 0.1 });
  }
  equiparReliquia(s, 'w0', coroa.id);
  equiparReliquia(s, 'w0', amuleto.id);

  // w0 é Nv.40: flats precisam ficar bem abaixo do valor bruto de Nv.100 (260 HP / 60 ATQ)
  const bNv40 = calcularBonusEquipamentoOnirico(s, 'w0');
  assert.ok(bNv40.atributos.vida_flat < 140 && bNv40.atributos.ataque_flat < 35);

  const bNv100 = calcularBonusEquipamentoOnirico(s, { uid: 'w0', especie: 'Gotalume', nivel: 100 });
  assert.ok(bNv100.atributos.vida_flat > bNv40.atributos.vida_flat);
  assert.ok(bNv100.atributos.ataque_flat > bNv40.atributos.ataque_flat);

  // Crítico aumenta ganhoPoderBruto mesmo sem mexer em ataque_pct
  const bSemCrit = calcularBonusEquipamentoOnirico(s, { uid: 'sem_crit', especie: 'Gotalume', nivel: 100 });
  const rCrit = concederReliquia(s, { parte: 'anel', elemento: 'agua', raridade: 'lendaria', conjunto: 'precisao', principalAttr: 'critico', rng: () => 0.9 }).reliquia;
  for (let i = 0; i < 15; i++) reforcarReliquia(s, rCrit.id, { rng: () => 0.9 });
  s.idle.equipe.push({ uid: 'c1', especie: 'Gotalume', nivel: 100, xp: 0, tier: 4, estrelas: 2 });
  equiparReliquia(s, 'c1', rCrit.id);
  const bComCrit = calcularBonusEquipamentoOnirico(s, 'c1');
  assert.ok(bComCrit.ganhoPoderBruto > bSemCrit.ganhoPoderBruto);
});
