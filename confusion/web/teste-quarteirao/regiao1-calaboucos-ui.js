// Interface de Calabouços: 6 Calabouços × 13 níveis, chances de raridade, batalha rápida (todos vivos) e loja por moedas
import {
  CALABOUCOS_CFG,
  CALABOUCOS_CATALOGO,
  CALABOUCOS_POR_ID,
  calaboucosDe,
  nivelCalaboucoDesbloqueado,
  podeBatalhaRapidaCalabouco,
  iniciarCalaboucoNivel,
  concluirCalaboucoNivel,
  batalhaRapidaCalabouco,
  comprarReliquiaLojaCalabouco,
} from './regiao1-calaboucos-regras.js';
import { NOME_ELEMENTO } from '../core.js';
import { mostrarResultadoBatalha } from './regiao1-resultado-ui.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const ARENA_FALLBACK = 'assets/confusion/interface/estrategia/reinos/01/arena-chefe.webp';
const ELEMENTOS_18 = ['fogo', 'agua', 'planta', 'terra', 'luz', 'trevas', 'lutador', 'voador', 'veneno', 'psiquico', 'inseto', 'pedra', 'fantasma', 'eletrico', 'gelo', 'dragao', 'aco', 'fada'];
const icoEl = (el) => `../../../assets/confusion/interface/menus-v1/ficha/sonho-${el === 'sombra' ? 'trevas' : el}.png`;

function resumoPesos(pesos) {
  if (!pesos) return '';
  const entradas = Object.entries(pesos).filter(([, v]) => Number(v) > 0);
  const soma = entradas.reduce((acc, [, v]) => acc + Number(v), 0) || 1;
  return entradas
    .map(([k, v]) => `${k}: ${Math.round((Number(v) / soma) * 100)}%`)
    .join(' · ');
}

