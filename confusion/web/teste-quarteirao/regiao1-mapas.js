// Registro completo das 48 áreas da Região 1 (referência 1024x571 px por mapa).
// Segue rigorosamente MAPA-REGIAO-1.png, MANIFESTO.txt e as pranchas BORDAS-*.jpg.

export const IMG_W = 1024;
export const IMG_H = 571;
export const MAPA_INICIAL = 'C0';

const P = 'assets/regiao1/';

// Retângulos padrão de borda (alinhados ao piso caminhável das pranchas BORDAS)
const R_N = [445, 0, 579, 54];
const R_S = [445, 517, 579, 571];
const R_O = [0, 230, 56, 355];
const R_L = [968, 230, 1024, 355];

// Pontos de chegada recuados para dentro do piso, fora dos gatilhos de retorno
const IN_N = [512, 98];
const IN_S = [512, 472];
const IN_O = [104, 292];
const IN_L = [920, 292];

function mapaBase(id, nome, bioma, opcoes = {}) {
  return {
    id,
    nome,
    bioma,
    arte: `${P}${id}.webp`,
    arteAtivo: opcoes.arteAtivo ? `${P}${opcoes.arteAtivo}` : null,
    mascara: `${P}${id}-walkmask.png`,
    spawnPadrao: opcoes.spawnPadrao || [512, 290],
    marco: opcoes.marco || null,
    arteProvisoria: Boolean(opcoes.arteProvisoria),
    saidas: opcoes.saidas || [],
  };
}

