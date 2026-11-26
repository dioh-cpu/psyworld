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
  { id: 'cac1', nome: 'Clareira de Fibras', base: 'E5', bioma: 'Floresta Sombria', requer: 'q_mare_devolveu', materiais: { fibra: [1, 2], cristal: [0, 1] }, chance: 0.6, onir: ['Brotavel', 'Cervomusgo', 'Noctarn', 'Fanalino'], nivel: [3, 5] },
  { id: 'cac2', nome: 'Grota dos Cogumelos', base: 'D5', bioma: 'Floresta de Cogumelos', requer: 'q_acima_mare', materiais: { fibra: [1, 2], cristal: [1, 2] }, chance: 0.6, onir: ['Cervomusgo', 'Tatuveludo', 'Ignavor', 'Colmeiro'], nivel: [5, 8] },
  { id: 'cac3', nome: 'Veio Cintilante', base: 'PC4', bioma: 'Caverna Cintilante', requer: 'q_saida_pedras', materiais: { fibra: [0, 1], cristal: [2, 3] }, chance: 0.65, onir: ['Xistolim', 'Calquélon', 'Vaelith', 'Bronzelo'], nivel: [8, 11] },
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
      { id: 'tonico', nome: 'Tônico de Lucidez', icone: '🧪', profissao: 'alquimia', insumos: { fibra: 2, leite: 1 }, saida: { tonico: 1 }, seg: 20, uso: 'Calabouço: restaura Sanidade' },
      { id: 'racao', nome: 'Ração reforçada', icone: '🍲', profissao: 'cozinha', insumos: { ovos: 2, mel: 1 }, saida: { racao: 1 }, seg: 25, uso: 'Calabouço: recupera a vida da equipe' },
    ],
    itens: { tonico: { nome: 'Tônico de Lucidez', icone: '🧪' }, racao: { nome: 'Ração reforçada', icone: '🍲' } },
  },
};
export const PROFISSOES = { alquimia: { nome: 'Alquimia', icone: '⚗️' }, cozinha: { nome: 'Cozinha', icone: '🍳' }, fazenda: { nome: 'Fazenda', icone: '🌾' } };

// ---- Guilda dos Aventureiros ----
export const CONTRATOS = [
  { id: 'g1', titulo: 'Fibras para o balcão', texto: 'A Guilda precisa de fibras para consertar o curral abandonado. Aceite, ligue o Auto-Caça na Clareira de Fibras (menu Caçadas) e volte com 6 fibras.', requer: null, pede: { mat: { fibra: 6 } }, recompensa: { gold: 120, diamantes: 5 }, libera: 'fazenda', fim: 'Curral, apiário e galinheiro prontos: a Fazenda está aberta.' },
  { id: 'g2', titulo: 'Leite fresco', texto: 'O mestre da Guilda quer provar o leite da Fazenda. Colete a produção (Guilda → Fazenda) e entregue 3 leites.', requer: 'g1', pede: { mat: { leite: 3 } }, recompensa: { gold: 150, diamantes: 5 }, libera: 'oficina', fim: 'A Oficina está aberta, com a receita do Tônico de Lucidez.' },
  { id: 'g3', titulo: 'Tônico para a descida', texto: 'Um calabouço rasteja sob a floresta. Fabrique um Tônico de Lucidez na Oficina e entregue: ele restaura a Sanidade lá embaixo.', requer: 'g2', pede: { itens: { tonico: 1 } }, recompensa: { gold: 200, diamantes: 8 }, libera: null, fim: 'Guarde tônicos para o Calabouço.' },
];

// ---- Calabouço: salas e Sanidade ----
export const CALABOUCO = {
  id: 'cal1', nome: 'Ruínas Rastejantes', sanidadeMax: 100, perdaCorrompida: 25, limiteEscolha: 50, tonico: 35, racao: 0.4,
  salas: [
    { tipo: 'luta', nivel: 4, rotulo: 'Corredor de raízes' }, { tipo: 'corrompida', rotulo: 'Sala corrompida' }, { tipo: 'luta', nivel: 6, rotulo: 'Galeria rachada' },
    { tipo: 'corrompida', rotulo: 'Câmara sussurrante' }, { tipo: 'chefe', nivel: 9, rotulo: 'Coração das ruínas' },
  ],
  recompensas: { luta: { gold: 50, fibra: 2 }, corrompida: { gold: 40, cristal: 3 }, tesouro: { gold: 80, cristal: 4 }, chefe: { gold: 160, cristal: 6, diamantes: 10 } },
};

