# 04 — COMO EXECUTAR, RECONSTRUIR E TESTAR A V5

## 1. Preview Online na Vercel
A URL direta da preview jogável V5 (atualizada após o push da branch isolada `visual/pallet-anime3q-prototype-v1`) abre o protótipo com `?visual=anime3q` ativado, sem alterar `main` nem o jogo em produção.
- Modo Dev com Overlay SDF pixel-exact: adicionar `&debug=editor` à URL.
- Editor Visual Standalone: abrir `/tools/collision-editor-v4.html`.

## 2. Executar Localmente e Regenerar os Mapas SDF
```bash
git clone https://github.com/dioh-cpu/psyworld.git
cd psyworld
git checkout visual/pallet-anime3q-prototype-v1

# (Opcional) Reconstruir walkmasks e mapas SDF 1200x675 a partir do código-fonte geométrico:
python3 tools/build_walkmasks_v5.py

# Subir servidor HTTP local:
python3 -m http.server 8080
```
Abra `http://localhost:8080/?visual=anime3q` no navegador.

## 3. Comandos de Diagnóstico no Console do Navegador
```javascript
// Confirmar versão V5 e decodificação dos buffers SDF
window.PsyKantoAnime3Q.version;        // 5
window.PsyKantoAnime3Q.isSdfReady();   // true

// Consultar distância exata até o obstáculo mais próximo e normal de deslizamento
window.PsyKantoAnime3Q.sdfDist('pallet-jardins-3q', 690, 240);
window.PsyKantoAnime3Q.sdfNormal('pallet-jardins-3q', 690, 247);

// Verificar conectividade de malha (deve retornar componentCount: 1 em r=11)
window.PsyKantoAnime3Q.analyzeConnectivity('pallet-centro-3q', 4, 11);
window.PsyKantoAnime3Q.analyzeConnectivity('pallet-jardins-3q', 4, 11);

// Alternar overlay visual SDF (verde >= 11px, amarelo < 11px, vermelho = sólido)
window.PsyKantoAnime3Q.setDebugOverlay(true);
```
