// Registro de mapas da Região 1 (escala de referência: 1024x571 px por mapa).
// Cada saída usa retângulo [x0, y0, x1, y1] em pixels da arte; destino=null indica mapa ainda não gerado.

export const IMG_W = 1024;
export const IMG_H = 571;
export const MAPA_INICIAL = 'C0';
export const ORDEM_MAPAS = ['C0', 'C1', 'C2', 'C3', 'E1', 'D1'];

const PASTA = 'assets/regiao1/';

export const MAPAS = {
  C0: {
    id: 'C0',
    nome: 'Praia Inicial',
    bioma: 'Costa',
    arte: PASTA + 'C0.webp',
    mascara: PASTA + 'C0-walkmask.png',
    spawnPadrao: [512, 340],
    saidas: [
      { id: 'N', rotulo: 'C1 · Cidade', borda: 'norte', rect: [460, 0, 560, 48], destino: 'C1', chegada: [512, 500] },
      { id: 'O', rotulo: 'E1 · Praia-Esquerda', borda: 'oeste', rect: [0, 170, 44, 410], destino: 'E1', chegada: [940, 385] },
      { id: 'L', rotulo: 'D1 · Praia-Direita', borda: 'leste', rect: [978, 175, 1024, 265], destino: 'D1', chegada: [82, 365] },
    ],
  },

  C1: {
    id: 'C1',
    nome: 'Cidade',
    bioma: 'Praça Central',
    arte: PASTA + 'C1.webp',
    mascara: PASTA + 'C1-walkmask.png',
    spawnPadrao: [512, 290],
    saidas: [
      { id: 'S', rotulo: 'C0 · Praia Inicial', borda: 'sul', rect: [445, 525, 575, 571], destino: 'C0', chegada: [512, 85] },
      { id: 'N', rotulo: 'C2 · Estrada Norte', borda: 'norte', rect: [450, 0, 565, 48], destino: 'C2', chegada: [512, 500] },
      { id: 'O', rotulo: 'E3 · Praia Oeste', borda: 'oeste', rect: [0, 235, 46, 330], destino: null },
      { id: 'L', rotulo: 'D3 · Praia Leste', borda: 'leste', rect: [978, 235, 1024, 330], destino: null },
    ],
  },

  C2: {
    id: 'C2',
    nome: 'Estrada Norte',
    bioma: 'Trilha da Floresta',
    arte: PASTA + 'C2.webp',
    mascara: PASTA + 'C2-walkmask.png',
    spawnPadrao: [512, 305],
    saidas: [
      { id: 'S', rotulo: 'C1 · Cidade', borda: 'sul', rect: [445, 525, 580, 571], destino: 'C1', chegada: [512, 82] },
      { id: 'N', rotulo: 'C3 · Estação do Trem', borda: 'norte', rect: [445, 0, 575, 48], destino: 'C3', chegada: [512, 500] },
    ],
  },

  C3: {
    id: 'C3',
    nome: 'Estação do Trem',
    bioma: 'Estação Ferroviária',
    arte: PASTA + 'C3.webp',
    mascara: PASTA + 'C3-walkmask.png',
    spawnPadrao: [512, 410],
    saidas: [
      { id: 'S', rotulo: 'C2 · Estrada Norte', borda: 'sul', rect: [425, 525, 595, 571], destino: 'C2', chegada: [512, 82] },
      {
        id: 'TREM',
        rotulo: '🚂 Trem para o Reino',
        borda: 'norte',
        tipo: 'trem',
        rect: [540, 185, 635, 232],
        destino: null,
        mensagem: '🚂 Trem bloqueado: derrote os 2 Chefes da Região 1 (Espírito da Floresta e Craquen) para liberar a viagem ao Reino.',
      },
    ],
  },

  E1: {
    id: 'E1',
    nome: 'Praia-Esquerda',
    bioma: 'Costa Oeste',
    arte: PASTA + 'E1.webp',
    mascara: PASTA + 'E1-walkmask.png',
    spawnPadrao: [640, 360],
    saidas: [
      { id: 'L', rotulo: 'C0 · Praia Inicial', borda: 'leste', rect: [976, 260, 1024, 460], destino: 'C0', chegada: [105, 240] },
      { id: 'N', rotulo: 'E3 · Praia Oeste', borda: 'norte', rect: [450, 0, 575, 52], destino: null },
      { id: 'O', rotulo: 'E2 · Ponta Oeste', borda: 'oeste', rect: [0, 235, 48, 320], destino: null },
      { id: 'NO', rotulo: 'E4 · Portal da Floresta Profunda', borda: 'noroeste', tipo: 'arco', rect: [185, 130, 260, 215], destino: null },
    ],
  },

  D1: {
    id: 'D1',
    nome: 'Praia-Direita',
    bioma: 'Costa Leste',
    arte: PASTA + 'D1.webp',
    mascara: PASTA + 'D1-walkmask.png',
    spawnPadrao: [420, 365],
    saidas: [
      { id: 'O', rotulo: 'C0 · Praia Inicial', borda: 'oeste', rect: [0, 260, 48, 455], destino: 'C0', chegada: [890, 225] },
      { id: 'N', rotulo: 'D3 · Praia Leste', borda: 'norte', rect: [445, 0, 560, 52], destino: null },
      { id: 'L', rotulo: 'D2 · Selva Costeira Leste', borda: 'leste', rect: [974, 275, 1024, 375], destino: null },
    ],
  },
};
