// Real campaign renderer check for the Brasília clock, world lighting, costume aura and repaired room art.
// Usage: node scripts/qa/visual-overhaul-v1.cjs [ORIGIN] [OUTPUT]
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const origin=process.argv[2]||'http://127.0.0.1:8766';
const output=path.resolve(process.argv[3]||'/tmp/psyworld-visual-overhaul-v1');
fs.mkdirSync(output,{recursive:true});
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
 try{
  await page.clock.install({time:new Date('2026-11-07T12:00:00Z')});
  await page.goto(origin+'/tests/kanto-interiors-preview.html',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.PsyKantoWorldV2?.isOpen()&&window.PsyWorldTimeV1,{},{timeout:30000});
  await page.waitForTimeout(700);
  const manifest=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../assets/characters/halloween/manifest.json'),'utf8'));
  const palettes=await page.evaluate(files=>files.map(file=>({file,palette:window.PsyCostumeAuraV1?.palette('assets/characters/halloween/'+file)||null})),manifest.characters.flatMap(c=>Object.values(c.costumes)));
  assert.equal(palettes.length,30,'six characters × five existing looks');
  for(const p of palettes)assert.ok(fs.existsSync(path.resolve(__dirname,'../../assets/characters/halloween',p.file)),p.file+' asset exists');
  for(const c of manifest.characters)for(const [key,file]of Object.entries(c.costumes))assert.equal((palettes.find(p=>p.file===file)?.palette===null),key==='basic',c.id+'/'+key+' aura policy');
  async function capture(label,place,at){
   await page.clock.setFixedTime(new Date(at));
   await page.evaluate(({place})=>{window.PsyKantoWorldV2.close();window.PsyKantoWorldV2.open(place==='house-west'?'pallet':place);if(place==='house-west')window.PsyKantoWorldV2.enterPlace('house-west');}, {place});
   await page.waitForTimeout(350);
   const state=await page.evaluate(()=>({clock:document.querySelector('[data-world-clock]')?.textContent,aria:document.querySelector('[data-world-clock]')?.getAttribute('aria-label'),ambient:window.PsyWorldTimeV1.getState().phase,canvas:document.querySelector('#psy-kanto-world-v2 canvas')?.toDataURL()}));
   assert.ok(state.canvas,label+' rendered map canvas');
   assert.match(state.aria,/Brasília/);assert.equal(state.clock,at.includes('12:00')?'☀ 09:00':'☾ 21:00');
   const canvas=page.locator('#psy-kanto-world-v2 canvas');
   await canvas.screenshot({path:path.join(output,label+'.png')});
   const bytes=Buffer.from(state.canvas.split(',')[1],'base64');
   return {label,phase:state.ambient,clock:state.clock,canvasSha256:digest(bytes)};
  }
  const routeDay=await capture('route-1-day','route-1','2026-11-07T12:00:00Z');
  const routeNight=await capture('route-1-night','route-1','2026-11-07T00:00:00Z');
  assert.notEqual(routeDay.canvasSha256,routeNight.canvasSha256,'day and night map output differs');
  const houseDay=await capture('house-west-day','house-west','2026-11-07T12:00:00Z');
  const houseNight=await capture('house-west-interior-night','house-west','2026-11-07T00:00:00Z');
  const campaignContext=await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1,recordVideo:{dir:output,size:{width:1280,height:900}}});
  const campaignPage=await campaignContext.newPage();
  campaignPage.on('pageerror',e=>pageErrors.push(String(e)));
  await campaignPage.clock.install({time:new Date('2026-11-07T12:00:00Z')});
  const backpackResponse=campaignPage.waitForResponse(response=>response.url().includes('route-2-backpack.png'));
  await campaignPage.goto(origin+'/tests/world-time-campaign-preview.html',{waitUntil:'domcontentloaded',timeout:120000});
  await campaignPage.waitForFunction(()=>window.PsyKantoPlayableV1?.getPosition()?.world==='route-2'&&window.PsyWorldTimeV1,{},{timeout:30000});
  assert.equal((await backpackResponse).status(),200,'Route 2 clue uses a loaded transparent backpack sprite');
  await campaignPage.waitForTimeout(500);
  const cinematic=await campaignPage.evaluate(()=>{const root=document.querySelector('#psy-kanto-story'),image=root?.querySelector('.ks49-image');return {scene:root?.dataset.scene,beat:Number(root?.dataset.beat),background:getComputedStyle(image).backgroundImage}});
  assert.equal(cinematic.scene,'route2Arrival','Route 2 entry runs the authored arrival cinematic');
  assert.ok(cinematic.background.includes('route-2-artist-v1.webp'),'cinematic uses the final Route 2 artwork');
  await campaignPage.locator('#psy-kanto-story').screenshot({path:path.join(output,'route-2-arrival-cinematic.png')});
  async function advanceCinematic(){
   await campaignPage.waitForFunction(()=>{const p=document.querySelector('#psy-kanto-story .ks49-copy p');return p&&p.textContent===p.getAttribute('aria-label')},{},{timeout:15000});
   await campaignPage.locator('#psy-kanto-story .ks49-actions button').click();
  }
  await advanceCinematic();await advanceCinematic();await advanceCinematic();
  await campaignPage.waitForFunction(()=>!document.querySelector('#psy-kanto-story'),{},{timeout:5000});
  const cinematicVideo=campaignPage.video();
  async function chapterCapture(label,time,expected){
   await campaignPage.clock.setFixedTime(new Date(time));await campaignPage.waitForTimeout(300);
   const state=await campaignPage.evaluate(()=>({clock:document.querySelector('[data-world-clock]')?.textContent,aria:document.querySelector('[data-world-clock]')?.getAttribute('aria-label'),phase:window.PsyWorldTimeV1.getState().phase,canvas:document.querySelector('#psy-kanto-canvas')?.toDataURL()}));
   assert.equal(state.clock,expected);assert.match(state.aria,/Brasília/);assert.ok(state.canvas);
   await campaignPage.locator('#psy-kanto-canvas').screenshot({path:path.join(output,label+'.png')});
   return {label,clock:state.clock,phase:state.phase,canvasSha256:digest(Buffer.from(state.canvas.split(',')[1],'base64'))};
  }
  const chapterDay=await chapterCapture('route-2-day','2026-11-07T12:00:00Z','☀ 09:00');
  const routeAccess=await campaignPage.evaluate(()=>[
   window.PsyKantoPlayableV1.navigateTo({x:12,y:6}),
   window.PsyKantoPlayableV1.navigateTo({x:5,y:4}),
   window.PsyKantoPlayableV1.navigateTo({x:29,y:16})
  ]);
  assert.deepEqual(routeAccess,[true,true,true],'Route 2 NPC, story clue and exit remain reachable');
  await campaignPage.evaluate(()=>window.PsyKantoPlayableV1.setAutoHunt(false));
  const chapterNight=await chapterCapture('route-2-night','2026-11-07T00:00:00Z','☾ 21:00');
  assert.notEqual(chapterDay.canvasSha256,chapterNight.canvasSha256,'playable chapter day/night output differs');
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{window.PsyKantoWorldV2.close();window.PsyKantoWorldV2.open('route-1')});
  const mobileWorld=await page.evaluate(()=>{const h=document.querySelector('#psy-kanto-world-v2 .kw2-top'),clock=h.querySelector('[data-world-clock]'),r=clock.getBoundingClientRect();return {headerWidth:h.clientWidth,headerScroll:h.scrollWidth,clockLeft:r.left,clockRight:r.right,clockDisplay:getComputedStyle(clock).display}});
  assert.ok(mobileWorld.clockDisplay!=='none'&&mobileWorld.clockLeft>=0&&mobileWorld.clockRight<=390&&mobileWorld.headerScroll<=mobileWorld.headerWidth+1,'campaign world clock fits mobile portrait header');
  await page.setViewportSize({width:844,height:390});
  const landscapeWorld=await page.evaluate(()=>{const h=document.querySelector('#psy-kanto-world-v2 .kw2-top'),clock=h.querySelector('[data-world-clock]'),r=clock.getBoundingClientRect();return {headerWidth:h.clientWidth,headerScroll:h.scrollWidth,clockLeft:r.left,clockRight:r.right,clockDisplay:getComputedStyle(clock).display}});
  assert.ok(landscapeWorld.clockDisplay!=='none'&&landscapeWorld.clockLeft>=0&&landscapeWorld.clockRight<=844&&landscapeWorld.headerScroll<=landscapeWorld.headerWidth+1,'campaign world clock fits mobile landscape header');
  await campaignPage.setViewportSize({width:390,height:844});
  const mobilePlayable=await campaignPage.evaluate(()=>{const h=document.querySelector('#psy-kanto-world .kp-head'),clock=h.querySelector('[data-world-clock]'),r=clock.getBoundingClientRect();return {headerWidth:h.clientWidth,headerScroll:h.scrollWidth,clockLeft:r.left,clockRight:r.right,clockDisplay:getComputedStyle(clock).display}});
  assert.ok(mobilePlayable.clockDisplay!=='none'&&mobilePlayable.clockLeft>=0&&mobilePlayable.clockRight<=390&&mobilePlayable.headerScroll<=mobilePlayable.headerWidth+1,'playable campaign clock fits mobile portrait header');
  await campaignPage.close();
  const webmPath=path.join(output,'route-2-arrival-cinematic.webm'),mp4Path=path.join(output,'route-2-arrival-cinematic.mp4');
  await cinematicVideo.saveAs(webmPath);
  execFileSync('ffmpeg',['-y','-loglevel','error','-i',webmPath,'-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-movflags','+faststart',mp4Path]);
  const questContext=await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1});
  const questPage=await questContext.newPage();questPage.on('pageerror',e=>pageErrors.push(String(e)));
  await questPage.clock.install({time:new Date('2026-11-07T12:00:00Z')});
  await questPage.goto(origin+'/tests/world-time-campaign-preview.html',{waitUntil:'domcontentloaded',timeout:120000});
  await questPage.waitForFunction(()=>document.querySelector('#psy-kanto-story'),{},{timeout:30000});
  await questPage.locator('#psy-kanto-story [data-leave]').click();
  await questPage.waitForFunction(()=>!document.querySelector('#psy-kanto-story'),{},{timeout:5000});
  await questPage.evaluate(()=>{Math.random=()=>.99});
  async function walkTo(x,y){
   const accepted=await questPage.evaluate(target=>window.PsyKantoPlayableV1.navigateTo(target),{x,y});
   assert.equal(accepted,true,'Route 2 path exists to '+x+','+y);
   await questPage.waitForFunction(target=>{const p=window.PsyKantoPlayableV1.getPosition();return p?.world==='route-2'&&p.x===target.x&&p.y===target.y;},{x,y},{timeout:30000});
  }
  async function interactAndRead(){
   await questPage.locator('#psy-kanto-world [data-interact]').click();
   const dialog=questPage.locator('#psy-kanto-dialog.open');await dialog.waitFor({timeout:3000});
   const text=await dialog.locator('.kp-dialog-text').textContent();
   await dialog.locator('.kp-dialog-actions button').click();
   await questPage.waitForFunction(()=>!document.querySelector('#psy-kanto-dialog.open'),{},{timeout:3000});
   return text;
  }
  await walkTo(12,6);assert.match(await interactAndRead(),/perdeu a mochila/i,'Caio gives the first quest prompt');
  await walkTo(5,4);assert.match(await interactAndRead(),/encontrou a mochila/i,'the trail clue registers the item as found');
  const returnObjective=await questPage.evaluate(()=>window.PsyKantoPlayableV1.questRows()[0]);
  assert.equal(returnObjective.title,'Devolva a mochila para Caio','the active marker returns to the quest giver');
  await walkTo(12,6);assert.match(await interactAndRead(),/Pokéballs/i,'Caio acknowledges the returned field notebook');
  let questResult=await questPage.evaluate(()=>({state:window.PsyKantoPlayableV1.progress().places['route-2'],balls:window.P.inventory['Pokéball']}));
  assert.equal(questResult.state.storyDone,true);assert.equal(questResult.balls,3,'the early-game reward is granted after the handoff');
  await interactAndRead();questResult=await questPage.evaluate(()=>window.P.inventory['Pokéball']);
  assert.equal(questResult,3,'revisiting Caio cannot duplicate the reward');
  await questContext.close();
  assert.deepEqual(pageErrors,[],'browser reported no page errors');
  const result={base:'81d114c5a62ec5a4272f2414baf1b4995e7b57cb',viewport:{width:1280,height:900},scenes:[routeDay,routeNight,houseDay,houseNight,chapterDay,chapterNight],routeAccess:{npc:routeAccess[0],storyClue:routeAccess[1],exit:routeAccess[2]},route2Quest:{stages:['talk','find backpack','return to Caio'],clueArt:'assets/story/route-2-backpack.png',reward:{item:'Pokéball',quantity:3},duplicateRewardPrevented:true},cinematic:{id:cinematic.scene,beats:3,asset:'assets/story/route-2-artist-v1.webp',video:mp4Path},mobile:{worldPortrait:mobileWorld,worldLandscape:landscapeWorld,playablePortrait:mobilePlayable},costumeLooks:palettes.length,errors:pageErrors};
  fs.writeFileSync(path.join(output,'visual-overhaul-v1-browser-report.json'),JSON.stringify(result,null,2)+'\n');
  console.log('PASS Chromium campaign: Route 1/2 day/night, west house, three-beat cinematic MP4, timed quest handoff and reward, Brasília clock, 30 costume palettes; 0 page errors');
  console.log('ARTIFACTS '+output);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
