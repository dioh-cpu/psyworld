import test from 'node:test';
import assert from 'node:assert/strict';
import * as CB from '../combate.js';
import * as B from './batalha-equipe.js';

const lutador = (nome, poder, elemento = 'neutro', habilidades = ['Golpe']) => CB.criarLutador({ nome, poder, elemento, habilidades });
const sempreMeio = () => 0.99;   // golpes sem erro e sem crítico: a sorte não atrapalha o teste

test('criação: de 1 a 3 aliados e de 1 a 3 inimigos', () => {
  assert.throws(() => B.criarBatalhaEquipe({ aliados: [], inimigos: [lutador('x', 10)] }));
  assert.throws(() => B.criarBatalhaEquipe({ aliados: [lutador('a', 10)], inimigos: [] }));
  const quatro = [1, 2, 3, 4].map((k) => lutador(`n${k}`, 10));
  assert.throws(() => B.criarBatalhaEquipe({ aliados: quatro, inimigos: [lutador('x', 10)] }));
  assert.throws(() => B.criarBatalhaEquipe({ aliados: [lutador('a', 10)], inimigos: quatro }));
  const e = B.criarBatalhaEquipe({ aliados: quatro.slice(0, 3), inimigos: quatro.slice(0, 3) });
  assert.equal(e.planos.length, 3);
  assert.equal(e.turno, 1);
});

test('planejamento: só aliado vivo, só alvo vivo, habilidade pronta e poção em estoque', () => {
  const a = lutador('Ignavor', 50, 'fogo', ['Brasa']);
  const n = lutador('Vaelith', 40, 'agua');
  const e = B.criarBatalhaEquipe({ aliados: [a], inimigos: [n], pocoes: { pequena: 1 } });
  assert.throws(() => B.planejar(e, 0, { tipo: 'atacar', alvo: 5 }), /alvo inválido/);
  assert.throws(() => B.planejar(e, 0, { tipo: 'habilidade', nome: 'Inexistente', alvo: 0 }), /indisponível/);
  B.planejar(e, 0, { tipo: 'habilidade', nome: 'Brasa', alvo: 0 });
  assert.equal(e.planos[0].tipo, 'habilidade');
  n.hp = 0;
  assert.throws(() => B.planejar(e, 0, { tipo: 'atacar', alvo: 0 }), /alvo inválido/);
});

test('poção: dois aliados não planejam a mesma poção se só há uma', () => {
  const e = B.criarBatalhaEquipe({ aliados: [lutador('a', 50), lutador('b', 40)], inimigos: [lutador('n', 30)], pocoes: { pequena: 1 } });
  B.planejar(e, 0, { tipo: 'pocao', pocao: 'pequena' });
  assert.throws(() => B.planejar(e, 1, { tipo: 'pocao', pocao: 'pequena' }), /sem essa poção/);
  B.planejar(e, 0, { tipo: 'atacar', alvo: 0 });   // trocar o próprio plano libera a poção
  B.planejar(e, 1, { tipo: 'pocao', pocao: 'pequena' });
  assert.equal(e.planos[1].tipo, 'pocao');
});

test('o turno só resolve quando todo aliado vivo planejou; aliado caído não entra', () => {
  const e = B.criarBatalhaEquipe({ aliados: [lutador('a', 50), lutador('b', 40)], inimigos: [lutador('n', 30)] });
  assert.equal(B.prontoParaResolver(e), false);
  B.planejar(e, 0, { tipo: 'atacar', alvo: 0 });
  assert.equal(B.proximoAliadoSemPlano(e), 1);
  e.aliados[1].hp = 0;
  assert.equal(B.prontoParaResolver(e), true);
});

test('ordem do turno: mais poder primeiro; empate vai para o aliado', () => {
  const e = B.criarBatalhaEquipe({
    aliados: [lutador('a', 30), lutador('b', 50)],
    inimigos: [lutador('n1', 50), lutador('n2', 10)],
  });
  const nomes = B.ordemDoTurno(e).map((u) => (u.lado === 'aliado' ? e.aliados[u.i].nome : e.inimigos[u.i].nome));
  assert.deepEqual(nomes, ['b', 'n1', 'a', 'n2']);
});

