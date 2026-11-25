# Testes

- `node confusion/web/mundo/mundo.test.mjs`: 74 testes dos 50 sistemas (regras puras, sem navegador).
- `node tests/e2e/regiao1.e2e.mjs [filtro]`: 11 testes de navegador da Região 1 (Chromium via Playwright; sobe um servidor local sozinho).
- `python3 tools/auditar_colisao_regiao1.py DADOS.json`: confere se saídas, NPCs, pistas, monstros e chefes estão alcançáveis nos 48 mapas.
- `python3 tools/validar_artes_mundo.py`: confere as artes entregues contra o catálogo.
- `node tools/simular_mundo.mjs 365 20`: simula o mundo para balanceamento.
