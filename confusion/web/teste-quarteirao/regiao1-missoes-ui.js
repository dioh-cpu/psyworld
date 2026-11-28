// Interface de Missões (Marcos por categoria + Paralelas dos 12 capítulos + atalhos para Diárias/Temporada e Diário R1)
import {
  listarMarcos,
  listarMarcosPorCategoria,
  coletarMarco,
  temPremioMissaoPendente,
  listarParalelasCapitulo,
  iniciarParalela,
  avancarEtapaParalela,
} from './regiao1-missoes-regras.js';
import { CAPITULOS_CAMPANHA_MINI } from './regiao1-campanha-mini-regras.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const ROTULO_CAT = {
  campanha: '🗺️ Campanha',
  torres: '🗼 Torres',
  calaboucos: '🏰 Calabouços',
  colecao: '✨ Coleção & Evolução',
  reliquias: '💎 Relíquias',
  geral: '🏆 Geral',
};

function textoPremioMarco(pr) {
  if (!pr) return '';
  const p = [];
  if (pr.ouro) p.push(`🪙 ${pr.ouro}`);
  if (pr.diamantes) p.push(`💎 ${pr.diamantes}`);
  if (pr.ticketsPermanentes) p.push(`🎟️ +${pr.ticketsPermanentes} Tickets`);
  if (pr.ticketsSemanais) p.push(`🎫 +${pr.ticketsSemanais} Semanais`);
  if (pr.pocao_xp_p) p.push(`🧪 XP P ×${pr.pocao_xp_p}`);
  if (pr.pocao_xp_m) p.push(`🧪 XP M ×${pr.pocao_xp_m}`);
  if (pr.pocao_xp_g) p.push(`🧪 XP G ×${pr.pocao_xp_g}`);
  if (pr.essencia) p.push(`💠 Essência ×${pr.essencia.qtd}`);
  if (pr.poReforco) p.push(`✨ Pó Reforço ×${pr.poReforco}`);
  if (pr.reliquia) p.push(`🏺 Relíquia ${pr.reliquia.raridade || ''}`);
  if (pr.fragmentoEscolha) p.push(`⚔️ Escolha Arma Única ×${pr.fragmentoEscolha}`);
  return p.join(' · ');
}

export function temAvisoMissoes(save) {
  return temPremioMissaoPendente(save);
}

