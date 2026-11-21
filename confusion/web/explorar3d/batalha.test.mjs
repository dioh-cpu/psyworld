import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../core.js';
import * as CB from '../combate.js';
import * as Y from '../systems.js';
import {
  timeInicial, sortearSelvagem, lutadorDo, opcoesDeAcao, aplicarResultado, recompensaDaBatalha, itensDoEspolio,
  criarMonstro, definirSlot, habilidadesDisponiveis, giroDoMonstro, nomeDaVariante, eventosDoTurno, hpAposEventos, roteiroDoTurno,
} from './batalha.js';
import * as V from '../variacoes.js';

test('time inicial: os três monstrinhos da linha base, com habilidades e poder', () => {
  const time = timeInicial();
  assert.deepEqual(time.map((m) => m.species), ['Noctarn', 'Ignavor', 'Vaelith']);
  for (const m of time) {
    assert.equal(m.abilities.length, 4);
    assert.ok(C.monsterPower(m) > 0);
  }
  // cada chamada devolve um time novo: uma luta não mexe no time da próxima
  timeInicial()[0].xp = 999;
  assert.equal(timeInicial()[0].xp, C.xpDoNivel(12));
});

test('selvagem: espécie da lista de encontros, raridade de 1 a 4, tier e nível crescem com ela', () => {
  for (let s = 1; s <= 200; s++) {
    const { monstro, raridade } = sortearSelvagem(C.mulberry32(s));
    assert.ok(Y.BASE_SPECIES.includes(monstro.species));
    assert.ok(raridade >= 1 && raridade <= 4);
    assert.equal(monstro.tier, raridade + 2);
    assert.equal(monstro.level, 10 + 2 * raridade);
  }
});

test('selvagem: a variação sai da regra da exploração, em qualquer espécie inicial e elemento que não seja o natural', () => {
  const vistas = new Set();
  let comVariacao = 0;
  for (let s = 1; s <= 1500; s++) {
    const { monstro } = sortearSelvagem(C.mulberry32(s));
    if (monstro.variante) {
      comVariacao += 1;
      assert.notEqual(monstro.variante, V.elementoNatural(monstro.species));
      assert.equal(monstro.elemento, monstro.variante);
      vistas.add(monstro.species);
    }
  }
  assert.ok(comVariacao > 0 && comVariacao < 1500);
  assert.ok(vistas.size >= 2, 'variações deveriam sair em mais de uma espécie');
});

test('variação: troca elemento, giro de cor e habilidades; o natural não tem giro', () => {
  const laranja = criarMonstro({ id: 'a', species: 'Ignavor', tier: 3, level: 12 });
  const azul = criarMonstro({ id: 'b', species: 'Ignavor', tier: 3, level: 12, variante: 'agua' });
  assert.equal(laranja.elemento, 'fogo');
  assert.equal(azul.elemento, 'agua');
  assert.equal(giroDoMonstro(laranja), null);
  assert.equal(giroDoMonstro(azul).matiz, 195);
  assert.equal(habilidadesDisponiveis(azul).length, 5);
  assert.deepEqual(azul.abilities, V.HABILIDADES_DO_ELEMENTO.agua.slice(0, 4));
  assert.equal(nomeDaVariante(azul), 'Onírico azul');
});

test('slots: colocar uma habilidade livre no slot a substitui; uma que já está em outro slot troca de lugar com ela', () => {
  const m = timeInicial()[0];
  const fora = habilidadesDisponiveis(m).find((h) => !m.abilities.includes(h));
  definirSlot(m, 0, fora);
  assert.equal(m.abilities[0], fora);
  assert.equal(m.abilities.length, 4);
  assert.equal(new Set(m.abilities).size, 4);
  // a do slot 2 vai para o slot 4 e a do slot 4 vai para o slot 2
  const antes2 = m.abilities[1];
  const antes4 = m.abilities[3];
  definirSlot(m, 3, antes2);
  assert.equal(m.abilities[3], antes2);
  assert.equal(m.abilities[1], antes4);
  assert.equal(new Set(m.abilities).size, 4);
});

test('slots: slot fora de 1 a 4 e habilidade de outra espécie são recusados', () => {
  const m = timeInicial()[0];
  assert.throws(() => definirSlot(m, 4, habilidadesDisponiveis(m)[0]), /slot/);
  assert.throws(() => definirSlot(m, 0, 'Chama Solar'), /não disponível/);
});

