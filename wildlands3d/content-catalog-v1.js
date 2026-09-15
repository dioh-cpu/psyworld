/*
 * Wildlands 2.5D — Catálogo autoral de conteúdo V1
 * Conteúdo original: nomes, IDs, descrições e referências de assets locais.
 * Não depende do app-v155.js e não o modifica.
 */
(function (root, factory) {
  const catalog = factory();
  if (typeof module === 'object' && module.exports) module.exports = catalog;
  if (root) root.WildlandsContentCatalog = catalog;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const REGIONS = Object.freeze({
    VALE_VERDE: 'vale-verde',
    COSTA_AURORA: 'costa-aurora'
  });

  const captureItems = Object.freeze([
    Object.freeze({
      id: 'capsula_brotante', name: 'Cápsula Brotante', region: REGIONS.VALE_VERDE,
      unlockQuest: 0, power: 1.00, color: '#79d98c', cost: { fiber: 3, resin: 1 },
      asset: 'assets/catalog/capture/capsula-brotante.svg'
    }),
    Object.freeze({
      id: 'capsula_maré', name: 'Cápsula Maré', region: REGIONS.VALE_VERDE,
      unlockQuest: 8, power: 1.45, color: '#61c9e8', cost: { fiber: 2, shell: 2, crystal: 1 },
      asset: 'assets/catalog/capture/capsula-mare.svg'
    }),
    Object.freeze({
      id: 'capsula_cometa', name: 'Cápsula Cometa', region: REGIONS.VALE_VERDE,
      unlockQuest: 15, power: 2.05, color: '#f3bd68', cost: { alloy: 1, crystal: 2, resin: 2 },
      asset: 'assets/catalog/capture/capsula-cometa.svg'
    })
  ]);

  const creature = (id, name, region, habitat, element, level, difficulty, role, asset) => ({
    id, name, region, habitat, element, level, difficulty, role,
    asset: asset || `assets/catalog/creatures/${id}.svg`,
    original: true
  });

  const creatures = Object.freeze([
    creature('lumicoelho', 'Lumicoelho', REGIONS.VALE_VERDE, 'clareira', 'brilho', 2, 8, 'batedor'),
    creature('musgurso', 'Musgurso', REGIONS.VALE_VERDE, 'mata-baixa', 'folha', 3, 12, 'guardião'),
    creature('fagulhote', 'Fagulhote', REGIONS.VALE_VERDE, 'encosta-quente', 'brasa', 4, 16, 'atacante'),
    creature('pedrilo', 'Pedrilo', REGIONS.VALE_VERDE, 'pedreira', 'terra', 4, 18, 'minerador'),
    creature('orvalume', 'Orvalume', REGIONS.VALE_VERDE, 'riacho', 'água', 5, 20, 'curandeiro'),
    creature('cipolobo', 'Cipolobo', REGIONS.VALE_VERDE, 'mata-baixa', 'folha', 6, 24, 'caçador'),
    creature('ventralha', 'Ventralha', REGIONS.VALE_VERDE, 'colina', 'vento', 6, 25, 'planador'),
    creature('casquino', 'Casquino', REGIONS.VALE_VERDE, 'riacho', 'água', 7, 28, 'coletor'),
    creature('brumato', 'Brumato', REGIONS.VALE_VERDE, 'pântano-claro', 'névoa', 8, 32, 'furtivo'),
    creature('raizalto', 'Raizalto', REGIONS.VALE_VERDE, 'bosque-antigo', 'folha', 8, 34, 'construtor'),
    creature('faíscaro', 'Faíscaro', REGIONS.VALE_VERDE, 'campo-aberto', 'faísca', 9, 37, 'energizador'),
    creature('taturuna', 'Taturuna', REGIONS.VALE_VERDE, 'pasto-dourado', 'terra', 10, 40, 'carregador'),
    creature('melívia', 'Melívia', REGIONS.VALE_VERDE, 'campo-floral', 'néctar', 10, 42, 'artesã'),
    creature('corvafolha', 'Corvafolha', REGIONS.VALE_VERDE, 'bosque-antigo', 'vento', 11, 45, 'vigia'),
    creature('lajurso', 'Lajurso', REGIONS.VALE_VERDE, 'pedreira', 'rocha', 12, 50, 'tanque'),
    creature('serpevinha', 'Serpevinha', REGIONS.VALE_VERDE, 'riacho', 'água', 12, 52, 'nadador'),
    creature('solamora', 'Solamora', REGIONS.VALE_VERDE, 'campo-floral', 'brilho', 13, 56, 'suporte'),
    creature('carvalume', 'Carvalume', REGIONS.VALE_VERDE, 'bosque-antigo', 'madeira', 14, 60, 'guardião'),
    creature('trovocervo', 'Trovocervo', REGIONS.VALE_VERDE, 'colina', 'faísca', 15, 68, 'montaria'),
    creature('auricervo', 'Auricervo', REGIONS.VALE_VERDE, 'santuário-verde', 'brilho', 18, 82, 'raro'),

    creature('marisca', 'Marisca', REGIONS.COSTA_AURORA, 'praia', 'água', 16, 72, 'nadador'),
    creature('espumim', 'Espumim', REGIONS.COSTA_AURORA, 'praia', 'água', 17, 76, 'suporte'),
    creature('coralume', 'Coralume', REGIONS.COSTA_AURORA, 'recife', 'brilho', 18, 82, 'curandeiro'),
    creature('saltrito', 'Saltrito', REGIONS.COSTA_AURORA, 'falésia', 'sal', 18, 84, 'minerador'),
    creature('ventoalga', 'Ventoalga', REGIONS.COSTA_AURORA, 'mangue', 'vento', 19, 88, 'planador'),
    creature('carangume', 'Carangume', REGIONS.COSTA_AURORA, 'mangue', 'rocha', 20, 92, 'carregador'),
    creature('tubarisco', 'Tubarisco', REGIONS.COSTA_AURORA, 'mar-raso', 'água', 21, 98, 'caçador'),
    creature('conchifero', 'Conchífero', REGIONS.COSTA_AURORA, 'recife', 'som', 22, 104, 'artesã'),
    creature('brumaria', 'Brumária', REGIONS.COSTA_AURORA, 'enseada-nebulosa', 'névoa', 23, 110, 'furtivo'),
    creature('raiaflor', 'Raiaflor', REGIONS.COSTA_AURORA, 'mar-raso', 'folha', 24, 116, 'nadador'),
    creature('marébravo', 'Marébravo', REGIONS.COSTA_AURORA, 'cais-antigo', 'água', 25, 122, 'guardião'),
    creature('fagulmar', 'Fagulmar', REGIONS.COSTA_AURORA, 'vulcão-costeiro', 'brasa', 26, 130, 'atacante'),
    creature('cristalga', 'Cristalga', REGIONS.COSTA_AURORA, 'gruta-marinha', 'cristal', 27, 138, 'minerador'),
    creature('farolume', 'Farolume', REGIONS.COSTA_AURORA, 'farol', 'brilho', 28, 146, 'vigia'),
    creature('mangualvo', 'Mangualvo', REGIONS.COSTA_AURORA, 'mangue', 'folha', 29, 154, 'caçador'),
    creature('tempestino', 'Tempestino', REGIONS.COSTA_AURORA, 'céu-aberto', 'trovão', 30, 164, 'voador'),
    creature('abissalume', 'Abissalume', REGIONS.COSTA_AURORA, 'fossa-azul', 'sombra', 31, 176, 'furtivo'),
    creature('sirencoral', 'Sirencoral', REGIONS.COSTA_AURORA, 'recife', 'som', 32, 188, 'suporte'),
    creature('monçaforte', 'Monçaforte', REGIONS.COSTA_AURORA, 'falésia', 'vento', 34, 204, 'montaria'),
    creature('rainhata', 'Rainhata', REGIONS.COSTA_AURORA, 'santuário-maré', 'cristal', 38, 235, 'raro')
  ]);

  const quest = (id, title, region, type, target, amount, reward, unlock = 0) => ({
    id, title, region, type, target, amount, reward, unlock, original: true
  });

  const quests = Object.freeze([
    quest('vv-01', 'Primeiras pegadas', REGIONS.VALE_VERDE, 'explore', 'clareira', 1, { gold: 80, xp: 30 }),
    quest('vv-02', 'Fibra ao vento', REGIONS.VALE_VERDE, 'gather', 'fiber', 8, { gold: 90, xp: 40 }),
    quest('vv-03', 'Pedras quentes', REGIONS.VALE_VERDE, 'gather', 'stone', 8, { gold: 110, xp: 50 }),
    quest('vv-04', 'Um brilho na mata', REGIONS.VALE_VERDE, 'capture', 'lumicoelho', 1, { gold: 150, xp: 75 }),
    quest('vv-05', 'A ponte quebrada', REGIONS.VALE_VERDE, 'craft', 'bridge-kit', 1, { gold: 180, xp: 80 }),
    quest('vv-06', 'Vigília do riacho', REGIONS.VALE_VERDE, 'defeat', 'orvalume', 3, { gold: 200, xp: 95 }),
    quest('vv-07', 'Sementes resistentes', REGIONS.VALE_VERDE, 'gather', 'seed-sun', 5, { gold: 220, xp: 100 }),
    quest('vv-08', 'Maré de bolso', REGIONS.VALE_VERDE, 'unlock', 'capsula_maré', 1, { captureItem: 'capsula_maré', xp: 120 }),
    quest('vv-09', 'Trilhas cruzadas', REGIONS.VALE_VERDE, 'capture', 'cipolobo', 1, { gold: 260, xp: 130 }),
    quest('vv-10', 'O sino do bosque', REGIONS.VALE_VERDE, 'interact', 'forest-bell', 1, { gold: 280, xp: 140 }),
    quest('vv-11', 'Pedra para a forja', REGIONS.VALE_VERDE, 'gather', 'ore-copper', 6, { gold: 300, xp: 150 }),
    quest('vv-12', 'Faíscas controladas', REGIONS.VALE_VERDE, 'defeat', 'faíscaro', 4, { gold: 330, xp: 165 }),
    quest('vv-13', 'O caminho alto', REGIONS.VALE_VERDE, 'explore', 'colina', 1, { gold: 350, xp: 180 }),
    quest('vv-14', 'Raízes que protegem', REGIONS.VALE_VERDE, 'capture', 'raizalto', 1, { gold: 380, xp: 200 }),
    quest('vv-15', 'Chama de cometa', REGIONS.VALE_VERDE, 'unlock', 'capsula_cometa', 1, { captureItem: 'capsula_cometa', xp: 250 }),
    quest('vv-16', 'O guardião de pedra', REGIONS.VALE_VERDE, 'defeat', 'lajurso', 1, { gold: 450, xp: 260 }),
    quest('vv-17', 'Coroa de flores', REGIONS.VALE_VERDE, 'gather', 'sun-bloom', 10, { gold: 480, xp: 280 }),
    quest('vv-18', 'Tempestade sobre o vale', REGIONS.VALE_VERDE, 'event', 'storm-event', 1, { gold: 550, xp: 320 }),
    quest('vv-19', 'O cervo do trovão', REGIONS.VALE_VERDE, 'capture', 'trovocervo', 1, { gold: 650, xp: 380 }),
    quest('vv-20', 'Santuário da aurora', REGIONS.VALE_VERDE, 'boss', 'auricervo', 1, { gold: 900, xp: 500, regionUnlock: REGIONS.COSTA_AURORA }),

    quest('ca-01', 'Chegada à areia', REGIONS.COSTA_AURORA, 'explore', 'praia', 1, { gold: 700, xp: 360 }, 1),
    quest('ca-02', 'Conchas ao luar', REGIONS.COSTA_AURORA, 'gather', 'shell', 10, { gold: 740, xp: 380 }, 1),
    quest('ca-03', 'Primeira travessia', REGIONS.COSTA_AURORA, 'explore', 'mar-raso', 1, { gold: 780, xp: 400 }, 1),
    quest('ca-04', 'Espuma viva', REGIONS.COSTA_AURORA, 'capture', 'espumim', 1, { gold: 820, xp: 430 }, 1),
    quest('ca-05', 'Farol apagado', REGIONS.COSTA_AURORA, 'interact', 'lighthouse', 1, { gold: 860, xp: 450 }, 1),
    quest('ca-06', 'Cristais de maré', REGIONS.COSTA_AURORA, 'gather', 'crystal', 8, { gold: 900, xp: 480 }, 1),
    quest('ca-07', 'A boca do mangue', REGIONS.COSTA_AURORA, 'defeat', 'carangume', 5, { gold: 950, xp: 510 }, 1),
    quest('ca-08', 'Canto do recife', REGIONS.COSTA_AURORA, 'capture', 'conchifero', 1, { gold: 1000, xp: 540 }, 1),
    quest('ca-09', 'Névoa na enseada', REGIONS.COSTA_AURORA, 'event', 'fog-event', 1, { gold: 1050, xp: 570 }, 1),
    quest('ca-10', 'O mapa submerso', REGIONS.COSTA_AURORA, 'craft', 'diving-map', 1, { gold: 1100, xp: 600 }, 1),
    quest('ca-11', 'Escamas velozes', REGIONS.COSTA_AURORA, 'defeat', 'tubarisco', 3, { gold: 1180, xp: 640 }, 1),
    quest('ca-12', 'Jardim sob as ondas', REGIONS.COSTA_AURORA, 'gather', 'coral-seed', 6, { gold: 1250, xp: 680 }, 1),
    quest('ca-13', 'Asas da monção', REGIONS.COSTA_AURORA, 'capture', 'tempestino', 1, { gold: 1350, xp: 720 }, 1),
    quest('ca-14', 'A forja salgada', REGIONS.COSTA_AURORA, 'craft', 'salt-forge', 1, { gold: 1450, xp: 760 }, 1),
    quest('ca-15', 'Abismo sem eco', REGIONS.COSTA_AURORA, 'explore', 'fossa-azul', 1, { gold: 1550, xp: 820 }, 1),
    quest('ca-16', 'A rainha do coral', REGIONS.COSTA_AURORA, 'defeat', 'sirencoral', 1, { gold: 1700, xp: 900 }, 1),
    quest('ca-17', 'Tempestade perfeita', REGIONS.COSTA_AURORA, 'event', 'superstorm-event', 1, { gold: 1900, xp: 1000 }, 1),
    quest('ca-18', 'Guardião da falésia', REGIONS.COSTA_AURORA, 'defeat', 'monçaforte', 1, { gold: 2200, xp: 1150 }, 1),
    quest('ca-19', 'Luz sob a água', REGIONS.COSTA_AURORA, 'capture', 'abissalume', 1, { gold: 2500, xp: 1300 }, 1),
    quest('ca-20', 'Coração da Costa Aurora', REGIONS.COSTA_AURORA, 'boss', 'rainhata', 1, { gold: 3500, xp: 1800, regionUnlock: 'regiao-03' }, 1)
  ]);

  const byRegion = (items, region) => items.filter(item => item.region === region);
  const getQuestProgress = (completedQuestCount) => ({
    completedQuestCount,
    captureItems: captureItems.filter(item => item.unlockQuest <= completedQuestCount),
    nextCaptureItem: captureItems.find(item => item.unlockQuest > completedQuestCount) || null
  });

  return Object.freeze({
    version: '1.0.0',
    regions: REGIONS,
    captureItems,
    creatures,
    quests,
    byRegion,
    getQuestProgress,
    counts: Object.freeze({
      creaturesByRegion: Object.freeze({
        [REGIONS.VALE_VERDE]: byRegion(creatures, REGIONS.VALE_VERDE).length,
        [REGIONS.COSTA_AURORA]: byRegion(creatures, REGIONS.COSTA_AURORA).length
      }),
      questsByRegion: Object.freeze({
        [REGIONS.VALE_VERDE]: byRegion(quests, REGIONS.VALE_VERDE).length,
        [REGIONS.COSTA_AURORA]: byRegion(quests, REGIONS.COSTA_AURORA).length
      })
    })
  });
}));
