import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from './core.js';
import * as Y from './systems.js';
import * as E from './species.js';

const base = { tier: 3, aptitudes: {}, variant: 'natural', classe: 'comum', level: 1 };

test('elementos: ciclo fogo > planta > água > fogo, dano 2x e 0,5x (como no Pokémon)', () => {
  assert.equal(C.multElemento('fogo', 'planta'), 2);
  assert.equal(C.multElemento('planta', 'agua'), 2);   // planta forte contra água
  assert.equal(C.multElemento('agua', 'fogo'), 2);     // água forte contra fogo
  assert.equal(C.multElemento('agua', 'planta'), 0.5); // água dá menos dano em planta
  assert.equal(C.multElemento('fogo', 'agua'), 0);   // fogo não causa dano em água
  assert.equal(C.multElemento('planta', 'fogo'), 0.5);
  assert.equal(C.multElemento('luz', 'trevas'), 2);
  assert.equal(C.multElemento('trevas', 'luz'), 2);
  // noturno e diurno: 2x contra si mesmos, e nunca levam desvantagem contra os outros elementos
  assert.equal(C.multElemento('trevas', 'trevas'), 2);
  assert.equal(C.multElemento('luz', 'luz'), 2);
  for (const alvo of ['fogo', 'agua', 'planta', 'terra', 'neutro']) {
    assert.ok(C.multElemento('trevas', alvo) >= 1, `trevas contra ${alvo}`);
    assert.ok(C.multElemento('luz', alvo) >= 1, `luz contra ${alvo}`);
  }
  assert.equal(C.multElemento('terra', 'agua'), 1);    // terra e neutro: 1x
  assert.equal(C.multElemento('neutro', 'fogo'), 1);
  assert.equal(C.multElemento(undefined, 'fogo'), 1);  // sem elemento, 1x
});

test('elementos: o andar infinito gira em ciclo de 5 elementos', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(C.elementoDoAndar), ['fogo', 'agua', 'planta', 'luz', 'trevas', 'fogo']);
});

test('elementos: no andar infinito, vantagem muda a chance de vencer', () => {
  const agua = { ...base, elemento: 'agua' };
  const contraAgua = C.endlessChance({ ...agua, elemento: 'planta' }, 2); // andar 2 é água
  const fraco = C.endlessChance({ ...agua, elemento: 'fogo' }, 2);
  assert.ok(contraAgua > fraco);
  // mesmo elemento que o andar: água contra água é pouco efetivo (0,5x), menos chance que sem elemento
  assert.ok(C.endlessChance({ ...agua, elemento: 'agua' }, 2) < C.endlessChance({ ...agua, elemento: undefined }, 2));
  // fogo contra fogo é dano normal: a mesma chance de um monstrinho sem elemento contra o andar de fogo
  assert.equal(C.multElemento('fogo', 'fogo'), 1);
});

test('elementos: na caçada de raid, o elemento do monstrinho entra na chance', () => {
  const serpe = Y.RAID_BOSSES.find((b) => b.id === 'serpe_abismo'); // trevas, poder 150
  const titan = Y.RAID_BOSSES.find((b) => b.id === 'titan_cinza');   // fogo, poder 120
  const forte = { ...base, tier: 5 };                                // poder 50
  assert.ok(Math.abs(Y.chanceRaid({ ...forte, elemento: 'luz' }, serpe) - 100 / 150) < 1e-9);  // luz contra trevas: 2x
  assert.ok(Math.abs(Y.chanceRaid({ ...forte, elemento: 'fogo' }, serpe) - 50 / 150) < 1e-9);  // sem relação: 1x
  assert.ok(Math.abs(Y.chanceRaid({ ...forte, elemento: 'agua' }, titan) - 100 / 120) < 1e-9); // água contra fogo: 2x
  assert.ok(Math.abs(Y.chanceRaid({ ...forte, elemento: 'planta' }, titan) - 25 / 120) < 1e-9); // planta contra fogo: 0,5x
});

