# Tutorial de cura → acompanhante V59 — 06/11/2026

Código: dbb250d67c2e68c3276bc595658ca12b6c09990d.
Branch: teste/iniciais-oficios-v38. Produção e banco não alterados.

## Relato e reprodução

Usuário informou que clicar em Curar não avançava para selecionar acompanhante; print mostrava Cards ainda no Conteúdo do jogo.
Foi adicionada à fixture tests/essential-tutorial-v56.html a ação Preparar equipe derrotada (perfil local descartável).
Na baseline 396f612, curar pelo botão CURAR do Conteúdo do jogo deixou a vida 243/243, mas o guia permaneceu em Cuide da equipe. Reproduzido no navegador.
O botão CURAR EQUIPE do próprio guia passava no cenário síncrono; o problema comprovado era a ausência de observação da cura externa enquanto o guia estava aberto.

## Correção

- O guia observa a recuperação e avança ao passo 4 mesmo quando a cura vem do menu.
- O botão do guia aguarda o retorno da cura, inclusive assíncrona; falha mantém recuperação pendente.
- Cura intencional sincroniza hp/currentHp e limpa fainted/_psyFaintedV31.
- Tutorial só termina após confirmação real de um acompanhante vivo.
- Removidos acessos Cards do index e do catálogo de módulos; decoração também remove entradas Cards legadas das fixtures.
- Cache das dependências alteradas atualizado na entrada normal.
- Nenhum controlador de animação, arte, fórmula de status ou regra de combate foi substituído.

## Verificação local

PASS tests/essential-heal-v59.test.cjs: cura externa e pelo guia, flags de derrota, espera assíncrona, falha com nova tentativa, confirmação real obrigatória.
PASS tests/starter-hp-init-v46.test.cjs: recém-criado não vira derrotado por HP não inicializado; derrota real continua com zero.
PASS tests/starter-onboarding-v44.test.cjs: kit/recuperação uma vez, inicial nível 5, limites da Rota 1.
PASS tests/professions-hp-v38.test.cjs e tests/automation-faint-v32.test.cjs.
Sintaxe dos três scripts principais verificada.

## Navegador

Deployment dpl_7Co3EayUKwyVHFrEFkEAYuHMBt6d READY, código dbb250d.
Fixture tests/essential-mobile-v59.html em iframe retrato 390 × 844:
1. Equipe derrotada → botão CURAR no menu → HP 243/243 → Essenciais 4/4.
2. Abrir acompanhante → selecionar Quaxly → Confirmar acompanhante → Quaxly agora acompanha você.
3. Reinício da fixture → CURAR EQUIPE do guia → Essenciais 4/4.
4. Cards ausente do conteúdo; nenhuma entrada openCardMode/btn-card-float na página normal.
Link que deve ser entregue ao usuário: https://psyworld-git-teste-iniciais-oficios-v38-world-of-monsters.vercel.app/
Não entregar fixtures internas de QA como endereço para jogar.

Limite: teste mobile feito no navegador em iframe estreito, sem aparelho Android físico nem sessão online do usuário. Não foi identificada nesta retomada uma nova causa de inicial nascer sem vida; não afirmar que a etapa de cura substitui a inicialização correta. Revisão artística individual das 1.025 espécies continua pendente, conforme checkpoint V58.
