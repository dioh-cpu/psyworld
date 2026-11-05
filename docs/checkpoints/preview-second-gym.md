# PSYWORLD preview checkpoint — 2026-11-05
Branch: teste/kanto-pallet-rota1-v2. Production/main must remain unchanged.
Implemented: shared anchored dialogue/tutorial guide with speaker artwork, dimmed background, target highlight, arrow, Continue/Back/Skip. Integrated city NPCs, city tutorial, Pallet dialogues and early Kanto chapters.
Prepared existing Library artwork as WebP, retaining source dimensions: Viridian, Pewter, Mt Moon, Cerulean, Brock/professor expression sheets and both gym arenas.
Chapter scope: Viridian → Route 2 → Viridian Forest → Pewter/Brock → Route 3 → Mt Moon/Rocket → Route 4 → Cerulean/Misty.
Story objectives replace random species registration requirements for this scope. Gyms retain existing actual battle/victory checks, team levels and progression gates. Optional mysteries and later locations remain.
Navigation: painted city maps use authored walkable grid corridors. Other route maps retain native terrain generation. Every required NPC, story object, service and exit passed graph reachability checks. Return paths and healing/shop services are available in city hubs.
Performance: cached static regional terrain, existing shared walk atlas, throttled idle rendering, lazy region art, cached city paving tiles, dialogue listeners cleaned on close.
Auto Find/quests and VIP Auto Hunt integrate with the regional engine. Trainer-owned Rocket encounters block capture.
Preserve: Psy City entry, Kanto-only initial choices, skippable intro, one-hour new-profile VIP, invisible touch controls, removed Idle access.
Validation: JavaScript parse checks; reachability on all eight places; story completion and Brock/Misty victory gates simulated. Full live combat playthrough and all-device visual review are not yet certified.
