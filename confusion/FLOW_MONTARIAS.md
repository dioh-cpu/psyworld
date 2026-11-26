# Montarias — ciclo de animação e prompts do Flow

> **Decisão atual (substitui o ciclo abaixo):** não existe mais transformação Azazel ↔ Noctarn. O domador aparece montado visivelmente; montaria e Onírico aliado são entidades separadas. Primeira montaria: **Brumacervo** (`regiao1-montaria.js`, `MONTARIAS.brumacervo`). Equipamento em `save.idle.montaria` (regras). Enquanto os clipes recortados do pacote Confusion-Flow-Azazel não estiverem em `assets/characters/montado/brumacervo/` e `clipes` não for preenchido, o domador anda a pé com o sprite atual (sem MP4 de fundo verde cru). Os prompts e o formato abaixo continuam valendo para os clipes do conjunto montado (repouso e caminhada nas três direções, pés/cascos na mesma linha, sela, estribos e rédeas consistentes).

Primeira montaria validada: **Noctarn** (Conexão Onírica do domador Azazel). As outras montarias reaproveitam o mesmo ciclo, os mesmos tamanhos e o mesmo efeito de conexão, trocando só a arte e a paleta.

## Ciclo no jogo

1. **Domador → montaria**: o botão Transformar (ou T/Shift) toca o efeito de conexão (`regiao1-conexao-fx.js`). Por 380 ms, um anel surge no chão e a energia converge. No auge, um casulo de luz cobre o corpo e o sprite é trocado nesse instante (`aoTrocar`). Depois vêm a onda no chão e as partículas da forma nova.
2. **Montaria**: repouso parado e caminhada em loop.
3. **Montaria → domador**: o mesmo efeito, na paleta do domador.

A troca preserva o ponto dos pés, a posição no mapa, a direção e a escala. As duas formas ficam no mesmo grupo, ancoradas pelos pés em y = 0. No auge, a forma nova recebe a direção da anterior (`ultimaRot` em `regiao1.js`).

O efeito é reutilizável: cada montaria entra em `CONEXAO` (`regiao1-conexao-fx.js`) com cor, cor secundária e partícula (`faisca`, `folha`, `estrela`, `brilho`…).

## Formato atual (não mudar)

| Clipe | Tamanho | Fundo | Corpo | Direções |
|---|---|---|---|---|
| Caminhada (vídeo) | 960×540 | verde sólido `#11E720` | topo y=26, pés y=513, centro x=480 | frente, esquerda, costas (direita = espelho da esquerda) |
| Repouso (vídeo novo) | 960×540 | verde sólido `#11E720` | mesmo topo, mesmos pés e mesmo centro da caminhada | frente, esquerda, costas |
| Entrada e retorno | 960×540 | verde sólido `#11E720` | mesmo enquadramento | frente e esquerda (costas: o casulo de luz cobre a troca) |

Arquivos: `assets/monsters/<montaria>/v2/<clipe>-<direcao>.mp4`, com `clipe` ∈ `repouso`, `caminhada`, `entrada`, `retorno` e `direcao` ∈ `frente`, `esquerda`, `costas`. Exemplo: `assets/monsters/noctarn/v2/caminhada-esquerda.mp4`.

Espelhamento: a direita é a esquerda espelhada, desde que a anatomia e os acessórios sejam simétricos. Se houver um detalhe de um lado só (cicatriz, adorno, asa diferente), gere também `-direita`.

## Bloco fixo (cole no fim de todo prompt)

> Câmera fixa e travada, sem zoom, pan ou rotação. Enquadramento de corpo inteiro, centralizado, com margem para cauda, orelhas e asas; os pés ficam sempre na mesma linha do chão, perto da base do quadro. Fundo verde chroma sólido #11E720, sem chão desenhado, sem sombra projetada, sem gradiente e sem objetos. Iluminação uniforme e suave, sem reflexos verdes no corpo. Mesma escala e mesma altura do personagem do primeiro ao último quadro. Mantenha exatamente a anatomia da imagem de referência: o mesmo número de patas, uma cauda e o mesmo número de asas, com comprimentos constantes; a cauda e as asas não somem, não duplicam e não mudam de tamanho. Estilo anime HD pintado, contorno limpo. Sem texto, sem efeitos de partículas e sem luz mágica no corpo (os efeitos são do jogo). Primeiro e último quadro com a mesma pose, para o loop fechar sem salto.

