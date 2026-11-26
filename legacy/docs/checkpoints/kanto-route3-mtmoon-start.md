# Checkpoint Kanto · Rota 3 e Monte Lua

- Base confirmada da `main` antes do lote: `ba6c5b601829386889b12988a7b32d7d557de97e`.
- Branch local: `campaign/kanto-route3-mtmoon-v1`.
- Commit local do lote Monte Lua: HEAD da branch `campaign/kanto-route3-mtmoon-v1`.
- Commit publicado na `main`: `2465edeaa103564a85f9426ddce155ffe587c446`. Vercel `READY`; smoke test de produção em Chromium aprovado.

## Entrega Monte Lua

- Reutiliza a arte aprovada `assets/kanto/approved/mt-moon-approved.webp` e o idle de pesquisador existente; Rocket usa `assets/story/rocket-grunt.png`.
- Mapa jogável 32×32 com quatro galerias conectadas, colisões de água/rocha, degraus, câmara de fósseis, entrada/retorno pela Rota 3, saída desbloqueada para Rota 4, dois guardas Rocket e os 11 spots de Hobby existentes em pisos acessíveis.
- Missão persistente: conversar com Miguel → examinar rastros → vencer recruta → vencer agente → liberar saída. Fuga/derrota não avança a história nem concede recompensa. Auto Route continua após vitória e para após fuga; pode ser retomado perto do Rocket.
- Cadência WALK/IDLE, movimento contínuo e câmera da V4 são reutilizados; partículas luminosas sutis são desenhadas no loop atual. Nenhuma moeda, item ou tabela de recompensa foi alterada. O enigma do painel dos fósseis continua no sistema atual do Atlas.
- Rota 4 continua como protótipo existente; só a conexão/desbloqueio foi validada, sem iniciar o próximo lote.

## Testes

- Sintaxe dos módulos e script de browser; `git diff --check`.
- `tests/kanto-mt-moon-v1.cjs`, `tests/hobbies-spot-effects-v1.cjs`, `tests/kanto-route3-v1.cjs`, `tests/kanto-route2-forest-v1.cjs`, `tests/kanto-world-quality-v4.cjs`, `tests/kanto-pewter-v4.cjs`.
- Chromium: jornada Rota 3 → Monte Lua, retorno pela entrada, objetivo via Auto Route, fuga sem progresso, vitórias nos dois combates, save/reload e saída para Rota 4; desktop 1280×800, retrato 390×844 e landscape 844×390; sem erros de página.
- Capturas para inspeção: `/workspace/artifacts/kanto-mt-moon/cave-entry.png` e `fossil-gallery.png`; resultados do Chromium em `results.json` fora do repositório.

## Próxima ação

Próximo lote: Rota 4, em branch própria a partir da `main` publicada. Não foi iniciado nesta execução.
