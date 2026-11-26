// Regras puras de Fragmentos de Sonho elementais, evolução de forma (10 / 30) e iniciais (T4 → T4 → T5).
// Identificadores e saldos são estritamente separados de fragmentos de chefe, cópias para estrelas e itens de tier.
import { LINHAS, linhaDaEspecie, ELEMENTO_DA_ESPECIE, ARTE_DA_ESPECIE } from '../species.js';
import { REINOS } from '../reinos.js';
import { xpTotal } from './regiao1-progressao.js';

export const FRAGMENTOS_SONHO_CFG = {
  chanceDrop: 0.01, // 1% de chance por Onírico inimigo derrotado
  custoBaseParaSegunda: 10,
  custoSegundaParaTerceira: 30,
  tierIniciaisPorFase: { 1: 4, 2: 4, 3: 5 }, // exclusivo das 5 linhagens iniciais
  maxDerrotasHistorico: 500,
};

export const IDENTIFICADORES_RECURSOS = {
  fragmentoSonho: { pastaSave: 'fragmentosSonho', prefixo: 'frag_sonho:' },
  fragmentoChefe: { pastaSave: 'fragmentosChefe', prefixo: 'frag_chefe:' },
  copiasEstrelas: { pastaSave: 'equipe', prefixo: 'copia_estrela:' },
  itensTier: { pastaSave: 'itensTier', prefixo: 'item_tier:' },
};

export const idFragmentoSonho = (elemento) => `${IDENTIFICADORES_RECURSOS.fragmentoSonho.prefixo}${elemento || 'neutro'}`;
export const LINHAGENS_INICIAIS_IDS = new Set(LINHAS.map((l) => l.id));
export const ehLinhagemInicial = (especie) => Boolean(linhaDaEspecie(especie));

const ELEMENTOS_BASE = { trevas: 0, fogo: 0, agua: 0, planta: 0, luz: 0, fantasma: 0, neutro: 0 };

function garantirMochila(save) {
  const idle = save?.idle || (save ? (save.idle = {}) : {});
  return idle.mochila || (idle.mochila = {});
}

// Garante save.idle.mochila.fragmentosSonho sem apagar saldos existentes nem misturar com outros recursos.
export function fragmentosSonhoDe(save) {
  const moch = garantirMochila(save);
  if (!moch.fragmentosSonho || typeof moch.fragmentosSonho !== 'object') {
    moch.fragmentosSonho = { ...ELEMENTOS_BASE };
  } else {
    for (const k of Object.keys(ELEMENTOS_BASE)) {
      if (moch.fragmentosSonho[k] == null) moch.fragmentosSonho[k] = 0;
    }
  }
  return moch.fragmentosSonho;
}

export function saldoFragmentoSonho(save, elemento) {
  const el = elemento || 'neutro';
  const br = Number(fragmentosSonhoDe(save)[el]);
  return Number.isFinite(br) && br > 0 ? Math.floor(br) : 0;
}

export function adicionarFragmentoSonho(save, elemento, qtd = 1) {
  const frags = fragmentosSonhoDe(save);
  const el = elemento || 'neutro';
  const delta = Math.max(0, Math.floor(Number(qtd) || 0));
  frags[el] = saldoFragmentoSonho(save, el) + delta;
  return frags[el];
}

// Registro compacto de derrotas/lotes pagos para garantir pagamento único (ativo e Idle offline).
export function derrotasPagasDe(save) {
  const idle = save?.idle || (save ? (save.idle = {}) : {});
  if (!idle.derrotasPagas || typeof idle.derrotasPagas !== 'object') {
    idle.derrotasPagas = { ids: {}, ordem: [] };
  }
  idle.derrotasPagas.ids ||= {};
  idle.derrotasPagas.ordem ||= [];
  return idle.derrotasPagas;
}

function marcarDerrotaPaga(save, id, cfg = FRAGMENTOS_SONHO_CFG) {
  if (!id) return;
  const reg = derrotasPagasDe(save);
  if (reg.ids[id]) return;
  reg.ids[id] = true;
  reg.ordem.push(id);
  const limite = cfg.maxDerrotasHistorico || 500;
  while (reg.ordem.length > limite) {
    const antigo = reg.ordem.shift();
    delete reg.ids[antigo];
  }
}

function elementoDaEspecieResolvido(especie, elemento) {
  return elemento || ELEMENTO_DA_ESPECIE[especie] || linhagemReinoDe(especie)?.elemento || 'neutro';
}

