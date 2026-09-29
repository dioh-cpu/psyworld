# Idle commerce checkpoint — 2026-09-29

## Publicação de produção — 2026-09-29

- Corrigida e publicada a proteção contra venda de Pokémon do time: a loja lista apenas Pokémon do Box; venda individual e em lote revalidam a chave estável contra o Box atual; Pokémon em uso na batalha não podem ser vendidos; a sprite da batalha é reconciliada após a venda.
- A branch `main` foi publicada no commit `6952f7b4c6e96b150a99744192b50f5a5d8cd646`. Deployment de produção Vercel `dpl_cYak739sX8TABKrn26bYSc8iYUwv` chegou a `READY`, servindo o alias `https://psyworld-world-of-monsters.vercel.app/`; URL direta: `https://psyworld-ahrhj0ysd-world-of-monsters.vercel.app/`.
- A árvore publicada corresponde à árvore validada localmente. Nove suítes CJS passaram (venda, economia, ciclo de comércio, starter/HUD, isolamento de perfil, ciclo social, API de hunt, callback OAuth e mapas/níveis de hunt); também passaram `node --check` nos JavaScripts alterados e `git diff --check`.
- A proteção SSO da Vercel segue ativa. O link temporário de compartilhamento redirecionou para login no navegador sem sessão; portanto, o acesso anônimo ainda não foi confirmado. Não foi alterada a configuração SSO.
- O arquivo local `assets/audio/psyworld_theme.mp3`, que já estava modificado pelo usuário, foi preservado e excluído da publicação.

User scope: all online systems belong exclusively to Idle. Latest clarification: leave PSYWORLD exactly as it is; do not add online features to it and do not remove its existing modules. Never import PSYWORLD currency, items or Pokémon into Idle commerce. Market and auctions are categorized UI catalogs, not player maps.

## Team Pokémon sale bug — 2026-09-28

- The Pokémon sale screen now lists only Pokémon in the Idle Box. Team members and any Pokémon still referenced by the active battle are excluded.
- Individual and bulk sales recheck the latest Box by stable Pokémon key before removing anything, so a stale sale screen cannot remove a Pokémon that has since moved into the team.
- Opening the shop and completing a sale reconcile the battle sprite with the current team. If a prior erroneous sale left a stale battle reference, it switches to the current team member.
- Added tests/idle-pokemon-sale.cjs. It passed along with the economy guardrails, commerce lifecycle, starter/HUD tests, JavaScript syntax checks and git diff --check.
- Superseded by the production publication recorded at the top of this checkpoint (2026-09-29).

## Continuação atual — 2026-09-28

- O preview autenticado `psyworld-it7jhtkpm-world-of-monsters.vercel.app` (commit `cb96a779dfc4b450282f7efb8c61e7eb9d2d3741`) retornou ao jogo pelo callback isolado do Psy Idle, sem abrir o fluxo de Cloud Save do PSYWORLD. A Trade Zone social indicou `Online • ao vivo`; o Market carregou `500 Gold Idle · 0 PsyCoin negociáveis · 0 vinculados` e confirmou conta e inventário exclusivos do Idle.
- O teste real do navegador encontrou uma corrida de renderização: um evento de presença podia chegar depois que os elementos do contador/lista da Trade Zone fossem removidos. Corrigido com uma checagem dos dois elementos antes de atualizar a tela.
- No preview `psyworld-96goijvpg-world-of-monsters.vercel.app` (commit `1dd0047f415fcef0e8201dc38b3e4c533d4c9636`, `READY`), o callback voltou ao jogo sem acionar Cloud Save; a Trade Zone mostrou o treinador atual, e sair dela não produziu erros da aplicação no console. O Market autenticado mostrou `500 Gold Idle · 0 PsyCoin negociáveis · 0 vinculados` e conta/inventário exclusivos do Idle.
- Depois da correção, todos os testes `tests/*.cjs`, `node --check` dos modos alterados e `git diff --check` passaram.
- O teste real apenas abriu telas, autenticou pelo GitHub e leu saldo/presença/catálogo; não comprou, vendeu, criou anúncio, iniciou hunt nem carregou ou alterou save do PSYWORLD.

## Latest continuation — 2026-09-28 18:59 UTC

