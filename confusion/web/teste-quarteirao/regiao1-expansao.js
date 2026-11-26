// Expansão 1 (interface): navegação por modos liberados pela história, Banner/Equipe/Evolução, Caçadas e Calabouço, Guilda (contratos,
// Fazenda, Oficina, Reinos), Crônicas (Crise e Herói × Vilão) e tutoriais curtos com "Rever". Regras em regiao1-exp-regras.js.
import * as R from './regiao1-exp-regras.js';
import { MARCOS, CACADAS, POS_CACADA, FAB, PROFISSOES, CONTRATOS, ICONE_CONTRATO, CALABOUCO, CRISE, HV, MOLDURAS_BANNER, arteMoldura } from './regiao1-exp-dados.js';
import { coletarTudo, prontoParaColetar, candidatasObra, enfileirarObras, previsaoLote, fabricarLote, repetirUltimoLote, gestaoDe, capacidade, bonusProfissao } from './regiao1-gestao-regras.js';
import { ARTE_DA_ESPECIE, linhaDaEspecie } from '../species.js';
import { LIMITE_ALIADOS } from './regiao1-estrategia-regras.js';
import { arteDoIndividuo } from './regiao1-halloween-dados.js';
import { hwDe } from './regiao1-halloween-regras.js';
import { POSICOES } from './regiao1-batalha-tela.js';

const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const IMG = (p) => `../../../${p}`;
const dur = (ms) => { const t = Math.max(0, Math.ceil(ms / 1000)); return t >= 3600 ? `${Math.floor(t / 3600)}h${String(Math.floor((t % 3600) / 60)).padStart(2, '0')}` : t >= 60 ? `${Math.floor(t / 60)}min${String(t % 60).padStart(2, '0')}s` : `${t}s`; };
const RARO = { comum: '#9ca3af', rara: '#60a5fa', epica: '#c084fc', lendaria: '#fbbf24' };
const cacheArte = new Map();
function resolverArte(principal, fallback) {
  if (!fallback || principal === fallback) return Promise.resolve(principal);
  if (cacheArte.has(principal)) return Promise.resolve(cacheArte.get(principal));
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => { cacheArte.set(principal, principal); resolve(principal); };
    im.onerror = () => { cacheArte.set(principal, fallback); resolve(fallback); };
    im.src = IMG(principal);
  });
}
const icoItem = (def, emojiPadrao = '') => (def?.arte ? `<img class="exp-ico" src="${IMG(def.arte)}" alt="" data-emoji="${esc(def.icone || emojiPadrao)}" onerror="this.replaceWith(document.createTextNode(this.dataset.emoji||''))">` : (def?.icone || emojiPadrao));
const imgFallback = (arte, fallback, cls, alt = '') => `<img class="${cls}" src="${IMG(arte)}" ${fallback ? `data-fb="${IMG(fallback)}"` : ''} alt="${esc(alt)}" onerror="if(this.dataset.fb){const f=this.dataset.fb;delete this.dataset.fb;this.src=f;}else{this.style.display='none';}">`;
const TUTS = {
  banner: { titulo: 'Banner de Oníricos', passos: ['Você ganhou seu primeiro ticket ao concluir uma missão de história. Cada missão nova dá mais um, uma única vez.', 'Toque em Invocar para gastar 1 ticket e receber um Onírico novo: o Banner é a única forma de obtê-los.', 'Equipe e Evolução ficam nas outras abas deste menu.'], destaque: '[data-invocar]' },
  cacadas: { titulo: 'Caçadas', passos: ['Cada Caçada é um mapa exclusivo cheio de Oníricos e de materiais para fabricar.', 'Toque em Entrar, ligue o Auto-Caça no mapa e deixe-o rodar. Ao sair, você volta ao ponto da Campanha.'], destaque: '[data-entrar]' },
  guilda: { titulo: 'Guilda dos Aventureiros', passos: ['Aqui você aceita contratos, busca o que pedem e volta para entregar.', 'O primeiro contrato pede fibras de uma Caçada. Toque em Aceitar para começar.', 'A Guilda conduz você à Fazenda e à Oficina.'], destaque: '[data-aceitar]' },
  fazenda: { titulo: 'Fazenda', passos: ['O curral, o apiário e o galinheiro produzem leite, mel e ovos sozinhos, até com o jogo fechado.', 'Toque em Coletar tudo para recolher a produção pronta. O estoque tem teto: o que não couber fica pendente.'], destaque: '[data-coletar]' },
  oficina: { titulo: 'Oficina e Profissões', passos: ['Escolha uma receita e a quantidade: o menu mostra o que será produzido e os insumos.', 'Toque em Fabricar lote. Depois, Repetir último lote fabrica de novo sem reconfigurar.', 'O Tônico de Lucidez restaura a Sanidade no Calabouço.'], destaque: '[data-fabricar]' },
  calabouco: { titulo: 'Calabouço e Sanidade', passos: ['A Sanidade só existe aqui. Salas corrompidas a reduzem.', 'Com a Sanidade baixa você escolhe: gastar um Tônico, avançar com risco (ganhos dobrados) ou sair com os ganhos.', 'Zerar a Sanidade faz você perder metade dos ganhos.'], destaque: '[data-cal-entrar], [data-cal-avancar]' },
  reinos: { titulo: 'Reinos', passos: ['Escolha um reino, toque em Ir e aguarde o carregamento: o mapa abre em tela cheia.', 'Arraste para mover a câmera, use zoom e toque num terreno para construir. A Prefeitura libera mais terrenos.'], destaque: '' },
  crise: { titulo: 'Crise da Vila do Norte', passos: ['A mesma vila passa por cinco estados: saudável, contaminada, tomada, purificada e reconstruída.', 'Toque no botão de ação do estado atual. Zumbis aparecem nas ruas durante o surto.', 'Purificar e reconstruir precisam de itens da Oficina e da Caçada.'], destaque: '[data-crise]' },
  hv: { titulo: 'Herói × Vilão', passos: ['Escolha o capítulo e depois a missão. Cada missão tem diálogo e uma batalha em tela inteira.', 'Na missão 5 você faz uma escolha que muda os objetivos seguintes e o desfecho.'], destaque: '[data-missao]' },
};

