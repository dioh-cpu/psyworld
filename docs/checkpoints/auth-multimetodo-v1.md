# PSYWORLD Auth Multimétodo — checkpoint v1

Branch: `feature/auth-multimetodo-v1`  
Base: `fix/signup-confirmation-flow-v1` at `c63ac641ca3133f3e1dc14b7cdd5e7bb706cce5b`.

## Auditoria

- A branch de cadastro inclui a correção em `core/cloud-save-v23.js`; `main` (`72953a34580ba269d5bb4425db32a1451fd13dc7`) é ancestral dela.
- `/api/player` exige bearer token validado por `supabase.auth.getUser()`. As consultas e gravações usam o UUID autenticado em `user_id`; o service key fica no servidor.
- `player_characters` e `player_game_state` têm RLS com leitura limitada a `auth.uid() = user_id`; gravações do cliente são revogadas e passam pelo endpoint autenticado. `player_characters` preserva UUID do personagem e CAS de revisão.
- GitHub está habilitado no Auth e possui Client ID/Secret configurados. Google está desabilitado e sem Client ID/Secret. Nenhuma credencial foi copiada ou alterada.
- O deploy de produção confirmado usa `https://psyworld-world-of-monsters.vercel.app/` (alias público PSYWORLD); essa origem também consta na allowlist. Os previews Vercel estão permitidos. Site URL não foi alterada.
- Callback externo esperado no console dos provedores: `https://otwgavwvjxuwtgncjbiq.supabase.co/auth/v1/callback`.

## Implementação nesta branch

- Adiciona entrada Google e mantém GitHub no menu existente.
- Usa o SDK Supabase JS local `2.117.2`, PKCE, code verifier persistido entre redirecionamentos e callback consumido explicitamente. O retorno usa a origem atual permitida para funcionar em preview e produção.
- Cancelamento, erros de configuração, sessão expirada e erro de troca de código recebem mensagens seguras; parâmetros OAuth são removidos da barra de endereço.
- Quando já há sessão válida, os botões iniciam `linkIdentity()`; não iniciam um login que possa trocar silenciosamente de conta. O UUID esperado é conferido no callback; incompatibilidade preserva a sessão anterior.
- A interface lista os métodos vinculados quando o endpoint de identidade responde. A lógica usa UUID do Auth, nunca nickname, para propriedade do save.
- Nenhuma migration, edição de dados, alteração de Cloud Save ou publicação em produção.

## Configuração externa pendente

- A consulta Auth retornou GitHub habilitado com credenciais configuradas; não temos acesso ao console externo do aplicativo GitHub para verificar se o callback acima está registrado.
- Google continua indisponível até o proprietário fornecer/configurar as credenciais de OAuth no Google Cloud e no Supabase.
- Manual linking estava desabilitado. A tentativa autorizada de PATCH ao Management API retornou HTTP 403; leitura posterior confirmou que permaneceu desabilitado. O token desta execução pode ler a configuração, mas não tem permissão efetiva para gravar essa opção. `linkIdentity()` vai exigir que o proprietário habilite manual linking no Auth antes de funcionar.
- Nenhuma conta de teste autorizada foi indicada. Não foram criados usuários nem iniciados logins reais.

## Testes executados

- `node --check core/cloud-save-v23.js` — passou.
- `node tests/cloud-signup-confirmation-flow-v1.cjs` — passou.
- `node tests/cloud-multimethod-oauth-v1.cjs` — passou: início Google/GitHub mockado, PKCE, origem de callback, vinculação autenticada, preservação da sessão em mismatch/cancelamento e limpeza dos parâmetros.
- `node tests/player-character-cas-v1.cjs` — passou.
- `node tests/cloud-save-character-scope-v1.cjs` — passou.
- `node tests/idle-profile-isolation.cjs` — passou.
- OAuth real, dois dispositivos, recuperação e teste físico mobile/desktop ainda dependem de credenciais/provedores habilitados e contas de teste autorizadas.

## Continuação — ativação OAuth (2026-11-10)

