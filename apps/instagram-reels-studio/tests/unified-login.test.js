import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.IG_APP_ID='1127709063315731';
process.env.IG_CONFIG_ID='1169207135536709';
process.env.IG_REDIRECT_URI='https://cain-lucius-reels-studio.vercel.app/auth/instagram/callback';
process.env.IG_APP_SECRET='test-app-secret';
process.env.OAUTH_STATE_SECRET='test-state-secret';
process.env.TOKEN_ENCRYPTION_KEY=Buffer.alloc(32,7).toString('base64');
process.env.SUPABASE_URL='https://studio-supabase.invalid';
process.env.SUPABASE_SERVICE_ROLE_KEY='test-service-key';

const {default:callback}=await import('../pages/api/auth/callback.js');
const {default:accountHandler}=await import('../pages/api/account.js');
const {buildAuthorizeUrl,seal,unseal}=await import('../lib/server.js');

function oauthState(){
  const value=crypto.randomBytes(32).toString('hex');
  const signature=crypto.createHmac('sha256',process.env.OAUTH_STATE_SECRET).update(value).digest('hex');
  return {value,cookie:`oauth_state=${value}.${signature}`};
}
function response(){return {headers:{},statusCode:0,body:'',setHeader(k,v){this.headers[k]=v;},end(v=''){this.body=v;}};}

test('authorization URL selects the supplied Unified Login configuration without ads scopes',()=>{
  const u=buildAuthorizeUrl('state-test');
  assert.equal(u.origin,'https://www.facebook.com');
  assert.equal(u.pathname,'/v27.0/dialog/oauth');
  assert.equal(u.searchParams.get('client_id'),process.env.IG_APP_ID);
  assert.equal(u.searchParams.get('config_id'),process.env.IG_CONFIG_ID);
  assert.equal(u.searchParams.get('redirect_uri'),process.env.IG_REDIRECT_URI);
  assert.equal(u.searchParams.get('response_type'),'code');
  assert.equal(u.searchParams.get('state'),'state-test');
  assert.equal(u.searchParams.has('scope'),false);
});

test('callback exchanges code once, discovers assigned Instagram account, and stores SUAT encrypted',async()=>{
  const state=oauthState(),calls=[],writes=[];
  const oldFetch=globalThis.fetch;
  globalThis.fetch=async(input,init={})=>{
    const u=new URL(input);calls.push({url:u,init});
    if(u.hostname==='graph.facebook.com'&&u.pathname.endsWith('/oauth/access_token'))return new Response(JSON.stringify({access_token:'mock-suat',expires_in:3600}),{status:200});
    if(u.hostname==='graph.facebook.com'&&u.pathname.endsWith('/me/assigned_instagram_accounts'))return new Response(JSON.stringify({data:[{id:'17840001',username:'cainsennagamer'}]}),{status:200});
    if(u.hostname==='studio-supabase.invalid'){writes.push(JSON.parse(init.body));return new Response(JSON.stringify(writes),{status:201});}
    throw new Error(`Unexpected fetch target: ${u.origin}${u.pathname}`);
  };
  try{
    const res=response();
    await callback({method:'GET',url:`/auth/instagram/callback?code=mock-code&state=${state.value}`,headers:{cookie:state.cookie}},res);
    assert.equal(res.statusCode,302);
    assert.equal(res.headers.Location,'/?connected=1');
    assert.equal(calls.length,3);
    const exchange=calls[0].url;
    assert.equal(exchange.pathname,'/v27.0/oauth/access_token');
    assert.equal(exchange.searchParams.get('client_id'),process.env.IG_APP_ID);
    assert.equal(exchange.searchParams.get('code'),'mock-code');
    assert.equal(exchange.searchParams.has('grant_type'),false);
    assert.equal(exchange.searchParams.has('redirect_uri'),false);
    const discovery=calls[1];
    assert.equal(discovery.url.pathname,'/v27.0/me/assigned_instagram_accounts');
    assert.equal(discovery.url.searchParams.get('fields'),'id,username');
    assert.equal(discovery.init.headers.Authorization,'Bearer mock-suat');
    assert.equal(writes.length,1);
    assert.equal(writes[0].username,'cainsennagamer');
    assert.equal(writes[0].user_id,'17840001');
    assert.equal(writes[0].encrypted_token.access_token,undefined);
    const stored=unseal(writes[0].encrypted_token);
    assert.equal(stored.provider,'instagram_unified_login');
    assert.equal(stored.tokenType,'business_integration_system_user');
    assert.equal(stored.businessIntegrationToken,'mock-suat');
    assert.equal(stored.configId,process.env.IG_CONFIG_ID);
  }finally{globalThis.fetch=oldFetch;}
});

