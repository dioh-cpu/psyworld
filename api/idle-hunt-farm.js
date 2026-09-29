import { requireUser, jsonError, method } from './_lib/supabase.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function fail(message,status=400){const e=new Error(message);e.status=status;throw e;}
function text(value,max){return String(value??'').trim().slice(0,max);}

export default async function handler(req,res){
  if(!method(req,res,['POST']))return;
  try{
    const {user,supabase}=await requireUser(req);
    const body=req.body&&typeof req.body==='object'&&!Array.isArray(req.body)?req.body:{};
    const action=text(body.action,20).toLowerCase();
    if(!['claim','checkpoint'].includes(action))fail('unknown_action');
    const requestId=text(body.request_id,64);
    if(!UUID.test(requestId))fail('invalid_id');
    const mapKey=text(body.map_key,64);
    if(!/^[a-z0-9-]{1,64}$/.test(mapKey))fail('invalid_map');
    const attackerAtk=Math.max(1,Math.min(1000000,Math.floor(Number(body.attacker_atk)||35)));
    const attackerLevel=Math.max(1,Math.min(10000,Math.floor(Number(body.attacker_level)||1)));
    const payload={map_key:mapKey,auto_farm:body.auto_farm!==false,nickname:text(body.nickname||user.user_metadata?.trainer_name||'Treinador',24),attacker_atk:attackerAtk,attacker_level:attackerLevel};
    const {data,error}=await supabase.rpc('idle_hunt_farm',{u:user.id,act:action,p:payload,req:requestId});
    if(error){if(error.code==='P0001')fail(error.message,409);if(['22P02','22023'].includes(error.code))fail('invalid_request');throw error;}
    return res.status(200).json(data);
  }catch(e){return jsonError(res,e);}
}
