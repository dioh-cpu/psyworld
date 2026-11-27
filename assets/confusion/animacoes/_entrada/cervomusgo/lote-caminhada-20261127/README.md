# Cervomusgo — originais de caminhada (lote 2026-11-27)

MP4s originais extraídos de `CWDP_FLOW_ORIGINAIS_LOTE_20261127.zip`; nenhum arquivo foi recodificado ou alterado. Metadados confirmados com ffprobe. A associação com as formas 1/2/3 foi feita por comparação visual com as artes oficiais `assets/confusion/interface/estrategia/reinos/01/oniricos/cervomusgo/{01,02,03}.png`; conferir as vistas antes do processamento final.

| Caminho | SHA-256 | Tamanho | Vídeo | Vistas identificadas |
|---|---|---:|---|---|
| `../forma-1/caminhada/1000357555.mp4` | `a017204c4d6ab24c48ba8326c756d550f1b30698c1db4789487617b40b5feacd` | 2,588,390 bytes | 1280×720, 24 fps, 3.029 s | frente, direita, costas |
| `../forma-2/caminhada/1000357554.mp4` | `4d97fd5e47049e89384ee50fca37659c5af2dbee352b9fadd66ff3d77d7a0a45` | 2,292,514 bytes | 1280×720, 24 fps, 3.029 s | frente, costas, perfil direito |
| `../forma-3/caminhada/1000357553.mp4` | `b5e6227e54dcc50097eeb2ac8b5534a051bae40c170df0fac3a7c7fd07c0c17b` | 2,606,884 bytes | 1280×720, 24 fps, 3.029 s | frente e costas |
| `../forma-3/caminhada/1000357556.mp4` | `d8a53d7ee65eaf62ecb3751e083d72e07c74cb9bde5e8525b4212239244e48ff` | 2,968,288 bytes | 1280×720, 24 fps, 3.029 s | esquerda e direita |

Cada origem é uma caminhada de cerca de 3 s com fundo magenta. A duração final da caminhada é 3 s. Priorizar passada natural e contínua, sem obrigar o último quadro a repetir o primeiro. Na pós-produção, selecionar e recortar quadros compatíveis para fechar o movimento sem salto. Forma 1 e Forma 2 têm frente/costas/perfil direito: só criar a esquerda por espelhamento se a criatura for visualmente simétrica; conferir anatomia e adornos antes. Forma 3 tem frente/costas no vídeo 1000357553 e esquerda/direita no vídeo 1000357556; combinar as vistas e não espelhar nem descartar nenhuma delas.

## Uso

- A pasta é de entrada bruta; não contém animação pronta para runtime.
- Processar com a pipeline do jogo somente depois de verificar escala, anatomia, chroma, cadência dos cascos e alinhamento do chão. Manter 3 s no loop de idle e 3 s na caminhada; não forçar fechamento idêntico do primeiro e último quadro na caminhada.
- Não misturar com os MP4s de idle já listados no README do diretório pai.
- A entrada bruta deve ser excluída dos arquivos enviados à Vercel por `.vercelignore` antes de qualquer merge que a leve à `main`.
