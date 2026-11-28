import test from 'node:test';
import assert from 'node:assert/strict';
import { criarEstadoInicial, registrarPista, validarContatoInteracao, serializarEstado, desserializarEstado } from './regiao1-estado.js';
import { garantirEstadoIdle, resolverAbateAuto, XP_IDLE_CFG } from './regiao1-idle.js';
import { criarUnidade } from './regiao1-estrategia-regras.js';
import { concluirFaseCampanhaMini } from './regiao1-campanha-mini-regras.js';
import {
  concluirAndarTorreElemental,
  concluirAndarTorreUnica,
  TORRES_UNICAS_POR_ID,
  TAXAS_ESSENCIA_TORRES,
  estadoTorreSazonal,
  concluirAndarTorreSazonal,
  TORRES_SAZONAIS_CFG,
} from './regiao1-torres-regras.js';
import {
  TETO_NIVEL_RELIQUIA_POR_RARIDADE,
  nivelMaximoReliquia,
  concederReliquia,
  reforcarReliquia,
  reliquiasDe,
} from './regiao1-reliquias-regras.js';
import {
  ONDE_CONSEGUIR_FRAGMENTOS,
  ONDE_CONSEGUIR_ESSENCIAS,
} from './regiao1-regras-sonho.js';
import {
  avancarEtapaParalela,
  registrarAcaoParalela,
  aceitarMissaoCampanhaNpc,
  registrarProgressoMissaoCampanhaNpc,
  entregarMissaoCampanhaNpc,
} from './regiao1-missoes-regras.js';
import { decidirEntradaConta, prepararContaNova, MENSAGEM_BONUS_BOAS_VINDAS } from './regiao1-conta.js';
import { validateSave } from '../../../api/_lib/confusion-save-lib.js';

const novoSave = () => {
  const s = criarEstadoInicial();
  garantirEstadoIdle(s, 50_000_000);
  s.idle.equipe = [
    { uid: 'a0', especie: 'Brasinha', nivel: 10, xp: 720, tier: 4, estrelas: 1 },
    { uid: 'a1', especie: 'Cervomusgo', nivel: 10, xp: 720, tier: 3, estrelas: 1 },
  ];
  s.idle.formacao = ['a0', 'a1', null, null];
  return s;
};

test('Feedback: XP da Torre e Oníricos mortos ganham XP igual aos vivos', () => {
  const s = novoSave();
  const xp0 = s.idle.equipe[0].xp;
  const xp1 = s.idle.equipe[1].xp;
  // Vitória na Torre da Aurora com um Onírico morto na batalha (hp: 0)
  const rTorre = concluirAndarTorreElemental(s, 'aurora', 1, {
    venceu: true,
    aliados: [{ id: 'a0', hp: 50 }, { id: 'a1', hp: 0 }],
  }, { batalhaId: 't_xp_1' });
  assert.equal(rTorre.ok, true);
  assert.ok(rTorre.premios.xpFormacao > 0);
  assert.equal(s.idle.equipe[0].xp - xp0, rTorre.premios.xpFormacao);
  assert.equal(s.idle.equipe[1].xp - xp1, rTorre.premios.xpFormacao);

  // Derrota na Campanha Mini também dá XP (30%) igualmente a todos os membros
  const xpAntesDer = s.idle.equipe[0].xp;
  const rDer = concluirFaseCampanhaMini(s, '1-1', { fim: 'derrota', aliados: [{ hp: 0 }, { hp: 0 }] }, { batalhaId: 'cm_der_1' });
  assert.equal(rDer.venceu, false);
  assert.ok(rDer.premios.xpFormacao > 0);
  assert.equal(s.idle.equipe[0].xp - xpAntesDer, rDer.premios.xpFormacao);
  assert.equal(s.idle.equipe[1].xp - xpAntesDer, rDer.premios.xpFormacao);
});

