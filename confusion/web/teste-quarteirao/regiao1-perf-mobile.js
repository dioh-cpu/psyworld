// Otimizações de desempenho no celular:
// 1. Pré-carregamento sob demanda apenas dos vídeos de habilidade do time aliado e dos inimigos da batalha atual.
// 2. Pool LRU com limite de vídeos simultâneos em memória (6 no celular, 10 no desktop) e liberação explícita de buffers/decoders.
// 3. Agendamento ocioso para recursos não críticos na abertura e telemetria leve (window.regiaoPerf).
// Não altera regiao1-vfx.js (consome apenas seus mapas exportados em modo somente leitura).
import { FX_HABILIDADES, CLIPES_POR_ESPECIE, CLIPE_ABYSSAR_FINAL, clipeElemental } from './regiao1-vfx.js';

export const LIMITE_VIDEOS_MOBILE = 6;
export const LIMITE_VIDEOS_DESKTOP = 10;

export function ehAmbienteMobile() {
  if (typeof window === 'undefined') return false;
  try {
    return window.innerWidth <= 900 || Boolean(window.matchMedia?.('(pointer: coarse)')?.matches);
  } catch {
    return window.innerWidth <= 900;
  }
}

export function normalizarUrlClipe(src) {
  if (!src || typeof src !== 'string') return null;
  if (/^(https?:|\/|\.\.\/|blob:|data:)/.test(src)) return src;
  return `../../../${src}`;
}

// Extrai apenas as URLs únicas de clipes MP4 das habilidades das unidades presentes na batalha atual.
export function coletarClipesBatalha(b) {
  if (!b) return [];
  const unidades = [
    ...(Array.isArray(b.aliados) ? b.aliados : []),
    ...(Array.isArray(b.inimigos) ? b.inimigos : []),
    ...(Array.isArray(b.esperaI) ? b.esperaI : []),
  ];
  const vistos = new Set();
  const urls = [];
  for (const u of unidades) {
    if (!u) continue;
    const esp = u.especie || '';
    const finalAbyssar = esp === 'Abyssar' && /\/abyssar\/03/.test(String(u.arte || ''));
    const kit = Array.isArray(u.kit) ? u.kit : [];
    for (const hab of kit) {
      if (!hab) continue;
      const cfg = hab.id ? FX_HABILIDADES[hab.id] : null;
      const varForma = hab.id && (CLIPES_POR_ESPECIE[esp]?.[hab.id] || (finalAbyssar && CLIPE_ABYSSAR_FINAL[hab.id]));
      const cfgClip = varForma ? { ...(cfg || {}), ...varForma } : cfg || clipeElemental(hab);
      const src = cfgClip?.clip || hab.clip || null;
      const url = normalizarUrlClipe(src);
      if (url && !vistos.has(url)) {
        vistos.add(url);
        urls.push(url);
      }
    }
  }
  return urls;
}

function liberarElementoVideo(v) {
  if (!v) return;
  try { v.pause?.(); } catch {}
  try { v.removeAttribute?.('src'); } catch {}
  try { v.load?.(); } catch {}
}

function criarElementoVideoPadrao(url, mobile) {
  if (typeof document === 'undefined') return null;
  const v = document.createElement('video');
  v.muted = true;
  v.defaultMuted = true;
  v.playsInline = true;
  // Em conexões móveis lentas (saveData / 2g), limita ao metadata; nas demais aquece o cache HTTP da batalha atual
  const conn = typeof navigator !== 'undefined' ? navigator.connection : null;
  const economia = Boolean(conn?.saveData || /^(slow-2g|2g)$/.test(String(conn?.effectiveType || '')));
  v.preload = economia ? 'metadata' : (mobile ? 'auto' : 'auto');
  v.src = url;
  try { v.load(); } catch {}
  return v;
}

// Pool LRU de vídeos em memória com limite rígido e liberação determinística.
export function criarPoolVideos({ maxMemoria = null, mobile = ehAmbienteMobile(), criarElemento = null } = {}) {
  const limite = Math.max(1, Math.floor(Number(maxMemoria) || (mobile ? LIMITE_VIDEOS_MOBILE : LIMITE_VIDEOS_DESKTOP)));
  const fabrica = criarElemento || ((url) => criarElementoVideoPadrao(url, mobile));
  const mapa = new Map(); // url -> { el, ts }
  let totalPrecarregados = 0;
  let totalEvictados = 0;

  function evictarAte(alvo) {
    while (mapa.size > alvo) {
      const oldestKey = mapa.keys().next().value;
      const entry = mapa.get(oldestKey);
      mapa.delete(oldestKey);
      liberarElementoVideo(entry?.el);
      totalEvictados += 1;
    }
  }

  function tocarOuInserir(url) {
    if (!url) return false;
    if (mapa.has(url)) {
      const item = mapa.get(url);
      mapa.delete(url);
      item.ts = Date.now();
      mapa.set(url, item);
      return false;
    }
    evictarAte(limite - 1);
    const el = fabrica(url);
    if (!el) return false;
    mapa.set(url, { el, ts: Date.now() });
    totalPrecarregados += 1;
    return true;
  }

  function precarregarUrls(urls) {
    if (!Array.isArray(urls) || !urls.length) return [];
    const selecionadas = urls.slice(0, limite);
    const novas = [];
    for (const url of selecionadas) {
      if (tocarOuInserir(url)) novas.push(url);
    }
    return novas;
  }

  function precarregarBatalha(b) {
    return precarregarUrls(coletarClipesBatalha(b));
  }

  function liberarTodos(manter = 0) {
    evictarAte(Math.max(0, Math.floor(Number(manter) || 0)));
  }

  function estatisticas() {
    return {
      ativos: mapa.size,
      limite,
      mobile: Boolean(mobile),
      totalPrecarregados,
      totalEvictados,
      urls: [...mapa.keys()],
    };
  }

  return { precarregarUrls, precarregarBatalha, liberarTodos, estatisticas };
}