test('callback refuses missing state before making any upstream request',async()=>{
  const oldFetch=globalThis.fetch;let count=0;
  globalThis.fetch=async()=>{count++;throw new Error('Unexpected network request');};
  try{
    const res=response();
    await callback({method:'GET',url:'/auth/instagram/callback?code=mock-code&state=wrong',headers:{cookie:''}},res);
    assert.equal(res.statusCode,400);
    assert.equal(count,0);
  }finally{globalThis.fetch=oldFetch;}
});

test('callback logs only safe Meta exchange diagnostics and keeps the browser error generic',async()=>{
  const state=oauthState(),lines=[];
  const oldFetch=globalThis.fetch,oldError=console.error;
  globalThis.fetch=async()=>new Response(JSON.stringify({error:{
    message:'must-not-be-logged mock-code mock-app-secret mock-access-token',
    type:'OAuthException',code:100,error_subcode:19001,
  }}),{status:400});
  console.error=(line)=>lines.push(String(line));
  try{
    const res=response();
    await callback({method:'GET',url:`/auth/instagram/callback?code=mock-code&state=${state.value}`,headers:{cookie:state.cookie}},res);
    assert.equal(res.statusCode,502);
    assert.deepEqual(JSON.parse(res.body),{error:'A Meta não aceitou o código de autorização.'});
    assert.equal(lines.length,1);
    const diagnostic=JSON.parse(lines[0]);
    assert.deepEqual(diagnostic,{
      event:'meta_unified_login_code_exchange_failed',
      httpStatus:400,
      errorCode:100,
      errorType:'OAuthException',
      errorSubcode:19001,
    });
    assert.doesNotMatch(lines[0],/mock-code|mock-app-secret|mock-access-token|message/);
  }finally{globalThis.fetch=oldFetch;console.error=oldError;}
});

test('callback supports a configuration whose SUAT has no expiration',async()=>{
  const state=oauthState(),writes=[];
  const oldFetch=globalThis.fetch;
  globalThis.fetch=async(input,init={})=>{
    const u=new URL(input);
    if(u.hostname==='graph.facebook.com'&&u.pathname.endsWith('/oauth/access_token'))return new Response(JSON.stringify({access_token:'mock-non-expiring-suat'}),{status:200});
    if(u.hostname==='graph.facebook.com'&&u.pathname.endsWith('/me/assigned_instagram_accounts'))return new Response(JSON.stringify({data:[{id:'17840001',username:'cainsennagamer'}]}),{status:200});
    if(u.hostname==='studio-supabase.invalid'){writes.push(JSON.parse(init.body));return new Response(JSON.stringify(writes),{status:201});}
    throw new Error(`Unexpected fetch target: ${u.origin}${u.pathname}`);
  };
  try{
    const res=response();
    await callback({method:'GET',url:`/auth/instagram/callback?code=mock-code&state=${state.value}`,headers:{cookie:state.cookie}},res);
    assert.equal(res.statusCode,302);
    assert.equal(writes.length,1);
    assert.equal(writes[0].expires_at,null);
    assert.equal(unseal(writes[0].encrypted_token).expiresAt,null);
  }finally{globalThis.fetch=oldFetch;}
});

test('account endpoint confirms stored Instagram ID and username against assigned accounts',async()=>{
  const encrypted=seal({provider:'instagram_unified_login',tokenType:'business_integration_system_user',businessIntegrationToken:'mock-suat',configId:process.env.IG_CONFIG_ID,instagramUserId:'17840001',username:'cainsennagamer'});
  const oldFetch=globalThis.fetch;let calls=0;
  globalThis.fetch=async(input)=>{
    const u=new URL(input);calls++;
    if(u.hostname==='studio-supabase.invalid')return new Response(JSON.stringify([{username:'cainsennagamer',encrypted_token:encrypted,expires_at:new Date(Date.now()+3600000).toISOString()}]),{status:200});
    if(u.hostname==='graph.facebook.com'&&u.pathname.endsWith('/me/assigned_instagram_accounts'))return new Response(JSON.stringify({data:[{id:'17840001',username:'cainsennagamer'}]}),{status:200});
    throw new Error(`Unexpected fetch target: ${u.origin}${u.pathname}`);
  };
  try{
    const res=response();
    await accountHandler({method:'GET'},res);
    assert.equal(res.statusCode,200);
    assert.deepEqual(JSON.parse(res.body),{connected:true,userId:'17840001',username:'cainsennagamer',expiresAt:JSON.parse(res.body).expiresAt});
    assert.equal(calls,2);
  }finally{globalThis.fetch=oldFetch;}
});
