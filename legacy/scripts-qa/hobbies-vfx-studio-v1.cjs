/* Chromium production Hobbies spot integration + real demo recorder.
 * Usage: node scripts/qa/hobbies-vfx-studio-v1.cjs [output-directory]
 */
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'../..');
const output=path.resolve(process.argv[2]||'/workspace/hobbies-vfx-studio-v1-artifacts');
const raw=path.join(output,'raw');
fs.mkdirSync(raw,{recursive:true});
let liveBrowser=null,baseURL='';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
 '.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg','.json':'application/json'};
const server=http.createServer((req,res)=>{
 let file;try{file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname))}catch(_){res.writeHead(400).end();return}
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(err.code==='ENOENT'?404:500).end();return}res.writeHead(200,{'Content-Type':types[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'}).end(data)});
});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const errors=[];
async function boot(page,spawn){
 await page.goto(`${baseURL}/index.html`,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.PsyHobbies&&window.PsyHobbyMastery&&window.PsyKantoWorldV2&&window.PsyHobbiesVFX,{timeout:30000});
 const ok=await page.evaluate(({spawn})=>{
  const p=window.P||globalThis.P;if(!p)throw new Error('The disposable profile did not initialize');
  p.meta=p.meta||{};p.meta.auxHobbiesV1=p.meta.auxHobbiesV1||{};
  for(const id of ['miner','lumber','gardener','fisher'])p.meta.auxHobbiesV1[id]={...(p.meta.auxHobbiesV1[id]||{}),level:1,xp:0,base:{}};
  p.meta.hobbyGatherV2={nodes:{},decor:[]};p.meta.hobbyGatherTotalsV1={};
  p.playerCharacterId='adventure_boy';p.playerCostumeKey='basic';p.playerCostumeByCharacter={...(p.playerCostumeByCharacter||{}),adventure_boy:'basic'};
  if(!Array.isArray(p.team)||!p.team.length)p.team=[{id:25,level:5,hp:100,maxHp:100,exp:0}];
  return window.PsyHobbyMasterySpotReady===true&&window.PsyKantoWorldV2.open('route-1',{spawn,skipGuard:true});
 },{spawn});
 if(!ok)throw new Error('Could not activate the Kanto Route 1 production map');
 await page.waitForTimeout(1700);
 await settleOverlays(page);
 const state=await page.evaluate(()=>({
  avatar:document.querySelector('#psy-kanto-world-v2 canvas')?.width>0,
  walk:!!window.PsyTrainerWalkV1,
  hobbiesReady:window.PsyHobbyMasterySpotReady,
  battleRulesLoaded:!!window.PsyBattleLootRulesV1&&typeof window.PsyBattleLootRulesV1.forType==='function',
  assets:window.PsyHobbiesVFX.debug().loaded,
  tools:Object.values(window.PsyHobbiesVFX.debug().tools).every(Boolean)
 }));
 if(!state.battleRulesLoaded)throw new Error('Typed battle loot rules did not load as a browser script');
 return state;
}
async function settleOverlays(page){
 await page.evaluate(()=>{
  if(window.PsyKantoStoryV49?.isOpen?.())window.PsyKantoStoryV49.close(true);
  window.PsyGuide?.close?.();
 });
 await page.waitForTimeout(350);
}
async function reopenMap(page,spawn){
 await page.evaluate(spawn=>window.PsyKantoWorldV2.open('route-1',{spawn,skipGuard:true}),spawn);
 await page.waitForTimeout(500);await settleOverlays(page);
}
async function countFrames(page,ms=1800){
 return page.evaluate(ms=>new Promise(resolve=>{
  const ticks=[];let first=0;
  const loop=t=>{if(!first)first=t;ticks.push(t);if(t-first>=ms){const deltas=ticks.slice(1).map((x,i)=>x-ticks[i]).sort((a,b)=>a-b);resolve({frames:ticks.length,fps:Math.round((ticks.length-1)*1000/(t-first)),p50ms:deltas[Math.floor(deltas.length*.5)]||0,p95ms:deltas[Math.floor(deltas.length*.95)]||0,heap:performance.memory?.usedJSHeapSize||null})}else requestAnimationFrame(loop)};
  requestAnimationFrame(loop);
 }),ms);
}
async function auditToolFrames(page){
 return page.evaluate(async()=>{
  const materials=['copper','iron','silver','gold','coal','ruby','sapphire','jade'],tools=['pickaxe','axe'],frames=[];
  for(const tool of tools)for(const material of materials){
   const image=new Image();image.src=`assets/hobbies/tools/${tool}-${material}.png`;await image.decode();
   if(image.naturalWidth!==64||image.naturalHeight!==64)throw new Error(`${tool}-${material} is not a 64x64 cell`);
   const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
   const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
   const data=context.getImageData(0,0,64,64).data;let left=64,top=64,right=-1,bottom=-1;
   for(let y=0;y<64;y++)for(let x=0;x<64;x++)if(data[(y*64+x)*4+3]>128){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);}
   if(left<2||top<2||right>62||bottom>62||right<=left||bottom<=top)throw new Error(`${tool}-${material} artwork touches or escapes its cell`);
   frames.push({tool,material,bounds:[left,top,right,bottom]});
  }
  const anchors=new Set(frames.map(frame=>frame.bounds.join(',')));
  if(anchors.size!==1)throw new Error('Tool PNG silhouettes are not aligned to a shared transparent frame: '+JSON.stringify(frames));
  return {count:frames.length,bounds:frames[0].bounds,aligned:anchors.size===1};
 });
}
async function pressInteract(page){await page.keyboard.press('e');await page.waitForTimeout(820)}
async function finishSpotByInteraction(page,kind){
 for(let attempt=0;attempt<7;attempt++){
  await page.waitForFunction(()=>!window.PsyHobbiesVFX?.isBusy?.('route-1'),null,{timeout:6000});
  const before=await page.evaluate(kind=>({hits:Number(window.P?.meta?.hobbyGatherV2?.nodes?.['route-1:o1']?.hits||0),total:Number(window.P?.meta?.hobbyGatherTotalsV1?.[kind]||0)}),kind);
  if(before.total>=1)return;
  await page.keyboard.press('e');
  await page.waitForFunction(({kind,before})=>Number(window.P?.meta?.hobbyGatherTotalsV1?.[kind]||0)>before.total||Number(window.P?.meta?.hobbyGatherV2?.nodes?.['route-1:o1']?.hits||0)>before.hits,{kind,before},{timeout:9000});
 }
 const done=await page.evaluate(kind=>Number(window.P?.meta?.hobbyGatherTotalsV1?.[kind]||0)>=1,kind);
 if(!done)throw new Error(`${kind} spot did not complete after seven real interaction attempts`);
}
async function tapWorldSpot(page,x,y,{touch=false}={}){
 const point=await page.evaluate(({x,y})=>{
  const canvas=document.querySelector('#psy-kanto-world-v2 canvas'),stage=document.querySelector('#psy-kanto-world-v2 .kw2-stage'),map=window.PsyKantoWorldV2.data.route1,pos=window.PsyKantoWorldV2.getPosition();
  const rect=stage.getBoundingClientRect(),dpr=Math.min(1.3,window.devicePixelRatio||1),cw=Math.max(260,Math.round(rect.width*dpr)),ch=Math.max(180,Math.round(rect.height*dpr));
  const cover=Math.max(cw/map.w,ch/map.h),scale=Math.min(4,cover*1.08),viewW=cw/scale,viewH=ch/scale,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const cx=viewW>=map.w?map.w/2:clamp(pos.x,viewW/2,map.w-viewW/2),cy=viewH>=map.h?map.h/2:clamp(pos.y,viewH/2,map.h-viewH/2);
  const ox=Math.round(cw/2-cx*scale),oy=Math.round(ch/2-cy*scale);
  return {x:rect.left+(x*scale+ox)/dpr,y:rect.top+(y*scale+oy)/dpr,canvas:!!canvas,world:{x:pos.x,y:pos.y}};
 },{x,y});
 if(!point.canvas)throw new Error('Production map canvas is unavailable');
 if(touch)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
 return point;
}
async function fishUntilComplete(page,timeout=12000){
 const reel=page.locator('#psy-hobby-fishing [data-fish-reel]');
 const gate=await page.evaluate(()=>({position:window.PsyKantoWorldV2.getPosition(),scene:'route-1',canFish:window.PsyHobbies.canFish('route-1',window.PsyKantoWorldV2.getPosition(),null),buttonHidden:document.querySelector('#psy-kanto-world-v2 [data-kw2-fish]')?.hidden}));
 if(!gate.canFish||gate.buttonHidden)throw new Error('Fish interaction is not available at its registered water zone: '+JSON.stringify(gate));
 await page.locator('#psy-kanto-world-v2 [data-kw2-fish]').click();
 const start=Date.now();let i=0;
 while(Date.now()-start<timeout&&await page.locator('#psy-hobby-fishing').count()){
  const overlay=page.locator('#psy-hobby-fishing');
  if(!(await overlay.evaluate(el=>el.classList.contains('show'))))break;
  const progress=await overlay.locator('[data-fish-progress]').evaluate(el=>parseFloat(el.style.width)||0);
  const marker=await overlay.locator('[data-fish-marker]').evaluate(el=>parseFloat(el.style.left)||0);
  if(progress>=99)break;
  // Real pointer events engage and release the production fishing minigame.
  if(marker<56){
   await reel.dispatchEvent('pointerdown',{pointerId:1,pointerType:'mouse',isPrimary:true,button:0});
   await page.waitForTimeout(180+(i%3)*25);
   await reel.dispatchEvent('pointerup',{pointerId:1,pointerType:'mouse',isPrimary:true,button:0});
  }else await page.waitForTimeout(220);
  i++;
 }
 await page.waitForTimeout(700);
 return await page.evaluate(()=>({open:!!document.querySelector('#psy-hobby-fishing.show'),text:document.querySelector('#psy-hobby-fishing [data-fish-status]')?.textContent||'',totals:window.P?.meta?.hobbyGatherTotalsV1||{},inventory:window.P?.inventory||{}}));
}
async function main(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 baseURL=`http://127.0.0.1:${server.address().port}`;
 const browser=liveBrowser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const mobileResults=[];
 for(const spec of [{name:'mobile-portrait',viewport:{width:390,height:844},isMobile:true},{name:'mobile-landscape',viewport:{width:844,height:390},isMobile:true}]){
  const context=await browser.newContext({viewport:spec.viewport,isMobile:true,hasTouch:true,deviceScaleFactor:2});
  await context.route('**/*',route=>route.request().url().startsWith(baseURL+'/')?route.continue():route.abort());
  const page=await context.newPage();page.on('pageerror',e=>errors.push(spec.name+': '+e.message));
  const start=await boot(page,[235,294]);
  if(!start.tools)throw new Error(spec.name+' did not load all 16 generated transparent tools');
  await tapWorldSpot(page,276,301,{touch:true});await page.waitForTimeout(1050);
  const totals=await page.evaluate(()=>window.P?.meta?.hobbyGatherTotalsV1||{});
  const perf=await countFrames(page);
  if(totals.gardener!==1)throw new Error(spec.name+' did not complete a real flower interaction');
  if(perf.fps<30)throw new Error(spec.name+' rendered below 30 FPS: '+JSON.stringify(perf));
  const mobile={name:spec.name,...start,totals,performance:perf};mobileResults.push(mobile);
  if(spec.name==='mobile-portrait')await page.screenshot({path:path.join(output,'mobile-portrait.png'),fullPage:true});
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:raw,size:{width:1280,height:720}},deviceScaleFactor:1});
 await context.route('**/*',route=>route.request().url().startsWith(baseURL+'/')?route.continue():route.abort());
 const page=await context.newPage();page.on('pageerror',e=>errors.push('demo: '+e.message));
 const desktop=await boot(page,[220,294]);
 if(!desktop.tools)throw new Error('Desktop did not load all 16 generated transparent tools');
 desktop.toolAlignment=await auditToolFrames(page);
 await page.screenshot({path:path.join(output,'route-1-before.png')});
 await tapWorldSpot(page,276,301);await page.waitForTimeout(1050);
 await page.screenshot({path:path.join(output,'route-1-flower-after.png')});
 // The real Route 1 lumber spot progresses through its actual five-hit state.
 await reopenMap(page,[500,275]);
 for(let i=0;i<5;i++){await pressInteract(page);await page.waitForTimeout(100)}
 await page.waitForTimeout(650);
 await reopenMap(page,[220,294]);
 const mineReach=await page.evaluate(()=>({walkable:window.PsyKantoWorldV2.walkable('route-1',220,294),spot:window.PsyHobbies.visibleNodes('route-1').find(n=>n.id==='o1')}));
 if(!mineReach.walkable||!mineReach.spot)throw new Error('The early-route mining spot is blocked or unavailable: '+JSON.stringify(mineReach));
 const mineTap=await tapWorldSpot(page,mineReach.spot.x,mineReach.spot.y);
 try{await page.waitForFunction(()=>Number(window.P?.meta?.hobbyGatherV2?.nodes?.['route-1:o1']?.hits||0)>0,{},{timeout:12000})}
 catch(error){const diag=await page.evaluate(()=>({position:window.PsyKantoWorldV2.getPosition(),node:window.PsyHobbies.visibleNodes('route-1').find(n=>n.id==='o1'),record:window.P?.meta?.hobbyGatherV2?.nodes?.['route-1:o1'],nearest:window.PsyHobbies.nearby('route-1',window.PsyKantoWorldV2.getPosition(),100),vfx:window.PsyHobbiesVFX.debug()}));throw new Error('Mouse click did not start the remote mining interaction at '+JSON.stringify(mineTap)+'; state='+JSON.stringify(diag)+'; '+error.message)}
 await finishSpotByInteraction(page,'miner');
 await page.waitForTimeout(550);
 // The real fishing panel uses the active Route 1 water area and production FSM.
 await reopenMap(page,[132,431]);
 const fish=await fishUntilComplete(page);
 if(fish.totals.fisher!==1||fish.totals.miner!==1)throw new Error('Production fishing/mining interaction did not complete successfully: '+JSON.stringify(fish));
 await page.waitForTimeout(1600);
 // Verify the existing V9 local-save and restore contracts without touching a real profile.
 await page.waitForTimeout(350);
 const saveRoundTrip=await page.evaluate(()=>{
  const raw=localStorage.getItem('psyWorldSave_v9'),saved=raw?JSON.parse(raw):null,profile=saved?.player||saved;
  const expected=['gardener','lumber','miner','fisher'];
  const storedTotals=Object.fromEntries(expected.map(id=>[id,Number(profile?.meta?.hobbyGatherTotalsV1?.[id]||0)]));
  const fishItems=['Peixe de Rio','Carpa Prateada','Peixe Cristalino','Peixe Dourado'];
  const storedItems=Object.fromEntries(['Flor do Campo','Madeira Bruta','Minério Bruto',...fishItems].map(item=>[item,Number(profile?.inventory?.[item]||0)]));
  const restored=!!window.autoLoad?.();
  const loadedTotals=Object.fromEntries(expected.map(id=>[id,Number(window.P?.meta?.hobbyGatherTotalsV1?.[id]||0)]));
  const loadedItems=Object.fromEntries(Object.keys(storedItems).map(item=>[item,Number(window.P?.inventory?.[item]||0)]));
  return {savePresent:!!saved,restored,storedTotals,storedItems,loadedTotals,loadedItems,fishItemCount:Object.values(storedItems).slice(3).reduce((sum,count)=>sum+count,0),loadedFishItemCount:Object.values(loadedItems).slice(3).reduce((sum,count)=>sum+count,0)};
 });
 const nonFishItems=Object.entries(saveRoundTrip.loadedItems).filter(([item])=>item!=='Peixe de Rio'&&item!=='Carpa Prateada'&&item!=='Peixe Cristalino'&&item!=='Peixe Dourado');
 if(!saveRoundTrip.savePresent||!saveRoundTrip.restored||Object.values(saveRoundTrip.loadedTotals).some(value=>value!==1)||nonFishItems.some(([,value])=>value!==1)||saveRoundTrip.fishItemCount!==1||saveRoundTrip.loadedFishItemCount!==1||JSON.stringify(saveRoundTrip.storedItems)!==JSON.stringify(saveRoundTrip.loadedItems))
  throw new Error('Hobby rewards did not survive the existing local save/restore flow: '+JSON.stringify(saveRoundTrip));
 const post=await page.evaluate(()=>({
  totals:window.P?.meta?.hobbyGatherTotalsV1||{},inventory:window.P?.inventory||{},
  vfx:window.PsyHobbiesVFX.debug(),spotSkillsReady:window.PsyHobbyMasterySpotReady,
  mobileTouchTargets:[...document.querySelectorAll('#psy-kanto-world-v2 button')].map(b=>({label:b.getAttribute('aria-label')||b.textContent.trim(),w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height})).filter(v=>v.w&&v.h)
 }));
 const fps=await countFrames(page,1800);
 await page.screenshot({path:path.join(output,'route-1-final.png')});
 const video=page.video();await context.close();
 const webm=await video.path();const final=path.join(output,'hobbies-vfx-studio-v1-demo.mp4');
 const ff=spawnSync('ffmpeg',['-y','-ss','3','-i',webm,'-t','20','-an','-vf','scale=1280:720:flags=neighbor,format=yuv420p','-c:v','libx264','-preset','medium','-crf','23','-movflags','+faststart',final],{encoding:'utf8'});
 if(ff.status!==0)throw new Error('ffmpeg failed: '+ff.stderr);
 const report={desktop,mobile:mobileResults,fish,saveRoundTrip,post,fps,pageErrors:errors,video:final,videoBytes:fs.statSync(final).size};
 fs.writeFileSync(path.join(output,'browser-report.json'),JSON.stringify(report,null,2));
 await browser.close();liveBrowser=null;await new Promise(resolve=>server.close(resolve));
 if(errors.length)throw new Error('Browser page errors: '+errors.join(' | '));
 console.log(JSON.stringify(report,null,2));
}
main().catch(async error=>{console.error(error.stack||error);try{await liveBrowser?.close()}catch(_){}try{if(server.listening)await new Promise(resolve=>server.close(resolve))}catch(_){}process.exitCode=1});
