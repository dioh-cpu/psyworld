// Progressão sem teto (Domador e Oníricos). Até o nível 20 a curva é idêntica à do núcleo, então os saves antigos ficam no mesmo nível.
// Depois do 20 a curva continua crescendo de forma linear, sem limite. O nível 300 é a referência do último andar da Torre.
export const xpPara = (n) => 30 + 10 * n;                                   // XP entre o nível n e o seguinte
export const xpTotal = (n) => (n <= 1 ? 0 : 30 * (n - 1) + 5 * (n - 1) * n);  // soma fechada de xpPara(1..n-1)
export function nivelDe(xp) {                                               // inverso de xpTotal (sem laço longo)
  const x = Math.max(0, xp || 0); let n = Math.max(1, Math.floor((-25 + Math.sqrt(625 + 20 * x)) / 10) + 1);
  while (xpTotal(n + 1) <= x) n++; while (n > 1 && xpTotal(n) > x) n--; return n;
}
// Soma XP preservando o excedente: sobe quantos níveis couberem e guarda o resto
export function aplicarXp(obj, xp) {
  const antes = obj.nivel || nivelDe(obj.xp || 0);
  obj.xp = Math.max(obj.xp || 0, xpTotal(antes)) + Math.max(0, Math.round(xp));
  obj.nivel = nivelDe(obj.xp);
  return { antes, depois: obj.nivel, subiu: obj.nivel - antes, sobra: obj.xp - xpTotal(obj.nivel), proximo: xpPara(obj.nivel) };
}
export const previsaoXp = (obj, xp) => { const c = { nivel: obj.nivel, xp: obj.xp }; return aplicarXp(c, xp); };

// Poções de XP (podem cair em combate, ser fabricadas na Oficina dos Reinos e vir de missões)
export const POCOES = {
  pocao_xp_p: { nome: 'Poção de XP pequena', icone: '🧪', xp: 1500 },
  pocao_xp_m: { nome: 'Poção de XP média', icone: '⚗️', xp: 12000 },
  pocao_xp_g: { nome: 'Poção de XP grande', icone: '🍶', xp: 90000 },
};
// Faixas de nível das 12 regiões planejadas (configuráveis): cada região aumenta a dificuldade
export const REGIOES = [[1, 25], [20, 45], [40, 70], [65, 95], [90, 120], [115, 150], [145, 180], [175, 210], [205, 240], [235, 265], [260, 285], [280, 300]];
export const nivelDaRegiao = (r, t) => { const [a, b] = REGIOES[Math.max(0, Math.min(REGIOES.length - 1, r - 1))]; return Math.round(a + (b - a) * Math.max(0, Math.min(1, t))); };

// ---------- Classes dos Oníricos (separadas do elemento e do tier) ----------
export const CLASSES_ONIRICOS = {
  tanque:    { id: 'tanque',    nome: 'Tanque',    icone: '🛡️' },
  guerreiro: { id: 'guerreiro', nome: 'Guerreiro', icone: '⚔️' },
  mago:      { id: 'mago',      nome: 'Mago',      icone: '🔮' },
  assassino: { id: 'assassino', nome: 'Assassino', icone: '🗡️' },
  suporte:   { id: 'suporte',   nome: 'Suporte',   icone: '🕯️' },
};

export const CLASSE_DA_ESPECIE = {
  // Exclusivos de Halloween
  Velalume: 'suporte',
  'Mortálio': 'mago',
  Abyssar: 'assassino',
  Abobrisco: 'tanque',
  Vitrarco: 'guerreiro',
  // Cinco linhas iniciais (base, atual e evolução)
  Penumbrio: 'assassino', Noctarn: 'assassino', Noctarion: 'assassino',
  Brasinha: 'guerreiro', Ignavor: 'guerreiro', Ignaraz: 'guerreiro',
  Gotalume: 'mago', Vaelith: 'mago', Vaelirion: 'mago',
  Sementil: 'tanque', Brotavel: 'tanque', Florivel: 'tanque',
  Solinho: 'suporte', Solarin: 'suporte', 'Helíssio': 'suporte',
  // Outras espécies do catálogo e chefes de raid
  Lumivela: 'suporte', Cristalino: 'mago',
  'Titã de Cinza': 'tanque', 'Serpe do Abismo': 'assassino', 'Coroa Solar': 'mago',
  // Linhagens dos Reinos
  Fanalino: 'suporte', Cervomusgo: 'tanque', 'Cobrabúfalo': 'guerreiro', Tatuveludo: 'tanque', Xistolim: 'guerreiro',
  'Melifalcão': 'assassino', 'Lavândria': 'suporte', 'Calquélon': 'tanque', Vesprata: 'assassino', Colmeiro: 'tanque',
  Cerifogo: 'mago', 'Âmbarasa': 'guerreiro', 'Zunifaísca': 'assassino', Trovoresta: 'mago', Voltabelha: 'mago',
  'Falesário': 'guerreiro', Ventassol: 'suporte', Bronzelo: 'tanque', Latonhorn: 'guerreiro',
};