- Added server-authoritative Idle hunting and capture through `api/idle-hunt.js` and the service-only `public.idle_hunt` RPC. The API accepts the authenticated user, requested route, server ticket and owned Ball; reward values, route species, levels, rarity, drops and captured asset data come from the server. Idle account bootstrap grants its own 500 Gold, bound Bulbasaur and three bound Pokéballs. No PSYWORLD save, wallet or inventory is read or changed.
- The game client requests server tickets for online encounters, claims server victory when its local battle ends, and requests capture using the server ticket. The server enforces route unlocks, ticket lifetime, minimum encounter time, victory cooldown, server-computed rewards and one capture attempt per ticket. The client still signals when the local enemy is defeated; the server does not independently replay combat damage or battle state, so this is not full server-side battle simulation.
- Applied Supabase migrations `20260928180254_idle_hunt_authority_v1` and `20260928185923_idle_hunt_ticket_map_index` to `otwgavwvjxuwtgncjbiq`. Live checks found all 1,025 route maps, RLS on all five hunt tables, and `idle_hunt` executable only by `service_role`. A rolled-back live integration fixture passed all four groups, including Idle/PSYWORLD isolation, ticket timing, idempotent rewards and server-owned capture. The advisor's new foreign-key index finding was fixed by the second migration.
- Reconciled migration source history with Supabase: all 27 remote versions now have matching local source files under `supabase/migrations/`. The prior compact-numbered source files remain preserved under `supabase/migrations_legacy/` and are excluded from the active CLI migration chain.
- Validation passed: Idle hunt API (4 checks), commerce lifecycle (4), social lifecycle (7), Idle profile isolation (5), JavaScript syntax checks and `git diff --check`. Supabase advisors still report informational RLS-without-policy findings for service-owned tables and pre-existing warnings for unrelated RPCs, leaked-password protection and performance items; the new hunt foreign-key warning is gone.
- The code has not been pushed or deployed. Before players can use online hunts, deploy the API/game code and verify the authenticated end-to-end flow in a browser. Keep the combat-simulation limitation above visible in any release review.

## Recovered chat continuation audit — 2026-09-28

- Resumed the existing `commerce-market-auction-v2` checkout at `b2ead5b`. The local branch includes Idle profile and Trade Zone work; nothing from this continuation has been pushed or deployed.
- Re-ran the local commerce lifecycle suite: 4 checks passed. The social lifecycle suite passed 7 checks. The Idle profile isolation suite passed 5 checks, including byte-for-byte preservation of `psyWorldSave`. Changed JavaScript files passed `node --check`; `git diff --check` passed.
- The Supabase commerce SQL fixture previously passed all 8 transaction groups inside a rollback. No remote database mutation was performed during this continuation.
- The Supabase migration history also differs from this checkout: several commerce migrations have different version timestamps, and later Trade Zone migrations (`20260928143003`, `20260928143410`, `20260928144811`, `20260928145207`, `20260928145357`, and `20260928151206`) have no matching source files here. Reconcile the live history and source files before another migration or deployment.
- Production is still on the earlier `main`/PR #15 state; `/api/idle-commerce` is not deployed there. Do not enable commerce yet: local Idle hunts/captures and Gold are not delivered to the server-owned Idle account through an authoritative reward path. Do not trust client-submitted balances or import PSYWORLD data to fill that gap.
- The previous attempt to publish commit `1887eb2` was rejected by automatic approval review because it required explicit authorization to publish to `dioh-cpu/psyworld`. Do not retry publication until the user explicitly authorizes that external action.

## Latest recovery — 2026-09-28 12:38 UTC

- Idle now loads a separate `psy_idle_character_v1` local profile, with its own starter, team/box, inventory, Gold, PsyCoins and progress. It never reads or writes the PSYWORLD save or shared player economy.
- First entry opens Vila do Recomeço. Its Trade Zone button teleports to the social room; Market and Leilão are separate catalog buttons. In hunts, the same three destinations remain separate toolbar actions.
- Idle Pokémon created by the shared factory are re-normalized to Idle stats and receive Idle-only identities before being saved.
- Trade Zone uses private Supabase Realtime presence. Read and track permissions are scoped to `idle-trade-zone`; both policies were verified in the live database.
- Added recovery coverage for fresh and incomplete Idle profiles, including proof that loading/saving leaves `psyWorldSave` untouched.
- Commerce transaction backend remains server-owned. Local hunt rewards/captures are not yet synchronized to that server inventory; do not claim that local catches or Gold are currently listable online, and do not upload client-claimed balances as trusted rewards.
- The Trade Zone currently provides shared presence only. Its player action menu (private message, friend request, direct item trade and block) and the separate 1v1 PvP / four-player raid and event rooms are still outstanding.

