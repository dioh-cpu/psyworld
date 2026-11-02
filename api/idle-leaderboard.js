import { requireUser, jsonError, method } from './_lib/supabase.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PERIODS=new Set(['daily','weekly','monthly']);
function fail(message,status=400){const e=new Error(message);e.status=status;throw e;}
function text(value,max){return String(value??'').trim().slice(0,max);}

export default async function handler(req,res){
  if(!method(req,res,['POST']))return;
  try{
    const {user,supabase}=await requireUser(req);
    const body=req.body&&typeof req.body==='object'&&!Array.isArray(req.body)?req.body:{};
    const action=text(body.action,20).toLowerCase();
    if(!['board','claim'].includes(action))fail('unknown_action');
    const payload={nickname:text(user.user_metadata?.trainer_name||'Treinador',24)};
    let requestId=null;
    if(action==='claim'){
      const period=text(body.period,10).toLowerCase();
      if(!PERIODS.has(period))fail('invalid_period');
      requestId=text(body.request_id,64);
      if(!UUID.test(requestId))fail('invalid_id');
      payload.period=period;
    }
    // Only server-verified identity and whitelisted control fields reach the RPC.
    const {data,error}=await supabase.rpc('idle_hunt_leaderboard',{
      u:user.id,act:action,p:payload,req:requestId
    });
    if(error){
      if(error.code==='P0001'){
        const message=String(error.message||'request_rejected');
        fail(message,['request_conflict','already_claimed'].includes(message)?409:400);
      }
      if(['22P02','22023'].includes(error.code))fail('invalid_request');
      throw error;
    }
    return res.status(200).json(data);
  }catch(e){return jsonError(res,e);}
}
