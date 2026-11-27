// Motor de partículas e formas do VFX de batalha (Canvas 2D). Duas camadas por arena: "chão" (abaixo dos Oníricos: círculos mágicos,
// luz no solo, rachaduras) e "frente" (acima: cortes, feixes, explosões, faíscas). Brilho por mistura aditiva ('lighter'), sprites de
// brilho pré-renderizados por cor e um único requestAnimationFrame que dorme quando não há nada vivo. Em celular, menos partículas.
const TAU = Math.PI * 2;
export const R = (a, b) => a + Math.random() * (b - a);
const easeOut = (u) => 1 - (1 - u) * (1 - u) * (1 - u);
const easeIn = (u) => u * u * u;
const brilhoCache = new Map();
// Sprite de brilho radial (núcleo claro → cor → transparente)
function brilho(cor, nucleo = '#ffffff') {
  const k = cor + nucleo; let c = brilhoCache.get(k); if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, nucleo); gr.addColorStop(0.18, nucleo); gr.addColorStop(0.42, cor); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); brilhoCache.set(k, c); return c;
}
const alfa = (cor, a) => { if (cor.startsWith('#') && cor.length === 7) return cor + Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0'); return cor; };

export function camada(ctx) {
  const campo = ctx.campo; let m = campo._fx;
  if (!m || !m.frente.isConnected) { m = criarMotor(campo); campo._fx = m; }
  m.ajustar(); m.dens = ctx.dens; m.k = ctx.k; return m;
}

function criarMotor(campo) {
  const mk = (z) => { const c = document.createElement('canvas'); c.className = 'fx-cv'; c.style.cssText = `position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:${z}`; campo.append(c); return c; };
  const chao = mk(4), frente = mk(86), gc = chao.getContext('2d'), gf = frente.getContext('2d');
  const itens = []; let raf = 0, ult = 0, w = 1, h = 1, dpr = 1;
  const M = { chao, frente, dens: 1, k: 1, itens };
  M.ajustar = () => {
    const m = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
    dpr = Math.min(m ? 1.5 : 2, window.devicePixelRatio || 1); w = campo.clientWidth || 1; h = campo.clientHeight || 1;
    for (const c of [chao, frente]) { const W = Math.round(w * dpr), H = Math.round(h * dpr); if (c.width !== W || c.height !== H) { c.width = W; c.height = H; } }
    M.w = w; M.h = h;
  };
  function quadro(t) {
    const dt = Math.min(0.05, (t - (ult || t)) / 1000); ult = t;
    for (const g of [gc, gf]) { g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); }
    for (let i = itens.length - 1; i >= 0; i--) {
      const it = itens[i]; it.t += dt;
      if (it.t >= it.vida) { itens.splice(i, 1); it.fim?.(); continue; }
      if (it.t < 0) continue;
      const g = it.chao ? gc : gf; g.save(); g.globalCompositeOperation = it.blend || 'lighter'; g.globalAlpha = 1;
      try { it.draw(g, it.t / it.vida, dt, it); } catch (e) { it.t = it.vida; }
      g.restore();
    }
    if (itens.length) raf = requestAnimationFrame(quadro); else { raf = 0; ult = 0; for (const g of [gc, gf]) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, chao.width, chao.height); } }
  }
  // item: { vida (s), atraso (s), chao, blend, draw(g, u, dt, it) }
  M.add = (it) => { it.vida = Math.max(0.016, (it.vida ?? 0.6) * M.k); it.t = -(it.atraso || 0) * M.k; itens.push(it); if (!raf && campo.isConnected) raf = requestAnimationFrame(quadro); return it; };
  M.n = (n) => Math.max(1, Math.round(n * M.dens));
  return M;
}

