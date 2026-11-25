// Arena de batalha em tela inteira (paisagem): até 4 aliados e 4 inimigos em campo, até 2 inimigos na fila, HP legível acima de cada
// Onírico, ordem dos turnos, e no rodapé até 3 habilidades do Onírico da vez (ícone, nome, custo e recarga). Os efeitos vêm de
// regiao1-vfx.js, disparados uma única vez por evento. `criarArena` serve à Estratégia, aos Reinos e à Campanha; `criarTelaBatalha`
// é o overlay completo usado por missões e capítulos.
import { criarRng, criarUnidade, criarBatalha, atorAtual, executar, decidir, EFEITOS } from './regiao1-estrategia-regras.js';
import { criarCtx, tocarEvento, duracaoEstimada } from './regiao1-vfx.js';
import { ARTE_DA_ESPECIE } from '../species.js';

const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// pontos (em % do campo) onde cada Onírico pisa: formação em diagonal, como no modelo 4×4
const SLOT = { a: [[35, 49], [35, 79], [14, 49], [14, 79]], i: [[65, 49], [65, 79], [86, 49], [86, 79]] };
// Recorta cada arte pela área opaca, para que todos os Oníricos tenham a mesma escala e os pés na mesma linha do chão
const bboxCache = new Map();
function recortar(img) {
  const src = img.currentSrc || img.src; let b = bboxCache.get(src);
  if (!b) { const w = 96, h = Math.max(8, Math.round(96 * (img.naturalHeight / Math.max(1, img.naturalWidth)))); const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, w, h); let d; try { d = x.getImageData(0, 0, w, h).data; } catch { return; } let x0 = w, y0 = h, x1 = 0, y1 = 0; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (d[(j * w + i) * 4 + 3] > 20) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; } if (x1 <= x0 || y1 <= y0) return; b = { x0: x0 / w, y0: y0 / h, x1: (x1 + 1) / w, y1: (y1 + 1) / h, r: ((x1 + 1 - x0) * img.naturalWidth / w) / (((y1 + 1 - y0) * img.naturalHeight) / h) }; bboxCache.set(src, b); }
  img.style.objectViewBox = `inset(${b.y0 * 100}% ${(1 - b.x1) * 100}% ${(1 - b.y1) * 100}% ${b.x0 * 100}%)`; img.style.aspectRatio = String(b.r); img.style.height = 'clamp(56px, 24vh, 170px)'; img.style.width = 'auto'; img.style.visibility = 'visible';
}
// Perfis de batalha associados à arte original, inclusive quando ela vem de uma fase ou chefe.
const PERFIS_NO_CAMPO = {
  [ARTE_DA_ESPECIE.Noctarn]: { arquivo: 'assets/confusion/interface/batalha/noctarn-direita.webp', direcao: 'direita' },
  'assets/confusion/interface/personagens/espirito-boss-atual.webp': {
    arquivo: 'assets/confusion/interface/batalha/espirito-esquerda.webp',
    direcao: 'esquerda',
  },
};
// Sentido das demais artes em que o corpo já aparece de lado ou em três quartos.
const OLHA = {
  direita: ['Brotavel', 'Cervomusgo', 'Cobrabúfalo', 'Xistolim', 'Âmbarasa', 'Bronzelo', 'Cerifogo', 'Colmeiro', 'Falesário', 'Latonhorn', 'Trovoresta', 'Ventassol', 'Zunifaísca'],
  esquerda: ['Vaelith', 'Fanalino', 'Tatuveludo', 'Calquélon', 'Melifalcão', 'Vesprata', 'Ignavor'],
};
const olhaDe = (esp) => (OLHA.direita.includes(esp) ? 'direita' : OLHA.esquerda.includes(esp) ? 'esquerda' : 'frente');
const CSS = `
.arena { position: absolute; inset: 0; overflow: hidden; background: #1a0f22; color: #fff3e7; font: 12px system-ui, sans-serif; user-select: none; -webkit-user-select: none; }
.arena .tb-campo { position: absolute; inset: 0; background: center / cover no-repeat #24162b; will-change: transform; }
.arena .un { position: absolute; width: clamp(92px, 16vw, 170px); display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); background: none; border: 0; padding: 0; color: inherit; cursor: default; transition: opacity .5s; }
.arena .un-fig { position: relative; display: flex; justify-content: center; align-items: flex-end; width: 100%; order: 2; } .arena .un-fig img { width: auto; height: clamp(56px, 24vh, 170px); max-width: 100%; object-fit: contain; visibility: hidden; filter: drop-shadow(0 4px 3px rgba(0,0,0,.55)); }
.arena .un-sombra { position: absolute; left: 12%; right: 12%; bottom: -3%; height: 9%; border-radius: 50%; background: radial-gradient(closest-side, rgba(0,0,0,.55), transparent); }
.arena .un.vez .un-sombra { background: radial-gradient(closest-side, rgba(255,214,140,.0) 60%, #ffd58c 64%, transparent 70%); border: 2px solid #ffd58c; box-shadow: 0 0 10px #ffd58c88; }
.arena .un.alvo .un-sombra { border: 2px solid #fb7185; background: radial-gradient(closest-side, transparent 60%, #fb7185 64%, transparent 70%); }
.arena .un.morto { opacity: 0; pointer-events: none; } .arena .un.entrando { animation: tb-entra .7s ease-out; }
@keyframes tb-entra { from { opacity: 0; transform: translate(calc(-50% + 70px), -100%); } to { opacity: 1; transform: translate(-50%, -100%); } }
.arena .un-hud { position: relative; order: 1; display: flex; flex-direction: column; align-items: center; gap: 1px; width: 78%; min-width: 78px; margin-bottom: 2px; pointer-events: none; z-index: 3; }
.arena .un-lin { display: flex; align-items: center; gap: 3px; width: 100%; } .arena .un-nv { flex: 0 0 auto; min-width: 22px; padding: 1px 3px; text-align: center; font-weight: 800; font-size: 11px; background: rgba(20,12,30,.85); border: 1px solid #c8b08a; border-radius: 4px; }
.arena .un-hp { flex: 1; height: 7px; background: rgba(10,5,16,.85); border: 1px solid rgba(255,255,255,.35); border-radius: 4px; overflow: hidden; } .arena .un-hp i { display: block; height: 100%; background: linear-gradient(#6ee7b7, #10b981); transition: width .35s; } .arena .un.i .un-hp i { background: linear-gradient(#fda4af, #e11d48); }
.arena .un-efs { display: flex; gap: 1px; font-size: 11px; min-height: 13px; filter: drop-shadow(0 1px 1px #000); } .arena .un-efs span { background: rgba(10,5,16,.7); border-radius: 4px; padding: 0 2px; line-height: 13px; }
.arena .tb-topo { position: absolute; left: 0; right: 0; top: 0; display: flex; align-items: flex-start; gap: 8px; padding: 6px 10px; pointer-events: none; z-index: 40; }
.arena .tb-topo > * { pointer-events: auto; } .arena .tb-tit { flex: 1; min-width: 0; text-shadow: 0 1px 4px #000; } .arena .tb-tit b { display: block; font: 700 clamp(15px, 3.4vh, 22px) Georgia, serif; } .arena .tb-tit small { opacity: .9; }
.arena .tb-ordem { display: flex; gap: 4px; justify-content: center; position: absolute; left: 50%; top: 6px; transform: translateX(-50%); } .arena .tb-ordem span { width: clamp(26px, 6.5vh, 40px); height: clamp(26px, 6.5vh, 40px); border-radius: 6px; transform: rotate(45deg) scale(.8); background: rgba(20,12,30,.8) center / 130% no-repeat; border: 2px solid #60a5fa; overflow: hidden; } .arena .tb-ordem span.i { border-color: #fb7185; } .arena .tb-ordem span.cur { border-color: #ffd58c; box-shadow: 0 0 8px #ffd58c; transform: rotate(45deg) scale(1); }
.arena .tb-ordem span img { width: 100%; height: 100%; object-fit: contain; transform: rotate(-45deg) scale(1.3); }
.arena .tb-btns { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; } .arena .tb-btns button { min-height: 32px; padding: 3px 12px; font-size: 12px; border: 1px solid #b89a6b; border-radius: 7px; background: rgba(33,19,41,.85); color: #fff3e7; } .arena .tb-btns button.on { background: #f3a458; color: #21110c; }
.arena .tb-fila { position: absolute; left: 50%; transform: translateX(-50%); top: clamp(46px, 13vh, 64px); display: none; align-items: center; gap: 4px; padding: 3px 8px; background: rgba(20,12,30,.8); border: 1px solid #6b4a52; border-radius: 8px; z-index: 40; } .arena .tb-fila img { width: clamp(24px, 7vh, 38px); height: clamp(24px, 7vh, 38px); object-fit: contain; }
.arena .tb-base { position: absolute; left: 0; right: 0; bottom: 0; display: flex; align-items: center; gap: 10px; padding: 6px 10px calc(6px + env(safe-area-inset-bottom, 0px)); background: linear-gradient(transparent, rgba(12,6,18,.85) 40%); z-index: 40; }
.arena .tb-ativo { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 0 1 28%; } .arena .tb-ativo img { width: clamp(34px, 11vh, 56px); height: clamp(34px, 11vh, 56px); object-fit: contain; } .arena .tb-ativo b { display: block; font: 700 clamp(14px, 3.4vh, 20px) Georgia, serif; } .arena .tb-ativo small { display: block; opacity: .9; }
.arena .tb-hab { display: flex; gap: 6px; flex: 1; justify-content: flex-end; } .arena .tb-hab button { position: relative; flex: 0 1 clamp(78px, 17vw, 150px); min-height: clamp(44px, 14vh, 64px); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; padding: 3px 5px; border: 1px solid #8e6dbd; border-radius: 9px; background: linear-gradient(#3a2750, #241633); color: #fff3e7; font-size: clamp(10px, 2.6vh, 13px); line-height: 1.15; }
.arena .tb-hab button.basico { border-color: #8f8aa8; flex-basis: clamp(60px, 12vw, 100px); } .arena .tb-hab button i { font-style: normal; font-size: clamp(14px, 4vh, 20px); } .arena .tb-hab button small { opacity: .85; font-size: 9.5px; }
.arena .tb-hab button.dest { background: linear-gradient(#f3d9a4, #c8924a); color: #2a1608; border-color: #ffe2a8; } .arena .tb-hab button:disabled { opacity: .4; filter: grayscale(.6); } .arena .tb-hab button .rc { position: absolute; top: 2px; right: 4px; font-weight: 800; color: #fda4af; }
.arena .tb-aguarde { opacity: .8; font-size: 12px; margin-left: auto; }
.arena .tb-fim { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; background: rgba(13,7,19,.78); font-size: 20px; z-index: 60; text-align: center; padding: 20px; }`;
let cssOk = false;
const injetar = () => { if (cssOk) return; cssOk = true; const s = document.createElement('style'); s.textContent = CSS; document.head.append(s); };
const arteRaiz = (esp, arte) => arte?.[esp] || ARTE_DA_ESPECIE[esp] || `assets/monsters/${String(esp).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}/sprite-front.png`;
const caminho = (esp, arte) => `../../../${arteRaiz(esp, arte)}`;

