/* Run: node tests/trainer-walk-v7.cjs */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const walk=read('core/trainer-walk-v1.js'),city=read('core/halloween-ui.js'),kanto=read('core/kanto-world-v2.js'),html=read('index.html');
const pixels=new Uint8ClampedArray(384*384*4);for(let row=0;row<4;row++)for(let col=0;col<4;col++)for(let y=21;y<66;y++)for(let x=22;x<55;x++)pixels[((row*96+y)*384+col*96+x)*4+3]=255;
let scans=0,renderOps=0;
const D={createElement(){return{width:0,height:0,getContext(){return{drawImage(){renderOps++},getImageData(){scans++;return{data:pixels}},clearRect(){},beginPath(){},rect(){},clip(){},save(){},restore(){},set imageSmoothingEnabled(v){},set imageSmoothingQuality(v){}}}}}};
const W={};vm.runInNewContext(walk,{window:W,document:D});const anim=W.PsyTrainerWalkV1;
assert.equal(anim.columns.join(','),'1,2,3,2');
const img={naturalWidth:2048,naturalHeight:2048},atlas=anim.getAtlas(img);
assert.strictEqual(anim.getAtlas(img),atlas);assert.equal(scans,1);assert.equal(atlas.width,192);assert.equal(atlas.height,256);
assert(renderOps>70);
const calls=[];const c={drawImage(...a){calls.push(a)}};
for(let row=0;row<4;row++)for(let i=0;i<8;i++)anim.draw(c,atlas,row,anim.column(i,true),5,9,48,64);
assert.equal(calls.length,32);assert(calls.every(a=>a[5]===5&&a[6]===9&&a[7]===48&&a[8]===64));
assert.equal(anim.column(0,false),0);
const first=city.indexOf('  const cityWalk={phase:0'),last=city.indexOf('  function renderAvatar()',first);
assert(first>=0&&last>first);let now=1000;
const phase=new Function('W',city.slice(first,last)+'return cityWalkPhase')({performance:{now:()=>now}});
const seq=[phase(true,'basic')];for(let i=1;i<8;i++){now+=131;seq.push(phase(true,'basic'))}
assert.equal(seq.join(','),'0,1,2,3,0,1,2,3');assert.equal(phase(false,'basic'),0);
assert(city.includes('walk.draw(ctx,entry.walkAtlas')&&!city.includes('const bounce = moving && frame % 2'));
assert(kanto.includes('W.PsyTrainerWalkV1?.column')&&kanto.includes('W.PsyTrainerWalkV1.draw'));
assert(html.indexOf('src="core/trainer-walk-v1.js')<html.indexOf('src="core/halloween-ui.js'));
console.log('PASS V7: alternative strides, fixed feet, city/Kanto cycle, cached poses');
