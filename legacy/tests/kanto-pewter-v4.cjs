const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),W={};
for(const f of ['kanto-interiors-v9','kanto-interiors-art-v30','kanto-pewter-v4','kanto-continuous-motion-v1'])vm.runInNewContext(fs.readFileSync('core/'+f+'.js','utf8'),{window:W});
const motion=W.PsyKantoContinuousMotionV1,R=11,T=28;
function valid(map,x,y){return motion.valid(map.grid,(x+.5)*T,(y+.5)*T,R)}
function connected(map,target){
 const seen=new Set(),q=[map.spawn],key=p=>p.x+','+p.y;seen.add(key(map.spawn));
 for(let i=0;i<q.length;i++){const p=q[i];if(p.x===target.x&&p.y===target.y)return true;
  for(const [dx,dy]of [[0,1],[0,-1],[1,0],[-1,0]]){const n={x:p.x+dx,y:p.y+dy},k=key(n);if(!seen.has(k)&&valid(map,n.x,n.y)){seen.add(k);q.push(n)}}
 }return false;
}
const city=W.PsyKantoPewterV4.get();
assert.equal(city.footRadius,R,'Pewter must use the approved 11px physical footprint');
for(const point of [city.exit,city.returnGate,city.npc,...city.doors])assert(connected(city,point),'unreachable city landmark '+JSON.stringify(point));
// The full painted avenue and lower sidewalks must be navigable, while the
// buildings, garden island, tree line and map edge remain solid.
for(const [x,y]of [[3,11],[10,10],[20,12],[29,11],[10,16],[20,16],[15,18]])assert(valid(city,x,y),'visible paved street blocked at '+x+','+y);
for(const [x,y]of [[0,10],[8,2],[22,2],[6,8],[25,8],[7,13],[24,13],[12,14],[1,8]])assert(!valid(city,x,y),'solid building/landscaping unexpectedly walkable at '+x+','+y);
for(const door of city.doors){
 assert(valid(city,door.x,door.y),'door approach is not on walkable ground '+door.id);
 const room=W.PsyKantoPewterV4.room(door.id);assert(room);assert.equal(room.footRadius,R,door.id+' interior must use 11px footprint');
 for(const point of [room.spawn,room.exit])assert(connected(room,point),'unreachable room entry/exit '+door.id+' '+JSON.stringify(point));
 assert([-1,1].some(dx=>connected(room,{x:room.npc.x+dx,y:room.npc.y}))||[-1,1].some(dy=>connected(room,{x:room.npc.x,y:room.npc.y+dy})),door.id+' NPC has no reachable interaction tile');
 assert(fs.existsSync(room.art),room.art)
}
assert.equal(city.returnTo.world,'viridian-forest');assert.equal(city.next.world,'route-3');assert(fs.existsSync(city.art));
console.log('PASS: Pewter 11px collision, broad streets, solid buildings/gardens, accessible doors/interiors/NPCs, south/east gates');
