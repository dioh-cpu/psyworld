# Confusion Waves — divisão de trabalho entre agentes

Repositório: `dioh-cpu/psyworld` · Produção: https://psyworld-murex.vercel.app/jogar (deploy automático da `main`).
Código do jogo: `confusion/web/teste-quarteirao/` · Artes: `assets/confusion/interface/` · Testes: `npm test` (323 passando).

| Agente | Responsabilidade | Branch | Arquivos que só ele edita |
|---|---|---|---|
| Claude | VFX das habilidades e dos efeitos de status | `claude/psyworld-login-video-bg-tcrqd2` | `regiao1-vfx.js`, `regiao1-batalha-fx.js`, CSS/animação de `regiao1-batalha-tela.js` |
| GPT (Codex) | Artes | `codex/artes` | `assets/**` (só adiciona arquivos; não renomeia os existentes) |
| Antigravity | Sistemas | `antigravity/sistemas` | todo o resto do código e dos testes |

Regras comuns: interface em português; ids de habilidades, espécies e locais nunca mudam (o VFX e as artes dependem deles); nada de segredos no repositório; cada um abre PR para a `main` e não força push em branch alheia.

## Contrato de revelação e animação (Claude → Antigravity)

O Claude é dono de `regiao1-revelacao.js`, `regiao1-conexao-fx.js`, `regiao1-sfx.js` e `regiao1-vfx-motor.js`. O sistema entrega o resultado já gravado; a animação só apresenta.

- **Invocação**: `revelarInvocacao({ edicao, titulo, cartas, revelados, aoRevelar })` devolve uma Promise que resolve ao fechar com `{ revelados }`.
  - `edicao`: `'halloween' | 'dinossauros' | 'adventurer' | 'elementais' | 'dragoes' | 'padrao'`.
  - `cartas`: `[{ especie, nome?, tier: 1–5, arte, elemento?, lado?: 'luz'|'sombra' (Dragões), extra?: { nome, arte } (Adventurer) }]`.
  - Para reabrir o painel no mesmo ponto, passe `revelados` (booleans) e grave o que `aoRevelar(i)` avisar.
- **Ovo do Passe**: `revelarOvo({ edicao, recompensa, nivel, aberto, aoRevelar })`. O ovo T5 do nível 100 recebe a apresentação máxima. Use `aberto: true` para mostrar direto, já chocado.
- **Recompensas comuns do Passe**: `mostrarRecompensas([{ nome, icone|arte, qtd }])`, rápida e sem bloquear a tela.
- **Conexão Onírica**: `tocarConexao({ ponto, para: 'montaria'|'domador', montaria, aoTrocar })`. A troca de sprite acontece dentro de `aoTrocar`, no auge do efeito. Nova montaria = nova entrada em `CONEXAO` (cor, cor2, partícula). Clipes e prompts do Flow em `confusion/FLOW_MONTARIAS.md`.
- **Preferências** (`regiao1-sfx.js`): `pref.volume`, `pref.reduzir` (segue o sistema por padrão) e `pref.pular`.
- **Manto Violeta**: `FX_HABILIDADES.manto_violeta` já está cadastrado e lê `MORTALIO_VIOLETA_CFG` quando ele existir. O clipe toca se `clip` carregar; senão, entra a coreografia violeta procedural. O impacto aplica os quatro efeitos no `impactoMs`. Para alvo `'aliados'`, o clipe ancora no centro dos alvos.

---

## Expansão 1 — divisão atual (12 regiões, Reinos 03–12 e sistemas 01–10)

asutaroto291 está indisponível: catálogo e saves passam para o Antigravity; kits, chefes e equilíbrio de combate, para o Claude.

**Estado de partida:** Região 1 jogável (Praia e C1); faixas de nível das 12 regiões em `REGIOES` (`regiao1-progressao.js`). Reinos 1 e 2 jogáveis no modo Estratégia; artes dos Reinos 03–12 entregues (cidade, chefe, Oníricos), Reino 04 só com a cidade. Sistemas 01–10 com regras prontas em Menu → Mundo e artes prontas, ainda como polígonos no mapa.

