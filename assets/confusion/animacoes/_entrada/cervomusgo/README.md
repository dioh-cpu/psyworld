# Vídeos de entrada — Cervomusgo

Quatro MP4s enviados pelo usuário para preparar os loops do Cervomusgo. Os arquivos estão preservados como entrada bruta; ainda não foram recortados nem integrados ao jogo.

| Arquivo | Duração | Quadro | Conteúdo visível no vídeo |
|---|---:|---:|---|
| `01-556147587-1795806039931086.mp4` | 4,03 s | 1280×720 | folha antiga com frente, perfil e costas |
| `02-416939351-1795806054311478.mp4` | 3,03 s | 1280×720 | outra versão da folha antiga com três vistas |
| `03-780239679-1795806065151509.mp4` | 3,03 s | 1280×720 | folha lateral esquerda/direita |
| `04-771117971-1795806082654601.mp4` | 3,03 s | 1280×720 | folha frente/costas |

A dupla final de folhas é `03` + `04`; `01` e `02` ficam como referências/alternativas para comparação. Os quatro vídeos usam fundo magenta. Conferir visualmente escala, anatomia, vistas e continuidade antes de escolher os frames definitivos.

## Processamento pedido

- Gerar **idle em loop de 3 segundos**. Manter o andar como tarefa separada quando houver clipes próprios.
- A pipeline atual `tools/processar_animacao.py` separa três colunas e não deve receber diretamente as folhas finais de duas vistas. Adaptar a leitura para duas vistas, ou recortar cada vista antes da chamada, sem reduzir resolução nem misturar os dois personagens/vistas.
- Usar frente e costas da folha `04`; usar somente o perfil que olha para a direita da folha `03` e criar esquerda por espelhamento, se a validação visual confirmar que as duas vistas laterais são de fato o mesmo Onírico.
- Preservar o chroma magenta na extração, alinhar os cascos na mesma linha e manter escala coerente. Gerar os formatos/canvases que o jogo já espera e manter a arte estática atual como fallback.
- Rodar `tools/processar_animacao.py --validar assets/confusion/animacoes/cervomusgo` depois da geração. Corrigir e repetir até validar os quatro sentidos sem cortes, franja magenta ou pulo de escala.
- Não sobrescrever nem apagar estes MP4s de entrada. Se alguma vista ou anatomia estiver incorreta, relatar o arquivo e a vista antes de integrar.

## Lote novo de caminhada — 2026-11-27

Foram adicionados quatro originais de caminhada em `lote-caminhada-20261127/`, organizados em subpastas `forma-1`, `forma-2` e `forma-3`. A classificação visual foi comparada às artes de catálogo; vistas, hashes, dimensões e instruções de processamento estão no [README do lote](lote-caminhada-20261127/README.md). São fontes brutas, ainda não integradas ao runtime. A forma 3 usa frente/costas e esquerda/direita em dois vídeos separados.
