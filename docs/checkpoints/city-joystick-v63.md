# Psy City joystick V63

Live site: https://psyworld-murex.vercel.app/ . User requires direct main work and concrete browser validation.

Code: 65380378ce8becf852a7c5092ff8b7d4f75753b7, loader refresh 741c22a2e4455b58e649c5da44b4d0849f633746. Deployment dpl_63zkSatM74SQCCYiC2hDhEttu4jS READY; aliases include psyworld-murex.vercel.app.

Changes in core/legacy-runtime.js: removed duplicate fixed touch/mouse joystick event handlers. One captured Pointer Events owner now controls the dynamic invisible joystick from any free canvas point. Six-pixel dead zone, 48px floating radius, immediate direction change. Secondary pointers cannot steal or stop the owner. Release, pointer cancellation, lost capture, blur, resize, and document hiding stop input. Menus/NPC buttons keep their own input. Mouse primary dragging uses the same controller, permitting real Chromium drag checks. Kept click-drag suppression after a movement gesture.

City movement now integrates elapsed time at the existing nominal 600px/s and keeps fractional distance across tile boundaries; movement begins in the frame that selects its target. This removes the idle frame at each tile and the 30/60/120 FPS speed variation. A diagonal drag can slide along an unblocked secondary axis when its primary axis hits a collider. Collision geometry and the grid remain authoritative. Joystick is invisible, as requested.

Research: W3C Pointer Events latest https://www.w3.org/TR/pointerevents/latest/ . Applied explicit touch-action:none on canvas, pointer capture, and pointercancel/lostpointercapture cleanup.

Executed actual staged controller with event stubs: syntax compilation, right drag, mid-gesture upward direction change, second-pointer ownership, cancellation clearing all arrow keys, resume at a different origin, and blur cleanup all passed. Executed actual update(dt) with a disposable collision map: distance during two seconds equals 1200px at 30,60,120 FPS. Diagonal wall sliding passed; releasing input completed the current grid step and then did not drift.

Chromium: opened the exact immutable code deployment's tests/mobile-game-v53.html and prepared a disposable local Quaxly Lv5,243/243 HP. Used real browser drags over free canvas in all four directions. NPC camera projections moved by four 55px tiles per drag: right, up, down and left. Checked unchanged NPC projection after release and joystick display hidden. Starting a drag on an NPC hit area correctly did not move the trainer; repeated on free ground worked. No online account used. These were browser mouse Pointer Events checks plus touch/pointer lifecycle simulation, not a physical Android handset test.

Do not restore the fixed joystick, duplicate its touch listeners, or make city movement depend on pixels-per-frame. Preserve Cards, packs and all unrelated systems.
