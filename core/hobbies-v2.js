/* PSYWORLD — HOBBIES V2 (all careers become non-exclusive hobbies).
 * Existing profession inventories and queues remain in saves for compatibility.
 * Level advances are manual; transactions consume actual materials atomically.
 */
(function(W,D){
'use strict';
if(W.PsyHobbies)return;
const RAW=[
 ['miner','Minerador','miner',['Terra','Pedra'],'def',1,'Minério Bruto','Lingote de Mina'],
 ['gardener','Jardineiro','gardener',['Planta','Fada'],'hp',1,'Flor do Campo','Vaso Floral'],
 ['fisher','Pescador','fisher',['Água'],'cap',.5,'Peixe de Rio','Isca de Rio'],
 ['lumber','Lenhador','lumber',['Planta','Inseto'],'atk',1,'Madeira Bruta','Tábuas de Carvalho'],
 ['engineer','Engenheiro','engineer',['Normal'],'cap',.5,'Essência Normal','Normal Ball'],
 ['herbalist','Herborista','herbalist',['Planta'],'hp',1,'Essência Planta','Bálsamo Restaurador'],
 ['researcher','Pesquisador','researcher',['Psíquico'],'xp',1,'Essência Psíquica','Caderno de Pesquisa'],
 ['professor','Professor','professor',['Normal'],'xp',1,'Essência Normal','Guia de Treinamento'],
 ['stylist','Estilista','stylist',['Fada'],'cap',.5,'Essência Fada','Tecido Encantado'],
 ['echo','Tecelão de Ecos','echo',['Fantasma'],'drop',1,'Essência Fantasma','Cristal Harmônico'],
 ['dream','Cartógrafo Onírico','dream',['Psíquico'],'gold',1,'Essência Psíquica','Mapa dos Sonhos'],
 ['twilight','Guardião do Crepúsculo','twilight',['Noturno'],'def',1,'Essência Sombria','Selo Crepuscular'],
 ['alchemist','Alquimista','alchemist',['Fogo','Planta'],'atk',1,'Essência Fogo','Tônico de Ataque'],
 ['treasureHunter','Caçador de Tesouros','treasure-hunter',['Terra','Pedra'],'drop',1,'Fragmento Antigo','Relíquia Mineral'],
 ['looter','Looter','looter',['Fantasma','Noturno'],'drop',1,'Fragmento de Baú','Selo de Saque']
];
const JOBS=RAW.map(([id,name,art,types,stat,per,material,product])=>({id,name,art,types,stat,per,material,product,starter:['miner','gardener','fisher','lumber'].includes(id)}));
const BALLS=[
 ['Normal','Normal Ball','Essência Normal'],['Fogo','Fire Ball','Essência Fogo'],['Água','Water Ball','Essência Água'],
 ['Planta','Grass Ball','Essência Planta'],['Elétrico','Electric Ball','Essência Elétrica'],['Gelo','Ice Ball','Essência Gelo'],
 ['Lutador','Fighting Ball','Essência Lutador'],['Veneno','Poison Ball','Essência Veneno'],
 ['Terra','Ground Ball','Essência Terra'],['Voador','Flying Ball','Essência Voador'],
 ['Psíquico','Psychic Ball','Essência Psíquica'],['Inseto','Bug Ball','Essência Inseto'],['Pedra','Rock Ball','Essência Pedra'],
 ['Fantasma','Ghost Ball','Essência Fantasma'],['Dragão','Dragon Ball','Essência Dragão'],
 ['Noturno','Dark Ball','Essência Sombria'],['Metal','Steel Ball','Essência Metal'],['Fada','Fairy Ball','Essência Fada']
];
const translate={normal:'normal',ground:'terra',rock:'pedra',grass:'planta',fairy:'fada',water:'agua',fire:'fogo',electric:'eletrico',ice:'gelo',fighting:'lutador',poison:'veneno',flying:'voador',psychic:'psiquico',bug:'inseto',ghost:'fantasma',dragon:'dragao',dark:'noturno',steel:'metal'};
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]/g,'');
const key=v=>translate[norm(v)]||norm(v);
const p=()=>{try{return typeof P!=='undefined'?P:W.P||{}}catch(_){return W.P||{}}};
const count=v=>Math.max(0,Math.floor(Number(v)||0));
const find=id=>JOBS.find(j=>j.id===id);
const artUrl=j=>j.starter||['alchemist','treasureHunter','looter'].includes(j.id)?'assets/hobbies/'+j.art+'.svg':'assets/professions/'+j.art+'.webp';
let selected=null;
const root=()=>D.getElementById('psy-hobbies');
function inventory(){const u=p();return u.inventory||(u.inventory={})}
function save(){try{W.autoSave?.();W.updateHUD?.()}catch(_){}}
function state(){
 const u=p();u.meta=u.meta||{};const h=u.meta.auxHobbiesV1||(u.meta.auxHobbiesV1={});
 for(const j of JOBS){
  const x=h[j.id]||(h[j.id]={level:0,xp:0});
  x.level=count(x.level);x.xp=count(x.xp);x.base=x.base||{};
  }
 for(const id of ['treasureHunter','looter']){
  const remote=u.meta.treasureHuntV1?.hobbies?.[id];
  if(remote){h[id].level=count(remote.level);h[id].xp=count(remote.xp);h[id].base=h[id].base||{}}
 }
 for(const j of JOBS){
  const x=h[j.id];
  if(!['treasureHunter','looter'].includes(j.id)&&!x.careerMigrated&&u.meta.professionsV1?.jobs?.[j.id]){
   const prev=u.meta.professionsV1.jobs[j.id];x.level=Math.max(x.level,count(prev.level));x.xp=Math.max(x.xp,count(prev.xp));x.careerMigrated=true;
  }
 }
 return h;
}
function typesFor(id){
 const raw=W.psyHobbyTypesForId?.(Number(id))||W.TYPE_BY_ID_ALL?.[Number(id)]||'';
 return (Array.isArray(raw)?raw:String(raw).split(/[\/,|]+/)).map(key).filter(Boolean);
}
function kills(type){
 const u=p(),k=key(type),stats=u.meta?.hobbyTypeKillsV2||{},old=u.meta?.typeKills||{};
 let total=count(stats[k]);for(const [name,n]of Object.entries(old))if(key(name)===k)total=Math.max(total,count(n));return total;
}
function defeated(types){return types.reduce((a,t)=>a+kills(t),0)}
function captured(types){
 const target=new Set(types.map(key));let total=0;
 for(const [id,owned]of Object.entries(p().meta?.caughtDex||{}))if(owned&&typesFor(id).some(t=>target.has(t)))total++;
 return total;
}
function unlockProgress(j){return {defeats:defeated(j.types),caught:captured(j.types),
 ready:j.starter?defeated(j.types)>=10&&captured(j.types)>=5:!!p().gymProgress?.includes('kanto_brock')}}
