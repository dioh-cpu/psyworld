(function (W, D) {
  'use strict';

  const MAX_HISTORY = 12;
  const state = { history: [], open: false };
  const $ = selector => D.querySelector(selector);
  const endpoint = () => String(W.PSY_CONFIG?.miniEndpoint || W.PSY_CONFIG?.endpoint || '/api/psy').replace(/\/$/, '');
  const clean = (value, limit = 1200) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, limit);
  const visibleScreen = () => Array.from(D.querySelectorAll('.screen')).find(el => getComputedStyle(el).display !== 'none')?.id || 'hub';

  function remember(role, content) {
    if (!content || !['user', 'assistant'].includes(role)) return;
    state.history.push({ role, content: clean(content) });
    if (state.history.length > MAX_HISTORY) state.history.splice(0, state.history.length - MAX_HISTORY);
  }

  function addMessage(role, label, content, save = true) {
    const feed = $('[data-mini-feed]');
    if (!feed) return;
    const item = D.createElement('div'); item.className = 'psy-mini-message ' + role;
    const title = D.createElement('small'); title.textContent = label;
    const body = D.createElement('div'); body.textContent = content;
    item.append(title, body); feed.appendChild(item); feed.scrollTop = feed.scrollHeight;
    if (save) remember(role, content);
  }

  function localAnswer(question) {
    const q = question.toLowerCase();
    if (/andar|mov|veloc|afk/.test(q)) return 'Confira o joystick e mantenha o dedo dentro da área de controle. No modo Aventura, o movimento manual e o AFK usam as regras da região atual.';
    if (/caç|hunt|monstr|criatur|encontr/.test(q)) return 'Abra WORLD ou HUNTS para conferir a região atual e os alvos disponíveis. A Mini Psy pode explicar sistemas e objetivos, mas não altera o jogo.';
    if (/batalh|ataque|golpe|time|equipe/.test(q)) return 'Na batalha, escolha o golpe no painel inferior e use TROCAR, BOLSA ou FUGIR quando necessário. Posso explicar qualquer botão do sistema.';
    return 'Sou a Mini Psy AI, seu assistente virtual. Posso explicar sistemas, itens, regiões, objetivos e dicas de caça; mudanças no jogo ficam desativadas neste modo.';
  }

  async function ask(question) {
    const context = { screen: visibleScreen(), game: 'PSYWORLD', audience: 'public-mini' };
    const response = await fetch(endpoint() + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Psy-Client': 'public-mini-v1' },
      body: JSON.stringify({ message: question, context, history: state.history }),
    });
    let data = {}; try { data = await response.json(); } catch (_) {}
    if (!response.ok) throw new Error(data.message || data.error || 'Mini Psy indisponível');
    return data.answer || 'Não recebi uma resposta.';
  }

  async function submit(event) {
    event.preventDefault();
    const input = $('[data-mini-input]'), button = $('[data-mini-send]');
    const question = input?.value.trim() || '';
    if (!question) return;
    input.value = ''; addMessage('user', 'Você', question);
    if (button) button.disabled = true;
    try { addMessage('assistant', 'Mini Psy AI', await ask(question)); }
    catch (_) { addMessage('assistant', 'Mini Psy AI · modo local', localAnswer(question)); }
    finally { if (button) button.disabled = false; input?.focus(); }
  }

  function setOpen(open) {
    state.open = open;
    const panel = $('[data-mini-panel]'), launcher = $('[data-mini-launcher]');
    if (panel) panel.hidden = !open;
    if (launcher) { launcher.setAttribute('aria-expanded', String(open)); launcher.textContent = open ? '✕' : '🧠'; }
    if (open) $('[data-mini-input]')?.focus();
  }

  function install() {
    if (!D.body || $('[data-mini-launcher]')) return;
    const launcher = D.createElement('button');
    launcher.type = 'button'; launcher.className = 'psy-mini-launcher'; launcher.dataset.miniLauncher = '1';
    launcher.textContent = '🧠'; launcher.title = 'Abrir Mini Psy AI'; launcher.setAttribute('aria-label', launcher.title); launcher.setAttribute('aria-expanded', 'false'); launcher.addEventListener('click', () => setOpen(!state.open));
    const panel = D.createElement('section'); panel.className = 'psy-mini-panel'; panel.dataset.miniPanel = '1'; panel.hidden = true; panel.setAttribute('aria-label', 'Mini Psy AI');
    panel.innerHTML = '<header><div><strong>🧠 Mini Psy AI</strong><small>SEU ASSISTENTE VIRTUAL</small></div><button type="button" data-mini-close aria-label="Fechar">✕</button></header><div class="psy-mini-feed" data-mini-feed><div class="psy-mini-message assistant"><small>Mini Psy AI</small><div>Olá! Posso explicar o mundo, os itens, as regiões e as regras da aventura.</div></div></div><form class="psy-mini-compose" data-mini-form><textarea data-mini-input maxlength="1200" placeholder="Pergunte sobre o jogo…"></textarea><button type="submit" data-mini-send>ENVIAR</button></form><footer>Modo público: somente dicas e explicações.</footer>';
    panel.querySelector('[data-mini-close]')?.addEventListener('click', () => setOpen(false));
    panel.querySelector('[data-mini-form]')?.addEventListener('submit', submit);
    D.body.append(panel, launcher);
    W.PSY = W.PSY || {}; W.PSY.mini = { open: () => setOpen(true), close: () => setOpen(false) };
  }

  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', install, { once: true }); else install();
})(window, document);
