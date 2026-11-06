const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const manifest=JSON.parse(fs.readFileSync('assets/followers/manifest-v47.json'));
const source=fs.readFileSync('core/follower-v47.js','utf8');
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
 const species=[[1, "Bulbasaur", 165, 63, 9], [4, "Charmander", 125, 62, 8], [7, "Squirtle", 145, 62, 8], [152, "Chikorita", 170, 63, 10], [155, "Cyndaquil", 145, 63, 8], [158, "Totodile", 130, 63, 9], [252, "Treecko", 135, 63, 8], [255, "Torchic", 150, 63, 7], [258, "Mudkip", 165, 63, 10], [387, "Turtwig", 175, 63, 10], [390, "Chimchar", 125, 63, 8], [393, "Piplup", 155, 63, 8], [495, "Snivy", 148, 63, 8], [498, "Tepig", 165, 63, 10], [501, "Oshawott", 145, 63, 8], [650, "Chespin", 145, 63, 9], [653, "Fennekin", 155, 63, 9], [656, "Froakie", 120, 63, 9], [722, "Rowlet", 175, 63, 8], [725, "Litten", 150, 63, 10], [728, "Popplio", 168, 63, 10], [810, "Grookey", 145, 63, 8], [813, "Scorbunny", 115, 63, 8], [816, "Sobble", 158, 63, 8]];
 for(const [id,name,cadence,sole,shadow] of species){
  for(const shiny of [false,true])for(const fps of [30,60,120])for(const speed of [30,143,240]){
   const r=await rig(id,shiny);r.draw(0,0);r.draw(0,40);
   for(let n=1;n<=fps;n++){
    const t=n*1000/fps,out=r.draw(t,40+speed*t/1000);
    assert.equal(out.frame,4+Math.floor((t+1e-7)/cadence)%2,`${name} ${fps} fps ${speed}px/s ${t}`);
    assert.equal(out.image,`assets/followers/pages/${shiny?'shiny':'normal'}-${manifest[id].page}.webp`);
    assert.equal(out.shadow[2],shadow);assert.equal(out.shadow[3],3);
    assert.equal(out.box[1],-sole*(manifest[id].size>32?.9:1.6));
   }
   const x=40+speed;
   const rest=r.draw(1010,x,100,false);assert.equal(rest.frame,4);
   for(const t of [1030,1300,2000])assert.deepEqual(r.draw(t,x,100,false).pos,rest.pos);
   assert.equal(r.draw(2010,x+3).frame,4);
  }
  const r=await rig(id);r.draw(0,100,100);
  let t=0,x=100,y=100;
  for(const [dx,dy,base] of [[1,0,4],[0,1,0],[-1,0,4],[0,-1,2]]){
   let out;for(let n=0;n<100;n++){t+=20;x+=dx*3;y+=dy*3;out=r.draw(t,x,y);}
   assert([base,base+1].includes(out.frame));
   assert.equal(out.scales.length,dx===1?1:0);
  }
  assert.equal(r.draw(t+20,900,900,true,'new-room').frame,0);
  assert.equal(r.draw(t+40,1300,1300).frame,0);
  const wall=await rig(id);wall.draw(0,0);for(let k=20;k<1000;k+=20)assert.equal(wall.draw(k,0,100,true).frame,0);
  const city=await rig(id);city.draw(0,0);city.draw(0,40);city.draw(100,60);city.draw(120,60,100,false,'qa',true);
  assert.equal(city.draw(160,63,100,true,'qa',true).frame,4+Math.floor(160/cadence)%2);
  assert.equal(city.draw(400,63,100,false,'qa',true).frame,4);
  assert.equal(city.draw(420,63,100,false).frame,4);
  
 }
 // Existing Quaxly and unrelated species still use their original code paths.
 const q=await rig(912);q.draw(0,0);q.draw(0,40);assert.equal(q.draw(160,60).frame,5);
 const p=await rig(25);p.draw(0,0);const a=p.draw(160,60);assert.equal(a.shadow[3],5);
 const approved=fs.readFileSync('tests/fixtures/follower-companions-v50.js.txt','utf8');const func=(s,name)=>{const start=s.indexOf('function '+name+'(');return s.slice(start,s.indexOf('\n}\n',start)+3)};assert.equal(func(source,'sample'),func(approved,'sample'),'trail unchanged');assert.equal(func(source,'quaxlyStep'),func(approved,'quaxlyStep'),'approved clock unchanged');assert(source.includes('if(pages.size>2)'),'retain two-page production cache');assert.equal(Object.keys(manifest).length,1025,'complete manifest preserved');console.log('PASS 24 Gen1–8 starters: 432 normal/Shiny FPS/speed scenarios; directions, idle, walls, scenes/teleports; approved Quaxly clock/trail and 1025-species manifest preserved.');
})().catch(e=>{console.error(e);process.exitCode=1});
