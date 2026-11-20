const SOURCES=new Set(['battle','capture','drop','afk','battlepass','achievement','egg','pack','survivor','quest','system']);

function safeInt(value,min,max,name){
  const n=Math.floor(Number(value||0));
  if(!Number.isFinite(n)||n<min||n>max)throw new Error(`invalid_${name}`);
  return n;
}

function safeItems(items){
  if(items==null)return {};
  if(typeof items!=='object'||Array.isArray(items))throw new Error('invalid_items');
  const out={};
  for(const [key,value] of Object.entries(items)){
    const name=String(key||'').trim();
    if(!name||name.length>120)throw new Error('invalid_item_key');
    out[name]=safeInt(value,1,100000,'item_qty');
  }
  return out;
}

export async function grantReward(supabase,{userId,source,referenceId,idempotencyKey,gold=0,diamonds=0,items={}}){
  if(!SOURCES.has(source))throw new Error('invalid_reward_source');
  const idem=String(idempotencyKey||'').trim();
  if(idem.length<8||idem.length>180)throw new Error('invalid_idempotency_key');
  const {data,error}=await supabase.rpc('grant_server_reward',{
    p_user:userId,
    p_source:source,
    p_reference:String(referenceId||'').slice(0,180)||null,
    p_idempotency:idem,
    p_gold:safeInt(gold,0,1000000000,'gold'),
    p_diamonds:safeInt(diamonds,0,1000000,'diamonds'),
    p_items:safeItems(items)
  });
  if(error)throw error;
  return data;
}
