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
