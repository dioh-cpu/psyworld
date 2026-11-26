# Azazel no Brumacervo · quadros de entrada para o Flow

Oito poses tiradas da folha de referência aprovada (`azazel-montado-referencia.png`). Cada uma está num quadro próprio de 1920×1080, sobre verde sólido `#11E720`. As oito usam a mesma escala (2,32× a folha), com os cascos em y = 1010 e o centro em x = 960.

## Por que refazer

- **Rosto:** no vídeo atual (`azazel-montado-1080p.mp4`), o rosto saiu lavado. Os olhos ficaram quase brancos, e a gola vermelha e a gargantilha se perderam. Na folha de referência esses detalhes estão certos. A perda veio do Flow, não do recorte.
- **Tamanho:** o vídeo coloca as 8 poses numa grade 4×2. Cada conjunto fica com cerca de 345 px de altura, e o rosto do domador com menos de 30 px. Com um clipe por pose ocupando o quadro, a figura passa de 850 px.

## Como gerar

Um clipe por arquivo, usando o PNG como quadro inicial:

| Arquivo | Clipe |
|---|---|
| `repouso-frente.png` | Parado de frente, respiração leve, cervo mexendo orelhas e cauda; 2 s em loop |
| `caminhada-frente.png` | Caminhada sem sair do lugar, vindo para a câmera; 1 passada completa em loop |
| `repouso-direita.png` / `caminhada-direita.png` | Igual, de perfil para a direita |
| `repouso-costas.png` / `caminhada-costas.png` | Igual, de costas |
| `repouso-esquerda.png` / `caminhada-esquerda.png` | Igual, de perfil para a esquerda |

Texto fixo para todos os clipes: "Câmera fixa e travada, sem zoom nem movimento. Mantenha exatamente o rosto, o cabelo, a gola vermelha, a gargantilha, o casaco, a sela, os estribos, as rédeas e a anatomia do cervo do quadro inicial. Rosto nítido, olhos escuros definidos. Fundo verde sólido #11E720, sem sombra no chão. Cascos sempre na mesma linha, sem deslizar. O primeiro e o último quadro na mesma pose, para o loop fechar."

Os PNGs estão ampliados a partir da folha só para servir de quadro inicial. A nitidez final vem do Flow.

## Depois de gerar

Coloque os 8 MP4 em `docs/artwork/azazel-brumacervo/` e avise. O recorte (ciclo, transparência, cascos e escala) é o mesmo já usado no jogo.