| Agente | Entregas |
|---|---|
| **Antigravity** (integração, interfaces, catálogo e saves) | 1. Catálogo das 12 regiões (id, nome, faixa, desbloqueio pelo chefe anterior, recompensa de primeira vitória paga uma vez, encontros), em `*-regras.js` com testes. 2. Regiões 2–12 jogáveis (mapa, portal, missões, encontros, chefe), começando pela Região 2 ligada ao Reino 2. 3. Reinos 03–12 no modo Estratégia, no molde de `regiao1-estrategia-r2.js`, com as cadeias do `REINOS.md`; espécie, elemento e classe vêm de `LINHAGENS_REINOS` (`regiao1-kits-reinos.js`). 4. Sistemas 01–10 ligados ao mapa e à campanha, com as artes de `interface/mundo/` e sem recompensa duplicada. 5. Seletor de reinos e regiões com cadeado e progresso. 6. Todo campo novo na lista branca de `desserializarEstado`; save antigo carrega sem perdas, inclusive pela nuvem. |
| **Claude** (combate, VFX, animação e montaria) | 1. Kits das 50 linhagens dos Reinos 03–12 (**feito**: `regiao1-kits-reinos.js` + `KITS_REINOS`/`kitDe`). 2. Chefes regionais e dos reinos (**kit, atributos e fúria feitos**: `CHEFES_REINOS`/`specChefeReino`; falta VFX de entrada e derrota e clipes do Flow dos golpes especiais). 3. Equilíbrio de combate por faixa das 12 regiões. 4. VFX em vídeo das 24 habilidades que faltam e VFX por elemento para os kits novos. 5. Azazel montado no Brumacervo (4 direções, repouso e caminhada) quando chegarem os vídeos novos. 6. Poses de ataque das linhagens novas. |
| **GPT / Codex** (artes) | 1. Mapas jogáveis, arenas e chefes das Regiões 2–12. 2. Reino 04: chefe, arena e as 5 linhagens. 3. Poses de ataque (`ataque-0N.png`) das linhagens dos Reinos 03–12. 4. Pendências do Prompt 2 (molduras do banner, bustos de Herói × Vilão, Crise), se faltarem. |

**Ordem:** Região 2 de ponta a ponta (com Reino 2 e sistemas 01–10) como molde → Regiões e Reinos 3–6 → 7–12 → equilíbrio, VFX dos chefes e testes de save.

**Contrato de kits (Claude → Antigravity):** `LINHAGENS_REINOS` traz `{ reino, nome, elemento, classe, habilidades }` das 50 linhagens; `kitDe(nome)` já devolve o kit e `PAPEL_PADRAO` já tem o papel da classe. Ids das habilidades = slug do nome e não mudam. Formas base/final de cada linhagem entram em `LINHA_DO_KIT` quando o catálogo der nome a elas. O Antigravity não edita `regiao1-batalha-habilidades.js` nem `regiao1-kits-reinos.js`; para mudar kit, chefe ou elemento, pede ao Claude.

**Contrato de chefes (Claude → Antigravity):** chefe da Região N = chefe do Reino N (`CHEFES_REINOS` em `regiao1-kits-reinos.js`). Para a batalha, use `specChefeReino(reino, nivel)` como tupla de inimigo (mesmo formato de `{ chefe: true, nome, bonus }` já usado na campanha); a arte vem de `reinos/NN/chefe.(png|webp)`. Kit, fúria (abaixo de 50% da vida, uma vez por batalha) e o VFX da fúria já ficam ligados pelo nome.

**Regras comuns:** um PR por entrega, merge só depois da checagem em celular (844×390) e desktop com `npm test` verde; ids de espécies, habilidades e locais nunca mudam.

## Prompt 1 — Claude (VFX das habilidades)

Você cuida só do VFX de batalha do Confusion Waves (`confusion/web/teste-quarteirao/`).

Base existente: `regiao1-vfx.js` (`FX_HABILIDADES` por id de habilidade, com `estilo`, `camera`, `clip`, `impactoMs`; quatro momentos preparação → execução → impacto → dissipação; impacto por elemento em `ELEM`), disparado por `tocarEvento` a partir de `b.evento` do motor (`regiao1-estrategia-regras.js`). Só Noctarn tem estilo próprio (mordida, chama, véu).

