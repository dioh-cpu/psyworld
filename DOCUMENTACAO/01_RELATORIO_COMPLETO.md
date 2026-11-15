# 01 — RELATÓRIO COMPLETO (PSYWORLD — PALLET TOWN ANIME HD 3/4 V6)

## 1. Identificação Técnica
- **Repositório**: `dioh-cpu/psyworld`
- **Branch Isolada**: `visual/pallet-anime3q-prototype-v1` (sem alterações na `main` nem em produção)
- **Commit Base (V5)**: `4f466b6`
- **Sistema V6**: Mundo completo de Pallet Town em **6 áreas HD interconectadas** + **Nova Rota 1**, mantendo integralmente o motor de colisão **Pixel-Exact Walkmask (`1200×675`) + 2D Euclidean SDF**, deslizamento tangencial por gradiente SDF (`sdfNormal`), câmera e zoom da V2, escala visual de 200% do treinador (`characterScale: 1.56`) e acompanhante proporcional (`followerScale: 1.18`) da V3, oclusão por silhuetas RGBA (`masks/*.png`) e renderizador WebGL2 HD.

## 2. Objetivo Original da V6
Integrar as **6 artes definitivas de Pallet Town** em um mundo continuamente explorável com caminhos geograficamente coerentes, transições bidirecionais seguras (`sdf >= 20.5 px`), colisões pixel-exact, oclusores de primeiro plano, sistema de Hobbies (pesca e mineração/coleta) e acesso real à **Nova Rota 1** com campos de grama alta, encontros selvagens e passagem ao norte para **Viridian City**.

## 3. Tudo Que Foi Realizado na V6
1. **Unificação das 6 Áreas de Pallet Town (`core/kanto-anime3q-pilot-v1.js` v6)**:
   - `01` `pallet-centro-3q` (*Centro e Residências* — `01_centro_residencias.png`, `1672×941`)
   - `02` `pallet-jardins-3q` (*Jardins e Bosque* — `02_jardins_bosque.png`, `1672×941`)
   - `03` `pallet-lab-3q` (*Laboratório do Prof. Carvalho* — `03_laboratorio.png`, `1024×576`)
   - `04` `pallet-costa-3q` (*Costa e Praia* — `04_costa_praia.png`, `1024×576`)
   - `05` `pallet-colinas-3q` (*Colinas e Pedreiras* — `05_colinas_pedreiras.png`, `1024×576`)
   - `06` `pallet-arredores-3q` (*Rota 1 · Arredores de Pallet Town* — `06_arredores_rota1.png`, `1024×576`, `isRoute1: true`)
2. **Walkmasks & 2D SDF Pixel-Exact das 4 Novas Áreas (`tools/build_walkmasks_v6.py`)**:
   - Geradas máscaras `1200×675` e campos SDF (`val = clamp(round(dist * 4), 0, 255)`) para `lab`, `costa`, `colinas` e `rota1`, preservando `centro` e `jardins` da V5.
   - Conectividade matemática validada em `componentCount === 1` para **todas as 6 áreas** em `PLAYER_RADIUS = 11`.
   - Em `pallet-lab-3q`, esculpida a subida completa em 3 lances pela escadaria esquerda até o portal superior do arco `"Rota 1"` (`[498,24,596,66]`).
   - Em `pallet-colinas-3q`, rampa leste e terraço da mina alargados garantindo continuidade única (`componentCount: 1`) entre leste, sul e trilho de mineração.
   - Em `pallet-arredores-3q`, cercas de madeira, placa central, rochas, postes e lagos totalmente bloqueados, deixando os vãos de entrada para os 3 canteiros cercados de grama alta (`a`, `b`, `c`).
3. **Oclusores de Silhueta RGBA V6 (`tools/build_occluders_v6.py`)**:
   - Adicionadas 9 novas máscaras RGBA transparentes em `assets/story/pallet/anime3q/masks/`, com destaque para o **arco de pedra `"Rota 1"`** (`lab_rota1_arch.png`, `baselineY: 78`) que cobre a cabeça do treinador ao atravessar sob o pórtico.
4. **Conexões Bidirecionais, Rota 1 & Hobbies (`core/kanto-world-v2.js` e `core/hobbies-v2.js`)**:
   - Portais bidirecionais completos entre os 6 mapas com cooldown anti-rebote (`portalCooldownUntil = 950ms`) e transição visual suave (`.kw2-fade`).
   - Integração da Nova Rota 1 (`pallet-arredores-3q`) com encontros selvagens nos 3 campos de grama alta, `setAutoHunt()` compatível com `isRoute1`, diálogo de saída para Viridian City ao norte e botão `VOLTAR` com recuo seguro ao sul.
   - Adicionados pontos de **Pesca (`WATER`)** em `pallet-jardins-3q` e `pallet-costa-3q` (píer e praia) e pontos de **Mineração/Coleta (`FIELD`)** em `pallet-colinas-3q` e `pallet-arredores-3q`.
5. **Correção Visual de NPC no Laboratório**:
   - Durante a inspeção visual das capturas V6, identificou-se que o sprite anterior do Professor Carvalho (`assets/story/professor-oak.png`) era um retrato de meio-corpo. Substituído no overworld pelo sprite de corpo inteiro `assets/kanto/npcs/professor-v33.webp`, mantendo o retrato de diálogo original em `portrait`.
6. **Editor Visual Atualizado (`tools/collision-editor-v4.html`)**:
   - Seletor atualizado para todas as 6 áreas, carregamento dos 6 SDFs V6, nova camada visual `#chkGrass` para canteiros de grama alta e exportação `assets/story/pallet/anime3q/pallet_anime3q_geometry_v6.json`.

## 4. Decisões Técnicas Preservadas
- **Câmera / Zoom V2**: inalterados (`targetScale` responsivo em Desktop, Mobile Retrato e Paisagem).
- **Escalas V3**: treinador em `1.56` (200%) e acompanhante em `1.18`.
- **Colisão V5**: raio físico integral `PLAYER_RADIUS = 11` sem encolhimento de hitbox e deslizamento tangencial por `sdfNormal`.
- **Cache-busting (`index.html`)**: atualizado parâmetro `?build=` em `kanto-anime3q-pilot-v1.js`, `kanto-world-v2.js` e `hobbies-v2.js`.

## 5. Resultados Efetivamente Comprovados
- Todos os 6 mapas possuem `componentCount === 1` no runtime (`PLAYER_RADIUS = 11`).
- Travessia contínua real em Chromium percorrendo Centro ↔ Jardins ↔ Costa ↔ Colinas ↔ Centro ↔ Laboratório ↔ subindo as 3 escadarias esquerdas até o arco Rota 1 ↔ Nova Rota 1 ↔ batalha selvagem na grama alta ↔ diálogo de saída para Viridian ↔ retorno ao Laboratório, com **zero erros de console e zero HTTP 404**.
