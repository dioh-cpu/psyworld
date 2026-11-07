# PSYWORLD — Checkpoint Kanto: Viridian City integrada à main
Data: 2026-11-07
Branch: main
Repositório: https://github.com/dioh-cpu/psyworld

## Objetivo autorizado
Dar continuidade à campanha de Kanto diretamente em main, começando por Viridian City e usando a escala, os controles, a apresentação e as colisões aprovadas em Pallet Town e Rota 1. Suportar desktop, celular em retrato e landscape sem distorcer a arte.

## Auditoria / causa
- Pallet Town e Rota 1 usam `core/kanto-world-v2.js` com posições em pixels de mapa e colisão geométrica definida nos dados e `core/kanto-collision-v4.js`.
- Viridian e mapas posteriores eram abertos pelo antigo `core/kanto-campaign-playable-v1.js`, com grade de 32×20 e imagem square 1:1 deformada num canvas 896×560.
- A arte aprovada `assets/kanto/approved/viridian-approved.webp` já existia. Ela deve permanecer com proporção quadrada, sem ser redesenhada ou esticada.
- `core/kanto-journey-v1.js` já contém a sequência Viridian > Route 2 > Viridian Forest > Pewter; os demais mapas ainda usam, em grande parte, layouts provisórios.

## Implementação realizada na main
1. `17242b9d4cc9588cd564f21c782c455e965d2380`: criado `core/kanto-viridian-v1.js` com coordenadas 900×900, vias/caminhos caminháveis, bloqueio da água da fonte, 7 pontos de entrada, NPCs, saída sul para Rota 1 e saída norte para Rota 2; nenhum campo de encontro selvagem.
2. `a1bce70692fef1cef987b13d25a61aff0d3bc9ed`: `core/kanto-world-v2.js` passa a renderizar Viridian no mesmo motor contínuo de Pallet e Rota 1, usando a arte quadrada, câmera responsiva e caminhos; adicionadas interações do ancião/escola, Ginásio fechado, retorno e progressão à Rota 2. `core/kanto-campaign-playable-v1.js` delega Viridian para o motor novo. `index.html` importa o novo módulo na ordem correta e atualiza a versão de cache dos scripts alterados.
3. `30feaa7e9d2c185132e27375d7aea969bef58a7a`: `css/kanto-world-v2.css` recebe ajustes exclusivos de Viridian para retrato e landscape; o motor expõe `data-world` no painel; `tests/kanto-viridian-v1.cjs` formaliza os testes de geometria, acessos, portas, encontro zero e ordem do carregamento.

## Validações efetivamente executadas
- Compilação sintática dos scripts JS alterados com `new Function(...)` em runtime V8 de ferramenta.
- Execução das definições reais de mapa/colisão em V8 e busca de conectividade na malha, com acessos às portas e saídas encontrados; água da fonte não caminhável e `grass.length === 0` em Viridian.
- Validação textual da ordem de carregamento dos scripts no `index.html`.
- GitHub aceitou os commits sem reescrever a história de `main`.
- Vercel registrou deploy do commit `30feaa7...` com estado READY.
- **Não executado ainda:** jogo interativo completo em Chromium e testes reais de renderização/controles em celulares, nem execução do `node tests/kanto-viridian-v1.cjs` no runner do repositório. Não afirmar que esses testes passaram sem realizá-los.

## Pendências e próximos passos
1. Abrir Viridian na versão implantada em Chromium e celular: confirmar caminhos pintados versus colisões, interações e movimento em 1920×1080, 390×844 e 844×390; verificar zoom, NPCs e controles.
2. Checar se as portas de Viridian reutilizam corretamente os interiores de Pallet; atualmente Escola e Ginásio usam diálogos, não interiores exploráveis.
3. Verificar transição Rota 1 → Viridian → Rota 2 → retorno e a persistência dos marcadores sem perdas de estado; confirmar que não há encontro selvagem em Viridian.
4. Rota 2: substituir mapa procedural pelo mesmo modelo geométrico e arte exclusiva antes de ampliar Floresta de Viridian; reusar controles/câmera/colisões sem criar novo motor.
5. Floresta de Viridian → Pewter → Rota 3 → Monte Lua → Rota 4 → Cerulean: projetar cada arte e colisão independentemente, com ligações seguras, quests, NPCs e testes.
6. Preservar integralmente os sistemas existentes e a geometria aprovada de Pallet e Rota 1. Manter mudanças pontuais, documentadas e com regressões automatizadas.

## Critério de qualidade para próximas etapas
Não usar imagem promocional ou visual improvisado como se fosse uma cena jogável. Colisões e rotas precisam coincidir com o que está desenhado. Não apresentar a campanha como concluída sem ter verificado os caminhos e interações numa build acessível.
