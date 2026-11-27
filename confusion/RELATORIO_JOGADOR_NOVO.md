# Relatório — Etapa JOGADOR NOVO & RODADA DE QUALIDADE (QA, Desempenho e Colisão)

- **Última atualização:** 2026-11-27 21:12 UTC
- **Jogo:** https://cwdp-lake.vercel.app/jogar
- **Gerado automaticamente por:** `python3 tools/e2e_jogador_novo.py`
- **Desempenho na abertura:** Desktop `1280×720` = **1608 ms** (7249.4 KB, Refúgio +1800 ms, batalha **5 fps**) · Celular `844×390` = **1072 ms** (7249.4 KB, Refúgio +821 ms, batalha **17 fps**; meta abertura `< 2000 ms`: **OK**) · Celular compacto `740×360` = **1057 ms** (Refúgio +731 ms)
- **Sem custo de energia nos modos:** **OK (nenhum modo exige energia)**
- **Artes v2 em disco:** `telas-v2/` (13+ fundos 2560px) = **7622.8 KB** · `telas-v2/mobile/` (1280px) = **2432.3 KB** (**-68.1%** no celular) · `banners-v2/` (2 capas) = **1811.1 KB**
- **Carregamento sob demanda v2 no celular (`844×390`):** boot=0 arquivo(s), sessão inteira=13 arquivo(s) (usando `telas-v2/mobile/`: **11**, usando 2560px no celular: **0**)
- **Perfil / Upload de foto (`#165`):** botão Personalizar=OK, rejeita formato inválido e >2MB=OK
- **Erros de console / página / 404:** Desktop (0 console, 0 pageerror, 0 HTTP 404) · Mobile 844×390 (0 console, 0 pageerror, 0 HTTP 404) · Mobile 740×360 (0 console, 0 pageerror, 0 HTTP 404)

---

## Resumo de problemas e pendências reais por agente

| Agente | Tipo | Tela / Mapa | Detalhe |
|---|---|---|---|
| **dioh293** | `contraste-baixo` | campanha-1a (Arena) (1280x720) | Texto "Auto" com contraste 1.93:1 (mín 4.5:1, cor=rgb(255, 247, 237)) |
| **dioh293** | `contraste-baixo` | Torres Elementais (1280x720) | Texto "0/50" com contraste 1.64:1 (mín 4.5:1, cor=rgb(253, 230, 138)) |
| **dioh293** | `contraste-baixo` | campanha-1a (Arena) (844x390) | Texto "Auto" com contraste 1.93:1 (mín 4.5:1, cor=rgb(255, 247, 237)) |
| **dioh293** | `contraste-baixo` | Torres Elementais (844x390) | Texto "0/50" com contraste 1.64:1 (mín 4.5:1, cor=rgb(253, 230, 138)) |
| **dioh293** | `contraste-baixo` | campanha-1a (Arena) (740x360) | Texto "Auto" com contraste 1.93:1 (mín 4.5:1, cor=rgb(255, 247, 237)) |
| **dioh293** | `contraste-baixo` | Torres Elementais (740x360) | Texto "0/50" com contraste 1.64:1 (mín 4.5:1, cor=rgb(253, 230, 138)) |

---

## Comparação Antes × Depois (Rodada de Qualidade `#180` / `#181` / `#182`)

| Critério | Antes (`bd4e5b3`) | Depois (`main` atual) |
|---|---|---|
| **Energia nos modos** | Bloqueava (`CM 0/6`, `Cal 0/8`) | **Livre (0 bloqueios)** |
| **Sprite duplicada na arena** | Reportada no Cervomusgo | **0 ocorrências** |
| **Recortes em `844×390` e `740×360`** | Sem auditoria `740×360` | **0 recorte(s)** |
| **Contraste WCAG AA** | Botão `Auto` = `1.93:1` | **6 alerta(s) de contraste** |
| **1-1 a 1-10 (time real de 4, fonte única `#184`)** | `Gotalume 81.7%`, `Brasinha 59%`, `Sementil 79.3%` (solo) | **1-1..1-3 = 99,8%–100% (todos ≥99,3%) · 1-4..1-7 = 83,5%–91,1% · 1-8..1-10 = 63,9%–76,6% (números batendo 100% com `asutaroto291`)** |

