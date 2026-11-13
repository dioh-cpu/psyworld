import {send,cookie,verifyState,REDIRECT,CONFIG_ID,db,seal,exchangeUnifiedLoginCode,getAssignedInstagramAccounts} from '../../../lib/server.js';

function safeMetaErrorFields(error){
  const numeric=(value)=>Number.isInteger(Number(value))?Number(value):undefined;
  const type=typeof error?.type==='string'&&/^[A-Za-z0-9_.-]{1,64}$/.test(error.type)?error.type:undefined;
  return {
    errorCode:numeric(error?.code),
    errorType:type,
    errorSubcode:numeric(error?.error_subcode),
  };
}

function logCodeExchangeFailure(exchange){
  // Log only diagnostic fields. Never log provider payloads, request URLs,
  // authorization codes, state, secrets, or access tokens.
  console.error(JSON.stringify({
    event:'meta_unified_login_code_exchange_failed',
    httpStatus:Number.isInteger(exchange?.status)?exchange.status:null,
    ...safeMetaErrorFields(exchange?.data?.error),
  }));
}

export default async function handler(req,res){
  if(req.method!=='GET')return send(res,405,'Method not allowed');
  const q=new URL(req.url,'https://studio.invalid').searchParams;
  if(!verifyState(req,q.get('state')))return send(res,400,'OAuth state inválido ou expirado.');
  cookie(res,'oauth_state','',0);
  if(q.has('error'))return send(res,400,'A Meta recusou a autorização. Reinicie o fluxo de login.');
  const code=q.get('code');
  if(!code||!REDIRECT||!process.env.IG_APP_SECRET||!CONFIG_ID)return send(res,400,'Código OAuth ou configuração ausente.');

  // Unified Login returns a Business Integration System User Access Token (SUAT).
  // Do not exchange it using the legacy fb_exchange_token flow.
  let exchange;
  try{
    exchange=await exchangeUnifiedLoginCode(code);
  }catch{
    logCodeExchangeFailure({status:null,data:null});
    return send(res,502,{error:'A Meta não aceitou o código de autorização.'});
  }
  const token=exchange.data?.access_token;
  if(!exchange.ok||!token){
    logCodeExchangeFailure(exchange);
    return send(res,502,{error:'A Meta não aceitou o código de autorização.'});
  }
  let expiresAt=null;
  if(exchange.data?.expires_in!==undefined&&exchange.data?.expires_in!==null){
    const expiresIn=Number(exchange.data.expires_in);
    if(!Number.isFinite(expiresIn)||expiresIn<=0)return send(res,502,{error:'A Meta informou uma validade de token inválida.'});
    expiresAt=Date.now()+expiresIn*1000;
  }

  const accounts=await getAssignedInstagramAccounts(token);
  if(!accounts.ok)return send(res,502,{error:'Não foi possível consultar as contas do Instagram atribuídas pela Meta.'});
  const assigned=(accounts.data?.data||[]).filter(a=>a?.id&&a?.username);
  if(assigned.length!==1)return send(res,409,{error:assigned.length?'Mais de uma conta profissional foi atribuída; nenhuma foi conectada.':'Nenhuma conta profissional foi atribuída à integração.'});

  const account=assigned[0];
  const encrypted=seal({provider:'instagram_unified_login',tokenType:'business_integration_system_user',businessIntegrationToken:token,configId:CONFIG_ID,instagramUserId:String(account.id),username:account.username,expiresAt});
  await db('instagram_credentials','POST',{id:'primary',user_id:String(account.id),username:account.username,encrypted_token:encrypted,expires_at:expiresAt?new Date(expiresAt).toISOString():null,updated_at:new Date().toISOString()},'?on_conflict=id');
  res.statusCode=302;
  res.setHeader('Location','/?connected=1');
  res.setHeader('Cache-Control','no-store');
  res.end();
}