Entregar:
1. Estilo próprio para cada habilidade escrita à mão em `KITS` (`regiao1-batalha-habilidades.js`): Noctarn, Ignavor, Vaelith, Brotavel, Solarin (todas as formas da linha usam o kit), Abobrisco, Velalume, Mortálio, Vitrarco e Abyssar (Facada, Perseguição com golpes em alvos aleatórios e reinício, Hora do Terror).
2. Estilos genéricos por arquétipo e elemento para os kits gerados por `kitDe` (golpe único, área, cura, apoio, provocação), para que nenhuma habilidade fique sem VFX.
3. VFX de efeitos de status no início do turno e na aplicação: queimadura, veneno, sangramento, congelamento, atordoamento, silêncio, escudo, regeneração, defesa/ataque alto e baixo, provocação, invencível, veloz, pânico; e de purificação, cura, ressurreição e roubo de vida.
4. Câmera: zoom e tremor proporcionais ao peso; T5 e chefes com impacto maior; celular com menos partículas e sem desfoque; modo rápido (`rapido`) encurta tudo.
5. Gancho `clip` pronto para clipes do Flow e para as folhas de sprite que o GPT entregar em `assets/confusion/interface/vfx/` (usar se existirem; sem elas, VFX procedural).
6. Validar no navegador (Playwright, paisagem 844×390 e desktop), sem quebrar `npm test`; publicar na `main`.

## Prompt 2 — GPT / Codex (artes)

Você produz as artes que faltam no Confusion Waves. Estilo: o mesmo das artes atuais (anime HD, vista 3/4, pintura limpa, cores saturadas de outono), sem texto nem logotipos dentro das imagens. Cenários em `.webp` (qualidade ~85); personagens, ícones e molduras em `.png` com fundo transparente e margem para caudas, asas e chifres. Personagens virados para a DIREITA (o jogo espelha os inimigos). Arenas de batalha 1920×1080, horizontais, sem personagens, com chão livre nos 45% de baixo para uma formação 4×4. Commit na branch `codex/artes`, listando no commit o caminho de cada arquivo. Não renomeie nem apague artes existentes.

Prioridade 1 (sistemas já prontos esperando arte):
1. Calabouço “Ruínas Rastejantes” — pasta `assets/confusion/interface/expansao1/calabouco/`:
   - `fundo.webp` 1920×1080 (entrada do calabouço, ruínas sob a floresta, raízes e pedra rachada).
   - Arenas `arena-corredor.webp` (Corredor de raízes), `arena-galeria.webp` (Galeria rachada), `arena-coracao.webp` (Coração das ruínas, sala do chefe).
   - Cartas de sala 512×512: `sala-luta.webp`, `sala-corrompida.webp` (névoa roxa, sussurros), `sala-chefe.webp`, `sala-tesouro.webp`.
   - Chefe `chefe.png` (coração vivo de raízes e pedra, porte grande).
2. Herói × Vilão, Capítulo 1 — `assets/confusion/interface/expansao1/hv/`:
   - Bustos para diálogo 768×1024 transparentes: `heroi.png`, `mira.png` (aliada, batedora do cabo), `maregor.png` (vilão do elmo quebrado), `general-das-cinzas.png`.
   - `capa-cap1.webp` 1600×900 (Cabo Âmbar, farol e o elmo).
3. Reino 2 “Altos do Âmbar” com 30 terrenos — `assets/confusion/interface/estrategia/reinos/02/`:
   - `cidade-expansao-30.webp` 2400×1600, mesmo padrão do `cidade-expansao-30.webp` do Reino 1: terraços floridos ao redor de uma praça hexagonal, 30 lotes vazios bem separados, lotes de produção (apiários) distintos dos urbanos.
   - `cidade-expansao-30-guia.webp`: a mesma imagem com os números 1–30 nos lotes.
   - Acrescente em `reinos/REINOS.md` a tabela dos centros dos 30 lotes em porcentagem (x, y).
4. Ícones de itens novos 256×256 transparentes em `assets/confusion/interface/expansao1/itens/`: `torta.webp` (torta de mel), `elixir.webp` (elixir de foco, poção de XP), `tonico-concentrado.webp`, `contrato.webp` (pergaminho da Guilda).

