const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),W={};
for(const file of ['kanto-continuous-motion-v1','kanto-backpack-quest-v1'])vm.runInNewContext(fs.readFileSync('core/'+file+'.js','utf8'),{window:W});
const motion=W.PsyKantoContinuousMotionV1,grid=Array.from({length:30},()=>Array(30).fill(1));
for(const fps of [30,60,120]){const p={x:100,y:100};for(let i=0;i<fps;i++)motion.advance(grid,p,{x:1,y:0},1/fps);assert(Math.abs(p.x-243)<1e-8);assert.equal(p.y,100);const d={x:100,y:100};for(let i=0;i<fps;i++)motion.advance(grid,d,{x:1,y:1},1/fps);assert(Math.abs(Math.hypot(d.x-100,d.y-100)-143)<1e-8);}
const pause={x:100,y:100};motion.advance(grid,pause,{x:1,y:0},60);assert(pause.x<=117.16000001);
for(let y=0;y<30;y++)grid[y][5]=9;const p={x:120,y:100};for(let i=0;i<120;i++)motion.advance(grid,p,{x:1,y:1},1/60);assert(p.x<133.001);assert(p.y>200);assert(motion.valid(grid,p.x,p.y));
const q=W.PsyKantoBackpackQuestV1,place={},inventory={};assert.equal(q.state(place).stage,'notStarted');q.talk(place);for(let i=0;i<3;i++)assert.equal(q.begin(place,[16,19],16,1),null);const carrier=q.begin(place,[16,19],19,1);assert(carrier);assert.equal(q.finish(place,carrier,false),false);assert.equal(q.state(place).stage,'investigating');const next=q.begin(place,[16,19],16,1);assert.equal(q.finish(place,carrier,true),false);assert.equal(q.finish(place,next,true),true);assert.equal(q.finish(place,next,true),false);assert(q.deliver(place,inventory));assert.equal(inventory['Pokéball'],3);assert(!q.deliver(place,inventory));assert.equal(inventory['Pokéball'],3);assert.equal(q.state(JSON.parse(JSON.stringify(place))).stage,'completed');const old={storyDone:true};assert.equal(q.state(old).stage,'completed');assert(!q.deliver(old,inventory));const recovered={storyItemFound:true};assert.equal(q.state(recovered).stage,'recovered');assert(!q.begin({},[16],999,0));
console.log('PASS V4: 30/60/120 FPS, diagonal speed, pause clamp, swept collision/sliding; carrier guarantee, flee/loss, stale battle, victory, save, legacy migration, single reward');

// Navigation from a fractional physical position must seed its rounded BFS root.
const playable=fs.readFileSync('core/kanto-campaign-playable-v1.js','utf8');
const body=playable.slice(playable.indexOf('  function tilePath(target){'),playable.indexOf('  function backpackGrassTarget(){'));
const path=new Function('model','COLS','ROWS',body+';return tilePath({x:12,y:15});')({x:4.53,y:15,map:{npc:{x:20,y:10},grid:Array.from({length:20},()=>Array(32).fill(1))}},32,20);
assert.equal(path[0].x,5);assert.equal(path.at(-1).x,12);assert.equal(path.length,8);
