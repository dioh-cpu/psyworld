(function (W, D) {
  'use strict';
  const MAX_FILES = 8, MAX_FILE_BYTES = 6 * 1024 * 1024, MAX_TOTAL_BYTES = 18 * 1024 * 1024, MAX_HISTORY = 24;
  const MAX_PROJECT_BYTES = 1024 * 1024 * 1024, PROJECT_CHUNK_BYTES = 4 * 1024 * 1024;
  const state = { endpoint: '', token: '', history: [], proposal: null, action: 'chat', online: false, maxProjectBytes: MAX_PROJECT_BYTES };
  const $ = selector => D.querySelector(selector);
  const clean = (value, limit = 180) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, limit);
  const appEndpoint = () => (state.endpoint || $('[data-mobile-endpoint]')?.value || '').trim().replace(/\/$/, '');
  const isTestStateIntent = value => /\b(coloque|colocar|adicione|adicionar|ponha|dar|conceda|give|grant)\b/i.test(String(value || ''))
    && /\b(bolsa|invent[aá]rio|time|box|pokemon|pok[eé]mon|stone|stones|pedra|boost|mega|shiny)\b/i.test(String(value || ''));

  function queueTestStatePatch(patch) {
    if (!patch || typeof patch !== 'object') return false;
    try {
      const key = 'psy.pending-test-state-patches';
      const current = JSON.parse(W.localStorage?.getItem(key) || '[]');
      const queue = Array.isArray(current) ? current.slice(-7) : [];
      queue.push({ patch, at: Date.now() });
      W.localStorage?.setItem(key, JSON.stringify(queue));
      return true;
    } catch (_) { return false; }
  }

  function status(label, online = false) {
    const el = $('[data-mobile-status]');
    if (!el) return;
    el.textContent = label;
    el.dataset.online = online ? '1' : '0';
  }

  function message(role, label, value, remember = true) {
    const host = $('[data-mobile-feed]');
    if (!host) return;
    const item = D.createElement('div'); item.className = 'psy-mobile-message ' + role;
    const small = D.createElement('small'); small.textContent = label;
    const body = D.createElement('div'); body.textContent = value;
    item.append(small, body); host.appendChild(item); host.scrollTop = host.scrollHeight;
    if (remember && (role === 'user' || role === 'assistant')) {
      state.history.push({ role, content: clean(value, 1600) });
      if (state.history.length > MAX_HISTORY) state.history.splice(0, state.history.length - MAX_HISTORY);
    }
  }

  async function call(path, payload) {
    const response = await fetch(appEndpoint() + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Psy-Client': 'mobile-v1', 'X-Psy-Owner-Token': state.token },
      body: JSON.stringify({ ...payload, owner_token: state.token }),
    });
    let data = {}; try { data = await response.json(); } catch (_) {}
    if (!response.ok) throw new Error(data.message || data.error || 'A Psy não respondeu.');
    return data;
  }

  async function unlock() {
    const endpoint = $('[data-mobile-endpoint]')?.value.trim();
    const token = $('[data-mobile-token]')?.value.trim();
    let parsed;
    try { parsed = new URL(endpoint); } catch (_) { parsed = null; }
    const localHost = parsed && ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
    if (!parsed || !(parsed.protocol === 'https:' || (parsed.protocol === 'http:' && localHost))) { $('[data-mobile-lock-status]').textContent = 'Informe um endereço HTTPS do gateway privado (HTTP só é aceito em localhost).'; return; }
    if (!token) { $('[data-mobile-lock-status]').textContent = 'Informe o token do proprietário.'; return; }
    state.endpoint = endpoint.replace(/\/$/, ''); state.token = token;
    try {
      const response = await fetch(state.endpoint + '/health', { cache: 'no-store' });
      const data = await response.json();
      if (!data.mobile_owner_app_ready) throw new Error('O gateway não está configurado para o proprietário.');
      state.maxProjectBytes = Number(data.max_project_upload_bytes) || MAX_PROJECT_BYTES;
      $('[data-mobile-lock]').hidden = true; $('[data-mobile-chat]').hidden = false; status('ONLINE', !!data.chat_available);
      $('[data-mobile-lock-status]').textContent = 'Sessão privada aberta.';
      message('system', 'SEGURANÇA', 'A sessão foi desbloqueada apenas em memória.', false);
    } catch (error) {
      state.token = ''; status('LOCKED', false); $('[data-mobile-lock-status]').textContent = error.message || 'Não foi possível validar o gateway.';
    }
  }

  function lock() {
    state.token = ''; state.proposal = null; state.history = [];
    const token = $('[data-mobile-token]'); if (token) token.value = '';
    $('[data-mobile-chat]').hidden = true; $('[data-mobile-lock]').hidden = false; status('LOCKED', false);
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Não foi possível ler ' + file.name));
      reader.onload = () => resolve({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, data_url: reader.result });
      reader.readAsDataURL(file);
    });
  }

  async function uploadProject(file) {
    if (!state.token) throw new Error('Informe o token antes de enviar um projeto.');
    if (file.size > state.maxProjectBytes) throw new Error(file.name + ' excede o limite de importação do projeto.');
    if (!/\.zip$/i.test(file.name)) throw new Error('Projetos grandes devem ser enviados em formato .zip.');
    const uploadId = 'psyproj-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    const chunks = Math.ceil(file.size / PROJECT_CHUNK_BYTES);
    for (let index = 0; index < chunks; index += 1) {
      const offset = index * PROJECT_CHUNK_BYTES;
      const end = Math.min(file.size, offset + PROJECT_CHUNK_BYTES);
      const label = $('[data-mobile-files-label]');
      if (label) label.textContent = 'Enviando ZIP do projeto… ' + Math.floor((end / file.size) * 100) + '%';
      const response = await fetch(appEndpoint() + '/upload-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Psy-Client': 'mobile-v1',
          'X-Psy-Owner-Token': state.token,
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
    return { upload_id: uploadId, name: file.name, size: file.size };
  }

  async function collectFiles() {
    const files = Array.from($('[data-mobile-files]')?.files || []);
    if (files.length > MAX_FILES) throw new Error('Selecione no máximo ' + MAX_FILES + ' arquivos.');
    const large = files.filter(file => file.size > MAX_FILE_BYTES);
    if (large.length > 1) throw new Error('Envie somente um ZIP grande de projeto por vez.');
    const project = large.length ? await uploadProject(large[0]) : null;
    const regularFiles = files.filter(file => file !== large[0]);
    let total = 0; for (const file of regularFiles) total += file.size;
    if (total > MAX_TOTAL_BYTES) throw new Error('Os arquivos excedem 18 MiB no total.');
    const result = []; for (const file of regularFiles) result.push(await readFile(file)); return { files: result, project };
  }

  function updateFileLabel() {
    const selected = Array.from($('[data-mobile-files]')?.files || []);
    const names = selected.map(file => file.name);
    const label = $('[data-mobile-files-label]'); if (label) label.textContent = names.length ? names.join(', ') + (selected.some(file => file.size > MAX_FILE_BYTES) ? ' · ZIP será enviado em partes' : '') : 'Nenhum arquivo selecionado';
  }

  function renderProposal(proposal) {
    state.proposal = proposal;
    const box = $('[data-mobile-proposal]'); if (!box || !proposal) return;
    box.hidden = false;
    const details = D.createElement('div'); details.innerHTML = '<strong>🛡 PROPOSTA REVISÁVEL</strong><dl><dt>Título</dt><dd></dd><dt>Operação</dt><dd></dd><dt>Resumo</dt><dd></dd><dt>Risco</dt><dd></dd></dl>';
    const values = [proposal.title, proposal.operation, proposal.summary, proposal.risk];
    details.querySelectorAll('dd').forEach((el, index) => { el.textContent = values[index] || ''; });
    const button = D.createElement('button'); button.type = 'button'; button.textContent = state.proposal.operation === 'test_state_patch' ? 'APLICAR TESTE' : 'APROVAR ALTERAÇÃO'; button.addEventListener('click', applyProposal);
    box.replaceChildren(details, button);
  }

  async function applyProposal() {
    if (!state.proposal) return;
    if (!W.confirm('Confirma esta alteração?')) return;
    try {
      const data = await call('/apply-change', { proposal_id: state.proposal.id, confirmation: 'APROVAR ALTERAÇÃO' });
      if (data.state_patch) {
        const applied = typeof W.PSY?.applyTestStatePatch === 'function' ? W.PSY.applyTestStatePatch(data.state_patch) : null;
        if (applied) message('assistant', 'Psy AI', applied.message);
        else message('assistant', 'Psy AI', queueTestStatePatch(data.state_patch) ? 'Teste aprovado e deixado na fila local para o jogo aplicar ao abrir.' : 'Teste aprovado pelo servidor. Abra o jogo na mesma origem para aplicar o estado.');
      } else message('assistant', 'Psy AI', 'Resultado: ' + JSON.stringify(data.config || data.status || {}));
      $('[data-mobile-proposal]').hidden = true; state.proposal = null;
    }
    catch (error) { message('system', 'BLOQUEADO', error.message); }
  }

  async function submit(event) {
    event.preventDefault();
    const input = $('[data-mobile-input]'), text = input?.value.trim() || '';
    let bundle = { files: [], project: null }; try { bundle = await collectFiles(); } catch (error) { message('system', 'ARQUIVOS', error.message, false); return; }
    const files = bundle.files, project = bundle.project;
    if (!text && !files.length && !project) return;
    const prompt = text || 'Analise os arquivos anexados e explique o que encontrou.';
    const attachedNames = files.map(file => file.name); if (project) attachedNames.push(project.name);
    input.value = ''; message('user', 'Você', attachedNames.length ? prompt + ' [' + attachedNames.join(', ') + ']' : prompt);
    try {
      if (state.action === 'change' || isTestStateIntent(prompt)) {
        const data = await call('/propose-change', { message: prompt, history: state.history, files, project_upload_id: project?.upload_id || '', session_id: 'mobile-' + Date.now() });
        renderProposal(data.proposal); message('assistant', 'Psy AI', isTestStateIntent(prompt) ? 'Entendi o comando de teste e preparei a aplicação no save. Confirme no cartão.' : 'A proposta foi criada e aguarda sua confirmação.');
      } else {
        const data = await call('/chat', { message: prompt, history: state.history, files, project_upload_id: project?.upload_id || '', session_id: 'mobile-' + Date.now() });
        message('assistant', data.name || 'Psy AI', data.answer || 'Não recebi uma resposta.');
        (data.file_warnings || []).forEach(warning => message('system', 'ARQUIVO', warning, false));
        if (Array.isArray(data.images)) data.images.forEach(url => { if (/^data:image\/(?:png|webp);base64,/i.test(url)) { const item = D.createElement('div'); item.className = 'psy-mobile-message assistant'; const img = D.createElement('img'); img.src = url; img.alt = 'Imagem gerada pela Psy'; img.style.maxWidth = '100%'; item.append(img); $('[data-mobile-feed]').appendChild(item); } });
      }
    } catch (error) { message('system', 'PSY AI', error.message || 'Falha no gateway.'); }
    finally { const fileInput = $('[data-mobile-files]'); if (fileInput) fileInput.value = ''; updateFileLabel(); }
  }

  function init() {
    $('[data-mobile-unlock]')?.addEventListener('click', unlock);
    $('[data-mobile-lock-button]')?.addEventListener('click', lock);
    $('[data-mobile-files]')?.addEventListener('change', updateFileLabel);
    $('[data-mobile-form]')?.addEventListener('submit', submit);
    $('[data-mobile-plan]')?.addEventListener('click', () => { state.action = state.action === 'change' ? 'chat' : 'change'; const button = $('[data-mobile-plan]'); button.textContent = state.action === 'change' ? '↩ VOLTAR AO CHAT' : '🛡 PLANEJAR MUDANÇA'; });
    const savedEndpoint = W.localStorage?.getItem('psy.mobile.endpoint');
    if (savedEndpoint) $('[data-mobile-endpoint]').value = savedEndpoint;
    $('[data-mobile-endpoint]')?.addEventListener('change', event => { state.endpoint = event.target.value.trim().replace(/\/$/, ''); try { W.localStorage?.setItem('psy.mobile.endpoint', state.endpoint); } catch (_) {} });
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('mobile/sw.js').catch(() => {});
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})(window, document);
