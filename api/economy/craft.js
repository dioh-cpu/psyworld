
import { requireUser, jsonError, method } from '../_lib/supabase.js';
export default async function handler(req,res){
  if(!method(req,res,['POST'])) return;
  try{
    const {user,supabase}=await requireUser(req);
    const {data,error}=await supabase.rpc('craft_element_ball',{
      p_user:user.id,p_element:String(req.body?.element||''),
      p_idempotency:String(req.body?.idempotency_key||crypto.randomUUID())
    });
    if(error) throw error; return res.status(200).json({ok:true,result:data});
  }catch(e){return jsonError(res,e)}
}
