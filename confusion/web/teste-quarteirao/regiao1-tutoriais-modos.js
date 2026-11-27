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
    texto: 'Suba andares para farmar Essências do par elemental (1ª vitória grátis em energia) e Pó Único nas Torres Únicas.',
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
    texto: 'Cada Onírico equipa até 6 peças do mesmo elemento. Combine 2 ou 4 peças do mesmo conjunto para ativar bônus extras.',
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
    texto: 'Seu Domador de apoio acompanha os 4 Oníricos sem ocupar vaga, aplica passiva ao time e age com 3 habilidades ao encher a barra.',
  },
};

export const IDS_TUTORIAIS_MODOS = Object.keys(TUTORIAIS_MODOS);

const CSS_BALAO = `
.cw-tut-balao{position:relative;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 11px;margin:0 0 8px;border-radius:11px;background:linear-gradient(135deg,rgba(30,58,108,.94),rgba(17,29,56,.96));border:1.5px solid #38bdf8;box-shadow:0 6px 18px rgba(0,0,0,.35);color:#e2e8f0;font-size:12px;line-height:1.35}
.cw-tut-balao::before{content:'';position:absolute;top:-6px;left:18px;width:10px;height:10px;background:#1a3360;border-left:1.5px solid #38bdf8;border-top:1.5px solid #38bdf8;transform:rotate(45deg)}
.cw-tut-balao-txt{flex:1;min-width:0}
.cw-tut-balao-tit{display:flex;align-items:center;gap:5px;font-weight:800;color:#fde68a;font-size:12px;margin-bottom:2px}
.cw-tut-balao-btn{flex:0 0 auto;background:linear-gradient(135deg,#0284c7,#2563eb);border:1px solid #7dd3fc;color:#fff;border-radius:8px;padding:5px 10px;font-size:11.5px;font-weight:700;cursor:pointer;white-space:nowrap}
@media (max-height:430px){
  .cw-tut-balao{padding:6px 9px;margin:0 0 6px;font-size:11px;gap:8px}
  .cw-tut-balao-tit{font-size:11px;margin-bottom:1px}
  .cw-tut-balao-btn{padding:4px 8px;font-size:10.5px}
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

export function tratarCliqueTutorialModo(dataset, { save, salvar, aoFechar }) {
  const id = dataset?.tutModoOk;
  if (!id || !TUTORIAIS_MODOS[id]) return false;
  marcarTutorialModoVisto(save, id);
  salvar?.();
  aoFechar?.(id);
  return true;
}
