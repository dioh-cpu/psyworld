# Animações — estado verificado no GitHub

Estado de cada forma, conferido nas branches em 2026-11-28. Legenda:

- **Recebido**: vídeo original está no repositório, sem processamento.
- **Reparado**: versão corrigida de cortes existe, ainda não conferida visualmente.
- **Processado**: convertido para o formato do jogo (`.webm` e `.webp`) e integrado.

Nenhuma forma está "concluída" fora da lista de **Processado**.

## Processado e integrado

| Forma | Arquivos | Branch |
|---|---|---|
| Cervomusgo F1, F2, F3 | `assets/confusion/animacoes/cervomusgo-f1|f2|f3/` (idle e andar, 4 direções) | `main` |

## Recebido (sem processamento)

| Forma | Idle | Caminhada | Branch |
|---|---|---|---|
| Cerifogo F2 | `_entrada/cerifogo/forma-2/idle/rodada4-2026-11-27/447062181_1795819307107602.mp4` | `_entrada/cerifogo/forma-2/andar/rodada4-2026-11-27/203308603_1795819090812020.mp4` | `codex/rodada4-flow-originais` |
| Xistolim F1 | `idle-1080p-2026-11-28/Animate_creature_idle_loop_fa33ed9a_1080p.mp4` (tatu magenta, cortes de borda) | `walk-lote2-2026-11-28/206273094_1795856310522496.mp4` (magenta) | `codex/reparo-frames-lote2` |
| Xistolim F2 | `idle-1080p-2026-11-28/Animate_creature_idle_loop_991b6170_1080p.mp4` (tatu verde) | `walk-lote2-2026-11-28/149626540_1795856308392234.mp4` (verde) | `codex/reparo-frames-lote2` |
| Brasinha F1 | `idle-1080p-2026-11-28/Animate_creature_image_idle_loop_60344e2b_1080p.mp4` (cortes) | `walk-lote2-2026-11-28/633410113_1795856306916584.mp4` | `codex/reparo-frames-lote2` |
| Gotalume F1 | `idle-1080p-2026-11-28/Animate_creature_image_idle_loop_b5bd1d24_1080p.mp4` (felino azul, cortes) | `walk-lote2-2026-11-28/607261356_1795856304346650.mp4` | `codex/reparo-frames-lote2` |
| Sementil F1 | `idle-1080p-2026-11-28/Creature_animating_calm_idle_loop_1ee912b9_1080p.mp4` | `walk-lote2-2026-11-28/871645892_1795856312096028.mp4` | `codex/reparo-frames-lote2` |
| Solinho F1 | `idle-1080p-2026-11-28/Animate_creature_with_calm_idle_1e6a50c4_1080p.mp4` (felino prateado alado, fundo verde) | `walk-lote2-2026-11-28/383178597_1795856305751271.mp4` | `codex/reparo-frames-lote2` |
| Fanalino F2 | `reparo-lote-2026-11-28/fanalino-f2-idle.mp4` (idle confirmado pelo usuário) | **Duas opções**: `reparo-lote-2026-11-28/fanalino-f2-walk.mp4` e `walk-lote2-2026-11-28/Creature_walking_in_place_1de11b9a.mp4` | `codex/reparo-frames-lote2` |

## Reparado (conferir antes de processar)

- `reparo-lote-2026-11-28/` tem versões corrigidas de Brasinha F1, Gotalume F1, Xistolim F1 e Fanalino F2 (idle e caminhada).
- Os originais 1080p de Brasinha, Gotalume e Xistolim F1 têm cortes de borda. Conferir o reparo antes de substituir o original.
- Xistolim F1 tem duas caminhadas (original em `walk-lote2` e reparo em `reparo-lote`). Escolher uma.

## Pendente (sem vídeo nas branches verificadas)

Branches verificadas: `main`, `codex/reparo-frames-lote2`, `codex/rodada4-flow-originais`, `codex/lote-animacoes-2026-11-28`, `codex/cervomusgo-idle-flow-inputs`.

- Penumbrio F1
- Cobrabúfalo F2, Tatuveludo F2, Melifalcão F2, Lavândria F2, Calquélon F2, Vesprata F2, Colmeiro F2, Âmbarasa F2, Zunifaísca F2, Trovoresta F2, Voltabelha F2, Falesário F2, Ventassol F2, Bronzelo F2, Latonhorn F2, Ignavor F2
- Ignaraz F3, Vaelirion F3, Florivel F3

As 19 artes estão no ZIP do banner (`Oniricos-Banner-Pendentes.zip`, 19 PNGs em `01-palco/`, `02-outros-do-banner/` e `03-evolucoes-de-iniciais/`). A lista do ZIP coincide com as 19 formas acima. Segundo o `LEIA-ME.txt` do ZIP, Fanalino F2, Xistolim F2 e Cerifogo F2 já têm idle e caminhada e foram removidos da lista.

## Pendências de identificação

- **Florivel**: o lote de 28/11 (`lote-animacoes-2026-11-28`, item 01) sugeria Florivel para `1ee912b9`. O README do idle 1080p identifica o mesmo arquivo como Sementil F1. Adotar Sementil F1. Florivel F3 segue sem par.
- **Vaelirion F3**: sem par. `b5bd1d24` é Gotalume F1.
- **Noctarn** (`assets/monsters/noctarn/`, na `main`): idle e caminhada existem, mas não são de Penumbrio. Pelos nomes em `estrategia/reinos/existentes/noctarn/` (01-penumbrio, 02-noctarn, 03-noctarion), o mais provável é Noctarn F2. Confirmar antes de usar.
- **Fanalino F2 caminhada**: escolher entre as duas opções listadas acima.
