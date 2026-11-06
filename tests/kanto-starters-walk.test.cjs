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
 const species=[[1,'Bulbasaur',165,63,9],[4,'Charmander',125,62,8],[7,'Squirtle',145,62,8]];
 for(const [id,name,cadence,sole,shadow] of species){
  for(const shiny of [false,true])for(const fps of [30,60,120])for(const speed of [30,143,240]){
   const r=await rig(id,shiny);r.draw(0,0);r.draw(0,40);
   for(let n=1;n<=fps;n++){
    const t=n*1000/fps,out=r.draw(t,40+speed*t/1000);
    assert.equal(out.frame,4+Math.floor((t+1e-7)/cadence)%2,`${name} ${fps} fps ${speed}px/s ${t}`);
    assert.equal(out.image,`assets/followers/pages/${shiny?'shiny':'normal'}-0.webp`);
    assert.equal(out.shadow[2],shadow);assert.equal(out.shadow[3],3);
    assert.equal(out.box[1],-sole*1.6);
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
  console.log(`PASS ${name}: normal/Shiny, 30/60/120 FPS, 3 speeds, four directions, idle, walls, teleport`);
 }
 // Existing Quaxly and unrelated species still use their original code paths.
 const q=await rig(912);q.draw(0,0);q.draw(0,40);assert.equal(q.draw(160,60).frame,5);
 const p=await rig(25);p.draw(0,0);const a=p.draw(160,60);assert.equal(a.shadow[3],3);
 console.log('PASS Quaxly parity and Pikachu legacy path');
})().catch(e=>{console.error(e);process.exitCode=1});
