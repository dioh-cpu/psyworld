// Domadores auxiliares (5º aliado fora das 4 vagas de Oníricos; não ocupam vaga nem são alvejáveis).
// Regras 100% puras (sem DOM) com catálogo, obtenção, nível/XP, passiva e barra de energia em combate.
import { POCOES } from './regiao1-progressao.js';
import { hwDe } from './regiao1-halloween-regras.js';

export const DOMADORES_CFG = {
  vagasOniricos: 4,
  vagasDomadorApoio: 1,
  ocupaVagaOnirico: false,
  alvejavel: false,
  nivelMax: 100,
  acaoBatalha: {
    barraMax: 100,
    ganhoPorTurnoAliado: 35,
    ganhoAoSofrerDano: 10,
    turnosBaseSemDano: 3, // 3 × 35 = 105 >= 100
  },
};

export function xpParaProximoNivelDomador(nivel) {
  const n = Math.max(1, Math.min(DOMADORES_CFG.nivelMax, Math.floor(Number(nivel) || 1)));
  return 120 + (n - 1) * 45 + (n - 1) * (n - 1) * 3;
}

export function xpTotalDomadorAuxiliar(nivel) {
  const lv = Math.max(1, Math.min(DOMADORES_CFG.nivelMax, Math.floor(Number(nivel) || 1)));
  let total = 0;
  for (let i = 1; i < lv; i++) total += xpParaProximoNivelDomador(i);
  return total;
}

export function nivelDomadorAuxiliarDe(xpTotal) {
  const x = Math.max(0, Math.floor(Number(xpTotal) || 0));
  let acc = 0;
  for (let n = 1; n < DOMADORES_CFG.nivelMax; n++) {
    const passo = xpParaProximoNivelDomador(n);
    if (acc + passo > x) return n;
    acc += passo;
  }
  return DOMADORES_CFG.nivelMax;
}

export function statsDoDomador(nivel) {
  const lv = Math.max(1, Math.min(DOMADORES_CFG.nivelMax, Math.floor(Number(nivel) || 1)));
  return {
    nivel: lv,
    atk: Math.round(45 + lv * 2.8),
    poderApoio: Number((1 + (lv - 1) * 0.006).toFixed(4)),
  };
}

