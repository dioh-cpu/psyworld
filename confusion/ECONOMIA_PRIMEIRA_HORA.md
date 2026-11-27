# Economia da Primeira Hora (0–60 min) e Curva até Nível 40 (`asutaroto291`)

Documento de referência da experiência do **jogador novo** em `Confusion Waves` (repo `dioh-cpu/psyworld`), baseado nos valores reais dos módulos de regras (`regiao1-campanha-mini-regras.js`, `regiao1-torres-regras.js`, `regiao1-missoes-regras.js`, `regiao1-reliquias-regras.js`, `regiao1-regras-sonho.js`, `regiao1-idle.js`, `regiao1-progressao.js` e `regiao1-conta.js`).

> Auditado em código via `simularEconomiaPrimeiraHora()` / `auditarPrimeiraHora()` / `estimarDiasNivel40Inicial()` em `regiao1-economia-regras.js`.

---

## 1. Linha do Tempo Minuto a Minuto (Jogador Convidado)

| Bloco | O que o jogador faz | Objetivo ativo | Ouro (+/-) | Diamantes (+/-) | XP Onírico | Energia (+/-) | Essências (M / Méd) | Tickets (+/-) | Relíquias |
|---|---|---|---:|---:|---:|---:|---|---:|---:|
| **0–10 min** | Site → Convidado → Inicial (`Nv.5 T4`) → Refúgio → 1ª batalha → Campanha Mini `1-1` e `1-2` | Concluir 1ª batalha e entrar na Campanha Mini | `+550 / 0` | `+65 / 0` | `+420` | `120 → 108` (`+0 / -12`) | `0 / 0` | `0` | `0` |
| **10–20 min** | Campanha Mini `1-3` a `1-5` (Elite), Torre Elemental `1–3` (1ª vit. `0` energ.), `par_1_1` e `marco_cm_1_5` | Derrotar Guardião `1-5` e coletar 1ª relíquia | `+1.350 / -450` | `+150 / 0` | `+1.080` | `108 → 89` (`+1 / -20`) | `+12 / 0` | `0` | `2` (`comum` + `rara`) |
| **20–30 min** | Calabouço Nv.1, reforço de relíquia (`+3`), Torre Elemental `4–5`, Baús 3★ `1-1..1-5` | Equipar e reforçar a 1ª relíquia e subir Torre até o andar 5 | `+900 / -825` | `+140 / 0` | `+950` | `89 → 73` (`+2 / -18`) | `+11 / 0` | `0` | `2` |
| **30–45 min** | Campanha Mini `1-6` a `1-9`, Diárias dos modos, `par_1_2` e Login Dia 1 | Avançar até o chefe `1-10` e fechar diárias | `+1.850 / -600` | `+210 / 0` | `+1.450` | `73 → 51` (`+2 / -24`) | `+5 / 0` | `+1` (`marco_col_10`) | `1` |
| **45–60 min** | Chefe `1-10`, Marcos (`Cap.1`, `30★`), Baús `10★/20★/30★` e **1ª Invocação `×10`** | Fechar Cap.1, resgatar tickets e rodar Banner `×10` | `+1.400 / -900` | `+300 / 0` | `+1.650` | `51 → 44` (`+3 / -10`) | `+10 / +3` | `+11 / -10` | `1` |
| **Total 60 min** | **Capítulo 1 fechado + 1ª invocação `×10` + equipe equipada** | Nunca fica sem próximo objetivo | **`+6.050 / -2.775` (saldo `3.275`)** | **`+865 / 0` (saldo `865`)** | **`+5.550`** (~Nv.28–30 com Poções) | **`44 / 120` restantes** | **`38 Menor / 3 Média`** | **`+12 / -10` (saldo `2`)** | **`6`** |

