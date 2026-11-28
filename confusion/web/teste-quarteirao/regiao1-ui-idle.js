// Controlador de UI Idle para Confusion Waves: Double Perspective (Região 1).
// Gerencia: HUD compacto, Minimapa circular, Menu único, Atlas de Caça, Config Auto-Caça,
// Codex Onírico, Mochila & Status Explicáveis, Temporada/Passe/Login/Diárias, Vote & Ganhe,
// Economia de Energia, Recompensa Offline, Dano Flutuante, Buffs, Mini-Log, PWA e Tutorial guiado.

import { MAPAS, ORDEM_MAPAS } from './regiao1-mapas.js';
import { MONSTROS_SELVAGENS, MONSTROS_SELVAGENS_R2, ENTIDADES_BOSS } from './regiao1-entidades.js';
import { QUESTS_DEFINICOES } from './regiao1-estado.js';
import { regiaoDesbloqueada } from './regiao1-regioes-regras.js';
import { comprarPassePremium, PASSE_CFG } from './regiao1-passe-regras.js';
import {
  listarMoldurasPerfil,
  listarIconesPerfil,
  equiparMolduraPerfil,
  equiparIconePerfil,
  sincronizarDesbloqueiosPerfil,
  perfilDomadorDe,
} from './regiao1-perfil-regras.js';
import { aplicarFundoTelaSobDemanda } from './regiao1-perf-mobile.js';
import {
  I18N,
  ATRIBUTOS_DOMADOR,
  ESPECIES,
  PASS_LEVELS,
  garantirEstadoIdle,
  bonusCodex,
  calcularStatusDetalhado,
  distribuirAtributoDomador,
  resetarAtributosDomador,
  avaliarRiscoArea,
  calcularGanhoOffline,
  aplicarGanhoOffline,
  liquidarPeriodoIdle,
  resgatarDiaria,
  trocarMissaoDiaria,
  resgatarLoginDiario,
  resgatarTudoPasse,
  comprarNivelPasse,
  infoPasse,
  trilhaPasse,
  infoLogin7Dias,
  chocarPrimeiroOvo,
  registrarVotoPortal,
  resgatarLojaVoto,
  resumoEventosAtuais,
  registrarLogIdle,
} from './regiao1-idle.js';
import { fragmentosSonhoDe, ONDE_CONSEGUIR_FRAGMENTOS } from './regiao1-regras-sonho.js';
import { NOME_ELEMENTO } from '../core.js';
import { CHEFES_REVANCHE_CATALOGO, saldoFragmentosChefe } from './regiao1-revanche-regras.js';
import { revelarOvo, mostrarRecompensas } from './regiao1-revelacao.js';
import { ARTE_DA_ESPECIE } from '../species.js';