// Sorteia drop de 1% do elemento do inimigo derrotado. Cada derrotaId paga no máximo uma vez.
export function sortearDropFragmentoSonho(
  save,
  { derrotaId = null, especie = null, elemento = null, rng = Math.random } = {},
  cfg = FRAGMENTOS_SONHO_CFG,
) {
  const el = elementoDaEspecieResolvido(especie, elemento);
  const itemId = idFragmentoSonho(el);
  if (derrotaId && derrotasPagasDe(save).ids[derrotaId]) {
    return { ok: true, jaPago: true, dropou: false, qtd: 0, elemento: el, itemId, saldo: saldoFragmentoSonho(save, el) };
  }
  const dropou = rng() < cfg.chanceDrop;
  if (dropou) adicionarFragmentoSonho(save, el, 1);
  if (derrotaId) marcarDerrotaPaga(save, derrotaId, cfg);
  return {
    ok: true,
    jaPago: false,
    dropou,
    qtd: dropou ? 1 : 0,
    elemento: el,
    itemId,
    saldo: saldoFragmentoSonho(save, el),
  };
}

// Liquidação em lote (Idle offline): cada abate sorteia 1% do seu elemento; loteId garante idempotência.
export function aplicarDropsOfflineFragmentos(
  save,
  { loteId = null, abates = 0, especie = null, elemento = null, encontros = null, rng = Math.random } = {},
  cfg = FRAGMENTOS_SONHO_CFG,
) {
  if (loteId && derrotasPagasDe(save).ids[loteId]) {
    return { ok: true, jaPago: true, totalDropado: 0, porElemento: {}, saldo: { ...fragmentosSonhoDe(save) } };
  }
  const total = Math.max(0, Math.floor(Number(abates) || 0));
  const porElemento = {};
  let totalDropado = 0;
  for (let i = 0; i < total; i++) {
    const enc = Array.isArray(encontros) && encontros.length ? encontros[i % encontros.length] : null;
    const espEnc = typeof enc === 'string' ? enc : enc?.especie || especie;
    const elEnc = typeof enc === 'string' ? ELEMENTO_DA_ESPECIE[enc] || null : enc?.elementoDrop || enc?.elemento;
    const el = elementoDaEspecieResolvido(espEnc, elEnc || elemento);
    if (rng() < cfg.chanceDrop) {
      adicionarFragmentoSonho(save, el, 1);
      porElemento[el] = (porElemento[el] || 0) + 1;
      totalDropado += 1;
    }
  }
  if (loteId) marcarDerrotaPaga(save, loteId, cfg);
  return { ok: true, jaPago: false, totalDropado, porElemento, saldo: { ...fragmentosSonhoDe(save) } };
}

// Batalha manual: 1% por inimigo derrotado (1 vez por inimigo/batalhaId); derrota/recuo não paga nem consome.
export function aplicarDropsBatalhaManual(
  save,
  { batalhaId = null, inimigos = [], vitoria = true, rng = Math.random } = {},
  cfg = FRAGMENTOS_SONHO_CFG,
) {
  if (!vitoria || !Array.isArray(inimigos) || !inimigos.length) {
    return { ok: true, jaPago: false, totalDropado: 0, porElemento: {}, resultados: [], saldo: { ...fragmentosSonhoDe(save) } };
  }
  const porElemento = {};
  const resultados = [];
  let totalDropado = 0;
  inimigos.forEach((ini, idx) => {
    const ehTupla = Array.isArray(ini);
    const especie = ehTupla ? ini[0] : ini?.especie || null;
    const elExplicito = ehTupla ? ini[2] || null : ini?.elementoDrop || ini?.elemento || null;
    const derrotaId = (!ehTupla && ini?.derrotaId) || (batalhaId ? `manual:${batalhaId}:i${idx}` : null);
    const res = sortearDropFragmentoSonho(save, { derrotaId, especie, elemento: elExplicito, rng }, cfg);
    resultados.push(res);
    if (res.dropou) {
      porElemento[res.elemento] = (porElemento[res.elemento] || 0) + 1;
      totalDropado += 1;
    }
  });
  const jaPago = resultados.length > 0 && resultados.every((r) => r.jaPago);
  return { ok: true, jaPago, totalDropado, porElemento, resultados, saldo: { ...fragmentosSonhoDe(save) } };
}

function linhagemReinoDe(especie) {
  for (const r of Object.values(REINOS)) {
    const lin = r.linhagens?.find((l) => l.nome === especie);
    if (lin) return lin;
  }
  return null;
}