### Diferença Convidado × Conta Criada e Regras Atuais do Banner (`#150`, `#153`)
- **Banner Permanente (Adventurer):** taxas **`68% T2 / 22% T3 / 7% T4 / 3% T5`** (T5 = Ignaraz, Vaelirion, Florivel), garantias **`10→T3 / 30→T4 / 50→T5`** e **`10 invocações grátis por dia acumulando até 100`**.
- **Convidado (sem bônus):** já começa o Dia 1 com **`10 invocações grátis`** (garante T3 na 1ª ×10) + ganha **`10 tickets permanentes`** ao concluir o Capítulo 1 (`1-10`, agora em 2 ondas nas fases 1–3 e 3 ondas nas fases 4–10, com XP rebalanceado `+15%/+35%`) + `1 ticket` de marcos (`30★` ou `10 espécies`), totalizando **2× multi `×10` na 1ª hora**, sem faltar energia (`44/120` sobrando).
- **Conta criada (ou convidado que cria conta):** recebe **`+20.000 💎`** + **`10 dias de VIP`** em pagamento único imediato (com toast), somando **até 13 invocações `×10` extras** (garantindo T4 em 30 e T5 em 50 já na estreia).
- **Energia (`ENERGIA_TEXTO_EXPLICATIVO`):** regenera **`1` a cada `6` min (`240/dia`)**, máximo **`120`**, poção **`+60`**. Custos: Campanha Mini `6/8/10`, Torres Elementais **`0` na 1ª vitória** (`8` treino 3×/dia), Torres Únicas `10`, Calabouços `8/12/16`. Na 1ª hora o jogador gasta `84` de `128` disponíveis — ritmo folgado sem travar.

---

## 2. Checagem das Metas da 1ª Hora

| Meta solicitada | Situação atual nos dados | Observação |
|---|---|---|
| **1ª relíquia por volta dos 30 min** | **Atendida (~20–30 min)** | Elite `1-5` garante relíquia comum, `par_1_1` garante relíquia rara e o Calabouço Nv.1 abre e dropa antes dos 30 min. |
| **1ª invocação `×10` na 1ª hora** | **Atendida (~45–55 min convidado / imediata com conta)** | Cap.1 (`1-10`) entrega `10 tickets permanentes` + marcos somam `+1 ticket` e `~865 💎`. Com conta criada há `20.000 💎`. |
| **Nunca ficar sem objetivo** | **Atendida** | Há trilha contínua de `Campanha Mini → Guardião 1-5 → Paralelas/Calabouço/Torre → Chefe 1-10 → Banner ×10 → Capítulo 2`. |
| **1ª evolução por volta dos 20 min** | **Gargalo identificado (pendente de decisão)** | Evolução `1→2` (`FRAGMENTOS_SONHO_CFG`) exige **`10 Fragmentos de Sonho` + `20 Essência Menor` + `5 Essência Média`** do elemento do inicial. Nos primeiros 20–60 min, o jogador junta **`38 Essência Menor`**, mas apenas **`0–3 Essência Média`** (que hoje só começa no Chefe `1-10` e Torre andar `16`) e **`~1–4 Fragmentos de Sonho`** (1% por abate). Em `ECONOMIA_DIARIA.md`, a 1ª evolução hoje cai em **~2 dias**. *Sugestão caso queiram fechar nos 20 min:* dar um pacote único de introdução à evolução ao concluir `1-5` / marco `marco_cm_1_5` (`10 Fragmentos de Sonho` do inicial + `5 Essências Médias` do par do inicial). |

---

## 3. Curva de Nível 5 → 40 para o T5 dos Iniciais (`#148`)

Com o `#148`, os iniciais começam como **T4 no Nv.5** e exigem **Nv.40** para evoluir à forma final **T5** (`FRAGMENTOS_SONHO_CFG.nivelIniciaisPorFase = { 3: 40 }`).

- **Fórmula de XP dos Oníricos (`regiao1-progressao.js`):**
  - `xpPara(n) = 30 + 10·n`
  - `xpTotal(5) = 220` XP
  - `xpTotal(40) = 8.970` XP
  - **XP líquido necessário (Nv.5 → Nv.40): `8.750 XP` por inicial.**
