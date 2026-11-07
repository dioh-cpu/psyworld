# PSYWORLD — Checkpoint da Main: Ginásios, Hobbies e Download de Modos
Data: 2026-11-07
Branch: main
Site de produção: https://psyworld-murex.vercel.app

## Requisito do usuário
- O botão geral de GINÁSIOS não pode liberar o primeiro desafio de um líder; só oferece revanche após derrotar esse mesmo líder na campanha.
- Adicionar ao menu da campanha o botão "BAIXAR TODOS OS MODOS", usando o gerenciador de módulos existente.
- Adicionar ao mesmo menu "HOBBIES", contendo Minerador, Jardineiro, Pescador e Lenhador, como profissões auxiliares não exclusivas.
- Cada profissão auxiliar começa no nível 0 e tem quest de desbloqueio com 10 derrotas de tipos indicados + 5 espécies desses tipos registradas na Pokédex por captura.
- Não estabelecer requisito de nível 10 nem 2 de treinador.
- Profissões principais continuam separadas e requerem a primeira vitória sobre Brock, conforme correção de 2026-11-07.

## Alterações realizadas nesta sessão
Commit de ginásios: a38c7f864c6fbfa76ee01f317677ab57f90d5b09
- Novo `core/kanto-gym-campaign-gate-v1.js` com controle de origem da batalha e desbloqueio individual de revanche, registrado em `P.meta.kantoCampaignGymV1.victories`.
- O motor da campanha concede uma permissão descartável para começar a batalha apenas após interação com o líder na sua cidade.
- Vitórias do ginásio em batalha da campanha passam a registrar a liberação do botão após a confirmação efetiva da vitória e da insígnia.
- O menu de Ginásios mostra um bloqueio explicativo onde ainda não existe uma vitória registrada na campanha.
- `core/kanto-campaign-playable-v1.js` permite enfrentar dentro da campanha um líder que já conste no progresso antigo, caso a origem da primeira vitória não esteja comprovada; evita prender esses jogadores.
- Desafios por `startGymBattle` e atalhos `psyV10NextGym` respeitam a nova regra.
- Nenhuma insígnia antiga foi removida: o desbloqueio da revanche é um registro novo, independente do progresso de insígnias.

Commit de Hobbies e download geral: 5b9ae5387567c3e934b83d450aaf3a6d856449a7
- `core/kanto-world-v2.js`: adicionados botões HOBBIES e BAIXAR TODOS OS MODOS no menu atual de Pallet, Rota 1 e Viridian.
- Botão de download chama o gerenciador real e seu `psyInstallAllModes`, com o mapa suspenso enquanto o painel estiver aberto.
- Novo `core/hobbies-v1.js` e `css/hobbies-v1.css`: galeria interativa de quatro profissões auxiliares; nível 0 inicial, barras de progresso para 10 derrotas e 5 registros; desbloqueio individual sem exclusividade.
- Tipos: Minerador Terra/Pedra, Jardineiro Planta/Fada, Pescador Água, Lenhador Planta/Inseto.
- Contagem usa registros já existentes `P.meta.typeKills` e `P.meta.caughtDex`; XP futura de cada hobby tem API independente `PsyHobbies.addXP`.
- Adicionadas quatro artes SVG em `assets/hobbies/`: miner.svg, gardener.svg, fisher.svg, lumber.svg.
- Não altera o sistema das profissões principais.

Commit de testes: 433e65e87ea3d25cb4f4b5305f12e2160ea5d5f9
- Adicionado `tests/kanto-gym-hobbies-v70.cjs` ao workflow de geometria de Kanto.
- Corrigida a atualização visual dos cartões previamente bloqueados quando liberados para revanche.

## Validação realizada
- GitHub aceitou as alterações na main em commits fast-forward.
- Teste de regressão `tests/kanto-gym-hobbies-v70.cjs` foi executado em V8 com dependências `fs`, `vm` e assert simuladas usando os arquivos atuais e passou:
  - botão de Ginásio não abre sem vitória na campanha;
  - o mesmo Ginásio abre a partir do NPC da campanha;
  - a conclusão registra a vitória, e a revanche passa a funcionar;
  - insígnias antigas isoladas não liberam novos desafios no menu;
  - 4 hobbies começam no nível 0; Minerador desbloqueia com 10 derrotas/5 registros; Pescador não desbloqueia sem quest;
  - botão de todos os modos chama o sistema real e as quatro artes SVG existem.
- Checagem sintática de scripts JS alterados em V8 passou.
- Vercel confirmou implantação de produção READY do commit 433e65e... e alias `psyworld-murex.vercel.app`.

## Ainda precisa corrigir / validar
- Ainda não houve teste completo interativo no navegador gráfico ou no celular para esta alteração. Não declarar esse teste como realizado.
- A galeria dos Hobbies e suas quests funcionam, mas atividades jogáveis correspondentes (mineração de nós com 5 golpes, minigame de pesca, colheita e corte de árvores), efeitos, recompensas e progressão de XP in-world ainda precisam ser implementados e validados nos mapas.
- O menu da campanha `core/kanto-world-v2.js` só atende atualmente Pallet, Rota 1 e Viridian; nos mapas provisórios posteriores de Kanto ainda há o motor antigo sem equivalência total de menu. Uniformizar ao migrar Rota 2 e seguintes.
- Jogadores com insígnias antigas de origem desconhecida precisam vencer o líder novamente pela campanha para registrar a primeira vitória comprovada e liberar a revanche no botão; preservar insígnias existentes.
- Ao avançar para outros ginásios, validar o fluxo real da campanha, bloqueio e abertura do botão em PC, Android retrato e landscape.
- Não reintroduzir nenhum requisito de treinador de nível 2 ou 10 para escolher profissões. Profissões principais liberadas depois de Brock.

## Baseline
Tratar o HEAD de main do PSYWORLD após este checkpoint como baseline preferencial, sem alterar os arquivos de produção fora do escopo e sem reverter correções de tutorial, câmera, menu de campanha ou colisões.
