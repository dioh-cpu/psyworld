// Mundo da Região 1: liga os 50 sistemas (confusion/web/mundo) ao jogo. Módulo independente: cria o próprio painel e o
// botão "Mundo" no menu, guarda o estado em save.idle.mundo e faz o dia do mundo passar enquanto se joga.
//   1 dia do mundo = DIA_MS de jogo real (a aba escondida não conta). Ao voltar, no máximo MAX_DIAS_ATRASO dias recuperados.
//   Efeitos dos sistemas: gold e diamantes vão para save.recompensas, sanidade para save.idle.jogador, recursos para
//   o estoque do mundo (save.idle.mundoMeta.recursos), que o bioma da área onde o jogador está também abastece.
import { carregarMundo, diaMundo, acaoMundo, SISTEMAS, OPCOES_ACAO } from '../mundo/index.js';
import { iniciarMundoNoMapa } from './regiao1-mundo-mapa.js';
import { ARTES, TIPOS_ARTE, artePorSistema, caminhoArte } from '../mundo/artes.js';

export const DIA_MS = 120000;
const MAX_DIAS_ATRASO = 5;
const BIOMA_RECURSOS = {
  Floresta: { madeira: 3, raizes: 2, sementes: 1 },
  Praia: { comida: 3, pedra: 2, madeira: 1 },
  Caverna: { cristal: 2, pedra: 3, peca: 1 },
  Cogumelos: { sementes: 3, raizes: 2, comida: 1 },
  Central: { madeira: 1, pedra: 1, comida: 1 },
};
const NOMES_RECURSO = { madeira: 'Madeira', pedra: 'Pedra', cristal: 'Cristal', comida: 'Comida', peca: 'Peças', sementes: 'Sementes', raizes: 'Raízes' };
export { ARTES };
// a página fica 3 pastas abaixo da raiz do repositório
const arteUrl = (sis, vaga) => `../../../${caminhoArte(sis, vaga)}`;
const ROTULOS_GRUPO = ['Sistemas 01 a 10', 'Sistemas 11 a 20', 'Sistemas 21 a 30', 'Sistemas 31 a 40', 'Sistemas 41 a 50'];

