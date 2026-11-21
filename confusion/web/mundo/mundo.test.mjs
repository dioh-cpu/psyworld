import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './index.js';
import * as S1 from './sistemas-01.js';
import * as S11 from './sistemas-11.js';

const rng = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const ctx = (over = {}) => ({
  dia: 1, r: rng(42), sanidade: 60, ponteFechada: false,
  recursos: { madeira: 100, pedra: 100, cristal: 20, comida: 50, peca: 20, sementes: 20, raizes: 20 },
  diamantes: 200, monstros: [{ id: 'm1', species: 'Noctarn', classe: 'comum' }, { id: 'm2', species: 'Ignavor', classe: 'comum' }],
  ...over,
});
const sis = (id) => M.SISTEMAS.find((s) => s.id === id);

test('mundo: 50 sistemas, ids 01 a 50, cada um com nome e referência', () => {
  assert.equal(M.SISTEMAS.length, 50);
  assert.deepEqual(M.SISTEMAS.map((s) => s.id), Array.from({ length: 50 }, (_, i) => String(i + 1).padStart(2, '0')));
  for (const s of M.SISTEMAS) {
    assert.ok(s.nome && s.referencia, s.id);
    assert.equal(typeof s.criar, 'function');
    assert.equal(typeof s.dia, 'function');
    assert.equal(typeof s.resumo, 'function');
  }
});
test('mundo: 120 dias rodam sem erro, sem NaN, e o estado é serializável', () => {
  const est = M.criarMundo();
  const r = rng(7);
  for (let d = 1; d <= 120; d++) {
    const res = M.diaMundo(est, ctx({ dia: d, r, ponteFechada: d >= 4 && d <= 7 }));
    assert.ok(Array.isArray(res.notas));
    for (const v of Object.values(res.efeitos.recursos || {})) assert.ok(Number.isFinite(v));
    for (const k of ['sanidade', 'diamantes']) if (k in res.efeitos) assert.ok(Number.isFinite(res.efeitos[k]));
  }
  assert.ok(JSON.stringify(est).length > 100);
  assert.ok(M.resumoMundo(est).length === 50);
});
test('mundo: cada ação de cada sistema responde com notas e efeitos', () => {
  for (const s of M.SISTEMAS) {
    for (const [acao] of Object.entries(s.acoes || {})) {
      const est = M.criarMundo();
      const opcoes = M.OPCOES_ACAO[`${s.id}.${acao}`];
      const args = opcoes ? (opcoes(est)[0]?.args || {}) : {};
      if (`${s.id}.${acao}` === '14.responder') { M.acaoMundo(est, '14', 'sonhar', {}, ctx()); args.opcao = 0; }
      const res = M.acaoMundo(est, s.id, acao, args, ctx());
      assert.ok(Array.isArray(res.notas) && res.notas.length > 0, `${s.id}.${acao}`);
    }
  }
});

