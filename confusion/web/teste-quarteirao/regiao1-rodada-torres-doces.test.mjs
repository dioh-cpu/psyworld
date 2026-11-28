import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TORRES_CFG,
  TORRES_ELEMENTAIS_CATALOGO,
  TORRES_UNICAS_CATALOGO,
  TORRES_SAZONAIS_CATALOGO,
  TORRES_POR_ELEMENTO,
  torreDoElemento,
  comprarTicketTorre,
  saldoTicketTorre,
  iniciarAndarTorreElemental,
  concluirAndarTorreElemental,
  concluirAndarTorreUnica,
  concluirAndarTorreSazonal,
  xpAndarTorre,
  docesGraduaisAndar,
} from './regiao1-torres-regras.js';
import { CALABOUCOS_POR_ELEMENTO, calaboucoDoElemento } from './regiao1-calaboucos-regras.js';
import {
  chanceDropDoce,
  talvezDoce,
  comprarLoja,
  vencerAndar,
  hwDe,
} from './regiao1-halloween-regras.js';
import { LOJA_TORRE, TORRE } from './regiao1-halloween-dados.js';
import { CATALOGO_BANNERS, comprarPacoteBanner, invocacoesGratisDe } from './regiao1-exp-regras.js';
import { garantirBonusBoasVindasTodos, prepararContaNova } from './regiao1-conta.js';
import { xpPara, xpTotal, nivelDe } from './regiao1-progressao.js';
import {
  ELEMENTOS_TORRES_CALABOUCOS,
  saldoFragmentoSonho,
  consultarEvolucaoForma,
} from './regiao1-regras-sonho.js';
import { ELEMENTO_DA_ESPECIE } from '../species.js';
import { criarEstadoInicial } from './regiao1-estado.js';

function saveTeste() {
  const s = criarEstadoInicial();
  s.recompensas = { gold: 0, diamantes: 5000, xp: 0 };
  s.idle = s.idle || {};
  s.idle.equipe = [
    { uid: 'ini0', especie: 'Noctarn', nivel: 5, xp: xpTotal(5), tier: 4, estrelas: 1, inicial: true },
  ];
  s.idle.formacao = ['ini0', null, null, null];
  return s;
}

test('A. Torres: todas com 100 andares, 10 diamantes fixo, doces 1..20, tickets 10/dia, marcos 3 tickets/10 andares e XP <= 10%', () => {
  for (const t of TORRES_ELEMENTAIS_CATALOGO) assert.equal(t.totalAndares, 100);
  for (const t of TORRES_UNICAS_CATALOGO) assert.equal(t.totalAndares, 100);
  for (const t of TORRES_SAZONAIS_CATALOGO) assert.equal(t.totalAndares, 100);
  assert.equal(TORRE.totalAndares, 100);
  assert.equal(TORRE.diamantesPorAndar, 10);
  assert.equal(TORRE.ticketsPorMarco, 3);
  assert.equal(TORRES_CFG.diamantesPorAndar, 10);
  assert.equal(TORRES_CFG.marcoTicketsEvento, 3);
  assert.equal(docesGraduaisAndar(1, 100), 1);
  assert.equal(docesGraduaisAndar(100, 100), 20);
  assert.ok(docesGraduaisAndar(50, 100) > 1 && docesGraduaisAndar(50, 100) < 20);

  // XP da torre <= 10% da Campanha Mini (referência mínima ~120 + nivel*18)
  for (const a of [1, 10, 50, 100]) {
    const xpCampRef = 120 + a * 18;
    assert.ok(xpAndarTorre(a) <= xpCampRef * 0.10, `XP torre andar ${a} deve ser <= 10% da Campanha`);
  }

  // Repetir andar já vencido exige ticket; compra limitada a 10/dia
  const s = saveTeste();
  const dia0 = 1_700_000_000_000;
  const i1 = iniciarAndarTorreElemental(s, 'chama', 1, { agoraMs: dia0 });
  assert.equal(i1.ok, true);
  const c1 = concluirAndarTorreElemental(s, 'chama', 1, { venceu: true }, { agoraMs: dia0, rng: () => 0.99 });
  assert.equal(c1.premios.diamantes, 10);
  assert.equal(c1.premios.doces, 1);

  const repSemTicket = iniciarAndarTorreElemental(s, 'chama', 1, { agoraMs: dia0 });
  assert.equal(repSemTicket.ok, false);
  assert.equal(repSemTicket.precisaTicket, true);

  const comp10 = comprarTicketTorre(s, 'chama', 10, { agoraMs: dia0 });
  assert.equal(comp10.ok, true);
  assert.equal(saldoTicketTorre(s, 'chama'), 10);
  const comp11 = comprarTicketTorre(s, 'chama', 1, { agoraMs: dia0 });
  assert.equal(comp11.ok, false);
  assert.equal(comp11.limiteDiario, true);

  const repComTicket = iniciarAndarTorreElemental(s, 'chama', 1, { agoraMs: dia0 });
  assert.equal(repComTicket.ok, true);
  assert.equal(repComTicket.gastouTicket, true);
  assert.equal(saldoTicketTorre(s, 'chama'), 9);

  // Marco de 10 andares dá 3 tickets do evento e 1 fragmento garantido na Torre Elemental
  const s2 = saveTeste();
  for (let a = 1; a <= 10; a++) {
    concluirAndarTorreElemental(s2, 'chama', a, { venceu: true }, { agoraMs: dia0, rng: () => 0.99 });
  }
  assert.equal(hwDe(s2).tickets, 3);
  assert.ok(saldoFragmentoSonho(s2, 'fogo') >= 1, 'Andar chefe da Torre Elemental deve entregar Fragmento de Evolução');
});

