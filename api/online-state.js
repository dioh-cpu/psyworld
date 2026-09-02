import { requireUser, jsonError, method } from './_lib/supabase.js';

export default async function handler(req,res){
  if(!method(req,res,['GET'])) return;
  try{
    const {user,supabase}=await requireUser(req);
    const [playerR,inventoryR,pokemonR,ledgerR]=await Promise.all([
      supabase.from('players').select('trainer_name,trainer_level,trainer_xp,gold,diamonds,updated_at,legacy_imported_at').eq('user_id',user.id).maybeSingle(),
      supabase.from('player_inventory').select('item_key,quantity,updated_at').eq('user_id',user.id).order('item_key'),
      supabase.from('player_pokemon').select('pokemon_uid,species_id,level,xp,shiny,mega_form,tier,rarity,resets,data,locked_reason,updated_at').eq('owner_id',user.id).order('created_at'),
      supabase.from('wallet_ledger').select('currency,amount,reason,reference_id,balance_after,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(50)
    ]);
    for(const r of [playerR,inventoryR,pokemonR,ledgerR]) if(r.error) throw r.error;
    return res.status(200).json({
      ok:true,
      user_id:user.id,
      authoritative:true,
      player:playerR.data||null,
      inventory:inventoryR.data||[],
      pokemon:pokemonR.data||[],
      recent_ledger:ledgerR.data||[],
      server_time:new Date().toISOString()
    });
  }catch(e){ return jsonError(res,e); }
}
