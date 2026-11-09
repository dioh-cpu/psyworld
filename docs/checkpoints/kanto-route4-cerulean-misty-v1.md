# Kanto V6 — Rota 4, Cerulean e Misty

- Base: `804988a55aca742e632cafa763e41d9c080f2ad0`
- Branch: `campaign/kanto-route4-cerulean-misty-v1`
- Escopo: Rota 4, Cerulean e Ginásio de Misty; sem abrir Rotas 24/25.
- Mapas usam o controlador contínuo V4 e máscaras 32×20 alinhadas à arte. A Rota 4 agora segue o caminho arenoso até o portão; células de água, paredões e construções permanecem bloqueadas. Coletas foram movidas para áreas alcançáveis.
- Em Cerulean, os caminhos seguem a avenida de pedra, pontes e acessos visíveis. Os canais continuam bloqueados; o acesso do ginásio está nos degraus frontais do edifício central. Foi removido o falso acesso de casa que caía sobre a ponte.
- Testes: `kanto-route4-cerulean-v6.cjs`, `kanto-route3-v1.cjs`, `kanto-mt-moon-v1.cjs`, `kanto-pewter-v4.cjs`, `kanto-gym-hobbies-v70.cjs`, `kanto-world-quality-v4.cjs`, `kanto-v4-paths.cjs`, `kanto-story-v49.test.cjs`; Chromium validou caminho navegável, movimento contínuo, entradas, bloqueio dos canais e viewports desktop/retrato/landscape sem erros JS.
- Chromium também percorreu a porta do Ginásio de Misty e chegou à posição de aproximação da arena. Testes anteriores desta branch já confirmaram batalha real, vitória/derrota e persistência.
- Commit do conteúdo: `7ff3b112853232e55b84544e6c487432e988d175`.
- Publicação: integrado à `main`; Vercel `READY` em `psyworld-7s4fjbll9-world-of-monsters.vercel.app` e alias `https://psyworld-murex.vercel.app`. Smoke test HTTP retornou 200 para index, módulo costeiro e imagens.
- Próxima ação: seguir para Rotas 24/25 em solicitação futura; elas não fazem parte deste lote.
