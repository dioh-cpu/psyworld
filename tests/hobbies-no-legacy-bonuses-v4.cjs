/* node tests/hobbies-no-legacy-bonuses-v4.cjs */
const assert=require('node:assert/strict'),fs=require('node:fs');
const script=fs.readFileSync('core/professions-v1.js','utf8');
const index=fs.readFileSync('index.html','utf8');
new Function(script);
assert(script.includes("function bonus(s,k,mon){if(s==='main')return 0;"),'Old main profession buffs must not stack with Hobbies');
assert(script.includes("const oldButton=D.getElementById('psy-prof-launch');if(oldButton)oldButton.style.display=W.__psyIdleActive?'':'none'"),'Old launcher hidden during main gameplay');
assert(script.includes("b.textContent='⚙ Hobbies'"),'Old profession classification removed from launcher');
assert(script.includes("D.getElementById('psy-prof-buffs')?.remove();return;"),'Obsolete buff bar should be hidden');
assert(script.includes("if(s!=='idle')return W.PsyHobbies?.open?.()"),'Main career entry redirected to Hobbies');
assert(index.includes('core/professions-v1.js?build=HOBBIES_LEGACY_BUFF_ISOLATION_V4_20261107'));
console.log('PASS: main uses Hobbies bonuses without stacking retired career stats; idle state preserved');
