# PSYWORLD · Confusion Waves: Double Perspective — Estado Atual Completo & Prompt de Continuação

**Data de referência:** 23/11/2026  
**Repositório:** `dioh-cpu/psyworld`  
**Branch ativa:** `feature/praia-colisao-azazel-vilao-v1` (HEAD: `f7e4dc2`)  
**Entrada jogável principal:** [regiao1.html](../confusion/web/teste-quarteirao/regiao1.html)

---

## 1. Direção Oficial do Jogo (Decisões Permanentes)

- **IP 100% original** (*PSYWORLD / Confusion Waves: Double Perspective*), estética **Dark Fantasy**.
- **Idle é o foco principal** e a **Campanha (`Herói × Vilão`) é um modo alternativo entrelaçado**:
  - Os dois modos compartilham a **mesma conta, Gold, Diamantes, Oníricos, Esferas Psíquicas, Ovos, Relíquias, Codex, Passe de Temporada, Nível do Domador e Save**.
- **Protagonista atual jogável:** **Azazel** (perspectiva Vilão) e sua **Conexão Onírica** com **Noctarn** (`✨ Transformar` = `+100%` de velocidade de movimento).
- **Segurança de Git:** trabalhar somente na branch `feature/praia-colisao-azazel-vilao-v1` (nunca modificar `main` sem autorização explícita).

---

## 2. Tudo que Foi Feito e Está 100% Funcional

### A. Mundo 2D & 48 Áreas da Região 1
- **48 áreas jogáveis** integradas em [regiao1-mapas.js](../confusion/web/teste-quarteirao/regiao1-mapas.js) (`C0–C3`, `REINO`, `E1–E10`, `BOSS_E`, `PC1–PC9`, `BOSS_S`, `CC1–CC9`, `BOSS_C`, `D1–D11`, `BOSS_D`).
- Artes 2K WebP + **48 walkmasks auditadas 100% por BFS** (sem bloqueios falsos entre saídas) + colisão contínua por **SDF** ([colisao.js](../confusion/web/explorar3d/colisao.js)) + pathfinding em grade `128×71`.
- Variantes de mapas com marco ativado (`-ativo.webp` para `E8`, `D9`, `PC7`, `CC7` e overlay visual no pedestal de `C1`).
- Câmera calibrada para **Paisagem e Retrato** com controles de zoom (`− / 100% / +` e scroll do mouse).

### B. Personagens, Escala & Movimentação
- **Azazel** ([azazel.js](../confusion/web/teste-quarteirao/azazel.js)) e **Noctarn** ([noctarn.js](../confusion/web/teste-quarteirao/noctarn.js)) ancorados corretamente nos pés (`y = 0`), escala `7.20u` (`5.54 × 1.30`), monstros selvagens `6.4u`, chefes `9.8u`, NPCs `6.75u`.
- **Controles:** clique/toque no mapa com pathfinding, teclado (`WASD` / Setas), joystick virtual em mobile.
- **Velocidade:** base `8.7 u/s` (`+50%` sobre o original) e **`✨ Transformar` (Conexão Onírica, tecla `T` ou `Shift`)** dando **`+100%` de velocidade (`17.4 u/s`)**.

### C. Automação Contínua (Não Pausa ao Abrir Menus!)
- **Auto-Caça (`⚔️ Auto · ON/OFF`):** caça os **206 monstros selvagens** em tempo real diretamente no mapa 2D, com escolha automática de habilidade por vantagem elemental, números de dano/drops flutuantes, auto-captura com Esferas Psíquicas, drop de Ovos e respawn automático em `5s`.
- **Auto-Rota (`🧭 Auto-Rota`):** 100% automática através das 48 áreas — calcula caminho BFS entre mapas, atravessa saídas, coleta pistas, conversa com NPCs, ativa marcos e encadeia automaticamente para a próxima missão.
- **Execução em segundo plano com menus abertos (corrigido em `f7e4dc2`):** abrir **qualquer menu** (`Menu`, `Mochila/Domador`, `Atlas`, `Codex`, `Diário`, `Temporada`, `Vote`, `Mapa 48`, `Config`, `Config Auto-Caça`, `Teleporte`) **NÃO pausa nem cancela** Auto-Caça nem Auto-Rota. Apenas uma **Batalha de Chefe ativa (`#modal-batalha`)** pausa o movimento. Quando Auto-Rota coleta uma pista/NPC enquanto você está em um menu, conclui silenciosamente com toast + mini-log sem fechar seu menu.

