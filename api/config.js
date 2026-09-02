function publicEnv(name){
  const v=process.env[name];
  return typeof v==='string' && v.trim() ? v.trim() : null;
}

export default function handler(req,res){
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return res.status(405).json({error:'method_not_allowed'});
  }
  const url=publicEnv('SUPABASE_URL');
  // Supabase renamed anon keys to publishable keys on newer projects; support both.
  const anonKey=publicEnv('SUPABASE_PUBLISHABLE_KEY')||publicEnv('SUPABASE_ANON_KEY');
  return res.status(200).json({
    onlineConfigured:!!(url&&anonKey),
    supabaseUrl:url,
    supabaseAnonKey:anonKey,
    cloudSave:true,
    marketEnabled:false,
    version:'V23'
  });
}
