# PSYWORLD — Atlas & World Experience V3, lote C

Data: 2026-11-08
Branch isolada: `animation/hobbies-vfx-studio-v1`
Base original do lote C: `77bdd4437e9c6d1d4448d727f78cb582d9a79a6d`
Base após atualizar a branch com a Main: `e6b9b9ed39e2770b02638ac80a1e38ffa7192617` (lote B, já publicado)
Produção Vercel do lote B: `https://psyworld-world-of-monsters.vercel.app`

## Escopo concluído nesta branch

- Recompensas de batalha do mundo principal passam a derivar o tipo do Pokémon no servidor pelo `species_id`. O cliente não pode escolher um tipo para forçar drops.
- Tabela de materiais por tipo: material comum garantido, quantidade escalada de 1 a 10 pelo atributo Drop; material incomum de 30% a 50%; pedra compatível de 1% a 10%. Os modos Idle, Survivor, Cards e aventura mantêm suas tabelas isoladas.
- Exemplo validado: Pidgey usa a tabela Voador (Straw, Feather e Flying Stone quando a rolagem de pedra acerta), sem pedras de Bug, Dark, Fairy, Dragon ou Fighting. Rattata usa Rubber Ball, Giant Piece Of Fur e Heart Stone, com a pedra começando em 1% sem bônus.
- O Engenheiro pode avançar além da última Ball, até o teto de 100, com requisitos progressivos de material comum, incomum, pedra compatível, XP, vitórias e capturas por tipo. Receitas e tiers existentes permanecem.
- Toque/clique em um spot move o treinador pelo caminho com colisões existentes; ao alcançar o alcance, a interação de produção começa. Movimento por teclado, joystick e Auto Route cancela a aproximação pendente.
- Recompensa online é concedida por RPC idempotente, evitando duplicação entre runtime local e autoridade da conta. A função SQL preparada valida modo, tipo, espécie, montante e papel de execução.
- Reutilizados o controlador e VFX de Hobbies, sprites dos recursos e pacote aprovado de 16 ferramentas transparentes. Não foram adicionadas artes temporárias ou SVG.

## Arquivos alterados

`api/game.js`, `api/_lib/pokemon-types-v1.js`, `core/battle-loot-rules-v1.js`, `core/hobbies-v2.js`, `core/kanto-world-v2.js`, `core/legacy-runtime.js`, `core/online-authority-v26.js`, `core/shared-mode-drops-v1.js`, `index.html`, `supabase/migrations/20261108045938_campaign_species_battle_loot_v1.sql`, `scripts/qa/hobbies-vfx-studio-v1.cjs`, `tests/battle-loot-rules-v1.test.cjs`, `tests/hobbies-unified-v2.cjs`, `tests/hobbies-ux-v3.cjs`, `tests/kanto-campaign-menu-v65.cjs` e `tests/idle-loot-routing.cjs`.

## Verificação

Passaram:

- `node tests/battle-loot-rules-v1.test.cjs`
- `node tests/idle-loot-routing.cjs`
- `node tests/hobbies-unified-v2.cjs`
- `node tests/hobbies-ux-v3.cjs`
- `node tests/hobbies-mastery-campaign-v1.cjs`
- `node tests/hobbies-spot-effects-v1.cjs`
- `node tests/campaign-vip-gate-v3.test.cjs`, `node tests/kanto-campaign-menu-v65.cjs`, `node tests/essential-guide-v56.test.cjs`, `node tests/kanto-tutorial-collision-v68.cjs`, `node tests/kanto-atlas-v3.test.cjs`, `node tests/kanto-story-v49.test.cjs`.
- `node --check` em `api/game.js`, `api/_lib/pokemon-types-v1.js`, `core/battle-loot-rules-v1.js`, `core/shared-mode-drops-v1.js`, `core/online-authority-v26.js` e `core/kanto-world-v2.js`.
- QA real em Chromium: coleta de flor, cinco golpes na árvore e minério, interação por clique remoto com caminho navegável e minigame real de pesca; inventário e salvamento/restauração verificados. Desktop, mobile retrato e mobile paisagem mantiveram 60 FPS; as regras tipadas carregaram em todos os três viewports; sem erros de página. p95 de frame foi 16,8 ms em mobile; heap ~7,6–7,7 MB mobile e 8,9 MB desktop. Trata-se de emulação Chromium, não aparelho físico.
- Gravação real de 20 s: `/workspace/psyworld-lotc-browser-validation-v6/hobbies-vfx-studio-v1-demo.mp4` (2.861.864 bytes); screenshots e `browser-report.json` ficam na mesma pasta.
- Antes da integração, a migration foi executada em PostgreSQL Docker descartável: Pidgey/Rattata, Gold, idempotência do recibo/ledger e permissões do `service_role` passaram. Depois da aprovação explícita do usuário, a migration `20261108045938_campaign_species_battle_loot_v1` foi aplicada ao Supabase de produção e verificada: o RPC existe, usa `search_path=public`, e somente `service_role` pode executá-lo.
- Patch portátil gerado a partir da Main `e6b9b9ed39e2770b02638ac80a1e38ffa7192617`; `git apply --check` passou em um worktree limpo, o patch foi aplicado e a mesma bateria acima passou nesse checkout.
- `git diff --check` passou.