const ORDEM_CLASSES = ['guerreiro', 'mago', 'tanque', 'assassino', 'suporte'];
export function classeDaEspecie(especie) {
  if (!especie) return 'guerreiro';
  if (CLASSE_DA_ESPECIE[especie]) return CLASSE_DA_ESPECIE[especie];
  const h = [...String(especie)].reduce((a, c) => a + c.charCodeAt(0), 0);
  return ORDEM_CLASSES[h % ORDEM_CLASSES.length];
}
export const infoClasse = (classeOuEspecie) => CLASSES_ONIRICOS[classeOuEspecie] || CLASSES_ONIRICOS[classeDaEspecie(classeOuEspecie)];

// ---------- Tier (1 a 5) preservando os bônus atuais ----------
const clampInt = (v, min, max) => Math.max(min, Math.min(max, Math.floor(Number(v) || min)));
const r4 = (x) => Math.round(x * 10000) / 10000;

export const TIER_MIN = 1;
export const TIER_MAX = 5;
export const TIER_CFG = {
  min: TIER_MIN,
  max: TIER_MAX,
  ganhoPorTier: { hp: 0.15, atk: 0.15, def: 0.12 }, // idêntico ao BONUS_TIER histórico
};

export function tierDe(m, cfg = TIER_CFG) {
  const bruto = m?.tier ?? m?.tierHW ?? (m?.inicial ? 1 : m?.raridade) ?? cfg.min;
  return clampInt(bruto, cfg.min, cfg.max);
}
export function bonusTier(tier, cfg = TIER_CFG) {
  const k = clampInt(tier, cfg.min, cfg.max) - 1;
  return { hp: r4(cfg.ganhoPorTier.hp * k), atk: r4(cfg.ganhoPorTier.atk * k), def: r4(cfg.ganhoPorTier.def * k) };
}

// ---------- Progressão histórica de 30 estrelas (5 faixas × 6 estrelas) ----------
export const ESTRELAS_MIN = 1;
export const ESTRELAS_MAX = 30;
export const FAIXAS_ESTRELAS = [
  { id: 'dourada',   nome: 'Dourada',   de: 1,  ate: 6,  cor: '#facc15' },
  { id: 'vermelha',  nome: 'Vermelha',  de: 7,  ate: 12, cor: '#ef4444' },
  { id: 'roxa',      nome: 'Roxa',      de: 13, ate: 18, cor: '#c084fc' },
  { id: 'laranja',   nome: 'Laranja',   de: 19, ate: 24, cor: '#fb923c' },
  { id: 'arco-iris', nome: 'Arco-íris', de: 25, ate: 30, cor: '#f472b6', arcoIris: true },
];

// Origem das estrelas, custos de evolução e valores de bônus configuráveis para balanceamento
export const ESTRELAS_CFG = {
  min: ESTRELAS_MIN,
  max: ESTRELAS_MAX,
  origem: {
    padrao: 1,
    inicial: 1,
    banner: 1,
    bannerHW: 1,
    ovo: 1,
    fontesEvolucao: ['duplicata_banner', 'fragmentos_estrela', 'calabouco', 'eventos'],
  },
  custosPorFaixa: {
    dourada:     { fragmentos: 1, gold: 100 },
    vermelha:    { fragmentos: 2, gold: 250 },
    roxa:        { fragmentos: 3, gold: 500 },
    laranja:     { fragmentos: 5, gold: 1000 },
    'arco-iris': { fragmentos: 8, gold: 2000 },
  },
  // Ganho crescente por estrela adicional (1★ = base +0%; cada estrela seguinte soma cada vez mais nas faixas superiores)
  ganhoPorFaixa: {
    dourada:     { hp: 0.020, atk: 0.020, def: 0.016 }, // ★2..★6
    vermelha:    { hp: 0.025, atk: 0.025, def: 0.020 }, // ★7..★12
    roxa:        { hp: 0.030, atk: 0.030, def: 0.024 }, // ★13..★18
    laranja:     { hp: 0.035, atk: 0.035, def: 0.028 }, // ★19..★24
    'arco-iris': { hp: 0.045, atk: 0.045, def: 0.036 }, // ★25..★30
  },
};

export const estrelasIniciais = (origem = 'padrao', cfg = ESTRELAS_CFG) => clampInt(cfg.origem?.[origem] ?? cfg.origem?.padrao ?? 1, cfg.min, cfg.max);

