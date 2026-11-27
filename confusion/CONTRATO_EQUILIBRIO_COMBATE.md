# Contrato de Equilíbrio e Combate (`asutaroto291` → Claude)

Valores finais travados para aplicação no motor (`regiao1-estrategia-regras.js`), mantendo o teto estrito de **+70% de poder** sobre a progressão de tier/estrelas (`statsBase` Nv.100 ataque: `hp=1358, atk=333, def=144, vel=100`).

## 1. Leitura Única do Equipamento do Onírico

Use `perfilCombateEquipamento(save, unidadeOuUid, statsBase)` de `regiao1-reliquias-regras.js`:

- **Atributos numéricos já limitados pelo teto `+70%`:**
  - `vidaFlat`, `ataqueFlat`, `vidaPct`, `ataquePct`, `defesaPct`
  - `velocidadeFlat`, `velocidadePct`
  - `critico`, `danoCritico`, `rouboVida`
  - `precisaoEfeito`, `resistenciaEfeito`
  - `bonusCuraEscudo` (soma atributo de cura + conjunto Vínculo 4p `+20%`)
- **Mecânicas especiais de conjunto e farm:**
  - `contraAtaque`: `0` ou `0.20` (`Contra-ataque` 4p)
  - `ecoRecarga`: `0` ou `0.20` (`Eco` 4p: chance de `-1` recarga em outra habilidade ao usar uma)
  - `imunidadeTurnos`: `0` ou `1` (`Imunidade` 2p: imune a debuffs no 1º turno)
  - `panicoContido`: `null` ou `{ limiarHp: 0.30, ataque_pct: 0.20, turnos: 2, usosPorBatalha: 1 }`
  - `farmBonus`: `{ xpMult, ouroMult, dropRaroExtra }` (`Caçador` 2p/4p)
- **Arma Única equipada (5º espaço):**
  - `armaUnica`: `null` ou `{ linhagem, nome, elemento, classe, attr, reforco, valorAtributo, efeitoHabilidade }`
  - `+0 → +5`: `+10%` até `+15%` no atributo assinatura (já somado em `perfil.atributos` dentro do teto de `+70%`) + `efeitoHabilidade` para o motor aplicar na técnica ou suprema.

## 2. Conjuntos (`CONJUNTOS_RELIQUIAS`, 13 conjuntos)

| Conjunto | 2 peças | 4 peças (substitui 2p) |
|---|---|---|
| `cacador` | `+15%` XP e ouro | `+30%` XP e ouro, `+10%` drop raro |
| `sanguessuga` | `10%` roubo de vida | `15%` roubo de vida |
| `furia` | `+15%` ataque | `+35%` ataque |
| `muralha` | `+15%` defesa | `+35%` defesa |
| `vigor` | `+15%` vida | `+35%` vida |
| `impeto` | — | `+25%` velocidade |
| `precisao` | `+12%` crítico | — |
| `destruicao` | — | `+40%` dano crítico |
| `contra-ataque` | — | `20%` chance de contra-atacar ao sofrer ataque |
| `eco` | — | `20%` chance de `-1` recarga em outra habilidade |
| `imunidade` | imune a efeitos negativos no 1º turno | — |
| `vinculo` | — | curas e escudos `+20%` |
| `panico-contido` | — | abaixo de `30%` de vida, `+20%` ataque por 2 turnos (`1×/batalha`) |

## 3. Tetos das Relíquias Lendárias `+15`

- `%` principal (`ataque_pct`, `vida_pct`, `defesa_pct`, `precisao_efeito`, `resistencia`): **`30%` (`0.30`)**
- `critico` principal: **`20%` (`0.20`)**
- `velocidade` principal: **`+25`**
- `roubo_vida` principal: **`8%` (`0.08`)**
- Secundários médios: **`4%–8%`** cada.
- **Teto final garantido:** `simularTabelaEquilibrioReliquias()` comprova que mesmo 4 relíquias lendárias `+15` de `furia` + Arma Única `+5` permanecem em `<= +70%` (`ganhoPoderFinal <= 0.70`).

## 4. Domadores Auxiliares em Combate (`regiao1-domadores-regras.js`)

- `criarEstadoDomadorBatalha(save, domadorId?)`: cria o 5º aliado (`ocupaVaga: false`, `alvejavel: false`).
- `bonusPassivoDomadorAtivo(save)`: devolve `{ vidaPct, ataquePct, defesaPct, critico }` aplicados à equipe no início da luta.
  - **Azazel:** `+6%..+15%` vida, `+4%..+10%` ataque; habilidades `Comando Sombrio` (cd 1), `Vínculo Protetor` (cd 3), `Decreto do Domador` (cd 5).
  - **Manipulador das Oito Lâminas:** `+8%..+15%` ataque, `+5%..+10%` crítico; habilidades `Dança das Oito Lâminas` (cd 1), `Sincronia Telecinética` (cd 3), `Tempestade das Oito Lâminas` (cd 5) já cadastradas em `KITS['Manipulador das Oito Lâminas']`.
- `carregarBarraDomador(estado, 'turno_aliado' | 'dano_recebido')`: `+35` por turno aliado (`~3` turnos base), `+10` ao time sofrer dano; `escolherAcaoDomador(estado)` dispara S3 > S2 > S1 quando `barraEnergia >= 100`.
