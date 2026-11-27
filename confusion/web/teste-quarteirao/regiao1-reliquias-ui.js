// Interface de Relíquias, Armas Únicas e Essências
import {
  PARTES_RELIQUIA,
  CONJUNTOS_RELIQUIAS,
  RARIDADES_ORDEM,
  reliquiasDe,
  filtrarReliquias,
  conjuntosAtivosDoOnirico,
  equiparReliquia,
  desequiparReliquia,
  equiparReliquiasRecomendadas,
  custoReforcoReliquia,
  reforcarReliquia,
  trancarReliquia,
  desmontarReliquia,
  salvarPredefinicaoReliquias,
  aplicarPredefinicaoReliquias,
  armasUnicasDe,
  armaUnicaDaLinhagem,
  criarArmaUnica,
  reforcarArmaUnica,
  equiparArmaUnica,
} from './regiao1-reliquias-regras.js';
import { essenciasDe, ESSENCIAS_PARES } from './regiao1-campanha-mini-regras.js';
import { ELEMENTO_DA_ESPECIE } from '../species.js';
import { NOME_ELEMENTO } from '../core.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function fmtAttr(attr, val) {
  if (val == null) return '';
  if (String(attr).endsWith('_flat') || attr === 'velocidade') return `${attr.replace('_flat', '')} +${Math.round(val)}`;
  return `${attr.replace('_pct', '')} +${Math.round(val * 100)}%`;
}

