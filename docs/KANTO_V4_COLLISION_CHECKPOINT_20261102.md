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