export const CATALOGO_DOMADORES = [
  {
    id: 'azazel',
    nome: 'Azazel',
    chaveKitCombate: 'Azazel',
    titulo: 'Domador Primordial',
    elemento: 'trevas',
    papel: 'equilibrado',
    obtencao: {
      tipo: 'inicial',
      gratis: true,
      descricao: 'Domador inicial, disponível desde o começo da jornada.',
    },
    arte: {
      idle: 'assets/regiao1/azazel.webp',
      retrato: 'assets/regiao1/azazel.webp',
      s1: null,
      s2: null,
      s3: null,
    },
    passiva: {
      id: 'pacto_duplo',
      nome: 'Pacto do Vínculo',
      desc: '+6% a +15% de vida máxima e +4% a +10% de ataque para os 4 Oníricos da formação (conforme o nível).',
    },
    calcularPassiva(nivel) {
      const lv = Math.max(1, Math.min(DOMADORES_CFG.nivelMax, Math.floor(Number(nivel) || 1)));
      const t = (lv - 1) / (DOMADORES_CFG.nivelMax - 1);
      return {
        vidaPct: Number((0.06 + t * 0.09).toFixed(4)),
        ataquePct: Number((0.04 + t * 0.06).toFixed(4)),
        defesaPct: 0,
        critico: 0,
      };
    },
    habilidades: [
      {
        id: 'comando_sombrio',
        nome: 'Comando Sombrio',
        icone: '🕯️',
        tipo: 'dano',
        alvo: 'um',
        mult: 1.2,
        cd: 1,
        distancia: true,
        elemento: 'trevas',
        efeitos: [{ id: 'fraqueza', turnos: 2, chance: 0.65 }],
        desc: 'Dispara um selo sombrio no alvo com chance de reduzir o ataque.',
      },
      {
        id: 'vinculo_protetor',
        nome: 'Vínculo Protetor',
        icone: '🛡️',
        tipo: 'apoio',
        alvo: 'aliados',
        cd: 3,
        elemento: 'trevas',
        cura: 0.12,
        efeitos: [{ id: 'escudo', turnos: 2, pct: 0.12 }],
        desc: 'Cura 12% da vida e concede escudo protetor aos 4 Oníricos.',
      },
      {
        id: 'decreto_do_domador',
        nome: 'Decreto do Domador',
        icone: '✨',
        tipo: 'apoio',
        alvo: 'aliados',
        cd: 5,
        elemento: 'trevas',
        efeitos: [{ id: 'ataque_alto', turnos: 2 }, { id: 'defesa_alta', turnos: 2 }],
        desc: 'Eleva ataque e defesa de toda a equipe por 2 turnos.',
      },
    ],
  },
  {
    id: 'manipulador',
    nome: 'Manipulador das Oito Lâminas',
    chaveKitCombate: 'Manipulador das Oito Lâminas',
    titulo: 'Mestre Telecinético',
    elemento: 'aco',
    papel: 'ofensivo',
    obtencao: {
      tipo: 'capitulo_ou_diamantes',
      capituloRequisito: 2,
      custoDiamantes: 1500,
      descricao: 'Conclua o Capítulo 2 da Campanha Mini ou desbloqueie imediatamente por 1.500 diamantes.',
    },
    arte: {
      idle: 'assets/confusion/interface/personagens/oito-laminas/idle-com-laminas.webp',
      retrato: 'assets/confusion/interface/personagens/oito-laminas/idle.webp',
      lamina: 'assets/confusion/interface/personagens/oito-laminas/lamina.webp',
      s1: 'assets/confusion/interface/personagens/oito-laminas/s1.webp',
      s2: 'assets/confusion/interface/personagens/oito-laminas/s2.webp',
      s3: 'assets/confusion/interface/personagens/oito-laminas/s3.webp',
    },
    passiva: {
      id: 'gume_telecinetico',
      nome: 'Gume Telecinético',
      desc: '+8% a +15% de ataque e +5% a +10% de chance crítica para todos os Oníricos (conforme o nível).',
    },
    calcularPassiva(nivel) {
      const lv = Math.max(1, Math.min(DOMADORES_CFG.nivelMax, Math.floor(Number(nivel) || 1)));
      const t = (lv - 1) / (DOMADORES_CFG.nivelMax - 1);
      return {
        vidaPct: 0,
        ataquePct: Number((0.08 + t * 0.07).toFixed(4)),
        defesaPct: 0,
        critico: Number((0.05 + t * 0.05).toFixed(4)),
      };
    },
    habilidades: [
      {
        id: 'danca_oito_laminas',
        nome: 'Dança das Oito Lâminas',
        icone: '🗡️',
        tipo: 'dano',
        alvo: 'um',
        mult: 1.3,
        cd: 1,
        distancia: true,
        elemento: 'aco',
        efeitos: [{ id: 'sangramento', turnos: 2, chance: 0.6 }],
        arte: 'assets/confusion/interface/personagens/oito-laminas/danca-das-oito-laminas.webp',
        desc: 'Arremessa lâminas telecinéticas com chance de sangramento.',
      },
      {
        id: 'sincronia_telecinetica',
        nome: 'Sincronia Telecinética',
        icone: '🌀',
        tipo: 'apoio',
        alvo: 'aliados',
        cd: 3,
        elemento: 'aco',
        efeitos: [{ id: 'ataque_alto', turnos: 2 }, { id: 'veloz', turnos: 2 }],
        arte: 'assets/confusion/interface/personagens/oito-laminas/sincronia-telecinetica.webp',
        desc: 'Impulsiona ataque e velocidade dos 4 Oníricos por 2 turnos.',
      },
      {
        id: 'tempestade_oito_laminas',
        nome: 'Tempestade das Oito Lâminas',
        icone: '⚔️',
        tipo: 'dano',
        alvo: 'todos',
        mult: 1.7,
        cd: 5,
        distancia: true,
        elemento: 'aco',
        efeitos: [{ id: 'sangramento', turnos: 3, chance: 0.7 }],
        arte: 'assets/confusion/interface/personagens/oito-laminas/tempestade-das-oito-laminas.webp',
        desc: 'Ataque em área com as oito lâminas e sangramento prolongado.',
      },
    ],
  },
];

