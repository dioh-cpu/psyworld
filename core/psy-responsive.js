(function (W, D) {
  'use strict';
  const root = D.documentElement;
  const viewport = W.visualViewport;
  // Load the one-time local PSY IDLE reset before the player can enter that mode.
  if (!D.getElementById('psy-idle-fresh-start-script')) {
    const resetScript = D.createElement('script');
    resetScript.id = 'psy-idle-fresh-start-script';
    resetScript.src = 'core/psy-idle-fresh-start-v1.js?v=1';
    resetScript.async = false;
    (D.head || root).appendChild(resetScript);
  }
  // Start audio loading during page initialization; city-content.js keeps the same
  // element id as a fallback and will not append a second copy.
  if (!D.getElementById('psy-audio-system-script')) {
    const audioScript = D.createElement('script');
    audioScript.id = 'psy-audio-system-script';
    audioScript.src = 'core/audio.js?v=psy-pallet-birdsong-v1';
    audioScript.async = false;
    (D.head || root).appendChild(audioScript);
  }
  const STORAGE_KEY = 'psyworld-layout-mode-v1';
  let mode = 'auto';
  try {
    const saved = W.localStorage.getItem(STORAGE_KEY);
    if (['auto', 'mobile', 'desktop'].includes(saved)) mode = saved;
  } catch (_) {}

  function detectDevice(width) {
    const nav = W.navigator || {};
    const ua = String(nav.userAgent || '');
    const uaMobile = !!nav.userAgentData?.mobile || /Android.*Mobile|iPhone|iPod|Windows Phone|Mobile/i.test(ua);
    const tablet = /iPad/i.test(ua) || (/Macintosh/i.test(ua) && Number(nav.maxTouchPoints || 0) > 1);
    const touchNarrow = (Number(nav.maxTouchPoints || 0) > 1 || W.matchMedia?.('(pointer: coarse)')?.matches) && width <= 1024;
    return uaMobile || tablet || touchNarrow ? 'mobile' : 'desktop';
  }

  function applyMode(width) {
    const detected = detectDevice(width || W.innerWidth || 1);
    const layout = mode === 'auto' ? detected : mode;
    root.dataset.psyDevice = detected;
    root.dataset.psyLayoutMode = mode;
    root.dataset.psyLayout = layout;
    const select = D.getElementById('psy-layout-mode');
    if (select && select.value !== mode) select.value = mode;
    const status = D.getElementById('psy-layout-status');
    if (status) status.textContent = mode === 'auto'
      ? `Detectado: ${detected === 'mobile' ? 'celular/tablet' : 'computador'} · layout aplicado automaticamente.`
      : `Modo ${mode === 'mobile' ? 'celular' : 'computador'} ativado manualmente.`;
    return layout;
  }

  function updateViewport() {
    const width = Math.max(1, Math.round(viewport?.width || W.innerWidth || 1));
    const height = Math.max(1, Math.round(viewport?.height || W.innerHeight || 1));
    root.style.setProperty('--psy-vw', width + 'px');
    root.style.setProperty('--psy-vh', height + 'px');
    root.dataset.psyOrientation = width >= height ? 'landscape' : 'portrait';
    root.classList.add('psy-responsive-ready');
    applyMode(width);
  }

  function setMode(value) {
    mode = ['auto', 'mobile', 'desktop'].includes(value) ? value : 'auto';
    try { W.localStorage.setItem(STORAGE_KEY, mode); } catch (_) {}
    applyMode(Math.max(1, Math.round(viewport?.width || W.innerWidth || 1)));
  }

  function openLayoutSettings() {
    const panel = D.getElementById('psy-layout-settings');
    if (!panel) return;
    applyMode(Math.max(1, Math.round(viewport?.width || W.innerWidth || 1)));
    if(W.PsySeason){let v=panel.querySelector('[data-season-visibility-container]');if(!v){v=D.createElement('div');v.dataset.seasonVisibilityContainer='1';panel.querySelector('.psy-layout-done').before(v);}v.innerHTML=W.PsySeason.visibilityHTML();W.PsySeason.bindSettings(v);}
    panel.dataset.open = '1';
    panel.setAttribute('aria-hidden', 'false');
    D.getElementById('psy-layout-mode')?.focus();
  }

  function closeLayoutSettings() {
    const panel = D.getElementById('psy-layout-settings');
    if (!panel) return;
    panel.dataset.open = '0';
    panel.setAttribute('aria-hidden', 'true');
  }

  function ensureSettingsUI() {
    if (!D.getElementById('psy-layout-settings')) {
      const panel = D.createElement('section');
      panel.id = 'psy-layout-settings';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      panel.setAttribute('aria-hidden', 'true');
      panel.innerHTML = `
        <div class="psy-layout-card">
          <header><div><small>PSYWORLD</small><h2>⚙ TELA E DISPOSITIVO</h2></div><button type="button" data-layout-close aria-label="Fechar configurações">×</button></header>
          <p>O modo automático identifica celular/tablet ou computador. Se a tela não ficar confortável, escolha o layout manualmente.</p>
          <label for="psy-layout-mode">Layout do jogo</label>
          <select id="psy-layout-mode">
            <option value="auto">Automático · detectar dispositivo</option>
            <option value="mobile">Celular · tela em pé ou deitada</option>
            <option value="desktop">Computador</option>
          </select>
          <div id="psy-layout-status" aria-live="polite"></div>
          <button type="button" class="psy-layout-done" data-layout-close>PRONTO</button>
        </div>`;
      D.body.appendChild(panel);
      panel.addEventListener('click', e => { if (e.target === panel || e.target.closest('[data-layout-close]')) closeLayoutSettings(); });
      panel.querySelector('#psy-layout-mode').addEventListener('change', e => setMode(e.target.value));
    }
    const menu = D.getElementById('menu');
    if (menu && !menu.querySelector('[data-psy-layout-open]')) {
      const button = D.createElement('button');
      button.type = 'button';
      button.dataset.psyLayoutOpen = '1';
      button.className = 'psy-layout-menu-button';
      button.textContent = '⚙ TELA / DISPOSITIVO';
      button.addEventListener('click', openLayoutSettings);
      const title = menu.querySelector('h2');
      if (title?.parentElement) title.insertAdjacentElement('afterend', button);
      else menu.prepend(button);
    }
    const idleMenu = D.querySelector('#psy-ir-menu-overlay .psy-ir-menu-panel');
    if (idleMenu && !idleMenu.querySelector('[data-psy-layout-open]')) {
      const button = D.createElement('button');
      button.type = 'button';
      button.dataset.psyLayoutOpen = '1';
      button.className = 'psy-layout-idle-button';
      button.textContent = '⚙ TELA / DISPOSITIVO';
      button.addEventListener('click', openLayoutSettings);
      const title = idleMenu.querySelector('.psy-ir-menu-title');
      if (title) title.insertAdjacentElement('afterend', button);
      else idleMenu.prepend(button);
    }
  }

  function setButtonLabel(button) {
    const active = !!D.fullscreenElement || root.classList.contains('psy-fullscreen-fallback');
    button.textContent = active ? '⤢' : '⛶';
    button.title = active ? 'Sair da tela cheia' : 'Tela cheia';
    button.setAttribute('aria-label', button.title);
    button.dataset.fallback = D.fullscreenElement ? '0' : (root.classList.contains('psy-fullscreen-fallback') ? '1' : '0');
  }

  function fallbackFullscreen(button) {
    root.classList.toggle('psy-fullscreen-fallback');
    setButtonLabel(button);
    updateViewport();
  }

  async function toggleFullscreen(event) {
    const button = event.currentTarget;
    try {
      if (D.fullscreenElement) await D.exitFullscreen();
      else if (root.requestFullscreen) await root.requestFullscreen({ navigationUI: 'hide' });
      else fallbackFullscreen(button);
    } catch (_) { fallbackFullscreen(button); }
    setButtonLabel(button);
  }

  function install() {
    if (!D.body) return;
    let button = D.getElementById('psy-fullscreen-btn');
    if (!button) {
      button = D.createElement('button');
      button.id = 'psy-fullscreen-btn'; button.type = 'button'; button.textContent = '⛶';
      button.addEventListener('click', toggleFullscreen);
      D.body.appendChild(button);
    }
    setButtonLabel(button);
    W.PSY_OPEN_LAYOUT_SETTINGS = openLayoutSettings;
    W.PSY_CLOSE_LAYOUT_SETTINGS = closeLayoutSettings;
    D.addEventListener('fullscreenchange', () => setButtonLabel(button));
    W.addEventListener('resize', updateViewport, { passive: true });
    W.addEventListener('orientationchange', () => setTimeout(updateViewport, 100), { passive: true });
    viewport?.addEventListener('resize', updateViewport, { passive: true });
    D.addEventListener('keydown', e => { if (e.key === 'Escape') closeLayoutSettings(); });
    ensureSettingsUI();
    updateViewport();
    const observer = new MutationObserver(() => ensureSettingsUI());
    observer.observe(D.body, { childList: true, subtree: true });
    W.PSY = W.PSY || {};
    W.PSY.responsive = { update: updateViewport, toggleFullscreen: () => toggleFullscreen({ currentTarget: button }), setMode, openLayoutSettings };
  }

  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', install, { once: true }); else install();
})(window, document);

