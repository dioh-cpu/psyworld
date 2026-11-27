// Campanha Mini — tela inteira do modo história (12 capítulos × 10 fases + fase escondida)
// Conectada às regras puras em regiao1-campanha-mini-regras.js e à arena existente (telaBatalha).
import {
  ENERGIA_CFG,
  energiaDe,
  usarPocaoEnergia,
  CAPITULOS_CAMPANHA_MINI,
  FASES_CAMPANHA_POR_ID,
  statusCapitulo,
  iniciarFaseCampanhaMini,
  concluirFaseCampanhaMini,
  batalhaRapidaCampanhaMini,
  coletarBauFase,
  coletarBauCapitulo,
  ESSENCIAS_PARES,
} from './regiao1-campanha-mini-regras.js';
import { garantirEstadoIdle } from './regiao1-idle.js';
import { membrosFormacao } from './regiao1-exp-regras.js';
import { bonusDoMembro } from './regiao1-halloween-regras.js';
import { arteDoIndividuo } from './regiao1-halloween-dados.js';
import { NOME_ELEMENTO } from '../core.js';
import { mostrarResultadoBatalha, fecharResultadoBatalha } from './regiao1-resultado-ui.js';
import { renderBalaoTutorialModo, tratarCliqueTutorialModo } from './regiao1-tutoriais-modos.js';
import { aplicarFundoTelaSobDemanda } from './regiao1-perf-mobile.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pad2 = (n) => String(n).padStart(2, '0');
const KIT_CM = (p) => `../../../assets/confusion/interface/kit-v2/${p}`;
const CAMPANHA_MINI_V2_ATIVO = false; // ativar quando GPT entregar assets/confusion/interface/campanha-mini-v2/
const capaCapitulo = (num) => (CAMPANHA_MINI_V2_ATIVO
  ? `../../../assets/confusion/interface/campanha-mini-v2/cap-${pad2(num)}.webp`
  : `../../../assets/confusion/interface/estrategia/reinos/${pad2(num)}/cidade-conceito.webp`);
const COORDS_CM_V2 = {}; // preenchido por campanha-mini-v2/coordenadas.json quando disponível

// Coordenadas automáticas em trilha sinuosa (% do mapa) — prontas para substituir por campanha-mini-v2/coordenadas.json quando o GPT entregar.
const PONTOS_TRILHA = [
  [10, 74], [20, 56], [30, 72], [40, 48], [50, 32],
  [60, 56], [69, 74], [78, 52], [86, 66], [92, 34],
];
const PONTO_ESCONDIDA = [50, 78];

const COR_EL = {
  fogo: '#f97316', agua: '#38bdf8', planta: '#4ade80', terra: '#d97706', luz: '#facc15',
  trevas: '#a855f7', neutro: '#cbd5e1', lutador: '#f87171', voador: '#60a5fa',
  veneno: '#c084fc', psiquico: '#f472b6', inseto: '#a3e635', pedra: '#d6b48c',
  fantasma: '#a78bfa', eletrico: '#fde047', gelo: '#67e8f9', dragao: '#818cf8',
  aco: '#94a3b8', fada: '#f9a8d4',
};

