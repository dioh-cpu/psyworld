
import { requireUser, jsonError, method } from '../_lib/supabase.js';

export default async function handler(req,res){
  if(!method(req,res,['POST'])) return;
  try{
    const {user,supabase}=await requireUser(req);
    const {data,error}=await supabase.rpc('market_cancel_listing',{
      p_user:user.id,p_listing:req.body?.listing_id
    });
    if(error) throw error;
    return res.status(200).json({ok:true,result:data});
  }catch(e){return jsonError(res,e)}
}