export const MAPAS = {
  // ==================== EIXO CENTRAL (5 áreas) ====================
  C0: mapaBase('C0', 'Praia Inicial', 'Eixo Central', {
    spawnPadrao: [512, 340],
    saidas: [
      { id: 'N', rotulo: 'C1 · Cidade', borda: 'norte', rect: [460, 0, 560, 48], destino: 'C1', chegada: [512, 495] },
      { id: 'O', rotulo: 'E1 · Praia Oeste', borda: 'oeste', rect: [0, 170, 46, 410], destino: 'E1', chegada: [930, 385] },
      { id: 'L', rotulo: 'D1 · Praia Leste', borda: 'leste', rect: [976, 175, 1024, 265], destino: 'D1', chegada: [92, 365] },
    ],
  }),

  C1: mapaBase('C1', 'Cidade', 'Eixo Central', {
    spawnPadrao: [512, 315],
    // Preparado para receber C1-ativo.webp quando a variante definitiva estiver pronta
    marco: { id: 'C1', pos: [512, 226], interacao: [512, 268], raio: 62, usarOverlayCristal: true },
    saidas: [
      { id: 'S', rotulo: 'C0 · Praia Inicial', borda: 'sul', rect: [445, 522, 575, 571], destino: 'C0', chegada: [512, 88] },
      { id: 'N', rotulo: 'C2 · Estrada Norte', borda: 'norte', rect: [450, 0, 565, 48], destino: 'C2', chegada: [512, 492] },
      { id: 'O', rotulo: 'E3 · Trilha da Cidade', borda: 'oeste', rect: [0, 235, 50, 335], destino: 'E3', chegada: [910, 295] },
      { id: 'L', rotulo: 'D3 · Entrada Leste', borda: 'leste', rect: [974, 235, 1024, 335], destino: 'D3', chegada: [110, 292] },
    ],
  }),

  C2: mapaBase('C2', 'Estrada Norte', 'Eixo Central', {
    spawnPadrao: [512, 305],
    saidas: [
      { id: 'S', rotulo: 'C1 · Cidade', borda: 'sul', rect: [445, 522, 580, 571], destino: 'C1', chegada: [512, 86] },
      { id: 'N', rotulo: 'C3 · Estação', borda: 'norte', rect: [445, 0, 575, 48], destino: 'C3', chegada: [512, 495] },
    ],
  }),

  C3: mapaBase('C3', 'Estação', 'Eixo Central', {
    spawnPadrao: [512, 410],
    saidas: [
      { id: 'S', rotulo: 'C2 · Estrada Norte', borda: 'sul', rect: [425, 522, 595, 571], destino: 'C2', chegada: [512, 86] },
      { id: 'TREM', rotulo: '🚂 Trem → Reino', borda: 'norte', tipo: 'trem', rect: [540, 185, 635, 232], destino: 'REINO', chegada: [230, 290] },
    ],
  }),

  REINO: mapaBase('REINO', 'Praça Real (Reino)', 'Eixo Central', {
    spawnPadrao: [512, 320],
    arteProvisoria: true,
    marco: { id: 'REINO', pos: [735, 240], interacao: [650, 275], raio: 72 },
    saidas: [
      { id: 'TREM_VOLTA', rotulo: '🚂 Trem → C3 Estação', borda: 'oeste', tipo: 'trem_volta', rect: [85, 210, 180, 370], destino: 'C3', chegada: [512, 320] },
    ],
  }),

  // ==================== FLORESTA SOMBRIA (10 áreas) ====================
  E1: mapaBase('E1', 'Praia Oeste', 'Floresta Sombria', {
    spawnPadrao: [640, 360],
    saidas: [
      { id: 'L', rotulo: 'C0 · Praia Inicial', borda: 'leste', rect: [974, 260, 1024, 460], destino: 'C0', chegada: [110, 240] },
      { id: 'N', rotulo: 'E3 · Trilha da Cidade', borda: 'norte', rect: [450, 0, 575, 52], destino: 'E3', chegada: [512, 485] },
      { id: 'O', rotulo: 'E2 · Ponta Oeste', borda: 'oeste', rect: [0, 235, 52, 330], destino: 'E2', chegada: [915, 345] },
      { id: 'NO', rotulo: 'E4 · Portal da Floresta', borda: 'noroeste', tipo: 'arco', rect: [185, 130, 260, 215], destino: 'E4', chegada: [765, 412] },
    ],
  }),

  E3: mapaBase('E3', 'Trilha da Cidade', 'Floresta Sombria', {
    spawnPadrao: [512, 315],
    saidas: [
      { id: 'S', rotulo: 'E1 · Praia Oeste', borda: 'sul', rect: R_S, destino: 'E1', chegada: [512, 92] },
      { id: 'L', rotulo: 'C1 · Cidade', borda: 'leste', rect: [965, 240, 1024, 355], destino: 'C1', chegada: [96, 285] },
    ],
  }),

  E4: mapaBase('E4', 'Portal da Floresta', 'Floresta Sombria', {
    spawnPadrao: [512, 285],
    saidas: [
      { id: 'SE', rotulo: 'E1 · Praia Oeste (Arco)', borda: 'sudeste', tipo: 'arco', rect: [815, 410, 945, 525], destino: 'E1', chegada: [275, 255] },
      { id: 'N', rotulo: 'E5 · Encruzilhada', borda: 'norte', rect: R_N, destino: 'E5', chegada: IN_S },
    ],
  }),

  E5: mapaBase('E5', 'Encruzilhada', 'Floresta Sombria', {
    spawnPadrao: [512, 290],
    saidas: [
      { id: 'S', rotulo: 'E4 · Portal da Floresta', borda: 'sul', rect: R_S, destino: 'E4', chegada: IN_N },
      { id: 'N', rotulo: 'E6 · Curva Alta', borda: 'norte', rect: R_N, destino: 'E6', chegada: IN_S },
      { id: 'O', rotulo: 'E8 · Raízes Negras', borda: 'oeste', rect: R_O, destino: 'E8', chegada: IN_L },
    ],
  }),

  E6: mapaBase('E6', 'Curva Alta', 'Floresta Sombria', {
    spawnPadrao: [460, 320],
    saidas: [
      { id: 'S', rotulo: 'E5 · Encruzilhada', borda: 'sul', rect: R_S, destino: 'E5', chegada: IN_N },
      { id: 'O', rotulo: 'E9 · Bosque de Névoa', borda: 'oeste', rect: R_O, destino: 'E9', chegada: IN_L },
    ],
  }),

  E7: mapaBase('E7', 'Clareira Oculta', 'Floresta Sombria', {
    spawnPadrao: [512, 290],
    saidas: [
      { id: 'N', rotulo: 'E8 · Raízes Negras', borda: 'norte', rect: R_N, destino: 'E8', chegada: IN_S },
    ],
  }),

  E8: mapaBase('E8', 'Raízes Negras', 'Floresta Sombria', {
    spawnPadrao: [512, 320],
    arteAtivo: 'E8-ativo.webp',
    marco: { id: 'E8', pos: [655, 240], interacao: [560, 295], raio: 88 },
    saidas: [
      { id: 'L', rotulo: 'E5 · Encruzilhada', borda: 'leste', rect: R_L, destino: 'E5', chegada: IN_O },
      { id: 'S', rotulo: 'E7 · Clareira Oculta', borda: 'sul', rect: R_S, destino: 'E7', chegada: IN_N },
      { id: 'N', rotulo: 'E9 · Bosque de Névoa', borda: 'norte', rect: R_N, destino: 'E9', chegada: IN_S },
    ],
  }),

  E9: mapaBase('E9', 'Bosque de Névoa', 'Floresta Sombria', {
    spawnPadrao: [512, 300],
    saidas: [
      { id: 'S', rotulo: 'E8 · Raízes Negras', borda: 'sul', rect: R_S, destino: 'E8', chegada: IN_N },
      { id: 'L', rotulo: 'E6 · Curva Alta', borda: 'leste', rect: R_L, destino: 'E6', chegada: IN_O },
      { id: 'N', rotulo: 'E10 · Antecâmara', borda: 'norte', rect: R_N, destino: 'E10', chegada: IN_S },
    ],
  }),

  E10: mapaBase('E10', 'Antecâmara', 'Floresta Sombria', {
    spawnPadrao: [512, 310],
    saidas: [
      { id: 'S', rotulo: 'E9 · Bosque de Névoa', borda: 'sul', rect: R_S, destino: 'E9', chegada: IN_N },
      { id: 'O', rotulo: 'BOSS_E · Espírito da Floresta', borda: 'oeste', tipo: 'arco', rect: [0, 220, 65, 350], destino: 'BOSS_E', chegada: [765, 305] },
    ],
  }),

  BOSS_E: mapaBase('BOSS_E', 'Arena · Espírito da Floresta', 'Floresta Sombria', {
    spawnPadrao: [680, 305],
    saidas: [
      { id: 'L', rotulo: 'E10 · Antecâmara', borda: 'leste', tipo: 'arco', rect: [875, 240, 1024, 370], destino: 'E10', chegada: [115, 285] },
    ],
  }),

  // ==================== PRAIAS CRISTALINAS (11 áreas) ====================
  E2: mapaBase('E2', 'Ponta Oeste', 'Praias Cristalinas', {
    spawnPadrao: [512, 345],
    saidas: [
      { id: 'L', rotulo: 'E1 · Praia Oeste', borda: 'leste', rect: [965, 265, 1024, 435], destino: 'E1', chegada: [96, 285] },
      { id: 'O', rotulo: 'PC1 · Praia do Promontório', borda: 'oeste', rect: [0, 265, 58, 435], destino: 'PC1', chegada: [905, 360] },
    ],
  }),

  PC1: mapaBase('PC1', 'Praia do Promontório', 'Praias Cristalinas', {
    spawnPadrao: [560, 360],
    saidas: [
      { id: 'L', rotulo: 'E2 · Ponta Oeste', borda: 'leste', rect: [965, 275, 1024, 445], destino: 'E2', chegada: [110, 345] },
      { id: 'S', rotulo: 'PC2 · Bancos de Maré', borda: 'sul', rect: [450, 505, 575, 571], destino: 'PC2', chegada: [512, 108] },
    ],
  }),

  PC2: mapaBase('PC2', 'Bancos de Maré', 'Praias Cristalinas', {
    spawnPadrao: [512, 290],
    saidas: [
      { id: 'N', rotulo: 'PC1 · Praia do Promontório', borda: 'norte', rect: [450, 0, 575, 62], destino: 'PC1', chegada: [512, 455] },
      { id: 'S', rotulo: 'PC3 · Ilhas de Calcário', borda: 'sul', rect: R_S, destino: 'PC3', chegada: IN_N },
    ],
  }),

  PC3: mapaBase('PC3', 'Ilhas de Calcário', 'Praias Cristalinas', {
    spawnPadrao: [512, 290],
    saidas: [
      { id: 'N', rotulo: 'PC2 · Bancos de Maré', borda: 'norte', rect: R_N, destino: 'PC2', chegada: IN_S },
      { id: 'S', rotulo: 'PC4 · Lagoa Cristalina', borda: 'sul', rect: R_S, destino: 'PC4', chegada: IN_N },
    ],
  }),

  PC4: mapaBase('PC4', 'Lagoa Cristalina', 'Praias Cristalinas', {
    spawnPadrao: [305, 305],
    saidas: [
      { id: 'N', rotulo: 'PC3 · Ilhas de Calcário', borda: 'norte', rect: R_N, destino: 'PC3', chegada: IN_S },
      { id: 'S', rotulo: 'PC5 · Recife das Marés', borda: 'sul', rect: R_S, destino: 'PC5', chegada: IN_N },
    ],
  }),

  PC5: mapaBase('PC5', 'Recife das Marés', 'Praias Cristalinas', {
    spawnPadrao: [512, 290],
    saidas: [
      { id: 'N', rotulo: 'PC4 · Lagoa Cristalina', borda: 'norte', rect: R_N, destino: 'PC4', chegada: IN_S },
      { id: 'S', rotulo: 'PC6 · Boca da Gruta', borda: 'sul', rect: R_S, destino: 'PC6', chegada: IN_N },
    ],
  }),

  PC6: mapaBase('PC6', 'Boca da Gruta', 'Praias Cristalinas', {
    spawnPadrao: [512, 305],
    saidas: [
      { id: 'N', rotulo: 'PC5 · Recife das Marés', borda: 'norte', rect: R_N, destino: 'PC5', chegada: IN_S },
      { id: 'S', rotulo: 'PC7 · Terraços do Recife', borda: 'sul', rect: R_S, destino: 'PC7', chegada: IN_N },
      { id: 'O', rotulo: 'CC1 · Caverna Cintilante', borda: 'oeste', tipo: 'arco', rect: [0, 235, 118, 355], destino: 'CC1', chegada: [785, 290] },
    ],
  }),

  PC7: mapaBase('PC7', 'Terraços do Recife', 'Praias Cristalinas', {
    spawnPadrao: [512, 300],
    arteAtivo: 'PC7-ativo.webp',
    marco: { id: 'PC7', pos: [745, 275], interacao: [635, 315], raio: 92 },
    saidas: [
      { id: 'N', rotulo: 'PC6 · Boca da Gruta', borda: 'norte', rect: R_N, destino: 'PC6', chegada: IN_S },
      { id: 'S', rotulo: 'PC8 · Galeria das Marés', borda: 'sul', rect: R_S, destino: 'PC8', chegada: IN_N },
    ],
  }),

  PC8: mapaBase('PC8', 'Galeria das Marés', 'Praias Cristalinas', {
    spawnPadrao: [512, 290],
    saidas: [
      { id: 'N', rotulo: 'PC7 · Terraços do Recife', borda: 'norte', rect: R_N, destino: 'PC7', chegada: IN_S },
      { id: 'S', rotulo: 'PC9 · Vestíbulo da Siren', borda: 'sul', rect: R_S, destino: 'PC9', chegada: IN_N },
    ],
  }),

  PC9: mapaBase('PC9', 'Vestíbulo da Siren', 'Praias Cristalinas', {
    spawnPadrao: [512, 290],
    saidas: [
      { id: 'N', rotulo: 'PC8 · Galeria das Marés', borda: 'norte', rect: R_N, destino: 'PC8', chegada: IN_S },
      { id: 'S', rotulo: 'BOSS_S · Arena da Siren', borda: 'sul', rect: R_S, destino: 'BOSS_S', chegada: [512, 130] },
    ],
  }),

  BOSS_S: mapaBase('BOSS_S', 'Arena · Siren', 'Praias Cristalinas', {
    spawnPadrao: [512, 175],
    saidas: [
      { id: 'N', rotulo: 'PC9 · Vestíbulo da Siren', borda: 'norte', rect: [445, 0, 580, 74], destino: 'PC9', chegada: IN_S },
    ],
  }),

  // ==================== CAVERNA CINTILANTE (10 áreas) ====================
  CC1: mapaBase('CC1', 'Caverna Cintilante', 'Caverna Cintilante', {
    spawnPadrao: [512, 290],
    saidas: [
      { id: 'L', rotulo: 'PC6 · Boca da Gruta', borda: 'leste', tipo: 'arco', rect: [895, 220, 1024, 355], destino: 'PC6', chegada: [200, 315] },
      { id: 'S', rotulo: 'CC2 · Vestíbulo de Cristal', borda: 'sul', rect: R_S, destino: 'CC2', chegada: IN_N },
    ],
  }),

  CC2: mapaBase('CC2', 'Vestíbulo de Cristal', 'Caverna Cintilante', {
    spawnPadrao: [512, 290],
    saidas: [
      { id: 'N', rotulo: 'CC1 · Caverna Cintilante', borda: 'norte', rect: R_N, destino: 'CC1', chegada: IN_S },
      { id: 'S', rotulo: 'CC3 · Salão de Quartzo', borda: 'sul', rect: R_S, destino: 'CC3', chegada: IN_N },
    ],
  }),

  CC3: mapaBase('CC3', 'Salão de Quartzo', 'Caverna Cintilante', {
    spawnPadrao: [512, 290],
    saidas: [
      { id: 'N', rotulo: 'CC2 · Vestíbulo de Cristal', borda: 'norte', rect: R_N, destino: 'CC2', chegada: IN_S },
      { id: 'S', rotulo: 'CC4 · Terraços Luminosos', borda: 'sul', rect: R_S, destino: 'CC4', chegada: IN_N },
    ],
  }),

  CC4: mapaBase('CC4', 'Terraços Luminosos', 'Caverna Cintilante', {
    spawnPadrao: [512, 290],
    saidas: [
      { id: 'N', rotulo: 'CC3 · Salão de Quartzo', borda: 'norte', rect: R_N, destino: 'CC3', chegada: IN_S },
      { id: 'S', rotulo: 'CC5 · Pedreira Escura', borda: 'sul', rect: R_S, destino: 'CC5', chegada: IN_N },
    ],
  }),

  CC5: mapaBase('CC5', 'Pedreira Escura', 'Caverna Cintilante', {
    spawnPadrao: [512, 290],
    saidas: [
      { id: 'N', rotulo: 'CC4 · Terraços Luminosos', borda: 'norte', rect: R_N, destino: 'CC4', chegada: IN_S },
      { id: 'S', rotulo: 'CC6 · Fenda de Cristal', borda: 'sul', rect: R_S, destino: 'CC6', chegada: IN_N },
    ],
  }),

  CC6: mapaBase('CC6', 'Fenda de Cristal', 'Caverna Cintilante', {
    spawnPadrao: [512, 290],
    saidas: [
      { id: 'N', rotulo: 'CC5 · Pedreira Escura', borda: 'norte', rect: R_N, destino: 'CC5', chegada: IN_S },
      { id: 'S', rotulo: 'CC7 · Salão dos Ecos', borda: 'sul', rect: R_S, destino: 'CC7', chegada: IN_N },
    ],
  }),

  CC7: mapaBase('CC7', 'Salão dos Ecos', 'Caverna Cintilante', {
    spawnPadrao: [512, 290],
    arteAtivo: 'CC7-ativo.webp',
    marco: { id: 'CC7', pos: [800, 300], interacao: [675, 315], raio: 95 },
    saidas: [
      { id: 'N', rotulo: 'CC6 · Fenda de Cristal', borda: 'norte', rect: R_N, destino: 'CC6', chegada: IN_S },
      { id: 'S', rotulo: 'CC8 · Galeria de Ametista', borda: 'sul', rect: R_S, destino: 'CC8', chegada: IN_N },
    ],
  }),

  CC8: mapaBase('CC8', 'Galeria de Ametista', 'Caverna Cintilante', {
    spawnPadrao: [512, 290],
    saidas: [
      { id: 'N', rotulo: 'CC7 · Salão dos Ecos', borda: 'norte', rect: R_N, destino: 'CC7', chegada: IN_S },
      { id: 'S', rotulo: 'CC9 · Portal do Golem', borda: 'sul', rect: R_S, destino: 'CC9', chegada: IN_N },
    ],
  }),

  CC9: mapaBase('CC9', 'Portal do Golem', 'Caverna Cintilante', {
    spawnPadrao: [512, 290],
    saidas: [
      { id: 'N', rotulo: 'CC8 · Galeria de Ametista', borda: 'norte', rect: R_N, destino: 'CC8', chegada: IN_S },
      { id: 'S', rotulo: 'BOSS_C · Golem de Ametista', borda: 'sul', tipo: 'arco', rect: R_S, destino: 'BOSS_C', chegada: [512, 140] },
    ],
  }),

  BOSS_C: mapaBase('BOSS_C', 'Arena · Golem de Ametista', 'Caverna Cintilante', {
    spawnPadrao: [512, 185],
    saidas: [
      { id: 'N', rotulo: 'CC9 · Portal do Golem', borda: 'norte', tipo: 'arco', rect: [450, 0, 575, 84], destino: 'CC9', chegada: IN_S },
    ],
  }),

  // ==================== FLORESTA DE COGUMELOS (12 áreas) ====================
  D1: mapaBase('D1', 'Praia Leste', 'Floresta de Cogumelos', {
    spawnPadrao: [420, 365],
    saidas: [
      { id: 'O', rotulo: 'C0 · Praia Inicial', borda: 'oeste', rect: [0, 260, 50, 455], destino: 'C0', chegada: [890, 225] },
      { id: 'N', rotulo: 'D3 · Entrada Leste', borda: 'norte', rect: [445, 0, 560, 54], destino: 'D3', chegada: IN_S },
      { id: 'L', rotulo: 'D2 · Selva Costeira', borda: 'leste', rect: [970, 275, 1024, 385], destino: 'D2', chegada: [110, 355] },
    ],
  }),

  D2: mapaBase('D2', 'Selva Costeira', 'Floresta de Cogumelos', {
    spawnPadrao: [512, 315],
    saidas: [
      { id: 'O', rotulo: 'D1 · Praia Leste', borda: 'oeste', rect: [0, 295, 58, 415], destino: 'D1', chegada: [905, 330] },
      { id: 'N', rotulo: 'D4 · Encruzilhada', borda: 'norte', rect: R_N, destino: 'D4', chegada: IN_S },
    ],
  }),

  D3: mapaBase('D3', 'Entrada Leste', 'Floresta de Cogumelos', {
    spawnPadrao: [512, 295],
    saidas: [
      { id: 'O', rotulo: 'C1 · Cidade', borda: 'oeste', rect: R_O, destino: 'C1', chegada: [915, 285] },
      { id: 'S', rotulo: 'D1 · Praia Leste', borda: 'sul', rect: R_S, destino: 'D1', chegada: [500, 96] },
      { id: 'N', rotulo: 'D6 · Bosque Noroeste', borda: 'norte', rect: R_N, destino: 'D6', chegada: IN_S },
      { id: 'L', rotulo: 'D4 · Encruzilhada', borda: 'leste', rect: R_L, destino: 'D4', chegada: IN_O },
    ],
  }),

  D4: mapaBase('D4', 'Encruzilhada', 'Floresta de Cogumelos', {
    spawnPadrao: [512, 290],
    saidas: [
      { id: 'O', rotulo: 'D3 · Entrada Leste', borda: 'oeste', rect: R_O, destino: 'D3', chegada: IN_L },
      { id: 'S', rotulo: 'D2 · Selva Costeira', borda: 'sul', rect: R_S, destino: 'D2', chegada: IN_N },
      { id: 'N', rotulo: 'D7 · Cogumelos Gigantes', borda: 'norte', rect: R_N, destino: 'D7', chegada: IN_S },
      { id: 'L', rotulo: 'D5 · Curva dos Insetos', borda: 'leste', rect: R_L, destino: 'D5', chegada: IN_O },
    ],
  }),

  D5: mapaBase('D5', 'Curva dos Insetos', 'Floresta de Cogumelos', {
    spawnPadrao: [512, 295],
    saidas: [
      { id: 'O', rotulo: 'D4 · Encruzilhada', borda: 'oeste', rect: R_O, destino: 'D4', chegada: IN_L },
      { id: 'N', rotulo: 'D8 · Telas e Esporos', borda: 'norte', rect: R_N, destino: 'D8', chegada: IN_S },
    ],
  }),

  D6: mapaBase('D6', 'Bosque Noroeste', 'Floresta de Cogumelos', {
    spawnPadrao: [512, 305],
    saidas: [
      { id: 'S', rotulo: 'D3 · Entrada Leste', borda: 'sul', rect: R_S, destino: 'D3', chegada: IN_N },
      { id: 'L', rotulo: 'D7 · Cogumelos Gigantes', borda: 'leste', rect: R_L, destino: 'D7', chegada: IN_O },
    ],
  }),

  D7: mapaBase('D7', 'Cogumelos Gigantes', 'Floresta de Cogumelos', {
    spawnPadrao: [512, 310],
    saidas: [
      { id: 'O', rotulo: 'D6 · Bosque Noroeste', borda: 'oeste', rect: R_O, destino: 'D6', chegada: IN_L },
      { id: 'S', rotulo: 'D4 · Encruzilhada', borda: 'sul', rect: R_S, destino: 'D4', chegada: IN_N },
      { id: 'L', rotulo: 'D8 · Telas e Esporos', borda: 'leste', rect: R_L, destino: 'D8', chegada: IN_O },
    ],
  }),

  D8: mapaBase('D8', 'Telas e Esporos', 'Floresta de Cogumelos', {
    spawnPadrao: [512, 310],
    saidas: [
      { id: 'O', rotulo: 'D7 · Cogumelos Gigantes', borda: 'oeste', rect: R_O, destino: 'D7', chegada: IN_L },
      { id: 'S', rotulo: 'D5 · Curva dos Insetos', borda: 'sul', rect: R_S, destino: 'D5', chegada: IN_N },
      { id: 'L', rotulo: 'D9 · Mirante Leste', borda: 'leste', rect: R_L, destino: 'D9', chegada: IN_O },
    ],
  }),

  D9: mapaBase('D9', 'Mirante Leste', 'Floresta de Cogumelos', {
    spawnPadrao: [512, 315],
    arteAtivo: 'D9-ativo.webp',
    marco: { id: 'D9', pos: [802, 235], interacao: [675, 295], raio: 95 },
    saidas: [
      { id: 'O', rotulo: 'D8 · Telas e Esporos', borda: 'oeste', rect: R_O, destino: 'D8', chegada: IN_L },
      { id: 'S', rotulo: 'D10 · Descida Rochosa', borda: 'sul', rect: R_S, destino: 'D10', chegada: IN_N },
    ],
  }),

  D10: mapaBase('D10', 'Descida Rochosa', 'Floresta de Cogumelos', {
    spawnPadrao: [512, 290],
    saidas: [
      { id: 'N', rotulo: 'D9 · Mirante Leste', borda: 'norte', rect: R_N, destino: 'D9', chegada: IN_S },
      { id: 'S', rotulo: 'D11 · Enseada', borda: 'sul', rect: R_S, destino: 'D11', chegada: IN_N },
    ],
  }),

  D11: mapaBase('D11', 'Enseada', 'Floresta de Cogumelos', {
    spawnPadrao: [512, 285],
    saidas: [
      { id: 'N', rotulo: 'D10 · Descida Rochosa', borda: 'norte', rect: R_N, destino: 'D10', chegada: IN_S },
      { id: 'S', rotulo: 'BOSS_D · Rei Fungo', borda: 'sul', tipo: 'arco', rect: [450, 495, 575, 571], destino: 'BOSS_D', chegada: [512, 150] },
    ],
  }),

  BOSS_D: mapaBase('BOSS_D', 'Arena · Rei Fungo', 'Floresta de Cogumelos', {
    spawnPadrao: [512, 185],
    saidas: [
      { id: 'N', rotulo: 'D11 · Enseada', borda: 'norte', tipo: 'arco', rect: [450, 0, 575, 86], destino: 'D11', chegada: [512, 445] },
    ],
  }),
};

export const ORDEM_MAPAS = [
  // Eixo Central
  'C0', 'C1', 'C2', 'C3', 'REINO',
  // Floresta Sombria
  'E1', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10', 'BOSS_E',
  // Praias Cristalinas
  'E2', 'PC1', 'PC2', 'PC3', 'PC4', 'PC5', 'PC6', 'PC7', 'PC8', 'PC9', 'BOSS_S',
  // Caverna Cintilante
  'CC1', 'CC2', 'CC3', 'CC4', 'CC5', 'CC6', 'CC7', 'CC8', 'CC9', 'BOSS_C',
  // Floresta de Cogumelos
  'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'BOSS_D',
];