const CSS_CM = `
#modal-campanha-mini.modal-bg{padding:0!important;z-index:55}
#modal-campanha-mini .cm-shell{width:100vw;height:100vh;max-width:100vw;max-height:100vh;background:linear-gradient(180deg,rgba(12,8,22,.82),rgba(8,6,18,.94));background-size:cover;background-position:center;color:#e2e8f0;display:flex;flex-direction:column;overflow:hidden}
.cm-top{display:flex;align-items:center;gap:8px;padding:8px 14px;background:linear-gradient(180deg,rgba(22,12,32,.88),rgba(12,7,20,.94)),url('../../../assets/confusion/interface/kit-v2/cabecalho.png') center / 100% 100% no-repeat;border-bottom:1px solid rgba(243,194,122,.32);flex-shrink:0}
.cm-top h3{margin:0;font-size:15px;color:#fde68a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cm-top .cm-sub{font-size:11.5px;color:#cbd5e1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cm-top .cm-dir{margin-left:auto;display:flex;align-items:center;gap:6px;flex-shrink:0}
.cm-btn{background:url('../../../assets/confusion/interface/kit-v2/botao-secundario-normal.png') center / 100% 100% no-repeat,#1b1429;border:0;color:#fff3e7;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,.7)}
.cm-btn:hover:not(:disabled){background-image:url('../../../assets/confusion/interface/kit-v2/botao-secundario-hover.png')}
.cm-btn.pri{background:url('../../../assets/confusion/interface/kit-v2/botao-principal-normal.png') center / 100% 100% no-repeat,linear-gradient(135deg,#b8793e,#7c4923);color:#fff7ed}
.cm-btn.pri:hover:not(:disabled){background-image:url('../../../assets/confusion/interface/kit-v2/botao-principal-hover.png')}
.cm-btn.ouro{background:url('../../../assets/confusion/interface/kit-v2/botao-principal-normal.png') center / 100% 100% no-repeat,linear-gradient(135deg,#b45309,#d97706);color:#fff7ed}
.cm-btn:disabled{background-image:url('../../../assets/confusion/interface/kit-v2/botao-secundario-desativado.png');opacity:.52;cursor:not-allowed}
.cm-body{flex:1;overflow-y:auto;overflow-x:hidden;padding:12px 14px;display:flex;flex-direction:column;gap:10px;max-width:1120px;width:100%;margin:0 auto;box-sizing:border-box}
.cm-caps{display:grid;grid-template-columns:repeat(auto-fill,minmax(205px,1fr));gap:10px}
.cm-cap{position:relative;border-radius:12px;overflow:hidden;border:1px solid #26466d;background:#0f203b;cursor:pointer;display:flex;flex-direction:column;transition:transform .12s,border-color .12s}
.cm-cap:hover{transform:translateY(-2px);border-color:#38bdf8}
.cm-cap.bloq{opacity:.58;filter:grayscale(.45)}
.cm-cap-img{height:98px;width:100%;object-fit:cover;display:block;background:#0a162b}
.cm-cap-info{padding:8px 10px;display:flex;flex-direction:column;gap:4px}
.cm-cap-tit{display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:#f8fafc}
.cm-cap-meta{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#94a3b8}
.cm-tag{display:inline-flex;align-items:center;padding:1px 6px;border-radius:999px;font-size:10px;font-weight:700;background:#1e293b;color:#e2e8f0;border:1px solid rgba(255,255,255,.15)}
.cm-cap-lock{position:absolute;top:7px;right:7px;background:rgba(2,6,23,.82);border:1px solid #475569;color:#e2e8f0;border-radius:999px;padding:2px 7px;font-size:11px;font-weight:700}
.cm-cap-estrelas{color:#facc15;font-weight:800;font-size:11.5px}
.cm-mapa-wrap{display:grid;grid-template-columns:1fr 315px;gap:12px;flex:1;min-height:0}
.cm-mapa-col{display:flex;flex-direction:column;gap:8px;min-height:0}
.cm-mapa-canvas{position:relative;flex:1;min-height:270px;border-radius:14px;overflow:hidden;border:1px solid #254872;background:#091529}
.cm-mapa-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.34;pointer-events:none}
.cm-mapa-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.cm-no{position:absolute;transform:translate(-50%,-50%);width:44px;height:44px;border-radius:50%;border:2px solid #38bdf8;background:rgba(10,23,46,.92);color:#f8fafc;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;font-size:11px;font-weight:800;line-height:1.05;padding:0;box-shadow:0 3px 12px rgba(0,0,0,.55);transition:transform .12s}
.cm-no:hover{transform:translate(-50%,-50%) scale(1.08)}
.cm-no.elite{width:54px;height:54px;border-color:#f59e0b;background:rgba(69,26,3,.92)}
.cm-no.chefe{width:62px;height:62px;border-color:#ef4444;background:rgba(69,10,10,.94);font-size:12px}
.cm-no.escondida{width:54px;height:54px;border-color:#c084fc;background:rgba(59,7,100,.92)}
.cm-no.bloq{border-color:#475569;background:rgba(15,23,42,.82);color:#64748b;cursor:not-allowed}
.cm-no.sel{box-shadow:0 0 0 3px #fde047,0 4px 16px rgba(250,204,21,.45)}
.cm-no.atual{animation:cmPulso 1.5s ease-in-out infinite;border-color:#fde047}
@keyframes cmPulso{0%,100%{box-shadow:0 0 0 2px rgba(250,204,21,.55)}50%{box-shadow:0 0 0 8px rgba(250,204,21,.15)}}
.cm-no-est{font-size:9.5px;color:#facc15;letter-spacing:-1px;margin-top:1px}
.cm-baus{display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:rgba(9,20,39,.88);border:1px solid #1e3a5f;border-radius:10px;padding:7px 10px}
.cm-bau{display:flex;align-items:center;gap:5px;padding:4px 9px;border-radius:8px;border:1px solid #334155;background:#0f1d35;color:#cbd5e1;font-size:11.5px;font-weight:700;cursor:pointer}
.cm-bau.pronto{border-color:#facc15;background:rgba(180,83,9,.45);color:#fef08a}
.cm-bau.coletado{border-color:#22c55e;background:rgba(20,83,45,.35);color:#86efac;cursor:default}
.cm-ficha{background:rgba(18,10,28,.92);border:12px solid transparent;border-image:url('../../../assets/confusion/interface/kit-v2/painel-9slice.png') 28 fill stretch;border-radius:12px;padding:8px;display:flex;flex-direction:column;gap:8px;overflow-y:auto}
.cm-ficha h4{margin:0;font-size:14px;color:#fde68a;display:flex;justify-content:space-between;align-items:center;gap:6px}
.cm-box{background:rgba(14,8,22,.82);border:1px solid rgba(243,194,122,.28);border-radius:9px;padding:7px 9px;font-size:11.5px;color:#e2d4c8}
.cm-box b{color:#f8fafc}
.cm-ini-lista{display:flex;flex-wrap:wrap;gap:5px;margin-top:4px}
.cm-ini-chip{background:#132544;border:1px solid #2c4a73;border-radius:7px;padding:3px 7px;font-size:11px;color:#e2e8f0}
.cm-conds{margin:4px 0 0;padding-left:0;list-style:none;display:flex;flex-direction:column;gap:3px}
.cm-conds li{font-size:11.5px;color:#cbd5e1}
.cm-conds li.ok{color:#fde047}
.cm-acoes{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:auto}
.cm-acoes .cm-btn.full{grid-column:1 / -1}
.cm-res-bg{position:fixed;inset:0;background:rgba(2,6,23,.84);z-index:75;display:flex;align-items:center;justify-content:center;padding:12px}
.cm-res-card{width:min(450px,96vw);max-height:92vh;overflow-y:auto;background:linear-gradient(180deg,#0f2242,#0a162c);border:2px solid #38bdf8;border-radius:16px;padding:16px;text-align:center;display:flex;flex-direction:column;gap:10px;box-shadow:0 16px 40px rgba(0,0,0,.65)}
.cm-res-estrelas{display:flex;justify-content:center;gap:10px;font-size:34px;line-height:1}
.cm-res-est{opacity:.22;transform:scale(.65);filter:grayscale(1)}
.cm-res-est.acessa{animation:cmEstrela .45s ease-out forwards}
.cm-res-est.d1{animation-delay:.12s}
.cm-res-est.d2{animation-delay:.42s}
.cm-res-est.d3{animation-delay:.72s}
@keyframes cmEstrela{0%{opacity:.2;transform:scale(.5) rotate(-18deg);filter:grayscale(1)}65%{opacity:1;transform:scale(1.24) rotate(6deg);filter:none}100%{opacity:1;transform:scale(1) rotate(0);filter:none}}
.cm-res-destaque{background:linear-gradient(135deg,rgba(180,83,9,.55),rgba(146,64,14,.35));border:1px solid #fde047;border-radius:10px;padding:8px 10px;color:#fef08a;font-size:12px;font-weight:700}
.cm-res-premios{display:flex;flex-wrap:wrap;justify-content:center;gap:6px}
.cm-res-bts{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
@media (max-width:780px),(max-height:430px){
  .cm-top{padding:5px 10px;gap:6px}
  .cm-top h3{font-size:13px}
  .cm-body{padding:7px 10px;gap:7px}
  .cm-caps{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:7px}
  .cm-cap-img{height:66px}
  .cm-mapa-wrap{grid-template-columns:1fr 245px;gap:8px}
  .cm-mapa-canvas{min-height:210px}
  .cm-no{width:34px;height:34px;font-size:9.5px}
  .cm-no.elite,.cm-no.escondida{width:42px;height:42px}
  .cm-no.chefe{width:48px;height:48px;font-size:10.5px}
  .cm-ficha{padding:8px;gap:5px}
  .cm-box{padding:5px 7px;font-size:10.5px}
  .cm-btn{padding:5px 8px;font-size:11px}
}
`;

