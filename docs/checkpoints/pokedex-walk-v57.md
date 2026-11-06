# Animações Pokédex V57

Base main f9bf6fcf647e78153d92505bb9ece97461e2ff0d (V56). Pacotes recebidos: 186 perfis de campanha/Paldea e 763 adicionais da Pokédex. Mesclados 949 IDs ausentes; 76 perfis já aprovados preservados. Total 1025 espécies, 2050 versões Normal/Shiny. Megas, variantes alternativas e Halloween fora dos pacotes e sem alteração. Parâmetros recebidos reutilizam sprites existentes; não são arte nova desenhada.

Todos os 12508 frames/células Normal/Shiny foram auditados com alpha válido. 34 atlas locais; Pecharunt normal/shiny página 16 já existe no repositório, resolvendo a pendência apontada no ZIP. Atlas fornecidos são byte a byte idênticos ao jogo; manifesto de 1025 espécies e cache máximo duas páginas preservados. Nenhuma substituição de controlador completo ou manifesto de demonstração. Somente novo registro de perfis no controlador de produção, sem mudar percurso, relógios existentes, colisões, cenas, apoio/cadência anteriores.

Novo teste: 949 espécies × 2 paletas × 3 FPS × 3 velocidades = 17082 cenários, com direção, curvas, repouso/retomada, paredes e cenas. Passou. Testes legados de Pikachu foram atualizados porque sua caminhada agora é intencionalmente alvo da integração; a suíte de Quaxly e a comparação exata do Quaxly permanecem ativas, além da proteção integral dos 76 perfis anteriores. Fixture /tests/pokedex-integrated-v57.html usa jogo real e perfil descartável, sem conta online. Revisão visual individual das 1025 espécies não foi realizada.

Pendências solicitadas nesta mesma entrega: limpar textos Halloween e dados Cards legados, ocultar Hunts/AFK, liberar profissões no treinador Lv2, mostrar Balls de craft somente ao Engenheiro, restaurar sprites de itens, melhorar buffs, cinemáticas mobile, Auto Hunt VIP e Viridian.
