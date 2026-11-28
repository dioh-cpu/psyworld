// Conta do jogador na versão pública (/jogar): criar conta escolhendo o inicial, entrar ou continuar a campanha.
// Conta nova: inicial escolhido entre as cinco linhas iniciais (forma base, nível 5, Tier 4) na primeira vaga, 20.000 diamantes e
// 10 dias de VIP, uma única vez. Os exclusivos de Halloween NÃO são iniciais: só saem no Banner Mensal.
// O save da Região 1 vai para a nuvem junto com o que a conta já tinha (contas antigas são preservadas).
import * as A from '../account.js';
import { ARTE_DA_ESPECIE, LINHAS, ELEMENTO_DA_ESPECIE } from '../species.js';
import { xpTotal, estrelasIniciais, infoClasse } from './regiao1-progressao.js';
import { FRAGMENTOS_SONHO_CFG, aplicarInicialContaNova } from './regiao1-regras-sonho.js';
import { molduraDoTier, raridadeRotulo } from './regiao1-criacao-regras.js';

export const BOAS_VINDAS = { diamantes: 20000, vipDias: 10 };
const DIA = 86400000;
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const TIER_INICIAL = FRAGMENTOS_SONHO_CFG.tierIniciaisPorFase[1]; // T4 na forma base das 5 linhagens iniciais
const ELEMENTO_ROTULO = { trevas: 'Noturno', fogo: 'Fogo', agua: 'Água', planta: 'Planta', luz: 'Diurno (luz)' };
// As cinco linhas iniciais derivadas dos dados reais de LINHAS: começam na forma base T4
export const INICIAIS = LINHAS.map((l) => {
  const el = ELEMENTO_DA_ESPECIE[l.inicial] || 'neutro';
  const cls = infoClasse(l.inicial);
  return {
    id: l.id,
    linha: l.atual,
    especie: l.inicial,
    tier: TIER_INICIAL,
    raridade: raridadeRotulo(TIER_INICIAL),
    moldura: molduraDoTier(TIER_INICIAL),
    elementoId: el,
    elemento: ELEMENTO_ROTULO[el] || el,
    papel: cls.nome,
    classe: cls.nome,
    arte: ARTE_DA_ESPECIE[l.inicial] || '',
  };
});
const PENDENTE = 'cw-inicial-pendente', LIBERADO = 'cw-gate-ok', BONUS_TOAST_PENDENTE = 'cw-bonus-boas-vindas-toast';
export const MENSAGEM_BONUS_BOAS_VINDAS = '🎁 Conta criada! +20.000 💎 e 10 dias de VIP creditados.';

export function ehConvidadoComProgresso(save) {
  return Boolean(save && !save.conta?.uid && save.conta?.inicial && !saveNovo(save));
}

export function consumirToastBonusBoasVindas(storage) {
  if (!storage || typeof storage.getItem !== 'function') return false;
  try {
    if (storage.getItem(BONUS_TOAST_PENDENTE) !== '1') return false;
    storage.removeItem?.(BONUS_TOAST_PENDENTE);
    return true;
  } catch {
    return false;
  }
}

// ---------- regras puras (testáveis) ----------
export const vipAtivo = (save, agora = Date.now()) => Boolean(save?.conta?.vipAte && save.conta.vipAte > agora);
export const diasVip = (save, agora = Date.now()) => (vipAtivo(save, agora) ? Math.ceil((save.conta.vipAte - agora) / DIA) : 0);
// Bônus de boas-vindas (20.000💎 + 10d VIP) para TODOS os jogadores (contas novas ou antigas), pago uma única vez.
export function garantirBonusBoasVindasTodos(save, agora = Date.now()) {
  if (!save || typeof save !== 'object') return { creditado: false, diamantes: 0 };
  save.conta = save.conta || {};
  save.recompensas = save.recompensas || { gold: 0, diamantes: 0, xp: 0 };
  if (save.conta.bonusEm) return { creditado: false, diamantes: save.recompensas.diamantes || 0 };
  save.conta.bonusEm = agora;
  save.conta.vipAte = Math.max(Number(save.conta.vipAte) || 0, agora) + BOAS_VINDAS.vipDias * DIA;
  save.recompensas.diamantes = (Number(save.recompensas.diamantes) || 0) + BOAS_VINDAS.diamantes;
  return { creditado: true, diamantes: save.recompensas.diamantes, vipAte: save.conta.vipAte };
}

