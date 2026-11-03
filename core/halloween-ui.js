/* PSYWORLD — trainer character and Halloween costume selection. */
(function (W, D) {
  'use strict';
  if (W.__PSY_HALLOWEEN_UI_V1__) return;
  W.__PSY_HALLOWEEN_UI_V1__ = true;

  const ROOT = 'assets/characters/halloween/';
  const SHEET = 2048;
  const CELL = 512;
  const CHARACTERS = [
    { id: 'black_boy', name: 'Kai', detail: 'Treinador de Pallet', files: {
      basic: 'basic-black-boy.webp', divine: 'divine-black-boy.webp',
      macabre: 'horror-ghostface-black-boy.webp', macabre_alt: 'macabre-alt-black-boy.webp', supreme: 'apex-black-boy.webp'
    } },
    { id: 'black_girl', name: 'Maya', detail: 'Treinadora de Pallet', files: {
      basic: 'basic-black-girl.webp', divine: 'divine-black-girl.webp',
      macabre: 'horror-ghostface-black-girl.webp', macabre_alt: 'macabre-alt-black-girl.webp', supreme: 'apex-black-girl.webp'
    } },
    { id: 'gothic_boy', name: 'Rapaz gótico', detail: 'Explorador da noite', files: {
      basic: 'basic-gothic-boy.webp', divine: 'divine-gothic-boy.webp',
      macabre: 'horror-freddy-gothic-boy.webp', macabre_alt: 'macabre-alt-gothic-boy.webp', supreme: 'apex-gothic-boy.webp'
    } },
    { id: 'gothic_girl', name: 'Garota gótica', detail: 'Bruxa do eclipse', files: {
      basic: 'basic-gothic-girl.webp', divine: 'divine-gothic-girl.webp',
      macabre: 'horror-myers-gothic-girl.webp', macabre_alt: 'macabre-alt-gothic-girl.webp', supreme: 'apex-gothic-girl.webp'
    } },
    { id: 'adventure_boy', name: 'Aventureiro', detail: 'Viajante de Kanto', files: {
      basic: 'basic-adventure-boy.webp', divine: 'divine-adventure-boy.webp',
      macabre: 'horror-jason-adventure-boy.webp', macabre_alt: 'macabre-alt-adventure-boy.webp', supreme: 'apex-adventure-boy.webp'
    } },
    { id: 'adventure_girl', name: 'Aventureira', detail: 'Exploradora de Kanto', files: {
      basic: 'basic-adventure-girl.webp', divine: 'divine-adventure-girl.webp',
      macabre: 'horror-spectral-bride-adventure-girl.webp', macabre_alt: 'macabre-alt-adventure-girl.webp', supreme: 'apex-adventure-girl.webp'
    } }
  ];
  const COSTUMES = [
    { key: 'basic', label: 'Básica', note: 'Fantasia original' },
    { key: 'divine', label: 'Divina', note: 'Versão luminosa' },
    { key: 'macabre', label: 'Macabra I', note: 'Fantasia de terror' },
    { key: 'macabre_alt', label: 'Macabra II', note: 'Segunda fantasia de terror' },
    { key: 'supreme', label: 'Suprema', note: 'Visual especial' }
  ];
  const imageCache = new Map();
  let selectedCharacter = CHARACTERS[4].id;
  let currentPickerKind = 'new';

  function player() {
    try { return typeof P !== 'undefined' && P && typeof P === 'object' ? P : null; }
    catch (_) { return null; }
  }
  function character(id) { return CHARACTERS.find(c => c.id === id) || null; }
  function currentId() { return player()?.playerCharacterId || null; }
  function costumeKey(id) {
    const p = player();
    const saved = p?.playerCostumeByCharacter?.[id];
    return character(id)?.files?.[saved] ? saved : 'basic';
  }
  function imageFor(id, key) {
    const c = character(id), name = c?.files?.[key];
    if (!name) return null;
    const url = ROOT + name;
    if (imageCache.has(url)) return imageCache.get(url);
    const img = new Image();
    const entry = { img, ready: false, failed: false, url };
    img.onload = () => { entry.ready = true; drawPreviewCanvases(); };
    img.onerror = () => { entry.failed = true; };
    img.src = url;
    imageCache.set(url, entry);
    return entry;
  }
  function drawSheet(canvas, id, key, row, col) {
    const entry = imageFor(id, key), ctx = canvas?.getContext?.('2d');
    if (!entry || !ctx || !entry.ready) return false;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(entry.img, col * CELL, row * CELL, CELL, CELL, 0, 0, w, h);
    return true;
  }
  function drawPreviewCanvases() {
    D.querySelectorAll('canvas[data-psy-sheet-preview]').forEach(canvas => {
      drawSheet(canvas, canvas.dataset.character, canvas.dataset.costume || 'basic', 0, 0);
    });
  }
  function addStyles() {
    if (D.getElementById('psy-halloween-ui-style')) return;
    const style = D.createElement('style');
    style.id = 'psy-halloween-ui-style';
    style.textContent = `
      .psy-halloween-screen{position:fixed;inset:0;z-index:10020;display:none;overflow:auto;box-sizing:border-box;padding:max(18px,env(safe-area-inset-top)) 14px max(18px,env(safe-area-inset-bottom));background:radial-gradient(ellipse at 50% 0,#26364e 0,#10121d 46%,#08090e 100%);color:#f8fafc;font-family:Arial,sans-serif}
      .psy-halloween-screen.is-open{display:flex;align-items:center;justify-content:center}
      .psy-halloween-panel{width:min(980px,100%);max-height:100%;overflow:auto;margin:auto;padding:clamp(16px,3vw,28px);box-sizing:border-box;border:1px solid #53647a;border-radius:20px;background:linear-gradient(150deg,rgba(26,34,50,.98),rgba(10,13,23,.98));box-shadow:0 18px 70px #000b}
      .psy-halloween-title{margin:0;color:#ffe0a3;text-align:center;font-size:clamp(22px,4vw,32px);letter-spacing:.04em}
      .psy-halloween-subtitle{margin:8px 0 20px;color:#cbd5e1;text-align:center;font-size:14px;line-height:1.5}
      .psy-halloween-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px}
      .psy-halloween-card{min-width:0;padding:12px;border:1px solid #4a5568;border-radius:14px;background:linear-gradient(180deg,#202a3a,#151a25);color:#f8fafc;text-align:center;cursor:pointer;transition:border-color .15s,transform .15s,background .15s}
      .psy-halloween-card:hover{transform:translateY(-2px);border-color:#f6bd60}
      .psy-halloween-card.is-selected{border:2px solid #f6bd60;background:linear-gradient(180deg,#3b3429,#1a1c26);box-shadow:0 0 18px #f6bd6033}
      .psy-halloween-preview{display:block;width:96px;height:96px;margin:0 auto 8px;image-rendering:pixelated;background:radial-gradient(ellipse at 50% 82%,#334155,transparent 65%)}
      .psy-halloween-card strong{display:block;font-size:13px}
      .psy-halloween-card small{display:block;margin-top:4px;color:#aab6c7;font-size:11px;line-height:1.35}
      .psy-halloween-actions{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin-top:20px}
      .psy-halloween-action{min-height:44px;padding:10px 18px;border:1px solid #64748b;border-radius:11px;background:#1e293b;color:#fff;font-weight:800;cursor:pointer}
      .psy-halloween-action.primary{border-color:#f6bd60;background:linear-gradient(135deg,#9a5b24,#d08b31);color:#160f08}
      .psy-halloween-action:disabled{opacity:.45;cursor:not-allowed}
      #psy-halloween-avatar{position:absolute;left:50%;top:50%;width:118px;height:118px;z-index:9;display:none;pointer-events:none;image-rendering:pixelated;transform:translate(-50%,-82%);transform-origin:center bottom;will-change:transform}
      @media(max-width:520px){.psy-halloween-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.psy-halloween-card{padding:9px}.psy-halloween-preview{width:82px;height:82px}}
    `;
    D.head.appendChild(style);
  }
  function makeScreen(id, title, subtitle) {
    let el = D.getElementById(id);
    if (el) return el;
    el = D.createElement('section');
    el.id = id;
    el.className = 'psy-halloween-screen';
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('role', 'dialog');
    el.innerHTML = `<div class="psy-halloween-panel"><h1 class="psy-halloween-title"></h1><p class="psy-halloween-subtitle"></p><div class="psy-halloween-grid"></div><div class="psy-halloween-actions"></div></div>`;
    el.querySelector('.psy-halloween-title').textContent = title;
    el.querySelector('.psy-halloween-subtitle').textContent = subtitle;
    D.body.appendChild(el);
    return el;
  }
  function openScreen(el) { el.classList.add('is-open'); }
  function closeScreen(el) { el?.classList.remove('is-open'); }
  function renderCharacterCards(screen, selectedId, onPick) {
    const grid = screen.querySelector('.psy-halloween-grid');
    grid.replaceChildren();
    CHARACTERS.forEach(c => {
      const card = D.createElement('button');
      card.type = 'button';
      card.className = 'psy-halloween-card' + (c.id === selectedId ? ' is-selected' : '');
      card.dataset.character = c.id;
      const canvas = D.createElement('canvas');
      canvas.className = 'psy-halloween-preview';
      canvas.width = canvas.height = 96;
      canvas.dataset.psySheetPreview = '1';
      canvas.dataset.character = c.id;
      canvas.dataset.costume = costumeKey(c.id);
      const name = D.createElement('strong'); name.textContent = c.name;
      const detail = D.createElement('small'); detail.textContent = c.detail;
      card.append(canvas, name, detail);
      card.addEventListener('click', () => onPick(c.id));
      grid.appendChild(card);
      imageFor(c.id, 'basic');
    });
    drawPreviewCanvases();
  }
  function updateSelectedCard(screen, id) {
    screen.querySelectorAll('.psy-halloween-card[data-character]').forEach(card => {
      card.classList.toggle('is-selected', card.dataset.character === id);
    });
  }
  function ensureAvatarCanvas() {
    let canvas = D.getElementById('psy-halloween-avatar');
    const wrap = D.getElementById('game-wrap');
    if (!canvas && wrap) {
      canvas = D.createElement('canvas');
      canvas.id = 'psy-halloween-avatar';
      canvas.width = canvas.height = 118;
      canvas.setAttribute('aria-hidden', 'true');
      wrap.appendChild(canvas);
    }
    return canvas;
  }
  function hideAvatar() {
    const canvas = D.getElementById('psy-halloween-avatar');
    if (canvas) canvas.style.display = 'none';
  }
  function directionRow() {
    let direction = 'down';
    try { if (typeof playerDirection !== 'undefined') direction = playerDirection; } catch (_) {}
    // The approved sheets use rows in this order: front, left, right, back.
    return ({ down: 0, left: 1, right: 2, up: 3 })[direction] ?? 0;
  }
  function avatarShouldShow() {
    const wrap = D.getElementById('game-wrap');
    if (!wrap || wrap.style.display === 'none') return false;
    try { if (typeof inBattle !== 'undefined' && inBattle) return false; } catch (_) {}
    if (W.__psyIdleActive || W.PSY_RUNTIME_MODE?.is?.('adventure')) return false;
    return true;
  }
  // City and Kanto use the same four-step walking cycle and prerendered poses.
  const cityWalk={phase:0,last:0,moving:false,identity:''};
  function cityWalkPhase(moving,identity){
    const now=W.performance?.now?.()||Date.now();
    if(!moving){cityWalk.moving=false;cityWalk.phase=0;cityWalk.last=now;return 0}
    if(!cityWalk.moving||cityWalk.identity!==identity){
      cityWalk.phase=0;cityWalk.last=now;cityWalk.moving=true;cityWalk.identity=identity;
    }else if(now-cityWalk.last>=130){
      const steps=Math.min(4,Math.floor((now-cityWalk.last)/130));
      cityWalk.phase=(cityWalk.phase+steps)%4;
      cityWalk.last+=steps*130;
    }
    return cityWalk.phase;
  }
  function renderAvatar() {
    const p = player(), id = p?.playerCharacterId, c = character(id);
    const img = D.getElementById('player-poke-sprite');
    const canvas = ensureAvatarCanvas();
    if (!canvas) return false;
    if (!id || !c || !avatarShouldShow()) {
      hideAvatar();
      if (img && id && !avatarShouldShow()) img.style.display = 'none';
      else if (img && !id) img.style.display = '';
      return false;
    }
    const key = costumeKey(id), entry = imageFor(id, key), ctx = canvas.getContext('2d');
    if (!entry || !entry.ready) { hideAvatar(); return false; }
    if (img) img.style.display = 'none';
    const moving = !!p.moving;
    const walk=W.PsyTrainerWalkV1;
    const phase=cityWalkPhase(moving,id+':'+key);
    const frame=walk?walk.column(phase,moving):moving?[1,2,3,2][phase]:0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if(walk){
      if(!entry.walkAtlas)entry.walkAtlas=walk.getAtlas(entry.img);
      if(entry.walkAtlas){
        ctx.imageSmoothingEnabled=true;
        walk.draw(ctx,entry.walkAtlas,directionRow(),frame,15,14,88,94);
      }
    }else{
      ctx.imageSmoothingEnabled=false;
      ctx.drawImage(entry.img,frame*CELL,directionRow()*CELL,CELL,CELL,0,0,canvas.width,canvas.height);
    }
    // No CSS bounce: canvas and feet stay at the same world-space position.
    canvas.style.transform='translate(-50%, -82%)';
    canvas.style.display = 'block';
    canvas.dataset.character = id;
    canvas.dataset.costume = key;
    return true;
  }
  function syncAvatar() {
    try {
      if (currentId()) renderAvatar();
      else hideAvatar();
    } catch (err) { console.warn('[Halloween UI] avatar update failed', err); }
  }
  function persist() {
    try { if (typeof saveGame === 'function') saveGame(); } catch (err) { console.warn('[Halloween UI] save failed', err); }
  }
  function ensureCostumeRecord(p, id) {
    if (!p.playerCostumeByCharacter || typeof p.playerCostumeByCharacter !== 'object') p.playerCostumeByCharacter = {};
    if (!character(id).files[p.playerCostumeByCharacter[id]]) p.playerCostumeByCharacter[id] = 'basic';
  }
  function openCharacterPicker(kind) {
    currentPickerKind = kind || 'new';
    selectedCharacter = currentId() || CHARACTERS[4].id;
    const screen = makeScreen('psy-halloween-character-screen', currentPickerKind === 'new' ? 'ESCOLHA SEU TREINADOR' : 'ESCOLHA SEU PERSONAGEM', currentPickerKind === 'new' ? 'Escolha a aparência do seu treinador antes de escolher o Pokémon inicial.' : 'A identidade escolhida fica salva neste perfil. As fantasias podem ser trocadas depois.');
    const actions = screen.querySelector('.psy-halloween-actions');
    actions.replaceChildren();
    const back = D.createElement('button'); back.type = 'button'; back.className = 'psy-halloween-action'; back.textContent = currentPickerKind === 'new' ? 'VOLTAR' : 'CANCELAR';
    back.addEventListener('click', () => {
      closeScreen(screen);
      if (currentPickerKind === 'new') {
        const login = D.getElementById('screen-login'); if (login) login.style.display = 'flex';
      }
    });
    const next = D.createElement('button'); next.type = 'button'; next.className = 'psy-halloween-action primary'; next.textContent = currentPickerKind === 'new' ? 'ENTRAR NA CIDADE' : 'USAR ESTE PERSONAGEM';
    next.addEventListener('click', () => {
      const p = player(); if (!p) return;
      p.playerCharacterId = selectedCharacter;
      ensureCostumeRecord(p, selectedCharacter);
      p.playerCostumeKey = p.playerCostumeByCharacter[selectedCharacter];
      closeScreen(screen);
      if (currentPickerKind === 'new') {
        const login = D.getElementById('screen-login'); if (login) login.style.display = 'none';
        const starter = D.getElementById('screen-starter'); if (starter) starter.style.display = 'none';
        if (typeof W.startKantoCityPrelude === 'function') W.startKantoCityPrelude();
        else console.error('[Halloween UI] Kanto city entry is unavailable');
      } else {
        persist(); syncAvatar();
      }
    });
    actions.append(back, next);
    renderCharacterCards(screen, selectedCharacter, id => {
      selectedCharacter = id; updateSelectedCard(screen, id);
    });
    openScreen(screen);
  }
  function openCostumePicker() {
    const id = currentId();
    if (!id || !character(id)) return openCharacterPicker('change');
    const c = character(id);
    const screen = makeScreen('psy-halloween-costume-screen', 'FANTASIAS DO TREINADOR', `Identidade: ${c.name}. Cada visual permanece separado para este personagem.`);
    const grid = screen.querySelector('.psy-halloween-grid');
    grid.replaceChildren();
    const selected = costumeKey(id);
    COSTUMES.forEach(costume => {
      const card = D.createElement('button');
      card.type = 'button';
      card.className = 'psy-halloween-card' + (costume.key === selected ? ' is-selected' : '');
      const canvas = D.createElement('canvas');
      canvas.className = 'psy-halloween-preview'; canvas.width = canvas.height = 96;
      canvas.dataset.psySheetPreview = '1'; canvas.dataset.character = id; canvas.dataset.costume = costume.key;
      const name = D.createElement('strong'); name.textContent = costume.label;
      const note = D.createElement('small'); note.textContent = costume.note;
      card.append(canvas, name, note);
      card.addEventListener('click', () => {
        const p = player(); if (!p) return;
        ensureCostumeRecord(p, id);
        p.playerCostumeByCharacter[id] = costume.key;
        p.playerCostumeKey = costume.key;
        grid.querySelectorAll('.psy-halloween-card').forEach(el => el.classList.toggle('is-selected', el === card));
        persist(); syncAvatar();
      });
      grid.appendChild(card);
      imageFor(id, costume.key);
    });
    const actions = screen.querySelector('.psy-halloween-actions');
    actions.replaceChildren();
    const identity = D.createElement('button'); identity.type = 'button'; identity.className = 'psy-halloween-action'; identity.textContent = 'TROCAR PERSONAGEM';
    identity.addEventListener('click', () => { closeScreen(screen); openCharacterPicker('change'); });
    const close = D.createElement('button'); close.type = 'button'; close.className = 'psy-halloween-action primary'; close.textContent = 'FECHAR'; close.addEventListener('click', () => closeScreen(screen));
    actions.append(identity, close);
    drawPreviewCanvases(); openScreen(screen);
  }
  function addCostumeButton() {
    const host = D.getElementById('city-game-content-buttons');
    if (host && !D.getElementById('btn-psy-halloween-costumes')) {
      const button = D.createElement('button');
      button.id = 'btn-psy-halloween-costumes'; button.type = 'button';
      button.textContent = '🎭 TREINADOR / FANTASIAS';
      button.style.cssText = 'background:linear-gradient(135deg,#334155,#6b3c69);color:#fff;border:2px solid #e9a7d7;padding:10px 16px;border-radius:12px;font-weight:900;font-size:12px;';
      button.addEventListener('click', openCostumePicker);
      host.prepend(button);
    }
    const menu = D.getElementById('menu');
    if (menu && !D.getElementById('btn-psy-halloween-menu')) {
      const button = D.createElement('button');
      button.id = 'btn-psy-halloween-menu'; button.type = 'button'; button.className = 'psy-halloween-action';
      button.textContent = '🎭 APARÊNCIA DO TREINADOR';
      button.style.cssText = 'display:block;width:90%;margin:6px auto;';
      button.addEventListener('click', openCostumePicker);
      menu.appendChild(button);
    }
  }
  function install() {
    addStyles();
    ensureAvatarCanvas();
    addCostumeButton();
    const previousGoStarter = W.goStarter;
    if (typeof previousGoStarter === 'function' && !W.__psyHalloweenGoStarterWrapped) {
      W.__psyHalloweenGoStarterWrapped = true;
      W.goStarter = function () {
        try {
          if (typeof W.psyV9HasLocalSave === 'function' && W.psyV9HasLocalSave()) return previousGoStarter.apply(this, arguments);
        } catch (_) {}
        const input = D.getElementById('nick-input');
        const nick = String(input?.value || '').trim();
        if (nick.length < 2) { W.notif?.('❌ Nick muito curto!'); return; }
        const p = player(); if (p) p.name = nick;
        const label = D.getElementById('trainer-name-label'); if (label) label.textContent = nick;
        const login = D.getElementById('screen-login'); if (login) login.style.display = 'none';
        openCharacterPicker('new');
      };
    }
    if (typeof W.updatePlayerAnimatedSprite === 'function' && !W.__psyHalloweenAvatarWrapped) {
      W.__psyHalloweenAvatarWrapped = true;
      const previousUpdate = W.updatePlayerAnimatedSprite;
      W.updatePlayerAnimatedSprite = function () {
        if (currentId() && renderAvatar()) return true;
        hideAvatar();
        return previousUpdate.apply(this, arguments);
      };
    }
    // A battle loop does not call the city sprite updater; hide the overlay at entry.
    if (typeof W.startBattle === 'function' && !W.__psyHalloweenBattleWrapped) {
      W.__psyHalloweenBattleWrapped = true;
      const previousStartBattle = W.startBattle;
      W.startBattle = function () {
        hideAvatar();
        return previousStartBattle.apply(this, arguments);
      };
    }
    W.openPsyHalloweenCostumes = openCostumePicker;
    W.openPsyHalloweenCharacterPicker = () => openCharacterPicker('change');
    W.PsyHalloweenCharacters = CHARACTERS.map(c => ({ id: c.id, name: c.name, costumes: { ...c.files } }));
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})(window, document);