Prioridade 2:
5. Crise da Vila do Norte — `assets/confusion/interface/expansao1/crise/`: `vila-saudavel.webp`, `vila-contaminada.webp`, `vila-tomada.webp`, `vila-purificada.webp`, `vila-reconstruida.webp`, 1920×1080, o MESMO enquadramento nos cinco estados (só muda o estado da vila).
6. Molduras do banner por raridade — `assets/confusion/interface/banner/moldura-1.png` … `moldura-5.png`, 512×640 (cinza, verde, azul, roxo, dourado animável).
7. Poses de ataque (usadas pelo VFX): forma final das cinco linhas iniciais em `assets/confusion/interface/estrategia/reinos/existentes/<linha>/ataque-03.png` (noctarn, ignavor, vaelith, brotavel, solarin) e das cinco linhas de Halloween em `assets/confusion/interface/eventos/halloween/oniricos/<slug>/ataque-03.png` (abobrisco, velalume, mortalio, vitrarco, abyssar). Mesma escala e enquadramento da arte `03.png` correspondente.
8. Folhas de VFX para o Claude — `assets/confusion/interface/vfx/<nome>.png`, 1024×1024, grade 4×4 (16 quadros), fundo transparente, brilho aditivo: `corte`, `mordida`, `chama`, `explosao-fogo`, `respingo-agua`, `gelo`, `raizes`, `esporos`, `raio-solar`, `aura-luz`, `veu-sombrio`, `panico` (rostos de medo estilizados), `sangramento` (estilizado, não realista), `veneno`, `escudo-hex`, `ressurreicao` (pilar de luz e penas), `invencivel` (redoma dourada).

Prioridade 3:
9. Reinos 05–12 conforme `reinos/REINOS.md`: para cada reino `cidade-conceito.webp`, `arena-chefe.webp`, `chefe.png` e as cinco linhagens em `<reino>/oniricos/<linhagem>/01.png`, `02.png`, `03.png` (base, intermediária, final, posturas diferentes).

## Prompt 3 — Antigravity (sistemas)

Você implementa os sistemas que faltam no Confusion Waves. Código em `confusion/web/teste-quarteirao/` (módulos ES, sem build), testes em `*.test.mjs` com `node:test` (`npm test`, hoje 323 passando). Trabalhe na branch `antigravity/sistemas` a partir da `main` e abra PR para a `main`.

Regras:
- Não edite `regiao1-vfx.js`, `regiao1-batalha-fx.js` nem o CSS/animação de `regiao1-batalha-tela.js` (VFX é do Claude). Não mude ids de habilidades, espécies ou locais.
- Save: todo campo novo precisa entrar no desserializador com lista branca (`desserializarEstado` em `regiao1-estado.js`), senão some ao recarregar. O save na nuvem passa por `/api/confusion-save` (≤512 KB, profundidade ≤12, arrays ≤2000, strings ≤2000, ≤500 chaves por objeto).
- Toda recompensa é paga uma única vez (marcadores no save), inclusive recarregando a página.
- Regras puras em `*-regras.js` com testes; interface separada. Teste no Chromium em paisagem (844×390) e desktop.
- Arte ainda não entregue: use o caminho final previsto (lista do GPT) com fallback para a arte atual.

