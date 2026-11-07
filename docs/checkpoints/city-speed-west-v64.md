# Psy City V64 — speed and west edge

User report: walking too fast; bug going left. Reference video 1000348337.mp4 (48.97s). Examined contact sheets and frames around 43–49s. Around 47s the seasonal map disappears to a purple background and returns. The city rendering had a position cutoff independent of the movement checks.

Code commit: 0e38019b44a7e8a205eef19f599cdde77053336c. First tested on fix/city-west-speed-v64, then fast-forwarded main to the identical tested commit with expected-head protection. Main remains the user's requested delivery branch.

Changes:
- Base city walking speed 600→240 px/s (60% lower). Elapsed-time integration and carry remain; speed buffs retained.
- Stable town origin at tile 25,25 instead of deriving the entire map from the last saved player position.
- Shared PsyCityGeometry bounds used by authoritative movement and saved-position recovery. Existing obstacle collision retained. Invalid or outside saved positions return to the nearest valid walkable tile.
- City rendering no longer switches off solely because the player's coordinates leave a separate visual cutoff.
- Cache tags CITY_WEST_SLOW_V64 and CITY_BOUNDARY_STABLE_V64.
- Internal disposable QA scenario tests/city-west-v64.html prepares x13,y29 near the west edge and exposes a setup button to simulate an outside saved position. It is not linked from player menus.

Validation:
- Both modified source scripts compiled.
- Executed actual captureOrigin, geometry helpers and update(dt). For 30/60/120 FPS, eight seconds holding left in the open y29 lane stopped at x11,px605. Reversing right for two seconds moved exactly480px at each frame rate.
- Invalid saved x positions -100,0,10,40,59,100,NaN were recovered to valid non-solid tiles.
- Browser preview dpl_C7PZfryA493ynsWHxtWZf1pv7BcU READY: prepared disposable profile at13,29; dragged left to11,29; repeated left drag remained11,29 with the city visible; dragged right and observed return; simulated saved x10 and observed recovery to11,29 with the city still drawn. No online account used. Browser mouse Pointer Events tests, not a physical phone run.
- Production deployment dpl_HhcBP2RgXCaKWmDguEYEvMM352dR READY, code0e38019, alias psyworld-murex.vercel.app. Opened the normal root and verified both V64 script tags.

Continue using https://psyworld-murex.vercel.app/ as the user-facing main URL. Preserve invisible dynamic joystick, Cards/packs, all starters and other systems. Do not claim every bug is resolved from deployment readiness alone.