test('B. Doces: 1-2 doces, 5% base vs 2,5% Idle/AFK/Auto, bônus 200%->5% e teto 10% nos dois casos', () => {
  assert.equal(chanceDropDoce({ modo: 'campanha', bonusDropPct: 0 }), 0.05);
  assert.equal(chanceDropDoce({ modo: 'idle', bonusDropPct: 0 }), 0.025);
  assert.equal(chanceDropDoce({ modo: 'afk', bonusDropPct: 0 }), 0.025);
  assert.equal(chanceDropDoce({ modo: 'auto', bonusDropPct: 0 }), 0.025);
  assert.equal(chanceDropDoce({ modo: 'idle', bonusDropPct: 200 }), 0.05);
  assert.equal(chanceDropDoce({ modo: 'campanha', bonusDropPct: 200 }), 0.10);
  assert.equal(chanceDropDoce({ modo: 'idle', bonusDropPct: 500 }), 0.10);
  assert.equal(chanceDropDoce({ modo: 'campanha', bonusDropPct: 500 }), 0.10);

  const s = saveTeste();
  const dataEvento = new Date('2026-10-15T12:00:00');
  const d1 = talvezDoce(s, 'campanha', () => 0.01, dataEvento);
  assert.ok(d1 === 1 || d1 === 2);
});

test('C. Loja Temática: tabela completa, Ovos T4/T5 limite 1 por conta e tickets diários limite 10/dia', () => {
  const ids = new Set(LOJA_TORRE.map((x) => x.id));
  for (const id of ['ouro_50k', 'buff_xp_20', 'buff_drop_20', 'buff_ouro_20', 'icone_evento', 'moldura_evento', 'ovo_t1', 'ovo_t2', 'ovo_t4', 'ovo_t5', 'ticket_torre_diario']) {
    assert.ok(ids.has(id), `Loja deve conter ${id}`);
  }
  const s = saveTeste();
  hwDe(s).doces = 5000;
  assert.equal(comprarLoja(s, 'ouro_50k').ok, true);
  assert.equal(s.recompensas.gold, 50000);
  assert.equal(comprarLoja(s, 'ovo_t4').ok, true);
  assert.equal(comprarLoja(s, 'ovo_t4').limiteConta, true);
  assert.equal(comprarLoja(s, 'ovo_t5').ok, true);
  assert.equal(comprarLoja(s, 'ovo_t5').limiteConta, true);
});