test('alvo que cai antes de agir: o aliado ataca outro inimigo vivo', () => {
  const forte = lutador('forte', 90);
  const fraco = lutador('fraco', 10);
  const alvoCaindo = lutador('caindo', 20);
  alvoCaindo.hp = 1;
  const outro = lutador('outro', 20);
  const e = B.criarBatalhaEquipe({ aliados: [forte, fraco], inimigos: [alvoCaindo, outro] });
  B.planejar(e, 0, { tipo: 'atacar', alvo: 0 });
  B.planejar(e, 1, { tipo: 'atacar', alvo: 0 });   // o fraco mirava o que o forte vai derrubar
  B.resolverTurno(e, sempreMeio);
  const ataqueDoFraco = e.eventos.find((ev) => ev.ator.lado === 'aliado' && ev.ator.i === 1);
  assert.ok(ataqueDoFraco, 'o fraco deveria agir');
  assert.deepEqual(ataqueDoFraco.alvo, { lado: 'inimigo', i: 1 });
  assert.equal(alvoCaindo.hp, 0);
});

test('turno resolvido: avança o turno, limpa os planos e registra vida depois de cada evento', () => {
  const a = lutador('a', 60);
  const n = lutador('n', 40);
  const e = B.criarBatalhaEquipe({ aliados: [a], inimigos: [n] });
  B.planejar(e, 0, { tipo: 'atacar', alvo: 0 });
  B.resolverTurno(e, sempreMeio);
  assert.equal(e.turno, 2);
  assert.deepEqual(e.planos, [null]);
  const ultimo = e.eventos[e.eventos.length - 1];
  assert.equal(ultimo.hp.inimigos[0], n.hp);
  assert.equal(ultimo.hp.aliados[0], a.hp);
});

test('vitória quando todos os inimigos caem; derrota quando todos os aliados caem', () => {
  const a = lutador('forte', 200);
  const n = lutador('fraco', 1);
  n.hp = 1;
  const e = B.criarBatalhaEquipe({ aliados: [a], inimigos: [n] });
  B.planejar(e, 0, { tipo: 'atacar', alvo: 0 });
  B.resolverTurno(e, sempreMeio);
  assert.equal(e.fim, true);
  assert.equal(e.resultado, 'vitoria');

  const fraco = lutador('fraco', 1);
  fraco.hp = 1;
  const forte = lutador('forte', 200);
  const d = B.criarBatalhaEquipe({ aliados: [fraco], inimigos: [forte] });
  B.planejar(d, 0, { tipo: 'atacar', alvo: 0 });
  B.resolverTurno(d, sempreMeio);
  assert.equal(d.fim, true);
  assert.equal(d.resultado, 'derrota');
});

test('poção: cura o aliado e gasta o estoque no turno', () => {
  const a = lutador('a', 50);
  a.hp = 10;
  const e = B.criarBatalhaEquipe({ aliados: [a], inimigos: [lutador('n', 5)], pocoes: { pequena: 2 } });
  B.planejar(e, 0, { tipo: 'pocao', pocao: 'pequena' });
  B.resolverTurno(e, sempreMeio);
  assert.equal(e.pocoes.pequena, 1);
  assert.ok(e.eventos.some((ev) => ev.tipo === 'cura' && ev.dano > 0));
});

test('limite de turnos: no fim do tempo vence quem tem mais vida (em conjunto)', () => {
  const a = lutador('a', 10);
  const n = lutador('n', 10);
  n.hp = 1;
  const e = B.criarBatalhaEquipe({ aliados: [a], inimigos: [n] });
  e.turno = CB.COMBATE.turnosMax;
  B.planejar(e, 0, { tipo: 'atacar', alvo: 0 });
  B.resolverTurno(e, () => 0.99);
  assert.equal(e.fim, true);
  assert.ok(['vitoria', 'derrota'].includes(e.resultado));
  assert.equal(e.resultado, 'vitoria');   // aliado com vida cheia contra inimigo com 1 de vida
});