Applied Supabase migration versions for Idle commerce and Trade Zone include:

- `20260928111403_idle_commerce_market_auction`
- `20260928111445_idle_commerce_empty_accounts`
- `20260928111624_idle_commerce_state_fix`
- `20260928114852_idle_commerce_expiry`
- `20260928120008_idle_commerce_expiry_guard_and_bid_history`
- `20260928122110_idle_trade_zone_presence`
- `20260928123800_idle_trade_zone_presence_track`

The game code has not been published or deployed; the additive presence migration is applied to Supabase. Browser verification remains unavailable in this environment; use the local tests and database policy query as the verified coverage.

Implemented on commerce-market-auction-v2:
- Isolated service-owned idle_accounts/assets/listings/ledger/receipts tables with RLS and restricted RPC grants.
- Authenticated API, atomic escrow, buy, bid, refund, cancel, expiry and idempotent receipts.
- Categories, search, pagination, sell form, confirmation, own listings, bids and history UI.
- Idle-specific session key; account-switch modal cleanup; no fallback to stale cached token after live session expires.
- Cron expiry every minute, up to 100 lots, same transaction lock as commerce. No seller or buyer needs to stay connected.
- SQL integration fixtures rolled back; seven transaction groups pass. Three UI lifecycle tests and seven chat lifecycle tests pass.

Applied Supabase migrations (project otwgavwvjxuwtgncjbiq):
20260928110246_commerce_market_auction.sql
20260928111428_idle_commerce_empty_accounts.sql
20260928111615_idle_commerce_state_fix.sql
20260928114829_idle_commerce_expiry.sql

Not production-ready; do not merge as completed:
- Market/auction transaction backend and categorized UI are implemented, but Idle local hunts still cannot supply assets or currency to the server-owned account. Add authoritative Idle earning/asset delivery before connecting these balances; do not import PSYWORLD data or trust client-claimed rewards.
- Do not modify PSYWORLD loaders/cloud/authority. User explicitly clarified to leave PSYWORLD unchanged.
- OAuth callback routing must be isolated from legacy global cloud handler.
- Need real-browser and authenticated deployed API verification. Existing lifecycle tests use test fixtures, not full browser tests.
- Preserve old PSYWORLD saves; the new Idle character starts independently and does not migrate the old shared Pokémon roster.

Production remains prior main chat fixes, not this commerce implementation.

## Historical follow-up (superseded by recovery above) — 2026-09-28 12:03 UTC
- User clarified: leave PSYWORLD exactly unchanged. Only implement online features in Idle.
- Market and auction share the same catalog layout; auction adds bids and optional buyout.
- Added migration 20260928115856_idle_commerce_expiry_guard_and_bid_history.sql (applied): reject expired target even when expiry backlog exceeds the batch; retain accepted bids; paginated participation history; remove account UUIDs from catalog output.
- API now uses idle_browse_commerce RPC for exact, paginated search and participation filters.
- UI persists request identity in sessionStorage across reloads after a lost response; handles account change during a mutation; validates bid input; focus remains in the modal.
- Validation: eight database integration groups pass with rolled-back test data, four commerce lifecycle tests pass, seven chat tests pass. Supabase advisors show no new warning-level findings for commerce; service-owned tables intentionally have no client policies.
- Browser verification blocked: no browser installed; agent-browser installer certificate error; bundled Playwright browser downloads returned invalid ZIPs. No visual verification claimed.
- Blocking product/data issue remains: the legacy Idle Pokémon roster shares P.team/P.box with PSYWORLD. Do not import the mixed roster or reset progress without agreeing migration treatment. Market accounts remain empty until the independent Idle inventory/progression integration is implemented.
- Prior GitHub push of 1887eb2 was rejected by automatic approval review; user has not explicitly answered the requested authorization. Do not retry or use another publication route to bypass it.


## Publicação pública e chat em tempo real — 2026-09-28

