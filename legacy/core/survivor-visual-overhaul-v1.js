/* PSYWORLD Survivor visual layer V1: cached gradients, arena ambience and resilient UI art. */
(function (W, D) {
  'use strict';
  if (W.__PSYWORLD_SURVIVOR_VISUAL_V1__) return;
  W.__PSYWORLD_SURVIVOR_VISUAL_V1__ = true;

  const themes = [
    { top: '#07192b', mid: '#0d4052', low: '#15524f', glow: '#45d6c6', edge: '#07111f' },
    { top: '#0b1a31', mid: '#16445f', low: '#22596a', glow: '#67c8e8', edge: '#080f20' },
    { top: '#201633', mid: '#44305d', low: '#554c76', glow: '#be9af5', edge: '#100d20' },
    { top: '#0c2028', mid: '#175044', low: '#286b56', glow: '#6ee7b7', edge: '#07151a' },
    { top: '#281b24', mid: '#57402f', low: '#625244', glow: '#f4bd66', edge: '#140f1a' }
  ];
  const firstFillAfterClear = new WeakSet();
  const backgroundPainted = new WeakSet();
  const skippedVignette = new WeakSet();
  const ctxCache = new WeakMap();
  const canvasProto = W.CanvasRenderingContext2D?.prototype;
  if (canvasProto && !canvasProto.__psySurvivorVisualV1) {
    canvasProto.__psySurvivorVisualV1 = true;
    const nativeClearRect = canvasProto.clearRect;
    const previousFillRect = canvasProto.fillRect;

    canvasProto.clearRect = function (x, y, w, h) {
      if (this.canvas?.id === 'psy-clean-surv-canvas' && x <= 0 && y <= 0 && w >= this.canvas.width && h >= this.canvas.height) {
        firstFillAfterClear.delete(this);
        backgroundPainted.delete(this);
        skippedVignette.delete(this);
      }
      return nativeClearRect.apply(this, arguments);
    };

    function arenaCache(ctx, s, w, h) {
      const themeIndex = Math.floor((Math.max(1, Number(s.phase || 1)) - 1) / 20) % themes.length;
      const current = ctxCache.get(ctx);
      if (current && current.w === w && current.h === h && current.themeIndex === themeIndex) return current;
      const theme = themes[themeIndex];
      const ground = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.08, w * 0.5, h * 0.52, Math.max(w, h) * 0.86);
      ground.addColorStop(0, theme.low);
      ground.addColorStop(0.42, theme.mid);
      ground.addColorStop(0.76, theme.top);
      ground.addColorStop(1, theme.edge);
      const next = { w, h, themeIndex, theme, ground };
      ctxCache.set(ctx, next);
      return next;
    }

    function paintArena(ctx, s, w, h) {
      const cache = arenaCache(ctx, s, w, h);
      ctx.fillStyle = cache.ground;
      previousFillRect.call(ctx, 0, 0, w, h);
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = cache.theme.glow;
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(w * 0.5, h * 0.52, 96 + i * 82, 34 + i * 30, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    canvasProto.fillRect = function (x, y, w, h) {
      const canvas = this.canvas;
      if (canvas?.id === 'psy-clean-surv-canvas' &&
          x === 0 && y === 0 && w === canvas.width && h === canvas.height &&
          !firstFillAfterClear.has(this)) {
        firstFillAfterClear.add(this);
        const s = W.PSY_CLEAN_SURV;
        if (s && !s.done) {
          const themeIndex = Math.floor((Math.max(1, Number(s.phase || 1)) - 1) / 20) % themes.length;
          const screen = D.getElementById('screen-survivor-v12');
          if (screen && screen.dataset.psySurvBiome !== String(themeIndex)) screen.dataset.psySurvBiome = String(themeIndex);
          backgroundPainted.add(this);
          paintArena(this, s, w, h);
          return;
        }
      }
      if (canvas?.id === 'psy-clean-surv-canvas' &&
          x === 0 && y === 0 && w === canvas.width && h === canvas.height &&
          backgroundPainted.has(this) && !skippedVignette.has(this)) {
        skippedVignette.add(this);
        return;
      }
      return previousFillRect.apply(this, arguments);
    };
  }

  const categoryIcons = {
    defesa: '🛡️', ofensivo: '⚔️', ajudante: '🐾', área: '✨', area: '✨',
    economia: '🍀', suporte: '💠', especial: '🌊', elite: '🔮'
  };
  const nameIcons = [
    [/dragonite/i, '🐉'], [/gengar/i, '👻'], [/lapras/i, '🌊'], [/slowpoke/i, '💧'],
    [/blissey/i, '💖'], [/charizard/i, '🔥'], [/pikachu/i, '⚡'], [/fortuna|loot|gold/i, '🍀'],
    [/água|agua|cura|heal/i, '💧'], [/rajada|projétil|projetil/i, '☄️'], [/nova|psíquica|psiquica/i, '✨']
  ];
  function iconFor(card) {
    const title = card.querySelector('h3')?.textContent?.trim() || '';
    for (const [pattern, icon] of nameIcons) if (pattern.test(title)) return icon;
    const kind = card.querySelector('.psy-surv-upkind')?.textContent?.trim().toLowerCase() || '';
    return categoryIcons[kind] || '✦';
  }
  function decorateCards(root = D) {
    root.querySelectorAll?.('.psy-surv-upcard').forEach(card => {
      const art = card.querySelector('.psy-surv-upimg');
      const img = art?.querySelector('img');
      if (art && !art.dataset.psyFallbackReady) {
        art.dataset.psyFallbackReady = '1';
        art.dataset.psySurvFallback = iconFor(card);
      }
      if (img && !img.dataset.psySurvObserved) {
        img.dataset.psySurvObserved = '1';
        const sync = () => {
          card.classList.toggle('psy-no-art', !img.naturalWidth);
          card.classList.toggle('psy-has-art', !!img.naturalWidth);
        };
        img.addEventListener('load', sync);
        img.addEventListener('error', () => setTimeout(sync, 250));
        setTimeout(sync, 1100);
      }
    });
    root.querySelectorAll?.('.psy-surv-pause-power').forEach(card => {
      const kind = card.querySelector('.psy-surv-pause-power-copy small')?.textContent?.trim().toLowerCase() || '';
      const title = card.querySelector('.psy-surv-pause-power-copy b')?.textContent?.trim() || '';
      card.dataset.psySurvIcon = nameIcons.find(([re]) => re.test(title))?.[1] || categoryIcons[kind] || '✦';
      const img = card.querySelector('img');
      if (!img || img.dataset.psySurvObserved) return;
      img.dataset.psySurvObserved = '1';
      const sync = () => {
        card.classList.toggle('psy-no-art', !img.naturalWidth);
        card.classList.toggle('psy-has-art', !!img.naturalWidth);
      };
      img.addEventListener('load', sync);
      img.addEventListener('error', () => setTimeout(sync, 250));
      setTimeout(sync, 1100);
    });
  }
  function decorateResult() {
    const result = D.querySelector('#screen-survivor-v12 .psy-clean-result');
    if (!result) return;
    const heading = result.querySelector('h2')?.textContent || '';
    result.dataset.outcome = /FASE CONCLUÍDA/i.test(heading) ? 'win' : /DERROTADO/i.test(heading) ? 'defeat' : 'ended';
    const stats = result.querySelector('.psy-result-stats') || result.querySelector('.psy20-card > p:first-of-type');
    if (stats && !stats.classList.contains('psy-result-stats')) {
      const parts = stats.textContent.split('•').map(x => x.trim()).filter(Boolean);
      if (parts.length > 1) {
        stats.classList.add('psy-result-stats');
        stats.replaceChildren(...parts.map(label => {
          const item = D.createElement('span');
          item.textContent = label;
          return item;
        }));
      }
    }
  }
  let screenObserver = null;
  let observedScreen = null;
  function syncLobbyUnderlay(screen = D.getElementById('screen-survivor-v12')) {
    const lobby = D.getElementById('screen-psyduck-v12');
    if (!lobby) return;
    const visible = !!screen && !screen.hidden &&
      W.getComputedStyle(screen).display !== 'none' &&
      W.getComputedStyle(screen).visibility !== 'hidden';
    lobby.classList.toggle('psy-surv-cover-underlay', visible);
  }
  function syncSurvivorOrientation(screen = D.getElementById('screen-survivor-v12')) {
    const surface = screen?.querySelector('.psy-clean-surv');
    if (!surface) return;
    if (W.innerHeight > W.innerWidth) {
      surface.style.setProperty('--psy-surv-landscape-width', `${Math.max(W.innerWidth, W.innerHeight)}px`);
      surface.style.setProperty('--psy-surv-landscape-height', `${Math.min(W.innerWidth, W.innerHeight)}px`);
    } else {
      surface.style.removeProperty('--psy-surv-landscape-width');
      surface.style.removeProperty('--psy-surv-landscape-height');
    }
  }
  W.addEventListener('resize', () => syncSurvivorOrientation());
  W.addEventListener('orientationchange', () => syncSurvivorOrientation());
  let observedLobby = null;
  function observeSurvivorLobby() {
    const lobby = D.getElementById('screen-psyduck-v12');
    if (!lobby || lobby === observedLobby) return;
    observedLobby = lobby;
    const tabs = lobby.querySelector('.psy20-tabs');
    const buttons = tabs?.querySelectorAll('button') || [];
    if (buttons.length && !tabs.querySelector('.psy-surv-tab-active')) buttons[0].classList.add('psy-surv-tab-active');
    lobby.addEventListener('click', event => {
      const button = event.target?.closest?.('.psy20-tabs button');
      if (!button || !lobby.contains(button)) return;
      lobby.querySelectorAll('.psy20-tabs button').forEach(item => item.classList.toggle('psy-surv-tab-active', item === button));
    });
  }
  function observeSurvivorScreen() {
    const screen = D.getElementById('screen-survivor-v12');
    if (!screen) {
      screenObserver?.disconnect();
      observedScreen = null;
      syncLobbyUnderlay(null);
      return;
    }
    if (screen === observedScreen) return;
    screenObserver?.disconnect();
    observedScreen = screen;
    let observedUpgradeGrid = null;
    let observedPauseList = null;
    screenObserver = new MutationObserver(records => {
      if (records.some(record => record.type === 'attributes' && record.target === screen)) {
        syncLobbyUnderlay(screen);
      }
      if (records.some(record => record.target === screen)) {
        syncSurvivorOrientation(screen);
        const nextUpgradeGrid = screen.querySelector('#psy-clean-surv-upgrid');
        const nextPauseList = screen.querySelector('#psy-clean-surv-current');
        if (nextUpgradeGrid && nextUpgradeGrid !== observedUpgradeGrid) {
          observedUpgradeGrid = nextUpgradeGrid;
          screenObserver.observe(nextUpgradeGrid, { childList: true, subtree: true });
        }
        if (nextPauseList && nextPauseList !== observedPauseList) {
          observedPauseList = nextPauseList;
          screenObserver.observe(nextPauseList, { childList: true, subtree: true });
        }
      }
      decorateCards(screen);
      decorateResult();
    });
    screenObserver.observe(screen, {
      childList: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden']
    });
    const upgradeGrid = screen.querySelector('#psy-clean-surv-upgrid');
    const pauseList = screen.querySelector('#psy-clean-surv-current');
    if (upgradeGrid) {
      observedUpgradeGrid = upgradeGrid;
      screenObserver.observe(upgradeGrid, { childList: true, subtree: true });
    }
    if (pauseList) {
      observedPauseList = pauseList;
      screenObserver.observe(pauseList, { childList: true, subtree: true });
    }
    syncSurvivorOrientation(screen);
    syncLobbyUnderlay(screen);
    decorateCards(screen);
    decorateResult();
  }
  const bodyObserver = new MutationObserver(() => {
    observeSurvivorLobby();
    observeSurvivorScreen();
    syncLobbyUnderlay();
  });
  bodyObserver.observe(D.body, { childList: true });
  observeSurvivorLobby();
  observeSurvivorScreen();
  W.addEventListener('pagehide', () => {
    bodyObserver.disconnect();
    screenObserver?.disconnect();
  }, { once: true });
  console.info('✅ PSYWORLD Survivor visual layer V1 ready');
})(window, document);
