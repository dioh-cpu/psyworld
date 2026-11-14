'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const window={PsySeason:{on:()=>false},addEventListener(){},matchMedia(){return{matches:false,addEventListener(){}}}};
const context=vm.createContext({window,console,Uint8Array,Math});
for(const file of ['core/kanto-map-data-v2.js','core/kanto-collision-v4.js','core/kanto-interiors-v9.js','core/kanto-pallet-mask-v1.js','core/kanto-interiors-art-v30.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
const outside=window.PsyKantoMapDataV2.pallet.npcs;
const rooms=window.PsyKantoInteriorsV9.rooms;
const actors=[...outside,...Object.values(rooms).flatMap(room=>room.npcs)];
assert.equal(outside.length,2,'Pallet outdoors retains its two established NPC identities');
assert.equal(Object.values(rooms).flatMap(room=>room.npcs).length,8,'all six interiors and eight established NPC identities remain');
assert.equal(actors.length,10);
for(const npc of actors){
 assert(npc.id&&npc.name&&Array.isArray(npc.at),'NPC identity and map position are present');
 const sprite=npc.sprite||npc.portrait;assert(sprite,'NPC has a renderable sprite: '+npc.id);
 assert(fs.existsSync(path.join(root,sprite)),'NPC sprite exists: '+npc.id+' '+sprite);
 if(sprite.endsWith('.svg')){
  const svg=fs.readFileSync(path.join(root,sprite),'utf8');
  assert.match(svg,/viewBox="0 0 160 190"/,'SVG NPCs use normalized full-body framing: '+npc.id);
  assert.match(svg,/<ellipse[^>]+cy="178"/,'SVG NPC has a ground shadow: '+npc.id);
 }
}
for(const npc of outside)assert(window.PsyKantoPalletMaskV1.canStandWorld(...npc.at),'outdoor NPC stands on the approved walkable path: '+npc.id);
const world=fs.readFileSync(path.join(root,'core/kanto-world-v2.js'),'utf8');
assert.match(world,/const markerY=palletActor\?y-h-8:y-60/,'interaction indicator remains above Pallet characters');
assert.match(world,/c\.translate\(x,y\);c\.rotate\(lean\);c\.scale\(narrow,breathe\);c\.translate\(-x,-y\)/,'idle motion pivots at the character feet');
assert.match(world,/responsive\?\.42:\.28/,'idle bob remains subtle enough to keep feet grounded');
assert.match(world,/showDialog\(id==='child'\?'Luna':'Mina'/,'Luna retains her own name while keeping the existing neighbor quest mark');
assert.match(world,/y-h\+footOffset\+bob/,'NPC art uses its per-asset foot anchor');
const oak=rooms.lab.npcs.find(n=>n.id==='oak');
assert(Math.abs(oak.footOffset-(20/280))<1e-9,'Professor Carvalho art alpha padding is compensated to align shoes with the ground shadow');
console.log('Pallet NPC audit PASS:',actors.length,'existing full-body sprites; all outdoor positions walkable; six interiors, identities and ground anchors preserved');
