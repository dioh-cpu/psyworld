// Revelação de invocações e de ovos do Passe. Só apresenta: o resultado chega pronto do sistema (cartas com tier, arte e extra),
// inclusive ao reabrir o painel (`revelados` diz quais já foram abertas; `aoRevelar(i)` avisa o sistema para gravar).
// Cartas começam de costas (verso do banner); ao tocar: preparação curta → virada nítida → impacto com som → leitura do resultado.
// A intensidade cresce de T1 a T5 e a paleta segue a edição (Halloween, Dinossauros, Adventurer, Elementais, Dragões).
// Respeita volume, reduzir movimento e Pular. Efeitos de partículas reaproveitam o motor da batalha.
import { camada, particula, rajada, convergir, onda, luz, linhasFoco, coluna, raiosLuz, livre, R } from './regiao1-vfx-motor.js';
import { ELEM } from './regiao1-vfx.js';
import { pref, tocar, proximoVolume, iconeVolume } from './regiao1-sfx.js';

const ESP = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const ART_BANNER = 'assets/confusion/interface/banner';
// Paletas por edição: c1 (fundo), c2 (brilho), c3 (acento)
export const EDICOES = {
  padrao: { nome: 'Banner', c1: '#3b1d4a', c2: '#f3a458', c3: '#c084fc' },
  halloween: { nome: 'Halloween', c1: '#450a0a', c2: '#f97316', c3: '#a855f7' }, // paleta do Abyssar: sangue, abóbora e violeta
  dinossauros: { nome: 'Dinossauros', c1: '#451a03', c2: '#f59e0b', c3: '#fde68a' }, // âmbar
  adventurer: { nome: 'Adventurer', c1: '#431407', c2: '#fbbf24', c3: '#ea580c' }, // dourado de outono
  elementais: { nome: 'Elementais', porElemento: true },
  dragoes: { nome: 'Dragões', luz: { c1: '#422006', c2: '#fde68a', c3: '#ffffff' }, sombra: { c1: '#0b0618', c2: '#7c3aed', c3: '#f0abfc' } },
};
export const TIER = {
  1: { cor: '#cbd5e1', prep: 120, n: 10, nome: 'Comum' },
  2: { cor: '#4ade80', prep: 180, n: 16, nome: 'Incomum' },
  3: { cor: '#60a5fa', prep: 300, n: 24, nome: 'Raro' },
  4: { cor: '#c084fc', prep: 520, n: 34, nome: 'Épico' },
  5: { cor: '#fbbf24', prep: 1150, n: 48, nome: 'Lendário' },
};
function paleta(ed, carta) {
  const E = EDICOES[ed] || EDICOES.padrao;
  if (E.porElemento) { const el = ELEM[carta.elemento] || ELEM.neutro; return { c1: '#0f0a1a', c2: el.cor, c3: el.cor2 }; }
  if (ed === 'dragoes') return carta.lado === 'sombra' ? E.sombra : E.luz;
  return E;
}

