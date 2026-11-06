# Retomada e validação V58 — 06/11/2026

## Estado preservado

Repositório dioh-cpu/psyworld, branch teste/iniciais-oficios-v38.
Código validado: ebd1668163f1d6d1b5dcee1cf16fce1f729ca368.
Preview READY correspondente: https://psyworld-phvqpvs01-world-of-monsters.vercel.app/
Esta retomada verificou as alterações existentes; não alterou código do jogo, economia, artes, banco ou produção.

## Validação executada novamente

- `node tests/pokedex-walk-v57.test.cjs`: PASS. 949 perfis adicionais, 17.082 cenários Normal/Shiny em três FPS e velocidades, direções, repouso/retomada, paredes e mudanças de cena. Registro anterior e controlador aprovado preservados; manifesto de 1.025 espécies.
- `node tests/quaxly-walk.test.cjs`: PASS. Normal/Shiny, quatro direções, curvas, paradas, teleporte, pausa e bloqueios.
- `node tests/polish-v58.test.cjs`: PASS. Profissões bloqueadas no Lv1 e liberadas no Lv2, custo de troca, nove sprites locais de loot, 36 combinações de câmera/limites/toques e remoção do detalhe Cards aposentado.
- Os nove PNGs de loot desse teste foram lidos e verificados como imagens válidas.
- `node tests/automation-settings-v47.test.cjs`: PASS. Configuração, cancelamento de caminhos, desligamento dos dois controladores e uso exato dos suprimentos escolhidos.
- `node tests/automation-faint-v32.test.cjs`: PASS. Troca obrigatória de companheiro e encerramento após equipe derrotada, sem reviver.
- `node tests/auto-hunt-navigation-v30.test.cjs`: PASS. Quatro destinos de grama, 60/24 FPS e frames de 120 ms.
- `node tests/professions-expanded-v38.test.cjs`: PASS. Oito profissões, 96 receitas e regras de especialidades.
- `node tests/professions-hp-v38.test.cjs`: PASS. Bônus contextuais, atualização de máximo, expiração e ausência de cura/revivificação indevida.

## Navegador em nuvem

Testado em perfil local descartável, sem conta online, com jogo real em /tests/pokedex-integrated-v57.html e iframe retrato 390 × 844 em /tests/polish-mobile-v58.html.

- Cinemática de saída de Pallet: arte completa visível em retrato, texto e botão Continuar disponíveis; Pular cena funciona.
- Viridian: arte preenche o estágio em retrato; deslocamento de x=16 para x=18 e retorno a x=16 confirmado. Quaxly Shiny selecionável.
- Profissões no treinador Lv2: escolha de Engenheiro/Mecânico, exibição de passivo +3% ataque e especialização +3% materiais; bancada de Balls elementais abre.
- Troca para Herborista/Cultivador: botão de Balls elementais desaparece. Bônus de vida combinado aparece no mapa.
- Auto Hunt na Rota 1: poção principal escolhida (Poção 50), confirmação explícita, movimento até a grama e mensagem de vitória Pidgey (+98 Gold, +4 XP) observados. Desligado pelo mesmo botão; posição estabilizada em 360.5,327.0 em duas observações posteriores.
- Loja Halloween: texto de uso, itens, custos, fantasias e títulos presentes; nenhuma credencial/instrução técnica interna visível na leitura da loja.
- O painel de QA pode ser recolhido; pertence somente à fixture de testes.

## Servidor — leitura somente

Inspeção de metadados da função public.psy_v48_state_action confirmou presença da regra “trainer level 2 required” e ausência da regra antiga de nível 10. Nenhuma alteração de banco foi feita nesta retomada.

## Limites e próxima retomada

- Revisão visual individual das 1.025 espécies permanece pendente. Testes automáticos não equivalem a aprovação artística espécie por espécie.
- Fluxo autenticado completo de profissão/craft não foi repetido; foi confirmada a regra existente no servidor por leitura.
- Retrato foi verificado em iframe 390 × 844; não é teste em aparelho Android físico.
- Nenhuma promoção para main ou produção.
- Continuar a partir deste checkpoint e do código ebd1668; não reconstruir nem substituir o controlador completo ou o Quaxly aprovado.
