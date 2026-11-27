// Expansão 1 (interface): navegação por modos liberados pela história, Banner/Equipe/Evolução, Caçadas e Calabouço, Guilda (contratos,
// Fazenda, Oficina, Reinos), Crônicas (Crise e Herói × Vilão) e tutoriais curtos com "Rever". Regras em regiao1-exp-regras.js.
import * as R from './regiao1-exp-regras.js';
import { MARCOS, CACADAS, POS_CACADA, FAB, PROFISSOES, CONTRATOS, ICONE_CONTRATO, CALABOUCO, CRISE, HV, MOLDURAS_BANNER, arteMoldura } from './regiao1-exp-dados.js';
import { coletarTudo, prontoParaColetar, candidatasObra, enfileirarObras, previsaoLote, fabricarLote, repetirUltimoLote, gestaoDe, capacidade, bonusProfissao } from './regiao1-gestao-regras.js';
import { ARTE_DA_ESPECIE, ELEMENTO_DA_ESPECIE, linhaDaEspecie } from '../species.js';
import { LIMITE_ALIADOS, criarUnidade } from './regiao1-estrategia-regras.js';
import { arteDoIndividuo } from './regiao1-halloween-dados.js';
import { hwDe, bonusDoMembro } from './regiao1-halloween-regras.js';
import { tierDe, estrelasDe, faixaEstrela, bonusTier, bonusEstrelas, infoClasse, custoEvoluirEstrela, nivelDe } from './regiao1-progressao.js';
import { POSICOES } from './regiao1-batalha-tela.js';
import { ganharXpPasse, infoPasse } from './regiao1-passe-regras.js';
import { fichaOnirico, evoluirFormaOnirico, tierDaUnidade, estrelasDaUnidade, raridadeRotulo, molduraDoTier } from './regiao1-criacao-regras.js';
import { revelarInvocacao } from './regiao1-revelacao.js';
import { BOSSES_REGIAO1 } from './regiao1-estado.js';
import { CHEFES_REVANCHE_CATALOGO, statusRevancheChefe, iniciarRevancheChefe, concluirRevancheChefe, previsaoCraftChefe, craftarChefe, bonusCategoriaPoder } from './regiao1-revanche-regras.js';
import { energiaDe, usarPocaoEnergia, ENERGIA_CFG, essenciasDe, ESSENCIAS_PARES } from './regiao1-campanha-mini-regras.js';
import { consultarEvolucaoForma } from './regiao1-regras-sonho.js';
import { renderizarPainelMissoes, tratarCliqueMissoes, temAvisoMissoes } from './regiao1-missoes-ui.js';
import { renderizarPainelTorres, tratarCliqueTorres } from './regiao1-torres-ui.js';
import { renderizarPainelCalaboucos, tratarCliqueCalaboucos } from './regiao1-calaboucos-ui.js';
import { renderizarPainelReliquias, tratarCliqueReliquias } from './regiao1-reliquias-ui.js';
import { resumoDomadorAtivoHtml, renderizarPainelDomadores, tratarCliqueDomadores } from './regiao1-domadores-ui.js';
import { renderBalaoTutorialModo, renderGuiaJogadorNovo, tratarCliqueTutorialModo } from './regiao1-tutoriais-modos.js';