let cssOk = false;
const CSS = `
.rv{position:fixed;inset:0;z-index:140;display:flex;flex-direction:column;background:radial-gradient(ellipse at 50% 45%,var(--c1,#1d1028) 0,#07040c 75%);color:#fff7ed;font:13px system-ui,sans-serif;user-select:none;-webkit-user-select:none;overflow:hidden;padding:env(safe-area-inset-top,0) env(safe-area-inset-right,0) env(safe-area-inset-bottom,0) env(safe-area-inset-left,0)}
.rv-topo{position:relative;z-index:5;display:flex;align-items:center;gap:8px;padding:8px 12px}
.rv-topo b{flex:1;font-size:15px;letter-spacing:.04em;text-shadow:0 0 12px var(--c2)}
.rv button{font:inherit;color:#fff7ed;background:rgba(20,10,30,.75);border:1px solid rgba(255,255,255,.28);border-radius:8px;padding:6px 10px;cursor:pointer;min-height:34px}
.rv button.pri{background:linear-gradient(#f3a458,#c2410c);border-color:#fde68a;color:#1b0b05;font-weight:800}
.rv-mesa{position:relative;flex:1;display:flex;align-items:center;justify-content:center;z-index:3}
.rv-grade{display:grid;gap:var(--gap,10px);grid-template-columns:repeat(var(--cols,5),var(--w));justify-content:center}
.rv-carta{position:relative;width:var(--w);height:calc(var(--w)*1.25);perspective:900px;cursor:pointer}
.rv-gira{position:absolute;inset:0;transform-style:preserve-3d}
.rv-carta.aberta .rv-gira{transform:rotateY(180deg)}
.rv-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:6%;overflow:hidden}
.rv-verso{background:center/100% 100% no-repeat}
.rv-frente{transform:rotateY(180deg)}
.rv-fundo{position:absolute;inset:6%;border-radius:4%}
.rv-arte{position:absolute;left:5%;top:13%;width:90%;height:70%;object-fit:contain;filter:drop-shadow(0 0 5px rgba(255,255,255,.35)) drop-shadow(0 6px 6px rgba(0,0,0,.6))}
.rv-moldura{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.rv-nome{position:absolute;left:8%;right:8%;bottom:7%;text-align:center;font-weight:800;font-size:calc(var(--w)*.095);line-height:1.1;text-shadow:0 1px 2px #000,0 0 8px #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rv-tier{position:absolute;left:50%;top:10.5%;translate:-50% 0;padding:0 .5em;border-radius:1em;background:rgba(10,5,16,.78);border:1px solid var(--tc);color:var(--tc);font-weight:900;font-size:calc(var(--w)*.075);white-space:nowrap;text-shadow:0 0 6px var(--tc)}
.rv-carta.aberta.t5 .rv-frente{box-shadow:0 0 calc(var(--w)*.12) #fbbf24}
.rv-carta.aberta.t4 .rv-frente{box-shadow:0 0 calc(var(--w)*.08) #c084fc}
.rv-extra{position:absolute;right:-14%;bottom:-6%;width:46%;height:46%;border-radius:8%;overflow:hidden;opacity:0;transform:scale(.4) rotate(-12deg);box-shadow:0 0 12px #fbbf24;background:linear-gradient(#7c2d12,#1c0a05);border:2px solid #fbbf24;pointer-events:none}
.rv-extra img{width:100%;height:78%;object-fit:contain}
.rv-extra i{display:block;text-align:center;font-style:normal;font-weight:800;font-size:calc(var(--w)*.06);color:#fde68a}
.rv-dica{position:absolute;left:0;right:0;bottom:4%;text-align:center;opacity:.8;z-index:4;pointer-events:none}
.rv-faixa{position:absolute;left:-10%;right:-10%;top:50%;translate:0 -50%;padding:.4em 0;text-align:center;font:italic 900 clamp(20px,5vw,46px)/1 system-ui;letter-spacing:.06em;background:linear-gradient(90deg,transparent,rgba(0,0,0,.75) 20%,rgba(0,0,0,.75) 80%,transparent);color:#fff;-webkit-text-stroke:1px var(--c2);text-shadow:0 0 18px var(--c2);z-index:6;pointer-events:none}
.rv-campo{position:absolute;inset:0;z-index:4;pointer-events:none}
.rv-ovo{position:relative;width:var(--w);height:calc(var(--w)*1.28);cursor:pointer;transform-origin:50% 90%}
.rv-ovo .casca{position:absolute;inset:0;border-radius:50% 50% 46% 46%/60% 60% 40% 40%;background:radial-gradient(circle at 35% 28%,rgba(255,255,255,.85) 0,rgba(255,255,255,0) 18%),radial-gradient(circle at 70% 70%,var(--o2) 0,transparent 30%),radial-gradient(circle at 30% 72%,var(--o2) 0,transparent 16%),radial-gradient(circle at 60% 35%,var(--o2) 0,transparent 12%),linear-gradient(160deg,var(--o1),var(--o3));box-shadow:inset -10px -16px 30px rgba(0,0,0,.45),0 0 26px var(--o1)}
.rv-ovo svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.rv-ovo svg path{fill:none;stroke:#fff8dc;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 6px var(--o2));stroke-dasharray:400;stroke-dashoffset:400}
.rv-rapida{position:fixed;left:50%;top:18%;translate:-50% 0;z-index:141;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;pointer-events:auto}
.rv-chip{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:rgba(20,10,30,.92);border:1px solid #f3a458;color:#fff7ed;font:700 14px system-ui;box-shadow:0 0 14px rgba(243,164,88,.45)}
.rv-chip img{width:26px;height:26px;object-fit:contain}
@media (prefers-reduced-motion: reduce){.rv-ovo svg path{transition:none}}`;
const injetar = () => { if (cssOk) return; cssOk = true; const s = document.createElement('style'); s.textContent = CSS; document.head.append(s); };

