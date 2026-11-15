# 05 — DECISÕES TÉCNICAS, MASCARAÇÃO DE 10 PRINTS E OCLUSORES

## 1. Por que Signed Distance Fields (2D SDF) em vez de Polígonos Manuais?
1. **Complexidade O(1) por consulta**: `sdfDist(id, x, y)` faz apenas 4 leituras em `Uint8Array(1200×675)` + interpolação bilinear — independente de quantas curvas, degraus, pedras, cercas ou rios existam no cenário.
2. **Precisão Euclidiana Subpixel (`0.25 px`)**: Calculado offline via Transformada de Distância Euclidiana Exata de Felzenszwalb & Huttenlocher (`tools/build_walkmasks_v5.py`). Cada pixel codifica `min(255, round(dist * 4))`, permitindo checar qualquer raio (`PLAYER_RADIUS = 11` → `dist >= 11.0`) sem aproximação poligonal de 8 ou 16 lados.
3. **Deslizamento Tangencial Suave em Bordas Curvas/Diagonais (`sdfNormal`)**: Em vez de projeção restrita aos eixos `X` e `Y` (que trava na balaustrada inclinada ou no arco da ponte), a normal interna unitária obtida do gradiente do SDF permite deslizar continuamente tangenciando o contorno seguro (`sdf >= 11`).

## 2. Mapeamento Exato dos 10 Prints Corrigidos na V5 (`1200×675` Lógico)
| Print Original | Cenário | Problema Observado | Correção Pixel-Exact na V5 |
| :--- | :--- | :--- | :--- |
| `161931` | Centro | Treinador sobre mureta noroeste e vaso de barro (`x=115..274, y=175..270`) | Contorno da mureta + recorte sólido até `y=270` e vaso vedado; acesso à porta apenas pelo vão da varanda (`x=388..425`). |
| `161942` | Centro | Treinador sobre rocha cinza e cerca sudoeste (`x=340..440, y=426..510`) | Borda sul-oeste da praça ajustada exatamente ao norte das rochas, cercas de madeira e cerca verde oeste. |
| `161949` | Centro | Treinador pisando na balaustrada oeste da escada sul (`x=500..558, y=502..675`) | Escada sul limitada estritamente aos degraus internos (`x=556..700` no topo até `596..748` na base). |
| `162009` | Jardins | Treinador dentro do canteiro elevado e cerca da cabana noroeste (`x=50..265, y=125..232`) | Todo o terraço florido bloqueado; única subida pelas escadas diagonais (`[242,124]..[344,178]..[262,206]`). |
| `162040` / `162045` | Jardins | Treinador na balaustrada direita, luminária e flores da escada sul (`x=612..710, y=495..648`) | Escada sul isolada entre ambas as balaustradas sólidas + recorte circular para o poste (`[682,502,712,534]`). |
| `162105` | Jardins | Treinador dentro da água e pedras a sudeste da ponte (`x=730..850, y=280..440`) | Todo o leito do riacho, vitórias-régias, banco leste e pedras recortados; trilha mantida apenas pelas pedras de passagem a leste (`x=882..928`). |
| `162136` / `162139` | Jardins | Treinador em cima do parapeito curvo sul da ponte (`y≈250..275`) | Tabuleiro da ponte esculpido por curvas quadráticas de Bézier (`top/bot ~33–35px` livre) com margem `sdf >= 11` mantendo os pés fora de ambos os parapeitos. |
| `162143` | Jardins | Treinador entrando no parapeito norte e pedras da cachoeira (`x=595..710, y=150..232`) | Cachoeira e margens norte recortadas acompanhando a curvatura superior do arco da ponte. |

## 3. Tabela de Oclusores por Silhueta RGBA (Preservados da V4)
| Cenário | ID do Oclusor | Arquivo de Máscara RGBA | Retângulo Lógico `[x1, y1, x2, y2]` | `baselineY` |
| :--- | :--- | :--- | :--- | :--- |
| `pallet-centro-3q` | `centro-lamp-west` | `masks/centro_lamp_west.png` | `[433.49, 248.19, 462.20, 350.05]` | `348` |
| `pallet-centro-3q` | `centro-lamp-nw` | `masks/centro_lamp_nw.png` | `[485.89, 98.27, 514.59, 195.83]` | `194` |
| `pallet-centro-3q` | `centro-lamp-ne` | `masks/centro_lamp_ne.png` | `[730.62, 108.32, 759.33, 195.83]` | `194` |
| `pallet-centro-3q` | `centro-cherry-canopy` | `masks/centro_cherry_canopy.png` | `[665, 0, 910, 145]` | `172` |
| `pallet-jardins-3q` | `jardins-lamp-west` | `masks/jardins_lamp_west.png` | `[48.09, 205.87, 76.79, 296.25]` | `294` |
| `pallet-jardins-3q` | `jardins-lamp-central` | `masks/jardins_lamp_central.png` | `[538.28, 152.07, 566.99, 248.19]` | `246` |
| `pallet-jardins-3q` | `jardins-lamp-east` | `masks/jardins_lamp_east.png` | `[854.07, 238.15, 882.78, 334.27]` | `332` |
| `pallet-jardins-3q` | `jardins-cherry-canopy` | `masks/jardins_cherry_canopy.png` | `[690, 62, 850, 168]` | `186` |
| `pallet-jardins-3q` | `jardins-great-tree-canopy` | `masks/jardins_great_tree_canopy.png` | `[845, 0, 1085, 92]` | `118` |
