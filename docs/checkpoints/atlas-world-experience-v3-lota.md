# PSYWORLD — Atlas & World Experience V3 · checkpoint Lote A

## Controle de versão e publicação

- Branch local isolada: `visual/psyworld-atlas-world-v3`.
- Commit-base: `636a718bebf743b9df3be2dcf739a1d776e54ace`.
- `origin/main` conferida antes das alterações: o mesmo SHA completo do commit-base.
- Produção Vercel conferida antes das alterações: deployment `READY`, associado ao mesmo SHA (`636a718bebf743b9df3be2dcf739a1d776e54ace`).
- Sem push, merge ou deploy; nenhuma configuração de publicação foi alterada.

## Escopo concluído

Este checkpoint cobre somente o Lote A do Atlas e da navegação de Kanto.

- Reorganizado o Atlas da Jornada em uma interface cartográfica com arte pixelada própria, moldura, textura, bússola, estados para cidades/rotas/locais especiais e filtros de progresso.
- Mantidos os 38 locais, suas coordenadas, nomes, requisitos e dados de campanha da base. Acrescentadas 40 ligações geográficas explícitas para guiar a rota; um teste compara os dados existentes com o commit-base.
- “Seguir objetivo · IR” usa `PsyCampaignAutomation.startPrimaryRoute()`. O objetivo parte do local atual, segue as conexões abertas, caminha com colisões e dispara a interação/diálogo autoral ao chegar.
- Corrigida a retomada do Auto Route depois de diálogos da campanha e depois de fechar o mapa para abrir o Atlas. A posição exterior válida é preservada ao reabrir o mesmo mapa.
- O painel de detalhes mantém habitats, mistérios, espécies e “Abrir localidade”. Em mobile, esse conteúdo pode ser rolado; no landscape o espaço foi ajustado para tornar a ação acessível.
- Evitada a colisão do nome/título do treinador e da legenda de saída quando o personagem chega ao portão.
- Criados quatro assets pixel-art próprios para o Atlas. O gerador reproduz as artes incluídas no commit: `scripts/qa/generate-kanto-atlas-art-v3.py`.

## Arquivos desta etapa

- `core/campaign-automation-v1.js`
- `core/kanto-campaign-playable-v1.js`
- `core/kanto-journey-v1.js`
- `core/kanto-world-v2.js`
- `css/kanto-journey-v1.css`
- `index.html`
- `assets/ui/kanto-atlas-markers-v3.png`
- `assets/ui/kanto-atlas-compass-v3.png`
- `assets/ui/kanto-atlas-frame-v3.png`
- `assets/ui/kanto-atlas-vellum-v3.png`
- `scripts/qa/generate-kanto-atlas-art-v3.py`
- `scripts/qa/kanto-atlas-v3-browser.cjs`
- `tests/kanto-atlas-v3.test.cjs`

## Verificação

- `node tests/kanto-atlas-v3.test.cjs` — passou; 38 locais mantidos, grafo conectado e assets/dimensões validados.
- `node tests/kanto-story-v49.test.cjs` — passou.
- `node tests/kanto-tutorial-collision-v68.cjs` — passou.
- `node --check` nos quatro módulos JavaScript alterados — passou.
- `git diff --check` — passou.
- `scripts/qa/kanto-atlas-v3-browser.cjs` em Chromium — passou: 38 nós, objetivo e habitat, conexão ao controlador de produção, caminhada sem teleporte até a saída da Rota 1, diálogo de chegada, seleção por toque e layouts 1440×900, 390×844 e 844×390. Sem exceções JavaScript.
- No teste mobile, o botão “Abrir localidade” foi levado ao trecho visível pelo scroll do painel; não há overflow horizontal nos indicadores.
- Inspeção visual real realizada nas capturas desktop, mobile retrato e mobile landscape e no MP4. O vídeo contém o Atlas, seleção de habitat, uso do controlador real, percurso até Viridian e diálogo real de chegada.

## Evidências locais

Artefatos gerados fora do repositório para revisão:

- Antes: `/workspace/visual-overhaul-v3-artifacts/atlas-before-desktop.png`.
- Depois: `/workspace/visual-overhaul-v3-artifacts/atlas-v3-desktop-compare.png`.
- Zoom: `/workspace/visual-overhaul-v3-artifacts/atlas-v3-desktop-zoom.png`.
- Mobile: `atlas-v3-mobilePortrait-route1.png`, `atlas-v3-mobilePortrait-route1-actions.png`, `atlas-v3-mobileLandscape-route1.png` e `atlas-v3-mobileLandscape-route1-actions.png` no mesmo diretório.
- Vídeo MP4: `/workspace/visual-overhaul-v3-artifacts/atlas-v3-auto-route.mp4`.
- Relatório automatizado: `/workspace/visual-overhaul-v3-artifacts/atlas-v3-browser-report.json`.

## Limites e continuação

- A validação visual foi feita em Chromium com perfis temporários e nos três viewports listados; não foi feita em aparelhos físicos.
- O servidor local exibiu respostas 404 preexistentes para alguns recursos externos ao Atlas e para `/api/config`; não houve exceções no navegador, e esses recursos não fazem parte deste checkpoint.
- Lotes B, C e D — tutorial e apresentação adicional, drops/engenheiro e gruta/tesouros — ainda não foram implementados neste branch.
- Esta etapa não foi integrada à Main e não foi publicada.
