# Checkpoint — sorteio global e eventos de campanha

Data: 2026-11-07 14:38 UTC
Branch: `visual/psyworld-pixel-art-overhaul-v1`
HEAD de partida: `7058517f3a42f49ac4656681c739e569708d11fb`
`main` remota observada: `81d114c5a62ec5a4272f2414baf1b4995e7b57cb`
Relação: o HEAD de partida contém a referência remota da `main` como ancestral; `git merge-base` retornou `81d114c5a62ec5a4272f2414baf1b4995e7b57cb`.

## O que entrou nesta etapa

- Presença online atualizada a cada 30 segundos por conta autenticada. A tabela mantém um único registro por usuário; uma janela de 90 segundos absorve pausas de rede e abas em segundo plano.
- Um sorteio global por hora de Brasília. Um lock transacional e a chave primária do horário impedem vencedores duplicados. Um participante online recebe 25.000 Gold pelo ledger existente; o nome do vencedor é exposto, nunca seu UUID.
- Um evento aleatório de campanha é sorteado e persistido a cada janela de duas horas de Brasília: Hora Dourada (+20% Gold), Pulso de Treinamento (+25% XP), Rotas em Abundância (+20% de chance de drop) ou Rastro Brilhante (+0,025 ponto percentual de chance Shiny).
- Os bônus de Gold, XP e drop chegam ao cálculo online de batalha a partir do evento lido no banco, não de percentuais fornecidos pelo cliente. O evento Shiny altera os dois geradores de encontros da campanha: batalhas de rota e Pokémon do mapa.
- O Pulso de Treinamento também usa os métodos de XP já existentes nas vitórias de campanha. O restante dos ganhos e os limites atuais continuam sob os cálculos existentes.
- A interface mostra a atividade no menu online e a faixa do evento no mapa. Em telas de até 520 px, ela fica abaixo do HUD do treinador; a faixa não recebe cliques e não captura os controles.

## Arquivos

- `supabase/migrations/20261107143842_campaign_hourly_lottery_world_events_v1.sql`
- `api/game.js`
- `core/online-authority-v26.js`
- `core/legacy-runtime.js`
- `core/prelude.js`
- `lib/campaign-event-rules-v1.js`
- `tests/campaign-hourly-events-v1.cjs`
- `package.json`
- `docs/checkpoints/campaign-events-lottery-v1.md`

## Verificação

Passaram:

- `npm run test:campaign-world`
- `node --check api/game.js`
- `node --check core/online-authority-v26.js`
- `node --check lib/campaign-event-rules-v1.js`
- `git diff --check`
- `node tests/world-time-v1.cjs`
- `node tests/kanto-story-v49.test.cjs`
- `node tests/kanto-campaign-menu-v65.cjs`
- `node tests/capture-commerce-v48.test.cjs`
- `node tests/kanto-v6-sprites-movement.cjs`

Chromium executou o jogo com endpoints de API simulados e um perfil descartável: faixa do evento visível em desktop (1365 px) e mobile (390 px), sem erro JavaScript nem largura horizontal excedente. As capturas foram gravadas em `/workspace/visual-overhaul-v1-artifacts/campaign-world-status-desktop.png` e `campaign-world-status-mobile.png`. Isso valida a apresentação e a integração do cliente com o contrato HTTP simulado, não a execução em produção.

Com o evento `training_surge` simulado, o runtime real calculou 4 → 5 XP para o Pokémon e 8 → 11 XP de treinador no mesmo encontro de campanha; a tela não registrou exceções. O patch foi aplicado em uma cópia limpa do HEAD-base e `npm run test:campaign-world` passou nela.

## Limites e operação

- A migração ainda não foi aplicada ao Supabase. Nenhuma tabela, recompensa ou configuração remota foi alterada. A execução em Postgres local foi bloqueada pelo daemon Docker (`no space left on device` ao criar o diretório VFS); o teste automatizado de banco ainda precisa rodar em uma instância de desenvolvimento antes da integração.
- A autoridade v26 já retorna `xp_reward`, mas o código existente não persiste XP de Pokémon/treinador no RPC de batalha. O bônus de XP desta etapa acompanha o cálculo local de vitória e o salvamento local; a persistência online de XP continua uma pendência preexistente e não foi afirmada como validada.
- Nenhum push, merge ou deploy ocorreu. A migração precisa preceder qualquer implantação do código, após revisão e aprovação da integração.

## Retomar

1. Confirmar novamente a `main` remota e a branch isolada.
2. Aplicar esta migração em banco Supabase de desenvolvimento e exercitar concorrência, idempotência do pagamento e mudança de hora.
3. Validar a persistência online de XP separadamente antes de ampliar ou publicitar o bônus de XP.
4. Revisar o evento dentro do gameplay em dispositivos reais; as capturas Chromium usam o jogo real com respostas de API simuladas.