// ---------- estrutura comum ----------
function criarPalco({ titulo, ed, raiz }) {
  injetar();
  const E = EDICOES[ed] || EDICOES.padrao, base = E.porElemento ? EDICOES.padrao : ed === 'dragoes' ? E.luz : E;
  const el = document.createElement('div'); el.className = 'rv'; el.style.setProperty('--c1', base.c1); el.style.setProperty('--c2', base.c2);
  el.innerHTML = `<div class="rv-topo"><b>${esc(titulo)}</b><button data-vol="1" title="Volume">${iconeVolume()}</button><button data-pular="1">Pular</button></div><div class="rv-mesa"></div><div class="rv-campo"></div><div class="rv-dica"></div>`;
  document.body.append(el);
  const campo = el.querySelector('.rv-campo');
  const ctx = { arena: el, campo, k: pref.reduzir ? 0.6 : 1, dens: matchMedia('(pointer: coarse)').matches ? 0.55 : 1 };
  el.addEventListener('click', (e) => { const b = e.target.closest('[data-vol]'); if (b) { proximoVolume(); b.textContent = iconeVolume(); tocar('toque'); } });
  return { el, mesa: el.querySelector('.rv-mesa'), dica: el.querySelector('.rv-dica'), ctx, M: () => camada(ctx), raiz };
}
const centro = (P, alvo) => { const a = P.el.getBoundingClientRect(), r = alvo.getBoundingClientRect(); return { x: r.left + r.width / 2 - a.left, y: r.top + r.height / 2 - a.top, w: r.width, h: r.height, topo: r.top - a.top, pe: r.bottom - a.top }; };
function tremerPalco(P, forca, ms) { if (pref.reduzir) return; const n = Math.round(ms / 34), kf = []; for (let i = 0; i <= n; i++) { const q = 1 - i / n, f = forca * q; kf.push({ transform: `translate(${R(-f, f)}px,${R(-f, f) * 0.7}px)` }); } kf[n] = { transform: 'none' }; P.mesa.animate(kf, { duration: ms }); }
function flashPalco(P, cor, ms = 200, op = 0.5) { const f = document.createElement('i'); f.style.cssText = `position:absolute;inset:0;background:${cor};opacity:0;pointer-events:none;z-index:7`; P.el.append(f); f.animate([{ opacity: op }, { opacity: 0 }], { duration: ms }); setTimeout(() => f.remove(), ms + 40); }
function faixa(P, txt, cor, ms = 1300) { const f = document.createElement('div'); f.className = 'rv-faixa'; f.style.setProperty('--c2', cor); f.textContent = txt; P.el.append(f); f.animate([{ opacity: 0, letterSpacing: '.5em', transform: 'scaleY(.2)' }, { opacity: 1, letterSpacing: '.06em', transform: 'scaleY(1)', offset: 0.18 }, { opacity: 1, offset: 0.8 }, { opacity: 0, transform: 'scaleY(.6)' }], { duration: ms, fill: 'forwards' }); setTimeout(() => f.remove(), ms + 50); }
const estrelas = (t) => '★'.repeat(t);