function unlock(id){
 if(['treasureHunter','looter'].includes(id)&&W.PsyTreasureHuntV1)return W.PsyTreasureHuntV1.unlock(id);
 const j=find(id),x=state()[id];if(!j||!x)return false;if(x.level>0)return true;
 if(!unlockProgress(j).ready){W.notif?.('Conclua a quest de desbloqueio.',2500);return false}
 x.level=1;x.xp=0;
 if(id==='engineer'&&BALLS[1])x.base[key(BALLS[1][0])]=kills(BALLS[1][0]);
 for(const t of j.types)x.base[key(t)]=kills(t);
 save();if(root()?.classList.contains('show'))render();return true;
}
const xpNeed=(x,id='')=>['treasureHunter','looter'].includes(id)?Math.ceil(100*Math.pow(Math.max(1,x.level),1.55)):100*Math.max(1,x.level);
function levelRequirements(id){
 if(['treasureHunter','looter'].includes(id)&&W.PsyTreasureHuntV1)return W.PsyTreasureHuntV1.levelRequirements(id);
 const j=find(id),x=state()[id];if(!j||!x?.level||x.level>=100)return {ready:false,max:true};
 if(id==='engineer'){
  const nextIndex=x.level<BALLS.length?x.level:(x.level-BALLS.length)%BALLS.length,type=BALLS[nextIndex]?.[0]||'Normal',ball=x.level<BALLS.length?BALLS[x.level]:null;
  const materials=W.PsyBattleLootV1?.forType?.(type)||{common:'Rubber Ball',uncommon:'Giant Piece Of Fur',stone:'Heart Stone'};
  const advanced=Math.max(0,x.level-BALLS.length),defeatNeed=100+advanced*10,captureNeed=5+Math.floor(advanced/6);
  const need=Math.min(500,25+advanced*5),uncommonNeed=Math.min(100,10+advanced*2),stoneNeed=1+Math.floor(advanced/5);
  const t=key(type),won=Math.max(0,kills(type)-count(x.base[t])),caught=captured([type]);
  const available=count(inventory()[materials.common]),uncommonAvailable=count(inventory()[materials.uncommon]),stoneAvailable=count(inventory()[materials.stone]);
  return {material:materials.common,need,available,uncommonMaterial:materials.uncommon,uncommonNeed,uncommonAvailable,stoneMaterial:materials.stone,stoneNeed,stoneAvailable,
   defeats:won,defeatNeed,captured:caught,captureNeed,xp:x.xp,xpRequired:xpNeed(x,id),ball:ball?.[1],type,
   ready:available>=need&&uncommonAvailable>=uncommonNeed&&stoneAvailable>=stoneNeed&&x.xp>=xpNeed(x,id)&&won>=defeatNeed&&caught>=captureNeed};
 }
 const ball=null;
 const levelMats={miner:'Essência Terra',gardener:'Essência Planta',fisher:'Essência Água',lumber:'Essência Inseto'};
 const material=ball?ball[2]:(levelMats[id]||j.material),need=ball?100:Math.max(10,10*x.level);
 const t=ball?ball[0]:j.types[0],won=Math.max(0,kills(t)-count(x.base[key(t)])),caught=captured([t]),available=count(inventory()[material]);
 return {material,need,available,defeats:won,captured:caught,xp:x.xp,xpRequired:xpNeed(x,id),
  ball:ball?.[1],type:t,ready:available>=need&&x.xp>=xpNeed(x,id)&&(id!=='engineer'||won>=100&&caught>=5)};
}
function levelUp(id){
 if(['treasureHunter','looter'].includes(id)&&W.PsyTreasureHuntV1)return W.PsyTreasureHuntV1.levelUp(id);
 const j=find(id),x=state()[id],req=levelRequirements(id);if(!j||!x||!req.ready)return false;
 const inv=inventory();
 if(id==='engineer'){
  const costs=[[req.material,req.need],[req.uncommonMaterial,req.uncommonNeed],[req.stoneMaterial,req.stoneNeed]];
  if(costs.some(([name,amount])=>count(inv[name])<amount))return false;
  for(const [name,amount]of costs)inv[name]-=amount;
 }else{if(count(inv[req.material])<req.need)return false;inv[req.material]-=req.need;}
 x.xp-=xpNeed(x,id);x.level++;
 if(id==='engineer')x.base[key(req.type)]=kills(req.type);
 else for(const t of j.types)x.base[key(t)]=kills(t);
 save();if(root()?.classList.contains('show'))render();W.notif?.('Novo nível em '+j.name+'!',2500);return true;
}
function addXP(id,amount){const x=state()[id];if(!x?.level)return false;x.xp+=Math.min(1000,count(amount));save();return true}
function recordKill(id){const u=p();u.meta=u.meta||{};const h=u.meta.hobbyTypeKillsV2||(u.meta.hobbyTypeKillsV2={});for(const t of new Set(typesFor(id)))h[t]=count(h[t])+1}
function exchangePlan(id,ballIndex){
 const j=find(id),x=state()[id];if(!j||!x?.level)return null;
 if(id==='engineer'){const i=Number(ballIndex);if(!Number.isInteger(i)||i<0||i>=x.level||i>=BALLS.length)return null;
  const b=BALLS[i];return {out:b[1],inputs:{[b[2]]:2}};
 }
 if(id==='gardener')return {out:'Vaso Floral',inputs:{'Flor do Campo':3,'Essência Planta':2,'Essência Fada':2}};
 if(id==='alchemist')return {out:'Tônico de Ataque',inputs:{'Essência Fogo':5,'Essência Planta':3}};
 if(id==='herbalist')return {out:'Bálsamo Restaurador',inputs:{'Essência Planta':4}};
 return {out:j.product,inputs:{[j.material]:Math.max(2,Math.ceil(x.level/3))}};
}
function exchange(id,index){
 const plan=exchangePlan(id,index),inv=inventory();if(!plan)return false;
 if(Object.entries(plan.inputs).some(([a,q])=>count(inv[a])<q)){W.notif?.('Faltam materiais para a troca.',2200);return false}
 for(const [a,q]of Object.entries(plan.inputs))inv[a]-=q;
 inv[plan.out]=count(inv[plan.out])+1;
 addXP(id,id==='engineer'?10:12);save();if(root()?.classList.contains('show'))render();return true;
}
function healMultiplier(){return 1+Math.min(.5,count(state().herbalist?.level)*.015)}
function bonus(stat){
 const k=({capture:'cap',damage:'atk',health:'hp'})[stat]||stat;
 let value=0;for(const j of JOBS)if(j.stat===k)value+=count(state()[j.id].level)*j.per;
 for(const v of Object.values(p().meta?.hobbyBuffsV2||{}))if(v.kind===k&&v.until>Date.now())value+=count(v.amount);
 return Math.min(100,value+(W.PsyHobbyMastery?.statBonus?.(k)||0));
}
function useConsumable(name){
 const config={'Tônico de Ataque':{kind:'atk',amount:12},'Bálsamo Restaurador':{kind:'hp',amount:10}};
 const conf=config[name],inv=inventory();if(!conf||count(inv[name])<1)return false;
 inv[name]--;p().meta.hobbyBuffsV2=p().meta.hobbyBuffsV2||{};
 p().meta.hobbyBuffsV2[name]={...conf,until:Date.now()+15*60*1000};
 save();if(root()?.classList.contains('show'))render();return true;
}
function field(){const u=p();u.meta=u.meta||{};const s=u.meta.hobbyGatherV2||(u.meta.hobbyGatherV2={nodes:{},decor:[]});s.nodes=s.nodes||{};s.decor=s.decor||[];return s}
const FIELD={
 'route-2':[['f1','gardener',434,381,'Flor do Campo'],['f2','gardener',430,239,'Flor do Campo'],['f3','gardener',691,183,'Flor do Campo'],['t1','lumber',460,292,'Madeira Bruta'],['m1','miner',730,378,'Minério Bruto'],['f4','gardener',270,420,'Flor da Trilha'],['t2','lumber',700,280,'Madeira Bruta']],
 'viridian-forest':[['f1','gardener',185,260,'Flor da Clareira'],['f2','gardener',724,305,'Flor do Bosque'],['f3','gardener',642,218,'Flor Silvestre'],['t1','lumber',690,365,'Madeira Caída'],['m1','miner',407,320,'Minério Bruto'],['f4','gardener',450,465,'Flor de Musgo'],['m2','miner',280,320,'Minério Bruto']],
 'route-3':[['f1','gardener',180,420,'Flor da Encosta'],['f2','gardener',280,245,'Flor do Mirante'],['f3','gardener',560,320,'Flor da Clareira'],['t1','lumber',520,300,'Madeira de Trilha'],['m1','miner',714,350,'Minério da Serra'],['f4','gardener',210,326,'Flor do Vale'],['t2','lumber',770,420,'Madeira Bruta']],
 'route-4':[['f1','gardener',266,350,'Flor do Campo'],['f2','gardener',154,196,'Flor do Campo'],['f3','gardener',770,182,'Flor do Campo'],['t1','lumber',518,182,'Madeira Bruta'],['m1','miner',574,238,'Minério Bruto'],['f4','gardener',392,392,'Flor da Trilha'],['t2','lumber',350,434,'Madeira Bruta']],
 'mt-moon':[['m1','miner',462,462,'Minério Bruto'],['m2','miner',574,266,'Minério Bruto'],['m3','miner',118,392,'Veio de Parede'],['m4','miner',770,434,'Veio de Parede'],['f1','gardener',84,182,'Flor de Caverna'],['f2','gardener',812,154,'Flor de Caverna'],['f3','gardener',84,658,'Flor de Musgo'],['f4','gardener',812,686,'Flor de Musgo'],['d1','treasureHunter',490,378,'Solo rachado'],['d2','treasureHunter',294,350,'Solo rachado'],['d3','treasureHunter',266,154,'Solo rachado']],
 'route-1':[
  ['f1','gardener',276,301,'Flor do Campo'],['f2','gardener',411,296,'Flor do Campo'],['f3','gardener',605,250,'Flor do Campo'],
  ['t1','lumber',521,280,'Madeira Bruta'],['o1','miner',335,258,'Minério Bruto'],
  ['d1','treasureHunter',285,325,'Solo rachado',1],['d2','treasureHunter',706,275,'Solo rachado',5,'trail']],
 'route-cave':[
  ['o1','miner',230,370,'Minério Bruto'],['o2','miner',664,376,'Minério Bruto'],['o3','miner',820,380,'Veio de Cristal'],
  ['d1','treasureHunter',310,466,'Solo rachado'],['d2','treasureHunter',586,475,'Solo rachado'],
  ['d3','treasureHunter',450,536,'Solo rachado'],
  ['f1','gardener',78,240,'Flor de Cristal'],['f2','gardener',822,240,'Flor de Cristal'],['f3','gardener',78,520,'Flor de Cristal']
 ],
 'kanto-hunt-rift':[
  ['o1','miner',92,282,'Veio de Cristal'],['o2','miner',172,440,'Minério Bruto'],['o3','miner',96,468,'Veio Luminoso'],['o4','miner',220,350,'Solo para escavação'],['o5','miner',116,190,'Minério Bruto'],
  ['t1','lumber',292,230,'Madeira Bruta'],['t2','lumber',300,420,'Tronco Caído'],['t3','lumber',690,444,'Madeira Bruta'],
  ['f1','gardener',215,96,'Flor de Caverna'],['f2','gardener',680,92,'Flor Encantada'],['f3','gardener',64,520,'Flor de Cristal'],['f4','gardener',830,500,'Flor Silvestre'],
  ['d1','treasureHunter',560,150,'Solo rachado'],['d2','treasureHunter',420,370,'Solo rachado'],['d3','treasureHunter',790,470,'Solo rachado']
 ]
};
function fieldNodes(scene){
 if(FIELD[scene])return FIELD[scene];
 const place=W.PsyKantoJourneyV1?.places?.find?.(value=>value.id===scene);
 if(place?.kind==='route')return FIELD['route-3'];
 if(place?.kind==='dungeon')return FIELD['route-cave'];
 return [];
}
const SPOT_REWARDS={
 miner:{common:'Minério Bruto',rare:'Minério Luminoso',epic:'Cristal Arcano',legend:'Cristal Lendário'},
 treasureHunter:{common:'Fragmento Antigo',rare:'Baú Simples',epic:'Baú Ornamentado',legend:'Baú Relíquia'},
 gardener:{common:'Flor do Campo',rare:'Flor Encantada',epic:'Flor Astral',legend:'Flor Lendária'},
 fisher:{common:'Peixe de Rio',rare:'Carpa Prateada',epic:'Peixe Cristalino',legend:'Peixe Dourado'},
 lumber:{common:'Madeira Bruta',rare:'Madeira Encantada',epic:'Tronco Rúnico',legend:'Madeira Celestial'}
};
const spotQualityCache=new Map();
function masteryEffect(id,effect){return Math.max(0,count(W.PsyHobbyMastery?.effect?.(id,effect)||0))}
function requiredHits(id){return Math.max(1,5-masteryEffect(id,'hits'))}
function respawnDelay(id,scene){if(scene==='kanto-hunt-rift')return 3500+Math.random()*2000;const base=(3+Math.random()*5)*60000,reduce=Math.min(.5,masteryEffect(id,'respawn')*.1);return Math.max(60000,base*(1-reduce))}
function stableSpotRarity(scene,id,kind,record){
 const chances=W.PsyHobbyMastery?.chances?.(kind)||{common:100,rare:0,epic:0,legend:0};
 const level=state()[kind]?.level||0,rankRare=masteryEffect(kind,'rare'),rankEpic=masteryEffect(kind,'epic'),rankLegend=masteryEffect(kind,'legend'),respawn=count(record?.respawnAt);
 let sceneCache=spotQualityCache.get(scene);if(!sceneCache){sceneCache=new Map();spotQualityCache.set(scene,sceneCache)}
 const cached=sceneCache.get(id);if(cached&&cached.respawn===respawn&&cached.level===level&&cached.rare===rankRare&&cached.epic===rankEpic&&cached.legend===rankLegend)return cached.value;
 const seed=scene+':'+id+':'+respawn+':'+level+':'+rankRare+':'+rankEpic+':'+rankLegend;
 let h=2166136261;for(let i=0;i<seed.length;i++){h^=seed.charCodeAt(i);h=Math.imul(h,16777619)}
 const roll=(h>>>0)/4294967296*100;
 const value=roll<chances.legend?'legend':roll<chances.legend+chances.epic?'epic':roll<chances.legend+chances.epic+chances.rare?'rare':'common';
 sceneCache.set(id,{respawn,level,rare:rankRare,epic:rankEpic,legend:rankLegend,value});return value;
}
function rewardFor(id,rarity='common'){
 const item=SPOT_REWARDS[id]?.[rarity]||SPOT_REWARDS[id]?.common||find(id)?.material||'Recurso';
 const extraChance=Math.min(.2,masteryEffect(id,'quantity')*.04),quantity=1+(extraChance&&Math.random()<extraChance?1:0);
 return {item,quantity,rarity};
}
function rollReward(id){
 const chances=W.PsyHobbyMastery?.chances?.(id)||{common:100,rare:0,epic:0,legend:0},roll=Math.random()*100;
 let rarity='common';if(roll<chances.legend)rarity='legend';else if(roll<chances.legend+chances.epic)rarity='epic';else if(roll<chances.legend+chances.epic+chances.rare)rarity='rare';
 return rewardFor(id,rarity);
}
function visibleNodes(scene){
 const now=Date.now(),nodes=field().nodes;
 return fieldNodes(scene).filter(([id,kind,,,,minimum=1,skill])=>
  (kind!=='treasureHunter'||W.PsyTreasureHuntV1?.isAvailable?.()!==false&&count(state()[kind]?.level)>=minimum&&(!skill||count(W.PsyTreasureHuntV1?.hobbyState?.(kind)?.skills?.[skill])>0))&&count(nodes[scene+':'+id]?.respawnAt)<=now)
 .map(([id,kind,x,y,item])=>{const record=nodes[scene+':'+id]||{};return {id,kind,x,y,item,hits:count(record.hits),totalHits:requiredHits(kind),rarity:stableSpotRarity(scene,id,kind,record)}});
}
function nearby(scene,pos,radius=65){
 let found=null,dist=radius;for(const node of visibleNodes(scene)){const d=Math.hypot(pos.x-node.x,pos.y-node.y);if(d<dist){found=node;dist=d}}return found;
}
function collect(scene,id,actor=null){
 const node=visibleNodes(scene).find(v=>v.id===id);if(!node)return false;
 if(!state()[node.kind]?.level){W.notif?.('Primeiro desbloqueie '+find(node.kind).name+' em Hobbies.',2500);return false}
 if(node.kind==='treasureHunter')return !!W.PsyTreasureHuntV1?.hit?.(scene,node,actor);
 const f=field(),record=f.nodes[scene+':'+id]||{},need=requiredHits(node.kind),hit=node.kind==='miner'||node.kind==='lumber'?Math.min(need,count(record.hits)+1):need;
 if(hit<need){f.nodes[scene+':'+id]={hits:hit,respawnAt:0};W.PsyHobbiesVFX?.onSpotHit?.({scene,node,hit,total:need,completed:false,actor});save();W.notif?.('Progresso de coleta: '+hit+'/'+need,1200);return true}
 f.nodes[scene+':'+id]={hits:0,respawnAt:Date.now()+respawnDelay(node.kind,scene)};
 const reward=rewardFor(node.kind,node.rarity),inv=inventory();inv[reward.item]=count(inv[reward.item])+reward.quantity;addXP(node.kind,16);
 const gathered=p().meta.hobbyGatherTotalsV1||(p().meta.hobbyGatherTotalsV1={});gathered[node.kind]=count(gathered[node.kind])+1;
 W.psyHobbyGrantFieldXp?.(18,8);
 W.PsyHobbiesVFX?.onSpotHit?.({scene,node:{...node,item:reward.item,rarity:reward.rarity},hit:need,total:need,completed:true,actor});save();W.notif?.(reward.item+(reward.quantity>1?' ×'+reward.quantity:'')+' coletado! +XP para Hobby, Pokémon e Treinador.',2500);return true;
}
function interact(scene,id,actor={}){
 const node=visibleNodes(scene).find(v=>v.id===id);if(!node)return false;
 if(!state()[node.kind]?.level||!Number.isFinite(actor.x)||!Number.isFinite(actor.y))return collect(scene,id,actor);
 const start=W.PsyHobbiesVFX?.beginAction;
 if(typeof start!=='function')return collect(scene,id,actor);
 if(W.PsyHobbiesVFX?.isBusy?.(scene))return true;
 const started=start({scene,node,actor,onImpact:()=>collect(scene,id,actor)});
 return started?true:collect(scene,id,actor);
}
function drawField(c,scene){
 for(const a of visibleNodes(scene)){
  c.save();c.translate(a.x,a.y);
  c.fillStyle=a.kind==='miner'?'#79def5':a.kind==='gardener'?'#fface2':'#ad784a';c.strokeStyle='#fff1c7';c.lineWidth=2;
  c.beginPath();
  if(a.kind==='miner'){c.moveTo(-16,7);c.lineTo(-11,-16);c.lineTo(1,-30);c.lineTo(17,-2);c.lineTo(12,9);c.closePath()}
  else if(a.kind==='lumber'){c.rect(-12,-28,24,35)}
  else{for(let i=0;i<6;i++){const an=i*Math.PI/3;c.moveTo(0,-10);c.ellipse(Math.sin(an)*11,Math.cos(an)*11-10,7,10,an,0,Math.PI*2)}}
  c.fill();c.stroke();c.fillStyle='#09192de8';c.strokeStyle='#b9ede6';c.lineWidth=1;
  c.beginPath();c.roundRect(-17,12,34,15,5);c.fill();c.stroke();
  c.fillStyle='#fff';c.font='bold 10px system-ui';c.textAlign='center';c.fillText((a.kind==='miner'||a.kind==='lumber')?(a.hits+'/'+a.totalHits):'✦',0,23);c.restore();
 }
}
function decorate(name){
 if(count(inventory()[name])<1)return false;
 field().placing=name;close();W.notif?.('Entre na sua casa e toque no lugar para posicionar '+name+'.',3200);return true;
}
function place(room,x,y,bounds){
 const f=field();if(!['home','house-east','house-west'].includes(room)||!f.placing||count(inventory()[f.placing])<1)return false;
 f.decor.push({room,id:f.placing,x:Math.max(25,Math.min(bounds.w-25,x)),y:Math.max(170,Math.min(bounds.h-30,y))});
 inventory()[f.placing]--;f.placing=null;save();return true;
}
function decorAt(room,x,y){const decor=field().decor;for(let i=decor.length-1;i>=0;i--)if(decor[i].room===room&&Math.hypot(decor[i].x-x,decor[i].y-y)<30)return i;return -1}
function moveDecor(i,x,y,b,commit=true){const d=field().decor[i];if(!d)return false;d.x=Math.max(25,Math.min(b.w-25,x));d.y=Math.max(170,Math.min(b.h-30,y));if(commit)save();return true}
function drawDecor(c,room){
 for(const a of field().decor.filter(v=>v.room===room)){
  c.save();c.translate(a.x,a.y);
  if(a.id==='Tábuas de Carvalho'){
    c.fillStyle='#6e452b';c.strokeStyle='#cfa476';c.lineWidth=2;
    c.fillRect(-20,-10,40,10);c.strokeRect(-20,-10,40,10);
    c.fillRect(-16,0,6,18);c.fillRect(10,0,6,18);
    c.fillStyle='#a77544';c.fillRect(-22,-15,44,7);c.strokeRect(-22,-15,44,7);
  }else{
    c.fillStyle='#517558';c.fillRect(-10,-6,20,15);
    for(let i=0;i<6;i++){const t=i*Math.PI/3;c.fillStyle='#efa6d2';c.beginPath();c.ellipse(Math.sin(t)*10,-19+Math.cos(t)*10,7,5,t,0,Math.PI*2);c.fill()}
    c.fillStyle='#ffde90';c.beginPath();c.arc(0,-19,5,0,Math.PI*2);c.fill();
  }
  c.restore();
 }
}
let overlay;
function button(text,click,disabled){const b=D.createElement('button');b.type='button';b.textContent=text;b.disabled=!!disabled;if(click)b.onclick=click;return b}
function para(parent,text){const e=D.createElement('p');e.textContent=text;parent.appendChild(e)}

