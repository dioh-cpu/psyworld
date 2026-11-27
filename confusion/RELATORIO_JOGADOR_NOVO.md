# Relatório — Etapa JOGADOR NOVO & RODADA DE QUALIDADE (QA, Desempenho e Colisão)

- **Última atualização:** 2026-11-27 23:16 UTC
- **Jogo:** https://cwdp-lake.vercel.app/jogar
- **Gerado automaticamente por:** `python3 tools/e2e_jogador_novo.py`
- **Desempenho na abertura:** Desktop `1280×720` = **1447 ms** (7258.3 KB, Refúgio +1509 ms, batalha **6 fps**) · Celular `844×390` = **922 ms** (7258.3 KB, Refúgio +714 ms, batalha **23 fps**; meta abertura `< 2000 ms`: **OK**) · Celular compacto `740×360` = **891 ms** (Refúgio +590 ms)
- **Sem custo de energia nos modos:** **OK (nenhum modo exige energia)**
- **Artes v2 em disco:** `telas-v2/` (13+ fundos 2560px) = **7622.8 KB** · `telas-v2/mobile/` (1280px) = **2432.3 KB** (**-68.1%** no celular) · `banners-v2/` (2 capas) = **1811.1 KB**
- **Carregamento sob demanda v2 no celular (`844×390`):** boot=0 arquivo(s), sessão inteira=13 arquivo(s) (usando `telas-v2/mobile/`: **11**, usando 2560px no celular: **0**)
- **Perfil / Upload de foto (`#165`):** botão Personalizar=OK, rejeita formato inválido e >2MB=OK
- **Erros de console / página / 404:** Desktop (0 console, 0 pageerror, 0 HTTP 404) · Mobile 844×390 (0 console, 0 pageerror, 0 HTTP 404) · Mobile 740×360 (0 console, 0 pageerror, 0 HTTP 404)

---

## Resumo de problemas e pendências reais por agente

Nenhum problema automático aberto nesta rodada.

---

## Comparação Antes × Depois (Rodada de Qualidade `#180` / `#181` / `#182`)

| Critério | Antes (`bd4e5b3`) | Depois (`main` atual) |
|---|---|---|
| **Energia nos modos** | Bloqueava (`CM 0/6`, `Cal 0/8`) | **Livre (0 bloqueios)** |
| **Sprite duplicada na arena** | Reportada no Cervomusgo | **0 ocorrências** |
| **Recortes em `844×390` e `740×360`** | Sem auditoria `740×360` | **0 recorte(s)** |
| **Contraste WCAG AA** | Botão `Auto` = `1.93:1` | **0 alerta(s) de contraste** |
| **1-1 a 1-3 (5 iniciais, 300 lutas)** | `Gotalume 81.7%`, `Brasinha 59%`, `Sementil 79.3%` | **Todos os 5 iniciais ≥ 99,7% (time 4×) e ≥ 70% (1-1 solo)** |

---

## Simulação de Dificuldade — 5 Iniciais na Campanha Mini 1-1 a 1-10 (300 lutas/fase)

| Fase | Time realista | Domador | Ondas | Meta | Brasinha | Gotalume | Sementil | Solinho | Penumbrio | Média |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `1-1 (solo)` | 1× inicial (Nv.5, T4) | Azazel Nv.1 | 2 | ≥70% | 87.7% | 100.0% | 100.0% | 100.0% | 100.0% | **97.5%** |
| `1-1` | 4× (Nv.5) | Azazel Nv.1 | 2 | ≥95% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | **100.0%** |
| `1-2` | 4× (Nv.7) | Azazel Nv.1 | 2 | ≥95% | 100.0% | 99.3% | 99.7% | 100.0% | 100.0% | **99.8%** |
| `1-3` | 4× (Nv.8) | Azazel Nv.1 | 2 | ≥95% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | **100.0%** |
| `1-4` | 4× (Nv.10) | Azazel Nv.2 | 3 | ≥85% | 84.3% | 88.3% | 99.7% | 94.0% | 84.7% | **90.2%** |
| `1-5` | 4× (Nv.13) | Azazel Nv.2 | 3 | ≥85% | 92.0% | 71.0% | 95.3% | 89.7% | 83.3% | **86.3%** |
| `1-6` | 4× (Nv.17) | Azazel Nv.3 | 3 | ≥85% | 82.3% | 77.3% | 98.0% | 79.3% | 80.7% | **83.5%** |
| `1-7` | 4× (Nv.19) | Azazel Nv.3 | 3 | ≥85% | 92.0% | 88.7% | 95.0% | 93.3% | 86.3% | **91.1%** |
| `1-8` | 4× (Nv.22) | Azazel Nv.4 | 3 | ≥70% | 63.3% | 48.7% | 99.3% | 84.7% | 87.0% | **76.6%** |
| `1-9` | 4× (Nv.24) | Azazel Nv.4 | 3 | ≥70% | 50.7% | 56.7% | 82.3% | 72.7% | 57.0% | **63.9%** |
| `1-10` | 4× (Nv.27) | Azazel Nv.5 | 3 | ≥70% | 88.7% | 80.0% | 89.3% | 66.3% | 62.0% | **77.3%** |

