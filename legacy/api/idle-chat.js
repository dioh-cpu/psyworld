import { createHash } from 'node:crypto';
import { adminClient, jsonError, method } from './_lib/supabase.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CHANNELS=new Set(['global','doubts','trade']);

function fail(message,status=400){const error=new Error(message);error.status=status;throw error;}
function digest(value){return createHash('sha256').update(value).digest('hex')}

export default async function handler(req,res){
  if(!method(req,res,['POST']))return;
  try{
    const body=req.body&&typeof req.body==='object'&&!Array.isArray(req.body)?req.body:{};
    const channel=String(body.channel||'').trim().toLowerCase();
    const message=String(body.body??'').trim();
    const username=String(body.username||'Treinador').replace(/[\u0000-\u001f\u007f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,32)||'Treinador';
    const guestId=String(body.guest_id||'');
    if(!CHANNELS.has(channel))fail('invalid_chat_channel');
    if(message.length<1||message.length>240)fail('invalid_chat_message');
    if(!UUID.test(guestId))fail('invalid_guest_id');

    const forwarded=String(req.headers['x-real-ip']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown');
    const ip=forwarded.split(',')[0].trim()||'unknown';
    const ipHash=digest(`psy-idle-chat-ip:${ip}`);
    const guestHash=digest(`psy-idle-chat-guest:${ip}:${guestId.toLowerCase()}`);
    const {data,error}=await adminClient().rpc('psy_idle_send_guest_chat',{
      p_channel:channel,p_body:message,p_username:username,p_guest_hash:guestHash,p_ip_hash:ipHash
    });
    if(error){
      if(error.message==='chat_rate_limited')fail('chat_rate_limited',429);
      if(error.code==='P0001')fail(error.message,400);
      throw error;
    }
    return res.status(200).json({message:data});
  }catch(error){return jsonError(res,error)}
}
