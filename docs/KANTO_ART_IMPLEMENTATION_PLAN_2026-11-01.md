# PSYWORLD — plano de arte e mapas jogáveis de Kanto

Data: 01/11/2026  
Branch de referência: `codex/kanto-atlas-20261031` (`241f4c3d59e4a649cdfb98b4630dc2e160280335`)

## Auditoria do que existe

- `assets/story/kanto-region-v1.webp`, `kanto-pallet-town-v1.webp` e `kanto-route-1-v1.webp` são ilustrações de referência do atlas; não contêm grade de colisão nem funcionam como mapas caminháveis.
- `core/kanto-journey-v1.js` cadastra 38 paradas e 116 subáreas de caça. A Rota 1 é a única com habitats físicos e pools próprios na grade atual; as outras paradas ainda usam o fluxo/visual compartilhado.
- `assets/idle-realistic/pallet/` contém nove props (árvores, pedras, arbustos, toco, tronco e placa) do Psy Idle. Eles podem ser reutilizados após conferir escala/licença visual e contraste, mas não substituem um tileset de campanha.
- `assets/idle-realistic/hunts/kanto/` contém 18 imagens por tipo. São ícones de hunt, não cenários de cada rota.
- `core/city-halloween.js` compõe a praça de Pallet por desenho de canvas e efeitos; a árvore atual não contém tilesets exclusivos de cidade para as demais paradas.
- As 30 spritesheets de fantasias (seis identidades × cinco opções) são arte de personagem jogável, separada da arte de cenário. O contrato aprovado é 4×4, 2048×2048, células 512×512; os IDs não podem ser cruzados.

## Contrato de arquivo por parada

Para cada ID abaixo, produzir duas saídas distintas: um mapa físico com colisão e uma imagem de apresentação. A imagem nunca será usada como colisão.

- Mapa físico: `assets/kanto/maps/<id>-v1.json`
- Arte de apresentação original: `assets/kanto/locations/<id>-v1.webp`
- Índice de conteúdo: `assets/kanto/maps/index-v1.json` com o ID, tileset, tamanho da grade, spawn, saídas, NPCs, gatilhos de encontro, quests e requisitos de técnica de campo.

IDs do atlas: `pallet`, `route-1`, `viridian`, `route-2`, `viridian-forest`, `pewter`, `route-3`, `mt-moon`, `route-4`, `cerulean`, `route-24-25`, `route-5-6`, `vermilion`, `ss-anne`, `route-11`, `diglett-cave`, `route-9-10`, `power-plant`, `rock-tunnel`, `lavender`, `pokemon-tower`, `route-8`, `celadon`, `rocket-hideout`, `route-7`, `saffron`, `silph-co`, `route-12-15`, `fuchsia`, `safari-zone`, `route-16-18`, `route-19-21`, `seafoam`, `cinnabar`, `pokemon-mansion`, `route-22-23`, `viridian-gym` e `indigo`.

## Tilesets originais a produzir

Criar spritesheets transparentes de tiles de 48×48 px, com uma grade regular e `tileset.json` para cada folha. Cada tema precisa de chão caminhável, bordas, obstáculos, topo de árvores/rochas, plataformas quando aplicável, decoração e variações sem bloqueio. Não gravar grade, sombras ou colisão na textura.

| Arquivo | Uso principal | Elementos visuais próprios |
| --- | --- | --- |
| `assets/kanto/tilesets/settlement-kanto-v1.png` | Pallet, Viridian, Pewter | casas baixas, cercas, placas, jardim e caminhos largos |
| `assets/kanto/tilesets/forest-kanto-v1.png` | Rotas 1–2, Floresta de Viridian | capim alto, árvores em camadas, clareiras, troncos e arbustos |
| `assets/kanto/tilesets/mountain-kanto-v1.png` | Rotas 3–4, Rotas 9–10, Rotas 22–23 | trilha irregular, paredões, rochas destrutíveis e marcos de altitude |
| `assets/kanto/tilesets/moon-cave-v1.png` | Monte Lua, Caverna dos Diglett | cavernas minerais, cristais, fósseis, túneis e passagens estreitas legíveis |
| `assets/kanto/tilesets/coastal-kanto-v1.png` | Cerulean, rotas 24–25, 11, 12–21 | água rasa/profunda, praias, pontes, píeres e borda de surf |
| `assets/kanto/tilesets/harbor-kanto-v1.png` | Vermilion, S.S. Anne | cais, navio, convés, interiores navegáveis e escadas |
| `assets/kanto/tilesets/electric-plant-v1.png` | Usina Elétrica | cabos, máquinas, salas de controle e corredores com portas |
| `assets/kanto/tilesets/rock-tunnel-v1.png` | Túnel Rochoso | rocha escura, poças, lanternas, bifurcações e marcos de Flash |
| `assets/kanto/tilesets/ghost-town-v1.png` | Lavender, Torre Pokémon | memorial, lápides, sinos, madeira antiga e interiores assombrados |
| `assets/kanto/tilesets/urban-kanto-v1.png` | Celadon, Saffron, Silph Co., esconderijo Rocket | quarteirões, lojas, escritórios, elevadores e mobiliário Rocket |
| `assets/kanto/tilesets/safari-kanto-v1.png` | Fuchsia, Zona do Safári | cercas abertas, lagoas, bambu, áreas de observação e trilhas naturais |
| `assets/kanto/tilesets/seafoam-ice-v1.png` | Ilhas Seafoam | gelo, correntes, rochas, água e pedras móveis para puzzles |
| `assets/kanto/tilesets/volcanic-mansion-v1.png` | Cinnabar, Mansão Pokémon | lava vista ao fundo, ruínas, laboratórios e portas secretas |
| `assets/kanto/tilesets/league-v1.png` | Caminho da Vitória, Ginásio Viridian, Planalto Índigo | cavernas da vitória, estátuas, mecanismos de Strength e arquitetura da Liga |

