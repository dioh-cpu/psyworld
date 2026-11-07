/* PSYWORLD Hobbies VFX. Transient action state only; rewards stay in Hobbies V2. */
(function(W,D){
'use strict';
if(W.PsyHobbiesVFX)return;
const FRAME_MS=1000/30;
const MAX_PARTICLES=144, FRAME_ROW={down:0,left:1,right:2,up:3};
const palette={ore:'#8fe9ff',wood:'#d8a56c',leaf:'#91df9d',petal:'#ffe0f0',water:'#97ebff',gold:'#ffe7a0'};
const rarityColor={rare:'#80e8ff',epic:'#ce9dff',legend:'#ffe182'};
const Hobbies=()=>W.PsyHobbies;
const images=Object.create(null),actions=new Map(),fishing=new Map(),impacts=new Map(),particles=[];
const toolImages=Object.create(null),toolMaterials=['copper','iron','silver','gold','coal','ruby','sapphire','jade'];
let eventSerial=0;
const reducedMotion=()=>!!W.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
const clock=()=>Number(W.performance?.now?.()??Date.now());
function load(src){
 if(!W.Image)return null;
 const im=new W.Image();im.loaded=false;im.onload=()=>{im.loaded=true};im.onerror=()=>{im.failed=true};im.src=src;return im;
}
images.ore=load('assets/idle-realistic/pallet/rock_mid.png');
images.tree=load('assets/idle-realistic/pallet/tree_curve-transparent-v1.png');
images.flower=load('assets/idle-realistic/pallet/bush_flowers.png');
images.rod=load('assets/items/fishing-rod.png');
for(const type of ['pickaxe','axe'])for(const material of toolMaterials)
 toolImages[type+':'+material]=load('assets/hobbies/tools/'+type+'-'+material+'.png');
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
const spotKey=(scene,id)=>scene+':'+id;
function facingRow(actor,target){
 const dx=target.x-actor.x,dy=target.y-actor.y;
 if(Math.abs(dx)+Math.abs(dy)<1)return FRAME_ROW[actor.facing]??0;
 return Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy<0?3:0);
}
function startAction({scene,node,actor,onImpact}){
 if(!scene||!node||!actor||!Number.isFinite(actor.x)||!Number.isFinite(actor.y)||typeof onImpact!=='function')return false;
 if(!['gardener','miner','lumber'].includes(node.kind))return false;
 if(actions.has(scene))return false;
 const kind=node.kind==='miner'?'mining':node.kind==='lumber'?'chopping':'gathering';
 const frameCount=kind==='gathering'?20:24,impactFrame=kind==='gathering'?11:17,duration=frameCount*FRAME_MS;
 const at=clock();
 const material=toolMaterials.includes(actor.toolMaterial)?actor.toolMaterial:'copper';
 actions.set(scene,{scene,node:{...node},kind,toolMaterial:material,actor:{x:actor.x,y:actor.y},row:facingRow(actor,node),startedAt:at,lastAt:at,elapsed:0,duration,impactAt:FRAME_MS*impactFrame,impactFrame,frameCount,frame:0,impactFired:false,onImpact,cancelled:false});
 return true;
}
function sampleAction(scene,actor={},nowValue){
 const a=actions.get(scene);if(!a)return null;
 if(actor.moving||Number.isFinite(actor.x)&&Number.isFinite(actor.y)&&Math.hypot(actor.x-a.actor.x,actor.y-a.actor.y)>9){a.cancelled=true;actions.delete(scene);return null;}
 const t=Number.isFinite(nowValue)?nowValue:clock(),dt=Math.max(0,t-a.lastAt);a.lastAt=t;a.elapsed+=Math.min(50,dt);
 a.frame=Math.min(a.frameCount-1,Math.floor(a.elapsed/FRAME_MS));
 if(!a.impactFired&&a.elapsed>=a.impactAt){a.impactFired=true;const callback=a.onImpact;a.onImpact=null;callback?.();}
 if(a.elapsed>=a.duration){actions.delete(scene);return null;}
 return a;
}
function blocksMovement(scene){return actions.has(scene)||!!fishing.get(scene)?.active;}
function isBusy(scene){return actions.has(scene)||!!fishing.get(scene)?.active;}
function cancelAction(scene){const a=actions.get(scene);if(a){a.cancelled=true;a.onImpact=null;actions.delete(scene);return true}return false}
function addParticle(scene,x,y,color,kind,seed,life=520){
 if(reducedMotion())return;
 if(particles.length>=MAX_PARTICLES)particles.shift();
 const s=seed||++eventSerial,ang=((s*37)%628)/100,mag=kind==='splash'?16:9;
 particles.push({scene,x,y,vx:Math.cos(ang)*mag,vy:-11-(s%7)*1.6,ay:kind==='splash'?10:22,color,kind,born:clock(),life,spin:((s%9)-4)*.12,size:kind==='splinter'?2+(s%3):1+(s%2)});
}
function burst(scene,x,y,type,count=7){
 const color=palette[type]||palette.gold,serial=++eventSerial;
 for(let i=0;i<count;i++)addParticle(scene,x,y,color,type,serial*13+i,type==='splash'?720:560);
}
function sfx(name){try{W.psyAudio?.sfx?.(name)}catch(_){}}
function onSpotHit({scene,node,hit=1,completed=false}){
 if(!scene||!node)return;
 const key=spotKey(scene,node.id),at=clock();impacts.set(key,{at,hit,completed});
 const x=node.x,y=node.y-14;
 if(node.kind==='miner'){burst(scene,x,y,completed?'gold':'ore',completed?12:7);sfx('rock');}
 else if(node.kind==='lumber'){burst(scene,x,y-8,completed?'leaf':'wood',completed?13:7);sfx('hit');}
 else{burst(scene,x,y,'petal',completed?8:5);sfx('grass');}
}
function pose(action){
 const f=action.frame,kind=action.kind;
 if(kind==='mining'||kind==='chopping'){
  let reach,toolAngle;
  if(f<4){reach=.18+ease(f/4)*.12;toolAngle=.2}
  else if(f<10){const t=ease((f-4)/6);reach=.3+t*.64;toolAngle=.2-t*1.32}
  else if(f<17){reach=.94+Math.sin((f-10)/7*Math.PI)*.035;toolAngle=-1.12}
  else if(f===17){reach=.46;toolAngle=0}
  else if(f<22){const t=ease((f-17)/5);reach=.46+t*.35;toolAngle=.85*(1-t)}
  else{reach=.2;toolAngle=0}
  return {reach,dip:f===17?.68:f>17&&f<22?.18:0,toolAngle,impact:f===17};
 }
 if(kind==='fishing'){
  const reach=action.reeling?.52:action.casting?ease(f/3)*.46:.18+Math.sin(action.elapsed*.002)*.025;
  return {reach,dip:action.reeling?.12:0,toolAngle:action.reeling?.18:0,impact:false};
 }
 if(kind==='gathering'){
  const impact=action.impactFrame;
  const reach=f<impact?ease(f/impact):1-ease((f-impact)/Math.max(1,action.frameCount-impact));
  return {reach,dip:Math.sin(Math.PI*clamp(reach))*.8,toolAngle:0,impact:f===impact};
 }
 return {reach:0,dip:0,toolAngle:0,impact:false};
}
function drawActor(c,scene,{x,y,action=null,atlas=null,avatarUrl='',fishing:fishState=null}={}){
 if(action){
  const actionPose=pose(action);
  if(action.kind==='mining'||action.kind==='chopping'){
   // When the trainer faces away from the camera, the tool is on the far side
   // of the body. Composite it first so the torso and head naturally occlude
   // the handle instead of letting the pick head cross the face.
   if(action.row===3)drawHobbyTool(c,action,actionPose,x,y);
   drawBodyMotion(c,atlas,x,y,action,actionPose);
   if(action.row!==3)drawHobbyTool(c,action,actionPose,x,y);
   drawHeadOverTool(c,atlas,x,y,action.row);
  }else drawBodyMotion(c,atlas,x,y,action,actionPose);
 }
 const storedFish=fishing.get(scene),activeFish=fishState||(storedFish?.active||storedFish?.endedAt&&clock()-storedFish.endedAt<460?storedFish:null);
 if(activeFish){
  if(!action&&activeFish.active){
   const elapsed=Math.max(0,clock()-activeFish.startedAt),casting=elapsed<360,frame=casting?Math.min(3,Math.floor(elapsed/90)):activeFish.reeling?2:0;
   const fishingPose={kind:'fishing',row:activeFish.row,frame,elapsed,casting,reeling:activeFish.reeling};
   drawBodyMotion(c,atlas,x,y,fishingPose,pose(fishingPose));
  }
  drawRod(c,activeFish,x,y);
 }
}
function drawBodyMotion(c,atlas,x,y,action,p){
 if(!atlas?.image)return;
 const sw=atlas.cellWidth||256,sh=atlas.cellHeight||128;
 // Recompose a narrow torso/arm band from the approved authored WALK poses.
 // The head, feet, shadow and full-body scale remain from the production renderer.
 const col=action.kind==='fishing'?Math.max(0,Math.min(3,action.frame|0)):
  action.kind==='mining'||action.kind==='chopping'?
   action.frame<4?0:action.frame<10?3:action.frame<17?2:action.frame===17?1:action.frame<22?3:0:
   action.frame<4?0:action.frame<9?1:action.frame<14?2:action.frame<18?3:0,tile=action.row*4+col;
 const dip=(action.kind==='gathering'?p.dip:0);
 c.save();c.beginPath();c.rect(x-17,y-43,34,27);c.clip();c.imageSmoothingEnabled=false;
 c.drawImage(atlas.image,(tile%8)*sw,Math.floor(tile/8)*sh,sw,sh,x-24,y-55+dip,48,64);c.restore();
}
function drawHobbyTool(c,action,p,x,y){
 const type=action.kind==='mining'?'pickaxe':'axe',im=toolImages[type+':'+action.toolMaterial];if(!im?.loaded)return;
 const target=action.node,dx=target?.x-x||0,dy=(target?.y-14)-y||0,distance=Math.hypot(dx,dy);
 const row=action.row,baseX=row===1?-8:row===2?9:row===3?8:7,baseY=row===3?-18:-25;
 const raised=p.reach>.72,size=Math.max(34,Math.min(52,34+Math.max(0,distance-28)*.28));
 const desired=Math.atan2(dy+25,dx-baseX),nativeHeadAngle=-.8;
 c.save();c.translate(Math.round(x+baseX),Math.round(y+baseY-(raised?8:0)));
 if(row===1)c.scale(-1,1);
 c.rotate(desired-nativeHeadAngle+p.toolAngle);
 c.imageSmoothingEnabled=false;
 c.drawImage(im,-size*.13,-size*.78,size*.78,size*.78);
 c.restore();
}
function drawHeadOverTool(c,atlas,x,y,row){
 if(!atlas?.image)return;
 const sw=atlas.cellWidth||256,sh=atlas.cellHeight||128,tile=(row|0)*4;
 c.save();c.beginPath();c.rect(x-24,y-57,48,29);c.clip();c.imageSmoothingEnabled=false;
 c.drawImage(atlas.image,(tile%8)*sw,Math.floor(tile/8)*sh,sw,sh,x-24,y-55,48,64);
 c.restore();
}
function drawRod(c,fish,x,y){
 const im=images.rod;if(!im?.loaded)return;
 const row=fish.row??0,t=clamp((clock()-fish.startedAt)/360),rest=row===0?-.7:row===3?.6:row===1?1:-1,casting=clock()-fish.startedAt<360;
 const angle=rest+(casting?(-1.25-rest)*(1-ease(t)):Math.sin(clock()*.002)*.018),hx=x+(row===1?-8:row===2?8:4),hy=y-28;
 c.save();c.translate(Math.round(hx),Math.round(hy));c.rotate(angle);c.imageSmoothingEnabled=false;c.drawImage(im,-8,-25,18,24);c.restore();
}
function drawExhausted(c,kind,x,y){
 c.save();c.globalAlpha=.82;
 if(kind==='lumber'){
  c.fillStyle='#65402f';c.strokeStyle='#302724';c.lineWidth=2;c.beginPath();c.ellipse(x,y-5,10,5,0,0,Math.PI*2);c.fill();c.stroke();
  c.strokeStyle='#bf9463';c.lineWidth=1.3;c.beginPath();c.ellipse(x,y-6,5,2.4,0,0,Math.PI*2);c.stroke();
 }else if(kind==='miner'){
  c.fillStyle='#6d7b83';c.strokeStyle='#d0d9d5';c.lineWidth=1;c.beginPath();c.moveTo(x-17,y);c.lineTo(x-11,y-10);c.lineTo(x-2,y-7);c.lineTo(x+6,y-13);c.lineTo(x+17,y);c.closePath();c.fill();c.stroke();
 }else{
  c.strokeStyle='#4f8b62';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-9);c.moveTo(x,y-4);c.lineTo(x-7,y-10);c.moveTo(x,y-3);c.lineTo(x+7,y-11);c.stroke();
 }
 c.restore();
}
function drawCracks(c,kind,x,y,hits,age){
 if(kind==='miner'&&hits>0){
  c.save();c.translate(x,y-20);c.strokeStyle=hits>=4?'#eaffff':'#263a51';c.lineWidth=hits>=3?1.5:1;c.lineJoin='round';c.beginPath();
  c.moveTo(-8,0);c.lineTo(-3,5);c.lineTo(-5,11);if(hits>=2){c.moveTo(-3,5);c.lineTo(2,6);c.lineTo(6,12)}if(hits>=3){c.moveTo(2,6);c.lineTo(3,0);c.lineTo(9,-4)}if(hits>=4){c.moveTo(-5,11);c.lineTo(-10,15);c.moveTo(6,12);c.lineTo(12,16)}
  c.stroke();if(age<110){c.globalAlpha=1-age/110;c.fillStyle='#d9fbff';c.beginPath();c.arc(0,5,2.2,0,Math.PI*2);c.fill()}c.restore();
 }else if(kind==='lumber'&&hits>0){
  c.save();c.translate(x,y-18);c.strokeStyle=hits>=4?'#ffdf98':'#402d25';c.lineWidth=hits>=3?2:1.2;c.beginPath();c.moveTo(-1,0);c.lineTo(1,5);c.lineTo(-2,8);c.lineTo(1,13);if(hits>=2){c.moveTo(-1,5);c.lineTo(-7,7)}if(hits>=3){c.moveTo(-2,8);c.lineTo(7,11)}c.stroke();c.restore();
 }
}
function drawProgress(c,node){
 if(node.kind!=='miner'&&node.kind!=='lumber')return;
 c.save();c.fillStyle='#071321d9';c.strokeStyle='#d1e7e7';c.lineWidth=1;c.beginPath();c.roundRect(-19,4,38,12,4);c.fill();c.stroke();
 const total=Math.max(1,node.totalHits||5);c.fillStyle=node.kind==='miner'?'#82e5fa':'#deb179';c.fillRect(-16,7,32*clamp(node.hits/total),3);
 c.fillStyle='#fff';c.font='bold 8px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(node.hits+'/'+total,0,12);c.restore();
}
function drawNode(c,scene,def,record,now,rarity='common'){
 const [id,kind,x,y]=def,available=!record?.respawnAt||record.respawnAt<=Date.now();
 const hit=available?Math.max(0,Math.min(4,Math.floor(Number(record?.hits)||0))):0;
 const impact=impacts.get(spotKey(scene,id)),age=impact?Math.max(0,now-impact.at):9999;
 c.save();c.translate(x,y);
 c.fillStyle='#0612244f';c.beginPath();c.ellipse(0,-1,kind==='lumber'?15:kind==='miner'?20:18,4,0,0,Math.PI*2);c.fill();
 if(!available){drawExhausted(c,kind,0,0);c.restore();return}
 if(rarity!=='common'){
  const color=rarityColor[rarity]||rarityColor.rare,pulse=reducedMotion()?1:.72+Math.sin(now*.003)*.12;
  c.save();c.globalAlpha=pulse;c.strokeStyle=color;c.lineWidth=1.4;c.beginPath();c.ellipse(0,-8,kind==='lumber'?20:kind==='miner'?22:20,kind==='lumber'?5:4,0,0,Math.PI*2);c.stroke();
  c.globalAlpha=.75;c.fillStyle=color;c.beginPath();c.arc(kind==='lumber'?16:13,kind==='lumber'?-34:-24,2.1,0,Math.PI*2);c.fill();c.restore();
 }
 if(kind==='miner'){
  const im=images.ore;if(im?.loaded){c.imageSmoothingEnabled=false;c.drawImage(im,-24,-29,48,30)}
  drawCracks(c,kind,0,0,hit,age);drawProgress(c,{kind,hits:hit,totalHits:Hobbies()?.requiredHits?.(kind)||5});
 }else if(kind==='lumber'){
  const sway=reducedMotion()?0:Math.sin(now*.007)*.012+(age<190?Math.sin(age*.09)*.025*(1-age/190):0);
  c.save();c.translate(0,0);c.rotate(sway);const im=images.tree;if(im?.loaded){c.imageSmoothingEnabled=false;c.drawImage(im,-25,-51,50,49)}c.restore();
  drawCracks(c,kind,0,0,hit,age);drawProgress(c,{kind,hits:hit,totalHits:Hobbies()?.requiredHits?.(kind)||5});
 }else{
  const sway=reducedMotion()?0:Math.sin(now*.0022)*.035;
  c.save();c.translate(0,-1);c.rotate(sway);const im=images.flower;if(im?.loaded){c.imageSmoothingEnabled=false;c.drawImage(im,-23,-31,46,33)}c.restore();
 }
 c.restore();
}
function drawParticles(c,scene,now){
 for(let i=particles.length-1;i>=0;i--){
  const p=particles[i],elapsed=now-p.born,life=elapsed/p.life;
  if(life>=1){particles[i]=particles[particles.length-1];particles.pop();continue;}
  if(p.scene!==scene)continue;
  const t=elapsed/1000,x=p.x+p.vx*t,y=p.y+p.vy*t+p.ay*t*t,alpha=1-life;
  c.save();c.globalAlpha=alpha;c.translate(Math.round(x),Math.round(y));c.rotate(p.spin*elapsed/100);c.fillStyle=p.color;
  if(p.kind==='splinter'||p.kind==='wood'){c.fillRect(-p.size*.5,-p.size*1.5,p.size,p.size*2)}
  else if(p.kind==='petal'){c.beginPath();c.ellipse(0,0,p.size*1.2,p.size*.55,0,0,Math.PI*2);c.fill()}
  else if(p.kind==='splash'){c.beginPath();c.ellipse(0,0,p.size*1.7,p.size*.55,0,0,Math.PI*2);c.fill()}
  else{c.beginPath();c.moveTo(0,-p.size);c.lineTo(p.size*.65,0);c.lineTo(0,p.size);c.lineTo(-p.size*.65,0);c.closePath();c.fill()}
  c.restore();
 }
}
function drawFish(c,scene,now){
 const f=fishing.get(scene);if(!f)return;
 if(f.endedAt&&now-f.endedAt>1300){fishing.delete(scene);return;}
 const actor=f.actor;if(!actor||!Number.isFinite(actor.x)||!Number.isFinite(actor.y))return;
 const vectors=[[0,1],[-1,0],[1,0],[0,-1]],v=vectors[f.row]||vectors[0],age=(now-f.startedAt)/1000;
 const toss=clamp((now-f.startedAt)/330),reach=30*toss,bx=actor.x+v[0]*reach,by=actor.y+v[1]*reach-1+(reducedMotion()?0:Math.sin(now*.005)*1.1);
 c.save();c.strokeStyle='#bfe8efb0';c.lineWidth=1;c.beginPath();c.moveTo(actor.x+v[0]*4,actor.y-31);c.quadraticCurveTo(actor.x+v[0]*25,actor.y-44,bx,by-2);c.stroke();
 const ripple=reducedMotion()?0:Math.sin(now*.008)*1.2;c.strokeStyle='#9aeaff99';for(let i=0;i<2;i++){const radius=4+i*3+((age*5+i*3)%3);c.beginPath();c.ellipse(bx,by+2,radius,radius*.34,0,0,Math.PI*2);c.stroke()}
 c.fillStyle=f.result==='success'?'#fff0a3':f.result==='fail'?'#94a6b7':'#f05d5e';c.strokeStyle='#f4f6eb';c.lineWidth=1.2;c.beginPath();c.ellipse(bx,by,3.3,4.3+ripple,0,0,Math.PI*2);c.fill();c.stroke();
 if(f.red&&!reducedMotion()&&now%220<45){c.fillStyle='#b8f5ff';c.beginPath();c.arc(bx+3,by-7,1.7,0,Math.PI*2);c.fill()}
 c.restore();
}
function drawField(c,scene){
 const H=W.PsyHobbies;if(!H)return;
 const all=H.fieldDefinitions?.()||{},defs=all[scene]||(/^route-\d+$/.test(scene)?all['route-3']:[]);
 const now=clock(),records=H.field().nodes||{};
 for(const def of defs){const rec=records[spotKey(scene,def[0])]||null,rarity=Hobbies()?.rarityForSpot?.(scene,def[0],def[1],rec)||'common';drawNode(c,scene,def,rec,now,rarity)}
 drawFish(c,scene,now);drawParticles(c,scene,now);
}
function startFishing(scene,actor){
 if(!scene)return false;
 const row=FRAME_ROW[actor?.facing]??0;
 fishing.set(scene,{scene,actor:actor?{x:actor.x,y:actor.y}:null,row,startedAt:clock(),meter:.46,progress:0,green:false,red:false,cast:true,result:null,endedAt:0,active:true});
 burst(scene,actor?.x||0,actor?.y||0,'splash',5);sfx('water');
 const panel=D.getElementById('psy-hobby-fishing');if(panel)panel.dataset.fishingState='casting';
 return true;
}
function updateFishing(scene,state){
 const f=fishing.get(scene);if(!f)return;
 f.meter=state.meter;f.progress=state.progress;f.green=!!state.green;f.red=!!state.red;f.reeling=!!state.reeling;
 const panel=D.getElementById('psy-hobby-fishing');if(panel)panel.dataset.fishingState=f.red?'danger':f.green?'steady':'adjust';
}
function finishFishing(scene,success){
 const f=fishing.get(scene);if(!f)return;
 f.result=success?'success':'fail';f.endedAt=clock();f.active=false;
 const v=[[0,1],[-1,0],[1,0],[0,-1]][f.row]||[0,1],x=(f.actor?.x||0)+v[0]*30,y=(f.actor?.y||0)+v[1]*30-1;
 burst(scene,x,y,success?'water':'water',success?12:7);sfx('water');
 const panel=D.getElementById('psy-hobby-fishing');if(panel)panel.dataset.fishingState=success?'caught':'escaped';
}
function actionVisual(action){
 if(!action)return null;
 const p=pose(action);
 return {kind:action.kind,frame:action.frame,frameCount:action.frameCount,row:action.row,elapsed:action.elapsed,duration:action.duration,pose:p};
}
const H=W.PsyHobbies;
if(H){H.drawField=drawField;}
W.PsyHobbiesVFX={
 version:1,capabilities:{flowerGathering:true,oreStrike:true,woodChopping:true,fishingCast:true,fishingLine:true,spotVfx:true},
 beginAction:startAction,startAction,sampleAction,blocksMovement,isBusy,cancelAction,actionVisual,onSpotHit,
 startFishing,updateFishing,finishFishing,drawField,drawActor,
 debug:()=>({pendingActions:actions.size,particles:particles.length,fishing:fishing.size,loaded:Object.fromEntries(Object.entries(images).map(([k,v])=>[k,!!v?.loaded])),tools:Object.fromEntries(Object.entries(toolImages).map(([k,v])=>[k,!!v?.loaded]))})
};
})(window,document);