test('ações: atacar sempre; uma por slot, numerada de 1 a 4; poção só com estoque', () => {
  const m = timeInicial()[0];
  const combate = CB.criarCombate(lutadorDo(m), lutadorDo(timeInicial()[1]), { pequena: 2, media: 0, grande: 0 });
  const opcoes = opcoesDeAcao(combate, m);
  assert.equal(opcoes[0].id, 'atacar');
  assert.ok(opcoes[0].ativa);
  const slots = opcoes.filter((o) => o.id === 'habilidade');
  assert.equal(slots.length, 4);
  assert.deepEqual(slots.map((o) => o.icone), ['1', '2', '3', '4']);
  const pocao = opcoes.at(-1);
  assert.equal(pocao.id, 'pocao');
  assert.deepEqual(pocao.acao, { tipo: 'pocao', pocao: 'pequena' });

  const semPocao = CB.criarCombate(lutadorDo(m), lutadorDo(timeInicial()[1]), { pequena: 0, media: 0, grande: 0 });
  const sem = opcoesDeAcao(semPocao, m).at(-1);
  assert.equal(sem.ativa, false);
  assert.equal(sem.acao, null);
});

test('ações: habilidade usada no turno fica indisponível no seguinte (recarga)', () => {
  const m = timeInicial()[0];
  const combate = CB.criarCombate(lutadorDo(m), lutadorDo(timeInicial()[1]), { pequena: 0, media: 0, grande: 0 });
  const nome = combate.jog.habilidades[0].nome;
  CB.agir(combate, { tipo: 'habilidade', nome }, C.mulberry32(3));
  const depois = opcoesDeAcao(combate, m).find((o) => o.rotulo === nome);
  assert.equal(depois.ativa, false);
});

test('resultado: vitória dá XP e pode subir de nível; derrota nunca desce abaixo do nível atual', () => {
  const vitoria = timeInicial()[0];
  const r = aplicarResultado(vitoria, true);
  assert.equal(r.xp, C.XP_FONTE.batalhaVitoria);
  assert.equal(vitoria.xp, C.xpDoNivel(12) + C.XP_FONTE.batalhaVitoria);

  const derrota = timeInicial()[0];
  derrota.xp = C.xpDoNivel(12) + 40; // 40 acima do começo do nível: a derrota tira 25 e ainda fica no nível 12
  const antes = derrota.xp;
  const d = aplicarResultado(derrota, false);
  assert.equal(d.xp, -C.XP_FONTE.batalhaDerrota);
  assert.equal(derrota.xp, antes - C.XP_FONTE.batalhaDerrota);
  assert.equal(derrota.level, 12);

  const pisado = timeInicial()[0];
  pisado.xp = C.xpDoNivel(12); // no começo do nível: a derrota não pode fazê-lo cair
  aplicarResultado(pisado, false);
  assert.equal(pisado.level, 12);
  assert.equal(pisado.xp, C.xpDoNivel(12));
});

test('recompensa: derrota não paga nada; vitória paga 5 x raridade em gold', () => {
  assert.deepEqual(recompensaDaBatalha({ vitoria: false, raridade: 3, rnd: () => 0 }), { gold: 0, pocao: 0 });
  const r = recompensaDaBatalha({ vitoria: true, raridade: 3, rnd: () => 0 });
  assert.equal(r.gold, Y.goldEncontro(3));
  assert.equal(r.pocao, 1);
  assert.equal(recompensaDaBatalha({ vitoria: true, raridade: 3, rnd: () => 0.99 }).pocao, 0);
});

test('espólio: derrota não tem linhas; vitória tem XP, gold e a poção, com as quantidades certas', () => {
  assert.deepEqual(itensDoEspolio({ vitoria: false, nomeMonstro: 'Noctarn', xp: 0, gold: 0, pocao: 0 }), []);
  const itens = itensDoEspolio({ vitoria: true, nomeMonstro: 'Noctarn', xp: 50, gold: 10, pocao: 1 });
  assert.deepEqual(itens.map((i) => [i.nome, i.qtd]), [['XP de Noctarn', 50], ['Gold', 10], ['Poção pequena', 1]]);
});

