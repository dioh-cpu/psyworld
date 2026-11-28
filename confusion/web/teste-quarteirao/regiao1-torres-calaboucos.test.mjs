import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TORRES_ELEMENTAIS_CATALOGO,
  TORRES_UNICAS_CATALOGO,
  nivelAndarTorreElemental,
  nivelAndarTorreUnica,
  energiaDe,
  saldoEssencia,
  iniciarAndarTorreElemental,
  concluirAndarTorreElemental,
  concluirTreinoDiarioTorre,
  usosRestantesTreinoTorre,
  iniciarAndarTorreUnica,
  concluirAndarTorreUnica,
  trocarPoUnicoPorFragmento,
  resgatarEscolhaFragmentoUnico,
} from './regiao1-torres-regras.js';
import {
  CALABOUCOS_CATALOGO,
  pesosRaridadePorNivel,
  energiaCalabouco,
  iniciarCalaboucoNivel,
  concluirCalaboucoNivel,
  batalhaRapidaCalabouco,
  comprarReliquiaLojaCalabouco,
} from './regiao1-calaboucos-regras.js';
import { criarEstadoInicial, serializarEstado, desserializarEstado } from './regiao1-estado.js';
import { garantirEstadoIdle } from './regiao1-idle.js';
import { validateSave } from '../../../api/_lib/confusion-save-lib.js';

const novoSave = () => {
  const s = criarEstadoInicial();
  garantirEstadoIdle(s, 20_000_000);
  s.idle.equipe = [
    { uid: 'u0', especie: 'Brasinha', nivel: 50, xp: 0, tier: 4, estrelas: 2 },
    { uid: 'u1', especie: 'Mortalio', nivel: 50, xp: 0, tier: 4, estrelas: 2 },
  ];
  return s;
};

test('Torres Elementais: 9 torres × 50 andares cobrindo os 18 elementos (sem Normal), níveis, 1ª vitória única e treino 3×/dia só Essências', async () => {
  const { ELEMENTOS_TORRES_CALABOUCOS, MAPA_DROP_FRAGMENTOS_SONHO } = await import('./regiao1-regras-sonho.js');
  assert.equal(TORRES_ELEMENTAIS_CATALOGO.length, 9);
  assert.equal(CALABOUCOS_CATALOGO.length, 9);
  const cobTorres = new Set(TORRES_ELEMENTAIS_CATALOGO.flatMap((t) => t.elementos));
  const cobCal = new Set(CALABOUCOS_CATALOGO.flatMap((c) => c.elementos));
  for (const el of ELEMENTOS_TORRES_CALABOUCOS) {
    assert.ok(cobTorres.has(el), `Falta elemento ${el} nas Torres Elementais`);
    assert.ok(cobCal.has(el), `Falta elemento ${el} nos Calabouços`);
  }
  assert.equal(cobTorres.has('neutro'), false);
  assert.equal(cobCal.has('neutro'), false);
  assert.equal(Object.keys(MAPA_DROP_FRAGMENTOS_SONHO).length, 19);
  for (const t of TORRES_ELEMENTAIS_CATALOGO) {
    assert.equal(t.andares.length, 100);
    assert.equal(t.andares[9].chefe, true);
    assert.equal(t.andares[99].chefe, true);
  }
  assert.equal(nivelAndarTorreElemental(1), 5);
  assert.equal(nivelAndarTorreElemental(100), Math.round(5 + 99 * 1.95));

  const s = novoSave();
  const t0 = 86_400_000 * 50;
  // Bloqueio em fila
  assert.equal(iniciarAndarTorreElemental(s, 'chama', 2, { agoraMs: t0 }).ok, false);

  const ini1 = iniciarAndarTorreElemental(s, 'chama', 1, { agoraMs: t0, batalhaId: 'te_1' });
  assert.equal(ini1.ok, true);
  const fim1 = concluirAndarTorreElemental(s, 'chama', 1, { venceu: true }, { batalhaId: 'te_1', agoraMs: t0 });
  assert.equal(fim1.ok, true);
  assert.equal(fim1.primeiraVitoria, true);
  assert.equal(fim1.premios.diamantes, 10);
  assert.equal(fim1.premios.ouro, 360);
  assert.equal(saldoEssencia(s, 'fogo', 'menor'), 3);

  // Mesma batalhaId não paga novamente
  assert.equal(concluirAndarTorreElemental(s, 'chama', 1, { venceu: true }, { batalhaId: 'te_1' }).jaPago, true);

  // Repetição paga só ouro base (sem diamantes/essência de 1ª vitória)
  const rep = concluirAndarTorreElemental(s, 'chama', 1, { venceu: true }, { batalhaId: 'te_1_rep' });
  assert.equal(rep.primeiraVitoria, false);
  assert.equal(rep.premios.diamantes, 0);

  // Treino diário: máximo 3×/dia e dá apenas Essências
  const diamAntes = s.recompensas.diamantes;
  const goldAntes = s.recompensas.gold;
  for (let k = 1; k <= 3; k++) {
    const tr = concluirTreinoDiarioTorre(s, 'chama', 1, { agoraMs: t0 + k * 1000, batalhaId: `tr_${k}` });
    assert.equal(tr.ok, true);
    assert.equal(tr.premios.essencia.qtd, 3);
  }
  assert.equal(usosRestantesTreinoTorre(s, t0 + 5000), 0);
  assert.equal(concluirTreinoDiarioTorre(s, 'chama', 1, { agoraMs: t0 + 6000 }).limiteAtingido, true);
  assert.equal(s.recompensas.diamantes, diamAntes);
  assert.equal(s.recompensas.gold, goldAntes);
  assert.equal(saldoEssencia(s, 'fogo', 'menor'), 12); // 3 da 1ª + 3*3 treino
});

