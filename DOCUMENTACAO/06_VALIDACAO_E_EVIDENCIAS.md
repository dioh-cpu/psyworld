# 06 — VALIDAÇÃO AUTOMATIZADA E EVIDÊNCIAS VISUAIS (V6)

## 1. Conectividade Matemática em Runtime (`r = 11`, 2D SDF)
Validação executada no Chromium real via `window.PsyKantoAnime3Q.analyzeConnectivity(id, 6, 11)` para todas as **6 áreas de Pallet Town**:
- `pallet-centro-3q`: `componentCount: 1`
- `pallet-jardins-3q`: `componentCount: 1`
- `pallet-lab-3q`: `componentCount: 1`
- `pallet-costa-3q`: `componentCount: 1`
- `pallet-colinas-3q`: `componentCount: 1`
- `pallet-arredores-3q` (Nova Rota 1): `componentCount: 1`

## 2. Roteiro Contínuo E2E Comprovado em Chromium
Executado em sessão contínua com gravação em vídeo (`Errors count: 0`, `404 count: 0`):
1. **Centro (`pallet-centro-3q`) → Interior (`home`) → Saída**: entrada e retorno funcionando com `glPresent: true`.
2. **Centro → Jardins (`pallet-jardins-3q`, `[98, 225]`) → Costa (`pallet-costa-3q`, `[1114, 74]`)**: botão contextual **PESCAR** ativo na ponta do píer (`[828, 450]`, `fishVisible: true`) e água bloqueada pelo SDF.
3. **Costa → Colinas (`pallet-colinas-3q`, `[462, 608]`)**: exploração da pedreira/mina e retorno via portal leste para Centro (`[74, 212]`).
4. **Centro → Laboratório (`pallet-lab-3q`, `[656, 598]`)**: Professor Carvalho renderizado com sprite completo de corpo inteiro (`professor-v33.webp`); subida integral dos **3 lances da escadaria esquerda** (`[312, 486] → [174, 336] → [546, 72]`) passando exatamente sob o oclusor RGBA do arco `"Rota 1"`.
5. **Laboratório → Nova Rota 1 (`pallet-arredores-3q`, `[570, 598]`)**:
   - Cercas ao redor dos canteiros (`fenceA`, `fenceB`) e rocha (`rockC`) bloqueiam passagem (`walkable === false`).
   - Os 3 canteiros de grama alta (`grassA`, `grassB`, `grassC`) são caminháveis pelos seus vãos de entrada (`walkable === true`).
   - Entrada no Campo C (`[945, 343]`) dispara encontro selvagem real (`#battle-screen` ativo).
6. **Saída Norte para Viridian City e Retorno ao Laboratório**: diálogo de travessia exibido (`open: true, hasViridian: true`), botão `VOLTAR` com recuo seguro e retorno sul confirmado para `pallet-lab-3q` em `[452, 86]`.
7. **Editor Visual V6 (`tools/collision-editor-v4.html`) e Layouts Responsivos**: seletor exibindo as 6 áreas, overlay SDF + camada de grama alta ativos, e capturas limpas em Desktop (`1280×720`), Mobile Retrato (`390×844`) e Mobile Paisagem (`844×390`).

## 3. Mídia de Validação Incluída em `MIDIA_VALIDACAO/`
- `pilot_v6_walkthrough.mp4`: Vídeo H.264 (`yuv420p`, `960×540`, ~`128s`) percorrendo todas as 6 áreas, escadaria do Laboratório, grama alta/batalha na Nova Rota 1 e retorno.
- `pilot_v6_01_centro_desktop.jpg` a `pilot_v6_06_rota1_desktop.jpg`: Capturas das 6 áreas em Desktop.
- `pilot_v6_03b_lab_arch_occlusion.jpg`: Oclusão real do treinador sob o arco `"Rota 1"`.
- `pilot_v6_06b_rota1_battle.jpg`: Batalha selvagem na Nova Rota 1.
- `pilot_v6_debug_sdf_rota1.jpg`: Overlay SDF em tempo real na Nova Rota 1.
- `pilot_v6_mobile_portrait.jpg` e `pilot_v6_mobile_landscape.jpg`.
- `pilot_v6_editor_rota1.jpg`: Editor Visual V6 carregando `pallet-arredores-3q`.

## V6.1 — Validação Local e E2E
- `tools/build_walkmasks_v6.py`: `components_r11_count == 1` para `centro`, `jardins`, `lab`, `costa`, `colinas` e `rota1`.
- Todos os spawns de portais e mapas validados com `SDF >= 13.0` (`costa` píer `SDF=35.5..39.75`, `from_jardins` `17.5`, `from_centro` `41.25`, `colinas-to-lab` `16.0`).
- E2E Chromium (`test_anime3q_v6.mjs`): 6/6 mapas com `componentCount === 1`, navegação completa até o píer com `fishVisible: true`, batalha selvagem na Rota 1, `Errors count: 0`, `404 count: 0`.

## Validação V6.2 (Tiles `--edge` + Chromium E2E)
- Inspeção visual em *tiles* de 20px (`tools/render_audit_tiles.py lab 3 3 --edge` e `colinas 3 3 --edge`) confirmando `SDF < 11` em todos os 11 pontos das capturas enviadas.
- `python3 tools/build_walkmasks_v6.py`: `components_r11_count === 1` em todas as 6 áreas.
- `test_anime3q_v6.mjs` no Chromium: `Errors count: 0`, `404 count: 0`, subida completa da escadaria esquerda do Laboratório (`(312, 486)` -> `(192, 342)` -> `(546, 72)`) e passagem para `pallet-arredores-3q`.

## Validação V6.3 (Regressão 22/22 + Editor de Pincel no Chromium Desktop & Mobile)
- `python3 tools/build_walkmasks_v6.py`: `components_r11_count === 1` em todas as 6 áreas + `22/22 pontos OK, 0 falha(s)` em `tools/obstacle_regression.py`.
- `test_editor_brush.mjs` no Chromium:
  - Modo normal (`?visual=anime3q`): painel `#a3q-brush-panel` ausente (`false`).
  - Modo editor (`?visual=anime3q&debug=editor`, Desktop `1280×800`): **Borracha** bloqueia terreno (`zeroBefore: 1522 -> 1647`), treinador permanece imóvel em `(600, 430)`, **Desfazer** restaura `1522`, **Pincel** restaura caminhabilidade (`1522`), **Exportar** baixa `pallet-centro-3q_walkmask.png` e `pallet-centro-3q_sdf.png`.
  - Mobile Touch (`390×844`, `hasTouch: true`): toque no painel e traço na tela funcionais (`1522 -> 1550`, `canUndo: true`).
  - `Errors count: 0` no gameplay normal (`test_anime3q_v6.mjs`) e no modo editor (`test_editor_brush.mjs`).