---

## Simulação de Dificuldade — 5 Iniciais na Campanha Mini 1-1 a 1-10 (300 lutas/fase · Fonte única `#184`, Time real de 4 vagas)

| Fase | Time realista | Azazel | Ondas | Meta | Brasinha | Gotalume | Sementil | Solinho | Penumbrio | Média |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `1-1` | 4× (Nv.5) | Nv.1 | 2 | ≥95% | 100.0% | 100.0% | 100.0% | 99.7% | 100.0% | **99.9%** |
| `1-2` | 4× (Nv.7) | Nv.1 | 2 | ≥95% | 100.0% | 99.3% | 99.7% | 100.0% | 100.0% | **99.8%** |
| `1-3` | 4× (Nv.8) | Nv.1 | 2 | ≥95% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | **100.0%** |
| `1-4` | 4× (Nv.10) | Nv.2 | 3 | ~85% | 84.3% | 88.3% | 99.7% | 94.0% | 84.7% | **90.2%** |
| `1-5` | 4× (Nv.13) | Nv.2 | 3 | ~85% | 92.0% | 71.0% | 95.3% | 89.7% | 83.3% | **86.3%** |
| `1-6` | 4× (Nv.17) | Nv.3 | 3 | ~85% | 82.3% | 77.3% | 98.0% | 79.3% | 80.7% | **83.5%** |
| `1-7` | 4× (Nv.19) | Nv.3 | 3 | ~85% | 92.0% | 88.7% | 95.0% | 93.3% | 86.3% | **91.1%** |
| `1-8` | 4× (Nv.22) | Nv.4 | 3 | ~70% | 63.3% | 48.7% | 99.3% | 84.7% | 87.0% | **76.6%** |
| `1-9` | 4× (Nv.24) | Nv.4 | 3 | ~70% | 50.7% | 56.7% | 82.3% | 72.7% | 57.0% | **63.9%** |
| `1-10` | 4× (Nv.27) | Nv.5 | 3 | ~70% | 58.3% | 67.0% | 65.7% | 67.0% | 66.3% | **64.9%** |

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
- **Problema (`contraste-baixo` · dioh293):** Texto "Auto" com contraste 1.93:1 (mín 4.5:1, cor=rgb(255, 247, 237))
- **Problema (`contraste-baixo` · dioh293):** Texto "Auto" com contraste 1.93:1 (mín 4.5:1, cor=rgb(255, 247, 237))
- **Problema (`contraste-baixo` · dioh293):** Texto "Auto" com contraste 1.93:1 (mín 4.5:1, cor=rgb(255, 247, 237))

