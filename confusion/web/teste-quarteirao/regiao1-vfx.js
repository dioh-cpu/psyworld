// VFX de batalha em quatro momentos: preparação → execução → impacto → dissipação. Disparado pelo id da habilidade e pelo resultado do turno
// (alvos e valores já calculados pelo motor). Cada habilidade tem uma configuração em FX_HABILIDADES, com campo `clip` pronto para os clipes
// do Flow. Água, pedra, planta, fogo e raio têm comportamento próprio por elemento. Em celular, menos partículas e sem desfoque.
import { EFEITOS } from './regiao1-batalha-habilidades.js';

const ESP = (ms) => new Promise((r) => setTimeout(r, ms));
export const ELEM = {
  fogo: { cor: '#fb923c', cor2: '#fde047' }, agua: { cor: '#38bdf8', cor2: '#e0f2fe' }, planta: { cor: '#4ade80', cor2: '#bef264' }, terra: { cor: '#a16207', cor2: '#d6b98c' },
  pedra: { cor: '#94a3b8', cor2: '#e2e8f0' }, inseto: { cor: '#a3e635', cor2: '#fde68a' }, voador: { cor: '#e2e8f0', cor2: '#bae6fd' }, eletrico: { cor: '#facc15', cor2: '#ffffff' },
  aco: { cor: '#cbd5e1', cor2: '#ffffff' }, trevas: { cor: '#7c3aed', cor2: '#c4b5fd' }, luz: { cor: '#fde047', cor2: '#ffffff' }, neutro: { cor: '#e5e7eb', cor2: '#ffffff' },
};
// Configuração por habilidade (id). `clip`: vídeo do Flow (opcional) e `impactoMs` (quando o golpe encosta). `camera`: peso do movimento.
export const FX_HABILIDADES = {
  mordida_umbral: { estilo: 'mordida', camera: { zoom: 1.03, tremor: 3 }, clip: null, impactoMs: 560 },
  chama_violeta: { estilo: 'chama', camera: { zoom: 1.08, tremor: 9 }, clip: null, impactoMs: 780 },
  veu_noturno: { estilo: 'veu', camera: { zoom: 1.02, tremor: 0 }, clip: null, impactoMs: 1200 },
};

