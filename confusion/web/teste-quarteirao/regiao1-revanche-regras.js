// Regras puras de Revanche de Chefes (cooldown 10 min reais, craft 10 fragmentos) e comparação de poder (T5 comum vs Chefe +20% vs Banner +30%).
import { BOSSES_REGIAO1 } from './regiao1-estado.js';
import { statsDoNivel } from './regiao1-estrategia-regras.js';
import { PODER_EXCLUSIVO, PAPEL_PADRAO } from './regiao1-batalha-habilidades.js';
import { reforcosDoChefe } from './regiao1-encontros-regras.js';

export const REVANCHE_CFG = {
  cooldownMs: 10 * 60 * 1000, // 10 minutos reais por chefe; velocidade ×2/×3 NÃO acelera
  custoCraftFragmentos: 10,
  fragmentosGarantidosPorVitoria: 1, // proposta inicial ajustável
  nivelInicialCraft: 1, // declarado antes do craft
  tierChefeRecrutado: 5,
  estrelasIniciaisCraft: 1,
  multiplicadoresVelocidadeAfetamCooldown: false,
  exigirDerrotaCampanha: true,
};

export const PODER_CATEGORIAS = {
  comum_t5: { id: 'comum_t5', rotulo: 'T5 Comum', hp: 0, atk: 0, def: 0 },
  chefe_recrutado: { id: 'chefe_recrutado', rotulo: 'Chefe Recrutado', hp: 0.20, atk: 0.20, def: 0.20 },
  exclusivo_banner: { id: 'exclusivo_banner', rotulo: 'Exclusivo de Banner', hp: 0.30, atk: 0.30, def: 0.30 },
};

export const CHEFES_REVANCHE_CATALOGO = {
  BOSS_E: {
    bossId: 'BOSS_E',
    nome: BOSSES_REGIAO1.BOSS_E.nome,
    especieRecrutavel: 'Espírito da Floresta',
    elemento: BOSSES_REGIAO1.BOSS_E.elemento,
    papel: 'suporte',
    fragmentoId: 'frag_chefe:BOSS_E',
    fragmentosGarantidos: 1,
    arte: 'assets/confusion/interface/personagens/espirito-boss-atual.webp',
    dropsExclusivos: [
      { id: 'seiva_ancestral_boss_e', nome: 'Seiva Ancestral', chance: 0.35, qtd: 1 },
    ],
  },
  BOSS_D: {
    bossId: 'BOSS_D',
    nome: BOSSES_REGIAO1.BOSS_D.nome,
    especieRecrutavel: 'Rei Fungo',
    elemento: BOSSES_REGIAO1.BOSS_D.elemento,
    papel: 'defesa',
    fragmentoId: 'frag_chefe:BOSS_D',
    fragmentosGarantidos: 1,
    arte: 'assets/confusion/interface/personagens/fungo.webp',
    dropsExclusivos: [
      { id: 'esporo_regio_boss_d', nome: 'Esporo Régio', chance: 0.35, qtd: 1 },
    ],
  },
  BOSS_S: {
    bossId: 'BOSS_S',
    nome: BOSSES_REGIAO1.BOSS_S.nome,
    especieRecrutavel: 'Siren',
    elemento: BOSSES_REGIAO1.BOSS_S.elemento,
    papel: 'suporte',
    fragmentoId: 'frag_chefe:BOSS_S',
    fragmentosGarantidos: 1,
    arte: 'assets/confusion/interface/personagens/siren.webp',
    dropsExclusivos: [
      { id: 'concha_abissal_boss_s', nome: 'Concha Abissal', chance: 0.35, qtd: 1 },
    ],
  },
  BOSS_C: {
    bossId: 'BOSS_C',
    nome: BOSSES_REGIAO1.BOSS_C.nome,
    especieRecrutavel: 'Golem de Ametista',
    elemento: BOSSES_REGIAO1.BOSS_C.elemento,
    papel: 'defesa',
    fragmentoId: 'frag_chefe:BOSS_C',
    fragmentosGarantidos: 1,
    arte: 'assets/confusion/interface/personagens/golem.webp',
    dropsExclusivos: [
      { id: 'nucleo_ametista_boss_c', nome: 'Núcleo de Ametista', chance: 0.35, qtd: 1 },
    ],
  },
};