### D. Nível do Domador & Pontos de Atributo (Novo em `f7e4dc2`)
- **XP unificado:** todo XP ganho em **Missões de Campanha, Auto-Caça, Batalhas manuais/Chefes e Farm Offline (AFK)** sobe o **Nível do Domador**.
- **+3 Pontos de Atributo por nível** distribuíveis no modal **Domador, Relíquias & Mochila** (também acessível tocando diretamente no card do personagem no canto superior esquerdo do HUD), com botão **`↺ Resetar`** gratuito:
  - **FOR (Força Onírica):** `+3 ATK` por ponto.
  - **VIT (Vitalidade):** `+15 HP Máx` e `+1 DEF` por ponto.
  - **MEN (Mente):** `+2 ATK Elemental` e `+1%` proteção mental por ponto.
  - **VIN (Vínculo):** `+2%` Chance de Captura e `+3%` XP ganho por ponto.
  - **SOR (Sorte):** `+3%` Gold, `+2%` Drop de Ovos e `+4%` Fazenda por ponto.
- **HUD atualizado:** barra fina de XP abaixo de HP/SAN + selo dourado **`+N pts`** piscando quando há pontos livres + ponto indicador no botão `☰ Menu`.
- **Batalhas de Chefe / Encontro Manual** agora usam os atributos reais do Domador (`hpMax`, `atk`, `def`, `nivel`) em vez de `150/150` fixo.

### E. Suíte Idle Completa ([regiao1-idle.js](../confusion/web/teste-quarteirao/regiao1-idle.js) & [regiao1-ui-idle.js](../confusion/web/teste-quarteirao/regiao1-ui-idle.js))
- **HUD Compacto + Minimapa Circular** em tempo real (jogador, saídas, marco, monstros, coordenadas `MAPA (x, y)`).
- **Menu Unificado (`☰ Menu`):** acesso rápido a todas as telas + toggles **`HUD Clean`** e **`🌙 Economia de Energia`** (reduz render WebGL mantendo o Auto-Caça rodando no celular).
- **Atlas de Caça (48 áreas):** busca por nome/monstro, filtro por bioma, selo de risco (`Seguro / Equilibrado / Arriscado / Perigoso` + estimativa de golpes suportados) e botões `Ir` / `Caçar`.
- **Configuração de Auto-Caça:** filtros por espécie do mapa, preferência elemental, auto-captura, auto-ovos, limites de HP/Sanidade e recuo de emergência.
- **Codex Onírico:** registra espécies vistas/abatidas/capturadas, áreas visitadas (`N/48`) e chefes (`N/4`), concedendo **bônus permanentes da conta** (`+% HP`, `+% ATK`, `+% Captura`, `+% Fazenda`).
- **Mochila, Relíquias, Ovos & Status Explicáveis:** breakdown transparente de cada atributo (Base + Atributos Domador + Relíquias + Codex + Sanidade), compra/equipamento de Relíquias, incubação/chocar Ovos e loja de Esferas Psíquicas (corrigido para exibir corretamente `gold` e `💎 diamantes` conforme `SPHERE_PRICE`).
- **Temporada, Passe (30 Níveis), Login 7 Dias, Eventos & Diárias:** reaproveita [systems.js](../confusion/web/systems.js) e [core.js](../confusion/web/core.js); inclui **3 trocas (reroll) diárias**, botão `Ir caçar`, `Coletar Todos do Passe` e timer de Raid a cada 2h.
- **Vote & Ganhe:** portais `TopIdle` (12h) e `IdleRank` (24h) + loja de `Vote Cash` (Esferas Raras, Diamantes, Ovo Solarin).
- **Recompensa Offline (AFK):** calcula automaticamente ganhos fora do jogo até **12h** (abates, XP, Gold, Ovos e colheita da Fazenda) + botão `⏱️ Testar 2h Offline` em Configurações.
- **Extras de UX:** Tutorial guiado curto (6 passos, pulável), idiomas **`PT / EN / ES`**, escala de HUD, limite `30/60 FPS`, toggle de dano flutuante, Mini-Log recolhível (`Farm / Logs`), Exportar Save JSON e `manifest.webmanifest` para **PWA (Instalar como App)**.

