const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'modes/idle-realistic-v1.js'), 'utf8');
const saleValueStart = source.indexOf('function idlePokemonSaleValue(');
const saleValueEnd = source.indexOf('\nfunction openIdleShop(', saleValueStart);
assert.ok(saleValueStart >= 0 && saleValueEnd > saleValueStart, 'Box sale prices include level and rarity');
const saleValueContext = { W: { RARITIES: [{ n: 'Quase Lixo' }, { n: 'Nice' }], getEvoStage: () => 1 } };
vm.createContext(saleValueContext);
vm.runInContext(source.slice(saleValueStart, saleValueEnd), saleValueContext);
const priceLv1Quase = saleValueContext.idlePokemonSaleValue({ id: 25, level: 1, rarity: { n: 'Quase Lixo' }, ivs: { atk: 0 } });
const priceLv10Quase = saleValueContext.idlePokemonSaleValue({ id: 25, level: 10, rarity: { n: 'Quase Lixo' }, ivs: { atk: 32 } });
const priceLv1Nice = saleValueContext.idlePokemonSaleValue({ id: 25, level: 1, rarity: { n: 'Nice' }, ivs: { atk: 0 } });
assert.ok(priceLv10Quase > priceLv1Quase, 'the same species sells for more at level 10 than level 1');
assert.ok(priceLv1Nice > priceLv1Quase, 'Nice rarity has a modest price edge over Quase Lixo');
assert.ok(priceLv10Quase > priceLv1Nice, 'level stays the main sale-price factor');
assert.equal(priceLv1Nice, saleValueContext.idlePokemonSaleValue({ id: 25, level: 1, rarity: { n: 'Nice' }, ivs: { atk: 32 } }), 'IVs do not dominate or unpredictably inflate sale price');
const xpCurveStart = source.indexOf('function idleKillXp(');
const xpCurveEnd = source.indexOf('function idlePokemonKey(', xpCurveStart);
assert.ok(xpCurveStart >= 0 && xpCurveEnd > xpCurveStart, 'enemy-level XP curve exists');
const xpContext = {};
vm.createContext(xpContext);
vm.runInContext(source.slice(xpCurveStart, xpCurveEnd), xpContext);
assert.equal(xpContext.idleKillXp(1), 20, 'level 1 enemies give the base 20 XP');
assert.equal(xpContext.idleKillXp(2), 25, 'enemy XP increases with level');
assert.equal(xpContext.idleKillXp(10), 35, 'level 10 enemies give more XP than level 1');
assert.equal(xpContext.idleKillXp(20), 41, 'the authoritative XP curve is followed at higher levels');
assert.doesNotMatch(source, /IDLE_KILL_XP/, 'kill rewards do not use the old fixed XP constant');
const rewardStart = source.indexOf('function awardIdleLocalReward(');
const rewardEnd = source.indexOf('\nfunction awardIdleVictory(', rewardStart);
assert.ok(rewardStart >= 0 && rewardEnd > rewardStart, 'local victory reward uses the level curve');
let pokemonAward = null;
let trainerAward = null;
const rewardWallet = { gold: 0 };
const rewardContext = {
  activeIdlePokemon: () => ({ id: 7 }),
  addIdlePokemonXp: (mon, baseXp, speciesBonus) => {
    pokemonAward = { mon, baseXp, speciesBonus };
    return Math.floor(baseXp * (1 + speciesBonus / 100) * 1.5);
  },
  idleBoostActive: key => key === 'xp',
  addIdlePlayerXp: baseXp => { trainerAward = baseXp; },
  idleWallet: () => rewardWallet,
  W: { psySharedCombatDrop: () => [] },
  queueIdleSave: () => {}
};
vm.createContext(rewardContext);
vm.runInContext(`${source.slice(xpCurveStart, xpCurveEnd)}\n${source.slice(rewardStart, rewardEnd)}`, rewardContext);
const levelTenReward = rewardContext.awardIdleLocalReward({ level: 10, idleXpBonus: 25 });
assert.equal(pokemonAward.baseXp, 35, 'active Pokémon uses the enemy-level base XP');
assert.equal(trainerAward, 35, 'trainer receives the same unmodified base XP');
assert.equal(pokemonAward.speciesBonus, 25, 'species XP bonus applies only to Pokémon XP');
assert.equal(levelTenReward.xp, 65, 'Pokémon XP keeps the species bonus and active boost');
assert.equal(levelTenReward.trainerXp, 52, 'trainer XP analytics include the existing XP boost');
const victoryStart = source.indexOf('function awardIdleVictory(');
const victoryEnd = source.indexOf('\nfunction killEnemy(', victoryStart);
assert.match(source.slice(victoryStart, victoryEnd), /analytics\.trainerXp[\s\S]*reward\.trainerXp/, 'trainer analytics records the actual level-scaled reward');

