import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { REGIOES, CLASSE_DA_ESPECIE } from './regiao1-progressao.js';
import { LINHAGENS_REINOS } from './regiao1-kits-reinos.js';
import { FORMAS_LINHAGENS_REINOS } from '../formas-reinos.js';
import {
  ESPECIES,
  ELEMENTO_DA_ESPECIE,
  LINHAS,
  LINHAS_REINOS,
  linhaDaEspecie,
  validarCatalogo,
  repetidosNoCatalogo,
} from '../species.js';
import {
  CATALOGO_REGIOES,
  REGIOES_POR_ID,
  regiaoDesbloqueada,
  progressoDesbloqueioRegiao,
  listarRegioes,
  sortearEncontroRegiao,
  registrarVitoriaChefeRegiao,
  chefeDosAltosDerrotado,
  registrarVitoriaChefeDosAltos,
  concluirMissaoRegiao2,
  registrarAbateRegiao2,
  progressoMissoesRegiao2,
} from './regiao1-regioes-regras.js';
import { MAPAS, ORDEM_MAPAS } from './regiao1-mapas.js';
import { NPCS_REGIAO1, MONSTROS_SELVAGENS_R2, ENTIDADES_BOSS } from './regiao1-entidades.js';
import {
  criarEstadoInicial,
  serializarEstado,
  desserializarEstado,
  registrarVitoriaBoss,
} from './regiao1-estado.js';
import { elementosDoMundo, investigacaoNpcInfo } from './regiao1-mundo-integracao.js';
import { carregarMundo } from '../mundo/index.js';
import { validateSave, GAME_ID } from '../../../api/_lib/confusion-save-lib.js';

const RAIZ = fileURLToPath(new URL('../../../', import.meta.url));
const INICIAIS = new Set(LINHAS.flatMap((l) => [l.inicial, l.atual, l.evolucao]));

test('catálogo das 12 regiões: faixas de nível, encontros sem iniciais e validação de espécies', () => {
  assert.equal(CATALOGO_REGIOES.length, 12);
  CATALOGO_REGIOES.forEach((reg, idx) => {
    assert.equal(reg.id, `r${idx + 1}`);
    assert.deepEqual(reg.faixaNivel, REGIOES[idx]);
    assert.ok(reg.chefe?.nome && reg.chefe?.nivel >= reg.faixaNivel[0]);
    assert.ok(reg.encontros.length >= 5, `Região ${reg.id} sem encontros suficientes`);
    for (const e of reg.encontros) {
      assert.ok(ESPECIES[e.especie], `Espécie ausente do catálogo: ${e.especie}`);
      assert.equal(INICIAIS.has(e.especie), false, `Inicial proibido em encontro selvagem: ${e.especie}`);
      assert.ok(e.nivelMin >= reg.faixaNivel[0] && e.nivelMax <= reg.faixaNivel[1]);
    }
    const sorteado = sortearEncontroRegiao(reg.id, () => 0.42);
    assert.ok(sorteado && sorteado.nivel >= reg.faixaNivel[0] && sorteado.nivel <= reg.faixaNivel[1]);
    assert.equal(INICIAIS.has(sorteado.especie), false);
  });
});

