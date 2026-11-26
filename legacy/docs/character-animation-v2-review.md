# PSYWORLD — Character Animation Studio V2

WALK e IDLE dos seis personagens, seis roupas originais e 24 visuais de Halloween.
Escala, apoio e direção corrigidos na produção. A implementação inicial usou a
base `967d7db868c5589530356ea8841190ee18747a06`; depois, por instrução explícita
do usuário, foi integrada sobre a main atual `cb3ebfc716ae32c27a86e4af9b58e1a448c0788f`,
preservando atualizações concorrentes de campanha, Hobbies, pesca e coleta.

## Base e inventário

Base inicial do desenvolvimento: `967d7db868c5589530356ea8841190ee18747a06`.
Base usada para integração: `cb3ebfc716ae32c27a86e4af9b58e1a448c0788f`.
Branch: `animation/halloween-characters-v2`. Conferidos os commits recentes de
onboarding, movimentos V58 e Viridian da main; comparada a branch de teste quanto
a personagens. Os trabalhos anteriores e branches de Pokémon foram preservados.

| ID | Nome atual | Original | Halloween |
|---|---|---|---|
| black_boy | Kai | basic | divine, macabre, macabre_alt, supreme |
| black_girl | Maya | basic | divine, macabre, macabre_alt, supreme |
| gothic_boy | Rapaz gótico | basic | divine, macabre, macabre_alt, supreme |
| gothic_girl | Garota gótica | basic | divine, macabre, macabre_alt, supreme |
| adventure_boy | Aventureiro | basic | divine, macabre, macabre_alt, supreme |
| adventure_girl | Aventureira | basic | divine, macabre, macabre_alt, supreme |

`basic` é o **Traje de Jornada original gratuito**, não uma fantasia paga Básica.
Os rótulos atuais dos especiais são Juramento da Aurora, Máscara do Último Sino,
Véu da Névoa Rubra e Coroa do Eclipse Eterno. Registro real:
`core/halloween-ui.js`, confirmado contra o manifest original.
Nenhum nome, preço, raridade, direito de compra ou formato de save foi alterado.

O inventário JSON ao lado contém todos os caminhos, dimensões e hashes.
Os 30 originais são 2048×2048, 4×4 células de 512×512. Os seis retratos
cinematográficos 1024×1536 são arte estática separada, preservada.
A matriz cobre 240 combinações personagem × visual × direção × WALK/IDLE.
Cidade, mundo contínuo de Kanto, interiores, capítulos e prévias usam a API comum.

## Diagnóstico e correção da escala

O problema existia na fonte e no renderer: no Aventureiro original as alturas
opacas vão de 198 a 262 px; cada recorte era esticado para 33×46 e a cidade
aplicava outra proporção. Margens transparentes/capas mudavam o centro do corpo.
Dois grupos de sheets também tinham a ordem das direções interpretada incorretamente.

A API ativa agora ajusta os pixels **uniformemente**, usa referência original de
cabeça por visual/direção, pivô anatômico e apoio medido no chão. A calibração de
raster corrige quantização de nearest-neighbor. Altura visual de referência:
46 px do mundo, raster 2× com altura opaca 92 e apoio y=120. Os pixels da cabeça
original da pose de referência permanecem idênticos entre os estados da mesma
direção. As diferenças naturais de largura de silhueta são preservadas.

Não se alterou câmera, física, colisão, coordenadas ou velocidade para mascarar
arte. O tile largo transparente comporta chapéus/capas/efeitos sem recortes.
A cidade conserva altura e ponto de apoio; corrige o estiramento horizontal.
As prévias cabem sem cortar acessórios. O nome/título nos capítulos fica acima
da cabeça, em vez de cobrir a arte.

A métrica automática de altura usa contorno opaco, não reconhecimento de ossos.
Ela complementa a revisão visual das pernas e roupas; não mede anatomia sozinha.

## Arte e caminhada

As duas amostras do Aventureiro (IDLE e WALK) foram aprovadas pelo usuário antes
da expansão. Todos os 30 originais continuam byte a byte intactos. Novos materiais:

- `assets/characters/walk-v2`: 30 sheets complementares, 16 poses por visual.
- `assets/characters/idle-v2`: 30 tiras neutras, quatro direções por visual.
- `assets/characters/animation-v2`: 30 sheets finais lossless, 2048×1792,
  compostos pelo controlador de produção; manifest com hashes e parâmetros.

As poses originais repetiam o mesmo pé à frente em vários casos. Por isso não
bastava acelerar a reprodução. WALK agora usa contato, passagem, contato oposto
e passagem oposta, sequência 0,1,2,3. Os perfis têm joelhos de passagem, passo
aberto/fechado e balanço discreto do braço livre. Roupas longas ocultam parte dos
membros, com movimento discreto do tecido; acessórios carregados ficam ancorados.

Na vista frontal/traseira, a composição controlada das pernas reaproveita os
pixels aprovados para assegurar os contatos opostos. Não estica botas, não move
a cabeça e não usa um frontal espelhado como traseira: há artes traseiras reais.
Capas e acessórios fora da faixa central são preservados. São dados pré-calculados,
não deformação de membros durante cada renderização. Os perfis não sofrem esse
espelhamento de pernas. O manifest traz métricas dos contatos para inspeção.

