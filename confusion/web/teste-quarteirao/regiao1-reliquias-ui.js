// Interface de Relíquias (4 espaços + 1 Arma Única) e Essências — padrão gacha premium
import {
  PARTES_RELIQUIA,
  CONJUNTOS_RELIQUIAS,
  RARIDADES_ORDEM,
  reliquiasDe,
  filtrarReliquias,
  conjuntosAtivosDoOnirico,
  equiparReliquia,
  desequiparReliquia,
  equiparReliquiasRecomendadas,
  custoReforcoReliquia,
  reforcarReliquia,
  trancarReliquia,
  desmontarReliquia,
  salvarPredefinicaoReliquias,
  aplicarPredefinicaoReliquias,
  armasUnicasDe,
  armaUnicaDaLinhagem,
  criarArmaUnica,
  reforcarArmaUnica,
  equiparArmaUnica,
  GUIA_SISTEMA_RELIQUIAS,
  ONDE_CONSEGUIR_RELIQUIAS,
  fontesDeReliquia,
} from './regiao1-reliquias-regras.js';
import { essenciasDe, ESSENCIAS_PARES } from './regiao1-campanha-mini-regras.js';
import { ONDE_CONSEGUIR_ESSENCIAS } from './regiao1-regras-sonho.js';
import { TORRES_ELEMENTAIS_CATALOGO } from './regiao1-torres-regras.js';
import { CALABOUCOS_CATALOGO } from './regiao1-calaboucos-regras.js';
import { arteDoIndividuo } from './regiao1-halloween-dados.js';
import { ELEMENTO_DA_ESPECIE } from '../species.js';
import { NOME_ELEMENTO } from '../core.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const icoEl = (el) => `../../../assets/confusion/interface/menus-v1/ficha/sonho-${el === 'sombra' ? 'trevas' : el}.png`;
const IMG = (p) => `../../../${p}`;

const ICO_PARTE = { coroa: '👑', amuleto: '📿', anel: '💍', talisma: '🔮' };
const IMG_LOOT = '../../../assets/confusion/interface/feedback-rodada/icones-loot';
function iconeReliquia(parte, raridade) {
  const p = Object.hasOwn(ICO_PARTE, parte) ? parte : null;
  if (!p) return '💎';
  const r = ['comum', 'incomum', 'rara', 'epica', 'lendaria', 'mitica'].includes(raridade) ? raridade : null;
  const caminho = r ? `${IMG_LOOT}/raridades/${p}-${r}.png` : `${IMG_LOOT}/${p}-base.png`;
  return `<img src="${caminho}" alt="" style="width:24px;height:24px;object-fit:contain;vertical-align:middle" onerror="this.replaceWith(document.createTextNode('${ICO_PARTE[p]}'))">`;
}
function iconeEssencia(tamanho) {
  return `<img src="${IMG_LOOT}/essencia-${tamanho}.png" alt="" style="width:24px;height:24px;object-fit:contain;vertical-align:middle" onerror="this.style.display='none'">`;
}

const COR_RAR = {
  comum: '#cbd5e1',
  incomum: '#4ade80',
  rara: '#38bdf8',
  epica: '#c084fc',
  lendaria: '#fde047',
};
const NOME_RAR = {
  comum: 'Comum',
  incomum: 'Incomum',
  rara: 'Rara',
  epica: 'Épica',
  lendaria: 'Lendária',
};

function fmtAttr(attr, val) {
  if (val == null) return '';
  const nomes = {
    hp_pct: 'HP', hp_flat: 'HP', atk_pct: 'ATQ', atk_flat: 'ATQ', def_pct: 'DEF', def_flat: 'DEF',
    velocidade: 'VEL', critico_pct: 'Crítico', dano_critico_pct: 'Dano Crít.', roubo_vida_pct: 'Roubo de Vida',
    cura_pct: 'Cura', escudo_pct: 'Escudo',
  };
  const rot = nomes[attr] || String(attr).replace(/_pct|_flat/g, '').toUpperCase();
  if (String(attr).endsWith('_flat') || attr === 'velocidade') return `${rot} +${Math.round(val)}`;
  return `${rot} +${Math.round(val * 100)}%`;
}

