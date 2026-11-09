/* Lot B: collision mask follows the painted routes; same footprint for manual and auto motion. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const W={};vm.runInNewContext(fs.readFileSync('core/kanto-early-chapters-v1.js','utf8'),{window:W});
vm.runInNewContext(fs.readFileSync('core/kanto-continuous-motion-v1.js','utf8'),{window:W});
const maps=W.PsyKantoEarlyChaptersV1,motion=W.PsyKantoContinuousMotionV1,T=28,R=11;
const offsets=[[1,0],[-1,0],[0,1],[0,-1]];
function center(x,y){return {x:(x+.5)*T,y:(y+.5)*T}}
function open(m,x,y){return maps.walkable(m.id,x,y)&&motion.valid(m.grid,...Object.values(center(x,y)),R)}
function path(m,target){
 const start=m.spawn,k=(p)=>p.x+','+p.y,q=[start],prev=new Map([[k(start),null]]);
 for(let i=0;i<q.length;i++){
  const p=q[i];if(p.x===target.x&&p.y===target.y)break;
  for(const [dx,dy] of offsets){const n={x:p.x+dx,y:p.y+dy},key=k(n);if(!prev.has(key)&&open(m,n.x,n.y)){prev.set(key,k(p));q.push(n)}}
 }
 if(!prev.has(k(target)))return [];
 const out=[];let cur=k(target);while(cur){const [x,y]=cur.split(',').map(Number);out.push({x,y});cur=prev.get(cur)}return out.reverse();
}
function validateMotion(m,target){
 const route=path(m,target);assert(route.length>0,m.id+' inaccessible target '+JSON.stringify(target));
 let p=center(route[0].x,route[0].y);
 for(const cell of route.slice(1)){
  const goal=center(cell.x,cell.y);let guard=0;
  while(Math.hypot(goal.x-p.x,goal.y-p.y)>.2&&guard++<20){
   const dx=goal.x-p.x,dy=goal.y-p.y,d=Math.hypot(dx,dy);
   motion.advance(m.grid,p,{x:dx/d,y:dy/d},.12,143,d,[],R);
  }
  assert(Math.hypot(goal.x-p.x,goal.y-p.y)<.3,m.id+' continuous traversal stopped between '+JSON.stringify(route[0])+' and '+JSON.stringify(cell));
 }
}
for(const id of ['route-2','viridian-forest']){
 const m=maps.get(id);assert.equal(m.footRadius,R,id+' must preserve the approved 11px feet radius');
 assert.equal(m.grid.length,20);assert(m.grid.every(r=>r.length===32));
 for(const p of [m.spawn,m.returnGate,m.npc,m.object,m.exit])validateMotion(m,p);
 assert(fs.existsSync(m.art),m.art);
}
const r2=maps.get('route-2'),forest=maps.get('viridian-forest');
for(const p of [[350,378],[350,238],[686,182],[350,294],[798,378],[266,434],[798,294]])
 validateMotion(r2,{x:Math.floor(p[0]/T),y:Math.floor(p[1]/T)});
for(const p of [[434,210],[462,154],[518,182],[546,406],[406,322],[462,462],[378,294]])
 validateMotion(forest,{x:Math.floor(p[0]/T),y:Math.floor(p[1]/T)});
for(const p of forest.lanterns)validateMotion(forest,{x:Math.floor(p[0]/T),y:Math.floor(p[1]/T)});
assert(open(forest,15,12),'the visible wooden bridge remains walkable');
for(let y=0;y<20;y++)for(let x=0;x<32;x++)if(forest.grid[y][x]===3)assert(!maps.walkable(forest.id,x,y),'stream cells must block movement');
for(const [m,cells] of [[r2,[[2,2],[8,5],[12,12],[20,12],[0,0]]],[forest,[[8,5],[10,5],[2,9],[20,11],[28,15]]]]){
 for(const [x,y] of cells)assert(!open(m,x,y),m.id+' solid terrain unexpectedly walkable at '+x+','+y);
}
assert(r2.grid[5][13]===1&&r2.grid[15][13]===1,'Route 2 north/south trail is connected on its visible vertical road');
assert(forest.grid[12][15]===1,'Forest crossing uses the visible bridge tile');
const playable=fs.readFileSync('core/kanto-campaign-playable-v1.js','utf8');
assert(playable.includes('model.map.footRadius||motion.radius'),'the same physical footprint must drive manual and Auto Route movement');
assert(playable.includes('PsyKantoBackpackQuestV1?.finish?.(placeState(\'route-2\'),backpack,validCarrier&&won===true)'),'backpack recovery must remain tied to victory against the identified carrier');
console.log('PASS: Route 2 and Viridian Forest paths, 11px footprint, blocked water/obstacles, Hobby sites, landmarks and continuous motion');
