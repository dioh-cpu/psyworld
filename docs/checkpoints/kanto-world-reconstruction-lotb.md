# Kanto world reconstruction — checkpoint

- **Lote:** B — Rota 2 e Floresta de Viridian.
- **Base:** `bc913e7930cfb172761e0f777e28685b80fe237b`.
- **Correções:** máscara caminhável estreita alinhada às trilhas desenhadas; troncos, cercas, rochas, água e barrancos bloqueiam; somente a ponte cruza o rio. Raio físico de 11 px aplicado às duas localidades no movimento manual e Auto Route. NPCs, lanternas e Hobbies posicionados em áreas alcançáveis. Missão da mochila e recompensas mantidas.
- **Validação:** `node tests/kanto-world-reconstruction-lotb.cjs`; `node tests/kanto-route2-forest-v1.cjs`; `node tests/kanto-v4-paths.cjs`; `node tests/kanto-world-quality-v4.cjs`; `node --check` nos quatro arquivos JS alterados. Chromium: touch mobile retrato, barreira na Rota 2, água/barranco e ponte na Floresta, Auto Route/transições Rota 2 ↔ Floresta → Pewter, desktop e landscape.
- **Publicação:** integrada à `main` no commit `46c2e108d1bd512390719131e5b900d3cfdbe622`; Vercel `READY` em `https://psyworld-murex.vercel.app`.
- **Próximo:** Lote C — Pewter City e Rota 3. Não iniciado.
