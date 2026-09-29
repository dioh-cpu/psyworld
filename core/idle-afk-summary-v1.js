(function (W, D) {
  'use strict';

  const MAX_REPORTS = 40;
  const asInt = value => Math.max(0, Math.floor(Number(value) || 0));
  const clean = value => String(value == null ? '' : value).slice(0, 80);
  const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  function record(profile, report, claimId, details) {
    if (!profile || typeof profile !== 'object' || !report || typeof report !== 'object') return null;
    profile.meta = profile.meta && typeof profile.meta === 'object' ? profile.meta : {};
    const rows = Array.isArray(profile.meta.psyIdleAfkReports) ? profile.meta.psyIdleAfkReports : [];
    const id = String(claimId || ('afk-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9)));
    const prior = rows.find(row => row && row.id === id);
    if (prior) return prior;

    const fallbackXp = asInt(report.xp_awarded);
    const trainerXp = asInt(report.trainer_xp_awarded == null ? fallbackXp : report.trainer_xp_awarded);
    const pokemonXp = asInt(report.pokemon_xp_awarded == null ? fallbackXp : report.pokemon_xp_awarded);
    const drops = [];
    const rawDrops = report.drops && typeof report.drops === 'object' ? report.drops : {};
    if (Array.isArray(rawDrops)) {
      for (const item of rawDrops) {
        const itemName = clean(item && (item.name || item.item)).trim();
        const amount = asInt(item && (item.quantity || item.qty));
        if (itemName && amount) drops.push({ name: itemName, quantity: amount });
      }
    } else {
      for (const [name, quantity] of Object.entries(rawDrops)) {
        const itemName = clean(name).trim();
        const amount = asInt(quantity);
        if (itemName && amount) drops.push({ name: itemName, quantity: amount });
      }
    }

    const metadata = details && typeof details === 'object' ? details : {};
    const row = {
      id: id,
      at: Date.now(),
      elapsedSeconds: Math.min(28800, asInt(report.elapsed_seconds)),
      kills: asInt(report.kills_awarded),
      gold: asInt(report.gold_awarded),
      trainerXp: trainerXp,
      pokemonXp: pokemonXp,
      mapName: clean(metadata.mapName || report.claimed_map_key || 'Caçada AFK'),
      speciesName: clean(metadata.speciesName || ''),
      pokemonName: clean(metadata.pokemonName || 'Pokémon ativo'),
      drops: drops,
      seen: false
    };
    if (!row.kills && !row.gold && !row.trainerXp && !row.pokemonXp && !row.drops.length) return null;
    rows.push(row);
    profile.meta.psyIdleAfkReports = rows.slice(-MAX_REPORTS);
    return row;
  }

  function duration(seconds) {
    const total = asInt(seconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hours) return hours + 'h ' + minutes + 'min';
    if (minutes) return minutes + 'min ' + secs + 's';
    return secs + 's';
  }

  function displayPending(profile, callbacks) {
    const rows = profile && profile.meta && profile.meta.psyIdleAfkReports;
    if (!Array.isArray(rows) || D.visibilityState === 'hidden' || !D.body) return false;
    if (D.getElementById('psy-ir-afk-report-overlay')) return false;
    const row = rows.find(item => item && !item.seen);
    if (!row) return false;

    const overlay = D.createElement('div');
    overlay.id = 'psy-ir-afk-report-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Resumo da caçada AFK');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(4,10,22,.88);backdrop-filter:blur(6px);font-family:system-ui,sans-serif;color:#effaff;';

    const drops = Array.isArray(row.drops) ? row.drops : [];
    const dropRows = drops.length
      ? drops.map(item => '<div style="display:flex;justify-content:space-between;gap:12px;padding:9px 11px;border:1px solid #33526d;border-radius:10px;background:#0b1b30"><span>' + escapeHtml(item.name) + '</span><b style="color:#94f5d5">× ' + asInt(item.quantity).toLocaleString('pt-BR') + '</b></div>').join('')
      : '<p style="margin:0;padding:12px;border:1px dashed #45627a;border-radius:10px;color:#a9bfd2">Nenhum item dropou nesta caçada.</p>';
    const at = new Date(Number(row.at) || Date.now()).toLocaleString('pt-BR');
    const stat = (icon, label, value) => '<div style="padding:12px;border:1px solid #36536d;border-radius:12px;background:#0d2036;text-align:left"><small style="display:block;color:#99b5cb;font-size:11px">' + icon + ' ' + label + '</small><b style="display:block;margin-top:5px;font-size:19px;color:#f0fbff">' + asInt(value).toLocaleString('pt-BR') + '</b></div>';

    overlay.innerHTML = '<section style="box-sizing:border-box;width:min(620px,96vw);max-height:90dvh;overflow:auto;border:1px solid #65ddd8;border-radius:20px;background:linear-gradient(145deg,#122d49,#17182f);box-shadow:0 28px 90px #000b">' +
      '<header style="padding:20px 22px 14px;border-bottom:1px solid #314d68"><small style="color:#73e5dc;letter-spacing:2px;font-weight:800">PSY IDLE • CAÇADA EM SEGUNDO PLANO</small><h2 style="margin:7px 0 3px;font-size:25px">Resumo da caçada AFK</h2><p style="margin:0;color:#abc0d3;font-size:12px">' + escapeHtml(row.mapName) + (row.speciesName ? ' • ' + escapeHtml(row.speciesName) : '') + ' • ' + escapeHtml(at) + '</p></header>' +
      '<div style="padding:17px 22px">' +
      '<p style="margin:0 0 13px;color:#bfd0df">O servidor contabilizou ' + escapeHtml(duration(row.elapsedSeconds)) + ' enquanto você estava fora.</p>' +
      '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px">' +
      stat('⚔️', 'Pokémon derrotados', row.kills) + stat('🪙', 'Gold recebido', row.gold) +
      stat('⭐', 'XP do treinador', row.trainerXp) + stat('✨', 'XP do Pokémon ' + escapeHtml(row.pokemonName || 'ativo'), row.pokemonXp) +
      '</div>' +
      '<h3 style="margin:18px 0 9px;font-size:14px;color:#9bf0dc">ITENS QUE FORAM PARA A BAG</h3>' +
      '<div style="display:grid;gap:7px;max-height:190px;overflow:auto">' + dropRows + '</div>' +
      '<button type="button" data-afk-ack style="display:block;width:100%;margin-top:18px;padding:13px;border:0;border-radius:12px;background:linear-gradient(100deg,#75f2c5,#77e9ed);color:#092335;font-weight:900;font-size:14px;cursor:pointer">CONTINUAR</button>' +
      '</div></section>';

    D.body.appendChild(overlay);
    const done = () => {
      row.seen = true;
      row.seenAt = Date.now();
      try { if (callbacks && typeof callbacks.onSeen === 'function') callbacks.onSeen(row); } catch (_) {}
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      displayPending(profile, callbacks);
    };
    const button = overlay.querySelector('[data-afk-ack]');
    if (button) button.addEventListener('click', done);
    overlay.addEventListener('click', event => { if (event.target === overlay) done(); });
    return true;
  }

  W.PsyIdleAfkSummary = Object.freeze({ record: record, displayPending: displayPending, duration: duration });
})(window, document);
