// Tutoriais curtos em balão compacto, exibidos uma única vez por conta na primeira entrada de cada modo:
// Campanha Mini, Missões, Torres, Calabouços, Relíquias, Evolução com Essências e Domadores.
// Persistência em save.idle.exp.tut (já preservado no save local e na nuvem).

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const TUTORIAIS_MODOS = {
  campanha_mini: {
    id: 'campanha_mini',
    icone: '🗺️',
    titulo: 'Campanha Mini',
    texto: '12 capítulos com 10 fases cada. Conquiste 3★ para abrir baús, liberar a Batalha Rápida e revelar a fase escondida (30★).',
  },
  missoes: {
    id: 'missoes',
    icone: '📜',
    titulo: 'Missões',
    texto: 'Conclua Marcos permanentes e missões Paralelas para resgatar ouro, diamantes, poções e Essências. Cada marco paga uma vez.',
  },
  torres: {
    id: 'torres',
    icone: '🗼',
    titulo: 'Torres Elementais & Únicas',
    texto: 'Suba andares para farmar Essências do par elemental (recompensa especial na 1ª vitória de cada andar) e Pó Único nas Torres Únicas.',
  },
  calaboucos_rel: {
    id: 'calaboucos_rel',
    icone: '🏰',
    titulo: 'Calabouços de Relíquias',
    texto: 'Derrote o chefe para dropar Relíquias de dois elementos e moedas da loja. Vencer com todos vivos libera a Batalha Rápida.',
  },
  reliquias: {
    id: 'reliquias',
    icone: '💎',
    titulo: 'Relíquias & Conjuntos',
    texto: 'Cada Onírico equipa 4 Relíquias (Coroa, Amuleto, Anel e Talismã) + 1 Arma Única do mesmo elemento. Combine 2 ou 4 peças do mesmo conjunto para ativar bônus extras.',
  },
  evolucao_essencias: {
    id: 'evolucao_essencias',
    icone: '✨',
    titulo: 'Evolução com Essências',
    texto: 'Para evoluir de forma, reúna Fragmentos de Sonho e as Essências do elemento exigidas (obtidas nas Torres Elementais).',
  },
  domadores: {
    id: 'domadores',
    icone: '🛡️',
    titulo: 'Domadores Auxiliares',
    texto: 'Seu Domador de apoio acompanha os 4 Oníricos sem ocupar vaga, nunca recebe dano e age automaticamente sempre que uma de suas habilidades sai de recarga.',
  },
  ondas: {
    id: 'ondas',
    icone: '🌊',
    titulo: 'Batalhas em Ondas',
    texto: 'Fases de Campanha Mini têm 2 a 3 ondas seguidas (ex.: Onda 1/3 → 3/3). Ao vencer uma onda, o time avança mantendo a vida e a vitória só conta ao derrotar a onda final.',
  },
  domador_batalha: {
    id: 'domador_batalha',
    icone: '⚔️',
    titulo: 'Domador na Arena',
    texto: 'O Domador entra com recargas próprias (sem barra), não sofre ataques e dispara sua habilidade pronta automaticamente no turno.',
  },
};

export const IDS_TUTORIAIS_MODOS = Object.keys(TUTORIAIS_MODOS);

