// Camadas separadas dos mockups premium por tela (fundo, painel, moldura, ícone).
// Contrato de arquivos (GPT/Codex): assets/confusion/interface/telas-v2/camadas/<slug>/<camada>.<ext>
//   camadas: painel (fundo do corpo), moldura (borda ornamental sobre o card), icone (ícone do título).
// Uma camada só é aplicada se estiver listada em CAMADAS_V2_DISPONIVEIS — assim não há 404 enquanto a arte não existe
// e a tela continua com a arte de reserva. Para ativar: acrescentar o arquivo à lista (ex.: 'reliquias/moldura.webp').
// O fundo cheio continua vindo de telas-v2/<slug>.webp (regiao1-perf-mobile.js).
const BASE = '../../../assets/confusion/interface/telas-v2/camadas';
export const CAMADAS_V2 = ['painel', 'moldura', 'icone'];
export const CAMADAS_V2_DISPONIVEIS = new Set([
  // 'reliquias/painel.webp', 'reliquias/moldura.webp', 'reliquias/icone.webp',
]);
const EXT = ['webp', 'png'];

export function urlCamadaV2(slug, camada) {
  for (const ext of EXT) { const k = `${slug}/${camada}.${ext}`; if (CAMADAS_V2_DISPONIVEIS.has(k)) return `${BASE}/${k}`; }
  return null;
}

// Aplica (ou limpa) as camadas do card: define --skin-<camada> e data-skin-<camada>, usados pelo CSS de regiao1.html.
export function aplicarCamadasTela(card, slug) {
  if (!card) return;
  for (const c of CAMADAS_V2) {
    const url = slug ? urlCamadaV2(slug, c) : null;
    if (url) { card.style.setProperty(`--skin-${c}`, `url('${url}')`); card.dataset[`skin${c[0].toUpperCase()}${c.slice(1)}`] = '1'; }
    else { card.style.removeProperty(`--skin-${c}`); delete card.dataset[`skin${c[0].toUpperCase()}${c.slice(1)}`]; }
  }
}
