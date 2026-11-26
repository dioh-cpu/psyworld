/* Lote A: accessibility and negative collision checks at the production feet radius. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),ctx={window:{},document:{}};
for(const file of ['core/kanto-map-data-v2.js','core/kanto-collision-v4.js','core/kanto-viridian-v1.js','core/kanto-interiors-v9.js','core/kanto-room-pixel-v10.js'])
  vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const d=ctx.window.PsyKantoMapDataV2,R=11,STEP=4;
function reachable(map){
  const nx=Math.ceil(map.w/STEP),ny=Math.ceil(map.h/STEP),key=(x,y)=>x+','+y;
  const valid=(x,y)=>x>=0&&y>=0&&x<nx&&y<ny&&d.walkable(map,x*STEP,y*STEP,R);
  const start=[Math.round(map.spawn[0]/STEP),Math.round(map.spawn[1]/STEP)],queue=[start],seen=new Set([key(...start)]);
  assert(valid(...start),map.id+' spawn must fit the full trainer footprint');
  for(let i=0;i<queue.length;i++){
    const [x,y]=queue[i];
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const xx=x+dx,yy=y+dy,k=key(xx,yy);if(seen.has(k)||!valid(xx,yy))continue;
      if(dx&&dy&&(!valid(x+dx,y)||!valid(x,y+dy)))continue;
      seen.add(k);queue.push([xx,yy]);
    }
  }
  return queue;
}
function assertNear(map,queue,name,point,radius){
  assert(queue.some(([x,y])=>Math.hypot(x*STEP-point[0],y*STEP-point[1])<=radius),map.id+' unreachable '+name);
}
const pallet=reachable(d.pallet),route=reachable(d.route1),viridian=reachable(d.viridian);
for(const door of d.pallet.doors)assertNear(d.pallet,pallet,door.id,door.at,door.range||50);
for(const npc of d.pallet.npcs)assertNear(d.pallet,pallet,npc.id,npc.at,60);
assertNear(d.pallet,pallet,'Route 1 exit',d.pallet.exit,55);
assertNear(d.route1,route,'Pallet return',[108,420],55);
assertNear(d.route1,route,'Viridian exit',d.route1.exit,55);
assertNear(d.route1,route,'visible cave approach',d.route1.doors[0].at,d.route1.doors[0].range||50);
for(const field of d.route1.grass)assertNear(d.route1,route,'grass '+field.id,field.entry,25);
assert.equal(d.walkable(d.route1,550,230,R),true,'wooden bridge surface must be traversable');
assert.equal(d.walkable(d.route1,550,245,R),false,'river immediately below the bridge must remain solid');
assertNear(d.viridian,viridian,'Route 2 exit',d.viridian.exit,55);
assertNear(d.viridian,viridian,'Route 1 return',d.viridian.return,45);
for(const door of d.viridian.doors)assertNear(d.viridian,viridian,door.id,door.at,door.range||50);
for(const npc of d.viridian.npcs)assertNear(d.viridian,viridian,npc.id,npc.at,60);
// Representative solid features from the authored maps: water, waterfall,
// fountain, building/monument and large tree/rock footprints.
for(const [map,x,y,label] of [
  [d.pallet,70,170,'waterfall'],[d.pallet,590,406,'monument'],[d.pallet,160,350,'Pokémon Center wall'],
  [d.route1,500,100,'waterfall'],[d.route1,560,360,'river'],[d.route1,850,350,'tree/field edge'],
  [d.viridian,450,418,'fountain basin'],[d.viridian,400,600,'river'],[d.viridian,30,250,'outer cliff']
])assert.equal(d.walkable(map,x,y,R),false,map.id+' must block '+label);
// Every Pallet interior must remain reachable from its door spawn, including
// its NPCs and exit, with the same 11px body radius used outdoors.
for(const room of Object.values(ctx.window.PsyKantoInteriorsV9.rooms)){
  const step=STEP,nx=Math.ceil(room.w/step),ny=Math.ceil(room.h/step),key=(x,y)=>x+','+y;
  const valid=(x,y)=>{
    x*=step;y*=step;const b=room.walkBounds||[0,174,room.w,room.h];
    if(x<R||x<b[0]+R||x>b[2]-R||y<b[1]+R||y>b[3]-R)return false;
    if(room.blocks.some(([x1,y1,x2,y2])=>x>=x1-R&&x<=x2+R&&y>=y1-R&&y<=y2+R))return false;
    return !(room.npcs||[]).some(n=>Math.hypot(x-n.at[0],y-n.at[1])<R+12);
  };
  const start=[Math.round(room.spawn[0]/step),Math.round(room.spawn[1]/step)],queue=[start],seen=new Set([key(...start)]);
  for(let i=0;i<queue.length;i++){
    const [x,y]=queue[i];
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const xx=x+dx,yy=y+dy,k=key(xx,yy);if(seen.has(k)||!valid(xx,yy))continue;
      if(dx&&dy&&(!valid(x+dx,y)||!valid(x,y+dy)))continue;
      seen.add(k);queue.push([xx,yy]);
    }
  }
  const near=(point,r)=>queue.some(([x,y])=>Math.hypot(x*step-point[0],y*step-point[1])<=r);
  assert(near(room.exit,50),room.id+' interior exit is unreachable');
  for(const npc of room.npcs)assert(near(npc.at,65),room.id+' interior NPC unreachable: '+npc.id);
}
console.log(`PASS Lot A geometry: full ${R}px footprint, Pallet ${pallet.length}, Route 1 ${route.length}, Viridian ${viridian.length} reachable cells; bridges, doors, NPCs, exits, interiors and negative terrain checks pass.`);