test('desbloqueio em cadeia (r1 -> r2 -> ... -> r12) e recompensa de 1ª vitória paga estritamente 1 vez', () => {
  const save = criarEstadoInicial();
  assert.equal(regiaoDesbloqueada(save, 'r1'), true);
  assert.equal(regiaoDesbloqueada(save, 'r2'), false);
  assert.equal(progressoDesbloqueioRegiao(save, 'r2').feitos, 0);

  registrarVitoriaBoss(save, 'BOSS_E');
  assert.equal(regiaoDesbloqueada(save, 'r2'), false);
  assert.equal(progressoDesbloqueioRegiao(save, 'r2').feitos, 1);

  registrarVitoriaBoss(save, 'BOSS_D');
  assert.equal(regiaoDesbloqueada(save, 'r2'), true);
  assert.equal(regiaoDesbloqueada(save, 'r3'), false);

  const ouroAntes = save.recompensas.gold;
  const diamAntes = save.recompensas.diamantes;
  const r2Primeira = registrarVitoriaChefeRegiao(save, 'r2');
  assert.equal(r2Primeira.ok, true);
  assert.equal(r2Primeira.primeiraVez, true);
  assert.equal(r2Primeira.proximaDesbloqueada, 'r3');
  // 1ª vitória da R2 (900g/150💎) + conclusão única da missão m_r2_rainha (600g/100💎)
  const ouroEsperado = ouroAntes + REGIOES_POR_ID.r2.recompensaPrimeiraVitoria.gold + 600;
  const diamEsperado = diamAntes + REGIOES_POR_ID.r2.recompensaPrimeiraVitoria.diamantes + 100;
  assert.equal(save.recompensas.gold, ouroEsperado);
  assert.equal(save.recompensas.diamantes, diamEsperado);
  assert.equal(regiaoDesbloqueada(save, 'r3'), true);

  // Segunda vitória contra o mesmo chefe não paga de novo (nem 1ª vitória nem missão)
  const r2Segunda = registrarVitoriaChefeRegiao(save, 'r2');
  assert.equal(r2Segunda.primeiraVez, false);
  assert.equal(r2Segunda.recompensaPaga, null);
  assert.equal(save.recompensas.gold, ouroEsperado);
  assert.equal(save.recompensas.diamantes, diamEsperado);

  const lista = listarRegioes(save);
  assert.equal(lista.length, 12);
  assert.equal(lista[0].desbloqueada, true);
  assert.equal(lista[1].desbloqueada, true);
  assert.equal(lista[2].desbloqueada, true);
  assert.equal(lista[3].desbloqueada, false);
});

test('50 linhagens dos Reinos 03–12: formas base (01), intermediária (02) e final (03) em ELEMENTO_DA_ESPECIE e CLASSE_DA_ESPECIE', () => {
  assert.equal(LINHAGENS_REINOS.length, 50);
  assert.equal(LINHAS.length, 5);
  assert.equal(LINHAS_REINOS.length, 50);
  const nomes = new Set();
  for (const lin of LINHAGENS_REINOS) {
    const f = FORMAS_LINHAGENS_REINOS[lin.nome];
    assert.ok(f?.base && f?.final, `Linhagem sem base/final: ${lin.nome}`);
    for (const nome of [f.base, lin.nome, f.final]) {
      assert.equal(nomes.has(nome), false, `Nome duplicado entre as 50 linhagens: ${nome}`);
      nomes.add(nome);
      assert.ok(ESPECIES[nome], `Espécie ausente em ESPECIES: ${nome}`);
      const elEsperado = ['Geadante', 'Uiválgido', 'Glacivra', 'Nevascaio', 'Focanil'].includes(lin.nome) ? 'gelo' : lin.elemento;
      assert.equal(ELEMENTO_DA_ESPECIE[nome], elEsperado, `Elemento divergente em ${nome}`);
      assert.equal(CLASSE_DA_ESPECIE[nome], lin.classe, `Classe divergente em ${nome}`);
      assert.ok(linhaDaEspecie(nome), `linhaDaEspecie nula para ${nome}`);
    }
  }
  assert.deepEqual(validarCatalogo(), []);
  assert.deepEqual(repetidosNoCatalogo(), []);
});

test('catálogo: nenhum nome de forma (01/02/03) se repete entre linhagens (iniciais + Reinos 03–12)', () => {
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const vistos = new Map();
  const todas = [
    ...LINHAS.map((l) => ({ id: l.id, formas: [l.inicial, l.atual, l.evolucao] })),
    ...LINHAS_REINOS.map((l) => ({ id: l.id, formas: [l.inicial, l.atual, l.evolucao] })),
  ];
  for (const lin of todas) {
    for (const nome of lin.formas) {
      const chave = norm(nome);
      assert.equal(vistos.has(chave), false, `Nome de forma repetido entre linhagens: "${nome}" (${vistos.get(chave)} e ${lin.id})`);
      vistos.set(chave, lin.id);
    }
  }
  assert.equal(FORMAS_LINHAGENS_REINOS['Escaravéu'].base, 'Escarabito');
  assert.equal(FORMAS_LINHAGENS_REINOS.Escorvaz.base, 'Escorita');
  assert.equal(ELEMENTO_DA_ESPECIE.Escarabito, 'inseto');
  assert.equal(CLASSE_DA_ESPECIE.Escarabito, 'guerreiro');
});

