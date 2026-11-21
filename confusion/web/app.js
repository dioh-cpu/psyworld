// Piloto jogável de Confusion Waves: fatia vertical dos sistemas do núcleo.
import * as C from './core.js';
import * as A from './account.js';
import * as Y from './systems.js';
import * as E from './species.js';
import * as Mundo from './mundo/index.js';
import * as CB from './combate.js';

const KEY = 'confusion-waves-piloto-v3';
let recovery = false;      // true quando o link de recuperação de senha foi aberto
let pushTimer = null;
let notice = '';           // mensagem curta da área de conta
// Habilidades, aptidões e arte vêm do catálogo de espécies (species.js).
const ABILITIES = E.HABILIDADES_DA_ESPECIE;
const REPEATABLE_SOURCES = ['descanso', 'purificacao', 'missao'];
const NON_REPEATABLE = ['trauma', 'magia_mental', 'crueldade', 'ritual'];
const SOURCE_LABEL = {
  descanso: 'Descansar', purificacao: 'Purificar', missao: 'Missão de recuperação',
  trauma: 'Sofrer trauma', magia_mental: 'Magia mental proibida', crueldade: 'Crueldade deliberada', ritual: 'Ritual de corrupção',
};

// Aptidões de trabalho (1 a 10) e arte, também do catálogo.
const APT = E.APTIDOES_DA_ESPECIE;
const ART = E.ARTE_DA_ESPECIE;
const EVENT_ACTIVE = true; // há sempre um evento mensal ativo no calendário; o item de drop é provisório
const monster = (id, species, rarity, level, xp, purity, variant = 'natural', classe = 'comum', origem = 'base') => ({
  id, species, rarity, tier: rarity, variant, classe, origem, level, xp, purity, vinculo: 0, elemento: E.ELEMENTO_DA_ESPECIE[species] ?? 'neutro',
  abilities: ABILITIES[species].slice(0, 4), extraAbility: null, hybrid: false, abilityLevels: {},
  aptitudes: { ...(APT[species] || {}) },
  passivas: E.PASSIVA_DA_ESPECIE[species] ? [E.PASSIVA_DA_ESPECIE[species]] : [],
});
const SPECIES = Y.BASE_SPECIES; // todas saem de ovo, breed ou invocação: nenhuma espécie é só de pagamento
const PURITY_BY_SPECIES = Y.SPECIES_PURITY;
const RARITY_LABEL = { comum: 'Comum', rara: 'Rara', epica: 'Épica', lendaria: 'Lendária', mitica: 'Mítica', boss: 'Boss' };
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
// Monstrinhos em breed não entram em outro breed. Ingrediente: mesmo tier, com usos e fora de breed.
const ocupados = () => C.idsEmBreed(S.breeds);
const elegiveis = (main) => {
  if (!main || ocupados().has(main.id)) return [];
  const oc = ocupados();
  return S.monsters.filter((m) => !oc.has(m.id) && !C.ingredientStatus(main, m));
};
const opcoesIngrediente = (main) => {
  const ops = elegiveis(main);
  return ops.length ? ops.map((m) => `<option value="${m.id}">${m.species} · tier ${m.tier} · usos ${m.usosIngrediente || 0}/${C.INGREDIENT_MAX_USES}</option>`).join('') : '<option value="">nenhum ingrediente elegível</option>';
};
const breedLivre = (main) => S.breeds.length < C.BREED_SLOTS && elegiveis(main).length > 0;
const faltaTexto = (fim) => {
  const seg = Math.max(0, Math.ceil((fim - Date.now()) / 1000));
  return `faltam ${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`;
};
const breedLinha = (b) => `<li>${esc(b.mainNome)} + ${esc(b.ingNome)} · <span class="contagem" data-fim="${b.fim}">${faltaTexto(b.fim)}</span></li>`;
// Contexto que o mundo recebe a cada rodada ou ação. Os efeitos voltam e são aplicados no jogo.
const contextoMundo = () => ({
  dia: S.day, r: Math.random, sanidade: S.sanity, ponteFechada: C.bridgeState(S.day) === 'fechada',
  recursos: S.resources, diamantes: S.diamonds, caminho: S.role,
  monstros: S.monsters.map((m) => ({ id: m.id, species: m.species, classe: m.classe })),
});
function aplicarMundo(res) {
  for (const n of res.notas || []) note(n);
  const e = res.efeitos || {};
  if (e.sanidade) S.sanity = C.clamp(S.sanity + e.sanidade, 0, 100);
  if (e.diamantes) S.diamonds = Math.max(0, S.diamonds + e.diamantes);
  if (e.gold) S.gold = Math.max(0, S.gold + e.gold);
  for (const [k, v] of Object.entries(e.recursos || {})) S.resources[k] = Math.max(0, (S.resources[k] || 0) + v);
}
// Seção do mundo: os 50 sistemas, com o resumo de cada um e as ações disponíveis.
const GRUPOS_MUNDO = [['01 a 10'], ['11 a 20'], ['21 a 30'], ['31 a 40'], ['41 a 50']];
function mundoHtml() {
  const grupos = GRUPOS_MUNDO.map(([rotulo], g) => {
    const itens = Mundo.SISTEMAS.slice(g * 10, g * 10 + 10).map((sis) => {
      const acoes = Object.entries(sis.acoes || {}).map(([chave, a]) => {
        const opcoes = Mundo.OPCOES_ACAO[`${sis.id}.${chave}`];
        const lista = opcoes ? opcoes(S.mundo) : [{ rotulo: '', args: {} }];
        return lista.map((o) => `<button data-act="mundoAcao" data-sis="${sis.id}" data-acao="${chave}" data-args="${esc(JSON.stringify(o.args))}">${esc(a.rotulo)}${o.rotulo ? ` · ${esc(o.rotulo)}` : ''}</button>`).join('');
      }).join('');
      return `<div class="mundo-sis"><b>${sis.id} · ${esc(sis.nome)}</b>
        <div class="muted">${esc(sis.resumo(S.mundo[sis.id]))}</div>
        <div class="muted">Referência: ${esc(sis.referencia)}</div>
        ${acoes}</div>`;
    }).join('');
    return `<details><summary>Sistemas ${rotulo}</summary>${itens}</details>`;
  }).join('');
  return `<section><h2>13. Mundo: 50 sistemas (em teste)</h2>
    <p class="muted">Cada sistema avança a cada dia e pode mudar sanidade, recursos e diamantes. Abra um grupo para ver e usar as ações.</p>
    ${grupos}</section>`;
}

