// Dados do ciclo jogável de C1 (Cidade). Só dados: as regras ficam em regiao1-ciclo.js e valem para qualquer região.
// Posições em pixels do mapa (1024x571), escolhidas no piso livre de C1, longe de saídas, NPCs, pistas e monstros.
// `arte`: { sis, vaga } aponta para assets/confusion/interface/mundo/<sis>/<vaga>.webp (sem o arquivo, aparece um polígono).
export const CICLO_C1 = {
  id: 'c1',
  mapa: 'C1',
  titulo: 'Cidade (C1)',

  // 1) Coleta: toras espalhadas pelo mapa, que reaparecem depois de um tempo
  coleta: {
    rotulo: 'Madeira',
    icone: '🪵',
    arte: { sis: '10', vaga: 'madeira' },
    tam: 3.4,
    pontos: [[318, 294], [426, 432], [576, 456], [720, 318], [618, 210], [342, 228]],
    porPonto: 2,
    capacidade: 12,
    recarregaMs: 60000,
  },

  // 2) Obra: o canteiro recebe a madeira; completa, a vila muda de aparência
  obra: {
    local: [768, 270],
    custo: 12,
    tam: 11,
    antes: { arte: { sis: '01', vaga: 'vila-ruinas' }, rotulo: 'Reconstruir a vila' },
    depois: { arte: { sis: '01', vaga: 'vila-saudavel' }, rotulo: 'Vila reconstruída' },
    recompensa: { gold: 30, diamantes: 3 },
    // efeito no sistema 01 (Cidades vivas): a vila do norte ganha prosperidade
    mundo: { sistema: '01', chave: 'norte', prosperidade: 20 },
    textoFim: 'Os últimos troncos foram postos. As casas ganharam telhado e a praça já tem gente voltando.',
  },

  // 3) Investigação curta: começa numa conversa e termina entregando uma pista achada no mapa
  investigacao: {
    npcInicio: 'npc_mensageiro_c1',
    npcEntrega: 'npc_mensageiro_c1',
    pista: {
      local: [258, 306],
      tam: 3.6,
      arte: { sis: '09', vaga: 'pista-1' },
      rotulo: 'Pacote perdido',
      texto: 'Um pacote embrulhado em papel pardo, com o selo do mestre cartógrafo. Estava caído ao lado do caminho de pedra.',
    },
    recompensa: { gold: 40, diamantes: 5 },
  },

  // 4) Rotina compartilhada: de dia cada um fica no seu posto (o do mapa); à noite os três se reúnem na praça
  rotina: {
    npcs: ['npc_zeladora_c1', 'npc_mensageiro_c1', 'npc_jardineira_c1'],
    noite: {
      npc_zeladora_c1: [472, 328],
      npc_mensageiro_c1: [544, 334],
      npc_jardineira_c1: [592, 310],
    },
  },

  // 5) Falas que mudam. A primeira entrada que casa com o estado vence; `se` compara com { invest, obra }.
  //    `acao`: 'iniciar' começa a investigação; 'entregar' entrega a pista.
  falas: {
    npc_mensageiro_c1: [
      {
        se: { invest: 'nova' },
        falas: [
          'Ah, ainda bem que é você! Perdi o pacote do mestre cartógrafo hoje cedo. Passei pela praça com pressa e, quando vi, já não estava mais comigo.',
          'Acho que caiu perto do lado oeste da cidade, onde o caminho de pedra termina. Se você achar, eu dou o que puder como recompensa.',
        ],
        acao: 'iniciar', rotuloAcao: 'Procurar o pacote',
      },
      { se: { invest: 'ativa' }, falas: ['Achou o pacote? Eu juro que estava na minha bolsa. Procure no lado oeste da cidade, perto do fim do caminho de pedra.'] },
      {
        se: { invest: 'pista' },
        falas: ['É o pacote do mestre! Está intacto. Você não imagina o peso que tirou das minhas costas.'],
        acao: 'entregar', rotuloAcao: 'Entregar o pacote',
      },
      { se: { invest: 'concluida', obra: true }, falas: ['Obrigado de novo pelo pacote. E olha só a vila! Agora até os meus atalhos têm cheiro de tinta fresca.'] },
      { se: { invest: 'concluida' }, falas: ['Obrigado pelo pacote! O mestre cartógrafo me deu bronca e depois me perdoou. Vou prestar mais atenção por onde ando.'] },
    ],
    npc_zeladora_c1: [
      {
        se: { obra: true },
        falas: [
          'Faz anos que não vejo a praça assim. A vila nova trouxe gente de volta, e até o cristal parece mais firme.',
          'Obrigada por carregar aquela madeira. Se a cidade continuar crescendo, vai precisar de novos guardas.',
        ],
      },
    ],
    npc_jardineira_c1: [
      {
        se: { obra: true },
        falas: [
          'As casas novas deram sombra para o canteiro. Minha avó teria gostado de ver o alecrim crescer ao lado de uma parede pintada.',
          'Se precisar de algo da horta, é só pedir.',
        ],
      },
    ],
  },
};
