# Kanto Hunt Rift V1

## Reproduction

- Branch: `feature/kanto-hunt-rift-v1`
- Base commit: `75e91b4385c650d4deb0b824ea4e777d92aa61b6`
- Main at last fetch: `75e91b4385c650d4deb0b824ea4e777d92aa61b6`
- The branch is based directly on `origin/main`; no production database migration is included.

## Gameplay

- Wild victories in routes and caves may offer a temporary portal (8% roll; trainer battles and defeats do not qualify). An offer expires after 90 seconds and offers are rate-limited by a three-minute cooldown.
- Entering the authored `Fenda Selvagem` map starts a three-minute gathering session. At the deadline, the actual map renderer freezes the scene for 700 ms, cancels visual actions and fishing, then restores the saved map, position, and facing.
- Route and campaign controllers use the same timer/session manager. The campaign story HUD is hidden only inside the temporary map and returns on exit in both map controllers.
- Routes use seven separated Hobby spots; standard caves use nine; Mt. Moon uses eleven. Cave layouts include wall-side flowers, ore veins, and excavation cracks.
- The rift contains fifteen registered individual spots: five mining, three lumber, four gardening, and three treasure cracks. Its lake supports the existing fishing minigame.
- Mining, lumber, and gardening spots in the rift respawn individually after 3.5–5.5 seconds.

## Authority limitation

Treasure Hunter cracks in caves and the rift reuse the existing server-authorized `cave-1` through `cave-3` sites. Those sites currently retain their server cooldown of 3–6 minutes. They are not given a client-side fast respawn because that would bypass authoritative cooldowns and rewards. The rift does not add new server site IDs or change reward tables.

## Files

- `core/kanto-hunt-rift-v1.js`: shared offer/session timing.
- `core/kanto-campaign-playable-v1.js`, `core/kanto-world-v2.js`: portal offers, map entry, freeze, and return in the active map controllers.
- `core/hobbies-v2.js`, `core/treasure-hunt-v1.js`: route/cave/rift spot registrations and existing treasure-site synchronization.
- `assets/story/kanto-hunt-rift-v1.webp`: authored wide portal map.
- Focused tests under `tests/kanto-hunt-rift-v1.cjs`, `tests/hobbies-spot-effects-v1.cjs`, and `tests/kanto-route2-forest-v1.cjs`.

## Validation

Passed:

```text
node tests/kanto-hunt-rift-v1.cjs
node tests/kanto-route2-forest-v1.cjs
node tests/hobbies-spot-effects-v1.cjs
node tests/kanto-story-v49.test.cjs
```

Chromium exercised the production campaign controller at a deterministic successful wild-victory portal offer: opened Route 2, entered the rift, confirmed all 15 spots and hidden mission HUD, advanced the real controller clock to the closing frame, and confirmed return to the exact Route 2 coordinates with the HUD restored. No browser runtime errors occurred.

## Publication

Not yet published. The user has authorized the completed Kanto lot to publish after validation. Before pushing, fetch and compare `origin/main`; pushing to `main` triggers the linked Vercel production deployment. No Supabase migration is part of this change.
