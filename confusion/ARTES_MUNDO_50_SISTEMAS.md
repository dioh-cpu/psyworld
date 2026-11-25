# Artes dos 50 sistemas do mundo

**Total: 317 artes** (50 icone, 50 banner, 63 sprite, 66 cena, 78 marcador, 10 retrato). Prontas: 0.

Cada sistema tem um menu próprio no jogo (Menu → Mundo). Cada vaga abaixo já existe no menu como um polígono; **para colocar a arte, salve o arquivo com o nome exato na pasta indicada, em WebP**, e ela aparece sozinha, sem mexer em código.

## Onde aparece
- **No mapa (protótipo de polígono hoje):** 01, 05, 08, 13, 15, 17, 18, 19, 23, 25, 29, 30, 35, 36, 46, 47, 48. As vagas de sprite e marcador desses sistemas aparecem no mundo, nos mapas indicados no jogo, no tamanho do mapa; troque o polígono só salvando o arquivo.
- **Só no menu:** os outros 33 sistemas. As artes deles aparecem nas vagas do menu do sistema.

## Conferir as entregas
`python3 tools/validar_artes_mundo.py` confere nome, formato WebP, tamanho, proporção, fundo transparente e peso de cada arquivo em `assets/confusion/interface/mundo/`, avisa o nome certo quando o arquivo foi salvo errado e mostra o que falta. `--folha arquivo.png` gera uma folha de contato; `--sistema 05` confere só um sistema.

## Estilo para todas
- Tema Halloween do jogo: roxo escuro, laranja de abóbora, dourado, contorno forte e pintura digital limpa.
- Mesmo estilo dos NPCs e retratos já feitos. Nada de texto dentro da imagem.
- Fundo transparente onde a tabela diz "transparente"; senão a cena inteira.
- Retratos: três versões por personagem (`-neutro`, `-serio`, `-sorriso`) só se a tabela pedir; por padrão, um único retrato neutro.

## Formatos

| Tipo | Tamanho | Fundo | Observação |
|---|---|---|---|
| icone | 256×256 | transparente | Lê bem em 64 px, estilo Halloween, contorno forte. |
| banner | 1600×500 | cena completa | Topo do menu; deixar o lado esquerdo mais calmo para o título. |
| sprite | 512×512 | transparente | Objeto ou criatura de corpo inteiro, mesmo estilo dos NPCs, sem sombra no chão. |
| retrato | 1024×1024 | cena | Meio busto, mesmo estilo dos retratos de diálogo (neutro, sério, sorriso). |
| cena | 1920×1080 | cena completa | Fundo de tela cheia em paisagem, sem texto. |
| marcador | 128×128 | transparente | Selo, estado ou recurso; legível em 32 px. |

## 01 · Cidades vivas 🏘️
Pasta: `assets/confusion/interface/mundo/01/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `vila-saudavel.webp` | sprite | 512×512 | Vila saudável: Vila pequena viva, luzes acesas e abóboras nas janelas. | não |
| `vila-corrompida.webp` | sprite | 512×512 | Vila corrompida: A mesma vila tomada por névoa roxa e raízes escuras. | não |
| `vila-ruinas.webp` | sprite | 512×512 | Vila em ruínas: A mesma vila destruída, para quando a população zera. | não |
| `reconstruir.webp` | cena | 1920×1080 | Reconstruindo: Andaimes e NPCs carregando madeira. | não |

## 02 · Ecossistema de monstros 🐺
Pasta: `assets/confusion/interface/mundo/02/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `predador.webp` | sprite | 512×512 | Predador dominante: Silhueta de monstro predador rondando. | não |
| `presa.webp` | sprite | 512×512 | Presa abundante: Grupo pequeno de monstros herbívoros. | não |
| `proteger.webp` | marcador | 128×128 | Área protegida: Cerca/runa de proteção ao redor de um ninho. | não |
| `cacada.webp` | cena | 1920×1080 | Caçada: Cena de caçada entre monstros. | não |