// Decisão pura de elegibilidade ao bônus de boas-vindas (20.000💎 + 10d VIP) preservando saves existentes.
export function decidirEntradaConta({ remoto = null, local = null, userId = null } = {}) {
  if (remoto?.regiao1) {
    const tRemoto = remoto.regiao1.idle?.ultimoTickMs || 0;
    const tLocal = local?.idle?.ultimoTickMs || 0;
    const mesmoUid = Boolean(userId && local?.conta?.uid === userId);
    const jaPremiada = Boolean(remoto.regiao1?.conta?.bonusEm || remoto?.conta?.bonusEm);
    return { acao: !mesmoUid || tRemoto > tLocal + 2000 ? 'usar-remoto' : 'liberar', novo: false, elegivelBonus: !jaPremiada };
  }
  const jaPremiada = Boolean(remoto?.conta?.bonusEm || (userId && local?.conta?.uid === userId && local?.conta?.bonusEm));
  const outroUidLocal = Boolean(userId && local?.conta?.uid && local.conta.uid !== userId);
  return { acao: 'preparar', novo: !jaPremiada, elegivelBonus: !jaPremiada, resetarLocal: outroUidLocal };
}

// Aplica o inicial e o bônus numa conta (nova ou antiga ainda sem bônus), uma única vez.
export function prepararContaNova(save, { userId, inicial, agora = Date.now(), novo = true }) {
  const lin = INICIAIS.find((l) => l.especie === inicial || l.linha === inicial || l.id === inicial) || INICIAIS[0];
  aplicarInicialContaNova(save, { userId, inicial: lin.especie, agora, novo });
  garantirBonusBoasVindasTodos(save, agora);
  const ini = save.idle?.equipe?.find((m) => m?.inicial);
  if (ini && !ini.estrelas) ini.estrelas = estrelasIniciais('inicial');
  return save;
}

// Save sem progresso (primeira entrada sem conta): só o inicial provisório, sem XP, ouro nem missão concluída
export function saveNovo(s) {
  if (!s || s.conta?.inicial) return false;
  const eq = s.idle?.equipe || [];
  if (eq.some((m) => m && m.origem !== 'inicial-padrao')) return false;
  if ((s.recompensas?.xp || 0) > 0 || (s.recompensas?.gold || 0) > 0) return false;
  return !Object.values(s.quests || {}).includes('concluida');
}
// Entrada sem conta: grava o inicial escolhido e garante o bônus único de 20.000💎 + 10d VIP para todos
export function prepararInicialLocal(s, inicial, agora = Date.now()) {
  const conta = { ...(s.conta || {}) };
  prepararContaNova(s, { userId: null, inicial, agora, novo: true });
  s.conta.uid = conta.uid ?? null;
  garantirBonusBoasVindasTodos(s, agora);
  return s;
}
const REFUGIO_PENDENTE = 'cw-refugio-primeiro';

