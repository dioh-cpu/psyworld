// Mundo da Região 1: liga os 50 sistemas (confusion/web/mundo) ao jogo. Módulo independente: cria o próprio painel e o
// botão "Mundo" no menu, guarda o estado em save.idle.mundo e faz o dia do mundo passar enquanto se joga.
//   1 dia do mundo = DIA_MS de jogo real (a aba escondida não conta). Ao voltar, no máximo MAX_DIAS_ATRASO dias recuperados.
//   Efeitos dos sistemas: gold e diamantes vão para save.recompensas, sanidade para save.idle.jogador, recursos para
//   o estoque do mundo (save.idle.mundoMeta.recursos), que o bioma da área onde o jogador está também abastece.
import { carregarMundo, diaMundo, acaoMundo, SISTEMAS, OPCOES_ACAO } from '../mundo/index.js';

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

export function iniciarMundo({ getSave, salvar, mostrarToast, atualizarHud, getMapaAtual, abrirModal, fecharModal }) {

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

  // ---- Painel ----
  const estilo = document.createElement('style');
  estilo.textContent = `
    #modal-mundo .modal-card { width: min(980px, 100%); max-height: calc(100dvh - 24px); overflow: hidden; display: flex; flex-direction: column; }
    #modal-mundo .modal-head { position: static; flex: 0 0 auto; }
    #modal-mundo .mundo-topo { display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center; margin: 0 0 8px; font-size: 13px; }
    #modal-mundo .mundo-topo b { color: var(--gold, #f3c27a); }
    #modal-mundo .mundo-abas { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
    #modal-mundo .mundo-abas button[aria-selected="true"] { background: #f3a458; color: #21110c; border-color: #ffc78c; }
    #modal-mundo .mundo-lista { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding-right: 2px; align-content: start; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: 8px; }
    #modal-mundo .mundo-sis { background: #352238; border: 1px solid var(--line, #6b4a52); border-radius: 8px; padding: 10px; min-width: 0; }
    #modal-mundo .mundo-sis h4 { margin: 0 0 4px; font-size: 14px; color: var(--gold, #f3c27a); }
    #modal-mundo .mundo-sis p { margin: 2px 0; font-size: 12px; line-height: 1.4; overflow-wrap: anywhere; }
    #modal-mundo .mundo-sis .ref { opacity: .65; font-size: 11px; }
    #modal-mundo .mundo-acoes { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 7px; }
    #modal-mundo .mundo-acoes button { min-height: 34px; font-size: 12px; }
    #modal-mundo .mundo-topo, #modal-mundo .mundo-abas, #modal-mundo .mundo-log, #modal-mundo .mundo-rodape { flex: 0 0 auto; }
    #modal-mundo .mundo-log { margin-top: 10px; font-size: 12px; background: #24162b; border-radius: 6px; padding: 8px; min-height: 2.4em; }
    @media (orientation: landscape) and (max-height: 520px) {
      #modal-mundo .modal-card { max-height: calc(100dvh - 16px); padding: 8px 12px; }
      #modal-mundo .mundo-log { margin-top: 6px; }
      #modal-mundo .mundo-topo { margin-bottom: 4px; }
      #modal-mundo .modal-head { margin-bottom: 6px; padding: 4px 0; min-height: 0; }
      #modal-mundo .mundo-lista { grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); }
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
      <div class="mundo-lista" id="mundo-lista"></div>
      <div class="mundo-log" id="mundo-log" aria-live="polite">Escolha uma ação. Cada dia (2 min de jogo) todos os sistemas avançam.</div>
      <div class="mundo-acoes mundo-rodape" style="margin-top:10px"><button class="btn-sec" id="mundo-dia">Passar 1 dia agora</button><button class="btn-sec" id="mundo-coletar">Coletar recursos da área</button></div>
    </div>`;
  document.body.append(painel);

  let aba = 0;
  function desenhar() {
    const est = estado();
    const rec = Object.entries(est.meta.recursos).map(([k, v]) => `${NOMES_RECURSO[k] || k} <b>${v}</b>`).join(' · ');
    painel.querySelector('#mundo-topo').innerHTML = `<span>Dia <b>${est.meta.dia}</b></span><span>${rec}</span>`;
    painel.querySelector('#mundo-abas').innerHTML = ROTULOS_GRUPO.map((r, i) => `<button class="btn-sec" role="tab" aria-selected="${i === aba}" data-aba="${i}">${r}</button>`).join('');
    painel.querySelector('#mundo-lista').innerHTML = SISTEMAS.slice(aba * 10, aba * 10 + 10).map((sis) => {
      const acoes = Object.entries(sis.acoes || {}).map(([chave, a]) => {
        const opcoes = OPCOES_ACAO[`${sis.id}.${chave}`];
        const lista = opcoes ? opcoes(est.mundo) : [{ rotulo: '', args: {} }];
        return lista.map((o) => `<button class="btn-sec" data-sis="${sis.id}" data-acao="${chave}" data-args="${esc(JSON.stringify(o.args))}">${esc(a.rotulo)}${o.rotulo ? ` · ${esc(o.rotulo)}` : ''}</button>`).join('');
      }).join('');
      return `<article class="mundo-sis"><h4>${sis.id} · ${esc(sis.nome)}</h4><p>${esc(sis.resumo(est.mundo[sis.id]))}</p><p class="ref">Referência: ${esc(sis.referencia)}</p><div class="mundo-acoes">${acoes}</div></article>`;
    }).join('');
  }

  function log(notas) {
    painel.querySelector('#mundo-log').textContent = notas.length ? notas.join(' ') : 'Nada aconteceu.';
  }

  painel.addEventListener('click', (e) => {
    const alvo = e.target.closest('button');
    if (!alvo) return;
    if (alvo.id === 'mundo-fechar') { fecharModal('modal-mundo'); return; }
    if (alvo.dataset.aba !== undefined) { aba = Number(alvo.dataset.aba); desenhar(); return; }
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
      log(aplicar(est, res));
      salvar?.(); desenhar();
    }
  });

  function abrir() { desenhar(); abrirModal('modal-mundo'); }

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
  return {
    abrir,
    estado,
    passarDia: (n = 1) => { const est = estado(); const notas = []; for (let i = 0; i < n; i++) notas.push(...passarDia(est, false)); salvar?.(); return notas; },
    acao: (sis, acao, args = {}) => { const est = estado(); const res = acaoMundo(est.mundo, sis, acao, args, contexto(est, est.meta.dia)); const notas = aplicar(est, res); salvar?.(); return notas; },
  };
}
