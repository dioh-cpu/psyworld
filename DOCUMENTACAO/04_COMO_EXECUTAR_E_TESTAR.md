# 04 — COMO EXECUTAR, RECONSTRUIR E TESTAR A V6

## 1. Preview Online na Vercel
A URL direta da preview jogável V6 (publicada após o push na branch isolada `visual/pallet-anime3q-prototype-v1`) inicia o jogo com `?visual=anime3q` ativado, sem modificar `main` nem o ambiente de produção.
- **Modo Dev / Overlay SDF**: adicionar `&debug=editor` à URL.
- **Editor Visual Standalone (6 Áreas)**: abrir `/tools/collision-editor-v4.html`.

## 2. Executar Localmente e Regenerar Walkmasks/Oclusores V6
```bash
git clone https://github.com/dioh-cpu/psyworld.git
cd psyworld
git checkout visual/pallet-anime3q-prototype-v1

# (Opcional) Regenerar walkmasks/SDFs das 4 novas áreas e os 9 novos oclusores RGBA:
python3 tools/build_walkmasks_v6.py
python3 tools/build_occluders_v6.py

# Subir servidor HTTP local:
python3 -m http.server 8080
```
Abra `http://localhost:8080/?visual=anime3q` no navegador.

## 3. Comandos de Diagnóstico no Console do Navegador
```javascript
// Confirmar versão V6 e carregamento dos 6 buffers SDF
window.PsyKantoAnime3Q.version;        // 6
window.PsyKantoAnime3Q.listMaps();     // 6 áreas (centro, jardins, lab, costa, colinas, arredores)
window.PsyKantoAnime3Q.isSdfReady();   // true

// Verificar conectividade de todos os 6 mapas em r=11 (componentCount deve ser 1 em todos)
window.PsyKantoAnime3Q.listMaps().map(id => ({
  id,
  ...window.PsyKantoAnime3Q.analyzeConnectivity(id, 6, 11)
}));

// Consultar distância exata SDF e normal de deslizamento tangencial
window.PsyKantoAnime3Q.sdfDist('pallet-lab-3q', 548, 78);
window.PsyKantoAnime3Q.sdfNormal('pallet-colinas-3q', 1124, 282);

// Ativar overlay SDF em tempo real (verde >= 11px, amarelo < 11px, vermelho = sólido)
window.PsyKantoAnime3Q.setDebugOverlay(true);

// Exportar JSON atualizado das 6 áreas
window.PsyKantoAnime3Q.exportGeometryJSON();
```
