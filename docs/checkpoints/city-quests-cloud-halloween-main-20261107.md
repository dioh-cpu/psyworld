# PSYWORLD — Checkpoint main: Quests flutuantes, caminhada por toque, Cloud Save e Halloween
Data: 2026-11-07
Branch: main
Site: https://psyworld-murex.vercel.app

## Pedidos e sintomas
- As quests na Psy City cobriam muito espaço; substituir por botão flutuante tocável e arrastável que abre e minimiza todas as quests ativas.
- Adicionar caminhada por toque na cidade, como a da campanha, preservando o joystick, velocidade e colisões.
- Um jogador de teste não recebeu o saldo de Halloween no jogo após gravação; estava presente no banco e foi sobrescrito por um snapshot local.
- Doces realmente caíam via sistema de batalha, mas a sincronização da economia online substituía a Mochila sem os itens locais do evento.
- Prevenir perdas de itens comprados e PsyCoin quando local/cloud divergem. Não combinar inventários por soma ou valor máximo indiscriminadamente, pois isso poderia duplicar itens consumidos.

## Causa técnica
- `api/player.js` salvava o snapshot inteiro, sem rejeitar versão antiga, substituindo moedas/eventos gravados diretamente no servidor.
- `core/cloud-save-v23.js` não enviava a revisão de base para detecção de conflito e não conciliava de volta no personagem local o saldo especial preservado pelo servidor.
- `core/online-authority-v26.js` (`mergeInventory(...,full=true)`) e `core/cloud-save-v23.js` (`applyEconomyState`) reconstruíam inventários comuns e apagavam o item `Doce de Halloween` e outros consumíveis de evento locais.
- `core/campaign-automation-v1.js` fixava a lista de quests na cena da cidade e faltava navegação por toque fora da campanha.

## Mudanças aplicadas
1. `api/player.js`: rejeita uploads com revisão remota divergente (409), rejeita snapshots comprovadamente antigos sem revisão, e preserva créditos especiais previamente registrados que ainda não chegaram ao cliente; utiliza a carteira PsyCoin em `players` quando há entradas em `wallet_ledger`, ignorando saldo antigo no save enviado. GET de personagem e estado reidrata saldo premium e itens registrados em `player_inventory`.
2. `core/cloud-save-v23.js`: envia `base_cloud_updated_at`, mantém a revisão remota, informa e interrompe envio ao detectar conflito, repassa resposta conciliada de prêmio de teste e PsyCoin para o personagem e salvamentos locais correspondentes, e identifica o personagem ativo antes de atualizar.
3. `core/online-authority-v26.js` e `core/cloud-save-v23.js`: em atualização da economia padrão, preserva a pequena lista específica de itens do evento Halloween não representados na economia V26, sem unir genericamente todo o inventário. Itens existentes no inventário autoritativo do servidor permanecem sob controle dele.
4. `core/city-quest-floating-v1.js` e `core/campaign-automation-v1.js`: lista completa de quests atuais na cidade dentro de gaveta recolhível, botão flutuante arrastável com pointer events, posição persistida por aparelho; oculto durante batalha e telas de menu; na campanha, quests continuam no menu da campanha.
5. `core/city-tap-navigation-v1.js`: toque/clique no canvas da Psy City calcula um caminho BFS pelos 60×60 tiles e sua geometria de colisão real, sem teleporte. Joystick e teclado cancelam a rota. Corrige coordenadas por escala do canvas. Não altera o movimento físico existente.
6. `core/module-loader.js` e `index.html`: cache-bust de dependências e carregamento ordenado.
7. `tests/city-cloud-halloween-v1.cjs`: teste sobre drop real do evento, não duplicação de prêmio, saldos online, percurso de cidade respeitando bloqueios, FAB de quests e carregamento.

## Verificações realizadas
- O banco de teste confirmou crédito de 1.000.000 de doces no registro do personagem e no espelho geral após a concessão marcada; a marca impede apagamento por um save de aparelho que ainda não a conhece.
- Avaliação de JS em V8 dos arquivos alterados passou.
- Teste de regressão `tests/city-cloud-halloween-v1.cjs` executado contra os fontes correntes com dependências simuladas passou para drop, conciliação, carteira, percurso e estrutura da UI.
- Teste da função real `hydratePurchasedAssets` com Supabase simulado passou, incluindo carteira e itens registrados no servidor.
- Ações adicionadas ao workflow `.github/workflows/kanto-geometry.yml` para checagem em novos commits.
- Implantação Vercel mais recente em produção com alias murex verificada por ferramentas (reconfirmar estado do último commit após este checkpoint).

## PENDENTE — não declarar como concluído
- Não houve sessão visual completa em Chromium/celular físico; falta validar o botão de quests e a navegação em retrato, landscape e computador.
- A sincronização não é um ledger transacional de TODOS os drops, compras e gastos offline. Para garantia forte multidevice sem conflitos em todos os itens, cada mutação deverá ser registrada no servidor com IDs idempotentes e reconciliação transacional; não aplicar `max()` nem soma cega como solução geral.
- A regra de rollback de snapshots tem detecção de conflito e backup local durante substituição da nuvem, mas ainda deve ser testada com duas sessões reais simultâneas antes de garantir ausência completa de colisões de writes.
- Não divulgar e-mail nem identificadores internos da conta de teste nos documentos públicos. Não criar ou gastar PsyCoin de teste sem solicitação.

## Compatibilidade
Manter main atual, não revertê-la para antes das correções de tutorial, câmera, Viridian, Ginásios e Hobbies. Não editar animações de Pokémon nem publicar APK. O balanceamento e itens já existentes devem ser preservados.
