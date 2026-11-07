# PSYWORLD — Kanto: Menu da Campanha e Auto Route simplificado
Data: 2026-11-07
Branch autorizada: main
Implementação: commits 22a8f024aa4b17f1e7ae00e8c255742cdbd4dbf2, 30939220d3d63750e03f5791690c5c1c10ac20b2 e cdfbe14e5dcb202142da748d0e7e126c3ceee7f6

## Problema confirmado
No celular, o painel HISTÓRIA/ROTA gerado por core/campaign-automation-v1.js era uma faixa permanente sobre o mapa. O motor core/kanto-world-v2.js ocultava a UI geral da cidade sem oferecer menu equivalente de campanha. O Auto Hunt VIP também ficava numa posição fixa sobre o cenário.

## Mudanças aplicadas
- O menu da campanha agora pertence ao próprio motor de Kanto e abre pelo botão "☰ MENU" no cabeçalho; é responsivo em PC, retrato e landscape.
- O menu inclui acessos a Time/Box, Mochila, Pokédex, Profissões, Ginásios e Loja, todos reutilizando os painéis existentes do jogo, sem duplicação de inventário/equipe.
- Para painéis externos, o canvas da campanha é temporariamente ocultado para que as janelas existentes apareçam corretamente. Ao fechar o painel, o mapa reaparece sem reinicializar mundo ou posição.
- Quests e botão ROTA não são mais fixados sobre a imagem. As linhas de objetivos e Auto Hunt VIP são movidas para seções roláveis do menu.
- O cabeçalho tem atalho compacto "↗" para rota direta da missão principal, mantendo o cenário visível.
- Abrir um caminho pelo menu fecha o menu antes de caminhar; configuração VIP aparece acima do jogo, com restauração ao fechar.
- Em Viridian, ROTA leva primeiro ao Ancião e, depois da conversa, ao portão norte rumo à Rota 2; não reinicia a cidade e a posição ao solicitar rota.
- Os scripts e CSS alterados receberam cache-bust, sem mexer na colisão, mapas, velocidade de caminhada ou na IA de combate.

## Arquivos alterados
- core/kanto-world-v2.js
- core/campaign-automation-v1.js
- css/kanto-world-v2.css
- index.html
- tests/kanto-campaign-menu-v65.cjs
- .github/workflows/kanto-geometry.yml

## Validações efetuadas
- Script da campanha e de automação compilam em V8 via new Function.
- Teste de regressão da UI foi executado por mock de fs.assert em V8: botões, remoção de tracker fixo, cache, rotas, recuperação de painéis.
- Smoke test real das geometrias no JS para Viridian: 0 áreas de encontros e fonte bloqueada.
- Arquivos escritos em main por commit atômico; Vercel confirmou produção READY para o commit cdfbe14e....
- Teste automatizado incluído em GitHub Actions, mas sua execução real no runner ainda deve ser confirmada.
- Não houve validação de jogabilidade visual em Chromium ou em um aparelho físico nesta execução. Não alegar que houve.

## A validar pelo usuário / posteriormente
- Abrir e fechar Time, Mochila, Pokédex, Ginásios, Loja e Profissões em retrato e landscape; verificar que o personagem retoma exatamente o ponto anterior.
- ROTA em Pallet, Rota 1 e Viridian; missão principal e Auto Hunt VIP sem sobreposição do mapa.
- Fluxos com diálogos abertos, batalhas e mudanças de orientação, para evitar sobreposição entre UI de conteúdo e exploração.
- Preservar sistema de main/Brock já corrigido; quatro profissões auxiliares e integração de suas artes continuam sendo trabalho separado que não deve ser anunciado como concluído.

## Links
Main: https://psyworld-murex.vercel.app
Repositório: https://github.com/dioh-cpu/psyworld
