import test from 'node:test'; import assert from 'node:assert/strict';
import * as R from './regiao1-exp-regras.js';
import { enfileirarObras, avancar } from './regiao1-gestao-regras.js';
import { FAB } from './regiao1-exp-dados.js';
const novo = (quests = {}) => ({ quests, desbloqueios: {}, recompensas: { gold: 0, diamantes: 0 }, idle: { equipe: [{ especie: 'Noctarn', nivel: 20, xp: 0, raridade: 3, forma: 'natural' }] } });
const rngSeq = (...v) => { let i = 0; return () => v[i++ % v.length]; };
test('tickets: 1 por missão de história, só na primeira conclusão; banner adiciona Onírico', () => {
  const s = novo({ q_pegadas: 'concluida', q_sec_canteiro: 'concluida' });
  assert.equal(R.concederTickets(s), 1); assert.equal(R.concederTickets(s), 0); assert.equal(R.expDe(s).tickets, 1);
  const r = R.invocar(s, rngSeq(0.1, 0.1)); assert.ok(r.ok); assert.equal(s.idle.equipe.length, 2); assert.equal(R.expDe(s).tickets, 0);
  assert.equal(R.invocar(s).ok, false);
});
test('guilda: aceitar → buscar → entregar uma vez; libera Fazenda e Oficina em sequência', () => {
  const s = novo(); const f = R.fabEstado(s);
  assert.equal(R.entregarContrato(s, 'g1').ok, false);
  assert.ok(R.aceitarContrato(s, 'g1').ok); assert.equal(R.entregarContrato(s, 'g1').ok, false); // faltam fibras
  f.materiais.fibra = 8; assert.ok(R.entregarContrato(s, 'g1').ok); assert.equal(f.materiais.fibra, 2);
  assert.equal(R.entregarContrato(s, 'g1').ok, false); assert.equal(s.recompensas.gold, 120);
  assert.ok(R.expDe(s).fazenda); assert.equal(Object.keys(f.estruturas).length, 3);
  assert.ok(R.aceitarContrato(s, 'g2').ok); f.materiais.leite = 3; assert.ok(R.entregarContrato(s, 'g2').ok); assert.ok(R.expDe(s).oficina);
});
test('fazenda produz com o tempo e abastece a oficina (receita usa material de Caçada + leite)', () => {
  const s = novo(); R.liberarFazenda(s); const f = R.fabEstado(s); avancar(f, FAB, 1000); for (const p of Object.values(f.gestao.producao)) p.desde = 1000;
  avancar(f, FAB, 1000 + 2 * 3600000); assert.ok(f.gestao.producao.cur.acum >= 24);
});
test('calabouço: Sanidade cai nas salas corrompidas e força escolha; sair preserva ganhos; zerar perde metade', () => {
  const s = novo({ q_boss_e: 'concluida' }); const f = R.fabEstado(s);
  assert.ok(R.iniciarCalabouco(s).ok); let run = R.expDe(s).calabouco.run;
  R.avancarSala(s); assert.equal(run.sala, 1); R.avancarSala(s); assert.equal(run.sanidade, 75);
  R.avancarSala(s); run.sanidade = 50; const r = R.avancarSala(s); assert.equal(r.precisaEscolher, true); assert.equal(run.sanidade, 50);
  run.sanidade = 40; f.gestao.itens.tonico = 1; const t = R.avancarSala(s, Math.random, 'tonico'); assert.ok(t.ok); assert.equal(run.sanidade, 50); assert.equal(f.gestao.itens.tonico, 0);
  const ganhos = { ...run.ganhos }; R.iniciarCalabouco(s); const run2 = R.expDe(s).calabouco.run; run2.sala = 1; run2.sanidade = 20; run2.ganhos = { gold: 100 };
  const z = R.avancarSala(s, Math.random, 'risco'); assert.equal(z.run.resultado, 'sanidade'); assert.equal(z.run.pagos.gold, 100 * 0 + Math.floor((100 + 80) * 0.5)); assert.ok(ganhos.gold > 0);
  assert.equal(R.avancarSala(s).ok, false); // pago uma vez
  const s3 = novo({ q_boss_e: 'concluida' }); R.iniciarCalabouco(s3); const r3 = R.expDe(s3).calabouco.run; r3.ganhos = { gold: 90 }; r3.sala = 1; r3.sanidade = 30;
  assert.equal(R.avancarSala(s3).precisaEscolher, true); const sa = R.avancarSala(s3, Math.random, 'sair'); assert.equal(sa.run.pagos.gold, 90);
});
test('crise: cinco estados, zumbis, purificação e reconstrução reabrem o serviço', () => {
  const s = novo(); const f = R.fabEstado(s); const c = R.criseDe(s);
  assert.equal(c.estado, 'saudavel'); assert.ok(R.acaoCrise(s, 'surto').ok); assert.equal(c.zumbis, 3);
  assert.ok(R.acaoCrise(s, 'aguardar').ok); assert.equal(c.estado, 'tomada'); assert.equal(c.zumbis, 7);
  assert.equal(R.acaoCrise(s, 'purificar').ok, false);
  s.idle.equipe[0].nivel = 60; for (let i = 0; i < 3; i++) R.acaoCrise(s, 'retomar'); assert.equal(c.zumbis, 0);
  f.gestao.itens.tonico = 1; f.materiais.cristal = 10; f.materiais.fibra = 10; s.recompensas.gold = 150;
  assert.ok(R.acaoCrise(s, 'purificar').ok); assert.equal(c.estado, 'purificada'); assert.ok(R.acaoCrise(s, 'reconstruir', Math.random, 5000).ok); assert.equal(c.estado, 'reconstruida');
  assert.equal(R.acaoCrise(s, 'servico', Math.random, 5001).ok, false); assert.ok(R.acaoCrise(s, 'servico', Math.random, 5000 + 3600000).ok); assert.equal(f.gestao.itens.tonico, 1);
});
test('herói × vilão: 10 missões em ordem, escolha muda objetivo e desfecho, sem pagamento duplo', () => {
  const s = novo(); const h = R.hvDe(s);
  assert.equal(R.capitulo('cap1').missoes.length, 10); assert.equal(R.estadoMissao(s, 'cap1', 2), 'bloqueada');
  for (let n = 1; n <= 4; n++) assert.ok(R.concluirMissaoHV(s, 'cap1', n).ok);
  assert.equal(R.concluirMissaoHV(s, 'cap1', 5).ok, false); // exige escolha
  assert.ok(R.escolherHV(s, 'cap1', 5, 'poupar').ok); assert.ok(R.concluirMissaoHV(s, 'cap1', 5).ok);
  const ouro = s.recompensas.gold; assert.equal(R.concluirMissaoHV(s, 'cap1', 5).ok, false); assert.equal(s.recompensas.gold, ouro);
  assert.match(R.missaoResolvida(s, 'cap1', 7).objetivo, /Proteger Maregor/);
  const s2 = novo(); R.hvDe(s2).atual = 5; R.escolherHV(s2, 'cap1', 5, 'prender'); assert.match(R.missaoResolvida(s2, 'cap1', 7).objetivo, /Escoltar/);
  h.atual = 10; const fim = R.concluirMissaoHV(s, 'cap1', 10); assert.ok(fim.fim); assert.match(fim.epilogo, /aliado improvável/);
});
