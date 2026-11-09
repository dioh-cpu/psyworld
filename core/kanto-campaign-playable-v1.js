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
  const saveProgress = () => {rememberPosition();try { W.autoSave?.(); } catch (_) {} };
  function rememberPosition(){if(!model.place||model.riftSession)return;const p=model.outdoor||model;state().position={world:model.place.id,x:p.x,y:p.y,direction:model.direction,inside:model.interior||null,roomPosition:model.interior?{x:model.x,y:model.y}:null};}
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
    if (place.id === 'viridian') { try { if (JSON.parse(W.localStorage.getItem('psy_kanto_world_v2_quests')||'{}').viridian) return true; } catch (_) {} }
    const all = places(), index = all.findIndex(p => p.id === place.id), prev = all[index - 1];
    if (!prev) return true;
    const saved = journeySave();
    const visited = Array.isArray(saved.visited) ? saved.visited : [];
    const prevOpen = prev.id === 'route-1' ? !!W.PsyKantoWorldV2?.progress?.().viridian : visited.includes(prev.id);
    const badgeGate = Number(place.badge || prev.badge || 0);
    return prevOpen && badgeCount() >= badgeGate;
  }
  function objective(place) {
    if(EARLY.includes(place.id))return 0;
    if (place.id === 'route-1') return 3;
    return place.kind === 'route' || place.kind === 'dungeon' ? 2 : 1;
  }
  function objectivesMet(place) {
    const ps = placeState(place.id);
    const gym = GYM_FOR_PLACE[place.id];
    const gymDone = !gym || (Array.isArray(player().gymProgress) && player().gymProgress.includes(gym));
    if(EARLY.includes(place.id))return ps.talked&&(!['route-2','viridian-forest','mt-moon'].includes(place.id)||ps.storyDone)&&gymDone;
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
      #psy-kanto-world .kp-title{min-width:0}.kp-title b{display:block;color:#ffe09a;font-size:14px}.kp-title small{display:block;color:#aab5c2;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:56vw}#psy-kanto-world .kp-title .kp-clock{color:#f2d394;font-size:10px;letter-spacing:.04em}
      #psy-kanto-world button{color:#fff;background:#1f3446;border:1px solid #668397;border-radius:9px;padding:9px 12px;font-weight:800;cursor:pointer;touch-action:manipulation}
      #psy-kanto-world .kp-close{background:#522d35;border-color:#b36b73;font-size:17px;padding:5px 12px}
      #psy-kanto-world .kp-route{background:linear-gradient(135deg,#075985,#166534);border-color:#9ad9ac;white-space:nowrap}
      #psy-kanto-world .kp-route-footer{min-width:50px;min-height:58px;background:linear-gradient(135deg,#075985,#166534);border-color:#9ad9ac}
      #psy-kanto-world .kp-stage #psy-campaign-quests{top:8px!important;right:8px!important;left:auto!important;width:min(210px,44%)!important;max-width:220px!important;max-height:92px!important;overflow:auto!important}
      #psy-kanto-world.psy-rift-active #psy-campaign-quests{display:none!important}
      #psy-kanto-world [data-kp-fish][hidden]{display:none!important}
      #psy-kanto-world [data-kp-fish]{background:#0e5d80;border-color:#9ee4f5;min-height:52px}
      #psy-kanto-world .kp-stage{position:relative;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden;background:radial-gradient(ellipse at center,#182b33,#080c14 78%)}
      #psy-kanto-canvas{box-sizing:border-box;width:min(100vw,calc((100vh - 176px)*1.6));height:auto;aspect-ratio:8/5;max-width:100%;max-height:100%;image-rendering:pixelated;border:1px solid #617180;border-radius:7px;box-shadow:0 12px 50px #0009;touch-action:none}
      #psy-kanto-world[data-place="route-2"] #psy-kanto-canvas,#psy-kanto-world[data-place="viridian-forest"] #psy-kanto-canvas,#psy-kanto-world[data-place="pewter"] #psy-kanto-canvas{display:block;width:100%;height:100%;aspect-ratio:auto;max-width:none;max-height:none;border:0;border-radius:0;box-shadow:none}
      #psy-kanto-world .kp-footer{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;gap:8px;align-items:center;padding:8px 12px calc(8px + env(safe-area-inset-bottom));background:#0d1420;border-top:1px solid #36445a}
      .kp-objective{font-size:12px;color:#d7e3e8;line-height:1.35}.kp-objective strong{color:#ffe09a}.kp-controls{display:grid;grid-template-columns:repeat(3,42px);grid-template-rows:repeat(2,38px);gap:3px}
      .kp-controls button{padding:0;font-size:17px;background:#243747}.kp-controls [data-dir="up"]{grid-column:2}.kp-controls [data-dir="left"]{grid-column:1;grid-row:2}.kp-controls [data-dir="down"]{grid-column:2;grid-row:2}.kp-controls [data-dir="right"]{grid-column:3;grid-row:2}
      .kp-interact{min-width:78px;min-height:58px;background:linear-gradient(135deg,#80521f,#b47b31)!important;border-color:#f4c76b!important;font-size:11px!important}
      #psy-kanto-dialog{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);width:min(620px,calc(100% - 24px));padding:13px 15px;background:#0a111df2;border:1px solid #e5c77e;border-radius:12px;box-shadow:0 10px 40px #000a;display:none;z-index:2}
      #psy-kanto-dialog.open{display:block}.kp-dialog-title{color:#ffe09a;font-weight:900;margin-bottom:5px}.kp-dialog-text{font-size:13px;line-height:1.45;color:#e4eaf0}.kp-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}
      #psy-kanto-world .psy-kanto-enter-world{width:100%;margin:8px 0 12px}
      @media(max-width:650px){#psy-kanto-world .kp-head{padding:8px 10px;gap:5px}.kp-head .kp-route{padding:8px;font-size:11px}.kp-title small{max-width:42vw}#psy-kanto-world[data-place="route-2"] #psy-kanto-canvas,#psy-kanto-world[data-place="viridian-forest"] #psy-kanto-canvas,#psy-kanto-world[data-place="pewter"] #psy-kanto-canvas{width:100%;height:100%;aspect-ratio:auto;border:0;border-radius:0;box-shadow:none}#psy-kanto-world .kp-stage #psy-campaign-quests{width:min(176px,48%)!important;font-size:10px!important}#psy-kanto-world .kp-footer{grid-template-columns:minmax(0,1fr) auto auto;gap:5px;padding:6px 8px calc(7px + env(safe-area-inset-bottom))}.kp-objective{grid-column:1/-1;font-size:11px}.kp-controls{grid-column:1;grid-row:2;grid-template-columns:repeat(3,38px);grid-template-rows:repeat(2,35px)}.kp-route-footer{grid-column:2;grid-row:2;min-width:44px!important;min-height:70px!important}.kp-interact{grid-column:3;grid-row:2;min-width:72px}}
    `;
    style.textContent+=`
      #psy-kanto-world .kp-head{box-sizing:border-box;flex:0 0 var(--kp-top,60px);height:var(--kp-top,60px);min-height:0;padding:4px 8px}
      #psy-kanto-world .kp-footer{box-sizing:border-box;display:flex;flex:0 0 var(--kp-foot,93px);height:var(--kp-foot,93px);min-height:0;padding:4px 8px;gap:7px}
      #psy-kanto-world .kp-objective{flex:1;min-width:0;font-size:11px;max-height:44px;overflow:auto}
      #psy-kanto-world .kp-controls{flex:0 0 auto;display:grid;grid-template-columns:repeat(3,34px);grid-template-rows:repeat(2,minmax(20px,1fr));height:min(56px,calc(var(--kp-foot,93px) - 10px));gap:2px}
      #psy-kanto-world .kp-controls button{padding:0;min-height:0}
      #psy-kanto-world .kp-route-footer,#psy-kanto-world .kp-interact{min-height:40px!important;height:calc(var(--kp-foot,93px) - 12px);max-height:54px;padding:4px 9px}
      @media(max-width:680px){#psy-kanto-world .kp-objective{display:none}#psy-kanto-world .kp-controls{margin-right:auto}#psy-kanto-world .kp-head{gap:4px}#psy-kanto-world .kp-head button{padding:5px 6px;font-size:11px}#psy-kanto-world .kp-title small{max-width:30vw}}
      @media(max-height:500px){#psy-kanto-world .kp-title .kp-clock{display:none}}
      body:has(#psy-kanto-world.open) #psy-loot-list{bottom:max(115px,env(safe-area-inset-bottom))!important;max-height:34vh;overflow:auto}
    `;
    D.head.appendChild(style);
  }

  const RIFT_ID='kanto-hunt-rift';
  const RIFT_PLACE={id:RIFT_ID,name:'Fenda Selvagem',mark:'Uma clareira rara entre rotas e cavernas',kind:'route',species:[],npc:'',quest:'Reúna recursos antes que a fenda se feche.'};
  const model = { root:null, canvas:null, ctx:null, camera:null, place:null, map:null, x:3, y:ROWS-3, frame:0, direction:'down', held:null, autoObjective:null, autoSpot:null, autoPortal:false, autoRiftExit:false, riftPortal:null, riftSession:null, riftOrigin:null, riftFrozen:false, pendingRiftWin:null, lastRiftSecond:null, lastMove:0, time:0, moving:false, keys:new Set(), encounterDistance:0, encounterAt:0, dialog:null, pendingGymPlace:null, resumeAfterEncounter:false, raf:0, atlasObserver:null, atlasNode:null };
  function makeRoot() {
    if (model.root) return model.root;
    addStyles();
    const root = D.createElement('div'); root.id = 'psy-kanto-world'; root.setAttribute('role','dialog'); root.setAttribute('aria-modal','true');
    root.innerHTML = `<header class="kp-head"><button type="button" data-back>← ATLAS</button><div class="kp-title"><b></b><small></small><small class="kp-clock" data-world-clock></small></div><button type="button" class="kp-route" data-kp-route aria-label="Seguir objetivo da campanha">ROTA</button><button type="button" data-kp-hobbies>HOBBIES</button><button type="button" class="kp-close" aria-label="Fechar">×</button></header><div class="kp-stage"><canvas id="psy-kanto-canvas" width="896" height="560" aria-label="Mapa jogável de Kanto"></canvas><section id="psy-kanto-dialog"><div class="kp-dialog-title"></div><div class="kp-dialog-text"></div><div class="kp-dialog-actions"></div></section></div><footer class="kp-footer"><div class="kp-objective"></div><div class="kp-controls" aria-label="Controles de movimento"><button data-dir="up" aria-label="Cima">▲</button><button data-dir="left" aria-label="Esquerda">◀</button><button data-dir="down" aria-label="Baixo">▼</button><button data-dir="right" aria-label="Direita">▶</button></div><button type="button" class="kp-route-footer" data-kp-route-footer aria-label="Ir ao objetivo da missão">IR</button><button type="button" class="kp-interact" data-interact>INTERAGIR</button><button type="button" data-kp-fish hidden>PESCAR</button></footer>`;
    D.body.appendChild(root); model.root = root; model.canvas = root.querySelector('canvas'); model.ctx = model.canvas.getContext('2d'); model.dialog = root.querySelector('#psy-kanto-dialog');
    root.querySelector('.kp-close').onclick = closeWorld;
    const followObjective=()=>{if(model.riftSession){W.notif?.('Conclua a exploração da fenda antes de seguir outra rota.',2000);return;}W.PsyCampaignAutomation?.startPrimaryRoute?.()};
    root.querySelector('[data-kp-route]').onclick=followObjective;
    root.querySelector('[data-kp-route-footer]').onclick=followObjective;
    root.querySelector('[data-kp-hobbies]').onclick=()=>{model.held=null;model.autoSpot=null;model.autoHunt=false;model.autoPath=[];W.PsyHobbies?.open?.()};
    root.querySelector('[data-kp-fish]').onclick=()=>{model.held=null;model.autoSpot=null;model.autoPath=[];W.PsyHobbies?.startFishing?.(model.place?.id,{x:(model.x+.5)*TILE,y:(model.y+.5)*TILE,facing:model.direction})};
    root.querySelector('[data-back]').onclick = () => { closeWorld(); W.openKantoJourneyV1?.(); };
    root.querySelector('[data-interact]').onclick = e => { e.preventDefault(); e.stopPropagation();W.PsyCampaignAutomation?.cancelRoute?.();model.autoObjective=null;model.autoSpot=null;interact(); };
    root.querySelectorAll('[data-dir]').forEach(btn => {
      const dir = btn.dataset.dir;
      const start = e => { e.preventDefault();W.PsyCampaignAutomation?.cancelRoute?.();model.autoObjective=null;model.autoSpot=null;model.autoPortal=false;model.autoRiftExit=false;model.autoHunt=false;model.autoPath=[]; model.held = dir; };
      const stop = e => { e.preventDefault(); if (model.held === dir) { model.held = null; model.frame = 0; render(); } };
      btn.addEventListener('pointerdown', start); btn.addEventListener('pointerup', stop); btn.addEventListener('pointercancel', stop); btn.addEventListener('pointerleave', stop);
    });
    D.addEventListener('keydown', onKeyDown,true); D.addEventListener('keyup', onKeyUp,true);
    model.canvas.style.touchAction='none';let touch=null;
    model.canvas.addEventListener('pointerdown',e=>{if(W.PsyGuide?.isOpen()||model.riftFrozen)return;W.PsyCampaignAutomation?.cancelRoute?.();model.autoObjective=null;model.autoSpot=null;model.autoPortal=false;model.autoRiftExit=false;model.autoHunt=false;model.autoPath=[];touch={id:e.pointerId,x:e.clientX,y:e.clientY,drag:false};model.canvas.setPointerCapture?.(e.pointerId);e.preventDefault();});
    model.canvas.addEventListener('pointermove',e=>{if(!touch||e.pointerId!==touch.id)return;const dx=e.clientX-touch.x,dy=e.clientY-touch.y;if(Math.hypot(dx,dy)<7){model.held=null;model.joy=null;return;}touch.drag=true;model.joy={x:dx/48,y:dy/48};model.held=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';e.preventDefault();});
    const release=e=>{const t=touch;touch=null;model.joy=null;model.held=null;model.moving=false;model.frame=0;if(t&&!t.drag&&e.type==='pointerup'){
      const r=model.canvas.getBoundingClientRect(),view=model.camera||campaignCamera(),sx=(e.clientX-r.left)*model.canvas.width/r.width,sy=(e.clientY-r.top)*model.canvas.height/r.height,x=(sx-view.ox)/view.scale,y=(sy-view.oy)/view.scale;
      const target=model.riftSession?model.map?.exit:model.riftPortal;
      if(target){const tx=model.riftSession?target.x*TILE+TILE/2:target.x*TILE+TILE/2,ty=model.riftSession?target.y*TILE+TILE/2:target.y*TILE+TILE/2;
        if(Math.hypot(x-tx,y-ty)<34){const goal={x:target.x,y:target.y},path=tilePath(goal);if(!path.length&&(goal.x!==model.x||goal.y!==model.y))return;model.autoPath=path;if(model.riftSession)model.autoRiftExit=true;else model.autoPortal=true;if(!path.length){if(model.riftSession)returnFromRift(false);else enterRift();}return;}
      }
      const door=model.map.doors?.find(d=>Math.hypot(x-(d.x+.5)*TILE,y-(d.y+.5)*TILE)<28);if(door){model.autoObjective=door;model.autoPath=tilePath(door);if(!model.autoPath.length)interact();return;}
      const npc=model.map?.npc;if(npc&&Math.abs(x-(npc.x*TILE+14))<28&&Math.abs(y-(npc.y*TILE))<42){if(nearby(npc))interact(true);else{model.autoObjective=npc;model.autoPath=tilePath(npc);}return;}
      if(model.place?.kind==='route'||model.place?.kind==='dungeon'||model.place?.id==='viridian-forest'||model.place?.id===RIFT_ID){
        const spot=W.PsyHobbies?.nearby?.(model.place.id,{x,y},32);
        if(spot){const goal={x:Math.max(1,Math.min(COLS-2,Math.floor(spot.x/TILE))),y:Math.max(1,Math.min(ROWS-2,Math.floor(spot.y/TILE)))},path=tilePath(goal);
          if(!path.length&&(goal.x!==model.x||goal.y!==model.y)){W.notif?.('Não há um caminho acessível até este recurso.',1800);return;}
          model.autoSpot=spot.id;model.autoPath=path;if(!path.length){model.autoSpot=null;W.PsyHobbies.interact?.(model.place.id,spot.id,{x:(model.x+.5)*TILE,y:(model.y+.5)*TILE,facing:model.direction});}return;
        }
      }
      const cell={x:Math.floor(x/TILE),y:Math.floor(y/TILE)},path=tilePath(cell);if(path.length)model.autoPath=path;
    }render();};
    model.canvas.addEventListener('pointerup',release);model.canvas.addEventListener('pointercancel',release);model.canvas.addEventListener('lostpointercapture',release);
    W.addEventListener('blur',()=>{model.keys.clear();model.joy=null;model.held=null;model.moving=false;model.time=performance.now();});
    D.addEventListener('visibilitychange',()=>{model.keys.clear();model.joy=null;model.held=null;model.moving=false;model.time=performance.now();});
    W.addEventListener('pagehide',()=>{rememberPosition();W.psyV9WriteLocal?.()});
    W.addEventListener('resize', render);
    return root;
  }
  function theme(place) { return THEMES[place.kind] || THEMES.route; }
  function hash(text) { let h=2166136261; for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)} return h>>>0; }
  function random(seed) { let n=seed>>>0; return () => { n=(n+0x6D2B79F5)>>>0; let t=n; t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296; }; }

  const EARLY=['viridian','route-2','viridian-forest','pewter','route-3','mt-moon','route-4','cerulean'];
  const STORY={
    viridian:{text:'O ginásio de Viridian ainda está fechado. Siga pela Rota 2 e atravesse o bosque para encontrar Brock em Pewter.',done:'Você aprendeu a rota para Pewter.'},
    'route-2':{text:'Eu parei para conferir minhas anotações e um Pokémon saiu do mato, agarrou a alça da mochila e fugiu! Meu caderno está lá dentro. Você pode procurar nas áreas de grama da rota? Se conseguir recuperá-la, volte aqui; vou separar algumas Pokéballs para agradecer.',object:'Você recuperou a mochila de Caio. O caderno continua protegido; leve a mochila de volta ao treinador.'},
    'viridian-forest':{text:'As lanternas antigas marcam a trilha segura. Examine a clareira para orientar os viajantes perdidos.',object:'Você reacendeu a lanterna da clareira. A passagem para Pewter está sinalizada.'},
    pewter:{text:'Sou Brock. Meu ginásio testa preparo e estratégia. Recupere sua equipe no Centro Pokémon e fale comigo quando estiver pronto.'},
    'route-3':{text:'O Monte Lua fica no fim desta estrada. Há Pokémon de pedra e voadores nas encostas. Prepare sua equipe antes de entrar.',done:'A passagem para o Monte Lua está sinalizada.'},
    'mt-moon':{text:'A Equipe Rocket está tentando levar os fósseis. Ajude-me a proteger a câmara para liberar o caminho até Cerulean.'},
    'route-4':{text:'Cerulean fica depois desta descida. Procure o Centro Pokémon antes de desafiar Misty.',done:'O caminho para Cerulean foi encontrado.'},
    cerulean:{text:'Bem-vindo ao ginásio aquático! Sou Misty. Depois de Brock, é hora de testar sua equipe contra a força da água.'}
  };
  const ART_ROOT='assets/kanto/approved/';
  const MAP_ART={viridian:ART_ROOT+'viridian-approved.webp',pewter:ART_ROOT+'pewter-approved.webp','mt-moon':ART_ROOT+'mt-moon-approved.webp',cerulean:ART_ROOT+'cerulean-approved.webp','route-2':'assets/story/route-2-artist-v1.webp','viridian-forest':'assets/story/viridian-forest-route2-v1.webp'};
  const NPC_ART={viridian:'assets/kanto/npcs/fisher-v9.svg','route-2':'assets/kanto/cinematics/trainers/black_boy.webp','viridian-forest':'assets/kanto/cinematics/trainers/black_girl.webp',pewter:ART_ROOT+'brock-expressions.webp','route-3':'assets/kanto/cinematics/trainers/adventure_boy.webp','mt-moon':'assets/halloween/npc-researcher.webp','route-4':'assets/kanto/cinematics/trainers/adventure_girl.webp',cerulean:'https://play.pokemonshowdown.com/sprites/trainers/misty.png'};
  const npcIdleStates=new Map();
  function drawChapterNpcIdle(ctx,id,x,y,override=null){
    const filenames={'route-2':'basic-black-boy.webp','viridian-forest':'basic-black-girl.webp'},file=override||filenames[id],walk=W.PsyTrainerWalkV1;
    if(!file||!walk?.getAnimationAtlas)return false;
    const image=regionImage('assets/characters/halloween/'+file);if(!image?.complete||!image.naturalWidth)return false;
    if(!npcIdleStates.has(id))npcIdleStates.set(id,{state:walk.createState(),atlas:walk.getAnimationAtlas(image)});
    const data=npcIdleStates.get(id);ctx.fillStyle='#04101966';ctx.beginPath();ctx.ellipse(x,y+4,13,4.5,0,0,Math.PI*2);ctx.fill();
    return walk.renderAnimated(ctx,data.atlas,data.state,{moving:false,row:0,x,y,identity:id+':npc'},x-24,y+4-60,48,64)!==false;
  }
  const npcSheetCache=new WeakMap();
  function drawNpcSheet(ctx,img,x,y,now){
    let data=npcSheetCache.get(img);
    if(!data){
      const cell=img.naturalWidth/4,h=img.naturalHeight,scan=D.createElement('canvas');scan.width=img.naturalWidth;scan.height=h;
      const c=scan.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0);const pixels=c.getImageData(0,0,scan.width,h).data,boxes=[];let maxH=0;
      for(let f=0;f<4;f++){let left=cell,top=h,right=0,bottom=0;for(let py=0;py<h;py++)for(let px=0;px<cell;px++){if(pixels[(py*scan.width+f*cell+px)*4+3]>32){left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py);}}boxes.push({x:f*cell+left,y:top,w:right-left+1,h:bottom-top+1});maxH=Math.max(maxH,bottom-top+1);}
      data={boxes,scale:46/maxH};npcSheetCache.set(img,data);
    }
    const sequence=[0,1,0,2,0,3],box=data.boxes[sequence[Math.floor(now/650)%sequence.length]],w=box.w*data.scale,h=box.h*data.scale;
    ctx.fillStyle='#04101966';ctx.beginPath();ctx.ellipse(x,y+4,13,4.5,0,0,Math.PI*2);ctx.fill();ctx.imageSmoothingEnabled=false;ctx.drawImage(img,box.x,box.y,box.w,box.h,x-w/2,y+4-h,w,h);
  }
  const regionImages=new Map();
  function regionImage(url){if(!url)return null;if(!regionImages.has(url)){const im=new Image();im.onload=()=>{if(model.map)model.map.paint=null;render()};im.src=url;regionImages.set(url,im)}return regionImages.get(url);}
  function authoredMap(place){
    if(place.id==='pewter'&&W.PsyKantoPewterV4)return W.PsyKantoPewterV4.get();
    const early=W.PsyKantoEarlyChaptersV1?.get?.(place.id);if(early)return {...early,seed:hash(place.id)};
    if(!MAP_ART[place.id]||place.id==='route-2')return null;
    const grid=Array.from({length:ROWS},()=>Array(COLS).fill(9));
    const line=(ax,ay,bx,by,r=0)=>{const steps=Math.max(Math.abs(bx-ax),Math.abs(by-ay));for(let t=0;t<=steps;t++){const x=Math.round(ax+(bx-ax)*t/(steps||1)),y=Math.round(ay+(by-ay)*t/(steps||1));if(t>0){const px=Math.round(ax+(bx-ax)*(t-1)/(steps||1)),py=Math.round(ay+(by-ay)*(t-1)/(steps||1));if(x!==px&&y!==py&&py>0&&py<ROWS-1&&x>0&&x<COLS-1)grid[py][x]=1;}for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(y+dy>0&&y+dy<ROWS-1&&x+dx>0&&x+dx<COLS-1)grid[y+dy][x+dx]=1;}};
    let npc,object,exit,spawn,center,shop;
    if(place.id==='pewter'){
      spawn={x:16,y:18};npc={x:21,y:7};object={x:17,y:8};exit={x:2,y:11};center={x:9,y:12};shop={x:19,y:14};
      line(16,18,16,10,1);line(16,10,21,10,1);line(21,10,21,7);line(16,12,4,12);line(4,12,4,11);line(4,11,2,11);line(21,11,21,14);line(21,14,19,14);line(16,10,17,8);
    }else if(place.id==='viridian'){
      spawn={x:16,y:11};npc={x:16,y:7};object={x:13,y:8};exit={x:16,y:5};center={x:22,y:8};shop={x:27,y:8};
      line(16,11,13,11);line(13,11,13,8);line(13,8,16,7);line(16,7,16,5);line(16,11,19,11);line(19,11,19,9);line(19,9,27,9);line(22,9,22,8);line(27,9,27,8);
    }else if(place.id==='cerulean'){
      spawn={x:16,y:18};npc={x:18,y:5};object={x:21,y:11};exit={x:18,y:3};center={x:23,y:12};shop={x:23,y:14};
      line(16,18,16,13,1);line(16,13,18,9,1);line(18,9,18,5,1);line(18,5,18,3);line(18,11,23,11);line(23,11,23,14);
    }else{
      spawn={x:16,y:18};npc={x:23,y:4};object={x:23,y:5};exit={x:15,y:1};
      line(16,18,16,16);line(16,16,17,13);line(17,13,20,13);line(20,13,20,9);line(20,9,23,7);line(23,7,23,4);line(17,13,10,12);line(10,12,8,9);line(8,9,8,8);line(8,8,10,7);line(10,7,9,4);line(9,4,13,2);line(13,2,15,2);line(15,2,15,1);
    }
    if(place.id==='mt-moon')for(const [x,y]of [[16,16],[17,13],[20,11],[23,6],[10,11],[9,5]])if(grid[y]?.[x]===1)grid[y][x]=5;
    return {grid,npc,object,exit,spawn,returnGate:spawn,center,shop,art:MAP_ART[place.id],seed:hash(place.id)};
  }

  function buildMap(place) {
    const authored=authoredMap(place);if(authored)return authored;
    const rnd=random(hash(place.id)), grid=Array.from({length:ROWS},(_,y)=>Array.from({length:COLS},(_,x)=>(x===0||y===0||x===COLS-1||y===ROWS-1)?9:0));
    const path=(x,y,t=1)=>{if(grid[y]&&grid[y][x]!==9)grid[y][x]=t};
    // Route 2's collision route follows the hand-authored forest trail in its art.
    if(place.id==='route-2'){
      for(let x=2;x<=12;x++)path(x,17);
      for(let y=17;y>=5;y--)path(12,y);
      for(let x=12;x<=29;x++)path(x,5);
      for(let y=5;y<=16;y++)path(29,y);
    }else{
      // Shared route through generated locations leads from entrance to NPC and exit.
      for(let x=2;x<16;x++)path(x,ROWS-3); for(let y=ROWS-3;y>=6;y--)path(15,y); for(let x=15;x<COLS-2;x++)path(x,6); for(let y=6;y<ROWS-2;y++)path(COLS-3,y);path(15,5);
    }
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
    const npc=place.id==='route-2'?{x:12,y:6}:{x:15,y:4}, object={x:5,y:4}, exit=place.id==='route-2'?{x:29,y:16}:{x:COLS-3,y:ROWS-3},spawn=place.id==='route-2'?{x:3,y:17}:undefined;
    grid[npc.y][npc.x]=1; grid[object.y][object.x]=1; grid[exit.y][exit.x]=1;
    return {grid,npc,object,exit,spawn,returnTo:place.id==='route-3'?{world:'pewter',spawn:{x:29,y:11}}:undefined,secretGate,secretChest,art:MAP_ART[place.id],seed:hash(place.id)};
  }

  function buildRiftMap(){
    const grid=Array.from({length:ROWS},(_,y)=>Array.from({length:COLS},(_,x)=>x===0||y===0||x===COLS-1||y===ROWS-1?9:2));
    // The pond is a real collision zone with a walkable bank for the fishing minigame.
    for(let y=5;y<=16;y++)for(let x=26;x<=30;x++)grid[y][x]=3;
    for(let y=6;y<=14;y++)grid[y][25]=1;
    const exit={x:16,y:4},spawn={x:16,y:17};grid[exit.y][exit.x]=1;grid[spawn.y][spawn.x]=1;
    return {grid,spawn,exit,returnGate:exit,art:'assets/story/kanto-hunt-rift-v1.webp',seed:hash(RIFT_ID),rift:true};
  }
  function attachRiftOffer(offer){
    if(!offer||model.place?.id!==offer.context.world||!model.map)return false;
    const baseX=Math.max(1,Math.min(COLS-2,Math.round(offer.context.x))),baseY=Math.max(1,Math.min(ROWS-2,Math.round(offer.context.y)));
    let point=null;
    for(let radius=1;radius<=4&&!point;radius++)for(let dy=-radius;dy<=radius&&!point;dy++)for(let dx=-radius;dx<=radius&&!point;dx++){
      if(Math.abs(dx)!==radius&&Math.abs(dy)!==radius)continue;
      const x=baseX+dx,y=baseY+dy,tile=model.map.grid[y]?.[x];if(tile!==undefined&&![9,3,4].includes(tile))point={x,y};
    }
    if(!point)return false;
    model.riftPortal={...offer,...point};model.autoHunt=false;model.held=null;model.autoPath=[];model.autoObjective=null;
    updateObjective();render();W.notif?.('Uma fenda de caça surgiu perto de você. Aproxime-se e pressione INTERAGIR.',4500);return true;
  }
  function createRiftOffer(context,roll=Math.random()){
    const offer=W.PsyKantoHuntRiftV1?.tryOffer?.('campaign',context,Date.now(),roll);
    return attachRiftOffer(offer);
  }
  function enterRift(){
    const offer=model.riftPortal;if(!offer||model.riftSession)return false;
    const origin={place:model.place,map:model.map,x:model.x,y:model.y,direction:model.direction,autoHunt:model.autoHunt};
    const session=W.PsyKantoHuntRiftV1?.enter?.('campaign',offer.id,origin,Date.now());
    if(!session){model.riftPortal=null;W.notif?.('A fenda já se fechou.');updateObjective();render();return false;}
    model.riftOrigin=origin;model.riftSession=session;model.riftFrozen=false;model.riftPortal=null;model.root?.classList.add('psy-rift-active');
    model.autoHunt=false;model.autoObjective=null;model.autoSpot=null;model.autoPath=[];model.held=null;
    model.place=RIFT_PLACE;model.map=buildRiftMap();model.x=model.map.spawn.x;model.y=model.map.spawn.y;model.direction='up';model.frame=0;
    model.root.querySelector('.kp-title b').textContent=RIFT_PLACE.name;model.root.querySelector('.kp-title small').textContent=RIFT_PLACE.mark;
    updateObjective();render();W.notif?.('Você entrou na fenda. Há 3 minutos para explorar e coletar.',3200);return true;
  }
  function returnFromRift(expired){
    const session=model.riftSession;if(!session)return false;
    W.PsyHobbiesVFX?.cancelAction?.(RIFT_ID);W.PsyHobbies?.cancelFishing?.();
    const origin=W.PsyKantoHuntRiftV1?.finish?.(session)||model.riftOrigin;
    if(!origin)return false;
    model.riftSession=null;model.riftOrigin=null;model.riftFrozen=false;model.riftPortal=null;model.root?.classList.remove('psy-rift-active');
    model.place=origin.place;model.map=origin.map;model.x=origin.x;model.y=origin.y;model.direction=origin.direction||'down';
    model.autoHunt=!!origin.autoHunt&&Number(player().meta?.vipUntil||0)>Date.now();model.autoObjective=null;model.autoSpot=null;model.autoPath=[];model.held=null;
    model.root.querySelector('.kp-title b').textContent=model.place.name;model.root.querySelector('.kp-title small').textContent=model.place.mark;
    updateObjective();render();if(expired)W.notif?.('A fenda se fechou. Você retornou ao ponto de entrada com os recursos coletados.',3500);return true;
  }
  function updateRiftClock(now=Date.now()){
    if(!model.riftSession||model.riftFrozen)return;
    const status=W.PsyKantoHuntRiftV1?.status?.(model.riftSession,now);if(!status)return;
    const second=Math.ceil(status.remainingMs/1000);if(model.lastRiftSecond===second)return;model.lastRiftSecond=second;
    const min=String(Math.floor(second/60)).padStart(2,'0'),sec=String(second%60).padStart(2,'0');
    const objective=model.root?.querySelector('.kp-objective');if(objective)objective.textContent=`Fenda Selvagem · ${min}:${sec} · colete o que puder e retorne pelo portal ao norte`;
  }
  function tickRift(now=Date.now()){
    if(model.riftPortal){const current=W.PsyKantoHuntRiftV1?.getOffer?.('campaign',now);if(!current||current.id!==model.riftPortal.id){model.riftPortal=null;model.autoHunt=false;updateObjective();render();}}
    if(!model.riftSession)return false;
    const status=W.PsyKantoHuntRiftV1?.status?.(model.riftSession,now);
    if(status?.phase==='closing'&&!model.riftFrozen){
      model.riftFrozen=true;model.held=null;model.autoPath=[];model.autoHunt=false;W.PsyHobbiesVFX?.cancelAction?.(RIFT_ID);W.PsyHobbies?.cancelFishing?.();
      render();
    }
    if(status?.phase==='return'){returnFromRift(true);return false;}
    updateRiftClock(now);return !!model.riftFrozen;
  }
  function openWorld(id,options={}) {
    if(model.riftSession){W.notif?.('Saia pela passagem da fenda para voltar à jornada.',2200);return false;}
    if(id==='pallet'||id==='route-1'||id==='viridian'){
      if(W.PsyKantoWorldV2?.open)return W.PsyKantoWorldV2.open(id,options);
      W.notif?.('Mapa ilustrado indisponível. Recarregue a preview.',4000);
      return false;
    }
    const place=places().find(p=>p.id===id); if(!place)return;
    if(!isUnlocked(place)){W.notif?.('🔒 Conclua o capítulo anterior e obtenha as insígnias exigidas.',2600);return;}
    const previousPlace=model.place?.id||journeySave().activePlace||null;
    W.PsyHobbiesVFX?.cancelAction?.(model.place?.id);W.PsyKantoWorldV2?.close?.();makeRoot();model.autoHunt=false;model.autoObjective=null;model.autoSpot=null;model.autoPath=[]; model.place=place;model.routeIntent=!!options.continueRoute;model.outdoor=null;model.interior=null;model.joy=null; model.map=buildMap(place);const resume=options.resume?state().position:null;model.x=options.spawn?.x??(resume?.world===id?resume.x:null)??model.map.spawn?.x??3; model.y=options.spawn?.y??(resume?.world===id?resume.y:null)??model.map.spawn?.y??ROWS-3; model.direction=options.direction||'down';model.frame=0;model.held=null;model.keys.clear();model.moving=false;model.time=performance.now();model.encounterDistance=0;
    const pendingRift=W.PsyKantoHuntRiftV1?.getOffer?.('campaign');model.riftPortal=null;
    state().active=place.id;if(place.id==='route-2')W.PsyKantoBackpackQuestV1?.resume?.(placeState(place.id));
    model.root.dataset.place=place.id;model.root.querySelector('.kp-title b').textContent=place.name;
    model.root.querySelector('.kp-title small').textContent=place.mark;
    model.root.classList.add('open'); model.dialog.classList.remove('open'); updateObjective(); render();
    W.PsyKantoStoryV49?.enter?.(previousPlace,id);
    if(options.resume&&resume?.world===id&&resume.inside){const door=model.map.doors?.find(d=>d.id===resume.inside);if(door){const roomPosition=resume.roomPosition;enterRoom(door);if(roomPosition&&W.PsyKantoContinuousMotionV1.valid(model.map.grid,(roomPosition.x+.5)*TILE,(roomPosition.y+.5)*TILE)){model.x=roomPosition.x;model.y=roomPosition.y;rememberPosition();render();}}}
    if(!model.raf)tick();
    if(pendingRift?.context.world===id)attachRiftOffer(pendingRift);
  }
  function closeWorld() { model.routeIntent=false;rememberPosition();if(model.riftSession)returnFromRift(false);W.PsyHobbiesVFX?.cancelAction?.(model.place?.id);W.PsyCampaignAutomation?.cancelRoute?.();model.autoHunt=false;model.autoObjective=null;model.autoSpot=null;model.autoPath=[];model.held=null;model.keys.clear();model.moving=false;model.root?.classList.remove('open');model.dialog?.classList.remove('open');cancelAnimationFrame(model.raf);model.raf=0; }
  function onKeyDown(e) {
    if(!model.root?.classList.contains('open')||W.PsyHobbies?.isOpen?.()||W.PsyHobbies?.isFishing?.()||W.PsyTitles?.isOpen?.())return;
    e.stopImmediatePropagation();
    const dirs={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
    const dir=dirs[e.code]; if(dir){e.preventDefault();if(!e.repeat){W.PsyCampaignAutomation?.cancelRoute?.();model.autoObjective=null;model.autoSpot=null;model.autoPortal=false;model.autoRiftExit=false;model.keys.add(dir);model.held=dir}return;}
    if(e.code==='KeyE'||e.code==='Enter'||e.code==='Space'){e.preventDefault();W.PsyCampaignAutomation?.cancelRoute?.();model.autoObjective=null;model.autoSpot=null;interact();}
    if(e.code==='Escape'){e.preventDefault();closeWorld();}
  }
  function onKeyUp(e) { if(!model.root?.classList.contains('open'))return;e.stopImmediatePropagation();const dirs={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};if(dirs[e.code]){model.keys.delete(dirs[e.code]);model.held=model.keys.size?[...model.keys].at(-1):null;model.moving=false;render();} }
  function moveContinuous(dt) {
    model.moving=false;
    if(model.riftFrozen||W.PsyHobbiesVFX?.blocksMovement?.(model.place?.id)||W.PsyGuide?.isOpen()||W.PsyKantoStoryV49?.isOpen()||!model.place)return;
    const directions={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
    let dx=0,dy=0,maxDistance=Infinity;
    if(model.keys.size){for(const key of model.keys){dx+=directions[key].x;dy+=directions[key].y;}}
    else if(model.joy){dx=model.joy.x;dy=model.joy.y;}
    else if(model.held){dx=directions[model.held].x;dy=directions[model.held].y;}
    else if(model.autoPath?.length){
      const target=model.autoPath[0],x=target.x-model.x,y=target.y-model.y,d=Math.hypot(x,y);
      if(d<.00001){model.autoPath.shift();return;}
      dx=x/d;dy=y/d;maxDistance=d*TILE;
    }
    const motion=W.PsyKantoContinuousMotionV1;if(!motion)return;
    const position={x:(model.x+.5)*TILE,y:(model.y+.5)*TILE};
    const speed=143*(1+(Number(W.PsySeason?.buff('speed')||0)+Number(W.PsyProfessions?.bonus('main','speed')||0))/100);
    const wasAtExit=Math.hypot(model.x-model.map.exit.x,model.y-model.map.exit.y)<.1;
    const result=motion.advance(model.map.grid,position,{x:dx,y:dy},dt,speed,maxDistance,[{x:(model.map.npc.x+.5)*TILE,y:(model.map.npc.y+.5)*TILE,radius:8}]);
    model.x=position.x/TILE-.5;model.y=position.y/TILE-.5;model.moving=result.distance>0.0001;
    if(model.moving){
      model.direction=Math.abs(result.dx)>Math.abs(result.dy)?result.dx>0?'right':'left':result.dy>0?'down':'up';
      model.encounterDistance+=result.distance;
      if(model.encounterDistance>=32){model.encounterDistance%=32;if(model.map.grid[Math.floor(position.y/TILE)]?.[Math.floor(position.x/TILE)]===5)maybeEncounter();}
      if(!wasAtExit&&Math.hypot(model.x-model.map.exit.x,model.y-model.map.exit.y)<.1){if(model.interior){leaveRoom();return;}if(model.riftSession)returnFromRift(false);else interact();}
    }
    if(model.autoPath?.length&&maxDistance!==Infinity&&result.distance>=maxDistance-.0001)model.autoPath.shift();
  }
  function maybeEncounter() {
    if(Date.now()-model.encounterAt<2600||!model.place)return;
    if(Math.random()>.16)return;
    const p=player();if(!Array.isArray(p.team)||!p.team.length){showDialog('Equipe necessária','Escolha seu Pokémon inicial antes de explorar a rota.');return;}
    model.encounterAt=Date.now();
    const oldGet=W.getPokesForHunt, save=journeySave();
    const selectedHunt=(model.place.hunts||[]).find(h=>h.id===save.activeHunt);
    const baseIds=(selectedHunt?.species?.length?selectedHunt.species:model.place.species).slice();
    const ids=W.PsyWorldTimeV1?.weightSpecies?.(baseIds,model.place.id)||baseIds;
    const ps=placeState(model.place.id);
    W.getPokesForHunt=function(region,type,tier){
      if(region==='kanto'&&type==='normal'&&Number(tier)===1)return ids.map(id=>({id,name:(typeof getPokeName==='function'?getPokeName(id):W.getPokeName?.(id))||`Pokémon #${id}`,type:W.TYPE_BY_ID_FULL?.[id]||(typeof TYPE_BY_ID_ALL!=='undefined'?TYPE_BY_ID_ALL[id]:null)||'Normal'}));
      return typeof oldGet==='function'?oldGet.apply(this,arguments):[];
    };
    const previousStart=W.startBattle;
    W.startBattle=function(wild){wild.halloweenArea=model.place?.id;const range=model.map?.encounterLevels||({viridian:[2,4],'route-2':[3,6],'viridian-forest':[4,8],'pewter':[6,9],'route-3':[7,11],'mt-moon':[8,12],'route-4':[9,13],cerulean:[10,15]})[model.place?.id];if(range){wild.level=wild.lvl=range[0]+Math.floor(Math.random()*(range[1]-range[0]+1));wild.hp=wild.maxHp=65+wild.level*8;}if(model.place?.id==='route-2'&&!wild.campaignTrainer){const pending=W.PsyKantoBackpackQuestV1?.begin?.(placeState('route-2'),model.place.species,Number(wild.id));if(pending){model.pendingBackpack=pending;wild.campaignBackpackToken=pending.token;W.notif?.('Este Pokémon está carregando a mochila de Caio!',3200);}saveProgress();}const result=previousStart.apply(this,arguments);if(wild.campaignBackpackToken){W.setTimeout(()=>{const battle=D.getElementById('battle-screen');if(!battle||!model.pendingBackpack)return;D.getElementById('kanto-carrier-badge')?.remove();const badge=D.createElement('div');badge.id='kanto-carrier-badge';badge.textContent='🎒 Carrega a mochila de Caio';badge.style.cssText='position:absolute;top:8px;left:50%;transform:translateX(-50%);z-index:8;padding:6px 12px;border:1px solid #eac36a;border-radius:8px;background:#182437ee;color:#ffe09a;font:bold 12px system-ui;pointer-events:none';battle.appendChild(badge)},0);}return result;};
    try { W.triggerWild?.('kanto_normal_t1'); }
    finally {W.startBattle=previousStart; if(oldGet)W.getPokesForHunt=oldGet; else delete W.getPokesForHunt; }
    const wild=W.battleData?.wild || (typeof battleData!=='undefined'?battleData?.wild:null);
    if(wild?.id){if(!ps.found.includes(Number(wild.id)))ps.found.push(Number(wild.id));const saved=journeySave();saved[model.place.id]=[...new Set([...(saved[model.place.id]||[]),Number(wild.id)])];putJourneySave(saved);saveProgress();}
    updateObjective();
  }
  function nearby(point) { return Math.abs(model.x-point.x)+Math.abs(model.y-point.y)<=1; }
  function showDialog(title,text,actions=[]) {
    if(W.PsyGuide){model.held=null;model.joy=null;model.keys.clear();model.moving=false;return W.PsyGuide.show({speaker:title,text,portrait:/Brock/i.test(title)?ART_ROOT+'brock-expressions.webp':/Misty/i.test(title)?'https://play.pokemonshowdown.com/sprites/trainers/misty.png':title===model.place?.npc?NPC_ART[model.place.id]:undefined,sheet:/Brock/i.test(title)?'brock':undefined,target:()=>chapterTarget(model.map.npc),actions:actions.map(a=>({text:a.label,primary:a.primary,run:a.onClick}))});}
    const d=model.dialog;d.querySelector('.kp-dialog-title').textContent=title;d.querySelector('.kp-dialog-text').textContent=text;
    const box=d.querySelector('.kp-dialog-actions');box.replaceChildren();
    actions.forEach(({label,onClick,primary=false})=>{const b=D.createElement('button');b.textContent=label;if(primary)b.style.background='linear-gradient(100deg,#075985,#166534)';b.onclick=()=>{d.classList.remove('open');onClick?.()};box.appendChild(b)});
    if(!actions.length){const b=D.createElement('button');b.textContent='CONTINUAR';b.onclick=()=>d.classList.remove('open');box.appendChild(b)}
    d.classList.add('open');
  }

  function chapterTarget(point){
    const rect=model.canvas.getBoundingClientRect(),view=model.camera||campaignCamera(),sx=((point.x+.5)*TILE*view.scale+view.ox)*rect.width/view.w,sy=((point.y+.5)*TILE*view.scale+view.oy)*rect.height/view.h;
    return {left:rect.left+sx-14,top:rect.top+sy-45,right:rect.left+sx+14,bottom:rect.top+sy+8};
  }
  function launchChapterGym(place,gymId){
    if(!W.PsyCampaignGymGate?.beginFromCampaign?.(gymId,place.id)){
      W.notif?.('Desafie o líder diretamente dentro do mapa da campanha.',3200);return;
    }
    model.pendingGymPlace=place.id;closeWorld();W.startGymBattle(gymId);
    const arena=D.querySelector('#battle-screen .battle-hud');if(arena)arena.style.backgroundImage='url("'+ART_ROOT+(place.id==='pewter'?'brock-arena-approved.webp':'misty-arena-approved.webp')+'")';
  }
  function interactChapter(place,ps,gymId,directNPC=false){
    const map=model.map,story=STORY[place.id];
    if(!directNPC&&map.center&&nearby(map.center)){
      const p=player();for(const m of p.team||[]){m.hp=m.maxHp;m.fainted=false;}if(p.team?.[0])p.hp=p.team[0].hp;
      saveProgress();showDialog('Centro Pokémon','Sua equipe foi recuperada. Boa jornada!');return true;
    }
    if(!directNPC&&map.shop&&nearby(map.shop)){closeWorld();W.openShop?.();return true;}
    if(directNPC===true||nearby(map.npc)){
      if(place.id==='route-2'){
        const quest=W.PsyKantoBackpackQuestV1,q=quest.talk(ps),p=player();p.inventory=p.inventory||{};
        if(quest.deliver(ps,p.inventory)){
          saveProgress();markCleared(place);W.notif?.('Mochila devolvida · +3 Pokéball',2600);
          showDialog(place.npc,'Minha mochila! O caderno está aqui, inteiro. Obrigado por não desistir da busca. Leve estas três Pokéballs para a próxima trilha.');updateObjective();return true;
        }
        saveProgress();showDialog(place.npc,q.stage==='completed'?'Obrigado pela ajuda! A trilha ao norte leva à Floresta de Viridian.':story.text);updateObjective();return true;
      }
      ps.talked=true;if(story.done)ps.storyDone=true;saveProgress();
      const actions=[];
      if(gymId)model.routeIntent=false;
      if(gymId&&!W.PsyCampaignGymGate?.hasClearedInCampaign?.(gymId))actions.push({label:'DESAFIAR GINÁSIO',primary:true,onClick:()=>launchChapterGym(place,gymId)});
      if(place.id==='mt-moon'&&!ps.storyDone)actions.push({label:'PROTEGER OS FÓSSEIS',primary:true,onClick:()=>{
        model.pendingStoryPlace=place.id;
        W.startBattle?.({id:41,name:'Zubat',type:'Poison/Flying',level:12,lvl:12,maxHp:150,hp:150,rarity:{n:'Comum',mult:1,bonus:0},campaignTrainer:true});
      }});
      showDialog(place.npc,ps.storyDone?'Obrigado pela ajuda. A próxima passagem está liberada.':story.text,actions);updateObjective();return true;
    }
    if(nearby(map.object)&&['route-2','viridian-forest'].includes(place.id)){
      if(!ps.talked){showDialog('Pista','Converse primeiro com '+place.npc+'.');return true;}
      if(place.id==='route-2'){showDialog('Rastros na grama','A mochila foi levada por um Pokémon. Explore o mato e procure quem a está carregando.');return true;}
      const first=!ps.storyDone;ps.storyDone=true;saveProgress();if(first)W.notif?.('Objetivo da história concluído.',2200);
      showDialog(place.npc,story.object);updateObjective();return true;
    }
    const back=map.returnGate||{x:3,y:ROWS-3};
    if(nearby(back)){
      const all=places(),index=all.findIndex(p=>p.id===place.id),prev=all[index-1];
      const connection=map.returnTo,previous=connection?.world?all.find(p=>p.id===connection.world):prev;
      if(previous)showDialog('Voltar pelo caminho','Deseja retornar para '+previous.name+'?',[{label:'VOLTAR',primary:true,onClick:()=>{if(previous.id==='route-1'&&!connection){closeWorld();W.PsyKantoWorldV2?.open('route-1',{spawn:[848,95]});}else if(Array.isArray(connection?.spawn)){closeWorld();openWorld(previous.id,{spawn:connection.spawn,skipGuard:true});}else openWorld(previous.id,connection?.spawn?{spawn:connection.spawn}:{});}},{label:'FICAR'}]);return true;
    }
    if(nearby(map.exit)&&!objectivesMet(place)){
      showDialog('Jornada em andamento',gymId?'Converse com '+place.npc+' e conquiste a insígnia para seguir.':!ps.talked?'Converse com '+place.npc+' antes de seguir.':'Conclua o objetivo marcado no mapa antes de seguir.');return true;
    }
    return false;
  }

  function enterRoom(door){
    const room=W.PsyKantoPewterV4.room(door.id);if(!room)return;
    model.outdoor={map:model.map,x:model.x,y:model.y};model.interior=door.id;model.map=room;model.x=room.spawn.x;model.y=room.spawn.y;model.autoPath=[];model.keys.clear();model.held=null;model.joy=null;model.moving=false;model.camera=null;
    model.root.querySelector('.kp-title b').textContent=door.name;updateObjective();render();saveProgress();
  }
  function leaveRoom(){
    const old=model.outdoor;if(!old)return;model.map=old.map;model.x=old.x;model.y=old.y;model.interior=null;model.outdoor=null;model.autoPath=[];model.keys.clear();model.held=null;model.joy=null;model.moving=false;model.root.querySelector('.kp-title b').textContent=model.place.name;updateObjective();render();saveProgress();
  }
  function interactRoom(){
    const room=model.map,id=model.interior;if(nearby(room.exit)){leaveRoom();return;}
    if(!nearby(room.npc)){showDialog(room.npcName,'Aproxime-se para conversar. A saída fica ao sul.');return;}
    if(id==='gym'){interactChapter(model.place,placeState('pewter'),GYM_FOR_PLACE.pewter,true);return;}
    if(id==='center'){W.curarTimeCity?.();saveProgress();showDialog(room.npcName,'Sua equipe está recuperada. Boa sorte no Ginásio!');return;}
    if(id==='market'){showDialog(room.npcName,'Prepare suas Balls e poções antes de seguir para o Monte Lua.',[{label:'VER MERCADORIAS',primary:true,onClick:()=>{closeWorld();W.openShop?.();}}]);return;}
    showDialog(room.npcName,id==='museum'?'Estas rochas guardam marcas de mares que desapareceram há milhões de anos. Os fósseis do Monte Lua podem nos ajudar a entender essa história. Observe também os cristais nas vitrines.':'As trilhas do Monte Lua começam a leste. Antes de partir, visite o Museu e prepare sua equipe no Centro Pokémon.');
  }
  function interact(directNPC=false) {
    if(!model.place||W.PsyHobbies?.isFishing?.())return;
    model.autoObjective=null;
    if(model.interior){interactRoom();return;}
    if(model.place.id==='pewter'){const door=model.map.doors?.find(nearby);if(door){enterRoom(door);return;}if(nearby(model.map.npc)){showDialog('Guia de Pewter','Bem-vindo! O Museu fica a noroeste e o Ginásio de Brock a nordeste. O Centro e a Loja ficam na avenida. A saída leste leva à Rota 3 depois da Insígnia da Rocha.');return;}}
    if(model.riftSession){
      if(nearby(model.map.exit)){returnFromRift(false);return;}
      const gather=W.PsyHobbies?.nearby?.(RIFT_ID,{x:(model.x+.5)*TILE,y:(model.y+.5)*TILE},44);
      if(gather){W.PsyHobbies?.interact?.(RIFT_ID,gather.id,{x:(model.x+.5)*TILE,y:(model.y+.5)*TILE,facing:model.direction});render();return;}
      showDialog('Fenda Selvagem','A passagem de saída fica ao norte. Cada recurso mantém sua coleta e seu progresso normais.');return;
    }
    if(model.riftPortal&&Math.hypot(model.x-model.riftPortal.x,model.y-model.riftPortal.y)<=2){enterRift();return;}
    if(/^route-/.test(model.place.id)||model.place.id==='viridian-forest'||model.place.id===RIFT_ID){
      const gather=W.PsyHobbies?.nearby?.(model.place.id,{x:(model.x+.5)*TILE,y:(model.y+.5)*TILE},40);
      if(gather){W.PsyHobbies.interact?.(model.place.id,gather.id,{x:(model.x+.5)*TILE,y:(model.y+.5)*TILE,facing:model.direction});render();return;}
    }
    const place=model.place, ps=placeState(place.id), gymId=GYM_FOR_PLACE[place.id];
    if(EARLY.includes(place.id)&&interactChapter(place,ps,gymId,directNPC===true))return;
    if(directNPC===true||nearby(model.map.npc)){
      ps.talked=true;saveProgress();
      const needs=Math.max(0,objective(place)-new Set(ps.found).size),gymDone=!gymId||(Array.isArray(player().gymProgress)&&player().gymProgress.includes(gymId));
      const actions=[];
      if(gymId&&!W.PsyCampaignGymGate?.hasClearedInCampaign?.(gymId)&&typeof W.startGymBattle==='function')actions.push({label:'DESAFIAR GINÁSIO',primary:true,onClick:()=>launchChapterGym(place,gymId)});
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
          if(ok){if(!ps.solved.includes(mystery.id))ps.solved.push(mystery.id);if(model.map.secretGate)(model.map.grid[model.map.secretGate.y][model.map.secretGate.x]=1,model.map.paint=null);saveProgress();W.PsyKantoJourneyV1.refresh?.(place.id);showDialog(mystery.name,'A resposta correta abriu a passagem secreta.');render();}
          else showDialog(mystery.name,'A pista ainda não foi resolvida. Observe novamente os detalhes do enigma.');
        }}));
        showDialog(mystery.name,mystery.clue,choices);return;
      }
      const ok=W.PsyKantoJourneyV1.solveMystery(place,mystery);
      if(ok){if(!ps.solved.includes(mystery.id))ps.solved.push(mystery.id);if(model.map.secretGate)(model.map.grid[model.map.secretGate.y][model.map.secretGate.x]=1,model.map.paint=null);saveProgress();W.PsyKantoJourneyV1.refresh?.(place.id);showDialog(mystery.name,`${mystery.clue} O mecanismo cedeu e abriu uma passagem lateral.`);}
      else showDialog(mystery.name,'Ainda não foi possível abrir o mecanismo. Confira a técnica de campo exigida.');
      updateObjective();render();return;
    }
    if(model.map.secretChest&&model.map.grid[model.map.secretGate.y][model.map.secretGate.x]===1&&nearby(model.map.secretChest)){
      showDialog('Passagem secreta','Você encontrou a câmara oculta. A recompensa do enigma já foi registrada na sua jornada.');return;
    }
    if(nearby(model.map.exit)){
      if(!objectivesMet(place)){
        const count=new Set(ps.found).size, need=objective(place);
        showDialog('Saída bloqueada',`Converse com ${place.npc}, registre ${need} espécie(s) neste local${GYM_FOR_PLACE[place.id]?' e vença o ginásio':''}. Progresso: ${count}/${need}.`);return;
      }
      markCleared(place);
      if(place.id==='indigo')showDialog('Capítulos de Kanto concluídos','A exploração regional foi concluída. A Elite Four e o Campeão ainda precisam de uma arena de história própria para fechar a campanha completa.');
      else {
        const all=places(),next=all[all.findIndex(p=>p.id===place.id)+1];
        const actions=[];
        const connected=model.map.next,connectedPlace=connected?.world?all.find(p=>p.id===connected.world):next;
        if(model.routeIntent&&connectedPlace&&isUnlocked(connectedPlace)){openWorld(connectedPlace.id,{...(connected?.spawn?{spawn:connected.spawn}:{}),continueRoute:true});return;}
        if(connectedPlace&&isUnlocked(connectedPlace))actions.push({label:`SEGUIR PARA ${connectedPlace.name.toUpperCase()}`,primary:true,onClick:()=>openWorld(connectedPlace.id,connected?.spawn?{spawn:connected.spawn}:{})});
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
    if(model.riftSession){updateRiftClock();return;}
    if(model.riftPortal){model.root.querySelector('.kp-objective').textContent='Uma fenda de caça apareceu por perto. Aproxime-se e pressione INTERAGIR antes que ela desapareça.';return;}
    const place=model.place, ps=placeState(place.id), need=objective(place), count=new Set(ps.found).size, gym=GYM_FOR_PLACE[place.id], gymDone=!gym||(Array.isArray(player().gymProgress)&&player().gymProgress.includes(gym));
    if(EARLY.includes(place.id)){
      let todo='Siga para a próxima localidade';
      if(!ps.talked)todo='Converse com '+place.npc;
      else if(place.id==='route-2'&&!ps.storyDone)todo=ps.storyItemFound?'Devolva a mochila para Caio':'Procure o Pokémon com a mochila nos matos da Rota 2';
      else if(['route-2','viridian-forest','mt-moon'].includes(place.id)&&!ps.storyDone)todo='Conclua o objetivo da história';
      else if(gym&&!gymDone)todo='Conquiste a insígnia de '+place.npc;
      model.root.querySelector('.kp-objective').textContent=todo;
      return;
    }
    const items=[`Fale com <strong>${esc(place.npc)}</strong>: ${ps.talked?'✅':'◻'}`,`Registre espécies: <strong>${Math.min(count,need)}/${need}</strong>`];
    if(gym)items.push(`Ginásio: <strong>${gymDone?'✅ vencido':'pendente'}</strong>`);
    items.push(`Saída em <strong>E</strong> quando concluir · Encontre habitats marcados com grama`);
    model.root.querySelector('.kp-objective').innerHTML=items.join(' · ');
  }

  function terrainPaint(){
    if(model.map.paint)return model.map.paint;
    const art=regionImage(model.map.art),paint=D.createElement('canvas');paint.width=model.map.grid[0].length*TILE;paint.height=model.map.grid.length*TILE;
    const c=paint.getContext('2d'),th=theme(model.place),g=model.map.grid,offsetX=0,offsetY=0;
    if(art&&art.complete&&art.naturalWidth){c.imageSmoothingEnabled=true;c.drawImage(art,0,0,paint.width,paint.height);}
    else{    for(let y=0;y<g.length;y++)for(let x=0;x<g[0].length;x++){
      const t=g[y][x],sx=offsetX+x*TILE,sy=offsetY+y*TILE;
      c.fillStyle=t===9?th.wall:t===1?th.path:t===2?th.floor:t===3?th.floor:t===4?th.floor:t===5?th.floor:th.floor;c.fillRect(sx,sy,TILE,TILE);
      if(t===1){c.fillStyle='#ffffff10';c.fillRect(sx+2,sy+2,TILE-4,2)}
      if(t===2){c.fillStyle='#79bd73';c.fillRect(sx+4,sy+5,3,10);c.fillRect(sx+17,sy+2,3,12);c.fillStyle='#315a38';c.fillRect(sx+10,sy+17,5,8)}
      if(t===3){c.fillStyle='#171920';c.beginPath();c.arc(sx+14,sy+14,10,0,Math.PI*2);c.fill();c.fillStyle='#716a64';c.beginPath();c.moveTo(sx+4,sy+22);c.lineTo(sx+8,sy+6);c.lineTo(sx+14,sy+3);c.lineTo(sx+21,sy+9);c.lineTo(sx+24,sy+22);c.closePath();c.fill()}
      if(t===4){c.fillStyle='#41515a';c.fillRect(sx+4,sy+8,19,15);c.fillStyle='#85949b';c.fillRect(sx+7,sy+5,13,3)}
      if(t===5){c.fillStyle=th.accent;c.globalAlpha=.7;c.fillRect(sx+8,sy+7,2,12);c.fillRect(sx+17,sy+11,2,10);c.globalAlpha=1}
      if(t===9){c.fillStyle='#0004';c.fillRect(sx,sy+TILE-4,TILE,4)}
    }
}
    if(!art||art.complete)model.map.paint=paint;
    return paint;
  }
  // Match the camera used by Route 1 (core/kanto-world-v2.js): cover the play
  // area using its 900×450 reference, then follow the player through larger maps.
  function campaignCamera(){
    if(!model.canvas)return null;
    const benchmark=W.PsyKantoWorldV2?.referenceViewport?.();if(benchmark&&model.referenceKey!==benchmark.key){model.root.style.setProperty('--kp-top',benchmark.top+'px');model.root.style.setProperty('--kp-foot',benchmark.footer+'px');model.referenceKey=benchmark.key;}
    const stage=model.root?.querySelector('.kp-stage'),r=stage?.getBoundingClientRect();
    if(!r)return null;
    const worldW=model.map.grid[0].length*TILE,worldH=model.map.grid.length*TILE,enhancedScene=['route-2','viridian-forest','pewter'].includes(model.place?.id);
    if(!enhancedScene){if(model.canvas.width!==worldW||model.canvas.height!==worldH){model.canvas.width=worldW;model.canvas.height=worldH;}return model.camera={w:worldW,h:worldH,dpr:1,scale:1,ox:Math.floor((worldW-worldW)/2),oy:Math.floor((worldH-worldH)/2),viewW:worldW,viewH:worldH};}
    const dpr=Math.min(1.3,W.devicePixelRatio||1),cw=Math.max(260,Math.round(r.width*dpr)),ch=Math.max(180,Math.round(r.height*dpr));
    if(model.canvas.width!==cw||model.canvas.height!==ch){model.canvas.width=cw;model.canvas.height=ch;}
    const referenceW=benchmark?.mapW||900,referenceH=benchmark?.mapH||450;
    const cover=Math.max(cw/referenceW,ch/referenceH),scale=Math.min(4,cover*1.08),viewW=cw/scale,viewH=ch/scale,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    const cx=viewW>=worldW?worldW/2:clamp((model.x+.5)*TILE,viewW/2,worldW-viewW/2),cy=viewH>=worldH?worldH/2:clamp((model.y+.5)*TILE,viewH/2,worldH-viewH/2);
    return model.camera={w:cw,h:ch,dpr,scale,ox:Math.round(cw/2-cx*scale),oy:Math.round(ch/2-cy*scale),viewW,viewH};
  }
  const sceneAmbience=new WeakMap();
  function ambienceFor(map){
    if(sceneAmbience.has(map))return sceneAmbience.get(map);
    const grass=[];for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++)if(map.grid[y][x]===5&&((x*13+y*7)%5===0))grass.push({x:x*TILE+4+((x*11+y*3)%18),y:y*TILE+8+((x*5+y*9)%14),phase:(x*17+y*31)%628/100,color:(x+y)%3?'#d9f39a':'#a9e982'});
    const id=map.world?.id||model.place?.id||'',forest=id==='viridian-forest';
    const leaves=Array.from({length:forest?8:7},(_,i)=>({x:((i*137+forest*19)%Math.max(1,COLS*TILE-48))+24,y:((i*83+61)%Math.max(1,ROWS*TILE-48))+24,phase:i*1.71,speed:.018+(i%3)*.004,color:i%2?'#d7e58a':'#c9ed9b'}));
    const data={grass,leaves,forest};sceneAmbience.set(map,data);return data;
  }
  function drawSceneAmbience(c,now){
    if(model.interior||!['route-2','viridian-forest','pewter'].includes(model.place?.id))return;
    const data=ambienceFor(model.map),forest=data.forest;
    c.save();c.lineWidth=1;c.lineCap='round';
    for(const blade of data.grass){const sway=Math.sin(now*.00115+blade.phase),x=blade.x,y=blade.y;c.globalAlpha=.1+(Math.sin(now*.0014+blade.phase)+1)*.055;c.strokeStyle=blade.color;c.beginPath();c.moveTo(x,y+3);c.lineTo(x+sway*1.5,y-1);c.moveTo(x+3,y+4);c.lineTo(x+3-sway,y+1);c.stroke();}
    c.globalAlpha=1;
    for(const leaf of data.leaves){const cycle=(now*leaf.speed+leaf.phase)%(Math.PI*2),x=leaf.x+Math.sin(cycle)*8,y=leaf.y+Math.cos(cycle*.7)*3;c.save();c.translate(Math.round(x),Math.round(y));c.rotate(Math.sin(cycle)*.35);c.globalAlpha=.38+Math.sin(cycle)*.12;c.fillStyle=leaf.color;c.fillRect(-2,-1,3,2);c.fillRect(0,0,2,1);c.fillStyle='#fff0b2';c.fillRect(1,-1,1,1);c.restore();}
    const water=model.place.id==='pewter'?[]:forest?[[418,272],[440,291],[464,313],[445,341],[477,355]]:[[24,84],[38,135],[28,207],[52,267],[84,68]];
    for(let i=0;i<water.length;i++){const [x,y]=water[i],phase=now*.004+i*1.4;c.globalAlpha=.12+(Math.sin(phase)+1)*.12;c.fillStyle=i%2?'#c7f8ff':'#9deaff';c.fillRect(Math.round(x+Math.sin(phase)*2),y,5+(i%2),1);}
    if(forest){for(let i=0;i<4;i++){const phase=now*.0018+i*1.57,x=120+i*178+Math.sin(phase)*4,y=113+(i%2)*96+Math.cos(phase)*3;c.globalAlpha=.18+Math.max(0,Math.sin(phase))*.22;c.fillStyle='#fff3a8';c.fillRect(Math.round(x),Math.round(y),2,2);}}
    c.restore();
  }
  function tilePath(target){
    const g=model.map.grid,key=(x,y)=>x+','+y,q=[[Math.round(model.x),Math.round(model.y)]],prev=new Map([[key(Math.round(model.x),Math.round(model.y)),null]]);
    let end=null;
    for(let i=0;i<q.length;i++){const[x,y]=q[i];if((target.x===model.map.npc.x&&target.y===model.map.npc.y)?Math.abs(x-target.x)+Math.abs(y-target.y)<=1:x===target.x&&y===target.y){end=key(x,y);break;}for(const[dx,dy,dir]of [[0,-1,'up'],[0,1,'down'],[-1,0,'left'],[1,0,'right']]){const nx=x+dx,ny=y+dy,k=key(nx,ny),t=g[ny]?.[nx];if(nx<1||ny<1||nx>=g[0].length-1||ny>=g.length-1||[9,3,4].includes(t)||(nx===model.map.npc.x&&ny===model.map.npc.y)||prev.has(k))continue;prev.set(k,{x,y,dir});q.push([nx,ny]);}}
    if(!end)return [];const out=[];let p;while((p=prev.get(end))){const [x,y]=end.split(',').map(Number);out.push({x,y,dir:p.dir});end=key(p.x,p.y);}out.reverse();if(Math.hypot(model.x-q[0][0],model.y-q[0][1])>.00001)out.unshift({x:q[0][0],y:q[0][1]});return out;
  }
  function backpackGrassTarget(){
    const cells=[];for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++)if(model.map.grid[y][x]===5)cells.push({x,y,d:Math.hypot(x-model.x,y-model.y)});
    cells.sort((a,b)=>a.d-b.d);return cells.find(pt=>pt.d>1&&tilePath(pt).length)||cells[0]||model.map.npc;
  }
  function chapterQuest(){
    if(!model.place||!EARLY.includes(model.place.id)||!model.root?.classList.contains('open'))return [];
    const place=model.place,ps=placeState(place.id),gym=GYM_FOR_PLACE[place.id],objectNeeded=['route-2','viridian-forest'].includes(place.id)&&ps.talked&&!ps.storyDone,returnBackpack=place.id==='route-2'&&ps.storyItemFound&&!ps.storyDone;
    const needsGym=!!gym&&!player().gymProgress?.includes(gym),needsFossilStory=place.id==='mt-moon'&&!ps.storyDone;
    let target=model.map.exit,title='Siga para a próxima localidade';
    if(!ps.talked||needsGym||needsFossilStory){target=model.map.npc;title=!ps.talked?'Converse com '+place.npc:needsGym?'Conquiste a insígnia de '+place.npc:'Proteja os fósseis';}
    else if(objectNeeded){target=returnBackpack?model.map.npc:place.id==='route-2'?backpackGrassTarget():model.map.object;title=returnBackpack?'Devolva a mochila para Caio':place.id==='route-2'?'Procure o Pokémon com a mochila na grama':'Encontre o objetivo marcado';}
    if(place.id==='pewter'){if(model.interior)target=model.interior==='gym'?model.map.npc:model.map.exit;else if(!ps.talked||needsGym)target=model.map.doors.find(d=>d.id==='gym');}
    return [{id:'chapter-'+place.id,kind:'main',title,goal:'chapter',at:target}];
  }

  function continueObjectiveRoute(){
    if(!model.routeIntent||!model.root?.classList.contains('open')||model.autoObjective||model.autoPath?.length||model.held||W.PsyGuide?.isOpen()||W.PsyKantoStoryV49?.isOpen())return;
    const target=chapterQuest()[0]?.at;if(!target){model.routeIntent=false;return;}
    model.autoObjective={x:target.x,y:target.y};model.autoPath=tilePath(model.autoObjective);
    if(!model.autoPath.length&&!nearby(target)){model.routeIntent=false;model.autoObjective=null;W.notif?.('Não há um caminho livre até o objetivo.',2200);}
  }
  function render() {
    if(!model.place||!model.ctx||!model.root?.classList.contains('open'))return;
    const c=model.ctx,view=campaignCamera(),cw=view.w,ch=view.h,th=theme(model.place),g=model.map.grid,now=performance.now();
    W.PsyWorldTimeV1?.updateBadge?.(model.root.querySelector('[data-world-clock]'));
    const enhancedScene=['route-2','viridian-forest','pewter'].includes(model.place.id);
    c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=false;c.clearRect(0,0,cw,ch);c.fillStyle='#111722';c.fillRect(0,0,cw,ch);
    c.setTransform(view.scale,0,0,view.scale,view.ox,view.oy);c.imageSmoothingEnabled=enhancedScene;c.drawImage(terrainPaint(),0,0);c.imageSmoothingEnabled=false;
    drawSceneAmbience(c,now);
    const waterBtn=model.root.querySelector('[data-kp-fish]');
    if(waterBtn)waterBtn.hidden=!W.PsyHobbies?.canFish?.(model.place.id,{x:(model.x+.5)*TILE,y:(model.y+.5)*TILE},model.map.paint);

    if(model.place.kind==='route'||model.place.kind==='dungeon'||model.place.id==='viridian-forest'){W.PsyHobbies?.drawField?.(c,model.place.id);}
    if(model.place.id==='viridian-forest'&&placeState(model.place.id).storyDone){
      const pulse=.68+Math.sin(now/620)*.08;
      for(const [x,y] of model.map.lanterns||[]){const light=c.createRadialGradient(x,y,2,x,y,28);light.addColorStop(0,`rgba(255,216,119,${pulse*.34})`);light.addColorStop(1,'rgba(255,190,74,0)');c.fillStyle=light;c.fillRect(x-28,y-28,56,56);}
    }
    const visibleBounds={left:-view.ox/view.scale,right:(cw-view.ox)/view.scale,top:-view.oy/view.scale,bottom:(ch-view.oy)/view.scale};
    const pointVisible=(x,y)=>x>=visibleBounds.left&&x<=visibleBounds.right&&y>=visibleBounds.top&&y<=visibleBounds.bottom;
    const labelVisible=(x,y,width,height=14)=>x-width/2>=visibleBounds.left+3&&x+width/2<=visibleBounds.right-3&&y-height/2>=visibleBounds.top+3&&y+height/2<=visibleBounds.bottom-3;
    const marker=(pt,color,glyph,label,lift=0)=>{const sx=pt.x*TILE+TILE/2,sy=pt.y*TILE+TILE/2-lift;if(!pointVisible(sx,sy))return;c.fillStyle=color;c.beginPath();c.arc(sx,sy,10,0,Math.PI*2);c.fill();c.fillStyle='#17202a';c.font='bold 12px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(glyph,sx,sy+1);c.font='bold 10px system-ui';const text=label.length>22?label.slice(0,20)+'…':label,tw=Math.min(190,c.measureText(text).width+12,view.viewW-12),labelY=sy-22;if(labelVisible(sx,labelY,tw)){c.fillStyle='#071019d9';c.fillRect(sx-tw/2,labelY-7,tw,14);c.fillStyle='#fff';c.textBaseline='middle';c.fillText(text,sx,labelY)} };
    const drawPortal=(pt,label)=>{const sx=pt.x*TILE+TILE/2,sy=pt.y*TILE+TILE/2,pulse=.62+Math.sin(now/180)*.18,glow=c.createRadialGradient(sx,sy,3,sx,sy,34);glow.addColorStop(0,`rgba(121,247,231,${pulse})`);glow.addColorStop(.55,'rgba(131,91,255,.38)');glow.addColorStop(1,'rgba(55,42,140,0)');c.fillStyle=glow;c.beginPath();c.arc(sx,sy,34,0,Math.PI*2);c.fill();c.strokeStyle='#9af8ea';c.lineWidth=3;c.beginPath();c.ellipse(sx,sy,12,20,0,0,Math.PI*2);c.stroke();c.fillStyle='#e1ffff';c.font='bold 10px system-ui';c.textAlign='center';c.fillText(label,sx,sy-28)};
    const npcClose=enhancedScene&&Math.abs(model.x-model.map.npc.x)+Math.abs(model.y-model.map.npc.y)<=2;let drawNpcAfterActor=null;
    if(model.riftPortal)drawPortal(model.riftPortal,'FENDA · ENTRAR');
    if(model.place.id===RIFT_ID){drawPortal(model.map.exit,model.riftFrozen?'FENDA FECHANDO':'RETORNO');}
    else {
      for(const door of model.map.doors||[])if(Math.hypot(model.x-door.x,model.y-door.y)>2)marker(door,'#e3c789','⌂',door.name);
      if(model.map.center)marker(model.map.center,'#99edc6','+','Centro Pokémon');
      if(model.map.shop)marker(model.map.shop,'#8ac8ff','L','Loja');
      if(model.map.returnGate&&!nearby(model.map.returnGate))marker(model.map.returnGate,'#c4d8f2','‹','Retornar');
      const actor=regionImage(model.map.npcArt||NPC_ART[model.place.id]);
      if(actor?.complete&&actor.naturalWidth){const x=(model.map.npc.x+.5)*TILE,y=(model.map.npc.y+.5)*TILE,drawNpc=()=>{if(enhancedScene){if(model.map.idleSheet)drawNpcSheet(c,actor,x,y,now);else if(!drawChapterNpcIdle(c,model.map.id||model.place.id,x,y,model.map.npcIdle))c.drawImage(actor,x-22,y-54,44,58);}else if(model.place.id==='pewter')c.drawImage(actor,0,0,actor.naturalWidth/4,actor.naturalHeight,x-22,y-54,44,58);else c.drawImage(actor,x-22,y-54,44,58);};if(enhancedScene&&model.map.npc.y>=model.y)drawNpcAfterActor=drawNpc;else drawNpc();}
      if(!npcClose)marker(model.map.npc,'#ffcf70','!',model.map.npcName||model.place.npc,60);
      const route2Story=placeState(model.place.id);
      if(model.place.id==='viridian-forest')marker(model.map.object,route2Story.storyDone?'#ffe08a':'#75d5db',route2Story.storyDone?'✦':'?',route2Story.storyDone?'Lanterna acesa':'Lanterna antiga');
      marker(model.map.exit,objectivesMet(model.place)?'#79df94':'#cb7474','›',model.interior?'SAÍDA':model.place.id==='pewter'?'Rota 3 →':'Próxima rota');
      if(model.map.secretChest&&model.map.grid[model.map.secretGate.y][model.map.secretGate.x]===1)marker(model.map.secretChest,'#a4e7a0','★','Recompensa do enigma');
    }
    const px=model.x*TILE+TILE/2,py=model.y*TILE+TILE/2;
    if(W.PsyFollower){W.PsyFollower.draw(c,{scene:'chapter:'+model.place.id,x:(model.x+.5)*TILE,y:(model.y+.5)*TILE,moving:model.moving,facing:model.direction,valid:(x,y)=>{const value=model.map.grid[Math.floor(y/TILE)]?.[Math.floor(x/TILE)];return [1,5].includes(value);},trainer:()=>{}});}
    const avatar=selectedAvatar(),activityScene=model.place.id,worldActor={x:(model.x+.5)*TILE,y:(model.y+.5)*TILE},action=W.PsyHobbiesVFX?.sampleAction?.(activityScene,{...worldActor,moving:false});
    if(avatar?.ready){
      const row=action?.row??({down:0,left:1,right:2,up:3})[model.direction]??0;
      const sourceFrame=IDLE_FRAME;
      drawNormalizedAvatar(c,avatar,row,sourceFrame,px,py+8,action);
    }else{
      c.fillStyle='#141a23';c.beginPath();c.ellipse(px,py+8,8,4,0,0,Math.PI*2);c.fill();
      // Keep the floor shadow while artwork loads; never invent another trainer.
    }
    W.PsyHobbiesVFX?.drawActor?.(c,activityScene,{x:px,y:py+8,action,atlas:avatar?.animationAtlas,avatarUrl:avatar?.image?.src||''});
    if(drawNpcAfterActor)drawNpcAfterActor();
    if(!npcClose){c.fillStyle='#fff';c.font='bold 12px system-ui';c.textAlign='center';c.textBaseline='alphabetic';c.fillText(player().name||'Treinador',px,py-46);W.PsySeason?.drawTitle(c,px,py-61);}
    c.setTransform(1,0,0,1,0,0);W.PsyWorldTimeV1?.drawAmbient?.(c,cw,ch);
    if(model.riftFrozen){c.fillStyle='#04111de6';c.fillRect(0,0,cw,ch);c.fillStyle='#a4fff1';c.font='bold 26px system-ui';c.fillText('A FENDA SE FECHA',cw/2,ch/2-8);c.font='bold 14px system-ui';c.fillStyle='#f5f1ff';c.fillText('Retornando ao ponto de entrada…',cw/2,ch/2+20);}
  }
  let chapterAnimationState=null;
  function selectedAvatar(){
    const p=player(),id=p.playerCharacterId,character=(W.PsyHalloweenCharacters||[]).find(c=>c.id===id);
    if(!character)return null;
    const key=character.costumes?.[p.playerCostumeByCharacter?.[id]]?p.playerCostumeByCharacter[id]:'basic';
    const filename=character.costumes?.[key];if(!filename)return null;
    const url=AVATAR_ROOT+filename;
    if(avatarImages.has(url))return avatarImages.get(url);
    const entry={image:new Image(),ready:false,frameBounds:null,frameScale:1,frameCols:4};
    entry.image.onload=()=>{entry.ready=true;if(!W.PsyTrainerWalkV1)prepareAvatarFrames(entry);render()};entry.image.onerror=()=>{avatarImages.delete(url)};entry.image.src=url;avatarImages.set(url,entry);
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
  function drawNormalizedAvatar(ctx,avatar,row,col,centerX,baselineY,activityAction=null) {
    W.PsyCostumeAuraV1?.draw?.(ctx,avatar.image?.src,centerX,baselineY);
    if(W.PsyTrainerWalkV1?.getAnimationAtlas){
      const walk=W.PsyTrainerWalkV1;if(!chapterAnimationState)chapterAnimationState=walk.createState();
      avatar.animationAtlas=avatar.animationAtlas||walk.getAnimationAtlas(avatar.image);
      ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(centerX,baselineY,13,5,0,0,Math.PI*2);ctx.fill();
      walk.renderAnimated(ctx,avatar.animationAtlas,chapterAnimationState,{moving:!activityAction&&model.moving,row,x:(model.x+.5)*TILE,y:(model.y+.5)*TILE,identity:model.place.id+':'+avatar.image.src},centerX-24,baselineY-60,48,64);return;
    }
    if(W.PsyTrainerWalkV1){const atlas=W.PsyTrainerWalkV1.getAtlas(avatar.image);W.PsyTrainerWalkV1.draw(ctx,atlas,row,col,centerX-24,baselineY-60,48,64);return;}
    const image=avatar.image,cols=avatar.frameCols||4,index=row*cols+col,box=avatar.frameBounds?.[index];
    if(!box){ctx.drawImage(image,col*SHEET_CELL,row*SHEET_CELL,SHEET_CELL,SHEET_CELL,centerX-25,baselineY-50,50,50);return;}
    const scale=avatar.frameScale||1,w=box.w*scale,h=box.h*scale;
    ctx.drawImage(image,col*SHEET_CELL+box.x,row*SHEET_CELL+box.y,box.w,box.h,centerX-w/2,baselineY-h,w,h);
  }
  function tick(timestamp=performance.now()) {
    if(!model.root?.classList.contains('open')){model.raf=0;return;}
    const now=timestamp,dt=Math.min(.12,Math.max(0,(now-(model.time||now))/1000));model.time=now;
    if(tickRift(Date.now())){model.raf=W.requestAnimationFrame(tick);return;}
    if(W.PsyHobbies?.isOpen?.()||W.PsyTitles?.isOpen?.()||D.getElementById('psy-hobby-fishing')?.classList.contains('show')){
      model.held=null;model.keys.clear();model.moving=false;model.autoPath=[];const fishingShown=D.getElementById('psy-hobby-fishing')?.classList.contains('show');if(fishingShown&&(!model.lastRender||now-model.lastRender>=33)){render();model.lastRender=now;}model.raf=W.requestAnimationFrame(tick);return;
    }
    if(model.autoHunt&&Number(player().meta?.vipUntil||0)<=Date.now()){model.autoHunt=false;model.autoPath=[];}
    if(model.autoHunt&&!model.autoPath?.length&&!model.held&&!W.PsyGuide?.isOpen()){
      const cells=[];for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++)if(model.map.grid[y][x]===5)cells.push({x,y,d:Math.hypot(x-model.x,y-model.y)});
      cells.sort((a,b)=>a.d-b.d);for(const target of cells.slice(0,12).sort(()=>Math.random()-.5)){const route=tilePath(target);if(route.length){model.autoPath=route;break;}}
    }
    const activityAction=W.PsyHobbiesVFX?.blocksMovement?.(model.place?.id);
    if(!activityAction){continueObjectiveRoute();moveContinuous(dt);}
    if(!activityAction&&!model.held&&model.autoObjective&&!model.autoPath?.length&&!W.PsyGuide?.isOpen()){
      const target=model.autoObjective,dx=target.x-model.x,dy=target.y-model.y;
      const q=model.place?.id==='route-2'?W.PsyKantoBackpackQuestV1?.state?.(placeState('route-2')):null;if(q?.stage==='investigating'){const target=backpackGrassTarget();model.autoObjective=target;model.autoPath=tilePath(target);model.raf=W.requestAnimationFrame(tick);render();return;}
      if(Math.abs(dx)+Math.abs(dy)<=1){model.direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';interact();}
      else model.autoObjective=null;
    }
    if(!activityAction&&!model.held&&model.autoSpot&&!model.autoPath?.length&&!W.PsyGuide?.isOpen()){
      const id=model.autoSpot,nodes=W.PsyHobbies?.visibleNodes?.(model.place?.id)||[],node=nodes.find(n=>n.id===id);model.autoSpot=null;
      if(node&&Math.hypot((model.x+.5)*TILE-node.x,(model.y+.5)*TILE-node.y)<=48)W.PsyHobbies?.interact?.(model.place.id,node.id,{x:(model.x+.5)*TILE,y:(model.y+.5)*TILE,facing:model.direction});
    }
    if(!activityAction&&!model.held&&!model.autoPath?.length&&model.autoPortal){model.autoPortal=false;if(model.riftPortal&&Math.hypot(model.x-model.riftPortal.x,model.y-model.riftPortal.y)<=2){enterRift();model.raf=W.requestAnimationFrame(tick);return;}}
    if(!activityAction&&!model.held&&!model.autoPath?.length&&model.autoRiftExit){model.autoRiftExit=false;if(model.riftSession&&nearby(model.map.exit)){returnFromRift(false);model.raf=W.requestAnimationFrame(tick);return;}}
    if(now-(model.lastPositionSave||0)>1500){rememberPosition();model.lastPositionSave=now;}
    render();model.lastRender=now;model.raf=requestAnimationFrame(tick);
  }
  function injectEntryButton() {
    const detail=D.querySelector('#psy-kanto-atlas .psy-kanto-detail');if(!detail)return;
    const id=detail.dataset.placeId,title=detail.querySelector('h3')?.textContent?.trim();if(!title)return;
    const place=places().find(p=>p.id===id||p.name===title);if(!place||detail.querySelector('.psy-kanto-enter-world'))return;
    const button=D.createElement('button');button.className='psy-kanto-enter-world';button.type='button';button.textContent=isUnlocked(place)?'ABRIR LOCALIDADE':'CAPÍTULO BLOQUEADO';button.disabled=!isUnlocked(place);button.onclick=()=>openWorld(place.id,{resume:true});
    const pane=detail.querySelector('[data-atlas-pane="journey"]');if(pane)pane.appendChild(button);else detail.appendChild(button);
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
        if(wasOpen){model.resumeAfterEncounter=true;model.joy=null;model.held=null;model.keys.clear();model.moving=false;model.root.classList.remove('open');cancelAnimationFrame(model.raf);model.raf=0;}
        const battleWild=wild||W.battleData?.wild||(typeof battleData!=='undefined'?battleData?.wild:null);
        model.pendingRiftWin=encounterPlace&&['route','dungeon'].includes(encounterPlace.kind)&&battleWild?.id&&!battleWild.campaignTrainer?{world:encounterPlace.id,kind:encounterPlace.kind,x:model.x,y:model.y,direction:model.direction,autoHunt:model.autoHunt}:null;
        const result=oldStart.apply(this,arguments);
        try{
          const place=encounterPlace;
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
        D.getElementById('kanto-carrier-badge')?.remove();const backpack=model.pendingBackpack;model.pendingBackpack=null;if(backpack){const activeBattle=typeof battleData!=='undefined'?battleData:W.battleData,activeWild=activeBattle?.wild,validCarrier=activeWild?.campaignBackpackToken===backpack.token&&Number(activeWild?.id)===backpack.id&&Number(activeBattle?.wildHp)<=0;const recovered=W.PsyKantoBackpackQuestV1?.finish?.(placeState('route-2'),backpack,validCarrier&&won===true);saveProgress();if(recovered){W.notif?.('Mochila de Caio recuperada! Volte para devolvê-la.',3500);if(model.autoObjective){model.autoObjective=model.map.npc;model.autoPath=tilePath(model.map.npc);}}}
        if(won&&model.pendingStoryPlace){placeState(model.pendingStoryPlace).storyDone=true;saveProgress();model.pendingStoryPlace=null;}
        const gym=model.pendingGymPlace,place=places().find(p=>p.id===gym),gymId=place&&GYM_FOR_PLACE[place.id];
        if(won&&place&&gymId&&Array.isArray(player().gymProgress)&&player().gymProgress.includes(gymId)){W.PsyCampaignGymGate?.markVictory?.(gymId);model.pendingGymPlace=null;markCleared(place);}else if(!won&&gymId){W.PsyCampaignGymGate?.cancel?.();model.pendingGymPlace=null;}
        const riftContext=won===true?model.pendingRiftWin:null;model.pendingRiftWin=null;
        const result=oldEnd.apply(this,arguments);
        if(model.resumeAfterEncounter){if(!(player().team||[]).some(mon=>Number(mon.hp)>0))model.routeIntent=false;model.resumeAfterEncounter=false;W.setTimeout(()=>{if(model.place){model.root?.classList.add('open');updateObjective();render();if(!model.raf)tick()}if(riftContext)createRiftOffer({...riftContext,won:true,trainer:false});},0)}
        if(place&&gymId&&won&&player().gymProgress?.includes(gymId)){
          model.pendingGymPlace=null;W.setTimeout(()=>{openWorld(place.id,{resume:true});if(place.id==='cerulean')showDialog('Misty','Você conquistou a Insígnia da Cascata! Os dois primeiros ginásios de Kanto estão concluídos.');},100);
        }return result;
      };
      wrapped.__psyKantoPlayableWrapped=true;W.endBattle=wrapped;
    }
  }

  const previousBattleAction=W.battleAction;
  if(typeof previousBattleAction==='function')W.battleAction=function(action){
    const wild=typeof battleData!=='undefined'?battleData?.wild:null;
    if(action==='capture'&&wild?.campaignTrainer){W.notif?.('Pokémon de treinadores não podem ser capturados.',2500);return;}
    return previousBattleAction.apply(this,arguments);
  };
  const previousCapture=W.tryCaptureBattle;
  if(typeof previousCapture==='function')W.tryCaptureBattle=function(){
    const wild=typeof battleData!=='undefined'?battleData?.wild:null;
    if(wild?.campaignTrainer){W.notif?.('Pokémon de treinadores não podem ser capturados.',2500);return;}
    return previousCapture.apply(this,arguments);
  };
  const oldOpenAtlas=W.openKantoJourneyV1;
  if(typeof oldOpenAtlas==='function')W.openKantoJourneyV1=function(){const result=oldOpenAtlas.apply(this,arguments);W.setTimeout(monitorAtlas,0);return result;};
  W.setTimeout(monitorAtlas,0);wrapEncounter();
  W.PsyKantoPlayableV1={version:2,questRows:chapterQuest,getPosition:()=>model.root?.classList.contains('open')?{world:model.place?.id,x:model.x,y:model.y,inside:model.interior||null}:null,navigateTo:target=>{model.routeIntent=false;model.autoHunt=false;model.autoObjective=null;model.autoPath=tilePath(target);return model.autoPath.length>0;},cancelNavigation:()=>{model.routeIntent=false;model.autoObjective=null;model.autoPath=[];},isAutoRouting:()=>!!model.routeIntent,navigateObjective:(target,options={})=>{if(!model.root?.classList.contains('open')||!target)return false;const objective={x:Math.round(Number(target.x)),y:Math.round(Number(target.y))};if(!Number.isFinite(objective.x)||!Number.isFinite(objective.y))return false;const path=tilePath(objective);if(!path.length&&(objective.x!==model.x||objective.y!==model.y)&&!(objective.x===model.map.npc.x&&objective.y===model.map.npc.y&&nearby(model.map.npc)))return false;model.autoHunt=false;model.routeIntent=!!options.continue;model.held=null;model.autoObjective=objective;model.autoPath=path;return true;},setAutoHunt:on=>{if(model.riftSession){W.notif?.('A caçada automática retorna depois da fenda.',1800);return false;}if(on&&Number(player().meta?.vipUntil||0)<=Date.now()){if(!W.PsyCampaignAutomation?.showVipGate?.('hunt'))W.notif?.('Recurso exclusivo VIP.',2500);return false;}model.autoHunt=!!on;if(!on)model.autoPath=[];return model.autoHunt;},isAutoHunt:()=>!!model.autoHunt,open:openWorld,close:closeWorld,isUnlocked,objective,progress:()=>state(),enterHuntRift:enterRift,returnFromHuntRift:()=>returnFromRift(false),considerHuntRift:(context,roll)=>createRiftOffer(context,roll)};
})(window,document);

