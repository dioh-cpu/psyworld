(function(W){
 'use strict';
 if(W.PsyIdleGenetics&&W.PsyIdleGenetics.build==='IDLE_GENETICS_V1')return;
 const STATS=['hp','atk','def','spd'];
 const NATURES=[
  {name:'Firme',up:'atk',down:'spd'},{name:'Brava',up:'atk',down:'def'},{name:'Valente',up:'atk',down:'hp'},
  {name:'Robusta',up:'def',down:'atk'},{name:'Serena',up:'def',down:'spd'},{name:'Audaz',up:'def',down:'hp'},
  {name:'Ágil',up:'spd',down:'atk'},{name:'Ligeira',up:'spd',down:'def'},{name:'Ativa',up:'spd',down:'hp'},
  {name:'Vital',up:'hp',down:'atk'},{name:'Calma',up:'hp',down:'def'},{name:'Energética',up:'hp',down:'spd'},
  {name:'Neutra',up:null,down:null}
 ];
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const rngValue=rng=>clamp(Number(rng?.())||0,0,.999999999);
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
 function resolveNature(value,rng=Math.random){
  if(value&&typeof value==='object'){
   const byName=NATURES.find(n=>norm(n.name)===norm(value.name));
   if(byName)return{...byName};
   const up=STATS.includes(value.up)?value.up:null,down=STATS.includes(value.down)?value.down:null;
   if(value.name)return{name:String(value.name).slice(0,32),up,down};
  }else if(typeof value==='string'){
   const found=NATURES.find(n=>norm(n.name)===norm(value));
   if(found)return{...found};
  }
  return{...NATURES[Math.floor(rngValue(rng)*NATURES.length)]};
 }
 function ensure(mon,rng=Math.random){
  if(!mon||typeof mon!=='object')return{ivs:{hp:0,atk:0,def:0,spd:0},nature:{...NATURES[NATURES.length-1]}};
  const existing=mon.ivs&&typeof mon.ivs==='object'?mon.ivs:{};
  const ivs={};
  for(const stat of STATS){
   const raw=existing[stat]??existing[stat.toUpperCase()];
   const n=Number(raw);
   ivs[stat]=Number.isFinite(n)?clamp(Math.floor(n),0,32):Math.floor(rngValue(rng)*33);
  }
  mon.ivs=ivs;
  mon.nature=resolveNature(mon.nature,rng);
  return{ivs:mon.ivs,nature:mon.nature};
 }
 function multiplier(mon,stat){
  if(!STATS.includes(stat))return 1;
  const gene=ensure(mon),iv=Number(gene.ivs[stat])||0,nature=gene.nature||{};
  return(0.9+(iv/32)*0.2)*(nature.up===stat?1.1:nature.down===stat?0.9:1);
 }
 function natureLabel(mon){
  const nature=ensure(mon).nature,up=nature?.up,down=nature?.down;
  const label={hp:'HP',atk:'ATK',def:'DEF',spd:'SPD'};
  if(!up||!down)return String(nature?.name||'Neutra')+' (sem modificador)';
  return String(nature.name)+' (+'+label[up]+' / −'+label[down]+')';
 }
 function rarityIndex(mon,rarities){
  const name=typeof mon?.rarity==='object'?mon.rarity?.n:mon?.rarity;
  const index=(rarities||[]).findIndex(r=>r.n===name);
  return Math.max(0,index);
 }
 function breed(parentA,parentB,rarities,rng=Math.random,minimumQualityIndex=4){
  const a=ensure(parentA,rng),b=ensure(parentB,rng);
  const ivs={};for(const stat of STATS)ivs[stat]=Math.max(a.ivs[stat],b.ivs[stat]);
  const nature=rngValue(rng)<.5?{...a.nature}:{...b.nature};
  const base=Math.max(rarityIndex(parentA,rarities),rarityIndex(parentB,rarities),Math.max(0,Number(minimumQualityIndex)||0));
  const qualityIndex=Math.min(Math.max(0,(rarities||[]).length-1),base+(rngValue(rng)<.25?1:0));
  return{ivs,nature,rarityIndex:qualityIndex,rarity:(rarities||[])[qualityIndex]||null};
 }
 W.PsyIdleGenetics=Object.freeze({build:'IDLE_GENETICS_V1',stats:[...STATS],natures:NATURES.map(n=>({...n})),ensure,multiplier,natureLabel,breed});
})(window);