// Tempo em mm:ss (cronômetro do Speedrun e do Desafio).
const tempoTexto = (ms) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const campanhaNome = (dif, c = S.campanha) => (dif === 'normal' ? 'Normal' : dif === 'speedrun' ? 'Speedrun' : nomeDesafio(c.desafioNivel + 1));
// Campanha (v1.36): botões das dificuldades, cronômetro e recordes.
function campanhaHtml() {
  const c = S.campanha;
  const agora = c.correndo
    ? `<p>Em andamento: <b>${campanhaNome(c.correndo.dif)}</b> · tempo ${tempoTexto(Date.now() - c.correndo.inicio)}.</p>`
    : '<p class="muted">Nenhuma campanha em andamento. Escolha uma dificuldade para começar: o bot volta à força 0.</p>';
  const botoes = Y.CAMPANHA_DIFICULDADES.map((d) => {
    const lib = Y.campanhaLiberada(c, d);
    const rotulo = d === 'desafio' ? `Desafio ${c.desafioNivel + 1}` : campanhaNome(d);
    return `<button data-act="campanhaIniciar" data-dif="${d}" ${lib ? '' : 'disabled'}>${rotulo}${lib ? '' : ' (bloqueada)'}</button>`;
  }).join(' ');
  return `${agora}<p class="muted">Zeradas: normal ${c.concluidas.normal} · speedrun ${c.concluidas.speedrun} · desafio ${c.concluidas.desafio}. Melhor speedrun: ${c.melhorSpeedrun ? tempoTexto(c.melhorSpeedrun) : '-'}.</p><p>${botoes}</p>`;
}
// Torres temáticas (v1.36): duas, uma por tema (semana e mês). Cada uma tem dificuldades liberadas por zerar o topo.
function torresHtml() {
  const ts = Date.now();
  S.torres = S.torres || {};
  const cards = Y.TORRES.map((torre) => {
    const t = Y.torreDoPeriodo(S.torres[torre.id], torre, ts);
    S.torres[torre.id] = t;
    const tema = torre.periodo === 'semana' ? Y.activeEvents(ts).semanal : Y.activeEvents(ts).mensal;
    const andar = Y.andarDaTorre(t, t.nivel);
    const concluida = andar > torre.andares;
    const niveis = [0, 1, 2, 3].map((n) => `<button data-act="torreNivel" data-torre="${torre.id}" data-n="${n}" ${n > t.liberada || n === t.nivel ? 'disabled' : ''}>${n === 0 ? 'Normal' : `Dificuldade ${n} (+${n * 30}% drop)`}</button>`).join(' ');
    const m0 = S.monsters[0];
    return `<div class="card-torre">
      <p><b>${esc(torre.nome)}</b> · tema ${esc(tema.nome)} · elemento ${ELEMENTO_LABEL[Y.elementoDaTorre(torre, ts)]} · item ${esc(itemNome(Y.itemDaTorre(torre, ts)))}</p>
      <p>Andar ${Math.min(andar, torre.andares)} de ${torre.andares}${concluida ? ' · concluída nesta dificuldade' : ''}. Dificuldade escolhida: ${t.nivel}. Liberadas até: ${t.liberada}. Recorde: andar ${(S.recordes || {})[torre.id] || 0}.</p>
      <p>${niveis}</p>
      <button data-act="torreSubir" data-torre="${torre.id}" ${concluida || !m0 ? 'disabled' : ''}>Subir o andar ${Math.min(andar, torre.andares)}</button>
      ${m0 && !concluida ? `<p class="muted">Chance com ${esc(m0.species)}: ${pct(Y.chanceTorre(m0, torre, ts, andar, t.nivel))}. Chefes nos andares 5, 10, 15 e 20.</p>` : ''}
    </div>`;
  }).join('');
  return `<section>
    <h2>Torres temáticas · duas ativas agora</h2>
    <p class="muted">Separadas da campanha, mas dá para usar a qualquer hora para pegar diamantes, o item do tema e ajudar a campanha. Cada dificuldade dá +30% de drop; até 3 extras. Zerar o topo libera a próxima.</p>
    ${S.monsters.length ? `<label>Monstrinho <select id="torre-monster">${S.monsters.map((m) => `<option value="${m.id}">${esc(m.species)} · nível ${m.level}</option>`).join('')}</select></label>` : '<p class="muted">Precisa de um monstrinho.</p>'}
    ${cards}
  </section>`;
}
// Elementos (v1.34): rótulos, elemento do bot pela força e chance de vencer o bot com o elemento aplicado.
const ELEMENTO_LABEL = { fogo: 'Fogo', agua: 'Água', planta: 'Planta', terra: 'Terra', luz: 'Luz', trevas: 'Trevas', neutro: 'Neutro' };
const botElemento = (bot) => ['fogo', 'agua', 'planta'][bot % 3];
const chanceBot = (m) => C.winChance(S.bot, m.level, C.multElemento(m.elemento, botElemento(S.bot)));
// Texto de XP do monstrinho: progresso no nível atual e quanto falta para o próximo.
const xpTexto = (m) => {
  const nivel = m.level ?? C.nivelDeXp(m.xp);
  if (nivel >= C.LEVEL_MAX) return `nível máximo · XP ${m.xp}`;
  return `XP ${m.xp} (${m.xp - C.xpDoNivel(nivel)}/${C.xpParaProximo(nivel)} até o nível ${nivel + 1})`;
};
// Balanceamento (provisório): as tabelas saem das constantes do código, então mostram o que o jogo usa.
function balanceHtml() {
  const esferas = ['comum', 'rara', 'epica', 'lendaria'];
  const captura = esferas.map((k) => {
    const i = C.RARITY.indexOf(k) + 1;
    return `<tr><th>${RARITY_LABEL[k]}</th>${[1, 2, 3, 4, 5].map((r) => `<td>${pct(Y.captureChance(i, { rarity: r, tier: r }, 0))}</td>`).join('')}</tr>`;
  }).join('');
  const goldMedio = C.RARITY_WEIGHTS.reduce((a, w, i) => a + w * Y.goldEncontro(i + 1), 0);
  const goldPorBusca = Y.ENCOUNTER_CHANCE * goldMedio;
  const buscasPorEsfera = Math.ceil(Y.SPHERE_PRICE.comum.valor / goldPorBusca);
  const niveis = Array.from({ length: C.LEVEL_MAX }, (_, i) => i + 1).map((n) => `<tr><td>${n}</td><td>${C.xpDoNivel(n)}</td><td>${n < C.LEVEL_MAX ? C.xpParaProximo(n) : '-'}</td><td>x${C.fatorNivel(n).toFixed(2)}</td><td>${pct(C.winChance(0, n))}</td></tr>`).join('');
  return `<section>
    <h2>Balanceamento (provisório, para testar)</h2>
    <p class="muted">Tabelas calculadas pelo próprio código. Ao mudar as constantes em systems.js e core.js, elas mudam junto.</p>
    <h3>Chance de captura por esfera e raridade do monstrinho</h3>
    <table class="bal"><tr><th>Esfera / raridade</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th></tr>${captura}</table>
    <p class="muted">Bônus de evento e do escudo (dias 1 a ${Y.SHIELD_DAYS}) somam nas esferas comum, rara e épica. A lendária fica em ${pct(Y.CAPTURE.lendaria)} fixos (teto da época). A esfera mítica fica em ${pct(Y.CAPTURE.mitica)} fixos e só sai do resgate do evento sazonal. Monstrinho mítico aparece na exploração em 1%. Piso ${pct(Y.CAPTURE.min)}, teto ${pct(Y.CAPTURE.max)}.</p>
    <h3>Gold</h3>
    <ul class="log">
      <li>Fim de cada encontro (captura, fuga ou falha): 5 gold × raridade = ${[1, 2, 3, 4, 5].map((r) => Y.goldEncontro(r)).join(', ')}.</li>
      <li>Zona infinita: ${Y.goldAndar(1)} gold no andar 1, ${Y.goldAndar(10)} no andar 10, ${Y.goldAndar(20)} no andar 20.</li>
      <li>Batalha final vencida: ${Y.GOLD.batalhaFinal}. Marcos da trilha de evento: 50 missões dão 100 gold. Venda de 5 madeira no mercado: cerca de 12 (depende do preço do dia).</li>
      <li>Kit inicial: ${Y.STARTER_KIT.gold} gold. Ganho médio por busca: ${goldPorBusca.toFixed(1)} gold (chance de encontro ${pct(Y.ENCOUNTER_CHANCE)}; ${pct(Y.SHIELD_ENCOUNTER_CHANCE)} nos dias de escudo).</li>
      <li>Preços: esfera comum ${Y.SPHERE_PRICE.comum.valor} gold (cerca de ${buscasPorEsfera} buscas de ganho), rara ${Y.SPHERE_PRICE.rara.valor} gold, épica ${Y.SPHERE_PRICE.epica.valor} gold, lendária ${Y.SPHERE_PRICE.lendaria.valor} diamantes.</li>
    </ul>
    <h3>Elementos: quem ataca (linha) contra quem defende (coluna)</h3>
    <table class="bal"><tr><th>Ataca / defende</th>${C.ELEMENTOS.map((d) => `<th>${ELEMENTO_LABEL[d]}</th>`).join('')}</tr>${['fogo', 'agua', 'planta', 'luz', 'trevas'].map((a) => `<tr><th>${ELEMENTO_LABEL[a]}</th>${C.ELEMENTOS.map((d) => { const v = C.multElemento(a, d); return `<td>${v === 1 ? '·' : `${v}x`}</td>`; }).join('')}</tr>`).join('')}</table>
    <p class="muted">Fogo > planta > água > fogo (2x; 0,5x no sentido contrário). Luz e trevas se anulam (2x). Terra e neutro: 1x. No andar infinito, o elemento do andar gira em ciclo de 5. Contra os bosses de raid e contra o bot, o elemento entra na chance.</p>
    <h3>XP do monstrinho</h3>
    <ul class="log">
      <li>Captura: 5 × raridade (5 a 25 XP). Breed, monstrinho principal: ${C.XP_FONTE.breed}.</li>
      <li>Zona infinita: vitória ${C.XP_FONTE.andarVitoria(1)} XP no andar 1 e ${C.XP_FONTE.andarVitoria(20)} no andar 20; andar não vencido ${C.XP_FONTE.andarDerrota}.</li>
      <li>Batalha final: vitória +${C.XP_FONTE.batalhaVitoria} XP; derrota −${C.XP_FONTE.batalhaDerrota} XP, sem cair abaixo do nível atual.</li>
      <li>Efeitos: força na zona × (1 + 4% por nível acima do 1); chance de vencer o bot +1 ponto por nível.</li>
      <li>Passe de batalha (XP separado, zera a cada mês): nível k custa 30 + 6k XP, 30 níveis. Dia +${Y.PASS_XP.dia}, andar +${Y.PASS_XP.andar}, captura 10 + 5 × raridade, breed +${Y.PASS_XP.breed}, raid +${Y.PASS_XP.raid}, batalha +${Y.PASS_XP.batalha}. Premium: ${Y.PREMIUM_PRICE} diamantes, compra única.</li>
    </ul>
    <table class="bal"><tr><th>Nível</th><th>XP total</th><th>XP até o próximo</th><th>Força</th><th>Vencer o bot (bot na força 0)</th></tr>${niveis}</table>
    <details><summary>Quanto custa cada nível em XP (sem fontes)</summary><p class="muted">Cada nível pede 10 XP a mais que o anterior, começando em 40.</p></details>
    <h3>Passe de batalha: custo de cada nível (30 níveis por mês)</h3>
    <p class="muted">Nível k custa 30 + 6k XP. O total para completar k níveis é 3k² + 33k. Premium: ${Y.PREMIUM_PRICE} diamantes, compra única.</p>
    <table class="bal"><tr><th>Nível</th><th>XP do nível</th><th>XP acumulado</th><th>Nível</th><th>XP do nível</th><th>XP acumulado</th></tr>${Array.from({ length: 15 }, (_, i) => i + 1).map((k) => `<tr><td>${k}</td><td>${Y.passCustoNivel(k)}</td><td>${Y.passXpAteNivel(k)}</td><td>${k + 15}</td><td>${Y.passCustoNivel(k + 15)}</td><td>${Y.passXpAteNivel(k + 15)}</td></tr>`).join('')}</table>
  </section>`;
}

const lastTag = () => { const m = S.monsters.find((x) => x.id === S.last); return m ? `<p>Último monstrinho: ${monstroTag(m)}</p>` : ''; };
const BANNER_LABEL = { permanente: 'permanente', semanal: 'semanal', evento: 'evento' };
const uid = (p) => `${p}${Date.now()}${Math.floor(Math.random() * 1000)}`;
const newMonster = (species, rarity, purity, variant = 'natural', classe = 'comum', origem = 'base') => monster(uid('m'), species, rarity, 1, 0, purity ?? PURITY_BY_SPECIES[species], variant, classe, origem);
const CLASSE_BANNER = { permanente: 'comum', semanal: 'semanal', evento: 'evento' }; // força por origem (GDD v1.29)
const eggOf = (species, form, origem, pureza = 'neutra', tier = null) => ({ ...C.makeEgg(species, form, origem, pureza, tier), id: uid('e') });
const ORIGIN_LABEL = { breed: 'breed', zona: 'recompensa da zona', login: 'login diário', passe: 'passe de batalha', selvagem: 'drop selvagem', inicial: 'kit inicial', evento: 'trilha do evento', raid: 'raid' };
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
const evBlock = (e, tipo) => tipo === 'mensal'
  ? `<p><b>${e.nome}</b> (dura 1 mês) · onírico de evento: <b>${esc(e.exclusivo)}</b> · captura +${pct(e.bonus.captura)} · drop +${pct(e.bonus.drop)}</p>`
  : `<p><b>${e.nome}</b> (semana) · captura +${pct(e.bonus.captura)} · drop +${pct(e.bonus.drop)}. Sem onírico exclusivo.</p>`;
