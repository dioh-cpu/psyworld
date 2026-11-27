// Tabela pura de economia diária e semanal por modo para perfil casual vs ativo.
// Regras 100% puras (sem DOM). Valores alinhados às recompensas reais de Campanha Mini, Torres, Calabouços, Diárias/Login/Passe e Guilda.

export const PERFIS_ECONOMIA = {
  casual: {
    id: 'casual',
    nome: 'Jogador Casual (~15–20 min/dia)',
    energiaGastaDia: 120, // 1 tanque cheio/dia (regiao + campanha/calabouço)
    descricao: '1 login diário, 4 diárias, 3 treinos na Torre Elemental, 2 andares da Torre Única, 5 calabouços/campanha rápida e 1 contrato de Guilda.',
  },
  ativo: {
    id: 'ativo',
    nome: 'Jogador Ativo (~45–60 min/dia + recarga natural)',
    energiaGastaDia: 240, // regeneração natural completa (1/6min = 240/dia) + eventual poção
    descricao: 'Aproveita toda a energia natural (240/dia), limpa 3 treinos da Torre Elemental + avanço, 5+ andares de Torre Única, 10–12 calabouços, Passe completo e Guilda.',
  },
};

// Rendimento diário médio esperado por modo
export const TABELA_ECONOMIA_MODOS = [
  {
    modo: 'diarias_login_passe',
    nome: 'Diárias, Login 7d e Passe',
    casual: { diamantes: 60, ouro: 900, ticketsPermanentes: 0.43, ticketsSemanais: 0.14, essenciaMenor: 0, essenciaMedia: 0, essenciaMaior: 0, fragmentosUnicos: 0 },
    ativo:  { diamantes: 95, ouro: 1400, ticketsPermanentes: 0.71, ticketsSemanais: 0.29, essenciaMenor: 0, essenciaMedia: 0, essenciaMaior: 0, fragmentosUnicos: 0 },
  },
  {
    modo: 'campanha_mini',
    nome: 'Campanha Mini (avanço / rápida)',
    casual: { diamantes: 25, ouro: 1200, ticketsPermanentes: 0.50, ticketsSemanais: 0.17, essenciaMenor: 2, essenciaMedia: 1, essenciaMaior: 0, fragmentosUnicos: 0 },
    ativo:  { diamantes: 55, ouro: 2800, ticketsPermanentes: 1.43, ticketsSemanais: 0.48, essenciaMenor: 4, essenciaMedia: 2, essenciaMaior: 1, fragmentosUnicos: 0 },
  },
  {
    modo: 'torre_elemental',
    nome: 'Torres Elementais (avanço + 3× treino)',
    casual: { diamantes: 10, ouro: 600, ticketsPermanentes: 0, ticketsSemanais: 0, essenciaMenor: 9, essenciaMedia: 3, essenciaMaior: 0, fragmentosUnicos: 0 },
    ativo:  { diamantes: 30, ouro: 1800, ticketsPermanentes: 0, ticketsSemanais: 0, essenciaMenor: 6, essenciaMedia: 6, essenciaMaior: 3, fragmentosUnicos: 0 },
  },
  {
    modo: 'torre_unica',
    nome: 'Torres Únicas (repetição diária)',
    casual: { diamantes: 0, ouro: 200, ticketsPermanentes: 0, ticketsSemanais: 0, essenciaMenor: 0, essenciaMedia: 0, essenciaMaior: 0, fragmentosUnicos: 2 },
    ativo:  { diamantes: 0, ouro: 500, ticketsPermanentes: 0, ticketsSemanais: 0, essenciaMenor: 0, essenciaMedia: 0, essenciaMaior: 0, fragmentosUnicos: 6 },
  },
  {
    modo: 'calaboucos',
    nome: 'Calabouços de Relíquias (desmonte + farm)',
    casual: { diamantes: 0, ouro: 1500, ticketsPermanentes: 0, ticketsSemanais: 0, essenciaMenor: 0, essenciaMedia: 0, essenciaMaior: 0, fragmentosUnicos: 0 },
    ativo:  { diamantes: 0, ouro: 4200, ticketsPermanentes: 0, ticketsSemanais: 0, essenciaMenor: 0, essenciaMedia: 0, essenciaMaior: 0, fragmentosUnicos: 0 },
  },
  {
    modo: 'missoes_marcos',
    nome: 'Missões Paralelas e Marcos',
    casual: { diamantes: 20, ouro: 300, ticketsPermanentes: 0.25, ticketsSemanais: 0.05, essenciaMenor: 1, essenciaMedia: 0.5, essenciaMaior: 0, fragmentosUnicos: 0.1 },
    ativo:  { diamantes: 45, ouro: 700, ticketsPermanentes: 0.50, ticketsSemanais: 0.15, essenciaMenor: 2, essenciaMedia: 1.5, essenciaMaior: 0.5, fragmentosUnicos: 0.3 },
  },
  {
    modo: 'idle_fazenda_guilda',
    nome: 'Idle Offline + Fazenda + Guilda',
    casual: { diamantes: 15, ouro: 1800, ticketsPermanentes: 0, ticketsSemanais: 0, essenciaMenor: 0, essenciaMedia: 0, essenciaMaior: 0, fragmentosUnicos: 0 },
    ativo:  { diamantes: 25, ouro: 3600, ticketsPermanentes: 0, ticketsSemanais: 0, essenciaMenor: 0, essenciaMedia: 0, essenciaMaior: 0, fragmentosUnicos: 0 },
  },
];

