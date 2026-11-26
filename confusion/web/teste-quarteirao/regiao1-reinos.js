// Acesso aos reinos: botão "Reinos" (depois do marco da campanha que libera a gestão), seleção do reino, "Ir", transição, carregamento
// e mapa em tela cheia (modo Estratégia). Ao voltar, devolve o jogador ao ponto de onde saiu. C1 é a cidade da campanha.
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function iniciarReinos({ getSave, salvar, mostrarToast, abrirModal, fecharModal, getMapaId, getPosPx, voltarAoPonto, estrategia, liberado }) {
  const estilo = document.createElement('style');
  estilo.textContent = `
    #modal-reinos .rei-card { width: min(520px, 100%); max-height: calc(100dvh - 24px); overflow: auto; padding: 12px 14px; }
    #modal-reinos .rei-op { display: block; width: 100%; text-align: left; margin: 6px 0; padding: 9px 11px; border-radius: 10px; border: 1px solid var(--line, #6b4a52); background: #352238; color: inherit; font-size: 13px; }
    #modal-reinos .rei-op[aria-checked="true"] { border-color: #f3a458; background: #f3a45822; }
    #modal-reinos .rei-op[disabled] { opacity: .6; }
    #modal-reinos .rei-op small { display: block; opacity: .8; margin-top: 2px; }
    #reinos-trans { position: fixed; inset: 0; z-index: 60; background: #0d0713; color: #fff3e7; display: none; flex-direction: column; align-items: center; justify-content: center; gap: 12px; opacity: 0; transition: opacity .35s; font: 600 15px system-ui, sans-serif; text-align: center; padding: 20px; }
    #reinos-trans.vis { display: flex; } #reinos-trans.opaco { opacity: 1; }
    #reinos-trans .barra { width: min(320px, 70vw); height: 8px; background: #2b1a36; border-radius: 4px; overflow: hidden; } #reinos-trans .barra i { display: block; height: 100%; width: 0; background: #f3a458; transition: width .25s; }
    #reinos-trans small { opacity: .75; font-weight: 400; }`;
  document.head.append(estilo);

  const btn = document.createElement('button');
  btn.id = 'btn-reinos'; btn.className = 'btn-hud gold'; btn.style.display = 'none'; btn.textContent = '👑 Reinos';
  document.getElementById('btn-fazenda')?.before(btn);

  const modal = document.createElement('div');
  modal.id = 'modal-reinos'; modal.className = 'modal-bg';
  modal.innerHTML = '<div class="modal-card rei-card" role="dialog" aria-modal="true"><header class="modal-head"><h3>👑 Reinos</h3><button class="btn-fechar" id="rei-fechar" aria-label="Fechar">✕</button></header><div id="rei-corpo"></div></div>';
  document.body.append(modal);
  const trans = document.createElement('div'); trans.id = 'reinos-trans'; document.body.append(trans);
  let sel = null, indo = false;

  const aberto = () => Boolean(getSave().desbloqueios?.fazenda);
  const atualizarBotao = () => { btn.style.display = aberto() ? 'inline-flex' : 'none'; };
  setInterval(atualizarBotao, 1000); atualizarBotao();

  function desenhar() {
    const lista = estrategia().reinos();
    if (!sel || !lista.some((r) => r.id === sel && r.aberto)) sel = lista.find((r) => r.aberto)?.id || null;
    $('#rei-corpo').innerHTML = `<p style="font-size:12.5px;opacity:.85;margin:0 0 6px">Escolha um reino e toque em <b>Ir</b>. Você volta ao ponto da campanha de onde saiu.</p>
      <div class="rei-op" style="cursor:default;opacity:.8">📍 <b>C1 · Cidade (campanha)</b><small>Você está aqui. A campanha continua do ponto onde parou.</small></div>
      ${lista.map((r) => `<button class="rei-op" role="radio" aria-checked="${r.id === sel}" data-reino="${r.id}" ${r.aberto ? '' : 'disabled'}>${r.aberto ? '🗺️' : '🔒'} <b>${esc(r.titulo)}</b><small>${r.aberto ? 'Aberto' : `${esc(r.texto)} Progresso: ${r.progresso.atual}/${r.progresso.meta} terrenos`}</small></button>`).join('')}
      <div class="est-linha" style="display:flex;gap:6px;margin-top:8px"><button class="btn-pri" id="rei-ir" ${sel ? '' : 'disabled'}>Ir</button><button class="btn-sec" id="rei-cancelar">Cancelar</button></div>`;
  }
  const $ = (q) => modal.querySelector(q);
  function abrirSeletor() { if (!aberto() || indo) return; desenhar(); abrirModal('modal-reinos'); }
  btn.addEventListener('click', abrirSeletor);
  modal.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.id === 'rei-fechar' || t.id === 'rei-cancelar') { fecharModal('modal-reinos'); return; }
    if (t.dataset.reino) { sel = t.dataset.reino; desenhar(); return; }
    if (t.id === 'rei-ir') ir(sel);
  });

  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const carregarImagem = (url) => new Promise((r) => { const i = new Image(); i.onload = i.onerror = () => r(); i.src = url; });
  async function ir(id) {
    if (indo || !id) return; indo = true;
    const reino = estrategia().reinos().find((r) => r.id === id); if (!reino) { indo = false; return; }
    const [px, py] = getPosPx(); getSave().idle = getSave().idle || {};
    getSave().idle.retornoReino = { mapa: getMapaId(), px, py }; salvar();
    fecharModal('modal-reinos');
    trans.innerHTML = '<div id="rei-t-titulo">Viajando…</div>'; trans.classList.add('vis'); await espera(30); trans.classList.add('opaco'); await espera(380);
    trans.innerHTML = `<div style="font-size:20px">👑 ${esc(reino.titulo)}</div><div class="barra"><i id="rei-prog"></i></div><small id="rei-dica">Carregando o mapa…</small>`;
    const urls = [`../../../${reino.fundo}`]; const feitos = { n: 0 };
    const t0 = performance.now();
    await Promise.all(urls.map((u) => carregarImagem(u).then(() => { feitos.n += 1; })));
    const p = trans.querySelector('#rei-prog'); for (const v of [35, 70, 100]) { if (p) p.style.width = `${v}%`; await espera(260); }
    trans.querySelector('#rei-dica').textContent = 'Pronto!'; await espera(Math.max(0, 1100 - (performance.now() - t0)));
    estrategia().abrir(null, id);
    trans.classList.remove('opaco'); await espera(380); trans.classList.remove('vis'); trans.innerHTML = '';
    indo = false;
  }
  function voltar() {
    const r = getSave().idle?.retornoReino; if (!r) return;
    delete getSave().idle.retornoReino; salvar();
    voltarAoPonto(r); mostrarToast('📍 De volta à campanha, no ponto de onde você saiu.', 2600);
  }
  return { abrirSeletor, ir, voltar, indo: () => indo, botao: btn };
}
