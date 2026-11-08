# Lote D — Gruta dos Cristais e caça a tesouros

Checkpoint criado em 2026-11-08 para continuar a implementação sem depender do histórico do chat.

## Base e isolamento

- Branch local: `visual/psyworld-atlas-world-v3-lotd`.
- Commit-base: `295ded5cffc9186e69be66f58a8ebc5a901851e8` (`docs(world): record lot C production release`).
- No início e no fechamento da validação, `origin/main` apontava para o mesmo SHA da base.
- Nenhum push, merge, deploy ou migração remota foi executado.

## Implementação

- Nova arte pixel-art da Gruta dos Cristais em `assets/kanto/caves/crystal-grotto-v1.webp` (900×675, SHA-256 `824fc7f51ecb69059ac426c622f5bebbb354153a047d130be0e384e2882770be`). O mapa de campanha usa a imagem como ambiente; trilhos e carrinhos são desenhados pelo controlador com os spots de mineração/tesouro.
- Novos spots de rachadura na Rota 1 e três pontos na gruta. O Caçador de Tesouros exige nível 3 de Treinador e completa uma escavação após cinco ações de impacto; áreas entram em cooldown. A habilidade Trilha Revelada revela o segundo spot da Rota 1.
- O Hobby Looter é liberado pelo primeiro baú aberto. Baús concedem XP de Hobby e recompensas por raridade. Looter nível 10 libera Treasure Roll por 10 diamantes, com prêmio de pedras, pacotes de cards, décimos de PsyCoin ou o traje Caçador de Recompensas. Títulos progridem por 10, 100, 1.000 e 5.000 escavações; nível 30 é marco, o limite permanece 100.
- Aura/capa do traje e animação de mineração reaproveitam o controlador temporal de Hobbies e a renderização existente. Não foi criado outro loop de animação. A curva de XP local e online usa `ceil(100 × nível^1.55)`.
- A seleção de encontros da gruta inclui Sandshrew, Diglett, Zubat, Geodude, Onix e Cubone por ID; a integração usa os gatilhos de deslocamento existentes e preserva as colisões. O conteúdo de outras cenas não foi alterado.
- Recompensas de tesouro e Treasure Roll têm RPC de serviço com idempotência. O traje aplica +10% Gold/XP de batalha, +10 pontos de Drop e +10% de Gold de Hobby. A rotina existente de batalha é preservada com esses bônus adicionais.

## Validação feita

- Testes de Hobby: `node tests/treasure-hunt-v1.cjs`, `node tests/hobbies-unified-v2.cjs`, `node tests/hobbies-spot-effects-v1.cjs` — passaram; inclui impactos a 30/60/120 FPS, cinco hits, uma recompensa, cooldown, loot/chest, XP, authority merge simulado, níveis, habilidades e roll.
- Regressões Kanto: `kanto-v10-rooms.cjs`, `kanto-story-v49.test.cjs`, `kanto-atlas-v3.test.cjs`, `kanto-v6-sprites-movement.cjs`, `kanto-campaign-menu-v65.cjs`, `kanto-gym-hobbies-v70.cjs`, `kanto-interiors-v9.cjs`, `kanto-tutorial-collision-v68.cjs`, `kanto-v4-paths.cjs`, `trainer-walk-v7.cjs` — passaram.
- Chromium headless, viewport desktop 1280×720 e perfil offline descartável: cinco interações concluíram uma escavação; baú elevou Looter ao nível 1 e deu 60 XP; roll nível 10 cobrou 10 diamantes e concedeu traje no ramo determinístico; caminhar acionou Sandshrew (ID 27, Terra) da tabela da gruta; 59–60 FPS, p95 ~16,8 ms, heap reportado ~7,6–8,1 MB, zero erros de página.
- Vídeo real de 13,8 s foi gravado com os módulos carregados pelo jogo: `/dev/shm/psyworld-crystal-grotto-qa/crystal-grotto-treasure-hunt-v1-demo.mp4`. Capturas e JSON de QA estão na mesma pasta temporária.
- Sintaxe dos JavaScript alterados e `git diff --check` passaram.

## Limitações

- O SQL de autoridade foi revisado e há fixtures de smoke test (`tests/treasure-hunt-v1-db-*.sql`), mas não foi executado no PostgreSQL: o overlay do ambiente está sem espaço. Uma tentativa de criar um PostgreSQL descartável em tmpfs foi impedida antes de iniciar pelo Docker (`no space left on device`). Não aplicar a migração em produção até executar os fixtures numa cópia local/CI com espaço.
- A validação de navegador usou perfil offline isolado; a autoridade online foi testada pelo contrato do cliente com uma resposta mockada. Não houve teste contra Supabase local/remoto.
- O commit local e o patch portátil carregam `Base-Commit: 295ded5cffc9186e69be66f58a8ebc5a901851e8`; a integração continua pendente de revisão.
