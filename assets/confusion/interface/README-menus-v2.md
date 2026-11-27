# Reformulação visual dos menus

Este mapa de telas acompanha o kit descrito no [README das artes v2](README-v2.md). As telas com vários painéis mantêm cabeçalho, voltar/fechar e ações principais ao alcance em celular deitado. O conteúdo central pode rolar. De volta de um detalhe, preserve a aba, a seleção e a rolagem.

## Telas do jogo

| Menu | Reformulação e conteúdo |
|---|---|
| Entrada, conta e escolha do inicial | Separar autenticação e seleção da criatura. Dar espaço ao retrato de cada inicial e deixar claro qual está selecionado antes de confirmar. |
| Refúgio e Menu Principal | Equipe em repouso com até quatro integrantes, atalhos por função, card do perfil e saldos juntos. Mostrar estado bloqueado das rotas com o requisito. Incluir os atalhos de Batalhas e de utilidades. |
| Domador e Mochila | Cabeçalho e cinco abas fixos. Na aba Domador, usar card real à esquerda, controle de pontos no centro e origem dos atributos à direita. Em Fragmentos, usar grade com nome, ícone e saldo mais detalhe do selecionado. Em Chefes, mostrar retrato, progresso da receita e ação de criação. Em Ovos, mostrar tier, espécie quando conhecida e estado de eclosão, incluindo o painel vazio. Em Itens, usar grade de materiais, poções, moedas e consumíveis com quantidade e descrição. |
| Equipe e Domadores de Apoio | Quatro vagas estáveis e sem sobreposição, reserva navegável e destaque para o membro selecionado. O apoio tem card próprio com habilidade e condição de uso. |
| Ficha, evolução e reprodução | Retrato, forma atual e próximos estágios identificáveis. Separar atributos, habilidades, vínculo, pré-requisitos de evolução e fluxo de reprodução com confirmação e resultado. |
| Coleção e Codex Onírico | Grade de cartas com filtros por elemento, raridade e estado. Detalhes e bônus no painel de seleção. Cartas e fusão devem seguir o mesmo padrão quando estiverem disponíveis. |
| Invocação e revelação | Capas inteiras e botões ×1 e ×10 visíveis. Exibir elenco, saldo do banner ativo, chances, garantias e resultado individual ou em grade. Alternar entre Adventurer e os banners ativos. |
| Campanha e Campanha Mini | Manter mapa, capítulo e progresso próximos. Mostrar estrela, custo de energia, condições da fase e recompensas em um detalhe da fase. Incluir fase secreta, desbloqueio, mapa da região e viagem. |
| Batalhas e Arena | Seletor dos modos com a arte de arena. Em combate, ordem, velocidade, minimizar e ações legíveis. No resultado, equipe, vitória ou derrota, recompensas e próxima ação. Cobrir também recuo, batalha rápida e indicador de batalha minimizada. |
| Caçadas, Atlas, Auto-Caça e Idle | Mostrar mapa, criaturas, drops, nível e condições de entrada. Nas configurações de Auto-Caça, agrupar opções e manter o botão de aplicar. Em Idle, mostrar ganho ativo e resumo do ganho offline, com coleta. |
| Chefes, Revanches e criação | Cards com a arte de cada chefe, progresso dos fragmentos e ações de batalha e de criação em lugares distintos. |
| Torres | Seletores de Elementais e Únicas. Na Torre Elemental, prever filtros pelos 18 elementos, seleção de andares, distinção de chefe e bloqueio, energia, primeira vitória e treino. Na Única, mostrar linhagem, Pó Único e progresso da arma. A Torre de Halloween mantém o próprio painel no evento. |
| Calabouços | Prever filtros pelos 18 elementos, seleção de local e nível, arte do chefe, possíveis drops, energia e ações de combate. Mostrar o requisito da Batalha Rápida quando bloqueada. Loja, moeda e filtros de conjuntos ficam próximos. Na captura atual, as chances aparecem como 6000%, 3500% e 500%. A interface deve apresentar os pesos normalizados, 60%, 35% e 5% nesse exemplo. |
| Relíquias | Grade filtrável, detalhe do item e comparação com o equipado. Separar Vincular/Equipar, Aprimorar e demais ações disponíveis com seus custos. |
| Missões, Marcos e Paralelas | Exibir Marcos por categoria, com progresso. Separar as Paralelas por capítulo e usar uma lista rolável com filtros de disponíveis, em andamento, concluídas e bloqueadas. Detalhes do NPC, objetivo, etapa, condição de desbloqueio e recompensa ficam ao selecionar a missão. Mostrar o total e progresso do capítulo com os dados reais. Incluir Diário, Diárias, Semanais e atalhos da Temporada no inventário de integração. |
| Guilda | Contratos, Fazenda, Oficina e Reinos têm navegação persistente. Em Contratos, requisitos e entrega. Na Fazenda, produção, estoque e melhorias. Na Oficina, receita e fabricação. |
| Regiões, Reinos e Estratégia | Seletor de regiões e reinos com ilustração, desbloqueio, progressão e viagem. Na Estratégia, reservar áreas distintas para mapa, produção, construção, economia, defesa e resultado. |
| Crônicas | Crise e Herói × Vilão em abas. Na Crise, destacar o estado atual da cidade e a ação disponível. Em Herói × Vilão, dar espaço aos dois lados, histórico e resultado. |
| Mundo e Diário | Índice visual dos sistemas do Mundo e diário de pistas. Aplicar cabeçalho, estados e cartões de ação aos detalhes de vilas, NPCs, refúgios, masmorras e rotas comerciais. |
| Eventos, Halloween e recompensas | Seletor por evento e estado da edição. No Halloween, cobrir Banner, Coleção, Torre, Loja e Poções. Usar saldo próprio de cada evento e incluir Vote & Ganhe. |
| Passe e Login de 7 dias | Trilha legível, status de bloqueado, disponível e coletado, progresso, diárias e recompensas. Login com os sete dias e ação do dia. |
| Configurações, tutorial e diálogos | Controles em grupos curtos, confirmações em painéis próprios, retratos nos diálogos, textos e botões que cabem em retrato e paisagem. |

