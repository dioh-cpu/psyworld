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

Simulação executada no motor (`regiao1-estrategia-regras.js`) com Azazel Domador e times realistas (meta: **`≥ 95%`** em `1-1` a `1-3` para **cada um dos 5 iniciais**, **`~85%`** em `1-4` a `1-7`, **`~70%`** em `1-8` a `1-10`):

| Fase | Ondas | Níveis | Brasinha | Gotalume | Sementil | Solinho | Penumbrio | Média | Meta |
|---|---|---|---:|---:|---:|---:|---:|---:|---|
| `1-1` | `1+1` | `1/1` | **100,0%** | **100,0%** | **100,0%** | **100,0%** | **100,0%** | **100,0%** | `≥ 95%` |
| `1-2` | `1+1` | `1/1` | **100,0%** | **100,0%** | **100,0%** | **100,0%** | **100,0%** | **100,0%** | `≥ 95%` |
| `1-3` | `1+1` | `2/2` | **100,0%** | **100,0%** | **100,0%** | **100,0%** | **100,0%** | **100,0%** | `≥ 95%` |
| `1-4` | `1+2+2` | `7/8/9` | 48,3% | 88,7% | 99,7% | 86,7% | 98,0% | **84,3%** | `~85%` |
| `1-5` | `1+2+2` | `8/9/10` | 92,7% | 95,7% | 34,7% | 87,7% | 98,7% | **81,9%** | `~85%` |
| `1-6` | `2+2+2` | `11/12/13` | 97,3% | 87,3% | 82,3% | 96,7% | 99,7% | **92,7%** | `~85%` |
| `1-7` | `2+2+2` | `14/15/16` | 83,7% | 80,0% | 97,7% | 82,3% | 97,3% | **88,2%** | `~85%` |
| `1-8` | `2+2+3` | `17/18/19` | 24,7% | 88,3% | 93,0% | 87,7% | 36,7% | **66,1%** | `~70%` |
| `1-9` | `2+2+3` | `18/19/20` | 80,7% | 85,3% | 62,0% | 85,0% | 82,7% | **79,1%** | `~70%` |
| `1-10` | `2+2+2` | `19/19/21` | 94,0% | 81,3% | 51,7% | 48,7% | 70,0% | **69,1%** | `~70%` |

- **Limite de rodadas no motor (`LIMITE_RODADAS_BATALHA = 60`):** elimina lutas infinitas em Calabouços.
- **Produção:** https://cwdp-lake.vercel.app/jogar
