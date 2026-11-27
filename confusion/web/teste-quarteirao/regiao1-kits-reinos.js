// Linhagens dos Reinos 03–12 para o combate (Expansão 1): elemento, classe e os nomes das três habilidades de cada linhagem.
// Os kits são montados em regiao1-batalha-habilidades.js (kitDe) a partir daqui, pelo molde da classe e pelos efeitos do elemento.
// Ids das habilidades = slug do nome (estáveis: o VFX depende deles). Elemento e classe são a proposta de combate; o catálogo
// (espécies, formas e artes) pode ler LINHAGENS_REINOS para preencher ELEMENTO_DA_ESPECIE e CLASSE_DA_ESPECIE.
// classe: tanque | guerreiro | mago | assassino | suporte. Habilidades: [golpe (cd 1), técnica (cd 3), suprema (cd 5)].
const L = (reino, nome, elemento, classe, habilidades) => ({ reino, nome, elemento, classe, habilidades });

export const LINHAGENS_REINOS = [
  // 03 · Crista da Alvorada (ovos e penas · Basilisco da Crista Rubra)
  L(3, 'Penacrista', 'fogo', 'guerreiro', ['Bicada Rubra', 'Crista Ardente', 'Alvorada Flamejante']),
  L(3, 'Grifonivo', 'voador', 'assassino', ['Garra Nevada', 'Mergulho Alvo', 'Rapina do Pico']),
  L(3, 'Pedrapica', 'pedra', 'tanque', ['Bico de Pedra', 'Plumagem Rochosa', 'Avalanche da Crista']),
  L(3, 'Corujalva', 'luz', 'suporte', ['Pena Serena', 'Canto da Aurora', 'Olhar da Alvorada']),
  L(3, 'Quenavento', 'voador', 'mago', ['Lufada Cortante', 'Redemoinho do Ninho', 'Vendaval da Crista']),
  // 04 · Manguezal do Sal (sal e conservas · Caranguejo Salífero)
  L(4, 'Mangroé', 'planta', 'tanque', ['Raiz Salobra', 'Casca de Mangue', 'Maré de Raízes']),
  L(4, 'Saligarra', 'agua', 'assassino', ['Pinça Salina', 'Corte de Salmoura', 'Garra da Salina']),
  L(4, 'Espumor', 'agua', 'suporte', ['Espuma Mansa', 'Bruma Salgada', 'Maré Curativa']),
  L(4, 'Garçamar', 'voador', 'guerreiro', ['Bico Arpão', 'Revoada da Maré', 'Lança da Garça']),
  L(4, 'Pexodo', 'agua', 'mago', ['Jato Salobro', 'Redemoinho de Sal', 'Tromba do Mangue']),
  // 05 · Serras do Linho (linho e tecido · Tecelão do Vendaval)
  L(5, 'Fiozelo', 'inseto', 'suporte', ['Fio Curativo', 'Casulo de Linho', 'Bordado Vital']),
  L(5, 'Lanúrico', 'neutro', 'tanque', ['Marrada Lanosa', 'Velo Espesso', 'Novelo Rolante']),
  L(5, 'Cortavento', 'voador', 'assassino', ['Lâmina de Vento', 'Rajada das Serras', 'Corte do Vendaval']),
  L(5, 'Furafuso', 'aco', 'guerreiro', ['Agulhada', 'Giro do Fuso', 'Perfuração Tecida']),
  L(5, 'Tramanta', 'trevas', 'mago', ['Fio Sombrio', 'Trama Noturna', 'Manto da Teia']),
  // 06 · Degraus de Terracota (barro e cerâmica · Colosso do Forno Oco)
  L(6, 'Argilume', 'luz', 'suporte', ['Lume de Argila', 'Vaso Sereno', 'Brasa Acolhedora']),
  L(6, 'Barropardo', 'terra', 'tanque', ['Pancada de Barro', 'Couraça Cozida', 'Desmoronamento']),
  L(6, 'Olarinto', 'terra', 'guerreiro', ['Golpe de Olaria', 'Torno Giratório', 'Moldagem Bruta']),
  L(6, 'Cindrapo', 'fogo', 'mago', ['Cinza Viva', 'Forno Aberto', 'Chuva de Brasas']),
  L(6, 'Vermelisco', 'fogo', 'assassino', ['Lasca Rubra', 'Faísca de Tijolo', 'Fornalha Súbita']),
  // 07 · Bacia da Ametista (ametista e prismas · Golem de Ametista)
  L(7, 'Prismaço', 'pedra', 'tanque', ['Golpe Prismático', 'Couraça de Cristal', 'Refração Maciça']),
  L(7, 'Veludrusa', 'trevas', 'suporte', ['Brilho Veludo', 'Drusa Restauradora', 'Geodo Protetor']),
  L(7, 'Quaracó', 'pedra', 'guerreiro', ['Quartzo Partido', 'Estilhaços de Quartzo', 'Pilar de Ametista']),
  L(7, 'Fendaz', 'terra', 'assassino', ['Fenda Rápida', 'Garra de Veio', 'Ruptura da Bacia']),
  L(7, 'Lapiolho', 'luz', 'mago', ['Olhar Lapidado', 'Feixe Facetado', 'Clarão de Ametista']),
  // 08 · Jardins da Bruma (ervas e tônicos · Abade da Névoa)
  L(8, 'Névola', 'agua', 'mago', ['Sopro de Névoa', 'Bruma Densa', 'Véu do Abade']),
  L(8, 'Hortigão', 'planta', 'tanque', ['Urtigada', 'Cerca Viva', 'Estufa Fechada']),
  L(8, 'Musgáris', 'planta', 'suporte', ['Musgo Macio', 'Chá de Ervas', 'Tônico da Bruma']),
  L(8, 'Mentauro', 'planta', 'guerreiro', ['Chifrada Mentolada', 'Pisoteio Verde', 'Investida Aromática']),
  L(8, 'Orvalis', 'agua', 'assassino', ['Gota Afiada', 'Orvalho Cortante', 'Lâmina do Amanhecer']),
  // 09 · Caldeira do Ferro (ferro e ligas · Regente da Escória)
  L(9, 'Ferrugrão', 'aco', 'tanque', ['Martelada Férrea', 'Liga Blindada', 'Bigorna Tombada']),
  L(9, 'Brasastim', 'fogo', 'guerreiro', ['Golpe em Brasa', 'Malho Ardente', 'Forja Furiosa']),
  L(9, 'Magmora', 'fogo', 'mago', ['Gota de Magma', 'Lago de Lava', 'Erupção da Caldeira']),
  L(9, 'Escorvaz', 'aco', 'assassino', ['Lasca de Escória', 'Corte Fundido', 'Escória Rubra']),
  L(9, 'Rochember', 'pedra', 'suporte', ['Calor de Rocha', 'Brasa Mineral', 'Lareira Ancestral']),
  // 10 · Geada Alta (gelo e conservantes · Urso da Aurora Fraturada)
  L(10, 'Geadante', 'luz', 'suporte', ['Brilho Gélido', 'Aurora Mansa', 'Cortina Boreal']),
  L(10, 'Uiválgido', 'agua', 'guerreiro', ['Mordida Gélida', 'Uivo da Nevasca', 'Presas do Inverno']),
  L(10, 'Glacivra', 'agua', 'assassino', ['Picada Glacial', 'Bote Congelante', 'Veneno de Gelo']),
  L(10, 'Nevascaio', 'eletrico', 'mago', ['Faísca Nevada', 'Tempestade Branca', 'Raio da Aurora']),
  L(10, 'Focanil', 'agua', 'tanque', ['Barrigada', 'Gordura Polar', 'Onda de Gelo']),
  // 11 · Deserto do Vitral (sílica e vidro · Esfinge de Vidro)
  L(11, 'Dunaril', 'terra', 'tanque', ['Tranco de Duna', 'Muralha de Areia', 'Tempestade de Areia']),
  L(11, 'Vitralgo', 'luz', 'mago', ['Estilhaço de Vitral', 'Prisma Solar', 'Mosaico Ardente']),
  L(11, 'Miragél', 'luz', 'suporte', ['Reflexo Calmo', 'Oásis', 'Miragem Restauradora']),
  L(11, 'Sabulis', 'terra', 'assassino', ['Grão Cortante', 'Emboscada nas Dunas', 'Areia Movediça']),
  L(11, 'Escaravéu', 'inseto', 'guerreiro', ['Chifre de Escaravelho', 'Carapaça Rolante', 'Sol do Escaravelho']),
  // 12 · Atol do Farol (pérola e adornos · Sentinela do Farol)
  L(12, 'Perolumo', 'luz', 'suporte', ['Brilho de Pérola', 'Nácar Curativo', 'Farol Sereno']),
  L(12, 'Madrepulso', 'agua', 'tanque', ['Pulso de Nácar', 'Concha Fechada', 'Maré de Madrepérola']),
  L(12, 'Corálico', 'agua', 'guerreiro', ['Golpe de Coral', 'Recife Afiado', 'Arrebentação']),
  L(12, 'Náutiluz', 'eletrico', 'mago', ['Pulso Abissal', 'Corrente Luminosa', 'Descarga do Farol']),
  L(12, 'Mantaré', 'agua', 'assassino', ['Ferrão de Arraia', 'Voo Submerso', 'Mergulho da Maré']),
];

