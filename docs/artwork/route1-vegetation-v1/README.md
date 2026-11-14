# Rota 1: Protótipo de Vegetação Animada (Carvalho do Mirante / Gazebo Oak)

- **Arte original da Rota 1 (intacta):** `assets/story/route-1-artist-v2.webp` (`1400×700`, proporção `2:1`, SHA-256: `87a68deeb1b88a8a1b3292d67523aeb1ba828c60ee687cffa08131c1b2898281`).
- **Elemento visual selecionado (Etapa B):** Carvalho Central do Mirante (`gazebo-oak`), localizado imediatamente à esquerda do mirante de telhado vermelho e da lanterna central da Rota 1:
  - Recorte na arte `1400×700`: `x = 392..548`, `y = 136..344` (`156×208` px).
  - Coordenadas mundiais da Rota 1 (`900×450`): base ancorada em `(302.14, 221.14)`, dimensões `(100.29 × 133.71)`.
- **Camadas modulares geradas (`tools/build_route1_tree_layers.py`):**
  - `assets/story/route1/trees/gazebo-oak-source.png` (`156×208`, referência exata do recorte, SHA-256: `94e5e1e48a5e4ca68dde4dcdf14bafd347084341e66d762cbe05ee74dc6117df`).
  - `assets/story/route1/trees/gazebo-oak-structure.png` (`156×208`, `87 KB`, camada estática com preenchimento suave apenas sob os 7 grupos móveis e `0` alteração fora das máscaras de folhagem, SHA-256: `a501ce508fbe2cb4a27696bd6172a5af1a52b9926c00da2dbc42aba415a35d91`).
  - `assets/story/route1/trees/gazebo-oak-foliage-atlas.png` (`156×1456`, `16 KB`, 7 grupos de folhas empilhados verticalmente com fases independentes, SHA-256: `8910f8d7188205ad4d39d32bfd150d7a5944eb7d48b23090e032fa7050204f1d`).
- **Recomposição em repouso (`dx=0, dy=0`):** `0` pixels de diferença (idêntica byte a byte ao recorte original).
- **Otimização Android (`core/kanto-route1-vegetation-v1.js`):** 8 chamadas `ctx.drawImage` por quadro, zero `canvas` temporários em tempo de execução, zero leitura de pixels (`getImageData`), suporte completo a `prefers-reduced-motion: reduce`.
- **Evidências visuais nesta pasta:**
  - `route1-gazebo-oak-demo-v1.mp4`: vídeo comparativo de `12.0s` (`30 fps`, `1280×720`, H.264, SHA-256: `d85d6cbc64c25401e4a066003ed2222fadd79afa425960f77fe8649a4bd90eb3`) demonstrando lado a lado o elemento **PARADO** vs **ANIMADO** no cenário da Rota 1 e em zoom `2×`.
  - `route1-gazebo-oak-comparison.png`: prancha comparativa em 4 painéis (Original Estático, 7 Grupos de Folhagem, Estrutura Fixa Underlay e Mapa de Área Ativa comprovando tronco/cerca/mirante imóveis).
  - `runtime-route1-desktop.png` e `runtime-route1-mobile-emulated.png`: capturas reais do renderer `PsyKantoWorldV2` no Chromium (`1280×720` e `412×915`).
- **Validação automatizada:** `node tests/kanto-route1-vegetation-v1.cjs` e fixture de navegador `tests/kanto-route1-vegetation-preview-v1.html`.