// Caveira (brilho + crânio + olhos acesos), desenhada na origem
export function desenhaCaveira(g, s, cor, cor2) {
  g.globalCompositeOperation = 'lighter'; g.drawImage(brilho(cor), -s * 1.8, -s * 1.8, s * 3.6, s * 3.6); g.globalCompositeOperation = 'source-over'; g.fillStyle = cor2; g.beginPath(); g.arc(0, -s * 0.15, s * 0.62, 0, TAU); g.fill(); g.fillRect(-s * 0.36, s * 0.2, s * 0.72, s * 0.42);
  g.fillStyle = '#0b0614'; g.beginPath(); g.ellipse(-s * 0.24, -s * 0.12, s * 0.17, s * 0.21, 0, 0, TAU); g.ellipse(s * 0.24, -s * 0.12, s * 0.17, s * 0.21, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(0, s * 0.05); g.lineTo(-s * 0.08, s * 0.2); g.lineTo(s * 0.08, s * 0.2); g.fill(); for (let k = -1; k <= 1; k++) g.fillRect(k * s * 0.18 - s * 0.03, s * 0.36, s * 0.06, s * 0.26);
  g.globalCompositeOperation = 'lighter'; g.fillStyle = cor; g.beginPath(); g.arc(-s * 0.24, -s * 0.1, s * 0.07, 0, TAU); g.arc(s * 0.24, -s * 0.1, s * 0.07, 0, TAU); g.fill();
}
// ---------- partículas ----------
// forma: brilho | faisca | brasa | fumaca | petala | folha | caco | estrela | bolha | pena | gota | neve | anel
export function particula(M, o) {
  const p = { x: o.x, y: o.y, vx: o.vx || 0, vy: o.vy || 0, rot: o.rot ?? R(0, TAU), vrot: o.vrot ?? R(-6, 6) };
  const ax = o.ax || 0, ay = o.grav || 0, atrito = o.atrito ?? 1.6, tam = o.tam || 6, tamFim = o.tamFim ?? tam * 0.2, cor = o.cor || '#fff', cor2 = o.cor2 || '#fff', forma = o.forma || 'brilho';
  const fadeIn = o.fadeIn ?? 0.08, pulsar = o.pulsar || 0;
  return M.add({ vida: o.vida || 0.7, atraso: o.atraso, chao: o.chao, blend: forma === 'fumaca' || forma === 'petala' || forma === 'folha' || forma === 'pena' ? (o.blend || 'source-over') : o.blend, draw(g, u, dt) {
    const f = Math.exp(-atrito * dt); p.vx = (p.vx + ax * dt) * f; p.vy = (p.vy + ay * dt) * f; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vrot * dt;
    if (o.onda) p.x += Math.sin(u * o.onda * TAU) * (o.ondaAmp || 1);
    let a = u < fadeIn ? u / fadeIn : 1 - easeIn((u - fadeIn) / (1 - fadeIn)); a *= o.alfa ?? 1; if (pulsar) a *= 0.6 + 0.4 * Math.sin(u * pulsar * TAU);
    const s = tam + (tamFim - tam) * u; g.globalAlpha = Math.max(0, a);
    if (forma === 'brilho' || forma === 'brasa' || forma === 'neve') { const ss = forma === 'brasa' ? s * (0.8 + Math.random() * 0.4) : s; g.drawImage(brilho(cor, forma === 'brasa' ? cor2 : '#fff'), p.x - ss, p.y - ss, ss * 2, ss * 2); }
    else if (forma === 'faisca') { const v = Math.hypot(p.vx, p.vy) || 1, L = Math.min(o.compr || 40, v * 0.05 + s * 2); g.strokeStyle = cor; g.lineCap = 'round'; g.lineWidth = s * 0.5; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - (p.vx / v) * L, p.y - (p.vy / v) * L); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = s * 0.2; g.stroke(); }
    else if (forma === 'fumaca') { const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, s); gr.addColorStop(0, alfa(cor, 0.55)); gr.addColorStop(1, alfa(cor, 0)); g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, s, 0, TAU); g.fill(); }
    else if (forma === 'petala' || forma === 'folha' || forma === 'pena') { g.translate(p.x, p.y); g.rotate(p.rot); g.scale(1, 0.4 + 0.6 * Math.abs(Math.sin(p.rot * 1.3))); const gr = g.createLinearGradient(-s, 0, s, 0); gr.addColorStop(0, cor); gr.addColorStop(1, cor2); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, s, s * (forma === 'pena' ? 0.28 : 0.45), 0, 0, TAU); g.fill(); if (forma !== 'petala') { g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-s, 0); g.lineTo(s, 0); g.stroke(); } }
    else if (forma === 'caco') { g.translate(p.x, p.y); g.rotate(p.rot); const gr = g.createLinearGradient(0, -s, 0, s); gr.addColorStop(0, cor2); gr.addColorStop(1, cor); g.fillStyle = gr; g.beginPath(); g.moveTo(0, -s); g.lineTo(s * 0.45, 0); g.lineTo(0, s * 0.9); g.lineTo(-s * 0.4, 0); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 0.8; g.stroke(); }
    else if (forma === 'estrela') { g.translate(p.x, p.y); g.rotate(p.rot * 0.2); const k = s * (0.7 + 0.3 * Math.sin(u * 18)); g.drawImage(brilho(cor), -k * 0.8, -k * 0.8, k * 1.6, k * 1.6); g.fillStyle = '#fff'; g.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? k * 0.14 : k * 1.4, an = (i * TAU) / 8; g.lineTo(Math.cos(an) * r, Math.sin(an) * r); } g.closePath(); g.fill(); }
    else if (forma === 'bolha') { g.strokeStyle = cor; g.lineWidth = 1.4; g.beginPath(); g.arc(p.x, p.y, s, 0, TAU); g.stroke(); g.fillStyle = alfa(cor, 0.18); g.fill(); g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(p.x - s * 0.35, p.y - s * 0.35, s * 0.22, 0, TAU); g.fill(); }
    else if (forma === 'gota') { g.translate(p.x, p.y); g.rotate(Math.atan2(p.vy, p.vx) - Math.PI / 2); g.fillStyle = cor; g.beginPath(); g.moveTo(0, -s * 1.6); g.quadraticCurveTo(s, 0, 0, s); g.quadraticCurveTo(-s, 0, 0, -s * 1.6); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(-s * 0.25, 0, s * 0.22, 0, TAU); g.fill(); }
    else if (forma === 'morcego') { const bat = Math.sin(u * (o.bate || 26) * TAU / 4) ; g.globalCompositeOperation = 'source-over'; g.translate(p.x, p.y); g.scale(p.vx < 0 ? -1 : 1, 1); g.fillStyle = cor; g.beginPath(); g.ellipse(0, 0, s * 0.32, s * 0.42, 0, 0, TAU); g.fill();
      for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * s * 0.2, -s * 0.1); g.quadraticCurveTo(k * s * 0.9, -s * (0.9 * bat + 0.2), k * s * 1.5, -s * 0.2 * bat); g.lineTo(k * s * 1.15, s * 0.1); g.lineTo(k * s * 0.95, -s * 0.05); g.lineTo(k * s * 0.7, s * 0.2); g.lineTo(k * s * 0.45, s * 0.02); g.closePath(); g.fill(); }
      g.beginPath(); g.moveTo(-s * 0.22, -s * 0.3); g.lineTo(-s * 0.12, -s * 0.62); g.lineTo(-s * 0.02, -s * 0.34); g.moveTo(s * 0.22, -s * 0.3); g.lineTo(s * 0.12, -s * 0.62); g.lineTo(s * 0.02, -s * 0.34); g.fill();
      g.globalCompositeOperation = 'lighter'; g.fillStyle = cor2; g.fillRect(s * 0.06, -s * 0.18, s * 0.1, s * 0.07); g.fillRect(-s * 0.16, -s * 0.18, s * 0.1, s * 0.07); }
    else if (forma === 'caveira') { g.translate(p.x, p.y); g.rotate(Math.sin(p.rot) * 0.3); desenhaCaveira(g, s, cor, cor2); }
    else if (forma === 'abobora') { g.translate(p.x, p.y); g.rotate(Math.sin(p.rot) * 0.4); g.drawImage(brilho('#f97316'), -s * 1.6, -s * 1.6, s * 3.2, s * 3.2); g.globalCompositeOperation = 'source-over'; for (const [dx, w, c] of [[-0.45, 0.5, '#c2410c'], [0.45, 0.5, '#c2410c'], [0, 0.62, '#ea580c']]) { g.fillStyle = c; g.beginPath(); g.ellipse(dx * s, 0, w * s, s * 0.78, 0, 0, TAU); g.fill(); }
      g.fillStyle = '#3f6212'; g.fillRect(-s * 0.08, -s * 1.02, s * 0.16, s * 0.3); g.globalCompositeOperation = 'lighter'; g.fillStyle = '#fde047'; const tri = (x, y, k) => { g.beginPath(); g.moveTo(x - k, y + k * 0.7); g.lineTo(x + k, y + k * 0.7); g.lineTo(x, y - k * 0.6); g.fill(); }; tri(-s * 0.3, -s * 0.2, s * 0.17); tri(s * 0.3, -s * 0.2, s * 0.17);
      g.beginPath(); g.moveTo(-s * 0.5, s * 0.18); for (let k = 0; k <= 6; k++) g.lineTo(-s * 0.5 + (k * s) / 6, s * (k % 2 ? 0.28 : 0.42)); g.lineTo(s * 0.5, s * 0.18); g.quadraticCurveTo(0, s * 0.62, -s * 0.5, s * 0.18); g.fill(); }
    else if (forma === 'cruz') { g.translate(p.x, p.y); g.drawImage(brilho(cor), -s * 1.4, -s * 1.4, s * 2.8, s * 2.8); g.fillStyle = '#fff'; g.fillRect(-s * 0.16, -s * 0.6, s * 0.32, s * 1.2); g.fillRect(-s * 0.6, -s * 0.16, s * 1.2, s * 0.32); }
    else if (forma === 'anel') { g.strokeStyle = cor; g.lineWidth = Math.max(0.5, s * 0.25); g.beginPath(); g.arc(p.x, p.y, s, 0, TAU); g.stroke(); }
  } });
}
// Explosão radial de partículas
export function rajada(M, x, y, o = {}) {
  const n = M.n(o.n ?? 16);
  for (let i = 0; i < n; i++) {
    const a = o.ang != null ? o.ang + R(-(o.abre ?? Math.PI), o.abre ?? Math.PI) : R(0, TAU), v = R(o.vMin ?? (o.v ?? 260) * 0.35, o.v ?? 260);
    particula(M, { ...o, x: x + R(-(o.esp || 0), o.esp || 0), y: y + R(-(o.esp || 0), o.esp || 0) * 0.6, vx: Math.cos(a) * v, vy: Math.sin(a) * v * (o.achata ?? 0.75) - (o.sobe || 0), tam: (o.tam || 6) * R(0.6, 1.3), vida: (o.vida || 0.7) * R(0.75, 1.25), atraso: (o.atraso || 0) + R(0, o.espalhaT || 0) });
  }
}
// Partículas que convergem para um ponto (carga de energia)
export function convergir(M, x, y, o = {}) {
  const n = M.n(o.n ?? 18), raio = o.raio ?? 90, vida = o.vida ?? 0.5;
  for (let i = 0; i < n; i++) { const a = R(0, TAU), d = R(raio * 0.6, raio); particula(M, { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.8, vx: (-Math.cos(a) * d) / vida * 1.25, vy: (-Math.sin(a) * d * 0.8) / vida * 1.25, atrito: 1.2, forma: o.forma || 'faisca', cor: o.cor, tam: o.tam || 4, tamFim: 1, vida: vida * R(0.8, 1), atraso: R(0, (o.espalhaT ?? 0.25)), fadeIn: 0.3 }); }
}