// aleatório com semente: o mesmo dia do mesmo save sempre sorteia igual (testável e sem trapaça por recarregar)
function aleatorio(semente) {
  let s = (semente >>> 0) || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function esc(t) {
  return String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function biomaDoMapa(mapa) {
  const b = String(mapa?.bioma || '');
  if (/cogumelo|fung/i.test(b)) return 'Cogumelos';
  if (/caverna|cintilante/i.test(b)) return 'Caverna';
  if (/praia/i.test(b)) return 'Praia';
  if (/floresta/i.test(b)) return 'Floresta';
  return 'Central';
}

export function iniciarMundo({ getSave, salvar, mostrarToast, atualizarHud, getMapaAtual, abrirModal, fecharModal, mapaCtx }) {

  function estado() {
    const save = getSave();
    const idle = save.idle || (save.idle = {});
    if (!idle.mundoMeta) idle.mundoMeta = { dia: 1, ultimoMs: Date.now(), recursos: { madeira: 20, pedra: 15, cristal: 2, comida: 20, peca: 2, sementes: 6, raizes: 6 }, coletaMs: 0 };
    const meta = idle.mundoMeta;
    if (!idle.mundo || !idle.mundo['50']) idle.mundo = carregarMundo(idle.mundo);
    return { save, idle, meta, mundo: idle.mundo };
  }

  function contexto({ save, idle, meta }, dia) {
    const equipe = (idle.equipe || []).map((m, i) => ({ id: `${m.especie}-${i}`, species: m.especie, classe: m.raridade >= 4 ? 'raro' : 'comum', nivel: m.nivel }));
    return {
      dia,
      r: aleatorio(dia * 7919 + (meta.semente || 17)),
      sanidade: idle.jogador?.sanidade ?? 80,
      ponteFechada: false,
      recursos: { ...meta.recursos },
      diamantes: save.recompensas?.diamantes ?? 0,
      monstros: equipe,
    };
  }

  // Aplica os efeitos de um resultado no save e devolve o resumo para mostrar ao jogador.
  function aplicar(est, res) {
    const e = res?.efeitos || {};
    const { save, idle, meta } = est;
    if (e.gold) save.recompensas.gold = Math.max(0, save.recompensas.gold + e.gold);
    if (e.diamantes) save.recompensas.diamantes = Math.max(0, save.recompensas.diamantes + e.diamantes);
    if (e.sanidade && idle.jogador) idle.jogador.sanidade = Math.max(0, Math.min(100, (idle.jogador.sanidade ?? 80) + e.sanidade));
    for (const [k, v] of Object.entries(e.recursos || {})) meta.recursos[k] = Math.max(0, (meta.recursos[k] || 0) + v);
    atualizarHud?.();
    return res?.notas || [];
  }

  function passarDia(est, nota = true) {
    const { meta, mundo } = est;
    meta.dia += 1;
    const bioma = BIOMA_RECURSOS[biomaDoMapa(getMapaAtual?.())];
    for (const [k, v] of Object.entries(bioma)) meta.recursos[k] = (meta.recursos[k] || 0) + v;
    const res = diaMundo(mundo, contexto(est, meta.dia));
    const notas = aplicar(est, res);
    if (nota && notas.length) mostrarToast?.(`🌍 Dia ${meta.dia} do mundo: ${notas[0]}`, 3600);
    return notas;
  }

  // Relógio: roda a cada segundo, conta só aba visível e não conta com menu do mundo em animação
  function relogio() {
    if (document.hidden) { estado().meta.ultimoMs = Date.now(); return; }
    const est = estado();
    const agora = Date.now();
    let dias = Math.floor((agora - est.meta.ultimoMs) / DIA_MS);
    if (dias <= 0) return;
    dias = Math.min(dias, MAX_DIAS_ATRASO);
    est.meta.ultimoMs = agora;
    for (let i = 0; i < dias; i++) passarDia(est, i === dias - 1);
    salvar?.();
    if (painel.classList.contains('aberto')) desenhar();
  }

  // ---- Painel: grade dos 50 sistemas + menu próprio de cada sistema ----
  const estilo = document.createElement('style');
  estilo.textContent = `
    #modal-mundo .modal-card { width: min(1040px, 100%); max-height: calc(100dvh - 24px); overflow: hidden; display: flex; flex-direction: column; }
    #modal-mundo .modal-head { position: static; flex: 0 0 auto; }
    #modal-mundo .mundo-topo, #modal-mundo .mundo-abas, #modal-mundo .mundo-log, #modal-mundo .mundo-rodape { flex: 0 0 auto; }
    #modal-mundo .mundo-topo { display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center; margin: 0 0 8px; font-size: 13px; }
    #modal-mundo b { color: var(--gold, #f3c27a); }
    #modal-mundo .mundo-abas { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
    #modal-mundo .mundo-abas button[aria-selected="true"] { background: #f3a458; color: #21110c; border-color: #ffc78c; }
    #modal-mundo .mundo-corpo { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
    #modal-mundo .mundo-grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 190px), 1fr)); gap: 8px; }
    #modal-mundo .tile { display: flex; flex-direction: column; gap: 4px; text-align: left; padding: 8px; background: #352238; border: 1px solid var(--line, #6b4a52); border-radius: 8px; color: inherit; min-width: 0; cursor: pointer; }
    #modal-mundo .tile:hover, #modal-mundo .tile:focus-visible { border-color: var(--gold, #f3c27a); }
    #modal-mundo .tile .linha { display: flex; gap: 8px; align-items: center; }
    #modal-mundo .tile strong { font-size: 13px; line-height: 1.2; }
    #modal-mundo .tile small { font-size: 11px; opacity: .75; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    #modal-mundo .arte { position: relative; overflow: hidden; border-radius: 8px; background: #24162b; }
    #modal-mundo .arte img { display: block; width: 100%; height: 100%; object-fit: cover; }
    #modal-mundo .arte svg { display: block; width: 100%; height: 100%; }
    #modal-mundo .ic { flex: 0 0 44px; width: 44px; height: 44px; }
    #modal-mundo .sis-banner { aspect-ratio: 16 / 4; max-height: 19dvh; width: 100%; margin-bottom: 8px; }
    #modal-mundo .sis-bloco { background: #352238; border: 1px solid var(--line, #6b4a52); border-radius: 8px; padding: 10px; margin-bottom: 8px; }
    #modal-mundo .sis-bloco h4 { margin: 0 0 6px; font-size: 13px; color: var(--gold, #f3c27a); }
    #modal-mundo .sis-bloco p { margin: 2px 0; font-size: 12px; line-height: 1.45; overflow-wrap: anywhere; }
    #modal-mundo .ref { opacity: .65; font-size: 11px; }
    #modal-mundo .estado { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 210px), 1fr)); gap: 4px 12px; font-size: 12px; }
    #modal-mundo .estado div { overflow-wrap: anywhere; }
    #modal-mundo .estado span { opacity: .7; }
    #modal-mundo .mundo-acoes { display: flex; flex-wrap: wrap; gap: 6px; }
    #modal-mundo .mundo-acoes button { min-height: 36px; font-size: 12px; text-align: left; }
    #modal-mundo .vagas { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 120px), 1fr)); gap: 8px; }
    #modal-mundo .vaga { font-size: 10.5px; line-height: 1.25; }
    #modal-mundo .vaga .arte { aspect-ratio: 1; margin-bottom: 3px; }
    #modal-mundo .vaga.cena .arte { aspect-ratio: 16 / 9; }
    #modal-mundo .vaga.banner .arte { aspect-ratio: 16 / 5; }
    #modal-mundo .vaga small { opacity: .65; display: block; }
    #modal-mundo .mundo-log { margin-top: 8px; font-size: 12px; background: #24162b; border-radius: 6px; padding: 8px; min-height: 2.4em; }
    @media (orientation: landscape) and (max-height: 520px) {
      #modal-mundo .modal-card { max-height: calc(100dvh - 16px); padding: 8px 12px; }
      #modal-mundo .modal-head { margin-bottom: 6px; padding: 4px 0; min-height: 0; }
      #modal-mundo .mundo-log { margin-top: 6px; }
      #modal-mundo .mundo-topo { margin-bottom: 4px; }
      #modal-mundo .sis-banner { max-height: 16dvh; }
    }`;
  document.head.append(estilo);

  const painel = document.createElement('div');
  painel.id = 'modal-mundo';
  painel.className = 'modal-bg';
  painel.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="mundo-titulo">
      <header class="modal-head">
        <h3 id="mundo-titulo">Mundo · 50 sistemas</h3>
        <button class="btn-fechar" id="mundo-fechar" aria-label="Fechar">✕</button>
      </header>
      <div class="mundo-topo" id="mundo-topo"></div>
      <div class="mundo-abas" id="mundo-abas" role="tablist"></div>
      <div class="mundo-corpo" id="mundo-corpo"></div>
      <div class="mundo-log" id="mundo-log" aria-live="polite">Escolha um sistema. Cada dia (2 min de jogo) todos eles avançam.</div>
      <div class="mundo-acoes mundo-rodape" style="margin-top:8px"><button class="btn-sec" id="mundo-dia">Passar 1 dia agora</button><button class="btn-sec" id="mundo-coletar">Coletar recursos da área</button></div>
    </div>`;
  document.body.append(painel);

  let aba = 0;
  let aberto = null; // id do sistema aberto, ou null na grade
  const pretty = (k) => String(k).replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toLowerCase();
  function fmt(v, prof = 0) {
    if (v === null || v === undefined) return '-';
    if (typeof v === 'boolean') return v ? 'sim' : 'não';
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(1);
    if (typeof v === 'string') return v;
    if (Array.isArray(v)) return v.length ? `${v.length}: ${v.slice(0, 4).map((x) => (typeof x === 'object' && x ? (x.nome || x.titulo || x.id || x.especie || x.tipo || fmt(x, prof + 1)) : fmt(x, prof + 1))).join(', ')}${v.length > 4 ? '…' : ''}` : 'nenhum';
    if (typeof v === 'object') {
      if (prof > 1) return '…';
      const itens = Object.entries(v).slice(0, 6).map(([k, x]) => `${pretty(k)} ${fmt(x, prof + 1)}`);
      return itens.length ? itens.join(' · ') : 'vazio';
    }
    return String(v);
  }

  // Vaga de arte: tenta o arquivo; sem ele, mostra um polígono com o nome (o erro de carregamento troca a imagem).
  function vagaHtml(sis, v, arte) {
    const t = TIPOS_ARTE[v.tipo];
    const marcador = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon points="50,6 94,30 94,70 50,94 6,70 6,30" fill="${arte.cor}55" stroke="${arte.cor}" stroke-width="2"/><text x="50" y="55" text-anchor="middle" font-size="22">${arte.emoji}</text></svg>`;
    return `<div class="vaga ${v.tipo}"><div class="arte" data-sis="${sis}" data-vaga="${v.id}">${`<img src="${arteUrl(sis, v.id)}" alt="${esc(v.nome)}" loading="lazy">`}<template>${marcador}</template></div><b>${esc(v.nome)}</b><small>${esc(t.tam)} · ${esc(v.id)}.webp</small></div>`;
  }

  function desenhar() {
    const est = estado();
    const rec = Object.entries(est.meta.recursos).map(([k, v]) => `${NOMES_RECURSO[k] || k} <b>${v}</b>`).join(' · ');
    painel.querySelector('#mundo-topo').innerHTML = `<span>Dia <b>${est.meta.dia}</b></span><span>${rec}</span>`;
    const corpo = painel.querySelector('#mundo-corpo');
    const abas = painel.querySelector('#mundo-abas');
    if (aberto) { abas.hidden = true; painel.querySelector('#mundo-titulo').textContent = 'Mundo'; corpo.innerHTML = menuSistemaHtml(est, aberto); corpo.scrollTop = 0; ligarArtes(corpo); return; }
    abas.hidden = false;
    painel.querySelector('#mundo-titulo').textContent = 'Mundo · 50 sistemas';
    abas.innerHTML = ROTULOS_GRUPO.map((r, i) => `<button class="btn-sec" role="tab" aria-selected="${i === aba}" data-aba="${i}">${r}</button>`).join('');
    corpo.innerHTML = `<div class="mundo-grade">${SISTEMAS.slice(aba * 10, aba * 10 + 10).map((sis) => {
      const arte = artePorSistema(sis.id);
      return `<button class="tile" data-abrir="${sis.id}"><span class="linha"><span class="arte ic" data-sis="${sis.id}" data-vaga="icone"><img src="${arteUrl(sis.id, 'icone')}" alt="" loading="lazy"><template><svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,6 94,30 94,70 50,94 6,70 6,30" fill="${arte.cor}66" stroke="${arte.cor}" stroke-width="3"/><text x="50" y="62" text-anchor="middle" font-size="40">${arte.emoji}</text></svg></template></span><strong>${sis.id} · ${esc(sis.nome)}</strong></span><small>${esc(sis.resumo(est.mundo[sis.id]))}</small></button>`;
    }).join('')}</div>`;
    ligarArtes(corpo);
  }

  function menuSistemaHtml(est, id) {
    const sis = SISTEMAS.find((x) => x.id === id);
    const arte = artePorSistema(id);
    const st = est.mundo[id];
    const linhas = Object.entries(st || {}).map(([k, v]) => `<div><span>${esc(pretty(k))}:</span> ${esc(fmt(v))}</div>`).join('') || '<div>Sem dados.</div>';
    const acoes = Object.entries(sis.acoes || {}).map(([chave, a]) => {
      const opcoes = OPCOES_ACAO[`${id}.${chave}`];
      const lista = opcoes ? opcoes(est.mundo) : [{ rotulo: '', args: {} }];
      if (!lista.length) return `<button class="btn-sec" disabled>${esc(a.rotulo)} (sem opção agora)</button>`;
      return lista.map((o) => `<button class="btn-sec" data-sis="${id}" data-acao="${chave}" data-args="${esc(JSON.stringify(o.args))}">${esc(a.rotulo)}${o.rotulo ? ` · ${esc(o.rotulo)}` : ''}</button>`).join('');
    }).join('') || '<p class="ref">Este sistema é passivo: avança sozinho a cada dia. Acompanhe o estado acima.</p>';
    const logs = (est.meta.logs?.[id] || []).slice(-5).reverse().map((l) => `<p>• ${esc(l)}</p>`).join('') || '<p class="ref">Nenhum evento ainda.</p>';
    return `<button class="btn-sec" data-voltar="1" style="margin-bottom:8px">← Todos os sistemas</button>
      <div class="sis-banner arte" data-sis="${id}" data-vaga="banner"><img src="${arteUrl(id, 'banner')}" alt="" loading="lazy"><template><svg viewBox="0 0 160 50" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="160" height="50" fill="${arte.cor}33"/><polygon points="0,50 30,14 58,34 92,6 128,30 160,10 160,50" fill="${arte.cor}77"/><text x="146" y="30" text-anchor="middle" font-size="22">${arte.emoji}</text><text x="8" y="26" font-size="9" fill="#fff3e7" font-weight="700">${esc(sis.nome)}</text></svg></template></div>
      <div class="sis-bloco"><h4>${id} · ${esc(sis.nome)}</h4><p>${esc(sis.resumo(st))}</p><p class="ref">Referência: ${esc(sis.referencia)}</p></div>
      <div class="sis-bloco"><h4>Estado</h4><div class="estado">${linhas}</div></div>
      <div class="sis-bloco"><h4>Ações</h4><div class="mundo-acoes">${acoes}</div></div>
      <div class="sis-bloco"><h4>Últimos eventos</h4>${logs}</div>
      <div class="sis-bloco"><h4>Artes deste sistema <span class="ref" id="mundo-falta"></span></h4><div class="vagas">${arte.artes.filter((v) => v.id !== 'banner').map((v) => vagaHtml(id, v, arte)).join('')}</div></div>`;
  }

  // troca a imagem pelo polígono quando o arquivo não existe
  function ligarArtes(raiz) {
    let faltam = 0;
    raiz.querySelectorAll('.arte').forEach((box) => {
      const img = box.querySelector('img'); const tpl = box.querySelector('template');
      if (!img || !tpl) return;
      const trocar = () => { faltam += 1; img.replaceWith(tpl.content.cloneNode(true)); const f = raiz.querySelector('#mundo-falta'); if (f) f.textContent = `· ${faltam} vaga(s) ainda sem arte`; };
      img.addEventListener('error', trocar, { once: true });
      if (img.complete && img.naturalWidth === 0) trocar();
    });
  }

  function log(notas, id) {
    const texto = notas.length ? notas.join(' ') : 'Nada aconteceu.';
    painel.querySelector('#mundo-log').textContent = texto;
    if (id && notas.length) {
      const m = estado().meta; m.logs = m.logs || {}; m.logs[id] = [...(m.logs[id] || []), `Dia ${m.dia}: ${texto}`].slice(-8);
    }
  }

  painel.addEventListener('click', (e) => {
    const alvo = e.target.closest('button');
    if (!alvo) return;
    if (alvo.id === 'mundo-fechar') { fecharModal('modal-mundo'); return; }
    if (alvo.dataset.aba !== undefined) { aba = Number(alvo.dataset.aba); desenhar(); return; }
    if (alvo.dataset.abrir) { aberto = alvo.dataset.abrir; desenhar(); return; }
    if (alvo.dataset.voltar) { aberto = null; desenhar(); return; }
    const est = estado();
    if (alvo.id === 'mundo-dia') {
      log(passarDia(est, false)); est.meta.ultimoMs = Date.now(); salvar?.(); desenhar(); return;
    }
    if (alvo.id === 'mundo-coletar') {
      const agora = Date.now();
      if (agora - (est.meta.coletaMs || 0) < 20000) { log([`Aguarde ${Math.ceil((20000 - (agora - est.meta.coletaMs)) / 1000)} s para coletar de novo.`]); return; }
      est.meta.coletaMs = agora;
      const bioma = biomaDoMapa(getMapaAtual?.());
      const ganho = {};
      for (const [k, v] of Object.entries(BIOMA_RECURSOS[bioma])) { ganho[k] = v * 2; est.meta.recursos[k] = (est.meta.recursos[k] || 0) + v * 2; }
      log([`Você coletou na área (${bioma}): ${Object.entries(ganho).map(([k, v]) => `${NOMES_RECURSO[k]} +${v}`).join(', ')}.`]);
      salvar?.(); desenhar(); return;
    }
    if (alvo.dataset.sis) {
      const args = JSON.parse(alvo.dataset.args || '{}');
      const res = acaoMundo(est.mundo, alvo.dataset.sis, alvo.dataset.acao, args, contexto(est, est.meta.dia));
      log(aplicar(est, res), alvo.dataset.sis);
      salvar?.(); desenhar();
    }
  });

  function abrir(id = null) { aberto = id; desenhar(); abrirModal('modal-mundo'); }

  // Botão no menu principal (e fecha o menu ao abrir)
  const atalhos = document.querySelector('#modal-menu .menu-atalhos');
  if (atalhos && !document.getElementById('m-mundo')) {
    const b = document.createElement('button');
    b.className = 'btn-sec'; b.id = 'm-mundo'; b.textContent = 'Mundo';
    b.addEventListener('click', () => { fecharModal('modal-menu'); abrir(); });
    atalhos.prepend(b);
  }

  estado();
  setInterval(relogio, 1000);
  const noMapa = mapaCtx ? iniciarMundoNoMapa({ ...mapaCtx, getMapaAtual, getMundo: () => estado().mundo, abrirSistema: (id) => abrir(id), algumModalAberto: () => Boolean(document.querySelector('.modal-bg.aberto')) }) : null;
  return {
    noMapa,
    abrir,
    abrirSistema: (id) => abrir(id),
    estado,
    passarDia: (n = 1) => { const est = estado(); const notas = []; for (let i = 0; i < n; i++) notas.push(...passarDia(est, false)); salvar?.(); return notas; },
    acao: (sis, acao, args = {}) => { const est = estado(); const res = acaoMundo(est.mundo, sis, acao, args, contexto(est, est.meta.dia)); const notas = aplicar(est, res); salvar?.(); return notas; },
  };
}
