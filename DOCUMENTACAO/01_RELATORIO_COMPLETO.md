# 01 — RELATÓRIO COMPLETO (PSYWORLD — PALLET ANIME HD 3/4 V5)

## 1. Identificação Técnica
- **Repositório**: `dioh-cpu/psyworld`
- **Branch**: `visual/pallet-anime3q-prototype-v1`
- **Commit Base (V4)**: `65590200fc6c345170b9536f06ce47b37fc74911`
- **Sistema V5**: Colisões Pixel-Exact (`1200×675` Walkmask PNG) + Campo de Distância Euclidiano Exato (2D SDF) + Deslizamento Tangencial Suave por Gradiente SDF (`sdfNormal`)
- **Preservação Integral**: Câmera e zoom da V2, escala de 200% do treinador (`characterScale: 1.56`), escala do Pokémon acompanhante (`followerScale: 1.18`), oclusão por silhuetas RGBA (`masks/*.png`), renderizador WebGL2 e artes HD originais `1672×941`.

## 2. Causa Raiz dos Problemas Apontados nos 10 Prints da V4
Ao testar a V4 no celular, o usuário enviou 10 capturas (`Screenshot_20261115-161931` a `162143.Chrome.png`) mostrando pontos onde o personagem ainda pisava em muretas, vasos, cercas, rochas, canteiros, balaustradas, parapeitos da ponte e água. A análise geométrica com grades de `50px` e recortes com zoom de `25px` identificou:
1. Os cenários pintados à mão possuem canteiros curvos, escadas inclinadas/diagonais, ponte em arco e riacho sinuoso que não podiam ser vedados com precisão subpixel apenas por poucos retângulos e polígonos simples (`walkPolys`/`blocks`) da V4.
2. Em bordas curvas/diagonais, projeções axis-aligned (`X` depois `Y`) em `move()` faziam o jogador travar em quinas ou escorregar de forma abrupta.

## 3. Solução Arquitetural da V5 (Walkmasks Pixel-Exact + 2D Euclidean SDF)
1. **Gerador Offline de Walkmasks e SDF (`tools/build_walkmasks_v5.py`)**:
   - Implementado algoritmo exato de Transformada de Distância Euclidiana 2D (`O(W·H)` de Felzenszwalb & Huttenlocher) sobre máscaras de caminhada pixel a pixel `1200×675` para **Centro** e **Jardins**.
   - Gera `assets/story/pallet/anime3q/walkmasks/{centro,jardins}_walkmask.png` e `{centro,jardins}_sdf.png` (escala de distância `0..255` onde `val = clamp(round(dist * 4), 0, 255)`, oferecendo resolução subpixel de `0.25 px` até `63.75 px`).
   - Cada mapa é validado matematicamente pelo analisador de conectividade em componente único (`componentCount === 1`) considerando integralmente `PLAYER_RADIUS = 11`.
2. **Motor Runtime O(1) em `core/kanto-anime3q-pilot-v1.js` (V5)**:
   - Pré-carregamento dos SDF PNGs em `Uint8Array(1200 * 675)`.
   - `sdfDist(id, x, y)`: amostragem bilinear O(1) com resposta contínua em pixels lógicos.
   - `sdfNormal(id, x, y)`: gradiente por diferenças centrais retornando vetor unitário apontando para o interior livre.
   - `walkable(id, x, y, r=11)`: valida `sdfDist(id, x, y) >= r` (100% consistente com raio físico `11`, substituindo testes custosos de polígonos quando os SDFs estão decodificados).
   - `drawDebugOverlay(c, mapId)`: renderiza diretamente a camada SDF pré-computada (vermelho = sólido `dist=0`, amarelo = margem `0 < dist < 11`, verde = área livre `dist >= 11`) mais oclusores e portais.
3. **Deslizamento Tangencial Suave em `core/kanto-world-v2.js`**:
   - Em `move()`, quando o próximo passo entra em bloqueio nos mapas Anime 3/4, projeta a velocidade ao longo da tangente à superfície (`step - min(0, dot(step, n)) * n`) com microajustes ao longo do contorno `n`, garantindo contorno fluido pela ponte curva, fonte circular e muros diagonais sem jamais invadir a zona `sdfDist < 11`.
4. **Todos os 10 Prints Bloqueados com Precisão Pixel-Exact**:
   - `161931` (`Centro` mureta + vaso noroeste), `161942` (`Centro` rocha + cerca sudoeste), `161949` (`Centro` balaustrada oeste da escada sul), `162009` (`Jardins` canteiro elevado + cerca da cabana noroeste), `162040`/`162045` (`Jardins` balaustrada direita + luminária/flores da escada sul), `162105` (`Jardins` água do riacho e pedras a sudeste da ponte), `162136`/`162139` (`Jardins` parapeito sul da ponte em arco) e `162143` (`Jardins` parapeito norte e pedras da cachoeira).

## 4. Resultados Efetivamente Comprovados
- **Conectividade em Runtime (`r = 11, step = 4`)**:
  - `pallet-centro-3q`: `componentCount: 1` (100% conectado, sem ilhas isoladas).
  - `pallet-jardins-3q`: `componentCount: 1` (100% conectado, sem ilhas isoladas).
- **Zero Vazamentos nos 10 Pontos Reportados**: Todas as 23 coordenadas extraídas dos 10 prints retornam `walkable === false` e barram fisicamente o treinador em movimento real via teclado no Chromium.
- **Travessia Completa da Ponte Curva via SDF Sliding**: Pressionar apenas `ArrowRight` a partir de `(584, 260)` conduz o treinador suavemente por todo o arco da ponte até o gramado leste (`x = 983.42, y = 247.95, sdf = 11.05`) sem pisar em nenhum dos parapeitos.
- **Zero Erros JS e Zero 404 nos Assets/Scripts do Piloto**.