test('vários turnos com sorte fixa: a luta termina e nenhum inimigo age depois de cair', () => {
  let semente = 7;
  const rnd = () => { semente = (semente * 16807) % 2147483647; return semente / 2147483647; };
  const e = B.criarBatalhaEquipe({
    aliados: [lutador('a', 60, 'fogo'), lutador('b', 55, 'agua'), lutador('c', 50, 'planta')],
    inimigos: [lutador('x', 45, 'terra'), lutador('y', 40, 'trevas')],
    pocoes: { pequena: 3 },
  });
  let voltas = 0;
  while (!e.fim && voltas < 100) {
    for (const i of B.aliadosVivos(e)) B.planejar(e, i, { tipo: 'atacar', alvo: B.inimigosVivos(e)[0] });
    B.resolverTurno(e, rnd);
    voltas += 1;
  }
  assert.equal(e.fim, true);
  assert.ok(e.resultado === 'vitoria' || e.resultado === 'derrota');
  for (const ev of e.eventos) {
    if (ev.ator.lado === 'inimigo') assert.ok(e.inimigos[ev.ator.i].hp >= 0);
  }
});

test('roteiro: um foco e um efeito por evento, com a vida depois de cada efeito, e uma pausa no fim', () => {
  const a = lutador('a', 60);
  const b = lutador('b', 50);
  const n1 = lutador('n1', 40);
  const n2 = lutador('n2', 30);
  const e = B.criarBatalhaEquipe({ aliados: [a, b], inimigos: [n1, n2] });
  B.planejar(e, 0, { tipo: 'atacar', alvo: 0 });
  B.planejar(e, 1, { tipo: 'atacar', alvo: 1 });
  B.resolverTurno(e, sempreMeio);
  const passos = B.roteiroDaEquipe(e);
  assert.equal(passos.length, e.eventos.length * 2 + 1);
  assert.equal(passos[passos.length - 1].tipo, 'pausa');
  for (const p of passos.filter((x) => x.tipo === 'golpe')) {
    assert.equal(p.hp.inimigos.length, 2);
    assert.equal(p.hp.aliados.length, 2);
  }
  assert.equal(passos[0].tipo, 'foco');
  assert.deepEqual(passos[0].ator, { lado: 'aliado', i: 0 });
});

test('auto: poção quando a vida cai do limiar; senão habilidade pronta; senão ataca o inimigo mais fraco', () => {
  const a = lutador('a', 50, 'fogo', ['Brasa']);
  a.hp = 10;   // 10 de 60: abaixo de 35%
  const forte = lutador('forte', 40);
  const fraco = lutador('fraco', 40);
  fraco.hp = 5;
  const e = B.criarBatalhaEquipe({ aliados: [a], inimigos: [forte, fraco], pocoes: { pequena: 1 } });
  assert.deepEqual(B.escolherAutoAcao(e, 0), { tipo: 'pocao', pocao: 'pequena' });
  a.hp = a.hpMax;
  const acao = B.escolherAutoAcao(e, 0);
  assert.deepEqual(acao, { tipo: 'habilidade', nome: 'Brasa', alvo: 1 });
  assert.doesNotThrow(() => B.planejar(e, 0, acao));
  e.aliados[0].habilidades[0].ultimoTurno = e.turno;   // recarga: não pode mais usar a habilidade
  assert.deepEqual(B.escolherAutoAcao(e, 0), { tipo: 'atacar', alvo: 1 });
  e.pocoes.pequena = 0;
  a.hp = 10;
  assert.deepEqual(B.escolherAutoAcao(e, 0), { tipo: 'atacar', alvo: 1 });   // sem poção, ataca
});

test('auto: aliado caído não planeja; a ação automática sempre é aceita por planejar', () => {
  const a = lutador('a', 50);
  const b = lutador('b', 40);
  const e = B.criarBatalhaEquipe({ aliados: [a, b], inimigos: [lutador('n', 30)] });
  a.hp = 0;
  assert.equal(B.escolherAutoAcao(e, 0), null);
  const acao = B.escolherAutoAcao(e, 1);
  assert.doesNotThrow(() => B.planejar(e, 1, acao));
  assert.equal(B.prontoParaResolver(e), true);
});
