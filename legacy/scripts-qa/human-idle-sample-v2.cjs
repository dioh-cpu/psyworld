// Art-approval sample. Uses the same production controller as the game.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
(async()=>{
 const walk=process.argv[4]==='walk';
 const origin=process.argv[2]||'http://127.0.0.1:8766',out=path.resolve(process.argv[3]||'/tmp/human-idle-sample');fs.mkdirSync(path.join(out,'frames'),{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:820},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(origin+(walk?'/tests/human-walk-art-sample-v2.html':'/tests/human-idle-art-sample-v2.html'));await page.waitForFunction(()=>window.HumanIdleSampleV2?.ready);
 await page.clock.install({time:new Date('2026-11-07T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-07T00:00:01Z'));
 await page.evaluate(()=>{HumanIdleSampleV2.restart();HumanIdleSampleV2.render(0);});
 for(let i=0;i<250;i++){await page.clock.runFor(50);await page.locator('#studio').screenshot({path:path.join(out,'frames',String(i).padStart(4,'0')+'.png')});}
 if(errors.length)throw Error(errors.join('\n'));
 execFileSync('ffmpeg',['-y','-loglevel','error','-framerate','20','-i',path.join(out,'frames','%04d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-crf','17','-movflags','+faststart',path.join(out,(walk?'WALK-Aventureiro-amostra.mp4':'IDLE-Aventureiro-amostra.mp4'))]);
 fs.copyFileSync(path.join(out,'frames','0030.png'),path.join(out,(walk?'WALK-Aventureiro-comparacao.png':'IDLE-Aventureiro-comparacao.png')));console.log('PASS art sample: production WALK/IDLE, four directions, 12.5 seconds, zero JS errors');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
