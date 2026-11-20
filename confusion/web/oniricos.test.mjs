import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from './core.js';
import * as Y from './systems.js';
import * as E from './species.js';

const DAY = 86400000;
const at = (y, m, d) => Date.UTC(y, m - 1, d, 15); // meio-dia de Brasília

test('trilha: missões só contam nos 7 primeiros dias; o marco 25 cai na hora', () => {
  let t = Y.trilhaDoMes(null, at(2026, 1, 1));
  for (let i = 0; i < 24; i++) t = Y.contaMissao(t, at(2026, 1, 2)).t;
  assert.equal(t.missoes, 24);
  const r25 = Y.contaMissao(t, at(2026, 1, 3));
  assert.equal(r25.t.missoes, 25);
  assert.deepEqual(r25.marco, { evento: 1 });
  assert.equal(Y.contaMissao(t, at(2026, 1, 8)).t.missoes, 24); // dia 8: não conta
});

test('trilha: resgate só a partir do dia 7, com 100 ou mais; depois uma vez por mês', () => {
  let u = Y.trilhaDoMes(null, at(2026, 1, 1));
  for (let i = 0; i < 100; i++) u = Y.contaMissao(u, at(2026, 1, 1 + (i % 7))).t;
  assert.equal(u.missoes, 100);
  assert.equal(Y.eventoResgatavel(u, at(2026, 1, 6)), false);
  assert.equal(Y.eventoResgatavel(u, at(2026, 1, 7)), true);
  const res = Y.resgatarEvento(u, at(2026, 1, 7));
  assert.equal(res.resgatado, true);
  assert.equal(Y.eventoResgatavel(res, at(2026, 1, 20)), false);
  assert.equal(Y.trilhaDoMes(res, at(2026, 2, 7)).missoes, 0); // mês novo zera
  let baixo = Y.trilhaDoMes(null, at(2026, 1, 1));
  for (let i = 0; i < 99; i++) baixo = Y.contaMissao(baixo, at(2026, 1, 3)).t;
  assert.equal(Y.eventoResgatavel(baixo, at(2026, 1, 7)), false); // 99 não basta
});

test('trilha: recompensa de dia resgata uma vez, no dia certo ou depois', () => {
  const t = Y.trilhaNova(at(2026, 1, 1));
  assert.equal(Y.diaResgatavel(t, at(2026, 1, 1), 2), false);
  assert.equal(Y.diaResgatavel(t, at(2026, 1, 2), 2), true);
  const r = Y.resgatarDia(t, at(2026, 1, 2), 2);
  assert.deepEqual(r.r, { doce: 1 });
  assert.equal(Y.diaResgatavel(r.t, at(2026, 1, 3), 2), false);
});

test('página 2: até 3 cópias extras, cada uma com preço em doces; depois acaba', () => {
  let t = { ...Y.trilhaNova(at(2026, 1, 7)), resgatado: true };
  const c1 = Y.comprarCopia(t, 30);
  assert.equal(c1.preco, 30);
  assert.throws(() => Y.comprarCopia(c1.t, 49)); // a segunda custa 50
  const c2 = Y.comprarCopia(c1.t, 50);
  const c3 = Y.comprarCopia(c2.t, 80);
  assert.equal(c3.t.copias, 3);
  assert.equal(Y.copiaPreco(c3.t), null);
  assert.throws(() => Y.comprarCopia(c3.t, 999));
  assert.equal(Y.copiaPreco(Y.trilhaNova(at(2026, 1, 7))), null); // sem resgate, sem página 2
});

test('fichas semanais: 1 a cada 3 capturas, até 4 por semana; semana nova zera', () => {
  let s = null;
  let fichas = 0;
  for (let i = 0; i < 15; i++) { const r = Y.contaCapturaSemanal(s, Y.EPOCH_TS); s = r.s; fichas += r.fichas; }
  assert.equal(fichas, 4); // 15 capturas dariam 5; o limite é 4
  assert.equal(Y.contaCapturaSemanal(s, Y.EPOCH_TS + 7 * DAY).s.capturas, 1);
});

test('raid: abre a cada 2 horas por 60 minutos (horário de Brasília); o boss gira', () => {
  const r0 = Y.raidAt(Y.EPOCH_TS);
  assert.equal(r0.aberto, true);
  assert.equal(Y.horaBrasilia(r0.inicioMs), '00:00');
  const fechado = Y.raidAt(Y.EPOCH_TS + 61 * 60000);
  assert.equal(fechado.aberto, false);
  assert.equal(Y.horaBrasilia(fechado.proximoMs), '02:00');
  assert.notEqual(Y.raidAt(Y.EPOCH_TS + 2 * 3600000).boss.id, r0.boss.id);
  assert.equal(Y.raidAt(Y.EPOCH_TS + 6 * 3600000).boss.id, r0.boss.id); // três bosses: volta ao primeiro
});

