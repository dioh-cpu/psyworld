// Mundo da Região 1: liga os 50 sistemas (confusion/web/mundo) ao jogo. Módulo independente: cria o próprio painel e o
// botão "Mundo" no menu, guarda o estado em save.idle.mundo e faz o dia do mundo passar enquanto se joga.
//   1 dia do mundo = DIA_MS de jogo real (a aba escondida não conta). Ao voltar, no máximo MAX_DIAS_ATRASO dias recuperados.
//   Efeitos dos sistemas: gold e diamantes vão para save.recompensas, sanidade para save.idle.jogador, recursos para
//   o estoque do mundo (save.idle.mundoMeta.recursos), que o bioma da área onde o jogador está também abastece.
import { carregarMundo, diaMundo, acaoMundo, SISTEMAS, OPCOES_ACAO } from '../mundo/index.js';
import { protecaoContraPragas, servicosAtivos, dificuldadeMasmorra, NPCS as NPCS_MUNDO, faseDo } from '../mundo/sistemas-01.js';
import { iniciarMundoNoMapa } from './regiao1-mundo-mapa.js';
import { iniciarClima } from './regiao1-clima.js';
import { sistemasLiberados, proximaLiberacao, tutorialDoSistema } from './regiao1-liberacao.js';
import { ARTES, TIPOS_ARTE, artePorSistema, caminhoArte } from '../mundo/artes.js';
import { membrosFormacao } from './regiao1-exp-regras.js';
import { arteDoIndividuo } from './regiao1-halloween-dados.js';
import { bonusDoMembro } from './regiao1-halloween-regras.js';
import { regiaoDesbloqueada } from './regiao1-regioes-regras.js';

export const DIA_MS = 120000;
// Sistemas 01-10 ativos no painel Menu → Mundo e nos diálogos dos NPCs; sem construções soltas sobre o caminho da campanha.
export const MUNDO_ATIVO = true;
export const MUNDO_NO_MAPA = false;
// Armazém: cada recurso tem teto (500, +100 por refúgio ou fortaleza). O excedente se perde, então nada dispara sem fim.
export const ARMAZEM_BASE = 500;
export const SANIDADE_PISO_DIA = 10; // perdas diárias (marca, cicatrizes) não passam disso; só ações do jogador podem ir além
const MAX_DIAS_ATRASO = 5;
const BIOMA_RECURSOS = {
  Floresta: { madeira: 3, raizes: 2, sementes: 1 },
  Praia: { comida: 3, pedra: 2, madeira: 1 },
  Caverna: { cristal: 2, pedra: 3, peca: 1 },
  Cogumelos: { sementes: 3, raizes: 2, comida: 1 },
  Central: { madeira: 1, pedra: 1, comida: 1 },
};
const NOMES_RECURSO = { madeira: 'Madeira', pedra: 'Pedra', cristal: 'Cristal', comida: 'Comida', peca: 'Peças', sementes: 'Sementes', raizes: 'Raízes' };

import {
  NPCS_PISTA_09, CIDADES_ROTA_10, MASMORRAS_MAPA,
  investigacaoNpcInfo, statusVilaMapa, rotasDisponiveisDaCidade,
} from './regiao1-mundo-integracao.js';
export { NPCS_PISTA_09, CIDADES_ROTA_10, investigacaoNpcInfo, statusVilaMapa, rotasDisponiveisDaCidade };
const MASMORRAS_INFO = Object.fromEntries(MASMORRAS_MAPA.map((m) => [m.id, m]));
export { ARTES };
// a página fica 3 pastas abaixo da raiz do repositório
// A Mira tem os três retratos completos em mundo-retratos; o mira.webp do catálogo é um recorte curto demais, então usa o neutro
const ALTERNATIVA = { '22/mira': 'assets/confusion/interface/mundo-retratos/mira/mira-neutro.webp' };
const arteUrl = (sis, vaga) => `../../../${ALTERNATIVA[`${sis}/${vaga}`] || caminhoArte(sis, vaga)}`;
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

