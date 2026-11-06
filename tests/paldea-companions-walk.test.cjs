const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const sha256=data=>createHash('sha256').update(data).digest('hex');
const BASE='d3198ba9fef700ec0ad2e8090f832fc4a1a8a824';
const source=fs.readFileSync('core/follower-v47.js','utf8');
// Portable frozen baseline: no dependency on the Codex checkout or git object store.
const approved=fs.readFileSync('tests/fixtures/follower-quaxly-d3198ba.js.txt','utf8');
assert.equal(sha256(approved),'312b9fdd9991af358f2092a849b83c3b9b7b5302859412357c3b12465030e568','approved controller fixture integrity');
const protectedFiles={"assets/followers/manifest-v47.json":"9bd41953ae76221c2ae9592c29c9f08930582635c6ebbb91aabe9f3f49af7902","assets/followers/pages/normal-14.webp":"274df7e84ffabc3e7bef428ee74278ab3ba2aa73fa7c8c4b365bc2e25e5efdc8","assets/followers/pages/shiny-14.webp":"2be4c840ec0ddab190158b90678c2524959df0b1dbb3e1ae48aab2a733f19150","core/city-halloween.js":"ccb44844560f58a9e06c5715d50b30879f68a6352f86c3a767e826dcacdcc61c","tests/quaxly-walk.test.cjs":"62ebc06aca4b1132d165cfed41ec4fa3f3e769b4dc61a2b12ec1650b0b71fc8c","tests/quaxly-walk-demo.html":"173ae0e20017f94fcabca09c1be9db8120e8de30207a09178aed0862a41451e8"};
const manifest=JSON.parse(fs.readFileSync('assets/followers/manifest-v47.json'));
const profiles={906:{ms:115,scale:1.5,shadow:[9,3]},909:{ms:170,scale:1.65,shadow:[9,3.5]},921:{ms:125,scale:1.45,shadow:[7,2.5]}};
async function rig(id,shiny=false,code=source){
 let now=0,commands=[];
 const window={P:{team:[{id,hp:100,pokemon_uid:'review',shiny}],meta:{followerV47:{enabled:true,key:'review'}}},performance:{now:()=>now},setInterval(){}};
 const document={createElement:()=>({setAttribute(){}}),body:{appendChild(){}}};
 class Image{complete=true;naturalWidth=4096;src='';}
 vm.runInNewContext(code,{window,document,Image,fetch:async()=>({json:async()=>manifest})});
 await new Promise(setImmediate);
 const c=new Proxy({},{get:(_,method)=>(...args)=>commands.push([method,...args.map(v=>v instanceof Image?v.src:v)]),set:(_,key,value)=>{commands.push(['set',key,value]);return true;}});
 return {api:window.PsyFollower,draw(t,x,y=100,moving=true,scene='review',continuing=false){
  now=t;commands=[];window.PsyFollower.draw(c,{x,y,moving,scene,continuing,valid:()=>true});
  const image=commands.find(v=>v[0]==='drawImage');assert(image,'actual sprite draw');
  return {commands:JSON.parse(JSON.stringify(commands)),frame:(image[2]-manifest[id].x)/64,box:image.slice(6),shadow:commands.find(v=>v[0]==='ellipse').slice(1),pos:commands.find(v=>v[0]==='translate').slice(1),image:image[1]};
 }};
}
(async()=>{
 let cadenceCases=0,regressionDraws=0;
 for(const [id,p]of Object.entries(profiles))for(const shiny of [false,true])for(const fps of [30,60,120])for(const speed of [30,143,240]){
  const r=await rig(+id,shiny);r.draw(0,0);r.draw(0,40);
  for(let n=1;n<=fps*2;n++){
   const t=n*1000/fps,out=r.draw(t,40+speed*t/1000);
   assert.equal(out.frame,4+Math.floor((t+1e-7)/p.ms)%2,`${id} ${shiny} ${fps}fps ${speed}px/s @${t}`);
   assert.equal(out.image,`assets/followers/pages/${shiny?'shiny':'normal'}-14.webp`);
   assert.deepEqual(out.shadow.slice(2,4),p.shadow);
   assert.deepEqual(out.box,[-32*p.scale,-63*p.scale,64*p.scale,64*p.scale]);
  }
  const x=40+speed*2,stop=r.draw(2010,x,100,false);assert.equal(stop.frame,4);
  for(const t of [2050,2300,3000]){const out=r.draw(t,x,100,false);assert.equal(out.frame,4);assert.deepEqual(out.pos,stop.pos);}
  assert.equal(r.draw(3010,x+3).frame,4);cadenceCases++;
 }
 for(const id of Object.keys(profiles).map(Number))for(const shiny of [false,true]){
  const r=await rig(id,shiny);let x=100,y=100,t=0;r.draw(0,x,y);
  for(const [dx,dy,base]of [[1,0,4],[0,1,0],[-1,0,4],[0,-1,2]]){
   let out;for(let n=0;n<80;n++){t+=20;x+=3*dx;y+=3*dy;out=r.draw(t,x,y);}
   assert([base,base+1].includes(out.frame));
   assert.equal(out.commands.some(v=>v[0]==='scale'),dx===1,'only right-facing sprites mirror');
  }
  assert.equal(r.draw(t+20,800,800,true,'new-room').frame,0);
  assert.equal(r.draw(t+40,1200,1200).frame,0);
  const p=profiles[id],corner=await rig(id,shiny);
  corner.draw(0,0);corner.draw(0,40);corner.draw(p.ms,60);
  assert.equal(corner.draw(p.ms+10,60,140).frame,1,'direction transition preserves clock phase');
  const tile=await rig(id,shiny);tile.draw(0,0);tile.draw(0,40);
  for(let t=20;t<=480;t+=20)assert.equal(tile.draw(t,40+Math.floor(t/160)*28).frame,4+Math.floor(t/p.ms)%2);
  assert.equal(tile.draw(500,124,100,false).frame,4);
  const city=await rig(id,shiny);city.draw(0,0);city.draw(0,40);city.draw(100,60);
  city.draw(120,60,100,false,'review',true);
  assert.equal(city.draw(180,63).frame,4+Math.floor(180/p.ms)%2);
  assert.equal(city.draw(420,63,100,false,'review',true).frame,4,'wall does not sustain feet');
 }
 // Compare EVERY canvas command to the approved source, not just a pose number.
 const eight=Number(Object.keys(manifest).find(id=>manifest[id].frames===8));
 for(const id of [912,1,25,54,133,eight])for(const shiny of [false,true]){
  const before=await rig(id,shiny,approved),after=await rig(id,shiny);
  const check=(...args)=>{assert.deepEqual(after.draw(...args).commands,before.draw(...args).commands,`approved rendering id=${id} @${args}`);regressionDraws++;};
  check(0,100,100,false);let x=100,y=100,t=0;
  for(const [dx,dy]of [[1,0],[0,1],[-1,0],[0,-1]])for(let i=0;i<80;i++){t+=1000/60;x+=dx*2;y+=dy*2;check(t,x,y,true);}
  check(t+20,x,y,false);check(t+40,x,y,false,'review',true);check(t+260,x,y,true,'review',true);
  check(t+500,x,y,false);check(t+600,x+1000,y+1000,true);check(t+620,x,y,true,'second-scene');
 }
 const sample=s=>s.slice(s.indexOf('function sample('),s.indexOf("// Quaxly's two authored"));
 assert.equal(sample(source),sample(approved),'trail and collisions unchanged');
 // Quaxly assets, approved demo and city integration remain byte-identical.
 for(const [p,hash]of Object.entries(protectedFiles))assert.equal(sha256(fs.readFileSync(p)),hash,p+' changed from '+BASE);

 console.log(`PASS companion animation: ${cadenceCases} normal/Shiny cadence scenarios; directions, curves, idle/restart, tile gaps, wall expiry, scene/teleport; ${regressionDraws} exact approved-render comparisons (Quaxly and legacy species); art, trail and collisions unchanged.`);
})().catch(e=>{console.error(e);process.exitCode=1});
