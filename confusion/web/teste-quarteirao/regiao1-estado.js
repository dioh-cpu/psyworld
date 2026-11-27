// Estado jogável, quests, rede de teleportes, progressão do trem e persistência da Região 1.
// Código puro (sem DOM/Three.js) para permitir testes automatizados determinísticos.

export const SAVE_KEY_REGIAO1 = 'psyworld_regiao1_save_v1';

export const MARCOS_TELEPORTE = {
  C1: { id: 'C1', nome: 'C1 · Praça da Cidade', questId: 'q_tp_c1', requerDescobertaAntes: ['E8', 'D9'] },
  E8: { id: 'E8', nome: 'E8 · Raízes Negras', questId: 'q_tp_e8', requerDescobertaAntes: null },
  D9: { id: 'D9', nome: 'D9 · Mirante Leste', questId: 'q_tp_d9', requerDescobertaAntes: null },
  PC7: { id: 'PC7', nome: 'PC7 · Terraços do Recife', questId: 'q_tp_pc7', requerDescobertaAntes: null },
  CC7: { id: 'CC7', nome: 'CC7 · Salão dos Ecos', questId: 'q_tp_cc7', requerDescobertaAntes: null },
  REINO: { id: 'REINO', nome: 'REINO · Praça Real', questId: 'q_primeira_partida', viaTrem: true },
};

export const BOSSES_REGIAO1 = {
  BOSS_E: { id: 'BOSS_E', nome: 'Espírito da Floresta', rota: 'principal', mapaRetorno: 'E10', questId: 'q_boss_e', hp: 160, nivel: 12, elemento: 'planta' },
  BOSS_D: { id: 'BOSS_D', nome: 'Rei Fungo', rota: 'principal', mapaRetorno: 'D11', questId: 'q_boss_d', hp: 170, nivel: 12, elemento: 'trevas' },
  BOSS_S: { id: 'BOSS_S', nome: 'Siren', rota: 'opcional', mapaRetorno: 'PC9', questId: 'q_boss_s', hp: 185, nivel: 14, elemento: 'agua' },
  BOSS_C: { id: 'BOSS_C', nome: 'Golem de Ametista', rota: 'opcional', mapaRetorno: 'CC9', questId: 'q_boss_c', hp: 200, nivel: 15, elemento: 'neutro' },
};