// Frente da carta (Onírico, tier, moldura e, no Adventurer, a carta extra)
function htmlCarta(P, carta, i, ed) {
  const t = Math.max(1, Math.min(5, carta.tier || 1)), pal = paleta(ed, carta), tc = TIER[t].cor, r = P.raiz;
  return `<div class="rv-carta t${t}" data-i="${i}" style="--tc:${tc}"><div class="rv-gira"><div class="rv-face rv-verso" style="background-image:url('${r}${ART_BANNER}/verso.png')"></div>
    <div class="rv-face rv-frente"><div class="rv-fundo" style="background:radial-gradient(circle at 50% 45%, #fff6 0, ${pal.c2}dd 22%, ${pal.c1} 66%, #07040c 100%)"></div>${carta.arte ? `<img class="rv-arte" src="${r}${esc(carta.arte)}" alt="">` : ''}<img class="rv-moldura" src="${r}${ART_BANNER}/moldura-${t}.png" alt=""><div class="rv-tier">T${t} ${estrelas(t)}</div><div class="rv-nome">${esc(carta.nome || carta.especie)}</div></div></div>
    ${carta.extra ? `<div class="rv-extra">${carta.extra.arte ? `<img src="${r}${esc(carta.extra.arte)}" alt="">` : ''}<i>+ ${esc(carta.extra.nome || 'Extra')}</i></div>` : ''}</div>`;
}
// Partículas próprias da edição
function especial(M, c, ed, pal, carta, forca) {
  const n = Math.round(10 * forca);
  if (ed === 'halloween') { rajada(M, c.x, c.y, { n, forma: 'morcego', cor: '#12061c', cor2: '#fb923c', tam: 12, v: 300, sobe: 120, vida: 1.2, atrito: 0.5, bate: 28 }); rajada(M, c.x, c.y, { n: Math.ceil(n / 2), forma: 'abobora', tam: 8, v: 220, sobe: 160, grav: 300, vida: 1.2, atrito: 0.4 }); }
  else if (ed === 'dinossauros') { rajada(M, c.x, c.y, { n: n + 4, forma: 'caco', cor: '#b45309', cor2: '#fde68a', tam: 9, v: 320, grav: 500, vida: 1.1, atrito: 0.5 }); rajada(M, c.x, c.pe, { n: 6, forma: 'fumaca', cor: '#78350f', tam: 30, tamFim: 60, v: 90, vida: 1.2 }); }
  else if (ed === 'adventurer') rajada(M, c.x, c.y, { n: n + 6, forma: 'folha', cor: '#ea580c', cor2: '#fcd34d', tam: 8, v: 280, grav: 120, vida: 1.5, vrot: 8, atrito: 0.9 });
  else if (ed === 'elementais') { const el = carta.elemento; const forma = { fogo: 'brasa', agua: 'gota', planta: 'folha', luz: 'estrela', trevas: 'fumaca', eletrico: 'faisca', pedra: 'caco', terra: 'caco' }[el] || 'brilho'; rajada(M, c.x, c.y, { n: n + 6, forma, cor: pal.c2, cor2: pal.c3, tam: forma === 'fumaca' ? 22 : 7, v: 300, grav: forma === 'gota' || forma === 'caco' ? 500 : 60, vida: 1.1, atrito: 0.6 }); }
  else if (ed === 'dragoes') { if (carta.lado === 'sombra') { rajada(M, c.x, c.y, { n: 8, forma: 'fumaca', cor: '#1e0b36', tam: 30, tamFim: 60, v: 110, vida: 1.3, blend: 'source-over' }); rajada(M, c.x, c.y, { n: n + 4, forma: 'faisca', cor: '#a78bfa', tam: 4, v: 420, vida: 0.6 }); } else { raiosLuz(M, c.x, c.y, { cor: '#fde68a', raio: c.h * 1.2, vida: 1, n: 12 }); rajada(M, c.x, c.y, { n: n + 2, forma: 'pena', cor: '#ffffff', cor2: '#fde68a', tam: 7, v: 200, grav: 60, vida: 1.6, atrito: 0.8 }); } }
}
// Impacto da revelação, escalonado pelo tier
function impactoTier(P, M, c, t, ed, pal, carta) {
  const T = TIER[t], forte = t >= 4, red = pref.reduzir;
  tocar('impacto', t);
  luz(M, c.x, c.y, { cor: T.cor, raio: c.w * (0.7 + t * 0.25), vida: 0.7, chao: false, forca: 0.9, nucleo: '#fff' });
  if (red) return;
  rajada(M, c.x, c.y, { n: T.n, forma: t >= 3 ? 'estrela' : 'brilho', cor: T.cor, tam: 4 + t, v: 160 + t * 60, vida: 0.8 + t * 0.08 });
  if (t >= 2) onda(M, c.x, c.y, { cor: T.cor, r1: c.w * (0.9 + t * 0.3), esp: 3 + t, vida: 0.6, chao: false, achata: 0.9 });
  if (t >= 3) raiosLuz(M, c.x, c.y, { cor: pal.c2, raio: c.h * (0.6 + t * 0.18), vida: 0.9, n: 6 + t * 2 });
  if (t >= 3) especial(M, c, ed, pal, carta, t >= 5 ? 2.2 : t >= 4 ? 1.4 : 0.8);
  if (forte) { flashPalco(P, t === 5 ? '#fff7d6' : T.cor, t === 5 ? 320 : 200, t === 5 ? 0.75 : 0.35); tremerPalco(P, t === 5 ? 14 : 6, t === 5 ? 700 : 380); }
  if (t === 5) { linhasFoco(M, c.x, c.y, { vida: 0.9, alfa: 0.5, cor: '#fff7d6' }); coluna(M, c.x, c.pe, { cor: '#fbbf24', larg: c.w * 0.6, alt: P.el.clientHeight * 1.1, vida: 1.3 }); onda(M, c.x, c.y, { cor: pal.c2, r1: c.w * 3, esp: 8, vida: 0.9, chao: false, achata: 0.9, atraso: 0.08 }); }
}
// Preparação (antes de virar): cresce com o tier; T5 escurece, treme e vaza luz
async function preparar(P, M, el, t, pal) {
  if (pref.reduzir || P.rapido) { await ESP(60); return; }
  const T = TIER[t], c = centro(P, el), ms = T.prep;
  tocar('carga', t);
  el.animate([{ transform: 'translateY(0) scale(1)', filter: 'none' }, { transform: `translateY(-${4 + t * 2}px) scale(${1 + t * 0.015})`, filter: `drop-shadow(0 0 ${4 + t * 4}px ${T.cor})` }], { duration: ms, fill: 'forwards', easing: 'ease-out' });
  if (t >= 2) convergir(M, c.x, c.y, { cor: T.cor, raio: c.w * (0.8 + t * 0.15), n: 8 + t * 5, vida: ms / 1000 });
  if (t >= 4) { luz(M, c.x, c.y, { cor: pal.c2, raio: c.w * 1.4, vida: ms / 1000 + 0.3, chao: false, forca: 0.6 }); }
  if (t === 5) {
    const veu = document.createElement('i'); veu.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,.65);opacity:0;z-index:2;pointer-events:none'; P.el.append(veu);
    veu.animate([{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 1, offset: 0.9 }, { opacity: 0 }], { duration: ms + 900, fill: 'forwards' }); setTimeout(() => veu.remove(), ms + 950);
    raiosLuz(M, c.x, c.y, { cor: '#fbbf24', raio: c.h * 1.1, vida: ms / 1000 + 0.2, n: 14, giro: 1.2 });
    for (let k = 0; k < 3; k++) setTimeout(() => { el.animate([{ transform: `translateY(-14px) scale(1.075) rotate(0)` }, { transform: `translateY(-14px) scale(1.075) rotate(${k % 2 ? -3 : 3}deg)` }, { transform: `translateY(-14px) scale(1.075) rotate(0)` }], { duration: 160 }); tocar('rachar'); onda(M, c.x, c.y, { cor: '#fbbf24', r1: c.w * (1 + k * 0.3), esp: 3, vida: 0.4, chao: false, achata: 0.9 }); }, ms * (0.3 + k * 0.22));
  }
  await ESP(ms);
}
async function virar(P, el, carta, ed, i, rapido = false) {
  if (el.classList.contains('aberta')) return;
  const t = Math.max(1, Math.min(5, carta.tier || 1)), pal = paleta(ed, carta), M = P.M();
  await preparar(P, M, el, rapido ? 1 : t, pal);
  const gira = el.querySelector('.rv-gira'); tocar('virar');
  if (!pref.reduzir) await gira.animate([{ transform: 'rotateY(0)' }, { transform: 'rotateY(180deg) scale(1.08)', offset: 0.7 }, { transform: 'rotateY(180deg)' }], { duration: rapido ? 200 : 300, easing: 'cubic-bezier(.5,0,.3,1)' }).finished.catch(() => {});
  el.classList.add('aberta'); el.getAnimations().forEach((a) => a.cancel());
  impactoTier(P, M, centro(P, el), t, ed, pal, carta);
  if (carta.extra) { const x = el.querySelector('.rv-extra'); x.animate([{ opacity: 0, transform: 'scale(.4) rotate(-12deg)' }, { opacity: 1, transform: 'scale(1.15) rotate(6deg)', offset: 0.6 }, { opacity: 1, transform: 'scale(1) rotate(4deg)' }], { duration: pref.reduzir ? 1 : 420, delay: pref.reduzir ? 0 : 260, fill: 'forwards' }); }
  if (t === 5 && !pref.reduzir && !rapido) faixa(P, `TIER 5 · ${String(carta.nome || carta.especie).toUpperCase()}`, pal.c2);
  P.aoRevelar?.(i);
}
const abrirSemEfeito = (el, carta, P, i) => { if (el.classList.contains('aberta')) return; el.classList.add('aberta'); if (carta.extra) { const x = el.querySelector('.rv-extra'); x.style.opacity = '1'; x.style.transform = 'scale(1) rotate(4deg)'; } P.aoRevelar?.(i); };

