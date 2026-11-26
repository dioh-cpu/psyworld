# Azazel e Brumacervo · Referências de animação

A folha animada de **Azazel montado** está em `azazel-montado-1080p.mp4` (arquivo enviado `223156338_1795707598428904.mp4`, 1920 × 1080, 24 fps, 7,92 s). A referência a pé está em `azazel-a-pe-1080p.mp4` (arquivo `967385691_1795707212812011.mp4`). Ambos são originais do Flow com fundo verde. A folha PNG transparente fixa a referência de anatomia e acessórios do conjunto montado.

## Recorte da folha animada

A grade é 4 × 2. Use as células de 480 × 540 abaixo como janela inicial de segurança. Os valores de x e y são coordenadas do quadro de 1080p.

| Linha | y | x = 0 | x = 480 | x = 960 | x = 1440 |
|---|---:|---|---|---|---|
| Superior | 0 | Repouso frente | Caminhada frente | Repouso direita | Caminhada direita |
| Inferior | 540 | Repouso costas | Caminhada costas | Repouso esquerda | Caminhada esquerda |

As duas direções laterais têm clipes próprios. Para cada direção, escolha um ciclo de passada contínuo, verifique a transição entre o último e o primeiro quadro e mantenha a mesma escala e linha dos cascos nos dois estados. As células rotuladas como repouso também apresentam movimento de patas em partes do clipe. Prefira um trecho realmente neutro ou um quadro estável para a parada. Use a pose parada da folha PNG se necessário. Retire o verde e o halo antes de ligar a animação ao mapa.

Claude pode usar estes arquivos de referência para entregar os recortes de jogo em `assets/characters/montado/brumacervo/` e cadastrar a apresentação em `regiao1-montaria.js`. Os valores de topo, ponto dos cascos e escala devem vir dos recortes finais.
