// Efeitos de batalha compartilhados (provisórios, substituíveis pelos clipes do Flow): avanço no ataque, projétil, piscada no dano,
// número flutuante, efeitos de habilidade/cura/escudo e atualização visual. A lógica de turno só informa o evento.
const CSS = `
.fx-num { position: absolute; left: 50%; top: 10px; margin-left: -14px; font: 800 16px system-ui; text-shadow: 0 1px 3px #000; pointer-events: none; font-style: normal; z-index: 9; }
.fx-fx { position: absolute; left: 50%; top: 4px; width: 56px; height: 56px; margin-left: -28px; border-radius: 50%; pointer-events: none; z-index: 8; animation: fx-pop .5s ease-out forwards; }
.fx-fx.golpe { background: radial-gradient(#fff, #fb7185 45%, transparent 70%); } .fx-fx.hab { background: radial-gradient(#fff, #a78bfa 40%, #f3a458 60%, transparent 72%); width: 76px; height: 76px; margin-left: -38px; }
.fx-fx.cura { background: radial-gradient(#fff, #4ade80 45%, transparent 70%); } .fx-fx.escudo { background: radial-gradient(transparent 50%, #60a5fa 62%, transparent 72%); }
.fx-proj { position: absolute; width: 16px; height: 16px; border-radius: 50%; background: radial-gradient(#fff, #a78bfa); box-shadow: 0 0 12px #a78bfa; pointer-events: none; z-index: 7; }
/* Batalha da Campanha em tela inteira */
#modal-batalha { padding: 0 !important; align-items: stretch !important; justify-content: stretch !important; }
#modal-batalha .modal-card { width: 100%; max-width: none; height: 100dvh; max-height: none; border-radius: 0; border: 0; display: flex; flex-direction: column; padding: 8px 12px; }
#modal-batalha .bat-arena { flex: 1 1 auto; min-height: 0; margin: 6px 0; padding: 10px; border-radius: 10px; background-size: cover !important; background-position: center !important; align-items: end; position: relative; }
#modal-batalha .bat-box { position: relative; background: rgba(15, 29, 54, .55); }
#modal-batalha .bat-box img { width: min(36vw, 240px); height: min(40vh, 240px); }
#modal-batalha .bat-log { flex: 0 0 auto; max-height: 14vh; overflow: auto; }
#modal-batalha .bat-acoes { flex: 0 0 auto; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
@keyframes fx-pop { from { transform: scale(.3); opacity: 1; } to { transform: scale(1.4); opacity: 0; } }`;
let css = false;
export function injetarCssBatalha() { if (css) return; css = true; const s = document.createElement('style'); s.textContent = CSS; document.head.append(s); }

export function numeroFlutuante(alvo, txt, cor) { injetarCssBatalha(); const n = document.createElement('i'); n.className = 'fx-num'; n.textContent = txt; n.style.color = cor; alvo.style.position ||= 'relative'; alvo.append(n); const an = n.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-38px)', opacity: 0 }], { duration: 850, easing: 'ease-out' }); an.onfinish = () => n.remove(); }
export function efeito(alvo, tipo) { injetarCssBatalha(); const n = document.createElement('i'); n.className = `fx-fx ${tipo}`; alvo.style.position ||= 'relative'; alvo.append(n); setTimeout(() => n.remove(), 520); }
export function piscar(alvo) { alvo.animate?.([{ filter: 'brightness(3)' }, { filter: 'none' }], { duration: 260 }); }
// Avanço de `a` na direção de `t` e volta (corpo a corpo), ou recuo curto com projétil (à distância)
export function avancar(a, t, { distancia = false, arena = null } = {}) {
  const ra = a.getBoundingClientRect(), rt = t.getBoundingClientRect(), dx = rt.left - ra.left, dy = rt.top - ra.top;
  if (!distancia) { a.style.zIndex = 5; const an = a.animate?.([{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${dx * 0.7}px,${dy * 0.7}px) scale(1.12)`, offset: 0.4 }, { transform: 'translate(0,0) scale(1)' }], { duration: 480, easing: 'ease-in-out' }); if (an) an.onfinish = () => { a.style.zIndex = ''; }; return 190; }
  a.animate?.([{ transform: 'translate(0,0)' }, { transform: `translate(${dx * 0.12}px,${dy * 0.12}px)`, offset: 0.3 }, { transform: 'translate(0,0)' }], { duration: 420 });
  if (arena) { injetarCssBatalha(); const ar = arena.getBoundingClientRect(), p = document.createElement('i'); p.className = 'fx-proj'; p.style.left = `${ra.left - ar.left + ra.width / 2}px`; p.style.top = `${ra.top - ar.top + ra.height / 3}px`; arena.append(p); const pa = p.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${dx}px,${dy}px)` }], { duration: 320, delay: 120, easing: 'ease-in', fill: 'both' }); pa.onfinish = () => p.remove(); }
  return 400;
}
// Anima um evento de executar(): { tipo, ator, alvo, valor, distancia }. `raiz` contém elementos com data-un=<id>.
export function animarEvento(raiz, ev, arenaSel = '.est-arena') {
  if (!ev || ev.mostrado) return; ev.mostrado = true;
  const q = (id) => raiz.querySelector(`[data-un="${id}"]`);
  const A = q(ev.ator), T = q(ev.alvo); if (!A || !T || !A.animate) return;
  if (ev.tipo === 'atacar' || ev.tipo === 'habilidade') {
    const atraso = avancar(A, T, { distancia: ev.tipo === 'habilidade' && ev.distancia, arena: raiz.querySelector(arenaSel) });
    setTimeout(() => { piscar(T); numeroFlutuante(T, `−${ev.valor}`, '#fb7185'); efeito(T, ev.tipo === 'habilidade' ? 'hab' : 'golpe'); }, atraso);
  } else if (ev.tipo === 'curar') {
    efeito(T, 'cura'); numeroFlutuante(T, `+${ev.valor}`, '#4ade80');
    raiz.querySelectorAll('.un.a:not(.morto)').forEach((u) => u.animate([{ filter: 'drop-shadow(0 0 0 #4ade80)' }, { filter: 'drop-shadow(0 0 8px #4ade80)' }, { filter: 'none' }], { duration: 600 }));
  } else if (ev.tipo === 'defender') efeito(T, 'escudo');
}

// Golpe 1x1 da Campanha: avanço, piscada, número e efeito; depois o contra-ataque do inimigo
export function golpeCampanha({ jog, ini, danoIni = 0, danoJog = 0, cura = 0, habilidade = false }) {
  if (!jog || !ini) return;
  if (cura) { efeito(jog.parentElement, 'cura'); numeroFlutuante(jog.parentElement, `+${cura}`, '#4ade80'); }
  if (danoIni) { const t = avancar(jog, ini, { distancia: habilidade, arena: jog.closest('.bat-arena') }); setTimeout(() => { piscar(ini); numeroFlutuante(ini.parentElement, `−${danoIni}`, '#fb7185'); efeito(ini.parentElement, habilidade ? 'hab' : 'golpe'); }, t); }
  if (danoJog) setTimeout(() => { avancar(ini, jog); setTimeout(() => { piscar(jog); numeroFlutuante(jog.parentElement, `−${danoJog}`, '#fb7185'); efeito(jog.parentElement, 'golpe'); }, 190); }, danoIni ? 650 : 200);
}
injetarCssBatalha();