// ---------- invocação ----------
// cartas: [{ especie, nome?, tier 1–5, arte, elemento?, lado? ('luz'|'sombra'), extra?: { nome, arte } }]
export function revelarInvocacao({ edicao = 'padrao', titulo, cartas = [], revelados = [], aoRevelar, raiz = '../../../' } = {}) {
  return new Promise((fim) => {
    const P = criarPalco({ titulo: titulo || `Invocação · ${(EDICOES[edicao] || EDICOES.padrao).nome}`, ed: edicao, raiz }); P.aoRevelar = aoRevelar;
    const n = cartas.length, cols = n <= 1 ? 1 : n <= 5 ? n : Math.ceil(n / 2);
    const vw = innerWidth, vh = innerHeight, w = n <= 1 ? Math.min((vh - 120) / 1.25, vw * 0.4) : Math.min((vw - 40) / (cols + 0.6), (vh - 120) / (Math.ceil(n / cols) * 1.25 + 0.3));
    P.mesa.innerHTML = `<div class="rv-grade" style="--cols:${cols};--w:${Math.round(w)}px;--gap:${Math.round(w * 0.12)}px">${cartas.map((c, i) => htmlCarta(P, c, i, edicao)).join('')}</div>`;
    const els = [...P.mesa.querySelectorAll('.rv-carta')];
    revelados.forEach((v, i) => { if (v && els[i]) abrirSemEfeito(els[i], cartas[i], { aoRevelar: null }, i); });
    const topo = P.el.querySelector('.rv-topo');
    const bTudo = document.createElement('button'); bTudo.className = 'pri'; bTudo.textContent = 'Revelar tudo'; bTudo.dataset.tudo = '1'; if (n > 1) topo.insertBefore(bTudo, topo.querySelector('[data-vol]'));
    const bFim = document.createElement('button'); bFim.className = 'pri'; bFim.textContent = 'Continuar'; bFim.dataset.fim = '1';
    let ocupado = false;
    const faltam = () => els.filter((e) => !e.classList.contains('aberta'));
    const atualizar = () => { const f = faltam().length; P.dica.textContent = f ? (n > 1 ? `Toque numa carta para revelar (${f} restantes)` : 'Toque na carta para revelar') : ''; if (!f) { bTudo.remove(); P.el.querySelector('[data-pular]')?.remove(); if (!bFim.isConnected) topo.append(bFim); } };
    async function tudo() {
      if (ocupado) return; ocupado = true;
      const pend = faltam(), fortes = pend.filter((e) => cartas[e.dataset.i].tier >= 5), leves = pend.filter((e) => cartas[e.dataset.i].tier < 5);
      // comuns rápidas em sequência; os Tier 5 ficam para o fim, com apresentação inteira
      await Promise.all(leves.map((e, k) => ESP(k * (pref.reduzir ? 30 : 130)).then(() => virar(P, e, cartas[e.dataset.i], edicao, Number(e.dataset.i), cartas[e.dataset.i].tier < 4))));
      for (const e of fortes) { await ESP(250); await virar(P, e, cartas[e.dataset.i], edicao, Number(e.dataset.i)); await ESP(600); }
      ocupado = false; atualizar();
    }
    P.el.addEventListener('click', async (e) => {
      if (e.target.closest('[data-fim]')) { P.el.remove(); fim({ revelados: els.map((x) => x.classList.contains('aberta')) }); return; }
      if (e.target.closest('[data-pular]')) { els.forEach((x, i) => abrirSemEfeito(x, cartas[i], P, i)); atualizar(); return; }
      if (e.target.closest('[data-tudo]')) { tudo(); return; }
      const c = e.target.closest('.rv-carta'); if (!c || ocupado || c.classList.contains('aberta')) return;
      ocupado = true; await virar(P, c, cartas[c.dataset.i], edicao, Number(c.dataset.i)); ocupado = false; atualizar();
    });
    if (pref.pular) els.forEach((x, i) => abrirSemEfeito(x, cartas[i], P, i));
    atualizar();
  });
}