export const QUESTS_DEFINICOES = [
  // ---- Campanha central ----
  {
    id: 'q_pegadas',
    categoria: 'Campanha Central',
    titulo: 'Pegadas que não são minhas',
    mapas: ['C0'],
    resumo: 'Azazel acorda como Noctarn em C0. Explore o píer e examine o bote para achar uma tábua do navio.',
    pistas: ['clue_c0_pier', 'clue_c0_bote'],
    rotulosPistas: { clue_c0_pier: 'Explorar o píer de C0', clue_c0_bote: 'Examinar o bote em C0 (tábua do navio)' },
    recompensa: { gold: 80, diamantes: 15, xp: 40 },
    inicioAutomatico: true,
    liberaQuests: ['q_mare_devolveu'],
  },
  {
    id: 'q_mare_devolveu',
    categoria: 'Campanha Central',
    titulo: 'O que a maré devolveu',
    mapas: ['C0', 'C1'],
    resumo: 'Fale com a pescadora em C0 e siga até o badalo recuperado do naufrágio na praça de C1.',
    pistas: ['npc_pescadora_falou', 'clue_c1_badalo'],
    rotulosPistas: { npc_pescadora_falou: 'Falar com a pescadora em C0', clue_c1_badalo: 'Examinar o badalo do navio em C1' },
    recompensa: { gold: 100, diamantes: 20, xp: 55 },
    liberaQuests: ['q_ultimo_trem'],
  },
  {
    id: 'q_ultimo_trem',
    categoria: 'Campanha Central',
    titulo: 'O último trem',
    mapas: ['C1', 'C2', 'C3'],
    resumo: 'Fale com a maquinista entre C2 e C3 para entender os bloqueios oeste (Floresta Sombria) e leste (Floresta de Cogumelos).',
    pistas: ['npc_maquinista_falou'],
    rotulosPistas: { npc_maquinista_falou: 'Falar com a maquinista sobre os dois bloqueios' },
    recompensa: { gold: 120, diamantes: 25, xp: 60 },
    liberaQuests: ['q_guarda_arco', 'q_acima_mare', 'q_saida_pedras'],
  },
  {
    id: 'q_primeira_partida',
    categoria: 'Campanha Central',
    titulo: 'A primeira partida',
    mapas: ['C3', 'REINO'],
    resumo: 'Com Espírito da Floresta e Rei Fungo derrotados, embarque no trem em C3 e desembarque no Reino para ativar seu teleporte.',
    pistas: ['trem_desembarque_reino'],
    rotulosPistas: { trem_desembarque_reino: 'Embarcar no trem em C3 e desembarcar no Reino' },
    recompensa: { gold: 300, diamantes: 80, xp: 180 },
  },

  // ---- Floresta Sombria ----
  {
    id: 'q_guarda_arco',
    categoria: 'Floresta Sombria',
    titulo: 'O guarda do arco',
    mapas: ['E1', 'E4'],
    resumo: 'Encontre a lanterna em E1 e siga as marcas do guarda pelo arco até E4.',
    pistas: ['clue_e1_lanterna', 'clue_e4_marcas'],
    rotulosPistas: { clue_e1_lanterna: 'Encontrar a lanterna em E1', clue_e4_marcas: 'Seguir as marcas pelo arco até E4' },
    recompensa: { gold: 100, diamantes: 20, xp: 65 },
    liberaQuests: ['q_sal_raizes'],
  },
  {
    id: 'q_sal_raizes',
    categoria: 'Floresta Sombria',
    titulo: 'Sal nas raízes',
    mapas: ['E5', 'E8'],
    resumo: 'Investigue a nascente salgada em E5 e resgate o guarda-florestal elfo em E8.',
    pistas: ['clue_e5_nascente', 'npc_guarda_elfo_resgatado'],
    rotulosPistas: { clue_e5_nascente: 'Investigar nascente salgada em E5', npc_guarda_elfo_resgatado: 'Resgatar o guarda-florestal elfo em E8' },
    recompensa: { gold: 140, diamantes: 25, xp: 85 },
    liberaQuests: ['q_mulher_mata'],
  },
  {
    id: 'q_mulher_mata',
    categoria: 'Floresta Sombria',
    titulo: 'A mulher da mata',
    mapas: ['E9'],
    resumo: 'Conheça o Espírito da Floresta em E9 e feche a comporta de névoa.',
    pistas: ['npc_espirito_previa_falou', 'clue_e9_comporta'],
    rotulosPistas: { npc_espirito_previa_falou: 'Encontrar o Espírito da Floresta em E9', clue_e9_comporta: 'Fechar a comporta em E9' },
    recompensa: { gold: 160, diamantes: 30, xp: 100 },
    liberaQuests: ['q_coracao_mata'],
  },
  {
    id: 'q_coracao_mata',
    categoria: 'Floresta Sombria',
    titulo: 'O coração da mata',
    mapas: ['E10'],
    resumo: 'Siga as raízes até o santuário em E10 para abrir passagem ao confronto.',
    pistas: ['clue_e10_raizes'],
    rotulosPistas: { clue_e10_raizes: 'Seguir as raízes até o santuário em E10' },
    recompensa: { gold: 180, diamantes: 30, xp: 110 },
    liberaQuests: ['q_boss_e'],
  },
  {
    id: 'q_boss_e',
    categoria: 'Floresta Sombria',
    titulo: 'Derrote o Espírito da Floresta',
    mapas: ['BOSS_E'],
    resumo: 'Vença o Espírito da Floresta em BOSS_E. Após a vitória, retorne a pé para E10.',
    pistas: ['boss_BOSS_E_derrotado'],
    rotulosPistas: { boss_BOSS_E_derrotado: 'Derrotar o Espírito da Floresta em BOSS_E' },
    recompensa: { gold: 320, diamantes: 60, xp: 200 },
  },

  // ---- Floresta de Cogumelos ----
  {
    id: 'q_acima_mare',
    categoria: 'Floresta de Cogumelos',
    titulo: 'Acima da linha da maré',
    mapas: ['D1', 'D2'],
    resumo: 'Investigue o totem em D1 e os destroços em D2 que apontam para o interior da mata.',
    pistas: ['clue_d1_totem', 'clue_d2_destrocos'],
    rotulosPistas: { clue_d1_totem: 'Investigar o totem em D1', clue_d2_destrocos: 'Examinar destroços em D2' },
    recompensa: { gold: 100, diamantes: 20, xp: 65 },
    liberaQuests: ['q_floresta_respira'],
  },
  {
    id: 'q_floresta_respira',
    categoria: 'Floresta de Cogumelos',
    titulo: 'A floresta que respira',
    mapas: ['D4', 'D7'],
    resumo: 'Fale com o coletor goblin em D4 e leia a sequência de brilho dos fungos em D7.',
    pistas: ['npc_coletor_goblin_falou', 'clue_d7_sequencia'],
    rotulosPistas: { npc_coletor_goblin_falou: 'Aprender com o coletor goblin em D4', clue_d7_sequencia: 'Ler a sequência de brilho em D7' },
    recompensa: { gold: 140, diamantes: 25, xp: 85 },
    liberaQuests: ['q_trilha_esporos'],
  },
  {
    id: 'q_trilha_esporos',
    categoria: 'Floresta de Cogumelos',
    titulo: 'A trilha dos esporos',
    mapas: ['D8', 'D9'],
    resumo: 'Siga o rastro de esporos em D8 até o mirante D9 e descubra a descida rochosa.',
    pistas: ['clue_d8_rastro', 'clue_d9_descida'],
    rotulosPistas: { clue_d8_rastro: 'Seguir rastro de esporos em D8', clue_d9_descida: 'Descobrir a descida no mirante D9' },
    recompensa: { gold: 160, diamantes: 30, xp: 100 },
    liberaQuests: ['q_enseada_lanternas'],
  },
  {
    id: 'q_enseada_lanternas',
    categoria: 'Floresta de Cogumelos',
    titulo: 'A enseada das lanternas',
    mapas: ['D10', 'D11'],
    resumo: 'Investigue o posto abandonado em D10 e encontre a entrada do salão fúngico em D11.',
    pistas: ['clue_d10_posto', 'clue_d11_entrada'],
    rotulosPistas: { clue_d10_posto: 'Investigar posto abandonado em D10', clue_d11_entrada: 'Encontrar entrada do salão em D11' },
    recompensa: { gold: 180, diamantes: 30, xp: 110 },
    liberaQuests: ['q_boss_d'],
  },
  {
    id: 'q_boss_d',
    categoria: 'Floresta de Cogumelos',
    titulo: 'Derrote o Rei Fungo',
    mapas: ['BOSS_D'],
    resumo: 'Vença o Rei Fungo em BOSS_D. Após a vitória, retorne a pé para D11.',
    pistas: ['boss_BOSS_D_derrotado'],
    rotulosPistas: { boss_BOSS_D_derrotado: 'Derrotar o Rei Fungo em BOSS_D' },
    recompensa: { gold: 320, diamantes: 60, xp: 200 },
  },

  // ---- Praias Cristalinas ----
  {
    id: 'q_saida_pedras',
    categoria: 'Praias Cristalinas',
    titulo: 'A saída entre as pedras',
    mapas: ['E2', 'PC1'],
    resumo: 'Fale com o vigia em E2 (ele aponta o arco em E1 e a passagem oeste para PC1) e chegue a PC1.',
    pistas: ['npc_vigia_e2_falou', 'clue_pc1_chegada'],
    rotulosPistas: { npc_vigia_e2_falou: 'Falar com o vigia humano em E2', clue_pc1_chegada: 'Cruzar a passagem oeste até PC1' },
    recompensa: { gold: 110, diamantes: 20, xp: 70 },
    liberaQuests: ['q_mare_esconde'],
  },
  {
    id: 'q_mare_esconde',
    categoria: 'Praias Cristalinas',
    titulo: 'O que a maré esconde',
    mapas: ['PC2', 'PC3', 'PC4'],
    resumo: 'Atravesse as passarelas de PC2 a PC4 e investigue as marcas deixadas pela maré.',
    pistas: ['clue_pc2_marca', 'clue_pc3_marca', 'clue_pc4_marca'],
    rotulosPistas: { clue_pc2_marca: 'Marca da maré em PC2', clue_pc3_marca: 'Marca da maré em PC3', clue_pc4_marca: 'Marca da maré em PC4' },
    recompensa: { gold: 160, diamantes: 30, xp: 95 },
    liberaQuests: ['q_canto_agua'],
  },
  {
    id: 'q_canto_agua',
    categoria: 'Praias Cristalinas',
    titulo: 'O canto na água',
    mapas: ['PC5', 'PC6', 'PC9'],
    resumo: 'Siga o canto da Siren de PC5 a PC9 (PC6 também dá acesso opcional à Caverna Cintilante).',
    pistas: ['clue_pc5_canto', 'clue_pc6_gruta', 'clue_pc9_entrada'],
    rotulosPistas: { clue_pc5_canto: 'Ouvir o eco do canto em PC5', clue_pc6_gruta: 'Observar a boca da gruta em PC6', clue_pc9_entrada: 'Descobrir a entrada da arena em PC9' },
    recompensa: { gold: 190, diamantes: 35, xp: 120 },
    liberaQuests: ['q_boss_s', 'q_brilho_rocha'],
  },
  {
    id: 'q_boss_s',
    categoria: 'Praias Cristalinas',
    titulo: 'Derrote a Siren',
    mapas: ['BOSS_S'],
    resumo: 'Vença a Siren em BOSS_S. Missão própria; após a vitória, retorne a pé para PC9.',
    pistas: ['boss_BOSS_S_derrotado'],
    rotulosPistas: { boss_BOSS_S_derrotado: 'Derrotar a Siren em BOSS_S' },
    recompensa: { gold: 360, diamantes: 70, xp: 230 },
  },

  // ---- Caverna Cintilante ----
  {
    id: 'q_brilho_rocha',
    categoria: 'Caverna Cintilante',
    titulo: 'O brilho por trás da rocha',
    mapas: ['PC6', 'CC1'],
    resumo: 'Entre pela passagem oeste de PC6 até CC1 e examine os cristais da entrada.',
    pistas: ['clue_cc1_cristais'],
    rotulosPistas: { clue_cc1_cristais: 'Examinar os cristais na entrada de CC1' },
    recompensa: { gold: 130, diamantes: 25, xp: 80 },
    liberaQuests: ['q_eco_quartzo'],
  },
  {
    id: 'q_eco_quartzo',
    categoria: 'Caverna Cintilante',
    titulo: 'O eco do quartzo',
    mapas: ['CC2', 'CC4', 'CC6'],
    resumo: 'Investigue ressonâncias em CC2, CC4 e CC6 para localizar onde o Golem se concentra.',
    pistas: ['clue_cc2_eco', 'clue_cc4_eco', 'clue_cc6_eco'],
    rotulosPistas: { clue_cc2_eco: 'Ressonância em CC2', clue_cc4_eco: 'Ressonância em CC4', clue_cc6_eco: 'Ressonância em CC6' },
    recompensa: { gold: 180, diamantes: 35, xp: 115 },
    liberaQuests: ['q_salao_ametista'],
  },
  {
    id: 'q_salao_ametista',
    categoria: 'Caverna Cintilante',
    titulo: 'O salão de ametista',
    mapas: ['CC7', 'CC9'],
    resumo: 'Encontre a galeria em CC7 e abra o acesso à arena do Golem em CC9.',
    pistas: ['clue_cc7_galeria', 'clue_cc9_portal'],
    rotulosPistas: { clue_cc7_galeria: 'Inspecionar a galeria de CC7', clue_cc9_portal: 'Abrir o portal da arena em CC9' },
    recompensa: { gold: 210, diamantes: 40, xp: 135 },
    liberaQuests: ['q_boss_c'],
  },
  {
    id: 'q_boss_c',
    categoria: 'Caverna Cintilante',
    titulo: 'Derrote o Golem de Ametista',
    mapas: ['BOSS_C'],
    resumo: 'Vença o Golem de Ametista em BOSS_C. Missão própria; após a vitória, retorne a pé para CC9.',
    pistas: ['boss_BOSS_C_derrotado'],
    rotulosPistas: { boss_BOSS_C_derrotado: 'Derrotar o Golem de Ametista em BOSS_C' },
    recompensa: { gold: 400, diamantes: 80, xp: 260 },
  },

  // ---- Missões de Teleporte ----
  {
    id: 'q_tp_e8',
    categoria: 'Teleporte Regional',
    titulo: 'As pedras lembram (E8)',
    mapas: ['E8'],
    resumo: 'Limpe as raízes que cobrem o marco de E8 e ative o cristal.',
    pistas: ['tp_e8_raizes_limpas'],
    rotulosPistas: { tp_e8_raizes_limpas: 'Limpar as raízes sobre o marco em E8' },
    recompensa: { gold: 90, diamantes: 20, xp: 60 },
    ativaMarco: 'E8',
  },
  {
    id: 'q_tp_d9',
    categoria: 'Teleporte Regional',
    titulo: 'Luz do outro lado (D9)',
    mapas: ['D9'],
    resumo: 'Reproduza no pedestal de D9 a sequência de luz dos cogumelos.',
    pistas: ['tp_d9_sequencia_ok'],
    rotulosPistas: { tp_d9_sequencia_ok: 'Reproduzir a sequência luminosa no pedestal de D9' },
    recompensa: { gold: 90, diamantes: 20, xp: 60 },
    ativaMarco: 'D9',
  },
  {
    id: 'q_tp_c1',
    categoria: 'Teleporte Regional',
    titulo: 'O círculo da praça (C1)',
    mapas: ['C1'],
    resumo: 'Após descobrir E8 ou D9, fale com a zeladora em C1 e complete o circuito da praça.',
    pistas: ['npc_zeladora_c1_falou', 'clue_c1_circuito_1', 'clue_c1_circuito_2'],
    rotulosPistas: { npc_zeladora_c1_falou: 'Falar com a zeladora em C1', clue_c1_circuito_1: 'Sintonizar runa oeste da praça', clue_c1_circuito_2: 'Sintonizar runa leste da praça' },
    recompensa: { gold: 100, diamantes: 25, xp: 70 },
    ativaMarco: 'C1',
  },
  {
    id: 'q_tp_pc7',
    categoria: 'Teleporte Regional',
    titulo: 'A marca da maré (PC7)',
    mapas: ['PC7'],
    resumo: 'Alinhe as marcas do pedestal em PC7 com as referências das plataformas da praia.',
    pistas: ['tp_pc7_marcas_alinhadas'],
    rotulosPistas: { tp_pc7_marcas_alinhadas: 'Alinhar as marcas do pedestal em PC7' },
    recompensa: { gold: 110, diamantes: 25, xp: 75 },
    ativaMarco: 'PC7',
  },
  {
    id: 'q_tp_cc7',
    categoria: 'Teleporte Regional',
    titulo: 'O eco do cristal (CC7)',
    mapas: ['CC7'],
    resumo: 'Sintonize o marco de CC7 com os pulsos de três formações da galeria.',
    pistas: ['clue_cc7_pulso_1', 'clue_cc7_pulso_2', 'clue_cc7_pulso_3'],
    rotulosPistas: { clue_cc7_pulso_1: 'Pulso da formação norte', clue_cc7_pulso_2: 'Pulso da formação oeste', clue_cc7_pulso_3: 'Pulso da formação sul' },
    recompensa: { gold: 120, diamantes: 30, xp: 85 },
    ativaMarco: 'CC7',
  },

  // ---- Secundárias preservadas (nunca exigidas para o trem) ----
  {
    id: 'q_sec_canteiro',
    categoria: 'Secundária',
    titulo: 'Recuperação do canteiro',
    mapas: ['C1'],
    resumo: 'Ajude a jardineira em C1 a recuperar o canteiro da cidade para liberar o ícone da Fazenda.',
    pistas: ['npc_jardineira_c1_falou', 'clue_c1_canteiro'],
    rotulosPistas: { npc_jardineira_c1_falou: 'Falar com a jardineira em C1', clue_c1_canteiro: 'Restaurar o canteiro de C1' },
    recompensa: { gold: 90, diamantes: 15, xp: 50 },
    inicioDisponivel: true,
    desbloqueio: 'fazenda',
  },
  {
    id: 'q_sec_entrega',
    categoria: 'Secundária',
    titulo: 'Entrega da praça ao píer',
    mapas: ['C1', 'C0'],
    resumo: 'Pegue a encomenda com o mensageiro na praça de C1 e entregue no píer de C0 para aprimorar a Conexão Onírica (Transformar).',
    pistas: ['npc_mensageiro_c1_falou', 'clue_c0_entrega_pier'],
    rotulosPistas: { npc_mensageiro_c1_falou: 'Receber encomenda do mensageiro em C1', clue_c0_entrega_pier: 'Entregar encomenda no píer de C0' },
    recompensa: { gold: 90, diamantes: 15, xp: 50 },
    inicioDisponivel: true,
    desbloqueio: 'corrida',
  },
];