test('eventos: a primeira ação do log é do jogador, a segunda do inimigo; linhas de fim são ignoradas', () => {
  const ev = eventosDoTurno([
    'Noctarn atacou: 4 de dano.',
    'Vaelith usou Pulso Astral, mas errou.',
    'Noctarn venceu.',
  ]);
  assert.deepEqual(ev, [
    { tipo: 'dano', quem: 'jogador', alvo: 'inimigo', habilidade: false, dano: 4, critico: false },
    { tipo: 'erro', quem: 'inimigo', alvo: 'jogador', habilidade: true, dano: 0, critico: false },
  ]);
  assert.deepEqual(eventosDoTurno(['Noctarn venceu.', 'Tempo esgotado: Noctarn 50% x 40%.']), []);
});

test('eventos: poção cura o próprio jogador; crítico e habilidade são reconhecidos', () => {
  const ev = eventosDoTurno(['Noctarn usou Poção pequena (+18 de vida).', 'Vaelith atacou: 6 de dano (crítico!).']);
  assert.deepEqual(ev[0], { tipo: 'cura', quem: 'jogador', alvo: 'jogador', dano: 18 });
  assert.equal(ev[1].critico, true);
  assert.equal(ev[1].quem, 'inimigo');
  const h = eventosDoTurno(['Noctarn usou Mordida Umbral: 7 de dano.']);
  assert.equal(h[0].habilidade, true);
});

test('vida: cada golpe tira do alvo, a poção devolve até o máximo, e nada fica negativo', () => {
  const eventos = [
    { tipo: 'dano', quem: 'jogador', alvo: 'inimigo', dano: 10 },
    { tipo: 'dano', quem: 'inimigo', alvo: 'jogador', dano: 5 },
    { tipo: 'cura', quem: 'jogador', alvo: 'jogador', dano: 30 },
    { tipo: 'dano', quem: 'jogador', alvo: 'inimigo', dano: 99 },
  ];
  const vida = hpAposEventos({ j: 60, i: 60 }, eventos, 60);
  assert.deepEqual(vida, [{ j: 60, i: 50 }, { j: 55, i: 50 }, { j: 60, i: 50 }, { j: 60, i: 0 }]);
});

test('roteiro: o foco vem antes de cada golpe; o último passo mostra a vida depois do golpe', () => {
  const eventos = eventosDoTurno(['Noctarn atacou: 10 de dano.', 'Vaelith atacou: 5 de dano.']);
  const passos = roteiroDoTurno({ eventos, hpInicio: { j: 60, i: 60 }, resultado: null });
  assert.deepEqual(passos.map((p) => p.tipo), ['foco', 'golpe', 'foco', 'golpe', 'pausa']);
  assert.equal(passos[3].hp.j, 55);
  assert.equal(passos[1].alvo, 'inimigo');
  assert.ok(passos.every((p) => p.dur > 0));
});

test('roteiro: com resultado, termina com a tela de fim; o foco segue quem age', () => {
  const eventos = eventosDoTurno(['Noctarn atacou: 60 de dano.']);
  const passos = roteiroDoTurno({ eventos, hpInicio: { j: 60, i: 60 }, resultado: 'vitoria' });
  assert.equal(passos.at(-1).tipo, 'fim');
  assert.equal(passos.at(-1).resultado, 'vitoria');
  assert.equal(passos[0].lado, 'jogador');
});

test('equilíbrio: o time inicial vence a maioria dos selvagens quando a luta é automática, mas não todas', () => {
  let vitorias = 0;
  const n = 200;
  for (let s = 1; s <= n; s++) {
    const rnd = C.mulberry32(s * 7919 + 13);
    const time = timeInicial();
    const { monstro } = sortearSelvagem(rnd);
    const combate = CB.criarCombate(lutadorDo(time[s % 3]), lutadorDo(monstro), { pequena: 3, media: 1, grande: 0 });
    while (!combate.fim) {
      CB.agir(combate, CB.escolherAuto(combate, { limiarPocao: 0.35, pocoes: ['pequena', 'media', 'grande'], habilidades: [] }), rnd);
    }
    if (combate.resultado === 'vitoria') vitorias += 1;
  }
  const taxa = vitorias / n;
  assert.ok(taxa > 0.5 && taxa < 0.95, `taxa de vitória ${taxa}`);
});
