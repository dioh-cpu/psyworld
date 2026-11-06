# Cidade — limpeza V42
Removido o botão flutuante fastEncounterBtn do HTML. O sistema de combate Fast Encounter não foi alterado.
Retirado do renderer da cidade o antigo desenho da ilha/praia, incluindo areia, mar, lagos, árvores geométricas e construções antigas. A camada atual cobre todo o viewport com o piso da cidade, inclusive nas bordas e com a temporada desligada. Casas/NPCs sazonais, campanha, saves e colisões preservados. Mudança apenas na branch de testes.

Verificação: 14 suites passaram e sintaxe dos scripts validada. Prévia aberta em perfil descartável: https://psyworld-jx8an315t-world-of-monsters.vercel.app/ . Sem fastEncounterBtn na árvore da página; piso contínuo e nenhuma areia/mar/árvore geométrica/lago antigo na captura. Prova local docs/screenshots/city-cleanup-v42.jpg. Código d738bce47b585cf52409c500ea91a355a5429ef2.