let poolGlobal = null;
function garantirPool() {
  if (!poolGlobal) poolGlobal = criarPoolVideos();
  return poolGlobal;
}

export function precarregarVideosBatalha(b) {
  if (typeof document === 'undefined') return [];
  const pool = garantirPool();
  // Agenda no próximo quadro ocioso para não competir com o render inicial da arena
  const urls = coletarClipesBatalha(b);
  if (!urls.length) return [];
  agendarOcioso(() => pool.precarregarUrls(urls), 120);
  return urls;
}

export function liberarVideosBatalha() {
  if (!poolGlobal) return;
  // No celular libera tudo ao sair da arena; no desktop mantém até 2 mais recentes
  poolGlobal.liberarTodos(ehAmbienteMobile() ? 0 : 2);
}

export function agendarOcioso(fn, atrasoMs = 300) {
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    let cancelado = false;
    const t = setTimeout(() => {
      if (cancelado) return;
      window.requestIdleCallback(() => { if (!cancelado) fn(); }, { timeout: 1500 });
    }, atrasoMs);
    return () => { cancelado = true; clearTimeout(t); };
  }
  const t = setTimeout(fn, atrasoMs);
  return () => clearTimeout(t);
}

// Verdadeiro enquanto o gate de conta (.vis ou aguardando liberação) ou um modal em tela cheia (ex.: Refúgio) cobre o mapa 3D.
export function mapaCobertoNaAbertura() {
  if (typeof document === 'undefined') return false;
  try { if (sessionStorage.getItem('cw-gate-ok') !== '1') return true; } catch {}
  const gate = document.getElementById('conta-gate');
  if (!gate || gate.classList.contains('vis')) return true;
  const exp = document.getElementById('modal-exp');
  if (exp && exp.classList.contains('aberto')) return true;
  return false;
}

export function medirAbertura() {
  if (typeof performance === 'undefined') return null;
  const nav = performance.getEntriesByType?.('navigation')?.[0];
  const res = performance.getEntriesByType?.('resource') || [];
  const totalKB = Math.round(res.reduce((acc, r) => acc + (r.encodedBodySize || r.transferSize || 0), 0) / 1024);
  return {
    mobile: ehAmbienteMobile(),
    domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : 0,
    loadEventMs: nav ? Math.round(nav.loadEventEnd) : 0,
    recursos: res.length,
    totalKB,
    poolVideos: garantirPool().estatisticas(),
  };
}

export const RAIZ_TELAS_V2 = 'assets/confusion/interface/telas-v2';

// Escolhe a versão 1280px no celular (telas-v2/mobile/<tela>.webp) e 2560px no desktop (telas-v2/<tela>.webp),
// carregando sob demanda apenas a arte da tela que está aberta no momento.
export function urlFundoTela(telaId, { mobile = ehAmbienteMobile(), fallback = null } = {}) {
  const slug = String(telaId || '').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '');
  if (!slug) return { principal: fallback, alternativo: null, fallback };
  const desktopUrl = `${RAIZ_TELAS_V2}/${slug}.webp`;
  const mobileUrl = `${RAIZ_TELAS_V2}/mobile/${slug}.webp`;
  return {
    principal: mobile ? mobileUrl : desktopUrl,
    alternativo: mobile ? desktopUrl : null,
    fallback,
  };
}

const cacheFundoTela = new Map();
export function aplicarFundoTelaSobDemanda(el, telaId, fallback = null) {
  if (!el || typeof Image === 'undefined') return Promise.resolve(fallback);
  const { principal, alternativo } = urlFundoTela(telaId, { fallback });
  const chave = `${principal}|${alternativo || ''}|${fallback || ''}`;
  const aplicar = (p) => {
    if (!p) return p;
    const url = /^(https?:|\/|\.\.\/|blob:|data:)/.test(p) ? p : `../../../${p}`;
    el.style.backgroundImage = `url('${url}')`;
    return p;
  };
  if (cacheFundoTela.has(chave)) return Promise.resolve(aplicar(cacheFundoTela.get(chave)));
  const tentar = (candidatos) => new Promise((resolve) => {
    if (!candidatos.length) { resolve(fallback); return; }
    const [atual, ...resto] = candidatos;
    if (!atual) { resolve(tentar(resto)); return; }
    const url = /^(https?:|\/|\.\.\/|blob:|data:)/.test(atual) ? atual : `../../../${atual}`;
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => { cacheFundoTela.set(chave, atual); resolve(aplicar(atual)); };
    im.onerror = () => resolve(tentar(resto));
    im.src = url;
  });
  return tentar([principal, alternativo, fallback].filter(Boolean));
}

export function iniciarPerfMobile() {
  if (typeof window === 'undefined') return;
  const pool = garantirPool();
  // Em abas em segundo plano, libera decoders de vídeo ociosos para evitar descarte pelo SO móvel
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pool.liberarTodos(0);
  });
  window.regiaoPerf = {
    medirAbertura,
    pool: () => pool.estatisticas(),
    liberarVideos: () => pool.liberarTodos(0),
    urlFundoTela,
  };
}
