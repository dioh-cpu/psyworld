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
