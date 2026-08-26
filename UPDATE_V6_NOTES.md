# PSYWORLD V6

## Obrigatório antes do deploy
1. No Supabase SQL Editor execute `supabase/migrations/003_cloud_game_state.sql` uma única vez.
2. Em Supabase > Authentication > URL Configuration, defina Site URL como `https://psyworld-murex.vercel.app` e adicione `https://psyworld-murex.vercel.app/**` em Redirect URLs.
3. Faça commit/push desta pasta. A Vercel fará o deploy.

## Principais mudanças
- Cloud save completo por conta (`/api/player/save`) e restauração no bootstrap.
- Confirmação de cadastro usa `location.origin` em vez de localhost.
- AFK separado dos Cards, com cálculo offline, contador e histórico.
- Captura por tier com teto E 40%, S 5%, Shiny 1%; tentativa falha consome turno.
- Hunts bloqueadas pelo level cap; cap inicial mínimo 20.
- Cura total ao subir de nível.
- Movimento da cidade acelerado.
- Gacha mostra popup de resultados e mantém histórico; deck máximo 20.
- HUD leva Talentos e Cap/Gym por clique e esconde textos antigos de 70%.

## V6.1 — Vercel Hobby deployment fix
- Server helper moved out of `/api` so it is not counted as a Serverless Function.
- Removed the legacy one-time `/api/player/import-local` endpoint (online save is now the supported path).
- Removed the optional `/api/health` diagnostic endpoint.
- Active Serverless Functions reduced to 11, below the Vercel Hobby limit of 12.
