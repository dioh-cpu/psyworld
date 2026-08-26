
# Deploy pelo celular — PSYWORLD + GitHub + Vercel + Supabase

## O que está pronto
- `index.html`: jogo + ponte para login online.
- `/api/config`: entrega SOMENTE URL/chave pública do Supabase.
- `/api/player/bootstrap`: cria o perfil do usuário autenticado.
- `/api/player/state`: lê saldo/inventário/Pokémon oficiais.
- `/api/player/import-local`: importação única de save antigo, DESLIGADA por padrão.
- Market server-side com escrow e transações SQL.
- Shop/craft server-side básicos.
- Ledger de Gold/Diamantes e Pokémon com UID único.
- RLS: cliente autenticado pode ler seu estado, mas não alterar diretamente a economia.

## 1. Subir arquivos no GitHub pelo celular
A forma mais simples NÃO é abrir o index e colar código.

1. Baixe e extraia o ZIP.
2. Abra a página principal do seu repositório no GitHub.
3. `Add file` → `Upload files`.
4. Selecione os arquivos/pastas extraídos. O GitHub web permite até 100 arquivos por upload.
5. Confirme que `index.html`, `api/`, `supabase/`, `package.json` e `vercel.json` aparecem na raiz.
6. Commit message: `Online foundation v1`.
7. Faça commit na branch que a Vercel usa como Production (normalmente `main`).
8. A Vercel detectará o commit e iniciará o deploy.

Alternativa: no repositório, pressione `.` ou troque `github.com` por `github.dev`.
É um VS Code no navegador; use Source Control para commit/sync.

## 2. Criar/conectar Supabase na Vercel
Opção recomendada no celular:
1. Vercel → seu projeto PSYWORLD.
2. Storage/Marketplace → procure `Supabase`.
3. Instale/crie o projeto.
4. Confirme em Settings → Environment Variables que existem:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
5. NUNCA coloque `SUPABASE_SECRET_KEY` no `index.html`.

Se criar Supabase diretamente no site do Supabase, adicione as três variáveis manualmente na Vercel.

## 3. Criar banco
Supabase → SQL Editor → New query.
Cole o conteúdo de `schema.sql` e execute UMA VEZ.

## 4. Auth
Supabase → Authentication → Providers → Email.
Ative Email/Password.
Em URL Configuration:
- Site URL: `https://psyworld-murex.vercel.app`
- Redirect URLs: adicione a URL oficial e, se quiser testar previews Vercel, os previews apropriados.

## 5. Redeploy
Depois das variáveis e do SQL:
Vercel → Deployments → último deployment → Redeploy
OU faça qualquer commit pequeno no GitHub.

## 6. Teste
- Abra `/api/health`. Deve retornar `online: true`.
- Abra o jogo. No rodapé deverá aparecer estado ONLINE.
- Menu → `CONTA ONLINE`.
- Crie uma conta.
- Depois de login o status deve ficar verde.

## 7. Importação de save antigo — NÃO ligue ainda
A importação é uma ponte temporária e tem limites anti-exploit.
Quando você estiver pronto para testar com SUA conta:
Vercel → Environment Variables:
`ALLOW_LEGACY_IMPORT=true`
Redeploy.
Depois de importar sua conta uma única vez, volte para `false`.

## IMPORTANTE antes do lançamento público
Esta fundação protege Market/Wallet server-side, mas nem TODAS as recompensas do gameplay antigo foram migradas para o servidor ainda.
Não anuncie economia/Market público até:
- battle rewards;
- gacha;
- achievements;
- eggs;
- dungeon rewards;
- AFK;
- card rewards;
estarem chamando endpoints server-side em vez de `P.gold += ...`.

A base foi feita justamente para fazermos essa migração em etapas sem reescrever o banco de novo.
