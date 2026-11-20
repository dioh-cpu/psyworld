const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const window={};vm.runInNewContext(fs.readFileSync('core/kanto-mt-moon-v1.js','utf8'),{window});
const map=window.PsyKantoMtMoonV1.get(),rows=map.grid.length,cols=map.grid[0].length;
assert.equal(rows,32);assert.equal(cols,32);assert(fs.existsSync(map.art));
const q=[[map.spawn.x,map.spawn.y]],seen=new Set([q[0].join(',')]);
for(let i=0;i<q.length;i++){const[x,y]=q[i];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=`${nx},${ny}`;if(nx>0&&ny>0&&nx<cols-1&&ny<rows-1&&[1,5].includes(map.grid[ny][nx])&&!seen.has(k)){seen.add(k);q.push([nx,ny]);}}}
const reachable=(pt)=>seen.has(`${pt.x},${pt.y}`)||[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>seen.has(`${pt.x+dx},${pt.y+dy}`));
for(const pt of [map.npc,map.object,map.exit,...map.actors,...map.stairs,...map.hobbySpots])assert(reachable(pt),`unreachable cave landmark/spot: ${JSON.stringify(pt)}`);
for(const[y,row]of map.grid.entries())for(const[x,tile]of row.entries())assert([1,3,9,5].includes(tile),`unknown tile ${x},${y}`);
assert.equal(map.returnTo.world,'route-3');assert.equal(map.next.world,'route-4');assert.equal(map.encounterLevels[0],10);
for(const pt of map.actors)assert.equal(map.grid[pt.y][pt.x],1);
const hobbySource=fs.readFileSync('core/hobbies-v2.js','utf8'),spotRow=hobbySource.match(/'mt-moon':\[([^\n]+)\]/)?.[1];assert(spotRow,'existing Mt. Moon hobby spots remain registered');
const spots=[...spotRow.matchAll(/\['([^']+)','([^']+)',(\d+),(\d+),'([^']+)'\]/g)].map(m=>({id:m[1],x:Number(m[3]),y:Number(m[4])}));assert.equal(spots.length,11);
for(const spot of spots){const x=Math.floor(spot.x/28),y=Math.floor(spot.y/28);assert(reachable({x,y}),`hobby spot ${spot.id} must align to an accessible cave tile`);}
console.log('PASS: Mount Moon 32×32 collision mask, entry/exit links, connected caves, NPCs, Rocket guards and landmarks');
