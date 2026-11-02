# PSYWORLD — Checkpoint Kanto V4 (02/11/2026)

Escopo: SOMENTE branch `teste/kanto-pallet-rota1-v2`. A branch `main` e o domínio público não foram alterados.

## Corrigido
- Pallet e Rota 1 usam as artes WebP aprovadas, com colisões autoradas por polígonos largos de ruas, praças, escadas e quatro gramados de caça.
- Construções, canteiros, água, estátua e cercas são sólidos. O personagem não deve atravessá-los.
- Camada V4 carregada após `kanto-map-data-v2.js` e antes de `kanto-world-v2.js`.
- Eliminados os textos de debug de build/preview e a indicação textual de expressão do NPC.
- Removido o NPC de Carvalho do cenário externo; ele está no interior do laboratório com retrato e diálogo. A missão só marca Carvalho após conversar.
- Passo de movimento, controle móvel e célula de navegação ajustados.
- `tests/kanto-v4-paths.cjs` valida alcançabilidade de saídas, seis portas, NPCs e quatro gramados, além de barreiras.

## Ainda precisa verificar antes de publicar em produção
- Teste real em diferentes smartphones de movimentação por toque e controle direcional.
- Posicionamento das portas em relação às fachadas pintadas na arte.
- Fluxo completo de interiores, cura no Centro Pokémon, compras no Market, Carvalho, guarda, Rota 1 e Viridian.
- Autoridade online para as missões e níveis de batalha.
- NUNCA fazer merge em `main` sem aprovação explícita do usuário.

## Referência pública protegida
- `main` = `53507faf696d56b78ff336f422ea835c9fa34864` quando esta versão de testes foi criada.

## 2026-11-02 — V5: spritesheets e movimento
- Correção exclusivamente em `core/kanto-world-v2.js` (branch de testes); `main` inalterada.
- Todos os frames do treinador são normalizados visualmente para 33×46 unidades na renderização, com pés ancorados ao solo.
- Bounding boxes de cada spritesheet são obtidos em uma única amostra reduzida de 384×384 ao carregar a imagem. Não usar `getImageData` nem recortar canvas a cada passo.
- Reduzida a resolução interna do canvas para DPR máximo 1,3 e limitada a frequência de redesenho no celular, mantendo atualização de movimento a cada requestAnimationFrame.
- Tamanho e posição do canvas medidos novamente somente quando a janela ou visual viewport muda.
- Touch-to-move utiliza busca de caminho A* assíncrona, em fatias de até 160 nós por quadro, memoização das colisões e cancelamento de rotas antigas.
- Verificações realizadas por execução isolada de funções: 16 frames normalizados em uma leitura de pixels, 20 desenhos de posições distintas com dimensão constante 33×46, rota atravessável no A*.
- Publicar apenas como preview de `teste/kanto-pallet-rota1-v2`. NÃO mexer no projeto público sem autorização.

### Validação pendente
- Testar no aparelho Android movimentos prolongados, toque no destino, joystick e entrada/saída de edifícios.
- Validar visualmente os 30 modelos de personagens sob diferentes trajes e efeitos de animação.
- Corrigir qualquer animação fonte que tenha frames cortados ou inconsistentes, caso identificado.

## Correção posterior — renderização de sprites e movimentação no Android
- O vídeo do usuário de 02/11/2026 mostrou que a V5 não resolveu completamente a lentidão e a oscilação visual.
- Causa adicional: a referência de `index.html` ainda usava o identificador de cache V4, podendo preservar código antigo no navegador móvel.
- Os 16 frames da spritesheet de treinador (origem 2048×2048) são pré-renderizados apenas uma vez para um atlas leve 192×256. A animação utiliza células uniformes 48×64, com corpo desenhado 33×46 e pés estáveis.
- A arte do mapa é rasterizada uma vez para as dimensões do mundo e o desenho copia apenas o retângulo visível da câmera.
- Seleção de texto, menu de contexto e arrasto nativo do navegador foram desabilitados SOMENTE no modo Kanto para impedir que o toque prolongado interrompa o joystick.
- Joystick ativa com deslocamento menor e responde mais diretamente ao gesto.
- Delta do movimento pode acompanhar até 120ms entre quadros para não causar câmera lenta quando o celular perde FPS. Busca A* agora processa 75 nós por quadro, mantendo a renderização responsiva.
- O teste `tests/kanto-v6-sprites-movement.cjs` verifica tamanho/posição fixa em 24 desenhos, leitura de alfa só uma vez, cache do atlas e deslocamento equivalente a 60/15/10 FPS.
- Sempre publicar com uma nova chave de cache no `index.html` da branch de TESTES.
- Não houve modificações na branch pública `main`.

### Lacunas que ainda exigem validação no aparelho
- Experiência real no dispositivo Android específico, incluindo responsividade sob jank de CPU e navegação até portas.
- Fidelidade de todos os trajes/fantasias e posicionamento do avatar com personagens de proporções diferentes.
- Eventual ajuste fino do FPS, qualidade do desenho e velocidade conforme testes reais.
