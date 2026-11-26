import test from 'node:test';
import assert from 'node:assert/strict';
import { criarEstadoInicial, serializarEstado, desserializarEstado } from './regiao1-estado.js';
import {
  PASSE_CFG, cotaDia, edicaoDe, cotaLiberada, nivelPasse, premioNivel,
  passeDe, ganharXpPasse, resgatarPasse, comprarNivelPasse, infoPasse,
} from './regiao1-passe-regras.js';
import { garantirEstadoIdle, resolverAbateAuto, calcularGanhoOffline, aplicarGanhoOffline, resgatarDiaria, chocarPrimeiroOvo } from './regiao1-idle.js';
import { darXpCampanha, iniciarCalabouco, avancarSala, resolverLutaCalabouco, aceitarContrato, entregarContrato, fabEstado, concluirMissaoHV, acaoCrise } from './regiao1-exp-regras.js';
import { vencerAndar } from './regiao1-halloween-regras.js';

const dia = (ano, mes1, d) => new Date(ano, mes1 - 1, d, 12, 0, 0);

test('Passe: primeira edição Dinossauros, 100 níveis de 1.000 XP e cota ajustada ao tamanho do mês', () => {
  const nov = edicaoDe(dia(2026, 11, 1)); // 30 dias (antes de 2026-12 usa a 1ª edição)
  const dez = edicaoDe(dia(2026, 12, 1)); // 31 dias
  const fev = edicaoDe(dia(2027, 2, 1));  // 28 dias
  const bis = edicaoDe(dia(2028, 2, 1));  // 29 dias
  assert.equal(nov.tema.nome, 'Dinossauros');
  assert.equal(dez.tema.nome, 'Dinossauros');
  assert.equal(cotaDia(30), 3600);
  assert.equal(cotaDia(31), 3500);
  assert.equal(cotaDia(28), 3900);
  assert.equal(cotaDia(29), 3800);
  // Todos concluem nos últimos dias (diasNoMes - 2)
  assert.equal(nivelPasse(cotaLiberada(edicaoDe(dia(2026, 11, 27)))), 97);
  assert.equal(nivelPasse(cotaLiberada(edicaoDe(dia(2026, 11, 28)))), 100);
  assert.equal(nivelPasse(cotaLiberada(edicaoDe(dia(2026, 12, 29)))), 100);
  assert.equal(nivelPasse(cotaLiberada(edicaoDe(dia(2027, 2, 26)))), 100);
  assert.equal(nivelPasse(cotaLiberada(edicaoDe(dia(2028, 2, 27)))), 100);
});

test('Passe: prêmios em todos os 100 níveis (ovos T1–T4, tickets, diamantes, molduras, acessórios, Casa, montarias e T5 no 100)', () => {
  const tipos = new Set();
  const tiersOvo = new Set();
  for (let n = 1; n <= 100; n++) {
    const p = premioNivel(n);
    assert.ok(p && p.texto, `nível ${n} sem prêmio`);
    tipos.add(p.tipo);
    if (p.tipo === 'ovo') tiersOvo.add(p.tier);
  }
  for (const esperado of ['ovo', 'tickets', 'diamantes', 'moldura', 'acessorio', 'casa', 'montaria', 'ovoT5']) {
    assert.ok(tipos.has(esperado), `faltou tipo ${esperado}`);
  }
  assert.deepEqual([...tiersOvo].sort(), [1, 2, 3, 4]);
  assert.equal(premioNivel(100).tier, 5);
});

test('Passe: compra por 150 diamantes respeita o teto do calendário e infoPasse expõe prêmio, preço e abertura', () => {
  const s = criarEstadoInicial();
  const d1 = dia(2026, 11, 1); // cota liberada no dia 1 = 3.600 XP (até Nv.3; Nv.4 pede 4.000 XP -> abre dia 2)
  garantirEstadoIdle(s, d1.getTime());
  s.recompensas.diamantes = 1000;

  assert.equal(comprarNivelPasse(s, d1).nivel, 1);
  assert.equal(comprarNivelPasse(s, d1).nivel, 2);
  assert.equal(comprarNivelPasse(s, d1).nivel, 3);
  assert.equal(s.recompensas.diamantes, 1000 - 3 * 150);

  const bloq = comprarNivelPasse(s, d1);
  assert.equal(bloq.ok, false);
  assert.match(bloq.motivo, /dia 2/);

  const inf = infoPasse(s, d1);
  assert.equal(inf.proximo.nivel, 4);
  assert.equal(inf.proximo.preco, 150);
  assert.equal(inf.proximo.liberado, false);
  assert.equal(inf.proximo.dia, 2);
  assert.ok(inf.proximo.premio.texto.length > 0);
  assert.equal(inf.proximaFaixa.ate, 25);
  assert.equal(inf.proximaFaixa.dia, 7);
});