const CSS_BALAO = `
.cw-tut-balao{position:relative;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 11px;margin:0 0 8px;border-radius:11px;background:linear-gradient(135deg,rgba(30,58,108,.94),rgba(17,29,56,.96));border:1.5px solid #38bdf8;box-shadow:0 6px 18px rgba(0,0,0,.35);color:#e2e8f0;font-size:12px;line-height:1.35}
.cw-tut-balao::before{content:'';position:absolute;top:-6px;left:18px;width:10px;height:10px;background:#1a3360;border-left:1.5px solid #38bdf8;border-top:1.5px solid #38bdf8;transform:rotate(45deg)}
.cw-tut-balao-txt{flex:1;min-width:0}
.cw-tut-balao-tit{display:flex;align-items:center;gap:5px;font-weight:800;color:#fde68a;font-size:12px;margin-bottom:2px}
.cw-tut-balao-btn{flex:0 0 auto;background:linear-gradient(135deg,#0284c7,#2563eb);border:1px solid #7dd3fc;color:#fff;border-radius:8px;padding:5px 10px;font-size:11.5px;font-weight:700;cursor:pointer;white-space:nowrap}
.cw-guia-novo{position:absolute;left:50%;top:102px;transform:translateX(-50%);z-index:4;display:flex;align-items:center;gap:8px;max-width:min(440px,calc(100% - 290px));padding:6px 10px;border-radius:12px;background:rgba(12,24,48,.9);border:1.5px solid #facc15;box-shadow:0 6px 18px rgba(0,0,0,.45);color:#f1f5f9;font-size:11.5px;line-height:1.3;backdrop-filter:blur(4px)}
.cw-guia-novo-txt{flex:1;min-width:0}
.cw-guia-novo-tit{font-weight:800;color:#fde047;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cw-guia-novo-desc{opacity:.92;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cw-guia-novo-ir{flex:0 0 auto;background:linear-gradient(135deg,#eab308,#f59e0b);border:1px solid #fef08a;color:#1c1205;border-radius:8px;padding:4px 9px;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap}
.cw-guia-novo-x{flex:0 0 auto;background:transparent;border:1px solid rgba(148,163,184,.45);color:#cbd5e1;border-radius:7px;padding:3px 6px;font-size:10.5px;cursor:pointer;line-height:1}
@media (max-height:430px){
  .cw-tut-balao{padding:6px 9px;margin:0 0 6px;font-size:11px;gap:8px}
  .cw-tut-balao-tit{font-size:11px;margin-bottom:1px}
  .cw-tut-balao-btn{padding:4px 8px;font-size:10.5px}
  .cw-guia-novo{top:56px;max-width:min(360px,calc(100% - 260px));padding:4px 8px;gap:6px;font-size:10.5px}
  .cw-guia-novo-tit{font-size:10px}
  .cw-guia-novo-ir{padding:3px 7px;font-size:10px}
}
`;

export function garantirEstiloBalaoTutorial() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('cw-tut-balao-style')) return;
  const s = document.createElement('style');
  s.id = 'cw-tut-balao-style';
  s.textContent = CSS_BALAO;
  document.head.appendChild(s);
}

export function mapaTutoriaisDe(save) {
  if (!save || typeof save !== 'object') return {};
  const idle = save.idle || (save.idle = {});
  const exp = idle.exp || (idle.exp = {});
  if (!exp.tut || typeof exp.tut !== 'object' || Array.isArray(exp.tut)) exp.tut = {};
  return exp.tut;
}

export function tutorialModoVisto(save, modoId) {
  if (!TUTORIAIS_MODOS[modoId]) return true;
  return Boolean(save?.idle?.exp?.tut?.[modoId]);
}

export function marcarTutorialModoVisto(save, modoId) {
  if (!TUTORIAIS_MODOS[modoId]) return false;
  const tut = mapaTutoriaisDe(save);
  if (tut[modoId]) return false;
  tut[modoId] = true;
  return true;
}

export function renderBalaoTutorialModo(save, modoId) {
  const def = TUTORIAIS_MODOS[modoId];
  if (!def || tutorialModoVisto(save, modoId)) return '';
  garantirEstiloBalaoTutorial();
  return `<div class="cw-tut-balao" role="note" data-tut-modo="${esc(def.id)}">
    <div class="cw-tut-balao-txt">
      <div class="cw-tut-balao-tit"><span>${def.icone}</span><span>Dica · ${esc(def.titulo)}</span></div>
      <div>${esc(def.texto)}</div>
    </div>
    <button type="button" class="cw-tut-balao-btn" data-tut-modo-ok="${esc(def.id)}">Entendi ✓</button>
  </div>`;
}

// Trilha guiada passo a passo do jogador novo (sem repetir e sem cobrir botões):
// 1. Escolher inicial -> 2. 1ª batalha -> 3. Evoluir -> 4. Invocar
const FORMAS_BASE_INICIAIS = new Set(['Penumbrio', 'Brasinha', 'Gotalume', 'Sementil', 'Solinho']);

