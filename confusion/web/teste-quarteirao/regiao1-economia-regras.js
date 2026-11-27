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
