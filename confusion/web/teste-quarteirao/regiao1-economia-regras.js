import { xpTotal } from './regiao1-progressao.js';

// Tabela revisada de economia diária e semanal por modo (Casual vs Ativo), com orçamento de energia e metas auditadas.
// Regras 100% puras (sem DOM), alinhadas a Campanha Mini, Missões/Marcos, Torres, Calabouços, Regiões 1–12 e Farm/Guilda.

export const PERFIS_ECONOMIA = {
  casual: {
    id: 'casual',
    nome: 'Jogador Casual (~15–20 min/dia)',
    energiaMaxDia: 120,
    descricao: '1 login diário (120 energia): 4 fases rápidas da Campanha, Torres Elementais (1ª vitória gratuita + 3× treino diário), 2 andares da Torre Única, 4 calabouços e 1 contrato de Guilda.',
  },
  ativo: {
    id: 'ativo',
    nome: 'Jogador Ativo (~45–60 min/dia)',
    energiaMaxDia: 240,
    descricao: 'Usa toda a regeneração natural (240 energia/dia = 1/6min): Campanha + avanço regional, Torres Elementais (1ª vitória gratuita + 3× treino), 4 andares da Torre Única, ~10 calabouços, Passe completo e Guilda.',
  },
};

export const CUSTO_REFERENCIA_ECONOMIA = {
  invocacaoDiamantesLote10: 1500, // 150 💎 por invocação equivalente
  evolucao1Para2: { fragmentosSonho: 10, essenciaMenor: 20, essenciaMedia: 5, essenciaMaior: 0 },
  evolucao2Para3: { fragmentosSonho: 30, essenciaMenor: 0, essenciaMedia: 30, essenciaMaior: 10 },
  armaUnicaCriacaoFragmentos: 10,
  reliquiaMais15Ouro: 11250, // soma de 150 + 75*k para k=1..15
};

export const METAS_ECONOMIA = {
  casual: {
    energiaMax: 120,
    diamantesMinDia: 120,
    invocacoesEquivMinSemana: 14,
    maxDiasEvolucao1Para2: 3,
    maxDiasEvolucao2Para3: 10,
    maxDiasArmaUnica: 5,
  },
  ativo: {
    energiaMax: 240,
    diamantesMinDia: 240,
    invocacoesEquivMinSemana: 32,
    maxDiasEvolucao1Para2: 2,
    maxDiasEvolucao2Para3: 4,
    maxDiasArmaUnica: 3,
  },
};

