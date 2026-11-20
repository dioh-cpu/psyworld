/* Crystal Grotto browser QA. Uses the production Kanto, Hobbies, VFX and
 * Treasure modules with a disposable offline profile. Artifacts go to /dev/shm
 * by default so the QA does not fill the repository/container disk.
 */
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'../..');
const output=path.resolve(process.argv[2]||'/dev/shm/psyworld-crystal-grotto-qa');
const raw=path.join(output,'raw');fs.mkdirSync(raw,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json'};
let baseURL='',browser;
const errors=[];
const server=http.createServer((req,res)=>{
 let file;try{file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname))}catch(_){res.writeHead(400).end();return}
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(err.code==='ENOENT'?404:500).end();return}res.writeHead(200,{'Content-Type':types[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'}).end(data)});
});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function main(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));baseURL=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,recordVideo:{dir:raw,size:{width:1280,height:720}}});
 await context.route('**/*',route=>route.request().url().startsWith(baseURL+'/')?route.continue():route.abort());
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 await page.goto(baseURL+'/index.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.PsyHobbies&&window.PsyHobbiesVFX&&window.PsyTreasureHuntV1&&window.PsyKantoWorldV2&&window.PsyTitles,{timeout:30000});
 const boot=await page.evaluate(()=>{
  const p=window.P||globalThis.P;if(!p)throw new Error('No disposable profile was initialized');
  p.trainerLevel=5;p.gold=0;p.diamonds=0;p.psycoin=0;p.inventory={};p.team=[{id:25,level:5,hp:100,maxHp:100,exp:0}];p.meta=p.meta||{};
  p.meta.auxHobbiesV1={...(p.meta.auxHobbiesV1||{}),treasureHunter:{level:1,xp:0,base:{}},looter:{level:0,xp:0,base:{}}};
  p.meta.treasureHuntV1={hobbies:{treasureHunter:{level:1,xp:0,points:1,skills:{}},looter:{level:0,xp:0,points:0,skills:{}}},sites:{},chests:{},stats:{digs:0,chestsOpened:0},psycoinTenths:0,cosmetic:{bountyHunter:false,equipped:false},titles:{}};
  p.meta.hobbyGatherV2={nodes:{},decor:[]};
  window.PsyKantoWorldV2.open('route-1',{spawn:[620,163],skipGuard:true});
  return {trainerLevel:p.trainerLevel,inside:window.PsyKantoWorldV2.getPosition().inside,spotCount:window.PsyHobbies.visibleNodes('route-cave').filter(n=>n.kind==='treasureHunter').length};
 });
 await page.evaluate(()=>{if(window.PsyKantoStoryV49?.isOpen?.())window.PsyKantoStoryV49.close(true);window.PsyGuide?.close?.();window.closeTutorial?.();window.PsyKantoWorldV2?.setStoryLock?.(false)});
 await page.waitForTimeout(400);
 await page.evaluate(()=>window.PsyKantoWorldV2.enterPlace('route-cave'));
 await page.waitForFunction(()=>window.PsyKantoWorldV2.getPosition().inside==='route-cave',{timeout:10000});
 const cave=await page.evaluate(()=>({inside:window.PsyKantoWorldV2.getPosition().inside,spotCount:window.PsyHobbies.visibleNodes('route-cave').filter(n=>n.kind==='treasureHunter').length}));
 if(cave.inside!=='route-cave'||cave.spotCount!==3)throw new Error('Crystal Grotto did not open with three available treasure sites: '+JSON.stringify(cave));
 boot.inside=cave.inside;boot.spotCount=cave.spotCount;
 await page.waitForTimeout(1000);
 const mapResponse=await page.request.get(baseURL+'/assets/kanto/caves/crystal-grotto-v1.webp');
 if(!mapResponse.ok())throw new Error('Crystal Grotto artwork request failed: '+mapResponse.status());
 await page.screenshot({path:path.join(output,'crystal-grotto-before.png')});
 await page.evaluate(()=>{Math.random=()=>.999});
 await page.evaluate(()=>window.PsyKantoWorldV2.navigate([310,452]));
 await page.waitForFunction(()=>{const p=window.PsyKantoWorldV2.getPosition();return p.inside==='route-cave'&&Math.hypot(p.x-310,p.y-466)<58&&document.getElementById('psy-kanto-world-v2')?.dataset.pathLength==='0'},{timeout:15000});
 for(let hit=1;hit<=5;hit++){
  const before=await page.evaluate(()=>window.PsyHobbies.visibleNodes('route-cave').find(n=>n.id==='d1')?.hits||0);
  await page.keyboard.press('e');
  await page.waitForFunction(({hit,before})=>{
   const stat=window.PsyTreasureHuntV1.stats();
   if(hit===5)return Number(stat.stats?.digs||0)>=1;
   return Number(window.PsyHobbies.visibleNodes('route-cave').find(n=>n.id==='d1')?.hits||0)>before;
  },{hit,before},{timeout:7000});
  await page.waitForFunction(()=>!window.PsyHobbiesVFX.isBusy('route-cave'),null,{timeout:7000});
 }
 const afterDig=await page.evaluate(()=>({
  digs:window.PsyTreasureHuntV1.stats().stats.digs,
  chests:window.PsyTreasureHuntV1.stats().chests,
  hunterXP:window.PsyTreasureHuntV1.stats().hobbies.treasureHunter.xp,
  titleMetric:window.PsyTitles.metrics().treasureDigs,
  position:window.PsyKantoWorldV2.getPosition()
 }));
 if(afterDig.digs!==1||afterDig.hunterXP!==65||afterDig.titleMetric!==1||afterDig.chests.common!==1)throw new Error('Five-hit completion, title counter, or deterministic common chest failed: '+JSON.stringify(afterDig));
 await page.screenshot({path:path.join(output,'crystal-grotto-crack-complete.png')});
 const chestOpen=await page.evaluate(async()=>{
  window.PsyHobbies.openDetail('treasureHunter');
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const buttons=[...document.querySelectorAll('#psy-hobbies .th-chest .th-button')];
  const open=buttons.find(b=>b.textContent==='ABRIR'&&!b.disabled);if(!open)throw new Error('Owned treasure chest is missing its production open control');open.click();
  await new Promise(resolve=>setTimeout(resolve,80));
  return {opened:window.PsyTreasureHuntV1.stats().stats.chestsOpened,looter:window.PsyTreasureHuntV1.stats().hobbies.looter};
 });
 if(chestOpen.opened!==1||chestOpen.looter.level!==1||chestOpen.looter.xp!==60)throw new Error('Looter was not unlocked and advanced by opening the acquired chest: '+JSON.stringify(chestOpen));
 const roll=await page.evaluate(async()=>{
  // A disposable QA profile skips the nine normal level-ups solely to exercise
  // the level-10 Treasure Roll UI; production gating remains asserted separately.
  const s=window.PsyTreasureHuntV1.stats();s.hobbies.looter.level=10;s.hobbies.looter.points=0;
  window.P.meta.auxHobbiesV1.looter.level=10;window.P.diamonds=100;
  window.PsyHobbies.openDetail('looter');
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const button=[...document.querySelectorAll('#psy-hobbies .th-button')].find(b=>b.textContent.includes('USAR TREASURE ROLL'));
  if(!button||button.disabled)throw new Error('Treasure Roll was not enabled on the level-10 disposable Looter profile');button.click();
  await new Promise(resolve=>setTimeout(resolve,80));
  const after=window.PsyTreasureHuntV1.stats();return {diamonds:window.P.diamonds,costume:after.cosmetic,looter:after.hobbies.looter};
 });
 if(roll.diamonds!==90||roll.costume.bountyHunter!==true||roll.costume.equipped!==true)throw new Error('The production Treasure Roll did not charge and award the deterministic costume: '+JSON.stringify(roll));
 await page.evaluate(()=>window.PsyHobbies.close());await page.waitForTimeout(700);
 await page.screenshot({path:path.join(output,'crystal-grotto-treasure-roll.png')});
 const caveEncounter=await page.evaluate(async()=>{
  const originalStart=window.startBattle,originalRandom=Math.random;let captured=null;
  try{
   window.startBattle=wild=>{captured=wild?{id:Number(wild.id),name:wild.name,type:wild.type,area:wild.halloweenArea}:null};
   Math.random=()=>0;
   const p=window.PsyKantoWorldV2.getPosition();window.PsyKantoWorldV2.navigate([Math.min(760,p.x+100),p.y]);
   const until=performance.now()+4500;while(!captured&&performance.now()<until)await new Promise(resolve=>setTimeout(resolve,50));
  }finally{Math.random=originalRandom;window.startBattle=originalStart}
  return captured;
 });
 if(!caveEncounter||![27,50,41,74,95,104].includes(caveEncounter.id)||caveEncounter.area!=='crystal-grotto')throw new Error('Walking in the grotto did not trigger a real encounter from the cave pool: '+JSON.stringify(caveEncounter));
 const performance=await page.evaluate(()=>new Promise(resolve=>{
  const ticks=[];let start=0;const frame=t=>{if(!start)start=t;ticks.push(t);if(t-start>=1600){const d=ticks.slice(1).map((v,i)=>v-ticks[i]).sort((a,b)=>a-b);resolve({fps:Math.round((ticks.length-1)*1000/(t-start)),p95ms:d[Math.floor(d.length*.95)]||0,heap:performance.memory?.usedJSHeapSize||null})}else requestAnimationFrame(frame)};requestAnimationFrame(frame)
 }));
 if(performance.fps<30)throw new Error('The cave scene fell below 30 FPS: '+JSON.stringify(performance));
 const video=page.video();await context.close();
 const webm=await video.path(),mp4=path.join(output,'crystal-grotto-treasure-hunt-v1-demo.mp4');
 const encoded=spawnSync('ffmpeg',['-y','-i',webm,'-an','-vf','scale=1280:720:flags=neighbor,format=yuv420p','-c:v','libx264','-preset','ultrafast','-crf','25','-movflags','+faststart',mp4],{encoding:'utf8'});
 if(encoded.status!==0)throw new Error('ffmpeg failed: '+encoded.stderr);
 const report={profile:'disposable offline QA only',boot,artBytes:fs.statSync(path.join(root,'assets/kanto/caves/crystal-grotto-v1.webp')).size,afterDig,chestOpen,roll,caveEncounter,performance,pageErrors:errors,video:mp4,videoBytes:fs.statSync(mp4).size};
 fs.writeFileSync(path.join(output,'browser-report.json'),JSON.stringify(report,null,2));
 if(errors.length)throw new Error('Browser page errors: '+errors.join(' | '));
 console.log(JSON.stringify(report,null,2));
 await browser.close();browser=null;await new Promise(resolve=>server.close(resolve));
}
main().catch(async error=>{console.error(error.stack||error);try{await browser?.close()}catch(_){}try{if(server.listening)await new Promise(resolve=>server.close(resolve))}catch(_){}process.exitCode=1});
