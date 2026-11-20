# PSYWORLD — checkpoint Kanto — 2026-10-31

## Decisões preservadas
- O primeiro mundo de história é Kanto (Geração I), com progresso por descoberta, história, missões, ginásios e técnicas de campo.
- Hunts são uma ferramenta de farm adicional e não liberam Kanto inteira de uma vez.
- Pokémon entram no catálogo de hunts depois de serem encontrados no mundo de história.
- Cada parada deve ter identidade própria, personagens clicáveis, espaço caminhável, colisões, missões, mistérios e áreas de caça.
- Segredos podem exigir Cut, Surf, Dig, Rock Smash, Flash, Fly, Strength e outras técnicas.
- A arte do atlas é ilustrativa; a grade jogável é a autoridade de colisão/movimento.

## Entrega desta atualização
- `core/kanto-journey-v1.js`: atlas da campanha com 38 cidades, rotas, cavernas e marcos de Kanto; NPC/quest/gate por parada; 116 subáreas de caça listadas; técnicas de campo e enigmas/recompensas.
- Rota 1: cinco habitats de caça. Dois estão na trilha inicial; bosque, recanto rochoso e margem oculta são abertos por Cut, Rock Smash e Surf. Os três locais secretos têm grama própria, colisão e pool de encontros próprio quando selecionados.
- `core/city-halloween.js`: ajustes de identidade Pallet Town, fala do Professor Carvalho, tema noturno persistente e integração para não sobrepor os tiles secretos com a camada de NPCs da cidade.
- `index.html` e `css/kanto-journey-v1.css`: ligação do Atlas e estilos mobile.
- WebPs originais do atlas para Kanto, Pallet Town e Rota 1 em `assets/story/`.

## Limite de implementação neste checkpoint
As 116 subáreas estão cadastradas no atlas da campanha. A navegação física e os pools de encontro específicos estão implementados na Rota 1; as demais áreas aguardam seus respectivos mapas jogáveis e tilesets. Não tratar a arte do atlas como tilemap com colisão.

## Validação
- `node --check` passou em `core/kanto-journey-v1.js` e `core/city-halloween.js`.
- `git diff --check` passou.
- Não foi executado teste end-to-end no navegador.