test('raid: ovo de raid vai de tier 10 a 15; ao chocar, 40% saem boss e 60% mítica', () => {
  assert.equal(Y.tierOvoRaid(0), 10);
  assert.equal(Y.tierOvoRaid(0.99), 15);
  assert.equal(Y.raridadeOvoRaid(0.1), C.RARITY_BOSS);
  assert.equal(Y.raridadeOvoRaid(0.9), 5);
  assert.equal(C.rarityName(Y.raridadeOvoRaid(0.1)), 'boss');
});

test('raid: chance de vencer o boss limitada entre 5% e 95%', () => {
  const boss = Y.RAID_BOSSES[0];
  const fraco = { tier: 1, aptitudes: {}, variant: 'natural', classe: 'comum', level: 1 };
  const forte = { ...fraco, tier: 15, aptitudes: { minerar: 10 }, variant: 'combinada', classe: 'evento', level: 20 };
  assert.equal(Y.chanceRaid(fraco, { poder: 100000 }), Y.RAID.chanceMin); // piso
  assert.equal(Y.chanceRaid(forte, { poder: 1 }), Y.RAID.chanceMax);      // teto
  assert.ok(Math.abs(Y.chanceRaid(fraco, boss) - 10 / 120) < 1e-9);       // poder 10 contra 120
});

test('clone: oníricos de banner e de evento têm chance; os demais não', () => {
  assert.equal(Y.chanceClone('Ignavor'), Y.CLONE_CHANCE);
  assert.equal(Y.chanceClone('Noctarn'), Y.CLONE_CHANCE);
  assert.equal(Y.chanceClone('Abyssar'), Y.CLONE_CHANCE);
  assert.equal(Y.chanceClone('Lagarto'), 0);
});

test('passivas: cada onírico de banner semanal e de evento tem passiva própria; nomes não se repetem', () => {
  for (const nome of [C.BANNER_FEATURED.semanal, C.BANNER_FEATURED.evento, ...E.ESPECIES_EVENTO]) {
    assert.ok(E.PASSIVA_DA_ESPECIE[nome], `${nome} sem passiva`);
  }
  assert.deepEqual(E.repetidosNoCatalogo(), []);
});

test('passivas: herança no breed mantém no máximo 2 e não repete', () => {
  const m = { passivas: [] };
  const a = { nome: 'A', texto: '' }; const b = { nome: 'B', texto: '' }; const c = { nome: 'C', texto: '' };
  assert.equal(C.herdarPassiva(m, a), true);
  assert.equal(C.herdarPassiva(m, a), false);       // repetida: não entra
  C.herdarPassiva(m, b);
  C.herdarPassiva(m, c);                             // cheio: sai a mais antiga (A)
  assert.deepEqual(m.passivas.map((p) => p.nome), ['B', 'C']);
});

test('custo da transferência: pelo tipo; dobra no máximo (tier 10 mítica ou tier 15 boss)', () => {
  assert.equal(Y.custoTransferencia({ tier: 1, rarity: 1 }), 300);                       // base
  assert.equal(Y.custoTransferencia({ origem: 'banner', tier: 3, rarity: 2 }), 1500);
  assert.equal(Y.custoTransferencia({ origem: 'evento', tier: 3, rarity: 2 }), 2500);
  assert.equal(Y.custoTransferencia({ origem: 'raid', tier: 12, rarity: 6 }), 4000);
  assert.equal(Y.custoTransferencia({ origem: 'evento', tier: 10, rarity: 5 }), 5000);  // máximo
  assert.equal(Y.custoTransferencia({ origem: 'raid', tier: 15, rarity: 6 }), 8000);    // máximo raid
});

test('transferência: o destino recebe raridade, tier e progresso; mantém espécie, id e origem; a origem fica', () => {
  const origem = { id: 'o', species: 'Noctarn', origem: 'evento', rarity: 5, tier: 10, level: 12, xp: 900,
    aptitudes: { minerar: 6 }, abilities: ['X'], vinculo: 40, variant: 'mutante', purity: 'trevas', passivas: [{ nome: 'Sol Permanente', texto: '' }] };
  const destino = { id: 'd', species: 'Ignavor', origem: 'banner', rarity: 2, tier: 2, level: 1, xp: 0,
    aptitudes: {}, abilities: ['Y'], vinculo: 0, variant: 'natural', purity: 'luz', passivas: [{ nome: 'Couraça Lenta', texto: '' }] };
  const novo = C.transferirAtributos(origem, destino);
  assert.equal(novo.id, 'd');
  assert.equal(novo.species, 'Ignavor');
  assert.equal(novo.origem, 'banner');
  assert.equal(novo.rarity, 5);
  assert.equal(novo.tier, 10);
  assert.equal(novo.level, 12);
  assert.equal(novo.variant, 'mutante');
  assert.deepEqual(novo.aptitudes, { minerar: 6 });
  assert.deepEqual(novo.passivas.map((p) => p.nome), ['Couraça Lenta', 'Sol Permanente']);
  novo.aptitudes.minerar = 99;                     // cópia: não mexe na origem
  assert.equal(origem.aptitudes.minerar, 6);
  assert.throws(() => C.transferirAtributos(origem, origem), /dois/);
});
