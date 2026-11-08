/* V6 movement performance regression; visual frame testing moved to V7. */
'use strict';
require('./trainer-walk-v7.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../core/kanto-world-v2.js'),'utf8');
const part=(start,end)=>{const a=source.indexOf(start),b=source.indexOf(end,a+1);assert(a>=0&&b>a,'missing movement function '+start);return source.slice(a,b)};
const body='let autoHunt=false,huntPlanning=false,huntPlanAt=0;'+part('function move(dx,dy,dt,maxDistance=Infinity){','function maybeEncounter(config){')+part('function tick(now){','function onKeyDown(e){');
function distance(fps){
 const state={root:{classList:{contains:()=>true},dataset:{},querySelector:()=>null},dialogOpen:false,suspended:false,
   world:{id:'pallet'},inside:null,position:{x:0,y:500},held:new Set(['up']),
   joy:null,path:[],stepDistance:0,walkFrame:0,lastRender:0,time:0};
 const tick=new Function('state','positionValid','DATA','performance','W','draw','updateFishingButton',body+'return tick')(
   state,()=>true,{}, {now:()=>0},{innerWidth:390,requestAnimationFrame:()=>1},()=>{},()=>{});
 for(let i=1;i<=fps*2;i++)tick(i*1000/fps);
 return 500-state.position.y;
}
const sixty=distance(60);
for(const fps of [30,15,10])assert(Math.abs(sixty-distance(fps))<10,'walk speed mismatch at '+fps+' FPS');
console.log('PASS: Kanto movement speed preserved at 60/30/15/10 FPS');