export const QUESTS_POR_ID = Object.fromEntries(QUESTS_DEFINICOES.map((q) => [q.id, q]));

export function criarEstadoInicial() {
  const teleportes = {};
  for (const id of Object.keys(MARCOS_TELEPORTE)) {
    teleportes[id] = { descoberto: false, ativo: false };
  }
  const quests = {};
  for (const q of QUESTS_DEFINICOES) {
    quests[q.id] = q.inicioAutomatico ? 'ativa' : q.inicioDisponivel ? 'disponivel' : 'bloqueada';
  }
  return {
    versao: 1,
    mapaAtual: 'C0',
    posicaoPx: [512, 340],
    forma: 'noctarn',
    teleportes,
    quests,
    pistas: {},
    bossesDerrotados: { BOSS_E: false, BOSS_D: false, BOSS_S: false, BOSS_C: false },
    tremLiberado: false,
    viagemTremConcluida: false,
    desbloqueios: { fazenda: false, corrida: false },
    recompensas: { gold: 0, diamantes: 0, xp: 0 },
    regioes: {
      atual: 'r1',
      chefesDerrotados: {},
      primeiraVitoria: {},
      missoes: {},
      pistas: {},
      abatesR2: 0,
    },
  };
}

function aplicarRecompensa(estado, q) {
  if (!q.recompensa) return;
  estado.recompensas.gold += q.recompensa.gold || 0;
  estado.recompensas.diamantes += q.recompensa.diamantes || 0;
  estado.recompensas.xp += q.recompensa.xp || 0;
}