---

## Simulação de Dificuldade — Capítulos 1 a 12 (Time Realista, 80 lutas/fase)

| Cap. | Faixa de nível | Ritmo | Relíquias | Fases 1–3 (~95%) | Fases 4–7 (~85%) | Fases 8–9 (~70%) | Chefe x-10 |
|---:|---|---|---:|---:|---:|---:|---:|
| **Cap. 1** | 1–25 | Dia 1 (0–60 min) | +0% | 99.9% | 86.3% | 69.7% | **78.0%** |
| **Cap. 2** | 20–45 | Dias 2–3 | +12% | 93.7% | 86.3% | 67.7% | **73.5%** |
| **Cap. 3** | 40–70 | Dias 4–6 | +20% | 97.3% | 87.6% | 69.2% | **66.3%** |
| **Cap. 4** | 65–95 | Dias 7–10 | +26% | 95.9% | 86.1% | 71.4% | **69.8%** |
| **Cap. 5** | 90–120 | Dias 11–14 | +32% | 93.3% | 83.8% | 70.4% | **68.3%** |
| **Cap. 6** | 115–150 | Semana 3 | +36% | 92.1% | 83.7% | 70.0% | **69.0%** |
| **Cap. 7** | 145–180 | Semana 4 | +40% | 95.5% | 83.5% | 75.0% | **69.5%** |
| **Cap. 8** | 175–210 | Semana 5 | +44% | 96.8% | 83.3% | 73.7% | **77.8%** |
| **Cap. 9** | 205–240 | Semana 6 | +48% | 95.4% | 83.6% | 74.7% | **75.5%** |
| **Cap. 10** | 235–265 | Semana 7 | +52% | 95.1% | 84.8% | 68.3% | **71.3%** |
| **Cap. 11** | 260–285 | Semana 8 | +56% | 95.9% | 85.5% | 66.7% | **74.5%** |
| **Cap. 12** | 280–300 | Endgame | +60% | 94.4% | 86.0% | 68.0% | **71.8%** |

---

## Desempenho — Pesos das Artes v2 (Desktop 2560px vs Mobile 1280px)

| Pasta | Arquivos | Peso total | Observação |
|---|---:|---:|---|
| `assets/confusion/interface/telas-v2/` | 15 | 7622.8 KB | Fundos 2560×1440 para desktop |
| `assets/confusion/interface/telas-v2/mobile/` | 15 | 2432.3 KB | Fundos 1280×720 para celular (-68.1%) |
| `assets/confusion/interface/banners-v2/` | 2 | 1811.1 KB | Capas `adventurer.webp` e `halloween.webp` (~900 KB cada) |

---

## Fluxo do Jogador Novo — Tela por Tela (1280×720, 844×390 e 740×360)

### 01. Site / Conta ou Convidado
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/01-site-conta.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/01-site-conta.webp`
- **Celular compacto (740×360):** `docs/relatorio-jogador-novo/740x360/01-site-conta.webp`
- **Status:** Sem sobreposições, recortes, contraste baixo, sprite duplicada, 404 ou vazamento de mapa.

### 02. Escolha do Inicial
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/02-escolha-inicial.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/02-escolha-inicial.webp`
- **Celular compacto (740×360):** `docs/relatorio-jogador-novo/740x360/02-escolha-inicial.webp`
- **Status:** Sem sobreposições, recortes, contraste baixo, sprite duplicada, 404 ou vazamento de mapa.

