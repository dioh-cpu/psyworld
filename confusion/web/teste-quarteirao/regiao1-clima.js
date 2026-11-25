// Clima, estação e hora do dia como efeito de tela (partículas e cor, sem arte). Lê o sistema 07 do mundo:
// sol, chuva, neve, vento e tempestade (com relâmpagos), aurora, e o tom de cada estação. A hora do dia é a fase do dia do mundo
// (suave: escurece e clareia ao longo dos 2 min de cada dia). Desliga em ambientes fechados, com Economia de Energia,
// com "reduzir movimento" do sistema, com aba escondida ou com o painel Mundo aberto.
const TONS = { outono: [255, 140, 40, 0.07], inverno: [150, 190, 255, 0.08], verao: [255, 220, 120, 0.05], primavera: [140, 255, 170, 0.03] };

export function iniciarClima({ getClima, interno, fase, desligado }) {
  const c = document.createElement('canvas');
  Object.assign(c.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3 });
  c.id = 'efeito-clima';
  document.body.append(c);
  const g = c.getContext('2d');
  let w = 0, h = 0, parts = [], tipo = null, relampago = 0, proxRelampago = 0, ultimo = 0, acc = 0;
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function medir() {
    const dpr = 1; // efeito leve: não precisa de resolução cheia
    w = c.width = Math.max(1, Math.round(innerWidth * dpr)); h = c.height = Math.max(1, Math.round(innerHeight * dpr));
  }
  addEventListener('resize', medir); medir();

  function criar(t) {
    tipo = t; parts = [];
    const n = { chuva: 130, tempestade: 240, neve: 110, vento: 36 }[t] || 0;
    for (let i = 0; i < n; i++) parts.push({ x: Math.random() * w, y: Math.random() * h, v: 0.6 + Math.random() * 0.8, r: Math.random() * 2 + 1, f: Math.random() * 6.28 });
  }

  function quadro(t) {
    requestAnimationFrame(quadro);
    if (t - ultimo < 33) return; // ~30 fps
    const dt = Math.min(0.1, (t - ultimo) / 1000); ultimo = t;
    const modal = document.querySelector('.modal-bg.aberto');
    const pare = document.hidden || modal || interno() || desligado();
    g.clearRect(0, 0, w, h);
    if (pare) return;
    const { clima, estacao, aurora } = getClima();
    // hora do dia: escurece suavemente (no máximo 18%) no fim de cada dia do mundo
    const noite = Math.max(0, Math.sin((fase() - 0.55) * Math.PI * 2 * 1.1)) * 0.18;
    const tom = TONS[estacao];
    if (tom) { g.fillStyle = `rgba(${tom[0]},${tom[1]},${tom[2]},${tom[3]})`; g.fillRect(0, 0, w, h); }
    if (noite > 0.005) { g.fillStyle = `rgba(10,20,70,${noite})`; g.fillRect(0, 0, w, h); }
    if (aurora) { const gr = g.createLinearGradient(0, 0, 0, h * 0.55); gr.addColorStop(0, 'rgba(90,255,170,.22)'); gr.addColorStop(0.5, 'rgba(150,100,255,.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h * 0.55); }
    if (reduz) return; // sem partículas animadas
    const alvo = ['chuva', 'tempestade', 'neve', 'vento'].includes(clima) ? clima : null;
    if (alvo !== tipo) criar(alvo);
    if (!alvo) return;
    if (alvo === 'chuva' || alvo === 'tempestade') {
      const forte = alvo === 'tempestade';
      g.strokeStyle = forte ? 'rgba(190,205,255,.5)' : 'rgba(180,200,255,.4)'; g.lineWidth = forte ? 1.6 : 1.2; g.beginPath();
      for (const p of parts) { g.moveTo(p.x, p.y); g.lineTo(p.x - 5, p.y + 15 * p.v); p.y += dt * (forte ? 1100 : 800) * p.v; p.x -= dt * 120 * p.v; if (p.y > h) { p.y = -20; p.x = Math.random() * (w + 100); } }
      g.stroke();
      if (forte) {
        g.fillStyle = 'rgba(20,25,60,.14)'; g.fillRect(0, 0, w, h);
        if (t > proxRelampago) { relampago = 1; proxRelampago = t + 6000 + Math.random() * 7000; }
        if (relampago > 0) { g.fillStyle = `rgba(255,255,255,${relampago * 0.45})`; g.fillRect(0, 0, w, h); relampago -= dt * 3.5; }
      }
    } else if (alvo === 'neve') {
      g.fillStyle = 'rgba(255,255,255,.8)';
      for (const p of parts) { p.f += dt; p.y += dt * 60 * p.v; p.x += Math.sin(p.f) * 18 * dt; if (p.y > h) { p.y = -5; p.x = Math.random() * w; } g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.28); g.fill(); }
    } else if (alvo === 'vento') {
      g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1; g.beginPath();
      for (const p of parts) { g.moveTo(p.x, p.y); g.lineTo(p.x + 46 * p.v, p.y + Math.sin(p.f) * 4); p.f += dt * 3; p.x += dt * 520 * p.v; if (p.x > w + 50) { p.x = -60; p.y = Math.random() * h; } }
      g.stroke();
      if (estacao === 'outono') { g.fillStyle = 'rgba(210,110,30,.7)'; for (const p of parts.slice(0, 14)) { g.beginPath(); g.ellipse(p.x, p.y + 6, 4, 2, p.f, 0, 6.28); g.fill(); } }
    }
  }
  requestAnimationFrame(quadro);
  return { canvas: c };
}
