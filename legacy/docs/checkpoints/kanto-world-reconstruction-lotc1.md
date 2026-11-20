# Kanto world reconstruction — checkpoint

- **Lote:** C1 — Pewter City; Rota 3 não iniciada.
- **Base:** `46fce3abfd9badd8ed4a4c979e807cc1c3792134`.
- **Correções:** avenida principal aberta em três faixas alinhadas à pista; máscara sul mantida nos passeios e acessos já desenhados. Edifícios, jardins e limites continuam sólidos. Colisão física de 11 px aplicada à cidade e aos interiores; versão do script atualizada para invalidar cache.
- **Validação:** `node tests/kanto-pewter-v4.cjs`; `node tests/kanto-route3-v1.cjs`; `node --check core/kanto-pewter-v4.js`. Chromium: Floresta → Pewter, caminhada touch, fachada do ginásio bloqueada, seis portas/interiores ida e volta, posição salva/recarregada, Pewter → Floresta, saída bloqueada sem insígnia e aberta com insígnia, desktop e landscape.
- **Publicação:** `main` no commit `11089cf02f9991216cbbf129441bee3fcf0d387c`; Vercel `READY` em `https://psyworld-murex.vercel.app`; smoke test Chromium passou.
- **Próximo:** C2 — Rota 3.