function garantirEstilo() {
  if (document.getElementById('cm-style')) return;
  const s = document.createElement('style');
  s.id = 'cm-style';
  s.textContent = CSS_CM;
  document.head.appendChild(s);
}

function garantirModal() {
  let m = document.getElementById('modal-campanha-mini');
  if (m) return m;
  m = document.createElement('div');
  m.id = 'modal-campanha-mini';
  m.className = 'modal-bg';
  m.dataset.tela = 'campanha-mini';
  m.innerHTML = `<div class="cm-shell">
    <div class="cm-top">
      <button class="cm-btn" data-cm-voltar="1">← Refúgio</button>
      <div style="min-width:0"><h3 id="cm-titulo">Campanha Mini</h3><div class="cm-sub" id="cm-sub"></div></div>
      <div class="cm-dir">
        <span id="cm-energia" class="energia-pill">⚡ 120/120</span>
        <button class="cm-btn" id="cm-usar-pocao" data-cm-pocao="1" style="display:none">+60 ⚡</button>
        <span id="cm-recursos" class="modal-recursos"></span>
      </div>
    </div>
    <div class="cm-body" id="cm-body"></div>
  </div>`;
  document.body.appendChild(m);
  return m;
}

function estrelasTxt(n) {
  const v = Math.max(0, Math.min(3, Number(n) || 0));
  return '★'.repeat(v) + '☆'.repeat(3 - v);
}

