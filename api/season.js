import {randomUUID} from 'node:crypto';
import {requireUser,jsonError,method} from './_lib/supabase.js';
import {reward,QUESTS,PSYBALL_PRODUCTS} from '../lib/season-catalog-v48.js';
const actions=new Set(['psyball-buy','pass-premium-v48','pass-divine','pass-claim-v48','period-sync','pass-sync','period-claim','profession','craft-element']);
export default async function handler(req,res){try{
 if(!method(req,res,['POST']))return;const {user,supabase}=await requireUser(req),action=String(req.query?.action||'');if(!actions.has(action))return res.status(400).json({error:'invalid action'});
 const b=req.body||{},payload={...(b.payload||b)};let key=String(b.idempotency_key||'v48:'+randomUUID());if(key.length<8||key.length>180||!/^[A-Za-z0-9:._-]+$/.test(key))return res.status(400).json({error:'invalid receipt key'});
 if(action==='psyball-buy'&&!PSYBALL_PRODUCTS.some(p=>p.id===payload.product))return res.status(400).json({error:'invalid product'});
 if(action==='pass-claim-v48'){const level=Number(payload.level),track=String(payload.track);if(!Number.isInteger(level)||level<1||level>100||!['free','premium','divine'].includes(track))return res.status(400).json({error:'invalid reward'});payload.reward=reward(level,track);}
 if(action==='period-claim'&&!QUESTS[payload.scope]?.some(q=>q.id===payload.quest))return res.status(400).json({error:'invalid quest'});
 const {data,error}=await supabase.rpc('psy_v48_state_action',{p_user:user.id,p_action:action,p_payload:payload,p_idempotency:key});if(error)return res.status(400).json({error:error.message});const snap=await supabase.rpc('psy_v26_snapshot',{p_user:user.id});if(snap.error)throw snap.error;return res.status(200).json({...data,...snap.data});
 }catch(e){return jsonError(res,e)}}