export const DOMADORES_POR_ID = Object.fromEntries(CATALOGO_DOMADORES.map((d) => [d.id, d]));

export function domadoresDe(save) {
  const idle = save?.idle || (save ? (save.idle = {}) : {});
  if (!idle.domadores || typeof idle.domadores !== 'object' || Array.isArray(idle.domadores)) {
    idle.domadores = {};
  }
  const st = idle.domadores;
  if (!st.desbloqueados || typeof st.desbloqueados !== 'object') st.desbloqueados = {};
  st.desbloqueados.azazel = true;
  if (!st.progresso || typeof st.progresso !== 'object') st.progresso = {};
  for (const def of CATALOGO_DOMADORES) {
    const cur = st.progresso[def.id];
    const xp = Math.max(0, Math.floor(Number(cur?.xp) || 0));
    const nivel = Math.max(nivelDomadorAuxiliarDe(xp), Math.min(DOMADORES_CFG.nivelMax, Math.floor(Number(cur?.nivel) || 1)));
    st.progresso[def.id] = { nivel, xp: Math.max(xp, xpTotalDomadorAuxiliar(nivel)) };
  }
  if (!st.ativo || !DOMADORES_POR_ID[st.ativo] || !st.desbloqueados[st.ativo]) {
    st.ativo = 'azazel';
  }
  if (!st.eventosPagos || typeof st.eventosPagos !== 'object') st.eventosPagos = {};
  return st;
}

export function domadorDesbloqueavelPorProgresso(save, domadorId) {
  const def = DOMADORES_POR_ID[domadorId];
  if (!def) return false;
  if (def.obtencao.tipo === 'inicial') return true;
  if (def.obtencao.capituloRequisito) {
    return Boolean(save?.idle?.campanhaMini?.capitulosConcluidos?.[def.obtencao.capituloRequisito]);
  }
  return false;
}

export function desbloquearDomador(save, domadorId, { pagarDiamantes = false, forcarMarco = false } = {}) {
  const def = DOMADORES_POR_ID[domadorId];
  if (!def) return { ok: false, motivo: 'Domador desconhecido.' };
  const st = domadoresDe(save);
  if (st.desbloqueados[domadorId]) return { ok: true, jaDesbloqueado: true, domador: def };

  const liberadoMarco = forcarMarco || domadorDesbloqueavelPorProgresso(save, domadorId);
  if (liberadoMarco) {
    st.desbloqueados[domadorId] = true;
    return { ok: true, jaDesbloqueado: false, via: 'marco', domador: def };
  }

  if (pagarDiamantes && def.obtencao.custoDiamantes) {
    save.recompensas = save.recompensas || { gold: 0, diamantes: 0, xp: 0 };
    const saldo = Number(save.recompensas.diamantes) || 0;
    if (saldo < def.obtencao.custoDiamantes) {
      return { ok: false, motivo: `Diamantes insuficientes (${saldo}/${def.obtencao.custoDiamantes}).` };
    }
    save.recompensas.diamantes = saldo - def.obtencao.custoDiamantes;
    st.desbloqueados[domadorId] = true;
    return { ok: true, jaDesbloqueado: false, via: 'diamantes', gasto: def.obtencao.custoDiamantes, domador: def };
  }

  return { ok: false, motivo: def.obtencao.descricao };
}

