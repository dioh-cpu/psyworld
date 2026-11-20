# PSYWORLD — revisão de testes e balanceamento · Revisão V41

Only preview branch teste/iniciais-oficios-v38. Authoritative parent646bbaa6474b6b13939ece365d82bbbf75dace56; retain all27starter/8profession/96recipe/tower/interior/AutoHunt changes. Do not revert to main. No production, Android, archivedIdle or assistant changes.

## Correções e decisões
- Professions previously gave30XP for every recipe, no jobXP for fighting, curve100+30level. Simulation revealed9–13h to profession15 at6wildkills/min and no100 completion within100h for severalclasses. Newcurve75+10level; newcrafts40XP×reciperank; eligiblewild/hunt kills2jobXP, Fast/oldWorld1. Existingmodecapture/rewardrates and FastEncounterlogic notmodified. Level100caps unchanged; no newPsyCoin rewards.
- Old professionlevels/talents/items/queues preserved. Partial XP migratesonce to equivalentfraction ofnewthreshold; nolevelreset. Already queuedjobs preserveold30XP/item; newqueuejobs snapshotnewXP.
- Tutorialcraftdiscount appliesONEitem only, even inbatch. Mechanicbatch3base30sec now(5+2×30)×.8=52sec, not12sec. Shortcutreserved onenqueueand neverrepeats.
- Dailyorder consumesany2qualitiesofrequiredrecipe atomically; preventsmismatchbetweenquestcounteranddelivery. Gold300/XP150anddailyonce unchanged.
- Forgeusesownrecipematerial instead of forcingeveryprofessiontofarmEngineerMinério. Costmaterial3+rank andGold200×nextreinforcement×rank. Existing+0..+5 items preserved. Maxbonus30%/stat unchanged; cosmeticsnofocus/noattributes/duplicateblocked.
- Switchingjob/spec blockedinnativebattle, preventingfreepassiveswaps. Craftqueueallowed; equip/use restrictions unchanged.
- Towerunitbonuses nowrespectactualwearer; leaderheldHP/ATK/DEF nolongerduplicatedacrossentireselectedparty. Professiontrainerpassivesstillapplyall. Difficulty1/2/4/8, rewards1/1.5/2/3, infinitefloors,10dailyfreewins, entry10+3healthyLv10, exactkey/refundrules preserved.

## Simulated progression (not live player timings)
Assumptions: seeded19; trainer10;25,000startingGold;10Gold perkill;wildcadence6or12kills/min;automaticcollection/crafting/Goldslotupgradesanddailyorders;nofocus/nouniquespecialties;100hsimulationwindow. These are scenarios, not guarantees. Actualratesdependonroute, team, quality, boosts andplayerchoices.

| Profissão | Antes: Nv15 a6/min | Depois: Nv15 a6/min | Depois: Nv15 a12/min | Depois: Nv100 a6/min |
|---|---:|---:|---:|---:|
| Engenheiro | 13.18 h | 1.71 h | 0.86 h | 38.8 h |
| Herborista | 13.18 h | 1.71 h | 0.86 h | 38.8 h |
| Pesquisador | 9.11 h | 1.32 h | 0.66 h | 41.55 h |
| Professor | 9.11 h | 1.32 h | 0.66 h | 41.55 h |
| Estilista | 9.11 h | 1.32 h | 0.66 h | 41.55 h |
| Tecelão de Ecos | 8.87 h | 1.31 h | 0.65 h | 40.88 h |
| Cartógrafo Onírico | 8.9 h | 1.31 h | 0.65 h | 41.17 h |
| Guardião do Crepúsculo | 9.11 h | 1.32 h | 0.66 h | 41.55 h |

Raw scenarios docs/checkpoints/balance-audit-v41.json. Reproducibleafteraudit: node scripts/qa/balance-audit-v41.cjs; before/after JSON retained (beforecodewas exactpreaudit /tmpsnapshot). Runningwithoutoldpath onlyregeneratesafter; do notoverwritehistoricalcomparisonunnecessarily.

## Automated verification
14 suites pass: original11 plusbalanceguardrails,towerbalance andnativePass/VIPeconomy. Tower760seededentrybattles (40×19branches) wonwithstandardBulbasaur/Charmander/SquirtleLv10. Paidkeycost>maxrewardfor380event/mode/floorpairs, attributesfinite at1/10/100/101/1000. NativePass100levels×2tracks totalsverified:5MGold,100Boost,20Shiny,10MegaFragments,300Ball/type,31Eggs,approvedPacks,Free100ShinyEgg/Premium100coupon,noPsyCoinpayout. All5VIPprices preserved. ClassiclegacyScript syntax compiles.
Otherregressionscovered: titlesunique,incenseexpiry,seasonalEgg1000,claims/refundsonce,18typeeffectiveness,AutoHuntlowFPS/all4grasses/faintswitch/wipestop,6interiorcollisions/NPC/exitreachability,27starterselection/rosterpreservation,8jobmigration/96recipes,studentdailycap/claimonce,cosmetic/recyclededupe,contextualHP/noheal/norevive.

## Browser QA verificado
Prévia funcional: https://psyworld-qiyzu0vtm-world-of-monsters.vercel.app/
Código publicado: a22e53bd2834690c66fb2bf53fc0e2c35f8a363b, somente branch de testes.
- Perfil descartável 390×844: entrega diária consumiu Comum+Raro, deu 300 Gold/150XP e bloqueou nova entrega.
- Forja da cópia Incomum consumiu 4 Circuitos/200 Gold, +1 visível e próximo custo400.
- Lote3 Mecânico: 52segundos,120Gold/15Circuitos consumidos,3 cópias Comum coletadas,120XP totais. Nv15 150/225 → Nv16 45/235. Segunda coleta não duplicou itens/XP/Gold.
- Campanha real em perfil novo de teste: Scorbunny126/126HP, Pallet, Auto Find alcançou laboratório e abriu diálogo do professor; objetivo avançou para Rota1. Navegação abriu Rota1 mantendo mapa e controles. Auto Hunt foi ativado pelo controle visível, alcançou combate; o único Scorbunny Nv1 terminou com0/126HP e a caça desligou automaticamente, sem reviver. Não usar esse teste como recomendação de força para farm automático.
- Prova móvel: docs/screenshots/balance-v41.jpg.
- Modelo corrigido para comprar bancadas usando slots ausentes como0; tabela e JSON recalculados. Isso altera apenas o relatório de simulação, não a economia do jogo.

## Limits
No claim toeveryinfinitefloor/endgamerosterbalance or100hrealplay. Offline timers/daycaps provenVMclock, notlongdurationbrowserwaiting. ExistingunmodifiedAFK/Psyducksystems notfullyplayedendtoendthisiteration; archivedIdleintentionallynotre-enabled. All economicsremainpreviewbalanceforplayerfeedback. No unrequestedpaidcurrency/towerdifficulty changes.
