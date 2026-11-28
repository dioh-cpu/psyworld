// Interface de Torres: 6 Torres Elementais (50 andares + treino diário 3×/dia) e 3 Torres Únicas (30 andares + Pó Único 5:1)
import {
  TORRES_CFG,
  TORRES_ELEMENTAIS_CATALOGO,
  TORRES_ELEMENTAIS_POR_ID,
  TORRES_UNICAS_CATALOGO,
  TORRES_UNICAS_POR_ID,
  torresDe,
  andarTorreElementalDesbloqueado,
  iniciarAndarTorreElemental,
  concluirAndarTorreElemental,
  usosRestantesTreinoTorre,
  concluirTreinoDiarioTorre,
  andarTorreUnicaDesbloqueado,
  podeFazerTorreUnicaHoje,
  iniciarAndarTorreUnica,
  concluirAndarTorreUnica,
  trocarPoUnicoPorFragmento,
  resgatarEscolhaFragmentoUnico,
  TORRES_SAZONAIS_CATALOGO,
  estadoTorreSazonal,
  iniciarAndarTorreSazonal,
  concluirAndarTorreSazonal,
} from './regiao1-torres-regras.js';
import { NOME_ELEMENTO } from '../core.js';
import { mostrarResultadoBatalha } from './regiao1-resultado-ui.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const ARENA_FALLBACK = 'assets/confusion/interface/estrategia/reinos/01/arena-chefe.webp';
const ELEMENTOS_18 = ['fogo', 'agua', 'planta', 'terra', 'luz', 'trevas', 'lutador', 'voador', 'veneno', 'psiquico', 'inseto', 'pedra', 'fantasma', 'eletrico', 'gelo', 'dragao', 'aco', 'fada'];
const icoEl = (el) => `../../../assets/confusion/interface/feedback-rodada/elementos-glamour/individuais/${el === 'sombra' ? 'trevas' : el}.png`;
const FACHADA_TORRE = (idx) => `../../../assets/confusion/interface/estrategia/reinos/${String(((idx % 12) + 1)).padStart(2, '0')}/cidade-conceito.webp`;

