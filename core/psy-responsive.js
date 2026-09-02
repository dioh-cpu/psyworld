(function (W, D) {
  'use strict';
  const root = D.documentElement;
  const viewport = W.visualViewport;

  function updateViewport() {
    const width = Math.max(1, Math.round(viewport?.width || W.innerWidth || 1));
    const height = Math.max(1, Math.round(viewport?.height || W.innerHeight || 1));
    root.style.setProperty('--psy-vw', width + 'px');
    root.style.setProperty('--psy-vh', height + 'px');
    root.dataset.psyOrientation = width >= height ? 'landscape' : 'portrait';
    root.classList.add('psy-responsive-ready');
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
    if (!D.body || D.getElementById('psy-fullscreen-btn')) return;
    const button = D.createElement('button');
    button.id = 'psy-fullscreen-btn'; button.type = 'button'; button.textContent = '⛶'; button.addEventListener('click', toggleFullscreen); D.body.appendChild(button); setButtonLabel(button);
    D.addEventListener('fullscreenchange', () => setButtonLabel(button));
    W.addEventListener('resize', updateViewport, { passive: true });
    W.addEventListener('orientationchange', () => setTimeout(updateViewport, 100), { passive: true });
    viewport?.addEventListener('resize', updateViewport, { passive: true });
    updateViewport();
    W.PSY = W.PSY || {};
    W.PSY.responsive = { update: updateViewport, toggleFullscreen: () => toggleFullscreen({ currentTarget: button }) };
  }

  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', install, { once: true }); else install();
})(window, document);
