/* V28 capture wiring guard: keeps the battle BALL action connected to the dedicated selector. */
try{
  if(typeof window.battleAction==='function'){try{battleAction=window.battleAction}catch(e){}}
  console.log(typeof window.tryCaptureBattle==='function'&&typeof window.openBattleBallSelector==='function'?'✅ V28 CAPTURE WIRING OK':'❌ V28 CAPTURE WIRING MISSING');
}catch(e){console.warn('V28 capture guard',e)}

/* ===== V29 HUNTS POKEDEX GATING + CAPTURE LEVEL 1 / EVO POWER ===== */
(function(){
const W=window;
const DEXKEY='psyworld_pokedex_evo_v29';
const DEX=W.PSY29_DEX=W.PSY29_DEX||{parent:{},min:{},children:{},ready:false,loading:false};
/* Immediate fallbacks for lines currently under test; official CSV fills all species. */
Object.assign(DEX.parent,{281:280,282:281,253:252,254:253,256:255,257:256,259:258,260:259});
Object.assign(DEX.min,{281:20,282:30,253:16,254:36,256:16,257:36,259:16,260:36});
function rebuildChildren(){DEX.children={};for(const [c,p] of Object.entries(DEX.parent||{})){if(!p)continue;(DEX.children[p]||(DEX.children[p]=[])).push(+c)}}
function loadCached(){try{const x=JSON.parse(localStorage.getItem(DEXKEY)||'null');if(x?.parent){DEX.parent={...DEX.parent,...x.parent};DEX.min={...DEX.min,...(x.min||{})};DEX.ready=!!x.ready;rebuildChildren()}}catch(e){}}
loadCached();rebuildChildren();
function parseCsv(text){const rows=String(text||'').trim().split(/\r?\n/);const head=rows.shift().split(',');return rows.map(line=>{const v=line.split(','),o={};head.forEach((k,i)=>o[k]=v[i]??'');return o})}
W.psy29LoadDexMeta=async function(){if(DEX.ready||DEX.loading)return DEX;DEX.loading=true;try{
 const [s,e]=await Promise.all([
  fetch('https://raw.githubusercontent.com/PokeAPI/pokeapi/refs/heads/master/data/v2/csv/pokemon_species.csv',{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('species');return r.text()}),
  fetch('https://raw.githubusercontent.com/PokeAPI/pokeapi/refs/heads/master/data/v2/csv/pokemon_evolution.csv',{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('evolution');return r.text()})
 ]);
 for(const r of parseCsv(s)){const id=+r.id,p=+r.evolves_from_species_id;if(id&&p)DEX.parent[id]=p}
 for(const r of parseCsv(e)){const id=+r.evolved_species_id,l=+r.minimum_level;if(id&&l>0){if(!DEX.min[id]||l<DEX.min[id])DEX.min[id]=l}}
 DEX.ready=true;rebuildChildren();try{localStorage.setItem(DEXKEY,JSON.stringify({parent:DEX.parent,min:DEX.min,ready:true}))}catch(_){ }
 try{if(document.getElementById('psy-clean-hunts')?.style.display!=='none')W.openHunts?.()}catch(_){ }
 }catch(err){console.warn('V29 Pokédex meta offline; usando fallback interno.',err)}finally{DEX.loading=false}return DEX};
setTimeout(()=>W.psy29LoadDexMeta?.(),200);
function internalParent(id){try{for(const [from,e] of Object.entries(W.EVOLUTION_MAP||EVOLUTION_MAP||{}))if(+e?.to===+id)return +from}catch(e){}try{for(const [from,opts] of Object.entries(W.SPECIAL_EVOLUTIONS||SPECIAL_EVOLUTIONS||{}))for(const v of Object.values(opts||{}))if(+v?.to===+id)return +from}catch(e){}return 0}
function parentOf(id){return +(DEX.parent[id]||internalParent(id)||0)}
function directReq(id){if(DEX.min[id])return +DEX.min[id];const p=parentOf(id);if(p){try{const e=(W.EVOLUTION_MAP||EVOLUTION_MAP||{})[p];if(+e?.to===+id)return +(e.minLevel||e.lvl||0)}catch(e){}}return 0}
function stageOf(id){id=+id;let s=1,cur=id,seen=new Set();while(cur&&!seen.has(cur)&&s<4){seen.add(cur);const p=parentOf(cur);if(!p)break;s++;cur=p}return Math.min(3,s)}
function hasChild(id){if(DEX.children[id]?.length)return true;try{if((W.EVOLUTION_MAP||EVOLUTION_MAP||{})[id]?.to)return true}catch(e){}try{if(Object.keys((W.SPECIAL_EVOLUTIONS||SPECIAL_EVOLUTIONS||{})[id]||{}).length)return true}catch(e){}return false}
function appearanceMin(id){const st=stageOf(id),req=directReq(id);if(st<=1)return 1;if(st===2)return Math.max(20,req?Math.ceil(req/10)*10:20);return Math.max(40,req?Math.ceil(req/10)*10:40)}
function appearanceMax(id){/* middle forms phase out after the 41-50 bracket; explicit rule requested for Kirlia */return stageOf(id)===2?50:100}
function powerMult(id){const st=stageOf(id),req=directReq(id);if(st===1&&!hasChild(id))return 1.5;if(st===1)return 1;if(req>=50)return 3;if(req>=30)return 2;if(req>=10)return 1.5;if(st>=3)return 2;if(st===2)return 1.5;return 1}
W.psy29DexStage=stageOf;W.psy29WildMin=appearanceMin;W.psy29WildMax=appearanceMax;W.psy29EvolutionPowerMult=powerMult;
W.getEvoStage=stageOf;
/* Evolution multiplier is now authoritative in evoMult; remove old hidden stage multiplier to prevent double-buffing. */
W.getStageMult=function(){return 1};try{getStageMult=W.getStageMult}catch(e){}
try{evoBaseline=function(id){return powerMult(id)}}catch(e){}
function normalizePoke(p){if(!p?.id)return p;p.evoMult=powerMult(p.id);try{W.recalcPoke?.(p)}catch(e){}return p}
W.psy29NormalizeEvolutionPower=normalizePoke;
const oldCreate=W.createCapturedPoke;
W.createCapturedPoke=function(id,rarity,shiny,isPremier,isMega){const p=oldCreate.apply(this,arguments);p.level=1;p.exp=0;p.maxExp=100;normalizePoke(p);p.hp=p.maxHp;return p};try{createCapturedPoke=W.createCapturedPoke}catch(e){}
setTimeout(()=>{try{[...(P?.team||[]),...(P?.box||[])].forEach(normalizePoke);W.renderTeam?.();W.updateHUD?.()}catch(e){}},1200);
/* Hunt eligibility follows Pokédex evolution stage/level. Kirlia: Lv20-50; Gardevoir/Swampert: Lv40+. */
const oldPool=W.psyCleanHuntPool;
W.psyCleanHuntPool=function(region,type,band){const ids=oldPool.call(this,region,type,band)||[],lo=+band*10+1,hi=(+band+1)*10;return ids.filter(id=>appearanceMin(id)<=hi&&appearanceMax(id)>=lo)};
function encounterLevel(id,band){const lo=+band*10+1,hi=(+band+1)*10,min=Math.max(lo,appearanceMin(id));return min>hi?hi:min+Math.floor(Math.random()*(hi-min+1))}
const oldEnter=W.psyCleanEnterHunt;
W.psyCleanEnterHunt=function(region,type,band){
  if(!W.psyCleanRegionUnlocked?.(region))return toast(W.psyCleanRegionLockText?.(region)||'Região bloqueada pelos Ginásios.');
  band=Math.max(0,Math.min(9,Number(band||0)));
  const ids=W.psyCleanHuntPool(region,type,band);
  if(!ids.length)return toast('Sem Pokémon elegíveis nesta faixa.');
  const lv=Number(P.team?.[0]?.level||1),lo=band*10+1,cap=Number(P.levelCap||20);
  if(lv<lo)return toast(`Requer Pokémon ativo Lv.${lo}.`);
  if(lo>cap)return toast(`Esta Hunt está bloqueada pelo Level Cap ${cap}.`);
  P.meta.cleanHunt=P.meta.cleanHunt||{};
  Object.assign(P.meta.cleanHunt,{region,band,type,last:{region,type,band}});
  P.currentHunt=`psy19:${region}:${type}:${band}`;
  try{W.fastEncounter=false;if(typeof fastEncounter!=='undefined')fastEncounter=false}catch(e){}
  try{if(typeof inBattle!=='undefined')inBattle=false}catch(e){}
  W.inBattle=false;
  const bs=document.getElementById('battle-screen');if(bs){bs.style.display='none';bs.classList.remove('active')}
  const hs=document.getElementById('psy-clean-hunts');if(hs)hs.style.display='none';
  try{W.autoSave?.()}catch(e){}
  const id=ids[Math.floor(Math.random()*ids.length)],wl=encounterLevel(id,band);
  const rarity=W.rollRarity?.(W.getTier?.(id))||W.rollRarity?.()||{n:'Comum',mult:1};
  const result=W.startBattle?.({id,name:W.getPokeName?.(id)||`Pokémon ${id}`,level:wl,lvl:wl,type,rarity});
  return result;
};
const oldTrig=W.triggerWild;
W.triggerWild=function(pool){const key=String(pool||P.currentHunt||'');if(!key.startsWith('psy19:'))return oldTrig?.apply(this,arguments);if(((typeof inBattle!=='undefined'&&inBattle)||W.inBattle)||!P.team?.[0])return;const [,region,type,bs]=key.split(':'),band=Math.max(0,Math.min(9,+bs||0)),ids=W.psyCleanHuntPool(region,type,band);if(!ids.length)return toast('A última Hunt não possui Pokémon elegíveis nesta faixa.');const id=ids[Math.floor(Math.random()*ids.length)],lvl=encounterLevel(id,band);P.currentHunt=key;return W.startBattle?.({id,name:W.getPokeName?.(id)||`Pokémon ${id}`,level:lvl,lvl,type,rarity:W.rollRarity?.(W.getTier?.(id))||W.rollRarity?.()})};try{triggerWild=W.triggerWild}catch(e){}
console.log('✅ V35 HUNTS scope fix: gate regional compartilhado sem ReferenceError');
})();


console.log('✅ PSYWORLD V50: economia especial, Eggs, Trainer e Mega balanceados carregados');

setTimeout(()=>{try{
  ensureTrainerData();const active=P.team?.[0],need=active?psySpecialUseReq(active):1;
  if(active&&need>(P.trainerLevel||1)){const j=P.team.findIndex((q,i)=>i>0&&psySpecialUseReq(q)<=(P.trainerLevel||1));if(j>0){const t=P.team[0];P.team[0]=P.team[j];P.team[j]=t;notif(`🔒 ${active.name} ficou bloqueado até Trainer Lv.${need}. Outro Pokémon foi colocado como ativo.`,5000)}}
  autoSave();
}catch(e){console.warn('V50 special gate migration',e)}},3000);