// ---------- formas ----------
// Onda de choque elíptica (no chão por padrão)
export function onda(M, x, y, o = {}) {
  const r0 = o.r0 ?? 10, r1 = o.r1 ?? 140, esp = o.esp ?? 6, cor = o.cor || '#fff', ach = o.achata ?? 0.42;
  return M.add({ vida: o.vida || 0.55, atraso: o.atraso, chao: o.chao ?? true, draw(g, u) {
    const e = easeOut(u), r = r0 + (r1 - r0) * e, a = 1 - u;
    g.translate(x, y); g.scale(1, ach);
    g.globalAlpha = a * 0.45; g.strokeStyle = cor; g.lineWidth = esp * 3 * (1 - e * 0.6); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
    g.globalAlpha = a; g.lineWidth = esp * (1 - e * 0.7); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
    g.globalAlpha = a * 0.9; g.strokeStyle = '#fff'; g.lineWidth = Math.max(0.6, esp * 0.3 * (1 - e)); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
  } });
}
// Luz difusa (no chão ou no ar)
export function luz(M, x, y, o = {}) {
  const raio = o.raio ?? 120, cor = o.cor || '#fff', forca = o.forca ?? 0.8, ach = o.achata ?? (o.chao === false ? 1 : 0.38);
  return M.add({ vida: o.vida || 0.8, atraso: o.atraso, chao: o.chao ?? true, draw(g, u) {
    const a = (u < 0.2 ? u / 0.2 : 1 - (u - 0.2) / 0.8) * forca, s = raio * (0.6 + 0.5 * easeOut(u));
    g.globalAlpha = Math.max(0, a); g.translate(x, y); g.scale(1, ach); g.drawImage(brilho(cor, o.nucleo || cor), -s, -s, s * 2, s * 2);
  } });
}
// Corte em meia-lua (lâmina de anime): varre o arco e depois se dissolve
export function corte(M, x, y, o = {}) {
  const raio = o.raio ?? 70, abre = o.abre ?? 2.4, ang = o.ang ?? -0.6, esp = o.esp ?? 14, cor = o.cor || '#a78bfa', sentido = o.sentido ?? 1, ach = o.achata ?? 0.55;
  return M.add({ vida: o.vida || 0.36, atraso: o.atraso, draw(g, u) {
    const varre = Math.min(1, u / 0.45), some = u < 0.45 ? 1 : 1 - (u - 0.45) / 0.55, N = 26;
    const a0 = ang - (abre / 2) * sentido, a1 = a0 + abre * varre * sentido, ini = a0 + abre * Math.max(0, varre - 0.85 - (1 - some)) * sentido;
    g.translate(x, y); g.rotate(o.rot || 0); g.scale(1, ach);
    const camada = (larg, estilo, al) => { g.globalAlpha = al; g.fillStyle = estilo; g.beginPath();
      for (let i = 0; i <= N; i++) { const t = i / N, a = ini + (a1 - ini) * t; g.lineTo(Math.cos(a) * (raio + larg * 0.25), Math.sin(a) * (raio + larg * 0.25)); }
      for (let i = N; i >= 0; i--) { const t = i / N, a = ini + (a1 - ini) * t, th = larg * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (0.4 + 0.6 * t); g.lineTo(Math.cos(a) * (raio - th), Math.sin(a) * (raio - th)); }
      g.closePath(); g.fill(); };
    camada(esp * 2.2, cor, 0.35 * some); camada(esp, cor, 0.9 * some); camada(esp * 0.45, '#ffffff', some);
  } });
}
// Feixe (laser) entre dois pontos
export function feixe(M, x0, y0, x1, y1, o = {}) {
  const larg = o.larg ?? 16, cor = o.cor || '#fde047', cor2 = o.cor2 || '#fff';
  return M.add({ vida: o.vida || 0.6, atraso: o.atraso, draw(g, u) {
    const cresce = Math.min(1, u / 0.18), fim = u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3, L = Math.hypot(x1 - x0, y1 - y0) * cresce, ang = Math.atan2(y1 - y0, x1 - x0);
    const W = larg * fim * (0.85 + Math.random() * 0.3);
    g.translate(x0, y0); g.rotate(ang); g.lineCap = 'round';
    for (const [k, c, a] of [[2.6, cor, 0.25], [1.4, cor, 0.6], [0.55, cor2, 1], [0.2, '#fff', 1]]) { g.globalAlpha = a; g.strokeStyle = c; g.lineWidth = Math.max(0.5, W * k); g.beginPath(); g.moveTo(0, 0); g.lineTo(L, 0); g.stroke(); }
    g.globalAlpha = fim; g.drawImage(brilho(cor), -W * 2, -W * 2, W * 4, W * 4); g.drawImage(brilho(cor), L - W * 2.5, -W * 2.5, W * 5, W * 5);
  } });
}
// Raio elétrico ramificado
export function relampago(M, x0, y0, x1, y1, o = {}) {
  const cor = o.cor || '#facc15', ramos = o.ramos ?? 2; let pts = null, troca = 0;
  const gerar = () => { const p = [[x0, y0]], N = 9; for (let i = 1; i < N; i++) { const t = i / N, d = Math.sin(t * Math.PI) * (o.amp ?? 26); p.push([x0 + (x1 - x0) * t + R(-d, d) * 0.4, y0 + (y1 - y0) * t + R(-d, d)]); } p.push([x1, y1]); return p; };
  return M.add({ vida: o.vida || 0.35, atraso: o.atraso, draw(g, u, dt) {
    troca -= dt; if (!pts || troca <= 0) { pts = [gerar(), ...Array.from({ length: ramos }, () => { const b = gerar(); const k = Math.floor(R(2, 6)); return b.slice(k, k + 3).map(([x, y]) => [x + R(-30, 30), y + R(-20, 20)]); })]; troca = 0.04; }
    const a = u < 0.7 ? (Math.random() < 0.85 ? 1 : 0.3) : 1 - (u - 0.7) / 0.3; g.lineJoin = 'bevel'; g.lineCap = 'round';
    pts.forEach((p, i) => { for (const [lw, c, al] of [[i ? 3 : 7, cor, 0.35], [i ? 1.5 : 3, cor, 0.9], [i ? 0.6 : 1.2, '#fff', 1]]) { g.globalAlpha = a * al; g.strokeStyle = c; g.lineWidth = lw; g.beginPath(); p.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); } });
  } });
}
// Linhas de velocidade (foco de anime) convergindo para o ponto
export function linhasFoco(M, cx, cy, o = {}) {
  const n = M.n(o.n ?? 46), cor = o.cor || '#ffffff', W = M.w, H = M.h, raioMax = Math.hypot(W, H);
  const ls = Array.from({ length: n }, () => ({ a: R(0, TAU), r: R(o.vazio ?? 0.32, 0.6), lw: R(1, o.larg ?? 4) }));
  return M.add({ vida: o.vida || 0.5, atraso: o.atraso, blend: o.blend, draw(g, u) {
    const a = u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85; g.strokeStyle = cor; g.globalAlpha = a * (o.alfa ?? 0.55);
    for (const l of ls) { const r0 = raioMax * (l.r + Math.random() * 0.06); g.lineWidth = l.lw; g.beginPath(); g.moveTo(cx + Math.cos(l.a) * r0, cy + Math.sin(l.a) * r0); g.lineTo(cx + Math.cos(l.a) * raioMax, cy + Math.sin(l.a) * raioMax); g.stroke(); }
  } });
}
// Círculo mágico no chão: anéis, runas e polígono girando
export function circulo(M, x, y, o = {}) {
  const raio = o.raio ?? 80, cor = o.cor || '#a78bfa', cor2 = o.cor2 || '#fff', lados = o.lados ?? 6, ach = o.achata ?? 0.38;
  return M.add({ vida: o.vida || 1.2, atraso: o.atraso, chao: o.chao ?? true, draw(g, u) {
    const ap = Math.min(1, u / 0.2), a = u < 0.75 ? ap : 1 - (u - 0.75) / 0.25, s = raio * (0.5 + 0.5 * easeOut(ap)), giro = u * (o.giro ?? 2.4);
    g.translate(x, y); g.scale(1, ach); g.globalAlpha = a * 0.35; g.drawImage(brilho(cor, cor), -s * 1.3, -s * 1.3, s * 2.6, s * 2.6);
    g.globalAlpha = a; g.strokeStyle = cor; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, s, 0, TAU); g.stroke();
    g.lineWidth = 1.5; g.strokeStyle = cor2; g.beginPath(); g.arc(0, 0, s * 0.86, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, s * 0.42, 0, TAU); g.stroke();
    g.save(); g.rotate(giro); g.strokeStyle = cor; g.lineWidth = 2; for (const off of [0, Math.PI / lados]) { g.beginPath(); for (let i = 0; i <= lados; i++) { const an = off + (i * TAU) / lados; g.lineTo(Math.cos(an) * s * 0.84, Math.sin(an) * s * 0.84); } g.stroke(); }
    g.fillStyle = cor2; for (let i = 0; i < 24; i++) { const an = (i * TAU) / 24; g.fillRect(Math.cos(an) * s * 0.93 - 1.5, Math.sin(an) * s * 0.93 - 1.5, i % 3 ? 2 : 4, i % 3 ? 2 : 4); }
    g.restore(); g.save(); g.rotate(-giro * 1.6); g.setLineDash([6, 8]); g.strokeStyle = cor2; g.lineWidth = 1.2; g.beginPath(); g.arc(0, 0, s * 0.64, 0, TAU); g.stroke(); g.restore();
  } });
}
// Coluna de luz que sobe do chão
export function coluna(M, x, yPe, o = {}) {
  const larg = o.larg ?? 60, alt = o.alt ?? 260, cor = o.cor || '#fde68a';
  return M.add({ vida: o.vida || 1, atraso: o.atraso, draw(g, u) {
    const cresce = easeOut(Math.min(1, u / 0.25)), a = u < 0.6 ? 1 : 1 - (u - 0.6) / 0.4, W = larg * (1 - 0.5 * Math.max(0, u - 0.6) / 0.4), H = alt * cresce;
    const gr = g.createLinearGradient(x - W, 0, x + W, 0); gr.addColorStop(0, alfa(cor, 0)); gr.addColorStop(0.35, alfa(cor, 0.5 * a)); gr.addColorStop(0.5, `rgba(255,255,255,${0.9 * a})`); gr.addColorStop(0.65, alfa(cor, 0.5 * a)); gr.addColorStop(1, alfa(cor, 0));
    g.fillStyle = gr; g.fillRect(x - W, yPe - H, W * 2, H); const gv = g.createLinearGradient(0, yPe - H, 0, yPe - H + 60); gv.addColorStop(0, 'rgba(0,0,0,1)'); gv.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = gv; g.fillRect(x - W, yPe - H, W * 2, 60); g.globalCompositeOperation = 'lighter';
    g.globalAlpha = a; g.translate(x, yPe); g.scale(1, 0.32); g.drawImage(brilho(cor), -W * 1.8, -W * 1.8, W * 3.6, W * 3.6);
  } });
}
// Raios de luz girando (god rays)
export function raiosLuz(M, x, y, o = {}) {
  const n = o.n ?? 10, raio = o.raio ?? 220, cor = o.cor || '#fde68a';
  const rs = Array.from({ length: n }, (_, i) => ({ a: (i * TAU) / n + R(-0.2, 0.2), w: R(0.06, 0.16), l: R(0.6, 1) }));
  return M.add({ vida: o.vida || 1, atraso: o.atraso, draw(g, u) {
    const a = (u < 0.2 ? u / 0.2 : 1 - (u - 0.2) / 0.8) * (o.forca ?? 0.7); g.translate(x, y); g.rotate(u * (o.giro ?? 0.6));
    for (const r of rs) { const L = raio * r.l * (0.7 + 0.3 * easeOut(u)); const gr = g.createLinearGradient(0, 0, Math.cos(r.a) * L, Math.sin(r.a) * L); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.3, alfa(cor, a * 0.6)); gr.addColorStop(1, alfa(cor, 0)); g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(r.a - r.w) * L, Math.sin(r.a - r.w) * L); g.lineTo(Math.cos(r.a + r.w) * L, Math.sin(r.a + r.w) * L); g.closePath(); g.fill(); }
  } });
}
// Rachaduras no chão
export function rachadura(M, x, y, o = {}) {
  const n = o.n ?? 7, raio = o.raio ?? 90, cor = o.cor || '#fb923c';
  const rs = Array.from({ length: n }, () => { const a = R(0, TAU); let px = 0, py = 0; const p = [[0, 0]]; for (let i = 0; i < 5; i++) { const d = raio / 5; px += Math.cos(a + R(-0.5, 0.5)) * d; py += Math.sin(a + R(-0.5, 0.5)) * d; p.push([px, py]); } return p; });
  return M.add({ vida: o.vida || 1.1, atraso: o.atraso, chao: true, draw(g, u) {
    const cresce = easeOut(Math.min(1, u / 0.15)), a = u < 0.5 ? 1 : 1 - (u - 0.5) / 0.5; g.translate(x, y); g.scale(1, 0.4); g.lineJoin = 'round';
    for (const p of rs) { const k = Math.max(1, Math.ceil(p.length * cresce)); for (const [lw, c, al] of [[6, cor, 0.35], [2.5, cor, 0.9], [1, '#fff', 0.9]]) { g.globalAlpha = a * al; g.strokeStyle = c; g.lineWidth = lw; g.beginPath(); p.slice(0, k).forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke(); } }
  } });
}
// Projétil com cauda: chama `aoChegar` no impacto. tipo: orbe | flecha | cometa | fantasma | folhas | rocha
export function projetil(M, x0, y0, x1, y1, o = {}) {
  return new Promise((ok) => {
    setTimeout(ok, ((o.vida || 0.42) + (o.atraso || 0)) * M.k * 1000 + 400); // garantia se a aba dormir
    const cor = o.cor || '#a78bfa', cor2 = o.cor2 || '#fff', tam = o.tam ?? 16, arco = o.arco ?? 30, tipo = o.tipo || 'orbe';
    let px = x0, py = y0, lx = x0, ly = y0, acc = 0;
    M.add({ vida: o.vida || 0.42, atraso: o.atraso, fim: ok, draw(g, u, dt) {
      const e = o.ease === 'linear' ? u : u * u * (3 - 2 * u); lx = px; ly = py; px = x0 + (x1 - x0) * e; py = y0 + (y1 - y0) * e - Math.sin(e * Math.PI) * arco;
      if (o.onda) py += Math.sin(u * TAU * o.onda) * (o.ondaAmp ?? 10);
      const ang = Math.atan2(py - ly, px - lx);
      acc += dt; while (acc > 0.012) { acc -= 0.012;
        if (tipo === 'folhas') particula(M, { x: px + R(-8, 8), y: py + R(-8, 8), vx: R(-40, 40), vy: R(-40, 40), forma: 'folha', cor, cor2, tam: R(4, 7), vida: 0.4 });
        else if (tipo === 'rocha') particula(M, { x: px, y: py, vx: R(-30, 30), vy: R(-20, 20), forma: 'fumaca', cor: cor2, tam: 10, tamFim: 22, vida: 0.4 });
        else particula(M, { x: px + R(-3, 3), y: py + R(-3, 3), vx: -Math.cos(ang) * 60 + R(-30, 30), vy: -Math.sin(ang) * 60 + R(-30, 30), forma: tipo === 'cometa' ? 'brasa' : 'brilho', cor, cor2, tam: tam * (tipo === 'flecha' ? 0.35 : 0.6), tamFim: 1, vida: tipo === 'fantasma' ? 0.55 : 0.32 });
      }
      g.translate(px, py); g.rotate(ang);
      if (tipo === 'flecha') { g.globalAlpha = 1; g.drawImage(brilho(cor), -tam * 1.4, -tam * 0.7, tam * 2.8, tam * 1.4); g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-tam * 2.2, 0); g.lineTo(tam * 0.6, 0); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(tam * 1.1, 0); g.lineTo(tam * 0.3, -tam * 0.35); g.lineTo(tam * 0.3, tam * 0.35); g.fill(); }
      else if (tipo === 'rocha') { g.rotate(u * 12); g.globalCompositeOperation = 'source-over'; g.fillStyle = cor; g.beginPath(); for (let i = 0; i < 7; i++) { const an = (i * TAU) / 7, r = tam * (0.75 + ((i * 37) % 10) / 30); g.lineTo(Math.cos(an) * r, Math.sin(an) * r); } g.closePath(); g.fill(); g.strokeStyle = cor2; g.lineWidth = 1.5; g.stroke(); }
      else if (tipo === 'caveira') { g.rotate(-ang); const k = tam * (1 + 0.08 * Math.sin(u * 40)); desenhaCaveira(g, k, cor, cor2); }
      else if (tipo === 'fantasma') { const k = tam * (1 + 0.1 * Math.sin(u * 30)); g.drawImage(brilho(cor), -k * 1.6, -k * 1.6, k * 3.2, k * 3.2); g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(0, 0, k * 0.55, 0, TAU); g.fill(); g.fillStyle = '#1e1b4b'; g.beginPath(); g.arc(k * 0.15, -k * 0.18, k * 0.12, 0, TAU); g.arc(k * 0.15, k * 0.18, k * 0.12, 0, TAU); g.fill(); }
      else if (tipo !== 'folhas') { const k = tam * (1 + 0.12 * Math.sin(u * 40)); g.drawImage(brilho(cor, cor2), -k * 1.5, -k * 1.5, k * 3, k * 3); if (tipo === 'cometa') g.drawImage(brilho(cor), -k * 4, -k * 0.9, k * 4, k * 1.8); }
    } });
  });
}
// Item livre (desenho próprio)
export const livre = (M, o) => M.add(o);
export const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Recortes do Flow (folhas 4×4 em tons de cinza, fundo preto) ----------
// Extraídos de vídeos mestres do Flow; tingidos pela cor do elemento e somados à cena (blend 'lighter'), então não precisam de alfa.
// pe: altura do ponto de apoio na célula (0 = topo, 1 = base). Uma folha tingida fica em cache por cor (menor no celular).
export const RECORTES = {
  explosao: { arq: 'explosao.webp', pe: 0.5 },
  erupcao: { arq: 'erupcao.webp', pe: 0.85 },
};
const BASE_RECORTES = new URL('../../../assets/confusion/interface/vfx/recortes/', import.meta.url).href;
const imgsRecorte = {}, tingidos = new Map();
function imgRecorte(nome) {
  let im = imgsRecorte[nome];
  if (!im) { im = new Image(); im.decoding = 'async'; im.src = BASE_RECORTES + RECORTES[nome].arq; imgsRecorte[nome] = im; }
  return im.complete && im.naturalWidth ? im : null;
}
export const precarregarRecortes = () => Object.keys(RECORTES).forEach(imgRecorte);
// A camada de efeitos fica sobre a cena (canvas próprio): o brilho do recorte vira alfa, a cor vem do elemento e o núcleo clareia.
const cinzas = {};
function tingido(nome, cor) {
  const ch = `${nome}|${cor}`; if (tingidos.has(ch)) return tingidos.get(ch);
  const im = imgRecorte(nome); if (!im) return null;
  const movel = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches, L = movel ? 512 : 1024;
  const c = document.createElement('canvas'); c.width = c.height = L; const g = c.getContext('2d', { willReadFrequently: true });
  let cz = cinzas[`${nome}|${L}`];
  if (!cz) { g.drawImage(im, 0, 0, L, L); const d = g.getImageData(0, 0, L, L).data; cz = new Uint8Array(L * L); for (let i = 0; i < cz.length; i++) cz[i] = d[i * 4]; cinzas[`${nome}|${L}`] = cz; }
  const n = parseInt(cor.slice(1).padEnd(6, '0'), 16), r = (n >> 16) & 255, gr = (n >> 8) & 255, b = n & 255;
  const out = g.createImageData(L, L), o = out.data;
  for (let i = 0; i < cz.length; i++) { const v = cz[i] / 255, w = v * v * 0.75, j = i * 4; o[j] = r + (255 - r) * w; o[j + 1] = gr + (255 - gr) * w; o[j + 2] = b + (255 - b) * w; o[j + 3] = Math.min(255, cz[i] * 1.15); }
  g.putImageData(out, 0, 0);
  if (tingidos.size > 14) tingidos.delete(tingidos.keys().next().value);
  tingidos.set(ch, c); return c;
}
// Toca uma folha: tam = largura na tela; vida em s; fadeIn/fadeOut em fração da vida; ini/fim = quadros usados (0–16).
export function recorte(M, nome, x, y, o = {}) {
  const def = RECORTES[nome]; if (!def) return null;
  const ini = o.ini ?? 0, fim = o.fim ?? 16, tam = o.tam ?? 200, fo = o.fadeOut ?? 0.25, fi = o.fadeIn ?? 0, pe = o.pe ?? def.pe;
  return M.add({ vida: o.vida ?? 0.8, atraso: o.atraso, chao: Boolean(o.chao), draw(g, u) {
    const f = tingido(nome, o.cor || '#ffffff'); if (!f) return;
    const q = Math.min(fim - 1, ini + Math.floor(u * (fim - ini))), cel = f.width / 4;
    g.globalAlpha = (o.alfa ?? 1) * Math.min(1, fi ? u / fi : 1, fo ? (1 - u) / fo : 1);
    g.translate(x, y); if (o.rot) g.rotate(o.rot); if (o.espelho) g.scale(-1, 1);
    const h = tam * (o.achata ?? 1);
    g.drawImage(f, (q % 4) * cel, Math.floor(q / 4) * cel, cel, cel, -tam / 2, -h * pe, tam, h);
  } });
}