## 03 · Facções 🏳️
Pasta: `assets/confusion/interface/mundo/03/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `guardioes.webp` | marcador | 128×128 | Guardiões da Luz: Brasão e bandeira da facção de luz. | não |
| `culto.webp` | marcador | 128×128 | Culto das Sombras: Brasão e bandeira do culto. | não |
| `guilda.webp` | marcador | 128×128 | Guilda do Porto: Brasão e bandeira da guilda comercial. | não |
| `lider-guardioes.webp` | retrato | 1024×1024 | Líder dos Guardiões: Retrato do líder da facção de luz. | não |
| `lider-culto.webp` | retrato | 1024×1024 | Líder do Culto: Retrato do líder do culto. | não |
| `lider-guilda.webp` | retrato | 1024×1024 | Líder da Guilda: Retrato do líder da guilda. | não |

## 04 · NPCs com memória e rotina 💬
Pasta: `assets/confusion/interface/mundo/04/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `ana.webp` | retrato | 1024×1024 | Ana, ferreira: Retrato da ferreira (neutro, sério, sorriso). | não |
| `teo.webp` | retrato | 1024×1024 | Teo, curandeiro: Retrato do curandeiro. | não |
| `lia.webp` | retrato | 1024×1024 | Lia, cartógrafa: Retrato da cartógrafa. | não |
| `rotina-manha.webp` | cena | 1920×1080 | Rotina: manhã: Cena de rotina de manhã. | não |
| `rotina-noite.webp` | cena | 1920×1080 | Rotina: noite: Cena de rotina à noite. | não |

## 05 · Refúgios e fortalezas 🏰
Pasta: `assets/confusion/interface/mundo/05/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `refugio.webp` | sprite | 512×512 | Refúgio: Cabana fortificada pequena. | não |
| `fortaleza.webp` | sprite | 512×512 | Fortaleza: Fortaleza com muralha e tochas. | não |
| `protecao.webp` | marcador | 128×128 | Escudo contra pragas: Cúpula de proteção translúcida. | não |

## 06 · Personalidade e vínculo dos monstros 🐾
Pasta: `assets/confusion/interface/mundo/06/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `vinculo-baixo.webp` | sprite | 512×512 | Vínculo baixo: Monstro desconfiado, de costas. | não |
| `vinculo-medio.webp` | sprite | 512×512 | Vínculo médio: Monstro curioso olhando para o jogador. | não |
| `vinculo-alto.webp` | sprite | 512×512 | Vínculo alto: Monstro feliz, encostado no jogador. | não |
| `cuidar.webp` | cena | 1920×1080 | Cuidando: Mão acariciando um monstro. | não |

## 07 · Clima, estações e fenômenos 🌦️
Pasta: `assets/confusion/interface/mundo/07/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `sol.webp` | marcador | 128×128 | Sol: Efeito de clima ensolarado. | não |
| `chuva.webp` | marcador | 128×128 | Chuva: Efeito de chuva. | não |
| `neblina.webp` | marcador | 128×128 | Neblina: Efeito de neblina roxa. | não |
| `tempestade.webp` | marcador | 128×128 | Tempestade: Efeito de raios e vento. | não |
| `primavera.webp` | marcador | 128×128 | Primavera: Moldura sazonal da primavera. | não |
| `verao.webp` | marcador | 128×128 | Verão: Moldura sazonal do verão. | não |
| `outono.webp` | marcador | 128×128 | Outono: Moldura sazonal do outono (folhas e abóboras). | não |
| `inverno.webp` | marcador | 128×128 | Inverno: Moldura sazonal do inverno. | não |

## 08 · Masmorras dinâmicas 🕳️
Pasta: `assets/confusion/interface/mundo/08/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `catacumba.webp` | cena | 1920×1080 | Catacumba Úmida: Entrada da catacumba. | não |
| `mina.webp` | cena | 1920×1080 | Mina Abandonada: Entrada da mina. | não |
| `templo.webp` | cena | 1920×1080 | Templo Submerso: Entrada do templo. | não |
| `purificar.webp` | cena | 1920×1080 | Purificação: Luz limpando a masmorra. | não |
| `perigo.webp` | marcador | 128×128 | Níveis de perigo: Três selos: baixo, médio, alto. | não |

