// Dados da Expansão 1 (só dados; as regras ficam em regiao1-exp-regras.js). Números provisórios, fáceis de ajustar.
const ART = 'assets/confusion/interface/estrategia';

// ---- Liberação: cada modo abre por marcos da Campanha (id de missão em regiao1-estado.js) ----
export const MARCOS = {
  banner: 'q_pegadas',            // primeira missão de história: primeiro ticket e tutorial do Banner
  cacada1: 'q_mare_devolveu',     // primeira Caçada
  calabouco: 'q_boss_e',          // Espírito da Floresta derrotado
  cronicas: 'q_ultimo_trem',      // Crônicas (Crises e Herói × Vilão)
  reinos: 'q_sec_canteiro',       // gestão dos reinos (preservado do c537286)
};
export const MISSOES_HISTORIA = ['q_pegadas', 'q_mare_devolveu', 'q_ultimo_trem', 'q_primeira_partida', 'q_guarda_arco', 'q_sal_raizes', 'q_mulher_mata', 'q_coracao_mata', 'q_boss_e', 'q_acima_mare', 'q_floresta_respira', 'q_trilha_esporos', 'q_enseada_lanternas', 'q_boss_d', 'q_saida_pedras', 'q_mare_esconde', 'q_canto_agua', 'q_boss_s', 'q_brilho_rocha', 'q_eco_quartzo', 'q_salao_ametista', 'q_boss_c'];

// ---- Caçadas: mapas exclusivos (reaproveitam arte e máscara de um mapa existente) ----
export const CACADAS = [
  { id: 'cac1', nome: 'Clareira de Fibras', base: 'E5', bioma: 'Floresta Sombria', requer: 'q_mare_devolveu', materiais: { fibra: [1, 2], cristal: [0, 1] }, chance: 0.6, onir: ['Cervomusgo', 'Fanalino', 'Tatuveludo', 'Cobrabúfalo'], nivel: [3, 5] },
  { id: 'cac2', nome: 'Grota dos Cogumelos', base: 'D5', bioma: 'Floresta de Cogumelos', requer: 'q_acima_mare', materiais: { fibra: [1, 2], cristal: [1, 2] }, chance: 0.6, onir: ['Cervomusgo', 'Tatuveludo', 'Xistolim', 'Colmeiro'], nivel: [5, 8] },
  { id: 'cac3', nome: 'Veio Cintilante', base: 'PC4', bioma: 'Caverna Cintilante', requer: 'q_saida_pedras', materiais: { fibra: [0, 1], cristal: [2, 3] }, chance: 0.65, onir: ['Xistolim', 'Calquélon', 'Cobrabúfalo', 'Bronzelo'], nivel: [8, 11] },
];
export const POS_CACADA = [[250, 200], [770, 190], [330, 400], [700, 420], [520, 250], [180, 340], [850, 330], [480, 440]];

