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

## Aplicação no retângulo inteiro

A moldura acompanha o perímetro completo do elemento ao qual pertence: o botão inteiro ou o painel inteiro, em largura e altura, não apenas a área ocupada pelo texto. O texto e o ícone ficam por cima, dentro da área livre. Preserve cantos e proporções; confira a borda nos quatro lados em retrato e paisagem e não deixe ornamentos cobrirem os rótulos. Os filtros de elementos nas Torres não devem receber uma moldura apertada em torno de cada palavra.

`referencia-retangulo-inteiro.png`: referência de composição, não é moldura transparente nem arquivo pronto para aplicação direta.

## Linha de acabamento aprovada

- `moldura-retrato-luxo.png`: 1024 × 1536, borda para painel em celular retrato.
- `moldura-painel-luxo.png`: 1774 × 887, borda para painel horizontal.

Ambas são PNG RGBA com amostra do centro e do canto superior esquerdo totalmente transparente. A avaliação da borda completa e o teste de legibilidade nos menus ainda são necessários.

## Temas por sistema

- `moldura-torres.png`: Torres, arquitetura e cristais elementais.
- `moldura-reliquias.png`: Relíquias, joias e objetos arcanos.

Cada sistema deverá ter identidade própria. As duas molduras preservam o centro transparente; a adequação da largura do contorno e a legibilidade no celular ainda exigem teste na interface.
