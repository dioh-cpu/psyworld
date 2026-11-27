// Planta dos Altos do Âmbar em coordenadas lógicas de 1024 × 571.
export const R2_PASTA_ARTES = 'assets/confusion/interface/regioes/r2/';
const R2_ARTES = `../../../${R2_PASTA_ARTES}`;

const CENTRO = [512, 292];

const ROTAS = [
  {
    prefixo: 'A', bioma: 'Apiários Dourados', acesso: 'R2_API', direcao: 'L', nivelBase: 21,
    tabuleiro: [[null, 'BOSS', null], [null, 10, null], [8, 9, 7], [5, 4, 6], [1, 2, 3]],
    areas: [
      ['Ponte do Mel', 0], ['Terraços de Alfazema', 1], ['Pomares do Zângão', 1],
      ['Favos Expostos', 2], ['Prensa de Cera', 3], ['Pátio dos Apicultores', 3],
      ['Bosque das Abelheiras', 5], ['Margem Dourada', 5], ['Casa das Lâminas', 6],
      ['Declive do Favo', 7],
    ],
    fauna: ['Colmeiro', 'Lavândria', 'Fanalino', 'Cerifogo', 'Vesprata', 'Cervomusgo', 'Melifalcão'],
  },
  {
    prefixo: 'B', bioma: 'Cristas de Âmbar', acesso: 'R2_CRI', direcao: 'N', nivelBase: 28,
    tabuleiro: [[null, 'BOSS', null], [null, 10, null], [8, 9, 7], [4, 6, 5], [2, 1, 3]],
    areas: [
      ['Estrada dos Cristais', 0], ['Pedreira do Alvorecer', 1], ['Mirante das Cristas', 2],
      ['Garganta dos Prismas', 3], ['Galeria Ocre', 3], ['Ruínas do Lapidário', 4],
      ['Socalcos de Quartzo', 5], ['Poço das Faíscas', 5], ['Pórtico da Lapidação', 6],
      ['Ponte das Geodas', 7],
    ],
    fauna: ['Calquélon', 'Zunifaísca', 'Falesário', 'Xistolim', 'Voltabelha', 'Cobrabúfalo', 'Bronzelo'],
  },
  {
    prefixo: 'G', bioma: 'Jardins de Resina', acesso: 'R2_ENTRONC', direcao: 'L', nivelBase: 24,
    tabuleiro: [[null, 'BOSS', null], [null, 11, null], [10, 9, 8], [5, 6, 7], [3, 2, 4], [null, 1, null]],
    areas: [
      ['Entrada dos Jardins', 0], ['Jardim do Orvalho', 1], ['Alameda de Resina', 2],
      ['Horto dos Vitralhos', 2], ['Calçada dos Pólens', 3], ['Nascente da Seiva', 4],
      ['Estufas Abandonadas', 4], ['Bosquete de Ásteres', 5], ['Jardim das Colunas', 6],
      ['Mirante dos Pólens', 7], ['Portal da Estufa Real', 8],
    ],
    fauna: ['Lavândria', 'Cervomusgo', 'Melifalcão', 'Cobrabúfalo', 'Âmbarasa', 'Fanalino', 'Ventassol'],
  },
  {
    prefixo: 'H', bioma: 'Santuário da Colmeia', acesso: 'R2_ENTRONC', direcao: 'O', nivelBase: 34,
    tabuleiro: [[null, 'BOSS', null], [null, 11, null], [9, 10, 8], [7, 5, 6], [3, 2, 4], [null, 1, null]],
    areas: [
      ['Estrada do Santuário', 0], ['Sacada dos Selos', 1], ['Pavilhão das Cerieiras', 2],
      ['Claustro da Colmeia', 2], ['Escadarias do Zumbido', 3], ['Galeria das Rainhas', 4],
      ['Passagem da Guarda', 4], ['Salão de Mel', 5], ['Capela do Favo', 6],
      ['Terraço do Néctar', 6], ['Vestíbulo da Coroa', 7],
    ],
    fauna: ['Vesprata', 'Cerifogo', 'Trovoresta', 'Latonhorn', 'Voltabelha', 'Colmeiro', 'Calquélon'],
  },
];

