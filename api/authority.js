import { requireUser, jsonError, method } from '../lib/supabase.js';

function num(v,min=0,max=1_000_000_000){
  const n=Number(v);if(!Number.isFinite(n))return min;return Math.max(min,Math.min(max,Math.floor(n)));
}
function text(v,max=64){return String(v??'').slice(0,max)}
function cleanInventory(x){
  const src=x&&typeof x==='object'&&!Array.isArray(x)?x:{};const out={};
  for(const [k,v] of Object.entries(src).slice(0,3000)){
    const key=text(k,120);if(!key)continue;out[key]=num(v,0,1_000_000_000);
  }
  return out;
}
function cleanPokemon(list,group){
  if(!Array.isArray(list))return [];
  return list.slice(0,3000).map((p,index)=>{
    if(!p||typeof p!=='object')return null;
    const q={...p};
    q.id=num(p.id??p.species_id,1,100000);
    q.level=num(p.level,1,10000);
    q.xp=num(p.xp,0,9_000_000_000_000);
    q.resets=num(p.resets,0,9999);
    q.shiny=!!p.shiny;
    q.tier=text(p.tier||'E',16)||'E';
    q.__online_group=group;
    q.__online_order=index;
    if(typeof p.rarity==='object')q.rarity={...p.rarity,n:text(p.rarity?.n||'Lixo',32)};
    else q.rarity=text(p.rarity||'Lixo',32)||'Lixo';
    if(p.megaForm!=null)q.megaForm=text(p.megaForm,80);
    return q;
  }).filter(Boolean);
}

async function state(supabase,userId){
  const [p,i,m,l]=await Promise.all([
    supabase.from('players').select('trainer_name,trainer_level,trainer_xp,gold,diamonds,psycoin,authority_version,authority_activated_at,legacy_imported_at,updated_at').eq('user_id',userId).maybeSingle(),
    supabase.from('player_inventory').select('item_key,quantity,updated_at').eq('user_id',userId).order('item_key'),
    supabase.from('player_pokemon').select('pokemon_uid,species_id,level,xp,shiny,mega_form,tier,rarity,resets,data,locked_reason,updated_at').eq('owner_id',userId).order('created_at'),
    supabase.from('wallet_ledger').select('currency,amount,reason,reference_id,idempotency_key,balance_after,created_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(100)
  ]);
  for(const r of [p,i,m,l])if(r.error)throw r.error;
  return {player:p.data||null,inventory:i.data||[],pokemon:m.data||[],recent_ledger:l.data||[]};
}

export default async function handler(req,res){
  const action=String(req.query?.action||'state').toLowerCase();
  try{
    const {user,supabase}=await requireUser(req);
    if(action==='state'){
      if(!method(req,res,['GET']))return;
      return res.status(200).json({ok:true,authoritative:true,user_id:user.id,...await state(supabase,user.id),server_time:new Date().toISOString()});
    }
    if(action==='import'){
      if(!method(req,res,['POST']))return;
      const save=req.body?.save||{};const p=save.player||save.P||save;
      const team=Array.isArray(p?.team)?p.team:[];const box=Array.isArray(p?.box)?p.box:[];
      const pokemon=[...cleanPokemon(team,'team'),...cleanPokemon(box,'box')];
      const inventory=cleanInventory(p?.inventory||save.inventory||{});
      const trainerName=text(p?.name||p?.nickname||req.body?.trainer_name||'Trainer',32)||'Trainer';
      const trainerLevel=num(p?.trainerLevel??p?.trainer_level??1,1,10000);
      const trainerXp=num(p?.trainerXp??p?.trainer_xp??0,0,9_000_000_000_000);
      const gold=num(p?.gold??p?.coins??0,0,9_000_000_000_000);
      const diamonds=num(p?.diamonds??0,0,9_000_000_000_000);
      const psycoin=num(p?.psyCoin??p?.psycoin??p?.psycoins??0,0,9_000_000_000_000);
      const {data,error}=await supabase.rpc('import_full_legacy_save_once',{
        p_user:user.id,p_trainer_name:trainerName,p_trainer_level:trainerLevel,p_trainer_xp:trainerXp,
        p_gold:gold,p_diamonds:diamonds,p_psycoin:psycoin,p_inventory:inventory,p_pokemon:pokemon
      });
      if(error)throw error;
      return res.status(200).json({ok:true,import:data,state:await state(supabase,user.id)});
    }
    return res.status(404).json({error:'unknown_authority_action'});
  }catch(e){return jsonError(res,e)}
}