## 09 · Investigação e mistérios 🔍
Pasta: `assets/confusion/interface/mundo/09/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `lupa.webp` | marcador | 128×128 | Lupa: Lupa dourada para pistas. | não |
| `quadro.webp` | cena | 1920×1080 | Quadro de pistas: Quadro com fios ligando pistas. | não |
| `pista-1.webp` | sprite | 512×512 | Pista 1: Objeto da primeira pista. | não |
| `pista-2.webp` | sprite | 512×512 | Pista 2: Objeto da segunda pista. | não |
| `pista-3.webp` | sprite | 512×512 | Pista 3: Objeto da terceira pista. | não |

## 10 · Economia regional e rotas ⚖️
Pasta: `assets/confusion/interface/mundo/10/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `madeira.webp` | marcador | 128×128 | Madeira: Recurso madeira. | não |
| `pedra.webp` | marcador | 128×128 | Pedra: Recurso pedra. | não |
| `cristal.webp` | marcador | 128×128 | Cristal: Recurso cristal. | não |
| `comida.webp` | marcador | 128×128 | Comida: Recurso comida. | não |
| `caravana.webp` | sprite | 512×512 | Caravana: Carroça de comércio. | não |
| `mercado.webp` | cena | 1920×1080 | Mercado: Cena de mercado regional. | não |

## 11 · Chefes persistentes 👑
Pasta: `assets/confusion/interface/mundo/11/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `guardiao-nevoa.webp` | sprite | 512×512 | Guardião da Névoa: Chefe, corpo inteiro. | não |
| `rainha-sombras.webp` | sprite | 512×512 | Rainha das Sombras: Chefe, corpo inteiro. | não |
| `espectro.webp` | sprite | 512×512 | Espectro: Terceiro chefe persistente, corpo inteiro. | não |
| `purificado.webp` | marcador | 128×128 | Chefe purificado: Selo de luz sobre o chefe. | não |
| `aprisionado.webp` | marcador | 128×128 | Chefe aprisionado: Selo de correntes. | não |
| `corrompido.webp` | marcador | 128×128 | Chefe corrompido: Selo de corrupção. | não |

## 12 · Herança de monstros 🥚
Pasta: `assets/confusion/interface/mundo/12/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `ninhada.webp` | sprite | 512×512 | Ninhada: Ninho com 3 ovos. | não |
| `ovo-comum.webp` | marcador | 128×128 | Ovo comum: Ovo simples. | não |
| `ovo-herdado.webp` | marcador | 128×128 | Ovo herdado: Ovo com marcas dos pais. | não |
| `arvore.webp` | cena | 1920×1080 | Árvore genealógica: Moldura de árvore com 3 gerações. | não |

## 13 · Civilizações subterrâneas 🕯️
Pasta: `assets/confusion/interface/mundo/13/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `entrada.webp` | cena | 1920×1080 | Entrada subterrânea: Passagem escura entre raízes. | não |
| `cidade-sub.webp` | cena | 1920×1080 | Cidade subterrânea: Cidade de cogumelos e cristais, vista de cima. | não |
| `habitante.webp` | sprite | 512×512 | Habitante subterrâneo: Criatura inteligente subterrânea. | não |
| `descer.webp` | cena | 1920×1080 | Descendo: Escadaria descendo. | não |

## 14 · Sonhos e pesadelos 🌙
Pasta: `assets/confusion/interface/mundo/14/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `sonho.webp` | cena | 1920×1080 | Cena de sonho: Paisagem onírica suave. | não |
| `pesadelo.webp` | cena | 1920×1080 | Cena de pesadelo: Paisagem de pesadelo, tons escuros. | não |
| `opcao.webp` | marcador | 128×128 | Moldura de opção: Nuvem de pensamento para a escolha. | não |
| `acerto.webp` | marcador | 128×128 | Estrela de acerto: Selo de sonho acertado. | não |

