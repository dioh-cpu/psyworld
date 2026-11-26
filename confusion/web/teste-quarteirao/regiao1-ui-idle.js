// Controlador de UI Idle para Confusion Waves: Double Perspective (Região 1).
// Gerencia: HUD compacto, Minimapa circular, Menu único, Atlas de Caça, Config Auto-Caça,
// Codex Onírico, Mochila & Status Explicáveis, Temporada/Passe/Login/Diárias, Vote & Ganhe,
// Economia de Energia, Recompensa Offline, Dano Flutuante, Buffs, Mini-Log, PWA e Tutorial guiado.

import { MAPAS, ORDEM_MAPAS } from './regiao1-mapas.js';
import { MONSTROS_SELVAGENS, ENTIDADES_BOSS } from './regiao1-entidades.js';
import { QUESTS_DEFINICOES } from './regiao1-estado.js';
import {
  I18N,
  RELIQUIAS_CATALOGO,
  ATRIBUTOS_DOMADOR,
  ESPECIES,
  PASS_LEVELS,
  SPHERE_PRICE,
  garantirEstadoIdle,
  bonusCodex,
  calcularStatusDetalhado,
  distribuirAtributoDomador,
  resetarAtributosDomador,
  avaliarRiscoArea,
  calcularGanhoOffline,
  aplicarGanhoOffline,
  resgatarDiaria,
  trocarMissaoDiaria,
  resgatarLoginDiario,
  resgatarTudoPasse,
  comprarEsferaIdle,
  comprarOuEquiparReliquia,
  chocarPrimeiroOvo,
  registrarVotoPortal,
  resgatarLojaVoto,
  resumoEventosAtuais,
  registrarLogIdle,
  passLevel,
} from './regiao1-idle.js';

