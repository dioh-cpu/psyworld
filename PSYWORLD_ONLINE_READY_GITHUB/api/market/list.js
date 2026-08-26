
import { requireUser, jsonError, method } from '../_lib/supabase.js';

export default async function handler(req,res){
  try{
    if(req.method==='GET'){
      const {supabase}=await requireUser(req);
      const {data,error}=await supabase.from('market_listings_v2')
        .select('id,seller_id,kind,pokemon_uid,item_key,quantity,currency,price,created_at')
        .eq('status','active').order('created_at',{ascending:false}).limit(200);
      if(error) throw error;
      return res.status(200).json({list:data||[]});
    }
    if(req.method==='POST'){
      const {user,supabase}=await requireUser(req);
      const b=req.body||{};
      const {data,error}=await supabase.rpc('market_create_listing',{
        p_user:user.id,
        p_kind:String(b.kind||''),
        p_pokemon_uid:b.pokemon_uid||null,
        p_item_key:b.item_key||b.name||null,
        p_quantity:b.quantity||b.qty||null,
        p_currency:String(b.currency||'gold'),
        p_price:Math.floor(Number(b.price)||0)
      });
      if(error) throw error;
      return res.status(201).json({listing_id:data});
    }
    return method(req,res,['GET','POST']);
  }catch(e){return jsonError(res,e)}
}