## Dependências e limitações

- A migration de produção e o código foram publicados. O RPC está pronto e as recompensas novas estão ativas na aplicação publicada.
- A tabela genérica replica o padrão de loot por tipo que já é usado pelo projeto e as referências conferidas para Pidgey/Rattata; exceções únicas por espécie além do tipo ainda precisam de auditoria individual antes de afirmar cobertura enciclopédica de todos os drops PXG.
- Incidente anterior no endpoint `/api/game`: `psy_campaign_hourly_heartbeat` ausente no Supabase desde 2026-08-26. A rota atual apenas registra o erro e segue para a recompensa; não é corrigida por este lote.

## Testes herdados

- A checagem `tests/human-animation-v2.test.cjs` possui uma expectativa histórica de hash para `core/legacy-runtime.js` que não corresponde ao baseline atual. O checkpoint anterior documenta a mesma divergência num worktree limpo da Main. Não executar atualização automática do hash; comparar o comportamento e o arquivo em um baseline limpo. Este lote modifica runtime somente para impedir Gold duplicado na recompensa online.
- A antiga falha de Mastery exigia que compras de habilidades estivessem abertas antes de os efeitos dos spots existirem. A Main atualizada inclui a salvaguarda; `tests/hobbies-mastery-campaign-v1.cjs` passou.

## Estado de integração e publicação

- O commit B `e6b9b9ed39e2770b02638ac80a1e38ffa7192617` foi incorporado à branch C por rebase sobre a Main remota. Os conflitos foram resolvidos preservando a tela VIP de B e o cancelamento de aproximação/rota de spots de C.
- Commit do lote C: `ce1c799c7ce49706ffd283cfd83b05c2c3c2016f` (`feat(world): add species-typed battle drops and hobby access`), baseado em B.
- O commit C foi enviado por fast-forward à `main`; na última conferência, `origin/main` e a branch local apontavam para o mesmo SHA. Não houve force push.
- Migration Supabase `20261108045938_campaign_species_battle_loot_v1` aplicada. O RPC `psy_v27_battle_reward` está limitado a `service_role`; `public`, `anon` e `authenticated` não têm permissão de execução. A migration não alterou linhas de jogadores.
- Deploy Vercel de produção `dpl_nsyPNvd2KALz2MuANR7iLuncxk1m` ficou `READY`, associado ao SHA C. Smoke checks: página inicial 200, módulo `core/battle-loot-rules-v1.js` 200 com MIME JavaScript e `/api/game` sem sessão 401 `AUTH_REQUIRED`, como esperado.
- Os logs de produção ainda mostram `PGRST202` para a RPC preexistente `psy_campaign_hourly_heartbeat`, observada desde 2026-08-26; o endpoint registra esse erro e segue. Também há um aviso de depreciação Node `url.parse()`. Nenhum dos dois foi introduzido por C.
- URL de produção: `https://psyworld-world-of-monsters.vercel.app`.
