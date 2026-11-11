const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync(require.resolve('../core/cloud-save-v23.js'),'utf8');
const SESSION_KEY='psyworld_online_session_v23';
const INTENT_KEY='psyworld_oauth_intent_v1';
const STORAGE_KEY='psyworld_supabase_oauth_flow_v1';
const EXIT_KEY='psyworld_local_profile_signed_out_v36';

function boot({search='',session=null,exchangeSession=null,signinError=null,exchangeError=null}={}){
 const values=new Map(),calls={clients:[],signin:[],link:[],setSession:[],exchange:[],signout:[]},nodes=new Map();
 const localStorage={getItem:k=>values.has(k)?values.get(k):null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k),key:i=>[...values.keys()][i]||null,get length(){return values.size}};
 if(session)localStorage.setItem(SESSION_KEY,JSON.stringify(session));
 const node=(id,value='')=>({id,value,textContent:'',innerHTML:'',dataset:{},style:{display:'',color:'',cssText:''},disabled:false,onclick:null,appendChild(){},setAttribute(){},querySelectorAll(){return[]},set innerHTML(v){this._html=String(v)},get innerHTML(){return this._html||''}});
 for(const id of ['psy-online-email','psy-online-pass','psy-online-signup','psy-online-resend','psy-online-status','psy-online-google','psy-online-github','psy-online-identities'])nodes.set(id,node(id));
 const location={origin:'https://psyworld-preview-world-of-monsters.vercel.app',pathname:'/',search,hash:''};
 Object.defineProperty(location,'href',{get(){return location.origin+location.pathname+location.search+location.hash}});
 const history={replaceState(_a,_b,path){const u=new URL(path,location.origin);location.pathname=u.pathname;location.search=u.search;location.hash=u.hash}};
 const document={readyState:'loading',title:'PSYWORLD',body:node('body'),head:node('head'),getElementById:id=>nodes.get(id)||null,createElement:()=>node('created'),addEventListener(){},querySelector(){return null},querySelectorAll(){return[]}};
 const auth={
  setSession:async value=>{calls.setSession.push(value);return{data:{session:value},error:null}},
  signInWithOAuth:async value=>{calls.signin.push(value);return{data:{url:'https://supabase.test/authorize'},error:signinError}},
  linkIdentity:async value=>{calls.link.push(value);return{data:{url:'https://supabase.test/authorize'},error:null}},
  exchangeCodeForSession:async code=>{calls.exchange.push(code);return{data:{session:exchangeSession||{access_token:'new-access',refresh_token:'new-refresh',expires_in:3600,user:{id:'user-1',email:'player@example.test'}}},error:exchangeError}},
  getUserIdentities:async()=>({data:{identities:[{provider:'github'}]},error:null}),
  signOut:async options=>{calls.signout.push(options);return{error:null}}
 };
 const window={localStorage,location,history,addEventListener(){},dispatchEvent(){},P:null,supabase:{createClient:(url,key,options)=>{calls.clients.push({url,key,options});return{auth}}}};
 const fetch=async(url)=>({ok:true,json:async()=>({onlineConfigured:true,supabaseUrl:'https://supabase.test',supabaseAnonKey:'public-key'})});
 const context={window,document,location,history,localStorage,fetch,CustomEvent:class{},console:{log(){},warn(){},error(){}},URL,URLSearchParams,Date,Promise,JSON,Number,String,Boolean,Math,Buffer,setTimeout(){return 1},clearTimeout(){},setInterval(){return 1},clearInterval(){},navigator:{onLine:true},atob:v=>Buffer.from(v,'base64').toString('binary')};
 vm.runInNewContext(source,context,{filename:'core/cloud-save-v23.js'});
 return{window,nodes,calls,values,location};
}

