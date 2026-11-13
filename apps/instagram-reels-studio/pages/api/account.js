import {send,db,unseal,getAssignedInstagramAccounts} from '../../lib/server.js';

export default async function handler(req,res){
  if(req.method!=='GET'&&req.method!=='POST')return send(res,405,{error:'Method not allowed'});
  const rows=await db('instagram_credentials','GET',null,'?select=*&id=eq.primary&limit=1');
  if(!rows?.length)return send(res,200,{connected:false});
  let credential;
  try{credential=unseal(rows[0].encrypted_token)}catch{return send(res,500,{connected:false,error:'Falha ao descriptografar credencial.'});}
  if(credential.provider!=='instagram_unified_login'||credential.tokenType!=='business_integration_system_user'||!credential.businessIntegrationToken||!credential.instagramUserId)return send(res,401,{connected:false,error:'Credencial incompatível; reconecte usando Instagram API with Unified Login.'});
  if(rows[0].expires_at&&Date.parse(rows[0].expires_at)<=Date.now())return send(res,401,{connected:false,error:'Token expirado; reconecte a conta.'});
  const result=await getAssignedInstagramAccounts(credential.businessIntegrationToken);
  if(!result.ok)return send(res,401,{connected:false,error:'Meta rejeitou a credencial ou não autorizou a consulta das contas atribuídas.'});
  const account=(result.data?.data||[]).find(a=>String(a.id)===String(credential.instagramUserId));
  if(!account)return send(res,401,{connected:false,error:'A conta não está mais atribuída à integração Meta.'});
  if(String(account.username).toLowerCase()!==String(rows[0].username).toLowerCase())return send(res,401,{connected:false,error:'A conta retornada pela Meta não corresponde à credencial armazenada.'});
  return send(res,200,{connected:true,userId:String(account.id),username:account.username,expiresAt:rows[0].expires_at});
}
