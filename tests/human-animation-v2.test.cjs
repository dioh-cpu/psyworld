const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const source=fs.readFileSync('core/trainer-walk-v1.js','utf8'),W={performance:{now:()=>0}};
vm.runInNewContext(source,{window:W,document:{createElement(){throw Error('temporal selection must not allocate a canvas')}}});
const api=W.PsyTrainerWalkV1,manifest=JSON.parse(fs.readFileSync('assets/characters/halloween/manifest.json'));
let cases=0;
for(const character of manifest.characters)for(const [key,file]of Object.entries(character.costumes)){
 const profile=api.animationProfile({src:'assets/characters/halloween/'+file});
 assert.equal(profile.category,key);
 assert.equal([...profile.sourceRows].join(','),['macabre_alt','supreme'].includes(key)?'0,2,3,1':'0,1,2,3');
 assert.equal(new Set(profile.walkOrder).size,4,'all authored human poses must be used');
 for(const fps of [30,60,120])for(const speed of [30,143,240]){
  const s=api.createState(),step=(t,x,y,moving,row=0,identity=file,discrete=false)=>api.sampleState(s,{now:t,x,y,moving,row,identity,discrete,profile});
  step(0,-1,0,false);step(0,0,0,true);
  for(let n=1;n<=fps*2;n++){
   const t=n*1000/fps,p=step(t,speed*t/1000,0,true);
   assert.equal(p.state,'walk');assert.equal(p.col,profile.walkOrder[Math.floor((t+1e-7)/profile.walkMs)%4],file+' cadence '+fps+' / '+speed+' @'+t);
  }
  const last=s.col,stop=step(2010,speed*2,0,false);assert.equal(stop.state,'settle');assert.equal(stop.col,last,'settle without snapping to a different foot/face');
  const idle=[];for(let n=1;n<=fps*5;n++){
   const t=2010+n*1000/fps,p=step(t,speed*2,0,false);idle.push(p.breath);assert.equal(p.row,0);assert.equal(p.col,last);
   assert.equal(p.breath,Math.floor((Math.max(0,n*1000/fps-120)+1e-7)/(profile.idleMs/4))%4);
  }
  assert.equal(new Set(idle).size,4);
  const restart=step(7020,speed*2+2,0,true,2);assert.equal(restart.state,'walk');assert.equal(restart.col,profile.walkOrder[0]);
  const turn=step(7090,speed*2+5,1,true,3);assert.equal(turn.row,3);assert.equal(turn.elapsed,70,'turn must preserve temporal phase');
  const held=step(7100,speed*2+5,1,false,null);assert.equal(held.row,3,'last direction persists');
  const pause=step(12000,speed*2+10,1,true,3);assert.equal(pause.elapsed,0,'hidden-tab gap cannot fast-forward animation');
  const costume=step(12010,0,0,false,1,'new-costume');assert.equal(costume.col,0);assert.equal(costume.row,1);assert.equal(costume.state,'idle');
  cases++;
 }
 // Real campaign positions advance in tiles, every 160 ms. Intent alone must
 // expire at a wall; release immediately settles the last pose.
 const s=api.createState();api.sampleState(s,{now:0,x:-1,y:0,profile,identity:file});api.sampleState(s,{now:0,x:0,y:0,moving:true,discrete:true,profile,identity:file});
 for(let t=20;t<=480;t+=20){const p=api.sampleState(s,{now:t,x:Math.floor(t/160)*28,y:0,moving:true,discrete:true,profile,identity:file});assert.equal(p.state,'walk');assert.equal(p.col,profile.walkOrder[Math.floor(t/profile.walkMs)%4]);}
 const wall=api.sampleState(s,{now:700,x:84,y:0,moving:true,discrete:true,profile,identity:file});assert.equal(wall.state,'settle');
 const samples=[];const pack={image:{},cellWidth:160,cellHeight:128,columns:8};const ctx={drawImage(...a){samples.push(a)}};
 api.drawAnimated(ctx,pack,{state:'walk',row:3,col:2},10,20,48,64);assert.equal(samples[0][1],6*160);assert.equal(samples[0][2],128);assert.equal(samples[0][5],-30);assert.equal(samples[0][7],128);assert.equal(samples[0][8],64);
}
const baseline=JSON.parse(fs.readFileSync('tests/fixtures/human-animation-v2-baseline.json'));
for(const [file,hash]of Object.entries(baseline.files))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,'protected original/gameplay file changed: '+file);
for(const section of baseline.protectedSections){const text=fs.readFileSync(section.file,'utf8'),a=text.indexOf(section.start),b=text.indexOf(section.end,a+section.start.length);assert(a>=0&&b>a);assert.equal(crypto.createHash('sha256').update(text.slice(a,b)).digest('hex'),section.sha256,'movement/collision/persistence logic changed: '+section.file+' '+section.start);}
// Public legacy trainer helpers remain available for old callers and approved demos.
assert.equal([...api.columns].join(','),'1,0,3,0');assert.equal(api.column(0,false),0);
console.log(`PASS human animation V2: ${cases} timing scenarios across all 30 looks; WALK/IDLE at 30/60/120 FPS and 3 speeds; turns, contact settling, direction retention, tile gaps, walls, identity and background reset; ${Object.keys(baseline.files).length} protected files unchanged.`);
