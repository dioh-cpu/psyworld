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

  function addMessage(role, label, message, rememberIt = true, sources = []) {
    const host = feed();
    if (!host) return;
    const el = D.createElement('div');
    el.className = 'psy-msg ' + role;
    const small = D.createElement('small');
    small.textContent = label;
    const body = D.createElement('div');
    body.textContent = message;
    el.append(small, body);
    if (Array.isArray(sources) && sources.length) {
      const links = D.createElement('div'); links.className = 'psy-assistant-sources';
      for (const source of sources.slice(0, 5)) {
        try {
          const url = new URL(String(source.url || ''));
          if (url.protocol !== 'https:') continue;
          const link = D.createElement('a'); link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
          link.textContent = text(source.title || url.hostname, 90); links.appendChild(link);
        } catch (_) {}
      }
      if (links.childElementCount) el.appendChild(links);
    }
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

  function isRestrictedContent(message) {
    const q = String(message || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return /\b(porn(o|ografia)?|erotic[oa]|nudez|nudes?|sexo explicito|conteudo sexual|sexual explicito|fetiche|estupro|abuso sexual|auto.?mutilacao|suicid(io|a)|gore|tortura explicita|violencia grafica)\b/.test(q);
  }
  const restrictedReply = 'Não posso ajudar com conteúdo sexual, explícito ou sensível. Posso responder perguntas sobre Pokémon e Psyworld.';

  function offlineAnswer(message, ctx, files) {
    const q = String(message || '').toLowerCase();
    const pokemon = ctx.active_name || 'seu Pokémon ativo';
    const level = ctx.active_level ? ' Lv. ' + ctx.active_level : '';
    const hp = ctx.active_max_hp ? ' HP ' + ctx.active_hp + '/' + ctx.active_max_hp : '';
    if (/\b(onde|qual|melhor|recomenda|ca[cç]ar|ca[cç]a|hunt|upar|treinar|farm)\b/.test(q) && /\b(ca[cç]|hunt|upar|level|treinar|farm|pok[eé]mon)\b/.test(q)) {
      const name = ctx.active_name || 'seu Pokémon';
      return 'Para ' + name + ' no nível ' + (ctx.active_level || 1) + ', escolha no Psy Idle uma hunt de nível baixo, com Pokémon selvagens de nível 1. Em Kanto, procure áreas com Caterpie, Weedle, Rattata ou Bellsprout; Charmander tem vantagem contra Caterpie, Weedle e Bellsprout, e deve evitar alvos de Água. Confira o nível mínimo da área no mapa antes de iniciar.';
    }
    if (/\b(hp|vida|status|level|nível|nivel|xp|experi[eê]ncia|dano)\b/.test(q)) {
      return 'Seu Pokémon ativo é ' + pokemon + level + hp + '. Os detalhes completos ficam no HUD e na tela Time / Box. O dano depende do nível, dos atributos, do golpe e da vantagem de tipo.';
    }
    if (/\b(bag|bolsa|mochila|invent[aá]rio|itens?)\b/.test(q)) {
      return 'Abra MENU → BOLSA para ver quantidades e categorias. Pokébolas, poções, revives, stones e materiais ficam organizados por tipo; loja e mercado são telas separadas.';
    }
    if (/\b(caç|hunt|caçada|caçar|farm|pok[eé]mon selvagem|encontrar)\b/.test(q)) {
      return 'Abra HUNTS ou WORLD, escolha a região e o alvo disponível. A equipe ativa participa da caça; confira HP e nível no HUD e troque ou cure o Pokémon se a vida baixar.';
    }
    if (/\b(captur|catch|pok[eé]ball|pokeball|bola)\b/.test(q)) {
      return 'Para capturar, mantenha uma Pokébola na Bolsa e use a opção de captura na batalha. No World Idle, confira as opções do ajudante para ativar captura automática e selecionar a bola.';
    }
    if (/\b(passe|pass|miss[aã]o|missões|di[aá]rias|semanal|pontos do passe|passe \+)\b/.test(q)) {
      return 'Abra o Passe para acompanhar nível, recompensas e missões. As missões diárias e semanais avançam com as atividades indicadas; depois do nível 100, os pontos Pass+ podem ser trocados na loja do passe.';
    }
    if (/\b(inicial|come[cç]ar|começo|jornada|starter)\b/.test(q)) {
      return 'Na primeira entrada, escolha um dos Pokémon iniciais para formar seu primeiro time. Depois abra Time / Box para ver o companheiro escolhido.';
    }
    if (/\b(time|equipe|box|trocar|mudar pokemon)\b/.test(q)) {
      return 'Abra MENU → TIME / BOX. Ali você confere os Pokémon do time e os capturados no Box; a equipe ativa tem até seis Pokémon.';
    }
    if (/\b(amigo|amizade|trade|troca|jogador|player|trade zone)\b/.test(q)) {
      return 'A Trade Zone é a área social do World Idle. Entre no Idle com a mesma conta/sessão do jogo para aparecer aos outros treinadores; ali ficam os pedidos de amizade e trade.';
    }
    if (/\b(cloud|nuvem|save|salvar|conta)\b/.test(q)) {
      return 'O jogo salva automaticamente o progresso local. Para usar Cloud Save, abra a opção de conta/sincronização no jogo e confirme a conexão antes de trocar de dispositivo.';
    }
    if (/\b(gold|moeda|pr[eê]mio|recompensa|drop|loot)\b/.test(q)) {
      return 'Os drops e recompensas aparecem no registro da caça e na Bolsa. Gold e XP vão para os contadores do jogo; itens recebidos ficam na Bolsa.';
    }
    if (files) return 'A Psy Assistente ajuda com dúvidas do jogo, mas não analisa arquivos nesta versão.';
    return 'Sou a Psy Assistente. Posso ajudar com caça, batalhas, Pokémon, Bolsa, capturas, Passe e recursos sociais. Diga o que você quer encontrar ou como está sua situação no jogo.';
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
    const timer = setTimeout(() => controller.abort(), 22000);
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
      setStatus(data.chat_available ? (data.google_search ? 'GOOGLE · ONLINE' : 'ONLINE') : 'LOCAL', !!data.chat_available);
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
    if (isRestrictedContent(message)) {
      input.value = '';
      addMessage('user', 'Você', message);
      addMessage('assistant', 'Psy Assistente', restrictedReply);
      return;
    }
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
      if (!state.health?.chat_available) {
        addMessage('assistant', 'Psy Assistente', offlineAnswer(finalMessage, ctx, files.length > 0 || !!project));
        return;
      }
      if (send) send.textContent = 'BUSCANDO…';
      setStatus('PESQUISANDO…', true);
      const data = await request('/chat', { message: finalMessage, context: ctx, history: state.history }, undefined);
      addMessage('assistant', data.name || 'Psy Assistente', data.answer || 'Não recebi uma resposta.', true, data.sources || []);
    } catch (_) {
      addMessage('assistant', 'Psy Assistente', offlineAnswer(finalMessage, ctx, files.length > 0 || !!project));
    } finally {
      if (send) { send.disabled = false; send.textContent = 'ENVIAR'; }
      if (state.health?.chat_available) setStatus(state.health.google_search ? 'GOOGLE · ONLINE' : 'ONLINE', true);
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
    launcher.id = 'psy-assistant-launcher'; launcher.type = 'button'; launcher.innerHTML = '🧠 PSY<small>ASSISTENTE</small>'; launcher.setAttribute('aria-label', 'Abrir Psy Assistente'); launcher.onclick = open; D.body.appendChild(launcher);
    const menu = D.getElementById('menu');
    if (menu && !D.getElementById('psy-assistant-menu-button')) { const button = D.createElement('button'); button.id = 'psy-assistant-menu-button'; button.type = 'button'; button.textContent = '🧠 ABRIR PSY ASSISTENTE'; button.onclick = open; menu.insertBefore(button, menu.lastElementChild); }
    const panel = D.createElement('div');
    panel.id = 'psy-assistant'; panel.className = 'psy-assistant'; panel.hidden = true;
    panel.innerHTML = '<section class="psy-assistant-card" role="dialog" aria-modal="true" aria-label="Psy Assistente"><header class="psy-assistant-head"><div><div class="psy-assistant-brand">🧠 Psy Assistente <em>PSYWORLD</em></div><span class="psy-assistant-status" data-psy-status>LOCAL</span></div><button class="psy-assistant-close" type="button" data-psy-close>✕</button></header><div class="psy-assistant-feed" data-psy-feed><div class="psy-msg assistant"><small>Psy Assistente</small><div>Olá. Posso tirar dúvidas, orientar sua caça e ler o estado atual da aventura.</div></div></div><div class="psy-assistant-proposal" data-psy-proposal hidden></div><div class="psy-assistant-compose"><form data-psy-form><textarea maxlength="1400" placeholder="Pergunte sobre Pokémon, o Psyworld ou sua caça…"></textarea><button class="psy-assistant-send" type="submit">ENVIAR</button></form></div></section>';
    D.body.appendChild(panel);
    panel.querySelector('[data-psy-close]')?.addEventListener('click', close);
    panel.querySelector('[data-psy-form]')?.addEventListener('submit', submit);
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