// Regra de não-empilhamento: chefe recrutado (+20%) e exclusivo de banner (+30%) nunca somam (+50%).
export function bonusCategoriaPoder(unidade) {
  const ehExclusivo = Boolean(
    unidade?.exclusivoBanner ||
    unidade?.categoriaPoder === 'exclusivo_banner' ||
    unidade?.tierHW ||
    PODER_EXCLUSIVO[unidade?.especie],
  );
  const ehChefe = Boolean(
    unidade?.chefeRecrutado ||
    unidade?.origem === 'chefe_revanche' ||
    unidade?.categoriaPoder === 'chefe_recrutado',
  );
  if (ehExclusivo) {
    return {
      categoria: 'exclusivo_banner',
      hp: PODER_CATEGORIAS.exclusivo_banner.hp,
      atk: PODER_CATEGORIAS.exclusivo_banner.atk,
      def: PODER_CATEGORIAS.exclusivo_banner.def,
      empilhamentoBloqueado: ehChefe,
    };
  }
  if (ehChefe) {
    return {
      categoria: 'chefe_recrutado',
      hp: PODER_CATEGORIAS.chefe_recrutado.hp,
      atk: PODER_CATEGORIAS.chefe_recrutado.atk,
      def: PODER_CATEGORIAS.chefe_recrutado.def,
      empilhamentoBloqueado: false,
    };
  }
  return { categoria: 'comum_t5', hp: 0, atk: 0, def: 0, empilhamentoBloqueado: false };
}

// Comparação explícita em nível, forma e estrelas equivalentes com coeficientes explícitos de HP/ATQ/DEF.
export function calcularAtributosComparaveis({
  especie = 'Onírico',
  nivel = 1,
  forma = 1,
  estrelas = 1,
  tier = 5,
  papel = null,
  categoriaPoder = null,
  chefeRecrutado = false,
  exclusivoBanner = false,
} = {}) {
  const pap = papel || PAPEL_PADRAO[especie] || 'ataque';
  const nv = Math.max(1, Math.floor(Number(nivel) || 1));
  const f = Math.max(1, Math.min(3, Math.floor(Number(forma) || 1)));
  const est = Math.max(1, Math.floor(Number(estrelas) || 1));
  const tr = Math.max(1, Math.min(5, Math.floor(Number(tier) || 5)));

  const s = statsDoNivel(nv, pap);
  const multTier = 1 + 0.15 * (tr - 1);
  const multForma = 1 + 0.05 * (f - 1);
  const multEstrelas = 1 + 0.025 * (est - 1);
  const escala = multTier * multForma * multEstrelas;

  const baseT5Comum = {
    hp: Math.round(s.hp * escala),
    atk: Math.round(s.atk * escala),
    def: Math.round(s.def * escala),
  };

  const cat = bonusCategoriaPoder({ especie, categoriaPoder, chefeRecrutado, exclusivoBanner });
  return {
    hp: Math.round(baseT5Comum.hp * (1 + cat.hp)),
    atk: Math.round(baseT5Comum.atk * (1 + cat.atk)),
    def: Math.round(baseT5Comum.def * (1 + cat.def)),
    baseT5Comum,
    coeficientes: { hp: cat.hp, atk: cat.atk, def: cat.def },
    categoria: cat.categoria,
    empilhamentoBloqueado: cat.empilhamentoBloqueado,
    parametros: { nivel: nv, forma: f, estrelas: est, tier: tr, papel: pap },
  };
}

export function compararPoderEquivalente({ nivel = 30, forma = 2, estrelas = 5, papel = 'ataque' } = {}) {
  const comumT5 = calcularAtributosComparaveis({ especie: 'Comparavel', nivel, forma, estrelas, tier: 5, papel, categoriaPoder: 'comum_t5' });
  const chefeRecrutado = calcularAtributosComparaveis({ especie: 'Comparavel', nivel, forma, estrelas, tier: 5, papel, categoriaPoder: 'chefe_recrutado', chefeRecrutado: true });
  const exclusivoBanner = calcularAtributosComparaveis({ especie: 'Comparavel', nivel, forma, estrelas, tier: 5, papel, categoriaPoder: 'exclusivo_banner', exclusivoBanner: true });
  return {
    comumT5,
    chefeRecrutado,
    exclusivoBanner,
    razoes: {
      chefeVsComum: {
        hp: chefeRecrutado.hp / comumT5.hp,
        atk: chefeRecrutado.atk / comumT5.atk,
        def: chefeRecrutado.def / comumT5.def,
      },
      bannerVsComum: {
        hp: exclusivoBanner.hp / comumT5.hp,
        atk: exclusivoBanner.atk / comumT5.atk,
        def: exclusivoBanner.def / comumT5.def,
      },
    },
  };
}

