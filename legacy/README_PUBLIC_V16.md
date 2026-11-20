# PSYWORLD — README DA BUILD V16

## Status da build
Build pública do itch.io preparada a partir da versão V16.

Versão pública exibida aos jogadores: **v0.1.0**  
Identificador interno desta build: **V16**

## O que foi alterado nesta versão

### Survivor
- Otimização estrutural das colisões de projéteis usando divisão espacial.
- Redução de verificações desnecessárias entre projéteis e todos os inimigos.
- Otimizações em ataques de área, campos persistentes e ajudantes.
- Detecção de hardware fraco agora também funciona em PCs/notebooks sem tela touch.
- Renderização pode reduzir a frequência visual dinamicamente quando o frame time sobe, sem reduzir a lógica da run.
- Removida uma ordenação pesada de projéteis inimigos que ocorria continuamente com Wobbuffet.

### Wobbuffet
- Espelhos ativos por 1 segundo.
- Recarga de 2 segundos após o término da janela ativa.
- Projéteis refletidos retornam pela trajetória inversa real.
- O projétil refletido não usa homing.
- O projétil refletido acerta o primeiro inimigo no caminho.
- O projétil refletido não perfura alvos após o primeiro impacto.

### Medidor de combate
- Novo painel de DPS e Cura em tempo real no Survivor.
- Mostra dano por fonte.
- Mostra cura por fonte.
- Janela móvel aproximada de 5 segundos.
- Atualização visual a cada 0,5 segundo para reduzir custo de interface.

## O que ainda precisa ser testado/melhorado

- Confirmar o ganho real de FPS em celulares e PCs de diferentes níveis.
- Testar runs longas com muitos efeitos simultâneos.
- Testar Wobbuffet contra diferentes tipos de projéteis inimigos.
- Confirmar visualmente que a reflexão sempre retorna pela trajetória esperada.
- Conferir o medidor de DPS com todas as combinações de ajudantes.
- Conferir o medidor de Cura com Blissey, regeneração e pickups.
- Verificar se algum efeito visual ainda causa picos de frame em hardware muito fraco.
- Caso ainda haja lag, o próximo passo recomendado é criar budgets adaptativos mais agressivos apenas para VFX, preservando lógica, dano, quantidade de inimigos e frequência de ataques.

## Regras de publicação

Esta build pública não deve expor detalhes internos de implementação no Devlog.
O arquivo PATCH_NOTES_PUBLIC_V16.md contém somente alterações adequadas para publicação aos jogadores.

## Validação da build

- index.html na raiz.
- Limite de arquivos do itch.io respeitado.
- JavaScript validado com node --check.
- Referências locais diretas verificadas.
- ZIP testado quanto à integridade.

