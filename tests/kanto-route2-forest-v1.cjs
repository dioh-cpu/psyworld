/* Focused geometry, connections and UI wiring checks for the first Kanto lot. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('core/kanto-early-chapters-v1.js','utf8');
const W={};vm.runInNewContext(source,{window:W});
const api=W.PsyKantoEarlyChaptersV1;
assert.equal(api.version,1);
assert.deepEqual(Array.from(api.ids),['route-2','viridian-forest']);

function reaches(map,target){
 const seen=new Set(),queue=[[map.spawn.x,map.spawn.y]];
 const key=(x,y)=>x+','+y;seen.add(key(...queue[0]));
 for(let i=0;i<queue.length;i++){
  const [x,y]=queue[i];if(x===target.x&&y===target.y)return true;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const nx=x+dx,ny=y+dy,k=key(nx,ny);
   if(!seen.has(k)&&api.walkable(map.id,nx,ny)){seen.add(k);queue.push([nx,ny]);}
  }
 }
 return false;
}
for(const id of api.ids){
 const map=api.get(id);
 assert.equal(map.grid.length,20,id+' rows');
 assert(map.grid.every(row=>row.length===32),id+' columns');
 for(const point of [map.spawn,map.npc,map.object,map.exit,map.returnGate])assert(reaches(map,point),id+' has a disconnected landmark at '+JSON.stringify(point));
 assert(map.art.endsWith('.webp'));
}
const route=api.get('route-2'),forest=api.get('viridian-forest');
assert.equal(route.art,'assets/story/route-2-artist-v1.webp');
assert.equal(forest.art,'assets/story/viridian-forest-route2-v1.webp');
assert.equal(route.returnTo.world,'viridian');
assert.equal(route.next.world,'viridian-forest');
assert.equal(forest.returnTo.world,'route-2');
assert.equal(forest.next.world,'pewter');
assert.deepEqual(Array.from(route.encounterLevels),[3,6]);
assert.deepEqual(Array.from(forest.encounterLevels),[4,8]);
assert(forest.lanterns.length===3);
const sourceRoute=api.get('route-2');sourceRoute.grid[1][1]=0;
assert.equal(api.get('route-2').grid[1][1],9,'get() returns a fresh collision grid');

const playable=fs.readFileSync('core/kanto-campaign-playable-v1.js','utf8');
const hobbies=fs.readFileSync('core/hobbies-v2.js','utf8');
const html=fs.readFileSync('index.html','utf8');
assert(playable.includes('PsyKantoEarlyChaptersV1?.get?.(place.id)'),'authored collision maps must feed the production renderer');
assert(playable.includes('data-kp-route-footer')&&playable.includes('data-kp-route'),'both route controls must use one handler');
assert(playable.includes('const followObjective=()=>{if(model.riftSession)')&&playable.includes('W.PsyCampaignAutomation?.startPrimaryRoute?.()'),'route controls must share the mission controller and stay locked during the timed rift');
assert(playable.includes('function tickRift(now=Date.now())')&&playable.includes("W.PsyKantoHuntRiftV1?.status?.(model.riftSession,now)"),'the playable map must tick the real rift session deadline');
assert(playable.includes("art:'assets/story/kanto-hunt-rift-v1.webp'"),'the temporary map must render its authored scene art');
assert(playable.includes('if(pendingRift?.context.world===id)attachRiftOffer(pendingRift)'),'a pending portal must be positioned before a reopened map renders it');
assert(playable.includes("model.place.id==='viridian-forest'"),'Forest field gathering must be integrated into the current scene');
assert(playable.includes('const spot=W.PsyHobbies?.nearby?.(model.place.id,{x,y},32)')&&playable.includes('model.autoSpot=spot.id;model.autoPath=path'),'mouse and touch taps on hobby spots must path to and start gathering');
assert(playable.includes('model.map?.encounterLevels||'),'the authored map encounter level ranges must drive live battles');
assert(hobbies.includes("'viridian-forest':[['f1','gardener'"),'Forest needs its own existing-system gathering spots');
for(const [id,points] of [['route-2',[[434,381],[430,239],[691,183],[460,292],[730,378],[270,420],[700,280]]],['viridian-forest',[[185,260],[724,305],[642,218],[690,365],[407,320],[450,465],[280,320]]]]){
 const map=api.get(id);for(const [x,y] of points)assert(reaches(map,{x:Math.floor(x/28),y:Math.floor(y/28)}),id+' Hobby spot must be connected to the map spawn at '+x+','+y);
}
assert(html.indexOf('core/kanto-early-chapters-v1.js')<html.indexOf('core/kanto-campaign-playable-v1.js'),'the hand-authored data must load before its renderer');
assert(html.indexOf('core/kanto-hunt-rift-v1.js')>html.indexOf('core/kanto-campaign-playable-v1.js'),'the shared timer must load after both production map controllers');
assert(playable.includes("model.place?.kind==='route'||model.place?.kind==='dungeon'"),'route and dungeon spots need production drawing and touch targets');
assert(playable.includes('W.PsyKantoWorldV2?.referenceViewport?.()')&&playable.includes('const cover=Math.max(cw/referenceW,ch/referenceH)'),'camera must use the actual Route1 viewport and runtime world dimensions');
assert(playable.includes('c.setTransform(view.scale,0,0,view.scale,view.ox,view.oy)'),'the production canvas must render map, actor, followers and spots through the shared camera');
assert(playable.includes('x=(sx-view.ox)/view.scale,y=(sy-view.oy)/view.scale'),'touch and mouse interactions must invert the camera transform');
assert(playable.includes('((point.x+.5)*TILE*view.scale+view.ox)'),'mission dialogue targets must follow the same camera transform');
assert(playable.includes('drawSceneAmbience(c,now)')&&playable.includes('render();model.lastRender=now;model.raf=requestAnimationFrame(tick)'),'Route 2 and Forest ambient animation must run in the existing render loop');
assert(playable.includes('drawChapterNpcIdle(c,model.map.id||model.place.id,x,y,model.map.npcIdle)')&&playable.includes('walk.renderAnimated(ctx,data.atlas,data.state,{moving:false'),'visible story NPCs need subtle idle motion with their ground shadow anchored');
assert(playable.includes('const npcClose=enhancedScene&&Math.abs(model.x-model.map.npc.x)+Math.abs(model.y-model.map.npc.y)<=2')&&playable.includes('if(!npcClose)marker(model.map.npc'),'nearby dialogue labels must not collide with the player name');
assert(playable.includes('const pointVisible=(x,y)=>')&&playable.includes('const labelVisible=(x,y,width,height=14)=>')&&playable.includes('if(!pointVisible(sx,sy))return'),'off-camera story markers must not jump to the viewport edge');
assert(playable.includes('#psy-kanto-world[data-place="route-2"] #psy-kanto-canvas,#psy-kanto-world[data-place="viridian-forest"] #psy-kanto-canvas,#psy-kanto-world[data-place="pewter"] #psy-kanto-canvas{display:block;width:100%;height:100%;aspect-ratio:auto;max-width:none;max-height:none'),'only Route 2 and Forest should fill the stage without aspect-ratio letterboxing');
for(const file of ['assets/story/route-2-artist-v1.webp','assets/story/viridian-forest-route2-v1.webp','assets/story/kanto-hunt-rift-v1.webp'])assert(fs.existsSync(file),file+' is missing');
new Function(source);new Function(playable);
console.log('PASS: Route 2 and Forest collision connectivity, story landmarks, region links, map art and shared mission-route controls');