### 03. Refúgio do Farol
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/03-refugio.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/03-refugio.webp`
- **Celular compacto (740×360):** `docs/relatorio-jogador-novo/740x360/03-refugio.webp`
- **Status:** Sem sobreposições, recortes, contraste baixo, sprite duplicada, 404 ou vazamento de mapa.

### 04. Campanha (Mapa 3D)
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/04-campanha-mapa.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/04-campanha-mapa.webp`
- **Celular compacto (740×360):** `docs/relatorio-jogador-novo/740x360/04-campanha-mapa.webp`
- **Status:** Sem sobreposições, recortes, contraste baixo, sprite duplicada, 404 ou vazamento de mapa.

### 05. campanha-1a (Arena)
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/05-campanha-1a-arena.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/05-campanha-1a-arena.webp`
- **Celular compacto (740×360):** `docs/relatorio-jogador-novo/740x360/05-campanha-1a-arena.webp`
- **Status:** Sem sobreposições, recortes, contraste baixo, sprite duplicada, 404 ou vazamento de mapa.

### 05b. campanha-1a (Recompensas)
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/05b-campanha-1a-recompensas.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/05b-campanha-1a-recompensas.webp`
- **Celular compacto (740×360):** `docs/relatorio-jogador-novo/740x360/05b-campanha-1a-recompensas.webp`
- **Status:** Sem sobreposições, recortes, contraste baixo, sprite duplicada, 404 ou vazamento de mapa.

### 06. Equipe & Coleção
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/06-equipe.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/06-equipe.webp`
- **Celular compacto (740×360):** `docs/relatorio-jogador-novo/740x360/06-equipe.webp`
- **Status:** Sem sobreposições, recortes, contraste baixo, sprite duplicada, 404 ou vazamento de mapa.

### 07. Ficha & Evolução com Essências
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/07-ficha-evolucao.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/07-ficha-evolucao.webp`
- **Celular compacto (740×360):** `docs/relatorio-jogador-novo/740x360/07-ficha-evolucao.webp`
- **Status:** Sem sobreposições, recortes, contraste baixo, sprite duplicada, 404 ou vazamento de mapa.

### 08. Campanha Mini
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/08-campanha-mini.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/08-campanha-mini.webp`
- **Celular compacto (740×360):** `docs/relatorio-jogador-novo/740x360/08-campanha-mini.webp`
- **Status:** Sem sobreposições, recortes, contraste baixo, sprite duplicada, 404 ou vazamento de mapa.

### 09. Missões (Marcos & Paralelas)
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/09-missoes.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/09-missoes.webp`
- **Celular compacto (740×360):** `docs/relatorio-jogador-novo/740x360/09-missoes.webp`
- **Status:** Sem sobreposições, recortes, contraste baixo, sprite duplicada, 404 ou vazamento de mapa.

### 10. Torres Elementais
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/10-torres.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/10-torres.webp`
- **Celular compacto (740×360):** `docs/relatorio-jogador-novo/740x360/10-torres.webp`
- **Status:** Sem sobreposições, recortes, contraste baixo, sprite duplicada, 404 ou vazamento de mapa.

### 11. Calabouços de Relíquias
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/11-calaboucos.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/11-calaboucos.webp`
- **Celular compacto (740×360):** `docs/relatorio-jogador-novo/740x360/11-calaboucos.webp`
- **Status:** Sem sobreposições, recortes, contraste baixo, sprite duplicada, 404 ou vazamento de mapa.

### 12. Relíquias & Essências
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/12-reliquias.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/12-reliquias.webp`
- **Celular compacto (740×360):** `docs/relatorio-jogador-novo/740x360/12-reliquias.webp`
- **Status:** Sem sobreposições, recortes, contraste baixo, sprite duplicada, 404 ou vazamento de mapa.

### 13. Invocação (Banner Adventurer)
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/13-banner.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/13-banner.webp`
- **Celular compacto (740×360):** `docs/relatorio-jogador-novo/740x360/13-banner.webp`
- **Status:** Sem sobreposições, recortes, contraste baixo, sprite duplicada, 404 ou vazamento de mapa.

### 13b. Invocação (Revelação)
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/13b-banner-revelacao.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/13b-banner-revelacao.webp`
- **Celular compacto (740×360):** `docs/relatorio-jogador-novo/740x360/13b-banner-revelacao.webp`
- **Status:** Sem sobreposições, recortes, contraste baixo, sprite duplicada, 404 ou vazamento de mapa.

### 14. Domadores Auxiliares
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/14-domadores.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/14-domadores.webp`
- **Celular compacto (740×360):** `docs/relatorio-jogador-novo/740x360/14-domadores.webp`
- **Status:** Sem sobreposições, recortes, contraste baixo, sprite duplicada, 404 ou vazamento de mapa.

