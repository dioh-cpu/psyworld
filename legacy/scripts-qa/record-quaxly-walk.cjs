// Requires Playwright + Chromium and ffmpeg; serve the repository root locally.
// node scripts/qa/record-quaxly-walk.cjs ORIGIN OUTPUT [companions]
// Default: approved Quaxly fixture + MP4/GIF. companions: one joint MP4 only.
const {chromium}=require('playwright');
const crypto=require('node:crypto');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
(async()=>{
 const joint=process.argv[4]==='companions',ids=joint?[906,909,921]:[912];
 const fixture=joint?'tests/paldea-companions-walk-demo.html':'tests/quaxly-walk-demo.html';
 const movie=joint?'paldea-companions-walk':'quaxly-walk';
 const origin=process.argv[2]||'http://127.0.0.1:8765',out=path.resolve(process.argv[3]||'/tmp/quaxly-review');
 fs.mkdirSync(path.join(out,'frames'),{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:joint?{width:1280,height:940}:{width:960,height:700},deviceScaleFactor:1}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>{
   window.followerDraws=[];const draw=CanvasRenderingContext2D.prototype.drawImage;
   CanvasRenderingContext2D.prototype.drawImage=function(im,...args){
    if(im.src?.includes('/followers/pages/')){
     const mon=PsyFollower.selected(),entry=PsyFollower.manifest()[mon.id],frame=(args[0]-entry.x)/64,transform=this.getTransform();
     followerDraws.push({id:mon.id,shiny:!!mon.shiny,src:im.src.split('/').pop(),frame,dir:frame<2?'down':frame<4?'up':transform.a<0?'right':'left',x:transform.e,y:transform.f,state:window.demo?.state});
    }
    return draw.call(this,im,...args);
   };
  });
  await page.goto(origin+'/'+fixture);await page.waitForFunction(()=>window.demo?.ready);
  await page.clock.install({time:new Date('2026-11-06T00:00:00Z')});
  await page.clock.pauseAt(new Date('2026-11-06T00:00:01Z'));
  await page.evaluate(()=>{demo.restart();demo.render(0);window.followerDraws=[];});
  const duration=await page.evaluate(()=>demo.duration),count=Math.ceil(duration/50)+2;
  for(let i=0;i<count;i++){
   await page.clock.runFor(50);
   await page.locator('#demo').screenshot({path:path.join(out,'frames',String(i).padStart(4,'0')+'.png')});
  }
  const coverage=await page.evaluate(ids=>ids.flatMap(id=>[false,true].map(shiny=>{
   const rows=followerDraws.filter(d=>d.id===id&&d.shiny===shiny),idle={};
   for(const r of rows)if(r.state&&!r.state.moving)(idle[r.state.label]||=[]).push([r.x,r.y]);
   return {id,shiny,frames:[...new Set(rows.map(d=>d.frame))].sort(),directions:[...new Set(rows.map(d=>d.dir))].sort(),idle:Object.fromEntries(Object.entries(idle).map(([label,positions])=>[label,new Set(positions.slice(6).map(p=>p.join(','))).size]))};
  })),ids);
  for(const row of coverage){assert.deepEqual(row.frames,[0,1,2,3,4,5]);assert.deepEqual(row.directions,['down','left','right','up']);if(joint){assert(Object.keys(row.idle).length>=4);for(const value of Object.values(row.idle))assert.equal(value,1,'idle feet slide');}}
  assert.deepEqual(errors,[]);
  // Inspect actual decoded sprites in the same browser used to record playback.
  const specs=await page.evaluate(async ids=>{
   const rows=[];for(const id of ids)for(const shiny of [false,true]){
    const e=PsyFollower.manifest()[id],im=new Image();im.src='assets/followers/pages/'+(shiny?'shiny':'normal')+'-'+e.page+'.webp';await im.decode();
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;const ctx=canvas.getContext('2d',{willReadFrequently:true}),frames=[];
    for(let frame=0;frame<e.frames;frame++){
     ctx.clearRect(0,0,64,64);ctx.drawImage(im,e.x+frame*64,e.y,64,64,0,0,64,64);const data=[...ctx.getImageData(0,0,64,64).data];
     let x0=64,y0=64,x1=0,y1=0;for(let y=0;y<64;y++)for(let x=0;x<64;x++)if(data[(y*64+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+1);y1=Math.max(y1,y+1);}
     frames.push({bounds:[x0,y0,x1,y1],data});
    }
    rows.push({id,shiny,frames:frames.map(f=>f.bounds),pairDifferences:[0,2,4].map(n=>frames[n].data.reduce((sum,v,k)=>sum+(v!==frames[n+1].data[k]?1:0),0))});
   }return rows;
  },ids);
  for(const row of specs){for(const box of row.frames)assert.equal(box[3],63);for(const difference of row.pairDifferences)assert(difference>0,'duplicate artwork is not a stride');}
  const root=path.resolve(__dirname,'../..'),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
  const hashes=Object.fromEntries(['core/follower-v47.js','assets/followers/pages/normal-14.webp','assets/followers/pages/shiny-14.webp',fixture,'scripts/qa/record-quaxly-walk.cjs'].map(p=>[p,hash(p)]));
  fs.writeFileSync(path.join(out,'browser-demo-results.json'),JSON.stringify({durationMs:duration,frames:count,fps:20,coverage,specs,hashes,errors},null,2)+'\n');
  execFileSync('ffmpeg',['-y','-loglevel','error','-framerate','20','-i',path.join(out,'frames','%04d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-movflags','+faststart',path.join(out,movie+'.mp4')]);
  if(!joint)execFileSync('ffmpeg',['-y','-loglevel','error','-i',path.join(out,movie+'.mp4'),'-filter_complex','fps=20,split[a][b];[a]palettegen[p];[b][p]paletteuse=dither=none','-loop','0',path.join(out,movie+'.gif')]);
  console.log('PASS browser demo:',JSON.stringify({durationMs:duration,coverage,errors}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
