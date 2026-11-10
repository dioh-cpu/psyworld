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
