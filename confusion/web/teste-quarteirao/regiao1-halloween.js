// Evento de Halloween (interface): Banner Mensal com contador e garantias, coleção e evolução com doces, Torre de 4 × 100 andares,
// Loja da Torre e poções de XP. Regras em regiao1-halloween-regras.js; dados em regiao1-halloween-dados.js.
import * as H from './regiao1-halloween-regras.js';
import { EDICAO, BANNER_HW, LINHAGENS_HW, LOJA_TORRE, TORRE, formaDoTier, BONUS_TIER, ARTES_HW, arteDoIndividuo } from './regiao1-halloween-dados.js';
import { POCOES, nivelDe, aplicarXp } from './regiao1-progressao.js';
import { KITS } from './regiao1-batalha-habilidades.js';
import { membrosFormacao } from './regiao1-exp-regras.js';
import { revelarInvocacao } from './regiao1-revelacao.js';

const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const FORMA = ['base', 'segunda', 'final'];
const COR = { 1: '#9ca3af', 2: '#60a5fa', 3: '#c084fc', 4: '#fbbf24', 5: '#f43f5e' };

export function iniciarHalloween({ getSave, salvar, mostrarToast, abrirModal, fecharModal, tela, batalhaBloqueando, questFeita }) {
  const save = () => getSave(), hw = () => H.hwDe(save());
  const css = document.createElement('style');
  css.textContent = `
    #modal-hw .hw-card { width: min(760px, 100%); max-height: calc(100dvh - 16px); overflow: hidden; display: flex; flex-direction: column; padding: 8px 12px; background: linear-gradient(#2a1630, #1c0f22); }
    #modal-hw .modal-head { position: static; margin-bottom: 4px; padding: 2px 0; } #modal-hw .modal-head h3 { flex: 1; margin: 0; color: #fb923c; }
    #modal-hw .abas { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 6px; } #modal-hw .abas button[aria-selected="true"] { background: #fb923c; color: #21110c; }
    #modal-hw .corpo { flex: 1 1 auto; min-height: 0; overflow-y: auto; } #modal-hw .bl { background: #3a1f3f; border: 1px solid #7c4a5a; border-radius: 8px; padding: 9px; margin-bottom: 7px; font-size: 12.5px; line-height: 1.45; } #modal-hw .bl h4 { margin: 0 0 4px; color: #fdba74; font-size: 13px; } #modal-hw .bl p { margin: 2px 0; }
    #modal-hw .ln { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 6px; } #modal-hw .mut { opacity: .7; } #modal-hw .ok { color: #4ade80; } #modal-hw .ruim { color: #fb7185; }
    #modal-hw .grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 6px; } #modal-hw .lin { background: #24112a; border-radius: 8px; padding: 6px; font-size: 11.5px; } #modal-hw .lin .ph { font-size: 34px; text-align: center; }
    #modal-hw .res { display: flex; flex-wrap: wrap; gap: 8px; }
    #modal-hw .res-card { width: 88px; text-align: center; font-size: 10.5px; line-height: 1.25; }
    #modal-hw .res-mold { position: relative; width: 88px; height: 110px; border-radius: 9px; border: 2px solid var(--cor-m, #9ca3af); background: radial-gradient(circle, #351b42, #180c20); display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 3px; }
    #modal-hw .res-mold.m5 { box-shadow: 0 0 12px #fbbf2488; animation: hw-ouro 1.8s ease-in-out infinite alternate; }
    @keyframes hw-ouro { from { box-shadow: 0 0 6px #fbbf2466; } to { box-shadow: 0 0 16px #f59e0bcc; } }
    #modal-hw .res-mold img.sp { width: 78%; height: 78%; object-fit: contain; z-index: 1; }
    #modal-hw .res-mold img.ov { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: fill; pointer-events: none; z-index: 2; }
    #modal-hw img.ph { display: block; width: 100%; height: 96px; object-fit: contain; } #modal-hw .ico { width: 20px; height: 20px; object-fit: contain; vertical-align: middle; } #modal-hw .capa { width: 100%; max-height: 150px; object-fit: cover; border-radius: 8px; display: block; margin-bottom: 6px; }
    #modal-hw table { width: 100%; border-collapse: collapse; font-size: 11.5px; } #modal-hw td, #modal-hw th { padding: 2px 4px; text-align: left; border-bottom: 1px solid #4a2a50; }`;
  document.head.append(css);
  const modal = document.createElement('div'); modal.id = 'modal-hw'; modal.className = 'modal-bg';
  modal.innerHTML = '<div class="modal-card hw-card" role="dialog" aria-modal="true"><header class="modal-head"><h3>🎃 Halloween</h3><button class="btn-fechar" id="hw-fechar" aria-label="Fechar">✕</button></header><nav class="abas" id="hw-abas"></nav><div class="corpo" id="hw-corpo"></div></div>';
  document.body.append(modal); const $ = (q) => modal.querySelector(q);
  const ABAS = ['Banner', 'Coleção', 'Torre', 'Loja', 'Poções'];
  let aba = 0, confirmar = null, ultimos = [], dif = 1, alvoPocao = 'domador', autoAvancar = false, emTorre = null;

  // Banner abre assim que a conta entra (com a edição ativa); a Torre continua pedindo "O que a maré devolveu"
  const liberado = () => H.eventoAtivo();
  const torreAberta = () => questFeita(TORRE.marco);
  const I = (p, cls = 'ico') => `<img class="${cls}" src="../../../${p}" alt="">`;
  const papelTxt = { defesa: 'Vanguarda', suporte: 'Suporte', ataque: 'Finalizador' };
  const ph = (lin, forma) => `<img class="ph" src="../../../${lin.arte[forma]}" alt="${esc(lin.especie)}" loading="lazy">`;

  function abaBanner() {
    const h = hw(), n = h.contador[EDICAO.id] || 0, m = H.proximosMarcos(n), comuns = save().idle.exp?.tickets || 0;
    let s = `<img class="capa" src="../../../${ARTES_HW.banner}" alt="Banner de Halloween"><div class="bl"><h4>${esc(EDICAO.nome)} · ${EDICAO.inicio} a ${EDICAO.fim}</h4><p>${I(ARTES_HW.ticket)} Tickets de Halloween: <b>${h.tickets}</b> <span class="mut">(tickets comuns da Campanha: ${comuns}, saldo separado)</span></p>
      <p>Contador desde o último Tier 5: <b>${n}</b> (total de invocações: ${h.total || 0}) · faltam <b>${m.ate10}</b> para a garantia de 10 (T3/T4), <b>${m.ate50}</b> para a de 50 (T4) e <b>${m.ate100}</b> para a de 100 (T5).</p>
      <div class="ln"><button class="btn-pri" data-inv="1" ${h.tickets >= 1 ? '' : 'disabled'}>Invocar 1</button><button class="btn-pri" data-inv="10" ${h.tickets >= 10 ? '' : 'disabled'}>Invocar 10</button>${confirmar === 'pacote' ? `<button class="btn-pri" data-pacote-ok="1">Confirmar: ${BANNER_HW.pacote.tickets} tickets por ${BANNER_HW.pacote.diamantes}💎</button><button class="btn-sec" data-cancelar="1">Cancelar</button>` : `<button class="btn-sec" data-pacote="1">Comprar ${BANNER_HW.pacote.tickets} tickets (${BANNER_HW.pacote.diamantes}💎)</button>`}</div>
      <p class="mut">Tier 5 também pode sair por sorte (3%); quando sai, a contagem reinicia. Tiers 3 e 4 não reiniciam. Tickets vêm dos marcos da Torre (5 a cada 10 andares) ou da compra. Os Oníricos obtidos continuam na coleção depois do evento; tickets e contador ficam guardados se a edição voltar.</p></div>`;
    if (ultimos.length) s += `<div class="bl"><h4>Resultado</h4><div class="res">${ultimos.map((r) => { const lin = LINHAGENS_HW.find((l) => l.especie === r.especie); const sp = lin ? lin.arte[formaDoTier(r.tier)] : ''; return `<div class="res-card" style="color:${COR[r.tier]}"><div class="res-mold ${r.tier >= 5 ? 'm5' : ''}" style="--cor-m:${COR[r.tier]}">${sp ? `<img class="sp" src="../../../${sp}" alt="${esc(r.especie)}">` : ''}<img class="ov" src="../../../assets/confusion/interface/banner/moldura-${r.tier}.png" alt="" onerror="this.style.display='none'"></div><b>#${r.pos} ${esc(r.especie)}</b><br>T${r.tier}${r.garantia ? ` · gar.${r.garantia}` : ''}</div>`; }).join('')}</div></div>`;
    s += `<div class="bl"><h4>Chances</h4><table><tr><th>Tier</th>${[1, 2, 3, 4, 5].map((t) => `<th>T${t}</th>`).join('')}</tr><tr><td>Normal</td>${[1, 2, 3, 4, 5].map((t) => `<td>${(BANNER_HW.chances[t] * 100).toFixed(0)}%</td>`).join('')}</tr><tr><td>A cada 10</td><td>–</td><td>–</td><td>${BANNER_HW.garantia10[3] * 100}%</td><td>${BANNER_HW.garantia10[4] * 100}%</td><td>–</td></tr><tr><td>A cada 50</td><td colspan="3"></td><td>100%</td><td></td></tr><tr><td>A cada 100</td><td colspan="4"></td><td>100%</td></tr></table></div>`;
    s += `<div class="bl"><h4>Oníricos exclusivos</h4><div class="grade">${LINHAGENS_HW.map((l) => `<div class="lin">${ph(l, 0)}<b style="color:${COR[l.tier]}">T${l.tier} · ${esc(l.especie)}</b><br><span class="mut">${papelTxt[l.papel]} · ${esc(l.elemento)}</span><p>${esc(l.resumo)}</p>${(KITS[l.especie] || []).map((k) => `<div>${k.icone} ${esc(k.nome)} <span class="mut">⟳${k.cd}</span></div>`).join('')}</div>`).join('')}</div></div>`;
    return s;
  }
  function abaColecao() {
    const eq = save().idle.equipe || [], h = hw();
    const lista = eq.map((m, i) => [m, i]).filter(([m]) => H.ehHW(m));
    let s = `<div class="bl"><h4>${I(ARTES_HW.doce)} Doces de Halloween: ${h.doces}</h4><p class="mut">Os exclusivos sobem de nível com XP e de tier só com doces (custos 1, 2, 3 e 5). Forma: base nos tiers 1–2, segunda nos 3–4 e final no 5. Doces guardados valem depois do evento.</p></div>`;
    if (!lista.length) return s + '<div class="bl"><p>Nenhum Onírico de Halloween ainda. Invoque no Banner.</p></div>';
    for (const [m, i] of lista) {
      const lin = LINHAGENS_HW.find((l) => l.especie === m.especie), inf = H.infoEvolucao(m), b0 = BONUS_TIER(m.tierHW), b1 = inf ? BONUS_TIER(inf.para) : null;
      s += `<div class="bl" style="display:grid;grid-template-columns:96px 1fr;gap:8px"><img class="ph" src="../../../${arteDoIndividuo(m)}" alt=""><div><h4 style="color:${COR[m.tierHW]}">${esc(m.especie)} · T${m.tierHW} · forma ${FORMA[formaDoTier(m.tierHW)]} · nv.${m.nivel || 1}</h4>`;
      if (!inf) s += '<p class="ok">Tier máximo.</p>';
      else s += `<p>Próxima forma: <b>${FORMA[inf.formaNova]}</b> ${inf.formaNova !== inf.formaAtual ? `<img src="../../../${inf.arteNova}" alt="próxima forma" style="height:56px;vertical-align:middle">` : '(mesma forma)'}</p><p>Custo: <b>${inf.custo}🍬</b> · ganho: vida +${Math.round((b1.hp - b0.hp) * 100)}%, ataque +${Math.round((b1.atk - b0.atk) * 100)}%, defesa +${Math.round((b1.def - b0.def) * 100)}%</p>
        <div class="ln">${confirmar === `evo:${i}` ? `<button class="btn-pri" data-evo-ok="${i}">Confirmar evolução (−${inf.custo}🍬)</button><button class="btn-sec" data-cancelar="1">Cancelar</button>` : `<button class="btn-pri" data-evo="${i}" ${h.doces >= inf.custo ? '' : 'disabled'}>Evoluir para T${inf.para}</button>`}</div>`;
      s += '</div></div>'; void lin;
    }
    return s;
  }
  function equipeTorre() { return membrosFormacao(save().idle).map(({ m, vaga }) => ({ especie: m.especie, nivel: m.nivel || 1, bonus: H.bonusDoMembro(m), vaga, arte: arteDoIndividuo(m) })); }
  function abaTorre() {
    const h = hw(), t = h.torre;
    if (!torreAberta()) return `<img class="capa" src="../../../${ARTES_HW.torre}" alt="Torre"><div class="bl"><h4>🔒 Torre de Halloween</h4><p>Conclua a missão "O que a maré devolveu" na Campanha para abrir a Torre.</p></div>`;
    let s = `<img class="capa" src="../../../${ARTES_HW.torre}" alt="Torre"><div class="bl"><h4>Torre de Halloween</h4><p>Quatro dificuldades de 100 andares. A primeira vitória em cada múltiplo de 10 dá <b>5 Tickets de Halloween</b> (50 por dificuldade, 200 no total). Vencer o andar 100 libera a próxima dificuldade.</p><div class="ln">${TORRE.dificuldades.map((d, k) => `<button class="${dif === k + 1 ? 'btn-pri' : 'btn-sec'}" data-dif="${k + 1}" ${k + 1 <= t.liberada ? '' : 'disabled'}>${k + 1 <= t.liberada ? '' : '🔒 '}Dificuldade ${k + 1} (nv. ${d.nivel[0]}–${d.nivel[1]})</button>`).join('')}</div></div>`;
    const maior = t.maior[dif] || 0, prox = Math.min(100, maior + 1), a = H.andar(dif, prox), rec = H.proximaRecompensa(save(), dif);
    const nvEq = Math.max(...equipeTorre().map((m) => m.nivel));
    s += `<div class="bl"><h4>Dificuldade ${dif} · andar ${prox}${maior >= 100 ? ' (concluída)' : ''}</h4><p>Maior andar vencido: <b>${maior}</b>/100 · nível recomendado: <b>${a.recomendado}</b> · sua equipe: nv. ${nvEq} ${nvEq + 5 < a.recomendado ? '<span class="ruim">(abaixo do recomendado)</span>' : ''}</p>
      <p>Inimigos: ${a.inimigos.length} (até 4 em campo, ${Math.max(0, a.inimigos.length - 4)} na fila)${a.marco ? ' · <b>andar de chefe</b>' : ''}</p>
      <p>Próxima recompensa: ${rec ? `🎫 ${rec.tickets} tickets no andar ${rec.andar}` : 'marcos desta dificuldade já pagos'} · chance de 🍬 (${(0.01 * 100).toFixed(0)}% por andar) e de poção de XP.</p>
      <div class="ln"><button class="btn-pri" data-entrar="${prox}">Entrar no andar ${prox}</button><label><input type="checkbox" id="hw-auto" ${autoAvancar ? 'checked' : ''}> Avançar automaticamente</label></div></div>`;
    return s;
  }
  function abaLoja() {
    const h = hw();
    return `<img class="capa" src="../../../${ARTES_HW.loja}" alt="Loja"><div class="bl"><h4>Loja da Torre · saldo ${I(ARTES_HW.doce)} ${h.doces}</h4><p class="mut">Doces também evoluem os exclusivos: decida entre gastar aqui ou guardar.</p>${LOJA_TORRE.map((it) => `<p>${esc(it.nome)} — <b>${it.custo}🍬</b> <button class="btn-sec" data-loja="${it.id}" ${h.doces >= it.custo ? '' : 'disabled'}>Comprar</button></p>`).join('')}</div>`;
  }
  function abaPocoes() {
    const h = hw(), eq = save().idle.equipe || [];
    const alvos = [['domador', `Domador (nv.${nivelDe(save().idle.jogador.xp)})`], ...eq.map((m, i) => [String(i), `${m.especie} (nv.${m.nivel || 1})`])];
    let s = `<div class="bl"><h4>Poções de XP</h4><p class="mut">Caem em combate, saem da Oficina dos Reinos, das expedições e de missões. O XP excedente é preservado quando sobe vários níveis.</p><p>Alvo: <select id="hw-alvo">${alvos.map(([v, t]) => `<option value="${v}" ${v === alvoPocao ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></p></div>`;
    for (const [id, p] of Object.entries(POCOES)) {
      const n = h.pocoes[id] || 0, pv = H.previsaoPocao(save(), alvoPocao, id);
      s += `<div class="bl"><p>${I(ARTES_HW[id] || '', 'ico')} <b>${esc(p.nome)}</b> × ${n} · +${p.xp.toLocaleString('pt-BR')} XP</p>${pv ? `<p>Previsão: nível <b>${pv.antes} → ${pv.depois}</b> (+${pv.subiu}), sobra ${pv.sobra}/${pv.proximo} XP</p>` : ''}<div class="ln"><button class="btn-pri" data-pocao="${id}" ${n ? '' : 'disabled'}>Usar</button></div></div>`;
    }
    return s;
  }
  function render() {
    $('#hw-abas').innerHTML = ABAS.map((a, i) => `<button class="btn-sec" aria-selected="${i === aba}" data-aba="${i}">${a}</button>`).join('');
    $('#hw-corpo').innerHTML = (aba === 0 && ultimos.length ? `<div class="ln"><button class="btn-pri" data-rever-hw="1">🃏 ${reveladosHW.length && reveladosHW.every(Boolean) ? 'Rever cartas' : 'Revelar cartas'}</button></div>` : '') + [abaBanner, abaColecao, abaTorre, abaLoja, abaPocoes][aba]();
  }
  function abrir(a = aba) { if (batalhaBloqueando() || tela.aberta()) return; aba = a; confirmar = null; render(); abrirModal('modal-hw'); }

  // ---------- Torre: entrar com carregamento e arena em tela inteira ----------
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  async function entrarAndar(d, n) {
    fecharModal('modal-hw');
    const tr = document.getElementById('reinos-trans');
    if (tr) { tr.innerHTML = `<div style="font-size:20px">🎃 Torre de Halloween</div><div>Dificuldade ${d} · andar ${n}</div><div class="barra"><i style="width:0"></i></div>`; tr.classList.add('vis'); await espera(30); tr.classList.add('opaco'); await espera(250); const i = tr.querySelector('.barra i'); for (const v of [40, 80, 100]) { if (i) i.style.width = `${v}%`; await espera(180); } }
    lutar(d, n);
    if (tr) { tr.classList.remove('opaco'); await espera(350); tr.classList.remove('vis'); tr.innerHTML = ''; }
  }
  function lutar(d, n) {
    const a = H.andar(d, n); emTorre = { d, n };
    tela.abrir({
      titulo: () => `🎃 Torre · Dificuldade ${d}`, sub: () => `Andar ${n}/100 · recomendado nv.${a.recomendado}`, arena: a.arena, aliados: equipeTorre(), inimigos: a.inimigos, ritmo: 360,
      extraTopo: () => `<button data-hw-auto="1" class="${autoAvancar ? 'on' : ''}">Avançar auto</button><button data-min="1">Minimizar</button><button data-fugir="1">Sair</button>`,
      indicador: (b) => `🎃 Torre D${d} · andar ${n} · ${b.fim ? (b.fim === 'vitoria' ? 'vitória' : 'derrota') : 'em combate'}`,
      onBotao: (ds, { render: r }) => { if (ds.hwAuto) { autoAvancar = !autoAvancar; r(); return true; } return false; },
      autoContinuar: (b) => autoAvancar && b.fim === 'vitoria',
      onFim: (venceu) => {
        // XP da equipe em campo (vitória inteira; derrota rende 30%), sem teto e preservando o excedente
        const xp = Math.round((40 + 12 * a.nivel) * (venceu ? 1 : 0.3)); for (const { m } of membrosFormacao(save().idle)) aplicarXp(m, xp);
        if (!venceu) { emTorre = null; mostrarToast(`Derrota no andar ${n}. Fortaleça a equipe e tente de novo.`, 3200); salvar(); abrir(2); return; }
        const r = H.vencerAndar(save(), d, n);
        let doces = 0; for (let k = 0; k < a.inimigos.length; k++) doces += H.talvezDoce(save(), 'abate');
        salvar();
        const msg = [`Andar ${n} vencido!`, r.tickets ? `+${r.tickets} 🎫` : '', r.doce + doces ? `+${r.doce + doces} 🍬` : '', r.pocao ? `+1 ${POCOES[r.pocao].nome}` : '', r.liberou ? `Dificuldade ${r.liberou} liberada!` : ''].filter(Boolean).join(' · ');
        mostrarToast(msg, 3800);
        if (autoAvancar && n < 100) setTimeout(() => lutar(d, n + 1), 600); else { emTorre = null; abrir(2); }
      },
    });
  }

  // Revelação animada do resultado gravado (cartas de costas; reabre com o que já foi revelado)
  let reveladosHW = [];
  function revelarHW() {
    if (!ultimos.length) return; if (reveladosHW.length !== ultimos.length) reveladosHW = ultimos.map(() => false);
    const cartas = ultimos.map((r) => { const lin = LINHAGENS_HW.find((l) => l.especie === r.especie); return { especie: r.especie, tier: r.tier, arte: lin ? lin.arte[formaDoTier(r.tier)] : '', elemento: lin?.elemento }; });
    revelarInvocacao({ edicao: 'halloween', titulo: `${EDICAO.nome} · ${cartas.length > 1 ? `lote de ${cartas.length}` : 'invocação'}`, cartas, revelados: reveladosHW, aoRevelar: (i) => { reveladosHW[i] = true; } }).then(() => render());
  }
  modal.addEventListener('click', (e) => {
    const t = e.target.closest('button, input'); if (!t) return; const d = t.dataset;
    if (t.id === 'hw-fechar') { fecharModal('modal-hw'); return; }
    if (d.aba !== undefined) { aba = Number(d.aba); confirmar = null; render(); return; }
    if (d.cancelar) { confirmar = null; render(); return; }
    if (d.inv) { const r = H.invocarHW(save(), Number(d.inv)); if (!r.ok) mostrarToast(r.motivo, 2800); else { ultimos = r.resultados; salvar(); revelarHW(); } render(); return; }
    if (d.reverHw) { revelarHW(); return; }
    if (d.pacote) { confirmar = 'pacote'; render(); return; }
    if (d.pacoteOk) { const r = H.comprarPacote(save(), true); mostrarToast(r.ok ? `+${BANNER_HW.pacote.tickets} Tickets de Halloween.` : r.motivo, 2800); confirmar = null; salvar(); render(); return; }
    if (d.evo) { confirmar = `evo:${d.evo}`; render(); return; }
    if (d.evoOk) { const r = H.evoluirHW(save(), Number(d.evoOk)); mostrarToast(r.ok ? `Evoluiu para T${r.para}!` : r.motivo, 2800); confirmar = null; salvar(); render(); return; }
    if (d.dif) { dif = Number(d.dif); render(); return; }
    if (t.id === 'hw-auto') { autoAvancar = t.checked; return; }
    if (d.entrar) { entrarAndar(dif, Number(d.entrar)); return; }
    if (d.loja) { const r = H.comprarLoja(save(), d.loja, { acelerador: () => { save().idle.aceleradores = (save().idle.aceleradores || 0) + 1; }, materiais: () => { const st = save().idle.estrategia?.r1; if (st) { st.materiais.madeira = (st.materiais.madeira || 0) + 20; st.materiais.pedra = (st.materiais.pedra || 0) + 20; } } }); mostrarToast(r.ok ? `Comprado: ${r.item.nome}` : r.motivo, 2600); salvar(); render(); return; }
    if (d.pocao) { const r = H.usarPocao(save(), alvoPocao, d.pocao); mostrarToast(r.ok ? `Nível ${r.antes} → ${r.depois} (sobra ${r.sobra} XP)` : r.motivo, 3000); salvar(); render(); }
  });
  modal.addEventListener('change', (e) => { if (e.target.id === 'hw-alvo') { alvoPocao = e.target.value; render(); } });

  // poções fabricadas na Oficina dos Reinos vão para a mochila
  setInterval(() => {
    const est = save().idle?.estrategia || {}; let mov = 0;
    for (const s of Object.values(est)) for (const [k, v] of Object.entries(s.gestao?.itens || {})) if (k.startsWith('pocao_xp') && v > 0) { H.darPocao(save(), k, v); s.gestao.itens[k] = 0; mov += v; }
    if (mov) { salvar(); mostrarToast(`🧪 ${mov} poção(ões) de XP da Oficina foram para a mochila.`, 2600); }
  }, 2000);

  return {
    abrir, liberado, estado: hw, lutar, emTorre: () => emTorre,
    navHtml: () => (liberado() ? '<button class="btn-hud" data-nav="halloween">🎃 Halloween</button>' : ''),
    aoAbater: () => { if (H.talvezDoce(save(), 'abate')) { salvar(); mostrarToast('🍬 Doce de Halloween!', 2000); } },
  };
}
