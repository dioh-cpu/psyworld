import { requireUser, jsonError, method } from '../lib/supabase.js';

export default async function handler(req,res){
  const action=String(req.query?.action||'list').toLowerCase();
  try{
    if(action==='list'){
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
    }

    if(action==='buy'){
      if(!method(req,res,['POST'])) return;
      const {user,supabase}=await requireUser(req);
      const listingId=req.query?.id||req.body?.listing_id;
      const {data,error}=await supabase.rpc('market_buy_listing',{p_buyer:user.id,p_listing:listingId});
      if(error) throw error;
      return res.status(200).json({ok:true,result:data,listing:data});
    }

    if(action==='cancel'){
      if(!method(req,res,['POST'])) return;
      const {user,supabase}=await requireUser(req);
      const {data,error}=await supabase.rpc('market_cancel_listing',{p_user:user.id,p_listing:req.body?.listing_id});
      if(error) throw error;
      return res.status(200).json({ok:true,result:data});
    }

    if(action==='claims'){
      if(!method(req,res,['GET'])) return;
      await requireUser(req);
      // In the Supabase authority migration, sale proceeds are credited atomically
      // by market_buy_listing, so there is no separate claims table to settle.
      return res.status(200).json({claims:[]});
    }

    return res.status(404).json({error:'unknown_market_action'});
  }catch(e){ return jsonError(res,e); }
}