test('Torres Únicas: 3×100 andares (60..200), 1×/dia/andar, Pó Único para espécie não possuída e troca 5:1', () => {
  assert.equal(TORRES_UNICAS_CATALOGO.length, 3);
  assert.equal(nivelAndarTorreUnica(1), 60);
  assert.equal(nivelAndarTorreUnica(100), 200);

  const s = novoSave();
  const t0 = 86_400_000 * 100;
  const pool = TORRES_UNICAS_CATALOGO[0].poolLinhagens;
  const idxNaoPossuida = pool.findIndex((slug) => slug !== 'ignavor' && slug !== 'mortalio');
  assert.ok(idxNaoPossuida >= 0);
  const rngNaoPossuida = () => (idxNaoPossuida + 0.1) / pool.length;

  // Sorteia espécie não possuída -> vira Pó Único
  const ini = iniciarAndarTorreUnica(s, 'ascensao', 1, { agoraMs: t0, batalhaId: 'tu_1' });
  assert.equal(ini.ok, true);
  const res1 = concluirAndarTorreUnica(s, 'ascensao', 1, { venceu: true }, { agoraMs: t0, batalhaId: 'tu_1', rng: rngNaoPossuida });
  assert.equal(res1.ok, true);
  assert.equal(res1.premios.virouPoUnico, true);
  assert.equal(s.idle.armasUnicas.poUnico, 1);

  // Não permite repetir o mesmo andar no mesmo dia
  assert.equal(iniciarAndarTorreUnica(s, 'ascensao', 1, { agoraMs: t0 + 3600_000 }).limiteDiario, true);

  // Dia seguinte permite repetir o andar 1 (e sorteando 'ignavor' que o jogador possui em Brasinha)
  const idxIgnavor = pool.indexOf('ignavor');
  const rngIgnavor = () => (idxIgnavor + 0.1) / pool.length;
  assert.equal(iniciarAndarTorreUnica(s, 'ascensao', 1, { agoraMs: t0 + 86_400_000, batalhaId: 'tu_2' }).ok, true);
  const res2 = concluirAndarTorreUnica(s, 'ascensao', 1, { venceu: true }, { agoraMs: t0 + 86_400_000, batalhaId: 'tu_2', rng: rngIgnavor });
  assert.equal(res2.premios.virouPoUnico, false);
  assert.equal(s.idle.armasUnicas.fragmentos.ignavor, 1);

  // Troca 5 Pós Únicos por 1 fragmento à escolha + escolha pendente
  s.idle.armasUnicas.poUnico += 5;
  const troc = trocarPoUnicoPorFragmento(s, 'Mortalio', 1);
  assert.equal(troc.ok, true);
  assert.equal(troc.linhagem, 'mortalio');
  assert.equal(s.idle.armasUnicas.fragmentos.mortalio, 1);

  s.idle.armasUnicas.escolhasPendentes = 1;
  assert.equal(resgatarEscolhaFragmentoUnico(s, 'Vaelith').linhagem, 'vaelith');
  assert.equal(s.idle.armasUnicas.fragmentos.vaelith, 1);
});

