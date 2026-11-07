# PSYWORLD — Checkpoint main: títulos, incenso, itens especiais e DETALHES
Data: 2026-11-07
Branch: main
Produção: https://psyworld-murex.vercel.app
Commit principal: 363e7c7e1094aeb652c219e53729cc14997f5ab4
Commit de testes: c3badbf3e4367f1dc58915a6b2dc89995f38a94e

## Diagnóstico a partir do vídeo do usuário
O título Soberano do Halloween aparecia no referencial fixo da praça da Psy City (código `drawTitle(c,center.x,center.y-95)`) em vez de acompanhar o treinador. A Mochila não possuía filtro para os itens de evento. Botões DETALHES usavam `notif` por pouco tempo, em vez de uma janela explicativa. O Incenso não possuía contador global, embora sua duração estivesse corretamente armazenada.

## Correções aplicadas na main
- `index.html`: filtro ESPECIAIS na Mochila, com atualização das URLs de script para evitar cache antigo.
- `core/legacy-runtime.js`: novos filtros de itens especiais de evento, incluindo o Halloween e recursos de eventos reconhecidos pelo catálogo; preserva a classificação básica de Balls/Poções nas batalhas. Botões DETALHES agora abrem modal real com descrição, quantidade, botão de fechar e informações específicas de Incenso. Itens que possuem ação podem ter botão secundário DETALHES; Incenso exibe USAR e atualiza a Mochila depois de consumido.
- `core/seasonal-event-v1.js`: medidor compacto de efeitos ativos, com contador por segundo, quantidades de cargas de Incenso e horário restante da próxima expiração. Painel expandido mostra cada carga e os percentuais de bônus permanentes de títulos registrados em `PsyTitles`. Botão para abrir a lista de títulos. Loja da Amora explica que comprar não ativa o Incenso.
- `core/city-halloween.js`: o título exibido agora acompanha o personagem, desenhado no centro da câmera acima da cabeça e depois dos elementos ambientais, em vez de seguir uma posição fixa do cenário.
- `tests/halloween-status-inventory-v1.cjs`: teste de compra → inventário → ativação, 1h, chance de aparição, bônus de título ao ocultar a exibição, filtro ESPECIAIS, comportamento de detalhes, título centralizado no personagem e timer. Incluído em CI de Kanto.

## Regras verificadas
- Comprar Incenso (300 doces) adiciona 1 item, não cria carga ativa.
- Usar Incenso consome a unidade; a carga expira depois de 1h.
- Com chance-base 1%, 1 carga eleva a chance a 2%; múltiplas cargas continuam somando 1 ponto percentual respeitando limite máximo do sistema.
- Título adquirido (exemplo: recompensa de XP +0,4%) mantém o bônus mesmo depois de ocultar seu nome.
- Status exibe bônus extraído do catálogo real de títulos, não números fixos inventados.

## Validação
- Arquivos alterados passaram análise sintática do JS.
- Teste de regressão `tests/halloween-status-inventory-v1.cjs` foi executado contra os arquivos reais da main usando V8 com simulação de DOM e passou.
- Vercel: implantação do commit c3badbf3... READY, alias `psyworld-murex.vercel.app` confirmado.
- Não houve uma sessão de navegação gráfica real em Chromium nem teste em aparelho físico nesta execução. Validar visibilidade do medidor e comportamento do modal em retrato, paisagem e PC.

## PENDÊNCIAS CONHECIDAS
- Conferir o posicionamento visual do título quando a câmera da Psy City se aproxima dos limites do mapa.
- Verificar outros botões chamados DETALHES fora da Mochila separadamente; esta correção cobre os itens da Mochila, não todos os painéis do jogo.
- Revisar se os bônus de título estão sendo aplicados uma única vez em todos os modos; hoje diferentes sistemas aplicam `getTotalBuff` e `PsySeason.buff`.
- Preservar correções de cloud save, Halloween drop e PsyCoin anteriores a esta alteração. Não alterar saldos reais ou dados de jogadores neste checkpoint.
