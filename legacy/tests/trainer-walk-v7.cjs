/* Run: node tests/trainer-walk-v7.cjs */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const walk=read('core/trainer-walk-v1.js'),city=read('core/halloween-ui.js'),cityWorld=read('core/city-halloween.js'),kanto=read('core/kanto-world-v2.js'),html=read('index.html');
const pixels=new Uint8ClampedArray(384*384*4);for(let row=0;row<4;row++)for(let col=0;col<4;col++)for(let y=21;y<66;y++)for(let x=22;x<55;x++)pixels[((row*96+y)*384+col*96+x)*4+3]=255;
let scans=0,renderOps=0;
const D={createElement(){return{width:0,height:0,getContext(){return{drawImage(){renderOps++},getImageData(){scans++;return{data:pixels}},clearRect(){},beginPath(){},rect(){},clip(){},save(){},restore(){},set imageSmoothingEnabled(v){},set imageSmoothingQuality(v){}}}}}};
const W={};vm.runInNewContext(walk,{window:W,document:D});const anim=W.PsyTrainerWalkV1;
assert.equal(anim.columns.join(','),'1,0,3,0');
const img={naturalWidth:2048,naturalHeight:2048},atlas=anim.getAtlas(img);
assert.strictEqual(anim.getAtlas(img),atlas);assert.equal(scans,1);assert.equal(atlas.width,192);assert.equal(atlas.height,256);
assert.equal(renderOps,33,'16 original frames, each drawn intact without pixel strip warping');
assert(!walk.includes('for(let y=40;y<TH;y+=2)'),'Previous fake leg slicing must not return');
const calls=[];const c={drawImage(...a){calls.push(a)}};
for(let row=0;row<4;row++)for(let i=0;i<8;i++)anim.draw(c,atlas,row,anim.column(i,true),5,9,48,64);
assert.equal(calls.length,32);assert(calls.every(a=>a[5]===5&&a[6]===9&&a[7]===48&&a[8]===64));
assert.equal(anim.column(0,false),0);
// The active human renderer now shares a monotonic WALK/IDLE state sampler.
assert.equal(typeof anim.createState,'function');assert.equal(typeof anim.sampleState,'function');
const state=anim.createState();let pose=anim.sampleState(state,{now:0,moving:true,row:2,identity:'test'});
assert.equal(pose.state,'walk');assert.equal(pose.col,0);
pose=anim.sampleState(state,{now:130,moving:true,row:3,identity:'test'});assert.equal(pose.col,1);assert.equal(pose.row,3);
pose=anim.sampleState(state,{now:140,moving:false,identity:'test'});assert.equal(pose.state,'settle');assert.equal(pose.row,3);
pose=anim.sampleState(state,{now:280,moving:false,identity:'test'});assert.equal(pose.state,'idle');
assert(city.includes('walk.renderAnimated(ctx,entry.animationAtlas')&&!city.includes('const bounce = moving && frame % 2'));
assert(kanto.includes('walk.renderAnimated(c,entry.animationAtlas')&&kanto.includes('w=48*scale,h=64*scale,left=x-w/2,top=y+5-60*scale'));
assert(kanto.includes('drawTrainer:(ctx,x,y,options)=>drawPlayer(ctx,x,y,options)')&&cityWorld.includes('showName:false')&&cityWorld.includes('trainer}'));
assert(html.indexOf('src="core/trainer-walk-v1.js')<html.indexOf('src="core/halloween-ui.js'));

// Regression for the broken V7 avatar gate (entry.frames no longer exists).
const startSel=kanto.indexOf('function selectedAvatar(){'),endSel=kanto.indexOf('function prepareAvatar(entry){',startSel);
assert(startSel>=0&&endSel>startSel);
let p={};
const requested=[];
const select=new Function('player','W','image',
  kanto.slice(startSel,endSel)+'return selectedAvatar')(
  ()=>p,{PsyHalloweenCharacters:[
    {id:'gothic_boy',costumes:{basic:'basic-gothic-boy.webp',divine:'divine-gothic-boy.webp'}},
    {id:'adventure_boy',costumes:{basic:'basic-adventure-boy.webp'}}
  ]},url=>{requested.push(url);return {loaded:true,atlas:{},url}});
assert(select().url.endsWith('/basic-adventure-boy.webp'),'Uninitialized profile must show a real trainer');
p={playerCharacterId:'gothic_boy',playerCostumeByCharacter:{gothic_boy:'divine'}};
assert(select().url.endsWith('/divine-gothic-boy.webp'),'Chosen costume must be respected');
assert(kanto.includes('if(entry?.loaded){')&&kanto.includes('if(entry.animationAtlas&&walk?.renderAnimated)'), 'Loaded trainer and sprite atlas must render without entry.frames');
assert(!kanto.includes('if(entry?.loaded&&entry.frames){'),'Broken V7 gate must not return');
assert(!kanto.includes("c.fillStyle='#24517a'"),'Blocky placeholder must not be drawn');

console.log('PASS V8: original 4-step poses intact, fixed feet, city/Kanto cycle, cached poses');