/* Fishing runs on frame delta rather than frame count; holding and tapping work on touch. */
const WATER={
 'route-1':[[132,431,95],[96,350,90]],
 'viridian':[[615,655,110],[470,550,70]],
 'pallet':[[530,630,65]],
 'kanto-hunt-rift':[[790,275,95],[738,360,65]]
};
function canFish(scene,pos,canvas){
 const zones=WATER[scene]||[];
 if(zones.some(([x,y,r])=>Math.hypot(x-pos.x,y-pos.y)<=r))return true;
 if(!canvas?.getContext)return false;
 const cx=canvas.getContext('2d',{willReadFrequently:true});let water=0;
 for(const r of [35,48,62])for(let i=0;i<12;i++){
  const a=i*Math.PI/6,x=Math.round(pos.x+Math.cos(a)*r),y=Math.round(pos.y+Math.sin(a)*r);
  if(x<1||y<1||x>=canvas.width||y>=canvas.height)continue;
  try{const p=cx.getImageData(x,y,1,1).data;if(p[2]>120&&p[2]>p[0]*1.28&&p[1]>55&&p[2]>p[1]*1.12)water++}catch(_){return false}
 }
 return water>=5;
}
let fishingRun=null;
function fishOverlay(){
 let el=D.getElementById('psy-hobby-fishing');if(el)return el;
 el=D.createElement('section');el.id='psy-hobby-fishing';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');
 el.innerHTML='<div class="hf-panel"><header><div><small>PSYWORLD · PESCADOR</small><h2>DESAFIO DE PESCA</h2></div><button type="button" data-fish-close>×</button></header><p>Mantenha o indicador na faixa verde. Se permanecer 3 segundos no vermelho, a linha se rompe.</p><div class="hf-meter"><div class="hf-green"></div><div class="hf-marker" data-fish-marker></div></div><div class="hf-stats"><span data-fish-status>Preparando a linha...</span><b data-fish-danger>VERMELHO 0,0 / 3,0 s</b></div><div class="hf-progress"><i data-fish-progress></i></div><button type="button" class="hf-reel" data-fish-reel>SEGURAR / TOCAR PARA PUXAR</button></div>';
 D.body.appendChild(el);
 const reel=el.querySelector('[data-fish-reel]');reel.addEventListener('pointerdown',e=>{if(!fishingRun)return;e.preventDefault();reel.setPointerCapture?.(e.pointerId);fishingRun.reel=true});
 const release=e=>{if(fishingRun){fishingRun.reel=false;fishingRun.meter=Math.min(1,fishingRun.meter+.045)}};reel.addEventListener('pointerup',release);reel.addEventListener('pointercancel',release);reel.addEventListener('lostpointercapture',release);
 el.querySelector('[data-fish-close]').onclick=()=>stopFishing(false);
 return el;
}
function stopFishing(success,options={}){
 const run=fishingRun;if(!run)return;fishingRun=null;W.cancelAnimationFrame?.(run.raf);
 W.PsyHobbiesVFX?.finishFishing?.(run.scene,!!success);
 const el=D.getElementById('psy-hobby-fishing');el?.classList.remove('show');W.PsyKantoWorldV2?.setStoryLock?.(false);
 if(!success){if(!options.silent)W.notif?.('A linha se rompeu, o peixe fugiu.',2600);return}
 const reward=rollReward('fisher'),inv=inventory();inv[reward.item]=count(inv[reward.item])+reward.quantity;addXP('fisher',25);W.psyHobbyGrantFieldXp?.(25,12);
 const gathered=p().meta.hobbyGatherTotalsV1||(p().meta.hobbyGatherTotalsV1={});gathered.fisher=count(gathered.fisher)+1;
 save();W.notif?.('Pesca concluída! +'+reward.quantity+' '+reward.item+' e XP para treinador, Pokémon e Hobby.',3400);
}
function startFishing(scene,actor=null){
 if(!state().fisher?.level){W.notif?.('Desbloqueie o Hobby Pescador para pescar.',2600);return false}
 if(fishingRun)return false;
 const el=fishOverlay();W.PsyKantoWorldV2?.setStoryLock?.(true);fishingRun={scene,actor,reel:false,level:count(state().fisher.level),meter:.46,progress:0,red:0,at:0,raf:0};
 W.PsyHobbiesVFX?.startFishing?.(scene,actor);
 el.classList.add('show');
 const step=now=>{
  const f=fishingRun;if(!f)return;
  const dt=Math.min(.08,Math.max(0,(now-(f.at||now))/1000));f.at=now;
  f.meter=Math.max(0,Math.min(1,f.meter+(f.reel?.38:-.25)*dt+Math.sin(now*.0019)*.035*dt));
  const tension=Math.min(5,masteryEffect('fisher','tension'))*.02;
  const green=f.meter>=.34-tension&&f.meter<=.68+tension,red=f.meter<.18||f.meter>.82;
  f.red=red?f.red+dt:0; // fail after three continuous seconds in red
  f.progress=Math.max(0,Math.min(1,f.progress+(green?.19+f.level*.002:-.055)*dt));
  W.PsyHobbiesVFX?.updateFishing?.(scene,{meter:f.meter,green,red,reeling:f.reel,progress:f.progress});
  el.querySelector('[data-fish-marker]').style.left=(f.meter*100)+'%';
  el.querySelector('[data-fish-progress]').style.width=(f.progress*100)+'%';
  el.querySelector('[data-fish-danger]').textContent='VERMELHO '+f.red.toFixed(1)+' / 3,0 s';
  el.querySelector('[data-fish-status]').textContent=green?'LINHA ESTÁVEL · continue!':red?'PERIGO · reajuste a linha':'AJUSTE A TENSÃO';
  if(f.red>=3)return stopFishing(false);
  if(f.progress>=1)return stopFishing(true);
  f.raf=W.requestAnimationFrame(step);
 };
 fishingRun.raf=W.requestAnimationFrame(step);return true;
}