Tarefas:
1. XP da Campanha para a formação: em `regiao1.js` (`encerrarBatalha`), dar XP aos membros de `membrosFormacao(save.idle)` com `aplicarXp` (`regiao1-progressao.js`), como já faz a Torre em `regiao1-halloween.js` (vitória inteira, derrota 30%, chefe ×2).
2. Calabouço jogado na arena: hoje `avancarSala` (`regiao1-exp-regras.js`) resolve as salas `luta` e `chefe` sozinha com `poderLuta`. Separe em “preparar luta” (inimigos por nível da sala, chefe com `{ chefe: true, bonus }`) e “resolver luta” (vitória soma ganhos; derrota encerra com metade). Na interface (`regiao1-expansao.js`, aba Calabouço) abra `tela.abrir` como o Herói × Vilão (~linha 231), com as arenas de `expansao1/calabouco/`. A Ração reforçada (`CALABOUCO.racao`) recupera 40% da vida da equipe entre salas; a vida persiste entre salas da mesma descida.
3. Contratos diários da Guilda: depois do contrato `g3`, três contratos por dia sorteados de forma determinística pela data local, renovando à meia-noite; pedem materiais da Fazenda e itens da Oficina (inclusive os novos); pagam ouro, diamantes e Tickets; cada um pago uma vez por dia. Interface na aba Contratos.
4. Profissões com benefício: nível = `floor(sqrt(xp/5)) + 1`. Cada nível acima de 1 reduz 5% do tempo da receita da profissão (máx. 40%); a cada 3 níveis, +1 unidade por lote. Gravar `seg` e `extra` no lote ao enfileirar (`regiao1-gestao-regras.js`) para não alterar lotes em andamento. Mover o ganho de XP de profissão da interface (`regiao1-expansao.js` ~linha 343) para as regras. Receitas novas com `nivelMin`: Torta de Mel (cozinha nv.2; ovos, mel, leite; pedida em contratos), Elixir de Foco (alquimia nv.3; cristal, mel → `pocao_xp_p`, vai para a mochila de Halloween como já ocorre com a Oficina dos Reinos), Tônico Concentrado (alquimia nv.5; restaura 60 de Sanidade).
5. Reino 2 com 30 terrenos: em `regiao1-estrategia-r2.js`, os `locais` passam a usar o mapa `reinos/02/cidade-expansao-30.webp` e as coordenadas que o GPT documentar em `REINOS.md`, preservando os ids atuais dos terrenos; fallback para o mapa atual enquanto a arte não chega.
6. Herói × Vilão: mostrar os bustos (`expansao1/hv/*.png`) no diálogo, conforme quem fala, e a capa do capítulo no seletor.
7. Crise: trocar as artes emprestadas pelas da pasta `expansao1/crise/` com fallback.
8. Banner: resultados com a moldura da raridade (`interface/banner/moldura-N.png`).
9. Antes do PR: `npm test` verde, testes novos para 2, 3 e 4, e um save antigo carregando sem perder nada.

---

## Coordenação Antigravity ↔ Claude — Habilidade Rara Violeta do Mortálio (`manto_violeta`)

Preparada em `confusion/web/teste-quarteirao/regiao1-batalha-habilidades.js` sem tocar em `regiao1-vfx.js`:
- **Constante / fábrica exportadas**: `MORTALIO_VIOLETA_CFG`, `habilidadeVioletaMortalio(opcoes)` e `kitMortalio(opcoes)` (também pendurada em `KITS['Mortálio'].preparadaVioleta`).
- **ID estável da habilidade**: `'manto_violeta'` (`tipo: 'apoio'`, `raridade: 'rara'`, `elemento: 'fantasma'`).
- **Quatro efeitos aplicados por 3 turnos completos** (em aliado, grupo ou si mesmo): `regeneracao`, `veloz`, `defesa_alta` e `escudo` (`escudoTurnos: 3`).
- **Em aberto para fechamento antes de ativar no kit**: `MORTALIO_VIOLETA_CFG.alvo` (`'si' | 'aliado' | 'aliados'`), valores (`escudo`, `cura`, `cd`) e `MORTALIO_VIOLETA_CFG.vagaKit` (`null` por enquanto; `0`, `1` ou `2` ativa na vaga correspondente).
- **Ligação em `regiao1-vfx.js` (Claude)**:
  1. Importar `MORTALIO_VIOLETA_CFG` de `./regiao1-batalha-habilidades.js`.
  2. Cadastrar `FX_HABILIDADES[MORTALIO_VIOLETA_CFG.id] = { fx: 'mantoVioleta', ms: 900, clip: MORTALIO_VIOLETA_CFG.clip, impactoMs: MORTALIO_VIOLETA_CFG.impactoMs, cut: ['#5b21b6', '#ddd6fe'] }` com fallback procedural violeta caso o `.mp4` ainda não esteja publicado.
  3. Em `tocarClipe` (`regiao1-vfx.js`), caso `MORTALIO_VIOLETA_CFG.alvo` seja definido como `'aliados'`, ancorar o clipe no centro da formação aliada (ou iterar `ev.alvos`) além de `ctx.no(ev.alvo)`.

