const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const W={};
for(const f of ['kanto-interiors-v9','kanto-pewter-v4','kanto-continuous-motion-v1','kanto-coastal-v6'])vm.runInNewContext(fs.readFileSync('core/'+f+'.js','utf8'),{window:W});
const motion=W.PsyKantoContinuousMotionV1;
function connected(map,goal,adjacent=false){
 const q=[map.spawn],seen=new Set([`${map.spawn.x},${map.spawn.y}`]);
 for(let i=0;i<q.length;i++){const p=q[i];if(adjacent?Math.abs(p.x-goal.x)+Math.abs(p.y-goal.y)<=1:p.x===goal.x&&p.y===goal.y)return true;
  for(const[dx,dy]of [[0,1],[0,-1],[1,0],[-1,0]]){const n={x:p.x+dx,y:p.y+dy},key=`${n.x},${n.y}`;if(seen.has(key)||!motion.valid(map.grid,(n.x+.5)*28,(n.y+.5)*28))continue;seen.add(key);q.push(n);}}
 return false;
}
const route=W.PsyKantoCoastalV6.route4(),city=W.PsyKantoCoastalV6.cerulean(),gym=W.PsyKantoCoastalV6.room('gym');
for(const map of [route,city,gym]){
 assert.equal(map.grid.length,20);assert(map.grid.every(row=>row.length===32));assert(fs.existsSync(map.art));
}
assert(connected(route,route.exit),'Route 4 trail cannot reach Cerulean gate');
assert.deepEqual({x:route.exit.x,y:route.exit.y},{x:30,y:7},'Route 4 exit must sit on the painted eastbound road, not below it');
assert.equal(route.grid[10][23],9,'Route 4 stream must remain blocked');
for(let x=20;x<=30;x++)assert.notEqual(route.grid[7][x],9,`East road cell ${x},7 must connect continuously to the city gate`);
assert(connected(route,route.npc,true),'Joana is unreachable');
for(const actor of route.actors)assert(connected(route,actor,true),'Route 4 resident unreachable: '+actor.id);
const hobbySource=fs.readFileSync('core/hobbies-v2.js','utf8'),spotRow=hobbySource.match(/'route-4':\[([^\n]+)\]/)?.[1];assert(spotRow,'Route 4 gathering nodes remain registered');const spots=[...spotRow.matchAll(/\['([^']+)','([^']+)',(\d+),(\d+),'([^']+)'\]/g)].map(m=>({id:m[1],x:Math.floor(Number(m[3])/28),y:Math.floor(Number(m[4])/28)}));assert.equal(spots.length,7);for(const spot of spots)assert(connected(route,spot),'Route 4 hobby spot inaccessible '+spot.id);
assert.equal(route.returnTo.world,'mt-moon');assert.equal(route.next.world,'cerulean');
for(const d of city.doors){assert(connected(city,d,true),'Cerulean door unreachable: '+d.id);const room=W.PsyKantoCoastalV6.room(d.id);assert(room,'Missing interior '+d.id);assert(fs.existsSync(room.art),'Missing interior art '+room.art);assert(connected(room,room.exit),'Room exit unreachable '+d.id);if(d.id==='gym')assert(connected(room,room.npc,true),'Misty unreachable in arena');}
assert(connected(city,city.npc,true),'Misty unreachable in city');for(const a of city.actors)assert(connected(city,a,true),'Cerulean resident unreachable '+a.id);
const gymDoor=city.doors.find(d=>d.id==='gym');assert.deepEqual({x:gymDoor.x,y:gymDoor.y},{x:16,y:4},'Misty gym entrance must meet the visible front steps of the central building');
assert.equal(city.grid[11][14],9,'Cerulean canal west of the promenade must remain blocked');
assert.equal(city.grid[11][20],9,'Cerulean canal east of the promenade must remain blocked');
assert.equal(city.doors.some(d=>d.id==='house-east'),false,'Do not expose a building door on the bridge');
assert.equal(city.next,null,'V6 must not open Route 24/25 yet');
const html=fs.readFileSync('index.html','utf8');assert(html.includes('kanto-campaign-playable-v1.js?build=KANTO_ROUTE4_CERULEAN_MISTY_V6_20261109'));assert(html.includes('hobbies-v2.js?build=KANTO_ROUTE4_CERULEAN_MISTY_V6_20261109'));
assert.equal(gym.roomId,'gym');assert.equal(gym.art,'assets/kanto/approved/misty-arena-approved.webp');
assert(fs.existsSync('assets/kanto/npcs/misty-v6.png'));
console.log('PASS: Route 4, Cerulean and Misty arena masks are 32×20, connected by V4-valid cells; seven hobby spots, city doors/interiors, NPC approaches and return routes are reachable; no Route 24/25 transition.');
