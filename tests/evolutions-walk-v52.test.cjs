const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const manifest=JSON.parse(fs.readFileSync('assets/followers/manifest-v47.json'));
const source=fs.readFileSync('core/follower-v47.js','utf8');
const before=fs.readFileSync('tests/fixtures/follower-starters-v51.js.txt','utf8');
const strip=s=>s.replace(/const kantoGaits=Object.freeze\(\{[\s\S]*?\n\}\);/,'GAITS');assert.equal(strip(source),strip(before),'only gait registry changed');
const gaitMap=s=>new Map([...s.matchAll(/(\d+):\{cadence:[^\n]+/g)].map(m=>[m[1],m[0]]));const oldGaits=gaitMap(before),newGaits=gaitMap(source);for(const [id,p] of oldGaits)assert.equal(newGaits.get(id),p,'approved gait preserved '+id);
async function rig(id=912,shiny=false){
 let now=0,draws=[],shadows=[],translations=[],scales=[];
 const mon={id,hp:100,pokemon_uid:'qa',shiny};
 const window={P:{team:[mon],meta:{followerV47:{enabled:true,key:'qa'}}},performance:{now:()=>now},setInterval(){}};
 const document={createElement:()=>({setAttribute(){}}),body:{appendChild(){}}};
 class Image{complete=true;naturalWidth=4096;set src(v){this.url=v;}get src(){return this.url;}}
 vm.runInNewContext(source,{window,document,Image,fetch:async()=>({json:async()=>manifest})});
 await new Promise(setImmediate);
 const c={save(){},restore(){},translate(...p){translations.push(p)},scale(...p){scales.push(p)},beginPath(){},ellipse(...p){shadows.push(p)},fill(){},drawImage(...p){draws.push(p)}};
 return {api:window.PsyFollower,draw(t,x,y=100,moving=true,scene='qa',continuing=false){
  now=t;draws=[];shadows=[];translations=[];scales=[];
  window.PsyFollower.draw(c,{x,y,moving,scene,continuing,valid:()=>true});
  assert.equal(draws.length,1);
  return {frame:(draws[0][1]-manifest[id].x)/64,image:draws[0][0].url,shadow:shadows[0],pos:translations[0],scales,box:draws[0].slice(5)};
 }};
}
(async()=>{
 const species=[[2, "Ivysaur", 161, 63, 10, 3], [3, "Venusaur", 192, 63, 13, 4], [5, "Charmeleon", 132, 63, 9, 3], [6, "Charizard", 138, 63, 9, 3], [8, "Wartortle", 166, 63, 10, 3], [9, "Blastoise", 198, 63, 13, 4], [153, "Bayleef", 166, 63, 10, 3], [154, "Meganium", 198, 63, 13, 4], [156, "Quilava", 156, 63, 10, 3], [157, "Typhlosion", 161, 63, 10, 3], [159, "Croconaw", 171, 63, 9, 3], [160, "Feraligatr", 174, 63, 13, 4], [253, "Grovyle", 132, 63, 10, 3], [254, "Sceptile", 138, 63, 10, 3], [256, "Combusken", 156, 63, 9, 3], [257, "Blaziken", 132, 63, 9, 3], [259, "Marshtomp", 171, 63, 10, 3], [260, "Swampert", 174, 63, 13, 4], [388, "Grotle", 166, 63, 10, 3], [389, "Torterra", 198, 63, 13, 4], [391, "Monferno", 144, 63, 9, 3], [392, "Infernape", 126, 63, 9, 3], [394, "Prinplup", 171, 63, 9, 3], [395, "Empoleon", 174, 63, 13, 4], [496, "Servine", 156, 63, 9, 3], [497, "Serperior", 161, 63, 10, 3], [499, "Pignite", 171, 63, 9, 3], [500, "Emboar", 174, 63, 13, 4], [502, "Dewott", 161, 63, 9, 3], [503, "Samurott", 192, 63, 13, 4], [651, "Quilladin", 156, 63, 9, 3], [652, "Chesnaught", 186, 63, 13, 4], [654, "Braixen", 171, 63, 9, 3], [655, "Delphox", 151, 63, 10, 3], [657, "Frogadier", 161, 63, 9, 3], [658, "Greninja", 138, 63, 9, 3], [723, "Dartrix", 166, 63, 9, 3], [724, "Decidueye", 171, 63, 9, 3], [726, "Torracat", 156, 63, 10, 3], [727, "Incineroar", 186, 63, 13, 4], [729, "Brionne", 171, 63, 9, 3], [730, "Primarina", 151, 63, 9, 3], [811, "Thwackey", 156, 63, 9, 3], [812, "Rillaboom", 186, 63, 13, 4], [814, "Raboot", 138, 63, 9, 3], [815, "Cinderace", 144, 63, 9, 3], [817, "Drizzile", 161, 63, 9, 3], [818, "Inteleon", 138, 63, 9, 3]];
 for(const [id,name,cadence,sole,shadow,shadowY] of species){
  for(const shiny of [false,true])for(const fps of [30,60,120])for(const speed of [30,143,240]){
   const r=await rig(id,shiny);r.draw(0,0);r.draw(0,40);
   for(let n=1;n<=fps;n++){
    const t=n*1000/fps,out=r.draw(t,40+speed*t/1000);
    assert.equal(out.frame,(manifest[id].frames===8?6:4)+Math.floor((t+1e-7)/cadence)%2,`${name} ${fps} fps ${speed}px/s ${t}`);
    assert.equal(out.image,`assets/followers/pages/${shiny?'shiny':'normal'}-${manifest[id].page}.webp`);
    assert.equal(out.shadow[2],shadow);assert.equal(out.shadow[3],shadowY);
    assert.equal(out.box[1],-sole*(manifest[id].size>32?.9:1.6));
   }
   const x=40+speed;
   const rest=r.draw(1010,x,100,false);assert.equal(rest.frame,manifest[id].frames===8?6:4);
   for(const t of [1030,1300,2000])assert.deepEqual(r.draw(t,x,100,false).pos,rest.pos);
   assert.equal(r.draw(2010,x+3).frame,manifest[id].frames===8?6:4);
  }
  const r=await rig(id);r.draw(0,100,100);
  let t=0,x=100,y=100;
  for(const [dx,dy,base] of [[1,0,manifest[id].frames===8?6:4],[0,1,0],[-1,0,4],[0,-1,2]]){
   let out;for(let n=0;n<100;n++){t+=20;x+=dx*3;y+=dy*3;out=r.draw(t,x,y);}
   assert([base,base+1].includes(out.frame));
   assert.equal(out.scales.length,dx===1&&manifest[id].frames!==8?1:0);
  }
  assert.equal(r.draw(t+20,900,900,true,'new-room').frame,0);
  assert.equal(r.draw(t+40,1300,1300).frame,0);
  const wall=await rig(id);wall.draw(0,0);for(let k=20;k<1000;k+=20)assert.equal(wall.draw(k,0,100,true).frame,0);
  const city=await rig(id);city.draw(0,0);city.draw(0,40);city.draw(100,60);city.draw(120,60,100,false,'qa',true);
  assert.equal(city.draw(160,63,100,true,'qa',true).frame,(manifest[id].frames===8?6:4)+Math.floor(160/cadence)%2);
  assert.equal(city.draw(400,63,100,false,'qa',true).frame,manifest[id].frames===8?6:4);
  assert.equal(city.draw(420,63,100,false).frame,manifest[id].frames===8?6:4);
  
 }
 // Existing Quaxly and unrelated species still use their original code paths.
 const q=await rig(912);q.draw(0,0);q.draw(0,40);assert.equal(q.draw(160,60).frame,5);
 const p=await rig(25);p.draw(0,0);const a=p.draw(160,60);assert.equal(a.shadow[3],5);
 const approved=fs.readFileSync('tests/fixtures/follower-companions-v50.js.txt','utf8');const func=(s,name)=>{const start=s.indexOf('function '+name+'(');return s.slice(start,s.indexOf('\n}\n',start)+3)};assert.equal(func(source,'sample'),func(approved,'sample'),'trail unchanged');assert.equal(func(source,'quaxlyStep'),func(approved,'quaxlyStep'),'approved clock unchanged');assert(source.includes('if(pages.size>2)'),'retain two-page production cache');assert.equal(Object.keys(manifest).length,1025,'complete manifest preserved');console.log('PASS 48 Gen1–8 evolutions: 864 normal/Shiny FPS/speed scenarios; directions, idle, walls, scenes/teleports; approved Quaxly clock/trail and 1025-species manifest preserved.');
})().catch(e=>{console.error(e);process.exitCode=1});