const trainerXpStart = source.indexOf('function idleTrainerXpNext(');
const trainerXpEnd = source.indexOf('function idlePlayerProfile(', trainerXpStart);
const captureHelpersStart = source.indexOf('function neutralizeIdlePokemon(');
const captureHelpersEnd = source.indexOf('function idleProgress(', captureHelpersStart);
assert.ok(trainerXpStart >= 0 && trainerXpEnd > trainerXpStart && captureHelpersStart >= 0 && captureHelpersEnd > captureHelpersStart, 'capture level reset helpers exist');
const captureNeutralizeLevels = [];
const captureContext = {
  W: {
    PsyIdleGenetics: { ensure: mon => mon },
    calcBaseHpV14: level => { captureNeutralizeLevels.push(level); return 100 + level; },
    calcBaseAtkV14: level => { captureNeutralizeLevels.push(level); return 40 + level; }
  },
  crypto: { randomUUID: () => 'capture-test-key' }
};
vm.createContext(captureContext);
vm.runInContext(`${source.slice(trainerXpStart, trainerXpEnd)}\n${source.slice(captureHelpersStart, captureHelpersEnd)}`, captureContext);
const capturedRarity = { n: 'Raro', mult: 2 };
const capturedIvs = { hp: 31, atk: 27, def: 18, spd: 22 };
const captured = captureContext.prepareIdlePokemon({ id: 150, level: 37, exp: 245, maxExp: 999, rarity: capturedRarity, ivs: capturedIvs, shiny: true, isShiny: true, hp: 200, maxHp: 200 }, 'capture');
assert.equal(captured.level, 1, 'new captures always start at level 1 regardless of the factory output');
assert.equal(captured.exp, 0, 'new captures start with zero XP');
assert.equal(captured.maxExp, 450, 'new captures use the level 1 XP requirement');
assert.equal(captureNeutralizeLevels[0], 1, 'captured stats are normalized after resetting the level');
assert.equal(captured.rarity, capturedRarity, 'the capture keeps its generated rarity');
assert.equal(captured.ivs, capturedIvs, 'the capture keeps its generated IVs');
assert.equal(captured.shiny, true, 'the capture keeps its shiny state');
assert.equal(captured.isShiny, true, 'the capture keeps its isShiny state');
assert.equal(captureContext.prepareIdlePokemon({ level: 12, exp: 34, maxExp: 99 }, 'saved').level, 12, 'loading an existing Pokémon does not erase its legacy fields');
const captureFlowStart = source.indexOf('function startIdleCapture(');
const captureFlowEnd = source.indexOf('\nfunction captureFeedback(', captureFlowStart);
assert.match(source.slice(captureFlowStart, captureFlowEnd), /prepareIdlePokemon\(mon,'capture'\)/, 'normal hunt captures pass through the level 1 reset');

const itemArtworkStart = source.indexOf('function idleItemArtwork(');
const itemArtworkEnd = source.indexOf('function idleAnalyzerData(', itemArtworkStart);
assert.ok(itemArtworkStart >= 0 && itemArtworkEnd > itemArtworkStart, 'Psy Idle item artwork uses the shared sprite resolver');
const remoteSprites = {
  'Bottle Of Poison': 'https://wiki.pokexgames.com/images/3/3b/Bottles_of_poison.png?psy=test',
  'Earth Ball': 'https://wiki.pokexgames.com/images/6/61/EarthBall.png?psy=test',
  'Water Gem': 'https://wiki.pokexgames.com/images/c/c0/Water_gem.png?psy=test'
};
const localSprites = { 'Great Ball': 'assets/items/great-ball.png' };
const itemArtContext = {
  W: { PSY_ITEMS: { url: name => remoteSprites[name] || '', localUrl: name => localSprites[name] || '' } },
  idleSafeText: value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
};
vm.createContext(itemArtContext);
vm.runInContext(source.slice(itemArtworkStart, itemArtworkEnd), itemArtContext);
for (const [name, url] of Object.entries(remoteSprites)) {
  assert.ok(itemArtContext.idleItemArtwork(name).includes(`src="${url}"`), `${name} uses its exact remote PXG sprite`);
}
assert.ok(itemArtContext.idleItemArtwork('Great Ball').includes('src="assets/items/great-ball.png"'), 'Balls without an exact remote sprite keep their local icon');
assert.match(source, /assets\/idle-realistic\/hunts\/kanto\/\$\{KANTO_HUNT_ART_SLUG\[type\]\}\.webp\?v=20260930-hunt-art-r2/, 'Kanto art URLs bust stale cached backgrounds');

