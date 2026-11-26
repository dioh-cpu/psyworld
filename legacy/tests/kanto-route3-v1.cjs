/* Focused Route 3 production geometry, connections, spots, and camera checks. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const world={};vm.runInNewContext(fs.readFileSync('core/kanto-early-chapters-v1.js','utf8'),{window:world});
const api=world.PsyKantoEarlyChaptersV1,map=api.get('route-3');
assert(api.ids.includes('route-3'));
assert.equal(map.art,'assets/story/kanto-route-3-v1.webp');
assert(fs.existsSync(map.art));
assert.deepEqual(Array.from(map.encounterLevels),[7,11]);
assert.deepEqual({...map.spawn},{x:3,y:13});
assert.equal(map.returnTo.world,'pewter');assert.deepEqual({...map.returnTo.spawn},{x:29,y:11});
assert.equal(map.next.world,'mt-moon');assert.deepEqual({...map.next.spawn},{x:16,y:2});
assert.equal(map.npcName,'Escoteiro Davi');assert.equal(map.npcIdle,'basic-adventure-boy.webp');
assert(fs.existsSync('assets/characters/halloween/'+map.npcIdle));
function reaches(target){
 const seen=new Set(),queue=[[map.spawn.x,map.spawn.y]],key=(x,y)=>`${x},${y}`;seen.add(key(...queue[0]));
 for(let i=0;i<queue.length;i++){const[x,y]=queue[i];if(x===target.x&&y===target.y)return true;for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(!seen.has(k)&&api.walkable('route-3',nx,ny)){seen.add(k);queue.push([nx,ny]);}}}return false;
}
for(const [name,p]of Object.entries({spawn:map.spawn,npc:map.npc,object:map.object,exit:map.exit,returnGate:map.returnGate}))assert(reaches(p),`${name} disconnected from Route 3 entrance`);
const hobbies=fs.readFileSync('core/hobbies-v2.js','utf8');
const line=hobbies.match(/'route-3':\[([^\n]+)\]/)?.[1];assert(line,'seven curated Route 3 gathering nodes are registered');
const nodes=[...line.matchAll(/\['([^']+)','([^']+)',(\d+),(\d+),'([^']+)'\]/g)].map(m=>({id:m[1],x:Number(m[3]),y:Number(m[4])}));
assert.equal(nodes.length,7);
for(const n of nodes){const p={x:Math.floor(n.x/28),y:Math.floor(n.y/28)};assert(api.walkable('route-3',p.x,p.y),`${n.id} spot must be walkable`);assert(reaches(p),`${n.id} spot must connect to the path`);}
const pewter=fs.readFileSync('core/kanto-pewter-v4.js','utf8'),playable=fs.readFileSync('core/kanto-campaign-playable-v1.js','utf8');
assert(pewter.includes("next:{world:'route-3',spawn:{x:3,y:13}}"),'Pewter exit must line up with Route 3 west entrance');
assert(playable.includes("'route-3','mt-moon','route-4','cerulean'].includes(model.place?.id)"),'Coastal maps use the shared Route 1 camera reference');
assert(playable.includes("'route-3','mt-moon','route-4','cerulean'].includes(model.place.id)"),'Coastal maps use the shared ambient and render path');
assert(playable.includes("!['route-2','viridian-forest','pewter','route-3','mt-moon','route-4','cerulean'].includes(model.place?.id)"),'Coastal ambient animation runs on the existing frame loop');
assert(playable.includes("'route-3':'basic-adventure-boy.webp'"),'Davi uses the existing four-direction trainer idle atlas');
assert(playable.includes('model.map.next')&&playable.includes('map.returnTo'),'both real passage connections are consumed by production');
const html=fs.readFileSync('index.html','utf8');assert(html.includes('KANTO_ROUTE3_AUTHORED_V1_20261109'));assert(html.includes('KANTO_MT_MOON_EXPLORE_V1_20261109'));
new Function(fs.readFileSync('core/kanto-early-chapters-v1.js','utf8'));
new Function(playable);
console.log('PASS: Route 3 authored map, route continuity, all seven reachable hobby spots, trainer idle, level range, and production camera wiring');