export function renderizarPainelCalaboucos(save, st) {
  const c = calaboucosDe(save);
  const elFiltro = st.elementoFiltro || 'todos';
  const catalogoFiltrado = elFiltro === 'todos'
    ? CALABOUCOS_CATALOGO
    : CALABOUCOS_CATALOGO.filter((x) => (x.elementos || []).includes(elFiltro));
  const calId = st.calId && CALABOUCOS_POR_ID[st.calId] ? st.calId : (catalogoFiltrado[0]?.id || CALABOUCOS_CATALOGO[0].id);
  const cal = CALABOUCOS_POR_ID[calId];
  const maior = Number(c.maiorNivel[cal.id]) || 0;
  const nvSel = Math.max(1, Math.min(CALABOUCOS_CFG.maxNiveis, st.nivel || Math.min(CALABOUCOS_CFG.maxNiveis, maior + 1)));
  const nvDef = cal.niveis[nvSel - 1];
  const desbl = nivelCalaboucoDesbloqueado(save, cal.id, nvSel);
  const rapidaOk = podeBatalhaRapidaCalabouco(save, cal.id, nvSel);

  const filtrosEl = `<button class="${elFiltro === 'todos' ? 'btn-pri' : 'btn-sec'}" data-cal-filtro-el="todos" style="padding:3px 7px;font-size:10.5px">Todos (${CALABOUCOS_CATALOGO.length})</button>`
    + ELEMENTOS_18.map((el) => {
      const tem = CALABOUCOS_CATALOGO.some((x) => (x.elementos || []).includes(el));
      return `<button class="${elFiltro === el ? 'btn-pri' : 'btn-sec'}" data-cal-filtro-el="${el}" style="padding:3px 6px;font-size:10.5px;display:inline-flex;align-items:center;gap:3px;${tem ? '' : 'opacity:.6'}" title="${esc(NOME_ELEMENTO[el] || el)}${tem ? '' : ' (catálogo em expansão)'}"><img src="${icoEl(el)}" alt="" style="width:13px;height:13px;object-fit:contain" onerror="this.style.display='none'">${esc(NOME_ELEMENTO[el] || el)}</button>`;
    }).join('');

  const seletores = catalogoFiltrado.length
    ? catalogoFiltrado.map((x) => {
      const m = Number(c.maiorNivel[x.id]) || 0;
      const els = x.elementos.map((e) => NOME_ELEMENTO[e] || e).join(' / ');
      return `<button class="${x.id === cal.id ? 'btn-pri' : 'btn-sec'}" data-cal-id="${esc(x.id)}" style="padding:5px 9px;font-size:11.5px">🏰 ${esc(x.nome)} <small>(${m}/${CALABOUCOS_CFG.maxNiveis})</small><br><span style="font-size:10px;opacity:.85">${esc(els)}</span></button>`;
    }).join('')
    : `<div class="mut" style="font-size:11.5px;padding:4px 0">Calabouço de <b>${esc(NOME_ELEMENTO[elFiltro] || elFiltro)}</b> preparado para o catálogo expandido de 18 elementos.</div>`;

  const niveisBtns = cal.niveis.map((n) => {
    const ok = nivelCalaboucoDesbloqueado(save, cal.id, n.nivel);
    const rap = podeBatalhaRapidaCalabouco(save, cal.id, n.nivel);
    return `<button class="${n.nivel === nvSel ? 'btn-pri' : 'btn-sec'}" data-cal-nv="${n.nivel}" style="padding:4px 8px;font-size:11px;${ok ? '' : 'opacity:.5'}">Nv.${n.nivel}${rap ? ' ⏩' : ok ? '' : ' 🔒'}</button>`;
  }).join('');

  const lojaBtns = cal.conjuntos.map((conj) => `<button class="btn-sec" data-cal-comprar="${esc(cal.id)}:${esc(conj)}" ${c.moedas >= CALABOUCOS_CFG.custoLojaReliquia ? '' : 'disabled'}>🏺 ${esc(conj)} (${CALABOUCOS_CFG.custoLojaReliquia} moedas)</button>`).join('');

  return `<div class="bl cal-lista">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
      <b>🏰 Calabouços de Relíquias (${CALABOUCOS_CATALOGO.length} × ${CALABOUCOS_CFG.maxNiveis} níveis · 18 elementos)</b>
      <span class="tag">🪙 Moedas de Calabouço: ${c.moedas}</span>
    </div>
    <div class="cal-filtros" style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:7px">${filtrosEl}</div>
    <div class="cal-seletores" style="display:flex;gap:6px;flex-wrap:wrap">${seletores}</div>
  </div>
  <div class="bl cal-detalhe">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
      <div>
        <h4 style="margin:0;color:#fde68a">${esc(cal.nome)} · Nível ${nvSel}/${CALABOUCOS_CFG.maxNiveis}</h4>
        <div class="mut" style="font-size:12px">Conjuntos: <b style="color:#fff3e7">${esc(cal.conjuntos.join(', '))}</b></div>
        <div style="font-size:11.5px;color:#fde68a;margin-top:4px">Chances de raridade: ${esc(resumoPesos(nvDef.pesosRaridade))}</div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn-sec" data-cal-rapida="${esc(cal.id)}:${nvSel}" ${rapidaOk ? '' : 'disabled'} title="${rapidaOk ? 'Concluir instantaneamente' : 'Vença este nível com todos vivos para liberar'}">⏩ Rápida</button>
        <button class="btn-pri" data-cal-lutar="${esc(cal.id)}:${nvSel}" ${desbl ? '' : 'disabled'}>⚔️ Lutar Nv.${nvSel}</button>
      </div>
    </div>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:8px">${niveisBtns}</div>
  </div>
  <div class="bl">
    <div style="font-size:12px;font-weight:700;margin-bottom:6px;color:#fff3e7">🛒 Loja do Calabouço · Trocar ${CALABOUCOS_CFG.custoLojaReliquia} moedas por Relíquia Rara/Épica</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">${lojaBtns}</div>
  </div>`;
}