export function revancheDe(save) {
  const idle = save?.idle || (save ? (save.idle = {}) : {});
  const moch = idle.mochila || (idle.mochila = {});
  if (!moch.fragmentosChefe || typeof moch.fragmentosChefe !== 'object') moch.fragmentosChefe = {};
  if (!moch.itensExclusivosChefe || typeof moch.itensExclusivosChefe !== 'object') moch.itensExclusivosChefe = {};
  if (!idle.revanches || typeof idle.revanches !== 'object') {
    idle.revanches = { cooldowns: {}, emAndamento: null, concluidas: {}, craftsPagos: {} };
  }
  idle.revanches.cooldowns ||= {};
  idle.revanches.concluidas ||= {};
  idle.revanches.craftsPagos ||= {};
  if (!('emAndamento' in idle.revanches)) idle.revanches.emAndamento = null;
  return idle.revanches;
}

export function saldoFragmentosChefe(save, bossId) {
  revancheDe(save);
  const v = Number(save.idle.mochila.fragmentosChefe[bossId]);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
}

export function statusRevancheChefe(save, bossId, agoraMs = Date.now(), cfg = REVANCHE_CFG) {
  const def = CHEFES_REVANCHE_CATALOGO[bossId];
  if (!def) return { ok: false, motivo: 'Chefe inválido.' };
  const rev = revancheDe(save);
  const liberadoCampanha = !cfg.exigirDerrotaCampanha || Boolean(save?.bossesDerrotados?.[bossId]);
  const proximoDisponivelEm = Number(rev.cooldowns[bossId]) || 0;
  const restanteMs = Math.max(0, proximoDisponivelEm - agoraMs);
  const emCooldown = restanteMs > 0;
  const batalhaConcorrente = Boolean(rev.emAndamento);
  const saldoFragmentos = saldoFragmentosChefe(save, bossId);
  return {
    ok: true,
    bossId,
    nome: def.nome,
    liberadoCampanha,
    emCooldown,
    restanteMs,
    proximoDisponivelEm,
    batalhaConcorrente,
    saldoFragmentos,
    custoCraft: cfg.custoCraftFragmentos,
    podeIniciar: liberadoCampanha && !emCooldown && !batalhaConcorrente,
  };
}

// Inicia revanche de chefe: valida campanha, ausência de batalha concorrente e cooldown real de 10 min por chefe.
export function iniciarRevancheChefe(
  save,
  bossId,
  { agoraMs = Date.now(), batalhaId = null, velocidade = 1 } = {},
  cfg = REVANCHE_CFG,
) {
  void velocidade; // ×2/×3 nunca altera cooldown real
  const st = statusRevancheChefe(save, bossId, agoraMs, cfg);
  if (!st.ok) return st;
  if (!st.liberadoCampanha) return { ok: false, motivo: `Derrote ${st.nome} na Campanha primeiro.` };
  if (st.batalhaConcorrente) return { ok: false, motivo: 'Já existe uma revanche em andamento.' };
  if (st.emCooldown) {
    return { ok: false, motivo: `Aguarde ${Math.ceil(st.restanteMs / 1000)}s para desafiar ${st.nome} novamente.`, restanteMs: st.restanteMs };
  }
  const rev = revancheDe(save);
  const id = batalhaId || `rev_${bossId}_${agoraMs}`;
  const def = CHEFES_REVANCHE_CATALOGO[bossId];
  const nivelChefe = BOSSES_REGIAO1[bossId]?.nivel || 12;
  const reforcos = reforcosDoChefe(bossId, nivelChefe);
  rev.emAndamento = { batalhaId: id, bossId, iniciadaEm: agoraMs };
  return {
    ok: true,
    batalha: rev.emAndamento,
    chefe: def,
    reforcos,
  };
}