### F. Campanha & Progressão da Região 1 ([regiao1-estado.js](../confusion/web/teste-quarteirao/regiao1-estado.js) & [regiao1-entidades.js](../confusion/web/teste-quarteirao/regiao1-entidades.js))
- **29 missões** organizadas por ramo (Campanha Central, Floresta Sombria, Floresta de Cogumelos, Praias Cristalinas, Caverna Cintilante, 5 Teleportes e 2 Secundárias: Fazenda e Entrega).
- **14 NPCs**, **35 pistas no mundo**, **206 monstros selvagens** e **4 Chefes de Arena** (`BOSS_E`, `BOSS_D`, `BOSS_S`, `BOSS_C`).
- **Regra 5+1 Teleportes:** `C1` só desbloqueia missão após descobrir `E8` ou `D9`; menu de teleporte só lista outros marcos ativos.
- **Regra do Trem (`C3 → REINO`):** desbloqueia após vencer `BOSS_E` + `BOSS_D` em qualquer ordem (`BOSS_S` e `BOSS_C` são independentes).
- **Save automático** em `localStorage` (`psyworld_regiao1_save_v1`) com compatibilidade retroativa.

### G. Qualidade & Testes Automatizados (16/16 Passando)
- `node --test confusion/web/teste-quarteirao/regiao1-idle.test.mjs confusion/web/teste-quarteirao/regiao1-estado.test.mjs confusion/web/explorar3d/colisao.test.mjs` → **16 passed, 0 failed**.

---

## 3. O que É Provisório & O que Ainda Falta Fazer (Backlog Priorizado)

### Prioridade 1 — Artes Provisórias & Identidade Visual
1. **14 NPCs da Região 1** (`arteProvisoria: true` em [regiao1-entidades.js](../confusion/web/teste-quarteirao/regiao1-entidades.js)): substituir sprites provisórios por artes oficiais (humanos, elfos, goblins).
2. **4 Chefes de Arena (`BOSS_E`, `BOSS_D`, `BOSS_S`, `BOSS_C`):** adicionar sprites exclusivos dos chefes.
3. **Mapa `REINO` e `C1-ativo.webp`:** substituir o placeholder jogável do `REINO` pela arte oficial da Região 2 e gerar `C1-ativo.webp` definitivo.
4. **Protagonista Herói & novos Oníricos:** sprites 4-direções do protagonista da perspectiva Herói e sprites dedicados para mais espécies além de Noctarn/Vaelith/Brotavel/Ignavor/Solarin.

### Prioridade 2 — Profundidade Idle & Campanha Entrelaçada
1. **Gestão da Equipe de Oníricos (até 6 slots):** trocar o Onírico ativo no mapa (mudando forma da Conexão Onírica, elemento e habilidades), evoluir nível/raridade/fusão dos monstros capturados e usar ovos chocados na equipe.
2. **Campanha do Herói (Perspectiva Luz):** criar a trilha de diálogos/missões paralelas do Herói dentro da mesma Região 1 e conta unificada (hoje o seletor `Herói / Vilão` já existe em Configurações e altera a identidade no HUD, mas as 29 quests ainda usam o roteiro base de Azazel).
3. **Fazenda Interativa:** transformar o botão `🌱 Fazenda` em painel funcional para alocar Oníricos coletando ingredientes, gerando recursos e craftando consumíveis/relíquias.
4. **Raids Jogáveis (2h) & Áreas de Evento:** abrir a arena da Raid quando o timer de 2h estiver ativo com chefe especial, barra de dano acumulado e recompensas exclusivas.
5. **Áudio & Juice:** trilha ambiente por bioma, SFX de golpe/crítico/level-up/captura/teleporte e partículas/VFX de ataque no mapa 2D.
6. **Batalha de Chefe também suportar Auto-Skill / Turno Automático opcional** para alinhar 100% com o público Idle.

