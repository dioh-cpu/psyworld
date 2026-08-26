import { requireUser, jsonError, method } from '../_lib/supabase.js';

function sanitize(value, depth=0){
  if(depth>16) return null;
  if(value===null||typeof value==='boolean'||typeof value==='string') return value;
  if(typeof value==='number') return Number.isFinite(value)?value:0;
  if(Array.isArray(value)) return value.slice(0,2500).map(v=>sanitize(v,depth+1));
  if(typeof value==='object'){
    const out={}; for(const [k,v] of Object.entries(value).slice(0,3000)){
      if(['password','access_token','refresh_token','supabaseKey'].includes(k))continue;
      out[String(k).slice(0,100)]=sanitize(v,depth+1);
    } return out;
  }
  return null;
}
export default async function handler(req,res){
  if(!method(req,res,['POST']))return;
  try{
    const {user,supabase}=await requireUser(req); const save=sanitize(req.body?.save||{});
    const raw=JSON.stringify(save); if(raw.length>1_800_000)return res.status(413).json({error:'save_too_large'});
    const {error}=await supabase.from('player_game_state').upsert({user_id:user.id,save,client_updated_at:req.body?.client_updated_at||null,updated_at:new Date().toISOString()},{onConflict:'user_id'});
    if(error)throw error; return res.status(200).json({ok:true,updated_at:new Date().toISOString()});
  }catch(e){return jsonError(res,e)}
}
