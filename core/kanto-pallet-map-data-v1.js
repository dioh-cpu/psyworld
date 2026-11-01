/* PSYWORLD — authored Pallet Town campaign-map data V1.
 * Authored map data for the campaign tile renderer. This is separate from the
 * avatar's Halloween festival city and has no physical exit into a route.
 *
 * Cell legend: . walkable lawn, p walkable path, g walkable tall grass,
 *             # solid tree/rock boundary, b solid building footprint,
 *             w solid water. Coordinates are zero-based, x right, y down.
 */
(function (W) {
  'use strict';
  if (W.PsyKantoAuthoredMapsV1) return;

  const PALLET_WIDTH = 32, PALLET_HEIGHT = 20;
  function makePalletRows() {
    const grid = Array.from({ length: PALLET_HEIGHT }, (_, y) =>
      Array.from({ length: PALLET_WIDTH }, (_, x) =>
        x < 2 || x >= PALLET_WIDTH - 2 || y === 0 || y === PALLET_HEIGHT - 1 ? '#' : '.'));
    const rect = (x, y, w, h, cell) => {
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++)
        if (grid[yy]?.[xx] !== undefined) grid[yy][xx] = cell;
    };
    // Walkable habitats, solid landmarks and authored buildings.
    rect(3, 2, 7, 5, 'g'); rect(22, 2, 7, 5, 'g');
    rect(21, 10, 2, 3, 'w');
    rect(12, 2, 8, 4, 'b');
    rect(3, 10, 5, 4, 'b');
    rect(23, 10, 5, 4, 'b');
    // Main street, west path around the lab, and spurs to both homes.
    rect(15, 7, 2, 12, 'p');
    rect(9, 6, 7, 2, 'p');
    rect(5, 14, 22, 2, 'p');
    rect(5, 14, 2, 3, 'p'); rect(25, 14, 2, 3, 'p');
    // Reopen the authored doors after setting building collision.
    rect(15, 6, 2, 1, 'p'); rect(5, 14, 2, 1, 'p'); rect(25, 14, 2, 1, 'p');
    return grid.map(row => row.join(''));
  }
  const PALLET_ROWS = makePalletRows();

  const MAPS = {
    pallet: {
      id: 'pallet',
      name: 'Pallet Town',
      style: 'gba-overworld',
      width: 32,
      height: 20,
      tileSize: 16,
      rows: PALLET_ROWS,
      legend: { '.': 'lawn', p: 'path', g: 'tall-grass', '#': 'solid-edge', b: 'solid-building', w: 'solid-water' },
      spawn: { x: 15, y: 17, facing: 'up' },
      playerHouse: {
        id: 'player-house', name: 'Sua casa', kind: 'house',
        footprint: { x: 3, y: 10, width: 5, height: 4 },
        door: { x: 5, y: 14 },
        palette: 'pallet-home'
      },
      professorHouse: {
        id: 'oak-lab', name: 'Laboratório do Professor Carvalho', kind: 'lab',
        footprint: { x: 12, y: 2, width: 8, height: 4 },
        door: { x: 15, y: 6 },
        palette: 'oak-lab'
      },
      rivalHouse: {
        id: 'rival-house', name: 'Casa do rival', kind: 'house',
        footprint: { x: 23, y: 10, width: 5, height: 4 },
        door: { x: 25, y: 14 },
        palette: 'pallet-home-blue'
      },
      pathNetwork: [
        { id: 'main-street', points: [[15,18],[15,7],[9,7]], gate: null },
        { id: 'player-home-branch', points: [[15,14],[7,14],[5,14]] },
        { id: 'rival-home-branch', points: [[16,14],[25,14]] }
      ],
      npcs: [
        { id: 'oak', name: 'Professor Carvalho', x: 18, y: 7, facing: 'left', story: 'oak-introduction' },
        { id: 'rival', name: 'Rival', x: 24, y: 15, facing: 'left', story: 'rival-first-meeting' },
        { id: 'town-guide', name: 'Guia de Pallet', x: 11, y: 15, facing: 'right', story: 'pallet-guide' }
      ],
      habitats: [
        { id: 'north-west-grass', bounds: { x: 3, y: 2, width: 7, height: 5 }, encounterSet: 'kanto-pallet-intro' },
        { id: 'north-east-grass', bounds: { x: 22, y: 2, width: 7, height: 5 }, encounterSet: 'kanto-pallet-intro' }
      ],
      landmarks: [
        { id: 'pallet-sign', kind: 'sign', x: 13, y: 1, text: 'PALLET TOWN' },
        { id: 'south-flowerbeds', kind: 'flowers', x: 10, y: 16, width: 2, height: 1 },
        { id: 'east-pond', kind: 'pond', x: 21, y: 10, width: 2, height: 3 }
      ],
      // Pallet is a closed city area. Campaign navigation handles chapters;
      // there is deliberately no walkable or interactive Route 1 exit here.
      exit: null,
      interactions: [
        { id: 'choose-starter', requires: ['oak-introduction-complete'], starts: 'kanto-starter-selection', completes: 'kanto-starter-chosen' }
      ]
    }
  };

  function get(id) {
    const source = MAPS[String(id)];
    if (!source) return null;
    return JSON.parse(JSON.stringify(source));
  }
  function toGrid(id) {
    const map = get(id);
    if (!map || map.rows.length !== map.height || map.rows.some(row => row.length !== map.width)) return null;
    const codes = { '.': 0, p: 1, g: 2, '#': 9, b: 9, w: 4 };
    return map.rows.map(row => Array.from(row, cell => codes[cell] ?? 9));
  }

  W.PsyKantoAuthoredMapsV1 = Object.freeze({ version: 1, get, toGrid, ids: () => Object.keys(MAPS) });
})(window);