const DIRECOES = {
  N: { borda: 'norte', oposta: 'S', ponto: [512, 26], chegada: [512, 96] },
  S: { borda: 'sul', oposta: 'N', ponto: [512, 545], chegada: [512, 475] },
  O: { borda: 'oeste', oposta: 'L', ponto: [28, 292], chegada: [102, 292] },
  L: { borda: 'leste', oposta: 'O', ponto: [996, 292], chegada: [922, 292] },
};

// Portas que precisam de coordenadas distintas para acompanhar a arte.
const PORTAS_LOCAIS = {
  R2_C0: {
    N: { ponto: [512, 257], chegada: [512, 315] },
    O: { ponto: [32, 347], chegada: [122, 353] },
    L: { ponto: [992, 350], chegada: [890, 358] },
  },
  R2_API: {
    O: { ponto: [33, 330], chegada: [123, 347] },
    L: { ponto: [991, 340], chegada: [905, 349] },
  },
  R2_CRI: {
    L: { ponto: [988, 306], chegada: [887, 320] },
  },
  R2_H01: {
    N: { ponto: [512, 136], chegada: [512, 210] },
  },
  R2_B09: {
    N: { ponto: [512, 101], chegada: [512, 172] },
  },
  R2_A01: {
    O: { ponto: [28, 237], chegada: [102, 257] },
    L: { ponto: [996, 242], chegada: [922, 259] },
  },
  R2_G11: {
    N: { ponto: [512, 82], chegada: [512, 152] },
  },
  R2_H11: {
    N: { ponto: [512, 108], chegada: [512, 185] },
  },
};

export const CHEFES_R2 = {
  BOSS_R2_FERROADA: {
    mapa: 'R2_A_BOSS', nome: 'Ferroada Rubra', nivel: 30, elemento: 'inseto',
    pos: [512, 310], cor: '#fb923c', sprite: `${R2_ARTES}chefe-ferroada.webp`,
    reforcos: ['Cerifogo', 'Colmeiro'], mapaRetorno: 'R2_A10',
  },
  BOSS_R2_SENTINELA: {
    mapa: 'R2_B_BOSS', nome: 'Sentinela de Geoda', nivel: 37, elemento: 'pedra',
    pos: [512, 310], cor: '#facc15', sprite: `${R2_ARTES}chefe-sentinela.webp`,
    reforcos: ['Calquélon', 'Bronzelo'], mapaRetorno: 'R2_B10',
  },
  BOSS_R2_MATRIARCA: {
    mapa: 'R2_G_BOSS', nome: 'Matriarca de Resina', nivel: 34, elemento: 'planta',
    pos: [512, 310], cor: '#a3e635', sprite: `${R2_ARTES}chefe-matriarca.webp`,
    reforcos: ['Lavândria', 'Melifalcão'], mapaRetorno: 'R2_G11',
  },
  BOSS_R2: {
    mapa: 'R2_CHEFE', nome: 'Rainha da Colmeia Dourada', nivel: 45, elemento: 'inseto',
    pos: [512, 365], cor: '#f59e0b', sprite: '../../../assets/confusion/interface/estrategia/reinos/02/chefe.webp',
    reforcos: ['Colmeiro', 'Vesprata'], mapaRetorno: 'R2_H11', final: true,
  },
};

const chefes = Object.values(CHEFES_R2);
const idArea = (prefixo, numero) => `R2_${prefixo}${String(numero).padStart(2, '0')}`;

function area(id, nome, bioma, spawnPadrao = CENTRO) {
  return {
    id, nome, bioma, spawnPadrao, regiao: 'r2', saidas: [],
    arte: `${R2_ARTES}${id}.webp`, mascara: `${R2_ARTES}${id}-walkmask.png`,
  };
}

const areas = {
  R2_C0: area('R2_C0', 'Altos do Âmbar · Praça', 'Altos do Âmbar', [512, 410]),
  R2_ENTRONC: area('R2_ENTRONC', 'Encruzilhada do Âmbar', 'Altos do Âmbar'),
  R2_API: area('R2_API', 'Apiários Dourados', 'Apiários Dourados', [512, 410]),
  R2_CRI: area('R2_CRI', 'Cristas de Âmbar', 'Cristas de Âmbar', [512, 420]),
};