## Perfil quadrado do Domador

O card na aba Domador mantém o layout aprovado. Seu retrato usa um recorte quadrado e exibe o ícone equipado. Sem ícone equipado, usa o retrato real do personagem selecionado. O avatar oficial do Azazel está em `descanso-v1/avatar-azazel.webp`. A moldura equipada é uma camada transparente do mesmo tamanho e compartilha o alinhamento da foto. Ícones e molduras de evento aparecem na personalização quando forem conquistados.

O quadro mede 512×512 px a 2×. Encaixe o recorte quadrado da foto na abertura de 356×356 px, com origem em (78, 78), e sobreponha a moldura no quadro inteiro. O recorte e a moldura escalam juntos, sem distorção. Os ornamentos podem cobrir parte dos cantos da foto, por isso o editor deve orientar o jogador a centralizar o rosto.

| Arquivo em `kit-v2/perfil/` | Tamanho | Visual |
|---|---:|---|
| `farol.png` | 512×512 | Moldura padrão com emblema do Farol |
| `ignaraz.png` | 512×512 | Obsidiana e miniatura de Ignaraz |
| `vaelirion.png` | 512×512 | Metal cobalto e miniatura de Vaelirion |
| `florivel.png` | 512×512 | Folhagem e miniatura de Florivel |
| `ambar-fossil.png` | 512×512 | Âmbar Fóssil, Passe Dinossauros |
| `ossada-antiga.png` | 512×512 | Ossada Antiga, Passe Dinossauros |
| `pegadas-no-barro.png` | 512×512 | Pegadas no Barro, Passe Dinossauros |
| `vulcao-adormecido.png` | 512×512 | Vulcão Adormecido, Passe Dinossauros |

O botão **Personalizar** abre a escolha de ícones, molduras e foto da galeria. O jogador pré-visualiza o enquadramento quadrado e a moldura antes de salvar. A foto pessoal fica em moderação antes de ser exibida fora da prévia local. A validação deve impedir a publicação de nudez, conteúdo sexual e outras imagens impróprias. O perfil mantém a escolha atual enquanto a nova foto estiver pendente ou for rejeitada. Exiba o estado da solicitação e permita que o jogador remova a foto. Esse fluxo e sua persistência ficam com os agentes de implementação.

## Cobertura das Torres, Calabouços e Missões

O seletor das Torres Elementais e dos Calabouços deve cobrir Fogo, Água, Planta, Terra, Diurno, Noturno, Lutador, Voador, Veneno, Psíquico, Inseto, Pedra, Fantasma, Elétrico, Gelo, Dragão, Aço e Fada. Normal é o Neutro no catálogo e fica fora da contagem de 18. Os ícones já existem em `menus-v1/ficha/sonho-*.png`. A composição deve acomodar o catálogo completo sem depender de uma fileira longa de botões. O mapeamento atual deixa Lutador, Veneno, Psíquico, Gelo, Dragão e Fada sem opções elementais nos dois modos.

Cada capítulo da Campanha Mini deve ter **no mínimo 20 missões paralelas distintas**. As etapas de uma missão pertencem àquela missão. O catálogo verificado tem três missões em cada um dos 12 capítulos. O novo mínimo equivale a 240 missões no total. A autoria, os desbloqueios e as recompensas ficam com os agentes de conteúdo e sistemas.
