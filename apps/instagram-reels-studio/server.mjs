import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const IG_APP_ID = process.env.IG_APP_ID || '1127709063315731';
const REDIRECT_URI = process.env.IG_REDIRECT_URI || `http://localhost:${PORT}/auth/instagram/callback`;
const IG_CONFIG_ID = process.env.IG_CONFIG_ID || '2055560198307756';
const GRAPH_VERSION = 'v27.0';
const MIME = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
const sessions = new Map();
const tokenFile=path.join(ROOT,'data','instagram-token.enc');
const key=()=>{const raw=Buffer.from(process.env.TOKEN_ENCRYPTION_KEY||'','base64');if(raw.length!==32)throw new Error('TOKEN_ENCRYPTION_KEY precisa ter 32 bytes em base64');return raw;};
const signState=v=>crypto.createHmac('sha256',process.env.OAUTH_STATE_SECRET||'').update(v).digest('hex');
async function saveToken(record){const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key(),iv);const enc=Buffer.concat([cipher.update(JSON.stringify(record)),cipher.final()]);await fs.writeFile(tokenFile,JSON.stringify({iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:enc.toString('base64')}),{mode:0o600});}
async function loadToken(){try{const box=JSON.parse(await fs.readFile(tokenFile,'utf8'));const d=crypto.createDecipheriv('aes-256-gcm',key(),Buffer.from(box.iv,'base64'));d.setAuthTag(Buffer.from(box.tag,'base64'));return JSON.parse(Buffer.concat([d.update(Buffer.from(box.data,'base64')),d.final()]).toString());}catch{return null;}}
async function exchangeLongToken(shortToken){const u=new URL(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`);u.searchParams.set('grant_type','fb_exchange_token');u.searchParams.set('client_id',IG_APP_ID);u.searchParams.set('client_secret',process.env.IG_APP_SECRET);u.searchParams.set('fb_exchange_token',shortToken);const r=await fetch(u);const data=await r.json();if(!r.ok||!data.access_token)throw new Error('Não foi possível trocar pelo token de longa duração');return data;}
async function graphGet(path,token){const r=await fetch(`https://graph.facebook.com/${GRAPH_VERSION}${path}`,{headers:{Authorization:`Bearer ${token}`}});const data=await r.json();return {ok:r.ok,data};}
const send = (res, status, body, headers={}) => { res.writeHead(status, {'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin',...headers}); res.end(body); };
const json = (res,status,obj,headers={}) => send(res,status,JSON.stringify(obj),{'Content-Type':'application/json; charset=utf-8',...headers});
const cookie = (res,name,value,extra='') => res.setHeader('Set-Cookie', `${name}=${value}; HttpOnly; SameSite=Lax; Path=/; ${extra}`);
const parseCookies = req => Object.fromEntries((req.headers.cookie||'').split(';').map(x=>x.trim().split('=')).filter(x=>x.length===2));
async function readQueue(){try{return JSON.parse(await fs.readFile(path.join(ROOT,'data','queue.json'),'utf8'));}catch{return [];}}
async function writeQueue(q){await fs.writeFile(path.join(ROOT,'data','queue.json'),JSON.stringify(q,null,2));}
const server = http.createServer(async (req,res)=>{
 try {
  const url = new URL(req.url, `http://${req.headers.host||'localhost'}`);
  if (url.pathname === '/api/status' && req.method==='GET') return json(res,200,{connected:Boolean(await loadToken()),appConfigured:Boolean(IG_APP_ID&&IG_CONFIG_ID&&process.env.IG_APP_SECRET&&process.env.IG_REDIRECT_URI),redirectUri:REDIRECT_URI,configId:IG_CONFIG_ID,loginFlow:'Facebook Login for Business'});
  if (url.pathname === '/auth/instagram' && req.method==='GET') {
   if(!IG_APP_ID||!IG_CONFIG_ID||!process.env.IG_APP_SECRET||!process.env.OAUTH_STATE_SECRET||!process.env.TOKEN_ENCRYPTION_KEY||!process.env.IG_REDIRECT_URI) return json(res,503,{error:'Configuração OAuth segura incompleta',required:['IG_APP_SECRET','IG_CONFIG_ID','OAUTH_STATE_SECRET','TOKEN_ENCRYPTION_KEY','IG_REDIRECT_URI']});
   const state=crypto.randomBytes(32).toString('hex'); cookie(res,'oauth_state',`${state}.${signState(state)}`,'Secure; Max-Age=600');
   const auth=new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`); auth.searchParams.set('client_id',IG_APP_ID); auth.searchParams.set('redirect_uri',REDIRECT_URI); auth.searchParams.set('config_id',IG_CONFIG_ID); auth.searchParams.set('response_type','code'); auth.searchParams.set('override_default_response_type','true'); auth.searchParams.set('state',state);
   res.writeHead(302,{Location:auth.toString(),'Cache-Control':'no-store'});return res.end();
  }
  if(url.pathname==='/auth/instagram/callback'&&req.method==='GET'){
   const params=url.searchParams; const stateCookie=parseCookies(req).oauth_state||'';const [expected,sig]=stateCookie.split('.');const expectedSig=expected?Buffer.from(signState(expected)):Buffer.alloc(0),providedSig=Buffer.from(sig||'');const valid=expected&&sig&&expectedSig.length===providedSig.length&&crypto.timingSafeEqual(expectedSig,providedSig)&&params.get('state')===expected;
   if(!valid) return send(res,400,'Falha ao validar estado OAuth. Reinicie a conexão pelo painel.');
   if(params.has('error')){cookie(res,'oauth_state','','Max-Age=0; Secure');return send(res,400,`Autorização recusada pela Meta (${params.get('error')}).`);}
   const code=params.get('code'); if(!code) return send(res,400,'A Meta não retornou um código de autorização.');
   const exchange=new URL(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`);exchange.searchParams.set('client_id',IG_APP_ID);exchange.searchParams.set('client_secret',process.env.IG_APP_SECRET);exchange.searchParams.set('redirect_uri',REDIRECT_URI);exchange.searchParams.set('code',code);const tokenRes=await fetch(exchange);const token=await tokenRes.json();
   if(!tokenRes.ok||!token.access_token) return json(res,502,{error:'A Meta não aceitou o código de autorização.'});
   const longToken=await exchangeLongToken(token.access_token);const pages=await graphGet('/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}',longToken.access_token);
   if(!pages.ok)return json(res,502,{error:'Não foi possível consultar Páginas e contas profissionais autorizadas na Meta.'});const linked=(pages.data.data||[]).filter(p=>p.instagram_business_account?.id&&p.instagram_business_account?.username);if(linked.length!==1)return json(res,409,{error:linked.length?'Mais de uma conta profissional encontrada; nenhuma foi conectada.':'Nenhuma conta profissional vinculada a uma Página autorizada foi encontrada.'});
   const page=linked[0],ig=page.instagram_business_account,expiresAt=Date.now()+Number(longToken.expires_in||0)*1000;if(expiresAt<=Date.now())return json(res,502,{error:'A Meta não informou uma validade de token aceitável.'});await saveToken({facebookUserToken:longToken.access_token,pageAccessToken:page.access_token,pageId:String(page.id),instagramUserId:String(ig.id),userId:String(ig.id),username:ig.username,expiresAt,connectedAt:Date.now()});cookie(res,'oauth_state','','Max-Age=0; Secure'); res.writeHead(302,{Location:'/?connected=1','Cache-Control':'no-store'});return res.end();
  }
  if(url.pathname==='/api/account'&&req.method==='GET') { const s=await loadToken(); return json(res,200,s?{connected:true,username:s.username,userId:s.userId,expiresAt:s.expiresAt}:{connected:false}); }
  if(url.pathname==='/api/account/test'&&req.method==='POST'){const s=await loadToken();if(!s)return json(res,401,{connected:false,error:'Instagram desconectado'});if(Date.parse(s.expiresAt)<=Date.now())return json(res,401,{connected:false,error:'Token expirado; reconecte a conta.'});const r=await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(s.instagramUserId)}?fields=id,username`,{headers:{Authorization:`Bearer ${s.pageAccessToken}`}});const data=await r.json();if(!r.ok){return json(res,502,{connected:false,error:'A Meta não validou o token. Reconecte a conta.'});}return json(res,200,{connected:true,userId:String(data.id),username:data.username,expiresAt:s.expiresAt});}
  if(url.pathname==='/auth/logout'&&req.method==='POST'){await fs.rm(tokenFile,{force:true});return json(res,200,{connected:false});}
  if(url.pathname==='/api/queue'&&req.method==='GET')return json(res,200,await readQueue());
  if(url.pathname==='/api/queue'&&req.method==='POST'){
   const chunks=[];for await(const c of req)chunks.push(c);const item=JSON.parse(Buffer.concat(chunks).toString());
   if(!item.caption||!item.series) return json(res,400,{error:'Informe série e legenda.'});
   const q=await readQueue();const id=crypto.randomUUID();const saved={id,...item,status:item.status||'Rascunho',createdAt:new Date().toISOString()};q.unshift(saved);await writeQueue(q);return json(res,201,saved);
  }
  if(url.pathname.startsWith('/api/queue/')&&req.method==='PATCH'){
   const id=url.pathname.split('/').pop();const chunks=[];for await(const c of req)chunks.push(c);const patch=JSON.parse(Buffer.concat(chunks).toString());const q=await readQueue();const i=q.findIndex(x=>x.id===id);if(i<0)return json(res,404,{error:'Item não encontrado'});q[i]={...q[i],...patch};await writeQueue(q);return json(res,200,q[i]);
  }
  if(url.pathname==='/api/upload'&&req.method==='POST'){
   const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>180*1024*1024)return json(res,413,{error:'Vídeo excede o limite local de 180 MB.'});chunks.push(c);}
   const payload=JSON.parse(Buffer.concat(chunks).toString());const raw=Buffer.from(payload.base64||'','base64');
   if(raw.length<12||raw.subarray(4,8).toString()!=='ftyp')return json(res,400,{error:'Arquivo inválido: envie um MP4 válido.'});
   const id=crypto.randomUUID();const name=`${id}.mp4`;await fs.writeFile(path.join(ROOT,'uploads',name),raw);
   return json(res,201,{id,name,url:`/uploads/${name}`,bytes:raw.length});
  }
  if(url.pathname.startsWith('/uploads/')){const name=path.basename(url.pathname);if(!/^[a-f0-9-]+\.mp4$/.test(name))return send(res,400,'Arquivo inválido');const bytes=await fs.readFile(path.join(ROOT,'uploads',name));return send(res,200,bytes,{'Content-Type':'video/mp4','Content-Disposition':'inline'});}
  const rel=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1));const file=path.resolve(ROOT,'public',rel);if(!file.startsWith(path.resolve(ROOT,'public')+path.sep))return send(res,403,'Forbidden');
  const content=await fs.readFile(file);return send(res,200,content,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream'});
 }catch(e){console.error('Request failed:',e.message);return json(res,500,{error:'Erro interno'});}
});
server.listen(PORT,()=>console.log(`Reels Studio: http://localhost:${PORT}`));
