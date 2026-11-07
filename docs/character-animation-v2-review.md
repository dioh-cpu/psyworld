# PSYWORLD — Character Animation Studio V2

Entrega de revisão da ETAPA A: correção de escala, IDLE complementar e integração
visual. **Ainda não é a conclusão da caminhada profissional de todos os visuais.**
A inspeção ampliada encontrou poses originais repetindo a mesma perna à frente,
claramente no Aventureiro. Quatro índices distintos não provam alternância dos pés.
A amostra WALK adicional está isolada em `/tests/human-walk-art-sample-v2.html`;
ainda depende da revisão de arte solicitada pelo usuário. Não foi aplicada ao jogo.

## Base e isolamento

- Base autoritativa inspecionada: `967d7db868c5589530356ea8841190ee18747a06`.
- Branch local: `animation/halloween-characters-v2`.
- Sem push, merge, deploy ou alteração de configuração de publicação.
- Conferidos commits recentes de onboarding, movimentos V58 e Viridian na main;
  a branch `teste/iniciais-oficios-v38` também foi comparada quanto aos personagens.
- A integração à main continua fora da autorização desta etapa.

## Inventário real

| ID | Nome atual | Original | Halloween |
|---|---|---|---|
| black_boy | Kai | basic | divine, macabre, macabre_alt, supreme |
| black_girl | Maya | basic | divine, macabre, macabre_alt, supreme |
| gothic_boy | Rapaz gótico | basic | divine, macabre, macabre_alt, supreme |
| gothic_girl | Garota gótica | basic | divine, macabre, macabre_alt, supreme |
| adventure_boy | Aventureiro | basic | divine, macabre, macabre_alt, supreme |
| adventure_girl | Aventureira | basic | divine, macabre, macabre_alt, supreme |

`basic` é o **Traje de Jornada original gratuito**, não uma fantasia paga da
categoria Básica. Os outros rótulos atuais são Juramento da Aurora,
Máscara do Último Sino, Véu da Névoa Rubra e Coroa do Eclipse Eterno.
O registro ativo é `core/halloween-ui.js`, confirmado contra o manifest original.
Nenhum nome, preço, raridade ou direito de compra foi alterado.

O inventário JSON ao lado lista os 30 caminhos, dimensões, hashes, direções,
controladores e estado de aceitação por visual. Os retratos cinematográficos
1024×1536 são artes estáticas separadas; não foram confundidos com sprites WALK.
Todos os 30 sheets originais são 2048×2048, 16 células de 512×512.
A matriz de evidência contém 240 combinações personagem × visual × direção × estado.

## Causa e correção de escala

O problema não estava apenas na reprodução da demonstração. As artes de origem
variam de tamanho: no Aventureiro original, as alturas opacas variam de 198 a 262 px.
O renderer anterior também ajustava cada recorte a 33×46, esticando proporções,
e a cidade aplicava outra proporção ao destino. Margens transparentes e capas
mudavam a centralização. Além disso, dois grupos de sheets tinham direções em
ordem diferente da esperada pelo renderer.

A API ativa agora usa ajuste **uniforme**, sem estirar eixos separadamente,
referência de cabeça original por visual/direção, pivô horizontal anatômico e
apoio vertical medido. A calibração de raster corrige apenas a quantização do
nearest-neighbor. Não modifica câmera, coordenadas físicas ou velocidade.
O enquadramento largo transparente evita recortar capas, chapéus e efeitos.
A altura visual de referência é 46 px do mundo, em raster 2×: altura opaca 92,
chão y=120. As cabeças originais da pose de referência permanecem idênticas
entre WALK, transição e IDLE da mesma direção. Variações de largura de silhueta
continuam naturais; não foram achatadas para caber em um retângulo de largura fixa.

Os 30 originais permanecem byte a byte intactos. Os sheets derivados ficam em
`assets/characters/animation-v2`, e as 30 tiras neutras complementares em
`assets/characters/idle-v2`. A amostra IDLE do Aventureiro foi aprovada pelo usuário
com a condição de escala/alinhamento. Essa linguagem visual foi expandida para
os 30 visuais, preservando a camada de cabeça original no resultado final.

A medição automatizada usa o contorno opaco, não um reconhecimento semântico de
ossos. Em roupas longas e efeitos, ela complementa a revisão visual; não prova
por si só a biomecânica nem a proporção de cada membro.