export function renderizarPainelMissoes(save, aba, { capParalela = 1, st = {} } = {}) {
  if (aba === 0) {
    const todos = listarMarcos(save);
    const prontos = todos.filter((x) => x.pronto);
    const grupos = listarMarcosPorCategoria(save);
    const topo = `<div class="bl" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
      <div><b>🏆 Marcos de Progressão</b> · <span class="mut">${todos.filter((x) => x.coletado).length}/${todos.length} coletados</span></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn-sec" data-mis-abrir="diarias">📅 Diárias & Temporada</button>
        <button class="btn-sec" data-mis-abrir="diario">📖 Diário Região 1</button>
        <button class="btn-pri" data-mis-coletar-tudo="1" ${prontos.length ? '' : 'disabled'}>🎁 Coletar tudo (${prontos.length})</button>
      </div>
    </div>`;
    const blocos = Object.entries(grupos).map(([cat, itens]) => {
      const linhas = itens.map((m) => {
        const pct = Math.min(100, Math.round((m.atual / Math.max(1, m.meta)) * 100));
        return `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 0;border-top:1px solid rgba(255,255,255,.08)">
          <div style="min-width:0;flex:1">
            <div style="font-size:12px;font-weight:700;color:${m.coletado ? '#86efac' : '#f8fafc'}">${esc(m.titulo)} <span class="mut" style="font-weight:500">(${m.atual}/${m.meta})</span></div>
            <div style="height:6px;background:#0a1528;border-radius:999px;overflow:hidden;margin:4px 0"><div style="height:100%;width:${pct}%;background:${m.coletado ? '#22c55e' : m.pronto ? '#facc15' : '#38bdf8'}"></div></div>
            <div style="font-size:11px;color:#fde68a">${esc(textoPremioMarco(m.premio))}</div>
          </div>
          <button class="${m.pronto ? 'btn-pri' : 'btn-sec'}" data-mis-coletar="${esc(m.id)}" ${m.pronto ? '' : 'disabled'}>${m.coletado ? '✓ Coletado' : m.pronto ? '🎁 Coletar' : 'Em progresso'}</button>
        </div>`;
      }).join('');
      return `<div class="bl"><h4>${esc(ROTULO_CAT[cat] || cat)}</h4>${linhas}</div>`;
    }).join('');
    return topo + blocos;
  }

  // Aba 1: Paralelas por Capítulo com filtros de status, lista rolável e detalhe da missão selecionada
  const filtro = st.filtro || 'todas';
  const seletores = CAPITULOS_CAMPANHA_MINI.map((c) => `<button class="${c.capitulo === capParalela ? 'btn-pri' : 'btn-sec'}" data-mis-cap="${c.capitulo}" style="padding:4px 8px;font-size:11px">Cap.${c.capitulo}</button>`).join('');
  const listaTotal = listarParalelasCapitulo(save, capParalela);
  const concluidasCap = listaTotal.filter((p) => p.concluida).length;
  const statusDe = (p) => (p.concluida ? 'concluidas' : !p.desbloqueada ? 'bloqueadas' : p.estado === 'disponivel' ? 'disponiveis' : 'andamento');
  const lista = filtro === 'todas' ? listaTotal : listaTotal.filter((p) => statusDe(p) === filtro);
  const sel = lista.find((p) => p.id === st.selId) || lista[0] || null;

  const filtrosHtml = [
    ['todas', `Todas (${listaTotal.length})`],
    ['disponiveis', `Disponíveis (${listaTotal.filter((p) => statusDe(p) === 'disponiveis').length})`],
    ['andamento', `Em andamento (${listaTotal.filter((p) => statusDe(p) === 'andamento').length})`],
    ['concluidas', `Concluídas (${concluidasCap})`],
    ['bloqueadas', `Bloqueadas (${listaTotal.filter((p) => statusDe(p) === 'bloqueadas').length})`],
  ].map(([k, rot]) => `<button class="${filtro === k ? 'btn-pri' : 'btn-sec'}" data-mis-filtro="${k}" style="padding:3px 8px;font-size:10.5px">${esc(rot)}</button>`).join('');

  const acaoDe = (p) => (p.concluida
    ? '<span class="tag" style="color:#86efac">✓ Concluída</span>'
    : !p.desbloqueada
      ? `<span class="mut" style="font-size:11px">🔒 Vença a fase ${esc(p.faseRequisitoId)}</span>`
      : p.estado === 'disponivel'
        ? `<button class="btn-pri" data-mis-par-iniciar="${esc(p.id)}">▶ Iniciar</button>`
        : p.etapaAtual?.tipo === 'batalha'
          ? `<button class="btn-pri" data-mis-par-lutar="${esc(p.id)}">⚔️ Lutar etapa</button>`
          : `<button class="btn-pri" data-mis-par-avancar="${esc(p.id)}">✓ Avançar etapa</button>`);

  const itensLista = lista.map((p) => {
    const ativo = sel && sel.id === p.id;
    const stTag = p.concluida ? '✓' : !p.desbloqueada ? '🔒' : p.estado === 'disponivel' ? '●' : '▶';
    return `<button type="button" data-mis-par-sel="${esc(p.id)}" style="display:flex;justify-content:space-between;align-items:center;gap:6px;width:100%;text-align:left;padding:7px 9px;margin-bottom:5px;border-radius:8px;cursor:pointer;color:#fff3e7;background:${ativo ? 'rgba(243,164,88,.22)' : 'rgba(18,10,28,.75)'};border:1px solid ${ativo ? '#f3a458' : '#52335c'}">
      <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700;font-size:12px">${stTag} ${esc(p.titulo)}</span>
      <span class="mut" style="font-size:10.5px;flex-shrink:0">${p.concluida ? 'Concluída' : `${(p.etapaIdx || 0) + 1}/${p.etapas?.length || 1}`}</span>
    </button>`;
  }).join('');

  const detalheHtml = sel ? `<div class="bl" style="margin-bottom:0">
    <h4 style="margin:0 0 4px">${esc(sel.titulo)}</h4>
    ${sel.npc ? `<div class="sub" style="margin-bottom:4px">NPC: <b>${esc(sel.npc)}</b></div>` : ''}
    <div style="font-size:12px;margin-bottom:6px">${sel.concluida
      ? '<span class="ok">✓ Missão concluída neste capítulo.</span>'
      : sel.etapaAtual
        ? `<b>Etapa ${sel.etapaIdx + 1}/${sel.etapas.length}:</b> ${esc(sel.etapaAtual.texto || sel.etapaAtual.tipo)}`
        : esc(sel.descricao || 'Conclua as etapas para receber as recompensas.')}</div>
    ${!sel.desbloqueada ? `<div class="ruim" style="font-size:11.5px;margin-bottom:6px">🔒 Requisito: vença a fase ${esc(sel.faseRequisitoId)} na Campanha Mini.</div>` : ''}
    <div style="font-size:11.5px;color:#fde68a;margin-bottom:8px">Recompensa: 💎 ${sel.recompensa?.diamantes || 0}${sel.recompensa?.ouro ? ` · 🪙 ${sel.recompensa.ouro}` : ''}${sel.recompensa?.reliquiaRaridade ? ` · 🏺 Relíquia ${esc(sel.recompensa.reliquiaRaridade)}` : ''}${sel.recompensa?.tituloPerfil ? ` · 🏷️ ${esc(sel.recompensa.tituloPerfil)}` : ''}</div>
    <div class="ln">${acaoDe(sel)}</div>
  </div>` : '<div class="bl"><p class="mut">Nenhuma missão paralela corresponde ao filtro selecionado.</p></div>';

  return `<div class="bl">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
      <b>📜 Missões Paralelas · Capítulo ${capParalela}</b>
      <span class="tag">${concluidasCap}/${listaTotal.length} concluídas</span>
    </div>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px">${seletores}</div>
    <div style="display:flex;gap:4px;flex-wrap:wrap">${filtrosHtml}</div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:8px;align-items:start">
    <div class="bl" style="max-height:320px;overflow-y:auto;margin-bottom:0">${itensLista || '<p class="mut">Sem missões neste filtro.</p>'}</div>
    ${detalheHtml}
  </div>`;
}

