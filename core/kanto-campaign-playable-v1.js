/* PSYWORLD — Kanto playable campaign layer V1. */
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
    const saved = journeySave();
    const visited = Array.isArray(saved.visited) ? saved.visited : [];
    const cleared = Array.isArray(saved.cleared) ? saved.cleared : [];
    const needsVisited = Array.isArray(place.requiresVisited) ? place.requiresVisited : [];
    const needsCleared = Array.isArray(place.requiresCleared) ? place.requiresCleared : [];
    return needsVisited.every(id => visited.includes(id)) &&
      needsCleared.every(id => cleared.includes(id)) && badgeCount() >= Number(place.badge || 0);
  }
  function hasTeleport() {
    const p=player();
    return !!p.meta?.kantoTeleportUnlocked || (Array.isArray(p.gymProgress)&&p.gymProgress.includes('kanto_sabrina'));
  }
  function objective(place) {
    if (place.id === 'route-1') return 3;
    return place.kind === 'route' || place.kind === 'dungeon' ? 2 : 1;
  }
  function objectivesMet(place) {
    if(place.id==='pallet')return true;
    const ps = placeState(place.id);
    const gym = GYM_FOR_PLACE[place.id];
    if(place.kind==='city'&&!gym)return true;
    const gymDone = !gym || (Array.isArray(player().gymProgress) && player().gymProgress.includes(gym));
    // City maps do not contain wild habitats. Their chapter exit depends on
    // speaking to the local cast and, when present, winning the city gym.
    const habitatDone = place.kind==='city' || new Set(ps.found).size >= objective(place);
    return ps.talked && habitatDone && gymDone;
  }
  function markCleared(place) {
    const ps = placeState(place.id);
    ps.cleared = true;
    const saved = journeySave();
    saved.visited = [...new Set([...(saved.visited || []), place.id])];
    saved.cleared = [...new Set([...(saved.cleared || []), place.id])];
    saved.activePlace = place.id;
    putJourneySave(saved);
    saveProgress();
  }
  function markVisited(id) {
    const saved=journeySave();
    saved.visited=[...new Set([...(saved.visited||[]),id])];
    saved.activePlace=id;
    putJourneySave(saved);
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
      #psy-kanto-canvas{width:min(100vw,calc((100vh - 150px)*1.6));height:min(calc(100vh - 150px),62.5vw);max-width:100%;max-height:100%;image-rendering:pixelated;border:1px solid #617180;border-radius:7px;box-shadow:0 12px 50px #0009;touch-action:none}
      #psy-kanto-world .kp-footer{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:8px 12px calc(8px + env(safe-area-inset-bottom));background:#0d1420;border-top:1px solid #36445a}
      .kp-objective{font-size:12px;color:#d7e3e8;line-height:1.35}.kp-objective strong{color:#ffe09a}.kp-controls{display:none!important}
      .kp-controls button{padding:0;font-size:17px;background:#243747}.kp-controls [data-dir="up"]{grid-column:2}.kp-controls [data-dir="left"]{grid-column:1;grid-row:2}.kp-controls [data-dir="down"]{grid-column:2;grid-row:2}.kp-controls [data-dir="right"]{grid-column:3;grid-row:2}
      .kp-interact{min-width:78px;min-height:58px;background:linear-gradient(135deg,#80521f,#b47b31)!important;border-color:#f4c76b!important;font-size:11px!important}
      .kp-art-flash{position:absolute;inset:0;z-index:3;background:#fff;opacity:0;pointer-events:none;transition:opacity .12s ease}.kp-art-flash.on{opacity:.95}.kp-art-flash.off{opacity:0;transition:opacity .24s ease}
      #psy-kanto-dialog{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);width:min(620px,calc(100% - 24px));padding:13px 15px;background:#0a111df2;border:1px solid #e5c77e;border-radius:12px;box-shadow:0 10px 40px #000a;display:none;z-index:2}
      #psy-kanto-dialog.open{display:grid;grid-template-columns:72px minmax(0,1fr);gap:10px}.kp-dialog-portrait{width:72px;height:82px;position:relative;display:grid;place-items:center;border:1px solid #72829a;border-radius:10px;background:linear-gradient(150deg,#26354a,#121927);overflow:hidden}.kp-dialog-portrait img{width:100%;height:100%;object-fit:cover;object-position:50% 16%;image-rendering:pixelated}.kp-dialog-portrait.expression-art img{object-fit:contain;object-position:center}.kp-dialog-portrait.expression-art .kp-dialog-face{display:none}.kp-dialog-face{position:absolute;top:18%;left:26%;width:48%;height:22%;pointer-events:none}.kp-dialog-face:before{content:'';position:absolute;left:4%;top:22%;width:92%;height:2px;background:linear-gradient(90deg,transparent 0 5%,#49313b 5% 38%,transparent 38% 62%,#49313b 62% 95%,transparent 95%);transform:rotate(2deg)}.kp-dialog-face:after{content:'';position:absolute;left:34%;top:72%;width:32%;height:3px;border-bottom:2px solid #713c42;border-radius:50%}.kp-dialog-portrait[data-emotion=curious] .kp-dialog-face:before{transform:rotate(-7deg);height:3px}.kp-dialog-portrait[data-emotion=worried] .kp-dialog-face:before{transform:rotate(8deg)}.kp-dialog-portrait[data-emotion=worried] .kp-dialog-face:after{top:64%;width:22%;left:39%;height:5px;border:2px solid #713c42;border-bottom:0;border-radius:50% 50% 0 0}.kp-dialog-portrait[data-emotion=happy] .kp-dialog-face:after{top:62%;height:8px;border:0;border-bottom:3px solid #713c42;border-radius:0 0 50% 50%}.kp-dialog-portrait[data-emotion=determined] .kp-dialog-face:before{transform:rotate(-9deg);background:linear-gradient(90deg,transparent 0 5%,#332b38 5% 38%,transparent 38% 62%,#332b38 62% 95%,transparent 95%)}.kp-dialog-portrait[data-emotion=determined] .kp-dialog-face:after{width:25%;left:37%;height:2px;border-bottom:2px solid #713c42;border-radius:0}.kp-dialog-portrait[data-emotion=happy]{background:linear-gradient(150deg,#3a4938,#171927)}.kp-dialog-portrait[data-emotion=determined]{background:linear-gradient(150deg,#59402a,#171927)}.kp-dialog-copy{min-width:0}.kp-dialog-title{color:#ffe09a;font-weight:900;margin-bottom:5px}.kp-dialog-text{font-size:13px;line-height:1.45;color:#e4eaf0}.kp-dialog-actions{grid-column:1/-1;display:flex;justify-content:flex-end;gap:8px;margin-top:2px}
      .psy-kanto-enter-world{width:100%;margin:8px 0 12px;background:linear-gradient(110deg,#075985,#14532d)!important;border-color:#8be5ca!important}
      .kp-touch-stick{position:absolute;z-index:4;width:88px;height:88px;margin:-44px 0 0 -44px;border:2px solid #c8edff9c;border-radius:50%;background:#13243a66;box-shadow:0 2px 16px #0008;pointer-events:none;touch-action:none}
      .kp-touch-stick:after{content:'';position:absolute;left:50%;top:50%;width:32px;height:32px;margin:-16px;border:2px solid #effbff;border-radius:50%;background:#59c3e899;transform:translate(var(--stick-x,0),var(--stick-y,0));box-shadow:0 2px 9px #0007}
      @media(max-width:650px){#psy-kanto-world .kp-head{padding:8px 10px}.kp-title small{max-width:58vw}#psy-kanto-canvas{width:100vw;height:min(calc(100vh - 150px),62.5vw);border-radius:0}#psy-kanto-world .kp-footer{grid-template-columns:minmax(0,1fr) auto;padding:6px 8px calc(7px + env(safe-area-inset-bottom))}.kp-objective{font-size:11px}.kp-interact{min-width:72px}}
    `;
    D.head.appendChild(style);
  }

  const model = { root:null, canvas:null, ctx:null, place:null, map:null, x:3, y:ROWS-3, frame:0, direction:'down', held:null, lastMove:0, motion:null, encounterAt:0, dialog:null, pendingGymPlace:null, resumeAfterEncounter:false, raf:0, atlasObserver:null, atlasNode:null };
  function makeRoot() {
    if (model.root) return model.root;
    addStyles();
    const root = D.createElement('div'); root.id = 'psy-kanto-world'; root.setAttribute('role','dialog'); root.setAttribute('aria-modal','true');
    root.innerHTML = `<header class="kp-head"><button type="button" data-back>← CIDADE</button><div class="kp-title"><b></b><small></small></div><button type="button" data-campaign>CONTINUAR</button><button type="button" class="kp-close" aria-label="Fechar">×</button></header><div class="kp-stage"><canvas id="psy-kanto-canvas" width="896" height="560" aria-label="Mapa jogável de Kanto"></canvas><section id="psy-kanto-dialog"><div class="kp-dialog-portrait" data-emotion="neutral"><img alt=""><span class="kp-dialog-face" aria-hidden="true"></span></div><div class="kp-dialog-copy"><div class="kp-dialog-title"></div><div class="kp-dialog-text"></div></div><div class="kp-dialog-actions"></div></section></div><footer class="kp-footer"><div class="kp-objective"></div><div class="kp-controls" aria-hidden="true"></div><button type="button" class="kp-interact" data-interact>INTERAGIR</button></footer>`;
    D.body.appendChild(root); model.root = root; model.canvas = root.querySelector('canvas'); model.ctx = model.canvas.getContext('2d'); model.dialog = root.querySelector('#psy-kanto-dialog');
    root.querySelector('.kp-close').onclick = closeWorld;
    root.querySelector('[data-back]').onclick = () => closeWorld();
    root.querySelector('[data-campaign]').onclick = advanceCampaign;
    root.querySelector('[data-interact]').onclick = e => { e.preventDefault(); e.stopPropagation(); interact(); };
    root.querySelectorAll('[data-dir]').forEach(btn => {
      const dir = btn.dataset.dir;
      const start = e => { e.preventDefault(); model.held = dir; move(dir); };
      const stop = e => { e.preventDefault(); if (model.held === dir) { model.held = null; model.frame = 0; render(); } };
      btn.addEventListener('pointerdown', start); btn.addEventListener('pointerup', stop); btn.addEventListener('pointercancel', stop); btn.addEventListener('pointerleave', stop);
    });
    const stage=root.querySelector('.kp-stage');
    let touch=null,stick=null;
    const finishTouch=e=>{
      if(!touch||e.pointerId!==touch.id)return;
      touch=null;model.held=null;model.frame=0;stick?.remove();stick=null;render();
    };
    stage.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse'||e.target.closest('button,#psy-kanto-dialog'))return;
      e.preventDefault();stage.setPointerCapture?.(e.pointerId);
      const r=stage.getBoundingClientRect();touch={id:e.pointerId,x:e.clientX-r.left,y:e.clientY-r.top,dir:null};
      stick=D.createElement('div');stick.className='kp-touch-stick';stick.style.left=touch.x+'px';stick.style.top=touch.y+'px';stage.appendChild(stick);
    });
    stage.addEventListener('pointermove',e=>{
      if(!touch||e.pointerId!==touch.id)return;e.preventDefault();
      const r=stage.getBoundingClientRect(),dx=e.clientX-r.left-touch.x,dy=e.clientY-r.top-touch.y;
      const length=Math.hypot(dx,dy),scale=length>28?28/length:1;
      stick?.style.setProperty('--stick-x',(dx*scale)+'px');stick?.style.setProperty('--stick-y',(dy*scale)+'px');
      if(length<9)return;
      const dir=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
      if(touch.dir!==dir){touch.dir=dir;model.held=dir;move(dir)}
    });
    stage.addEventListener('pointerup',finishTouch);stage.addEventListener('pointercancel',finishTouch);stage.addEventListener('lostpointercapture',finishTouch);
    D.addEventListener('keydown', onKeyDown); D.addEventListener('keyup', onKeyUp);
    W.addEventListener('resize', render);
    W.addEventListener('psy-kanto-art-ready', () => {
      if (model.root?.classList.contains('open')) W.requestAnimationFrame(render);
    });
    return root;
  }
  function theme(place) { return THEMES[place.kind] || THEMES.route; }
  function hash(text) { let h=2166136261; for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)} return h>>>0; }
  function random(seed) { let n=seed>>>0; return () => { n=(n+0x6D2B79F5)>>>0; let t=n; t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296; }; }
  function authoredMapProvider(place) {
    // Campaign maps require an actual approved Library artwork and its aligned collision grid.
    return W.PsyKantoCampaignArtV1?.build?.(place) || null;
  }
  function hasAuthoredMap(place) { return !!authoredMapProvider(place); }
  function buildMap(place) {
    const provided=authoredMapProvider(place);
    if(provided?.authoredKind==='pallet'&&!W.PsyKantoAuthoredMapsV1?.get?.('pallet'))return {grid:[],width:0,height:0,authoredKind:null};
    const authoredKind=provided?.authoredKind||(place.id==='route-1'?'route':null);
    if(authoredKind&&provided?.grid){
      if(authoredKind==='pallet'){
        const town=W.PsyKantoAuthoredMapsV1?.get?.('pallet');
        const buildings=town?[town.playerHouse,town.professorHouse,town.rivalHouse].filter(Boolean):[];
        return {...provided,width:provided.width||COLS,height:provided.height||ROWS,authoredKind,
          authored:{...(provided.authored||{}),...(town||{}),buildings},
          npcs:town?.npcs||provided.npcs};
      }
      return {...provided,width:provided.width||COLS,height:provided.height||ROWS,authoredKind};
    }
    if (place.id === 'pallet') {
      const town=W.PsyKantoAuthoredMapsV1?.get?.('pallet'), townGrid=W.PsyKantoAuthoredMapsV1?.toGrid?.('pallet');
      if(town&&townGrid){const buildings=[town.playerHouse,town.professorHouse,town.rivalHouse].filter(Boolean);return {grid:townGrid,width:town.width,height:town.height,tileSize:town.tileSize,authoredKind:'pallet',authored:{...town,buildings},npcs:town.npcs,npc:town.npcs.find(n=>n.id==='oak')||null,object:null,exit:null,seed:hash('pallet')}}
    }
    if(!provided)return {grid:[],width:0,height:0,authoredKind:null};
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
    return {grid,npc,object,exit,secretGate,secretChest,seed:hash(place.id),width:COLS,height:ROWS,authoredKind:null};
  }
  function openWorld(id, options={}) {
    const place=places().find(p=>p.id===id); if(!place)return;
    const map=buildMap(place);
    // Do not expose the old generated-theme placeholder as if every Kanto
    // location already had its own authored, walkable map.
    if(!map.authoredKind){W.notif?.('Este mapa ainda está sendo construído.',3000);return;}
    if(!options.fromPortal&&!isUnlocked(place)){W.notif?.('🔒 Conclua os objetivos do caminho anterior e obtenha as insígnias exigidas.',2600);return;}
    makeRoot(); model.place=place; model.map=map; model.x=options.entry?.x??model.map.spawn?.x??model.map.authored?.spawn?.x??3; model.y=options.entry?.y??model.map.spawn?.y??model.map.authored?.spawn?.y??ROWS-3; model.direction=model.map.authored?.spawn?.facing??'down';model.frame=0;model.held=null;
    state().active=place.id;markVisited(place.id);saveProgress();
    if(model.map.secretGate&&model.map.grid[model.map.secretGate.y][model.map.secretGate.x]===1)model.map.artKey=model.map.unlockedArtKey||model.map.artKey;
    model.root.querySelector('.kp-title b').textContent=place.name;
    model.root.querySelector('[data-campaign]').hidden=true;
    model.root.querySelector('.kp-title small').textContent=model.map.authoredKind==='pallet'?'Pallet Town · saída norte para Route 1':model.map.authoredKind==='route'?'Mapa de campanha · arte original com colisões':model.map.authoredKind==='city'?'Cidade · caminho integrado à campanha':'Mapa de campanha · arte original';
    model.root.classList.add('open'); model.dialog.classList.remove('open'); updateObjective(); render();
    if(!model.raf)tick();
    if(place.id==='pallet'||place.id==='pewter'||place.id==='cerulean')W.setTimeout(()=>W.PsyKantoTownStoryV1?.cinematic(place.id),220);
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
    const now=performance.now();model.lastMove=now;
    const step={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[dir];if(!step)return;
    const nx=model.x+step[0],ny=model.y+step[1],width=model.map.width||COLS,height=model.map.height||ROWS;if(nx<0||ny<0||nx>=width||ny>=height)return;
    model.direction=dir;
    const tile=model.map.grid[ny][nx],npcAtCell=(model.map.npcs||[]).some(n=>n.x===nx&&n.y===ny);if(tile===9||tile===3||tile===4||tile===6||npcAtCell)return;
    model.motion={fromX:model.x,fromY:model.y,toX:nx,toY:ny,start:now,duration:135};model.x=nx;model.y=ny;model.frame=(model.frame+1)%WALK_FRAME_COLUMNS.length;
    if(tile===5||tile===2)maybeEncounter();
    if((model.map.portals||[]).some(portal=>portal.x===nx&&portal.y===ny)){interact();return;}
    if(model.map.exit&&nx===model.map.exit.x&&ny===model.map.exit.y)interact();
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
  function nearby(point) { return !!point&&Math.abs(model.x-point.x)+Math.abs(model.y-point.y)<=1; }
  function showDialog(title,text,actions=[],emotion='neutral',sprite='traveler',portraitKey='') {
    const d=model.dialog;d.querySelector('.kp-dialog-title').textContent=title;d.querySelector('.kp-dialog-text').textContent=text;const portrait=d.querySelector('.kp-dialog-portrait');portrait.dataset.emotion=emotion;const portraitImg=portrait.querySelector('img');portrait.classList.toggle('expression-art',!!portraitKey);portraitImg.src=portraitKey?`/assets/kanto/campaign-art/npc/expressions/${portraitKey}-${emotion}.${portraitKey==='misty'?'webp':'png'}`:`/assets/kanto/campaign-art/npc/npc-${sprite}.png`;portraitImg.alt=`Retrato de ${title} · ${emotion}`;
    const box=d.querySelector('.kp-dialog-actions');box.replaceChildren();
    actions.forEach(({label,onClick,primary=false})=>{const b=D.createElement('button');b.textContent=label;if(primary)b.style.background='linear-gradient(100deg,#075985,#166534)';b.onclick=()=>{d.classList.remove('open');onClick?.()};box.appendChild(b)});
    if(!actions.length){const b=D.createElement('button');b.textContent='CONTINUAR';b.onclick=()=>d.classList.remove('open');box.appendChild(b)}
    const skip=D.createElement('button');skip.type='button';skip.className='kp-dialog-skip';skip.textContent='PULAR DIÁLOGO';skip.onclick=()=>d.classList.remove('open');box.appendChild(skip);
    d.classList.add('open');
    if(typeof d.animate==='function')d.animate([{opacity:0,transform:'translate(-50%,12px)'},{opacity:1,transform:'translate(-50%,0)'}],{duration:220,easing:'ease-out'});
    if(typeof portrait.animate==='function')portrait.animate([{opacity:.45,transform:'scale(.96)'},{opacity:1,transform:'scale(1)'}],{duration:220,easing:'ease-out'});
  }
  function interact() {
    if(!model.place)return;
    const place=model.place, ps=placeState(place.id), gymId=GYM_FOR_PLACE[place.id];
    const portal=(model.map.portals||[]).map(p=>({...p,distance:Math.abs(model.x-p.x)+Math.abs(model.y-p.y)}))
      .filter(p=>p.distance<=1).sort((a,b)=>a.distance-b.distance)[0];
    if(portal){
      if(portal.gate&&!objectivesMet(place)){
        const count=new Set(ps.found).size,need=objective(place),gymDone=!gymId||(Array.isArray(player().gymProgress)&&player().gymProgress.includes(gymId));
        const missing=[];if(!ps.talked)missing.push(`converse com ${place.npc}`);if(place.kind!=='city'&&count<need)missing.push(`registre ${need} espécie(s)`);if(!gymDone)missing.push('vença o ginásio');
        showDialog('Saída bloqueada',`Para seguir, ${missing.join(', ')}. Progresso de espécies: ${Math.min(count,need)}/${need}.`);return;
      }
      if(portal.gate)markCleared(place);
      openWorld(portal.to,{entry:portal.entry,fromPortal:true});return;
    }
    if(model.map.authoredKind==='pallet'&&!(model.map.exit&&nearby(model.map.exit))){
      const person=(model.map.npcs||[]).find(n=>nearby(n));
      if(person){if(person.id==='oak'){ps.talked=true;saveProgress()}
        const story=W.PsyKantoTownStoryV1?.talk('pallet',person.id,{found:new Set(ps.found||[]).size,visited:W.PsyKantoTownStoryV1?.visitedCount?.()||0});
        showDialog(person.name,story?.text||'Bem-vindo a Pallet Town. Explore a cidade e conheça os moradores.',story?.actions||[],story?.emotion||'curious',person.sprite||'professor',story?.portraitKey||'');updateObjective();return;}
      showDialog('Pallet Town','Explore a praça e converse com os moradores. Use a saída norte de Pallet para caminhar até Route 1. As cidades de Kanto se conectam às rotas como no GBA.');return;
    }
    const townPerson=(model.map.npcs||[]).find(n=>nearby(n));
    if(townPerson){
      const story=W.PsyKantoTownStoryV1?.talk(place.id,townPerson.id,{
        found:new Set(ps.found||[]).size,
        visited:W.PsyKantoTownStoryV1?.visitedCount?.()||0
      });
      if(story){
        ps.talked=true;saveProgress();
        showDialog(townPerson.name,story.text,story.actions||[],story.emotion||'curious',townPerson.sprite||'traveler',story.portraitKey||'');
        updateObjective();return;
      }
    }
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
          if(ok){if(!ps.solved.includes(mystery.id))ps.solved.push(mystery.id);revealPuzzleArt();saveProgress();W.PsyKantoJourneyV1.refresh?.(place.id);showDialog(mystery.name,'A resposta correta abriu a passagem secreta.');render();}
          else showDialog(mystery.name,'A pista ainda não foi resolvida. Observe novamente os detalhes do enigma.');
        }}));
        showDialog(mystery.name,mystery.clue,choices);return;
      }
      const ok=W.PsyKantoJourneyV1.solveMystery(place,mystery);
      if(ok){if(!ps.solved.includes(mystery.id))ps.solved.push(mystery.id);revealPuzzleArt();saveProgress();W.PsyKantoJourneyV1.refresh?.(place.id);showDialog(mystery.name,`${mystery.clue} O mecanismo cedeu e abriu uma passagem lateral.`);}
      else showDialog(mystery.name,'Ainda não foi possível abrir o mecanismo. Confira a técnica de campo exigida.');
      updateObjective();render();return;
    }
    if(model.map.secretChest&&model.map.grid[model.map.secretGate.y][model.map.secretGate.x]===1&&nearby(model.map.secretChest)){
      showDialog('Passagem secreta','Você encontrou a câmara oculta. A recompensa do enigma já foi registrada na sua jornada.');return;
    }
    if(model.map.exit&&nearby(model.map.exit)){
      if(model.place.teleportRequired&&!hasTeleport()){
        showDialog('Teleporte necessário','Conclua o Ginásio Psíquico de Saffron para aprender Teleporte e atravessar esta passagem da campanha.');return;
      }
      if(!objectivesMet(place)){
        const count=new Set(ps.found).size, need=objective(place);
        showDialog('Saída bloqueada',`Converse com ${place.npc}, registre ${need} espécie(s) neste local${GYM_FOR_PLACE[place.id]?' e vença o ginásio':''}. Progresso: ${count}/${need}.`);return;
      }
      markCleared(place);
      if(place.id==='indigo')showDialog('Capítulos de Kanto concluídos','A exploração regional foi concluída. A Elite Four e o Campeão ainda precisam de uma arena de história própria para fechar a campanha completa.');
      else {
        const all=places(),next=all[all.findIndex(p=>p.id===place.id)+1];
        if(next&&isUnlocked(next)&&W.PsyKantoCampaignArtV1?.has?.(next))openWorld(next.id);
        else showDialog('Capítulo concluído',`${place.name} foi concluída. A próxima parada ainda precisa de mapa e arte próprios.`);
      }
      updateObjective();return;
    }
    const feature=(place.mysteries||[])[0];
    if(feature&&nearby({x:5,y:4})){showDialog(feature.name,feature.clue);return;}
    showDialog('Exploração','Use as setas ou WASD para caminhar. Pressione E perto de personagens, pontos de interesse ou da saída.');
  }

  function advanceCampaign() {
    if(!model.place)return;
    const all=places(),index=all.findIndex(p=>p.id===model.place.id),next=all[index+1];
    if(model.place.id==='pallet') { W.notif?.('Siga pelo caminho norte até a saída para Route 1.',2600); return; }
    if(!next){W.notif?.('Você chegou ao fim dos mapas atualmente disponíveis.',2600);return;}
    if(!isUnlocked(next)){W.notif?.('Conclua os objetivos deste capítulo para continuar.',2600);return;}
    if(!W.PsyKantoCampaignArtV1?.has?.(next)){W.notif?.('A arte caminhável desta parada ainda está em produção.',2800);return;}
    openWorld(next.id);
  }
  function challengeGym(placeId) {
    const place=places().find(p=>p.id===placeId),gym=place&&GYM_FOR_PLACE[place.id];
    if(!place||!gym||typeof W.startGymBattle!=='function'){
      W.notif?.('Este desafio de ginásio ainda não está disponível.',2500);return false;
    }
    model.pendingGymPlace=place.id;closeWorld();W.startGymBattle(gym);return true;
  }
  function revealPuzzleArt() {
    const gate=model.map?.secretGate;if(gate)model.map.grid[gate.y][gate.x]=1;(model.map?.secretWalls||[]).forEach(p=>model.map.grid[p.y][p.x]=2);
    const nextArt=model.map?.unlockedArtKey;
    const root=model.root;if(!root)return;
    if(!nextArt)return;
    const flash=D.createElement('div');flash.className='kp-art-flash';root.querySelector('.kp-stage').appendChild(flash);
    requestAnimationFrame(()=>flash.classList.add('on'));
    W.setTimeout(()=>{if(nextArt)model.map.artKey=nextArt;render();flash.classList.add('off');W.setTimeout(()=>flash.remove(),260)},150);
  }

  function updateObjective() {
    if(!model.place||!model.root)return;
    if(model.map?.authoredKind==='pallet'){const talked=placeState('pallet').talked;model.root.querySelector('.kp-objective').innerHTML=`Pallet Town · converse com os moradores: <strong>${talked?'Professor Carvalho já falou com você':'Professor Carvalho é um bom começo'}</strong> · saída norte leva à Route 1`;return;}
    const place=model.place, ps=placeState(place.id), need=objective(place), count=new Set(ps.found).size, gym=GYM_FOR_PLACE[place.id], gymDone=!gym||(Array.isArray(player().gymProgress)&&player().gymProgress.includes(gym));
    const items=[`Fale com <strong>${esc(place.npc)}</strong>: ${ps.talked?'✅':'◻'}`];
    if(place.kind!=='city')items.push(`Registre espécies: <strong>${Math.min(count,need)}/${need}</strong>`);
    if(place.teleportRequired&&!hasTeleport())items.push('Passagem bloqueada: vença Sabrina no Ginásio Psíquico para aprender Teleporte');
    if(gym)items.push(`Ginásio: <strong>${gymDone?'✅ vencido':'pendente'}</strong>`);
    items.push(`Saída em <strong>E</strong> quando concluir · Encontre habitats marcados com grama`);
    model.root.querySelector('.kp-objective').innerHTML=items.join(' · ');
  }
  function drawPallet(c,map,ox,oy,T){
    const g=map.grid,paint=(x,y,color)=>{c.fillStyle=color;c.fillRect(ox+x*T,oy+y*T,T,T)};
    for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++){
      const t=g[y][x],sx=ox+x*T,sy=oy+y*T;
      if(t===1){paint(x,y,((x*13+y*7)%5===0)?'#c8a66c':'#d9bd83');c.fillStyle='#efd9a0';c.fillRect(sx+2,sy+3,T-4,2);c.fillStyle='#ae8e5e';c.fillRect(sx+4,sy+T-4,T-8,1)}
      else if(t===2){paint(x,y,((x+y)%3)?'#62a94f':'#6bb555');c.fillStyle='#347a40';c.fillRect(sx+3,sy+T-8,2,6);c.fillRect(sx+T-7,sy+T-10,2,8);c.fillStyle='#9bd26b';c.fillRect(sx+4,sy+T-11,2,2);c.fillRect(sx+T-6,sy+T-13,2,2)}
      else if(t===4){paint(x,y,((x+y)%2)?'#3798b8':'#3187ad');c.fillStyle='#8dd4d3';c.fillRect(sx+3,sy+7,8,2);c.fillRect(sx+T-10,sy+T-8,7,2);c.fillStyle='#276e94';c.fillRect(sx,sy+T-3,T,3)}
      else if(t===9){paint(x,y,'#4c9849');c.fillStyle='#286441';c.fillRect(sx+2,sy+2,T-4,T-3);c.fillStyle='#397d43';c.fillRect(sx+1,sy+3,T-2,T-5);c.fillStyle='#77ba53';c.fillRect(sx+4,sy+4,7,5);c.fillRect(sx+T-9,sy+T-11,6,5);c.fillStyle='#674a32';c.fillRect(sx+T/2-2,sy+T-8,4,7)}
      else {paint(x,y,((x*3+y*5)%7===0)?'#68b256':'#5fa64d');if((x*11+y*17)%6===0){c.fillStyle='#83c15e';c.fillRect(sx+5+(x%4)*3,sy+5+(y%3)*3,2,2)}}
    }
    const palettes={'pallet-home':{roof:'#bd654b',light:'#e78b62',dark:'#7e4037',wall:'#dfc69a'},'pallet-home-blue':{roof:'#4d78a3',light:'#78a1c1',dark:'#354f75',wall:'#e0d4b1'},'oak-lab':{roof:'#536f76',light:'#7b9c96',dark:'#354d5d',wall:'#d6c69a'}};
    for(const b of map.authored?.buildings||[]){
      const f=b.footprint,p=palettes[b.palette]||palettes['pallet-home'],x=ox+f.x*T,y=oy+f.y*T,w=f.width*T,h=f.height*T;
      c.fillStyle='#17281c66';c.fillRect(x+T*.16,y+h-T*.16,w,h*.18);c.fillStyle=p.dark;c.fillRect(x+2,y+2,w-4,h-3);
      c.fillStyle=p.roof;c.fillRect(x+4,y+3,w-8,h-T*.56);c.fillStyle=p.light;c.fillRect(x+T*.2,y+T*.2,w-T*.4,3);
      c.fillStyle=p.dark;for(let yy=y+T*.48;yy<y+h-T*.6;yy+=T*.32)c.fillRect(x+4,yy,w-8,2);
      c.fillStyle=p.wall;c.fillRect(x+T*.2,y+h-T*.55,w-T*.4,T*.3);c.fillStyle='#f6d887';c.fillRect(x+T*.45,y+h-T*.49,T*.35,T*.22);c.fillRect(x+w-T*.8,y+h-T*.49,T*.35,T*.22);
      c.fillStyle='#704a32';c.fillRect(x+w*.43,y+h-T*.26,w*.15,T*.26);c.fillStyle='#e7bb68';c.fillRect(x+w*.54,y+h-T*.15,2,2);c.fillStyle='#49372a';c.fillRect(x+T*.12,y+h-T*.06,w-T*.24,2);
      const door=b.door,dx=ox+door.x*T,dy=oy+door.y*T;c.fillStyle='#513a2d';c.fillRect(dx+T*.28,dy+T*.16,T*.44,T*.84);c.fillStyle='#d8ae66';c.fillRect(dx+T*.61,dy+T*.54,2,2);
    }
    for(const point of map.authored.landmarks||[]){const x=ox+point.x*T,y=oy+point.y*T;
      if(point.kind==='sign'){c.fillStyle='#684b32';c.fillRect(x+T*.45,y+T*.46,T*.12,T*.54);c.fillStyle='#ead39a';c.fillRect(x+T*.1,y+T*.12,T*.8,T*.42);c.strokeStyle='#79583b';c.strokeRect(x+T*.1,y+T*.12,T*.8,T*.42);c.fillStyle='#4b5035';c.font=`bold ${Math.max(7,T*.18)}px system-ui`;c.textAlign='center';c.fillText('PALLET',x+T*.5,y+T*.4)}
      if(point.kind==='flowers')for(let yy=0;yy<point.height;yy++)for(let xx=0;xx<point.width;xx++){const fx=x+xx*T,fy=y+yy*T;c.fillStyle='#3c8347';c.fillRect(fx,fy,T,T);c.fillStyle='#f7d568';c.fillRect(fx+T*.32,fy+T*.3,3,3);c.fillStyle='#f39a9a';c.fillRect(fx+T*.66,fy+T*.62,3,3)}
    }
  }
  function render() {
    if(!model.place||!model.ctx||!model.root?.classList.contains('open'))return;
    const c=model.ctx, cw=model.canvas.width, ch=model.canvas.height, th=theme(model.place), g=model.map.grid;
    c.imageSmoothingEnabled=false;c.clearRect(0,0,cw,ch);c.fillStyle='#111722';c.fillRect(0,0,cw,ch);
    const cols=model.map.width||COLS,rows=model.map.height||ROWS,drawTile=model.map.artKey?Math.min(TILE,Math.floor(cw/cols)):model.map.authoredKind==='pallet'?Math.min(TILE,Math.floor(cw/cols),Math.floor(ch/rows)):TILE;
    const offsetX=Math.floor((cw-cols*drawTile)/2);
    const worldHeight=rows*drawTile,scrollY=worldHeight>ch?Math.max(0,Math.min(worldHeight-ch,model.y*drawTile+drawTile/2-ch/2)):0;
    const offsetY=worldHeight>ch?-scrollY:Math.floor((ch-worldHeight)/2);
    const artDrawn=model.map.artKey?W.PsyKantoCampaignArtV1?.draw?.(c,model.map,{offsetX,offsetY,TILE:drawTile}):false;
    // Campaign locations use their authored map art. Never substitute the
    // generic terrain tiles when an illustration has not loaded or is absent.
    if(!artDrawn&&model.map.artKey){
      const missing=artDrawn==='missing';
      c.fillStyle='#101827';c.fillRect(0,0,cw,ch);
      c.fillStyle='#f5e5bd';c.textAlign='center';c.textBaseline='middle';
      c.font='bold 18px system-ui';c.fillText(missing?'Arte desta área indisponível':'Carregando arte do mapa…',cw/2,ch/2-8);
      if(missing){c.font='13px system-ui';c.fillStyle='#c7d2e2';c.fillText('Esta área precisa da ilustração própria da campanha.',cw/2,ch/2+20);}
      return;
    }
    if(!artDrawn) {
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
        const t=g[y][x],sx=offsetX+x*drawTile,sy=offsetY+y*drawTile;
        if(model.map.authoredKind==='route'){
          if(t===0){c.fillStyle=((x*7+y*13)%5===0)?'#63ad50':'#579d48';c.fillRect(sx,sy,drawTile,drawTile);c.fillStyle='#82c35e';if((x*11+y*3)%4===0)c.fillRect(sx+drawTile*.28,sy+drawTile*.32,2,2)}
          else if(t===1){c.fillStyle=((x+y)%3===0)?'#cfb77b':'#ddc88e';c.fillRect(sx,sy,drawTile,drawTile);c.fillStyle='#f0dba5';c.fillRect(sx+2,sy+2,drawTile-4,2)}
          else if(t===2||t===5){c.fillStyle='#579d48';c.fillRect(sx,sy,drawTile,drawTile);c.fillStyle='#315f3d';for(let i=0;i<4;i++){const xx=sx+3+((x*7+y*5+i*9)%(drawTile-7));c.fillRect(xx,sy+drawTile-7-(i%2)*5,2,7+(i%2)*5)}c.fillStyle='#b6d977';c.fillRect(sx+drawTile*.35,sy+drawTile*.4,2,3)}
          else if(t===3){c.fillStyle='#477d48';c.fillRect(sx,sy,drawTile,drawTile);c.fillStyle='#696458';c.beginPath();c.moveTo(sx+2,sy+drawTile-3);c.lineTo(sx+4,sy+drawTile*.42);c.lineTo(sx+drawTile*.52,sy+3);c.lineTo(sx+drawTile-3,sy+drawTile*.55);c.lineTo(sx+drawTile-2,sy+drawTile-3);c.closePath();c.fill();c.fillStyle='#a99b7c';c.fillRect(sx+drawTile*.42,sy+drawTile*.32,drawTile*.22,2)}
          else if(t===4){c.fillStyle='#277fa2';c.fillRect(sx,sy,drawTile,drawTile);c.fillStyle='#80cad2';c.fillRect(sx+3,sy+7,7,2);c.fillRect(sx+drawTile*.55,sy+drawTile*.68,6,2)}
          else if(t===9||t===6){c.fillStyle='#315e3b';c.fillRect(sx+1,sy+3,drawTile-2,drawTile-4);c.fillStyle='#347b45';c.fillRect(sx+3,sy+1,drawTile-6,drawTile*.72);c.fillStyle='#70b757';c.fillRect(sx+5,sy+4,drawTile*.28,drawTile*.22);c.fillStyle='#674a32';c.fillRect(sx+drawTile*.43,sy+drawTile*.7,drawTile*.16,drawTile*.28)}
          else {c.fillStyle=th.floor;c.fillRect(sx,sy,drawTile,drawTile)}
        }else{
          c.fillStyle=t===9?th.wall:t===1?th.path:th.floor;c.fillRect(sx,sy,drawTile,drawTile);
          if(t===1){c.fillStyle='#ffffff10';c.fillRect(sx+2,sy+2,drawTile-4,2)}
          if(t===2){c.fillStyle='#79bd73';c.fillRect(sx+4,sy+5,3,10);c.fillRect(sx+17,sy+2,3,12);c.fillStyle='#315a38';c.fillRect(sx+10,sy+17,5,8)}
          if(t===3){c.fillStyle='#171920';c.beginPath();c.arc(sx+14,sy+14,10,0,Math.PI*2);c.fill();c.fillStyle='#716a64';c.beginPath();c.moveTo(sx+4,sy+22);c.lineTo(sx+8,sy+6);c.lineTo(sx+14,sy+3);c.lineTo(sx+21,sy+9);c.lineTo(sx+24,sy+22);c.closePath();c.fill()}
          if(t===4){c.fillStyle='#41515a';c.fillRect(sx+4,sy+8,19,15);c.fillStyle='#85949b';c.fillRect(sx+7,sy+5,13,3)}
          if(t===5){c.fillStyle=th.accent;c.globalAlpha=.7;c.fillRect(sx+8,sy+7,2,12);c.fillRect(sx+17,sy+11,2,10);c.globalAlpha=1}
          if(t===9){c.fillStyle='#0004';c.fillRect(sx,sy+drawTile-4,drawTile,4)}
        }
      }
      if(typeof model.map.draw==='function')model.map.draw(c,{grid:g,offsetX,offsetY,TILE:drawTile,COLS:cols,ROWS:rows,place:model.place});
    }
    const marker=(pt,color,glyph,label)=>{const sx=offsetX+pt.x*drawTile+drawTile/2,sy=offsetY+pt.y*drawTile+drawTile/2;c.fillStyle=color;c.beginPath();c.arc(sx,sy,10,0,Math.PI*2);c.fill();c.fillStyle='#17202a';c.font='bold 12px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(glyph,sx,sy+1);c.font='bold 10px system-ui';const text=label.length>22?label.slice(0,20)+'…':label,tw=Math.min(190,c.measureText(text).width+12);c.fillStyle='#071019d9';c.fillRect(sx-tw/2,sy-29,tw,14);c.fillStyle='#fff';c.textBaseline='middle';c.fillText(text,sx,sy-22)};
    if(model.map.artKey&&model.map.npcs?.length)model.map.npcs.forEach(person=>W.PsyKantoCampaignArtV1?.drawNpc?.(c,person,offsetX+person.x*drawTile+drawTile/2,offsetY+person.y*drawTile+drawTile/2,drawTile));
    else if(model.map.artKey&&model.map.npc)W.PsyKantoCampaignArtV1?.drawNpc?.(c,model.map.npc,offsetX+model.map.npc.x*drawTile+drawTile/2,offsetY+model.map.npc.y*drawTile+drawTile/2,drawTile);
    else if(model.map.npcs?.length)model.map.npcs.forEach(person=>marker({x:person.x,y:person.y},person.id==='oak'?'#ffcf70':'#79cbb7',person.id==='oak'?'!':'•',person.name));
    else if(model.map.npc)marker(model.map.npc,'#ffcf70','!',model.place.npc);
    if(model.map.authoredKind!=='pallet'&&model.map.object)marker(model.map.object,'#75d5db','?','Pista / segredo');
    if(model.map.portals?.length)model.map.portals.forEach(portal=>marker(portal,portal.gate&&!objectivesMet(model.place)?'#cb7474':'#79df94','›',places().find(p=>p.id===portal.to)?.name||'Próxima área'));
    else if(model.map.exit)marker(model.map.exit,objectivesMet(model.place)?'#79df94':'#cb7474','›','Próxima área');
    if(model.map.secretChest&&model.map.secretGate&&model.map.grid[model.map.secretGate.y][model.map.secretGate.x]===1)marker(model.map.secretChest,'#a4e7a0','★','Recompensa do enigma');
    const motion=model.motion,blend=motion?Math.max(0,Math.min(1,(performance.now()-motion.start)/motion.duration)):1;
    if(motion&&blend>=1)model.motion=null;
    const visualX=motion?motion.fromX+(motion.toX-motion.fromX)*blend:model.x,visualY=motion?motion.fromY+(motion.toY-motion.fromY)*blend:model.y;
    const px=offsetX+visualX*drawTile+drawTile/2,py=offsetY+visualY*drawTile+drawTile/2;
    const avatar=selectedAvatar();
    if(avatar?.ready){
      const row=({down:0,left:1,right:2,up:3})[model.direction]??0;
      const sourceFrame=model.held?WALK_FRAME_COLUMNS[model.frame%WALK_FRAME_COLUMNS.length]:IDLE_FRAME;
      c.fillStyle='rgba(5,12,16,.38)';c.beginPath();c.ellipse(px,py+drawTile*.34,drawTile*.2,drawTile*.09,0,0,Math.PI*2);c.fill();
      drawNormalizedAvatar(c,avatar,row,sourceFrame,px,py+8);
    }else{
      c.fillStyle='#141a23';c.beginPath();c.ellipse(px,py+8,8,4,0,0,Math.PI*2);c.fill();
      c.fillStyle='#e8c492';c.beginPath();c.arc(px,py-4,6,0,Math.PI*2);c.fill();c.fillStyle='#315777';c.fillRect(px-6,py+1,12,10);c.fillStyle='#f2f0e8';c.fillRect(px-5,py+11,4,4);c.fillRect(px+2,py+11,4,4);
    }
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
      let maxH=1;
      for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
        let minX=SHEET_CELL,minY=SHEET_CELL,maxX=-1,maxY=-1;
        const x0=col*SHEET_CELL,y0=row*SHEET_CELL;
        for(let y=0;y<SHEET_CELL;y++)for(let x=0;x<SHEET_CELL;x++){
          if(pixels[((y0+y)*scan.width+x0+x)*4+3]>32){
            if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
          }
        }
        const box=maxX<0?{x:0,y:0,w:SHEET_CELL,h:SHEET_CELL}:{x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1};
        bounds.push(box);maxH=Math.max(maxH,box.h);
      }
      avatar.frameBounds=bounds;avatar.frameCols=cols;avatar.frameScale=46/maxH;
    } catch (_) { avatar.frameBounds=null;avatar.frameScale=1; }
  }
  function drawNormalizedAvatar(ctx,avatar,row,col,centerX,baselineY) {
    const image=avatar.image,cols=avatar.frameCols||4,index=row*cols+col,box=avatar.frameBounds?.[index];
    if(!box){ctx.drawImage(image,col*SHEET_CELL,row*SHEET_CELL,SHEET_CELL,SHEET_CELL,centerX-25,baselineY-50,50,50);return;}
    // Keep the character's visible height constant between idle/walk frames;
    // sheet padding differs by pose even though every cell is 512×512.
    const scale=46/box.h,w=box.w*scale,h=46;
    ctx.drawImage(image,col*SHEET_CELL+box.x,row*SHEET_CELL+box.y,box.w,box.h,centerX-w/2,baselineY-h,w,h);
  }
  function tick() {
    if(!model.root?.classList.contains('open')){model.raf=0;return;}
    const now=performance.now();if(model.held&&now-model.lastMove>160)move(model.held);
    render();model.raf=requestAnimationFrame(tick);
  }
  function injectEntryButton() {
    const detail=D.querySelector('#psy-kanto-atlas .psy-kanto-detail');if(!detail)return;
    const title=detail.querySelector('h3')?.textContent?.trim();if(!title)return;
    const place=places().find(p=>p.name===title);if(!place||detail.querySelector('.psy-kanto-enter-world'))return;
    const authored=hasAuthoredMap(place);
    const unlocked=isUnlocked(place);
    const button=D.createElement('button');button.className='psy-kanto-enter-world';button.type='button';
    button.textContent=!unlocked?'CAPÍTULO BLOQUEADO':authored?(place.id==='pallet'?'ENTRAR EM PALLET TOWN':place.kind==='city'?'EXPLORAR CIDADE':place.kind==='route'?'EXPLORAR ROTA':'EXPLORAR LOCAL'):'MAPA EM PRODUÇÃO';
    button.disabled=!unlocked||!authored;
    button.title=authored?'Abrir mapa próprio da campanha':'Este local ainda não tem mapa jogável próprio.';
    button.onclick=()=>{if(place.id==='pallet'&&!W.PsyKantoAuthoredMapsV1?.get?.('pallet'))return;openWorld(place.id)};
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
        if(won&&gymId==='kanto_sabrina'){
          const p=player();p.meta=p.meta||{};p.meta.kantoTeleportUnlocked=true;saveProgress();
          W.notif?.('Novo movimento de campanha aprendido: Teleporte.',3200);
        }
        if(won&&place&&gymId&&Array.isArray(player().gymProgress)&&player().gymProgress.includes(gymId)){model.pendingGymPlace=null;markCleared(place);}
        const result=oldEnd.apply(this,arguments);
        if(model.resumeAfterEncounter){model.resumeAfterEncounter=false;W.setTimeout(()=>{if(model.place){model.root?.classList.add('open');updateObjective();render();if(!model.raf)tick()}},0)}
        if(won&&place?.id==='pewter'&&gymId==='kanto_brock')W.setTimeout(()=>W.PsyKantoTownStoryV1?.cinematic('pewter','victory'),650);
        if(won&&place?.id==='cerulean'&&gymId==='kanto_misty')W.setTimeout(()=>W.PsyKantoTownStoryV1?.cinematic('cerulean','victory'),650);
        if(place&&gymId&&won){W.setTimeout(()=>{model.place=place;updateObjective()},0)}return result;
      };
      wrapped.__psyKantoPlayableWrapped=true;W.endBattle=wrapped;
    }
  }

  W.addEventListener('psy-kanto-art-ready',()=>render());
  const oldOpenAtlas=W.openKantoJourneyV1;
  if(typeof oldOpenAtlas==='function')W.openKantoJourneyV1=function(){const result=oldOpenAtlas.apply(this,arguments);W.setTimeout(monitorAtlas,0);return result;};
  W.setTimeout(monitorAtlas,0);wrapEncounter();
  W.PsyKantoPlayableV1={version:1,open:openWorld,close:closeWorld,challengeGym,isUnlocked,hasTeleport,objective,progress:()=>state(),mapFor:id=>{const place=places().find(p=>p.id===id);return place?buildMap(place):null}};
})(window,document);

