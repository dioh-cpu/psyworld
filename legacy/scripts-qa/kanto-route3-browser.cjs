const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const origin=process.argv[2]||'http://127.0.0.1:4173',out='/workspace/artifacts/kanto-route3';fs.mkdirSync(out,{recursive:true});
const {boot,close,choose}=require('./kanto-v4-journey-browser.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']}),results=[];
 try{
  for(const viewport of (process.env.KANTO_QA_SINGLE?[{width:1280,height:800}]:[{width:1280,height:800},{width:390,height:844}])){
   const{ctx,p,errors}=await boot(browser,viewport);
   await close(p);
   await p.evaluate(()=>{
    P.gymProgress=[...new Set([...(P.gymProgress||[]),'kanto_brock'])];
    P.psyKantoCampaignV1={places:{pewter:{talked:true,storyDone:true,found:[],solved:[]}},active:'pewter'};
    localStorage.setItem('psy_kanto_journey_progress_v1',JSON.stringify({visited:['pallet','route-1','viridian','route-2','viridian-forest','pewter']}));
    window.PsyKantoPlayableV1.open('pewter',{skipGuard:true});
   });
   await p.waitForFunction(()=>window.PsyKantoPlayableV1.getPosition()?.world==='pewter');
   await close(p);
   await p.evaluate(()=>window.PsyKantoPlayableV1.navigateObjective({x:30,y:11}));
   await p.waitForFunction(()=>window.PsyGuide.isOpen(),null,{timeout:18000});
   await choose(p,'SEGUIR PARA ROTA 3');
   let pos=await p.evaluate(()=>window.PsyKantoPlayableV1.getPosition());assert.equal(pos.world,'route-3');assert(Math.abs(pos.x-3)<.01&&Math.abs(pos.y-13)<.01,'Route 3 arrival aligns with the authored west entry');
   const scene=await p.evaluate(()=>({stage:(()=>{const r=document.querySelector('.kp-stage').getBoundingClientRect();return {width:r.width,height:r.height}})(),canvas:(()=>{const e=document.querySelector('#psy-kanto-canvas');return {width:e.width,height:e.height,cssWidth:e.getBoundingClientRect().width,cssHeight:e.getBoundingClientRect().height}})()}));
   assert(scene.stage.width>200&&scene.canvas.cssWidth>200&&scene.canvas.cssHeight>160);
   if(viewport.width===1280)await p.screenshot({path:out+'/route3-desktop.png'});
   await p.keyboard.press('KeyE');
   await p.waitForFunction(()=>window.PsyGuide.isOpen()&&document.body.innerText.includes('Voltar pelo caminho'));
   await choose(p,'VOLTAR');
   await p.waitForFunction(()=>window.PsyKantoPlayableV1.getPosition()?.world==='pewter');
   await p.evaluate(()=>window.PsyKantoPlayableV1.navigateObjective({x:30,y:11}));
   await p.waitForFunction(()=>window.PsyGuide.isOpen()&&[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='SEGUIR PARA ROTA 3'));
   await choose(p,'SEGUIR PARA ROTA 3');
   pos=await p.evaluate(()=>window.PsyKantoPlayableV1.getPosition());assert.equal(pos.world,'route-3');assert(Math.abs(pos.y-13)<.01);
   // Use the real mission IR control; it walks to Davi and opens his dialogue.
   await p.locator('[data-kp-route-footer]').click();
   await p.waitForFunction(()=>window.PsyGuide.isOpen()&&document.body.innerText.includes('Escoteiro Davi'),null,{timeout:24000});
   const daviDialog=(await p.locator('body').innerText()).includes('Monte Lua');assert(daviDialog);
   await close(p);
   await p.waitForFunction(()=>window.PsyKantoPlayableV1.getPosition()?.world==='mt-moon',null,{timeout:25000}).catch(async e=>{console.log('AUTOROUTE STATE',await p.evaluate(()=>({pos:PsyKantoPlayableV1.getPosition(),routing:PsyKantoPlayableV1.isAutoRouting(),guide:PsyGuide.isOpen(),story:PsyKantoStoryV49.isOpen(),body:document.body.innerText.slice(-700)})));throw e});
   pos=await p.evaluate(()=>window.PsyKantoPlayableV1.getPosition());assert.equal(pos.world,'mt-moon','the active route follows the real east passage after Davi dialogue');
   // Resume the physical map state, then trigger an encounter by walking into grass.
   await p.evaluate(()=>window.PsyKantoPlayableV1.open('route-3',{spawn:{x:3,y:13}}));
   await p.waitForFunction(()=>window.PsyKantoPlayableV1.getPosition()?.world==='route-3');
   await p.evaluate(()=>window.PsyKantoPlayableV1.navigateTo({x:10,y:8}));
   await p.waitForFunction(()=>{const q=window.PsyKantoPlayableV1.getPosition();return q?.world==='route-3'&&Math.hypot(q.x-10,q.y-8)<.05});
   const savedPosition=await p.evaluate(()=>window.PsyKantoPlayableV1.getPosition());
   await p.evaluate(()=>{window.PsyKantoPlayableV1.close();window.PsyKantoPlayableV1.open('route-3',{resume:true})});
   await p.waitForFunction(()=>window.PsyKantoPlayableV1.getPosition()?.world==='route-3');
   const resumedPosition=await p.evaluate(()=>window.PsyKantoPlayableV1.getPosition());
   assert(Math.hypot(savedPosition.x-resumedPosition.x,savedPosition.y-resumedPosition.y)<.001,'route position is saved and restored');
   await p.evaluate(()=>{Math.random=()=>0});
   for(const target of [{x:4,y:14},{x:10,y:8},{x:20,y:11},{x:15,y:6}]){
    await p.evaluate(t=>window.PsyKantoPlayableV1.navigateTo(t),target);
    await p.waitForFunction(t=>(typeof inBattle!=='undefined'&&inBattle===true)||(()=>{const q=window.PsyKantoPlayableV1.getPosition();return q&&Math.hypot(q.x-t.x,q.y-t.y)<.05})(),target,{timeout:12000}).catch(async e=>{console.log('WALK TARGET FAILED',target,await p.evaluate(()=>({pos:PsyKantoPlayableV1.getPosition(),routing:PsyKantoPlayableV1.isAutoRouting(),battle:typeof inBattle!=='undefined'&&inBattle,guide:PsyGuide.isOpen()})));throw e});
    if(await p.evaluate(()=>typeof inBattle!=='undefined'&&inBattle===true))break;
   }
   await p.waitForFunction(()=>typeof inBattle!=='undefined'&&inBattle===true,null,{timeout:3000}).catch(async e=>{console.log('ENCOUNTER STATE',await p.evaluate(()=>({pos:PsyKantoPlayableV1.getPosition(),wild:typeof battleData!=='undefined'?battleData?.wild:null,team:P.team?.map(m=>({id:m.id,hp:m.hp,maxHp:m.maxHp})),errors:document.body.innerText.slice(-300)})));throw e});
   const battle=await p.evaluate(()=>({id:typeof battleData!=='undefined'?battleData?.wild?.id:null,level:typeof battleData!=='undefined'?battleData?.wild?.level:null,place:typeof battleData!=='undefined'?battleData?.wild?.halloweenArea:null}));
   assert([21,23,27,39,41,56].includes(Number(battle.id)),'live encounter species must belong to Route 3');assert.equal(battle.place,'route-3');assert(battle.level>=7&&battle.level<=11);
   assert.equal(errors.length,0,errors.join('\n'));
   results.push({viewport,arrival:{x:3,y:13},stage:scene.stage,routeToPewterReturnAndReentry:true,autoRouteReachedNpcAndTransitioned:true,routePositionResumed:true,liveRoute3Battle:battle,pageErrors:errors});
   await ctx.close();console.log('PASS',viewport);
  }
  fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