function ensure(){
 if(root())return root();
 const el=D.createElement('section');el.id='psy-hobbies';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');
 el.innerHTML='<div class="ph-shell"><header class="ph-header"><div><small>PSYWORLD · ATIVIDADES DO TREINADOR</small><h2>HOBBIES</h2><p>Explore Kanto, colete recursos nos spots e evolua cada especialidade.</p></div><button data-hobbies-close type="button" aria-label="Fechar">×</button></header><div class="ph-overview" data-hobby-overview aria-live="polite"></div><div class="ph-grid" data-hobbies-grid></div><div data-hobby-details hidden></div></div>';
 D.body.appendChild(el);el.querySelector('[data-hobbies-close]').onclick=close;
 el.addEventListener('click',e=>{if(e.target===el)close()});
 D.addEventListener('keydown',e=>{if(e.key==='Escape'&&el.classList.contains('show')){e.stopImmediatePropagation();if(selected){selected=null;render()}else close()}},true);
 return el;
}
function render(){
 const el=ensure(),grid=el.querySelector('[data-hobbies-grid]'),details=el.querySelector('[data-hobby-details]');grid.replaceChildren();details.replaceChildren();
 grid.hidden=!!selected;details.hidden=!selected;const records=state();
 const overview=el.querySelector('[data-hobby-overview]'),totals=p().meta?.hobbyGatherTotalsV1||{};
 overview.hidden=!!selected;
 overview.innerHTML='<span><b>'+JOBS.filter(j=>records[j.id]?.level>0).length+'</b><small>Hobbies ativos</small></span><span><b>'+Object.values(totals).reduce((n,v)=>n+count(v),0)+'</b><small>Coletas concluídas</small></span><span><b>'+visibleNodes('route-1').length+'</b><small>Spots na Rota 1</small></span>';
 if(!selected){
  for(const j of JOBS){
   const x=records[j.id],card=D.createElement('article');card.className='ph-card';card.style.setProperty('--hobby-accent',({miner:'#80d9f6',gardener:'#fba3dc',fisher:'#73d7fb',lumber:'#d9ac78',engineer:'#f4c578',alchemist:'#c5a0ff',treasureHunter:'#f3bd67',looter:'#cf9cff'})[j.id]||'#98dce0');
   const cover=button('',()=>openDetail(j.id));cover.className='ph-illustration ph-select';cover.setAttribute('aria-label','Abrir '+j.name);
   const img=D.createElement('img');img.src=artUrl(j);img.alt=j.name;img.loading='lazy';cover.appendChild(img);
   const tag=D.createElement('span');tag.className='ph-level';tag.textContent='LV. '+x.level;cover.appendChild(tag);
   const body=D.createElement('div');body.className='ph-card-body';const title=D.createElement('h3');title.textContent=j.name;body.appendChild(title);
   const treasureHint=j.id==='treasureHunter'?'DESBLOQUEIO · Treinador nível 3 + exploração':j.id==='looter'?'DESBLOQUEIO · Encontre um baú':j.starter?'MISSÃO · 10 derrotas + 5 capturas':'DESBLOQUEIO · Primeiro Ginásio';
   para(body,x.level?'BÔNUS ATIVO · +'+(x.level*j.per).toFixed(1)+'% '+j.stat:treasureHint);
   if(['miner','gardener','fisher','lumber'].includes(j.id)){const indicator=D.createElement('small');indicator.className='ph-gather-total';indicator.textContent='✦ '+count(totals[j.id])+' coletas · '+count(inventory()[j.material])+' '+j.material+' na Mochila';body.appendChild(indicator)}
   if(x.level){const track=D.createElement('div');track.className='ph-track';const bar=D.createElement('i');bar.style.width=Math.min(100,Math.round(100*x.xp/Math.max(1,xpNeed(x,j.id))))+'%';track.appendChild(bar);body.appendChild(track)}
   body.appendChild(button('ABRIR HOBBY',()=>openDetail(j.id)));card.append(cover,body);grid.appendChild(card);
  }
  return;
 }
 const j=find(selected),x=records[selected];if(!j){selected=null;render();return}
 details.appendChild(button('← VOLTAR A TODOS OS HOBBIES',()=>{selected=null;render()}));
 const header=D.createElement('div');header.className='ph-detail-head';
 const img=D.createElement('img');img.src=artUrl(j);img.alt=j.name;header.appendChild(img);
 const h=D.createElement('div'),name=D.createElement('h3');name.textContent=j.name+' • Nível '+x.level;h.appendChild(name);
 para(h,'Bônus +'+(x.level*j.per).toFixed(1)+'% '+j.stat+' • XP '+x.xp+'/'+xpNeed(x,j.id));if(['miner','gardener','fisher','lumber'].includes(j.id))para(h,'Coletas concluídas: '+count(totals[j.id])+' • '+count(inventory()[j.material])+' '+j.material+' na Mochila');header.appendChild(h);details.appendChild(header);
 if(['treasureHunter','looter'].includes(j.id)&&W.PsyTreasureHuntV1){W.PsyTreasureHuntV1.renderInto(details,j.id,render);return;}
 W.PsyHobbyMastery?.renderInto?.(details,j.id,render);
 if(!x.level){
  const pr=unlockProgress(j);
  para(details,j.starter?'Derrotas: '+Math.min(pr.defeats,10)+'/10 • Pokédex: '+Math.min(pr.caught,5)+'/5.':'Vença o primeiro Ginásio de Kanto para liberar.');
  details.appendChild(button(pr.ready?'DESBLOQUEAR HOBBY':'QUEST INCOMPLETA',()=>unlock(j.id),!pr.ready));return;
 }
 const req=levelRequirements(j.id),box=D.createElement('section');box.className='ph-upgrade';
 para(box,req.max?'NÍVEL MÁXIMO / TODAS AS BALLS LIBERADAS':'SUBIR DE NÍVEL • Requer XP '+x.xp+'/'+req.xpRequired);
 if(j.id==='engineer'&&req.material){
  para(box,(req.ball?'Próxima Ball: '+req.ball+' • ':'Aprimoramento de Engenheiro • ')+req.defeats+'/'+req.defeatNeed+' vitórias do tipo '+req.type+', '+req.captured+'/'+req.captureNeed+' espécies capturadas.');
  para(box,req.available+'/'+req.need+' '+req.material+' • '+req.uncommonAvailable+'/'+req.uncommonNeed+' '+req.uncommonMaterial+' • '+req.stoneAvailable+'/'+req.stoneNeed+' '+req.stoneMaterial);
 }
 else if(req.material)para(box,req.available+'/'+req.need+' '+req.material);
 box.appendChild(button('SUBIR DE NÍVEL',()=>levelUp(j.id),!req.ready));details.appendChild(box);
 const title=D.createElement('h3');title.textContent='TROCAS EXCLUSIVAS';details.appendChild(title);
 const rows=j.id==='engineer'?BALLS.map((b,i)=>({plan:exchangePlan(j.id,i),label:b[1]+' • Lv.'+(i+1),index:i})):
 [{plan:exchangePlan(j.id),label:j.product}];
 for(const row of rows){
  const div=D.createElement('section');div.className='ph-exchange';
  para(div,row.label);if(row.plan)para(div,Object.entries(row.plan.inputs).map(([k,q])=>q+' '+k+' (possui '+count(inventory()[k])+')').join(' + '));
  div.appendChild(button(j.id==='engineer'?'FABRICAR BALL':'TROCAR MATERIAIS',()=>exchange(j.id,row.index),!row.plan));
  details.appendChild(div);
 }
 if(j.id==='researcher'){
  const all=W.PsyHobbyDungeonTradeCatalog?.()||[];
  for(const v of all){
    if(count(inventory()[v.item])<=0)continue;
    const row=D.createElement('section');row.className='ph-exchange';
    para(row,v.name+' • '+v.qty+' '+v.item+' (possui '+count(inventory()[v.item])+')');
    row.appendChild(button('TROCAR POR '+(v.kind==='shiny'?'SHINY ':'')+v.name,()=>{
      if(v.kind==='shiny')W.craftShiny?.(v.id);else W.craftBoss?.(v.id);
      render();
    },count(inventory()[v.item])<v.qty));
    details.appendChild(row);
  }
}
if(j.id==='gardener'||j.id==='lumber')details.appendChild(button('DECORAR MINHA HOUSE',()=>decorate(j.product),count(inventory()[j.product])<1));
 if(j.id==='alchemist'||j.id==='herbalist')details.appendChild(button('USAR '+j.product,()=>useConsumable(j.product),count(inventory()[j.product])<1));
}
function open(){selected=null;ensure();render();root().classList.add('show');W.PsyKantoWorldV2?.suspendForPanel?.('psy-hobbies')}
function openDetail(id){if(!find(id))return false;selected=id;ensure();render();root().classList.add('show');W.PsyKantoWorldV2?.suspendForPanel?.('psy-hobbies');root().querySelector('.ph-shell').scrollTop=0;return true}
function close(){root()?.classList.remove('show');selected=null}
const previousBuff=W.getTotalBuff;
if(typeof previousBuff==='function')W.getTotalBuff=function(stat){return Number(previousBuff.apply(this,arguments)||0)+bonus(stat)};
if(typeof W.openCraft5==='function')W.openCraft5=()=>openDetail('engineer');
if(typeof W.psyCraftElementBall==='function')W.psyCraftElementBall=()=>openDetail('engineer');
W.PsyHobbies={open,openDetail,close,refresh:render,isOpen:()=>!!root()?.classList.contains('show'),isFishing:()=>!!fishingRun,unlock,levelUp,levelRequirements,exchange,addXP,recordKill,state,definitions:JOBS,ballLadder:BALLS,unlockProgress,healMultiplier,bonus,useConsumable,visibleNodes,nearby,collect,interact,fieldDefinitions:()=>FIELD,rarityForSpot:stableSpotRarity,requiredHits,rollReward,spotEffects:{requiredHits,respawnDelay,rollReward,rewardFor},drawField,place,decorAt,moveDecor,drawDecor,decorate,field,canFish,startFishing,stopFishing,cancelFishing:()=>stopFishing(false,{silent:true})};
})(window,document);
