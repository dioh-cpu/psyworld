// Tela de resultado de batalha compartilhada (Campanha Mini, Torres, Calabouços e Regiões)
// Mostra XP por Onírico da formação, itens e relíquias com moldura de raridade e botão Repetir quando permitido.
import { membrosFormacao } from './regiao1-exp-regras.js';
import { PARTES_RELIQUIA } from './regiao1-reliquias-regras.js';
import { NOME_ELEMENTO } from '../core.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const COR_RAR = {
  comum: '#94a3b8',
  incomum: '#4ade80',
  rara: '#38bdf8',
  epica: '#c084fc',
  lendaria: '#facc15',
};

const CSS_RES = `
#res-batalha-overlay{position:fixed;inset:0;background:rgba(2,6,23,.84);z-index:80;display:flex;align-items:center;justify-content:center;padding:10px}
.rb-card{width:min(490px,96vw);max-height:92vh;overflow-y:auto;background:linear-gradient(180deg,#0f2242,#09152b);border:2px solid #38bdf8;border-radius:16px;padding:14px 16px;color:#e2e8f0;display:flex;flex-direction:column;gap:10px;box-shadow:0 18px 44px rgba(0,0,0,.68);text-align:center}
.rb-card.derrota{border-color:#f87171}
.rb-estrelas{display:flex;justify-content:center;gap:10px;font-size:32px;line-height:1}
.rb-est{opacity:.22;transform:scale(.65);filter:grayscale(1)}
.rb-est.on{animation:rbEst .42s ease-out forwards}
.rb-est.d1{animation-delay:.1s}.rb-est.d2{animation-delay:.35s}.rb-est.d3{animation-delay:.6s}
@keyframes rbEst{0%{opacity:.2;transform:scale(.5) rotate(-18deg);filter:grayscale(1)}65%{opacity:1;transform:scale(1.22) rotate(6deg);filter:none}100%{opacity:1;transform:scale(1) rotate(0);filter:none}}
.rb-sec{background:#091529;border:1px solid #1e3a5f;border-radius:10px;padding:8px 10px;text-align:left}
.rb-sec-tit{font-size:11px;font-weight:800;color:#93c5fd;margin-bottom:6px;text-transform:uppercase;letter-spacing:.4px}
.rb-xp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(105px,1fr));gap:6px}
.rb-xp-card{background:#0f203b;border:1px solid #26466d;border-radius:8px;padding:5px 7px;font-size:11px;display:flex;flex-direction:column;gap:2px}
.rb-xp-card b{color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rb-xp-val{color:#86efac;font-weight:800}
.rb-premios{display:flex;flex-wrap:wrap;gap:6px}
.rb-chip{display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border-radius:8px;background:#132645;border:1px solid #335c8a;font-size:11.5px;font-weight:700;color:#f8fafc}
.rb-rel-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(135px,1fr));gap:6px;margin-top:6px}
.rb-rel{border-radius:9px;padding:6px 8px;background:#0d1c36;border:2px solid var(--cor-rar,#94a3b8);box-shadow:0 0 10px color-mix(in srgb,var(--cor-rar,#94a3b8) 28%,transparent);font-size:11px;text-align:left}
.rb-rel-rar{font-size:10px;font-weight:800;text-transform:uppercase;color:var(--cor-rar,#94a3b8)}
.rb-destaque{background:linear-gradient(135deg,rgba(180,83,9,.55),rgba(146,64,14,.35));border:1px solid #fde047;border-radius:10px;padding:7px 10px;color:#fef08a;font-size:12px;font-weight:700}
.rb-bts{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:2px}
.rb-btn{background:#122544;border:1px solid #38bdf8;color:#e0f2fe;border-radius:8px;padding:7px 13px;font-size:12px;font-weight:700;cursor:pointer}
.rb-btn.pri{background:linear-gradient(135deg,#0284c7,#2563eb);border-color:#7dd3fc;color:#fff}
@media (max-height:430px){
  .rb-card{padding:10px 12px;gap:6px}
  .rb-estrelas{font-size:24px}
  .rb-sec{padding:6px 8px}
  .rb-btn{padding:5px 10px;font-size:11px}
}
`;

function garantirCss() {
  if (document.getElementById('rb-style')) return;
  const s = document.createElement('style');
  s.id = 'rb-style';
  s.textContent = CSS_RES;
  document.head.appendChild(s);
}

export function fecharResultadoBatalha() {
  document.getElementById('res-batalha-overlay')?.remove();
}

