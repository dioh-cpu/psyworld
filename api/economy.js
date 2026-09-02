import { randomUUID } from 'node:crypto';
import { requireUser, jsonError, method } from './_lib/supabase.js';

const ACTIONS=new Set(['craft','shop-buy','shop-sell']);

function cleanIdempotency(value){
  const raw=String(value||'').trim();
  if(!raw) return randomUUID();
  if(raw.length<8 || raw.length>180 || !/^[A-Za-z0-9:._-]+$/.test(raw)){
    const e=new Error('invalid_idempotency_key'); e.status=400; throw e;
  }
  return raw;
}

function cleanQty(value){
  const qty=Math.floor(Number(value));
  if(!Number.isFinite(qty)||qty<1||qty>100){
    const e=new Error('invalid_qty'); e.status=400; throw e;
  }
  return qty;
}

function cleanText(value,name,max=100){
  const s=String(value||'').trim();
  if(!s||s.length>max){const e=new Error(`invalid_${name}`);e.status=400;throw e;}
  return s;
}

async function authoritativeSnapshot(supabase,userId){
  const [playerR,inventoryR]=await Promise.all([
    supabase.from('players').select('gold,diamonds,trainer_level,trainer_xp,updated_at').eq('user_id',userId).maybeSingle(),
    supabase.from('player_inventory').select('item_key,quantity,updated_at').eq('user_id',userId).order('item_key')
  ]);
  if(playerR.error) throw playerR.error;
  if(inventoryR.error) throw inventoryR.error;
  return {player:playerR.data||null,inventory:inventoryR.data||[]};
}

export default async function handler(req,res){
  const action=String(req.query?.action||'').toLowerCase();
  if(!method(req,res,['POST'])) return;
  if(!ACTIONS.has(action)) return res.status(404).json({error:'unknown_economy_action'});

  try{
    const {user,supabase}=await requireUser(req);
    const idempotency=cleanIdempotency(req.body?.idempotency_key);
    let data,error;

    if(action==='craft'){
      ({data,error}=await supabase.rpc('craft_element_ball',{
        p_user:user.id,
        p_element:cleanText(req.body?.element,'element',24).toLowerCase(),
        p_idempotency:idempotency
      }));
    }else if(action==='shop-buy'){
      ({data,error}=await supabase.rpc('shop_buy_item',{
        p_user:user.id,
        p_item:cleanText(req.body?.item,'item'),
        p_qty:cleanQty(req.body?.qty),
        p_idempotency:idempotency
      }));
    }else{
      ({data,error}=await supabase.rpc('shop_sell_stone',{
        p_user:user.id,
        p_item:cleanText(req.body?.item,'item'),
        p_qty:cleanQty(req.body?.qty),
        p_idempotency:idempotency
      }));
    }

    if(error) throw error;
    const state=await authoritativeSnapshot(supabase,user.id);
    return res.status(200).json({ok:true,authoritative:true,action,idempotency_key:idempotency,result:data,...state});
  }catch(e){ return jsonError(res,e); }
}