test('Região 2 jogável: portal, mapas, encontros 20–45, chefe Rainha da Colmeia Dourada e missões curtas 1x', () => {
  const portal = MAPAS.REINO.saidas.find((s) => s.tipo === 'portal_r2');
  assert.ok(portal && portal.destino === 'R2_C0');
  const mapasR2 = ORDEM_MAPAS.filter((id) => MAPAS[id].regiao === 'r2');
  assert.equal(mapasR2.length, 50);
  assert.equal(new Set(mapasR2).size, mapasR2.length);
  const visitados = new Set(['R2_C0']);
  for (const id of visitados) {
    for (const { destino } of MAPAS[id].saidas) {
      assert.ok(MAPAS[destino]?.saidas.some((saida) => saida.destino === id), `Saída sem volta: ${id} → ${destino}`);
      if (MAPAS[destino].regiao === 'r2') visitados.add(destino);
    }
  }
  assert.deepEqual(visitados, new Set(mapasR2));
  for (const id of mapasR2) {
    const m = MAPAS[id];
    assert.ok(!m.pisoLivre && !m.arteProvisoria);
    assert.equal(new Set(m.saidas.map((s) => s.id)).size, m.saidas.length);
    for (const arquivo of [m.arte, m.mascara, m.arenaBatalha].filter(Boolean)) {
      const rel = arquivo.replace(/^(\.\.\/)+/, '');
      assert.ok(fs.existsSync(RAIZ + rel), `Arquivo da Região 2 ausente: ${rel}`);
    }
  }
  assert.ok(NPCS_REGIAO1.some((n) => n.id === 'npc_r2_melissa' && n.mapa === 'R2_C0'));
  assert.ok(MONSTROS_SELVAGENS_R2.some((m) => m.mapa === 'R2_API' && m.forma === 2));
  assert.deepEqual(new Set(MONSTROS_SELVAGENS_R2.map((m) => m.forma)), new Set([1, 2]));
  assert.equal(new Set(MONSTROS_SELVAGENS_R2.map((m) => m.mapa)).size, 39);
  for (const m of MONSTROS_SELVAGENS_R2) {
    assert.ok(m.nivel >= 20 && m.nivel <= 45, `Nível fora da faixa 20–45 em ${m.id}: ${m.nivel}`);
    assert.equal(INICIAIS.has(m.especie), false);
    assert.ok(m.arteForma && fs.existsSync(RAIZ + m.arteForma), `Arte R2 ausente: ${m.arteForma}`);
  }
  const bossR2 = ENTIDADES_BOSS.find((b) => b.id === 'BOSS_R2');
  assert.ok(bossR2 && bossR2.mapa === 'R2_CHEFE' && bossR2.nivel === 45);
  assert.ok(fs.existsSync(RAIZ + bossR2.sprite.replace(/^(\.\.\/)+/, '')));

  const chefes = ENTIDADES_BOSS.filter((b) => b.regiaoId === 'r2');
  assert.equal(chefes.length, 4);
  const saveChefes = criarEstadoInicial();
  for (const chefe of chefes.filter((b) => b.id !== 'BOSS_R2')) {
    assert.ok(fs.existsSync(RAIZ + chefe.sprite.replace(/^(\.\.\/)+/, '')));
    assert.equal(registrarVitoriaChefeDosAltos(saveChefes, chefe.id).primeiraVez, true);
    assert.equal(registrarVitoriaChefeDosAltos(saveChefes, chefe.id).primeiraVez, false);
    assert.equal(chefeDosAltosDerrotado(desserializarEstado(serializarEstado(saveChefes)), chefe.id), true);
    assert.equal(regiaoDesbloqueada(saveChefes, 'r3'), false);
  }
  assert.equal(chefeDosAltosDerrotado(saveChefes, 'BOSS_R2'), false);
  assert.equal(registrarVitoriaChefeDosAltos(saveChefes, 'BOSS_R2').proximaDesbloqueada, 'r3');
  assert.equal(chefeDosAltosDerrotado(saveChefes, 'BOSS_R2'), true);

  // Missões curtas da Região 2 pagas 1x
  const save = criarEstadoInicial();
  const m1 = concluirMissaoRegiao2(save, 'm_r2_chegada');
  assert.equal(m1.concluidaAgora, true);
  const goldApos1 = save.recompensas.gold;
  const m1Rep = concluirMissaoRegiao2(save, 'm_r2_chegada');
  assert.equal(m1Rep.concluidaAgora, false);
  assert.equal(save.recompensas.gold, goldApos1);

  registrarAbateRegiao2(save);
  registrarAbateRegiao2(save);
  const ab3 = registrarAbateRegiao2(save);
  assert.equal(ab3.concluidaAgora, true);
  const progresso = progressoMissoesRegiao2(save);
  assert.equal(progresso.find((x) => x.id === 'm_r2_chegada').concluida, true);
  assert.equal(progresso.find((x) => x.id === 'm_r2_apiarios').concluida, true);
});