(async()=>{
 const github=boot();
 await github.window.psyCloudV23.loginWithGithub();
 assert.equal(github.calls.signin.length,1,'signed-out GitHub uses Supabase social sign-in');
 assert.equal(github.calls.signin[0].provider,'github');
 assert.equal(github.calls.signin[0].options.redirectTo,'https://psyworld-preview-world-of-monsters.vercel.app/','OAuth returns to the current authorized origin');
 assert.equal(github.calls.clients[0].options.auth.flowType,'pkce','OAuth uses PKCE');
 assert.equal(github.calls.clients[0].options.auth.persistSession,true,'PKCE verifier persists across full-page redirects');
 assert.equal(github.calls.clients[0].options.auth.detectSessionInUrl,false,'callback is consumed explicitly before the app session changes');
 assert.equal(JSON.parse(github.values.get(INTENT_KEY)).mode,'login');

 const google=boot();
 await google.window.psyCloudV23.loginWithGoogle();
 assert.equal(google.calls.signin[0].provider,'google','Google OAuth is implemented with the same session-safe flow');
 assert.equal(google.calls.signin[0].options.scopes,'openid','Google explicitly adds OIDC openid; Supabase supplies email/profile defaults');

 const existing={access_token:'old-access',refresh_token:'old-refresh',expires_at:Date.now()+3600_000,user:{id:'account-7',email:'player@example.test'}};
 const link=boot({session:existing});
 await link.window.psyCloudV23.loginWithGithub();
 assert.equal(link.calls.signin.length,0,'an authenticated user is never silently switched by provider login');
 assert.equal(link.calls.link.length,1,'authenticated GitHub action explicitly links an identity');
 assert.equal(link.calls.link[0].provider,'github');
 assert.equal(link.calls.setSession[0].access_token,'old-access');
 assert.equal(link.calls.setSession[0].refresh_token,'old-refresh');
 assert.equal(JSON.parse(link.values.get(INTENT_KEY)).mode,'link');
 assert.equal(JSON.parse(link.values.get(INTENT_KEY)).userId,'account-7');

 const expired=boot({session:{access_token:'expired-access',refresh_token:'expired-refresh',expires_at:Date.now()-1000,user:{id:'account-7'}}});
 await expired.window.psyCloudV23.loginWithGithub();
 assert.equal(expired.calls.signin.length,0,'an expired account session does not silently turn a requested link into a different login');
 assert.equal(expired.calls.link.length,0);
 assert.match(expired.nodes.get('psy-online-status').textContent,/sessão expirou/i);

 const callback=boot({search:'?code=one-time-code'});
 callback.values.set(INTENT_KEY,JSON.stringify({provider:'github',mode:'login',startedAt:Date.now()}));
 assert.equal(await callback.window.psyCloudV23.completeOAuthCallback(),true,'PKCE callback exchanges its one-time code');
 assert.equal(callback.calls.exchange[0],'one-time-code');
 assert.equal(JSON.parse(callback.values.get(SESSION_KEY)).user.id,'user-1','callback session is persisted for cloud save');
 assert.equal(callback.values.get(EXIT_KEY),'1','a new OAuth login keeps an unrelated local profile out of startup while its account save is resolved');
 assert.equal(callback.location.search,'','authorization code is removed from the address bar');
 assert.equal(callback.values.has(INTENT_KEY),false,'OAuth intent is cleared after successful exchange');
 assert.equal(callback.calls.signout.length,0,'successful OAuth cleanup never calls Supabase logout or revokes the new refresh token');
 assert.equal(callback.values.has(STORAGE_KEY),false,'temporary SDK session storage is cleared locally after adopting the game session');

 const denied=boot({signinError:{code:'unsupported_provider',message:'provider is disabled; client_secret=must-not-render'}});
 await denied.window.psyCloudV23.loginWithGoogle();
 assert.match(denied.nodes.get('psy-online-status').textContent,/OAUTH_PROVIDER_DISABLED/,'start failure exposes a stable diagnostic code');
 assert.doesNotMatch(denied.nodes.get('psy-online-status').textContent,/client_secret|must-not-render/i,'diagnostic never exposes raw provider errors or secrets');

 const badCallback=boot({search:'?code=expired-code',exchangeError:{code:'invalid_grant',message:'code_verifier mismatch'}});
 badCallback.values.set(INTENT_KEY,JSON.stringify({provider:'google',mode:'login',startedAt:Date.now()}));
 assert.equal(await badCallback.window.psyCloudV23.completeOAuthCallback(),false);
 assert.match(badCallback.nodes.get('psy-online-status').textContent,/OAUTH_PKCE_FAILED/,'callback exchange failure has a safe diagnostic');
 assert.doesNotMatch(badCallback.nodes.get('psy-online-status').textContent,/expired-code|verifier mismatch/i,'callback diagnostic omits authorization codes and raw verifier details');

 const mismatch=boot({session:existing,search:'?code=linked-code',exchangeSession:{access_token:'other-access',refresh_token:'other-refresh',user:{id:'another-account'}}});
 mismatch.values.set(INTENT_KEY,JSON.stringify({provider:'github',mode:'link',userId:'account-7',startedAt:Date.now()}));
 assert.equal(await mismatch.window.psyCloudV23.completeOAuthCallback(),false,'identity-link callback cannot replace the existing account');
 assert.equal(JSON.parse(mismatch.values.get(SESSION_KEY)).user.id,'account-7','mismatched callback preserves the prior session');
 assert.equal(mismatch.values.has(EXIT_KEY),false,'a rejected identity link does not change local profile state');
 assert.match(mismatch.nodes.get('psy-online-status').textContent,/sessão anterior foi preservada/i);

 const canceled=boot({session:existing,search:'?error=access_denied'});
 canceled.values.set(INTENT_KEY,JSON.stringify({provider:'google',mode:'link',userId:'account-7',startedAt:Date.now()}));
 assert.equal(await canceled.window.psyCloudV23.completeOAuthCallback(),false,'provider cancellation does not authenticate');
 assert.equal(JSON.parse(canceled.values.get(SESSION_KEY)).user.id,'account-7','provider cancellation leaves the existing account intact');
 assert.match(canceled.nodes.get('psy-online-status').textContent,/Login cancelado/i);
 assert.equal(canceled.nodes.get('psy-online-status').dataset.psyOauthDiagnostic,'1','callback diagnostic is marked so profile bootstrap cannot overwrite it');
 assert.equal(canceled.location.search,'','provider error parameters are removed from the address bar');

 console.log('PASS: Google/GitHub OAuth start, PKCE persistence, same-origin callback, explicit authenticated identity linking, session preservation, cancellation, and callback cleanup');
})().catch(e=>{console.error(e);process.exitCode=1});