export const PAPEL_DA_CLASSE = { tanque: 'defesa', suporte: 'suporte', guerreiro: 'ataque', mago: 'ataque', assassino: 'ataque' };
export const LINHAGEM_DO_REINO = Object.fromEntries(LINHAGENS_REINOS.map((l) => [l.nome, l]));

// Chefes dos Reinos 01–12 (também chefes das Regiões 1–12: região N ↔ reino N). Kit: [golpe (cd 1), técnica em área (cd 3),
// golpe especial (cd 5)]. Fúria: abaixo de `furia` da vida, o chefe limpa os efeitos negativos, recupera 10% da vida,
// ganha ataque e defesa elevados e o golpe especial volta pronto (o VFX anuncia a fase).
// Para a batalha: specChefeReino(reino, nivel) devolve a tupla de inimigo [nome, nível, elemento, { chefe, nome, bonus }].
const C = (reino, nome, elemento, habilidades, extra = {}) => ({ reino, nome, elemento, habilidades, furia: 0.5, bonus: { hp: 2.4, atk: 0.3, def: 0.25 }, ...extra });
export const CHEFES_REINOS = [
  C(1, 'Guardião do Sino', 'luz', ['Badalo Sagrado', 'Eco do Campanário', 'Dobre da Colheita']),
  // Enxame Dourado: as abelhas ficam sobre o time alvo por 3 rodadas, picando todos (35% do ataque) com 40% de chance de veneno
  C(2, 'Rainha da Colmeia Dourada', 'inseto', ['Ferrão Real', 'Enxame Dourado', 'Decreto da Colmeia'], { enxame: { turnos: 3, mult: 0.35, chance: 0.4 } }),
  C(3, 'Basilisco da Crista Rubra', 'fogo', ['Presa Rubra', 'Olhar Petrificante', 'Chama do Basilisco']),
  C(4, 'Caranguejo Salífero', 'agua', ['Pinça Esmagadora', 'Jato de Salmoura', 'Maré Salífera']),
  C(5, 'Tecelão do Vendaval', 'voador', ['Fio Navalha', 'Tear de Ventos', 'Vendaval Tecido']),
  C(6, 'Colosso do Forno Oco', 'terra', ['Punho de Terracota', 'Bafo do Forno', 'Desabamento do Colosso']),
  C(7, 'Golem de Ametista', 'pedra', ['Soco Cristalino', 'Chuva de Geodos', 'Cataclismo de Ametista']),
  C(8, 'Abade da Névoa', 'planta', ['Cajado de Ervas', 'Incenso Sonífero', 'Prece da Bruma']),
  C(9, 'Regente da Escória', 'aco', ['Cetro Fundido', 'Banho de Escória', 'Decreto da Forja']),
  C(10, 'Urso da Aurora Fraturada', 'agua', ['Patada Glacial', 'Rugido Boreal', 'Aurora Partida']),
  C(11, 'Esfinge de Vidro', 'trevas', ['Garra Vítrea', 'Enigma Sombrio', 'Juízo da Esfinge']),
  C(12, 'Sentinela do Farol', 'eletrico', ['Lança do Farol', 'Feixe Varredor', 'Clarão da Sentinela'], { furia: 0.6 }),
];
export const CHEFE_POR_NOME = Object.fromEntries(CHEFES_REINOS.map((c) => [c.nome, c]));
export const specChefeReino = (reino, nivel) => { const c = CHEFES_REINOS.find((x) => x.reino === reino); return c ? [c.nome, nivel, c.elemento, { chefe: true, nome: c.nome, bonus: { ...c.bonus } }] : null; };
