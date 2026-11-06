# Treinador separado do inicial — V55

Base main: 7c53f8bbb26fe7022bbe5a689cb81dd8d8d72666. Bug relatado: online novo perfil pula treinador e Quaxly vira avatar. Causa: startPendingFresh abriu diretamente o seletor de iniciais; sem playerCharacterId, a atualização visual usa sprite Pokémon legado. Além disso, maintenance reexecutava a criação a cada 1,8 s enquanto pending existia.

Correção: picker aceita continuação explícita; online pede treinador, salva identidade/fantasia, depois abre as nove gerações/27 iniciais. Guard pendingEntryNickname evita reabrir/resetar tela/time durante manutenção. Cancelar/Voltar não confirma nem avança. confirmStarter também exige identidade se ausente. Perfis já com time mas sem identidade recebem picker de reparo na atualização visual, preservando time/progresso; enquanto ausente ou arte carrega, não é exibido Pokémon como treinador. Fluxo local existente continua com seu prelúdio.

Arquivos: core/halloween-ui.js, core/online-profile-entry-v37.js, cadeia de cache-bust core/account-menu-v34.js/core/new-account-logout-v33.js/core/prelude.js, index.html; fixtures e tests/trainer-entry-v55.test.cjs. Nada muda em raridade, kit, atributos, animações ou seguidores. Sem migração SQL.

Validação local: 28 suítes tests/*.test.cjs passaram; cinco scripts passaram node --check. Nova suíte cobre identidade antes de inicial, manutenção idempotente, cancelamento sem continuação, gravação de personagem/fantasia e preservação do time/Gold. Fixture /tests/trainer-entry-v55.html usa pending local sem autenticar conta real; não confirma criação no backend.

Navegador: fixture publicada f3e6520c943bc8e96557bc3c9b094d6d49020951. Confirmado fluxo pending local → seletor de treinador → gótico → 27 iniciais → Quaxly → cidade. Canvas #psy-halloween-avatar exibido com data-character=gothic_boy; #player-poke-sprite display none. Sem sessão autenticada ou gravação de personagem no servidor. Correção de perfis sem identidade coberta por guard de atualização visual e preservação de dados; não foi acessada conta real do usuário.
