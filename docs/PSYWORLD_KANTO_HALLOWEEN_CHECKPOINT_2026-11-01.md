# PSYWORLD — checkpoint Kanto + Halloween — 2026-11-01

## Branch e publicação
- Repositório: `dioh-cpu/psyworld`.
- Branch de trabalho: `codex/kanto-atlas-20261031`; PR #48 permanece aberto para revisão.
- `main` e Supabase não foram alterados. Nenhum deploy de produção foi iniciado.
- A sincronização usa a conexão GitHub com permissão `push`; não exige token pessoal no chat.

## Fantasias e seleção do treinador
- Integração em `core/halloween-ui.js`, carregada pelo `index.html`.
- Seis identidades: `black_boy`, `black_girl`, `gothic_boy`, `gothic_girl`, `adventure_boy` e `adventure_girl`.
- Cada identidade mantém cinco fantasias mapeadas por nome exato: Básica, Divina, Macabra I, Macabra II e Suprema.
- Novos perfis escolhem o treinador antes do inicial. Saves antigos continuam abrindo pelo fluxo anterior. O personagem e a fantasia escolhida são salvos dentro dos dados do jogador; o menu permite trocar depois.
- As 30 folhas conferidas no manifesto foram mantidas em grade 4×4, 2048×2048, células 512×512. Para reduzir a transferência inicial da branch, foram exportadas como WebP de alta qualidade; somam cerca de 14,9 MiB. O `assets/characters/halloween/manifest.json` registra o hash-fonte e o hash do WebP de cada folha.
- A sprite do treinador substitui a sprite do Pokémon sobre o personagem na cidade. O Pokémon permanece como fallback se o perfil não tiver identidade ou se um asset não carregar.

## Campanha de Kanto
- `core/kanto-campaign-playable-v1.js` adiciona mapas caminháveis gerados por tema para as 38 paradas liberadas do Atlas, NPCs, objetivos, encontros usando as espécies da localidade, segredos com técnica/enigma e avanço para a parada seguinte.
- O jogador pode caminhar com teclado ou D-pad e interagir por tecla ou botão de toque. A sprite escolhida do treinador também aparece nesses mapas.
- Os ginásios existentes de Kanto são chamados na sequência da jornada e continuam usando o fluxo de batalha do jogo.
- Esses mapas são protótipos temáticos gerados por código; eles ainda não são os 38 mapas e artes originais planejados. O final de Indigo informa que as arenas da Elite Four e do Campeão ainda faltam. A campanha completa não deve ser anunciada como finalizada.
- `docs/KANTO_ART_IMPLEMENTATION_PLAN_2026-11-01.md` registra o contrato de arquivos para os 38 mapas e as 14 famílias de tileset, com fases de produção, colisão e validação.

## Validação feita
- `node --check` nos módulos de Halloween e campanha.
- As folhas originais foram verificadas contra o hash do pacote corrigido antes da conversão; as versões WebP mantêm dimensões, transparência e grade do manifesto.
- As verificações estáticas da campanha cobrem as entradas do Atlas, controles, interações, encontros, progressão e integração dos ginásios.
- Não foi feito teste end-to-end no navegador; a validação visual e de gameplay em PC/mobile ainda depende de abrir a prévia da branch.

## Ainda precisa corrigir / produzir
- Criar e integrar artes/tilesets próprios e mapas desenhados à mão para cada parada de Kanto, seguindo o plano em `docs/KANTO_ART_IMPLEMENTATION_PLAN_2026-11-01.md`.
- Implementar as arenas e batalhas da Elite Four e do Campeão.
- Rodar a prévia da branch em PC e celular para revisar as seis identidades, as cinco opções de fantasia, entradas/saídas, colisões, encontros e batalhas de ginásio.
- Confirmar se o tema Halloween de Pallet será sazonal ou permanente.
