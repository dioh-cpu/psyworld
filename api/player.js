import { requireUser, jsonError, method } from '../lib/supabase.js';

function sanitize(value,depth=0){
  if(depth>18)return null;
  if(value===null||typeof value==='boolean'||typeof value==='string')return value;
  if(typeof value==='number')return Number.isFinite(value)?value:0;
  if(Array.isArray(value))return value.slice(0,4000).map(v=>sanitize(v,depth+1));
  if(typeof value==='object'){
    const out={};
    for(const [k,v] of Object.entries(value).slice(0,5000)){
      const key=String(k).slice(0,120);
      if(['password','access_token','refresh_token','supabaseKey','supabaseAnonKey'].includes(key))continue;
      out[key]=sanitize(v,depth+1);
    }
    return out;
  }
  return null;
}

async function ensurePlayer(supabase,user,trainerName){
  const row={user_id:user.id,trainer_name:String(trainerName||user.user_metadata?.trainer_name||'Trainer').slice(0,32)};
  const {error}=await supabase.from('players').upsert(row,{onConflict:'user_id',ignoreDuplicates:true});
  if(error)throw error;
}

export default async function handler(req,res){
  const action=String(req.query?.action||'state').toLowerCase();
  try{
    if(action==='state'){
      if(!method(req,res,['GET']))return;
      const {user,supabase}=await requireUser(req);
      await ensurePlayer(supabase,user);
      const [p,game]=await Promise.all([
        supabase.from('players').select('user_id,trainer_name,trainer_level,trainer_xp,created_at,updated_at').eq('user_id',user.id).maybeSingle(),
        supabase.from('player_game_state').select('save,updated_at,client_updated_at').eq('user_id',user.id).maybeSingle()
      ]);
      if(p.error)throw p.error;
      if(game.error)throw game.error;
      return res.status(200).json({user:{id:user.id,email:user.email||null},player:p.data||null,game_state:game.data||null,market_enabled:false});
    }

    if(action==='save'){
      if(!method(req,res,['POST']))return;
      const {user,supabase}=await requireUser(req);
      const save=sanitize(req.body?.save||{});
      const raw=JSON.stringify(save);
      if(raw.length<20)return res.status(400).json({error:'invalid_save'});
      if(raw.length>2_400_000)return res.status(413).json({error:'save_too_large'});
      const trainerName=save?.player?.name||save?.player?.nickname||req.body?.trainer_name||'Trainer';
      await ensurePlayer(supabase,user,trainerName);
      const clientUpdatedAt=req.body?.client_updated_at||new Date(Number(save?.savedAt||Date.now())).toISOString();
      const now=new Date().toISOString();
      const {data,error}=await supabase.from('player_game_state').upsert({
        user_id:user.id,
        save,
        client_updated_at:clientUpdatedAt,
        updated_at:now
      },{onConflict:'user_id'}).select('updated_at,client_updated_at').single();
      if(error)throw error;
      return res.status(200).json({ok:true,...data});
    }

    return res.status(404).json({error:'unknown_action'});
  }catch(e){return jsonError(res,e)}
}