// Conclui revanche com idempotência por batalhaId e cooldown em tempo real (não acelerado por ×2/×3).
export function concluirRevancheChefe(
  save,
  { batalhaId, vitoria = true, agoraMs = Date.now(), rng = Math.random, velocidade = 1 } = {},
  cfg = REVANCHE_CFG,
  catalogo = CHEFES_REVANCHE_CATALOGO,
) {
  void velocidade; // ×2/×3 não reduz cooldown real de 10 min
  const rev = revancheDe(save);
  if (batalhaId && rev.concluidas[batalhaId]) {
    return { ok: true, jaPago: true, ...rev.concluidas[batalhaId] };
  }
  const ativa = rev.emAndamento;
  if (!ativa || (batalhaId && ativa.batalhaId !== batalhaId)) {
    return { ok: false, motivo: 'Nenhuma revanche correspondente em andamento.' };
  }
  const bossId = ativa.bossId;
  const def = catalogo[bossId];
  rev.emAndamento = null;
  rev.cooldowns[bossId] = agoraMs + cfg.cooldownMs;

  let fragmentosGanhos = 0;
  const drops = [];
  if (vitoria && def) {
    fragmentosGanhos = Number(def.fragmentosGarantidos ?? cfg.fragmentosGarantidosPorVitoria) || 0;
    if (fragmentosGanhos > 0) {
      save.idle.mochila.fragmentosChefe[bossId] = saldoFragmentosChefe(save, bossId) + fragmentosGanhos;
    }
    for (const d of def.dropsExclusivos || []) {
      if (rng() < d.chance) {
        const qtd = d.qtd || 1;
        save.idle.mochila.itensExclusivosChefe[d.id] = (save.idle.mochila.itensExclusivosChefe[d.id] || 0) + qtd;
        drops.push({ id: d.id, nome: d.nome, qtd });
      }
    }
  }
  const resultado = {
    bossId,
    vitoria: Boolean(vitoria),
    fragmentosGanhos,
    fragmentoId: def?.fragmentoId || `frag_chefe:${bossId}`,
    saldoFragmentos: saldoFragmentosChefe(save, bossId),
    drops,
    cooldownAte: rev.cooldowns[bossId],
    cooldownMs: cfg.cooldownMs,
  };
  if (ativa.batalhaId) rev.concluidas[ativa.batalhaId] = resultado;
  return { ok: true, jaPago: false, ...resultado };
}

// Declaração explícita antes do craft (nível 1, T5, +20% vs T5 comum equivalente).
export function previsaoCraftChefe(save, bossId, cfg = REVANCHE_CFG) {
  const def = CHEFES_REVANCHE_CATALOGO[bossId];
  if (!def) return { ok: false, motivo: 'Chefe inválido.' };
  const saldoFragmentos = saldoFragmentosChefe(save, bossId);
  const custoFragmentos = cfg.custoCraftFragmentos;
  return {
    ok: true,
    bossId,
    nome: def.nome,
    especie: def.especieRecrutavel,
    fragmentoId: def.fragmentoId,
    custoFragmentos,
    saldoFragmentos,
    podeCraftar: saldoFragmentos >= custoFragmentos,
    nivelInicial: cfg.nivelInicialCraft,
    tier: cfg.tierChefeRecrutado,
    estrelas: cfg.estrelasIniciaisCraft,
    categoriaPoder: 'chefe_recrutado',
    bonusPoder: PODER_CATEGORIAS.chefe_recrutado,
    avisoRegra: `O chefe criado começa no Nível ${cfg.nivelInicialCraft} (T${cfg.tierChefeRecrutado}, ${cfg.estrelasIniciaisCraft}★) com +20% de força base sobre um T5 comum equivalente.`,
  };
}

// Consome 10 fragmentos daquele mesmo chefe e recruta no nível 1.
export function craftarChefe(save, bossId, { agoraMs = Date.now(), operacaoId = null } = {}, cfg = REVANCHE_CFG) {
  const rev = revancheDe(save);
  if (operacaoId && rev.craftsPagos[operacaoId]) {
    return { ok: true, jaAplicado: true, ...rev.craftsPagos[operacaoId] };
  }
  const prev = previsaoCraftChefe(save, bossId, cfg);
  if (!prev.ok) return prev;
  if (!prev.podeCraftar) {
    return {
      ...prev,
      ok: false,
      motivo: `Faltam fragmentos de ${prev.nome}: precisa de ${prev.custoFragmentos}, saldo ${prev.saldoFragmentos}.`,
    };
  }
  const def = CHEFES_REVANCHE_CATALOGO[bossId];
  save.idle.mochila.fragmentosChefe[bossId] = prev.saldoFragmentos - prev.custoFragmentos;
  const equipe = save.idle.equipe || (save.idle.equipe = []);
  const unidade = {
    especie: def.especieRecrutavel,
    nivel: cfg.nivelInicialCraft,
    xp: 0,
    tier: cfg.tierChefeRecrutado,
    raridade: cfg.tierChefeRecrutado,
    estrelas: cfg.estrelasIniciaisCraft,
    forma: 'natural',
    formaFase: 1,
    elemento: def.elemento,
    papel: def.papel,
    origem: 'chefe_revanche',
    bossId,
    categoriaPoder: 'chefe_recrutado',
    chefeRecrutado: true,
    arte: def.arte,
    uid: `boss_${bossId}_${agoraMs}_${equipe.length}`,
  };
  equipe.push(unidade);
  const res = {
    bossId,
    unidade,
    custoFragmentos: prev.custoFragmentos,
    saldoRestante: save.idle.mochila.fragmentosChefe[bossId],
    avisoRegra: prev.avisoRegra,
  };
  if (operacaoId) rev.craftsPagos[operacaoId] = res;
  return { ok: true, jaAplicado: false, ...res };
}
