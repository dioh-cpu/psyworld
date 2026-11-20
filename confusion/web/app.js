// Piloto jogável de Confusion Waves: fatia vertical dos sistemas do núcleo.
import * as C from './core.js';
import * as A from './account.js';
import * as Y from './systems.js';

const KEY = 'confusion-waves-piloto-v3';
let recovery = false;      // true quando o link de recuperação de senha foi aberto
let pushTimer = null;
let notice = '';           // mensagem curta da área de conta
const ABILITIES = {
  Noctarn: ['Mordida Umbral', 'Garra de Sombra', 'Chama Violeta', 'Uivo Sinistro', 'Véu Noturno'],
  Ignavor: ['Golpe Couraçado', 'Brasa Imperial', 'Juba Flamejante', 'Rugido Dourado', 'Escudo de Ferro'],
  Vaelith: ['Pulso Astral', 'Arco Ciano', 'Cauda de Cristal', 'Véu Gelado', 'Fenda Estelar'],
};
for (const [k, v] of Object.entries(Y.EVENT_SPECIES)) ABILITIES[k] = v.abilities; // exclusivos de evento
const REPEATABLE_SOURCES = ['descanso', 'purificacao', 'missao'];
const NON_REPEATABLE = ['trauma', 'magia_mental', 'crueldade', 'ritual'];
const SOURCE_LABEL = {
  descanso: 'Descansar', purificacao: 'Purificar', missao: 'Missão de recuperação',
  trauma: 'Sofrer trauma', magia_mental: 'Magia mental proibida', crueldade: 'Crueldade deliberada', ritual: 'Ritual de corrupção',
};

// Aptidões de trabalho com nível (1 a 10). Coleta exige a aptidão correspondente.
const APT = {
  Noctarn: { minerar: 4, garimpar: 2 },
  Ignavor: { plantar: 3, colher: 2, cortar: 3, transportar: 2 },
  Vaelith: { colher: 2, fabricar: 2, garimpar: 3 },
};
for (const [k, v] of Object.entries(Y.EVENT_SPECIES)) APT[k] = v.aptitudes; // exclusivos de evento
const ART = { Noctarn: 'assets/monsters/noctarn/sprite-front.png' };
const EVENT_ACTIVE = true; // há sempre um evento mensal ativo no calendário; o item de drop é provisório
const monster = (id, species, rarity, level, xp, purity, variant = 'natural') => ({
  id, species, rarity, tier: rarity, variant, level, xp, purity, vinculo: 0,
  abilities: ABILITIES[species].slice(0, 4), extraAbility: null, hybrid: false, abilityLevels: {},
  aptitudes: { ...(APT[species] || {}) },
});
const SPECIES = Y.BASE_SPECIES; // todas saem de ovo, breed ou invocação: nenhuma espécie é só de pagamento
const PURITY_BY_SPECIES = Y.SPECIES_PURITY;
const RARITY_LABEL = { comum: 'Comum', rara: 'Rara', epica: 'Épica', lendaria: 'Lendária', mitica: 'Mítica' };
const VARIANT_LABEL = { natural: 'natural', mutante: 'mutação', abencoada: 'bênção', combinada: 'mutação + bênção' }; // a variante aparece como aura
const auraClass = (m) => (m.variant === 'mutante' ? `aura-mutante-${m.purity === 'luz' ? 'luz' : 'trevas'}` : `aura-${m.variant || 'natural'}`);
const eggAura = (e) => (e.form === 'mutante' ? `aura-mutante-${e.pureza === 'luz' ? 'luz' : 'trevas'}` : `aura-${e.form || 'natural'}`);
// Silhueta genérica para monstrinhos sem arte: a aura segue este contorno, nunca um quadrado.
const SILHUETA = '<svg class="silhueta" viewBox="0 0 120 100" aria-hidden="true"><g fill="currentColor"><ellipse cx="56" cy="60" rx="30" ry="18"/><ellipse cx="88" cy="42" rx="14" ry="12"/><path d="M98 40 L116 45 L98 50 Z"/><path d="M80 34 L84 12 L93 31 Z"/><rect x="34" y="66" width="9" height="26" rx="3"/><rect x="46" y="68" width="9" height="24" rx="3"/><rect x="66" y="68" width="9" height="24" rx="3"/><rect x="78" y="66" width="9" height="26" rx="3"/><path d="M28 56 Q8 46 12 24 Q22 40 32 48 Z"/></g></svg>';
const OVO_SVG = '<svg class="ovo-svg" viewBox="0 0 20 26" aria-hidden="true"><path d="M10 1 C17 1 19 14 19 18 C19 22 15 25 10 25 C5 25 1 22 1 18 C1 14 3 1 10 1 Z" fill="currentColor"/></svg>';
// Sprite do monstrinho. A aura é um filtro sobre o próprio contorno (imagem ou silhueta), animado.
// Os cards da coleção usam só a versão natural (aura: false).
const spriteHtml = (m, { aura = true, mini = false } = {}) => {
  const body = ART[m.species]
    ? `<img src="${ART[m.species]}" alt="${esc(m.species)}">`
    : (mini ? SILHUETA : `<span class="noart">${SILHUETA}<small>sem arte ainda</small></span>`);
  return `<span class="sprite ${mini ? 'mini ' : ''}${aura ? auraClass(m) : 'aura-natural'}">${body}</span>`;
};
const eggTag = (e) => `<span class="ovo-tag ${eggAura(e)}">${OVO_SVG}</span>`;
// Monstrinho em linha: sprite pequeno com aura, nome, raridade, tier e variante.
const monstroTag = (m) => `<span class="tag">${spriteHtml(m, { mini: true })}<span><b>${esc(m.species)}</b> ${rarityTag(m)}${m.variant && m.variant !== 'natural' ? ` · ${VARIANT_LABEL[m.variant]}` : ''}</span></span>`;
const lastTag = () => { const m = S.monsters.find((x) => x.id === S.last); return m ? `<p>Último monstrinho: ${monstroTag(m)}</p>` : ''; };
const BANNER_LABEL = { permanente: 'permanente', semanal: 'semanal', evento: 'evento' };
const uid = (p) => `${p}${Date.now()}${Math.floor(Math.random() * 1000)}`;
const newMonster = (species, rarity, purity, variant = 'natural') => monster(uid('m'), species, rarity, 1, 0, purity ?? PURITY_BY_SPECIES[species], variant);
const eggOf = (species, form, origem, pureza = 'neutra') => ({ ...C.makeEgg(species, form, origem, pureza), id: uid('e') });
const ORIGIN_LABEL = { breed: 'breed', zona: 'recompensa da zona', login: 'login diário', passe: 'passe de batalha', selvagem: 'drop selvagem', inicial: 'kit inicial' };
// Aplica uma recompensa do jogo: diamantes, esferas e fichas entram direto; ovos são criados com a origem.
function grant(reward, origem) {
  const ovos = Y.applyReward(S, reward);
  for (let i = 0; i < ovos; i++) {
    const e = C.eggFor(origem, Math.random(), Math.random(), null);
    S.eggs.push(eggOf(Y.BASE_SPECIES[Math.floor(Math.random() * Y.BASE_SPECIES.length)], e.form, origem, e.pureza));
  }
  return rewardText(reward);
}
const rewardText = (r) => [
  r.diamantes ? `${r.diamantes} diamantes` : '',
  ...Object.entries(r.esferas).filter(([, v]) => v).map(([k, v]) => `${v} esfera(s) ${RARITY_LABEL[k]}`),
  ...Object.entries(r.fichas).filter(([, v]) => v).map(([k, v]) => `${v} ficha(s) ${BANNER_LABEL[k]}`),
  r.ovos ? `${r.ovos} ovo(s)` : '',
].filter(Boolean).join(', ') || 'nada';
// Ao fim de um encontro (captura, fuga ou lançamento), o monstrinho pode deixar um ovo.
function dropEgg(w) {
  if (Y.dropsEgg(w, Math.random(), Y.dropBonus(Date.now()))) {
    const e = C.eggFor('selvagem', Math.random(), Math.random(), w.purity);
    S.eggs.push(eggOf(w.species, e.form, 'selvagem', e.pureza));
    note(`${w.species} deixou um ovo.`);
  }
}
const evBlock = (e, tipo) => `<p><b>${e.nome}</b> (${tipo}) · exclusivo: <b>${esc(e.exclusivo)}</b> · captura +${pct(e.bonus.captura)} · drop +${pct(e.bonus.drop)}</p>`;
function wildBlock() {
  const w = S.wild;
  const bonus = Y.captureBonus(Date.now(), S.day);
  const opts = C.RARITY.map((k, i) => `<option value="${k}">${RARITY_LABEL[k]} (${S.esferas[k]}) · chance ${pct(Y.captureChance(i + 1, w, bonus))}</option>`).join('');
  return `<p>${spriteHtml(w, { mini: true })}Apareceu um <b>${esc(w.species)}</b>${w.exclusivo ? ' <b>(exclusivo do evento)</b>' : ''} · ${RARITY_LABEL[C.rarityName(w.rarity)]} · tier ${w.tier}.</p>
    <label>Esfera <select id="sphere">${opts}</select></label>
    <button data-act="throw">Lançar esfera</button>
    <button data-act="flee" class="ghost">Deixar ir</button>
    <p class="muted">Cada lançamento gasta uma esfera e encerra o encontro.</p>`;
}

