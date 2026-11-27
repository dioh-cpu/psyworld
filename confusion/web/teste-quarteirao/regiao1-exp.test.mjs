import test from 'node:test'; import assert from 'node:assert/strict';
import * as R from './regiao1-exp-regras.js';
import { avancar, fabricarLote } from './regiao1-gestao-regras.js';
import { FAB, CALABOUCO, CRISE, MOLDURAS_BANNER, arteMoldura } from './regiao1-exp-dados.js';
import { criarEstadoInicial, serializarEstado, desserializarEstado } from './regiao1-estado.js';
import { garantirEstadoIdle } from './regiao1-idle.js';
import { hwDe } from './regiao1-halloween-regras.js';
import { validateSave } from '../../../api/_lib/confusion-save-lib.js';

const novo = (quests = {}) => ({ quests, desbloqueios: {}, recompensas: { gold: 0, diamantes: 0 }, idle: { equipe: [{ especie: 'Noctarn', nivel: 20, xp: 0, raridade: 3, forma: 'natural', uid: 'o0' }] } });
const rngSeq = (...v) => { let i = 0; return () => v[i++ % v.length]; };
test('tickets: 1 por missão de história, só na primeira conclusão; banner adiciona Onírico', () => {
  const s = novo({ q_pegadas: 'concluida', q_sec_canteiro: 'concluida' });
  R.expDe(s).gratis = { saldo: 0, dia: 1e9 }; // sem as grátis diárias: testa só os tickets
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
test('contratos diários: abrem após g3, determinísticos por data local, renovam à meia-noite e pagam ouro, diamantes e tickets 1×/dia', () => {
  const s = novo(); const f = R.fabEstado(s);
  const dA = new Date(2026, 10, 26, 23, 50, 0);
  const dMesmo = new Date(2026, 10, 26, 8, 15, 0);
  const dMeiaNoite = new Date(2026, 10, 27, 0, 0, 1);

  // Bloqueados antes de g3
  assert.equal(R.contratosDiariosEstado(s, dA).liberado, false);
  assert.equal(R.aceitarContrato(s, 'd1', dA).ok, false);

  // Conclui g1, g2, g3
  R.expDe(s).guilda.contratos = { g1: 'entregue', g2: 'entregue', g3: 'entregue' };
  const est1 = R.contratosDiariosEstado(s, dA);
  const est1b = R.contratosDiariosEstado(s, dMesmo);
  assert.equal(est1.liberado, true);
  assert.equal(est1.lista.length, 3);
  assert.deepEqual(est1.lista.map((c) => c.titulo), est1b.lista.map((c) => c.titulo)); // determinístico na mesma data local

  // Abastece todos os materiais e itens possíveis (inclusive novos: torta, pocao_xp_p, tonico_concentrado)
  Object.assign(f.materiais, { fibra: 50, cristal: 50, leite: 50, mel: 50, ovos: 50 });
  Object.assign(f.gestao.itens, { tonico: 10, racao: 10, torta: 10, tonico_concentrado: 10 });
  hwDe(s).pocoes.pocao_xp_p = 10;

  const goldAntes = s.recompensas.gold, diamAntes = s.recompensas.diamantes, tickAntes = R.expDe(s).tickets;
  for (const c of est1.lista) {
    assert.ok(c.recompensa.gold > 0 && c.recompensa.diamantes > 0 && c.recompensa.tickets > 0);
    assert.ok(R.aceitarContrato(s, c.id, dA).ok);
    assert.ok(R.entregarContrato(s, c.id, dA).ok);
    // Não paga duas vezes no mesmo dia
    assert.equal(R.aceitarContrato(s, c.id, dA).ok, false);
    assert.equal(R.entregarContrato(s, c.id, dA).ok, false);
  }
  assert.ok(s.recompensas.gold > goldAntes);
  assert.ok(s.recompensas.diamantes > diamAntes);
  assert.equal(R.expDe(s).tickets, tickAntes + 3);

  // Virada da meia-noite local renova os 3 contratos
  const est2 = R.contratosDiariosEstado(s, dMeiaNoite);
  assert.notEqual(est2.data, est1.data);
  assert.ok(est2.lista.every((c) => c.estado === 'disponivel'));
  assert.ok(R.aceitarContrato(s, 'd1', dMeiaNoite).ok);
});
test('fazenda produz com o tempo e oficina transfere Elixir de Foco (pocao_xp_p) para a mochila de Halloween', () => {
  const s = novo(); R.liberarFazenda(s); const f = R.fabEstado(s); avancar(f, FAB, 1000); for (const p of Object.values(f.gestao.producao)) p.desde = 1000;
  avancar(f, FAB, 1000 + 2 * 3600000); assert.ok(f.gestao.producao.cur.acum >= 24);
  f.profissoes.alquimia = 25; // nv.3 libera Elixir de Foco
  f.materiais.cristal = 10; f.materiais.mel = 10;
  assert.ok(fabricarLote(f, FAB, 'elixir', 2, 5000).ok);
  const ev = R.avancarFab(s, 5000 + 100_000);
  assert.equal(ev.pocoesMovidas, 3); // 2 + 1 extra de nv.3
  assert.equal(f.gestao.itens.pocao_xp_p, 0);
  assert.equal(hwDe(s).pocoes.pocao_xp_p, 3);
});
test('calabouço na arena: preparar/resolver luta, chefe com bonus, vida persistente, Ração (+40%) e Tônico Concentrado (+60)', () => {
  const s = novo({ q_boss_e: 'concluida' });
  s.idle.equipe = [
    { especie: 'Noctarn', nivel: 12, xp: 0, raridade: 3, forma: 'natural', uid: 'o0' },
    { especie: 'Brotavel', nivel: 12, xp: 0, raridade: 2, forma: 'natural', uid: 'o1' },
  ];
  const f = R.fabEstado(s);
  assert.ok(R.iniciarCalabouco(s).ok);
  let run = R.expDe(s).calabouco.run;

  // Sala 0 (luta): avancarSala prepara a luta para a arena, sem resolver sozinha
  const prep0 = R.avancarSala(s);
  assert.equal(prep0.emBatalha, true);
  assert.equal(run.sala, 0);
  assert.match(prep0.luta.arena, /expansao1\/calabouco\/arena-corredor\.webp/);
  assert.equal(R.usarRacaoCalabouco(s).ok, false); // não usa durante a luta

  // Vitória na sala 0 com vida parcial (40% e 60%) -> persiste na descida e soma ganhos
  assert.ok(R.resolverLutaCalabouco(s, { vitoria: true, vida: { o0: 0.4, o1: 0.6 } }).ok);
  assert.equal(run.sala, 1);
  assert.equal(run.vida.o0, 0.4); assert.equal(run.vida.o1, 0.6);
  assert.equal(run.ganhos.gold, CALABOUCO.recompensas.luta.gold);

  // Ração reforçada entre salas recupera +40% de vida (limitada a 100%)
  f.gestao.itens.racao = 1;
  assert.ok(R.usarRacaoCalabouco(s).ok);
  assert.ok(Math.abs(run.vida.o0 - 0.8) < 1e-6);
  assert.equal(run.vida.o1, 1);
  assert.equal(f.gestao.itens.racao, 0);

  // Sala 1 (corrompida): reduz Sanidade para 75
  R.avancarSala(s); assert.equal(run.sala, 2); assert.equal(run.sanidade, 75);

  // Sala 2 (luta): prepara e vence mantendo 50% de vida
  const prep2 = R.avancarSala(s);
  assert.equal(prep2.emBatalha, true);
  assert.match(prep2.luta.arena, /arena-galeria\.webp/);
  assert.ok(R.resolverLutaCalabouco(s, { vitoria: true, hpFinal: 0.5 }).ok);
  assert.equal(run.sala, 3);
  assert.equal(run.vida.o0, 0.5);

  // Sala 3 (corrompida) com Sanidade baixa: exige escolha e aceita Tônico Concentrado (+60)
  run.sanidade = 30;
  assert.equal(R.avancarSala(s).precisaEscolher, true);
  f.gestao.itens.tonico_concentrado = 1;
  const tc = R.avancarSala(s, Math.random, 'tonico_concentrado');
  assert.ok(tc.ok);
  assert.equal(run.sanidade, 30 + 60 - 25); // +60 e −25 da sala
  assert.equal(f.gestao.itens.tonico_concentrado, 0);
  assert.equal(run.sala, 4);

  // Sala 4 (chefe): prepara chefe com { chefe: true, bonus } e conclui na vitória
  const prepChefe = R.avancarSala(s);
  assert.equal(prepChefe.emBatalha, true);
  assert.equal(prepChefe.luta.inimigos[0][3].chefe, true);
  assert.ok(prepChefe.luta.inimigos[0][3].bonus.hp > 0);
  assert.match(prepChefe.luta.arena, /arena-coracao\.webp/);
  const fim = R.resolverLutaCalabouco(s, { vitoria: true, hpFinal: 0.35 });
  assert.equal(fim.run.resultado, 'concluido');
  assert.equal(R.expDe(s).calabouco.feitos, 1);
  assert.equal(R.avancarSala(s).ok, false); // pago uma única vez

  // Derrota em luta encerra com metade dos ganhos; zerar Sanidade e sair continuam funcionando
  const sDer = novo({ q_boss_e: 'concluida' }); R.iniciarCalabouco(sDer);
  const rDer = R.expDe(sDer).calabouco.run; rDer.ganhos = { gold: 90, fibra: 5 };
  R.avancarSala(sDer);
  const der = R.resolverLutaCalabouco(sDer, { vitoria: false });
  assert.equal(der.run.resultado, 'derrota');
  assert.equal(der.run.pagos.gold, 45);
  assert.equal(der.run.pagos.fibra, 2);

  const sSair = novo({ q_boss_e: 'concluida' }); R.iniciarCalabouco(sSair);
  const rSair = R.expDe(sSair).calabouco.run; rSair.ganhos = { gold: 90 }; rSair.sala = 1; rSair.sanidade = 30;
  assert.equal(R.avancarSala(sSair).precisaEscolher, true);
  assert.equal(R.avancarSala(sSair, Math.random, 'sair').run.pagos.gold, 90);
});
test('XP da Campanha para a formação: vitória inteira, derrota 30% e chefe ×2', () => {
  const s = novo();
  s.idle.equipe = [
    { especie: 'Penumbrio', nivel: 1, xp: 0, raridade: 1, forma: 'natural', uid: 'o0' },
    { especie: 'Brasinha', nivel: 1, xp: 0, raridade: 1, forma: 'natural', uid: 'o1' },
    { especie: 'Sementil', nivel: 1, xp: 0, raridade: 1, forma: 'natural', uid: 'o2' },
  ];
  s.idle.formacao = ['o0', 'o1', null, null]; // o2 fora da formação não recebe XP
  const rVit = R.darXpCampanha(s.idle, { nivel: 5, chefe: false, vitoria: true });
  assert.equal(rVit.xp, 100); // 40 + 12*5
  assert.equal(s.idle.equipe[0].xp, 100);
  assert.equal(s.idle.equipe[2].xp, 0);
  const rDer = R.darXpCampanha(s.idle, { nivel: 5, chefe: false, vitoria: false });
  assert.equal(rDer.xp, 30); // 30%
  const rBoss = R.darXpCampanha(s.idle, { nivel: 12, chefe: true, vitoria: true });
  assert.equal(rBoss.xp, (40 + 12 * 12) * 2);
});
test('crise: cinco estados, artes em expansao1/crise com fallback, zumbis, purificação e reconstrução', () => {
  for (const est of CRISE.estados) {
    assert.match(CRISE.arte[est], /^expansao1\/crise\/vila-/);
    assert.ok(CRISE.arteFallback[est]);
  }
  const s = novo(); const f = R.fabEstado(s); const c = R.criseDe(s);
  assert.equal(c.estado, 'saudavel'); assert.ok(R.acaoCrise(s, 'surto').ok); assert.equal(c.zumbis, 3);
  assert.ok(R.acaoCrise(s, 'aguardar').ok); assert.equal(c.estado, 'tomada'); assert.equal(c.zumbis, 7);
  assert.equal(R.acaoCrise(s, 'purificar').ok, false);
  s.idle.equipe[0].nivel = 60; for (let i = 0; i < 3; i++) R.acaoCrise(s, 'retomar'); assert.equal(c.zumbis, 0);
  f.gestao.itens.tonico = 1; f.materiais.cristal = 10; f.materiais.fibra = 10; s.recompensas.gold = 150;
  assert.ok(R.acaoCrise(s, 'purificar').ok); assert.equal(c.estado, 'purificada'); assert.ok(R.acaoCrise(s, 'reconstruir', Math.random, 5000).ok); assert.equal(c.estado, 'reconstruida');
  assert.equal(R.acaoCrise(s, 'servico', Math.random, 5001).ok, false); assert.ok(R.acaoCrise(s, 'servico', Math.random, 5000 + 3600000).ok); assert.equal(f.gestao.itens.tonico, 1);
});
test('herói × vilão e molduras: 10 missões, bustos no diálogo, capa e molduras por raridade', () => {
  const s = novo(); const h = R.hvDe(s);
  const cap1 = R.capitulo('cap1');
  assert.equal(cap1.missoes.length, 10);
  assert.equal(cap1.capa, 'assets/confusion/interface/expansao1/hv/capa-cap1.webp');
  assert.equal(R.falaDialogoHV('Maregor, ferido: O elmo quebrado.').busto, 'assets/confusion/interface/expansao1/hv/maregor.png');
  assert.equal(R.falaDialogoHV('Mira: A sirene tocou.').busto, 'assets/confusion/interface/expansao1/hv/mira.png');
  assert.equal(R.falaDialogoHV('General das Cinzas: O elmo é meu.').busto, 'assets/confusion/interface/expansao1/hv/general-das-cinzas.png');
  assert.equal(arteMoldura(MOLDURAS_BANNER.lendaria), 'assets/confusion/interface/banner/moldura-5.png');

  assert.equal(R.estadoMissao(s, 'cap1', 2), 'bloqueada');
  for (let n = 1; n <= 4; n++) assert.ok(R.concluirMissaoHV(s, 'cap1', n).ok);
  assert.equal(R.concluirMissaoHV(s, 'cap1', 5).ok, false); // exige escolha
  assert.ok(R.escolherHV(s, 'cap1', 5, 'poupar').ok); assert.ok(R.concluirMissaoHV(s, 'cap1', 5).ok);
  const ouro = s.recompensas.gold; assert.equal(R.concluirMissaoHV(s, 'cap1', 5).ok, false); assert.equal(s.recompensas.gold, ouro);
  assert.match(R.missaoResolvida(s, 'cap1', 7).objetivo, /Proteger Maregor/);
  const s2 = novo(); R.hvDe(s2).atual = 5; R.escolherHV(s2, 'cap1', 5, 'prender'); assert.match(R.missaoResolvida(s2, 'cap1', 7).objetivo, /Escoltar/);
  h.atual = 10; const fim = R.concluirMissaoHV(s, 'cap1', 10); assert.ok(fim.fim); assert.match(fim.epilogo, /aliado improvável/);
});
test('save antigo carrega sem perder nada e passa na validação de /api/confusion-save', () => {
  const antigo = criarEstadoInicial();
  antigo.mapaAtual = 'C1';
  antigo.quests.q_pegadas = 'concluida';
  antigo.quests.q_boss_e = 'concluida';
  antigo.bossesDerrotados.BOSS_E = true;
  antigo.recompensas = { gold: 450, diamantes: 35, xp: 120 };
  antigo.conta = { uid: 'u-antigo', inicial: 'Penumbrio', bonusEm: 1000, vipAte: 99999999 };
  antigo.idle = {
    jogador: { xp: 120, hp: 110, sanidade: 100 },
    equipe: [{ especie: 'Noctarn', nivel: 9, xp: 1400, raridade: 3, forma: 'natural' }], // sem uid
    exp: {
      tickets: 2,
      concedidos: { q_pegadas: true },
      pulls: 3,
      fazenda: true,
      oficina: true,
      guilda: { contratos: { g1: 'entregue', g2: 'entregue', g3: 'entregue' } }, // sem diarios
      fab: {
        materiais: { fibra: 12, cristal: 4, leite: 6, mel: 5, ovos: 4 },
        estruturas: { cur: { tipo: 'curral', nivel: 2 } },
        profissoes: { alquimia: 10 },
        // lote antigo sem seg e sem extra
        gestao: { obras: [], producao: {}, itens: { tonico: 2 }, fabricacao: [{ id: 'l-old', receita: 'tonico', qtd: 2, enfileirado: 1000, inicio: 1000 }], ultimoLote: null, log: [], seq: 1, ts: 1000 },
      },
    },
    estrategia: {
      r2: { materiais: { mel: 50, cera: 30 }, estruturas: { p1: { tipo: 'prefeitura', nivel: 5 }, a1: { tipo: 'casas', nivel: 2 } } },
    },
  };

  const carregado = desserializarEstado(serializarEstado(antigo));
  garantirEstadoIdle(carregado, 50_000);
  const exp = R.expDe(carregado);
  const ev = R.avancarFab(carregado, 50_000);

  assert.equal(carregado.mapaAtual, 'C1');
  assert.equal(carregado.recompensas.gold, 450);
  assert.equal(carregado.conta.uid, 'u-antigo');
  assert.equal(carregado.idle.equipe[0].nivel, 9);
  assert.equal(exp.tickets, 2);
  assert.equal(exp.guilda.contratos.g3, 'entregue');
  assert.equal(ev.fabricados.length, 1);
  assert.equal(R.fabEstado(carregado).gestao.itens.tonico, 4); // 2 antigos + 2 do lote em andamento
  assert.equal(carregado.idle.estrategia.r2.estruturas.p1.nivel, 5);
  assert.equal(carregado.idle.estrategia.r2.estruturas.a1.nivel, 2);

  // Ativa contratos diários e calabouço e valida limites de /api/confusion-save
  R.contratosDiariosEstado(carregado, new Date(2026, 10, 26));
  R.iniciarCalabouco(carregado);
  const redondo = desserializarEstado(serializarEstado(carregado));
  assert.equal(redondo.idle.exp.calabouco.run.sanidade, 100);
  const nuvem = validateSave({ game: 'confusion-waves', regiao1: JSON.parse(serializarEstado(redondo)), conta: redondo.conta });
  assert.equal(nuvem.ok, true);
});

test('invocações grátis: +10 por dia, acumulam até 100 e são usadas antes dos tickets', () => {
  const s = novo(), d0 = new Date(2026, 10, 27, 10).getTime(), dia = 86400000;
  assert.equal(R.invocacoesGratisDe(s, d0).saldo, 10);
  assert.equal(R.invocacoesGratisDe(s, d0 + 3600000).saldo, 10);
  assert.equal(R.invocacoesGratisDe(s, d0 + dia).saldo, 20);
  assert.equal(R.invocacoesGratisDe(s, d0 + 30 * dia).saldo, 100);
  const g = R.invocacoesGratisDe(s, d0 + 30 * dia); assert.equal(g.proximaEmMs, null);
  R.expDe(s).tickets = 1; const r = R.invocar(s, () => 0.5, d0 + 30 * dia);
  assert.ok(r.ok && r.gratis); assert.equal(R.expDe(s).tickets, 1); assert.equal(R.invocacoesGratisDe(s, d0 + 30 * dia).saldo, 99);
  assert.ok(R.invocacoesGratisDe(s, d0 + 30 * dia).proximaEmMs > 0);
});