test('Passe: ovo temático T5 do nível 100 é pago uma única vez, mesmo recarregando o save', () => {
  const s = criarEstadoInicial();
  const d28 = dia(2026, 11, 28);
  garantirEstadoIdle(s, d28.getTime());
  ganharXpPasse(s, 'manual', 100000, d28);
  assert.equal(nivelPasse(s.idle.passe.xp), 100);

  const r1 = resgatarPasse(s, d28);
  const ovosT5 = () => s.idle.mochila.ovos.filter((o) => o.tier === 5);
  assert.equal(r1.pagos.filter((p) => p.tipo === 'ovoT5').length, 1);
  assert.equal(ovosT5().length, 1);

  // Segundo clique não duplica
  assert.equal(resgatarPasse(s, d28).pagos.length, 0);
  assert.equal(ovosT5().length, 1);

  // Recarregando via serializar/desserializar e até forçando resgatado < 100: t5Pagos impede novo T5
  const s2 = desserializarEstado(serializarEstado(s));
  s2.idle.passe.resgatado = 99;
  const r2 = resgatarPasse(s2, d28);
  assert.equal(r2.pagos.filter((p) => p.tipo === 'ovoT5').length, 0);
  assert.equal(s2.idle.mochila.ovos.filter((o) => o.tier === 5).length, 1);

  // Mesmo depois que o Passe de Dinossauros termina (mês seguinte), o ovo guarda a temporada e nasce T5 Nv.1 do elenco jurássico
  const mesSeguinte = dia(2027, 1, 5);
  garantirEstadoIdle(s2, mesSeguinte.getTime()); // vira a edição do Passe
  s2.idle.mochila.ovos = s2.idle.mochila.ovos.filter((o) => o.tier === 5);
  assert.equal(s2.idle.mochila.ovos[0].nome, 'Ovo de Dinossauro T5');
  assert.equal(s2.idle.mochila.ovos[0].temporada, '2026-11');
  const chocado = chocarPrimeiroOvo(s2, () => 0.3);
  assert.equal(chocado.ok, true);
  const nascido = s2.idle.equipe.at(-1);
  assert.ok(PASSE_CFG.temas[0].elencoT5.includes(nascido.especie));
  assert.equal(nascido.tier, 5);
  assert.equal(nascido.raridade, 5);
  assert.equal(nascido.nivel, 1);
  assert.equal(nascido.temporada, '2026-11');
  assert.equal(nascido.tema, 'dinossauros');
});

