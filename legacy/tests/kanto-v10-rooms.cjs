/* PSYWORLD Kanto V10 — verificação dos interiores pixel-art.
 * Executar: node tests/kanto-v10-rooms.cjs
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const W={},stats={pixels:0,canvases:0},doc={createElement(){
 stats.canvases++;
 return {width:0,height:0,getContext(){
  return {fillRect(){stats.pixels++},beginPath(){},moveTo(){},lineTo(){},stroke(){},fill(){},ellipse(){},
   createLinearGradient(){return{addColorStop(){}}},createRadialGradient(){return{addColorStop(){}}},
   set fillStyle(v){},set strokeStyle(v){},set lineWidth(v){},set imageSmoothingEnabled(v){}};
 }};
}};
vm.runInNewContext(read('core/kanto-interiors-v9.js'),{window:W});
vm.runInNewContext(read('core/kanto-room-pixel-v10.js'),{window:W,document:doc});
const rooms=W.PsyKantoInteriorsV9.rooms,ids=['center','market','lab','home','house-east','house-west'];
const game=read('core/kanto-world-v2.js'),html=read('index.html');
const valid=(r,x,y)=>x>24&&x<r.w-24&&y>174&&y<r.h-24&&!r.blocks.some(([a,b,c,d])=>x>=a-5&&x<=c+5&&y>=b-5&&y<=d+5);
for(const id of ids){
 const r=rooms[id],art=r.paint;
 assert.equal(r.w,480);assert.equal(r.h,720);
 assert.equal(art.width,480);assert.equal(art.height,720);
 assert.strictEqual(art,r.paint,'rasterization should happen only once');
 assert(valid(r,...r.spawn),'spawn blocked '+id);
 const step=8,start=r.spawn.map(p=>Math.round(p/step)),q=[start],visited=new Set([start.join(',')]);
 for(let i=0;i<q.length;i++){
  const [x,y]=q[i];
  for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){
   const nx=x+dx,ny=y+dy,key=nx+','+ny;
   if(!visited.has(key)&&valid(r,nx*step,ny*step)){visited.add(key);q.push([nx,ny])}
  }
 }
 const reach=(pt,d)=>q.some(([x,y])=>Math.hypot(x*step-pt[0],y*step-pt[1])<d);
 assert(reach(r.exit,38),'exit inaccessible '+id);
 for(const npc of r.npcs){
  assert(valid(r,...npc.at),'NPC embedded in furniture '+id+'/'+npc.id);
  assert(reach(npc.at,65),'NPC inaccessible '+id+'/'+npc.id);
  assert.equal(npc.portrait,npc.sprite,'NPC portrait must match character '+npc.id);
 }
 console.log('OK',id,q.length,'reachable cells; characters',r.npcs.length);
}
assert(stats.pixels>20000,'art is missing visual texture');
assert.equal(stats.canvases,6,'room paintings should be cached');
assert(game.includes('paint:room.paint'),'interior must display painted canvas');
assert(game.includes('const scale=state.inside?Math.min'),'interior camera must fit phone');
assert(html.indexOf('core/kanto-interiors-v9.js')<html.indexOf('core/kanto-room-pixel-v10.js'));
assert(html.indexOf('core/kanto-room-pixel-v10.js')<html.indexOf('core/kanto-world-v2.js'));
assert(game.includes("mark('oak')")&&game.includes("mark('center')")&&game.includes("mark('market')")&&game.includes("mark('guard')"));
console.log('PASS V10 — 6 pixel-art rooms, 1x render, proper camera, NPC positions, exits, mission');