function corRar(r) {
  return COR_RAR[String(r || '').toLowerCase()] || '#cbd5e1';
}

function renderListaFontes(fontes) {
  return (fontes || []).map((f) => `• <b style="color:#fff3e7">${esc(f.modo)}</b> — ${esc(f.local)}: ${esc(f.detalhe)}`).join('<br>');
}

function painelComoFuncionaHtml() {
  const topicos = Array.isArray(GUIA_SISTEMA_RELIQUIAS?.topicos) ? GUIA_SISTEMA_RELIQUIAS.topicos : [];
  return `<div class="bl" style="border:1.5px solid rgba(253,230,138,.48);background:linear-gradient(180deg,rgba(32,19,48,.96),rgba(14,9,24,.98))">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px">
      <b style="color:#fde68a;font-size:13px">📖 ${esc(GUIA_SISTEMA_RELIQUIAS?.titulo || 'Como funcionam as Relíquias e a Arma Única')}</b>
      <button class="btn-sec" data-rel-toggle-guia="1" style="padding:2px 8px;font-size:11px">Fechar</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;font-size:11.5px;color:#d6dbe4;line-height:1.45">
      <div style="background:rgba(10,6,20,.78);border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:7px 9px">
        <b style="color:#fff3e7">1. 4 Relíquias + 1 Arma Única</b><br>
        ${esc(topicos[0] || 'Cada Onírico equipa 4 Relíquias (Coroa, Amuleto, Anel, Talismã) do mesmo elemento + 1 Arma Única exclusiva.')}
      </div>
      <div style="background:rgba(10,6,20,.78);border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:7px 9px">
        <b style="color:#fff3e7">2. Conjuntos (2 e 4 peças) e Reforço</b><br>
        ${esc(topicos.slice(1, 3).join(' '))}
      </div>
      <div style="background:rgba(10,6,20,.78);border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:7px 9px">
        <b style="color:#fff3e7">3. Arma Única e Farm Livre</b><br>
        ${esc(topicos.slice(3).join(' '))}
      </div>
    </div>
  </div>`;
}

function painelOndeConseguirHtml(elMembro) {
  const calMatch = elMembro
    ? CALABOUCOS_CATALOGO.find((c) => (c.elementos || []).includes(elMembro))
    : null;
  const conjRef = calMatch?.conjuntos?.[0];
  const fontesRel = conjRef ? fontesDeReliquia(conjRef) : ONDE_CONSEGUIR_RELIQUIAS.partes.coroa.fontes;
  const nomeEl = elMembro ? (NOME_ELEMENTO[elMembro] || elMembro) : 'seu elemento';
  return `<div class="bl" style="border:1.5px solid rgba(125,211,252,.48);background:linear-gradient(180deg,rgba(16,24,48,.96),rgba(10,12,26,.98))">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px">
      <b style="color:#7dd3fc;font-size:13px">🗺️ Onde conseguir Relíquias, Armas Únicas e Pó de Reforço</b>
      <button class="btn-sec" data-rel-toggle-fontes="1" style="padding:2px 8px;font-size:11px">Fechar</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:8px;font-size:11.5px;color:#d6dbe4;line-height:1.45">
      <div style="background:rgba(10,6,20,.78);border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:7px 9px">
        <b style="color:#fde68a">🏺 Relíquias (${esc(nomeEl)})</b><br>
        ${renderListaFontes(fontesRel)}
      </div>
      <div style="background:rgba(10,6,20,.78);border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:7px 9px">
        <b style="color:#fde68a">⚔️ ${esc(ONDE_CONSEGUIR_RELIQUIAS.armaUnica.nome)}</b><br>
        ${renderListaFontes(ONDE_CONSEGUIR_RELIQUIAS.armaUnica.fontes)}
      </div>
      <div style="background:rgba(10,6,20,.78);border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:7px 9px">
        <b style="color:#fde68a">✨ ${esc(ONDE_CONSEGUIR_RELIQUIAS.poReforco.nome)}</b><br>
        ${renderListaFontes(ONDE_CONSEGUIR_RELIQUIAS.poReforco.fontes)}
      </div>
    </div>
  </div>`;
}