function newState() {
  const st = {
    game: 'confusion-waves', cloudVersion: 0,
    day: 1, role: null, switched: false, sanity: 70, uses: {},
    egg: { id: 'ovo-1', species: 'Ignavor', result: null },
    monsters: [monster('m1', 'Noctarn', 3, 5, 40, 'trevas'), monster('m2', 'Ignavor', 2, 5, 10, 'luz'), monster('m3', 'Vaelith', 2, 5, 5, 'luz')],
    bot: 0, successes: {}, failures: {},
    diamonds: 0, tickets: { permanente: 0, semanal: 0, evento: 0 }, endless: { floor: 1, best: 0, drops: {} }, eggs: [],
    esferas: { comum: 0, rara: 0, epica: 0, lendaria: 0, mitica: 0 }, login: { streak: 0, lastDay: 0 },
    pass: { season: '', xp: 0, claimed: 0, premium: false }, wild: null,
    ingredients: [
      { name: 'Raiz Luminosa', purity: 'luz', freshness: 1, rarity: 'comum', category: 'vegetal' },
      { name: 'Fungo Abissal', purity: 'trevas', freshness: 0.8, rarity: 'rara', category: 'fungo' },
      { name: 'Carne de Criatura', purity: 'neutra', freshness: 0.9, rarity: 'comum', category: 'parte_de_monstro' },
    ],
    charcoal: 2, pot: 'comum', rescue: null, battleOver: false, log: [],
    farm: { mapping: {}, unassigned: [] },
    resources: { sementes: 0, raizes: 0, minerio: 0, carvao: 0, peca: 0, madeira: 0, pedra: 0, cristal: 0, doce_halloween: 0, doce_solsticio: 0 },
  };
  const ovos = Y.applyReward(st, Y.starterReward()); // kit inicial: diamantes, fichas, esferas e um ovo
  for (let i = 0; i < ovos; i++) st.eggs.push(eggOf('Ignavor', 'natural', 'inicial'));
  return st;
}

let S = load() || newState();