## 15 · Doenças e pragas ☣️
Pasta: `assets/confusion/interface/mundo/15/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `praga.webp` | cena | 1920×1080 | Praga: Nuvem de esporos esverdeada. | não |
| `doente.webp` | sprite | 512×512 | Monstro doente: Monstro adoecido. | não |
| `cura.webp` | marcador | 128×128 | Tratamento: Poção/curativo. | não |
| `nivel.webp` | marcador | 128×128 | Níveis da praga: Três selos de gravidade. | não |

## 16 · Espionagem e disfarces 🎭
Pasta: `assets/confusion/interface/mundo/16/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `mascara.webp` | marcador | 128×128 | Máscara: Máscara de disfarce. | não |
| `infiltracao.webp` | cena | 1920×1080 | Infiltração: Silhueta se esgueirando em uma cidade. | não |
| `suspeita.webp` | marcador | 128×128 | Medidor de suspeita: Olho que se abre. | não |
| `disfarce-1.webp` | sprite | 512×512 | Disfarce 1: Traje de disfarce 1. | não |
| `disfarce-2.webp` | sprite | 512×512 | Disfarce 2: Traje de disfarce 2. | não |

## 17 · Guardiões ancestrais 🗿
Pasta: `assets/confusion/interface/mundo/17/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `guardiao-norte.webp` | sprite | 512×512 | Guardião do Norte: Estátua viva guardiã, corpo inteiro. | não |
| `guardiao-sul.webp` | sprite | 512×512 | Guardião do Sul: Estátua viva guardiã, corpo inteiro. | não |
| `negociar.webp` | cena | 1920×1080 | Negociando: Cena de acordo com o guardião. | não |
| `desafiar.webp` | cena | 1920×1080 | Desafiando: Cena de duelo com o guardião. | não |

## 18 · Oceanos e ilhas ⛵
Pasta: `assets/confusion/interface/mundo/18/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `barco.webp` | sprite | 512×512 | Barco: Barco pequeno. | não |
| `ilha.webp` | sprite | 512×512 | Ilha: Ilha visitável. | não |
| `mare-alta.webp` | marcador | 128×128 | Maré alta: Marcador de maré alta. | não |
| `mare-baixa.webp` | marcador | 128×128 | Maré baixa: Marcador de maré baixa. | não |
| `navegar.webp` | cena | 1920×1080 | Navegando: Barco em alto-mar à noite. | não |

## 19 · Arqueologia e relíquias 🏺
Pasta: `assets/confusion/interface/mundo/19/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `fragmento.webp` | sprite | 512×512 | Fragmento: Pedaço de relíquia. | não |
| `reliquia-oculta.webp` | sprite | 512×512 | Relíquia oculta: Silhueta da relíquia. | não |
| `reliquia-restaurada.webp` | sprite | 512×512 | Relíquia restaurada: Relíquia completa brilhando. | não |
| `reliquia-corrompida.webp` | sprite | 512×512 | Relíquia corrompida: Relíquia tomada por sombras. | não |
| `escavacao.webp` | cena | 1920×1080 | Escavação: Sítio arqueológico. | não |

## 20 · Guildas e profissões 🔨
Pasta: `assets/confusion/interface/mundo/20/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `cozinheiro.webp` | marcador | 128×128 | Cozinheiro: Selo/uniforme da profissão. | não |
| `ferreiro.webp` | marcador | 128×128 | Ferreiro: Selo/uniforme da profissão. | não |
| `alquimista.webp` | marcador | 128×128 | Alquimista: Selo/uniforme da profissão. | não |
| `fazendeiro.webp` | marcador | 128×128 | Fazendeiro: Selo/uniforme da profissão. | não |
| `guilda.webp` | cena | 1920×1080 | Salão da guilda: Interior do salão das guildas. | não |

