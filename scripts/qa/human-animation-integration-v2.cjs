// Disposable offline Chromium profiles. Executes the real index, selectors,
// save/load functions, scene controllers and production animation renderer.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const origin=process.argv[2]||'http://127.0.0.1:8766',out=path.resolve(process.argv[3]||'/tmp/human-integration-v2');fs.mkdirSync(out,{recursive:true});
const inputMode=process.argv[4]==='inputs';
const results=[],errors=[],ids=['black_boy','black_girl','gothic_boy','gothic_girl','adventure_boy','adventure_girl'],keys=['basic','divine','macabre','macabre_alt','supreme'];
async function waitRender(p,file,scene){await p.waitForFunction(({file,scene})=>Object.values(window.__humanRenders||{}).some(r=>r.file===file&&r.scene===scene&&r.status==='ready'&&performance.now()-r.time<500),{file,scene},{timeout:30000});}
async function dismiss(p){await p.evaluate(()=>{PsyKantoStoryV49?.close(false);PsyGuide?.close();closeTutorial?.();PsyKantoWorldV2?.setStoryLock(false);});}
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
const viewports={desktop:{width:1280,height:900},portrait:{width:390,height:844},landscape:{width:844,height:390}};
const requested=(process.env.TEST_VIEWPORTS||Object.keys(viewports).join(',')).split(',');
for(const label of requested)for(const id of (inputMode?[ids[4]]:ids)){
 const viewport=viewports[label];
 const context=await browser.newContext({viewport,hasTouch:label!=='desktop',isMobile:label!=='desktop'}),p=await context.newPage();const pageErrors=[];p.on('pageerror',e=>pageErrors.push(String(e)));p.on('dialog',d=>d.accept());await p.addLocatorHandler(p.locator('#psy-loot-list:not([hidden])'),()=>p.locator('#psy-loot-list [data-close]').evaluate(b=>b.click()));
 await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==origin)return r.abort();if(u.pathname.startsWith('/api/'))return r.fulfill({contentType:'application/json',body:'{"ok":false,"error":"disposable-local-test"}'});return r.continue();});
 try{
 await p.goto(origin+'/index.html',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.confirmStarter&&window.PsyHalloweenCharacters&&window.PsyKantoWorldV2,{},{timeout:30000});
 await p.evaluate(()=>{P.name='Animation QA disposable';P.meta=P.meta||{};P.meta.welcomeVip3DaysGranted=true;P.meta.essentialGuideV56={done:true,step:4};P.meta.tutorialSeen=true;P.meta.psyCinematicTutorialSeen=true;P.meta.halloweenV1={costumes:{divine:true,macabre:true,macabre_alt:true,supreme:true},titles:{}};P.playerCharacterId='adventure_boy';P.playerCostumeByCharacter={adventure_boy:'basic'};chosenPoke=GENS.flatMap(g=>g.starters).find(p=>p.id===912);document.getElementById('screen-login').style.display='none';confirmStarter();
  const real=PsyTrainerWalkV1.renderAnimated;window.__humanRenders={};PsyTrainerWalkV1.renderAnimated=function(ctx,pack,state,opt,...args){const pose=real.call(this,ctx,pack,state,opt,...args),scene=opt.identity.startsWith('city:')?'city':opt.identity.includes('outside')?'outdoor':opt.identity.startsWith('route-2:')?'chapter':'interior';window.__humanRenders[scene]={file:pack.profile.file,scene,status:pack.compiledStatus,pose,identity:opt.identity,time:performance.now(),canvas:ctx.canvas.id};return pose;};
 });await p.waitForTimeout(1600);await dismiss(p);
 // Select all six through their real UI; no production selection/save hooks replaced.
 await p.evaluate(()=>openPsyHalloweenCharacterPicker());await p.locator('#psy-halloween-character-screen button[data-character="'+id+'"]').click();await p.getByRole('button',{name:'USAR ESTE PERSONAGEM',exact:true}).click();
 const character=await p.evaluate(id=>PsyHalloweenCharacters.find(c=>c.id===id),id);assert(character);
 for(const key of (inputMode?['basic']:keys)){
  await p.evaluate(()=>{PsyKantoWorldV2.close();PsyKantoPlayableV1.close();openPsyHalloweenCostumes();});
  await p.locator('#psy-halloween-costume-screen canvas[data-costume="'+key+'"]').locator('..').click();
  assert.equal(await p.evaluate(id=>P.playerCostumeByCharacter[id],id),key);
  await p.getByRole('button',{name:'FECHAR',exact:true}).click();await dismiss(p);await waitRender(p,character.costumes[key],'city');
  if(inputMode){
   const before=await p.evaluate(()=>({x:P.px,y:P.py}));await p.keyboard.down('ArrowDown');await p.waitForTimeout(200);await p.keyboard.up('ArrowDown');await p.waitForTimeout(250);const after=await p.evaluate(()=>({x:P.px,y:P.py}));assert(Math.hypot(after.x-before.x,after.y-before.y)>1,'city keyboard');
   const rect=await p.locator('#gameCanvas').boundingBox(),x=rect.x+rect.width*.48,y=rect.y+rect.height*.58,cdp=await context.newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+45,y}]});await p.waitForTimeout(220);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(250);const touch=await p.evaluate(()=>({x:P.px,y:P.py}));assert(Math.hypot(touch.x-after.x,touch.y-after.y)>1,'city floating joystick');await cdp.detach();
  }
  const city=await p.locator('#psy-halloween-avatar').evaluate(c=>({width:c.width,height:c.height,display:getComputedStyle(c).display,rect:c.getBoundingClientRect().toJSON()}));assert.notEqual(city.display,'none');
  if(key==='basic'||key==='supreme')await p.screenshot({path:path.join(out,label+'-'+id+'-'+key+'-city.png')});
  // Real outdoor world and interior, with unchanged collision engine.
  await p.evaluate(()=>PsyKantoWorldV2.open('pallet',{spawn:[520,470]}));await dismiss(p);await waitRender(p,character.costumes[key],'outdoor');
  const start=await p.evaluate(()=>PsyKantoWorldV2.getPosition());await p.keyboard.down('ArrowDown');await p.waitForTimeout(160);await p.keyboard.up('ArrowDown');await p.waitForTimeout(220);const end=await p.evaluate(()=>PsyKantoWorldV2.getPosition());assert(Math.hypot(end.x-start.x,end.y-start.y)>.1,'outdoor movement');
  if(inputMode){const rect=await p.locator('#psy-kanto-world-v2 canvas').boundingBox(),x=rect.x+rect.width*.5,y=rect.y+rect.height*.6,cdp=await context.newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+45,y}]});await p.waitForTimeout(220);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(250);const touch=await p.evaluate(()=>PsyKantoWorldV2.getPosition());assert(Math.hypot(touch.x-end.x,touch.y-end.y)>1,'Kanto floating joystick');assert(await p.evaluate(()=>{const p=PsyKantoWorldV2.getPosition();return PsyKantoWorldV2.walkable('pallet',p.x,p.y)}),'collision-valid outdoor position');await cdp.detach();}
  await p.evaluate(()=>PsyKantoWorldV2.enterPlace('lab'));await waitRender(p,character.costumes[key],'interior');assert.equal(await p.evaluate(()=>PsyKantoWorldV2.getPosition().inside),'lab');
  if(inputMode){await p.keyboard.down('ArrowUp');await p.waitForTimeout(2400);await p.keyboard.up('ArrowUp');await p.waitForTimeout(300);const a=await p.evaluate(()=>PsyKantoWorldV2.getPosition());await p.waitForTimeout(300);const b=await p.evaluate(()=>PsyKantoWorldV2.getPosition());assert.deepEqual(a,b,'interior stop drift');assert.equal(await p.evaluate(()=>__humanRenders.interior.pose.state),'idle');assert(a.y>=174,'interior boundary collision');}
  if(key==='basic')await p.screenshot({path:path.join(out,label+'-'+id+'-lab.png')});
  // Chapter route only unlocked in this disposable QA profile.
  await p.evaluate(()=>{localStorage.setItem('psy_kanto_journey_progress_v1',JSON.stringify({visited:['pallet','route-1','viridian']}));PsyKantoPlayableV1.open('route-2');});await dismiss(p);
  await waitRender(p,character.costumes[key],'chapter');assert.equal(await p.evaluate(()=>PsyKantoPlayableV1.getPosition()?.world),'route-2');
  await p.keyboard.down('ArrowRight');await p.waitForTimeout(200);await p.keyboard.up('ArrowRight');await p.waitForTimeout(250);
  if(key==='basic')await p.screenshot({path:path.join(out,label+'-'+id+'-chapter.png')});
  const render=await p.evaluate(()=>window.__humanRenders);results.push({viewport:label,id,key,scenes:Object.keys(render),city,outdoorTravel:Math.hypot(end.x-start.x,end.y-start.y),render});
  await p.evaluate(()=>{PsyKantoPlayableV1.close();PsyKantoWorldV2.close();});
 }
 // Removal is real basic selection; then real local snapshot, reload and resume.
 await p.evaluate(()=>openPsyHalloweenCostumes());await p.locator('#psy-halloween-costume-screen canvas[data-costume="basic"]').locator('..').click();await p.getByRole('button',{name:'FECHAR',exact:true}).click();
 const team=await p.evaluate(()=>{if(!psyV9WriteLocal())throw Error('local write failed');return P.team.map(m=>m.id);});
 await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.loadOnLogin&&window.PsyHalloweenCharacters);await p.evaluate(()=>loadOnLogin());await dismiss(p);
 const restored=await p.evaluate(()=>({id:P.playerCharacterId,costume:P.playerCostumeByCharacter[P.playerCharacterId],team:P.team.map(m=>m.id)}));assert.equal(restored.id,id);assert.equal(restored.costume,'basic');assert.deepEqual(restored.team,team);
 assert.deepEqual(pageErrors,[]);console.log('PASS',label,id,(inputMode?'1 look + keyboard/touch/collision checks':'5 looks')+' × city/outdoor/interior/chapter + UI equip/remove + real local reload');
 }finally{errors.push(...pageErrors);await context.close();fs.writeFileSync(path.join(out,'integration-tests.json'),JSON.stringify({results,errors,network:'all external and /api requests blocked; anonymous disposable profiles',save:'real local save/load functions; no account data'},null,2));}
}
assert.equal(results.length,requested.length*(inputMode?1:30));assert.deepEqual(errors,[]);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