function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); return s ? withDefaults(s) : null; } catch (_) { return null; }
}
// Saves antigos (local ou da nuvem) não têm os campos novos: completa com o padrão.
function withDefaults(s) {
  const d = newState();
  return {
    ...d, ...s,
    diamonds: s.diamonds ?? 0,
    tickets: { permanente: 0, semanal: 0, evento: 0, ...(s.tickets || {}) },
    esferas: { comum: 0, rara: 0, epica: 0, lendaria: 0, mitica: 0, ...(s.esferas || {}) },
    login: { streak: 0, lastDay: 0, ...(s.login || {}) },
    pass: { season: '', xp: 0, claimed: 0, premium: false, ...(s.pass || {}) },
    wild: s.wild ?? null,
    endless: { ...d.endless, ...(s.endless || {}) },
    eggs: s.eggs || [],
    monsters: (s.monsters || []).map(migrateMonster),
  };
}
// Versão anterior usava estrelas (star). Agora: raridade 1 a 5 e tier 1 a 10 (só o breed sobe o tier).
function migrateMonster(m) {
  if (m.rarity) return { tier: m.tier ?? m.rarity, variant: m.mutated ? 'mutante' : 'natural', ...m };
  const { star, ...rest } = m;
  const rarity = Math.min(5, Math.max(1, star ?? 1));
  return { ...rest, rarity, tier: Math.min(10, star ?? rarity), variant: 'natural' };
}
function save() {
  S.game = 'confusion-waves'; // saves antigos não têm o campo; o servidor exige
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) { /* navegador sem armazenamento: segue sem salvar */ }
  if (A.isEnabled() && A.email()) {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => cloudPush(), 1500);
  }
}
async function cloudPush() {
  try {
    const res = await A.push(S, S.cloudVersion);
    S.cloudVersion = res.version;
    notice = `Salvo na nuvem (versão ${res.version}).`;
  } catch (e) {
    notice = e.status === 409
      ? 'Outro aparelho salvou depois. Carregue da nuvem para continuar; nada foi sobrescrito.'
      : 'Não consegui salvar na nuvem agora. O progresso continua neste navegador.';
  }
  render();
}
function note(text) {
  S.log.unshift(`Dia ${S.day}: ${text}`);
  S.log = S.log.slice(0, 60);
}
const $ = (id) => document.getElementById(id);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pct = (x) => `${Math.round(x * 100)}%`;
const rarityTag = (m) => `<b class="rar rar-${C.rarityName(m.rarity)}">${RARITY_LABEL[C.rarityName(m.rarity)]}</b> · tier ${m.tier}`;

