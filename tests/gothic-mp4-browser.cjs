const{chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const base=process.env.PREVIEW_BASE||'http://127.0.0.1:4175';
for(const [name,width,height,mobile] of [['desktop',1280,720,false],['android-portrait',412,915,true],['android-landscape',915,412,true]]){
 const page=await browser.newPage({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto(base+'/gothic-walk-preview.html');assert.equal(response.status(),200);await page.waitForFunction(()=>window.PsyGothicWalkVideoV1?.status().draws>0);let start=await page.evaluate(()=>PsyGothicWalkVideoV1.status());assert.equal(start.playing,false);
 for(const [key,row] of [['ArrowDown',0],['ArrowLeft',1],['ArrowUp',3],['ArrowRight',2]]){
  await page.keyboard.down(key);await page.waitForTimeout(700);let s=await page.evaluate(()=>PsyGothicWalkVideoV1.status());assert.equal(s.row,row);assert.equal(s.playing,true);const frames=s.decodedFrames;
  await page.waitForTimeout(1800);s=await page.evaluate(()=>PsyGothicWalkVideoV1.status());assert(s.decodedFrames>frames,'real MP4 frames must advance');assert.equal(s.failed,false);assert(s.seeks>0);assert.equal(s.mirrored,row===2);if(!s.seeking){const r=await page.evaluate(()=>PsyGothicWalkVideoV1.ranges[PsyGothicWalkVideoV1.status().row]);assert(s.time>=r[0]-.1&&s.time<=r[1]+.1,'stay in directional segment')}
  await page.keyboard.up(key);await page.waitForTimeout(250);const paused=await page.evaluate(()=>PsyGothicWalkVideoV1.status());await page.waitForTimeout(250);const still=await page.evaluate(()=>PsyGothicWalkVideoV1.status());assert.equal(still.playing,false);assert.equal(paused.time,still.time,'MP4 stops with actor');console.log(name,key,JSON.stringify({time:s.time,frames:s.decodedFrames,loops:s.seeks,paused:!still.playing}));
 }
 const b=await page.getByRole('button',{name:'Esquerda',exact:true}).boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.waitForTimeout(500);assert.equal((await page.evaluate(()=>PsyGothicWalkVideoV1.status())).row,1);await page.mouse.up();await page.waitForTimeout(200);
 await page.screenshot({path:'/tmp/gothic-mp4-'+name+'.png'});assert.deepEqual(errors,[]);console.log('PASS',name);await page.close();
}
await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