// Comportamento específico, um por sistema.
test('01 cidades: reconstruir precisa de recursos e devolve prosperidade', () => {
  const est = M.criarMundo();
  assert.match(M.acaoMundo(est, '01', 'reconstruir', {}, ctx({ recursos: {} })).notas[0], /Faltam/);
  const r = M.acaoMundo(est, '01', 'reconstruir', {}, ctx());
  assert.deepEqual(r.efeitos.recursos, { madeira: -30, pedra: -30 });
});
test('02 ecossistema: caçar reduz a população e rende peça', () => {
  const est = M.criarMundo();
  const antes = Object.values(est['02'].populacao).reduce((a, b) => a + b, 0);
  const r = M.acaoMundo(est, '02', 'cacar', {}, ctx());
  assert.equal(r.efeitos.recursos.peca, 1);
  assert.equal(Object.values(est['02'].populacao).reduce((a, b) => a + b, 0), antes - 1);
});
test('02 ecossistema: uma população não se extingue sozinha em 120 dias', () => {
  const est = M.criarMundo();
  const r = rng(99);
  for (let d = 1; d <= 120; d++) M.diaMundo(est, ctx({ dia: d, r }));
  for (const e of Object.keys(est['02'].populacao)) assert.ok(est['02'].populacao[e] >= 1, e);
});
test('03 facções: ajudar uma facção sobe a reputação e derruba a rival', () => {
  const est = M.criarMundo();
  M.acaoMundo(est, '03', 'ajudar_guardioes', {}, ctx());
  assert.equal(est['03'].guardioes, 15);
  assert.equal(est['03'].culto, -5);
});
test('04 NPCs: conversar só na fase certa; a fase muda a cada dia', () => {
  assert.equal(S1.faseDo(1), 'manha');
  assert.equal(S1.faseDo(3), 'noite');
  const est = M.criarMundo();
  assert.match(M.acaoMundo(est, '04', 'conversar_teo', {}, ctx({ dia: 1 })).notas[0], /não está disponível/);
  M.acaoMundo(est, '04', 'conversar_ana', {}, ctx({ dia: 1 }));
  assert.equal(est['04'].ana.confianca, 6);
});
test('05 refúgios: construir precisa de recursos e reduz a praga', () => {
  const est = M.criarMundo();
  assert.match(M.acaoMundo(est, '05', 'construir', {}, ctx({ recursos: {} })).notas[0], /Faltam/);
  M.acaoMundo(est, '05', 'construir', {}, ctx());
  assert.equal(S1.protecaoContraPragas(est['05']), 0.2);
});
test('06 personalidade: o temperamento é sempre o mesmo para o mesmo monstro', () => {
  assert.equal(S1.temperamentoDe('m1'), S1.temperamentoDe('m1'));
  assert.ok(S1.TEMPERAMENTOS.includes(S1.temperamentoDe('m2')));
  const est = M.criarMundo();
  M.acaoMundo(est, '06', 'cuidar', {}, ctx());
  assert.ok(Object.values(est['06'].monstros).some((m) => m.vinculo === 10));
});
test('07 clima: estações seguem o calendário e o inverno vira neve', () => {
  assert.equal(S1.estacaoDo(1), 'primavera');
  assert.equal(S1.estacaoDo(22), 'inverno');
  assert.equal(S1.modificadorColheita('sol'), 1.2);
  assert.equal(S1.modificadorColheita('tempestade'), 0.6);
});
test('08 masmorras: purificar reduz a infestação', () => {
  const est = M.criarMundo();
  const antes = Object.values(est['08']).reduce((a, m) => a + m.infestacao, 0);
  M.acaoMundo(est, '08', 'purificar', {}, ctx());
  assert.ok(Object.values(est['08']).reduce((a, m) => a + m.infestacao, 0) < antes);
});
test('09 investigação: com sanidade alta e sorte, pistas levam ao caso resolvido', () => {
  const est = M.criarMundo();
  for (let i = 0; i < 10; i++) M.acaoMundo(est, '09', 'investigar', {}, ctx({ sanidade: 100, r: () => 0 }));
  assert.equal(est['09'].caso.resolvido, true);
  assert.equal(est['09'].caso.encontradas, 3);
});
test('10 economia: vender madeira rende gold e tira a madeira', () => {
  const est = M.criarMundo();
  const r = M.acaoMundo(est, '10', 'vender_madeira', {}, ctx());
  assert.equal(r.efeitos.recursos.madeira, -5);
  assert.ok(r.efeitos.gold > 0);
});
test('11 chefes: derrotar tira o chefe do vivo; purificar pede sanidade 50', () => {
  const est = M.criarMundo();
  assert.match(M.acaoMundo(est, '11', 'purificar', {}, ctx({ sanidade: 20 })).notas[0], /Precisa de sanidade/);
  M.acaoMundo(est, '11', 'derrotar', {}, ctx());
  assert.equal(est['11'].chefes.guardiao_nevoa, 'derrotado');
  assert.equal(M.acaoMundo(est, '11', 'derrotar', {}, ctx()).efeitos.diamantes, 15);
});
test('12 herança: os traços herdados vêm dos pais e são no máximo 2', () => {
  const t = S11.herdarTracos(['asas', 'garras'], ['escamas'], 0.3);
  assert.ok(t.length >= 1 && t.length <= 2);
  for (const x of t) assert.ok(['asas', 'garras', 'escamas'].includes(x));
  assert.equal(S11.familiaPorSanidade(30), 'natural ou mutante');
  assert.equal(S11.familiaPorSanidade(50), 'natural');
});
test('13 subterrâneo: descer só depois que a entrada for revelada', () => {
  const est = M.criarMundo();
  assert.match(M.acaoMundo(est, '13', 'descer', {}, ctx()).notas[0], /Nenhuma entrada/);
  est['13'].entradas.rio_subterraneo = true;
  assert.equal(M.acaoMundo(est, '13', 'descer', {}, ctx()).efeitos.recursos.cristal, 1);
});
test('14 sonhos: responder certo dá sanidade; errado tira', () => {
  const est = M.criarMundo();
  M.acaoMundo(est, '14', 'sonhar', {}, ctx({ r: () => 0 }));
  const correta = est['14'].sonho.correta;
  assert.equal(M.acaoMundo(est, '14', 'responder', { opcao: correta }, ctx()).efeitos.sanidade, 4);
  M.acaoMundo(est, '14', 'sonhar', {}, ctx({ r: () => 0 }));
  const errada = (est['14'].sonho.correta + 1) % 3;
  assert.equal(M.acaoMundo(est, '14', 'responder', { opcao: errada }, ctx()).efeitos.sanidade, -3);
});
test('15 pragas: tratar pede raízes e reduz o nível', () => {
  const est = M.criarMundo();
  est['15'] = { nivel: 40, ativa: true };
  assert.match(M.acaoMundo(est, '15', 'tratar', {}, ctx({ recursos: {} })).notas[0], /Faltam/);
  M.acaoMundo(est, '15', 'tratar', {}, ctx());
  assert.equal(est['15'].ativa, false);
});
test('16 espionagem: disfarce alto e sorte dão informação; sem disfarce, falha', () => {
  const est = M.criarMundo();
  assert.match(M.acaoMundo(est, '16', 'infiltrar', {}, ctx()).notas[0], /Sem disfarce/);
  M.acaoMundo(est, '16', 'disfarcar', {}, ctx());
  assert.equal(M.acaoMundo(est, '16', 'infiltrar', {}, ctx({ r: () => 0 })).efeitos.diamantes, 5);
});
test('17 guardiões: desafiar com sorte vence e rende cristal', () => {
  const est = M.criarMundo();
  assert.equal(M.acaoMundo(est, '17', 'desafiar', {}, ctx({ r: () => 0 })).efeitos.recursos.cristal, 2);
});
test('18 ilhas: navegar precisa de barco e maré baixa', () => {
  const est = M.criarMundo();
  assert.match(M.acaoMundo(est, '18', 'navegar', {}, ctx()).notas[0], /barco/);
  M.acaoMundo(est, '18', 'construir_barco', {}, ctx());
  est['18'].mare = 'alta';
  assert.match(M.acaoMundo(est, '18', 'navegar', {}, ctx()).notas[0], /maré/);
  est['18'].mare = 'baixa';
  assert.equal(M.acaoMundo(est, '18', 'navegar', {}, ctx()).efeitos.diamantes, 3);
});
test('19 arqueologia: restaurar só com 3 fragmentos', () => {
  const est = M.criarMundo();
  assert.match(M.acaoMundo(est, '19', 'restaurar', {}, ctx()).notas[0], /Faltam/);
  est['19'].fragmentos = 3;
  assert.equal(M.acaoMundo(est, '19', 'restaurar', {}, ctx()).efeitos.diamantes, 20);
});
test('20 profissões: 6 práticas dão nível 2 e o bônus diário', () => {
  const est = M.criarMundo();
  for (let i = 0; i < 6; i++) M.acaoMundo(est, '20', 'praticar', { profissao: 'cozinheiro' }, ctx());
  assert.equal(S11.familiaPorSanidade(0) !== undefined, true);
  const dia = M.diaMundo(est, ctx());
  assert.equal(dia.efeitos.recursos.comida, 1);
});
test('21 crimes: provar inocência sem testemunhas costuma funcionar', () => {
  const est = M.criarMundo();
  est['21'].testemunhas = 0;
  est['21'].procurado = 40;
  M.acaoMundo(est, '21', 'provar_inocencia', {}, ctx({ r: () => 0 }));
  assert.equal(est['21'].procurado, 10);
});
test('22 companheiro: conversar com Mira aumenta a afinidade', () => {
  const est = M.criarMundo();
  M.acaoMundo(est, '22', 'conversar', {}, ctx());
  assert.equal(est['22'].mira.afinidade, 18);
});
test('23 portais: atravessar precisa da relíquia e do dia certo', () => {
  const est = M.criarMundo();
  assert.match(M.acaoMundo(est, '23', 'atravessar', {}, ctx({ dia: 3 })).notas[0], /relíquia/);
  est['19'].estado = 'restaurada';
  assert.match(M.acaoMundo(est, '23', 'atravessar', {}, ctx({ dia: 4 })).notas[0], /fechado/);
  est['19'].estado = 'restaurada';
  assert.equal(M.acaoMundo(est, '23', 'atravessar', {}, ctx({ dia: 3 })).efeitos.diamantes, 8);
});
test('24 cicatrizes: superar pede sanidade 40 e tira o peso', () => {
  const est = M.criarMundo();
  est['24'].cicatrizes = [{ origem: 'trauma da vila', dias: 0, superada: false }];
  assert.match(M.acaoMundo(est, '24', 'superar', {}, ctx({ sanidade: 10 })).notas[0], /forte/);
  assert.equal(M.acaoMundo(est, '24', 'superar', {}, ctx({ sanidade: 60 })).efeitos.sanidade, 5);
});
test('24 cicatrizes: a cicatriz se fecha sozinha após 10 dias (sanidade baixa não trava a cura)', () => {
  const est = M.criarMundo();
  est['24'].cicatrizes = [{ origem: 'trauma da vila', dias: 0, superada: false }];
  let notas = [];
  for (let d = 1; d <= 10; d++) notas = notas.concat(M.diaMundo(est, ctx({ dia: d, sanidade: 10 })).notas);
  assert.equal(est['24'].cicatrizes[0].superada, true);
  assert.ok(notas.some((n) => n.includes('se fechou')));
});
test('17 desafiar: derrota deixa cicatriz no sistema 24', () => {
  const est = M.criarMundo();
  M.acaoMundo(est, '17', 'desafiar', {}, ctx({ r: () => 0.99 }));
  assert.equal(est['24'].cicatrizes.length, 1);
  assert.match(est['24'].cicatrizes[0].origem, /derrota/);
});
test('25 guerras: facções opostas entram em guerra; mediar encerra', () => {
  const est = M.criarMundo();
  est['03'] = { guardioes: 50, culto: -50, guilda: 0 };
  M.diaMundo(est, ctx());
  assert.equal(est['25'].guerra, true);
  M.acaoMundo(est, '25', 'mediar', {}, ctx());
  assert.equal(est['25'].guerra, false);
});
test('25 guerras: o aviso do cerco descreve o efeito real (sanidade), não queda de prosperidade', () => {
  const est = M.criarMundo();
  est['03'] = { guardioes: 50, culto: -50, guilda: 0 };
  const notas = [];
  for (let d = 1; d <= 6; d++) notas.push(...M.diaMundo(est, ctx({ dia: d })).notas);
  const aviso = notas.find((n) => n.includes('cerco chegou'));
  assert.ok(aviso, 'o cerco deve avisar no quinto dia');
  assert.ok(aviso.includes('sanidade'));
  assert.ok(!aviso.includes('prosperidade'));
});
test('mundo: os 50 sistemas rodam 60 dias e todas as ações executam sem erro (com os argumentos da interface)', () => {
  const est = M.criarMundo();
  for (let d = 1; d <= 60; d++) M.diaMundo(est, ctx({ dia: d, ponteFechada: d >= 4 && d <= 7 }));
  for (const s of M.SISTEMAS) {
    for (const acao of Object.keys(s.acoes || {})) {
      const opcoes = M.OPCOES_ACAO[`${s.id}.${acao}`];
      const lista = opcoes ? opcoes(est) : [];
      const args = lista.length ? lista[0].args : {};
      assert.doesNotThrow(() => M.acaoMundo(est, s.id, acao, args, ctx()), `${s.id}.${acao}`);
    }
    assert.equal(typeof s.resumo(est[s.id]), 'string', `${s.id} sem resumo`);
  }
});
test('26 adaptações: treinar para no nível 3', () => {
  const est = M.criarMundo();
  for (let i = 0; i < 5; i++) M.acaoMundo(est, '26', 'treinar_bioma', {}, ctx());
  assert.equal(est['26'].niveis.m1, 3);
});
test('27 eventos históricos: provocar um evento entra no registro', () => {
  const est = M.criarMundo();
  M.acaoMundo(est, '27', 'provocar_evento', { evento: 'fundacao' }, ctx({ dia: 5 }));
  assert.equal(est['27'].registro.length, 1);
  assert.equal(est['27'].registro[0].dia, 5);
});
test('28 mistérios coletivos: juntar pede 4 pistas', () => {
  const est = M.criarMundo();
  assert.match(M.acaoMundo(est, '28', 'juntar_pistas', {}, ctx()).notas[0], /Faltam pistas/);
  est['28'].pistas = ['a', 'b', 'c', 'd'];
  assert.equal(M.acaoMundo(est, '28', 'juntar_pistas', {}, ctx()).efeitos.diamantes, 15);
});
test('29 memória: árvores crescem com o tempo e o monumento pede pedra', () => {
  const est = M.criarMundo();
  M.acaoMundo(est, '29', 'plantar_arvore', {}, ctx());
  for (let d = 1; d <= 9; d++) M.diaMundo(est, ctx({ dia: d }));
  assert.equal(est['29'].arvores[0].stage, 3);
  assert.match(M.acaoMundo(est, '29', 'erguer_monumento', {}, ctx({ recursos: {} })).notas[0], /Faltam/);
});
test('30 gigantes: a criatura migra a cada 4 dias', () => {
  const est = M.criarMundo();
  for (let d = 1; d <= 4; d++) M.diaMundo(est, ctx({ dia: d }));
  assert.equal(est['30'].regiao, 'sul');
});
test('31 fundação: fundar gasta recursos e para em 2 cidades', () => {
  const est = M.criarMundo();
  M.acaoMundo(est, '31', 'fundar', {}, ctx());
  M.acaoMundo(est, '31', 'fundar', {}, ctx());
  assert.match(M.acaoMundo(est, '31', 'fundar', {}, ctx()).notas[0], /demais/);
  assert.equal(est['31'].fundadas.length, 2);
});
test('32 equipamentos: purificar a espada muda a pureza para luz', () => {
  const est = M.criarMundo();
  M.acaoMundo(est, '32', 'purificar', {}, ctx());
  assert.equal(est['32'].espada.pureza, 'luz');
  assert.equal(est['32'].espada.bonus, 3);
});
test('33 magias: o vórtice custa sanidade e, na 3ª vez, deixa marca', () => {
  const est = M.criarMundo();
  for (let i = 0; i < 3; i++) M.acaoMundo(est, '33', 'vortice_negro', {}, ctx());
  assert.equal(est['33'].marca, true);
  assert.equal(M.diaMundo(est, ctx()).efeitos.sanidade, -1);
});
test('34 contratos: assinar dá diamantes; cumprir pede cristal; prazo vencido quebra', () => {
  const est = M.criarMundo();
  assert.equal(M.acaoMundo(est, '34', 'assinar_forca', {}, ctx({ dia: 1 })).efeitos.diamantes, 30);
  M.acaoMundo(est, '34', 'cumprir', {}, ctx({ dia: 2 }));
  assert.equal(est['34'].atual.cumprido, true);
  const est2 = M.criarMundo();
  M.acaoMundo(est2, '34', 'assinar_forca', {}, ctx({ dia: 1 }));
  assert.equal(M.diaMundo(est2, ctx({ dia: 11 })).efeitos.sanidade, -10);
});
test('35 autômatos: montar pede peças e vira guardião', () => {
  const est = M.criarMundo();
  assert.match(M.acaoMundo(est, '35', 'montar', {}, ctx({ recursos: {} })).notas[0], /Faltam/);
  M.acaoMundo(est, '35', 'montar', {}, ctx());
  assert.equal(est['35'].guardioes, 1);
});
test('36 montarias: domar terrestre pede comida; aérea pede relíquia', () => {
  const est = M.criarMundo();
  assert.match(M.acaoMundo(est, '36', 'domar_aerea', {}, ctx()).notas[0], /relíquia/);
  assert.equal(M.acaoMundo(est, '36', 'domar_terrestre', {}, ctx()).efeitos.recursos.comida, -5);
});
test('37 caçadores: caçar com sorte cumpre o contrato e paga', () => {
  const est = M.criarMundo();
  M.diaMundo(est, ctx({ dia: 4, r: () => 0 }));
  assert.ok(est['37'].contratos.length >= 1);
  assert.ok(M.acaoMundo(est, '37', 'cacar', {}, ctx({ r: () => 0 })).efeitos.diamantes > 0);
});
test('38 festivais: no sétimo dia há festa com sanidade e diamantes', () => {
  const est = M.criarMundo();
  const res = M.diaMundo(est, ctx({ dia: 7 }));
  assert.equal(res.efeitos.sanidade, 3);
  assert.equal(est['38'].festivaisVistos, 1);
});
test('39 idiomas: estudar ensina e traduzir precisa de 50%', () => {
  const est = M.criarMundo();
  assert.match(M.acaoMundo(est, '39', 'traduzir', {}, ctx()).notas[0], /entende/);
  for (let i = 0; i < 5; i++) M.acaoMundo(est, '39', 'estudar', {}, ctx());
  assert.equal(M.acaoMundo(est, '39', 'traduzir', {}, ctx()).efeitos.diamantes, 5);
});
test('40 mineração: escavar desce de camada e rende pedra na rasa', () => {
  const est = M.criarMundo();
  const r = M.acaoMundo(est, '40', 'escavar', {}, ctx());
  assert.equal(r.efeitos.recursos.pedra, 3);
  assert.equal(est['40'].camada, 1);
});
test('41 simbiose: um vínculo de simbiose dá comida por dia', () => {
  const est = M.criarMundo();
  M.acaoMundo(est, '41', 'associar_simbiose', {}, ctx());
  assert.equal(M.diaMundo(est, ctx()).efeitos.recursos.comida, 1);
});
test('42 labirintos: cinco passos saem do labirinto e a linha principal segue', () => {
  const est = M.criarMundo();
  M.acaoMundo(est, '42', 'entrar', {}, ctx());
  let r;
  for (let i = 0; i < 5; i++) r = M.acaoMundo(est, '42', 'avancar', {}, ctx());
  assert.equal(est['42'].instancia, null);
  assert.equal(est['42'].concluidos, 1);
  assert.ok(r.notas.some((n) => n.includes('linha do tempo')));
});
test('43 reputação lendária: reputação alta vira título com diamantes', () => {
  const est = M.criarMundo();
  est['03'] = { guardioes: 60, culto: 0, guilda: 0 };
  const res = M.diaMundo(est, ctx());
  assert.ok(est['43'].titulos.includes('guardiao'));
  assert.ok(res.efeitos.diamantes >= 5);
});
test('44 arenas: vencer subindo de divisão a cada 3 vitórias', () => {
  const est = M.criarMundo();
  for (let i = 0; i < 3; i++) M.acaoMundo(est, '44', 'duelar', {}, ctx({ r: () => 0 }));
  assert.equal(est['44'].divisao, 1);
});
test('45 expedições: Ana volta depois de 3 dias com recursos', () => {
  const est = M.criarMundo();
  M.acaoMundo(est, '45', 'enviar', {}, ctx());
  let voltou = null;
  for (let d = 1; d <= 3; d++) {
    const r = M.diaMundo(est, ctx({ dia: d }));
    if (r.efeitos.recursos) voltou = r;
  }
  assert.ok(voltou, 'expedição deveria ter voltado');
  assert.equal(est['45'].em.length, 0);
});
test('46 astronomia: observatório com o ciclo do dia 12 rende sementes', () => {
  const est = M.criarMundo();
  est['46'].observatorio = true;
  const r = M.diaMundo(est, ctx({ dia: 12 }));
  assert.equal(r.efeitos.recursos.sementes, 1);
});
test('47 santuários: com eventos históricos e sorte, surge um eco', () => {
  const est = M.criarMundo();
  est['27'].registro = [{ dia: 1, texto: 'x' }];
  const r = M.diaMundo(est, ctx({ dia: 5, r: () => 0 }));
  assert.equal(est['47'].ecos, 1);
  assert.ok(r.efeitos.sanidade >= 1);
});
test('48 engenharia: um canal dá comida todos os dias', () => {
  const est = M.criarMundo();
  M.acaoMundo(est, '48', 'construir_canal', {}, ctx());
  assert.equal(M.diaMundo(est, ctx()).efeitos.recursos.comida, 1);
});
test('49 criaturas que aprendem: 5 treinos viram especialização que dá bônus', () => {
  const est = M.criarMundo();
  for (let i = 0; i < 5; i++) M.acaoMundo(est, '49', 'treinar', {}, ctx());
  const st = est['49'].monstros.m1;
  assert.ok(st.especializacao, 'deveria ter se especializado');
  assert.ok(M.diaMundo(est, ctx()).efeitos !== undefined);
});
test('50 evolução do mundo: os marcos chegam em 30, 60 e 90 e são irreversíveis', () => {
  const est = M.criarMundo();
  const marcos = [];
  for (let d = 1; d <= 90; d++) marcos.push(...M.diaMundo(est, ctx({ dia: d })).notas.filter((n) => n.includes('marco')));
  assert.equal(est['50'].marcos, 3);
  assert.equal(marcos.length, 3);
});

