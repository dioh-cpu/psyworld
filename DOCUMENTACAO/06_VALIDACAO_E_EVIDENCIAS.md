# 06 — VALIDAÇÃO AUTOMATIZADA E EVIDÊNCIAS VISUAIS (V5)

## 1. Conectividade Matemática em Runtime (`r = 11`, SDF Euclidiano)
Verificação executada no Chromium real via `window.PsyKantoAnime3Q.analyzeConnectivity(..., 4, 11)` sobre os buffers `1200×675` carregados via HTTP:
- **`pallet-centro-3q`**: `componentCount: 1` (18.794 células válidas em componente único no passo 3 offline; 100% conectado em runtime no passo 4, zero ilhas isoladas).
- **`pallet-jardins-3q`**: `componentCount: 1` (12.145 células válidas em componente único no passo 3 offline; 100% conectado em runtime no passo 4, cruzando livremente a ponte curva e toda a trilha do bosque).

## 2. Verificação Estática e Física Real nos 10 Prints Reportados
Todas as 23 coordenadas extraídas diretamente das 10 capturas do usuário (`161931`, `161942`, `161949`, `162009`, `162040`, `162045`, `162105`, `162136`, `162139`, `162143`) retornaram `walkable === false`. Em testes reais pressionando teclas direcionais (`ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight`) por ~1–2s contra cada obstáculo:
- **Mureta + vaso noroeste (Centro)**: treinador contido e deslizado mantendo `sdf >= 10.9` e `y >= 255`.
- **Rocha e cerca sudoeste (Centro)**: treinador contido em `sdf >= 10.8`.
- **Balaustrada oeste da escada sul (Centro)**: treinador contido em `x >= 568`.
- **Canteiro elevado da cabana noroeste (Jardins)**: treinador contido ao sul em `y >= 220` (`y=239.72, sdf=12.79`).
- **Travessia da Ponte Curva (Jardins)**: segurando apenas `ArrowRight` desde `(584, 260)`, o treinador atravessa suavemente todo o arco da ponte pelo contorno tangencial do SDF até `x = 983.42, y = 247.95` (`sdf = 11.05`) sem nunca pisar sobre o parapeito sul ou norte.
- **Riacho e pedras a sudeste da ponte (Jardins)**: treinador contido fora da água (`x=840.57, y=386.14, sdf=14.01`).
- **Balaustrada direita da escada sul (Jardins)**: treinador contido nos degraus (`x=633.96, sdf=12.38`).
- **Transições de Portal Bidirecionais**: `Centro → Jardins` e `Jardins → Centro` funcionais sem falhas.

## 3. Mídia de Validação Incluída em `MIDIA_VALIDACAO/`
- `pilot_v5_walkthrough.mp4`: Vídeo H.264 (`1280×720`, 25 fps, `yuv420p`, `22.64s`, `4.90 MB`) cobrindo testes de colisão nos 10 locais, overlay SDF em ambos os cenários, travessia da ponte curva e transição pelos dois portais.
- `pilot_v5_centro_desktop.png`, `pilot_v5_jardins_desktop.png`, `pilot_v5_bridge_walk.png`: Capturas limpas em Desktop (`1280×720`).
- `pilot_v5_debug_sdf_centro.png`, `pilot_v5_debug_sdf_jardins.png`: Overlay SDF em tempo real dentro do jogo (`verde >= 11px`, `amarelo < 11px`, `vermelho = sólido`).
- `pilot_v5_mobile_portrait.png` (`390×844`) e `pilot_v5_mobile_landscape.png` (`844×390`).
- `pilot_v5_editor_sdf.png`: Editor Visual (`tools/collision-editor-v4.html`) exibindo a camada SDF V5 + oclusores.