export function selecionarDomadorAtivo(save, domadorId) {
  const def = DOMADORES_POR_ID[domadorId];
  if (!def) return { ok: false, motivo: 'Domador desconhecido.' };
  const st = domadoresDe(save);
  if (!st.desbloqueados[domadorId]) {
    if (!domadorDesbloqueavelPorProgresso(save, domadorId)) {
      return { ok: false, motivo: `Domador bloqueado: ${def.obtencao.descricao}` };
    }
    st.desbloqueados[domadorId] = true;
  }
  st.ativo = domadorId;
  return { ok: true, ativo: domadorId, domador: def };
}

export function ganharXpDomador(save, domadorId, xp, { eventoId = null } = {}) {
  const def = DOMADORES_POR_ID[domadorId];
  if (!def) return { ok: false, motivo: 'Domador desconhecido.' };
  const st = domadoresDe(save);
  if (eventoId && st.eventosPagos[eventoId]) {
    const p = st.progresso[domadorId];
    return { ok: true, jaPago: true, nivel: p.nivel, xp: p.xp, subiu: 0 };
  }
  const ganho = Math.max(0, Math.floor(Number(xp) || 0));
  const p = st.progresso[domadorId];
  const antes = p.nivel;
  const maxXp = xpTotalDomadorAuxiliar(DOMADORES_CFG.nivelMax);
  p.xp = Math.min(maxXp, p.xp + ganho);
  p.nivel = Math.max(antes, nivelDomadorAuxiliarDe(p.xp));
  if (eventoId) {
    st.eventosPagos[eventoId] = true;
    const keys = Object.keys(st.eventosPagos);
    if (keys.length > 300) {
      for (const k of keys.slice(0, keys.length - 300)) delete st.eventosPagos[k];
    }
  }
  return { ok: true, jaPago: false, antes, nivel: p.nivel, xp: p.xp, subiu: p.nivel - antes };
}

export function usarPocaoXpDomador(save, domadorId, pocaoId, qtd = 1) {
  const poc = POCOES[pocaoId];
  if (!poc) return { ok: false, motivo: 'Poção de XP inválida.' };
  const n = Math.max(1, Math.floor(Number(qtd) || 1));
  const hw = hwDe(save);
  const saldo = hw.pocoes[pocaoId] || 0;
  if (saldo < n) return { ok: false, motivo: `Poções insuficientes (${saldo}/${n}).` };
  hw.pocoes[pocaoId] = saldo - n;
  const res = ganharXpDomador(save, domadorId, poc.xp * n);
  return { ...res, pocoesRestantes: hw.pocoes[pocaoId] };
}

export function bonusPassivoDomadorAtivo(save, domadorId = null) {
  const st = domadoresDe(save);
  const id = domadorId && DOMADORES_POR_ID[domadorId] ? domadorId : st.ativo;
  const def = DOMADORES_POR_ID[id] || CATALOGO_DOMADORES[0];
  const nivel = st.progresso[def.id]?.nivel || 1;
  return {
    domadorId: def.id,
    nome: def.nome,
    nivel,
    ...def.calcularPassiva(nivel),
  };
}

export const MARCOS_HABILIDADES_DOMADOR = [
  { rank: 1, nivelMin: 1, titulo: 'Despertar', desc: 'Habilidades base (recargas 1 / 3 / 5, +35 energia por turno aliado).' },
  { rank: 2, nivelMin: 20, titulo: 'Maestria S1', desc: 'Golpe base (S1) ganha +10% multiplicador e +10% chance de efeito.' },
  { rank: 3, nivelMin: 45, titulo: 'Cadência S2', desc: 'Técnica (S2) reduz 1 turno de recarga (3→2) e amplia cura/escudo ou duração.' },
  { rank: 4, nivelMin: 70, titulo: 'Domínio S3', desc: 'Suprema (S3) ganha +15% multiplicador e +15% chance de efeito.' },
  { rank: 5, nivelMin: 100, titulo: 'Resonância Máxima', desc: 'Suprema (S3) reduz 1 turno de recarga (5→4) e +5 energia por turno aliado (35→40).' },
];