const rankingStart = source.indexOf('async function idleLeaderboardAuthContext(');
const rankingEnd = source.indexOf('function idleMailPanel(', rankingStart);
const requestIdStart = source.indexOf('function idleRequestId(');
const requestIdEnd = source.indexOf('function idleWait(', requestIdStart);
assert.ok(rankingStart >= 0 && rankingEnd > rankingStart && requestIdStart >= 0 && requestIdEnd > requestIdStart, 'global leaderboard client helpers exist');
const rankingSlice = source.slice(rankingStart, rankingEnd);
assert.match(rankingSlice, /fetch\('\/api\/idle-leaderboard'/, 'leaderboard reads and claims use the documented API');
assert.match(rankingSlice, /action:'board'[\s\S]*request_id:idleRequestId\(\)/, 'board requests carry a unique UUID');
assert.match(rankingSlice, /action:'claim',[\s\S]*request_id:idleRequestId\(\),period/, 'prize claims carry a unique UUID and the selected period');
assert.match(rankingSlice, /last_period[\s\S]*previous[\s\S]*claimable[\s\S]*claimed/, 'previous-period rewards handle both API naming variants');
assert.match(rankingSlice, /idle_auth_bridge_unavailable[\s\S]*Entre na sua conta/, 'offline and unauthenticated states are explained clearly');
assert.match(source, /if\(tab==='ranking'\)openIdleRanking\(root\)/, 'opening Ranking loads the global board');
const rankingContext = {
  W: { crypto: { randomUUID: () => '123e4567-e89b-42d3-a456-426614174000' } },
  idleSafeText: value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
};
vm.createContext(rankingContext);
vm.runInContext(`${source.slice(requestIdStart, requestIdEnd)}\n${rankingSlice}`, rankingContext);
const rankingFixture = {
  timezone: 'UTC', score_metric: 'XP de Hunt', periods: {
    daily: {
      entries: [
        { rank: 1, nickname: 'Kanto <Ace>', trainer_level: 20, is_me: false, score: 420, kills: 30, captures: 4, xp_earned: 420, gold_earned: 760 },
        { rank: 2, nickname: 'Treinadora', trainer_level: 10, is_me: true, score: 300, kills: 12, captures: 1, xp_earned: 300, gold_earned: 150 }
      ],
      me: { rank: 2, trainer_level: 10, xp: 300, kills: 12, captures: 1 },
      prizes: { 1: 10000, 2: 5000, 3: 2500 },
      previous: { rank: 2, claimable: true, claimed: false, gold_awarded: 5000 }
    },
    weekly: { entries: [], me: null, prizes: { 1: 50000, 2: 25000, 3: 12500 }, last_period: { rank: 0, eligible: false, claimed: false, gold_awarded: 0 } },
    monthly: { entries: [], me: null, prizes: { 1: 150000, 2: 75000, 3: 37500 }, previous: { rank: 1, eligible: true, claimed: true, gold_awarded: 150000 } }
  }
};
const rankingHtml = rankingContext.idleRankingBoardMarkup(rankingFixture);
assert.match(rankingHtml, /Kanto &lt;Ace&gt;/, 'leaderboard nicknames are escaped');
assert.match(rankingHtml, /Nv\. 20 · 420 XP · 30 abates · 4 capturas · 760 G/, 'global rows render the contracted player stats');
assert.match(rankingHtml, /data-rank-me="1"[\s\S]*VOCÊ/, 'the API privacy-safe is_me flag highlights the current player');
assert.doesNotMatch(rankingHtml, /player-1/, 'the rendered board does not expose account IDs');
assert.match(rankingHtml, /Sua posição: <b>#2<\/b> · 300 XP/, 'the current account position is displayed for each period');
assert.match(rankingHtml, /data-rank-action="claim" data-rank-period="daily"/, 'eligible previous-period rewards have a claim action');
assert.doesNotMatch(rankingHtml, /data-rank-action="claim" data-rank-period="weekly"/, 'ineligible periods do not show a claim button');
assert.match(rankingHtml, /Prêmio anterior resgatado: 150\.000 Gold/, 'already claimed rewards display their awarded amount');
assert.match(rankingHtml, /Ainda não há resultados neste período/, 'empty leaderboards have an explicit empty state');

const helpersStart = source.indexOf('function idleBoxPokemonLevel(');
const helpersEnd = source.indexOf('function addIdlePokemonXp(', helpersStart);
assert.ok(helpersStart >= 0 && helpersEnd > helpersStart, 'Box sale guards exist');

let profile = {
  team: [
    { id: 1, psyIdleKey: 'team-active' },
    { id: 2, psyIdleKey: 'team-second' }
  ],
  box: [
    { id: 3, psyIdleKey: 'box-safe' },
    { id: 4, psyIdleKey: 'team-second' },
    { id: 5, psyIdleKey: 'box-active' }
  ],
  meta: { psyIdlePokemon: { 'box-safe': { level: 12, xp: 20 } } }
};
const player = { poke: { psyIdleKey: 'team-active' } };
let statSyncs = 0;
const context = {
  profile,
  player,
  idlePokemonKey: mon => String(mon.psyIdleKey),
  PSTATE: () => profile,
  syncPlayerStats: () => {
    statSyncs++;
    player.poke = { ...profile.team[0] };
  }
};
vm.createContext(context);
vm.runInContext(source.slice(helpersStart, helpersEnd), context);

const candidates = Array.from(context.idleBoxSellCandidates(profile, 'box-active'), mon => mon.psyIdleKey);
assert.deepEqual(candidates, ['box-safe'], 'team Pokémon and the battle Pokémon are not offered for sale');
assert.equal(context.idleBoxSellCandidates(profile, 'box-active')[0].level, 12, 'the sale list uses the saved Psy Idle level, not the raw Box level');
assert.equal(context.idleBoxPokemonLevel(profile, profile.box[0]), 12, 'the current saved level is available for sale-price calculation');
assert.equal(context.idleFindSellableBoxPokemon(profile, 'team-active', ''), null, 'the active team member cannot be sold');
assert.equal(context.idleFindSellableBoxPokemon(profile, 'team-second', ''), null, 'other team members cannot be sold');
assert.equal(context.idleFindSellableBoxPokemon(profile, 'box-active', 'box-active'), null, 'a Pokémon still used in battle cannot be sold');
assert.equal(context.idleFindSellableBoxPokemon(profile, 'box-safe', 'team-active').id, 3, 'an eligible Box Pokémon can be revalidated');

const syncStart = source.indexOf('function syncIdleBattlePokemon(');
const syncEnd = source.indexOf('\n', syncStart);
assert.ok(syncStart >= 0 && syncEnd > syncStart, 'battle roster reconciliation exists');
vm.runInContext(source.slice(syncStart, syncEnd), context);
profile.team = [{ id: 6, psyIdleKey: 'replacement' }];
player.poke = { id: 1, psyIdleKey: 'sold-legacy' };
context.syncIdleBattlePokemon();
assert.equal(player.poke.psyIdleKey, 'replacement', 'a stale battle sprite switches to the current team member');
assert.equal(statSyncs, 1);
context.syncIdleBattlePokemon();
assert.equal(statSyncs, 1, 'an already valid battle Pokémon is left alone');

const shopStart = source.indexOf('function openIdleShop(');
const shopEnd = source.indexOf('function idleSuiteClose(', shopStart);
const shop = source.slice(shopStart, shopEnd);
assert.match(shop, /mons=idleBoxSellCandidates\(p\)/, 'the sale screen lists Box candidates only');
assert.match(shop, /idleFindSellableBoxPokemon\(latest,key\)/, 'individual sales recheck current ownership');
assert.match(shop, /idleBoxSellCandidates\(latest\)\.filter/, 'bulk sales use the same Box-only candidates');
assert.match(shop, /syncIdleBattlePokemon\(\)/, 'opening the shop and completing a sale reconcile the battle Pokémon');
assert.match(shop, /data-poke-key=/, 'cards use stable Pokémon keys for actions');
assert.match(shop, /updatePokemonCard\(card,original\)/, 'locking updates its card in place');
assert.match(shop, /value\(\{\.\.\.m,level:idleBoxPokemonLevel\(latest,m\)\}\)/, 'single sales price from the latest saved Idle level');
assert.match(shop, /card\.remove\(\)/, 'selling removes only the selected card without rebuilding the list');
assert.match(shop, /soldKeys\.has\(String\(card\.dataset\.pokeKey\|\|''\)\)/, 'bulk sales remove only the sold cards');
assert.doesNotMatch(shop, /openIdleShop\('pokemon'\)/, 'Pokemon actions never rerender and reset filters');
assert.doesNotMatch(shop, /W\.renderTeam\?\.\(\)/, 'Pokemon sales do not synchronously rerender the unrelated global team UI');

const analyzerStart = source.indexOf('function idleAnalyticsViewValues(');
const analyzerEnd = source.indexOf('function openIdleHelper(', analyzerStart);
assert.ok(analyzerStart >= 0 && analyzerEnd > analyzerStart, 'incremental Hunt Analyzer update helpers exist');
const analyzer = source.slice(analyzerStart, analyzerEnd);
assert.match(analyzer, /function refreshIdleAnalyticsPanel\(/, 'the analyzer has an in-place refresh path');
assert.match(analyzer, /drops\.dataset\.signature!==dropSignature/, 'drop rows refresh only when the drop data changes');
assert.match(analyzer, /drops\.scrollTop=scroll/, 'the drop-list scroll is preserved when rows change');
assert.match(analyzer, /if\(!o\.dataset\.analyticsMounted\|\|!o\.querySelector\('\.ir-ref-panel'\)\)/, 'the analyzer DOM is built only when first opened');
assert.doesNotMatch(analyzer.match(/function refreshIdleAnalyticsPanel\(\)\{([\s\S]*?)\nfunction openAnalytics\(/)?.[1] || '', /o\.innerHTML/, 'live analyzer updates do not replace the panel DOM');
const updateHudStart = source.indexOf('function updateHud(){');
const updateHudEnd = source.indexOf('\n', updateHudStart);
assert.match(source.slice(updateHudStart, updateHudEnd), /refreshIdleAnalyticsPanel\(\)/, 'the live HUD uses incremental analyzer updates');
assert.doesNotMatch(source.slice(updateHudStart, updateHudEnd), /openAnalytics\(\)/, 'the live HUD does not reopen and rebuild the analyzer');
assert.match(source, /const IDLE_DEX_BATCH_SIZE=60/, 'the Pokédex initial render is capped at 60 species');
const dexStart = source.indexOf('function idleDexVisibleIds(');
const dexEnd = source.indexOf('function renderIdleDex(', dexStart);
assert.ok(dexStart >= 0 && dexEnd > dexStart, 'Pokédex batch selector exists');
const dexContext = { dexVisibleCount: 60 };
vm.createContext(dexContext);
vm.runInContext(source.slice(dexStart, dexEnd), dexContext);
const fullSpeciesList = Array.from({ length: 1025 }, (_, i) => i + 1);
assert.equal(dexContext.idleDexVisibleIds(fullSpeciesList, 60).length, 60, 'initial Dex DOM stays limited to the first 60 rows');
assert.equal(dexContext.idleDexVisibleIds(fullSpeciesList, 60)[59], 60, 'first batch keeps natural Pokédex order');
assert.deepEqual(Array.from(dexContext.idleDexVisibleIds(fullSpeciesList.filter(id => id === 1025), 60)), [1025], 'search can still find species outside the first DOM batch');
const dexRenderStart = source.indexOf('function renderIdleDex(');
const dexRenderEnd = source.indexOf('function applyIdleSpeciesXp(', dexRenderStart);
const dexRender = source.slice(dexRenderStart, dexRenderEnd);
assert.match(dexRender, /ids=Object\.keys\(ALL_POKE_NAMES\).*id<=1025/, 'the Dex still indexes all species');
assert.match(dexRender, /filtered=ids\.filter\(/, 'search filters the full species data before rendering a batch');
assert.match(dexRender, /dexVisibleCount=Math\.min\(filtered\.length,dexVisibleCount\+IDLE_DEX_BATCH_SIZE\)/, 'progressive loading can reveal every matching species');
assert.match(dexRender, /dexVisibleCount=IDLE_DEX_BATCH_SIZE;renderIdleDex\(true\)/, 'a new search returns to the first batch');
const analyzerKeys = ['defeated', 'time', 'xp', 'captured', 'loot', 'supply'];
const analyzerValues = Object.fromEntries(analyzerKeys.map(key => [key, { textContent: '' }]));
const analyzerLabels = Object.fromEntries(['captured', 'loot', 'supply'].map(key => [key, { textContent: '' }]));
const analyzerBalance = { textContent: '', classList: { toggle() {} } };
const analyzerRates = [{ textContent: '' }, { textContent: '' }, { textContent: '' }];
let dropHTML = '';
let dropHTMLWrites = 0;
const analyzerDrops = { dataset: {}, scrollTop: 37 };
Object.defineProperty(analyzerDrops, 'innerHTML', { get: () => dropHTML, set: value => { dropHTML = value; dropHTMLWrites++; } });
const analyzerPanel = { scrollTop: 91 };
const analyzerOverlay = {
  querySelector: selector => selector === '.ir-ref-panel' ? analyzerPanel : selector === '.ir-drops' ? analyzerDrops : selector === '[data-an-balance]' ? analyzerBalance : selector.startsWith('[data-an-value=') ? analyzerValues[selector.match(/"(.*?)"/)[1]] : selector.startsWith('[data-an-label=') ? analyzerLabels[selector.match(/"(.*?)"/)[1]] : null,
  querySelectorAll: selector => selector === '[data-an-rate]' ? analyzerRates : []
};
let currentAnalyzerView = {
  a: { defeated: 2, xp: 40, captured: 1, captureValue: 300, drops: [{ name: 'Seed', qty: 1 }], supply: {} },
  v: { sec: 60, supply: 10, loot: 400, balance: 690, rate: 60 },
  fmt: String,
  money: n => `$${n}`,
  s: {}, balls: 0, potions: 0, count: 1,
  dropSignature: 'seed:1'
};
const analyzerContext = {
  D: { getElementById: id => id === 'psy-ir-analytics-overlay' ? analyzerOverlay : null },
  analytics: {},
  idleAnalyticsInit: () => {},
  idleAnalyticsViewValues: () => currentAnalyzerView,
  idleAnalyticsDropMarkup: () => '<div>Seed ×1</div>'
};
vm.createContext(analyzerContext);
const refreshSourceStart = source.indexOf('function refreshIdleAnalyticsPanel(');
const refreshSourceEnd = source.indexOf('function openAnalytics(', refreshSourceStart);
vm.runInContext(source.slice(refreshSourceStart, refreshSourceEnd), analyzerContext);
analyzerDrops.dataset.signature = currentAnalyzerView.dropSignature;
analyzerContext.refreshIdleAnalyticsPanel();
assert.equal(analyzerValues.defeated.textContent, '2', 'the analyzer refreshes metrics in place');
assert.equal(analyzerBalance.textContent, '+$690', 'the analyzer refreshes the balance in place');
assert.equal(dropHTMLWrites, 0, 'unchanged drops do not rebuild the drop list');
assert.equal(analyzerDrops.scrollTop, 37, 'the drop-list scroll remains unchanged');
const originalPanel = analyzerPanel;
currentAnalyzerView = { ...currentAnalyzerView, a: { ...currentAnalyzerView.a, defeated: 3, xp: 55 }, v: { ...currentAnalyzerView.v, balance: 800 }, dropSignature: 'seed:2' };
analyzerContext.refreshIdleAnalyticsPanel();
assert.equal(analyzerOverlay.querySelector('.ir-ref-panel'), originalPanel, 'live refresh keeps the same panel node');
assert.equal(analyzerValues.defeated.textContent, '3', 'live values still update');
assert.equal(dropHTMLWrites, 1, 'changed drops update only the drop list');
assert.equal(analyzerDrops.scrollTop, 37, 'drop-list position survives changed drops');

const healingStart = source.indexOf('function idlePotionHealAmount(');
const healingEnd = source.indexOf('function updateIdleHelper(', healingStart);
assert.ok(healingStart >= 0 && healingEnd > healingStart, 'shared potion healing logic exists');
const hpText = { textContent: '' };
const hpBar = { style: { width: '' } };
let savedHp = 0;
let queuedSaves = 0;
const healContext = {
  player: { hp: 100, maxHp: 1000, dead: 0, poke: { hp: 100 } },
  D: { getElementById: id => id === 'psy-ir-hptxt' ? hpText : id === 'psy-ir-hpbar' ? hpBar : null },
  clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
  persistIdlePokemonHp: () => { savedHp = healContext.player.hp; },
  queueIdleSave: () => { queuedSaves++; }
};
vm.createContext(healContext);
vm.runInContext(source.slice(healingStart, healingEnd), healContext);
assert.equal(healContext.idlePotionHealAmount('Poção 50% HP', 1000), 500, 'percentage potions scale from max HP');
assert.equal(healContext.idlePotionHealAmount('Poção 200', 1000), 200, 'flat potions keep their fixed heal value');
assert.equal(healContext.idleApplyPotion('Poção 50% HP'), 500, 'using a potion applies its heal immediately');
assert.equal(healContext.player.hp, 600, 'the battle player receives the healed HP');
assert.equal(healContext.player.poke.hp, 600, 'the active Pokémon mirrors the healed HP');
assert.equal(savedHp, 600, 'the species HP record is synchronized before stats can be recalculated');
assert.equal(hpText.textContent, '❤ 600 / 1000', 'the HP HUD text updates immediately');
assert.equal(hpBar.style.width, '60%', 'the HP bar updates immediately');
assert.equal(queuedSaves, 1, 'healing queues a save');
healContext.player.hp = 950;
assert.equal(healContext.idleApplyPotion('Poção 100% HP'), 50, 'healing is capped at max HP');
assert.equal(healContext.player.hp, 1000);
healContext.player.dead = 1;
assert.equal(healContext.idleApplyPotion('Poção 200'), 0, 'potions do not heal a dead player before Revive');
const helperStart = source.indexOf('function updateIdleHelper(');
const helperEnd = source.indexOf('\n', helperStart);
assert.match(source.slice(helperStart, helperEnd), /idleApplyPotion\(n\)>0/, 'Auto-Potion only consumes a potion after a successful heal');
const autoHpText = { textContent: '' };
const autoHpBar = { style: { width: '' } };
const autoInventory = { 'Poção 50% HP': 1 };
let autoSavedHp = 0;
let supplyUses = 0;
const autoContext = {
  helperTick: 0,
  potionReady: 0,
  player: { hp: 100, maxHp: 1000, dead: 0, poke: { hp: 100 } },
  D: { getElementById: id => id === 'psy-ir-hptxt' ? autoHpText : id === 'psy-ir-hpbar' ? autoHpBar : null },
  IDLE_SUPPLY_PRICES: { 'Poção 50% HP': 3000 },
  clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
  idleHelperSettings: () => ({ potion: true, revive: true, threshold: 50, potionName: 'Poção 50% HP', names: '', catchNormal: false, catchShiny: false }),
  idleWallet: () => ({ drops: autoInventory }),
  idleHuntSfx: () => {},
  idleSupplyUsed: () => { supplyUses++; },
  persistIdlePokemonHp: () => { autoSavedHp = autoContext.player.hp; },
  queueIdleSave: () => {},
  corpses: []
};
vm.createContext(autoContext);
vm.runInContext(`${source.slice(healingStart, helperEnd)}\n${source.slice(helperStart, helperEnd)}`, autoContext);
autoContext.updateIdleHelper(.5);
assert.equal(autoContext.player.hp, 600, 'Auto-Potion heals the player in the hunt loop');
assert.equal(autoContext.player.poke.hp, 600, 'Auto-Potion keeps the active Pokémon HP in sync');
assert.equal(autoInventory['Poção 50% HP'], 0, 'Auto-Potion consumes the selected item only after healing');
assert.equal(autoSavedHp, 600, 'Auto-Potion persists the healed HP immediately');
assert.equal(autoHpText.textContent, '❤ 600 / 1000', 'Auto-Potion updates the visible HUD immediately');
assert.equal(autoHpBar.style.width, '60%', 'Auto-Potion updates the HP bar immediately');
assert.equal(supplyUses, 1, 'Auto-Potion records its supply use exactly once');

async function testRankingApiAndStates() {
  const uuid = '123e4567-e89b-42d3-a456-426614174000';
  assert.equal(rankingContext.idleRequestId(), uuid, 'leaderboard claims use RFC 4122 UUID request IDs');
  const requests = [];
  let nextPayload = rankingFixture;
  rankingContext.W.PsyIdleSocial = {
    client: async () => ({ auth: { getSession: async () => ({ data: { session: { access_token: 'session-token', user: { id: 'player-self' } }, user: { id: 'player-self' } }, error: null }) } })
  };
  rankingContext.PSTATE = () => ({ name: 'Local trainer' });
  rankingContext.fetch = async (url, options) => {
    requests.push({ url, options, body: JSON.parse(options.body) });
    return { ok: true, json: async () => nextPayload };
  };
  await rankingContext.idleLeaderboardPost({ action: 'board', request_id: uuid, nickname: 'Local trainer' });
  assert.equal(requests[0].url, '/api/idle-leaderboard', 'ranking requests target the leaderboard endpoint');
  assert.equal(requests[0].options.headers.Authorization, 'Bearer session-token', 'the endpoint receives the logged-in session token');
  assert.equal(requests[0].body.action, 'board');
  nextPayload = { ok: true, claimed: true, reward_gold: 5000, period: 'daily' };
  const claimResult = await rankingContext.idleLeaderboardPost({ action: 'claim', request_id: uuid, period: 'daily', nickname: 'Local trainer' });
  assert.equal(requests[1].body.action, 'claim');
  assert.equal(requests[1].body.request_id, uuid);
  assert.equal(requests[1].body.period, 'daily');
  assert.equal(claimResult.reward_gold, 5000, 'claim response returns the server-credited prize');

  const status = { textContent: '', dataset: {} };
  const refresh = { hidden: true, disabled: false };
  const board = { innerHTML: '' };
  const root = {
    dataset: { idleTab: 'ranking', rankingRequest: '41' },
    querySelector: selector => selector === '[data-ranking-status]' ? status : selector === '[data-rank-action="refresh"]' ? refresh : selector === '[data-ranking-board]' ? board : null
  };
  nextPayload = rankingFixture;
  await rankingContext.loadIdleRanking(root, 41);
  assert.match(status.textContent, /Ranking atualizado/);
  assert.match(board.innerHTML, /Kanto &lt;Ace&gt;/, 'successful loads paint the ranking into the panel');
  assert.equal(refresh.hidden, true, 'successful loads hide retry');

  rankingContext.W.PsyIdleSocial.client = async () => ({ auth: { getSession: async () => ({ data: { session: null }, error: null }) } });
  root.dataset.rankingRequest = '42';
  await rankingContext.loadIdleRanking(root, 42);
  assert.match(status.textContent, /Entre na sua conta/, 'unauthenticated mode has a useful message');
  assert.equal(status.dataset.error, '1');
  assert.equal(refresh.hidden, false, 'offline/auth errors offer a retry');

  rankingContext.W.PsyIdleSocial.client = async () => ({ auth: { getSession: async () => ({ data: { session: { access_token: 'session-token', user: { id: 'player-self' } }, user: { id: 'player-self' } }, error: null }) } });
  const claimedFixture = { ...rankingFixture, periods: { ...rankingFixture.periods, daily: { ...rankingFixture.periods.daily, previous: { rank: 2, claimable: true, claimed: true, gold_awarded: 5000 } } } };
  rankingContext.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    requests.push({ url, options, body });
    return { ok: true, json: async () => body.action === 'claim' ? { ok: true, claimed: true, reward_gold: 5000, period: 'daily' } : claimedFixture };
  };
  root.dataset.rankingRequest = '43';
  const claimButton = { disabled: false, textContent: 'Resgatar 5.000 Gold' };
  await rankingContext.claimIdleRankingPrize(root, 'daily', claimButton, 43);
  const handledClaim = requests.at(-2).body;
  assert.equal(handledClaim.action, 'claim', 'the UI sends a claim action before refreshing the board');
  assert.equal(handledClaim.period, 'daily', 'the claim UI preserves the selected period');
  assert.match(handledClaim.request_id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, 'the claim handler generates a UUID request ID');
  assert.match(board.innerHTML, /Prêmio anterior resgatado: 5\.000 Gold/, 'a successful claim refreshes the previous-period status');
}

testRankingApiAndStates().then(() => {
  console.log('PASS: Box sale guards/pricing, in-place shop actions, stable analyzer, Auto-Potion, XP curve, level-1 captures, sprites, Dex paging, and global ranking');
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