test('Sistemas 01–10 ligados à Região 1 e à Região 2', () => {
  const mundo = carregarMundo(null);
  const els = elementosDoMundo(mundo, { dia: 1 });
  assert.ok(els.some((e) => e.sis === '01' && e.mapa === 'R2_C0'));
  assert.ok(els.some((e) => e.sis === '05' && e.mapa === 'R2_C0'));
  assert.ok(els.some((e) => e.sis === '08' && e.mapa === 'R2_CRI'));
  assert.ok(els.some((e) => e.sis === '10' && e.mapa === 'R2_C0'));
  assert.ok(investigacaoNpcInfo(mundo, 'npc_r2_melissa'));
});

test('save antigo carrega sem perder nada e novo save passa na validação da nuvem (confusion-save-lib)', () => {
  const antigoBruto = {
    versao: 1,
    mapaAtual: 'C1',
    posicaoPx: [420, 310],
    forma: 'azazel',
    teleportes: { C1: { descoberto: true, ativo: true }, E8: { descoberto: true, ativo: false } },
    quests: { q_pegadas: 'concluida', q_mare_devolveu: 'ativa' },
    pistas: { clue_c0_pier: true },
    bossesDerrotados: { BOSS_E: true, BOSS_D: true, BOSS_S: false, BOSS_C: false },
    tremLiberado: true,
    viagemTremConcluida: true,
    desbloqueios: { fazenda: true, corrida: false },
    recompensas: { gold: 1234, diamantes: 567, xp: 890 },
    idle: { jogador: { xp: 890, hp: 120 }, equipe: [{ especie: 'Ignavor', nivel: 12, estrelas: 3 }] },
    conta: { uid: 'u_legado', inicial: 'Ignavor', bonusEm: 1700000000000 },
  };
  const carregado = desserializarEstado(JSON.stringify(antigoBruto));
  assert.equal(carregado.mapaAtual, 'C1');
  assert.equal(carregado.recompensas.gold, 1234);
  assert.equal(carregado.recompensas.diamantes, 567);
  assert.equal(carregado.conta.inicial, 'Ignavor');
  assert.equal(carregado.idle.equipe[0].especie, 'Ignavor');
  assert.equal(carregado.regioes.chefesDerrotados.r1, true);
  assert.equal(regiaoDesbloqueada(carregado, 'r2'), true);

  // Avança na Região 2 e faz round-trip + validação de save na nuvem
  carregado.regioes.atual = 'r2';
  registrarVitoriaChefeRegiao(carregado, 'r2');
  concluirMissaoRegiao2(carregado, 'm_r2_chegada');
  const recarregado = desserializarEstado(serializarEstado(carregado));
  assert.equal(recarregado.regioes.atual, 'r2');
  assert.equal(recarregado.regioes.chefesDerrotados.r2, true);
  assert.equal(recarregado.regioes.primeiraVitoria.r2, true);
  assert.equal(recarregado.regioes.missoes.m_r2_chegada, 'concluida');

  const cloudCheck = validateSave({ game: GAME_ID, version: 1, savedAt: Date.now(), state: recarregado });
  assert.equal(cloudCheck.ok, true, `Cloud save falhou: ${cloudCheck.error}`);
  assert.equal(cloudCheck.save.state.regioes.chefesDerrotados.r2, true);
});
