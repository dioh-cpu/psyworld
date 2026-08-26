
export default function handler(req,res){
  res.status(200).json({ok:true,service:'psyworld',online:Boolean(process.env.SUPABASE_URL&&process.env.SUPABASE_SECRET_KEY)});
}
