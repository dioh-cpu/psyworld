import { randomUUID } from 'node:crypto';
import { requireUser, jsonError, method } from './_lib/supabase.js';

const GENERIC=new Set([
  'progress-sync','vip-buy','pass-buy-xp','pass-premium','achievement-claim','repeat-claim',
  'roulette-heartbeat','roulette-spin','quest-claim','card-win','psy-reset','psy-skill','helper-skill',
  'pack-buy','pack-open','egg-buy','egg-hatch'
]);

function idem(v,prefix='v26'){
  const s=String(v||'').trim()||`${prefix}:${randomUUID()}`;
  if(s.length<8||s.length>180||!/^[A-Za-z0-9:._-]+$/.test(s)){const e=new Error('invalid_idempotency_key');e.status=400;throw e}
  return s;
}
function txt(v,max=80){return String(v??'').trim().slice(0,max)}
function int(v,min,max,def=min){const n=Math.trunc(Number(v));return Number.isFinite(n)?Math.max(min,Math.min(max,n)):def}
function num(v,min,max,def=min){const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):def}
function bool(v){return v===true||v==='true'||v===1||v==='1'}
function obj(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
function safeMap(v,maxKeys=160,maxQty=100000){const out={};for(const [k,val] of Object.entries(obj(v)).slice(0,maxKeys)){const key=txt(k,120);const q=int(val,0,maxQty,0);if(key&&q)out[key]=q}return out}
function safePokemon(p){const x=obj(p);return {id:int(x.id??x.species_id,1,2000,1),name:txt(x.name,80),level:int(x.level,1,10000,1),xp:int(x.exp??x.xp,0,2_000_000_000,0),shiny:bool(x.shiny),isMega:bool(x.isMega),megaForm:txt(x.megaForm,40),tier:txt(x.tier||'E',16),rarity:typeof x.rarity==='object'?{n:txt(x.rarity?.n||'Lixo',32),mult:num(x.rarity?.mult,1,100000,1)}:txt(x.rarity||'Lixo',32),resets:int(x.resets,0,9999,0),psyduckChosen:bool(x.psyduckChosen),maxHp:int(x.maxHp,1,2_000_000_000,1),atk:int(x.atk,0,2_000_000_000,0)}}
function legacyParts(save){
  const root=obj(save),p=obj(root.player||root),meta=obj(p.meta),rw=obj(meta.rewardsV10||meta.rewards||{}),cards=obj(p.cardGame),bp=obj(meta.battlePass),psy=obj(p.psyduck);
  const team=Array.isArray(p.team)?p.team:[],box=Array.isArray(p.box)?p.box:[];
  const dexObj=obj(p.pokedex||p.dex||{});const dex=Object.values(dexObj).filter(Boolean).length||int(meta.dexCaught||meta.dexCount,0,2000,0);
  const gyms=Array.isArray(p.gymsBeaten)?p.gymsBeaten.length:Array.isArray(p.gymBadges)?p.gymBadges.length:int(meta.gyms||meta.gymsBeaten,0,1000,0);
  return {
    trainer_name:txt(p.name||p.nickname||root.name||'Trainer',32),trainer_level:int(p.trainerLevel||root.trainerLevel,1,10000,1),trainer_xp:int(p.trainerXp||root.trainerXp,0,9_000_000_000,0),
    gold:int(p.gold,0,9_000_000_000,0),diamonds:int(p.diamonds,0,9_000_000_000,0),psycoin:int(p.psycoin,0,9_000_000_000,0),inventory:safeMap(p.inventory,2000,1_000_000_000),pokemon:[...team,...box].slice(0,4000).map(safePokemon),
    seed:{progress:{kills:int(meta.kills??rw.kills,0,1_000_000_000,0),captures:int(meta.captures??rw.captures,0,100_000_000,0),egg_hatches:int(meta.eggHatches??rw.eggHatches,0,100_000_000,0),dex,gyms,survivor_best:int(psy.survivorBest||meta.survivorBest,0,10000,0),card_wins:int(rw.cardWins||meta.cardWins,0,1_000_000,0),type_kills:safeMap(rw.typeKills,80,1_000_000_000)},battle_pass:bp,achievement_claims:obj(meta.ach20||meta.achievements),repeat_claims:obj(meta.repeat20||rw.repeatClaims),roulette:{spins:int(rw.rouletteSpins||meta.rouletteSpins,0,10000,0),progress:int(rw.rouletteProgress||meta.rouletteProgress,0,1799,0)},vip_until:int(meta.vipUntil,0,9_000_000_000_000_000,0),card_best:int(cards.best,0,500,0),packs:safeMap(cards.packs,40,1_000_000),eggs:{},psy:{skills:obj(psy.survSkills),helpers:obj(psy.helperTrees)}}
  };
}
async function snapshot(supabase,userId){const {data,error}=await supabase.rpc('psy_v26_snapshot',{p_user:userId});if(error)throw error;return data}
async function bootstrap(user,supabase,save){
  const parts=legacyParts(save);let snap=await snapshot(supabase,user.id);
  if(Number(snap?.player?.authority_version||0)<1){
    const {error}=await supabase.rpc('import_full_legacy_save_once',{p_user:user.id,p_trainer_name:parts.trainer_name,p_trainer_level:parts.trainer_level,p_trainer_xp:parts.trainer_xp,p_gold:parts.gold,p_diamonds:parts.diamonds,p_psycoin:parts.psycoin,p_inventory:parts.inventory,p_pokemon:parts.pokemon});
    if(error&&!/already completed/i.test(error.message||''))throw error;
  }
  const {error:seedError}=await supabase.rpc('psy_v26_action',{p_user:user.id,p_action:'seed',p_payload:parts.seed,p_idempotency:`v26-seed:${user.id}`});
  if(seedError)throw seedError;
  return snapshot(supabase,user.id);
}

export default async function handler(req,res){
  const action=txt(req.query?.action||'state',40).toLowerCase();
  try{
    const {user,supabase}=await requireUser(req);
    if(action==='state'){
      if(!method(req,res,['GET']))return;
      return res.status(200).json(await snapshot(supabase,user.id));
    }
    if(!method(req,res,['POST']))return;
    if(action==='bootstrap'){
      const save=req.body?.save;if(!save||typeof save!=='object')return res.status(400).json({error:'save_required'});
      return res.status(200).json(await bootstrap(user,supabase,save));
    }
    const idempotency=idem(req.body?.idempotency_key,action);
    if(GENERIC.has(action)){
      const payload=obj(req.body?.payload||req.body);
      const {data,error}=await supabase.rpc('psy_v26_action',{p_user:user.id,p_action:action,p_payload:payload,p_idempotency:idempotency});
      if(error)throw error;
      const snap=await snapshot(supabase,user.id);
      return res.status(200).json({...obj(data),...snap,action:data?.action||action});
    }
    if(action==='capture-attempt'){
      const b=obj(req.body),types=(Array.isArray(b.target_types)?b.target_types:[]).slice(0,2).map(x=>txt(x,20).toLowerCase());
      const {data,error}=await supabase.rpc('psy_v26_capture_attempt',{p_user:user.id,p_species:int(b.species,1,2000,1),p_level:int(b.level,1,10000,1),p_shiny:bool(b.shiny),p_mega:bool(b.mega),p_boss:bool(b.boss),p_tier:txt(b.tier||'E',12),p_rarity:txt(b.rarity||'Lixo',64),p_rarity_mult:num(b.rarity_mult,1,100000,1),p_hp_pct:num(b.hp_pct,0,1,1),p_ball:txt(b.ball,40),p_target_types:types,p_cap_buff:num(b.cap_buff,0,200,0),p_pokemon_data:safePokemon(obj(b.pokemon_data)),p_idempotency:idempotency});
      if(error)throw error;return res.status(200).json(data);
    }
    if(action==='battle-win'){
      const b=obj(req.body);const {data,error}=await supabase.rpc('psy_v26_battle_reward',{p_user:user.id,p_mode:txt(b.mode||'wild',20),p_enemy_level:int(b.enemy_level,1,10000,1),p_enemy_type:txt(b.enemy_type||'Normal',20),p_gold_buff:num(b.gold_buff,0,300,0),p_xp_buff:num(b.xp_buff,0,300,0),p_drop_buff:num(b.drop_buff,0,120,0),p_idempotency:idempotency});if(error)throw error;return res.status(200).json(data);
    }
    if(action==='reward-commit'){
      const b=obj(req.body);const {data,error}=await supabase.rpc('psy_v26_reward_commit',{p_user:user.id,p_category:txt(b.category||'system',20),p_reference:txt(b.reference,180),p_gold:int(b.gold,0,50_000_000,0),p_diamonds:int(b.diamonds,0,1000,0),p_items:safeMap(b.items,120,100000),p_packs:safeMap(b.packs,20,100),p_eggs:safeMap(b.eggs,40,100),p_idempotency:idempotency});if(error)throw error;return res.status(200).json(data);
    }
    if(action==='afk-start'||action==='afk-claim'||action==='afk-stop'){
      const b=obj(req.body);const sub=action.slice(4);const {data,error}=await supabase.rpc('psy_v26_afk_action',{p_user:user.id,p_action:sub,p_level_cap:int(b.level_cap,20,100,20),p_gold_buff:num(b.gold_buff,0,300,0),p_xp_buff:num(b.xp_buff,0,300,0),p_drop_buff:num(b.drop_buff,0,200,0),p_idempotency:idempotency});if(error)throw error;return res.status(200).json(data);
    }
    return res.status(404).json({error:'unknown_game_action'});
  }catch(e){return jsonError(res,e)}
}