export function avaliarQuests(estado) {
  const concluidasAgora = [];
  let mudou = true;
  while (mudou) {
    mudou = false;
    for (const q of QUESTS_DEFINICOES) {
      const st = estado.quests[q.id];
      if (st !== 'ativa') continue;
      const todas = q.pistas.every((p) => Boolean(estado.pistas[p]));
      if (todas) {
        estado.quests[q.id] = 'concluida';
        aplicarRecompensa(estado, q);
        if (q.ativaMarco && estado.teleportes[q.ativaMarco]) {
          estado.teleportes[q.ativaMarco].descoberto = true;
          estado.teleportes[q.ativaMarco].ativo = true;
        }
        if (q.desbloqueio) {
          estado.desbloqueios[q.desbloqueio] = true;
        }
        if (q.liberaQuests) {
          for (const prox of q.liberaQuests) {
            if (estado.quests[prox] === 'bloqueada') {
              estado.quests[prox] = 'disponivel';
            }
          }
        }
        concluidasAgora.push(q);
        mudou = true;
      }
    }
  }
  return concluidasAgora;
}

export function aceitarQuest(estado, questId) {
  const q = QUESTS_POR_ID[questId];
  if (!q) return { ok: false, concluidas: [] };
  const st = estado.quests[questId];
  if (st === 'concluida') return { ok: false, concluidas: [] };
  estado.quests[questId] = 'ativa';
  // Pistas já encontradas antes de aceitar são contabilizadas na hora
  const concluidas = avaliarQuests(estado);
  return { ok: true, concluidas };
}

