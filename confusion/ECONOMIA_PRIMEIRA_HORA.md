# Economia da Primeira Hora (0–60 min) — Livre de Energia (`asutaroto291`)

Documento oficial da experiência do **jogador novo** em `Confusion Waves` (https://cwdp-lake.vercel.app/jogar), baseado nos módulos puros de regras (`regiao1-campanha-mini-regras.js`, `regiao1-torres-regras.js`, `regiao1-calaboucos-regras.js`, `regiao1-reliquias-regras.js`, `regiao1-missoes-regras.js`, `regiao1-regras-sonho.js`, `regiao1-idle.js`, `regiao1-progressao.js` e `regiao1-conta.js`).

> **Regra de ouro:** **Nenhum modo do jogo cobra ou bloqueia por energia.** Campanha Mini, Torres Elementais, Torres Únicas e Calabouços são 100% livres (`custo = 0`). Quando algum modo controla economia diária (como 1ª vitória da fase ou bônus diário), aplica apenas **recompensa decrescente**, nunca bloqueio de entrada.

---

## 1. Linha do Tempo Minuto a Minuto (Jogador Convidado — sem energia)

| Bloco | O que o jogador faz | Objetivo ativo | Ouro (+/-) | Diamantes (+/-) | XP Onírico | Essências (M / Méd) | Tickets (+/-) | Relíquias |
|---|---|---|---:|---:|---:|---|---:|---:|
| **0–10 min** | Site → Convidado → Inicial (`Nv.5 T4`) → Refúgio → 1ª batalha → Campanha Mini `1-1` e `1-2` | Concluir 1ª batalha e entrar na Campanha Mini | `+550 / 0` | `+65 / 0` | `+420` | `0 / 0` | `0` (+10 grátis/dia) | `0` |
| **10–20 min** | Campanha Mini `1-3` a `1-5` (Elite), Torre Elemental `1–3`, `par_1_1` e `marco_cm_1_5` | Derrotar Guardião `1-5` e coletar 1ª relíquia | `+1.350 / -450` | `+150 / 0` | `+1.080` | `+12 / 0` | `0` | `2` (`comum` + `rara`) |
| **20–30 min** | Calabouço Nv.1, reforço de relíquia (`+3`), Torre Elemental `4–5`, Baús 3★ `1-1..1-5` | Equipar e reforçar a 1ª relíquia e subir Torre até o andar 5 | `+900 / -825` | `+140 / 0` | `+950` | `+11 / 0` | `0` | `2` |
| **30–45 min** | Campanha Mini `1-6` a `1-9`, Diárias dos modos, `par_1_2` e Login Dia 1 | Avançar até o chefe `1-10` e fechar diárias | `+1.850 / -600` | `+210 / 0` | `+1.450` | `+5 / 0` | `+1` | `1` |
| **45–60 min** | Chefe `1-10`, Marcos (`Cap.1`, `30★`), Baús `10★/20★/30★` e **Invocação `×10`** | Fechar Cap.1, resgatar tickets e rodar Banner `×10` | `+1.400 / -900` | `+300 / 0` | `+1.650` | `+10 / +3` | `+11 / -10` | `1` |
| **Total 60 min** | **Capítulo 1 fechado + 2× multi `×10` + equipe equipada** | Fluxo contínuo, zero bloqueio | **`+6.050 / -2.775` (saldo `3.275`)** | **`+865 / 0` (saldo `865`)** | **`+5.550`** (~Nv.28–30 com Poções) | **`38 Menor / 3 Média`** | **`+12 / -10` (+10 grátis)** | **`6`** |

### Banner Permanente e Convidado × Conta Criada
- **Banner Permanente:** taxas **`68% T2 / 22% T3 / 7% T4 / 3% T5`** (T5 = Ignaraz, Vaelirion, Florivel), garantias **`10→T3 / 30→T4 / 50→T5`** e **`10 invocações grátis por dia acumulando até 100`**.
- **Convidado:** recebe `10 invocações grátis` no Dia 1 + `10 tickets permanentes` ao fechar o Cap. 1 (`1-10`) + `1 ticket` de marcos = **2× multi `×10` na 1ª hora**.
- **Conta criada (ou convidado → conta):** recebe **`+20.000 💎`** + **`10 dias de VIP`** em pagamento único imediato (com toast), preservando 100% do progresso local.

---

## 2. Equipamento (4 Relíquias + 1 Arma Única) e Fontes ("Onde conseguir")
- Cada Onírico equipa **4 Relíquias do próprio elemento** (`Coroa`, `Amuleto`, `Anel`, `Talismã`) + **1 Arma Única** (5º espaço, exclusiva da linhagem). Conjuntos ativam com **2 ou 4 peças**.
- Fontes estruturadas exportadas para a UI (`dioh293`):
  - `GUIA_SISTEMA_RELIQUIAS`, `ONDE_CONSEGUIR_RELIQUIAS`, `fontesDeReliquia()` em `regiao1-reliquias-regras.js`;
  - `ONDE_CONSEGUIR_ESSENCIAS` (9 pares) e `ONDE_CONSEGUIR_FRAGMENTOS` (19 elementos) em `regiao1-regras-sonho.js`.

---

## 3. Curva de Nível 5 → 40 para o T5 dos Iniciais (`#148`)
- `xpTotal(5) = 220`, `xpTotal(40) = 8.970` → **Delta = `8.750 XP`**.
- **Casual (~15–20 min/dia de jogo ativo):** `~2.250 XP/dia` → **`~3,89 dias`** (dentro da meta de **3 a 5 dias**).
- **Ativo (~45–60 min/dia):** `~3.800 XP/dia` → **`~2,30 dias`** (`~0,6 a 1,0 dia` com 8h de Idle offline).

---

## 4. Tabela de Dificuldade Cap. 1 (`1-1` a `1-10`) por Inicial — 300 lutas/fase cada

Fonte única da verdade: `node tools/simular_iniciais_cap1.mjs` (motor `regiao1-estrategia-regras.js`), com as **premissas realistas do jogador novo**:
- **Formação de 4 Oníricos desde `1-1`:** o jogador novo usa as **10 invocações grátis do Dia 1** no Banner Permanente e monta time de 4 (`Inicial T4` no nível `nv` + `Cervomusgo T3` garantido no nível `max(3, nv-1)` + `Tatuveludo T2` e `Fanalino T2` no nível `max(2, nv-2)`).
- **Curva real de XP (Campanha + Auto/AFK nas áreas de Idle):** `nv = nivelDe(xpTotal(5) + xpAcumulado)` seguindo os blocos da 1ª hora (`Nv.5` em `1-1` → `Nv.27` em `1-10`).
- **Domador Azazel no nível real:** `Nv.1` (`1-1..1-3`), `Nv.2` (`1-4..1-5`), `Nv.3` (`1-6..1-7`), `Nv.4` (`1-8..1-9`), `Nv.5` (`1-10`).
- **Metas:** **`≥ 95%`** em `1-1` a `1-3` para **cada um dos 5 iniciais**, **`~85%`** em `1-4` a `1-7`, **`~70%`** em `1-8` a `1-10`.

| Fase | Time realista | Azazel | Ondas | Níveis | Brasinha | Gotalume | Sementil | Solinho | Penumbrio | Média | Meta |
|---|---|---:|---|---|---:|---:|---:|---:|---:|---:|---|
| `1-1` | `4× (Nv.5)` | `Nv.1` | `2+2` | `4/5` | **100,0%** | **100,0%** | **100,0%** | **99,7%** | **100,0%** | **99,9%** | `≥ 95%` |
| `1-2` | `4× (Nv.7)` | `Nv.1` | `2+2` | `6/7` | **100,0%** | **99,3%** | **99,7%** | **100,0%** | **100,0%** | **99,8%** | `≥ 95%` |
| `1-3` | `4× (Nv.8)` | `Nv.1` | `2+3` | `6/7` | **100,0%** | **100,0%** | **100,0%** | **100,0%** | **100,0%** | **100,0%** | `≥ 95%` |
| `1-4` | `4× (Nv.10)` | `Nv.2` | `2+2+3` | `8/9/10` | 84,3% | 88,3% | 99,7% | 94,0% | 84,7% | **90,2%** | `~85%` |
| `1-5` | `4× (Nv.13)` | `Nv.2` | `2+2+3` | `11/12/13` | 92,0% | 71,0% | 95,3% | 89,7% | 83,3% | **86,3%** | `~85%` |
| `1-6` | `4× (Nv.17)` | `Nv.3` | `2+2+3` | `15/16/17` | 82,3% | 77,3% | 98,0% | 79,3% | 80,7% | **83,5%** | `~85%` |
| `1-7` | `4× (Nv.19)` | `Nv.3` | `2+2+3` | `16/17/19` | 92,0% | 88,7% | 95,0% | 93,3% | 86,3% | **91,1%** | `~85%` |
| `1-8` | `4× (Nv.22)` | `Nv.4` | `2+3+3` | `19/21/22` | 63,3% | 48,7% | 99,3% | 84,7% | 87,0% | **76,6%** | `~70%` |
| `1-9` | `4× (Nv.24)` | `Nv.4` | `2+3+3` | `21/23/24` | 50,7% | 56,7% | 82,3% | 72,7% | 57,0% | **63,9%** | `~70%` |
| `1-10` | `4× (Nv.27)` | `Nv.5` | `2+3+3` | `23/24/24` | 88,7% | 80,0% | 89,3% | 66,3% | 62,0% | **77,3%** | `~70%` |

- **Capítulos 2 a 12 + auditoria do Idle/AFK:** veja a tabela completa de progressão em `confusion/ECONOMIA_PROGRESSAO.md` (`node tools/simular_iniciais_cap1.mjs --todos`).

- **Limite de rodadas no motor (`LIMITE_RODADAS_BATALHA = 60`):** elimina lutas infinitas em Calabouços.
- **Produção:** https://cwdp-lake.vercel.app/jogar
