// Interface de Domadores Auxiliares (4 Oníricos + 1 Domador de Apoio sem ocupar vaga)
import {
  DOMADORES_CFG,
  listarDomadores,
  desbloquearDomador,
  selecionarDomadorAtivo,
  usarPocaoXpDomador,
} from './regiao1-domadores-regras.js';
import { hwDe } from './regiao1-halloween-regras.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const IMG = (p) => `../../../${p}`;

function retratoDomador(d) {
  if (d.id === 'azazel') return IMG('assets/confusion/interface/descanso-v1/avatar-azazel.webp');
  if (d.arte?.retrato) return IMG(d.arte.retrato);
  return IMG('assets/confusion/interface/descanso-v1/avatar-azazel.webp');
}

function fmtPassiva(p) {
  if (!p) return '';
  const partes = [];
  if (p.vidaPct) partes.push(`Vida +${Math.round(p.vidaPct * 100)}%`);
  if (p.ataquePct) partes.push(`Ataque +${Math.round(p.ataquePct * 100)}%`);
  if (p.defesaPct) partes.push(`Defesa +${Math.round(p.defesaPct * 100)}%`);
  if (p.critico) partes.push(`Crítico +${Math.round(p.critico * 100)}%`);
  return partes.join(' · ');
}

export function resumoDomadorAtivoHtml(save) {
  const lista = listarDomadores(save);
  const ativo = lista.find((d) => d.ativo) || lista[0];
  if (!ativo) return '';
  return `<div class="bl" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
    <div style="display:flex;align-items:center;gap:8px">
      <img src="${retratoDomador(ativo)}" alt="${esc(ativo.nome)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:1px solid #38bdf8" />
      <div style="font-size:12px">
        <b>🛡️ Domador de Apoio: ${esc(ativo.nome)}</b> <span class="tag">Nv.${ativo.nivel}</span> <span class="mut">(não ocupa vaga)</span>
        <div style="font-size:11px;color:#fde68a">${esc(fmtPassiva(ativo.passivaAtual))}</div>
      </div>
    </div>
    <button class="btn-sec" data-aba="1">Trocar Domador →</button>
  </div>`;
}

export function renderizarPainelDomadores(save) {
  const lista = listarDomadores(save);
  const pocs = hwDe(save)?.pocoes || {};
  const pP = pocs.pocao_xp_p || 0;
  const pM = pocs.pocao_xp_m || 0;
  const pG = pocs.pocao_xp_g || 0;

  const topo = `<div class="bl">
    <h4 style="margin:0 0 4px">🛡️ Domadores Auxiliares (Apoio de Batalha)</h4>
    <p class="mut" style="margin:0">Seu time leva <b>4 Oníricos + 1 Domador de apoio</b> (não ocupa vaga). O Domador carrega barra a cada turno aliado e age em combate com suas 3 habilidades, além de aplicar sua passiva no time inteiro.</p>
  </div>`;

  const cards = lista.map((d) => {
    const habs = (d.habilidades || []).map((hb) => `<div style="background:#0a1528;border:1px solid #1e3a5f;border-radius:8px;padding:6px 8px;font-size:11.5px">
      <b>${hb.icone || '✨'} ${esc(hb.nome)}</b> <span class="mut">· Recarga: ${hb.cd}t</span>
      <div class="mut" style="margin-top:2px">${esc(hb.desc || '')}</div>
    </div>`).join('');

    const acoes = d.desbloqueado
      ? `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
          <button class="${d.ativo ? 'btn-sec' : 'btn-pri'}" data-dom-sel="${esc(d.id)}" ${d.ativo ? 'disabled' : ''}>${d.ativo ? '✓ Em apoio' : '🛡️ Escolher como apoio'}</button>
          <button class="btn-sec" data-dom-xp="${esc(d.id)}:pocao_xp_p" ${pP > 0 && d.nivel < DOMADORES_CFG.nivelMax ? '' : 'disabled'}>🧪 XP P (${pP})</button>
          <button class="btn-sec" data-dom-xp="${esc(d.id)}:pocao_xp_m" ${pM > 0 && d.nivel < DOMADORES_CFG.nivelMax ? '' : 'disabled'}>🧪 XP M (${pM})</button>
          <button class="btn-sec" data-dom-xp="${esc(d.id)}:pocao_xp_g" ${pG > 0 && d.nivel < DOMADORES_CFG.nivelMax ? '' : 'disabled'}>🧪 XP G (${pG})</button>
        </div>`
      : `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
          <span class="mut" style="font-size:11.5px">🔒 ${esc(d.obtencao?.descricao || 'Bloqueado')}</span>
          ${d.elegivelPorProgresso ? `<button class="btn-pri" data-dom-desbl="${esc(d.id)}:0">🔓 Desbloquear grátis</button>` : ''}
          ${d.obtencao?.custoDiamantes ? `<button class="btn-sec" data-dom-desbl="${esc(d.id)}:1">💎 Desbloquear (${d.obtencao.custoDiamantes} 💎)</button>` : ''}
        </div>`;

    return `<div class="bl" style="${d.ativo ? 'border-color:#facc15' : ''}">
      <div style="display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap">
        <img src="${retratoDomador(d)}" alt="${esc(d.nome)}" style="width:68px;height:68px;border-radius:10px;object-fit:cover;border:2px solid ${d.ativo ? '#facc15' : '#38bdf8'};background:#091529" />
        <div style="flex:1;min-width:200px">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap">
            <h4 style="margin:0">${esc(d.nome)} <small class="mut">· ${esc(d.titulo)}</small></h4>
            <span class="tag">Nv.${d.nivel}/${DOMADORES_CFG.nivelMax}${d.xpFaltanteProximoNivel > 0 ? ` · Próx: ${d.xpFaltanteProximoNivel} XP` : ' · MÁX'}</span>
          </div>
          <div style="font-size:11.5px;color:#fde68a;margin:4px 0"><b>Passiva · ${esc(d.passiva?.nome)}:</b> ${esc(fmtPassiva(d.passivaAtual))}</div>
          <div class="mut" style="font-size:11px;margin-bottom:6px">${esc(d.passiva?.desc || '')}</div>
          ${acoes}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:6px;margin-top:8px">${habs}</div>
    </div>`;
  }).join('');

  return topo + cards;
}

export function tratarCliqueDomadores(d, { save, salvar, mostrarToast, render }) {
  if (d.domSel) {
    const r = selecionarDomadorAtivo(save, d.domSel);
    if (r.ok) { salvar(); mostrarToast(`🛡️ ${r.domador.nome} selecionado como Domador de apoio!`); render(); }
    else mostrarToast(r.motivo || 'Não foi possível selecionar.');
    return true;
  }
  if (d.domDesbl) {
    const [id, pagarStr] = d.domDesbl.split(':');
    const r = desbloquearDomador(save, id, { pagarDiamantes: pagarStr === '1' });
    if (r.ok) { salvar(); mostrarToast(`🔓 ${r.domador.nome} desbloqueado!`); render(); }
    else mostrarToast(r.motivo || 'Requisitos não atendidos.');
    return true;
  }
  if (d.domXp) {
    const [id, pocId] = d.domXp.split(':');
    const r = usarPocaoXpDomador(save, id, pocId, 1);
    if (r.ok) { salvar(); mostrarToast(`✨ +${r.xpGanho} XP para o Domador (Nv.${r.nivel})!`); render(); }
    else mostrarToast(r.motivo || 'Sem poções.');
    return true;
  }
  return false;
}