// Rendimento diário revisado por modo (recorrente + média mensal de progressão dos modos novos)
export const TABELA_ECONOMIA_MODOS = [
  {
    modo: 'diarias_login_passe',
    nome: 'Diárias, Login 7d e Passe',
    casual: { energiaDia: 0, diamantes: 60, ouro: 950, ticketsPermanentes: 0.43, ticketsSemanais: 0.14, essenciaMenor: 0, essenciaMedia: 0, essenciaMaior: 0, fragmentosUnicos: 0, poReforco: 0 },
    ativo:  { energiaDia: 0, diamantes: 95, ouro: 1450, ticketsPermanentes: 0.71, ticketsSemanais: 0.29, essenciaMenor: 0, essenciaMedia: 0, essenciaMaior: 0, fragmentosUnicos: 0, poReforco: 0 },
  },
  {
    modo: 'campanha_mini',
    nome: 'Campanha Mini (avanço / rápida)',
    casual: { energiaDia: 24, diamantes: 25, ouro: 1200, ticketsPermanentes: 0.50, ticketsSemanais: 0.17, essenciaMenor: 2, essenciaMedia: 1.5, essenciaMaior: 0.25, fragmentosUnicos: 0, poReforco: 0 },
    ativo:  { energiaDia: 48, diamantes: 55, ouro: 2800, ticketsPermanentes: 1.43, ticketsSemanais: 0.48, essenciaMenor: 4, essenciaMedia: 2.5, essenciaMaior: 1.0, fragmentosUnicos: 0, poReforco: 0 },
  },
  {
    modo: 'torre_elemental',
    nome: 'Torres Elementais (1ª vit. 0 energ. + 3× treino)',
    casual: { energiaDia: 24, diamantes: 10, ouro: 600, ticketsPermanentes: 0, ticketsSemanais: 0, essenciaMenor: 9, essenciaMedia: 3.0, essenciaMaior: 0.5, fragmentosUnicos: 0, poReforco: 0 },
    ativo:  { energiaDia: 24, diamantes: 30, ouro: 1800, ticketsPermanentes: 0, ticketsSemanais: 0, essenciaMenor: 6, essenciaMedia: 6.5, essenciaMaior: 3.0, fragmentosUnicos: 0, poReforco: 0 },
  },
  {
    modo: 'torre_unica',
    nome: 'Torres Únicas (repetição diária 1×/andar)',
    casual: { energiaDia: 20, diamantes: 0, ouro: 250, ticketsPermanentes: 0, ticketsSemanais: 0, essenciaMenor: 0, essenciaMedia: 0, essenciaMaior: 0, fragmentosUnicos: 2.0, poReforco: 0 },
    ativo:  { energiaDia: 40, diamantes: 0, ouro: 600, ticketsPermanentes: 0, ticketsSemanais: 0, essenciaMenor: 0, essenciaMedia: 0, essenciaMaior: 0, fragmentosUnicos: 4.0, poReforco: 0 },
  },
  {
    modo: 'calaboucos',
    nome: 'Calabouços de Relíquias (farm + desmonte)',
    casual: { energiaDia: 48, diamantes: 0, ouro: 1700, ticketsPermanentes: 0, ticketsSemanais: 0, essenciaMenor: 0, essenciaMedia: 0, essenciaMaior: 0, fragmentosUnicos: 0, poReforco: 28 },
    ativo:  { energiaDia: 124, diamantes: 0, ouro: 4600, ticketsPermanentes: 0, ticketsSemanais: 0, essenciaMenor: 0, essenciaMedia: 0, essenciaMaior: 0, fragmentosUnicos: 0, poReforco: 78 },
  },
  {
    modo: 'missoes_marcos_regioes',
    nome: 'Missões Paralelas, Marcos e Regiões 1–12',
    casual: { energiaDia: 0, diamantes: 25, ouro: 450, ticketsPermanentes: 0.30, ticketsSemanais: 0.05, essenciaMenor: 1, essenciaMedia: 0.75, essenciaMaior: 0.25, fragmentosUnicos: 0.1, poReforco: 2 },
    ativo:  { energiaDia: 0, diamantes: 55, ouro: 950, ticketsPermanentes: 0.65, ticketsSemanais: 0.15, essenciaMenor: 2, essenciaMedia: 1.5, essenciaMaior: 0.6, fragmentosUnicos: 0.3, poReforco: 4 },
  },
  {
    modo: 'idle_fazenda_guilda',
    nome: 'Idle Offline + Fazenda + Guilda',
    casual: { energiaDia: 0, diamantes: 15, ouro: 1850, ticketsPermanentes: 0, ticketsSemanais: 0, essenciaMenor: 0, essenciaMedia: 0, essenciaMaior: 0, fragmentosUnicos: 0, poReforco: 0 },
    ativo:  { energiaDia: 0, diamantes: 25, ouro: 3700, ticketsPermanentes: 0, ticketsSemanais: 0, essenciaMenor: 0, essenciaMedia: 0, essenciaMaior: 0, fragmentosUnicos: 0, poReforco: 0 },
  },
];

export const RESUMO_FONTES_UNICAS = {
  campanhaMini: { diamantes: 5640, ticketsPermanentes: 120, ticketsSemanais: 40 },
  torresElementais: { diamantes: 3000, essenciaMenor: 180, essenciaMedia: 240, essenciaMaior: 90 },
  regioes1a12: { diamantes: 7130, ticketsPermanentes: 26 },
};