// Recompensa de evento (trilha, marcos e dias): aplica no estado e devolve o texto. Os doces são do evento mensal do momento.
function aplicarRecompensa(r, ev) {
  const partes = [];
  if (r.gold) { S.gold += r.gold; partes.push(`${r.gold} gold`); }
  if (r.diamantes) { S.diamonds += r.diamantes; partes.push(`${r.diamantes} diamantes`); }
  if (r.evento) { S.tickets.evento += r.evento; partes.push(`${r.evento} ficha(s) de evento`); }
  if (r.doce) { S.resources[ev.item] = (S.resources[ev.item] || 0) + r.doce; partes.push(`${r.doce} doce(s) de ${ev.nome}`); }
  if (r.mitica) { S.esferas.mitica = (S.esferas.mitica || 0) + r.mitica; partes.push(`${r.mitica} esfera(s) mítica`); }
  if (r.ovo) { S.eggs.push(eggOf(ev.exclusivo, 'natural', 'evento', 'neutra')); partes.push('1 ovo de evento'); }
  return partes.join(', ') || 'nada';
}
// Conta uma missão da trilha (captura, andar, breed, prato ou raid). Só conta nos 7 primeiros dias do mês.
function contarMissao() {
  const ts = Date.now();
  S.trilha = Y.trilhaDoMes(S.trilha, ts);
  const r = Y.contaMissao(S.trilha, ts);
  S.trilha = r.t;
  if (r.marco) note(`marco da trilha: ${aplicarRecompensa(r.marco, Y.monthlyEventAt(ts))}.`);
}
const recTexto = (r) => Object.entries(r).map(([k, v]) => ({
  gold: `${v} gold`, diamantes: `${v} diamantes`, evento: `${v} ficha(s) de evento`, doce: `${v} doce(s)`, ovo: `${v} ovo(s) de evento`, mitica: `${v} esfera(s) mítica`,
})[k]).join(', ');
// Trilha do evento mensal: página 1 (missões, dias e resgate) e página 2 (cópias, liberada depois do resgate).
function trilhaHtml() {
  const ts = Date.now();
  S.trilha = Y.trilhaDoMes(S.trilha, ts);
  const t = S.trilha;
  const ev = Y.monthlyEventAt(ts);
  const pagina = S.trilhaPagina === 2 && t.resgatado ? 2 : 1;
  const dias = Object.keys(Y.TRILHA_DIAS).map(Number).map((d) => {
    const feito = t.dias.includes(d);
    const pronto = Y.diaResgatavel(t, ts, d);
    return `<li>Dia ${d}: ${recTexto(Y.TRILHA_DIAS[d])} ${feito ? '<span class="muted">resgatado</span>' : `<button data-act="trilhaDia" data-dia="${d}" ${pronto ? '' : 'disabled'}>Resgatar</button>`}</li>`;
  }).join('');
  const resgatavel = Y.eventoResgatavel(t, ts);
  const preco = Y.copiaPreco(t);
  const doces = S.resources[ev.item] || 0;
  return `<p><b>Trilha de ${esc(ev.nome)}</b> · dia ${Y.diaDoMes(ts)} do mês. Dias 1 a 7: ${Y.TRILHA.meta} missões (captura, andar da zona, breed, prato ou raid). Do dia 7, com ${Y.TRILHA.resgate} ou mais, resgata <b>${esc(ev.exclusivo)}</b>. O evento dura o mês todo.</p>
    <p><button data-act="trilhaPagina" data-p="1" ${pagina === 1 ? 'disabled' : ''}>Página 1 · missões</button>
    <button data-act="trilhaPagina" data-p="2" ${t.resgatado ? '' : 'disabled'}>Página 2 · cópias${t.resgatado ? '' : ' (libera após o resgate)'}</button></p>
    ${pagina === 1 ? `<p><progress value="${Math.min(t.missoes, Y.TRILHA.meta)}" max="${Y.TRILHA.meta}"></progress> ${t.missoes}/${Y.TRILHA.meta} missões</p>
      <ul class="log">${dias}</ul>
      <p class="muted">Marcos (caem na hora): 25 missões, ficha de evento · 50, 100 gold · 75, 20 diamantes · 100, 2 doces · 125, ficha de evento · 150, ovo de evento. O resgate do onírico dá 1 esfera mítica.</p>
      <button data-act="trilhaResgatar" ${resgatavel ? '' : 'disabled'}>${t.resgatado ? `${esc(ev.exclusivo)} já resgatado neste mês` : `Resgatar ${esc(ev.exclusivo)}`}</button>
      ${!resgatavel && !t.resgatado ? `<p class="muted">O resgate abre no dia ${Y.TRILHA.dias}, com ${Y.TRILHA.resgate} missões ou mais.</p>` : ''}`
    : `<p>Cópias extras de ${esc(ev.exclusivo)}: ${t.copias} de ${Y.TRILHA.copiasMax}. Doces de ${esc(ev.nome)}: ${doces}.</p>
      <button data-act="trilhaCopia" ${preco === null || doces < preco ? 'disabled' : ''}>${preco === null ? 'Cópias esgotadas' : `Comprar cópia por ${preco} doces`}</button>`}`;
}
// Raid boss: aberto 60 minutos a cada 2 horas. Uma tentativa por raid.
function raidHtml() {
  const ts = Date.now();
  const r = Y.raidAt(ts);
  const usou = S.raid.janela === r.janela;
  const estado = r.aberto ? `aberto até ${Y.horaBrasilia(r.inicioMs + Y.RAID.duracaoMin * 60000)}` : `fechado; abre às ${Y.horaBrasilia(r.proximoMs)}`;
  const lista = Y.RAID_BOSSES.map((b) => {
    const n = S.fragmentos[b.id] || 0;
    const pronto = n >= Y.RAID.fragmentosParaOvo;
    return `<li>${esc(b.nome)} (${b.pureza}): ${n}/${Y.RAID.fragmentosParaOvo} fragmentos ${pronto ? `<button data-act="raidOvo" data-boss="${b.id}">Chocar ovo de raid</button>` : ''}</li>`;
  }).join('');
  const m0 = S.monsters[0];
  return `<section>
    <h2>Raid boss · a cada 2 horas</h2>
    <p>Agora: <b>${esc(r.boss.nome)}</b> (elemento ${ELEMENTO_LABEL[r.boss.elemento]}) · ${estado} (horário de Brasília).</p>
    ${m0 ? `<label>Monstrinho <select id="raid-monster">${S.monsters.map((m) => `<option value="${m.id}">${esc(m.species)} · nível ${m.level}</option>`).join('')}</select></label>
      <button data-act="raid" ${r.aberto && !usou ? '' : 'disabled'}>${usou ? 'Tentativa já usada nesta raid' : `Atacar ${esc(r.boss.nome)}`}</button>
      <p class="muted">Chance de vencer com ${esc(m0.species)}: ${pct(Y.chanceRaid(m0, r.boss))}. Vitória dá 1 fragmento (2 em 20% das vezes) e ${C.XP_FONTE.raidVitoria} XP.</p>` : '<p class="muted">Você precisa de um monstrinho para atacar.</p>'}
    <ul class="log">${lista}</ul>
    <p class="muted">Fragmentos são de cada boss: ${Y.RAID.fragmentosParaOvo} deles viram um ovo de raid. O ovo sai de tier 10 a 15. Ao chocar, 40% saem boss (acima da mítica) e 60% saem mítica.</p>
  </section>`;
}
// Transferência: o monstrinho de origem passa os atributos ao destino e é apagado.
function transferHtml() {
  const opt = (m, comCusto) => `<option value="${m.id}">${esc(m.species)} · ${RARITY_LABEL[C.rarityName(m.rarity)]} · tier ${m.tier} · ${esc(ORIGIN_LABEL[m.origem] || m.origem || 'base')}${comCusto ? ` · sai por ${Y.custoTransferencia(m)} diamantes` : ''}</option>`;
  return `<section>
    <h2>Transferir atributos</h2>
    <p class="muted">Achou um monstrinho melhor e quer passar o progresso de outro para ele? O de <b>origem</b> passa raridade, tier, nível, XP, aptidões, habilidades, pureza e variante ao <b>destino</b>, e <b>é apagado</b>. O destino mantém espécie, id e passivas próprias (até 2). Custo em diamantes pelo tipo da origem: base ${Y.TRANSFERENCIA.base}, banner ${Y.TRANSFERENCIA.banner}, evento ${Y.TRANSFERENCIA.evento}, raid ${Y.TRANSFERENCIA.raid}. No máximo (tier 10 mítica, ou tier 15 boss), dobra.</p>
    ${S.monsters.length < 2 ? '<p class="muted">Precisa de dois monstrinhos.</p>' : `
    <label>Origem (será apagado) <select id="tr-origem">${S.monsters.map((m) => opt(m, true)).join('')}</select></label>
    <label>Destino (recebe) <select id="tr-destino">${S.monsters.map((m) => opt(m, false)).join('')}</select></label>
    <button data-act="transferir" class="danger">Transferir</button>`}
  </section>`;
}
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
    monsters: [monster('m1', 'Noctarn', 3, 5, C.xpDoNivel(5), 'trevas'), monster('m2', 'Ignavor', 2, 5, C.xpDoNivel(5), 'luz'), monster('m3', 'Vaelith', 2, 5, C.xpDoNivel(5), 'luz')],
    bot: 0, successes: {}, failures: {},
    diamonds: 0, gold: 0, tickets: { permanente: 0, semanal: 0, evento: 0 }, endless: { floor: 1, best: 0, drops: {}, dificuldade: 0 }, pocoes: { pequena: 5, media: 0, grande: 0 }, auto: { ativo: false, combate: true, zona: false, limiar: 0.35, esferas: [], habilidades: [], pocoes: [] }, combate: null, recordes: { semana: 0, mes: 0 }, eggs: [],
    esferas: { comum: 0, rara: 0, epica: 0, lendaria: 0, mitica: 0 }, login: { streak: 0, lastDay: 0 },
    pity: { permanente: 0, semanal: 0, evento: 0 }, pityT5: { permanente: 0, semanal: 0, evento: 0 }, torres: {}, campanha: Y.campanhaNova(), trilha: null, trilhaPagina: 1, semana: null, raid: { janela: null }, fragmentos: {}, mundo: Mundo.criarMundo(),
    pass: { season: '', xp: 0, claimed: 0, premium: false }, wild: null, breeds: [],
    ingredients: [
      { name: 'Raiz Luminosa', purity: 'luz', freshness: 1, rarity: 'comum', category: 'vegetal' },
      { name: 'Fungo Abissal', purity: 'trevas', freshness: 0.8, rarity: 'rara', category: 'fungo' },
      { name: 'Carne de Criatura', purity: 'neutra', freshness: 0.9, rarity: 'comum', category: 'parte_de_monstro' },
    ],
    charcoal: 2, pot: 'comum', rescue: null, battleOver: false, log: [],
    farm: { mapping: {}, unassigned: [] },
    resources: { sementes: 0, raizes: 0, minerio: 0, carvao: 0, peca: 0, madeira: 0, pedra: 0, cristal: 0, comida: 0, agua: 0, agua_purificadora: 0, doce_halloween: 0, doce_solsticio: 0, doce_lua: 0, doce_fartura: 0, doce_cristal: 0, petala_lua: 0, espiga_fartura: 0, estilhaco_cristal: 0 },
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
    gold: s.gold ?? 0,
    tickets: { permanente: 0, semanal: 0, evento: 0, ...(s.tickets || {}) },
    pity: { permanente: 0, semanal: 0, evento: 0, ...(s.pity || {}) },
    pityT5: { permanente: 0, semanal: 0, evento: 0, ...(s.pityT5 || {}) },
    torres: s.torres || {},
    pocoes: { pequena: 0, media: 0, grande: 0, ...(s.pocoes || {}) },
    auto: { ativo: false, combate: true, zona: false, limiar: 0.35, esferas: [], habilidades: [], pocoes: [], ...(s.auto || {}) },
    combate: s.combate ?? null,
    recordes: { semana: 0, mes: 0, ...(s.recordes || {}) },
    campanha: { ...Y.campanhaNova(), ...(s.campanha || {}) },
    missoes: { semanal: null, mensal: null, ...(s.missoes || {}) },
    mundo: { ...Mundo.criarMundo(), ...(s.mundo || {}) },
    esferas: { comum: 0, rara: 0, epica: 0, lendaria: 0, mitica: 0, ...(s.esferas || {}) },
    login: { streak: 0, lastDay: 0, ...(s.login || {}) },
    pass: { season: '', xp: 0, claimed: 0, premium: false, ...(s.pass || {}) },
    wild: s.wild ?? null,
    endless: { ...d.endless, ...(s.endless || {}) },
    eggs: s.eggs || [],
    breeds: s.breeds || [],
    monsters: (s.monsters || []).map(migrateMonster).map(alinharNivel),
  };
}
// Nível e XP precisam bater: o XP mínimo do nível é garantido e o nível sai do XP. Saves antigos tinham nível sem XP.
function alinharNivel(m) {
  const level = Math.min(C.LEVEL_MAX, Math.max(1, m.level ?? 1));
  const xp = Math.max(m.xp ?? 0, C.xpDoNivel(level));
  return { ...m, xp, level: C.nivelDeXp(xp), origem: m.origem ?? 'base', elemento: m.elemento ?? E.ELEMENTO_DA_ESPECIE[m.species] ?? 'neutro', passivas: m.passivas ?? (E.PASSIVA_DA_ESPECIE[m.species] ? [E.PASSIVA_DA_ESPECIE[m.species]] : []) };
}
// Versão anterior usava estrelas (star). Agora: raridade 1 a 5 e tier 1 a 10 (só o breed sobe o tier).
function migrateMonster(m) {
  if (m.rarity) return { tier: m.tier ?? m.rarity, variant: m.mutated ? 'mutante' : 'natural', classe: 'comum', ...m };
  const { star, ...rest } = m;
  const rarity = Math.min(5, Math.max(1, star ?? 1));
  return { ...rest, rarity, tier: Math.min(10, star ?? rarity), variant: 'natural', classe: 'comum' };
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
  const sel = capturarSelecoes();
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
    <div class="status">Dia <b>${S.day}</b> · Ponte <b class="${bridge}">${bridge}</b> · Caminho <b>${S.role ? (S.role === 'heroi' ? 'herói' : 'vilão') : 'não escolhido'}</b> · Traje <b>${costume}</b> · Gold <b>${S.gold}</b> · Diamantes <b>${S.diamonds}</b></div>
    <button data-act="reset" class="ghost">Reiniciar piloto</button>
  </header>

  ${combateHtml()}
  ${autoHtml()}

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
    ${trilhaHtml()}
    <p class="muted">Monstrinhos de evento não aparecem em encontros: saem de missões. Nada disso se compra com dinheiro.</p>
  </section>

  <section>
    <h2>Passe de batalha · temporada ${S.pass.season}</h2>
    <p>Nível <b>${passLv}</b> de ${Y.PASS_LEVELS} · XP ${S.pass.xp}${passLv < Y.PASS_LEVELS ? ` · faltam ${Y.passXpAteNivel(passLv + 1) - S.pass.xp} XP para o nível ${passLv + 1} (o nível custa ${Y.passCustoNivel(passLv + 1)} XP)` : ' · nível máximo'}.</p>
    ${passLv < Y.PASS_LEVELS ? `<p><progress value="${S.pass.xp - Y.passXpAteNivel(passLv)}" max="${Y.passCustoNivel(passLv + 1)}"></progress></p>` : ''}
    <p class="muted">XP por jogar: dia avançado +${Y.PASS_XP.dia}, andar da zona +${Y.PASS_XP.andar}, captura 10 + 5 × raridade (15 a 35), breed +${Y.PASS_XP.breed}, raid vencido +${Y.PASS_XP.raid}, batalha final +${Y.PASS_XP.batalha}. Total para completar k níveis: 3k² + 33k XP.</p>
    ${(() => { const falta = Math.max(passLv - S.pass.claimed, S.pass.premium ? passLv - (S.pass.claimedPremium || 0) : 0); return `<button data-act="passClaim" ${falta > 0 ? '' : 'disabled'}>Resgatar ${Math.max(0, falta)} prêmio(s)</button>`; })()}
    <p>Premium: ${S.pass.premium ? '<b>ativo</b>. Cada nível dá ouro, esferas, fichas e ovos extras. O nível 30 dá um T5 aleatório (nunca de evento).' : `compra única por ${Y.PREMIUM_PRICE} diamantes, vale para todas as temporadas. Você tem ${S.diamonds}.`}</p>
    ${S.pass.premium ? '' : `<button data-act="passPremium" ${S.diamonds >= Y.PREMIUM_PRICE ? '' : 'disabled'}>Comprar premium (${Y.PREMIUM_PRICE} diamantes)</button>`}
    <p class="muted">O premium só dá itens do jogo, pagos com diamantes ganhos aqui. Dinheiro real continua só para cosméticos.</p>
  </section>

  <section>
    <h2>Explorar e capturar</h2>
    ${S.wild ? wildBlock() : `<p class="muted">Chance de encontro nesta busca: ${pct(Y.encounterChance(S.day))}.</p><button data-act="search">Procurar monstrinho</button>`}
    <p class="muted">Esferas: ${C.RARITY.map((k) => `${RARITY_LABEL[k]} ${S.esferas[k]}`).join(' · ')}</p>
    <p class="muted">Esferas comuns, raras e épicas se compram com gold. A lendária custa diamantes e captura com 90% fixos. A <b>esfera mítica</b> não se compra: sai 1 por mês, no resgate do onírico do evento sazonal (${S.esferas.mitica || 0} na mão). Captura com 75% fixos.</p>
    ${C.RARITY.filter((k) => Y.SPHERE_PRICE[k]).map((k) => `<button data-act="buySphere" data-k="${k}">Esfera ${RARITY_LABEL[k].toLowerCase()} (${Y.SPHERE_PRICE[k].valor} ${Y.SPHERE_PRICE[k].moeda === 'gold' ? 'gold' : 'diamantes'})</button>`).join('')}
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
    <ul class="log">${S.eggs.map((e) => `<li>${eggTag(e)}Ovo de ${esc(e.species)} · forma ${esc(e.form)}${e.form === 'mutante' || e.form === 'combinada' ? ` (${esc(e.pureza)})` : ''}${e.tier ? ` · tier ${e.tier}` : ''} · ${ORIGIN_LABEL[e.origem] || e.origem} <button data-act="hatchEgg" data-id="${e.id}">Chocar</button></li>`).join('') || '<li class="muted">Nenhum ovo extra.</li>'}</ul>
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
    <p class="muted">Breed usa o principal e um ingrediente do mesmo tier. Leva 10 minutos em média. Dá para ter até 3 breeds ao mesmo tempo, e um monstrinho só pode estar em um breed por vez.
      O ingrediente serve até 3 vezes e nunca some. Com sucesso: o principal ganha 1 nível em todas as aptidões, absorve uma habilidade do ingrediente e sai um ovo, que pode vir com tier acima do principal.</p>
    <div class="row">
      <label>Principal <select id="fuse-main" data-preview="prev-main">${S.monsters.map((m) => `<option value="${m.id}">${m.species} · ${RARITY_LABEL[C.rarityName(m.rarity)]} · tier ${m.tier}${ocupados().has(m.id) ? ' (em breed)' : ''}</option>`).join('')}</select></label>
      <label>Ingrediente <select id="fuse-ing" data-preview="prev-ing">${opcoesIngrediente(S.monsters[0])}</select></label>
      <label>Minério <select id="fuse-ore"><option value="0">nenhum</option><option value="0.06">Obsidiana Fissurada (+6%)</option></select></label>
      <label>Habilidade extra <select id="fuse-keep"><option value="new">trocar pela nova</option><option value="keep">manter a atual</option></select></label>
    </div>
    <div class="row"><span id="prev-main">${S.monsters[0] ? monstroTag(S.monsters[0]) : '-'}</span><span id="prev-ing">${elegiveis(S.monsters[0])[0] ? monstroTag(elegiveis(S.monsters[0])[0]) : '-'}</span></div>
    <p class="muted" id="chance-main">Chance atual do principal selecionado: ${S.monsters.length ? pct(C.breedSuccessChance(S.monsters[0].tier, S.successes[S.monsters[0].id] || 0, S.failures[S.monsters[0].id] || 0)) : '-'}</p>
    <button data-act="breed" ${breedLivre(S.monsters[0]) ? '' : 'disabled'}>Iniciar breed</button>
    <p class="muted">Espaços em uso: ${S.breeds.length} de ${C.BREED_SLOTS}.</p>
    <ul class="log">${S.breeds.map(breedLinha).join('') || '<li class="muted">Nenhum breed em andamento.</li>'}</ul>
  </section>

  <section>
    <h2>7. Campanha · batalha final contra o bot (força ${S.bot})</h2>
    <p class="muted">Sem empate. Derrota tira XP e fortalece o bot. Speedrun libera ao zerar a Normal; o Desafio libera ao zerar o Speedrun, e cada Desafio zerado sobe o nível.</p>
    ${campanhaHtml()}
    <label>Monstrinho <select id="battle-monster" data-preview="prev-battle">${S.monsters.map((m) => `<option value="${m.id}">${m.species} (nível ${m.level}, XP ${m.xp})</option>`).join('')}</select></label> <span id="prev-battle">${S.monsters[0] ? monstroTag(S.monsters[0]) : '-'}</span>
    <p class="muted">O bot é de ${ELEMENTO_LABEL[botElemento(S.bot)]}. Chance com o primeiro monstrinho: ${S.monsters[0] ? pct(chanceBot(S.monsters[0])) : '-'}. Cada nível soma 1 ponto; elemento vantajoso dobra a chance.</p>
    <button data-act="battle" ${S.campanha.correndo ? '' : 'disabled'}>Enfrentar o bot</button>
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
        <b>${esc(m.species)}</b> ${rarityTag(m)} · elemento ${ELEMENTO_LABEL[m.elemento] ?? 'neutro'} · nível ${m.level}
        <div class="muted">${xpTexto(m)} · vínculo ${m.vinculo} · pureza ${m.purity}</div>
        <div class="muted">${m.hybrid ? `híbrido · ${C.activeSlots(m)} ativas` : `${C.activeSlots(m)} ativas`}: ${esc(C.activeAbilities(m).join(', '))}</div>
        <div class="muted">aptidões: ${esc(Object.entries(m.aptitudes).map(([k, v]) => `${k} ${v}`).join(' · ') || 'nenhuma')}</div>
        ${(m.passivas || []).length ? `<div class="muted">passivas: ${esc(m.passivas.map((p) => p.nome).join(', '))}</div>` : ''}
        ${(m.abilities || []).length > 4 ? `<div class="muted">habilidades aprendidas: ${esc(m.abilities.join(', '))}</div>` : ''}
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

  ${torresHtml()}

  <section>
    <h2>11. Zona infinita · andar ${S.endless.floor}</h2>
    <p class="muted">Andares sem fim. Vencer dá diamantes e fichas de invocação. A cada 10 andares sai um ovo de recompensa (raridade +1). Perder não tira nada: o andar recomeça.</p>
    <p>Dificuldade: ${[0, 1, 2, 3].map((n) => `<button data-act="endlessDif" data-n="${n}" ${n > Y.difEndlessLiberada(S.endless.best) || n === (S.endless.dificuldade || 0) ? 'disabled' : ''}>${n === 0 ? 'Normal' : `Dificuldade ${n} (+${n * 30}% drop, +${n * 25}% força)`}</button>`).join(' ')}. Liberada até ${Y.difEndlessLiberada(S.endless.best)}: a cada 10 andares concluídos.</p>
    <p>Elemento deste andar: <b>${ELEMENTO_LABEL[C.elementoDoAndar(S.endless.floor)]}</b>. Vantagem dá 2x de poder, desvantagem 0,5x.</p>
    <p>Recompensa deste andar: <b>${endlessR.diamantes}</b> diamantes${endlessR.invocacoes.map((i) => ` + ${i.qtd} ficha(s) ${BANNER_LABEL[i.banner]}`).join('')}${endlessR.ovo ? ' + ovo de recompensa' : ''}. Maior andar concluído: ${S.endless.best}.</p>
    <ul class="log">${S.monsters.map((m) => `<li>${monstroTag(m)}<span>${pct(C.endlessChance(m, S.endless.floor, S.endless.dificuldade || 0))} de vencer</span></li>`).join('') || '<li class="muted">Sem monstrinhos.</li>'}</ul>
    <label>Monstrinho <select id="endless-monster" data-preview="prev-endless">${S.monsters.map((m) => `<option value="${m.id}">${m.species} · tier ${m.tier}</option>`).join('')}</select></label> <span id="prev-endless">${S.monsters[0] ? monstroTag(S.monsters[0]) : '-'}</span>
    <button data-act="endless" ${S.monsters.length ? '' : 'disabled'}>Enfrentar andar ${S.endless.floor}</button>
  </section>

  <section>
    <h2>12. Diamantes e invocações</h2>
    <p>Diamantes: <b>${S.diamonds}</b></p>
    <p class="muted">Fichas: permanente ${S.tickets.permanente} · semanal ${S.tickets.semanal} · evento ${S.tickets.evento}</p>
    <p class="muted">Garantia do destaque (sem sair em ${C.PITY_FEATURED} invocações): permanente ${S.pity.permanente}/${C.PITY_FEATURED} · semanal ${S.pity.semanal}/${C.PITY_FEATURED} · evento ${S.pity.evento}/${C.PITY_FEATURED}. Destaque de cada banner: ${Object.entries(C.BANNER_FEATURED).map(([b, e]) => `${BANNER_LABEL[b]} = ${e}`).join(', ')}, 5% por invocação.</p>
    <label>Banner <select id="shop-banner">${Object.keys(C.BANNER_WEIGHTS).map((b) => `<option value="${b}">${BANNER_LABEL[b]}</option>`).join('')}</select></label>
    <button data-act="invoke" data-qtd="1">Invocar x1 (1 ficha)</button>
    <button data-act="invoke" data-qtd="10">Invocar x10 (10 fichas, tier 4 garantido)</button>
    <button data-act="invoke" data-qtd="50">Invocar x50 (50 fichas, tier 4 a cada 10)</button>
    <button data-act="buy" data-qtd="1">Comprar 1 ficha (200 diamantes)</button>
    <button data-act="buy" data-qtd="10">Comprar 10 fichas (1500 diamantes)</button>
    <p class="muted">Como cada ficha se ganha: <b>permanente</b> = compra com diamantes, login, passe e kit inicial (a compra só vale para este banner). <b>Semanal</b> = 1 ficha a cada 3 capturas da semana, até 4. <b>Evento</b> = trilha do evento, andares da zona a cada 15 e marcos.</p>
    <p class="muted">Tier 5 (mítica) sai por chance, ou garantido após 150 invocações sem ele. Atual: permanente ${S.pityT5.permanente}/${C.PITY_TIER5} · semanal ${S.pityT5.semanal}/${C.PITY_TIER5} · evento ${S.pityT5.evento}/${C.PITY_TIER5}. Cada 10 invocações garantem tier 4.</p>
    <p class="muted">Diamantes e fichas só se ganham no jogo. Dinheiro real é só para cosméticos. Invocar mostra a raridade rolada, que o banner empurra para cima.</p>
  </section>

  ${raidHtml()}

  ${transferHtml()}

  ${balanceHtml()}

  ${mundoHtml()}

  <section>
    <h2>Registro</h2>
    ${lastTag()}
    <ul class="log registro">${S.log.map((l) => `<li>${esc(l)}</li>`).join('') || '<li class="muted">Nada ainda.</li>'}</ul>
  </section>`;
  restaurarSelecoes(sel);
}

// Cada ação redesenha a página. Os seletores lembram a escolha do jogador entre um redesenho e outro.
function capturarSelecoes() {
  const out = {};
  document.querySelectorAll('select[id]').forEach((el) => { out[el.id] = el.value; });
  out.__abertos = [...document.querySelectorAll('details')].map((d) => d.open);
  return out;
}
function restaurarSelecoes(sel) {
  if (sel.__abertos) document.querySelectorAll('details').forEach((d, i) => { d.open = !!sel.__abertos[i]; });
  for (const [id, v] of Object.entries(sel)) {
    if (id.startsWith('__')) continue;
    const el = $(id);
    if (!el || !el.options || ![...el.options].some((o) => o.value === v)) continue;
    el.value = v;
    if (el.dataset.preview) {
      const m = S.monsters.find((x) => x.id === v);
      const out = $(el.dataset.preview);
      if (out) out.innerHTML = m ? monstroTag(m) : '-';
    }
  }
  if ($('fuse-main')) syncBreed(sel['fuse-ing']);
}
// Atualiza o breed para o principal escolhido: lista de ingredientes, prévias, chance e botão.
function syncBreed(ingAnterior = null) {
  const main = S.monsters.find((m) => m.id === $('fuse-main').value);
  $('fuse-ing').innerHTML = opcoesIngrediente(main);
  if (ingAnterior && [...$('fuse-ing').options].some((o) => o.value === ingAnterior)) $('fuse-ing').value = ingAnterior;
  const ing = S.monsters.find((m) => m.id === $('fuse-ing').value);
  $('prev-main').innerHTML = main ? monstroTag(main) : '-';
  $('prev-ing').innerHTML = ing ? monstroTag(ing) : '-';
  $('chance-main').textContent = main ? `Chance atual do principal selecionado: ${pct(C.breedSuccessChance(main.tier, S.successes[main.id] || 0, S.failures[main.id] || 0))}` : '';
  const btn = document.querySelector('button[data-act="breed"]');
  if (btn) btn.disabled = !breedLivre(main);
}
// Quando um breed termina, o resultado entra no jogo (ingrediente já foi gasto no início).
// ---- Exploração, combate por turnos e automático (v1.37) ----
const TIPO_LABEL = { zona: 'zona infinita', torre: 'torre temática', raid: 'raid boss', campanha: 'campanha' };
const ITEM_LABEL = { petala_lua: 'Pétala da Lua', espiga_fartura: 'Espiga da Fartura', estilhaco_cristal: 'Estilhaço de Cristal', doce_halloween: 'Doce de Halloween', doce_solsticio: 'Doce do Solstício', doce_lua: 'Doce da Lua', doce_fartura: 'Doce da Fartura', doce_cristal: 'Doce de Cristal' };
const itemNome = (k) => ITEM_LABEL[k] || k;
const nomeDesafio = (n) => (n === 1 ? 'Pesadelo' : n === 2 ? 'Lenda' : `Infinito ${n - 2}`);
const AUTO_LIMIARES = [0.25, 0.35, 0.5];
const AUTO_OPCOES = { esferas: ['comum', 'rara', 'epica', 'lendaria', 'mitica'], pocoes: ['pequena', 'media', 'grande'] };
const todasHabilidades = () => [...new Set(S.monsters.flatMap((m) => C.activeAbilities(m)))];
const opcoesAuto = (g) => (g === 'habilidades' ? todasHabilidades() : AUTO_OPCOES[g]);
const rotuloAuto = (g, v) => (g === 'esferas' ? `Esfera ${RARITY_LABEL[v].toLowerCase()}` : g === 'pocoes' ? CB.POCOES[v].nome : v);
const qtdAuto = (g, v) => (g === 'esferas' ? (S.esferas[v] || 0) : g === 'pocoes' ? (S.pocoes[v] || 0) : null);
const autoPausa = (texto) => { S.auto.ativo = false; note(texto); };

// Exploração: procurar, lançar esfera e deixar ir. Manual e automático usam as mesmas funções.
function procurar() {
  if (S.wild) return;
  const ts = Date.now();
  const ev = Y.activeEvents(ts);
  S.resources[ev.mensal.item] = (S.resources[ev.mensal.item] || 0) + 1; // a festa do mês deixa um doce a cada busca
  const w = Y.rollEncounter(ts, S.day, { r1: Math.random(), r2: Math.random(), r3: Math.random(), r4: Math.random() });
  if (!w) { note('a busca não achou nenhum monstrinho.'); return; }
  S.wild = w;
  note(`um ${w.species} apareceu${w.exclusivo ? ' (exclusivo do evento)' : ''}: ${RARITY_LABEL[C.rarityName(w.rarity)]}, tier ${w.tier}.`);
}
function lancar(k) {
  const w = S.wild;
  if (!w) return;
  if (!S.esferas[k]) { note(`sem esfera ${RARITY_LABEL[k].toLowerCase()}.`); return; }
  S.esferas[k] -= 1;
  const chance = Y.captureChance(C.RARITY.indexOf(k) + 1, w, Y.captureBonus(Date.now(), S.day));
  const gold = Y.goldEncontro(w.rarity); // o encontro paga gold ao terminar, capturado ou não
  S.gold += gold;
  if (Math.random() < chance) {
    const nm = newMonster(w.species, w.rarity, w.purity);
    const xp = C.ganharXp(nm, C.XP_FONTE.captura(w.rarity));
    S.monsters.push(nm);
    S.last = nm.id;
    S.pass = Y.addPassXp(S.pass, 'captura', Y.passXpCaptura(w.rarity));
    contarMissao();
    const sem = Y.contaCapturaSemanal(S.semana, Date.now()); // fichas semanais: 1 a cada 3 capturas da semana
    S.semana = sem.s;
    S.tickets.semanal += sem.fichas;
    const d = C.diamondsForItem(C.rarityName(w.rarity));
    S.diamonds += d;
    note(`${w.species} capturado com esfera ${RARITY_LABEL[k].toLowerCase()} (chance ${pct(chance)}). Coleção: +${d} diamante(s), +${xp.ganho} XP, +${gold} gold.`);
  } else {
    note(`a esfera ${RARITY_LABEL[k].toLowerCase()} falhou (chance ${pct(chance)}); ${w.species} escapou. +${gold} gold.`);
  }
  dropEgg(w);
  S.wild = null;
}
function deixarIr() {
  if (!S.wild) return;
  const gold = Y.goldEncontro(S.wild.rarity);
  S.gold += gold;
  note(`você deixou ${S.wild.species} ir. +${gold} gold.`);
  dropEgg(S.wild);
  S.wild = null;
}

// Combate por turnos: o inimigo depende do alvo. O poder passa pela escala de calibração (CB.poderInimigo).
function alvoDoCombate(tipo, dados) {
  const ts = Date.now();
  if (tipo === 'zona') {
    const dif = S.endless.dificuldade || 0;
    return { nome: `Andar ${S.endless.floor}`, poder: CB.poderInimigo(C.endlessFloorPower(S.endless.floor) * C.fatorForca(dif)), elemento: C.elementoDoAndar(S.endless.floor), habilidades: ['Golpe sombrio', 'Investida'] };
  }
  if (tipo === 'torre') {
    const torre = Y.TORRES.find((x) => x.id === dados.torreId);
    const t = Y.torreDoPeriodo(S.torres[torre.id], torre, ts);
    const andar = Y.andarDaTorre(t, t.nivel);
    return { nome: `${torre.nome} · andar ${andar}`, poder: CB.poderInimigo(Y.poderAndarTorre(andar, t.nivel)), elemento: Y.elementoDaTorre(torre, ts), habilidades: ['Golpe do guardião', 'Fúria'] };
  }
  if (tipo === 'raid') {
    const boss = Y.RAID_BOSSES.find((b) => b.id === dados.bossId);
    return { nome: boss.nome, poder: CB.poderInimigo(boss.poder), elemento: boss.elemento, habilidades: ['Golpe do chefe', 'Fúria'] };
  }
  const idx = Y.campanhaIndice(S.campanha, S.campanha.correndo.dif);
  return { nome: `Bot (força ${S.bot})`, poder: CB.poderInimigo((100 + 40 * S.bot) * C.fatorForcaSemLimite(idx)), elemento: botElemento(S.bot), habilidades: ['Golpe do bot', 'Fúria'] };
}
function iniciarCombate(tipo, m, dados = {}) {
  if (S.combate) { note('termine o combate atual antes de começar outro.'); return; }
  if (tipo === 'campanha' && !S.campanha.correndo) { note('escolha uma campanha para começar.'); return; }
  const alvo = alvoDoCombate(tipo, dados);
  const jog = CB.criarLutador({ nome: m.species, poder: C.monsterPower(m), elemento: m.elemento ?? 'neutro', habilidades: C.activeAbilities(m) });
  S.combate = { tipo, monstroId: m.id, dados, ...CB.criarCombate(jog, CB.criarLutador(alvo), S.pocoes) };
  note(`combate contra ${alvo.nome} começou (${TIPO_LABEL[tipo]}).`);
}
function fimCombate() {
  const e = S.combate;
  const vitoria = e.resultado === 'vitoria';
  S.pocoes = { ...e.pocoes };
  S.combate = null;
  note(`combate encerrado em ${Math.min(e.turno, CB.COMBATE.turnosMax)} turno(s): ${vitoria ? 'vitória' : 'derrota'}.`);
  const m = S.monsters.find((x) => x.id === e.monstroId);
  if (!m) return;
  if (e.tipo === 'zona') return fimZona(m, vitoria);
  if (e.tipo === 'torre') return fimTorre(m, e.dados.torreId, vitoria);
  if (e.tipo === 'raid') return fimRaid(m, e.dados.bossId, vitoria);
  return fimCampanha(m, vitoria);
}
function fimZona(m, vitoria) {
  const floor = S.endless.floor;
  const dif = S.endless.dificuldade || 0;
  if (!vitoria) {
    const xp = C.ganharXp(m, C.XP_FONTE.andarDerrota);
    note(`andar ${floor}: ${m.species} não venceu. O andar recomeça; nada foi perdido. +${xp.ganho} XP.`);
    return;
  }
  const r = C.endlessRewards(floor, EVENT_ACTIVE, Math.random);
  r.diamantes = Y.quantidadeDrop(r.diamantes, C.bonusDrop(dif), Math.random()); // dificuldade dá +30% de drop por nível
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
  contarMissao();
  const gold = Y.goldAndar(floor);
  S.gold += gold;
  const xp = C.ganharXp(m, C.XP_FONTE.andarVitoria(floor));
  const extra = r.invocacoes.map((i) => `, ${i.qtd} ficha(s) ${BANNER_LABEL[i.banner]}`).join('');
  note(`andar ${floor} concluído com ${m.species}: +${r.diamantes} diamantes, +${gold} gold, +${xp.ganho} XP${extra}${r.ovo ? ' + ovo de recompensa' : ''}${r.evento ? ' + doce de Halloween' : ''}${xp.subiu ? `. ${m.species} subiu para o nível ${xp.nivel}` : ''}.`);
}
function fimTorre(m, torreId, vitoria) {
  const torre = Y.TORRES.find((x) => x.id === torreId);
  const ts = Date.now();
  const t = Y.torreDoPeriodo(S.torres[torre.id], torre, ts);
  S.torres[torre.id] = t;
  const andar = Y.andarDaTorre(t, t.nivel);
  if (!vitoria) {
    const xp = C.ganharXp(m, 2);
    note(`${torre.nome}: ${m.species} não passou do andar ${andar}. Nada perdido. +${xp.ganho} XP.`);
    return;
  }
  const r = Y.venceAndarTorre(t, torre, t.nivel, { a: Math.random(), b: Math.random() });
  S.torres[torre.id] = r.t;
  S.recordes = S.recordes || { semana: 0, mes: 0 };
  S.recordes[torre.id] = Math.max(S.recordes[torre.id] || 0, andar);
  S.diamonds += r.recompensa.diamantes;
  const item = Y.itemDaTorre(torre, ts);
  const vantagem = C.multElemento(m.elemento, Y.elementoDaTorre(torre, ts)) > 1 ? 1 : 0; // vantagem elemental: +1 item
  const itens = r.recompensa.item + vantagem;
  S.resources[item] = (S.resources[item] || 0) + itens;
  const xp = C.ganharXp(m, 5 + andar);
  S.pass = Y.addPassXp(S.pass, 'andar');
  contarMissao();
  note(`${torre.nome}: andar ${andar} vencido com ${m.species}. +${r.recompensa.diamantes} diamantes, +${itens} ${itemNome(item)}${vantagem ? ' (vantagem elemental +1)' : ''}, +${xp.ganho} XP.${r.liberouNova ? ` Dificuldade ${r.t.liberada} liberada.` : ''}`);
}
function fimRaid(m, bossId, vitoria) {
  const boss = Y.RAID_BOSSES.find((b) => b.id === bossId);
  S.raid.janela = Y.raidAt(Date.now()).janela; // a tentativa desta raid foi usada
  contarMissao();
  if (!vitoria) { note(`${m.species} não venceu ${boss.nome}. A tentativa desta raid está usada.`); return; }
  const f = Y.fragmentosVitoria(Math.random());
  S.fragmentos[boss.id] = (S.fragmentos[boss.id] || 0) + f;
  const xp = C.ganharXp(m, C.XP_FONTE.raidVitoria);
  S.pass = Y.addPassXp(S.pass, 'raid');
  note(`${m.species} venceu ${boss.nome} e pegou ${f} fragmento(s). +${xp.ganho} XP.`);
}
function fimCampanha(m, vitoria) {
  const c = S.campanha;
  const dif = c.correndo ? c.correndo.dif : 'normal';
  const nome = campanhaNome(dif, c);
  const idx = Y.campanhaIndice(c, dif);
  const res = C.finalBattle(vitoria ? 'vitoria' : 'derrota', m, S.bot);
  S.bot = res.bot;
  if (!vitoria) {
    note(`derrota para o bot. ${m.species} perdeu até ${C.XP_FONTE.batalhaDerrota} XP (agora ${m.xp}, nível ${m.level}). O bot ficou mais forte (força ${S.bot}).`);
    return;
  }
  const v = Y.campanhaVencer(c, Date.now());
  S.campanha = v.c;
  const bonus = C.bonusDropSemLimite(idx);
  const d = Math.floor(3 * bonus);
  const g = Math.floor(Y.GOLD.batalhaFinal * bonus);
  S.diamonds += d; S.gold += g; S.pass = Y.addPassXp(S.pass, 'batalha');
  note(`campanha ${nome} zerada em ${tempoTexto(v.ms)} com ${m.species}. +${d} diamantes, +${g} gold, +${C.XP_FONTE.batalhaVitoria} XP.${dif === 'desafio' ? ` O Desafio sobe para o nível ${v.c.desafioNivel + 1}: ${campanhaNome('desafio', v.c)}.` : ''}`);
}

// Automático: um passo por tique. Combate (se ligado), depois esfera marcada, depois zona (se ligada), senão procura.
function autoTick() {
  const a = S.auto;
  if (!a.ativo) return;
  if (S.combate) {
    if (!a.combate) return autoPausa('combate em andamento e auto-combate desligado: a auto-exploração pausou.');
    const acao = CB.escolherAuto(S.combate, { limiarPocao: a.limiar, pocoes: a.pocoes, habilidades: a.habilidades });
    try { CB.agir(S.combate, acao, Math.random); } catch (e) { return autoPausa(`auto-combate pausou: ${e.message}.`); }
    S.pocoes = { ...S.combate.pocoes };
    if (S.combate.fim) fimCombate();
    return;
  }
  if (S.wild) {
    const k = CB.escolherEsfera(S.esferas, a.esferas);
    if (!k) return autoPausa('sem esfera marcada com estoque. Auto-exploração pausada: marque outra esfera ou compre.');
    return lancar(k);
  }
  if (a.zona && S.monsters.length) return iniciarCombate('zona', S.monsters[0]);
  procurar();
}
function combateHtml() {
  const e = S.combate;
  if (!e) return '';
  const barra = (x) => `<progress value="${Math.max(0, x.hp)}" max="${x.hpMax}"></progress> ${Math.max(0, x.hp)}/${x.hpMax}`;
  const habs = e.jog.habilidades.map((h) => {
    const pronta = CB.habilidadePronta(e.jog, h.nome, e.turno);
    return `<button data-act="combateAcao" data-acao="habilidade" data-nome="${esc(h.nome)}" ${pronta ? '' : 'disabled'}>${esc(h.nome)}${pronta ? '' : ' (recarga)'}</button>`;
  }).join(' ');
  const pocs = Object.keys(CB.POCOES).map((p) => `<button data-act="combateAcao" data-acao="pocao" data-p="${p}" ${(e.pocoes[p] || 0) > 0 ? '' : 'disabled'}>${CB.POCOES[p].nome} (${e.pocoes[p] || 0})</button>`).join(' ');
  return `<section class="combate">
    <h2>Combate por turnos · ${TIPO_LABEL[e.tipo]}</h2>
    <p><b>${esc(e.jog.nome)}</b> ${barra(e.jog)} · elemento ${ELEMENTO_LABEL[e.jog.elemento] ?? 'Neutro'}</p>
    <p><b>${esc(e.ini.nome)}</b> ${barra(e.ini)} · elemento ${ELEMENTO_LABEL[e.ini.elemento] ?? 'Neutro'}</p>
    <p class="muted">Turno ${Math.min(e.turno, CB.COMBATE.turnosMax)} de ${CB.COMBATE.turnosMax}. Vantagem elemental dobra o dano; desvantagem corta pela metade. Habilidade não repete no turno seguinte.</p>
    <p><button data-act="combateAcao" data-acao="atacar">Atacar</button></p>
    <p>Habilidades: ${habs || 'nenhuma'}</p>
    <p>Poções: ${pocs}</p>
    <ul class="log">${e.log.slice(-8).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
  </section>`;
}
function autoHtml() {
  const a = S.auto;
  const grupo = (g, titulo) => {
    const todas = opcoesAuto(g);
    const marcadas = a[g].filter((v) => todas.includes(v));
    const ordem = [...marcadas, ...todas.filter((v) => !marcadas.includes(v))];
    const linhas = ordem.map((v) => {
      const pos = marcadas.indexOf(v);
      const q = qtdAuto(g, v);
      return `<li>${pos >= 0 ? `<b>${pos + 1}º</b> ` : ''}${esc(rotuloAuto(g, v))}${q === null ? '' : ` (${q} na mão)`}
        <button data-act="autoOpcao" data-g="${g}" data-v="${esc(v)}">${pos >= 0 ? 'Tirar' : 'Usar'}</button>
        ${pos >= 0 ? `<button data-act="autoMover" data-g="${g}" data-v="${esc(v)}" data-d="-1" ${pos === 0 ? 'disabled' : ''}>▲</button><button data-act="autoMover" data-g="${g}" data-v="${esc(v)}" data-d="1" ${pos === marcadas.length - 1 ? 'disabled' : ''}>▼</button>` : ''}</li>`;
    }).join('');
    return `<div><b>${titulo}</b><p class="muted">A primeira marcada com estoque é usada. Se acabar, usa a próxima da lista.</p><ul class="log">${linhas || '<li class="muted">Nenhuma opção.</li>'}</ul></div>`;
  };
  return `<section>
    <h2>Auto-exploração</h2>
    <p>Status: <b>${a.ativo ? 'ligada' : 'desligada'}</b>. Procura, lança esferas pela ordem marcada e, se marcado, luta na zona com habilidades e poções pela ordem. Pausa se faltar esfera marcada.</p>
    <p><button data-act="autoAtivo">${a.ativo ? 'Desligar' : 'Ligar auto-exploração'}</button>
    <button data-act="autoCombate">Auto-combate: ${a.combate ? 'sim' : 'não'}</button>
    <button data-act="autoZona">Lutar na zona no automático: ${a.zona ? 'sim' : 'não'}</button>
    <button data-act="autoLimiar">Poção abaixo de ${Math.round(a.limiar * 100)}% de vida</button></p>
    ${grupo('esferas', 'Esferas (captura)')}
    ${grupo('habilidades', 'Habilidades (combate)')}
    ${grupo('pocoes', 'Poções (combate)')}
    <p><b>Comprar poções:</b> ${Object.keys(CB.POCOES).map((p) => `<button data-act="comprarPocao" data-p="${p}">${CB.POCOES[p].nome} · ${CB.POCOES[p].preco} gold</button>`).join(' ')}</p>
  </section>`;
}

function resolverBreeds() {
  const agora = Date.now();
  const prontos = S.breeds.filter((b) => agora >= b.fim);
  if (!prontos.length) return false;
  S.breeds = S.breeds.filter((b) => agora < b.fim);
  for (const b of prontos) {
    const main = S.monsters.find((m) => m.id === b.mainId);
    if (!main) { note('um breed terminou, mas o principal não está mais na coleção.'); continue; }
    if (b.sucesso) {
      C.absorbAbility(main, b.pick, b.keep);
      C.breedSuccessEffects(main);
      if (b.passiva && C.herdarPassiva(main, b.passiva)) note(`${main.species} herdou a passiva ${b.passiva.nome}.`);
      S.eggs.push(eggOf(main.species, b.form, 'breed', b.pureza, b.tierOvo));
      S.successes[main.id] = (S.successes[main.id] || 0) + 1;
      S.failures[main.id] = 0;
      note(`breed de ${main.species} terminou: absorveu "${b.pick}" e aptidões +1. Saiu um ovo ${b.form} de tier ${b.tierOvo}.`);
    } else {
      S.failures[main.id] = (S.failures[main.id] || 0) + 1;
      note(`breed de ${main.species} terminou sem sucesso.`);
    }
  }
  return true;
}
// Chamado a cada 5 s: resolve breeds prontos e atualiza só as contagens, sem redesenhar a página.
function atualizarBreeds() {
  if (resolverBreeds()) { save(); render(); return; }
  document.querySelectorAll('.contagem').forEach((el) => { el.textContent = faltaTexto(Number(el.dataset.fim)); });
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
  resolverBreeds();
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
      aplicarMundo(Mundo.diaMundo(S.mundo, contextoMundo()));
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
      contarMissao();
      if (m) m.vinculo = Math.max(0, Math.min(100, m.vinculo + r.vinculoDelta));
      if (!r.penalidade) S.diamonds += C.diamondsForItem(r.raridade);
      note(r.penalidade ? `cozinhar: ${r.penalidade}. Vínculo de ${m ? m.species : '-'} muda ${r.vinculoDelta}.`
        : `cozinhou ${r.nome} (${r.efeito}, ${r.raridade}). Vínculo de ${m ? m.species : '-'} sobe ${r.vinculoDelta}.`);
      break;
    }
    case 'breed': {
      const main = S.monsters.find((m) => m.id === $('fuse-main').value);
      const ing = S.monsters.find((m) => m.id === $('fuse-ing').value);
      if (!main) return;
      const motivo = C.podeIniciarBreed(S.breeds, main, ing);
      if (motivo) { note(`breed não iniciado: ${motivo}.`); break; }
      const ore = Number($('fuse-ore').value);
      const chance = C.breedSuccessChance(main.tier, S.successes[main.id] || 0, S.failures[main.id] || 0, ore);
      S.pass = Y.addPassXp(S.pass, 'breed');
      C.ganharXp(main, C.XP_FONTE.breed);
      contarMissao();
      ing.usosIngrediente = (ing.usosIngrediente || 0) + 1; // o ingrediente não some: cada breed gasta um dos 3 usos
      const aviso = ing.usosIngrediente >= C.INGREDIENT_MAX_USES
        ? ` ${ing.species} chegou a ${C.INGREDIENT_MAX_USES} usos: não serve mais de ingrediente, mas continua na coleção.` : '';
      const pool = ing.abilities && ing.abilities.length ? ing.abilities : C.activeAbilities(ing);
      const e = C.eggFor('breed', Math.random(), Math.random(), ing.purity);
      const agora = Date.now();
      // Passiva do ingrediente pode passar para o principal se o breed der certo (chance em C.PASSIVA_HERDA_CHANCE).
      const passivaHerdada = ing.passivas && ing.passivas.length && Math.random() < C.PASSIVA_HERDA_CHANCE
        ? ing.passivas[Math.floor(Math.random() * ing.passivas.length)] : null;
      S.breeds.push({
        id: uid('b'), mainId: main.id, ingId: ing.id, mainNome: main.species, ingNome: ing.species,
        inicio: agora, fim: agora + C.breedDurationMs(Math.random()),
        sucesso: Math.random() < chance, pick: pool[Math.floor(Math.random() * pool.length)],
        keep: $('fuse-keep').value === 'new', tierOvo: C.breedEggTier(main.tier, Math.random()),
        form: e.form, pureza: e.pureza, passiva: passivaHerdada,
      });
      note(`breed iniciado: ${main.species} + ${ing.species}. Termina em cerca de 10 minutos. ${main.species} ganhou ${C.XP_FONTE.breed} XP.${aviso}`);
      break;
    }
    case 'combateAcao': {
      if (!S.combate || S.combate.fim) return;
      const d = el.dataset.acao;
      const acao = d === 'pocao' ? { tipo: 'pocao', pocao: el.dataset.p } : d === 'habilidade' ? { tipo: 'habilidade', nome: el.dataset.nome } : { tipo: 'atacar' };
      try { CB.agir(S.combate, acao, Math.random); } catch (e) { note(`não deu: ${e.message}.`); break; }
      S.pocoes = { ...S.combate.pocoes };
      if (S.combate.fim) fimCombate();
      break;
    }
    case 'autoAtivo': { S.auto.ativo = !S.auto.ativo; break; }
    case 'autoCombate': { S.auto.combate = !S.auto.combate; break; }
    case 'autoZona': { S.auto.zona = !S.auto.zona; break; }
    case 'autoLimiar': { const i = AUTO_LIMIARES.indexOf(S.auto.limiar); S.auto.limiar = AUTO_LIMIARES[(i + 1) % AUTO_LIMIARES.length]; break; }
    case 'autoOpcao': {
      const arr = S.auto[el.dataset.g];
      const v = el.dataset.v;
      const i = arr.indexOf(v);
      if (i >= 0) arr.splice(i, 1); else arr.push(v);
      break;
    }
    case 'autoMover': {
      const arr = S.auto[el.dataset.g];
      const i = arr.indexOf(el.dataset.v);
      const j = i + Number(el.dataset.d);
      if (i < 0 || j < 0 || j >= arr.length) break;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      break;
    }
    case 'comprarPocao': {
      const p = el.dataset.p;
      const preco = CB.POCOES[p].preco;
      if (S.gold < preco) { note(`gold insuficiente: ${CB.POCOES[p].nome} custa ${preco}.`); break; }
      S.gold -= preco;
      S.pocoes[p] = (S.pocoes[p] || 0) + 1;
      note(`comprou ${CB.POCOES[p].nome} por ${preco} gold.`);
      break;
    }
    case 'campanhaIniciar': {
      try {
        S.campanha = Y.campanhaIniciar(S.campanha, el.dataset.dif, Date.now());
        S.bot = 0;
        note(`campanha ${campanhaNome(el.dataset.dif)} começou. O bot voltou à força 0.`);
      } catch (e) { note(`não deu para começar: ${e.message}.`); }
      break;
    }
    case 'battle': {
      const m = S.monsters.find((x) => x.id === $('battle-monster').value);
      if (!m) return;
      iniciarCombate('campanha', m);
      break;
    }
    case 'torreNivel': {
      const torre = Y.TORRES.find((x) => x.id === el.dataset.torre);
      const t = Y.torreDoPeriodo(S.torres[torre.id], torre, Date.now());
      const n = Number(el.dataset.n);
      if (n > t.liberada) { note('essa dificuldade ainda não foi liberada.'); break; }
      S.torres[torre.id] = { ...t, nivel: n };
      break;
    }
    case 'torreSubir': {
      const torre = Y.TORRES.find((x) => x.id === el.dataset.torre);
      const m = S.monsters.find((x) => x.id === $('torre-monster').value);
      if (!m) return;
      iniciarCombate('torre', m, { torreId: torre.id });
      break;
    }
    case 'endlessDif': {
      const n = Number(el.dataset.n);
      if (n > Y.difEndlessLiberada(S.endless.best)) { note('dificuldade ainda não liberada.'); break; }
      S.endless.dificuldade = n;
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
      iniciarCombate('zona', m);
      break;
    }
    case 'invoke': {
      const banner = $('shop-banner').value;
      const qtd = Number(el.dataset.qtd) || 1;
      if ((S.tickets[banner] || 0) < qtd) { note(`faltam fichas do banner ${BANNER_LABEL[banner]}: precisa de ${qtd}.`); break; }
      S.tickets[banner] -= qtd;
      const sorteados = [];
      let pity = S.pity[banner] || 0;
      let pityT5 = S.pityT5[banner] || 0;
      for (let i = 0; i < qtd; i++) {
        const p = C.invocationPull(banner, SPECIES, pity, { destaque: Math.random(), especie: Math.random(), raridade: Math.random() }, pityT5);
        pity = p.pity;
        pityT5 = p.pityT5;
        sorteados.push(p);
      }
      S.pity[banner] = pity;
      S.pityT5[banner] = pityT5;
      const resultados = C.garantirLote(sorteados);
      const melhorSorteio = Math.max(...sorteados.map((r) => r.rarity));
      const melhor = Math.max(...resultados.map((r) => r.rarity));
      let d = 0, ultimo = null;
      for (const r of resultados) {
        const m = newMonster(r.species, r.rarity, undefined, 'natural', CLASSE_BANNER[banner], 'banner');
        S.monsters.push(m);
        ultimo = m;
        d += C.diamondsForItem(C.rarityName(r.rarity));
      }
      S.last = ultimo.id;
      S.diamonds += d;
      const destaques = sorteados.filter((p) => p.destaque).length;
      note(`invocação x${qtd} (${BANNER_LABEL[banner]}): ${qtd} monstrinho(s), melhor raridade ${RARITY_LABEL[C.rarityName(melhor)]}${melhor > melhorSorteio ? ` (garantia de tier ${melhor})` : ''}${destaques ? `, ${destaques} destaque(s) de ${C.BANNER_FEATURED[banner]}` : ''}. Coleção: +${d} diamante(s).`);
      break;
    }
    case 'hatchEgg': {
      const egg = S.eggs.find((e) => e.id === el.dataset.id);
      if (!egg) return;
      S.eggs = S.eggs.filter((e) => e !== egg);
      const r = C.hatchEgg(egg, Math.random());
      if (egg.origem === 'raid') { r.rarity = Y.raridadeOvoRaid(Math.random()); r.tier = egg.tier; } // ovo de raid: boss ou mítica
      const origem = egg.origem === 'raid' ? 'raid' : egg.origem === 'evento' ? 'evento' : 'base';
      const m = newMonster(r.species, r.rarity, r.purity, r.variant, 'comum', origem);
      m.tier = r.tier;
      S.monsters.push(m);
      S.last = m.id;
      const d = C.diamondsForItem(C.rarityName(r.rarity));
      S.diamonds += d;
      let clone = '';
      if (Math.random() < Y.chanceClone(r.species)) { // clone na hora de chocar: oníricos de banner e de evento
        const c = structuredClone(m);
        c.id = uid('m');
        S.monsters.push(c);
        clone = ' Clone! Saiu uma segunda cópia.';
      }
      note(`ovo de ${r.species} chocou: ${RARITY_LABEL[C.rarityName(r.rarity)]}, tier ${r.tier}, forma ${r.form}. Coleção: +${d} diamante(s).${clone}`);
      break;
    }
    case 'buy': {
      const qtd = Number(el.dataset.qtd);
      const banner = 'permanente'; // a compra só vale para o banner permanente (v1.33)
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
      const antesPremium = S.pass.claimedPremium || 0;
      const { reward, claimed, t5, claimedPremium } = Y.claimPass(S.pass);
      if (claimed <= antes && claimedPremium <= antesPremium) return;
      const txt = grant(reward, 'passe');
      let t5Nome = '';
      for (let i = 0; i < t5; i++) { // T5 aleatório do premium: sai de qualquer espécie base, nunca de evento
        const sp = Y.BASE_SPECIES[Math.floor(Math.random() * Y.BASE_SPECIES.length)];
        const m = newMonster(sp, 5, undefined, 'natural', 'comum', 'base');
        S.monsters.push(m);
        S.last = m.id;
        t5Nome = sp;
      }
      S.pass = { ...S.pass, claimed, claimedPremium };
      note(`passe: prêmios resgatados (grátis até o nível ${claimed}${S.pass.premium ? `, premium até o ${claimedPremium}` : ''}): ${txt}.${t5 ? ` T5 aleatório: ${t5Nome}.` : ''}`);
      break;
    }
    case 'passPremium': {
      try {
        const r = Y.comprarPremium(S.pass, S.diamonds);
        S.diamonds -= r.custo;
        S.pass = r.pass;
        note(`premium do passe comprado por ${r.custo} diamantes. Os níveis já alcançados nesta temporada entram no resgate.`);
      } catch (e) { note(`não deu para comprar o premium: ${e.message}.`); }
      break;
    }
    case 'buySphere': {
      try {
        const p = Y.buySphere(S, el.dataset.k);
        note(`comprou esfera ${RARITY_LABEL[el.dataset.k].toLowerCase()} por ${p.valor} ${p.moeda === 'gold' ? 'gold' : 'diamantes'}.`);
      } catch (e) {
        note(`não deu para comprar a esfera: ${e.message}.`);
      }
      break;
    }
    case 'search': { procurar(); break; }
    case 'throw': { if (S.wild) lancar($('sphere').value); break; }
    case 'flee': { deixarIr(); break; }
    case 'trilhaDia': {
      const ts = Date.now();
      S.trilha = Y.trilhaDoMes(S.trilha, ts);
      try {
        const r = Y.resgatarDia(S.trilha, ts, Number(el.dataset.dia));
        S.trilha = r.t;
        note(`trilha, dia ${el.dataset.dia}: ${aplicarRecompensa(r.r, Y.monthlyEventAt(ts))}.`);
      } catch (e) { note(`não deu para resgatar: ${e.message}.`); }
      break;
    }
    case 'trilhaResgatar': {
      const ts = Date.now();
      S.trilha = Y.trilhaDoMes(S.trilha, ts);
      try { S.trilha = Y.resgatarEvento(S.trilha, ts); } catch (e) { note(`não deu para resgatar: ${e.message}.`); break; }
      const ev = Y.monthlyEventAt(ts);
      const nm = newMonster(ev.exclusivo, 3, undefined, 'natural', 'evento', 'evento');
      S.monsters.push(nm);
      S.last = nm.id;
      S.esferas.mitica = (S.esferas.mitica || 0) + 1; // esfera mítica: 1 por mês, só por esse resgate
      note(`${ev.exclusivo} entrou na coleção pela trilha do evento. +1 esfera mítica.`);
      break;
    }
    case 'trilhaCopia': {
      const ts = Date.now();
      S.trilha = Y.trilhaDoMes(S.trilha, ts);
      const ev = Y.monthlyEventAt(ts);
      try {
        const r = Y.comprarCopia(S.trilha, S.resources[ev.item] || 0);
        S.resources[ev.item] -= r.preco;
        S.trilha = r.t;
        const nm = newMonster(ev.exclusivo, 3, undefined, 'natural', 'evento', 'evento');
        S.monsters.push(nm);
        S.last = nm.id;
        note(`cópia de ${ev.exclusivo} comprada por ${r.preco} doces.`);
      } catch (e) { note(`não deu para comprar: ${e.message}.`); }
      break;
    }
    case 'trilhaPagina': { S.trilhaPagina = Number(el.dataset.p); break; }
    case 'raid': {
      const r = Y.raidAt(Date.now());
      if (!r.aberto || S.raid.janela === r.janela) return;
      const m = S.monsters.find((x) => x.id === $('raid-monster').value);
      if (!m) return;
      iniciarCombate('raid', m, { bossId: r.boss.id });
      break;
    }
    case 'raidOvo': {
      const boss = Y.RAID_BOSSES.find((b) => b.id === el.dataset.boss);
      const n = boss ? (S.fragmentos[boss.id] || 0) : 0;
      if (!boss || n < Y.RAID.fragmentosParaOvo) { note('faltam fragmentos para o ovo.'); break; }
      S.fragmentos[boss.id] = n - Y.RAID.fragmentosParaOvo;
      const tier = Y.tierOvoRaid(Math.random());
      S.eggs.push(eggOf(boss.nome, 'natural', 'raid', boss.pureza, tier));
      note(`ovo de raid de ${boss.nome} pronto (tier ${tier}). Está na lista de ovos para chocar.`);
      break;
    }
    case 'transferir': {
      const origem = S.monsters.find((x) => x.id === $('tr-origem').value);
      const destino = S.monsters.find((x) => x.id === $('tr-destino').value);
      if (!origem || !destino || origem.id === destino.id) { note('escolha dois monstrinhos diferentes.'); break; }
      if (ocupados().has(origem.id) || ocupados().has(destino.id)) { note('um dos dois está em breed. Espere terminar.'); break; }
      const custo = Y.custoTransferencia(origem);
      if (S.diamonds < custo) { note(`faltam diamantes: a transferência custa ${custo}.`); break; }
      if (!window.confirm(`${origem.species} vai ser apagado e ${destino.species} recebe os atributos dele. Custa ${custo} diamantes. Confirmar?`)) return;
      const novo = C.transferirAtributos(origem, destino);
      S.diamonds -= custo;
      S.monsters = S.monsters.filter((x) => x.id !== origem.id).map((x) => (x.id === destino.id ? novo : x));
      S.last = destino.id;
      note(`transferência feita: ${destino.species} recebeu os atributos de ${origem.species} por ${custo} diamantes.`);
      break;
    }
    case 'mundoAcao': {
      const args = JSON.parse(el.dataset.args || '{}');
      aplicarMundo(Mundo.acaoMundo(S.mundo, el.dataset.sis, el.dataset.acao, args, contextoMundo()));
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

resolverBreeds();
setInterval(atualizarBreeds, 5000);
A.onChange(onAccountEvent);
A.init().then(() => render());

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (el && !el.disabled) act(el.dataset.act, el);
});
document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.id === 'fuse-main') { syncBreed(null); return; }
  if (!t.dataset || !t.dataset.preview) return;
  const m = S.monsters.find((x) => x.id === t.value);
  const out = $(t.dataset.preview);
  if (out) out.innerHTML = m ? monstroTag(m) : '-';
});
render();

// Auto-exploração: um passo a cada 900 ms enquanto estiver ligada. Redesenha a tela a cada passo.
setInterval(() => {
  if (!S.auto.ativo) return;
  autoTick();
  save();
  render();
}, 900);