function formatarPremiosChips(premios) {
  if (!premios) return '';
  const chips = [];
  if (premios.ouro) chips.push(`🪙 +${premios.ouro}`);
  if (premios.diamantes) chips.push(`💎 +${premios.diamantes}`);
  if (premios.xpFormacao) chips.push(`✨ +${premios.xpFormacao} XP`);
  if (premios.pocoes) {
    for (const [id, q] of Object.entries(premios.pocoes)) {
      if (q > 0) chips.push(`🧪 ${id.replace('pocao_xp_', 'XP ').toUpperCase()} ×${q}`);
    }
  }
  if (premios.essencias?.menor) chips.push(`💠 Essência Menor ×${premios.essencias.menor}`);
  if (premios.essencias?.media) chips.push(`💠 Essência Média ×${premios.essencias.media}`);
  if (premios.reliquias?.length) chips.push(`🏺 Relíquia ×${premios.reliquias.length}`);
  if (premios.ticketsPermanentes) chips.push(`🎟️ +${premios.ticketsPermanentes} Tickets`);
  if (premios.ticketsSemanais) chips.push(`🎫 +${premios.ticketsSemanais} Semanais`);
  return chips.map((c) => `<span class="cm-tag">${esc(c)}</span>`).join('');
}

export function iniciarCampanhaMini({ getSave, salvar, mostrarToast, abrirModal, fecharModal, tela, batalhaBloqueando, atualizarHud }) {
  garantirEstilo();
  const modal = garantirModal();
  const titEl = modal.querySelector('#cm-titulo');
  const subEl = modal.querySelector('#cm-sub');
  const enEl = modal.querySelector('#cm-energia');
  const pocBtn = modal.querySelector('#cm-usar-pocao');
  const recEl = modal.querySelector('#cm-recursos');
  const body = modal.querySelector('#cm-body');
  const voltarBtn = modal.querySelector('[data-cm-voltar]');

  let visao = 'capitulos'; // 'capitulos' | 'mapa'
  let capAtual = 1;
  let faseSelId = '1-1';
  let resultadoOverlay = null;

  function atualizarEnergiaTop() {
    const save = getSave();
    const en = energiaDe(save);
    enEl.textContent = `⚡ ${en.atual}/${en.max}`;
    const faltaMs = en.atual < en.max ? Math.max(0, ENERGIA_CFG.intervaloMs - (Date.now() - en.ultimoTickMs)) : 0;
    enEl.title = faltaMs > 0
      ? `Energia ${en.atual}/${en.max} (+1 em ${Math.ceil(faltaMs / 60000)} min · máx. ${ENERGIA_CFG.max})`
      : `Energia cheia (${en.atual}/${en.max})`;
    if (en.pocoes > 0) {
      pocBtn.style.display = 'inline-block';
      pocBtn.textContent = `🧪 +60 ⚡ (${en.pocoes})`;
    } else {
      pocBtn.style.display = 'none';
    }
    if (recEl) {
      const gold = Number(save.recompensas?.gold || 0).toLocaleString('pt-BR');
      const diam = Number(save.recompensas?.diamantes || 0).toLocaleString('pt-BR');
      const tick = Number(save.expansao?.tickets || 0);
      recEl.innerHTML = `<span class="modal-rec-pill" title="Ouro"><img class="kit-rec-ico" src="${KIT_CM('recursos/ouro.png')}" alt="">${gold}</span><span class="modal-rec-pill" title="Diamantes"><img class="kit-rec-ico" src="${KIT_CM('recursos/diamante.png')}" alt="">${diam}</span><span class="modal-rec-pill" title="Tickets"><img class="kit-rec-ico" src="${KIT_CM('recursos/ticket.png')}" alt="">${tick}</span>`;
    }
  }

  function proximaFaseDoMapa(st) {
    for (const f of st.fasesStatus) {
      if (f.desbloqueada && !f.vencida) return f.id;
    }
    return st.fasesStatus[st.fasesStatus.length - 1]?.id || `${st.capitulo}-1`;
  }

  function renderCapitulos() {
    const save = getSave();
    voltarBtn.textContent = '← Refúgio';
    titEl.textContent = '🗺️ Campanha Mini';
    subEl.textContent = '12 capítulos · 10 fases + fase escondida aos 30★';
    atualizarEnergiaTop();

    const cards = CAPITULOS_CAMPANHA_MINI.map((cap) => {
      const st = statusCapitulo(save, cap.capitulo);
      const cor = COR_EL[cap.elemento] || '#38bdf8';
      const nomeEl = NOME_ELEMENTO[cap.elemento] || cap.elemento;
      const faixa = cap.faixaNivel ? `Nv. ${cap.faixaNivel[0]}–${cap.faixaNivel[1]}` : '';
      return `<div class="cm-cap ${st.desbloqueado ? '' : 'bloq'}" data-cm-cap="${cap.capitulo}">
        <img class="cm-cap-img" src="${capaCapitulo(cap.capitulo)}" alt="${esc(cap.nome)}" loading="lazy" />
        ${st.desbloqueado ? '' : '<span class="cm-cap-lock">🔒 Bloqueado</span>'}
        <div class="cm-cap-info">
          <div class="cm-cap-tit">
            <span>Cap. ${cap.capitulo} · ${esc(cap.nome)}</span>
            <span class="cm-cap-estrelas">★ ${st.estrelas}/30</span>
          </div>
          <div class="cm-cap-meta">
            <span class="cm-tag" style="border-color:${cor};color:${cor}">${esc(nomeEl)}</span>
            <span>${esc(faixa)}</span>
          </div>
        </div>
      </div>`;
    }).join('');
    body.innerHTML = `${renderBalaoTutorialModo(save, 'campanha_mini')}<div class="cm-caps">${cards}</div>`;
  }

  function renderMapa() {
    const save = getSave();
    const st = statusCapitulo(save, capAtual);
    if (!st) { visao = 'capitulos'; renderCapitulos(); return; }
    voltarBtn.textContent = '← Capítulos';
    titEl.textContent = `Cap. ${st.capitulo} · ${st.nome}`;
    subEl.textContent = `★ ${st.estrelas}/30 · ${st.escondidaAberta ? 'Fase escondida aberta!' : 'Complete 30★ para abrir a fase escondida'}`;
    atualizarEnergiaTop();

    const faseAtualId = proximaFaseDoMapa(st);
    const todasFases = [...st.fasesStatus, ...(st.escondidaAberta ? [st.escondidaStatus] : [])];
    if (!todasFases.some((f) => f.id === faseSelId)) faseSelId = faseAtualId;
    const faseSel = todasFases.find((f) => f.id === faseSelId) || st.fasesStatus[0];

    const pontosStr = PONTOS_TRILHA.map(([x, y]) => `${x},${y}`).join(' ');
    const nosHtml = st.fasesStatus.map((f, idx) => {
      const [x, y] = PONTOS_TRILHA[idx] || [50, 50];
      const cls = ['cm-no', f.tipo];
      if (!f.desbloqueada) cls.push('bloq');
      if (f.id === faseAtualId && f.desbloqueada && !f.vencida) cls.push('atual');
      if (f.id === faseSel.id) cls.push('sel');
      const icone = !f.desbloqueada ? '🔒' : f.tipo === 'chefe' ? '👑' : f.tipo === 'elite' ? '⚔️' : '';
      return `<button class="${cls.join(' ')}" style="left:${x}%;top:${y}%" data-cm-fase="${f.id}" title="${esc(f.nome)}">
        <span>${icone ? `${icone} ` : ''}${f.id}</span>
        ${f.desbloqueada ? `<span class="cm-no-est">${estrelasTxt(f.estrelas)}</span>` : ''}
      </button>`;
    }).join('');

    const escNo = st.escondidaAberta ? (() => {
      const f = st.escondidaStatus;
      const [x, y] = PONTO_ESCONDIDA;
      return `<button class="cm-no escondida ${f.id === faseSel.id ? 'sel' : ''}" style="left:${x}%;top:${y}%" data-cm-fase="${f.id}" title="Fase Escondida · ${esc(f.nome)}">
        <span>✨ ${f.id}</span>
        <span class="cm-no-est">${estrelasTxt(f.estrelas)}</span>
      </button>`;
    })() : '';

    const bausHtml = st.baus.map((b) => {
      const cls = b.coletado ? 'coletado' : b.atingido ? 'pronto' : '';
      const txt = b.coletado ? `✓ ${b.marco}★` : b.atingido ? `🎁 Coletar ${b.marco}★` : `🔒 ${b.marco}★`;
      return `<button class="cm-bau ${cls}" data-cm-bau-cap="${b.marco}" ${b.atingido && !b.coletado ? '' : 'disabled'}>${txt}</button>`;
    }).join('');

    const inimigosHtml = (faseSel.inimigos || []).map(([esp, nv, el, op]) => {
      const nome = op?.nome || esp;
      const cor = COR_EL[el] || '#cbd5e1';
      return `<span class="cm-ini-chip">${op?.chefe ? '👑 ' : ''}${esc(nome)} <span style="color:#94a3b8">Nv.${nv}</span> <span style="color:${cor}">●</span></span>`;
    }).join('');

    const parNome = ESSENCIAS_PARES[st.parEssencia]?.nome || st.parEssencia || 'Essência';
    const recompPrev = faseSel.tipo === 'chefe'
      ? `🪙 ${600 * st.capitulo} · 💎 30 · 💠 Essências (${parNome}) · 🎟️ +10 Tickets (1ª vez${st.capitulo % 3 === 0 ? ' + 10 Semanais' : ''})`
      : faseSel.tipo === 'elite'
        ? `🪙 ${400 * st.capitulo} · 💎 20 · 🏺 Relíquia Comum`
        : faseSel.tipo === 'escondida'
          ? `🪙 ${600 * st.capitulo} · 💎 30 · 🏺 Relíquia Rara`
          : `🪙 ${200 * st.capitulo} · 💎 10 · 🧪 Poção XP`;

    const podeBauFase = !faseSel.escondida && faseSel.estrelas >= 3 && !faseSel.bauColetado;
    const podeRapida = faseSel.estrelas >= 3 && faseSel.desbloqueada;

    body.innerHTML = `<div class="cm-mapa-wrap">
      <div class="cm-mapa-col">
        <div class="cm-mapa-canvas">
          <img class="cm-mapa-bg" src="${capaCapitulo(st.capitulo)}" alt="" />
          <svg class="cm-mapa-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline points="${pontosStr}" fill="none" stroke="rgba(125,211,252,.55)" stroke-width="1.3" stroke-dasharray="2.4 1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          ${nosHtml}
          ${escNo}
        </div>
        <div class="cm-baus">
          <span style="font-size:11.5px;color:#93c5fd;font-weight:700">Baús do Capítulo (★ ${st.estrelas}/30):</span>
          ${bausHtml}
        </div>
      </div>
      <div class="cm-ficha">
        <h4>
          <span>${esc(faseSel.id)} · ${esc(faseSel.nome)}</span>
          <span class="cm-cap-estrelas">${estrelasTxt(faseSel.estrelas)}</span>
        </h4>
        <div class="cm-box">
          <div><b>Nível recomendado:</b> ${faseSel.nivel} · <b>Energia:</b> ⚡ ${faseSel.energia} · <b>🌊 Ondas:</b> ${Array.isArray(faseSel.ondas) && faseSel.ondas.length ? faseSel.ondas.length : (Number(faseSel.numero || 1) <= 3 ? 2 : 3)}</div>
          <div style="margin-top:4px"><b>Inimigos:</b></div>
          <div class="cm-ini-lista">${inimigosHtml}</div>
        </div>
        <div class="cm-box">
          <b>Condições das 3 Estrelas:</b>
          <ul class="cm-conds">
            <li class="${faseSel.estrelas >= 1 ? 'ok' : ''}">★ Vencer a batalha</li>
            <li class="${faseSel.estrelas >= 2 ? 'ok' : ''}">★ Todos os aliados vivos ao final</li>
            <li class="${faseSel.estrelas >= 3 ? 'ok' : ''}">★ ${esc(faseSel.condicaoEstrela3?.texto || 'Usar suprema')}</li>
          </ul>
        </div>
        <div class="cm-box">
          <b>Recompensas (1ª vitória):</b>
          <div style="margin-top:3px;color:#fde68a">${esc(recompPrev)}</div>
          ${!faseSel.escondida ? `<div style="margin-top:6px"><button class="cm-btn ${podeBauFase ? 'ouro' : ''}" data-cm-bau-fase="${faseSel.id}" ${podeBauFase ? '' : 'disabled'}>${faseSel.bauColetado ? '✓ Baú 3★ coletado' : '🎁 Baú 3★ (20💎 + Essência)'}</button></div>` : ''}
        </div>
        <div class="cm-acoes">
          <button class="cm-btn" data-cm-formacao="1">🛡️ Formação</button>
          <button class="cm-btn" data-cm-rapida="${faseSel.id}" ${podeRapida ? '' : 'disabled'} title="${podeRapida ? 'Concluir instantaneamente (já tem 3★)' : 'Libera ao atingir 3★ nesta fase'}">⚡ Batalha rápida</button>
          <button class="cm-btn pri full" data-cm-lutar="${faseSel.id}" ${faseSel.desbloqueada ? '' : 'disabled'}>⚔️ Lutar (⚡ ${faseSel.energia})</button>
        </div>
      </div>
    </div>`;
  }

  function mostrarResultado(fase, res) {
    const proxId = !fase.escondida && fase.numero < 10 ? `${fase.capitulo}-${fase.numero + 1}` : null;
    const stCap = statusCapitulo(getSave(), fase.capitulo);
    const proxDesbl = Boolean(proxId && stCap?.fasesStatus?.some((f) => f.id === proxId && f.desbloqueada));
    const estrelas = res.rapida ? 3 : (res.estrelas || 0);
    const destaqueBanner = res.premios?.ticketsPermanentes
      ? `🎉 Capítulo ${fase.capitulo} concluído! +${res.premios.ticketsPermanentes} Tickets Permanentes${res.premios.ticketsSemanais ? ` + ${res.premios.ticketsSemanais} Tickets Semanais!` : '!'}`
      : null;
    mostrarResultadoBatalha({
      titulo: res.rapida ? '⚡ Batalha Rápida Concluída' : res.venceu ? '🏆 Vitória na Campanha Mini!' : '💀 Derrota',
      subtitulo: `Fase ${fase.id} · ${fase.nome}`,
      venceu: res.venceu !== false,
      rapida: Boolean(res.rapida),
      estrelas,
      detalhesEstrelas: res.detalhesEstrelas,
      condicaoEstrela3Texto: fase.condicaoEstrela3?.texto || '',
      destaqueBanner,
      save: getSave(),
      xpPorOnirico: res.premios?.xpFormacao || 0,
      premios: res.premios,
      podeProxima: proxDesbl,
      rotuloProxima: 'Próxima fase →',
      onProxima: () => { faseSelId = proxId; renderMapa(); },
      podeRepetir: true,
      onRepetir: () => iniciarLuta(fase.id),
      rotuloVoltar: '🗺️ Mapa',
      onVoltar: () => renderMapa(),
    });
  }

  function fecharResultado() {
    fecharResultadoBatalha();
  }

  function iniciarLuta(faseId) {
    if (batalhaBloqueando?.()) { mostrarToast?.('Já existe uma batalha em andamento.'); return; }
    const save = getSave();
    const ini = iniciarFaseCampanhaMini(save, faseId);
    if (!ini.ok) { mostrarToast?.(ini.motivo || 'Não foi possível iniciar a fase.'); atualizarEnergiaTop(); return; }
    salvar?.();
    atualizarEnergiaTop();
    const fase = ini.fase;
    const idle = garantirEstadoIdle(save);
    const aliados = membrosFormacao(idle).map(({ m, vaga }) => ({
      uid: m.uid,
      especie: m.especie,
      nivel: m.nivel || 1,
      bonus: bonusDoMembro(m),
      vaga,
      arte: arteDoIndividuo(m),
    }));
    const arenaUrl = fase.arena || `assets/confusion/interface/estrategia/reinos/${pad2(fase.capitulo)}/cidade-conceito.webp`;
    tela.abrir({
      titulo: `Campanha Mini · ${fase.id}`,
      sub: fase.nome,
      arena: arenaUrl,
      aliados,
      inimigos: fase.inimigos,
      ritmo: 420,
      regiao: fase.capitulo,
      save,
      onFim: (venceu, _frac, _eraMin, resumo) => {
        const resumoFinal = resumo || { venceu: Boolean(venceu), todosVivos: false, classes: {}, elementos: {}, supremasUsadas: 0 };
        const res = concluirFaseCampanhaMini(getSave(), fase.id, resumoFinal, { batalhaId: ini.batalhaId });
        salvar?.();
        atualizarHud?.();
        renderMapa();
        mostrarResultado(fase, res);
      },
    });
  }

  function render() {
    if (visao === 'mapa') renderMapa();
    else renderCapitulos();
  }

  modal.addEventListener('click', (e) => {
    const t = e.target.closest('button, [data-cm-cap]');
    if (!t) return;
    if (tratarCliqueTutorialModo(t.dataset, { save: getSave(), salvar, aoFechar: () => render() })) return;
    if (t.dataset.cmVoltar) {
      if (visao === 'mapa') { visao = 'capitulos'; renderCapitulos(); }
      else { fecharResultado(); fecharModal('modal-campanha-mini'); window.regiaoExp?.abrir('descanso'); }
      return;
    }
    if (t.dataset.cmPocao) {
      const r = usarPocaoEnergia(getSave(), 1);
      if (r.ok) { salvar?.(); atualizarEnergiaTop(); mostrarToast?.(`+${r.ganho} ⚡ Energia!`); }
      else mostrarToast?.(r.motivo || 'Sem poções de energia.');
      return;
    }
    if (t.dataset.cmCap) {
      const num = Number(t.dataset.cmCap);
      const st = statusCapitulo(getSave(), num);
      if (!st?.desbloqueado) { mostrarToast?.(`Vença o Capítulo ${num - 1} para desbloquear.`); return; }
      capAtual = num;
      faseSelId = proximaFaseDoMapa(st);
      visao = 'mapa';
      renderMapa();
      return;
    }
    if (t.dataset.cmFase) {
      faseSelId = t.dataset.cmFase;
      renderMapa();
      return;
    }
    if (t.dataset.cmBauCap) {
      const r = coletarBauCapitulo(getSave(), capAtual, Number(t.dataset.cmBauCap));
      if (r.ok) { salvar?.(); atualizarHud?.(); renderMapa(); mostrarToast?.(`Baú ${t.dataset.cmBauCap}★ coletado!`); }
      else mostrarToast?.(r.motivo || 'Baú indisponível.');
      return;
    }
    if (t.dataset.cmBauFase) {
      const r = coletarBauFase(getSave(), t.dataset.cmBauFase);
      if (r.ok) { salvar?.(); atualizarHud?.(); renderMapa(); mostrarToast?.('Baú 3★ coletado! +20 💎 + Essência'); }
      else mostrarToast?.(r.motivo || 'Baú indisponível.');
      return;
    }
    if (t.dataset.cmFormacao) {
      fecharModal('modal-campanha-mini');
      window.regiaoExp?.abrir('equipe');
      return;
    }
    if (t.dataset.cmLutar) {
      iniciarLuta(t.dataset.cmLutar);
      return;
    }
    if (t.dataset.cmRapida) {
      const fase = FASES_CAMPANHA_POR_ID[t.dataset.cmRapida];
      const r = batalhaRapidaCampanhaMini(getSave(), t.dataset.cmRapida);
      if (!r.ok) { mostrarToast?.(r.motivo || 'Batalha rápida indisponível.'); atualizarEnergiaTop(); return; }
      salvar?.();
      atualizarHud?.();
      renderMapa();
      mostrarResultado(fase, { ...r, venceu: true });
    }
  });

  function abrir(capitulo = null) {
    if (capitulo && statusCapitulo(getSave(), capitulo)?.desbloqueado) {
      capAtual = capitulo;
      visao = 'mapa';
    } else {
      visao = 'capitulos';
    }
    const shell = modal.querySelector('.cm-shell');
    if (shell) aplicarFundoTelaSobDemanda(shell, 'campanha-mini');
    render();
    abrirModal('modal-campanha-mini');
  }

  return { abrir, render, fecharResultado };
}
