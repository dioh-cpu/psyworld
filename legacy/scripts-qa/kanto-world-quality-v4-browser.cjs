const {chromium}=require('playwright'),assert=require('node:assert/strict');
const origin=process.argv[2]||'http://127.0.0.1:4173';
(async()=>{const b=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const results=[];
try{for(const viewport of [{width:1280,height:800},{width:390,height:844},{width:844,height:390}]){
 const ctx=await b.newContext({viewport,hasTouch:true});await ctx.addInitScript(()=>localStorage.setItem('psy_kanto_journey_progress_v1',JSON.stringify({visited:['viridian','route-2']})));
 await ctx.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());console.log('START',viewport);const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(origin,{waitUntil:'domcontentloaded',timeout:15000});console.log('LOADED');await p.locator('#nick-input').fill('V4 QA');await p.getByText('▶ COMEÇAR',{exact:true}).click();await p.getByText('Kai',{exact:true}).click();await p.getByText('ENTRAR NA CIDADE',{exact:true}).click();await p.waitForTimeout(2200);
 await p.evaluate(()=>{P.name='V4 QA';P.playerCharacterId='adventure_boy';P.inventory={};P.meta={essentialGuideV56:{done:true,step:5,revision:2},psyCinematicTutorialSeen:true,tutorialSeen:true,kantoStoryV49:{seen:{route2Arrival:true}}};P.team=[];window.PsyKantoPlayableV1.open('route-2');window.PsyKantoStoryV49?.close(false);window.closeTutorial?.();window.PsyGuide?.close();document.querySelector('#login-screen')?.remove();});
 console.log('OPENED');await p.waitForTimeout(1200);
 await p.evaluate(()=>{window.PsyGuide.close();window.__samples=[];let i=0;function sample(t){const pos=window.PsyKantoPlayableV1.getPosition();window.__samples.push({t,...pos});if(i++<90)requestAnimationFrame(sample)}requestAnimationFrame(sample)});
 await p.keyboard.down('ArrowRight');await p.waitForTimeout(500);await p.keyboard.up('ArrowRight');await p.waitForTimeout(150);
 const movement=await p.evaluate(()=>{const a=window.__samples;let maxStep=0;for(let i=1;i<a.length;i++)maxStep=Math.max(maxStep,Math.hypot(a[i].x-a[i-1].x,a[i].y-a[i-1].y)*28);return{distance:(a.at(-1).x-a[0].x)*28,maxStep,pos:window.PsyKantoPlayableV1.getPosition()}});
 console.log('MOVEMENT',movement);assert(movement.distance>40&&movement.distance<100,JSON.stringify(movement));assert(movement.maxStep<20,JSON.stringify(movement));
 await p.evaluate(()=>window.PsyKantoPlayableV1.navigateObjective({x:12,y:15}));await p.waitForTimeout(2700);
 const dialog=await p.evaluate(()=>({guide:window.PsyGuide.isOpen(),text:document.body.innerText.slice(-600),pos:window.PsyKantoPlayableV1.getPosition(),state:window.PsyKantoPlayableV1.progress().places['route-2']}));
 assert(dialog.state.talked,JSON.stringify(dialog));assert(dialog.text.includes('agarrou a alça'),JSON.stringify(dialog));assert.equal(errors.length,0,errors.join('\n'));
 results.push({viewport,movement,caioQuestStarted:true,errors});await ctx.close();
}console.log(JSON.stringify(results,null,2));}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
