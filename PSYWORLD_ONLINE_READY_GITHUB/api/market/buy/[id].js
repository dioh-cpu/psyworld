
import { requireUser, jsonError, method } from '../../_lib/supabase.js';

export default async function handler(req,res){
  if(!method(req,res,['POST'])) return;
  try{
    const {user,supabase}=await requireUser(req);
    const {data,error}=await supabase.rpc('market_buy_listing',{
      p_buyer:user.id,
      p_listing:req.query.id
    });
    if(error) throw error;
    return res.status(200).json({ok:true,result:data});
  }catch(e){return jsonError(res,e)}
}
