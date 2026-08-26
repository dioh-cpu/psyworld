
# PSYWORLD Global Market (Vercel)

Este pacote adiciona um Market Global assíncrono. Os jogadores NÃO precisam estar online ao mesmo tempo.
Os anúncios ficam em PostgreSQL; Vercel Functions expõem `/api/market/*`.

## 1. Banco
No projeto da Vercel, adicione Neon Postgres (ou outro PostgreSQL) pelo Marketplace.
Garanta que a variável `DATABASE_URL` exista no projeto.

## 2. Schema
Execute `schema.sql` no banco uma vez.

## 3. Deploy
Copie:
- `index.html`
- `api/market/list.js`
- `api/market/buy/[id].js`
- `api/market/claims.js`
- `package.json`
- `vercel.json`

para a raiz do repositório e faça deploy.

## Como funciona
- GET `/api/market/list`: lista até 200 anúncios ativos.
- POST `/api/market/list`: cria anúncio.
- POST `/api/market/buy/:id`: trava/vende um anúncio atomicamente e cria um crédito para o vendedor.
- GET `/api/market/claims`: entrega ao vendedor os créditos ainda não resgatados.

## Limitação de segurança desta fase
O jogo ainda guarda Gold/Diamantes/save no navegador. Portanto o Market já é GLOBAL e impede dupla-compra do mesmo anúncio,
mas a economia ainda não é server-authoritative. Um jogador que editar o próprio save/localStorage pode trapacear.

Antes de abrir comercialmente:
1. criar login/conta;
2. mover Gold, Diamantes, inventário e Pokémon para o servidor;
3. validar compras e anúncios inteiramente no backend;
4. registrar ownership único dos Pokémon;
5. usar idempotency keys e auditoria de transações.
