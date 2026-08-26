
# PSYWORLD — Checklist antes de abrir jogadores reais

- [x] Auth preparado.
- [x] Gold/Diamantes têm tabela oficial no servidor.
- [x] Ledger idempotente.
- [x] Inventário server-side.
- [x] Pokémon possuem UID e owner.
- [x] RLS impede alteração direta pelo cliente.
- [x] Market usa escrow.
- [x] Market compra em transação SQL e impede dupla-compra.
- [x] Taxa de anúncio Gold calculada no servidor.
- [x] Shop normal Stones e Craft têm RPC server-side.
- [x] Importação legacy é desligada por padrão.
- [ ] Migrar recompensas de batalha para `battle_sessions`.
- [ ] Migrar drops/TMs/Essências para reward server-side.
- [ ] Migrar Eggs e pity para servidor.
- [ ] Migrar Gacha/Card Packs para servidor.
- [ ] Migrar Achievements para servidor.
- [ ] Migrar AFK para timestamps/claims server-side.
- [ ] Criar rate limits.
- [ ] Criar tabela/admin de bans e flags anti-cheat.
- [ ] Criar backups e auditoria.
- [ ] Pagamento de Diamantes somente por webhook assinado.
- [ ] Só depois: abrir Market real.
- [ ] PvP: servidor decide turnos/dano/resultado.