// ---------- interface ----------
export function iniciarConta({ getSave, salvar, mostrarToast, chaveSave, resetarSave, serializar }) {
  const css = document.createElement('style');
  css.textContent = `
    #conta-gate { position: fixed; inset: 0; z-index: 90; display: none; align-items: center; justify-content: center; padding: 12px; background: radial-gradient(ellipse at 50% 30%, #3b1a46ee, #0d0713f5); color: #fff3e7; font: 14px system-ui, sans-serif; overflow-y: auto; }
    #conta-gate.vis { display: flex; } #conta-gate .cg { width: min(720px, 100%); max-height: calc(100dvh - 24px); overflow-y: auto; background: rgba(28,14,34,.92); border: 1px solid #8b5a6a; border-radius: 14px; padding: 14px 16px; }
    #conta-gate h1 { margin: 0 0 2px; font: 700 clamp(18px, 4vh, 26px) Georgia, serif; color: #fdba74; } #conta-gate .sub { opacity: .8; margin: 0 0 10px; font-size: 12.5px; }
    #conta-gate .abas { display: flex; gap: 6px; margin-bottom: 10px; } #conta-gate .abas button[aria-selected="true"] { background: #fb923c; color: #21110c; }
    #conta-gate input { width: 100%; box-sizing: border-box; margin: 4px 0 8px; padding: 9px 10px; border-radius: 8px; border: 1px solid #6b4a52; background: #1a0f22; color: #fff3e7; font: inherit; }
    #conta-gate .iniciais { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; margin: 6px 0 10px; } @media (max-width: 520px) { #conta-gate .iniciais { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    #conta-gate .ini { background: #24112a; border: 2px solid #4a2a50; border-radius: 10px; padding: 5px; color: inherit; font: inherit; text-align: center; cursor: pointer; }
    #conta-gate .ini-mold { position: relative; width: 100%; aspect-ratio: 4 / 5; border-radius: 8px; background: radial-gradient(circle, #3b1c4d, #160a1e); display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 4px; }
    #conta-gate .ini-mold img.sp { width: 78%; height: 78%; object-fit: contain; z-index: 1; }
    #conta-gate .ini-mold img.ov { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: fill; pointer-events: none; z-index: 2; }
    #conta-gate .ini b { display: block; font-size: 12px; } #conta-gate .ini small { opacity: .82; font-size: 10.5px; display: block; }
    #conta-gate .ini[aria-pressed="true"] { border-color: #fb923c; box-shadow: 0 0 0 3px #fb923c55; }
    #conta-gate .ln { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; } #conta-gate .msg { min-height: 18px; font-size: 12.5px; color: #fca5a5; } #conta-gate .ok { color: #86efac; }
    body.cw-primeira-entrada #exp-fechar { display: none !important; }
    #conta-gate .bonus { font-size: 12px; background: #3a1f3f; border-radius: 8px; padding: 6px 8px; margin-bottom: 8px; }`;
  document.head.append(css);
  const gate = document.createElement('div'); gate.id = 'conta-gate'; document.body.append(gate);
  let aba = 'entrar', escolhido = null, versao = 0, ultimoEnviado = '', cloudExtra = {}, logado = false, sincronizando = false;
  const msg = (t, ok = false) => { const m = gate.querySelector('.msg'); if (m) { m.textContent = t; m.classList.toggle('ok', ok); } };
  const urlJogar = () => `${location.origin}/jogar`;
  const limparUrl = () => { if (location.pathname.startsWith('/jogar') && (location.hash || location.search)) history.replaceState(null, '', '/jogar'); };

  function cartoes() {
    return `<div class="iniciais">${INICIAIS.map((l) => `<button type="button" class="ini" aria-pressed="${escolhido === l.especie}" data-ini="${esc(l.especie)}"><div class="ini-mold"><img class="sp" src="../../../${esc(l.arte)}" alt="${esc(l.especie)}"><img class="ov" src="../../../${esc(l.moldura)}" alt="" onerror="this.style.display='none'"></div><b>${esc(l.especie)} · T${l.tier}</b><small>Base (${esc(l.raridade)}) · ${esc(l.elemento)} · ${esc(l.papel)}</small></button>`).join('')}</div>`;
  }
  function desenhar() {
    const email = A.email();
    const convidado = ehConvidadoComProgresso(getSave());
    if (aba === 'criar' && convidado && !escolhido) escolhido = getSave().conta.inicial;
    let corpo = '';
    if (!A.isEnabled()) corpo = `<p class="sub">Contas indisponíveis no momento. Você pode jogar com o save deste aparelho.</p><div class="ln"><button class="btn-pri" data-acao="local">Continuar campanha</button></div>`;
    else if (email) corpo = `<p>Conectado como <b>${esc(email)}</b>.</p><div class="ln"><button class="btn-pri" data-acao="continuar">Continuar campanha</button><button class="btn-sec" data-acao="sair">Sair da conta</button></div>`;
    else corpo = `<div class="abas"><button class="btn-sec" aria-selected="${aba === 'entrar'}" data-aba="entrar">Entrar</button><button class="btn-sec" aria-selected="${aba === 'criar'}" data-aba="criar">Criar conta</button></div>
      ${aba === 'criar'
        ? (convidado
          ? `<div class="bonus">🎁 Criar conta preserva todo o seu progresso de convidado (inicial <b>${esc(escolhido)}</b>) e libera na hora <b>+20.000 💎</b> e <b>10 dias de VIP</b>.</div>`
          : `<div class="bonus">🎁 Conta nova: escolha seu inicial e ganhe <b>20.000 💎</b> e <b>10 dias de VIP</b>.</div><label>Escolha seu inicial</label>${cartoes()}`)
        : ''}
      <form id="cg-form"><label>E-mail<input type="email" id="cg-email" autocomplete="email" required></label><label>Senha<input type="password" id="cg-senha" autocomplete="${aba === 'criar' ? 'new-password' : 'current-password'}" minlength="6" required></label>
      <div class="ln"><button class="btn-pri" type="submit">${aba === 'criar' ? 'Criar conta e jogar' : 'Entrar'}</button>${aba === 'entrar' ? '<button class="btn-sec" type="button" data-acao="esqueci">Esqueci a senha</button>' : ''}<button class="btn-sec" type="button" data-acao="local">${convidado ? 'Continuar como convidado' : 'Jogar sem conta'}</button></div></form>`;
    gate.innerHTML = `<div class="cg"><h1>Confusion Waves: Double Perspective</h1><p class="sub">Idle Game · a campanha começa na Praia Inicial.</p>${corpo}<p class="msg"></p></div>`;
  }
  // Primeira entrada sem conta: escolha do inicial → Refúgio com o inicial em repouso; a Praia só abre pelo botão Campanha
  function escolherInicialLocal() {
    escolhido = null;
    gate.querySelector('.cg').innerHTML = `<h1>Escolha seu inicial</h1><p class="sub">Ele ocupa a primeira vaga da sua equipe.</p>${cartoes()}<div class="ln"><button class="btn-pri" data-acao="comecar-local">Começar</button></div><p class="msg"></p>`;
  }
  function entrarLocal() { if (saveNovo(getSave())) escolherInicialLocal(); else liberarJogo(); }
  function abrirRefugioPrimeiro() {
    document.body.classList.add('cw-primeira-entrada');
    let n = 0; const tentar = () => { if (window.regiaoExp?.abrir) window.regiaoExp.abrir('descanso'); else if (n++ < 50) setTimeout(tentar, 100); };
    tentar();
  }
  document.addEventListener('keydown', (e) => { if (e.code === 'Escape' && document.body.classList.contains('cw-primeira-entrada')) e.stopImmediatePropagation(); }, true);
  document.addEventListener('click', (e) => {
    if (!e.target.closest?.('[data-desc-ir="campanha"]')) return;
    document.body.classList.remove('cw-primeira-entrada'); try { localStorage.removeItem(REFUGIO_PENDENTE); } catch {}
  }, true);
  function liberarJogo() { gate.classList.remove('vis'); try { sessionStorage.setItem(LIBERADO, '1'); } catch {} limparUrl(); }
  function trocarSave(obj) { localStorage.setItem(chaveSave, typeof obj === 'string' ? obj : JSON.stringify(obj)); try { sessionStorage.setItem(LIBERADO, '1'); } catch {} location.replace(location.pathname.startsWith('/jogar') ? '/jogar' : location.pathname); }

  // Decide o save ao entrar: nuvem (se mais recente ou de outro aparelho), save local da mesma conta, ou conta elegível ao bônus único
  async function sincronizarAoEntrar() {
    const u = A.user(); if (!u || sincronizando) return;
    sincronizando = true;
    try {
      msg('Carregando sua campanha…', true);
      let remoto = null;
      try { const r = await A.pull(); remoto = r.save; versao = r.version || 0; } catch (e) { msg('Não foi possível ler o save na nuvem. Tente de novo.'); return; }
      cloudExtra = remoto && typeof remoto === 'object' ? { ...remoto } : {}; delete cloudExtra.regiao1;
      const local = getSave();
      const dec = decidirEntradaConta({ remoto, local, userId: u.id });
      if (dec.acao === 'usar-remoto') {
        const b = garantirBonusBoasVindasTodos(remoto.regiao1);
        if (b.creditado) {
          try { sessionStorage.setItem(BONUS_TOAST_PENDENTE, '1'); } catch {}
          mostrarToast?.(MENSAGEM_BONUS_BOAS_VINDAS, 6000);
        }
        trocarSave(remoto.regiao1);
        return;
      }
      if (dec.acao === 'liberar') {
        const b = garantirBonusBoasVindasTodos(local);
        if (b.creditado) {
          salvar();
          try { sessionStorage.setItem(BONUS_TOAST_PENDENTE, '1'); } catch {}
          mostrarToast?.(MENSAGEM_BONUS_BOAS_VINDAS, 6000);
        }
        logado = true;
        liberarJogo();
        return;
      }
      const inicial = (!dec.resetarLocal && local?.conta?.inicial) || u.user_metadata?.inicial || localStorage.getItem(PENDENTE) || escolhido;
      if (!inicial) { aba = 'criar'; escolhido = null; gate.querySelector('.cg').innerHTML = `<h1>Escolha seu inicial</h1><p class="sub">Ele ocupa a primeira vaga da sua equipe.</p>${cartoes()}<div class="ln"><button class="btn-pri" data-acao="confirmar-inicial">Começar</button></div><p class="msg"></p>`; return; }
      if (dec.resetarLocal) resetarSave();
      const tinhaBonus = Boolean(getSave().conta?.bonusEm);
      const s = prepararContaNova(getSave(), { userId: u.id, inicial, novo: dec.novo });
      if (!tinhaBonus && s.conta?.bonusEm) {
        try { sessionStorage.setItem(BONUS_TOAST_PENDENTE, '1'); } catch {}
        mostrarToast?.(MENSAGEM_BONUS_BOAS_VINDAS, 6000);
      }
      try { localStorage.removeItem(PENDENTE); } catch {}
      salvar(); await enviar(true); trocarSave(serializar(s));
    } finally {
      sincronizando = false;
    }
  }
  async function enviar(forcar = false) {
    if (!A.user()) return false;
    const s = getSave(); if (s.conta?.uid !== A.user().id) return false;
    const txt = serializar(s); if (!forcar && txt === ultimoEnviado) return true;
    const doc = { ...cloudExtra, game: 'confusion-waves', regiao1: JSON.parse(txt), conta: s.conta };
    try { const r = await A.push(doc, versao); versao = r.version; ultimoEnviado = txt; return true; }
    catch (e) { if (e.status === 409) { try { const r = await A.pull(); versao = r.version || 0; const r2 = await A.push(doc, versao); versao = r2.version; ultimoEnviado = txt; return true; } catch {} } return false; }
  }
  setInterval(() => { if (logado) enviar(); }, 20000);
  document.addEventListener('visibilitychange', () => { if (document.hidden && logado) enviar(); });

  gate.addEventListener('click', async (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.aba) { aba = t.dataset.aba; desenhar(); return; }
    if (t.dataset.ini) { escolhido = t.dataset.ini; gate.querySelectorAll('.ini').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ini === escolhido))); return; }
    const a = t.dataset.acao;
    if (a === 'local') { entrarLocal(); return; }
    if (a === 'comecar-local') {
      if (!escolhido) { msg('Escolha um inicial.'); return; }
      if (saveNovo(getSave())) { prepararInicialLocal(getSave(), escolhido); salvar(); try { localStorage.setItem(REFUGIO_PENDENTE, '1'); } catch {} }
      liberarJogo(); abrirRefugioPrimeiro(); return;
    }
    if (a === 'sair') { await A.signOut(); logado = false; desenhar(); return; }
    if (a === 'continuar') { await sincronizarAoEntrar(); return; }
    if (a === 'confirmar-inicial') { if (!escolhido) { msg('Escolha um inicial.'); return; } localStorage.setItem(PENDENTE, escolhido); await sincronizarAoEntrar(); return; }
    if (a === 'esqueci') { const em = gate.querySelector('#cg-email')?.value; if (!em) { msg('Digite seu e-mail.'); return; } try { await A.resetPassword(em, urlJogar()); msg('Enviamos um link para redefinir a senha.', true); } catch (err) { msg(err.message || 'Falha ao enviar.'); } }
  });
  gate.addEventListener('submit', async (e) => {
    e.preventDefault();
    const em = gate.querySelector('#cg-email').value.trim(), pw = gate.querySelector('#cg-senha').value;
    try {
      if (aba === 'criar') {
        const iniEscolhido = escolhido || (!saveNovo(getSave()) ? getSave().conta?.inicial : null);
        if (!iniEscolhido) { msg('Escolha um inicial.'); return; }
        escolhido = iniEscolhido;
        localStorage.setItem(PENDENTE, iniEscolhido);
        const r = await A.signUp(em, pw, { emailRedirectTo: urlJogar(), data: { inicial: iniEscolhido } });
        if (!r.session) { msg('Conta criada! Confirme pelo link enviado ao seu e-mail; ele volta para esta página.', true); return; }
      } else await A.signIn(em, pw);
      await sincronizarAoEntrar();
    } catch (err) { msg(err.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : (err.message || 'Falha.')); }
  });

  A.onChange((event) => {
    if (event === 'SIGNED_IN' && !logado && !sincronizando && gate.classList.contains('vis')) sincronizarAoEntrar();
  });

  const veioDoEmail = /type=(signup|recovery|magiclink)|access_token|code=/.test(location.hash + location.search);
  (async () => {
    const jaLiberado = (() => { try { return sessionStorage.getItem(LIBERADO) === '1'; } catch { return false; } })();
    await A.init(); limparUrl();
    const u = A.user();
    if (u && getSave().conta?.uid === u.id) { logado = true; try { const r = await A.pull(); versao = r.version || 0; cloudExtra = r.save ? { ...r.save } : {}; delete cloudExtra.regiao1; } catch {} }
    if (jaLiberado && (!u || logado)) {
      if (consumirToastBonusBoasVindas(typeof sessionStorage !== 'undefined' ? sessionStorage : null)) {
        setTimeout(() => mostrarToast?.(MENSAGEM_BONUS_BOAS_VINDAS, 6000), 250);
      }
      try { if (localStorage.getItem(REFUGIO_PENDENTE)) abrirRefugioPrimeiro(); } catch {}
      return;
    }
    // voltou da confirmação de e-mail: já tem sessão, então entra direto
    if (u && !logado && veioDoEmail) { gate.classList.add('vis'); desenhar(); await sincronizarAoEntrar(); return; }
    desenhar(); gate.classList.add('vis');
  })();
  const apiConta = {
    vipAtivo: () => vipAtivo(getSave()),
    diasVip: () => diasVip(getSave()),
    enviar,
    abrir: () => { desenhar(); gate.classList.add('vis'); },
    estaLogado: () => Boolean(logado),
    sair: async () => {
      if (logado) { try { await A.signOut(); } catch {} logado = false; }
      desenhar();
      gate.classList.add('vis');
      return true;
    },
  };
  window.regiaoConta = apiConta;
  return apiConta;
}
