# Orientação essencial obrigatória V56

Pedido: tutorial obrigatório para não perder funções essenciais, especialmente acompanhante. O tutorial geral existente era opcional e não cobria acompanhante.

Novo core/essential-tutorial-v56.js: quatro etapas por perfil (controles/NPCs, equipe/bolsa/menu, objetivo/analisador/automação, escolha real do acompanhante). Usa PsyGuide existente, aponta e abre painel real, sem duplicar botões. Required bloqueia Escape e não oferece Pular; progresso salvo em P.meta.essentialGuideV56. Aplica-se também a perfis antigos que já marcaram tutorial geral visto. Só marca done depois de clique no Confirmar acompanhante real, com seleção habilitada e Pokémon vivo. Cancelar, nenhum ou abrir menu não concluem. Time todo desmaiado recebe ação de cura. Retomada depois de reload e via MENU → TUTORIAL / AJUDA; tutorial geral atualizado com localização do acompanhante.

Não altera time, líder, kit, raridade, economia ou animações. Só salva progressão tutorial e seleção normal do acompanhante via UI real. Suíte nova cobre ordem, obrigatoriedade, confirmação válida e não repetir salvamentos após concluir. Fixture /tests/essential-tutorial-v56.html usa perfil local descartável, sem login.

Validação concluída: três scripts passaram node --check; todas as 29 suítes passaram. Navegador em fixture local confirmou etapas 1–4, Escape sem pular, abertura de Conteúdo com alvo visível, abertura do menu real Acompanhante, seleção Quaxly, confirmação e mensagem de conclusão. Nenhum login online usado. Preview funcional testada: https://psyworld-3n9jqcui7-world-of-monsters.vercel.app/tests/essential-tutorial-v56.html . Estado completo para integrar na main sem mudar sistemas anteriores.