export function renderizarPainelReliquias(save, aba, st) {
  if (aba === 1) {
    const ess = essenciasDe(save);
    const cards = Object.entries(ESSENCIAS_PARES).map(([id, p]) => {
      const s = ess[id] || { menor: 0, media: 0, maior: 0 };
      const infoFonte = ONDE_CONSEGUIR_ESSENCIAS[id];
      const fontesTxt = infoFonte?.fontes?.length
        ? renderListaFontes(infoFonte.fontes)
        : 'Torres Elementais · Chefes e Baús 3★ da Campanha Mini';
      const iconsHtml = p.elementos.map((e) => `<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(10,6,20,.82);border:1px solid rgba(243,194,122,.32);border-radius:999px;padding:2px 8px;font-size:11px;color:#fff3e7"><img src="${icoEl(e)}" alt="" style="width:15px;height:15px;object-fit:contain" onerror="this.style.display='none'">${esc(NOME_ELEMENTO[e] || e)}</span>`).join(' ');
      return `<div class="bl" style="margin:0;border:1px solid rgba(243,194,122,.35);background:linear-gradient(160deg,rgba(26,16,42,.94),rgba(12,8,24,.97));display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap">
          <h4 style="margin:0;color:#fde68a;font-size:13.5px;text-shadow:0 1px 2px rgba(0,0,0,.85)">💠 ${esc(p.nome)}</h4>
          <div style="display:flex;gap:4px;flex-wrap:wrap">${iconsHtml}</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
          <div style="background:rgba(10,6,20,.85);border:1px solid rgba(203,213,225,.28);border-radius:8px;padding:6px;text-align:center">
            <div style="font-size:10.5px;color:#d6dbe4">${iconeEssencia('menor')} Menor</div>
            <div style="font-size:16px;font-weight:800;color:#fff3e7">${s.menor}</div>
          </div>
          <div style="background:rgba(10,6,20,.85);border:1px solid rgba(56,189,248,.38);border-radius:8px;padding:6px;text-align:center">
            <div style="font-size:10.5px;color:#7dd3fc">${iconeEssencia('media')} Média</div>
            <div style="font-size:16px;font-weight:800;color:#fff3e7">${s.media}</div>
          </div>
          <div style="background:rgba(10,6,20,.85);border:1px solid rgba(253,224,71,.45);border-radius:8px;padding:6px;text-align:center">
            <div style="font-size:10.5px;color:#fde68a">${iconeEssencia('maior')} Maior</div>
            <div style="font-size:16px;font-weight:800;color:#fde047">${s.maior}</div>
          </div>
        </div>
        <div style="font-size:11px;color:#d6dbe4;border-top:1px solid rgba(255,255,255,.1);padding-top:6px;line-height:1.45">
          <b style="color:#7dd3fc">🗺️ Onde conseguir:</b><br>${fontesTxt}
        </div>
      </div>`;
    }).join('');
    return `<div class="bl" style="margin-bottom:8px">
      <div style="font-size:12px;color:#fff3e7;line-height:1.45"><b style="color:#fde68a">💠 Essências Elementais</b> são usadas para despertar e evoluir seus Oníricos. Cada par de elementos tem sua própria Torre Elemental.</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(265px,1fr));gap:8px">${cards}</div>`;
  }

  const rel = reliquiasDe(save);
  const armas = armasUnicasDe(save);
  const col = Array.isArray(save?.idle?.equipe) ? save.idle.equipe : [];
  if (!st.uid || !col.some((m) => m.uid === st.uid)) st.uid = col[0]?.uid || null;
  const membro = col.find((m) => m.uid === st.uid) || null;
  const elMembro = membro ? (membro.elemento || ELEMENTO_DA_ESPECIE[membro.especie] || 'neutro') : null;

  const selMembros = col.slice(0, 12).map((m) => {
    const el = m.elemento || ELEMENTO_DA_ESPECIE[m.especie] || 'neutro';
    return `<button class="${m.uid === st.uid ? 'btn-pri' : 'btn-sec'}" data-rel-uid="${esc(m.uid)}" style="padding:4px 8px;font-size:11px;display:inline-flex;align-items:center;gap:4px"><img src="${icoEl(el)}" alt="" style="width:13px;height:13px;object-fit:contain" onerror="this.style.display='none'">${esc(m.especie)}</button>`;
  }).join('');

  let equipHtml = '<div class="bl"><p class="mut">Nenhum Onírico na equipe.</p></div>';
  if (membro) {
    const eqMap = rel.equipadas[membro.uid] || {};
    const conjAtivos = conjuntosAtivosDoOnirico(save, membro.uid);
    const conjBadges = conjAtivos.length
      ? conjAtivos.map((c) => `<span class="tag" style="background:rgba(120,53,15,.72);color:#fef08a;border-color:#fde047">✦ ${esc(CONJUNTOS_RELIQUIAS[c.conjunto]?.nome || c.conjunto)} (${c.pecas}p)</span>`).join(' ')
      : '<span class="mut" style="font-size:11px">Combine 2 ou 4 peças do mesmo conjunto para ativar bônus</span>';

    const partes = Object.values(PARTES_RELIQUIA);
    const renderSlot = (p) => {
      const rid = eqMap[p.id];
      const item = rid ? rel.bolsa.find((x) => x.id === rid) : null;
      const cor = item ? corRar(item.raridade) : 'rgba(243,194,122,.28)';
      return `<div style="background:linear-gradient(160deg,rgba(16,12,30,.94),rgba(9,7,18,.98));border:1.5px solid ${cor};border-radius:10px;padding:7px 9px;font-size:11px;min-height:74px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:${item ? `0 0 12px ${cor}26` : 'none'}">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:4px">
          <span style="font-weight:700;color:#fff3e7">${iconeReliquia(p.id, item?.raridade)} ${esc(p.nome)}</span>
          ${item ? `<span style="font-size:10px;font-weight:800;color:${cor}">${esc(NOME_RAR[item.raridade] || item.raridade)} +${item.reforco || 0}</span>` : '<span style="font-size:10px;color:#d6dbe4">Vazio</span>'}
        </div>
        ${item
          ? `<div style="color:#fde68a;font-weight:700;margin-top:2px">${esc(fmtAttr(item.principal?.attr, item.principal?.valor))}</div>
             <div style="display:flex;justify-content:space-between;align-items:center;gap:4px;margin-top:3px">
               <span style="font-size:10px;color:#d6dbe4">${esc(CONJUNTOS_RELIQUIAS[item.conjunto]?.nome || item.conjunto)}</span>
               <button class="btn-sec" data-rel-deseq="${esc(membro.uid)}:${esc(p.id)}" style="padding:1px 6px;font-size:10px">Tirar</button>
             </div>`
          : `<div style="font-size:10.5px;color:#d6dbe4;opacity:.85">Toque em uma relíquia abaixo para equipar</div>`}
      </div>`;
    };

    const esqSlots = partes.slice(0, 2).map(renderSlot).join('');
    const dirSlots = partes.slice(2, 4).map(renderSlot).join('');
    const arteM = membro.arte || arteDoIndividuo(membro);
    const retratoUrl = arteM ? IMG(arteM) : '';

    const armaDef = armaUnicaDaLinhagem(membro.especie);
    const armaKey = armaDef?.linhagem;
    const armaPos = armaKey ? armas.criadas?.[armaKey] : null;
    const frags = armaKey ? (armas.fragmentos?.[armaKey] || 0) : 0;
    const armaEquipada = armas.equipadas?.[membro.uid] === armaKey;
    const armaHtml = armaDef ? `<div style="margin-top:8px;padding:8px 10px;border-radius:10px;background:linear-gradient(135deg,rgba(44,24,62,.88),rgba(16,10,28,.95));border:1.5px solid ${armaEquipada ? '#fde047' : 'rgba(243,194,122,.38)'};display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;font-size:11.5px">
      <div>
        <b style="color:#fde68a">⚔️ Arma Única (5º espaço exclusivo):</b> <b style="color:#fff3e7">${esc(armaDef.nome)}</b> ${armaPos ? `<span class="tag">+${armaPos.reforco || 0}</span>` : '<span style="color:#d6dbe4">(não forjada)</span>'}
        <div style="font-size:11px;color:#d6dbe4;margin-top:2px">Fragmentos: <b style="color:#fff3e7">${frags}/10</b> · Obtidos nas Torres Únicas</div>
      </div>
      <div style="display:flex;gap:5px;flex-wrap:wrap">
        ${!armaPos ? `<button class="btn-pri" data-rel-criar-arma="${esc(membro.especie)}" ${frags >= 10 ? '' : 'disabled'}>🔨 Forjar (10 frags)</button>` : `
          <button class="btn-sec" data-rel-ref-arma="${esc(membro.especie)}">⬆️ Reforçar</button>
          <button class="btn-pri" data-rel-eq-arma="${esc(membro.uid)}:${esc(membro.especie)}" ${armaEquipada ? 'disabled' : ''}>${armaEquipada ? '✓ Equipada' : 'Equipar Arma'}</button>
        `}
      </div>
    </div>` : '';

    equipHtml = `<div class="bl" style="background:linear-gradient(180deg,rgba(24,14,38,.95),rgba(11,7,20,.98));border:1.5px solid rgba(243,194,122,.42)">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <b style="font-size:14px;color:#fde68a">${esc(membro.especie)}</b>
          <span class="tag" style="display:inline-flex;align-items:center;gap:3px"><img src="${icoEl(elMembro)}" alt="" style="width:13px;height:13px;object-fit:contain" onerror="this.style.display='none'">${esc(NOME_ELEMENTO[elMembro] || elMembro)}</span>
          ${conjBadges}
        </div>
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          <button class="btn-pri" data-rel-rec="${esc(membro.uid)}">✨ Recomendar</button>
          <button class="btn-sec" data-rel-preset-save="${esc(membro.uid)}">💾 Salvar</button>
          <button class="btn-sec" data-rel-preset-load="${esc(membro.uid)}">📥 Aplicar</button>
        </div>
      </div>
      <div class="rel-equip-grade" style="display:grid;grid-template-columns:minmax(145px,1fr) minmax(115px,155px) minmax(145px,1fr);gap:8px;align-items:center">
        <div style="display:flex;flex-direction:column;gap:8px">${esqSlots}</div>
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 45%,rgba(168,85,247,.25),rgba(10,6,20,.88));border:1.5px solid rgba(243,194,122,.4);border-radius:12px;padding:8px;min-height:156px;text-align:center">
          ${retratoUrl ? `<img src="${retratoUrl}" alt="${esc(membro.especie)}" style="width:96px;height:96px;object-fit:contain;filter:drop-shadow(0 6px 10px rgba(0,0,0,.7))" onerror="this.style.display='none'">` : '<div style="font-size:42px;line-height:96px">🐾</div>'}
          <div style="font-size:11px;font-weight:700;color:#fff3e7;margin-top:4px">${esc(membro.especie)} · Nv.${membro.nivel || 1}</div>
          <div style="font-size:10px;color:#d6dbe4">4 Relíquias + 1 Arma</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">${dirSlots}</div>
      </div>
      ${armaHtml}
    </div>`;
  }

  const filtrosParte = [['', 'Todas'], ...Object.values(PARTES_RELIQUIA).map((p) => [p.id, `${ICO_PARTE[p.id] || ''} ${p.nome}`.trim()])]
    .map(([v, rot]) => `<button class="${(st.parte || '') === v ? 'btn-pri' : 'btn-sec'}" data-rel-fparte="${esc(v)}" style="padding:3px 7px;font-size:11px">${esc(rot)}</button>`).join('');
  const filtrosRar = [['', 'Todas'], ...RARIDADES_ORDEM.map((r) => [r, NOME_RAR[r] || r])]
    .map(([v, rot]) => `<button class="${(st.raridade || '') === v ? 'btn-pri' : 'btn-sec'}" data-rel-frar="${esc(v)}" style="padding:3px 7px;font-size:11px">${esc(rot)}</button>`).join('');

  const equipadasPorId = new Map();
  for (const [uid, slots] of Object.entries(rel.equipadas || {})) {
    for (const rid of Object.values(slots || {})) if (rid) equipadasPorId.set(rid, uid);
  }

  const itens = filtrarReliquias(save, {
    ...(st.parte ? { parte: st.parte } : {}),
    ...(st.raridade ? { raridade: st.raridade } : {}),
  });

  const listaHtml = itens.slice(0, 40).map((it) => {
    const custo = custoReforcoReliquia(it.reforco || 0);
    const donoUid = equipadasPorId.get(it.id) || null;
    const equipadaNoAtual = Boolean(membro && donoUid === membro.uid);
    const podeEq = Boolean(membro && it.elemento === elMembro && !equipadaNoAtual);
    const secs = (it.secundarios || []).map((s) => fmtAttr(s.attr, s.valor)).join(' · ');
    const cor = corRar(it.raridade);
    return `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 10px;margin-top:6px;border-radius:9px;background:rgba(12,8,24,.86);border:1px solid rgba(255,255,255,.14);border-left:4px solid ${cor};flex-wrap:wrap">
      <div style="font-size:11.5px;min-width:180px;flex:1">
        <b style="color:#fff3e7">${iconeReliquia(it.parte, it.raridade)} ${esc(PARTES_RELIQUIA[it.parte]?.nome || it.parte)} +${it.reforco || 0}</b>
        · <span class="tag" style="color:${cor};border-color:${cor}">${esc(NOME_RAR[it.raridade] || it.raridade)}</span>
        · <span class="tag">${esc(NOME_ELEMENTO[it.elemento] || it.elemento)}</span>
        · <span style="color:#d6dbe4">${esc(CONJUNTOS_RELIQUIAS[it.conjunto]?.nome || it.conjunto)}</span>${donoUid ? ' · <span style="color:#4ade80;font-weight:700">✓ Equipada</span>' : ''}
        <div style="color:#fde68a;font-weight:700;margin-top:3px">${esc(fmtAttr(it.principal?.attr, it.principal?.valor))}${secs ? ` <span style="color:#d6dbe4;font-weight:400">| ${esc(secs)}</span>` : ''}</div>
      </div>
      <div style="display:flex;gap:5px;flex-wrap:wrap">
        <button class="btn-pri" data-rel-eq="${esc(it.id)}" ${podeEq ? '' : 'disabled'} title="${equipadaNoAtual ? 'Já equipada neste Onírico' : podeEq ? 'Equipar no Onírico selecionado' : 'Só equipa em Onírico do mesmo elemento'}">${equipadaNoAtual ? '✓ Equipada' : 'Equipar'}</button>
        <button class="btn-sec" data-rel-ref="${esc(it.id)}" ${(it.reforco || 0) >= 15 ? 'disabled' : ''}>⬆️ +1 (${custo.ouro}🪙/${custo.po}✨)</button>
        <button class="btn-sec" data-rel-trancar="${esc(it.id)}">${it.trancada ? '🔒' : '🔓'}</button>
        <button class="btn-sec" data-rel-desm="${esc(it.id)}" ${it.trancada || donoUid ? 'disabled' : ''}>🗑️</button>
      </div>
    </div>`;
  }).join('');

  return `<div class="bl">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
      <b style="color:#fde68a">💎 Bolsa de Relíquias (${rel.bolsa.length}/${rel.capacidade}) · ✨ Pó de Reforço: ${rel.poReforco}</b>
      <div style="display:flex;gap:5px;flex-wrap:wrap">
        <button class="${st.guiaAberto ? 'btn-pri' : 'btn-sec'}" data-rel-toggle-guia="1" style="padding:4px 9px;font-size:11px">📖 Como funciona</button>
        <button class="${st.fontesAberto ? 'btn-pri' : 'btn-sec'}" data-rel-toggle-fontes="1" style="padding:4px 9px;font-size:11px">🗺️ Onde conseguir</button>
      </div>
    </div>
    <div style="display:flex;gap:4px;flex-wrap:wrap">${selMembros}</div>
  </div>
  ${st.guiaAberto ? painelComoFuncionaHtml() : ''}
  ${st.fontesAberto ? painelOndeConseguirHtml(elMembro) : ''}
  ${equipHtml}
  <div class="bl">
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px;align-items:center"><span style="font-size:11px;color:#d6dbe4;font-weight:700">Parte:</span>${filtrosParte}</div>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px;align-items:center"><span style="font-size:11px;color:#d6dbe4;font-weight:700">Raridade:</span>${filtrosRar}</div>
    ${listaHtml || '<p style="color:#d6dbe4;font-size:12px">Nenhuma relíquia encontrada com este filtro. Toque em <b>🗺️ Onde conseguir</b> para ver os Calabouços e fases da Campanha Mini!</p>'}
  </div>`;
}