## 21 · Crimes e julgamentos ⚖️
Pasta: `assets/confusion/interface/mundo/21/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `tribunal.webp` | cena | 1920×1080 | Tribunal: Cena de julgamento. | não |
| `procurado.webp` | marcador | 128×128 | Cartaz de procurado: Cartaz com o rosto do jogador. | não |
| `inocente.webp` | marcador | 128×128 | Selo de inocente: Selo de absolvição. | não |
| `culpado.webp` | marcador | 128×128 | Selo de culpado: Selo de condenação. | não |

## 22 · Companheiros com histórias 🤝
Pasta: `assets/confusion/interface/mundo/22/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `mira.webp` | retrato | 1024×1024 | Mira: Retrato da companheira (neutro, sério, sorriso). | não |
| `capitulo-1.webp` | cena | 1920×1080 | Capítulo 1: Cena do primeiro capítulo. | não |
| `capitulo-2.webp` | cena | 1920×1080 | Capítulo 2: Cena do segundo capítulo. | não |
| `capitulo-3.webp` | cena | 1920×1080 | Capítulo 3: Cena do terceiro capítulo. | não |
| `afinidade.webp` | marcador | 128×128 | Medidor de afinidade: Coração em 5 estágios. | não |

## 23 · Portais dimensionais 🌀
Pasta: `assets/confusion/interface/mundo/23/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `portal-lua.webp` | sprite | 512×512 | Portal da lua: Portal prateado. | não |
| `portal-sombra.webp` | sprite | 512×512 | Portal da sombra: Portal roxo escuro. | não |
| `portal-sol.webp` | sprite | 512×512 | Portal do sol: Portal dourado. | não |
| `travessia.webp` | cena | 1920×1080 | Atravessando: Efeito de travessia. | não |

## 24 · Cicatrizes e traumas 🩹
Pasta: `assets/confusion/interface/mundo/24/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `cicatriz-1.webp` | marcador | 128×128 | Cicatriz leve: Marca no personagem. | não |
| `cicatriz-2.webp` | marcador | 128×128 | Cicatriz média: Marca no personagem. | não |
| `cicatriz-3.webp` | marcador | 128×128 | Cicatriz profunda: Marca no personagem. | não |
| `superar.webp` | cena | 1920×1080 | Superando: Cena de cura emocional. | não |

## 25 · Guerras territoriais e cercos ⚔️
Pasta: `assets/confusion/interface/mundo/25/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `cerco.webp` | cena | 1920×1080 | Cerco: Cidade cercada por tropas. | não |
| `mediar.webp` | cena | 1920×1080 | Mediação: Mesa de negociação entre dois lados. | não |
| `tropa.webp` | sprite | 512×512 | Tropa: Soldado de facção. | não |
| `estandarte.webp` | marcador | 128×128 | Estandarte de guerra: Bandeira de guerra. | não |

## 26 · Adaptações ambientais 🧬
Pasta: `assets/confusion/interface/mundo/26/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `bioma-floresta.webp` | marcador | 128×128 | Adaptação: floresta: Selo de bioma. | não |
| `bioma-praia.webp` | marcador | 128×128 | Adaptação: praia: Selo de bioma. | não |
| `bioma-caverna.webp` | marcador | 128×128 | Adaptação: caverna: Selo de bioma. | não |
| `bioma-cogumelos.webp` | marcador | 128×128 | Adaptação: cogumelos: Selo de bioma. | não |
| `treino.webp` | cena | 1920×1080 | Treinando: Monstro treinando no bioma. | não |

## 27 · Eventos históricos provocados 📜
Pasta: `assets/confusion/interface/mundo/27/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `pergaminho.webp` | marcador | 128×128 | Pergaminho: Registro histórico. | não |
| `fundacao.webp` | cena | 1920×1080 | Evento: fundação: Cena de fundação. | não |
| `revolta.webp` | cena | 1920×1080 | Evento: revolta: Cena de revolta. | não |
| `descoberta.webp` | cena | 1920×1080 | Evento: descoberta: Cena de descoberta. | não |

## 28 · Mistérios coletivos 🧩
Pasta: `assets/confusion/interface/mundo/28/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `quadro.webp` | cena | 1920×1080 | Quadro coletivo: Mural de pistas compartilhadas. | não |
| `pista-a.webp` | marcador | 128×128 | Pista A: Peça do mistério. | não |
| `pista-b.webp` | marcador | 128×128 | Pista B: Peça do mistério. | não |
| `pista-c.webp` | marcador | 128×128 | Pista C: Peça do mistério. | não |
| `pista-d.webp` | marcador | 128×128 | Pista D: Peça do mistério. | não |

