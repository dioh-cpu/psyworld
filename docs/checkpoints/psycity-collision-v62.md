# Psy City collision V62

User correction: work directly on main; primary live URL is https://psyworld-murex.vercel.app/.

Code commits: e750b2179117102dca6fa6bab30bd086f7673917, 23a94f1df1be6af6c330da080da0febfaa1951aa, 6283bad0ecb05783d70c12c8d893922f2392ac36.

Removed the V61 absolute tile bounds (15..45) from legacy-runtime.js because they conflicted with city-halloween.js's bounds relative to the saved city origin. City now has one origin-relative perimeter.

Reduced house collision from 7x5 tiles to the 5x3 ground base shifted down one tile; roofs/overhangs no longer block paving. Reduced NPC blockers from three tiles to one feet tile. Preserved center crossing and current town art.

Validation: executed the actual captureOrigin collision function with a disposable origin at 25,25. Spawn and its four immediate directions are free. BFS found 722 connected walkable cells inside the perimeter; each of six NPCs has a reachable adjacent tile.

Browser: Vercel deployment dpl_3vsobv2Zev6cPqXQjtnh7khAd1RQ READY, main code 6283bad0. Opened its actual tests/mobile-game-v53.html fixture in Chromium, prepared a disposable Quaxly Lv5 (243/243). Observed camera/NPC positions changing by one 55px tile for north, south, east and west inputs. This was a desktop fixture, not a physical phone. Did not claim a complete browser patrol of all streets; connectivity was checked by the geometry BFS.

Live alias confirmed by Vercel: psyworld-murex.vercel.app. No online account was used in validation. Keep Cards, packs, starter choices and unrelated systems intact.
