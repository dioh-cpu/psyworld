# PSYWORLD checkpoint — correções Cards, iniciais e cura/tutorial (V60)

Data: 2026-11-06  
Branch: `teste/iniciais-oficios-v38`  
Commits de código: `0c36273fe0cad04a355829d7478a74a72af22409`, `a0e3e85416732a8b9eb9938225effe3f992b756b`  
Preview de código: https://psyworld-69m24ijxh-world-of-monsters.vercel.app/

## Pedido e decisões preservadas

- Manter o acesso **Cards** e os packs/coleção com seus atributos.
- Restaurar a ordem de criação: escolher um dos 27 iniciais antes de escolher o visual do treinador.
- Corrigir o tutorial de cura para fechar após curar e abrir diretamente a escolha obrigatória do acompanhante.
- Não alterar fórmulas, packs, coleção, dados persistidos, nem remover outros sistemas.

## Implementado

- Restaurados os botões de Cards no menu/conteúdo e no atalho flutuante, e seu carregamento sob demanda.
- Restaurada a seleção starter-first das 27 opções (9 gerações); seleção do personagem segue obrigatória depois.
- Corrigida a transição da cura para o seletor de acompanhante. Se o jogador cancelar, o tutorial mantém a etapa obrigatória ativa até confirmar um Pokémon.
- Corrigida a recuperação no Centro quando o perfil chega com HP máximo inválido/zero: deriva HP máximo pelas estatísticas disponíveis, limpa estado de nocaute e recupera o time.
- Corrigido acionamento indevido do aviso de Hunts ao carregar Cards quando a tela Hunts não existe.
- Nenhuma operação de compra ou gasto de recursos foi realizada nos packs. Nenhuma mudança de produção.

## Bônus de Cards

O painel antigo misturava bônus distintos: bônus permanentes da coleção (linhas evolutivas e economia) e uma linha “Card ativo (somente modo Cards)”, vinculada ao modo de batalha antigo. A linha “Card ativo” não era o bônus de packs/coleção. Esta correção restaurou o acesso e não alterou essas fórmulas ou dados.

## Verificação concluída

Testes executados:
- `tests/cards-access-v60.test.cjs`
- `tests/essential-heal-v59.test.cjs`
- `tests/trainer-entry-v55.test.cjs`
- `tests/profile-starters-v54.test.cjs`
- `tests/starter-hp-init-v46.test.cjs`
- `tests/starter-onboarding-v44.test.cjs`
- `tests/automation-faint-v32.test.cjs`
- `node --check` para os scripts alterados.

Verificação no navegador da preview:
- Cadastro local mostrou os 27 iniciais antes da seleção do treinador; Quaxly entrou com 243/243 HP.
- Tutorial abriu diretamente a escolha do acompanhante após cura de time derrotado e após HP inválido.
- Cancelar a escolha reexibiu a etapa obrigatória; confirmar o acompanhante concluiu o tutorial.
- Cards abriu o álbum e os packs; nenhum pack foi comprado.
- O fluxo automático não usou login/conta online.
- Preview final carregou a tela inicial normalmente.

## Continuação

Manter estas correções na branch de testes. Não remover Cards, álbum, packs, iniciais ou a etapa obrigatória do acompanhante sem pedido explícito. Não publicar em produção sem autorização.