// ---- Fazenda e Oficina: um estoque só (materiais da Caçada + ingredientes), usando o motor de gestão ----
export const FAB = {
  id: 'fab', titulo: 'Fazenda e Oficina',
  materiais: { fibra: { nome: 'Fibra', icone: '🌿' }, cristal: { nome: 'Cristal', icone: '💠' }, leite: { nome: 'Leite', icone: '🥛' }, mel: { nome: 'Mel', icone: '🍯' }, ovos: { nome: 'Ovos', icone: '🥚' } },
  inicial: { fibra: 0, cristal: 0, leite: 0, mel: 0, ovos: 0 },
  locais: [{ id: 'cur', categoria: 'curral', pos: [0, 0] }, { id: 'api', categoria: 'apiario', pos: [0, 0] }, { id: 'gal', categoria: 'galinheiro', pos: [0, 0] }],
  estruturas: [
    { id: 'curral', categoria: 'curral', nome: 'Curral', emoji: '🐄', niveis: 3, custo: { fibra: 6 }, prosperidade: [0, 0, 0], duracao: [30, 60, 90], producao: { tipo: 'leite', porHora: 12 } },
    { id: 'apiario', categoria: 'apiario', nome: 'Apiário', emoji: '🐝', niveis: 3, custo: { fibra: 8 }, prosperidade: [0, 0, 0], duracao: [30, 60, 90], producao: { tipo: 'mel', porHora: 8 } },
    { id: 'galinheiro', categoria: 'galinheiro', nome: 'Galinheiro', emoji: '🐔', niveis: 3, custo: { fibra: 6 }, prosperidade: [0, 0, 0], duracao: [30, 60, 90], producao: { tipo: 'ovos', porHora: 10 } },
  ],
  gestao: {
    vagasObra: 1, capacidade: { fibra: 120, cristal: 120, leite: 100, mel: 100, ovos: 100 }, capacidadePadrao: 100, capProducaoHoras: 8, filaFabricacao: 3,
    receitas: [
      { id: 'tonico', nome: 'Tônico de Lucidez', icone: '🧪', profissao: 'alquimia', nivelMin: 1, insumos: { fibra: 2, leite: 1 }, saida: { tonico: 1 }, seg: 20, uso: 'Calabouço: restaura 35 de Sanidade' },
      { id: 'racao', nome: 'Ração reforçada', icone: '🍲', profissao: 'cozinha', nivelMin: 1, insumos: { ovos: 2, mel: 1 }, saida: { racao: 1 }, seg: 25, uso: 'Calabouço: recupera 40% da vida da equipe' },
      { id: 'torta', nome: 'Torta de Mel', icone: '🥧', arte: 'assets/confusion/interface/expansao1/itens/torta.webp', profissao: 'cozinha', nivelMin: 2, insumos: { ovos: 2, mel: 2, leite: 1 }, saida: { torta: 1 }, seg: 30, uso: 'Guilda: pedida nos contratos diários' },
      { id: 'elixir', nome: 'Elixir de Foco', icone: '✨', arte: 'assets/confusion/interface/expansao1/itens/elixir.webp', profissao: 'alquimia', nivelMin: 3, insumos: { cristal: 2, mel: 2 }, saida: { pocao_xp_p: 1 }, seg: 40, uso: 'Mochila de Poções: +1.500 XP (Poção de XP pequena)' },
      { id: 'tonico_concentrado', nome: 'Tônico Concentrado', icone: '⚗️', arte: 'assets/confusion/interface/expansao1/itens/tonico-concentrado.webp', profissao: 'alquimia', nivelMin: 5, insumos: { fibra: 3, cristal: 2, mel: 2 }, saida: { tonico_concentrado: 1 }, seg: 45, uso: 'Calabouço: restaura 60 de Sanidade' },
    ],
    itens: {
      tonico: { nome: 'Tônico de Lucidez', icone: '🧪' },
      racao: { nome: 'Ração reforçada', icone: '🍲' },
      torta: { nome: 'Torta de Mel', icone: '🥧', arte: 'assets/confusion/interface/expansao1/itens/torta.webp' },
      pocao_xp_p: { nome: 'Elixir de Foco', icone: '✨', arte: 'assets/confusion/interface/expansao1/itens/elixir.webp' },
      tonico_concentrado: { nome: 'Tônico Concentrado', icone: '⚗️', arte: 'assets/confusion/interface/expansao1/itens/tonico-concentrado.webp' },
    },
  },
};
export const PROFISSOES = { alquimia: { nome: 'Alquimia', icone: '⚗️' }, cozinha: { nome: 'Cozinha', icone: '🍳' }, fazenda: { nome: 'Fazenda', icone: '🌾' } };
export const MOLDURAS_BANNER = { comum: 1, rara: 3, epica: 4, lendaria: 5 };
export const arteMoldura = (n) => `assets/confusion/interface/banner/moldura-${n}.png`;

