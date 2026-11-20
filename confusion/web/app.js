// Piloto jogável de Confusion Waves: fatia vertical dos sistemas do núcleo.
import * as C from './core.js';

const KEY = 'confusion-waves-piloto-v2';
const ABILITIES = {
  Noctarn: ['Mordida Umbral', 'Garra de Sombra', 'Chama Violeta', 'Uivo Sinistro', 'Véu Noturno'],
  Ignavor: ['Golpe Couraçado', 'Brasa Imperial', 'Juba Flamejante', 'Rugido Dourado', 'Escudo de Ferro'],
  Vaelith: ['Pulso Astral', 'Arco Ciano', 'Cauda de Cristal', 'Véu Gelado', 'Fenda Estelar'],
};
const REPEATABLE_SOURCES = ['descanso', 'purificacao', 'missao'];
const NON_REPEATABLE = ['trauma', 'magia_mental', 'crueldade', 'ritual'];
const SOURCE_LABEL = {
  descanso: 'Descansar', purificacao: 'Purificar', missao: 'Missão de recuperação',
  trauma: 'Sofrer trauma', magia_mental: 'Magia mental proibida', crueldade: 'Crueldade deliberada', ritual: 'Ritual de corrupção',
};

const APT = { Noctarn: ['minerar', 'transportar'], Ignavor: ['plantar', 'colher', 'transportar'], Vaelith: ['colher', 'fabricar'] };
const ART = { Noctarn: 'assets/monsters/noctarn/sprite-front.png' };
const monster = (id, species, star, level, xp, purity) => ({
  id, species, star, level, xp, purity, vinculo: 0,
  abilities: ABILITIES[species].slice(0, 4), extraAbility: null, hybrid: false, abilityLevels: {},
  aptitudes: APT[species] || [],
});

function newState() {
  return {
    day: 1, role: null, switched: false, sanity: 70, uses: {},
    egg: { id: 'ovo-1', species: 'Ignavor', result: null },
    monsters: [monster('m1', 'Noctarn', 3, 5, 40, 'trevas'), monster('m2', 'Ignavor', 2, 5, 10, 'luz'), monster('m3', 'Vaelith', 2, 5, 5, 'luz')],
    bot: 0, successes: {}, failures: {},
    ingredients: [
      { name: 'Raiz Luminosa', purity: 'luz', freshness: 1, rarity: 'comum', category: 'vegetal' },
      { name: 'Fungo Abissal', purity: 'trevas', freshness: 0.8, rarity: 'rara', category: 'fungo' },
      { name: 'Carne de Criatura', purity: 'neutra', freshness: 0.9, rarity: 'comum', category: 'parte_de_monstro' },
    ],
    charcoal: 2, pot: 'comum', rescue: null, battleOver: false, log: [],
    farm: { mapping: {}, unassigned: [] },
    resources: { sementes: 0, raizes: 0, minerio: 0, carvao: 0, peca: 0, madeira: 0, pedra: 0, cristal: 0 },
    tools: { machado: 1, picareta: 1 },
    nodes: [
      { id: 'arvore', label: 'Árvore', resource: 'madeira', requiredTool: 'machado', baseQty: 4, lastDay: -999, harvestsInWindow: 0 },
      { id: 'rocha', label: 'Rocha', resource: 'pedra', requiredTool: 'picareta', baseQty: 4, lastDay: -999, harvestsInWindow: 0 },
      { id: 'veio', label: 'Veio de cristal', resource: 'cristal', requiredTool: 'picareta', baseQty: 2, lastDay: -999, harvestsInWindow: 0 },
    ],
  };
}

let S = load() || newState();

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch (_) { return null; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) { /* navegador sem armazenamento: segue sem salvar */ }
}
function note(text) {
  S.log.unshift(`Dia ${S.day}: ${text}`);
  S.log = S.log.slice(0, 60);
}
const $ = (id) => document.getElementById(id);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pct = (x) => `${Math.round(x * 100)}%`;

