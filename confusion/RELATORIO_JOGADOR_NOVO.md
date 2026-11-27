# Relatório — Etapa JOGADOR NOVO (QA, Desempenho e Colisão)

- **Última atualização:** 2026-11-27 18:24 UTC
- **Jogo:** https://cwdp-lake.vercel.app/jogar
- **Gerado automaticamente por:** `python3 tools/e2e_jogador_novo.py`
- **Desempenho na abertura:** Desktop `1280×720` = **1764 ms** (7139.1 KB, Refúgio +1644 ms, batalha **7 fps**) · Celular `844×390` = **970 ms** (7139.1 KB, Refúgio +794 ms, batalha **20 fps**; meta abertura `< 2000 ms`: **OK**)
- **Artes v2 em disco:** `telas-v2/` (13 fundos 2560px) = **6822.6 KB** · `telas-v2/mobile/` (13 fundos 1280px) = **2147.5 KB** (**-68.5%** no celular) · `banners-v2/` (2 capas) = **1811.1 KB**
- **Carregamento sob demanda v2 no celular (`844×390`):** boot=0 arquivo(s), sessão inteira=12 arquivo(s) (usando `telas-v2/mobile/`: **10**, usando 2560px no celular: **0**)
- **Perfil / Upload de foto (`#165`):** botão Personalizar=OK, rejeita formato inválido e >2MB=OK
- **Erros de console / página / 404:** Desktop (0 console, 0 pageerror, 0 HTTP 404) · Mobile (0 console, 0 pageerror, 0 HTTP 404)

---

## Resumo de problemas e pendências reais por agente

Nenhum problema automático aberto nesta rodada.

---

## Desempenho — Pesos das Artes v2 (Desktop 2560px vs Mobile 1280px)

| Pasta | Arquivos | Peso total | Observação |
|---|---:|---:|---|
| `assets/confusion/interface/telas-v2/` | 13 | 6822.6 KB | Fundos 2560×1440 para desktop |
| `assets/confusion/interface/telas-v2/mobile/` | 13 | 2147.5 KB | Fundos 1280×720 para celular (-68.5%) |
| `assets/confusion/interface/banners-v2/` | 2 | 1811.1 KB | Capas `adventurer.webp` e `halloween.webp` (~900 KB cada) |

---

## Fluxo do Jogador Novo — Tela por Tela (1280×720 e 844×390)

### 01. Site / Conta ou Convidado
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/01-site-conta.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/01-site-conta.webp`
- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.

### 02. Escolha do Inicial
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/02-escolha-inicial.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/02-escolha-inicial.webp`
- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.

### 03. Refúgio do Farol
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/03-refugio.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/03-refugio.webp`
- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.

### 04. Campanha (Mapa 3D)
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/04-campanha-mapa.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/04-campanha-mapa.webp`
- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.

### 05. campanha-1a (Arena)
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/05-campanha-1a-arena.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/05-campanha-1a-arena.webp`
- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.

### 05b. campanha-1a (Recompensas)
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/05b-campanha-1a-recompensas.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/05b-campanha-1a-recompensas.webp`
- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.

### 06. Equipe & Coleção
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/06-equipe.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/06-equipe.webp`
- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.

### 07. Ficha & Evolução com Essências
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/07-ficha-evolucao.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/07-ficha-evolucao.webp`
- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.

### 08. Campanha Mini
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/08-campanha-mini.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/08-campanha-mini.webp`
- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.

### 09. Missões (Marcos & Paralelas)
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/09-missoes.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/09-missoes.webp`
- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.

### 10. Torres Elementais
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/10-torres.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/10-torres.webp`
- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.

### 11. Calabouços de Relíquias
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/11-calaboucos.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/11-calaboucos.webp`
- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.

### 12. Relíquias & Essências
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/12-reliquias.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/12-reliquias.webp`
- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.

### 13. Invocação (Banner Adventurer)
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/13-banner.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/13-banner.webp`
- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.

### 13b. Invocação (Revelação)
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/13b-banner-revelacao.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/13b-banner-revelacao.webp`
- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.

### 14. Domadores Auxiliares
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/14-domadores.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/14-domadores.webp`
- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.

### 15. Domador e Mochila
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/15-mochila.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/15-mochila.webp`
- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.

### 16. Coleção (Codex)
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/16-colecao.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/16-colecao.webp`
- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.

### 17. Eventos
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/17-eventos.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/17-eventos.webp`
- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.

### 18. Guilda
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/18-guilda.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/18-guilda.webp`
- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.

### 19. Mundo (10 Sistemas)
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/19-mundo.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/19-mundo.webp`
- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.

### 20. Entrada BOSS_E (Colisão)
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/20-colisao-boss-e.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/20-colisao-boss-e.webp`
- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.

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

| Etapa | Desktop 1280×720 | Celular 844×390 |
|---|---|---|
| 01. Site -> Conta/Convidado | PASS (url=/confusion/web/teste-quarteirao/regiao1.html?mapa=C0, boot=1764ms) | PASS (url=/confusion/web/teste-quarteirao/regiao1.html?mapa=C0, boot=970ms) |
| 02. Escolha do Inicial | PASS (5 iniciais exibidos) | PASS (5 iniciais exibidos) |
| 03. Refúgio (<2s mobile + Guia) | PASS (boot=1764ms (7139.1KB), refugio=+1644ms, guiaPasso2=True) | PASS (boot=970ms (7139.1KB), refugio=+794ms, guiaPasso2=True) |
| 04. Campanha -> 1ª batalha | PASS (vitoria=True) | PASS (vitoria=True) |
| 06. Equipe & Evolução | PASS (bloqueadoSemEssencias=True) | PASS (bloqueadoSemEssencias=True) |
| 07. Campanha Mini 1-1 | PASS (vitoria=True) | PASS (vitoria=True) |
| 08. Missões | PASS (painel Marcos/Paralelas aberto) | PASS (painel Marcos/Paralelas aberto) |
| 09. Torres andar 1 | PASS (vitoria=True) | PASS (vitoria=True) |
| 10. Calabouços nível 1 | PASS (vitoria=True) | PASS (vitoria=True) |
| 11. Relíquias (equipar) | PASS (relíquia equipada na UI) | PASS (relíquia equipada na UI) |
| 12. Banner Adventurer (grátis + garantias 10/30/50) | PASS (inv=True, usouGratis=True, gratisAntes=10, uiGarantias=True) | PASS (inv=True, usouGratis=True, gratisAntes=10, uiGarantias=True) |
| 13. Domador (Manipulador) | PASS (ativo=manipulador) | PASS (ativo=manipulador) |
| 14. Menus reformulados (Mochila/Coleção/Eventos/Guilda) | PASS (abasMochila=5, uploadFotoPerfil=True) | PASS (abasMochila=5, uploadFotoPerfil=True) |
| 15. Mundo (só 10 sistemas) | PASS (info={'btns': 0, 'tem11a50': False}) | PASS (info={'btns': 0, 'tem11a50': False}) |
| 16. AFK em segundo plano (visibilitychange + toast) | PASS (toast='⏱️ Enquanto você estava fora: +8 abates, +196g') | PASS (toast='⏱️ Enquanto você estava fora: +8 abates, +196g') |
| 17. Convidado -> conta (toast 20.000💎 + 10d VIP) | PASS (consumida=True, toast='🎁 Conta criada! +20.000 💎 e 10 dias de VIP creditados.') | PASS (consumida=True, toast='🎁 Conta criada! +20.000 💎 e 10 dias de VIP creditados.') |
