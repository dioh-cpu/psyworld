# Confusion Waves — artes das telas v2

## Fundos

| Arquivo em `telas-v2/` | Tamanho | Tela |
|---|---:|---|
| `equipe.webp` | 2560×1440 | Equipe, no quartel de treinamento do Farol |
| `colecao.webp` | 2560×1440 | Coleção, na biblioteca arcana |
| `invocacao.webp` | 2560×1440 | Invocação, no altar do Farol |
| `mochila.webp` | 2560×1440 | Mochila, no depósito do aventureiro |
| `guilda.webp` | 2560×1440 | Guilda, no salão de reuniões |
| `campanha-mini.webp` | 2560×1440 | Campanha, na mesa de cartografia |
| `torres.webp` | 2560×1440 | Torres elementais |
| `calaboucos.webp` | 2560×1440 | Calabouços, no acesso subterrâneo |
| `reliquias.webp` | 2560×1440 | Relíquias, na oficina mágica |
| `missoes.webp` | 2560×1440 | Missões, no quadro da taverna |
| `eventos.webp` | 2560×1440 | Eventos, na praça festiva |
| `idle.webp` | 2560×1440 | Idle, no acampamento |
| `batalhas.webp` | 2560×1440 | Seleção de batalhas, na arena |

## Capas

| Arquivo em `banners-v2/` | Tamanho | Tela |
|---|---:|---|
| `adventurer.webp` | 2560×1100 | Banner permanente de Invocação |
| `halloween.webp` | 2560×1100 | Banner mensal de Halloween |

Mantenha a proporção das capas para mostrar a ilustração inteira, inclusive em celular em paisagem. O espaço entre a capa e a área de ações pode usar o fundo de Invocação.

**Adventurer.** Ignaraz, Vaelirion e Florivel ocupam o primeiro plano. As primeiras formas são Brasinha, Gotalume, Sementil, Solinho e Penumbrio. As segundas formas são Ignavor, Vaelith, Brotavel, Solarin e Noctarn.

**Halloween.** Abyssar ocupa o centro, acompanhado de Abobrisco, Velalume, Mortálio e Vitrarco.

## Kit

| Arquivo em `kit-v2/` | Tamanho (2×) | Uso |
|---|---:|---|
| `painel-9slice.png` | 512×512 | Painéis redimensionáveis. Use um corte inicial de 192 px por lado para preservar os cantos ornamentados |
| `cabecalho.png` | 1024×192 | Faixa para título de tela |
| `aba-ativa.png` | 416×128 | Aba selecionada |
| `aba-inativa.png` | 416×128 | Aba disponível |
| `botao-principal-normal.png` | 520×144 | Ação principal disponível |
| `botao-principal-hover.png` | 520×144 | Ação principal ao passar o cursor |
| `botao-principal-pressionado.png` | 520×144 | Ação principal pressionada |
| `botao-principal-desativado.png` | 520×144 | Ação principal indisponível |
| `botao-secundario-normal.png` | 520×144 | Ação secundária disponível |
| `botao-secundario-hover.png` | 520×144 | Ação secundária ao passar o cursor |
| `botao-secundario-pressionado.png` | 520×144 | Ação secundária pressionada |
| `botao-secundario-desativado.png` | 520×144 | Ação secundária indisponível |
| `recursos/ouro.png` | 128×128 | Ouro |
| `recursos/diamante.png` | 128×128 | Diamante |
| `recursos/energia.png` | 128×128 | Energia |
| `recursos/ticket.png` | 128×128 | Ticket comum de Invocação |
| `recursos/essencia-menor.png` | 128×128 | Essência menor |
| `recursos/essencia-media.png` | 128×128 | Essência média |
| `recursos/essencia-maior.png` | 128×128 | Essência maior |
| `recursos/po-unico.png` | 128×128 | Pó único |
| `recursos/fragmento-de-sonho.png` | 128×128 | Fragmento de Sonho |
| `moldura-t1.png` | 600×900 | Carta T1, cinza |
| `moldura-t2.png` | 600×900 | Carta T2, verde |
| `moldura-t3.png` | 600×900 | Carta T3, azul |
| `moldura-t4.png` | 600×900 | Carta T4, roxa |
| `moldura-t5.png` | 600×900 | Carta T5, dourada. A camada da moldura pode receber animação independente do retrato |

Os controles são imagens com transparência. Sobreponha os rótulos como texto da interface para conservar legibilidade e acessibilidade.

## Repasse da regra Adventurer

Com tickets comuns, os marcos pedidos são T3 na 10ª, T4 na 30ª e um T5 aleatório na 50ª invocação. O trio T5 em destaque é Ignaraz, Vaelirion e Florivel. Antes do marco, a chance indicada é de 3% no total por invocação para sortear um dos três. O contador pertence ao Adventurer. Ao definir o elenco obtível, observe que Noctarn tem uma exclusividade anterior no banner Sombra.