function porta(id, direcao) {
  return { ...DIRECOES[direcao], ...PORTAS_LOCAIS[id]?.[direcao] };
}

function adicionarSaida(origem, direcao, destino, extra = {}) {
  const { ponto: [x, y], borda, oposta } = porta(origem, direcao);
  const { rotulo, chegada, tipo } = extra;
  const destinoMapa = areas[destino];
  const vertical = direcao === 'N' || direcao === 'S';
  const dx = vertical ? 53 : 27;
  const dy = vertical ? 24 : 38;
  areas[origem].saidas.push({
    id: direcao,
    rotulo: rotulo || `${destino} · ${destinoMapa.nome}`,
    borda, tipo,
    rect: [Math.max(0, x - dx), Math.max(0, y - dy), Math.min(1024, x + dx), Math.min(571, y + dy)],
    destino,
    chegada: chegada || porta(destino, oposta).chegada,
  });
}

function ligar(origem, direcao, destino) {
  adicionarSaida(origem, direcao, destino);
  adicionarSaida(destino, DIRECOES[direcao].oposta, origem);
}

ligar('R2_C0', 'L', 'R2_API');
ligar('R2_C0', 'N', 'R2_CRI');
ligar('R2_C0', 'S', 'R2_ENTRONC');
adicionarSaida('R2_API', 'N', 'R2_CRI', { chegada: porta('R2_CRI', 'L').chegada });
adicionarSaida('R2_CRI', 'L', 'R2_API', { chegada: porta('R2_API', 'N').chegada });
adicionarSaida('R2_C0', 'O', 'REINO', { rotulo: 'Portal · Região 1 (Praça Real)', chegada: [760, 290], tipo: 'arco' });

export const ENCONTROS_ALTOS_AMBAR = [];

for (const [indice, rota] of ROTAS.entries()) {
  const { prefixo, bioma, acesso, direcao, tabuleiro, fauna } = rota;
  const boss = chefes[indice];
  const grade = tabuleiro.map(linha => linha.map(n => n === 'BOSS' ? boss.mapa : n && idArea(prefixo, n)));
  const baseNivel = rota.nivelBase;
  for (const [i, [nome, subida]] of rota.areas.entries()) {
    const id = idArea(prefixo, i + 1);
    areas[id] = area(id, nome, bioma);
    // As passagens de entrada são seguras; áreas de caça começam logo depois.
    if (i === 0 || (prefixo === 'H' && i === 10)) continue;
    const lateral = id === 'R2_B10' || id === 'R2_G11' ? 72 : 145;
    const posicoes = [[512, id === 'R2_G11' ? 214 : 174], [512 - lateral, 291], [512 + lateral, 291], [513, 394]];
    for (const [vaga, pos] of posicoes.entries()) {
      const nivel = Math.min(44, baseNivel + subida + (vaga % 3));
      ENCONTROS_ALTOS_AMBAR.push({
        id: `w_${id.toLowerCase()}_${vaga + 1}`, mapa: id, pos, nivel,
        especie: fauna[(i * 3 + vaga) % fauna.length],
        formaCadastrada: vaga === 0 && subida < 6 ? 1 : 2,
      });
    }
  }
  const nomeArena = boss.final ? `Santuário · ${boss.nome}` : `Arena · ${boss.nome}`;
  areas[boss.mapa] = area(boss.mapa, nomeArena, bioma, [512, 465]);
  ligar(acesso, direcao, idArea(prefixo, 1));
  for (const [y, linha] of grade.entries()) {
    for (const [x, id] of linha.entries()) {
      if (!id) continue;
      if (linha[x + 1]) ligar(id, 'L', linha[x + 1]);
      if (grade[y + 1]?.[x]) ligar(id, 'S', grade[y + 1][x]);
    }
  }
}

export const AREAS_ALTOS_AMBAR = areas;
