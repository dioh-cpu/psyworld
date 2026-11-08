/* PSYWORLD Survivor Combat Revolution V3 — camera/arena bridge (Lot A). */
(function (W, D) {
  'use strict';
  if (W.__PSYWORLD_SURVIVOR_COMBAT_REVOLUTION_V3__) return;
  W.__PSYWORLD_SURVIVOR_COMBAT_REVOLUTION_V3__ = true;

  const BUILD = 'SURVIVOR_COMBAT_REVOLUTION_V3_LOT_A_20261108';
  const scriptUrl = D.currentScript?.src || W.location.href;
  const moduleUrl = new URL('./survivor-3d-renderer-v3.js', scriptUrl);
  moduleUrl.searchParams.set('build', BUILD);
  const cssUrl = new URL('../css/survivor-combat-revolution-v3.css', scriptUrl);
  cssUrl.searchParams.set('build', BUILD);
  if (!D.querySelector(`link[href^="${cssUrl.pathname}"]`)) {
    const link = D.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl.href;
    D.head.appendChild(link);
  }

  W.PSY_SURV_3D_READY = import(moduleUrl.href).then(module => {
    const scene = module.createSurvivorScene();
    W.PSY_SURV_3D = scene;
    return scene;
  }).catch(error => {
    W.PSY_SURV_3D_IMPORT_ERROR = error;
    console.warn('[Survivor 3D] module unavailable; keeping the stable renderer.', error);
    return null;
  });

  const cues = {
    hit:          { shake: 2.0, zoom: .10, duration: 135, cooldown: 95 },
    hurt:         { shake: 5.5, zoom: .18, duration: 190, cooldown: 120 },
    special:      { shake: 4.2, zoom: .38, duration: 220, cooldown: 150 },
    transform:    { shake: 7.0, zoom: .62, duration: 390, cooldown: 280 },
    boss:         { shake: 9.0, zoom: .52, duration: 500, cooldown: 420 },
    bossHit:      { shake: 4.4, zoom: .24, duration: 175, cooldown: 115 },
    explosion:    { shake: 6.0, zoom: .28, duration: 240, cooldown: 155 },
    bossDefeat:   { shake: 13,  zoom: .78, duration: 700, cooldown: 650 },
    finalBoss:    { shake: 16,  zoom: .88, duration: 820, cooldown: 750 }
  };
  W.psySurvCameraEvent = function (state, kind = 'hit') {
    if (!state || state.done) return;
    const cue = cues[kind] || cues.hit;
    const now = performance.now();
    state._cameraCueCooldowns ||= Object.create(null);
    if (now < Number(state._cameraCueCooldowns[kind] || 0)) return;
    state._cameraCueCooldowns[kind] = now + cue.cooldown;
    const current = state.cameraCue;
    const remaining = current ? Number(current.duration || 0) - (now - Number(current.at || 0)) : 0;
    if (remaining > 0 && Number(current.shake || 0) > cue.shake && kind !== 'bossDefeat' && kind !== 'finalBoss') return;
    state.cameraCue = { at: now, duration: cue.duration, shake: cue.shake, zoom: cue.zoom, kind };
  };

  let wrappingStart = false;
  function wrapRunStart(name) {
    const original = W[name];
    if (typeof original !== 'function' || original.__psySurvivor3DWrapped) return;
    const wrapped = function () {
      const self = this, args = arguments;
      let used = false;
      const start = api => {
        if (used) return;
        used = true;
        const result = original.apply(self, args);
        const state = W.PSY_CLEAN_SURV;
        if (state && state.c && api) {
          const attached = api.start(state);
          if (!attached && !state._surv3dFallbackNotified) {
            state._surv3dFallbackNotified = true;
            W.toast?.('Seu navegador não disponibilizou WebGL; a arena 2D está ativa.', 3600);
          }
        }
        return result;
      };
      const ready = W.PSY_SURV_3D_READY;
      if (W.PSY_SURV_3D) return start(W.PSY_SURV_3D);
      if (!ready) return original.apply(self, args);
      if (wrappingStart) return;
      wrappingStart = true;
      ready.then(api => {
        wrappingStart = false;
        if (api) start(api);
        else if (!used) { used = true; original.apply(self, args); }
      }).catch(() => {
        wrappingStart = false;
        if (!used) { used = true; original.apply(self, args); }
      });
      W.toast?.('Preparando a arena 3D…', 1200);
    };
    wrapped.__psySurvivor3DWrapped = true;
    W[name] = wrapped;
  }
  wrapRunStart('v12StartSurvivor');
  wrapRunStart('psySurvResumeSaved');

  const returnFromRun = W.psyReturnFromSurvivor;
  if (typeof returnFromRun === 'function' && !returnFromRun.__psySurvivor3DWrapped) {
    const wrapped = function () {
      const result = returnFromRun.apply(this, arguments);
      W.PSY_SURV_3D?.stop?.();
      return result;
    };
    wrapped.__psySurvivor3DWrapped = true;
    W.psyReturnFromSurvivor = wrapped;
  }
  console.info('✅ PSYWORLD Survivor Combat Revolution V3 — Lot A bridge ready');
})(window, document);
