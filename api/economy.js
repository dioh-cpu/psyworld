import { requireUser, jsonError, method } from '../lib/supabase.js';

export default async function handler(req,res){
  const action=String(req.query?.action||'').toLowerCase();
  if(!method(req,res,['POST'])) return;
  try{
    const {user,supabase}=await requireUser(req);
    if(action==='craft'){
      const {data,error}=await supabase.rpc('craft_element_ball',{
        p_user:user.id,
        p_element:String(req.body?.element||''),
        p_idempotency:String(req.body?.idempotency_key||crypto.randomUUID())
      });
      if(error) throw error;
      return res.status(200).json({ok:true,result:data});
    }
    if(action==='shop-buy'){
      const {data,error}=await supabase.rpc('shop_buy_item',{
        p_user:user.id,
        p_item:String(req.body?.item||''),
        p_qty:Math.floor(Number(req.body?.qty)||1),
        p_idempotency:String(req.body?.idempotency_key||crypto.randomUUID())
      });
      if(error) throw error;
      return res.status(200).json({ok:true,result:data});
    }
    if(action==='shop-sell'){
      const {data,error}=await supabase.rpc('shop_sell_stone',{
        p_user:user.id,
        p_item:String(req.body?.item||''),
        p_qty:Math.floor(Number(req.body?.qty)||1),
        p_idempotency:String(req.body?.idempotency_key||crypto.randomUUID())
      });
      if(error) throw error;
      return res.status(200).json({ok:true,result:data});
    }
    return res.status(404).json({error:'unknown_economy_action'});
  }catch(e){ return jsonError(res,e); }
}
