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
 for(const shiny of [false,true])for(const fps of [30,60,120])for(const speed of [30,143,240]){
  const r=await rig(912,shiny);r.draw(0,0);r.draw(0,40);
  for(let n=1;n<=fps;n++){
   const t=n*1000/fps,out=r.draw(t,40+speed*t/1000);
   assert.equal(out.frame,4+Math.floor((t+1e-7)/140)%2,`cadence ${fps}fps ${speed}px/s @${t}`);
   assert.equal(out.image,`assets/followers/pages/${shiny?'shiny':'normal'}-14.webp`);
   assert.equal(out.shadow[2],8);assert.equal(out.shadow[3],3);
   assert.equal(out.box[1],-63*1.6);assert.equal(out.box[3],64*1.6);
  }
  const x=40+speed,stop=r.draw(1010,x,100,false);
  assert.equal(stop.frame,4);
  for(const t of [1030,1200,2000])assert.deepEqual(r.draw(t,x,100,false).pos,stop.pos,'no idle sliding');
  assert.equal(r.draw(2010,x+3).frame,4,'restart on authored rest pose');
 }
 // Preserve step phase at a turn, and tolerate duplicate paints of one instant.
 const corner=await rig();corner.draw(0,0);corner.draw(0,40);
 corner.draw(100,60);assert.equal(corner.draw(160,80).frame,5);
 assert.equal(corner.draw(180,80,140).frame,1,'turn keeps phase');
 assert.equal(corner.draw(180,80,140).frame,1,'duplicate paint keeps phase');
 assert.equal(corner.draw(400,80,140,true).frame,0,'stationary position cannot keep animating');
 // City inter-tile frames must not reset an uninterrupted walking cycle.
 const city=await rig();city.draw(0,0);city.draw(0,40);
 city.draw(100,60);city.draw(120,60,100,false,'qa',true);
 assert.equal(city.draw(160,63,100,true,'qa',true).frame,5);
 assert.equal(city.draw(400,63,100,false,'qa',true).frame,4,'held input at a wall expires');
 assert.equal(city.draw(420,63,100,false).frame,4,'key release rests');
 // Campaign tiles advance every 160 ms while the held input remains active.
 const chapter=await rig();chapter.draw(0,0);chapter.draw(0,40);
 for(let t=20;t<=480;t+=20){const x=40+Math.floor(t/160)*28;assert.equal(chapter.draw(t,x).frame,4+Math.floor(t/140)%2);}
 assert.equal(chapter.draw(500,124,100,false).frame,4,'release stops campaign animation');
 // Drive the complete controller through all four directions and multiple corners.
 const r=await rig();r.draw(0,100,100);let t=0,x=100,y=100;
 for(const [dx,dy,base] of [[1,0,4],[0,1,0],[-1,0,4],[0,-1,2]]){
  let out;for(let n=0;n<100;n++){t+=20;x+=dx*3;y+=dy*3;out=r.draw(t,x,y);}
  assert([base,base+1].includes(out.frame));
  assert.equal(out.scales.length,dx===1?1:0,'mirror only right');
 }
 assert.equal(r.draw(t+20,900,900,true,'new-room').frame,0,'scene resets');
 assert.equal(r.draw(t+40,1300,1300).frame,0,'teleport resets');
 // A blocked trainer never starts a stationary follower's animation.
 const wall=await rig();wall.draw(0,0);for(let t=20;t<1000;t+=20)assert.equal(wall.draw(t,0,100,true).frame,0);
 // Background scenes have independent clocks; a long rendering suspension resets.
 const bg=await rig();bg.draw(0,0);bg.draw(0,40);assert.equal(bg.draw(160,45).frame,5);
 bg.draw(170,50,100,true,'city');assert.equal(bg.draw(180,50).frame,5);
 assert.equal(bg.draw(900,55).frame,4);
 // Pikachu now intentionally uses its supplied catalog gait; Quaxly above stays protected.
 const other=await rig(25);other.draw(0,0);other.draw(0,40);const out=other.draw(160,60);assert.equal(out.frame,4+Math.floor(160/128)%2);assert.equal(out.box[1],-63*1.6);assert.equal(out.shadow[2],8);assert.equal(out.shadow[3],3);
 console.log('PASS Quaxly: normal/Shiny, 30/60/120 FPS × 30/143/240 px/s, four directions, corners, idle/restart, scene/teleport/pause, blocked movement and Pikachu catalog gait.');
})().catch(e=>{console.error(e);process.exitCode=1});