export const CURVA_DESBLOQUEIO_DOMADORES = CATALOGO_DOMADORES.map((d) => ({
  id: d.id,
  nome: d.nome,
  obtencao: d.obtencao,
  marcoCampanha: d.obtencao.capituloRequisito ? `Conclusão do Capítulo ${d.obtencao.capituloRequisito}` : 'Início da Campanha (Cap. 1)',
}));

export function rankHabilidadeDomador(nivel) {
  const lv = Math.max(1, Math.min(DOMADORES_CFG.nivelMax, Math.floor(Number(nivel) || 1)));
  let atual = MARCOS_HABILIDADES_DOMADOR[0];
  for (const m of MARCOS_HABILIDADES_DOMADOR) {
    if (lv >= m.nivelMin) atual = m;
  }
  return atual;
}

export function habilidadesEscaladasDomador(domadorId, nivel = 1) {
  const def = DOMADORES_POR_ID[domadorId];
  if (!def) return [];
  const lv = Math.max(1, Math.min(DOMADORES_CFG.nivelMax, Math.floor(Number(nivel) || 1)));
  return def.habilidades.map((base, idx) => {
    const h = {
      ...base,
      efeitos: Array.isArray(base.efeitos) ? base.efeitos.map((ef) => ({ ...ef })) : [],
    };
    if (idx === 0 && lv >= 20) {
      if (typeof h.mult === 'number') h.mult = Number((h.mult * 1.10).toFixed(3));
      h.efeitos = h.efeitos.map((ef) => (typeof ef.chance === 'number' ? { ...ef, chance: Math.min(1, Number((ef.chance + 0.10).toFixed(2))) } : ef));
    } else if (idx === 1 && lv >= 45) {
      h.cd = Math.max(1, (h.cd || 3) - 1);
      if (typeof h.cura === 'number') h.cura = Number((h.cura + 0.04).toFixed(3));
      h.efeitos = h.efeitos.map((ef) => {
        if (typeof ef.pct === 'number') return { ...ef, pct: Number((ef.pct + 0.04).toFixed(3)) };
        if (typeof ef.turnos === 'number') return { ...ef, turnos: ef.turnos + 1 };
        return ef;
      });
    } else if (idx === 2 && lv >= 70) {
      if (typeof h.mult === 'number') h.mult = Number((h.mult * 1.15).toFixed(3));
      h.efeitos = h.efeitos.map((ef) => (typeof ef.chance === 'number' ? { ...ef, chance: Math.min(1, Number((ef.chance + 0.15).toFixed(2))) } : ef));
    }
    if (idx === 2 && lv >= 100) {
      h.cd = Math.max(1, (h.cd || 5) - 1);
    }
    return h;
  });
}

export function listarDomadores(save) {
  const st = domadoresDe(save);
  return CATALOGO_DOMADORES.map((def) => {
    const desbloqueado = Boolean(st.desbloqueados[def.id]);
    const elegivel = desbloqueado || domadorDesbloqueavelPorProgresso(save, def.id);
    const prog = st.progresso[def.id] || { nivel: 1, xp: 0 };
    const proxXp = prog.nivel >= DOMADORES_CFG.nivelMax ? 0 : Math.max(0, xpTotalDomadorAuxiliar(prog.nivel + 1) - prog.xp);
    return {
      ...def,
      desbloqueado,
      elegivelPorProgresso: elegivel,
      ativo: st.ativo === def.id,
      nivel: prog.nivel,
      xp: prog.xp,
      xpFaltanteProximoNivel: proxXp,
      stats: statsDoDomador(prog.nivel),
      passivaAtual: def.calcularPassiva(prog.nivel),
      rankHabilidade: rankHabilidadeDomador(prog.nivel),
      habilidades: habilidadesEscaladasDomador(def.id, prog.nivel),
      marcosHabilidades: MARCOS_HABILIDADES_DOMADOR,
    };
  });
}