- O ambiente desta execução informa `SUPABASE_MGMT_TOKEN` como `ready`, restrito a `api.supabase.com`. O token é opaco e a configuração do ambiente não revela scopes/roles. A tentativa anterior de escrita foi negada com HTTP 403; não houve nova tentativa de escrita. A documentação do Management API identifica 403 como ação proibida. A autorização efetiva necessária para alterar a configuração é `auth_config_write` e `project_admin_write`; é preciso conceder `project_admin_write` ao acesso usado, sem gerar outro token.
- Nova leitura somente GET da configuração Auth confirma: `external_github_enabled=true`, credenciais GitHub presentes, `external_google_enabled=false`, credenciais Google ausentes, `security_manual_linking_enabled=false`. Site URL permanece `https://psyworld-world-of-monsters.vercel.app/`; nenhuma configuração foi alterada.
- Não há integração de Google Cloud/Google Auth Platform nem credenciais OAuth Google disponíveis nesta execução. A conexão Google Drive existente não dá acesso administrativo ao Google Cloud. A criação do cliente Web e da tela OAuth depende do proprietário conectar uma conta autorizada com acesso de administração à configuração OAuth do projeto correto.
- O preview Vercel continua READY para o SHA `22d2ef2b6d597b14c493a86130f1ea3d4d595e19` em `psyworld-git-feature-auth-multimetodo-v1-world-of-monsters.vercel.app`. Playwright abriu o jogo em desktop 1440×900 e viewport móvel 390×844: botões Google/GitHub visíveis, sem erros de página e sem overflow horizontal. No clique GitHub, o fluxo saiu para `github.com/login`; nenhuma conta foi autenticada e o callback externo do GitHub não foi verificado no console do aplicativo.
- Não foi fornecida conta de teste autorizada. Portanto não foram concluídos consentimento OAuth, retorno com sessão, validação de UUID, seletor de personagens, carregamento de save, renovação/logout, dois dispositivos ou vinculação Google/GitHub. Sem autorização para configuração Auth e sem conta de teste, esses resultados não podem ser declarados aprovados.
- Nenhum dado, migration, política RLS, configuração de Site URL, código do jogo ou produção foi alterado nesta continuação.

## Correção do login Google no preview (2026-11-10)

- Diagnóstico reproduzido no preview: após `exchangeCodeForSession(code)`, o callback copiava a sessão para `psyworld_online_session_v23` e chamava `supabase.auth.signOut({scope:'local'})` durante a limpeza do fluxo. Playwright observou um POST `/auth/v1/logout` imediatamente depois da troca PKCE. Esse logout podia revogar o refresh token que acabara de ser salvo pelo jogo.
- Correção: o cleanup agora remove somente as chaves temporárias OAuth do `localStorage`/`sessionStorage`, sem chamar logout remoto. A sessão do jogo permanece em sua chave própria.
- Diagnóstico de interface: mensagens de erro do callback eram escritas antes da criação do menu e podiam ser substituídas pelo status periódico de `online-profile-entry-v37.js`. A UI agora é preparada antes do callback e preserva mensagens com códigos `OAUTH_*` até uma nova tentativa.
- A mensagem social genérica foi substituída por códigos seguros e mensagens específicas para armazenamento, configuração, SDK, allowlist, provedor desabilitado, vínculo, cancelamento, sessão expirada, PKCE e rede. A interface e logs exibem somente códigos fixos, sem texto bruto da resposta OAuth.
- `/api/config` no preview respondeu HTTP 200 com `onlineConfigured=true`, URL do projeto correto e chave pública presente (nenhum valor foi exposto). O bundle local `assets/vendor/supabase-js-2.117.2.js` respondeu HTTP 200 e `window.supabase.createClient` foi confirmado como função.
- GET somente confirma Google habilitado e credenciais presentes no Auth. O authorize real do Supabase respondeu 302 para `accounts.google.com`; o pedido efetivo contém `email profile openid` sem duplicação e usa callback `https://otwgavwvjxuwtgncjbiq.supabase.co/auth/v1/callback`. O `redirect_to` retornou à origem de preview. A allowlist atual contém `https://psyworld-*-world-of-monsters.vercel.app/**`, que cobre o preview. Site URL não foi alterada.
- Playwright com conta/token/Auth endpoint mockados no preview, desktop e perfil móvel Android Pixel 7: PKCE S256 gerou challenge; `auth_code` e `code_verifier` chegaram à troca; a callback voltou à mesma origem; UUID de teste foi persistido; refresh token ficou presente; URL perdeu o código; seletor de personagens apareceu; `/api/player` e `/api/player/characters` foram chamados com bearer; `/logout` não foi chamado. Um teste desktop adicional expirou o access token e confirmou a chamada de refresh mantendo o mesmo UUID.
- Callback de cancelamento no preview manteve a mensagem `OAUTH_CANCELLED` após a execução dos atualizadores de status e removeu o parâmetro de erro da URL.
- O acesso Google acima foi interrompido antes da tela de escolha/consentimento. Não houve login real com conta de jogador, criação de usuário, alteração de save ou teste físico em aparelho Android. A emulação Playwright não substitui uma autenticação real no aparelho.
- Testes Node passaram: OAuth multimétodo, confirmação de cadastro, CAS de personagens, escopo de Cloud Save por personagem e isolamento Idle/PSYWORLD. Nenhuma migration, alteração Auth, save real, economia ou publicação de produção.