export function tratarCliqueReliquias(d, { save, salvar, mostrarToast, render, st }) {
  if (d.relToggleGuia) { st.guiaAberto = !st.guiaAberto; render(); return true; }
  if (d.relToggleFontes) { st.fontesAberto = !st.fontesAberto; render(); return true; }
  if (d.relUid) { st.uid = d.relUid; render(true); return true; }
  if (d.relFparte !== undefined) { st.parte = d.relFparte || null; render(true); return true; }
  if (d.relFrar !== undefined) { st.raridade = d.relFrar || null; render(true); return true; }
  if (d.relEq) {
    const r = equiparReliquia(save, st.uid, d.relEq);
    if (r.ok) { salvar(); mostrarToast('💎 Relíquia equipada!'); render(); }
    else mostrarToast(r.motivo || 'Não foi possível equipar.');
    return true;
  }
  if (d.relDeseq) {
    const [uid, parte] = d.relDeseq.split(':');
    const r = desequiparReliquia(save, uid, parte);
    if (r.ok) { salvar(); mostrarToast('Relíquia desequipada.'); render(); }
    else mostrarToast(r.motivo || 'Erro ao desequipar.');
    return true;
  }
  if (d.relRec) {
    const r = equiparReliquiasRecomendadas(save, d.relRec);
    if (r.ok) { salvar(); mostrarToast(`✨ ${r.equipadas?.length || 0} relíquia(s) recomendada(s) equipada(s)!`); render(); }
    else mostrarToast(r.motivo || 'Nenhuma relíquia compatível na bolsa.');
    return true;
  }
  if (d.relPresetSave) {
    const r = salvarPredefinicaoReliquias(save, d.relPresetSave, 'padrao');
    if (r.ok) { salvar(); mostrarToast('💾 Predefinição salva!'); render(); }
    return true;
  }
  if (d.relPresetLoad) {
    const r = aplicarPredefinicaoReliquias(save, d.relPresetLoad, 'padrao');
    if (r.ok) { salvar(); mostrarToast('📥 Predefinição aplicada!'); render(); }
    else mostrarToast(r.motivo || 'Nenhuma predefinição salva.');
    return true;
  }
  if (d.relRef) {
    const r = reforcarReliquia(save, d.relRef);
    if (r.ok) { salvar(); mostrarToast(`⬆️ Relíquia reforçada para +${r.reliquia.reforco}!`); render(); }
    else mostrarToast(r.motivo || 'Recursos insuficientes.');
    return true;
  }
  if (d.relTrancar) {
    const item = reliquiasDe(save).bolsa.find((x) => x.id === d.relTrancar);
    if (item) {
      trancarReliquia(save, item.id, !item.trancada);
      salvar();
      render();
    }
    return true;
  }
  if (d.relDesm) {
    const r = desmontarReliquia(save, d.relDesm);
    if (r.ok) { salvar(); mostrarToast(`🗑️ Desmontada! +${r.poGanho || 0} ✨ Pó de Reforço.`); render(); }
    else mostrarToast(r.motivo || 'Não foi possível desmontar.');
    return true;
  }
  if (d.relCriarArma) {
    const r = criarArmaUnica(save, d.relCriarArma);
    if (r.ok) { salvar(); mostrarToast('⚔️ Arma Única forjada!'); render(); }
    else mostrarToast(r.motivo || 'Fragmentos insuficientes.');
    return true;
  }
  if (d.relRefArma) {
    const r = reforcarArmaUnica(save, d.relRefArma);
    if (r.ok) { salvar(); mostrarToast('⬆️ Arma Única reforçada!'); render(); }
    else mostrarToast(r.motivo || 'Recursos insuficientes.');
    return true;
  }
  if (d.relEqArma) {
    const [uid, esp] = d.relEqArma.split(':');
    const r = equiparArmaUnica(save, uid, esp);
    if (r.ok) { salvar(); mostrarToast('⚔️ Arma Única equipada!'); render(); }
    else mostrarToast(r.motivo || 'Não foi possível equipar.');
    return true;
  }
  return false;
}