function spriteNoCampo(u, artes) {
  const original = arteRaiz(u.especie, artes);
  const perfil = PERFIS_NO_CAMPO[original];
  const direcao = perfil?.direcao ?? olhaDe(u.especie);
  const desejada = u.lado === 'a' ? 'direita' : 'esquerda';
  return {
    src: `../../../${perfil?.arquivo ?? original}`,
    espelhar: direcao !== 'frente' && direcao !== desejada,
  };
}

export function criarArena(host, { artes = {} } = {}) {
  injetar(); window.__recortar = recortar; host.classList.add('arena');
  host.innerHTML = '<div class="tb-campo"></div><div class="tb-topo"><div class="tb-tit"></div><div class="tb-ordem"></div><div class="tb-btns"></div></div><div class="tb-fila"></div><div class="tb-base"></div><div class="tb-sobre"></div>';
  const campo = host.querySelector('.tb-campo'), q = (s) => host.querySelector(s);
  let b = null, nos = new Map(), hpVis = new Map(), pend = new Set(), alvoSel = null, ocupadoAte = 0, ultimoEv = null, rapido = false, opArt = artes, lastSig = '';
  const no = (id) => nos.get(id)?.el;
  const sigDe = (u) => `${u.lado}:${u.id}`;
  function vagaDe(u) { const lista = u.lado === 'a' ? b.aliados : b.inimigos; return Math.max(0, lista.indexOf(u)); }
  function criarNo(u, entrando) {
    const [x, y] = SLOT[u.lado][vagaDe(u)] || SLOT[u.lado][0];
    const sprite = spriteNoCampo(u, opArt);
    const el = document.createElement('button'); el.className = `un ${u.lado}${entrando ? ' entrando' : ''}`; el.dataset.un = u.id; el.style.cssText = `left:${x}%;top:${y}%;z-index:${Math.round(y)}`;
    el.innerHTML = `<span class="un-sombra"></span><span class="un-fig"><img src="${sprite.src}" ${sprite.espelhar ? 'style="transform:scaleX(-1)"' : ''} alt="${esc(u.especie)}" onload="window.__recortar && window.__recortar(this)" onerror="this.style.visibility='visible'"></span><span class="un-hud"><span class="un-lin"><b class="un-nv">${u.nivel}</b><span class="un-hp"><i style="width:100%"></i></span></span><span class="un-efs"></span></span>`;
    campo.append(el); nos.set(u.id, { el, u }); hpVis.set(u.id, u.hp);
    if (entrando) setTimeout(() => el.classList.remove('entrando'), 800);
  }
  const aplicarHp = (id) => { pend.delete(id); const n = nos.get(id); if (!n) return; hpVis.set(id, n.u.hp); pintar(n); };
  function pintar(n) {
    const u = n.u, hp = hpVis.get(u.id) ?? u.hp; n.el.querySelector('.un-hp i').style.width = `${Math.max(0, Math.round(hp / u.hpMax * 100))}%`;
    n.el.querySelector('.un-efs').innerHTML = Object.entries(u.efeitos || {}).map(([id, e]) => `<span title="${esc(EFEITOS[id]?.nome || id)}">${(EFEITOS[id]?.icone || '').slice(0, 2)}<small>${e.turnos}</small></span>`).join('');
    const morto = u.hp <= 0 && !pend.has(u.id); n.el.classList.toggle('morto', morto);
  }
  function montar(nova) {
    b = nova; campo.querySelectorAll('.un').forEach((e) => e.remove()); nos = new Map(); hpVis = new Map(); pend = new Set(); alvoSel = null;
    [...b.aliados, ...b.inimigos].forEach((u) => criarNo(u, false)); if (b.evento) b.evento.mostrado = true;
  }
  function atualizar(nova, op = {}) {
    opArt = op.artes || opArt;
    if (nova !== b) montar(nova);
    rapido = Boolean(op.auto);
    if (op.arena) campo.style.backgroundImage = `url('../../../${op.arena}')`;
    // unidades novas (reforços) entram na vaga; as demais só atualizam
    for (const u of [...b.aliados, ...b.inimigos]) if (!nos.has(u.id)) criarNo(u, true);
    const ev = b.evento; const novoEv = ev && !ev.mostrado;
    if (novoEv) { ev.mostrado = true; for (const r of ev.alvos || []) pend.add(r.id); for (const x of ev.antes || []) if (x.alvo) pend.add(x.alvo); if (ev.hab?.tipo === 'cura' || ev.hab?.tipo === 'apoio') pend.add(ev.ator); }
    const atual = b.fim ? null : atorAtualSemEfeito(b);
    for (const n of nos.values()) { if (!pend.has(n.u.id)) hpVis.set(n.u.id, n.u.hp); pintar(n); n.el.classList.toggle('vez', Boolean(atual) && n.u === atual); n.el.classList.toggle('alvo', alvoSel === n.u.id); }
    desenharTopo(op, atual); desenharBase(op, atual);
    if (novoEv) tocar(ev);
    return novoEv ? duracaoEstimada(ev, rapido) : 0;
  }
  // atorAtual pode registrar turnos perdidos; aqui só lemos o primeiro vivo da fila sem avançar o motor
  function atorAtualSemEfeito(bt) { const id = bt.fila[0]; return bt.ordem.find((x) => x.id === id && x.hp > 0) || bt.ordem.find((x) => x.hp > 0 && x.lado === 'a'); }
  async function tocar(ev) {
    const t0 = performance.now(), est = duracaoEstimada(ev, rapido); ocupadoAte = t0 + est;
    const ctx = criarCtx({ arena: host, campo, no, aplicarHp, rapido });
    try { await tocarEvento(ctx, ev); } catch (e) { console.warn('vfx', e); }
    for (const n of nos.values()) { pend.delete(n.u.id); hpVis.set(n.u.id, n.u.hp); pintar(n); }
    if (ev.reforco) { /* o nó do reforço já foi criado por atualizar() */ }
    ocupadoAte = performance.now();
  }
  function desenharTopo(op, atual) {
    q('.tb-tit').innerHTML = `<b>${esc(op.titulo || '')}</b><small>${esc(op.sub || '')}${op.sub ? ' · ' : ''}Turno ${b.rodada}</small>`;
    q('.tb-btns').innerHTML = `<button data-auto="1" class="${op.auto ? 'on' : ''}">Auto</button>${op.extraTopo || ''}`;
    const prox = [...b.fila].map((id) => b.ordem.find((x) => x.id === id)).filter((u) => u && u.hp > 0).slice(0, 5);
    q('.tb-ordem').innerHTML = prox.map((u, i) => `<span class="${u.lado === 'a' ? '' : 'i'} ${i === 0 ? 'cur' : ''}"><img src="${caminho(u.especie, opArt)}" alt=""></span>`).join('');
    const f = q('.tb-fila'); f.style.display = b.esperaI.length ? 'flex' : 'none'; f.innerHTML = `Fila +${b.esperaI.length} ${b.esperaI.map((u) => `<img src="${caminho(u.especie, opArt)}" alt="">`).join('')}`;
  }
  function desenharBase(op, atual) {
    const base = q('.tb-base'); if (b.fim) { base.innerHTML = ''; return; }
    const u = atual && atual.lado === 'a' ? atual : null, manual = Boolean(u) && !op.auto;
    if (!atual) { base.innerHTML = ''; return; }
    const ativo = `<div class="tb-ativo"><img src="${caminho((u || atual).especie, opArt)}" alt=""><div><b>${esc((u || atual).especie)}</b><small>${(u || atual).hp} / ${(u || atual).hpMax} HP</small></div></div>`;
    if (!u) { base.innerHTML = ativo + `<span class="tb-aguarde">${atual.lado === 'i' ? 'Turno do inimigo…' : 'Atacando automaticamente…'}</span>`; return; }
    const btn = (h, i) => { const rc = u.cd?.[i] || 0, bloq = rc > 0 || Object.keys(u.efeitos || {}).includes('silencio'); return `<button data-hab="${i}" ${manual && !bloq ? '' : 'disabled'} class="${!bloq && i === 1 ? 'dest' : ''}" title="${esc(h.nome)}"><i>${h.icone || '✨'}</i>${esc(h.nome)}<small>⟳ recarga ${h.cd}${rc ? ` · aguarde ${rc}` : ''}</small>${rc ? `<span class="rc">${rc}</span>` : ''}</button>`; };
    base.innerHTML = ativo + `<div class="tb-hab"><button data-acao="atacar" class="basico" ${manual ? '' : 'disabled'}><i>⚔️</i>Atacar<small>sem recarga</small></button>${u.kit.map(btn).join('')}<button data-acao="defender" class="basico" ${manual ? '' : 'disabled'}><i>🛡️</i>Defender<small>sem recarga</small></button></div>`;
  }
  function fim(html) { q('.tb-sobre').innerHTML = html ? `<div class="tb-fim">${html}</div>` : ''; }
  return { atualizar, montar, fim, alvo: () => alvoSel, definirAlvo: (id) => { alvoSel = alvoSel === id ? null : id; for (const n of nos.values()) n.el.classList.toggle('alvo', alvoSel === n.u.id); }, limparAlvo: () => { alvoSel = null; }, ocupada: () => performance.now() < ocupadoAte, restante: () => Math.max(0, ocupadoAte - performance.now()), campo, raiz: host };
}