test('Calabouços: 9×13 níveis cobrindo os 18 elementos, sem custo de energia, pesos de raridade, batalha rápida com todos vivos, loja e save', () => {
  assert.equal(CALABOUCOS_CATALOGO.length, 9);
  assert.equal(energiaCalabouco(1), 0);
  assert.equal(energiaCalabouco(6), 0);
  assert.equal(energiaCalabouco(11), 0);
  assert.deepEqual(pesosRaridadePorNivel(1), { comum: 60, incomum: 35, rara: 5, epica: 0, lendaria: 0 });
  assert.deepEqual(pesosRaridadePorNivel(5), { comum: 20, incomum: 45, rara: 30, epica: 5, lendaria: 0 });
  assert.deepEqual(pesosRaridadePorNivel(9), { comum: 0, incomum: 25, rara: 45, epica: 25, lendaria: 5 });
  assert.deepEqual(pesosRaridadePorNivel(13), { comum: 0, incomum: 0, rara: 40, epica: 45, lendaria: 15 });

  const s = novoSave();
  const t0 = 50_000_000;
  assert.equal(iniciarCalaboucoNivel(s, 'forja-rubra', 1, { agoraMs: t0, batalhaId: 'c1' }).energiaRestante, 120);
  // Vitória com baixa -> não libera batalha rápida
  const vBaixa = concluirCalaboucoNivel(s, 'forja-rubra', 1, { venceu: true, todosVivos: false }, { batalhaId: 'c1', rng: () => 0.1 });
  assert.equal(vBaixa.ok, true);
  assert.equal(vBaixa.batalhaRapidaLiberada, false);
  assert.equal(vBaixa.premios.reliquias.length, 2); // 0.1 < 0.30 -> 2ª relíquia!
  assert.equal(batalhaRapidaCalabouco(s, 'forja-rubra', 1, { agoraMs: t0 }).ok, false);

  // Vitória com todos vivos libera batalha rápida
  const vFull = concluirCalaboucoNivel(s, 'forja-rubra', 1, { venceu: true, todosVivos: true }, { batalhaId: 'c2', rng: () => 0.8 });
  assert.equal(vFull.batalhaRapidaLiberada, true);
  assert.equal(vFull.premios.reliquias.length, 1);

  const rap = batalhaRapidaCalabouco(s, 'forja-rubra', 1, { agoraMs: t0 + 1000, rng: () => 0.5 });
  assert.equal(rap.ok, true);

  // Loja do calabouço escolhendo conjunto
  s.idle.calaboucos.moedas = 40;
  const loja = comprarReliquiaLojaCalabouco(s, 'forja-rubra', 'destruicao', { rng: () => 0.1 });
  assert.equal(loja.ok, true);
  assert.equal(loja.reliquia.conjunto, 'destruicao');
  assert.equal(s.idle.calaboucos.moedas, 0);

  // Persistência em save e nuvem (inclui torres + calabouços)
  concluirAndarTorreElemental(s, 'chama', 1, { venceu: true }, { batalhaId: 'te_save', agoraMs: t0 + 1000 });
  const rec = desserializarEstado(serializarEstado(s));
  assert.equal(rec.idle.torres.elementais.chama.maiorAndar, 1);
  assert.equal(rec.idle.calaboucos.maiorNivel['forja-rubra'], 1);
  assert.equal(energiaDe(rec, t0 + 1000).atual >= 0, true);
  const val = validateSave({ game: 'confusion-waves', regiao1: JSON.parse(serializarEstado(rec)), conta: rec.conta });
  assert.equal(val.ok, true);
});