### Prioridade 3 — Produção Web, Backend & Monetização/Comunidade (Fora da Vercel)
1. **Hospedagem definitiva recomendada:** **Cloudflare Pages** (grátis, CDN global, domínio `.com` ~R$ 55–70/ano) + **Supabase** (plano gratuito até ~50k MAU para login, Cloud Save sincronizado entre celular e PC, ranking global e anti-cheat básico).
2. **Vote & Ganhe Real:** conectar o callback/postback server-side real de `TopIdle` / `IdleRank` (atualmente o registro de voto e cooldown é local no navegador).
3. **Social / MMO-Lite:** Chat global real, Ranking de Poder/Nível/Codex, Guildas e Mercado de jogadores (se desejado no roadmap futuro).
4. **Região 2 (`REINO` em diante):** expandir mapas, biomas, chefes e missões pós-trem.

---

## 4. Mapa Rápido de Arquivos-Chave

| Arquivo | Função |
|---|---|
| [regiao1.html](../confusion/web/teste-quarteirao/regiao1.html) | Página principal jogável, HUD compacto, minimapa e todos os modais Idle + Campanha |
| [regiao1.js](../confusion/web/teste-quarteirao/regiao1.js) | Motor Three.js 2D/isométrico, SDF, pathfinding BFS, Auto-Rota, Auto-Caça em tempo real, câmera e batalhas |
| [regiao1-idle.js](../confusion/web/teste-quarteirao/regiao1-idle.js) | Lógica pura Idle: Domador +3 pts/nível, Codex, Relíquias, Esferas, Ovos, AFK offline, Diárias, Passe, Login 7d, Vote & Ganhe |
| [regiao1-ui-idle.js](../confusion/web/teste-quarteirao/regiao1-ui-idle.js) | Controlador de UI dos modais Idle, HUD, minimapa, flutuantes, PWA e tutorial |
| [regiao1-mapas.js](../confusion/web/teste-quarteirao/regiao1-mapas.js) | Definição das 48 áreas, saídas bidirecionais, marcos de teleporte e caminhos de arte/walkmask |
| [regiao1-estado.js](../confusion/web/teste-quarteirao/regiao1-estado.js) | Máquina de estado das 29 quests, pistas retroativas, regras 5+1 teleporte, trem e save |
| [regiao1-entidades.js](../confusion/web/teste-quarteirao/regiao1-entidades.js) | 14 NPCs, 35 pistas, 206 monstros selvagens e 4 Chefes |
| [core.js](../confusion/web/core.js) / [systems.js](../confusion/web/systems.js) / [species.js](../confusion/web/species.js) | Núcleo compartilhado de XP, sanidade, elementos, passe de 30 níveis, login 7d, eventos, raids e espécies |
| [regiao1-idle.test.mjs](../confusion/web/teste-quarteirao/regiao1-idle.test.mjs) / [regiao1-estado.test.mjs](../confusion/web/teste-quarteirao/regiao1-estado.test.mjs) | Suíte de 16 testes unitários automatizados |

---

## 5. Prompt Mestre de Continuação (Copie e Cole em Novas Sessões)

