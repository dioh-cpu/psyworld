
import { requireUser, jsonError, method } from '../_lib/supabase.js';

export default async function handler(req,res){
  if(!method(req,res,['POST'])) return;
  try{
    const {user,supabase}=await requireUser(req);
    const trainerName=String(req.body?.trainer_name||user.user_metadata?.trainer_name||'Trainer').slice(0,24);

    let {data:player,error}=await supabase.from('players').select('*').eq('user_id',user.id).maybeSingle();
    if(error) throw error;
    if(!player){
      const ins=await supabase.from('players')
        .insert({user_id:user.id,trainer_name:trainerName})
        .select('*').single();
      if(ins.error) throw ins.error;
      player=ins.data;
    }
    return res.status(200).json({player});
  }catch(e){return jsonError(res,e)}
}