// ---- Guilda dos Aventureiros ----
export const ICONE_CONTRATO = 'assets/confusion/interface/expansao1/itens/contrato.webp';
export const CONTRATOS = [
  { id: 'g1', titulo: 'Fibras para o balcão', texto: 'A Guilda precisa de fibras para consertar o curral abandonado. Aceite, ligue o Auto-Caça na Clareira de Fibras (menu Caçadas) e volte com 6 fibras.', requer: null, pede: { mat: { fibra: 6 } }, recompensa: { gold: 120, diamantes: 5 }, libera: 'fazenda', fim: 'Curral, apiário e galinheiro prontos: a Fazenda está aberta.' },
  { id: 'g2', titulo: 'Leite fresco', texto: 'O mestre da Guilda quer provar o leite da Fazenda. Colete a produção (Guilda → Fazenda) e entregue 3 leites.', requer: 'g1', pede: { mat: { leite: 3 } }, recompensa: { gold: 150, diamantes: 5 }, libera: 'oficina', fim: 'A Oficina está aberta, com a receita do Tônico de Lucidez.' },
  { id: 'g3', titulo: 'Tônico para a descida', texto: 'Um calabouço rasteja sob a floresta. Fabrique um Tônico de Lucidez na Oficina e entregue: ele restaura a Sanidade lá embaixo.', requer: 'g2', pede: { itens: { tonico: 1 } }, recompensa: { gold: 200, diamantes: 8 }, libera: null, fim: 'Guarde tônicos para o Calabouço. Contratos diários liberados!' },
];
// Três grupos diários (Fazenda, Cozinha, Alquimia): 1 sorteado de cada grupo por data local, renovando à meia-noite
export const CONTRATOS_DIARIOS_GRUPOS = [
  [
    { titulo: 'Cesta matinal da Fazenda', texto: 'Entregue leite fresco e ovos recém-colhidos para a estalagem da Guilda.', pede: { mat: { leite: 4, ovos: 4 } }, recompensa: { gold: 140, diamantes: 5, tickets: 1 } },
    { titulo: 'Favos dourados', texto: 'Os mercadores pedem potes de mel e leite do dia.', pede: { mat: { mel: 4, leite: 3 } }, recompensa: { gold: 150, diamantes: 5, tickets: 1 } },
    { titulo: 'Remessa do celeiro', texto: 'Reúna ovos da Fazenda e fibras das Caçadas para reforçar os cestos.', pede: { mat: { ovos: 5, fibra: 5 } }, recompensa: { gold: 155, diamantes: 6, tickets: 1 } },
    { titulo: 'Cristais e mel silvestre', texto: 'A bancada de suprimentos precisa de cristais brutos e mel.', pede: { mat: { cristal: 3, mel: 3 } }, recompensa: { gold: 165, diamantes: 6, tickets: 1 } },
  ],
  [
    { titulo: 'Encomenda de Torta de Mel', texto: 'Asse uma Torta de Mel na Cozinha (nv.2) com leite fresco para a mesa dos veteranos.', pede: { itens: { torta: 1 }, mat: { leite: 2 } }, recompensa: { gold: 210, diamantes: 8, tickets: 1 } },
    { titulo: 'Provisões de expedição', texto: 'Prepare Rações reforçadas e ovos extras para as patrulhas do sul.', pede: { itens: { racao: 2 }, mat: { ovos: 3 } }, recompensa: { gold: 195, diamantes: 7, tickets: 1 } },
    { titulo: 'Banquete de outono', texto: 'A Guilda encomendou duas Tortas de Mel quentes para a noite.', pede: { itens: { torta: 2 } }, recompensa: { gold: 240, diamantes: 9, tickets: 1 } },
    { titulo: 'Marmita de campo', texto: 'Combine Ração reforçada com mel puro para os batedores.', pede: { itens: { racao: 1 }, mat: { mel: 3, leite: 2 } }, recompensa: { gold: 185, diamantes: 7, tickets: 1 } },
  ],
  [
    { titulo: 'Reserva de lucidez', texto: 'Destile Tônicos de Lucidez e traga cristais para a expedição às ruínas.', pede: { itens: { tonico: 2 }, mat: { cristal: 2 } }, recompensa: { gold: 220, diamantes: 8, tickets: 1 } },
    { titulo: 'Foco para os recrutas', texto: 'Prepare um Elixir de Foco (Alquimia nv.3) acompanhado de mel.', pede: { itens: { pocao_xp_p: 1 }, mat: { mel: 2 } }, recompensa: { gold: 250, diamantes: 10, tickets: 1 } },
    { titulo: 'Destilado profundo', texto: 'A guarda subterrânea pede um Tônico Concentrado (Alquimia nv.5) e fibras.', pede: { itens: { tonico_concentrado: 1 }, mat: { fibra: 4 } }, recompensa: { gold: 280, diamantes: 12, tickets: 1 } },
    { titulo: 'Kit de descida completa', texto: 'Entregue um Tônico de Lucidez e uma Torta de Mel prontos.', pede: { itens: { tonico: 1, torta: 1 } }, recompensa: { gold: 255, diamantes: 10, tickets: 1 } },
  ],
];

