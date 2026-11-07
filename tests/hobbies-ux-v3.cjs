/* node tests/hobbies-ux-v3.cjs */
const assert=require('node:assert/strict'),fs=require('node:fs');
const src=fs.readFileSync('core/hobbies-v2.js','utf8'),html=fs.readFileSync('index.html','utf8');
new Function(src);
assert(html.includes('>MATERIAIS</button>'));
assert(!html.includes('>CRAFT</button>'));
assert(!html.includes('src="core/hobbies-v1.js?'));
assert(html.includes('core/hobbies-v2.js?build=HOBBIES_FISH_TENSION_V3_20261107'));
assert(src.includes('f.red=red?f.red+dt:0;'),'Uninterrupted red tension rule');
assert(src.includes('fishingRun.meter=Math.min(1,fishingRun.meter+.045)'),'Tap interaction');
assert(src.includes('if(hit<5)'),'Five-hit mining and logging');
assert(src.includes('Math.random()*5'),'Randomized gathering respawn');
assert(src.includes('W.psyHobbyGrantFieldXp?.(18,8)'),'Trainer and Pokemon field XP');
assert(src.includes("j.id==='engineer'?BALLS.map"),'All Balls inside Engineer Hobby');
console.log('PASS: Hobbies UI, fishing and gather regression');
