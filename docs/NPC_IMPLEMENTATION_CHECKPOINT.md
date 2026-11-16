# Checkpoint — NPCs e relacionamentos de Pallet

Objetivo: integrar NPCs com retratos e animações, histórias e serviços, amizade, romance entre adultos elegíveis, convivência e progresso isolado no save do personagem; validar no runtime antes de um único Preview.

Base: `b6126f20e79b1ed8b02f32ca49f911cc94d30b34`; branch `feature/pallet-npc-relationships-v1`.

## Estado atual

- Sprites propostos e um atlas de expressões do pescador existem em `assets/kanto/npcs/pallet-new/`, ainda sem integração ou validação no runtime.
- `docs/pallet-relacionamentos-v1.md` contém rascunhos de conteúdo, não funcionalidades.
- Nenhum sistema de relacionamento, rotina, romance ou loja do pescador está implementado.
- Quatro sprites de moradores foram recortados de uma versão editada para remover a névoa. A folha foi inspecionada visualmente; os PNGs individuais ainda precisam de revisão sobre fundos claros e escuros e comparação com os originais antes da integração.
- O carregamento usa `Object.assign(P, ...)` em quatro pontos de `core/legacy-runtime.js`; campos ausentes em saves antigos podem manter dados em memória. É necessário validar troca de personagens antes de persistir relacionamentos.
- Não há testes de integração, commit da funcionalidade nem Preview final.

## Próxima ação

Revisar os PNGs domésticos individualmente sobre fundos claros e escuros, comparar com os originais e revisar os demais recortes. Preparar posicionamento e atlas antes de integrar ao runtime. Investigar como os mapas de cinco áreas carregam NPCs e interiores.

Nenhum recurso Goals foi encontrado na lista de ferramentas disponível.