// ---- Calabouço: salas, arenas e Sanidade ----
const CAL_ART = 'assets/confusion/interface/expansao1/calabouco';
export const CALABOUCO = {
  id: 'cal1', nome: 'Ruínas Rastejantes', sanidadeMax: 100, perdaCorrompida: 25, limiteEscolha: 50, tonico: 35, tonicoConcentrado: 60, racao: 0.4,
  fundo: `${CAL_ART}/fundo.webp`, fundoFallback: `${ART}/pedra-01.webp`,
  cartas: {
    luta: `${CAL_ART}/sala-luta.webp`,
    corrompida: `${CAL_ART}/sala-corrompida.webp`,
    chefe: `${CAL_ART}/sala-chefe.webp`,
    tesouro: `${CAL_ART}/sala-tesouro.webp`,
  },
  chefe: {
    nome: 'Coração das Ruínas',
    especie: 'Cervomusgo',
    elemento: 'planta',
    bonus: { hp: 1.25, atk: 0.2, def: 0.15 },
    arte: `${CAL_ART}/chefe.png`,
    arteFallback: `${ART}/reinos/01/chefe.webp`,
  },
  salas: [
    { tipo: 'luta', nivel: 4, rotulo: 'Corredor de raízes', arena: `${CAL_ART}/arena-corredor.webp`, arenaFallback: `${ART}/madeira-03.webp` },
    { tipo: 'corrompida', rotulo: 'Sala corrompida' },
    { tipo: 'luta', nivel: 6, rotulo: 'Galeria rachada', arena: `${CAL_ART}/arena-galeria.webp`, arenaFallback: `${ART}/pedra-02.webp` },
    { tipo: 'corrompida', rotulo: 'Câmara sussurrante' },
    { tipo: 'chefe', nivel: 9, rotulo: 'Coração das ruínas', arena: `${CAL_ART}/arena-coracao.webp`, arenaFallback: `${ART}/reinos/01/arena-chefe.webp` },
  ],
  recompensas: { luta: { gold: 50, fibra: 2 }, corrompida: { gold: 40, cristal: 3 }, tesouro: { gold: 80, cristal: 4 }, chefe: { gold: 160, cristal: 6, diamantes: 10 } },
};

// ---- Crise: a mesma cidade em cinco estados (artes de expansao1/crise/ com fallback para as existentes) ----
export const CRISE = {
  cidade: 'Vila do Norte',
  estados: ['saudavel', 'contaminada', 'tomada', 'purificada', 'reconstruida'],
  nomes: { saudavel: 'Saudável', contaminada: 'Contaminada', tomada: 'Tomada', purificada: 'Purificada', reconstruida: 'Reconstruída' },
  arte: {
    saudavel: 'expansao1/crise/vila-saudavel',
    contaminada: 'expansao1/crise/vila-contaminada',
    tomada: 'expansao1/crise/vila-tomada',
    purificada: 'expansao1/crise/vila-purificada',
    reconstruida: 'expansao1/crise/vila-reconstruida',
  },
  arteFallback: {
    saudavel: 'mundo/01/vila-saudavel',
    contaminada: 'mundo/31/cidade-surto',
    tomada: 'mundo/31/cidade-dominada',
    purificada: 'mundo/01/vila-ruinas',
    reconstruida: 'mundo/31/cidade-nova',
  },
  zumbi: 'mundo/31/zumbi', cura: 'mundo/15/cura',
  zumbis: { saudavel: 0, contaminada: 3, tomada: 7, purificada: 0, reconstruida: 0 },
  custos: { purificar: { itens: { tonico: 1 }, mat: { cristal: 2 } }, reconstruir: { mat: { fibra: 8, cristal: 4 }, gold: 100 }, conter: { itens: { tonico: 2 }, mat: {} } },
  servico: { nome: 'Posto de cura', texto: 'Reaberto: entrega 1 Tônico de Lucidez por dia (1 hora na prévia).', intervaloMs: 3600000 },
  posicoes: [[18, 62], [34, 70], [50, 64], [66, 72], [80, 60], [26, 52], [58, 54], [42, 78]],
};

