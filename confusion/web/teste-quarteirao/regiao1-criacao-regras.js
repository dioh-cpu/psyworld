// Regras puras de Estrelas (por cópias), Tier (por itens raros) e Reprodução na Região 1.
// Estrelas e tier são atributos independentes da unidade; saves antigos têm tier, estrelas e nível preservados.

export const ESTRELAS_CFG = {
  min: 1,
  max: 30,
  inicioCopias: 5, // a partir de 5★ → 6★ exige cópias da mesma espécie
  // Configuração inicial para os 7 degraus a partir de 5★→6★ (5→6, 6→7, 7→8, 8→9, 9→10, 10→11, 11→12).
  // Custos além do sétimo degrau ficam em aberto (null) até definição de balanceamento.
  custosCopias: [1, 2, 4, 8, 10, 15, 20],
};

export const TIER_CFG = {
  min: 1,
  max: 5, // T5 é o teto
  // De T1 a T4, apenas itens específicos e difíceis de obter sobem o tier da unidade.
  itensPorTier: {
    1: { id: 'essencia_tier_2', nome: 'Essência Primeva (T1→T2)', qtd: 1 },
    2: { id: 'essencia_tier_3', nome: 'Relíquia de Ascensão (T2→T3)', qtd: 1 },
    3: { id: 'essencia_tier_4', nome: 'Coração Ancestral (T3→T4)', qtd: 1 },
    4: { id: 'essencia_tier_5', nome: 'Núcleo Mítico (T4→T5)', qtd: 1 },
  },
};

