
import { requireUser, jsonError, method } from '../_lib/supabase.js';

const ALLOWED_ITEMS=/^(.* Stone|Fragmento Mega Stone|Essência .+|.+ Ball|PsyStone|TM .+)$/i;

function sanePokemon(p){
  const id=Number(p?.id);
  if(!Number.isInteger(id)||id<1||id>1025) return null;
  return {
    species_id:id,
    level:Math.max(1,Math.min(1000,Math.floor(Number(p.level)||1))),
    xp:Math.max(0,Math.min(1_000_000_000,Math.floor(Number(p.exp)||0))),
    shiny:Boolean(p.shiny),
    mega_form:p.isMega?String(p.megaForm||'mega').slice(0,60):null,
    tier:String(p.tier||'E').slice(0,8),
    rarity:String(p.rarity?.n||p.rarity||'Lixo').slice(0,40),
    resets:Math.max(0,Math.min(1000,Math.floor(Number(p.resets)||0))),
    data:{
      boost:Math.max(0,Math.min(100,Number(p.boost)||0)),
      evoMult:Math.max(1,Math.min(100,Number(p.evoMult)||1)),
      eggTier:p.eggTier||null,
      psyduckChosen:Boolean(p.psyduckChosen),
      psyMega:Boolean(p.psyMega)
    }
  };
}

export default async function handler(req,res){
  if(!method(req,res,['POST'])) return;
  if(process.env.ALLOW_LEGACY_IMPORT!=='true') return res.status(403).json({error:'legacy_import_disabled'});
  try{
    const {user,supabase}=await requireUser(req);
    const {data:player,error:pe}=await supabase.from('players').select('legacy_imported_at').eq('user_id',user.id).single();
    if(pe) throw pe;
    if(player?.legacy_imported_at) return res.status(409).json({error:'already_imported'});

    const save=req.body?.save||{};
    // Deliberately conservative import ceilings. Admin can later review exceptional saves.
    const gold=Math.max(0,Math.min(25_000_000,Math.floor(Number(save.gold)||0)));
    const diamonds=Math.max(0,Math.min(5_000,Math.floor(Number(save.diamonds)||0)));
    const trainerLevel=Math.max(1,Math.min(500,Math.floor(Number(save.trainerLevel)||1)));

    const {error:rpcErr}=await supabase.rpc('import_legacy_save_once',{
      p_user:user.id,
      p_gold:gold,
      p_diamonds:diamonds,
      p_trainer_level:trainerLevel
    });
    if(rpcErr) throw rpcErr;

    const inv=Object.entries(save.inventory||{})
      .filter(([k,v])=>ALLOWED_ITEMS.test(k)&&Number(v)>0)
      .slice(0,300)
      .map(([item_key,quantity])=>({
        user_id:user.id,item_key:String(item_key).slice(0,100),
        quantity:Math.min(100000,Math.floor(Number(quantity)))
      }));
    if(inv.length){
      const {error}=await supabase.from('player_inventory').upsert(inv,{onConflict:'user_id,item_key'});
      if(error) throw error;
    }

    const mons=[...(save.team||[]),...(save.box||[])].map(sanePokemon).filter(Boolean).slice(0,1000)
      .map(x=>({...x,owner_id:user.id}));
    if(mons.length){
      const {error}=await supabase.from('player_pokemon').insert(mons);
      if(error) throw error;
    }
    return res.status(200).json({ok:true,imported:{gold,diamonds,trainerLevel,items:inv.length,pokemon:mons.length}});
  }catch(e){return jsonError(res,e)}
}