// ---------- overlay completo (missões e capítulos) ----------
export function criarTelaBatalha() {
  const el = document.createElement('div'); el.id = 'tela-batalha'; el.style.cssText = 'position:fixed;inset:0;z-index:58;display:none'; document.body.append(el);
  const rng = criarRng(Date.now() % 100000); let b = null, cfg = null, timer = null, auto = true, arena = null, minimizada = false;
  const extra = '<button data-fugir="1">Fugir</button>';
  const titulo = () => ({ titulo: cfg.titulo, sub: cfg.sub || '', auto, extraTopo: extra, arena: cfg.arena, artes: cfg.artes });
  function render() { return arena.atualizar(b, titulo()); }
  function agendar(delay) { clearTimeout(timer); timer = setTimeout(passo, delay); }
  function passo() {
    if (!b || b.fim) return;
    const u = atorAtual(b); if (!u) { render(); if (b.fim) terminar(); return; }
    if (u.lado === 'i' || auto) { executar(b, decidir(b, u, rng), rng); const d = render(); if (b.fim) { setTimeout(terminar, d + 350); return; } agendar((cfg.ritmo || 380) + d + 120); }
    else { render(); agendar(300); }
  }
  function terminar() { arena.fim(`<b>${b.fim === 'vitoria' ? '🏆 Vitória!' : '💀 Derrota'}</b><button class="btn-pri" data-continuar="1">Continuar</button>`); }
  function abrir(c) {
    cfg = c; auto = c.auto !== false; el.style.display = 'block'; arena = criarArena(el, { artes: c.artes });
    const papeis = c.papeis || {};
    const al = c.aliados.slice(0, 6).map((m, i) => criarUnidade({ id: `a${i}`, especie: m.especie, nivel: m.nivel || 1, lado: 'a', papeis, bonus: c.bonus || {} }));
    const ini = c.inimigos.slice(0, 6).map(([esp, nv], i) => criarUnidade({ id: `i${i}`, especie: esp, nivel: nv, lado: 'i', papeis }));
    b = criarBatalha(al, ini); b.log.push(`${c.titulo}: ${ini.length} inimigo(s).`); arena.montar(b); render(); agendar(700);
  }
  function fechar(venceu) { clearTimeout(timer); const frac = b ? b.ordem.filter((u) => u.lado === 'a').reduce((a, u) => a + Math.max(0, u.hp), 0) / Math.max(1, b.ordem.filter((u) => u.lado === 'a').reduce((a, u) => a + u.hpMax, 0)) : 1; el.style.display = 'none'; el.innerHTML = ''; const f = cfg?.onFim; b = null; f?.(venceu, frac); }
  function encerrarSilencioso() { clearTimeout(timer); el.style.display = 'none'; el.innerHTML = ''; b = null; }
  el.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t || !b) return;
    if (t.dataset.auto) { auto = !auto; render(); if (auto) agendar(200); return; }
    if (t.dataset.fugir) { fechar(false); return; }
    if (t.dataset.continuar) { fechar(b.fim === 'vitoria'); return; }
    if (t.dataset.un) { const u = b.ordem.find((x) => x.id === t.dataset.un); if (u?.hp > 0 && u.lado === 'i') arena.definirAlvo(u.id); return; }
    const u = atorAtual(b); if (!u || u.lado !== 'a' || arena.ocupada()) return;
    if (t.dataset.hab !== undefined) executar(b, { tipo: 'habilidade', idx: Number(t.dataset.hab), alvo: arena.alvo() || undefined }, rng);
    else if (t.dataset.acao) executar(b, { tipo: t.dataset.acao, alvo: arena.alvo() || undefined }, rng);
    else return;
    arena.limparAlvo(); const d = render(); if (b.fim) setTimeout(terminar, d + 350); else agendar(d + 250);
  });
  return { abrir, aberta: () => el.style.display === 'block', batalha: () => b, fechar, encerrarSilencioso, minimizada };
}