// Contrato para UI (dioh293): consulta saldo, custo e resultado previsto da evolução de forma.
export function consultarEvolucaoForma(save, unidadeOuIdx, cfg = FRAGMENTOS_SONHO_CFG) {
  const u = typeof unidadeOuIdx === 'number' ? save?.idle?.equipe?.[unidadeOuIdx] : unidadeOuIdx;
  if (!u) {
    return {
      podeEvoluir: false,
      motivo: 'Onírico não encontrado.',
      faseAtual: null,
      proximaFase: null,
      de: null,
      para: null,
      linhagemInicial: false,
      elemento: 'neutro',
      itemId: idFragmentoSonho('neutro'),
      custo: null,
      saldo: 0,
      faltam: 0,
      nivel: 1,
      tierAtual: 1,
      tierResultante: 1,
      estrelas: 1,
    };
  }
  const tierAtual = Math.max(1, Math.min(5, Math.floor(Number(u.tier ?? u.tierHW ?? u.raridade ?? 1) || 1)));
  const estrelas = Math.max(1, Math.floor(Number(u.estrelas ?? 1) || 1));
  const nivel = Math.max(1, Math.floor(Number(u.nivel ?? 1) || 1));
  const lin = linhaDaEspecie(u.especie);
  const reinoLin = lin ? null : linhagemReinoDe(u.especie);

  let faseAtual = 1;
  let proximaFase = null;
  let de = u.especie;
  let para = null;
  let arteNova = null;
  let linhagemInicial = false;
  let bloqueada = false;
  let elemento = ELEMENTO_DA_ESPECIE[u.especie] || u.elemento || 'neutro';
  let tierResultante = tierAtual;

  if (lin) {
    const formas = [lin.inicial, lin.atual, lin.evolucao];
    const idx = formas.indexOf(u.especie);
    faseAtual = idx >= 0 ? idx + 1 : 1;
    elemento = ELEMENTO_DA_ESPECIE[lin.inicial] || elemento;
    linhagemInicial = true;
    if (faseAtual < 3) {
      const alvoPara = formas[faseAtual];
      if (u.especie === NOCTARN_REGRA.evolucaoBloqueadaDe && alvoPara === NOCTARN_REGRA.especie) {
        bloqueada = true;
      } else {
        proximaFase = faseAtual + 1;
        para = alvoPara;
        arteNova = ARTE_DA_ESPECIE[para] || null;
        tierResultante = Math.max(tierAtual, cfg.tierIniciaisPorFase[proximaFase]);
      }
    }
  } else if (reinoLin) {
    faseAtual = Math.max(1, Math.min(3, Math.floor(Number(u.formaFase ?? 1) || 1)));
    elemento = reinoLin.elemento || elemento;
    if (faseAtual < 3) {
      proximaFase = faseAtual + 1;
      para = u.especie;
      arteNova = reinoLin.formas?.[proximaFase - 1] || null;
    }
  }

  const custo = proximaFase === 2 ? cfg.custoBaseParaSegunda : proximaFase === 3 ? cfg.custoSegundaParaTerceira : null;
  const saldo = saldoFragmentoSonho(save, elemento);
  const faltam = custo != null ? Math.max(0, custo - saldo) : 0;
  const podeEvoluir = Boolean(!bloqueada && custo != null && saldo >= custo);
  const motivo = bloqueada
    ? NOCTARN_REGRA.bloqueioMotivo
    : !proximaFase
      ? (lin || reinoLin ? 'Este Onírico já está na 3ª forma.' : 'Esta espécie não possui evolução de forma.')
      : podeEvoluir
        ? null
        : `Faltam ${faltam} Fragmento(s) de Sonho (${elemento}): precisa de ${custo}, saldo ${saldo}.`;

  return {
    podeEvoluir,
    bloqueada,
    motivo,
    faseAtual,
    proximaFase,
    de,
    para,
    ...(arteNova ? { arteNova } : {}),
    linhagemInicial,
    elemento,
    itemId: idFragmentoSonho(elemento),
    custo,
    saldo,
    faltam,
    nivel,
    tierAtual,
    tierResultante,
    estrelas,
  };
}

