# 03 — ARQUITETURA E ARQUIVOS (V5)

## Pipeline de Colisão Pixel-Exact + SDF (V5)
| Arquivo | Papel Técnico |
| :--- | :--- |
| `tools/build_walkmasks_v5.py` | Gera bitmaps `1200×675` exatos (`centro_walkmask.png`, `jardins_walkmask.png`), calcula a Transformada de Distância Euclidiana 2D exata (Felzenszwalb & Huttenlocher) em NumPy salvando `centro_sdf.png` e `jardins_sdf.png`, valida componente único em `r=11` e gera imagens de auditoria. |
| `assets/story/pallet/anime3q/walkmasks/centro_walkmask.png` | Máscara binária `1200×675` de terreno caminhável para *Centro e Residências* (`4.1 KB`). |
| `assets/story/pallet/anime3q/walkmasks/centro_sdf.png` | Mapa 2D SDF pré-computado de *Centro e Residências* (`val = dist * 4`, `29.0 KB`). |
| `assets/story/pallet/anime3q/walkmasks/jardins_walkmask.png` | Máscara binária `1200×675` de terreno caminhável para *Jardins e Bosque* (`5.2 KB`). |
| `assets/story/pallet/anime3q/walkmasks/jardins_sdf.png` | Mapa 2D SDF pré-computado de *Jardins e Bosque* (`val = dist * 4`, `32.2 KB`). |
| `core/kanto-anime3q-pilot-v1.js` | Motor V5 do piloto Anime 3/4: decodifica os SDFs para `Uint8Array`, fornece `sdfDist()`, `sdfNormal()`, `walkable()` com `r=11` exato, `whenReady()`, overlay SDF pixel-exact (`drawDebugOverlay`), renderização WebGL2 `1672×941` e oclusão RGBA (`masks/*.png`). |
| `core/kanto-world-v2.js` | Preserva câmera/zoom da V2, escalas `1.56`/`1.18` da V3, invalidação de cache `navCells` no `whenReady()` e deslizamento tangencial por gradiente SDF em `move()`. |
| `tools/collision-editor-v4.html` | Editor visual atualizado com camada `SDF V5 (r=11)`, leitura exata de distância SDF sob o cursor e visualização conjunta de oclusores/portais. |
| `assets/story/pallet/anime3q/masks/*.png` | 9 sprites RGBA de silhueta de primeiro plano (postes e copas de árvores) alinhados com as artes `1672×941`. |
