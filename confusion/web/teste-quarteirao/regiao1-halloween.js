// Evento de Halloween (interface): Banner Mensal com contador e garantias, coleção e evolução com doces, Torre de 4 × 100 andares,
// Loja da Torre e poções de XP. Regras em regiao1-halloween-regras.js; dados em regiao1-halloween-dados.js.
import * as H from './regiao1-halloween-regras.js';
import { EDICAO, BANNER_HW, LINHAGENS_HW, LOJA_TORRE, TORRE, formaDoTier, BONUS_TIER, ARTES_HW, arteDoIndividuo } from './regiao1-halloween-dados.js';
import { POCOES, nivelDe, aplicarXp, tierDe, estrelasDe, faixaEstrela, bonusEstrelas, infoClasse } from './regiao1-progressao.js';
import { KITS } from './regiao1-batalha-habilidades.js';
import { membrosFormacao } from './regiao1-exp-regras.js';
import { revelarInvocacao } from './regiao1-revelacao.js';

const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const FORMA = ['base', 'segunda', 'final'];
const COR = { 1: '#9ca3af', 2: '#60a5fa', 3: '#c084fc', 4: '#fbbf24', 5: '#f43f5e' };
const fmtBonus = (b) => `vida +${Math.round((b.hp || 0) * 100)}%, ataque +${Math.round((b.atk || 0) * 100)}%, defesa +${Math.round((b.def || 0) * 100)}%`;
const htmlEstrelas = (n) => {
  const f = faixaEstrela(n);
  return `<span class="hw-est ${f.arcoIris ? 'arco' : ''}" style="--cor-est:${f.cor}">${'★'.repeat(f.nivelNaFaixa)}${'☆'.repeat(6 - f.nivelNaFaixa)} <b>${f.estrelas}★</b> (${esc(f.nome)})</span>`;
};

