# Economia de Oníricos (pilares de design — definidos pelo autor)

Estado: **não estão entre os 50 sistemas do Mundo** (`confusion/web/mundo/*`). Existem só no app antigo (gacha com tickets, Torre Elemental, torres temáticas). Na Região 1 ainda **não implementados**.

| Pilar | Regra | Região 1 hoje |
|---|---|---|
| Gacha | Diamantes compram Oníricos (fonte principal de novos Oníricos) | Não existe |
| Ovos | Drop bem raro (`OVOS.fatorDrop` 0.12, offline 1 a cada 300 abates em `regiao1-idle.js`) | Reduzido; choca instantâneo |
| Fazenda | Local de chocar ovos, com **tempo** de incubação | Não existe (choca na hora) |
| Torres elementais | Torres por elemento | Não existe |
| Torres sazonais | Torres de eventos temporários | Não existe |
| Estratégia: "liberar" | 1ª vitória em fase: um Onírico novo **aparece como inimigo** e **abre +1 vaga** na equipe (2 → 6). Não entrega o Onírico | Implementado em C1 |

Pendente de definição: custo do gacha, tempos de incubação, regras e recompensas das torres, habilidades dos Oníricos fora do combate.
