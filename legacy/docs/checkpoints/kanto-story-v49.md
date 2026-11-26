# Kanto story V49 — validated checkpoint (2026-11-06)
Authoritative functional commit: 3e3bc11e5a9281553168e933f6f6a3b22d1853c1
Branch: teste/iniciais-oficios-v38
Verified preview: https://psyworld-o4q0jb2u3-world-of-monsters.vercel.app/
Vercel deployment dpl_Fj5Ee4cNUbbYNuCC7VbSwntuFAua READY. Production/main untouched. Android paused.

User steering: make first professor quest immersive and visible; connect cinematic arrival in Pallet, departure and Route1 arrival; preserve all V48 systems in preview for testing.

Implementation: core/kanto-story-v49.js/.css, direct actual open()/talk() hooks in core/kanto-world-v2.js. Three arrival beats; four departure/route arrival beats; professor five baseline beats plus chosen response (six total), two genuine response branches, personalized trainer/partner names, approved landscape/laboratory/portrait art, gentle image pan/crossfade and progressive dialogue with manual reveal. Reduced motion supported. Quest completes only final acceptance; continue-later and Escape do not complete professor quest. One-time seen flags preserve prior progression and offer new professor cinematic to older profiles without it. Movement/path/AutoHunt pause during story; covered campaign canvas stops rendering until story ends.

Root cause: PsyGuide z10000100 was below campaign2147483646. Shared guide and story modal now display above campaign. Existing introduction/tutorial also raised. Stopping AutoHunt no longer calls exitDoor unless activating it: conversation stays in lab. Companion launcher moved above hunt button; trails keyed by species selection AND scene so background city redraw cannot reset campaign trail.

Browser evidence:
- Real Pallet arrival with artwork/title/body/Continue. Held Right during scene: world position505,388 unchanged.
- Professor interaction in actual laboratory invokes cinematic, dynamic Quaxly line and both choices. Selected partner-care response names Quaxly.
- Quest remains Fale com o Professor throughout conversation, advances to Atravesse a Rota1 only final ACEITAR A PESQUISA.
- Four departure/Route1 beats visibly played, returning control to route afterward.
- Final build: professor starts while header remains Laboratório. CONTINUAR DEPOIS closes scene, keeps laboratory and pending first quest.
- Mobile390x800 iframe: full heading, text, Continue and skip visible/readable without horizontal dialogue overflow.
- See V48 checkpoint for store/pass/automation/capture/analyzer/craft/follower browser acceptance.

Validation:20/20 tests/*test.cjs passed, including new kanto-story-v49 suite proving actual entry hooks, valid scene assets, personalized copy, choices and deferred quest completion. Existing starter HP fixes, menu dedupe, Route1, towers, professions, capture ceilings and pass tests retained.
Proofs: docs/screenshots/professor-v49.jpg, pallet-mobile-v49.jpg, companion-v49.jpg. Browser fixtures: tests/kanto-story-v49.html, kanto-story-mobile-v49.html and session-commerce-v48.html; disposable/local supplies only. Main index has no test supplies or QA controls.

Limits: story scenes use illustrated pans/dialogue, not video/cutscene actor animation. Full location introductions play on first visit, professor full conversation once with later normal conversation retained. Companion art supports all1025 base species normal/Shiny; Mega and Halloween forms intentionally unavailable until compatible walking artwork. Real-user payment flow was not exercised in browser; server-side transaction/idempotency integration was tested with rollback as noted in V48. No fabricated rare drop awarded for QA.
