# Checkpoint — NPCs e relacionamentos de Pallet

Objetivo: integrar NPCs com retratos e animações, histórias e serviços, amizade, romance entre adultos elegíveis, convivência e progresso isolado no save do personagem; validar no runtime antes de um único Preview.

Base: `b6126f20e79b1ed8b02f32ca49f911cc94d30b34`; branch `feature/pallet-npc-relationships-v1`.

Em retomada posterior, `origin/main` foi buscada e estava em `e221a360c302b92bfda0a0e6b557b8fb033a1463`; incorporada sem conflitos no merge `bb27cde65f795a3d53d6d01a449710905644c91f`. Ela ativa a Pallet 3Q por padrão e inclui correções do treinador. Nenhuma arte ou colisão foi revertida.

Geometria verificada no código atual: mapas Anime 3Q usam 1200 × 675 unidades lógicas, raio de colisão do jogador 11, `characterScale` padrão 1,56 e altura atual de NPCs entre 40 e 52 unidades; a câmera usa zoom variável por viewport e DPR limitado a 2. A comparação visual entre NPC e treinador ainda não foi realizada.

## Estado atual

- Sprites propostos e um atlas de expressões do pescador existem em `assets/kanto/npcs/pallet-new/`, ainda sem integração ou validação no runtime.
- `docs/pallet-relacionamentos-v1.md` contém rascunhos de conteúdo, não funcionalidades.
- Nenhum sistema de relacionamento, rotina, romance ou loja do pescador está implementado.
- Integração inicial em desenvolvimento: Nina no Centro, Tomi nos Jardins, Maia no Laboratório, Abel e Caio na Costa, Breno nas Colinas e Lúcia na Casa Leste, com falas simples; NPCs preexistentes preservados. Escala ajustada após captura visual indicar NPC excessivamente grande em interior. Ainda faltam comparação visual após ajuste, diálogos verificados, demais moradores, animações reais e testes completos das posições.
- Quatro sprites de moradores foram recortados de uma versão editada para remover a névoa. A folha foi inspecionada visualmente; os PNGs individuais ainda precisam de revisão sobre fundos claros e escuros e comparação com os originais antes da integração.
- O carregamento usa `Object.assign(P, ...)` em quatro pontos de `core/legacy-runtime.js`; campos ausentes em saves antigos podem manter dados em memória. É necessário validar troca de personagens antes de persistir relacionamentos.
- `node --check core/kanto-world-v2.js` e `node tests/kanto-pallet-npcs-v1.cjs` passaram. Chromium headless abriu Centro e Casa Leste; capturas iniciais mostram problemas de escala que motivaram ajuste posterior ainda não verificado. Não houve Preview final.
- Em continuação, capturas do Chromium desktop após o ajuste mostram Nina no Centro e Lúcia na Casa Leste com tamanho próximo ao treinador. Detectou-se sombra duplicada e deslocada; o renderer foi ajustado para usar a sombra embutida dos sprites novos e deslocar sua base. Verificação visual desse último ajuste ainda pendente. A verificação de sintaxe e o teste `kanto-pallet-npcs-v1.cjs` passaram após a mudança.

## Próxima ação

Verificar visualmente as sombras após o ajuste e conferir cada posição e diálogo no runtime, incluindo as outras quatro áreas e viewport Android. Revisar PNGs domésticos sobre fundos claros e escuros e preparar atlas e animações. Projetar e testar isolamento dos relacionamentos antes de persistir dados.

Nenhum recurso Goals foi encontrado na lista de ferramentas disponível.
