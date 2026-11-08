# PSYWORLD — Atlas & World Experience V3, lote D

Data: 2026-11-08  
Branch: `visual/psyworld-atlas-world-v3-lotd`  
Base originalmente informada: `295ded5cffc9186e69be66f58a8ebc5a901851e8`  
Implementação original: `b59b7811760f455406b2e83daf7bd42b718f1b82`

## Integração e escopo

- A verificação remota mais recente encontrou a `main` em `822c51e962c85028137c5e7091beceacc064d6df`, três commits acima da base informada. Ela inclui a entrega visual do Survivor e sua otimização mobile. A branch recebeu essa `main` por merge; `index.html` foi combinado automaticamente e nenhum arquivo concorrente foi descartado.
- A ponta atual contém o commit de implementação `b59b781`, a proteção de disponibilidade `acf2b9c8cb9cdee11bcede23fce1c2e935aef757` e o merge `f662b502bbdb88fc2c3530ed4b26fec9976e2cc2`. A comparação `origin/main...HEAD` contém somente os 20 arquivos do Lote D.
- O mapa original da Gruta dos Cristais mede 900×675. A integração reutiliza o mundo, Hobbies, movimento, colisões, mineração e VFX existentes; acrescenta rachaduras em Rota 1/gruta, cinco impactos por escavação, baús, Caçador de Tesouros, Looter, títulos progressivos e Treasure Roll.
- A rotina SQL mantém descontos, recompensas, frações de PsyCoin, recibos e progresso no servidor, com idempotência e permissões restritas a `service_role`.

## Autoridade online e Supabase

- A migration `supabase/migrations/20261108052207_psyworld_treasure_hunt_v1.sql` ainda **não** foi aplicada no Supabase de produção. A publicação do código não autoriza essa alteração de banco.
- Um probe `status` sem efeitos de escrita habilita a versão online somente quando o RPC responde com a versão esperada. Enquanto a migration não estiver instalada, a conta online não mostra spots nem oferece ações ou recompensas de tesouro. Falhas de conexão também fecham o recurso; nunca há fallback para prêmio local numa conta online.
- No modo offline o jogo continua usando o save local existente. A ativação online requer aprovação e aplicação separada da migration, após validação do backend de produção.

## Validação executada

- Testes específicos: `node tests/treasure-hunt-v1.cjs`, `node tests/hobbies-unified-v2.cjs`, `node tests/hobbies-spot-effects-v1.cjs` e `node tests/hobbies-mastery-campaign-v1.cjs` passaram. A suíte cobre 5 impactos, cooldown, baús/XP, habilidades, disponibilidade online, ausência de fallback em falha e impactos em 30/60/120 FPS.
- PostgreSQL 17 descartável (`psyworld_lotd_test`): setup, migration e `tests/treasure-hunt-v1-db-exercise.sql` passaram. Confirmados: progresso e recompensas, XP do Looter, retry sem duplicação, RPC apenas para `service_role`, probe sem escrita, 10 décimos convertidos em 1 PsyCoin, falhas de nível/saldo com rollback e nenhum débito quando a ação falha. O banco de teste foi removido; não foram usados dados de jogadores.
- Testes concorrentes em duas sessões: mesma chave produziu um recibo, um custo e um prêmio; duas chaves com saldo para uma tentativa produziram uma compra confirmada e uma falha por saldo, sem saldo negativo nem segundo recibo. O saldo final refletiu apenas a recompensa da tentativa confirmada.
- Regressões passaram: `battle-loot-rules-v1.test.cjs`, `idle-loot-routing.cjs`, `kanto-v10-rooms.cjs`, `kanto-story-v49.test.cjs`, `kanto-atlas-v3.test.cjs`, `kanto-v6-sprites-movement.cjs`, `kanto-campaign-menu-v65.cjs`, `kanto-gym-hobbies-v70.cjs`, `kanto-interiors-v9.cjs`, `kanto-tutorial-collision-v68.cjs`, `kanto-v4-paths.cjs` e `trainer-walk-v7.cjs`.
- Chromium final, desktop 1280×720, sem gravação: carregou o jogo e os módulos após o merge da `main`, abriu Rota 1 e Gruta, liberou Caçador no perfil offline descartável e encontrou os três spots reais. Zero erros de página. A demonstração de gameplay anterior gravou o controlador e os assets de produção; não foi repetida porque a correção desde então só altera a disponibilidade online.
- `node --check` nos módulos alterados e `git diff --check` passaram.

## Testes herdados

- `tests/human-animation-v2.test.cjs` ainda falha numa expectativa histórica de hash de `core/follower-v47.js`: esperado `7e7cdf2f…`, arquivo atual `36abfb02…`. O arquivo não difere de `origin/main` nem integra o diff do Lote D; o checkpoint de C registra a mesma falha em checkout limpo da Main. É expectativa obsoleta, não regressão deste lote.
- A falha antiga de `tests/hobbies-mastery-campaign-v1.cjs` era a liberação de compra de habilidade antes do efeito correspondente. A proteção já integrada no Lote C está presente na `main`; o teste passou nesta validação. Nenhuma mecânica antiga foi restaurada.

## Ambiente e publicação

- `df -h`/`df -i` identificaram o overlay sem espaço e diretórios de PNGs extraídos de vídeos. Foram removidos somente quatro diretórios de frames regeneráveis, cada um ao lado de seu MP4 preservado: ~1,05 GB liberados. Código, assets, histórico, vídeos, checkpoints, migrações e banco persistente foram mantidos.
- Vercel está conectado ao repositório `dioh-cpu/psyworld`; a branch de produção é `main`, e push nela cria deploy `production` automaticamente. URL do projeto: `https://psyworld-murex.vercel.app`.
- A publicação do Lote D na `main` foi autorizada após validação. O push deve avançar por fast-forward sobre `822c51e`; acompanhar o deployment `production` e verificar a URL acima. Não aplicar a migration Supabase sem autorização própria.