export function resumoEconomiaDiaria(perfil = 'casual') {
  const key = perfil === 'ativo' ? 'ativo' : 'casual';
  const total = {
    perfil: key,
    energiaDia: 0,
    diamantesDia: 0,
    ouroDia: 0,
    ticketsPermanentesDia: 0,
    ticketsSemanaisDia: 0,
    essenciaMenorDia: 0,
    essenciaMediaDia: 0,
    essenciaMaiorDia: 0,
    fragmentosUnicosDia: 0,
    poReforcoDia: 0,
    porModo: [],
  };

  for (const linha of TABELA_ECONOMIA_MODOS) {
    const v = linha[key];
    total.energiaDia += v.energiaDia;
    total.diamantesDia += v.diamantes;
    total.ouroDia += v.ouro;
    total.ticketsPermanentesDia += v.ticketsPermanentes;
    total.ticketsSemanaisDia += v.ticketsSemanais;
    total.essenciaMenorDia += v.essenciaMenor;
    total.essenciaMediaDia += v.essenciaMedia;
    total.essenciaMaiorDia += v.essenciaMaior;
    total.fragmentosUnicosDia += v.fragmentosUnicos;
    total.poReforcoDia += v.poReforco;
    total.porModo.push({ modo: linha.modo, nome: linha.nome, ...v });
  }

  for (const k of ['ticketsPermanentesDia', 'ticketsSemanaisDia', 'essenciaMenorDia', 'essenciaMediaDia', 'essenciaMaiorDia', 'fragmentosUnicosDia']) {
    total[k] = Number(total[k].toFixed(2));
  }
  total.diamantesSemana = Math.round(total.diamantesDia * 7);
  total.ticketsPermanentesSemana = Number((total.ticketsPermanentesDia * 7).toFixed(1));
  total.ticketsSemanaisSemana = Number((total.ticketsSemanaisDia * 7).toFixed(1));
  total.invocacoesEquivalentesSemana = Math.floor(
    total.ticketsPermanentesSemana + total.ticketsSemanaisSemana + total.diamantesSemana / 150,
  );
  return total;
}

export function estimarDiasEvolucao(perfil = 'casual') {
  const eco = resumoEconomiaDiaria(perfil);
  const dias1Para2 = Math.ceil(Math.max(
    CUSTO_REFERENCIA_ECONOMIA.evolucao1Para2.essenciaMenor / Math.max(0.1, eco.essenciaMenorDia),
    CUSTO_REFERENCIA_ECONOMIA.evolucao1Para2.essenciaMedia / Math.max(0.1, eco.essenciaMediaDia),
  ));
  const dias2Para3 = Math.ceil(Math.max(
    CUSTO_REFERENCIA_ECONOMIA.evolucao2Para3.essenciaMedia / Math.max(0.1, eco.essenciaMediaDia),
    CUSTO_REFERENCIA_ECONOMIA.evolucao2Para3.essenciaMaior / Math.max(0.1, eco.essenciaMaiorDia),
  ));
  const diasArmaUnica = Math.ceil(
    CUSTO_REFERENCIA_ECONOMIA.armaUnicaCriacaoFragmentos / Math.max(0.1, eco.fragmentosUnicosDia),
  );
  return { perfil: eco.perfil, dias1Para2, dias2Para3, diasArmaUnica };
}

export function auditarMetasEconomia() {
  const resultados = {};
  let ok = true;
  for (const perfil of ['casual', 'ativo']) {
    const eco = resumoEconomiaDiaria(perfil);
    const dias = estimarDiasEvolucao(perfil);
    const meta = METAS_ECONOMIA[perfil];
    const checks = {
      energiaDentroOrcamento: eco.energiaDia <= meta.energiaMax,
      diamantesBateMeta: eco.diamantesDia >= meta.diamantesMinDia,
      invocacoesSemanaBateMeta: eco.invocacoesEquivalentesSemana >= meta.invocacoesEquivMinSemana,
      evolucao1Para2NoPrazo: dias.dias1Para2 <= meta.maxDiasEvolucao1Para2,
      evolucao2Para3NoPrazo: dias.dias2Para3 <= meta.maxDiasEvolucao2Para3,
      armaUnicaNoPrazo: dias.diasArmaUnica <= meta.maxDiasArmaUnica,
    };
    const passou = Object.values(checks).every(Boolean);
    if (!passou) ok = false;
    resultados[perfil] = { passou, checks, eco, dias, meta };
  }
  return { ok, resultados };
}

