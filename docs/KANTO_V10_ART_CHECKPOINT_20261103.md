# PSYWORLD — Checkpoint de testes Kanto V10 — 03/11/2026

**Nunca publicar na main sem autorização explícita do usuário.**
Base de testes: `teste/kanto-pallet-rota1-v2`.

## Motivo
A V9 exibia interiores SVG vetoriais simplificados e câmera `cover` em telas móveis, ampliando exageradamente balcões, NPCs e objetos. Isso não correspondia ao padrão visual de Pallet nem ao material demonstrado ao usuário. A antiga ilustração promocional não era uma captura do jogo e não deve voltar a ser apresentada como resultado executado.

## Implementado
- `core/kanto-room-pixel-v10.js`: seis interiores próprios criados com pintura em canvas pixel art (480×720) e armazenados em cache na primeira entrada.
- Centro Pokémon, Poké Mart, laboratório, casa do jogador, casa leste e casa oeste têm decoração, mobiliário, texturas, iluminação e paletas próprias.
- Arte vertical adaptada ao smartphone; câmera de interiores usa `contain`, preservando o cenário inteiro em vez de aplicar zoom extremo.
- `core/kanto-interiors-v9.js` conserva os dados narrativos e das missões; a V10 atualiza coordenadas, zonas bloqueadas, NPCs e saídas.
- NPCs e respectivos retratos agora são consistentes (não usar retratos aleatórios de outras fantasias).
- As imagens originais de Pallet e as seis artes de treinadores foram recuperadas por SHA de `codex/kanto-atlas-20261031`, sem gerar blob/ZIP desnecessários.
- Imagens cinematográficas originais utilizadas em molduras ambientais dentro dos seis interiores; o laboratório utiliza `pallet-03.webp`.
- `core/kanto-world-v2.js` atualizado para renderizar a pintura do cômodo, usar dimensões 480×720 no movimento, respeitar colisões e carregar os quadros originais.
- Mantidos gatilhos de Carvalho → Centro Pokémon → Poké Mart → Guarda → Rota 1.

## Testes
- `tests/kanto-v10-rooms.cjs`: seis ambientes, cache individual, 20 mil+ operações de arte, todas as saídas e NPCs alcançáveis, posições de NPC não bloqueadas e presença dos gatilhos da missão.
- Teste de canvas real executado no ambiente isolado da Vercel usando `@napi-rs/canvas`, gerando montagem real das seis pinturas (não mockup).
- `node --check` executado para o novo módulo e o motor do mapa; verificações adicionais de sintaxe executadas.
- Próxima verificação: percorrer os seis interiores no dispositivo Android e revisar os elementos artísticos em escala final. O navegador remoto não concluiu um teste de interação real porque o sandbox expirou.

## Pendências conhecidas
- As pinturas V10 são pixel art gerada por código e **não são idênticas** à imagem promocional conceitual anteriormente apresentada. Evitar qualquer promessa de equivalência até o usuário aprovar as telas.
- Completar e verificar o fluxo de retorno do Poké Mart, quando aberto a partir da campanha.
- Conferir escala dos NPCs e expressões nos retratos de diálogo no celular.
- Garantir que a câmera externa Pallet/Route 1 permaneça com a colisão e velocidade que já estavam aprovadas.
- Em produção, manter versão anterior restaurada (`main` com commit `53507faf`).
