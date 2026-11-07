# Character Animation Studio V2 — checkpoint reproduzível

Data: 2026-11-07. Implementação concluída; integração na main solicitada pelo usuário.
Branch de desenvolvimento: `animation/halloween-characters-v2`.
Base original do desenvolvimento: `967d7db868c5589530356ea8841190ee18747a06`.
Base atual usada para integração: `0da95c0d2eab0ac3aebf30f5d1edda7d366e832a`.
Primeiro commit local: `46c26601bfbc84d620da137daa67943d1a255631`.
As atualizações concorrentes de campanha, Hobbies, pesca e coleta foram preservadas;
a única resolução manual combinou os parâmetros de cache em `index.html`.

## Autorizações

O usuário aprovou o IDLE do Aventureiro, condicionado a escala e alinhamento,
e depois respondeu “Aprovo as poses e a identidade” à amostra WALK. As duas
aprovações autorizaram a expansão aos seis personagens e aos trajes existentes.
Depois, o usuário instruiu explicitamente: “implemente já na main. Quero testar
diretamente lá”. Essa instrução autoriza integrar e publicar a animação no escopo.

## Estado da implementação

30 visuais: seis originais Traje de Jornada (`basic`, gratuito) e 24 Halloween:
`divine`, `macabre`, `macabre_alt`, `supreme`. Personagens do registro real:
Kai/black_boy, Maya/black_girl, Rapaz gótico/gothic_boy, Garota gótica/gothic_girl,
Aventureiro/adventure_boy, Aventureira/adventure_girl. Matriz de 240 combinações.
Inventário completo: `docs/character-animation-v2-inventory.json`.

WALK e IDLE complementares estão em `assets/characters/walk-v2` e `idle-v2`.
Os 30 sheets finais em `animation-v2` são gerados pelo mesmo controlador usado
no jogo. Manifest tem hashes e parâmetros. Todos os 30 originais permanecem
intactos. A cabeça/rosto original da pose de referência por direção é preservada
em cada frame. Neutral/body art foi expandida somente após aprovação das amostras.

Diagnóstico: tamanho das artes de origem inconsistente, margens/capas deslocando
centro, renderer esticando cada crop e ordem de direções incorreta em vários
sheets. A correção está no código de produção e nos sheets entregues, não no vídeo.
Ajuste proporcional, raster 2×, altura opaca92, apoio y120 (46px/y60 no mundo),
pivô pela cabeça, tiles largos transparentes e nearest-neighbor. Não se alterou
câmera, coordenada, colisão ou velocidade para compensar arte.

`PsyTrainerWalkV1` foi ampliado, mantendo contratos legados. API de construção:
`getAnimationAtlas(original,idleArt,walkArt)`. Produção carrega os sheets finais;
a construção a partir dos materiais serve à reprodução/QA. Sampler monotônico
WALK/settle/IDLE, sequência0,1,2,3 contato/passagem/contato oposto/passagem,
120ms de estabilização, respiração só do tronco e cabeça/pés imóveis em IDLE.
Gaps >250ms, cena/identidade e movimento em tiles são tratados sem outro loop
físico. Nenhuma criação de canvas por frame. Não copiar controlador por fantasia.

Composição controlada das pernas em SOUTH/NORTH usa os pixels aprovados para
contatos opostos; não estica botas nem fabrica traseira a partir de frontal.
Os perfis usam poses complementares próprias. Uma tentativa antiga de deformar
pernas por faixas foi rejeitada e removida: não restaurar essa deformação.

Mapas reais de fonte:
- basic/divine/macabre: S,W,E,N, EXCETO Maya divina S,E,W,N.
- macabre_alt/supreme: S,N,W,E.
- Corpos WALK/IDLE complementares canônicos S,W,E,N; Maya divina tem entrada
  S,E,W,N também nesses materiais, normalizada pelo perfil específico.
- Perfis supremos de Kai, Garota gótica e Aventureira foram corrigidos a partir
  dos perfis originais. Proveniência em `walk-v2/provenance.json`.

Integrações: `core/halloween-ui.js` cidade e prévias;
`core/kanto-world-v2.js` mundo/interiores; `core/kanto-campaign-playable-v1.js`
capítulos. Preservados movimento, colisões, loja, seleção/equipamento, saves,
e todos os Pokémon. O nome/título nos capítulos foi colocado acima da cabeça.

## Reprodução e evidências

