import { requireUser, jsonError, method } from './_lib/supabase.js';

const REGIONS=new Set(['kanto','johto','hoenn','sinnoh','unova','kalos','alola','galar','paldea']);
function bad(res,status,error){return res.status(status).json({error:error});}
export default async function handler(req,res){
  if(!method(req,res,['POST']))return;
  try{
    const {user,supabase}=await requireUser(req);
    const body=req.body&&typeof req.body==='object'?req.body:{};
    const action=String(body.action||req.query?.action||'').toLowerCase();
    if(action==='enter'){
      const region=String(body.region||'').trim().toLowerCase();
      if(!REGIONS.has(region))return bad(res,400,'invalid_region');
      const nickname=String(body.nickname||'').replace(/[\u0000-\u001f\u007f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,24)||'Treinador';
      const {data,error}=await supabase.rpc('psy_world_enter_room',{p_user_id:user.id,p_region:region,p_nickname:nickname});
      if(error){
        if(String(error.message||'').includes('world_room_full'))return bad(res,409,'world_room_full');
        if(String(error.message||'').includes('invalid_region'))return bad(res,400,'invalid_region');
        throw error;
      }
      const room=Array.isArray(data)?data[0]:data;
      if(!room?.room_id||!room?.topic)return bad(res,500,'room_not_created');
      return res.status(200).json({ok:true,room_id:room.room_id,topic:room.topic,players_online:Number(room.players_online||0),capacity:Number(room.capacity||0),region:region});
    }
    if(action==='heartbeat'){
      const roomId=String(body.room_id||'').toLowerCase();
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(roomId))return bad(res,400,'invalid_room');
      const {data,error}=await supabase.rpc('psy_world_room_heartbeat',{p_user_id:user.id,p_room_id:roomId});
      if(error)throw error;
      if(data!==true)return bad(res,404,'room_membership_not_found');
      return res.status(200).json({ok:true});
    }
    if(action==='leave'){
      const roomId=String(body.room_id||'').toLowerCase();
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(roomId))return bad(res,400,'invalid_room');
      const {error}=await supabase.rpc('psy_world_room_leave',{p_user_id:user.id,p_room_id:roomId});
      if(error)throw error;
      return res.status(200).json({ok:true});
    }
    return bad(res,400,'unknown_action');
  }catch(error){return jsonError(res,error)}
}