const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const IMG = (p) => `../../../${p}`;
const MV1 = (p) => IMG(`assets/confusion/interface/menus-v1/${p}`);
const DESCANSO_V1 = (p) => IMG(`assets/confusion/interface/descanso-v1/${p}`);
const INV_V1 = (p) => IMG(`assets/confusion/interface/invocacao-v1/${p}`);
const slugArt = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');
const INICIAIS_REPOUSO = new Set(['brasinha', 'gotalume', 'penumbrio', 'sementil', 'solinho']);
const ELENCO_INV_V1 = new Set(['abobrisco', 'abyssar', 'cervomusgo', 'cobrabufalo', 'fanalino', 'mortalio', 'tatuveludo', 'velalume', 'vitrarco', 'xistolim']);
const slugSonho = (el) => { const k = String(el || 'neutro').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); return k === 'sombra' ? 'trevas' : k; };
const dur = (ms) => { const t = Math.max(0, Math.ceil(ms / 1000)); return t >= 3600 ? `${Math.floor(t / 3600)}h${String(Math.floor((t % 3600) / 60)).padStart(2, '0')}` : t >= 60 ? `${Math.floor(t / 60)}min${String(t % 60).padStart(2, '0')}s` : `${t}s`; };
const RARO = { comum: '#9ca3af', incomum: '#4ade80', rara: '#60a5fa', epica: '#c084fc', lendaria: '#fbbf24' };
const COR_TIER = { 1: '#9ca3af', 2: '#4ade80', 3: '#60a5fa', 4: '#c084fc', 5: '#fbbf24' };
const fmtPct = (b) => `vida +${Math.round((b.hp || 0) * 100)}% · atq +${Math.round((b.atk || 0) * 100)}% · def +${Math.round((b.def || 0) * 100)}%`;
const badgeEstrelas = (n, curto = false) => {
  const f = faixaEstrela(n);
  return `<span class="exp-est ${f.arcoIris ? 'arco' : ''}" style="--cor-est:${f.cor}">${curto ? `${f.estrelas}★` : `${'★'.repeat(f.nivelNaFaixa)}${'☆'.repeat(6 - f.nivelNaFaixa)} ${f.estrelas}★ (${esc(f.nome)})`}</span>`;
};
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
    #modal-exp .exp-card { width: min(860px, 98vw); max-height: calc(100dvh - 14px); overflow: hidden; display: flex; flex-direction: column; padding: 8px 12px; }
    #modal-exp .modal-head { position: static; min-height: 0; margin-bottom: 4px; padding: 4px 2px; align-items: center; gap: 6px; } #modal-exp .modal-head h3 { flex: 1; margin: 0; font-size: clamp(16px, 3vw, 22px); }
    #modal-exp .exp-abas { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 6px; flex-shrink: 0; } #modal-exp .exp-abas button[aria-selected="true"] { background: #f3a458; color: #21110c; font-weight: 700; }
    #modal-exp .exp-corpo { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
    #modal-exp .bl { background: #352238; border: 1px solid #6b4a52; border-radius: 8px; padding: 9px; margin-bottom: 7px; font-size: 12.5px; line-height: 1.45; } #modal-exp .bl h4 { margin: 0 0 4px; font-size: 13.5px; color: #f3c27a; } #modal-exp .bl p { margin: 2px 0; }
    #modal-exp .tut { border-color: #7dd3fc; background: #14304a; } #modal-exp .tut-destaque { outline: 2px solid #f3a458; box-shadow: 0 0 0 4px #f3a45844; animation: expnovo 1.4s ease-in-out infinite; }
    #modal-exp .ln { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 6px; } #modal-exp .ok { color: #4ade80; } #modal-exp .ruim { color: #fb7185; } #modal-exp .mut { opacity: .78; }
    #modal-exp .exp-est { color: var(--cor-est, #facc15); font-weight: 600; }
    #modal-exp .exp-est.arco { background: linear-gradient(90deg, #facc15, #f472b6, #c084fc, #38bdf8, #4ade80); -webkit-background-clip: text; background-clip: text; color: transparent; }
    #modal-exp .ficha-on { display: grid; grid-template-columns: 104px 1fr; gap: 10px; align-items: center; } #modal-exp .ficha-on img { width: 104px; height: 104px; object-fit: contain; background: #24162b; border-radius: 8px; padding: 4px; }
    #modal-exp .exp-ico { width: 18px; height: 18px; object-fit: contain; vertical-align: -3px; margin-right: 2px; }
    #modal-exp .card-on { display: flex; gap: 12px; align-items: center; }
    #modal-exp .card-mold { position: relative; width: 108px; height: 134px; flex: 0 0 108px; border-radius: 10px; border: 2px solid var(--cor-m, #9ca3af); background: radial-gradient(circle, #351b42, #180c20); display: flex; align-items: center; justify-content: center; overflow: hidden; }
    #modal-exp .card-mold.m5 { box-shadow: 0 0 12px #fbbf2488; animation: expnovo 1.8s ease-in-out infinite; }
    #modal-exp .card-mold img.sp { width: 82%; height: 82%; object-fit: contain; z-index: 1; }
    #modal-exp .card-mold img.ov { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: fill; pointer-events: none; z-index: 2; }
    #modal-exp .cal-capa, #modal-exp .hv-capa { width: 100%; max-height: 112px; object-fit: cover; border-radius: 8px; display: block; margin-bottom: 6px; }
    #modal-exp .cal-sala { display: flex; gap: 10px; align-items: center; } #modal-exp .cal-carta { width: 64px; height: 64px; flex: 0 0 64px; border-radius: 8px; object-fit: cover; border: 1px solid #6b4a52; }
    #modal-exp .hp-eq { height: 10px; background: #12091a; border-radius: 5px; overflow: hidden; margin: 3px 0; } #modal-exp .hp-eq i { display: block; height: 100%; background: linear-gradient(90deg, #10b981, #6ee7b7); transition: width .3s; }
    #modal-exp .hv-dlg { display: flex; gap: 12px; align-items: flex-end; } #modal-exp .hv-busto { width: clamp(68px, 15vw, 108px); height: clamp(86px, 23vh, 140px); object-fit: contain; object-position: bottom; flex: 0 0 auto; filter: drop-shadow(0 3px 6px #000a); }
    #modal-exp .hv-fala { flex: 1; min-width: 0; } #modal-exp .hv-quem { display: inline-block; padding: 1px 7px; border-radius: 6px; background: #f3a45828; border: 1px solid #f3a45888; color: #f3c27a; font-weight: 700; font-size: 11.5px; margin-bottom: 4px; }
    #modal-exp .grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); gap: 7px; } #modal-exp .mini { text-align: center; font-size: 11px; background: #24162b; border: 1px solid #52335c; border-radius: 8px; padding: 6px; color: inherit; cursor: pointer; } #modal-exp .mini img { width: 100%; height: 78px; object-fit: contain; }
    #modal-exp .mini-mold { position: relative; width: 100%; aspect-ratio: 4 / 5; border-radius: 7px; background: radial-gradient(circle, #351b42, #160a1e); display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 4px; }
    #modal-exp .mini-mold img.sp { width: 84%; height: 84%; object-fit: contain; z-index: 1; }
    #modal-exp .mini-mold img.ov { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: fill; pointer-events: none; z-index: 2; }
    #modal-exp .exp-card.modo-cena { position: relative; width: min(1080px, 99vw); height: min(630px, calc(100dvh - 10px)); max-height: calc(100dvh - 10px); padding: 0; border-radius: 14px; overflow: hidden; background: #140c1d; }
    #modal-exp .exp-card.modo-cena > .modal-head { position: absolute !important; top: 9px !important; right: 10px !important; z-index: 25; margin: 0 !important; padding: 0 !important; width: auto !important; min-height: 0 !important; background: transparent !important; border: 0 !important; box-shadow: none !important; }
    #modal-exp .exp-card.modo-cena > .modal-head h3 { display: none; }
    #modal-exp .exp-card.modo-cena #exp-fechar { position: static !important; margin: 0 !important; width: 32px; height: 32px; min-width: 32px; min-height: 32px; padding: 0; font-size: 15px; line-height: 1; }
    #modal-exp .exp-card.modo-cena > .exp-abas { display: none; }
    #modal-exp .exp-card.modo-cena > .exp-corpo { padding: 0; display: flex; flex-direction: column; }
    #modal-exp .exp-card.modo-refugio > .exp-corpo { overflow: hidden; }
    #modal-exp:has(.exp-card.modo-refugio) { padding: 0 !important; background: #140c1d !important; align-items: stretch; justify-content: stretch; }
    #modal-exp .exp-card.modo-refugio { width: 100vw !important; max-width: 100vw !important; height: 100dvh !important; max-height: 100dvh !important; border-radius: 0 !important; margin: 0 !important; }
    #modal-exp .ref-cena { position: relative; flex: 1 1 auto; min-height: 0; width: 100%; height: 100%; background: url('../../../assets/confusion/interface/descanso-v1/sala.webp') center 55% / cover no-repeat; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; }
    #modal-exp .ref-cena::before { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(16,9,24,.46) 0%, rgba(16,9,24,0) 24%, rgba(16,9,24,0) 68%, rgba(12,7,18,.78) 100%); pointer-events: none; z-index: 1; }
    #modal-exp .ref-topo { position: relative; z-index: 8; display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; padding: 10px 54px 4px 12px; }
    #modal-exp .ref-perfil { display: flex; align-items: center; gap: 8px; background: rgba(24,14,34,.82); border: 1px solid rgba(243,194,122,.45); border-radius: 999px; padding: 3px 12px 3px 4px; color: #fff3e7; cursor: pointer; text-align: left; }
    #modal-exp .ref-perfil img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1.5px solid #f3c27a; background: #1e1129; }
    #modal-exp .ref-perfil b { display: block; font-size: 12.5px; line-height: 1.15; color: #fde68a; }
    #modal-exp .ref-perfil small { display: block; font-size: 10.5px; opacity: .85; }
    #modal-exp .ref-moedas { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
    #modal-exp .ref-pill { display: inline-flex; align-items: center; gap: 5px; background: rgba(24,14,34,.84); border: 1px solid rgba(243,194,122,.36); border-radius: 10px; padding: 5px 10px; font-size: 12px; font-weight: 700; color: #fff3e7; }
    #modal-exp .ref-btn-ico { width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; background: rgba(24,14,34,.86); border: 1.5px solid rgba(125,211,252,.55); border-radius: 10px; cursor: pointer; padding: 4px; }
    #modal-exp .ref-btn-ico img { width: 22px; height: 22px; object-fit: contain; }
    #modal-exp .ref-titulo { position: absolute; left: 14px; top: 58px; z-index: 6; border-left: 3px solid #f3c27a; padding-left: 9px; text-shadow: 0 2px 8px rgba(0,0,0,.85); pointer-events: none; }
    #modal-exp .ref-titulo small { display: block; font-size: 11px; color: #fde68a; opacity: .92; letter-spacing: .3px; }
    #modal-exp .ref-titulo h4 { margin: 0; font-size: clamp(16px, 2.4vw, 24px); color: #fff7ed; font-family: Georgia, serif; }
    #modal-exp .ref-lado { position: absolute; left: 12px; top: 56%; transform: translateY(-50%); z-index: 8; display: grid; grid-template-columns: repeat(2, 68px); gap: 5px; }
    #modal-exp .ref-lado button { width: 68px; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 3px; border-radius: 10px; background: rgba(26,15,36,.86); border: 1px solid rgba(243,194,122,.4); color: #fff3e7; font-size: 9.5px; font-weight: 700; cursor: pointer; line-height: 1.15; text-align: center; }
    #modal-exp .ref-lado button.destaque-modo { border-color: #f59e0b; background: rgba(66,34,20,.9); color: #fde68a; }
    #modal-exp .ref-lado img { width: 20px; height: 20px; object-fit: contain; }
    #modal-exp .energia-pill, .energia-pill-global { display: inline-flex; align-items: center; gap: 5px; background: rgba(24,14,34,.9); border: 1px solid rgba(56,189,248,.55); border-radius: 10px; padding: 4px 9px; font-size: 11.5px; font-weight: 700; color: #bae6fd; white-space: nowrap; }
    #modal-exp .energia-pill button { background: #0284c7; color: #fff; border: 0; border-radius: 6px; padding: 2px 6px; font-size: 10px; font-weight: 700; cursor: pointer; }
    #modal-exp .energia-pill small { font-weight: 500; opacity: .82; font-size: 10px; }
    @media (max-height: 430px) {
      #modal-exp .ref-lado { top: 56%; grid-template-columns: repeat(2, 62px); gap: 4px; }
      #modal-exp .ref-lado button { width: 62px; padding: 4px 2px; font-size: 9px; }
      #modal-exp .ref-lado img { width: 17px; height: 17px; }
    }
    #modal-exp .ref-passe { position: absolute; right: 12px; top: 58px; z-index: 8; width: 176px; padding: 8px 10px; border-radius: 11px; text-align: left; cursor: pointer; color: #fff7ed; border: 1px solid rgba(243,194,122,.55); background: linear-gradient(95deg, rgba(20,11,28,.92) 48%, rgba(20,11,28,.36)), url('../../../assets/confusion/interface/menus-v1/passe/fundo.webp') right center / cover no-repeat; box-shadow: 0 4px 14px rgba(0,0,0,.5); }
    #modal-exp .ref-passe small { display: block; font-size: 9.5px; color: #fde68a; opacity: .92; }
    #modal-exp .ref-passe b { display: block; font-size: 13px; line-height: 1.2; margin: 1px 0; font-family: Georgia, serif; }
    #modal-exp .ref-passe span { font-size: 10px; opacity: .86; }
    #modal-exp .ref-palco { position: absolute; inset: 0; z-index: 4; pointer-events: none; }
    #modal-exp .ref-onirico { position: absolute; transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; justify-content: flex-end; background: transparent; border: 0; padding: 0; cursor: pointer; pointer-events: auto; }
    #modal-exp .ref-onirico img.ref-sprite { height: 100%; width: auto; max-width: 240px; object-fit: contain; object-position: center bottom; filter: drop-shadow(0 8px 10px rgba(0,0,0,.7)); animation: refugio-respirar 3.4s ease-in-out infinite; transform-origin: center bottom; }
    @keyframes refugio-respirar { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.028); } }
    #modal-exp .ref-tag { margin-top: 2px; padding: 2px 9px; border-radius: 7px; background: rgba(20,11,28,.82); border: 1px solid rgba(243,194,122,.4); color: #fff7ed; text-align: center; line-height: 1.15; white-space: nowrap; }
    #modal-exp .ref-tag b { display: block; font-size: 11.5px; }
    #modal-exp .ref-tag small { display: block; font-size: 9.5px; color: #fde68a; }
    #modal-exp .ref-rodape { position: relative; z-index: 9; display: flex; justify-content: space-between; align-items: flex-end; gap: 8px; padding: 6px 12px calc(9px + env(safe-area-inset-bottom, 0px)); }
    #modal-exp .ref-grupo { display: flex; align-items: stretch; gap: 4px; background: rgba(22,12,32,.86); border: 1px solid rgba(243,194,122,.32); border-radius: 12px; padding: 4px; backdrop-filter: blur(4px); }
    #modal-exp .ref-dock { min-width: 60px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 5px 8px; border-radius: 9px; background: transparent; border: 1px solid transparent; color: #f6e7d8; font-size: 10.5px; font-weight: 600; cursor: pointer; }
    #modal-exp .ref-dock img { width: 22px; height: 22px; object-fit: contain; }
    #modal-exp .ref-dock.destaque { background: rgba(243,164,88,.18); border-color: #f3a458; color: #fde68a; }
    #modal-exp .ref-dock.pri { background: linear-gradient(180deg, #b8793e, #7c4923); border-color: #fde68a; color: #fff7ed; font-weight: 700; }
    #modal-exp .ref-dock.ativo-on { border-color: #4ade80; color: #86efac; }
    #modal-exp .ref-dock[disabled] { opacity: .45; cursor: not-allowed; }
    #modal-exp .ref-pop { position: absolute; right: 12px; bottom: 72px; z-index: 15; width: min(310px, calc(100% - 24px)); background: rgba(24,13,34,.96); border: 1.5px solid #f3a458; border-radius: 12px; padding: 9px; box-shadow: 0 8px 24px rgba(0,0,0,.72); }
    #modal-exp .ref-pop.topo { bottom: auto; top: 54px; }
    #modal-exp .ref-pop h5 { margin: 0 0 6px; color: #fde68a; font-size: 12.5px; display: flex; justify-content: space-between; align-items: center; }
    #modal-exp .ref-pop-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px; }
    #modal-exp .ref-pop-btn { display: flex; align-items: center; gap: 7px; padding: 7px 8px; border-radius: 8px; background: #2c1a3c; border: 1px solid #6b4a52; color: #fff3e7; font-size: 11.5px; font-weight: 600; cursor: pointer; text-align: left; }
    #modal-exp .ref-pop-btn img { width: 20px; height: 20px; object-fit: contain; flex: 0 0 20px; }
    #modal-exp .inv-v1 { display: flex; flex-direction: column; gap: 8px; padding: 8px 10px 10px; background: #170e22; }
    #modal-exp .inv-topo { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; padding-right: 48px; }
    #modal-exp .inv-topo-esq { display: flex; align-items: center; gap: 8px; }
    #modal-exp .inv-topo-esq h4 { margin: 0; font-size: clamp(16px, 2.3vw, 22px); color: #fde68a; font-family: Georgia, serif; }
    #modal-exp .inv-grid { display: grid; grid-template-columns: 142px 1fr; gap: 10px; align-items: stretch; }
    #modal-exp .inv-rail { display: flex; flex-direction: column; gap: 7px; }
    #modal-exp .inv-thumb { position: relative; width: 100%; height: 78px; border-radius: 10px; overflow: hidden; border: 2px solid #52335c; background: #20122c; padding: 0; cursor: pointer; text-align: left; color: #fff7ed; }
    #modal-exp .inv-thumb.ativo { border-color: #f3c27a; box-shadow: 0 0 0 2px rgba(243,194,122,.28); }
    #modal-exp .inv-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    #modal-exp .inv-thumb span { position: absolute; left: 0; right: 0; bottom: 0; padding: 3px 7px; font-size: 11.5px; font-weight: 700; background: linear-gradient(transparent, rgba(16,8,24,.92)); }
    #modal-exp .inv-main { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
    #modal-exp .inv-stage { position: relative; border-radius: 11px; border: 1.5px solid #c27848; overflow: hidden; background: #140b1e url('../../../assets/confusion/interface/invocacao-v1/palco-adventurer.webp') center 45% / cover no-repeat; min-height: 295px; display: flex; flex-direction: column; justify-content: space-between; padding: 10px 12px 8px; }
    #modal-exp .inv-stage.capa-modo { background-image: none; background-color: #100818; padding: 6px; justify-content: center; align-items: center; }
    #modal-exp .inv-stage::before { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(16,8,24,.66) 0%, rgba(16,8,24,0) 32%, rgba(16,8,24,.18) 72%, rgba(14,7,22,.82) 100%); pointer-events: none; z-index: 1; }
    #modal-exp .inv-stage.capa-modo::before { display: none; }
    #modal-exp .inv-capa-full { width: 100%; height: 280px; object-fit: contain; display: block; border-radius: 8px; }
    #modal-exp .inv-stage-head { position: relative; z-index: 3; display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    #modal-exp .inv-stage-head small { display: block; font-size: 10.5px; color: #fde68a; opacity: .9; }
    #modal-exp .inv-stage-head b { font-size: clamp(16px, 2.2vw, 22px); color: #fff7ed; font-family: Georgia, serif; text-shadow: 0 2px 8px #000; }
    #modal-exp .inv-elenco { position: relative; z-index: 3; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; align-items: end; margin-top: auto; padding-top: 6px; }
    #modal-exp .inv-ator { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; min-width: 0; }
    #modal-exp .inv-ator img { width: 100%; height: 158px; object-fit: contain; object-position: center bottom; filter: drop-shadow(0 6px 8px rgba(0,0,0,.72)); }
    #modal-exp .inv-ator.centro img { height: 192px; }
    #modal-exp .inv-ator-info { width: 100%; text-align: center; background: rgba(20,10,28,.82); border: 1px solid rgba(243,194,122,.28); border-radius: 7px; padding: 3px 4px; margin-top: 2px; line-height: 1.18; }
    #modal-exp .inv-ator-info b { display: block; font-size: 11px; color: #fff7ed; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    #modal-exp .inv-ator-info span { font-size: 9.5px; }
    #modal-exp .inv-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; background: rgba(28,16,40,.92); border: 1px solid #6b4a52; border-radius: 10px; padding: 7px 10px; }
    #modal-exp .inv-marcos { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; font-size: 11.5px; }
    #modal-exp .inv-marco { background: #190e24; border: 1px solid #8a6b52; border-radius: 6px; padding: 3px 7px; font-size: 11px; }
    #modal-exp .inv-acoes { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    #modal-exp .inv-res { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 7px; margin-top: 6px; }
    #modal-exp .inv-extra { padding: 0 10px 10px; }
    #modal-exp .eq-arena { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; align-items: stretch; padding: 10px; border-radius: 10px; background: linear-gradient(rgba(14,8,22,.45), rgba(14,8,22,.65)), center / cover no-repeat; margin: 6px 0; }
    #modal-exp .eq-vaga { position: relative; width: 100%; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(20,10,28,.82); border: 2px solid #8a6b52; border-radius: 10px; color: #fff3e7; font: 600 10.5px system-ui; padding: 6px 4px; touch-action: none; cursor: pointer; }
    #modal-exp .eq-vaga .mini-mold { width: min(82px, 100%); height: auto; aspect-ratio: 4 / 5; margin-bottom: 3px; }
    #modal-exp .eq-vaga.vazia { min-height: 112px; justify-content: center; border: none; background: url('../../../assets/confusion/interface/menus-v1/equipe/vaga-vazia.png') center / 100% 100% no-repeat; }
    #modal-exp .eq-vaga.sel { border: none; background: url('../../../assets/confusion/interface/menus-v1/equipe/vaga-selecionada.png') center / 100% 100% no-repeat; }
    #modal-exp .eq-col.sel { outline: 3px solid #fb923c; border-style: solid; }
    #modal-exp .mv1-ficha { background: linear-gradient(rgba(18,10,28,.82), rgba(18,10,28,.92)), url('../../../assets/confusion/interface/menus-v1/ficha/fundo.webp') center / cover no-repeat; border-color: #fb923c; }
    #modal-exp .mv1-chefes-topo { background: linear-gradient(rgba(18,10,28,.72), rgba(18,10,28,.9)), url('../../../assets/confusion/interface/menus-v1/chefes/fundo.webp') center / cover no-repeat; }
    #modal-exp .mv1-receita { background: linear-gradient(rgba(18,10,28,.72), rgba(18,10,28,.85)), url('../../../assets/confusion/interface/menus-v1/chefes/receita.png') center / 100% 100% no-repeat; padding: 6px 8px; border-radius: 8px; margin-top: 5px; }
    #modal-exp .ficha-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 5px; margin: 6px 0; }
    #modal-exp .ficha-stat { background: #221229; border-radius: 7px; padding: 5px; text-align: center; font-size: 11px; }
    #modal-exp .ficha-stat b { display: block; font-size: 13px; color: #fde68a; }
    #modal-exp .hab-item { background: #221229; border-radius: 7px; padding: 6px 8px; margin-bottom: 4px; font-size: 11.5px; }
    #modal-exp .evo-arvore { display: flex; align-items: center; gap: 6px; overflow-x: auto; padding: 6px 2px; }
    #modal-exp .evo-no { flex: 1 1 0; min-width: 96px; text-align: center; background: url('../../../assets/confusion/interface/menus-v1/ficha/forma-bloqueada.png') center / 100% 100% no-repeat; border: none; border-radius: 8px; padding: 8px 6px; font-size: 11px; }
    #modal-exp .evo-no.atual { background-image: url('../../../assets/confusion/interface/menus-v1/ficha/forma-atual.png'); }
    #modal-exp .evo-no img { width: 72px; height: 72px; object-fit: contain; display: block; margin: 0 auto 2px; }
    #modal-exp .evo-seta { width: 24px; height: 14px; object-fit: contain; flex: 0 0 auto; }
    @media (orientation: landscape) and (max-height: 500px) {
      #modal-exp .exp-card { padding: 6px 10px; }
      #modal-exp .exp-card.modo-cena { height: calc(100dvh - 8px); padding: 0; border-radius: 10px; }
      #modal-exp .eq-arena { padding: 7px; gap: 6px; }
      #modal-exp .eq-vaga .mini-mold { width: 68px; }
      #modal-exp .eq-vaga.vazia { min-height: 92px; }
      #modal-exp .ref-topo { padding: 6px 46px 2px 10px; }
      #modal-exp .ref-perfil img { width: 30px; height: 30px; }
      #modal-exp .ref-perfil b { font-size: 11.5px; }
      #modal-exp .ref-pill { padding: 3px 8px; font-size: 11px; }
      #modal-exp .ref-btn-ico { width: 30px; height: 30px; }
      #modal-exp .ref-titulo { top: 44px; left: 10px; }
      #modal-exp .ref-titulo h4 { font-size: 16px; }
      #modal-exp .ref-lado { left: 8px; top: 53%; gap: 4px; }
      #modal-exp .ref-lado button { width: 52px; padding: 5px 2px; font-size: 9.5px; }
      #modal-exp .ref-lado img { width: 18px; height: 18px; }
      #modal-exp .ref-passe { top: 44px; right: 10px; width: 148px; padding: 6px 8px; }
      #modal-exp .ref-passe b { font-size: 11.5px; }
      #modal-exp .ref-tag { padding: 1px 6px; }
      #modal-exp .ref-tag b { font-size: 10px; }
      #modal-exp .ref-tag small { font-size: 8.5px; }
      #modal-exp .ref-rodape { padding: 4px 8px 6px; }
      #modal-exp .ref-dock { min-width: 50px; padding: 4px 6px; font-size: 9.5px; }
      #modal-exp .ref-dock img { width: 18px; height: 18px; }
      #modal-exp .ref-pop { bottom: 58px; }
      #modal-exp .inv-v1 { padding: 5px 8px 6px; gap: 5px; }
      #modal-exp .inv-topo { padding-right: 40px; }
      #modal-exp .inv-grid { grid-template-columns: 112px 1fr; gap: 7px; }
      #modal-exp .inv-thumb { height: 56px; }
      #modal-exp .inv-thumb span { font-size: 10px; padding: 2px 5px; }
      #modal-exp .inv-stage { min-height: 206px; padding: 6px 8px 5px; }
      #modal-exp .inv-capa-full { height: 194px; }
      #modal-exp .inv-stage-head b { font-size: 15px; }
      #modal-exp .inv-ator img { height: 110px; }
      #modal-exp .inv-ator.centro img { height: 132px; }
      #modal-exp .inv-ator-info { padding: 2px 3px; }
      #modal-exp .inv-ator-info b { font-size: 9.5px; }
      #modal-exp .inv-ator-info span { font-size: 8.5px; }
      #modal-exp .inv-bar { padding: 5px 8px; }
      #modal-exp .inv-marco { padding: 2px 5px; font-size: 10px; }
    }
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
  modal.innerHTML = '<div class="modal-card exp-card" role="dialog" aria-modal="true"><header class="modal-head"><h3 id="exp-titulo"></h3><span id="exp-energia" class="energia-pill" hidden></span><button class="btn-sec" id="exp-rever" hidden>Rever tutorial</button><button class="btn-fechar" id="exp-fechar" aria-label="Fechar">✕</button></header><nav class="exp-abas" id="exp-abas"></nav><div class="exp-corpo" id="exp-corpo"></div></div>';
  document.body.append(modal);
  const crise = document.createElement('div'); crise.id = 'exp-crise'; document.body.append(crise);
  const $ = (q) => modal.querySelector(q);

  // ---------- estado de tela ----------
  let painel = null, aba = 0, revendo = null, resumoUlt = null, loteRec = 'tonico', loteQtd = 3, ultimasInvocacoes = [], hvEstado = null, fichaUid = null, descPop = null, verCapaInv = false, capParalela = 1; let cap = 'cap1';
  const torresUi = { torreElId: null, andarEl: 1, torreUnId: null, andarUn: 1 };
  const calaboucosUi = { calId: null, nivel: 1 };
  const reliquiasUi = { uid: null, parte: null, raridade: null };
  const PAINEIS = {
    descanso: { titulo: '🏕️ Refúgio do Farol', abas: ['Refúgio'], tut: null },
    campanhaMini: { titulo: '🗺️ Campanha Mini', abas: ['Campanha Mini'], tut: null, mostraEnergia: true },
    torres: { titulo: '🗼 Torres', abas: ['Torres Elementais', 'Torres Únicas'], tut: null, mostraEnergia: true },
    calaboucos: { titulo: '🏰 Calabouços', abas: ['Calabouços'], tut: null, mostraEnergia: true },
    reliquias: { titulo: '💎 Relíquias & Essências', abas: ['Relíquias', 'Essências'], tut: null, mostraEnergia: true },
    missoes: { titulo: '📜 Missões', abas: ['Marcos', 'Paralelas'], tut: null, mostraEnergia: true },
    equipe: { titulo: '⚔️ Equipe', abas: ['Formação & Coleção', 'Domadores'], tut: null },
    oniricos: { titulo: '🎫 Invocação', abas: ['Invocação'], tut: 'banner' },
    cacadas: { titulo: '🏹 Caçadas & Chefes', abas: ['Caçadas', 'Calabouço', 'Chefes'], tut: 'cacadas' },
    guilda: { titulo: '🏛️ Guilda dos Aventureiros', abas: ['Contratos', 'Fazenda', 'Oficina', 'Reinos'], tut: 'guilda' },
    cronicas: { titulo: '📜 Crônicas', abas: ['Crise', 'Herói × Vilão'], tut: 'crise' },
  };
  function energiaTextoHtml(s) {
    const e = energiaDe(s, Date.now());
    const faltaMs = e.atual >= e.max ? 0 : Math.max(0, ENERGIA_CFG.intervaloMs - (Date.now() - e.ultimoTickMs));
    const timer = faltaMs > 0 ? `<small>+1 em ${dur(faltaMs)}</small>` : '<small>cheia</small>';
    const btnPoc = e.pocoes > 0 ? `<button type="button" data-usar-energia="1" title="Usar 1 Poção de Energia (+${ENERGIA_CFG.ganhoPocao})">+${ENERGIA_CFG.ganhoPocao} (${e.pocoes})</button>` : '';
    return `⚡ <b>${e.atual}/${e.max}</b> ${timer} ${btnPoc}`;
  }
  const tutDaAba = (p, a) => (p === 'guilda' ? ['guilda', 'fazenda', 'oficina', 'reinos'][a] : p === 'cacadas' ? ['cacadas', 'calabouco', null][a] : p === 'cronicas' ? ['crise', 'hv'][a] : p === 'oniricos' ? 'banner' : null);
  function cartaoTut(id) {
    const t = TUTS[id]; if (!t) return '';
    const visto = exp().tut[id]; if (visto && revendo !== id) return '';
    return `<div class="bl tut"><h4>📘 ${esc(t.titulo)}</h4>${t.passos.map((p, i) => `<p>${i + 1}. ${esc(p)}</p>`).join('')}<div class="ln"><button class="btn-pri" data-tutok="${id}">Entendi</button></div></div>`;
  }
  const destacar = (id) => { const t = TUTS[id]; const vis = t && (!exp().tut[id] || revendo === id); if (!vis || !t.destaque) return; for (const sel of t.destaque.split(',')) { const e = $('#exp-corpo').querySelector(sel.trim()); if (e) { e.classList.add('tut-destaque'); break; } } };
  const fabD = () => FAB;

  // ---------- Área de Descanso (Refúgio do Farol), Invocação (×1/×10) & Equipe ----------
  function artePequena(esp) { const p = ARTE_DA_ESPECIE[esp] || `assets/monsters/${esp.toLowerCase()}/sprite-front.png`; return IMG(p); }
  function arteElencoInv(esp) {
    const sl = slugArt(esp);
    if (ELENCO_INV_V1.has(sl)) return INV_V1(`elenco/${sl}.webp`);
    return artePequena(esp);
  }
  function arteRepouso(m) {
    const sl = slugArt(m?.especie);
    if (INICIAIS_REPOUSO.has(sl)) return DESCANSO_V1(`iniciais/${sl}.webp`);
    if (ELENCO_INV_V1.has(sl)) return INV_V1(`elenco/${sl}.webp`);
    return arteDe(m);
  }
  function bonusCombateMembro(m) {
    const base = bonusDoMembro(m);
    const cat = bonusCategoriaPoder(m);
    if (cat.categoria === 'chefe_recrutado') {
      return { ...base, hp: (base.hp || 0) + cat.hp, atk: (base.atk || 0) + cat.atk, def: (base.def || 0) + cat.def };
    }
    return base;
  }
  function ordenarEquipeRefugio(s, idle) {
    const ativos = R.membrosFormacao(idle).map((x) => x.m);
    const base = ativos.length ? ativos.slice(0, 4) : (idle.equipe || []).slice(0, 4);
    const iniNome = s.conta?.inicial;
    const idxIni = base.findIndex((m) => m.inicial || (iniNome && m.especie === iniNome));
    if (idxIni > 0) { const [ini] = base.splice(idxIni, 1); base.unshift(ini); }
    return base;
  }
  function abaDescanso() {
    const s = save(), idle = s.idle || {}, listaEq = ordenarEquipeRefugio(s, idle);
    const mapaAtual = MAPAS[getMapaId()]?.nome || getMapaId() || 'Região 1';
    const autoOn = Boolean(idle.autoCaca?.ativo);
    const nvDomador = nivelDe(idle.jogador?.xp || 0);
    const nomeJogador = s.conta?.nome || 'Azazel';
    const gold = Number(s.recompensas?.gold || 0).toLocaleString('pt-BR');
    const diamantes = Number(s.recompensas?.diamantes || 0).toLocaleString('pt-BR');
    const passe = infoPasse(s);
    const hwOn = Boolean(window.regiaoHW?.liberado?.());
    const guildaOn = R.aberto(s, 'guilda');
    const cacadasOn = R.aberto(s, 'cacadas');
    const calaboucoOn = R.aberto(s, 'calabouco');
    const cronicasOn = R.aberto(s, 'cronicas');
    const reinosOn = R.aberto(s, 'reinos');

    const ancoras = listaEq.length <= 1
      ? [{ x: 50, y: 78, h: 35, z: 4 }]
      : listaEq.length === 2
        ? [{ x: 42, y: 79, h: 34, z: 4 }, { x: 63, y: 76, h: 29, z: 3 }]
        : listaEq.length === 3
          ? [{ x: 45, y: 79, h: 34, z: 4 }, { x: 66, y: 75, h: 28, z: 3 }, { x: 26, y: 71, h: 26, z: 2 }]
          : [{ x: 43, y: 79, h: 34, z: 4 }, { x: 63, y: 77, h: 29, z: 3 }, { x: 27, y: 70, h: 25, z: 2 }, { x: 75, y: 68, h: 25, z: 2 }];

    const palcoHtml = listaEq.map((m, i) => {
      const p = ancoras[i] || ancoras[ancoras.length - 1];
      const tier = tierDaUnidade(m);
      return `<button class="ref-onirico" data-desc-ficha="${m.uid}" style="left:${p.x}%;top:${p.y}%;height:${p.h}%;z-index:${p.z}" title="Abrir ficha de ${esc(m.especie)}">
        <img class="ref-sprite" style="animation-delay:${(i * 0.45).toFixed(2)}s" src="${arteRepouso(m)}" alt="${esc(m.especie)}">
        <span class="ref-tag"><b>${esc(m.especie)}</b><small>Nv.${m.nivel || 1} · T${tier}</small></span>
      </button>`;
    }).join('');

    let popHtml = '';
    if (descPop === 'batalhas') {
      const modosBat = [
        { acao: 'campanhaMini', ico: 'campanha.png', tit: 'Campanha Mini' },
        { acao: 'torres', ico: 'torre.png', tit: 'Torres' },
        { acao: 'calaboucos', ico: 'calabouco.png', tit: 'Calabouços' },
        { acao: 'atlas', ico: 'cacas.png', tit: 'Atlas de Caça' },
        { acao: 'idle', ico: 'idle.png', tit: autoOn ? 'Idle (Auto ON)' : 'Ativar Idle' },
        ...(cacadasOn ? [{ acao: 'cacadas', ico: 'batalhas.png', tit: 'Caçadas & Chefes' }] : []),
        ...(hwOn ? [{ acao: 'torre', ico: 'torre.png', tit: 'Torre Halloween' }] : []),
        ...(cronicasOn ? [{ acao: 'cronicas', ico: 'cronicas.png', tit: 'Crônicas & H×V' }] : []),
      ];
      popHtml = `<div class="ref-pop"><h5><span>⚔️ Modos de Batalha</span><button class="btn-sec" data-desc-pop="" style="padding:2px 7px;font-size:11px">✕</button></h5>
        <div class="ref-pop-grid">${modosBat.map((b) => `<button class="ref-pop-btn" data-desc-ir="${b.acao}"><img src="${DESCANSO_V1(`icones/${b.ico}`)}" alt=""><span>${esc(b.tit)}</span></button>`).join('')}</div></div>`;
    } else if (descPop === 'atalhos') {
      const extras = [
        { acao: 'passe', ico: 'passe.png', tit: 'Passe & Login' },
        { acao: 'mochila', ico: 'mochila.png', tit: 'Mochila' },
        { acao: 'codex', ico: 'colecao.png', tit: 'Codex Onírico' },
        { acao: 'regioes', ico: 'reinos.png', tit: 'Regiões (12)' },
        ...(reinosOn ? [{ acao: 'reinos', ico: 'reinos.png', tit: 'Reinos' }] : []),
        { acao: 'loja', ico: 'loja.png', tit: hwOn ? 'Loja da Torre' : 'Vote & Ganhe' },
        { acao: 'config', ico: 'atalhos.png', tit: 'Configurações' },
        { acao: 'menu', ico: 'casa.png', tit: 'Menu Principal' },
      ];
      popHtml = `<div class="ref-pop topo"><h5><span>Atalhos do Refúgio</span><button class="btn-sec" data-desc-pop="" style="padding:2px 7px;font-size:11px">✕</button></h5>
        <div class="ref-pop-grid">${extras.map((b) => `<button class="ref-pop-btn" data-desc-ir="${b.acao}"><img src="${DESCANSO_V1(`icones/${b.ico}`)}" alt=""><span>${esc(b.tit)}</span></button>`).join('')}</div></div>`;
    }

    return `<div class="ref-cena" data-refugio="1">
      <div class="ref-topo">
        <button class="ref-perfil" data-desc-ir="mochila" title="Abrir Domador e Mochila">
          <img src="${DESCANSO_V1('avatar-azazel.webp')}" alt="${esc(nomeJogador)}">
          <span><b>${esc(nomeJogador)}</b><small>Domador · Nv.${nvDomador}</small></span>
        </button>
        <div class="ref-moedas">
          <span class="energia-pill" data-energia-refugio="1">${energiaTextoHtml(s)}</span>
          <span class="ref-pill">🪙 ${gold}</span>
          <span class="ref-pill">💎 ${diamantes}</span>
          <button class="ref-btn-ico" data-desc-pop="${descPop === 'atalhos' ? '' : 'atalhos'}" title="Atalhos" aria-label="Atalhos"><img src="${DESCANSO_V1('icones/atalhos.png')}" alt=""></button>
        </div>
      </div>
      <div class="ref-titulo"><small>${esc(mapaAtual)}</small><h4>Refúgio do Farol</h4></div>
      ${renderGuiaJogadorNovo(s)}
      <div class="ref-lado">
        <button class="destaque-modo" data-desc-ir="campanhaMini"><img src="${DESCANSO_V1('icones/campanha.png')}" alt=""><span>Campanha Mini</span></button>
        <button data-desc-ir="torres"><img src="${DESCANSO_V1('icones/torre.png')}" alt=""><span>Torres</span></button>
        <button data-desc-ir="calaboucos"><img src="${DESCANSO_V1('icones/calabouco.png')}" alt=""><span>Calabouços</span></button>
        <button data-desc-ir="reliquias"><img src="${DESCANSO_V1('icones/mochila.png')}" alt=""><span>Relíquias</span></button>
        <button data-desc-ir="missoes"><img src="${DESCANSO_V1('icones/missoes.png')}" alt=""><span>Missões${temAvisoMissoes(save()) ? ' ●' : ''}</span></button>
        <button data-desc-ir="eventos"><img src="${DESCANSO_V1('icones/eventos.png')}" alt=""><span>Eventos</span></button>
      </div>
      <button class="ref-passe" data-desc-ir="passe">
        <small>Passe da Temporada</small>
        <b>${esc(passe.edicao?.tema?.nome || 'Dinossauros')}</b>
        <span>Nv.${passe.nivel}/${passe.niveis}${passe.aResgatar ? ` · ${passe.aResgatar} pronto(s)` : ''}</span>
      </button>
      <div class="ref-palco">${palcoHtml}</div>
      ${popHtml}
      <div class="ref-rodape">
        <div class="ref-grupo">
          <button class="ref-dock" data-desc-ir="equipe"><img src="${DESCANSO_V1('icones/equipe.png')}" alt=""><span>Equipe</span></button>
          <button class="ref-dock destaque" data-desc-ir="oniricos"><img src="${DESCANSO_V1('icones/invocacao.png')}" alt=""><span>Invocação</span></button>
          <button class="ref-dock" data-desc-ir="codex"><img src="${DESCANSO_V1('icones/colecao.png')}" alt=""><span>Coleção</span></button>
          <button class="ref-dock" data-desc-ir="guilda" ${guildaOn ? '' : 'disabled title="Visite a cidade na Campanha para abrir a Guilda"'}><img src="${DESCANSO_V1('icones/guilda.png')}" alt=""><span>Guilda</span></button>
          <button class="ref-dock" data-desc-ir="mochila"><img src="${DESCANSO_V1('icones/mochila.png')}" alt=""><span>Mochila</span></button>
        </div>
        <div class="ref-grupo">
          <button class="ref-dock ${autoOn ? 'ativo-on' : ''}" data-desc-ir="idle"><img src="${DESCANSO_V1('icones/idle.png')}" alt=""><span>${autoOn ? 'Idle ON' : 'Idle'}</span></button>
          <button class="ref-dock ${descPop === 'batalhas' ? 'destaque' : ''}" data-desc-pop="${descPop === 'batalhas' ? '' : 'batalhas'}"><img src="${DESCANSO_V1('icones/batalhas.png')}" alt=""><span>Batalhas</span></button>
          <button class="ref-dock pri" data-desc-ir="campanha"><img src="${DESCANSO_V1('icones/campanha.png')}" alt=""><span>Campanha</span></button>
        </div>
      </div>
    </div>`;
  }
  function abaBanner() {
    const s = save(), e = exp(), pool = R.poolBanner();
    const ate10 = 10 - ((e.pulls || 0) % 10);
    const gold = Number(s.recompensas?.gold || 0).toLocaleString('pt-BR');
    const diamantes = Number(s.recompensas?.diamantes || 0).toLocaleString('pt-BR');
    const hwOn = Boolean(window.regiaoHW?.liberado?.());
    // Elenco de destaque real do Banner Permanente (com Tatuveludo T5 Lendária centralizado)
    const ordemPalco = ['Cervomusgo', 'Fanalino', 'Tatuveludo', 'Cobrabúfalo', 'Xistolim'];
    const destaques = ordemPalco.map((nome) => pool.find((p) => p.especie === nome)).filter(Boolean);
    const elencoPalco = destaques.length === 5 ? destaques : [
      ...pool.filter((p) => p.raridade === 'rara').slice(0, 1),
      ...pool.filter((p) => p.raridade === 'epica').slice(0, 1),
      ...pool.filter((p) => p.raridade === 'lendaria').slice(0, 1),
      ...pool.filter((p) => p.raridade === 'epica').slice(1, 2),
      ...pool.filter((p) => p.raridade === 'comum').slice(0, 1),
    ].slice(0, 5);

    let h = `<div class="inv-v1">
      <div class="inv-topo">
        <div class="inv-topo-esq">
          <button class="btn-sec" data-desc-ir="descanso">← Refúgio</button>
          <h4>Invocação</h4>
        </div>
        <div class="ref-moedas">
          <span class="ref-pill">🪙 ${gold}</span>
          <span class="ref-pill">💎 ${diamantes}</span>
          <span class="ref-pill"><img class="exp-ico" src="${INV_V1('tickets/adventurer.png')}" alt="">${e.tickets}</span>
          <button class="btn-sec" data-inv-capa="1" style="padding:4px 8px;font-size:11px">${verCapaInv ? 'Ver Elenco' : 'Ver Capa'}</button>
        </div>
      </div>
      <div class="inv-grid">
        <div class="inv-rail" role="tablist" aria-label="Banners disponíveis">
          ${hwOn ? `<button class="inv-thumb" data-desc-ir="halloween"><img src="${INV_V1('miniaturas/halloween.webp')}" alt="Banner de Halloween"><span>Halloween</span></button>` : ''}
          <button class="inv-thumb ativo" aria-selected="true"><img src="${INV_V1('miniaturas/adventurer.webp')}" alt="Banner Permanente Adventurer"><span>Adventurer</span></button>
        </div>
        <div class="inv-main">
          <div class="inv-stage ${verCapaInv ? 'capa-modo' : ''}">
            ${verCapaInv
              ? `<img class="inv-capa-full" src="${INV_V1('capas/adventurer.webp')}" alt="Capa do Banner Permanente Adventurer">`
              : `<div class="inv-stage-head"><div><small>Banner Permanente · ${pool.length} espécies</small><b>Adventurer</b></div></div>
                 <div class="inv-elenco">${elencoPalco.map((p, idx) => `
                   <div class="inv-ator ${idx === 2 ? 'centro' : ''}">
                     <img src="${arteElencoInv(p.especie)}" alt="${esc(p.especie)}">
                     <div class="inv-ator-info"><b>${esc(p.especie)}</b><span style="color:${RARO[p.raridade]}">T${p.tier} · ${esc(p.elemento)}</span></div>
                   </div>`).join('')}</div>`}
          </div>
          <div class="inv-bar">
            <div class="inv-marcos">
              <span class="inv-marco">Garantia: <b>${10 - ate10}/10</b></span>
              <span class="inv-marco">Faltam <b>${ate10}</b> p/ Rara+</span>
              <span class="inv-marco">Total: <b>${e.pulls || 0}</b></span>
            </div>
            <div class="inv-acoes">
              <button class="btn-sec" data-invocar="1" ${e.tickets >= 1 ? '' : 'disabled'}>Invocar ×1</button>
              <button class="btn-pri" data-invocar="10" ${e.tickets >= 10 ? '' : 'disabled'}>Invocar ×10</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
    h += '<div class="inv-extra">';
    if (ultimasInvocacoes.length) {
      h += `<div class="bl"><h4>Resultado (${ultimasInvocacoes.length})</h4><div class="inv-res">${ultimasInvocacoes.map((r) => {
        const mN = MOLDURAS_BANNER[r.raridade] || r.tier || 1;
        const cls = infoClasse(r.especie);
        return `<div class="mini"><div class="mini-mold"><img class="sp" src="${arteElencoInv(r.especie)}" alt="${esc(r.especie)}"><img class="ov" src="${IMG(arteMoldura(mN))}" alt="" onerror="this.style.display='none'"></div><b>${esc(r.especie)}</b><br><span style="color:${RARO[r.raridade] || '#cbd5e1'}">T${r.tier || mN} · ${esc(r.raridade)}</span><br><span class="mut">${cls.icone} ${esc(cls.nome)}</span></div>`;
      }).join('')}</div></div>`;
    }
    h += `<div class="bl"><h4>Elenco completo no Banner (${pool.length}) · Comum 70% · Rara 22% · Épica 7% · Lendária 1%</h4><div class="grade">${pool.map((p) => {
      const mN = MOLDURAS_BANNER[p.raridade] || p.tier || 1;
      const cls = infoClasse(p.especie);
      return `<div class="mini"><div class="mini-mold"><img class="sp" src="${arteElencoInv(p.especie)}" alt="" loading="lazy"><img class="ov" src="${IMG(arteMoldura(mN))}" alt="" onerror="this.style.display='none'"></div>${esc(p.especie)}<br><span style="color:${RARO[p.raridade]}">T${p.tier || mN} · ${p.raridade}</span><br><span class="mut">${cls.icone} ${esc(cls.nome)}</span></div>`;
    }).join('')}</div></div></div>`;
    return h;
  }

  // Equipe: menu próprio com até 4 vagas sem sobreposição + cartões com nível, tier, raridade, moldura, classe e estrelas.
  // Tocar num Onírico abre a ficha completa diretamente visível no topo (com stats, até 3 habilidades e árvore conectada das 3 formas).
  let selEq = null; // { tipo: 'col' | 'vaga', uid?, vaga? }
  const arteDe = (m) => (m?.arte ? IMG(m.arte) : arteDoIndividuo(m) ? `../../../${arteDoIndividuo(m)}` : artePequena(m.especie));
  function renderFichaOnirico(eq, uid) {
    const idx = eq.findIndex((o) => o.uid === uid);
    if (idx < 0) return '';
    const m = eq[idx];
    const f = fichaOnirico(m, save());
    if (!f) return '';
    const corR = RARO[f.raridade] || COR_TIER[f.tier] || '#cbd5e1';
    const arv = f.arvore;
    const tagPoder = f.categoriaPoder === 'chefe_recrutado' ? ' · 👑 Chefe (+20%)' : f.categoriaPoder === 'exclusivo_banner' ? ' · 🌟 Exclusivo (+30%)' : '';
    const evo = consultarEvolucaoForma(save(), idx);
    const essHtml = evo?.custoEssencias
      ? ['menor', 'media', 'maior']
          .filter((t) => (evo.custoEssencias[t] || 0) > 0)
          .map((t) => {
            const need = evo.custoEssencias[t];
            const have = evo.saldoEssencias?.[t] || 0;
            const rot = t === 'menor' ? 'Menor' : t === 'media' ? 'Média' : 'Maior';
            return `<span class="tag" style="color:${have >= need ? '#86efac' : '#fca5a5'}">💠 ${esc(evo.essenciaNome)} ${rot}: ${have}/${need}</span>`;
          }).join(' ')
      : '';
    const arvoreHtml = arv.possuiArvore
      ? `<div style="margin-top:8px">${renderBalaoTutorialModo(save(), 'evolucao_essencias')}<b>Árvore de Evolução (${esc(arv.elemento)})</b>
          <div class="evo-arvore">${arv.formas.map((no, i) => `
            <div class="evo-no ${no.atual ? 'atual' : ''}">
              <img src="${no.arte ? IMG(no.arte) : artePequena(no.especie)}" alt="${esc(no.especie)}">
              <b>${esc(no.especie)}</b><br>
              <span class="mut">${esc(no.rotulo)}${no.tierFixo ? ` · T${no.tierFixo}` : ''}</span>
              ${no.atual ? '<br><span class="ok">Atual</span>' : ''}
            </div>${i < arv.formas.length - 1 ? `<img class="evo-seta" src="${MV1('ficha/conexao.png')}" alt="→">` : ''}
          `).join('')}</div>
          ${arv.bloqueada
            ? `<p class="ruim"><img class="exp-ico" src="${MV1('comum/icone-cadeado.png')}" alt="">${esc(arv.motivoBloqueio || 'Evolução bloqueada.')}</p>`
            : arv.proxima
              ? `<div class="ln" style="flex-direction:column;align-items:flex-start;gap:6px">
                  <div><img class="exp-ico" src="${MV1(`ficha/sonho-${slugSonho(arv.proxima.elemento)}.png`)}" alt="" onerror="this.src='${MV1('ficha/sonho-neutro.png')}'">Próxima: <b>${esc(arv.proxima.para)}</b> · Fragmentos (${esc(arv.proxima.elemento)}): <b style="color:${arv.proxima.saldo >= arv.proxima.custo ? '#86efac' : '#fca5a5'}">${arv.proxima.saldo}/${arv.proxima.custo}</b></div>
                  ${essHtml ? `<div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center">${essHtml}</div>` : ''}
                  <div style="display:flex;gap:6px;flex-wrap:wrap">
                    <button class="btn-pri" data-evo-forma="${idx}" ${evo.podeEvoluir ? '' : 'disabled'}>✨ Evoluir</button>
                    ${!evo.temEssencias ? '<button class="btn-sec" data-desc-ir="torres">🗼 Farmar Essências</button>' : ''}
                  </div>
                </div>`
              : '<p class="ok">Forma final alcançada.</p>'}
        </div>`
      : '';
    return `<div class="bl mv1-ficha" id="ficha-onirico">
      <div class="card-on">
        <div class="card-mold ${f.tier >= 5 ? 'm5' : ''}" style="--cor-m:${corR}">
          <img class="sp" src="${arteDe(m)}" alt="${esc(f.especie)}">
          <img class="ov" src="${IMG(f.moldura)}" alt="" onerror="this.style.display='none'">
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap">
            <h4>${esc(f.especie)} · Nv.${f.nivel}</h4>
            <div style="display:flex;gap:5px;flex-wrap:wrap">
              <button class="btn-pri" data-ficha-escalar="${m.uid}">⚔️ Escalar</button>
              <button class="btn-sec" data-ficha-fechar="1">← Voltar à Equipe</button>
            </div>
          </div>
          <p><span style="color:${corR}"><b>T${f.tier}</b> (${esc(f.raridade)})</span> · ${badgeEstrelas(f.estrelas)} · ${esc(f.elemento)} · <b>${f.classeInfo?.icone || ''} ${esc(f.classe)}</b>${tagPoder}</p>
          <p class="mut">Bônus T${f.tier}: ${fmtPct(f.bonusTier)} · Bônus ${f.estrelas}★: ${fmtPct(f.bonusEstrelas)}</p>
          <div class="ficha-grid">
            <div class="ficha-stat"><span>HP</span><b>${f.hp}</b></div>
            <div class="ficha-stat"><span>Ataque</span><b>${f.ataque}</b></div>
            <div class="ficha-stat"><span>Defesa</span><b>${f.defesa}</b></div>
            <div class="ficha-stat"><span>Velocidade</span><b>${f.velocidade}</b></div>
          </div>
        </div>
      </div>
      <div style="margin-top:6px"><b>Habilidades (${f.habilidades.length})</b>${f.habilidades.map((hb) => `
        <div class="hab-item">
          <b>${hb.icone} ${esc(hb.nome)}</b> · <span class="mut">Recarga: ${hb.recarga} turno${hb.recarga > 1 ? 's' : ''}</span>
          ${hb.efeitos.length ? `<div>Efeitos: ${hb.efeitos.map((ef) => `${ef.icone} ${esc(ef.nome)} (${ef.turnos}t)`).join(', ')}</div>` : ''}
        </div>`).join('')}
      </div>
      ${arvoreHtml}
    </div>`;
  }
  function abaEquipe() {
    const idle = save().idle, eq = idle.equipe || [], f = R.formacaoDe(idle);
    if (fichaUid && eq.some((o) => o.uid === fichaUid)) {
      return renderFichaOnirico(eq, fichaUid);
    }
    const vagas = [0, 1, 2, 3].map((v) => {
      const m = eq.find((o) => o.uid === f[v]); const sel = selEq?.tipo === 'vaga' && selEq.vaga === v;
      if (!m) return `<button class="eq-vaga ${sel ? 'sel' : ''} vazia" data-eq-vaga="${v}"><img src="${MV1('equipe/icone-adicionar.png')}" alt="" style="width:22px;height:22px;object-fit:contain;margin-bottom:2px"><span>Posição ${v + 1}</span><small class="mut">Vazia</small></button>`;
      const tier = tierDaUnidade(m), est = estrelasDaUnidade(m), rar = raridadeRotulo(tier);
      return `<button class="eq-vaga ${sel ? 'sel' : ''}" data-eq-vaga="${v}">
        <div class="mini-mold"><img class="sp" src="${arteDe(m)}" alt=""><img class="ov" src="${IMG(molduraDoTier(tier))}" alt="" onerror="this.style.display='none'"></div>
        <span>${esc(m.especie)} · Nv.${m.nivel || 1}</span>
        <small>T${tier} · ${esc(rar)} · ${badgeEstrelas(est, true)}</small>
      </button>`;
    }).join('');
    const col = eq.map((m) => {
      const na = f.indexOf(m.uid); const sel = selEq?.tipo === 'col' && selEq.uid === m.uid;
      const tier = tierDaUnidade(m), est = estrelasDaUnidade(m), rar = raridadeRotulo(tier), cls = infoClasse(m.especie);
      return `<button class="mini eq-col ${sel ? 'sel' : ''}" data-eq-col="${m.uid}">
        <div class="mini-mold"><img class="sp" src="${arteDe(m)}" alt="" loading="lazy"><img class="ov" src="${IMG(molduraDoTier(tier))}" alt="" onerror="this.style.display='none'"></div>
        <b>${esc(m.especie)}</b><br>Nv.${m.nivel || 1} · <span style="color:${COR_TIER[tier] || '#cbd5e1'}">T${tier}</span> (${esc(rar)})<br>${badgeEstrelas(est, true)} · <span class="mut">${cls.icone} ${esc(cls.nome)}</span>${na >= 0 ? `<br><span class="ok">Posição ${na + 1}</span>` : ''}
      </button>`;
    }).join('');
    const dica = selEq ? (selEq.tipo === 'col' ? 'Toque numa posição acima para escalar este Onírico ou toque em "Abrir Ficha".' : 'Toque noutra posição para trocar, num Onírico da coleção para substituir, ou abra a Ficha.') : 'Toque em uma vaga ou Onírico para escalar/reorganizar ou abrir a Ficha completa.';
    const uidFoco = selEq?.tipo === 'col' ? selEq.uid : selEq?.tipo === 'vaga' ? f[selEq.vaga] : null;
    return `<div class="bl"><h4>Formação (${f.filter(Boolean).length}/4)</h4><p class="mut">${dica}</p>
      <div class="eq-arena" style="background-image:linear-gradient(rgba(14,8,22,.45), rgba(14,8,22,.65)), url('${MV1('equipe/fundo.webp')}')">${vagas}</div>
      <div class="ln">
        ${uidFoco ? `<button class="btn-pri" data-ficha-abrir="${uidFoco}">📋 Abrir Ficha &amp; Evolução</button>` : ''}
        ${selEq?.tipo === 'vaga' && f[selEq.vaga] ? `<button class="btn-sec" data-eq-tirar="${selEq.vaga}">Retirar da posição ${selEq.vaga + 1}</button>` : ''}
        ${selEq ? '<button class="btn-sec" data-eq-cancelar="1">Cancelar seleção</button>' : ''}
      </div>
      <p class="mut">A formação vale na Campanha, Idle, Torre, Revanches de Chefes, expedições e Herói × Vilão.</p></div>
      <div class="bl"><h4>Coleção (${eq.length})</h4><div class="grade">${col}</div></div>`;
  }
  function tocarEquipe(d) {
    const idle = save().idle;
    if (d.fichaFechar) { fichaUid = null; $('#exp-corpo').scrollTop = 0; return true; }
    if (d.fichaAbrir) { fichaUid = d.fichaAbrir; $('#exp-corpo').scrollTop = 0; return true; }
    if (d.fichaEscalar) { fichaUid = null; selEq = { tipo: 'col', uid: d.fichaEscalar }; $('#exp-corpo').scrollTop = 0; return true; }
    if (d.evoForma !== undefined) {
      const r = evoluirFormaOnirico(save(), Number(d.evoForma));
      mostrarToast(r.ok ? `${r.de} evoluiu para ${r.para} (T${r.tier})!` : r.motivo, 2800);
      if (r.ok) salvar();
      return true;
    }
    if (d.eqCancelar) { selEq = null; return true; }
    if (d.eqTirar !== undefined) { if (!R.tirarDaVaga(idle, Number(d.eqTirar))) mostrarToast('Mantenha ao menos um Onírico na formação.', 2200); selEq = null; salvar(); return true; }
    if (d.eqCol) {
      if (selEq?.tipo === 'vaga') { R.colocarNaVaga(idle, d.eqCol, selEq.vaga); selEq = null; salvar(); }
      else { fichaUid = d.eqCol; selEq = null; $('#exp-corpo').scrollTop = 0; }
      return true;
    }
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
    document.addEventListener('pointerdown', (e) => { const b = e.target.closest?.('#modal-exp .eq-vaga:not(.vazia)'); if (!b) return; de = { vaga: Number(b.dataset.eqVaga), x: e.clientX, y: e.clientY, moveu: false, img: b.querySelector('img.sp')?.src }; });
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
    const eq = membros.map(({ m: x, vaga }) => ({ especie: x.especie, nivel: x.nivel || 1, vaga, arte: arteDoIndividuo(x), bonus: bonusDoMembro(x) }));
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

  // ---------- Revanche e Criação de Chefes (#59 + kit visual #63) ----------
  function abaChefes() {
    let h = '<div class="bl mv1-chefes-topo"><h4>👑 Revanche e Criação de Chefes</h4><p class="mut">Derrote um chefe na Campanha para liberar sua Revanche. Cada chefe tem recarga real de <b>10 minutos</b> (velocidade ×2/×3 não acelera). Junte <b>10 fragmentos</b> do mesmo chefe para criá-lo na sua coleção.</p></div>';
    for (const [bossId, def] of Object.entries(CHEFES_REVANCHE_CATALOGO)) {
      const st = statusRevancheChefe(save(), bossId);
      const prev = previsaoCraftChefe(save(), bossId);
      const infoBoss = BOSSES_REGIAO1[bossId];
      const dropsTxt = (def.dropsExclusivos || []).map((d) => `${esc(d.nome)} (${Math.round(d.chance * 100)}%)`).join(', ');
      const statusTxt = !st.liberadoCampanha
        ? `<span class="ruim"><img class="exp-ico" src="${MV1('comum/icone-cadeado.png')}" alt="">Derrote na Campanha primeiro</span>`
        : st.batalhaConcorrente
          ? '<span class="mut">⚔️ Revanche em andamento</span>'
          : st.emCooldown
            ? `<span class="mut"><img class="exp-ico" src="${MV1('comum/icone-tempo.png')}" alt="">Recarga real: ${dur(st.restanteMs)}</span>`
            : `<span class="ok"><img class="exp-ico" src="${MV1('comum/icone-resgatado.png')}" alt="">Pronto para Revanche</span>`;
      h += `<div class="bl"><div class="ficha-on">
        <img src="${IMG(def.arte)}" alt="${esc(def.nome)}">
        <div>
          <h4>${esc(def.nome)} · Nv.${infoBoss?.nivel || 12} · ${esc(def.elemento)}</h4>
          <p>${statusTxt} · <img class="exp-ico" src="${MV1('chefes/fragmento.png')}" alt="">Fragmentos: <b>${st.saldoFragmentos}/${st.custoCraft}</b></p>
          <p class="mut">Vitória garante +${def.fragmentosGarantidos || 1} fragmento · Drops exclusivos: ${dropsTxt || 'nenhum'}</p>
          <div class="mv1-receita">
            <p class="mut" style="margin:0">${esc(prev.avisoRegra)}</p>
          </div>
          <div class="ln">
            <button class="btn-pri" data-rev-lutar="${bossId}" ${st.podeIniciar ? '' : 'disabled'}>⚔️ Revanche</button>
            <button class="btn-sec" data-rev-craft="${bossId}" ${prev.podeCraftar ? '' : 'disabled'}>🔨 Criar Chefe (${st.saldoFragmentos}/${prev.custoFragmentos})</button>
          </div>
        </div>
      </div></div>`;
    }
    return h;
  }
  function iniciarRevancheBatalha(bossId) {
    const r = iniciarRevancheChefe(save(), bossId);
    if (!r.ok) { mostrarToast(r.motivo, 2800); render(); return; }
    salvar();
    const idle = save().idle;
    const eq = R.membrosFormacao(idle).map(({ m: x, vaga }) => ({ especie: x.especie, nivel: x.nivel || 1, vaga, arte: x.arte || arteDoIndividuo(x), bonus: bonusCombateMembro(x) }));
    const nivelChefe = BOSSES_REGIAO1[bossId]?.nivel || 12;
    const inimigos = [
      [r.chefe.nome, nivelChefe, r.chefe.elemento, { chefe: true, nome: r.chefe.nome }],
      ...(r.reforcos || []).map((rf) => [rf.especie, rf.nivel, rf.elemento, { forma: rf.forma, arte: rf.arteForma }]), // forma do catálogo
    ];
    const artes = { [r.chefe.nome]: r.chefe.arte };
    fecharModal('modal-exp');
    tela.abrir({
      titulo: `Revanche · ${r.chefe.nome}`,
      sub: 'Recarga real de 10 min · Drop de Fragmentos de Chefe',
      arena: 'assets/confusion/interface/estrategia/reinos/01/arena-chefe.webp',
      aliados: eq,
      inimigos,
      artes,
      onFim: (venceu) => {
        const res = concluirRevancheChefe(save(), { batalhaId: r.batalha.batalhaId, vitoria: venceu });
        ganharXpPasse(save(), venceu ? 'batalhaChefe' : 'derrota');
        salvar();
        abrirModal('modal-exp');
        if (venceu && res.ok) {
          const drops = (res.drops || []).map((dr) => `+${dr.qtd} ${dr.nome}`).join(', ');
          mostrarToast(`👑 Revanche vencida! +${res.fragmentosGanhos} fragmento (${res.saldoFragmentos}/${previsaoCraftChefe(save(), bossId).custoFragmentos})${drops ? ` · ${drops}` : ''}. Recarga: 10 min.`, 4200);
        } else {
          mostrarToast('Derrota na revanche. Recarga de 10 min iniciada.', 3000);
        }
        render();
      },
    });
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
    const eq = R.membrosFormacao(idle).map(({ m: x, vaga }) => ({ especie: x.especie, nivel: x.nivel || 1, vaga, arte: arteDoIndividuo(x), bonus: bonusDoMembro(x) }));
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
  function render(zerarScroll = false) {
    if (!painel) return; const P = PAINEIS[painel];
    const ehCena = painel === 'descanso' || painel === 'oniricos';
    const card = $('.exp-card');
    if (card) {
      card.classList.toggle('modo-cena', ehCena);
      card.classList.toggle('modo-refugio', painel === 'descanso');
    }
    $('#exp-titulo').textContent = P.titulo;
    const enEl = $('#exp-energia');
    if (enEl) {
      enEl.hidden = !P.mostraEnergia;
      if (P.mostraEnergia) enEl.innerHTML = energiaTextoHtml(save());
    }
    $('#exp-abas').innerHTML = P.abas.length > 1 ? P.abas.map((a, i) => `<button class="btn-sec" role="tab" aria-selected="${i === aba}" data-aba="${i}">${esc(a)}</button>`).join('') : '';
    const tid = tutDaAba(painel, aba); const vis = tid && TUTS[tid];
    $('#exp-rever').hidden = ehCena || !(vis && exp().tut[tid] && revendo !== tid); $('#exp-rever').dataset.tut = tid || '';
    let h = tid ? cartaoTut(tid) : '';
    if (painel === 'descanso') h += abaDescanso();
    if (painel === 'missoes') h += renderBalaoTutorialModo(save(), 'missoes') + renderizarPainelMissoes(save(), aba, { capParalela });
    if (painel === 'campanhaMini') h += `${renderBalaoTutorialModo(save(), 'campanha_mini')}<div class="bl"><h4>🗺️ Campanha Mini (12 Capítulos)</h4><p>10 fases por capítulo + fase escondida ao chegar a 30★. Energia: <b>6</b> (normal), <b>8</b> (elite) e <b>10</b> (chefe).</p><div class="ln"><button class="btn-pri" data-desc-ir="descanso">← Voltar ao Refúgio</button></div></div>`;
    if (painel === 'torres') h += renderBalaoTutorialModo(save(), 'torres') + renderizarPainelTorres(save(), aba, torresUi);
    if (painel === 'calaboucos') h += renderBalaoTutorialModo(save(), 'calaboucos_rel') + renderizarPainelCalaboucos(save(), calaboucosUi);
    if (painel === 'reliquias') h += renderBalaoTutorialModo(save(), 'reliquias') + renderizarPainelReliquias(save(), aba, reliquiasUi);
    if (painel === 'equipe') h += aba === 1 ? (renderBalaoTutorialModo(save(), 'domadores') + renderizarPainelDomadores(save())) : (resumoDomadorAtivoHtml(save()) + abaEquipe());
    if (painel === 'oniricos') h += abaBanner();
    if (painel === 'cacadas') h += [abaCacadas, abaCalabouco, abaChefes][aba]();
    if (painel === 'guilda') h += [abaContratos, abaFazenda, abaOficina, abaReinosGuilda][aba]();
    if (painel === 'cronicas') h += aba === 0 ? abaCrise() : abaHV();
    $('#exp-corpo').innerHTML = h;
    const btnVoltarRef = modal.querySelector('.btn-voltar-refugio');
    if (btnVoltarRef) btnVoltarRef.hidden = (painel === 'descanso');
    if (zerarScroll) $('#exp-corpo').scrollTop = 0;
    destacar(tid);
  }
  let origemPainelExp = 'campanha';
  function abaCrise() { const c = R.criseDe(save()); return `<div class="bl"><h4>🧟 ${esc(CRISE.cidade)}: ${esc(CRISE.nomes[c.estado])}</h4><p>Uma crise completa numa só cidade: saudável → contaminada → tomada → purificada → reconstruída. As mudanças aparecem no mapa, com zumbis nas ruas durante o surto. Estado próprio: não altera a Campanha nem os Reinos.</p><div class="ln"><button class="btn-pri" data-crise-abrir="1">Visitar a cidade</button></div></div>`; }
  function abrir(p, a = 0, origem = 'campanha') {
    if (batalhaBloqueando() || tela.aberta()) return;
    if (p === 'campanhaMini' && window.regiaoCampanhaMini?.abrir) {
      window.regiaoCampanhaMini.abrir();
      return;
    }
    origemPainelExp = p === 'descanso' ? 'campanha' : origem;
    painel = p; aba = a; revendo = null; hvEstado = null; fichaUid = null; selEq = null; descPop = null; verCapaInv = false;
    render(true);
    abrirModal('modal-exp');
  }

  modal.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return; const d = t.dataset;
    if (d.usarEnergia) {
      const r = usarPocaoEnergia(save(), 1, Date.now());
      mostrarToast(r.ok ? `⚡ +${r.ganho} de energia (${r.atual}/${r.max}).` : r.motivo, 2600);
      if (r.ok) salvar();
      render();
      return;
    }
    const aliadosAtuais = () => R.membrosFormacao(save().idle).map(({ m: x, vaga }) => ({
      especie: x.especie, nivel: x.nivel || 1, vaga, arte: x.arte || arteDoIndividuo(x), bonus: bonusCombateMembro(x),
    }));
    if (tratarCliqueMissoes(d, {
      save: save(), salvar, mostrarToast, render, tela, batalhaBloqueando,
      aliadosDoSave: aliadosAtuais,
      setCapParalela: (n) => { capParalela = n; },
      capParalela,
    })) return;
    if (tratarCliqueTorres(d, {
      save: save(), salvar, mostrarToast, render, tela, batalhaBloqueando,
      aliadosDoSave: aliadosAtuais, st: torresUi,
    })) return;
    if (tratarCliqueCalaboucos(d, {
      save: save(), salvar, mostrarToast, render, tela, batalhaBloqueando,
      aliadosDoSave: aliadosAtuais, st: calaboucosUi,
    })) return;
    if (tratarCliqueReliquias(d, {
      save: save(), salvar, mostrarToast, render, st: reliquiasUi,
    })) return;
    if (tratarCliqueDomadores(d, {
      save: save(), salvar, mostrarToast, render,
    })) return;
    if (t.id === 'exp-fechar') {
      if (painel !== 'descanso' && origemPainelExp === 'descanso') {
        painel = 'descanso'; aba = 0; fichaUid = null; selEq = null; descPop = null; verCapaInv = false;
        render(true);
        return;
      }
      fecharModal('modal-exp'); painel = null; fichaUid = null; selEq = null; descPop = null; return;
    }
    if (t.id === 'exp-rever') { revendo = d.tut; render(true); return; }
    if (d.tutok) { exp().tut[d.tutok] = true; revendo = null; salvar(); render(); return; }
    if (tratarCliqueTutorialModo(d, { save: save(), salvar, aoFechar: () => render() })) return;
    if (d.aba !== undefined) { aba = Number(d.aba); revendo = null; hvEstado = null; render(true); return; }
    if (d.descPop !== undefined) { descPop = d.descPop || null; render(); return; }
    if (d.invCapa !== undefined) { verCapaInv = !verCapaInv; render(); return; }
    if (d.descFicha) { origemPainelExp = 'descanso'; painel = 'equipe'; aba = 0; fichaUid = d.descFicha; selEq = null; descPop = null; render(true); return; }
    if (d.descIr) {
      const dest = d.descIr;
      descPop = null;
      if (dest === 'campanha') { fecharModal('modal-exp'); painel = null; return; }
      if (dest === 'idle') {
        fecharModal('modal-exp'); painel = null;
        if (!save().idle?.autoCaca?.ativo) window.regiao1?.definirAutoCaca?.(true);
        else window.regiao1?.idleUI?.abrirConfigAutoCaca?.();
        return;
      }
      // Menus abertos a partir do Refúgio abrem SOBRE o Refúgio e, ao fechar, voltam ao Refúgio (nunca caem na Campanha)
      render();
      if (dest === 'mochila') { window.regiao1?.idleUI?.abrirMochila?.('domador'); return; }
      if (dest === 'passe') { window.regiao1?.idleUI?.abrirTemporada?.(); return; }
      if (dest === 'codex') { window.regiao1?.idleUI?.abrirCodex?.(); return; }
      if (dest === 'atlas') { window.regiao1?.idleUI?.abrirAtlas?.(); return; }
      if (dest === 'regioes') { window.regiaoRegioes?.abrir?.(); return; }
      if (dest === 'config') { window.regiao1?.idleUI?.abrirConfig?.(); return; }
      if (dest === 'menu') { window.regiao1?.idleUI?.abrirMenu?.(); return; }
      if (dest === 'eventos') {
        if (window.regiaoHW?.liberado?.()) window.regiaoHW.abrir(0);
        else window.regiao1?.idleUI?.abrirTemporada?.();
        return;
      }
      if (dest === 'loja') {
        if (window.regiaoHW?.liberado?.()) window.regiaoHW.abrir(3);
        else document.getElementById('m-voto')?.click();
        return;
      }
      if (dest === 'halloween') { window.regiaoHW?.abrir?.(0); return; }
      if (dest === 'torre') { window.regiaoHW?.abrir?.(2); return; }
      if (dest === 'calabouco') { origemPainelExp = 'descanso'; painel = 'cacadas'; aba = 1; fichaUid = null; selEq = null; render(true); return; }
      if (dest === 'reinos') { window.regiaoReinos?.abrirSeletor?.(); return; }
      if (dest === 'campanhaMini' && window.regiaoCampanhaMini?.abrir) {
        fecharModal('modal-exp');
        window.regiaoCampanhaMini.abrir();
        return;
      }
      if (PAINEIS[dest]) {
        if (painel === 'descanso' && dest !== 'descanso') origemPainelExp = 'descanso';
        painel = dest; aba = 0; fichaUid = null; selEq = null; verCapaInv = false; render(true); return;
      }
    }
    if (d.invocar) {
      const qtd = Number(d.invocar) === 10 ? 10 : 1;
      const r = R.invocarMultiplo(save(), qtd);
      if (r.ok) {
        ultimasInvocacoes = r.resultados;
        salvar();
        const cartas = r.resultados.map((c) => ({ especie: c.especie, tier: MOLDURAS_BANNER[c.raridade] || c.tier || 1, arte: ARTE_DA_ESPECIE[c.especie] || '', elemento: c.elemento }));
        revelarInvocacao({ titulo: 'Banner de Oníricos', cartas }).then(() => render());
      } else {
        mostrarToast(r.motivo, 2800);
      }
      render(); return;
    }
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
    if (d.entrar) { entrarCacada(d.entrar); return; }
    if (d.revLutar) { iniciarRevancheBatalha(d.revLutar); return; }
    if (d.revCraft) {
      const r = craftarChefe(save(), d.revCraft);
      if (r.ok) {
        salvar();
        mostrarToast(`👑 ${r.unidade.especie} criado! ${r.avisoRegra}`, 4200);
      } else {
        mostrarToast(r.motivo, 2800);
      }
      render(); return;
    }
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
    if (d.coletar) { processar(false); const r = coletarTudo(fab(), FAB); if (Object.keys(r.recebido).length) ganharXpPasse(save(), 'coleta'); const f = (o) => Object.entries(o).map(([k, v]) => `${v} ${FAB.materiais[k].nome}`).join(' · '); resumoUlt = { t: 'Coleta', p: [Object.keys(r.recebido).length ? `recebido ${f(r.recebido)}` : 'nada pronto', ...(Object.keys(r.pendente).length ? [`pendente (estoque cheio): ${f(r.pendente)}`] : [])] }; salvar(); render(); return; }
    if (d.melhorar) { processar(false); const r = enfileirarObras(fab(), FAB, [d.melhorar]); resumoUlt = { t: 'Melhoria', p: r.entraram.length ? ['obra iniciada'] : r.pendentes.map((p) => `${p.motivo}${p.falta ? ' ' + Object.entries(p.falta).map(([k, v]) => `${v} ${k}`).join(' ') : ''}`) }; salvar(); render(); return; }
    if (d.rec) { loteRec = d.rec; render(); return; }
    if (d.qtd) { loteQtd = Math.max(1, Math.min(30, loteQtd + Number(d.qtd))); render(); return; }
    if (d.fabricar || d.repetir) { processar(false); const r = d.repetir ? repetirUltimoLote(fab(), FAB) : fabricarLote(fab(), FAB, loteRec, loteQtd); if (r.ok) ganharXpPasse(save(), 'fabricacao'); resumoUlt = r.ok ? { t: 'Fabricação', p: [`lote na fila: ${Object.entries(r.previsao.saida).map(([k, v]) => `${v} ${FAB.gestao.itens[k].nome}`).join(', ')} (usou ${Object.entries(r.previsao.insumos).map(([k, v]) => `${v} ${FAB.materiais[k].nome}`).join(', ')})`] } : { t: 'Fabricação', p: [r.motivo] }; salvar(); render(); return; }
    if (d.reinos) { fecharModal('modal-exp'); window.regiaoReinos?.abrirSeletor(); return; }
    if (d.criseAbrir) { fecharModal('modal-exp'); desenharCrise(); return; }
    if (d.cap) { cap = d.cap; render(true); return; }
    if (d.missao) { const m = R.missaoResolvida(save(), cap, Number(d.missao)); hvEstado = { n: Number(d.missao), fase: 'dialogo', i: 0 }; void m; render(true); return; }
    if (d.hvProx) { const m = R.missaoResolvida(save(), cap, hvEstado.n); if (hvEstado.i + 1 < m.dialogo.length) hvEstado.i += 1; else hvEstado.fase = m.escolha && !R.hvDe(save(), cap).escolha ? 'escolha' : 'pronta'; render(); return; }
    if (d.hvEscolha) { R.escolherHV(save(), cap, hvEstado.n, d.hvEscolha); hvEstado.fase = 'pronta'; salvar(); render(); return; }
    if (d.hvSair) { hvEstado = null; render(true); return; }
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
  // Na Campanha, a barra inferior mostra somente os menus compartilhados (Equipe, Mochila, Missões, Config) + botão Refúgio.
  // Invocação, Batalhas (Torre/Caçadas/Revanches/Calabouço/HV), Halloween/Eventos, Passe, Guilda e Crônicas ficam no Refúgio.
  const BARRA_CAMPANHA = [
    { id: 'descanso', rotulo: '🏕️ Refúgio' },
    { id: 'equipe', rotulo: '⚔️ Equipe' },
    { id: 'mochila', rotulo: '🎒 Mochila' },
    { id: 'missoes', rotulo: '📜 Missões' },
    { id: 'config', rotulo: '⚙️ Config' },
  ];
  const MODOS = { descanso: 'descanso', equipe: 'equipe', oniricos: 'banner', cacadas: 'cacadas', guilda: 'guilda', reinos: 'reinos', cronicas: 'cronicas' };
  function atualizarNav() {
    const e = exp(); const id = getMapaId();
    if (id === 'C1') e.visitouCidade = true;
    if (R.concederTickets(save()) > 0) salvar();
    sair.style.display = id?.startsWith('CAC_') ? 'block' : 'none';
    e.avisados = e.avisados || {};
    nav.style.display = 'flex';
    nav.innerHTML = BARRA_CAMPANHA.map((b) => `<button class="btn-hud" data-nav="${b.id}">${b.rotulo}</button>`).join('');
  }
  nav.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return; const k = b.dataset.nav;
    if (k === 'descanso') { exp().avisados.descanso = true; salvar(); abrir('descanso', 0, 'campanha'); return; }
    if (k === 'equipe') { exp().avisados.equipe = true; salvar(); abrir('equipe', 0, 'campanha'); return; }
    if (k === 'mochila') { window.regiao1?.idleUI?.abrirMochila?.('domador'); return; }
    if (k === 'missoes') { window.regiao1?.idleUI?.abrirDiario?.(); return; }
    if (k === 'config') { window.regiao1?.idleUI?.abrirConfig?.(); return; }
  });
  let jaAvisou = {};
  setInterval(() => {
    processar(true); atualizarNav();
    if (!livre()) return; const e = exp();
    const novo = Object.entries(MODOS).find(([k, m]) => R.aberto(save(), m) && !e.avisados[k] && !jaAvisou[k]);
    if (novo) { jaAvisou[novo[0]] = true; const msg = { oniricos: '🎫 Primeiro ticket! Visite o Refúgio para invocar.', cacadas: '🏹 Nova Caçada liberada no Refúgio!', guilda: '🏛️ A Guilda dos Aventureiros abriu no Refúgio.', reinos: '👑 Reinos liberados.', cronicas: '📜 Crônicas liberadas no Refúgio.' }[novo[0]]; if (msg) mostrarToast(msg, 3600); }
  }, 1500);
  processar(false); atualizarNav();

  return { abrir, aoAbater, entrarCacada, sairCacada, desenharCrise, tela, estado: exp, fab, processar, atualizarNav, abrirCrise: desenharCrise, sair };
}
