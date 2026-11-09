/* PSYWORLD — hand-authored collision layouts for the early Kanto routes. */
(function (W) {
  'use strict';
  if (W.PsyKantoEarlyChaptersV1) return;

  const COLS = 32, ROWS = 20;
  const BLOCKED = 9, PATH = 1, GRASS = 5;

  function makeGrid(strokes, openPatches, habitatPatches, waterPatches = []) {
    const grid = Array.from({length: ROWS}, () => Array(COLS).fill(BLOCKED));
    const stamp = (x, y, value, radius = 0) => {
      for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
        const px = x + dx, py = y + dy;
        if (px > 0 && py > 0 && px < COLS - 1 && py < ROWS - 1) grid[py][px] = value;
      }
    };
    const line = (a, b, value, radius = 0) => {
      const steps = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
      for (let i = 0; i <= steps; i++) {
        const x = Math.round(a[0] + (b[0] - a[0]) * i / (steps || 1));
        const y = Math.round(a[1] + (b[1] - a[1]) * i / (steps || 1));
        stamp(x, y, value, radius);
      }
    };
    for (const [[x1,y1],[x2,y2],width=0] of strokes) line([x1,y1],[x2,y2],PATH,width);
    for (const [x1,y1,x2,y2] of openPatches) {
      for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) {
        if (x > 0 && y > 0 && x < COLS - 1 && y < ROWS - 1) grid[y][x] = 0;
      }
    }
    for (const [x1,y1,x2,y2] of habitatPatches) {
      for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) {
        if (x > 0 && y > 0 && x < COLS - 1 && y < ROWS - 1) grid[y][x] = GRASS;
      }
    }
    for (const [x1,y1,x2,y2] of waterPatches) {
      for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) {
        if (x > 0 && y > 0 && x < COLS - 1 && y < ROWS - 1) grid[y][x] = 3;
      }
    }
    // Paint the visible trail after clearings and water so traversable routes
    // remain connected and cannot be hidden by an overlapping decoration.
    for (const [[x1,y1],[x2,y2],width=0] of strokes) line([x1,y1],[x2,y2],PATH,width);
    return grid;
  }

  const MAPS = {
    'route-2': {
      id:'route-2', cols:COLS, rows:ROWS, tile:28,
      art:'assets/story/route-2-artist-v1.webp',
      grid:makeGrid(
        [
          [[2,15],[12,15],1], [[6,5],[6,15],1], [[6,5],[29,5],1], [[29,5],[29,15],1],
          [[6,12],[12,14],0], [[12,14],[16,13],0], [[12,14],[15,10],0]
        ],
        [[8,7,12,13],[13,7,26,14],[22,6,28,9]],
        [[8,8,11,12],[16,8,21,12],[23,7,26,10]]
      ),
      spawn:{x:2,y:15}, returnGate:{x:2,y:15},
      returnTo:{world:'viridian',spawn:[449,72]},
      npc:{x:12,y:15}, object:{x:9,y:15}, exit:{x:29,y:5},
      next:{world:'viridian-forest',spawn:{x:16,y:18}},
      encounterLevels:[3,6]
    },
    'route-3': {
      id:'route-3', cols:COLS, rows:ROWS, tile:28,
      art:'assets/story/kanto-route-3-v1.webp',
      grid:makeGrid(
        [
          [[2,13],[6,13],1], [[6,13],[9,11],1], [[9,11],[11,8],1], [[11,8],[14,5],1],
          [[14,5],[17,6],1], [[17,6],[19,8],1], [[19,8],[21,11],1], [[21,11],[24,13],1],
          [[24,13],[30,13],1]
        ],
        [[3,13,5,15],[9,8,10,10],[19,10,20,11],[15,5,16,6],[24,12,25,13],[6,11,7,12],[27,12,29,16]],
        [[3,14,4,14],[10,8,10,8],[20,11,20,11],[15,6,15,6],[25,12,25,12],[7,11,7,11],[27,15,27,15]]
      ),
      spawn:{x:3,y:13}, returnGate:{x:3,y:13},
      returnTo:{world:'pewter',spawn:{x:29,y:11}},
      npc:{x:14,y:5}, npcName:'Escoteiro Davi', npcIdle:'basic-adventure-boy.webp',
      object:{x:9,y:11}, exit:{x:29,y:13},
      next:{world:'mt-moon',spawn:{x:3,y:17}},
      encounterLevels:[7,11]
    },
    'viridian-forest': {
      id:'viridian-forest', cols:COLS, rows:ROWS, tile:28,
      art:'assets/story/viridian-forest-route2-v1.webp',
      grid:makeGrid(
        [
          [[16,18],[17,15],1], [[17,15],[16,12],1], [[16,12],[14,10],1],
          [[14,10],[15,8],1], [[15,8],[17,6],1], [[17,6],[17,2],1],
          [[14,10],[9,9],0], [[9,9],[8,7],0], [[17,11],[22,11],0]
        ],
        [[4,5,11,11],[21,7,28,13],[11,8,15,11],[16,11,20,13]],
        [[4,6,8,9],[23,8,27,11],[17,12,19,13]],
        [[1,7,5,12],[5,12,12,12],[18,11,23,11]]
      ),
      spawn:{x:16,y:18}, returnGate:{x:16,y:18},
      returnTo:{world:'route-2',spawn:{x:29,y:7}},
      npc:{x:8,y:7}, object:{x:17,y:6}, exit:{x:17,y:2},
      next:{world:'pewter',spawn:null},
      lanterns:[[367,230],[445,180],[527,153]], encounterLevels:[4,8]
    }
  };

  // Place the seven already-registered Route 3 gathering nodes on reachable
  // clearings beside the trail, matching their production coordinates.
  for (const [x,y] of [[4,14],[10,8],[20,11],[15,6],[25,12],[7,11],[27,15]]) {
    if (MAPS['route-3'].grid[y]?.[x] !== undefined) MAPS['route-3'].grid[y][x] = GRASS;
  }

  function cloneMap(map) {
    return {...map, grid:map.grid.map(row=>row.slice()),
      spawn:{...map.spawn}, returnGate:{...map.returnGate}, npc:{...map.npc},
      object:{...map.object}, exit:{...map.exit},
      returnTo:{...map.returnTo,spawn:Array.isArray(map.returnTo.spawn)?map.returnTo.spawn.slice():{...map.returnTo.spawn}},
      next:{...map.next,spawn:map.next.spawn?{...map.next.spawn}:null},
      lanterns:map.lanterns?.map(point=>point.slice())};
  }

  W.PsyKantoEarlyChaptersV1 = {
    version:1, cols:COLS, rows:ROWS, tile:28,
    ids:Object.keys(MAPS), get:id=>MAPS[id]?cloneMap(MAPS[id]):null,
    walkable:(id,x,y)=>{const map=MAPS[id],tile=map?.grid[y]?.[x];return tile!==undefined&&![BLOCKED,3,4].includes(tile);}
  };
})(window);
