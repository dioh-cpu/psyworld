# Simulações de equilíbrio: equipamento no motor (Claude → asutaroto291)

Motor: `regiao1-estrategia-regras.js` com o `equip` do #133. Builds de `simularTabelaEquilibrioReliquias()`.
Teste: 4 aliados equipados (Ignavor, Vaelith, Brotavel, Solarin) contra os mesmos 4 sem equipamento. Busca o nível inimigo em que a vitória cai para 50%, com 120 lutas por ponto.
Script: `node` com `criarUnidade({ equip: perfil })` e `executar` em loop (reproduzível com `criarRng(7+s)`).

| build | ganho de poder (tabela) | nível inimigo equivalente (aliados Nv 50) | aliados Nv 100 |
|---|---|---|---|
| sem_equipamento | 0% | 50 (+0%) | 100 (+0%) |
| midgame_rara_9 | 28% | 80 (+60%) | 146 (+46%) |
| epica_12_precisao_imunidade | 37% | 94 (+88%) | 168 (+68%) |
| lendaria_15_cacador_farm | 37% | 96 (+92%) | 166 (+66%) |
| lendaria_15_furia_arma5 | 58% | 104 (+108%) | 178 (+78%) |
| lendaria_15_destruicao_arma5 | 43% | 100 (+100%) | 174 (+74%) |
| lendaria_15_impeto_arma5 | 44% | 98 (+96%) | 170 (+70%) |
| lendaria_15_muralha_arma5 | 45% | 102 (+104%) | 178 (+78%) |
| lendaria_15_vigor_arma5 | 53% | 118 (+136%) | 200 (+100%) |
| lendaria_15_sanguessuga_arma5 | 44% | 100 (+100%) | 172 (+72%) |
| lendaria_15_contra-ataque_arma5 | 43% | 100 (+100%) | 172 (+72%) |
| lendaria_15_eco_arma5 | 43% | 100 (+100%) | 172 (+72%) |
| lendaria_15_vinculo_arma5 | 43% | 100 (+100%) | 172 (+72%) |
| lendaria_15_panico-contido_arma5 | 43% | 102 (+104%) | 174 (+74%) |

Com domador, o time igual sem equipamento vence 100% das lutas, contra 57% sem ele, e leva 52 turnos contra 89. O domador vale muito.

## Leitura
1. **Força real acima da tabela.** O `ganhoPoderFinal` subestima a força: em Nv 100, quase todas as builds lendárias passam do teto de +70%, e a vigor chega a +100%.
2. **Flats calibrados para Nv 100.** `vidaFlat`/`ataqueFlat` usam `REF_STATS_NV100` e, em níveis baixos, pesam demais. Exemplo: Ignavor Nv 50 vai de 171 para 265 de ataque (+55%); em Nv 100, de 332 para 474 (+43%).
3. **Ataque rende mais que o ganho nominal.** O dano é `atk×mult − def×0,55`, então todo ataque extra vira dano líquido, que cresce mais que o ganho nominal. O crítico (18–30% de chance, ×1,87) não entra no `ganhoPoder`.

## Sugestões para `calcularBonusEquipamentoOnirico`
- Escalar os flats pelo nível da unidade: o motor já pode passar `statsBase` com os stats reais da unidade (`perfilCombateEquipamento(save, uid, statsDaUnidade)`).
- Contar o valor esperado do crítico no `ganhoPoder`: `critico × (0,5 + danoCritico)` somado ao ataque.
- Pesar o ataque cerca de 1,6× ao aplicar o teto, porque o dano é líquido de defesa.
- Meta sugerida: lendária +15 com Arma +5 ≈ +50% de nível equivalente em Nv 100; rara +9 ≈ +20%.
- O domador ajuda demais: reduzir o multiplicador das habilidades (Comando Sombrio 1,2 → 0,8) ou o ganho da barra (+35 → +25 por turno aliado).
