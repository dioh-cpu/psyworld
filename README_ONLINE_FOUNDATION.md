# PSYWORLD — Fundação Online antes do lançamento

## O que este pacote muda na arquitetura

1. **Gold e Diamantes deixam de ser autoridade do navegador.** `players` é o saldo oficial.
2. **Ledger imutável/idempotente** registra toda entrada e saída de moeda.
3. **Pokémon têm `pokemon_uid` único** e um único `owner_id`.
4. **Inventário server-side** impede fabricar Stones/TMs/Essências pelo console.
5. **Battle sessions** dão ID/seed/expiração a encontros; recompensa deve ser validada no servidor e resgatada uma vez.
6. **Market v2** referencia Pokémon reais e deve debitar/comprar/transferir em transação server-side.
7. **RLS ligada**. O cliente só lê seus dados; não recebe policy para alterar Gold, inventário ou Pokémon diretamente.

## IMPORTANTE

Ainda faltam as credenciais do seu projeto Supabase e o deploy das Edge Functions para ativar a migração real. Não coloque `service_role` no `index.html`.
Use apenas a chave publishable/anon no cliente; segredos ficam em Functions/variáveis de ambiente.

## Ordem de ativação

1. Criar projeto Supabase.
2. Ativar Auth por email/senha (ou magic link).
3. Rodar `supabase/migrations/001_online_foundation.sql` no SQL Editor.
4. Criar as funções autenticadas: `bootstrap-player`, `start-battle`, `finish-battle`, `market-list`, `market-buy`, `market-cancel`, `craft`, `shop-buy`, `shop-sell`.
5. Só então migrar um save local por conta. A importação deve ser **uma única vez** e marcada no servidor.
6. Depois da migração, `localStorage` vira cache/UI; saldo oficial sempre vem do servidor.

## Regras anti-exploit recomendadas

- Cliente nunca manda `goldReward`; manda `battle_id` + ações/resultado.
- Servidor calcula reward a partir do encontro/seed e regras da versão.
- Toda recompensa usa `idempotency_key` única.
- Market usa transação: trava anúncio -> debita comprador -> transfere ownership/item -> credita vendedor -> marca vendido.
- Pokémon anunciado fica `locked_reason='market:<listing_id>'` e não pode ser usado, deletado ou anunciado de novo.
- Rate limit por usuário/IP para endpoints sensíveis.
- Auditoria de compras, gacha, craft, eggs, dungeon, achievements e admin grants.
- Diamantes comprados com dinheiro devem entrar somente por webhook assinado do provedor de pagamento.

## Atualizar pelo celular sem colar o index

No GitHub web: abra o repositório -> **Add file / Adicionar arquivo -> Upload files / Carregar arquivos** -> escolha os arquivos -> commit.
Para vários arquivos/pastas, use o `github.dev`: abra o repositório no navegador e pressione `.` (ou troque `github.com` por `github.dev`), faça upload/edições e commit/sync.
Quando a Vercel está ligada ao repositório, o push/commit na branch de produção dispara novo deploy automaticamente.
