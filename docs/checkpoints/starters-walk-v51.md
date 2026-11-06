# PSYWORLD — acompanhantes V51

Base remota confirmada: 93f8df42c418af8284f2cc7c6453c200ec98b02a, branch teste/iniciais-oficios-v38. Autorização: validar pacotes aprovados e publicar somente na preview desta branch. Main preservada.

Integração: 24 iniciais base das gerações 1–8, Normal/Shiny, mantendo Quaxly, Sprigatito, Fuecoco e Pawmi V50 (28 espécies, 56 apresentações). Mesclados exclusivamente os perfis de cadência, apoio e sombra aprovados. Nenhum sprite foi redesenhado. Atlas recebidos byte a byte idênticos aos existentes; preservado manifesto de 1025 espécies e cache de duas páginas. O index demonstrativo e manifesto parcial dos ZIPs não substituem o jogo. Evoluções e Megas do manual não integram esta entrega.

Controlador de produção usado nos testes. Percurso/amostragem e relógio aprovado do Quaxly preservados; colisão, seleção, cenas, Water Gun e sistemas não relacionados sem alterações nesta entrega. Cache-buster V51 no jogo e fixture anterior.

Validação local: 24 suítes tests/*.test.cjs passaram. generations1-8-walk: 432 cenários (24 espécies × Normal/Shiny × 30/60/120 FPS × 3 velocidades), quatro direções, curvas, paradas, retomadas, paredes, cenas e teleporte. Suítes Quaxly e Paldea preservadas; comparação legada mudou Bulbasaur para Ivysaur porque Bulbasaur é alvo intencional desta atualização.

Preview de integração: /tests/starters-integrated-v51.html. Preparar teste cria perfil descartável sem login online, seleciona os 28 acompanhantes e permite alternar Normal/Shiny, Pallet, Rota 1, laboratório e Cidade Psy. Não substitui saves reais. Testes de navegador e URL final serão registrados após o deploy.

## Resultado publicado e verificação

Commit funcional: 9702231e587d0c0827f5c59f332c8dfcbfd6c35c. Preview verificada: https://psyworld-mu0t1gdsf-world-of-monsters.vercel.app/ . Teste rápido: https://psyworld-mu0t1gdsf-world-of-monsters.vercel.app/tests/starters-integrated-v51.html .

Navegador: Bulbasaur Normal acompanhou o treinador em Pallet; Cyndaquil Shiny selecionado e carregado no laboratório; Scorbunny Shiny carregado na Rota 1; retorno a Pallet com Quaxly Normal e caminhada confirmada. Mapa principal abriu funcional. Demais espécies cobertas pelos testes automatizados, não inspecionadas individualmente no navegador. Logs amostrados continham somente erros de metadados da extensão Chrome, sem erro do jogo na amostra. Prova visual capturada: docs/screenshots/starters-v51.jpg.

Não foram executados nesta entrega benchmark em dispositivo físico, captura MP4 adicional nem validação visual individual de todas as 56 apresentações. A arte aprovada foi preservada. Documentação/tutorial recebido segue sendo referência; sua presença não autoriza evoluções/Megas ou alterações extras.
