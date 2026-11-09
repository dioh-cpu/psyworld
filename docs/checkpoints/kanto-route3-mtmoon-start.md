# Kanto · Checkpoint Route 3

- Base da `main`: `bc4e21933949a60bc6e35c186579ff2f5a62043b`.
- Branch: `campaign/kanto-route3-mtmoon-v1`.
- Implementação: `5604c0f047a38c9e8be6ba9badfcd8de419248c9`.
- Estado: Rota 3 concluída e validada localmente; publicação pendente.

Concluído: mapa autoral `assets/story/kanto-route-3-v1.webp`; trilha/colisões alinhadas, entrada de Pewter e saída para Monte Lua; sete spots existentes reposicionados; Davi usa idle aprovado; rota usa câmera, WALK/IDLE e movimento contínuo da V4, com ambiente leve. Corrigido o Auto Route para avançar após falar com NPCs. Não houve alteração de Monte Lua.

Validação: `tests/kanto-route3-v1.cjs`, `tests/kanto-route2-forest-v1.cjs`, `tests/kanto-world-quality-v4.cjs`, `tests/kanto-pewter-v4.cjs`; verificações de sintaxe e `git diff --check`. Chromium desktop `1280×800` e retrato `390×844`: Pewter→Rota 3, Auto Route a Davi, transição leste, retomada da posição e encontro real (Pidgey nível 7); zero erros de página.

Arquivos: arte da Rota 3; `core/kanto-early-chapters-v1.js`, `core/kanto-campaign-playable-v1.js`, `core/kanto-pewter-v4.js`, `core/hobbies-v2.js`, `index.html`; testes `kanto-route3-v1.cjs` e atualização de `kanto-route2-forest-v1.cjs`; script `scripts/qa/kanto-route3-browser.cjs`.

Pendências: nenhuma conhecida na Rota 3. Próximo lote é Monte Lua, em branch nova a partir da `main` atualizada.
