// Seletor das 12 Regiões (Expansão 1): mostra faixa de nível, cadeado, progresso de desbloqueio,
// status de primeira vitória e viagem direta para regiões jogáveis desbloqueadas (R1 e R2).
import { listarRegioes, progressoMissoesRegiao2, garantirEstadoRegioes } from './regiao1-regioes-regras.js';

const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function iniciarSeletorRegioes({ getSave, salvar, mostrarToast, abrirModal, fecharModal, entrarNoMapa }) {
  const estilo = document.createElement('style');
  estilo.textContent = `
    #modal-regioes .reg-card { width: min(760px, 96vw); max-height: calc(100dvh - 20px); display: flex; flex-direction: column; overflow: hidden; padding: 12px 14px; }
    #modal-regioes .reg-corpo { overflow-y: auto; flex: 1 1 auto; min-height: 0; padding-right: 2px; }
    #modal-regioes .reg-resumo { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; font-size: 12px; opacity: .9; margin-bottom: 8px; padding: 7px 10px; border-radius: 9px; background: rgba(53,34,56,.75); border: 1px solid var(--line, #6b4a52); }
    #modal-regioes .reg-grade { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    @media (max-width: 560px) { #modal-regioes .reg-grade { grid-template-columns: 1fr; } }
    @media (max-height: 440px) {
      #modal-regioes .reg-card { padding: 8px 10px; }
      #modal-regioes .reg-grade { gap: 6px; }
      #modal-regioes .reg-item { padding: 7px 8px; }
    }
    #modal-regioes .reg-item { display: flex; flex-direction: column; gap: 4px; padding: 9px 10px; border-radius: 10px; border: 1px solid var(--line, #6b4a52); background: #2c1c32; font-size: 12px; }
    #modal-regioes .reg-item.atual { border-color: #f3a458; background: #3d243b; box-shadow: 0 0 0 1px #f3a45855; }
    #modal-regioes .reg-item.bloqueada { opacity: .72; background: #211528; }
    #modal-regioes .reg-topo { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
    #modal-regioes .reg-nv { font-size: 11px; padding: 2px 6px; border-radius: 999px; background: rgba(243,164,88,.18); color: #fcd34d; white-space: nowrap; }
    #modal-regioes .reg-meta { font-size: 11px; opacity: .85; line-height: 1.35; }
    #modal-regioes .reg-barra { height: 5px; border-radius: 4px; background: rgba(255,255,255,.1); overflow: hidden; margin-top: 2px; }
    #modal-regioes .reg-barra i { display: block; height: 100%; background: linear-gradient(90deg, #f59e0b, #4ade80); }
    #modal-regioes .reg-rod { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: 4px; }
    #modal-regioes .reg-missoes { margin-bottom: 8px; padding: 8px 10px; border-radius: 9px; background: rgba(245,158,11,.1); border: 1px solid rgba(245,158,11,.35); font-size: 11.5px; }
    #modal-regioes .reg-missoes b { color: #fcd34d; }
  `;
  document.head.append(estilo);

  // Atalho no Menu Principal
  const atalhos = document.querySelector('#modal-menu .menu-atalhos');
  if (atalhos && !document.getElementById('m-regioes')) {
    const btnMenu = document.createElement('button');
    btnMenu.className = 'btn-sec';
    btnMenu.id = 'm-regioes';
    btnMenu.textContent = '🗺️ Regiões (12)';
    btnMenu.addEventListener('click', () => { fecharModal('modal-menu'); abrir(); });
    atalhos.prepend(btnMenu);
  }

  const modal = document.createElement('div');
  modal.id = 'modal-regioes';
  modal.className = 'modal-bg';
  modal.innerHTML = `
    <div class="modal-card reg-card" role="dialog" aria-modal="true" aria-label="Seletor de Regiões">
      <header class="modal-head modal-head-fixo">
        <h3>🗺️ Regiões do Mundo (1–12)</h3>
        <button class="btn-fechar" id="reg-fechar" aria-label="Fechar">✕</button>
      </header>
      <div id="reg-corpo" class="reg-corpo"></div>
    </div>`;
  document.body.append(modal);

  function desenhar() {
    const save = getSave();
    const lista = listarRegioes(save);
    const abertas = lista.filter((r) => r.desbloqueada).length;
    const r2Liberada = lista[1]?.desbloqueada;
    const missoesR2 = r2Liberada ? progressoMissoesRegiao2(save) : [];
    const missoesHtml = r2Liberada ? `
      <div class="reg-missoes">
        <b>🐝 Missões da Região 2 · Altos do Âmbar:</b>
        ${missoesR2.map((m) => `<div>${m.concluida ? '✅' : '▫️'} ${esc(m.titulo)}${m.metaAbates && !m.concluida ? ` (${m.abates}/${m.metaAbates})` : ''}</div>`).join('')}
      </div>` : '';

    const corpo = modal.querySelector('#reg-corpo');
    corpo.innerHTML = `
      <div class="reg-resumo">
        <span>Desbloqueadas: <b>${abertas}/12</b> · Jogáveis agora: <b>Regiões 1 e 2</b></span>
        <span>Derrote o chefe de cada região para liberar a seguinte.</span>
      </div>
      ${missoesHtml}
      <div class="reg-grade">
        ${lista.map((r) => {
          const pct = Math.round((r.progresso.feitos / Math.max(1, r.progresso.total)) * 100);
          const icone = r.atual ? '📍' : r.desbloqueada ? '🔓' : '🔒';
          const badgeRec = r.primeiraVitoriaPaga
            ? '🏆 1ª vitória recebida'
            : `🎁 1ª vitória: ${r.recompensaPrimeiraVitoria.gold}g · ${r.recompensaPrimeiraVitoria.diamantes}💎`;
          const btn = !r.desbloqueada
            ? '<button class="btn-sec" disabled>🔒 Bloqueada</button>'
            : !r.jogavel
              ? '<button class="btn-sec" disabled>🗺️ Em breve</button>'
              : r.atual
                ? `<button class="btn-sec" data-ir-regiao="${r.id}">Ir à entrada</button>`
                : `<button class="btn-pri" data-ir-regiao="${r.id}">Ir para R${r.numero}</button>`;
          return `<div class="reg-item ${r.atual ? 'atual' : ''} ${r.desbloqueada ? '' : 'bloqueada'}" data-regiao-id="${r.id}">
            <div class="reg-topo">
              <strong>${icone} R${r.numero} · ${esc(r.nome)}</strong>
              <span class="reg-nv">Nv. ${r.faixaNivel[0]}–${r.faixaNivel[1]}</span>
            </div>
            <div class="reg-meta">👑 Chefe: <b>${esc(r.chefe.nome)}</b> (Nv. ${r.chefe.nivel})${r.chefeDerrotado ? ' · ✅ Derrotado' : ''}</div>
            <div class="reg-meta">${esc(r.progresso.texto)}</div>
            <div class="reg-barra" aria-hidden="true"><i style="width:${pct}%"></i></div>
            <div class="reg-rod">
              <span class="reg-meta">${badgeRec}</span>
              ${btn}
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }

  function abrir() {
    desenhar();
    abrirModal('modal-regioes');
  }

  modal.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.id === 'reg-fechar') { fecharModal('modal-regioes'); return; }
    const id = btn.dataset.irRegiao;
    if (!id) return;
    const save = getSave();
    const reg = listarRegioes(save).find((r) => r.id === id);
    if (!reg || !reg.desbloqueada || !reg.jogavel || !reg.mapaEntrada) return;
    const st = garantirEstadoRegioes(save);
    st.atual = reg.id;
    salvar?.();
    fecharModal('modal-regioes');
    await entrarNoMapa(reg.mapaEntrada, null, true);
    mostrarToast?.(`🗺️ Chegou à Região ${reg.numero}: ${reg.nome}!`, 3200);
  });

  return { abrir, desenhar };
}