export function renderizarPainelTorres(save, aba, st) {
  const t = torresDe(save);
  const armas = save?.idle?.armasUnicas || { fragmentos: {}, poUnico: 0, escolhasPendentes: 0 };

  if (aba === 0) {
    const elFiltro = st.elementoFiltro || 'todos';
    const catalogoFiltrado = elFiltro === 'todos'
      ? TORRES_ELEMENTAIS_CATALOGO
      : TORRES_ELEMENTAIS_CATALOGO.filter((x) => (x.elementos || []).includes(elFiltro));
    const torreId = st.torreElId && TORRES_ELEMENTAIS_POR_ID[st.torreElId] ? st.torreElId : (catalogoFiltrado[0]?.id || TORRES_ELEMENTAIS_CATALOGO[0].id);
    const torre = TORRES_ELEMENTAIS_POR_ID[torreId];
    const torreIdx = Math.max(0, TORRES_ELEMENTAIS_CATALOGO.findIndex((x) => x.id === torre.id));
    const maior = Number(t.elementais[torre.id]?.maiorAndar) || 0;
    const pct = Math.min(100, Math.round((maior / Math.max(1, torre.totalAndares)) * 100));
    const proxAndar = Math.min(torre.totalAndares, maior + 1);
    const andarSel = Math.max(1, Math.min(torre.totalAndares, st.andarEl || proxAndar));
    const andarDef = torre.andares[andarSel - 1];
    const desbl = andarTorreElementalDesbloqueado(save, torre.id, andarSel);
    const pago = Boolean(t.elementais[torre.id]?.pagas?.[String(andarSel)]);
    const treinos = usosRestantesTreinoTorre(save);

    const filtrosEl = `<button class="${elFiltro === 'todos' ? 'btn-pri' : 'btn-sec'}" data-tor-filtro-el="todos" style="padding:3px 7px;font-size:10.5px">Todos (${TORRES_ELEMENTAIS_CATALOGO.length})</button>`
      + ELEMENTOS_18.map((el) => {
        const tem = TORRES_ELEMENTAIS_CATALOGO.some((x) => (x.elementos || []).includes(el));
        return `<button class="${elFiltro === el ? 'btn-pri' : 'btn-sec'}" data-tor-filtro-el="${el}" style="padding:3px 6px;font-size:10.5px;display:inline-flex;align-items:center;gap:3px;${tem ? '' : 'opacity:.65'}" title="${esc(NOME_ELEMENTO[el] || el)}"><img src="${icoEl(el)}" alt="" style="width:13px;height:13px;object-fit:contain" onerror="this.style.display='none'">${esc(NOME_ELEMENTO[el] || el)}</button>`;
      }).join('');

    const seletores = catalogoFiltrado.length
      ? catalogoFiltrado.map((x) => {
        const m = Number(t.elementais[x.id]?.maiorAndar) || 0;
        const pCard = Math.min(100, Math.round((m / Math.max(1, x.totalAndares)) * 100));
        const elsHtml = x.elementos.map((e) => `<span style="display:inline-flex;align-items:center;gap:2px"><img src="${icoEl(e)}" alt="" style="width:12px;height:12px;object-fit:contain" onerror="this.style.display='none'">${esc(NOME_ELEMENTO[e] || e)}</span>`).join(' · ');
        const ativo = x.id === torre.id;
        return `<button class="torre-card ${ativo ? 'btn-pri' : 'btn-sec'}" data-tor-el="${esc(x.id)}" data-torre="${esc(x.id)}" style="padding:7px 10px;font-size:11.5px;text-align:left;min-width:142px;flex:1 1 142px;display:flex;flex-direction:column;gap:3px;border:${ativo ? '2px solid #fde68a' : '1px solid rgba(243,194,122,.28)'};${ativo ? 'background:#2a1840;color:#fff3e7' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;width:100%"><b>🗼 ${esc(x.nome)}</b><small style="background:#160c24;color:#fff3e7;padding:1px 7px;border-radius:999px">${m}/${x.totalAndares}</small></div>
          <div style="font-size:10px;color:#d6dbe4;display:flex;gap:4px;flex-wrap:wrap">${elsHtml}</div>
          <div style="width:100%;height:5px;border-radius:999px;background:rgba(0,0,0,.45);overflow:hidden;margin-top:2px"><div style="width:${pCard}%;height:100%;background:linear-gradient(90deg,#f59e0b,#fde047)"></div></div>
        </button>`;
      }).join('')
      : `<div class="mut" style="font-size:11.5px;padding:4px 0">Nenhuma torre encontrada para este elemento.</div>`;

    const iniIdx = Math.max(1, andarSel - 4);
    const fimIdx = Math.min(torre.totalAndares, iniIdx + 9);
    const andaresBtns = [];
    for (let a = iniIdx; a <= fimIdx; a++) {
      const ok = andarTorreElementalDesbloqueado(save, torre.id, a);
      const venc = a <= maior;
      andaresBtns.push(`<button class="${a === andarSel ? 'btn-pri' : 'btn-sec'}" data-tor-andar-el="${a}" style="padding:4px 8px;font-size:11px;${ok ? '' : 'opacity:.5'}">${a % 10 === 0 ? '👑 ' : ''}${a}${venc ? ' ✓' : ok ? '' : ' 🔒'}</button>`);
    }

    const p1 = andarDef.recompensaPrimeiraVitoria;
    const elsBadges = torre.elementos.map((e) => `<span class="tag" style="display:inline-flex;align-items:center;gap:4px;background:rgba(12,8,24,.82);color:#fff3e7;border-color:rgba(243,194,122,.45)"><img src="${icoEl(e)}" alt="" style="width:14px;height:14px;object-fit:contain" onerror="this.style.display='none'">${esc(NOME_ELEMENTO[e] || e)}</span>`).join('');
    return `<div class="bl torres-lista">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
        <b style="color:#fde68a">🗼 Torres Elementais (${TORRES_ELEMENTAIS_CATALOGO.length} × 50 andares · 18 elementos)</b>
        <span class="tag">💠 Treino diário de Essência: ${treinos}/${TORRES_CFG.treinosDiariosMax}</span>
      </div>
      <div class="torre-filtros" style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:7px">${filtrosEl}</div>
      <div class="torre-seletores" style="display:flex;gap:6px;flex-wrap:wrap">${seletores}</div>
    </div>
    <div class="bl torres-detalhe" style="position:relative;overflow:hidden;background:linear-gradient(120deg,rgba(14,8,26,.92) 28%,rgba(14,8,26,.72) 100%),url('${FACHADA_TORRE(torreIdx)}') center / cover no-repeat;border:2px solid rgba(243,194,122,.45);padding:12px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap">
        <div style="flex:1;min-width:210px">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px">
            <h4 style="margin:0;font-size:15px;color:#fde68a;text-shadow:0 1px 3px rgba(0,0,0,.9)">🗼 ${esc(torre.nome)} · Andar ${andarSel}/${torre.totalAndares} ${andarDef.chefe ? '👑 Chefe' : ''}</h4>
            ${elsBadges}
          </div>
          <div style="font-size:12px;color:#fff3e7;text-shadow:0 1px 2px rgba(0,0,0,.85)">Nível recomendado: <b>${andarDef.nivel}</b> · Progresso da torre: <b>${maior}/${torre.totalAndares} (${pct}%)</b></div>
          <div style="width:100%;max-width:340px;height:7px;border-radius:999px;background:rgba(0,0,0,.55);border:1px solid rgba(243,194,122,.35);overflow:hidden;margin:6px 0">
            <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#d97706,#fde047)"></div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;font-size:11.5px">
            ${pago
              ? '<span class="tag" style="background:rgba(20,83,45,.75);color:#bbf7d0;border-color:#4ade80">✓ 1ª vitória coletada · Repetição: 🪙 100 ouro</span>'
              : `<span class="tag" style="background:rgba(120,53,15,.72);color:#fef08a;border-color:#fde047">🏆 1ª vitória: 💎 ${p1.diamantes} · 🪙 ${p1.ouro} · 💠 Essência ${esc(p1.essencia.tamanho)} ×${p1.essencia.qtd}</span>`}
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
          <button class="btn-sec" data-tor-treino="${esc(torre.id)}:${andarSel}" ${andarSel <= maior && treinos > 0 ? '' : 'disabled'} title="Custo: Grátis · Recompensa: Essência do elemento · Limite: ${treinos}/${TORRES_CFG.treinosDiariosMax} hoje">💠 Treino (Essência · Grátis · ${treinos}/${TORRES_CFG.treinosDiariosMax}/dia)</button>
          <button class="btn-pri" data-tor-lutar-el="${esc(torre.id)}:${andarSel}" ${desbl ? '' : 'disabled'}>⚔️ Lutar Andar ${andarSel}</button>
        </div>
      </div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:10px;align-items:center">
        <button class="btn-sec" data-tor-andar-el="${Math.max(1, andarSel - 10)}" style="padding:4px 7px;font-size:11px">« -10</button>
        ${andaresBtns.join('')}
        <button class="btn-sec" data-tor-andar-el="${Math.min(torre.totalAndares, andarSel + 10)}" style="padding:4px 7px;font-size:11px">+10 »</button>
      </div>
    </div>`;
  }

  // Aba 1: Torres Únicas + Torres Sazonais (Quinzenal e Mensal)
  const subTorre = st.subTorre || 'unicas';
  const subAbasHtml = `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
    <button class="${subTorre === 'unicas' ? 'btn-pri' : 'btn-sec'}" data-tor-sub="unicas" style="padding:5px 10px;font-size:11.5px">⚔️ Únicas</button>
    ${TORRES_SAZONAIS_CATALOGO.map((s) => `<button class="${subTorre === s.id ? 'btn-pri' : 'btn-sec'}" data-tor-sub="${esc(s.id)}" style="padding:5px 10px;font-size:11.5px">${s.id === 'quinzenal' ? '🗓️ Quinzenal' : '🌙 Mensal'}</button>`).join('')}
  </div>`;

  if (subTorre === 'quinzenal' || subTorre === 'mensal') {
    const est = estadoTorreSazonal(save, subTorre);
    const total = est.totalAndares || est.andares?.length || 1;
    const maiorSaz = Number(est.maiorAndar) || 0;
    const proxSaz = Math.min(total, maiorSaz + 1);
    const andarSaz = Math.max(1, Math.min(total, st.andarSaz || proxSaz));
    const andarDefSaz = est.andares?.[andarSaz - 1] || {};
    const desblSaz = andarSaz <= maiorSaz + 1;
    const dias = Math.floor((est.restanteMs || 0) / 86_400_000);
    const horas = Math.floor(((est.restanteMs || 0) % 86_400_000) / 3_600_000);
    const pctSaz = Math.min(100, Math.round((maiorSaz / Math.max(1, total)) * 100));
    const iniSaz = Math.max(1, andarSaz - 4);
    const fimSaz = Math.min(total, iniSaz + 9);
    const btnsSaz = [];
    for (let a = iniSaz; a <= fimSaz; a++) {
      const ok = a <= maiorSaz + 1;
      const venc = a <= maiorSaz;
      btnsSaz.push(`<button class="${a === andarSaz ? 'btn-pri' : 'btn-sec'}" data-tor-andar-saz="${a}" style="padding:4px 8px;font-size:11px;${ok ? '' : 'opacity:.5'}">${a % 10 === 0 ? '👑 ' : ''}${a}${venc ? ' ✓' : ok ? '' : ' 🔒'}</button>`);
    }
    return `${subAbasHtml}<div class="bl">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
        <b style="color:#fde68a">${est.id === 'quinzenal' ? '🗓️' : '🌙'} ${esc(est.nome)} · Ciclo #${est.ciclo}</b>
        <span class="tag">⏳ Tempo restante: ${dias}d ${horas}h</span>
      </div>
      <div style="font-size:12px;color:#fff3e7">Andar ${andarSaz}/${total} · Nível ${andarDefSaz.nivel || 1} · Progresso: <b>${maiorSaz}/${total} (${pctSaz}%)</b></div>
      <div style="width:100%;max-width:340px;height:7px;border-radius:999px;background:rgba(0,0,0,.55);border:1px solid rgba(243,194,122,.35);overflow:hidden;margin:6px 0">
        <div style="width:${pctSaz}%;height:100%;background:linear-gradient(90deg,#38bdf8,#fde047)"></div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:8px">
        <button class="btn-pri" data-tor-lutar-saz="${esc(est.id)}:${andarSaz}" ${desblSaz ? '' : 'disabled'}>${desblSaz ? `⚔️ Lutar Andar ${andarSaz}` : '🔒 Bloqueado'}</button>
      </div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:10px;align-items:center">
        <button class="btn-sec" data-tor-andar-saz="${Math.max(1, andarSaz - 10)}" style="padding:4px 7px;font-size:11px">« -10</button>
        ${btnsSaz.join('')}
        <button class="btn-sec" data-tor-andar-saz="${Math.min(total, andarSaz + 10)}" style="padding:4px 7px;font-size:11px">+10 »</button>
      </div>
    </div>`;
  }

  const torreId = st.torreUnId && TORRES_UNICAS_POR_ID[st.torreUnId] ? st.torreUnId : TORRES_UNICAS_CATALOGO[0].id;
  const torre = TORRES_UNICAS_POR_ID[torreId];
  const torreIdx = Math.max(0, TORRES_UNICAS_CATALOGO.findIndex((x) => x.id === torre.id));
  const maior = Number(t.unicas[torre.id]?.maiorAndar) || 0;
  const pct = Math.min(100, Math.round((maior / Math.max(1, torre.totalAndares)) * 100));
  const proxAndar = Math.min(torre.totalAndares, maior + 1);
  const andarSel = Math.max(1, Math.min(torre.totalAndares, st.andarUn || proxAndar));
  const andarDef = torre.andares[andarSel - 1];
  const desbl = andarTorreUnicaDesbloqueado(save, torre.id, andarSel);
  const podeHoje = podeFazerTorreUnicaHoje(save, torre.id, andarSel);

  const seletores = TORRES_UNICAS_CATALOGO.map((x) => {
    const m = Number(t.unicas[x.id]?.maiorAndar) || 0;
    const pCard = Math.min(100, Math.round((m / Math.max(1, x.totalAndares)) * 100));
    const ativo = x.id === torre.id;
    return `<button class="torre-card ${ativo ? 'btn-pri' : 'btn-sec'}" data-tor-un="${esc(x.id)}" style="padding:7px 10px;font-size:11.5px;text-align:left;min-width:160px;flex:1 1 160px;display:flex;flex-direction:column;gap:3px;border:${ativo ? '2px solid #fde68a' : '1px solid rgba(243,194,122,.28)'};${ativo ? 'background:#2a1840;color:#fff3e7' : ''}">
      <div style="display:flex;justify-content:space-between;width:100%"><b>⚔️ ${esc(x.nome)}</b><small style="background:#160c24;color:#fff3e7;padding:1px 7px;border-radius:999px">${m}/${x.totalAndares}</small></div>
      <div style="width:100%;height:5px;border-radius:999px;background:rgba(0,0,0,.45);overflow:hidden"><div style="width:${pCard}%;height:100%;background:linear-gradient(90deg,#c084fc,#fde047)"></div></div>
    </button>`;
  }).join('');

  const iniIdx = Math.max(1, andarSel - 4);
  const fimIdx = Math.min(torre.totalAndares, iniIdx + 9);
  const andaresBtns = [];
  for (let a = iniIdx; a <= fimIdx; a++) {
    const ok = andarTorreUnicaDesbloqueado(save, torre.id, a);
    const feitoHoje = !podeFazerTorreUnicaHoje(save, torre.id, a);
    andaresBtns.push(`<button class="${a === andarSel ? 'btn-pri' : 'btn-sec'}" data-tor-andar-un="${a}" style="padding:4px 8px;font-size:11px;${ok ? '' : 'opacity:.5'}">${a % 10 === 0 ? '👑 ' : ''}${a}${feitoHoje ? ' ✓' : ok ? '' : ' 🔒'}</button>`);
  }

  const linhagemAlvo = torre.poolLinhagens[0] || 'brasinha';
  const fragLista = Object.entries(armas.fragmentos || {}).filter(([, q]) => q > 0).slice(0, 8)
    .map(([k, q]) => `<span class="tag">${esc(k)}: ${q}</span>`).join(' ');

  const rp = torre.recompensaPropria;
  const rpTxt = rp ? ` · Recompensa própria: ${esc(rp.nome)} (+${rp.ouroBase || 0} 🪙)` : '';

  return `${subAbasHtml}<div class="bl">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
      <b style="color:#fde68a">⚔️ Torres Únicas (3 × 30 andares · Nv. 60–120 · 1×/dia por andar)</b>
      <span class="tag">✨ Pó Único: ${armas.poUnico || 0}${armas.escolhasPendentes ? ` · 🎁 Escolhas: ${armas.escolhasPendentes}` : ''}</span>
    </div>
    <div class="torre-seletores" style="display:flex;gap:6px;flex-wrap:wrap">${seletores}</div>
  </div>
  <div class="bl" style="position:relative;overflow:hidden;background:linear-gradient(120deg,rgba(18,8,30,.92) 30%,rgba(14,8,26,.72) 100%),url('${FACHADA_TORRE(torreIdx + 9)}') center / cover no-repeat;border:2px solid rgba(243,194,122,.45);padding:12px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap">
      <div style="flex:1;min-width:210px">
        <h4 style="margin:0;font-size:15px;color:#fde68a;text-shadow:0 1px 3px rgba(0,0,0,.9)">⚔️ ${esc(torre.nome)} · Andar ${andarSel}/${torre.totalAndares} ${andarDef.chefe ? '👑 Chefe' : ''}</h4>
        <div style="font-size:12px;color:#d6dbe4;margin-top:3px;text-shadow:0 1px 2px rgba(0,0,0,.85)">${esc(torre.desc)}</div>
        <div style="width:100%;max-width:340px;height:7px;border-radius:999px;background:rgba(0,0,0,.55);border:1px solid rgba(243,194,122,.35);overflow:hidden;margin:6px 0">
          <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#c084fc,#fde047)"></div>
        </div>
        <div style="font-size:11.5px;color:#fef08a;margin-top:4px;text-shadow:0 1px 2px rgba(0,0,0,.85)">Nível ${andarDef.nivel} · Prêmio: 1 Fragmento de Arma Única (ou 1 Pó Único se ainda não possui a linhagem)${rpTxt}</div>
      </div>
      <button class="btn-pri" data-tor-lutar-un="${esc(torre.id)}:${andarSel}" ${desbl && podeHoje ? '' : 'disabled'}>${!desbl ? '🔒 Bloqueado' : !podeHoje ? '✓ Feito hoje' : `⚔️ Lutar Andar ${andarSel}`}</button>
    </div>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:10px;align-items:center">
      <button class="btn-sec" data-tor-andar-un="${Math.max(1, andarSel - 10)}" style="padding:4px 7px;font-size:11px">« -10</button>
      ${andaresBtns.join('')}
      <button class="btn-sec" data-tor-andar-un="${Math.min(torre.totalAndares, andarSel + 10)}" style="padding:4px 7px;font-size:11px">+10 »</button>
    </div>
  </div>
  <div class="bl">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
      <div>
        <b style="color:#fff3e7">✨ Troca de Pó Único (${TORRES_CFG.custoPoPorFragmento}:1)</b>
        <div style="margin-top:4px">${fragLista || '<span class="mut">Nenhum fragmento de arma única obtido ainda.</span>'}</div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn-sec" data-tor-trocar-po="${esc(linhagemAlvo)}" ${(armas.poUnico || 0) >= TORRES_CFG.custoPoPorFragmento ? '' : 'disabled'}>Trocar 5 Pó → 1 Frag (${esc(linhagemAlvo)})</button>
        ${(armas.escolhasPendentes || 0) > 0 ? `<button class="btn-pri" data-tor-resgatar-escolha="${esc(linhagemAlvo)}">🎁 Resgatar Escolha (${esc(linhagemAlvo)})</button>` : ''}
      </div>
    </div>
  </div>`;
}