function render() {
  const band = C.sanityBand(S.sanity);
  const bridge = C.bridgeState(S.day);
  const costume = S.role ? C.COSTUME[S.role] : 'base';
  $('app').innerHTML = `
  <header>
    <h1>Confusion Waves</h1>
    <div class="status">Dia <b>${S.day}</b> · Ponte <b class="${bridge}">${bridge}</b> · Caminho <b>${S.role ? (S.role === 'heroi' ? 'herói' : 'vilão') : 'não escolhido'}</b> · Traje <b>${costume}</b></div>
    <button data-act="reset" class="ghost">Reiniciar piloto</button>
  </header>

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
    <h2>4. Ovo ${S.egg.result ? '(já chocado)' : ''}</h2>
    ${S.egg.result ? `<p>Resultado fixado: <b>${esc(S.egg.result.species)}</b>, forma <b>${esc(S.egg.result.form)}</b>, sanidade fixada em ${S.egg.result.sanity_fixed}.</p>`
      : `<label>Sanidade no momento da eclosão: <input id="egg-sanity" type="range" min="0" max="100" value="${S.sanity}"></label>
         <p class="muted">Formas elegíveis: ${C.eligibleForms(S.sanity).join(', ')}.</p>
         <button data-act="hatch">Chocar ovo</button>`}
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
    <h2>6. Fusão</h2>
    <p class="muted">Na falha, só o ingrediente é perdido. O principal mantém espécie, elemento e nível.</p>
    <div class="row">
      <label>Principal <select id="fuse-main">${S.monsters.map((m) => `<option value="${m.id}">${m.species} ★${m.star}</option>`).join('')}</select></label>
      <label>Ingrediente <select id="fuse-ing">${S.monsters.map((m) => `<option value="${m.id}">${m.species} ★${m.star}</option>`).join('')}</select></label>
      <label>Minério <select id="fuse-ore"><option value="0">nenhum</option><option value="0.06">Obsidiana Fissurada (+6%)</option></select></label>
      <label>Habilidade extra <select id="fuse-keep"><option value="new">trocar pela nova</option><option value="keep">manter a atual</option></select></label>
    </div>
    <p class="muted">Chance atual do principal selecionado: ${S.monsters.length ? pct(C.fusionSuccessChance(S.monsters[0].star, S.successes[S.monsters[0].id] || 0, S.failures[S.monsters[0].id] || 0)) : '-'}</p>
    <button data-act="fuse">Fundir</button>
  </section>

  <section>
    <h2>7. Batalha final contra o bot (força ${S.bot})</h2>
    <p class="muted">Sem empate: vitória ou derrota. Derrota tira XP e fortalece o bot.</p>
    <label>Monstrinho <select id="battle-monster">${S.monsters.map((m) => `<option value="${m.id}">${m.species} (XP ${m.xp})</option>`).join('')}</select></label>
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
        ${ART[m.species] ? `<img src="${ART[m.species]}" alt="${esc(m.species)}">` : `<div class="noart">sem arte ainda</div>`}
        <b>${esc(m.species)}</b> ★${m.star} · nível ${m.level}
        <div class="muted">XP ${m.xp} · vínculo ${m.vinculo} · pureza ${m.purity}${m.mutated ? ' · mutação' : ''}</div>
        <div class="muted">${m.hybrid ? `híbrido · ${C.activeSlots(m)} ativas` : `${C.activeSlots(m)} ativas`}: ${esc(C.activeAbilities(m).join(', '))}</div>
        <div class="muted">aptidões: ${esc(m.aptitudes.join(', ') || 'nenhuma')}</div>
      </div>`).join('') || '<p class="muted">Nenhum monstrinho.</p>'}
    </div>
  </section>

  <section>
    <h2>9. Fazenda</h2>
    <p class="muted">Os monstrinhos trabalham por aptidão. A produção acontece ao avançar o dia.</p>
    <button data-act="assign">Designar tarefas da fazenda</button>
    <ul class="log">${Object.keys(S.farm.mapping).map((t) => {
      const m = S.monsters.find((x) => x.id === S.farm.mapping[t]);
      return `<li>${esc(t)}: ${m ? esc(m.species) : '-'}</li>`;
    }).join('') || '<li class="muted">Nenhuma tarefa designada.</li>'}</ul>
    <p class="muted">Sem monstrinho: ${esc(S.farm.unassigned.join(', ') || 'nenhuma')}</p>
  </section>

  <section>
    <h2>10. Coleta</h2>
    <p class="muted">Ferramentas: machado ${S.tools.machado}, picareta ${S.tools.picareta}. Retorno cai no mesmo dia e volta no dia seguinte.</p>
    <div class="row">${S.nodes.map((n) => `<button data-act="harvest" data-node="${n.id}">Coletar em ${n.label.toLowerCase()} (${n.requiredTool})</button>`).join('')}</div>
    <p class="muted">Recursos: ${Object.entries(S.resources).map(([k, v]) => `${k} ${v}`).join(' · ')}</p>
  </section>

  <section>
    <h2>Registro</h2>
    <ul class="log">${S.log.map((l) => `<li>${esc(l)}</li>`).join('') || '<li class="muted">Nada ainda.</li>'}</ul>
  </section>`;
}

function act(name, el) {
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
      for (const task of Object.keys(S.farm.mapping)) {
        for (const [res, qty] of Object.entries(C.PRODUCE[task])) {
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
      note(r.penalidade ? `cozinhar: ${r.penalidade}. Vínculo de ${m ? m.species : '-'} muda ${r.vinculoDelta}.`
        : `cozinhou ${r.nome} (${r.efeito}, ${r.raridade}). Vínculo de ${m ? m.species : '-'} sobe ${r.vinculoDelta}.`);
      break;
    }
    case 'fuse': {
      const mainId = $('fuse-main').value, ingId = $('fuse-ing').value;
      if (mainId === ingId) { note('a fusão precisa de dois monstrinhos diferentes.'); break; }
      const main = S.monsters.find((m) => m.id === mainId);
      const ing = S.monsters.find((m) => m.id === ingId);
      const ore = Number($('fuse-ore').value);
      const chance = C.fusionSuccessChance(main.star, S.successes[main.id] || 0, S.failures[main.id] || 0, ore);
      const roll = Math.random();
      S.monsters = S.monsters.filter((m) => m.id !== ing.id);  // o ingrediente é sempre consumido
      if (roll < chance) {
        const pool = C.activeAbilities(ing);
        const pick = pool[Math.floor(Math.random() * pool.length)];
        const keepNew = $('fuse-keep').value === 'new';
        C.absorbAbility(main, pick, keepNew);
        S.successes[main.id] = (S.successes[main.id] || 0) + 1;
        S.failures[main.id] = 0;
        note(`fusão bem-sucedida: ${main.species} absorveu "${pick}". Agora é híbrido com ${C.activeSlots(main)} habilidades ativas.`);
      } else {
        S.failures[main.id] = (S.failures[main.id] || 0) + 1;
        note(`fusão falhou. ${ing.species} foi perdido; ${main.species} continua.`);
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
      if (won) { S.battleOver = true; note(`vitória contra o bot com ${m.species}. Campanha concluída.`); }
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
      const workers = S.monsters.map((m) => ({ id: m.id, level: m.level, aptitudes: m.aptitudes }));
      const tasks = ['plantar', 'colher', 'minerar', 'transportar', 'cozinhar', 'fabricar'];
      S.farm = C.assignTasks(tasks, workers);
      note(`tarefas da fazenda designadas. Sem monstrinho: ${S.farm.unassigned.join(', ') || 'nenhuma'}.`);
      break;
    }
    case 'harvest': {
      const node = S.nodes.find((n) => n.id === el.dataset.node);
      if (!node) return;
      const fail = Math.random() < band.fail;
      const r = C.harvest(node, node.requiredTool, S.day, fail);
      S.resources[r.resource] = (S.resources[r.resource] || 0) + r.qty;
      note(`coletou ${r.qty}x ${r.resource} em ${node.label.toLowerCase()}${r.ferimento ? ' (ferimento leve, quantidade reduzida)' : ''}.`);
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

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (el && !el.disabled) act(el.dataset.act, el);
});
render();
