import { requireUser, jsonError, method } from '../lib/supabase.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function checkedId(value){
  const id=String(value||'');
  if(!UUID.test(id)){const e=new Error('invalid_listing_id');e.status=400;throw e}
  return id;
}
function positiveInt(value,name,max=1000000000){
  const n=Math.floor(Number(value));
  if(!Number.isSafeInteger(n)||n<1||n>max){const e=new Error('invalid_'+name);e.status=400;throw e}
  return n;
}
function publicPokemon(row){
  if(!row)return null;
  const d=row.data&&typeof row.data==='object'?row.data:{};
  const id=Number(row.species_id||d.id||1);
  return {
    id,name:String(d.name||('Pokémon '+id)).slice(0,80),level:Number(row.level||d.level||1),
    xp:Number(row.xp||d.xp||0),shiny:!!row.shiny,isMega:!!(row.mega_form||d.isMega),
    megaForm:String(row.mega_form||d.megaForm||'').slice(0,40),
    tier:String(row.tier||d.tier||'E').slice(0,16),
    rarity:d.rarity&&typeof d.rarity==='object'?{n:String(d.rarity.n||'Lixo').slice(0,32),mult:Number(d.rarity.mult||1)}:String(row.rarity||d.rarity||'Lixo').slice(0,32),
    evolutionStage:Number(d.evolutionStage||1),resets:Number(row.resets||d.resets||0),
    psyduckChosen:!!d.psyduckChosen,maxHp:Number(d.maxHp||1),atk:Number(d.atk||0)
  };
}
async function decorateListings(supabase,rows,userId){
  const sellers=[...new Set(rows.map(x=>x.seller_id))],pokemonIds=[...new Set(rows.filter(x=>x.kind==='pokemon'&&x.pokemon_uid).map(x=>x.pokemon_uid))];
  const tasks=[];
  if(sellers.length)tasks.push(supabase.from('players').select('user_id,trainer_name').in('user_id',sellers));
  else tasks.push(Promise.resolve({data:[],error:null}));
  if(pokemonIds.length)tasks.push(supabase.from('player_pokemon').select('pokemon_uid,species_id,level,xp,shiny,mega_form,tier,rarity,resets,data').in('pokemon_uid',pokemonIds));
  else tasks.push(Promise.resolve({data:[],error:null}));
  const [sellerResult,pokemonResult]=await Promise.all(tasks);
  if(sellerResult.error)throw sellerResult.error;
  if(pokemonResult.error)throw pokemonResult.error;
  const names=new Map((sellerResult.data||[]).map(x=>[x.user_id,String(x.trainer_name||'Treinador').slice(0,24)]));
  const pokemon=new Map((pokemonResult.data||[]).map(x=>[x.pokemon_uid,publicPokemon(x)]));
  return rows.map(x=>({
    id:x.id,kind:x.kind,item_key:x.item_key,quantity:x.quantity,currency:x.currency,price:x.price,created_at:x.created_at,
    seller_name:names.get(x.seller_id)||'Treinador',is_own:x.seller_id===userId,
    pokemon:x.kind==='pokemon'?pokemon.get(x.pokemon_uid)||null:null
  }));
}
function exposeMarketError(error){
  const message=String(error?.message||'');
  if(!error?.status&&/listing unavailable|cannot buy own listing|insufficient_balance|insufficient_item|pokemon unavailable|pokemon escrow missing|invalid kind|invalid currency|invalid qty|diamonds may only be sold/i.test(message))error.status=409;
  return error;
}
export default async function handler(req,res){
  const action=String(req.query?.action||'list').toLowerCase();
  try{
    if(action==='list'){
      const {user,supabase}=await requireUser(req);
      if(req.method==='GET'){
        const {data,error}=await supabase.from('market_listings_v2')
          .select('id,seller_id,kind,pokemon_uid,item_key,quantity,currency,price,created_at')
          .eq('status','active').order('created_at',{ascending:false}).limit(200);
        if(error)throw error;
        return res.status(200).json({list:await decorateListings(supabase,data||[],user.id)});
      }
      if(req.method==='POST'){
        const b=req.body||{},kind=String(b.kind||'').trim().toLowerCase();
        const currencyRaw=String(b.currency||'gold').trim().toLowerCase();
        const currency=currencyRaw==='diamond'?'diamonds':currencyRaw;
        const price=positiveInt(b.price,'price');
        const quantity=(kind==='item'||kind==='diamonds')?positiveInt(b.quantity??b.qty,'quantity'):null;
        const itemKey=kind==='item'?String(b.item_key||b.name||'').trim().slice(0,120):null;
        if(kind==='item'&&!itemKey){const e=new Error('invalid_item_key');e.status=400;throw e}
        const pokemonUid=kind==='pokemon'?checkedId(b.pokemon_uid):null;
        if(!['item','pokemon','diamonds'].includes(kind)){const e=new Error('invalid_kind');e.status=400;throw e}
        if(!['gold','diamonds'].includes(currency)){const e=new Error('invalid_currency');e.status=400;throw e}
        if(kind==='diamonds'&&currency!=='gold'){const e=new Error('diamonds_must_be_sold_for_gold');e.status=400;throw e}
        const {data,error}=await supabase.rpc('market_create_listing',{
          p_user:user.id,p_kind:kind,p_pokemon_uid:pokemonUid,p_item_key:itemKey,
          p_quantity:quantity,p_currency:currency,p_price:price
        });
        if(error)throw error;
        return res.status(201).json({ok:true,listing_id:data});
      }
      return method(req,res,['GET','POST']);
    }
    if(action==='buy'){
      if(!method(req,res,['POST']))return;
      const {user,supabase}=await requireUser(req);
      const listingId=checkedId(req.query?.id||req.body?.listing_id);
      const {data,error}=await supabase.rpc('market_buy_listing',{p_buyer:user.id,p_listing:listingId});
      if(error)throw error;
      return res.status(200).json({ok:true,listing_id:data?.listing_id||listingId,result:data});
    }
    if(action==='cancel'){
      if(!method(req,res,['POST']))return;
      const {user,supabase}=await requireUser(req);
      const listingId=checkedId(req.body?.listing_id||req.query?.id);
      const {data,error}=await supabase.rpc('market_cancel_listing',{p_user:user.id,p_listing:listingId});
      if(error)throw error;
      return res.status(200).json({ok:true,listing_id:listingId,cancelled:!!data});
    }
    if(action==='claims'){
      if(!method(req,res,['GET']))return;
      await requireUser(req);
      return res.status(200).json({claims:[]});
    }
    return res.status(404).json({error:'unknown_market_action'});
  }catch(error){return jsonError(res,exposeMarketError(error))}
}
