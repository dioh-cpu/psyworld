(function (W, D) {
  'use strict';

  const MAX_HISTORY = 24;
  const MAX_FILE_COUNT = 8;
  const MAX_FILE_BYTES = 6 * 1024 * 1024;
  const MAX_TOTAL_FILE_BYTES = 18 * 1024 * 1024;
  const MAX_PROJECT_BYTES = 1024 * 1024 * 1024;
  const PROJECT_CHUNK_BYTES = 4 * 1024 * 1024;
  const state = {
    open: false,
    mode: 'mini',
    health: null,
    ownerToken: '',
    proposal: null,
    sessionId: 'psy-' + Math.random().toString(36).slice(2) + Date.now().toString(36),
    history: [],
  };

  const endpoint = () => String(W.PSY_CONFIG?.endpoint || '/api/psy').replace(/\/$/, '');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
  const text = (value, limit = 180) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, limit);
  const activePoke = () => W.P?.team?.[0] || null;
  const root = () => D.getElementById('psy-assistant');
  const feed = () => root()?.querySelector('[data-psy-feed]');
  const testItemAliases = {
    'water stone': 'Water Stone', 'water stones': 'Water Stone', 'stone de agua': 'Water Stone', 'stones de agua': 'Water Stone',
    'shiny stone': 'Shiny Stone', 'shiny stones': 'Shiny Stone', 'boost': 'Boost Stone', 'boost stone': 'Boost Stone',
    'mega': 'Fragmento Mega Stone', 'mega stone': 'Fragmento Mega Stone', 'fragmento mega': 'Fragmento Mega Stone',
    'small stone': 'Small Stone', 'small stones': 'Small Stone', 'psystone': 'PsyStone', 'psy stone': 'PsyStone',
  };
  const testItemNames = new Set([
    'Pokéball', 'Great Ball', 'Super Ball', 'Ultra Ball', 'Premier Ball', 'Poção 50', 'Poção 100', 'Poção 200', 'Poção 30%', 'Poção 50% HP', 'Poção 100% HP', 'Revive',
    'Fire Stone', 'Water Stone', 'Leaf Stone', 'Thunder Stone', 'Ice Stone', 'Punch Stone', 'Venom Stone', 'Earth Stone', 'Feather Stone', 'Enigma Stone', 'Cocoon Stone', 'Rock Stone', 'Crystal Stone', 'Darkness Stone', 'Metal Stone', 'Heart Stone', 'Shiny Stone', 'Boost Stone', 'Fragmento Mega Stone', 'PsyStone', 'Small Stone',
    'Rubber Ball', 'Fur', 'Giant Piece Of Fur', 'Essence Of Fire', 'Fire Tail', 'Water Gem', 'Water Pendant', 'Seed', 'Leaves', 'Great Petal', 'Screw', 'Electric Box', 'Electric Rat Tail', 'Snowball', 'Ice Orb', 'Band Aid', 'Sandbag', 'Belt Of Champion', 'Punch Machine', 'Bottle Of Poison', 'Bug Venom', 'Earth Ball', 'Piece Of Diglett', 'Straw', 'Feather', 'Giant Beak', 'Enchanted Gem', 'Future Orb', 'Psychic Spoon', 'Bug Gosme', 'Bug Antenna', 'Strange Rock', 'Ghost Essence', 'Bat Wing', 'Dragon Scale', 'Dragon Tooth', 'Dark Gem', 'Dark Ear', 'Piece Of Steel', 'Metal Hull', 'Point Of Light', 'Cute Ball',
  ]);
  const lookupKey = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const compactLookupKey = value => lookupKey(value).replace(/\s+/g, '');

  function isTestStateIntent(message) {
    return /\b(coloque|colocar|adicione|adicionar|ponha|dar|conceda|give|grant)\b/i.test(String(message || ''))
      && /\b(bolsa|invent[aá]rio|time|box|pokemon|pok[eé]mon|stone|stones|pedra|boost|mega|shiny)\b/i.test(String(message || ''));
  }

  function resolvePokemonId(name) {
    const wanted = compactLookupKey(name);
    if (!wanted) return null;
    const tables = [];
    try { if (typeof ALL_POKE_NAMES !== 'undefined') tables.push(ALL_POKE_NAMES); } catch (_) {}
    if (W.ALL_POKE_NAMES && typeof W.ALL_POKE_NAMES === 'object') tables.push(W.ALL_POKE_NAMES);
    for (const table of tables) {
      for (const [id, value] of Object.entries(table)) {
        if (compactLookupKey(value) === wanted) return Number(id);
      }
    }
    return null;
  }

  function applyTestStatePatch(patch) {
    const p = W.P;
    if (!p || !patch || typeof patch !== 'object') throw new Error('O estado do jogo ainda não está disponível.');
    if (!Array.isArray(p.team)) p.team = [];
    if (!Array.isArray(p.box)) p.box = [];
    if (!p.inventory || typeof p.inventory !== 'object') p.inventory = {};
    const rawItems = Array.isArray(patch.inventory) ? patch.inventory.slice(0, 16) : [];
    const rawPokemon = Array.isArray(patch.pokemon) ? patch.pokemon.slice(0, 8) : [];
    const addedItems = [];
    const addedPokemon = [];
    for (const entry of rawItems) {
      const rawName = String(entry?.item || '').trim();
      const canonical = testItemAliases[lookupKey(rawName)] || [...testItemNames].find(item => lookupKey(item) === lookupKey(rawName));
      const quantity = Number(entry?.quantity);
      if (!canonical || !testItemNames.has(canonical) || !Number.isInteger(quantity) || quantity < 1 || quantity > 1000) continue;
      p.inventory[canonical] = Math.max(0, Number(p.inventory[canonical] || 0)) + quantity;
      addedItems.push({ item: canonical, quantity });
    }
    for (const entry of rawPokemon) {
      const name = text(entry?.name, 80);
      const id = resolvePokemonId(name);
      if (!id || !W.createCapturedPoke) continue;
      const shiny = entry?.shiny === true;
      const mega = entry?.mega === true;
      let pokemon;
      try { pokemon = W.createCapturedPoke(id, null, shiny, false, mega); } catch (_) { continue; }
      if (!pokemon) continue;
      pokemon.shiny = shiny; pokemon.isMega = mega;
      const destination = lookupKey(entry?.destination || 'box');
      const requested = destination === 'team' || destination === 'time' || destination === 'equipe' ? 'team' : 'box';
      const actual = requested === 'team' && p.team.length < 6 ? 'team' : 'box';
      p[actual].push(pokemon);
      addedPokemon.push({ name: pokemon.name || name, destination: actual, shiny, mega });
    }
    if (p.team[0]) { p.pokemon = p.team[0]; p.hp = p.team[0].hp; p.maxHp = p.team[0].maxHp; }
    try { W.autoSave?.(); W.updateHUD?.(); W.renderTeam?.(); W.loadMoveButtons?.(); W.renderBag?.(); } catch (_) {}
    try { W.notif?.(`✅ Psy aplicou ${addedItems.length} grupo(s) de item e ${addedPokemon.length} Pokémon de teste.`, 3600); } catch (_) {}
    return { addedItems, addedPokemon, message: `Teste aplicado: ${addedItems.length} grupo(s) de item e ${addedPokemon.length} Pokémon.` };
  }

  function consumePendingTestStatePatches() {
    const key = 'psy.pending-test-state-patches';
    let queue;
    try { queue = JSON.parse(W.localStorage?.getItem(key) || '[]'); W.localStorage?.removeItem(key); } catch (_) { return; }
    if (!Array.isArray(queue)) return;
    queue.forEach(entry => { try { if (entry?.patch) applyTestStatePatch(entry.patch); } catch (_) {} });
  }

  function currentMode() {
    const candidates = [['psy-adventure-v95-authored', 'Aventura'], ['screen-world', 'World'], ['screen-survivor', 'Survivor'], ['screen-idle', 'World Idle']];
    const visible = candidates.find(([id]) => {
      const el = D.getElementById(id);
      return el && getComputedStyle(el).display !== 'none' && el.getAttribute('aria-hidden') !== 'true';
    });
    return visible?.[1] || 'Hub';
  }

  function gameContext() {
    const p = W.P || {}, poke = activePoke(), runtime = W.PSY?.adventureRuntime, quest = p.adventureQuest || p.quest || null;
    const hp = runtime?.playerHp ?? runtime?.hp ?? poke?.hp ?? null;
    const maxHp = runtime?.playerMaxHp ?? runtime?.maxHp ?? poke?.maxHp ?? null;
    return {
      screen: currentMode(), mode: currentMode(),
      region: text(runtime?.section || runtime?.region || p.currentRegion || ''),
      section: text(runtime?.section || ''), active_name: text(poke?.name || p.activePokemon || ''),
      active_level: Number(poke?.level || p.level || 0) || 0,
      active_hp: Number(hp) || 0, active_max_hp: Number(maxHp) || 0,
      team_size: Array.isArray(p.team) ? p.team.length : 0,
      afk: !!(runtime?.afk || p.afk), fast_encounter: !!W.fastEncounter,
      quest: text(quest?.title || quest?.name || ''), nearby_count: Array.isArray(runtime?.mons) ? runtime.mons.length : 0,
    };
  }

  function remember(role, message) {
    if (!message) return;
    state.history.push({ role, content: text(message, 1600) });
    if (state.history.length > MAX_HISTORY) state.history.splice(0, state.history.length - MAX_HISTORY);
  }

  function addMessage(role, label, message, rememberIt = true) {
    const host = feed();
    if (!host) return;
    const el = D.createElement('div');
    el.className = 'psy-msg ' + role;
    const small = D.createElement('small');
    small.textContent = label;
    const body = D.createElement('div');
    body.textContent = message;
    el.append(small, body);
    host.appendChild(el);
    host.scrollTop = host.scrollHeight;
    if (rememberIt && (role === 'user' || role === 'assistant')) remember(role, message);
  }

  function addImage(label, url) {
    if (!/^data:image\/(?:png|webp);base64,/i.test(String(url || ''))) return;
    const host = feed();
    if (!host) return;
    const el = D.createElement('div');
    el.className = 'psy-msg assistant';
    const small = D.createElement('small');
    small.textContent = label;
    const img = D.createElement('img');
    img.className = 'psy-generated-image';
    img.alt = 'Imagem gerada pela Psy';
    img.src = url;
    el.append(small, img);
    host.appendChild(el);
    host.scrollTop = host.scrollHeight;
  }

  function setStatus(label, online) {
    const el = root()?.querySelector('[data-psy-status]');
    if (!el) return;
    el.textContent = label;
    el.dataset.online = online ? '1' : '0';
  }

  function offlineAnswer(message, ctx, files) {
    const q = message.toLowerCase();
    if (/caç|hunt|caçada|caçar/.test(q)) return 'No modo local, abra HUNTS e confira a região atual antes de escolher o alvo. Ativo: ' + (ctx.active_name || 'não identificado') + '.';
    if (/andar|mov|veloc|afk/.test(q)) return 'O estado atual indica ' + (ctx.afk ? 'AFK ativo' : 'movimentação manual') + '. A Psy local não altera a velocidade nesta sessão.';
    if (/time|equipe|trocar|pokemon|pokémon/.test(q)) return 'Confira o time e mantenha uma resposta para o tipo da região. Posso detalhar a recomendação quando o backend estiver conectado.';
    if (files) return 'Recebi os anexos nesta sessão, mas o backend online ainda não está configurado para analisá-los.';
    return 'Sou a Psy. Estou em modo local porque o backend online ainda não foi configurado neste servidor.';
  }

  function connectionAnswer(error, mode) {
    const code = String(error?.code || '');
    if (mode === 'owner' || mode === 'change') {
      if (code === 'psy_upstream_unavailable' || code === 'psy_safety_unavailable') return 'A Psy AI não conseguiu acessar o serviço online. Verifique se a chave é real, se há créditos disponíveis e reinicie o servidor depois de configurá-la.';
      if (code === 'psy_not_configured') return 'A Psy AI ainda não recebeu uma chave de API no terminal que iniciou o servidor.';
      return 'A Psy AI não conseguiu concluir a solicitação online agora. Confira o terminal do servidor e tente novamente.';
    }
    return '';
  }

  async function request(path, payload, headers) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetch(endpoint() + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Psy-Client': 'game-v2', ...(headers || {}) },
        body: JSON.stringify(payload), signal: controller.signal,
      });
      let data = {};
      try { data = await response.json(); } catch (_) { data = {}; }
      if (!response.ok) {
        const error = new Error(data.message || data.error || 'Psy indisponível');
        error.code = data.error || 'request_failed';
        throw error;
      }
      return data;
    } finally { clearTimeout(timer); }
  }

  async function checkHealth() {
    try {
      const response = await fetch(endpoint() + '/health', { cache: 'no-store' });
      const data = await response.json();
      state.health = data;
      setStatus(data.chat_available ? 'ONLINE' : 'LOCAL', !!data.chat_available);
    } catch (_) { state.health = null; setStatus('LOCAL', false); }
  }

  async function loadGlobalNotice() {
    try {
      const response = await fetch(new URL('psy-config.json', D.baseURI || location.href), { cache: 'no-store' });
      if (!response.ok) return;
      const config = await response.json();
      const notice = String(config?.global_notice || '').trim();
      if (!notice) return;
      const banner = D.createElement('div');
      banner.className = 'psy-global-notice';
      const title = D.createElement('b'); title.textContent = '📣 AVISO PSYWORLD';
      const body = D.createElement('span'); body.textContent = notice;
      const closeButton = D.createElement('button'); closeButton.type = 'button'; closeButton.textContent = '✕'; closeButton.setAttribute('aria-label', 'Fechar aviso');
      closeButton.addEventListener('click', () => banner.remove());
      banner.append(title, body, closeButton);
      D.body.appendChild(banner);
      addMessage('system', 'AVISO GLOBAL', notice, false);
    } catch (_) { /* configuração opcional */ }
  }

  function setMode(mode) {
    state.mode = ['owner', 'change'].includes(mode) ? mode : 'mini';
    const panel = root();
    if (!panel) return;
    panel.querySelector('[data-psy-change]')?.setAttribute('data-active', state.mode === 'change' ? '1' : '0');
    panel.querySelector('[data-psy-owner-chat]')?.setAttribute('data-active', state.mode === 'owner' ? '1' : '0');
    panel.querySelector('[data-psy-mini]')?.setAttribute('data-active', state.mode === 'mini' ? '1' : '0');
    panel.querySelector('[data-psy-owner]')?.setAttribute('data-open', ['owner', 'change'].includes(state.mode) ? '1' : '0');
    const input = panel.querySelector('textarea');
    if (input) input.placeholder = state.mode === 'change' ? 'Descreva a mudança que Psy deve planejar…' : state.mode === 'owner' ? 'Fale com a Psy AI proprietária…' : 'Pergunte sobre exploração, caça ou o estado atual…';
    const fileBox = panel.querySelector('[data-psy-file-box]');
    if (fileBox) fileBox.hidden = state.mode === 'mini';
  }

  function renderProposal(proposal) {
    state.proposal = proposal;
    const box = root()?.querySelector('[data-psy-proposal]');
    if (!box || !proposal) return;
    box.hidden = false;
    const actionLabel = proposal.operation === 'test_state_patch' ? 'APLICAR TESTE' : 'APROVAR ALTERAÇÃO';
    box.innerHTML = '<strong>🛡 PROPOSTA REVISÁVEL</strong><dl><dt>Título</dt><dd>' + esc(proposal.title) + '</dd><dt>Operação</dt><dd>' + esc(proposal.operation) + '</dd><dt>Resumo</dt><dd>' + esc(proposal.summary) + '</dd><dt>Risco</dt><dd>' + esc(proposal.risk) + '</dd><dt>Arquivos</dt><dd>' + esc((proposal.files || []).join(', ') || 'nenhum') + '</dd></dl><div class="psy-assistant-proposal-actions"><button type="button" data-psy-approve>' + actionLabel + '</button><button type="button" data-psy-dismiss>FECHAR</button></div>';
    box.querySelector('[data-psy-approve]')?.addEventListener('click', applyProposal);
    box.querySelector('[data-psy-dismiss]')?.addEventListener('click', () => { box.hidden = true; state.proposal = null; });
  }

  async function applyProposal() {
    if (!state.proposal) return;
    const token = root()?.querySelector('[data-psy-owner-token]')?.value || state.ownerToken;
    if (!token) return addMessage('system', 'SEGURANÇA', 'Informe o token do proprietário; ele não é salvo.');
    if (!W.confirm('Confirma esta alteração? A Psy enviará APROVAR ALTERAÇÃO ao servidor protegido.')) return;
    try {
      const data = await request('/apply-change', { proposal_id: state.proposal.id, owner_token: token, confirmation: 'APROVAR ALTERAÇÃO' }, { 'X-Psy-Owner-Token': token });
      if (data.state_patch) {
        const result = applyTestStatePatch(data.state_patch);
        addMessage('assistant', 'Psy AI', result.message);
      } else {
        addMessage('assistant', 'Psy', 'Alteração segura aplicada: ' + JSON.stringify(data.config || data.status || {}));
      }
      const box = root()?.querySelector('[data-psy-proposal]');
      if (box) box.hidden = true;
      state.proposal = null;
    } catch (error) { addMessage('system', 'BLOQUEADO', error.message || 'A alteração não foi aplicada.'); }
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Não foi possível ler ' + file.name));
      reader.onload = () => resolve({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, data_url: reader.result });
      reader.readAsDataURL(file);
    });
  }

  function setFileStatus(value) {
    const label = root()?.querySelector('[data-psy-file-label]');
    if (label) label.textContent = value;
  }

  async function uploadProject(file, token) {
    if (!token) throw new Error('Informe o token antes de enviar um projeto.');
    const maxBytes = Number(state.health?.max_project_upload_bytes) || MAX_PROJECT_BYTES;
    if (file.size > maxBytes) throw new Error(file.name + ' excede o limite de importação do projeto.');
    if (!/\.zip$/i.test(file.name)) throw new Error('Projetos grandes devem ser enviados em formato .zip.');
    const uploadId = 'psyproj-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    const chunks = Math.ceil(file.size / PROJECT_CHUNK_BYTES);
    for (let index = 0; index < chunks; index += 1) {
      const offset = index * PROJECT_CHUNK_BYTES;
      const end = Math.min(file.size, offset + PROJECT_CHUNK_BYTES);
      setFileStatus('Enviando ZIP do projeto… ' + Math.floor((end / file.size) * 100) + '%');
      const response = await fetch(endpoint() + '/upload-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Psy-Client': 'game-v2',
          'X-Psy-Owner-Token': token,
          'X-Psy-Project-Name': encodeURIComponent(file.name),
          'X-Psy-Project-Size': String(file.size),
          'X-Psy-Upload-Id': uploadId,
          'X-Psy-Chunk-Index': String(index),
          'X-Psy-Chunk-Count': String(chunks),
          'X-Psy-Chunk-Offset': String(offset),
        },
        body: file.slice(offset, end),
      });
      let data = {}; try { data = await response.json(); } catch (_) {}
      if (!response.ok) throw new Error(data.message || data.error || 'Não foi possível enviar o ZIP do projeto.');
    }
    setFileStatus(file.name + ' pronto para análise');
    return { upload_id: uploadId, name: file.name, size: file.size };
  }

  async function collectFiles(token) {
    const input = root()?.querySelector('[data-psy-files]');
    const files = Array.from(input?.files || []);
    if (!files.length) return { files: [], project: null };
    if (files.length > MAX_FILE_COUNT) throw new Error('Selecione no máximo ' + MAX_FILE_COUNT + ' arquivos por mensagem.');
    const large = files.filter(file => file.size > MAX_FILE_BYTES);
    if (large.length > 1) throw new Error('Envie somente um ZIP grande de projeto por vez.');
    let project = null;
    if (large.length) {
      if (state.mode !== 'owner') throw new Error('O ZIP grande deve ser enviado pelo modo Psy AI.');
      project = await uploadProject(large[0], token);
    }
    let total = 0;
    const regularFiles = files.filter(file => file !== large[0]);
    for (const file of regularFiles) {
      total += file.size;
    }
    if (total > MAX_TOTAL_FILE_BYTES) throw new Error('Os anexos excedem o limite total de 18 MiB.');
    const result = [];
    for (const file of regularFiles) result.push(await readFile(file));
    return { files: result, project };
  }

  function updateFileLabel() {
    const input = root()?.querySelector('[data-psy-files]');
    const label = root()?.querySelector('[data-psy-file-label]');
    if (!label) return;
    const selected = Array.from(input?.files || []).slice(0, MAX_FILE_COUNT);
    const names = selected.map(file => file.name);
    const largeZip = selected.find(file => file.size > MAX_FILE_BYTES);
    label.textContent = names.length
      ? names.join(', ') + (largeZip ? ' · ZIP será enviado em partes' : '')
      : 'Nenhum arquivo selecionado';
  }

  async function submit(event) {
    event.preventDefault();
    const panel = root();
    const input = panel?.querySelector('textarea');
    const send = panel?.querySelector('.psy-assistant-send');
    const message = input?.value.trim() || '';
    const token = panel.querySelector('[data-psy-owner-token]')?.value.trim() || '';
    state.ownerToken = token;
    let bundle = { files: [], project: null };
    try { bundle = await collectFiles(token); } catch (error) { addMessage('system', 'ARQUIVOS', error.message); return; }
    const files = bundle.files;
    const project = bundle.project;
    if (!message && !files.length && !project) return;
    const finalMessage = message || 'Analise os arquivos anexados e explique o que encontrou.';
    input.value = '';
    const attachedNames = files.map(file => file.name);
    if (project) attachedNames.push(project.name);
    addMessage('user', 'Você', attachedNames.length ? finalMessage + ' [' + attachedNames.join(', ') + ']' : finalMessage);
    if (send) send.disabled = true;
    const ctx = gameContext();
    try {
      const testStateIntent = state.mode === 'owner' && isTestStateIntent(finalMessage);
      if (state.mode === 'change' || testStateIntent) {
        if (!token) throw new Error('Informe o token do proprietário para planejar uma alteração.');
        const data = await request('/propose-change', { message: finalMessage, context: ctx, history: state.history, files, project_upload_id: project?.upload_id || '', session_id: state.sessionId, owner_token: token }, { 'X-Psy-Owner-Token': token });
        renderProposal(data.proposal);
        addMessage('assistant', 'Psy', testStateIntent ? 'Entendi o comando de teste e preparei o cartão para aplicar no save. Confirme no botão quando reconhecer o pedido.' : 'Preparei uma proposta revisável. Nada foi alterado; confira o cartão e confirme apenas se reconhecer o pedido.');
      } else if (state.mode === 'owner') {
        if (!token) throw new Error('Informe o token do proprietário para usar a Psy AI.');
        const data = await request('/chat', { message: finalMessage, context: ctx, history: state.history, files, project_upload_id: project?.upload_id || '', session_id: state.sessionId, owner_token: token }, { 'X-Psy-Owner-Token': token });
        addMessage('assistant', data.name || 'Psy AI', data.answer || 'Não recebi uma resposta.');
        (data.images || []).forEach(image => addImage(data.name || 'Psy AI', image));
        (data.file_warnings || []).forEach(warning => addMessage('system', 'ARQUIVO', warning, false));
      } else {
        const data = await request('/chat', { message: finalMessage, context: ctx, history: state.history, session_id: state.sessionId }, undefined);
        addMessage('assistant', data.name || 'Mini Psy AI, seu assistente virtual', data.answer || 'Não recebi uma resposta.');
      }
    } catch (error) {
      const onlineMessage = connectionAnswer(error, state.mode);
      addMessage('assistant', onlineMessage ? 'Psy AI' : 'Mini Psy AI — modo local', onlineMessage || offlineAnswer(finalMessage, ctx, files.length > 0 || !!project));
    } finally {
      if (send) send.disabled = false;
      const fileInput = panel?.querySelector('[data-psy-files]');
      if (fileInput) fileInput.value = '';
      updateFileLabel();
      input?.focus();
    }
  }

  function close() {
    state.open = false;
    const panel = root();
    if (panel) {
      panel.hidden = true;
      const token = panel.querySelector('[data-psy-owner-token]');
      if (token) token.value = '';
      const fileInput = panel.querySelector('[data-psy-files]');
      if (fileInput) fileInput.value = '';
      updateFileLabel();
    }
    state.ownerToken = '';
    D.getElementById('psy-assistant-launcher')?.setAttribute('data-open', '0');
  }

  function open() {
    state.open = true;
    const panel = root();
    if (panel) { panel.hidden = false; setMode(state.mode); panel.querySelector('textarea')?.focus(); }
    D.getElementById('psy-assistant-launcher')?.setAttribute('data-open', '1');
    checkHealth();
  }

  function install() {
    if (!D.body || root()) return;
    const launcher = D.createElement('button');
    launcher.id = 'psy-assistant-launcher'; launcher.type = 'button'; launcher.innerHTML = '🧠 PSY<small>ASSISTENTE</small>'; launcher.setAttribute('aria-label', 'Abrir Psy'); launcher.onclick = open; D.body.appendChild(launcher);
    const menu = D.getElementById('menu');
    if (menu && !D.getElementById('psy-assistant-menu-button')) { const button = D.createElement('button'); button.id = 'psy-assistant-menu-button'; button.type = 'button'; button.textContent = '🧠 ABRIR PSY'; button.onclick = open; menu.insertBefore(button, menu.lastElementChild); }
    const panel = D.createElement('div');
    panel.id = 'psy-assistant'; panel.className = 'psy-assistant'; panel.hidden = true;
    panel.innerHTML = '<section class="psy-assistant-card" role="dialog" aria-modal="true" aria-label="Psy"><header class="psy-assistant-head"><div><div class="psy-assistant-brand">🧠 Psy <em>PSYWORLD</em></div><span class="psy-assistant-status" data-psy-status>LOCAL</span></div><button class="psy-assistant-close" type="button" data-psy-close>✕</button></header><div class="psy-assistant-feed" data-psy-feed><div class="psy-msg assistant"><small>Mini Psy AI, seu assistente virtual</small><div>Olá. Posso tirar dúvidas, orientar sua caça e ler o estado atual da aventura.</div></div></div><div class="psy-assistant-proposal" data-psy-proposal hidden></div><div class="psy-owner-box" data-psy-owner="0"><label>Token do proprietário <input type="password" data-psy-owner-token autocomplete="off" spellcheck="false"></label><small>Usado apenas em memória para esta solicitação; nunca fica no save nem no localStorage.</small></div><div class="psy-file-box" data-psy-file-box hidden><label>📎 Arquivos para Psy AI <input type="file" data-psy-files accept="*/*" multiple></label><small data-psy-file-label>Nenhum arquivo selecionado</small></div><div class="psy-assistant-compose"><form data-psy-form><textarea maxlength="4000" placeholder="Pergunte sobre exploração, caça ou o estado atual…"></textarea><button class="psy-assistant-send" type="submit">ENVIAR</button></form><div class="psy-assistant-tools"><button type="button" data-psy-mini="1" data-active="1">💬 MINI PSY</button><button type="button" data-psy-owner-chat="1" data-active="0">🔑 PSY AI</button><button type="button" data-psy-change="1" data-active="0">🛡 MUDANÇA</button></div></div></section>';
    D.body.appendChild(panel);
    panel.querySelector('[data-psy-close]')?.addEventListener('click', close);
    panel.querySelector('[data-psy-form]')?.addEventListener('submit', submit);
    panel.querySelector('[data-psy-files]')?.addEventListener('change', updateFileLabel);
    panel.querySelector('[data-psy-mini]')?.addEventListener('click', () => setMode('mini'));
    panel.querySelector('[data-psy-owner-chat]')?.addEventListener('click', () => setMode('owner'));
    panel.querySelector('[data-psy-change]')?.addEventListener('click', () => setMode('change'));
    panel.addEventListener('click', event => { if (event.target === panel) close(); });
    W.PSY = W.PSY || {};
    W.PSY.assistant = { name: 'Psy', open, close, context: gameContext, checkHealth };
    W.PSY.applyTestStatePatch = applyTestStatePatch;
    W.PSY.one = W.PSY.one || { name: 'One', role: 'automação local de animações e QA' };
    W.PSY.agents = W.PSY.agents || {
      one: { name: 'One', role: 'automação local de animações e QA' },
      sylvie: { name: 'Sylvie', role: 'revisão de persistência e consistência da Aventura' },
      luna: { name: 'Luna', role: 'revisão de persistência e consistência do World Idle' },
    };
    consumePendingTestStatePatches();
    W.addEventListener?.('storage', event => { if (event.key === 'psy.pending-test-state-patches') consumePendingTestStatePatches(); });
    checkHealth();
    loadGlobalNotice();
  }

  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', install, { once: true }); else install();
})(window, document);