// Evolui forma consumindo 10 (base→2ª) ou 30 (2ª→3ª) Fragmentos de Sonho do elemento da linhagem.
// Preserva nível, XP, estrelas e (para não-iniciais) tier. Iniciais: base/2ª = T4, 3ª = T5.
export function evoluirFormaPorFragmentos(
  save,
  idxUnidade,
  { operacaoId = null } = {},
  cfg = FRAGMENTOS_SONHO_CFG,
) {
  if (operacaoId && derrotasPagasDe(save).ids[operacaoId]) {
    const atual = consultarEvolucaoForma(save, idxUnidade, cfg);
    return { ok: true, jaAplicado: true, ...atual };
  }
  const consulta = consultarEvolucaoForma(save, idxUnidade, cfg);
  if (!consulta.podeEvoluir) {
    return { ok: false, jaAplicado: false, ...consulta };
  }
  const u = save.idle.equipe[idxUnidade];
  const frags = fragmentosSonhoDe(save);
  const saldoAntes = saldoFragmentoSonho(save, consulta.elemento);
  frags[consulta.elemento] = saldoAntes - consulta.custo;
  const saldoDepois = frags[consulta.elemento];

  if (consulta.linhagemInicial) u.especie = consulta.para;
  u.formaFase = consulta.proximaFase;
  if (consulta.arteNova) u.arteForma = consulta.arteNova;
  u.nivel = consulta.nivel;
  u.estrelas = consulta.estrelas;
  u.tier = consulta.linhagemInicial ? consulta.tierResultante : consulta.tierAtual;
  u.raridade = u.tier;

  if (operacaoId) marcarDerrotaPaga(save, operacaoId, cfg);
  return {
    ok: true,
    jaAplicado: false,
    de: consulta.de,
    para: consulta.para,
    faseAnterior: consulta.faseAtual,
    faseNova: consulta.proximaFase,
    elemento: consulta.elemento,
    itemId: consulta.itemId,
    custo: consulta.custo,
    saldoAntes,
    saldoDepois,
    nivel: u.nivel,
    tier: u.tier,
    estrelas: u.estrelas,
    unidade: u,
  };
}

// Criação de unidade inicial (regra pura): sempre nasce na forma base T4, sem alterar saves antigos.
export function criarUnidadeInicial(especieOuLinha, { nivel = 5, uid = 'ini0', estrelas = 1, origem = 'inicial' } = {}) {
  const lin = LINHAS.find((l) => l.id === especieOuLinha || l.inicial === especieOuLinha || l.atual === especieOuLinha || l.evolucao === especieOuLinha) || LINHAS[0];
  const nv = Math.max(1, Math.floor(Number(nivel) || 5));
  const est = Math.max(1, Math.floor(Number(estrelas) || 1));
  return {
    especie: lin.inicial,
    nivel: nv,
    xp: xpTotal(nv),
    tier: FRAGMENTOS_SONHO_CFG.tierIniciaisPorFase[1],
    raridade: FRAGMENTOS_SONHO_CFG.tierIniciaisPorFase[1],
    estrelas: est,
    forma: 'natural',
    formaFase: 1,
    inicial: true,
    origem,
    uid,
    arte: ARTE_DA_ESPECIE[lin.inicial] || null,
  };
}

// ---- Regra do Noctarn, exclusão de Sombra no banner permanente e migração segura de saves ----
export const ELEMENTOS_FORA_BANNER_PERMANENTE = new Set(['trevas', 'sombra']);
export const ehElementoForaBannerPermanente = (elemento) => ELEMENTOS_FORA_BANNER_PERMANENTE.has(String(elemento || '').toLowerCase());

export const NOCTARN_REGRA = {
  especie: 'Noctarn',
  formaBaseInicial: 'Penumbrio',
  elemento: 'trevas',
  tier: 4,
  exclusivoBanner: true,
  evolucaoBloqueadaDe: 'Penumbrio',
  bloqueioMotivo: 'Noctarn é exclusivo de banners (Sombra/temáticos, T4) e não pode ser obtido evoluindo Penumbrio.',
  noBannerPermanente: false,
  elementosForaPermanente: ['trevas', 'sombra'],
  bannersPermitidos: ['sombra', 'tematico', 'evento'],
};

export const ehCopiaDeBanner = (m) => Boolean(m && (m.origem === 'banner' || m.fonteBanner || m.evento || m.tierHW));

