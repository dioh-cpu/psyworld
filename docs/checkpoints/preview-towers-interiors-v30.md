# PSYWORLD preview V30 — 2026-11-05

Only dioh-cpu/psyworld branch teste/kanto-pallet-rota1-v2. Parent c0bb3fa277e2b78742f5d3314e507112e4fce6d8. No production/main changes; no Android requested.

## User decisions and implementation
- Halloween tower now has unlimited generated floors. Four independently saved modes: Normal, Inferno, Pesadelo, Purgatório. Clearing floor100 in previous mode unlocks the next. Each mode can continue beyond100; earlier floors are replayable. Enemy HP/ATK multipliers1/2/4/8; reward multipliers1/1.5/2/3. Existing progress is Normal; no reset.
- Entry requires trainer level10 and3–6 selected living compatible Pokémon, each level10+. Minimum three level10 starter team wins floor1 in deterministic test. Tower HP remains isolated from main team. Genuine18-type resistance/immunity/dual-type rules replace primary-type-only advantage. Combat permits720 actions to avoid premature six-member timeouts.
- Ten free victories/day/event shared across difficulties. Failure/abandon returns the precise original free entry or floor/event/mode-specific paid key once. Duplicate settlements do not grant another refund/reward. Keys cannot cross modes. Prior-day failures refund prior day only. Additional key pricing still exceeds maximum reward.
- Separate Torre Elemental entry with18 branches, one/type. Same mode progression and entry gates. Rewards: Gold, matching existing Craft essence/material and Relíquia [type]; relics sell in tower reward shop for100 Gold each, consuming copies. Existing materials remain protected by ordinary shops. Gold uses P.gold; other rewards use main inventory.
- Halloween types remain Luminox Ghost/Fire, Noctilume Ghost/Flying, Brumelo Ghost/Poison, Corujack Ghost/Flying. Main combat resolver preserves form types rather than underlying species. Tower and Wiki expose the full effectiveness matrix and four Halloween forms.
- Auto Hunt browser test exposed waypoint oscillation at slow frames on path to second grass field. Actual movement now caps travel at remaining distance and reaches a waypoint before advancing. Tests navigate to all4 Route1 fields at60/24 FPS and120ms frame time. Manual controls preserved. VIP/HP restrictions retained.
- Six new independently generated illustrated interiors: lab, center, market, home, house-east, house-west. Project assets at assets/kanto/interiors/*-v30.webp (720x1080, rendered to480x720 game coordinates). Furniture collision footprints and NPC positions match the new layouts. Camera covers and tracks player at closer zoom instead of shrinking entire room to53%. Old procedural room paintings are bypassed for these maps; art loads lazily. Professor Auto Find target updated to actual new position.
- V29 Egg1000 active/3000 archived,16 slower280ms creature animations, all previous fixes preserved.

## Validation before browser QA
Six suites pass: seasonal, progression, preview regressions, towers-v30, auto-hunt-navigation-v30, interiors-v30. Seven modified/new scripts pass syntax. Tests cover mode gates, multipliers, >100 floors, minimum roster, refund once/free/key, isolated HP, all18 elemental branches and reward sale, dual-type immunities, NPC/exit reachability and solid furniture in all6 interiors.
Isolated disposable QA pages: tests/event-tower-mobile-preview.html (actual tower combat), tests/kanto-interiors-preview.html (actual map renderer/navigation, no combat and no real save reads/writes). No claim to have played every infinite floor. Authenticated two-account presence remains unverified.

Browser QA and deployment URL to be recorded after branch deploy. No user-facing artifact ZIP generated in this iteration; GitHub/Vercel preview is the delivery target.
