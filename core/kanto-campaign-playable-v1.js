/* PSYWORLD — Kanto playable campaign layer V1.
 * Additive canvas overworlds for the 38 atlas locations. Layouts are generated
 * from location themes; they are playable prototypes, not hand-authored maps.
 */
(function (W, D) {
  'use strict';
  if (W.__PSY_KANTO_PLAYABLE_V1__ || !W.PsyKantoJourneyV1) return;
  W.__PSY_KANTO_PLAYABLE_V1__ = true;

  const SAVE_KEY = 'psy_kanto_journey_progress_v1';
  const CAMPAIGN_KEY = 'psyKantoCampaignV1';
  const COLS = 32, ROWS = 20, TILE = 28;
  const SHEET_CELL = 512, AVATAR_ROOT = 'assets/characters/halloween/';
  const IDLE_FRAME = 0, WALK_FRAME_COLUMNS = [1, 3];
  const avatarImages = new Map();
  const GYM_FOR_PLACE = {
    pewter: 'kanto_brock', cerulean: 'kanto_misty', vermilion: 'kanto_surge',
    celadon: 'kanto_erika', fuchsia: 'kanto_koga', saffron: 'kanto_sabrina',
    cinnabar: 'kanto_blaine', 'viridian-gym': 'kanto_giovanni'
  };
  const THEMES = {
    city: {floor:'#9b8b6e', path:'#d7bd8b', wall:'#536251', accent:'#f4c76b', water:'#498da0', obstacle:'#425643'},
    route:{floor:'#46684a', path:'#c8ae73', wall:'#294936', accent:'#c6e27b', water:'#3483a1', obstacle:'#254231'},
    dungeon:{floor:'#4b4650', path:'#aaa08c', wall:'#24242d', accent:'#89b7be', water:'#315c71', obstacle:'#302e39'},
    landmark:{floor:'#6d6750', path:'#cfb96e', wall:'#3c4247', accent:'#f0d681', water:'#407e90', obstacle:'#343b36'}
  };
  const places = () => W.PsyKantoJourneyV1.places || [];
  const player = () => { try { return typeof P !== 'undefined' ? P : (W.P || {}); } catch (_) { return W.P || {}; } };
  const journeySave = () => { try { return JSON.parse(W.localStorage.getItem(SAVE_KEY) || '{}'); } catch (_) { return {}; } };
  const putJourneySave = s => { try { W.localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (_) {} };
  const state = () => {
    const p = player();
    if (!p[CAMPAIGN_KEY] || typeof p[CAMPAIGN_KEY] !== 'object') p[CAMPAIGN_KEY] = { places: {}, active: null };
    if (!p[CAMPAIGN_KEY].places || typeof p[CAMPAIGN_KEY].places !== 'object') p[CAMPAIGN_KEY].places = {};
    return p[CAMPAIGN_KEY];
  };
  const placeState = id => {
    const s = state();
    if (!s.places[id]) s.places[id] = { talked:false, found:[], solved:[], cleared:false };
    return s.places[id];
  };
  const saveProgress = () => { try { W.autoSave?.(); } catch (_) {} };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function badgeCount() {
    const p = player();
    const legacy = Number(p.gymsDefeated || 0);
    const ids = Array.isArray(p.gymProgress) ? p.gymProgress.filter(id => /^kanto_/.test(id)).length : 0;
    return Math.max(legacy, ids);
  }
  function discovered(place) {
    const s = journeySave();
    const values = Array.isArray(s[place.id]) ? s[place.id] : [];
    const own = placeState(place.id).found || [];
    return new Set([...values, ...own].map(Number).filter(id => place.species.includes(id))).size;
  }
  function isUnlocked(place) {
    if (!place) return false;
    if (place.id === 'pallet' || place.id === 'route-1') return true;
    if (place.id === 'viridian' && (journeySave().visited || []).includes('route-1')) return true;
    const all = places(), index = all.findIndex(p => p.id === place.id), prev = all[index - 1];
    if (!prev) return true;
    const saved = journeySave();
    const visited = Array.isArray(saved.visited) ? saved.visited : [];
    const prevOpen = visited.includes(prev.id);
    const badgeGate = Number(place.badge || prev.badge || 0);
    return prevOpen && badgeCount() >= badgeGate;
  }
  function objective(place) {
    if (place.id === 'route-1') return 3;
    return place.kind === 'route' || place.kind === 'dungeon' ? 2 : 1;
  }
  function objectivesMet(place) {
    const ps = placeState(place.id);
    const gym = GYM_FOR_PLACE[place.id];
    const gymDone = !gym || (Array.isArray(player().gymProgress) && player().gymProgress.includes(gym));
    return ps.talked && new Set(ps.found).size >= objective(place) && gymDone;
  }
  function markCleared(place) {
    const ps = placeState(place.id);
    ps.cleared = true;
    const saved = journeySave();
    saved.visited = [...new Set([...(saved.visited || []), place.id])];
    saved.activePlace = place.id;
    putJourneySave(saved);
    saveProgress();
  }

  function addStyles() {
    if (D.getElementById('psy-kanto-playable-style')) return;
    const style = D.createElement('style');
    style.id = 'psy-kanto-playable-style';
    style.textContent = `
      #psy-kanto-world{position:fixed;inset:0;z-index:14000;background:#070b12;color:#f6f0dc;display:none;font-family:system-ui,Arial,sans-serif;overscroll-behavior:contain}
      #psy-kanto-world.open{display:flex;flex-direction:column}
      #psy-kanto-world .kp-head{display:flex;align-items:center;gap:10px;justify-content:space-between;padding:10px 14px;background:#111927;border-bottom:1px solid #36445a;min-height:54px}
      #psy-kanto-world .kp-title{min-width:0}.kp-title b{display:block;color:#ffe09a;font-size:14px}.kp-title small{display:block;color:#aab5c2;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:56vw}
      #psy-kanto-world button{color:#fff;background:#1f3446;border:1px solid #668397;border-radius:9px;padding:9px 12px;font-weight:800;cursor:pointer;touch-action:manipulation}
      #psy-kanto-world .kp-close{background:#522d35;border-color:#b36b73;font-size:17px;padding:5px 12px}
      #psy-kanto-world .kp-stage{position:relative;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden;background:radial-gradient(ellipse at center,#182b33,#080c14 78%)}
      #psy-kanto-canvas{width:100%;height:100%;max-width:960px;max-height:100%;image-rendering:pixelated;border:1px solid #617180;border-radius:7px;box-shadow:0 12px 50px #0009;touch-action:none}
      #psy-kanto-world .kp-footer{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:center;padding:8px 12px calc(8px + env(safe-area-inset-bottom));background:#0d1420;border-top:1px solid #36445a}
      .kp-objective{font-size:12px;color:#d7e3e8;line-height:1.35}.kp-objective strong{color:#ffe09a}.kp-controls{display:grid;grid-template-columns:repeat(3,42px);grid-template-rows:repeat(2,38px);gap:3px}
      .kp-controls button{padding:0;font-size:17px;background:#243747}.kp-controls [data-dir="up"]{grid-column:2}.kp-controls [data-dir="left"]{grid-column:1;grid-row:2}.kp-controls [data-dir="down"]{grid-column:2;grid-row:2}.kp-controls [data-dir="right"]{grid-column:3;grid-row:2}
      .kp-interact{min-width:78px;min-height:58px;background:linear-gradient(135deg,#80521f,#b47b31)!important;border-color:#f4c76b!important;font-size:11px!important}
      #psy-kanto-dialog{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);width:min(620px,calc(100% - 24px));padding:13px 15px;background:#0a111df2;border:1px solid #e5c77e;border-radius:12px;box-shadow:0 10px 40px #000a;display:none;z-index:2}
      #psy-kanto-dialog.open{display:block}.kp-dialog-title{color:#ffe09a;font-weight:900;margin-bottom:5px}.kp-dialog-text{font-size:13px;line-height:1.45;color:#e4eaf0}.kp-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}
      .psy-kanto-enter-world{width:100%;margin:8px 0 12px;background:linear-gradient(110deg,#075985,#14532d)!important;border-color:#8be5ca!important}
      @media(max-width:650px){#psy-kanto-world .kp-head{padding:8px 10px}.kp-title small{max-width:58vw}#psy-kanto-canvas{width:100%;height:100%;border-radius:0}#psy-kanto-world .kp-footer{grid-template-columns:minmax(0,1fr) auto;padding:6px 8px calc(7px + env(safe-area-inset-bottom))}.kp-objective{grid-column:1/-1;font-size:11px}.kp-controls{grid-column:1;grid-row:2;grid-template-columns:repeat(3,38px);grid-template-rows:repeat(2,35px)}.kp-interact{grid-column:2;grid-row:2;min-width:72px}}
    `;
    D.head.appendChild(style);
  }

  const model = { root:null, canvas:null, ctx:null, place:null, map:null, x:3, y:ROWS-3, frame:0, direction:'down', held:null, lastMove:0, encounterAt:0, dialog:null, pendingGymPlace:null, resumeAfterEncounter:false, raf:0, atlasObserver:null, atlasNode:null };
  function makeRoot() {
    if (model.root) return model.root;
    addStyles();
    const root = D.createElement('div'); root.id = 'psy-kanto-world'; root.setAttribute('role','dialog'); root.setAttribute('aria-modal','true');
    root.innerHTML = `<header class="kp-head"><button type="button" data-back>← ATLAS</button><div class="kp-title"><b></b><small></small></div><button type="button" class="kp-close" aria-label="Fechar">×</button></header><div class="kp-stage"><canvas id="psy-kanto-canvas" width="896" height="560" aria-label="Mapa jogável de Kanto"></canvas><section id="psy-kanto-dialog"><div class="kp-dialog-title"></div><div class="kp-dialog-text"></div><div class="kp-dialog-actions"></div></section></div><footer class="kp-footer"><div class="kp-objective"></div><div class="kp-controls" aria-label="Controles de movimento"><button data-dir="up" aria-label="Cima">▲</button><button data-dir="left" aria-label="Esquerda">◀</button><button data-dir="down" aria-label="Baixo">▼</button><button data-dir="right" aria-label="Direita">▶</button></div><button type="button" class="kp-interact" data-interact>INTERAGIR</button></footer>`;
    D.body.appendChild(root); model.root = root; model.canvas = root.querySelector('canvas'); model.ctx = model.canvas.getContext('2d'); model.dialog = root.querySelector('#psy-kanto-dialog');
    root.querySelector('.kp-close').onclick = closeWorld;
    root.querySelector('[data-back]').onclick = () => { closeWorld(); W.openKantoJourneyV1?.(); };
    root.querySelector('[data-interact]').onclick = e => { e.preventDefault(); e.stopPropagation(); interact(); };
    root.querySelectorAll('[data-dir]').forEach(btn => {
      const dir = btn.dataset.dir;
      const start = e => { e.preventDefault(); model.held = dir; move(dir); };
      const stop = e => { e.preventDefault(); if (model.held === dir) { model.held = null; model.frame = 0; render(); } };
      btn.addEventListener('pointerdown', start); btn.addEventListener('pointerup', stop); btn.addEventListener('pointercancel', stop); btn.addEventListener('pointerleave', stop);
    });
    D.addEventListener('keydown', onKeyDown); D.addEventListener('keyup', onKeyUp);
    W.addEventListener('resize', render);
    return root;
  }
  function theme(place) { return THEMES[place.kind] || THEMES.route; }
  function hash(text) { let h=2166136261; for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)} return h>>>0; }
  function random(seed) { let n=seed>>>0; return () => { n=(n+0x6D2B79F5)>>>0; let t=n; t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296; }; }

  // Authored, connected campaign maps. 0 walkable, 1 path, 5 hunt grass,
  // 3 rock, 4 buildings and 9 solid boundary/trees/fence. All other locations
  // retain the procedural prototype until they receive authored layouts.
  function buildFirstKantoMap(place) {
    const g=Array.from({length:ROWS},()=>Array(COLS).fill(0));
    const rect=(x1,y1,x2,y2,t)=>{for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++)if(g[y]&&x>=0&&x<COLS)g[y][x]=t;};
    rect(0,0,31,0,9);rect(0,19,31,19,9);rect(0,0,0,19,9);rect(31,0,31,19,9);
    // Distinct north and south portals never intersect fences or buildings.
    rect(13,1,18,18,1);
    if(place.id==='pallet'){
      rect(1,1,10,4,9);rect(21,1,30,4,9);
      rect(2,6,10,11,4);rect(21,6,29,11,4);
      rect(2,14,9,17,4);rect(22,14,29,17,4);
      rect(11,5,20,6,1);rect(9,12,22,13,1);rect(10,17,21,18,1);
      rect(2,12,8,13,5);rect(23,12,29,13,5);
      rect(11,7,12,10,5);rect(19,7,20,10,5);
      rect(1,18,11,18,9);rect(20,18,30,18,9);
      return {grid:g,npc:{x:14,y:9},object:{x:18,y:12},exit:{x:15,y:1},entry:{x:15,y:17},secretGate:null,secretChest:null,seed:hash(place.id)};
    }
    // Route 1: four large grass habitats, each with an unobstructed walk-in
    // entrance from the shared path; no invisible or locked hunt corridor.
    rect(1,1,12,18,9);rect(19,1,30,18,9);
    rect(2,2,11,7,5);rect(20,2,29,7,5);
    rect(2,11,11,17,5);rect(20,11,29,17,5);
    rect(10,4,13,5,1);rect(18,5,21,6,1);
    rect(10,13,13,14,1);rect(18,13,21,14,1);
    rect(13,8,18,10,1);rect(13,17,18,18,1);
    // Decorative, impassable rocks stay outside all required crossings.
    g[3][3]=3;g[3][28]=3;g[16][3]=3;g[16][28]=3;
    return {grid:g,npc:{x:14,y:9},object:{x:17,y:9},exit:{x:15,y:1},entry:{x:15,y:17},secretGate:null,secretChest:null,seed:hash(place.id)};
  }

  function buildMap(place) {
    if(place.id==='pallet'||place.id==='route-1')return buildFirstKantoMap(place);
    const rnd=random(hash(place.id)), grid=Array.from({length:ROWS},(_,y)=>Array.from({length:COLS},(_,x)=>(x===0||y===0||x===COLS-1||y===ROWS-1)?9:0));
    const path=(x,y,t=1)=>{if(grid[y]&&grid[y][x]!==9)grid[y][x]=t};
    // Shared route through the generated location gives every map a clear route from entrance to NPC and exit.
    for(let x=2;x<16;x++)path(x,ROWS-3); for(let y=ROWS-3;y>=6;y--)path(15,y); for(let x=15;x<COLS-2;x++)path(x,6); for(let y=6;y<ROWS-2;y++)path(COLS-3,y);path(15,5);
    const terrain=place.kind==='route'?2:place.kind==='dungeon'?3:place.kind==='landmark'?4:0;
    for(let i=0;i<170;i++){
      const x=1+Math.floor(rnd()*(COLS-2)),y=1+Math.floor(rnd()*(ROWS-2));
      if(grid[y][x]!==0||Math.abs(x-15)<3||Math.abs(y-6)<2||Math.hypot(x-3,y-(ROWS-3))<3||Math.hypot(x-(COLS-3),y-(ROWS-3))<3)continue;
      if(rnd()<.55)grid[y][x]=terrain===2?2:terrain===3?3:terrain===4?4:5;
    }
    // Scatter habitat patches around the road; encounters happen only on these cells.
    const patches=[[4,4],[24,4],[5,13],[25,13],[10,9],[21,10]];
    patches.forEach(([cx,cy],i)=>{for(let y=cy-1;y<=cy+1;y++)for(let x=cx-2;x<=cx+2;x++)if(grid[y]?.[x]===0&&rnd()>.22)grid[y][x]=5;});
    // Keep the story object reachable from the main trail, then build a sealed
    // side chamber that opens only after the location's mystery is solved.
    for(let y=4;y<=ROWS-3;y++)path(5,y);
    const hasMystery=Array.isArray(place.mysteries)&&place.mysteries.length>0;
    const secretGate=hasMystery?{x:5,y:3}:null, secretChest=hasMystery?{x:5,y:2}:null;
    if(hasMystery){
      for(let x=3;x<=7;x++){grid[3][x]=9;grid[2][x]=9;}
      grid[2][5]=1;
      const solvedIds=new Set([...(player().kantoPuzzleFlags||[]),...(placeState(place.id).solved||[])]);
      if(place.mysteries.some(m=>solvedIds.has(m.id)))grid[3][5]=1;
    }
    // Landmark props: a sign, a story object, and the destination gate.
    const npc={x:15,y:4}, object={x:5,y:4}, exit={x:COLS-3,y:ROWS-3};
    grid[npc.y][npc.x]=1; grid[object.y][object.x]=1; grid[exit.y][exit.x]=1;
    return {grid,npc,object,exit,secretGate,secretChest,seed:hash(place.id)};
  }
  function openWorld(id) {
    const place=places().find(p=>p.id===id); if(!place)return;
    if(!isUnlocked(place)){W.notif?.('🔒 Conclua o capítulo anterior e obtenha as insígnias exigidas.',2600);return;}
    makeRoot(); model.place=place; model.map=buildMap(place); model.x=model.map.entry?.x??3; model.y=model.map.entry?.y??ROWS-3; model.direction='down';model.frame=0;model.held=null;
    state().active=place.id;
    model.root.querySelector('.kp-title b').textContent=place.name;
    model.root.querySelector('.kp-title small').textContent=`${place.mark} · mapa com colisões definidas`;
    model.root.classList.add('open'); model.dialog.classList.remove('open'); updateObjective(); render();
    if(!model.raf)tick();
  }
  function closeWorld() { model.held=null;model.root?.classList.remove('open');model.dialog?.classList.remove('open');cancelAnimationFrame(model.raf);model.raf=0; }
  function onKeyDown(e) {
    if(!model.root?.classList.contains('open'))return;
    e.stopPropagation();
    const dirs={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
    const dir=dirs[e.code]; if(dir){e.preventDefault();if(!e.repeat){model.held=dir;move(dir)}return;}
    if(e.code==='KeyE'||e.code==='Enter'||e.code==='Space'){e.preventDefault();interact();}
    if(e.code==='Escape'){e.preventDefault();closeWorld();}
  }
  function onKeyUp(e) { if(!model.root?.classList.contains('open'))return;e.stopPropagation();const dirs={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};if(dirs[e.code]===model.held){model.held=null;model.frame=0;render();} }
  function move(dir) {
    if(!model.place||!model.root?.classList.contains('open'))return;
    const step={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[dir];if(!step)return;
    const nx=model.x+step[0],ny=model.y+step[1];if(nx<1||ny<1||nx>=COLS-1||ny>=ROWS-1)return;
    model.direction=dir;
    const tile=model.map.grid[ny][nx];if(tile===9||tile===3||tile===4)return;
    model.x=nx;model.y=ny;model.frame=(model.frame+1)%WALK_FRAME_COLUMNS.length;
    if(tile===5)maybeEncounter();
    if(nx===model.map.exit.x&&ny===model.map.exit.y)interact();
    updateObjective();render();
  }
  function maybeEncounter() {
    if(Date.now()-model.encounterAt<2600||!model.place)return;
    if(Math.random()>.16)return;
    const p=player();if(!Array.isArray(p.team)||!p.team.length){showDialog('Equipe necessária','Escolha seu Pokémon inicial antes de explorar a rota.');return;}
    model.encounterAt=Date.now();
    const oldGet=W.getPokesForHunt, save=journeySave();
    const selectedHunt=(model.place.hunts||[]).find(h=>h.id===save.activeHunt);
    const ids=(selectedHunt?.species?.length?selectedHunt.species:model.place.species).slice();
    const ps=placeState(model.place.id);
    W.getPokesForHunt=function(region,type,tier){
      if(region==='kanto'&&type==='normal'&&Number(tier)===1)return ids.map(id=>({id,name:W.getPokeName?.(id)||`Pokémon #${id}`,type:W.TYPE_BY_ID_ALL?.[id]||'Normal'}));
      return typeof oldGet==='function'?oldGet.apply(this,arguments):[];
    };
    try { W.triggerWild?.('kanto_normal_t1'); }
    finally { if(oldGet)W.getPokesForHunt=oldGet; else delete W.getPokesForHunt; }
    const wild=W.battleData?.wild || (typeof battleData!=='undefined'?battleData?.wild:null);
    if(wild?.id){if(!ps.found.includes(Number(wild.id)))ps.found.push(Number(wild.id));const saved=journeySave();saved[model.place.id]=[...new Set([...(saved[model.place.id]||[]),Number(wild.id)])];putJourneySave(saved);saveProgress();}
    updateObjective();
  }
  function nearby(point) { return Math.abs(model.x-point.x)+Math.abs(model.y-point.y)<=1; }
  function showDialog(title,text,actions=[]) {
    const d=model.dialog;d.querySelector('.kp-dialog-title').textContent=title;d.querySelector('.kp-dialog-text').textContent=text;
    const box=d.querySelector('.kp-dialog-actions');box.replaceChildren();
    actions.forEach(({label,onClick,primary=false})=>{const b=D.createElement('button');b.textContent=label;if(primary)b.style.background='linear-gradient(100deg,#075985,#166534)';b.onclick=()=>{d.classList.remove('open');onClick?.()};box.appendChild(b)});
    if(!actions.length){const b=D.createElement('button');b.textContent='CONTINUAR';b.onclick=()=>d.classList.remove('open');box.appendChild(b)}
    d.classList.add('open');
  }
  function interact() {
    if(!model.place)return;
    const place=model.place, ps=placeState(place.id), gymId=GYM_FOR_PLACE[place.id];
    if(nearby(model.map.npc)){
      ps.talked=true;saveProgress();
      const needs=Math.max(0,objective(place)-new Set(ps.found).size),gymDone=!gymId||(Array.isArray(player().gymProgress)&&player().gymProgress.includes(gymId));
      const actions=[];
      if(gymId&&!gymDone&&typeof W.startGymBattle==='function')actions.push({label:'DESAFIAR GINÁSIO',primary:true,onClick:()=>{model.pendingGymPlace=place.id;closeWorld();W.startGymBattle(gymId)}});
      showDialog(place.npc,needs?`${place.quest} Encontre ${needs} espécie(s) no habitat marcado e volte para concluir.`:!gymDone?`${place.quest} Seu registro da região está bom; falta vencer o ginásio para concluir este capítulo.`:place.quest,actions);
      updateObjective();return;
    }
    if(nearby(model.map.object)){
      const solvedFlags=new Set([...(player().kantoPuzzleFlags||[]),...ps.solved]);
      const mystery=(place.mysteries||[]).find(m=>!solvedFlags.has(m.id));
      if(!mystery){showDialog('Ponto de interesse','Você examinou os sinais do local.');return;}
      const technique=mystery.technique, learned=!technique||W.PsyKantoJourneyV1.hasTechnique(technique);
      if(!learned){const name=technique.replace(/-/g,' ');showDialog(mystery.name,`${mystery.clue} Para abrir esta passagem, aprenda ${name} com um instrutor de Kanto.`);return;}
      if(mystery.kind==='riddle'&&Array.isArray(mystery.choices)){
        const choices=mystery.choices.map(([label,value])=>({label,onClick:()=>{
          const ok=W.PsyKantoJourneyV1.solveMystery(place,mystery,value);
          if(ok){if(!ps.solved.includes(mystery.id))ps.solved.push(mystery.id);if(model.map.secretGate)model.map.grid[model.map.secretGate.y][model.map.secretGate.x]=1;saveProgress();W.PsyKantoJourneyV1.refresh?.(place.id);showDialog(mystery.name,'A resposta correta abriu a passagem secreta.');render();}
          else showDialog(mystery.name,'A pista ainda não foi resolvida. Observe novamente os detalhes do enigma.');
        }}));
        showDialog(mystery.name,mystery.clue,choices);return;
      }
      const ok=W.PsyKantoJourneyV1.solveMystery(place,mystery);
      if(ok){if(!ps.solved.includes(mystery.id))ps.solved.push(mystery.id);if(model.map.secretGate)model.map.grid[model.map.secretGate.y][model.map.secretGate.x]=1;saveProgress();W.PsyKantoJourneyV1.refresh?.(place.id);showDialog(mystery.name,`${mystery.clue} O mecanismo cedeu e abriu uma passagem lateral.`);}
      else showDialog(mystery.name,'Ainda não foi possível abrir o mecanismo. Confira a técnica de campo exigida.');
      updateObjective();render();return;
    }
    if(model.map.secretChest&&model.map.grid[model.map.secretGate.y][model.map.secretGate.x]===1&&nearby(model.map.secretChest)){
      showDialog('Passagem secreta','Você encontrou a câmara oculta. A recompensa do enigma já foi registrada na sua jornada.');return;
    }
    if(nearby(model.map.exit)){
      if(place.id!=='pallet'&&place.id!=='route-1'&&!objectivesMet(place)){
        const count=new Set(ps.found).size, need=objective(place);
        showDialog('Saída bloqueada',`Converse com ${place.npc}, registre ${need} espécie(s) neste local${GYM_FOR_PLACE[place.id]?' e vença o ginásio':''}. Progresso: ${count}/${need}.`);return;
      }
      markCleared(place);
      if(place.id==='indigo')showDialog('Capítulos de Kanto concluídos','A exploração regional foi concluída. A Elite Four e o Campeão ainda precisam de uma arena de história própria para fechar a campanha completa.');
      else {
        const all=places(),next=all[all.findIndex(p=>p.id===place.id)+1];
        const actions=[];
        if(next&&(isUnlocked(next)||place.id==='pallet'||place.id==='route-1'))actions.push({label:`SEGUIR PARA ${next.name.toUpperCase()}`,primary:true,onClick:()=>openWorld(next.id)});
        actions.push({label:'VOLTAR AO ATLAS',onClick:()=>{closeWorld();W.openKantoJourneyV1?.()}});
        showDialog('Capítulo concluído',`${place.name} foi concluída. A próxima parada está liberada.`,actions);
      }
      updateObjective();return;
    }
    const feature=(place.mysteries||[])[0];
    if(feature&&nearby({x:5,y:4})){showDialog(feature.name,feature.clue);return;}
    showDialog('Exploração','Use as setas ou WASD para caminhar. Pressione E perto de personagens, pontos de interesse ou da saída.');
  }
  function updateObjective() {
    if(!model.place||!model.root)return;
    const place=model.place, ps=placeState(place.id), need=objective(place), count=new Set(ps.found).size, gym=GYM_FOR_PLACE[place.id], gymDone=!gym||(Array.isArray(player().gymProgress)&&player().gymProgress.includes(gym));
    const items=[`Fale com <strong>${esc(place.npc)}</strong>: ${ps.talked?'✅':'◻'}`,`Registre espécies: <strong>${Math.min(count,need)}/${need}</strong>`];
    if(gym)items.push(`Ginásio: <strong>${gymDone?'✅ vencido':'pendente'}</strong>`);
    items.push(place.id==='pallet'||place.id==='route-1'?'Saída norte livre · caminhe pela grama para encontrar Pokémon':'Saída em <strong>E</strong> quando concluir · Encontre habitats marcados com grama');
    model.root.querySelector('.kp-objective').innerHTML=items.join(' · ');
  }
  function render() {
    if(!model.place||!model.ctx||!model.root?.classList.contains('open'))return;
    const stage=model.root.querySelector('.kp-stage');
    if(stage){const rw=Math.max(300,Math.round(Math.min(960,stage.clientWidth))),rh=Math.max(300,Math.round(stage.clientHeight));if(model.canvas.width!==rw)model.canvas.width=rw;if(model.canvas.height!==rh)model.canvas.height=rh;}
    const c=model.ctx, cw=model.canvas.width, ch=model.canvas.height, th=theme(model.place), g=model.map.grid;
    c.imageSmoothingEnabled=false;c.clearRect(0,0,cw,ch);c.fillStyle='#111722';c.fillRect(0,0,cw,ch);
    const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
    const offsetX=clamp(Math.floor(cw/2-(model.x+.5)*TILE),Math.min(0,cw-COLS*TILE),0);
    const offsetY=clamp(Math.floor(ch/2-(model.y+.5)*TILE),Math.min(0,ch-ROWS*TILE),0);
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
      const t=g[y][x],sx=offsetX+x*TILE,sy=offsetY+y*TILE;
      c.fillStyle=t===9?'#264935':t===1?'#d1ac77':t===3?'#746d64':t===4?'#866b52':t===5?'#438c42':th.floor;c.fillRect(sx,sy,TILE,TILE);
      if(t===1){c.fillStyle='#ffffff10';c.fillRect(sx+2,sy+2,TILE-4,2)}
      if(t===2){c.fillStyle='#79bd73';c.fillRect(sx+4,sy+5,3,10);c.fillRect(sx+17,sy+2,3,12);c.fillStyle='#315a38';c.fillRect(sx+10,sy+17,5,8)}
      if(t===3){c.fillStyle='#171920';c.beginPath();c.arc(sx+14,sy+14,10,0,Math.PI*2);c.fill();c.fillStyle='#716a64';c.beginPath();c.moveTo(sx+4,sy+22);c.lineTo(sx+8,sy+6);c.lineTo(sx+14,sy+3);c.lineTo(sx+21,sy+9);c.lineTo(sx+24,sy+22);c.closePath();c.fill()}
      if(t===4){c.fillStyle='#41515a';c.fillRect(sx+4,sy+8,19,15);c.fillStyle='#85949b';c.fillRect(sx+7,sy+5,13,3)}
      if(t===4){c.fillStyle='#b3423b';c.fillRect(sx+2,sy+3,TILE-4,10);c.fillStyle='#dec8a1';c.fillRect(sx+5,sy+14,TILE-10,12)}
      if(t===5){c.fillStyle=th.accent;c.globalAlpha=.7;c.fillRect(sx+8,sy+7,2,12);c.fillRect(sx+17,sy+11,2,10);c.globalAlpha=1}
      if(t===9){c.fillStyle='#426d3e';c.beginPath();c.arc(sx+14,sy+12,12,0,Math.PI*2);c.fill();c.fillStyle='#0004';c.fillRect(sx,sy+TILE-4,TILE,4)}
    }
    const marker=(pt,color,glyph,label)=>{const sx=offsetX+pt.x*TILE+TILE/2,sy=offsetY+pt.y*TILE+TILE/2;c.fillStyle=color;c.beginPath();c.arc(sx,sy,10,0,Math.PI*2);c.fill();c.fillStyle='#17202a';c.font='bold 12px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(glyph,sx,sy+1);c.font='bold 10px system-ui';const text=label.length>22?label.slice(0,20)+'…':label,tw=Math.min(190,c.measureText(text).width+12);c.fillStyle='#071019d9';c.fillRect(sx-tw/2,sy-29,tw,14);c.fillStyle='#fff';c.textBaseline='middle';c.fillText(text,sx,sy-22)};
    marker(model.map.npc,'#ffcf70','!',model.place.npc);marker(model.map.object,'#75d5db','?','Pista / segredo');marker(model.map.exit,objectivesMet(model.place)?'#79df94':'#cb7474','›','Próxima rota');
    if(model.map.secretChest&&model.map.grid[model.map.secretGate.y][model.map.secretGate.x]===1)marker(model.map.secretChest,'#a4e7a0','★','Recompensa do enigma');
    const px=offsetX+model.x*TILE+TILE/2,py=offsetY+model.y*TILE+TILE/2;
    const avatar=selectedAvatar();
    if(avatar?.ready){
      const row=({down:0,left:1,right:2,up:3})[model.direction]??0;
      const sourceFrame=model.held?WALK_FRAME_COLUMNS[model.frame%WALK_FRAME_COLUMNS.length]:IDLE_FRAME;
      drawNormalizedAvatar(c,avatar,row,sourceFrame,px,py+8);
    }else{
      c.fillStyle='#141a23';c.beginPath();c.ellipse(px,py+8,8,4,0,0,Math.PI*2);c.fill();
      c.fillStyle='#e8c492';c.beginPath();c.arc(px,py-4,6,0,Math.PI*2);c.fill();c.fillStyle='#315777';c.fillRect(px-6,py+1,12,10);c.fillStyle='#f2f0e8';c.fillRect(px-5,py+11,4,4);c.fillRect(px+2,py+11,4,4);
    }
    c.fillStyle='#fff';c.font='bold 12px system-ui';c.textAlign='center';c.textBaseline='alphabetic';c.fillText(player().name||'Treinador',px,py-18);
  }
  function selectedAvatar(){
    const p=player(),id=p.playerCharacterId,character=(W.PsyHalloweenCharacters||[]).find(c=>c.id===id);
    if(!character)return null;
    const key=character.costumes?.[p.playerCostumeByCharacter?.[id]]?p.playerCostumeByCharacter[id]:'basic';
    const filename=character.costumes?.[key];if(!filename)return null;
    const url=AVATAR_ROOT+filename;
    if(avatarImages.has(url))return avatarImages.get(url);
    const entry={image:new Image(),ready:false,frameBounds:null,frameScale:1,frameCols:4};
    entry.image.onload=()=>{entry.ready=true;prepareAvatarFrames(entry);render()};entry.image.onerror=()=>{avatarImages.delete(url)};entry.image.src=url;avatarImages.set(url,entry);
    return entry;
  }
  function prepareAvatarFrames(avatar) {
    try {
      const image=avatar.image, scan=D.createElement('canvas');
      scan.width=image.naturalWidth||SHEET_CELL*4;scan.height=image.naturalHeight||SHEET_CELL*4;
      const ctx=scan.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
      const pixels=ctx.getImageData(0,0,scan.width,scan.height).data;
      const cols=Math.floor(scan.width/SHEET_CELL),rows=Math.floor(scan.height/SHEET_CELL),bounds=[];
      let maxW=1,maxH=1;
      for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
        let minX=SHEET_CELL,minY=SHEET_CELL,maxX=-1,maxY=-1;
        const x0=col*SHEET_CELL,y0=row*SHEET_CELL;
        for(let y=0;y<SHEET_CELL;y++)for(let x=0;x<SHEET_CELL;x++){
          if(pixels[((y0+y)*scan.width+x0+x)*4+3]>32){
            if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
          }
        }
        const box=maxX<0?{x:0,y:0,w:SHEET_CELL,h:SHEET_CELL}:{x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1};
        bounds.push(box);maxW=Math.max(maxW,box.w);maxH=Math.max(maxH,box.h);
      }
      avatar.frameBounds=bounds;avatar.frameCols=cols;avatar.frameScale=Math.min(46/maxW,46/maxH);
    } catch (_) { avatar.frameBounds=null;avatar.frameScale=1; }
  }
  function drawNormalizedAvatar(ctx,avatar,row,col,centerX,baselineY) {
    const image=avatar.image,cols=avatar.frameCols||4,index=row*cols+col,box=avatar.frameBounds?.[index];
    if(!box){ctx.drawImage(image,col*SHEET_CELL,row*SHEET_CELL,SHEET_CELL,SHEET_CELL,centerX-25,baselineY-50,50,50);return;}
    const scale=avatar.frameScale||1,w=box.w*scale,h=box.h*scale;
    ctx.drawImage(image,col*SHEET_CELL+box.x,row*SHEET_CELL+box.y,box.w,box.h,centerX-w/2,baselineY-h,w,h);
  }
  function tick() {
    if(!model.root?.classList.contains('open')){model.raf=0;return;}
    const now=performance.now();if(model.held&&now-model.lastMove>160){model.lastMove=now;move(model.held)}
    render();model.raf=requestAnimationFrame(tick);
  }
  function injectEntryButton() {
    const detail=D.querySelector('#psy-kanto-atlas .psy-kanto-detail');if(!detail)return;
    const title=detail.querySelector('h3')?.textContent?.trim();if(!title)return;
    const place=places().find(p=>p.name===title);if(!place||detail.querySelector('.psy-kanto-enter-world'))return;
    const button=D.createElement('button');button.className='psy-kanto-enter-world';button.type='button';button.textContent=isUnlocked(place)?'ENTRAR NA LOCALIDADE':'🔒 CAPÍTULO BLOQUEADO';button.disabled=!isUnlocked(place);button.onclick=()=>openWorld(place.id);
    detail.insertBefore(button,detail.querySelector('.psy-kanto-detail-kicker')?.nextSibling||detail.firstChild);
  }
  function monitorAtlas() {
    const atlas=D.getElementById('psy-kanto-atlas');if(!atlas)return;
    const detail=atlas.querySelector('.psy-kanto-detail');if(!detail)return;
    if(model.atlasNode!==detail){
      if(model.atlasObserver)model.atlasObserver.disconnect();
      model.atlasNode=detail;model.atlasObserver=new MutationObserver(injectEntryButton);model.atlasObserver.observe(detail,{childList:true,subtree:true});
    }
    injectEntryButton();
  }
  function wrapEncounter() {
    const oldStart=W.startBattle;if(typeof oldStart==='function'&&!oldStart.__psyKantoPlayableWrapped){
      const wrapped=function(wild){
        const wasOpen=!!model.root?.classList.contains('open');
        const encounterPlace=wasOpen?model.place:null;
        if(wasOpen){model.resumeAfterEncounter=true;model.held=null;model.root.classList.remove('open');cancelAnimationFrame(model.raf);model.raf=0;}
        const result=oldStart.apply(this,arguments);
        try{
          const place=encounterPlace, battleWild=wild||W.battleData?.wild||(typeof battleData!=='undefined'?battleData?.wild:null);
          if(place&&battleWild?.id){
            const ps=placeState(place.id),id=Number(battleWild.id);if(place.species.includes(id)&&!ps.found.includes(id))ps.found.push(id);
            const saved=journeySave();saved[place.id]=[...new Set([...(saved[place.id]||[]),id])];putJourneySave(saved);saveProgress();updateObjective();
          }
        }catch(_){}
        return result;
      };
      wrapped.__psyKantoPlayableWrapped=true;W.startBattle=wrapped;
    }
    const oldEnd=W.endBattle;if(typeof oldEnd==='function'&&!oldEnd.__psyKantoPlayableWrapped){
      const wrapped=function(won){
        const gym=model.pendingGymPlace,place=places().find(p=>p.id===gym),gymId=place&&GYM_FOR_PLACE[place.id];
        if(won&&place&&gymId&&Array.isArray(player().gymProgress)&&player().gymProgress.includes(gymId)){model.pendingGymPlace=null;markCleared(place);}
        const result=oldEnd.apply(this,arguments);
        if(model.resumeAfterEncounter){model.resumeAfterEncounter=false;W.setTimeout(()=>{if(model.place){model.root?.classList.add('open');updateObjective();render();if(!model.raf)tick()}},0)}
        if(place&&gymId&&won){W.setTimeout(()=>{model.place=place;updateObjective()},0)}return result;
      };
      wrapped.__psyKantoPlayableWrapped=true;W.endBattle=wrapped;
    }
  }

  const oldOpenAtlas=W.openKantoJourneyV1;
  if(typeof oldOpenAtlas==='function')W.openKantoJourneyV1=function(){const result=oldOpenAtlas.apply(this,arguments);W.setTimeout(monitorAtlas,0);return result;};
  W.setTimeout(monitorAtlas,0);wrapEncounter();
  W.PsyKantoPlayableV1={version:1,open:openWorld,close:closeWorld,isUnlocked,objective,progress:()=>state()};
})(window,document);