export function resumoEconomiaDiaria(perfil = 'casual') {
  const key = perfil === 'ativo' ? 'ativo' : 'casual';
  const total = {
    perfil: key,
    diamantesDia: 0,
    ouroDia: 0,
    ticketsPermanentesDia: 0,
    ticketsSemanaisDia: 0,
    essenciaMenorDia: 0,
    essenciaMediaDia: 0,
    essenciaMaiorDia: 0,
    fragmentosUnicosDia: 0,
    porModo: [],
  };

  for (const linha of TABELA_ECONOMIA_MODOS) {
    const v = linha[key];
    total.diamantesDia += v.diamantes;
    total.ouroDia += v.ouro;
    total.ticketsPermanentesDia += v.ticketsPermanentes;
    total.ticketsSemanaisDia += v.ticketsSemanais;
    total.essenciaMenorDia += v.essenciaMenor;
    total.essenciaMediaDia += v.essenciaMedia;
    total.essenciaMaiorDia += v.essenciaMaior;
    total.fragmentosUnicosDia += v.fragmentosUnicos;
    total.porModo.push({ modo: linha.modo, nome: linha.nome, ...v });
  }

  for (const k of ['ticketsPermanentesDia', 'ticketsSemanaisDia', 'essenciaMenorDia', 'essenciaMediaDia', 'essenciaMaiorDia', 'fragmentosUnicosDia']) {
    total[k] = Number(total[k].toFixed(2));
  }
  total.diamantesSemana = Math.round(total.diamantesDia * 7);
  total.ticketsPermanentesSemana = Number((total.ticketsPermanentesDia * 7).toFixed(1));
  total.ticketsSemanaisSemana = Number((total.ticketsSemanaisDia * 7).toFixed(1));
  // Invocações semanais equivalentes (1 ticket = 1 invocação; 1500 diamantes = 10 invocações -> 150 diam/invocação em lote)
  total.invocacoesEquivalentesSemana = Math.floor(total.ticketsPermanentesSemana + total.ticketsSemanaisSemana + total.diamantesSemana / 150);
  return total;
}

export function estimarDiasEvolucao(perfil = 'casual') {
  const eco = resumoEconomiaDiaria(perfil);
  const dias1Para2 = Math.ceil(Math.max(
    20 / Math.max(0.1, eco.essenciaMenorDia),
    5 / Math.max(0.1, eco.essenciaMediaDia),
  ));
  const dias2Para3 = Math.ceil(Math.max(
    30 / Math.max(0.1, eco.essenciaMediaDia),
    10 / Math.max(0.1, eco.essenciaMaiorDia || 0.25),
  ));
  return { perfil: eco.perfil, dias1Para2, dias2Para3 };
}