// ---- Crise: a mesma cidade em cinco estados (artes existentes dos sistemas 01, 15 e 31) ----
export const CRISE = {
  cidade: 'Vila do Norte',
  estados: ['saudavel', 'contaminada', 'tomada', 'purificada', 'reconstruida'],
  nomes: { saudavel: 'Saudável', contaminada: 'Contaminada', tomada: 'Tomada', purificada: 'Purificada', reconstruida: 'Reconstruída' },
  arte: { saudavel: 'mundo/01/vila-saudavel', contaminada: 'mundo/31/cidade-surto', tomada: 'mundo/31/cidade-dominada', purificada: 'mundo/01/vila-ruinas', reconstruida: 'mundo/31/cidade-nova' },
  zumbi: 'mundo/31/zumbi', cura: 'mundo/15/cura',
  zumbis: { saudavel: 0, contaminada: 3, tomada: 7, purificada: 0, reconstruida: 0 },
  custos: { purificar: { itens: { tonico: 1 }, mat: { cristal: 2 } }, reconstruir: { mat: { fibra: 8, cristal: 4 }, gold: 100 }, conter: { itens: { tonico: 2 }, mat: {} } },
  servico: { nome: 'Posto de cura', texto: 'Reaberto: entrega 1 Tônico de Lucidez por dia (1 hora na prévia).', intervaloMs: 3600000 },
  posicoes: [[18, 62], [34, 70], [50, 64], [66, 72], [80, 60], [26, 52], [58, 54], [42, 78]],
};

