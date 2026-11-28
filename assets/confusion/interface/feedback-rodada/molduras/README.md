# Molduras premium — primeira entrega

PNGs RGBA com centro e canto superior esquerdo transparentes, conferidos por leitura do canal alfa. As bases são compartilháveis; a integração deve validar recorte, legibilidade e escala em cada tela antes de usar. Não são mockups completos.

| Arquivo | Dimensão original | Uso sugerido |
|---|---:|---|
| moldura-desktop.png | 1536 × 1024 | Painel de menu horizontal em desktop e paisagem |
| moldura-retrato.png | 1024 × 1536 | Painel de menu em celular retrato |
| moldura-faixa.png | 2172 × 724 | Faixa de cabeçalho ou painel largo |
| moldura-botao.png | 2172 × 724 | Referência ornamental para botão; verificar legibilidade em tamanho pequeno |

O brilho é estático nos PNGs. Camada de reflexo animável, versões específicas de menus, estados do botão, testes em tela e validação da transparência em todo o contorno ainda pendem. Não esticar sem conferir deformação; o centro precisa permanecer livre para o conteúdo.

`reflexo-dourado.png` é uma camada estática com alfa para a equipe de interface experimentar um reflexo suave. O movimento ainda precisa ser implementado e testado; reduzir a intensidade se necessário. Na área central de 30% × 30% das molduras de botão e faixa, respectivamente 1,06% e 2,08% dos pixels têm alfa acima de 16 por causa dos ornamentos. Os quatro limites externos não apresentam pixels com alfa acima de 16.