export function tratarCliqueCalaboucos(d, { save, salvar, mostrarToast, render, tela, batalhaBloqueando, aliadosDoSave, st }) {
  if (d.calFiltroEl) {
    st.elementoFiltro = d.calFiltroEl;
    const match = d.calFiltroEl === 'todos' ? CALABOUCOS_CATALOGO[0] : CALABOUCOS_CATALOGO.find((x) => (x.elementos || []).includes(d.calFiltroEl));
    if (match) {
      st.calId = match.id;
      const m = Number(calaboucosDe(save).maiorNivel[match.id]) || 0;
      st.nivel = Math.min(CALABOUCOS_CFG.maxNiveis, m + 1);
    }
    render();
    return true;
  }
  if (d.calId) {
    st.calId = d.calId;
    const m = Number(calaboucosDe(save).maiorNivel[d.calId]) || 0;
    st.nivel = Math.min(CALABOUCOS_CFG.maxNiveis, m + 1);
    render(true);
    return true;
  }
  if (d.calNv) {
    st.nivel = Number(d.calNv);
    render(true);
    return true;
  }
  if (d.calComprar) {
    const [cid, conj] = d.calComprar.split(':');
    const r = comprarReliquiaLojaCalabouco(save, cid, conj);
    if (r.ok) {
      salvar();
      mostrarToast(`🏺 Relíquia ${r.reliquia.raridade} (${r.reliquia.conjunto}) obtida! Moedas: ${r.moedasRestantes}`);
      render();
    } else mostrarToast(r.motivo || 'Não foi possível comprar.');
    return true;
  }
  if (d.calRapida) {
    const [cid, nvStr] = d.calRapida.split(':');
    const nv = Number(nvStr);
    const cal = CALABOUCOS_POR_ID[cid];
    const r = batalhaRapidaCalabouco(save, cid, nv);
    if (r.ok) {
      salvar();
      render();
      mostrarResultadoBatalha({
        titulo: `⚡ ${cal?.nome || 'Calabouço'} · Nv.${nv}`,
        subtitulo: 'Batalha rápida concluída',
        venceu: true,
        rapida: true,
        save,
        premios: r.premios,
        podeRepetir: true,
        onRepetir: () => tratarCliqueCalaboucos({ calRapida: `${cid}:${nv}` }, { save, salvar, mostrarToast, render, tela, batalhaBloqueando, aliadosDoSave, st }),
        rotuloVoltar: '🏰 Voltar',
      });
    } else mostrarToast(r.motivo || 'Batalha rápida indisponível.');
    return true;
  }
  if (d.calLutar) {
    if (batalhaBloqueando?.()) { mostrarToast('Já existe uma batalha em andamento.'); return true; }
    const [cid, nvStr] = d.calLutar.split(':');
    const nv = Number(nvStr);
    const ini = iniciarCalaboucoNivel(save, cid, nv);
    if (!ini.ok) { mostrarToast(ini.motivo || 'Não foi possível iniciar o calabouço.'); render(); return true; }
    salvar();
    render();
    tela.abrir({
      titulo: `${ini.calabouco.nome} · Nv.${nv}`,
      sub: `Calabouço de Relíquias`,
      arena: ARENA_FALLBACK,
      aliados: aliadosDoSave(),
      inimigos: ini.nivel.inimigos,
      ritmo: 420,
      regiao: 1,
      save,
      onFim: (venceu, _f, _m, resumo) => {
        const res = concluirCalaboucoNivel(save, cid, nv, resumo || { venceu: Boolean(venceu), todosVivos: false }, { batalhaId: ini.batalhaId });
        salvar();
        if (res.venceu) st.nivel = Math.min(CALABOUCOS_CFG.maxNiveis, nv + 1);
        render();
        mostrarResultadoBatalha({
          titulo: res.venceu ? `🏆 ${ini.calabouco.nome} · Nv.${nv}` : `💀 Derrota no Nv.${nv}`,
          subtitulo: res.todosVivos ? 'Todos vivos · ⚡ Batalha Rápida liberada!' : 'Calabouço de Relíquias',
          venceu: Boolean(res.venceu),
          save,
          premios: res.premios,
          podeProxima: Boolean(res.venceu && nv < CALABOUCOS_CFG.maxNiveis),
          rotuloProxima: `Nível ${nv + 1} →`,
          onProxima: () => { st.nivel = nv + 1; render(); },
          podeRepetir: true,
          onRepetir: () => tratarCliqueCalaboucos({ calLutar: `${cid}:${nv}` }, { save, salvar, mostrarToast, render, tela, batalhaBloqueando, aliadosDoSave, st }),
          rotuloVoltar: '🏰 Voltar',
        });
      },
    });
    return true;
  }
  return false;
}
