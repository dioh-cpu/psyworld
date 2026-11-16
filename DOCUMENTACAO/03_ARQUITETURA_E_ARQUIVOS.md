# 03 — ARQUITETURA E ARQUIVOS (V6)

## Mapeamento Técnico de Arquivos
| Arquivo | Papel Técnico na V6 |
| :--- | :--- |
| `core/kanto-anime3q-pilot-v1.js` | Motor V6 (`version: 6`) com o dicionário completo dos **6 mapas** (`pallet-centro-3q`, `pallet-jardins-3q`, `pallet-lab-3q`, `pallet-costa-3q`, `pallet-colinas-3q`, `pallet-arredores-3q`), portais bidirecionais, spawns seguros (`sdf >= 20.5`), retângulos de grama alta (`isRoute1`), NPCs, 6 portas de interiores (`PsyKantoInteriorsV9`), decodificação de SDFs (`sdfDist`, `sdfNormal`, `walkable`) e 18 oclusores RGBA. |
| `core/kanto-world-v2.js` | Integração de mundo completo: `portalCooldownUntil` + `.kw2-fade`, entrada de Pallet (`pallet-centro-3q`) e Rota 1 (`pallet-arredores-3q`), mapeamento seguro de retorno de Viridian City (`[848,95] -> [762,54]`), encontros selvagens e `setAutoHunt` em `isRoute1`, desenho de marcadores/portais/saídas e desenho do `palletActor` em todas as 6 áreas. |
| `core/hobbies-v2.js` | Adicionados pontos de mineração/coleta (`FIELD`) em `pallet-colinas-3q` e `pallet-arredores-3q` e zonas de pesca (`WATER`) em `pallet-jardins-3q` e `pallet-costa-3q` (píer e praia). |
| `index.html` | Cache-busting `?build=` atualizado nos scripts `kanto-anime3q-pilot-v1.js`, `kanto-world-v2.js` e `hobbies-v2.js`. |
| `tools/build_walkmasks_v6.py` | Gerador offline das 4 novas walkmasks e SDFs `1200×675` (`lab`, `costa`, `colinas`, `rota1`), preservando `centro` e `jardins`, e validação automática de `componentCount === 1` em `r=11`. |
| `tools/build_occluders_v6.py` | Extrator offline dos 9 novos oclusores RGBA em primeiro plano (`lab_rota1_arch.png`, postes do Lab, Costa, Colinas e placa/poste da Rota 1). |
| `tools/collision-editor-v4.html` | Editor visual standalone com seletor de 6 áreas, carregamento de todos os SDFs V6, camada `#chkGrass` e exportação JSON. |
| `assets/story/pallet/anime3q/01..06*.png` | As 6 artes originais em HD (`1672×941` para Centro/Jardins e `1024×576` para Lab/Costa/Colinas/Rota 1). |
| `assets/story/pallet/anime3q/walkmasks/*` | 12 arquivos `1200×675`: `{centro,jardins,lab,costa,colinas,rota1}_walkmask.png` e `*_sdf.png`. |
| `assets/story/pallet/anime3q/masks/*.png` | 18 máscaras RGBA transparentes de primeiro plano (9 da V4/V5 + 9 da V6). |
| `assets/story/pallet/anime3q/pallet_anime3q_geometry_v6.json` | Exportação completa da geometria, portais, portas, grama alta, NPCs e oclusores dos 6 mapas. |

### Adições V6.1
- `tools/render_audit_tiles.py`: Gerador de tiles 3×3 ampliados com grade de 20px e contornos `--edge` (vermelho = borda da máscara; ciano = limite `SDF >= 11`).
- `core/hobbies-v2.js`: Zonas `WATER['pallet-costa-3q']` ampliadas para cobrir todo o píer de pesca (`[960,440,90]`, `[1080,470,95]`).
- `core/kanto-anime3q-pilot-v1.js`: Spawn `colinas-to-lab` ajustado para `[452,108]` (`SDF=16.0`).

### Adições V6.3
- `tools/obstacle_regression.py` e `tools/obstacle_regression.json`: Suíte de regressão com 22 pontos (spawns, obstáculos sólidos e escadaria do Lab) executada automaticamente ao final de `tools/build_walkmasks_v6.py`.
- `core/anime3q-walkmask-brush.js`: Núcleo de edição de walkmask e recálculo 2D EDT/SDF em JavaScript (`computeEdt`, `sdfToU8`, `createEditor`), carregado sob demanda apenas em `?visual=anime3q&debug=editor`.
- `core/kanto-anime3q-pilot-v1.js` e `core/kanto-world-v2.js`: Painel `#a3q-brush-panel`, preview ao vivo (`SDF=11` ciano) e interceptação de ponteiro (`brushActive` / `brushPointer`) em `touchStart`/`touchMove`/`touchEnd`/`touchCancel`.

