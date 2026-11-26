import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from './core.js';
import * as V from './variacoes.js';
import * as E from './species.js';

const INICIAIS = ['Noctarn', 'Ignavor', 'Vaelith', 'Brotavel', 'Solarin'];

test('cada inicial tem uma variação para cada elemento que não é o natural, sem repetir', () => {
  for (const especie of INICIAIS) {
    const lista = V.variacoesDaEspecie(especie);
    assert.equal(lista.length, C.ELEMENTOS.length - 1, especie);
    assert.ok(!lista.includes(V.elementoNatural(especie)), `${especie} repete o natural`);
    assert.equal(new Set(lista).size, lista.length, especie);
  }
});

test('elemento natural de cada inicial vem da ficha da espécie', () => {
  assert.equal(V.elementoNatural('Noctarn'), 'trevas');
  assert.equal(V.elementoNatural('Ignavor'), 'fogo');
  assert.equal(V.elementoNatural('Vaelith'), 'agua');
  assert.equal(V.elementoNatural('Brotavel'), 'planta');
  assert.equal(V.elementoNatural('Solarin'), 'luz');
});

test('origem: só breed e explorar dão variação; qualquer outra origem nunca dá, mesmo com sorte', () => {
  for (const origem of ['zona', 'login', 'passe', 'selvagem', 'inicial', 'evento', 'raid']) {
    for (let s = 1; s <= 500; s++) {
      assert.equal(V.sortearVariacao('Ignavor', origem, C.mulberry32(s)), null, origem);
    }
  }
  let deram = 0;
  for (let s = 1; s <= 500; s++) {
    if (V.sortearVariacao('Ignavor', 'breed', C.mulberry32(s))) deram += 1;
    if (V.sortearVariacao('Ignavor', 'explorar', C.mulberry32(s))) deram += 1;
  }
  assert.ok(deram > 0);
});

test('chance: perto de 30% nas origens permitidas, e a cor sorteada nunca é a natural', () => {
  let n = 0;
  let variantes = 0;
  for (let s = 1; s <= 10000; s++) {
    const v = V.sortearVariacao('Vaelith', 'explorar', C.mulberry32(s));
    n += 1;
    if (v) {
      variantes += 1;
      assert.notEqual(v, V.elementoNatural('Vaelith'));
    }
  }
  const taxa = variantes / n;
  assert.ok(Math.abs(taxa - V.CHANCE_VARIACAO) < 0.02, `taxa ${taxa}`);
});

test('giro de cor: sai da cor do elemento natural para a cor da variação', () => {
  assert.equal(V.giroDaVariacao('Ignavor', 'fogo'), null, 'o natural não gira');
  assert.equal(V.giroDaVariacao('Ignavor', 'agua').matiz, 195); // azul (210) saindo do laranja-fogo (15)
  assert.equal(V.giroDaVariacao('Noctarn', 'agua').matiz, 300); // azul (210) saindo do roxo (270)
  assert.equal(V.giroDaVariacao('Noctarn', 'neutro').sat, 0.08);
});

test('colorir: o prateado do Solarin é colorido a partir do cinza, com a cor-alvo como matiz', () => {
  const g = V.giroDaVariacao('Solarin', 'agua');
  assert.equal(g.colorir, true);
  assert.equal(g.matiz, 210);
  assert.equal(V.giroDaVariacao('Noctarn', 'agua').colorir, false);
  assert.ok(V.filtroDaVariacao('Solarin', 'agua').includes('sepia(1)'));
});

test('filtro CSS: mesma conta do giro, com saturação e brilho', () => {
  assert.equal(V.filtroDaVariacao('Ignavor', 'fogo'), 'none');
  assert.equal(V.filtroDaVariacao('Ignavor', 'agua'), 'hue-rotate(195deg) saturate(1.2) brightness(1)');
});

test('aplicar: troca elemento e habilidades; o natural não muda nada', () => {
  const m = { species: 'Ignavor', elemento: 'fogo', abilities: E.HABILIDADES_DA_ESPECIE.Ignavor.slice(0, 4) };
  V.aplicarVariacao(m, 'fogo');
  assert.equal(m.variante, undefined);
  assert.equal(m.elemento, 'fogo');
  V.aplicarVariacao(m, 'agua');
  assert.equal(m.variante, 'agua');
  assert.equal(m.elemento, 'agua');
  assert.deepEqual(m.abilities, V.HABILIDADES_DO_ELEMENTO.agua.slice(0, 4));
  assert.equal(V.habilidadesDoMonstro(m).length, 5);
});

test('habilidades: cada elemento tem cinco nomes únicos, e nenhum nome se repete entre elementos', () => {
  const todos = [];
  for (const [elemento, nomes] of Object.entries(V.HABILIDADES_DO_ELEMENTO)) {
    assert.equal(nomes.length, 5, elemento);
    assert.equal(new Set(nomes).size, 5, elemento);
    todos.push(...nomes);
  }
  assert.equal(new Set(todos).size, todos.length);
});

test('nome: onírico seguido da cor do elemento', () => {
  assert.equal(V.nomeDaVariacao('agua'), 'Onírico azul');
  assert.equal(V.nomeDaVariacao(null), null);
});
