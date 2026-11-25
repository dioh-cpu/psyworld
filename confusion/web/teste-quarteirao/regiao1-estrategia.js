// Modo Estratégia (interface). Regras em regiao1-estrategia-regras.js e dados por cidade em regiao1-estrategia-c1.js.
// Mapa da cidade com locais de construção, cinco menus (Aldeias, Refúgios, Exércitos, Hospitais, Expedições), combate 6 contra 6 por
// turnos, controles independentes (Atacar automaticamente / Próxima fase / Avançar automaticamente) e expedição minimizada.
// Estado salvo em save.idle.estrategia[id]. Cada recompensa de vitória é paga uma única vez (exp.pagas).
import { animarEvento as animarEventoFx } from './regiao1-batalha-fx.js';
import { locaisAtivos, avancar, gestaoDe, candidatasObra, enfileirarObras, acelerarObra, custoAceleracao, prontoParaColetar, coletarTudo, previsaoLote, fabricarLote, repetirUltimoLote, capacidade, duracaoDaObra } from './regiao1-gestao-regras.js';
import { criarRng, criarUnidade, gerarInimigos, criarBatalha, atorAtual, executar, decidir, novaExpedicao, pagarFase, custoDoNivel, falta, construir, prosperidade, bonusDaCidade, dificuldadeDaFase } from './regiao1-estrategia-regras.js';

const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const PAPEL = { ataque: { i: '⚔️', n: 'Ataque' }, defesa: { i: '🛡️', n: 'Defesa' }, suporte: { i: '💚', n: 'Suporte' } };