export function iniciarExpansao({ getSave, salvar, mostrarToast, abrirModal, fecharModal, MAPAS, MONSTROS, regiao1, irParaMapa, getMapaId, getPosPx, voltarAoPonto, batalhaBloqueando, tela }) {
  const save = () => getSave();
  const exp = () => R.expDe(save());
  const fab = () => R.fabEstado(save());

  // ---------- Caçadas: mapas exclusivos reaproveitando arte e máscara de um mapa existente ----------
  for (const c of CACADAS) {
    const base = MAPAS[c.base]; if (!base) continue;
    MAPAS[`CAC_${c.id}`] = { ...base, id: `CAC_${c.id}`, nome: `Caçada · ${c.nome}`, saidas: [], marco: null, spawnPadrao: [512, 300], cacada: c.id };
    c.onir.forEach((esp, i) => { for (let k = 0; k < 2; k++) { const j = i * 2 + k; MONSTROS.push({ id: `w_${c.id}_${j}`, mapa: `CAC_${c.id}`, especie: esp, nivel: c.nivel[0] + (j % (c.nivel[1] - c.nivel[0] + 1)), pos: POS_CACADA[j % POS_CACADA.length], sprite: IMG(ARTE_DA_ESPECIE[esp] || `assets/monsters/${esp.toLowerCase()}/sprite-front.png`) }); } });
  }

  // ---------- CSS e DOM ----------
  const css = document.createElement('style');
  css.textContent = `
    #btn-fazenda, #btn-reinos, #mochila-esferas, label:has(#ac-capturar), .bar-row:has(#bar-san-fill) { display: none !important; }
    #exp-nav { position: fixed; left: 50%; bottom: calc(8px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); z-index: 7; display: none; gap: 5px; max-width: calc(100vw - 300px); flex-wrap: wrap; justify-content: center; }
    #exp-nav button { min-height: 34px; padding: 3px 9px; font-size: 12px; }
    #exp-nav button.novo { animation: expnovo 1.2s ease-in-out infinite; } @keyframes expnovo { 50% { box-shadow: 0 0 0 5px #f3a45855; } }
    #exp-sair-cacada { position: fixed; left: 50%; top: 56px; transform: translateX(-50%); z-index: 8; display: none; }
    #modal-exp .exp-card { width: min(720px, 100%); max-height: calc(100dvh - 16px); overflow: hidden; display: flex; flex-direction: column; padding: 8px 12px; }
    #modal-exp .modal-head { position: static; margin-bottom: 4px; padding: 2px 0; align-items: center; gap: 6px; } #modal-exp .modal-head h3 { flex: 1; margin: 0; font-size: 15px; }
    #modal-exp .exp-abas { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 6px; } #modal-exp .exp-abas button[aria-selected="true"] { background: #f3a458; color: #21110c; }
    #modal-exp .exp-corpo { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
    #modal-exp .bl { background: #352238; border: 1px solid #6b4a52; border-radius: 8px; padding: 9px; margin-bottom: 7px; font-size: 12.5px; line-height: 1.45; } #modal-exp .bl h4 { margin: 0 0 4px; font-size: 13px; color: #f3c27a; } #modal-exp .bl p { margin: 2px 0; }
    #modal-exp .tut { border-color: #7dd3fc; background: #14304a; } #modal-exp .tut-destaque { outline: 2px solid #f3a458; box-shadow: 0 0 0 4px #f3a45844; animation: expnovo 1.4s ease-in-out infinite; }
    #modal-exp .ln { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 6px; } #modal-exp .ok { color: #4ade80; } #modal-exp .ruim { color: #fb7185; } #modal-exp .mut { opacity: .7; }
    #modal-exp .exp-ico { width: 18px; height: 18px; object-fit: contain; vertical-align: -3px; margin-right: 2px; }
    #modal-exp .card-on { display: flex; gap: 12px; align-items: center; }
    #modal-exp .card-mold { position: relative; width: 88px; height: 110px; flex: 0 0 88px; border-radius: 10px; border: 2px solid var(--cor-m, #9ca3af); background: radial-gradient(circle, #351b42, #180c20); display: flex; align-items: center; justify-content: center; overflow: hidden; }
    #modal-exp .card-mold.m5 { box-shadow: 0 0 12px #fbbf2488; animation: expnovo 1.8s ease-in-out infinite; }
    #modal-exp .card-mold img.sp { width: 78%; height: 78%; object-fit: contain; z-index: 1; }
    #modal-exp .card-mold img.ov { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: fill; pointer-events: none; z-index: 2; }
    #modal-exp .cal-capa, #modal-exp .hv-capa { width: 100%; max-height: 112px; object-fit: cover; border-radius: 8px; display: block; margin-bottom: 6px; }
    #modal-exp .cal-sala { display: flex; gap: 10px; align-items: center; } #modal-exp .cal-carta { width: 64px; height: 64px; flex: 0 0 64px; border-radius: 8px; object-fit: cover; border: 1px solid #6b4a52; }
    #modal-exp .hp-eq { height: 10px; background: #12091a; border-radius: 5px; overflow: hidden; margin: 3px 0; } #modal-exp .hp-eq i { display: block; height: 100%; background: linear-gradient(90deg, #10b981, #6ee7b7); transition: width .3s; }
    #modal-exp .hv-dlg { display: flex; gap: 12px; align-items: flex-end; } #modal-exp .hv-busto { width: clamp(68px, 15vw, 108px); height: clamp(86px, 23vh, 140px); object-fit: contain; object-position: bottom; flex: 0 0 auto; filter: drop-shadow(0 3px 6px #000a); }
    #modal-exp .hv-fala { flex: 1; min-width: 0; } #modal-exp .hv-quem { display: inline-block; padding: 1px 7px; border-radius: 6px; background: #f3a45828; border: 1px solid #f3a45888; color: #f3c27a; font-weight: 700; font-size: 11.5px; margin-bottom: 4px; }
    #modal-exp .grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(86px, 1fr)); gap: 6px; } #modal-exp .mini { text-align: center; font-size: 10.5px; background: #24162b; border-radius: 8px; padding: 4px; } #modal-exp .mini img { width: 100%; height: 64px; object-fit: contain; }
    #modal-exp .eq-arena { position: relative; height: clamp(170px, 46vh, 300px); border-radius: 10px; background: center / cover; overflow: hidden; margin: 6px 0; }
    #modal-exp .eq-vaga { position: absolute; transform: translate(-50%, -100%); width: clamp(70px, 15vw, 120px); display: flex; flex-direction: column; align-items: center; background: rgba(20,10,28,.45); border: 2px dashed #c8b08a; border-radius: 10px; color: #fff3e7; font: 600 10.5px system-ui; padding: 3px; touch-action: none; }
    #modal-exp .eq-vaga img { width: 100%; height: clamp(44px, 12vh, 84px); object-fit: contain; pointer-events: none; } #modal-exp .eq-vaga.vazia { opacity: .6; min-height: 50px; justify-content: center; } #modal-exp .eq-vaga.sel, #modal-exp .eq-col.sel { outline: 3px solid #fb923c; border-style: solid; }
    #modal-exp .san { height: 14px; background: #12091a; border-radius: 7px; overflow: hidden; } #modal-exp .san i { display: block; height: 100%; background: linear-gradient(90deg, #7c3aed, #38bdf8); transition: width .3s; }
    #exp-crise { position: fixed; inset: 0; z-index: 56; display: none; flex-direction: column; background: #12091a; color: #fff3e7; }
    #exp-crise.vis { display: flex; } #exp-crise .cr-topo { display: flex; gap: 8px; align-items: center; padding: 6px 10px; background: rgba(26,15,34,.9); z-index: 3; } #exp-crise .cr-topo b { flex: 1; color: #f3c27a; }
    #exp-crise .cr-mapa { position: relative; flex: 1 1 auto; min-height: 0; background: center / cover no-repeat; transition: background-image .4s; overflow: hidden; }
    #exp-crise .zumbi { position: absolute; width: clamp(48px, 9vw, 90px); transform: translate(-50%, -50%); animation: zandar 2.2s ease-in-out infinite alternate; filter: drop-shadow(0 3px 3px #000a); } @keyframes zandar { from { margin-left: -14px; } to { margin-left: 14px; } }
    #exp-crise .cr-baixo { padding: 8px 10px calc(8px + env(safe-area-inset-bottom, 0px)); background: rgba(26,15,34,.94); z-index: 3; } #exp-crise .cr-baixo p { margin: 2px 0 6px; font-size: 12.5px; }
    #exp-crise .cr-etapas { display: flex; gap: 4px; margin-bottom: 6px; } #exp-crise .cr-etapas span { flex: 1; text-align: center; padding: 3px 0; font-size: 10.5px; border-radius: 6px; background: #2b1a36; } #exp-crise .cr-etapas span.on { background: #f3a458; color: #21110c; font-weight: 700; } #exp-crise .cr-etapas span.feito { background: #3f6b4a; }`;
  document.head.append(css);

  const nav = document.createElement('div'); nav.id = 'exp-nav'; document.body.append(nav);
  const sair = document.createElement('button'); sair.id = 'exp-sair-cacada'; sair.className = 'btn-pri'; sair.textContent = '↩ Sair da Caçada'; document.body.append(sair);
  const modal = document.createElement('div'); modal.id = 'modal-exp'; modal.className = 'modal-bg';
  modal.innerHTML = '<div class="modal-card exp-card" role="dialog" aria-modal="true"><header class="modal-head"><h3 id="exp-titulo"></h3><button class="btn-sec" id="exp-rever" hidden>Rever tutorial</button><button class="btn-fechar" id="exp-fechar" aria-label="Fechar">✕</button></header><nav class="exp-abas" id="exp-abas"></nav><div class="exp-corpo" id="exp-corpo"></div></div>';
  document.body.append(modal);
  const crise = document.createElement('div'); crise.id = 'exp-crise'; document.body.append(crise);
  const $ = (q) => modal.querySelector(q);

  // ---------- estado de tela ----------
  let painel = null, aba = 0, revendo = null, resumoUlt = null, loteRec = 'tonico', loteQtd = 3, ultimaInvocacao = null, hvEstado = null; let cap = 'cap1';
  const PAINEIS = { oniricos: { titulo: '🥚 Oníricos', abas: ['Banner', 'Equipes', 'Evolução'], tut: 'banner' }, cacadas: { titulo: '🏹 Caçadas', abas: ['Caçadas', 'Calabouço'], tut: 'cacadas' }, guilda: { titulo: '🏛️ Guilda dos Aventureiros', abas: ['Contratos', 'Fazenda', 'Oficina', 'Reinos'], tut: 'guilda' }, cronicas: { titulo: '📜 Crônicas', abas: ['Crise', 'Herói × Vilão'], tut: 'crise' } };
  const tutDaAba = (p, a) => (p === 'guilda' ? ['guilda', 'fazenda', 'oficina', 'reinos'][a] : p === 'cacadas' ? ['cacadas', 'calabouco'][a] : p === 'cronicas' ? ['crise', 'hv'][a] : ['banner', null, null][a]);
  function cartaoTut(id) {
    const t = TUTS[id]; if (!t) return '';
    const visto = exp().tut[id]; if (visto && revendo !== id) return '';
    return `<div class="bl tut"><h4>📘 ${esc(t.titulo)}</h4>${t.passos.map((p, i) => `<p>${i + 1}. ${esc(p)}</p>`).join('')}<div class="ln"><button class="btn-pri" data-tutok="${id}">Entendi</button></div></div>`;
  }
  const destacar = (id) => { const t = TUTS[id]; const vis = t && (!exp().tut[id] || revendo === id); if (!vis || !t.destaque) return; for (const sel of t.destaque.split(',')) { const e = $('#exp-corpo').querySelector(sel.trim()); if (e) { e.classList.add('tut-destaque'); break; } } };
  const fabD = () => FAB;

  // ---------- Banner / Equipe / Evolução ----------
  function artePequena(esp) { const p = ARTE_DA_ESPECIE[esp] || `assets/monsters/${esp.toLowerCase()}/sprite-front.png`; return IMG(p); }
  function abaBanner() {
    const e = exp(); let h = `<div class="bl"><h4>🎫 Tickets: ${e.tickets}</h4><p>O Banner é a <b>única forma</b> de obter Oníricos novos. Cada missão de história concluída pela primeira vez dá 1 ticket, e os contratos diários da Guilda também pagam tickets. Chances: comum 70% · rara 22% · épica 7% · lendária 1% (a cada 10 invocações, no mínimo rara).</p><div class="ln"><button class="btn-pri" data-invocar="1" ${e.tickets ? '' : 'disabled'}>Invocar (1 ticket)</button></div></div>`;
    if (ultimaInvocacao) {
      const mN = MOLDURAS_BANNER[ultimaInvocacao.raridade] || 1;
      h += `<div class="bl card-on"><div class="card-mold ${mN >= 5 ? 'm5' : ''}" style="--cor-m:${RARO[ultimaInvocacao.raridade]}"><img class="sp" src="${artePequena(ultimaInvocacao.especie)}" alt="${esc(ultimaInvocacao.especie)}"><img class="ov" src="${IMG(arteMoldura(mN))}" alt="" onerror="this.style.display='none'"></div><div><h4>${esc(ultimaInvocacao.especie)}</h4><p style="color:${RARO[ultimaInvocacao.raridade]}">${ultimaInvocacao.raridade} · ${esc(ultimaInvocacao.elemento)}</p><p class="mut">Adicionado à coleção (nível 1).</p></div></div>`;
    }
    h += `<div class="bl"><h4>Oníricos no Banner (${R.poolBanner().length})</h4><div class="grade">${R.poolBanner().map((p) => `<div class="mini"><img src="${artePequena(p.especie)}" alt="" loading="lazy">${esc(p.especie)}<br><span style="color:${RARO[p.raridade]}">${p.raridade}</span></div>`).join('')}</div></div>`;
    return h;
  }
  // Equipes: coleção + 4 vagas nas posições da arena. Toque para colocar/trocar; arraste uma vaga sobre outra para reorganizar.
  let selEq = null; // { tipo: 'col' | 'vaga', uid?, vaga? }
  const arteDe = (m) => (arteDoIndividuo(m) ? `../../../${arteDoIndividuo(m)}` : artePequena(m.especie));
  function abaEquipe() {
    const idle = save().idle, eq = idle.equipe || [], f = R.formacaoDe(idle);
    const vagas = POSICOES.a.map(([x, y], v) => {
      const m = eq.find((o) => o.uid === f[v]); const sel = selEq?.tipo === 'vaga' && selEq.vaga === v;
      return `<button class="eq-vaga ${sel ? 'sel' : ''} ${m ? '' : 'vazia'}" data-eq-vaga="${v}" style="left:${x}%;top:${y}%">${m ? `<img src="${arteDe(m)}" alt=""><span>${esc(m.especie)} · nv.${m.nivel || 1}</span>` : `<span>Vaga ${v + 1}</span>`}</button>`;
    }).join('');
    const col = eq.map((m) => { const na = f.indexOf(m.uid); const sel = selEq?.tipo === 'col' && selEq.uid === m.uid; return `<button class="mini eq-col ${sel ? 'sel' : ''}" data-eq-col="${m.uid}"><img src="${arteDe(m)}" alt="" loading="lazy">${esc(m.especie)}<br>nv.${m.nivel || 1}${m.tierHW ? ` · T${m.tierHW}` : ''}${na >= 0 ? `<br><span class="ok">Vaga ${na + 1}</span>` : ''}</button>`; }).join('');
    const dica = selEq ? (selEq.tipo === 'col' ? 'Toque numa vaga para colocar este Onírico.' : 'Toque noutra vaga para trocar, num Onírico da coleção para substituir, ou retire-o.') : 'Toque num Onírico da coleção e depois numa vaga. Arraste uma vaga sobre outra para reorganizar.';
    return `<div class="bl"><h4>Formação (${f.filter(Boolean).length}/4)</h4><p class="mut">${dica}</p>
      <div class="eq-arena" style="background-image:url('../../../assets/confusion/interface/estrategia/madeira-01.webp')">${vagas}</div>
      ${selEq?.tipo === 'vaga' && f[selEq.vaga] ? `<div class="ln"><button class="btn-sec" data-eq-tirar="${selEq.vaga}">Retirar da vaga ${selEq.vaga + 1}</button><button class="btn-sec" data-eq-cancelar="1">Cancelar</button></div>` : ''}
      <p class="mut">A formação vale na Campanha, na Torre, nas expedições da Estratégia e dos Reinos e em Herói × Vilão.</p></div>
      <div class="bl"><h4>Coleção (${eq.length})</h4><div class="grade">${col}</div></div>`;
  }
  function tocarEquipe(d) {
    const idle = save().idle;
    if (d.eqCancelar) { selEq = null; return true; }
    if (d.eqTirar !== undefined) { if (!R.tirarDaVaga(idle, Number(d.eqTirar))) mostrarToast('Mantenha ao menos um Onírico na formação.', 2200); selEq = null; salvar(); return true; }
    if (d.eqCol) { if (selEq?.tipo === 'vaga') { R.colocarNaVaga(idle, d.eqCol, selEq.vaga); selEq = null; salvar(); } else selEq = selEq?.uid === d.eqCol ? null : { tipo: 'col', uid: d.eqCol }; return true; }
    if (d.eqVaga !== undefined) {
      const v = Number(d.eqVaga), f = R.formacaoDe(idle);
      if (selEq?.tipo === 'col') { R.colocarNaVaga(idle, selEq.uid, v); selEq = null; salvar(); }
      else if (selEq?.tipo === 'vaga') { if (selEq.vaga !== v) { R.trocarVagas(idle, selEq.vaga, v); salvar(); } selEq = null; }
      else if (f[v]) selEq = { tipo: 'vaga', vaga: v };
      return true;
    }
    return false;
  }
  // arrastar uma vaga sobre outra (toque ou mouse)
  (function arrastoVagas() {
    let de = null, fantasma = null;
    document.addEventListener('pointerdown', (e) => { const b = e.target.closest?.('#modal-exp .eq-vaga:not(.vazia)'); if (!b) return; de = { vaga: Number(b.dataset.eqVaga), x: e.clientX, y: e.clientY, moveu: false, img: b.querySelector('img')?.src }; });
    document.addEventListener('pointermove', (e) => {
      if (!de) return; if (!de.moveu && Math.hypot(e.clientX - de.x, e.clientY - de.y) < 8) return;
      de.moveu = true; if (!fantasma) { fantasma = document.createElement('img'); fantasma.src = de.img || ''; fantasma.style.cssText = 'position:fixed;width:64px;height:64px;object-fit:contain;pointer-events:none;z-index:99;opacity:.85'; document.body.append(fantasma); }
      fantasma.style.left = `${e.clientX - 32}px`; fantasma.style.top = `${e.clientY - 32}px`;
    });
    document.addEventListener('pointerup', (e) => {
      if (!de) return; const d = de; de = null; fantasma?.remove(); fantasma = null; if (!d.moveu) return;
      const alvo = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('#modal-exp .eq-vaga'); if (!alvo) return;
      const v = Number(alvo.dataset.eqVaga); if (v !== d.vaga) { R.trocarVagas(save().idle, d.vaga, v); salvar(); } selEq = null; render(); window.__eqArrastou = Date.now();
    });
  })();
  function proximaForma(m) {
    const l = linhaDaEspecie(m.especie); if (!l) return null;
    if (m.especie === l.inicial) return { para: l.atual, nivel: 5 }; if (m.especie === l.atual) return { para: l.evolucao, nivel: 10 }; return null;
  }
  function abaEvolucao() {
    const eq = save().idle.equipe || [];
    return `<div class="bl"><h4>Evolução</h4><p class="mut">Cada linha evolui em dois degraus (níveis 5 e 10). Só as cinco linhas iniciais têm formas cadastradas por enquanto.</p>${eq.map((m, i) => { const f = proximaForma(m); if (!f) return `<p>${esc(m.especie)} nv.${m.nivel || 1}: <span class="mut">sem evolução disponível</span></p>`; const ok = (m.nivel || 1) >= f.nivel; return `<p>${esc(m.especie)} nv.${m.nivel || 1} → <b>${esc(f.para)}</b> (nv.${f.nivel}) ${ok ? `<button class="btn-pri" data-evoluir="${i}">Evoluir</button>` : '<span class="ruim">nível insuficiente</span>'}</p>`; }).join('')}</div>`;
  }

  // ---------- Caçadas e Calabouço ----------
  function abaCacadas() {
    const s = fab(); let h = `<div class="bl"><h4>Materiais</h4><p>🌿 Fibra <b>${s.materiais.fibra}</b> · 💠 Cristal <b>${s.materiais.cristal}</b></p><p class="mut">Ligue o Auto-Caça (botão Auto) dentro da Caçada. Os abates rendem materiais.</p></div>`;
    for (const c of CACADAS) { const ab = R.questFeita(save(), c.requer); h += `<div class="bl"><h4>${esc(c.nome)}</h4><p>Materiais: ${Object.keys(c.materiais).map((k) => FAB.materiais[k].icone + ' ' + FAB.materiais[k].nome).join(', ')} · Oníricos: ${c.onir.join(', ')}</p>${ab ? `<div class="ln"><button class="btn-pri" data-entrar="${c.id}">Entrar</button></div>` : `<p class="ruim">🔒 Libera ao concluir a missão "${esc(c.requer)}" da história.</p>`}</div>`; }
    return h;
  }
  function abaCalabouco() {
    const e = exp(), s = fab();
    if (!R.aberto(save(), 'calabouco')) return '<div class="bl"><h4>🔒 Calabouço</h4><p>Abre depois de derrotar o Espírito da Floresta na Campanha.</p></div>';
    const run = e.calabouco.run; const itens = s.gestao.itens;
    let h = `<div class="bl">${!run || run.pago ? imgFallback(CALABOUCO.fundo, CALABOUCO.fundoFallback, 'cal-capa', CALABOUCO.nome) : ''}<h4>${esc(CALABOUCO.nome)}</h4><p>Consumíveis: 🧪 Tônico <b>${itens.tonico || 0}</b> · ${icoItem(FAB.gestao.itens.tonico_concentrado, '⚗️')} Concentrado <b>${itens.tonico_concentrado || 0}</b> · 🍲 Ração <b>${itens.racao || 0}</b> · Concluídos: ${e.calabouco.feitos}</p></div>`;
    if (!run || run.pago) {
      if (run?.pago) h += `<div class="bl"><h4>Resultado</h4>${run.log.slice(-4).map((l) => `<p>• ${esc(l)}</p>`).join('')}<p>Ganhos pagos: ${Object.entries(run.pagos || {}).map(([k, v]) => `${v} ${k}`).join(' · ') || 'nada'}</p></div>`;
      return h + `<div class="ln"><button class="btn-pri" data-cal-entrar="1">Entrar no calabouço</button></div>`;
    }
    const sala = CALABOUCO.salas[run.sala];
    const form = R.membrosFormacao(save().idle);
    const hpPct = Math.round((run.hpMedia ?? 1) * 100);
    const precisaCura = form.some(({ m }) => (run.vida?.[m.uid] ?? run.hpMedia ?? 1) < 1) || (run.hpMedia ?? 1) < 1;
    const carta = CALABOUCO.cartas?.[sala?.tipo];
    const membrosTxt = form.map(({ m }) => `${esc(m.especie)} ${Math.round((run.vida?.[m.uid] ?? run.hpMedia ?? 1) * 100)}%`).join(' · ');
    h += `<div class="bl"><div class="cal-sala">${carta ? imgFallback(carta, '', 'cal-carta', sala?.rotulo || '') : ''}<div style="flex:1;min-width:0"><h4>🧠 Sanidade ${run.sanidade}/${CALABOUCO.sanidadeMax} · ❤️ Equipe ${hpPct}%</h4><div class="san"><i style="width:${run.sanidade}%"></i></div><div class="hp-eq"><i style="width:${hpPct}%"></i></div><p class="mut">${membrosTxt}</p><p>Sala ${run.sala + 1}/${CALABOUCO.salas.length}: <b>${esc(sala?.rotulo || '')}</b> (${sala?.tipo === 'corrompida' ? 'corrompida: −' + CALABOUCO.perdaCorrompida + ' Sanidade' : sala?.tipo === 'chefe' ? 'chefe na arena' : 'combate na arena'})</p><p>Ganhos acumulados: ${Object.entries(run.ganhos).map(([k, v]) => `${v} ${k}`).join(' · ') || 'nada ainda'}</p></div></div>`;
    if (run.estado !== 'luta') {
      h += `<div class="ln"><button class="btn-sec" data-cal-item="racao" ${(itens.racao || 0) && precisaCura ? '' : 'disabled'}>🍲 Usar Ração (+${Math.round(CALABOUCO.racao * 100)}% vida)</button><button class="btn-sec" data-cal-item="tonico" ${(itens.tonico || 0) && run.sanidade < CALABOUCO.sanidadeMax ? '' : 'disabled'}>🧪 Tônico (+${CALABOUCO.tonico} San.)</button><button class="btn-sec" data-cal-item="tonico_concentrado" ${(itens.tonico_concentrado || 0) && run.sanidade < CALABOUCO.sanidadeMax ? '' : 'disabled'}>${icoItem(FAB.gestao.itens.tonico_concentrado, '⚗️')} Concentrado (+${CALABOUCO.tonicoConcentrado} San.)</button></div>`;
    }
    h += '</div>';
    if (run.estado === 'escolha') {
      h += `<div class="bl"><h4>Sanidade baixa: o que fazer?</h4><div class="ln"><button class="btn-pri" data-cal-escolha="tonico" ${(itens.tonico || 0) ? '' : 'disabled'}>🧪 Gastar Tônico (+${CALABOUCO.tonico})</button><button class="btn-pri" data-cal-escolha="tonico_concentrado" ${(itens.tonico_concentrado || 0) ? '' : 'disabled'}>${icoItem(FAB.gestao.itens.tonico_concentrado, '⚗️')} Concentrado (+${CALABOUCO.tonicoConcentrado})</button><button class="btn-sec" data-cal-escolha="risco">⚠️ Avançar com risco (ganhos ×2)</button><button class="btn-sec" data-cal-escolha="sair">🚪 Sair com os ganhos</button></div></div>`;
    } else {
      const ehCombate = sala?.tipo === 'luta' || sala?.tipo === 'chefe';
      h += `<div class="ln"><button class="btn-pri" data-cal-avancar="1">${ehCombate ? `⚔️ Lutar · ${esc(sala.rotulo)}` : 'Entrar na próxima sala'}</button><button class="btn-sec" data-cal-escolha="sair">Sair com os ganhos</button></div>`;
    }
    h += `<div class="bl">${run.log.slice(-5).map((l) => `<p class="mut">${esc(l)}</p>`).join('')}</div>`;
    return h;
  }
  async function iniciarCalaboucoBatalha(luta) {
    const idle = save().idle, run = exp().calabouco.run;
    if (!run || !luta) return;
    const membros = R.membrosFormacao(idle);
    const eq = membros.map(({ m: x, vaga }) => ({ especie: x.especie, nivel: x.nivel || 1, vaga, arte: arteDoIndividuo(x), bonus: x.tierHW ? { hp: 0.15 * (x.tierHW - 1), atk: 0.15 * (x.tierHW - 1), def: 0.12 * (x.tierHW - 1) } : {} }));
    const arena = await resolverArte(luta.arena, luta.arenaFallback);
    const artes = {};
    if (luta.chefe) artes[luta.chefe.nome] = await resolverArte(luta.chefe.arte, luta.chefe.arteFallback);
    fecharModal('modal-exp');
    tela.abrir({
      titulo: `Calabouço · ${luta.rotulo}`,
      sub: `Sala ${luta.sala + 1}/${CALABOUCO.salas.length}${luta.tipo === 'chefe' ? ' · Chefe' : ''}`,
      arena, aliados: eq, inimigos: luta.inimigos, artes,
      onFim: (venceu, frac) => {
        const vidaNova = {};
        if (bt) membros.forEach(({ m }, i) => { const u = bt.aliados[i]; if (u) vidaNova[m.uid] = Math.max(0, u.hp) / Math.max(1, u.hpMax); });
        const res = R.resolverLutaCalabouco(save(), { vitoria: venceu, vida: Object.keys(vidaNova).length ? vidaNova : null, hpFinal: frac });
        salvar();
        abrirModal('modal-exp');
        if (!venceu) mostrarToast('Derrota nas ruínas: metade dos ganhos foi salva.', 3200);
        else if (res.run?.resultado === 'concluido') mostrarToast('🏆 Calabouço concluído! Recompensas entregues.', 4200);
        else mostrarToast(`${luta.rotulo} vencida!`, 2400);
        render();
      },
    });
    const bt = tela.batalha();
    if (bt) {
      bt.aliados.forEach((u, i) => {
        const uid = membros[i]?.m?.uid;
        const pct = uid && run.vida?.[uid] != null ? run.vida[uid] : (run.hpMedia ?? 1);
        u.hp = pct <= 0 ? 0 : Math.max(1, Math.min(u.hpMax, Math.round(u.hpMax * pct)));
      });
      if (!bt.aliados.some((u) => u.hp > 0) && bt.aliados[0]) bt.aliados[0].hp = 1;
      tela.render();
    }
  }

  // ---------- Guilda ----------
  function matTxt(c) {
    return Object.entries(c.mat || {}).map(([k, v]) => `${FAB.materiais[k].icone} ${v} ${esc(FAB.materiais[k].nome)}`)
      .concat(Object.entries(c.itens || {}).map(([k, v]) => `${icoItem(FAB.gestao.itens[k])} ${v} ${esc(FAB.gestao.itens[k].nome)}`)).join(' · ');
  }
  const recTxt = (r) => [`${r.gold || 0}g`, r.diamantes ? `${r.diamantes}💎` : '', r.tickets ? `🎫 ${r.tickets} ticket${r.tickets > 1 ? 's' : ''}` : ''].filter(Boolean).join(', ');
  function abaContratos() {
    let h = '';
    const icoC = icoItem({ arte: ICONE_CONTRATO, icone: '📜' }, '📜');
    for (const c of CONTRATOS) {
      const st = R.estadoContrato(save(), c); if (st === 'bloqueado') { h += `<div class="bl mut"><h4>🔒 ${esc(c.titulo)}</h4><p>Conclua o contrato anterior.</p></div>`; continue; }
      const pode = R.podeEntregar(save(), c);
      h += `<div class="bl"><h4>${icoC} ${esc(c.titulo)} ${st === 'entregue' ? '<span class="ok">✓ entregue</span>' : ''}</h4><p>${esc(c.texto)}</p><p>Pede: ${matTxt(c.pede)} · Recompensa: ${recTxt(c.recompensa)}</p>${st === 'disponivel' ? '<div class="ln"><button class="btn-pri" data-aceitar="' + c.id + '">Aceitar</button></div>' : st === 'ativo' ? `<div class="ln"><button class="btn-pri" data-entregar="${c.id}" ${pode ? '' : 'disabled'}>Entregar</button>${pode ? '' : '<span class="mut">faltam itens (veja Caçadas, Fazenda e Oficina)</span>'}</div>` : `<p class="ok">${esc(c.fim)}</p>`}</div>`;
    }
    const diarios = R.contratosDiariosEstado(save());
    if (!diarios.liberado) {
      h += '<div class="bl mut"><h4>🔒 Contratos Diários da Guilda</h4><p>Conclua o contrato "Tônico para a descida" para desbloquear 3 contratos por dia (ouro, diamantes e Tickets), renovados à meia-noite.</p></div>';
      return h;
    }
    h += `<div class="bl" style="border-color:#f3a458"><h4>📅 Contratos Diários (${esc(diarios.data)} · renovam à meia-noite)</h4><p class="mut">Três encomendas sorteadas por dia com materiais da Fazenda e itens da Oficina. Cada contrato paga ouro, diamantes e Tickets uma vez por dia.</p></div>`;
    for (const c of diarios.lista) {
      const st = c.estado, pode = R.podeEntregar(save(), c);
      h += `<div class="bl"><h4>${icoC} ${esc(c.titulo)} ${st === 'entregue' ? '<span class="ok">✓ entregue hoje</span>' : ''}</h4><p>${esc(c.texto)}</p><p>Pede: ${matTxt(c.pede)} · Recompensa: <b>${recTxt(c.recompensa)}</b></p>${st === 'disponivel' ? `<div class="ln"><button class="btn-pri" data-aceitar="${c.id}">Aceitar</button></div>` : st === 'ativo' ? `<div class="ln"><button class="btn-pri" data-entregar="${c.id}" ${pode ? '' : 'disabled'}>Entregar</button>${pode ? '' : '<span class="mut">faltam materiais ou itens da Oficina</span>'}</div>` : `<p class="ok">${esc(c.fim)}</p>`}</div>`;
    }
    return h;
  }
  function abaFazenda() {
    const e = exp(); if (!e.fazenda) return '<div class="bl"><h4>🔒 Fazenda</h4><p>Conclua o contrato "Fibras para o balcão" na Guilda.</p></div>';
    const s = fab(), g = gestaoDe(s), pronto = prontoParaColetar(s, FAB);
    let h = resumoHtml() + `<div class="bl"><h4>📦 Produção pronta</h4><p>${Object.keys(pronto).length ? Object.entries(pronto).map(([loc, it]) => `${FAB.materiais[it.tipo].icone} ${it.qtd}`).join(' · ') : 'Nada pronto ainda. A Fazenda produz mesmo com o jogo fechado.'}</p><p class="mut">Estoque: ${Object.entries(FAB.materiais).map(([k, m]) => `${m.icone} ${s.materiais[k] || 0}/${capacidade(FAB, k)}`).join(' · ')}</p><div class="ln"><button class="btn-pri" data-coletar="1">Coletar tudo</button></div></div>`;
    h += `<div class="bl"><h4>🏗️ Melhorias (${g.obras.length}/${FAB.gestao.vagasObra})</h4>${g.obras.map((o) => `<p>⏳ ${esc(FAB.estruturas.find((x) => x.id === o.tipo).nome)} nv.${o.nivel}: ${dur(o.fimEm - Date.now())}</p>`).join('')}${candidatasObra(s, FAB).map((c) => c.maximo ? `<p>${esc(c.est.nome)}: <span class="ok">nível máximo</span></p>` : `<p>${esc(c.est.nome)} → nv.${c.nivel}: ${Object.entries(c.custo).map(([k, v]) => `${FAB.materiais[k].icone} ${v}`).join(' ')} · ⏱️ ${dur(c.duracao)} ${c.emObra ? '<span class="mut">em obra</span>' : `<button class="btn-sec" data-melhorar="${c.loc}">Melhorar</button>`}</p>`).join('')}</div>`;
    return h;
  }
  function abaOficina() {
    if (!exp().oficina) return '<div class="bl"><h4>🔒 Oficina</h4><p>Conclua o contrato "Leite fresco" na Guilda.</p></div>';
    const s = fab(), g = gestaoDe(s), agora = Date.now(), pocoesMochila = hwDe(save()).pocoes || {}; let h = resumoHtml();
    if (!FAB.gestao.receitas.some((r) => r.id === loteRec)) loteRec = FAB.gestao.receitas[0].id;
    const pv = previsaoLote(s, FAB, loteRec, loteQtd);
    const txt = (c) => Object.entries(c).map(([k, v]) => { const d = FAB.materiais[k] || FAB.gestao.itens[k]; return `${icoItem(d)} ${v} ${esc(d.nome)}`; }).join(' · ');
    const qtdItem = (k) => (k.startsWith('pocao_xp') ? (g.itens[k] || 0) + (pocoesMochila[k] || 0) : (g.itens[k] || 0));
    h += `<div class="bl"><h4>🛠️ Oficina (${g.fabricacao.length}/${FAB.gestao.filaFabricacao} lotes)</h4><p class="mut">Estoque: ${Object.entries(FAB.materiais).map(([k, m]) => `${m.icone} ${s.materiais[k] || 0}`).join(' · ')} · Itens: ${Object.entries(FAB.gestao.itens).map(([k, m]) => `${icoItem(m)} ${qtdItem(k)}`).join(' · ')}</p>
      <div class="ln">${FAB.gestao.receitas.map((r) => { const nv = bonusProfissao(s.profissoes[r.profissao] || 0).nivel, tranc = (r.nivelMin || 1) > nv; return `<button class="${r.id === loteRec ? 'btn-pri' : 'btn-sec'}" data-rec="${r.id}">${icoItem(r)} ${esc(r.nome)}${tranc ? ` 🔒nv.${r.nivelMin}` : (r.nivelMin > 1 ? ` (nv.${r.nivelMin})` : '')}</button>`; }).join('')}</div>
      <p class="mut">${esc(pv.rec.uso)} · Profissão: ${PROFISSOES[pv.rec.profissao].nome} (nv.${pv.nivelProfissao}${pv.reducaoTempo ? ` · −${Math.round(pv.reducaoTempo * 100)}% tempo` : ''}${pv.extra ? ` · +${pv.extra} un./lote` : ''})</p>
      <p>Quantidade: <button class="btn-sec" data-qtd="-1">−</button> <b>${loteQtd}</b> <button class="btn-sec" data-qtd="1">+</button></p><p>Produzirá <b>${txt(pv.saida)}</b>${pv.extra ? ` <span class="ok">(inclui +${pv.extra} bônus)</span>` : ''} usando ${txt(pv.insumos)} · ⏱️ ${dur(pv.duracao)}</p>
      ${!pv.nivelOk ? `<p class="ruim">Requer ${PROFISSOES[pv.rec.profissao].nome} nível ${pv.nivelMin} (atual: ${pv.nivelProfissao}).</p>` : pv.ok ? '' : `<p class="ruim">Faltam ${txt(pv.falta)}.</p>`}
      <div class="ln"><button class="btn-pri" data-fabricar="1" ${pv.ok ? '' : 'disabled'}>Fabricar lote</button><button class="btn-sec" data-repetir="1" ${g.ultimoLote ? '' : 'disabled'}>Repetir último lote${g.ultimoLote ? ` (${g.ultimoLote.qtd}× ${esc(FAB.gestao.receitas.find((r) => r.id === g.ultimoLote.receita).nome)})` : ''}</button></div>
      ${g.fabricacao.map((l) => { const rc = FAB.gestao.receitas.find((r) => r.id === l.receita); return `<p>${l.inicio ? '⚙️' : '⏸️'} ${l.qtd}× ${esc(rc.nome)}${l.extra ? ` (+${l.extra})` : ''} ${l.inicio ? '· ' + dur(l.inicio + (l.seg ?? rc.seg) * 1000 * l.qtd - agora) : '· aguardando'}</p>`; }).join('')}</div>
      <div class="bl"><h4>Profissões</h4><p class="mut">Cada nível acima de 1 reduz 5% do tempo da receita (máx. 40%); a cada 3 níveis, +1 unidade por lote.</p>${Object.entries(PROFISSOES).map(([k, p]) => { const xp = s.profissoes[k] || 0, b = bonusProfissao(xp); return `<p>${p.icone} ${p.nome}: nível <b>${b.nivel}</b> <span class="mut">(${xp} xp${k !== 'fazenda' ? ` · −${Math.round(b.reducaoTempo * 100)}% tempo · +${b.extraLote} un./lote` : ''})</span></p>`; }).join('')}</div>`;
    return h;
  }
  function abaReinosGuilda() {
    const ok = R.aberto(save(), 'reinos');
    return `<div class="bl"><h4>👑 Reinos</h4><p>${ok ? 'A Guilda abriu o acesso aos Reinos: escolha um reino, toque em Ir e administre-o em tela cheia.' : 'Conclua "Recuperação do canteiro" (cidade C1) para liberar os Reinos.'}</p><div class="ln"><button class="btn-pri" data-reinos="1" ${ok ? '' : 'disabled'}>Abrir Reinos</button></div></div>`;
  }
  const resumoHtml = () => (resumoUlt ? `<div class="bl" style="border-color:#f3a458"><h4>Resumo: ${esc(resumoUlt.t)}</h4>${resumoUlt.p.map((x) => `<p>• ${esc(x)}</p>`).join('')}</div>` : '');

  // ---------- Crônicas: Herói × Vilão ----------
  function abaHV() {
    if (hvEstado) return hvTela();
    let h = `<div class="bl"><h4>Capítulos</h4>${HV.capitulos.map((c) => `<p><button class="${c.id === cap ? 'btn-pri' : 'btn-sec'}" data-cap="${c.id}">${esc(c.titulo)}</button></p>`).join('')}<p class="mut">Novos capítulos entram neste mesmo seletor.</p></div>`;
    const C = R.capitulo(cap), hv = R.hvDe(save(), cap);
    h += `<div class="bl">${C.capa ? imgFallback(C.capa, C.capaFallback, 'hv-capa', C.titulo) : ''}<h4>${esc(C.titulo)}</h4><p>${esc(C.resumo)}</p>${hv.escolha ? `<p class="mut">Sua escolha na missão 5: <b>${esc(C.missoes[4].escolha.opcoes.find((o) => o.id === hv.escolha).rotulo)}</b></p>` : ''}${hv.fim ? `<p class="ok">Capítulo concluído. ${esc(C.missoes[9].epilogo[hv.escolha] || '')}</p>` : ''}`;
    for (const m of C.missoes) { const r = R.missaoResolvida(save(), cap, m.n), est = R.estadoMissao(save(), cap, m.n); h += `<p>${m.n}. ${esc(m.titulo)} — ${est === 'feita' ? '<span class="ok">✓ feita</span>' : est === 'atual' ? `<button class="btn-pri" data-missao="${m.n}">Jogar</button>` : '<span class="mut">🔒</span>'} <span class="mut">${esc(r.objetivo || '')}</span></p>`; }
    return h + '</div>';
  }
  function hvTela() {
    const e = hvEstado, m = R.missaoResolvida(save(), cap, e.n);
    if (e.fase === 'dialogo') {
      const f = R.falaDialogoHV(m.dialogo[e.i]);
      return `<div class="bl"><h4>Missão ${m.n} · ${esc(m.titulo)}</h4><div class="hv-dlg">${f.busto ? imgFallback(f.busto, f.fallback, 'hv-busto', f.quem) : ''}<div class="hv-fala">${f.quem ? `<span class="hv-quem">${esc(f.quem)}</span>` : ''}<p>${esc(f.texto)}</p></div></div><div class="ln"><button class="btn-pri" data-hv-prox="1">Continuar</button><button class="btn-sec" data-hv-sair="1">Voltar</button></div></div>`;
    }
    if (e.fase === 'escolha') return `<div class="bl"><h4>${esc(m.escolha.titulo)}</h4><p>Sua decisão muda o objetivo da missão 7 e o desfecho do capítulo.</p><div class="ln">${m.escolha.opcoes.map((o) => `<button class="btn-pri" data-hv-escolha="${o.id}">${esc(o.rotulo)}</button>`).join('')}</div></div>`;
    return `<div class="bl"><h4>${esc(m.titulo)}</h4><p>Objetivo: ${esc(m.objetivo)}</p><div class="ln"><button class="btn-pri" data-hv-batalha="1">Entrar em batalha</button><button class="btn-sec" data-hv-sair="1">Voltar</button></div></div>`;
  }
  function iniciarHVBatalha() {
    const m = R.missaoResolvida(save(), cap, hvEstado.n), idle = save().idle;
    const eq = R.membrosFormacao(idle).map(({ m: x, vaga }) => ({ especie: x.especie, nivel: x.nivel || 1, vaga, arte: arteDoIndividuo(x), bonus: x.tierHW ? { hp: 0.15 * (x.tierHW - 1), atk: 0.15 * (x.tierHW - 1), def: 0.12 * (x.tierHW - 1) } : {} }));
    const artes = { Maregor: HV.chefes.Maregor.arte };
    fecharModal('modal-exp');
    tela.abrir({ titulo: `Herói × Vilão · ${m.titulo}`, arena: m.arena, aliados: eq, inimigos: m.inimigos, artes, onFim: (venceu) => {
      abrirModal('modal-exp');
      if (!venceu) { mostrarToast('Derrota: tente de novo (nenhuma recompensa foi paga).', 2600); render(); return; }
      const r = R.concluirMissaoHV(save(), cap, hvEstado.n); hvEstado = null;
      if (r.ok) { salvar(); mostrarToast(`Missão concluída! +${r.recompensa.gold}g, +${r.recompensa.diamantes}💎${r.epilogo ? ' · ' + r.epilogo : ''}`, 5200); } else mostrarToast(r.motivo, 2800);
      render();
    } });
  }

  // ---------- Crise (tela cheia) ----------
  function desenharCrise() {
    const c = R.criseDe(save()), idx = CRISE.estados.indexOf(c.estado), s = fab(), itens = gestaoDe(s).itens;
    const acoes = { saudavel: [['surto', 'Deixar o surto chegar']], contaminada: [['conter', `Conter com 2 Tônicos (${itens.tonico || 0})`], ['aguardar', 'Aguardar (a vila será tomada)']], tomada: [['retomar', 'Retomar as ruas (combate)'], ['purificar', 'Purificar (1 Tônico + 2 Cristais)']], purificada: [['reconstruir', 'Reconstruir (8 Fibras, 4 Cristais, 100g)']], reconstruida: [['servico', '🏥 Pegar tônico no Posto de cura']] }[c.estado];
    const texto = { saudavel: 'A vila vive em paz. Nada indica o que vem aí.', contaminada: 'O surto começou: os primeiros zumbis surgem nas ruas.', tomada: 'Os zumbis dominam a vila. É preciso retomar as ruas e purificar.', purificada: 'A vila foi purificada, mas está em ruínas. Reconstrua para reabrir os serviços.', reconstruida: `A vila foi reconstruída. O ${CRISE.servico.nome} reabriu. ${CRISE.servico.texto}` }[c.estado];
    const tut = cartaoTut('crise');
    const bgPri = `assets/confusion/interface/${CRISE.arte[c.estado]}.webp`;
    const bgFb = `assets/confusion/interface/${CRISE.arteFallback[c.estado]}.webp`;
    crise.innerHTML = `<div class="cr-topo"><b>${esc(CRISE.cidade)} · ${esc(CRISE.nomes[c.estado])}</b>${exp().tut.crise ? '<button class="btn-sec" data-cr-rever="1">Rever tutorial</button>' : ''}<button class="btn-sec" id="cr-reiniciar">Reiniciar crise</button><button class="btn-fechar" id="cr-fechar">✕</button></div>
      <div class="cr-mapa" style="background-image:url('${IMG(bgPri)}'),url('${IMG(bgFb)}')">${Array.from({ length: c.zumbis }, (_, i) => { const p = CRISE.posicoes[i % CRISE.posicoes.length]; return `<img class="zumbi" style="left:${p[0]}%;top:${p[1]}%;animation-delay:${(i * 0.31).toFixed(2)}s" src="${IMG('assets/confusion/interface/' + CRISE.zumbi + '.webp')}" alt="zumbi" data-zumbi="${i}">`; }).join('')}</div>
      <div class="cr-baixo">${tut ? `<div class="bl tut" style="margin:0 0 6px"><b>📘 ${esc(TUTS.crise.titulo)}</b> ${TUTS.crise.passos.map((p, i) => `<span style="display:block">${i + 1}. ${esc(p)}</span>`).join('')}<button class="btn-pri" data-cr-tutok="1" style="margin-top:4px">Entendi</button></div>` : ''}<div class="cr-etapas">${CRISE.estados.map((k, i) => `<span class="${i === idx ? 'on' : i < idx ? 'feito' : ''}">${esc(CRISE.nomes[k])}</span>`).join('')}</div><p>${esc(texto)} ${c.zumbis ? `<b>Zumbis nas ruas: ${c.zumbis}</b>` : ''}</p><div class="ln" style="display:flex;gap:6px;flex-wrap:wrap">${acoes.map(([k, r]) => `<button class="btn-pri" data-crise="${k}">${esc(r)}</button>`).join('')}</div></div>`;
    crise.classList.add('vis');
    resolverArte(bgPri, bgFb).then((okPath) => {
      const m = crise.querySelector('.cr-mapa');
      if (m && R.criseDe(save()).estado === c.estado) m.style.backgroundImage = `url('${IMG(okPath)}')`;
    });
  }
  crise.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.id === 'cr-fechar') { crise.classList.remove('vis'); return; }
    if (t.id === 'cr-reiniciar') { R.reiniciarCrise(save()); salvar(); desenharCrise(); return; }
    if (t.dataset.crTutok) { exp().tut.crise = true; revendo = null; salvar(); desenharCrise(); return; }
    if (t.dataset.crRever) { delete exp().tut.crise; desenharCrise(); return; }
    if (t.dataset.crise) { const r = R.acaoCrise(save(), t.dataset.crise); mostrarToast(r.ok ? r.msg : r.motivo, 3000); salvar(); desenharCrise(); }
  });

  // ---------- render do painel ----------
  function render() {
    if (!painel) return; const P = PAINEIS[painel];
    $('#exp-titulo').textContent = P.titulo;
    $('#exp-abas').innerHTML = P.abas.map((a, i) => `<button class="btn-sec" role="tab" aria-selected="${i === aba}" data-aba="${i}">${esc(a)}</button>`).join('');
    const tid = tutDaAba(painel, aba); const vis = tid && TUTS[tid];
    $('#exp-rever').hidden = !(vis && exp().tut[tid] && revendo !== tid); $('#exp-rever').dataset.tut = tid || '';
    let h = tid ? cartaoTut(tid) : '';
    if (painel === 'oniricos') h += [abaBanner, abaEquipe, abaEvolucao][aba]();
    if (painel === 'cacadas') h += [abaCacadas, abaCalabouco][aba]();
    if (painel === 'guilda') h += [abaContratos, abaFazenda, abaOficina, abaReinosGuilda][aba]();
    if (painel === 'cronicas') h += aba === 0 ? abaCrise() : abaHV();
    $('#exp-corpo').innerHTML = h; destacar(tid);
  }
  function abaCrise() { const c = R.criseDe(save()); return `<div class="bl"><h4>🧟 ${esc(CRISE.cidade)}: ${esc(CRISE.nomes[c.estado])}</h4><p>Uma crise completa numa só cidade: saudável → contaminada → tomada → purificada → reconstruída. As mudanças aparecem no mapa, com zumbis nas ruas durante o surto. Estado próprio: não altera a Campanha nem os Reinos.</p><div class="ln"><button class="btn-pri" data-crise-abrir="1">Visitar a cidade</button></div></div>`; }
  function abrir(p, a = 0) { if (batalhaBloqueando() || tela.aberta()) return; painel = p; aba = a; revendo = null; hvEstado = null; render(); abrirModal('modal-exp'); }

  modal.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return; const d = t.dataset;
    if (t.id === 'exp-fechar') { fecharModal('modal-exp'); painel = null; return; }
    if (t.id === 'exp-rever') { revendo = d.tut; render(); return; }
    if (d.tutok) { exp().tut[d.tutok] = true; revendo = null; salvar(); render(); return; }
    if (d.aba !== undefined) { aba = Number(d.aba); revendo = null; hvEstado = null; render(); return; }
    if (d.invocar) { const r = R.invocar(save()); if (r.ok) { ultimaInvocacao = r; salvar(); } else mostrarToast(r.motivo, 2800); render(); return; }
    if (Date.now() - (window.__eqArrastou || 0) < 300 && d.eqVaga !== undefined) return;
    if (tocarEquipe(d)) { render(); return; }
    if (d.membroCombate !== undefined) {
      const idle = save().idle, indice = Number(d.membroCombate);
      if (!Number.isInteger(indice) || !idle.equipe?.[indice]) return;
      const ativos = R.indicesEquipeCombate(idle), selecionado = ativos.includes(indice);
      if (selecionado && ativos.length === 1) { mostrarToast('Mantenha ao menos um Onírico na equipe.', 2200); return; }
      if (!selecionado && ativos.length >= LIMITE_ALIADOS) { mostrarToast('Retire um Onírico para abrir uma vaga.', 2200); return; }
      idle.equipeCombate = selecionado ? ativos.filter(i => i !== indice) : [...ativos, indice];
      salvar(); render(); return;
    }
    if (d.evoluir) { const m = save().idle.equipe[Number(d.evoluir)], f = proximaForma(m); if (f && (m.nivel || 1) >= f.nivel) { m.especie = f.para; salvar(); mostrarToast(`${f.para}!`, 2200); } render(); return; }
    if (d.entrar) { entrarCacada(d.entrar); return; }
    if (d.calEntrar) { const r = R.iniciarCalabouco(save()); if (!r.ok) mostrarToast(r.motivo, 2800); salvar(); render(); return; }
    if (d.calItem) { const r = R.usarItemCalabouco(save(), d.calItem); if (!r.ok) mostrarToast(r.motivo, 2600); salvar(); render(); return; }
    if (d.calAvancar || d.calEscolha) {
      const r = R.avancarSala(save(), Math.random, d.calEscolha || null);
      if (!r.ok) { mostrarToast(r.motivo, 2800); render(); return; }
      salvar();
      if (r.emBatalha && r.luta) { iniciarCalaboucoBatalha(r.luta); return; }
      render(); return;
    }
    if (d.aceitar) { R.aceitarContrato(save(), d.aceitar); salvar(); render(); return; }
    if (d.entregar) { const r = R.entregarContrato(save(), d.entregar); if (r.ok) { mostrarToast(`Contrato entregue! ${r.contrato.fim}`, 4200); salvar(); } else mostrarToast(r.motivo, 2800); render(); return; }
    if (d.coletar) { processar(false); const r = coletarTudo(fab(), FAB); const f = (o) => Object.entries(o).map(([k, v]) => `${v} ${FAB.materiais[k].nome}`).join(' · '); resumoUlt = { t: 'Coleta', p: [Object.keys(r.recebido).length ? `recebido ${f(r.recebido)}` : 'nada pronto', ...(Object.keys(r.pendente).length ? [`pendente (estoque cheio): ${f(r.pendente)}`] : [])] }; salvar(); render(); return; }
    if (d.melhorar) { processar(false); const r = enfileirarObras(fab(), FAB, [d.melhorar]); resumoUlt = { t: 'Melhoria', p: r.entraram.length ? ['obra iniciada'] : r.pendentes.map((p) => `${p.motivo}${p.falta ? ' ' + Object.entries(p.falta).map(([k, v]) => `${v} ${k}`).join(' ') : ''}`) }; salvar(); render(); return; }
    if (d.rec) { loteRec = d.rec; render(); return; }
    if (d.qtd) { loteQtd = Math.max(1, Math.min(30, loteQtd + Number(d.qtd))); render(); return; }
    if (d.fabricar || d.repetir) { processar(false); const r = d.repetir ? repetirUltimoLote(fab(), FAB) : fabricarLote(fab(), FAB, loteRec, loteQtd); resumoUlt = r.ok ? { t: 'Fabricação', p: [`lote na fila: ${Object.entries(r.previsao.saida).map(([k, v]) => `${v} ${FAB.gestao.itens[k].nome}`).join(', ')} (usou ${Object.entries(r.previsao.insumos).map(([k, v]) => `${v} ${FAB.materiais[k].nome}`).join(', ')})`] } : { t: 'Fabricação', p: [r.motivo] }; salvar(); render(); return; }
    if (d.reinos) { fecharModal('modal-exp'); window.regiaoReinos?.abrirSeletor(); return; }
    if (d.criseAbrir) { fecharModal('modal-exp'); desenharCrise(); return; }
    if (d.cap) { cap = d.cap; render(); return; }
    if (d.missao) { const m = R.missaoResolvida(save(), cap, Number(d.missao)); hvEstado = { n: Number(d.missao), fase: 'dialogo', i: 0 }; void m; render(); return; }
    if (d.hvProx) { const m = R.missaoResolvida(save(), cap, hvEstado.n); if (hvEstado.i + 1 < m.dialogo.length) hvEstado.i += 1; else hvEstado.fase = m.escolha && !R.hvDe(save(), cap).escolha ? 'escolha' : 'pronta'; render(); return; }
    if (d.hvEscolha) { R.escolherHV(save(), cap, hvEstado.n, d.hvEscolha); hvEstado.fase = 'pronta'; salvar(); render(); return; }
    if (d.hvSair) { hvEstado = null; render(); return; }
    if (d.hvBatalha) { iniciarHVBatalha(); }
  });

  // ---------- Caçada: entrar e sair preservando a posição da Campanha ----------
  async function entrarCacada(id) {
    const c = CACADAS.find((x) => x.id === id); if (!c || !R.questFeita(save(), c.requer)) return;
    const e = exp(); const [px, py] = getPosPx();
    if (!getMapaId()?.startsWith('CAC_')) e.cacadas.retorno = { mapa: getMapaId(), px, py };
    e.cacadas.ativa = id; salvar(); fecharModal('modal-exp'); painel = null;
    await irParaMapa(`CAC_${id}`);
    mostrarToast(`🏹 ${c.nome}: ligue o Auto-Caça (botão Auto) para coletar materiais.`, 4200);
  }
  async function sairCacada() {
    const e = exp(), r = e.cacadas.retorno; e.cacadas.ativa = null; e.cacadas.retorno = null; salvar();
    if (r) { await voltarAoPonto(r); mostrarToast('📍 De volta à Campanha, no ponto de onde você saiu.', 2600); }
  }
  sair.addEventListener('click', sairCacada);

  // ---------- relógio: tickets, avisos, produção, fabricação ----------
  const acumulado = {};
  function aoAbater() {
    const id = getMapaId(); if (!id?.startsWith('CAC_')) return;
    const c = CACADAS.find((x) => `CAC_${x.id}` === id); if (!c) return;
    const r = (() => { const out = {}; if (Math.random() > c.chance) return out; for (const [k, [a, b]] of Object.entries(c.materiais)) { const n = a + Math.floor(Math.random() * (b - a + 1)); if (n) out[k] = n; } return out; })();
    const s = fab(); exp().cacadas.abates += 1;
    for (const [k, v] of Object.entries(r)) { s.materiais[k] = Math.min(capacidade(FAB, k), (s.materiais[k] || 0) + v); acumulado[k] = (acumulado[k] || 0) + v; }
    if (exp().cacadas.abates % 5 === 0) { salvar(); const t = Object.entries(acumulado).map(([k, v]) => `+${v} ${FAB.materiais[k].icone}`).join(' '); if (t) mostrarToast(`Caçada: ${t}`, 1800); for (const k of Object.keys(acumulado)) delete acumulado[k]; }
  }
  function processar(avisar = true) {
    const ev = R.avancarFab(save());
    if (ev.concluidas.length || ev.fabricados.length || ev.pocoesMovidas) {
      salvar();
      if (avisar) {
        const partes = [
          ...ev.concluidas.map((o) => `${FAB.estruturas.find((x) => x.id === o.tipo).nome} nv.${o.nivel}`),
          ...ev.fabricados.map((l) => `${l.qtd + (l.extra || 0)}× ${FAB.gestao.receitas.find((r) => r.id === l.receita).nome}`),
        ];
        if (partes.length) mostrarToast(`🏗️ Concluído: ${partes.join(', ')}${ev.pocoesMovidas ? ` · 🧪 +${ev.pocoesMovidas} na mochila de Poções` : ''}`, 3600);
        else if (ev.pocoesMovidas) mostrarToast(`🧪 ${ev.pocoesMovidas} poção(ões) de XP da Oficina foram para a mochila.`, 2600);
      }
    }
    return ev;
  }
  const livre = () => !document.querySelector('.modal-bg.aberto') && !tela.aberta() && !batalhaBloqueando() && !crise.classList.contains('vis');
  const ROTULOS = { oniricos: '🥚 Oníricos', cacadas: '🏹 Caçadas', guilda: '🏛️ Guilda', reinos: '👑 Reinos', cronicas: '📜 Crônicas' };
  const MODOS = { oniricos: 'banner', cacadas: 'cacadas', guilda: 'guilda', reinos: 'reinos', cronicas: 'cronicas' };
  function atualizarNav() {
    const e = exp(); const id = getMapaId();
    if (id === 'C1') e.visitouCidade = true;
    if (R.concederTickets(save()) > 0) salvar();
    sair.style.display = id?.startsWith('CAC_') ? 'block' : 'none';
    e.avisados = e.avisados || {};
    const abertos = Object.entries(MODOS).filter(([, m]) => R.aberto(save(), m));
    nav.style.display = abertos.length ? 'flex' : 'none';
    nav.innerHTML = abertos.map(([k]) => `<button class="btn-hud ${e.avisados[k] ? '' : 'novo'}" data-nav="${k}">${ROTULOS[k]}</button>`).join('') + (window.regiaoHW?.navHtml?.() || '');
    if (window.regiaoHW?.liberado?.()) nav.style.display = 'flex';
    if (livre()) { const novo = abertos.find(([k]) => !e.avisados[k]); if (novo && !nav.dataset.aviso) { /* aviso único por modo */ } }
  }
  nav.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return; const k = b.dataset.nav; exp().avisados[k] = true; salvar();
    if (k === 'reinos') { window.regiaoReinos?.abrirSeletor(); return; } if (k === 'halloween') { window.regiaoHW?.abrir(); return; } abrir(k);
  });
  let jaAvisou = {};
  setInterval(() => {
    processar(true); atualizarNav();
    if (!livre()) return; const e = exp();
    const novo = Object.entries(MODOS).find(([k, m]) => R.aberto(save(), m) && !e.avisados[k] && !jaAvisou[k]);
    if (novo) { jaAvisou[novo[0]] = true; const msg = { oniricos: '🎫 Primeiro ticket! Abra "Oníricos" para invocar.', cacadas: '🏹 Nova Caçada liberada!', guilda: '🏛️ A Guilda dos Aventureiros abriu.', reinos: '👑 Reinos liberados.', cronicas: '📜 Crônicas liberadas: Crise e Herói × Vilão.' }[novo[0]]; mostrarToast(msg, 4200); }
  }, 1500);
  processar(false); atualizarNav();

  return { abrir, aoAbater, entrarCacada, sairCacada, desenharCrise, tela, estado: exp, fab, processar, atualizarNav, abrirCrise: desenharCrise, sair };
}