// ---- Herói × Vilão: Capítulo 1 (missões 1 a 10). A escolha da missão 5 muda o objetivo da 7 e o desfecho. ----
const A = (n) => `${ART}/${n}.webp`;
const HV_ART = 'assets/confusion/interface/expansao1/hv';
export const HV = {
  bustos: {
    'Herói': { arte: `${HV_ART}/heroi.png`, fallback: 'assets/confusion/interface/personagens/guardiao_reino.webp' },
    Mira: { arte: `${HV_ART}/mira.png`, fallback: 'assets/confusion/interface/mundo-retratos/mira/mira-neutro.webp' },
    Maregor: { arte: `${HV_ART}/maregor.png`, fallback: 'assets/confusion/interface/estrategia/reinos/02/chefe.webp' },
    'General das Cinzas': { arte: `${HV_ART}/general-das-cinzas.png`, fallback: 'assets/confusion/interface/estrategia/reinos/03/chefe.webp' },
    Pescadora: { arte: 'assets/confusion/interface/personagens/pescadora.webp', fallback: 'assets/confusion/interface/personagens/pescadora.webp' },
    Mineiro: { arte: 'assets/confusion/interface/personagens/vigia_e2.webp', fallback: 'assets/confusion/interface/personagens/vigia_e2.webp' },
  },
  capitulos: [
    {
      id: 'cap1', titulo: 'Capítulo 1 · O Elmo Partido', resumo: 'O herói de Cabo Âmbar enfrenta Maregor, o vilão que quebrou o elmo da cidade.',
      capa: `${HV_ART}/capa-cap1.webp`, capaFallback: `${ART}/reinos/02/arena-falesias.webp`,
      missoes: [
        { n: 1, titulo: 'A sirene de Cabo Âmbar', arena: A('madeira-01'), dialogo: ['Mira: A sirene tocou três vezes. É o sinal de Maregor.', 'Herói: Então o elmo já foi quebrado. Vou atrás dele.'], inimigos: [['Fanalino', 3], ['Cervomusgo', 3]], objetivo: 'Abrir caminho até o cais.', recompensa: { gold: 60, diamantes: 3 } },
        { n: 2, titulo: 'Rastros no cais', arena: A('madeira-02'), dialogo: ['Pescadora: Ele levou uma caixa de ferro. Passou por aqui ao amanhecer.', 'Herói: Pegadas fundas... ele carrega algo pesado.'], inimigos: [['Tatuveludo', 4], ['Fanalino', 4]], objetivo: 'Seguir os rastros até a mina.', recompensa: { gold: 70, diamantes: 3 } },
        { n: 3, titulo: 'A mina de bronze', arena: A('pedra-01'), dialogo: ['Mineiro: Os capangas dele cavam as ruínas de bronze.', 'Herói: Se acharem o resto do elmo, ele fica completo.'], inimigos: [['Xistolim', 5], ['Bronzelo', 5]], objetivo: 'Expulsar os capangas.', recompensa: { gold: 80, diamantes: 4 } },
        { n: 4, titulo: 'O primeiro encontro', arena: A('pedra-02'), dialogo: ['Maregor: Chegou tarde, herói. Metade do elmo já é minha.', 'Herói: Então eu fico com a outra metade e com você.'], inimigos: [['Maregor', 7]], objetivo: 'Derrotar Maregor.', recompensa: { gold: 100, diamantes: 5 } },
        { n: 5, titulo: 'A escolha no desfiladeiro', arena: A('pedra-03'), dialogo: ['Maregor, ferido: O elmo quebrado me prendeu a esta vida. Se me matar, a maldição passa para outro.', 'Mira: Podemos poupá-lo e levá-lo à Guilda... ou prendê-lo agora e pedir o elmo.'], inimigos: [['Cerifogo', 7], ['Trovoresta', 7]], objetivo: 'Decidir o destino de Maregor.', recompensa: { gold: 110, diamantes: 5 },
          escolha: { id: 'destino', titulo: 'O que fazer com Maregor?', opcoes: [{ id: 'poupar', rotulo: 'Poupá-lo e confiar nele' }, { id: 'prender', rotulo: 'Prendê-lo e tomar o elmo' }] } },
        { n: 6, titulo: 'Rumo ao farol', arena: A('madeira-03'), dialogo: ['Mira: Os capangas voltam em bando. Precisamos chegar ao farol.'], inimigos: [['Ventassol', 8], ['Falesário', 8]], objetivo: 'Chegar ao farol de Cabo Âmbar.', recompensa: { gold: 120, diamantes: 5 } },
        { n: 7, titulo: 'O farol', arena: A('reinos/02/arena-falesias'),
          porEscolha: { poupar: { objetivo: 'Proteger Maregor, que luta ao seu lado, até o topo do farol.', dialogo: ['Maregor: Eu abro a porta. Vocês seguram a escada.'], inimigos: [['Zunifaísca', 9], ['Voltabelha', 9]] }, prender: { objetivo: 'Escoltar o prisioneiro Maregor sem deixar os capangas libertá-lo.', dialogo: ['Mira: Eles vêm resgatá-lo! Segurem a porta!'], inimigos: [['Zunifaísca', 10], ['Voltabelha', 10], ['Trovoresta', 10]] } },
          recompensa: { gold: 130, diamantes: 6 } },
        { n: 8, titulo: 'A sala do elmo', arena: A('reinos/02/arena-ruinas'), dialogo: ['Herói: O elmo está inteiro, mas sem alma.', 'Mira: Alguém precisa usá-lo para acordá-lo.'], inimigos: [['Latonhorn', 10], ['Bronzelo', 10]], objetivo: 'Alcançar o pedestal do elmo.', recompensa: { gold: 140, diamantes: 6 } },
        { n: 9, titulo: 'O general das cinzas', arena: A('reinos/02/arena-fornos'), dialogo: ['General das Cinzas: O elmo é meu desde antes de vocês nascerem.'], inimigos: [['Ambarasa', 11], ['Cerifogo', 11], ['Trovoresta', 11]], objetivo: 'Derrotar o General das Cinzas.', recompensa: { gold: 160, diamantes: 8 } },
        { n: 10, titulo: 'O elmo e o nome', arena: A('reinos/01/arena-chefe'), dialogo: ['Herói: Sem Maregor, o elmo é só ferro.'], inimigos: [['Maregor', 12]], objetivo: 'Encerrar o Capítulo 1.', recompensa: { gold: 250, diamantes: 15 },
          porEscolha: { poupar: { objetivo: 'Selar o elmo ao lado de Maregor, sem derrotá-lo.', dialogo: ['Maregor: Eu aceito a guarda do elmo. Que a maldição acabe em mim.'], inimigos: [['Maregor', 12]] }, prender: { objetivo: 'Derrotar Maregor, livre da cela, e fundir o elmo.', dialogo: ['Maregor: Nunca me prenderam por muito tempo!'], inimigos: [['Maregor', 14], ['Latonhorn', 12]] } },
          epilogo: { poupar: 'Maregor aceita guardar o elmo e Cabo Âmbar ganha um aliado improvável. A maldição se encerra sem derramamento.', prender: 'O elmo é fundido e Maregor volta para a cela. A cidade respira, mas o preço foi uma paz vigiada.' } },
      ],
    },
  ],
  chefes: { Maregor: { arte: 'assets/confusion/interface/estrategia/reinos/02/chefe.webp' } },
};
