
import { requireUser, jsonError, method } from '../_lib/supabase.js';

export default async function handler(req,res){
  if(!method(req,res,['GET'])) return;
  try{
    const {user,supabase}=await requireUser(req);
    const [p,i,mons,ledger,game]=await Promise.all([
      supabase.from('players').select('*').eq('user_id',user.id).single(),
      supabase.from('player_inventory').select('item_key,quantity').eq('user_id',user.id),
      supabase.from('player_pokemon').select('*').eq('owner_id',user.id).is('locked_reason',null).order('created_at'),
      supabase.from('wallet_ledger').select('currency,amount,reason,reference_id,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(30),
      supabase.from('player_game_state').select('save,updated_at,client_updated_at').eq('user_id',user.id).maybeSingle()
    ]);
    if(p.error) throw p.error;
    return res.status(200).json({
      player:p.data,
      inventory:i.data||[],
      pokemon:mons.data||[],
      ledger:ledger.data||[],
      game_state:game.data||null
    });
  }catch(e){return jsonError(res,e)}
}
