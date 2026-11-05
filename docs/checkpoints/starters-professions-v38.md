# PSYWORLD — 2026-11-05 · iniciais e novos ofícios

Authoritative parent: c8df2c24729795ecfcf39b936772914c2e233fd9, tree1d3baabefca46987635a70e86e03039592d21e57, previewbranch teste/oficios-caca-v37. Continue ONLY previews; nevermain/production. V38 target teste/iniciais-oficios-v38. Prior GitHub update_ref repeatedly failed, while createbranch works; use safe compareandupdate or newpreviewbranch asneeded. NoAndroid.

## Latest user request
Release starters from allgenerations in campaign. Add Professor, Estilista and originalPSYWORLD professions, eachwithbonus/recipes. ResearchPokeXGames professions online. Preserve allprevious tower/interior/AutoHunt fixes and removedIdle/assistant.

## Research
Official wiki https://wiki.pokexgames.com/Professor and https://wiki.pokexgames.com/index.php/Estilista plus https://wiki.pokexgames.com/index.php/Craft_Profissões. Professor: research/plants/Berries/student missions. Stylist: outfits/decorations/accessories, style/materialresources. Use roleinspiration; nottheirassets, exacteconomy, rank300 or claims ofworldwideunique ideas. OfficialPokémon sitehasWinds/Waves announcedfor2027; currentPSYWORLD catalogsupports9releasedgenerations throughPaldea. Do not invent unknownNationalIDs/stats/learnsets forunreleasedGen10. Currentimplementation27standardstarters Kanto–Paldea.

## Implemented
- core/kanto-city-cinematics-v1.js: campaign choicegroupsall9GENS (27) withgenerationdropdown, updatedstory/tutorial. Selectionvalidatedagainstwholecatalog; singledurableinitialchoice, guardsrepeatedclicksandownedteam, fullHPafterexistingnativeconfirmStarter, startsPalletsamecampaignregardlessstarterorigin. Existingrostersarenotreset/replaced. Doesnotgrant27Pokémonatonce. Nativelegacyselectionoutsidecampaignnotchanged.
- core/professions-v1.js: existing3jobs/36recipesstableIDs remain; addsProfessor/Estilista/TecelãodeEcos/CartógrafoOnírico/GuardiãodoCrepúsculo =8jobs,24specs,96recipes. Eachnewjob12recipes at1/15/30/50/75/100, own2resources/basepassive/specpassives. First-time resourceonboardingforoldsave newjob once; noreset/repeatkitfarm. Everyjobresourceaddedtosharedkillhookexistingdedupe, existingjobprogress/queues/equipmentpreserved.
- Professor basexp3%; Mentorxp2%, Ecólogodrop2%, TutorHP2%. Studentstudyrequiresprofession15,cost150Gold,10min(or8Mentor),max3/day,collect6Anotação+2Pólen+80jobXPonce; persistsreadyAtandsnapshot. Berriesare15minbuffconsumables, otherrecipeheldstudytools.
- Estilista basecapture3%; AlfaiateHP2%, DesignerSpeed2%, Coloristacapture2%. Accessoriesheldplus4permanentcraftedvisuals: emerald/coral/celestial/eclipse. Visualsconsumeitemonce, duplicatecosmeticfabricationblocked, wardrobepermanenttoggledinEspecialidade, noattributesfromvisual. core/kanto-world-v2.js drawscoloredgroundringandwalkingparticleswithoutreplacingapprovedavatars/skins.
- TecelãodeEcos basedrop3%; RessonanteAtk2%, Lapidadordrop2%, HarmonistaDef2%. Recycleoneunequippedheldcopyfor1–3Eco byreciperank, destroyscopyandreinforcements; nobonusquantityfromquality/forge, neverrecyclesconsumables/equippedcopies.
- CartógrafoOnírico basespeed3%; Desbravadordrop2%, Astrógrafoxp2%, Navegadorcapture2%. Registeractuallocationthroughcampaign/worldgetPositiononceperworld/interior,8TintaOnírica4FragmentodeMapa60jobXP. Nofakeunvisitedlocations.
- GuardiãodoCrepúsculo basedef3%; SentinelaDef2%, Faroleiroxp2%, VigilanteHP2%. Preparingwardcost3CinzaLunar2FiodeLuz75Gold ->15minDef8%HP5%, replacescategoryeffects; doesn'theal/revive.
- HPbonusesnowupdaterealmaxHPwithcontextualnativecalcDetailedStats onchoose/equip/use/expiry. CurrentHPonlyclampsdown; fainted0remains0. AvoidoldrecalcPoke()becauseitcanheal/revive. Oldheld/craftkeycompatibilityretained.
- Careersearchfor8cards; perclassbonus/specbonusdescriptions,Especialidadetab, originalgenerated5newWEBPworkshopheaders assets/professions/{professor,stylist,echo,dream,twilight}.webp. CSSpixelartconsistentnavy+colorperjob. Updatedindexcachekeys.
- tests/professions-expanded-preview.html: explicitlydisposablelaboratory withjobLv100/materialsforQA, no realprofile/save writes. Mobileiframe390×844 tests/professions-expanded-mobile.html. No debugbuttonsaddedtorealgame.

## Validation before deploy
11 suites: previous8 pluscampaignstartercoverage27choices/filter/singlepartner/existingteam; expandedjobs/specialties/migrations/wardexpire/dedupe; maxHPcontext/expire/norevive. Oldprofessions testcountupdated36->96 only. Source syntaxchecked3modifiedJS. Full browserQA pendingafterdeployment. Do not claimlivemaxrankcombat/everygenbattletested; reportactualflows.

## Delivery/continuity
Commitallchangedsource/assets/tests/checkpointonpreviewbranch; preservebackendapi/lib/supabase/config and allpreviousassets. RecorddeployURL and actualbrowserresultsin finalresponse; nextbaselineisthisnewcommitnotmain. Pendingolderreferencerequests(TMmanufacture/constellation/outfitsfullsprites)arenotfulfilledbygroundringvisual; avoidclaimingfulloutfits.
