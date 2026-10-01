(function(W){
 'use strict';
 if(W.PsyIdleBalanceEvolution?.build==='IDLE_BALANCE_EVOLUTION_V2')return;
 const QUALITY=Object.freeze([
  Object.freeze({name:'Lixo',mult:1}),
  Object.freeze({name:'Quase Lixo',mult:1.1}),
  Object.freeze({name:'Nice',mult:1.35}),
  Object.freeze({name:'Belezura',mult:1.5}),
  Object.freeze({name:'Lêndea',mult:1.66}),
  Object.freeze({name:'Bombado',mult:1.83}),
  Object.freeze({name:'Pika das Galáxias',mult:2.02}),
  Object.freeze({name:'DEUS',mult:2.22}),
  Object.freeze({name:'CRIADOR',mult:2.44}),
  Object.freeze({name:'VOID',mult:2.68}),
  Object.freeze({name:'OBLIVION',mult:3})
 ]);
 const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('pt-BR');
 const QUALITY_BY_NAME=new Map(QUALITY.map(item=>[norm(item.name),item]));
 const STONE_ALIASES=Object.freeze({
  'Bug Stone':'Cocoon Stone','Flying Stone':'Feather Stone','Normal Stone':'Heart Stone',
  'Fighting Stone':'Punch Stone','Poison Stone':'Venom Stone','Ground Stone':'Earth Stone',
  'Psychic Stone':'Enigma Stone','Dark Stone':'Darkness Stone','Ghost Stone':'Darkness Stone',
  'Dragon Stone':'Crystal Stone','Fairy Stone':'Heart Stone'
 });
 const REGULAR_EVOLUTION_STONES=Object.freeze([
  'Fire Stone','Water Stone','Leaf Stone','Thunder Stone','Ice Stone','Punch Stone',
  'Venom Stone','Earth Stone','Feather Stone','Enigma Stone','Cocoon Stone','Rock Stone',
  'Crystal Stone','Darkness Stone','Metal Stone','Heart Stone','Moon Stone'
 ]);
 const EVOLUTION_STONES=Object.freeze([...REGULAR_EVOLUTION_STONES,'Shiny Stone']);
 function qualityMultiplier(name,fallback=1){return QUALITY_BY_NAME.get(norm(name))?.mult??(Number.isFinite(Number(fallback))?Number(fallback):1)}
 function withIdleQuality(mon){
  if(!mon||typeof mon!=='object')return mon;
  const source=mon.rarity&&typeof mon.rarity==='object'?mon.rarity:{n:String(mon.rarity||'')};
  const quality=QUALITY_BY_NAME.get(norm(source.n));
  if(!quality)return mon;
  return{...mon,rarity:{...source,mult:quality.mult}};
 }
 function canonicalStone(name,aliases={}){const legacy=aliases&&aliases[name];return legacy||STONE_ALIASES[name]||name}
 function evolutionOptions(id,evolutionMap={},specialEvolutions={},stoneAliases={}){
  const speciesId=Number(id),rows=[],seen=new Set(),add=(stone,entry)=>{
   if(!entry||!Number.isFinite(Number(entry.to)))return;
   const to=Number(entry.to),key=to+':'+stone;
   if(to<1||seen.has(key))return;
   seen.add(key);rows.push({to,stone:canonicalStone(stone||entry.stone||'Evolution Stone',stoneAliases),qtd:Math.max(1,Math.floor(Number(entry.qtd)||10)),minLevel:Math.max(1,Math.floor(Number(entry.minLevel||entry.lvl)||1))});
  };
  add(evolutionMap?.[speciesId]?.stone,evolutionMap?.[speciesId]);
  for(const [stone,entry] of Object.entries(specialEvolutions?.[speciesId]||{}))add(stone,entry);
  return rows.sort((a,b)=>a.to-b.to||a.stone.localeCompare(b.stone));
 }
 function cost(requirement,{shiny=false,shinyStoneCost=10,stoneAliases={}}={}){
  if(shiny)return{stone:'Shiny Stone',quantity:Math.max(10,Math.floor(Number(shinyStoneCost)||10))};
  return{stone:canonicalStone(requirement?.stone||'Evolution Stone',stoneAliases),quantity:Math.max(1,Math.floor(Number(requirement?.qtd)||10))};
 }
 function evolutionShopGoods(){return EVOLUTION_STONES.map(stone=>Object.freeze({stone,price:stone==='Shiny Stone'?1200:150}))}
 function idleEvolutionStoneDropChance(level,{shiny=false,mega=false,boss=false}={}){
  const lv=Math.max(1,Math.min(200,Math.floor(Number(level)||1))),base=Math.min(.04,.01+(lv-1)*.0002),variant=(shiny?1.35:1)*(mega?1.6:1)*(boss?2.5:1);
  return Math.min(.08,base*variant);
 }
 function idleShinyStoneDropChance(level,{shiny=false,mega=false,boss=false}={}){
  const lv=Math.max(1,Math.min(200,Math.floor(Number(level)||1))),base=.0002+(lv-1)*.00001,variant=(shiny?1.5:1)*(mega?1.8:1)*(boss?3:1);
  return Math.min(.005,base*variant);
 }
 function rngUnit(rng){let value=0;try{value=Number(rng?.())}catch(_){}return Math.max(0,Math.min(.999999999,Number.isFinite(value)?value:0))}
 function rollIdleEvolutionDrops(enemy,multiplierOrRng=1,rng=Math.random){
  const multiplier=typeof multiplierOrRng==='function'?1:Math.max(0,Math.min(2,Number(multiplierOrRng)||1)),roller=typeof multiplierOrRng==='function'?multiplierOrRng:rng;
  const flags={shiny:!!enemy?.shiny,mega:!!(enemy?.mega||enemy?.isMega),boss:!!(enemy?.boss||enemy?.isBoss||enemy?.raidBoss)},level=enemy?.level??enemy?.lvl??1,drops=[];
  if(rngUnit(roller)<idleEvolutionStoneDropChance(level,flags)*multiplier)drops.push(REGULAR_EVOLUTION_STONES[Math.floor(rngUnit(roller)*REGULAR_EVOLUTION_STONES.length)]);
  if(rngUnit(roller)<idleShinyStoneDropChance(level,flags)*multiplier)drops.push('Shiny Stone');
  return drops;
 }
 W.PsyIdleBalanceEvolution=Object.freeze({build:'IDLE_BALANCE_EVOLUTION_V2',quality:Object.freeze(QUALITY.slice()),qualityMultiplier,withIdleQuality,canonicalStone,evolutionOptions,cost,evolutionStones:EVOLUTION_STONES,evolutionShopGoods,idleEvolutionStoneDropChance,idleShinyStoneDropChance,rollIdleEvolutionDrops});
})(window);