// Jogabilidade: correções de travamento (ver commit de ajustes do mundo).
test('15 pragas: com refúgios a praga ainda pode aparecer (piso de 2%)', () => {
  const est = M.criarMundo();
  sis('15').dia(est['15'], ctx({ r: () => 0.01, protecaoPragas: 0.6 }));
  assert.equal(est['15'].ativa, true);
});
test('31 cidades: sem comida, os moradores partem; com estoque, a população cresce', () => {
  const fome = M.criarMundo();
  fome['31'].fundadas = [{ nome: 'A', populacao: 20 }];
  const r1 = sis('31').dia(fome['31'], ctx({ recursos: { comida: 0 }, r: () => 0.99 }));
  assert.equal(fome['31'].fundadas[0].populacao, 19);
  assert.ok(r1.notas.some((n) => n.includes('Falta comida')));
  const fartura = M.criarMundo();
  fartura['31'].fundadas = [{ nome: 'A', populacao: 5 }];
  sis('31').dia(fartura['31'], ctx({ recursos: { comida: 100 }, r: () => 0.1 }));
  assert.equal(fartura['31'].fundadas[0].populacao, 6);
});
test('35 autômatos: com desgaste 80 ou mais, param de produzir pedra', () => {
  const est = M.criarMundo();
  est['35'] = { guardioes: 1, desgaste: 80 };
  const res = sis('35').dia(est['35'], ctx());
  assert.equal(res.efeitos.recursos, undefined);
});
test('13 civilizações: a ponte fechada revela uma entrada até o último dia fechado', () => {
  const est = M.criarMundo();
  sis('13').dia(est['13'], ctx({ ponteFechada: true, dia: 7, r: () => 0.99 }));
  assert.equal(Object.values(est['13'].entradas).filter(Boolean).length, 1);
});
test('01 cidades: a corrupção recua quando a sanidade está estável', () => {
  const est = M.criarMundo();
  est['01'].norte.corrupcao = 10;
  sis('01').dia(est['01'], ctx({ sanidade: 60, r: () => 0.5 }));
  assert.equal(est['01'].norte.corrupcao, 9);
});
test('jogabilidade: um jogador prudente (sem ações de risco com sanidade abaixo de 40) mantém sanidade e vilas vivas em 90 dias', () => {
  const RISCO = new Set(['33.vortice_negro', '32.corromper', '34.assinar_forca', '17.desafiar', '27.provocar_evento', '16.infiltrar', '11.corromper']);
  const est = M.criarMundo();
  const r = rng(7);
  let sanidade = 60;
  const jogo = { recursos: { madeira: 300, pedra: 300, cristal: 30, comida: 200, peca: 20, sementes: 20, raizes: 20 }, diamantes: 100, gold: 500, monstros: [{ id: 'm1', species: 'Noctarn', classe: 'comum' }] };
  const aplicar = (res) => {
    const e = res.efeitos || {};
    if (e.sanidade) sanidade = Math.max(0, Math.min(100, sanidade + e.sanidade));
    for (const [k, v] of Object.entries(e.recursos || {})) jogo.recursos[k] = Math.max(0, (jogo.recursos[k] || 0) + v);
    if (e.diamantes) jogo.diamantes = Math.max(0, jogo.diamantes + e.diamantes);
    if (e.gold) jogo.gold = Math.max(0, jogo.gold + e.gold);
  };
  let sanMin = 100;
  for (let d = 1; d <= 90; d++) {
    const c = () => ({ r, dia: d, sanidade, recursos: jogo.recursos, diamantes: jogo.diamantes, gold: jogo.gold, monstros: jogo.monstros, ponteFechada: d >= 4 && d <= 7 });
    aplicar(M.diaMundo(est, c()));
    for (const s of M.SISTEMAS) for (const acao of Object.keys(s.acoes || {})) {
      if (sanidade < 40 && RISCO.has(`${s.id}.${acao}`)) continue;
      const op = M.OPCOES_ACAO[`${s.id}.${acao}`];
      for (const o of (op ? op(est) : [{ args: {} }])) aplicar(M.acaoMundo(est, s.id, acao, o.args || {}, c()));
    }
    sanMin = Math.min(sanMin, sanidade);
  }
  assert.ok(sanMin > 0, `a sanidade chegou a zero (mínimo ${sanMin})`);
  for (const id of ['norte', 'sul', 'porto']) assert.ok(est['01'][id].prosperidade > 0, `${id} sem prosperidade`);
});
test('31 surto: morte por fome pode levantar zumbis e marca o surto como arma biológica', () => {
  const est = M.criarMundo();
  est['31'].fundadas = [{ nome: 'A', populacao: 20, zumbis: 0 }];
  const res = sis('31').dia(est['31'], ctx({ recursos: { comida: 0 }, r: () => 0.1 }));
  assert.equal(est['31'].fundadas[0].zumbis, 1);
  assert.equal(est['31'].surto, true);
  assert.ok(res.notas.some((n) => n.includes('arma biológica')));
});
test('31 surto: zumbis transformam moradores, impedem o crescimento e podem ser contidos', () => {
  const est = M.criarMundo();
  est['31'].surto = true;
  est['31'].fundadas = [{ nome: 'A', populacao: 10, zumbis: 3 }];
  sis('31').dia(est['31'], ctx({ recursos: { comida: 100 }, r: () => 0.05 }));
  const c = est['31'].fundadas[0];
  assert.ok(c.populacao < 10, 'zumbis deveriam transformar moradores');
  assert.ok(c.zumbis > 3, 'os convertidos viram zumbis');
  const antes = c.zumbis;
  M.acaoMundo(est, '31', 'conter_surto', {}, ctx({ recursos: { madeira: 100 } }));
  assert.equal(est['31'].fundadas[0].zumbis, antes - 3);
});
test('31 água: sem água, os moradores morrem mesmo com comida de sobra', () => {
  const est = M.criarMundo();
  est['31'].fundadas = [{ nome: 'A', populacao: 20, zumbis: 0 }];
  const res = sis('31').dia(est['31'], ctx({ recursos: { comida: 100, agua: 0 }, r: () => 0.99 }));
  assert.equal(est['31'].fundadas[0].populacao, 19);
  assert.ok(res.notas.some((n) => n.includes('Falta água')));
});
test('31 purificar: só no caminho do herói, e os zumbis voltam a ser moradores', () => {
  const est = M.criarMundo();
  est['31'].fundadas = [{ nome: 'A', populacao: 5, zumbis: 4 }];
  est['31'].surto = true;
  assert.match(M.acaoMundo(est, '31', 'purificar_cidade', {}, ctx({ caminho: 'vilao', recursos: { pedra: 50, agua: 50 } })).notas[0], /herói/);
  assert.equal(est['31'].fundadas[0].zumbis, 4);
  const res = M.acaoMundo(est, '31', 'purificar_cidade', {}, ctx({ caminho: 'heroi', recursos: { pedra: 50, agua: 50 } }));
  assert.equal(est['31'].fundadas[0].zumbis, 0);
  assert.equal(est['31'].fundadas[0].populacao, 9);
  assert.deepEqual(res.efeitos.recursos, { pedra: -15, agua: -10 });
});
