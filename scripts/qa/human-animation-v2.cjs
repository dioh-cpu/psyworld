// Approved Playwright clock -> production controller -> PNG frames -> ffmpeg.
// node scripts/qa/human-animation-v2.cjs build|preview|capture ORIGIN OUTPUT [LOOK|all]
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const mode=process.argv[2]||'build',origin=process.argv[3]||'http://127.0.0.1:8766',out=path.resolve(process.argv[4]||'/tmp/human-animation-v2'),root=path.resolve(__dirname,'../..');
fs.mkdirSync(out,{recursive:true});
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const sourcePaths=['core/trainer-walk-v1.js','core/halloween-ui.js','core/kanto-world-v2.js','core/kanto-campaign-playable-v1.js','tests/human-animation-v2.html','scripts/qa/human-animation-v2.cjs','assets/characters/animation-v2/manifest.json'];
const sourceHashes=Object.fromEntries(sourcePaths.map(p=>[p,hash(fs.readFileSync(path.join(root,p)))]));
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const allKeys=['basic','divine','macabre','macabre_alt','supreme'];
 const keys=['preview','build'].includes(mode)&&process.argv[5]&&process.argv[5]!=='all'?[process.argv[5]]:allKeys;
 const catalog=[],matrix=[],checks=[],coverage=new Map(),errors=[];let frameOffset=0,duration=0;
 const atlasDir=path.join(root,'assets/characters/animation-v2');if(mode==='build')fs.mkdirSync(atlasDir,{recursive:true});
 try{
 for(const key of keys){
  const checkpoint=path.join(out,'capture-'+key+'.json');
  if(mode==='capture'&&fs.existsSync(checkpoint)){
   const saved=JSON.parse(fs.readFileSync(checkpoint));assert.deepEqual(saved.hashes,sourceHashes,'capture source changed: use a new output directory');assert.equal(saved.startFrame,frameOffset);
   for(let n=saved.startFrame;n<saved.startFrame+saved.frames;n++)assert(fs.existsSync(path.join(out,'frames',String(n).padStart(5,'0')+'.png')),'missing checkpoint frame');
   for(const [id,poses]of Object.entries(saved.coverage))coverage.set(id,new Set(poses));frameOffset+=saved.frames;duration+=saved.durationMs;console.log('RESUME capture',key);continue;
  }
  // A separate page/context per category bounds decoded-sheet memory on mobile-sized workers.
  const page=await browser.newPage({viewport:{width:1280,height:1020},deviceScaleFactor:1});page.on('pageerror',e=>{errors.push(String(e));console.error('BROWSER ERROR',String(e));});
  try{
   await page.goto(origin+'/tests/human-animation-v2.html?look='+key+(mode==='build'?'&build=1':''),{waitUntil:'domcontentloaded',timeout:120000});
   await Promise.race([page.waitForFunction(()=>window.HumanStudioV2?.ready,{},{timeout:120000}),new Promise((_,reject)=>page.once('pageerror',reject))]);assert.deepEqual(errors,[]);
   if(mode==='build'){
    const group=await page.evaluate(()=>HumanStudioV2.catalog.map(c=>({id:c.id,name:c.name,key:c.key,url:c.image.src,profile:c.pack.profile,bounds:c.pack.bounds,gaitMetrics:c.pack.gaitMetrics})));assert.equal(group.length,6);
   for(let index=0;index<group.length;index++){
    const item=group[index];
    const result=await page.evaluate(index=>{
     const {pack}=HumanStudioV2.catalog[index],{image,cellWidth:w,cellHeight:h,columns}=pack;
     const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});
     const tile=n=>{ctx.clearRect(0,0,w,h);ctx.drawImage(image,(n%columns)*w,Math.floor(n/columns)*h,w,h,0,0,w,h);return ctx.getImageData(0,0,w,h).data;};
     let headDiff=0,feetDiff=0,torsoDiff=0,clipped=0,walkHeadDiff=0,maxHeightError=0,maxSoleError=0;const poses=[];
     for(let pose=0;pose<16;pose++){
      const base=tile(pose),headReference=tile(Math.floor(pose/4)*4);for(let k=0;k<68*w*4;k++)if(base[k]!==headReference[k])walkHeadDiff++;let l=w,t=h,r=0,b=0;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(base[(y*w+x)*4+3]>32){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x+1);b=Math.max(b,y+1);}
      if(l<=0||r>=w||t<=0||b>=h)clipped++;
      maxHeightError=Math.max(maxHeightError,Math.abs((b-t)-92));maxSoleError=Math.max(maxSoleError,Math.abs(b-120));poses.push({row:Math.floor(pose/4),col:pose%4,bounds:[l,t,r,b]});
      for(let breath=0;breath<4;breath++){
       const idle=tile(48+pose*4+breath),neutral=tile(48+pose*4);
       for(let y=0;y<h;y++)for(let x=0;x<w;x++)for(let k=0;k<4;k++)if(base[(y*w+x)*4+k]!==idle[(y*w+x)*4+k]){if(y<68)headDiff++;else if(y>=98&&neutral[(y*w+x)*4+k]!==idle[(y*w+x)*4+k])feetDiff++;else if(y<98&&neutral[(y*w+x)*4+k]!==idle[(y*w+x)*4+k])torsoDiff++;}
      }
     }
     const png=image.toDataURL('image/png');return {headDiff,feetDiff,torsoDiff,clipped,walkHeadDiff,maxHeightError,maxSoleError,poses,png};
    },index);
    assert.equal(result.headDiff,0,item.profile.file+' idle face');assert.equal(result.feetDiff,0,item.profile.file+' idle feet');assert.equal(result.clipped,0,item.profile.file+' accessory clipping');assert.equal(result.walkHeadDiff,0,item.profile.file+' head-size drift');assert.equal(result.maxHeightError,0,item.profile.file+' body-size drift');assert.equal(result.maxSoleError,0,item.profile.file+' floor drift');assert(result.torsoDiff>0,item.profile.file+' breathing');
    for(const b of item.bounds)assert(Math.abs(b.destination[2]/b.source[2]-b.destination[3]/b.source[3])<1e-8,'nonuniform scaling');
    const pngName=item.profile.file,pngTemp=path.join(out,'encode.png');fs.writeFileSync(pngTemp,Buffer.from(result.png.split(',')[1],'base64'));delete result.png;
    execFileSync('python',['-c',"from PIL import Image; import sys; a=Image.open(sys.argv[1]).convert('RGBA'); a.save(sys.argv[2],lossless=True,exact=True,method=6); assert Image.open(sys.argv[2]).convert('RGBA').tobytes()==a.tobytes()",pngTemp,path.join(atlasDir,pngName)]);fs.unlinkSync(pngTemp);
    const original='assets/characters/halloween/'+item.profile.file;item.original=original;item.originalSha256=hash(fs.readFileSync(path.join(root,original)));item.atlas='assets/characters/animation-v2/'+pngName;item.atlasSha256=hash(fs.readFileSync(path.join(root,item.atlas)));item.neutral='assets/characters/idle-v2/'+item.profile.file;item.neutralSha256=hash(fs.readFileSync(path.join(root,item.neutral)));item.walk='assets/characters/walk-v2/'+item.profile.file;item.walkSha256=hash(fs.readFileSync(path.join(root,item.walk)));delete item.url;
    for(const [row,direction]of ['south','west','east','north'].entries())for(const state of ['walk','idle'])matrix.push({character:item.id,name:item.name,visual:item.key,role:item.key==='basic'?'original/journey':'halloween',direction,state,sourceRow:item.profile.sourceRows[row],source:original,atlas:item.atlas,walkMs:item.profile.walkMs,idleMs:item.profile.idleMs,automatedValidated:true,visualStatus:state==='walk'?'approved-complementary-walk-expanded-review-candidate':'approved-complementary-neutral-art-expanded-review-candidate'});
    for(const state of ['walk','settle','idle']){
     const dataURL=await page.evaluate(({index,state})=>{
      const {pack}=HumanStudioV2.catalog[index],a=document.createElement('canvas');a.width=pack.cellWidth*4;a.height=696;const c=a.getContext('2d');c.fillStyle='#253541';c.fillRect(0,0,a.width,a.height);c.fillStyle='#fff';c.font='16px sans-serif';c.fillText(pack.profile.file+' · '+state.toUpperCase()+' · todos os frames no mesmo chão',8,24);
      for(let row=0;row<4;row++)for(let col=0;col<4;col++){
       const n=state==='walk'?row*4+col:state==='settle'?16+(row*4+col)*2:48+(row*4)*4+col;
       const x=col*pack.cellWidth,y=40+row*164;c.fillStyle='#bfe9d4';c.font='13px sans-serif';c.fillText(['SOUTH','WEST','EAST','NORTH'][row]+' · '+col,x+7,y+13);
       c.drawImage(pack.image,(n%pack.columns)*pack.cellWidth,Math.floor(n/pack.columns)*pack.cellHeight,pack.cellWidth,pack.cellHeight,x,y+22,pack.cellWidth,pack.cellHeight);
       c.strokeStyle='#72ddae';c.beginPath();c.moveTo(x,y+142.5);c.lineTo(x+pack.cellWidth,y+142.5);c.stroke();c.fillStyle='#9fb3c4';c.fillText('apoio = 120 px · altura = 92 px',x+7,y+158);
      }return a.toDataURL('image/png');
     },{index,state});
     const aligned=path.join(out,'aligned');fs.mkdirSync(aligned,{recursive:true});fs.writeFileSync(path.join(aligned,item.id+'-'+item.key+'-'+state+'.png'),Buffer.from(dataURL.split(',')[1],'base64'));
    }
    checks.push({id:item.id,key:item.key,...result});catalog.push(item);console.log('PASS atlas',item.id,item.key,'face/feet stable; no clipping');
   }
   }else{
    await page.waitForFunction(()=>HumanStudioV2.catalog.every(c=>c.pack.compiledStatus==='ready'),{},{timeout:30000});
    await page.clock.install({time:new Date('2026-11-07T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-07T00:00:01Z'));
    await page.evaluate(()=>{HumanStudioV2.restart();HumanStudioV2.render(0);});
    if(mode==='identity'){
     for(let index=0;index<6;index++){
      const data=await page.evaluate(index=>{
       const item=HumanStudioV2.catalog[index],p=item.pack,w=p.cellWidth,h=p.cellHeight,a=document.createElement('canvas');a.width=w*6;a.height=696;const c=a.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#253541';c.fillRect(0,0,a.width,a.height);c.fillStyle='#fff';c.font='16px sans-serif';c.fillText(item.name+' / '+item.key+' · FONTE ORIGINAL × WALK + IDLE · mesma altura de referência e mesmo chão',8,24);
       for(let row=0;row<4;row++)for(let col=0;col<6;col++){
        const x=col*w,y=40+row*164;c.fillStyle='#bfe9d4';c.font='13px sans-serif';c.fillText(['SOUTH','WEST','EAST','NORTH'][row]+' · '+['ORIGINAL','WALK 0','WALK 1','WALK 2','WALK 3','IDLE'][col],x+7,y+13);
        if(col===0){const b=p.bounds[row*4],r=b.source,d=b.destination;c.drawImage(item.image,r[0],b.sourceRow*512+r[1],r[2],r[3],x+d[0],y+22+d[1],d[2],d[3]);}
        else{const tile=col===5?48+row*16:row*4+col-1;c.drawImage(p.image,(tile%p.columns)*w,Math.floor(tile/p.columns)*h,w,h,x,y+22,w,h);}
        c.strokeStyle='#72ddae';c.beginPath();c.moveTo(x,y+142.5);c.lineTo(x+w,y+142.5);c.stroke();
       }return {id:item.id,key:item.key,png:a.toDataURL('image/png')};
      },index);
      fs.writeFileSync(path.join(out,data.id+'-'+data.key+'-identity.png'),Buffer.from(data.png.split(',')[1],'base64'));
     }
    }else if(mode==='preview'){
     let previous=0;for(const time of [100,1300,3300,5000,8300,9900,13000,15000,18500,22400]){
      await page.clock.runFor(time-previous);previous=time;await page.locator('#studio').screenshot({path:path.join(out,key+'-preview-'+time+'.png')});
     }
    }else{
     const pageDuration=await page.evaluate(()=>HumanStudioV2.duration),frames=Math.ceil(pageDuration/50),startFrame=frameOffset;duration+=pageDuration;
     fs.mkdirSync(path.join(out,'frames'),{recursive:true});
     for(let i=0;i<frames;i++){
      await page.clock.runFor(50);const state=await page.evaluate(()=>HumanStudioV2.state);
      for(const actor of state.actors){if(actor.pose.state==='settle')continue;const k=actor.id+':'+actor.key+':'+actor.pose.row+':'+actor.pose.state;if(!coverage.has(k))coverage.set(k,new Set());coverage.get(k).add(actor.pose.state==='walk'?actor.pose.col:actor.pose.breath);}
      const filename=path.join(out,'frames',String(frameOffset++).padStart(5,'0')+'.png');await page.locator('#studio').screenshot({path:filename});
      if(i===65)fs.copyFileSync(filename,path.join(out,key+'-comparison.png'));
      if(i%200===0)console.log('CAPTURE',key,i,'/',frames);
     }
     const group=Object.fromEntries([...coverage].filter(([id])=>id.split(':')[1]===key).map(([id,poses])=>[id,[...poses].sort()]));assert.equal(Object.keys(group).length,48);for(const poses of Object.values(group))assert.equal(poses.length,4);assert.deepEqual(errors,[]);
     fs.writeFileSync(checkpoint,JSON.stringify({key,startFrame,frames,durationMs:pageDuration,hashes:sourceHashes,coverage:group},null,2)+'\n');
    }
   }
  }finally{await page.close()}
 }
 if(mode==='build'){
  const manifest={schema:'psyworld.human-animation.v2',baseCommit:JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/human-animation-v2-baseline.json'))).base,logicalViewport:[48,64],logicalCell:[128,64],scale:2,atlasGrid:[8,14],walkTiles:'row*4+pose',settleTiles:'16+(row*4+pose)*2+halfOrFull',idleTiles:'48+(row*4+pose)*4+breath',catalog};
  fs.writeFileSync(path.join(keys.length===5?atlasDir:out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  fs.writeFileSync(path.join(out,'coverage-matrix.json'),JSON.stringify(matrix,null,2)+'\n');fs.writeFileSync(path.join(out,'atlas-tests.json'),JSON.stringify(checks,null,2)+'\n');
  assert.equal(matrix.length,keys.length*48);console.log('PASS',catalog.length,'lossless final sheets /',matrix.length,'character × look × direction × state combinations');
 }else if(mode==='capture'){
  assert.equal(coverage.size,240);for(const [key,frames]of coverage)assert.equal(frames.size,4,key+' missing phase');assert.deepEqual(errors,[]);
  assert.deepEqual(Object.fromEntries(sourcePaths.map(p=>[p,hash(fs.readFileSync(path.join(root,p)))])),sourceHashes,'source changed during capture');
  fs.writeFileSync(path.join(out,'video-tests.json'),JSON.stringify({durationMs:duration,fps:20,frames:frameOffset,coverage:Object.fromEntries([...coverage].map(([key,value])=>[key,[...value].sort()])),errors,hashes:Object.fromEntries(sourcePaths.map(p=>[p,hash(fs.readFileSync(path.join(root,p)))]))},null,2)+'\n');
  execFileSync('ffmpeg',['-y','-loglevel','error','-framerate','20','-i',path.join(out,'frames','%05d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-crf','17','-movflags','+faststart',path.join(out,'PSYWORLD-Characters-WALK-IDLE-V2.mp4')]);
  console.log('PASS real production renderer video:',duration/1000,'seconds,',coverage.size,'combinations');
 }else console.log('PASS preview');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