export function fichaDomadorCombate(save, domadorId = null) {
  const st = domadoresDe(save);
  const id = domadorId && st.desbloqueados[domadorId] ? domadorId : st.ativo;
  const def = DOMADORES_POR_ID[id] || CATALOGO_DOMADORES[0];
  const nivel = st.progresso[def.id]?.nivel || 1;
  const ganhoTurno = nivel >= 100
    ? DOMADORES_CFG.acaoBatalha.ganhoPorTurnoAliado + 5
    : DOMADORES_CFG.acaoBatalha.ganhoPorTurnoAliado;
  return {
    id: def.id,
    nome: def.nome,
    chaveKitCombate: def.chaveKitCombate,
    elemento: def.elemento,
    nivel,
    ocupaVaga: false,
    alvejavel: false,
    acaoRegra: { ...DOMADORES_CFG.acaoBatalha, ganhoPorTurnoAliado: ganhoTurno },
    ganhoPorTurnoAliado: ganhoTurno,
    stats: statsDoDomador(nivel),
    passiva: def.calcularPassiva(nivel),
    rankHabilidade: rankHabilidadeDomador(nivel),
    habilidades: habilidadesEscaladasDomador(def.id, nivel),
    arte: { ...def.arte },
  };
}

export function criarEstadoDomadorBatalha(save, domadorId = null) {
  const ficha = fichaDomadorCombate(save, domadorId);
  return {
    ...ficha,
    barraEnergia: 0,
    barraMax: DOMADORES_CFG.acaoBatalha.barraMax,
    recargas: [0, 0, 0],
    acoesFeitas: 0,
  };
}

export function carregarBarraDomador(estado, evento = 'turno_aliado') {
  if (!estado) return estado;
  const ganhoTurno = estado.ganhoPorTurnoAliado || DOMADORES_CFG.acaoBatalha.ganhoPorTurnoAliado;
  if (evento === 'turno_aliado') {
    estado.recargas = (estado.recargas || [0, 0, 0]).map((cd) => Math.max(0, cd - 1));
    estado.barraEnergia = Math.min(estado.barraMax, (estado.barraEnergia || 0) + ganhoTurno);
  } else if (evento === 'dano_recebido') {
    estado.barraEnergia = Math.min(estado.barraMax, (estado.barraEnergia || 0) + DOMADORES_CFG.acaoBatalha.ganhoAoSofrerDano);
  }
  return estado;
}

export function escolherAcaoDomador(estado) {
  if (!estado || (estado.barraEnergia || 0) < (estado.barraMax || 100)) return null;
  // Prioridade: Suprema (2) -> Técnica (1) -> Golpe base (0)
  let escolhidaIdx = 0;
  for (const idx of [2, 1, 0]) {
    if ((estado.recargas?.[idx] || 0) === 0 && estado.habilidades?.[idx]) {
      escolhidaIdx = idx;
      break;
    }
  }
  const habilidade = estado.habilidades[escolhidaIdx];
  estado.barraEnergia = 0;
  estado.recargas[escolhidaIdx] = habilidade.cd || 1;
  estado.acoesFeitas = (estado.acoesFeitas || 0) + 1;
  return {
    domadorId: estado.id,
    nomeDomador: estado.nome,
    chaveKitCombate: estado.chaveKitCombate,
    indiceHabilidade: escolhidaIdx,
    habilidade,
    atk: estado.stats.atk,
    poderApoio: estado.stats.poderApoio,
  };
}
