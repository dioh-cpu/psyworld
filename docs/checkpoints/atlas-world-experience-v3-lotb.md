# PSYWORLD — Atlas & World Experience V3 · checkpoint Lote B

## Base e isolamento

- Branch local: `visual/psyworld-atlas-world-v3`.
- Base do Lote B: `77bdd4437e9c6d1d4448d727f78cb582d9a79a6d` (Lote A publicado).
- `git ls-remote origin refs/heads/main` confirmou `77bdd4437e9c6d1d4448d727f78cb582d9a79a6d` durante esta etapa.
- O Lote B permanece local; sem push, merge ou deploy.

## Auditoria das correções já existentes

- O tutorial ativo, `core/essential-tutorial-v56.js`, aponta para os controles atuais de time, campanha, sessões de caça e acompanhante. `tests/essential-guide-v56.test.cjs` valida esses destinos. Não foi necessário alterar seus passos.
- A apresentação da Cidade Psy já restringe `actorScale=1.5` e zoom `1.18` ao desktop landscape com mouse/hover, mantendo escala e zoom `1` em touch/mobile. A UI do treinador e o acompanhante consomem esses valores uma vez; não foram adicionados multiplicadores.
- A árvore da Rota 1 já usa `assets/idle-realistic/pallet/tree_curve-transparent-v1.png`, RGBA. A arte antiga com fundo verde continua separada. Inspecionei a composição sobre fundos de cores diferentes e a renderização real do mapa; não há retângulo verde ou halo visível. O asset não foi modificado.
- A cerca usa a arte de abertura existente `assets/story/route-1-hunt-gap-v1.png`, sem alterar as colisões existentes. `tests/kanto-campaign-menu-v65.cjs` e os testes de caminhos/cena continuam cobrindo a conexão.
- O Auto Route existente usa o mesmo controlador para os botões do Atlas e da campanha, percorre caminhos com colisões e inicia interações reais. Os testes de Lote A continuam passando.

## Mudanças do Lote B

- O botão Auto Hunt, quando clicado sem VIP, abre um aviso acessível com arte do Psyduck reaproveitada, estilo pixelado e responsivo, e dois atalhos: Survivor e apoio ao servidor.
- O atalho Survivor fecha a cena Kanto e chama a entrada real `openPsyduckDungeon5` (com compatibilidade para `psy19OpenPsyduck`).
- O botão de apoio abre somente um endereço HTTPS configurado em `window.PSYWORLD_SUPPORT_URL` ou `window.PsySupport.donationUrl`. Nenhum endereço oficial de apoio está cadastrado neste repositório; sem configuração, o aviso explica isso dentro do próprio modal e não abre um destino inventado.
- As rotas diretas de Auto Hunt no controlador da campanha também utilizam o mesmo bloqueio amigável. A verificação VIP e a autorização para ativar a automação continuam intactas.
- O cartão VIP do menu recebeu arte de Psyduck, hierarquia visual e acabamento temático. Nenhuma arte de personagem ou regra de campanha foi substituída.

## Arquivos do Lote B

- `core/campaign-automation-v1.js`
- `core/kanto-campaign-playable-v1.js`
- `core/kanto-world-v2.js`
- `css/hobby-campaign-v1.css`
- `index.html`
- `tests/campaign-vip-gate-v3.test.cjs`
- `tests/kanto-campaign-menu-v65.cjs` (expectativas de cache alinhadas aos scripts ativos)
- `docs/checkpoints/atlas-world-experience-v3-lota.md` (registro de publicação atualizado)
- `docs/checkpoints/atlas-world-experience-v3-lotb.md`

## Verificação

- `node tests/campaign-vip-gate-v3.test.cjs` — passou: bloqueio sem VIP, abertura do aviso, dois botões, chamada do Survivor, endereço HTTPS configurável, fallback visível sem destino e preservação da checagem de expiração.
- `node tests/kanto-campaign-menu-v65.cjs` — passou; `node tests/essential-guide-v56.test.cjs` e `node tests/kanto-tutorial-collision-v68.cjs` — passaram.
- `node tests/kanto-atlas-v3.test.cjs` e `node tests/kanto-story-v49.test.cjs` — passaram; estes preservam a validação da navegação, do progresso e dos diálogos do Lote A.
- `node --check` nos três módulos alterados, `git diff --check` — passaram.
- Chromium desktop 1440×1000: abriu a cena da Rota 1 com perfil temporário, concluiu o diálogo inicial, abriu o menu da campanha e acionou o botão real Auto Hunt. O aviso apareceu corretamente; o botão de apoio sem URL oficial não abriu outra página e exibiu a limitação no modal. Nenhuma exceção de página.
- Chromium mobile retrato 390×844: aviso e botões cabem no viewport, sem overflow horizontal, sem exceções.
- Inspeção visual humana das capturas: `lotb-campaign-menu.png`, `lotb-vip-gate.png`, `lotb-vip-support-unconfigured.png`, `lotb-vip-gate-mobile.png`; vídeo real de navegador `lotb-vip-gate.mp4` em `/workspace/visual-overhaul-v3-artifacts/`.
- `route1-tree-before.png` e `tree-edge-comparison.png` em `/workspace/visual-overhaul-v3-artifacts/` documentam a árvore transparente e sua composição sobre quatro fundos.

## Limites e continuação

- Para ativar o segundo atalho, o projeto precisa fornecer o URL HTTPS oficial de apoio. A ausência foi preservada de modo explícito e não foi preenchida com URL especulativa.
- A verificação desktop usa o Chromium em perfil descartável; não foi executada em hardware físico.
- O Lote C (drops/Engenheiro) e o Lote D (Gruta/tesouros) permanecem pendentes. Não publicar este lote até validação e autorização explícita.
