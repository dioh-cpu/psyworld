const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('core/legacy-runtime.js', 'utf8');
const start = source.indexOf('function openPokedex(){');
const end = source.indexOf('\nfunction showDexDetail(', start);
assert.ok(start >= 0 && end > start, 'global Pokédex functions must be present');
const html = fs.readFileSync('index.html', 'utf8');
assert.match(html, /id="dex-load-more"[^>]+onclick="loadMorePokedex\(\)"/);

let renderedCards = 0;
let animationCalls = 0;
const elements = {
  'screen-pokedex': { style: { display: 'none' } },
  'dex-search': { value: '' },
  'dex-grid-wrap': { scrollTop: 0 },
  'dex-grid': {
    set innerHTML(value) {
      renderedCards = (value.match(/class="dex-card/g) || []).length;
    },
  },
  'dex-load-more': { hidden: true, textContent: '' },
};
const allNames = Object.fromEntries(Array.from({ length: 1025 }, (_, i) => {
  const id = String(i + 1);
  return [id, `Pokémon ${id}`];
}));
const context = {
  window: {},
  document: { getElementById: id => elements[id] || null },
  FULL_LEARNSET: { loaded: true },
  ALL_POKE_NAMES: allNames,
  TYPE_BY_ID_ALL: {},
  TYPE_BY_ID_EXT: {},
  P: { box: [], team: [] },
  getPokeAnim: ({ id }) => { animationCalls++; return `/sprite/${id}.png`; },
  loadFullLearnset: () => Promise.resolve(),
};
vm.runInNewContext(source.slice(start, end), context);

context.openPokedex();
assert.equal(elements['screen-pokedex'].style.display, 'flex');
assert.equal(renderedCards, 60, 'opening the Pokédex renders only its first page');
assert.equal(animationCalls, 60, 'opening the Dex prepares no more than 60 sprites');
assert.equal(elements['dex-load-more'].hidden, false);
assert.match(elements['dex-load-more'].textContent, /60 de 1025/);

elements['dex-grid-wrap'].scrollTop = 180;
context.loadMorePokedex();
assert.equal(renderedCards, 120, 'load more appends the next page without building all 1,025 cards');
assert.equal(elements['dex-grid-wrap'].scrollTop, 180, 'loading a page preserves the list position');

elements['dex-search'].value = 'Pokémon 10';
context.renderPokedex();
const searchMatches = Object.values(allNames).filter(name => name.toLocaleLowerCase('pt-BR').includes('pokémon 10')).length;
assert.equal(renderedCards, searchMatches, 'search renders only matching species and resets pagination');
assert.ok(renderedCards < 60, 'search results remain limited to matches rather than the full Dex');
assert.equal(elements['dex-grid-wrap'].scrollTop, 0, 'a new search returns to the top of the results');
assert.equal(elements['dex-load-more'].hidden, true, 'short search results hide load more');

elements['dex-search'].value = '9999';
context.renderPokedex();
assert.equal(renderedCards, 0, 'no-match search renders no Pokémon cards');

elements['dex-search'].value = '';
context.loadMorePokedex();
context.openPokedex();
assert.equal(renderedCards, 60, 'reopening the Pokédex resets it to one bounded page');

console.log('Global Pokédex pagination and search performance: ok');