## Plano por fases

### Fase 1 — começo da jornada até o terceiro ginásio

Produzir e integrar mapas próprios para `pallet`, `route-1`, `viridian`, `route-2`, `viridian-forest`, `pewter`, `route-3`, `mt-moon`, `route-4`, `cerulean`, `route-24-25`, `route-5-6`, `vermilion`, `ss-anne`, `route-11` e `diglett-cave`. Entregar os tilesets de povoado, floresta, montanha, Monte Lua e litoral/porto primeiro. Fechar a história de Brock, Misty e Lt. Surge com NPCs, falas, quests, recompensas, encontros e saídas caminháveis.

### Fase 2 — Lavender, Celadon e Saffron

Criar mapas próprios para `route-9-10`, `power-plant`, `rock-tunnel`, `lavender`, `pokemon-tower`, `route-8`, `celadon`, `rocket-hideout`, `route-7`, `saffron` e `silph-co`. Fechar os puzzles de Flash, elevadores/chaves e a progressão de Erika e Sabrina. Incluir variantes de hunt em clareiras, andares e salas, sem criar corredores que impeçam o jogador de circular.

### Fase 3 — Fuchsia, Cinnabar e arquipélago

Criar mapas para `route-12-15`, `fuchsia`, `safari-zone`, `route-16-18`, `route-19-21`, `seafoam`, `cinnabar` e `pokemon-mansion`. Integrar Koga, Blaine, Surf, Strength e puzzles com itens/esconderijos e rotas alternativas.

### Fase 4 — Liga e encerramento

Criar `route-22-23`, `viridian-gym` e `indigo`, com desafios da Equipe Rocket/Giovanni, Caminho da Vitória, Elite Four e encerramento. Não marcar a campanha como completa antes de os mapas, batalhas, saídas, bloqueios e recompensas dessa fase funcionarem.

## Regras de composição, colisão e QA

1. Cada mapa deve ter rotas principais contínuas com largura mínima de dois tiles, áreas abertas para luta e espaço para contornar NPCs/props. Não preencher cidades de obstáculos apenas para decorar.
2. Colisão deve vir de `maps/<id>-v1.json` em matriz/máscaras separadas: cada tile visual tem uma propriedade de colisão e, quando necessário, uma de interação. Nunca inferir colisão de pixels da arte ilustrativa.
3. Portas e saídas devem ter pares explícitos (`destination_map`, coordenada de destino e requisito). Todo gate de Cut, Surf, Dig, Rock Smash, Flash, Fly ou Strength precisa de rota alternativa quando a narrativa permitir; itens secretos devem ser alcançáveis apenas depois da técnica correspondente.
4. NPCs, encontros, quests e puzzles devem usar IDs estáveis e persistidos no save; rever o conteúdo de Kanto não pode reiniciar saves existentes nem alterar a economia de Psy Idle.
5. Verificar cada mapa no renderer real em PC e mobile: limites, spawn, colisões, saída de volta, áreas de caça, textos sem sobrepor o HUD e sprites sem cobrir passagens.
6. Para spritesheets de treinador, validar 16/16 frames visíveis, mesmas dimensões, transparência e linha dos pés; conferir as quatro direções em animação e selecionar o arquivo somente pelo par `character_id + costume_key` do manifesto.

## Ordem recomendada

1. Congelar o manifesto de assets/IDs e a escala de mapa/tiles.
2. Concluir a integração das seis identidades e das 30 fantasias sem mudar `main`.
3. Produzir o primeiro tileset e mapas da Fase 1; validar câmera, colisão e transições antes de multiplicar mapas.
4. Integrar NPCs, quests, técnicas de campo e pools de encontros por mapa.
5. Repetir as fases 2–4, com validação jogável após cada grupo.
6. Atualizar o atlas para apontar somente para mapas realmente existentes e registrar em checkpoint os mapas completos, pendências visuais e de gameplay.

**Critério de conclusão:** cada uma das 38 paradas tem mapa físico e arte próprios, rotas conectadas, encontros/quests pertinentes e testes de entrada/saída; os oito ginásios e a Liga avançam em ordem, e nenhum segredo é liberado sem seu requisito. As três ilustrações do atlas ou um layout genérico compartilhado não satisfazem esse critério.
