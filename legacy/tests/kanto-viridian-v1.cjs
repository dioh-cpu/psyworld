/* Run: node tests/kanto-viridian-v1.cjs */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),ctx={window:{}};
for(const file of ['core/kanto-map-data-v2.js','core/kanto-collision-v4.js','core/kanto-viridian-v1.js'])
 vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const d=ctx.window.PsyKantoMapDataV2,m=d.viridian;
assert(m);assert.equal(m.w,m.h,'Must preserve square artwork proportions');
assert.equal(m.grass.length,0,'No encounters allowed in Viridian City');
assert(!d.walkable(m,450,418,11),'Fountain must be solid');
const step=12,start=m.spawn.map(n=>Math.round(n/step)),key=(x,y)=>x+','+y;
const queue=[start],seen=new Set([key(...start)]);
assert(d.walkable(m,...m.spawn,11),'Spawn must be walkable');
for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){const xx=x+dx,yy=y+dy,k=key(xx,yy);if(xx<1||yy<1||xx>=75||yy>=75||seen.has(k)||!d.walkable(m,xx*step,yy*step,11))continue;seen.add(k);queue.push([xx,yy]);}}
const near=(pt,r)=>queue.some(([x,y])=>Math.hypot(x*step-pt[0],y*step-pt[1])<r);
assert(near(m.return,35),'Route 1 exit unreachable');assert(near(m.exit,35),'Route 2 exit unreachable');
for(const door of m.doors)assert(near(door.at,60),'Door unreachable: '+door.id);
for(const npc of m.npcs)assert(near(npc.at,65),'NPC unreachable: '+npc.id);
const npcSafe=(x,y)=>d.walkable(m,x,y,11)&&!m.npcs.some(n=>Math.hypot(x-n.at[0],y-n.at[1])<23);
const safeStart=m.spawn.map(n=>Math.round(n/8)),safeQueue=[safeStart],safeSeen=new Set([key(...safeStart)]);
for(let i=0;i<safeQueue.length;i++){const[x,y]=safeQueue[i];for(const[dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){const xx=x+dx,yy=y+dy,k=key(xx,yy);if(xx<1||yy<1||xx>=112||yy>=112||safeSeen.has(k)||!npcSafe(xx*8,yy*8))continue;safeSeen.add(k);safeQueue.push([xx,yy]);}}
const safeNear=(pt,r)=>safeQueue.some(([x,y])=>Math.hypot(x*8-pt[0],y*8-pt[1])<r);
assert(safeNear(m.exit,35),'Route 2 passage must remain reachable with player and NPC collision radii');
assert.equal(m.npcs.find(n=>n.id==='viridian-elder').portrait,'assets/kanto/npcs/viridian-elder-v1.png');
assert.equal(m.npcs.find(n=>n.id==='viridian-teacher').portrait,'assets/kanto/npcs/viridian-instructor-v1.png');
for(const npc of m.npcs){const bytes=fs.readFileSync(path.join(root,npc.portrait));assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a','Viridian NPC art must be a real PNG: '+npc.id);assert.equal(bytes.readUInt32BE(16),96,'NPC art width must stay normalized');assert.equal(bytes.readUInt32BE(20),144,'NPC art height must stay normalized');}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
let previous=-1;
for(const f of ['core/kanto-collision-v4.js','core/kanto-viridian-v1.js','core/kanto-world-v2.js','core/kanto-campaign-playable-v1.js']){const at=html.indexOf('src="'+f+'?');assert(at>previous,'Loader order mismatch: '+f);previous=at;}
const world=fs.readFileSync(path.join(root,'core/kanto-world-v2.js'),'utf8');
const playable=fs.readFileSync(path.join(root,'core/kanto-campaign-playable-v1.js'),'utf8');
assert(world.includes("state.world?.id==='viridian'?Math.min(4,cover*"));
assert(world.includes("if(state.world.id==='viridian'){"));
assert(playable.includes("id==='route-1'||id==='viridian'"));
console.log('PASS: Viridian world, collision-safe Route 2 corridor, normalized pixel NPC art, no city encounters, '+queue.length+' reachable cells');
