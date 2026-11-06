import * as Rules from '../lib/capture-rules-v48.js';
const W=window,D=document;W.PsyCaptureRulesV48=Rules;
function install(){
 const data=typeof BALL_DATA!=='undefined'?BALL_DATA:W.BALL_DATA;if(data){for(const [name,chance] of Object.entries({'Pokéball':1,'Great Ball':1.5,'Premier Ball':3,'Super Ball':3,'Ultra Ball':5,'Halloween Ball':10,'Psyball':10})){data[name]={...(data[name]||{}),chance,premier:name==='Premier Ball'};}for(const t of Rules.ELEMENTS)data[t+' Ball']={...(data[t+' Ball']||{}),chance:6,premier:false};}
 W.psyCaptureBallMultiplier=(name,mon)=>Rules.ballMultiplier(name,mon);
 if(W.PsySeason&&!W.PsySeason.canCapture.__v48){const old=W.PsySeason.canCapture;const f=(mon,ball)=>ball==='Psyball'||ball==='Halloween Ball'||old(mon,ball);f.__v48=true;W.PsySeason.canCapture=f;}
 const create=W.createCapturedPoke;if(create&&!create.__psyBall48){const f=function(){const p=create.apply(this,arguments);if(p&&W.__psyCaptureBall48==='Psyball'){p.psyballCaught=true;p.captureBall='Psyball';}return p;};f.__psyBall48=true;W.createCapturedPoke=f;}
 const capture=W.tryCaptureBattle;if(capture&&!capture.__psyBall48){const f=async function(ball){const prior=W.__psyCaptureBall48;W.__psyCaptureBall48=ball;try{return await capture.apply(this,arguments)}finally{W.__psyCaptureBall48=prior;}};f.__psyBall48=true;f.__psyCaptureV40=true;f.__psyV26=true;f.__psyCaptureHotfixV26F=true;f.__psyCaptureModalV39=true;f.__offlineOriginal=capture.__offlineOriginal;W.tryCaptureBattle=f;}
 try{const img=D.getElementById('player-img');if(img)img.classList.toggle('psyball-aura-v48',!!P.team?.[0]?.psyballCaught);}catch(_){}
 // Retire direct shop sales of the Engineer's crafted elemental Balls.
 try{if(typeof SHOP_DG!=='undefined')for(let i=SHOP_DG.length-1;i>=0;i--)if(Rules.ELEMENTS.some(t=>SHOP_DG[i].n===t+' Ball'))SHOP_DG.splice(i,1);}catch(_){}
}
const css=D.createElement('style');css.textContent='.psyball-aura-v48{filter:drop-shadow(0 0 2px #fff) drop-shadow(0 0 5px #38f3ff) drop-shadow(0 0 10px #bc87ff)!important;outline:2px solid #72eaff88;outline-offset:3px;border-radius:14px}';D.head.appendChild(css);
install();W.setInterval(install,850);