// ---- Economia da Primeira Hora (0–60 min) e Curva até Nv.40 (T5 dos iniciais #148) ----
export const TABELA_PRIMEIRA_HORA = [
  {
    bloco: '0–10 min',
    marcos: 'Site → Convidado/Conta → Escolha do Inicial (Nv.5 T4) → Refúgio → 1ª batalha na Praia → Campanha Mini 1-1 e 1-2',
    objetivoAtivo: 'Completar o batismo de combate e abrir a Campanha Mini',
    ganho: { ouro: 550, diamantes: 65, xpOnirico: 420, energia: 120, essenciaMenor: 0, essenciaMedia: 0, tickets: 0, reliquias: 0, fragmentosSonho: 0 },
    gasto: { ouro: 0, diamantes: 0, energia: 12, tickets: 0 },
  },
  {
    bloco: '10–20 min',
    marcos: 'Campanha Mini 1-3 a 1-5 (Elite), Torre Elemental 1–3, Marco 1-5 e Paralela par_1_1 (após 1-3)',
    objetivoAtivo: 'Vencer o Guardião 1-5 (1ª relíquia garantida) e juntar Essências na Torre',
    ganho: { ouro: 1350, diamantes: 150, xpOnirico: 1080, energia: 1, essenciaMenor: 12, essenciaMedia: 0, tickets: 0, reliquias: 2, fragmentosSonho: 1 },
    gasto: { ouro: 450, diamantes: 0, energia: 20, tickets: 0 },
  },
  {
    bloco: '20–30 min',
    marcos: 'Calabouço Nv.1, reforço de relíquia (+3), Torre Elemental 4–5, Baús 3★ 1-1..1-5 e Marco Torre 5',
    objetivoAtivo: 'Equipar e reforçar a 1ª relíquia rara/comum e subir a Torre até o andar 5',
    ganho: { ouro: 900, diamantes: 140, xpOnirico: 950, energia: 2, essenciaMenor: 11, essenciaMedia: 0, tickets: 0, reliquias: 2, fragmentosSonho: 1 },
    gasto: { ouro: 825, diamantes: 0, energia: 18, tickets: 0 },
  },
  {
    bloco: '30–45 min',
    marcos: 'Campanha Mini 1-6 a 1-9, Diárias dos modos, Paralela par_1_2 e Login Dia 1',
    objetivoAtivo: 'Avançar até a antecâmara do Chefe 1-10 e fechar as missões diárias',
    ganho: { ouro: 1850, diamantes: 210, xpOnirico: 1450, energia: 2, essenciaMenor: 5, essenciaMedia: 0, tickets: 1, reliquias: 1, fragmentosSonho: 1 },
    gasto: { ouro: 600, diamantes: 0, energia: 24, tickets: 0 },
  },
  {
    bloco: '45–60 min',
    marcos: 'Chefe 1-10 + Marcos Cap.1 / 30★ + Baú 10★/20★/30★ + 1ª Invocação ×10 no Banner',
    objetivoAtivo: 'Derrotar o Chefe do Cap.1, resgatar os 10 tickets e realizar a 1ª invocação ×10',
    ganho: { ouro: 1400, diamantes: 300, xpOnirico: 1650, energia: 3, essenciaMenor: 10, essenciaMedia: 3, tickets: 11, reliquias: 1, fragmentosSonho: 1 },
    gasto: { ouro: 900, diamantes: 0, energia: 10, tickets: 10 },
  },
];

export const BANNER_REGRAS_RESUMO = {
  taxas: { comum: 0.68, rara: 0.22, epica: 0.07, lendaria: 0.03 },
  garantias: { rara: 10, epica: 30, lendaria: 50 },
  gratisPorDia: 10,
  gratisAcumuloMax: 100,
};