// ---------- ovos do Passe ----------
// recompensa: { especie?, nome, tier 1–5, arte, elemento?, lado?, extra? }. `nivel` do Passe; nível 100 + T5 recebe a apresentação máxima.
export function revelarOvo({ edicao = 'padrao', recompensa, nivel = 1, aberto = false, aoRevelar, raiz = '../../../' } = {}) {
  return new Promise((fim) => {
    const t = Math.max(1, Math.min(5, recompensa.tier || 1)), maximo = t === 5 && nivel >= 100, pal = paleta(edicao, recompensa), T = TIER[t];
    const P = criarPalco({ titulo: `Passe · Nível ${nivel}`, ed: edicao, raiz }); P.aoRevelar = aoRevelar;
    const w = Math.round(Math.min(innerHeight * 0.36, innerWidth * 0.3));
    P.mesa.innerHTML = `<div class="rv-ovo" style="--w:${w}px;--o1:${T.cor};--o2:${pal.c2};--o3:${pal.c1}"><div class="casca"></div><svg viewBox="0 0 100 128"><path d="M50 10 L44 30 L54 42 L46 58"/><path d="M46 58 L30 66 L22 82"/><path d="M54 42 L70 50 L76 66 L68 80"/><path d="M22 82 L40 90 L58 86 L68 80"/></svg></div>`;
    const ovo = P.mesa.querySelector('.rv-ovo'), trincas = [...ovo.querySelectorAll('path')];
    const bFim = document.createElement('button'); bFim.className = 'pri'; bFim.textContent = 'Continuar'; bFim.dataset.fim = '1';
    let feito = false;
    const mostrarCarta = (comEfeito) => {
      const grade = document.createElement('div'); grade.className = 'rv-grade'; grade.style.cssText = `--cols:1;--w:${Math.round(Math.min(w * 1.35, (innerHeight - 110) / 1.25))}px`; grade.innerHTML = htmlCarta(P, recompensa, 0, edicao);
      ovo.replaceWith(grade); const el = grade.querySelector('.rv-carta'); el.classList.add('aberta');
      if (recompensa.extra) { const x = el.querySelector('.rv-extra'); x.style.opacity = '1'; x.style.transform = 'scale(1) rotate(4deg)'; }
      if (comEfeito) { const M = P.M(), c = centro(P, el); impactoTier(P, M, c, t, edicao, pal, recompensa); el.animate([{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1.1)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)' }], { duration: pref.reduzir ? 1 : 420 }); if (maximo && !pref.reduzir) faixa(P, `NÍVEL 100 · ${String(recompensa.nome || recompensa.especie).toUpperCase()}`, pal.c2, 1800); }
      P.dica.textContent = ''; P.el.querySelector('[data-pular]')?.remove(); P.el.querySelector('.rv-topo').append(bFim); P.aoRevelar?.(0);
    };
    async function chocar() {
      if (feito) return; feito = true; const M = P.M(), c = centro(P, ovo);
      if (pref.reduzir) { mostrarCarta(true); return; }
      const golpes = maximo ? 4 : Math.max(1, Math.ceil(t / 2));
      if (maximo) { const veu = document.createElement('i'); veu.style.cssText = 'position:absolute;inset:0;background:#000;opacity:0;z-index:2;pointer-events:none'; P.el.append(veu); veu.animate([{ opacity: 0 }, { opacity: 0.85, offset: 0.2 }, { opacity: 0.85, offset: 0.85 }, { opacity: 0 }], { duration: 3600, fill: 'forwards' }); setTimeout(() => veu.remove(), 3700);
        ovo.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-18px) scale(1.06)' }], { duration: 700, fill: 'forwards', easing: 'ease-out' }); raiosLuz(M, c.x, c.y, { cor: '#fbbf24', raio: c.h * 1.6, vida: 3.2, n: 16, giro: 0.8, forca: 0.55 }); convergir(M, c.x, c.y, { cor: '#fde68a', raio: c.w * 2, n: 40, vida: 1.2, espalhaT: 1 }); tocar('carga', 5); await ESP(700); }
      for (let k = 0; k < golpes; k++) {
        const ang = k % 2 ? -1 : 1, f = maximo ? 9 + k * 3 : 6 + t;
        await ovo.animate([{ rotate: '0deg' }, { rotate: `${ang * f}deg` }, { rotate: `${-ang * f * 0.7}deg` }, { rotate: '0deg' }], { duration: maximo ? 380 : 260, composite: 'add' }).finished.catch(() => {});
        tocar('rachar'); const p = trincas[Math.min(trincas.length - 1, Math.floor(((k + 1) / golpes) * trincas.length) - 1)];
        trincas.slice(0, Math.ceil(((k + 1) / golpes) * trincas.length)).forEach((pp) => pp.animate([{ strokeDashoffset: getComputedStyle(pp).strokeDashoffset }, { strokeDashoffset: 0 }], { duration: 220, fill: 'forwards' })); void p;
        luz(M, c.x, c.y, { cor: pal.c2, raio: c.w * (0.6 + k * 0.25), vida: 0.45, chao: false, forca: 0.7 }); rajada(M, c.x, c.y, { n: 6 + k * 3, forma: 'faisca', cor: T.cor, tam: 3, v: 220, vida: 0.4 });
        if (maximo) { tremerPalco(P, 4 + k * 3, 300); flashPalco(P, '#fbbf24', 140, 0.2 + k * 0.08); }
        await ESP(maximo ? 260 : 110);
      }
      // a casca estoura
      flashPalco(P, maximo ? '#fffbeb' : T.cor, maximo ? 420 : 180, maximo ? 0.95 : 0.4);
      rajada(M, c.x, c.y, { n: maximo ? 26 : 12, forma: 'caco', cor: T.cor, cor2: '#fff8dc', tam: 10, v: 380, grav: 700, sobe: 120, achata: 1, vida: 1, atrito: 0.4 });
      mostrarCarta(true);
    }
    P.el.addEventListener('click', (e) => {
      if (e.target.closest('[data-fim]')) { P.el.remove(); fim({ revelado: true }); return; }
      if (e.target.closest('[data-pular]')) { if (!feito) { feito = true; mostrarCarta(false); } return; }
      if (e.target.closest('.rv-ovo')) chocar();
    });
    // flutua devagar enquanto espera
    if (!pref.reduzir) ovo.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-6px)' }, { transform: 'translateY(0)' }], { duration: 1800, iterations: Infinity, easing: 'ease-in-out' });
    P.dica.textContent = maximo ? 'O ovo lendário do nível 100 pulsa… toque para chocar' : 'Toque no ovo para chocar';
    if (aberto || pref.pular) { feito = true; mostrarCarta(false); }
  });
}
// Recompensas comuns do Passe: aparecem rápido, sem bloquear (somem sozinhas ou ao tocar)
export function mostrarRecompensas(lista = [], { raiz = '../../../', ms = 1500 } = {}) {
  injetar(); const box = document.createElement('div'); box.className = 'rv-rapida';
  box.innerHTML = lista.map((r) => `<span class="rv-chip">${r.arte ? `<img src="${raiz}${esc(r.arte)}" alt="">` : esc(r.icone || '🎁')} ${esc(r.qtd ? `${r.qtd}× ` : '')}${esc(r.nome)}</span>`).join('');
  document.body.append(box); tocar('toque');
  [...box.children].forEach((ch, i) => ch.animate([{ transform: 'translateY(-10px) scale(.7)', opacity: 0 }, { transform: 'translateY(0) scale(1)', opacity: 1 }], { duration: pref.reduzir ? 1 : 220, delay: pref.reduzir ? 0 : i * 60, fill: 'backwards' }));
  const sair = () => { if (!box.isConnected) return; box.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }); setTimeout(() => box.remove(), 220); };
  box.addEventListener('click', sair); setTimeout(sair, ms);
  return box;
}
// Ajuda para o sistema: monta as cartas de uma invocação a partir de espécies e tiers
export const cartaDe = (r, arteDe = () => '', elementoDe = () => 'neutro') => ({ especie: r.especie, nome: r.nome || r.especie, tier: r.tier, arte: r.arte || arteDe(r), elemento: r.elemento || elementoDe(r.especie), lado: r.lado, extra: r.extra });
