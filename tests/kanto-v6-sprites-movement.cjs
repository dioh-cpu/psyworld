/* Regression test: node tests/kanto-v6-sprites-movement.cjs */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const s=fs.readFileSync(path.join(__dirname,'../core/kanto-world-v2.js'),'utf8');
function part(a,b){const i=s.indexOf(a),j=s.indexOf(b,i+1);assert(i>=0&&j>i,'Missing '+a);return s.slice(i,j)}
const alpha=new Uint8ClampedArray(384*384*4);
for(let row=0;row<4;row++)for(let col=0;col<4;col++)for(let y=24;y<66;y++)for(let x=20;x<53;x++)alpha[((row*96+y)*384+col*96+x)*4+3]=255;
let scans=0,rasterDraws=0;
const D={createElement(){return{width:0,height:0,getContext(){return{clearRect(){},drawImage(){rasterDraws++},getImageData(){scans++;return{data:alpha}},set imageSmoothingEnabled(v){},set imageSmoothingQuality(v){}}}}}};
const prepare=new Function('D',part('function prepareAvatar(entry){','function drawPlayer(c,x,y){')+'return prepareAvatar')(D);
const entry={im:{naturalWidth:2048,naturalHeight:2048}};prepare(entry);
assert.equal(scans,1);assert.equal(rasterDraws,17);assert.deepEqual([entry.atlas.width,entry.atlas.height],[192,256]);
const state={facing:'down',held:new Set(['up']),path:[],joy:null,walkFrame:0},calls=[];
const canvas={save(){},restore(){},beginPath(){},ellipse(){},fill(){},fillRect(){},arc(){},drawImage(...args){calls.push(args)},fillText(){},set imageSmoothingEnabled(v){}};
const drawPlayer=new Function('state','selectedAvatar','player',part('function drawPlayer(c,x,y){','function drawInterior(c,inside){')+'return drawPlayer')(state,()=>({...entry,loaded:true}),()=>({name:'Teste'}));
for(const facing of ['up','down','left','right'])for(let i=0;i<6;i++){state.facing=facing;state.walkFrame=i;drawPlayer(canvas,100,180)}
assert.equal(calls.length,24);
assert(calls.every(a=>a[0]===entry.atlas&&a[7]===48&&a[8]===64&&a[5]===76&&a[6]===123),'Avatar changed size or ground position');
const moveAndTick=part('function move(dx,dy,dt){','function maybeEncounter(){')+part('function tick(now){','function onKeyDown(e){');
function walk(fps){const st={root:{classList:{contains:()=>true}},dialogOpen:false,suspended:false,world:{id:'pallet'},inside:null,position:{x:0,y:500},held:new Set(['up']),joy:null,path:[],stepDistance:0,walkFrame:0,lastRender:0,time:0};const tick=new Function('state','positionValid','DATA','performance','W','draw',moveAndTick+'return tick')(st,()=>true,{}, {now:()=>0},{innerWidth:390,requestAnimationFrame:()=>1},()=>{});for(let i=1;i<=fps*2;i++)tick(i*1000/fps);return 500-st.position.y}
assert(Math.abs(walk(60)-walk(15))<10,'15 fps movement was slowed');
assert(Math.abs(walk(60)-walk(10))<10,'10 fps movement was slowed');
assert(s.includes("root.addEventListener('contextmenu',e=>e.preventDefault())"),'Android long press is not intercepted');
console.log('Kanto V6: sprite atlas, 24 frames, 60/15 fps walking, Android touch safeguards passed');
