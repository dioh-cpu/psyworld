# 08 — ESTADO ATUAL E PRÓXIMOS PASSOS

## Estado Atual (V6 Concluída e Validada em Chromium + Preview Vercel)
- Branch isolada `visual/pallet-anime3q-prototype-v1` atualizada com todas as **6 áreas de Pallet Town** + **Nova Rota 1** totalmente jogáveis via **Pixel-Exact Walkmask + 2D Euclidean SDF V6**.
- Conectividade em componente único (`componentCount === 1`, `PLAYER_RADIUS = 11`) validada em todos os 6 cenários.
- 15 transições/portais configurados com retorno bidirecional, spawns seguros (`sdf >= 20.5`), subida pela escadaria esquerda do Laboratório sob o arco RGBA `"Rota 1"` e acesso real à Viridian City.
- Nova Rota 1 integrada ao sistema de batalhas selvagens (`isRoute1: true`), com 3 canteiros de grama alta acessíveis por vãos nas cercas, além de zonas de Pesca e Mineração integradas em `core/hobbies-v2.js`.
- Sprite do Professor Carvalho corrigido para corpo inteiro (`assets/kanto/npcs/professor-v33.webp`) no overworld do Laboratório.
- `main` e o jogo de produção permanecem 100% intactos; distribuição em Preview isolada na Vercel (`?visual=anime3q`).

## Próximos Passos Sugeridos
1. Caso deseje refinar qualquer contorno específico após testes adicionais em campo, ajuste o polígono em `tools/build_walkmasks_v6.py`, execute `python3 tools/build_walkmasks_v6.py` e valide `componentCount === 1` antes de publicar nova revisão.
2. Utilizar a mesma metodologia (Walkmask `1200×675` + 2D SDF + oclusores RGBA) caso a adaptação Anime HD 3/4 seja expandida no futuro para Viridian City ou rota norte seguinte.

## Estado V6.1
- Todas as 6 áreas de Pallet Town + Nova Rota 1 possuem colisões auditadas em tiles de 20px, conectividade única (`componentCount === 1`) e píer de pesca da Costa totalmente acessível.
