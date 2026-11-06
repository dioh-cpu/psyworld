# PSYWORLD preview checkpoint — Halloween tuning V28 — 2026-11-05

Scope: dioh-cpu/psyworld, teste/kanto-pallet-rota1-v2 only. Parent 836c1c8808a867f211569181bfab10f06f934769. Main/public production untouched.

User request: Halloween Egg minimum1000 candies; slower natural Halloween creature animation; walk the actual browser maps to check collisions.

Changes: Halloween Egg active cost1000 in both seasonal catalog and authoritative event catalog; archived factor3 =>3000. Existing owned Eggs preserved. All16 animated Halloween creature WebPs remuxed from160ms to280ms per frame (43% lower playback rate); no re-encoding, dimensions, frame count, pixel colors, transparency or byte size changed. frames.json durationMs updated. Script references refreshed in index and disposable tower fixture.

Validation: three regression suites pass. Added assertions for active Egg debit1000, 999-candy refusal, archived Halloween debit3000 and catalog consistency. Decoded every original and changed frame with Pillow: all pixels identical and each changed duration280ms.

Browser walking on existing preview de0a86c: Teste Eros disposable save, Kai/Bulbasaur. Walked plaza→north stairs→laboratory corridor; entered lab, walked around furniture, spoke to professor, returned through door, walked west then north, and used physical exit to Route1. Tapped a trail destination: moved from108,409 to188,265. Tapped grass destination: moved via staircase to203,156; walked within grass to289,156. No unintended teleport or collision blockage observed on those routes. No geometry changed without a reproduced defect. Connectivity check on actual map polygons found reachable cells within3 pixels of all six Pallet doors, north exit, Route1 cave/exit, and all four grass entry points. This is not a claim that every boundary or late campaign map was walked.

Previous V26 tower/title/menu/tutorial repairs preserved. Authenticated two-account presence remains unverified. No Android artifacts generated. New V28 preview URL to be obtained from deployment status for this commit after publish.

## Browser follow-up V29
V28 deployment READY: https://psyworld-2c78k2gzo-world-of-monsters.vercel.app/. Actual mobile shop displayed1000, purchase charged1000 (tower balance100000→99000). Found stale seasonal shop balance until reopen; V29 refreshes seasonal panel immediately after successful delegated Egg purchase. Three regression suites and syntax passed again. V29 source loads a new seasonal script revision. Latest authoritative preview is the deployment for the commit containing this follow-up; V28 sprites and egg prices are preserved.
