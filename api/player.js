import { requireUser, jsonError, method } from '../lib/supabase.js';

function sanitize(value, depth=0){
  if(depth>16) return null;
  if(value===null||typeof value==='boolean'||typeof value==='string') return value;
  if(typeof value==='number') return Number.isFinite(value)?value:0;
  if(Array.isArray(value)) return value.slice(0,2500).map(v=>sanitize(v,depth+1));
  if(typeof value==='object'){
    const out={};
    for(const [k,v] of Object.entries(value).slice(0,3000)){
      if(['password','access_token','refresh_token','supabaseKey'].includes(k)) continue;
      out[String(k).slice(0,100)]=sanitize(v,depth+1);
    }
    return out;
  }
  return null;
}

export default async function handler(req,res){
  const action=String(req.query?.action||'').toLowerCase();
  try{
    if(action==='bootstrap'){
      if(!method(req,res,['POST'])) return;
      const {user,supabase}=await requireUser(req);
      const trainerName=String(req.body?.trainer_name||user.user_metadata?.trainer_name||'Trainer').slice(0,24);
      let {data:player,error}=await supabase.from('players').select('*').eq('user_id',user.id).maybeSingle();
      if(error) throw error;
      if(!player){
        const ins=await supabase.from('players').insert({user_id:user.id,trainer_name:trainerName}).select('*').single();
        if(ins.error) throw ins.error;
        player=ins.data;
      }
      return res.status(200).json({player});
    }

    if(action==='state'){
      if(!method(req,res,['GET'])) return;
      const {user,supabase}=await requireUser(req);
      const [p,i,mons,ledger,game]=await Promise.all([
        supabase.from('players').select('*').eq('user_id',user.id).single(),
        supabase.from('player_inventory').select('item_key,quantity').eq('user_id',user.id),
        supabase.from('player_pokemon').select('*').eq('owner_id',user.id).is('locked_reason',null).order('created_at'),
        supabase.from('wallet_ledger').select('currency,amount,reason,reference_id,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(30),
        supabase.from('player_game_state').select('save,updated_at,client_updated_at').eq('user_id',user.id).maybeSingle()
      ]);
      if(p.error) throw p.error;
      return res.status(200).json({player:p.data,inventory:i.data||[],pokemon:mons.data||[],ledger:ledger.data||[],game_state:game.data||null});
    }

    if(action==='save'){
      if(!method(req,res,['POST'])) return;
      const {user,supabase}=await requireUser(req);
      const save=sanitize(req.body?.save||{});
      const raw=JSON.stringify(save);
      if(raw.length>1_800_000) return res.status(413).json({error:'save_too_large'});
      const now=new Date().toISOString();
      const {error}=await supabase.from('player_game_state').upsert({user_id:user.id,save,client_updated_at:req.body?.client_updated_at||null,updated_at:now},{onConflict:'user_id'});
      if(error) throw error;
      return res.status(200).json({ok:true,updated_at:now});
    }

    return res.status(404).json({error:'unknown_player_action'});
  }catch(e){ return jsonError(res,e); }
}