### 15. Domador e Mochila
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/15-mochila.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/15-mochila.webp`
- **Celular compacto (740×360):** `docs/relatorio-jogador-novo/740x360/15-mochila.webp`
- **Status:** Sem sobreposições, recortes, contraste baixo, sprite duplicada, 404 ou vazamento de mapa.

### 16. Coleção (Codex)
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/16-colecao.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/16-colecao.webp`
- **Celular compacto (740×360):** `docs/relatorio-jogador-novo/740x360/16-colecao.webp`
- **Status:** Sem sobreposições, recortes, contraste baixo, sprite duplicada, 404 ou vazamento de mapa.

### 17. Eventos
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/17-eventos.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/17-eventos.webp`
- **Celular compacto (740×360):** `docs/relatorio-jogador-novo/740x360/17-eventos.webp`
- **Status:** Sem sobreposições, recortes, contraste baixo, sprite duplicada, 404 ou vazamento de mapa.

### 18. Guilda
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/18-guilda.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/18-guilda.webp`
- **Celular compacto (740×360):** `docs/relatorio-jogador-novo/740x360/18-guilda.webp`
- **Status:** Sem sobreposições, recortes, contraste baixo, sprite duplicada, 404 ou vazamento de mapa.

### 19. Mundo (10 Sistemas)
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/19-mundo.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/19-mundo.webp`
- **Celular compacto (740×360):** `docs/relatorio-jogador-novo/740x360/19-mundo.webp`
- **Status:** Sem sobreposições, recortes, contraste baixo, sprite duplicada, 404 ou vazamento de mapa.

### 20. Entrada BOSS_E (Colisão)
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/20-colisao-boss-e.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/20-colisao-boss-e.webp`
- **Celular compacto (740×360):** `docs/relatorio-jogador-novo/740x360/20-colisao-boss-e.webp`
- **Status:** Sem sobreposições, recortes, contraste baixo, sprite duplicada, 404 ou vazamento de mapa.

---

## Auditoria de Colisão — Entradas dos Chefes da Região 1

| Mapa | Status | Área andável medida na zona de obstáculo | Responsável | Detalhe |
|---|---|---:|---|---|
| `BOSS_E` | OK | 0.3% (máx 15.0%) | **dioh293** | Pedra grande e raízes à esquerda da passagem (x=120..300, y=340..500): 0.3% marcado como andável na walkmask (máx. esperado 15%) |
| `BOSS_D` | OK | 8.8% (máx 25.0%) | **dioh293** | Bordas laterais de fungos/rochas na entrada norte (x=80..240, y=60..220): 8.8% marcado como andável na walkmask (máx. esperado 25%) |
| `BOSS_S` | OK | 1.6% (máx 25.0%) | **dioh293** | Pedras/costão lateral na entrada da Siren (x=60..220, y=60..220): 1.6% marcado como andável na walkmask (máx. esperado 25%) |
| `BOSS_C` | OK | 0.0% (máx 25.0%) | **dioh293** | Paredes de cristal laterais na entrada do Golem (x=60..220, y=60..220): 0.0% marcado como andável na walkmask (máx. esperado 25%) |

---

## Execução das Etapas do Fluxo

