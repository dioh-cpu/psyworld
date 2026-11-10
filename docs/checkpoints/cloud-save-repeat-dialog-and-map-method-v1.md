# PSYWORLD — Checkpoint de continuidade: Cloud Save e revisão individual de mapas
Data: 2026-11-10 (horário de Brasília)
Branch isolada: `fix/cloud-save-repeat-dialog-v1`
Baseline inicial consultada: `45464cd63354a8c7a0e00d383289f4f42ef5e7f4` (main)

## Problema prioritário reportado
A janela "QUAL SAVE VOCÊ QUER USAR?" reaparece em diferentes contas e após F5, inclusive depois de escolha anterior. A imagem do usuário mostrou duas datas diferentes (local e nuvem), mas não comprova qual snapshot é a fonte válida. Não apagar, mesclar ou substituir saves sem autorização expressa; não orientar limpeza de localStorage.

## Evidência técnica apurada
- `core/cloud-save-v23.js` chama `resolveConflict(game_state)` em `bootstrap` e `afterAuth`.
- `/api/player` devolve `player_game_state` (espelho legado por conta) e lista de `player_characters`. O endpoint `/api/player/character?nickname=` devolve save e timestamp do personagem correto.
- `core/online-profile-entry-v37.js` registra seleção de personagem em `psyworld_active_character_v38` e marcador `psyworld_cloud_sync_v23`, mas a abertura de personagem não definia `cloudRevision` de `player_characters.updated_at`.
- O upload usa `base_cloud_updated_at` da revisão armazenada, enquanto `api/player.js` compara com a revisão do personagem, favorecendo conflitos de versão espúrios.
- O comparador escolhe o save local de maior `savedAt` entre ativo e backup, podendo confundir escopos.
- `cloudStamp` usa o máximo entre campos heterogêneos, em vez de usar prioritariamente a revisão estável do servidor.
Esses são riscos identificados em código, não prova de que todos produziram o sintoma na conta do usuário.

## Requisitos da correção
1. Comparar apenas a conta autenticada e o personagem efetivamente selecionado. Nunca aplicar ao personagem ativo o save de outro personagem da mesma conta.
2. A seleção manual de sincronização deve ser lembrada por conta + personagem; F5 não deve reabrir modal quando nada relevante mudou.
3. Em conflito real de duas versões alteradas, manter escolha explícita; em caso de "Cancelar", não sincronizar silenciosamente e evitar insistência ao recarregar.
4. Preservar automaticamente backups anteriores ao download, salvar server revision correta; PsyCoin comprado permanece vinculado ao ledger do servidor.
5. Não tentar resolver divergência deletando localStorage, apagando personagens ou mesclando inventários arbitrariamente.
6. Testar cenários: local->cloud, cloud->local, cancel/F5, duas contas e dois personagens, save mais recente em outro dispositivo, 409, recarregar/salvar, carteira e inventário.
7. Não publicar sem testes focados e um teste Chromium local; integração deve preservar main concorrente.

## Método de trabalho solicitado pelo usuário — permanente
- Trabalho concreto e econômico: inspecionar arquivo atual e histórico mínimo antes de alterar; identificar causa e implicações; corrigir escopo mínimo; validar tecnicamente e visualmente; reportar apenas o que foi comprovado.
- Evitar auditorias repetidas, prompts genéricos, renders desnecessários e promessas sem arquivo alterado.
- Um problema / localidade por vez, branch isolada, checkpoint com SHA, pendências e validações. Não usar force push; sem deploy automático de código não validado.
- Campanha de Kanto: revisão manual **localidade por localidade**, desde Pallet Town, baseada em prints anotados pelo usuário no Paint. O usuário demarca áreas de caminhada/obstáculo/água/alteração de caminho/NPC/saída; o agente traduz marcações em colisão/pathfinding/ajustes gráficos. Priorizar coerência arte=física; manter o controlador V4, câmera, NPCs, save e recompensas.
- Lotes de revisão generalistas foram substituídos por aprovação **individual** de cada localidade, conforme screenshots do usuário. Não alterar outra localidade antes de recebê-la.

## Estado conhecido de Kanto
Última main da campanha informada: Lote B `46fce3abfd9badd8ed4a4c979e807cc1c3792134`; main avançou depois (baseline inicial acima). Lote A Pallet/Rota1/Viridian; Lote B Rota2/Floresta; Lote C1 Pewter teve desenvolvimento subsequente. **Não inferir que alguma localidade está geometricamente perfeita**: novos prints do usuário são base para revisão individual.
Problema atual prioritário: Cloud Save recorrente. Próxima localidade após correção e aprovação: Pallet Town com marcações do usuário.

## Estado deste checkpoint
Diagnóstico em código realizado. Branch criada; nenhum deploy nem acesso aos saves reais do usuário. Continuar pela correção focada no `cloud-save-v23.js` e `online-profile-entry-v37.js` e testes de regressão. Atualizar este checkpoint após implementar e validar.
