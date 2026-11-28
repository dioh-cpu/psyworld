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

## 3. Auditoria de XP das Áreas de Idle / AFK (`regiao1-idle.js`) e Ajustes Consolidados

Curva de XP dos Oníricos (`regiao1-progressao.js`): `xpPara(n) = 30 + 10n`.  
Rendimento do Idle revisado (`XP_IDLE_CFG` em `regiao1-idle.js`) — reduzido para ficar **abaixo da Campanha Mini** e evitar disparidade entre nível dos Oníricos e do Domador:
- **Auto-Caça ativa:** `4 + 0,6 × nvArea` XP/abate por Onírico (`Nv.6 = 8 XP`, `Nv.10 = 10 XP`, contra `~78–140 XP` da Campanha Mini); Domador: `4 + 0,8 × nvArea` XP/abate (acompanha os Oníricos).
- **Offline / AFK (`1,6 abates/min`, teto 12h):** `3 + 0,45 × nvArea` XP/abate por Onírico (`Nv.6 = 6 XP`, `~92 XP` em 10 min offline); Domador: `3 + 0,6 × nvArea` XP/abate.
- **Evolução de Forma:** 2ª forma a partir do **Nv.41**; 3ª forma (e T5 dos iniciais) a partir do **Nv.81**.
- **Tiers e Estrelas (`regiao1-progressao.js`):** `T1 +0% / T2 +12% / T3 +28% / T4 +50% / T5 +85%` (salto real de `+23,3%` do T5 Lendário sobre o T4); estrelas douradas `+5%/★` (subindo até `+10%/★` na faixa arco-íris).
- **Relíquias (Gold obrigatório + teto por raridade):** `comum +10 / incomum +20 / rara +30 / epica +50 / lendaria +80 / mitica +100`. Custo em Gold por nível `k`: `150 + 75k` até `+15`, depois `1.275 + 120×(k-15)` (×1,15 na mítica).

- **Produção:** https://cwdp-lake.vercel.app/jogar
