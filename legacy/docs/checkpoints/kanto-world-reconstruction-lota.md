# Kanto world reconstruction — checkpoint

- **Lote:** A — Pallet Town, Rota 1 e Viridian City. Lote B não iniciado.
- **Base:** `3a808fdf4dc07c31ebbaa434f9c9d3898d7353dc`.
- **Auditoria:** mapas e arte aprovados; os três tinham o raio de colisão limitado a 7 px. Rota 1 também tinha água cobrindo a ponte, e a entrada da Gruta estava deslocada da arte.
- **Correções:** colisão agora considera o raio completo de 11 px; limite da água reposicionado abaixo da ponte; abordagem da Gruta alinhada ao acesso visível junto ao campo de grama. Sem redesenho dos assets.
- **Validação:** teste novo `tests/kanto-world-reconstruction-lota.cjs`; regressões `kanto-v4-paths`, `kanto-viridian-v1`, `kanto-world-quality-v4`; Chromium: Pallet → Rota 1 → Viridian a pé, laboratório/interior, ponte/água, Gruta, fonte sólida, touch retrato e render landscape.
- **Próximo:** Lote B — Rota 2 e Floresta de Viridian; repetir a inspeção da geometria somente nesses mapas.