export function registrarPista(estado, pistaId) {
  const jaTinha = Boolean(estado.pistas[pistaId]);
  estado.pistas[pistaId] = true;
  // Auto-ativa missões disponíveis que dependem diretamente desta pista se o jogador já interagiu no local
  for (const q of QUESTS_DEFINICOES) {
    if (estado.quests[q.id] === 'disponivel' && q.pistas.includes(pistaId)) {
      estado.quests[q.id] = 'ativa';
    }
  }
  const concluidas = avaliarQuests(estado);
  return { nova: !jaTinha, concluidas };
}

export function descobrirMarco(estado, marcoId) {
  const def = MARCOS_TELEPORTE[marcoId];
  if (!def || def.viaTrem) return { descobertoAgora: false, questsLiberadas: [] };
  const tp = estado.teleportes[marcoId];
  const descobertoAgora = !tp.descoberto;
  tp.descoberto = true;

  const questsLiberadas = [];
  if (marcoId !== 'C1' && def.questId && estado.quests[def.questId] === 'bloqueada') {
    estado.quests[def.questId] = 'disponivel';
    questsLiberadas.push(def.questId);
  }
  // C1 oferece sua missão após descobrir E8 ou D9
  if ((marcoId === 'E8' || marcoId === 'D9') && estado.quests.q_tp_c1 === 'bloqueada') {
    estado.quests.q_tp_c1 = 'disponivel';
    questsLiberadas.push('q_tp_c1');
  }
  return { descobertoAgora, questsLiberadas };
}

export function ativarMarcoDireto(estado, marcoId) {
  const def = MARCOS_TELEPORTE[marcoId];
  if (!def) return false;
  estado.teleportes[marcoId].descoberto = true;
  estado.teleportes[marcoId].ativo = true;
  if (def.questId && estado.quests[def.questId] !== 'concluida') {
    estado.quests[def.questId] = 'concluida';
  }
  return true;
}

export function destinosTeleporteDisponiveis(estado, origemId) {
  const origem = estado.teleportes[origemId];
  if (!origem || !origem.ativo) {
    return {
      permitido: false,
      destinos: [],
      mensagem: 'Este marco ainda está inativo (cristal cinza). Conclua a missão local para ativá-lo.',
    };
  }
  const destinos = Object.keys(MARCOS_TELEPORTE)
    .filter((id) => id !== origemId && estado.teleportes[id]?.descoberto && estado.teleportes[id]?.ativo)
    .map((id) => MARCOS_TELEPORTE[id]);
  if (destinos.length === 0) {
    return {
      permitido: true,
      destinos: [],
      mensagem: 'Marco ativo, mas ainda não há outros destinos descobertos e ativos na rede regional.',
    };
  }
  return { permitido: true, destinos, mensagem: '' };
}

export function registrarVitoriaBoss(estado, bossId) {
  const boss = BOSSES_REGIAO1[bossId];
  if (!boss) return { ok: false, tremLiberadoAgora: false, concluidas: [] };
  estado.bossesDerrotados[bossId] = true;
  const pistaBoss = `boss_${bossId}_derrotado`;
  estado.pistas[pistaBoss] = true;
  if (estado.quests[boss.questId] !== 'concluida') {
    estado.quests[boss.questId] = 'ativa';
  }
  const concluidas = avaliarQuests(estado);

  const antes = estado.tremLiberado;
  // Apenas Espírito da Floresta (BOSS_E) + Rei Fungo (BOSS_D) liberam o trem, em qualquer ordem
  if (estado.bossesDerrotados.BOSS_E && estado.bossesDerrotados.BOSS_D) {
    estado.tremLiberado = true;
    if (estado.regioes && typeof estado.regioes === 'object') {
      estado.regioes.chefesDerrotados = estado.regioes.chefesDerrotados || {};
      estado.regioes.chefesDerrotados.r1 = true;
    }
    if (estado.quests.q_primeira_partida === 'bloqueada' || estado.quests.q_primeira_partida === 'disponivel') {
      estado.quests.q_primeira_partida = 'ativa';
    }
  }
  return { ok: true, tremLiberadoAgora: !antes && estado.tremLiberado, concluidas };
}

export function embarcarNoTrem(estado) {
  if (!estado.tremLiberado) {
    const faltam = [];
    if (!estado.bossesDerrotados.BOSS_E) faltam.push('Espírito da Floresta (BOSS_E)');
    if (!estado.bossesDerrotados.BOSS_D) faltam.push('Rei Fungo (BOSS_D)');
    return {
      ok: false,
      mensagem: `🚂 Trem bloqueado: derrote ${faltam.join(' e ')} para liberar a viagem ao Reino.`,
      concluidas: [],
    };
  }
  estado.viagemTremConcluida = true;
  estado.teleportes.REINO.descoberto = true;
  estado.teleportes.REINO.ativo = true;
  estado.pistas.trem_desembarque_reino = true;
  if (estado.quests.q_primeira_partida !== 'concluida') {
    estado.quests.q_primeira_partida = 'ativa';
  }
  const concluidas = avaliarQuests(estado);
  return {
    ok: true,
    destino: 'REINO',
    mensagem: '🚂 Viagem concluída! Você desembarcou na Praça Real do Reino e liberou o destino no teleporte.',
    concluidas,
  };
}

