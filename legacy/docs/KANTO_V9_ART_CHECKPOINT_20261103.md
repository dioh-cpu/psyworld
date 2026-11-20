# PSYWORLD — Kanto V9, revisão visual de Pallet Town (03/11/2026)

**SOMENTE PREVIEW:** branch `teste/kanto-pallet-rota1-v2`. Não fazer merge para `main` sem aprovação do usuário. Produção permanece restaurada, sem a campanha.

## Alterações
- Substituída a função única de interiores genéricos por 6 cenários ilustrados e individuais em `assets/kanto/interiors/*-v9.svg`: Centro Pokémon, Poké Mart, laboratório, casa do jogador e duas casas de moradores.
- Criados 7 sprites originais de corpo inteiro e escala coerente em `assets/kanto/npcs/*-v9.svg`; retratos existentes do jogo continuam nos diálogos quando disponíveis.
- O interior não mostra mais textos grandes desenhados no chão nem blocos provisórios no lugar de ambientes.
- `core/kanto-interiors-v9.js` é a autoridade única para arte, obstáculos, NPCs e pontos de interesse dos seis ambientes.
- `core/kanto-world-v2.js` passa a desenhar cada fundo por sua arte independente, renderiza sprites de NPC separados dos retratos e preserva os pés ancorados.
- Narrativa contextual de cada casa, falas próprias de Carvalho, Enfermeira Íris, Davi, Elisa, Luna, Abel, Celina e guarda.
- A missão inicial continua exigindo Carvalho, Centro Pokémon, Poké Mart e guarda antes da Rota 1; atendimento e conversa com o lojista contam ao falar, não ao entrar pela porta.
- Mensagens técnicas/indicadores com quatro caixas quadradas foram substituídos pelo objetivo narrativo atual.
- Diálogos redesenhados com moldura e hierarquia mais legíveis em `css/kanto-world-v2.css`.
- Chaves de cache alteradas em `index.html` apenas na branch de testes.

## Validação
- 6 imagens SVG de interiores e 7 sprites SVG inspecionados, estruturas de tags fechadas corretamente.
- `tests/kanto-interiors-v9.cjs` valida referências locais das artes, alcançabilidade de todas as portas e NPCs em cada interior e presença dos gatilhos da missão.
- O código de `core/kanto-world-v2.js` passou por verificação de sintaxe.
- Ainda necessária a inspeção visual em navegador Android real e testes funcionais do mercado, diálogos, cura e saída de todas as casas.

## Pendências honestas
- As artes V9 foram criadas como SVG ilustrados exclusivos para a preview. Nem todas as artes antigas da Biblioteca estavam disponíveis como bytes utilizáveis diretamente no repositório.
- A ligação do catálogo do Poké Mart com a interface legada ainda deve ser testada no celular. Ao abrir o catálogo antigo, o fluxo de retorno à campanha pode necessitar ajuste.
- As expressões dos retratos ainda são limitadas pelo material existente no próprio GitHub; ampliar o repertório requer integrar as folhas aprovadas que estejam disponíveis como assets.
- Não publicar na produção antes de aprovar as telas e percorrer a missão ponta a ponta.