export function criarControladorIdleUI(ctx) {
  let promptPwa = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    promptPwa = e;
  });

  const $ = (id) => document.getElementById(id);
  const abrir = (id) => $(id)?.classList.add('aberto');
  const fechar = (id) => $(id)?.classList.remove('aberto');

  // ---- Dano & Drops flutuantes sobre o canvas ----
  const camadaFlut = $('camada-flutuantes');
  function spawnFlutuante(screenX, screenY, texto, cor = '#fde047', grande = false) {
    const idle = garantirEstadoIdle(ctx.getSave());
    if (!idle.config.mostrarDano || !camadaFlut) return;
    const el = document.createElement('div');
    el.className = 'flut-num' + (grande ? ' grande' : '');
    el.textContent = texto;
    el.style.left = `${screenX}px`;
    el.style.top = `${screenY}px`;
    el.style.color = cor;
    camadaFlut.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  // ---- Minimapa circular ----
  const miniCanvas = $('minimapa-canvas');
  const miniCtx = miniCanvas ? miniCanvas.getContext('2d') : null;
  function atualizarMinimapa(mapa, px, py, monstrosAtivos) {
    if (!miniCtx || !mapa) return;
    const w = miniCanvas.width, h = miniCanvas.height;
    miniCtx.clearRect(0, 0, w, h);
    miniCtx.fillStyle = '#0c1a30';
    miniCtx.fillRect(0, 0, w, h);

    // Saídas (amarelo)
    miniCtx.fillStyle = '#facc15';
    for (const sa of mapa.saidas) {
      const mx = ((sa.rect[0] + sa.rect[2]) / 2 / 1024) * w;
      const my = ((sa.rect[1] + sa.rect[3]) / 2 / 571) * h;
      miniCtx.beginPath();
      miniCtx.arc(mx, my, 3.2, 0, Math.PI * 2);
      miniCtx.fill();
    }
    // Marco de teleporte (azul/cinza)
    if (mapa.marco) {
      const ativo = Boolean(ctx.getSave().teleportes?.[mapa.marco.id]?.ativo);
      miniCtx.fillStyle = ativo ? '#38bdf8' : '#94a3b8';
      const mx = (mapa.marco.pos[0] / 1024) * w;
      const my = (mapa.marco.pos[1] / 571) * h;
      miniCtx.fillRect(mx - 3, my - 3, 6, 6);
    }
    // Monstros selvagens (vermelho suave)
    miniCtx.fillStyle = '#fb7185';
    for (const m of monstrosAtivos) {
      const mx = (m.px / 1024) * w;
      const my = (m.py / 571) * h;
      miniCtx.fillRect(mx - 1.5, my - 1.5, 3, 3);
    }
    // Jogador (branco + aura ciano)
    const jx = (px / 1024) * w;
    const jy = (py / 571) * h;
    miniCtx.fillStyle = '#38bdf8';
    miniCtx.beginPath();
    miniCtx.arc(jx, jy, 4.5, 0, Math.PI * 2);
    miniCtx.fill();
    miniCtx.fillStyle = '#fff';
    miniCtx.beginPath();
    miniCtx.arc(jx, jy, 2.3, 0, Math.PI * 2);
    miniCtx.fill();

    const coordEl = $('minimapa-coord');
    if (coordEl) coordEl.textContent = `${mapa.id} (${px}, ${py})`;
  }

  // ---- HUD Compacto, Idioma, Buffs e Mini-Log ----
  function atualizarHudIdle() {
    const save = ctx.getSave();
    const idle = garantirEstadoIdle(save);
    const t = I18N[idle.config.idioma] || I18N.pt;
    const st = calcularStatusDetalhado(save);
    const ev = resumoEventosAtuais();

    // Escala HUD & HUD Clean
    document.documentElement.style.setProperty('--hud-scale', String((idle.config.hudEscala || 100) / 100));
    document.body.classList.toggle('hud-clean', Boolean(idle.config.hudClean));

    const elNome = $('jog-nome');
    if (elNome) {
      const tit = idle.perspectiva === 'heroi' ? 'Herói' : 'Azazel';
      elNome.textContent = `${tit} · Nv.${st.nivel}`;
    }
    const elHp = $('bar-hp-fill');
    const elHpTxt = $('bar-hp-txt');
    const hpPct = Math.max(0, Math.min(100, (idle.jogador.hp / st.hpMax) * 100));
    if (elHp) elHp.style.width = `${hpPct}%`;
    if (elHpTxt) elHpTxt.textContent = `HP ${idle.jogador.hp}/${st.hpMax}`;

    const elSan = $('bar-san-fill');
    const elSanTxt = $('bar-san-txt');
    if (elSan) elSan.style.width = `${idle.jogador.sanidade}%`;
    if (elSanTxt) elSanTxt.textContent = `SAN ${idle.jogador.sanidade}`;

    const elXp = $('bar-xp-fill');
    if (elXp) elXp.style.width = `${st.xpPct}%`;

    const elBadgePts = $('badge-pts');
    if (elBadgePts) {
      elBadgePts.textContent = `+${st.pontosDisponiveis} pts`;
      elBadgePts.classList.toggle('visivel', st.pontosDisponiveis > 0);
    }

    const elRec = $('hud-recursos');
    if (elRec) { const vip = save.conta?.vipAte > Date.now() ? Math.ceil((save.conta.vipAte - Date.now()) / 86400000) : 0; elRec.textContent = `${save.recompensas.gold}g · ${save.recompensas.diamantes.toLocaleString('pt-BR')}💎${vip ? ` · 👑 VIP ${vip}d` : ''}`; }

    const btnAuto = $('btn-autocaca');
    if (btnAuto) {
      btnAuto.classList.toggle('ativo', Boolean(idle.autoCaca.ativo));
      btnAuto.textContent = idle.autoCaca.ativo ? `⚔️ ${t.autoOn}` : `⚔️ ${t.autoOff}`;
    }
    const btnMenu = $('btn-menu-geral');
    if (btnMenu) {
      btnMenu.textContent = st.pontosDisponiveis > 0 ? `☰ ${t.menu} •` : `☰ ${t.menu}`;
    }
    const btnAtlas = $('btn-atlas-rapido');
    if (btnAtlas) btnAtlas.textContent = `🗺️ ${t.atlas}`;

    // Buffs ativos na lateral esquerda
    const buffsEl = $('barra-buffs');
    if (buffsEl) {
      const buffs = [
        { ic: '🛡️', nome: 'Escudo 7d', desc: '+10% Captura e +20% Encontros nos primeiros 7 dias.' },
        { ic: '🌙', nome: ev.semanal.nome, desc: `Evento semanal ativo: ${ev.semanal.efeito}` },
      ];
      if (ev.raid?.aberto) {
        buffs.push({ ic: '🔥', nome: 'Raid', desc: `Raid aberta: ${ev.raid.boss.nome} (${ev.raid.restanteMin}m)` });
      }
      buffsEl.innerHTML = buffs.map((b, i) =>
        `<button class="buff-pill" data-buff="${i}" title="${b.desc}">${b.ic}<span>${b.nome}</span></button>`
      ).join('');
      buffsEl.querySelectorAll('[data-buff]').forEach((btn) => {
        btn.onclick = () => {
          const b = buffs[Number(btn.dataset.buff)];
          ctx.mostrarToast(`${b.ic} ${b.nome}: ${b.desc}`, 3400);
        };
      });
    }

    // Mini-log de Farm
    renderizarMiniLog();

    // Economia de Energia overlay
    const eco = $('overlay-economia');
    if (eco) {
      eco.classList.toggle('ativo', Boolean(idle.config.economiaEnergia));
      if (idle.config.economiaEnergia) {
        $('eco-mapa').textContent = `${ctx.getMapaAtual()?.id || 'C0'} · ${ctx.getMapaAtual()?.nome || ''}`;
        $('eco-status').textContent = `Nv.${st.nivel} · HP ${idle.jogador.hp}/${st.hpMax} · SAN ${idle.jogador.sanidade} · ${save.recompensas.gold}g · Abates: ${idle.jogador.abatesTotais}`;
      }
    }
  }

  let abaLogAtiva = 'farm';
  function renderizarMiniLog() {
    const corpo = $('minilog-corpo');
    if (!corpo) return;
    const idle = garantirEstadoIdle(ctx.getSave());
    const filtrados = idle.logs.filter((l) => abaLogAtiva === 'todos' || l.tipo === abaLogAtiva).slice(-6);
    corpo.innerHTML = filtrados.length
      ? filtrados.map((l) => `<div class="ml-ln">${l.texto}</div>`).join('')
      : '<div class="ml-ln" style="color:#64748b">Ligue Auto · ON ou cace monstros para ver o registro.</div>';
  }

  document.querySelectorAll('[data-log-aba]').forEach((btn) => {
    btn.addEventListener('click', () => {
      abaLogAtiva = btn.dataset.logAba;
      document.querySelectorAll('[data-log-aba]').forEach((b) => b.classList.toggle('ativo', b === btn));
      renderizarMiniLog();
    });
  });
  $('btn-minilog-toggle')?.addEventListener('click', () => {
    $('minilog-box')?.classList.toggle('recolhido');
  });

  // ---- Menu Unificado (Drawer) ----
  function renderizarMenu() {
    const idle = garantirEstadoIdle(ctx.getSave());
    $('chk-hud-clean').checked = Boolean(idle.config.hudClean);
    $('chk-economia').checked = Boolean(idle.config.economiaEnergia);
    abrir('modal-menu');
  }
  $('btn-menu-geral')?.addEventListener('click', renderizarMenu);
  $('chk-hud-clean')?.addEventListener('change', (e) => {
    garantirEstadoIdle(ctx.getSave()).config.hudClean = e.target.checked;
    ctx.salvar();
    atualizarHudIdle();
  });
  $('chk-economia')?.addEventListener('change', (e) => {
    garantirEstadoIdle(ctx.getSave()).config.economiaEnergia = e.target.checked;
    ctx.salvar();
    fechar('modal-menu');
    atualizarHudIdle();
  });
  $('btn-sair-economia')?.addEventListener('click', () => {
    garantirEstadoIdle(ctx.getSave()).config.economiaEnergia = false;
    ctx.salvar();
    atualizarHudIdle();
  });

  // Atalhos do Menu Unificado
  const abrirDoMenu = (fn) => { fechar('modal-menu'); fn(); };
  $('m-diario')?.addEventListener('click', () => abrirDoMenu(() => ctx.abrirDiario()));
  $('m-atlas')?.addEventListener('click', () => abrirDoMenu(abrirAtlas));
  $('m-autocaca')?.addEventListener('click', () => abrirDoMenu(abrirConfigAutoCaca));
  $('m-mochila')?.addEventListener('click', () => abrirDoMenu(abrirMochila));
  $('m-codex')?.addEventListener('click', () => abrirDoMenu(abrirCodex));
  $('m-temporada')?.addEventListener('click', () => abrirDoMenu(abrirTemporada));
  $('m-mapa48')?.addEventListener('click', () => abrirDoMenu(() => ctx.abrirMapa48()));
  $('m-voto')?.addEventListener('click', () => abrirDoMenu(abrirVoto));
  $('m-config')?.addEventListener('click', () => abrirDoMenu(abrirConfig));

  // ---- Atlas de Caça (48 áreas pesquisável) ----
  let filtroBioma = 'Todos';
  let buscaAtlas = '';
  function abrirAtlas() {
    renderizarAtlas();
    abrir('modal-atlas');
  }
  $('btn-atlas-rapido')?.addEventListener('click', abrirAtlas);
  for (const id of ['minimapa-wrap', 'hud-card-domador']) {
    $(id)?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.currentTarget.click();
      }
    });
  }
  $('minimapa-wrap')?.addEventListener('click', abrirAtlas);
  $('atlas-busca')?.addEventListener('input', (e) => { buscaAtlas = e.target.value.trim().toLowerCase(); renderizarAtlas(); });
  $('atlas-bioma')?.addEventListener('change', (e) => { filtroBioma = e.target.value; renderizarAtlas(); });

  function renderizarAtlas() {
    const lista = $('atlas-lista');
    if (!lista) return;
    const save = ctx.getSave();
    const st = calcularStatusDetalhado(save);
    const wildsPorMapa = {};
    for (const w of MONSTROS_SELVAGENS) {
      (wildsPorMapa[w.mapa] ||= []).push(w);
    }

    const itens = ORDEM_MAPAS.map((id) => {
      const m = MAPAS[id];
      const ws = wildsPorMapa[id] || [];
      const especies = [...new Set(ws.map((w) => w.especie))];
      const nvMed = ws.length ? Math.round(ws.reduce((a, b) => a + b.nivel, 0) / ws.length) : 1;
      return { m, ws, especies, nvMed };
    }).filter(({ m, especies }) => {
      if (filtroBioma !== 'Todos' && m.bioma !== filtroBioma) return false;
      if (!buscaAtlas) return true;
      return m.id.toLowerCase().includes(buscaAtlas)
        || m.nome.toLowerCase().includes(buscaAtlas)
        || m.bioma.toLowerCase().includes(buscaAtlas)
        || especies.some((e) => e.toLowerCase().includes(buscaAtlas));
    });

    $('atlas-total').textContent = `${itens.length} de ${ORDEM_MAPAS.length} áreas`;
    if (!itens.length) {
      lista.innerHTML = '<p class="card-row">Nenhuma área encontrada. Ajuste a busca ou o bioma.</p>';
      return;
    }
    lista.innerHTML = itens.map(({ m, ws, especies, nvMed }) => {
      const risco = ws.length ? avaliarRiscoArea(st.nivel, nvMed) : { selo: 'Segura / Arena', cor: '#94a3b8', golpes: 0 };
      const visitada = Boolean(garantirEstadoIdle(save).codex.areasVisitadas[m.id]);
      const boss = ENTIDADES_BOSS.find((b) => b.mapa === m.id);
      const sub = boss ? `⚔️ Chefe: ${boss.nome} (Nv.${boss.nivel})`
        : ws.length ? `${ws.length} monstros (Nv.${nvMed}) · ${especies.join(', ')} · Aguenta ~${risco.golpes} golpes`
        : `${m.bioma} · Área segura / transição`;
      return `
        <div class="card-row">
          <div>
            <b>${m.id} · ${m.nome}</b>
            <span class="tag" style="border-color:${risco.cor};color:${risco.cor}">${risco.selo}</span>
            ${visitada ? '<span class="tag" style="color:#4ade80;border-color:#4ade80">Visitada</span>' : ''}
            <div class="sub">${sub}</div>
          </div>
          <div style="display:flex;gap:5px">
            <button class="btn-sec" style="padding:5px 9px;font-size:11.5px" data-ir-mapa="${m.id}">Ir</button>
            ${ws.length ? `<button class="btn-pri" style="padding:5px 9px;font-size:11.5px" data-cacar-mapa="${m.id}">Caçar</button>` : ''}
          </div>
        </div>
      `;
    }).join('');

    lista.querySelectorAll('[data-ir-mapa]').forEach((b) => {
      b.onclick = () => {
        fechar('modal-atlas');
        ctx.viajarParaMapa(b.dataset.irMapa, false);
      };
    });
    lista.querySelectorAll('[data-cacar-mapa]').forEach((b) => {
      b.onclick = () => {
        fechar('modal-atlas');
        ctx.viajarParaMapa(b.dataset.cacarMapa, true);
      };
    });
  }

  // ---- Configuração de Auto-Caça ----
  function abrirConfigAutoCaca() {
    const idle = garantirEstadoIdle(ctx.getSave());
    const mapa = ctx.getMapaAtual();
    const especiesMapa = [...new Set(MONSTROS_SELVAGENS.filter((w) => w.mapa === mapa?.id).map((w) => w.especie))];
    $('ac-toggle').checked = Boolean(idle.autoCaca.ativo);
    $('ac-vantagem').checked = Boolean(idle.autoCaca.preferirVantagem);
    $('ac-capturar').checked = Boolean(idle.autoCaca.autoCapturar);
    $('ac-ovos').checked = Boolean(idle.autoCaca.coletarOvos);
    $('ac-emergencia').checked = Boolean(idle.autoCaca.voltarMarcoEmergencia);
    $('ac-hp').value = idle.autoCaca.descansarHpPct;
    $('ac-hp-val').textContent = `${idle.autoCaca.descansarHpPct}%`;
    $('ac-san').value = idle.autoCaca.descansarSanidadePct;
    $('ac-san-val').textContent = `${idle.autoCaca.descansarSanidadePct}%`;

    const alvosEl = $('ac-alvos');
    alvosEl.innerHTML = especiesMapa.length
      ? especiesMapa.map((esp) => {
          const chk = !idle.autoCaca.alvosIgnorados.includes(esp);
          return `<label class="chk-pill"><input type="checkbox" data-ac-esp="${esp}" ${chk ? 'checked' : ''}> ${esp}</label>`;
        }).join('')
      : '<span class="sub">Esta área não tem monstros selvagens. Abra o Atlas de Caça para escolher uma rota!</span>';
    abrir('modal-autocaca');
  }
  $('btn-autocaca-cfg')?.addEventListener('click', abrirConfigAutoCaca);
  $('ac-hp')?.addEventListener('input', (e) => { $('ac-hp-val').textContent = `${e.target.value}%`; });
  $('ac-san')?.addEventListener('input', (e) => { $('ac-san-val').textContent = `${e.target.value}%`; });
  $('btn-ac-salvar')?.addEventListener('click', () => {
    const idle = garantirEstadoIdle(ctx.getSave());
    idle.autoCaca.ativo = $('ac-toggle').checked;
    idle.autoCaca.preferirVantagem = $('ac-vantagem').checked;
    idle.autoCaca.autoCapturar = $('ac-capturar').checked;
    idle.autoCaca.coletarOvos = $('ac-ovos').checked;
    idle.autoCaca.voltarMarcoEmergencia = $('ac-emergencia').checked;
    idle.autoCaca.descansarHpPct = Number($('ac-hp').value);
    idle.autoCaca.descansarSanidadePct = Number($('ac-san').value);
    const ignorados = new Set(idle.autoCaca.alvosIgnorados);
    document.querySelectorAll('[data-ac-esp]').forEach((chk) => {
      if (chk.checked) ignorados.delete(chk.dataset.acEsp);
      else ignorados.add(chk.dataset.acEsp);
    });
    idle.autoCaca.alvosIgnorados = [...ignorados];
    ctx.definirAutoCaca(idle.autoCaca.ativo);
    fechar('modal-autocaca');
  });

  // ---- Codex Onírico ----
  function abrirCodex() {
    const save = ctx.getSave();
    const idle = garantirEstadoIdle(save);
    const c = bonusCodex(idle);
    $('codex-resumo').innerHTML = `
      <b>Pontos do Codex:</b> ${c.pontos} · <b>Marcos:</b> ${c.marcos} · <b>Áreas:</b> ${c.nAreas}/48 · <b>Chefes:</b> ${c.nBosses}/4<br>
      <span style="color:#4ade80">Bônus Permanentes da Conta: +${c.hpPct}% HP · +${c.atkPct}% ATK · +${c.capturaPct}% Captura · +${c.fazendaPct}% Fazenda</span>
    `;
    const lista = $('codex-lista');
    lista.innerHTML = Object.entries(ESPECIES).slice(0, 12).map(([nome, esp]) => {
      const reg = idle.codex.especies[nome];
      const status = reg ? `Abates: ${reg.abates} · Capturas: ${reg.capturas}` : 'Ainda não descoberto';
      return `
        <div class="card-row" style="opacity:${reg ? 1 : 0.55}">
          <div>
            <b>${nome}</b> <span class="tag">${esp.elemento || esp.pureza}</span>
            <div class="sub">${status} · Habilidades: ${esp.habilidades.slice(0, 3).join(', ')}</div>
          </div>
          <span class="tag" style="color:${reg?.capturas ? '#4ade80' : '#94a3b8'}">${reg?.capturas ? '✓ Capturado' : reg ? 'Visto' : '???'}</span>
        </div>
      `;
    }).join('');
    abrir('modal-codex');
  }

  // ---- Mochila, Atributos do Domador, Relíquias & Status Explicáveis ----
  $('hud-card-domador')?.addEventListener('click', abrirMochila);

  $('modal-mochila')?.querySelectorAll('[data-mochila-secao]').forEach((botao) => {
    botao.addEventListener('click', () => $(botao.dataset.mochilaSecao)?.scrollIntoView({ block: 'start' }));
  });

  function abrirMochila() {
    const save = ctx.getSave();
    const idle = garantirEstadoIdle(save);
    const st = calcularStatusDetalhado(save);
    const attrs = idle.jogador.atributos || { for: 0, vit: 0, men: 0, vin: 0, sor: 0 };
    const gastos = (attrs.for || 0) + (attrs.vit || 0) + (attrs.men || 0) + (attrs.vin || 0) + (attrs.sor || 0);

    const domEl = $('domador-atributos');
    if (domEl) {
      domEl.innerHTML = `
        <div class="card-row" style="border-color:rgba(250,204,21,.45)">
          <div>
            <b>Nível ${st.nivel}</b> · XP ${st.xpNoNivel}/${st.xpNecessario} (${st.xpPct}%)
            <div class="sub">Pontos disponíveis: <b style="color:${st.pontosDisponiveis > 0 ? '#facc15' : '#94b3d4'}">${st.pontosDisponiveis}</b> · Investidos: ${gastos}</div>
          </div>
          ${gastos > 0 ? '<button class="btn-sec" id="btn-reset-attrs" style="padding:4px 9px;font-size:11px">↺ Resetar</button>' : ''}
        </div>
        ${ATRIBUTOS_DOMADOR.map((a) => `
          <div class="card-row">
            <div>
              <b>${a.sigla} · ${a.nome}</b> <span class="tag" style="color:#4ade80;border-color:#4ade80">${attrs[a.id] || 0} pts</span>
              <div class="sub">${a.desc}</div>
            </div>
            <button class="btn-pri" data-add-attr="${a.id}" style="padding:5px 10px;font-size:11.5px;${st.pontosDisponiveis > 0 ? '' : 'opacity:.45;cursor:not-allowed'}" ${st.pontosDisponiveis > 0 ? '' : 'disabled'}>+1</button>
          </div>
        `).join('')}
      `;
      domEl.querySelectorAll('[data-add-attr]').forEach((b) => {
        b.onclick = () => {
          const r = distribuirAtributoDomador(save, b.dataset.addAttr, 1);
          ctx.mostrarToast(r.ok ? `+1 em ${b.dataset.addAttr.toUpperCase()}! (Restam ${r.restantes} pts)` : r.motivo, 1800);
          ctx.salvar();
          atualizarHudIdle();
          abrirMochila();
        };
      });
      $('btn-reset-attrs')?.addEventListener('click', () => {
        const r = resetarAtributosDomador(save);
        ctx.mostrarToast(`Atributos resetados! ${r.disponiveis} pontos devolvidos.`, 2200);
        ctx.salvar();
        atualizarHudIdle();
        abrirMochila();
      });
    }

    $('status-breakdown').innerHTML = st.fontes.map((f) => `
      <div class="card-row">
        <div><b>${f.nome}</b><div class="sub">${f.detalhe}</div></div>
        <b style="color:#facc15;font-size:14px">${f.total}</b>
      </div>
    `).join('');

    $('mochila-esferas').innerHTML = Object.entries(SPHERE_PRICE).map(([rar, preco]) => {
      const custoTxt = typeof preco === 'object'
        ? `${preco.valor}${preco.moeda === 'diamonds' ? '💎' : 'g'}`
        : `${preco}g`;
      return `
        <div class="card-row">
          <div><b>Esfera ${rar}</b> · Você tem: <b style="color:#38bdf8">${idle.mochila.esferas[rar] || 0}</b></div>
          <button class="btn-pri" style="padding:5px 10px;font-size:11.5px" data-comp-esf="${rar}">Comprar (${custoTxt})</button>
        </div>
      `;
    }).join('');
    $('mochila-esferas').querySelectorAll('[data-comp-esf]').forEach((b) => {
      b.onclick = () => {
        const r = comprarEsferaIdle(save, b.dataset.compEsf);
        ctx.mostrarToast(r.ok ? `Esfera ${b.dataset.compEsf} comprada!` : r.motivo, 2200);
        ctx.salvar();
        atualizarHudIdle();
        abrirMochila();
      };
    });

    $('mochila-ovos').innerHTML = idle.mochila.ovos.length
      ? `<div class="card-row"><div><b>Ovos na Mochila: ${idle.mochila.ovos.length}</b><div class="sub">Próximo: ${idle.mochila.ovos[0].especie} (${idle.mochila.ovos[0].forma})</div></div><button class="btn-pri" id="btn-chocar-ovo">🥚 Chocar</button></div>`
      : '<div class="sub">Nenhum ovo na mochila ainda. Caçe monstros ou ligue Auto-Caça para dropar ovos!</div>';
    $('btn-chocar-ovo')?.addEventListener('click', () => {
      const r = chocarPrimeiroOvo(save);
      if (r.ok) {
        ctx.mostrarToast(`🥚 Nasceu um ${r.ovo.especie} (${r.ovo.forma})!`, 3200);
        registrarLogIdle(idle, `🥚 Ovo chocado: ${r.ovo.especie}!`, 'farm');
        ctx.salvar();
        atualizarHudIdle();
        abrirMochila();
      }
    });

    $('mochila-reliquias').innerHTML = RELIQUIAS_CATALOGO.map((r) => {
      const tem = idle.mochila.reliquiasPossuidas.includes(r.id);
      const eq = idle.mochila.equipada[r.slot] === r.id;
      return `
        <div class="card-row">
          <div><b>${r.nome}</b> <span class="tag">${r.slot}</span><div class="sub">${r.desc}</div></div>
          <button class="${eq ? 'btn-sec' : 'btn-pri'}" style="padding:5px 10px;font-size:11.5px" data-rel="${r.id}">
            ${eq ? '✓ Equipada' : tem ? 'Equipar' : `Comprar (${r.custo}g)`}
          </button>
        </div>
      `;
    }).join('');
    $('mochila-reliquias').querySelectorAll('[data-rel]').forEach((b) => {
      b.onclick = () => {
        const res = comprarOuEquiparReliquia(save, b.dataset.rel);
        ctx.mostrarToast(res.ok ? `Relíquia equipada: ${res.reliquia.nome}!` : res.motivo, 2400);
        ctx.salvar();
        atualizarHudIdle();
        abrirMochila();
      };
    });

    abrir('modal-mochila');
  }

  // ---- Temporada, Passe 30 Níveis, Login 7 Dias & Missões Diárias (com Reroll!) ----
  function abrirTemporada() {
    const save = ctx.getSave();
    const idle = garantirEstadoIdle(save);
    const ev = resumoEventosAtuais();
    const nv = passLevel(idle.passe.xp);

    $('temp-resumo').innerHTML = `
      <b>Passe de Temporada:</b> Nível ${nv}/${PASS_LEVELS} (${idle.passe.xp} XP) · Resgatado até Nv.${idle.passe.claimed}<br>
      <b>Evento Semanal:</b> ${ev.semanal.nome} (${ev.semanal.efeito}) · <b>Mensal:</b> ${ev.mensal.nome}<br>
      <b>Próxima Raid (2h):</b> ${ev.raid.boss.nome} (${ev.raid.aberto ? `ABERTA · ${ev.raid.restanteMin}m` : `em ${ev.raid.abreEmMin}m`})
    `;

    $('temp-diarias').innerHTML = `
      <div class="sub" style="margin-bottom:6px">Trocas (reroll) restantes hoje: <b>${idle.diarias.rerollsRestantes}</b></div>
      ${idle.diarias.itens.map((m) => `
        <div class="card-row">
          <div>
            <b>${m.titulo}</b> (${m.progresso}/${m.meta})
            <div class="sub">+${m.gold}g · +${m.xpPasse} XP Passe</div>
          </div>
          <div style="display:flex;gap:5px">
            ${!m.resgatada && m.progresso >= m.meta
              ? `<button class="btn-pri" style="padding:4px 9px;font-size:11px" data-resg-dm="${m.id}">Resgatar</button>`
              : !m.resgatada
                ? `<button class="btn-sec" style="padding:4px 8px;font-size:11px" data-ir-dm="${m.mapaSugerido}">Ir caçar</button>
                   <button class="btn-sec" style="padding:4px 8px;font-size:11px" data-troca-dm="${m.id}">↻ Trocar</button>`
                : '<span class="tag" style="color:#4ade80">✓ Feita</span>'}
          </div>
        </div>
      `).join('')}
    `;

    $('temp-diarias').querySelectorAll('[data-resg-dm]').forEach((b) => {
      b.onclick = () => {
        const ok = resgatarDiaria(save, b.dataset.resgDm);
        if (ok) { ctx.mostrarToast(`+${ok.gold}g e +${ok.xpPasse} XP do Passe!`, 2400); ctx.salvar(); atualizarHudIdle(); abrirTemporada(); }
      };
    });
    $('temp-diarias').querySelectorAll('[data-troca-dm]').forEach((b) => {
      b.onclick = () => {
        const r = trocarMissaoDiaria(save, b.dataset.trocaDm);
        ctx.mostrarToast(r.ok ? `Nova missão: ${r.nova.titulo}` : r.motivo, 2200);
        ctx.salvar();
        abrirTemporada();
      };
    });
    $('temp-diarias').querySelectorAll('[data-ir-dm]').forEach((b) => {
      b.onclick = () => { fechar('modal-temporada'); ctx.viajarParaMapa(b.dataset.irDm, true); };
    });

    abrir('modal-temporada');
  }

  $('btn-login-diario')?.addEventListener('click', () => {
    const save = ctx.getSave();
    const r = resgatarLoginDiario(save);
    ctx.mostrarToast(r.ok ? `🎁 Login Dia ${r.dia}/7 resgatado!` : r.motivo, 2800);
    ctx.salvar();
    atualizarHudIdle();
    abrirTemporada();
  });
  $('btn-passe-coletar')?.addEventListener('click', () => {
    const save = ctx.getSave();
    const r = resgatarTudoPasse(save);
    ctx.mostrarToast(`Passe Nv.${r.nivel}: +${r.reward.diamantes}💎 resgatados!`, 2800);
    ctx.salvar();
    atualizarHudIdle();
    abrirTemporada();
  });

  // ---- Vote & Ganhe (TopIdle / IdleRank) ----
  function abrirVoto() {
    const idle = garantirEstadoIdle(ctx.getSave());
    $('voto-saldo').textContent = `Saldo: ${idle.votos.voteCash} Vote Cash · Total de votos: ${idle.votos.totalVotos}`;
    abrir('modal-voto');
  }
  document.querySelectorAll('[data-votar]').forEach((b) => {
    b.addEventListener('click', () => {
      const r = registrarVotoPortal(ctx.getSave(), b.dataset.votar);
      ctx.mostrarToast(r.ok ? `✅ Voto contabilizado! Saldo: ${r.voteCash} Vote Cash.` : r.motivo, 2600);
      ctx.salvar();
      abrirVoto();
    });
  });
  document.querySelectorAll('[data-voto-loja]').forEach((b) => {
    b.addEventListener('click', () => {
      const r = resgatarLojaVoto(ctx.getSave(), b.dataset.votoLoja);
      ctx.mostrarToast(r.ok ? '🎁 Recompensa de voto resgatada!' : r.motivo, 2400);
      ctx.salvar();
      atualizarHudIdle();
      abrirVoto();
    });
  });

  // ---- Configurações (Idioma, Escala HUD, FPS, Perspectiva, PWA, Simular AFK, Exportar Save) ----
  function abrirConfig() {
    const idle = garantirEstadoIdle(ctx.getSave());
    $('cfg-idioma').value = idle.config.idioma;
    $('cfg-perspectiva').value = idle.perspectiva;
    $('cfg-modo-camp').value = idle.config.modoCampanha;
    $('cfg-hud-escala').value = idle.config.hudEscala;
    $('cfg-hud-escala-val').textContent = `${idle.config.hudEscala}%`;
    $('cfg-fps').value = String(idle.config.fpsLimite);
    $('cfg-dano').checked = Boolean(idle.config.mostrarDano);
    abrir('modal-config');
  }
  $('cfg-hud-escala')?.addEventListener('input', (e) => { $('cfg-hud-escala-val').textContent = `${e.target.value}%`; });
  $('btn-cfg-salvar')?.addEventListener('click', () => {
    const idle = garantirEstadoIdle(ctx.getSave());
    idle.config.idioma = $('cfg-idioma').value;
    idle.perspectiva = $('cfg-perspectiva').value;
    idle.config.modoCampanha = $('cfg-modo-camp').value;
    idle.config.hudEscala = Number($('cfg-hud-escala').value);
    idle.config.fpsLimite = Number($('cfg-fps').value);
    idle.config.mostrarDano = $('cfg-dano').checked;
    ctx.salvar();
    atualizarHudIdle();
    fechar('modal-config');
    ctx.mostrarToast('Configurações salvas!', 2000);
  });
  $('btn-simular-afk')?.addEventListener('click', () => {
    const save = ctx.getSave();
    const idle = garantirEstadoIdle(save);
    idle.ultimoTickMs = Date.now() - 2 * 3600000;
    fechar('modal-config');
    verificarGanhoOffline(true);
  });
  $('btn-instalar-pwa')?.addEventListener('click', async () => {
    if (promptPwa) {
      promptPwa.prompt();
      await promptPwa.userChoice;
      promptPwa = null;
    } else {
      ctx.mostrarToast('Use o menu do navegador → "Adicionar à tela inicial / Instalar app".', 3600);
    }
  });
  $('btn-refazer-tutorial')?.addEventListener('click', () => {
    fechar('modal-config');
    iniciarTutorial(true);
  });
  $('btn-exportar-save')?.addEventListener('click', async () => {
    const txt = ctx.exportarSaveJson();
    try { await navigator.clipboard.writeText(txt); ctx.mostrarToast('Código do Save copiado para a área de transferência!', 2600); }
    catch { ctx.mostrarToast('Save pronto no console (window.regiao1.save()).', 2600); }
  });

  // ---- Modal de Recompensa Offline (AFK) ----
  let ganhoOfflinePendente = null;
  function verificarGanhoOffline(forcar = false) {
    const save = ctx.getSave();
    const mapa = ctx.getMapaAtual();
    const ws = MONSTROS_SELVAGENS.filter((w) => w.mapa === mapa?.id);
    const nvMed = ws.length ? Math.round(ws.reduce((a, b) => a + b.nivel, 0) / ws.length) : 6;
    const resumo = calcularGanhoOffline(save, nvMed);
    if (!resumo && !forcar) return;
    if (!resumo) return;
    ganhoOfflinePendente = { resumo, especie: ws[0]?.especie || 'Noctarn' };
    $('afk-detalhe').innerHTML = `
      <b>Tempo fora:</b> ${Math.floor(resumo.minutos / 60)}h ${resumo.minutos % 60}m<br>
      ⚔️ Abates estimados: <b>${resumo.abates}</b><br>
      🪙 Gold: <b>+${resumo.gold}g</b> · ⭐ XP: <b>+${resumo.xp}</b><br>
      🥚 Ovos encontrados: <b>${resumo.ovos}</b> ${resumo.colheitaFazenda ? `· 🌱 Fazenda: +${resumo.colheitaFazenda} recursos` : ''}
    `;
    abrir('modal-offline');
  }
  $('btn-coletar-afk')?.addEventListener('click', () => {
    if (ganhoOfflinePendente) {
      const save = ctx.getSave();
      aplicarGanhoOffline(save, ganhoOfflinePendente.resumo, ganhoOfflinePendente.especie);
      registrarLogIdle(garantirEstadoIdle(save), `⏱️ AFK coletado: +${ganhoOfflinePendente.resumo.gold}g, +${ganhoOfflinePendente.resumo.xp} XP`, 'farm');
      ganhoOfflinePendente = null;
      ctx.salvar();
      atualizarHudIdle();
    }
    fechar('modal-offline');
  });

  // ---- Tutorial Guiado Curto (6 passos, opcional) ----
  const PASSOS_TUTORIAL = [
    { tit: '1/6 · Bem-vindo ao Confusion Waves', txt: 'Você está na Região 1 (48 áreas 2D). No topo ficam seu Nível, HP, Sanidade e recursos.' },
    { tit: '2/6 · Auto-Rota Automática', txt: 'Toque no banner da missão (🧭 Auto-Rota) para andar, coletar pistas, falar com NPCs e avançar missões sozinho.' },
    { tit: '3/6 · Montaria', txt: 'Seu domador anda montado quando uma montaria está equipada; os Oníricos da equipe lutam ao seu lado. Montado, você ganha +100% de velocidade de movimento.' },
    { tit: '4/6 · Modo Idle (⚔️ Auto · ON/OFF)', txt: 'Ligue Auto · ON para caçar monstros direto no mapa com dano flutuante, auto-captura e ganho de XP/Gold.' },
    { tit: '5/6 · Atlas de Caça & Codex', txt: 'No botão Caçar (ou minimapa) você vê todas as 48 áreas, o selo de risco e viaja direto. O Codex dá bônus permanentes!' },
    { tit: '6/6 · Economia de Energia & Menu', txt: 'No Menu (☰) você acessa Passe de Temporada, Mochila/Relíquias, Vote & Ganhe e o Modo Economia de Energia para farmar no celular.' },
  ];
  let passoTut = 0;
  function iniciarTutorial(forcar = false) {
    const idle = garantirEstadoIdle(ctx.getSave());
    if (idle.config.tutorialConcluido && !forcar) return;
    passoTut = 0;
    renderizarTutorial();
    abrir('modal-tutorial');
  }
  function renderizarTutorial() {
    const p = PASSOS_TUTORIAL[passoTut];
    $('tut-titulo').textContent = p.tit;
    $('tut-texto').textContent = p.txt;
    $('btn-tut-prox').textContent = passoTut === PASSOS_TUTORIAL.length - 1 ? 'Começar!' : 'Próximo →';
  }
  $('btn-tut-prox')?.addEventListener('click', () => {
    if (passoTut < PASSOS_TUTORIAL.length - 1) {
      passoTut++;
      renderizarTutorial();
    } else {
      garantirEstadoIdle(ctx.getSave()).config.tutorialConcluido = true;
      ctx.salvar();
      fechar('modal-tutorial');
    }
  });
  $('btn-tut-pular')?.addEventListener('click', () => {
    garantirEstadoIdle(ctx.getSave()).config.tutorialConcluido = true;
    ctx.salvar();
    fechar('modal-tutorial');
  });

  return {
    atualizarHudIdle,
    atualizarMinimapa,
    spawnFlutuante,
    verificarGanhoOffline,
    iniciarTutorial,
    abrirAtlas,
    abrirCodex,
    abrirMochila,
    abrirTemporada,
    abrirConfigAutoCaca,
    abrirMenu: renderizarMenu,
  };
}