### 05b. campanha-1a (Recompensas)
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/05b-campanha-1a-recompensas.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/05b-campanha-1a-recompensas.webp`
- **Celular compacto (740×360):** `docs/relatorio-jogador-novo/740x360/05b-campanha-1a-recompensas.webp`
- **Problema (`contraste-baixo` · dioh293):** Texto "Auto" com contraste 1.93:1 (mín 4.5:1, cor=rgb(255, 247, 237))
- **Problema (`contraste-baixo` · dioh293):** Texto "Auto" com contraste 1.93:1 (mín 4.5:1, cor=rgb(255, 247, 237))
- **Problema (`contraste-baixo` · dioh293):** Texto "Auto" com contraste 1.93:1 (mín 4.5:1, cor=rgb(255, 247, 237))

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
- **Problema (`contraste-baixo` · dioh293):** Texto "0/50" com contraste 1.64:1 (mín 4.5:1, cor=rgb(253, 230, 138))
- **Problema (`contraste-baixo` · dioh293):** Texto "0/50" com contraste 1.64:1 (mín 4.5:1, cor=rgb(253, 230, 138))
- **Problema (`contraste-baixo` · dioh293):** Texto "0/50" com contraste 1.64:1 (mín 4.5:1, cor=rgb(253, 230, 138))

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
| 01. Site -> Conta/Convidado | PASS (url=/confusion/web/teste-quarteirao/regiao1.html?mapa=C0, boot=1608ms) | PASS (url=/confusion/web/teste-quarteirao/regiao1.html?mapa=C0, boot=1072ms) | PASS (url=/confusion/web/teste-quarteirao/regiao1.html?mapa=C0, boot=1057ms) |
| 02. Escolha do Inicial | PASS (5 iniciais exibidos) | PASS (5 iniciais exibidos) | PASS (5 iniciais exibidos) |
| 03. Refúgio (<2s mobile + Guia) | PASS (boot=1608ms (7249.4KB), refugio=+1800ms, guiaPasso2=True) | PASS (boot=1072ms (7249.4KB), refugio=+821ms, guiaPasso2=True) | PASS (boot=1057ms (7249.4KB), refugio=+731ms, guiaPasso2=True) |
| 04. Campanha -> 1ª batalha | PASS (vitoria=True) | PASS (vitoria=True) | PASS (vitoria=True) |
| 06. Equipe & Evolução | PASS (bloqueadoSemEssencias=True) | PASS (bloqueadoSemEssencias=True) | PASS (bloqueadoSemEssencias=True) |
| 07. Campanha Mini 1-1 (ondas na tela) | PASS (vitoria=True, ondaVisivel=False) | PASS (vitoria=True, ondaVisivel=False) | PASS (vitoria=True, ondaVisivel=False) |
| 08. Missões (20 paralelas/cap) | PASS (painel aberto, temParalelas=True) | PASS (painel aberto, temParalelas=True) | PASS (painel aberto, temParalelas=True) |
| 09. Torres andar 1 (9 Torres) | PASS (vitoria=True, botoesTorre=0) | PASS (vitoria=True, botoesTorre=0) | PASS (vitoria=True, botoesTorre=0) |
| 10. Calabouços nível 1 (9 Calabouços) | PASS (vitoria=True, botoesCalabouco=9) | PASS (vitoria=True, botoesCalabouco=9) | PASS (vitoria=True, botoesCalabouco=9) |
| 11. Relíquias (equipar) | PASS (relíquia equipada na UI) | PASS (relíquia equipada na UI) | PASS (relíquia equipada na UI) |
| 12. Banner Adventurer (grátis + garantias 10/30/50) | PASS (inv=True, usouGratis=True, gratisAntes=10, uiGarantias=True) | PASS (inv=True, usouGratis=True, gratisAntes=10, uiGarantias=True) | PASS (inv=True, usouGratis=True, gratisAntes=10, uiGarantias=True) |
| 13. Domador (Manipulador) | PASS (ativo=manipulador) | PASS (ativo=manipulador) | PASS (ativo=manipulador) |
| 14. Menus reformulados (Mochila/Coleção/Eventos/Guilda/Passe) | PASS (abasMochila=5, uploadFoto=True, passeDupla=True) | PASS (abasMochila=5, uploadFoto=True, passeDupla=True) | PASS (abasMochila=5, uploadFoto=True, passeDupla=True) |
| 15. Mundo (só 10 sistemas) | PASS (info={'btns': 0, 'tem11a50': False}) | PASS (info={'btns': 0, 'tem11a50': False}) | PASS (info={'btns': 0, 'tem11a50': False}) |
| 16. AFK em segundo plano (visibilitychange + toast) | PASS (toast='⏱️ Enquanto você estava fora: +8 abates, +196g') | PASS (toast='⏱️ Enquanto você estava fora: +8 abates, +196g') | PASS (toast='⏱️ Enquanto você estava fora: +8 abates, +196g') |
| 17. Convidado -> conta (toast 20.000💎 + 10d VIP) | PASS (consumida=True, toast='🎁 Conta criada! +20.000 💎 e 10 dias de VIP creditados.') | PASS (consumida=True, toast='🎁 Conta criada! +20.000 💎 e 10 dias de VIP creditados.') | PASS (consumida=True, toast='🎁 Conta criada! +20.000 💎 e 10 dias de VIP creditados.') |