export function faixaEstrela(estrelas = 1) {
  const n = clampInt(estrelas, ESTRELAS_MIN, ESTRELAS_MAX);
  const f = FAIXAS_ESTRELAS.find((x) => n >= x.de && n <= x.ate) || FAIXAS_ESTRELAS[0];
  return { ...f, estrelas: n, nivelNaFaixa: ((n - 1) % 6) + 1 };
}
export const corEstrela = (estrelas = 1) => faixaEstrela(estrelas).cor;
export function textoEstrelas(estrelas = 1) {
  const f = faixaEstrela(estrelas);
  return `${'★'.repeat(f.nivelNaFaixa)} (${f.estrelas}★ ${f.nome})`;
}

// Preserva estrelas de saves antigos (estrelas, stars ou star) quando o dado existir
export function estrelasDe(m, cfg = ESTRELAS_CFG) {
  const legado = m?.estrelas ?? m?.stars ?? m?.star;
  if (legado !== undefined && legado !== null && Number.isFinite(Number(legado)) && Number(legado) >= 1) {
    return clampInt(legado, cfg.min, cfg.max);
  }
  const origem = m?.inicial ? 'inicial' : m?.tierHW ? 'bannerHW' : 'padrao';
  return estrelasIniciais(origem, cfg);
}

export function bonusEstrelas(estrelas = 1, cfg = ESTRELAS_CFG) {
  const n = clampInt(estrelas, cfg.min, cfg.max);
  let hp = 0, atk = 0, def = 0;
  for (let s = 2; s <= n; s++) {
    const f = faixaEstrela(s);
    const g = cfg.ganhoPorFaixa?.[f.id] || { hp: 0, atk: 0, def: 0 };
    hp += g.hp || 0; atk += g.atk || 0; def += g.def || 0;
  }
  return { hp: r4(hp), atk: r4(atk), def: r4(def) };
}

export function bonusCombateIndividuo(m, cfgEstrelas = ESTRELAS_CFG, cfgTier = TIER_CFG) {
  if (!m) return {};
  const tier = tierDe(m, cfgTier), estrelas = estrelasDe(m, cfgEstrelas);
  const bt = bonusTier(tier, cfgTier), be = bonusEstrelas(estrelas, cfgEstrelas);
  return {
    hp: r4(bt.hp + be.hp),
    atk: r4(bt.atk + be.atk),
    def: r4(bt.def + be.def),
    _tier: tier,
    _estrelas: estrelas,
    _jaTemTier: true,
    _jaTemEstrelas: true,
  };
}

export function custoEvoluirEstrela(estrelasAtuais = 1, cfg = ESTRELAS_CFG) {
  const atual = clampInt(estrelasAtuais, cfg.min, cfg.max);
  if (atual >= cfg.max) return null;
  const prox = atual + 1, faixa = faixaEstrela(prox);
  const c = cfg.custosPorFaixa?.[faixa.id] || { fragmentos: 1, gold: 0 };
  return { de: atual, para: prox, faixa, fragmentos: c.fragmentos || 0, gold: c.gold || 0 };
}

export function evoluirEstrela(save, idx, cfg = ESTRELAS_CFG) {
  const m = save?.idle?.equipe?.[idx];
  if (!m) return { ok: false, motivo: 'Onírico inválido.' };
  const custo = custoEvoluirEstrela(estrelasDe(m, cfg), cfg);
  if (!custo) return { ok: false, motivo: 'Estrelas no máximo (30★).' };
  const frags = save.idle.fragmentosEstrela || 0, gold = save.recompensas?.gold || 0;
  if (frags < custo.fragmentos) return { ok: false, motivo: `Faltam fragmentos de estrela (${custo.fragmentos}).` };
  if (gold < custo.gold) return { ok: false, motivo: `Falta ouro (${custo.gold}g).` };
  save.idle.fragmentosEstrela = frags - custo.fragmentos;
  if (custo.gold) save.recompensas.gold = gold - custo.gold;
  m.estrelas = custo.para;
  m.tier = tierDe(m);
  return { ok: true, ...custo, bonus: bonusEstrelas(m.estrelas, cfg) };
}

// Normaliza tier (1..5) e estrelas (1..30) na equipe preservando valores de saves antigos
export function migrarProgressaoOniricos(save, cfg = ESTRELAS_CFG) {
  let mudou = false;
  for (const m of save?.idle?.equipe || []) {
    const est = estrelasDe(m, cfg), t = tierDe(m);
    if (m.estrelas !== est) { m.estrelas = est; mudou = true; }
    if (m.tier !== t) { m.tier = t; mudou = true; }
  }
  return mudou;
}