- O usuário autorizou remover a proteção SSO da Vercel e deixar o projeto público. Essa configuração ainda não foi alterada: o painel administrativo exige autenticação GitHub na sessão de navegador desta tarefa; handoff manual está pendente.
- Verificação read-only do Supabase `otwgavwvjxuwtgncjbiq`: as migrações `20260928225705_idle_guest_chat_sale_xp` e `20260928230428_idle_chat_dual_broadcast_compat` estão aplicadas; `psy_idle_chat_messages` tem RLS ativo e política SELECT para `anon`; o trigger `psy_idle_chat_broadcast_after_insert` envia evento `INSERT` em modo público e privado para manter compatibilidade com clientes atuais. A tabela de rate limit também tem RLS e acesso apenas pelo serviço.
- O cliente `modes/idle-social-v1.js` entra nos tópicos públicos `psyworld-idle-chat:<canal>`, marca `Online • ao vivo` quando inscrito, recarrega histórico ao conectar e atualiza ao receber `INSERT`; mensagens de visitante são gravadas pela API `/api/idle-chat` com rate limit e RPC de serviço.
- Passaram novamente `tests/idle-social-lifecycle.cjs`, `tests/idle-pokemon-sale.cjs` e `tests/idle-economy-guardrails.cjs`. A verificação interativa do jogo público e do status em navegador continua pendente até desativar SSO.


## Conta compartilhada e Trade Zone — 2026-09-29

- Causa do pedido de login separado: o Idle lia `psy_idle_session_v1`; a conta principal do PSYWORLD mantém a sessão em `psyworld_online_session_v23`. A Trade Zone usava a primeira chave e nunca via a autenticação já ativa.
- O Idle agora sincroniza sua sessão Supabase com `psyworld_online_session_v23`, preservando os dados de personagem/economia do Idle em `psy_idle_character_v1`. A chave antiga `psy_idle_session_v1` não é usada para identidade ativa. O callback de OAuth legado descarta respostas próprias do Idle e volta ao PSYWORLD.
- O chat público continua visitante: leitura e envio não precisam de login e continuam disponíveis quando a sessão principal falta ou expira.
- A Trade Zone passou a usar um módulo dedicado com uma praça compartilhada, avatares posicionados via presença privada Supabase, movimento por clique/WASD/setas e controles de toque, nickname vindo do PSYWORLD, pedidos de amizade com aceitar/recusar, mensagens privadas com histórico, bloqueio e convites de troca com aceitar/recusar/cancelar. Solicitações sociais atualizam por consulta a cada 5 segundos; movimento/presença usa Realtime.
- Market, leilão, Pokédex/equipe, inventário, Gold e progresso continuam isolados nos dados do Idle. Nenhum código de autenticação, save ou economia do PSYWORLD foi alterado.
- Nenhuma migração de banco foi necessária: o módulo usa o canal privado de presença e `idle_social` já existentes/aplicados.
- Adicionados `tests/idle-shared-session.cjs` e `tests/idle-trade-zone.cjs`; ajustados testes do callback e da sessão principal. Todos os `tests/*.cjs`, checagens de sintaxe JavaScript e `git diff --check` passaram.
- A interface abre e aceita convites de troca; a seleção/oferta dos itens dentro da sala continua exigindo uma interface própria, pois os ativos do Idle local ainda não são sincronizados para o inventário online autoritativo.

## Recompensas iniciais e Passe — 2026-09-29

- A escolha do primeiro inicial concede, uma vez por perfil Idle, 200 Ultra Balls, 200 Great Balls, 200 Pokéballs, 200 Revives e 200 Poções 200; o aviso aparece na tela de escolha. Auto-Potion, Auto-Revive e Auto-Catch normal ficam ativos, usando Pokéball.
- Cada abate agora dá 20 XP de Passe (antes 1), mantendo as faixas de 1.000 XP por nível. As trilhas gratuita e premium oferecem um boost em todos os marcos múltiplos de 5, junto a recompensas de itens e Gold maiores.
- O nível 100 gratuito concede uma Caixa Shiny de Inicial das 9 regiões. A caixa aparece na Bag; abrir adiciona um inicial regional Shiny à Box.
- Testes novos validam os presentes do inicial, as três configurações automáticas, boosts em todos os marcos de 5, valores escalados e abertura/consumo da caixa. Todos os `tests/*.cjs`, checagens de sintaxe e `git diff --check` passaram.
- Os bônus iniciais são concedidos ao concluir a escolha do inicial; perfis que já tinham inicial escolhido recebem o pacote uma única vez quando entrarem no Idle após esta versão.