```text
Você está continuando o desenvolvimento do jogo web **PSYWORLD · Confusion Waves: Double Perspective** no repositório `dioh-cpu/psyworld`.

### Regras Permanentes (Obrigatórias)
1. Branch de trabalho: `feature/praia-colisao-azazel-vilao-v1` (base atual: commit `f7e4dc2`). NUNCA modifique `main` sem autorização explícita.
2. Direção criativa: IP 100% original, estética Dark Fantasy. **Idle é o foco principal** e a **Campanha (`Herói × Vilão`) é um modo alternativo entrelaçado** — ambos compartilham a mesma conta, Gold, Diamantes, Oníricos, Esferas, Ovos, Relíquias, Codex, Passe de Temporada, Nível do Domador e Save.
3. Eficiência de tokens: respostas diretas e objetivas em português do Brasil; evite leituras ou testes redundantes. Reaproveite sempre os módulos existentes (`confusion/web/core.js`, `systems.js`, `species.js`).
4. Regra de UX Idle: abrir qualquer menu de UI NUNCA deve pausar ou cancelar Auto-Caça ou Auto-Rota (apenas batalha de Chefe pausa o movimento).

### Estado Atual Já Implementado e Funcionando (`f7e4dc2`)
- Entrada principal: `confusion/web/teste-quarteirao/regiao1.html`
- **48 áreas da Região 1** (`regiao1-mapas.js`) com artes 2K WebP, 48 walkmasks auditadas por BFS, colisão SDF (`colisao.js`), pathfinding `128×71` e câmera calibrada Paisagem/Retrato.
- **Azazel & Noctarn** (`azazel.js`, `noctarn.js`) com clique para andar, velocidade base `8.7 u/s`, `✨ Transformar` (Conexão Onírica = `+100%` speed), **Auto-Rota 100% automática** entre mapas/pistas/NPCs/marcos e **Auto-Caça em tempo real no mapa 2D** contra **206 monstros selvagens** (com dano flutuante, auto-captura, ovos e respawn 5s).
- **Nível do Domador (+3 Pontos de Atributo por nível):** XP unificado (Campanha + Idle + AFK), atributos `FOR / VIT / MEN / VIN / SOR` com distribuição e reset na tela Domador/Mochila, barra de XP e badge `+N pts` no HUD, aplicados na Auto-Caça e em Batalhas de Chefe.
- **Suíte Idle completa** (`regiao1-idle.js`, `regiao1-ui-idle.js`): HUD compacto, minimapa circular, Menu unificado (`HUD Clean`, `Economia de Energia`), Atlas de Caça (48 áreas com selo de risco), Config Auto-Caça, Codex Onírico (bônus permanentes), Mochila/Relíquias/Ovos/Esferas/Status Explicáveis, Temporada/Passe 30 níveis, Login 7d, Missões Diárias com Reroll, Raid timer 2h, Vote & Ganhe (TopIdle/IdleRank), Recompensa Offline AFK (até 12h + Fazenda), Tutorial 6 passos, i18n PT/EN/ES, Exportar Save JSON e PWA (`manifest.webmanifest`).
- **Campanha Região 1** (`regiao1-estado.js`, `regiao1-entidades.js`): 29 quests, 14 NPCs, 35 pistas, 4 Chefes (`BOSS_E`, `BOSS_D`, `BOSS_S`, `BOSS_C`), regra 5+1 teleportes (`C1` liberado por `E8` ou `D9`) e Trem (`C3 → REINO`) após `BOSS_E + BOSS_D` em qualquer ordem.
- **Testes:** `node --test confusion/web/teste-quarteirao/regiao1-idle.test.mjs confusion/web/teste-quarteirao/regiao1-estado.test.mjs confusion/web/explorar3d/colisao.test.mjs` (16/16 passando).

### O que Ainda Está Pendente / Provisório
- Artes finais: 14 NPCs (`arteProvisoria: true`), sprites dos 4 Chefes, arte final de `REINO`, `C1-ativo.webp`, protagonista Herói e mais espécies de Oníricos.
- Gameplay: Gestão de Equipe (trocar/evoluir/fundir Oníricos capturados e chocados), Fazenda interativa, Campanha narrativa do Herói (Luz), Raid jogável a cada 2h, áudio/SFX/VFX, Auto-Batalha opcional em Chefes e Região 2+.
- Online/Produção: Hospedagem Cloudflare Pages + backend Supabase (Auth, Cloud Save, Ranking, postback real de TopIdle/IdleRank).

### Próxima Tarefa
[DESCREVA AQUI O QUE VOCÊ QUER IMPLEMENTAR AGORA]
```
