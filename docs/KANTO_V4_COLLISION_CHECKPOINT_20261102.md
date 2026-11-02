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