export function progressoQuest(estado, questId) {
  const q = QUESTS_POR_ID[questId];
  if (!q) return { feitos: 0, total: 0 };
  const feitos = q.pistas.filter((p) => Boolean(estado.pistas[p])).length;
  return { feitos, total: q.pistas.length };
}

function sanitizarMapaSeguro(src, limite = 200, tipo = 'bool') {
  const out = {};
  if (!src || typeof src !== 'object' || Array.isArray(src)) return out;
  for (const [k, v] of Object.entries(src).slice(0, limite)) {
    const key = String(k).slice(0, 64);
    if (tipo === 'bool') {
      if (v) out[key] = true;
    } else if (tipo === 'int') {
      const n = Math.floor(Number(v) || 0);
      if (n > 0) out[key] = n;
    } else if (typeof v === 'string') {
      out[key] = v.slice(0, 120);
    }
  }
  return out;
}

// Lista branca explícita dos blocos novos em save.idle (mantém campos antigos intactos).
const isObj = (v) => Boolean(v && typeof v === 'object' && !Array.isArray(v));

export function sanitizarIdleProgressao(idle) {
  if (!isObj(idle)) return {};
  const out = { ...idle };
  for (const k of ['energia', 'essencias', 'campanhaMini', 'reliquias', 'missoes', 'missoesRotacao', 'armasUnicas', 'torres', 'calaboucos', 'domadores']) {
    if (k in out && !isObj(out[k])) delete out[k];
  }

  if (isObj(idle.energia)) {
    const e = idle.energia;
    const max = Math.max(120, Math.floor(Number(e.max) || 120));
    out.energia = {
      atual: Math.max(0, Math.min(max, Number.isFinite(Number(e.atual)) ? Math.floor(Number(e.atual)) : max)),
      max,
      pocoes: Math.max(0, Math.floor(Number(e.pocoes) || 0)),
      ultimoTickMs: Math.max(0, Math.floor(Number(e.ultimoTickMs) || 0)),
    };
  }

  if (isObj(idle.essencias)) {
    const ess = {};
    for (const par of ['ignea', 'mares', 'verde', 'mineral', 'solar', 'sombria']) {
      const cur = idle.essencias[par];
      if (isObj(cur)) {
        ess[par] = {
          menor: Math.max(0, Math.floor(Number(cur.menor) || 0)),
          media: Math.max(0, Math.floor(Number(cur.media) || 0)),
          maior: Math.max(0, Math.floor(Number(cur.maior) || 0)),
        };
      }
    }
    out.essencias = ess;
  }

  if (isObj(idle.campanhaMini)) {
    const cm = idle.campanhaMini;
    const fases = {};
    if (cm.fases && typeof cm.fases === 'object') {
      for (const [k, v] of Object.entries(cm.fases).slice(0, 160)) {
        if (v && typeof v === 'object') {
          fases[String(k).slice(0, 32)] = {
            vencida: Boolean(v.vencida),
            estrelas: Math.max(0, Math.min(3, Math.floor(Number(v.estrelas) || 0))),
            concluidas: Math.max(0, Math.floor(Number(v.concluidas) || 0)),
          };
        }
      }
    }
    out.campanhaMini = {
      fases,
      primeiraVitoriaPagas: sanitizarMapaSeguro(cm.primeiraVitoriaPagas, 160, 'bool'),
      bausFasePagos: sanitizarMapaSeguro(cm.bausFasePagos, 160, 'bool'),
      bausCapituloPagos: sanitizarMapaSeguro(cm.bausCapituloPagos, 60, 'bool'),
      capitulosConcluidos: sanitizarMapaSeguro(cm.capitulosConcluidos, 24, 'bool'),
      semanaisPagos: sanitizarMapaSeguro(cm.semanaisPagos, 24, 'bool'),
      batalhasPagas: sanitizarMapaSeguro(cm.batalhasPagas, 300, 'bool'),
    };
  }

  if (idle.reliquias && typeof idle.reliquias === 'object') {
    const r = idle.reliquias;
    const cap = Math.max(200, Math.min(500, Math.floor(Number(r.capacidade) || 200)));
    const bolsa = Array.isArray(r.bolsa)
      ? r.bolsa.slice(0, cap).filter((x) => x && typeof x === 'object' && typeof x.id === 'string').map((x) => ({
          id: String(x.id).slice(0, 32),
          parte: String(x.parte || 'coroa').slice(0, 16),
          conjunto: String(x.conjunto || 'cacador').slice(0, 24),
          elemento: String(x.elemento || 'planta').slice(0, 16),
          raridade: String(x.raridade || 'comum').slice(0, 16),
          reforco: Math.max(0, Math.min(15, Math.floor(Number(x.reforco) || 0))),
          principal: x.principal && typeof x.principal === 'object'
            ? { attr: String(x.principal.attr || 'vida_flat').slice(0, 24), valor: Number.isFinite(Number(x.principal.valor)) ? Number(x.principal.valor) : 0 }
            : { attr: 'vida_flat', valor: 0 },
          secundarios: Array.isArray(x.secundarios)
            ? x.secundarios.slice(0, 4).filter((s) => s && typeof s === 'object').map((s) => ({
                attr: String(s.attr || 'ataque_pct').slice(0, 24),
                valor: Number.isFinite(Number(s.valor)) ? Number(s.valor) : 0,
              }))
            : [],
          trancada: Boolean(x.trancada),
          fonte: String(x.fonte || '').slice(0, 40),
        }))
      : [];
    const equipadas = {};
    if (r.equipadas && typeof r.equipadas === 'object') {
      for (const [uid, eq] of Object.entries(r.equipadas).slice(0, 200)) {
        if (eq && typeof eq === 'object') {
          equipadas[String(uid).slice(0, 64)] = sanitizarMapaSeguro(eq, 8, 'str');
        }
      }
    }
    const predefinicoes = {};
    if (r.predefinicoes && typeof r.predefinicoes === 'object') {
      for (const [uid, sets] of Object.entries(r.predefinicoes).slice(0, 120)) {
        if (sets && typeof sets === 'object') {
          const clean = {};
          for (const [nome, slots] of Object.entries(sets).slice(0, 8)) {
            if (slots && typeof slots === 'object') clean[String(nome).slice(0, 32)] = sanitizarMapaSeguro(slots, 6, 'str');
          }
          predefinicoes[String(uid).slice(0, 64)] = clean;
        }
      }
    }
    out.reliquias = {
      bolsa,
      equipadas,
      predefinicoes,
      capacidade: cap,
      poReforco: Math.max(0, Math.floor(Number(r.poReforco) || 0)),
      seq: Math.max(0, Math.floor(Number(r.seq) || 0)),
    };
  }

  if (idle.missoes && typeof idle.missoes === 'object') {
    const m = idle.missoes;
    out.missoes = {
      paralelasAtivas: sanitizarMapaSeguro(m.paralelasAtivas, 60, 'int'),
      paralelasConcluidas: sanitizarMapaSeguro(m.paralelasConcluidas, 60, 'bool'),
      enfeitesRefugio: sanitizarMapaSeguro(m.enfeitesRefugio, 24, 'bool'),
      titulos: sanitizarMapaSeguro(m.titulos, 80, 'bool'),
      progresso: sanitizarMapaSeguro(m.progresso, 100, 'int'),
      marcosColetados: sanitizarMapaSeguro(m.marcosColetados, 100, 'bool'),
    };
  }

  if (idle.armasUnicas && typeof idle.armasUnicas === 'object') {
    const a = idle.armasUnicas;
    const possuidas = {};
    if (a.possuidas && typeof a.possuidas === 'object') {
      for (const [slug, st] of Object.entries(a.possuidas).slice(0, 120)) {
        if (st && typeof st === 'object') {
          possuidas[String(slug).slice(0, 32)] = {
            reforco: Math.max(0, Math.min(5, Math.floor(Number(st.reforco) || 0))),
            viaNivel100: Boolean(st.viaNivel100),
          };
        }
      }
    }
    out.armasUnicas = {
      fragmentos: sanitizarMapaSeguro(a.fragmentos, 120, 'int'),
      possuidas,
      equipadas: sanitizarMapaSeguro(a.equipadas, 200, 'str'),
      poUnico: Math.max(0, Math.floor(Number(a.poUnico) || 0)),
      escolhasPendentes: Math.max(0, Math.floor(Number(a.escolhasPendentes) || 0)),
      liberadasPorNivel100: sanitizarMapaSeguro(a.liberadasPorNivel100, 120, 'bool'),
    };
  }

  if (idle.torres && typeof idle.torres === 'object') {
    const t = idle.torres;
    const elementais = {};
    if (t.elementais && typeof t.elementais === 'object') {
      for (const [id, v] of Object.entries(t.elementais).slice(0, 12)) {
        if (v && typeof v === 'object') {
          elementais[String(id).slice(0, 24)] = {
            maiorAndar: Math.max(0, Math.min(50, Math.floor(Number(v.maiorAndar) || 0))),
            pagas: sanitizarMapaSeguro(v.pagas, 60, 'bool'),
          };
        }
      }
    }
    const unicas = {};
    if (t.unicas && typeof t.unicas === 'object') {
      for (const [id, v] of Object.entries(t.unicas).slice(0, 8)) {
        if (v && typeof v === 'object') {
          unicas[String(id).slice(0, 24)] = { maiorAndar: Math.max(0, Math.min(30, Math.floor(Number(v.maiorAndar) || 0))) };
        }
      }
    }
    const unicasDiarias = {};
    if (t.unicasDiarias && typeof t.unicasDiarias === 'object') {
      for (const [id, v] of Object.entries(t.unicasDiarias).slice(0, 8)) {
        if (v && typeof v === 'object') unicasDiarias[String(id).slice(0, 24)] = sanitizarMapaSeguro(v, 35, 'int');
      }
    }
    out.torres = {
      elementais,
      treinoDiario: {
        dia: Math.max(0, Math.floor(Number(t.treinoDiario?.dia) || 0)),
        usos: Math.max(0, Math.min(10, Math.floor(Number(t.treinoDiario?.usos) || 0))),
      },
      unicas,
      unicasDiarias,
      batalhasPagas: sanitizarMapaSeguro(t.batalhasPagas, 300, 'bool'),
    };
  }

  if (isObj(idle.calaboucos)) {
    const c = idle.calaboucos;
    out.calaboucos = {
      maiorNivel: sanitizarMapaSeguro(c.maiorNivel, 12, 'int'),
      todosVivos: sanitizarMapaSeguro(c.todosVivos, 120, 'bool'),
      moedas: Math.max(0, Math.floor(Number(c.moedas) || 0)),
      batalhasPagas: sanitizarMapaSeguro(c.batalhasPagas, 300, 'bool'),
    };
  }

  if (isObj(idle.domadores)) {
    const d = idle.domadores;
    const progresso = {};
    if (isObj(d.progresso)) {
      for (const [id, v] of Object.entries(d.progresso).slice(0, 12)) {
        if (isObj(v)) {
          progresso[String(id).slice(0, 24)] = {
            nivel: Math.max(1, Math.min(100, Math.floor(Number(v.nivel) || 1))),
            xp: Math.max(0, Math.floor(Number(v.xp) || 0)),
          };
        }
      }
    }
    const desbloqueados = sanitizarMapaSeguro(d.desbloqueados, 12, 'bool');
    desbloqueados.azazel = true;
    const ativo = typeof d.ativo === 'string' && d.ativo.slice(0, 24) || 'azazel';
    out.domadores = {
      ativo: desbloqueados[ativo] ? ativo : 'azazel',
      desbloqueados,
      progresso,
      eventosPagos: sanitizarMapaSeguro(d.eventosPagos, 300, 'bool'),
    };
  }

  if (isObj(idle.missoesRotacao)) {
    const r = idle.missoesRotacao;
    const dia = isObj(r.diaria) ? r.diaria : {};
    const sem = isObj(r.semanal) ? r.semanal : {};
    out.missoesRotacao = {
      diaria: {
        dia: Math.max(0, Math.floor(Number(dia.dia) || 0)),
        progresso: sanitizarMapaSeguro(dia.progresso, 24, 'int'),
        coletadas: sanitizarMapaSeguro(dia.coletadas, 24, 'bool'),
        bauColetado: Boolean(dia.bauColetado),
      },
      semanal: {
        semana: Math.max(0, Math.floor(Number(sem.semana) || 0)),
        progresso: sanitizarMapaSeguro(sem.progresso, 24, 'int'),
        coletadas: sanitizarMapaSeguro(sem.coletadas, 24, 'bool'),
        bauColetado: Boolean(sem.bauColetado),
      },
    };
  }

  return out;
}