function render() {
  S.pass = Y.refreshPass(S.pass, Date.now());
  const ev = Y.activeEvents(Date.now());
  const loginNext = Y.nextLoginStreak(S.login, Date.now());
  const passLv = Y.passLevel(S.pass.xp);
  const band = C.sanityBand(S.sanity);
  const endlessR = C.endlessRewards(S.endless.floor, EVENT_ACTIVE);
  const bridge = C.bridgeState(S.day);
  const costume = S.role ? C.COSTUME[S.role] : 'base';
  $('app').innerHTML = `
  <header>
    <h1>Confusion Waves</h1>
    <div class="status">Dia <b>${S.day}</b> · Ponte <b class="${bridge}">${bridge}</b> · Caminho <b>${S.role ? (S.role === 'heroi' ? 'herói' : 'vilão') : 'não escolhido'}</b> · Traje <b>${costume}</b> · Diamantes <b>${S.diamonds}</b></div>
    <button data-act="reset" class="ghost">Reiniciar piloto</button>
  </header>

  <section>
    <h2>Conta</h2>
    ${accountHtml()}
  </section>

  <section>
    <h2>Início: login e escudo do começo</h2>
    <p class="muted">${Y.shieldActive(S.day) ? `Escudo do começo (dias 1 a ${Y.SHIELD_DAYS}): captura +${pct(Y.SHIELD_CAPTURE_BONUS)} e busca dá encontro em ${pct(Y.SHIELD_ENCOUNTER_CHANCE)}.` : 'Escudo do começo encerrado.'}</p>
    <p>Sequência de login: <b>${S.login.streak}</b> dia(s). ${loginNext ? `Hoje: dia ${loginNext} da sequência, com ${esc(rewardText(Y.loginRewardFor(loginNext)))}.` : 'Você já resgatou o login de hoje.'}</p>
    <button data-act="recompensaLogin" ${loginNext ? '' : 'disabled'}>Resgatar login de hoje</button>
  </section>

  <section>
    <h2>Eventos desta semana e deste mês</h2>
    ${evBlock(ev.semanal, 'semanal')}
    ${evBlock(ev.mensal, 'mensal')}
    <p class="muted">Monstrinhos exclusivos só aparecem em encontros enquanto o evento está ativo. Nada disso se compra com dinheiro.</p>
  </section>

  <section>
    <h2>Passe de batalha · temporada ${S.pass.season}</h2>
    <p>Nível <b>${passLv}</b> de ${Y.PASS_LEVELS} · XP ${S.pass.xp} · níveis resgatados ${S.pass.claimed}.</p>
    <p class="muted">XP por jogar: dia avançado +${Y.PASS_XP.dia}, andar da zona +${Y.PASS_XP.andar}, captura +${Y.PASS_XP.captura}, breed +${Y.PASS_XP.breed}, batalha final +${Y.PASS_XP.batalha}. Cada ${Y.PASS_XP_PER_LEVEL} de XP sobe um nível.</p>
    <button data-act="passClaim" ${passLv > S.pass.claimed ? '' : 'disabled'}>Resgatar ${Math.max(0, passLv - S.pass.claimed)} nível(is)</button>
    <p class="muted">Passe premium: só cosméticos. Não dá diamantes, esferas, fichas, ovos nem XP. Ainda não está no piloto.</p>
  </section>

  <section>
    <h2>Explorar e capturar</h2>
    ${S.wild ? wildBlock() : `<p class="muted">Chance de encontro nesta busca: ${pct(Y.encounterChance(S.day))}.</p><button data-act="search">Procurar monstrinho</button>`}
    <p class="muted">Esferas: ${C.RARITY.map((k) => `${RARITY_LABEL[k]} ${S.esferas[k]}`).join(' · ')}</p>
    <p class="muted">Compre esferas com diamantes ganhos no jogo:</p>
    ${C.RARITY.map((k) => `<button data-act="buySphere" data-k="${k}">Esfera ${RARITY_LABEL[k].toLowerCase()} (${Y.SPHERE_PRICE[k]} diamantes)</button>`).join('')}
  </section>

  <section>
    <h2>1. Caminho</h2>
    ${S.role ? `<p>Caminho atual: <b>${S.role === 'heroi' ? 'herói (traje de luz)' : 'vilão (traje de trevas)'}</b>.</p>
      ${!S.switched ? `<button data-act="switch">Trocar de lado (única vez, irreversível)</button>` : '<p class="muted">A troca de lado já foi usada.</p>'}`
      : `<p class="muted">A aparência base é a da escolha do caminho.</p>
         <button data-act="path" data-role="heroi">Herói (traje de luz)</button>
         <button data-act="path" data-role="vilao">Vilão (traje de trevas)</button>`}
  </section>

  <section>
    <h2>2. Dias e travessia</h2>
    <p>${bridge === 'fechada' ? 'A ponte está fechada desde o dia 4. Reabre no dia 8.' : 'A ponte está aberta.'}</p>
    <button data-act="day">Avançar dia</button>
    <button data-act="cross">Atravessar a ponte</button>
  </section>

  <section>
    <h2>3. Sanidade: <b>${S.sanity}</b> · ${band.name} · falha em ação comum ${pct(band.fail)}</h2>
    <div class="row">
      ${REPEATABLE_SOURCES.map((s) => `<button data-act="sanity" data-src="${s}">${SOURCE_LABEL[s]} (${S.uses[s] || 0}x)</button>`).join('')}
    </div>
    <div class="row">
      ${NON_REPEATABLE.map((s) => `<button class="danger" data-act="sanity" data-src="${s}">${SOURCE_LABEL[s]}</button>`).join('')}
    </div>
    <button data-act="explore">Explorar (ação comum)</button>
  </section>

  <section>
    <h2>4. Ovos</h2>
    ${S.egg.result ? `<p>Ovo inicial já chocado: <b>${esc(S.egg.result.species)}</b>, forma <b>${esc(S.egg.result.form)}</b>, sanidade fixada em ${S.egg.result.sanity_fixed}.</p>`
      : `<label>Sanidade no momento da eclosão: <input id="egg-sanity" type="range" min="0" max="100" value="${S.sanity}"></label>
         <p class="muted">Ovo inicial. Formas elegíveis: ${C.eligibleForms(S.sanity).join(', ')}.</p>
         <button data-act="hatch">Chocar ovo inicial</button>`}
    <p class="muted">Ovos do breed e da zona. Ao chocar, a raridade é rolada e o tier começa igual a ela.</p>
    <ul class="log">${S.eggs.map((e) => `<li>${eggTag(e)}Ovo de ${esc(e.species)} · forma ${esc(e.form)}${e.form === 'mutante' || e.form === 'combinada' ? ` (${esc(e.pureza)})` : ''} · ${ORIGIN_LABEL[e.origem] || e.origem} <button data-act="hatchEgg" data-id="${e.id}">Chocar</button></li>`).join('') || '<li class="muted">Nenhum ovo extra.</li>'}</ul>
  </section>

  <section>
    <h2>5. Cozinha</h2>
    <div class="row">
      <label>Ingrediente <select id="cook-base">${S.ingredients.map((i, k) => `<option value="${k}">${esc(i.name)} (${i.purity}, frescor ${Math.round(i.freshness * 100)}%)</option>`).join('')}</select></label>
      <label>Panela <select id="cook-pot">${Object.keys(C.POT_MAX).map((p) => `<option ${p === S.pot ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
      <label>Monstrinho <select id="cook-monster">${S.monsters.map((m) => `<option value="${m.id}">${m.species} (vínculo ${m.vinculo})</option>`).join('')}</select></label>
    </div>
    <p class="muted">Carvão: ${S.charcoal}</p>
    <button data-act="cook">Cozinhar</button>
  </section>

  <section>
    <h2>6. Breed</h2>
    <p class="muted">Breed usa o monstrinho principal e um ingrediente. O ingrediente é sempre consumido.
      Com sucesso: o principal sobe 1 tier (até 10), todas as aptidões sobem 1 nível e sai um ovo (natural, mutante ou abençoado).
      Na falha, só o ingrediente é perdido.</p>
    <div class="row">
      <label>Principal <select id="fuse-main" data-preview="prev-main">${S.monsters.map((m) => `<option value="${m.id}">${m.species} · ${RARITY_LABEL[C.rarityName(m.rarity)]} · tier ${m.tier}</option>`).join('')}</select></label>
      <label>Ingrediente <select id="fuse-ing" data-preview="prev-ing">${S.monsters.map((m, k) => `<option value="${m.id}" ${k === 1 ? 'selected' : ''}>${m.species} · ${RARITY_LABEL[C.rarityName(m.rarity)]} · tier ${m.tier}</option>`).join('')}</select></label>
      <label>Minério <select id="fuse-ore"><option value="0">nenhum</option><option value="0.06">Obsidiana Fissurada (+6%)</option></select></label>
      <label>Habilidade extra <select id="fuse-keep"><option value="new">trocar pela nova</option><option value="keep">manter a atual</option></select></label>
    </div>
    <div class="row"><span id="prev-main">${S.monsters[0] ? monstroTag(S.monsters[0]) : '-'}</span><span id="prev-ing">${S.monsters[1] ? monstroTag(S.monsters[1]) : '-'}</span></div>
    <p class="muted">Chance atual do principal selecionado: ${S.monsters.length ? pct(C.breedSuccessChance(S.monsters[0].tier, S.successes[S.monsters[0].id] || 0, S.failures[S.monsters[0].id] || 0)) : '-'}</p>
    <button data-act="breed">Fazer breed</button>
  </section>

  <section>
    <h2>7. Batalha final contra o bot (força ${S.bot})</h2>
    <p class="muted">Sem empate: vitória ou derrota. Derrota tira XP e fortalece o bot.</p>
    <label>Monstrinho <select id="battle-monster" data-preview="prev-battle">${S.monsters.map((m) => `<option value="${m.id}">${m.species} (XP ${m.xp})</option>`).join('')}</select></label> <span id="prev-battle">${S.monsters[0] ? monstroTag(S.monsters[0]) : '-'}</span>
    <p class="muted">Chance de vitória: ${pct(C.winChance(S.bot))}</p>
    <button data-act="battle" ${S.battleOver ? 'disabled' : ''}>Enfrentar o bot</button>
  </section>

  <section>
    <h2>8. Evento crítico: viajante ferido</h2>
    ${S.rescue ? `<p>Desfecho registrado: <b>${esc(S.rescue)}</b>. Não muda ao recarregar.</p>`
      : `<p>Socorrer pode acabar mal. O jogo pede confirmação antes de resolver.</p>
         <button data-act="rescue" class="danger">Socorrer viajante</button>
         <button data-act="appeal">Pedir apoio (saída segura)</button>`}
  </section>

  <section>
    <h2>Monstrinhos</h2>
    <div class="cards">
      ${S.monsters.map((m) => `<div class="card">
        ${spriteHtml(m, { aura: false })}
        <b>${esc(m.species)}</b> ${rarityTag(m)} · nível ${m.level}
        <div class="muted">XP ${m.xp} · vínculo ${m.vinculo} · pureza ${m.purity}</div>
        <div class="muted">${m.hybrid ? `híbrido · ${C.activeSlots(m)} ativas` : `${C.activeSlots(m)} ativas`}: ${esc(C.activeAbilities(m).join(', '))}</div>
        <div class="muted">aptidões: ${esc(Object.entries(m.aptitudes).map(([k, v]) => `${k} ${v}`).join(' · ') || 'nenhuma')}</div>
      </div>`).join('') || '<p class="muted">Nenhum monstrinho.</p>'}
    </div>
  </section>

  <section>
    <h2>9. Fazenda</h2>
    <p class="muted">Os monstrinhos trabalham por aptidão. A produção acontece ao avançar o dia.</p>
    <button data-act="assign">Designar tarefas da fazenda</button>
    <ul class="log">${Object.keys(S.farm.mapping).map((t) => {
      const m = S.monsters.find((x) => x.id === S.farm.mapping[t]);
      return `<li>${esc(t)}: ${m ? monstroTag(m) : '-'}</li>`;
    }).join('') || '<li class="muted">Nenhuma tarefa designada.</li>'}</ul>
    <p class="muted">Sem monstrinho: ${esc(S.farm.unassigned.join(', ') || 'nenhuma')}</p>
  </section>

  <section>
    <h2>10. Coleta automática (fazenda)</h2>
    <p class="muted">Não tem clique: os monstrinhos coletam ao avançar o dia, se tiverem a aptidão. Nível alto dá mais velocidade e bônus. Sem penalidade. A aptidão só sobe por fusão com sucesso.</p>
    <ul class="log">
      ${C.GATHER_TASKS ? Object.keys(C.GATHER_TASKS).map((t) => {
        const id = S.farm.mapping[t];
        const m = S.monsters.find((x) => x.id === id);
        return `<li>${esc(t)} → ${esc(C.GATHER_TASKS[t].resource)}: ${m ? `${monstroTag(m)} (nível ${m.aptitudes[t]})` : 'sem monstrinho com essa aptidão'}</li>`;
      }).join('') : ''}
    </ul>
    <p class="muted">Recursos: ${Object.entries(S.resources).map(([k, v]) => `${k} ${v}`).join(' · ')}</p>
  </section>

  <section>
    <h2>11. Zona infinita · andar ${S.endless.floor}</h2>
    <p class="muted">Andares sem fim. Vencer dá diamantes e fichas de invocação. A cada 10 andares sai um ovo de recompensa (raridade +1). Perder não tira nada: o andar recomeça.</p>
    <p>Recompensa deste andar: <b>${endlessR.diamantes}</b> diamantes${endlessR.invocacoes.map((i) => ` + ${i.qtd} ficha(s) ${BANNER_LABEL[i.banner]}`).join('')}${endlessR.ovo ? ' + ovo de recompensa' : ''}. Maior andar concluído: ${S.endless.best}.</p>
    <ul class="log">${S.monsters.map((m) => `<li>${monstroTag(m)}<span>${pct(C.endlessChance(m, S.endless.floor))} de vencer</span></li>`).join('') || '<li class="muted">Sem monstrinhos.</li>'}</ul>
    <label>Monstrinho <select id="endless-monster" data-preview="prev-endless">${S.monsters.map((m) => `<option value="${m.id}">${m.species} · tier ${m.tier}</option>`).join('')}</select></label> <span id="prev-endless">${S.monsters[0] ? monstroTag(S.monsters[0]) : '-'}</span>
    <button data-act="endless" ${S.monsters.length ? '' : 'disabled'}>Enfrentar andar ${S.endless.floor}</button>
  </section>

  <section>
    <h2>12. Diamantes e invocações</h2>
    <p>Diamantes: <b>${S.diamonds}</b></p>
    <p class="muted">Fichas: permanente ${S.tickets.permanente} · semanal ${S.tickets.semanal} · evento ${S.tickets.evento}</p>
    <label>Banner <select id="shop-banner">${Object.keys(C.BANNER_SHIFT).map((b) => `<option value="${b}">${BANNER_LABEL[b]}</option>`).join('')}</select></label>
    <button data-act="invoke">Invocar com 1 ficha</button>
    <button data-act="buy" data-qtd="1">Comprar 1 ficha (200 diamantes)</button>
    <button data-act="buy" data-qtd="10">Comprar 10 fichas (1500 diamantes)</button>
    <p class="muted">Diamantes e fichas só se ganham no jogo. Dinheiro real é só para cosméticos. Invocar mostra a raridade rolada, que o banner empurra para cima.</p>
  </section>

  <section>
    <h2>Registro</h2>
    ${lastTag()}
    <ul class="log registro">${S.log.map((l) => `<li>${esc(l)}</li>`).join('') || '<li class="muted">Nada ainda.</li>'}</ul>
  </section>`;
}

function accountHtml() {
  if (!A.isEnabled()) {
    return '<p class="muted">Conta indisponível: o servidor não está configurado. O progresso fica só neste navegador.</p>';
  }
  if (recovery) {
    return `<p>Defina uma nova senha.</p>
      <label>Nova senha <input id="acc-newpass" type="password" autocomplete="new-password"></label>
      <button data-act="setpass">Salvar nova senha</button>`;
  }
  if (!A.email()) {
    return `<div class="row">
        <label>E-mail <input id="acc-email" type="email" autocomplete="username"></label>
        <label>Senha <input id="acc-pass" type="password" autocomplete="current-password"></label>
      </div>
      <button data-act="login">Entrar</button>
      <button data-act="register">Criar conta</button>
      <button data-act="forgot">Esqueci a senha</button>
      <p class="muted">${esc(notice)}</p>`;
  }
  return `<p>Conectado como <b>${esc(A.email())}</b>.</p>
    <button data-act="pull">Carregar da nuvem</button>
    <button data-act="push">Salvar agora</button>
    <button data-act="logout">Sair</button>
    <p class="muted">${esc(notice)}</p>`;
}

async function onAccountEvent(event) {
  if (event === 'PASSWORD_RECOVERY') recovery = true;
  if (event === 'SIGNED_IN' && !recovery) {
    try {
      const cloud = await A.pull();
      if (cloud.save) {
        if (window.confirm('Há um save na nuvem. Carregar substitui o progresso deste navegador. Confirmar?')) {
          S = withDefaults(cloud.save);
          S.cloudVersion = cloud.version;
          notice = 'Save da nuvem carregado.';
          save();
        } else {
          notice = 'Save da nuvem não carregado.';
        }
      } else {
        S.cloudVersion = 0;
        await cloudPush();
      }
    } catch (_) {
      notice = 'Não consegui consultar a nuvem agora.';
    }
  }
  render();
}

async function accountAct(name) {
  const email = $('acc-email')?.value.trim() || '';
  const pass = $('acc-pass')?.value || '';
  try {
    if (name === 'login') { await A.signIn(email, pass); notice = 'Entrou.'; }
    if (name === 'register') { await A.signUp(email, pass); notice = 'Conta criada. Confirme o e-mail se o servidor pedir e depois entre.'; }
    if (name === 'forgot') { await A.resetPassword(email); notice = 'Se o e-mail existir, você recebe um link para criar nova senha.'; }
    if (name === 'logout') { await A.signOut(); notice = 'Saiu da conta. O progresso local continua neste navegador.'; }
    if (name === 'pull') {
      const cloud = await A.pull();
      if (!cloud.save) notice = 'Não há save na nuvem.';
      else { S = withDefaults(cloud.save); S.cloudVersion = cloud.version; notice = 'Save da nuvem carregado.'; save(); }
    }
    if (name === 'push') await cloudPush();
    if (name === 'setpass') {
      await A.setNewPassword($('acc-newpass')?.value || '');
      recovery = false;
      notice = 'Senha trocada.';
    }
  } catch (e) {
    notice = name === 'login' ? 'E-mail ou senha não conferem.' : `Não deu certo: ${e.message}`;
  }
  render();
}

function act(name, el) {
  if (['login', 'register', 'forgot', 'logout', 'pull', 'push', 'setpass'].includes(name)) return accountAct(name);
  S.pass = Y.refreshPass(S.pass, Date.now());
  const band = C.sanityBand(S.sanity);
  switch (name) {
    case 'path': {
      if (S.role) return;
      S.role = el.dataset.role;
      note(`caminho escolhido: ${S.role === 'heroi' ? 'herói' : 'vilão'} (traje ${C.COSTUME[S.role]}).`);
      break;
    }
    case 'switch': {
      if (!S.role || S.switched) return;
      S.role = S.role === 'heroi' ? 'vilao' : 'heroi';
      S.switched = true;
      note(`troca de lado feita (agora ${S.role === 'heroi' ? 'herói' : 'vilão'}). Não pode ser repetida.`);
      break;
    }
    case 'day': {
      S.day += 1;
      S.pass = Y.addPassXp(S.pass, 'dia');
      for (const task of Object.keys(S.farm.mapping)) {
        const m = S.monsters.find((x) => x.id === S.farm.mapping[task]);
        if (!m) continue;
        const prod = C.GATHER_TASKS[task] ? C.gatherDay(task, m.aptitudes[task]) : (C.PRODUCE[task] || {});
        for (const [res, qty] of Object.entries(prod)) {
          if (res === 'carvao') S.charcoal += qty; // carvão da fazenda vai para a cozinha
          else S.resources[res] = (S.resources[res] || 0) + qty;
        }
      }
      if (Object.keys(S.farm.mapping).length) note('a fazenda produziu enquanto você descansou.');
      if (S.day === 4) note('o vilão derruba a ponte. A rota comercial fecha.');
      if (S.day === 8) note('a ponte é reaberta. O comércio começa a se recuperar.');
      break;
    }
    case 'cross': {
      note(C.bridgeState(S.day) === 'aberta' ? 'você atravessou a ponte.' : 'a ponte está fechada.');
      break;
    }
    case 'sanity': {
      const src = el.dataset.src;
      const uses = S.uses[src] || 0;
      S.sanity = C.applyChange(S.sanity, src, uses, 0);
      if (REPEATABLE_SOURCES.includes(src)) S.uses[src] = uses + 1;
      note(`${SOURCE_LABEL[src]}: sanidade agora ${S.sanity} (${C.sanityBand(S.sanity).name}).`);
      break;
    }
    case 'explore': {
      const r = C.commonActionFailure(S.sanity, Math.random());
      note(r.falhou ? `ação comum com falha: ${r.efeito.replace(/_/g, ' ')}. O progresso segue.` : 'ação comum concluída sem falha.');
      break;
    }
    case 'hatch': {
      if (S.egg.result) return;
      const s = Number($('egg-sanity').value);
      const r = C.hatch(S.egg, s, Math.random());
      note(`ovo chocado com sanidade ${s}: ${r.species}, forma ${r.form}. Não pode ser chocado de novo.`);
      S.diamonds += C.diamondsForItem('comum'); // monstrinho novo na coleção
      break;
    }
    case 'cook': {
      if (S.charcoal < 1) { note('sem carvão para cozinhar.'); break; }
      const base = S.ingredients[Number($('cook-base').value)];
      const pot = $('cook-pot').value;
      const m = S.monsters.find((x) => x.id === $('cook-monster').value);
      const r = C.cook({ base, pot, charcoal: S.charcoal, skill: 0, roll: Math.random() });
      S.charcoal -= 1;
      S.pot = pot;
      if (m) m.vinculo = Math.max(0, Math.min(100, m.vinculo + r.vinculoDelta));
      if (!r.penalidade) S.diamonds += C.diamondsForItem(r.raridade);
      note(r.penalidade ? `cozinhar: ${r.penalidade}. Vínculo de ${m ? m.species : '-'} muda ${r.vinculoDelta}.`
        : `cozinhou ${r.nome} (${r.efeito}, ${r.raridade}). Vínculo de ${m ? m.species : '-'} sobe ${r.vinculoDelta}.`);
      break;
    }
    case 'breed': {
      const mainId = $('fuse-main').value, ingId = $('fuse-ing').value;
      if (mainId === ingId) { note('o breed precisa de dois monstrinhos diferentes.'); break; }
      const main = S.monsters.find((m) => m.id === mainId);
      const ing = S.monsters.find((m) => m.id === ingId);
      const ore = Number($('fuse-ore').value);
      const chance = C.breedSuccessChance(main.tier, S.successes[main.id] || 0, S.failures[main.id] || 0, ore);
      S.pass = Y.addPassXp(S.pass, 'breed');
      const roll = Math.random();
      S.monsters = S.monsters.filter((m) => m.id !== ing.id);  // o ingrediente é sempre consumido
      if (roll < chance) {
        const pool = C.activeAbilities(ing);
        const pick = pool[Math.floor(Math.random() * pool.length)];
        C.absorbAbility(main, pick, $('fuse-keep').value === 'new');
        C.breedSuccessEffects(main);
        const e = C.eggFor('breed', Math.random(), Math.random(), ing.purity);
        S.eggs.push(eggOf(main.species, e.form, 'breed', e.pureza));
        S.successes[main.id] = (S.successes[main.id] || 0) + 1;
        S.failures[main.id] = 0;
        note(`breed bem-sucedido: ${main.species} sobe para tier ${main.tier} e absorveu "${pick}". Saiu um ovo ${e.form}.`);
      } else {
        S.failures[main.id] = (S.failures[main.id] || 0) + 1;
        note(`breed falhou. ${ing.species} foi perdido; ${main.species} continua.`);
      }
      break;
    }
    case 'battle': {
      if (S.battleOver) return;
      const m = S.monsters.find((x) => x.id === $('battle-monster').value);
      if (!m) return;
      const won = Math.random() < C.winChance(S.bot);
      const res = C.finalBattle(won ? 'vitoria' : 'derrota', m, S.bot, 25);
      S.bot = res.bot;
      if (won) { S.battleOver = true; S.pass = Y.addPassXp(S.pass, 'batalha'); S.diamonds += C.diamondsForItem('lendaria'); note(`vitória contra o bot com ${m.species}. Campanha concluída (+${C.diamondsForItem('lendaria')} diamantes).`); }
      else note(`derrota para o bot. ${m.species} perdeu XP (agora ${m.xp}). O bot ficou mais forte (força ${S.bot}).`);
      break;
    }
    case 'rescue': {
      if (S.rescue) return;
      if (!window.confirm('Socorrer o viajante pode dar errado e custar caro. Confirmar?')) return;
      const ok = Math.random() < 0.5 + (S.sanity - 50) / 200;
      S.rescue = ok ? 'socorrido' : 'ataque_fatal';
      note(ok ? 'o viajante foi socorrido.' : 'o socorro saiu do controle. Há testemunhas e um desdobramento.');
      break;
    }
    case 'appeal': {
      if (S.rescue) return;
      S.rescue = 'apoio_solicitado';
      note('você pediu apoio. A cena segue por outra rota.');
      break;
    }
    case 'assign': {
      const workers = S.monsters.map((m) => ({ id: m.id, aptitudes: m.aptitudes }));
      const tasks = ['plantar', 'colher', 'cortar', 'minerar', 'garimpar', 'transportar', 'cozinhar', 'fabricar'];
      S.farm = C.assignTasks(tasks, workers);
      note(`tarefas da fazenda designadas. Sem monstrinho: ${S.farm.unassigned.join(', ') || 'nenhuma'}.`);
      break;
    }
    case 'endless': {
      const m = S.monsters.find((x) => x.id === $('endless-monster').value);
      if (!m) return;
      const floor = S.endless.floor;
      if (Math.random() >= C.endlessChance(m, floor)) {
        note(`andar ${floor}: ${m.species} não venceu. O andar recomeça; nada foi perdido.`);
        break;
      }
      const r = C.endlessRewards(floor, EVENT_ACTIVE, Math.random);
      S.diamonds += r.diamantes;
      for (const i of r.invocacoes) S.tickets[i.banner] += i.qtd;
      if (r.evento) S.endless.drops[r.evento] = (S.endless.drops[r.evento] || 0) + 1;
      if (r.ovo) {
        const e = C.eggFor('zona', Math.random(), Math.random(), null);
        S.eggs.push(eggOf(SPECIES[Math.floor(Math.random() * SPECIES.length)], e.form, 'zona', e.pureza));
      }
      S.endless.best = Math.max(S.endless.best, floor);
      S.endless.floor = floor + 1;
      S.pass = Y.addPassXp(S.pass, 'andar');
      const extra = r.invocacoes.map((i) => `, ${i.qtd} ficha(s) ${BANNER_LABEL[i.banner]}`).join('');
      note(`andar ${floor} concluído com ${m.species}: +${r.diamantes} diamantes${extra}${r.ovo ? ' + ovo de recompensa' : ''}${r.evento ? ' + doce de Halloween' : ''}.`);
      break;
    }
    case 'invoke': {
      const banner = $('shop-banner').value;
      if (!S.tickets[banner]) { note(`sem ficha do banner ${BANNER_LABEL[banner]}. Ganhe nos andares da zona ou compre com diamantes.`); break; }
      S.tickets[banner] -= 1;
      const r = C.invocationResult(banner, SPECIES, Math.random(), Math.random());
      const m = newMonster(r.species, r.rarity);
      S.monsters.push(m);
      S.last = m.id;
      const d = C.diamondsForItem(C.rarityName(r.rarity));
      S.diamonds += d;
      note(`invocação (${BANNER_LABEL[banner]}): ${m.species} ${RARITY_LABEL[C.rarityName(r.rarity)]}, tier ${m.tier}. Coleção: +${d} diamante(s).`);
      break;
    }
    case 'hatchEgg': {
      const egg = S.eggs.find((e) => e.id === el.dataset.id);
      if (!egg) return;
      S.eggs = S.eggs.filter((e) => e !== egg);
      const r = C.hatchEgg(egg, Math.random());
      const m = newMonster(r.species, r.rarity, r.purity, r.variant);
      S.monsters.push(m);
      S.last = m.id;
      const d = C.diamondsForItem(C.rarityName(r.rarity));
      S.diamonds += d;
      note(`ovo de ${r.species} chocou: ${RARITY_LABEL[C.rarityName(r.rarity)]}, tier ${r.tier}, forma ${r.form}. Coleção: +${d} diamante(s).`);
      break;
    }
    case 'buy': {
      const qtd = Number(el.dataset.qtd);
      const banner = $('shop-banner').value;
      try {
        const r = C.buyInvocations(S.diamonds, qtd);
        S.diamonds = r.diamonds;
        S.tickets[banner] += qtd;
        note(`comprou ${qtd} ficha(s) do banner ${BANNER_LABEL[banner]} por ${r.gasto} diamantes.`);
      } catch (_) {
        note(`diamantes insuficientes para ${qtd} ficha(s).`);
      }
      break;
    }
    case 'recompensaLogin': {
      const streak = Y.nextLoginStreak(S.login, Date.now());
      if (!streak) return;
      const txt = grant(Y.loginRewardFor(streak), 'login');
      S.login = { streak, lastDay: Y.brDayNumber(Date.now()) };
      note(`login do dia ${streak}: ${txt}.`);
      break;
    }
    case 'passClaim': {
      const antes = S.pass.claimed;
      const { reward, claimed } = Y.claimPass(S.pass);
      if (claimed <= antes) return;
      const txt = grant(reward, 'passe');
      S.pass = { ...S.pass, claimed };
      note(`passe: níveis ${antes + 1} a ${claimed} resgatados: ${txt}.`);
      break;
    }
    case 'buySphere': {
      try {
        const p = Y.buySphere(S, el.dataset.k);
        note(`comprou esfera ${RARITY_LABEL[el.dataset.k].toLowerCase()} por ${p} diamantes.`);
      } catch (e) {
        note(`não deu para comprar a esfera: ${e.message}.`);
      }
      break;
    }
    case 'search': {
      if (S.wild) return;
      const ts = Date.now();
      const ev = Y.activeEvents(ts);
      S.resources[ev.mensal.item] = (S.resources[ev.mensal.item] || 0) + 1; // a festa do mês deixa um doce a cada busca
      const w = Y.rollEncounter(ts, S.day, { r1: Math.random(), r2: Math.random(), r3: Math.random(), r4: Math.random() });
      if (!w) { note('a busca não achou nenhum monstrinho.'); break; }
      S.wild = w;
      note(`um ${w.species} apareceu${w.exclusivo ? ' (exclusivo do evento)' : ''}: ${RARITY_LABEL[C.rarityName(w.rarity)]}, tier ${w.tier}.`);
      break;
    }
    case 'throw': {
      const w = S.wild;
      if (!w) return;
      const k = $('sphere').value;
      if (!S.esferas[k]) { note(`sem esfera ${RARITY_LABEL[k].toLowerCase()}.`); break; }
      S.esferas[k] -= 1;
      const chance = Y.captureChance(C.RARITY.indexOf(k) + 1, w, Y.captureBonus(Date.now(), S.day));
      if (Math.random() < chance) {
        const nm = newMonster(w.species, w.rarity, w.purity);
        S.monsters.push(nm);
        S.last = nm.id;
        S.pass = Y.addPassXp(S.pass, 'captura');
        const d = C.diamondsForItem(C.rarityName(w.rarity));
        S.diamonds += d;
        note(`${w.species} capturado com esfera ${RARITY_LABEL[k].toLowerCase()} (chance ${pct(chance)}). Coleção: +${d} diamante(s).`);
      } else {
        note(`a esfera ${RARITY_LABEL[k].toLowerCase()} falhou (chance ${pct(chance)}); ${w.species} escapou.`);
      }
      dropEgg(w);
      S.wild = null;
      break;
    }
    case 'flee': {
      if (!S.wild) return;
      note(`você deixou ${S.wild.species} ir.`);
      dropEgg(S.wild);
      S.wild = null;
      break;
    }
    case 'reset': {
      if (!window.confirm('Reiniciar o piloto apaga o progresso deste navegador. Confirmar?')) return;
      S = newState();
      break;
    }
    default: return;
  }
  save();
  render();
}

A.onChange(onAccountEvent);
A.init().then(() => render());

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (el && !el.disabled) act(el.dataset.act, el);
});
document.addEventListener('change', (e) => {
  const t = e.target;
  if (!t.dataset || !t.dataset.preview) return;
  const m = S.monsters.find((x) => x.id === t.value);
  const out = $(t.dataset.preview);
  if (out) out.innerHTML = m ? monstroTag(m) : '-';
});
render();