## 29 · Memória do Mundo 🌳
Pasta: `assets/confusion/interface/mundo/29/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `muda.webp` | sprite | 512×512 | Muda: Árvore recém-plantada. | não |
| `arvore-crescida.webp` | sprite | 512×512 | Árvore crescida: Árvore grande com memórias. | não |
| `monumento.webp` | sprite | 512×512 | Monumento: Monumento de pedra. | não |
| `plantar.webp` | cena | 1920×1080 | Plantando: Mãos plantando. | não |

## 30 · Criaturas gigantes exploráveis 🐉
Pasta: `assets/confusion/interface/mundo/30/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `gigante-norte.webp` | sprite | 512×512 | Criatura gigante: Criatura gigante explorável, corpo inteiro, escala enorme. | não |
| `montar.webp` | cena | 1920×1080 | Montando: Jogador escalando a criatura. | não |
| `chegada.webp` | cena | 1920×1080 | Aviso de chegada: Silhueta no horizonte. | não |

## 31 · Fundação de cidades 🏙️
Pasta: `assets/confusion/interface/mundo/31/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `cidade-nova.webp` | sprite | 512×512 | Cidade nova: Cidade recém-fundada. | não |
| `cidade-dominada.webp` | sprite | 512×512 | Cidade dominada: Cidade sob domínio do jogador (bandeira). | não |
| `cidade-surto.webp` | sprite | 512×512 | Cidade em surto: Cidade com zumbis nas ruas. | não |
| `zumbi.webp` | sprite | 512×512 | Zumbi: Habitante transformado. | não |
| `mapa-campanha.webp` | cena | 1920×1080 | Mapa da campanha: Mapa com as 12 cidades. | não |
| `batalha-final.webp` | cena | 1920×1080 | Batalha final: Cena da batalha final. | não |

## 32 · Purificação e corrupção de equipamentos 🗡️
Pasta: `assets/confusion/interface/mundo/32/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `espada.webp` | sprite | 512×512 | Espada da Vigília: Espada, estado neutro. | não |
| `escudo.webp` | sprite | 512×512 | Escudo de Pedra: Escudo, estado neutro. | não |
| `aura-luz.webp` | marcador | 128×128 | Aura de luz: Brilho de purificação. | não |
| `aura-sombra.webp` | marcador | 128×128 | Aura de sombra: Brilho de corrupção. | não |
| `forja.webp` | cena | 1920×1080 | Forja: Bancada de purificação/corrupção. | não |

## 33 · Magias proibidas 🕳️
Pasta: `assets/confusion/interface/mundo/33/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `vortice.webp` | cena | 1920×1080 | Vórtice negro: Efeito do feitiço. | não |
| `marca.webp` | marcador | 128×128 | Marca proibida: Marca no corpo do jogador. | não |
| `grimorio.webp` | sprite | 512×512 | Grimório: Livro das magias proibidas. | não |

## 34 · Contratos sobrenaturais 🖋️
Pasta: `assets/confusion/interface/mundo/34/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `contrato.webp` | sprite | 512×512 | Contrato: Pergaminho com selo de sangue. | não |
| `demonio.webp` | retrato | 1024×1024 | Entidade do contrato: Entidade sobrenatural. | não |
| `cumprir.webp` | cena | 1920×1080 | Cumprindo: Cena de cobrança. | não |
| `prazo.webp` | marcador | 128×128 | Relógio do prazo: Ampulheta. | não |