- **Tempo esperado até o Nv.40 (`estimarDiasNivel40Inicial()`):**
  - **Jogador Casual (~15–20 min/dia de jogo ativo, sem depender de AFK longo):** `~2.250 XP/dia` (Idle ativo + 4 fases da Campanha Mini + poções P distribuídas no time) → **`~3,89 dias`** (**dentro da meta de 3 a 5 dias**).
  - **Jogador Ativo (~45–60 min/dia):** `~3.800 XP/dia` em jogo ativo → **`~2,30 dias`**.
  - **Com 8h/dia de Idle Offline (Nv.6 = 1,6 abate/min × 28 XP/abate):** +6.500 a +10.500 XP/dia na formação → **`~0,6 a 1,0 dia`**.
- **Conclusão sobre ajuste:** **Não foi necessário alterar `xpTotal(n)` nem `XP_IDLE_CFG`**, pois o tempo de jogo normal sem acelerar com AFK fica naturalmente em **~3,9 dias** no perfil casual (dentro da janela de **3 a 5 dias**) e preserva todos os saves existentes.

---

## 4. Calibração de Dificuldade da Campanha Mini Cap. 1 (`1-1` a `1-10`, 300 lutas/fase)

Simulação executada direto no motor (`regiao1-estrategia-regras.js`) com Azazel Domador e times realistas (rodando igualmente os 5 iniciais `Brasinha`, `Gotalume`, `Sementil`, `Solinho`, `Penumbrio`; `300` lutas por fase):

| Fase | Time realista do jogador | Ondas (qtd) | Níveis por onda | Vitória antes | Vitória depois | Meta |
|---|---|---|---:|---:|---:|---|
| `1-1` | Inicial solo Nv.5 (T4) | `1 + 1` | `1 / 1` | 60,3% | **97,3%** | `≥ 95%` |
| `1-2` | Inicial solo Nv.7 (T4) | `1 + 1` | `1 / 2` | 57,0% | **98,0%** | `≥ 95%` |
| `1-3` | Inicial solo Nv.9 (T4) | `1 + 1` | `2 / 3` | 47,3% | **100,0%** | `≥ 95%` |
| `1-4` | Inicial Nv.10 + 1 Onírico Nv.9 | `1 + 2 + 2` | `7 / 8 / 9` | 17,0% | **84,0%** | `~85%` |
| `1-5` | Inicial Nv.12 + 1 Onírico Nv.11 (Elite) | `1 + 2 + 2` | `8 / 9 / 10` | 1,3% | **83,0%** | `~85%` |
| `1-6` | Inicial Nv.14 + 2 Oníricos (Nv.13/12) | `2 + 2 + 2` | `11 / 12 / 13` | 59,3% | **90,3%** | `~85%` |
| `1-7` | Inicial Nv.16 + 2 Oníricos (Nv.15/14) | `2 + 2 + 2` | `14 / 15 / 16` | 21,0% | **85,7%** | `~85%` |
| `1-8` | Inicial Nv.18 + 3 Oníricos (Nv.17..15) | `2 + 2 + 3` | `17 / 18 / 19` | 66,0% | **65,0%** | `~70%` |
| `1-9` | Inicial Nv.20 + 3 Oníricos (Nv.19..17) | `2 + 2 + 3` | `18 / 19 / 20` | 25,3% | **80,0%** | `~70%` |
| `1-10` | Inicial Nv.22 + 3 Oníricos (Chefe) | `2 + 2 + 2` | `19 / 20 / 21` | 0,0% | **63,3%** | `~70%` |

- **Limite de rodadas no motor (`LIMITE_RODADAS_BATALHA = 60`):** evita lutas infinitas em Calabouços (dano mínimo `2` vs cura/escudo/regeneração), encerrando a batalha com `b.fim = 'derrota'` e `b.motivoFim = 'limite_rodadas'`.
- **Produção:** https://cwdp-lake.vercel.app/jogar

