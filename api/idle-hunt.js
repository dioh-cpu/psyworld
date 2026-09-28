import { requireUser, jsonError, method } from './_lib/supabase.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BALLS=new Set(['Pokéball','Great Ball','Super Ball','Ultra Ball','Premier Ball']);
function fail(message,status=400){const e=new Error(message);e.status=status;throw e;}
function id(value){const s=String(value||'');if(!UUID.test(s))fail('invalid_id');return s;}
function text(value,max){return String(value??'').trim().slice(0,max);}

export default async function handler(req,res){
  if(!method(req,res,['GET','POST']))return;
  try{
    const {user,supabase}=await requireUser(req);
    let action,payload,requestId=null;
    if(req.method==='GET'){
      action=String(req.query?.action||'state');
      if(action!=='state')fail('unknown_action');
      payload={nickname:text(req.query?.nickname||user.user_metadata?.trainer_name||'Treinador',24)};
    }else{
      const body=req.body&&typeof req.body==='object'&&!Array.isArray(req.body)?req.body:{};
      action=text(body.action,20).toLowerCase();
      requestId=id(body.request_id);
      if(action==='start')payload={map_key:text(body.map_key,64),nickname:text(body.nickname||user.user_metadata?.trainer_name||'Treinador',24)};
      else if(action==='victory')payload={ticket_id:id(body.ticket_id)};
      else if(action==='capture'){
        const ball=text(body.ball,40);if(!BALLS.has(ball))fail('invalid_ball');
        payload={ticket_id:id(body.ticket_id),ball};
      }else fail('unknown_action');
    }
    const {data,error}=await supabase.rpc('idle_hunt',{u:user.id,act:action,p:payload,req:requestId});
    if(error){if(error.code==='P0001')fail(error.message,409);if(['22P02','22023'].includes(error.code))fail('invalid_request');throw error;}
    return res.status(200).json(data);
  }catch(e){return jsonError(res,e);}
}