export function iniciarMundo({ getSave, salvar, mostrarToast, atualizarHud, getMapaAtual, abrirModal, fecharModal, abrirDialogo, tela, batalhaBloqueando, entrarNoMapa, mapaCtx }) {

  function estado() {
    const save = getSave();
    const idle = save.idle || (save.idle = {});
    if (!idle.mundoMeta) idle.mundoMeta = { dia: 1, ultimoMs: Date.now(), recursos: { madeira: 20, pedra: 15, cristal: 2, comida: 20, peca: 2, sementes: 6, raizes: 6 }, coletaMs: 0 };
    const meta = idle.mundoMeta;
    if (!idle.mundo || !idle.mundo['50']) idle.mundo = carregarMundo(idle.mundo);
    return { save, idle, meta, mundo: idle.mundo };
  }

  const armazem = (est) => ARMAZEM_BASE + 100 * (est.mundo['05']?.refugios?.length || 0);
  function somarRecurso(est, k, v) {
    est.meta.recursos[k] = Math.max(0, Math.min(armazem(est), (est.meta.recursos[k] || 0) + v));
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
  function aplicar(est, res, diario = false) {
    const e = res?.efeitos || {};
    const { save, idle, meta } = est;
    if (e.gold) save.recompensas.gold = Math.max(0, save.recompensas.gold + e.gold);
    if (e.diamantes) save.recompensas.diamantes = Math.max(0, save.recompensas.diamantes + e.diamantes);
    if (e.sanidade && idle.jogador) {
      const atual = idle.jogador.sanidade ?? 80;
      const novo = atual + e.sanidade;
      // perda diária nunca derruba abaixo do piso (mas não sobe o que já está baixo)
      idle.jogador.sanidade = Math.max(0, Math.min(100, diario && e.sanidade < 0 ? Math.max(novo, Math.min(atual, SANIDADE_PISO_DIA)) : novo));
    }
    for (const [k, v] of Object.entries(e.recursos || {})) somarRecurso(est, k, v);
    atualizarHud?.();
    return res?.notas || [];
  }

  function passarDia(est, nota = true) {
    const { meta, mundo } = est;
    meta.dia += 1;
    const bioma = BIOMA_RECURSOS[biomaDoMapa(getMapaAtual?.())];
    for (const [k, v] of Object.entries(bioma)) somarRecurso(est, k, v);
    const res = diaMundo(mundo, contexto(est, meta.dia));
    const notas = aplicar(est, res, true);
    meta.diario = meta.diario || [];
    for (const n of notas) meta.diario.push({ dia: meta.dia, t: n });
    if (meta.diario.length > 150) meta.diario = meta.diario.slice(-150);
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
    #modal-mundo [hidden] { display: none !important; }
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
      <div class="mundo-acoes mundo-rodape" style="margin-top:8px"><button class="btn-pri" id="mundo-estrategia">🧭 Estratégia da cidade</button><button class="btn-sec" id="mundo-dia">Passar 1 dia agora</button><button class="btn-sec" id="mundo-diario">Diário do mundo</button><button class="btn-sec" id="mundo-coletar">Coletar recursos da área</button></div>
    </div>`;
  document.body.append(painel);

  let aba = 0;
  let aberto = null; // id do sistema aberto, ou null na grade
  let revendo = null; // sistema cujo tutorial está sendo revisto
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
    const mm = modificadores();
    painel.querySelector('#mundo-topo').innerHTML = `<span>Dia <b>${est.meta.dia}</b></span><span>${rec}</span><span>Na caça: ${mm.notas.length ? esc(mm.notas.join(', ')) : 'sem efeitos'}</span>`;
    const corpo = painel.querySelector('#mundo-corpo');
    const abas = painel.querySelector('#mundo-abas');
    if (aberto === 'diario') {
      abas.hidden = true; painel.querySelector('#mundo-titulo').textContent = 'Mundo · Diário';
      const itens = [...(est.meta.diario || [])].reverse();
      let dia = null;
      corpo.innerHTML = `<button class="btn-sec" data-voltar="1" style="margin-bottom:8px">← Todos os sistemas</button>` + (itens.length ? itens.map((x) => { const cab = x.dia !== dia ? `<h4 style="margin:10px 0 3px;color:var(--gold,#f3c27a);font-size:13px">Dia ${x.dia}</h4>` : ''; dia = x.dia; return `${cab}<p style="margin:2px 0;font-size:12.5px">• ${esc(x.t)}</p>`; }).join('') : '<p class="ref">Nada aconteceu ainda. Os eventos dos sistemas aparecem aqui a cada dia do mundo.</p>');
      corpo.scrollTop = 0; return;
    }
    if (aberto) { abas.hidden = true; painel.querySelector('#mundo-titulo').textContent = 'Mundo'; corpo.innerHTML = menuSistemaHtml(est, aberto); corpo.scrollTop = 0; ligarArtes(corpo); return; }
    abas.hidden = false;
    painel.querySelector('#mundo-titulo').textContent = 'Mundo · 50 sistemas';
    abas.innerHTML = ROTULOS_GRUPO.map((r, i) => `<button class="btn-sec" role="tab" aria-selected="${i === aba}" data-aba="${i}">${r}</button>`).join('');
    const progresso = [window.regiaoC1, window.regiaoEstrategia].map((m) => m?.resumo()).filter(Boolean).map((cic) => `<div class="sis-bloco"><h4>Diário de progresso · ${esc(cic.titulo)}</h4>${cic.linhas.map((l) => `<p>• ${esc(l)}</p>`).join('')}</div>`).join('');
    const tut = est.meta.tutorialVisto ? '' : `<div class="sis-bloco"><h4>Como funciona o Mundo</h4><p>São 50 sistemas vivos: cidades, facções, clima, pragas, chefes, expedições e mais. A cada <b>dia do mundo</b> (2 minutos de jogo) todos eles avançam sozinhos.</p><p>• <b>Toque em um sistema</b> para abrir o menu dele: estado, ações e o que ele rende.</p><p>• <b>Cada abate na caçada</b> alimenta o mundo (recursos do bioma) e tira monstros do ecossistema. Se uma espécie fica rara, a caça rende menos.</p><p>• <b>Praga e clima</b> mexem no seu dano e no seu ouro. Refúgios protegem. O quadro "Na caça" no topo mostra o que está valendo agora.</p><p>• Os recursos têm teto de 500 (+100 por refúgio). O que passa disso se perde: gaste!</p><p>• Alguns sistemas aparecem no mapa. Chegue perto e toque no botão 🌍 para abrir.</p><div class="mundo-acoes" style="margin-top:6px"><button class="btn-pri" data-entendi="1">Entendi</button></div></div>`;
    const lib = sistemasLiberados(getSave()), grupo = SISTEMAS.slice(aba * 10, aba * 10 + 10).filter((x) => lib.has(x.id));
    const prox = proximaLiberacao(getSave());
    const dica = `<div class="sis-bloco"><h4>Sistemas liberados: ${lib.size}/50</h4><p>${prox ? `Próxima liberação: conclua <b>${esc(prox.titulo)}</b> na campanha (${prox.sistemas.length} sistema${prox.sistemas.length > 1 ? 's' : ''}).` : 'Todos os sistemas foram liberados.'}</p></div>`;
    corpo.innerHTML = progresso + dica + tut + (grupo.length ? '' : '<p class="ref">Nenhum sistema deste grupo foi liberado ainda. Avance na campanha.</p>') + `<div class="mundo-grade">${grupo.map((sis) => {
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
    const tutVisto = est.meta.tutoriais?.[id], mostrarTut = !tutVisto || revendo === id, tt = tutorialDoSistema(sis);
    const cartaoTut = mostrarTut ? `<div class="sis-bloco tut-card"><h4>📘 Tutorial · ${esc(sis.nome)}</h4><p><b>Para que serve:</b> ${esc(tt.serve)} ${esc(sis.resumo(st))}</p><p><b>Onde tocar:</b> ${esc(tt.onde)}</p><p><b>${tt.passivo ? 'Para acompanhar' : 'Primeira ação'}:</b> ${esc(tt.primeira)}</p><div class="mundo-acoes"><button class="btn-pri" data-tutok="${id}">Entendi</button></div></div>` : '';
    const rever = tutVisto && revendo !== id ? `<button class="btn-sec" data-rever="${id}" style="margin:0 0 8px 6px">Rever tutorial</button>` : '';
    return `<button class="btn-sec" data-voltar="1" style="margin-bottom:8px">← Todos os sistemas</button>${rever}${cartaoTut}
      <div class="sis-banner arte" data-sis="${id}" data-vaga="banner"><img src="${arteUrl(id, 'banner')}" alt="" loading="lazy"><template><svg viewBox="0 0 160 50" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="160" height="50" fill="${arte.cor}33"/><polygon points="0,50 30,14 58,34 92,6 128,30 160,10 160,50" fill="${arte.cor}77"/><text x="146" y="30" text-anchor="middle" font-size="22">${arte.emoji}</text><text x="8" y="26" font-size="9" fill="#fff3e7" font-weight="700">${esc(sis.nome)}</text></svg></template></div>
      <div class="sis-bloco"><h4>${id} · ${esc(sis.nome)}</h4><p>${esc(sis.resumo(st))}</p><p class="ref">Referência: ${esc(sis.referencia)}</p></div>
      <div class="sis-bloco ${mostrarTut && tt.passivo ? 'tut-destaque' : ''}"><h4>Estado</h4><div class="estado">${linhas}</div></div>
      <div class="sis-bloco ${mostrarTut && !tt.passivo ? 'tut-destaque' : ''}"><h4>Ações</h4><div class="mundo-acoes">${acoes}</div></div>
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
    if (alvo.dataset.voltar) { aberto = null; revendo = null; desenhar(); return; }
    if (alvo.dataset.tutok) { const m = estado().meta; m.tutoriais = m.tutoriais || {}; m.tutoriais[alvo.dataset.tutok] = true; revendo = null; salvar?.(); desenhar(); return; }
    if (alvo.dataset.rever) { revendo = alvo.dataset.rever; desenhar(); return; }
    if (alvo.dataset.entendi) { estado().meta.tutorialVisto = true; salvar?.(); desenhar(); return; }
    if (alvo.id === 'mundo-estrategia') { fecharModal('modal-mundo'); window.regiaoEstrategia?.abrir(); return; }
    if (alvo.id === 'mundo-diario') { aberto = 'diario'; desenhar(); return; }
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
      for (const [k, v] of Object.entries(BIOMA_RECURSOS[bioma])) { ganho[k] = v * 2; somarRecurso(est, k, v * 2); }
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

  let seloMenuEl = null;
  let seloBotaoMundoEl = null;
  function atualizarSeloMundo() {
    const m = estado().meta;
    const qtd = Math.max(0, Number(m.novosNaoLidos) || 0);
    const btnMenu = document.getElementById('btn-menu-geral');
    if (seloMenuEl) {
      if (btnMenu && !seloMenuEl.isConnected) {
        btnMenu.style.position = 'relative';
        btnMenu.appendChild(seloMenuEl);
      }
      seloMenuEl.textContent = qtd > 9 ? '9+' : String(qtd);
      seloMenuEl.hidden = qtd <= 0;
    }
    if (seloBotaoMundoEl) {
      seloBotaoMundoEl.textContent = qtd > 0 ? `Mundo (${qtd})` : 'Mundo';
      seloBotaoMundoEl.classList.toggle('tem-novo', qtd > 0);
    }
  }

  function abrir(id = null) {
    const m = estado().meta;
    if (m.novosNaoLidos) { m.novosNaoLidos = 0; salvar?.(); }
    atualizarSeloMundo();
    aberto = id; desenhar(); abrirModal('modal-mundo');
  }

  // Selo discreto no botão Menu (substitui o toast "Novo no Mundo" no centro da tela)
  const btnMenuGeral = document.getElementById('btn-menu-geral');
  if (MUNDO_ATIVO && btnMenuGeral && !document.getElementById('menu-selo-mundo')) {
    btnMenuGeral.style.position = 'relative';
    seloMenuEl = document.createElement('span');
    seloMenuEl.id = 'menu-selo-mundo';
    seloMenuEl.className = 'menu-selo-mundo';
    seloMenuEl.setAttribute('aria-label', 'Novos sistemas liberados em Menu → Mundo');
    seloMenuEl.hidden = true;
    btnMenuGeral.appendChild(seloMenuEl);
  }

  // Botão no menu principal (e fecha o menu ao abrir)
  const atalhos = document.querySelector('#modal-menu .menu-atalhos');
  if (MUNDO_ATIVO && atalhos && !document.getElementById('m-mundo')) {
    const b = document.createElement('button');
    b.className = 'btn-sec'; b.id = 'm-mundo'; b.textContent = 'Mundo';
    b.addEventListener('click', () => { fecharModal('modal-menu'); abrir(); });
    atalhos.prepend(b);
    seloBotaoMundoEl = b;
  }

  estado();
  if (MUNDO_ATIVO) setInterval(relogio, 1000);
  const liberado = (id) => sistemasLiberados(getSave()).has(id);
  const liberadoMapa = (id) => liberado(id) || ['01', '04', '05', '08', '10'].includes(id);

  function executarAcaoToast(sis, acao, args = {}) {
    const est = estado();
    const res = acaoMundo(est.mundo, sis, acao, args, contexto(est, est.meta.dia));
    const notas = aplicar(est, res);
    log(notas, sis);
    salvar?.();
    noMapa?.atualizar?.();
    if (notas.length) mostrarToast?.(`🌍 ${notas.join(' ')}`, 3600);
    return notas;
  }

  function abrirVilaMapa(vilaId) {
    const est = estado();
    const st = statusVilaMapa(est.mundo, vilaId);
    if (!st || !abrirDialogo) { abrir('01'); return; }
    const jaDescansou = est.meta.estalagemDia?.[vilaId] === est.meta.dia;
    const precoMad = est.mundo['10']?.precos?.madeira ?? 10;
    const texto = st.servicosAbertos
      ? `Prosperidade: ${Math.round(st.prosperidade)}/100 · Corrupção: ${Math.round(st.corrupcao)}/100. Os serviços da vila estão ABERTOS: estalagem ativa e comércio local comprando madeira a ${precoMad}g.`
      : `Prosperidade: ${Math.round(st.prosperidade)}/100 · Corrupção: ${Math.round(st.corrupcao)}/100. SERVIÇOS FECHADOS (exige prosperidade ≥ 40 e corrupção < 70). Reconstrua a vila (30 madeira e 30 pedra) para reabrir os serviços.`;
    const botoes = [
      {
        rotulo: st.servicosAbertos ? (jaDescansou ? '🛏️ Estalagem (usada hoje)' : '🛏️ Estalagem (+15 sanidade)') : '🔒 Estalagem fechada',
        prim: st.servicosAbertos && !jaDescansou,
        desativado: !st.servicosAbertos || jaDescansou,
        aoClicar: () => {
          const e = estado();
          e.meta.estalagemDia = e.meta.estalagemDia || {};
          e.meta.estalagemDia[vilaId] = e.meta.dia;
          if (e.idle.jogador) e.idle.jogador.sanidade = Math.min(100, (e.idle.jogador.sanidade ?? 80) + 15);
          atualizarHud?.(); salvar?.();
          mostrarToast?.(`🛏️ Você descansou na estalagem de ${st.nome} (+15 sanidade).`, 3000);
          abrirVilaMapa(vilaId);
        },
      },
      {
        rotulo: st.servicosAbertos ? `🪵 Vender 5 madeira (${Math.floor((5 * precoMad) / 4)}g)` : '🔒 Comércio fechado',
        desativado: !st.servicosAbertos || (est.meta.recursos.madeira || 0) < 5,
        aoClicar: () => { executarAcaoToast('10', 'vender_madeira'); abrirVilaMapa(vilaId); },
      },
      {
        rotulo: `🔨 Reconstruir (30 mad · 30 ped)`,
        prim: !st.servicosAbertos,
        desativado: (est.meta.recursos.madeira || 0) < 30 || (est.meta.recursos.pedra || 0) < 30,
        aoClicar: () => { executarAcaoToast('01', 'reconstruir'); abrirVilaMapa(vilaId); },
      },
      { rotulo: '🌍 Painel Mundo (01)', aoClicar: () => { fecharModal('modal-dialogo'); abrir('01'); } },
      { rotulo: 'Fechar', aoClicar: () => fecharModal('modal-dialogo') },
    ];
    abrirDialogo(`🏘️ ${st.nome}`, st.servicosAbertos ? 'Sistema 01 · Serviços abertos' : 'Sistema 01 · Serviços fechados', texto, botoes, arteUrl('01', st.vaga));
  }

  function abrirNpcMundo(npcId) {
    const est = estado();
    const def = NPCS_MUNDO.find((n) => n.id === npcId);
    const st = est.mundo['04']?.[npcId];
    if (!def || !st || !abrirDialogo) { abrir('04'); return; }
    const fase = faseDo(est.meta.dia);
    const disp = def.disponivel.includes(fase);
    const mem = st.memorias?.length ? `Última lembrança: ${st.memorias.at(-1)}.` : 'Ainda não conversou com você.';
    const texto = `Fase atual do dia: ${fase}. Confiança: ${st.confianca}/100. ${mem} ${disp ? 'Disponível para conversar agora.' : `Disponível apenas em: ${def.disponivel.join(' ou ')}.`}`;
    abrirDialogo(`💬 ${def.nome}`, 'Sistema 04 · Rotina e Memória', texto, [
      { rotulo: disp ? 'Conversar (+6 confiança)' : `Indisponível (${fase})`, prim: disp, desativado: !disp, aoClicar: () => { executarAcaoToast('04', `conversar_${npcId}`); abrirNpcMundo(npcId); } },
      { rotulo: '🌍 Painel Mundo (04)', aoClicar: () => { fecharModal('modal-dialogo'); abrir('04'); } },
      { rotulo: 'Fechar', aoClicar: () => fecharModal('modal-dialogo') },
    ], arteUrl('04', npcId));
  }

  function abrirRefugioMapa(dados) {
    const est = estado();
    const refs = est.mundo['05']?.refugios || [];
    const prot = Math.round(protecaoContraPragas(est.mundo['05']) * 100);
    if (!abrirDialogo) { abrir('05'); return; }
    if (dados?.tipo === 'terreno_refugio') {
      const pode = (est.meta.recursos.madeira || 0) >= 20 && (est.meta.recursos.pedra || 0) >= 10;
      abrirDialogo('🏰 Terreno do Refúgio', 'Sistema 05 · Abrigo contra pragas', `Você encontrou um local firme para erguer o primeiro Refúgio (custo: 20 madeira e 10 pedra; você tem ${est.meta.recursos.madeira || 0} madeira e ${est.meta.recursos.pedra || 0} pedra). Cada refúgio aumenta o armazém em +100 e protege contra pragas (+20%).`, [
        { rotulo: '🔨 Construir Refúgio (20 mad · 10 ped)', prim: true, desativado: !pode, aoClicar: () => { executarAcaoToast('05', 'construir'); fecharModal('modal-dialogo'); } },
        { rotulo: '🏕️ Abrir Refúgio do Farol', aoClicar: () => { fecharModal('modal-dialogo'); window.regiaoExp?.abrir?.('descanso'); } },
        { rotulo: 'Fechar', aoClicar: () => fecharModal('modal-dialogo') },
      ], arteUrl('05', 'refugio'));
      return;
    }
    const r = refs[dados?.indice || 0] || refs[0];
    const jaDesc = est.meta.refugioDescDia === est.meta.dia;
    const podeMais = refs.length < 3 && (est.meta.recursos.madeira || 0) >= 20 && (est.meta.recursos.pedra || 0) >= 10;
    const texto = `${r?.nome || 'Refúgio'} · Abrigados: ${r?.abrigados || 0}/5 · Proteção contra pragas: ${prot}% · Armazém atual: ${armazem(est)}.`;
    abrirDialogo(`🏰 ${r?.nome || 'Refúgio'}`, 'Sistema 05 · Refúgio no mapa', texto, [
      { rotulo: '🏕️ Entrar no Refúgio do Farol', prim: true, aoClicar: () => { fecharModal('modal-dialogo'); window.regiaoExp?.abrir?.('descanso'); } },
      {
        rotulo: jaDesc ? '🌙 Descansar (usado hoje)' : '🌙 Descansar (+10 sanidade)',
        desativado: jaDesc,
        aoClicar: () => {
          const e = estado();
          e.meta.refugioDescDia = e.meta.dia;
          if (e.idle.jogador) e.idle.jogador.sanidade = Math.min(100, (e.idle.jogador.sanidade ?? 80) + 10);
          atualizarHud?.(); salvar?.();
          mostrarToast?.('🌙 Descanso no Refúgio: +10 sanidade.', 2800);
          abrirRefugioMapa(dados);
        },
      },
      { rotulo: '🐾 Cuidar do Onírico (+10 vínculo)', aoClicar: () => { executarAcaoToast('06', 'cuidar'); abrirRefugioMapa(dados); } },
      ...(refs.length < 3 ? [{ rotulo: `🔨 Erguer Refúgio ${refs.length + 1} (20 mad · 10 ped)`, desativado: !podeMais, aoClicar: () => { executarAcaoToast('05', 'construir'); abrirRefugioMapa(dados); } }] : []),
      { rotulo: 'Fechar', aoClicar: () => fecharModal('modal-dialogo') },
    ], arteUrl('05', dados?.vaga || 'refugio'));
  }

  function abrirMasmorraMapa(masmorraId) {
    const est = estado();
    const info = MASMORRAS_INFO[masmorraId];
    const st = est.mundo['08']?.[masmorraId];
    if (!info || !st || !abrirDialogo) { abrir('08'); return; }
    const dif = dificuldadeMasmorra(est.mundo['08'], masmorraId);
    const nv = dif === 'alta' ? 18 : dif === 'média' ? 12 : 6;
    const podePurificar = (est.meta.recursos.pedra || 0) >= 10;
    const texto = `Infestação atual: ${Math.round(st.infestacao)}/100 · Dificuldade: ${dif} (inimigos Nv.${nv}). Vencer a incursão reduz a infestação em −20 e concede o tesouro diário da masmorra.`;
    abrirDialogo(`🕳️ ${info.nome}`, 'Sistema 08 · Entrada da Masmorra', texto, [
      {
        rotulo: `⚔️ Entrar na Masmorra (Nv.${nv})`,
        prim: true,
        desativado: Boolean(batalhaBloqueando?.() || !tela),
        aoClicar: () => {
          fecharModal('modal-dialogo');
          const s = getSave();
          const aliados = membrosFormacao(s.idle).map(({ m, vaga }) => ({ especie: m.especie, nivel: m.nivel || 1, vaga, arte: arteDoIndividuo(m), bonus: bonusDoMembro(m) }));
          const inimigos = info.inimigos.map((especie) => ({ especie, nivel: nv }));
          tela.abrir({
            titulo: `🕳️ ${info.nome}`,
            sub: `Infestação ${Math.round(st.infestacao)} · risco ${dif}`,
            arena: caminhoArte('08', masmorraId),
            aliados: aliados.length ? aliados : [{ especie: s.conta?.inicial || 'Brasinha', nivel: 5, vaga: 0 }],
            inimigos,
            onFim: (venceu) => {
              if (!venceu) { mostrarToast?.(`Derrota em ${info.nome}. Purifique a entrada ou fortaleça a equipe.`, 3200); return; }
              const e = estado();
              e.mundo['08'][masmorraId].infestacao = Math.max(0, Math.round(e.mundo['08'][masmorraId].infestacao - 20));
              e.meta.masmorrasDia = e.meta.masmorrasDia || {};
              let premioTxt = 'Infestação −20.';
              if (e.meta.masmorrasDia[masmorraId] !== e.meta.dia) {
                e.meta.masmorrasDia[masmorraId] = e.meta.dia;
                for (const [k, v] of Object.entries(info.tesouro)) {
                  if (k === 'diamantes') e.save.recompensas.diamantes = (e.save.recompensas.diamantes || 0) + v;
                  else somarRecurso(e, k, v);
                }
                premioTxt += ` Tesouro: ${Object.entries(info.tesouro).map(([k, v]) => `+${v} ${NOMES_RECURSO[k] || k}`).join(', ')}.`;
              }
              atualizarHud?.(); salvar?.(); noMapa?.atualizar?.();
              mostrarToast?.(`🕳️ ${info.nome} purgada! ${premioTxt}`, 4000);
            },
          });
        },
      },
      { rotulo: '✨ Purificar entrada (10 pedra, −25)', desativado: !podePurificar, aoClicar: () => { executarAcaoToast('08', 'purificar'); abrirMasmorraMapa(masmorraId); } },
      { rotulo: '🌍 Painel Mundo (08)', aoClicar: () => { fecharModal('modal-dialogo'); abrir('08'); } },
      { rotulo: 'Fechar', aoClicar: () => fecharModal('modal-dialogo') },
    ], arteUrl('08', masmorraId));
  }

  function abrirRotaMapa(cidadeAtual) {
    const est = estado();
    const p = est.mundo['10']?.precos || { madeira: 10, pedra: 12, cristal: 40, comida: 8 };
    const rotas = rotasDisponiveisDaCidade(est.mundo, cidadeAtual);
    const tempestade = est.mundo['07']?.clima === 'tempestade';
    if (!abrirDialogo) { abrir('10'); return; }
    const texto = `Cotações de hoje: Madeira ${p.madeira}g · Pedra ${p.pedra}g · Cristal ${p.cristal}g · Comida ${p.comida}g · Caravanas recebidas: ${est.mundo['10']?.caravanas || 0}. ${tempestade ? '⛈️ Tempestade ativa: viagens de caravana suspensas até o tempo abrir.' : 'Escolha uma cidade conectada para viajar pela rota comercial ou negocie madeira.'}`;
    const botoes = [
      {
        rotulo: `🪵 Vender 5 madeira (${Math.floor((5 * p.madeira) / 4)}g)`,
        prim: true,
        desativado: tempestade || (est.meta.recursos.madeira || 0) < 5,
        aoClicar: () => { executarAcaoToast('10', 'vender_madeira'); abrirRotaMapa(cidadeAtual); },
      },
      ...rotas.map((r) => {
        const regBloq = Boolean(r.regiao && !regiaoDesbloqueada(getSave(), r.regiao));
        const aberta = r.aberta && !regBloq;
        const motivo = regBloq ? 'Região 2 bloqueada' : r.motivo;
        return {
          rotulo: aberta ? `🛒 Ir para ${r.nome}` : `🔒 ${r.nome} (${motivo})`,
          desativado: !aberta || !entrarNoMapa,
          aoClicar: async () => {
            fecharModal('modal-dialogo');
            await entrarNoMapa(r.mapa);
            mostrarToast?.(`🛒 Caravana chegou em ${r.nome}.`, 2800);
          },
        };
      }),
      { rotulo: '🌍 Painel Mundo (10)', aoClicar: () => { fecharModal('modal-dialogo'); abrir('10'); } },
      { rotulo: 'Fechar', aoClicar: () => fecharModal('modal-dialogo') },
    ];
    abrirDialogo(cidadeAtual === 'C1' ? '⚖️ Mercado Regional' : '🛒 Caravana Comercial', 'Sistema 10 · Rotas entre cidades', texto, botoes, arteUrl('10', cidadeAtual === 'C1' ? 'mercado' : 'caravana'));
  }

  function interagirElemento(el) {
    if (!el) return;
    if (el.dados?.tipo === 'vila') { abrirVilaMapa(el.dados.vilaId); return; }
    if (el.dados?.tipo === 'npc_mundo') { abrirNpcMundo(el.dados.npcId); return; }
    if (el.dados?.tipo === 'refugio' || el.dados?.tipo === 'terreno_refugio') { abrirRefugioMapa(el.dados); return; }
    if (el.dados?.tipo === 'masmorra') { abrirMasmorraMapa(el.dados.masmorraId); return; }
    if (el.dados?.tipo === 'rota') { abrirRotaMapa(el.dados.cidade); return; }
    abrir(el.sis);
  }

  // Pistas do Sistema 09 (Investigação) integradas aos NPCs da campanha
  function botaoInvestigacaoNpc(npc) {
    if (!MUNDO_ATIVO || !npc?.id) return null;
    const est = estado();
    const info = investigacaoNpcInfo(est.mundo, npc.id);
    if (!info) return null;
    return {
      rotulo: info.correspondente
        ? `🔍 Investigar pista (${info.encontradas}/${info.total})`
        : `🔍 Perguntar sobre o caso (${info.encontradas}/${info.total})`,
      aoClicar: () => {
        if (!info.correspondente) {
          abrirDialogo(`🔍 ${npc.nome}`, 'Sistema 09 · Investigação', `"Não vi nada por aqui agora, mas ouvi um boato: ${info.dica}"`, [
            { rotulo: '🌍 Ver Quadro (09)', aoClicar: () => { fecharModal('modal-dialogo'); abrir('09'); } },
            { rotulo: 'Fechar', prim: true, aoClicar: () => fecharModal('modal-dialogo') },
          ], arteUrl('09', 'quadro'));
          return;
        }
        const antes = est.mundo['09']?.caso?.encontradas || 0;
        const notas = executarAcaoToast('09', 'investigar');
        const depois = estado().mundo['09']?.caso?.encontradas || 0;
        const arte = depois > antes ? `pista-${Math.min(3, depois)}` : 'lupa';
        abrirDialogo(`🔍 Investigação · ${npc.nome}`, `Sistema 09 · Pistas ${depois}/${info.total}`, notas.join(' '), [
          { rotulo: '🌍 Ver Quadro (09)', aoClicar: () => { fecharModal('modal-dialogo'); abrir('09'); } },
          { rotulo: 'Continuar', prim: true, aoClicar: () => fecharModal('modal-dialogo') },
        ], arteUrl('09', arte));
      },
    };
  }

  const css = document.createElement('style');
  css.textContent = '#modal-mundo .tut-card { border-color: #7dd3fc; background: #14304a; } #modal-mundo .tut-destaque { outline: 2px solid #f3a458; box-shadow: 0 0 0 4px #f3a45844; animation: tutpulso 1.4s ease-in-out infinite; } @keyframes tutpulso { 50% { box-shadow: 0 0 0 8px #f3a45822; } } .menu-selo-mundo { position: absolute; top: -5px; right: -5px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 999px; background: #f59e0b; color: #1b0f21; font: 800 10px/16px system-ui, sans-serif; text-align: center; box-shadow: 0 0 0 2px #1b0f21; pointer-events: none; } #m-mundo.tem-novo { border-color: #f59e0b; color: #fcd34d; }';
  document.head.append(css);
  atualizarSeloMundo();
  // Marca sistemas novos com um selo discreto no botão Menu (sem toast central cobrindo a tela)
  setInterval(() => {
    if (!MUNDO_ATIVO) return;
    const m = estado().meta; m.avisados = m.avisados || {};
    const novos = [...sistemasLiberados(getSave())].filter((id) => !m.avisados[id]);
    if (!novos.length) return;
    novos.forEach((id) => { m.avisados[id] = true; });
    m.novosNaoLidos = (Number(m.novosNaoLidos) || 0) + novos.length;
    salvar?.();
    atualizarSeloMundo();
  }, 2500);
  const noMapa = (mapaCtx && MUNDO_ATIVO && MUNDO_NO_MAPA) ? iniciarMundoNoMapa({
    ...mapaCtx,
    liberado: liberadoMapa,
    getMapaAtual,
    getMundo: () => estado().mundo,
    getMeta: () => estado().meta,
    abrirSistema: (id) => abrir(id),
    interagirElemento,
    algumModalAberto: () => Boolean(document.querySelector('.modal-bg.aberto')),
  }) : { atualizar: () => {}, empurrar: () => null, circulosPx: () => [], elementos: () => [], interagir: () => false };
  // Efeitos do mundo sobre a caçada: praga enfraquece (refúgios protegem), clima mexe no dano e no ouro.
  function modificadores() {
    if (!MUNDO_ATIVO) return { dano: 1, ouro: 1, notas: [] };
    const m = estado().mundo;
    const protecao = protecaoContraPragas(m['05']);
    let dano = 1, ouro = 1;
    const notas = [];
    if (m['15']?.ativa) { const f = (m['15'].nivel || 0) / 400 * (1 - protecao); dano *= 1 - f; if (f > 0.005) notas.push(`praga −${Math.round(f * 100)}% dano`); }
    const clima = m['07']?.clima;
    if (clima === 'tempestade') { dano *= 0.92; notas.push('tempestade −8% dano'); }
    else if (clima === 'neve') { dano *= 0.97; notas.push('neve −3% dano'); }
    else if (clima === 'sol') { ouro *= 1.05; notas.push('sol +5% ouro'); }
    // Facções (sistema 03): cada uma com reputação alta dá um bônus pequeno e diferente
    const f = m['03']?.valores || m['03'] || {};
    const rep = (k) => Number(f[k] ?? 0);
    const tier = (v) => (v >= 60 ? 2 : v >= 30 ? 1 : 0);
    const tG = tier(rep('guardioes') || rep('Guardiões da Luz')), tC = tier(rep('culto') || rep('Culto das Sombras')), tP = tier(rep('guilda') || rep('Guilda do Porto'));
    if (tG) { dano *= 1 + 0.03 * tG; notas.push(`Guardiões +${3 * tG}% dano`); }
    if (tC) { dano *= 1 + 0.04 * tC; notas.push(`Culto +${4 * tC}% dano`); }
    if (tP) { ouro *= 1 + 0.05 * tP; notas.push(`Guilda +${5 * tP}% ouro`); }
    return { dano, ouro, notas };
  }

  // Ecossistema (sistema 02): espécie rara demora mais para voltar ao mapa; abundante volta mais depressa.
  function tempoRespawn(especie) {
    if (!MUNDO_ATIVO) return 5000;
    const pop = estado().mundo['02']?.populacao;
    if (!pop || !(especie in pop)) return 5000;
    return pop[especie] <= POP_RARA ? 15000 : pop[especie] >= 25 ? 3000 : 5000;
  }

  // Cada abate alimenta o mundo: o ecossistema perde um monstro e o bioma devolve recursos (menos se a espécie está rara).
  const POP_RARA = 3;
  function aoAbater(morto) {
    if (!MUNDO_ATIVO) return;
    const est = estado();
    const pop = est.mundo['02']?.populacao;
    const esp = morto?.especie;
    const rara = pop && esp in pop && pop[esp] <= POP_RARA;
    if (pop && esp in pop) pop[esp] = Math.max(0, pop[esp] - 1);
    const b = BIOMA_RECURSOS[biomaDoMapa(getMapaAtual?.())];
    const chaves = Object.keys(b);
    const k = chaves[Math.floor(Math.random() * chaves.length)];
    const ganho = rara ? 0 : 1 + (Math.random() < 0.25 ? 1 : 0);
    if (ganho) somarRecurso(est, k, ganho);
    const m = est.meta; m.abates = (m.abates || 0) + 1;
    if (rara && !m.avisouRaro) { m.avisouRaro = true; mostrarToast?.(`🌍 ${esp} está raro nesta região: a caça rende menos até a população se recuperar.`, 3600); }
    if (m.abates % 10 === 0) salvar?.();
  }

  // Clima e hora do dia na tela (sistema 07). Não aparece em cavernas nem com Economia de Energia.
  const clima = iniciarClima({
    getClima: () => estado().mundo['07'] || {},
    interno: () => biomaDoMapa(getMapaAtual?.()) === 'Caverna',
    fase: () => Math.max(0, Math.min(1, (Date.now() - estado().meta.ultimoMs) / DIA_MS)),
    desligado: () => !MUNDO_ATIVO || Boolean(getSave().idle?.config?.economiaEnergia),
  });

  return {
    noMapa,
    clima,
    modificadores,
    tempoRespawn,
    aoAbater,
    abrir,
    abrirSistema: (id) => abrir(id),
    interagirElemento,
    botaoInvestigacaoNpc,
    estado,
    passarDia: (n = 1) => { const est = estado(); const notas = []; for (let i = 0; i < n; i++) notas.push(...passarDia(est, false)); salvar?.(); noMapa?.atualizar?.(); return notas; },
    acao: (sis, acao, args = {}) => { const est = estado(); const res = acaoMundo(est.mundo, sis, acao, args, contexto(est, est.meta.dia)); const notas = aplicar(est, res); salvar?.(); noMapa?.atualizar?.(); return notas; },
  };
}
