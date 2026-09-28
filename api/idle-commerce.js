import { requireUser, jsonError, method } from './_lib/supabase.js';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CATS=new Set(['all','item','pokemon','stone','egg','profession','psycoin']);
function fail(message,status=400){const e=new Error(message);e.status=status;throw e;}
function integer(v,min,max){const n=Number(v);if(!Number.isSafeInteger(n)||n<min||n>max)fail('invalid_number');return n;}
function id(v){if(!UUID.test(String(v||'')))fail('invalid_id');return v;}
export default async function handler(req,res){
 if(!method(req,res,['GET','POST']))return;
 try{
  const {user,supabase}=await requireUser(req);
  const nickname=String(user.user_metadata?.trainer_name||user.user_metadata?.name||'Treinador').slice(0,24);
  const {error:bootstrapError}=await supabase.rpc('idle_hunt',{u:user.id,act:'state',p:{nickname},req:null});
  if(bootstrapError)throw bootstrapError;
  const action=String(req.query?.action||(req.method==='GET'?'list':''));
  const rpc=async(act,p={},request=null)=>{const {data,error}=await supabase.rpc('idle_commerce',{u:user.id,act,p,req:request});if(error){if(error.code==='P0001')fail(error.message,409);throw error;}return data;};
  if(req.method==='GET'){
   const state=await rpc('state');
   if(action==='state')return res.status(200).json(state);
   if(action!=='list')fail('unknown_action');
   const kind=String(req.query?.kind||'market'),scope=String(req.query?.scope||'all'),category=String(req.query?.category||'all'),search=String(req.query?.search||'').trim().slice(0,80),page=integer(req.query?.page||0,0,100000);
   if(!['market','auction'].includes(kind)||!['all','mine','bids','history'].includes(scope)||!CATS.has(category))fail('invalid_filter');
   const {data:catalog,error}=await supabase.rpc('idle_browse_commerce',{u:user.id,k:kind,s:scope,c:category,q:search,pg:page});if(error)throw error;
   return res.status(200).json({...catalog,...state});
  }
  const b=req.body||{},request=id(b.request_id);let p={};
  if(action==='create'){
   if(!['market','auction'].includes(b.kind)||!['gold','psycoin'].includes(b.currency)||!['item','pokemon','psycoin'].includes(b.asset_kind))fail('invalid_listing');
   p={kind:b.kind,currency:b.currency,asset_kind:b.asset_kind,quantity:integer(b.quantity,1,1000000),price:integer(b.price,1,1000000000),hours:integer(b.hours,6,48)};
   if(![6,12,24,48].includes(p.hours))fail('invalid_duration');
   if(b.asset_kind!=='psycoin')p.asset_id=id(b.asset_id);
   if(b.buyout!==null&&b.buyout!==undefined&&b.buyout!=='')p.buyout=integer(b.buyout,p.price,1000000000);
  }else if(['buy','bid','cancel','settle'].includes(action)){
   p={listing_id:id(b.listing_id)};if(action==='bid')p.amount=integer(b.amount,1,1000000000);
  }else fail('unknown_action');
  const result=await rpc(action,p,request);const state=await rpc('state');
  return res.status(200).json({...result,...state});
 }catch(e){return jsonError(res,e);}
}