export function mostrarResultadoBatalha(op = {}) {
  garantirCss();
  fecharResultadoBatalha();

  const venceu = op.venceu !== false;
  const premios = op.premios || {};
  const chips = [];
  if (premios.ouro) chips.push(`🪙 +${premios.ouro} Ouro`);
  if (premios.diamantes) chips.push(`💎 +${premios.diamantes} Diamantes`);
  if (premios.moedas) chips.push(`🪙 +${premios.moedas} Moedas`);
  if (premios.ticketsPermanentes) chips.push(`🎟️ +${premios.ticketsPermanentes} Tickets`);
  if (premios.ticketsSemanais) chips.push(`🎫 +${premios.ticketsSemanais} Semanais`);
  if (premios.fragmentos) chips.push(`⚔️ +${premios.fragmentos} Frag. ${premios.linhagemSorteada || 'Único'}`);
  if (premios.poUnico) chips.push(`✨ +${premios.poUnico} Pó Único`);
  if (premios.essencia) chips.push(`💠 Essência ${premios.essencia.tamanho} ×${premios.essencia.qtd}`);
  if (premios.essencias?.menor) chips.push(`💠 Essência Menor ×${premios.essencias.menor}`);
  if (premios.essencias?.media) chips.push(`💠 Essência Média ×${premios.essencias.media}`);
  if (premios.essencias?.maior) chips.push(`💠 Essência Maior ×${premios.essencias.maior}`);
  if (premios.pocoes) {
    for (const [id, q] of Object.entries(premios.pocoes)) {
      if (q > 0) chips.push(`🧪 ${id.replace('pocao_xp_', 'XP ').toUpperCase()} ×${q}`);
    }
  }
  if (Array.isArray(premios.extras)) {
    for (const txt of premios.extras) if (txt) chips.push(txt);
  }

  const reliquias = Array.isArray(premios.reliquias) ? premios.reliquias : [];
  const relHtml = reliquias.length
    ? `<div class="rb-rel-grid">${reliquias.map((r) => {
        const cor = COR_RAR[r.raridade] || '#94a3b8';
        const parte = PARTES_RELIQUIA[r.parte]?.nome || r.parte || 'Relíquia';
        const elNome = NOME_ELEMENTO[r.elemento] || r.elemento || '';
        return `<div class="rb-rel" style="--cor-rar:${cor}">
          <div class="rb-rel-rar">${esc(r.raridade || 'comum')} · ${esc(elNome)}</div>
          <div><b>🏺 ${esc(parte)}</b></div>
          <div style="color:#cbd5e1;font-size:10.5px">Conjunto: ${esc(r.conjunto || '—')}</div>
        </div>`;
      }).join('')}</div>`
    : '';

  // XP por Onírico da formação
  const xpVal = Number(op.xpPorOnirico ?? premios.xpFormacao ?? 0) || 0;
  const formacao = op.save?.idle ? membrosFormacao(op.save.idle) : [];
  const xpHtml = formacao.length && xpVal > 0
    ? `<div class="rb-sec">
        <div class="rb-sec-tit">✨ XP da Formação</div>
        <div class="rb-xp-grid">${formacao.map(({ m }) => `<div class="rb-xp-card">
          <b>${esc(m.especie)}</b>
          <span>Nv.${m.nivel || 1} · <span class="rb-xp-val">+${xpVal} XP</span></span>
        </div>`).join('')}</div>
      </div>`
    : '';

  const estrelasHtml = typeof op.estrelas === 'number'
    ? `<div class="rb-estrelas">
        <span class="rb-est ${op.estrelas >= 1 ? 'on d1' : ''}">★</span>
        <span class="rb-est ${op.estrelas >= 2 ? 'on d2' : ''}">★</span>
        <span class="rb-est ${op.estrelas >= 3 ? 'on d3' : ''}">★</span>
      </div>`
    : '';

  const condsHtml = op.detalhesEstrelas && !op.rapida
    ? `<div class="rb-sec" style="font-size:11.5px">
        <div style="color:${op.detalhesEstrelas.estrela1 ? '#fde047' : '#94a3b8'}">${op.detalhesEstrelas.estrela1 ? '✓' : '✗'} Vencer a batalha</div>
        <div style="color:${op.detalhesEstrelas.estrela2 ? '#fde047' : '#94a3b8'}">${op.detalhesEstrelas.estrela2 ? '✓' : '✗'} Todos os aliados vivos</div>
        <div style="color:${op.detalhesEstrelas.estrela3 ? '#fde047' : '#94a3b8'}">${op.detalhesEstrelas.estrela3 ? '✓' : '✗'} ${esc(op.condicaoEstrela3Texto || '')}</div>
      </div>`
    : '';

  const el = document.createElement('div');
  el.id = 'res-batalha-overlay';
  el.innerHTML = `<div class="rb-card ${venceu ? '' : 'derrota'}">
    <h3 style="margin:0;color:${venceu ? '#fde047' : '#fca5a5'}">${esc(op.titulo || (venceu ? '🏆 Vitória!' : '💀 Derrota'))}</h3>
    ${op.subtitulo ? `<div style="font-size:12px;color:#93c5fd">${esc(op.subtitulo)}</div>` : ''}
    ${estrelasHtml}
    ${condsHtml}
    ${op.destaqueBanner ? `<div class="rb-destaque">${esc(op.destaqueBanner)}</div>` : ''}
    ${xpHtml}
    <div class="rb-sec">
      <div class="rb-sec-tit">🎁 Recompensas &amp; Relíquias</div>
      <div class="rb-premios">${chips.length ? chips.map((c) => `<span class="rb-chip">${esc(c)}</span>`).join('') : '<span style="font-size:11.5px;color:#94a3b8">Sem recompensas extras.</span>'}</div>
      ${relHtml}
    </div>
    <div class="rb-bts">
      ${op.podeProxima ? `<button class="rb-btn pri" data-rb-prox="1">${esc(op.rotuloProxima || 'Próxima →')}</button>` : ''}
      ${op.podeRepetir ? `<button class="rb-btn" data-rb-rep="1">🔁 Repetir</button>` : ''}
      <button class="rb-btn ${op.podeProxima ? '' : 'pri'}" data-rb-voltar="1">${esc(op.rotuloVoltar || 'Continuar')}</button>
    </div>
  </div>`;

  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.rbProx) { fecharResultadoBatalha(); op.onProxima?.(); }
    else if (b.dataset.rbRep) { fecharResultadoBatalha(); op.onRepetir?.(); }
    else if (b.dataset.rbVoltar) { fecharResultadoBatalha(); op.onVoltar?.(); }
  });
  document.body.appendChild(el);
  return el;
}