## Controlador e integrações

Ampliação de `PsyTrainerWalkV1`; contratos legados preservados. Um relógio
monotônico por ator, cadência independente de FPS e deslocamento, reinício seguro
após gaps >250 ms, continuidade nas curvas, último rumo válido e detecção de
movimento efetivo. Movimento em tiles tem janela de intenção limitada para não
andar visualmente contra uma parede. Não há segundo sistema de movimentação.

WALK usa as quatro poses existentes, ordem 1,0,2,3. Isso é uma base técnica de
reprodução, **não uma aprovação visual da caminhada**. Transição de corpo de
120 ms para a postura neutra; IDLE respira sutilmente apenas no tronco, com cabeça
e pés imóveis. O resultado é pré-calculado e compartilhado, sem canvases por frame.

Mapeamento de fonte corrigido:

- basic, divine, macabre: SOUTH, WEST, EAST, NORTH.
- macabre_alt, supreme: SOUTH, NORTH, WEST, EAST.

Cidade, interiores e mundo contínuo de Kanto, capítulos e prévias usam a mesma API
e os mesmos sprites finais. A largura do canvas da cidade ganhou margem
transparente; a altura e o apoio existentes foram mantidos. As prévias cabem sem
cortar acessórios. O nome/título do jogador nos capítulos foi movido para cima
da cabeça para não cobrir a arte. A lógica da loja, colisões e saves foi preservada.

## Reprodução

Requisitos usados: Node 24.22.1; Playwright 1.62.1; Chromium 156;
Python com Pillow 13 e NumPy 2.3.5; ffmpeg 7.1.5. O diagnóstico opcional de
origem usa SciPy 1.17. Não são dependências do jogo publicado.

Na raiz, sirva os arquivos com `python -m http.server 8766 --bind 127.0.0.1`.
Em outro terminal:

```sh
node tests/human-animation-v2.test.cjs
python scripts/qa/validate-human-sheets-v2.py /tmp/final-sheets-tests.json
node scripts/qa/human-animation-v2.cjs build http://127.0.0.1:8766 /tmp/human-build
node scripts/qa/human-animation-v2.cjs capture http://127.0.0.1:8766 /tmp/human-video
node scripts/qa/human-animation-integration-v2.cjs http://127.0.0.1:8766 /tmp/human-integration
node scripts/qa/human-animation-integration-v2.cjs http://127.0.0.1:8766 /tmp/human-inputs inputs
node scripts/qa/human-idle-sample-v2.cjs http://127.0.0.1:8766 /tmp/walk-sample walk
```

A captura utiliza o relógio do Chromium, `renderAnimated` de produção e as imagens
finais carregadas pelo mesmo controlador. Rota programada é entrada de movimento
para inspeção; não é uma sequência de imagens artificial. A integração separada
abre o `index.html` real e usa os controles e saves reais. Perfis são descartáveis,
serviços externos e `/api/` são bloqueados para não escrever dados de contas.

O construtor `build` recompõe os sprites com o código de produção, salva WebP
lossless e verifica igualdade RGBA após codificação. O manifest registra hashes.
A amostra WALK isolada é material candidato, não um asset ativo do jogo.

## Validação e limites de aceitação

Os resultados finais, MP4, folhas alinhadas e aplicação limpa do patch acompanham
o ZIP de revisão; consulte `RELATORIO.md` e `evidence/`. O checkpoint desta branch
permite retomar sem o histórico do chat.

Permanecem pendentes: aprovação e expansão dos novos passos WALK onde necessários,
revisão visual final das 240 combinações e aprovação da integração. Em Rota 2 no
mobile landscape, o enquadramento existente deixa os personagens muito pequenos;
a câmera não foi alterada para disfarçar esse limite. Não foram testados Safari,
dispositivo físico, conta online real ou uma publicação de produção.

## Efeito de uma futura integração

Consulta somente de leitura à Vercel confirmou que a própria base 967d7db gerou
um deploy Git **de produção**, READY, `dpl_AbGcxwX1n29EJBxE4UTsSDm1AkWv`.
Portanto, um futuro push à main deve ser tratado como gatilho de publicação em
produção. O workflow `kanto-geometry.yml` também será acionado pelos arquivos
alterados. Nenhuma dessas configurações foi modificada. Não solicitar integração
como se as caminhadas estivessem concluídas enquanto os pontos acima persistirem.