export function renderizarPainelReliquias(save, aba, st) {
  if (aba === 1) {
    const ess = essenciasDe(save);
    return Object.entries(ESSENCIAS_PARES).map(([id, p]) => {
      const s = ess[id] || { menor: 0, media: 0, maior: 0 };
      const els = p.elementos.map((e) => NOME_ELEMENTO[e] || e).join(' / ');
      return `<div class="bl"><h4>💠 ${esc(p.nome)} <span class="mut">(${esc(els)})</span></h4><p>Menor: <b>${s.menor}</b> · Média: <b>${s.media}</b> · Maior: <b>${s.maior}</b></p></div>`;
    }).join('');
  }

  const rel = reliquiasDe(save);
  const armas = armasUnicasDe(save);
  const col = save?.idle?.colecao || [];
  if (!st.uid || !col.some((m) => m.uid === st.uid)) st.uid = col[0]?.uid || null;
  const membro = col.find((m) => m.uid === st.uid) || null;
  const elMembro = membro ? (membro.elemento || ELEMENTO_DA_ESPECIE[membro.especie] || 'neutro') : null;

  const selMembros = col.slice(0, 12).map((m) => {
    const el = m.elemento || ELEMENTO_DA_ESPECIE[m.especie] || 'neutro';
    return `<button class="${m.uid === st.uid ? 'btn-pri' : 'btn-sec'}" data-rel-uid="${esc(m.uid)}" style="padding:4px 8px;font-size:11px">${esc(m.especie)} <small>(${esc(NOME_ELEMENTO[el] || el)})</small></button>`;
  }).join('');

  let equipHtml = '<div class="bl"><p class="mut">Nenhum Onírico na coleção.</p></div>';
  if (membro) {
    const eqMap = rel.equipadas[membro.uid] || {};
    const conjAtivos = conjuntosAtivosDoOnirico(save, membro.uid);
    const conjTxt = conjAtivos.length
      ? conjAtivos.map((c) => `${CONJUNTOS_RELIQUIAS[c.conjunto]?.nome || c.conjunto} (${c.pecas}p)`).join(' · ')
      : 'Nenhum conjunto ativo (2 ou 4 peças iguais)';

    const slotsHtml = Object.values(PARTES_RELIQUIA).map((p) => {
      const rid = eqMap[p.id];
      const item = rid ? rel.bolsa.find((x) => x.id === rid) : null;
      return `<div style="flex:1;min-width:130px;background:#0a1528;border:1px solid #1e3a5f;border-radius:8px;padding:6px 8px;font-size:11px">
        <div style="font-weight:700;color:#93c5fd">${esc(p.nome)}</div>
        ${item ? `<div><b>${esc(item.raridade)} +${item.reforco}</b> (${esc(item.conjunto)})</div><div style="color:#fde68a">${esc(fmtAttr(item.principal?.attr, item.principal?.valor))}</div><button class="btn-sec" data-rel-deseq="${esc(membro.uid)}:${esc(p.id)}" style="margin-top:4px;padding:2px 6px;font-size:10px">Desequipar</button>` : '<div class="mut">Vazio</div>'}
      </div>`;
    }).join('');

    const armaDef = armaUnicaDaLinhagem(membro.especie);
    const armaKey = armaDef?.linhagem;
    const armaPos = armaKey ? armas.criadas?.[armaKey] : null;
    const frags = armaKey ? (armas.fragmentos?.[armaKey] || 0) : 0;
    const armaEquipada = armas.equipadas?.[membro.uid] === armaKey;
    const armaHtml = armaDef ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;font-size:11.5px">
      <div><b>⚔️ Arma Única:</b> ${esc(armaDef.nome)} ${armaPos ? `(+${armaPos.reforco || 0})` : '(não forjada)'} · <span class="mut">Fragmentos: ${frags}</span></div>
      <div style="display:flex;gap:5px;flex-wrap:wrap">
        ${!armaPos ? `<button class="btn-pri" data-rel-criar-arma="${esc(membro.especie)}" ${frags >= 10 ? '' : 'disabled'}>🔨 Forjar (10 frags)</button>` : `
          <button class="btn-sec" data-rel-ref-arma="${esc(membro.especie)}">⬆️ Reforçar</button>
          <button class="btn-pri" data-rel-eq-arma="${esc(membro.uid)}:${esc(membro.especie)}" ${armaEquipada ? 'disabled' : ''}>${armaEquipada ? '✓ Equipada' : 'Equipar Arma'}</button>
        `}
      </div>
    </div>` : '';

    equipHtml = `<div class="bl">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
        <div><b>${esc(membro.especie)}</b> · Elemento: <span class="tag">${esc(NOME_ELEMENTO[elMembro] || elMembro)}</span> · <span class="mut" style="font-size:11px">${esc(conjTxt)}</span></div>
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          <button class="btn-pri" data-rel-rec="${esc(membro.uid)}">⚡ Recomendar</button>
          <button class="btn-sec" data-rel-preset-save="${esc(membro.uid)}">💾 Salvar</button>
          <button class="btn-sec" data-rel-preset-load="${esc(membro.uid)}">📥 Aplicar</button>
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${slotsHtml}</div>
      ${armaHtml}
    </div>`;
  }

  const filtrosParte = [['', 'Todas'], ...Object.values(PARTES_RELIQUIA).map((p) => [p.id, p.nome])]
    .map(([v, rot]) => `<button class="${(st.parte || '') === v ? 'btn-pri' : 'btn-sec'}" data-rel-fparte="${esc(v)}" style="padding:3px 7px;font-size:11px">${esc(rot)}</button>`).join('');
  const filtrosRar = [['', 'Todas'], ...RARIDADES_ORDEM.map((r) => [r, r])]
    .map(([v, rot]) => `<button class="${(st.raridade || '') === v ? 'btn-pri' : 'btn-sec'}" data-rel-frar="${esc(v)}" style="padding:3px 7px;font-size:11px">${esc(rot)}</button>`).join('');

  const itens = filtrarReliquias(save, {
    ...(st.parte ? { parte: st.parte } : {}),
    ...(st.raridade ? { raridade: st.raridade } : {}),
  });

  const listaHtml = itens.slice(0, 40).map((it) => {
    const custo = custoReforcoReliquia(it.reforco || 0);
    const podeEq = membro && it.elemento === elMembro;
    const secs = (it.secundarios || []).map((s) => fmtAttr(s.attr, s.valor)).join(' · ');
    return `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:7px 0;border-top:1px solid rgba(255,255,255,.08);flex-wrap:wrap">
      <div style="font-size:11.5px;min-width:180px;flex:1">
        <b>${esc(PARTES_RELIQUIA[it.parte]?.nome || it.parte)} +${it.reforco || 0}</b> · <span class="tag">${esc(it.raridade)}</span> · <span class="tag">${esc(NOME_ELEMENTO[it.elemento] || it.elemento)}</span> · <span class="mut">${esc(it.conjunto)}</span>
        <div style="color:#fde68a;margin-top:2px">${esc(fmtAttr(it.principal?.attr, it.principal?.valor))}${secs ? ` <span class="mut">| ${esc(secs)}</span>` : ''}</div>
      </div>
      <div style="display:flex;gap:5px;flex-wrap:wrap">
        <button class="btn-pri" data-rel-eq="${esc(it.id)}" ${podeEq ? '' : 'disabled'} title="${podeEq ? 'Equipar no Onírico selecionado' : 'Só equipa em Onírico do mesmo elemento'}">Equipar</button>
        <button class="btn-sec" data-rel-ref="${esc(it.id)}" ${(it.reforco || 0) >= 15 ? 'disabled' : ''}>⬆️ +1 (${custo.ouro}🪙/${custo.po}✨)</button>
        <button class="btn-sec" data-rel-trancar="${esc(it.id)}">${it.trancada ? '🔒' : '🔓'}</button>
        <button class="btn-sec" data-rel-desm="${esc(it.id)}" ${it.trancada || it.equipadoEm ? 'disabled' : ''}>🗑️</button>
      </div>
    </div>`;
  }).join('');

  return `<div class="bl">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
      <b>💎 Bolsa de Relíquias (${rel.bolsa.length}/${rel.capacidade}) · ✨ Pó de Reforço: ${rel.poReforco}</b>
    </div>
    <div style="display:flex;gap:4px;flex-wrap:wrap">${selMembros}</div>
  </div>
  ${equipHtml}
  <div class="bl">
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px"><span class="mut" style="font-size:11px">Parte:</span>${filtrosParte}</div>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px"><span class="mut" style="font-size:11px">Raridade:</span>${filtrosRar}</div>
    ${listaHtml || '<p class="mut">Nenhuma relíquia encontrada com este filtro. Vença fases elite/escondidas da Campanha Mini ou Calabouços!</p>'}
  </div>`;
}

export function tratarCliqueReliquias(d, { save, salvar, mostrarToast, render, st }) {
  if (d.relUid) { st.uid = d.relUid; render(true); return true; }
  if (d.relFparte !== undefined) { st.parte = d.relFparte || null; render(true); return true; }
  if (d.relFrar !== undefined) { st.raridade = d.relFrar || null; render(true); return true; }
  if (d.relEq) {
    const r = equiparReliquia(save, st.uid, d.relEq);
    if (r.ok) { salvar(); mostrarToast('💎 Relíquia equipada!'); render(); }
    else mostrarToast(r.motivo || 'Não foi possível equipar.');
    return true;
  }
  if (d.relDeseq) {
    const [uid, parte] = d.relDeseq.split(':');
    const r = desequiparReliquia(save, uid, parte);
    if (r.ok) { salvar(); mostrarToast('Relíquia desequipada.'); render(); }
    else mostrarToast(r.motivo || 'Erro ao desequipar.');
    return true;
  }
  if (d.relRec) {
    const r = equiparReliquiasRecomendadas(save, d.relRec);
    if (r.ok) { salvar(); mostrarToast(`⚡ ${r.equipadas?.length || 0} relíquia(s) recomendada(s) equipada(s)!`); render(); }
    else mostrarToast(r.motivo || 'Nenhuma relíquia compatível na bolsa.');
    return true;
  }
  if (d.relPresetSave) {
    const r = salvarPredefinicaoReliquias(save, d.relPresetSave, 'padrao');
    if (r.ok) { salvar(); mostrarToast('💾 Predefinição salva!'); render(); }
    return true;
  }
  if (d.relPresetLoad) {
    const r = aplicarPredefinicaoReliquias(save, d.relPresetLoad, 'padrao');
    if (r.ok) { salvar(); mostrarToast('📥 Predefinição aplicada!'); render(); }
    else mostrarToast(r.motivo || 'Nenhuma predefinição salva.');
    return true;
  }
  if (d.relRef) {
    const r = reforcarReliquia(save, d.relRef);
    if (r.ok) { salvar(); mostrarToast(`⬆️ Relíquia reforçada para +${r.reliquia.reforco}!`); render(); }
    else mostrarToast(r.motivo || 'Recursos insuficientes.');
    return true;
  }
  if (d.relTrancar) {
    const item = reliquiasDe(save).bolsa.find((x) => x.id === d.relTrancar);
    if (item) {
      trancarReliquia(save, item.id, !item.trancada);
      salvar();
      render();
    }
    return true;
  }
  if (d.relDesm) {
    const r = desmontarReliquia(save, d.relDesm);
    if (r.ok) { salvar(); mostrarToast(`🗑️ Desmontada! +${r.poGanho || 0} ✨ Pó de Reforço.`); render(); }
    else mostrarToast(r.motivo || 'Não foi possível desmontar.');
    return true;
  }
  if (d.relCriarArma) {
    const r = criarArmaUnica(save, d.relCriarArma);
    if (r.ok) { salvar(); mostrarToast(`⚔️ Arma Única forjada!`); render(); }
    else mostrarToast(r.motivo || 'Fragmentos insuficientes.');
    return true;
  }
  if (d.relRefArma) {
    const r = reforcarArmaUnica(save, d.relRefArma);
    if (r.ok) { salvar(); mostrarToast(`⬆️ Arma Única reforçada!`); render(); }
    else mostrarToast(r.motivo || 'Recursos insuficientes.');
    return true;
  }
  if (d.relEqArma) {
    const [uid, esp] = d.relEqArma.split(':');
    const r = equiparArmaUnica(save, uid, esp);
    if (r.ok) { salvar(); mostrarToast('⚔️ Arma Única equipada!'); render(); }
    else mostrarToast(r.motivo || 'Não foi possível equipar.');
    return true;
  }
  return false;
}