// Migra apenas Noctarn antigo cuja origem inicial possa ser identificada; cópias de banner e demais ficam preservadas em T4.
export function migrarInicialNoctarn(save) {
  const idle = save?.idle;
  if (!idle || !Array.isArray(idle.equipe)) return { migrou: false, migradoUid: null, copiasPreservadas: 0 };
  const eq = idle.equipe;
  const idxMarcado = eq.findIndex((m) => m?.especie === 'Noctarn' && (m.inicial === true || m.uid === 'ini0') && !ehCopiaDeBanner(m));
  const idxConta = save.conta?.inicial === 'Noctarn'
    ? eq.findIndex((m) => m?.especie === 'Noctarn' && !ehCopiaDeBanner(m))
    : -1;
  const codexNoctarn = idle.codex?.especies?.Noctarn;
  const idxDefault = eq.findIndex((m, i) => i === 0 && m?.especie === 'Noctarn' && !ehCopiaDeBanner(m)
    && (m.uid === 'o0' || !m.uid) && (Number(m.nivel) || 0) >= 5
    && (codexNoctarn?.capturas || 0) > 0 && !(codexNoctarn?.abates > 0));
  const idx = idxMarcado >= 0 ? idxMarcado : idxConta >= 0 ? idxConta : idxDefault;

  let migrou = false;
  let migradoUid = null;
  if (idx >= 0) {
    const membro = eq[idx];
    const t = Math.max(FRAGMENTOS_SONHO_CFG.tierIniciaisPorFase[1], Math.min(5, Math.floor(Number(membro.tier ?? membro.raridade ?? 4) || 4)));
    membro.especie = NOCTARN_REGRA.formaBaseInicial;
    membro.inicial = true;
    membro.origem = idx === idxDefault ? 'inicial-padrao' : 'inicial';
    membro.formaFase = 1;
    membro.tier = t;
    membro.raridade = t;
    membro.estrelas = Math.max(1, Math.floor(Number(membro.estrelas) || 1));
    if (save.conta?.inicial === 'Noctarn') save.conta.inicial = NOCTARN_REGRA.formaBaseInicial;
    const especies = idle.codex?.especies;
    if (especies) {
      especies.Penumbrio = { ...(especies.Penumbrio || {}), visto: true, capturas: Math.max(1, especies.Penumbrio?.capturas || 0) };
      if (especies.Noctarn) {
        especies.Noctarn = { ...especies.Noctarn, capturas: eq.some((m) => m?.especie === 'Noctarn') ? Math.max(1, especies.Noctarn.capturas || 0) : 0 };
      }
    }
    migrou = true;
    migradoUid = membro.uid || null;
  }

  let copiasPreservadas = 0;
  for (const m of eq) {
    if (m?.especie !== 'Noctarn') continue;
    const t = Math.max(NOCTARN_REGRA.tier, Math.min(5, Math.floor(Number(m.tier ?? m.tierHW ?? m.raridade ?? NOCTARN_REGRA.tier) || NOCTARN_REGRA.tier)));
    m.tier = t;
    m.raridade = t;
    m.estrelas = Math.max(1, Math.floor(Number(m.estrelas) || 1));
    copiasPreservadas += 1;
  }
  return { migrou, migradoUid, copiasPreservadas };
}

// Regra pura para conta nova: substitui o inicial provisório (Penumbrio) pelo escolhido, mantendo T4 e bônus único.
export function aplicarInicialContaNova(save, { userId, inicial, agora = Date.now(), novo = true } = {}) {
  const DIA = 86400000;
  save.conta = save.conta || {};
  save.idle = save.idle || {};
  const idle = save.idle;
  idle.equipe = idle.equipe || [];
  migrarInicialNoctarn(save);

  const unidade = criarUnidadeInicial(inicial, { nivel: 5, uid: 'ini0', estrelas: 1, origem: 'inicial' });
  save.conta.uid = userId;
  save.conta.inicial = unidade.especie;

  const padrao = idle.equipe.findIndex((m) => m?.origem === 'inicial-padrao');
  if (novo && padrao >= 0) {
    const uid = idle.equipe[padrao].uid || 'ini0';
    unidade.uid = uid;
    idle.equipe[padrao] = unidade;
    const resto = (idle.formacao?.length ? idle.formacao : idle.equipe.map((m) => m.uid)).filter((x) => x && x !== uid);
    idle.formacao = [uid, ...resto].slice(0, 4);
    while (idle.formacao.length < 4) idle.formacao.push(null);
  } else if (!idle.equipe.some((m) => m?.inicial)) {
    idle.equipe.unshift(unidade);
    const resto = (idle.formacao?.length ? idle.formacao : idle.equipe.map((m) => m.uid)).filter((x) => x && x !== unidade.uid);
    idle.formacao = [unidade.uid, ...resto].slice(0, 4);
    while (idle.formacao.length < 4) idle.formacao.push(null);
  }

  save.recompensas = save.recompensas || { gold: 0, diamantes: 0, xp: 0 };
  if (novo && !save.conta.bonusEm) {
    save.conta.bonusEm = agora;
    save.conta.vipAte = agora + 10 * DIA;
    save.recompensas.diamantes = (save.recompensas.diamantes || 0) + 20000;
  }
  return save;
}
