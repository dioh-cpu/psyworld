import {send,supabaseServiceHeaders,db} from '../../lib/server.js';

const SAFE_OBJECT=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[a-zA-Z0-9._-]{1,100}$/i;

export default async function handler(req,res){
  if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
  const path=Array.isArray(req.query.path)?req.query.path[0]:req.query.path;
  if(typeof path!=='string'||!SAFE_OBJECT.test(path))return send(res,400,{error:'Caminho de vídeo inválido'});
  const base=process.env.SUPABASE_URL;
  const bucket=process.env.SUPABASE_STORAGE_BUCKET||'reels-private';
  if(!base||!process.env.SUPABASE_SERVICE_ROLE_KEY)return send(res,503,{error:'Storage persistente não configurado'});
  const rows=await db('reels','GET',null,`?select=id&video_path=eq.${encodeURIComponent(path)}&limit=1`);
  if(!rows?.length)return send(res,404,{error:'Vídeo não encontrado em um rascunho'});

  const endpoint=new URL(`/storage/v1/object/sign/${encodeURIComponent(bucket)}/${encodeURIComponent(path)}`,base);
  const response=await fetch(endpoint,{method:'POST',headers:supabaseServiceHeaders({'Content-Type':'application/json'}),body:JSON.stringify({expiresIn:600}),cache:'no-store'});
  let data;try{data=await response.json()}catch{return send(res,502,{error:'Não foi possível gerar a prévia privada'});}
  if(!response.ok||typeof data.signedURL!=='string')return send(res,502,{error:'Não foi possível gerar a prévia privada'});
  const signedUrl=new URL(data.signedURL,base).toString();
  return send(res,200,{url:signedUrl},{'Cache-Control':'private, no-store'});
}