A revisão direcional corrigiu trechos das roupas supremas de Kai, Garota gótica
e Aventureira usando os perfis originais correspondentes. Maya divina é uma exceção também na fonte original: SOUTH,EAST,WEST,NORTH.
O mapeamento específico foi aplicado à cabeça original e aos corpos WALK/IDLE,
sem modificar os arquivos originais. A proveniência dos sheets WALK está junto aos arquivos.

## Tempo, estados e integrações

Ampliação de `PsyTrainerWalkV1`, sem segundo sistema de movimento. Contratos legados
preservados. Relógio monotônico por ator, cadência independente de FPS/deslocamento,
gap >250 ms tratado com reinício seguro, curvas conservando fase e último rumo
válido quando parado. Movimento efetivo controla WALK; intenção de tiles expira
junto a uma parede. Transição de corpo de 120 ms para a postura neutra. IDLE tem
respiração sutil só no tronco; cabeça e pés ficam imóveis.

Fonte original: basic/divine/macabre usam SOUTH,WEST,EAST,NORTH (exceto Maya
divina, SOUTH,EAST,WEST,NORTH);
macabre_alt/supreme usam SOUTH,NORTH,WEST,EAST. Saída canônica é sempre S,W,E,N.
Os mesmos sprites finais são usados na cidade, campanha contínua, interiores,
capítulos e seleção. Troca/remoção do traje seguem os registros existentes.
Loja, persistência e lógica dos Pokémon acompanhantes não foram reimplementadas.

## Reproduzir

Versões usadas: Node 24.22.1, Playwright 1.62.1, Chromium 156, Python com Pillow13
e NumPy2.3.5, ffmpeg7.1.5. O diagnóstico opcional de origem usa SciPy1.17.
São ferramentas de desenvolvimento, não dependências do jogo publicado.

Sirva a raiz: `python -m http.server 8766 --bind 127.0.0.1`. Em outro terminal:

```sh
node tests/human-animation-v2.test.cjs
python scripts/qa/validate-human-sheets-v2.py /tmp/final-sheets-tests.json
node scripts/qa/human-animation-v2.cjs build http://127.0.0.1:8766 /tmp/human-build
node scripts/qa/human-animation-v2.cjs identity http://127.0.0.1:8766 /tmp/human-identity
node scripts/qa/human-animation-v2.cjs capture http://127.0.0.1:8766 /tmp/human-video
node scripts/qa/human-animation-integration-v2.cjs http://127.0.0.1:8766 /tmp/human-integration
node scripts/qa/human-animation-integration-v2.cjs http://127.0.0.1:8766 /tmp/human-inputs inputs
```

Captura e integração salvam checkpoints com hashes e podem retomar no mesmo
comando/diretório após interrupções; código alterado exige um diretório novo.
O construtor usa o código de produção, salva WebP lossless e verifica igualdade
RGBA após codificação. Os materiais complementares já estão incluídos; não é
necessário gerar novamente imagens por IA nem acessar caminhos do Codex.

O MP4 usa relógio controlado do Chromium, `renderAnimated` real e os sheets finais.
A rota programada fornece entrada de movimento; não substitui o controlador por
uma sequência de imagens. A integração separada abre `index.html` real, usa UI,
teclado, toque e saves reais em perfis descartáveis. Origens externas e `/api/`
são bloqueadas para não escrever dados de contas. Parte das imagens externas da
interface fica indisponível nesse perfil offline; sprites humanos são locais.

## Evidências e limites

No ZIP: resultados dos testes, 90 folhas alinhadas WALK/transição/IDLE,
30 comparações original × animação na mesma escala, screenshots do jogo e MP4
geral de 123 s, com cinco grupos de roupa e os seis personagens em cada grupo.
O manifest da captura registra hashes dos arquivos executados e cobertura de
240 combinações com suas quatro fases. Consulte `RELATORIO.md` e `evidence/`.

A suíte antiga de Paldea compara um hash anterior de `city-halloween.js` e falha
também na base limpa exata. O arquivo permanece intacto; não se alteraram Pokémon
para silenciar esse teste. Os demais resultados reais estão no relatório.

Em Rota2 no mobile landscape o enquadramento existente torna o personagem muito
pequeno para avaliar detalhes dos pés. A câmera não foi alterada. Não se testaram
Safari, aparelho físico, conta online ou publicação em produção. A revisão de
frames/capturas reais complementa os testes; a aprovação estética final é do usuário.

## Integração e publicação

Consulta somente de leitura confirmou que a base 967d7db gerou deploy Git de
**produção**, READY, `dpl_AbGcxwX1n29EJBxE4UTsSDm1AkWv`, na Vercel.
O push solicitado pelo usuário à main é gatilho de publicação em produção.
O workflow `kanto-geometry.yml` também será acionado. Nenhuma configuração foi
modificada; não foi usado force push.

Contra a versão integrada final passaram 15 combinações do Aventureiro (cinco
visuais em três viewports), três perfis de controles, os testes de cadência de
todos os 30 visuais, a verificação de escala dos 3.360 tiles e as suítes atuais
de campanha/Hobbies. A matriz de 90 casos foi aprovada sobre a main anterior às
últimas mudanças de pesca; a validação de UI foi repetida no merge final.
