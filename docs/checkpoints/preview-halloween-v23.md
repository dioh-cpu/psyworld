# Halloween V23 — test preview only

Base: `5ac8d5b4fcf8c1a638e1a3aeb974c3d6e7fa67ca`, branch `teste/kanto-pallet-rota1-v2` in `dioh-cpu/psyworld`. Public `main` is untouched. Keep Psy City, campaign skipping, approved Kanto artwork, Kanto starters and existing combat/progression.

## User rules

- NPC Amora is the only event reward shop. Event monster loot is candy, plus the rare-title and guaranteed event-Ball exceptions. Existing normal loot remains, including independent normal Ball drops.
- Halloween encounters: base 1%. Incense gives +10% relative for 1 hour (1.1%). No stacking/refresh exploit. Rare title doubles encounter chance and candy. Combined chance 2.2%.
- Soberano do Halloween base title chance: 0.0001% = probability 0.000001 per defeated Halloween creature. Only 10% of ordinary Drop bonus applies: `0.000001 * (1 + max(0, DropPercent) * 0.10 / 100)`. No ordinary Drop bonus to candy. Only one equipped title; effects never stack across titles.
- Halloween Ball capture multiplier is exactly twice the actual Ultra Ball multiplier (normally 6 vs 3). Existing capture ceilings, rarity penalties, trainer/gym prohibitions and turns are preserved.
- Full-heal consumable only from event shop. Legacy full-heal inventory converts 1:2 into 50% potions. Ordinary fixed-value potions also cannot restore more than 50% maximum HP. Revive and healing services/skills are separate.
- Independent rolls: no quota truncates item types per enemy. Shared Craft/Quest base chances halved; normal Ball probabilities are 1.2% / 0.6% / 0.3% / 0.1% before Drop (maximum 2x); Fast applies half. Normal Ball rolls are independent from the guaranteed Halloween Ball roll.

## Balance

Normal monsters may drop one candy: Wild/Hunt 15%, Fast/Adventure 8%, World 4%, Survivor/legacy Idle 1.5%, Gym 12%. Different rates compensate for kill throughput, not species. Halloween creatures drop guaranteed level-scaled candy: levels 1–10 give 3–5, 11–20 give 4–7, ... 91–100 give 12–23; no further increase beyond current public cap. Rare title doubles this; shop candy title adds 10% via unbiased stochastic rounding.

Shop: 10 Halloween Balls for 100 candy, 100% potion 20, incense 300; titles +5% capture / +5% map speed 250 each, +10% candy 350; four non-basic costume categories 400/600/900/1500, unlocked for all six trainers. Basic remains free. A legacy selected costume remains owned. Soberano now also costs 2,000 candy, per later user steering; its rare drop remains. Purchased cosmetics/titles and captured art survive season disable.

## Artwork and integration

- Generated candy, capture capsule, potion and incense sprites; transparent, optimized WebP.
- Canonical Gengar/Pikachu costume generation was rejected by the image provider. Used the user's explicitly authorized original-creature alternative: Luminox, Noctilume, Brumelo and Corujack. Original event forms use existing Vulpix/Zubat/Nidoran/Pidgey combat records, not newly implemented canonical species. Capture keeps form metadata/name/type. They appear at 1% in Route 1 through pre-Misty areas and early Kanto Hunts (bands 0–1 / tiers 1–2), not later chapters or other regions. Only Halloween Ball works on them. Each defeated event creature drops 5–10 Halloween Balls in an independent guaranteed roll, in addition to candy and rare-title roll. Shiny costs 1,000 candy; Mega costs 5,000; combining both pays each cost once. Ordinary evolution and Shiny/Mega stone routes redirect/block; no free heal/revive during transformation. Existing Mega trainer gates remain (100 normal / 200 Shiny Mega). No automatic wild Shiny/Mega event form: these come from candy transformation.
- Static Ghost decorations cover generations 1–9; no generic ghost fallback substituted for missing Pokémon artwork.
- Removable `PsySeason` config/theme layer; architecture and acquired items remain. Halloween music already existed and remains integrated; disabling season switches that track back to default.
- Seasonal dialogue/panel accents, bat silhouette, floating-text glow, unique title particles, 1-second nonblocking encounter intro and original 1.05-second SFX using existing volume/mute controls. Reduced-motion alternative.
- Loot receipt auto-opens, aggregates bursts for 400ms, keeps every different item in its receipt, and supports scroll/history. Independent from battle controls.
- Config: hide other trainers, titles, and trainers' Pokémon display. Does not hide wild Pokémon or story NPCs. The legacy Tela / Dispositivo screen also exposes the three settings. Current World peer renderer only has a Pokémon name label; that display is hidden by the third option. Remote titles use whitelisted identifiers, never arbitrary HTML.

## Verification

`node tests/seasonal-event.test.cjs` validates purchase bounds, deductions, unique unlocks, incense expiry/nonstacking, exact rare-title boundary and percentage conversion, Drop immunity of candy, title multipliers, form persistence, excluded trainer/gym/boss encounters, full-heal migration, ordinary-heal cap, independent loot setup and season toggle. Seeded 100,000 normal wild kills produced 14,849 candy drops (15% target). All edited JS passes syntax checks; animated WebP dimensions/alpha/frame counts and WAV duration checked.

Every form has optimized animated WebP plus a reusable padded atlas: 640×640 cells, inner 240×240 frame, 200 transparent pixels on each side. One union crop/scale is used for all frames in each animation. Shiny/Mega/Shiny Mega art is separate; final Megas use a second, more elaborate divine/chaotic art pass requested by the user. `assets/events/halloween/frames.json` records crop rectangles. Atlases never load in normal gameplay.

`tests/halloween-preview.html` is an explicitly marked temporary-profile visual test surface, with no real save writes. It is not the real game flow or a claim of a completed campaign playthrough. Preview economy is client-side like the existing game; no backend anti-cheat redesign is included.

References consulted (design references only, not claimed universal drop percentages or verified population rankings):
- https://wiki.pokexgames.com/index.php?mobileaction=toggle_view_mobile&title=Halloween — event NPCs, workshops, outfits, invasion tokens.
- https://www.pokexextreme.online/index.php?id=76&page=home — 2 tokens normal / 5 shiny-mega on event invasions and NPC trades.
- https://www.padventures.org/index.php/news — official event reward context; no universal Halloween candy rate found.

Browser verification: actual Psy City entry and Amora shop opened; temporary QA profile purchase deducted 100 candy, Shiny deducted 1,000 and Shiny Mega deducted another 5,000. All 16 animated form URLs loaded successfully. Final follow-up exposes visibility options through the mobile legacy settings entry and shows real costume art in the shop.

Final verification (2026-11-05): code preview https://psyworld-6r2rfhr2c-world-of-monsters.vercel.app/ at commit b4dbe96ec30b3ee792e131141bf2c8fd44103684. Main-game local login, trainer selection, city entry and NPC shop checked. Tela / Dispositivo exposes all three visibility settings; hiding titles changes the actual checkbox state. Isolated 390px mobile shop screenshot saved as halloween-mobile-proof-20261105.jpg; no horizontal clipping observed. No full live campaign/continuous-hunt playthrough claimed. Public production was not promoted.
