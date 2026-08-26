
import { requireUser, jsonError, method } from '../../lib/supabase.js';
export default async function handler(req,res){
  if(!method(req,res,['POST'])) return;
  try{
    const {user,supabase}=await requireUser(req);
    const {data,error}=await supabase.rpc('shop_sell_stone',{
      p_user:user.id,p_item:String(req.body?.item||''),p_qty:Math.floor(Number(req.body?.qty)||1),
      p_idempotency:String(req.body?.idempotency_key||crypto.randomUUID())
    });
    if(error) throw error; return res.status(200).json({ok:true,result:data});
  }catch(e){return jsonError(res,e)}
}