## 35 · Autômatos e criaturas artificiais 🤖
Pasta: `assets/confusion/interface/mundo/35/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `automato.webp` | sprite | 512×512 | Autômato: Criatura artificial de engrenagens. | não |
| `oficina.webp` | cena | 1920×1080 | Oficina: Interior da oficina. | não |
| `desgaste.webp` | marcador | 128×128 | Medidor de desgaste: Engrenagem em 4 estágios. | não |

## 36 · Montarias terrestres, aéreas e aquáticas 🐴
Pasta: `assets/confusion/interface/mundo/36/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `terrestre.webp` | sprite | 512×512 | Montaria terrestre: Criatura montável terrestre. | não |
| `aerea.webp` | sprite | 512×512 | Montaria aérea: Criatura montável aérea. | não |
| `aquatica.webp` | sprite | 512×512 | Montaria aquática: Criatura montável aquática. | não |
| `sela.webp` | marcador | 128×128 | Sela: Item de sela. | não |
| `domar.webp` | cena | 1920×1080 | Domando: Cena de doma. | não |

## 37 · Caçadores de recompensas 🎯
Pasta: `assets/confusion/interface/mundo/37/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `cartaz.webp` | marcador | 128×128 | Cartaz de recompensa: Cartaz de contrato. | não |
| `cacador.webp` | retrato | 1024×1024 | Caçador de recompensas: NPC caçador. | não |
| `alvo.webp` | sprite | 512×512 | Alvo: Silhueta do procurado. | não |
| `quadro-contratos.webp` | cena | 1920×1080 | Quadro de contratos: Quadro de avisos. | não |

## 38 · Festivais e culturas 🎃
Pasta: `assets/confusion/interface/mundo/38/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `festa.webp` | cena | 1920×1080 | Festival: Praça em festa com lanternas e abóboras. | não |
| `prato.webp` | sprite | 512×512 | Prato da festa: Banquete. | não |
| `mascara-festa.webp` | marcador | 128×128 | Máscara do festival: Máscara festiva. | não |
| `danca.webp` | cena | 1920×1080 | Dança: Cena de dança. | não |

## 39 · Idiomas antigos 📖
Pasta: `assets/confusion/interface/mundo/39/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `livro.webp` | sprite | 512×512 | Livro antigo: Livro de idiomas antigos. | não |
| `inscricao.webp` | cena | 1920×1080 | Inscrição: Parede com glifos. | não |
| `glifo-1.webp` | marcador | 128×128 | Glifo 1: Glifo antigo. | não |
| `glifo-2.webp` | marcador | 128×128 | Glifo 2: Glifo antigo. | não |
| `glifo-3.webp` | marcador | 128×128 | Glifo 3: Glifo antigo. | não |

## 40 · Mineração profunda ⛏️
Pasta: `assets/confusion/interface/mundo/40/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `camada-rasa.webp` | cena | 1920×1080 | Camada rasa: Corte de terra rasa. | não |
| `camada-media.webp` | cena | 1920×1080 | Camada média: Corte de rocha. | não |
| `camada-funda.webp` | cena | 1920×1080 | Camada funda: Corte de cristais profundos. | não |
| `fossil.webp` | sprite | 512×512 | Fóssil: Fóssil encontrado. | não |
| `picareta.webp` | marcador | 128×128 | Picareta: Ferramenta. | não |

## 41 · Simbiose e parasitismo 🦠
Pasta: `assets/confusion/interface/mundo/41/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `simbiose.webp` | sprite | 512×512 | Simbiose: Dois seres ligados por raízes. | não |
| `parasita.webp` | sprite | 512×512 | Parasita: Criatura parasita. | não |
| `vinculo.webp` | marcador | 128×128 | Vínculo: Fio entre os dois. | não |

## 42 · Labirintos temporais ⏳
Pasta: `assets/confusion/interface/mundo/42/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `labirinto.webp` | cena | 1920×1080 | Labirinto temporal: Corredores que se repetem. | não |
| `eco.webp` | sprite | 512×512 | Eco do passado: Silhueta fantasma. | não |
| `passo.webp` | marcador | 128×128 | Passo do labirinto: Marcador de 5 passos. | não |

