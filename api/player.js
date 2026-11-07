import { requireUser, jsonError, method } from './_lib/supabase.js';

function sanitize(value,depth=0){
  if(depth>18)return null;
  if(value===null||typeof value==='boolean'||typeof value==='string')return value;
  if(typeof value==='number')return Number.isFinite(value)?value:0;
  if(Array.isArray(value))return value.slice(0,4000).map(v=>sanitize(v,depth+1));
  if(typeof value==='object'){
    const out={};
    for(const [k,v] of Object.entries(value).slice(0,5000)){
      const key=String(k).slice(0,120);
      if(['password','access_token','refresh_token','supabaseKey','supabaseAnonKey'].includes(key))continue;
      out[key]=sanitize(v,depth+1);
    }
    return out;
  }
  return null;
}

/* Protect recorded event test grants from outdated local snapshots.
 * Normal consumable spending is never merged or added across saves. */
const HALLOWEEN_CANDY='Doce de Halloween';
function reconcileGrantedCandy(incoming,previous){
  const grant=previous?.player?.meta?.halloweenTestGrantV1;
  if(!grant||typeof grant.id!=='string'||!Number.isSafeInteger(grant.amount)||grant.amount<1)return incoming;
  const applied=incoming?.player?.meta?.halloweenTestGrantV1;
  if(applied?.id===grant.id)return incoming; // client already knows the grant: accept normal purchases
  if(!incoming?.player)return incoming;
  incoming.player.meta=incoming.player.meta||{};
  incoming.player.inventory=incoming.player.inventory||{};
  const oldBalance=Math.max(0,Math.floor(Number(previous.player?.inventory?.[HALLOWEEN_CANDY])||0));
  const localBalance=Math.max(0,Math.floor(Number(incoming.player.inventory[HALLOWEEN_CANDY])||0));
  incoming.player.inventory[HALLOWEEN_CANDY]=Math.max(oldBalance,localBalance);
  incoming.player.meta.halloweenTestGrantV1=grant;
  return incoming;
}
/* When a cloud save is downloaded, use the paid wallet and authoritative
 * positive item balances from the account's server records. Do not combine
 * arbitrary local inventories (which would duplicate consumables). */
async function hydratePurchasedAssets(supabase,userId,save){
 if(!save?.player)return save;
 const [{data:walletRows,error:walletError},{data:inventoryRows,error:inventoryError}]=await Promise.all([
  supabase.from('wallet_ledger').select('id').eq('user_id',userId).eq('currency','psycoin').limit(1),
  supabase.from('player_inventory').select('item_key,quantity').eq('user_id',userId)
 ]);
 if(walletError)throw walletError;if(inventoryError)throw inventoryError;
 const out={...save,player:{...save.player,inventory:{...(save.player.inventory||{})}}};
 for(const row of inventoryRows||[]){
  const key=String(row.item_key||''),qty=Math.max(0,Math.floor(Number(row.quantity)||0));
  if(!key)continue;
  if(qty>0)out.player.inventory[key]=qty;
  else delete out.player.inventory[key];
 }
 if(walletRows?.length){
  const {data:wallet,error}=await supabase.from('players').select('psycoin').eq('user_id',userId).single();
  if(error)throw error;
  out.player.psycoin=Math.max(0,Math.floor(Number(wallet.psycoin)||0));
 }
 return out;
}
function cleanNick(value){
  return String(value||'').trim().replace(/\s+/g,' ').slice(0,14);
}

function characterNickFromSave(save){
  return cleanNick(save?.player?.meta?.characterNickname||save?.player?.characterNickname||'');
}

function characterSummary(row){
  const p=row?.save?.player||{};
  const active=Array.isArray(p.team)&&p.team.length?p.team[0]:null;
  return {
    id:row.id,
    nickname:row.nickname,
    updated_at:row.updated_at,
    client_updated_at:row.client_updated_at,
    level:Number(p.trainerLevel||p.level||1),
    active_pokemon:active?.name||null,
    active_level:Number(active?.level||1)
  };
}

async function ensurePlayer(supabase,user,trainerName){
  const row={user_id:user.id,trainer_name:String(trainerName||user.user_metadata?.trainer_name||'Trainer').slice(0,32)};
  const {error}=await supabase.from('players').upsert(row,{onConflict:'user_id',ignoreDuplicates:true});
  if(error)throw error;
}

async function upsertCharacter(supabase,user,nickname,save,clientUpdatedAt,now){
  const nick=cleanNick(nickname);
  if(!nick)return null;
  const {data,error}=await supabase.from('player_characters').upsert({
    user_id:user.id,
    nickname:nick,
    save,
    client_updated_at:clientUpdatedAt,
    updated_at:now
  },{onConflict:'user_id,nickname_key'}).select('id,nickname,updated_at,client_updated_at').single();
  if(error)throw error;
  return data;
}

