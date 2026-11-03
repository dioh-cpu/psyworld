/* Run: node tests/kanto-interiors-v9.cjs */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.join(__dirname,'..');
const code=fs.readFileSync(path.join(base,'core/kanto-interiors-v9.js'),'utf8');
const game=fs.readFileSync(path.join(base,'core/kanto-world-v2.js'),'utf8');
const W={PsyKantoMapDataV2:{pallet:{npcs:[{id:'gate'},{id:'lia'},{id:'neighbor'}]}}};
vm.runInNewContext(code,{window:W});
const rooms=W.PsyKantoInteriorsV9.rooms,ids=['center','market','lab','home','house-east','house-west'];
assert.deepEqual(Object.keys(rooms).sort(),ids.sort());
const valid=(r,x,y)=>x>60&&x<740&&y>164&&y<445&&!r.blocks.some(([a,b,c,d])=>x>=a-6&&x<=c+6&&y>=b-6&&y<=d+6);
function visit(r){
 const step=8,from=r.spawn.map(p=>Math.round(p/step)),q=[from],seen=new Set([from.join(',')]);
 assert(valid(r,...r.spawn),'Bad spawn '+r.id);
 for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!seen.has(k)&&valid(r,nx*step,ny*step)){seen.add(k);q.push([nx,ny])}}}
 const near=(p,d)=>q.some(([x,y])=>Math.hypot(x*step-p[0],y*step-p[1])<d);
 assert(near(r.exit,35),'Room exit blocked '+r.id);
 for(const n of r.npcs)assert(near(n.at,68),n.name+' inaccessible in '+r.id);
 return q.length;
}
for(const id of ids){
 const r=rooms[id];assert(r.art.endsWith(id+'-v9.svg'),'wrong art '+id);
 assert(fs.existsSync(path.join(base,r.art)),'missing art '+r.art);
 const svg=fs.readFileSync(path.join(base,r.art),'utf8');
 assert(svg.startsWith('<svg')&&svg.includes('</svg>'),'invalid svg '+id);
 for(const n of r.npcs)assert(fs.existsSync(path.join(base,n.sprite)),'NPC sprite missing '+n.sprite);
 console.log(id+': '+visit(r)+' traversable cells, '+r.npcs.length+' NPCs');
}
assert(game.includes('function drawInterior(c,inside){')&&game.includes('inside.art'), 'Old shared interior still in use');
assert(!game.includes('c.font=\'bold 28px system-ui\''),'Old huge room label still in map');
assert(game.includes("mark('center')")&&game.includes("mark('market')")&&game.includes("mark('oak')"),'Quest actions missing');
console.log('PASS: 6 independent art rooms, 7 NPC sprite assets, collision access, story gates');