export function tratarCliqueMissoes(d, { save, salvar, mostrarToast, render, tela, batalhaBloqueando, aliadosDoSave, setCapParalela, capParalela, st = {} }) {
  if (d.misAbrir === 'diarias') {
    window.regiao1?.idleUI?.abrirTemporada?.();
    return true;
  }
  if (d.misAbrir === 'diario') {
    window.regiao1?.idleUI?.abrirDiario?.();
    return true;
  }
  if (d.misCap) {
    setCapParalela(Number(d.misCap));
    render(true);
    return true;
  }
  if (d.misFiltro) {
    st.filtro = d.misFiltro;
    st.selId = null;
    render();
    return true;
  }
  if (d.misParSel) {
    st.selId = d.misParSel;
    render();
    return true;
  }
  if (d.misColetar) {
    const r = coletarMarco(save, d.misColetar);
    if (r.ok) { salvar(); mostrarToast(`🎁 Marco coletado: ${r.marco.titulo}`); render(); }
    else mostrarToast(r.motivo || 'Não disponível.');
    return true;
  }
  if (d.misColetarTudo) {
    const prontos = listarMarcos(save).filter((x) => x.pronto);
    let qtd = 0;
    for (const m of prontos) {
      if (coletarMarco(save, m.id).ok) qtd++;
    }
    if (qtd > 0) { salvar(); mostrarToast(`🎁 ${qtd} marco(s) coletado(s)!`); render(); }
    else mostrarToast('Nenhum prêmio pronto para coletar.');
    return true;
  }
  if (d.misParIniciar) {
    const r = iniciarParalela(save, d.misParIniciar);
    if (r.ok) { salvar(); mostrarToast(`Missão iniciada: ${r.missao.titulo}`); render(); }
    else mostrarToast(r.motivo || 'Bloqueada.');
    return true;
  }
  if (d.misParAvancar) {
    const r = avancarEtapaParalela(save, d.misParAvancar);
    if (r.ok) {
      salvar();
      mostrarToast(r.concluida ? '🏆 Missão paralela concluída!' : '✓ Etapa concluída!');
      render();
    } else mostrarToast(r.motivo || 'Não foi possível avançar.');
    return true;
  }
  if (d.misParLutar) {
    if (batalhaBloqueando?.()) { mostrarToast('Já existe uma batalha em andamento.'); return true; }
    const lista = listarParalelasCapitulo(save, capParalela);
    const p = lista.find((x) => x.id === d.misParLutar);
    const etapa = p?.etapaAtual;
    if (!etapa || etapa.tipo !== 'batalha') return true;
    const capPad = String(p.capitulo).padStart(2, '0');
    tela.abrir({
      titulo: `Missão · ${p.titulo}`,
      sub: etapa.texto || 'Batalha de missão paralela',
      arena: `assets/confusion/interface/estrategia/reinos/${capPad}/arena-chefe.webp`,
      aliados: aliadosDoSave(),
      inimigos: etapa.inimigos || [['Brumacervo', Math.max(5, p.capitulo * 12), p.recompensa?.reliquiaElemento || 'planta', {}]],
      ritmo: 420,
      regiao: p.capitulo,
      save,
      onFim: (venceu, _f, _m, resumo) => {
        if (venceu) {
          const r = avancarEtapaParalela(save, p.id, resumo || { venceu: true });
          if (r.ok) {
            salvar();
            mostrarToast(r.concluida ? '🏆 Missão paralela concluída!' : '✓ Batalha da missão vencida!');
          }
        } else {
          mostrarToast('Derrota na missão paralela. Tente novamente!');
        }
        render();
      },
    });
    return true;
  }
  return false;
}
