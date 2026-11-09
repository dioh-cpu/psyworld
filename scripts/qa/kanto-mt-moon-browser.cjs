const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {boot,close,choose}=require('./kanto-v4-journey-browser.cjs');
const out='/workspace/artifacts/kanto-mt-moon';fs.mkdirSync(out,{recursive:true});
async function waitWorld(p,id){await p.waitForFunction(id=>window.PsyKantoPlayableV1.getPosition()?.world===id,id,{timeout:20000});}
async function enterFromRoute3(p){
 await p.evaluate(()=>window.PsyKantoPlayableV1.navigateObjective({x:29,y:13}));
 await p.waitForFunction(()=>window.PsyGuide.isOpen()&&document.body.innerText.includes('Capítulo concluído'),null,{timeout:25000});
 await choose(p,'SEGUIR PARA MONTE LUA');await waitWorld(p,'mt-moon');
 const pos=await p.evaluate(()=>window.PsyKantoPlayableV1.getPosition());assert(Math.abs(pos.x-16)<.01&&Math.abs(pos.y-2)<.01,'arrival uses the cave entrance');
}
async function fight(p,role,expectedStage){
 await p.locator('[data-kp-route-footer]').click();
 await p.waitForSelector('#battle-screen.active',{timeout:25000});
 await p.waitForFunction(()=>document.querySelector('#kanto-moon-rocket-badge')||!document.querySelector('#battle-screen.active'),null,{timeout:2000}).catch(()=>{});
 const battleMeta=await p.evaluate(()=>({enemy:document.querySelector('#enemy-name-tag')?.textContent,quest:P.psyKantoCampaignV1.places['mt-moon'].moonQuest}));
 assert(battleMeta.enemy?.includes(role==='scout'?'Zubat':'Raticate'),`expected ${role} Rocket battle, got ${JSON.stringify(battleMeta)}`);
 // Disposable QA player; retain the real battle UI/action and real win callback.
 await p.evaluate(()=>{P.team[0].hp=99999;P.team[0].maxHp=99999;battleData.wildHp=1;});
 await p.evaluate(()=>document.querySelector('#move-buttons button')?.click());
 await p.waitForFunction(()=>!document.querySelector('#battle-screen.active'),null,{timeout:10000});
 await p.waitForFunction(stage=>P.psyKantoCampaignV1.places['mt-moon'].moonQuest?.stage===stage,expectedStage,{timeout:5000});
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const results=[];
 try{
  const viewports={desktop:[{width:1280,height:800}],portrait:[{width:390,height:844}],landscape:[{width:844,height:390}]};
  for(const viewport of (viewports[process.env.KANTO_QA_VIEWPORT]||[{width:1280,height:800},{width:390,height:844},{width:844,height:390}])){
   const{ctx,p,errors}=await boot(browser,viewport);await close(p);
   await p.evaluate(()=>{
    P.gymProgress=[...new Set([...(P.gymProgress||[]),'kanto_brock'])];
    P.team[0].hp=99999;P.team[0].maxHp=99999;
    P.psyKantoCampaignV1={places:{'route-3':{talked:true,storyDone:true,found:[],solved:[]}},active:'route-3'};
    localStorage.setItem('psy_kanto_journey_progress_v1',JSON.stringify({visited:['pallet','route-1','viridian','route-2','viridian-forest','pewter','route-3']}));
    window.PsyKantoPlayableV1.open('route-3',{spawn:{x:3,y:13}});
   });
   await waitWorld(p,'route-3');await enterFromRoute3(p);
   const cave=await p.evaluate(()=>({stage:(()=>{const r=document.querySelector('.kp-stage').getBoundingClientRect();return {width:r.width,height:r.height}})(),canvas:(()=>{const e=document.querySelector('#psy-kanto-canvas');return {width:e.width,height:e.height,cssWidth:e.getBoundingClientRect().width,cssHeight:e.getBoundingClientRect().height}})(),title:document.querySelector('.kp-title b').textContent}));
   assert.equal(cave.title,'Monte Lua');assert(cave.stage.width>200&&cave.stage.height>150);assert(cave.canvas.cssWidth>200&&cave.canvas.cssHeight>150);
   if(viewport.width===1280)await p.screenshot({path:out+'/cave-entry.png'});
   // Real cave return passage, then walk Route 3 back to its north/east gate.
   await p.keyboard.press('KeyE');await p.waitForFunction(()=>window.PsyGuide.isOpen()&&document.body.innerText.includes('Voltar pelo caminho'));
   await choose(p,'VOLTAR');await waitWorld(p,'route-3');
   await p.evaluate(()=>window.PsyKantoPlayableV1.navigateObjective({x:29,y:13}));
   await p.waitForFunction(()=>window.PsyGuide.isOpen()&&document.body.innerText.includes('Capítulo concluído'),null,{timeout:25000});
   await choose(p,'SEGUIR PARA MONTE LUA');await waitWorld(p,'mt-moon');
   // Mission is driven by the production objective/Auto Route button.
   await p.locator('[data-kp-route-footer]').click();await p.waitForFunction(()=>window.PsyGuide.isOpen()&&document.body.innerText.includes('Miguel:'));
   await close(p);await p.locator('[data-kp-route-footer]').click();
   await p.waitForFunction(()=>P.psyKantoCampaignV1.places['mt-moon'].moonQuest?.stage==='tracks-found',null,{timeout:20000});
   await close(p);
   if(viewport.width===1280)await p.screenshot({path:out+'/fossil-gallery.png'});
   // Fleeing the first guard does not grant progress; victory advances once.
   await p.locator('[data-kp-route-footer]').click();await p.waitForSelector('#battle-screen.active',{timeout:20000});
   await p.evaluate(()=>document.querySelector('#battle-screen button[onclick*="flee"]')?.click());
   await p.waitForFunction(()=>!document.querySelector('#battle-screen.active'),null,{timeout:5000});
   assert.equal(await p.evaluate(()=>P.psyKantoCampaignV1.places['mt-moon'].moonQuest.stage),'tracks-found');
   await fight(p,'scout','scout-defeated');
   await fight(p,'leader','complete');
   const persisted=await p.evaluate(()=>{window.autoSave?.();return JSON.stringify(P.psyKantoCampaignV1.places['mt-moon'].moonQuest)});
   await p.reload({waitUntil:'domcontentloaded'});
   await p.waitForFunction(()=>typeof P!=='undefined'&&P.psyKantoCampaignV1?.places?.['mt-moon']?.moonQuest?.stage==='complete',null,{timeout:15000});
   await p.evaluate(()=>window.PsyKantoPlayableV1.open('mt-moon',{resume:true}));await waitWorld(p,'mt-moon');
   assert.equal(await p.evaluate(()=>P.psyKantoCampaignV1.places['mt-moon'].moonQuest.stage),'complete');
   await p.evaluate(()=>window.PsyKantoPlayableV1.navigateObjective({x:16,y:30}));
   await p.waitForFunction(()=>window.PsyGuide.isOpen()&&[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='SEGUIR PARA ROTA 4'),null,{timeout:25000});
   await choose(p,'SEGUIR PARA ROTA 4');await waitWorld(p,'route-4');
   assert.equal(errors.length,0,errors.join('\n'));
   results.push({viewport,route3ToCave:true,caveReturn:true,objectiveAutoRoute:true,rocketFleeNoProgress:true,rocketWins:['scout-defeated','complete'],reloadPersistence:true,route4Unlocked:true,errors});
   await ctx.close();console.log('PASS',viewport);
  }
  fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
