/* Collision connectivity regression: run node tests/kanto-v4-paths.cjs */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const ctx={window:{}},root=path.join(__dirname,'..');
for(const file of ['core/kanto-map-data-v2.js','core/kanto-collision-v4.js'])
  vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const d=ctx.window.PsyKantoMapDataV2;
function check(m){
  const step=4,grid=(x,y)=>d.walkable(m,x*step,y*step,5),key=(x,y)=>x+','+y;
  const start=m.spawn.map(v=>Math.round(v/step)),queue=[start],seen=new Set([key(...start)]);
  assert(grid(...start),m.id+' start must be walkable');
  for(let i=0;i<queue.length;i++){
    const [x,y]=queue[i];
    for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){
      const nx=x+dx,ny=y+dy,k=key(nx,ny);
      if(!seen.has(k)&&grid(nx,ny)){seen.add(k);queue.push([nx,ny])}
    }
  }
  const near=(pos,r)=>queue.some(([x,y])=>Math.hypot(x*step-pos[0],y*step-pos[1])<r);
  assert(near(m.exit,30),m.id+' exit must be reachable');
  for(const item of [...m.doors,...m.npcs])
    assert(near(item.at,item.range||45),m.id+' inaccessible '+item.id);
  for(const field of m.grass)
    assert(near(field.entry,25),m.id+' inaccessible grass '+field.id);
  console.log(m.id+': '+queue.length+' reachable cells, '+m.doors.length+' doors, '+m.grass.length+' grass patches');
}
check(d.pallet);check(d.route1);
assert.equal(d.pallet.npcs.some(n=>n.id==='oak'),false,'Oak must not be duplicated outside the laboratory');
assert.equal(d.walkable(d.pallet,590,406),false,'Monument collision');
assert.equal(d.walkable(d.pallet,160,350),false,'Pokémon Center wall');
assert.equal(d.walkable(d.route1,560,360),false,'River collision');
