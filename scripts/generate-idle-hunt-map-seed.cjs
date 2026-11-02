const fs=require('node:fs');
const source=fs.readFileSync(new URL('../core/legacy-runtime.js',`file://${__filename}`),'utf8');

function expression(marker){
  const at=source.indexOf(marker);if(at<0)throw new Error(`Missing ${marker}`);
  let start=at+marker.length;while(/\s/.test(source[start]||''))start++;
  const open=source[start];if(open!=='{'&&open!=='[')throw new Error(`Unexpected expression for ${marker}`);
  const close=open==='{'?'}':']';let depth=0,quote='',escape=false;
  for(let i=start;i<source.length;i++){
    const c=source[i];if(quote){if(escape){escape=false;continue}if(c==='\\'){escape=true;continue}if(c===quote)quote='';continue}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue}
    if(c===open)depth++;else if(c===close&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error(`Unclosed expression for ${marker}`);
}
function object(marker){return Function(`return (${expression(marker)})`)()}
function setFrom(text){return new Set([...text.matchAll(/\b\d+\b/g)].map(x=>Number(x[0])))}
function sql(v){return `'${String(v).replaceAll("'","''")}'`}

const names=object('const ALL_POKE_NAMES =');
const evolution=object('const EVOLUTION_MAP =');
const special=object('const SPECIAL_EVOLUTIONS =');
const tierById=object('window.TIER_BY_ID_REAL =');
const pseudo=setFrom(expression('window.PSY_TIER_PSEUDO_SS=new Set('));
const strong=setFrom(expression('window.PSY_TIER_STRONG_S=new Set('));
const legends=setFrom(expression('window.LEGENDARY_IDS = new Set('));
const bosses=setFrom(expression('window.BOSS_BAN_IDS = new Set('));
const stageSource=source.slice(source.lastIndexOf('window.getEvoStage = function(id)'));
const stageMatch=stageSource.match(/const S3=\[([^\]]+)\];\s*const S2=\[([^\]]+)\]/);
if(!stageMatch)throw new Error('Could not read Idle evolution stages');
const stage3=setFrom(`[${stageMatch[1]}]`),stage2=setFrom(`[${stageMatch[2]}]`);
const regions=[
  {key:'KANTO',min:1,max:151,start:1},{key:'JOHTO',min:152,max:251,start:22},
  {key:'HOENN',min:252,max:386,start:33},{key:'SINNOH',min:387,max:493,start:44},
  {key:'UNOVA',min:494,max:649,start:55},{key:'KALOS',min:650,max:721,start:66},
  {key:'ALOLA',min:722,max:809,start:77},{key:'GALAR',min:810,max:905,start:87},
  {key:'PALDEA',min:906,max:1025,start:93}
];
const parent=new Map();
for(const [from,row] of Object.entries(evolution))if(row?.to&&!parent.has(Number(row.to)))parent.set(Number(row.to),Number(from));
for(const [from,choices] of Object.entries(special))for(const row of Object.values(choices||{}))if(row?.to&&!parent.has(Number(row.to)))parent.set(Number(row.to),Number(from));
function stage(id){return stage3.has(id)?3:stage2.has(id)?2:1}
// The starter route's low-level encounters, plus Togepi, are available as
// level-1 individual hunts. Keep this list aligned with idle-realistic-v1.js.
const levelOneHunts=new Set([1,4,7,10,13,16,19,25,29,32,43,46,69,84,102,175]);
function huntLevel(id){
  if(levelOneHunts.has(id))return 1;
  if([6,18,94,144,145,146,150,151].includes(id))return 80;
  let s=stage(id),hasParent=parent.has(id),hasChild=!!evolution[id]?.to||Object.keys(special[id]||{}).length>0;
  if(hasParent&&hasChild)return 40;if(hasParent)return 80;if(hasChild)return 20;return s>=3?80:50;
}
function baseTier(id){
  if(legends.has(id))return 'UR+';if(bosses.has(id))return 'SSS';
  if(id===133||pseudo.has(id))return 'SS';if(strong.has(id))return 'S';
  let s=stage(id),hasParent=parent.has(id),hasChild=!!evolution[id]?.to||Object.keys(special[id]||{}).length>0;
  if(s===1&&hasParent){s=2;let cur=parent.get(id),seen=new Set([id]);while(cur&&!seen.has(cur)){seen.add(cur);const p=parent.get(cur);if(!p)break;s++;cur=p;if(s>=3)break}}
  const nextReq=Number(evolution[id]?.minLevel||Object.values(special[id]||{})[0]?.minLevel||0);
  if(s>=3&&!hasChild)return 'C';
  if(s===2){if(hasChild)return nextReq&&nextReq<=25?'C':'B';return 'B'}
  if(s===1&&hasChild)return nextReq&&nextReq<=10?'E':'D';
  return 'C';
}
function minLevelForTier(tier){return ({E:'Lixo',D:'Quase Lixo',C:'Nice',B:'Belezura',A:'Lêndea',S:'Bombado',SS:'Pika das Galáxias',SSS:'DEUS',UR:'CRIADOR','UR+':'VOID','UR++':'OBLIVION'})[tier]||'Lixo'}
function maxLevelForTier(tier){return ({E:'Quase Lixo',D:'Nice',C:'Belezura',B:'Lêndea',A:'Bombado',S:'Pika das Galáxias',SS:'DEUS',SSS:'CRIADOR',UR:'VOID','UR+':'OBLIVION','UR++':'OBLIVION'})[tier]||'Quase Lixo'}
const values=[];
for(const region of regions){
  for(let id=region.min;id<=region.max;id++){
    if(!names[id])continue;
    const key=region.key==='KANTO'?`kanto-${String(id).padStart(3,'0')}`:`region-${region.key.toLowerCase()}-${id}`;
    let required=levelOneHunts.has(id)?1:Math.max(region.start,huntLevel(id));
    const tier=baseTier(id),low=minLevelForTier(tier);
    values.push(`(${sql(key)},${sql(region.key)},${id},${sql(names[id])},${required},${huntLevel(id)},${sql(tier)},${sql(low)},${sql(maxLevelForTier(tier))})`);
  }
}
if(values.length<1000)throw new Error(`Only ${values.length} hunt routes found`);
process.stdout.write(`insert into public.idle_hunt_maps(map_key,region,species_id,species_name,min_trainer_level,enemy_level,tier,min_quality,max_quality) values\n${values.join(',\n')}\non conflict(map_key) do update set region=excluded.region,species_id=excluded.species_id,species_name=excluded.species_name,min_trainer_level=excluded.min_trainer_level,enemy_level=excluded.enemy_level,tier=excluded.tier,min_quality=excluded.min_quality,max_quality=excluded.max_quality;\n`);