export const GUIA_JOGADOR_NOVO_PASSOS = [
  { id: 'inicial', num: 1, titulo: 'Escolher inicial', desc: 'Escolha seu primeiro Onírico.', acao: 'equipe', rotulo: 'Ver Equipe' },
  { id: 'batalha', num: 2, titulo: 'Vencer 1ª batalha', desc: 'Lute na Campanha ou Campanha Mini 1-1.', acao: 'campanhaMini', rotulo: 'Ir lutar →' },
  { id: 'evoluir', num: 3, titulo: 'Evoluir um Onírico', desc: 'Abra a Ficha na Equipe para evoluir.', acao: 'equipe', rotulo: 'Abrir Equipe →' },
  { id: 'invocar', num: 4, titulo: 'Fazer 1ª invocação', desc: 'Use tickets no Banner para recrutar.', acao: 'oniricos', rotulo: 'Invocar →' },
];

export function progressoGuiaJogadorNovo(save) {
  const tut = save?.idle?.exp?.tut || {};
  const dispensado = Boolean(tut.guia_novo_ok);
  const equipe = Array.isArray(save?.idle?.equipe) ? save.idle.equipe : [];
  const temInicial = equipe.length > 0;
  const cmFases = save?.idle?.campanhaMini?.fases || {};
  const venceuCm = Object.values(cmFases).some((f) => f && (f.vencida || (f.estrelas || 0) > 0));
  const venceuTorre = Object.values(save?.idle?.torres?.elementais || {}).some((v) => (typeof v === 'object' ? (v?.maiorAndar || 0) : (v || 0)) > 0);
  const venceuCal = Object.values(save?.idle?.calaboucos?.maiorNivel || {}).some((v) => (v || 0) > 0);
  const venceuCamp = (save?.idle?.estatisticas?.batalhasVencidas || 0) > 0 || (save?.recompensas?.xp || 0) > 0 || (save?.recompensas?.gold || 0) > 0;
  const fezBatalha = temInicial && (venceuCm || venceuTorre || venceuCal || venceuCamp);
  const evoluiu = equipe.some((m) => (m?.formaFase || 1) >= 2 || (m?.especie && !FORMAS_BASE_INICIAIS.has(m.especie) && m.origem !== 'banner'));
  const invocou = (save?.idle?.exp?.pulls || 0) > 0;

  const feitos = { inicial: temInicial, batalha: fezBatalha, evoluir: evoluiu, invocar: invocou };
  const concluido = temInicial && fezBatalha && evoluiu && invocou;
  const atual = GUIA_JOGADOR_NOVO_PASSOS.find((p) => !feitos[p.id]) || null;
  const qtdFeitos = Object.values(feitos).filter(Boolean).length;

  return {
    dispensado,
    concluido,
    ativo: !dispensado && !concluido && Boolean(atual),
    atual,
    feitos,
    qtdFeitos,
    total: GUIA_JOGADOR_NOVO_PASSOS.length,
  };
}

export function dispensarGuiaJogadorNovo(save) {
  const tut = mapaTutoriaisDe(save);
  if (tut.guia_novo_ok) return false;
  tut.guia_novo_ok = true;
  return true;
}

export function renderGuiaJogadorNovo(save) {
  const st = progressoGuiaJogadorNovo(save);
  if (!st.ativo || !st.atual) return '';
  garantirEstiloBalaoTutorial();
  const p = st.atual;
  return `<div class="cw-guia-novo" role="status" data-guia-novo="${esc(p.id)}">
    <div class="cw-guia-novo-txt">
      <div class="cw-guia-novo-tit">🧭 Guia ${p.num}/${st.total} · ${esc(p.titulo)}</div>
      <div class="cw-guia-novo-desc">${esc(p.desc)}</div>
    </div>
    <button type="button" class="cw-guia-novo-ir" data-desc-ir="${esc(p.acao)}">${esc(p.rotulo)}</button>
    <button type="button" class="cw-guia-novo-x" data-guia-novo-ok="1" title="Ocultar guia" aria-label="Ocultar guia">✕</button>
  </div>`;
}

export function tratarCliqueTutorialModo(dataset, { save, salvar, aoFechar }) {
  if (dataset?.guiaNovoOk) {
    dispensarGuiaJogadorNovo(save);
    salvar?.();
    aoFechar?.('guia_novo');
    return true;
  }
  const id = dataset?.tutModoOk;
  if (!id || !TUTORIAIS_MODOS[id]) return false;
  marcarTutorialModoVisto(save, id);
  salvar?.();
  aoFechar?.(id);
  return true;
}