// ---- Herói × Vilão: Capítulo 1 (missões 1 a 10). A escolha da missão 5 muda o objetivo da 7 e o desfecho. ----
const A = (n) => `${ART}/${n}.webp`;
export const HV = {
  capitulos: [
    {
      id: 'cap1', titulo: 'Capítulo 1 · O Elmo Partido', resumo: 'O herói de Cabo Âmbar enfrenta Maregor, o vilão que quebrou o elmo da cidade.',
      missoes: [
        { n: 1, titulo: 'A sirene de Cabo Âmbar', arena: A('madeira-01'), dialogo: ['Mira: A sirene tocou três vezes. É o sinal de Maregor.', 'Herói: Então o elmo já foi quebrado. Vou atrás dele.'], inimigos: [['Noctarn', 3], ['Brotavel', 3]], objetivo: 'Abrir caminho até o cais.', recompensa: { gold: 60, diamantes: 3 } },
        { n: 2, titulo: 'Rastros no cais', arena: A('madeira-02'), dialogo: ['Pescadora: Ele levou uma caixa de ferro. Passou por aqui ao amanhecer.', 'Herói: Pegadas fundas... ele carrega algo pesado.'], inimigos: [['Ignavor', 4], ['Noctarn', 4]], objetivo: 'Seguir os rastros até a mina.', recompensa: { gold: 70, diamantes: 3 } },
        { n: 3, titulo: 'A mina de bronze', arena: A('pedra-01'), dialogo: ['Mineiro: Os capangas dele cavam as ruínas de bronze.', 'Herói: Se acharem o resto do elmo, ele fica completo.'], inimigos: [['Xistolim', 5], ['Bronzelo', 5]], objetivo: 'Expulsar os capangas.', recompensa: { gold: 80, diamantes: 4 } },
        { n: 4, titulo: 'O primeiro encontro', arena: A('pedra-02'), dialogo: ['Maregor: Chegou tarde, herói. Metade do elmo já é minha.', 'Herói: Então eu fico com a outra metade e com você.'], inimigos: [['Maregor', 7]], objetivo: 'Derrotar Maregor.', recompensa: { gold: 100, diamantes: 5 } },
        { n: 5, titulo: 'A escolha no desfiladeiro', arena: A('pedra-03'), dialogo: ['Maregor, ferido: O elmo quebrado me prendeu a esta vida. Se me matar, a maldição passa para outro.', 'Mira: Podemos poupá-lo e levá-lo à Guilda... ou prendê-lo agora e pedir o elmo.'], inimigos: [['Cerifogo', 7], ['Trovoresta', 7]], objetivo: 'Decidir o destino de Maregor.', recompensa: { gold: 110, diamantes: 5 },
          escolha: { id: 'destino', titulo: 'O que fazer com Maregor?', opcoes: [{ id: 'poupar', rotulo: 'Poupá-lo e confiar nele' }, { id: 'prender', rotulo: 'Prendê-lo e tomar o elmo' }] } },
        { n: 6, titulo: 'Rumo ao farol', arena: A('madeira-03'), dialogo: ['Mira: Os capangas voltam em bando. Precisamos chegar ao farol.'], inimigos: [['Ventassol', 8], ['Falesário', 8]], objetivo: 'Chegar ao farol de Cabo Âmbar.', recompensa: { gold: 120, diamantes: 5 } },
        { n: 7, titulo: 'O farol', arena: A('reinos/02/arena-falesias'),
          porEscolha: { poupar: { objetivo: 'Proteger Maregor, que luta ao seu lado, até o topo do farol.', dialogo: ['Maregor: Eu abro a porta. Vocês seguram a escada.'], inimigos: [['Zunifaísca', 9], ['Voltabelha', 9]] }, prender: { objetivo: 'Escoltar o prisioneiro Maregor sem deixar os capangas libertá-lo.', dialogo: ['Mira: Eles vêm resgatá-lo! Segurem a porta!'], inimigos: [['Zunifaísca', 10], ['Voltabelha', 10], ['Trovoresta', 10]] } },
          recompensa: { gold: 130, diamantes: 6 } },
        { n: 8, titulo: 'A sala do elmo', arena: A('reinos/02/arena-ruinas'), dialogo: ['Herói: O elmo está inteiro, mas sem alma.', 'Mira: Alguém precisa usá-lo para acordá-lo.'], inimigos: [['Latonhorn', 10], ['Bronzelo', 10]], objetivo: 'Alcançar o pedestal do elmo.', recompensa: { gold: 140, diamantes: 6 } },
        { n: 9, titulo: 'O general das cinzas', arena: A('reinos/02/arena-fornos'), dialogo: ['General das Cinzas: O elmo é meu desde antes de vocês nascerem.'], inimigos: [['Ambarasa', 11], ['Cerifogo', 11], ['Ignavor', 11]], objetivo: 'Derrotar o General das Cinzas.', recompensa: { gold: 160, diamantes: 8 } },
        { n: 10, titulo: 'O elmo e o nome', arena: A('reinos/01/arena-chefe'), dialogo: ['Herói: Sem Maregor, o elmo é só ferro.'], inimigos: [['Maregor', 12]], objetivo: 'Encerrar o Capítulo 1.', recompensa: { gold: 250, diamantes: 15 },
          porEscolha: { poupar: { objetivo: 'Selar o elmo ao lado de Maregor, sem derrotá-lo.', dialogo: ['Maregor: Eu aceito a guarda do elmo. Que a maldição acabe em mim.'], inimigos: [['Maregor', 12]] }, prender: { objetivo: 'Derrotar Maregor, livre da cela, e fundir o elmo.', dialogo: ['Maregor: Nunca me prenderam por muito tempo!'], inimigos: [['Maregor', 14], ['Latonhorn', 12]] } },
          epilogo: { poupar: 'Maregor aceita guardar o elmo e Cabo Âmbar ganha um aliado improvável. A maldição se encerra sem derramamento.', prender: 'O elmo é fundido e Maregor volta para a cela. A cidade respira, mas o preço foi uma paz vigiada.' } },
      ],
    },
  ],
  chefes: { Maregor: { arte: 'assets/confusion/interface/estrategia/reinos/02/chefe.webp' } },
};