test('Feedback: XP do Idle bem menor que Campanha Mini e Vaelirion T5 claramente acima de Ventassol T4', () => {
  const s = novoSave();
  const ab = resolverAbateAuto(s, { especie: 'Fanalino', nivel: 10, derrotaId: 'id_cmp_1' }, () => 0.9);
  assert.ok(ab.xpOniricos <= 12, `XP idle Nv.10 deveria ser <= 12, veio ${ab.xpOniricos}`);
  assert.ok(XP_IDLE_CFG.ativoOniricoPorNivel < 1);

  const vael = criarUnidade({ id: 'v', especie: 'Vaelirion', nivel: 24, tier: 5, estrelas: 1, lado: 'a' });
  const vent = criarUnidade({ id: 'w', especie: 'Ventassol', nivel: 24, tier: 4, estrelas: 1, lado: 'a' });
  assert.ok(vael.atk > vent.atk * 1.2, `Vaelirion T5 (${vael.atk}) deve superar claramente Ventassol T4 (${vent.atk})`);
});

test('Feedback: Relíquias teto 10/20/30/50/80/100, Gold obrigatório e persistência +100 no save', () => {
  assert.deepEqual(TETO_NIVEL_RELIQUIA_POR_RARIDADE, { comum: 10, incomum: 20, rara: 30, epica: 50, lendaria: 80, mitica: 100 });
  assert.equal(nivelMaximoReliquia('mitica'), 100);
  const s = novoSave();
  reliquiasDe(s).poReforco = 50_000;
  s.recompensas.gold = 0;
  const rel = concederReliquia(s, { parte: 'coroa', elemento: 'fogo', raridade: 'mitica' }).reliquia;
  // Sem Gold não sobe nível
  assert.equal(reforcarReliquia(s, rel.id).ok, false);
  s.recompensas.gold = 5_000_000;
  for (let k = 0; k < 100; k++) assert.equal(reforcarReliquia(s, rel.id).ok, true);
  assert.equal(rel.reforco, 100);
  assert.equal(reforcarReliquia(s, rel.id).jaMaximo, true);

  const rec = desserializarEstado(serializarEstado(s));
  assert.equal(rec.idle.reliquias.bolsa[0].reforco, 100);
});

test('Feedback: Torre da Aurora (taxas) + Fragmento Diurno + Torres Únicas distintas + Sazonais Quinzenal/Mensal', () => {
  const aurora = TAXAS_ESSENCIA_TORRES.find((x) => x.id === 'aurora');
  assert.ok(aurora && aurora.parEssencia === 'solar' && aurora.andares1a15.qtd === 3);
  assert.equal(ONDE_CONSEGUIR_FRAGMENTOS.luz.nome, 'Fragmento Diurno');
  assert.equal(ONDE_CONSEGUIR_FRAGMENTOS.luz.torreNome, 'Torre da Aurora');
  assert.equal(ONDE_CONSEGUIR_ESSENCIAS.solar.torreNome, 'Torre da Aurora');

  // Recompensas distintas nas 3 Torres Únicas
  const nomes = ['ascensao', 'abismo', 'eclipse'].map((id) => TORRES_UNICAS_POR_ID[id].recompensaPropria.id);
  assert.equal(new Set(nomes).size, 3);

  const s = novoSave();
  const t0 = 60_000_000_000;
  const u1 = concluirAndarTorreUnica(s, 'ascensao', 1, { venceu: true }, { agoraMs: t0, batalhaId: 'tu_1' });
  const u2 = concluirAndarTorreUnica(s, 'abismo', 1, { venceu: true }, { agoraMs: t0, batalhaId: 'tu_2' });
  const u3 = concluirAndarTorreUnica(s, 'eclipse', 1, { venceu: true }, { agoraMs: t0, batalhaId: 'tu_3' });
  assert.equal(u1.premios.recompensaTorre.id, 'brasa_ascensao');
  assert.equal(u2.premios.recompensaTorre.id, 'nucleo_abismo');
  assert.equal(u3.premios.recompensaTorre.id, 'prisma_eclipse');
  assert.ok(u1.premios.essencia && u2.premios.poReforco > 0 && u3.premios.diamantes > 0);

  // Torres Sazonais: Quinzenal (15d) e Mensal (30d) com reset automático e save na nuvem
  assert.equal(TORRES_SAZONAIS_CFG.quinzenal.cicloDias, 15);
  assert.equal(TORRES_SAZONAIS_CFG.mensal.cicloDias, 30);
  const rQ = concluirAndarTorreSazonal(s, 'quinzenal', 1, { venceu: true }, { agoraMs: t0, batalhaId: 'ts_q1' });
  const rM = concluirAndarTorreSazonal(s, 'mensal', 1, { venceu: true }, { agoraMs: t0, batalhaId: 'ts_m1' });
  assert.equal(rQ.ok && rM.ok, true);
  assert.equal(estadoTorreSazonal(s, 'quinzenal', t0).maiorAndar, 1);
  // 15 dias depois reinicia o ciclo da quinzenal
  assert.equal(estadoTorreSazonal(s, 'quinzenal', t0 + 15 * 86_400_000).maiorAndar, 0);

  const rec = desserializarEstado(serializarEstado(s));
  assert.equal(rec.idle.torres.sazonais.mensal.maiorAndar, 1);
  assert.equal(validateSave({ game: 'confusion-waves', regiao1: JSON.parse(serializarEstado(rec)), conta: rec.conta }).ok, true);
});