test('elementos: o bot de luta também sente o elemento (multiplicador sobre a chance)', () => {
  assert.equal(C.winChance(0, 1, 2), 0.95);          // 0,7 x 2 passa do teto
  assert.ok(Math.abs(C.winChance(0, 1, 0.5) - 0.35) < 1e-9);
  assert.equal(C.winChance(0, 1), 0.7);              // padrão sem elemento
});

test('elementos: cada espécie tem um elemento válido', () => {
  for (const [nome, el] of Object.entries(E.ELEMENTO_DA_ESPECIE)) {
    assert.ok(C.ELEMENTOS.includes(el), `${nome}: ${el}`);
  }
  assert.equal(E.ELEMENTO_DA_ESPECIE.Ignavor, 'fogo');
  assert.equal(E.ELEMENTO_DA_ESPECIE.Noctarn, 'trevas');
  assert.equal(E.ELEMENTO_DA_ESPECIE.Cristalino, 'neutro');
});

test('passe: custo do nível k = 30 + 6k e acumulado = soma (3k² + 33k)', () => {
  let soma = 0;
  for (let k = 1; k <= Y.PASS_LEVELS; k++) {
    soma += Y.passCustoNivel(k);
    assert.equal(Y.passXpAteNivel(k), soma, `nível ${k}`);
  }
  assert.equal(Y.passXpAteNivel(Y.PASS_LEVELS), 3690);
});

test('passe: perfis de XP no mês (casual, ativo e intenso) chegam a níveis diferentes', () => {
  const mes = (f) => f.dias * Y.PASS_XP.dia + f.andares * Y.PASS_XP.andar + f.capturas * Y.passXpCaptura(1.7)
    + f.breeds * Y.PASS_XP.breed + f.batalha * Y.PASS_XP.batalha;
  const casual = Y.passLevel(mes({ dias: 30, andares: 5, capturas: 20, breeds: 5, batalha: 0 }));
  const ativo = Y.passLevel(mes({ dias: 30, andares: 20, capturas: 60, breeds: 20, batalha: 1 }));
  const intenso = Y.passLevel(mes({ dias: 30, andares: 40, capturas: 120, breeds: 40, batalha: 1 }));
  assert.ok(casual < ativo && ativo < intenso);
  assert.equal(intenso, Y.PASS_LEVELS);
});

test('regras da ilha: normal, lutador, psíquico, elétrico e fogo sem dano contra os alvos combinados', () => {
  assert.equal(C.multElemento('neutro', 'fantasma'), 0);   // normal não dá dano em fantasma
  assert.equal(C.multElemento('lutador', 'fantasma'), 0);  // lutador não dá dano em fantasma
  assert.equal(C.multElemento('psiquico', 'trevas'), 0);   // psíquico não dá dano em noturno
  assert.equal(C.multElemento('eletrico', 'pedra'), 0);    // elétrico não dá dano em pedra
  assert.equal(C.multElemento('fogo', 'agua'), 0);         // fogo não dá dano em água
  assert.equal(C.multElemento('fogo', 'fogo'), 1);         // fogo leva dano de fogo (normal)
});

test('noturno e diurno: 2x contra si mesmos e nenhuma desvantagem contra os outros elementos', () => {
  for (const especial of ['trevas', 'luz']) {
    assert.equal(C.multElemento(especial, especial), 2);
    for (const outro of C.ELEMENTOS.filter((e) => e !== 'trevas' && e !== 'luz')) {
      // o que o especial causa nunca é menos que 1
      assert.ok(C.multElemento(especial, outro) >= 1, `${especial} contra ${outro}`);
      // e o que os outros causam no especial nunca passa de 1 (sem fraqueza)
      assert.ok(C.multElemento(outro, especial) <= 1, `${outro} contra ${especial}`);
    }
  }
});

test('elementos: são 19 (os tipos do Pokémon com trevas como noturno e luz como diurno), e todos têm nome', () => {
  assert.equal(C.ELEMENTOS.length, 19);
  for (const e of C.ELEMENTOS) assert.ok(C.NOME_ELEMENTO[e], e);
  assert.equal(C.NOME_ELEMENTO.trevas, 'Noturno');
  assert.equal(C.NOME_ELEMENTO.luz, 'Diurno');
  assert.equal(C.NOME_ELEMENTO.neutro, 'Normal');
});
