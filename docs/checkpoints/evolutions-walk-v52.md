# Acompanhantes V52 — evoluções e integração na main

Autorização do usuário em 2026-11-06: integrar as animações adicionais e passar todo o conjunto da branch de testes para main. Base da branch teste/iniciais-oficios-v38: 6f07fbf90395ab72c83ee30863ecf013df3d4688. Main observada: 53507faf696d56b78ff336f422ea835c9fa34864.

Pacote de referência: Tutorial completo/REFERENCIAS/Animação evoluções gerações 1 a 8 - Segundas e terceiras evoluções.zip. Adicionados apenas 48 perfis de cadência, apoio e sombra de evoluções, nas duas paletas. Total 76 espécies/152 apresentações com os 28 acompanhantes previamente aprovados. Os atlas recebidos são byte a byte idênticos aos existentes. Manifesto completo de 1025 espécies e cache de duas páginas preservados. Mega não incluída: falta arte direcional própria no pacote.

Nenhuma mudança de lógica: teste compara integralmente o controlador antes/depois removendo apenas o registro de perfis; perfis anteriores permanecem idênticos. Percurso, colisões, relógios, direção, seleção e cenas sem alterações.

25 suítes tests/*.test.cjs passaram. Novas evoluções: 864 cenários Normal/Shiny em 30/60/120 FPS e três velocidades, direções (incluindo oito frames próprios de Croconaw, Torterra, Greninja, Dartrix), paradas/retomadas, paredes, cenas/teleporte. Os 432 cenários dos iniciais e testes Quaxly/Paldea continuam passando. Referência legada de Ivysaur removida do teste Paldea porque agora é alvo intencional; Pikachu, Psyduck e Eevee seguem comparação legada.

Teste rápido: /tests/companions-integrated-v52.html; usa jogo real com perfil descartável sem login. Cache-buster V52 nos indexes. Próximo passo: verificar preview e integrar por PR preservando a alteração exclusiva da main.

## Integração executada

Usuário autorizou explicitamente passar tudo para main. Em vez de reaplicar a restauração antiga de outubro sobre a campanha aprovada, foi adotada a árvore integral validada da branch de testes, com commit de integração de dois pais, preservando ambos os históricos e sem force push. Commit de integração: 8b9d89e4df47d164778cac783ceb8e1ce6503341. Pai main anterior: 53507faf696d56b78ff336f422ea835c9fa34864. Pai de testes com evoluções: e34beb711d53e9fe9a0eef33eca77649ea258062.

Preview V52: https://psyworld-kxwv94rqy-world-of-monsters.vercel.app/tests/companions-integrated-v52.html . Navegador confirmou Torterra Normal acompanhando treinador em Pallet, seleção de Greninja Shiny e caminhada. Demais evoluções cobertas pelo teste automatizado; não inspecionadas todas individualmente. Main passa a ser a base de continuidade, contendo também os sistemas acumulados na preview (campanha, Halloween, profissões, comércio, captura e acompanhantes), não apenas animações. Nenhuma migração de banco executada nesta entrega.
