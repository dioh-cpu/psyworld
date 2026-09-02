import { createClient } from '@supabase/supabase-js';

export function env(name){
  const v=process.env[name];
  if(!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function serverSecret(){
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
}

export function adminClient(){
  const key=serverSecret();
  if(!key) throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
  return createClient(
    env('SUPABASE_URL'),
    key,
    { auth:{ persistSession:false, autoRefreshToken:false } }
  );
}

export async function requireUser(req){
  const auth=String(req.headers.authorization||'');
  if(!auth.startsWith('Bearer ')){
    const e=new Error('AUTH_REQUIRED'); e.status=401; throw e;
  }
  const token=auth.slice(7);
  const supabase=adminClient();
  const {data,error}=await supabase.auth.getUser(token);
  if(error || !data?.user){
    const e=new Error('INVALID_SESSION'); e.status=401; throw e;
  }
  return {user:data.user, supabase};
}

export function jsonError(res,e){
  console.error(e);
  const status=e?.status||500;
  const msg=status===500?'internal_error':String(e?.message||'error');
  return res.status(status).json({error:msg});
}

export function method(req,res,allowed){
  if(!allowed.includes(req.method)){
    res.setHeader('Allow',allowed.join(', '));
    res.status(405).json({error:'method_not_allowed'});
    return false;
  }
  return true;
}
