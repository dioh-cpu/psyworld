# 05 — DECISÕES TÉCNICAS, TOPOLOGIA DAS 6 ÁREAS E OCLUSORES (V6)

## 1. Arquitetura Unificada (`1200×675` Lógico + 2D SDF Subpixel)
Todas as 6 artes originais (tanto as `1672×941` de Centro/Jardins quanto as `1024×576` de Lab/Costa/Colinas/Rota 1) compartilham o espaço lógico unificado `1200×675` (`16:9`). Isso permite:
- Raycast/lookup `O(1)` uniforme via `Uint8Array(1200×675)` com precisão de `0.25 px` (`val = dist * 4`, até `63.75 px`).
- Raio físico consistente (`PLAYER_RADIUS = 11`) e deslizamento tangencial por gradiente `sdfNormal()` em escadas, ponte em arco, píer, rampas de pedreira e trilhas da Rota 1.
- Spawns de chegada em todos os portais posicionados com margem mínima `sdf >= 20.5 px`, evitando bloqueios ou reacionamentos imediatos junto a `portalCooldownUntil = 950ms`.

## 2. Grafo Topológico e Coordenadas de Portais Bidirecionais
| Origem | Portal ID | Retângulo do Portal `[x1,y1,x2,y2]` | Destino | Spawn Seguro `[x,y]` | Direção |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `pallet-centro-3q` | `centro-to-lab` | `[552, 0, 656, 36]` | `pallet-lab-3q` | `[656, 598]` | `up` |
| `pallet-lab-3q` | `lab-to-centro` | `[545, 636, 776, 675]` | `pallet-centro-3q` | `[604, 74]` | `down` |
| `pallet-centro-3q` | `centro-to-jardins` | `[1155, 130, 1200, 240]` | `pallet-jardins-3q` | `[98, 225]` | `right` |
| `pallet-jardins-3q` | `jardins-to-centro` | `[0, 135, 45, 290]` | `pallet-centro-3q` | `[1125, 228]` | `left` |
| `pallet-centro-3q` | `centro-to-costa` | `[560, 636, 730, 675]` | `pallet-costa-3q` | `[608, 72]` | `down` |
| `pallet-costa-3q` | `costa-to-centro` | `[525, 0, 685, 38]` | `pallet-centro-3q` | `[642, 598]` | `up` |
| `pallet-centro-3q` | `centro-to-colinas` | `[0, 150, 42, 232]` | `pallet-colinas-3q` | `[1124, 282]` | `left` |
| `pallet-colinas-3q` | `colinas-to-centro` | `[1155, 240, 1200, 340]` | `pallet-centro-3q` | `[74, 212]` | `right` |
| `pallet-jardins-3q` | `jardins-to-costa` | `[548, 636, 725, 675]` | `pallet-costa-3q` | `[1114, 74]` | `down` |
| `pallet-costa-3q` | `costa-to-jardins` | `[1095, 0, 1190, 42]` | `pallet-jardins-3q` | `[622, 598]` | `up` |
| `pallet-colinas-3q` | `colinas-to-costa` | `[438, 636, 538, 675]` | `pallet-costa-3q` | `[118, 70]` | `down` |
| `pallet-costa-3q` | `costa-to-colinas` | `[72, 0, 172, 42]` | `pallet-colinas-3q` | `[462, 608]` | `up` |
| `pallet-lab-3q` | `lab-to-rota1` | `[498, 24, 596, 66]` | `pallet-arredores-3q` | `[570, 598]` | `up` |
| `pallet-arredores-3q` | `rota1-to-lab` | `[498, 636, 642, 675]` | `pallet-lab-3q` | `[452, 86]` | `down` |
| `pallet-arredores-3q` | `rota1-to-viridian` | `[730, 0, 835, 28]` | `exitWorld` (Viridian City) | — | `up` |

## 3. Portas, NPCs, Grama Alta e Hobbies por Cenário
- **Portas de Interiores (`PsyKantoInteriorsV9`)**: `home` (`[350,222]`, Centro), `house-east` (`[975,220]`, Centro), `center` (`[265,132]`, Jardins), `lab` (`[638,304]`, Lab), `house-west` (`[292,204]`, Costa), `market` (`[295,285]`, Colinas).
- **NPCs**: Rival (`[500,385]`, Centro), Mina (`[215,320]`, Jardins), Professor Carvalho (`[528,448]` com sprite de corpo inteiro `professor-v33.webp`, Lab), Pesquisador Elias (`[760,362]`, Lab), Seu Abel (`[848,286]`, Costa), Luna (`[248,308]`, Colinas), Exploradora Nara (`[632,372]`, Rota 1).
- **Canteiros de Grama Alta (`pallet-arredores-3q` / Nova Rota 1)**:
  - Campo A: `[210, 68, 470, 174]` (entrada `[242, 165]`)
  - Campo B: `[710, 158, 1005, 256]` (entrada `[915, 255]`)
  - Campo C: `[895, 325, 1142, 425]` (entrada `[915, 325]`)
- **Hobbies (`core/hobbies-v2.js`)**: Pesca na ponte/riacho de Jardins (`[690,240,r=65]`) e no píer/praia de Costa (`[830,435,r=75]`, `[500,395,r=70]`, `[200,480,r=75]`); Mineração/Coleta nos trilhos/veios de Colinas e clareiras da Rota 1.

## 4. Tabela Completa dos 18 Oclusores RGBA
- **V4/V5 (9 máscaras preservadas)**: `centro-lamp-west`, `centro-lamp-nw`, `centro-lamp-ne`, `centro-cherry-canopy`, `jardins-lamp-west`, `jardins-lamp-central`, `jardins-lamp-east`, `jardins-cherry-canopy`, `jardins-great-tree-canopy`.
- **V6 (9 novas máscaras RGBA em `masks/`)**:
  - `lab-rota1-arch` (`masks/lab_rota1_arch.png`, `[462, 4, 628, 86]`, `baselineY: 78`) — oclusão natural sob o arco `"Rota 1"`.
  - `lab-lamp-sw` (`[402, 404, 434, 492]`, `486`), `lab-lamp-se` (`[877, 418, 909, 498]`, `492`), `lab-lamp-mid-left` (`[121, 246, 153, 336]`, `330`).
  - `costa-lamp-plaza-right` (`[781, 170, 813, 248]`, `242`), `costa-lamp-pier` (`[893, 332, 925, 412]`, `406`).
  - `colinas-lamp-upper` (`[950, 190, 982, 284]`, `278`).
  - `rota1-lamp-crossroads` (`[357, 224, 389, 342]`, `336`), `rota1-signpost` (`[556, 240, 590, 336]`, `330`).

## V6.1 — Medição por Tiles 20px
- Substituição da estimativa visual em grade de 50px por medição direta nos tiles de `tools/render_audit_tiles.py <area> 3 3 --edge`.
- Garantia de `components_r11_count == 1` tanto na verificação Python quanto no verificador JS (`step=2/4/6`) em todas as 6 áreas.