export const REPRODUCAO_CFG = {
  // 5 minutos no T1 e 2 horas no T5; tempos intermediários configuráveis.
  intervaloMsPorTier: {
    1: 5 * 60_000,
    2: 15 * 60_000,
    3: 30 * 60_000,
    4: 60 * 60_000,
    5: 120 * 60_000,
  },
  // Chances de sucesso por tier do casal (configuráveis).
  chanceSucessoPorTier: {
    1: 0.75,
    2: 0.65,
    3: 0.55,
    4: 0.45,
    5: 0.35,
  },
  // Regra de tier do filhote: 'menor' | 'maior' | 'media' (ou função (tierA, tierB, rng) => tier).
  regraTierFilhote: 'menor',
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// Lê tier e estrelas preservando saves antigos (raridade, tierHW, tier, estrelas, nivel).
export function tierDaUnidade(u, cfg = TIER_CFG) {
  const bruto = Number(u?.tier ?? u?.tierHW ?? u?.raridade ?? 1);
  return clamp(Number.isFinite(bruto) ? Math.floor(bruto) : 1, cfg.min, cfg.max);
}

export function estrelasDaUnidade(u, cfg = ESTRELAS_CFG) {
  const bruto = Number(u?.estrelas ?? 1);
  return clamp(Number.isFinite(bruto) ? Math.floor(bruto) : 1, cfg.min, cfg.max);
}

export function normalizarUnidade(u) {
  if (!u || typeof u !== 'object') return u;
  const tier = tierDaUnidade(u);
  const estrelas = estrelasDaUnidade(u);
  u.tier = tier;
  u.raridade = tier;
  u.estrelas = estrelas;
  u.nivel = Math.max(1, Number(u.nivel) || 1);
  u.xp = Math.max(0, Number(u.xp) || 0);
  return u;
}

// Retorna o número de cópias exigidas para subir de `estrelasAtuais` para `estrelasAtuais + 1`.
// 0 se abaixo de inicioCopias; número > 0 nos degraus configurados; null se além do último degrau configurado (em aberto).
export function custoCopiasEstrela(estrelasAtuais, cfg = ESTRELAS_CFG) {
  if (estrelasAtuais >= cfg.max) return null;
  if (estrelasAtuais < cfg.inicioCopias) return 0;
  const degrau = estrelasAtuais - cfg.inicioCopias;
  return degrau < cfg.custosCopias.length ? cfg.custosCopias[degrau] : null;
}

// Prevê a subida de estrela e lista exatamente quais cópias da mesma espécie serão consumidas.
export function preverSubirEstrela(equipe, idxPrincipal, idxsCopias = null, cfg = ESTRELAS_CFG) {
  const principal = equipe?.[idxPrincipal];
  if (!principal) return { ok: false, motivo: 'Onírico principal não encontrado.' };
  const de = estrelasDaUnidade(principal, cfg);
  if (de >= cfg.max) return { ok: false, motivo: 'Estrelas já estão no máximo.' };
  const custo = custoCopiasEstrela(de, cfg);
  if (custo === null) {
    return { ok: false, motivo: 'Custo de cópias além do 7º degrau ainda está em aberto.' };
  }
  const candidatas = [];
  for (let i = 0; i < equipe.length; i++) {
    if (i === idxPrincipal) continue;
    const u = equipe[i];
    if (u && u.especie === principal.especie) {
      candidatas.push({ idx: i, uid: u.uid || null, especie: u.especie, nivel: Math.max(1, Number(u.nivel) || 1), tier: tierDaUnidade(u), estrelas: estrelasDaUnidade(u, cfg) });
    }
  }
  let escolhidas = [];
  if (custo > 0) {
    if (Array.isArray(idxsCopias)) {
      const vistos = new Set();
      for (const i of idxsCopias) {
        if (i === idxPrincipal || vistos.has(i)) return { ok: false, motivo: 'Seleção de cópias inválida.' };
        const cand = candidatas.find((c) => c.idx === i);
        if (!cand) return { ok: false, motivo: 'Todas as cópias precisam ser da mesma espécie.' };
        vistos.add(i);
        escolhidas.push(cand);
      }
      if (escolhidas.length !== custo) return { ok: false, motivo: `Selecione exatamente ${custo} cópia(s) de ${principal.especie}.` };
    } else {
      // Ordena pelas menos evoluídas primeiro (menor nível, estrelas e tier) para proteger unidades mais investidas.
      candidatas.sort((a, b) => a.nivel - b.nivel || a.estrelas - b.estrelas || a.tier - b.tier || a.idx - b.idx);
      if (candidatas.length < custo) {
        return { ok: false, motivo: `Faltam cópias de ${principal.especie}: precisa de ${custo}, tem ${candidatas.length}.`, custo, disponiveis: candidatas.length };
      }
      escolhidas = candidatas.slice(0, custo);
    }
  }
  return { ok: true, de, para: de + 1, custo, copias: escolhidas };
}

// Sobe 1 estrela consumindo apenas as cópias selecionadas e preservando integralmente a unidade principal.
export function subirEstrela(save, idxPrincipal, idxsCopias = null, cfg = ESTRELAS_CFG) {
  const equipe = save?.idle?.equipe;
  const prev = preverSubirEstrela(equipe, idxPrincipal, idxsCopias, cfg);
  if (!prev.ok) return prev;
  const principal = normalizarUnidade(equipe[idxPrincipal]);
  const remover = prev.copias.map((c) => c.idx).sort((a, b) => b - a);
  for (const idx of remover) equipe.splice(idx, 1);
  principal.estrelas = prev.para;
  return { ok: true, unidade: principal, de: prev.de, para: prev.para, consumidas: prev.copias };
}

// Sobe o tier de T1 até T5 usando apenas o item raro específico daquele degrau (independente das estrelas).
export function subirTierUnidade(save, idxUnidade, cfg = TIER_CFG) {
  const idle = save?.idle;
  const u = idle?.equipe?.[idxUnidade];
  if (!u) return { ok: false, motivo: 'Onírico não encontrado.' };
  normalizarUnidade(u);
  if (u.tier >= cfg.max) return { ok: false, motivo: `Tier T${cfg.max} é o teto.` };
  const req = cfg.itensPorTier[u.tier];
  if (!req) return { ok: false, motivo: 'Item de ascensão de tier não configurado.' };
  const estoque = idle.mochila?.itensTier || {};
  if ((estoque[req.id] || 0) < req.qtd) {
    return { ok: false, motivo: `Falta ${req.qtd}× ${req.nome}.`, itemNecessario: req };
  }
  estoque[req.id] -= req.qtd;
  const de = u.tier;
  u.tier = de + 1;
  u.raridade = u.tier;
  if (u.tierHW) u.tierHW = u.tier;
  return { ok: true, unidade: u, de, para: u.tier, itemConsumido: req };
}

// ---- Reprodução ----
function repDe(save) {
  const idle = save.idle || (save.idle = {});
  if (!idle.reproducao || typeof idle.reproducao !== 'object') idle.reproducao = { cooldowns: {} };
  if (!idle.reproducao.cooldowns || typeof idle.reproducao.cooldowns !== 'object') idle.reproducao.cooldowns = {};
  return idle.reproducao;
}

export function chaveCasal(uA, uB, idxA, idxB) {
  const a = uA?.uid || `idx_${idxA}`;
  const b = uB?.uid || `idx_${idxB}`;
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function tierFilhote(tierA, tierB, rng = Math.random, cfg = REPRODUCAO_CFG) {
  if (typeof cfg.regraTierFilhote === 'function') return clamp(Math.round(cfg.regraTierFilhote(tierA, tierB, rng)), 1, 5);
  if (cfg.regraTierFilhote === 'maior') return Math.max(tierA, tierB);
  if (cfg.regraTierFilhote === 'media') return Math.floor((tierA + tierB) / 2);
  return Math.min(tierA, tierB);
}

export function podeReproduzir(save, idxA, idxB, agoraMs = Date.now(), cfg = REPRODUCAO_CFG) {
  const equipe = save?.idle?.equipe || [];
  if (idxA === idxB || !equipe[idxA] || !equipe[idxB]) return { ok: false, motivo: 'Escolha dois Oníricos distintos.' };
  const a = equipe[idxA], b = equipe[idxB];
  if (a.especie !== b.especie) return { ok: false, motivo: 'Os dois Oníricos precisam ser da mesma espécie.' };
  const tierRef = Math.max(tierDaUnidade(a), tierDaUnidade(b));
  const intervaloMs = cfg.intervaloMsPorTier[tierRef] ?? cfg.intervaloMsPorTier[1];
  const chance = cfg.chanceSucessoPorTier[tierRef] ?? 0.5;
  const chave = chaveCasal(a, b, idxA, idxB);
  const ate = repDe(save).cooldowns[chave] || 0;
  if (agoraMs < ate) {
    return { ok: false, motivo: 'Casal em intervalo de espera.', restanteMs: ate - agoraMs, intervaloMs, chance, chave };
  }
  return { ok: true, intervaloMs, chance, tierRef, chave };
}

// Tenta gerar um ovo da própria espécie (inclusive de evento). Pais permanecem na coleção.
// Em caso de falha (ou sucesso), o casal aguarda o intervalo inteiro antes de tentar outra vez.
export function tentarReproduzir(save, idxA, idxB, rng = Math.random, agoraMs = Date.now(), cfg = REPRODUCAO_CFG) {
  const check = podeReproduzir(save, idxA, idxB, agoraMs, cfg);
  if (!check.ok) return check;
  const equipe = save.idle.equipe;
  const a = equipe[idxA], b = equipe[idxB];
  repDe(save).cooldowns[check.chave] = agoraMs + check.intervaloMs;
  const sucesso = rng() < check.chance;
  if (!sucesso) {
    return { ok: true, sucesso: false, intervaloMs: check.intervaloMs, proximoEm: agoraMs + check.intervaloMs };
  }
  const tierOvo = tierFilhote(tierDaUnidade(a), tierDaUnidade(b), rng, cfg);
  const moch = save.idle.mochila || (save.idle.mochila = {});
  moch.ovos = moch.ovos || [];
  const ovo = {
    especie: a.especie,
    tier: tierOvo,
    forma: 'natural',
    origem: 'reproducao',
    obtidoEm: agoraMs,
    ...(a.evento || b.evento ? { evento: a.evento || b.evento } : {}),
  };
  moch.ovos.push(ovo);
  return { ok: true, sucesso: true, ovo, intervaloMs: check.intervaloMs, proximoEm: agoraMs + check.intervaloMs };
}

// ---- Evolução por Fragmentos de Sonho elementais, Iniciais (T4→T4→T5) e Ficha do Onírico ----
import { LINHAS, linhaDaEspecie, ELEMENTO_DA_ESPECIE, HABILIDADES_DA_ESPECIE, ARTE_DA_ESPECIE } from '../species.js';
import { statsDoNivel } from './regiao1-estrategia-regras.js';
import { kitDe, PAPEL_PADRAO, EFEITOS } from './regiao1-batalha-habilidades.js';

export const EVOLUCAO_CFG = {
  // Base → segunda custa 10 Fragmentos de Sonho elementais; segunda → terceira custa 30.
  custoBaseParaSegunda: 10,
  custoSegundaParaTerceira: 30,
  // Apenas as cinco linhagens iniciais têm tier ligado à forma (base T4, segunda T4, terceira T5).
  // O restante do catálogo NÃO deriva tier pela posição na árvore.
  linhagensIniciais: new Set(LINHAS.map((l) => l.id)),
  tierIniciaisPorFase: { inicial: 4, atual: 4, evolucao: 5 },
};

export const RARIDADE_DO_TIER = { 1: 'comum', 2: 'incomum', 3: 'rara', 4: 'epica', 5: 'lendaria' };
export const CLASSE_DO_ONIRICO = {
  Velalume: 'Suporte', 'Mortálio': 'Mago', Abyssar: 'Assassino', Abobrisco: 'Tanque', Vitrarco: 'Guerreiro',
  Penumbrio: 'Assassino', Noctarn: 'Assassino', Noctarion: 'Assassino',
  Brasinha: 'Guerreiro', Ignavor: 'Guerreiro', Ignaraz: 'Guerreiro',
  Gotalume: 'Suporte', Vaelith: 'Suporte', Vaelirion: 'Suporte',
  Sementil: 'Tanque', Brotavel: 'Tanque', Florivel: 'Tanque',
  Solinho: 'Mago', Solarin: 'Mago', 'Helíssio': 'Mago',
};

export function classeDaUnidade(u) {
  const esp = typeof u === 'string' ? u : u?.especie;
  if (CLASSE_DO_ONIRICO[esp]) return CLASSE_DO_ONIRICO[esp];
  const papel = PAPEL_PADRAO[esp] || 'ataque';
  return papel === 'defesa' ? 'Tanque' : papel === 'suporte' ? 'Suporte' : 'Guerreiro';
}

export const raridadeRotulo = (tier) => RARIDADE_DO_TIER[clamp(Number(tier) || 1, 1, 5)] || 'comum';
export const molduraDoTier = (tier) => `assets/confusion/interface/banner/moldura-${clamp(Number(tier) || 1, 1, 5)}.png`;

export function fragmentosSonhoDe(save) {
  const idle = save?.idle || (save ? (save.idle = {}) : {});
  const moch = idle.mochila || (idle.mochila = {});
  if (!moch.fragmentosSonho || typeof moch.fragmentosSonho !== 'object') {
    moch.fragmentosSonho = { trevas: 0, fogo: 0, agua: 0, planta: 0, luz: 0, fantasma: 0, neutro: 0 };
  }
  return moch.fragmentosSonho;
}

export function saldoFragmentoElemental(save, elemento) {
  const el = elemento || 'neutro';
  return Number(fragmentosSonhoDe(save)[el]) || 0;
}

export function adicionarFragmentoSonho(save, elemento, qtd = 1) {
  const frags = fragmentosSonhoDe(save);
  const el = elemento || 'neutro';
  frags[el] = Math.max(0, (Number(frags[el]) || 0) + qtd);
  return frags[el];
}

// Árvore conectada com as 3 formas da linhagem, forma atual destacada, custo e saldo da próxima evolução.
export function arvoreEvolucaoDe(u, save = null, cfg = EVOLUCAO_CFG) {
  const esp = typeof u === 'string' ? u : u?.especie;
  const linha = linhaDaEspecie(esp);
  const elemento = ELEMENTO_DA_ESPECIE[esp] || u?.elemento || 'neutro';
  const saldo = save ? saldoFragmentoElemental(save, elemento) : 0;
  if (!linha) {
    return {
      possuiArvore: false,
      linhagemInicial: false,
      elemento,
      faseAtual: 'unica',
      indiceAtual: 0,
      formas: [{ fase: 'unica', especie: esp, arte: ARTE_DA_ESPECIE[esp] || null, atual: true }],
      proxima: null,
    };
  }
  const ehInicial = cfg.linhagensIniciais.has(linha.id);
  const formas = [
    { fase: 'inicial', rotulo: 'Base', especie: linha.inicial, arte: ARTE_DA_ESPECIE[linha.inicial] || null, atual: esp === linha.inicial, ...(ehInicial ? { tierFixo: cfg.tierIniciaisPorFase.inicial } : {}) },
    { fase: 'atual', rotulo: '2ª Forma', especie: linha.atual, arte: ARTE_DA_ESPECIE[linha.atual] || null, atual: esp === linha.atual, ...(ehInicial ? { tierFixo: cfg.tierIniciaisPorFase.atual } : {}) },
    { fase: 'evolucao', rotulo: '3ª Forma', especie: linha.evolucao, arte: ARTE_DA_ESPECIE[linha.evolucao] || null, atual: esp === linha.evolucao, ...(ehInicial ? { tierFixo: cfg.tierIniciaisPorFase.evolucao } : {}) },
  ];
  const indiceAtual = Math.max(0, formas.findIndex((f) => f.atual));
  const faseAtual = formas[indiceAtual].fase;
  let proxima = null;
  if (indiceAtual === 0) {
    const custo = cfg.custoBaseParaSegunda;
    proxima = { de: linha.inicial, para: linha.atual, custo, saldo, elemento, podeEvoluir: saldo >= custo, tierNovo: ehInicial ? cfg.tierIniciaisPorFase.atual : null };
  } else if (indiceAtual === 1) {
    const custo = cfg.custoSegundaParaTerceira;
    proxima = { de: linha.atual, para: linha.evolucao, custo, saldo, elemento, podeEvoluir: saldo >= custo, tierNovo: ehInicial ? cfg.tierIniciaisPorFase.evolucao : null };
  }
  return {
    possuiArvore: true,
    linhaId: linha.id,
    linhagemInicial: ehInicial,
    elemento,
    faseAtual,
    indiceAtual,
    formas,
    proxima,
  };
}

// Evolui a forma do Onírico selecionado consumindo 10 (base→2ª) ou 30 (2ª→3ª) Fragmentos de Sonho elementais.
// Para as 5 linhagens iniciais: base e 2ª forma são T4 e 3ª forma sobe para T5. Para o restante do catálogo, o tier da unidade não muda pela posição na árvore.
export function evoluirFormaOnirico(save, idxUnidade, cfg = EVOLUCAO_CFG) {
  const u = save?.idle?.equipe?.[idxUnidade];
  if (!u) return { ok: false, motivo: 'Onírico não encontrado.' };
  normalizarUnidade(u);
  const arv = arvoreEvolucaoDe(u, save, cfg);
  if (!arv.proxima) return { ok: false, motivo: 'Este Onírico já está na última forma.' };
  const { para, custo, saldo, elemento, tierNovo } = arv.proxima;
  if (saldo < custo) {
    return { ok: false, motivo: `Faltam Fragmentos de Sonho (${elemento}): precisa de ${custo}, saldo ${saldo}.`, custo, saldo, elemento };
  }
  const frags = fragmentosSonhoDe(save);
  frags[elemento] -= custo;
  const de = u.especie;
  u.especie = para;
  if (arv.linhagemInicial && tierNovo) {
    u.tier = Math.max(u.tier, tierNovo);
    u.raridade = u.tier;
  }
  return { ok: true, unidade: u, de, para, custo, elemento, saldoRestante: frags[elemento], tier: u.tier };
}

// Ficha completa do Onírico selecionado: HP, ataque, defesa, velocidade, nível, elemento, classe, tier, raridade, estrelas,
// até 3 habilidades com efeitos e recargas e árvore conectada com as 3 formas.
export function fichaOnirico(u, save = null, cfg = EVOLUCAO_CFG) {
  if (!u) return null;
  const tier = tierDaUnidade(u);
  const estrelas = estrelasDaUnidade(u);
  const nivel = Math.max(1, Number(u.nivel) || 1);
  const esp = u.especie;
  const elemento = ELEMENTO_DA_ESPECIE[esp] || u.elemento || 'neutro';
  const papel = PAPEL_PADRAO[esp] || 'ataque';
  const classe = classeDaUnidade(u);
  const base = statsDoNivel(nivel, papel);
  const multTier = 1 + 0.15 * (tier - 1);
  const multEstrela = 1 + 0.025 * (estrelas - 1);
  const mult = multTier * multEstrela;
  const hp = Math.round(base.hp * mult);
  const atk = Math.round(base.atk * mult);
  const def = Math.round(base.def * mult);
  const velBase = classe === 'Assassino' ? 120 : classe === 'Suporte' || classe === 'Mago' ? 105 : classe === 'Guerreiro' ? 100 : 90;
  const velocidade = Math.round(velBase + nivel * 1.2 + (estrelas - 1) * 1.5);
  const kit = kitDe(esp, papel, elemento, HABILIDADES_DA_ESPECIE[esp] || []).slice(0, 3).map((h) => ({
    id: h.id,
    nome: h.nome,
    icone: h.icone || '✨',
    tipo: h.tipo,
    alvo: h.alvo,
    recarga: h.cd || 1,
    mult: h.mult || null,
    efeitos: (h.efeitos || []).map((e) => ({ id: e.id, nome: EFEITOS[e.id]?.nome || e.id, icone: EFEITOS[e.id]?.icone || '', turnos: e.turnos, chance: e.chance ?? 1 })),
  }));
  const arvore = arvoreEvolucaoDe(u, save, cfg);
  return {
    uid: u.uid || null,
    especie: esp,
    nivel,
    xp: Math.max(0, Number(u.xp) || 0),
    elemento,
    classe,
    papel,
    tier,
    raridade: raridadeRotulo(tier),
    moldura: molduraDoTier(tier),
    estrelas,
    hp,
    ataque: atk,
    defesa: def,
    velocidade,
    habilidades: kit,
    arvore,
  };
}

