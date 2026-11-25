// Modo Estratégia (interface). Regras em regiao1-estrategia-regras.js e dados por cidade em regiao1-estrategia-c1.js.
// Mapa da cidade com locais de construção, cinco menus (Aldeias, Refúgios, Exércitos, Hospitais, Expedições), combate 6 contra 6 por
// turnos, controles independentes (Atacar automaticamente / Próxima fase / Avançar automaticamente) e expedição minimizada.
// Estado salvo em save.idle.estrategia[id]. Cada recompensa de vitória é paga uma única vez (exp.pagas).
import { criarRng, criarUnidade, gerarInimigos, criarBatalha, atorAtual, executar, decidir, novaExpedicao, pagarFase, custoDoNivel, falta, construir, prosperidade, bonusDaCidade, dificuldadeDaFase } from './regiao1-estrategia-regras.js';

const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const PAPEL = { ataque: { i: '⚔️', n: 'Ataque' }, defesa: { i: '🛡️', n: 'Defesa' }, suporte: { i: '💚', n: 'Suporte' } };

export function iniciarEstrategia({ dados: D, getSave, salvar, mostrarToast, abrirModal, fecharModal, atualizarHud }) {
  const rng = criarRng(Date.now() % 100000);
  let batalha = null;       // só em memória: ao recarregar, a fase recomeça
  let ritmoMs = 650;
  let aba = 'aldeias', visao = 'cidade', slotSel = null, confirmar = null, alvoSel = null, minimizado = false;
  let timerTick = null, timerProx = null;

  // ---------- estado ----------
  const estado = () => {
    const idle = getSave().idle || (getSave().idle = {});
    idle.estrategia = idle.estrategia || {};
    const s = idle.estrategia[D.id] || (idle.estrategia[D.id] = { materiais: { ...D.inicial }, estruturas: {}, exp: null, recrutados: {}, historico: [], vagas: D.vagasIniciais || 2, inimigosLiberados: {} });
    s.materiais = { ...D.inicial, ...s.materiais }; s.estruturas = s.estruturas || {}; s.recrutados = s.recrutados || {}; s.historico = s.historico || []; s.vagas = Math.max(1, Math.min(6, s.vagas || D.vagasIniciais || 2)); s.inimigosLiberados = s.inimigosLiberados || {};
    return s;
  };
  const roster = () => (getSave().idle.equipe || []).map((m, i) => ({ id: `m${i}`, especie: m.especie, nivel: m.nivel || 1 }));
  const diario = (t) => { const meta = window.regiaoMundo?.estado?.().meta; if (!meta) return; meta.diario = meta.diario || []; meta.diario.push({ dia: meta.dia, t: `${D.titulo}: ${t}` }); if (meta.diario.length > 150) meta.diario = meta.diario.slice(-150); };
  const rotaDe = (id) => D.rotas.find((r) => r.id === id);
  const estrDe = (id) => D.estruturas.find((e) => e.id === id);
  const custoTxt = (c) => Object.entries(c).map(([k, v]) => `${D.materiais[k]?.icone || ''} ${v} ${D.materiais[k]?.nome || k}`).join(' · ');
  const artUrl = (v) => { const a = v.arte || v; return a.estr ? `../../../assets/confusion/interface/estrategia/${a.estr}.webp` : `../../../assets/confusion/interface/mundo/${a.sis}/${a.vaga}.webp`; };
  const img = (a, emoji, nome, cls = '') => `<span class="est-arte ${cls}"><img src="${artUrl(a)}" alt="${esc(nome)}" onerror="this.parentNode.innerHTML='<span class=&quot;est-poli&quot;>${emoji}</span>'"></span>`;

  // ---------- DOM ----------
  const estilo = document.createElement('style');
  estilo.textContent = `
    #modal-estrategia .est-card { width: min(1200px, 100%); max-height: calc(100dvh - 20px); overflow: hidden; display: flex; flex-direction: column; padding: 10px 14px; }
    #modal-estrategia .modal-head { position: static; flex: 0 0 auto; margin-bottom: 6px; min-height: 0; padding: 4px 0; align-items: center; }
    #modal-estrategia [hidden] { display: none !important; }
    #modal-estrategia b { color: var(--gold, #f3c27a); }
    #modal-estrategia .est-topo { flex: 0 0 auto; display: flex; flex-wrap: wrap; gap: 4px 14px; align-items: center; font-size: 12.5px; margin-bottom: 6px; }
    #modal-estrategia .est-barra { width: 130px; height: 8px; background: #24162b; border-radius: 4px; overflow: hidden; display: inline-block; vertical-align: middle; }
    #modal-estrategia .est-barra i { display: block; height: 100%; background: #f3a458; }
    #modal-estrategia .est-corpo { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 10px; }
    @media (orientation: portrait), (max-width: 700px) { #modal-estrategia .est-corpo { grid-template-columns: 1fr; overflow-y: auto; } }
    #modal-estrategia .est-mapa { position: relative; min-height: 200px; border-radius: 8px; overflow: hidden; background: #24162b center / cover; border: 1px solid var(--line, #6b4a52); }
    #modal-estrategia .est-mapa::before { content: ''; position: absolute; inset: 0; background: rgba(20, 10, 30, .35); }
    #modal-estrategia .est-slot { position: absolute; transform: translate(-50%, -60%); display: flex; flex-direction: column; align-items: center; gap: 2px; background: none; border: 0; color: #fff3e7; cursor: pointer; font: 700 11px system-ui, sans-serif; text-shadow: 0 1px 4px #000; padding: 2px; }
    #modal-estrategia .est-slot.sel .est-arte { outline: 2px solid #f3a458; outline-offset: 2px; border-radius: 10px; }
    #modal-estrategia .est-arte { display: block; width: var(--w, 76px); height: var(--w, 76px); }
    #modal-estrategia .est-arte img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 3px 5px #000a); }
    #modal-estrategia .est-poli { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 34px; background: #8e5b4755; border: 2px solid #8e5b47; clip-path: polygon(50% 4%, 94% 28%, 94% 72%, 50% 96%, 6% 72%, 6% 28%); }
    #modal-estrategia .est-lado { display: flex; flex-direction: column; min-height: 0; }
    #modal-estrategia .est-abas { flex: 0 0 auto; display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 6px; }
    #modal-estrategia .est-abas button[aria-selected="true"] { background: #f3a458; color: #21110c; border-color: #ffc78c; }
    #modal-estrategia .est-painel { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
    #modal-estrategia .est-bloco { background: #352238; border: 1px solid var(--line, #6b4a52); border-radius: 8px; padding: 9px; margin-bottom: 7px; font-size: 12.5px; line-height: 1.45; }
    #modal-estrategia .est-bloco h4 { margin: 0 0 4px; font-size: 13px; color: var(--gold, #f3c27a); }
    #modal-estrategia .est-bloco p { margin: 2px 0; }
    #modal-estrategia .est-linha { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    #modal-estrategia .est-linha button { min-height: 36px; font-size: 12px; }
    #modal-estrategia .muted { opacity: .7; }
    #modal-estrategia .ok { color: #4ade80; } #modal-estrategia .ruim { color: #fb7185; }
    #modal-estrategia .est-equipe { display: flex; flex-wrap: wrap; gap: 5px; margin: 5px 0; }
    #modal-estrategia .chip { border: 1px solid var(--line, #6b4a52); background: #24162b; color: inherit; border-radius: 8px; padding: 4px 7px; font-size: 11.5px; cursor: pointer; text-align: left; }
    #modal-estrategia .chip.on { background: #f3a45833; border-color: #f3a458; }
    #modal-estrategia .bat { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; gap: 6px; }
    #modal-estrategia .bat-lado { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 5px; }
    #modal-estrategia .un { background: #24162b; border: 1px solid var(--line, #6b4a52); border-radius: 8px; padding: 4px; font-size: 10.5px; text-align: center; min-width: 0; cursor: default; color: inherit; }
    #modal-estrategia .un.morto { opacity: .35; } #modal-estrategia .un.vez { outline: 2px solid #f3a458; } #modal-estrategia .un.alvo { outline: 2px solid #fb7185; }
    #modal-estrategia .un .hp { height: 5px; background: #12091a; border-radius: 3px; overflow: hidden; margin-top: 3px; } #modal-estrategia .un .hp i { display: block; height: 100%; background: #4ade80; }
    #modal-estrategia .un.i .hp i { background: #fb7185; }
    #modal-estrategia .bat-log { flex: 1 1 auto; min-height: 40px; overflow-y: auto; font-size: 11.5px; background: #24162b; border-radius: 6px; padding: 6px; }
    #modal-estrategia .bat-ctl { flex: 0 0 auto; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    #modal-estrategia .bat-ctl label { display: inline-flex; gap: 5px; align-items: center; font-size: 12px; background: #24162b; border-radius: 6px; padding: 5px 8px; }
    #estrategia-ind { position: fixed; left: 50%; top: 50px; transform: translateX(-50%); z-index: 8; display: none; align-items: center; gap: 8px; background: rgba(33,19,41,.95); border: 1px solid #c59c67; color: #fff3e7; border-radius: 99px; padding: 5px 8px 5px 12px; font: 600 12px system-ui, sans-serif; max-width: 94vw; }
    #estrategia-ind button { min-height: 28px; padding: 2px 9px; font-size: 11.5px; }`;
  document.head.append(estilo);

  const modal = document.createElement('div');
  modal.id = 'modal-estrategia'; modal.className = 'modal-bg';
  modal.innerHTML = `<div class="modal-card est-card" role="dialog" aria-modal="true">
    <header class="modal-head"><h3>Estratégia · ${esc(D.titulo)}</h3><button class="btn-fechar" id="est-fechar" aria-label="Fechar">✕</button></header>
    <div class="est-topo" id="est-topo"></div>
    <div class="est-corpo" id="est-corpo"><div class="est-mapa" id="est-mapa"></div><div class="est-lado"><nav class="est-abas" id="est-abas"></nav><div class="est-painel" id="est-painel"></div></div></div>
    <div class="bat" id="est-bat" hidden></div></div>`;
  document.body.append(modal);
  const ind = document.createElement('div'); ind.id = 'estrategia-ind'; document.body.append(ind);
  const $ = (id) => modal.querySelector(id);

  // ---------- topo e mapa ----------
  function proximaObra(s) {
    let melhor = null;
    for (const e of D.estruturas) {
      const locais = D.locais.filter((l) => l.categoria === e.categoria);
      for (const l of locais) {
        const at = s.estruturas[l.id]; const nivel = (at?.nivel || 0) + 1;
        if (nivel > e.niveis) continue;
        const custo = custoDoNivel(e, nivel), f = falta(custo, s.materiais);
        const total = Object.values(f).reduce((a, b) => a + b, 0);
        if (!melhor || total < melhor.total) melhor = { e, nivel, f, total };
      }
    }
    return melhor;
  }
  function desenharTopo() {
    const s = estado(), p = prosperidade(s, D), po = proximaObra(s);
    const mat = Object.entries(D.materiais).map(([k, m]) => `${m.icone} ${m.nome} <b>${s.materiais[k] || 0}</b>`).join(' · ');
    let obra = 'Todas as obras concluídas.';
    if (po) {
      const lista = Object.entries(po.f).map(([k, v]) => `${v} ${D.materiais[k].nome.toLowerCase()}`).join(' e ');
      const rota = Object.keys(po.f).length ? D.rotas.find((r) => r.material === Object.entries(po.f).sort((a, b) => b[1] - a[1])[0][0]) : null;
      obra = lista ? `Próxima obra: <b>${esc(po.e.nome)} nv.${po.nivel}</b>, faltam ${lista}${rota ? ` · rota recomendada: ${rota.icone} ${esc(rota.nome)}` : ''}` : `Próxima obra: <b>${esc(po.e.nome)} nv.${po.nivel}</b>, pronta para construir!`;
    }
    $('#est-topo').innerHTML = `<span>Prosperidade <b>${p.total}</b>/100 <span class="est-barra"><i style="width:${p.total}%"></i></span></span><span>${mat}</span><span>${obra}</span>`;
  }
  function desenharMapa() {
    const s = estado();
    const m = $('#est-mapa'); m.style.backgroundImage = `url(../../../${D.fundo})`;
    m.innerHTML = D.locais.map((l) => {
      const at = s.estruturas[l.id], def = at && estrDe(at.tipo);
      const cat = (D.estruturas.find((e) => e.categoria === l.categoria));
      const vis = def ? def.visual.niveis[at.nivel - 1] : cat.visual.vazio;
      const nome = def ? `${def.nome} nv.${at.nivel}` : (cat.visual.vazio.nome || 'Terreno livre');
      const w = Math.round(78 * (vis.escala || 1));
      return `<button class="est-slot ${slotSel === l.id ? 'sel' : ''}" style="left:${l.pos[0]}%;top:${l.pos[1]}%;--w:${w}px" data-slot="${l.id}">${img(vis, def ? def.emoji : '⬚', nome)}<span>${esc(nome)}</span></button>`;
    }).join('');
  }

  // ---------- painéis dos menus ----------
  const abas = ['aldeias', 'refugios', 'exercitos', 'hospitais', 'expedicoes'];
  function desenharAbas() {
    $('#est-abas').innerHTML = abas.map((a) => `<button class="btn-sec" role="tab" aria-selected="${a === aba}" data-aba="${a}">${D.categorias[a].icone} ${esc(D.categorias[a].nome)}</button>`).join('');
  }
  function painelCategoria() {
    const s = estado(), cat = D.categorias[aba];
    const locais = D.locais.filter((l) => l.categoria === aba);
    const est = D.estruturas.find((e) => e.categoria === aba);
    let h = `<div class="est-bloco"><h4>${cat.icone} ${esc(cat.nome)}</h4><p>${esc(cat.descricao)}</p><p class="muted">${esc(est.beneficio)}</p></div>`;
    if (aba === 'refugios') { const n = window.regiaoMundo?.estado?.().mundo?.['05']?.refugios?.length || 0; h += `<div class="est-bloco"><h4>Proteção atual</h4><p>${n} abrigo(s) ativo(s): proteção contra a praga <b>${Math.min(60, n * 20)}%</b>. Descanso: as equipes saem com vida extra.</p></div>`; }
    if (aba === 'exercitos') { const b = bonusDaCidade(s, D); h += `<div class="est-bloco"><h4>Defesa da cidade</h4><p>Guarnição: <b>+${Math.round(b.atk * 100)}%</b> de ataque e <b>+${Math.round(b.def * 100)}%</b> de defesa nas expedições. Equipes disponíveis: ${roster().length} Onírico(s).</p></div>`; }
    if (aba === 'hospitais') { const b = bonusDaCidade(s, D); h += `<div class="est-bloco"><h4>Tratamento</h4><p>Entre as fases, cada Onírico recupera <b>${Math.round(b.cura * 100)}%</b> da vida. Capacidade: ${(s.estruturas.h1?.nivel || 0)} leito(s) de nível.</p></div>`; }
    for (const l of locais) {
      const at = s.estruturas[l.id]; const nivel = (at?.nivel || 0) + 1;
      const rotulo = at ? `${est.nome} nv.${at.nivel}` : 'Terreno livre';
      if (nivel > est.niveis) { h += `<div class="est-bloco"><h4>${esc(rotulo)}</h4><p class="ok">Nível máximo.</p></div>`; continue; }
      const custo = custoDoNivel(est, nivel), f = falta(custo, s.materiais), ok = !Object.keys(f).length;
      const gp = est.prosperidade[nivel - 1];
      const abrir = confirmar === l.id;
      h += `<div class="est-bloco"><h4>${esc(rotulo)} → ${at ? 'melhorar para' : 'construir'} nv.${nivel}</h4>
        <p>Custo: ${custoTxt(custo)}</p><p>Benefício: ${esc(est.beneficio)} <b>+${gp} de prosperidade</b>.</p>
        <p class="${ok ? 'ok' : 'ruim'}">${ok ? 'Materiais suficientes.' : `Faltam ${custoTxt(f)}.`}</p>
        ${abrir ? `<div class="est-linha"><button class="btn-pri" data-confirmar="${l.id}">Confirmar obra</button><button class="btn-sec" data-cancelar="1">Cancelar</button></div>` : `<div class="est-linha"><button class="btn-pri" data-obra="${l.id}" ${ok ? '' : 'disabled'}>${at ? 'Melhorar' : 'Construir'}</button></div>`}</div>`;
    }
    const p = prosperidade(s, D);
    h += `<div class="est-bloco"><h4>De onde vem a prosperidade (${p.total})</h4>${p.itens.map((i) => `<p>• ${esc(i.origem)}: <b>+${i.valor}</b></p>`).join('')}</div>`;
    return h;
  }
  function equipeAtual(s) {
    const r = roster(); const ids = (s.exp?.equipe || s.equipeSel || []).filter((id) => r.some((m) => m.id === id));
    return { r, ids };
  }
  function painelExpedicoes() {
    const s = estado(), exp = s.exp; const { r, ids } = equipeAtual(s);
    if (!s.equipeSel) s.equipeSel = r.slice(0, s.vagas).map((m) => m.id);
    const sel = (exp?.equipe || s.equipeSel).filter((id) => r.some((m) => m.id === id));
    let h = `<div class="est-bloco"><h4>🧭 Equipe (${sel.length}/${s.vagas} vagas · máximo 6)</h4><p class="muted">Toque para escolher os Oníricos. Cada fase vencida pela primeira vez abre uma vaga nova. Os Oníricos vêm do gacha e dos ovos. Suporte cura, defesa atrai golpes, ataque causa dano. Níveis e habilidades são os do seu time na Campanha e no Idle.</p><div class="est-equipe">${r.map((m) => { const pa = D.papeis[m.especie] || 'ataque'; return `<button class="chip ${sel.includes(m.id) ? 'on' : ''}" data-membro="${m.id}">${PAPEL[pa].i} ${esc(m.especie)} nv.${m.nivel}<br><span class="muted">${PAPEL[pa].n}</span></button>`; }).join('')}</div></div>`;
    if (exp && exp.estado !== 'parada') {
      const rota = rotaDe(exp.rota);
      h += `<div class="est-bloco"><h4>${rota.icone} ${esc(rota.nome)} em andamento</h4><p>Fase ${exp.fase + 1}/${rota.fases.length}: ${esc(rota.fases[exp.fase].nome)} · estado: <b>${estadoTxt(exp)}</b></p><p>Ganhos até agora: ${Object.keys(exp.ganhos).length ? custoTxt(exp.ganhos) : 'nenhum'}</p><div class="est-linha">${batalha && exp.estado === 'batalha' ? '<button class="btn-pri" data-ver="1">Ver combate</button>' : botoesPausa(exp)}<button class="btn-sec" data-parar="1">Encerrar expedição</button></div></div>`;
      return h;
    }
    const equipeObj = sel.map((id) => r.find((m) => m.id === id));
    for (const rota of D.rotas) {
      h += `<div class="est-bloco"><h4>${rota.icone} ${esc(rota.nome)} · material: ${D.materiais[rota.material].icone} ${esc(D.materiais[rota.material].nome)}</h4><p class="muted">${esc(rota.descricao)}</p>`;
      rota.fases.forEach((f, i) => {
        const d = equipeObj.length ? dificuldadeDaFase(f, equipeObj, D.papeis) : { rotulo: 'Sem equipe', cor: '#999' };
        h += `<p>${i + 1}. ${esc(f.nome)} · ${f.inimigos[0]}–${f.inimigos[1]} inimigos nv.${f.nivel[0]}–${f.nivel[1]} · <b style="color:${d.cor}">${d.rotulo}</b> · ${D.materiais[f.material.tipo].icone} ${f.material.faixa[0]}–${f.material.faixa[1]}${f.libera ? ` · 1ª vitória: avista ${esc(f.libera.inimigo)} e abre +1 vaga${s.recrutados[`${rota.id}:${i}`] ? ' ✓' : ''}` : ''}</p>`;
      });
      h += `<div class="est-linha"><button class="btn-pri" data-iniciar="${rota.id}" ${equipeObj.length ? '' : 'disabled'}>Partir</button></div></div>`;
    }
    return h;
  }
  // botões de uma expedição parada (por exemplo, depois de recarregar a página)
const botoesPausa = (exp) => ({
  vitoria: '<button class="btn-sec" data-equipe="1">Ajustar equipe</button><button class="btn-pri" data-prox="1">Próxima fase</button>',
  preparando: '<button class="btn-pri" data-retomar="1">Retomar a fase</button>',
  derrota: '<button class="btn-pri" data-fim="1">Voltar à cidade</button>',
  fim: '<button class="btn-pri" data-fim="1">Concluir rota</button>',
}[exp.estado] || '<button class="btn-pri" data-ver="1">Ver combate</button>');
const estadoTxt = (exp) => ({ preparando: 'pronta para a próxima fase', batalha: 'em combate', vitoria: 'fase vencida', derrota: 'derrota', fim: 'rota concluída', parada: 'encerrada' }[exp.estado] || exp.estado);

  function desenharPainel() {
    desenharAbas();
    $('#est-painel').innerHTML = aba === 'expedicoes' ? painelExpedicoes() : painelCategoria();
  }
  function desenhar() {
    $('#est-corpo').hidden = visao !== 'cidade'; $('#est-bat').hidden = visao !== 'batalha';
    desenharTopo();
    if (visao === 'cidade') { desenharMapa(); desenharPainel(); } else desenharBatalha();
  }

  // ---------- obra ----------
  function fazerObra(slotId) {
    const s = estado(), l = D.locais.find((x) => x.id === slotId), est = D.estruturas.find((e) => e.categoria === l.categoria);
    const r = construir(s, est, slotId);
    confirmar = null;
    if (!r.ok) { mostrarToast(r.motivo + (r.falta ? ` ${custoTxt(r.falta)}` : ''), 3000); desenhar(); return; }
    // reflete no mundo: prosperidade da Vila do Norte (sistema 01) e abrigos do sistema 05
    const mundo = window.regiaoMundo?.estado?.().mundo;
    const v = mundo?.['01']?.norte; if (v) v.prosperidade = Math.min(100, (v.prosperidade || 0) + r.prosperidade);
    if (est.protecaoPraga && mundo?.['05']) mundo['05'].refugios.push({ nome: `Abrigo de ${D.titulo}`, abrigados: 0 });
    diario(`${est.nome} nv.${r.nivel} concluído (+${r.prosperidade} de prosperidade).`);
    mostrarToast(`🏗️ ${est.nome} nv.${r.nivel} concluído! +${r.prosperidade} de prosperidade`, 3800);
    salvar(); atualizarHud?.(); desenhar();
  }

  // ---------- expedição ----------
  function iniciarExpedicao(rotaId) {
    const s = estado(); const r = roster();
    const equipe = (s.equipeSel || []).filter((id) => r.some((m) => m.id === id)).slice(0, s.vagas);
    if (!equipe.length) { mostrarToast('Escolha ao menos um Onírico para partir.', 2600); return; }
    s.exp = novaExpedicao(rotaId, equipe);
    diario(`expedição "${rotaDe(rotaId).nome}" partiu com ${equipe.length} Onírico(s).`);
    salvar(); comecarFase();
  }
  function comecarFase(manterHp = null) {
    const s = estado(), exp = s.exp, rota = rotaDe(exp.rota), fase = rota.fases[exp.fase], r = roster();
    const bonus = bonusDaCidade(s, D);
    const al = exp.equipe.map((id, i) => { const m = r.find((x) => x.id === id); return criarUnidade({ id: `a${i}`, especie: m.especie, nivel: m.nivel, lado: 'a', papeis: D.papeis, bonus }); });
    if (manterHp) al.forEach((u, i) => { const h = manterHp[exp.equipe[i]]; if (h != null) u.hp = Math.max(1, Math.min(u.hpMax, Math.round(h * u.hpMax + u.hpMax * bonus.cura))); });
    batalha = criarBatalha(al, gerarInimigos(fase, D.papeis, rng, Object.keys(s.inimigosLiberados)));
    batalha.log.push(`Fase ${exp.fase + 1}: ${fase.nome}. ${batalha.inimigos.length} inimigo(s) à frente.`);
    exp.estado = 'batalha'; alvoSel = null; visao = 'batalha';
    salvar(); iniciarTick(); desenhar();
    if (!minimizado && !modal.classList.contains('aberto')) { /* aberto só pelo jogador */ }
  }
  function terminarFase() {
    const s = estado(), exp = s.exp, rota = rotaDe(exp.rota);
    if (batalha.fim === 'vitoria') {
      const rec = pagarFase(exp, rota, exp.fase, s.materiais, rng); // null se já paga: nunca duplica
      const fase = rota.fases[exp.fase];
      if (rec) {
        batalha.log.push(`Vitória! ${custoTxt(rec)}.`);
        const chave = `${rota.id}:${exp.fase}`;
        if (fase.libera && !s.recrutados[chave]) {
          s.recrutados[chave] = true; // só a primeira vitória de cada fase libera
          const novoInimigo = !s.inimigosLiberados[fase.libera.inimigo];
          s.inimigosLiberados[fase.libera.inimigo] = true;
          const vagaAntes = s.vagas; s.vagas = Math.min(6, s.vagas + 1);
          exp.liberados.push(fase.libera.inimigo);
          batalha.log.push(`${novoInimigo ? `Novo inimigo avistado: ${fase.libera.inimigo}. ` : ''}${s.vagas > vagaAntes ? `Vaga de equipe liberada (${s.vagas}/6)!` : 'Equipe já está no máximo de vagas.'}`);
          mostrarToast(`🆕 ${novoInimigo ? `${fase.libera.inimigo} avistado como inimigo. ` : ''}${s.vagas > vagaAntes ? `Vaga de equipe ${s.vagas}/6!` : ''}`, 3800);
          diario(`${fase.libera.inimigo} avistado; vagas de equipe ${s.vagas}/6.`);
        }
      }
      exp.hpPct = {}; exp.equipe.forEach((id, i) => { const u = batalha.aliados[i]; exp.hpPct[id] = u.hp > 0 ? u.hp / u.hpMax : 0.5; });
      const ultima = exp.fase >= rota.fases.length - 1;
      exp.estado = ultima ? 'fim' : 'vitoria';
      if (ultima) diario(`expedição "${rota.nome}" concluída (${custoTxt(exp.ganhos)}).`);
      salvar(); atualizarHud?.();
      if (!ultima && exp.autoAvancar) { clearTimeout(timerProx); timerProx = setTimeout(() => proximaFase(true), Math.max(150, ritmoMs * 2)); }
    } else {
      exp.estado = 'derrota'; diario(`expedição "${rota.nome}" terminou em derrota na fase ${exp.fase + 1}.`);
      salvar();
    }
    if (minimizado || !modal.classList.contains('aberto')) mostrarToast(`🧭 ${rota.nome}: ${exp.estado === 'derrota' ? 'derrota' : exp.estado === 'fim' ? 'rota concluída' : `fase ${exp.fase + 1} vencida`}`, 2800);
    desenhar(); desenharInd();
  }
  function proximaFase(automatico = false) {
    const s = estado(), exp = s.exp;
    if (!exp || exp.estado !== 'vitoria') return;
    exp.fase++;
    if (automatico) { // recrutas liberados entram na equipe se ainda houver vaga
      const r = roster(); for (const m of r) if (exp.equipe.length < s.vagas && !exp.equipe.includes(m.id)) exp.equipe.push(m.id);
    } else s.equipeSel = exp.equipe;
    comecarFase(exp.hpPct);
  }
  function iniciarTick() {
    clearInterval(timerTick);
    timerTick = setInterval(tick, ritmoMs);
  }
  function tick() {
    const s = estado(), exp = s.exp;
    if (!exp || exp.estado !== 'batalha' || !batalha || batalha.fim) return;
    const u = atorAtual(batalha);
    if (!u) return;
    if (u.lado === 'i' || exp.autoAtaque) executar(batalha, decidir(batalha, u, rng), rng);
    else { if (visao === 'batalha') desenharBatalha(); desenharInd(); return; } // espera o jogador
    if (batalha.fim) terminarFase();
    else { if (visao === 'batalha' && modal.classList.contains('aberto')) desenharBatalha(); desenharInd(); }
  }

  // ---------- combate (tela) ----------
  function cartao(u, cls, vez) {
    const pct = Math.max(0, Math.round((u.hp / u.hpMax) * 100));
    return `<button class="un ${cls} ${u.hp <= 0 ? 'morto' : ''} ${vez ? 'vez' : ''} ${alvoSel === u.id ? 'alvo' : ''}" data-un="${u.id}">${PAPEL[u.papel].i} ${esc(u.especie)}<br>nv.${u.nivel}<div class="hp"><i style="width:${pct}%"></i></div>${u.hp}/${u.hpMax}</button>`;
  }
  function desenharBatalha() {
    const s = estado(), exp = s.exp, rota = exp && rotaDe(exp.rota);
    const el = $('#est-bat');
    if (!exp || !batalha) { el.innerHTML = `<div class="est-bloco">${exp ? '<p>A expedição foi pausada (a página foi recarregada). Os materiais já ganhos estão salvos.</p><div class="est-linha">${botoesPausa(exp)}<button class="btn-sec" data-parar="1">Encerrar expedição</button></div>' : 'Sem combate em andamento.'}</div>`; return; }
    const u = batalha.fim ? null : atorAtual(batalha);
    const manual = u && u.lado === 'a' && !exp.autoAtaque;
    const ultima = exp.fase >= rota.fases.length - 1;
    const fimBotao = exp.estado === 'vitoria' ? `<button class="btn-sec" data-equipe="1">Ajustar equipe</button><button class="btn-pri" data-prox="1">Próxima fase</button>` : (['derrota', 'fim'].includes(exp.estado) ? `<button class="btn-pri" data-fim="1">${exp.estado === 'fim' ? 'Concluir rota' : 'Voltar à cidade'}</button>` : '');
    el.innerHTML = `<div class="est-bloco" style="margin:0"><b>${rota.icone} ${esc(rota.nome)}</b> · Fase ${exp.fase + 1}/${rota.fases.length}: ${esc(rota.fases[exp.fase].nome)} · ${estadoTxt(exp)} · ganhos: ${Object.keys(exp.ganhos).length ? custoTxt(exp.ganhos) : 'nenhum'}</div>
      <div class="bat-lado">${batalha.inimigos.map((x) => cartao(x, 'i', u === x)).join('')}</div>
      <div class="bat-log" id="est-log">${batalha.log.slice(-8).map((l) => `<p style="margin:1px 0">${esc(l)}</p>`).join('')}</div>
      <div class="bat-lado">${batalha.aliados.map((x) => cartao(x, 'a', u === x)).join('')}</div>
      <div class="bat-ctl">
        <label><input type="checkbox" id="est-auto" ${exp.autoAtaque ? 'checked' : ''}> Atacar automaticamente</label>
        <label><input type="checkbox" id="est-autoavanca" ${exp.autoAvancar ? 'checked' : ''}> Avançar automaticamente</label>
        ${fimBotao}
        <button class="btn-sec" data-min="1">Minimizar</button><button class="btn-sec" data-parar="1">Parar</button>
        ${manual ? `<span><b>Vez: ${esc(u.especie)}</b> (toque num alvo)</span><button class="btn-pri" data-acao="atacar">Atacar</button><button class="btn-pri" data-acao="habilidade" ${u.recarga > 0 ? 'disabled' : ''}>Habilidade${u.recarga > 0 ? ` (${u.recarga})` : ''}</button><button class="btn-sec" data-acao="defender">Defender</button>${u.papel === 'suporte' ? '<button class="btn-sec" data-acao="curar">Curar</button>' : ''}` : ''}
      </div>`;
    const lg = el.querySelector('#est-log'); if (lg) lg.scrollTop = lg.scrollHeight;
  }

  // ---------- indicador (expedição minimizada) ----------
  function desenharInd() {
    const s = estado(), exp = s.exp;
    const mostra = exp && minimizado && exp.estado !== 'parada';
    ind.style.display = mostra ? 'flex' : 'none';
    if (!mostra) return;
    const rota = rotaDe(exp.rota);
    const aguarda = exp.estado === 'batalha' && !exp.autoAtaque && batalha && !batalha.fim && atorAtual(batalha)?.lado === 'a';
    ind.innerHTML = `<span>${rota.icone} ${esc(rota.nome)} · fase ${exp.fase + 1}/${rota.fases.length} · ${aguarda ? 'aguardando sua ação' : estadoTxt(exp)} · ${Object.keys(exp.ganhos).length ? custoTxt(exp.ganhos) : 'sem ganhos'}</span><button class="btn-pri" data-ind="abrir">Abrir</button><button class="btn-sec" data-ind="parar">Parar</button>`;
  }

  // ---------- eventos ----------
  function abrir(cat) {
    minimizado = false; desenharInd();
    const s = estado();
    if (cat) aba = cat;
    visao = s.exp && (['batalha', 'vitoria', 'derrota', 'fim'].includes(s.exp.estado) && batalha) ? 'batalha' : 'cidade';
    confirmar = null; desenhar(); abrirModal('modal-estrategia');
  }
  function minimizar() {
    const s = estado();
    if (s.exp && s.exp.estado !== 'parada') { minimizado = true; mostrarToast('🧭 Expedição minimizada: continua em segundo plano.', 2200); }
    fecharModal('modal-estrategia'); desenharInd();
  }
  function encerrar() {
    const s = estado(); const exp = s.exp;
    clearInterval(timerTick); clearTimeout(timerProx);
    if (exp) mostrarToast(`🧭 Expedição encerrada. Ganhos mantidos: ${Object.keys(exp.ganhos).length ? custoTxt(exp.ganhos) : 'nenhum'}.`, 3200);
    s.exp = null; batalha = null; minimizado = false; visao = 'cidade'; salvar(); desenharInd(); desenhar();
  }
  modal.addEventListener('click', (e) => {
    const t = e.target.closest('button, input'); if (!t) return;
    const s = estado();
    if (t.id === 'est-fechar') { minimizar(); return; }
    if (t.dataset.aba) { aba = t.dataset.aba; confirmar = null; desenharPainel(); return; }
    if (t.dataset.slot) { const l = D.locais.find((x) => x.id === t.dataset.slot); aba = l.categoria; slotSel = l.id; confirmar = null; desenhar(); return; }
    if (t.dataset.obra) { confirmar = t.dataset.obra; desenharPainel(); return; }
    if (t.dataset.cancelar) { confirmar = null; desenharPainel(); return; }
    if (t.dataset.confirmar) { fazerObra(t.dataset.confirmar); return; }
    if (t.dataset.membro) { const id = t.dataset.membro; const sel = s.equipeSel || []; s.equipeSel = sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id].slice(-s.vagas); if (s.exp?.estado === 'vitoria' || s.exp?.estado === 'preparando') s.exp.equipe = s.equipeSel; salvar(); desenharPainel(); return; }
    if (t.dataset.iniciar) { iniciarExpedicao(t.dataset.iniciar); return; }
    if (t.dataset.ver) { visao = 'batalha'; desenhar(); return; }
    if (t.dataset.retomar) { comecarFase(s.exp.hpPct || null); return; }
    if (t.dataset.equipe) { aba = 'expedicoes'; visao = 'cidade'; desenhar(); return; }
    if (t.dataset.parar) { encerrar(); return; }
    if (t.dataset.prox) { clearTimeout(timerProx); proximaFase(false); return; }
    if (t.dataset.fim) { const ex = s.exp; clearInterval(timerTick); s.exp = null; batalha = null; visao = 'cidade'; if (ex) mostrarToast(`Ganhos da expedição: ${Object.keys(ex.ganhos).length ? custoTxt(ex.ganhos) : 'nenhum'}.`, 3200); salvar(); desenhar(); return; }
    if (t.dataset.min) { minimizar(); return; }
    if (t.id === 'est-auto') { s.exp.autoAtaque = t.checked; salvar(); desenharBatalha(); return; }
    if (t.id === 'est-autoavanca') { s.exp.autoAvancar = t.checked; salvar(); if (t.checked && s.exp.estado === 'vitoria') timerProx = setTimeout(() => proximaFase(true), 800); return; }
    if (t.dataset.un) { const id = t.dataset.un; if (batalha && batalha.ordem.find((x) => x.id === id)?.hp > 0) { alvoSel = alvoSel === id ? null : id; desenharBatalha(); } return; }
    if (t.dataset.acao && batalha && !batalha.fim) {
      const u = atorAtual(batalha); if (!u || u.lado !== 'a') return;
      executar(batalha, { tipo: t.dataset.acao, alvo: alvoSel || undefined }, rng); alvoSel = null;
      if (batalha.fim) terminarFase(); else desenharBatalha();
    }
  });
  ind.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.ind === 'abrir') abrir(); else if (b.dataset.ind === 'parar') encerrar(); });

  // ---------- recarregar: fase em andamento recomeça; recompensas já pagas ficam salvas ----------
  (function restaurar() {
    const s = estado();
    if (s.exp && s.exp.estado === 'batalha') s.exp.estado = 'preparando';
    if (s.exp && ['preparando', 'vitoria', 'derrota', 'fim'].includes(s.exp.estado)) { minimizado = true; desenharInd(); }
  })();

  function resumo() {
    const s = estado(), p = prosperidade(s, D);
    const obras = Object.entries(s.estruturas).map(([k, e]) => `${estrDe(e.tipo).nome} nv.${e.nivel}`).join(', ') || 'nenhuma';
    const exp = s.exp ? `${rotaDe(s.exp.rota).nome}, fase ${s.exp.fase + 1} (${estadoTxt(s.exp)})` : 'nenhuma em andamento';
    return { titulo: `Estratégia · ${D.titulo}`, linhas: [`Prosperidade: ${p.total}/100`, `Materiais: ${custoTxt(s.materiais)}`, `Obras: ${obras}`, `Expedição: ${exp}`] };
  }
  return { abrir, resumo, estado, minimizar, encerrar, comecarFase,
    // ajuda de teste e balanceamento
    setRitmo: (ms) => { ritmoMs = ms; if (timerTick) iniciarTick(); }, batalha: () => batalha, minimizado: () => minimizado };
}
