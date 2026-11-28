# Campanha Mini v2 — Vale de Outono

Primeiro capítulo para aprovação da direção visual. Os demais capítulos usam o mesmo contrato quando o primeiro estiver aprovado.

| Arquivo | Dimensões | Uso |
|---|---:|---|
| `campanha-mini-v2/cap-01.webp` | 2560×1600 | Mapa isométrico do capítulo, com trilha pintada |
| `campanha-mini-v2/cap-01.json` | 11 pontos | Posições das dez fases e da fase escondida no mapa |
| `batalha-v2/cap-01-panorama.webp` | 7680×1440 | Cenário lateral contínuo para até três ondas |
| `batalha-v2/cap-01-chefe.webp` | 2560×1440 | Cenário lateral da luta de chefe |
| `animacoes-v2/<especie>/frame-base.png` | 1080×1920 | Bases de animação do Flow para 15 formas, voltadas à direita |
| `animacoes-v2/README.md` | 105 prompts | Sete clipes por forma, incluindo caminhada, reação e derrota |

## Mapa e ondas

As coordenadas em percentual usam a origem no canto superior esquerdo da imagem. Posicione os nós no retângulo ocupado pela imagem, também quando o mapa tiver margens para caber na tela. O ID `1-escondida` corresponde à clareira do ramal. Os rótulos de marcos no JSON descrevem a localização visual. Os títulos das fases e seus requisitos vêm do catálogo.

O panorama foi composto como uma pintura contínua. A janela de 2560×1440 começa em x=0, x=2560 ou x=5120 para as ondas 1, 2 e 3. A faixa de chão se mantém na transição entre a vila, a ponte e as ruínas. A referência visual de apoio dos aliados e inimigos fica entre 81% e 86% da altura, dependendo da camada de formação. A arena de chefe tem o mesmo enquadramento lateral.

Para a transição em jogo, use o clipe de caminhada à direita no lugar e anime separadamente o deslocamento da câmera e da formação. Assente as patas ao voltar ao repouso. As ondas, a vida do time, a entrada dos inimigos e o HUD pertencem ao motor de batalha.

## Animações anteriores conferidas

Os MP4 originais do Flow já mostram movimentos nas formas base. O material `49997df6` tem Penumbrio, Brasinha e Gotalume. O `ae9d9224` tem Sementil e Solinho. Nos dois, os repousos e as caminhadas compartilham o mesmo vídeo. As folhas `7525173f`, `eaf3dc6d` e `b6c9050e` têm direções alternativas e combinações com outros Oníricos. O enquadramento e a direção variam conforme a célula. O material não contém os sete clipes individuais de arena que este pacote prepara.

As cinco formas base usam os perfis oficiais espelhados para a direita. As dez outras formas foram reposicionadas de perfil com referência às artes oficiais. A entrega inclui os quadros iniciais e os prompts. Os vídeos finais do Flow e a integração na arena são etapas seguintes.