Referências: use as poses do Codex do mesmo Onírico (`assets/confusion/interface/estrategia/reinos/existentes/<linha>/03-*.png` e `ataque-0N.png`) e a folha de repouso atual (`assets/monsters/noctarn/noctarn-idle-4dir.webp`) para manter as cores e as proporções.

## Prompts do Noctarn (primeiro ciclo)

1. **repouso-frente**: "Noctarn, criatura sombria de pelagem violeta escura, de frente para a câmera, parado em pé sobre as quatro patas, respirando devagar; o peito sobe e desce, as orelhas giram um pouco e a cauda balança de leve de um lado para o outro. Ciclo de 2 segundos. [bloco fixo]"
2. **repouso-esquerda**: "Noctarn de perfil, virado para a esquerda, parado sobre as quatro patas, respiração lenta, cauda balançando de leve, a cabeça baixa um pouco e volta. Ciclo de 2 segundos. [bloco fixo]"
3. **repouso-costas**: "Noctarn de costas para a câmera, parado, respiração lenta visível nos ombros, a cauda balança de leve e as orelhas se mexem. Ciclo de 2 segundos. [bloco fixo]"
4. **caminhada-frente**: "Noctarn caminhando em direção à câmera, sem sair do lugar (caminhada em esteira), passo felino em quatro tempos; cada pata toca o chão firme, sem deslizar, e o corpo oscila pouco. Cabeça estável, cauda acompanhando o passo. Um ciclo completo de passada em 1 segundo, repetido. [bloco fixo]"
5. **caminhada-esquerda**: "Noctarn de perfil, caminhando para a esquerda sem sair do lugar (caminhada em esteira), passada felina em quatro tempos, patas com contato claro no chão, as patas do lado de longe visíveis e em fase oposta, cauda estável seguindo o movimento. Um ciclo completo em 1 segundo. [bloco fixo]"
6. **caminhada-costas**: "Noctarn de costas, caminhando para longe da câmera sem sair do lugar (caminhada em esteira), passada em quatro tempos com contato no chão, ombros e quadril alternando, cauda estável. Um ciclo completo em 1 segundo. [bloco fixo]"
7. **entrada-frente**: "Noctarn surge de frente para a câmera: começa agachado e encolhido como se acabasse de se formar, abre os olhos, se ergue sobre as quatro patas e termina na pose de repouso de frente. Duração de 1,2 segundo. [bloco fixo]"
8. **entrada-esquerda**: "Noctarn surge de perfil para a esquerda: começa encolhido, ergue a cabeça, estica o corpo e termina na pose de repouso de perfil. Duração de 1,2 segundo. [bloco fixo]"
9. **retorno-frente**: "Noctarn de frente, na pose de repouso, baixa o corpo e se encolhe até ficar agachado, como se fosse se dissolver. Termina compacto e imóvel. Duração de 1 segundo. [bloco fixo]"
10. **retorno-esquerda**: "Noctarn de perfil para a esquerda, na pose de repouso, baixa o corpo e se encolhe até ficar agachado e imóvel. Duração de 1 segundo. [bloco fixo]"

Ordem de produção: repouso e caminhada (frente, esquerda, costas) primeiro; entrada e retorno depois.

## Recorte para o jogo

O jogo já remove o verde no shader da caminhada. Para cada clipe:

```bash
# 1) corta um ciclo exato (ajuste -ss/-t até a primeira e a última pose coincidirem) e fixa 24 fps, 960×540
ffmpeg -ss 0.40 -t 1.00 -i bruto.mp4 -vf "scale=960:540:force_original_aspect_ratio=decrease,pad=960:540:(ow-iw)/2:(oh-ih)/2:color=0x11E720,fps=24" -an -c:v libx264 -crf 18 -pix_fmt yuv420p caminhada-esquerda.mp4
# 2) versão com transparência (prévia e composição fora do jogo)
ffmpeg -i caminhada-esquerda.mp4 -vf "chromakey=0x11E720:0.16:0.06,despill=green,format=yuva420p" -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 30 -auto-alt-ref 0 caminhada-esquerda.webm
```

Antes de publicar, confira:
- os pés estão em y = 513 e o centro em x = 480 em repouso e na caminhada;
- a altura do corpo é a mesma nos dois clipes;
- o loop fecha sem salto;
- não sobra halo verde (use `despill`).

## Próximas montarias

Repita os mesmos 10 clipes. Cadastre a paleta da montaria em `CONEXAO` e a arte nas mesmas pastas `v2/`.
