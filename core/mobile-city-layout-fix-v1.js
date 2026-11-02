/* PSYWORLD — restore the mobile city dock and keep canvas CSS/backing ratios aligned. */
(function (W, D) {
  'use strict';
  if (W.__PSY_MOBILE_CITY_LAYOUT_FIX_V1__) return;
  W.__PSY_MOBILE_CITY_LAYOUT_FIX_V1__ = true;

  const style = D.createElement('style');
  style.id = 'psy-mobile-city-layout-fix-v1';
  style.textContent = `
    #world-btn-float{
      display:flex!important;height:auto!important;min-height:0!important;min-width:0!important;position:fixed!important;top:auto!important;right:10px!important;bottom:74px!important;
      z-index:120!important;width:min(228px,48vw)!important;max-height:30dvh!important;
      flex-direction:column!important;align-items:stretch!important;
      gap:7px!important;padding:8px!important;box-sizing:border-box!important;
      overflow:visible!important;border:1px solid #67e8f966;border-radius:14px;
      background:linear-gradient(145deg,rgba(6,12,27,.91),rgba(16,20,38,.86));
      box-shadow:0 8px 28px #0009;backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px)
    }
    #btn-city-content-toggle{width:100%!important;min-height:42px!important;flex:none!important;text-align:center!important}
    #city-game-content-buttons{
      display:flex!important;width:100%!important;min-width:0!important;height:auto!important;min-height:0!important;grid-template-columns:none!important;flex-direction:column!important;align-items:stretch!important;
      gap:6px!important;max-height:calc(30dvh - 66px)!important;overflow-y:auto!important;
      overscroll-behavior:contain;scrollbar-width:thin;padding-right:2px
    }
    #world-btn-float.city-content-collapsed #city-game-content-buttons{display:none!important}
    #city-game-content-buttons>button{
      display:block!important;width:100%!important;min-height:38px!important;height:auto!important;
      flex:none!important;min-width:0!important;max-width:none!important;overflow-wrap:anywhere!important;box-sizing:border-box!important;padding:7px 9px!important;
      border-width:1px!important;border-radius:9px!important;text-align:left!important;
      line-height:1.2!important;font-size:11px!important;white-space:normal!important
    }
    #game-wrap{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;overflow:hidden!important}
    #gameCanvas{position:absolute!important;inset:0!important;display:block!important;width:100%!important;height:100%!important}
    @media(min-width:901px){
      #world-btn-float{top:170px!important;bottom:auto!important;width:228px!important;max-height:calc(100dvh - 200px)!important}
      #city-game-content-buttons{max-height:calc(100dvh - 270px)!important}
    }
  `;
  D.head.appendChild(style);

  W.toggleCityGameContent = function (force) {
    const dock = D.getElementById('world-btn-float');
    const button = D.getElementById('btn-city-content-toggle');
    if (!dock) return;
    const collapsed = typeof force === 'boolean' ? force : !dock.classList.contains('city-content-collapsed');
    dock.classList.toggle('city-content-collapsed', collapsed);
    if (button) {
      button.setAttribute('aria-expanded', String(!collapsed));
      button.textContent = `📦 CONTEÚDO DO JOGO ${collapsed ? '▶' : '▼'}`;
      try { localStorage.setItem('psyworld_city_content_collapsed_v3', collapsed ? '1' : '0'); } catch (_) {}
    }
  };
  if (W.matchMedia('(max-width: 900px), (pointer: coarse)').matches) W.toggleCityGameContent(true);

  // The previous phone resize used window height although the game canvas is
  // shorter than the browser viewport. Measure the actual canvas box so the
  // world camera, CSS display and drawing buffer keep the same aspect ratio.
  function resizeCanvasToBox() {
    const canvas = D.getElementById('gameCanvas');
    if (!canvas) return;
    const box = canvas.getBoundingClientRect();
    const cssW = box.width || W.innerWidth;
    const cssH = box.height || W.innerHeight;
    if (!(cssW > 0 && cssH > 0)) return;
    const mobile = W.PSY_IS_MOBILE || W.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
    const maxW = mobile ? 960 : cssW;
    const maxH = mobile ? 960 : cssH;
    const scale = Math.min(1, maxW / cssW, maxH / cssH);
    const width = Math.max(1, Math.round(cssW * scale));
    const height = Math.max(1, Math.round(cssH * scale));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const context = canvas.getContext('2d');
    if (context) context.imageSmoothingEnabled = false;
  }
  W.psyResizeCanvasEfficient = resizeCanvasToBox;
  W.addEventListener('resize', resizeCanvasToBox, { passive: true });
  W.addEventListener('orientationchange', () => W.setTimeout(resizeCanvasToBox, 180), { passive: true });
  W.setTimeout(resizeCanvasToBox, 180);
  W.setInterval(() => {
    const game = D.getElementById('game-wrap');
    if (!D.hidden && game && W.getComputedStyle(game).display !== 'none') resizeCanvasToBox();
  }, 3500);
})(window, document);
