# Preview checkpoint — Event Tower / permanent titles / regression repairs

Scope: only `teste/kanto-pallet-rota1-v2`, repo `dioh-cpu/psyworld`. Base aac520cbb4839e49f052ea261e54b83082453987. Do not modify main or promote public production.

User decisions implemented:
- Titles grant permanent additive bonuses once; ownership keyed by ID with normalized-name duplicate defense, including imported aliases. Cosmetic display independent. Existing owned Halloween titles imported. 80 progression titles across captures, Gold, hunts/kills, gyms, Shiny/Mega/Shiny Mega, Survivor, campaign, XP, online time, check-in, Eggs, tower, quests, album and event forms; four seasonal titles. Registration API for future categories.
- Foreground play accumulates time; check-in requires 30 minutes on the day, once/day, UTC−3. Clock deltas bounded. Main team fainted HP preserved on bonus recalculation.
- Each incense adds 1 percentage point for its own hour. Final appearance capped at 10%, including permanent spawn bonuses. No item consumed at cap. Previous active incense imported.
- Event Tower exclusive to Psy City. Auto combat with up to six owned healthy Pokémon; local classes archer/tank/mage/support/assassin/warrior, elemental VFX and skills. Main-game HP untouched. 100 configured Halloween floors; three optional star objectives/floor. Wins allow purchasing next floor.
- Each event independently has 10 free attempts/day. Failures consume entry. Extra keys bound to event/floor, purchased in current-event currency: ceil(max reward ×1.25) active / ×3.75 archived, adjusted by event value. If bonuses increase before use, charge difference. Reward multiplier snapshotted on entry. Awards deduplicated, runs resumable, auto combat pauses on background/close.
- Archived event shop/upgrade costs ×3, including Shiny 3000 and Mega 15000 candy. Halloween Egg400 active/1200 archived, 0.1% Shiny birth, never Mega. Normal upgrades1000/5000 preserved. No invented Christmas event; future event registration supported.
- Costume names/prices: Juramento da Aurora2000, Máscara do Último Sino3500, Véu da Névoa Rubra5000, Coroa do Eclipse Eterno10000. Existing unlocks retained. Large actual-sheet preview on demand, separate confirmation, tower archived-price aware.
- Lazy V20 producer checks both original dock and moved content panel, preventing repeated Quest/Pass/VIP creation. Content panel additionally deduplicates action entries. No unrelated modes removed.
- Tutorial final target is CONTEÚDO DO JOGO, explicitly naming CAMPANHA KANTO. Content panel collapses on tutorial finish.
- Final legacy triggerWild override preserves Route1 Pidgey/Rattata pool. No-encounter failures restore map immediately. Return handler installed before trigger; fleeing/loss/win restore same map. No teleport to Psy City. Exact tapped NPC activated, touch drag canceled separately; click/tap supported in Pallet/interiors and later chapters, interact button preserved.
- Player copy: removed rare-drop calculation details and implementation/economy internals from seasonal/tower panels; preserve useful price, buff, timer, restrictions and Egg odds. Display names updated in costume picker. Approved art retained. New tower banner/Egg assets optimizedWebP.

Validation: seasonal-event.test.cjs, progression-tower.test.cjs, preview-regressions.test.cjs. Statistical candy sample14849/100000. VM tests cover uniqueness, aliases, check-in, incense cap/expiry, independent quota, city gate, paid keys, archive cost, replay, rewards once, full-HP Egg, costume prices, 20 lazy producer re-runs, canceled/battle return and tutorial target. Syntax checked for modified JS. Isolated mobile UI QA pages contain disposable in-memory profiles and do not load/write real saves.

Research applied (2026-11-05):
- https://developer.apple.com/design/human-interface-guidelines/game-controls — direct touch plus virtual controls.
- https://developer.android.com/guide/topics/ui/accessibility/views/apps-views — 48dp touch target guidance.
- https://gameaccessibilityguidelines.com/include-interactive-tutorials/ — contextual interactive instruction.
- https://create.roblox.com/docs/production/game-design/liveops-planning — monitor currency sources/sinks and event effects, preserve core loop.
- https://docs.unity.com/en-us/services/solutions/seasonal-events — seasonal currency/purchase/reward separation.
No claim that these sources specify a universal candy percentage. Prices are preview tuning, not validated long-term live economy. No claim to have played all100 floors or every campaign chapter.

Next verification: deploy branch preview and inspect real city menu/tutorial/shop, isolated mobile tower combat, shop costume preview and title/check-in. Record URL/commit and screenshots after browser verification.