## 43 · Reputação lendária 🏅
Pasta: `assets/confusion/interface/mundo/43/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `titulo-chefes.webp` | marcador | 128×128 | Título: Vencedor de chefes: Faixa de título. | não |
| `titulo-2.webp` | marcador | 128×128 | Título 2: Faixa de título. | não |
| `titulo-3.webp` | marcador | 128×128 | Título 3: Faixa de título. | não |
| `galeria.webp` | cena | 1920×1080 | Galeria de lendas: Salão de troféus. | não |

## 44 · Arenas e competições 🏟️
Pasta: `assets/confusion/interface/mundo/44/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `arena.webp` | cena | 1920×1080 | Arena: Arena de duelos. | não |
| `bronze.webp` | marcador | 128×128 | Divisão bronze: Medalha. | não |
| `prata.webp` | marcador | 128×128 | Divisão prata: Medalha. | não |
| `ouro.webp` | marcador | 128×128 | Divisão ouro: Medalha. | não |
| `oponente.webp` | sprite | 512×512 | Oponente: Duelista. | não |

## 45 · Expedições autônomas de NPCs 🧭
Pasta: `assets/confusion/interface/mundo/45/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `expedicao.webp` | cena | 1920×1080 | Expedição: Grupo de NPCs partindo. | não |
| `mochila.webp` | marcador | 128×128 | Mochila de expedição: Item. | não |
| `retorno.webp` | cena | 1920×1080 | Retorno: Grupo voltando cansado. | não |

## 46 · Astronomia e constelações 🔭
Pasta: `assets/confusion/interface/mundo/46/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `observatorio.webp` | sprite | 512×512 | Observatório: Torre de observação. | não |
| `constelacao.webp` | cena | 1920×1080 | Constelação: Céu com constelação desenhada. | não |
| `ciclo.webp` | marcador | 128×128 | Ciclo celeste: Marcador de ciclo. | não |

## 47 · Santuários de memória ⛪
Pasta: `assets/confusion/interface/mundo/47/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `santuario.webp` | sprite | 512×512 | Santuário de memória: Santuário de pedra luminosa. | não |
| `catedral.webp` | cena | 1920×1080 | Catedral: Catedral do herói. | não |
| `eco.webp` | sprite | 512×512 | Eco: Fantasma do passado. | não |
| `agua-purificada.webp` | marcador | 128×128 | Água purificada: Frasco de água luminosa. | não |

## 48 · Engenharia e infraestrutura 🌉
Pasta: `assets/confusion/interface/mundo/48/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `canal.webp` | sprite | 512×512 | Canal de irrigação: Trecho de canal. | não |
| `ponte.webp` | sprite | 512×512 | Ponte reforçada: Ponte de pedra. | não |
| `obra.webp` | cena | 1920×1080 | Obra: Cena de construção. | não |

## 49 · Criaturas que aprendem com o jogador 🎓
Pasta: `assets/confusion/interface/mundo/49/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `treino.webp` | cena | 1920×1080 | Treino: Monstro treinando com o jogador. | não |
| `especializado.webp` | marcador | 128×128 | Selo de especialização: Selo em 3 tipos. | não |
| `mestre.webp` | retrato | 1024×1024 | Mestre: Retrato do mestre de treino. | não |

## 50 · Evolução autônoma do mundo 🌍
Pasta: `assets/confusion/interface/mundo/50/`

| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |
|---|---|---|---|---|
| `icone.webp` | icone | 256×256 | Ícone: Símbolo do sistema para a grade do menu. | não |
| `banner.webp` | banner | 1600×500 | Banner: Cena de abertura do menu deste sistema. | não |
| `marco-30.webp` | cena | 1920×1080 | Marco 30: Cena do mundo no marco 30. | não |
| `marco-60.webp` | cena | 1920×1080 | Marco 60: Cena do mundo no marco 60. | não |
| `marco-90.webp` | cena | 1920×1080 | Marco 90: Cena do mundo no marco 90. | não |
| `selo-irreversivel.webp` | marcador | 128×128 | Selo irreversível: Selo de marco. | não |
