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
} from './regiao1-torres-regras.js';
import { NOME_ELEMENTO } from '../core.js';
import { mostrarResultadoBatalha } from './regiao1-resultado-ui.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const ARENA_FALLBACK = 'assets/confusion/interface/estrategia/reinos/01/arena-chefe.webp';

export function renderizarPainelTorres(save, aba, st) {
  const t = torresDe(save);
  const armas = save?.idle?.armasUnicas || { fragmentos: {}, poUnico: 0, escolhasPendentes: 0 };

  if (aba === 0) {
    const torreId = st.torreElId && TORRES_ELEMENTAIS_POR_ID[st.torreElId] ? st.torreElId : TORRES_ELEMENTAIS_CATALOGO[0].id;
    const torre = TORRES_ELEMENTAIS_POR_ID[torreId];
    const maior = Number(t.elementais[torre.id]?.maiorAndar) || 0;
    const proxAndar = Math.min(torre.totalAndares, maior + 1);
    const andarSel = Math.max(1, Math.min(torre.totalAndares, st.andarEl || proxAndar));
    const andarDef = torre.andares[andarSel - 1];
    const desbl = andarTorreElementalDesbloqueado(save, torre.id, andarSel);
    const pago = Boolean(t.elementais[torre.id]?.pagas?.[String(andarSel)]);
    const treinos = usosRestantesTreinoTorre(save);

    const seletores = TORRES_ELEMENTAIS_CATALOGO.map((x) => {
      const m = Number(t.elementais[x.id]?.maiorAndar) || 0;
      const els = x.elementos.map((e) => NOME_ELEMENTO[e] || e).join(' / ');
      return `<button class="${x.id === torre.id ? 'btn-pri' : 'btn-sec'}" data-tor-el="${esc(x.id)}" style="padding:5px 9px;font-size:11.5px">🗼 ${esc(x.nome)} <small>(${m}/${x.totalAndares})</small><br><span style="font-size:10px;opacity:.85">${esc(els)}</span></button>`;
    }).join('');

    const iniIdx = Math.max(1, andarSel - 4);
    const fimIdx = Math.min(torre.totalAndares, iniIdx + 9);
    const andaresBtns = [];
    for (let a = iniIdx; a <= fimIdx; a++) {
      const ok = andarTorreElementalDesbloqueado(save, torre.id, a);
      const venc = a <= maior;
      andaresBtns.push(`<button class="${a === andarSel ? 'btn-pri' : 'btn-sec'}" data-tor-andar-el="${a}" style="padding:4px 8px;font-size:11px;${ok ? '' : 'opacity:.45'}">${a % 10 === 0 ? '👑 ' : ''}${a}${venc ? ' ✓' : ok ? '' : ' 🔒'}</button>`);
    }

    const p1 = andarDef.recompensaPrimeiraVitoria;
    return `<div class="bl">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <b>🗼 Torres Elementais (6 × 50 andares)</b>
        <span class="tag">Treino diário: ${treinos}/${TORRES_CFG.treinosDiariosMax}</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${seletores}</div>
    </div>
    <div class="bl">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
        <div>
          <h4 style="margin:0">${esc(torre.nome)} · Andar ${andarSel}/${torre.totalAndares} ${andarDef.chefe ? '👑 Chefe' : ''}</h4>
          <div class="mut" style="font-size:11.5px">Nível recomendado: <b>${andarDef.nivel}</b> · Energia: <b>⚡ ${andarDef.energia}</b></div>
          <div style="font-size:11.5px;color:#fde68a;margin-top:4px">${pago ? '✓ 1ª vitória já coletada (repetição: 100 ouro)' : `1ª vitória: 💎 ${p1.diamantes} · 🪙 ${p1.ouro} · 💠 Essência ${p1.essencia.tamanho} ×${p1.essencia.qtd}`}</div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn-sec" data-tor-treino="${esc(torre.id)}:${andarSel}" ${andarSel <= maior && treinos > 0 ? '' : 'disabled'}>⚡ Treino (Essência · ⚡ ${TORRES_CFG.energiaTreinoDiario})</button>
          <button class="btn-pri" data-tor-lutar-el="${esc(torre.id)}:${andarSel}" ${desbl ? '' : 'disabled'}>⚔️ Lutar Andar ${andarSel}</button>
        </div>
      </div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:8px;align-items:center">
        <button class="btn-sec" data-tor-andar-el="${Math.max(1, andarSel - 10)}" style="padding:4px 7px;font-size:11px">« -10</button>
        ${andaresBtns.join('')}
        <button class="btn-sec" data-tor-andar-el="${Math.min(torre.totalAndares, andarSel + 10)}" style="padding:4px 7px;font-size:11px">+10 »</button>
      </div>
    </div>`;
  }

  // Aba 1: Torres Únicas
  const torreId = st.torreUnId && TORRES_UNICAS_POR_ID[st.torreUnId] ? st.torreUnId : TORRES_UNICAS_CATALOGO[0].id;
  const torre = TORRES_UNICAS_POR_ID[torreId];
  const maior = Number(t.unicas[torre.id]?.maiorAndar) || 0;
  const proxAndar = Math.min(torre.totalAndares, maior + 1);
  const andarSel = Math.max(1, Math.min(torre.totalAndares, st.andarUn || proxAndar));
  const andarDef = torre.andares[andarSel - 1];
  const desbl = andarTorreUnicaDesbloqueado(save, torre.id, andarSel);
  const podeHoje = podeFazerTorreUnicaHoje(save, torre.id, andarSel);

  const seletores = TORRES_UNICAS_CATALOGO.map((x) => {
    const m = Number(t.unicas[x.id]?.maiorAndar) || 0;
    return `<button class="${x.id === torre.id ? 'btn-pri' : 'btn-sec'}" data-tor-un="${esc(x.id)}" style="padding:5px 10px;font-size:11.5px">⚔️ ${esc(x.nome)} <small>(${m}/${x.totalAndares})</small></button>`;
  }).join('');

  const iniIdx = Math.max(1, andarSel - 4);
  const fimIdx = Math.min(torre.totalAndares, iniIdx + 9);
  const andaresBtns = [];
  for (let a = iniIdx; a <= fimIdx; a++) {
    const ok = andarTorreUnicaDesbloqueado(save, torre.id, a);
    const feitoHoje = !podeFazerTorreUnicaHoje(save, torre.id, a);
    andaresBtns.push(`<button class="${a === andarSel ? 'btn-pri' : 'btn-sec'}" data-tor-andar-un="${a}" style="padding:4px 8px;font-size:11px;${ok ? '' : 'opacity:.45'}">${a % 10 === 0 ? '👑 ' : ''}${a}${feitoHoje ? ' ✓' : ok ? '' : ' 🔒'}</button>`);
  }

  const linhagemAlvo = torre.poolLinhagens[0] || 'brasinha';
  const fragLista = Object.entries(armas.fragmentos || {}).filter(([, q]) => q > 0).slice(0, 8)
    .map(([k, q]) => `<span class="tag">${esc(k)}: ${q}</span>`).join(' ');

  return `<div class="bl">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
      <b>⚔️ Torres Únicas (3 × 30 andares · Nv. 60–120 · 1×/dia por andar)</b>
      <span class="tag">✨ Pó Único: ${armas.poUnico || 0}${armas.escolhasPendentes ? ` · 🎁 Escolhas: ${armas.escolhasPendentes}` : ''}</span>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">${seletores}</div>
  </div>
  <div class="bl">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
      <div>
        <h4 style="margin:0">${esc(torre.nome)} · Andar ${andarSel}/${torre.totalAndares} ${andarDef.chefe ? '👑 Chefe' : ''}</h4>
        <div class="mut" style="font-size:11.5px">${esc(torre.desc)}</div>
        <div style="font-size:11.5px;color:#fde68a;margin-top:4px">Nível ${andarDef.nivel} · Energia: ⚡ ${andarDef.energia} · Prêmio: 1 Fragmento de Arma Única (ou 1 Pó Único se ainda não possui a linhagem)</div>
      </div>
      <button class="btn-pri" data-tor-lutar-un="${esc(torre.id)}:${andarSel}" ${desbl && podeHoje ? '' : 'disabled'}>${!desbl ? '🔒 Bloqueado' : !podeHoje ? '✓ Feito hoje' : `⚔️ Lutar Andar ${andarSel}`}</button>
    </div>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:8px;align-items:center">
      <button class="btn-sec" data-tor-andar-un="${Math.max(1, andarSel - 10)}" style="padding:4px 7px;font-size:11px">« -10</button>
      ${andaresBtns.join('')}
      <button class="btn-sec" data-tor-andar-un="${Math.min(torre.totalAndares, andarSel + 10)}" style="padding:4px 7px;font-size:11px">+10 »</button>
    </div>
  </div>
  <div class="bl">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
      <div>
        <b>✨ Troca de Pó Único (${TORRES_CFG.custoPoPorFragmento}:1)</b>
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