export function tratarCliqueTorres(d, { save, salvar, mostrarToast, render, tela, batalhaBloqueando, aliadosDoSave, st }) {
  if (d.torSub) {
    st.subTorre = d.torSub;
    render();
    return true;
  }
  if (d.torAndarSaz) {
    st.andarSaz = Number(d.torAndarSaz);
    render(true);
    return true;
  }
  if (d.torLutarSaz) {
    if (batalhaBloqueando?.()) { mostrarToast('Já existe uma batalha em andamento.'); return true; }
    const [tid, aStr] = d.torLutarSaz.split(':');
    const andarNum = Number(aStr);
    const ini = iniciarAndarTorreSazonal(save, tid, andarNum);
    if (!ini.ok) { mostrarToast(ini.motivo || 'Não foi possível iniciar o andar.'); render(); return true; }
    salvar();
    render();
    tela.abrir({
      titulo: `${ini.torre.nome} · Andar ${andarNum}`,
      sub: `Ciclo #${ini.torre.ciclo} · Nível ${ini.andar.nivel}`,
      arena: ARENA_FALLBACK,
      aliados: aliadosDoSave(),
      inimigos: ini.andar.inimigos,
      ritmo: 420,
      save,
      regiao: 2,
      onFim: (venceu, _f, _m, resumo) => {
        const res = concluirAndarTorreSazonal(save, tid, andarNum, resumo || { venceu: Boolean(venceu) }, { batalhaId: ini.batalhaId });
        salvar();
        if (res.venceu) st.andarSaz = Math.min(ini.torre.totalAndares || 30, andarNum + 1);
        render();
        mostrarResultadoBatalha({
          titulo: res.venceu ? `🏆 ${ini.torre.nome} · Andar ${andarNum}` : `💀 Derrota no Andar ${andarNum}`,
          subtitulo: ini.torre.nome,
          venceu: Boolean(res.venceu),
          save,
          premios: res.premios,
          podeRepetir: !res.venceu,
          onRepetir: () => tratarCliqueTorres({ torLutarSaz: `${tid}:${andarNum}` }, { save, salvar, mostrarToast, render, tela, batalhaBloqueando, aliadosDoSave, st }),
          rotuloVoltar: '⚔️ Voltar às Torres',
        });
      },
    });
    return true;
  }
  if (d.torFiltroEl) {
    st.elementoFiltro = d.torFiltroEl;
    const match = d.torFiltroEl === 'todos' ? TORRES_ELEMENTAIS_CATALOGO[0] : TORRES_ELEMENTAIS_CATALOGO.find((x) => (x.elementos || []).includes(d.torFiltroEl));
    if (match) {
      st.torreElId = match.id;
      const m = Number(torresDe(save).elementais[match.id]?.maiorAndar) || 0;
      st.andarEl = Math.min(match.totalAndares, m + 1);
    }
    render();
    return true;
  }
  if (d.torEl) {
    st.torreElId = d.torEl;
    const m = Number(torresDe(save).elementais[d.torEl]?.maiorAndar) || 0;
    st.andarEl = Math.min(TORRES_CFG.maxAndaresElemental, m + 1);
    render(true);
    return true;
  }
  if (d.torAndarEl) {
    st.andarEl = Number(d.torAndarEl);
    render(true);
    return true;
  }
  if (d.torUn) {
    st.torreUnId = d.torUn;
    const m = Number(torresDe(save).unicas[d.torUn]?.maiorAndar) || 0;
    st.andarUn = Math.min(TORRES_CFG.maxAndaresUnica, m + 1);
    render(true);
    return true;
  }
  if (d.torAndarUn) {
    st.andarUn = Number(d.torAndarUn);
    render(true);
    return true;
  }
  if (d.torTreino) {
    const [tid, aStr] = d.torTreino.split(':');
    const r = concluirTreinoDiarioTorre(save, tid, Number(aStr));
    if (r.ok) {
      salvar();
      mostrarToast(`💠 Treino concluído! +${r.premios.essencia.qtd} Essência ${r.premios.essencia.tamanho} (${r.usosRestantes} restantes hoje).`);
      render();
    } else mostrarToast(r.motivo || 'Treino indisponível.');
    return true;
  }
  if (d.torTrocarPo) {
    const r = trocarPoUnicoPorFragmento(save, d.torTrocarPo, 1);
    if (r.ok) { salvar(); mostrarToast(`⚔️ +1 Fragmento de ${r.linhagem} (Pó restante: ${r.poRestante}).`); render(); }
    else mostrarToast(r.motivo || 'Pó insuficiente.');
    return true;
  }
  if (d.torResgatarEscolha) {
    const r = resgatarEscolhaFragmentoUnico(save, d.torResgatarEscolha);
    if (r.ok) { salvar(); mostrarToast(`🎁 +1 Fragmento de ${r.linhagem} resgatado!`); render(); }
    else mostrarToast(r.motivo || 'Sem escolhas pendentes.');
    return true;
  }
  if (d.torLutarEl) {
    if (batalhaBloqueando?.()) { mostrarToast('Já existe uma batalha em andamento.'); return true; }
    const [tid, aStr] = d.torLutarEl.split(':');
    const andarNum = Number(aStr);
    const ini = iniciarAndarTorreElemental(save, tid, andarNum);
    if (!ini.ok) { mostrarToast(ini.motivo || 'Não foi possível iniciar o andar.'); render(); return true; }
    salvar();
    render();
    tela.abrir({
      titulo: `${ini.torre.nome} · Andar ${andarNum}`,
      sub: ini.andar.chefe ? 'Chefe de Andar' : `Nível ${ini.andar.nivel}`,
      arena: ARENA_FALLBACK,
      aliados: aliadosDoSave(),
      inimigos: ini.andar.inimigos,
      ritmo: 420,
      save,
      regiao: 1,
      onFim: (venceu, _f, _m, resumo) => {
        const res = concluirAndarTorreElemental(save, tid, andarNum, resumo || { venceu: Boolean(venceu) }, { batalhaId: ini.batalhaId });
        salvar();
        if (res.venceu) st.andarEl = Math.min(TORRES_CFG.maxAndaresElemental, andarNum + 1);
        render();
        mostrarResultadoBatalha({
          titulo: res.venceu ? `🏆 ${ini.torre.nome} · Andar ${andarNum}` : `💀 Derrota no Andar ${andarNum}`,
          subtitulo: res.primeiraVitoria ? 'Primeira vitória neste andar!' : ini.torre.nome,
          venceu: Boolean(res.venceu),
          save,
          premios: res.premios,
          podeProxima: Boolean(res.venceu && andarNum < TORRES_CFG.maxAndaresElemental),
          rotuloProxima: `Andar ${andarNum + 1} →`,
          onProxima: () => { st.andarEl = andarNum + 1; render(); },
          podeRepetir: true,
          onRepetir: () => tratarCliqueTorres({ torLutarEl: `${tid}:${andarNum}` }, { save, salvar, mostrarToast, render, tela, batalhaBloqueando, aliadosDoSave, st }),
          rotuloVoltar: '🗼 Voltar às Torres',
        });
      },
    });
    return true;
  }
  if (d.torLutarUn) {
    if (batalhaBloqueando?.()) { mostrarToast('Já existe uma batalha em andamento.'); return true; }
    const [tid, aStr] = d.torLutarUn.split(':');
    const andarNum = Number(aStr);
    const ini = iniciarAndarTorreUnica(save, tid, andarNum);
    if (!ini.ok) { mostrarToast(ini.motivo || 'Não foi possível iniciar o andar.'); render(); return true; }
    salvar();
    render();
    tela.abrir({
      titulo: `${ini.torre.nome} · Andar ${andarNum}`,
      sub: ini.andar.chefe ? 'Chefe Único' : `Nível ${ini.andar.nivel}`,
      arena: ARENA_FALLBACK,
      aliados: aliadosDoSave(),
      inimigos: ini.andar.inimigos,
      ritmo: 420,
      save,
      regiao: 2,
      onFim: (venceu, _f, _m, resumo) => {
        const res = concluirAndarTorreUnica(save, tid, andarNum, resumo || { venceu: Boolean(venceu) }, { batalhaId: ini.batalhaId });
        salvar();
        if (res.venceu) st.andarUn = Math.min(TORRES_CFG.maxAndaresUnica, andarNum + 1);
        render();
        mostrarResultadoBatalha({
          titulo: res.venceu ? `🏆 ${ini.torre.nome} · Andar ${andarNum}` : `💀 Derrota no Andar ${andarNum}`,
          subtitulo: res.venceu ? '1×/dia concluído neste andar' : ini.torre.nome,
          venceu: Boolean(res.venceu),
          save,
          premios: res.premios,
          podeProxima: Boolean(res.venceu && andarNum < TORRES_CFG.maxAndaresUnica),
          rotuloProxima: `Andar ${andarNum + 1} →`,
          onProxima: () => { st.andarUn = andarNum + 1; render(); },
          podeRepetir: !res.venceu,
          onRepetir: () => tratarCliqueTorres({ torLutarUn: `${tid}:${andarNum}` }, { save, salvar, mostrarToast, render, tela, batalhaBloqueando, aliadosDoSave, st }),
          rotuloVoltar: '⚔️ Voltar às Torres',
        });
      },
    });
    return true;
  }
  return false;
}