export default async function handler(req,res){
  const action=String(req.query?.action||'state').toLowerCase();
  try{
    if(action==='state'){
      if(!method(req,res,['GET']))return;
      const {user,supabase}=await requireUser(req);
      await ensurePlayer(supabase,user);
      const [p,game,chars]=await Promise.all([
        supabase.from('players').select('user_id,trainer_name,trainer_level,trainer_xp,gold,diamonds,psycoin,authority_version,created_at,updated_at').eq('user_id',user.id).maybeSingle(),
        supabase.from('player_game_state').select('save,updated_at,client_updated_at').eq('user_id',user.id).maybeSingle(),
        supabase.from('player_characters').select('id,nickname,save,updated_at,client_updated_at').eq('user_id',user.id).order('updated_at',{ascending:false})
      ]);
      if(p.error)throw p.error;
      if(game.error)throw game.error;
      if(chars.error)throw chars.error;
      if(game.data?.save)game.data.save=await hydratePurchasedAssets(supabase,user.id,game.data.save);
      return res.status(200).json({
        user:{id:user.id,email:user.email||null},
        player:p.data||null,
        game_state:game.data||null,
        characters:(chars.data||[]).map(characterSummary),
        market_enabled:false
      });
    }

    if(action==='characters'){
      if(!method(req,res,['GET']))return;
      const {user,supabase}=await requireUser(req);
      await ensurePlayer(supabase,user);
      const {data,error}=await supabase.from('player_characters')
        .select('id,nickname,save,updated_at,client_updated_at')
        .eq('user_id',user.id)
        .order('updated_at',{ascending:false});
      if(error)throw error;
      return res.status(200).json({characters:(data||[]).map(characterSummary)});
    }

    if(action==='character'){
      if(!method(req,res,['GET']))return;
      const {user,supabase}=await requireUser(req);
      const nickname=cleanNick(req.query?.nickname||'');
      if(!nickname)return res.status(400).json({error:'nickname_required'});
      const {data,error}=await supabase.from('player_characters')
        .select('id,nickname,save,updated_at,client_updated_at')
        .eq('user_id',user.id)
        .eq('nickname_key',nickname.toLowerCase())
        .maybeSingle();
      if(error)throw error;
      if(!data)return res.status(404).json({error:'character_not_found'});
      if(data.save)data.save=await hydratePurchasedAssets(supabase,user.id,data.save);
      return res.status(200).json({character:data});
    }

    if(action==='save'||action==='character-save'){
      if(!method(req,res,['POST']))return;
      const {user,supabase}=await requireUser(req);
      let save=sanitize(req.body?.save||{});
      const raw=JSON.stringify(save);
      if(raw.length<20)return res.status(400).json({error:'invalid_save'});
      if(raw.length>2_400_000)return res.status(413).json({error:'save_too_large'});
      const nick=cleanNick(req.body?.character_nickname||characterNickFromSave(save));
      const trainerName=nick||save?.player?.name||save?.player?.nickname||req.body?.trainer_name||'Trainer';
      await ensurePlayer(supabase,user,trainerName);
      // Paid PsyCoin purchases and spending are recorded in the server wallet ledger.
      // A local snapshot must not overwrite a ledger-backed wallet balance.
      const {data:paidRows,error:paidErr}=await supabase.from('wallet_ledger')
        .select('id').eq('user_id',user.id).eq('currency','psycoin').limit(1);
      if(paidErr)throw paidErr;
      if(paidRows?.length){
        const {data:wallet,error:walletErr}=await supabase.from('players')
          .select('psycoin').eq('user_id',user.id).single();
        if(walletErr)throw walletErr;
        save.player=save.player||{};
        save.player.psycoin=Math.max(0,Math.floor(Number(wallet.psycoin)||0));
      }
      if(nick){
        const {data:previous,error:previousError}=await supabase.from('player_characters')
          .select('save,updated_at').eq('user_id',user.id)
          .eq('nickname_key',nick.toLowerCase()).maybeSingle();
        if(previousError)throw previousError;
        if(previous?.save){
          const expected=String(req.body?.base_cloud_updated_at||'');
          if(expected&&expected!==String(previous.updated_at)){
            return res.status(409).json({error:'cloud_save_conflict',message:'Outro dispositivo salvou este personagem. Carregue o save da nuvem ou resolva o conflito antes de substituir.'});
          }
          if(!expected&&Number(save?.savedAt||0)<Number(previous.save?.savedAt||0)-1500){
            return res.status(409).json({error:'cloud_save_newer',message:'O servidor tem um save mais recente. Baixe ou confirme esse save antes de enviar um antigo.'});
          }
          save=reconcileGrantedCandy(save,previous.save);
        }
      }
      const clientUpdatedAt=req.body?.client_updated_at||new Date(Number(save?.savedAt||Date.now())).toISOString();
      const now=new Date().toISOString();

      let character=null;
      if(nick)character=await upsertCharacter(supabase,user,nick,save,clientUpdatedAt,now);

      // Mantém o espelho legado como o personagem ativo para compatibilidade com a autoridade online V26.
      const {data,error}=await supabase.from('player_game_state').upsert({
        user_id:user.id,
        save,
        client_updated_at:clientUpdatedAt,
        updated_at:now
      },{onConflict:'user_id'}).select('updated_at,client_updated_at').single();
      if(error)throw error;
      return res.status(200).json({ok:true,...data,character,server_inventory_candy:save?.player?.inventory?.[HALLOWEEN_CANDY]??null,server_grant:save?.player?.meta?.halloweenTestGrantV1||null,server_psycoin:paidRows?.length?save.player.psycoin:null});
    }

    return res.status(404).json({error:'unknown_action'});
  }catch(e){return jsonError(res,e)}
}