export function iniciarEstrategia({ dados, getSave, salvar, mostrarToast, abrirModal, fecharModal, atualizarHud }) {
  const REINOS_D = Array.isArray(dados) ? dados : [dados];
  let D = REINOS_D[0];
  const rng = criarRng(Date.now() % 100000);
  let batalha = null;       // só em memória: ao recarregar, a fase recomeça
  let ritmoMs = 650;
  let resumoUlt = null, selObras = new Set(), confAcel = null, loteRec = null, loteQtd = 5;
  let drawer = false;
  let aba = 'gestao', visao = 'cidade', slotSel = null, confirmar = null, alvoSel = null, minimizado = false;
  let timerTick = null, timerProx = null;

  // ---------- estado ----------
  const estado = (Dx = D) => {
    const idle = getSave().idle || (getSave().idle = {});
    idle.estrategia = idle.estrategia || {};
    const s = idle.estrategia[Dx.id] || (idle.estrategia[Dx.id] = { materiais: { ...Dx.inicial }, estruturas: {}, exp: null, recrutados: {}, historico: [], vagas: Dx.vagasIniciais || 2, inimigosLiberados: {} });
    s.materiais = { ...Dx.inicial, ...s.materiais }; s.estruturas = s.estruturas || {}; s.recrutados = s.recrutados || {}; s.historico = s.historico || []; s.vagas = Math.max(1, Math.min(6, s.vagas || Dx.vagasIniciais || 2)); s.trabalho = s.trabalho || {}; gestaoDe(s); s.inimigosLiberados = s.inimigosLiberados || {};
    return s;
  };
  const roster = () => (getSave().idle.equipe || []).map((m, i) => ({ id: `m${i}`, especie: m.especie, nivel: m.nivel || 1 }));
  const diario = (t) => { const meta = window.regiaoMundo?.estado?.().meta; if (!meta) return; meta.diario = meta.diario || []; meta.diario.push({ dia: meta.dia, t: `${D.titulo}: ${t}` }); if (meta.diario.length > 150) meta.diario = meta.diario.slice(-150); };
  const rotaDe = (id) => D.rotas.find((r) => r.id === id);
  const estrDe = (id) => D.estruturas.find((e) => e.id === id);
  const custoTxt = (c) => Object.entries(c).map(([k, v]) => `${D.materiais[k]?.icone || ''} ${v} ${D.materiais[k]?.nome || k}`).join(' · ');
  const artUrl = (v) => { const a = v.arte || v; return a.estr ? `../../../assets/confusion/interface/estrategia/${a.estr}.webp` : `../../../assets/confusion/interface/mundo/${a.sis}/${a.vaga}.webp`; };
  const img = (a, emoji, nome, cls = '') => `<span class="est-arte ${cls}"><img src="${artUrl(a)}" alt="${esc(nome)}" onerror="this.parentNode.innerHTML='<span class=&quot;est-poli&quot;>${emoji}</span>'"></span>`;

  // ---------- DOM ----------
  const estilo = document.createElement('style');
  estilo.textContent = `
    #modal-estrategia .est-card { width: min(1200px, 100%); max-height: calc(100dvh - 20px); overflow: hidden; display: flex; flex-direction: column; padding: 10px 14px; }
    #modal-estrategia .modal-head { position: static; flex: 0 0 auto; margin-bottom: 6px; min-height: 0; padding: 4px 0; align-items: center; }
    #modal-estrategia [hidden] { display: none !important; }
    #modal-estrategia b { color: var(--gold, #f3c27a); }
    #modal-estrategia .est-topo { flex: 0 0 auto; display: flex; flex-wrap: wrap; gap: 4px 14px; align-items: center; font-size: 12.5px; margin-bottom: 6px; }
    #modal-estrategia .est-barra { width: 130px; height: 8px; background: #24162b; border-radius: 4px; overflow: hidden; display: inline-block; vertical-align: middle; }
    #modal-estrategia .est-barra i { display: block; height: 100%; background: #f3a458; }
    #modal-estrategia .est-corpo { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 10px; }
    @media (orientation: portrait), (max-width: 700px) { #modal-estrategia .est-corpo { grid-template-columns: 1fr; overflow-y: auto; } }
    #modal-estrategia .est-mapa { position: relative; min-height: 200px; border-radius: 8px; overflow: hidden; background: #24162b center / cover; border: 1px solid var(--line, #6b4a52); }
    #modal-estrategia .est-mapa::before { content: ''; position: absolute; inset: 0; background: rgba(20, 10, 30, .35); }
    #modal-estrategia .est-slot { position: absolute; transform: translate(-50%, -60%); display: flex; flex-direction: column; align-items: center; gap: 2px; background: none; border: 0; color: #fff3e7; cursor: pointer; font: 700 11px system-ui, sans-serif; text-shadow: 0 1px 4px #000; padding: 2px; }
    #modal-estrategia .est-slot.sel .est-arte { outline: 2px solid #f3a458; outline-offset: 2px; border-radius: 10px; }
    #modal-estrategia .est-arte { display: block; width: var(--w, 76px); height: var(--w, 76px); }
    #modal-estrategia .est-arte img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 3px 5px #000a); }
    #modal-estrategia .est-poli { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 34px; background: #8e5b4755; border: 2px solid #8e5b47; clip-path: polygon(50% 4%, 94% 28%, 94% 72%, 50% 96%, 6% 72%, 6% 28%); }
    #modal-estrategia .est-lado { display: flex; flex-direction: column; min-height: 0; }
    #modal-estrategia .est-abas { flex: 0 0 auto; display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 6px; }
    #modal-estrategia .est-abas button[aria-selected="true"] { background: #f3a458; color: #21110c; border-color: #ffc78c; }
    #modal-estrategia .est-painel { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
    #modal-estrategia .est-bloco { background: #352238; border: 1px solid var(--line, #6b4a52); border-radius: 8px; padding: 9px; margin-bottom: 7px; font-size: 12.5px; line-height: 1.45; }
    #modal-estrategia .est-bloco h4 { margin: 0 0 4px; font-size: 13px; color: var(--gold, #f3c27a); }
    #modal-estrategia .est-bloco p { margin: 2px 0; }
    #modal-estrategia .est-linha { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    #modal-estrategia .est-linha button { min-height: 36px; font-size: 12px; }
    #modal-estrategia .muted { opacity: .7; }
    #modal-estrategia .ok { color: #4ade80; } #modal-estrategia .ruim { color: #fb7185; }
    #modal-estrategia .est-equipe { display: flex; flex-wrap: wrap; gap: 5px; margin: 5px 0; }
    #modal-estrategia .chip { border: 1px solid var(--line, #6b4a52); background: #24162b; color: inherit; border-radius: 8px; padding: 4px 7px; font-size: 11.5px; cursor: pointer; text-align: left; }
    #modal-estrategia .chip.on { background: #f3a45833; border-color: #f3a458; }
    #modal-estrategia .bat { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; gap: 6px; }
    #modal-estrategia .est-arena { position: relative; flex: 0 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 8px 6px; min-height: 0; flex: 1 1 auto; border-radius: 8px; background-size: cover; background-position: center; overflow: hidden; }
    #modal-estrategia .bat-lado { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: min-content; align-content: space-around; gap: 4px; }
    #modal-estrategia .un { position: relative; max-width: clamp(120px, 22vw, 210px); width: 100%; justify-self: center; display: flex; flex-direction: column; align-items: center; gap: 1px; background: rgba(20,10,28,.35); }
    #modal-estrategia .un-fig { display: block; width: 100%; height: clamp(64px, 20vh, 170px); } #modal-estrategia .un-fig img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 3px 2px rgba(0,0,0,.6)); }
    #modal-estrategia .bat-lado.i .un-fig img { transform: scaleX(-1); }
    #modal-estrategia .un .est-poli { font-size: 30px; line-height: 54px; display: block; }
    #modal-estrategia .un-nome { font-size: 10px; text-shadow: 0 1px 2px #000; } #modal-estrategia .un-hp { font-size: 9.5px; text-shadow: 0 1px 2px #000; } #modal-estrategia .un .hp { width: 100%; }
    #modal-estrategia .un-num { position: absolute; left: 50%; top: 10px; margin-left: -14px; font: 800 15px system-ui; text-shadow: 0 1px 3px #000; pointer-events: none; font-style: normal; z-index: 9; }
    #modal-estrategia .un-fx { position: absolute; left: 50%; top: 4px; width: 46px; height: 46px; margin-left: -23px; border-radius: 50%; pointer-events: none; z-index: 8; animation: est-fx .5s ease-out forwards; }
    #modal-estrategia .un-fx.golpe { background: radial-gradient(#fff, #fb7185 45%, transparent 70%); } #modal-estrategia .un-fx.hab { background: radial-gradient(#fff, #a78bfa 40%, #f3a458 60%, transparent 72%); width: 62px; height: 62px; margin-left: -31px; }
    #modal-estrategia .un-fx.cura { background: radial-gradient(#fff, #4ade80 45%, transparent 70%); } #modal-estrategia .un-fx.escudo { background: radial-gradient(transparent 50%, #60a5fa 62%, transparent 72%); }
    #modal-estrategia .un-proj { position: absolute; width: 14px; height: 14px; border-radius: 50%; background: radial-gradient(#fff, #a78bfa); box-shadow: 0 0 10px #a78bfa; pointer-events: none; z-index: 7; }
    @keyframes est-fx { from { transform: scale(.3); opacity: 1; } to { transform: scale(1.4); opacity: 0; } }
    #modal-estrategia .un { background: #24162b; border: 1px solid var(--line, #6b4a52); border-radius: 8px; padding: 4px; font-size: 10.5px; text-align: center; min-width: 0; cursor: default; color: inherit; }
    #modal-estrategia .un.morto { opacity: .35; } #modal-estrategia .un.vez { outline: 2px solid #f3a458; } #modal-estrategia .un.alvo { outline: 2px solid #fb7185; }
    #modal-estrategia .un .hp { height: 5px; background: #12091a; border-radius: 3px; overflow: hidden; margin-top: 3px; } #modal-estrategia .un .hp i { display: block; height: 100%; background: #4ade80; }
    #modal-estrategia .un.i .hp i { background: #fb7185; }
    #modal-estrategia .bat-log { flex: 0 0 auto; max-height: 14vh; min-height: 40px; overflow-y: auto; font-size: 11.5px; background: #24162b; border-radius: 6px; padding: 6px; }
    #modal-estrategia .bat-ctl { flex: 0 0 auto; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    #modal-estrategia .bat-ctl label { display: inline-flex; gap: 5px; align-items: center; font-size: 12px; background: #24162b; border-radius: 6px; padding: 5px 8px; }
    #estrategia-ind { position: fixed; left: 50%; top: 50px; transform: translateX(-50%); z-index: 8; display: none; align-items: center; gap: 8px; background: rgba(33,19,41,.95); border: 1px solid #c59c67; color: #fff3e7; border-radius: 99px; padding: 5px 8px 5px 12px; font: 600 12px system-ui, sans-serif; max-width: 94vw; }
    /* Tela cheia: mapa ocupa tudo; barras compactas por cima; painéis sob demanda */
    #modal-estrategia { padding: 0 !important; align-items: stretch !important; justify-content: stretch !important; }
    #modal-estrategia .est-card { position: fixed; inset: 0; width: 100%; max-width: none; height: 100dvh; max-height: none; border-radius: 0; border: 0; padding: 0; background: #1a0f22; }
    #modal-estrategia .modal-head { position: absolute; top: 0; left: 0; right: 0; z-index: 6; margin: 0; padding: 4px 10px; background: rgba(26, 15, 34, .86); backdrop-filter: blur(3px); gap: 6px; }
    #modal-estrategia .modal-head h3 { font-size: 14px; margin: 0; } #modal-estrategia .modal-head select { max-width: 46vw; }
    #modal-estrategia .est-topo { position: absolute; top: 40px; left: 0; right: 0; z-index: 5; margin: 0; padding: 4px 10px; background: rgba(26, 15, 34, .78); font-size: 11.5px; gap: 2px 12px; }
    #modal-estrategia .est-corpo { position: absolute; inset: 0; display: block; padding: 0; }
    #modal-estrategia .est-mapa { position: absolute; inset: 0; min-height: 0; border: 0; border-radius: 0; touch-action: none; cursor: grab; }
    #modal-estrategia .est-mapa::before { display: none; }
    #modal-estrategia .est-mundo { position: absolute; left: 0; top: 0; transform-origin: 0 0; background: center / 100% 100% no-repeat #24162b; }
    #modal-estrategia .est-slot.trancado { opacity: .55; }
    @media (max-width: 700px) { #modal-estrategia #est-titulo { display: none; } #modal-estrategia .modal-head select { max-width: 52vw; } #modal-estrategia .est-topo { font-size: 10.5px; } #modal-estrategia .est-barra { width: 70px; } }
    #modal-estrategia .est-zoom { position: absolute; right: 8px; top: 120px; z-index: 5; display: flex; flex-direction: column; gap: 6px; }
    #modal-estrategia .est-zoom button { width: 38px; height: 38px; padding: 0; font-size: 18px; }
    #modal-estrategia .est-lado { position: absolute; left: 0; right: 0; bottom: 0; z-index: 6; display: flex; flex-direction: column; align-items: center; pointer-events: none; }
    #modal-estrategia .est-lado > * { pointer-events: auto; }
    #modal-estrategia .est-painel { width: min(620px, 100%); max-height: 52dvh; margin: 0; padding: 8px 10px 4px; background: rgba(33, 19, 41, .96); border: 1px solid var(--line, #6b4a52); border-bottom: 0; border-radius: 12px 12px 0 0; }
    #modal-estrategia .est-abas { width: 100%; justify-content: center; margin: 0; padding: 6px 8px calc(6px + env(safe-area-inset-bottom, 0px)); background: rgba(26, 15, 34, .92); gap: 4px; }
    #modal-estrategia .est-abas button { min-height: 34px; font-size: 11.5px; padding: 4px 8px; }
    @media (max-height: 520px) { #modal-estrategia .bat .est-bloco { padding: 3px 8px; font-size: 11px; } #modal-estrategia .bat-log { max-height: 7vh; font-size: 10.5px; } #modal-estrategia .est-arena { min-height: 54vh; } #modal-estrategia .bat-ctl button, #modal-estrategia .bat-ctl label { min-height: 28px; padding: 2px 8px; font-size: 11px; } }
    #modal-estrategia .bat { position: absolute; inset: 0; padding: 44px 10px 6px; gap: 4px; background: #1a0f22; z-index: 7; overflow: auto; }
    #estrategia-ind button { min-height: 28px; padding: 2px 9px; font-size: 11.5px; }`;
  document.head.append(estilo);

  // Empilha os painéis do canto superior esquerdo (HUD → missão → buffs) pela altura real, para um não cobrir o outro
  (function empilhar() {
    const hud = document.getElementById('hud'), qb = document.getElementById('quest-banner'), bf = document.getElementById('barra-buffs');
    if (!hud || !qb) return;
    const ajustar = () => {
      const h = hud.getBoundingClientRect(); qb.style.top = `${Math.round(h.bottom + 6)}px`;
      if (bf) { const q = qb.getBoundingClientRect(); bf.style.top = `${Math.round((getComputedStyle(qb).display === 'none' ? h.bottom : q.bottom) + 6)}px`; }
    };
    if (window.ResizeObserver) { const ro = new ResizeObserver(ajustar); [hud, qb].forEach((e) => ro.observe(e)); }
    addEventListener('resize', ajustar); setInterval(ajustar, 1500); ajustar();
  })();

  const modal = document.createElement('div');
  modal.id = 'modal-estrategia'; modal.className = 'modal-bg';
  modal.innerHTML = `<div class="modal-card est-card" role="dialog" aria-modal="true">
    <header class="modal-head"><h3 id="est-titulo">Estratégia</h3><select id="est-reino" aria-label="Reino" style="margin-left:auto;margin-right:8px"></select><button class="btn-sec" id="est-voltar" style="margin-right:6px">↩ Campanha</button><button class="btn-fechar" id="est-fechar" aria-label="Fechar">✕</button></header>
    <div class="est-topo" id="est-topo"></div>
    <div class="est-corpo" id="est-corpo"><div class="est-mapa" id="est-mapa"><div class="est-mundo" id="est-mundo"></div><div class="est-zoom"><button class="btn-sec" data-zoom="1" aria-label="Aproximar">＋</button><button class="btn-sec" data-zoom="-1" aria-label="Afastar">－</button></div></div><div class="est-lado"><div class="est-painel" id="est-painel"></div><nav class="est-abas" id="est-abas"></nav></div></div>
    <div class="bat" id="est-bat" hidden></div></div>`;
  document.body.append(modal);
  const ind = document.createElement('div'); ind.id = 'estrategia-ind'; document.body.append(ind);
  const $ = (id) => modal.querySelector(id);

  // ---------- topo e mapa ----------
  function proximaObra(s) {
    let melhor = null;
    for (const e of D.estruturas) {
      const locais = locaisAtivos(s, D).filter((l) => l.categoria === e.categoria);
      for (const l of locais) {
        const at = s.estruturas[l.id]; const nivel = (at?.nivel || 0) + 1;
        if (nivel > e.niveis) continue;
        const custo = custoDoNivel(e, nivel), f = falta(custo, s.materiais);
        const total = Object.values(f).reduce((a, b) => a + b, 0);
        if (!melhor || total < melhor.total) melhor = { e, nivel, f, total };
      }
    }
    return melhor;
  }
  function desenharTopo() {
    const s = estado(), p = prosperidade(s, D), po = proximaObra(s);
    const mat = Object.entries(D.materiais).map(([k, m]) => `${m.icone} ${m.nome} <b>${s.materiais[k] || 0}</b>`).join(' · ');
    let obra = 'Todas as obras concluídas.';
    if (po) {
      const lista = Object.entries(po.f).map(([k, v]) => `${v} ${D.materiais[k].nome.toLowerCase()}`).join(' e ');
      const rota = Object.keys(po.f).length ? D.rotas.find((r) => r.material === Object.entries(po.f).sort((a, b) => b[1] - a[1])[0][0]) : null;
      obra = lista ? `Próxima obra: <b>${esc(po.e.nome)} nv.${po.nivel}</b>, faltam ${lista}${rota ? ` · rota recomendada: ${rota.icone} ${esc(rota.nome)}` : ''}` : `Próxima obra: <b>${esc(po.e.nome)} nv.${po.nivel}</b>, pronta para construir!`;
    }
    $('#est-topo').innerHTML = `<span>Prosperidade <b>${p.total}</b>/100 <span class="est-barra"><i style="width:${p.total}%"></i></span></span><span>${mat}</span><span>${obra}</span>`;
  }
  function desenharMapa() {
    const s = estado(), m = $('#est-mundo'), ativos = new Set(locaisAtivos(s, D).map((l) => l.id));
    m.style.backgroundImage = `url(../../../${D.fundo})`;
    m.innerHTML = D.locais.map((l) => {
      const cat = D.estruturas.find((e) => e.categoria === l.categoria);
      if (!ativos.has(l.id)) return `<button class="est-slot trancado" style="left:${l.pos[0]}%;top:${l.pos[1]}%;--w:44px" data-trancado="${l.id}" aria-label="Terreno bloqueado"><span class="est-poli" style="font-size:20px">🔒</span><span>Prefeitura nv.${l.nivelPrincipal}</span></button>`;
      const at = s.estruturas[l.id], def = at && estrDe(at.tipo), emObra = gestaoDe(s).obras.find((o) => o.loc === l.id);
      const vis = def ? def.visual.niveis[at.nivel - 1] : cat.visual.vazio;
      const nome = def ? `${def.nome} nv.${at.nivel}` : (cat.visual.vazio.nome || 'Terreno livre');
      const w = Math.round(76 * (vis.escala || 1));
      return `<button class="est-slot ${slotSel === l.id ? 'sel' : ''}" style="left:${l.pos[0]}%;top:${l.pos[1]}%;--w:${w}px" data-slot="${l.id}">${img(vis, def ? def.emoji : '⬚', nome)}<span>${esc(nome)}${emObra ? ' ⏳' : ''}</span></button>`;
    }).join('');
    ajustarCamera();
  }
  // Câmera de cima: arrastar move, roda/pinça dá zoom. O mapa sempre cobre a área do jogo.
  const cam = { x: 0, y: 0, z: 1 };
  function dimensoes() { const v = $('#est-mapa'); const W = v.clientWidth, H = v.clientHeight; const base = Math.max(W / 1600, H / 900); return { W, H, mw: 1600 * base, mh: 900 * base }; }
  function ajustarCamera() {
    const { W, H, mw, mh } = dimensoes(); const m = $('#est-mundo');
    if (!W || !H) return;
    const hd = modal.querySelector('.modal-head'), tp = $('#est-topo'); if (hd && tp) tp.style.top = `${hd.offsetHeight}px`;
    cam.z = Math.max(1, Math.min(3, cam.z));
    const w = mw * cam.z, h = mh * cam.z;
    cam.x = Math.min(0, Math.max(W - w, cam.x)); cam.y = Math.min(0, Math.max(H - h, cam.y));
    m.style.width = `${mw}px`; m.style.height = `${mh}px`;
    m.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.z})`;
  }
  function zoomEm(fator, cx, cy) {
    const antes = cam.z; cam.z = Math.max(1, Math.min(3, cam.z * fator)); const k = cam.z / antes;
    cam.x = cx - (cx - cam.x) * k; cam.y = cy - (cy - cam.y) * k; ajustarCamera();
  }
  (function ligarCamera() {
    const v = $('#est-mapa'); const dedos = new Map(); let moveu = false, dist0 = 0;
    v.addEventListener('pointerdown', (e) => { dedos.set(e.pointerId, { x: e.clientX, y: e.clientY }); moveu = false; if (dedos.size === 2) { const [a, b] = [...dedos.values()]; dist0 = Math.hypot(a.x - b.x, a.y - b.y); } });
    v.addEventListener('pointermove', (e) => {
      const d = dedos.get(e.pointerId); if (!d) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (dedos.size === 1) { if (!moveu && Math.hypot(dx, dy) < 6) return; moveu = true; cam.x += dx; cam.y += dy; ajustarCamera(); }
      else if (dedos.size === 2) {
        moveu = true; dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const [a, b] = [...dedos.values()], dist = Math.hypot(a.x - b.x, a.y - b.y); const r = v.getBoundingClientRect();
        if (dist0 > 0) zoomEm(dist / dist0, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top); dist0 = dist; return;
      }
      dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    });
    const solta = (e) => { dedos.delete(e.pointerId); if (dedos.size < 2) dist0 = 0; setTimeout(() => { if (!dedos.size) moveu = false; }, 0); };
    v.addEventListener('pointerup', solta); v.addEventListener('pointercancel', solta); v.addEventListener('lostpointercapture', solta);
    v.addEventListener('wheel', (e) => { e.preventDefault(); const r = v.getBoundingClientRect(); zoomEm(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    // depois de arrastar, o toque que termina o gesto não deve abrir um terreno
    v.addEventListener('click', (e) => { if (moveu) { e.stopPropagation(); e.preventDefault(); } }, true);
    window.addEventListener('resize', () => { if (modal.classList.contains('aberto')) ajustarCamera(); });
  })();

  // ---------- painéis dos menus ----------
  const abas = ['gestao', 'principal', 'aldeias', 'refugios', 'exercitos', 'hospitais', 'expedicoes'];
  const rotuloAba = (a) => (a === 'gestao' ? '⚙️ Gestão' : `${D.categorias[a].icone} ${D.categorias[a].nome}`);
  function desenharAbas() {
    $('#est-abas').innerHTML = `<button class="btn-pri" data-coletar="um" aria-label="Coletar tudo">📦 Coletar tudo</button>` + abas.map((a) => `<button class="btn-sec" role="tab" aria-selected="${drawer && a === aba}" data-aba="${a}">${esc(rotuloAba(a))}</button>`).join('');
  }
  function painelCategoria() {
    const s = estado(), cat = D.categorias[aba];
    const locais = locaisAtivos(s, D).filter((l) => l.categoria === aba);
    const est = D.estruturas.find((e) => e.categoria === aba);
    let h = `<div class="est-bloco"><h4>${cat.icone} ${esc(cat.nome)}</h4><p>${esc(cat.descricao)}</p><p class="muted">${esc(est.beneficio)}</p></div>`;
    if (aba === 'refugios') { const n = window.regiaoMundo?.estado?.().mundo?.['05']?.refugios?.length || 0; h += `<div class="est-bloco"><h4>Proteção atual</h4><p>${n} abrigo(s) ativo(s): proteção contra a praga <b>${Math.min(60, n * 20)}%</b>. Descanso: as equipes saem com vida extra.</p></div>`; }
    if (aba === 'exercitos') { const b = bonusDaCidade(s, D); h += `<div class="est-bloco"><h4>Defesa da cidade</h4><p>Guarnição: <b>+${Math.round(b.atk * 100)}%</b> de ataque e <b>+${Math.round(b.def * 100)}%</b> de defesa nas expedições. Equipes disponíveis: ${roster().length} Onírico(s).</p></div>`; }
    if (aba === 'hospitais') { const b = bonusDaCidade(s, D); h += `<div class="est-bloco"><h4>Tratamento</h4><p>Entre as fases, cada Onírico recupera <b>${Math.round(b.cura * 100)}%</b> da vida. Capacidade: ${(s.estruturas.h1?.nivel || 0)} leito(s) de nível.</p></div>`; }
    for (const l of locais) {
      const at = s.estruturas[l.id]; const nivel = (at?.nivel || 0) + 1;
      const rotulo = at ? `${est.nome} nv.${at.nivel}` : 'Terreno livre';
      if (nivel > est.niveis) { h += `<div class="est-bloco"><h4>${esc(rotulo)}</h4><p class="ok">Nível máximo.</p></div>`; continue; }
      const custo = custoDoNivel(est, nivel), f = falta(custo, s.materiais), ok = !Object.keys(f).length;
      const gp = est.prosperidade[nivel - 1];
      const emObra = gestaoDe(s).obras.find((o) => o.loc === l.id);
      if (emObra) { h += `<div class="est-bloco"><h4>${esc(rotulo)} → nv.${emObra.nivel} em obra</h4><p>⏳ ${dur(emObra.fimEm - Date.now())} restantes.</p></div>`; continue; }
      const abrir = false;
      h += `<div class="est-bloco"><h4>${esc(rotulo)} → ${at ? 'melhorar para' : 'construir'} nv.${nivel}</h4>
        <p>Custo: ${custoTxt(custo)} · ⏱️ ${dur(duracaoDaObra(est, nivel))}</p><p>Benefício: ${esc(est.beneficio)} <b>+${gp} de prosperidade</b>.</p>
        <p class="${ok ? 'ok' : 'ruim'}">${ok ? 'Materiais suficientes.' : `Faltam ${custoTxt(f)}.`}</p>
        ${abrir ? `<div class="est-linha"><button class="btn-pri" data-confirmar="${l.id}">Confirmar obra</button><button class="btn-sec" data-cancelar="1">Cancelar</button></div>` : `<div class="est-linha"><button class="btn-pri" data-obra="${l.id}" ${ok ? '' : 'disabled'}>${at ? 'Melhorar' : 'Construir'}</button></div>`}</div>`;
    }
    const p = prosperidade(s, D);
    h += `<div class="est-bloco"><h4>De onde vem a prosperidade (${p.total})</h4>${p.itens.map((i) => `<p>• ${esc(i.origem)}: <b>+${i.valor}</b></p>`).join('')}</div>`;
    return h;
  }
  function equipeAtual(s) {
    const r = roster(); const ids = (s.exp?.equipe || s.equipeSel || []).filter((id) => r.some((m) => m.id === id));
    return { r, ids };
  }
  function painelExpedicoes() {
    const s = estado(), exp = s.exp; const { r, ids } = equipeAtual(s);
    if (!s.equipeSel) s.equipeSel = r.slice(0, s.vagas).map((m) => m.id);
    const sel = (exp?.equipe || s.equipeSel).filter((id) => r.some((m) => m.id === id));
    let h = `<div class="est-bloco"><h4>🧭 Equipe (${sel.length}/${s.vagas} vagas · máximo 6)</h4><p class="muted">Toque para escolher os Oníricos. Cada fase vencida pela primeira vez abre uma vaga nova. Os Oníricos vêm do gacha e dos ovos. Suporte cura, defesa atrai golpes, ataque causa dano. Níveis e habilidades são os do seu time na Campanha e no Idle.</p><div class="est-equipe">${r.map((m) => { const pa = D.papeis[m.especie] || 'ataque'; return `<button class="chip ${sel.includes(m.id) ? 'on' : ''}" data-membro="${m.id}">${PAPEL[pa].i} ${esc(m.especie)} nv.${m.nivel}<br><span class="muted">${PAPEL[pa].n}</span></button>`; }).join('')}</div></div>`;
    if (exp && exp.estado !== 'parada') {
      const rota = rotaDe(exp.rota);
      h += `<div class="est-bloco"><h4>${rota.icone} ${esc(rota.nome)} em andamento</h4><p>Fase ${exp.fase + 1}/${rota.fases.length}: ${esc(rota.fases[exp.fase].nome)} · estado: <b>${estadoTxt(exp)}</b></p><p>Ganhos até agora: ${Object.keys(exp.ganhos).length ? custoTxt(exp.ganhos) : 'nenhum'}</p><div class="est-linha">${batalha && exp.estado === 'batalha' ? '<button class="btn-pri" data-ver="1">Ver combate</button>' : botoesPausa(exp)}<button class="btn-sec" data-parar="1">Encerrar expedição</button></div></div>`;
      return h;
    }
    const equipeObj = sel.map((id) => r.find((m) => m.id === id));
    for (const rota of D.rotas) {
      h += `<div class="est-bloco"><h4>${rota.icone} ${esc(rota.nome)} · material: ${D.materiais[rota.material].icone} ${esc(D.materiais[rota.material].nome)}</h4><p class="muted">${esc(rota.descricao)}</p>`;
      rota.fases.forEach((f, i) => {
        const d = equipeObj.length ? dificuldadeDaFase(f, equipeObj, D.papeis) : { rotulo: 'Sem equipe', cor: '#999' };
        h += `<p>${i + 1}. ${esc(f.nome)} · ${f.inimigos[0]}–${f.inimigos[1]} inimigos nv.${f.nivel[0]}–${f.nivel[1]} · <b style="color:${d.cor}">${d.rotulo}</b> · ${D.materiais[f.material.tipo].icone} ${f.material.faixa[0]}–${f.material.faixa[1]}${f.libera ? ` · 1ª vitória: avista ${esc(f.libera.inimigo)} e abre +1 vaga${s.recrutados[`${rota.id}:${i}`] ? ' ✓' : ''}` : ''}</p>`;
      });
      h += `<div class="est-linha"><button class="btn-pri" data-iniciar="${rota.id}" ${equipeObj.length ? '' : 'disabled'}>Partir</button></div></div>`;
    }
    return h;
  }
  // botões de uma expedição parada (por exemplo, depois de recarregar a página)
const botoesPausa = (exp) => ({
  vitoria: '<button class="btn-sec" data-equipe="1">Ajustar equipe</button><button class="btn-pri" data-prox="1">Próxima fase</button>',
  preparando: '<button class="btn-pri" data-retomar="1">Retomar a fase</button>',
  derrota: '<button class="btn-pri" data-fim="1">Voltar à cidade</button>',
  fim: '<button class="btn-pri" data-fim="1">Concluir rota</button>',
}[exp.estado] || '<button class="btn-pri" data-ver="1">Ver combate</button>');
const estadoTxt = (exp) => ({ preparando: 'pronta para a próxima fase', batalha: 'em combate', vitoria: 'fase vencida', derrota: 'derrota', fim: 'rota concluída', parada: 'encerrada' }[exp.estado] || exp.estado);

  function desenharPainel() {
    desenharAbas();
    $('#est-painel').hidden = !drawer; $('#est-painel').innerHTML = !drawer ? '' : aba === 'expedicoes' ? painelExpedicoes() : aba === 'gestao' ? painelGestao() : painelCategoria();
  }
  function desenharCabecalho() {
    $('#est-titulo').textContent = `Estratégia · ${D.titulo}`;
    $('#est-reino').innerHTML = REINOS_D.map((x) => `<option value="${x.id}" ${x === D ? 'selected' : ''}>${desbloqueado(x) ? '' : `🔒 `}${esc(x.titulo)}${desbloqueado(x) ? '' : ` (${progressoDesbloqueio(x).atual}/${progressoDesbloqueio(x).meta} terrenos)`}</option>`).join('');
    $('#est-reino').hidden = REINOS_D.length < 2;
  }
  function desenhar() {
    desenharCabecalho();
    $('#est-corpo').hidden = visao !== 'cidade'; $('#est-bat').hidden = visao !== 'batalha';
    desenharTopo();
    if (visao === 'cidade') { desenharMapa(); desenharPainel(); } else desenharBatalha();
  }

  // ---------- obra ----------
  function aoConcluirObra(Dx, o) {
    const est = Dx.estruturas.find((e) => e.id === o.tipo), pros = est.prosperidade[o.nivel - 1] || 0;
    const mundo = window.regiaoMundo?.estado?.().mundo;
    if (Dx.id === 'r1') {
      const v = mundo?.['01']?.norte; if (v) v.prosperidade = Math.min(100, (v.prosperidade || 0) + pros);
      if (est.protecaoPraga && mundo?.['05']) mundo['05'].refugios.push({ nome: `Abrigo de ${Dx.titulo}`, abrigados: 0 });
    }
    const meta = window.regiaoMundo?.estado?.().meta;
    if (meta) { meta.diario = meta.diario || []; meta.diario.push({ dia: meta.dia, t: `${Dx.titulo}: ${est.nome} nv.${o.nivel} concluído (+${pros} de prosperidade).` }); }
    return `${est.nome} nv.${o.nivel} (+${pros} de prosperidade)`;
  }
  // Atualiza todos os reinos pelo tempo decorrido; cada obra/lote concluído aparece uma única vez
  function processar(avisar = true) {
    const feitos = [];
    for (const Dx of REINOS_D) {
      const s = estado(Dx), ev = avancar(s, Dx);
      for (const o of ev.concluidas) feitos.push(`${Dx.id === D.id ? '' : Dx.titulo + ': '}${aoConcluirObra(Dx, o)}`);
      for (const l of ev.fabricados) feitos.push(`Lote pronto: ${l.qtd}× ${Dx.gestao.receitas.find((r) => r.id === l.receita).nome}`);
    }
    if (feitos.length) { salvar(); atualizarHud?.(); if (avisar) mostrarToast(`🏗️ Concluído: ${feitos.join(' · ')}`, 4200); }
    return feitos;
  }
  const dur = (ms) => { const t = Math.max(0, Math.ceil(ms / 1000)); return t >= 3600 ? `${Math.floor(t / 3600)}h${String(Math.floor((t % 3600) / 60)).padStart(2, '0')}` : t >= 60 ? `${Math.floor(t / 60)}min${String(t % 60).padStart(2, '0')}s` : `${t}s`; };
  const diamantes = { get valor() { return getSave().recompensas?.diamantes || 0; }, set valor(v) { getSave().recompensas.diamantes = v; } };
  const matTxt = (c, Dx = D) => Object.entries(c).map(([k, v]) => `${Dx.materiais[k]?.icone || Dx.gestao.itens[k]?.icone || ''} ${v} ${Dx.materiais[k]?.nome || Dx.gestao.itens[k]?.nome || k}`).join(' · ') || 'nada';
  function resumoLote(titulo, partes) { resumoUlt = { titulo, partes }; salvar(); atualizarHud?.(); desenhar(); mostrarToast(`${titulo}: ${partes.map((x) => x.t).join(' | ')}`, 5200); }
  function fazerObra(slotId) {
    processar(false);
    const s = estado(), est = D.estruturas.find((e) => e.categoria === D.locais.find((x) => x.id === slotId).categoria);
    const r = enfileirarObras(s, D, [slotId]);
    confirmar = null;
    if (r.pendentes.length) { mostrarToast(r.pendentes[0].motivo + (r.pendentes[0].falta ? ` ${custoTxt(r.pendentes[0].falta)}` : ''), 3000); desenhar(); return; }
    const o = r.entraram[0]; selObras.delete(slotId);
    mostrarToast(`🏗️ ${est.nome} nv.${o.nivel} em obra (${dur(o.fimEm - Date.now())}). Custo: ${custoTxt(o.custo)}.`, 3400);
    salvar(); atualizarHud?.(); desenhar();
  }
  function enfileirarSelecionadas() {
    processar(false);
    const s = estado(), r = enfileirarObras(s, D, [...selObras]);
    selObras.clear();
    resumoLote('Obras', [
      { t: r.entraram.length ? `entraram ${r.entraram.length}: ${r.entraram.map((o) => `${D.estruturas.find((e) => e.id === o.tipo).nome} nv.${o.nivel}`).join(', ')} (custo ${matTxt(r.custo)})` : 'nenhuma entrou' },
      ...r.pendentes.map((p) => ({ t: `pendente ${p.loc}: ${p.motivo}${p.falta ? ' ' + custoTxt(p.falta) : ''}` })),
    ]);
  }
  function coletar(todos) {
    processar(false);
    const lista = todos ? REINOS_D.filter(desbloqueado) : [D];
    const rec = {}, pend = {};
    for (const Dx of lista) {
      const r = coletarTudo(estado(Dx), Dx);
      for (const [k, v] of Object.entries(r.recebido)) { const n = `${Dx.materiais[k].icone} ${Dx.materiais[k].nome}`; rec[n] = (rec[n] || 0) + v; }
      for (const [k, v] of Object.entries(r.pendente)) { const n = `${Dx.materiais[k].icone} ${Dx.materiais[k].nome}`; pend[n] = (pend[n] || 0) + v; }
    }
    const f = (o) => Object.entries(o).map(([k, v]) => `${v} ${k}`).join(' · ');
    const partes = [{ t: Object.keys(rec).length ? `recebido ${f(rec)}` : 'nada pronto para coletar' }];
    if (Object.keys(pend).length) partes.push({ t: `pendente (estoque cheio): ${f(pend)}` });
    resumoLote(todos ? 'Coleta de todos os reinos' : 'Coleta', partes);
  }
  function fabricar(repetir) {
    processar(false);
    const s = estado(), r = repetir ? repetirUltimoLote(s, D) : fabricarLote(s, D, loteRec, loteQtd);
    if (!r.ok) { mostrarToast(r.motivo + (r.falta ? ` Faltam ${matTxt(r.falta)}.` : ''), 3200); desenhar(); return; }
    resumoLote('Fabricação', [{ t: `lote na fila: ${matTxt(r.previsao.saida)} (usou ${matTxt(r.previsao.insumos)}, ${dur(r.previsao.duracao)})` }]);
  }
  function progressoDesbloqueio(Dx) { const de = REINOS_D.find((x) => x.id === Dx.desbloqueio.de); return { atual: Object.keys(estado(de).estruturas).length, meta: Dx.desbloqueio.terrenos }; }
  function progressoDesbloqueio_(Dx) { return progressoDesbloqueio(Dx); }
  function desbloqueado(Dx) { if (!Dx.desbloqueio) return true; const p = progressoDesbloqueio(Dx); return p.atual >= p.meta; }
  function trocarReino(id) {
    const novo = REINOS_D.find((x) => x.id === id); if (!novo || novo === D) return;
    if (estado().exp) { mostrarToast('Encerre a expedição atual antes de trocar de reino.', 2800); desenhar(); return; }
    if (!desbloqueado(novo)) { mostrarToast(`🔒 ${novo.desbloqueio.texto} (${progressoDesbloqueio(novo).atual}/${progressoDesbloqueio(novo).meta})`, 2800); desenhar(); return; }
    D = novo; slotSel = null; confirmar = null; batalha = null; visao = 'cidade'; desenhar();
  }
  function painelGestao() {
    const s = estado(), g = gestaoDe(s), agora = Date.now(); let h = '';
    if (resumoUlt) h += `<div class="est-bloco" style="border-color:#f3a458"><h4>Resumo: ${esc(resumoUlt.titulo)}</h4>${resumoUlt.partes.map((x) => `<p>• ${esc(x.t)}</p>`).join('')}</div>`;
    const pronto = prontoParaColetar(s, D);
    h += `<div class="est-bloco"><h4>📦 Produção pronta</h4><p>${Object.keys(pronto).length ? Object.entries(pronto).map(([loc, it]) => `${esc(estrDe(s.estruturas[loc].tipo).nome)}: ${D.materiais[it.tipo].icone} ${it.qtd}`).join(' · ') : 'Nada pronto ainda. Os prédios produzem com o tempo, mesmo com o jogo fechado.'}</p><p class="muted">Estoque: ${Object.keys(D.materiais).map((k) => `${D.materiais[k].icone} ${s.materiais[k] || 0}/${capacidade(D, k)}`).join(' · ')}${Object.keys(g.itens).length ? ' · ' + Object.entries(g.itens).map(([k, v]) => `${D.gestao.itens[k]?.icone || ''} ${v}`).join(' · ') : ''}</p>
      <div class="est-linha"><button class="btn-pri" data-coletar="um">Coletar tudo deste reino</button><button class="btn-sec" data-coletar="todos">Coletar de todos os reinos</button></div></div>`;
    const cands = candidatasObra(s, D);
    h += `<div class="est-bloco"><h4>🏗️ Obras (${g.obras.length}/${D.gestao.vagasObra} vagas)</h4>`;
    for (const o of g.obras) {
      const est = estrDe(o.tipo), ac = confAcel === o.id;
      h += `<p>⏳ ${esc(est.nome)} nv.${o.nivel}: ${dur(o.fimEm - agora)} restantes ${ac ? `<button class="btn-pri" data-acel-ok="${o.id}">Gastar ${custoAceleracao(o, agora)}💎</button><button class="btn-sec" data-acel-no="1">Cancelar</button>` : `<button class="btn-sec" data-acel="${o.id}">Acelerar</button>`}</p>`;
    }
    const total = {};
    for (const c of cands) {
      if (c.maximo) continue;
      const marcado = selObras.has(c.loc), ok = !Object.keys(falta(c.custo, s.materiais)).length;
      if (marcado) for (const [k, v] of Object.entries(c.custo)) total[k] = (total[k] || 0) + v;
      h += `<label class="est-sel" style="display:block;margin:3px 0"><input type="checkbox" data-selobra="${c.loc}" ${marcado ? 'checked' : ''}> ${esc(c.est.nome)} (${c.loc}) → nv.${c.nivel} · ${custoTxt(c.custo)} · ⏱️ ${dur(c.duracao)}${c.emObra ? ' · na fila' : ''}${ok ? '' : ' <span class="ruim">· faltam materiais</span>'}</label>`;
    }
    const f = falta(total, s.materiais);
    h += `<p>Selecionadas: <b>${selObras.size}</b> · custo total ${matTxt(total)}${Object.keys(f).length ? ` <span class="ruim">(faltam ${custoTxt(f)})</span>` : ''}</p><div class="est-linha"><button class="btn-pri" data-enfileirar="1" ${selObras.size ? '' : 'disabled'}>Enfileirar selecionadas</button></div><p class="muted">Cada obra também pode ser feita sozinha na aba do prédio.</p></div>`;
    if (!loteRec || !D.gestao.receitas.some((r) => r.id === loteRec)) loteRec = D.gestao.receitas[0].id;
    const pv = previsaoLote(s, D, loteRec, loteQtd);
    h += `<div class="est-bloco"><h4>🛠️ Oficina (${g.fabricacao.length}/${D.gestao.filaFabricacao} lotes)</h4><div class="est-linha">${D.gestao.receitas.map((r) => `<button class="${r.id === loteRec ? 'btn-pri' : 'btn-sec'}" data-rec="${r.id}">${r.icone} ${esc(r.nome)}</button>`).join('')}</div>
      <p>Quantidade: <button class="btn-sec" data-qtd="-1">−</button> <b>${loteQtd}</b> <button class="btn-sec" data-qtd="1">+</button> <button class="btn-sec" data-qtd="5">+5</button></p>
      <p>Produzirá <b>${matTxt(pv.saida)}</b> usando ${matTxt(pv.insumos)} · ⏱️ ${dur(pv.duracao)}</p>${pv.ok ? '' : `<p class="ruim">Faltam ${matTxt(pv.falta)}.</p>`}
      <div class="est-linha"><button class="btn-pri" data-fabricar="1" ${pv.ok ? '' : 'disabled'}>Fabricar lote</button><button class="btn-sec" data-repetir="1" ${g.ultimoLote ? '' : 'disabled'}>${g.ultimoLote ? `Repetir último lote (${g.ultimoLote.qtd}× ${esc(D.gestao.receitas.find((r) => r.id === g.ultimoLote.receita).nome)})` : 'Repetir último lote'}</button></div>
      ${g.fabricacao.map((l) => { const rc = D.gestao.receitas.find((r) => r.id === l.receita); return `<p>${l.inicio ? '⚙️' : '⏸️'} ${l.qtd}× ${esc(rc.nome)} ${l.inicio ? `· ${dur(l.inicio + rc.seg * 1000 * l.qtd - agora)} restantes` : '· aguardando'}</p>`; }).join('')}</div>`;
    const r = roster(); const prods = Object.entries(s.estruturas).filter(([, e]) => estrDe(e.tipo).producao);
    if (prods.length) h += `<div class="est-bloco"><h4>👷 Oníricos em serviço (+10% de produção)</h4>${prods.map(([loc, e]) => { const m = r.find((x) => x.id === s.trabalho[loc]); return `<p>${esc(estrDe(e.tipo).nome)} (${loc}): <button class="btn-sec" data-trab="${loc}">${m ? esc(m.especie) : 'ninguém'} ▸</button></p>`; }).join('')}<p class="muted">Quem trabalha continua livre para o combate e para outros reinos.</p></div>`;
    h += `<div class="est-bloco"><h4>Registro</h4>${g.log.slice(-6).reverse().map((x) => `<p class="muted">#${x.id} ${esc(x.t)}</p>`).join('') || '<p class="muted">Sem eventos ainda.</p>'}</div>`;
    return h;
  }

  // ---------- expedição ----------
  function iniciarExpedicao(rotaId) {
    const s = estado(); const r = roster();
    const equipe = (s.equipeSel || []).filter((id) => r.some((m) => m.id === id)).slice(0, s.vagas);
    if (!equipe.length) { mostrarToast('Escolha ao menos um Onírico para partir.', 2600); return; }
    s.exp = novaExpedicao(rotaId, equipe);
    diario(`expedição "${rotaDe(rotaId).nome}" partiu com ${equipe.length} Onírico(s).`);
    salvar(); comecarFase();
  }
  function comecarFase(manterHp = null) {
    const s = estado(), exp = s.exp, rota = rotaDe(exp.rota), fase = rota.fases[exp.fase], r = roster();
    const bonus = bonusDaCidade(s, D);
    const al = exp.equipe.map((id, i) => { const m = r.find((x) => x.id === id); return criarUnidade({ id: `a${i}`, especie: m.especie, nivel: m.nivel, lado: 'a', papeis: D.papeis, bonus }); });
    if (manterHp) al.forEach((u, i) => { const h = manterHp[exp.equipe[i]]; if (h != null) u.hp = Math.max(1, Math.min(u.hpMax, Math.round(h * u.hpMax + u.hpMax * bonus.cura))); });
    batalha = criarBatalha(al, gerarInimigos(fase, D.papeis, rng, Object.keys(s.inimigosLiberados)));
    if (D.arteInimigo) batalha.inimigos.forEach((u) => { u.arte = D.arteInimigo(u.especie, exp.fase); });
    batalha.log.push(`Fase ${exp.fase + 1}: ${fase.nome}. ${batalha.inimigos.length} inimigo(s) à frente.`);
    exp.estado = 'batalha'; alvoSel = null; visao = 'batalha';
    salvar(); iniciarTick(); desenhar();
    if (!minimizado && !modal.classList.contains('aberto')) { /* aberto só pelo jogador */ }
  }
  function terminarFase() {
    const s = estado(), exp = s.exp, rota = rotaDe(exp.rota);
    if (batalha.fim === 'vitoria') {
      const rec = pagarFase(exp, rota, exp.fase, s.materiais, rng); // null se já paga: nunca duplica
      const fase = rota.fases[exp.fase];
      if (rec) {
        batalha.log.push(`Vitória! ${custoTxt(rec)}.`);
        const chave = `${rota.id}:${exp.fase}`;
        if (fase.libera && !s.recrutados[chave]) {
          s.recrutados[chave] = true; // só a primeira vitória de cada fase libera
          const novoInimigo = !s.inimigosLiberados[fase.libera.inimigo];
          s.inimigosLiberados[fase.libera.inimigo] = true;
          const vagaAntes = s.vagas; s.vagas = Math.min(6, s.vagas + 1);
          exp.liberados.push(fase.libera.inimigo);
          batalha.log.push(`${novoInimigo ? `Novo inimigo avistado: ${fase.libera.inimigo}. ` : ''}${s.vagas > vagaAntes ? `Vaga de equipe liberada (${s.vagas}/6)!` : 'Equipe já está no máximo de vagas.'}`);
          mostrarToast(`🆕 ${novoInimigo ? `${fase.libera.inimigo} avistado como inimigo. ` : ''}${s.vagas > vagaAntes ? `Vaga de equipe ${s.vagas}/6!` : ''}`, 3800);
          diario(`${fase.libera.inimigo} avistado; vagas de equipe ${s.vagas}/6.`);
        }
      }
      exp.hpPct = {}; exp.equipe.forEach((id, i) => { const u = batalha.aliados[i]; exp.hpPct[id] = u.hp > 0 ? u.hp / u.hpMax : 0.5; });
      const ultima = exp.fase >= rota.fases.length - 1;
      exp.estado = ultima ? 'fim' : 'vitoria';
      if (ultima) diario(`expedição "${rota.nome}" concluída (${custoTxt(exp.ganhos)}).`);
      salvar(); atualizarHud?.();
      if (!ultima && exp.autoAvancar) { clearTimeout(timerProx); timerProx = setTimeout(() => proximaFase(true), Math.max(150, ritmoMs * 2)); }
    } else {
      exp.estado = 'derrota'; diario(`expedição "${rota.nome}" terminou em derrota na fase ${exp.fase + 1}.`);
      salvar();
    }
    if (minimizado || !modal.classList.contains('aberto')) mostrarToast(`🧭 ${rota.nome}: ${exp.estado === 'derrota' ? 'derrota' : exp.estado === 'fim' ? 'rota concluída' : `fase ${exp.fase + 1} vencida`}`, 2800);
    desenhar(); desenharInd();
  }
  function proximaFase(automatico = false) {
    const s = estado(), exp = s.exp;
    if (!exp || exp.estado !== 'vitoria') return;
    exp.fase++;
    if (automatico) { // recrutas liberados entram na equipe se ainda houver vaga
      const r = roster(); for (const m of r) if (exp.equipe.length < s.vagas && !exp.equipe.includes(m.id)) exp.equipe.push(m.id);
    } else s.equipeSel = exp.equipe;
    comecarFase(exp.hpPct);
  }
  function iniciarTick() {
    clearInterval(timerTick);
    timerTick = setInterval(tick, ritmoMs);
  }
  function tick() {
    const s = estado(), exp = s.exp;
    if (!exp || exp.estado !== 'batalha' || !batalha || batalha.fim) return;
    const u = atorAtual(batalha);
    if (!u) return;
    if (u.lado === 'i' || exp.autoAtaque) executar(batalha, decidir(batalha, u, rng), rng);
    else { if (visao === 'batalha') desenharBatalha(); desenharInd(); return; } // espera o jogador
    if (batalha.fim) terminarFase();
    else { if (visao === 'batalha' && modal.classList.contains('aberto')) desenharBatalha(); desenharInd(); }
  }

  // ---------- combate (tela) ----------
  const spriteUrl = (esp) => `../../../assets/monsters/${esp.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}/sprite-front.png`;
  function cartao(u, cls, vez) {
    const pct = Math.max(0, Math.round((u.hp / u.hpMax) * 100));
    return `<button class="un ${cls} ${u.hp <= 0 ? 'morto' : ''} ${vez ? 'vez' : ''} ${alvoSel === u.id ? 'alvo' : ''}" data-un="${u.id}"><span class="un-fig"><img src="${u.arte ? `../../../${u.arte}` : spriteUrl(u.especie)}" alt="${esc(u.especie)}" onerror="this.outerHTML='<span class=&quot;est-poli&quot;>${PAPEL[u.papel].i}</span>'"></span><span class="un-nome">${PAPEL[u.papel].i} ${esc(u.especie)} nv.${u.nivel}</span><span class="hp"><i style="width:${pct}%"></i></span><span class="un-hp">${u.hp}/${u.hpMax}</span></button>`;
  }
  const fundoFase = (rota, fase) => rota.arena ? `../../../${rota.arena}` : `../../../assets/confusion/interface/estrategia/${rota.material === 'pedra' ? 'pedra' : 'madeira'}-0${Math.min(3, fase + 1)}.webp`;
  const animarEvento = (el) => animarEventoFx(el, batalha && batalha.evento, '.est-arena');
  function desenharBatalha() {
    const s = estado(), exp = s.exp, rota = exp && rotaDe(exp.rota);
    const el = $('#est-bat');
    if (!exp || !batalha) { el.innerHTML = `<div class="est-bloco">${exp ? '<p>A expedição foi pausada (a página foi recarregada). Os materiais já ganhos estão salvos.</p><div class="est-linha">${botoesPausa(exp)}<button class="btn-sec" data-parar="1">Encerrar expedição</button></div>' : 'Sem combate em andamento.'}</div>`; return; }
    const u = batalha.fim ? null : atorAtual(batalha);
    const manual = u && u.lado === 'a' && !exp.autoAtaque;
    const ultima = exp.fase >= rota.fases.length - 1;
    const fimBotao = exp.estado === 'vitoria' ? `<button class="btn-sec" data-equipe="1">Ajustar equipe</button><button class="btn-pri" data-prox="1">Próxima fase</button>` : (['derrota', 'fim'].includes(exp.estado) ? `<button class="btn-pri" data-fim="1">${exp.estado === 'fim' ? 'Concluir rota' : 'Voltar à cidade'}</button>` : '');
    el.innerHTML = `<div class="est-bloco" style="margin:0"><b>${rota.icone} ${esc(rota.nome)}</b> · Fase ${exp.fase + 1}/${rota.fases.length}: ${esc(rota.fases[exp.fase].nome)} · ${estadoTxt(exp)} · ganhos: ${Object.keys(exp.ganhos).length ? custoTxt(exp.ganhos) : 'nenhum'}</div>
      <div class="est-arena" style="background-image:url('${fundoFase(rota, exp.fase)}')">
        <div class="bat-lado a">${batalha.aliados.map((x) => cartao(x, 'a', u === x)).join('')}</div>
        <div class="bat-lado i">${batalha.inimigos.map((x) => cartao(x, 'i', u === x)).join('')}</div>
      </div>
      <div class="bat-log" id="est-log">${batalha.log.slice(-8).map((l) => `<p style="margin:1px 0">${esc(l)}</p>`).join('')}</div>
      <div class="bat-ctl">
        <label><input type="checkbox" id="est-auto" ${exp.autoAtaque ? 'checked' : ''}> Atacar automaticamente</label>
        <label><input type="checkbox" id="est-autoavanca" ${exp.autoAvancar ? 'checked' : ''}> Avançar automaticamente</label>
        ${fimBotao}
        <button class="btn-sec" data-min="1">Minimizar</button><button class="btn-sec" data-parar="1">Parar</button>
        ${manual ? `<span><b>Vez: ${esc(u.especie)}</b> (toque num alvo)</span><button class="btn-pri" data-acao="atacar">Atacar</button><button class="btn-pri" data-acao="habilidade" ${u.recarga > 0 ? 'disabled' : ''}>Habilidade${u.recarga > 0 ? ` (${u.recarga})` : ''}</button><button class="btn-sec" data-acao="defender">Defender</button>${u.papel === 'suporte' ? '<button class="btn-sec" data-acao="curar">Curar</button>' : ''}` : ''}
      </div>`;
    const lg = el.querySelector('#est-log'); if (lg) lg.scrollTop = lg.scrollHeight;
    animarEvento(el);
  }

  // ---------- indicador (expedição minimizada) ----------
  function desenharInd() {
    const s = estado(), exp = s.exp;
    const mostra = exp && minimizado && exp.estado !== 'parada';
    ind.style.display = mostra ? 'flex' : 'none';
    if (!mostra) return;
    const rota = rotaDe(exp.rota);
    const aguarda = exp.estado === 'batalha' && !exp.autoAtaque && batalha && !batalha.fim && atorAtual(batalha)?.lado === 'a';
    ind.innerHTML = `<span>${rota.icone} ${esc(rota.nome)} · fase ${exp.fase + 1}/${rota.fases.length} · ${aguarda ? 'aguardando sua ação' : estadoTxt(exp)} · ${Object.keys(exp.ganhos).length ? custoTxt(exp.ganhos) : 'sem ganhos'}</span><button class="btn-pri" data-ind="abrir">Abrir</button><button class="btn-sec" data-ind="parar">Parar</button>`;
  }

  // ---------- eventos ----------
  function abrir(cat, reinoId) {
    if (reinoId) { const novo = REINOS_D.find((x) => x.id === reinoId); if (novo && desbloqueado(novo) && !estado(D).exp) D = novo; }
    minimizado = false; desenharInd(); processar();
    const s = estado();
    if (cat) { aba = cat; drawer = true; } else drawer = false;
    visao = s.exp && (['batalha', 'vitoria', 'derrota', 'fim'].includes(s.exp.estado) && batalha) ? 'batalha' : 'cidade';
    confirmar = null; desenhar(); abrirModal('modal-estrategia');
    requestAnimationFrame(() => { cam.x = (dimensoes().W - dimensoes().mw * cam.z) / 2; ajustarCamera(); });
  }
  function minimizar() {
    const s = estado();
    if (s.exp && s.exp.estado !== 'parada') { minimizado = true; mostrarToast('🧭 Expedição minimizada: continua em segundo plano.', 2200); }
    fecharModal('modal-estrategia'); desenharInd(); api.aoSair?.();
  }
  function encerrar() {
    const s = estado(); const exp = s.exp;
    clearInterval(timerTick); clearTimeout(timerProx);
    if (exp) mostrarToast(`🧭 Expedição encerrada. Ganhos mantidos: ${Object.keys(exp.ganhos).length ? custoTxt(exp.ganhos) : 'nenhum'}.`, 3200);
    s.exp = null; batalha = null; minimizado = false; visao = 'cidade'; salvar(); desenharInd(); desenhar();
  }
  modal.addEventListener('change', (e) => { if (e.target.id === 'est-reino') trocarReino(e.target.value); });
  modal.addEventListener('click', (e) => {
    const t = e.target.closest('button, input'); if (!t) return;
    const s = estado();
    if (t.id === 'est-fechar') { minimizar(); return; }
    if (t.dataset.coletar) { coletar(t.dataset.coletar === 'todos'); return; }
    if (t.dataset.enfileirar) { enfileirarSelecionadas(); return; }
    if (t.dataset.fabricar) { fabricar(false); return; }
    if (t.dataset.repetir) { fabricar(true); return; }
    if (t.dataset.rec) { loteRec = t.dataset.rec; desenharPainel(); return; }
    if (t.dataset.qtd) { loteQtd = Math.max(1, Math.min(99, loteQtd + Number(t.dataset.qtd))); desenharPainel(); return; }
    if (t.dataset.selobra) { if (t.checked) selObras.add(t.dataset.selobra); else selObras.delete(t.dataset.selobra); desenharPainel(); return; }
    if (t.dataset.acel) { confAcel = t.dataset.acel; desenharPainel(); return; }
    if (t.dataset.acelNo) { confAcel = null; desenharPainel(); return; }
    if (t.dataset.acelOk) {
      const r = acelerarObra(s, D, t.dataset.acelOk, diamantes); confAcel = null;
      if (!r.ok) mostrarToast(r.motivo, 2800); else { r.concluidas.forEach((o) => aoConcluirObra(D, o)); mostrarToast(`⚡ Obra acelerada por ${r.custo}💎.`, 2800); salvar(); atualizarHud?.(); }
      desenhar(); return;
    }
    if (t.dataset.trab) { const r = roster(); const atual = r.findIndex((m) => m.id === s.trabalho[t.dataset.trab]); const prox = r[atual + 1]; if (prox) s.trabalho[t.dataset.trab] = prox.id; else delete s.trabalho[t.dataset.trab]; salvar(); desenharPainel(); return; }
    if (t.dataset.aba) { if (drawer && aba === t.dataset.aba) drawer = false; else { aba = t.dataset.aba; drawer = true; } confirmar = null; desenharPainel(); return; }
    if (t.dataset.zoom) { const r = $('#est-mapa').getBoundingClientRect(); zoomEm(t.dataset.zoom === '1' ? 1.3 : 1 / 1.3, r.width / 2, r.height / 2); return; }
    if (t.dataset.trancado) { const l = D.locais.find((x) => x.id === t.dataset.trancado); mostrarToast(`🔒 Terreno liberado com a Prefeitura no nível ${l.nivelPrincipal}.`, 2600); return; }
    if (t.id === 'est-voltar') { minimizar(); return; }
    if (t.dataset.slot) { const l = D.locais.find((x) => x.id === t.dataset.slot); aba = l.categoria; slotSel = l.id; drawer = true; confirmar = null; desenhar(); return; }
    if (t.dataset.obra) { fazerObra(t.dataset.obra); return; }
    if (t.dataset.cancelar) { confirmar = null; desenharPainel(); return; }
    if (t.dataset.confirmar) { fazerObra(t.dataset.confirmar); return; }
    if (t.dataset.membro) { const id = t.dataset.membro; const sel = s.equipeSel || []; s.equipeSel = sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id].slice(-s.vagas); if (s.exp?.estado === 'vitoria' || s.exp?.estado === 'preparando') s.exp.equipe = s.equipeSel; salvar(); desenharPainel(); return; }
    if (t.dataset.iniciar) { iniciarExpedicao(t.dataset.iniciar); return; }
    if (t.dataset.ver) { visao = 'batalha'; desenhar(); return; }
    if (t.dataset.retomar) { comecarFase(s.exp.hpPct || null); return; }
    if (t.dataset.equipe) { aba = 'expedicoes'; visao = 'cidade'; desenhar(); return; }
    if (t.dataset.parar) { encerrar(); return; }
    if (t.dataset.prox) { clearTimeout(timerProx); proximaFase(false); return; }
    if (t.dataset.fim) { const ex = s.exp; clearInterval(timerTick); s.exp = null; batalha = null; visao = 'cidade'; if (ex) mostrarToast(`Ganhos da expedição: ${Object.keys(ex.ganhos).length ? custoTxt(ex.ganhos) : 'nenhum'}.`, 3200); salvar(); desenhar(); return; }
    if (t.dataset.min) { minimizar(); return; }
    if (t.id === 'est-auto') { s.exp.autoAtaque = t.checked; salvar(); desenharBatalha(); return; }
    if (t.id === 'est-autoavanca') { s.exp.autoAvancar = t.checked; salvar(); if (t.checked && s.exp.estado === 'vitoria') timerProx = setTimeout(() => proximaFase(true), 800); return; }
    if (t.dataset.un) { const id = t.dataset.un; if (batalha && batalha.ordem.find((x) => x.id === id)?.hp > 0) { alvoSel = alvoSel === id ? null : id; desenharBatalha(); } return; }
    if (t.dataset.acao && batalha && !batalha.fim) {
      const u = atorAtual(batalha); if (!u || u.lado !== 'a') return;
      executar(batalha, { tipo: t.dataset.acao, alvo: alvoSel || undefined }, rng); alvoSel = null;
      if (batalha.fim) terminarFase(); else desenharBatalha();
    }
  });
  ind.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.ind === 'abrir') abrir(); else if (b.dataset.ind === 'parar') encerrar(); });

  // ---------- recarregar: fase em andamento recomeça; recompensas já pagas ficam salvas ----------
  (function restaurar() {
    const volta = processar(false); if (volta.length) setTimeout(() => mostrarToast(`⏱️ Enquanto você esteve fora: ${volta.join(' · ')}`, 5200), 1500);
    setInterval(() => { processar(); if (modal.classList.contains('aberto') && visao === 'cidade') { desenharTopo(); if ((aba === 'gestao' || aba !== 'expedicoes') && !document.activeElement?.closest?.('input')) desenharPainel(); } }, 1000);
    const s = estado();
    if (s.exp && s.exp.estado === 'batalha') s.exp.estado = 'preparando';
    if (s.exp && ['preparando', 'vitoria', 'derrota', 'fim'].includes(s.exp.estado)) { minimizado = true; desenharInd(); }
  })();

  function resumo() {
    const s = estado(), p = prosperidade(s, D);
    const obras = Object.entries(s.estruturas).map(([k, e]) => `${estrDe(e.tipo).nome} nv.${e.nivel}`).join(', ') || 'nenhuma';
    const g = gestaoDe(s), pr = Object.values(prontoParaColetar(s, D)).reduce((a, b) => a + b.qtd, 0);
    const exp = s.exp ? `${rotaDe(s.exp.rota).nome}, fase ${s.exp.fase + 1} (${estadoTxt(s.exp)})` : 'nenhuma em andamento';
    return { titulo: `Estratégia · ${D.titulo}`, linhas: [`Prosperidade: ${p.total}/100`, `Materiais: ${custoTxt(s.materiais)}`, `Obras: ${obras}`, `Expedição: ${exp}`, `Obras na fila: ${g.obras.length} · produção pronta: ${pr} · lotes na oficina: ${g.fabricacao.length}`] };
  }
  const api = { abrir, resumo, estado, minimizar, encerrar, comecarFase, aoSair: null,
    reinos: () => REINOS_D.map((x) => ({ id: x.id, titulo: x.titulo, aberto: desbloqueado(x), progresso: x.desbloqueio ? progressoDesbloqueio(x) : null, fundo: x.fundo, texto: x.desbloqueio?.texto || '' })),
    // ajuda de teste e balanceamento
    setRitmo: (ms) => { ritmoMs = ms; if (timerTick) iniciarTick(); }, batalha: () => batalha, minimizado: () => minimizado };
  return api;
}
