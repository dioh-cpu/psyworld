// Disposable browser fixture only; all requests outside the local server are blocked.
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const origin=process.argv[2]||'http://127.0.0.1:8765',out=path.resolve(process.argv[3]||'/tmp/quaxly-review');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1100,height:800}});const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
await page.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
await page.goto(origin+'/tests/kanto-story-v49.html',{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>window.PsyFollower?.manifest()[912]&&window.PsyKantoWorldV2);
await page.locator('#qa-prepare').click({force:true});
await page.evaluate(()=>{
 window.autoSave=()=>{};P.meta.kantoStoryV49={seen:{palletArrival:true,palletDeparture:true,routeArrival:true,professorResearch:true}};
 PsyKantoStoryV49.close(false);PsyGuide?.close();closeTutorial?.();
 P.meta.followerV47={enabled:true,key:P.team[0].pokemon_uid||P.team[0].followerKeyV47||'qa-quaxly'};P.team[0].followerKeyV47=P.meta.followerV47.key;
 window.qaWalk=[];const original=PsyFollower.draw;
 PsyFollower.draw=function(c,opt){
  const transform=c.getTransform(),drawImage=c.drawImage,items=[];
  c.drawImage=function(im,...args){
   if(im.src?.includes('/followers/pages/')){
    const p=transform.inverse().transformPoint(c.getTransform().transformPoint({x:0,y:0}));
    items.push({x:p.x,y:p.y-5,valid:opt.valid?.(p.x,p.y-5),frame:(args[0]-3584)/64,src:im.src.split('/').pop()});
   }return drawImage.call(this,im,...args);
  };
  try{return original(c,opt)}finally{c.drawImage=drawImage;qaWalk.push({scene:opt.scene,x:opt.x,y:opt.y,moving:opt.moving,items});}
 };
 PsyFollower.clear();PsyKantoWorldV2.open('pallet',{spawn:[520,470]});
});
await page.waitForTimeout(1200);
for(const [key,ms]of [['ArrowLeft',1200],['ArrowDown',650],['ArrowUp',650],['ArrowRight',1200]]){await page.keyboard.down(key);await page.waitForTimeout(ms);await page.keyboard.up(key);await page.waitForTimeout(200);}
await page.screenshot({path:path.join(out,'pallet-normal.png')});
console.log('pallet',await page.evaluate(()=>PsyKantoWorldV2.getPosition()));
await page.evaluate(()=>PsyKantoWorldV2.enterPlace('lab'));await page.waitForTimeout(700);
for(const key of ['ArrowLeft','ArrowUp','ArrowRight','ArrowDown']){await page.keyboard.down(key);await page.waitForTimeout(500);await page.keyboard.up(key);await page.waitForTimeout(100);}
await page.screenshot({path:path.join(out,'laboratory-normal.png')});
console.log('lab',await page.evaluate(()=>PsyKantoWorldV2.getPosition()));
await page.evaluate(()=>{P.team[0].shiny=true;PsyFollower.clear();PsyKantoWorldV2.open('route-1',{skipGuard:true});});await page.waitForTimeout(700);
for(const key of ['ArrowUp','ArrowLeft','ArrowDown','ArrowRight']){await page.keyboard.down(key);await page.waitForTimeout(900);await page.keyboard.up(key);await page.waitForTimeout(150);}
await page.screenshot({path:path.join(out,'route1-shiny.png')});
console.log('route',await page.evaluate(()=>PsyKantoWorldV2.getPosition()));
// Unlock only the disposable fixture's next chapter to exercise its real tile loop.
await page.evaluate(()=>{localStorage.setItem('psy_kanto_world_v2_quests',JSON.stringify({viridian:true}));PsyKantoPlayableV1.open('viridian');});
await page.waitForTimeout(700);
for(const key of ['ArrowRight','ArrowUp','ArrowLeft','ArrowDown']){await page.keyboard.down(key);await page.waitForTimeout(700);await page.keyboard.up(key);await page.waitForTimeout(150);}
await page.screenshot({path:path.join(out,'viridian-shiny.png')});
await page.evaluate(()=>PsyKantoPlayableV1.close());
// Exercise the real city loop; no synthetic follower positions.
await page.evaluate(()=>{PsyKantoWorldV2.close();PsyGuide?.close();closeTutorial?.();document.activeElement?.blur();});
for(const key of ['ArrowRight','ArrowDown','ArrowLeft','ArrowUp']){await page.keyboard.down(key);await page.waitForTimeout(650);await page.keyboard.up(key);await page.waitForTimeout(250);}
await page.screenshot({path:path.join(out,'city-shiny.png')});
const result=await page.evaluate(()=>{
 const scenes={};for(const r of qaWalk){const s=scenes[r.scene]||(scenes[r.scene]={calls:0,draws:0,invalid:[],frames:[],palettes:[],positions:[]});s.calls++;for(const i of r.items){s.draws++;if(i.valid===false&&s.invalid.length<10)s.invalid.push(i);s.frames.push(i.frame);s.palettes.push(i.src);s.positions.push([i.x,i.y]);}}
 for(const s of Object.values(scenes)){s.frames=[...new Set(s.frames)].sort();s.palettes=[...new Set(s.palettes)];s.uniquePositions=new Set(s.positions.map(p=>p.map(v=>v.toFixed(1)).join(','))).size;delete s.positions;}return scenes;
});
fs.writeFileSync(path.join(out,'map-results.json'),JSON.stringify({scenes:result,errors},null,2));console.log(JSON.stringify({scenes:result,errors}));
assert.equal(errors.length,0);
for(const scene of ['pallet:outside','pallet:lab','route-1:outside','city-psy','chapter:viridian']){assert(result[scene].draws>0);assert.equal(result[scene].invalid.length,0);assert(result[scene].uniquePositions>5,scene+' must move');}
await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
