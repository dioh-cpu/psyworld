# Confusion Waves: backend (Supabase do projeto)

O jogo novo usa o mesmo projeto Supabase do jogo antigo, mas com tabelas e endpoints próprios.
As tabelas antigas (carteira, mercado, caça, capturas) não são usadas e não foram apagadas.

## Endpoints (api/)
- `GET /api/confusion-config`: devolve só a URL e a chave pública. Nunca a chave de serviço.
- `GET /api/confusion-save`: carrega o save da conta (exige login).
- `PUT /api/confusion-save`: salva com controle de versão. Se outro aparelho salvou antes, responde 409 e não sobrescreve.

## Passos que dependem de você (não consigo fazer daqui)
1. **Aplicar a migração** `supabase/migrations/20261120090000_confusion_saves.sql` no projeto Supabase. Ela só cria a tabela `confusion_saves`, com RLS. Não altera nem remove nada.
2. **Variáveis no Vercel** (já devem existir): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` ou `SUPABASE_ANON_KEY`, e `SUPABASE_SERVICE_ROLE_KEY`. A chave de serviço fica só no servidor.
3. **Redirecionamento da recuperação de senha:** em Authentication > URL Configuration do Supabase, adicione a URL da preview e a de produção. Sem isso, o link de redefinição não volta para o jogo.
4. **Confirmação de e-mail:** decida se a conta exige confirmação. Se exigir, o jogador confirma antes de entrar.

## Limites conhecidos
- O controle de versão ainda não é atômico (lê e depois grava). Duas gravações exatamente ao mesmo tempo podem passar. Para o piloto é aceitável; para produção, o ideal é uma função no banco que faça as duas coisas numa operação só.
- Nenhum teste rodou contra o Supabase real: não tenho as credenciais aqui. Os testes cobrem a validação do save; o fluxo de login e a gravação precisam de um teste manual depois de aplicar a migração.