Consulte `docs/character-animation-v2-review.md` para comandos/versões completos.
Sirva a raiz por HTTP. `scripts/qa/human-animation-v2.cjs` tem modos build,
preview, identity e capture. Build aceita categoria opcional e recomposição
parcial; uma recomposição completa gera manifest e matriz240. Identity compara
original × quatro poses WALK × IDLE na mesma escala/apoio.

Capture executa `renderAnimated` real e os sprites finais com clock de Chromium,
captura PNGs e usa ffmpeg para um MP4 geral de123s/20FPS/2460frames. Cada grupo
salva um checkpoint `capture-<visual>.json` com cobertura e hashes, permitindo
retomar no mesmo comando/diretório após interrupção. Não reutilizar checkpoint
se mudar o código ou manifest; o script verifica os hashes.

`scripts/qa/human-animation-integration-v2.cjs` abre o index real com perfil
anônimo descartável, bloqueia externos/API, testa UI e local save/load reais.
Configuração padrão cobre 90 casos e18 perfis (3 viewports ×6personagens ×5looks).
Modo `inputs` testa teclado, joystick CDP por toque, colisão com input mantido,
IDLE bloqueado e parada sem drift nas três resoluções. Checkpoint grava somente
perfis completamente aprovados, com hashes; o mesmo comando retoma sem repetir
perfis concluídos. TEST_VIEWPORTS/TEST_CHARACTERS permitem recortes explícitos.

Validações já executadas:270 cenários temporais 30/60/120FPS ×3velocidades;
30 final sheets/3360tiles com dimensões, altura, apoio, cabeça, pés IDLE e bordas;
contatos opostos medidos nas60 vistas frontal/traseira;37 arquivos originais/
jogo mais seções de movimento/colisão/persistência preservados.14/15 suítes Node
pertinentes passam. Paldea falha um hash antigo de city-halloween.js também na
base limpa exata; não alterar Pokémon ou esse arquivo para silenciar o teste.

A conferência visual comparou os30 visuais, quatro direções, original/WALK/IDLE,
e corrigiu a exceção da Maya. O ZIP contém folhas alinhadas, comparações, capturas
do jogo, MP4 e resultados reais finais. Um encerramento do processo local de teste
interrompeu uma rodada; por isso a infraestrutura passou a salvar checkpoints.
Capturas antigas/parciais foram substituídas, não usar como evidência final.

## Limites e próxima etapa

Rota2 mobile landscape mantém o enquadramento existente: detalhes dos pés ficam
pequenos. Não alterar câmera por iniciativa própria. Loot popup existente pode
cobrir controles de roupa no mobile; QA fecha pelo próprio handler de fechar.
Não foram testados Safari, aparelho físico, conta online ou publicação. A arte
final depende da revisão estética do usuário, não apenas dos testes automáticos.

Entrega: arquivos modificados na raiz relativa original, patch binário agregado
sobre a base exata, commit metadata, MP4, comparações e relatório. Conferir aplicação
em uma cópia limpa e igualdade da árvore final. A evidência de aplicação acompanha
o ZIP; não depender de arquivos temporários do Codex para integrar.

Integração: main atualizada para `0da95c0d2eab0ac3aebf30f5d1edda7d366e832a` antes
da integração. Foram preservadas as atualizações concorrentes e repetidos os
testes de animação, Kanto e Hobbies. O push solicitado não usa force push.

Vercel: a base967d7db já gerou deploy Git de PRODUÇÃO READY,
`dpl_AbGcxwX1n29EJBxE4UTsSDm1AkWv`. Um push futuro na main deve ser considerado
um gatilho de publicação em produção. O push solicitado também aciona o workflow
`kanto-geometry.yml`. Nenhuma configuração de deploy foi modificada.

## Verificação final concluída

90 casos/360 cenas e18 perfis com save/reload: PASS, zero erros JS. Teclado/toque,
input mantido contra obstáculo com entrada em IDLE, parada sem drift: PASS nas
três resoluções. MP4 final:123s/20FPS/2460frames, cobertura240 com quatro fases,
zero erros JS e hashes dos arquivos finais.30 comparações e90 folhas alinhadas
foram produzidas; todas as30 combinações personagem/roupa foram inspecionadas
visualmente, complementadas por filmstrips da captura real. Patch e versão final
estão registrados no relatório do ZIP, incluindo resultado da aplicação limpa.
