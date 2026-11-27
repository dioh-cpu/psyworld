# Economia e Progressão — Capítulos 1 a 12 (`asutaroto291`)

Documento oficial da curva de dificuldade e progressão da **Campanha Mini (Capítulos 1 a 12)** e do **Idle/AFK** em `Confusion Waves` (https://cwdp-lake.vercel.app/jogar).

---

## 1. Critério Oficial de Balanceamento
- **Fonte única da verdade:** `node tools/simular_iniciais_cap1.mjs` (padrão Cap. 1 com 300 lutas/fase; `--cap N` para qualquer capítulo `1..12`; `--todos` para o painel completo dos 12 capítulos).
- **Formação realista (4 Oníricos + Domador Azazel):**
  - **Cap. 1 (Dia 1):** jogador usa as **10 invocações grátis** logo no começo (`Inicial T4` + `Cervomusgo T3` garantido + `Tatuveludo T2` + `Fanalino T2`, sem relíquias) e sobe nível com Campanha + Auto/AFK Idle (`Nv.5 → Nv.27`, Azazel `Nv.1 → Nv.5`).
  - **Cap. 2 (Dias 2–3):** Inicial evoluído para **Forma 2** (`Ignavor/Vaelith/Brotavel/Solarin/Noctarn`, `T4 2★`), aliados das invocações grátis acumuladas (`T3/T2`), relíquias `+12%` e Azazel `Nv.6 → Nv.10`.
  - **Cap. 3 a 12 (Dias 4+ até Endgame):** Inicial na **Forma 3 T5** (`Nv.40+`), aliados escalando com as garantias acumuladas do banner (`10→T3 / 30→T4 / 50→T5`), estrelas (`2★ → 5★`), relíquias + Arma Única (`+20% → +60%`, dentro do teto de `+70%`) e Azazel (`Nv.11 → Nv.90`).
- **Metas oficiais por capítulo:** Fases `1–3` **`~95%`**, Fases `4–7` **`~85%`**, Fases `8–10` **`~70%`** (chefes podem pedir nível, evolução ou relíquias; se travar, o jogo orienta, não reduz a dificuldade).

---

## 2. Tabela Consolidada — Capítulos 1 a 12 (`node tools/simular_iniciais_cap1.mjs --todos --lutas 80`)

Calibração aplicada em `regiao1-campanha-mini-regras.js` (`CALIBRACAO_ONDAS_CAP1` e `CALIBRACAO_CAPITULOS_2_12`), repassada via `bonus` tanto para a arena real (`regiao1-batalha-tela.js`) quanto para o simulador único:

| Cap. | Faixa Nv. | Ritmo esperado | Relíquias | Fases 1–3 (`~95%`) | Fases 4–7 (`~85%`) | Fases 8–9 (`~70%`) | Chefe 10 (`~70%`) |
|---:|---|---|---:|---:|---:|---:|---:|
| **1** | `1–25` | Dia 1 (0–60 min) | `+0%` | **99,9%** | **86,3%** | **69,7%** | **77,3%** |
| **2** | `20–45` | Dias 2–3 | `+12%` | **93,7%** | **86,3%** | **67,7%** | **74,0%** |
| **3** | `40–70` | Dias 4–6 | `+20%` | **97,3%** | **87,6%** | **69,2%** | **66,3%** |
| **4** | `65–95` | Dias 7–10 | `+26%` | **95,9%** | **86,1%** | **71,4%** | **69,8%** |
| **5** | `90–120` | Dias 11–14 | `+32%` | **93,3%** | **83,8%** | **70,4%** | **68,3%** |
| **6** | `115–150` | Semana 3 | `+36%` | **92,1%** | **83,7%** | **70,0%** | **69,0%** |
| **7** | `145–180` | Semana 4 | `+40%` | **95,5%** | **83,5%** | **75,0%** | **69,5%** |
| **8** | `175–210` | Semana 5 | `+44%` | **96,8%** | **83,3%** | **73,7%** | **77,8%** |
| **9** | `205–240` | Semana 6 | `+48%` | **95,4%** | **83,6%** | **74,7%** | **75,5%** |
| **10** | `235–265` | Semana 7 | `+52%` | **95,1%** | **84,8%** | **68,3%** | **71,3%** |
| **11** | `260–285` | Semana 8 | `+56%` | **95,9%** | **85,5%** | **66,7%** | **74,5%** |
| **12** | `280–300` | Endgame | `+60%` | **94,4%** | **86,0%** | **68,0%** | **71,8%** |

---

## 3. Auditoria de XP das Áreas de Idle / AFK (`regiao1-idle.js`)

Curva de XP dos Oníricos (`regiao1-progressao.js`): `xpPara(n) = 30 + 10n`.  
Rendimento do Idle (`XP_IDLE_CFG` em `regiao1-idle.js`):
- **Auto-Caça ativa:** `12 + 4 × nvArea` XP/abate para cada um dos 4 Oníricos da formação.
- **Offline / AFK (`1,6 abates/min`, teto 12h):** `10 + 3 × nvArea` XP/abate para cada Onírico da formação.

Como ambos crescem linearmente com o nível da área, o tempo necessário de AFK para cruzar toda a faixa de nível de cada capítulo permanece constante e confortável (sem parede de farm):

| Cap. | Faixa Nv. | XP da faixa (`xpTotal`) | Nv. médio área | XP em 8h AFK | Tempo só AFK (dias de 8h) | Conclusão |
|---:|---|---:|---:|---:|---:|---|
| 1 | `1–25` | `3.720` | `13` | `37.632` | `0,10` (~48 min) | Acompanha com folga |
| 2 | `20–45` | `8.750` | `33` | `83.712` | `0,10` (~50 min) | Acompanha com folga |
| 3 | `40–70` | `17.250` | `55` | `134.400` | `0,13` (~62 min) | Acompanha com folga |
| 4 | `65–95` | `24.750` | `80` | `192.000` | `0,13` (~62 min) | Acompanha com folga |
| 5 | `90–120` | `32.250` | `105` | `249.600` | `0,13` (~62 min) | Acompanha com folga |
| 6 | `115–150` | `47.250` | `133` | `314.112` | `0,15` (~72 min) | Acompanha com folga |
| 7 | `145–180` | `57.750` | `163` | `383.232` | `0,15` (~72 min) | Acompanha com folga |
| 8 | `175–210` | `68.250` | `193` | `452.352` | `0,15` (~72 min) | Acompanha com folga |
| 9 | `205–240` | `78.750` | `223` | `521.472` | `0,15` (~72 min) | Acompanha com folga |
| 10 | `235–265` | `75.750` | `250` | `583.680` | `0,13` (~62 min) | Acompanha com folga |
| 11 | `260–285` | `68.750` | `273` | `636.672` | `0,11` (~52 min) | Acompanha com folga |
| 12 | `280–300` | `58.500` | `290` | `675.840` | `0,09` (~42 min) | Acompanha com folga |

- **Veredito:** As áreas de Idle/AFK entregam XP mais que suficiente (~45–72 min de AFK por capítulo, ou ~15–25 min de Auto-Caça ativa + Poções/Campanha) para acompanhar todos os 12 capítulos sem exigir farm repetitivo.
- **Produção:** https://cwdp-lake.vercel.app/jogar