// ---------- utilidades ----------
export function criarCtx({ arena, campo, no, aplicarHp, rapido = false, mobile }) {
  const m = mobile ?? (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches);
  return { arena, campo, no, aplicarHp, rapido, k: rapido ? 0.62 : 1, dens: m ? 0.5 : 1, blur: !m };
}
const caixa = (ctx, el) => { const a = ctx.arena.getBoundingClientRect(), r = el.getBoundingClientRect(); const z = ctx.zoom || 1; return { x: (r.left + r.width / 2 - a.left), y: (r.top + r.height / 2 - a.top), pe: r.bottom - a.top - r.height * 0.06, topo: r.top - a.top, w: r.width, h: r.height, boca: (frente) => ({ x: r.left + r.width / 2 - a.left + frente * r.width * 0.32, y: r.top + r.height * 0.36 - a.top }) }; };
function novo(ctx, css, html = '') { const e = document.createElement('i'); e.style.cssText = `position:absolute;pointer-events:none;font-style:normal;${css}`; if (html) e.innerHTML = html; ctx.campo.append(e); return e; }
const anim = (e, kf, o) => { const a = e.animate(kf, { fill: 'forwards', ...o }); return a.finished.catch(() => {}).then(() => a); };
const limpa = (e, ms) => setTimeout(() => e.remove(), ms);
const R = (a, b) => a + Math.random() * (b - a);
function particulas(ctx, x, y, { n = 10, cor = '#fff', tam = 6, dist = 60, vida = 600, grav = 0, forma = '50%', alto = 0, blur = false } = {}) {
  const N = Math.max(1, Math.round(n * ctx.dens));
  for (let i = 0; i < N; i++) {
    const a = R(0, Math.PI * 2), d = R(dist * 0.4, dist), t = tam * R(0.6, 1.3);
    const e = novo(ctx, `left:${x}px;top:${y}px;width:${t}px;height:${t}px;border-radius:${forma};background:${cor};box-shadow:0 0 ${t}px ${cor};${blur && ctx.blur ? 'filter:blur(2px);' : ''}z-index:9`);
    const dx = Math.cos(a) * d, dy = Math.sin(a) * d * 0.7 - alto;
    e.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + grav}px)) scale(.2)`, opacity: 0 }], { duration: vida * ctx.k * R(0.8, 1.2), easing: 'ease-out', fill: 'forwards' }); limpa(e, vida * 1.4);
  }
}
function anel(ctx, x, y, cor, raio = 120, ms = 520, esp = 4) { const e = novo(ctx, `left:${x}px;top:${y}px;width:${raio}px;height:${raio * 0.55}px;border:${esp}px solid ${cor};border-radius:50%;box-shadow:0 0 14px ${cor};z-index:7`); e.animate([{ transform: 'translate(-50%,-50%) scale(.15)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(1.25)', opacity: 0 }], { duration: ms * ctx.k, easing: 'ease-out', fill: 'forwards' }); limpa(e, ms * 1.3); }
function luzChao(ctx, x, y, cor, raio = 150, ms = 900, forca = 0.7) { const e = novo(ctx, `left:${x}px;top:${y}px;width:${raio * 2}px;height:${raio * 0.7}px;border-radius:50%;background:radial-gradient(closest-side, ${cor}, transparent);z-index:2;mix-blend-mode:screen`); e.animate([{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: forca, offset: 0.25 }, { transform: 'translate(-50%,-50%) scale(1.1)', opacity: 0 }], { duration: ms * ctx.k, fill: 'forwards' }); limpa(e, ms * 1.3); return e; }
function flash(ctx, cor, ms = 180, op = 0.35) { const e = document.createElement('i'); e.style.cssText = `position:absolute;inset:0;background:${cor};opacity:0;pointer-events:none;z-index:30`; ctx.arena.append(e); e.animate([{ opacity: op }, { opacity: 0 }], { duration: ms * ctx.k }); limpa(e, ms * 2); }
function camera(ctx, foco, { zoom = 1.05, tremor = 0, ms = 420 } = {}) {
  if (ctx.rapido && tremor < 8) tremor = 0;
  const a = ctx.arena.getBoundingClientRect(); ctx.campo.style.transformOrigin = `${foco.x}px ${foco.y}px`;
  const kf = [{ transform: 'scale(1) translate(0,0)' }, { transform: `scale(${zoom}) translate(0,0)`, offset: 0.18 }];
  if (tremor) for (let i = 0; i < 6; i++) kf.push({ transform: `scale(${zoom}) translate(${R(-tremor, tremor)}px, ${R(-tremor, tremor) * 0.6}px)`, offset: 0.18 + (i + 1) * 0.08 });
  kf.push({ transform: 'scale(1) translate(0,0)' });
  ctx.campo.animate(kf, { duration: ms * ctx.k, easing: 'ease-out' }); void a;
}
function reacao(ctx, alvoEl, dir, forca = 1) { const f = alvoEl.querySelector('.un-fig') || alvoEl; f.animate([{ transform: 'translate(0,0)', filter: 'brightness(3) saturate(.3)' }, { transform: `translate(${dir * 14 * forca}px,-4px) rotate(${dir * 4 * forca}deg)`, filter: 'brightness(1.8)', offset: 0.3 }, { transform: 'translate(0,0)', filter: 'none' }], { duration: 380 * ctx.k, easing: 'ease-out' }); }
function numero(ctx, alvoEl, txt, cor, grande = false) { const b = caixa(ctx, alvoEl); const e = novo(ctx, `left:${b.x}px;top:${b.topo + 8}px;font:900 ${grande ? 26 : 19}px system-ui;color:${cor};text-shadow:0 0 6px #000,0 2px 3px #000;z-index:40;white-space:nowrap`, txt); e.animate([{ transform: 'translate(-50%,0) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-14px) scale(1.15)', opacity: 1, offset: 0.2 }, { transform: 'translate(-50%,-48px) scale(1)', opacity: 0 }], { duration: 1000 * ctx.k, easing: 'ease-out', fill: 'forwards' }); limpa(e, 1300); }
function fantasma(ctx, unEl, cor) { const img = unEl.querySelector('img'); if (!img) return; const b = caixa(ctx, img); const g = novo(ctx, `left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;z-index:5;opacity:.55;transform:translate(-50%,-50%) ${getComputedStyle(img).transform === 'none' ? '' : getComputedStyle(img).transform};filter:brightness(.25) sepia(1) hue-rotate(230deg) saturate(3) drop-shadow(0 0 8px ${cor})`); const c = img.cloneNode(); c.style.cssText = 'width:100%;height:100%;object-fit:contain'; g.append(c); g.animate([{ opacity: 0.55 }, { opacity: 0 }], { duration: 420 * ctx.k, fill: 'forwards' }); limpa(g, 600); }
function lancar(ctx, unEl, alvoEl, dx, dy, ms, ease = 'ease-in') { return anim(unEl, [{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${dx}px,${dy}px) scale(1.1)` }], { duration: ms * ctx.k, easing: ease }); }

// ---------- impactos por elemento ----------
function impactoElemento(ctx, x, y, elem, forte = false) {
  const E = ELEM[elem] || ELEM.neutro, s = forte ? 1.4 : 1;
  if (elem === 'agua') { anel(ctx, x, y + 8, E.cor, 110 * s, 600, 3); anel(ctx, x, y + 8, E.cor2, 70 * s, 480, 2); particulas(ctx, x, y, { n: 12, cor: E.cor, tam: 7, dist: 70 * s, grav: 60, alto: 40, vida: 700 }); }
  else if (elem === 'pedra' || elem === 'terra') { for (let i = 0; i < Math.round(9 * ctx.dens + 2); i++) { const e = novo(ctx, `left:${x}px;top:${y}px;width:${R(8, 16)}px;height:${R(8, 16)}px;background:${E.cor};clip-path:polygon(${R(0, 40)}% 0,100% ${R(10, 50)}%,${R(50, 100)}% 100%,0 ${R(50, 100)}%);z-index:9`); const a = R(-Math.PI, 0), d = R(30, 80) * s; e.animate([{ transform: 'translate(-50%,-50%) rotate(0)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d + 50}px)) rotate(${R(-260, 260)}deg)`, opacity: 0 }], { duration: 700 * ctx.k, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' }); limpa(e, 900); } particulas(ctx, x, y + 10, { n: 6, cor: E.cor2 + '88', tam: 16, dist: 40, vida: 700, blur: true }); }
  else if (elem === 'planta') { for (let i = 0; i < 5; i++) { const h = R(40, 80) * s, ang = -90 + R(-55, 55); const e = novo(ctx, `left:${x}px;top:${y + 20}px;width:5px;height:${h}px;background:linear-gradient(${E.cor},#166534);border-radius:3px;transform-origin:50% 100%;transform:translate(-50%,-100%) rotate(${ang + 90}deg);z-index:8`); e.animate([{ transform: `translate(-50%,-100%) rotate(${ang + 90}deg) scaleY(0)` }, { transform: `translate(-50%,-100%) rotate(${ang + 90}deg) scaleY(1)`, offset: 0.45 }, { transform: `translate(-50%,-100%) rotate(${ang + 90}deg) scaleY(0)` }], { duration: 800 * ctx.k, easing: 'ease-in-out', fill: 'forwards' }); limpa(e, 1000); } particulas(ctx, x, y, { n: 8, cor: E.cor2, tam: 8, dist: 60, vida: 700, forma: '50% 0 50% 0' }); }
  else if (elem === 'eletrico') { for (let i = 0; i < 3; i++) { const pts = Array.from({ length: 6 }, (_, k) => `${k * 20 + R(-6, 6)},${R(0, 40)}`).join(' '); const e = novo(ctx, `left:${x - 50}px;top:${y - 30}px;width:120px;height:50px;z-index:9;transform:rotate(${R(-50, 50)}deg)`, `<svg viewBox="0 0 120 40" width="120" height="50"><polyline points="${pts}" fill="none" stroke="${E.cor}" stroke-width="3" stroke-linejoin="bevel" style="filter:drop-shadow(0 0 4px ${E.cor})"/></svg>`); e.animate([{ opacity: 1 }, { opacity: 0.2, offset: 0.4 }, { opacity: 1, offset: 0.55 }, { opacity: 0 }], { duration: 420 * ctx.k, fill: 'forwards' }); limpa(e, 600); } flash(ctx, '#fef9c3', 120, 0.25); }
  else if (elem === 'aco') { for (let i = 0; i < 4; i++) { const e = novo(ctx, `left:${x}px;top:${y}px;width:${R(60, 110)}px;height:3px;background:linear-gradient(90deg,transparent,#fff,transparent);transform:translate(-50%,-50%) rotate(${R(-70, 70)}deg);z-index:9`); e.animate([{ opacity: 1, transform: `translate(-50%,-50%) rotate(${R(-70, 70)}deg) scaleX(.2)` }, { opacity: 0, transform: `translate(-50%,-50%) rotate(${R(-70, 70)}deg) scaleX(1.2)` }], { duration: 320 * ctx.k, fill: 'forwards' }); limpa(e, 500); } particulas(ctx, x, y, { n: 8, cor: '#fff', tam: 3, dist: 70, vida: 400 }); }
  else if (elem === 'voador') { anel(ctx, x, y, E.cor2, 130 * s, 500, 2); for (let i = 0; i < 4; i++) { const e = novo(ctx, `left:${x}px;top:${y + R(-20, 20)}px;width:${R(60, 100)}px;height:10px;border-radius:50%;border-top:3px solid ${E.cor2};z-index:8`); e.animate([{ transform: 'translate(-50%,-50%) scaleX(.2)', opacity: 1 }, { transform: `translate(calc(-50% + ${R(-60, 60)}px), -50%) scaleX(1.3)`, opacity: 0 }], { duration: 480 * ctx.k, fill: 'forwards' }); limpa(e, 600); } }
  else if (elem === 'inseto') { particulas(ctx, x, y, { n: 14, cor: E.cor, tam: 5, dist: 80, vida: 700, forma: '50% 40% 50% 40%' }); }
  else if (elem === 'luz') { anel(ctx, x, y, E.cor, 120 * s, 520, 3); particulas(ctx, x, y, { n: 12, cor: E.cor2, tam: 5, dist: 70, vida: 600, alto: 20 }); flash(ctx, '#fff7cc', 140, 0.3); }
  else if (elem === 'trevas') { particulas(ctx, x, y, { n: 12, cor: '#1e0b36', tam: 9, dist: 60, grav: 40, vida: 800 }); particulas(ctx, x, y, { n: 8, cor: E.cor, tam: 5, dist: 70, vida: 700 }); anel(ctx, x, y, E.cor, 100 * s, 500, 3); }
  else { particulas(ctx, x, y, { n: 10 + (forte ? 6 : 0), cor: E.cor, tam: 7, dist: 70 * s, vida: 600, grav: 30 }); anel(ctx, x, y, E.cor, 90 * s, 420, 3); if (elem === 'fogo') particulas(ctx, x, y, { n: 8, cor: E.cor2, tam: 5, dist: 80, vida: 800, alto: 40 }); }
}
function marcarEfeitos(ctx, alvoEl, ids) {
  ids.forEach((id, i) => { const d = EFEITOS[id]; if (!d) return; const b = caixa(ctx, alvoEl); setTimeout(() => { const e = novo(ctx, `left:${b.x + (i - (ids.length - 1) / 2) * 26}px;top:${b.topo + 4}px;font-size:22px;z-index:41;filter:drop-shadow(0 0 5px ${d.cor})`, d.icone.split('').slice(0, 2).join('')); e.animate([{ transform: 'translate(-50%,0) scale(.3)', opacity: 0 }, { transform: 'translate(-50%,-18px) scale(1.2)', opacity: 1, offset: 0.3 }, { transform: 'translate(-50%,-40px) scale(1)', opacity: 0 }], { duration: 950 * ctx.k, fill: 'forwards' }); limpa(e, 1200); particulas(ctx, b.x, b.y, { n: 5, cor: d.cor, tam: 5, dist: 40, vida: 600 }); }, 120 * i); });
}

// ---------- estilos próprios do Noctarn ----------
async function mordida(ctx, A, T, ev, cfg) {
  const a = caixa(ctx, A), t = caixa(ctx, T), dir = t.x > a.x ? 1 : -1, dx = (t.x - a.x) * 0.86, dy = (t.pe - a.pe) * 0.86;
  const fig = A.querySelector('.un-fig');
  // preparação: abaixa o corpo, névoa de sombra no chão
  luzChao(ctx, a.x, a.pe, '#7c3aed', 90, 700, 0.55); particulas(ctx, a.x, a.pe, { n: 8, cor: '#2e1065', tam: 14, dist: 40, vida: 500, blur: true });
  await anim(fig, [{ transform: 'translateY(0) scaleY(1)' }, { transform: `translate(${-dir * 8}px,8px) scaleY(.86)` }], { duration: 260 * ctx.k, easing: 'ease-out' });
  // execução: arranca com rastro de sombra e imagens residuais
  const tr = setInterval(() => fantasma(ctx, A, '#7c3aed'), 70 * ctx.k);
  const rastro = novo(ctx, `left:${a.x}px;top:${a.y}px;height:22px;width:0;background:linear-gradient(90deg,transparent,#1e0b36,#7c3aed88);border-radius:12px;transform-origin:0 50%;transform:rotate(${Math.atan2(dy, dx)}rad);z-index:3`);
  rastro.animate([{ width: '0px', opacity: 1 }, { width: `${Math.hypot(dx, dy)}px`, opacity: 0.9, offset: 0.7 }, { width: `${Math.hypot(dx, dy)}px`, opacity: 0 }], { duration: 620 * ctx.k, fill: 'forwards' }); limpa(rastro, 900);
  fig.animate([{ transform: `translate(${-dir * 8}px,8px) scaleY(.86)` }, { transform: 'translate(0,0) scaleY(1)' }], { duration: 120 * ctx.k, fill: 'forwards' });
  await lancar(ctx, A, T, dx, dy, 300, 'cubic-bezier(.6,0,.9,.4)'); clearInterval(tr);
  // impacto: pausa curtíssima, presas espectrais, reação e fragmentos
  if (!ctx.rapido) await ESP(70);
  camera(ctx, { x: t.x, y: t.y }, cfg.camera);
  for (const sinal of [-1, 1]) { const f = novo(ctx, `left:${t.x}px;top:${t.y + sinal * 8}px;width:34px;height:${t.h * 0.34}px;background:linear-gradient(${sinal < 0 ? 180 : 0}deg,#fff,#c4b5fd 55%,#7c3aed);clip-path:polygon(0 ${sinal < 0 ? 0 : 100}%,100% ${sinal < 0 ? 0 : 100}%,50% ${sinal < 0 ? 100 : 0}%);z-index:12;filter:drop-shadow(0 0 8px #7c3aed)`); f.animate([{ transform: `translate(-50%,${sinal * -60}px) scale(.6)`, opacity: 0 }, { transform: `translate(-50%,${sinal * -26}px) scale(1)`, opacity: 1, offset: 0.55 }, { transform: `translate(-50%,${sinal * -22}px) scale(1.05)`, opacity: 0 }], { duration: 330 * ctx.k, fill: 'forwards', easing: 'ease-in' }); limpa(f, 500); }
  await ESP(120 * ctx.k);
  for (const r of ev.alvos) { const el = ctx.no(r.id); if (!el) continue; reacao(ctx, el, dir, 1.1); numero(ctx, el, `−${r.valor}`, '#e9d5ff'); ctx.aplicarHp(r.id); marcarEfeitos(ctx, el, r.efeitos || []); }
  particulas(ctx, t.x, t.pe, { n: 12, cor: '#1e0b36', tam: 9, dist: 55, grav: 50, alto: 25, vida: 700 }); particulas(ctx, t.x, t.y, { n: 8, cor: '#c4b5fd', tam: 4, dist: 60, vida: 450 });
  // dissipação: volta ao lugar enquanto o rastro some
  await anim(A, [{ transform: `translate(${dx}px,${dy}px) scale(1.1)` }, { transform: 'translate(0,0) scale(1)' }], { duration: 300 * ctx.k, easing: 'ease-out' }); A.getAnimations().forEach((x) => x.cancel());
}
async function chama(ctx, A, T, ev, cfg) {
  const a = caixa(ctx, A), t = caixa(ctx, T), dir = t.x > a.x ? 1 : -1, boca = a.boca(dir);
  // preparação: energia se concentra na boca
  const orbe = novo(ctx, `left:${boca.x}px;top:${boca.y}px;width:46px;height:46px;border-radius:50%;background:radial-gradient(circle,#fff 0 18%,#c4b5fd 38%,#7c3aed 62%,transparent 72%);z-index:14;mix-blend-mode:screen;filter:drop-shadow(0 0 14px #7c3aed)`);
  luzChao(ctx, a.x, a.pe, '#7c3aed', 110, 650, 0.6);
  for (let i = 0; i < Math.round(8 * ctx.dens); i++) { const ang = R(0, 6.28), d = R(40, 70); const p = novo(ctx, `left:${boca.x + Math.cos(ang) * d}px;top:${boca.y + Math.sin(ang) * d}px;width:5px;height:5px;border-radius:50%;background:#e9d5ff;box-shadow:0 0 8px #a78bfa;z-index:13`); p.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${-Math.cos(ang) * d}px), calc(-50% + ${-Math.sin(ang) * d}px)) scale(.3)`, opacity: 0.2 }], { duration: 420 * ctx.k, fill: 'forwards', easing: 'ease-in' }); limpa(p, 600); }
  A.querySelector('.un-fig').animate([{ transform: 'translateX(0) scale(1)' }, { transform: `translateX(${-dir * 7}px) scale(1.04)`, offset: 0.85 }, { transform: 'translateX(0) scale(1)' }], { duration: 560 * ctx.k });
  await anim(orbe, [{ transform: 'translate(-50%,-50%) scale(.15)', opacity: 0.4 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }], { duration: 420 * ctx.k, easing: 'ease-out' });
  // execução: a chama cruza a arena com cauda e luz no chão
  const x1 = t.x, y1 = t.y, dx = x1 - boca.x, dy = y1 - boca.y; const dur = 440 * ctx.k, t0 = performance.now();
  const luz = luzChao(ctx, boca.x, a.pe, '#a78bfa', 80, 520, 0.8); void luz;
  const arco = (u) => -Math.sin(u * Math.PI) * 38;
  await new Promise((fim) => { (function passo(now) { const u = Math.min(1, (now - t0) / dur), e = u * u * (3 - 2 * u); const px = boca.x + dx * e, py = boca.y + dy * e + arco(e); orbe.style.left = `${px}px`; orbe.style.top = `${py}px`; orbe.style.transform = `translate(-50%,-50%) scale(${1 + 0.15 * Math.sin(u * 20)})`; if (Math.random() < 0.9) { const c = novo(ctx, `left:${px}px;top:${py}px;width:${R(14, 26)}px;height:${R(14, 26)}px;border-radius:50%;background:radial-gradient(#e9d5ff,#7c3aed 60%,transparent);z-index:11`); c.animate([{ opacity: 0.8, transform: 'translate(-50%,-50%) scale(1)' }, { opacity: 0, transform: 'translate(-50%,-50%) scale(.2)' }], { duration: 380 * ctx.k, fill: 'forwards' }); limpa(c, 500); const g = novo(ctx, `left:${px}px;top:${a.pe + (t.pe - a.pe) * e}px;width:60px;height:22px;border-radius:50%;background:radial-gradient(closest-side,#a78bfa88,transparent);z-index:2;mix-blend-mode:screen`); g.animate([{ opacity: 0.8 }, { opacity: 0 }], { duration: 420 * ctx.k, fill: 'forwards' }); limpa(g, 560); } if (u < 1) requestAnimationFrame(passo); else fim(); })(t0); });
  orbe.remove();
  // impacto: explosão violeta com onda de choque, brasas, fumaça e o movimento de câmera mais forte
  camera(ctx, { x: t.x, y: t.y }, { ...cfg.camera, ms: 520 }); flash(ctx, '#7c3aed', 200, 0.32);
  const boom = novo(ctx, `left:${t.x}px;top:${t.y}px;width:${t.w * 1.4}px;height:${t.w * 1.4}px;border-radius:50%;background:radial-gradient(circle,#fff 0 12%,#e9d5ff 28%,#7c3aed 55%,transparent 72%);z-index:12;mix-blend-mode:screen`); boom.animate([{ transform: 'translate(-50%,-50%) scale(.2)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(1.5)', opacity: 0 }], { duration: 520 * ctx.k, fill: 'forwards', easing: 'ease-out' }); limpa(boom, 700);
  anel(ctx, t.x, t.pe, '#c4b5fd', 220, 560, 5); anel(ctx, t.x, t.pe, '#7c3aed', 150, 460, 3);
  particulas(ctx, t.x, t.y, { n: 16, cor: '#fb923c', tam: 5, dist: 100, grav: 70, alto: 30, vida: 800 }); particulas(ctx, t.x, t.y, { n: 10, cor: '#c4b5fd', tam: 6, dist: 90, vida: 700 });
  particulas(ctx, t.x, t.y - 10, { n: 7, cor: '#2e1065cc', tam: 34, dist: 50, alto: 70, vida: 1000, blur: true });
  const mancha = luzChao(ctx, t.x, t.pe, '#1e0b36', 90, 1100, 0.7); mancha.style.mixBlendMode = 'normal';
  for (const r of ev.alvos) { const el = ctx.no(r.id); if (!el) continue; reacao(ctx, el, dir, 1.9); numero(ctx, el, `−${r.valor}`, '#f5d0fe', true); ctx.aplicarHp(r.id); marcarEfeitos(ctx, el, r.efeitos || []); }
  await ESP(520 * ctx.k);
}
async function veu(ctx, A, T, ev, cfg) {
  const a = caixa(ctx, A);
  // preparação: a sombra sobe do chão
  luzChao(ctx, a.x, a.pe, '#4c1d95', 100, 1500, 0.8);
  for (let i = 0; i < Math.round(7 * ctx.dens + 2); i++) { const w = novo(ctx, `left:${a.x + R(-a.w * 0.4, a.w * 0.4)}px;top:${a.pe}px;width:12px;height:${R(40, a.h * 0.9)}px;background:linear-gradient(0deg,#2e1065cc,transparent);border-radius:8px;transform-origin:50% 100%;z-index:6`); w.animate([{ transform: 'translate(-50%,-100%) scaleY(0)', opacity: 0 }, { transform: 'translate(-50%,-100%) scaleY(1)', opacity: 0.9, offset: 0.6 }, { transform: 'translate(-50%,-100%) scaleY(1.1)', opacity: 0 }], { duration: 900 * ctx.k, delay: i * 50 * ctx.k, fill: 'forwards', easing: 'ease-out' }); limpa(w, 1500); }
  await ESP(480 * ctx.k);
  // execução: o manto envolve o Onírico
  const manto = novo(ctx, `left:${a.x}px;top:${a.y}px;width:${a.w * 1.25}px;height:${a.h * 1.2}px;border-radius:50%;background:conic-gradient(from 0deg,#1e0b3688,#7c3aed66,#1e0b36aa,#a78bfa55,#1e0b3688);z-index:4;filter:${ctx.blur ? 'blur(3px)' : 'none'}`);
  manto.animate([{ transform: 'translate(-50%,-50%) scale(.55) rotate(0)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1) rotate(180deg)', opacity: 0.95, offset: 0.7 }, { transform: 'translate(-50%,-50%) scale(1.02) rotate(260deg)', opacity: 0.9 }], { duration: 760 * ctx.k, fill: 'forwards', easing: 'ease-out' });
  for (let i = 0; i < Math.round(10 * ctx.dens); i++) setTimeout(() => particulas(ctx, a.x + R(-a.w * 0.35, a.w * 0.35), a.pe - R(0, a.h * 0.5), { n: 1, cor: '#c4b5fd', tam: 5, dist: 10, alto: 70, vida: 900 }), i * 60 * ctx.k);
  await ESP(760 * ctx.k);
  // impacto: a aura se fecha; a recuperação aparece
  const r = ev.alvos[0] || { valor: 0, efeitos: [], limpos: [] };
  anel(ctx, a.x, a.y, '#c4b5fd', a.w * 1.4, 600, 3); flash(ctx, '#4c1d95', 160, 0.18);
  await anim(manto, [{ transform: 'translate(-50%,-50%) scale(1.02) rotate(260deg)', opacity: 0.9 }, { transform: 'translate(-50%,-50%) scale(.82) rotate(300deg)', opacity: 0.55 }], { duration: 300 * ctx.k, easing: 'ease-in' });
  numero(ctx, A, `+${r.valor}`, '#a7f3d0', true); ctx.aplicarHp(ev.alvos[0]?.id || ev.ator); marcarEfeitos(ctx, A, [...(r.efeitos || []), ...(r.limpos?.length ? [] : [])]);
  if (r.limpos?.length) { particulas(ctx, a.x, a.y, { n: 10, cor: '#fff', tam: 4, dist: 70, vida: 700, alto: 20 }); numero(ctx, A, '✨ Purificado', '#e0f2fe'); }
  // dissipação: a aura some devagar
  await anim(manto, [{ opacity: 0.55, transform: 'translate(-50%,-50%) scale(.82) rotate(300deg)' }, { opacity: 0, transform: 'translate(-50%,-50%) scale(.7) rotate(340deg)' }], { duration: 500 * ctx.k, easing: 'ease-in' }); manto.remove();
}

// ---------- genéricos por tipo + elemento ----------
async function genericoDano(ctx, A, ev, hab) {
  const a = caixa(ctx, A), elem = hab?.elemento || 'neutro', E = ELEM[elem] || ELEM.neutro; const alvos = ev.alvos.map((r) => ctx.no(r.id)).filter(Boolean); const T = alvos[0]; const t = caixa(ctx, T), dir = t.x > a.x ? 1 : -1;
  const dx = (t.x - a.x) * 0.8, dy = (t.pe - a.pe) * 0.8, forte = (hab?.mult || 1) >= 1.8 || ev.area;
  luzChao(ctx, a.x, a.pe, E.cor, 80, 600, 0.5); particulas(ctx, a.x, a.y, { n: 6, cor: E.cor2, tam: 5, dist: 40, vida: 420 });
  if (!hab?.distancia) {
    await anim(A.querySelector('.un-fig'), [{ transform: 'translate(0,0)' }, { transform: `translate(${-dir * 6}px,5px) scaleY(.92)` }], { duration: 200 * ctx.k });
    const tr = setInterval(() => fantasma(ctx, A, E.cor), 80 * ctx.k); await lancar(ctx, A, T, dx, dy, 260); clearInterval(tr);
    camera(ctx, { x: t.x, y: t.y }, { zoom: forte ? 1.05 : 1.02, tremor: forte ? 6 : 2 });
  } else {
    const b0 = a.boca(dir), orbe = novo(ctx, `left:${b0.x}px;top:${b0.y}px;width:30px;height:30px;border-radius:50%;background:radial-gradient(circle,#fff,${E.cor} 55%,transparent 72%);z-index:14;mix-blend-mode:screen`);
    await ESP(260 * ctx.k); const t0 = performance.now(), dur = 380 * ctx.k, ex = t.x - b0.x, ey = t.y - b0.y;
    await new Promise((fim) => { (function p(now) { const u = Math.min(1, (now - t0) / dur); orbe.style.left = `${b0.x + ex * u}px`; orbe.style.top = `${b0.y + ey * u - Math.sin(u * 3.14) * 24}px`; if (u < 1) requestAnimationFrame(p); else fim(); })(t0); }); orbe.remove();
    camera(ctx, { x: t.x, y: t.y }, { zoom: forte ? 1.06 : 1.02, tremor: forte ? 7 : 2 });
  }
  let i = 0; for (const r of ev.alvos) { const el = ctx.no(r.id); if (!el) continue; const c = caixa(ctx, el); setTimeout(() => { impactoElemento(ctx, c.x, c.y, elem, forte); reacao(ctx, el, dir, forte ? 1.5 : 1); numero(ctx, el, `−${r.valor}`, E.cor2, forte); ctx.aplicarHp(r.id); marcarEfeitos(ctx, el, r.efeitos || []); }, i++ * 90 * ctx.k); }
  await ESP((220 + ev.alvos.length * 90) * ctx.k);
  if (!hab?.distancia) await anim(A, [{ transform: `translate(${dx}px,${dy}px) scale(1.1)` }, { transform: 'translate(0,0) scale(1)' }], { duration: 240 * ctx.k, easing: 'ease-out' }); A.getAnimations().forEach((x) => x.cancel());
}
async function genericoApoio(ctx, A, ev, hab) {
  const elem = hab?.elemento || 'luz', E = (hab?.tipo === 'cura' ? { cor: '#4ade80', cor2: '#d9f99d' } : ELEM[elem] || ELEM.luz);
  const alvos = ev.alvos.map((r) => ctx.no(r.id)).filter(Boolean); let i = 0;
  for (const r of ev.alvos) { const el = ctx.no(r.id); if (!el) continue; const c = caixa(ctx, el); luzChao(ctx, c.x, c.pe, E.cor, 90, 1200, 0.7); particulas(ctx, c.x, c.pe, { n: 10, cor: E.cor2, tam: 5, dist: 24, alto: 90, vida: 900 }); }
  await ESP(520 * ctx.k);
  for (const r of ev.alvos) { const el = ctx.no(r.id); if (!el) continue; const c = caixa(ctx, el); setTimeout(() => { anel(ctx, c.x, c.y, E.cor, c.w * 1.3, 600, 3); if (r.valor) numero(ctx, el, `+${r.valor}`, '#bbf7d0', true); ctx.aplicarHp(r.id); marcarEfeitos(ctx, el, r.efeitos || []); if (r.limpos?.length) { particulas(ctx, c.x, c.y, { n: 10, cor: '#fff', tam: 4, dist: 60, vida: 650 }); numero(ctx, el, '✨ Purificado', '#e0f2fe'); } }, i++ * 80 * ctx.k); }
  await ESP((500 + alvos.length * 80) * ctx.k);
}

// ---------- entrada principal ----------
export async function tocarEvento(ctx, ev) {
  // efeitos de início de turno (dano por turno, cura contínua, turno perdido)
  for (const x of ev.antes || []) { const el = ctx.no(x.alvo); if (!el) continue; if (x.tipo === 'dot') { const d = EFEITOS[x.efeito]; numero(ctx, el, `${d.icone.slice(0, 2)} −${x.valor}`, d.cor); reacao(ctx, el, 1, 0.4); ctx.aplicarHp(x.alvo); } else if (x.tipo === 'regen') { numero(ctx, el, `💚 +${x.valor}`, '#4ade80'); ctx.aplicarHp(x.alvo); } else if (x.tipo === 'pular') numero(ctx, el, `${EFEITOS[x.efeito].icone.slice(0, 2)} perde o turno`, EFEITOS[x.efeito].cor); }
  if (ev.antes?.length) await ESP(520 * ctx.k);
  const A = ctx.no(ev.ator); if (!A) return;
  const hab = ev.hab, cfg = hab && FX_HABILIDADES[hab.id];
  const T = ctx.no(ev.alvo);
  if (cfg?.clip) { await tocarClipe(ctx, cfg, T || A, ev); }
  else if (cfg?.estilo === 'mordida' && T) await mordida(ctx, A, T, ev, cfg);
  else if (cfg?.estilo === 'chama' && T) await chama(ctx, A, T, ev, cfg);
  else if (cfg?.estilo === 'veu') await veu(ctx, A, T, ev, cfg);
  else if (ev.tipo === 'atacar' && T) await genericoDano(ctx, A, { ...ev, area: false }, { tipo: 'dano', mult: 1, elemento: 'neutro', distancia: false });
  else if (ev.tipo === 'habilidade' && T) await genericoDano(ctx, A, ev, hab);
  else if (ev.tipo === 'defender') { const c = caixa(ctx, A); anel(ctx, c.x, c.y, '#60a5fa', c.w * 1.3, 500, 3); luzChao(ctx, c.x, c.pe, '#60a5fa', 80, 700, 0.6); ctx.aplicarHp(ev.ator); if (hab) await genericoApoio(ctx, A, ev, hab); else await ESP(300 * ctx.k); }
  else await genericoApoio(ctx, A, ev, hab);
  for (const r of ev.alvos || []) ctx.aplicarHp(r.id);
  return ev;
}
// Clipe do Flow: toca o vídeo sobre o alvo e dispara o impacto no tempo configurado
async function tocarClipe(ctx, cfg, alvoEl, ev) {
  const c = caixa(ctx, alvoEl); const v = document.createElement('video'); v.src = cfg.clip; v.muted = true; v.playsInline = true; v.style.cssText = `position:absolute;left:${c.x}px;top:${c.y}px;width:${c.w * 3}px;transform:translate(-50%,-50%);mix-blend-mode:screen;z-index:20;pointer-events:none`; ctx.campo.append(v);
  await v.play().catch(() => {}); await ESP(cfg.impactoMs || 500);
  for (const r of ev.alvos || []) { const el = ctx.no(r.id); if (el) { reacao(ctx, el, 1, 1.2); numero(ctx, el, r.valor ? (ev.tipo === 'habilidade' || ev.tipo === 'atacar' ? `−${r.valor}` : `+${r.valor}`) : '', '#fff'); ctx.aplicarHp(r.id); } }
  await ESP(400); v.remove();
}
// Duração aproximada (para o ritmo do automático)
export const duracaoEstimada = (ev, rapido = false) => {
  if (!ev) return 0; const k = rapido ? 0.62 : 1; const id = ev.hab?.id;
  const base = id === 'chama_violeta' ? 1750 : id === 'veu_noturno' ? 2150 : id === 'mordida_umbral' ? 1200 : ev.tipo === 'atacar' ? 800 : ev.tipo === 'habilidade' ? (ev.hab?.distancia ? 1500 : 1250) : 1100;
  return (base + (ev.antes?.length ? 520 : 0) + (ev.alvos?.length > 1 ? ev.alvos.length * 90 : 0)) * k;
};