export function iniciarHalloween({ getSave, salvar, mostrarToast, abrirModal, fecharModal, tela, batalhaBloqueando, questFeita }) {
  const save = () => getSave(), hw = () => H.hwDe(save());
  const css = document.createElement('style');
  css.textContent = `
    #modal-hw .hw-card { width: min(1060px, 99vw); max-height: calc(100dvh - 10px); overflow: hidden; display: flex; flex-direction: column; padding: 7px 10px; background: linear-gradient(#24132b, #160c1f); }
    #modal-hw .modal-head { position: static; min-height: 0; margin-bottom: 4px; padding: 2px 2px; align-items: center; gap: 8px; } #modal-hw .modal-head h3 { flex: 1; margin: 0; font-size: clamp(15px, 2.6vw, 21px); color: #fb923c; }
    #modal-hw .abas { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 6px; flex-shrink: 0; } #modal-hw .abas button[aria-selected="true"] { background: #fb923c; color: #21110c; font-weight: 700; }
    #modal-hw .corpo { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; } #modal-hw .bl { background: #3a1f3f; border: 1px solid #7c4a5a; border-radius: 8px; padding: 9px; margin-bottom: 7px; font-size: 12.5px; line-height: 1.45; } #modal-hw .bl h4 { margin: 0 0 4px; color: #fdba74; font-size: 13.5px; } #modal-hw .bl p { margin: 2px 0; }
    #modal-hw .ln { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 6px; } #modal-hw .mut { opacity: .78; } #modal-hw .ok { color: #4ade80; } #modal-hw .ruim { color: #fb7185; }
    #modal-hw .hw-est { color: var(--cor-est, #facc15); font-weight: 600; }
    #modal-hw .hw-est.arco { background: linear-gradient(90deg, #facc15, #f472b6, #c084fc, #38bdf8, #4ade80); -webkit-background-clip: text; background-clip: text; color: transparent; }
    #modal-hw .hw-hero { display: flex; flex-direction: column; gap: 7px; margin-bottom: 8px; }
    #modal-hw .hw-topo { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
    #modal-hw .hw-pills { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    #modal-hw .hw-pill { display: inline-flex; align-items: center; gap: 4px; background: rgba(24,14,34,.88); border: 1px solid rgba(251,146,60,.4); border-radius: 9px; padding: 4px 9px; font-size: 11.5px; font-weight: 700; color: #fff3e7; }
    #modal-hw .hw-grid { display: grid; grid-template-columns: 136px 1fr; gap: 9px; align-items: stretch; }
    #modal-hw .hw-rail { display: flex; flex-direction: column; gap: 7px; }
    #modal-hw .hw-thumb { position: relative; width: 100%; height: 74px; border-radius: 10px; overflow: hidden; border: 2px solid #5a3466; background: #1e0f29; padding: 0; cursor: pointer; text-align: left; color: #fff7ed; }
    #modal-hw .hw-thumb.ativo { border-color: #fb923c; box-shadow: 0 0 0 2px rgba(251,146,60,.3); }
    #modal-hw .hw-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    #modal-hw .hw-thumb span { position: absolute; left: 0; right: 0; bottom: 0; padding: 3px 7px; font-size: 11px; font-weight: 700; background: linear-gradient(transparent, rgba(16,8,24,.92)); }
    #modal-hw .hw-main { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    #modal-hw .hw-stage { position: relative; border-radius: 11px; border: 1.5px solid #c26a3c; overflow: hidden; background: #140a1d url('../../../assets/confusion/interface/invocacao-v1/palco-halloween.webp') center 35% / cover no-repeat; min-height: 280px; display: flex; flex-direction: column; justify-content: space-between; padding: 9px 11px 8px; }
    #modal-hw .hw-stage.capa-modo { background-image: none; background-color: #100818; padding: 6px; justify-content: center; align-items: center; }
    #modal-hw .hw-stage::before { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(16,8,24,.68) 0%, rgba(16,8,24,0) 32%, rgba(16,8,24,.18) 72%, rgba(14,7,22,.84) 100%); pointer-events: none; z-index: 1; }
    #modal-hw .hw-stage.capa-modo::before { display: none; }
    #modal-hw .hw-capa-full { width: 100%; height: 264px; object-fit: contain; display: block; border-radius: 8px; }
    #modal-hw .hw-stage-head { position: relative; z-index: 3; display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; flex-wrap: wrap; }
    #modal-hw .hw-stage-head small { display: block; font-size: 10.5px; color: #fdba74; opacity: .92; }
    #modal-hw .hw-stage-head b { font-size: clamp(15px, 2.2vw, 22px); color: #fff7ed; font-family: Georgia, serif; text-shadow: 0 2px 8px #000; }
    #modal-hw .hw-elenco { position: relative; z-index: 3; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; align-items: end; margin-top: auto; padding-top: 4px; }
    #modal-hw .hw-ator { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; min-width: 0; }
    #modal-hw .hw-ator img { width: 100%; height: 150px; object-fit: contain; object-position: center bottom; filter: drop-shadow(0 6px 9px rgba(0,0,0,.78)); }
    #modal-hw .hw-ator.hw-hero-fig img { height: 184px; }
    #modal-hw .hw-ator-info { width: 100%; text-align: center; background: rgba(20,10,28,.84); border: 1px solid rgba(251,146,60,.3); border-radius: 7px; padding: 3px 4px; margin-top: 2px; line-height: 1.18; }
    #modal-hw .hw-ator-info b { display: block; font-size: 11px; color: #fff7ed; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    #modal-hw .hw-ator-info span { font-size: 9.5px; }
    #modal-hw .hw-bar { display: flex; align-items: center; justify-content: space-between; gap: 7px; flex-wrap: wrap; background: rgba(28,15,38,.92); border: 1px solid #7c4a5a; border-radius: 10px; padding: 6px 9px; }
    #modal-hw .hw-marcos { display: flex; flex-wrap: wrap; gap: 5px; }
    #modal-hw .hw-marco { background: rgba(18,9,26,.85); border: 1px solid #fb923c66; border-radius: 6px; padding: 3px 7px; font-size: 11px; }
    #modal-hw .hw-acoes { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
    @media (orientation: landscape) and (max-height: 500px) {
      #modal-hw .hw-card { padding: 4px 8px; }
      #modal-hw .modal-head { margin-bottom: 2px; padding: 0 2px; }
      #modal-hw .modal-head h3 { font-size: 14px; }
      #modal-hw .modal-head .btn-fechar { position: static; margin: 0; width: 28px; height: 28px; min-width: 28px; min-height: 28px; padding: 0; font-size: 14px; }
      #modal-hw .abas { margin-bottom: 3px; gap: 4px; }
      #modal-hw .abas button { min-height: 26px; padding: 2px 8px; font-size: 11px; }
      #modal-hw .hw-hero { gap: 4px; margin-bottom: 5px; }
      #modal-hw .hw-pill { padding: 2px 7px; font-size: 10px; }
      #modal-hw .hw-topo button { min-height: 24px; padding: 2px 7px !important; font-size: 10px !important; }
      #modal-hw .hw-grid { grid-template-columns: 104px 1fr; gap: 6px; }
      #modal-hw .hw-thumb { height: 48px; }
      #modal-hw .hw-thumb span { font-size: 9.5px; padding: 2px 5px; }
      #modal-hw .hw-stage { min-height: 146px; padding: 4px 7px 3px; }
      #modal-hw .hw-capa-full { height: 140px; }
      #modal-hw .hw-stage-head b { font-size: 13.5px; }
      #modal-hw .hw-stage-head small { font-size: 9px; }
      #modal-hw .hw-ator img { height: 78px; }
      #modal-hw .hw-ator.hw-hero-fig img { height: 96px; }
      #modal-hw .hw-ator-info { padding: 1px 3px; }
      #modal-hw .hw-ator-info b { font-size: 9.5px; }
      #modal-hw .hw-ator-info span { font-size: 8.5px; }
      #modal-hw .hw-bar { padding: 4px 6px; gap: 4px; }
      #modal-hw .hw-marco { padding: 2px 5px; font-size: 9.5px; }
      #modal-hw .hw-acoes button { min-height: 28px; padding: 3px 8px; font-size: 11px; }
    }
    @media (max-width: 560px) { #modal-hw .hw-grid { grid-template-columns: 1fr; } #modal-hw .hw-rail { flex-direction: row; } #modal-hw .hw-thumb { height: 54px; } }
    #modal-hw .grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(145px, 1fr)); gap: 7px; } #modal-hw .lin { background: #24112a; border: 1px solid #5a3466; border-radius: 8px; padding: 7px; font-size: 11.5px; } #modal-hw .lin .ph { font-size: 34px; text-align: center; }
    #modal-hw .res { display: flex; flex-wrap: wrap; gap: 8px; }
    #modal-hw .res-card { width: 96px; text-align: center; font-size: 10.5px; line-height: 1.25; }
    #modal-hw .res-mold { position: relative; width: 96px; height: 120px; border-radius: 9px; border: 2px solid var(--cor-m, #9ca3af); background: radial-gradient(circle, #351b42, #180c20); display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 3px; }
    #modal-hw .res-mold.m5 { box-shadow: 0 0 12px #fbbf2488; animation: hw-ouro 1.8s ease-in-out infinite alternate; }
    @keyframes hw-ouro { from { box-shadow: 0 0 6px #fbbf2466; } to { box-shadow: 0 0 16px #f59e0bcc; } }
    #modal-hw .res-mold img.sp { width: 82%; height: 82%; object-fit: contain; z-index: 1; }
    #modal-hw .res-mold img.ov { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: fill; pointer-events: none; z-index: 2; }
    #modal-hw img.ph { display: block; width: 100%; height: 114px; object-fit: contain; } #modal-hw .ico { width: 20px; height: 20px; object-fit: contain; vertical-align: middle; } #modal-hw .capa { width: 100%; max-height: 150px; object-fit: cover; object-position: center 25%; border-radius: 8px; display: block; margin-bottom: 6px; }
    #modal-hw table { width: 100%; border-collapse: collapse; font-size: 11.5px; } #modal-hw td, #modal-hw th { padding: 2px 4px; text-align: left; border-bottom: 1px solid #4a2a50; }`;
  document.head.append(css);
  const modal = document.createElement('div'); modal.id = 'modal-hw'; modal.className = 'modal-bg';
  modal.innerHTML = '<div class="modal-card hw-card" role="dialog" aria-modal="true"><header class="modal-head"><h3>🎃 Halloween</h3><button class="btn-fechar" id="hw-fechar" aria-label="Fechar">✕</button></header><nav class="abas" id="hw-abas"></nav><div class="corpo" id="hw-corpo"></div></div>';
  document.body.append(modal); const $ = (q) => modal.querySelector(q);
  const ABAS = ['Banner', 'Coleção', 'Torre', 'Loja', 'Poções'];
  let aba = 0, confirmar = null, ultimos = [], dif = 1, alvoPocao = 'domador', autoAvancar = false, emTorre = null, verCapaHW = false;

  // Banner abre assim que a conta entra (com a edição ativa); a Torre continua pedindo "O que a maré devolveu"
  const liberado = () => H.eventoAtivo();
  const torreAberta = () => questFeita(TORRE.marco);
  const I = (p, cls = 'ico') => `<img class="${cls}" src="../../../${p}" alt="">`;
  const INV_HW = (p) => `../../../assets/confusion/interface/invocacao-v1/${p}`;
  const ph = (lin, forma) => `<img class="ph" src="../../../${lin.arte[forma]}" alt="${esc(lin.especie)}" loading="lazy">`;

  function abaBanner() {
    const sv = save(), h = hw(), n = h.contador[EDICAO.id] || 0, m = H.proximosMarcos(n), comuns = sv.idle.exp?.tickets || 0;
    const gold = Number(sv.recompensas?.gold || 0).toLocaleString('pt-BR');
    const diamantes = Number(sv.recompensas?.diamantes || 0).toLocaleString('pt-BR');
    // Ordem real do elenco da edição com Abyssar (T5) centralizado
    const ordemHW = ['abobrisco', 'velalume', 'abyssar', 'mortalio', 'vitrarco'];
    const elencoHW = ordemHW.map((sl) => LINHAGENS_HW.find((l) => l.slug === sl)).filter(Boolean);
    let s = `<div class="hw-hero">
      <div class="hw-topo">
        <div class="hw-pills">
          <button class="btn-sec" data-hw-refugio="1" style="padding:4px 9px;font-size:11.5px">← Refúgio</button>
          <span class="hw-pill">🪙 ${gold}</span>
          <span class="hw-pill">💎 ${diamantes}</span>
          <span class="hw-pill"><img class="ico" src="${INV_HW('tickets/halloween.png')}" alt="">HW: ${h.tickets} <span class="mut" style="font-weight:400">(comuns: ${comuns})</span></span>
        </div>
        <button class="btn-sec" data-hw-capa="1" style="padding:4px 9px;font-size:11px">${verCapaHW ? 'Ver Elenco' : 'Ver Capa'}</button>
      </div>
      <div class="hw-grid">
        <div class="hw-rail" role="tablist" aria-label="Banners disponíveis">
          <button class="hw-thumb ativo" aria-selected="true"><img src="${INV_HW('miniaturas/halloween.webp')}" alt="Banner de Halloween"><span>Halloween</span></button>
          <button class="hw-thumb" data-hw-adventurer="1"><img src="${INV_HW('miniaturas/adventurer.webp')}" alt="Banner Permanente Adventurer"><span>Adventurer</span></button>
        </div>
        <div class="hw-main">
          <div class="hw-stage ${verCapaHW ? 'capa-modo' : ''}">
            ${verCapaHW
              ? `<img class="hw-capa-full" src="${INV_HW('capas/halloween.webp')}" alt="${esc(EDICAO.nome)}">`
              : `<div class="hw-stage-head"><div><small>Evento · ${EDICAO.inicio} a ${EDICAO.fim}</small><b>${esc(EDICAO.nome)}</b></div></div>
                 <div class="hw-elenco">${elencoHW.map((l) => `
                   <div class="hw-ator ${l.slug === 'abyssar' ? 'hw-hero-fig' : ''}">
                     <img src="${INV_HW(`elenco/${l.slug}.webp`)}" alt="${esc(l.especie)}" onerror="this.src='../../../${l.arte[l.tier >= 5 ? 2 : 0]}'">
                     <div class="hw-ator-info"><b>${esc(l.especie)}</b><span style="color:${COR[l.tier]}">T${l.tier} · ${esc(l.elemento)}</span></div>
                   </div>`).join('')}</div>`}
          </div>
          <div class="hw-bar">
            <div class="hw-marcos">
              <span class="hw-marco">T5: <b>${n}</b> (tot. ${h.total || 0})</span>
              <span class="hw-marco">10★ T3/T4: <b>${m.ate10}</b></span>
              <span class="hw-marco">50★ T4: <b>${m.ate50}</b></span>
              <span class="hw-marco">100★ T5: <b>${m.ate100}</b></span>
            </div>
            <div class="hw-acoes">
              <button class="btn-sec" data-inv="1" ${h.tickets >= 1 ? '' : 'disabled'}>Invocar ×1</button>
              <button class="btn-pri" data-inv="10" ${h.tickets >= 10 ? '' : 'disabled'}>Invocar ×10</button>
              ${confirmar === 'pacote' ? `<button class="btn-pri" data-pacote-ok="1">Confirmar ${BANNER_HW.pacote.tickets}t (${BANNER_HW.pacote.diamantes}💎)</button><button class="btn-sec" data-cancelar="1">Cancelar</button>` : `<button class="btn-sec" data-pacote="1">+${BANNER_HW.pacote.tickets} tickets (${BANNER_HW.pacote.diamantes}💎)</button>`}
            </div>
          </div>
        </div>
      </div>
    </div>`;
    if (ultimos.length) s += `<div class="bl"><h4>Resultado (${ultimos.length})</h4><div class="res">${ultimos.map((r) => { const lin = LINHAGENS_HW.find((l) => l.especie === r.especie); const sp = lin ? lin.arte[formaDoTier(r.tier)] : ''; const cls = infoClasse(lin?.classe || r.especie); return `<div class="res-card" style="color:${COR[r.tier]}"><div class="res-mold ${r.tier >= 5 ? 'm5' : ''}" style="--cor-m:${COR[r.tier]}">${sp ? `<img class="sp" src="../../../${sp}" alt="${esc(r.especie)}">` : ''}<img class="ov" src="../../../assets/confusion/interface/banner/moldura-${r.tier}.png" alt="" onerror="this.style.display='none'"></div><b>#${r.pos} ${esc(r.especie)}</b><br>T${r.tier} · ${r.estrelas || 1}★ · ${esc(cls.nome)}${r.garantia ? `<br>gar.${r.garantia}` : ''}</div>`; }).join('')}</div></div>`;
    s += `<div class="bl"><h4>Oníricos exclusivos da edição</h4><div class="grade">${LINHAGENS_HW.map((l) => { const cls = infoClasse(l.classe || l.especie); return `<div class="lin">${ph(l, 0)}<b style="color:${COR[l.tier]}">T${l.tier} · ${esc(l.especie)}</b><br><span class="mut">${cls.icone} ${esc(cls.nome)} · ${esc(l.elemento)}</span><p>${esc(l.resumo)}</p>${(KITS[l.especie] || []).map((k) => `<div>${k.icone} ${esc(k.nome)} <span class="mut">⟳${k.cd}</span></div>`).join('')}</div>`; }).join('')}</div></div>`;
    s += `<div class="bl"><h4>Chances e regras</h4><table><tr><th>Tier</th>${[1, 2, 3, 4, 5].map((t) => `<th>T${t}</th>`).join('')}</tr><tr><td>Normal</td>${[1, 2, 3, 4, 5].map((t) => `<td>${(BANNER_HW.chances[t] * 100).toFixed(0)}%</td>`).join('')}</tr><tr><td>A cada 10</td><td>–</td><td>–</td><td>${BANNER_HW.garantia10[3] * 100}%</td><td>${BANNER_HW.garantia10[4] * 100}%</td><td>–</td></tr><tr><td>A cada 50</td><td colspan="3"></td><td>100%</td><td></td></tr><tr><td>A cada 100</td><td colspan="4"></td><td>100%</td></tr></table><p class="mut" style="margin-top:4px">Tier 5 também pode sair por sorte (3%); quando sai, a contagem reinicia. Tickets e contador ficam guardados se a edição voltar.</p></div>`;
    return s;
  }
  function abaColecao() {
    const eq = save().idle.equipe || [], h = hw();
    const lista = eq.map((m, i) => [m, i]).filter(([m]) => H.ehHW(m));
    let s = `<div class="bl"><h4>${I(ARTES_HW.doce)} Doces de Halloween: ${h.doces}</h4><p class="mut">Os exclusivos sobem de nível com XP, de tier (1–5) com doces e de estrelas (1–30) separadamente. Forma: base nos tiers 1–2, segunda nos 3–4 e final no 5.</p></div>`;
    if (!lista.length) return s + '<div class="bl"><p>Nenhum Onírico de Halloween ainda. Invoque no Banner.</p></div>';
    for (const [m, i] of lista) {
      const lin = LINHAGENS_HW.find((l) => l.especie === m.especie), inf = H.infoEvolucao(m);
      const t = tierDe(m), est = estrelasDe(m), cls = infoClasse(lin?.classe || m.especie);
      const b0 = BONUS_TIER(t), bEst = bonusEstrelas(est), b1 = inf ? BONUS_TIER(inf.para) : null;
      s += `<div class="bl" style="display:grid;grid-template-columns:112px 1fr;gap:10px"><img class="ph" src="../../../${arteDoIndividuo(m)}" alt=""><div><h4 style="color:${COR[t]}">${esc(m.especie)} · T${t} · forma ${FORMA[formaDoTier(t)]} · nv.${m.nivel || 1}</h4>
        <p>${cls.icone} Classe: <b>${esc(cls.nome)}</b> · Elemento: <b>${esc(lin?.elemento || 'neutro')}</b> · Estrelas: ${htmlEstrelas(est)}</p>
        <p class="mut">Bônus Tier T${t}: ${fmtBonus(b0)} · Bônus ${est}★: ${fmtBonus(bEst)}</p>`;
      if (!inf) s += '<p class="ok">Tier máximo (T5).</p>';
      else s += `<p>Próxima forma: <b>${FORMA[inf.formaNova]}</b> ${inf.formaNova !== inf.formaAtual ? `<img src="../../../${inf.arteNova}" alt="próxima forma" style="height:64px;vertical-align:middle">` : '(mesma forma)'}</p><p>Custo: <b>${inf.custo}🍬</b> · ganho de tier: vida +${Math.round((b1.hp - b0.hp) * 100)}%, ataque +${Math.round((b1.atk - b0.atk) * 100)}%, defesa +${Math.round((b1.def - b0.def) * 100)}%</p>
        <div class="ln">${confirmar === `evo:${i}` ? `<button class="btn-pri" data-evo-ok="${i}">Confirmar evolução (−${inf.custo}🍬)</button><button class="btn-sec" data-cancelar="1">Cancelar</button>` : `<button class="btn-pri" data-evo="${i}" ${h.doces >= inf.custo ? '' : 'disabled'}>Evoluir para T${inf.para}</button>`}</div>`;
      s += '</div></div>';
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
  function render(zerarScroll = false) {
    $('#hw-abas').innerHTML = ABAS.map((a, i) => `<button class="btn-sec" aria-selected="${i === aba}" data-aba="${i}">${a}</button>`).join('');
    $('#hw-corpo').innerHTML = (aba === 0 && ultimos.length ? `<div class="ln"><button class="btn-pri" data-rever-hw="1">🃏 ${reveladosHW.length && reveladosHW.every(Boolean) ? 'Rever cartas' : 'Revelar cartas'}</button></div>` : '') + [abaBanner, abaColecao, abaTorre, abaLoja, abaPocoes][aba]();
    if (zerarScroll) $('#hw-corpo').scrollTop = 0;
  }
  function abrir(a = aba) {
    if (emTorre && tela.ativa() && tela.minimizada()) { tela.restaurar(); return; } // voltar à Torre reabre a arena da luta em segundo plano
    if (batalhaBloqueando() || tela.aberta()) return; aba = a; confirmar = null; verCapaHW = false; render(true); abrirModal('modal-hw');
  }

  // ---------- Torre: entrar com carregamento e arena em tela inteira ----------
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  async function entrarAndar(d, n) {
    fecharModal('modal-hw');
    const tr = document.getElementById('reinos-trans');
    if (tr) { tr.innerHTML = `<div style="font-size:20px">🎃 Torre de Halloween</div><div>Dificuldade ${d} · andar ${n}</div><div class="barra"><i style="width:0"></i></div>`; tr.classList.add('vis'); await espera(30); tr.classList.add('opaco'); await espera(250); const i = tr.querySelector('.barra i'); for (const v of [40, 80, 100]) { if (i) i.style.width = `${v}%`; await espera(180); } }
    lutar(d, n);
    if (tr) { tr.classList.remove('opaco'); await espera(350); tr.classList.remove('vis'); tr.innerHTML = ''; }
  }
  function lutar(d, n, minimizada = false) {
    const a = H.andar(d, n); emTorre = { d, n };
    tela.abrir({
      titulo: () => `🎃 Torre · Dificuldade ${d}`, sub: () => `Andar ${n}/100 · recomendado nv.${a.recomendado}`, arena: a.arena, aliados: equipeTorre(), inimigos: a.inimigos, ritmo: 360,
      extraTopo: () => `<button data-hw-auto="1" class="${autoAvancar ? 'on' : ''}">Avançar auto</button><button data-min="1">Minimizar</button><button data-fugir="1">Sair</button>`,
      indicador: (b) => `🎃 Torre D${d} · andar ${n} · ${b.fim ? (b.fim === 'vitoria' ? 'vitória' : 'derrota') : 'em combate'}`,
      onBotao: (ds, { render: r }) => { if (ds.hwAuto) { autoAvancar = !autoAvancar; r(); return true; } return false; },
      autoContinuar: (b) => autoAvancar && b.fim === 'vitoria',
      iniciarMinimizada: minimizada, // o avanço automático continua minimizado se a luta anterior estava minimizada
      notificarFim: (b) => mostrarToast(b.fim === 'vitoria' ? `🎃 Andar ${n} vencido. Toque no indicador para ver o resultado.` : `💀 Derrota no andar ${n}. Toque no indicador ou volte à Torre.`, 6000),
      onFim: (venceu, _frac, mini) => {
        // XP da equipe em campo (vitória inteira; derrota rende 30%), sem teto e preservando o excedente
        const xp = Math.round((40 + 12 * a.nivel) * (venceu ? 1 : 0.3)); for (const { m } of membrosFormacao(save().idle)) aplicarXp(m, xp);
        if (!venceu) { emTorre = null; mostrarToast(`Derrota no andar ${n}. Fortaleça a equipe e tente de novo.`, 3200); salvar(); abrir(2); return; }
        const r = H.vencerAndar(save(), d, n);
        let doces = 0; for (let k = 0; k < a.inimigos.length; k++) doces += H.talvezDoce(save(), 'abate');
        salvar();
        const msg = [`Andar ${n} vencido!`, r.tickets ? `+${r.tickets} 🎫` : '', r.doce + doces ? `+${r.doce + doces} 🍬` : '', r.pocao ? `+1 ${POCOES[r.pocao].nome}` : '', r.liberou ? `Dificuldade ${r.liberou} liberada!` : ''].filter(Boolean).join(' · ');
        mostrarToast(msg, 3800);
        if (autoAvancar && n < 100) setTimeout(() => lutar(d, n + 1, Boolean(mini)), 600); else { emTorre = null; abrir(2); }
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
    if (d.hwRefugio) { fecharModal('modal-hw'); window.regiaoExp?.abrir?.('descanso'); return; }
    if (d.hwAdventurer) { fecharModal('modal-hw'); window.regiaoExp?.abrir?.('oniricos'); return; }
    if (d.hwCapa) { verCapaHW = !verCapaHW; render(); return; }
    if (d.aba !== undefined) { aba = Number(d.aba); confirmar = null; render(true); return; }
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
