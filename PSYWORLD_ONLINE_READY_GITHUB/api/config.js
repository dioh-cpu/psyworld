
export default function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'method_not_allowed'});
  const url=process.env.SUPABASE_URL||'';
  const key=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'';
  return res.status(200).json({
    onlineConfigured:Boolean(url&&key),
    supabaseUrl:url,
    supabasePublishableKey:key,
    legacyImportEnabled:process.env.ALLOW_LEGACY_IMPORT==='true'
  });
}