export function criarControladorIdleUI(ctx) {
  let promptPwa = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    promptPwa = e;
  });

  const $ = (id) => document.getElementById(id);
  const abrir = (id) => (ctx.abrirModal ? ctx.abrirModal(id) : $(id)?.classList.add('aberto'));
  const fechar = (id) => (ctx.fecharModal ? ctx.fecharModal(id) : $(id)?.classList.remove('aberto'));

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
      const selo = btnMenu.querySelector('#menu-selo-mundo');
      btnMenu.textContent = st.pontosDisponiveis > 0 ? `☰ ${t.menu} •` : `☰ ${t.menu}`;
      if (selo) btnMenu.appendChild(selo);
    }
    const btnAtlas = $('btn-atlas-rapido');
    if (btnAtlas) btnAtlas.textContent = `🗺️ ${t.atlas}`;

    // Buffs ativos na lateral esquerda
    const buffsEl = $('barra-buffs');
    if (buffsEl) {
      const buffs = [
        { ic: '🛡️', nome: 'Escudo 7d', desc: '+20% Encontros e proteção inicial nos primeiros 7 dias.' },
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
  const logSessao = [];
  const logVistos = new Set();
  function sincronizarLogSessao(logs) {
    for (const l of (logs || [])) {
      const k = `${l.ts || ''}|${l.tipo || ''}|${l.texto || ''}`;
      if (!logVistos.has(k)) { logVistos.add(k); logSessao.push(l); }
    }
  }
  function renderizarMiniLog() {
    const corpo = $('minilog-corpo');
    if (!corpo) return;
    const idle = garantirEstadoIdle(ctx.getSave());
    sincronizarLogSessao(idle.logs);
    const filtrados = logSessao.filter((l) => abaLogAtiva === 'todos' || l.tipo === abaLogAtiva);
    corpo.innerHTML = filtrados.length
      ? filtrados.map((l) => `<div class="ml-ln">${l.texto}</div>`).join('')
      : '<div class="ml-ln" style="color:#64748b">Ligue Auto · ON ou cace monstros para ver o registro.</div>';
    corpo.scrollTop = corpo.scrollHeight;
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
  $('m-descanso')?.addEventListener('click', () => abrirDoMenu(() => window.regiaoExp?.abrir('descanso')));
  $('m-diario')?.addEventListener('click', () => abrirDoMenu(() => ctx.abrirDiario()));
  $('m-missoes')?.addEventListener('click', () => abrirDoMenu(() => window.regiaoExp?.abrir?.('missoes')));
  $('btn-missoes-campanha')?.addEventListener('click', () => window.regiaoExp?.abrir?.('missoes'));
  $('btn-sair-conta')?.addEventListener('click', async () => {
    fechar('modal-config');
    if (window.regiaoConta?.sair) {
      await window.regiaoConta.sair();
      ctx.mostrarToast('Sessão encerrada. Seu progresso local continua salvo neste navegador.', 3200);
    } else {
      ctx.mostrarToast('Modo convidado: seu progresso local continua salvo neste navegador.', 2800);
    }
  });
  $('m-atlas')?.addEventListener('click', () => abrirDoMenu(abrirAtlas));
  $('m-autocaca')?.addEventListener('click', () => abrirDoMenu(abrirConfigAutoCaca));
  $('m-mochila')?.addEventListener('click', () => abrirDoMenu(abrirMochila));
  $('m-codex')?.addEventListener('click', () => abrirDoMenu(abrirCodex));
  $('m-temporada')?.addEventListener('click', () => abrirDoMenu(abrirTemporada));
  $('m-mapa48')?.addEventListener('click', () => abrirDoMenu(() => ctx.abrirMapa48()));
  $('m-voto')?.addEventListener('click', () => abrirDoMenu(abrirVoto));
  $('m-config')?.addEventListener('click', () => abrirDoMenu(abrirConfig));

  // ---- Atlas de Caça ----
  const biomas = $('atlas-bioma');
  if (biomas) {
    biomas.replaceChildren(...['Todos', ...new Set(ORDEM_MAPAS.map(id => MAPAS[id].bioma))]
      .map(bioma => new Option(bioma)));
  }
  const selvagensDaArea = (mapa) => {
    const lista = mapa?.regiao === 'r2' ? MONSTROS_SELVAGENS_R2 : MONSTROS_SELVAGENS;
    return lista.filter(w => w.mapa === mapa?.id);
  };
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
    for (const w of [...MONSTROS_SELVAGENS, ...MONSTROS_SELVAGENS_R2]) {
      (wildsPorMapa[w.mapa] ||= []).push(w);
    }

    const r2Liberada = regiaoDesbloqueada(save, 'r2');
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
      const bloqueada = m.regiao === 'r2' && !r2Liberada;
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
            <button class="btn-sec" style="padding:5px 9px;font-size:11.5px" data-ir-mapa="${m.id}" ${bloqueada ? 'disabled' : ''}>${bloqueada ? 'Bloqueada' : 'Ir'}</button>
            ${ws.length && !bloqueada ? `<button class="btn-pri" style="padding:5px 9px;font-size:11.5px" data-cacar-mapa="${m.id}">Caçar</button>` : ''}
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
    const especiesMapa = [...new Set(selvagensDaArea(mapa).map((w) => w.especie))];
    $('ac-toggle').checked = Boolean(idle.autoCaca.ativo);
    $('ac-vantagem').checked = Boolean(idle.autoCaca.preferirVantagem);
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
    idle.autoCaca.autoCapturar = false;
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
      <b>Pontos do Codex:</b> ${c.pontos} · <b>Marcos:</b> ${c.marcos} · <b>Áreas:</b> ${c.nAreas}/${ORDEM_MAPAS.length} · <b>Chefes:</b> ${c.nBosses}/${ENTIDADES_BOSS.length}<br>
      <span style="color:#4ade80">Bônus Permanentes da Conta: +${c.hpPct}% HP · +${c.atkPct}% ATK · +${c.fazendaPct}% Fazenda</span>
    `;
    const lista = $('codex-lista');
    lista.innerHTML = Object.entries(ESPECIES).slice(0, 12).map(([nome, esp]) => {
      const reg = idle.codex.especies[nome];
      const status = reg ? `Abates: ${reg.abates}` : 'Ainda não descoberto';
      return `
        <div class="card-row" style="opacity:${reg ? 1 : 0.55}">
          <div>
            <b>${nome}</b> <span class="tag">${esp.elemento || esp.pureza}</span>
            <div class="sub">${status} · Habilidades: ${esp.habilidades.slice(0, 3).join(', ')}</div>
          </div>
          <span class="tag" style="color:${reg ? '#4ade80' : '#94a3b8'}">${reg ? '✓ Registrado' : '???'}</span>
        </div>
      `;
    }).join('');
    abrir('modal-codex');
  }

  // ---- Mochila, Atributos do Domador, Fragmentos, Chefes, Ovos & Itens por categoria ----
  let mochilaCat = 'domador';
  function selecionarCatMochila(cat) {
    mochilaCat = cat || 'domador';
    $('modal-mochila')?.querySelectorAll('[data-mochila-cat]').forEach((b) => {
      b.setAttribute('aria-selected', String(b.dataset.mochilaCat === mochilaCat));
    });
    $('modal-mochila')?.querySelectorAll('[data-cat-pane]').forEach((p) => {
      p.hidden = p.dataset.catPane !== mochilaCat;
    });
    const det = $('mochila-detalhe');
    if (det) det.style.display = 'none';
    const corpo = $('mochila-corpo');
    if (corpo) corpo.scrollTop = 0;
  }
  function mostrarDetalheMochila({ nome, categoria, qtd, desc, icone }) {
    const det = $('mochila-detalhe');
    if (!det) return;
    det.style.display = 'flex';
    det.innerHTML = `<div style="display:flex;align-items:center;gap:10px">
      ${icone ? `<img src="${icone}" alt="" style="width:36px;height:36px;object-fit:contain">` : ''}
      <div><b>${nome}</b> <span class="tag">${categoria}</span> <b style="color:#facc15">×${qtd}</b><div class="sub">${desc}</div></div>
    </div>`;
  }
  $('hud-card-domador')?.addEventListener('click', () => abrirMochila('domador'));
  $('modal-mochila')?.querySelectorAll('[data-mochila-cat]').forEach((botao) => {
    botao.addEventListener('click', () => selecionarCatMochila(botao.dataset.mochilaCat));
  });

  const AVATAR_PADRAO = '../../../assets/confusion/interface/descanso-v1/avatar-azazel.webp';
  const AVATAR_ICONE_170 = {
    padrao: AVATAR_PADRAO,
    'icone-tiranox': '../../../assets/confusion/interface/passe-dinossauros-v2/icones/tiranox.png',
    'icone-tricerax': '../../../assets/confusion/interface/passe-dinossauros-v2/icones/tricerax.png',
    'icone-veloxar': '../../../assets/confusion/interface/passe-dinossauros-v2/icones/veloxar.png',
    'icone-pteronox': '../../../assets/confusion/interface/passe-dinossauros-v2/icones/pteronox.png',
  };
  const srcIconePerfil = (ic) => AVATAR_ICONE_170[ic.id] || (ic.arq ? `../../../${ic.arq}` : AVATAR_PADRAO);
  const srcMolduraPerfil = (m) => (m.arq ? `../../../${m.arq}` : '../../../assets/confusion/interface/kit-v2/perfil/farol.png');
  let persAberto = false;
  let previaFotoLocal = null;

  function imagemAtivaPerfil(save, icones) {
    const pf = perfilDomadorDe(save);
    // Foto pessoal só é exibida após aprovação da moderação; enquanto pendente ou reprovada mantém o retrato padrão/ícone
    if (pf.foto?.status === 'aprovada' && pf.foto.url) return pf.foto.url;
    const ic = icones.find((x) => x.equipado || x.id === pf.icone);
    return ic ? srcIconePerfil(ic) : AVATAR_PADRAO;
  }

  function renderizarCardDomador(save, st) {
    sincronizarDesbloqueiosPerfil(save);
    const pf = perfilDomadorDe(save);
    const molduras = listarMoldurasPerfil(save);
    const icones = listarIconesPerfil(save);
    const moldDef = molduras.find((m) => m.equipada) || molduras[0];
    const nome = save.conta?.nome || 'Azazel';
    const fotoAtiva = imagemAtivaPerfil(save, icones);
    const stFoto = pf.foto?.status || 'nenhuma';
    const badgeFoto = stFoto === 'pendente'
      ? '<div class="tag" style="color:#fde68a;border-color:#f59e0b;margin:4px 0 0">⏳ Foto em moderação</div>'
      : stFoto === 'reprovada'
        ? '<div class="tag" style="color:#fca5a5;border-color:#ef4444;margin:4px 0 0">✕ Foto reprovada</div>'
        : stFoto === 'aprovada'
          ? '<div class="tag" style="color:#86efac;border-color:#22c55e;margin:4px 0 0">✓ Foto aprovada</div>'
          : '';

    const cardEl = $('domador-card-perfil');
    if (cardEl) {
      cardEl.innerHTML = `
        <div class="dom-retrato-wrap" data-moldura="${moldDef.id}">
          <div class="dom-retrato-foto"><img src="${fotoAtiva}" alt="${nome}" onerror="this.src='${AVATAR_PADRAO}'"></div>
          <img class="dom-retrato-moldura" src="${srcMolduraPerfil(moldDef)}" alt="Moldura ${moldDef.nome}">
        </div>
        <b style="color:#fde68a;font-size:14px">${nome}</b>
        <div class="sub">Domador · Nv.${st.nivel} · ${moldDef.nome}</div>
        ${badgeFoto}
        <div style="margin-top:8px"><button type="button" class="btn-sec" id="btn-dom-personalizar" style="width:100%;padding:5px 8px;font-size:11.5px">${persAberto ? '✕ Fechar Personalização' : '🎨 Personalizar'}</button></div>
      `;
      $('btn-dom-personalizar')?.addEventListener('click', () => {
        persAberto = !persAberto;
        renderizarCardDomador(save, st);
      });
    }

    const persEl = $('domador-personalizar');
    if (!persEl) return;
    persEl.hidden = !persAberto;
    if (!persAberto) { persEl.innerHTML = ''; return; }

    const previaSrc = previaFotoLocal || fotoAtiva;
    persEl.innerHTML = `
      <div class="card-row" style="display:block;margin-bottom:10px;border-color:#f3a458">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px">
          <b style="color:#fde68a">🎨 Personalizar Perfil do Domador</b>
          <button type="button" class="btn-sec" id="btn-dom-pers-fechar" style="padding:3px 8px;font-size:11px">Fechar</button>
        </div>
        <div class="sec-tit" style="margin-top:4px">Molduras (${molduras.filter((m) => m.desbloqueada).length}/${molduras.length})</div>
        <div class="dom-pers-grade">
          ${molduras.map((m) => `<button type="button" class="dom-pers-item ${m.equipada ? 'ativo' : ''} ${m.desbloqueada ? '' : 'bloqueado'}" data-moldura-id="${m.id}" title="${m.desbloqueada ? m.nome : `Bloqueada: ${m.req}`}">
              <img src="${srcMolduraPerfil(m)}" alt="${m.nome}">
              <div>${m.desbloqueada ? '' : '🔒 '}${m.nome}</div>
            </button>`).join('')}
        </div>
        <div class="sec-tit">Ícones Equipáveis (${icones.filter((ic) => ic.desbloqueado).length}/${icones.length})</div>
        <div class="dom-pers-grade">
          ${icones.map((ic) => `<button type="button" class="dom-pers-item ${ic.equipado && pf.foto?.status !== 'aprovada' ? 'ativo' : ''} ${ic.desbloqueado ? '' : 'bloqueado'}" data-icone-id="${ic.id}" title="${ic.desbloqueado ? ic.nome : `Bloqueado: ${ic.req}`}">
            <img src="${srcIconePerfil(ic)}" alt="${ic.nome}" style="border-radius:6px;object-fit:cover" onerror="this.src='${AVATAR_PADRAO}'">
            <div>${ic.desbloqueado ? '' : '🔒 '}${ic.nome}</div>
          </button>`).join('')}
        </div>
        <div class="sec-tit">Foto da Galeria (Moderação obrigatória)</div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <div class="dom-retrato-wrap" style="width:92px;max-width:92px;margin:0;flex:0 0 92px">
            <div class="dom-retrato-foto"><img id="dom-previa-foto" src="${previaSrc}" alt="Prévia"></div>
            <img class="dom-retrato-moldura" src="${srcMolduraPerfil(moldDef)}" alt="">
          </div>
          <div style="flex:1;min-width:190px">
            <div class="sub" style="margin-bottom:6px">Centralize o rosto no recorte quadrado (JPG, PNG ou WEBP até 2 MB). Fotos passam por moderação de nudez e conteúdo impróprio antes de aparecer no perfil.</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
              <label class="btn-sec" style="display:inline-block;cursor:pointer;padding:5px 9px;font-size:11px">📷 Escolher Foto<input type="file" id="dom-input-foto" accept="image/jpeg,image/png,image/webp" style="display:none"></label>
              <button type="button" class="btn-pri" id="btn-dom-enviar-foto" style="padding:5px 10px;font-size:11px" ${previaFotoLocal ? '' : 'disabled'}>Enviar p/ Moderação</button>
              ${pf.foto?.status && pf.foto.status !== 'nenhuma' ? '<button type="button" class="btn-danger" id="btn-dom-remover-foto" style="padding:5px 9px;font-size:11px">Remover Foto</button>' : ''}
            </div>
            <div id="dom-foto-msg" class="sub" style="margin-top:5px;color:${stFoto === 'reprovada' ? '#fca5a5' : stFoto === 'aprovada' ? '#86efac' : '#fde68a'}">${pf.foto?.motivo || ''}</div>
          </div>
        </div>
      </div>
    `;

    $('btn-dom-pers-fechar')?.addEventListener('click', () => { persAberto = false; renderizarCardDomador(save, st); });
    persEl.querySelectorAll('[data-moldura-id]').forEach((b) => {
      b.onclick = () => {
        const r = equiparMolduraPerfil(save, b.dataset.molduraId);
        if (!r.ok) { ctx.mostrarToast(`🔒 ${r.motivo}`, 2600); return; }
        ctx.salvar();
        ctx.mostrarToast(`Moldura "${r.moldura.nome}" equipada!`, 2000);
        renderizarCardDomador(save, st);
      };
    });
    persEl.querySelectorAll('[data-icone-id]').forEach((b) => {
      b.onclick = () => {
        const r = equiparIconePerfil(save, b.dataset.iconeId);
        if (!r.ok) { ctx.mostrarToast(`🔒 ${r.motivo}`, 2600); return; }
        if (pf.foto?.status === 'aprovada') pf.foto = { status: 'nenhuma', url: null, motivo: '' };
        ctx.salvar();
        ctx.mostrarToast(`Ícone "${r.icone.nome}" equipado!`, 2000);
        renderizarCardDomador(save, st);
      };
    });
    $('dom-input-foto')?.addEventListener('change', (ev) => {
      const file = ev.target.files?.[0];
      const msgEl = $('dom-foto-msg');
      if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        previaFotoLocal = null;
        if (msgEl) { msgEl.style.color = '#fca5a5'; msgEl.textContent = 'Formato inválido. Use JPG, PNG ou WEBP.'; }
        ctx.mostrarToast('Formato inválido: use JPG, PNG ou WEBP.', 2600);
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        previaFotoLocal = null;
        if (msgEl) { msgEl.style.color = '#fca5a5'; msgEl.textContent = 'Arquivo muito grande (máximo 2 MB).'; }
        ctx.mostrarToast('Arquivo muito grande (máximo 2 MB).', 2600);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        previaFotoLocal = String(reader.result || '');
        const im = $('dom-previa-foto');
        if (im) im.src = previaFotoLocal;
        const btnEnv = $('btn-dom-enviar-foto');
        if (btnEnv) btnEnv.disabled = false;
        if (msgEl) { msgEl.style.color = '#fde68a'; msgEl.textContent = 'Prévia pronta. Clique em "Enviar p/ Moderação".'; }
      };
      reader.readAsDataURL(file);
    });
    $('btn-dom-enviar-foto')?.addEventListener('click', async () => {
      if (!previaFotoLocal) return;
      const msgEl = $('dom-foto-msg');
      if (msgEl) { msgEl.style.color = '#fde68a'; msgEl.textContent = 'Enviando para moderação...'; }
      try {
        const token = window.confusionConta?.getToken?.() || localStorage.getItem('confusion_access_token') || '';
        if (!token) {
          pf.foto = { status: 'pendente', url: null, motivo: 'Foto em moderação local. Entre em uma conta para enviar ao servidor; o retrato padrão permanece ativo.' };
          previaFotoLocal = null;
          ctx.salvar();
          ctx.mostrarToast('⏳ Foto enviada para moderação (retrato padrão mantido).', 2800);
          renderizarCardDomador(save, st);
          return;
        }
        const resp = await fetch('/api/perfil-foto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ dataUrl: previaFotoLocal }),
        });
        const data = await resp.json().catch(() => ({}));
        if (resp.status === 422 || data.status === 'reprovada') {
          pf.foto = { status: 'reprovada', url: null, motivo: data.motivo || 'Foto reprovada pela moderação.' };
          previaFotoLocal = null;
          ctx.salvar();
          ctx.mostrarToast('✕ Foto reprovada pela moderação. Retrato padrão mantido.', 3200);
          renderizarCardDomador(save, st);
          return;
        }
        if (!resp.ok) {
          if (msgEl) { msgEl.style.color = '#fca5a5'; msgEl.textContent = data.motivo || 'Falha no envio da foto.'; }
          return;
        }
        pf.foto = {
          status: data.status === 'aprovada' ? 'aprovada' : 'pendente',
          url: data.status === 'aprovada' ? (data.url || null) : null,
          motivo: data.motivo || '',
        };
        previaFotoLocal = null;
        ctx.salvar();
        ctx.mostrarToast(pf.foto.status === 'aprovada' ? '✓ Foto aprovada e aplicada!' : '⏳ Foto em moderação (retrato padrão mantido).', 2800);
        renderizarCardDomador(save, st);
      } catch {
        pf.foto = { status: 'pendente', url: null, motivo: 'Sem conexão com o servidor; foto mantida em análise e retrato padrão ativo.' };
        previaFotoLocal = null;
        ctx.salvar();
        renderizarCardDomador(save, st);
      }
    });
    $('btn-dom-remover-foto')?.addEventListener('click', async () => {
      const token = window.confusionConta?.getToken?.() || localStorage.getItem('confusion_access_token') || '';
      if (token) {
        fetch('/api/perfil-foto', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
      }
      pf.foto = { status: 'nenhuma', url: null, motivo: '' };
      previaFotoLocal = null;
      ctx.salvar();
      ctx.mostrarToast('Foto removida. Retrato padrão restaurado.', 2200);
      renderizarCardDomador(save, st);
    });
  }

  function abrirMochila(catInicial = null) {
    if (typeof catInicial === 'string') mochilaCat = catInicial;
    const save = ctx.getSave();
    const idle = garantirEstadoIdle(save);
    const st = calcularStatusDetalhado(save);
    const attrs = idle.jogador.atributos || { for: 0, vit: 0, men: 0, vin: 0, sor: 0 };
    const gastos = (attrs.for || 0) + (attrs.vit || 0) + (attrs.men || 0) + (attrs.vin || 0) + (attrs.sor || 0);
    renderizarCardDomador(save, st);

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

    const MV1 = (p) => `../../../assets/confusion/interface/menus-v1/${p}`;
    const slugSonho = (el) => {
      const k = String(el || 'neutro').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return k === 'sombra' ? 'trevas' : k;
    };

    const fragEl = $('mochila-fragmentos');
    if (fragEl) {
      const fragsSonho = fragmentosSonhoDe(save);
      const totalSonho = Object.values(fragsSonho).reduce((a, b) => a + (Number(b) || 0), 0);
      const sonhoHtml = Object.entries(fragsSonho).map(([el, qtd]) => {
        const ic = MV1(`ficha/sonho-${slugSonho(el)}.png`);
        const fontes = ONDE_CONSEGUIR_FRAGMENTOS[el]?.fontes || [];
        const ondeTxt = fontes.length
          ? ` Onde conseguir: ${fontes.map((f) => `${f.modo} (${f.local})`).join(' · ')}.`
          : '';
        const descCompleta = `Evolui Oníricos do elemento ${NOME_ELEMENTO[el] || el} na Ficha: 10 (Base→2ª forma) e 30 (2ª→3ª forma).${ondeTxt}`;
        return `<button type="button" class="mv1-slot" title="${descCompleta.replace(/"/g, '&quot;')}" data-item-nome="Fragmento de Sonho (${NOME_ELEMENTO[el] || el})" data-item-cat="Evolução" data-item-qtd="${qtd}" data-item-ic="${ic}" data-item-desc="${descCompleta.replace(/"/g, '&quot;')}">
          <img src="${ic}" alt="${el}" onerror="this.src='${MV1('ficha/sonho-neutro.png')}'">
          <b>${NOME_ELEMENTO[el] || el}</b>
          <span style="color:#d8b4fe">${qtd}</span>
        </button>`;
      }).join('');
      fragEl.innerHTML = `
        <div class="sub" style="margin-bottom:6px">Total: <b>${totalSonho}</b> fragmentos · Toque em um fragmento para ver uso e <b>onde conseguir</b>.</div>
        <div class="mv1-grade">${sonhoHtml}</div>
      `;
      fragEl.querySelectorAll('.mv1-slot').forEach((btn) => {
        btn.onclick = () => {
          fragEl.querySelectorAll('.mv1-slot').forEach((x) => x.classList.remove('ativo'));
          btn.classList.add('ativo');
          mostrarDetalheMochila({ nome: btn.dataset.itemNome, categoria: btn.dataset.itemCat, qtd: btn.dataset.itemQtd, desc: btn.dataset.itemDesc, icone: btn.dataset.itemIc });
        };
      });
    }

    const chefesEl = $('mochila-chefes');
    if (chefesEl) {
      const chefesHtml = Object.entries(CHEFES_REVANCHE_CATALOGO).map(([bossId, def]) => {
        const qtd = saldoFragmentosChefe(save, bossId);
        return `<div class="card-row">
          <div style="display:flex;align-items:center;gap:10px">
            <img src="${MV1('chefes/fragmento.png')}" alt="" style="width:32px;height:32px;object-fit:contain">
            <div><b>Fragmento · ${def.nome}</b><div class="sub">Junte 10 para criar ${def.especieRecrutavel} (Nv.1 · T5 · +20%) em Caçadas &amp; Chefes.</div></div>
          </div>
          <b style="color:#fbbf24">${qtd}/10</b>
        </div>`;
      }).join('');
      const exclusivos = Object.entries(idle.mochila.itensExclusivosChefe || {}).filter(([, q]) => q > 0);
      const excHtml = exclusivos.length
        ? `<div class="sec-tit">Drops Exclusivos</div>${exclusivos.map(([id, q]) => `<div class="card-row"><div><b>${id}</b><div class="sub">Drop exclusivo obtido em Revanche de Chefe.</div></div><b>×${q}</b></div>`).join('')}`
        : '<div class="sub" style="margin-top:6px">Derrote chefes em Revanche para obter drops exclusivos.</div>';
      chefesEl.innerHTML = chefesHtml + excHtml;
    }

    const ovosEl = $('mochila-ovos');
    if (ovosEl) {
      ovosEl.innerHTML = idle.mochila.ovos.length
        ? `<div class="card-row" style="border-color:#fbbf2466;margin-bottom:6px">
            <div><b>Ovos disponíveis: ${idle.mochila.ovos.length}</b><div class="sub">Chocar abre o primeiro ovo da fila e adiciona o Onírico no Nível 1.</div></div>
            <button class="btn-pri" id="btn-chocar-ovo">🥚 Chocar Próximo</button>
          </div>
          <div class="mv1-grade">${idle.mochila.ovos.map((o, idx) => {
            const t = Math.max(1, Math.min(5, Number(o.tier) || 2));
            const ic = MV1(`passe/ovo-t${t}.png`);
            const nome = o.nome || o.especie || 'Ovo Onírico';
            const desc = `Ovo T${t} (${o.forma || 'natural'})${o.temporada ? ` · Temporada ${o.temporada}` : ''}${o.origem ? ` · Origem: ${o.origem}` : ''}.`;
            return `<button type="button" class="mv1-slot" data-ovo-idx="${idx}" data-item-nome="${nome}" data-item-cat="Ovo T${t}" data-item-qtd="1" data-item-ic="${ic}" data-item-desc="${desc}">
              <img src="${ic}" alt="${nome}">
              <b>${nome}</b>
              <span style="color:#fbbf24">T${t}</span>
            </button>`;
          }).join('')}</div>`
        : '<div class="sub">Nenhum ovo na mochila ainda. Avance no Passe, reproduza Oníricos ou cace no Idle para obter ovos.</div>';
      ovosEl.querySelectorAll('.mv1-slot').forEach((btn) => {
        btn.onclick = () => {
          ovosEl.querySelectorAll('.mv1-slot').forEach((x) => x.classList.remove('ativo'));
          btn.classList.add('ativo');
          mostrarDetalheMochila({ nome: btn.dataset.itemNome, categoria: btn.dataset.itemCat, qtd: btn.dataset.itemQtd, desc: btn.dataset.itemDesc, icone: btn.dataset.itemIc });
        };
      });
      $('btn-chocar-ovo')?.addEventListener('click', () => {
        const r = chocarPrimeiroOvo(save);
        if (r.ok) {
          const on = r.onirico || { especie: r.ovo.especie, tier: r.ovo.tier || 2, nivel: 1, estrelas: 1 };
          ctx.mostrarToast(`🥚 Nasceu ${on.especie} (T${on.tier || on.raridade || 2} · Nv.${on.nivel || 1})!`, 3200);
          registrarLogIdle(idle, `🥚 Ovo chocado: ${on.especie} (T${on.tier || 2} · Nv.${on.nivel || 1})!`, 'farm');
          ctx.salvar();
          atualizarHudIdle();
          if (r.ovo.tipo === 'ovoT5' || r.ovo.temporada) {
            revelarOvo({
              edicao: r.ovo.tema || 'dinossauros',
              ovo: { nome: r.ovo.nome || 'Ovo de Dinossauro', tier: r.ovo.tier || 5 },
              recompensa: { especie: on.especie, tier: on.tier || 5, nivel: on.nivel || 1, estrelas: on.estrelas || 1, arte: ARTE_DA_ESPECIE[on.especie] || '' },
              nivel: 100,
            }).then(() => abrirMochila('ovos'));
          } else {
            abrirMochila('ovos');
          }
        }
      });
    }

    const itensEl = $('mochila-itens');
    if (itensEl) {
      const fab = idle.estrategia?.fab || {};
      const mats = Object.entries(fab.materiais || {}).filter(([, q]) => q > 0).map(([k, q]) => ({
        nome: k[0].toUpperCase() + k.slice(1), cat: 'Material', qtd: q, desc: 'Recurso da Fazenda e Caçadas usado em contratos da Guilda e receitas da Oficina.', ic: '',
      }));
      const itensOf = Object.entries(fab.gestao?.itens || {}).filter(([, q]) => q > 0).map(([k, q]) => ({
        nome: k.replace(/_/g, ' '), cat: 'Oficina', qtd: q, desc: 'Consumível produzido na Oficina para Calabouço, Crise ou contratos.', ic: '',
      }));
      const pocoes = Object.entries(idle.hw?.pocoes || {}).filter(([, q]) => q > 0).map(([k, q]) => ({
        nome: k.replace(/_/g, ' '), cat: 'Poção XP', qtd: q, desc: 'Poção de experiência aplicável ao Domador ou a qualquer Onírico em Halloween → Poções.', ic: '',
      }));
      const tickets = [
        { nome: 'Tickets de Invocação', cat: 'Banner', qtd: idle.exp?.tickets || 0, desc: 'Usados no Banner de Invocação (×1 ou ×10).', ic: MV1('passe/ticket-dinossauros.png') },
        { nome: 'Tickets de Halloween', cat: 'Evento', qtd: idle.hw?.tickets || 0, desc: 'Saldo separado usado no Banner Mensal de Halloween.', ic: '../../../assets/confusion/interface/eventos/halloween/itens/ticket.webp' },
        { nome: 'Doces de Halloween', cat: 'Evento', qtd: idle.hw?.doces || 0, desc: 'Evoluem exclusivos de Halloween ou compram itens na Loja da Torre.', ic: '../../../assets/confusion/interface/eventos/halloween/itens/doce.webp' },
      ];
      const listaItens = [...tickets, ...mats, ...itensOf, ...pocoes];
      itensEl.innerHTML = `<div class="mv1-grade">${listaItens.map((it) => `
        <button type="button" class="mv1-slot" data-item-nome="${it.nome}" data-item-cat="${it.cat}" data-item-qtd="${it.qtd}" data-item-ic="${it.ic}" data-item-desc="${it.desc}">
          ${it.ic ? `<img src="${it.ic}" alt="" onerror="this.style.display='none'">` : '<span style="font-size:22px;line-height:32px">📦</span>'}
          <b>${it.nome}</b>
          <span style="color:#fde68a">×${it.qtd}</span>
        </button>
      `).join('')}</div>`;
      itensEl.querySelectorAll('.mv1-slot').forEach((btn) => {
        btn.onclick = () => {
          itensEl.querySelectorAll('.mv1-slot').forEach((x) => x.classList.remove('ativo'));
          btn.classList.add('ativo');
          mostrarDetalheMochila({ nome: btn.dataset.itemNome, categoria: btn.dataset.itemCat, qtd: btn.dataset.itemQtd, desc: btn.dataset.itemDesc, icone: btn.dataset.itemIc });
        };
      });
    }

    selecionarCatMochila(mochilaCat);
    abrir('modal-mochila');
  }

  // ---- Temporada, Passe 100 Níveis (trilha navegável), Login 7 Dias (painel próprio) & Missões Diárias ----
  let trilhaFaixa = 0; // 0: 1..25, 1: 26..50, 2: 51..75, 3: 76..100
  let trilhaScrollSalvo = 0;
  const MV1_P = (p) => `../../../assets/confusion/interface/menus-v1/${p}`;
  function artePremioPasse(premio) {
    if (!premio) return '';
    if (premio.tipo === 'ovoT5') return MV1_P('passe/ovo-t5.png');
    if (premio.tipo === 'ovo') return MV1_P(`passe/ovo-t${Math.max(1, Math.min(5, Number(premio.tier) || 2))}.png`);
    if (premio.tipo === 'tickets') return MV1_P('passe/ticket-dinossauros.png');
    if (premio.tipo === 'moldura') return MV1_P('passe/moldura-garras-de-ambar.png');
    if (premio.tipo === 'acessorio') return MV1_P('passe/colar-dente-fossil.png');
    if (premio.tipo === 'casa') return MV1_P('passe/samambaia-jurassica.png');
    if (premio.tipo === 'montaria') return MV1_P('passe/fossil-de-ambar.png');
    return '';
  }

  function renderizarTrilhaPasse(save) {
    const itens = trilhaPasse(save);
    const navEl = $('temp-trilha-nav');
    const trilhaEl = $('temp-trilha');
    if (!navEl || !trilhaEl) return;
    trilhaEl.classList.add('mv1-trilha');
    const faixas = [[1, 25], [26, 50], [51, 75], [76, 100]];
    navEl.innerHTML = faixas.map(([a, b], i) => `
      <button class="btn-sec" data-faixa="${i}" style="padding:3px 9px;font-size:11px;${trilhaFaixa === i ? 'background:#f3a458;color:#21110c;font-weight:700' : ''}">Nv.${a}–${b}</button>
    `).join('');
    navEl.querySelectorAll('[data-faixa]').forEach((b) => {
      b.onclick = () => { trilhaFaixa = Number(b.dataset.faixa); trilhaScrollSalvo = 0; renderizarTrilhaPasse(save); };
    });
    const [ini, fim] = faixas[trilhaFaixa] || [1, 25];
    const corEst = { coletado: '#4ade80', pronto: '#fbbf24', liberado: '#7dd3fc', bloqueado: '#cbd5e1' };
    const bgEst = (it) => (it.nivel === 100
      ? MV1_P('passe/recompensa-grande-premio.png')
      : it.estado === 'coletado'
        ? MV1_P('passe/recompensa-resgatado.png')
        : it.estado === 'bloqueado'
          ? MV1_P('passe/recompensa-bloqueado.png')
          : MV1_P('passe/recompensa-disponivel.png'));
    const rotEst = {
      coletado: `<img class="mv1-ico" src="${MV1_P('comum/icone-resgatado.png')}" alt=""> Coletado`,
      pronto: '★ Resgatar',
      liberado: 'Disponível',
      bloqueado: 'Calendário',
    };
    const premiumAtivo = Boolean(save.idle?.passe?.premium || save.passe?.premium);
    const premioPremiumTexto = (it) => {
      if (it.premioPremium?.texto) return it.premioPremium.texto;
      if (it.nivel === 100) return '🥚 Ovo T5 Dinossauro + T5 Permanente';
      if (it.nivel === 10) return '🖼️ Moldura Âmbar Fóssil';
      if (it.nivel === 30) return '🖼️ Moldura Ossada Antiga';
      if (it.nivel === 60) return '🖼️ Moldura Pegadas no Barro';
      if (it.nivel % 10 === 0) return '🎟️ +4 Tickets Especiais';
      if (it.premio?.diamantes) return `💎 ${it.premio.diamantes * 2} (2×)`;
      return '💎 2× + Materiais';
    };
    trilhaEl.innerHTML = itens.slice(ini - 1, fim).map((it) => {
      const arte = artePremioPasse(it.premio);
      return `<div class="passe-col-dupla">
        <div class="mv1-passe-card" style="background-image:url('${bgEst(it)}')">
          <span class="mv1-passe-tag gratis">Grátis · Nv.${it.nivel}</span>
          ${arte ? `<img class="prem" src="${arte}" alt="">` : ''}
          <div style="min-height:24px;line-height:1.25">${it.premio.texto}</div>
          <span style="color:${corEst[it.estado]};font-size:10px">${it.estado === 'bloqueado' ? `<img class="mv1-ico" src="${MV1_P('comum/icone-cadeado.png')}" alt=""> Dia ${it.diaAbertura}` : rotEst[it.estado]}</span>
        </div>
        <div class="mv1-passe-card premium ${premiumAtivo ? '' : 'bloq'}" title="${premiumAtivo ? 'Trilha Premium ativa' : 'Passe Premium Dinossauros (5.000 💎)'}">
          <span class="mv1-passe-tag prem">👑 Premium</span>
          <div style="min-height:30px;line-height:1.25;margin:4px 0;color:#fde68a">${premioPremiumTexto(it)}</div>
          <span style="color:${premiumAtivo ? '#fde68a' : '#cbd5e1'};font-size:10px">${premiumAtivo ? (it.estado === 'coletado' ? '✓ Liberado' : rotEst[it.estado]) : '🔒 5.000 💎'}</span>
        </div>
      </div>`;
    }).join('');
    trilhaEl.scrollLeft = trilhaScrollSalvo;
  }

  function renderizarPainelLogin7d() {
    const save = ctx.getSave();
    const info = infoLogin7Dias(save);
    const resumoEl = $('login-7d-resumo');
    const gradeEl = $('login-7d-grade');
    const btnCol = $('btn-login-7d-coletar');
    if (!resumoEl || !gradeEl) return;
    resumoEl.innerHTML = info.jaColetouHoje
      ? `<b>Login de hoje já coletado!</b> (${info.coletados}/7 dias concluídos) · Próximo prêmio (Dia ${info.proximoDia}): <b>${info.proximoPremio.icone} ${info.proximoPremio.texto}</b>`
      : `<b>Dia ${info.diaDisponivel}/7 disponível agora!</b> · Coletados: ${info.coletados}/7 · Prêmio de hoje: <b>${info.proximoPremio.icone} ${info.proximoPremio.texto}</b>`;
    gradeEl.innerHTML = info.dias.map((d) => {
      const bg = d.estado === 'disponivel' ? MV1_P('login/dia-hoje.png') : d.estado === 'coletado' ? MV1_P('login/dia-recebido.png') : MV1_P('login/dia-futuro.png');
      const tag = d.estado === 'disponivel'
        ? '<b style="color:#fbbf24">★ Disponível</b>'
        : d.estado === 'coletado'
          ? `<span style="color:#4ade80"><img class="mv1-ico" src="${MV1_P('comum/icone-resgatado.png')}" alt=""> Coletado</span>`
          : `<span class="sub">Dia ${d.dia}</span>`;
      return `<div class="mv1-login-card" style="background-image:url('${bg}')">
        <div><b>Dia ${d.dia}</b></div>
        <img src="${MV1_P('login/icone-presente.png')}" alt="" style="width:28px;height:28px;object-fit:contain">
        <div style="min-height:28px">${d.icone} ${d.texto}</div>
        <div>${tag}</div>
      </div>`;
    }).join('');
    if (btnCol) {
      btnCol.disabled = info.jaColetouHoje;
      btnCol.textContent = info.jaColetouHoje ? '✓ Recompensa de Hoje Coletada' : `🎁 Coletar Dia ${info.diaDisponivel}/7`;
    }
  }

  function abrirLogin7dSobrePasse() {
    const trilhaEl = $('temp-trilha');
    if (trilhaEl) trilhaScrollSalvo = trilhaEl.scrollLeft;
    renderizarPainelLogin7d();
    const p = $('painel-login-7d');
    if (p) {
      p.style.display = 'block';
      aplicarFundoTelaSobDemanda(p, 'login-7-dias');
    }
  }

  function fecharLogin7dParaTrilha() {
    const p = $('painel-login-7d');
    if (p) p.style.display = 'none';
    const trilhaEl = $('temp-trilha');
    if (trilhaEl) trilhaEl.scrollLeft = trilhaScrollSalvo;
  }

  function abrirTemporada(preservarPosicao = false) {
    const save = ctx.getSave();
    const idle = garantirEstadoIdle(save);
    const ev = resumoEventosAtuais();
    const info = infoPasse(save);
    const trilhaEl = $('temp-trilha');
    if (preservarPosicao && trilhaEl) trilhaScrollSalvo = trilhaEl.scrollLeft;
    else if (!preservarPosicao) trilhaFaixa = Math.min(3, Math.floor(Math.max(0, info.nivel) / 25));

    const proxTxt = info.proximo
      ? `<b>Próximo (Passe Nv.${info.proximo.nivel}):</b> ${info.proximo.premio.texto}${info.proximo.premio.tier ? ` (Ovo T${info.proximo.premio.tier} · Onírico nasce Nv.1)` : ''} · Compra: ${info.proximo.preco}💎 (${info.proximo.liberado ? 'disponível hoje' : `abre dia ${info.proximo.dia} · ${info.proximo.data}`})`
      : `<b>Passe Nv.100 concluído!</b> Ovo de ${info.tema} (Tier T5 · Onírico nasce Nv.1) ${info.t5Pago ? 'no inventário/entregue' : 'pronto para coletar'}`;
    const faixaTxt = info.proximaFaixa
      ? ` · Próxima faixa (Nv.${info.proximaFaixa.ate}) abre dia ${info.proximaFaixa.dia} (${info.proximaFaixa.data})`
      : ' · Todas as faixas liberadas';

    $('temp-resumo').innerHTML = `
      <b>Passe · ${info.tema} (${info.edicao}):</b> Passe Nv.${info.nivel}/${info.niveis} (${info.xp.toLocaleString('pt-BR')} XP · ${info.xpNoNivel}/${info.xpPorNivel}) · Resgatado Nv.${info.resgatado}<br>
      <b>Marco Nv.100:</b> Ovo de Dinossauro T5 · Na eclosão: Onírico T5 no Nv.1<br>
      <b>Calendário (dia ${info.dia}/${info.dias}):</b> cota ${info.liberada.toLocaleString('pt-BR')} XP (Nv.${info.nivelLiberado} · +${info.cotaDia}/dia) · ${info.noTeto ? '<b>Cota atingida</b> (ouro, XP normal e Idle continuam)' : `Recuperável: <b>${info.recuperavel.toLocaleString('pt-BR')} XP</b>`}${faixaTxt}<br>
      ${proxTxt}<br>
      <b>Evento Semanal:</b> ${ev.semanal.nome} (${ev.semanal.efeito}) · <b>Raid (2h):</b> ${ev.raid.boss.nome} (${ev.raid.aberto ? `ABERTA · ${ev.raid.restanteMin}m` : `em ${ev.raid.abreEmMin}m`})
    `;
    const btnComprar = $('btn-passe-comprar');
    if (btnComprar) {
      btnComprar.disabled = !info.proximo || !info.proximo.liberado;
      btnComprar.textContent = !info.proximo
        ? '✓ Nv.100 Concluído'
        : info.proximo.liberado
          ? `💎 Comprar Nv.${info.proximo.nivel} (${info.proximo.preco}💎 · ${info.proximo.premio.texto})`
          : `🔒 Nv.${info.proximo.nivel} abre ${info.proximo.data} (${info.proximo.preco}💎)`;
    }
    const loginInfo = infoLogin7Dias(save);
    const btnLogin = $('btn-login-diario');
    if (btnLogin) {
      btnLogin.textContent = loginInfo.jaColetouHoje ? `🎁 Login 7d (${loginInfo.coletados}/7)` : `🎁 Login 7d (Dia ${loginInfo.diaDisponivel} pronto!)`;
    }
    renderizarTrilhaPasse(save);

    $('temp-diarias').innerHTML = `
      <div class="sub" style="margin-bottom:6px">Trocas (reroll) restantes hoje: <b>${idle.diarias.rerollsRestantes}</b></div>
      ${idle.diarias.itens.map((m) => `
        <div class="card-row">
          <div>
            <b>${m.titulo}</b> (${m.progresso}/${m.meta})
            <div class="sub">Recompensa: +${m.gold}g · +${m.xpPasse} XP Passe</div>
          </div>
          <div style="display:flex;gap:5px">
            ${!m.resgatada && m.progresso >= m.meta
              ? `<button class="btn-pri" style="padding:4px 9px;font-size:11px" data-resg-dm="${m.id}">Resgatar</button>`
              : !m.resgatada
                ? `<button class="btn-sec" style="padding:4px 8px;font-size:11px" data-ir-dm="${m.mapaSugerido}">${m.acaoRotulo || 'Ir caçar'}</button>
                   <button class="btn-sec" style="padding:4px 8px;font-size:11px" data-troca-dm="${m.id}">↻ Trocar</button>`
                : '<span class="tag" style="color:#4ade80">✓ Feita</span>'}
          </div>
        </div>
      `).join('')}
    `;

    $('temp-diarias').querySelectorAll('[data-resg-dm]').forEach((b) => {
      b.onclick = () => {
        const ok = resgatarDiaria(save, b.dataset.resgDm);
        if (ok) { ctx.mostrarToast(`+${ok.gold}g e +${ok.xpPasse} XP do Passe!`, 2400); ctx.salvar(); atualizarHudIdle(); abrirTemporada(true); }
      };
    });
    $('temp-diarias').querySelectorAll('[data-troca-dm]').forEach((b) => {
      b.onclick = () => {
        const r = trocarMissaoDiaria(save, b.dataset.trocaDm);
        ctx.mostrarToast(r.ok ? `Nova missão: ${r.nova.titulo}` : r.motivo, 2200);
        ctx.salvar();
        abrirTemporada(true);
      };
    });
    $('temp-diarias').querySelectorAll('[data-ir-dm]').forEach((b) => {
      b.onclick = async () => {
        fechar('modal-temporada');
        fechar('modal-exp');
        await ctx.viajarParaMapa(b.dataset.irDm, true);
        setTimeout(() => { window.regiao1?.interagir?.(); }, 350);
      };
    });

    const btnPrem = $('btn-passe-premium');
    if (btnPrem) {
      const ativoPrem = Boolean(info.premium);
      btnPrem.disabled = ativoPrem;
      btnPrem.textContent = ativoPrem ? '👑 Passe Premium Ativo' : `👑 Ativar Premium (${(PASSE_CFG.custoPremium || 5000).toLocaleString('pt-BR')} 💎)`;
    }
    const tempCorpo = $('temp-corpo');
    if (!preservarPosicao && tempCorpo) tempCorpo.scrollTop = 0;
    abrir('modal-temporada');
  }

  $('btn-passe-premium')?.addEventListener('click', () => {
    const save = ctx.getSave();
    const r = comprarPassePremium(save);
    ctx.mostrarToast(r.ok ? `👑 Passe Premium Dinossauros ativado (-${r.custo}💎)!` : (r.motivo || 'Diamantes insuficientes.'), 3200);
    if (r.ok) {
      ctx.salvar();
      atualizarHudIdle();
      abrirTemporada(true);
    }
  });

  $('btn-login-diario')?.addEventListener('click', abrirLogin7dSobrePasse);
  $('btn-login-7d-fechar')?.addEventListener('click', fecharLogin7dParaTrilha);
  $('btn-login-7d-voltar')?.addEventListener('click', fecharLogin7dParaTrilha);
  $('btn-login-7d-coletar')?.addEventListener('click', () => {
    const save = ctx.getSave();
    const r = resgatarLoginDiario(save);
    ctx.mostrarToast(r.ok ? `🎁 Login Dia ${r.dia}/7: ${r.recompensa.texto}!` : r.motivo, 2800);
    ctx.salvar();
    atualizarHudIdle();
    renderizarPainelLogin7d();
    const btnLogin = $('btn-login-diario');
    const loginInfo = infoLogin7Dias(save);
    if (btnLogin) btnLogin.textContent = loginInfo.jaColetouHoje ? `🎁 Login 7d (${loginInfo.coletados}/7)` : `🎁 Login 7d (Dia ${loginInfo.diaDisponivel} pronto!)`;
  });
  $('btn-passe-coletar')?.addEventListener('click', () => {
    const save = ctx.getSave();
    const r = resgatarTudoPasse(save);
    const resumo = r.pagos.length
      ? `Passe Nv.${r.nivel}: ${r.pagos.slice(0, 3).map((p) => p.texto).join(', ')}${r.pagos.length > 3 ? ` (+${r.pagos.length - 3})` : ''}!`
      : `Passe Nv.${r.nivel}: nenhum prêmio pendente.`;
    ctx.mostrarToast(resumo, 3200);
    ctx.salvar();
    atualizarHudIdle();
    const ovoT5 = r.pagos.find((p) => p.tipo === 'ovoT5');
    if (ovoT5) {
      revelarOvo({ edicao: 'dinossauros', ovo: { nome: ovoT5.texto, tier: 5 }, nivel: 100 }).then(() => abrirTemporada(true));
    } else {
      if (r.pagos.length) mostrarRecompensas(r.pagos.slice(0, 6).map((p) => ({ nome: p.texto, icone: p.tipo === 'diamantes' ? '💎' : p.tipo === 'tickets' ? '🎫' : p.tipo === 'ovo' ? '🥚' : '🎁', qtd: 1 })));
      abrirTemporada(true);
    }
  });
  $('btn-passe-comprar')?.addEventListener('click', () => {
    const save = ctx.getSave();
    const r = comprarNivelPasse(save);
    ctx.mostrarToast(r.ok ? `Nível ${r.nivel} desbloqueado (-${r.custo}💎)!` : r.motivo, 2800);
    ctx.salvar();
    atualizarHudIdle();
    abrirTemporada(true);
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
    const ws = selvagensDaArea(mapa);
    const nvMed = ws.length ? Math.round(ws.reduce((a, b) => a + b.nivel, 0) / ws.length) : 6;
    const resumo = calcularGanhoOffline(save, nvMed);
    if (!resumo && !forcar) return;
    if (!resumo) return;
    ganhoOfflinePendente = { resumo, especie: ws[0]?.especie || 'Cervomusgo' };
    $('afk-detalhe').innerHTML = `
      <b>Tempo fora:</b> ${Math.floor(resumo.minutos / 60)}h ${resumo.minutos % 60}m<br>
      ⚔️ Abates estimados: <b>${resumo.abates}</b> · 🎟️ Passe: <b>+${resumo.xpPasseBruto ?? resumo.abates} XP</b> (1 XP/abate, sujeito à cota)<br>
      🪙 Gold: <b>+${resumo.gold}g</b> · ⭐ XP: <b>+${resumo.xp}</b><br>
      🥚 Ovos encontrados: <b>${resumo.ovos}</b> ${resumo.colheitaFazenda ? `· 🌱 Fazenda: +${resumo.colheitaFazenda} recursos` : ''}
    `;
    abrir('modal-offline');
  }
  function liquidarSegundoPlano({ avisar = false } = {}) {
    const save = ctx.getSave();
    const mapa = ctx.getMapaAtual();
    const ws = selvagensDaArea(mapa);
    const nvMed = ws.length ? Math.round(ws.reduce((a, b) => a + b.nivel, 0) / ws.length) : 6;
    const res = liquidarPeriodoIdle(save, { nivelArea: nvMed, especiePadrao: ws[0]?.especie || 'Cervomusgo' });
    if (res) {
      registrarLogIdle(garantirEstadoIdle(save), `⏱️ Segundo plano: +${res.abates} abates, +${res.gold}g, +${res.xpPasseGanho} XP Passe`, 'farm');
      if (avisar || document.visibilityState === 'visible') ctx.mostrarToast?.(`⏱️ Enquanto você estava fora: +${res.abates} abates, +${res.gold}g`, 4200);
      ctx.salvar();
      atualizarHudIdle();
    }
    return res;
  }
  $('btn-coletar-afk')?.addEventListener('click', () => {
    if (ganhoOfflinePendente) {
      const save = ctx.getSave();
      const res = aplicarGanhoOffline(save, ganhoOfflinePendente.resumo, ganhoOfflinePendente.especie);
      registrarLogIdle(garantirEstadoIdle(save), `⏱️ AFK coletado: +${ganhoOfflinePendente.resumo.gold}g, +${ganhoOfflinePendente.resumo.xp} XP, +${res?.xpPasseGanho ?? 0} XP Passe`, 'farm');
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
    { tit: '4/6 · Modo Idle (⚔️ Auto · ON/OFF)', txt: 'Ligue Auto · ON para caçar monstros direto no mapa com dano flutuante, Fragmentos de Sonho e ganho de XP/Gold.' },
    { tit: '5/6 · Atlas de Caça & Codex', txt: 'No botão Caçar (ou minimapa) você vê as áreas da campanha, o selo de risco e viaja direto. O Codex dá bônus permanentes!' },
    { tit: '6/6 · Economia de Energia & Menu', txt: 'No Menu (☰) você acessa Passe de Temporada, Mochila e Fragmentos, Vote & Ganhe e o Modo Economia de Energia para farmar no celular.' },
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
    liquidarSegundoPlano,
    iniciarTutorial,
    abrirAtlas,
    abrirCodex,
    abrirMochila,
    abrirTemporada,
    abrirConfigAutoCaca,
    abrirConfig,
    abrirDiario: () => ctx.abrirDiario?.(),
    abrirMenu: renderizarMenu,
  };
}
