# PSYWORLD — revisão de testes e balanceamento · 06/11/2026

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
| Engenheiro | 13.18 h | 1.71 h | 0.86 h | 38.88 h |
| Herborista | 13.18 h | 1.71 h | 0.86 h | 38.88 h |
| Pesquisador | 9.12 h | 1.32 h | 0.66 h | 41.49 h |
| Professor | 9.12 h | 1.32 h | 0.66 h | 41.49 h |
| Estilista | 9.12 h | 1.32 h | 0.66 h | 41.49 h |
| Tecelão de Ecos | 8.75 h | 1.31 h | 0.65 h | 40.98 h |
| Cartógrafo Onírico | 8.9 h | 1.31 h | 0.65 h | 41.22 h |
| Guardião do Crepúsculo | 9.12 h | 1.32 h | 0.66 h | 41.49 h |

Raw scenarios docs/checkpoints/balance-audit-v41.json. Reproducibleafteraudit: node scripts/qa/balance-audit-v41.cjs; before/after JSON retained (beforecodewas exactpreaudit /tmpsnapshot). Runningwithoutoldpath onlyregeneratesafter; do notoverwritehistoricalcomparisonunnecessarily.

## Automated verification
14 suites pass: original11 plusbalanceguardrails,towerbalance andnativePass/VIPeconomy. Tower760seededentrybattles (40×19branches) wonwithstandardBulbasaur/Charmander/SquirtleLv10. Paidkeycost>maxrewardfor380event/mode/floorpairs, attributesfinite at1/10/100/101/1000. NativePass100levels×2tracks totalsverified:5MGold,100Boost,20Shiny,10MegaFragments,300Ball/type,31Eggs,approvedPacks,Free100ShinyEgg/Premium100coupon,noPsyCoinpayout. All5VIPprices preserved. ClassiclegacyScript syntax compiles.
Otherregressionscovered: titlesunique,incenseexpiry,seasonalEgg1000,claims/refundsonce,18typeeffectiveness,AutoHuntlowFPS/all4grasses/faintswitch/wipestop,6interiorcollisions/NPC/exitreachability,27starterselection/rosterpreservation,8jobmigration/96recipes,studentdailycap/claimonce,cosmetic/recyclededupe,contextualHP/noheal/norevive.

## Browser QA pending deployment
Disposable tests/balance-preview-v41.html and mobileiframe tests/balance-mobile-v41.html startprofession15 with500materials andoneComum/oneRaro/oneIncomumBússola. Verifydeliverytwoqualities, ownmaterialforge and52secbatch3/120XP. Useactualnativegameforcity/campaign/menu/battleflows; neverrealuseraccount. AddfinalURL/resultsafterinspection.

## Limits
No claim toeveryinfinitefloor/endgamerosterbalance or100hrealplay. Offline timers/daycaps provenVMclock, notlongdurationbrowserwaiting. ExistingunmodifiedAFK/Psyducksystems notfullyplayedendtoendthisiteration; archivedIdleintentionallynotre-enabled. All economicsremainpreviewbalanceforplayerfeedback. No unrequestedpaidcurrency/towerdifficulty changes.