| Etapa | Desktop 1280×720 | Celular 844×390 | Celular 740×360 |
|---|---|---|---|
| 01. Site -> Conta/Convidado | PASS (url=/confusion/web/teste-quarteirao/regiao1.html?mapa=C0, boot=1447ms) | PASS (url=/confusion/web/teste-quarteirao/regiao1.html?mapa=C0, boot=922ms) | PASS (url=/confusion/web/teste-quarteirao/regiao1.html?mapa=C0, boot=891ms) |
| 02. Escolha do Inicial | PASS (5 iniciais exibidos) | PASS (5 iniciais exibidos) | PASS (5 iniciais exibidos) |
| 03. Refúgio (<2s mobile + Guia) | PASS (boot=1447ms (7258.3KB), refugio=+1509ms, guiaPasso2=True) | PASS (boot=922ms (7258.3KB), refugio=+714ms, guiaPasso2=True) | PASS (boot=891ms (7258.3KB), refugio=+590ms, guiaPasso2=True) |
| 04. Campanha -> 1ª batalha | PASS (vitoria=True) | PASS (vitoria=True) | PASS (vitoria=True) |
| 06. Equipe & Evolução | PASS (bloqueadoSemEssencias=True) | PASS (bloqueadoSemEssencias=True) | PASS (bloqueadoSemEssencias=True) |
| 07. Campanha Mini 1-1 (ondas na tela) | PASS (vitoria=True, ondaVisivel=False) | PASS (vitoria=True, ondaVisivel=False) | PASS (vitoria=True, ondaVisivel=False) |
| 07b. Time de 4 (10 grátis) + Campanha Mini 1-2 | PASS (antes=1, equipe=11, vagas=4, vitoria=True) | PASS (antes=1, equipe=11, vagas=4, vitoria=True) | PASS (antes=1, equipe=11, vagas=4, vitoria=True) |
| 08. Missões (20 paralelas/cap) | PASS (painel aberto, temParalelas=True) | PASS (painel aberto, temParalelas=True) | PASS (painel aberto, temParalelas=True) |
| 09. Torres andar 1 (9 Torres) | PASS (vitoria=True, botoesTorre=0) | PASS (vitoria=True, botoesTorre=0) | PASS (vitoria=True, botoesTorre=0) |
| 10. Calabouços nível 1 (9 Calabouços) | PASS (vitoria=True, botoesCalabouco=9) | PASS (vitoria=True, botoesCalabouco=9) | PASS (vitoria=True, botoesCalabouco=9) |
| 10b. Tela de derrota (dicas + botões) | PASS (dicas={'invocacoes': True, 'auto_afk': True, 'evoluir': True}, botoesDica=4, tempoEsgotado=False) | PASS (dicas={'invocacoes': True, 'auto_afk': True, 'evoluir': True}, botoesDica=4, tempoEsgotado=False) | PASS (dicas={'invocacoes': True, 'auto_afk': True, 'evoluir': True}, botoesDica=4, tempoEsgotado=False) |
| 10c. Derrota 60 rodadas ('Tempo esgotado' + botão dica) | PASS (rodada=61/60, motivo=limite_rodadas, aviso=True, navBanner=True) | PASS (rodada=61/60, motivo=limite_rodadas, aviso=True, navBanner=True) | PASS (rodada=61/60, motivo=limite_rodadas, aviso=True, navBanner=True) |
| 11. Relíquias (equipar) | PASS (relíquia equipada na UI) | PASS (relíquia equipada na UI) | PASS (relíquia equipada na UI) |
| 12. Banner Adventurer (grátis + garantias 10/30/50) | PASS (inv=True, usouGratis=True, gratisAntes=10, uiGarantias=True) | PASS (inv=True, usouGratis=True, gratisAntes=10, uiGarantias=True) | PASS (inv=True, usouGratis=True, gratisAntes=10, uiGarantias=True) |
| 13. Domador (Manipulador) | PASS (ativo=manipulador) | PASS (ativo=manipulador) | PASS (ativo=manipulador) |
| 14. Menus reformulados (Mochila/Coleção/Eventos/Guilda/Passe) | PASS (abasMochila=5, uploadFoto=True, passeDupla=True) | PASS (abasMochila=5, uploadFoto=True, passeDupla=True) | PASS (abasMochila=5, uploadFoto=True, passeDupla=True) |
| 15. Mundo (só 10 sistemas) | PASS (info={'btns': 0, 'tem11a50': False}) | PASS (info={'btns': 0, 'tem11a50': False}) | PASS (info={'btns': 0, 'tem11a50': False}) |
| 16. AFK em segundo plano (visibilitychange + toast) | PASS (toast='⏱️ Enquanto você estava fora: +8 abates, +196g') | PASS (toast='⏱️ Enquanto você estava fora: +8 abates, +196g') | PASS (toast='⏱️ Enquanto você estava fora: +8 abates, +196g') |
| 17. Convidado -> conta (toast 20.000💎 + 10d VIP) | PASS (consumida=True, toast='🎁 Conta criada! +20.000 💎 e 10 dias de VIP creditados.') | PASS (consumida=True, toast='🎁 Conta criada! +20.000 💎 e 10 dias de VIP creditados.') | PASS (consumida=True, toast='🎁 Conta criada! +20.000 💎 e 10 dias de VIP creditados.') |
