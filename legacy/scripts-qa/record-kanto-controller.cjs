// Deterministic review capture: execute the production follower via VM canvas and log draws.
// Canvas coordinates are replayed onto the original WEBP atlas by the Python renderer.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const manifest=JSON.parse(fs.readFileSync('assets/followers/manifest-v47.json'));
const src=fs.readFileSync('core/follower-v47.js','utf8');
const P={meta:{followerV47:{enabled:true,key:'1-normal'}},team:[1,4,7].flatMap(id=>[false,true].map(shiny=>({id,hp:100,pokemon_uid:id+'-'+(shiny?'shiny':'normal'),shiny})))};
let now=0;
const W={P,performance:{now:()=>now},setInterval(){}};
class Image{complete=true;naturalWidth=4096;set src(v){this.url=v}get src(){return this.url}}
vm.runInNewContext(src,{window:W,document:{createElement(){return{setAttribute(){}}},body:{appendChild(){}}},Image,fetch:async()=>({json:async()=>manifest})});
const stages=[
 [750,40,55,'PARADOS'],[2100,150,55,'DIREITA','right'],[1550,150,127,'CURVA PARA BAIXO','down'],[800,150,127,'PARADA'],
 [2100,40,127,'RETOMADA PARA ESQUERDA','left'],[1550,40,55,'CURVA PARA CIMA','up'],[900,40,55,'PARADA'],
 [1400,150,55,'RETOMADA RAPIDA','right'],[960,150,127,'CURVA PARA BAIXO','down'],[650,150,127,'PARADA'],
 [1400,40,127,'RETOMADA RAPIDA','left'],[960,40,55,'CURVA PARA CIMA','up'],[1800,40,55,'PARADA FINAL']];
const duration=stages.reduce((s,a)=>s+a[0],0);
function route(t){let f=[40,55];for(const [ms,x,y,label,dir] of stages){if(t<=ms){const a=Math.max(0,t/ms);return{x:f[0]+(x-f[0])*a,y:f[1]+(y-f[1])*a,moving:f[0]!==x||f[1]!==y,label,dir}}t-=ms;f=[x,y]}return{x:40,y:55,moving:false,label:'FIM'}}
function mock(){const frames=[],stack=[],state={tx:0,ty:0,sx:1,sy:1};const c={
 save(){stack.push({...state})},restore(){Object.assign(state,stack.pop())},
 translate(x,y){state.tx+=x*state.sx;state.ty+=y*state.sy},
 scale(x,y){state.sx*=x;state.sy*=y},beginPath(){},ellipse(){},fill(){},
 drawImage(image,sx,sy,sw,sh,dx,dy,dw,dh){frames.push({path:image.src,src:[sx,sy,sw,sh],dst:[state.tx+dx*state.sx,state.ty+dy*state.sy,dw*state.sx,dh*state.sy]})}
 };return{c,frames}}
(async()=>{await new Promise(setImmediate);let facing='down';const output=[],poseSets={};for(let i=0;i<=Math.round(duration/50);i++){
 now=i*50;const r=route(now);if(r.dir)facing=r.dir;const members=[];
 for(const id of [1,4,7])for(const shiny of [false,true]){
  const key=id+'-'+(shiny?'shiny':'normal');P.meta.followerV47.key=key;const q=mock();
  W.PsyFollower.draw(q.c,{scene:'kanto-review:'+key,x:r.x,y:r.y,moving:r.moving,facing,valid:()=>true,trainer:()=>{}});
  if(q.frames.length!==1)throw Error('Missing follower draw '+key+' '+i);
  const d=q.frames[0],base=manifest[id].x,frame=(d.src[0]-base)/64;
  if(!Number.isInteger(frame)||frame<0||frame>5)throw Error('Bad frame '+key+' '+frame);
  (poseSets[key]??=new Set()).add(frame);
  members.push({id,shiny,frame,path:d.path,dst:d.dst});
 }
 output.push({t:now,label:r.label,facing,route:{x:r.x,y:r.y,moving:r.moving},members});
}
const poses=Object.fromEntries(Object.entries(poseSets).map(([k,v])=>[k,[...v].sort()]));
for(const [key,frames] of Object.entries(poses))if(frames.join()!=='0,1,2,3,4,5')throw Error(key+' missing directional poses '+frames);
const outputPath=path.resolve(process.argv[2]||'kanto-controller-frames.json');fs.mkdirSync(path.dirname(outputPath),{recursive:true});fs.writeFileSync(outputPath,JSON.stringify({durationMs:duration,frames:output,poses},null,0));
console.log(JSON.stringify({durationMs:duration,frames:output.length,poses},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