export function simularEconomiaPrimeiraHora({ comConta = false } = {}) {
  const saldo = {
    ouro: 0,
    diamantes: comConta ? 20000 : 0,
    xpOnirico: 0,
    energiaAtual: 0,
    essenciaMenor: 0,
    essenciaMedia: 0,
    tickets: 0,
    invocacoesGratis: BANNER_REGRAS_RESUMO.gratisPorDia,
    reliquias: 0,
    fragmentosSonho: 0,
  };
  const ganhosTotais = {
    ouro: 0,
    diamantes: saldo.diamantes,
    xpOnirico: 0,
    essenciaMenor: 0,
    essenciaMedia: 0,
    tickets: 0,
    invocacoesGratis: BANNER_REGRAS_RESUMO.gratisPorDia,
    reliquias: 0,
    fragmentosSonho: 0,
  };
  const gastosTotais = { ouro: 0, diamantes: 0, energia: 0, tickets: 0 };

  const linhaTempo = TABELA_PRIMEIRA_HORA.map((b) => {
    for (const k of ['ouro', 'diamantes', 'xpOnirico', 'essenciaMenor', 'essenciaMedia', 'tickets', 'reliquias', 'fragmentosSonho']) {
      ganhosTotais[k] += b.ganho[k] || 0;
      saldo[k] += b.ganho[k] || 0;
    }
    saldo.energiaAtual = Math.min(120, Math.max(0, saldo.energiaAtual + (b.ganho.energia || 0) - (b.gasto.energia || 0)));
    for (const k of ['ouro', 'diamantes', 'energia', 'tickets']) {
      gastosTotais[k] += b.gasto[k] || 0;
      if (k !== 'energia') saldo[k] -= b.gasto[k] || 0;
    }
    return { ...b, saldoApos: { ...saldo } };
  });

  // Nota: se a evolução 1→2 (~20 min) ainda sofre gargalo sem pacote inicial (10 frag. e 5 essência média vs ~38 menor já ganhas)
  const evolucao1Para2ViavelNoReino = ganhosTotais.essenciaMenor >= CUSTO_REFERENCIA_ECONOMIA.evolucao1Para2.essenciaMenor
    && ganhosTotais.essenciaMedia >= CUSTO_REFERENCIA_ECONOMIA.evolucao1Para2.essenciaMedia
    && ganhosTotais.fragmentosSonho >= CUSTO_REFERENCIA_ECONOMIA.evolucao1Para2.fragmentosSonho;

  return {
    comConta,
    linhaTempo,
    ganhosTotais,
    gastosTotais,
    saldoFinal: saldo,
    marcosAtingidos: {
      primeiraReliquia30Min: (linhaTempo[1].saldoApos.reliquias + linhaTempo[2].ganho.reliquias) >= 1,
      invocacao10xNaHora1: comConta ? ganhosTotais.diamantes >= 1500 : ganhosTotais.tickets >= 10,
      evolucao1Para2Em60MinSemPacote: evolucao1Para2ViavelNoReino,
      sempreComObjetivo: linhaTempo.every((x) => Boolean(x.objetivoAtivo)),
    },
  };
}

export function auditarPrimeiraHora() {
  const convidado = simularEconomiaPrimeiraHora({ comConta: false });
  const contaNova = simularEconomiaPrimeiraHora({ comConta: true });
  return {
    convidado,
    contaNova,
    ok: convidado.marcosAtingidos.primeiraReliquia30Min
      && convidado.marcosAtingidos.invocacao10xNaHora1
      && contaNova.marcosAtingidos.invocacao10xNaHora1
      && convidado.marcosAtingidos.sempreComObjetivo,
  };
}

// Curva real de nível 5 -> 40 para os iniciais atingirem T5 (#148)
export function estimarDiasNivel40Inicial(perfil = 'casual') {
  const isAtivo = perfil === 'ativo';
  const nivelInicial = 5;
  const nivelAlvo = 40;
  const xpNecessario = xpTotal(nivelAlvo) - xpTotal(nivelInicial); // 8.750 XP
  // Jogo ativo normal (sem depender de 12h AFK): Idle ativo (~10-20 min) + fases Campanha Mini + Poções XP distribuídas
  const xpDiarioJogoNormal = isAtivo ? 3800 : 2250;
  // Incluindo 8h/dia de Idle offline (Nv.6 = 1,6 abates/min × 28 XP/abate) com foco natural na formação
  const xpDiarioComOffline8h = xpDiarioJogoNormal + (isAtivo ? 10500 : 6500);
  const diasJogoNormal = Number((xpNecessario / xpDiarioJogoNormal).toFixed(2));
  const diasComOffline8h = Number((xpNecessario / xpDiarioComOffline8h).toFixed(2));
  return {
    perfil: isAtivo ? 'ativo' : 'casual',
    nivelInicial,
    nivelAlvo,
    xpTotalNivel40: xpTotal(nivelAlvo),
    xpNecessario,
    xpDiarioJogoNormal,
    xpDiarioComOffline8h,
    diasJogoNormal,
    diasComOffline8h,
    dentroDaMeta3a5Dias: diasJogoNormal <= 5,
  };
}
