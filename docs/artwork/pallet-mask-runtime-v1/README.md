# Pallet Town: máscara conectada ao runtime

- Arte limpa usada pelo jogo: `assets/story/pallet-town-anime-rebuild-v2.png` (1774×887, proporção 2:1).
- Máscara original do ZIP: `pallet-mask-source-1536x768.png` (1536×768; branco caminhável, preto bloqueado).
- Sobreposição para conferência: `pallet-art-walkable-overlay.png` (na resolução da arte limpa).
- Máscara isolada alinhada à arte limpa: `pallet-mask-isolated.png`.
- Capturas do runtime: `runtime-desktop.png` e `runtime-mobile-emulated.png`.

O jogo mantém a arte sem alteração. `core/kanto-pallet-mask-v1.js` lê a máscara RLE do pacote, converte as coordenadas proporcionais para o mapa 900×450 e substitui a consulta de caminhada somente para Pallet. Esse tamanho é o efetivo da Rota 1 depois de carregar `core/kanto-collision-v4.js`; assim a escala do treinador e da câmera permanece igual entre os mapas. Os demais mapas continuam usando a colisão anterior.

A posição dos pés é validada com a guarda elíptica 7×5 pixels usada pelo leitor do pacote. A sobreposição visual não é carregada pelo jogo. O perfil no fixture Playwright é descartável e não usa conta, save ou serviços remotos.

Validação automatizada: `node tests/kanto-pallet-mask-v1.cjs`. O fixture de navegador está em `tests/kanto-pallet-mask-preview-v1.html`.

SHA-256 da arte: `5db1f903290ba7c32186e5ddf9db65ad91cf88031b7cb9da24cb5836a35eb8f7`.

SHA-256 da máscara original: `656d09be7e3e7369229384ab4cb36d8de48a6863bdc9c05753377995ce6197eb`.
