# Relatório — Etapa JOGADOR NOVO (QA, Desempenho e Colisão)

- **Última atualização:** 2026-11-27 16:44 UTC
- **Jogo:** https://cwdp-lake.vercel.app/jogar
- **Gerado automaticamente por:** `python3 tools/e2e_jogador_novo.py`
- **Desempenho na abertura:** Desktop `1280×720` = **1544 ms** (Refúgio +1713 ms) · Celular `844×390` = **1004 ms** (Refúgio +879 ms; meta `< 2000 ms`: **OK**)
- **Erros de console / página / 404:** Desktop (0 console, 0 pageerror, 0 HTTP 404) · Mobile (0 console, 0 pageerror, 0 HTTP 404)

---

## Resumo de problemas encontrados por agente

| Agente | Tipo | Tela / Mapa | Detalhe |
|---|---|---|---|
| **dioh293** | `colisao-walkmask` | BOSS_E | Pedra grande e raízes à esquerda da passagem (x=120..300, y=340..500): 59.2% marcado como andável na walkmask (máx. esperado 15%) |

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

### 15. Mundo (10 Sistemas)
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/15-mundo.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/15-mundo.webp`
- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.

### 16. Entrada BOSS_E (Colisão)
- **Desktop (1280×720):** `docs/relatorio-jogador-novo/1280x720/16-colisao-boss-e.webp`
- **Celular (844×390):** `docs/relatorio-jogador-novo/844x390/16-colisao-boss-e.webp`
- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.

---

## Auditoria de Colisão — Entradas dos Chefes da Região 1

| Mapa | Status | Área andável medida na zona de obstáculo | Responsável | Detalhe |
|---|---|---:|---|---|
| `BOSS_E` | FALHA (atravessa obstáculo) | 59.2% (máx 15.0%) | **dioh293** | Pedra grande e raízes à esquerda da passagem (x=120..300, y=340..500): 59.2% marcado como andável na walkmask (máx. esperado 15%) |
| `BOSS_D` | OK | 8.8% (máx 25.0%) | **dioh293** | Bordas laterais de fungos/rochas na entrada norte (x=80..240, y=60..220): 8.8% marcado como andável na walkmask (máx. esperado 25%) |
| `BOSS_S` | OK | 1.6% (máx 25.0%) | **dioh293** | Pedras/costão lateral na entrada da Siren (x=60..220, y=60..220): 1.6% marcado como andável na walkmask (máx. esperado 25%) |
| `BOSS_C` | OK | 0.0% (máx 25.0%) | **dioh293** | Paredes de cristal laterais na entrada do Golem (x=60..220, y=60..220): 0.0% marcado como andável na walkmask (máx. esperado 25%) |

---

## Execução das Etapas do Fluxo

| Etapa | Desktop 1280×720 | Celular 844×390 |
|---|---|---|
| 01. Site -> Conta/Convidado | PASS (url=/confusion/web/teste-quarteirao/regiao1.html?mapa=C0, boot=1544ms) | PASS (url=/confusion/web/teste-quarteirao/regiao1.html?mapa=C0, boot=1004ms) |
| 02. Escolha do Inicial | PASS (5 iniciais exibidos) | PASS (5 iniciais exibidos) |
| 03. Refúgio (<2s mobile + Guia) | PASS (boot=1544ms, transicaoRefugio=1713ms, guiaPasso2=True) | PASS (boot=1004ms, transicaoRefugio=879ms, guiaPasso2=True) |
| 04. Campanha -> 1ª batalha | PASS (vitoria=True) | PASS (vitoria=True) |
| 06. Equipe & Evolução | PASS (bloqueadoSemEssencias=True) | PASS (bloqueadoSemEssencias=True) |
| 07. Campanha Mini 1-1 | PASS (vitoria=True) | PASS (vitoria=True) |
| 08. Missões | PASS (painel Marcos/Paralelas aberto) | PASS (painel Marcos/Paralelas aberto) |
| 09. Torres andar 1 | PASS (vitoria=True) | PASS (vitoria=True) |
| 10. Calabouços nível 1 | PASS (vitoria=True) | PASS (vitoria=True) |
| 11. Relíquias (equipar) | PASS (relíquia equipada na UI) | PASS (relíquia equipada na UI) |
| 12. Banner Adventurer (1ª invocação) | PASS (invocou=True) | PASS (invocou=True) |
| 13. Domador (Manipulador) | PASS (ativo=manipulador) | PASS (ativo=manipulador) |
| 14. Mundo (só 10 sistemas) | PASS (info={'btns': 0, 'tem11a50': False}) | PASS (info={'btns': 0, 'tem11a50': False}) |
