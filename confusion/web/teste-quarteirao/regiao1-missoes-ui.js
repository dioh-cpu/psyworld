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

export function renderizarPainelMissoes(save, aba, { capParalela = 1 } = {}) {
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

  // Aba 1: Paralelas por Capítulo
  const seletores = CAPITULOS_CAMPANHA_MINI.map((c) => `<button class="${c.capitulo === capParalela ? 'btn-pri' : 'btn-sec'}" data-mis-cap="${c.capitulo}" style="padding:4px 8px;font-size:11px">Cap.${c.capitulo}</button>`).join('');
  const lista = listarParalelasCapitulo(save, capParalela);
  const cards = lista.map((p) => {
    const etapaTxt = p.concluida
      ? '✓ Concluída'
      : p.etapaAtual
        ? `Etapa ${p.etapaIdx + 1}/${p.etapas.length}: ${p.etapaAtual.texto || p.etapaAtual.tipo}`
        : '';
    const acao = p.concluida
      ? '<span class="tag" style="color:#86efac">✓ Concluída</span>'
      : !p.desbloqueada
        ? `<span class="mut" style="font-size:11px">🔒 Vença a fase ${esc(p.faseRequisitoId)}</span>`
        : p.estado === 'disponivel'
          ? `<button class="btn-pri" data-mis-par-iniciar="${esc(p.id)}">▶ Iniciar</button>`
          : p.etapaAtual?.tipo === 'batalha'
            ? `<button class="btn-pri" data-mis-par-lutar="${esc(p.id)}">⚔️ Lutar etapa</button>`
            : `<button class="btn-pri" data-mis-par-avancar="${esc(p.id)}">✓ Avançar etapa</button>`;
    return `<div class="bl">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
        <div>
          <h4 style="margin:0">${esc(p.titulo)}</h4>
          <div class="mut" style="font-size:11.5px;margin-top:2px">${esc(etapaTxt)}</div>
          <div style="font-size:11px;color:#fde68a;margin-top:3px">💎 ${p.recompensa?.diamantes || 0} · 🏺 Relíquia ${esc(p.recompensa?.reliquiaRaridade || '')} · 🏷️ ${esc(p.recompensa?.tituloPerfil || '')}</div>
        </div>
        <div>${acao}</div>
      </div>
    </div>`;
  }).join('');

  return `<div class="bl">
    <div style="font-size:12px;font-weight:700;margin-bottom:6px">📜 Missões Paralelas · Capítulo ${capParalela}</div>
    <div style="display:flex;gap:4px;flex-wrap:wrap">${seletores}</div>
  </div>${cards || '<div class="bl"><p class="mut">Nenhuma paralela cadastrada para este capítulo.</p></div>'}`;
}

export function tratarCliqueMissoes(d, { save, salvar, mostrarToast, render, tela, batalhaBloqueando, aliadosDoSave, setCapParalela, capParalela }) {
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
      arena: `assets/confusion/interface/estrategia/reinos/${capPad}/cidade-conceito.webp`,
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
