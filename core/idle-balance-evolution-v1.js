(function(W){
 'use strict';
 if(W.PsyIdleBalanceEvolution?.build==='IDLE_BALANCE_EVOLUTION_V1')return;
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
 W.PsyIdleBalanceEvolution=Object.freeze({build:'IDLE_BALANCE_EVOLUTION_V1',quality:Object.freeze(QUALITY.slice()),qualityMultiplier,withIdleQuality,canonicalStone,evolutionOptions,cost});
})(window);