export function serializarEstado(estado) {
  return JSON.stringify(estado);
}

export function desserializarEstado(texto) {
  const base = criarEstadoInicial();
  if (!texto) return base;
  try {
    const salvo = JSON.parse(texto);
    if (!salvo || typeof salvo !== 'object') return base;
    if (typeof salvo.mapaAtual === 'string') base.mapaAtual = salvo.mapaAtual;
    if (Array.isArray(salvo.posicaoPx) && salvo.posicaoPx.length === 2) base.posicaoPx = salvo.posicaoPx;
    if (salvo.forma === 'azazel' || salvo.forma === 'noctarn') base.forma = salvo.forma;
    if (salvo.teleportes && typeof salvo.teleportes === 'object') {
      for (const id of Object.keys(base.teleportes)) {
        if (salvo.teleportes[id]) {
          base.teleportes[id] = {
            descoberto: Boolean(salvo.teleportes[id].descoberto),
            ativo: Boolean(salvo.teleportes[id].ativo),
          };
        }
      }
    }
    if (salvo.quests && typeof salvo.quests === 'object') {
      for (const id of Object.keys(base.quests)) {
        if (['bloqueada', 'disponivel', 'ativa', 'concluida'].includes(salvo.quests[id])) {
          base.quests[id] = salvo.quests[id];
        }
      }
    }
    if (salvo.pistas && typeof salvo.pistas === 'object') {
      base.pistas = { ...salvo.pistas };
    }
    if (salvo.bossesDerrotados && typeof salvo.bossesDerrotados === 'object') {
      for (const id of Object.keys(base.bossesDerrotados)) {
        base.bossesDerrotados[id] = Boolean(salvo.bossesDerrotados[id]);
      }
    }
    base.tremLiberado = Boolean(salvo.tremLiberado);
    base.viagemTremConcluida = Boolean(salvo.viagemTremConcluida);
    if (salvo.desbloqueios && typeof salvo.desbloqueios === 'object') {
      base.desbloqueios.fazenda = Boolean(salvo.desbloqueios.fazenda);
      base.desbloqueios.corrida = Boolean(salvo.desbloqueios.corrida);
    }
    if (salvo.recompensas && typeof salvo.recompensas === 'object') {
      base.recompensas.gold = Number(salvo.recompensas.gold) || 0;
      base.recompensas.diamantes = Number(salvo.recompensas.diamantes) || 0;
      base.recompensas.xp = Number(salvo.recompensas.xp) || 0;
    }
    if (salvo.regioes && typeof salvo.regioes === 'object') {
      const reg = salvo.regioes;
      if (typeof reg.atual === 'string' && /^r([1-9]|1[0-2])$/.test(reg.atual)) {
        base.regioes.atual = reg.atual;
      }
      const copiarBoolMap = (src) => {
        const out = {};
        if (src && typeof src === 'object') {
          for (const [k, v] of Object.entries(src).slice(0, 100)) {
            if (v) out[String(k).slice(0, 64)] = true;
          }
        }
        return out;
      };
      base.regioes.chefesDerrotados = copiarBoolMap(reg.chefesDerrotados);
      base.regioes.primeiraVitoria = copiarBoolMap(reg.primeiraVitoria);
      base.regioes.pistas = copiarBoolMap(reg.pistas);
      if (reg.missoes && typeof reg.missoes === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(reg.missoes).slice(0, 100)) {
          if (['disponivel', 'ativa', 'concluida'].includes(v)) out[String(k).slice(0, 64)] = v;
        }
        base.regioes.missoes = out;
      }
      base.regioes.progressoMissoes = sanitizarMapaSeguro(reg.progressoMissoes, 120, 'int');
      base.regioes.abatesR2 = Math.max(0, Math.floor(Number(reg.abatesR2) || 0));
    }
    if (base.tremLiberado || (base.bossesDerrotados.BOSS_E && base.bossesDerrotados.BOSS_D)) {
      base.regioes.chefesDerrotados.r1 = true;
    }
    if (salvo.idle && typeof salvo.idle === 'object') {
      base.idle = sanitizarIdleProgressao(salvo.idle);
    }
    // conta da versão pública: inicial escolhido, concessão do bônus e validade do VIP
    if (salvo.conta && typeof salvo.conta === 'object') {
      const c = salvo.conta;
      base.conta = { uid: typeof c.uid === 'string' ? c.uid : undefined, inicial: typeof c.inicial === 'string' ? c.inicial : undefined, bonusEm: Number(c.bonusEm) || undefined, vipAte: Number(c.vipAte) || undefined };
    }
    return base;
  } catch {
    return base;
  }
}
