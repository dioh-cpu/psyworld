import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../core.js';
import * as CB from '../combate.js';
import * as Y from '../systems.js';
import {
  timeInicial, sortearSelvagem, lutadorDo, opcoesDeAcao, aplicarResultado, recompensaDaBatalha, itensDoEspolio,
} from './batalha.js';

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
    const rnd = C.mulberry32(s);
    const { monstro, raridade } = sortearSelvagem(rnd);
    assert.ok(Y.BASE_SPECIES.includes(monstro.species));
    assert.ok(raridade >= 1 && raridade <= 4);
    assert.equal(monstro.tier, raridade + 2);
    assert.equal(monstro.level, 10 + 2 * raridade);
  }
});

test('ações: atacar sempre; uma por habilidade; poção só com estoque', () => {
  const m = timeInicial()[0];
  const combate = CB.criarCombate(lutadorDo(m), lutadorDo(timeInicial()[1]), { pequena: 2, media: 0, grande: 0 });
  const opcoes = opcoesDeAcao(combate, m);
  assert.equal(opcoes[0].id, 'atacar');
  assert.ok(opcoes[0].ativa);
  assert.equal(opcoes.filter((o) => o.id === 'habilidade').length, 4);
  const pocao = opcoes.at(-1);
  assert.equal(pocao.id, 'pocao');
  assert.ok(pocao.ativa);
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