test('Feedback: Missões Paralelas exigem ação real, Campanha exige ciclo NPC e pista exige encostar', () => {
  const s = novoSave();
  s.idle.campanhaMini.fases['1-1'] = { vencida: true, estrelas: 3, concluidas: 1 };

  // Paralela par_1_4 exige fortalecer relíquia 5x -> bloqueia sem ação real
  const bloq = avancarEtapaParalela(s, 'par_1_4');
  assert.equal(bloq.ok, false);
  assert.equal(bloq.acaoPendente, true);
  registrarAcaoParalela(s, 'fortalecer_reliquia', 5);
  const okAcao = avancarEtapaParalela(s, 'par_1_4');
  assert.equal(okAcao.ok, true);

  // Missão da Campanha com NPC: encostar -> cumprir no local -> encostar para entregar
  assert.equal(aceitarMissaoCampanhaNpc(s, 'camp_npc_r1_praia', { encostouNpc: false }).semContato, true);
  assert.equal(aceitarMissaoCampanhaNpc(s, 'camp_npc_r1_praia', { encostouNpc: true }).ok, true);
  assert.equal(registrarProgressoMissaoCampanhaNpc(s, 'camp_npc_r1_praia', { localAtual: 'C1', abates: 5 }).localIncorreto, true);
  const prog = registrarProgressoMissaoCampanhaNpc(s, 'camp_npc_r1_praia', { localAtual: 'E1', abates: 5 });
  assert.equal(prog.prontaParaEntregar, true);
  assert.equal(entregarMissaoCampanhaNpc(s, 'camp_npc_r1_praia', { encostouNpc: false }).semContato, true);
  const ent = entregarMissaoCampanhaNpc(s, 'camp_npc_r1_praia', { encostouNpc: true });
  assert.equal(ent.ok, true);
  assert.equal(ent.premio.diamantes, 30);

  // Regra de contato real em registrarPista: entrar no mapa NÃO conta
  assert.equal(validarContatoInteracao({ distanciaPx: 120, raioPx: 56 }), false);
  assert.equal(validarContatoInteracao({ distanciaPx: 30, raioPx: 56 }), true);
  const pBloq = registrarPista(s, 'clue_c1_teste', { origem: 'entrada_mapa' });
  assert.equal(pBloq.bloqueadaSemContato, true);
  assert.equal(Boolean(s.pistas.clue_c1_teste), false);
  const pOk = registrarPista(s, 'clue_c1_teste', { encostou: true });
  assert.equal(pOk.nova, true);

  // Bônus de boas-vindas (item 12): conta nova e convidado->conta recebem 1x; conta existente não recebe
  assert.match(MENSAGEM_BONUS_BOAS_VINDAS, /20\.000/);
  assert.equal(decidirEntradaConta({ remoto: null, local: null, userId: 'u_novo' }).novo, true);
  assert.equal(decidirEntradaConta({ remoto: { regiao1: { idle: {} } }, local: null, userId: 'u_antigo' }).novo, false);
  const sConv = criarEstadoInicial();
  garantirEstadoIdle(sConv);
  prepararContaNova(sConv, { userId: 'u_conv', inicial: 'Brasinha', novo: true });
  assert.equal(sConv.recompensas.diamantes, 20000);
  assert.equal(decidirEntradaConta({ remoto: null, local: sConv, userId: 'u_conv' }).novo, false);
});