test('Passe: todos os modos avançam o Passe e o teto sazonal não trava ouro/XP/farm normal', () => {
  const s = criarEstadoInicial();
  const hoje = new Date();
  const d10 = new Date(hoje.getFullYear(), hoje.getMonth(), Math.max(10, hoje.getDate()), 12, 0, 0);
  const idle = garantirEstadoIdle(s, d10.getTime());

  // Auto-Caça, Campanha, Offline, Diária, Torre, Calabouço, Contrato, Crise, HV
  let antes = idle.passe.xp;
  resolverAbateAuto(s, { especie: 'Brotavel', nivel: 5 }, () => 0.9, d10.getTime());
  assert.ok(idle.passe.xp > antes); antes = idle.passe.xp;

  darXpCampanha(idle, { nivel: 5, chefe: false, vitoria: true }, d10);
  assert.ok(idle.passe.xp > antes); antes = idle.passe.xp;

  idle.ultimoTickMs = d10.getTime() - 60 * 60000;
  aplicarGanhoOffline(s, calcularGanhoOffline(s, 6, d10.getTime()), 'Noctarn', d10.getTime());
  assert.ok(idle.passe.xp > antes); antes = idle.passe.xp;

  idle.diarias.itens[0].progresso = idle.diarias.itens[0].meta;
  resgatarDiaria(s, idle.diarias.itens[0].id, d10.getTime());
  assert.ok(idle.passe.xp > antes); antes = idle.passe.xp;

  vencerAndar(s, 1, 1, () => 0.9, d10);
  assert.ok(idle.passe.xp > antes); antes = idle.passe.xp;

  s.quests = { q_boss_e: 'concluida' };
  iniciarCalabouco(s);
  avancarSala(s); resolverLutaCalabouco(s, { vitoria: true, hpFinal: 0.9 });
  assert.ok(idle.passe.xp > antes); antes = idle.passe.xp;

  const fab = fabEstado(s); fab.materiais.fibra = 20; fab.materiais.cristal = 20;
  aceitarContrato(s, 'g1', d10); entregarContrato(s, 'g1', d10);
  assert.ok(idle.passe.xp > antes); antes = idle.passe.xp;

  fab.gestao = { itens: { tonico: 5 } };
  acaoCrise(s, 'surto', Math.random, d10.getTime());
  acaoCrise(s, 'conter', Math.random, d10.getTime());
  assert.ok(idle.passe.xp > antes); antes = idle.passe.xp;

  concluirMissaoHV(s, 'cap1', 1);
  assert.ok(idle.passe.xp > antes);

  // Ao bater na cota do dia 1, o ouro e o XP normal continuam subindo normalmente
  const sTeto = criarEstadoInicial();
  const d1 = dia(2026, 11, 1);
  garantirEstadoIdle(sTeto, d1.getTime());
  ganharXpPasse(sTeto, 'manual', 5000, d1);
  assert.equal(sTeto.idle.passe.xp, 3600);
  const goldAntes = sTeto.recompensas.gold, xpAntes = sTeto.idle.jogador.xp;
  resolverAbateAuto(sTeto, { especie: 'Brotavel', nivel: 6 }, () => 0.9, d1.getTime());
  assert.equal(sTeto.idle.passe.xp, 3600); // XP excedente de Passe descartado
  assert.ok(sTeto.recompensas.gold > goldAntes && sTeto.idle.jogador.xp > xpAntes); // farm normal intacto
});

test('Simulação de 30 dias com três perfis (~900 XP/h): 4h/dia, maratona no início e retorno após pausa', () => {
  const simular = (horasPorDia) => {
    const s = criarEstadoInicial();
    const snap = {};
    for (let d = 1; d <= 30; d++) {
      const data = dia(2026, 11, d);
      garantirEstadoIdle(s, data.getTime());
      const h = horasPorDia(d);
      if (h > 0) ganharXpPasse(s, 'sessao', Math.round(h * PASSE_CFG.xpHoraAlvo), data);
      snap[d] = { nv: nivelPasse(s.idle.passe.xp), xp: s.idle.passe.xp, desc: s.idle.passe.descartado, rec: infoPasse(s, data).recuperavel };
    }
    return snap;
  };

  // Perfil 1: 4h diárias regulares (3.600 XP/dia) -> referência 25 / 50 / 75 / 100 nos dias 7 / 14 / 21 / 28
  const regular = simular(() => 4);
  assert.equal(regular[7].nv, 25);
  assert.equal(regular[14].nv, 50);
  assert.equal(regular[21].nv, 75);
  assert.equal(regular[27].nv, 97);
  assert.equal(regular[28].nv, 100);
  assert.equal(regular[30].nv, 100);

  // Perfil 2: concentra 12h/dia nos dias 1–5 e 4h/dia depois -> travado pela cota diária no começo, fecha no dia 28
  const intensoInicio = simular((d) => (d <= 5 ? 12 : 4));
  assert.equal(intensoInicio[1].nv, 3); // 3.600 XP liberados no dia 1 (7.200 descartados)
  assert.equal(intensoInicio[5].nv, 18); // 18.000 XP liberados até o dia 5
  assert.ok(intensoInicio[5].desc > 30000);
  assert.equal(intensoInicio[7].nv, 25);
  assert.equal(intensoInicio[28].nv, 100);

  // Perfil 3: joga nos dias 1–3 (4h), fica fora 5 dias (dias 4–8 = 0h), volta fazendo 8h/dia nos dias 9–13 e depois 4h/dia
  const retorno = simular((d) => (d >= 4 && d <= 8 ? 0 : d >= 9 && d <= 13 ? 8 : 4));
  assert.equal(retorno[8].nv, 10);            // parado em 10.800 XP durante a ausência
  assert.equal(retorno[8].rec, 18000);        // 5 dias de cota guardados para recuperação (5 × 3.600)
  assert.equal(retorno[13].rec, 0);           // em 5 dias de 8h alcançou 100% do ritmo da temporada
  assert.equal(retorno[14].nv, 50);           // de volta à referência no dia 14
  assert.equal(retorno[21].nv, 75);
  assert.equal(retorno[28].nv, 100);
});
