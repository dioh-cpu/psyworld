# Wildlands 2.5D — Relatório do catálogo V1

## Arquivo criado

- `content-catalog-v1.js`

O módulo é independente e não altera `app-v155.js`.

## Conteúdo entregue

- Região `vale-verde`: 20 criaturas autorais e 20 quests autorais.
- Região `costa-aurora`: 20 criaturas autorais e 20 quests autorais.
- Três itens de captura:
  - Cápsula Brotante: disponível desde o início.
  - Cápsula Maré: desbloqueia na quest 8.
  - Cápsula Cometa: desbloqueia na quest 15.
- Cada criatura possui ID estável, nome, região, habitat, elemento, nível, dificuldade, função e caminho de asset local autoral.
- Cada quest possui ID, título, região, tipo, objetivo, quantidade, recompensa e requisito de desbloqueio.
- Funções utilitárias para filtrar conteúdo por região e consultar a progressão dos itens de captura.

## Integração futura

O arquivo pode ser carregado antes do runtime como script clássico:

```html
<script src="content-catalog-v1.js"></script>
```

Depois disso, o catálogo fica disponível em `window.WildlandsContentCatalog`. O arquivo também pode ser avaliado em um harness de testes Node sem exigir alteração no app atual.

## Validação

- Conteúdo separado do runtime existente.
- Nenhum asset externo ou conteúdo protegido foi copiado.
- Os caminhos de assets são referências locais planejadas; os SVGs/modelos ainda precisam ser produzidos no pipeline visual.
- A validação automatizada deve confirmar 20 criaturas e 20 quests por região, além do desbloqueio da Cápsula Cometa na quest 15.
