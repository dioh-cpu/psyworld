
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'method'});
  const seller=String(req.headers['x-psy-player']||'').slice(0,128);
  if(!seller)return res.status(400).json({error:'player id ausente'});
  try{
    const rows=await sql`
      UPDATE market_claims
      SET claimed=true,claimed_at=now()
      WHERE seller_id=${seller} AND claimed=false
      RETURNING id::text,listing_id::text,currency,amount
    `;
    return res.status(200).json({claims:rows});
  }catch(e){
    console.error(e);
    return res.status(500).json({error:'falha ao receber vendas'});
  }
}