test('D. Banners: Permanente 1000💎/10 + 10 grátis/dia; Eventos 2000💎/10 separados por cadência', () => {
  assert.equal(CATALOGO_BANNERS.permanente.custoLote10, 1000);
  assert.equal(CATALOGO_BANNERS.permanente.rollsGratisDia, 10);
  for (const k of ['semanal', 'quinzenal', 'mensal', 'tematico']) {
    assert.equal(CATALOGO_BANNERS[k].custoLote10, 2000);
  }
  const s = saveTeste();
  assert.equal(invocacoesGratisDe(s).porDia, 10);
  assert.equal(comprarPacoteBanner(s, 'permanente').custoDiamantes, 1000);
  assert.equal(comprarPacoteBanner(s, 'semanal').custoDiamantes, 2000);
});

test('E. Bônus de boas-vindas: 20.000💎 para TODOS os jogadores (contas antigas e novas), uma única vez', () => {
  const sAntiga = saveTeste();
  sAntiga.recompensas.diamantes = 500;
  sAntiga.conta = { uid: 'velho-1', inicial: 'Noctarn' };
  const r1 = garantirBonusBoasVindasTodos(sAntiga, 1000);
  assert.equal(r1.creditado, true);
  assert.equal(sAntiga.recompensas.diamantes, 20500);
  const r2 = garantirBonusBoasVindasTodos(sAntiga, 2000);
  assert.equal(r2.creditado, false);
  assert.equal(sAntiga.recompensas.diamantes, 20500);

  const sNova = saveTeste();
  sNova.recompensas.diamantes = 0;
  prepararContaNova(sNova, { userId: 'novo-1', inicial: 'Brasinha', agora: 3000, novo: true });
  assert.equal(sNova.recompensas.diamantes, 20000);
});

test('F. Curva de XP: mantém Nv.1..20 e desacelera forte após Nv.20 e em Nv.150+', () => {
  assert.equal(xpTotal(5), 220);
  assert.equal(xpTotal(10), 720);
  assert.equal(xpTotal(20), 2470);
  assert.ok(xpPara(50) > 5000, 'Nv.50 deve exigir bem mais XP que a curva linear antiga');
  assert.ok(xpPara(150) > 100000, 'Nv.150+ deve continuar lento');
  assert.equal(nivelDe(xpTotal(50)), 50);
  assert.equal(nivelDe(xpTotal(150)), 150);
});

test('G e H. Elementos: Lavândria é inseto, Cristalino é gelo, Reino 10 gelo, e todos os 18 elementos têm torre e calabouço', () => {
  assert.equal(ELEMENTO_DA_ESPECIE['Lavândria'], 'inseto');
  assert.equal(ELEMENTO_DA_ESPECIE['Cristalino'], 'gelo');
  assert.equal(ELEMENTO_DA_ESPECIE['Geadinha'], 'gelo');
  assert.equal(ELEMENTO_DA_ESPECIE['Glacita'], 'gelo');
  assert.equal(ELEMENTO_DA_ESPECIE['Nevita'], 'gelo');

  assert.equal(ELEMENTOS_TORRES_CALABOUCOS.length, 18);
  for (const el of ELEMENTOS_TORRES_CALABOUCOS) {
    assert.ok(torreDoElemento(el), `Elemento ${el} precisa ter torre`);
    assert.ok(calaboucoDoElemento(el), `Elemento ${el} precisa ter calabouço`);
    assert.ok(TORRES_POR_ELEMENTO[el]);
    assert.ok(CALABOUCOS_POR_ELEMENTO[el]);
  }

  // Ficha da Lavândria: exige fragmentos (inseto) E essência verde
  const s = saveTeste();
  const lav = { especie: 'Lavândria', nivel: 45, forma: 1 };
  const ev = consultarEvolucaoForma(s, lav);
  assert.equal(ev.elemento, 'inseto');
  assert.equal(ev.parEssencia, 'verde');
  assert.equal(ev.custo, 10);
  assert.equal(ev.custoEssencias.menor, 20);
});
